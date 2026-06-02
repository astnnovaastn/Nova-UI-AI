# 🔧 Nova AI Server - Debugging Guide

## Issue: Server Not Running AI 100%

If you're noticing the server isn't properly using the AI, here's how to diagnose and fix it.

---

## 🚨 Common Issues & Solutions

### Issue 1: GROQ_API_KEY Not Set
**Symptoms:**
- AI initializes but returns error responses
- Messages like "I couldn't generate a response"

**Fix:**
```bash
# Windows PowerShell
$env:GROQ_API_KEY = "your_actual_api_key_here"

# Windows Command Prompt
set GROQ_API_KEY=your_actual_api_key_here

# Linux/Mac
export GROQ_API_KEY=your_actual_api_key_here
```

Then restart the server.

### Issue 2: AI Methods Not Found
**Symptoms:**
- Terminal shows "❌ No suitable method found or all methods failed"
- Debug output shows available attributes

**Fix:**
1. Run diagnostic: `python diagnose_ai_server.py`
2. Check what methods AleChatBot actually has
3. Verify imports are working

### Issue 3: Async/Threading Issues
**Symptoms:**
- Server responds with generic error messages
- Terminal shows "Error calling AleChatBot"

**Fix:**
1. Check Python version: `python --version` (needs 3.8+)
2. Verify asyncio is working: `python test_ai_directly.py`
3. Check firewall/network

---

## 🧪 Diagnostic Tests

### Test 1: Direct AI Test
```bash
python test_ai_directly.py
```

This tests the AI without the server. If this works, the AI is fine.

### Test 2: Full Diagnostic
```bash
python diagnose_ai_server.py
```

This checks:
- Python environment
- Package imports
- API key setup
- AI initialization
- Response generation

### Test 3: Server with Debug Logging
```bash
python astra_ai/scripts/run_desktop_nova.py
```

Watch the terminal for:
- `✅ AleChatBot initialized successfully` - AI started
- `🔄 Processing message with AleChatBot...` - AI receiving request
- `✅ Response generated successfully` - AI responded
- Any `❌` or `⚠️` messages indicating problems

---

## 📊 Understanding Terminal Output

### Good Output ✅
```
🤖 Initializing Nova AI...
📚 Attempting to initialize AleChatBot...
✅ Basic AleChatBot initialized successfully
   AI Type: AleChatBot
   Instance created: True
   Status: Ready to process messages
   ✅ get_response method found

✅ All servers started successfully!
```

### Problem Output ❌
```
❌ Failed to initialize AleChatBot: 
   Error details here...

OR

❌ No suitable method found or all methods failed
[DEBUG] Available attributes:
   - ...
```

---

## 🔍 What We Fixed

We improved the server to:

1. **Better Initialization Logging**
   - Shows which AI is being loaded
   - Displays available methods
   - Shows exact error if initialization fails

2. **Better Message Processing**
   - Tries multiple methods (process_message → get_response → chat)
   - Shows which method is being used
   - Logs response generation
   - Shows char count of response received

3. **Better Error Handling**
   - Prints available attributes if method not found
   - Shows full traceback for debugging
   - Provides fallback response if AI fails

4. **Better Response Handling**
   - Ensures response is returned to browser
   - Stores conversation in memory
   - Handles async/sync properly

---

## 🚀 Step-by-Step Debugging

### Step 1: Test AI Directly
```bash
python test_ai_directly.py
```

**Expected Result:** AI generates a response about who it is

**If it fails:** 
- Check GROQ_API_KEY is set
- Verify network connectivity
- Check firewall

### Step 2: Run Diagnostics
```bash
python diagnose_ai_server.py
```

**Expected Result:** All checks pass

**If something fails:**
- Follow the suggestions in the output
- Install missing packages if needed
- Set GROQ_API_KEY if needed

### Step 3: Start Server with Terminal Open
```bash
python start_nova_ai.py
```

**Watch for:** ✅ AleChatBot initialized

**If not showing:** 
- Check terminal for errors
- Verify imports in Step 1

### Step 4: Send Test Message
In browser:
1. Type: "Hello!"
2. Press Send
3. Check terminal for:
   - `🔄 Processing message with AleChatBot...`
   - `✅ Response generated successfully`
   - Response content

**If no response:**
- Check browser console (F12)
- Look for network errors
- Check terminal for AI errors

---

## 📋 Checklist

Before the AI should work:

- [ ] GROQ_API_KEY is set
- [ ] Python version is 3.8+
- [ ] All packages installed (`pip install -r requirements.txt`)
- [ ] Network connectivity working
- [ ] `test_ai_directly.py` works
- [ ] `diagnose_ai_server.py` passes all checks
- [ ] Server shows "✅ AleChatBot initialized"
- [ ] Browser can connect to server
- [ ] Terminal shows "🔄 Processing message" when you send a message
- [ ] Terminal shows "✅ Response generated" after processing

---

## 🔗 Related Files

**Testing:**
- `test_ai_directly.py` - Direct AI test
- `diagnose_ai_server.py` - Full diagnostics
- `test_ai_ui_connection.py` - API connection test

**Server:**
- `astra_ai/scripts/run_desktop_nova.py` - Main server (IMPROVED)
- `astra_ai/core/nova_ai.py` - AI implementation
- `astra_ai/ui/splash_screen.html` - Web interface

**Starters:**
- `start_nova_ai.py` - Python launcher
- `start_nova_ai.bat` - Windows launcher

---

## 💡 Quick Fixes

### AI not responding at all
```bash
# Set API key
export GROQ_API_KEY='your_key_here'
# Restart server
python start_nova_ai.py
```

### Responses are empty
```bash
# Test AI directly
python test_ai_directly.py

# If it works but server doesn't, check network
# Browser console: F12
```

### Import errors
```bash
# Install requirements
pip install -r requirements.txt

# Try direct test
python test_ai_directly.py
```

### Server won't start
```bash
# Check for port conflicts
# Run diagnostics
python diagnose_ai_server.py

# Look for error messages
python astra_ai/scripts/run_desktop_nova.py 2>&1 | head -50
```

---

## 📞 Debug Info to Collect

If you still have issues, collect:

1. **Full terminal output** - Start server, send message, copy all output
2. **GROQ_API_KEY status** - Run `echo $GROQ_API_KEY` or `echo %GROQ_API_KEY%`
3. **Diagnostic output** - Run `python diagnose_ai_server.py`
4. **Direct test output** - Run `python test_ai_directly.py`
5. **Browser console** - Press F12, check for errors

---

## ✅ Once Fixed

Once the AI is working 100%:

1. ✅ Terminal shows AI initialized
2. ✅ Typing messages sends them to AI
3. ✅ AI generates responses
4. ✅ Responses display in browser
5. ✅ Session history maintained
6. ✅ Multiple messages work

---

**The server is now MORE ROBUST with better debugging to help identify any issues!**

Run the diagnostics and let me know what you find. 🚀
