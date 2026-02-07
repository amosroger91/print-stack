# Test backend upload and slicing API
$uri = "http://localhost:3000/upload"
$filePath = "C:\Users\roger\OneDrive\Desktop\print-stack\Butterfly.stl"

Write-Host "Testing file upload..." -ForegroundColor Cyan

$form = @{
    file = Get-Item -Path $filePath
}

try {
    $response = Invoke-WebRequest -Uri $uri -Method Post -Form $form
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host "Upload successful!" -ForegroundColor Green
    Write-Host "  File ID: $($result.fileId)" -ForegroundColor Yellow
    Write-Host "  Object Name: $($result.objectName)" -ForegroundColor Yellow
    
    # Now test slicing
    Write-Host ""
    Write-Host "Testing slicing..." -ForegroundColor Cyan
    
    $sliceBody = @{
        fileId = $result.objectName
    } | ConvertTo-Json
    
    $sliceResponse = Invoke-WebRequest -Uri "http://localhost:3000/slice" -Method Post -Body $sliceBody -ContentType "application/json"
    $sliceResult = $sliceResponse.Content | ConvertFrom-Json
    
    Write-Host "Slicing successful!" -ForegroundColor Green
    Write-Host "  Status: $($sliceResult.status)" -ForegroundColor Yellow
    Write-Host "  GCode URL: $($sliceResult.gcodeUrl)" -ForegroundColor Yellow
    
    # Download the GCode
    Write-Host ""
    Write-Host "Downloading GCode..." -ForegroundColor Cyan
    $gcodeFile = "C:\Users\roger\OneDrive\Desktop\print-stack\butterfly.gcode"
    Invoke-WebRequest -Uri $sliceResult.gcodeUrl -OutFile $gcodeFile
    Write-Host "GCode saved to: $gcodeFile" -ForegroundColor Green
    
    # Show first few lines
    Write-Host ""
    Write-Host "First 10 lines of GCode:" -ForegroundColor Cyan
    Get-Content $gcodeFile -TotalCount 10
    
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.Exception
}
