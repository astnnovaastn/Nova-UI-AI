@echo off
echo ===========================================
echo      Starting Nova AI Integrated System
echo ===========================================

echo Starting Backend Server...
start "Nova AI Backend" cmd /k "cd /d %~dp0 && .venv-1\Scripts\python astra_ai\ui\src\backend\server.py"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo Starting React Frontend...
cd astra_ai\ui
npm start

echo.
echo System started! Close this window to stop all services.
pause