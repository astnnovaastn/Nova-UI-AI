/**
 * ChatMessage.jsx
 * Individual message component for chat interface
 * Handles user messages, AI messages, and typing indicators
 */

import React from 'react';

const ChatMessage = ({ message, isUser = false }) => {
  const messageClasses = `chat-message ${isUser ? 'user' : ''}`;
  
  return (
    <div className={messageClasses}>
      {!isUser && (
        <div className="message-avatar nova-avatar-small">
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.3), rgba(0, 200, 136, 0.5))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: '#00ff88'
          }}>
            ✨
          </div>
        </div>
      )}
      
      {isUser && (
        <div className="message-avatar user-avatar">
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(0, 150, 255, 0.5), rgba(0, 100, 255, 0.7))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            color: '#00aaff'
          }}>
            👤
          </div>
        </div>
      )}
      
      <div className="message-content">
        <div className="message-bubble">
          <div className="message-text">
            {message.text}
          </div>
        </div>
        <div style={{
          fontSize: '11px',
          color: 'rgba(255, 255, 255, 0.5)',
          marginTop: '4px',
          paddingLeft: isUser ? '0' : '32px'
        }}>
          {message.timestamp && new Date(message.timestamp).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * TypingIndicator component
 * Shows animated dots when AI is processing
 */
export const TypingIndicator = () => {
  return (
    <div className="chat-message typing-message">
      <div className="message-avatar nova-avatar-small">
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.3), rgba(0, 200, 136, 0.5))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          color: '#00ff88'
        }}>
          ✨
        </div>
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
    </div>
  );
};

export default ChatMessage;
