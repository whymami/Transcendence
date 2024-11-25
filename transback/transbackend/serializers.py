from rest_framework import serializers
from transbackend.models import User, Game
from transbackend.services.user_service import UserService

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_verified', 'games_played', 'games_won', 'is_online']
        read_only_fields = ['is_verified', 'games_played', 'games_won', 'is_online']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password']
        
    def validate(self, data):
        if User.objects.filter(email=data['email'], is_verified=True).exists():
            return {
                "error": "Email already in use."
            }
        if User.objects.filter(username=data['username']).exists():
            return {
                "error": "Username already in use."
            }
        return data

class GameSerializer(serializers.ModelSerializer):
    player1 = UserSerializer(read_only=True)
    player2 = UserSerializer(read_only=True)
    winner = UserSerializer(read_only=True)
    loser = UserSerializer(read_only=True)

    class Meta:
        model = Game
        fields = '__all__'

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')

        try:
            user = User.objects.get(username=username)
            if not user.check_password(password):
                return {
                    "error": "Invalid username or password."
                }
            data['user'] = user
            return data
        except User.DoesNotExist:
            return {
                "error": "Invalid username or password."
            }

class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
            self.context['user'] = user
            return value
        except User.DoesNotExist:
            return {
                "error": "No account found with this email."
            }

class ConfirmPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    verification_code = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, write_only=True)

    def validate(self, data):
        try:
            user = User.objects.get(email=data['email'])
            
            # Verify the code using the imported UserService
            UserService.verify_login(user, data['verification_code'])
            
            # Store user in context for the view
            self.context['user'] = user
            return data
            
        except User.DoesNotExist:
            return {
                "error": "No account found with this email."
            }
        except ValueError as e:
            return {
                "error": str(e)
            }
