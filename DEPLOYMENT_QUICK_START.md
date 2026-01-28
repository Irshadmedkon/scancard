# Production Deployment - Quick Start 🚀

## 🎯 Choose Your Path

### Path 1: Cheapest ($5/month) 💰
**DigitalOcean Basic Droplet**
- Perfect for: Small projects, testing
- Setup time: 30 minutes
- [Jump to instructions](#cheapest-deployment-5month)

### Path 2: Recommended ($12-32/month) ⭐
**DigitalOcean Standard + Managed DB**
- Perfect for: Production apps
- Setup time: 1 hour
- [Jump to instructions](#recommended-deployment-12-32month)

### Path 3: Enterprise ($80+/month) 🏢
**AWS Full Stack**
- Perfect for: Large scale, high traffic
- Setup time: 2-3 hours
- [Jump to instructions](#enterprise-deployment-80month)

---

## Cheapest Deployment ($5/month)

### What You Get:
- 1GB RAM, 1 vCPU
- 25GB SSD
- 1TB Transfer
- All in Docker

### Steps:

```bash
# 1. Create DigitalOcean Droplet ($5/month)
# Choose: Ubuntu 22.04, Basic plan

# 2. SSH into server
ssh root@your-server-ip

# 3. Install Docker
curl -fsSL https://get.docker.com | sh

# 4. Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 5. Clone your code
git clone https://github.com/your-repo/taponn-backend.git
cd taponn-backend/backend

# 6. Start everything
docker-compose up -d

# 7. Done! Test it
curl http://your-server-ip:5000/health
```

### Add Domain (Optional):
```bash
# Point domain to server IP
# Install Nginx
apt install nginx -y

# Setup reverse proxy
nano /etc/nginx/sites-available/default

# Add:
location / {
    proxy_pass http://localhost:5000;
}

# Restart
systemctl restart nginx

# Add SSL (FREE)
apt install certbot python3-certbot-nginx -y
certbot --nginx -d yourdomain.com
```

**Total Time: 30 minutes**
**Total Cost: $5/month**

---

## Recommended Deployment ($12-32/month)

### What You Get:
- 2GB RAM, 1 vCPU Droplet ($12)
- Managed MySQL Database ($15) - Optional
- Better performance & reliability

### Steps:

```bash
# 1. Create Droplet ($12/month)
# Choose: Ubuntu 22.04, 2GB RAM

# 2. Setup Docker (same as above)
curl -fsSL https://get.docker.com | sh
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 3. Clone code
git clone https://github.com/your-repo/taponn-backend.git
cd taponn-backend/backend

# 4. Create Managed Database (Optional but recommended)
# DigitalOcean Console → Databases → Create
# Choose: MySQL 8, Basic $15/month

# 5. Update docker-compose.yml
# Comment out MySQL service
# Update environment variables:
DB_HOST=your-managed-db-host
DB_PORT=25060
DB_USER=doadmin
DB_PASSWORD=your-password

# 6. Start services
docker-compose up -d

# 7. Setup Nginx + SSL
apt install nginx certbot python3-certbot-nginx -y

# 8. Configure Nginx
nano /etc/nginx/sites-available/taponn

# Add:
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Enable
ln -s /etc/nginx/sites-available/taponn /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# 9. Get SSL
certbot --nginx -d yourdomain.com

# 10. Setup Automated Backups
# Create backup script
nano /root/backup.sh

# Add:
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec taponn-mysql mysqldump -u taponn -ptaponn123 scancard | gzip > /backups/backup_$DATE.sql.gz
find /backups -name "*.sql.gz" -mtime +7 -delete

# Make executable
chmod +x /root/backup.sh

# Add to cron (daily 2 AM)
crontab -e
# Add: 0 2 * * * /root/backup.sh
```

**Total Time: 1 hour**
**Total Cost: $12-32/month**

---

## Enterprise Deployment ($80/month)

### What You Get:
- AWS EC2 t3.medium ($30)
- RDS MySQL ($15)
- ElastiCache Redis ($15)
- Application Load Balancer ($20)
- Auto-scaling, High availability

### Steps:

```bash
# 1. Create EC2 Instance
# AWS Console → EC2 → Launch Instance
# Type: t3.medium (2 vCPU, 4GB RAM)
# OS: Ubuntu 22.04
# Security Group: 22, 80, 443, 5000

# 2. Create RDS Database
# AWS Console → RDS → Create Database
# Engine: MySQL 8.0
# Instance: db.t3.micro
# Enable automated backups

# 3. Create ElastiCache Redis
# AWS Console → ElastiCache → Create
# Engine: Redis 7.x
# Node: cache.t3.micro

# 4. SSH into EC2
ssh -i your-key.pem ubuntu@ec2-ip

# 5. Install Docker
curl -fsSL https://get.docker.com | sh
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 6. Clone code
git clone https://github.com/your-repo/taponn-backend.git
cd taponn-backend/backend

# 7. Update docker-compose.yml
# Remove MySQL and Redis services
# Update environment:
DB_HOST=your-rds-endpoint
REDIS_HOST=your-elasticache-endpoint

# 8. Start backend only
docker-compose up -d app

# 9. Create Application Load Balancer
# AWS Console → EC2 → Load Balancers → Create
# Type: Application Load Balancer
# Target: EC2 instance port 5000

# 10. Setup Auto Scaling
# AWS Console → EC2 → Auto Scaling Groups
# Min: 2, Max: 10
# Target: CPU 70%

# 11. Setup CloudWatch Monitoring
# Automatic with AWS services

# 12. Setup Route 53 (DNS)
# Point domain to Load Balancer
```

**Total Time: 2-3 hours**
**Total Cost: $80+/month**

---

## 🔄 CI/CD Setup (All Paths)

### GitHub Actions (5 minutes)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          cd /app/taponn-backend/backend
          git pull
          docker-compose up -d --build
```

Add secrets in GitHub:
- `SERVER_HOST`: Your server IP
- `SERVER_USER`: root or ubuntu
- `SSH_PRIVATE_KEY`: Your SSH private key

**Done! Now every push auto-deploys!** 🎉

---

## 📊 Monitoring Setup (10 minutes)

### Simple Monitoring (Free)

```bash
# 1. Install monitoring script
nano /root/monitor.sh

# Add:
#!/bin/bash
echo "=== System Status ==="
docker ps
echo ""
echo "=== Disk Usage ==="
df -h
echo ""
echo "=== Memory Usage ==="
free -h
echo ""
echo "=== CPU Usage ==="
top -bn1 | head -20

# Make executable
chmod +x /root/monitor.sh

# Run daily
crontab -e
# Add: 0 9 * * * /root/monitor.sh | mail -s "Daily Status" your@email.com
```

### Professional Monitoring (Grafana)

```yaml
# Add to docker-compose.yml:
  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  grafana_data:
```

Access: `http://your-server:3000`
Default: admin/admin

---

## 💾 Backup Setup (5 minutes)

```bash
# 1. Create backup directory
mkdir -p /backups

# 2. Create backup script
nano /root/backup.sh

# Add:
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec taponn-mysql mysqldump -u taponn -ptaponn123 scancard | gzip > /backups/backup_$DATE.sql.gz
find /backups -name "*.sql.gz" -mtime +7 -delete
echo "Backup completed: backup_$DATE.sql.gz"

# 3. Make executable
chmod +x /root/backup.sh

# 4. Test it
./backup.sh

# 5. Schedule daily (2 AM)
crontab -e
# Add: 0 2 * * * /root/backup.sh >> /var/log/backup.log 2>&1

# 6. Verify
ls -lh /backups/
```

---

## 🔐 Security Checklist

```bash
# 1. Update system
apt update && apt upgrade -y

# 2. Setup firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable

# 3. Change default passwords
# Update .env file with strong passwords

# 4. Disable root SSH (optional)
nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
systemctl restart sshd

# 5. Install fail2ban
apt install fail2ban -y
systemctl enable fail2ban

# 6. Setup SSL
certbot --nginx -d yourdomain.com
```

---

## 📋 Post-Deployment Checklist

- [ ] Server accessible via SSH
- [ ] Docker containers running
- [ ] Health endpoint working: `/health`
- [ ] API endpoints working
- [ ] Database connected
- [ ] Redis connected
- [ ] Domain pointing to server
- [ ] SSL certificate installed (HTTPS)
- [ ] Nginx reverse proxy working
- [ ] Backups scheduled
- [ ] Monitoring setup
- [ ] Firewall configured
- [ ] CI/CD pipeline working

---

## 🚨 Troubleshooting

### Container won't start:
```bash
docker logs taponn-backend
docker-compose logs
```

### Can't connect to database:
```bash
docker exec -it taponn-mysql mysql -u taponn -ptaponn123
# Check if database exists
SHOW DATABASES;
```

### Port already in use:
```bash
# Find process
netstat -tulpn | grep :5000
# Kill it
kill -9 <PID>
```

### Out of disk space:
```bash
# Clean Docker
docker system prune -a
# Clean logs
truncate -s 0 /var/log/*.log
```

---

## 💡 Quick Commands Reference

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Logs
docker-compose logs -f

# Update
git pull && docker-compose up -d --build

# Backup
./backup.sh

# Status
docker ps
systemctl status nginx
```

---

## 📞 Need Help?

- **Documentation**: Check PRODUCTION_DEPLOYMENT_GUIDE.md
- **Hindi Guide**: Check PRODUCTION_DEPLOYMENT_HINDI.md
- **Docker Issues**: `docker logs <container-name>`
- **Server Issues**: Check `/var/log/syslog`

---

**Choose your path and deploy in 30 minutes to 3 hours! 🚀**
