@echo off
title ECONECT SIH 2026 - Complete Full Stack Launcher
cd /d "%~dp0"

echo ===================================================================
echo     ECONECT SIH 2026 - Bringing Kabadiwalas into Formal Recycling
echo ===================================================================
echo.
echo Launching Frontend...
start "ECONECT Frontend" cmd /c "run_frontend.bat"

echo Launching Backend (FastAPI)...
start "ECONECT Backend" cmd /c "run_backend.bat"

echo.
echo Servers are launching in separate windows:
echo - Frontend: http://localhost:5173
echo - Backend:  http://localhost:8000 (API Docs at /docs)
echo.
echo Note: If backend is not started, frontend automatically runs in
echo full interactive mode with instant user validation & AI navigation!
echo.
pause
