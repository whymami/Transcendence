
import json
from channels.generic.websocket import AsyncWebsocketConsumer
import asyncio
import random

class PongConsumer(AsyncWebsocketConsumer):
    players = 0
    game_state = {
        "ball": {"x": 50, "y": 50, "dx": random.choice([-1, 1]) * 2, "dy": random.choice([-1, 1]) * 2},
        "paddle1": {"y": 50},
        "paddle2": {"y": 50},
        "score": {"player1": 0, "player2": 0},
    }

    async def connect(self):
        if PongConsumer.players < 2:
            PongConsumer.players += 1
            self.player_number = PongConsumer.players
        else:
            self.player_number = 0  # İzleyici

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
            # İki oyuncu bağlandığında oyunu başlat
            await self.channel_layer.group_send(
                "game_room",
                {"type": "game_start", "message": "Oyun başlıyor!"},
            )
            asyncio.create_task(self.start_game())

    async def disconnect(self, close_code):
        if self.player_number in [1, 2]:
            PongConsumer.players -= 1
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
        await self.send(text_data=json.dumps(game_state))

    async def game_start(self, event):
        await self.send(text_data=json.dumps({"status": "start", "message": event["message"]}))
