# 🔄 COMPLETE AI-SERVER DATA FLOW DIAGRAM

## FLOW OVERVIEW

```
┌──────────────────────────────────────────────────────────────────────┐
│                        USER SENDS MESSAGE                             │
│                    (UI Chat Interface)                                │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ↓
┌──────────────────────────────────────────────────────────────────────┐
│              1️⃣ UI SENDS TO SERVER: /api/chat                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ POST /api/chat                                                  │ │
│  │ {                                                               │ │
│  │   "message": "User's question or command",                      │ │
│  │   "session_id": "unique_user_session"                          │ │
│  │ }                                                               │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ↓
┌──────────────────────────────────────────────────────────────────────┐
│         2️⃣ SERVER RECEIVES AND PREPARES MESSAGE                      │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ • Extract user message from request                            │ │
│  │ • Get/create session chat history                              │ │
│  │ • Add message to session history                               │ │
│  │ • Log: "Message received from user"                            │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ↓
┌──────────────────────────────────────────────────────────────────────┐
│       3️⃣ SERVER CALLS nova_ai.py (AI ENGINE)                         │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ nova_ai.get_response(messages_list)                            │ │
│  │                                                                 │ │
│  │ Fallback methods (if main fails):                              │ │
│  │  • Method 1: process_message() - EnhancedNovaAI               │ │
│  │  • Method 2: get_response() - AleChatBot (MOST COMMON)        │ │
│  │  • Method 3: chat() - Fallback method                         │ │
│  │                                                                 │ │
│  │ Inside nova_ai.py:                                             │ │
│  │  • Parse message context                                       │ │
│  │  • Prepare prompt for GROQ API                                │ │
│  │  • Call GROQ LLM (llama-3.3-70b-versatile model)            │ │
│  │  • Get response from GROQ                                     │ │
│  │  • Return formatted response                                   │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ↓
┌──────────────────────────────────────────────────────────────────────┐
│     4️⃣ SERVER RECEIVES RESPONSE FROM AI ENGINE                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ response = await nova_ai.get_response(messages)               │ │
│  │                                                                 │ │
│  │ • Response is AI-generated text                                │ │
│  │ • Can be 1-3000+ characters                                    │ │
│  │ • Log: "Response received: XXX characters"                    │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ↓
┌──────────────────────────────────────────────────────────────────────┐
│  5️⃣ SERVER SAVES CONVERSATION TO nova_ai_memory.json                │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ save_to_memory_file(user_msg, ai_response, session_id)         │ │
│  │                                                                 │ │
│  │ Saved structure:                                                │ │
│  │ {                                                               │ │
│  │   "conversations": [                                           │ │
│  │     {                                                           │ │
│  │       "timestamp": "2025-12-10T14:30:45.123456",             │ │
│  │       "session_id": "user_session_123",                       │ │
│  │       "user": "User's original question",                     │ │
│  │       "assistant": "AI's generated response",                 │ │
│  │       "metadata": {                                            │ │
│  │         "conversation_turn": 1                                 │ │
│  │       }                                                         │ │
│  │     }                                                           │ │
│  │   ],                                                            │ │
│  │   "total_conversations": 1,                                    │ │
│  │   "last_updated": "2025-12-10T14:30:45.123456"               │ │
│  │ }                                                               │ │
│  │                                                                 │ │
│  │ • Append to existing conversations                             │ │
│  │ • Keep last 100 conversations                                  │ │
│  │ • Update timestamps and counts                                 │ │
│  │ • Log: "Conversation saved to memory file"                    │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ↓
┌──────────────────────────────────────────────────────────────────────┐
│   6️⃣ SERVER RETURNS RESPONSE TO UI: /api/chat                        │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ HTTP 200 OK                                                    │ │
│  │ {                                                               │ │
│  │   "status": "success",                                         │ │
│  │   "response": "AI's complete response text",                   │ │
│  │   "message": "Success",                                        │ │
│  │   "session_id": "user_session_123"                            │ │
│  │ }                                                               │ │
│  └─────────────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ↓
┌──────────────────────────────────────────────────────────────────────┐
│          7️⃣ UI DISPLAYS RESPONSE IN CHAT                             │
│                    (Chat Interface)                                   │
│                   • User sees reply                                   │
│                   • Response appears in chat                          │
│                   • History is maintained                             │
└──────────────────────────────────────────────────────────────────────┘
```

## DATA FLOW SUMMARY

| Step | Component | Action | File/Location |
|------|-----------|--------|----------------|
| 1 | UI (Browser) | Sends user message | `splash_screen.html` → `/api/chat` |
| 2 | Server | Receives & prepares message | `run_desktop_nova.py` line 430-440 |
| 3 | Server → AI | Calls get_response() method | Calls `nova_ai.AleChatBot.get_response()` |
| 4 | AI Engine | Processes message, calls GROQ LLM | `nova_ai.py` → GROQ API |
| 5 | Server | Receives response from AI | Awaits async response |
| 6 | Server | Saves to JSON file | `save_to_memory_file()` → `nova_ai_memory.json` |
| 7 | Server | Returns JSON response | `/api/chat` endpoint |
| 8 | UI | Displays in chat | `splash_screen.html` receives JSON |

## FILES INVOLVED

```
┌─────────────────────────────────────────────────────────┐
│                   UI LAYER                              │
│          astra_ai/ui/splash_screen.html                │
│   • Captures user input                                 │
│   • Sends POST /api/chat                                │
│   • Displays responses                                  │
│   • Maintains chat display                              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                 SERVER LAYER                            │
│     astra_ai/scripts/run_desktop_nova.py               │
│   • Flask app with /api/chat endpoint                   │
│   • Manages sessions (chat_histories dict)              │
│   • Calls nova_ai.get_response()                        │
│   • Saves to nova_ai_memory.json                        │
│   • Returns JSON response to UI                         │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│                 AI ENGINE LAYER                         │
│       astra_ai/core/nova_ai.py                         │
│   • AleChatBot class                                    │
│   • get_response() async method                         │
│   • Calls GROQ API for LLM responses                    │
│   • Returns generated text                              │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│              MEMORY/STORAGE LAYER                       │
│    astra_ai/Date/nova_ai_memory.json                   │
│   • Stores all conversations                            │
│   • JSON format with timestamps                         │
│   • User/assistant exchanges                            │
│   • Session metadata                                    │
└─────────────────────────────────────────────────────────┘
```

## COMPLETE PROCESS FLOW (Python Code)

```python
# 1. USER SENDS MESSAGE (UI)
# Browser JavaScript:
fetch('/api/chat', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
        message: "User's question",
        session_id: "session_123"
    })
})

# 2. SERVER RECEIVES (run_desktop_nova.py:430-440)
@app.route('/api/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message')
    session_id = request.json.get('session_id', 'default')
    
    # Create session history if needed
    if session_id not in chat_histories:
        chat_histories[session_id] = []

# 3. SERVER CALLS AI (run_desktop_nova.py:540-580)
response = loop.run_until_complete(
    nova_ai.get_response(messages, stream_to_terminal=False)
)

# 4. AI PROCESSES (nova_ai.py)
# Inside AleChatBot.get_response():
async def get_response(self, messages, stream_to_terminal=False):
    # Prepare context
    # Call GROQ API
    # Get response from LLM
    # Return formatted response

# 5. SERVER SAVES (run_desktop_nova.py:623)
save_to_memory_file(user_message, response, session_id)

# Inside save_to_memory_file():
def save_to_memory_file(user_msg, ai_response, session_id):
    existing_data = load_from_file()
    conversation = {
        "timestamp": datetime.now().isoformat(),
        "session_id": session_id,
        "user": user_msg,
        "assistant": ai_response,
        "metadata": {}
    }
    existing_data['conversations'].append(conversation)
    save_to_file(existing_data)

# 6. SERVER RETURNS (run_desktop_nova.py:650)
return jsonify({
    'status': 'success',
    'response': response,
    'message': 'Success',
    'session_id': session_id
})

# 7. UI DISPLAYS
// Browser receives JSON and displays in chat
```

## VERIFICATION STEPS

Run this command to verify the complete flow is working:

```bash
python verify_complete_flow.py
```

This will check:
- ✅ Memory file structure
- ✅ Nova AI initialization
- ✅ AI response generation
- ✅ Memory file saving
- ✅ Data persistence

## TROUBLESHOOTING

If flow is broken:

1. **No response from AI**
   - Check GROQ_API_KEY: `echo $GROQ_API_KEY`
   - Verify nova_ai.py imports correctly
   - Check server terminal for errors

2. **Memory file not being created**
   - Check directory permissions: `astra_ai/Date/`
   - Verify server has write access
   - Check server logs for save errors

3. **Response doesn't appear in UI**
   - Check browser console (F12) for JavaScript errors
   - Verify /api/chat endpoint is returning JSON
   - Check network tab in browser DevTools

4. **Old conversations not showing**
   - Memory file might be too large (kept at 100 conversations)
   - Check timestamp format in JSON
   - Verify memory file isn't corrupted

## EXPECTED OUTPUT IN nova_ai_memory.json

```json
{
  "conversations": [
    {
      "timestamp": "2025-12-10T14:30:45.123456",
      "session_id": "default",
      "user": "What is the weather?",
      "assistant": "I don't have real-time weather data, but I can help you find weather information...",
      "metadata": {
        "conversation_turn": 1
      }
    },
    {
      "timestamp": "2025-12-10T14:31:02.654321",
      "session_id": "default",
      "user": "Tell me a joke",
      "assistant": "Why did the AI go to school? To improve its learning model! 😄",
      "metadata": {
        "conversation_turn": 2
      }
    }
  ],
  "total_conversations": 2,
  "last_updated": "2025-12-10T14:31:02.654321"
}
```

## NEXT STEPS

1. Start server: `python start_nova_ai.py`
2. Open browser and send test message
3. Check nova_ai_memory.json to see saved conversation
4. Use `/api/memory/status` endpoint to retrieve conversations
5. Verify response appears in UI chat
