#!/usr/bin/env python3
"""
Nova AI Backend Server
======================

API server for React chat interface that integrates with Nova AI system.

Features:
- Flask REST API for chat communication
- Starts nova_ai.py as subprocess with memory system
- Receives user messages from frontend via /api/chat
- Forwards messages to Nova AI subprocess
- Reads AI responses from nova_ai_memory.json
- Sends responses back to React chat interface
- Maintains chat history and context persistence

Message Flow:
User Message → React → /api/chat → Nova AI subprocess → Memory JSON → Response → React

Author: Astra AI Team
Version: 2.0
"""

import os
import sys
import json
import time
import subprocess
import threading
import signal
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class NovaAIBackendServer:
    """
    Backend server that manages Nova AI subprocess and handles chat API
    """

    def __init__(self):
        self.app = Flask(__name__)
        CORS(self.app)

        # Paths configuration
        # server.py is at: astra_ai/ui/src/backend/server.py
        self.project_root = Path(__file__).parent.parent.parent.parent.parent
        self.memory_file = self.project_root / "Date" / "nova_ai_memory.json"
        self.nova_ai_script = self.project_root / "astra_ai" / "core" / "nova_ai.py"

        logger.info(f"🔍 Server paths configured:")
        logger.info(f"  Project root: {self.project_root}")
        logger.info(f"  Nova AI script: {self.nova_ai_script}")
        logger.info(f"  Memory file: {self.memory_file}")
        logger.info(f"  Nova AI exists: {self.nova_ai_script.exists()}")

        # Nova AI subprocess
        self.nova_process = None
        self.is_running = False
        self.chatbot = None  # Initialize chatbot instance

        # Message queue for communication with Nova AI
        self.message_queue_file = self.project_root / "Date" / "message_queue.json"

        # Setup routes
        self.setup_routes()

    def setup_routes(self):
        """Setup Flask routes"""

        @self.app.route('/api/chat', methods=['POST'])
        def chat_endpoint():
            """Handle chat messages from React frontend"""
            try:
                data = request.get_json()
                if not data or 'message' not in data:
                    return jsonify({'error': 'Missing message'}), 400

                message = data['message']
                session_id = data.get('session_id', 'default_session')

                logger.info(f"📨 Received message from session {session_id}: {message[:50]}...")

                # Process message through Nova AI
                response = self.process_chat_message(message, session_id)

                return jsonify({
                    'response': response,
                    'session_id': session_id,
                    'timestamp': datetime.now().isoformat()
                })

            except Exception as e:
                logger.error(f"❌ Chat endpoint error: {e}")
                return jsonify({'error': str(e)}), 500

        @self.app.route('/api/health', methods=['GET'])
        def health_check():
            """Health check endpoint"""
            return jsonify({
                'status': 'healthy' if self.is_running else 'starting',
                'nova_ai_running': hasattr(self, 'chatbot') and self.chatbot is not None,
                'memory_file_exists': self.memory_file.exists(),
                'timestamp': datetime.now().isoformat()
            })

        @self.app.route('/api/status', methods=['GET'])
        def status():
            """Get server status"""
            return jsonify({
                'server_running': True,
                'nova_ai_initialized': hasattr(self, 'chatbot') and self.chatbot is not None,
                'memory_file_exists': self.memory_file.exists(),
                'timestamp': datetime.now().isoformat()
            })

        @self.app.route('/api/search/history', methods=['GET'])
        def search_history():
            """Get search history from JSON file"""
            try:
                search_history_file = Path(__file__).parent / "search_history.json"
                if search_history_file.exists():
                    with open(search_history_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        return jsonify(data)
                return jsonify({"searches": []})
            except Exception as e:
                logger.error(f"❌ Search history error: {e}")
                return jsonify({'error': str(e)}), 500

    def start_nova_ai(self):
        """Initialize Nova AI system and chatbot"""
        try:
            if self.is_running and self.chatbot is not None:
                logger.info("✅ Nova AI already initialized")
                return True

            logger.info("🚀 Initializing Nova AI system...")

            # Ensure memory file exists
            self.memory_file.parent.mkdir(parents=True, exist_ok=True)
            if not self.memory_file.exists():
                # Create initial memory structure
                initial_memory = {
                    "user": {
                        "user_id": "user_a358b1d2",
                        "name": "User",
                        "created_at": datetime.now().isoformat(),
                        "status": "active"
                    },
                    "memory_events": [],
                    "conversation": [],
                    "current_session": "default_session"
                }
                with open(self.memory_file, 'w', encoding='utf-8') as f:
                    json.dump(initial_memory, f, indent=2, ensure_ascii=False)

            # Initialize chatbot
            try:
                astra_ai_path = self.project_root / "astra_ai"
                if str(astra_ai_path) not in sys.path:
                    sys.path.insert(0, str(astra_ai_path))

                from core.nova_ai import AleChatBot
                self.chatbot = AleChatBot()
                logger.info("🤖 Nova AI chatbot initialized successfully")
            except Exception as e:
                logger.error(f"❌ Failed to initialize chatbot: {e}")
                return False

            # Mark as running
            self.is_running = True
            logger.info("✅ Nova AI system initialized")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to initialize Nova AI: {e}")
            return False

    def process_chat_message(self, message, session_id):
        """Process a chat message through Nova AI"""
        try:
            if not self.is_running or self.chatbot is None:
                if not self.start_nova_ai():
                    return "Sorry, I'm having trouble starting the AI system. Please try again later."

            # Get response using the async chat method
            import asyncio
            response = asyncio.run(self.chatbot.get_chat_response(message, session_id))

            if response:
                logger.info(f"✅ Got AI response: {response[:50]}...")
                return response
            else:
                return "I received your message but couldn't generate a response. Please try again."

        except Exception as e:
            logger.error(f"❌ Error getting AI response: {e}")
            return "Sorry, there was an error processing your message."

    def cleanup(self):
        """Cleanup resources"""
        # Clean up chatbot instance
        if hasattr(self, 'chatbot'):
            try:
                # Save any pending memory - avoid calling save_chat_history without arguments
                if hasattr(self.chatbot, 'memory_integration') and self.chatbot.memory_integration:
                    if hasattr(self.chatbot.memory_integration, 'memory_system') and hasattr(self.chatbot.memory_integration.memory_system, 'save_memory'):
                        self.chatbot.memory_integration.memory_system.save_memory()
            except Exception as e:
                logger.warning(f"Error saving memory during cleanup: {e}")

        self.is_running = False
        logger.info("🧹 Nova AI server cleanup completed")

    def run(self, host='127.0.0.1', port=5001, debug=False):
        """Run the Flask server"""
        logger.info(f"🌐 Starting Nova AI Backend Server on {host}:{port}")

        # Start Nova AI on server startup
        if not self.start_nova_ai():
            logger.warning("⚠️ Failed to start Nova AI on startup - will attempt on first request")

        try:
            self.app.run(host=host, port=port, debug=debug, threaded=True)
        except KeyboardInterrupt:
            logger.info("🛑 Server shutdown requested")
        finally:
            self.cleanup()


def main():
    """Main entry point"""
    server = NovaAIBackendServer()

    # Handle graceful shutdown
    def signal_handler(signum, frame):
        logger.info("📴 Received shutdown signal")
        server.cleanup()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    # Run server
    server.run()


if __name__ == '__main__':
    main()