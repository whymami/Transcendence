#!/bin/bash

sleep 5

if [ -s /vault/token/root_token.txt ]; then
    echo "Root token already exists"
else
    echo "Root token does not exist"
    exit 1
fi

export VAULT_ADDR='http://vault:8300'
export VAULT_TOKEN=$(cat /vault/token/root_token.txt)

export POSTGRES_USER=$(vault kv get -field=DB_USER secret/myapp/config)
export POSTGRES_PASSWORD=$(vault kv get -field=DB_PASSWORD secret/myapp/config)
export POSTGRES_DB=$(vault kv get -field=DB_NAME secret/myapp/config)


if [ "$DATABASE" = "postgres" ]
then
    echo "Waiting for PostgreSQL..."
    # while ! nc -z $SQL_HOST $SQL_PORT; do
    #   sleep 0.1
    # done
    echo "PostgreSQL started"
fi


echo "Applying database migrations"
python manage.py makemigrations
python manage.py migrate

echo "Collecting static files"
python manage.py collectstatic --noinput

echo "Starting Django development server"
daphne -e ssl:443:privateKey=/etc/nginx/ssl/nginx.key:certKey=/etc/nginx/ssl/nginx.crt -b 0.0.0.0 -p 8000 transback.asgi:application

# python manage.py runserver 0.0.0.0:8000
