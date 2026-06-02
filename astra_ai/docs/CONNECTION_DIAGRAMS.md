# 🔗 Nova AI - UI Connection Diagram

## System Flow

### 1. Server Startup Flow
```
┌─────────────────────────────────────────────────────────────┐
│                   run_desktop_nova.py                       │
│                      (Main Script)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼────┐   ┌─────▼────┐   ┌─────▼────┐
    │ Initialize│   │ Start UI │   │ Start API│
    │  Nova AI │   │ Server   │   │ Server   │
    └──────────┘   └──────────┘   └──────────┘
         │               │               │
         ├───────────────┴───────────────┤
         │                               │
         ├──────────────┬────────────────┤
         │              │                │
    ✅ Success      Ready to     Ready to
    (AI Init)      Serve HTML    Accept API
                                 Calls

```

### 2. Message Flow (User to AI)
```
┌─────────────────────────────────────────────────────────────┐
│                   User Interaction                          │
│                                                             │
│  1. User Types: "Hello Nova AI"                             │
│  2. User Clicks: Send Button                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │   JavaScript Handler   │
        │  (UI: splash_screen)   │
        └────────────┬───────────┘
                     │
                     ▼ JSON POST
        ┌────────────────────────────────────┐
        │  POST /api/chat                    │
        │  {                                 │
        │    "message": "Hello Nova AI",     │
        │    "session_id": "session_123",    │
        │    "user_location": "Italy"        │
        │  }                                 │
        └────────────┬───────────────────────┘
                     │
                     ▼ HTTP Request
        ┌────────────────────────────────────┐
        │     Flask API Server               │
        │     (Port: 5000)                   │
        │                                    │
        │  app.route('/api/chat')            │
        │  def chat():                       │
        │    - Parse request                 │
        │    - Get user message              │
        │    - Check Nova AI ready           │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │   AI Processing                    │
        │   (Nova AI / AleChatBot)           │
        │                                    │
        │   ┌──────────────────────────┐     │
        │   │ Check AI Methods:        │     │
        │   │ 1. process_message()     │     │
        │   │ 2. get_response()        │     │
        │   │ 3. chat()                │     │
        │   └──────┬───────────────────┘     │
        │          │                         │
        │          ▼                         │
        │   ┌──────────────────────────┐     │
        │   │ Generate Response        │     │
        │   │ (Async Processing)       │     │
        │   └──────┬───────────────────┘     │
        │          │                         │
        │          ▼                         │
        │   ┌──────────────────────────┐     │
        │   │ Store in Memory          │     │
        │   │ (Session History)        │     │
        │   └──────┬───────────────────┘     │
        └────────────┬───────────────────────┘
                     │
                     ▼ JSON Response
        ┌────────────────────────────────────┐
        │  Response to Frontend:             │
        │  {                                 │
        │    "response": "Hi there!",        │
        │    "session_id": "session_123",    │
        │    "timestamp": "2024-12-10..."    │
        │  }                                 │
        └────────────┬───────────────────────┘
                     │
                     ▼ HTTP Response
        ┌────────────────────────────────────┐
        │  JavaScript Handler Receives      │
        │  Response                          │
        │                                    │
        │  ┌──────────────────────────┐      │
        │  │ - Parse JSON             │      │
        │  │ - Extract message        │      │
        │  │ - Create message element │      │
        │  │ - Add to chat window     │      │
        │  │ - Scroll to bottom       │      │
        │  │ - Enable input           │      │
        │  └──────────────────────────┘      │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │   UI Updates (DOM)                 │
        │                                    │
        │   Chat Display:                    │
        │   ┌──────────────────────────┐     │
        │   │ User: Hello Nova AI      │     │
        │   │                          │     │
        │   │ AI: Hi there!            │     │
        │   └──────────────────────────┘     │
        │                                    │
        │   Input Field: Ready for Input     │
        │   Send Button: Enabled             │
        └────────────────────────────────────┘

```

### 3. Server Architecture
```
┌──────────────────────────────────────────────────────────────┐
│                   run_desktop_nova.py                        │
│                   (Main Application)                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Global Variables                          │  │
│  │  - nova_ai (AI Instance)                               │  │
│  │  - chat_histories (Session Storage)                    │  │
│  │  - user_locations (Location Storage)                   │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────┬───────────────────────────┐  │
│  │                           │                           │  │
│  │    Flask API Server       │   UI HTTP Server         │  │
│  │    (Async Processing)     │   (File Serving)         │  │
│  │                           │                           │  │
│  │  Routes:                  │  Serves:                 │  │
│  │  - POST /api/chat         │  - splash_screen.html    │  │
│  │  - GET /api/status        │  - CSS files             │  │
│  │  - GET /api/memory/status │  - JavaScript files      │  │
│  │  - POST /api/weather      │  - Static assets         │  │
│  │  - GET /api/tasks         │                          │  │
│  │  - POST /api/vision/...   │  Port: Random (8000+)    │  │
│  │  - And more...            │                          │  │
│  │                           │                          │  │
│  │  Port: Random (5000+)     │                          │  │
│  └───────────┬───────────────┴──────────────────────────┘  │
│              │                                              │
│              └──────────────────────────────────────────┐   │
│                                                        │   │
│                                   ┌────────────────────▼─┐  │
│                                   │   Nova AI Core       │  │
│                                   │                      │  │
│                                   │ ┌──────────────────┐ │  │
│                                   │ │  AleChatBot      │ │  │
│                                   │ │  (Or Enhanced)   │ │  │
│                                   │ │                  │ │  │
│                                   │ │ Methods:         │ │  │
│                                   │ │ - get_response()  │ │  │
│                                   │ │ - chat()          │ │  │
│                                   │ │ - process_...    │ │  │
│                                   │ └──────────────────┘ │  │
│                                   │                      │  │
│                                   │ ┌──────────────────┐ │  │
│                                   │ │  Memory System   │ │  │
│                                   │ │                  │ │  │
│                                   │ │ - Store Memory   │ │  │
│                                   │ │ - Retrieve       │ │  │
│                                   │ │ - Session State  │ │  │
│                                   │ └──────────────────┘ │  │
│                                   │                      │  │
│                                   │ ┌──────────────────┐ │  │
│                                   │ │  Response Gen    │ │  │
│                                   │ │                  │ │  │
│                                   │ │ - GPT Processing │ │  │
│                                   │ │ - Streaming      │ │  │
│                                   │ │ - Formatting     │ │  │
│                                   │ └──────────────────┘ │  │
│                                   └──────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 4. Request/Response Cycle
```
Browser                Flask Server           Nova AI
  │                         │                    │
  │ POST /api/chat         │                    │
  │─────────────────────────>                   │
  │  (Message Payload)      │                    │
  │                         │ Detect AI Type     │
  │                         ├──────────────────> (Check Methods)
  │                         │                    │
  │                         │ < Generate Response
  │                         │<──────────────────┤
  │                         │  (AI Response)     │
  │  Response with          │                    │
  │ <─────────────────────────                   │
  │   Message               │                    │
  │                         │                    │
  │ Update DOM              │                    │
  ├─────────────┐           │                    │
  │ Add Message │           │                    │
  │ Scroll Chat │           │                    │
  │ Enable Input│           │                    │
  └─────────────┘           │                    │
```

## Data Structure

### Chat Message Format
```json
{
  "message": "Hello Nova AI!",
  "session_id": "session_123_abc",
  "user_location": "Italy"
}
```

### AI Response Format
```json
{
  "response": "Hello! I'm Nova AI. How can I help you?",
  "session_id": "session_123_abc",
  "timestamp": "2024-12-10T10:30:00Z"
}
```

### Session History
```
chat_histories = {
  "session_123_abc": [
    {"role": "user", "content": "Hello Nova AI!"},
    {"role": "assistant", "content": "Hello! I'm Nova AI. How can I help you?"},
    {"role": "user", "content": "Tell me about yourself"},
    {"role": "assistant", "content": "I'm Nova AI, an advanced..."}
  ]
}
```

## Component Interaction Matrix

```
┌──────────────────┬─────────────────┬──────────────────┬─────────────┐
│   Component      │  Initializes    │  Calls           │  Receives   │
├──────────────────┼─────────────────┼──────────────────┼─────────────┤
│ UI (Browser)     │ On page load    │ /api/chat        │ Responses   │
│                  │                 │ /api/status      │             │
├──────────────────┼─────────────────┼──────────────────┼─────────────┤
│ Flask Server     │ On startup      │ Nova AI methods  │ Responses   │
│                  │ (with nova_ai)  │ Memory system    │             │
├──────────────────┼─────────────────┼──────────────────┼─────────────┤
│ Nova AI Core     │ initialize_...  │ Language model   │ Text output │
│                  │ AleChatBot()    │ Memory storage   │             │
├──────────────────┼─────────────────┼──────────────────┼─────────────┤
│ Memory System    │ Automatic       │ Store/Retrieve   │ Chat data   │
│                  │ (if available)  │ Session mgmt     │             │
└──────────────────┴─────────────────┴──────────────────┴─────────────┘
```

## Error Handling Flow

```
Request to /api/chat
        │
        ▼
    ┌─────────────────┐
    │ nova_ai is None?│
    └────┬────────────┘
         │ Yes
         ▼
    Return 500 Error
    "Nova AI not initialized"
         │
         No
         ▼
    ┌─────────────────────┐
    │ Has process_message?│
    └────┬────────────────┘
         │ Yes (EnhancedNovaAI)
         ▼
    ┌─────────────────┐
    │ Call async      │
    │ process_message │
    └────┬────────────┘
         │ No
         ▼
    ┌─────────────────────┐
    │ Has get_response?   │
    └────┬────────────────┘
         │ Yes (AleChatBot)
         ▼
    ┌─────────────────┐
    │ Call async      │
    │ get_response    │
    └────┬────────────┘
         │ No
         ▼
    ┌─────────────────────┐
    │ Has chat?           │
    └────┬────────────────┘
         │ Yes (Fallback)
         ▼
    ┌─────────────────┐
    │ Call chat       │
    │ (sync/async)    │
    └────┬────────────┘
         │ No
         ▼
    Return Error
    "No suitable method found"
         │
         Any error occurs
         ▼
    ┌────────────────────┐
    │ Return Error:      │
    │ "Couldn't generate │
    │  response"         │
    └────────────────────┘
```

## State Diagram

```
            ┌─────────────┐
            │   START     │
            └──────┬──────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Initialize Nova AI   │
        └──────┬───────────────┘
               │
        ┌──────▼──────┐
        │  AI Ready?  │
        └──┬───────┬──┘
      Yes  │       │  No
           │       └─────> FAILED STATE (User Notified)
           │
           ▼
    ┌─────────────────┐
    │ START SERVERS   │
    │ - UI Server     │
    │ - API Server    │
    └────────┬────────┘
             │
             ▼
    ┌──────────────────────┐
    │  SERVERS RUNNING     │
    │  (Ready for Requests)│
    └────────┬─────────────┘
             │
      ┌──────▼────────┐
      │ REQUEST LOOP  │
      │               │
      │ 1. Receive    │
      │ 2. Process    │────> ┌────────────┐
      │ 3. Generate   │      │ Send Resp. │
      │ 4. Return     │────> │            │
      │               │      │ Back to UI │
      │               │      └────────────┘
      └───────────────┘
```

---

This diagram shows how Nova AI and the UI are fully integrated and communicate in real-time!
