#!/bin/bash

# Quick deployment script (uses cache for faster builds)
# Use this for minor updates when dependencies haven't changed

set -e  # Exit on any error

echo "======================================"
echo "Starting quick deployment..."
echo "======================================"

# 1. Pull latest code
echo ""
echo "[1/5] Pulling latest code..."
git pull origin main

# 2. Stop only the app container (keep DB running)
echo ""
echo "[2/5] Stopping app container..."
docker-compose stop app

# 3. Rebuild app with cache
echo ""
echo "[3/5] Rebuilding app (with cache)..."
docker-compose build app

# 4. Start app container
echo ""
echo "[4/5] Starting app container..."
docker-compose up -d app

# 5. Check status
echo ""
echo "[5/5] Checking status..."
docker-compose ps

echo ""
echo "======================================"
echo "Quick deployment completed!"
echo "======================================"
echo ""
echo "View logs: docker-compose logs -f app"
echo ""
