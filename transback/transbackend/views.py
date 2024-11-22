from django.contrib.auth import authenticate, login as auth_login
from django.http import JsonResponse, HttpResponse
from django.core.mail import send_mail, BadHeaderError
from rest_framework.response import Response
from .models import User
from rest_framework_simplejwt.tokens import RefreshToken
import json
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, BasePermission, AllowAny
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.template.response import TemplateResponse
from django.contrib.auth import get_user_model
from django.contrib.auth import logout as auth_logout
import random
from datetime import timedelta
from django.utils.timezone import now

class IsAnonymousUser(BasePermission):
    """
    This permission class allows access only to anonymous users.
    """
    def has_permission(self, request, view):
        print(request.user)
        return not request.user.is_authenticated

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

class RegisterView(APIView):
    permission_classes = [IsAnonymousUser]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        return TemplateResponse(request, 'register.html')

    def post(self, request):
        try:
            data = json.loads(request.body)
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')

            if username and email and password:

                if User.objects.filter(email=email, is_active=True).exists():
                    return JsonResponse({"error": "Email already in use."}, status=400)
                if User.objects.filter(username=username).exists():
                    return JsonResponse({"error": "Username already in use."}, status=400)

                existing_user = User.objects.filter(email=email, username=username, is_active=False).first()
                if existing_user:
                    existing_user.username = username
                    existing_user.email = email
                    existing_user.set_password(password)
                    verification_code = random.randint(100000, 999999)
                    existing_user.verification_code = verification_code
                    existing_user.code_expiration = now() + timedelta(minutes=10)
                    existing_user.save()

                    try:
                        send_mail(
                            "Activate Your Account",
                            f"Your verification code is: {verification_code}",
                            "noreply@example.com",
                            [email],
                        )

                    except BadHeaderError:
                        return JsonResponse({"error": "Failed to send email."}, status=500)

                    except Exception as e:
                        return JsonResponse({"error": f"Failed to send email: {str(e)}"}, status=500)

                    return JsonResponse({
                        "message": "A verification code has been sent to your email."
                    }, status=201)

                user = User(username=username, email=email)
                user.set_password(password)
                user.is_active = False
                verification_code = random.randint(100000, 999999)
                user.verification_code = verification_code
                user.code_expiration = now() + timedelta(minutes=10)
                user.save()

                try:
                    send_mail(
                        "Activate Your Account",
                        f"Your verification code is: {verification_code}",
                        "noreply@example.com",
                        [email],
                    )

                except BadHeaderError:
                    return JsonResponse({"error": "Failed to send email."}, status=500)
                
                except Exception as e:
                    return JsonResponse({"error": f"Failed to send email: {str(e)}"}, status=500)

                return JsonResponse({
                    "message": "Registration successful! A verification code has been sent to your email."
                }, status=201)

            else:
                return JsonResponse({"error": "All fields are required."}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)

class LoginView(APIView):
    permission_classes = [IsAnonymousUser]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')

            try:
                user = User.objects.get(email=email)
                if not user.is_verified:
                    verification_code = random.randint(100000, 999999)
                    user.verification_code = verification_code
                    user.code_expiration = now() + timedelta(minutes=10)
                    user.save()

                    send_mail(
                        "Reactivate Your Account",
                        f"Your account is inactive. Use the code {verification_code} to activate it.",
                        "noreply@example.com",
                        [email],
                    )
                    return JsonResponse({
                        "message": "Your account is inactive. A verification code has been sent to your email."
                    }, status=400)

                if user.check_password(password):
                    verification_code = random.randint(100000, 999999)
                    user.verification_code = verification_code
                    user.code_expiration = now() + timedelta(minutes=5)
                    user.save()

                    try:
                        send_mail(
                            "Your Login Verification Code",
                            f"Use the code {verification_code} to log in.",
                            "noreply@example.com",
                            [email],
                        )
                    
                    except BadHeaderError:
                        return JsonResponse({"error": "Failed to send email."}, status=500)
                    
                    except Exception as e:
                        return JsonResponse({"error": f"Failed to send email: {str(e)}"}, status=500)

                    return JsonResponse({
                        "message": "Verification code sent to your email."
                    }, status=200)

                else:
                    return JsonResponse({"error": "Invalid email or password."}, status=401)

            except User.DoesNotExist:
                return JsonResponse({"error": "Invalid email or password."}, status=401)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)

class VerifyLoginView(APIView):
    permission_classes = [IsAnonymousUser]

    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get('email')
            verification_code = data.get('verification_code')

            try:
                user = User.objects.get(email=email)

                if verification_code is None:
                    return JsonResponse({"error": "Verification code is required."}, status=400)
                try:
                    verification_code = int(verification_code)
                except ValueError:
                    return JsonResponse({"error": "Invalid verification code format."}, status=400)

                if user.verification_code != verification_code:
                    return JsonResponse({"error": "Invalid verification code."}, status=400)

                if user.code_expiration <= now():
                    return JsonResponse({"error": "Verification code has expired."}, status=400)

                user.verification_code = None
                user.code_expiration = None
                user.save()

                refresh = RefreshToken.for_user(user)
                return JsonResponse({
                    "message": "Login successful!",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                }, status=200)

            except User.DoesNotExist:
                return JsonResponse({"error": "User not found."}, status=404)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)

class GameView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.user
        return TemplateResponse(request, 'game.html', {"user": user})

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        user = request.user
        return TemplateResponse(request, 'profile.html', {"user": user})

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

class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return TemplateResponse(request, 'reset-password.html', {"user": request.user})

    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get('email')
            user = User.objects.filter(email=email).first()

            if user:
                user.set_verification_code()

                try:
                    send_mail(
                        'Password Reset Code',
                        f'Your password reset code is {user.verification_code}. It expires in 3 minutes.',
                        [email],
                        fail_silently=False,
                    )
                    return JsonResponse({"message": "Verification code sent to email."}, status=200)
    
                except BadHeaderError:
                    return JsonResponse({"error": "Failed to send email invalid email."}, status=500)
                
                except Exception as e:
                    return JsonResponse({"error": f"Failed to send email: {str(e)}"}, status=500)

            else:
                return JsonResponse({"error": "User with this email does not exist."}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)

class VerifyAccountView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get('email')
            verification_code = data.get('verification_code')

            try:
                user = User.objects.get(email=email)

                if user.verification_code is None or verification_code is None:
                    return JsonResponse({"error": "Verification code is missing."}, status=400)

                try:
                    verification_code = int(verification_code)
                except ValueError:
                    return JsonResponse({"error": "Invalid verification code format."}, status=400)

                if user.verification_code == verification_code and user.code_expiration > now():
                    user.is_verified = True
                    user.verification_code = None
                    user.code_expiration = None
                    user.save()
                    return JsonResponse({"message": "Account verified successfully!"}, status=200)
                else:
                    return JsonResponse({"error": "Invalid or expired verification code."}, status=400)

            except User.DoesNotExist:
                return JsonResponse({"error": "User not found."}, status=404)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)

class ChangePasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get('email')
            new_password = data.get('new_password')

            user = User.objects.filter(email=email).first()
            if user:
                user.set_password(new_password)
                user.save()
            else:
                return JsonResponse({"error": "User with this email does not exist."}, status=400)
            return JsonResponse({"message": "Password changed successfully!"}, status=200)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)
    
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

class PongGame:
    def __init__(self, mode='single'):
        self.mode = mode  # single, two_player, four_player
        self.ball = {'x': 400, 'y': 250, 'dx': 5, 'dy': 5}
        self.paddles = {
            'player1': 200,  # Sol paddle (Oyuncu 1)
            'player2': 200,  # Sağ paddle (Oyuncu 2 veya Bilgisayar)
            'player3': 200,  # Üst paddle (Oyuncu 3)
            'player4': 200   # Alt paddle (Oyuncu 4)
        }

    def move_ball(self):
        self.ball['x'] += self.ball['dx']
        self.ball['y'] += self.ball['dy']

        # Top kenarlara çarptığında yön değiştir
        if self.ball['y'] <= 0 or self.ball['y'] >= 500:
            self.ball['dy'] *= -1

        # Paddle'lara çarpma kontrolleri
        if (self.ball['x'] <= 20 and 
            self.paddles['player1'] < self.ball['y'] < self.paddles['player1'] + 100):
            self.ball['dx'] *= -1

        if (self.ball['x'] >= 780 and 
            self.paddles['player2'] < self.ball['y'] < self.paddles['player2'] + 100):
            self.ball['dx'] *= -1

        if self.mode in ['four_player']:
            # Üst paddle
            if (self.ball['y'] <= 20 and 
                self.paddles['player3'] < self.ball['x'] < self.paddles['player3'] + 100):
                self.ball['dy'] *= -1

            # Alt paddle
            if (self.ball['y'] >= 480 and 
                self.paddles['player4'] < self.ball['x'] < self.paddles['player4'] + 100):
                self.ball['dy'] *= -1

    def move_computer_paddle(self):
        if self.mode == 'single':
            if self.paddles['player2'] + 50 < self.ball['y']:
                self.paddles['player2'] = min(400, self.paddles['player2'] + 5)
            else:
                self.paddles['player2'] = max(0, self.paddles['player2'] - 5)

    def move_player_paddle(self, player, direction):
        if direction == 'up':
            self.paddles[player] = max(0, self.paddles[player] - 30)
        elif direction == 'down':
            self.paddles[player] = min(400, self.paddles[player] + 30)

    def get_game_state(self):
        return {
            'ball': self.ball,
            'paddles': self.paddles,
            'mode': self.mode
        }

game_instance = PongGame()

class PongAPIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        game_instance.move_ball()
        if game_instance.mode == 'single':
            game_instance.move_computer_paddle()
        game_state = game_instance.get_game_state()
        return Response(game_state)

    def post(self, request):
        action = request.data.get('action')
        player = request.data.get('player', 'player1')

        if action in ['up', 'down']:
            game_instance.move_player_paddle(player, action)
        
        game_instance.move_ball()
        if game_instance.mode == 'single':
            game_instance.move_computer_paddle()
        
        game_state = game_instance.get_game_state()
        return Response(game_state, status=status.HTTP_200_OK)

    def put(self, request):
        mode = request.data.get('mode', 'single')
        game_instance._init_(mode)
        return Response({"message": "Game mode updated", "mode": mode})