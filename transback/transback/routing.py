from django.urls import path
from transbackend import consumers

websocket_urlpatterns = [
    path("ws/game/<int:room_id>", consumers.GameConsumer.as_asgi()),
]
