@echo off
REM JARVIS Server Startup Script
REM ============================

echo 🚀 Starting JARVIS Server (NovaAI Backend)
echo.

REM Set environment variables
set GROQ_API_KEY=your_api_key_here
set PYTHONPATH=%CD%\..\..\..

REM Check if virtual environment exists
if not exist ".venv" (
    echo Creating virtual environment...
    python -m venv .venv
)

REM Activate virtual environment
call .venv\Scripts\activate.bat

REM Install/Update dependencies
echo Installing dependencies...
pip install -r requirements.txt

REM Start the server
echo.
echo ✅ Starting JARVIS Server on ws://localhost:8340/ws/voice
echo.
python server.py

pause
