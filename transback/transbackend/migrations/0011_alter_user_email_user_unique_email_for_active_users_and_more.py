# Generated by Django 4.2.16 on 2024-11-22 18:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transbackend', '0010_user_is_verified'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='email',
            field=models.EmailField(max_length=254),
        ),
        migrations.AddConstraint(
            model_name='user',
            constraint=models.UniqueConstraint(condition=models.Q(('is_active', True)), fields=('email',), name='unique_email_for_active_users'),
        ),
        migrations.AddConstraint(
            model_name='user',
            constraint=models.UniqueConstraint(condition=models.Q(('is_active', True)), fields=('username',), name='unique_username_for_active_users'),
        ),
    ]
