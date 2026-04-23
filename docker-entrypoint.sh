#!/bin/sh
# Docker entrypoint script

set -e

# Ensure upload directories exist under UPLOAD_DIR (or default)
UPLOAD_BASE="${UPLOAD_DIR:-/app/data/uploads}"
mkdir -p "$UPLOAD_BASE/teams" "$UPLOAD_BASE/avatars" "$UPLOAD_BASE/sports"

echo "Running database migrations..."
node scripts/migrate.mjs

echo "Seeding admin user..."
node scripts/seed-admin.mjs

echo "Starting application..."
exec "$@"
