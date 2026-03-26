# Nova AI System - Setup and Run Guide

## ✅ What I Fixed

The chat interface was trying to call Google's Gemini API directly, which was causing the "API Error: 500" because:
1. The Gemini API key was missing or invalid
2. The system wasn't using your Nova AI backend at all

**Solution**: I updated `ChatInterface.jsx` to connect to your Nova AI backend server (`nova_ai.py`) instead of calling Gemini directly.

## 🚀 How to Run the Complete System

### Option 1: Using the Batch File (Recommended)

1. **Open Command Prompt** in the project root:
   ```
   cd c:\Users\afian\OneDrive\Desktop\Astra_ai
   ```

2. **Run the startup script**:
   ```
   start_nova.bat
   ```

   This will:
   - Start the Nova AI backend server (Python) in one window
   - Start the React frontend in another window
   - Automatically open your browser to http://localhost:3000

### Option 2: Using npm start

1. **Open Command Prompt** in the project root:
   ```
   cd c:\Users\afian\OneDrive\Desktop\Astra_ai
   ```

2. **Run**:
   ```
   npm start
   ```

   This triggers `start_nova.bat` automatically.

### Option 3: Manual Start (For Debugging)

**Terminal 1 - Backend**:
```cmd
cd c:\Users\afian\OneDrive\Desktop\Astra_ai\astra_ai\core
py nova_server.py
```

**Terminal 2 - Frontend**:
```cmd
cd c:\Users\afian\OneDrive\Desktop\Astra_ai\astra_ai\ui
npm start
```

## 🔍 Verifying the System is Running

### Backend Check:
You should see:
```
Nova AI ChatBot initialized successfully
[MEMORY] NovaMemoryAI system ONLINE - Storing conversations in astra_ai\Date\nova_ai_memory.json
Starting Nova AI Server on port 5001
 * Running on http://127.0.0.1:5001
```

### Frontend Check:
- Browser opens to `http://localhost:3000`
- You see the Nova AI interface
- Chat window is visible

## 💬 Testing the Chat

1. **Open the chat** by clicking the floating chat button
2. **Send a test message**: "Hello Nova"
3. **Expected behavior**:
   - Your message appears in a blue bubble (right side)
   - Nova's response appears in a gray/cyan bubble (left side)
   - No error messages about connection issues

## 🐛 Troubleshooting

### Error: "I'm having trouble connecting to my systems"

**Cause**: Backend server not running

**Fix**:
1. Check if `nova_server.py` is running
2. Look for the backend terminal window
3. If not running, restart using `start_nova.bat`

### Error: "Port 5001 already in use"

**Cause**: Another instance of the server is running

**Fix**:
```cmd
taskkill /F /IM python.exe /T
```
Then restart the system.

### Error: "npm start" fails in root folder

**Cause**: Missing package.json (I created it for you)

**Fix**: Make sure you're in `c:\Users\afian\OneDrive\Desktop\Astra_ai`

### Chat loads but no response

**Cause**: Backend crashed or API key issues

**Fix**:
1. Check the backend terminal for errors
2. Verify `.env` file has `GROQ_API_KEY` set
3. Restart the backend

## 📁 File Structure

```
Astra_ai/
├── start_nova.bat          # Main startup script
├── package.json            # Root package.json (allows npm start)
├── astra_ai/
│   ├── core/
│   │   ├── nova_ai.py      # Main AI logic
│   │   └── nova_server.py  # Flask API server (NEW)
│   ├── memory/
│   │   ├── mem0_memory_system.py
│   │   └── Mem0_ai_organizer.py
│   └── ui/
│       ├── package.json
│       ├── ai_responses.json  # Conversation history
│       └── src/
│           └── components/
│               └── Chat/
│                   ├── ChatInterface.jsx  # UPDATED
│                   ├── ModernChat.jsx
│                   └── ChatMessage.jsx
```

## 🔗 API Endpoints

The backend server (`nova_server.py`) provides:

- **POST /chat**: Send messages to Nova AI
  ```json
  {
    "message": "Hello",
    "conversation_id": "session_123",
    "user_location": null
  }
  ```

- **GET /api/chat/history**: Get conversation history
  Returns the contents of `ai_responses.json`

## 💾 Memory System

Your conversations are stored in:
- `astra_ai/ui/ai_responses.json` - Full conversation log
- `astra_ai/Date/nova_ai_memory.json` - AI memory system

The memory system (`mem0`) automatically:
- Remembers facts about you
- Maintains conversation context
- Learns from interactions

## 🎯 Next Steps

1. **Test basic chat**: Send "Hello" and verify response
2. **Test commands**: Try "search for AI news" or "what's the weather"
3. **Test widgets**: Commands should trigger widgets automatically
4. **Check memory**: Ask "what do you remember about me?"

## ⚙️ Configuration

### Port Configuration
Default: `5001`

To change:
1. Set environment variable: `set PORT=5002`
2. Or pass in URL: `http://localhost:3000?api_port=5002`

### API Keys Required
In `.env` file:
- `GROQ_API_KEY` - For AI responses (required)
- `MEM0_API_KEY` - For memory system (optional)
- Other keys for specific features (weather, news, etc.)

## 📊 System Status

You can check system status at any time:
- Backend logs: Check the Python terminal window
- Frontend logs: Press F12 in browser → Console tab
- Memory file: View `astra_ai/Date/nova_ai_memory.json`

## 🎉 Success Indicators

✅ Backend shows "Running on http://127.0.0.1:5001"
✅ Frontend opens in browser
✅ Chat sends and receives messages
✅ No error messages in console
✅ Conversation saved to `ai_responses.json`

---

**Need Help?**
- Check backend terminal for Python errors
- Check browser console (F12) for JavaScript errors
- Verify all dependencies installed: `py -m pip install flask flask-cors watchdog`
