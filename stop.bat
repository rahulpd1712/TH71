@echo off
title Stopping Ayush Services
echo Stopping all Ayush services...
taskkill /FI "WINDOWTITLE eq Ayush-Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Ayush-Frontend*" /F >nul 2>&1
echo All services stopped.
timeout /t 2 /nobreak >nul