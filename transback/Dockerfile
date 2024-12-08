FROM python:3.10-slim

# Set environment variables to prevent writing .pyc files and buffering
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory inside the container
WORKDIR /transback

# Install gettext and other dependencies required for compiling translations
RUN apt-get update && apt-get install -y gettext && rm -rf /var/lib/apt/lists/*

# Copy the requirements file and install dependencies
COPY requirements.txt /transback/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the project files into the container
COPY . /transback/

# Make the entrypoint script executable
COPY ./entrypoint.sh /transback/entrypoint.sh
RUN chmod +x /transback/entrypoint.sh

RUN psql -U admin -d DragonBall

# Run `compilemessages` to compile .po files into .mo files
RUN django-admin compilemessages

# Expose port 8000 to access the Django application
EXPOSE 8000

# Set the entrypoint script
ENTRYPOINT ["/transback/entrypoint.sh"]
