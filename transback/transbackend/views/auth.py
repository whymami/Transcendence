from django.template.response import TemplateResponse
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from transbackend.serializers import serializers
from transbackend.models import User
from .permissions import IsAnonymousUser
from rest_framework.permissions import AllowAny
from transbackend.services.user_service import UserService
from transbackend.utils.response_utils import json_response
from transbackend.serializers import UserRegistrationSerializer, UserSerializer, LoginSerializer, ResetPasswordSerializer, ConfirmPasswordResetSerializer
import json

class RegisterView(APIView):
    permission_classes = [IsAnonymousUser]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        return TemplateResponse(request, 'register.html')

    def post(self, request):
        try:
            serializer = UserRegistrationSerializer(data=request.data)
            if not serializer.is_valid():
                return json_response(error=serializer.errors, status=400)

            user = UserService.create_or_update_unverified_user(
                username=serializer.validated_data['username'],
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password']
            )
            UserService.handle_verification_email(user)
            return json_response(message="Registration successful! A verification code has been sent to your email.")
            
        except Exception as e:
            return json_response(error=str(e), status=500)

class LoginView(APIView):
    permission_classes = [IsAnonymousUser]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        return TemplateResponse(request, 'login.html')

    def post(self, request):
        try:
            serializer = LoginSerializer(data=request.data)
            if not serializer.is_valid():
                return json_response(error=serializer.errors, status=401)

            user = serializer.validated_data['user']
            
            if not user.is_verified:
                user.set_verification_code()
                UserService.handle_verification_email(user)
                return json_response(
                    message="Your account is not verified. A verification code has been sent to your email."
                )

            # User is verified, send verification code for 2FA
            user.set_verification_code()
            UserService.handle_verification_email(user)
            return json_response(message="Verification code sent to your email.")

        except serializers.ValidationError as ve:
            error_message = str(ve.detail[0]) if isinstance(ve.detail, list) else str(ve.detail)
            return json_response(error=error_message, status=401)
        except Exception as e:
            return json_response(error="An unexpected error occurred.", status=500)

class ResetPasswordView(APIView):
    permission_classes = [IsAnonymousUser]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        return TemplateResponse(request, 'reset_password.html')

    def post(self, request):
        try:
            serializer = ResetPasswordSerializer(data=request.data)
            if not serializer.is_valid():
                return json_response(error=serializer.errors, status=400)

            user = serializer.context['user']
            user.set_verification_code()
            UserService.handle_verification_email(user)
            
            return json_response(message="Password reset code sent to your email.")

        except Exception as e:
            return json_response(error=str(e), status=500)

class ConfirmPasswordResetView(APIView):
    permission_classes = [IsAnonymousUser]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        try:
            serializer = ConfirmPasswordResetSerializer(data=request.data)
            if not serializer.is_valid():
                return json_response(error=serializer.errors, status=400)

            user = serializer.context['user']
            user.set_password(serializer.validated_data['new_password'])
            user.verification_code = None
            user.code_expiration = None
            user.save()

            return json_response(message="Password has been reset successfully.")

        except Exception as e:
            return json_response(error=str(e), status=500)
