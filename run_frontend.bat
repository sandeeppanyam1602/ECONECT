@echo off
title ECONECT Frontend (React + Vite)
cd /d "%~dp0"
echo ========================================================
echo   Starting ECONECT Frontend (React + Vite + Tailwind)
echo ========================================================
echo.

if not exist node_modules (
  echo Installing NPM dependencies...
  npm install
)

echo Starting Vite development server...
echo Open http://localhost:5173 in your browser.
echo.
npm run dev
pause
