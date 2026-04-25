#!/bin/bash

# Deployment script for Docker-based application
# This script pulls latest code, rebuilds Docker images, and restarts services

set -e  # Exit on any error

echo "======================================"
echo "Starting deployment process..."
echo "======================================"

# 1. Pull latest code from repository
echo ""
echo "[1/6] Pulling latest code from repository..."
git pull origin main

# 2. Stop running containers
echo ""
echo "[2/6] Stopping running containers..."
docker-compose down

# 3. Rebuild Docker images (no cache to ensure fresh build)
echo ""
echo "[3/6] Rebuilding Docker images..."
docker-compose build --no-cache

# 4. Start containers in detached mode
echo ""
echo "[4/6] Starting containers..."
docker-compose up -d

# 5. Wait for database to be ready
echo ""
echo "[5/6] Waiting for database to be ready..."
sleep 5

# 6. Check container status
echo ""
echo "[6/6] Checking container status..."
docker-compose ps

echo ""
echo "======================================"
echo "Deployment completed successfully!"
echo "======================================"
echo ""
echo "Application is running at: http://localhost:3000"
echo ""
echo "Useful commands:"
echo "  - View logs: docker-compose logs -f"
echo "  - View app logs: docker-compose logs -f app"
echo "  - View DB logs: docker-compose logs -f postgres"
echo "  - Stop containers: docker-compose down"
echo "  - Restart containers: docker-compose restart"
echo ""
