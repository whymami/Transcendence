from django.urls import path
from django.urls import path
from .views import HomeView, LoginView, HeaderView, RegisterView, GameView, ProfileView, ResetPasswordView, VerifyCodeView, PongAPIView
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import TokenRefreshView,TokenObtainPairView

urlpatterns = [
    path('api/header/', HeaderView.as_view(), name='header'),
    path('api/home/', HomeView.as_view(), name='home'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/profile/', ProfileView.as_view(), name='profile'),
    path('api/pong/', PongAPIView.as_view(), name='pong_game'),
    path('api/game/', GameView.as_view(), name='game'),
    path('api/reset-password', ResetPasswordView.as_view(), name='reset_password'),
    path('api/verify-code', VerifyCodeView.as_view(), name='verify_code'),
]