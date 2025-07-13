
# Lead Management Development Startup Script for Windows PowerShell
Write-Host "🚀 Starting Lead Management Development Environment..." -ForegroundColor Green

# Function to start processes
function Start-DevServer {
    param($Name, $Command, $Arguments, $WorkingDirectory, $Color)
    
    Write-Host "📱 Starting $Name..." -ForegroundColor $Color
    
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = $Command
    $processInfo.Arguments = $Arguments
    $processInfo.WorkingDirectory = $WorkingDirectory
    $processInfo.UseShellExecute = $false
    $processInfo.CreateNoWindow = $false
    
    $process = [System.Diagnostics.Process]::Start($processInfo)
    return $process
}

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Backend Server
$backendDir = Join-Path $scriptDir "backend"
Write-Host "📦 Backend Directory: $backendDir" -ForegroundColor Yellow

if (Test-Path $backendDir) {
    $backendProcess = Start-DevServer -Name "Backend (FastAPI)" -Command "python" -Arguments "main.py" -WorkingDirectory $backendDir -Color "Cyan"
    Write-Host "✅ Backend started at http://localhost:8000" -ForegroundColor Green
} else {
    Write-Host "❌ Backend directory not found: $backendDir" -ForegroundColor Red
    exit 1
}

# Wait for backend to initialize
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host "🌐 Starting Frontend (Vite + React)..." -ForegroundColor Cyan
$frontendProcess = Start-DevServer -Name "Frontend (React)" -Command "npm" -Arguments "run dev" -WorkingDirectory $scriptDir -Color "Magenta"

Write-Host ""
Write-Host "📋 Development Environment Status:" -ForegroundColor Green
Write-Host "   • Backend API: http://localhost:8000" -ForegroundColor White
Write-Host "   • Frontend App: http://localhost:5173" -ForegroundColor White  
Write-Host "   • Health Check: http://localhost:8000/api/health" -ForegroundColor White
Write-Host "   • API Documentation: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "💡 Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host ""

# Keep script running
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "⏹️  Shutting down development servers..." -ForegroundColor Red
    if ($backendProcess -and !$backendProcess.HasExited) {
        $backendProcess.Kill()
    }
    if ($frontendProcess -and !$frontendProcess.HasExited) {
        $frontendProcess.Kill()
    }
}
