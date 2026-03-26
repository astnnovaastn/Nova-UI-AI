# Nova AI Chat Interface - React Implementation

## Overview

The Nova AI Chat Interface is a fully-featured, modern chat system that connects to the Nova AI backend (`nova_ai.py`) and integrates with the Mem0 memory system. It provides a seamless conversational experience with automatic widget triggering, voice synthesis support, and persistent conversation history.

## Features

### Core Chat Functionality
- **Real-time Messaging**: Instant communication with Nova AI
- **Session Management**: Unique session IDs for conversation tracking
- **Typing Indicators**: Visual feedback when AI is processing
- **Auto-scrolling**: Messages automatically scroll to newest content
- **Character Limit**: 500 character input limit with live counter
- **Minimize/Restore**: Collapsible chat window for better UX

### AI Integration
- **Nova AI Backend**: Connects to `nova_ai.py` via REST API
- **Memory System**: Integrates with Mem0 for context-aware responses
- **Dynamic Port Configuration**: Automatically detects API port from URL parameters
- **Error Handling**: Graceful fallback for connection issues

### Widget Command Detection
The chat automatically triggers widgets based on user intent:

- **Time Widget**: "what time is it?", "current time", "show time"
- **Weather Widget**: "weather", "temperature", "forecast"
- **Search Widget**: "search for", "look up", "find", "google"
- **News Widget**: "news", "headlines", "latest happening"
- **Camera Widget**: "camera", "take picture", "vision", "see"
- **Notes Widget**: "note", "notepad", "write down", "remember"
- **Game Widget**: "play game", "tic tac toe"
- **Calculator Widget**: "calculate", "math", "solve"
- **Task Widget**: "task", "todo", "reminder", "schedule"

### Voice Integration
- Automatic voice synthesis for AI responses
- Integrates with existing voice system from `splash_screen.html`
- Skips synthesis for special markers and camera analysis

## API Configuration

### Environment Variables (.env)
```env
# Required for Nova AI
GROQ_API_KEY=your_groq_api_key_here
MEM0_API_KEY=your_mem0_api_key_here

# Optional API Keys
SERPAPI_KEY=your_serpapi_key_here
NEWS_API_KEY=your_news_api_key_here
OPENWEATHER_API_KEY=your_weather_api_key_here
```

### API Endpoint Structure

The chat connects to the Nova AI backend using:
- **Base URL**: `http://localhost:5001` (default)
- **Chat Endpoint**: `/chat`
- **Method**: POST
- **Content-Type**: application/json

#### Request Format
```json
{
  "message": "User's message here",
  "conversation_id": "session_1234567890_abc123",
  "user_location": null
}
```

#### Response Format
```json
{
  "response": "AI response text",
  "metadata": {
    "session_id": "session_1234567890_abc123",
    "timestamp": "2025-12-12T09:00:00Z"
  }
}
```

### Special Response Markers

The chat detects special markers in AI responses:

- `SEARCH_RESULT:` - Triggers search widget
- `WEATHER_DATA:` - Triggers weather widget
- `NEWS_SUMMARY:` - Triggers news widget
- `CAMERA_ANALYSIS_TRIGGER: true` - Triggers camera widget

## Usage

### Starting the System

1. **Start the Nova AI Backend**:
```bash
cd astra_ai/core
python nova_ai.py
```

2. **Start the React Frontend**:
```bash
cd astra_ai/ui
npm start
```

3. **Access the Interface**:
```
http://localhost:3000?api_port=5001
```

### URL Parameters

- `api_port`: Specify the Nova AI backend port (default: 5001)
  - Example: `http://localhost:3000?api_port=5002`

### Chat Commands

Users can interact naturally with Nova AI. Examples:

**General Conversation**:
- "Hello, how are you?"
- "Tell me about yourself"
- "What can you help me with?"

**Information Queries**:
- "What's the weather in New York?"
- "Search for latest AI news"
- "What time is it?"

**Task Management**:
- "Add a task to buy groceries"
- "Show my tasks"
- "Remind me to call John tomorrow"

**Memory Queries**:
- "What do you know about me?"
- "Remember that I like coffee"
- "What did we talk about yesterday?"

## Component Architecture

### ModernChat.jsx
Main chat component with:
- Message state management
- API communication logic
- Widget command detection
- Voice synthesis integration
- Minimize/restore functionality

### ModernChat.css
Styling with:
- Futuristic glassmorphism design
- Smooth animations
- Responsive layout
- Typing indicators
- Custom scrollbars

### App.jsx Integration
```javascript
<ModernChat 
  isOpen={chatOpen} 
  onClose={() => setChatOpen(false)} 
  onWidgetTrigger={toggleWidget}
/>
```

## Memory System Integration

The chat integrates with the Mem0 memory system through the Nova AI backend:

### Memory Features
- **Conversation History**: All messages are stored
- **User Preferences**: Learns from interactions
- **Context Awareness**: Uses past conversations for better responses
- **Fact Extraction**: Automatically extracts and stores facts

### Memory Files
- `nova_ai_memory.json`: Main memory storage
- `conversation_history.json`: Detailed conversation logs
- `user_profile.json`: User preferences and facts

## Troubleshooting

### Connection Issues

**Problem**: "I'm having trouble connecting to my systems"
**Solution**: 
1. Verify Nova AI backend is running: `python nova_ai.py`
2. Check the port matches URL parameter
3. Ensure no firewall blocking localhost connections

### Widget Not Triggering

**Problem**: Widgets don't open automatically
**Solution**:
1. Check `onWidgetTrigger` prop is passed to ModernChat
2. Verify widget names match in App.jsx state
3. Check console for widget command detection logs

### Voice Not Working

**Problem**: AI responses don't speak
**Solution**:
1. Ensure voice system is initialized in splash_screen.html
2. Check `window.synthesizeVoiceForMessage` is available
3. Verify audio permissions in browser

### Memory Not Persisting

**Problem**: AI doesn't remember past conversations
**Solution**:
1. Check Mem0 API key is set in .env
2. Verify memory files have write permissions
3. Check Nova AI logs for memory system errors

## Advanced Features

### Custom Widget Integration

To add a new widget trigger:

```javascript
// In ModernChat.jsx detectWidgetCommand function
if (lowerMessage.match(/your.*pattern/)) {
  onWidgetTrigger?.('your-widget-name');
}
```

### Custom API Endpoints

To use a different backend:

```javascript
// Modify getApiConfig in ModernChat.jsx
const getApiConfig = () => {
  return {
    baseUrl: 'https://your-api-domain.com',
    chatEndpoint: '/your-endpoint'
  };
};
```

### Session Persistence

To persist sessions across page reloads:

```javascript
// In ModernChat.jsx
const [sessionId] = useState(() => {
  const saved = localStorage.getItem('nova_session_id');
  if (saved) return saved;
  const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('nova_session_id', newId);
  return newId;
});
```

## Performance Optimization

### Message Batching
- Messages are batched to reduce re-renders
- Auto-scroll is debounced for smooth performance

### API Caching
- Nova AI backend implements response caching
- Common queries return faster

### Memory Management
- Old messages can be archived
- Conversation history is paginated

## Security Considerations

### API Security
- Use HTTPS in production
- Implement rate limiting
- Validate all inputs server-side

### Data Privacy
- User conversations are stored locally
- Memory data is encrypted at rest
- Session IDs are randomly generated

## Future Enhancements

- [ ] Multi-user support
- [ ] Message editing and deletion
- [ ] File attachments
- [ ] Voice input (speech-to-text)
- [ ] Conversation export
- [ ] Custom themes
- [ ] Emoji support
- [ ] Code syntax highlighting
- [ ] Markdown rendering
- [ ] Message reactions

## Support

For issues or questions:
1. Check the console for error messages
2. Review Nova AI backend logs
3. Verify all environment variables are set
4. Test API connectivity manually

## License

MIT License - See LICENSE file for details
