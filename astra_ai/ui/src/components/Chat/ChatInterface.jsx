/**
 * ChatInterface.jsx
 * Main modern chat interface component
 * Integrates with all widgets and AI services
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatMessage, { TypingIndicator } from './ChatMessage';
import { commandParser } from '../../services/CommandParser';
import { AIService } from '../../services/AIService';
import { voiceSynthesis } from '../../services/VoiceSynthesis';
import '../styles/ChatStyles.css';

const ChatInterface = ({
  isOpen = true,
  isMinimized = false,
  onToggle = () => { },
  onMinimize = () => { },
  onWidgetCommand = () => { }
}) => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      text: "👋 Welcome to Nova AI! I'm your intelligent assistant. Ask me anything - search the web, get news, calculate numbers, or control your widgets.",
      isUser: false,
      timestamp: new Date(),
      isWelcome: true
    }
  ]);

  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Handle sending a message
   * 
   * Message Flow:
   * User → React → server.py → nova_ai.py → Memory → Response → React
   */
  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();

    const message = inputValue.trim();
    if (!message) return;

    // Add user message to chat
    const userMessage = {
      id: `msg-${Date.now()}`,
      text: message,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Parse the command
    const command = commandParser.parse(message);
    console.log('📝 Command parsed:', command);

    // Handle different command types
    if (command.type === 'clear') {
      handleClearCommand(command);
      return;
    }

    if (command.type === 'reset') {
      handleResetCommand();
      return;
    }

    // For widget commands, notify parent component
    if (commandParser.shouldGoToWidget(command)) {
      onWidgetCommand(command);
      addSystemMessage(`🎯 Routing to ${commandParser.getWidgetDisplayName(command.type)}`);
      return;
    }

    // For regular chat messages, get AI response
    setIsTyping(true);
    try {
      // Get or create persistent session ID
      let sessionId = localStorage.getItem('nova_session_id');
      if (!sessionId) {
        sessionId = `session_${Date.now()}`;
        localStorage.setItem('nova_session_id', sessionId);
      }

      console.log('🚀 Sending message to Nova AI backend...');

      // Send message to Nova AI backend server
      const response = await fetch('http://127.0.0.1:5001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          session_id: sessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.response || "Sorry, I couldn't get a response from the AI.";

        console.log('✅ Received response from Nova AI');

        // Add AI response
        addMessage(aiResponse, false);

        // Optionally speak the response
        if (shouldAutoSpeak()) {
          await voiceSynthesis.speak(aiResponse, {
            onStart: () => console.log('🔊 Speaking...'),
            onEnd: () => console.log('🔊 Done speaking')
          });
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Backend error:', errorText);
        addMessage("Sorry, I encountered an error connecting to the AI service. Please make sure the backend server is running.", false);
      }
    } catch (error) {
      console.error('❌ Chat error:', error);
      addMessage(
        "⚠️ Cannot connect to Nova AI backend server. Please ensure:\n" +
        "1. The backend server is running on port 5001\n" +
        "2. Run 'npm start' from the UI folder to start both frontend and backend\n" +
        "3. Check the terminal for any error messages",
        false
      );
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, onWidgetCommand]);

  /**
   * Add a regular message to chat
   */
  const addMessage = (text, isUser = false) => {
    const newMessage = {
      id: `msg-${Date.now()}`,
      text,
      isUser,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  /**
   * Add a system message (for status updates)
   */
  const addSystemMessage = (text) => {
    const newMessage = {
      id: `sys-${Date.now()}`,
      text,
      isUser: false,
      timestamp: new Date(),
      isSystem: true
    };
    setMessages(prev => [...prev, newMessage]);
  };

  /**
   * Handle clear widget commands
   */
  const handleClearCommand = (command) => {
    const widgetName = command.widget;
    addSystemMessage(`✅ ${widgetName ? `${widgetName} cleared` : 'Command executed'}`);

    onWidgetCommand({
      type: 'clear',
      widget: widgetName
    });
  };

  /**
   * Handle reset widgets command
   */
  const handleResetCommand = () => {
    addSystemMessage('🔄 All widgets reset to default positions and sizes');

    onWidgetCommand({
      type: 'reset'
    });
  };

  /**
   * Check if auto-speak is enabled
   */
  const shouldAutoSpeak = () => {
    return localStorage.getItem('chatAutoSpeak') === 'true';
  };

  /**
   * Handle voice input
   */
  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      addSystemMessage('⚠️ Voice input not supported in your browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInputValue(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      addSystemMessage(`⚠️ Voice input error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  /**
   * Clear chat history
   */
  const clearHistory = () => {
    setMessages([
      {
        id: 'welcome',
        text: "👋 Welcome to Nova AI! I'm your intelligent assistant. Ask me anything - search the web, get news, calculate numbers, or control your widgets.",
        isUser: false,
        timestamp: new Date(),
        isWelcome: true
      }
    ]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`modern-chat-interface ${isOpen ? 'active' : ''} ${isMinimized ? 'minimized' : ''}`}>
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="nova-avatar">
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.4), rgba(0, 200, 136, 0.6))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              color: '#00ff88'
            }}>
              ✨
            </div>
          </div>
          <div className="chat-header-info">
            <div className="chat-title">Nova AI Chat</div>
            <div className="chat-status">
              <div className="status-dot"></div>
              <span>Online</span>
            </div>
          </div>
        </div>

        <div className="chat-header-controls">
          <button
            className="chat-control-btn"
            onClick={clearHistory}
            title="Clear History"
            style={{
              background: 'none',
              border: 'none',
              color: '#00ff88',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            🗑️
          </button>

          <button
            className="chat-minimize-btn"
            onClick={onMinimize}
            title="Minimize"
            style={{
              background: 'none',
              border: 'none',
              color: '#00ff88',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ➖
          </button>

          <button
            className="chat-close-btn"
            onClick={onToggle}
            title="Close"
            style={{
              background: 'none',
              border: 'none',
              color: '#00ff88',
              cursor: 'pointer',
              fontSize: '16px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Chat Messages Area */}
      {!isMinimized && (
        <>
          <div className="modern-chat-messages">
            {messages.map((msg) => (
              msg.isSystem ? (
                <div
                  key={msg.id}
                  style={{
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.6)',
                    padding: '12px',
                    fontSize: '12px',
                    fontStyle: 'italic'
                  }}
                >
                  {msg.text}
                </div>
              ) : (
                <ChatMessage key={msg.id} message={msg} isUser={msg.isUser} />
              )
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Area */}
          <div className="modern-chat-input-area">
            <form onSubmit={handleSendMessage} className="chat-input-container">
              <div className="input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  className="modern-chat-input"
                  placeholder="Type your message... (Shift+Enter for new line)"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={500}
                />

                <button
                  type="button"
                  className="chat-input-btn voice-btn"
                  onClick={startVoiceInput}
                  disabled={isListening}
                  title="Voice input"
                  style={{
                    background: isListening ? 'rgba(255, 0, 0, 0.3)' : 'transparent',
                    border: 'none',
                    color: isListening ? '#ff0000' : '#00ff88',
                    cursor: isListening ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    padding: '8px',
                    marginRight: '8px'
                  }}
                >
                  🎤
                </button>

                <button
                  type="submit"
                  className="modern-send-button"
                  disabled={!inputValue.trim() || isTyping}
                  style={{
                    background: inputValue.trim() && !isTyping
                      ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.6), rgba(0, 200, 136, 0.8))'
                      : 'rgba(0, 255, 136, 0.2)',
                    border: 'none',
                    color: '#00ff88',
                    cursor: inputValue.trim() && !isTyping ? 'pointer' : 'not-allowed',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>📤</span>
                </button>
              </div>

              <div style={{
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.5)',
                marginTop: '6px'
              }}>
                {inputValue.length}/500
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatInterface;
