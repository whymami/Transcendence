DOCKER_COMPOSE = sudo docker-compose
ENV_FILE_PATH = ./transback/.env

start:
	@echo "Docker servisleri başlatılıyor..."
	$(DOCKER_COMPOSE) up -d
	@rm -f $(ENV_FILE_PATH)

stop:
	@echo "Docker servisleri durduruluyor..."
	$(DOCKER_COMPOSE) down

re:
	@echo "Docker servisleri yeniden başlatılıyor..."
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE) up -d

build:
	@echo "Docker servisleri yeniden başlatılıyor..."
	$(DOCKER_COMPOSE) down
	$(DOCKER_COMPOSE) up --build

.PHONY: start stop clean