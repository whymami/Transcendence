from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager
from django.db import models
from django.utils import timezone

class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(username, email, password, **extra_fields)

class User(AbstractBaseUser, PermissionsMixin):
    id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    status = models.CharField(max_length=50, default='active')
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    verification_code = models.IntegerField(max_length=6, blank=True, null=True)
    code_expiration = models.DateTimeField(blank=True, null=True)

    objects = UserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username

    def set_verification_code(self):
        import random
        self.verification_code = str(random.randint(100000, 999999))
        self.code_expiration = timezone.now() + timezone.timedelta(minutes=3)
        self.save()


class GameRoom(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    capacity = models.IntegerField(default=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"GameRoom {self.id} - {self.name}"

class Game(models.Model):
    id = models.AutoField(primary_key=True)
    room = models.ForeignKey(GameRoom, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.id
    
class GameHistory(models.Model):    
    id = models.AutoField(primary_key=True)
    game = models.ForeignKey(Game, on_delete=models.CASCADE)
    score = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.id
