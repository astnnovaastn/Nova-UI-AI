#!/usr/bin/env pwsh
# ============================================================================
# JARVIS - Complete Startup Script
# Starts both Backend Server and Frontend UI together
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  🚀 JARVIS - Complete Startup (Backend + Frontend)" -ForegroundColor Cyan
Write-Host "============================================================================`n" -ForegroundColor Cyan

$backendPath = ".\astra_ai\ui\backend"
$frontendPath = ".\astra_ai\ui\frontend"

# Check if paths exist
if (-not (Test-Path $backendPath)) {
    Write-Host "❌ Backend directory not found: $backendPath" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $frontendPath)) {
    Write-Host "❌ Frontend directory not found: $frontendPath" -ForegroundColor Red
    exit 1
}

# Set API key if not already set
if (-not $env:GROQ_API_KEY) {
    Write-Host "🔑 Setting GROQ API Key..." -ForegroundColor Yellow
    $env:GROQ_API_KEY = Read-Host "Enter your Groq API Key (get from https://console.groq.com)"
    if (-not $env:GROQ_API_KEY) {
        Write-Host "❌ API key is required!" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n✅ API Key set`n" -ForegroundColor Green

# Start Backend Server in background
Write-Host "🚀 Starting Backend Server..." -ForegroundColor Cyan
$backendProcess = Start-Process -FilePath "python" -ArgumentList "server.py" `
    -WorkingDirectory $backendPath `
    -NoNewWindow `
    -PassThru

if ($?) {
    Write-Host "✅ Backend Server started (PID: $($backendProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start Backend Server" -ForegroundColor Red
    exit 1
}

# Wait for server to initialize
Write-Host "`n⏳ Waiting for server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start Frontend in new window
Write-Host "🎨 Starting Frontend UI (Vite)..." -ForegroundColor Cyan
$frontendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" `
    -WorkingDirectory $frontendPath `
    -PassThru

if ($?) {
    Write-Host "✅ Frontend started (PID: $($frontendProcess.Id))" -ForegroundColor Green
} else {
    Write-Host "⚠️ Failed to start Frontend (npm may still be running)" -ForegroundColor Yellow
}

Write-Host "`n" -NoNewline
Write-Host "============================================================================" -ForegroundColor Green
Write-Host "   ✅ JARVIS System Ready!" -ForegroundColor Green
Write-Host "============================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Frontend:      http://localhost:5173/" -ForegroundColor White
Write-Host "📍 Backend:       ws://localhost:8340/ws/voice" -ForegroundColor White
Write-Host "📍 REST API:      http://localhost:8340/api" -ForegroundColor White
Write-Host ""
Write-Host "🎤 Open http://localhost:5173/ and start speaking to JARVIS!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host "============================================================================`n" -ForegroundColor Green

# Wait for either process to exit
$backendProcess | Wait-Process
Write-Host "`n⚠️ Backend Server stopped" -ForegroundColor Yellow

if ($frontendProcess) {
    $frontendProcess | Stop-Process -Force -ErrorAction SilentlyContinue
}
