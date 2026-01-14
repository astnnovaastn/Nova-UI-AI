# Nova AI Backend Architecture

## 📋 Overview

The backend follows a **simple pass-through architecture** where:
- `server.py` = Message relay between React and AI
- `nova_ai.py` = AI brain with full memory management
- JSON files = Communication channel

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                    (React Chat - Port 3002)                     │
│                                                                 │
│  Components:                                                    │
│  ├─ ChatInterface.jsx  - Main chat component                   │
│  ├─ ModernChat.jsx     - Modern UI variant                     │
│  └─ ChatMessage.jsx    - Message display                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP POST /api/chat
                         │ { message, session_id }
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVER                             │
│                  (Flask API - Port 5000)                        │
│                       server.py                                 │
│                                                                 │
│  Role: MESSAGE RELAY ONLY                                      │
│  ├─ Receives messages from React                               │
│  ├─ Forwards to nova_ai.py via message queue                   │
│  ├─ Waits for AI response                                      │
│  ├─ Reads response from memory file                            │
│  └─ Returns to React                                           │
│                                                                 │
│  Does NOT:                                                     │
│  ✗ Manage memory                                               │
│  ✗ Process AI logic                                            │
│  ✗ Store chat history                                          │
└────────┬───────────────────────────────────────┬───────────────┘
         │                                       │
         │ Writes to                             │ Reads from
         ▼                                       ▼
┌─────────────────────┐              ┌─────────────────────┐
│  MESSAGE QUEUE      │              │  MEMORY FILE        │
│                     │              │                     │
│ message_queue.json  │              │nova_ai_memory.json  │
│                     │              │                     │
│ Contains:           │              │ Contains:           │
│ ├─ Pending messages │              │ ├─ Conversations    │
│ ├─ Session IDs      │              │ ├─ User context     │
│ └─ Timestamps       │              │ ├─ Memory events    │
└──────────┬──────────┘              │ └─ AI responses     │
           │                         └──────────▲──────────┘
           │ Reads from                         │
           │                                    │ Writes to
           ▼                                    │
┌─────────────────────────────────────────────┴──────────────────┐
│                      NOVA AI CORE                               │
│                 (Python Subprocess)                             │
│                    nova_ai.py --server                          │
│                                                                 │
│  Role: AI BRAIN + MEMORY MANAGER                               │
│  ├─ Reads messages from queue                                  │
│  ├─ Processes with Groq API                                    │
│  ├─ Manages memory system                                      │
│  ├─ Maintains context across sessions                          │
│  └─ Writes responses to memory file                            │
│                                                                 │
│  Memory System (FULLY MANAGED HERE):                           │
│  ├─ Short-term conversation memory                             │
│  ├─ Long-term fact storage                                     │
│  ├─ User preferences and context                               │
│  └─ Session management                                         │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Message Flow (Step by Step)

### Step 1: User Sends Message
```
User types: "What's the weather?"
   ↓
ChatInterface.jsx sends POST to http://localhost:5000/api/chat
{
  "message": "What's the weather?",
  "session_id": "session_123456"
}
```

### Step 2: Server Receives and Forwards
```
server.py receives the message
   ↓
Creates unique message ID: "msg_abc123"
   ↓
Writes to message_queue.json:
{
  "messages": [
    {
      "id": "msg_abc123",
      "message": "What's the weather?",
      "session_id": "session_123456",
      "timestamp": "2025-12-13T22:22:00"
    }
  ]
}
```

### Step 3: AI Reads and Processes
```
nova_ai.py (running in background) detects new message
   ↓
Reads from message_queue.json
   ↓
Loads conversation history from nova_ai_memory.json
   ↓
Sends to Groq API with context
   ↓
Receives AI response: "I'd be happy to help with weather..."
```

### Step 4: AI Writes Response
```
nova_ai.py writes to nova_ai_memory.json:
{
  "conversation": [
    {
      "role": "user",
      "content": "What's the weather?",
      "timestamp": "2025-12-13T22:22:00",
      "message_id": "msg_abc123"
    },
    {
      "role": "assistant",
      "content": "I'd be happy to help with weather...",
      "timestamp": "2025-12-13T22:22:02",
      "message_id": "response_msg_abc123"
    }
  ],
  "memory_events": [...],
  "user": {...},
  ...
}
```

### Step 5: Server Reads and Returns
```
server.py polls nova_ai_memory.json
   ↓
Finds response with message_id: "response_msg_abc123"
   ↓
Returns to React:
{
  "response": "I'd be happy to help with weather...",
  "session_id": "session_123456",
  "timestamp": "2025-12-13T22:22:02"
}
```

### Step 6: UI Displays Response
```
React receives response
   ↓
ChatMessage.jsx renders AI message
   ↓
User sees the reply
```

## 🎯 Key Principles

### 1. Single Responsibility
- **server.py**: HTTP API + message passing ONLY
- **nova_ai.py**: AI processing + memory management ONLY
- **JSON files**: Simple file-based communication

### 2. Independence
- Nova AI runs as independent subprocess
- Can restart server.py without losing memory
- AI continues processing even if HTTP requests fail

### 3. Persistence
- All chat history in `nova_ai_memory.json`
- Context persists across sessions
- User preferences remembered
- No database needed

### 4. Simplicity
- No complex message queues (Redis, RabbitMQ)
- No WebSockets (just HTTP)
- File-based communication (reliable on all platforms)

## 📁 File Locations

```
astra_ai/
├── ui/
│   ├── src/
│   │   ├── backend/
│   │   │   └── server.py          ← Backend API
│   │   └── components/
│   │       └── Chat/
│   │           ├── ChatInterface.jsx  ← React UI
│   │           ├── ModernChat.jsx
│   │           └── ChatMessage.jsx
│   └── package.json               ← npm start script
├── core/
│   └── nova_ai.py                 ← AI Brain
└── Date/
    ├── message_queue.json         ← Message channel
    └── nova_ai_memory.json        ← Memory + Responses
```

## 🚀 Starting the System

### 1. Start Backend (automatically starts AI)
```bash
cd ui
npm start
```

This runs:
1. `server.py` starts on port 5000
2. `server.py` auto-starts `nova_ai.py --server`
3. React UI starts on port 3002

### 2. What Runs Where

**Terminal 1 (Backend):**
```
Starting Nova AI subprocess in server mode...
Nova AI subprocess started with PID: 12345
Starting Nova AI Backend Server on 127.0.0.1:5000
```

**Terminal 2 (React):**
```
Compiled successfully!
You can now view nova-ai-react in the browser.
Local: http://localhost:3002
```

**Background (nova_ai.py):**
```
🚀 Starting Nova AI in server mode...
✅ Nova AI initialized successfully
📁 Message queue: .../Date/message_queue.json
📁 Memory file: .../Date/nova_ai_memory.json
🔄 Listening for messages...
```

## 🔍 Debugging

### Check if AI is Running
```bash
# Windows
tasklist | findstr python

# Should show:
# python.exe   12345  Console  ...  server.py
# python.exe   12346  Console  ...  nova_ai.py
```

### Check Message Queue
```bash
cat ../Date/message_queue.json
# Should show pending messages
```

### Check Memory File
```bash
cat ../Date/nova_ai_memory.json | jq '.conversation[-5:]'
# Shows last 5 conversation entries
```

### Test the Flow
```bash
# 1. Send a message via curl
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","session_id":"test"}'

# 2. Check logs
# Backend: Should show "Processing message: Hello"
# AI: Should show "📨 Processing message: Hello"

# 3. Check response
# Should return: {"response":"Hi there!...", ...}
```

## ✅ Verification Checklist

- [ ] `npm start` runs without errors
- [ ] Backend shows "Nova AI subprocess started"
- [ ] AI shows "Listening for messages"
- [ ] React UI opens on http://localhost:3002
- [ ] Sending a message gets a response
- [ ] Message appears in `nova_ai_memory.json`
- [ ] Context is maintained across messages
- [ ] Restarting preserves chat history

## 🎉 That's It!

The architecture is intentionally simple:
- React sends messages → Server forwards → AI processes → Server returns
- Memory is 100% managed by nova_ai.py
- Everything persists in JSON files
- No complex infrastructure needed!
