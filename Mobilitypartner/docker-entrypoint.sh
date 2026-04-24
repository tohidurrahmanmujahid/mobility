#!/bin/sh
set -e

echo "Starting Mobility Partner application..."

# Create uploads directory structure if it doesn't exist
echo "Ensuring upload directories exist..."
mkdir -p /app/public/uploads/products
mkdir -p /app/public/uploads/workshop-submissions
mkdir -p /app/public/uploads/claims

# Check if directories are writable
if [ -w /app/public/uploads/products ]; then
  echo "Upload directories are writable"
else
  echo "WARNING: Upload directories may not be writable. File uploads might fail."
  echo "Please ensure the host volume has proper permissions (chown -R 1001:1001 ./uploads)"
fi

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting Next.js server..."
# Start the Next.js server
exec node server.js
