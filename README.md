# ft_transcendence – Full-Stack Multiplayer Web Application

> A modern web application combining real-time multiplayer gameplay, chat functionality, and secure user management — built with Django, JavaScript, and Docker.

## Description

**ft_transcendence** is a full-stack web application developed as part of the 42 School Cybersecurity & Software Engineering curriculum.  
It brings together multiple technologies — web sockets, authentication, database management, and containerized deployment — to create a secure, interactive, and scalable online experience.

The project demonstrates:
- Advanced **web development** practices
- **Real-time communication** with WebSockets
- **Secure authentication** and session management
- **Containerized deployment** using Docker and Nginx

---

## Features

### 🌐 Core Features
- User authentication (register / login / logout)
- OAuth2 / 2FA support
- Real-time multiplayer Pong game
- Live chat system with rooms and private messages
- User profiles and avatars
- Friends list and match history
- REST API for application data
- Responsive design and UI

### 🧩 Technical Features
- Django backend (Python)
- WebSocket support for real-time gameplay and chat
- PostgreSQL database integration
- Secure session handling and cookie management
- Docker-based deployment with isolated containers
- Nginx reverse proxy for HTTP and WebSocket routing
- HashiCorp Vault for secrets and credentials management

---

## Requirements

- **Python 3.x**
- **Django 4.x**
- **PostgreSQL**
- **Docker / Docker Compose**
- **Nginx**
- **Node.js & npm** (for frontend dependencies)

---

## Installation

```bash
# Clone the repository
git clone https://github.com/whymami/Transcendence.git
cd Transcendence

# Configure environment variables
cp .env.example .env
# (Edit database and secret values)

# Build and start containers
docker-compose up --build
````

Once started, the application should be accessible at:

```
http://localhost:8080
```

---

## Usage

### 🕹️ Start the Application

```bash
docker-compose up
```

### 🧑‍💻 Development Commands

```bash
# Apply migrations
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser

# Collect static files
docker-compose exec web python manage.py collectstatic --noinput
```

---

## Example

```bash
$ docker-compose up
[+] Building 5.1s (10/10)
[+] Running 'ft_transcendence' on http://localhost:8080
```

Access the site in your browser:

```
http://localhost:8080
```

Log in, challenge a friend, or join a multiplayer match!

---

## Security & Privacy

This project follows **best practices for web security**:

* HTTPS and secure cookies
* Strong password hashing (bcrypt / argon2)
* CSRF & XSS protection
* Two-Factor Authentication (2FA)
* Role-based user management

---

## Technical Implementation

* **Backend:** Django, Django Channels, REST Framework
* **Frontend:** HTML5, CSS3, JavaScript
* **Database:** PostgreSQL
* **WebSockets:** Real-time gameplay and messaging
* **Reverse Proxy:** Nginx
* **Deployment:** Docker / Docker Compose
* **Secrets Management:** HashiCorp Vault
* **Authentication:** OAuth2, JWT, 2FA

---

## License

Educational Project – 42 School

```
