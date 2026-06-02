╔══════════════════════════════════════════════════════════════════════════════╗
║                    CHAT SYSTEM API REFERENCE                                 ║
║                Complete API documentation for all chat components            ║
╚══════════════════════════════════════════════════════════════════════════════╝

═══════════════════════════════════════════════════════════════════════════════
🎯 QUICK API REFERENCE
═══════════════════════════════════════════════════════════════════════════════

IMPORTS:
  import ChatInterface from './components/Chat/ChatInterface';
  import FloatingChatButton from './components/Chat/FloatingChatButton';
  import ChatMessage, { TypingIndicator } from './components/Chat/ChatMessage';
  import { commandParser } from './services/CommandParser';
  import { AIService } from './services/AIService';
  import { voiceSynthesis } from './services/VoiceSynthesis';

═══════════════════════════════════════════════════════════════════════════════
📦 COMPONENT APIs
═══════════════════════════════════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<ChatInterface />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROPS:
  isOpen (boolean)
    • Required: No
    • Default: true
    • Description: Controls visibility of chat window
    
  isMinimized (boolean)
    • Required: No
    • Default: false
    • Description: Hides messages and input when true
    
  onToggle (function)
    • Required: No
    • Callback when user closes/opens chat
    • Parameters: none
    • Example: onToggle={() => setIsChatOpen(!isChatOpen)}
    
  onMinimize (function)
    • Required: No
    • Callback when user clicks minimize button
    • Parameters: none
    
  onWidgetCommand (function)
    • Required: Yes (for full functionality)
    • Called when user sends widget command
    • Parameters: { type, widget?, query?, ... }
    • Example:
      onWidgetCommand={(cmd) => {
        if (cmd.type === 'search') showSearchWidget(cmd.query);
      }}

STATE:
  messages (Array)
    • Type: Array<{id, text, isUser, timestamp, isSystem?, isWelcome?}>
    • Initially: Welcome message
    • Updated: On send/receive message
    
  inputValue (string)
    • Type: String
    • Max length: 500 characters
    • Cleared: After sending message
    
  isTyping (boolean)
    • Type: Boolean
    • True: While waiting for AI response
    • Shows: TypingIndicator component
    
  isListening (boolean)
    • Type: Boolean
    • True: While microphone is active

METHODS:
  None (use callbacks for external communication)

EXAMPLE:
  <ChatInterface
    isOpen={chatOpen}
    isMinimized={chatMinimized}
    onToggle={() => setChatOpen(!chatOpen)}
    onMinimize={() => setChatMinimized(!chatMinimized)}
    onWidgetCommand={handleWidgetCommand}
  />

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<FloatingChatButton />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROPS:
  isOpen (boolean)
    • Required: Yes
    • Description: Changes button color/icon
    • When true: Shows "✕" (close icon)
    • When false: Shows "💬" (chat icon) with pulse
    
  onClick (function)
    • Required: Yes
    • Called: When user clicks button
    • Parameters: none
    
  hasPendingMessages (boolean)
    • Required: No
    • Default: false
    • Shows: Red notification badge

EXAMPLE:
  <FloatingChatButton
    isOpen={isChatOpen}
    onClick={toggleChat}
    hasPendingMessages={unreadCount > 0}
  />

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<ChatMessage />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROPS:
  message (object)
    • Required: Yes
    • Type: { id, text, isUser, timestamp }
    • Example: {
        id: 'msg-123456',
        text: 'Hello, how can I help?',
        isUser: false,
        timestamp: new Date()
      }
    
  isUser (boolean)
    • Required: Yes
    • True: Message appears on right (blue)
    • False: Message appears on left (green)

EXAMPLE:
  <ChatMessage 
    message={{
      id: '123',
      text: 'User message text',
      isUser: true,
      timestamp: new Date()
    }}
    isUser={true}
  />

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
<TypingIndicator />
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROPS:
  None

DESCRIPTION:
  Shows animated dots while AI is processing

EXAMPLE:
  {isTyping && <TypingIndicator />}

═══════════════════════════════════════════════════════════════════════════════
🔧 SERVICE APIs
═══════════════════════════════════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CommandParser
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SINGLETON INSTANCE:
  import { commandParser } from './services/CommandParser';

METHODS:

parse(message: string): Command
  Description: Analyzes user message and returns command object
  Parameters:
    • message (string): User input
  Returns: {
    type: 'chat' | 'search' | 'news' | 'calculator' | 'camera' | 
          'time' | 'weather' | 'game' | 'clear' | 'reset',
    [additional properties based on type]
  }
  Example:
    const cmd = commandParser.parse("Search for pizza");
    // Returns: { type: 'search', query: 'pizza' }

isTimeRequest(message: string): boolean
  Returns: true if message asks for time
  Example: isTimeRequest("What time is it?") → true

isWeatherRequest(message: string): boolean
  Returns: true if message asks for weather

isSearchRequest(message: string): boolean
  Returns: true if message is a search query

isNewsRequest(message: string): boolean
  Returns: true if message asks for news

isCalculatorRequest(message: string): boolean
  Returns: true if message contains math

isCameraRequest(message: string): boolean
  Returns: true if message requests camera/vision

isGameRequest(message: string): boolean
  Returns: true if message requests to play game

isClearCommand(message: string): boolean
  Returns: true if message clears/hides widget

isResetCommand(message: string): boolean
  Returns: true if message resets widgets

extractSearchQuery(message: string): string
  Returns: Cleaned search query
  Example: "Search for pasta" → "pasta"

extractNewsQuery(message: string): {type, topic?, source?}
  Returns: Structured news query

extractLocation(message: string): string | null
  Returns: Location from message
  Example: "What's the weather in Paris?" → "Paris"

shouldGoToWidget(command: Command): boolean
  Returns: true if command should route to widget (not chat)
  Example:
    if (commandParser.shouldGoToWidget(cmd)) {
      showWidget(cmd.type);
    }

getWidgetDisplayName(widgetType: string): string
  Returns: Human-friendly widget name
  Example: getWidgetDisplayName('search') → 'Search Widget'

isMoreInfoRequest(message: string): boolean
  Returns: true if user wants more details/explanation

isFollowUp(message: string): boolean
  Returns: true if message is a follow-up question

EXAMPLE USAGE:
  const command = commandParser.parse("Find me a good restaurant");
  
  if (command.type === 'search') {
    displaySearchResults(command.query);
  } else if (command.type === 'chat') {
    sendToChatAI(command.message);
  }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AIService (Enhanced)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SINGLETON INSTANCE:
  import { AIService } from './services/AIService';

CHAT METHODS:

async chatWithNova(userMessage: string, options: object): Promise<ChatResponse>
  Description: Main chat method with context awareness
  Parameters:
    • userMessage (string): User message
    • options (object): {
        useCache: boolean (default: false),
        ...other options
      }
  Returns: {
    success: boolean,
    text: string,          // AI response
    fromCache: boolean,
    error?: string
  }
  Example:
    const response = await AIService.chatWithNova("What is AI?");
    console.log(response.text); // AI's explanation

buildSystemPrompt(): string
  Description: Returns system prompt for Nova AI
  Returns: System instructions for AI behavior

getConversationContext(): string
  Description: Returns last 6 messages for context
  Returns: Formatted conversation history

addToHistory(role: 'user' | 'assistant', content: string): void
  Description: Stores message in conversation history
  Parameters:
    • role: 'user' or 'assistant'
    • content: Message text
  Note: Max 20 messages kept

clearHistory(): void
  Description: Clears all conversation history
  Used: When user clears chat or starts new conversation

EXISTING METHODS (Still Available):

async callGemini(prompt, imageBase64?, options?): Promise<Response>
  Description: Direct Gemini API call (for non-chat uses)
  
getCache(key: string): any
  Returns: Cached value if exists

setCache(key: string, value: any): void
  Stores: Value in cache

isCacheValid(key: string): boolean
  Returns: true if cache entry is still valid

clearCache(key: string): void
  Clears: Specific cache entry

EXAMPLE USAGE:
  // Chat integration
  const response = await AIService.chatWithNova("Tell me about Python");
  if (response.success) {
    addMessage(response.text, false);
  }
  
  // Clear conversation
  AIService.clearHistory();
  
  // Non-chat AI call
  const result = await AIService.callGemini("Analyze this image", base64Image);

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VoiceSynthesis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SINGLETON INSTANCE:
  import { voiceSynthesis } from './services/VoiceSynthesis';

PROPERTIES:

isSupported: boolean
  Returns: true if browser supports Web Speech API

isPlaying: boolean
  Returns: true while audio is playing

METHODS:

async speak(text: string, options: object): Promise<boolean>
  Description: Speak text using system voice
  Parameters:
    • text (string): Text to speak
    • options (object): {
        rate: number (0.1-10, default: 1),
        pitch: number (0-2, default: 1),
        volume: number (0-1, default: 0.9),
        voiceIndex: number (default: 0),
        onStart: () => {},  // Callback
        onEnd: () => {}     // Callback
      }
  Returns: Promise<boolean> - true if successful
  Example:
    await voiceSynthesis.speak("Hello world", {
      rate: 1.2,
      pitch: 1,
      onEnd: () => console.log("Finished speaking")
    });

cancel(): void
  Description: Stop current speech

pause(): void
  Description: Pause speech

resume(): void
  Description: Resume paused speech

getVoices(): SpeechSynthesisVoice[]
  Returns: Available voices in system
  Example:
    const voices = voiceSynthesis.getVoices();
    console.log(voices.map(v => v.name));

setVoice(voiceIndex: number): void
  Description: Set preferred voice
  Saves: To localStorage

setRate(rate: number): void
  Description: Set speech rate (0.1-10)
  Saves: To localStorage

setPitch(pitch: number): void
  Description: Set speech pitch (0-2)
  Saves: To localStorage

setVolume(volume: number): void
  Description: Set volume (0-1)
  Saves: To localStorage

savePreferences(): void
  Description: Save settings to localStorage

loadPreferences(): void
  Description: Load settings from localStorage

EXAMPLE USAGE:
  // Speak AI response
  const response = await AIService.chatWithNova("What's the weather?");
  await voiceSynthesis.speak(response.text, {
    rate: 1.2,
    onEnd: () => console.log("Done speaking")
  });
  
  // Configure voice
  voiceSynthesis.setRate(1.5);
  voiceSynthesis.setPitch(1.2);
  voiceSynthesis.setVolume(0.8);

═══════════════════════════════════════════════════════════════════════════════
💬 COMMAND TYPES & RESPONSES
═══════════════════════════════════════════════════════════════════════════════

CHAT COMMAND:
  Input: Any regular conversation
  Command: { type: 'chat', message: 'user input' }
  Handler: Send to AIService.chatWithNova()
  Response: AI-generated text

SEARCH COMMAND:
  Input: "Search for best restaurants"
  Command: { type: 'search', query: 'best restaurants' }
  Handler: Show SearchWidget with query
  Response: Search results in widget

NEWS COMMAND:
  Input: "Show me the news"
  Command: { type: 'news', query: { type, topic } }
  Handler: Show NewsWidget with topic
  Response: News articles in widget

CALCULATOR COMMAND:
  Input: "Calculate 25 + 75"
  Command: { type: 'calculator', expression: '25 + 75' }
  Handler: Show CalculatorWidget with expression
  Response: Calculation result in widget

CAMERA COMMAND:
  Input: "Open camera"
  Command: { type: 'camera', mode: 'capture' }
  Handler: Show CameraWidget with mode
  Response: Camera feed in widget

TIME COMMAND:
  Input: "What time is it in Paris?"
  Command: { type: 'time', location: 'Paris' }
  Handler: Show time display or send to AI
  Response: Current time for location

WEATHER COMMAND:
  Input: "What's the weather in London?"
  Command: { type: 'weather', location: 'London' }
  Handler: Show weather or send to AI
  Response: Weather information

CLEAR COMMAND:
  Input: "Hide the news widget"
  Command: { type: 'clear', widget: 'news' }
  Handler: Hide specified widget
  Response: Widget hidden, system message shown

RESET COMMAND:
  Input: "Reset widgets"
  Command: { type: 'reset', target: 'widgets' }
  Handler: Reset all widget positions/sizes
  Response: Widgets reset, system message shown

═══════════════════════════════════════════════════════════════════════════════
🔗 EVENT SYSTEM
═══════════════════════════════════════════════════════════════════════════════

CUSTOM EVENTS:

widget:command
  Description: Send command to specific widget
  Usage:
    const event = new CustomEvent('widget:command', {
      detail: { widget: 'search', query: 'pizza' }
    });
    window.dispatchEvent(event);
  Listen:
    window.addEventListener('widget:command', (e) => {
      const { widget, ...data } = e.detail;
      handleWidgetCommand(widget, data);
    });

widget:message
  Description: Cross-widget communication
  Usage:
    const event = new CustomEvent('widget:message', {
      detail: { from: 'chat', to: 'search', message: 'data' }
    });
    window.dispatchEvent(event);

═══════════════════════════════════════════════════════════════════════════════
⚙️ CONFIGURATION
═══════════════════════════════════════════════════════════════════════════════

ENVIRONMENT VARIABLES (.env):
  REACT_APP_GEMINI_API_KEY=your_key_here

LOCALSTORAGE KEYS:
  chatAutoSpeak (true/false) - Auto-speak AI responses
  userLocation (string) - User's location for context
  voiceSynthesisPreferences (JSON) - Voice settings
  widget-pos-{widgetId} (JSON) - Widget positions
  widget-size-{widgetId} (JSON) - Widget sizes

═══════════════════════════════════════════════════════════════════════════════
📊 DATA STRUCTURES
═══════════════════════════════════════════════════════════════════════════════

MESSAGE OBJECT:
  {
    id: string,              // Unique identifier
    text: string,            // Message content
    isUser: boolean,         // User (true) or AI (false)
    timestamp: Date,         // When message was sent
    isSystem?: boolean,      // System messages
    isWelcome?: boolean      // Welcome message
  }

COMMAND OBJECT:
  {
    type: string,            // Command type
    [key: string]: any       // Type-specific properties
  }

CHAT RESPONSE:
  {
    success: boolean,        // Success status
    text: string,           // AI response text
    fromCache?: boolean,    // Was response cached?
    error?: string          // Error message if failed
  }

═══════════════════════════════════════════════════════════════════════════════
✅ COMPLETE API REFERENCE - Ready for Integration!
═══════════════════════════════════════════════════════════════════════════════
