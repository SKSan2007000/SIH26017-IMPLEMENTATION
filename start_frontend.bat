@echo off
title LandGuard AI - Next.js Frontend
echo ===================================================
echo     LANDGUARD AI - NEXT.JS FRONTEND (:3000)
echo ===================================================
echo.
cd /d "%~dp0\frontend"

echo Starting Next.js Dev Server...
npm run dev
pause
