#!/bin/sh
set -e

echo "Waiting for database to be ready..."
# The db healthcheck in docker-compose handles this, but add a small buffer
sleep 2

echo "Pushing schema to database..."
# Use db push for initial deployments; switch to migrate deploy once migrations exist
npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || \
  npx prisma migrate deploy 2>/dev/null || \
  echo "Schema sync skipped (db may already be current)"

echo "Seeding database (skips if already seeded)..."
npx tsx prisma/seed.ts 2>/dev/null || echo "Seed skipped"

echo "Starting CharFlut server..."
exec node server.js
