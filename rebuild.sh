#!/bin/bash
# Rebuild script for Print Stack application
# This rebuilds all containers and restarts services

echo "🔨 Print Stack - Full Rebuild Script"
echo "===================================="
echo ""

# Stop all containers
echo "⏹️  Stopping containers..."
docker-compose down

# Rebuild all images
echo ""
echo "🔧 Rebuilding all images..."
docker-compose build --no-cache

# Start all services
echo ""
echo "🚀 Starting services..."
docker-compose up -d

# Wait a moment for services to initialize
echo ""
echo "⏳ Waiting for services to initialize..."
sleep 5

# Show status
echo ""
echo "📊 Service Status:"
docker-compose ps

# Show backend logs to verify it started
echo ""
echo "📋 Backend Logs (last 20 lines):"
docker logs print-stack-backend-1 --tail 20

echo ""
echo "✅ Rebuild complete!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:3000"
echo "📦 MinIO:    http://localhost:9001"
