FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /transback
COPY requirements.txt /transback/
RUN pip install --no-cache-dir -r requirements.txt
RUN apt-get update && apt-get install -y netcat

COPY . /transback/

COPY ./entrypoint.sh /transback/entrypoint.sh
RUN chmod +x /transback/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/transback/entrypoint.sh"]
