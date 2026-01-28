# Docker Guide - Hindi 🐳🇮🇳

## 🎯 Docker Kya Hai?

**Docker** ek tool hai jo tumhare application ko ek **portable container** mein pack kar deta hai.

### Simple Example:
```
Tiffin Box 🍱 = Docker Container

Tiffin Box:
- Ghar se office le jao
- Kahi bhi khao
- Same taste, same quality

Docker Container:
- Laptop se server pe le jao
- Kahi bhi run karo
- Same environment, same result
```

---

## 🤔 Docker Kyun Chahiye?

### Problem 1: "Mere Laptop Pe Chal Raha Hai!" 😭

```
Bina Docker:
Tumhara Laptop:
- Node.js 18 ✅
- MySQL 8 ✅
- Redis 7 ✅
Application: Works! 🎉

Production Server:
- Node.js 16 ❌
- MySQL 5 ❌
- Redis 6 ❌
Application: Breaks! 💥

Result: "But it works on my machine!" 😭
```

```
Docker ke saath:
Tumhara Laptop: Docker Container ✅
Production Server: Same Docker Container ✅
Result: Works everywhere! 🎉
```

### Problem 2: Setup Bahut Time Lagta Hai 😫

```
Traditional Setup:
1. Node.js download karo (30 min)
2. MySQL install karo (20 min)
3. Redis install karo (15 min)
4. Configure karo (30 min)
5. Dependencies install karo (20 min)
6. Database setup karo (15 min)
Total: 2-3 hours 😫

Docker Setup:
docker-compose up
Total: 5 minutes 🚀
```

### Problem 3: Multiple Projects Conflict 😵

```
Bina Docker:
Project A needs: Node 14, MySQL 5
Project B needs: Node 18, MySQL 8
Conflict! Ek hi machine pe dono nahi chal sakte ❌

Docker ke saath:
Project A: Apna container ✅
Project B: Apna container ✅
No conflict! Dono chal sakte hain 🎉
```

---

## 🎁 Docker Ke Fayde

### 1. **Portable** 📦
```
Laptop → Server → Cloud
Same container, same result!
```

### 2. **Fast Setup** ⚡
```
New developer join kiya?
docker-compose up
5 minutes mein ready! 🚀
```

### 3. **Isolated** 🔒
```
Har project apne container mein
No conflicts, no mess!
```

### 4. **Easy Deployment** 🚀
```
Production pe deploy:
1. docker build
2. docker push
3. docker run
Done! 🎉
```

### 5. **Scalable** 📈
```
Traffic badh gaya?
docker-compose scale app=5
5 instances run ho jayenge!
```

---

## 🛠️ Installation

### Windows:
1. Docker Desktop download karo: https://www.docker.com/products/docker-desktop
2. Install karo
3. Restart karo
4. Check karo: `docker --version`

### Verify:
```bash
docker --version
docker-compose --version
```

---

## 🚀 Kaise Use Kare?

### Step 1: Start Karo (Sabse Easy!)
```bash
cd backend
docker-compose up
```

Ye command automatically:
1. MySQL start karega ✅
2. Redis start karega ✅
3. Backend start karega ✅
4. Database setup karega ✅

### Step 2: Test Karo
```bash
# Browser mein kholo
http://localhost:5000

# Ya curl se test karo
curl http://localhost:5000/api/v1/health
```

### Step 3: Stop Karo
```bash
docker-compose down
```

---

## 📋 Important Commands

### Start/Stop
```bash
# Start (foreground)
docker-compose up

# Start (background)
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Fresh start (database bhi clear)
docker-compose down -v
docker-compose up
```

### Logs Dekho
```bash
# Saare services ke logs
docker-compose logs -f

# Sirf backend ke logs
docker-compose logs -f app

# Sirf MySQL ke logs
docker-compose logs -f mysql

# Last 100 lines
docker-compose logs --tail=100 app
```

### Container Mein Jao
```bash
# Backend container
docker-compose exec app sh

# MySQL
docker-compose exec mysql mysql -u root -proot123

# Redis
docker-compose exec redis redis-cli
```

### Status Check
```bash
# Kya chal raha hai?
docker-compose ps

# Detailed info
docker ps
```

---

## 🔍 Debugging

### Problem: Container start nahi ho raha

```bash
# Logs dekho
docker-compose logs app

# Error kya hai?
docker-compose ps
```

### Problem: Database connect nahi ho raha

```bash
# MySQL running hai?
docker-compose ps mysql

# MySQL logs dekho
docker-compose logs mysql

# MySQL mein jao
docker-compose exec mysql mysql -u taponn -ptaponn123 scancard
SHOW TABLES;
```

### Problem: Port already in use

```bash
# Port change karo docker-compose.yml mein
ports:
  - "5001:5000"  # 5000 ki jagah 5001 use karo
```

---

## 📦 Kya Kya Chal Raha Hai?

### 3 Services:

1. **MySQL Database** (Port 3306)
   - Database: scancard
   - User: taponn
   - Password: taponn123

2. **Redis Cache** (Port 6379)
   - In-memory cache

3. **Backend API** (Port 5000)
   - Node.js application

---

## 💾 Data Kahan Store Hota Hai?

### Volumes (Permanent Storage):
```
mysql_data/     → MySQL database files
redis_data/     → Redis persistence
uploads/        → Uploaded files
logs/           → Application logs
```

### Backup Kaise Le?
```bash
# Database backup
docker-compose exec mysql mysqldump -u root -proot123 scancard > backup.sql

# Restore
docker-compose exec -T mysql mysql -u root -proot123 scancard < backup.sql
```

---

## 🎯 Development vs Production

### Development (Laptop):
```bash
# docker-compose.yml use karo
docker-compose up

# Code change karo, auto-reload
```

### Production (Server):
```bash
# Background mein run karo
docker-compose up -d

# Logs monitor karo
docker-compose logs -f
```

---

## 🧹 Clean Up

### Sab kuch band karo
```bash
docker-compose down
```

### Database bhi delete karo
```bash
docker-compose down -v
```

### Sab kuch delete karo (images bhi)
```bash
docker-compose down --rmi all
docker system prune -a
```

---

## 🎓 Docker Concepts (Simple)

### Image vs Container
```
Image = Recipe (Tarika)
Container = Dish (Actual khana)

Example:
Image: taponn-backend (blueprint)
Container: taponn-backend-1 (running instance)
```

### Dockerfile
```dockerfile
FROM node:18          # Base (Node.js install hai)
WORKDIR /app          # Folder
COPY . .              # Code copy karo
RUN npm install       # Dependencies install
CMD ["node", "app.js"] # Start karo
```

### Docker Compose
```yaml
services:             # Multiple containers
  mysql:              # Database
  redis:              # Cache
  app:                # Backend
```

---

## ✅ Quick Commands Cheat Sheet

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f app

# Status
docker-compose ps

# Restart
docker-compose restart app

# Clean
docker system prune -a

# Shell
docker-compose exec app sh

# MySQL
docker-compose exec mysql mysql -u root -proot123

# Redis
docker-compose exec redis redis-cli
```

---

## 🚨 Common Problems & Solutions

### 1. Port already in use
```bash
# Solution: Port change karo
ports:
  - "5001:5000"
```

### 2. Container crash ho raha hai
```bash
# Solution: Logs dekho
docker-compose logs app
```

### 3. Database connect nahi ho raha
```bash
# Solution: Wait karo, MySQL start hone mein time lagta hai
docker-compose up --wait
```

### 4. Disk space full
```bash
# Solution: Clean up
docker system prune -a
```

---

## 🎯 Tumhare Project Ke Liye

### Files Created:
1. **Dockerfile** - Backend container configuration
2. **docker-compose.yml** - All services configuration
3. **.dockerignore** - Ignore files

### Kaise Use Kare:
```bash
# 1. Backend folder mein jao
cd backend

# 2. Start karo
docker-compose up

# 3. Test karo
curl http://localhost:5000/api/v1/health

# 4. Stop karo
docker-compose down
```

---

## 💡 Pro Tips

1. **Background mein run karo**: `docker-compose up -d`
2. **Logs monitor karo**: `docker-compose logs -f`
3. **Fresh start**: `docker-compose down -v && docker-compose up`
4. **Database backup**: Regular backups lo
5. **Clean up**: `docker system prune` regularly

---

## 🎉 Summary

### Docker Kya Karta Hai?
✅ Application ko portable banata hai
✅ Setup time 2 hours se 5 minutes
✅ "Works on my machine" problem solve
✅ Easy deployment
✅ Scalable

### Tumhe Kya Karna Hai?
```bash
1. Docker install karo
2. cd backend
3. docker-compose up
4. Done! 🎉
```

---

**Docker = Easy Life! 🐳🚀**
