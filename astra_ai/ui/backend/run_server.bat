@echo off
REM ============================================================================
REM JARVIS Server Startup Script (Windows)
REM ============================================================================
REM This script will:
REM 1. Check for required API keys
REM 2. Install/update dependencies
REM 3. Start the JARVIS WebSocket server
REM 4. Display status and logs
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo   🚀 JARVIS SERVER STARTUP (Windows)
echo ============================================================================
echo.

REM Get the directory where this script is located
set SCRIPT_DIR=%~dp0
cd /d %SCRIPT_DIR%

REM Check if running in virtual environment
if not defined VIRTUAL_ENV (
    echo ⚠️  Not in virtual environment. Attempting to activate .venv...
    if exist "..\..\..\.venv\Scripts\activate.bat" (
        call "..\..\..\.venv\Scripts\activate.bat"
        echo ✅ Virtual environment activated
    ) else (
        echo ❌ Could not find virtual environment at ..\..\..\.venv
        echo Please activate manually: .venv\Scripts\Activate.ps1
        pause
        exit /b 1
    )
)

echo.
echo ✅ Using Python environment: %VIRTUAL_ENV%
python --version

REM Check for required API keys
echo.
echo 🔑 Checking API keys...

if not defined GROQ_API_KEY (
    echo.
    echo ❌ GROQ_API_KEY not set!
    echo.
    echo To set it:
    echo   set GROQ_API_KEY=gsk_your_key_here
    echo.
    echo Or in PowerShell:
    echo   $env:GROQ_API_KEY = "gsk_your_key_here"
    echo.
    set /p GROQ_API_KEY="Enter your Groq API Key: "
    if "!GROQ_API_KEY!"=="" (
        echo ❌ API key is required to run the server
        pause
        exit /b 1
    )
)
echo ✅ GROQ_API_KEY is set

REM Cartesia key is in server code, but can be overridden
if not defined CARTESIA_API_KEY (
    echo ⚠️  CARTESIA_API_KEY not set (using hardcoded default)
)

REM Check/install dependencies
echo.
echo 📦 Checking dependencies...
pip list | findstr /i fastapi > nul
if errorlevel 1 (
    echo ⚠️  Dependencies not installed. Installing now...
    echo.
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
    echo ✅ Dependencies installed
) else (
    echo ✅ Dependencies already installed
)

REM Check if server logs exist, clean them
if exist jarvis_server.log (
    echo 📝 Previous logs found (will be overwritten)
)

REM Display startup info
echo.
echo ============================================================================
echo   🚀 STARTING JARVIS SERVER
echo ============================================================================
echo.
echo 📍 WebSocket Endpoint: ws://localhost:8340/ws/voice
echo 📍 REST API Base:      http://localhost:8340/api
echo 📍 Frontend:           http://localhost:8340/
echo.
echo 🎯 Once started:
echo    1. Open browser to http://localhost:8340/
echo    2. Click the microphone icon
echo    3. Speak to JARVIS
echo.
echo 📖 Documentation:
echo    • README.md          - Server overview
echo    • API_SPECIFICATION.md - API reference
echo    • TESTING.md         - Test procedures
echo.
echo Press Ctrl+C to stop the server
echo ============================================================================
echo.

REM Start the server
python server.py

REM If we get here, server stopped
echo.
echo ============================================================================
echo   ⚠️  Server stopped
echo ============================================================================
echo.
echo Check logs: jarvis_server.log
pause
