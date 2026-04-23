#!/bin/sh
# Docker entrypoint script for Back4App deployment

set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting application..."
exec "$@"
