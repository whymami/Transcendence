from django.contrib.auth import authenticate, login as auth_login
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.urls import reverse
from .models import User
from django.views.decorators.csrf import csrf_exempt
import json
from django.contrib.auth.hashers import make_password
from django.shortcuts import render
from rest_framework_simplejwt.tokens import RefreshToken

def home_view(request):
    return render(request, 'transbackend/home.html')


def login_view(request):
    return render(request, 'transbackend/login.html')

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


def hello_world(request):
    return HttpResponse("Hello, World!")

@csrf_exempt
def register(request):
    if request.method == 'POST':
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

                hashed_password = make_password(password)  # Şifreyi hashle
                user = User(username=username, email=email, password=hashed_password)
                user.save()

                return JsonResponse({"message": "Registration successful!"}, status=201)
            else:
                return JsonResponse({"error": "All fields are required."}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)

    return JsonResponse({"error": "Invalid request method."}, status=405)

def custom_authenticate(email, password):
    try:
        user = User.objects.get(email=email)
        if user.check_password(password):
            return user
    except User.DoesNotExist:
        return None

@csrf_exempt
def login(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')

            user = custom_authenticate(email, password)
            if user is not None:
                refresh = RefreshToken.for_user(user)
                return JsonResponse({
                    "message": "Login successful!",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                }, status=200)
            else:
                return JsonResponse({"error": "Invalid email or password."}, status=401)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)

    return JsonResponse({"error": "Invalid request method."}, status=405)
