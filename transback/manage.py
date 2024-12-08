#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
from transback.vaultclient import get_secret 


def create_superUser():
    try:
        User.objects.get(username=get_secret('DB_USER'))
        print("Superuser already exists.")
    except User.DoesNotExist:
        # Eğer 'admin' yoksa, yeni superuser oluşturulacak
        User.objects.create_superuser(get_secret('DB_USER'), get_secret('DEFAULT_FROM_EMAIL'), get_secret('DB_PASSWORD'))
        print("Superuser created successfully.")

def main():


    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'transback.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
