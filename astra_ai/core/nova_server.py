
import sys
import os
import json
import logging
import asyncio
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

# Adjust path to import nova_ai and dependencies
current_dir = os.path.dirname(os.path.abspath(__file__))
intermediate_dir = os.path.dirname(current_dir) # astra_ai
project_root = os.path.dirname(intermediate_dir) # Go up two levels to Astra_ai root
sys.path.append(project_root)
sys.path.append(intermediate_dir)
sys.path.append(current_dir)

from nova_ai import AleChatBot

app = Flask(__name__)
CORS(app)

# Initialize ChatBot
try:
    chatbot = AleChatBot()
    print("Nova AI ChatBot initialized successfully")
except Exception as e:
    print(f"Error initializing ChatBot: {e}")
    sys.exit(1)

# Path to ai_responses.json
UI_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'ui')
RESPONSES_FILE = os.path.join(UI_DIR, 'ai_responses.json')

def save_response(user_msg, ai_msg, msg_id):
    try:
        data = []
        if os.path.exists(RESPONSES_FILE):
            try:
                with open(RESPONSES_FILE, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if content.strip():
                        data = json.loads(content)
            except (json.JSONDecodeError, IOError):
                pass
        
        entry = {
            "timestamp": datetime.now().isoformat(),
            "conversation_data": {
                "user_message": user_msg,
                "ai_response": ai_msg,
                "message_id": msg_id
            }
        }
        data.append(entry)
        
        with open(RESPONSES_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving response: {e}")

@app.route('/chat', methods=['POST'])
def chat():
    print("Received chat request")
    try:
        data = request.json
        user_message = data.get('message')
        conversation_id = data.get('conversation_id')
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
            
        print(f"Processing message: {user_message}")
        
        # Process message
        # Check specific methods
        if hasattr(chatbot, 'get_response'):
            print("Using get_response method")
            method = chatbot.get_response
        elif hasattr(chatbot, 'process_input'):
            print("Using process_input method")
            method = chatbot.process_input
        else:
            # Fallback if neither exists (unlikely given dir() check)
            raise Exception("Chatbot has no known response method (get_response/process_input)")

        # Execute method (handle async if needed)
        if asyncio.iscoroutinefunction(method):
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            response = loop.run_until_complete(method(user_message))
        else:
            response = method(user_message)
            
        # Handle response types
        if isinstance(response, str):
            response_text = response
        elif hasattr(response, 'content'):
            response_text = response.content
        elif isinstance(response, dict):
             response_text = response.get('content') or response.get('text') or str(response)
        else:
            response_text = str(response)
            
        print(f"Generated response: {response_text[:50]}...")

        save_response(user_message, response_text, str(conversation_id))
        
        return jsonify({
            'response': response_text,
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'session_id': conversation_id
            }
        })
    except Exception as e:
        print(f"Error processing chat: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat/history', methods=['GET'])
def get_history():
    if os.path.exists(RESPONSES_FILE):
        try:
             with open(RESPONSES_FILE, 'r', encoding='utf-8') as f:
                content = f.read()
                if content.strip():
                    return jsonify(json.loads(content))
                else:
                    return jsonify([])
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return jsonify([])

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "online", "service": "nova_ai"}), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting Nova AI Server on port {port}")
    app.run(host='0.0.0.0', port=port)
