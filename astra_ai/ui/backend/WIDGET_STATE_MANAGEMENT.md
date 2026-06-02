# Backend Integration - Widget State Management

## Overview

While the frontend handles orb positioning through widget state events, the backend can optionally track and respond to widget states for enhanced AI decision-making and logging.

---

## 1. Optional Backend Enhancement

### Add Widget State Tracking (server.py)

In your backend server, add this optional feature to log and track widget states:

```python
# In server.py, add to ServerState class (~line 458)

class ServerState:
    """Server state: track client session, model responses, etc."""
    
    def __init__(self):
        # ... existing code ...
        self.widget_states: Dict[str, bool] = {
            'calculator': False,
            'notes': False,
            'weather': False,
            'tictactoe': False,
            'image': False,
        }
        self.widget_state_changed_at: Optional[datetime] = None
    
    def update_widget_state(self, widget: str, is_open: bool):
        """Track widget state changes for logging and analytics."""
        if widget in self.widget_states:
            old_state = self.widget_states[widget]
            self.widget_states[widget] = is_open
            self.widget_state_changed_at = datetime.now()
            
            logger.info(
                f"Widget state update: {widget} → {is_open} "
                f"(was {old_state})"
            )
            return True
        return False
    
    def get_active_widgets(self) -> List[str]:
        """Get list of currently open widgets."""
        return [w for w, is_open in self.widget_states.items() if is_open]
    
    def has_widgets_open(self) -> bool:
        """Check if any widgets are currently open."""
        return any(self.widget_states.values())
```

### Add WebSocket Message Handler (server.py)

Add this handler to process widget state updates from the frontend:

```python
# In handle_transcript_message() or in the WebSocket endpoint

async def handle_widget_state_update(websocket: WebSocket, message: Dict[str, Any]):
    """
    Handle widget state updates from frontend.
    
    Expected message format:
    {
      "type": "widget_state",
      "widget": "image",
      "is_open": true,
      "active_widgets": ["image"]
    }
    """
    widget = message.get("widget")
    is_open = message.get("is_open", False)
    active_widgets = message.get("active_widgets", [])
    
    if widget:
        state.update_widget_state(widget, is_open)
        logger.info(f"📊 Active widgets: {active_widgets}")
        
        # Optional: Log to analytics or adjust AI behavior
        if is_open:
            logger.info(f"🟢 User opened: {widget}")
        else:
            logger.info(f"🔴 User closed: {widget}")
```

### Update WebSocket Endpoint

Modify the WebSocket endpoint to handle widget state messages:

```python
@app.websocket(ServerConfig.WS_ENDPOINT)
async def websocket_endpoint(websocket: WebSocket):
    # ... existing connection code ...
    
    try:
        while True:
            msg = await websocket.receive_text()
            message = json.loads(msg)
            msg_type = message.get("type")
            
            # ... existing handlers ...
            
            elif msg_type == "widget_state":
                await handle_widget_state_update(websocket, message)
            
            # ... rest of handlers ...
    
    except WebSocketDisconnect:
        # ... existing cleanup ...
```

---

## 2. Frontend Integration with Backend

### Send Widget State to Backend (main.ts)

Optionally send widget state changes to the backend for logging:

```typescript
// In main.ts, after the existing orbWidgetStateChange listener

window.addEventListener('orbWidgetStateChange', (event: Event) => {
  const customEvent = event as CustomEvent;
  const { widget, isOpen, hasAnyWidgetOpen } = customEvent.detail;
  
  // Update orb position (existing code)
  if (hasAnyWidgetOpen) {
    orb.setPosition("right", true);
  } else {
    orb.setPosition("center", true);
  }
  
  // OPTIONAL: Send to backend for logging
  if (socket.isConnected()) {
    socket.send({
      type: "widget_state",
      widget: widget,
      is_open: isOpen,
      active_widgets: getActiveWidgets()  // Implement this function
    });
  }
});

// Helper function to get list of active widgets
function getActiveWidgets(): string[] {
  const activeWidgets: string[] = [];
  // Access widget state from DOM or global state
  // This depends on your React state management
  // You may need to expose this via a callback from widgets.tsx
  return activeWidgets;
}
```

### Expose Widget State from React Component (widgets.tsx)

Make widget state accessible to main.ts:

```typescript
// Add this to widgets.tsx after initWidgets()

export function getActiveWidgets(): string[] {
  // This would require exposing state from WidgetContainer
  // For now, you can access it from window
  return (window as any).novaActiveWidgets || [];
}

export function setActiveWidgetsGlobal(widgets: Record<string, boolean>) {
  (window as any).novaActiveWidgets = Object.keys(widgets)
    .filter(key => widgets[key as WidgetName]);
}

// In WidgetContainer component, update state tracking:
useEffect(() => {
  // After any widget state change, expose to window
  const active = Object.keys(activeWidgets)
    .filter(key => activeWidgets[key as WidgetName]);
  (window as any).novaActiveWidgets = active;
}, [activeWidgets]);
```

---

## 3. Analytics & Logging

### Log Widget Usage Patterns

```python
# In server.py, add analytics logging

def log_widget_analytics():
    """Log widget usage patterns for analytics."""
    active = state.get_active_widgets()
    logger.info(f"📈 Widget Usage: {', '.join(active) if active else 'None'}")
    
    # Example: Adjust AI response based on active widgets
    if 'image' in active:
        # AI might provide image-related suggestions
        logger.info("💡 Suggestion: Use image widget for visual content")
    
    if 'weather' in active:
        # AI might provide weather-related info
        logger.info("🌤️ Suggestion: Fetch weather data")
```

### Store Widget Usage History

```python
# Optional: Track widget usage over time

from collections import defaultdict
from datetime import timedelta

class WidgetAnalytics:
    def __init__(self):
        self.usage_log: List[Dict[str, Any]] = []
        self.session_start = datetime.now()
    
    def log_widget_event(self, widget: str, action: str):
        """Log widget events for analytics."""
        self.usage_log.append({
            'timestamp': datetime.now(),
            'widget': widget,
            'action': action,  # 'open' or 'close'
            'session_duration': datetime.now() - self.session_start
        })
    
    def get_summary(self) -> Dict[str, Any]:
        """Get usage summary."""
        return {
            'total_events': len(self.usage_log),
            'active_session_time': datetime.now() - self.session_start,
            'most_used_widget': self._most_used(),
        }
    
    def _most_used(self) -> Optional[str]:
        """Find most frequently used widget."""
        opens = defaultdict(int)
        for event in self.usage_log:
            if event['action'] == 'open':
                opens[event['widget']] += 1
        return max(opens, key=opens.get) if opens else None

# Initialize in server startup
analytics = WidgetAnalytics()
```

---

## 4. AI Response Customization Based on Widget State

### Context-Aware Responses

The AI can make decisions based on active widgets:

```python
# In handle_transcript_message()

async def customize_ai_response(transcript: str, context: NovaAIContext) -> str:
    """Customize AI response based on widget state."""
    
    active_widgets = state.get_active_widgets()
    
    # Add widget context to AI prompt
    widget_context = ""
    if active_widgets:
        widget_context = (
            f"\n\nUser currently has these widgets open: {', '.join(active_widgets)}. "
            "Consider this when crafting your response. "
            "For example, if 'calculator' is open, they might want math help. "
            "If 'image' is open, they might want visual suggestions."
        )
    
    # Modify the AI context
    context.widgets_open = active_widgets
    context.has_widgets_open = bool(active_widgets)
    
    # Pass to AI model
    response = await nova_ai.generate_response(
        transcript,
        context=context,
        system_prompt_suffix=widget_context
    )
    
    return response
```

---

## 5. REST API Endpoints (Optional)

### Get Current Widget State

```python
@app.get("/api/widgets/state")
async def get_widget_state():
    """Get current widget states."""
    return JSONResponse({
        "widgets": state.widget_states,
        "active": state.get_active_widgets(),
        "has_open": state.has_widgets_open(),
        "last_changed": state.widget_state_changed_at.isoformat() 
                       if state.widget_state_changed_at else None
    })
```

### Get Widget Usage Stats

```python
@app.get("/api/widgets/stats")
async def get_widget_stats():
    """Get widget usage statistics."""
    return JSONResponse(analytics.get_summary())
```

---

## 6. Environment Configuration

### Optional Backend Settings (config.yaml)

```yaml
# Add to config.yaml

widgets:
  # Enable/disable widget state tracking
  track_state: true
  
  # Enable/disable analytics logging
  enable_analytics: true
  
  # AI customization based on widget state
  customize_responses: true
  
  # Widget-specific configs
  configs:
    image:
      enabled: true
      auto_generate: false
    weather:
      enabled: true
      auto_fetch: true
    calculator:
      enabled: true
    notes:
      enabled: true
    tictactoe:
      enabled: true
```

### Load Configuration

```python
def load_widget_config() -> Dict[str, Any]:
    """Load widget configuration from config.yaml."""
    import yaml
    
    config_path = Path(__file__).parent / "config.yaml"
    
    try:
        with open(config_path) as f:
            config = yaml.safe_load(f)
            return config.get("widgets", {})
    except FileNotFoundError:
        logger.warning("config.yaml not found, using defaults")
        return {
            "track_state": True,
            "enable_analytics": True,
            "customize_responses": True
        }

widget_config = load_widget_config()
```

---

## 7. Error Handling

### Safe Widget State Updates

```python
async def safe_widget_state_update(
    websocket: WebSocket, 
    message: Dict[str, Any]
) -> bool:
    """Safely update widget state with error handling."""
    try:
        widget = message.get("widget", "").strip().lower()
        is_open = message.get("is_open", False)
        
        if not widget:
            logger.warning("Empty widget name in state update")
            return False
        
        if not isinstance(is_open, bool):
            logger.warning(f"Invalid is_open value: {is_open}")
            return False
        
        # Update state
        success = state.update_widget_state(widget, is_open)
        
        if not success:
            logger.warning(f"Unknown widget: {widget}")
        
        # Log analytics
        if widget_config.get("enable_analytics"):
            analytics.log_widget_event(widget, "open" if is_open else "close")
        
        return success
        
    except Exception as e:
        logger.error(f"Error updating widget state: {e}")
        return False
```

---

## 8. Testing Backend Integration

### Test Widget State Updates

```python
# In a test file or terminal

import asyncio
import websockets
import json

async def test_widget_state():
    """Test widget state updates via WebSocket."""
    uri = "ws://localhost:8340/ws/voice"
    
    async with websockets.connect(uri) as websocket:
        # Send widget state update
        msg = {
            "type": "widget_state",
            "widget": "image",
            "is_open": True,
            "active_widgets": ["image"]
        }
        await websocket.send(json.dumps(msg))
        
        # Receive response
        response = await websocket.recv()
        print(f"Response: {response}")

# Run test
asyncio.run(test_widget_state())
```

---

## 9. Integration Checklist

- [ ] Add `update_widget_state()` to `ServerState` class
- [ ] Add `handle_widget_state_update()` handler
- [ ] Update WebSocket endpoint to process widget messages
- [ ] Optional: Expose widget state from React component
- [ ] Optional: Send widget state to backend from main.ts
- [ ] Optional: Add analytics tracking
- [ ] Optional: Implement context-aware AI responses
- [ ] Optional: Add REST API endpoints for widget stats
- [ ] Test widget state flow end-to-end
- [ ] Add logging/monitoring for widget events

---

## 10. Notes

- **Widget state tracking is optional** - the frontend works independently
- **Backend integration is for enhancement only** - not required for core functionality
- **Performance impact is minimal** - state tracking is lightweight
- **Scalable design** - can expand to multiple widgets and complex logic

---

