# Nova AI System - Message Flow Documentation

## 🚀 Quick Start

To run the complete Nova AI system, simply execute:
```bash
START_NOVA_AI.bat
```

This will start both the backend server and React UI automatically.

## 📊 Message Flow Architecture

### Complete Flow Diagram
```
┌─────────────┐
│   User      │
│  (React UI) │
└──────┬──────┘
       │ 1. Sends message
       ▼
┌─────────────────────┐
│  ChatInterface.jsx  │
│  (React Frontend)   │
└──────┬──────────────┘
       │ 2. HTTP POST to /api/chat
       ▼
┌─────────────────────┐
│    server.py        │
│  (Backend Server)   │
└──────┬──────────────┘
       │ 3. Forwards to nova_ai.py
       ▼
┌─────────────────────┐
│    nova_ai.py       │
│  (AI Processing)    │
└──────┬──────────────┘
       │ 4. Uses memory system
       ▼
┌─────────────────────┐
│ nova_ai_memory.json │
│  (Memory Storage)   │
└──────┬──────────────┘
       │ 5. Reads/Writes
       ▼
┌─────────────────────┐
│    nova_ai.py       │
│  (Response ready)   │
└──────┬──────────────┘
       │ 6. Returns AI response
       ▼
┌─────────────────────┐
│    server.py        │
│  (Backend Server)   │
└──────┬──────────────┘
       │ 7. Sends response back
       ▼
┌─────────────────────┐
│  ChatInterface.jsx  │
│  (React Frontend)   │
└──────┬──────────────┘
       │ 8. Displays to user
       ▼
┌─────────────┐
│   User      │
│ (Sees reply)│
└─────────────┘
```

## 🔧 System Components

### 1. React Frontend (`astra_ai/ui/src/components/Chat/ChatInterface.jsx`)
- **Responsibility**: User interface and chat display
- **Port**: `http://localhost:3002`
- **Key Functions**:
  - Captures user input
  - Sends messages to backend server
  - Displays AI responses
  - Manages chat history in UI
- **API Endpoint**: `POST http://127.0.0.1:5001/api/chat`

### 2. Backend Server (`astra_ai/ui/src/backend/server.py`)
- **Responsibility**: API layer between UI and AI
- **Port**: `http://127.0.0.1:5001`
- **Key Functions**:
  - Receives messages from React frontend via `/api/chat` endpoint
  - Initializes and manages Nova AI instance
  - Forwards messages to `nova_ai.py`
  - Returns AI responses to frontend
- **Key Routes**:
  - `POST /api/chat` - Main chat endpoint
  - `GET /api/health` - Health check
  - `GET /api/status` - Server status

### 3. Nova AI (`astra_ai/core/nova_ai.py`)
- **Responsibility**: AI processing and response generation
- **Key Functions**:
  - Processes user messages using AI model
  - Manages conversation context
  - Integrates with memory system
  - Generates intelligent responses
- **Main Method**: `get_chat_response(user_message, session_id)`

### 4. Memory System (`Date/nova_ai_memory.json`)
- **Responsibility**: Persistent storage of conversations and context
- **Managed By**: `nova_ai.py` (fully independent)
- **Structure**:
  ```json
  {
    "user": { ... },
    "memory_events": [ ... ],
    "conversation": [ ... ],
    "sessions": { ... },
    "current_session": "session_xxx"
  }
  ```

## 📝 Detailed Message Flow

### Step 1: User Sends Message
```javascript
// In ChatInterface.jsx
const response = await fetch('http://127.0.0.1:5001/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Hello Nova!",
    session_id: "session_1234567890"
  })
});
```

### Step 2: Server Receives Message
```python
# In server.py
@self.app.route('/api/chat', methods=['POST'])
def chat_endpoint():
    data = request.get_json()
    message = data['message']
    session_id = data.get('session_id', 'default_session')
    
    # Forward to Nova AI
    response = self.process_chat_message(message, session_id)
    
    return jsonify({ 'response': response })
```

### Step 3: Forwarding to Nova AI
```python
# In server.py -> process_chat_message()
import asyncio
response = asyncio.run(
    self.chatbot.get_chat_response(message, session_id)
)
```

### Step 4: Nova AI Processing
```python
# In nova_ai.py -> get_chat_response()
async def get_chat_response(self, user_message, session_id):
    # 1. Create message format
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ]
    
    # 2. Process through AI model
    response = await self.get_response(messages)
    
    # 3. Memory system automatically tracks conversation
    # (happens in get_response method)
    
    return response
```

### Step 5: Memory System Update
```python
# Memory is automatically updated by nova_ai.py
# Writes to: Date/nova_ai_memory.json
{
  "conversation": [
    {
      "role": "user",
      "content": "Hello Nova!",
      "timestamp": "2025-12-15T17:58:13",
      "session_id": "session_1234567890"
    },
    {
      "role": "assistant",
      "content": "Hello! How can I help you today?",
      "timestamp": "2025-12-15T17:58:14",
      "session_id": "session_1234567890"
    }
  ]
}
```

### Step 6-8: Response Returns to User
```javascript
// In ChatInterface.jsx
if (response.ok) {
  const data = await response.json();
  const aiResponse = data.response;
  
  // Display in UI
  addMessage(aiResponse, false);
}
```

## 🔑 Key Points

### Backend Responsibilities
- ✅ Receives messages from React frontend
- ✅ Initializes and manages Nova AI instance
- ✅ Forwards messages to Nova AI
- ✅ Returns responses to frontend
- ❌ Does **NOT** manage memory directly

### Nova AI Responsibilities
- ✅ Processes messages using AI model
- ✅ Manages memory system **independently**
- ✅ Reads/writes to `nova_ai_memory.json`
- ✅ Maintains conversation context across sessions

### Frontend Responsibilities
- ✅ Provides user interface
- ✅ Sends messages to backend
- ✅ Displays AI responses
- ✅ Manages session persistence

## 🚦 Starting the System

### Method 1: Automatic (Recommended)
```bash
# Run the startup script
START_NOVA_AI.bat
```

### Method 2: Manual
```bash
# Terminal 1: Start Backend
cd astra_ai/ui/src/backend
python server.py

# Terminal 2: Start Frontend
cd astra_ai/ui
npm start
```

### Method 3: Using npm (from UI folder)
```bash
cd astra_ai/ui
npm start
# This runs both backend and frontend using concurrently
```

## 🔍 Debugging

### Check Backend Server
```bash
# Test health endpoint
curl http://127.0.0.1:5001/api/health
```

### Check Frontend
```bash
# Open in browser
http://localhost:3002
```

### View Memory File
```bash
# Check if memory is being updated
cat Date/nova_ai_memory.json
```

### Console Logs
- **Backend**: Check terminal running `server.py`
- **Frontend**: Check browser console (F12)
- **Nova AI**: Check `alebot.log` and `alebot_detailed.log`

## 📦 Dependencies

### Backend
- Python 3.8+
- Flask
- Flask-CORS
- All Nova AI dependencies (see requirements.txt)

### Frontend
- Node.js 14+
- React 18
- concurrently (for running both servers)

## 🔄 Session Persistence

Sessions are tracked using:
- `session_id` passed from frontend
- Stored in `localStorage` for persistence across page refreshes
- Memory system maintains conversation history per session

## 💾 Memory Persistence

All conversation data persists in `Date/nova_ai_memory.json`:
- Chat history
- User preferences
- Session metadata
- Memory events
- Fact history

**Important**: The memory system is **fully managed by `nova_ai.py`**. The backend server only passes messages and receives responses.

## 🎯 Testing the Flow

1. **Start the system**: Run `START_NOVA_AI.bat`
2. **Send a message**: Type "Hello" in the chat
3. **Check logs**:
   - Backend terminal: Should show "📤 Forwarding message to Nova AI"
   - Backend terminal: Should show "✅ Got AI response from Nova AI"
   - Browser console: Should show "🚀 Sending message to Nova AI backend"
   - Browser console: Should show "✅ Received response from Nova AI"
4. **Verify memory**: Open `Date/nova_ai_memory.json` and see the conversation entry

## ⚠️ Common Issues

### Backend won't start
- Check if port 5001 is already in use
- Ensure virtual environment is activated
- Verify all dependencies are installed

### Frontend can't connect to backend
- Ensure backend is running on port 5001
- Check CORS settings in `server.py`
- Verify frontend is making request to `http://127.0.0.1:5001`

### Memory not updating
- Check file permissions for `Date/nova_ai_memory.json`
- Ensure Nova AI has write access to Date folder
- Check `alebot_detailed.log` for memory system errors
