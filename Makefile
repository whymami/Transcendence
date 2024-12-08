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

deleteall:
	docker stop $(docker ps -qa); docker rm $(docker ps -qa); docker rmi -f $(docker images -qa); docker volume rm $(docker volume ls -q); docker network rm $(docker network ls -q) 2>/dev/null

.PHONY: start stop clean