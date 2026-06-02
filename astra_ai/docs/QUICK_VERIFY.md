# 🚀 Quick AI Verification Steps

Run these commands in order to verify the AI is working:

## 1️⃣ Check API Key
```powershell
# Windows PowerShell
$env:GROQ_API_KEY

# If empty, set it:
$env:GROQ_API_KEY = "your_actual_api_key"
```

## 2️⃣ Test AI Directly
```bash
python test_ai_directly.py
```

**✅ Expected:** AI responds with "Hello! I'm Nova AI..."

## 3️⃣ Run Diagnostics
```bash
python diagnose_ai_server.py
```

**✅ Expected:** All checks pass (✅)

## 4️⃣ Start Server
```bash
python start_nova_ai.py
```

**✅ Expected in terminal:**
- `✅ AleChatBot initialized successfully`
- `✅ All servers started successfully!`
- Browser opens automatically

## 5️⃣ Test in Browser

In the chat interface:
1. Type: "Hello!"
2. Press Send
3. Watch terminal for:
   - `🔄 Processing message with AleChatBot...`
   - `✅ Response generated successfully`
4. Check browser - message should appear

---

## ✅ If Everything Works

You should see in terminal when sending messages:
```
[DEBUG] Location status for session default:
  - Provided location: Italy
  - Saved locations: {}
  - Final location to use: Italy

🔄 Attempting to process message with Nova AI...
🔄 Method 1: Using EnhancedNovaAI.process_message()...
🔄 Method 2: Using AleChatBot.get_response()...
   └─ Calling async get_response with 1 messages...
   ✅ Response received: XXX chars
✅ Response generated successfully with get_response()
```

And in browser, you should see:
```
You: Hello!
AI: [Response from Nova AI]
```

---

## ❌ If Something Fails

1. **Direct test fails** → Check GROQ_API_KEY
2. **Diagnostics fail** → Check Python/packages
3. **Server won't start** → Check ports
4. **No response in browser** → Check browser F12 console

Run: `python diagnose_ai_server.py` for detailed diagnostics

---

## 📍 File Locations

- **Test script**: `test_ai_directly.py`
- **Diagnostics**: `diagnose_ai_server.py`
- **Server**: `astra_ai/scripts/run_desktop_nova.py` (IMPROVED)
- **Full guide**: `DEBUGGING_GUIDE.md`

---

**Let me know what you find! The improved server has much better logging now.** 🎯
