from django.contrib.auth import authenticate, login as auth_login
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.urls import reverse
from .models import User
from rest_framework_simplejwt.tokens import RefreshToken
from django.views.decorators.csrf import csrf_exempt
import json
from django.contrib.auth.hashers import make_password
from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.template.response import TemplateResponse
from django.contrib.auth import get_user_model


class IsAnonymousUser(BasePermission):
    """
    This permission class allows access only to anonymous users.
    """
    def has_permission(self, request, view):
        return not request.user.is_authenticated

class HeaderView(APIView):
    def get(self, request):
        user = request.user
        return TemplateResponse(request, 'header.html', {"user": user})

class RegisterView(APIView):
    permission_classes = [IsAnonymousUser]
    authentication_classes = []

    def get(self, request):
        return TemplateResponse(request, 'register.html')

    def post(self, request):
        try:
            data = json.loads(request.body)
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')

            if username and email and password:
                if User.objects.filter(username=username).exists():
                    return JsonResponse({"error": "Username already taken."}, status=400)
                if User.objects.filter(email=email).exists():
                    return JsonResponse({"error": "Email already in use."}, status=400)

                user = User(username=username, email=email)
                user.set_password(password)
                user.save()
                return JsonResponse({"message": "Registration successful!"}, status=201)
            else:
                return JsonResponse({"error": "All fields are required."}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)


class HomeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return TemplateResponse(request, 'home.html', {"user": user})

class LoginView(APIView):
    permission_classes = [IsAnonymousUser]
    authentication_classes = []

    def post(self, request):
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
            User = get_user_model()

            try:
                user = User.objects.get(email=email)
                if user.check_password(password):
                    refresh = RefreshToken.for_user(user)
                    return JsonResponse({
                        "message": "Login successful!",
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                    }, status=200)
                else:
                    return JsonResponse({"error": "Invalid email or password."}, status=401)
            except User.DoesNotExist:
                return JsonResponse({"error": "Invalid email or password."}, status=401)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)


class GameView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return TemplateResponse(request, 'game.html')

    def post(self, request):
        return JsonResponse({"message": "Hello, World!"})


def request_password_reset(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        try:
            user = User.objects.get(email=email)
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            reset_link = request.build_absolute_uri(
                reverse('reset_password', kwargs={'uidb64': uid, 'token': token})
            )
            send_mail(
                "Password Reset Requested",
                f"To reset your password, click the link: {reset_link}",
                'from@example.com',
                [email],
            )
            return JsonResponse({"message": "Password reset email sent!"}, status=200)
        except User.DoesNotExist:
            return JsonResponse({"error": "Email not found."}, status=404)

    return JsonResponse({"error": "Invalid request method."}, status=405)


def reset_password(request, uidb64, token):
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is not None and default_token_generator.check_token(user, token):
        if request.method == 'POST':
            new_password = request.POST.get('new_password')
            if new_password:
                user.set_password(new_password)
                user.save()
                return JsonResponse({"message": "Password has been reset!"}, status=200)
            else:
                return JsonResponse({"error": "New password is required."}, status=400)

    return JsonResponse({"error": "Invalid token or user."}, status=400)
