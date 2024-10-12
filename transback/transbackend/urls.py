# myapp/urls.py

from django.urls import path
from .views import hello_world
from .views import register
from django.urls import path
from .views import request_password_reset, reset_password

urlpatterns = [
    path('', hello_world, name='hello_world'),
    path('register/', register, name='register'),
    path('request-password-reset/', request_password_reset, name='request_password_reset'),
    path('reset-password/<uidb64>/<token>/', reset_password, name='reset_password'),
]