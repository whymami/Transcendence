from django.http import JsonResponse
from django.template.response import TemplateResponse
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from .permissions import IsAnonymousUser
from django.utils.timezone import now
import json
from rest_framework_simplejwt.tokens import RefreshToken
from transbackend.models import User
from django.core.mail import send_mail, BadHeaderError

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
                print(now())
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

                if not user.is_verified:
                    user.is_verified = True

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

class VerifyAccountView(APIView):
    permission_classes = [IsAnonymousUser]
    authentication_classes = [JWTAuthentication]

    def get(self, request):
        return TemplateResponse(request, 'verify.html')

    def post(self, request):
        try:
            data = json.loads(request.body)
            username = data.get('username')
            verification_code = data.get('verification_code')

            try:
                user = User.objects.get(username=username)

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
        
class ReSendVerifyCodeView(APIView):
    permission_classes = [IsAnonymousUser]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        try:
            data = json.loads(request.body)
            username = data.get('username')

            try:
                user = User.objects.get(username=username)
                user.set_verification_code()
                user.save()

                try:
                    send_mail(
                        "Activate Your Account",
                        f"Your verification code is: {user.verification_code}",
                        [user.email],
                    )
                
                except BadHeaderError:
                    return JsonResponse({"error": "Failed to send email."}, status=500)
                
                except Exception as e:
                    return JsonResponse({"error": f"Failed to send email: {str(e)}"}, status=500)
                
                return JsonResponse({"message": "A verification code has been sent to your email."}, status=200)

            except User.DoesNotExist:
                return JsonResponse({"error": "User not found."}, status=404)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON data."}, status=400)