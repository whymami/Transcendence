import os
import hvac
import environ

VAULT_ADDR = os.getenv("VAULT_ADDR", "http://localhost:8300")  # Vault'un adresi
VAULT_TOKEN_FILE = os.getenv("VAULT_TOKEN_FILE", "/vault/token/root_token.txt")  # Token dosyası
secret_path = 'myapp/config'  # secret path doğru olmalı
