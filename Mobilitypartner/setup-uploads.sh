#!/bin/bash
# Setup script for uploads directory with proper permissions
# Run this script on the host machine before starting the Docker container

echo "=============================================="
echo "Setting up uploads directory for Docker"
echo "=============================================="

echo ""
echo "Creating uploads directory structure..."
mkdir -p uploads/products
mkdir -p uploads/workshop-submissions
mkdir -p uploads/claims

echo ""
echo "Setting permissions..."
# Set ownership to UID 1001 (nextjs user in container)
if [ "$(id -u)" -eq 0 ]; then
  # Running as root
  chown -R 1001:1001 uploads
  echo "Ownership set to UID 1001 (nextjs user)"
else
  # Not running as root, try with sudo
  echo "Setting ownership requires root privileges..."
  if command -v sudo &> /dev/null; then
    sudo chown -R 1001:1001 uploads
    echo "Ownership set to UID 1001 (nextjs user) via sudo"
  else
    echo "WARNING: Could not set ownership. Please run as root or install sudo."
    echo "You can manually run: chown -R 1001:1001 uploads"
  fi
fi

# Set directory permissions to allow read/write/execute
chmod -R 755 uploads

echo ""
echo "=============================================="
echo "Uploads directory setup complete!"
echo "=============================================="
echo ""
echo "Directory structure:"
ls -la uploads/
echo ""
echo "NOTE: If you still encounter upload errors, ensure the Docker"
echo "container has write access to the ./uploads directory."
echo ""
