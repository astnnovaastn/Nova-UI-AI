@echo off
echo ==================================================
echo   🚀 NOVA AI - MASTER STARTUP SCRIPT
echo ==================================================
echo.
echo This script will:
echo  1. Configure the environment
echo  2. Start the Backend Server (Port 5001)
echo  3. Start the React Frontend (Port 3002)
echo.
echo The system uses a unified "npm start" command to run everything.
echo.

REM Check for virtual environment
if not exist ".venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment (.venv) not found in project root.
    echo Please set up the python environment first.
    pause
    exit /b 1
)

REM Navigate to UI directory where package.json lives
cd astra_ai\ui

REM Run the master start command
echo [INFO] Launching System via npm start...
echo.
call npm start

pause