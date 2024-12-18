from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager
from django.db import models
from django.utils import timezone
from django.utils.timezone import now

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
    username = models.CharField(max_length=255, unique=True)
    email = models.EmailField(max_length=255)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    is_staff = models.BooleanField(default=False)
    verification_code = models.IntegerField(blank=True, null=True)
    code_expiration = models.DateTimeField(blank=True, null=True)
    new_email = models.EmailField(max_length=255, blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    games_played = models.PositiveIntegerField(default=0)
    games_won = models.PositiveIntegerField(default=0)
    friends = models.ManyToManyField('self', through='Friendship', symmetrical=False)

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

class Game(models.Model):
    id = models.AutoField(primary_key=True)
    player1 = models.ForeignKey(User, related_name="games_as_player1", on_delete=models.CASCADE)
    player2 = models.ForeignKey(User, related_name="games_as_player2", on_delete=models.CASCADE)
    player1_score = models.IntegerField()
    player2_score = models.IntegerField()
    winner = models.ForeignKey(User, related_name="game_as_winner", on_delete=models.SET_NULL, null=True, blank=True)
    loser = models.ForeignKey(User, related_name="game_as_loser", on_delete=models.SET_NULL, null=True, blank=True)
    start_time = models.DateTimeField(default=now)
    end_time = models.DateTimeField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if self.player1_score > self.player2_score:
            self.winner = self.player1
            self.loser = self.player2
        elif self.player2_score > self.player1_score:
            self.winner = self.player2
            self.loser = self.player1

        self.player1.games_played += 1
        self.player2.games_played += 1

        if self.winner:
            self.winner.games_won += 1

        self.player1.save()
        self.player2.save()

        if self.winner:
            self.winner.save()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.player1.username} vs {self.player2.username} ({self.player1_score}-{self.player2_score})"

class Friendship(models.Model):
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    REJECTED = 'rejected'
    
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (ACCEPTED, 'Accepted'),
        (REJECTED, 'Rejected'),
    ]

    sender = models.ForeignKey(User, related_name='friendship_requests_sent', on_delete=models.CASCADE)
    receiver = models.ForeignKey(User, related_name='friendship_requests_received', on_delete=models.CASCADE)
    status = models.CharField(max_length=8, choices=STATUS_CHOICES, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('sender', 'receiver')
    
    def __str__(self):
        return f"{self.sender.username} - {self.receiver.username} ({self.status}) id: {self.id}"
