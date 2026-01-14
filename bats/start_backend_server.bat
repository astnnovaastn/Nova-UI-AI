@echo off
REM Nova AI Backend Server Startup Script
REM This script starts the Flask backend server for the React chat interface

echo 🚀 Starting Nova AI Backend Server...
echo.

REM Change to the backend directory
cd /d "%~dp0\astra_ai\ui\src\backend"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    echo Please install Python 3.8+ and add it to your system PATH
    pause
    exit /b 1
)

REM Install required packages if needed
echo 📦 Checking dependencies...
pip install flask flask-cors >nul 2>&1

REM Start the server
echo 🌐 Starting Flask server on http://127.0.0.1:5001
echo Press Ctrl+C to stop the server
echo.

python server.py

pause