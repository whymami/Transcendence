from django.urls import path
from django.urls import path
from .views import HomeView, LoginView, HeaderView, RegisterView, GameView
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import TokenRefreshView,TokenObtainPairView

urlpatterns = [
    # path('', HomeView.as_view(), name='home'),
    path('api/header/', HeaderView.as_view(), name='header'),
    path('api/home/', HomeView.as_view(), name='home'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/game/', GameView.as_view(), name='game'),
    # path('api/request-password-reset/', request_password_reset, name='request_password_reset'),
    # path('api/reset-password/<uidb64>/<token>/', reset_password, name='reset_password'),
]