@echo off
title Ayush Case-Taking Software
color 0B
cls

echo ===============================================
echo    Ayush Case-Taking Software
echo    Ministry of Ayush, Government of India
echo ===============================================
echo.

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install from https://nodejs.org
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

:: Install dependencies if needed
if not exist node_modules (
    echo [SETUP] Installing dependencies for the first time...
    echo This may take 1-2 minutes.
    echo.
    call npm install
    echo.
    echo [SETUP] Done!
    echo.
)

:: Start backend server
echo [1/3] Starting Backend Server on port 3001...
start "Ayush-Backend" /min node server/index.js
timeout /t 2 /nobreak >nul

:: Start frontend
echo [2/3] Starting Frontend on port 5173...
start "Ayush-Frontend" /min npx vite --port 5173
timeout /t 3 /nobreak >nul

:: Open browser
echo [3/3] Opening browser...
start http://localhost:5173

echo.
echo ===============================================
echo    All services running!
echo ===============================================
echo.
echo    Frontend: http://localhost:5173
echo    Backend:  http://localhost:3001
echo.
echo    Login Credentials:
echo    --------------------------------------------
echo    CMO:        rahulpd1712@gmail.com / RahulAdmin123!
echo    Hospital:   admin.neha@ayush.com  / admin123
echo    Doctor:     dr.priya@ayush.com    / doctor123
echo    Assistant:  asst.ravi@ayush.com   / asst123
echo    --------------------------------------------
echo.
echo ===============================================
echo.
echo Press any key to stop all services...
pause >nul

:: Stop services by window title
taskkill /FI "WINDOWTITLE eq Ayush-Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Ayush-Frontend*" /F >nul 2>&1
echo.
echo All services stopped.
timeout /t 2 /nobreak >nul