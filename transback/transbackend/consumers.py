import json
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from channels.db import database_sync_to_async
from .models import GameRoom, Game
from django.contrib.auth.models import AnonymousUser

class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']

        token = self.scope['query_string'].decode().split('=')[1]
        
        self.user = await self.get_user_from_token(token)

        if self.user:
            self.room_name = f"game_{self.room_id}"
            await self.channel_layer.group_add(
                self.room_name,
                self.channel_name
            )
            await self.accept()

    async def disconnect(self, close_code):
        if self.user:
            await self.channel_layer.group_discard(
                self.room_name,
                self.channel_name
            )

    async def receive(self, text_data):
        # Gelen mesajı işle
        data = json.loads(text_data)
        message = data.get('message')

        if message:
            # Odaya gelen mesajı tüm kullanıcılara ilet
            await self.channel_layer.group_send(
                self.room_name,
                {
                    'type': 'game_message',
                    'message': message,
                    'username': self.user.username
                }
            )

    async def game_message(self, event):
        # Odaya gönderilen mesajı al ve kullanıcıya ilet
        message = event['message']
        username = event['username']

        # Mesajı WebSocket üzerinden gönder
        await self.send(text_data=json.dumps({
            'message': message,
            'username': username
        }))

    async def get_user_from_token(self, token):
        try:

            access_token = AccessToken(token)
            user_id = access_token['user_id']
            user = await database_sync_to_async(get_user_model().objects.get)(id=user_id)
            return user
        except Exception as e:
            print(f"Error getting user from token: {e}")
            return None

    async def handle_move(self, data):
        # Handle the player's move and update the game state accordingly
        player = await database_sync_to_async(self.get_player)(data['player_id'])
        if player:
            game = await database_sync_to_async(self.get_game)(player)
            await self.broadcast_game_state(game)

    async def send_ping_response(self):
        # Respond to a ping from the client to keep the connection alive
        await self.send(text_data=json.dumps({
            'action': 'ping_response'
        }))

    async def broadcast_game_state(self, game):
        # Broadcast the updated game state to all connected users in the room
        await self.channel_layer.group_send(
            self.room_name,
            {
                'type': 'send_game_state',
                'game_state': self.get_game_state(game)
            }
        )

    def get_game_state(self, game):
        # Return the game state (e.g., player positions, scores)
        return {
            'game_id': game.id,
            'score': game.score,
            'player': game.user.username,
            'room_id': game.room.id,
        }

    async def send_game_state(self, game_room):
        # Send the current game state when a user joins the room
        game = await database_sync_to_async(self.get_game)(game_room)
        if game:
            await self.send(text_data=json.dumps({
                'game_state': self.get_game_state(game)
            }))
    
    @database_sync_to_async
    def get_user(self, user_id):
        # Get the user from the database using the user_id
        try:
            return get_user_model().objects.get(id=user_id)
        except get_user_model().DoesNotExist:
            return None

    @database_sync_to_async
    def get_game_room(self, room_id):
        try:
            return GameRoom.objects.get(id=room_id)
        except GameRoom.DoesNotExist:
            return None

    def is_room_open(self, game_room):
        # Check if there is space in the room (capacity is not exceeded)
        current_players = game_room.game_set.count()
        return current_players < game_room.capacity
