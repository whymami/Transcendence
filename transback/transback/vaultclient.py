import os
import hvac
import environ
from transback.vaultsettings import VAULT_ADDR, VAULT_TOKEN_FILE, secret_path

def get_root_token():
    # Vault token'ını oku
    with open(VAULT_TOKEN_FILE) as f:
        VAULT_TOKEN = f.read().strip()

    # Vault ile bağlantı kurma
    client = hvac.Client(url=VAULT_ADDR, token=VAULT_TOKEN)
    return client


def get_secret(secretName):
    # Vault ile bağlantı kurma
    client = get_root_token()

    try:
        # Secret bilgilerini alma
        secret_response = client.secrets.kv.v2.read_secret_version(path=secret_path)
        # SECRET_KEY'i almak
        secret_key = secret_response['data']['data'][secretName]
        print(f"{secretName}: {secret_key}")

        return secret_key

    except Exception as e:
        print(f"Error while fetching secret: {str(e)}")
        return None