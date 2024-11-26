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

        return TemplateResponse(
            request,
            'profile.html', 
            {"user": user, "last_games": last_games}
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
            if data.get('username'):
                user.username = data.get('username')
            if data.get('email'):
                user.email = data.get('email')

            if data.get('profile_picture'):
                user.profile_picture = data.get('profile_picture')

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
