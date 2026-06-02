# 🚀 JARVIS System - Quick Start Guide

## What Was Fixed

✅ **Dependency Conflicts Resolved**
- Removed invalid `python-cors==1.2.0` package
- Updated `cartesia==0.9.2` → `cartesia>=3.0.2` (actual version that exists)
- Updated `pydantic==1.10.22` → `pydantic>=2.0.0,<3.0.0` (required by mem0ai)

✅ **Server-Frontend Integration Complete**
- Backend (FastAPI) auto-initializes Nova AI on startup
- Frontend can launch backend through npm scripts
- Unified process management via Node.js script

✅ **Multiple Startup Methods Created**
- `npm run start:dev` - Recommended (uses server.js)
- `.\start-all.ps1` - PowerShell alternative
- `start-all.bat` - Windows batch alternative

## Before You Start

### 1. Set GROQ_API_KEY

**PowerShell (Current Session):**
```powershell
$env:GROQ_API_KEY = "gsk_your_actual_key_here"
```

**PowerShell (Permanent):**
```powershell
[Environment]::SetEnvironmentVariable("GROQ_API_KEY", "gsk_your_key_here", "User")
```

**Command Prompt:**
```cmd
setx GROQ_API_KEY "gsk_your_key_here"
```

### 2. Install Dependencies (First Time Only)

**Frontend Dependencies:**
```powershell
cd d:\Astra_ai\astra_ai\ui\frontend
npm install
```

**Backend Dependencies:**
```powershell
cd d:\Astra_ai\astra_ai\ui\backend
pip install -r requirements.txt
```

## Start JARVIS

### Method 1: From Frontend Directory (RECOMMENDED)

```powershell
cd d:\Astra_ai\astra_ai\ui\frontend
npm run start:dev
```

This will:
- ✅ Check for GROQ_API_KEY
- ✅ Start backend server (port 8340)
- ✅ Wait 2 seconds for server initialization
- ✅ Start frontend dev server (port 5173)
- ✅ Display connection URLs

### Method 2: From Workspace Root (PowerShell)

```powershell
cd d:\Astra_ai
.\start-all.ps1
```

### Method 3: From Workspace Root (Windows Batch)

```cmd
cd d:\Astra_ai
start-all.bat
```

## What Happens When You Start

```
🚀 JARVIS - Starting Backend Server and Frontend UI

📍 Backend Server: ws://localhost:8340/ws/voice
📍 Frontend UI:    http://localhost:5173/
📍 REST API:       http://localhost:8340/api

✅ JARVIS System Starting...
⏰ Press Ctrl+C to stop all services
```

Then the server logs will appear, followed by Vite startup output.

## Access JARVIS

Once You see the Vite message, open your browser:

**Frontend URL:** http://localhost:5173/

You should see the JARVIS UI with a microphone button. Click it and start speaking!

## Architecture

```
┌─────────────────────────────────────────┐
│  JARVIS Frontend (Vite)                 │
│  http://localhost:5173/                 │
│                                         │
│  - Three.js 3D visualization           │
│  - Speech input via WebSocket           │
│  - Speech output (audio playback)       │
└────────────────┬────────────────────────┘
                 │ WebSocket
                 │ ws://localhost:8340/ws/voice
                 ↓
┌─────────────────────────────────────────┐
│  JARVIS Backend (FastAPI)               │
│  http://localhost:8340/                 │
│                                         │
│  - WebSocket server for voice           │
│  - Nova AI integration (AleChatBot)     │
│  - Groq LLM for chat responses          │
│  - Cartesia TTS for voice synthesis     │
└─────────────────────────────────────────┘
```

## Troubleshooting

### "GROQ_API_KEY environment variable not set"

**Solution:** Set your API key (see "Before You Start" section above)

### "pip install fails with dependency errors"

**Solution:** Make sure you're in the backend directory and using the updated requirements.txt:
```bash
cd d:\Astra_ai\astra_ai\ui\backend
pip install -r requirements.txt --upgrade
```

### "npm install fails"

**Solution:** Clear npm cache and reinstall:
```bash
cd d:\Astra_ai\astra_ai\ui\frontend
npm cache clean --force
npm install
```

### "Port 8340 or 5173 already in use"

**Solution:** Find and kill the process:
```powershell
# Port 8340 (backend)
netstat -ano | findstr :8340
taskkill /PID <PID> /F

# Port 5173 (frontend)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

Or just wait a moment and try again - processes should clean up on exit.

### "Backend starts but frontend doesn't connect"

**Solution:** Check that WebSocket is working:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for WebSocket connection messages
4. If error, check that backend is actually running on port 8340

## Key Files

| File | Purpose |
|------|---------|
| `d:\Astra_ai\astra_ai\ui\frontend\server.js` | Process manager script (NEW) |
| `d:\Astra_ai\astra_ai\ui\frontend\package.json` | npm scripts (UPDATED) |
| `d:\Astra_ai\astra_ai\ui\backend\requirements.txt` | Python dependencies (FIXED) |
| `d:\Astra_ai\astra_ai\ui\backend\server.py` | FastAPI server (auto-runs Nova AI) |
| `d:\Astra_ai\start-all.ps1` | PowerShell startup script (NEW) |
| `d:\Astra_ai\start-all.bat` | Batch startup script (NEW) |

## Future Notes

### npm Scripts Available

```json
"dev"              - Run frontend only (Vite)
"build"            - Build for production
"preview"          - Preview production build
"server"           - Run backend only
"server:install"   - Install backend dependencies
"start"            - Build + start both services
"start:dev"        - Start both services (dev mode, RECOMMENDED)
"start:legacy"     - Old method using concurrently (fallback)
```

### Python Services

Backend runs in standalone Python process alongside npm scripts:
- Handles WebSocket connections
- Manages Nova AI chat bot
- Provides REST API endpoints
- Manages TTS and ASR services

### Node.js Process Manager

Custom `server.js` script:
- Spawns backend as child process
- Spawns frontend Vite as child process
- Handles graceful shutdown (Ctrl+C)
- Validates environment before starting
- Provides unified logging

---

**Last Updated:** Today
**Frontend Build Tool:** Vite v6
**Backend Framework:** FastAPI
**AI Engine:** Nova AI (AleChatBot + Groq)
**TTS Provider:** Cartesia
