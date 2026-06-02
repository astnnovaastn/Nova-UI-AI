@echo off
REM ============================================================================
REM JARVIS - Complete Startup Script (Windows)
REM Starts both Backend Server and Frontend UI together
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo   JARVIS - Complete Startup (Backend + Frontend)
echo ============================================================================
echo.

REM Check if we're in the right directory
if not exist "astra_ai\ui\backend" (
    echo ERROR: Backend directory not found
    echo Run from workspace root: d:\Astra_ai
    pause
    exit /b 1
)

if not exist "astra_ai\ui\frontend" (
    echo ERROR: Frontend directory not found
    echo Run from workspace root: d:\Astra_ai
    pause
    exit /b 1
)

REM Check for API key
if not defined GROQ_API_KEY (
    echo.
    echo Setting GROQ API Key...
    set /p GROQ_API_KEY="Enter your Groq API Key (get from https://console.groq.com): "
    if "!GROQ_API_KEY!"=="" (
        echo ERROR: API key is required!
        pause
        exit /b 1
    )
)

echo.
echo ============================================================================
echo Preparing services...
echo ============================================================================
echo.

REM Install backend dependencies if needed
cd astra_ai\ui\backend
echo Checking backend dependencies...
pip list | findstr fastapi > nul
if errorlevel 1 (
    echo Installing backend dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
)
cd ..\..\..\

REM Install frontend dependencies if needed
echo Checking frontend dependencies...
cd astra_ai\ui\frontend
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
    if errorlevel 1 (
        echo WARNING: npm install failed, but continuing...
    )
)

REM Check for concurrently package
npm list concurrently > nul 2>&1
if errorlevel 1 (
    echo Installing concurrently for parallel execution...
    npm install --save-dev concurrently
)

cd ..\..\..\

echo.
echo ============================================================================
echo Starting JARVIS System...
echo ============================================================================
echo.
echo Starting Backend Server...
start "JARVIS Backend" cmd /k "cd astra_ai\ui\backend && python server.py"

REM Wait a bit for server to start
timeout /t 3 /nobreak

echo Starting Frontend UI...
cd astra_ai\ui\frontend
npm run dev

REM If we get here, frontend was stopped
cd ..\..\..\
echo.
echo Shutting down...
taskkill /FI "WindowTitle eq JARVIS Backend" /T /F > nul 2>&1
echo Goodbye!
pause
