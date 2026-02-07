#!/usr/bin/env pwsh
# Rebuild script for Print Stack application
# This rebuilds all containers and restarts services

Write-Host "🔨 Print Stack - Full Rebuild Script" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Stop all containers
Write-Host "⏹️  Stopping containers..." -ForegroundColor Yellow
docker-compose down

# Rebuild all images
Write-Host "`n🔧 Rebuilding all images..." -ForegroundColor Yellow
docker-compose build --no-cache

# Start all services
Write-Host "`n🚀 Starting services..." -ForegroundColor Yellow
docker-compose up -d

# Wait a moment for services to initialize
Write-Host "`n⏳ Waiting for services to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Show status
Write-Host "`n📊 Service Status:" -ForegroundColor Green
docker-compose ps

# Show backend logs to verify it started
Write-Host "`n📋 Backend Logs (last 20 lines):" -ForegroundColor Green
docker logs print-stack-backend-1 --tail 20

Write-Host "`n✅ Rebuild complete!" -ForegroundColor Green
Write-Host "🌐 Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔧 Backend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "📦 MinIO:    http://localhost:9001" -ForegroundColor Cyan
