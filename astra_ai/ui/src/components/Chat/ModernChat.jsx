import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ModernChat.css';

const ModernChat = ({ isOpen, onClose, onWidgetTrigger }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'nova',
      text: 'Welcome! I\'m Nova, your AI assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Get API configuration from URL or use defaults
  const getApiConfig = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const apiPort = urlParams.get('api_port') || '5001';
    const apiHost = window.location.hostname || '127.0.0.1';
    return {
      baseUrl: `http://${apiHost}:${apiPort}`,
      chatEndpoint: '/api/chat'
    };
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        // Try to fetch from the API which reads the JSON file
        const { baseUrl } = getApiConfig();
        const response = await fetch(`${baseUrl}/api/chat/history`);

        if (response.ok) {
          const history = await response.json();
          if (Array.isArray(history) && history.length > 0) {
            // Convert JSON format to component message format
            const formattedMessages = history.map((item, index) => {
              const msgData = item.conversation_data;
              return [
                {
                  id: `hist_user_${index}`,
                  type: 'user',
                  text: msgData.user_message,
                  timestamp: new Date(item.timestamp)
                },
                {
                  id: `hist_ai_${index}`,
                  type: 'nova',
                  text: msgData.ai_response,
                  timestamp: new Date(new Date(item.timestamp).getTime() + 1000) // Visual offset
                }
              ];
            }).flat();

            setMessages(prev => {
              // Only keep the welcome message if history is empty
              if (formattedMessages.length > 0) {
                return formattedMessages;
              }
              return prev;
            });

            // Scroll to bottom after loading
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            }, 100);
          }
        }
      } catch (error) {
        console.log('Could not load chat history:', error);
        // Fallback to loading local JSON if API fails (mock/dev mode)
        try {
          // This is a direct fallback for when running without backend locally for testing
          // In a real scenario, the API call above is preferred
          const response = await fetch('/ai_responses.json');
          if (response.ok) {
            const history = await response.json();
            // ... same formatting logic ...
          }
        } catch (e) {
          console.log('No local history file found either');
        }
      }
    };

    loadChatHistory();
  }, [isOpen]); // Reload when chat opens

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const detectWidgetCommand = (message, response) => {
    const lowerMessage = message.toLowerCase();
    const lowerResponse = response.toLowerCase();

    // Time widget triggers
    if (lowerMessage.match(/what time|current time|time is it|show.*time|clock/)) {
      let location = 'Como, Italy'; // Default to Como, Italy as per splash_screen.html behavior

      const locationMatch = lowerMessage.match(/(?:in|at|for)\s+([a-zA-Z\s]+)/i);
      if (locationMatch) {
        location = locationMatch[1].trim();
      } else if (lowerMessage.includes('local')) {
        location = 'Local Time';
      }

      onWidgetTrigger?.('time', { location });
    }

    // Weather widget triggers
    if (lowerMessage.match(/weather|temperature|forecast|climate/)) {
      onWidgetTrigger?.('weather');
    }

    // Search widget triggers
    if (lowerMessage.match(/search|look up|find|google/)) {
      console.log("[DEBUG] Search command detected in message");
      onWidgetTrigger?.('search');
    }

    // News widget triggers
    if (lowerMessage.match(/news|headlines|latest.*happening|current events/)) {
      onWidgetTrigger?.('news');
    }

    // Camera/Vision widget triggers
    if (lowerMessage.match(/camera|take.*picture|show.*camera|vision|see|look at/)) {
      onWidgetTrigger?.('camera');
    }

    // Notes widget triggers
    if (lowerMessage.match(/note|notepad|write.*down|remember this/)) {
      onWidgetTrigger?.('notes');
    }

    // Game widget triggers
    if (lowerMessage.match(/play.*game|tic.*tac.*toe|game/)) {
      onWidgetTrigger?.('tictactoe');
    }

    // Calculator widget triggers
    if (lowerMessage.match(/calculat|math|solve|compute/)) {
      onWidgetTrigger?.('calculator');
    }

    // Task widget triggers
    if (lowerMessage.match(/task|todo|reminder|schedule/)) {
      onWidgetTrigger?.('task');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      const { baseUrl, chatEndpoint } = getApiConfig();

      const requestBody = {
        message: currentInput,
        session_id: sessionId,
        user_location: null // Can be enhanced with geolocation
      };

      const response = await fetch(`${baseUrl}${chatEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      let novaResponse = data.response || 'I apologize, but I couldn\'t process that request.';

      // Check for special response markers
      // Check for special response markers
      if (novaResponse.includes('SEARCH_RESULT:')) {
        console.log("[DEBUG] SEARCH_RESULT marker detected in AI response");
        const searchContent = novaResponse.replace('SEARCH_RESULT:', '').trim();
        console.log(`[DEBUG] Extracted search content length: ${searchContent.length}`);
        // Trigger widget with the content
        onWidgetTrigger?.('search', { query: searchContent });
        // Replace chat message with confirmation
        novaResponse = "Here are the search results for you!";
      }

      if (novaResponse.includes('WEATHER_DATA:')) {
        const content = novaResponse.split('WEATHER_DATA:')[1].trim();
        let location = content;
        let isJson = false;

        try {
          // Check if it looks like JSON
          if (content.startsWith('{') || content.startsWith('[')) {
            const weatherData = JSON.parse(content);
            location = weatherData.location || location;
            isJson = true;

            // Dispatch event to update widget directly (live update)
            // Use a short timeout to ensure widget can handle it if it was just opened
            setTimeout(() => {
              const event = new CustomEvent('weather-data-update', { detail: weatherData });
              window.dispatchEvent(event);
            }, 100);
          }
        } catch (e) {
          console.warn("Weather data parsing failed", e);
        }

        // Open/Ensure widget is visible
        onWidgetTrigger?.('weather', { location });

        // Suppress raw data in chat and provide clean confirmation
        if (isJson) {
          novaResponse = `I've updated the weather widget with the current conditions for ${location}.`;
        } else {
          novaResponse = `Checking weather for ${location}...`;
        }
      }

      if (novaResponse.includes('NEWS_SUMMARY:')) {
        novaResponse = novaResponse.replace('NEWS_SUMMARY:', '').trim();
        onWidgetTrigger?.('news');
      }

      if (novaResponse.includes('CAMERA_ANALYSIS_TRIGGER: true')) {
        novaResponse = novaResponse.replace(/\n\nCAMERA_ANALYSIS_TRIGGER: true/g, '').trim();
        onWidgetTrigger?.('camera');
      }

      // Detect widget commands
      detectWidgetCommand(currentInput, novaResponse);

      const novaMessage = {
        id: Date.now() + 1,
        type: 'nova',
        text: novaResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, novaMessage]);
      setIsTyping(false);

      // Trigger voice synthesis if available
      if (window.synthesizeVoiceForMessage && typeof window.synthesizeVoiceForMessage === 'function') {
        window.synthesizeVoiceForMessage(novaResponse);
      }

    } catch (error) {
      console.error('Chat error:', error);

      const errorMessage = {
        id: Date.now() + 1,
        type: 'nova',
        text: `I'm having trouble connecting to my systems right now. Please make sure the Nova AI server is running on the correct port. Error: ${error.message}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <>
        {/* Backdrop */}
        <motion.div
          className="chat-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Chat Window */}
        <motion.div
          className={`modern-chat-interface active ${isMinimized ? 'minimized' : ''}`}
          initial={{ y: '100vh', scale: 0.8, opacity: 0 }}
          animate={{
            y: isMinimized ? 'calc(100vh - 60px)' : 0,
            scale: 1,
            opacity: 1
          }}
          exit={{ y: '100vh', scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="nova-avatar">
                <i className="fas fa-robot"></i>
              </div>
              <div className="chat-header-info">
                <div className="chat-title">NOVA AI</div>
                <div className="chat-status">
                  <span className="status-dot"></span>
                  Online
                </div>
              </div>
            </div>
            <div className="chat-header-controls">
              <button
                className="chat-search-trigger"
                onClick={() => onWidgetTrigger?.('search')}
                title="Search"
              >
                <i className="fas fa-search"></i>
              </button>
              <button
                className="chat-minimize-btn"
                onClick={handleMinimize}
                title={isMinimized ? 'Restore' : 'Minimize'}
              >
                <i className={`fas fa-${isMinimized ? 'window-maximize' : 'minus'}`}></i>
              </button>
              <button className="chat-close-btn" onClick={onClose} title="Close">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          {/* Messages - Hidden when minimized */}
          {!isMinimized && (
            <>
              <div className="modern-chat-messages">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    className={`chat-message ${message.type}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className={`message-avatar ${message.type === 'nova' ? 'nova-avatar-small' : 'user-avatar'}`}>
                      {message.type === 'nova' ? <i className="fas fa-robot"></i> : <i className="fas fa-user"></i>}
                    </div>
                    <div className="message-content">
                      <div className="message-bubble">
                        {message.text}
                      </div>
                      <div className="message-time">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div
                    className="chat-message nova"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="message-avatar nova-avatar-small">
                      <i className="fas fa-robot"></i>
                    </div>
                    <div className="message-content">
                      <div className="typing-bubble">
                        <div className="typing-dots">
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                          <div className="typing-dot"></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="modern-chat-input-area">
                <form onSubmit={handleSendMessage} className="chat-input-container">
                  <div className="input-wrapper">
                    <input
                      ref={inputRef}
                      type="text"
                      className="modern-chat-input"
                      placeholder="Type your message..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      maxLength={500}
                    />
                    <div className="input-char-count">
                      {inputValue.length}/500
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="modern-send-button"
                    disabled={!inputValue.trim() || isTyping}
                  >
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </form>
              </div>
            </>
          )}
        </motion.div>
      </>
    </AnimatePresence>
  );
};

export default ModernChat;
