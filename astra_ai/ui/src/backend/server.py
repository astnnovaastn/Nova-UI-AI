#!/usr/bin/env python3
"""
Nova AI Backend Server
======================

API server for React chat interface that integrates with Nova AI system.

Features:
- Flask REST API for chat communication
- Runs nova_ai.py as subprocess with full control
- Receives user messages from frontend via /api/chat
- Forwards messages to Nova AI subprocess via stdin
- Captures AI responses from subprocess stdout
- Sends responses back to React chat interface
- Maintains chat history and context persistence
- Full subprocess lifecycle management

Message Flow:
User Message → React → /api/chat → Nova AI subprocess stdin → Processing → stdout → Response → React

Author: Astra AI Team
Version: 3.0 - Full Subprocess Control
"""

import os
import sys
import json
import time
import subprocess
import threading
import signal
import queue
import traceback
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

class NovaAISubprocessManager:
    """
    Manages Nova AI subprocess communication via stdin/stdout
    """

    def __init__(self, project_root):
        self.project_root = project_root
        self.nova_ai_script = project_root / "astra_ai" / "core" / "nova_ai.py"

        # Process state
        self.process = None
        self.is_running = False
        self.is_ready = False

        # Communication
        self.response_queue = queue.Queue(maxsize=100)
        self.stderr_queue = queue.Queue(maxsize=100)

        # Threads for reading subprocess output
        self.stdout_thread = None
        self.stderr_thread = None
        self.monitor_thread = None

        # Lock for thread-safe operations
        self.lock = threading.RLock()

        # Initialization timeout
        self.init_timeout = 30  # seconds

        logger.info(f"🔍 NovaAI Subprocess Manager initialized")
        logger.info(f"  Nova AI script: {self.nova_ai_script}")
        logger.info(f"  Script exists: {self.nova_ai_script.exists()}")

    def start(self):
        """Start the Nova AI subprocess"""
        with self.lock:
            if self.is_running:
                logger.warning("⚠️ Nova AI subprocess already running")
                return False

            try:
                logger.info("🚀 Starting Nova AI subprocess...")

                # Start subprocess with piped stdin/stdout/stderr
                self.process = subprocess.Popen(
                    [sys.executable, str(self.nova_ai_script), "--enable-all"],
                    stdin=subprocess.PIPE,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    bufsize=1,  # Line buffered
                    cwd=str(self.project_root)
                )

                self.is_running = True
                logger.info(f"✅ Process started (PID: {self.process.pid})")

                # Start reader threads
                self.stdout_thread = threading.Thread(
                    target=self._read_stdout,
                    daemon=True,
                    name="NovaAI-StdoutReader"
                )
                self.stdout_thread.start()

                self.stderr_thread = threading.Thread(
                    target=self._read_stderr,
                    daemon=True,
                    name="NovaAI-StderrReader"
                )
                self.stderr_thread.start()

                # Start monitor thread
                self.monitor_thread = threading.Thread(
                    target=self._monitor_process,
                    daemon=True,
                    name="NovaAI-Monitor"
                )
                self.monitor_thread.start()

                # Wait for initialization (detect banner or first prompt)
                if self._wait_for_ready(self.init_timeout):
                    logger.info("🤖 Nova AI subprocess ready for input")
                    return True
                else:
                    logger.error("❌ Nova AI subprocess failed to initialize within timeout")
                    self.stop()
                    return False

            except Exception as e:
                logger.error(f"❌ Failed to start Nova AI subprocess: {e}")
                traceback.print_exc()
                self.is_running = False
                return False

    def _read_stdout(self):
        """Read subprocess stdout in background thread"""
        try:
            while self.is_running and self.process:
                try:
                    line = self.process.stdout.readline()
                    if not line:
                        break

                    line = line.rstrip('\n')
                    if line:
                        logger.debug(f"[NovaAI stdout] {line}")

                        # Check for ready indicators (banner, prompt)
                        if any(indicator in line for indicator in [
                            "Nova AI",
                            ">>>",
                            "Starting the development server",
                            "Initialized successfully"
                        ]):
                            self.is_ready = True

                        # Queue the output for response collection
                        try:
                            self.response_queue.put_nowait(line)
                        except queue.Full:
                            logger.warning("⚠️ Response queue full, dropping oldest items")
                            try:
                                self.response_queue.get_nowait()
                                self.response_queue.put_nowait(line)
                            except queue.Empty:
                                pass

                except Exception as e:
                    logger.error(f"❌ Error reading stdout: {e}")
                    break
        except Exception as e:
            logger.error(f"❌ Unexpected error in stdout reader: {e}")
        finally:
            logger.info("👋 Stdout reader thread exiting")

    def _read_stderr(self):
        """Read subprocess stderr in background thread"""
        try:
            while self.is_running and self.process:
                try:
                    line = self.process.stderr.readline()
                    if not line:
                        break

                    line = line.rstrip('\n')
                    if line:
                        logger.debug(f"[NovaAI stderr] {line}")
                        try:
                            self.stderr_queue.put_nowait(line)
                        except queue.Full:
                            logger.warning("⚠️ Stderr queue full")

                except Exception as e:
                    logger.error(f"❌ Error reading stderr: {e}")
                    break
        except Exception as e:
            logger.error(f"❌ Unexpected error in stderr reader: {e}")
        finally:
            logger.info("👋 Stderr reader thread exiting")

    def _monitor_process(self):
        """Monitor subprocess health and restart if needed"""
        try:
            while self.is_running:
                if self.process and self.process.poll() is not None:
                    # Process has terminated
                    return_code = self.process.returncode
                    logger.error(f"❌ Nova AI subprocess terminated with code {return_code}")
                    self.is_running = False
                    break

                time.sleep(1)
        except Exception as e:
            logger.error(f"❌ Error in process monitor: {e}")
        finally:
            logger.info("👋 Process monitor thread exiting")

    def _wait_for_ready(self, timeout):
        """Wait for subprocess to be ready"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            if self.is_ready:
                return True
            time.sleep(0.2)
        return False

    def send_message(self, message, timeout=30):
        """Send a message to Nova AI subprocess and collect response"""
        with self.lock:
            if not self.is_running or not self.process:
                logger.error("❌ Subprocess not running")
                return None

            try:
                # Clear response queue before sending
                while not self.response_queue.empty():
                    try:
                        self.response_queue.get_nowait()
                    except queue.Empty:
                        break

                logger.info(f"📤 Sending message to Nova AI: {message[:50]}...")

                # Send message to subprocess stdin
                self.process.stdin.write(message + "\n")
                self.process.stdin.flush()

                # Collect response
                response_lines = []
                start_time = time.time()
                response_started = False
                empty_count = 0

                while time.time() - start_time < timeout:
                    try:
                        line = self.response_queue.get(timeout=0.5)

                        # Skip initialization messages
                        if not response_started and any(skip in line for skip in [
                            "Nova AI", ">>>", "Initialized", "Development", "DeprecationWarning"
                        ]):
                            continue

                        response_started = True
                        response_lines.append(line)
                        empty_count = 0

                        # Stop collecting if we see another prompt or exit command
                        if any(marker in line for marker in [">>>", "Error:", "success"]):
                            # Check if this is a final marker
                            time.sleep(0.1)
                            if self.response_queue.empty():
                                break

                    except queue.Empty:
                        if response_started:
                            empty_count += 1
                            if empty_count > 2:  # After 2 timeouts with no new lines
                                break
                        continue

                response = "\n".join(response_lines).strip() if response_lines else None

                if response:
                    logger.info(f"📥 Received response: {response[:50]}...")
                else:
                    logger.warning("⚠️ No response received from subprocess")

                return response

            except Exception as e:
                logger.error(f"❌ Error sending message: {e}")
                traceback.print_exc()
                return None

    def stop(self):
        """Stop the subprocess gracefully"""
        with self.lock:
            if not self.is_running:
                return

            try:
                logger.info("🛑 Stopping Nova AI subprocess...")

                self.is_running = False

                # Try graceful shutdown first
                if self.process:
                    try:
                        self.process.stdin.write("exit\n")
                        self.process.stdin.flush()
                        self.process.wait(timeout=5)
                        logger.info("✅ Process exited gracefully")
                    except Exception as e:
                        logger.warning(f"⚠️ Graceful shutdown failed: {e}")
                        # Force kill
                        self.process.terminate()
                        try:
                            self.process.wait(timeout=2)
                        except subprocess.TimeoutExpired:
                            self.process.kill()
                            self.process.wait()
                        logger.info("✅ Process forcefully terminated")

                self.process = None

            except Exception as e:
                logger.error(f"❌ Error stopping subprocess: {e}")

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

        logger.info(f"🔍 Server paths configured:")
        logger.info(f"  Project root: {self.project_root}")
        logger.info(f"  Memory file: {self.memory_file}")

        # Initialize subprocess manager
        self.nova_manager = NovaAISubprocessManager(self.project_root)

        # Request counter for session tracking
        self.request_count = 0
        self.lock = threading.RLock()

        # Setup routes
        self.setup_routes()

    def setup_routes(self):
        """Setup Flask routes"""

        @self.app.route('/api/chat', methods=['POST'])
        def chat_endpoint():
            """Handle chat messages from React frontend"""
            try:
                with self.lock:
                    self.request_count += 1
                    request_id = self.request_count

                data = request.get_json()
                if not data or 'message' not in data:
                    return jsonify({'error': 'Missing message'}), 400

                message = data['message']
                session_id = data.get('session_id', 'default_session')

                logger.info(f"📨 [#{request_id}] Received message from session {session_id}: {message[:60]}...")

                # Ensure Nova AI is running
                if not self.nova_manager.is_running:
                    if not self.nova_manager.start():
                        logger.error(f"❌ [#{request_id}] Failed to start Nova AI")
                        return jsonify({'error': 'Failed to start AI system'}), 500

                # Send message to Nova AI and get response
                response = self.nova_manager.send_message(message)

                if response is None:
                    logger.warning(f"⚠️ [#{request_id}] No response from Nova AI")
                    return jsonify({'error': 'No response from AI'}), 500

                logger.info(f"✅ [#{request_id}] Sent response: {response[:60]}...")

                return jsonify({
                    'response': response,
                    'session_id': session_id,
                    'timestamp': datetime.now().isoformat(),
                    'request_id': request_id
                })

            except Exception as e:
                logger.error(f"❌ Chat endpoint error: {e}")
                traceback.print_exc()
                return jsonify({'error': str(e)}), 500

        @self.app.route('/api/health', methods=['GET'])
        def health_check():
            """Health check endpoint"""
            return jsonify({
                'status': 'healthy' if self.nova_manager.is_running else 'starting',
                'nova_ai_running': self.nova_manager.is_running,
                'nova_ai_ready': self.nova_manager.is_ready,
                'process_pid': self.nova_manager.process.pid if self.nova_manager.process else None,
                'memory_file_exists': self.memory_file.exists(),
                'timestamp': datetime.now().isoformat()
            })

        @self.app.route('/api/status', methods=['GET'])
        def status():
            """Get server status"""
            return jsonify({
                'server_running': True,
                'nova_ai_initialized': self.nova_manager.is_running,
                'nova_ai_ready': self.nova_manager.is_ready,
                'process_alive': self.nova_manager.process.poll() is None if self.nova_manager.process else False,
                'memory_file_exists': self.memory_file.exists(),
                'total_requests': self.request_count,
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

    def cleanup(self):
        """Cleanup resources"""
        logger.info("🧹 Cleaning up server resources...")

        # Stop Nova AI subprocess
        if self.nova_manager:
            self.nova_manager.stop()

        logger.info("🧹 Nova AI server cleanup completed")

    def run(self, host='127.0.0.1', port=5001, debug=False):
        """Run the Flask server"""
        logger.info(f"🌐 Starting Nova AI Backend Server on {host}:{port}")

        # Start Nova AI on server startup
        if not self.nova_manager.start():
            logger.warning("⚠️ Failed to start Nova AI on startup - will attempt on first request")

        try:
            self.app.run(host=host, port=port, debug=debug, threaded=True, use_reloader=False)
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