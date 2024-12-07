#!/bin/bash
sleep 5
if [ -s /vault/token/root_token.txt ]; then
	echo "Root token found"
else
	echo "Root token not found"
	exit 1
fi
export VAULT_ADDR='http://vault:8300'
export VAULT_TOKEN=$(cat /vault/token/root_token.txt)

echo "Vault token->: $VAULT_TOKEN"

export POSTGRES_USER=$(vault kv get -field=DB_USER secret/myapp/config)
export POSTGRES_PASSWORD=$(vault kv get -field=DB_PASSWORD secret/myapp/config)
export POSTGRES_DB="DragonBall"

exec docker-entrypoint.sh postgres