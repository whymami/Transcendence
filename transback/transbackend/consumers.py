
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth import get_user_model
from asgiref.sync import sync_to_async
import json
import asyncio
import random
from channels.db import database_sync_to_async
from django.conf import settings
import jwt
from urllib.parse import parse_qs
from django.utils.timezone import now

async def get_user_from_token(query_string: str):
    """
    Token'ı query_string'den alır, doğrular ve kullanıcıyı döner.
    """
    # Token'ı query string'den al
    token = parse_qs(query_string).get('token', [None])[0]
    
    if not token:
        return None
    
    try:
        # Token'ı decode et ve payload'ı al
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get('user_id')
        
        if not user_id:
            return None
        
        # Kullanıcıyı veritabanından al
        User = get_user_model()
        user = await database_sync_to_async(User.objects.get)(id=user_id)
        return user

    except (jwt.ExpiredSignatureError, jwt.DecodeError, jwt.InvalidTokenError):
        return None

class PongConsumer(AsyncWebsocketConsumer):
    players = 0
    game_state = {
        "ball": {"x": 50, "y": 50, "dx": random.choice([-1, 1]) * 2, "dy": random.choice([-1, 1]) * 2},
        "paddle1": {"y": 50},
        "paddle2": {"y": 50},
        "score": {"player1": 0, "player2": 0},
    }

    async def connect(self):
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        self.user = await get_user_from_token(query_string)
        print(self.user)
    
        if not self.user:
            # Reject the connection if user is not authenticated
            await self.close()
            return

        if PongConsumer.players < 2:
            PongConsumer.players += 1
            self.player_number = PongConsumer.players
            if self.player_number == 1:
                PongConsumer.game_state["player1_name"] = self.user.username  # Set player1's name
            elif self.player_number == 2:
                PongConsumer.game_state["player2_name"] = self.user.username  # Set player2's name
        else:
            self.player_number = 0  # Spectator

        await self.channel_layer.group_add(
            "game_room",
            self.channel_name,
        )
        await self.accept()

        # Bağlanma mesajını gönder
        if self.player_number == 0:
            await self.send(text_data=json.dumps({"status": "spectator", "message": "Oyunu izliyorsunuz."}))
        elif PongConsumer.players == 1:
            await self.send(text_data=json.dumps({"status": "waiting", "message": "Diğer oyuncu bekleniyor..."}))
        elif PongConsumer.players == 2:
            # Start the game when two players are connected
            await self.channel_layer.group_send(
                "game_room",
                {"type": "game_start", "message": "Oyun başlıyor!"},
            )
            asyncio.create_task(self.start_game())
    
    async def disconnect(self, close_code):
        # Ensure player_number is set before accessing it
        if hasattr(self, 'player_number') and self.player_number in [1, 2]:
            PongConsumer.players -= 1

            if PongConsumer.players == 0:  # When one of the players leaves
                player1_score = PongConsumer.game_state["score"]["player1"]
                player2_score = PongConsumer.game_state["score"]["player2"]

                # Save game result for both players based on their `user.id`
                from .models import Game
                Game.objects.create(
                    player1=self.user,  # Assuming `self.user` corresponds to player1
                    player2=self.user,  # Same for player2, you would assign actual second player
                    player1_score=player1_score,
                    player2_score=player2_score,
                    end_time=now()
                )

        await self.channel_layer.group_discard(
            "game_room",
            self.channel_name,
        )
    
    async def receive(self, text_data):
        if self.player_number == 0:
            return  # İzleyicilerden veri almayız

        data = json.loads(text_data)
        paddle_movement = data.get("paddle_movement", 0)

        if self.player_number == 1:
            PongConsumer.game_state["paddle1"]["y"] += paddle_movement
        elif self.player_number == 2:
            PongConsumer.game_state["paddle2"]["y"] += paddle_movement

        PongConsumer.game_state["paddle1"]["y"] = max(0, min(100, PongConsumer.game_state["paddle1"]["y"]))
        PongConsumer.game_state["paddle2"]["y"] = max(0, min(100, PongConsumer.game_state["paddle2"]["y"]))

    async def start_game(self):
        while PongConsumer.players == 2:
            self.update_game_state()
            await self.channel_layer.group_send(
                "game_room",
                {
                    "type": "update_game",
                    "game_state": PongConsumer.game_state,
                },
            )
            await asyncio.sleep(0.03)  # 30 FPS

    def update_game_state(self):
        ball = PongConsumer.game_state["ball"]
        ball["x"] += ball["dx"]
        ball["y"] += ball["dy"]

        if ball["y"] <= 0 or ball["y"] >= 100:
            ball["dy"] *= -1

        if ball["x"] <= 5 and PongConsumer.game_state["paddle1"]["y"] - 10 <= ball["y"] <= PongConsumer.game_state["paddle1"]["y"] + 10:
            ball["dx"] *= -1
        elif ball["x"] >= 95 and PongConsumer.game_state["paddle2"]["y"] - 10 <= ball["y"] <= PongConsumer.game_state["paddle2"]["y"] + 10:
            ball["dx"] *= -1

        if ball["x"] <= 0:
            PongConsumer.game_state["score"]["player2"] += 1
            self.reset_ball()
        elif ball["x"] >= 100:
            PongConsumer.game_state["score"]["player1"] += 1
            self.reset_ball()

    def reset_ball(self):
        PongConsumer.game_state["ball"] = {
            "x": 50,
            "y": 50,
            "dx": random.choice([-1, 1]) * 2,
            "dy": random.choice([-1, 1]) * 2,
        }

    async def update_game(self, event):
        game_state = event["game_state"]
        await self.send(text_data=json.dumps({
        "player1_name": game_state["player1_name"],
        "player2_name": game_state["player2_name"],
        "score": game_state["score"]
        }))

    async def game_start(self, event):
        await self.send(text_data=json.dumps({"status": "start", "message": event["message"]}))

class OnlineStatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        
        user = await get_user_from_token(query_string)
        
        if user:
            self.user = user
            await self.channel_layer.group_add("online_users", self.channel_name)

            self.user.is_online = True
            await database_sync_to_async(self.user.save)()
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        await self.set_user_active_status(self.user, False)

        await self.channel_layer.group_discard("online_users", self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)

    async def online_users(self, event):
        await self.send(text_data=json.dumps(event["content"]))

    @sync_to_async
    def set_user_active_status(self, user, status):
        user.is_online = status
        user.save()