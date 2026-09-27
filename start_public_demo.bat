@echo off
title LandGuard AI - SIH Public Demo Launcher
cd /d "%~dp0"

echo [1/3] Starting LandGuard FastAPI Backend on port 8000...
start "LandGuard Backend" /min cmd /c ".\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000"

timeout /t 3 >nul

echo [2/3] Starting LandGuard Next.js Frontend on port 3000...
start "LandGuard Frontend" /min cmd /c "npm run dev"

timeout /t 4 >nul

echo [3/3] Starting Cloudflare Quick Tunnel...
start "Cloudflare Tunnel" cmd /k ".\cloudflared-win.exe tunnel --url http://127.0.0.1:3000 --http-host-header localhost:3000 --protocol http2 --no-autoupdate"
