# 🧠 GINI 1.5 + Nova AI Camera Integration

## Overview

This integration connects GINI 1.5's advanced computer vision capabilities with Nova AI's camera widget, giving Nova AI "eyes" to see and analyze the real world through your camera.

## 🌟 Features

### Real-time Vision Analysis
- **Live Camera Feed**: Continuous video stream with AI analysis
- **Automatic Analysis**: GINI 1.5 analyzes camera frames every 3 seconds
- **Manual Triggers**: Ask Nova AI what it sees anytime
- **AI-to-AI Communication**: Vision analysis results sent directly to Nova AI chat

### Seamless User Experience
- **Auto-start Camera**: Camera opens and starts automatically
- **Auto-enable AI**: AI analysis starts automatically with camera
- **Chat Integration**: Natural conversation about what Nova AI sees
- **Visual Indicators**: Real-time status of AI analysis

### Smart Chat Commands
- `"open camera"` - Opens camera with AI vision
- `"what do you see?"` - Immediate scene analysis
- `"describe what's in front of the camera"` - Detailed description
- `"what am I doing?"` - Activity analysis
- `"look at this"` - General scene analysis

## 🚀 Quick Start

### 1. Start GINI Bridge Service

**Windows:**
```bash
# Double-click this file:
astra_ai/scripts/start_gini_bridge.bat
```

**Command Line:**
```bash
cd astra_ai
python scripts/start_gini_bridge.py
```

### 2. Open Nova AI
- Open `astra_ai/ui/splash_screen.html` in your browser
- The GINI bridge should connect automatically

### 3. Start Using AI Vision
- Say "open camera" in the chat
- Camera opens with AI analysis enabled
- Ask "what do you see?" for immediate analysis

## 🔧 Technical Architecture

### Components
1. **GINI Camera Bridge** (`gini_camera_bridge.py`)
   - WebSocket server on `ws://localhost:8765`
   - Integrates GINI 1.5 vision analysis
   - Handles camera frame processing

2. **Enhanced Camera Widget** (in `splash_screen.html`)
   - WebSocket client connection to GINI bridge
   - Real-time frame transmission
   - AI analysis controls and indicators

3. **Nova AI Chat Integration**
   - Receives AI analysis results
   - Processes vision-related commands
   - Provides natural conversation interface

### Data Flow
```
Camera Feed → Camera Widget → GINI Bridge → AI Analysis → Nova AI Chat
```

## 🎮 User Interface

### Camera Widget Controls
- **▶️ Start/Pause**: Camera control
- **📷 Capture**: Take photos
- **⏺️ Record**: Video recording
- **🧠 AI Analysis**: Toggle continuous analysis
- **👁️ Ask AI**: Manual analysis trigger
- **🎨 Filters**: Video filters
- **ℹ️ Info**: Camera information

### Status Indicators
- **Camera Status**: 🟢 Ready, 🔵 Active, 🔴 Error
- **AI Status**: 🟢 Ready, 🟣 Analyzing, ⚫ Offline

### Visual Feedback
- **Analysis Flash**: Brief indicator when AI completes analysis
- **Status Updates**: Real-time status in camera widget
- **Chat Messages**: AI analysis results in Nova AI chat

## 💬 Chat Integration Examples

### Basic Vision Commands
```
User: "open camera"
Nova AI: "📹 Camera widget opened! The live feed will start automatically with AI vision analysis."

User: "what do you see?"
Nova AI: "🤖 Analyzing what I can see through the camera... One moment please."
Nova AI: "🤖 Nova AI Vision Analysis (online)
I can see a person sitting at a desk in what appears to be a home office environment..."
```

### Advanced Interactions
```
User: "describe what's in front of the camera"
Nova AI: "🤖 Nova AI Vision Analysis (online)
The camera shows a workspace with a computer monitor, keyboard, and some books on the desk..."

User: "what am I doing?"
Nova AI: "🤖 Nova AI Vision Analysis (online)
You appear to be working at your computer, with your hands positioned over the keyboard..."
```

## 🛠️ Configuration

### GINI Bridge Settings
- **Analysis Interval**: 3 seconds (configurable)
- **WebSocket Port**: 8765 (configurable)
- **Frame Quality**: JPEG 80% (configurable)
- **AI Model**: Gemini 1.5 Flash (with fallbacks)

### Camera Widget Settings
- **Resolution**: 480x320 (compact mode)
- **Frame Rate**: 30 FPS
- **Auto-start**: Enabled
- **Auto-AI**: Enabled after 2 seconds

## 🔍 Troubleshooting

### Common Issues

**"AI Offline" Status**
- Ensure GINI bridge service is running
- Check WebSocket connection on port 8765
- Restart the bridge service

**Camera Permission Denied**
- Allow camera access in browser
- Check camera is not used by other applications
- Try refreshing the page

**No AI Analysis**
- Verify GINI bridge is connected
- Check console for WebSocket errors
- Ensure Gemini API key is valid

### Debug Information
- Open browser developer tools (F12)
- Check console for connection status
- Monitor WebSocket messages
- Verify camera widget initialization

## 📋 Requirements

### Python Dependencies
```bash
pip install websockets
pip install opencv-python
pip install pillow
pip install google-generativeai
```

### Browser Requirements
- Modern browser with WebRTC support
- Camera permissions enabled
- WebSocket support

### System Requirements
- Camera device (webcam/built-in camera)
- Python 3.7+
- Internet connection (for online AI analysis)

## 🔮 Future Enhancements

- **Object Tracking**: Track specific objects across frames
- **Face Recognition**: Identify known faces
- **Activity Recognition**: Understand complex activities
- **Voice Integration**: Combine with speech recognition
- **Multi-camera Support**: Support multiple camera sources
- **Recording with AI**: Save videos with AI annotations

## 🤝 Contributing

To extend the integration:
1. Modify `gini_camera_bridge.py` for new AI features
2. Update camera widget for new UI elements
3. Add chat commands in `splash_screen.html`
4. Test with various camera scenarios

## 📄 License

This integration is part of the Nova AI project and follows the same licensing terms.
