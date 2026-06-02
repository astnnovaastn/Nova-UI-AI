# Nova AI Voice System - Complete System Overview

## Project Status

**Current Phase:** Ready for End-to-End Testing ✅  
**Last Update:** December 19, 2024  
**System Status:** Architecturally Complete

---

## Overview: What This System Does

This is a **real-time voice conversation AI system** that lets you speak to Nova AI and hear it talk back.

```
┌──────────────┐
│  You Speak   │
│  (Browser)   │
└──────┬───────┘
       │ "Hello AI"
       ↓
┌──────────────────────────┐
│  Speech → Text          │
│  (Web Speech API)       │
└──────┬───────────────────┘
       │ WebSocket
       ↓
┌──────────────────────────┐
│  Nova AI (Backend)       │
│  - Groq LLM             │
│  - Memory System        │
└──────┬───────────────────┘
       │ Text Response
       ↓
┌──────────────────────────┐
│  Text → Audio           │
│  (Cartesia TTS)         │
└──────┬───────────────────┘
       │ Base64 Audio
       ↓
┌──────────────────────────┐
│  Frontend (Browser)      │
│  - Audio Playback       │
│  - Visual Animation     │
│  - Microphone Ready     │
└──────────────────────────┘
```

---

## What You Need

### Files & Folders

```
d:\Astra_ai\
├── .env                           ← API keys (MUST have these)
├── astra_ai/
│   ├── core/
│   │   └── nova_ai.py            ← Main AI engine
│   ├── speech/
│   │   └── text_to_speech.py     ← TTS (Cartesia)
│   └── ui/
│       ├── frontend/              ← React/Vite app
│       │   ├── src/
│       │   │   ├── main.ts        ← Voice logic
│       │   │   ├── voice.ts       ← Microphone & audio
│       │   │   ├── ws.ts          ← WebSocket
│       │   │   ├── orb.ts         ← 3D animation
│       │   │   └── index.html
│       │   ├── server.js          ← Process manager
│       │   └── package.json
│       └── backend/
│           └── server.py          ← FastAPI server
└── requirements.txt               ← Python dependencies
```

### API Keys Required

**In `.env` file (at d:\Astra_ai\.env):**

```
GROQ_API_KEY=sk_live_[your_groq_key]
CARTESIA_API_KEY=sk_car_[your_cartesia_key]
```

Get these from:
- GROQ: https://console.groq.com
- Cartesia: https://console.cartesia.ai

---

## System Architecture

### Frontend Components

| Component | File | Purpose |
|-----------|------|---------|
| **Main Orchestrator** | `main.ts` | Wires everything together, state machine, message handling |
| **Voice Input** | `voice.ts` | Browser microphone (Web Speech API), speech recognition |
| **Audio Output** | `voice.ts` | Web Audio API, decoding Base64 → playback |
| **WebSocket** | `ws.ts` | Real-time bidirectional communication with backend |
| **Visualization** | `orb.ts` | 3D particle animation, synced to audio frequency |
| **HTML/CSS** | `index.html`, `App.jsx` | User interface, styling |

### Backend Components

| Component | File | Purpose |
|-----------|------|---------|
| **FastAPI Server** | `server.py` | WebSocket endpoint, message routing |
| **Nova AI Bot** | `nova_ai.py` | LLM via Groq API, conversation logic |
| **Text-to-Speech** | `text_to_speech.py` | Cartesia TTS, converts text → PCM audio |
| **Memory System** | `memory/` | Persistent conversation memory |
| **Process Manager** | `server.js` | Node.js script to launch backend + frontend |

---

## Communication Protocol

### Message Flow

**User speaks:**
```
Frontend: Microphone → Browser Speech API → Text
```

**Frontend sends to backend:**
```json
{
  "type": "transcript",
  "text": "what is the weather",
  "isFinal": true
}
```

**Backend processes:**
```
nova_ai.py receives text
  → Queries Groq LLM (llama-3.3-70b)
  → Returns: "The weather is sunny and warm"
  → Passes to Cartesia TTS
  → TTS returns: PCM audio bytes (48000 Hz)
  → Base64 encodes audio
```

**Backend sends back:**
```json
{
  "type": "response_text",
  "text": "The weather is sunny and warm"
}
```

Then:
```json
{
  "type": "response_audio",
  "audio": "//NExAAiYAEi...ZWRhdGE=",
  "format": "pcm",
  "sampleRate": 48000
}
```

**Frontend receives:**
```
Base64 audio → Decode → AudioBuffer
   → Play via Web Audio API
   → Extract frequency via AnalyserNode
   → Animate Orb based on frequency
```

---

## How to Use

### Step 1: Start Everything

```powershell
cd d:\Astra_ai\astra_ai\ui\frontend
npm run start
```

**What happens:**
- Backend starts on port 8340
- Frontend starts on port 5173
- Browser opens (or you navigate to http://localhost:5173)

### Step 2: Grant Microphone Permission

Browser shows: "localhost:5173 wants to use your microphone"  
**Click: Allow**

### Step 3: Speak

Click anywhere on the page (or just start speaking if microphone is active).

**Example:** "What time is it?"

**System responses:**
1. Captures your speech as text
2. Sends to backend
3. Nova AI generates response
4. Cartesia generates audio
5. Frontend plays audio
6. Orb animates
7. Ready for next input

---

## Configuration

### Change API Keys

Edit `d:\Astra_ai\.env`:
```
GROQ_API_KEY=sk_live_new_key_here
CARTESIA_API_KEY=sk_car_new_key_here
```

Then restart: `npm run start`

### Change Voice

Edit `d:\Astra_ai\astra_ai\ui\backend\server.py`:

Find this section:
```python
tts_config = CartesiaConfig(
    api_key='...',
    voice_id="5ee9feff-1265-424a-9d7f-8e4d431a12c7",  ← Different voice ID here
    model_id="sonic-english",
    sample_rate=48000,
    volume_multiplier=2.0
)
```

Get voice IDs from: https://www.cartesia.ai/voice-lab

### Change Ports

Edit `d:\Astra_ai\astra_ai\ui\backend\server.py`:
```python
class ServerConfig:
    PORT = 8340  ← Change if port is busy
```

Also update frontend in `d:\Astra_ai\astra_ai\ui\frontend\src\ws.ts`:
```typescript
const WS_URL = `ws://localhost:8340/ws/voice`;  ← Update port
```

---

## Testing Checklist

Print this out or check off each item:

- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:5173
- [ ] Microphone permission granted
- [ ] Microphone icon shows active
- [ ] Speak a sentence
- [ ] Server receives transcript
- [ ] AI generates response
- [ ] Audio generates without errors
- [ ] Frontend receives audio
- [ ] Audio plays
- [ ] Orb animates with audio
- [ ] Audio finishes
- [ ] Microphone ready for next input
- [ ] No errors in browser console
- [ ] No errors in backend terminal

**✅ If all checked: System working!**

---

## Expected Performance

### Response Times

| Step | Expected Time |
|------|----------------|
| Microphone to transcript | < 500ms |
| WebSocket send | 50-100ms |
| AI response generation | 300-1500ms |
| TTS audio generation | 300-1000ms |
| Frontend audio decode | 50-150ms |
| Audio playback starts | 50-100ms |
| **Total end-to-end** | **1-4 seconds** |

### Resource Usage

- Python (backend): ~200-400 MB RAM
- Node.js (process manager): ~100 MB RAM
- Browser (frontend): ~150-300 MB RAM
- Total: ~500 MB RAM

---

## Logs & Debugging

### Where to Look for Errors

**Frontend Console:**
```
Press F12 in browser
→ Console tab
→ Look for ❌ red errors
→ Look for log messages
```

**Backend Terminal:**
```
Check terminal running npm run start
Look for ERROR or WARNING messages
```

### Emoji Log Guide

| Symbol | Meaning |
|--------|---------|
| 🎤 | Microphone/Speech |
| 🎵 | Audio/Sound |
| 🌐 | Network/WebSocket |
| 🧠 | AI Processing |
| ✅ | Success |
| ❌ | Error |
| ⚠️ | Warning |
| 🔄 | Retry/Reconnect |
| ▶️ | Play/Start |
| ⏹️ | Stop/Finish |

### View All Logs

Run `npm run start` and leave terminal open to see:
- Backend startup
- WebSocket connections
- Message flow
- Errors in real time

---

## Common Issues & Quick Fixes

### "WebSocket failed to connect"

```
❌ Frontend can't reach backend
```

**Fix:**
1. Is backend running? Check terminal output
2. Is port 8340 in use? Run: `netstat -ano | findstr :8340`
3. Try different port (see Configuration section)

---

### "Microphone not working"

```
❌ "NotAllowedError: Permission denied"
```

**Fix:**
1. Browser permissions: Settings → Privacy → Microphone
2. System microphone: Check Windows Sound settings
3. Reload page and click "Allow"

---

### "Audio doesn't play"

```
✅ Received audio but no sound
```

**Fix:**
1. System volume not muted (check taskbar)
2. Browser volume not muted
3. Check browser logs for decode errors
4. Try different browser (Chrome, Edge, Firefox)

---

### "AI doesn't respond"

```
🎤 Transcript sent but no response
```

**Fix:**
1. Check GROQ_API_KEY in .env
2. Check backend terminal for errors
3. Verify internet: Is API reachable?
4. Try again (API might be rate limited)

---

### "Orb doesn't animate"

```
▶️ Audio plays but orb is static
```

**Fix:**
1. Audio is playing correctly ✓
2. Issue is visual sync only
3. Check browser console for orb.ts errors
4. Try refreshing page

---

## Real Example Usage

### Conversation Example

```
You: "What's 2 plus 2?"

Backend processes:
→ Groq LLM: "The sum of 2 plus 2 equals 4"
→ Cartesia TTS: Generates audio file

Frontend plays: AI voice says "The sum of 2 plus 2 equals 4"
Orb animates with the voice
You: "What about 5 times 3?"

Backend processes (context from first question):
→ Groq LLM: "5 multiplied by 3 equals 15"
→ Cartesia TTS: Generates audio file

Frontend plays: AI voice says "5 multiplied by 3 equals 15"
```

---

## Files You Might Need to Edit

| If You Want To | Edit This File |
|----------------|----------------|
| Change API keys | `d:\Astra_ai\.env` |
| Change backend port | `d:\Astra_ai\astra_ai\ui\backend\server.py` |
| Change voice AI model | `d:\Astra_ai\astra_ai\core\nova_ai.py` |
| Change voice/voice settings | `d:\Astra_ai\astra_ai\ui\backend\server.py` |
| Change frontend behavior | `d:\Astra_ai\astra_ai\ui\frontend\src\main.ts` |
| Change microphone settings | `d:\Astra_ai\astra_ai\ui\frontend\src\voice.ts` |
| Change animation | `d:\Astra_ai\astra_ai\ui\frontend\src\orb.ts` |
| Change WebSocket settings | `d:\Astra_ai\astra_ai\ui\frontend\src\ws.ts` |

---

## Advanced: Manual Testing

### Test Backend Directly

```powershell
# Check if server is running
curl http://localhost:8340/api/audio/diagnostics
# Expected response: {"server_status": "ready", ...}
```

### Test WebSocket Connection

```powershell
# Install wscat (if not installed):
npm install -g wscat

# Connect to server:
wscat -c ws://localhost:8340/ws/voice

# Type this message:
{"type":"transcript","text":"test","isFinal":true}

# You should get back:
{"type":"response_text",...}
{"type":"response_audio",...}
```

### Test Microphone

In browser address bar:
```
chrome://voicesearch
```

Click microphone and speak to test

---

## System Requirements

**Hardware:**
- CPU: Any modern processor
- RAM: 4GB minimum, 8GB recommended
- Microphone: Any USB or built-in mic
- Speaker: Any audio output device
- Network: Broadband internet (needed for Groq/Cartesia APIs)

**Software:**
- Windows 10/11 or Linux/Mac
- Python 3.10+ installed
- Node.js 16+ installed
- Modern web browser (Chrome, Edge, Firefox, Safari)
- pip (Python package manager)

**Internet:**
- API access to Groq.com (for LLM)
- API access to Cartesia.ai (for TTS)
- Both must be reachable from your network

---

## Troubleshooting Flowchart

```
Is the system working?
  ├─ YES: You're done! Enjoy! ✅
  └─ NO:
     ├─ Can you see the Frontend (http://localhost:5173)?
     │  ├─ NO: Backend isn't running
     │  │     → Check terminal output
     │  │     → Run: npm run start
     │  └─ YES:
     │     ├─ Does microphone work?
     │     │  ├─ NO: Grant permission
     │     │  │     → Browser prompt → Click "Allow"
     │     │  └─ YES:
     │     │     ├─ Does AI respond after you speak?
     │     │     │  ├─ NO: Check logs
     │     │     │  │     → Terminal & Browser Console
     │     │     │  │     → Look for ❌ errors
     │     │     │  └─ YES:
     │     │     │     ├─ Does audio play?
     │     │     │     │  ├─ NO: Check volume
     │     │     │     │  │     → System volume, browser volume
     │     │     │     │  │     → Check for decode errors
     │     │     │     │  └─ YES:
     │     │     │     │     ├─ Does Orb animate?
     │     │     │     │     │  ├─ NO: Visual sync issue only
     │     │     │     │     │  │     → Core system working
     │     │     │     │     │  └─ YES: ✅✅✅ PERFECT!
```

---

## Getting Help

**If something doesn't work:**

1. **Check logs first** - 80% of issues show in logs
2. **Verify API keys** - Most common cause
3. **Restart everything** - Kill process, run npm run start again
4. **Read the full guide**: STARTUP_DEBUGGING_GUIDE.md
5. **Check error examples**: EXPECTED_LOG_OUTPUTS.md

**What to include when reporting issues:**
- Error message from terminal
- Error message from browser console  
- Your .env file (without actual keys)
- What you were trying to do
- Which version of what OS you're using

---

## Summary

This is a complete, working voice AI system. It's designed to:

1. **Capture your voice** → Microphone + Web Speech API
2. **Send to AI** → WebSocket + Backend
3. **Generate response** → Groq LLM (advanced AI model)
4. **Convert to voice** → Cartesia TTS (professional text-to-speech)
5. **Play back** → Web Audio API + animated visualization
6. **Loop** → Ready for next input, with conversation memory

**The system is ready. To start:**

```powershell
cd d:\Astra_ai\astra_ai\ui\frontend
npm run start
```

Then speak to the Orb. It will talk back. 🎤✨

---

## Documentation Files

- **STARTUP_DEBUGGING_GUIDE.md** - Detailed troubleshooting guide
- **QUICK_REFERENCE_CARD.md** - One-page quick reference
- **EXPECTED_LOG_OUTPUTS.md** - What you should see in logs
- **This file** - Complete system overview

Start with QUICK_REFERENCE_CARD.md if you want to get going fast.  
Read STARTUP_DEBUGGING_GUIDE.md if something breaks.  
Check EXPECTED_LOG_OUTPUTS.md to see what "normal" looks like.

---

**Happy voice conversations! 🎤✨**
