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
from flask import Flask, request, jsonify, session
try:
    from flask_cors import CORS
except ImportError:
    print("❌ 'flask-cors' not found. Attempting to install (pip install flask-cors)...")
    try:
        import subprocess as _subprocess, sys as _sys
        _subprocess.check_call([_sys.executable, "-m", "pip", "install", "flask-cors"])
        from flask_cors import CORS
        print("✅ 'flask-cors' installed and imported successfully")
    except Exception as _e:
        print(f"❌ Failed to install 'flask-cors': {_e}")
        raise
import uuid
import time
from datetime import datetime
try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError:
    print("❌ 'watchdog' not found. Attempting to install (pip install watchdog)...")
    try:
        import subprocess as _subprocess, sys as _sys
        _subprocess.check_call([_sys.executable, "-m", "pip", "install", "watchdog"])
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler
        print("✅ 'watchdog' installed and imported successfully")
    except Exception as _e:
        print(f"❌ Failed to install 'watchdog': {_e}")
        raise
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
# Import EnhancedNovaAI first, then fallback to AleChatBot if needed
try:
    from core.enhanced_nova_ai import EnhancedNovaAI
    ENHANCED_NOVA_AVAILABLE = True
except ImportError:
    ENHANCED_NOVA_AVAILABLE = False
    EnhancedNovaAI = None

# Import basic Nova AI as fallback
try:
    from core.nova_ai import AleChatBot
    ALE_CHAT_BOT_AVAILABLE = True
except ImportError:
    ALE_CHAT_BOT_AVAILABLE = False
    AleChatBot = None

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
        global nova_ai  # Declare global at the beginning of the function
        
        try:
            print("🔄 Reloading Nova AI module...")
            
            # Clear the module from cache
            modules_to_reload = []
            for module_name in list(sys.modules.keys()):
                if 'nova_ai' in module_name or 'core' in module_name or 'enhanced_nova_ai' in module_name:
                    modules_to_reload.append(module_name)
            
            for module_name in modules_to_reload:
                if module_name in sys.modules:
                    del sys.modules[module_name]
            
            # Initialize configuration
            config = {
                'search_api_key': os.getenv('GROQ_API_KEY', 'your_api_key_here'),
                'search_base_url': os.getenv('SEARCH_BASE_URL', 'https://api.search.example.com'),
                'openweather_api_key': os.getenv('OPENWEATHER_API_KEY', 'your_openweather_api_key_here')
            }
            
            # Try EnhancedNovaAI first if available
            if ENHANCED_NOVA_AVAILABLE and EnhancedNovaAI:
                try:
                    # Reimport and reinitialize with EnhancedNovaAI
                    from core.enhanced_nova_ai import EnhancedNovaAI
                    nova_ai = EnhancedNovaAI(config)
                    print("✅ Enhanced Nova AI reloaded successfully")
                except Exception as e:
                    print(f"⚠️ Failed to reload Enhanced Nova AI: {e}")
                    # Fallback to basic Nova AI if EnhancedNovaAI fails
                    if ALE_CHAT_BOT_AVAILABLE and AleChatBot:
                        try:
                            from core.nova_ai import AleChatBot
                            nova_ai = AleChatBot()
                            print("✅ Fallback Nova AI reloaded successfully")
                        except Exception as fallback_e:
                            print(f"⚠️ Fallback also failed: {fallback_e}")
            else:
                # Fallback to AleChatBot if EnhancedNovaAI is not available
                if ALE_CHAT_BOT_AVAILABLE and AleChatBot:
                    try:
                        from core.nova_ai import AleChatBot
                        nova_ai = AleChatBot()
                        print("✅ Fallback Nova AI reloaded successfully")
                    except Exception as fallback_e:
                        print(f"⚠️ Fallback failed: {fallback_e}")
                        
        except Exception as e:
            print(f"⚠️ Error reloading Nova AI: {e}")
    
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
    """Initialize Enhanced Nova AI chatbot with fallback options"""
    global nova_ai
    try:
        # Initialize configuration for EnhancedNovaAI
        config = {
            'search_api_key': os.getenv('GROQ_API_KEY', 'your_api_key_here'),
            'search_base_url': os.getenv('SEARCH_BASE_URL', 'https://api.search.example.com'),
            'openweather_api_key': os.getenv('OPENWEATHER_API_KEY', 'your_openweather_api_key_here')
        }
        
        # Try EnhancedNovaAI first if available
        if ENHANCED_NOVA_AVAILABLE and EnhancedNovaAI:
            try:
                # Initialize EnhancedNovaAI with configuration
                nova_ai = EnhancedNovaAI(config)
                print("Enhanced Nova AI initialized successfully")
                return True
            except Exception as e:
                print(f"Failed to initialize EnhancedNovaAI: {e}")
                print("Falling back to basic AleChatBot...")
        
        # Fallback to AleChatBot if EnhancedNovaAI fails or is not available
        if ALE_CHAT_BOT_AVAILABLE and AleChatBot:
            try:
                # Initialize basic AleChatBot
                nova_ai = AleChatBot()
                print("Basic AleChatBot initialized successfully")
                return True
            except Exception as e:
                print(f"Failed to initialize AleChatBot: {e}")
                return False
        else:
            print("Neither EnhancedNovaAI nor AleChatBot is available")
            return False
            
    except Exception as e:
        print(f"Error in initialize_nova_ai: {e}")
        import traceback
        traceback.print_exc()
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
        
        # Determine which AI system to use based on available methods
        if hasattr(nova_ai, 'process_message'):
            # Use EnhancedNovaAI's process_message method which handles all enhanced features
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                response = loop.run_until_complete(nova_ai.process_message(user_message))
            finally:
                loop.close()
        else:
            # For basic AleChatBot, we need to call get_response method which is async
            # Create a new event loop to call the async method
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                # Prepare messages for basic AI
                if hasattr(nova_ai, 'chat_history'):
                    messages = nova_ai.chat_history + [{"role": "user", "content": user_message}]
                else:
                    messages = [{"role": "user", "content": user_message}]
                
                response = loop.run_until_complete(nova_ai.get_response(messages, stream_to_terminal=False))
            except Exception as e:
                print(f"Error calling AleChatBot get_response: {e}")
                response = "I'm experiencing technical difficulties. Please try again later."
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
            
            # Store conversation using appropriate memory system
            try:
                # Check if using EnhancedNovaAI
                if hasattr(nova_ai, 'vector_memory'):
                    # Store in EnhancedNovaAI's memory system
                    if hasattr(nova_ai.vector_memory, 'add_memory'):
                        nova_ai.vector_memory.add_memory(
                            text=f"User: {user_message}\nAssistant: {response}",
                            metadata={
                                'timestamp': datetime.now().isoformat(),
                                'conversation_turn': len(chat_histories[session_id]) // 2,
                                'session_id': session_id
                            }
                        )
                        print(f"[SPEED] Conversation stored using EnhancedNovaAI memory system")
                else:
                    # For basic AleChatBot, try to use its memory system if available
                    if hasattr(nova_ai, 'files') and hasattr(nova_ai.files, 'store_conversation'):
                        # Store using basic Nova AI's file system
                        nova_ai.files.store_conversation(user_message, response)
                        print(f"[SPEED] Conversation stored using basic Nova AI file system")
                    elif hasattr(nova_ai, 'memory') and hasattr(nova_ai.memory, 'store_memory'):
                        # Store using basic memory system
                        from core.nova_ai import MemoryType  # Import the enum from nova_ai
                        nova_ai.memory.store_memory(
                            content=f"User: {user_message}\nAssistant: {response}",
                            memory_type=MemoryType.CONVERSATION_SUMMARY,
                            topic="general",
                            metadata={
                                'session_id': session_id,
                                'timestamp': datetime.now().isoformat()
                            }
                        )
                        print(f"[SPEED] Conversation stored using basic memory system")
                    else:
                        print(f"[SPEED] Conversation not stored - no storage method available")
            except Exception as e:
                print(f"Warning: Failed to store conversation: {e}")
        
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
        
        # Check if EnhancedNovaAI is being used
        if hasattr(nova_ai, 'vector_memory'):
            # EnhancedNovaAI has vector and semantic memory
            stats = {
                'enabled': True,
                'status': 'Enhanced memory system active',
                'vector_memory_count': len(getattr(nova_ai.vector_memory, 'memory_store', [])) if hasattr(nova_ai.vector_memory, 'memory_store') else 0,
                'semantic_memory_count': len(getattr(nova_ai.semantic_memory, 'concepts', [])) if hasattr(nova_ai.semantic_memory, 'concepts') else 0,
                'conversation_summary': nova_ai.get_conversation_summary() if hasattr(nova_ai, 'get_conversation_summary') else {}
            }
            return jsonify(stats)
        else:
            # For basic AleChatBot - check memory attributes
            if hasattr(nova_ai, 'memory_enabled') and nova_ai.memory_enabled and hasattr(nova_ai, 'memory') and nova_ai.memory:
                stats = nova_ai.memory.get_memory_stats()
                return jsonify({
                    'enabled': True,
                    'status': 'Memory system active',
                    'stats': stats
                })
            elif hasattr(nova_ai, 'mem0_memory_agent') and nova_ai.mem0_memory_agent:
                # Use mem0 memory agent if available
                try:
                    profile = nova_ai.mem0_memory_agent.get_user_profile()
                    return jsonify({
                        'enabled': True,
                        'status': 'Mem0 memory system active',
                        'stats': {
                            'user_info': profile.get('user_info', {}),
                            'facts': len(profile.get('facts', {})),
                            'total_memories': len(profile.get('memories', [])) if 'memories' in profile else 0
                        }
                    })
                except Exception:
                    pass
            
            # If no memory system is available
            return jsonify({
                'enabled': False,
                'status': 'Memory system disabled'
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
            
        if not nova_ai:
            return jsonify({'error': 'Nova AI not available'}), 500
        
        # Check if EnhancedNovaAI is being used
        if hasattr(nova_ai, 'vector_memory'):
            # Use EnhancedNovaAI's memory search capabilities
            try:
                # Search in vector memory
                vector_memories = nova_ai.vector_memory.search_memory(query, limit=10) if hasattr(nova_ai.vector_memory, 'search_memory') else []
                
                # Search in semantic memory
                semantic_memories = nova_ai.semantic_memory.search_concepts(query) if hasattr(nova_ai.semantic_memory, 'search_concepts') else []
                
                return jsonify({
                    'query': query,
                    'vector_memories': vector_memories,
                    'semantic_memories': semantic_memories,
                    'count': len(vector_memories) + len(semantic_memories)
                })
            except Exception as e:
                print(f"Enhanced memory search failed: {e}")
                # Fallback to basic memory search if EnhancedNovaAI memory search fails
                pass
        
        # For basic AleChatBot, try different memory systems
        if hasattr(nova_ai, 'memory') and nova_ai.memory:
            # Use basic memory system
            memories = nova_ai.memory.retrieve_memories(query, limit=10)
            return jsonify({
                'query': query,
                'memories': memories,
                'count': len(memories)
            })
        elif hasattr(nova_ai, 'mem0_memory_agent') and nova_ai.mem0_memory_agent:
            # Use mem0 memory system
            try:
                result = nova_ai.mem0_memory_agent.get_memory_context(query)
                return jsonify({
                    'query': query,
                    'memories': result.get('memories', []),
                    'count': len(result.get('memories', []))
                })
            except Exception as e:
                print(f"Mem0 memory search failed: {e}")
        
        # If no memory system is available
        return jsonify({'error': 'Memory system not available'}), 500
        
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
        # Use get_time_in_location function - try different import paths
        get_time_in_location = None
        
        # Try different import paths
        try:
            from core.nova_ai import get_time_in_location
        except ImportError:
            try:
                from astra_ai.core.nova_ai import get_time_in_location
            except ImportError:
                try:
                    # Define a simple fallback if import fails
                    def get_time_in_location(location):
                        from datetime import datetime
                        return f"The current time in {location} is {datetime.now().strftime('%H:%M')}."
                except:
                    def get_time_in_location(location):
                        from datetime import datetime
                        return f"The current time in {location} is {datetime.now().strftime('%H:%M')}."

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
        # Check if task management is available in Nova AI instance
        if not nova_ai:
            return jsonify({'error': 'Nova AI not initialized'}), 500
            
        if not hasattr(nova_ai, 'task_manager') or not nova_ai.task_manager:
            return jsonify({'error': 'Task management not available'}), 500

        tasks = nova_ai.task_manager.get_all_tasks()
        # Convert tasks to dictionaries
        task_data = []
        for task in tasks:
            if hasattr(task, 'to_dict'):
                task_data.append(task.to_dict())
            else:
                # Build task data manually if to_dict method doesn't exist
                task_dict = {
                    'id': getattr(task, 'id', str(uuid.uuid4())),
                    'title': getattr(task, 'title', 'Unknown'),
                    'description': getattr(task, 'description', ''),
                    'status': getattr(task, 'status', 'pending'),
                    'due_date': getattr(task, 'due_date', None),
                    'priority': getattr(task, 'priority', 'medium'),
                    'tags': getattr(task, 'tags', []),
                    'created_at': getattr(task, 'created_at', datetime.now().isoformat())
                }
                if task_dict['due_date']:
                    task_dict['due_date'] = task_dict['due_date'].isoformat()
                if isinstance(task_dict['created_at'], datetime):
                    task_dict['created_at'] = task_dict['created_at'].isoformat()
                task_data.append(task_dict)

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
        if not nova_ai or not hasattr(nova_ai, 'task_manager') or not nova_ai.task_manager:
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
            try:
                from task_management import TaskPriority
            except ImportError:
                # Create a simple enum-like structure if import fails
                class TaskPriority:
                    LOW = 'low'
                    MEDIUM = 'medium' 
                    HIGH = 'high'
                    URGENT = 'urgent'
                    
                priority_map = {
                    'low': TaskPriority.LOW,
                    'medium': TaskPriority.MEDIUM,
                    'high': TaskPriority.HIGH,
                    'urgent': TaskPriority.URGENT
                }
                priority = priority_map.get(priority_str.lower(), TaskPriority.MEDIUM)
            else:
                try:
                    priority = TaskPriority(priority_str.lower())
                except ValueError:
                    priority = TaskPriority.MEDIUM
        else:
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

        # Return task data
        if hasattr(task, 'to_dict'):
            task_data = task.to_dict()
        else:
            # Build task data manually
            task_data = {
                'id': getattr(task, 'id', str(uuid.uuid4())),
                'title': getattr(task, 'title', title),
                'description': getattr(task, 'description', description),
                'status': getattr(task, 'status', 'pending'),
                'due_date': getattr(task, 'due_date', due_date).isoformat() if hasattr(task, 'due_date') and task.due_date else due_date.isoformat(),
                'priority': getattr(task, 'priority', priority_str),
                'tags': getattr(task, 'tags', tags),
                'created_at': datetime.now().isoformat()
            }

        return jsonify({
            'success': True,
            'task': task_data,
            'message': f'Task "{title}" created successfully'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/tasks/<task_id>', methods=['PUT'])
def update_task(task_id):
    """Update a task"""
    try:
        if not nova_ai or not hasattr(nova_ai, 'task_manager') or not nova_ai.task_manager:
            return jsonify({'error': 'Task management not available'}), 500

        data = request.get_json()

        # Update task
        success = nova_ai.task_manager.update_task(task_id, **data)

        if success:
            task = nova_ai.task_manager.get_task(task_id)
            if task:
                if hasattr(task, 'to_dict'):
                    task_data = task.to_dict()
                else:
                    # Build task data manually
                    task_data = {
                        'id': getattr(task, 'id', task_id),
                        'title': getattr(task, 'title', ''),
                        'description': getattr(task, 'description', ''),
                        'status': getattr(task, 'status', 'pending'),
                        'due_date': getattr(task, 'due_date', None),
                        'priority': getattr(task, 'priority', 'medium'),
                        'tags': getattr(task, 'tags', []),
                    }
                    if task_data['due_date'] and hasattr(task_data['due_date'], 'isoformat'):
                        task_data['due_date'] = task_data['due_date'].isoformat()
            else:
                task_data = None
                
            return jsonify({
                'success': True,
                'task': task_data,
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
        if not nova_ai or not hasattr(nova_ai, 'task_manager') or not nova_ai.task_manager:
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
        # Check if AI vision is available
        if not nova_ai:
            return jsonify({'error': 'Nova AI not initialized'}), 500
            
        if not hasattr(nova_ai, 'ai_vision') or not nova_ai.ai_vision:
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
                    'scene_description': getattr(analysis, 'scene_description', ''),
                    'objects_detected': getattr(analysis, 'objects_detected', []),
                    'labels': getattr(analysis, 'labels', []),
                    'text_detected': getattr(analysis, 'text_detected', ''),
                    'faces_detected': getattr(analysis, 'faces_detected', 0),
                    'landmarks': getattr(analysis, 'landmarks', [])
                }

                # Generate conversational response
                if hasattr(nova_ai.ai_vision, '_generate_conversational_response'):
                    conversational_response = loop.run_until_complete(
                        nova_ai.ai_vision._generate_conversational_response(analysis_data, user_query)
                    )
                    # Update analysis response
                    analysis.ai_response = conversational_response
                else:
                    # Fallback - just return the basic ai_response from analysis
                    pass

            # Create response data, handling cases where attributes may not exist
            response_data = {
                'success': True,
                'analysis': {
                    'id': getattr(analysis, 'id', str(uuid.uuid4())),
                    'scene_description': getattr(analysis, 'scene_description', ''),
                    'objects_detected': getattr(analysis, 'objects_detected', []),
                    'ai_response': getattr(analysis, 'ai_response', 'Analysis completed'),
                    'confidence_scores': getattr(analysis, 'confidence_scores', {}),
                    'timestamp': getattr(analysis, 'timestamp', datetime.now()).isoformat(),
                    'auto_activated': auto_activated,
                    'analysis_type': analysis_type
                }
            }

            return jsonify(response_data)
            
        finally:
            loop.close()

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/vision/history', methods=['GET'])
def get_vision_history():
    """Get vision analysis history"""
    try:
        if not nova_ai or not hasattr(nova_ai, 'ai_vision') or not nova_ai.ai_vision:
            return jsonify({'error': 'AI vision system not available'}), 500

        limit = request.args.get('limit', 10, type=int)
        
        # Check if the vision system has the required method
        if not hasattr(nova_ai.ai_vision, 'get_vision_history'):
            return jsonify({'error': 'Vision history not available'}), 500
            
        history = nova_ai.ai_vision.get_vision_history(limit)

        history_data = []
        for analysis in history:
            history_data.append({
                'id': getattr(analysis, 'id', str(uuid.uuid4())),
                'timestamp': getattr(getattr(analysis, 'timestamp', datetime.now()), 'isoformat', lambda: datetime.now().isoformat())(),
                'scene_description': getattr(analysis, 'scene_description', ''),
                'objects_detected': len(getattr(analysis, 'objects_detected', [])),
                'analysis_type': getattr(analysis, 'analysis_type', 'unknown')
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
        if not nova_ai or not hasattr(nova_ai, 'ai_vision') or not nova_ai.ai_vision:
            return jsonify({'error': 'AI vision system not available'}), 500

        # Check if the vision system has the required method
        if not hasattr(nova_ai.ai_vision, 'get_vision_statistics'):
            return jsonify({'error': 'Vision statistics not available'}), 500
            
        stats = nova_ai.ai_vision.get_vision_statistics()

        return jsonify({
            'success': True,
            'statistics': stats
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ================ ENHANCEDNOVAI SPECIALIZED ENDPOINTS ================

@app.route('/api/weather', methods=['POST'])
def get_weather():
    """Get weather information using Nova AI's weather service"""
    try:
        if not nova_ai:
            return jsonify({'error': 'Nova AI not initialized'}), 500

        # Check if weather service is available
        if not hasattr(nova_ai, 'weather_service') or not nova_ai.weather_service:
            return jsonify({'error': 'Weather service not available'}), 500

        data = request.get_json()
        location = data.get('location', 'New York')
        
        if not location:
            return jsonify({'error': 'Location is required'}), 400

        # Get weather data using weather service
        try:
            weather_data = nova_ai.weather_service.get_weather(location)
        except AttributeError:
            # If get_weather method doesn't exist, try get_comprehensive_weather_data
            if hasattr(nova_ai.weather_service, 'get_comprehensive_weather_data'):
                weather_data = nova_ai.weather_service.get_comprehensive_weather_data(location)
            else:
                return jsonify({'error': 'Weather service method not available'}), 500
        
        if isinstance(weather_data, dict) and 'error' in weather_data:
            return jsonify({'error': weather_data['error']}), 500

        return jsonify({
            'location': location,
            'weather': weather_data
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/forecast', methods=['POST'])
def get_forecast():
    """Get weather forecast using EnhancedNovaAI's weather service"""
    try:
        if not nova_ai:
            return jsonify({'error': 'Nova AI not initialized'}), 500

        # Check if EnhancedNovaAI with weather service is available
        if not hasattr(nova_ai, 'weather_service'):
            return jsonify({'error': 'Weather forecast service not available'}), 500

        data = request.get_json()
        location = data.get('location', 'New York')
        
        if not location:
            return jsonify({'error': 'Location is required'}), 400

        # Get forecast data
        forecast_data = nova_ai.weather_service.get_forecast(location)
        
        if 'error' in forecast_data:
            return jsonify({'error': forecast_data['error']}), 500

        return jsonify({
            'location': location,
            'forecast': forecast_data
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/news', methods=['POST'])
def get_news():
    """Get news summary using Nova AI's news service"""
    try:
        if not nova_ai:
            return jsonify({'error': 'Nova AI not initialized'}), 500

        # Check if news service is available
        news_service = None
        if hasattr(nova_ai, 'news_system') and nova_ai.news_system:
            news_service = nova_ai.news_system
        elif hasattr(nova_ai, 'enhanced_news_system') and nova_ai.enhanced_news_system:
            news_service = nova_ai.enhanced_news_system
        elif hasattr(nova_ai, 'news_service') and nova_ai.news_service:
            news_service = nova_ai.news_service
        else:
            return jsonify({'error': 'News service not available'}), 500

        data = request.get_json()
        query = data.get('query', 'latest news')
        
        if not query:
            return jsonify({'error': 'Query is required'}), 400

        # Get news summary - try different approaches based on the news system available
        try:
            if hasattr(news_service, 'get_news_summary'):
                news_result = news_service.get_news_summary(
                    query=query,
                    allow_source_selection=False  # Disable interactive selection for API
                )
            elif hasattr(news_service, 'get_conversational_news'):
                # For EnhancedNewsSystem
                news_result = news_service.get_conversational_news(query)
                # Format the result to match expected structure
                if isinstance(news_result, str):
                    news_result = {'summary': news_result, 'query': query}
            else:
                return jsonify({'error': 'News service method not available'}), 500
        except Exception as e:
            return jsonify({'error': f'Error retrieving news: {str(e)}'}), 500
        
        if not news_result or (isinstance(news_result, dict) and 'summary' not in news_result and not str(news_result).strip()):
            return jsonify({'error': 'No news found'}), 404

        return jsonify({
            'query': query,
            'news': news_result
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/features', methods=['GET'])
def get_available_features():
    """Get available features of the EnhancedNovaAI system"""
    try:
        if not nova_ai:
            return jsonify({'error': 'Nova AI not initialized'}), 500

        # Determine which features are available
        features = {
            'basic_chat': True,
            'weather_service': hasattr(nova_ai, 'weather_service'),
            'news_service': hasattr(nova_ai, 'news_system'),
            'sentiment_analysis': hasattr(nova_ai, 'sentiment_analyzer'),
            'vector_memory': hasattr(nova_ai, 'vector_memory'),
            'semantic_memory': hasattr(nova_ai, 'semantic_memory'),
            'search_capability': hasattr(nova_ai, 'search_client'),
            'context_management': hasattr(nova_ai, 'context_manager'),
            'response_generation': hasattr(nova_ai, 'response_generator')
        }

        return jsonify({
            'features': features,
            'enhanced_nova_ai': hasattr(nova_ai, 'process_message')
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get system status"""
    try:
        # Determine which AI system is being used
        is_enhanced = False
        enhanced_features = {}
        
        if nova_ai:
            # Check if this is EnhancedNovaAI
            is_enhanced = hasattr(nova_ai, 'process_message') and hasattr(nova_ai, 'vector_memory')
            
            if is_enhanced:
                # EnhancedNovaAI specific features
                enhanced_features = {
                    'weather_service_available': hasattr(nova_ai, 'weather_service'),
                    'news_service_available': hasattr(nova_ai, 'news_system'),
                    'sentiment_analysis_available': hasattr(nova_ai, 'sentiment_analyzer'),
                    'vector_memory_available': hasattr(nova_ai, 'vector_memory'),
                    'semantic_memory_available': hasattr(nova_ai, 'semantic_memory'),
                    'search_available': hasattr(nova_ai, 'search_client'),
                    'conversation_summary': nova_ai.get_conversation_summary() if hasattr(nova_ai, 'get_conversation_summary') else {}
                }
        
        # Check for task management (works with both systems)
        task_manager_available = False
        task_stats = {}
        if nova_ai and hasattr(nova_ai, 'task_manager') and nova_ai.task_manager:
            try:
                task_manager_available = True
                task_stats = nova_ai.task_manager.get_task_statistics()
            except:
                task_manager_available = False

        # Check for vision system (works with both systems)
        vision_available = False
        vision_stats = {}
        if nova_ai and hasattr(nova_ai, 'ai_vision') and nova_ai.ai_vision:
            try:
                vision_available = True
                if hasattr(nova_ai.ai_vision, 'get_vision_statistics'):
                    vision_stats = nova_ai.ai_vision.get_vision_statistics()
            except:
                vision_available = False

        # Check for memory system (works with both systems) 
        memory_available = False
        memory_status = {}
        if nova_ai:
            if (hasattr(nova_ai, 'memory') and nova_ai.memory) or (hasattr(nova_ai, 'mem0_memory_agent') and nova_ai.mem0_memory_agent):
                memory_available = True
                try:
                    if hasattr(nova_ai, 'memory') and nova_ai.memory:
                        memory_status = nova_ai.memory.get_memory_stats()
                    elif hasattr(nova_ai, 'mem0_memory_agent') and nova_ai.mem0_memory_agent:
                        profile = nova_ai.mem0_memory_agent.get_user_profile()
                        memory_status = {
                            'user_info': profile.get('user_info', {}),
                            'facts_count': len(profile.get('facts', {})),
                            'memories_count': len(profile.get('memories', [])) if 'memories' in profile else 0
                        }
                except:
                    memory_status = {}

        return jsonify({
            'status': 'running',
            'nova_ai_initialized': nova_ai is not None,
            'enhanced_nova_ai': is_enhanced,
            'enhanced_features': enhanced_features,
            'file_watcher_active': file_watcher is not None and file_watcher.is_alive() if file_watcher else False,
            'browser_mode': True,
            'ui_mode': 'browser',
            'task_management_available': task_manager_available,
            'task_statistics': task_stats,
            'ai_vision_available': vision_available,
            'vision_statistics': vision_stats,
            'memory_system_available': memory_available,
            'memory_status': memory_status
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
    print("[INFO] Starting Nova AI Desktop Interface (Browser Mode)...")

    # Check for required dependencies
    try:
        import watchdog
        print("[SUCCESS] watchdog library found")
    except ImportError:
        print("[ERROR] watchdog library not found. Installing...")
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
        print("❌ Failed to start Nova AI. Please check your GROQ_API_KEY environment variable.")
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