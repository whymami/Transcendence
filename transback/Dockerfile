FROM python:3.10-slim

WORKDIR /transback

RUN apt-get update && \
    apt-get install -y gettext wget unzip && \
    rm -rf /var/lib/apt/lists/* && \
    wget https://releases.hashicorp.com/vault/1.5.3/vault_1.5.3_linux_amd64.zip && \
    unzip -o vault_1.5.3_linux_amd64.zip -d /usr/local/bin/ && \
    rm vault_1.5.3_linux_amd64.zip && \
    apt-get clean

COPY requirements.txt /transback/
RUN pip install --no-cache-dir -r requirements.txt


COPY . /transback/

COPY ./entrypoint.sh /transback/entrypoint.sh
RUN chmod +x /transback/entrypoint.sh

RUN django-admin compilemessages

EXPOSE 8000

ENTRYPOINT ["/transback/entrypoint.sh"]
