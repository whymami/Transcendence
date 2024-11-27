from transbackend.models import User
from transbackend.utils.email_utils import send_verification_email
from django.utils.timezone import now

class UserService:
    @staticmethod
    def create_or_update_unverified_user(username, email, password):
        existing_user = User.objects.filter(email=email, username=username, is_verified=False).first()
        
        if existing_user:
            existing_user.username = username
            existing_user.email = email
            existing_user.set_password(password)
            existing_user.set_verification_code()
            existing_user.save()
            return existing_user
            
        user = User(username=username, email=email)
        user.set_password(password)
        user.is_verified = False
        user.set_verification_code()
        user.save()
        return user

    @staticmethod
    def handle_verification_email(user, new_email=None):
        success, error = send_verification_email(user, new_email)
        if not success:
            raise Exception(f"Failed to send email: {error}") 

    @staticmethod
    def verify_login(user, verification_code):
        if verification_code is None:
            raise ValueError("Verification code is required.")
            
        try:
            verification_code = int(verification_code)
            if len(str(verification_code)) != 6:
                raise ValueError("Verification code must be 6 digits.")
        except ValueError as e:
            if "must be 6 digits" in str(e):
                raise e
            raise ValueError("Invalid verification code format.")

        if user.verification_code != verification_code:
            raise ValueError("Invalid verification code.")

        if user.code_expiration <= now():
            raise ValueError("Verification code has expired.")

        user.verification_code = None
        user.code_expiration = None
        if not user.is_verified:
            user.is_verified = True
        user.save()
        return user

    @staticmethod
    def verify_account(user, verification_code):
        if user.verification_code is None or verification_code is None:
            raise ValueError("Verification code is missing.")

        try:
            verification_code = int(verification_code)
            if len(str(verification_code)) != 6:
                raise ValueError("Verification code must be 6 digits.")
        except ValueError as e:
            if "must be 6 digits" in str(e):
                raise e
            raise ValueError("Invalid verification code format.")

        if user.verification_code != verification_code or user.code_expiration <= now():
            raise ValueError("Invalid or expired verification code.")

        user.is_verified = True
        user.verification_code = None
        user.code_expiration = None
        user.save()
        return user

    @staticmethod
    def resend_verification_code(user):
        user.set_verification_code()
        user.save()
        UserService.handle_verification_email(user)