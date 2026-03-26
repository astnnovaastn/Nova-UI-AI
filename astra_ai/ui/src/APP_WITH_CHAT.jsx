/**
 * APP_WITH_CHAT.jsx
 * Example App component showing complete chat integration
 * Demonstrates how to use all chat components with the widget system
 */

import React, { useState, useCallback } from 'react';
import ChatInterface from './components/Chat/ChatInterface';
import FloatingChatButton from './components/Chat/FloatingChatButton';

// Import all widgets
import NewsWidget from './components/NewsWidget/NewsWidget';
import NotepadWidget from './components/NotepadWidget/NotepadWidget';
import SearchWidget from './components/SearchWidget/SearchWidget';
import ObjectWidget from './components/ObjectWidget/ObjectWidget';
import CalculatorWidget from './components/CalculatorWidget/CalculatorWidget';
import CameraWidget from './components/CameraWidget/CameraWidget';
import TaskWidget from './components/TaskWidget/TaskWidget';

// Import services
import { commandParser } from './services/CommandParser';
import { WidgetManager } from './services/WidgetManager';

function AppWithChat() {
  // ==================== CHAT STATE ====================
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  // ==================== WIDGET VISIBILITY STATES ====================
  const [widgetVisibility, setWidgetVisibility] = useState({
    news: true,
    notepad: false,
    search: true,
    object: false,
    calculator: false,
    camera: false,
    task: false
  });

  // ==================== CHAT TOGGLE ====================
  const toggleChat = useCallback(() => {
    setIsChatOpen(prev => !prev);
    if (isChatMinimized) {
      setIsChatMinimized(false);
    }
  }, [isChatMinimized]);

  const minimizeChat = useCallback(() => {
    setIsChatMinimized(prev => !prev);
  }, []);

  // ==================== WIDGET COMMAND HANDLER ====================
  /**
   * Main handler for widget commands from chat
   * Routes commands to appropriate widgets based on command type
   */
  const handleWidgetCommand = useCallback((command) => {
    console.log('📦 Widget command received:', command);

    switch (command.type) {
      // ==================== CLEAR COMMANDS ====================
      case 'clear':
        handleClearCommand(command);
        break;

      // ==================== RESET COMMANDS ====================
      case 'reset':
        handleResetCommand();
        break;

      // ==================== SEARCH WIDGET ====================
      case 'search':
        setWidgetVisibility(prev => ({ ...prev, search: true }));
        // You could also pass the search query to SearchWidget
        // broadcastToWidget('search', { query: command.query });
        break;

      // ==================== NEWS WIDGET ====================
      case 'news':
        setWidgetVisibility(prev => ({ ...prev, news: true }));
        // broadcastToWidget('news', { query: command.query });
        break;

      // ==================== CALCULATOR WIDGET ====================
      case 'calculator':
        setWidgetVisibility(prev => ({ ...prev, calculator: true }));
        // broadcastToWidget('calculator', { expression: command.expression });
        break;

      // ==================== CAMERA WIDGET ====================
      case 'camera':
        setWidgetVisibility(prev => ({ ...prev, camera: true }));
        // broadcastToWidget('camera', { mode: command.mode });
        break;

      // ==================== TIME REQUEST ====================
      case 'time':
        console.log(`🕐 Time requested for: ${command.location}`);
        // Show time display widget or update TimeDisplay component
        break;

      // ==================== WEATHER REQUEST ====================
      case 'weather':
        console.log(`🌤️ Weather requested for: ${command.location}`);
        // Show weather display widget
        break;

      // ==================== GAME REQUEST ====================
      case 'game':
        console.log(`🎮 Game requested: ${command.game}`);
        // Show game widget
        break;

      default:
        console.warn('Unknown command type:', command.type);
    }
  }, []);

  // ==================== CLEAR WIDGET HANDLER ====================
  const handleClearCommand = (command) => {
    const widgetName = command.widget?.toLowerCase();
    
    const widgetMap = {
      'search': 'search',
      'news': 'news',
      'notepad': 'notepad',
      'task': 'task',
      'camera': 'camera',
      'calculator': 'calculator',
      'object': 'object'
    };

    if (widgetMap[widgetName]) {
      setWidgetVisibility(prev => ({
        ...prev,
        [widgetMap[widgetName]]: false
      }));
    }
  };

  // ==================== RESET WIDGETS HANDLER ====================
  const handleResetCommand = () => {
    // Reset all widget positions
    WidgetManager.resetWidgetPositions();
    
    // Reset visibility to defaults
    setWidgetVisibility({
      news: true,
      notepad: false,
      search: true,
      object: false,
      calculator: false,
      camera: false,
      task: false
    });
  };

  // ==================== BROADCAST TO WIDGET ====================
  /**
   * Send data to specific widget via custom events
   */
  const broadcastToWidget = (widgetType, data) => {
    const event = new CustomEvent('widget:command', {
      detail: { widget: widgetType, ...data }
    });
    window.dispatchEvent(event);
  };

  // ==================== RENDER ====================
  return (
    <div className="app-container">
      {/* ==================== BACKGROUND ==================== */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, rgba(10, 14, 39, 0.95), rgba(5, 8, 20, 0.98))',
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(0, 255, 136, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(0, 150, 255, 0.05) 0%, transparent 50%)
          `,
          zIndex: -1
        }}
      />

      {/* ==================== WIDGETS ====================*/}
      <div className="widgets-container">
        {widgetVisibility.news && <NewsWidget />}
        {widgetVisibility.notepad && <NotepadWidget />}
        {widgetVisibility.search && <SearchWidget />}
        {widgetVisibility.object && <ObjectWidget />}
        {widgetVisibility.calculator && <CalculatorWidget />}
        {widgetVisibility.camera && <CameraWidget />}
        {widgetVisibility.task && <TaskWidget />}
      </div>

      {/* ==================== CHAT INTERFACE ====================*/}
      <ChatInterface
        isOpen={isChatOpen}
        isMinimized={isChatMinimized}
        onToggle={toggleChat}
        onMinimize={minimizeChat}
        onWidgetCommand={handleWidgetCommand}
      />

      {/* ==================== FLOATING CHAT BUTTON ====================*/}
      <FloatingChatButton
        isOpen={isChatOpen}
        onClick={toggleChat}
        hasPendingMessages={false}
      />

      {/* ==================== STYLES ====================*/}
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body, html {
          width: 100%;
          height: 100%;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background: linear-gradient(135deg, rgba(10, 14, 39, 0.95), rgba(5, 8, 20, 0.98));
          color: #ffffff;
        }

        .app-container {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          position: relative;
          background: transparent;
        }

        .widgets-container {
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        /* Scrollbar styling */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(0, 255, 136, 0.4), rgba(0, 200, 136, 0.6));
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(0, 255, 136, 0.6), rgba(0, 200, 136, 0.8));
        }
      `}</style>
    </div>
  );
}

export default AppWithChat;

// ==================== COMPONENT USAGE GUIDE ====================
/**
 * 
 * QUICK START:
 * ============
 * 
 * 1. IMPORT IN YOUR MAIN APP:
 *    import AppWithChat from './AppWithChat';
 * 
 * 2. USE IN RENDER:
 *    <AppWithChat />
 * 
 * 3. ENVIRONMENT SETUP:
 *    Create .env file with:
 *    REACT_APP_GEMINI_API_KEY=your_api_key_here
 * 
 * ==================== FEATURES ====================
 * 
 * ✅ Floating Chat Button
 *    - Always visible in bottom-right corner
 *    - Click to open/close chat interface
 *    - Shows pending message indicator
 * 
 * ✅ Chat Interface
 *    - Modern UI with message history
 *    - User/AI message differentiation
 *    - Typing indicators
 *    - Voice input support
 *    - Character counter
 *    - Minimize button
 * 
 * ✅ Command Parser
 *    - Detects widget commands from user input
 *    - Supports: search, news, calculator, camera, time, weather, games
 *    - Handles clear and reset commands
 *    - Location extraction
 * 
 * ✅ Widget Management
 *    - Auto-shows widgets based on commands
 *    - Visibility state management
 *    - Cross-widget communication
 *    - Reset to default positions
 * 
 * ✅ AI Integration
 *    - Gemini API with caching
 *    - Conversation history tracking
 *    - Context-aware responses
 *    - Rate limiting and optimization
 * 
 * ==================== CUSTOMIZATION ====================
 * 
 * CHANGE DEFAULT VISIBILITY:
 *   const [widgetVisibility, setWidgetVisibility] = useState({
 *     news: false,        // Hide news widget by default
 *     notepad: true,      // Show notepad widget by default
 *     search: true,
 *     ...
 *   });
 * 
 * MODIFY COMMAND PARSER:
 *   // Add custom keywords in CommandParser class
 *   this.myKeywords = ['custom', 'keywords'];
 * 
 * CUSTOMIZE AI RESPONSE:
 *   // Edit buildSystemPrompt() in AIService class
 *   You can add custom instructions for Nova AI
 * 
 * ==================== KEYBOARD SHORTCUTS ====================
 * 
 * Ctrl+Shift+K  - Open/Close Chat (implement in your app)
 * Enter         - Send message
 * Shift+Enter   - New line in message
 * Escape        - Close chat (optional)
 * 
 * ==================== TROUBLESHOOTING ====================
 * 
 * Chat not responding?
 *   - Check API key in .env
 *   - Verify Gemini API is enabled
 *   - Check browser console for errors
 * 
 * Widgets not appearing?
 *   - Check widgetVisibility state
 *   - Ensure widget components are imported
 *   - Verify CSS is loading
 * 
 * Voice input not working?
 *   - Only works in HTTPS or localhost
 *   - Check browser permissions
 *   - Use Chrome for best support
 * 
 */
