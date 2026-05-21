#!/bin/sh
set -e

PRISMA="node /app/node_modules/prisma/build/index.js"
TSX="node /app/node_modules/tsx/dist/cli.mjs"

echo "Pushing schema to database..."
$PRISMA db push --skip-generate --accept-data-loss 2>&1 || \
  $PRISMA migrate deploy 2>&1 || \
  echo "Schema sync skipped"

echo "Seeding database..."
$TSX /app/prisma/seed.ts 2>&1 || echo "Seed skipped"

echo "Starting CharFlut server..."
exec node server.js
