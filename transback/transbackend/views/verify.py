from django.http import JsonResponse
from django.template.response import TemplateResponse
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.permissions import AllowAny
from .permissions import IsAnonymousUser
from django.utils.timezone import now
import json
from rest_framework_simplejwt.tokens import RefreshToken
from transbackend.models import User
from django.core.mail import BadHeaderError, EmailMultiAlternatives
from django.template.loader import render_to_string
from transbackend.services.user_service import UserService

class VerifyLoginView(APIView):
    permission_classes = [IsAnonymousUser]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        return TemplateResponse(request, '2fa.html')

    def post(self, request):
        try:
            data = json.loads(request.body)
            username = data.get('username')
            verification_code = data.get('verification_code')

            try:
                user = User.objects.get(username=username)
                user = UserService.verify_login(user, verification_code)
                
                refresh = RefreshToken.for_user(user)
                return JsonResponse({
                    "message": "Login successful!",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                }, status=200)

            except User.DoesNotExist:
                return JsonResponse({"error": "User not found."}, status=404)
            except ValueError as e:
                return JsonResponse({"error": str(e)}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)

class VerifyAccountView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        return TemplateResponse(request, 'verify.html')

    def post(self, request):
        try:
            data = json.loads(request.body)
            username = data.get('username')
            verification_code = data.get('verification_code')
            new_email = data.get('new_email')

            try:
                user = User.objects.get(username=username)
                if not new_email:
                    UserService.verify_account(user, verification_code)

                if new_email and request.user != user:
                    return JsonResponse({"error": "Unauthorized access"}, status=403)

                if new_email:
                    if request.user.new_email == new_email:
                        UserService.verify_account(user, verification_code)
                        user.email = new_email
                        user.new_email = None
                        user.save()
                        return JsonResponse({
                            "message": "Email verified successfully!",
                        }, status=200)
                    else:
                        return JsonResponse({"error": "Invalid email"}, status=400)
        
                return JsonResponse({"message": "Email verified successfully!"}, status=200)

            except User.DoesNotExist:
                return JsonResponse({"error": "User not found."}, status=404)
            except ValueError as e:
                return JsonResponse({"error": str(e)}, status=400)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)

class ReSendVerifyCodeView(APIView):
    permission_classes = [IsAnonymousUser]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        try:
            data = json.loads(request.body)
            username = data.get('username')

            try:
                user = User.objects.get(username=username)
                UserService.resend_verification_code(user)
                return JsonResponse({"message": "A verification code has been sent to your email."}, status=200)

            except User.DoesNotExist:
                return JsonResponse({"error": "User not found."}, status=404)
            except Exception as e:
                return JsonResponse({"error": str(e)}, status=500)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)