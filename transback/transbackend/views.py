from django.contrib.auth import authenticate, login as auth_login
from django.http import JsonResponse, HttpResponse
from .models import User
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.http import JsonResponse
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.urls import reverse
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.forms import SetPasswordForm

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
                'from@example.com',  # mail konulacak
                [email],
            )
            return JsonResponse({"message": "Password reset email sent!"}, status=200)
        except User.DoesNotExist:
            return JsonResponse({"error": "Email not found."}, status=404)

    return JsonResponse({"error": "Invalid request method."}, status=405)

def reset_password(request, uidb64, token):
    try:
        uid = force_text(urlsafe_base64_decode(uidb64))
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

def register(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')

        if username and email and password:
            user = User(username=username, email=email)
            user.set_password(password)
            user.save()

            return JsonResponse({"message": "Registration successful!"}, status=201)
        else:
            return JsonResponse({"error": "All fields are required."}, status=400)

    return JsonResponse({"error": "Invalid request method."}, status=405)

def login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            auth_login(request, user)
            return JsonResponse({"message": "Login successful!"}, status=200)
        else:
            return JsonResponse({"error": "Invalid username or password."}, status=401)

    return JsonResponse({"error": "Invalid request method."}, status=405)

        