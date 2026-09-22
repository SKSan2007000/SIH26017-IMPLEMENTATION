@echo off
title LandGuard AI - Full Stack Launcher
echo ===================================================
echo       LANDGUARD AI - FULL STACK SYSTEM
echo ===================================================
echo.
cd /d "%~dp0"

echo [1/2] Starting FastAPI Backend on port 8000...
start "LandGuard Backend (FastAPI :8000)" cmd /k ".\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Next.js Frontend on port 3000...
start "LandGuard Frontend (Next.js :3000)" cmd /k "npm run dev"

echo.
echo ===================================================
echo Both Backend (port 8000) and Frontend (port 3000) are launching!
echo Open your browser at: http://localhost:3000
echo.
echo Demo Credentials:
echo   Email:    admin@landguard.ai
echo   Password: LandGuard@2026
echo ===================================================
timeout /t 5 >nul
start http://localhost:3000/signin
