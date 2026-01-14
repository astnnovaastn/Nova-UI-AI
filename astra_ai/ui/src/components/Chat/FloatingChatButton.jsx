/**
 * FloatingChatButton.jsx
 * Floating button that toggles chat interface
 * Fully integrated with splash_screen.html chat functionality
 */

import React, { useState } from 'react';
import './FloatingChatButton.css';

const FloatingChatButton = ({ isOpen, onClick, hasPendingMessages = false }) => {
  return (
    <button
      className={`floating-chat-button ${isOpen ? 'active' : ''} ${hasPendingMessages ? 'has-messages' : ''}`}
      onClick={onClick}
      title={isOpen ? 'Close Chat' : 'Open Chat'}
    >
      <div className="chat-button-icon">
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
            <circle cx="8" cy="10" r="1.5" />
            <circle cx="12" cy="10" r="1.5" />
            <circle cx="16" cy="10" r="1.5" />
          </svg>
        )}
      </div>

      {!isOpen && <div className="chat-button-pulse" />}
    </button>
  );
};

export default FloatingChatButton;
