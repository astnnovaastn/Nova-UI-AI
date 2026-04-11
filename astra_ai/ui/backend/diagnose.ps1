#!/usr/bin/env pwsh
# ============================================================================
# JARVIS Server Diagnostic Tool
# ============================================================================
# Checks all components needed for the server to run properly

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommandPath
Set-Location $ScriptDir

Write-Host "`n" -NoNewline
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "  🔍 JARVIS SERVER DIAGNOSTIC TOOL" -ForegroundColor Cyan
Write-Host "============================================================================`n" -ForegroundColor Cyan

$issues = @()

# ============================================================================
# 1. Check Python
# ============================================================================
Write-Host "1️⃣  Checking Python Installation..." -ForegroundColor Yellow

try {
    $python_version = python --version 2>&1
    $version_match = $python_version -match '(\d+\.\d+)'
    if ($version_match) {
        $version = [version]$matches[1]
        if ($version -ge [version]"3.9") {
            Write-Host "   ✅ Python $version (OK)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Python $version (Need 3.9+)" -ForegroundColor Red
            $issues += "Python version must be 3.9 or higher"
        }
    } else {
        Write-Host "   ❌ Could not determine Python version" -ForegroundColor Red
        $issues += "Cannot determine Python version"
    }
} catch {
    Write-Host "   ❌ Python not found in PATH" -ForegroundColor Red
    $issues += "Python not installed or not in PATH"
}

# ============================================================================
# 2. Check Virtual Environment
# ============================================================================
Write-Host "`n2️⃣  Checking Virtual Environment..." -ForegroundColor Yellow

if ($env:VIRTUAL_ENV) {
    Write-Host "   ✅ Virtual environment active: $env:VIRTUAL_ENV" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Not in virtual environment (may still work)" -ForegroundColor Yellow
    $venv_path = ".\..\..\.venv"
    if (Test-Path $venv_path) {
        Write-Host "   📍 Found .venv at: $venv_path" -ForegroundColor Cyan
        Write-Host "   💡 Activate with: $venv_path\Scripts\Activate.ps1" -ForegroundColor White
    } else {
        Write-Host "   ℹ️  Create with: python -m venv .venv" -ForegroundColor White
    }
}

# ============================================================================
# 3. Check Dependencies
# ============================================================================
Write-Host "`n3️⃣  Checking Python Dependencies..." -ForegroundColor Yellow

$required_packages = @(
    "fastapi",
    "uvicorn",
    "websockets",
    "groq",
    "cartesia",
    "pydantic",
    "requests"
)

$missing_packages = @()
foreach ($package in $required_packages) {
    try {
        $pip_output = pip show $package 2>&1
        if ($pip_output) {
            $version = ($pip_output | Select-String "Version:") -replace "Version: ", ""
            Write-Host "   ✅ $package ($version)" -ForegroundColor Green
        } else {
            Write-Host "   ❌ $package (missing)" -ForegroundColor Red
            $missing_packages += $package
        }
    } catch {
        Write-Host "   ❌ $package (error checking)" -ForegroundColor Red
        $missing_packages += $package
    }
}

if ($missing_packages.Count -gt 0) {
    Write-Host "`n   🔧 Missing packages. Run:" -ForegroundColor Yellow
    Write-Host "      pip install -r requirements.txt" -ForegroundColor White
    $issues += "Missing packages: $($missing_packages -join ', ')"
}

# ============================================================================
# 4. Check API Keys
# ============================================================================
Write-Host "`n4️⃣  Checking API Keys..." -ForegroundColor Yellow

if ($env:GROQ_API_KEY) {
    $key_hint = $env:GROQ_API_KEY.Substring(0, [Math]::Min(10, $env:GROQ_API_KEY.Length)) + "***"
    Write-Host "   ✅ GROQ_API_KEY set ($key_hint)" -ForegroundColor Green
} else {
    Write-Host "   ❌ GROQ_API_KEY not set" -ForegroundColor Red
    $issues += "GROQ_API_KEY environment variable not set"
}

if ($env:CARTESIA_API_KEY) {
    $key_hint = $env:CARTESIA_API_KEY.Substring(0, [Math]::Min(10, $env:CARTESIA_API_KEY.Length)) + "***"
    Write-Host "   ✅ CARTESIA_API_KEY set ($key_hint)" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  CARTESIA_API_KEY not set (using server default)" -ForegroundColor Blue
}

# ============================================================================
# 5. Check Port Availability
# ============================================================================
Write-Host "`n5️⃣  Checking Port 8340 Availability..." -ForegroundColor Yellow

$port_test = Test-NetConnection -ComputerName localhost -Port 8340 -ErrorAction SilentlyContinue
if ($port_test.TcpTestSucceeded) {
    Write-Host "   ⚠️  Port 8340 is in use (server already running?)" -ForegroundColor Yellow
    Write-Host "   💡 Stop the existing server or use a different port" -ForegroundColor White
} else {
    Write-Host "   ✅ Port 8340 is available" -ForegroundColor Green
}

# ============================================================================
# 6. Check Required Files
# ============================================================================
Write-Host "`n6️⃣  Checking Required Files..." -ForegroundColor Yellow

$required_files = @(
    "server.py",
    "requirements.txt",
    "..\core\nova_ai.py"
)

foreach ($file in $required_files) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Write-Host "   ✅ $file ($size bytes)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file (missing)" -ForegroundColor Red
        $issues += "Required file missing: $file"
    }
}

# ============================================================================
# 7. Test Nova AI Import
# ============================================================================
Write-Host "`n7️⃣  Testing Nova AI Import..." -ForegroundColor Yellow

$test_code = @"
import sys
from pathlib import Path
sys.path.insert(0, str(Path('..\..\..').absolute()))
try:
    from core.nova_ai import AleChatBot
    print("SUCCESS")
except ImportError as e:
    print(f"FAILED: {e}")
"@

$result = python -c $test_code 2>&1
if ($result -like "*SUCCESS*") {
    Write-Host "   ✅ Nova AI module imports correctly" -ForegroundColor Green
} else {
    Write-Host "   ❌ Nova AI module import failed" -ForegroundColor Red
    Write-Host "      Error: $result" -ForegroundColor Red
    $issues += "Nova AI module import failed"
}

# ============================================================================
# 8. Test FastAPI Setup
# ============================================================================
Write-Host "`n8️⃣  Testing FastAPI Setup..." -ForegroundColor Yellow

$test_code = @"
try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    print("SUCCESS")
except ImportError as e:
    print(f"FAILED: {e}")
"@

$result = python -c $test_code 2>&1
if ($result -like "*SUCCESS*") {
    Write-Host "   ✅ FastAPI setup is correct" -ForegroundColor Green
} else {
    Write-Host "   ❌ FastAPI setup failed" -ForegroundColor Red
    Write-Host "      Error: $result" -ForegroundColor Red
    $issues += "FastAPI setup failed"
}

# ============================================================================
# Summary
# ============================================================================
Write-Host "`n" -NoNewline
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host "   📊 DIAGNOSTIC SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================================`n" -ForegroundColor Cyan

if ($issues.Count -eq 0) {
    Write-Host "✅ All checks passed! Server is ready to run." -ForegroundColor Green
    Write-Host "`n🚀 Start the server with one of:" -ForegroundColor Cyan
    Write-Host "   • PowerShell: .\run_server.ps1" -ForegroundColor White
    Write-Host "   • Command Prompt: run_server.bat" -ForegroundColor White
    Write-Host "   • Direct: python server.py" -ForegroundColor White
} else {
    Write-Host "❌ Issues found that need to be fixed:" -ForegroundColor Red
    Write-Host ""
    foreach ($i = 0; $i -lt $issues.Count; $i++) {
        Write-Host "   $($i+1). $($issues[$i])" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "📖 Check SETUP_GUIDE.md for detailed instructions" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "============================================================================`n" -ForegroundColor Cyan

# Offer to run setup if there are issues
if ($issues.Count -gt 0) {
    $prompt = Read-Host "Run setup script to fix issues? (y/n)"
    if ($prompt -eq "y" -or $prompt -eq "Y") {
        .\run_server.ps1
    }
}
