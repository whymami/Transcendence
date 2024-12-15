#!/bin/bash

sleep 10

if [ -s /vault/token/root_token.txt ]; then
    echo "Root token already exists"
else
    echo "Root token does not exist"
    exit 1
fi

export VAULT_ADDR='http://vault:8300'
export VAULT_TOKEN=$(cat /vault/token/root_token.txt)

export DB_USER=$(vault kv get -field=DB_USER secret/myapp/config)
export DB_PASSWORD=$(vault kv get -field=DB_PASSWORD secret/myapp/config)
export DB_NAME=$(vault kv get -field=DB_NAME secret/myapp/config)
export DB_HOST=$(vault kv get -field=DB_HOST secret/myapp/config)
export DB_PORT=$(vault kv get -field=DB_PORT secret/myapp/config)

echo "Waiting for database connection..."
until python -c "import psycopg2; \
                 conn = psycopg2.connect(dbname='$DB_NAME', user='$DB_USER', password='$DB_PASSWORD', host='$DB_HOST', port='$DB_PORT'); \
                 conn.close()"; do
    echo "Waiting for database to be ready..."
    sleep 2
done

echo "Applying database migrations"
python manage.py makemigrations
python manage.py migrate

echo "Collecting static files"
python manage.py collectstatic --noinput

echo "Starting Django development server"
daphne -e ssl:443:privateKey=/etc/nginx/ssl/nginx.key:certKey=/etc/nginx/ssl/nginx.crt -b 0.0.0.0 -p 8000 transback.asgi:application