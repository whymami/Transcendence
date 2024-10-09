from django.db import models

class User(models.Model):
    userId = models.AutoField(primary_key=True)
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)  # Hashlenmiş şifre için uygun uzunluk
    email = models.EmailField(unique=True)  # Özgün e-posta alanı
    changed_at = models.DateTimeField(auto_now=True)  # Son değişiklik tarihi
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)

    def __str__(self):
        return self.username
