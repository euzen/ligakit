#!/bin/sh
# Docker entrypoint script for Back4App deployment

set -e

echo "Running database migrations..."
node scripts/migrate.mjs

echo "Starting application..."
exec "$@"
