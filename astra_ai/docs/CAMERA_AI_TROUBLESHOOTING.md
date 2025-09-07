# 🔧 Camera AI Analysis Troubleshooting Guide

## ❌ "AI analysis failed. Please make sure the camera is active and try again"

This error occurs when the AI vision analysis system encounters issues. Here's how to fix it:

### 🚀 Quick Fix Steps

1. **Check Camera Status**
   - Make sure the camera widget is open and showing live video
   - The camera status should show "Camera active"
   - You should see yourself in the camera feed

2. **Verify Internet Connection**
   - AI analysis requires internet access
   - Check your network connection
   - Try refreshing the page if connection is poor

3. **Start GINI Bridge Service** (Recommended)
   - Navigate to: `astra_ai/scripts/`
   - Double-click: `start_gini_bridge.bat`
   - Keep the terminal window open
   - This provides enhanced AI analysis capabilities

### 🔍 Diagnostic Commands

Type these in the Nova AI chat to get detailed information:

- **"camera diagnostics"** - Run full system diagnostics
- **"what do you see?"** - Test AI analysis
- **"camera status"** - Check camera state

### 🛠️ Advanced Troubleshooting

#### API Issues
- **Quota Exceeded**: Wait a few minutes and try again
- **Access Denied**: Check API key configuration
- **Timeout**: Check internet connection speed

#### Camera Issues
- **Camera not starting**: Check browser permissions
- **No video feed**: Try refreshing the page
- **Permission denied**: Allow camera access in browser

#### Network Issues
- **Slow connection**: Wait for analysis to complete
- **Firewall blocking**: Check firewall settings
- **CORS errors**: Use the GINI Bridge service

### 📋 System Requirements

- **Browser**: Chrome, Firefox, Edge (latest versions)
- **Camera**: Working webcam with permissions
- **Internet**: Stable connection for AI analysis
- **API**: Valid Gemini AI API key

### 🚀 GINI Bridge Service

For the best experience, run the GINI Bridge service:

```bash
# Windows
cd astra_ai/scripts
start_gini_bridge.bat

# Or manually
python start_gini_bridge.py
```

This provides:
- Enhanced AI analysis
- Better error handling
- Offline fallback modes
- Real-time processing

### 💡 Tips for Success

1. **Good Lighting**: Ensure adequate lighting for better analysis
2. **Stable Camera**: Keep camera steady during analysis
3. **Clear View**: Make sure objects are clearly visible
4. **Patience**: Allow a few seconds for AI processing
5. **Retry**: If analysis fails, wait a moment and try again

### 🆘 Still Having Issues?

1. **Check Browser Console**: Press F12 and look for error messages
2. **Restart Application**: Refresh the page and try again
3. **Update Browser**: Ensure you're using the latest browser version
4. **Check Permissions**: Verify camera and microphone permissions

### 📞 Common Error Messages

- **"Camera not active"**: Start the camera first
- **"AI Quota Exceeded"**: Wait and try again later
- **"AI Timeout"**: Check internet connection
- **"Camera Starting"**: Wait for camera to initialize

---

**Remember**: The camera AI system is designed to be robust and user-friendly. Most issues are temporary and can be resolved by following these steps.
