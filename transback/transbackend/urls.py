from django.urls import path
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView,TokenObtainPairView
from django.views.i18n import JavaScriptCatalog
from .views.auth import RegisterView, LoginView, ResetPasswordView
from .views.template_views import HomeView, HeaderView, GameView, UserSettingsView, ProfileView, UserListView, LobbyView
from .views.verify import VerifyLoginView, VerifyAccountView, ReSendVerifyCodeView
from .views.utils import NotFoundView
from .views.friend_views import FriendListView, FriendRequestView, FriendRequestResponseView, FriendRemoveView

urlpatterns = [
    path('api/header/', HeaderView.as_view(), name='header'),
    path('api/home/', HomeView.as_view(), name='home'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/verify-account/', VerifyAccountView.as_view(), name='profile'),
    path('api/settings/', UserSettingsView.as_view(), name='profile'),
    path('api/game/', GameView.as_view(), name='game'),
    path('api/reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('api/verify-login/', VerifyLoginView.as_view(), name='verify_code'),
    path('api/jsi18n/', JavaScriptCatalog.as_view(), name='javascript-catalog'),
    path('api/resend-verify-code/', ReSendVerifyCodeView.as_view(), name='resend_verify_code'),
    path('api/profile/', ProfileView.as_view(), name='profile'),
    path('api/404/', NotFoundView.as_view(), name='not_found'),
    path('api/users/', UserListView.as_view(), name='users'),
    path('api/friends/', FriendListView.as_view(), name='friends'),
    path('api/friends/request/', FriendRequestView.as_view(), name='friend_request'),
    path('api/friends/response/', FriendRequestResponseView.as_view(), name='friend_request_response'),
    path('api/friends/remove/', FriendRemoveView.as_view(), name='friend_remove'),
    path('api/lobby/', LobbyView.as_view(), name='lobby'),
]