# JARVIS Server - Nova AI Backend
## WebSocket-Based AI Assistant Server

A FastAPI-powered backend server that bridges your frontend UI with Nova AI, enabling real-time voice-based AI conversations with WebSocket communication.

---

## 🚀 Quick Start

### 1. **Installation**

```bash
# Navigate to backend directory
cd astra_ai/ui/backend

# Install dependencies
pip install -r requirements.txt
```

### 2. **Start the Server**

**Windows:**
```bash
start_server.bat
```

**Linux/Mac:**
```bash
chmod +x start_server.sh
./start_server.sh
```

**Manual:**
```bash
python server.py
```

### 3. **Open Frontend**
Once the server is running, open your browser to:
- **Frontend UI:** http://localhost:8340/
- **WebSocket:** ws://localhost:8340/ws/voice (automatic)
- **REST API:** http://localhost:8340/api

---

## 📡 WebSocket Communication

### Connection
```
ws://localhost:8340/ws/voice
```

### Message Types

#### **1. User Transcript (Frontend → Server)**
```json
{
  "type": "transcript",
  "text": "What is the weather today?",
  "isFinal": true
}
```

#### **2. AI Audio Response (Server → Frontend)**
```json
{
  "type": "audio",
  "data": "UklGRiQAAABXQVZFZm10IBAAAA...",
  "text": "It's currently 72 degrees and sunny."
}
```

#### **3. Status Update (Server → Frontend)**
```json
{
  "type": "status",
  "state": "thinking"
}
```

Possible states:
- `idle` - Ready for input
- `thinking` - Processing user request
- `working` - Executing a task  
- `speaking` - Playing audio response

#### **4. Text-Only Fallback (Server → Frontend)**
```json
{
  "type": "text",
  "text": "I couldn't generate audio, but here's the response..."
}
```

#### **5. Ping/Pong (Keep-Alive)**
```json
{
  "type": "ping"
}
```

---

## 🔌 REST API Endpoints

### Health & Status
```bash
# Health check
GET http://localhost:8340/api/health

# Server status
GET http://localhost:8340/api/status

# Server logs
GET http://localhost:8340/api/logs?lines=100
```

### Chat & Response
```bash
# Chat via REST (alternative to WebSocket)
POST http://localhost:8340/api/chat
Content-Type: application/json
{
  "text": "Hello, how are you?"
}
```

### Memory System
```bash
# Store memory
POST http://localhost:8340/api/memory/store
{
  "content": "User prefers coffee over tea",
  "type": "user_preference"
}

# Recall memory
GET http://localhost:8340/api/memory/recall?query=user+preferences
```

### Session Management
```bash
# Create new session
POST http://localhost:8340/api/session/new
{
  "session_id": "my_unique_session"
}
```

### Server Control
```bash
# Restart server
POST http://localhost:8340/api/restart
```

---

## 🎯 Server Architecture

### Components

1. **FastAPI App** - Main server framework
   - WebSocket endpoint for voice
   - REST API for control & queries
   - CORS middleware for cross-origin requests

2. **WebSocket Manager** - Connection handling
   - Manages multiple client connections
   - Routes messages appropriately
   - Broadcasts status updates

3. **Nova AI Integration** - Core AI logic
   - `AleChatBot` instance for responses
   - Memory systems integration
   - Context awareness

4. **TTS Engine** - Audio generation
   - Cartesia API integration
   - Base64 encoding for transmission
   - Quality & volume optimization

5. **State Manager** - Global server state
   - Tracks active connections
   - Manages processing state
   - Prevents duplicate requests

### Message Flow

```
┌─────────────┐
│  Frontend   │
│     UI      │
└──────┬──────┘
       │ WebSocket
       ↓
┌──────────────────┐
│  JARVIS Server   │
│                  │
│  ┌────────────┐  │
│  │ WebSocket  │  │
│  │  Manager   │  │
│  └────────────┘  │
│         │        │
│  ┌──────▼──────┐ │
│  │  Nova AI    │ │
│  │  (AleChatBot)│ │
│  └─────────────┘ │
│         │        │
│  ┌──────▼──────┐ │
│  │    TTS      │ │
│  │  (Cartesia) │ │
│  └─────────────┘ │
└──────────────────┘
       │ WebSocket
       ↓
┌─────────────────────┐
│   Audio Response    │
│   (Base64 WAV)      │
└─────────────────────┘
```

---

## ⚙️ Configuration

### Server Settings
Edit `server.py` in the `ServerConfig` class:

```python
class ServerConfig:
    HOST = "0.0.0.0"              # Listen on all interfaces
    PORT = 8340                   # Server port
    WS_ENDPOINT = "/ws/voice"     # WebSocket path
    MAX_CONNECTIONS = 10          # Max simultaneous connections
    TTS_ENABLED = True            # Enable text-to-speech
    MEMORY_ENABLED = True         # Enable memory system
    VOICE_MULTIPLIER = 2.0        # Audio volume multiplier
```

### Environment Variables
Set these before running the server:

```bash
# Required
export GROQ_API_KEY="your_groq_api_key"

# Optional
export LLM_API_KEY="your_llm_api_key"
export SERPAPI_KEY="your_serpapi_key"
export NEWSAPI_KEY="your_news_api_key"
```

---

## 🐛 Troubleshooting

### Server won't start
```bash
# Check if port 8340 is in use
lsof -i :8340  # macOS/Linux
netstat -ano | findstr :8340  # Windows

# Use a different port
# Edit ServerConfig.PORT in server.py
```

### WebSocket connection fails
1. Ensure server is running: `http://localhost:8340/api/health`
2. Check browser console for errors (F12)
3. Verify firewall allows localhost:8340

### No audio output
1. Check TTS initialization: `GET /api/health`
2. Verify Cartesia API key is valid
3. Check server logs: `GET /api/logs`

### Memory system not working
1. Verify `mem0_memory.py` is installed
2. Check memory folder permissions
3. Test with REST API: `POST /api/memory/store`

---

## 📊 Monitoring

### Check Server Health
```bash
curl http://localhost:8340/api/health
```

### View Active Connections
```bash
curl http://localhost:8340/api/status
```

### Get Recent Logs
```bash
curl "http://localhost:8340/api/logs?lines=50"
```

---

## 🔐 Security Considerations

⚠️ **Important:** This server is designed for local use. For production:

1. Add authentication
2. Use HTTPS/WSS instead of HTTP/WS
3. Implement rate limiting
4. Add request validation
5. Use environment variables for secrets
6. Enable CORS restrictions

---

## 🚀 Advanced Usage

### Custom Greeting System
The server automatically loads the Smart Greeting System if available:
- Provides contextual greetings
- Remembers user preferences
- Learns communication patterns

### Task Management
Automatically spawns and manages:
- Code execution tasks
- File operations
- System commands

### Vision Integration
Supports image analysis when available:
- Camera input
- Screen capture
- Image file analysis

### Knowledge Base
Integrated search and knowledge features:
- Web search
- News summaries
- Weather information
- Video analysis

---

## 📝 Logging

Server logs are saved to:
- **Terminal:** Real-time output
- **File:** `jarvis_server.log`

Log levels: DEBUG, INFO, WARNING, ERROR, CRITICAL

---

## 🤝 Contributing

To improve the server:

1. Check server logs for errors
2. Test WebSocket messages with `ws://localhost:8340/ws/voice`
3. Submit improvements to the Nova AI core

---

## 📞 Support

For issues:
1. Check `/api/logs` for error messages
2. Verify all dependencies are installed
3. Ensure API keys are set correctly
4. Check firewall/network settings

---

## 📄 License

MIT License - Use freely with attribution

---

## 🎉 Features

✅ Real-time WebSocket communication
✅ Nova AI integration (AleChatBot)
✅ Text-to-Speech audio generation
✅ Long-term memory system
✅ Multi-session support
✅ REST API fallback
✅ Automatic reconnection
✅ Health monitoring
✅ Comprehensive logging
✅ CORS support

---

**Ready to chat with JARVIS!** 🎤🤖
