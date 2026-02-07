#!/usr/bin/env pwsh
# Quick rebuild script (uses cache, faster)
# Use this when you only changed code, not dependencies

Write-Host "⚡ Print Stack - Quick Rebuild" -ForegroundColor Cyan
Write-Host "============================`n" -ForegroundColor Cyan

# Rebuild images (with cache)
Write-Host "🔧 Rebuilding images (cached)..." -ForegroundColor Yellow
docker-compose build

# Restart services
Write-Host "`n🔄 Restarting services..." -ForegroundColor Yellow
docker-compose up -d

# Wait a moment
Write-Host "`n⏳ Waiting for services..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Show status
Write-Host "`n✅ Quick rebuild complete!" -ForegroundColor Green
docker-compose ps

Write-Host "`n💡 Tip: Hard refresh your browser (Ctrl+Shift+R) to see changes" -ForegroundColor Yellow
