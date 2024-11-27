from rest_framework.views import APIView
from django.template.response import TemplateResponse
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.http import JsonResponse
from rest_framework.permissions import IsAuthenticated
import json
from transbackend.models import User, Game
from django.db.models import Q
from transbackend.utils.response_utils import json_response
from transbackend.models import Friendship
from transbackend.services.user_service import UserService
class HeaderView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user
        return TemplateResponse(request, 'header.html', {"user": user})

class HomeView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        user = request.user
        return TemplateResponse(request, 'home.html', {"user": user})

class GameView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        user = request.user
        return TemplateResponse(request, 'game.html', {"user": user})

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        username = request.query_params.get('username')
        if not username or username == "":
            user = request.user
            user.is_online = True

            last_games = []
            games = Game.objects.filter(Q(player1=user) | Q(player2=user)).order_by('-start_time')[:5]

            for game in games:
                if game.player1 == user:
                    opponent = game.player2.username
                    user_score = game.player1_score
                    opponent_score = game.player2_score
                else:
                    opponent = game.player1.username
                    user_score = game.player2_score
                    opponent_score = game.player1_score

                result = "(Won)" if game.winner == user else "(Lost)"

                last_games.append(f"{user.username} vs {opponent} - Score: {user_score}-{opponent_score} {result}")

            return TemplateResponse(
                request,
                'profile.html', 
                {"user": user, "last_games": last_games}
            )
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return TemplateResponse(request, '404.html', status=404)

        games = Game.objects.filter(Q(player1=user) | Q(player2=user)).order_by('-start_time')[:5]

        last_games = []
        for game in games:
            if game.player1 == user:
                opponent = game.player2.username
                user_score = game.player1_score
                opponent_score = game.player2_score
            else:
                opponent = game.player1.username
                user_score = game.player2_score
                opponent_score = game.player1_score

            result = "(Won)" if game.winner == user else "(Lost)"

            last_games.append(f"{user.username} vs {opponent} - Score: {user_score}-{opponent_score} {result}")

        friendship_status = None
        try:
            friendship = Friendship.objects.filter(
                (Q(sender=request.user) & Q(receiver=user)) |
                (Q(sender=user) & Q(receiver=request.user))
            ).first()
            if friendship:
                friendship_status = friendship.status
        except Friendship.DoesNotExist:
            friendship_status = None

        return TemplateResponse(
            request,
            'profile.html', 
            {
                "user": user, 
                "last_games": last_games,
                "friendship_status": friendship_status
            }
        )

class UserSettingsView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        user = request.user
        return TemplateResponse(request, 'settings.html', {"user": user})

    def post(self, request):
        try:
            data = request.data
            user = request.user
            if data.get('username') and data.get('username') != "":
                user.username = data.get('username')
            if data.get('email') and data.get('email') != "":
                original_email = user.email
                user.email = data.get('email')
            if data.get('profile_picture') and data.get('profile_picture') != "":
                if user.profile_picture:
                    import os
                    old_picture_path = user.profile_picture.path
                    if os.path.exists(old_picture_path):
                        os.remove(old_picture_path)
                user.profile_picture = data.get('profile_picture')

            if user.username:
                if User.objects.filter(username=user.username).exclude(id=user.id).exists():
                    return JsonResponse({"error": "Username already exists."}, status=400)
            if user.email:
                if User.objects.filter(email=user.email).exclude(id=user.id).exists():
                    return JsonResponse({"error": "Email already exists."}, status=400)
                else:
                    new_email = user.email
                    # Send verification code to new email
                    user.set_verification_code()
                    UserService.handle_verification_email(user, new_email)
                    # Return early without saving
                    return JsonResponse({
                        "message": "Please check your new email for verification code before changes take effect.",
                        "requires_verification": True,
                        "email": new_email,
                        "original_email": original_email
                    }, status=200)

            user.save()
            return JsonResponse({"message": "Profile updated successfully!"}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)

class UserListView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        try:
            users = User.objects.all().values(
                'username',
                'is_online',
                'profile_picture'
            )
            return TemplateResponse(request, 'users.html', {"users": users})
        except Exception as e:
            return json_response(error="Failed to fetch users", status=500)
