from django.urls import path
from django.urls import path
from .views import request_password_reset, reset_password, register, login
from .views import home_view, login_view

urlpatterns = [
    path('', home_view, name='home'),
    path('home/', home_view, name='home'),
    path('login/', login_view, name='login'),
    path('api/register/', register, name='register'),
    path('api/login/', login, name='login'),
    path('api/request-password-reset/', request_password_reset, name='request_password_reset'),
    path('api/reset-password/<uidb64>/<token>/', reset_password, name='reset_password'),
]