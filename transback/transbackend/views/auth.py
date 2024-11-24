import json
from django.core.mail import send_mail, BadHeaderError
from django.http import JsonResponse
from django.template.response import TemplateResponse
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from transbackend.models import User
from .permissions import IsAnonymousUser
from rest_framework.permissions import AllowAny

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

                if User.objects.filter(email=email, is_verified=True).exists():
                    return JsonResponse({"error": "Email already in use."}, status=400)
                if User.objects.filter(username=username).exists():
                    return JsonResponse({"error": "Username already in use."}, status=400)

                existing_user = User.objects.filter(email=email, username=username, is_verified=False).first()
                if existing_user:
                    existing_user.username = username
                    existing_user.email = email
                    existing_user.set_password(password)
                    user.set_verification_code()
                    existing_user.save()

                    try:
                        send_mail(
                            "Activate Your Account",
                            f"Your verification code is: {user.verification_code}",
                            "noreply@example.com",
                            [email],
                        )

                    except BadHeaderError:
                        return JsonResponse({"error": "Failed to send email."}, status=500)

                    except Exception as e:
                        return JsonResponse({"error": f"Failed to send email: {str(e)}"}, status=500)

                    return JsonResponse({
                        "message": "A verification code has been sent to your email."
                    }, status=200)

                user = User(username=username, email=email)
                user.set_password(password)
                user.is_verified = False
                user.set_verification_code()
                user.save()

                try:
                    send_mail(
                        "Activate Your Account",
                        f"Your verification code is: {user.verification_code}",
                        "noreply@example.com",
                        [email],
                    )

                except BadHeaderError:
                    return JsonResponse({"error": "Failed to send email."}, status=500)
                
                except Exception as e:
                    return JsonResponse({"error": f"Failed to send email: {str(e)}"}, status=500)

                return JsonResponse({
                    "message": "Registration successful! A verification code has been sent to your email."
                }, status=200)

            else:
                return JsonResponse({"error": "All fields are required."}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)
        
class LoginView(APIView):
    permission_classes = [IsAnonymousUser]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        return TemplateResponse(request, 'login.html')

    def post(self, request):
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')

            try:
                user = User.objects.get(username=username)
                if not user.is_verified:
                    user.set_verification_code()

                    try:
                        send_mail(
                            "Reactivate Your Account",
                            f"Your account is not verified. Use the code {user.verification_code} to activate it.",
                            "noreply@example.com",
                            [user.email],
                        )
                    
                    except BadHeaderError:
                        return JsonResponse({"error": "Failed to send email."}, status=500)
                    
                    except Exception as e:
                        return JsonResponse({"error": f"Failed to send email: {str(e)}"}, status=500)

                    return JsonResponse({
                        "message": "Your account is not verified. A verification code has been sent to your email."
                    }, status=200)

                if user.check_password(password):
                    user.set_verification_code()

                    try:
                        send_mail(
                            "Your Login Verification Code",
                            f"Use the code {user.verification_code} to log in.",
                            "",
                            [user.email],
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