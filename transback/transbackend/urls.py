# myapp/urls.py

from django.urls import path
from .views import hello_world
from .views import register

urlpatterns = [
    path('', hello_world, name='hello_world'),
    path('register/', register, name='register'),
]