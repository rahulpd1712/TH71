@echo off
title Ayush Database Backup
color 0B
cls

echo ===============================================
echo    Ayush Case-Taking Software
echo    Database Backup
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

:: Check dependencies
if not exist node_modules (
    echo [ERROR] Dependencies not installed.
    echo Run start.bat once first ^(or: npm install^)
    pause
    exit /b 1
)

call npm run backup
echo.
pause