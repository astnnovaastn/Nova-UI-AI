# import webview as pywebview  # Commented out due to Windows compilation issues
import webbrowser
import os
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
import socket
from pathlib import Path
import sys
import asyncio
import json
from datetime import datetime
from flask import Flask, request, jsonify, session
from flask_cors import CORS
import uuid
import time
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import importlib
import fnmatch
import logging
import signal

# ===================== CONFIGURATION =====================
WATCHED_EXTENSIONS = {'.py', '.html', '.css', '.js', '.json'}
IGNORE_PATTERNS = {
    '__pycache__', '.git', '.vscode', 'node_modules', '.pytest_cache',
    '*.pyc', '*.pyo', '*.log', '.DS_Store', 'Thumbs.db'
}
IGNORE_FILES = {
    'ai_responses.json', 'processed_messages.json', 'transcription.json', 'transcription.txt',
    'output.json', 'process_info.json', 'saved_summaries.json',
    '*.db', '*.sqlite', '*.sqlite3', '*.bin', '*.dat', '*.tmp', '*.temp', '*.cache',
    '*.bak', '*.backup', '*.old', '*.orig'
}
WATCH_SPECIFIC_FILES = {
    'nova_ai.py', 'splash_screen.html', 'enhanced_nova_ai.py', 'personality.py',
    'response_manager.py', 'context_manager.py', 'emotional_intelligence.py',
    'learning.py', 'ml_personalization.py', 'search_decision.py', 'self_improving_ai.py',
    'sentiment_analyzer.py', 'action_tracker.py', 'config_manager.py',
    'enhanced_search.py', 'persistent_commands.py'
}

# ===================== LOGGING SETUP =====================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("NovaAI")

# Add the parent directory to the path to import Nova AI
sys.path.append(str(Path(__file__).parent.parent))
sys.path.append(str(Path(__file__).parent.parent / "astra_ai"))
from core.nova_ai import AleChatBot

# Store chat histories in memory (per session)
chat_histories = {}

# Store user locations per session
user_locations = {}

# Global variables for auto-refresh
webview_window = None
file_watcher = None
last_refresh_time = 0
refresh_cooldown = 1  # Reduced cooldown for faster response
is_refreshing = False  # Prevent multiple simultaneous refreshes

class CodeChangeHandler(FileSystemEventHandler):
    """Handle file system events for code changes"""

    def __init__(self, webview_window):
        super().__init__()
        self.webview_window = webview_window
        self.watched_extensions = WATCHED_EXTENSIONS
        self.ignore_patterns = IGNORE_PATTERNS
        self.ignore_files = IGNORE_FILES
        self.watch_specific_files = WATCH_SPECIFIC_FILES
        self.last_modified_files = {}

    def should_ignore(self, file_path):
        """
        Check if file should be ignored based on patterns, extensions, and specific files.
        Uses glob-style matching for patterns and filenames.
        """
        path_str = str(file_path)
        file_name = Path(file_path).name

        # Check ignore patterns (glob)
        for pattern in self.ignore_patterns:
            if fnmatch.fnmatch(path_str, pattern) or fnmatch.fnmatch(file_name, pattern):
                logger.debug(f"Ignoring by pattern: {pattern} -> {file_path}")
                return True

        # Check ignore files (glob)
        for ignore_file in self.ignore_files:
            if fnmatch.fnmatch(file_name, ignore_file):
                logger.debug(f"Ignoring by file: {ignore_file} -> {file_path}")
                return True

        # Check file extension
        if Path(file_path).suffix not in self.watched_extensions:
            logger.debug(f"Ignoring by extension: {file_path}")
            return True

        # Only watch specific important files
        if file_name not in self.watch_specific_files:
            logger.debug(f"Ignoring by not in watch list: {file_path}")
            return True

        return False

    def on_modified(self, event):
        """Handle file modification events"""
        if event.is_directory:
            return
            
        if self.should_ignore(event.src_path):
            return
            
        # Prevent duplicate events for the same file
        current_time = time.time()
        if event.src_path in self.last_modified_files:
            if current_time - self.last_modified_files[event.src_path] < 0.5:
                return  # Skip if modified too recently
        
        self.last_modified_files[event.src_path] = current_time
        self.handle_file_change(event.src_path, "modified")
    
    def on_created(self, event):
        """Handle file creation events"""
        if event.is_directory:
            return
            
        if self.should_ignore(event.src_path):
            return
            
        self.handle_file_change(event.src_path, "created")
    
    def handle_file_change(self, file_path, change_type):
        """Handle file changes with cooldown"""
        global last_refresh_time, is_refreshing
        
        current_time = time.time()
        if current_time - last_refresh_time < refresh_cooldown:
            print(f"⏳ Skipping refresh (cooldown active): {Path(file_path).name}")
            return
        
        if is_refreshing:
            print(f"⏳ Skipping refresh (already refreshing): {Path(file_path).name}")
            return
            
        last_refresh_time = current_time
        is_refreshing = True
        
        file_name = Path(file_path).name
        file_ext = Path(file_path).suffix
        print(f"\n🔄 Code file {change_type}: {file_name} ({file_ext})")
        
        try:
            # If it's a Python file, try to reload Nova AI
            if file_path.endswith('.py') and ('nova_ai' in file_path or 'core' in file_path):
                print("🐍 Nova AI code file detected - reloading module...")
                self.reload_nova_ai()
            
            # If it's a UI file, mention it
            if file_ext in ['.html', '.css', '.js']:
                print("🎨 UI code file detected - refreshing interface...")
            
            # Refresh the webview
            self.refresh_webview()
            
        except Exception as e:
            print(f"⚠️ Error handling file change: {e}")
        finally:
            is_refreshing = False
    
    def reload_nova_ai(self):
        """Attempt to reload Nova AI module"""
        try:
            print("🔄 Reloading Nova AI module...")
            
            # Clear the module from cache
            modules_to_reload = []
            for module_name in list(sys.modules.keys()):
                if 'nova_ai' in module_name or 'core' in module_name:
                    modules_to_reload.append(module_name)
            
            for module_name in modules_to_reload:
                if module_name in sys.modules:
                    del sys.modules[module_name]
            
            # Reimport and reinitialize
            global nova_ai
            from core.nova_ai import AleChatBot
            nova_ai = AleChatBot()
            print("✅ Nova AI reloaded successfully")
            
        except Exception as e:
            print(f"⚠️ Failed to reload Nova AI: {e}")
            print("💡 You may need to restart the application for changes to take effect")
    
    def refresh_webview(self):
        """Refresh the webview window"""
        if self.webview_window:
            try:
                # Use a small delay to ensure file changes are complete
                threading.Timer(0.3, self._do_refresh).start()
            except Exception as e:
                print(f"⚠️ Failed to refresh webview: {e}")
    
    def _do_refresh(self):
        """Actually perform the refresh - Browser-based version"""
        try:
            print("🔄 Browser-based refresh: Please manually refresh your browser (F5 or Ctrl+R)")
            print("💡 Auto-refresh is not available in browser mode")
        except Exception as e:
            print(f"⚠️ Error during refresh: {e}")

def setup_file_watcher(webview_window):
    """Set up file system watcher"""
    global file_watcher
    
    try:
        # Get paths to watch - only watch specific directories
        current_dir = Path(__file__).parent.parent
        paths_to_watch = [
            current_dir / 'core',  # Nova AI core files
            current_dir / 'ui',    # UI files
        ]
        
        # Create handler
        handler = CodeChangeHandler(webview_window)
        
        # Create observer
        observer = Observer()
        
        # Add watchers for each path
        for path in paths_to_watch:
            if path.exists():
                observer.schedule(handler, str(path), recursive=True)
                print(f"👁️ Watching: {path}")
                print(f"   📋 Watching specific files: {', '.join(handler.watch_specific_files)}")
            else:
                print(f"⚠️ Path not found: {path}")
        
        # Start observer
        observer.start()
        file_watcher = observer
        
        print("🔍 File watcher started - auto-refresh enabled")
        print("💡 Auto-refresh will only trigger for code changes in:")
        print("   - nova_ai.py and core AI files")
        print("   - splash_screen.html and UI files")
        print("💡 Data files, logs, and temporary files are ignored")
        
        return observer
        
    except Exception as e:
        print(f"⚠️ Failed to setup file watcher: {e}")
        print(f"Error details: {type(e).__name__}: {str(e)}")
        print("💡 Make sure 'watchdog' is installed: pip install watchdog")
        return None

def get_free_port():
    """Get a free port on the system"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        s.listen(1)
        port = s.getsockname()[1]
    return port

def run_server(port, directory):
    """Run the HTTP server"""
    os.chdir(directory)
    httpd = HTTPServer(('127.0.0.1', port), SimpleHTTPRequestHandler)
    httpd.serve_forever()

# Initialize Nova AI chatbot
nova_ai = None

def initialize_nova_ai():
    """Initialize Nova AI chatbot"""
    global nova_ai
    try:
        nova_ai = AleChatBot()
        print("Nova AI initialized successfully")
        return True
    except Exception as e:
        print(f"Failed to initialize Nova AI: {e}")
        return False

# Create Flask app for API
app = Flask(__name__)
CORS(app)

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat messages from the frontend"""
    try:
        data = request.get_json()
        user_message = data.get('message', '')
        session_id = data.get('session_id', 'default')
        user_location = data.get('user_location', '')
        
        if not user_message:
            return jsonify({'error': 'No message provided'}), 400
        
        if not nova_ai:
            return jsonify({'error': 'Nova AI not initialized'}), 500
        
        # Get or create session chat history
        if session_id not in chat_histories:
            chat_histories[session_id] = []
        
        # Save user location if provided
        if user_location:
            user_locations[session_id] = user_location
            print(f"[LOCATION] Saved location for session {session_id}: {user_location}")
        
        # Use saved location if no location provided but we have one stored
        if not user_location and session_id in user_locations:
            user_location = user_locations[session_id]
            print(f"[LOCATION] Using saved location for session {session_id}: {user_location}")
        
        # For testing: Set Italy as default location if no location is set
        if not user_location:
            user_location = "Italy"
            user_locations[session_id] = user_location
            print(f"[LOCATION] Setting default location to Italy for session {session_id}")
        
        # Debug: Show current location status
        print(f"[DEBUG] Location status for session {session_id}:")
        print(f"  - Provided location: {user_location}")
        print(f"  - Saved locations: {user_locations}")
        print(f"  - Final location to use: {user_location}")
        
        # Skip heavy memory processing for faster responses
        relevant_memories = ""
        print(f"[SPEED] Skipping memory search for faster response")
        if False:  # Disable memory processing
            try:
                print(f"🔍 Searching memories for: '{user_message}'")
                memories = nova_ai.memory.retrieve_memories(user_message, limit=5)
                print(f"📚 Found {len(memories)} memories")
                
                if memories:
                    memory_texts = []
                    for memory in memories:
                        content = memory.get('content', 'No content')
                        memory_type = memory.get('memory_type', 'unknown').replace('_', ' ').title()
                        relevance = memory.get('relevance_score', 0.0)
                        print(f"  💭 Memory: {content[:50]}... (relevance: {relevance:.2f})")
                        
                        # Only include high-relevance memories
                        if relevance > 0.3:
                            memory_texts.append(f"[{memory_type}] {content}")
                    
                    if memory_texts:
                        relevant_memories = "🧠 Relevant past memories:\n" + "\n".join(f"• {mem}" for mem in memory_texts[:3])
                        print(f"✅ Using {len(memory_texts)} relevant memories in context")
                    else:
                        print("⚠️ No high-relevance memories found")
                else:
                    print("ℹ️ No memories found for this query")
            except Exception as e:
                print(f"Warning: Failed to retrieve memories: {e}")
        else:
            # Fallback: Use local conversation history as memory context
            try:
                print(f"💾 Memory system disabled, using local conversation history")
                # Load recent conversations from local storage
                if hasattr(nova_ai.files, 'ai_output_file') and nova_ai.files.ai_output_file.exists():
                    import json
                    with open(nova_ai.files.ai_output_file, 'r', encoding='utf-8') as f:
                        stored_conversations = json.load(f)
                    
                    # Simple keyword matching for relevant conversations
                    user_keywords = set(user_message.lower().split())
                    relevant_conversations = []
                    
                    for conv in stored_conversations[-20:]:  # Check last 20 conversations
                        if 'user' in conv and 'assistant' in conv:
                            conv_keywords = set(conv['user'].lower().split())
                            # Check for keyword overlap
                            if user_keywords.intersection(conv_keywords):
                                relevant_conversations.append(conv)
                    
                    if relevant_conversations:
                        memory_texts = []
                        for conv in relevant_conversations[-3:]:  # Use last 3 relevant
                            user_msg = conv.get('user', '')
                            ai_response = conv.get('assistant', '')
                            if user_msg and ai_response:
                                memory_texts.append(f"Previous: {user_msg} → {ai_response[:100]}...")
                        
                        if memory_texts:
                            relevant_memories = "🧠 Relevant past conversations:\n" + "\n".join(f"• {mem}" for mem in memory_texts[:2])
                            print(f"✅ Using {len(memory_texts)} past conversations as context")
                        
            except Exception as e:
                print(f"Warning: Failed to retrieve local conversation history: {e}")
        
        # Build messages with memory context (same as terminal mode)
        messages = nova_ai.chat_history + chat_histories[session_id]
        
        # Add system message about time display capabilities
        messages.append({
            "role": "system",
            "content": "You are running in a desktop UI with visual time display capabilities. When users ask for time, you have REAL-TIME access to current time information. Always provide actual current time, never say you don't have real-time access. The UI will automatically show a visual time display widget when you provide time information."
        })
        
        # Add memory context as a system message if we have relevant memories
        if relevant_memories:
            messages.append({
                "role": "system", 
                "content": f"Context from past conversations:\n{relevant_memories}\n\nUse this context naturally in your response if relevant to the current question."
            })
        
        # Add location context if available
        if user_location:
            messages.append({
                "role": "system",
                "content": f"User's current location: {user_location}. You have REAL-TIME access to current time information for any location. When users ask for time, provide the actual current time using your time functions. Use this location for time requests and location-based queries."
            })
        
        # Add the current user message
        messages.append({"role": "user", "content": user_message})
        
        # Get response from Nova AI (run async function in sync context)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            response = loop.run_until_complete(nova_ai.get_response(messages, stream_to_terminal=False))
        finally:
            loop.close()
        
        # Update session chat history (without system prompt, just like terminal mode)
        if response:
            chat_histories[session_id].extend([
                {"role": "user", "content": user_message},
                {"role": "assistant", "content": response}
            ])
            
            # Keep session history at reasonable size (same as terminal mode)
            if len(chat_histories[session_id]) > 20:  # 10 exchanges
                chat_histories[session_id] = chat_histories[session_id][-20:]
            
            # SAVE TO MEMORY JSON - This is CRITICAL for persistent storage
            try:
                print(f"[MEMORY] Saving conversation to nova_ai_memory.json...")
                
                # Create a simple memory save function that writes directly to JSON
                memory_file = Path(__file__).parent.parent / "Date" / "nova_ai_memory.json"
                memory_file.parent.mkdir(parents=True, exist_ok=True)
                
                # Load existing memory data
                memory_data = {}
                if memory_file.exists():
                    try:
                        with open(memory_file, 'r', encoding='utf-8') as f:
                            memory_data = json.load(f)
                    except:
                        memory_data = {}
                
                # Ensure conversation list exists
                if "conversation" not in memory_data:
                    memory_data["conversation"] = []
                
                # Add user message
                memory_data["conversation"].append({
                    "role": "user",
                    "content": user_message,
                    "timestamp": datetime.now().isoformat(),
                    "session_id": session_id
                })
                
                # Add AI response
                memory_data["conversation"].append({
                    "role": "assistant",
                    "content": response,
                    "timestamp": datetime.now().isoformat(),
                    "session_id": session_id
                })
                
                # Save back to file
                with open(memory_file, 'w', encoding='utf-8') as f:
                    json.dump(memory_data, f, indent=2, ensure_ascii=False)
                
                print(f"[MEMORY] Conversation saved to nova_ai_memory.json (Total messages: {len(memory_data.get('conversation', []))})")
                
                # Also store locally if files manager is available
                try:
                    nova_ai.files.store_conversation(user_message, response)
                except:
                    pass
                    
            except Exception as e:
                print(f"[ERROR] Failed to save conversation to memory: {e}")
                import traceback
                traceback.print_exc()
        
        return jsonify({'response': response})
        
    except Exception as e:
        import traceback
        print(f"Error in chat endpoint: {e}")
        print(f"Full traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/memory/status', methods=['GET'])
def memory_status():
    """Get memory system status and statistics"""
    try:
        if not nova_ai:
            return jsonify({'error': 'Nova AI not initialized'}), 500
            
        if not nova_ai.memory_enabled or not nova_ai.memory:
            return jsonify({
                'enabled': False,
                'status': 'Memory system disabled'
            })
        
        stats = nova_ai.memory.get_memory_stats()
        return jsonify({
            'enabled': True,
            'status': 'Memory system active',
            'stats': stats
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/memory/search', methods=['POST'])
def memory_search():
    """Search memories for debugging"""
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        if not query:
            return jsonify({'error': 'No query provided'}), 400
            
        if not nova_ai or not nova_ai.memory_enabled or not nova_ai.memory:
            return jsonify({'error': 'Memory system not available'}), 500
        
        memories = nova_ai.memory.retrieve_memories(query, limit=10)
        return jsonify({
            'query': query,
            'memories': memories,
            'count': len(memories)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/time', methods=['POST'])
def get_time():
    try:
        data = request.get_json()
        location = data.get('location', '')
        if not location:
            # Return server's local time
            from datetime import datetime
            now = datetime.now()
            return jsonify({'time': now.strftime('%I:%M %p')})
        # Use your get_time_in_location function from nova_ai.py
        from core.nova_ai import get_time_in_location
        time_str = get_time_in_location(location)
        # Extract just the time (e.g., "The current time in X is HH:MM")
        import re
        match = re.search(r'is (\d{1,2}:\d{2})', time_str)
        if match:
            return jsonify({'time': match.group(1)})
        else:
            return jsonify({'time': '--:--'})
    except Exception as e:
        return jsonify({'time': '--:--'})

@app.route('/api/refresh', methods=['POST'])
def manual_refresh():
    """Manual refresh endpoint for testing"""
    try:
        global webview_window
        if webview_window:
            webview_window.reload()
            return jsonify({'status': 'refreshed'})
        else:
            return jsonify({'error': 'No webview window available'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks"""
    try:
        if not nova_ai or not nova_ai.task_manager:
            return jsonify({'error': 'Task management not available'}), 500

        tasks = nova_ai.task_manager.get_all_tasks()
        task_data = [task.to_dict() for task in tasks]

        return jsonify({
            'tasks': task_data,
            'statistics': nova_ai.task_manager.get_task_statistics()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    try:
        if not nova_ai or not nova_ai.task_manager:
            return jsonify({'error': 'Task management not available'}), 500

        data = request.get_json()
        title = data.get('title', '')
        description = data.get('description', '')
        due_date_str = data.get('due_date', '')
        priority_str = data.get('priority', 'medium')
        tags = data.get('tags', [])

        if not title or not due_date_str:
            return jsonify({'error': 'Title and due_date are required'}), 400

        # Parse due date
        from datetime import datetime
        import pytz
        try:
            due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
            # Convert to Italy timezone
            italy_tz = pytz.timezone('Europe/Rome')
            due_date = due_date.astimezone(italy_tz)
        except ValueError:
            return jsonify({'error': 'Invalid due_date format'}), 400

        # Parse priority
        try:
            from core.task_management import TaskPriority
        except ImportError:
            from task_management import TaskPriority
        try:
            priority = TaskPriority(priority_str.lower())
        except ValueError:
            priority = TaskPriority.MEDIUM

        # Create task
        task = nova_ai.task_manager.create_task(
            title=title,
            description=description,
            due_date=due_date,
            priority=priority,
            tags=tags
        )

        return jsonify({
            'success': True,
            'task': task.to_dict(),
            'message': f'Task "{title}" created successfully'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    """Update a task"""
    try:
        if not nova_ai or not nova_ai.task_manager:
            return jsonify({'error': 'Task management not available'}), 500

        data = request.get_json()

        # Update task
        success = nova_ai.task_manager.update_task(task_id, **data)

        if success:
            task = nova_ai.task_manager.get_task(task_id)
            return jsonify({
                'success': True,
                'task': task.to_dict() if task else None,
                'message': 'Task updated successfully'
            })
        else:
            return jsonify({'error': 'Task not found'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<task_id>/complete', methods=['POST'])
def complete_task(task_id):
    """Mark a task as completed"""
    try:
        if not nova_ai or not nova_ai.task_manager:
            return jsonify({'error': 'Task management not available'}), 500

        success = nova_ai.task_manager.complete_task(task_id)

        if success:
            return jsonify({
                'success': True,
                'message': 'Task marked as completed'
            })
        else:
            return jsonify({'error': 'Task not found'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<task_id>/cancel', methods=['POST'])
def cancel_task(task_id):
    """Cancel a task"""
    try:
        if not nova_ai or not nova_ai.task_manager:
            return jsonify({'error': 'Task management not available'}), 500

        success = nova_ai.task_manager.cancel_task(task_id)

        if success:
            return jsonify({
                'success': True,
                'message': 'Task cancelled'
            })
        else:
            return jsonify({'error': 'Task not found'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task"""
    try:
        if not nova_ai or not nova_ai.task_manager:
            return jsonify({'error': 'Task management not available'}), 500

        success = nova_ai.task_manager.delete_task(task_id)

        if success:
            return jsonify({
                'success': True,
                'message': 'Task deleted'
            })
        else:
            return jsonify({'error': 'Task not found'}), 404

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vision/analyze', methods=['POST'])
def analyze_vision():
    """Analyze image with AI vision system"""
    try:
        if not nova_ai or not nova_ai.ai_vision:
            return jsonify({'error': 'AI vision system not available'}), 500

        data = request.get_json()
        image_data = data.get('image_data', '') or data.get('image', '')
        analysis_type = data.get('analysis_type', 'comprehensive')
        user_query = data.get('user_query', '') or data.get('prompt', '')
        auto_activated = data.get('auto_activated', False)

        if not image_data:
            return jsonify({'error': 'No image data provided'}), 400

        # Perform vision analysis
        import asyncio
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        try:
            analysis = loop.run_until_complete(
                nova_ai.ai_vision.analyze_frame(image_data, analysis_type, user_query)
            )

            # For auto-activated queries, enhance the response
            if auto_activated and user_query:
                # Create analysis data for conversational response
                analysis_data = {
                    'scene_description': analysis.scene_description,
                    'objects_detected': analysis.objects_detected,
                    'labels': [],
                    'text_detected': getattr(analysis, 'text_detected', ''),
                    'faces_detected': 0,
                    'landmarks': []
                }

                # Generate conversational response
                conversational_response = loop.run_until_complete(
                    nova_ai.ai_vision._generate_conversational_response(analysis_data, user_query)
                )

                # Update analysis response
                analysis.ai_response = conversational_response

            return jsonify({
                'success': True,
                'analysis': {
                    'id': analysis.id,
                    'scene_description': analysis.scene_description,
                    'objects_detected': analysis.objects_detected,
                    'ai_response': analysis.ai_response,
                    'confidence_scores': analysis.confidence_scores,
                    'timestamp': analysis.timestamp.isoformat(),
                    'auto_activated': auto_activated,
                    'analysis_type': analysis_type
                }
            })
        finally:
            loop.close()

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vision/history', methods=['GET'])
def get_vision_history():
    """Get vision analysis history"""
    try:
        if not nova_ai or not nova_ai.ai_vision:
            return jsonify({'error': 'AI vision system not available'}), 500

        limit = request.args.get('limit', 10, type=int)
        history = nova_ai.ai_vision.get_vision_history(limit)

        history_data = []
        for analysis in history:
            history_data.append({
                'id': analysis.id,
                'timestamp': analysis.timestamp.isoformat(),
                'scene_description': analysis.scene_description,
                'objects_detected': len(analysis.objects_detected),
                'analysis_type': analysis.analysis_type
            })

        return jsonify({
            'success': True,
            'history': history_data,
            'total_count': len(history)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vision/statistics', methods=['GET'])
def get_vision_statistics():
    """Get vision system statistics"""
    try:
        if not nova_ai or not nova_ai.ai_vision:
            return jsonify({'error': 'AI vision system not available'}), 500

        stats = nova_ai.ai_vision.get_vision_statistics()

        return jsonify({
            'success': True,
            'statistics': stats
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get system status"""
    try:
        task_manager_available = nova_ai and nova_ai.task_manager is not None
        task_stats = nova_ai.task_manager.get_task_statistics() if task_manager_available else {}

        vision_available = nova_ai and nova_ai.ai_vision is not None
        vision_stats = nova_ai.ai_vision.get_vision_statistics() if vision_available else {}

        return jsonify({
            'status': 'running',
            'nova_ai_initialized': nova_ai is not None,
            'file_watcher_active': file_watcher is not None and file_watcher.is_alive() if file_watcher else False,
            'browser_mode': True,
            'ui_mode': 'browser',
            'task_management_available': task_manager_available,
            'task_statistics': task_stats,
            'ai_vision_available': vision_available,
            'vision_statistics': vision_stats
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def run_api_server(port):
    """Run the Flask API server"""
    app.run(host='127.0.0.1', port=port, debug=False, use_reloader=False)

def cleanup_on_exit():
    """Clean up resources on exit"""
    global file_watcher
    logger.info("Cleaning up resources...")
    if file_watcher:
        logger.info("Stopping file watcher...")
        try:
            file_watcher.stop()
            file_watcher.join(timeout=2)
            logger.info("File watcher stopped")
        except Exception as e:
            logger.error(f"Error stopping file watcher: {e}")

def signal_handler(sig, frame):
    """Handle termination signals for graceful shutdown"""
    logger.info("Received termination signal. Shutting down gracefully...")
    cleanup_on_exit()
    sys.exit(0)

# Register signal handlers for graceful shutdown
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

def main():
    print("🚀 Starting Nova AI Desktop Interface (Browser Mode)...")

    # Check for required dependencies
    try:
        import watchdog
        print("✅ watchdog library found")
    except ImportError:
        print("❌ watchdog library not found. Installing...")
        try:
            import subprocess
            subprocess.check_call([sys.executable, "-m", "pip", "install", "watchdog"])
            print("✅ watchdog installed successfully")
        except Exception as e:
            print(f"❌ Failed to install watchdog: {e}")
            print("💡 Please install manually: pip install watchdog")
            return
    
    # Initialize Nova AI first
    if not initialize_nova_ai():
        print("❌ Failed to start Nova AI. Please check your xxxxxKEY environment variable.")
        return
    
    # Get the path to the UI directory containing splash_screen.html
    current_dir = Path(__file__).parent.parent
    ui_dir = current_dir / 'ui'
    
    if not ui_dir.exists():
        print(f"❌ UI directory not found: {ui_dir}")
        return
    
    # Get free ports for both servers
    ui_port = get_free_port()
    api_port = get_free_port()
    
    print(f"🌐 Starting UI server on port {ui_port}")
    print(f"🔌 Starting API server on port {api_port}")
    
    # Start the UI server in a separate thread
    ui_server_thread = threading.Thread(
        target=run_server, 
        args=(ui_port, ui_dir),
        daemon=True
    )
    ui_server_thread.start()
    
    # Start the API server in a separate thread
    api_server_thread = threading.Thread(
        target=run_api_server,
        args=(api_port,),
        daemon=True
    )
    api_server_thread.start()
    
    # Wait a moment for servers to start
    time.sleep(2)
    
    print("✅ All servers started successfully!")
    print("🖥️ Opening Nova AI interface...")
    
    # Open in default browser instead of webview
    url = f'http://127.0.0.1:{ui_port}/splash_screen.html?api_port={api_port}'
    print(f"🌐 Opening Nova AI interface in your default browser...")
    print(f"🔗 URL: {url}")

    try:
        webbrowser.open(url)
        print("✅ Browser opened successfully!")
    except Exception as e:
        print(f"⚠️ Could not open browser automatically: {e}")
        print(f"💡 Please manually open this URL in your browser: {url}")

    global webview_window
    webview_window = None  # No webview window in browser mode
    
    # Set up file watcher after window is created (with delay to ensure window is ready)
    def setup_watcher_delayed():
        time.sleep(3)  # Wait for webview to fully initialize
        print("🔍 Setting up file watcher...")
        watcher = setup_file_watcher(webview_window)
        if watcher:
            print("✅ File watcher setup complete")
        else:
            print("⚠️ File watcher setup failed - auto-refresh disabled")
    
    watcher_thread = threading.Thread(target=setup_watcher_delayed, daemon=True)
    watcher_thread.start()
    
    # Register cleanup function
    import atexit
    atexit.register(cleanup_on_exit)
    
    print("\n" + "="*60)
    print("🚀 Nova AI Desktop Interface Ready! (Browser Mode)")
    print("🌐 Interface opened in your default browser")
    print("🔄 File watching enabled - modify code files to see changes")
    print("👁️ Watching for changes in:")
    print("   - core/ (Nova AI core files)")
    print("   - ui/ (HTML/CSS/JS files)")
    print("💡 File watcher monitors:")
    print("   - nova_ai.py and core AI files")
    print("   - splash_screen.html and UI files")
    print("💡 Data files, logs, and temporary files are ignored")
    print("🔧 Manual refresh: Refresh your browser (F5 or Ctrl+R)")
    print("📊 Status available at: GET /api/status")
    print("="*60 + "\n")
    
    try:
        print("🚀 Nova AI Desktop Interface is now running!")
        print("💡 Keep this terminal window open to maintain the servers")
        print("🔄 Press Ctrl+C to stop the servers and exit")

        # Keep the servers running
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n🛑 Shutting down...")
    except Exception as e:
        print(f"\n❌ Error in main loop: {e}")
    finally:
        cleanup_on_exit()

if __name__ == '__main__':
    main()