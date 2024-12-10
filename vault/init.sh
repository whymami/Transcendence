#!/bin/sh

# shutdown any instance of vault
pkill vault
rm -rf /vault/data/*

# Start Vault in the background, redirecting the output to a file
echo "Starting Vault server in the background"
vault server -dev -config=/vault/config/config.hcl > /tmp/vault.log 2>&1 &
echo "Vault server started"

# Sleep to ensure Vault has started
sleep 5

# Retrieve root token and store it
cat /tmp/vault.log
root_token=$(grep 'Root Token:' /tmp/vault.log | awk '{print $NF}')
echo -n "$root_token" > /vault/token/root_token.txt
echo "Root token: $root_token"
export VAULT_TOKEN="$root_token"

vault kv put secret/myapp/config \
    EMAIL_HOST="$EMAIL_HOST" \
    EMAIL_PORT="$EMAIL_PORT" \
    EMAIL_USE_TLS="$EMAIL_USE_TLS" \
    EMAIL_HOST_USER="$EMAIL_HOST_USER" \
    EMAIL_HOST_PASSWORD="$EMAIL_HOST_PASSWORD" \
    DEFAULT_FROM_EMAIL="$DEFAULT_FROM_EMAIL" \
    SECRET_KEY="$SECRET_KEY" \
    DB_NAME="$DB_NAME" \
    DB_USER="$DB_USER" \
    DB_PASSWORD="$DB_PASSWORD" \
    DB_HOST="$DB_HOST" \
    DB_PORT="$DB_PORT" \
    POSTGRES_PASSWORD="$DB_PASSWORD" \
    POSTGRES_USER="$DB_USER" \
    POSTGRES_DB="$DB_NAME"

echo "Secrets loaded into Vault"

# list all secrets
vault kv get secret/myapp/config



# Keep the script running or exit
tail -f /dev/null