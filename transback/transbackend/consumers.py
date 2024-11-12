import json
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import GameRoom, Game
from django.contrib.auth import get_user_model

User = get_user_model()

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Retrieve the game room from the URL route (e.g., ws/game/1/)
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        
        # Check if the game room exists and has capacity
        try:
            self.game_room = await self.get_game_room(self.room_id)
            self.room_group_name = f"game_{self.room_id}"
            
            # Add the player to the room group if there is capacity
            if await self.add_player_to_game(self.game_room):
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
                await self.accept()
            else:
                # Reject the connection if the room is full
                await self.close(code=403)
        except GameRoom.DoesNotExist:
            await self.close(code=404)

    async def disconnect(self, close_code):
        # Remove player from room on disconnect
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
        await self.remove_player_from_game(self.scope["user"], self.game_room)

    async def receive(self, text_data):
        # Receive message from WebSocket
        data = json.loads(text_data)
        action = data.get("action")
        message = data.get("message")

        # Broadcast the action to all players in the room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "game_action",
                "action": action,
                "message": message,
                "username": self.scope["user"].username,
            }
        )

    async def game_action(self, event):
        # Handle broadcasted action from room group
        await self.send(text_data=json.dumps({
            "action": event["action"],
            "message": event["message"],
            "username": event["username"],
        }))

    @staticmethod
    async def get_game_room(room_id):
        # Fetch the GameRoom from the database
        return await GameRoom.objects.get(id=room_id)

    async def add_player_to_game(self, game_room):
        # Check room capacity and add player if possible
        if Game.objects.filter(room=game_room).count() < game_room.capacity:
            await Game.objects.create(room=game_room, user=self.scope["user"])
            return True
        return False

    async def remove_player_from_game(self, user, game_room):
        # Remove player from game on disconnect
        await Game.objects.filter(room=game_room, user=user).delete()
