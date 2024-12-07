from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
import json
import asyncio
import random
from channels.db import database_sync_to_async
from django.conf import settings
import jwt
from urllib.parse import parse_qs
from django.utils.timezone import now
from django.utils.translation import gettext as _

async def get_user_from_token(query_string: str):
    token = parse_qs(query_string).get('token', [None])[0]
    
    if not token:
        return None
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get('user_id')
        
        if not user_id:
            return None
        
        User = get_user_model()
        user = await database_sync_to_async(User.objects.get)(id=user_id)
        return user

    except (jwt.ExpiredSignatureError, jwt.DecodeError, jwt.InvalidTokenError):
        return None


class PongConsumer(AsyncWebsocketConsumer):
    rooms = {}

    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        self.room_group_name = f"game_room_{self.room_id}"
        
        if self.room_id not in self.rooms:
            self.rooms[self.room_id] = {
                "players": 0,
                "game_state": {
                    "ball": {"x": 50, "y": 50, "dx": random.choice([-1, 1]) * 2, "dy": random.choice([-1, 1]) * 2},
                    "paddle1": {"y": 50},
                    "paddle2": {"y": 50},
                    "score": {"player1": 0, "player2": 0},
                    "player1_name": None,
                    "player2_name": None,
                    "winner": None
                }
            }
            MatchmakingConsumer.mark_room_as_in_game(self.room_id)

        query_string = self.scope.get('query_string', b'').decode('utf-8')
        self.user = await get_user_from_token(query_string)

        if not self.user:
            await self.close()
            return

        if self.rooms[self.room_id]["players"] >= 2:
            await self.close()
            return

        self.rooms[self.room_id]["players"] += 1
        self.player_number = self.rooms[self.room_id]["players"]
        if self.player_number == 1:
            self.rooms[self.room_id]["game_state"]["player1_name"] = self.user.username
        elif self.player_number == 2:
            self.rooms[self.room_id]["game_state"]["player2_name"] = self.user.username

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name,
        )
        await self.accept()
  
        if self.rooms[self.room_id]["players"] == 1:
            await self.send(text_data=json.dumps({"status": "waiting", "message": _("Waiting for other player...")}))
        elif self.rooms[self.room_id]["players"] == 2:
            await self.channel_layer.group_send(
                self.room_group_name,
                {"type": "game_start", "message": _("Game starting!")},
            )
            asyncio.create_task(self.start_game())

    async def disconnect(self, close_code):
        if hasattr(self, 'player_number') and self.player_number in [1, 2]:
            if self.room_id in self.rooms:
                self.rooms[self.room_id]["players"] -= 1

                if (self.rooms[self.room_id]["players"] == 0 and 
                    self.rooms[self.room_id]["game_state"].get("winner")):
                    
                    game_state = self.rooms[self.room_id]["game_state"]
                    
                    if game_state.get("winner"):
                        player1_name = game_state.get("player1_name")
                        player2_name = game_state.get("player2_name")
                        player1_score = game_state["score"]["player1"]
                        player2_score = game_state["score"]["player2"]

                        try:
                            from transbackend.models import Game
                            User = get_user_model()
                            
                            player1_user = await database_sync_to_async(User.objects.get)(username=player1_name)
                            player2_user = await database_sync_to_async(User.objects.get)(username=player2_name)

                            await database_sync_to_async(Game.objects.create)(
                                player1=player1_user,
                                player2=player2_user,
                                player1_score=player1_score,
                                player2_score=player2_score,
                                end_time=now()
                            )
                                
                        except Exception as e:
                            pass

                        MatchmakingConsumer.mark_room_as_finished(self.room_id)
                        if self.room_id in self.rooms:
                            del self.rooms[self.room_id]

                await self.channel_layer.group_discard(
                    self.room_group_name,
                    self.channel_name,
                )

    async def receive(self, text_data):
        data = json.loads(text_data)
        paddle_movement = data.get("paddle_movement", 0)

        if self.player_number == 1:
            self.rooms[self.room_id]["game_state"]["paddle1"]["y"] += paddle_movement
        elif self.player_number == 2:
            self.rooms[self.room_id]["game_state"]["paddle2"]["y"] += paddle_movement

        self.rooms[self.room_id]["game_state"]["paddle1"]["y"] = max(0, min(100, self.rooms[self.room_id]["game_state"]["paddle1"]["y"]))
        self.rooms[self.room_id]["game_state"]["paddle2"]["y"] = max(0, min(100, self.rooms[self.room_id]["game_state"]["paddle2"]["y"]))

    async def start_game(self):
        try:
            while (self.room_id in self.rooms and 
                   self.rooms[self.room_id]["players"] == 2):
                if self.rooms[self.room_id]["game_state"]["winner"]:
                    winner = self.rooms[self.room_id]["game_state"]["winner"]
                    
                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {
                            "type": "game_end",
                            "message": _("{winner} won!").format(winner=winner)
                        }
                    )

                    await self.channel_layer.group_send(
                        self.room_group_name,
                        {"type": "disconnect_all"}
                    )
                    break

                self.update_game_state()
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        "type": "update_game",
                        "game_state": self.rooms[self.room_id]["game_state"],
                    },
                )
                await asyncio.sleep(0.03)
        except Exception as e:
            await self.close()

    async def disconnect_all(self, event):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
        await self.close()

    def update_game_state(self):
        ball = self.rooms[self.room_id]["game_state"]["ball"]
        
        ball["x"] += ball["dx"]
        ball["y"] += ball["dy"]

        if ball["y"] <= 0 or ball["y"] >= 100:
            ball["dy"] *= -1

        if ball["x"] <= 5:
            paddle1_y = self.rooms[self.room_id]["game_state"]["paddle1"]["y"]
            if paddle1_y - 15 <= ball["y"] <= paddle1_y + 15:
                offset = ball["y"] - paddle1_y
                ball["dx"] = abs(ball["dx"])
                ball["dy"] = offset / 5
        elif ball["x"] >= 95:
            paddle2_y = self.rooms[self.room_id]["game_state"]["paddle2"]["y"]
            if paddle2_y - 15 <= ball["y"] <= paddle2_y + 15:
                offset = ball["y"] - paddle2_y
                ball["dx"] = -abs(ball["dx"])
                ball["dy"] = offset / 5

        if ball["x"] <= 0:
            self.rooms[self.room_id]["game_state"]["score"]["player2"] += 1
            self.reset_ball()
        elif ball["x"] >= 100:
            self.rooms[self.room_id]["game_state"]["score"]["player1"] += 1
            self.reset_ball()

        score = self.rooms[self.room_id]["game_state"]["score"]
        
        if score["player1"] >= 10:
            winner = self.rooms[self.room_id]["game_state"]["player1_name"]
            self.rooms[self.room_id]["game_state"]["winner"] = winner
        elif score["player2"] >= 10:
            winner = self.rooms[self.room_id]["game_state"]["player2_name"]
            self.rooms[self.room_id]["game_state"]["winner"] = winner

    def reset_ball(self):
        self.rooms[self.room_id]["game_state"]["ball"] = {
            "x": 50,
            "y": random.uniform(30, 70),
            "dx": random.choice([-1, 1]) * 2,
            "dy": random.uniform(-1, 1)
        }

    async def update_game(self, event):
        game_state = event["game_state"]
        await self.send(text_data=json.dumps(game_state))


    async def game_start(self, event):
        await self.send(text_data=json.dumps({"status": "start", "message": event["message"]}))

    async def game_end(self, event):
        await self.send(text_data=json.dumps({"status": "end", "message": event["message"]}))
        

class OnlineStatusConsumer(AsyncWebsocketConsumer):
    connected_users = set()

    async def connect(self):
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        self.user = await get_user_from_token(query_string)
        if self.user.is_authenticated:
            OnlineStatusConsumer.connected_users.add(self.user.username)
            await self.channel_layer.group_add("online_users", self.channel_name)
            await self.accept()

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            OnlineStatusConsumer.connected_users.discard(self.user.username)
            await self.channel_layer.group_discard("online_users", self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data.get("type") == "check_online":
            username = data.get("username")
            is_online = username in OnlineStatusConsumer.connected_users
            await self.send(text_data=json.dumps({
                "type": "online_status",
                "username": username,
                "is_online": is_online
            }))

class MatchmakingConsumer(AsyncWebsocketConsumer):
    waiting_players = []
    active_rooms = {}
    player_states = {}
    next_room_id = 1
    in_game_rooms = set()

    async def connect(self):
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        self.user = await get_user_from_token(query_string)
        
        if not self.user:
            await self.close()
            return

        await self.accept()
        self.player_id = self.user.username
        
        self.player_states[self.player_id] = {
            'channel_name': self.channel_name,
            'in_game': False,
            'room_id': None
        }

    async def disconnect(self, close_code):
        if self.player_id in self.player_states:
            room_id = self.player_states[self.player_id]['room_id']
            
            if room_id and room_id in self.active_rooms and room_id not in self.in_game_rooms:
                for player in self.active_rooms[room_id]:
                    if player in self.player_states:
                        self.player_states[player]['in_game'] = False
                        self.player_states[player]['room_id'] = None
                del self.active_rooms[room_id]
            
            if self.player_id in self.waiting_players:
                self.waiting_players.remove(self.player_id)
            
            del self.player_states[self.player_id]

    async def receive(self, text_data):
        data = json.loads(text_data)
        if data.get('action') == 'join_game':
            for room_id in self.in_game_rooms:
                if room_id in PongConsumer.rooms:
                    game_state = PongConsumer.rooms[room_id]["game_state"]
                    if (self.player_id == game_state["player1_name"] or 
                        self.player_id == game_state["player2_name"]):
                        await self.send(text_data=json.dumps({
                            "message": _("Reconnecting to active game..."),
                            "room_id": room_id
                        }))
                        return

            if self.player_id in self.waiting_players:
                self.waiting_players.remove(self.player_id)
            await self.join_game()

    async def join_game(self):
        if self.player_id in self.waiting_players:
            return

        self.waiting_players.append(self.player_id)
        
        if len(self.waiting_players) >= 2:
            player1_id = self.waiting_players.pop(0)
            player2_id = self.waiting_players.pop(0)
            
            while str(self.next_room_id) in self.in_game_rooms:
                self.next_room_id += 1
            
            room_id = str(self.next_room_id)
            self.active_rooms[room_id] = [player1_id, player2_id]
            
            for player_id in [player1_id, player2_id]:
                if player_id in self.player_states:
                    self.player_states[player_id]['in_game'] = True
                    self.player_states[player_id]['room_id'] = room_id
                    
                    await self.channel_layer.send(
                        self.player_states[player_id]['channel_name'],
                        {
                            "type": "game.start",
                            "room_id": room_id,
                            "message": _("Match found!")
                        }
                    )

    async def game_start(self, event):
        await self.send(text_data=json.dumps({
            "message": event['message'],
            "room_id": event['room_id']
        }))

    @classmethod
    def mark_room_as_in_game(cls, room_id):
        cls.in_game_rooms.add(room_id)
        if int(room_id) >= cls.next_room_id:
            cls.next_room_id = int(room_id) + 1

    @classmethod
    def mark_room_as_finished(cls, room_id):
        if room_id in cls.in_game_rooms:
            cls.in_game_rooms.remove(room_id)
        
        if room_id in cls.active_rooms:
            players = cls.active_rooms[room_id]
            del cls.active_rooms[room_id]
            for player_id in players:
                if player_id in cls.player_states:
                    cls.player_states[player_id]['in_game'] = False
                    cls.player_states[player_id]['room_id'] = None