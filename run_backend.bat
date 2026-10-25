@echo off
title ECONECT Backend (FastAPI + SQLite)
cd /d "%~dp0backend"
echo ========================================================
echo   Starting ECONECT FastAPI REST Server (SIH 2026)
echo ========================================================
echo.

where python >nul 2>&1
if %errorlevel% neq 0 (
  echo [Notice] Python not found in system PATH.
  echo If you have Python installed, ensure python is added to your PATH.
  echo Note: The ECONECT frontend has built-in resilient mock engine
  echo and can run completely standalone without backend!
  pause
  exit /b 1
)

if not exist venv (
  echo Creating virtual environment...
  python -m venv venv
)

call venv\Scripts\activate.bat
if not exist .env (
  copy .env.example .env >nul 2>&1
)

echo Installing / verifying Python dependencies...
pip install -r requirements.txt

echo.
echo Starting FastAPI on http://localhost:8000 ...
echo Swagger API Docs available at http://localhost:8000/docs
echo.
uvicorn app.main:app --reload --port 8000
pause
