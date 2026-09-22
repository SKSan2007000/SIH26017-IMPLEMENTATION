@echo off
title LandGuard AI - FastAPI Backend Server
echo ===================================================
echo     LANDGUARD AI - FASTAPI BACKEND SERVER (:8000)
echo ===================================================
echo.
cd /d "%~dp0"

echo Activating Python virtual environment and starting Uvicorn...
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
pause
