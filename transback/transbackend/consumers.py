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

# Kullanıcı doğrulama fonksiyonu
async def get_user_from_token(query_string: str):
    """
    Token'ı query_string'den alır, doğrular ve kullanıcıyı döner.
    """
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
    players = 0
    game_state = {
        "ball": {"x": 50, "y": 50, "dx": random.choice([-1, 1]) * 2, "dy": random.choice([-1, 1]) * 2},
        "paddle1": {"y": 50},
        "paddle2": {"y": 50},
        "score": {"player1": 0, "player2": 0},
        "player1_name": None,
        "player2_name": None,
        "winner": None
    }

    async def connect(self):
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        self.user = await get_user_from_token(query_string)

        if not self.user:
            await self.close()
            return

        if PongConsumer.players < 2:
            PongConsumer.players += 1
            self.player_number = PongConsumer.players
            if self.player_number == 1:
                PongConsumer.game_state["player1_name"] = self.user.username
                print(f"Player 1: {self.user.username}")
            elif self.player_number == 2:
                PongConsumer.game_state["player2_name"] = self.user.username
                print(f"Player 2: {self.user.username}")
        else:
            self.player_number = 0  # Spectator

        await self.channel_layer.group_add(
            "game_room",
            self.channel_name,
        )
        await self.accept()

        if self.player_number == 0:
            await self.send(text_data=json.dumps({"status": "spectator", "message": "Oyunu izliyorsunuz."}))
        elif PongConsumer.players == 1:
            await self.send(text_data=json.dumps({"status": "waiting", "message": "Diğer oyuncu bekleniyor..."}))
        elif PongConsumer.players == 2:
            await self.channel_layer.group_send(
                "game_room",
                {"type": "game_start", "message": "Oyun başlıyor!"},
            )
            asyncio.create_task(self.start_game())

    async def disconnect(self, close_code):
        if hasattr(self, 'player_number') and self.player_number in [1, 2]:
            PongConsumer.players -= 1

            if PongConsumer.players == 0 and not PongConsumer.game_state["winner"]:
                # Eğer oyun kazanan belirlenmeden sona ererse veritabanına kaydet
                player1_name = PongConsumer.game_state.get("player1_name", "Player 1")
                player2_name = PongConsumer.game_state.get("player2_name", "Player 2")
                player1_score = PongConsumer.game_state["score"]["player1"]
                player2_score = PongConsumer.game_state["score"]["player2"]

                from .models import Game, User
                try:
                    player1_user = await sync_to_async(User.objects.get)(username=player1_name)
                except User.DoesNotExist:
                    player1_user = None
                    print(f"User with username '{player1_name}' not found.")

                try:
                    player2_user = await sync_to_async(User.objects.get)(username=player2_name)
                except User.DoesNotExist:
                    player2_user = None
                    print(f"User with username '{player2_name}' not found.")

                if player1_user and player2_user:
                    await sync_to_async(Game.objects.create)(
                        player1=player1_user,
                        player2=player2_user,
                        player1_score=player1_score,
                        player2_score=player2_score,
                        end_time=now()
                    )

            # Kullanıcıyı gruptan çıkar
            await self.channel_layer.group_discard(
                "game_room",
                self.channel_name,
            )



    async def receive(self, text_data):
        if self.player_number == 0:
            return

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
            if PongConsumer.game_state["winner"]:
                winner = PongConsumer.game_state["winner"]
                await self.channel_layer.group_send(
                    "game_room",
                    {
                        "type": "game_end",
                        "message": f"{winner} kazandı!"
                    }
                )

                # Oyunun sonucunu veritabanına kaydet
                player1_name = PongConsumer.game_state.get("player1_name", "Player 1")
                player2_name = PongConsumer.game_state.get("player2_name", "Player 2")
                player1_score = PongConsumer.game_state["score"]["player1"]
                player2_score = PongConsumer.game_state["score"]["player2"]

                from .models import Game, User
                try:
                    player1_user = await sync_to_async(User.objects.get)(username=player1_name)
                except User.DoesNotExist:
                    player1_user = None

                try:
                    player2_user = await sync_to_async(User.objects.get)(username=player2_name)
                except User.DoesNotExist:
                    player2_user = None

                if player1_user and player2_user:
                    await sync_to_async(Game.objects.create)(
                        player1=player1_user,
                        player2=player2_user,
                        player1_score=player1_score,
                        player2_score=player2_score,
                        end_time=now()
                    )

                # Tüm oyuncuları ve izleyicileri disconnect et
                await self.channel_layer.group_send(
                    "game_room",
                    {"type": "disconnect_all"}
                )

                # Oyun durumunu sıfırla
                PongConsumer.game_state = {
                    "ball": {"x": 50, "y": 50, "dx": random.choice([-1, 1]) * 2, "dy": random.choice([-1, 1]) * 2},
                    "paddle1": {"y": 50},
                    "paddle2": {"y": 50},
                    "score": {"player1": 0, "player2": 0},
                    "winner": None
                }
                PongConsumer.players = 0
                break

            self.update_game_state()
            await self.channel_layer.group_send(
                "game_room",
                {
                    "type": "update_game",
                    "game_state": PongConsumer.game_state,
                },
            )
            await asyncio.sleep(0.03)  # 30 FPS

    async def disconnect_all(self, event):
        await self.channel_layer.group_discard("game_room", self.channel_name)
        await self.close()

    def update_game_state(self):
        ball = PongConsumer.game_state["ball"]

        # Topun mevcut konumunu güncelle
        ball["x"] += ball["dx"]
        ball["y"] += ball["dy"]

        # Yön değişikliği (duvarlara çarpma)
        if ball["y"] <= 0 or ball["y"] >= 100:  # Üst ve alt duvarlar
            ball["dy"] *= -1

        # Sol raket (paddle1) ile çarpışma
        if ball["x"] <= 5:
            paddle1_y = PongConsumer.game_state["paddle1"]["y"]
            if paddle1_y - 15 <= ball["y"] <= paddle1_y + 15:  # Çarpışma aralığı
                # Çarpışma noktasına göre açıyı hesapla
                offset = ball["y"] - paddle1_y
                ball["dx"] = abs(ball["dx"])  # Sağ tarafa yönlendirme
                ball["dy"] = offset / 5  # Çarpışma noktasına göre yön

        # Sağ raket (paddle2) ile çarpışma
        elif ball["x"] >= 95:
            paddle2_y = PongConsumer.game_state["paddle2"]["y"]
            if paddle2_y - 15 <= ball["y"] <= paddle2_y + 15:  # Çarpışma aralığı
                # Çarpışma noktasına göre açıyı hesapla
                offset = ball["y"] - paddle2_y
                ball["dx"] = -abs(ball["dx"])  # Sol tarafa yönlendirme
                ball["dy"] = offset / 5  # Çarpışma noktasına göre yön

        # Skor durumu (top kaçarsa)
        if ball["x"] <= 0:
            PongConsumer.game_state["score"]["player2"] += 1
            self.reset_ball()
        elif ball["x"] >= 100:
            PongConsumer.game_state["score"]["player1"] += 1
            self.reset_ball()

        # Oyunun bitip bitmediğini kontrol et
        if PongConsumer.game_state["score"]["player1"] >= 10:
            PongConsumer.game_state["winner"] = PongConsumer.game_state["player1_name"]
        elif PongConsumer.game_state["score"]["player2"] >= 10:
            PongConsumer.game_state["winner"] = PongConsumer.game_state["player2_name"]

    def reset_ball(self):
        PongConsumer.game_state["ball"] = {
            "x": 50,
            "y": 50,
            "dx": random.choice([-1, 1]) * 2,
            "dy": random.uniform(-1, 1)  # Rasgele bir dikey hız
        }

    async def update_game(self, event):
        game_state = event["game_state"]
        await self.send(text_data=json.dumps(game_state))


    async def game_start(self, event):
        await self.send(text_data=json.dumps({"status": "start", "message": event["message"]}))

    async def game_end(self, event):
        await self.send(text_data=json.dumps({"status": "end", "message": event["message"]}))
        

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
