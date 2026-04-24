# Docker Deployment Guide

This guide covers the complete process of deploying the Mobility Partner application using Docker on your server.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Server Setup](#initial-server-setup)
3. [Migrating from PM2 to Docker](#migrating-from-pm2-to-docker)
4. [Deploying the Application](#deploying-the-application)
5. [Updating the Application](#updating-the-application)
6. [Database Management](#database-management)
7. [Troubleshooting](#troubleshooting)
8. [Useful Commands](#useful-commands)

---

## Prerequisites

### Required Software
- Docker Engine (20.10 or higher)
- Docker Compose (v2.0 or higher)
- Git

### Install Docker on Server

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group (to run docker without sudo)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installations
docker --version
docker compose version
```

**Important:** Log out and log back in for the group membership to take effect.

---

## Initial Server Setup

### 1. Clone Your Repository

```bash
cd /path/to/your/projects
git clone <your-repository-url> Mobilitypartner
cd Mobilitypartner
```

### 2. Create Production Environment File

```bash
# Copy the example file
cp .env.production.example .env.production

# Edit the file with your actual values
nano .env.production
```

**Important Environment Variables to Update:**

```env
# Database (use strong passwords!)
DB_USERNAME=postgres
DB_PASSWORD=YOUR_STRONG_PASSWORD_HERE
DB_NAME=mobility_partner

# Authentication (generate a secure random string)
JWT_SECRET=YOUR_SECURE_JWT_SECRET_32_CHARS_MINIMUM

# Email Configuration
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password

# API Keys
HELLOSMS_API_TOKEN=your-actual-token
BILUPPGIFTER_API_KEY=your-actual-key

# Domain
COOKIE_DOMAIN=".yourdomain.com"
```

**Generate secure secrets:**

```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate strong password
openssl rand -base64 24
```

### 3. Make Deployment Scripts Executable

```bash
chmod +x deploy.sh quick-deploy.sh
```

---

## Migrating from PM2 to Docker

### 1. Backup Your Current Database

**IMPORTANT:** Before migrating, backup your existing PostgreSQL database!

```bash
# Backup database
pg_dump -U postgres -d mobility_partner > backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup file was created
ls -lh backup_*.sql
```

### 2. Stop PM2 Application

```bash
# List running PM2 processes
pm2 list

# Stop your application
pm2 stop all

# Remove from PM2 (optional)
pm2 delete all

# Save PM2 state (in case you want to rollback)
pm2 save
```

### 3. Stop and Disable Manual PostgreSQL

```bash
# Stop PostgreSQL service
sudo systemctl stop postgresql

# Disable PostgreSQL from starting on boot (optional)
sudo systemctl disable postgresql

# Check status
sudo systemctl status postgresql
```

### 4. Import Database to Docker

After starting Docker containers (see next section), restore your database:

```bash
# First, start the containers
docker-compose up -d

# Wait for database to be ready (check with)
docker-compose logs postgres

# Restore the backup
docker exec -i mobility-postgres psql -U postgres -d mobility_partner < backup_YYYYMMDD_HHMMSS.sql

# Verify data was imported
docker exec -it mobility-postgres psql -U postgres -d mobility_partner -c "SELECT COUNT(*) FROM \"user\";"
```

---

## Deploying the Application

### First Time Deployment

```bash
# 1. Build and start containers
docker-compose up -d

# 2. Check container status
docker-compose ps

# 3. View logs to ensure everything is working
docker-compose logs -f

# 4. Test the application
curl http://localhost:3000
```

### Verify Database Connection

```bash
# Check if Prisma migrations ran successfully
docker-compose logs app | grep -i "migration"

# Connect to database
docker exec -it mobility-postgres psql -U postgres -d mobility_partner

# Inside psql, list tables
\dt

# Exit psql
\q
```

---

## Updating the Application

When you push new code to your repository and pull it on the server, use one of these methods:

### Method 1: Full Deployment (Recommended for major updates)

Use this when you've updated dependencies or made significant changes:

```bash
./deploy.sh
```

This script will:
1. Pull latest code
2. Stop all containers
3. Rebuild Docker images (no cache)
4. Start containers
5. Run database migrations
6. Show container status

### Method 2: Quick Deployment (Minor updates)

Use this for code-only changes (no dependency updates):

```bash
./quick-deploy.sh
```

This script will:
1. Pull latest code
2. Stop only the app container
3. Rebuild app (with cache for faster build)
4. Restart app container
5. Keep database running (no downtime)

### Method 3: Manual Deployment

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# View logs
docker-compose logs -f app
```

### Zero-Downtime Deployment (Advanced)

For production environments requiring zero downtime:

```bash
# Build new image
docker-compose build app

# Scale to 2 instances
docker-compose up -d --scale app=2 --no-recreate

# Stop old container
docker-compose stop app

# Remove old container and start new one
docker-compose up -d --force-recreate app

# Scale back to 1
docker-compose up -d --scale app=1
```

---

## Database Management

### Backup Database

```bash
# Create backup
docker exec mobility-postgres pg_dump -U postgres mobility_partner > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip backup_*.sql
```

### Restore Database

```bash
# Restore from backup
docker exec -i mobility-postgres psql -U postgres -d mobility_partner < backup_file.sql
```

### Access Database

```bash
# Using psql
docker exec -it mobility-postgres psql -U postgres -d mobility_partner

# Using Prisma Studio (development)
docker-compose exec app yarn prisma studio
```

### Run Migrations

```bash
# Migrations run automatically on container start
# To run manually:
docker-compose exec app yarn prisma migrate deploy

# Generate Prisma client
docker-compose exec app yarn prisma generate
```

### View Database Logs

```bash
docker-compose logs -f postgres
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs app
docker-compose logs postgres

# Check container status
docker-compose ps

# Restart containers
docker-compose restart

# Full restart
docker-compose down && docker-compose up -d
```

### Database Connection Issues

```bash
# Check if database is healthy
docker-compose ps

# Check database logs
docker-compose logs postgres

# Verify DATABASE_URL in .env.production
cat .env.production | grep DATABASE_URL

# Test connection
docker exec -it mobility-postgres psql -U postgres -d mobility_partner
```

### Port Already in Use

```bash
# Check what's using port 3000
sudo lsof -i :3000

# Check what's using port 5432
sudo lsof -i :5432

# If old PostgreSQL is running:
sudo systemctl stop postgresql
```

### Out of Disk Space

```bash
# Remove unused Docker images
docker image prune -a

# Remove unused volumes (careful!)
docker volume prune

# Remove unused containers
docker container prune

# Check disk space
df -h
```

### Application Crashes

```bash
# View real-time logs
docker-compose logs -f app

# Check last 100 lines
docker-compose logs --tail=100 app

# Restart app
docker-compose restart app
```

### Reset Everything (Fresh Start)

```bash
# DANGER: This removes all data!
# Make sure you have backups!

# Stop and remove containers, networks, volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Start fresh
docker-compose up -d
```

---

## Useful Commands

### Container Management

```bash
# Start containers
docker-compose up -d

# Stop containers
docker-compose down

# Restart containers
docker-compose restart

# View running containers
docker-compose ps

# View all Docker containers
docker ps -a
```

### Logs

```bash
# View all logs
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# App logs only
docker-compose logs -f app

# Last 50 lines
docker-compose logs --tail=50 app
```

### Execute Commands in Container

```bash
# Open shell in app container
docker-compose exec app sh

# Open shell in database
docker-compose exec postgres sh

# Run Prisma commands
docker-compose exec app yarn prisma migrate deploy
docker-compose exec app yarn prisma studio
docker-compose exec app yarn prisma db push
```

### Resource Monitoring

```bash
# View resource usage
docker stats

# View container details
docker inspect mobility-app

# View logs
docker logs mobility-app
```

### Networking

```bash
# List Docker networks
docker network ls

# Inspect network
docker network inspect mobilitypartner_mobility-network
```

---

## Production Considerations

### 1. Use a Reverse Proxy (Nginx/Traefik)

Don't expose port 3000 directly. Use Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Enable SSL/HTTPS

Use Let's Encrypt with Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 3. Set Up Automated Backups

Create a cron job for daily backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/Mobilitypartner && docker exec mobility-postgres pg_dump -U postgres mobility_partner | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
```

### 4. Monitor Container Health

Use Docker health checks and monitoring tools:

```bash
# View container health
docker-compose ps

# Set up monitoring (e.g., Prometheus + Grafana)
# Or use simpler solutions like Uptime Kuma
```

### 5. Resource Limits

Add resource limits to docker-compose.yml:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 6. Log Rotation

Configure Docker log rotation in `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Then restart Docker:

```bash
sudo systemctl restart docker
```

---

## Security Best Practices

1. **Never commit `.env.production`** - Keep it only on the server
2. **Use strong passwords** - Generate them with `openssl rand -base64 32`
3. **Keep Docker updated** - Regularly update Docker and images
4. **Limit network exposure** - Only expose necessary ports
5. **Regular backups** - Automate database backups
6. **Monitor logs** - Check logs regularly for suspicious activity
7. **Use HTTPS** - Always use SSL in production
8. **Firewall rules** - Configure UFW or iptables

```bash
# Example firewall setup
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

---

## Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify environment variables: `cat .env.production`
3. Check container status: `docker-compose ps`
4. Review this guide's troubleshooting section

For more help:
- Docker documentation: https://docs.docker.com
- Next.js documentation: https://nextjs.org/docs
- Prisma documentation: https://www.prisma.io/docs
