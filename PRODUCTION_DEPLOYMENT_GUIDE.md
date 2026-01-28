# Production Deployment Guide 🚀

## 📋 Table of Contents

1. [AWS Deployment](#aws-deployment)
2. [DigitalOcean Deployment](#digitalocean-deployment)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Monitoring & Logging](#monitoring--logging)
5. [Scaling & Load Balancing](#scaling--load-balancing)
6. [Automated Backups](#automated-backups)

---

## 1. AWS Deployment 🌐

### Option A: AWS EC2 (Simple)

#### Step 1: Launch EC2 Instance
```bash
# Instance Type: t3.medium (2 vCPU, 4GB RAM)
# OS: Ubuntu 22.04 LTS
# Storage: 30GB SSD
# Security Group: Allow ports 22, 80, 443, 5000
```

#### Step 2: Connect & Setup
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again
exit
```

#### Step 3: Deploy Application
```bash
# Clone repository
git clone https://github.com/your-repo/taponn-backend.git
cd taponn-backend/backend

# Create .env file
nano .env
# Add production environment variables

# Start containers
docker-compose up -d

# Check status
docker ps
```

#### Step 4: Setup Nginx Reverse Proxy
```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/taponn

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/taponn /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 5: Setup SSL (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

### Option B: AWS ECS (Container Service)

#### Step 1: Create ECR Repository
```bash
# Create repository
aws ecr create-repository --repository-name taponn-backend

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push image
docker build -t taponn-backend .
docker tag taponn-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/taponn-backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/taponn-backend:latest
```

#### Step 2: Create ECS Cluster
```bash
# Create cluster
aws ecs create-cluster --cluster-name taponn-cluster

# Create task definition (JSON file)
# See ecs-task-definition.json below
```

#### Step 3: Create RDS Database
```bash
# Create MySQL RDS instance
# Instance: db.t3.micro
# Engine: MySQL 8.0
# Storage: 20GB
# Enable automated backups
```

#### Step 4: Create ElastiCache Redis
```bash
# Create Redis cluster
# Node type: cache.t3.micro
# Engine: Redis 7.x
```

### Option C: AWS Elastic Beanstalk (Easiest)

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p docker taponn-backend

# Create environment
eb create taponn-production

# Deploy
eb deploy

# Open in browser
eb open
```

---

## 2. DigitalOcean Deployment 🌊

### Step 1: Create Droplet
```bash
# Droplet Size: Basic - $12/month (2GB RAM, 1 vCPU)
# OS: Ubuntu 22.04 LTS
# Add SSH key
```

### Step 2: Setup Docker
```bash
# SSH into droplet
ssh root@your-droplet-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### Step 3: Deploy Application
```bash
# Clone repository
git clone https://github.com/your-repo/taponn-backend.git
cd taponn-backend/backend

# Create production docker-compose
nano docker-compose.prod.yml

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### Step 4: Setup Managed Database (Optional)
```bash
# Create Managed MySQL Database
# Size: Basic - $15/month
# Version: MySQL 8

# Update docker-compose.yml to use managed database
DB_HOST=your-managed-db-host
DB_PORT=25060
```

### Step 5: Setup Domain & SSL
```bash
# Point domain to droplet IP
# Install Nginx and Certbot (same as AWS steps above)
```

---

## 3. CI/CD Pipeline 🔄

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push Docker image
      run: |
        cd backend
        docker build -t yourusername/taponn-backend:latest .
        docker push yourusername/taponn-backend:latest
    
    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          cd /app/taponn-backend/backend
          docker-compose pull
          docker-compose up -d
          docker system prune -f
```

### GitLab CI/CD

Create `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - test
  - deploy

build:
  stage: build
  script:
    - docker build -t taponn-backend .
    - docker tag taponn-backend registry.gitlab.com/youruser/taponn-backend:latest
    - docker push registry.gitlab.com/youruser/taponn-backend:latest

test:
  stage: test
  script:
    - npm install
    - npm test

deploy:
  stage: deploy
  only:
    - main
  script:
    - ssh user@server "cd /app && docker-compose pull && docker-compose up -d"
```

---

## 4. Monitoring & Logging 📊

### Option A: PM2 + Winston (Simple)

Already implemented in your app! Just need to:

```bash
# View logs
docker logs -f taponn-backend

# Or use PM2 inside container
docker exec -it taponn-backend pm2 logs
```

### Option B: ELK Stack (Elasticsearch, Logstash, Kibana)

Add to `docker-compose.yml`:

```yaml
  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  kibana:
    image: kibana:8.11.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  logstash:
    image: logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch
```

### Option C: Grafana + Prometheus

```yaml
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    depends_on:
      - prometheus
```

### Option D: Cloud Services

**AWS CloudWatch**:
```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
```

**Datadog**:
```bash
# Add to docker-compose.yml
  datadog:
    image: datadog/agent:latest
    environment:
      - DD_API_KEY=${DATADOG_API_KEY}
      - DD_SITE=datadoghq.com
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
```

---

## 5. Scaling & Load Balancing ⚖️

### Option A: Nginx Load Balancer

```nginx
upstream backend {
    least_conn;
    server backend1:5000;
    server backend2:5000;
    server backend3:5000;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Option B: Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml taponn

# Scale service
docker service scale taponn_app=5
```

### Option C: Kubernetes

Create `k8s-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: taponn-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: taponn-backend
  template:
    metadata:
      labels:
        app: taponn-backend
    spec:
      containers:
      - name: backend
        image: taponn-backend:latest
        ports:
        - containerPort: 5000
---
apiVersion: v1
kind: Service
metadata:
  name: taponn-service
spec:
  type: LoadBalancer
  selector:
    app: taponn-backend
  ports:
  - port: 80
    targetPort: 5000
```

### Option D: AWS Auto Scaling

```bash
# Create Auto Scaling Group
# Min: 2 instances
# Max: 10 instances
# Target CPU: 70%
# Health check: ELB
```

---

## 6. Automated Backups 💾

### Database Backup Script

Create `backup.sh`:

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="taponn-mysql"
DB_NAME="scancard"
DB_USER="taponn"
DB_PASS="taponn123"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
docker exec $CONTAINER_NAME mysqldump -u$DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-bucket/backups/

# Delete old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.sql.gz"
```

### Setup Cron Job

```bash
# Make script executable
chmod +x backup.sh

# Add to crontab
crontab -e

# Add line (daily at 2 AM)
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

### Automated Backup with Docker

Add to `docker-compose.yml`:

```yaml
  backup:
    image: fradelg/mysql-cron-backup
    environment:
      - MYSQL_HOST=mysql
      - MYSQL_USER=taponn
      - MYSQL_PASS=taponn123
      - MYSQL_DATABASE=scancard
      - CRON_TIME=0 2 * * *
      - TIMEOUT=10m
    volumes:
      - ./backups:/backup
    depends_on:
      - mysql
```

### AWS RDS Automated Backups

```bash
# Enable automated backups
aws rds modify-db-instance \
  --db-instance-identifier taponn-db \
  --backup-retention-period 7 \
  --preferred-backup-window "02:00-03:00"
```

---

## 📋 Production Checklist

### Before Deployment:

- [ ] Environment variables configured
- [ ] Database credentials secured
- [ ] JWT secret changed
- [ ] CORS origins configured
- [ ] Rate limiting enabled
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Firewall rules set
- [ ] Backup strategy in place
- [ ] Monitoring setup
- [ ] Error tracking enabled
- [ ] Load testing done

### After Deployment:

- [ ] Health checks passing
- [ ] All endpoints working
- [ ] Database connected
- [ ] Redis connected
- [ ] Logs accessible
- [ ] Backups running
- [ ] Monitoring active
- [ ] SSL working
- [ ] Performance acceptable
- [ ] Security scan passed

---

## 🔐 Security Best Practices

1. **Use Environment Variables**: Never hardcode secrets
2. **Enable HTTPS**: Always use SSL/TLS
3. **Update Dependencies**: Regular security updates
4. **Rate Limiting**: Prevent abuse
5. **Input Validation**: Sanitize all inputs
6. **Database Security**: Use strong passwords, limit access
7. **Firewall**: Only open necessary ports
8. **Monitoring**: Track suspicious activity
9. **Backups**: Regular automated backups
10. **Audit Logs**: Track all important actions

---

## 💰 Cost Estimation

### AWS (Monthly):
- EC2 t3.medium: $30
- RDS db.t3.micro: $15
- ElastiCache: $15
- Load Balancer: $20
- S3 Storage: $5
- **Total: ~$85/month**

### DigitalOcean (Monthly):
- Droplet (2GB): $12
- Managed Database: $15
- Spaces (Storage): $5
- Load Balancer: $12
- **Total: ~$44/month**

### Minimal Setup:
- Single VPS: $5-12/month
- Domain: $10/year
- SSL: Free (Let's Encrypt)
- **Total: ~$5-12/month**

---

## 📚 Additional Resources

- [Docker Production Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [12 Factor App](https://12factor.net/)

---

**Ready for production! 🚀**
