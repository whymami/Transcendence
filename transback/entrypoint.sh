echo "Applying database migrations"
python manage.py makemigrations
python manage.py migrate

echo "Collecting static files"
python manage.py collectstatic --noinput

echo "Starting Django development server"
daphne -b 0.0.0.0 -p 8000 transback.asgi:application
# python manage.py runserver 0.0.0.0:8000
