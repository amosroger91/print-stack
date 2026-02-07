#!/bin/sh
# Entrypoint script for backend to run migrations before starting

cd /app

echo "Generating Prisma Client..."
node_modules/.pnpm/node_modules/.bin/prisma generate

echo "Running Prisma migrations..."
node_modules/.pnpm/node_modules/.bin/prisma migrate deploy

echo "Starting backend server..."
exec node apps/backend/dist/index.js
