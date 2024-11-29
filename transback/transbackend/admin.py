from django.contrib import admin
from .models import User, Game, Friendship
# Register your models here.

admin.site.register(User)
admin.site.register(Game)
admin.site.register(Friendship)