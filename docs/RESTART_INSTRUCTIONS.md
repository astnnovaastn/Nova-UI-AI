# 🔄 Nova AI System - Restart Instructions

## ✅ I've Fixed the Issues!

The problems were:
1. **Incorrect file paths** - The memory file path was wrong
2. **Missing virtual environment** - Python wasn't using the .venv
3. **Better error logging** - Now you can see what's happening

## 🚀 How to Restart the System

### Step 1: Stop the Current Process
Press `Ctrl+C` in the terminal where `npm start` is running, or close that terminal.

### Step 2: Start Fresh

**Option A: Using the Startup Script (Easiest)**
```bash
start_nova_ai.bat
```

**Option B: Using npm from UI folder**
```bash
cd astra_ai\ui
npm start
```

## 🔍 What I Fixed

### 1. Fixed Path Configuration (`server.py`)
**Before:**
```python
self.memory_file = self.project_root / "Date" / "nova_ai_memory.json"  # WRONG!
```

**After:**
```python
self.memory_file = self.project_root / "astra_ai" / "Date" / "nova_ai_memory.json"  # CORRECT!
```

The memory file is at: `Astra_ai/astra_ai/Date/nova_ai_memory.json`

### 2. Enhanced Error Logging
Now the server will show detailed logs when starting:
- ✅ Path verification
- ✅ File existence checks  
- ✅ Import status
- ✅ Initialization progress
- ❌ Detailed error traces if something fails

### 3. Fixed npm Scripts
Updated `package.json` to:
- ✅ Use virtual environment Python
- ✅ Activate .venv before running server
- ✅ Show colored output for easier debugging
- ✅ Kill servers properly when restarting

## 📊 What You'll See Now

When the backend starts, you should see:
```
🔍 Server paths configured:
  Server file: C:\...\Astra_ai\astra_ai\ui\src\backend\server.py
  Project root: C:\...\Astra_ai
  astra_ai module: C:\...\Astra_ai\astra_ai
  Nova AI script: C:\...\Astra_ai\astra_ai\core\nova_ai.py
  Memory file: C:\...\Astra_ai\astra_ai\Date\nova_ai_memory.json
  Nova AI exists: True
  Memory file exists: True

🚀 Initializing Nova AI system...
📥 Importing AleChatBot from core.nova_ai...
🤖 Creating AleChatBot instance...
✅ Nova AI chatbot initialized successfully
   Memory integration: True
✅ Nova AI system initialized and ready

🌐 Starting Nova AI Backend Server on 127.0.0.1:5001
```

## 🧪 Test After Restart

Once restarted, send a message in the chat. You should see:

**In Backend Terminal:**
```
📨 Received message from session session_xxx: Hello...
📤 Forwarding message to Nova AI: Hello...
✅ Got AI response from Nova AI: Hi! How can I help...
📝 Memory file updated: C:\...\nova_ai_memory.json
```

**In React UI:**
- AI response appears in chat
- No "Failed to fetch" error
- Message saved to memory

## 🛠️ If You Still Get Errors

### Error: "Failed to import Nova AI module"
**Check:**
```bash
# Verify virtual environment
.venv\Scripts\python --version

# Verify nova_ai.py exists
dir astra_ai\core\nova_ai.py
```

### Error: "Memory file not found"
**Check:**
```bash
# Verify Date folder exists
dir astra_ai\Date

# Create if missing
mkdir astra_ai\Date
```

### Error: "Port 5001 already in use"
**Solution:**
```bash
# Find what's using port 5001
netstat -ano | findstr :5001

# Kill the process (use PID from above)
taskkill /F /PID <PID>
```

## 📋 Quick Restart Checklist

- [ ] Stop current npm process (Ctrl+C)
- [ ] Close any open backend server windows
- [ ] Navigate to project root: `cd C:\Users\afian\OneDrive\Desktop\Astra_ai`
- [ ] Run: `start_nova_ai.bat` OR `cd astra_ai\ui && npm start`
- [ ] Wait for "Nova AI system initialized and ready"
- [ ] Browser opens to http://localhost:3002
- [ ] Send test message: "Hello"
- [ ] Verify AI responds without errors

## 🎯 Expected Behavior Now

1. **User types message** → React sends to backend
2. **Backend receives** → Logs show "Received message"
3. **Forwards to Nova AI** → Logs show "Forwarding message"
4. **Nova AI processes** → Uses memory system
5. **Writes to memory.json** → File is updated
6. **Returns response** → Logs show "Got AI response"
7. **React displays** → User sees AI reply

**No more "Failed to fetch" errors!** ✅

## 🚨 Important Notes

- The backend MUST use Python from `.venv\Scripts\python`
- Memory file is in `astra_ai/Date/` NOT root `Date/`
- Server must initialize Nova AI before accepting chat requests
- All paths are now correctly calculated from `server.py` location

## 📞 Still Having Issues?

Check the backend server logs for:
1. Path verification (all should show `exists: True`)
2. "Nova AI chatbot initialized successfully"
3. Any error messages with tracebacks

The new detailed logging will show exactly where any failure occurs!

---

**Ready to test? Restart now and try sending a message!** 🚀
