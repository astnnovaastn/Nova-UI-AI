# 🚀 Nova AI - UI Integration Guide

## Overview
This guide explains how to connect your Nova AI backend with the UI frontend through the `run_desktop_nova.py` server script. When running the server, users can talk with the AI using the web UI, and the AI will respond in real-time.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Web UI)                         │
│              (splash_screen.html)                           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Chat Interface                                      │  │
│  │  - Message Input                                     │  │
│  │  - Display Messages                                  │  │
│  │  - Send to /api/chat                                │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                    HTTP Requests/Responses
                           │
          ┌────────────────┴────────────────┐
          │                                 │
    ┌─────▼──────┐               ┌────────▼──────┐
    │ UI Server  │               │ API Server    │
    │  Port: N   │               │  Port: M      │
    │ (HTML/CSS/ │               │ (Flask)       │
    │  JS files) │               │               │
    └────────────┘               └───────┬───────┘
                                         │
                            ┌────────────▼────────────┐
                            │   Nova AI Core          │
                            │                         │
                            │ - AleChatBot (Basic)    │
                            │ - EnhancedNovaAI        │
                            │ - Memory Systems        │
                            │ - Response Generation   │
                            │ - Learning Systems      │
                            └─────────────────────────┘
```

## How It Works

### 1. **Server Startup** (`run_desktop_nova.py`)
When you run the script:
- ✅ Initializes Nova AI (AleChatBot or EnhancedNovaAI)
- ✅ Starts Flask API server (e.g., port 5000)
- ✅ Starts UI HTTP server (e.g., port 8000)
- ✅ Opens UI in default browser

### 2. **User Sends Message**
When a user types a message in the UI:
- User types in chat input
- Clicks "Send" or presses Enter
- Frontend sends POST request to `/api/chat` endpoint
- Request includes: message, session_id, user_location

### 3. **AI Processing** (`/api/chat` endpoint)
Server processes the message:
```
1. Receive request with user message
2. Check if Nova AI is initialized
3. Determine AI method to use:
   - EnhancedNovaAI: process_message()
   - AleChatBot: get_response()
   - Fallback: chat()
4. Generate AI response (async)
5. Store conversation in memory
6. Return response to UI
```

### 4. **UI Displays Response**
Frontend receives response:
- Displays AI message in chat
- Updates UI with typing indicators
- Ready for next message

## Key Components

### Frontend Files
- **[splash_screen.html](astra_ai/ui/splash_screen.html)**: Main UI with chat interface
- Handles `/api/chat` calls
- Manages session ID and location
- Displays messages and animations

### Backend Files
- **[run_desktop_nova.py](astra_ai/scripts/run_desktop_nova.py)**: Main server script
  - Initializes Nova AI
  - Starts Flask API server
  - Handles HTTP requests
  
- **[nova_ai.py](astra_ai/core/nova_ai.py)**: AI core
  - AleChatBot class
  - Response generation
  - Memory management

## Running the System

### Quick Start
```bash
# Method 1: Run directly
python astra_ai/scripts/run_desktop_nova.py

# Method 2: From workspace root
cd c:\Users\afian\OneDrive\Desktop\Astra_ai
python -m astra_ai.scripts.run_desktop_nova

# Method 3: Using Python directly
python.exe astra_ai/scripts/run_desktop_nova.py
```

### What You'll See
```
🤖 Initializing Nova AI...
📚 Attempting to initialize AleChatBot...
✅ Basic AleChatBot initialized successfully
   AI Type: Basic Nova AI
   Status: Ready to process messages

🌐 Starting UI server on port 8000
🔌 Starting API server on port 5000

✅ All servers started successfully!
🖥️ Opening Nova AI interface...
🌐 Opening Nova AI interface in your default browser...
🔗 URL: http://127.0.0.1:8000/splash_screen.html?api_port=5000

✅ Browser opened successfully!
🚀 Nova AI Desktop Interface Ready! (Browser Mode)
```

## API Endpoints

### 1. Chat Endpoint
**URL**: `POST /api/chat`

**Request**:
```json
{
  "message": "Hello Nova AI!",
  "session_id": "unique_session_id",
  "user_location": "Italy"
}
```

**Response**:
```json
{
  "response": "Hello! I'm Nova AI. How can I help you today?",
  "session_id": "unique_session_id",
  "timestamp": "2024-12-10T10:30:00"
}
```

### 2. Status Endpoint
**URL**: `GET /api/status`

Returns system status and AI information.

### 3. Memory Status Endpoint
**URL**: `GET /api/memory/status`

Returns memory system statistics.

## Troubleshooting

### Issue: "Nova AI not initialized"
**Solution**: 
- Check GROQ_API_KEY environment variable is set
- Verify nova_ai.py and AleChatBot class are available
- Check terminal output for initialization errors

### Issue: No response from AI
**Solution**:
- Check if API server is running (look for "API server on port" message)
- Verify browser console for errors (F12)
- Check network tab in browser DevTools
- Increase timeout if AI needs more time

### Issue: UI doesn't load
**Solution**:
- Check if UI server is running (look for "UI server on port" message)
- Verify splash_screen.html exists in astra_ai/ui/
- Check browser console for errors
- Try accessing URL manually if auto-open fails

### Issue: Port already in use
**Solution**:
- The script automatically finds free ports
- If still failing, kill processes using those ports:
```powershell
# Find process using port
netstat -ano | findstr :5000
# Kill process
taskkill /PID <PID> /F
```

## Environment Variables

Create a `.env` file in the project root:
```
GROQ_API_KEY=your_groq_api_key_here
OPENWEATHER_API_KEY=your_weather_api_key_here
SEARCH_BASE_URL=https://api.search.example.com
```

## Files Modified

### Updated Files
- ✅ `run_desktop_nova.py`: Improved initialization and error handling
  - Better logging for AI initialization
  - Enhanced chat endpoint with fallback methods
  - Multiple AI method detection

- ✅ `nova_ai.py`: Existing AI core (no changes needed)

- ✅ `splash_screen.html`: Existing UI (no changes needed)

## Performance Tips

1. **Faster Responses**: Memory system is disabled by default for speed
2. **Better Memory**: Enable memory processing in `/api/chat` endpoint (line ~430)
3. **Multiple Sessions**: Each session maintains its own chat history
4. **Auto-Save**: Conversations are automatically stored

## Testing the Connection

Run the test script to verify the AI-UI connection:
```bash
python test_ai_ui_connection.py
```

This will:
- Start the server
- Test API connection
- Send sample messages
- Check memory system
- Display results

## Next Steps

1. ✅ Run the server: `python astra_ai/scripts/run_desktop_nova.py`
2. ✅ UI opens automatically in browser
3. ✅ Start chatting with Nova AI
4. ✅ Messages are stored in session memory
5. ✅ Check browser console (F12) for debug info

## Advanced Configuration

### Enable Memory Processing
Edit `run_desktop_nova.py`, line ~430, change:
```python
if False:  # Disable memory processing for faster response
```
to:
```python
if True:  # Enable memory processing
```

### Customize Model
Set `GROQ_API_KEY` environment variable with your API key.

### Adjust Timeouts
Modify timeout in `splash_screen.html` chat requests (search for `timeout`).

## Security Notes

⚠️ **Important for Production**:
- Never expose API port publicly without authentication
- Use environment variables for API keys (never hardcode)
- Implement rate limiting for chat endpoint
- Add CORS restrictions if needed
- Use HTTPS in production

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console (F12)
3. Check terminal output for error messages
4. Review log files in project root

---

**Last Updated**: December 10, 2024
**Status**: ✅ AI-UI Integration Complete
