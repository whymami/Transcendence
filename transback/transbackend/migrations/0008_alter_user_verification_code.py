# Generated by Django 4.2.16 on 2024-11-14 15:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('transbackend', '0007_user_code_expiration_user_verification_code'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='verification_code',
            field=models.IntegerField(blank=True, max_length=6, null=True),
        ),
    ]