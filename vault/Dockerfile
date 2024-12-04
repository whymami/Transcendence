FROM hashicorp/vault:latest

RUN mkdir -p /vault/token

# Expose Vault port
EXPOSE 8300

# Copy your Vault configuration files
COPY config.hcl /vault/config/config.hcl

# Copy your initialization script
COPY init.sh /vault/init.sh

# Make the initialization script executable
RUN chmod +x /vault/init.sh

# Set the entrypoint to run the initialization script
ENTRYPOINT ["/vault/init.sh"]
