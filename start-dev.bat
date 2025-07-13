
@echo off
echo 🚀 Starting Lead Management Development Environment...
echo.

echo 📱 Starting Backend Server...
cd backend
start "Backend Server" cmd /k "python main.py"
cd ..

echo ⏳ Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo 🌐 Starting Frontend Server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo 📋 Development Environment Status:
echo    • Backend API: http://localhost:8000
echo    • Frontend App: http://localhost:5173
echo    • Health Check: http://localhost:8000/api/health
echo.
echo 💡 Close the terminal windows to stop the servers
pause
