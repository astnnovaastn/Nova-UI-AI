# Nova AI Chat Interface Setup Instructions

## 🚀 Quick Start

### Option 1: One-Command Startup (Recommended)

Simply run the following command in the `ui` directory:

```bash
npm start
```

This will automatically:
1. Start the Nova AI backend server on port 5000
2. Start the React UI development server on port 3002
3. Both services will run concurrently

### Option 2: Manual Startup

If you prefer to run the services separately:

**Terminal 1 - Start the Backend:**
```bash
cd src/backend
python server.py
```

**Terminal 2 - Start the Frontend:**
```bash
npm run dev
```

## 📋 Prerequisites

Before running the application, ensure you have:

1. **Node.js** (v14 or higher)
   - Download from: https://nodejs.org/

2. **Python** (v3.8 or higher)
   - Make sure Python is installed at: `C:/Users/afian/AppData/Local/Programs/Python/Python314/python.exe`
   - Or update the path in `package.json` if your Python installation is elsewhere

3. **Required Python packages:**
   ```bash
   pip install flask flask-cors python-dotenv groq
   ```

4. **Required Node packages:**
   ```bash
   npm install
   ```

## 🔧 Configuration

### Port Configuration

The application uses the following ports:
- **Backend Server:** `5000` (configured in `src/backend/server.py`)
- **React Frontend:** `3002` (configured in `package.json`)

### Backend Server Configuration

The backend server (`src/backend/server.py`) automatically:
- Starts the Nova AI subprocess in server mode
- Creates message queues for communication
- Manages the AI response system through JSON files

### Frontend Configuration

Both chat interfaces are configured to connect to `http://127.0.0.1:5000`:
- `ChatInterface.jsx` (line 92)
- `ModernChat.jsx` (line 24)

## 🐛 Troubleshooting

### Issue: "Failed to fetch" or "Connection refused"

**Solution:**
1. Make sure the backend server is running on port 5000
2. Check the terminal/console for error messages
3. Verify that no other application is using port 5000

**To check if port 5000 is in use:**
```bash
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000
```

### Issue: Python path not found

**Solution:**
Update the `server` script in `package.json` with your Python installation path:
```json
"server": "cd src/backend && \"YOUR_PYTHON_PATH_HERE\" server.py"
```

### Issue: Missing Python packages

**Solution:**
Install required packages:
```bash
pip install flask flask-cors python-dotenv groq requests
```

### Issue: Nova AI not responding

**Solution:**
1. Check that the Nova AI subprocess is running (you'll see log messages in the backend terminal)
2. Verify that the message queue file exists: `../Date/message_queue.json`
3. Check the memory file: `../Date/nova_ai_memory.json`
4. Look for errors in the backend terminal

## 📁 File Structure

```
ui/
├── src/
│   ├── components/
│   │   └── Chat/
│   │       ├── ChatInterface.jsx    # Main chat interface
│   │       ├── ModernChat.jsx        # Modern chat component
│   │       ├── ChatMessage.jsx       # Message component
│   │       └── ModernChat.css        # Chat styles
│   ├── backend/
│   │   └── server.py                 # Flask backend server
│   └── App.jsx                       # Main React app
├── package.json                      # NPM configuration
└── SETUP_INSTRUCTIONS.md            # This file
```

## 🔄 Communication Flow

```
User → React UI → HTTP Request (port 3002 → port 5000)
                    ↓
              Flask Server (server.py)
                    ↓
              Message Queue (JSON file)
                    ↓
              Nova AI Subprocess (nova_ai.py --server)
                    ↓
              Memory File (nova_ai_memory.json)
                    ↓
              Flask Server reads response
                    ↓
              React UI displays response
```

## 🔐 Environment Variables

Create a `.env` file in the project root with:

```env
GROQ_API_KEY=your_groq_api_key_here
LLM_API_KEY=your_llm_api_key_here
AI_MODEL=llama-3.3-70b-versatile
```

## ✅ Testing the Connection

1. Start the application with `npm start`
2. Open your browser to `http://localhost:3002`
3. Open the chat interface
4. Send a test message like "Hello"
5. You should see a response from Nova AI

If you see the error "I'm having trouble connecting to my systems right now," check the backend logs for specific error messages.

## 📝 Logs

- **Backend logs:** Check the terminal where `npm start` is running
- **React logs:** Check the browser console (F12)
- **Nova AI logs:** Check the files in the `astra_ai/` directory:
  - `alebot.log`
  - `alebot_detailed.log`

## 🆘 Getting Help

If you encounter issues:
1. Check all logs (backend terminal, browser console, log files)
2. Verify all prerequisites are installed
3. Make sure ports 5000 and 3002 are available
4. Try restarting both services
5. Check that the Nova AI core files are in the correct location

## 📚 Additional Resources

- React Documentation: https://react.dev/
- Flask Documentation: https://flask.palletsprojects.com/
- Node.js Documentation: https://nodejs.org/docs/
