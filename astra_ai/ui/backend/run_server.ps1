#!/usr/bin/env pwsh
# ============================================================================
# JARVIS Server Startup Script (PowerShell)
# ============================================================================
# This script will:
# 1. Check for required API keys
# 2. Install/update dependencies
# 3. Start the JARVIS WebSocket server
# ============================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommandPath
Set-Location $ScriptDir

Write-Host "`n" -NoNewline
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  🚀 JARVIS SERVER STARTUP (PowerShell)" -ForegroundColor Cyan
Write-Host "============================================================================`n" -ForegroundColor Cyan

# Check if in virtual environment
if (-not $env:VIRTUAL_ENV) {
    Write-Host "⚠️  Not in virtual environment. Looking for .venv..." -ForegroundColor Yellow
    
    $venv_path = ".\..\..\.venv\Scripts\Activate.ps1"
    if (Test-Path $venv_path) {
        Write-Host "📁 Found virtual environment at: $venv_path" -ForegroundColor Green
        & $venv_path
        Write-Host "✅ Virtual environment activated`n" -ForegroundColor Green
    } else {
        Write-Host "❌ Could not find .venv\Scripts\Activate.ps1" -ForegroundColor Red
        Write-Host "Activate manually: .\..\..\.venv\Scripts\Activate.ps1`n" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host "✅ Python environment: $(python --version)`n" -ForegroundColor Green

# Check for required API keys
Write-Host "🔑 Checking API keys..." -ForegroundColor Cyan

if (-not $env:GROQ_API_KEY) {
    Write-Host "`n❌ GROQ_API_KEY not set!" -ForegroundColor Red
    Write-Host "`nTo set it in PowerShell:" -ForegroundColor Yellow
    Write-Host '  $env:GROQ_API_KEY = "gsk_your_key_here"' -ForegroundColor White
    Write-Host "`nOr permanently (add to PowerShell profile):" -ForegroundColor Yellow
    Write-Host '  notepad $PROFILE' -ForegroundColor White
    Write-Host "`nEnter your Groq API key (get from: https://console.groq.com):`n" -ForegroundColor Yellow
    
    $key = Read-Host "Groq API Key"
    if (-not $key) {
        Write-Host "`n❌ API key is required!" -ForegroundColor Red
        exit 1
    }
    $env:GROQ_API_KEY = $key
    Write-Host "✅ Groq API key set`n" -ForegroundColor Green
} else {
    Write-Host "✅ GROQ_API_KEY is set`n" -ForegroundColor Green
}

if (-not $env:CARTESIA_API_KEY) {
    Write-Host "ℹ️  CARTESIA_API_KEY not set (using server default)" -ForegroundColor Blue
} else {
    Write-Host "✅ CARTESIA_API_KEY is set`n" -ForegroundColor Green
}

# Check/install dependencies
Write-Host "📦 Checking dependencies..." -ForegroundColor Cyan

try {
    $output = pip list 2>&1 | Select-String "fastapi"
    if (-not $output) {
        Write-Host "⚠️  Installing dependencies..." -ForegroundColor Yellow
        pip install -r requirements.txt
        if ($LASTEXITCODE -ne 0) {
            Write-Host "`n❌ Failed to install dependencies" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Dependencies installed`n" -ForegroundColor Green
    } else {
        Write-Host "✅ Dependencies already installed`n" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not verify dependencies: $_" -ForegroundColor Yellow
    Write-Host "Attempting fresh install...`n" -ForegroundColor Yellow
    pip install -r requirements.txt
}

# Display startup info
Write-Host "`n" -NoNewline
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "   🚀 STARTING JARVIS SERVER" -ForegroundColor Cyan
Write-Host "============================================================================`n" -ForegroundColor Cyan

Write-Host "📍 WebSocket Endpoint:  ws://localhost:8340/ws/voice" -ForegroundColor White
Write-Host "📍 REST API Base:       http://localhost:8340/api" -ForegroundColor White
Write-Host "📍 Frontend:            http://localhost:8340/" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Once started:" -ForegroundColor Cyan
Write-Host "   1. Open http://localhost:8340/ in your browser" -ForegroundColor White
Write-Host "   2. Click the microphone icon" -ForegroundColor White
Write-Host "   3. Speak to JARVIS!" -ForegroundColor White
Write-Host ""
Write-Host "📖 Documentation:" -ForegroundColor Cyan
Write-Host "   • README.md                - Server overview & features" -ForegroundColor White
Write-Host "   • API_SPECIFICATION.md     - Complete API reference" -ForegroundColor White
Write-Host "   • SETUP_GUIDE.md          - Detailed setup instructions" -ForegroundColor White
Write-Host "   • TESTING.md              - Testing procedures" -ForegroundColor White
Write-Host ""
Write-Host "⏹️  Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host "============================================================================`n" -ForegroundColor Cyan

# Start the server
python server.py

# If we get here, server stopped
Write-Host "`n" -NoNewline
Write-Host "============================================================================" -ForegroundColor Yellow
Write-Host "   ⚠️  Server stopped" -ForegroundColor Yellow
Write-Host "============================================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Check logs: jarvis_server.log" -ForegroundColor Yellow
Write-Host "📊 Or view logs via API: curl http://localhost:8340/api/logs" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to exit"
