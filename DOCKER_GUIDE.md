# Docker Setup Guide - Taponn Backend 🐳

## 🎯 Docker Kya Hai?

Docker ek **container platform** hai jo tumhare application ko ek portable package mein bundle kar deta hai.

### Simple Analogy:
```
Docker Container = Shipping Container 📦

Shipping Container:
- Kuch bhi daal do (furniture, electronics, etc.)
- Kisi bhi ship/truck pe load karo
- Kahin bhi bhejo
- Same condition mein pahunchega

Docker Container:
- Application + Dependencies
- Kisi bhi server pe run karo
- Same environment everywhere
- "Works on my machine" problem solved!
```

---

## 🚀 Docker Ke Fayde

### 1. **Consistent Environment**
```
Without Docker:
Dev: Node 18, MySQL 8 ✅
Prod: Node 16, MySQL 5 ❌
Result: Breaks! 😭

With Docker:
Dev: Same container ✅
Prod: Same container ✅
Result: Works! 🎉
```

### 2. **Easy Setup**
```
Traditional Setup:
1. Install Node.js
2. Install MySQL
3. Install Redis
4. Configure everything
5. Install dependencies
Time: 2-3 hours 😫

Docker Setup:
docker-compose up
Time: 5 minutes 🚀
```

### 3. **Isolation**
```
Multiple Projects:
Project A: Node 14, MySQL 5
Project B: Node 18, MySQL 8
No conflicts! ✅
```

### 4. **Easy Deployment**
```
Deploy to Production:
1. docker build
2. docker push
3. docker run
Done! 🎉
```

---

## 📦 Project Structure

```
backend/
├── Dockerfile              # Backend app container
├── docker-compose.yml      # All services configuration
├── .dockerignore          # Files to ignore
└── src/                   # Application code
```

---

## 🛠️ Installation

### Step 1: Install Docker

#### Windows:
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Install and restart
3. Verify: `docker --version`

#### Mac:
```bash
brew install --cask docker
```

#### Linux:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Step 2: Verify Installation
```bash
docker --version
docker-compose --version
```

---

## 🚀 Quick Start

### Method 1: Docker Compose (Recommended)

```bash
# Start all services (MySQL + Redis + Backend)
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

### Method 2: Individual Containers

```bash
# Build backend image
docker build -t taponn-backend .

# Run MySQL
docker run -d --name mysql \
  -e MYSQL_ROOT_PASSWORD=root123 \
  -e MYSQL_DATABASE=scancard \
  -p 3306:3306 \
  mysql:8.0

# Run Redis
docker run -d --name redis \
  -p 6379:6379 \
  redis:7-alpine

# Run Backend
docker run -d --name backend \
  -p 5000:5000 \
  --link mysql:mysql \
  --link redis:redis \
  taponn-backend
```

---

## 📋 Docker Compose Services

### 1. MySQL Database
```yaml
Service: mysql
Port: 3306
Database: scancard
User: taponn
Password: taponn123
```

### 2. Redis Cache
```yaml
Service: redis
Port: 6379
```

### 3. Backend API
```yaml
Service: app
Port: 5000
Depends on: mysql, redis
```

---

## 🔧 Common Commands

### Start/Stop
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart app

# Rebuild and start
docker-compose up --build
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f mysql
docker-compose logs -f redis

# Last 100 lines
docker-compose logs --tail=100 app
```

### Execute Commands
```bash
# Enter backend container
docker-compose exec app sh

# Enter MySQL
docker-compose exec mysql mysql -u root -p

# Enter Redis
docker-compose exec redis redis-cli

# Run npm commands
docker-compose exec app npm install
docker-compose exec app npm test
```

### Check Status
```bash
# List running containers
docker-compose ps

# Check health
docker-compose ps
```

### Clean Up
```bash
# Stop and remove containers
docker-compose down

# Remove volumes (database data)
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Remove everything
docker system prune -a
```

---

## 🔍 Debugging

### Check Container Logs
```bash
docker-compose logs app
```

### Enter Container
```bash
docker-compose exec app sh
ls -la
cat .env
```

### Check Database
```bash
docker-compose exec mysql mysql -u taponn -ptaponn123 scancard
SHOW TABLES;
SELECT * FROM users;
```

### Check Redis
```bash
docker-compose exec redis redis-cli
KEYS *
GET profile:1
```

### Check Network
```bash
docker network ls
docker network inspect taponn-network
```

---

## 🌐 Access Services

After `docker-compose up`:

- **Backend API**: http://localhost:5000
- **MySQL**: localhost:3306
- **Redis**: localhost:6379

Test API:
```bash
curl http://localhost:5000/api/v1/health
```

---

## 📊 Production Deployment

### Step 1: Build Image
```bash
docker build -t taponn-backend:v1.0 .
```

### Step 2: Push to Registry
```bash
# Docker Hub
docker tag taponn-backend:v1.0 username/taponn-backend:v1.0
docker push username/taponn-backend:v1.0

# AWS ECR
aws ecr get-login-password | docker login --username AWS --password-stdin
docker tag taponn-backend:v1.0 account.dkr.ecr.region.amazonaws.com/taponn:v1.0
docker push account.dkr.ecr.region.amazonaws.com/taponn:v1.0
```

### Step 3: Deploy on Server
```bash
# Pull and run
docker pull username/taponn-backend:v1.0
docker-compose up -d
```

---

## 🔐 Environment Variables

Edit `docker-compose.yml` to change:

```yaml
environment:
  # Database
  DB_HOST: mysql
  DB_USER: taponn
  DB_PASSWORD: taponn123
  
  # JWT
  JWT_SECRET: change-this-in-production
  
  # Email
  EMAIL_HOST: smtp.gmail.com
  EMAIL_USER: your-email@gmail.com
```

Or use `.env` file:
```bash
# Create .env file
cp .env.example .env

# Edit values
nano .env

# Docker Compose will automatically use it
docker-compose up
```

---

## 💾 Data Persistence

### Volumes:
```yaml
volumes:
  mysql_data:    # MySQL database files
  redis_data:    # Redis persistence
  ./uploads:     # Uploaded files
  ./logs:        # Application logs
```

### Backup Database:
```bash
# Backup
docker-compose exec mysql mysqldump -u root -proot123 scancard > backup.sql

# Restore
docker-compose exec -T mysql mysql -u root -proot123 scancard < backup.sql
```

---

## 🎯 Development vs Production

### Development:
```bash
# Use docker-compose.yml
docker-compose up

# Hot reload with volumes
volumes:
  - ./src:/app/src
```

### Production:
```bash
# Use docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d

# No source code volumes
# Use environment variables
# Enable health checks
```

---

## 🚨 Troubleshooting

### Port Already in Use
```bash
# Find process
netstat -ano | findstr :5000

# Kill process
taskkill /PID <pid> /F

# Or change port in docker-compose.yml
ports:
  - "5001:5000"
```

### Container Won't Start
```bash
# Check logs
docker-compose logs app

# Check health
docker-compose ps

# Rebuild
docker-compose up --build
```

### Database Connection Failed
```bash
# Check MySQL is running
docker-compose ps mysql

# Check logs
docker-compose logs mysql

# Wait for MySQL to be ready
docker-compose up --wait
```

### Out of Disk Space
```bash
# Clean up
docker system prune -a

# Remove unused volumes
docker volume prune
```

---

## 📚 Docker Concepts

### Image vs Container
```
Image = Class (Blueprint)
Container = Object (Instance)

Image: taponn-backend
Container: taponn-backend-1, taponn-backend-2
```

### Dockerfile
```dockerfile
FROM node:18          # Base image
WORKDIR /app          # Working directory
COPY . .              # Copy files
RUN npm install       # Build step
CMD ["node", "app.js"] # Start command
```

### Docker Compose
```yaml
services:             # Multiple containers
  app:                # Service name
    build: .          # Build from Dockerfile
    ports:            # Port mapping
      - "5000:5000"
    depends_on:       # Dependencies
      - mysql
```

---

## 🎓 Best Practices

1. **Use .dockerignore**: Exclude unnecessary files
2. **Multi-stage builds**: Smaller images
3. **Health checks**: Monitor container health
4. **Volumes**: Persist data
5. **Networks**: Isolate services
6. **Environment variables**: Configuration
7. **Logging**: Centralized logs
8. **Security**: Don't run as root

---

## 📖 Learning Resources

- Docker Docs: https://docs.docker.com
- Docker Hub: https://hub.docker.com
- Docker Compose: https://docs.docker.com/compose
- Best Practices: https://docs.docker.com/develop/dev-best-practices

---

## ✅ Quick Reference

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f app

# Rebuild
docker-compose up --build

# Clean
docker system prune -a

# Status
docker-compose ps

# Shell
docker-compose exec app sh
```

---

**Docker makes deployment easy! 🐳🚀**
