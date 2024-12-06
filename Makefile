DOCKER_COMPOSE = sudo docker-compose
ENV_FILE_PATH = ./transback/.env

start:
	@echo "Docker servisleri başlatılıyor..."
	$(DOCKER_COMPOSE) up -d
	@rm -f $(ENV_FILE_PATH)

stop:
	@echo "Docker servisleri durduruluyor..."
	$(DOCKER_COMPOSE) down

.PHONY: start stop clean