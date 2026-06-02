#!/usr/bin/env python3
"""
JARVIS Server - WebSocket-based AI Backend
============================================

A FastAPI server that connects the frontend UI to Nova AI through WebSockets.
Handles real-time voice transcription, AI processing, and audio response generation.

Server runs on: ws://localhost:8340/ws/voice
REST API: http://localhost:8340/api/*

Features:
- Real-time WebSocket communication with frontend
- Nova AI integration for intelligent responses
- Text-to-Speech audio generation
- Memory system integration
- Task spawning and execution
- Status updates and state management
"""

import os
import json
import asyncio
import base64
import logging
import subprocess
import threading
import queue
import time
import uuid
from pathlib import Path
from typing import Optional, Dict, Any, List, Set
from datetime import datetime
from contextlib import asynccontextmanager

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent.parent.parent / '.env')

# FastAPI & WebSocket
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, File, UploadFile
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# ElevenLabs Text-to-Speech
import requests
import re
import yaml

# Image Backup Manager
from image_backup_manager import ImageBackupManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("jarvis_server.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("JarvisServer")

# ============================================================================
# GLOBAL STATE & CONFIGURATION
# ============================================================================

class ServerConfig:
    """Server configuration"""
    HOST = "0.0.0.0"
    PORT = 8340
    WS_ENDPOINT = "/ws/voice"
    MAX_CONNECTIONS = 10
    TTS_ENABLED = True
    MEMORY_ENABLED = True
    VOICE_MULTIPLIER = 2.0


IMAGE_CONFIG_PATH = Path(__file__).parent / "config.yaml"


def load_image_generation_config() -> Dict[str, Any]:
    """Read widget image generation settings from backend config.yaml and environment."""
    config = {
        "provider": "google",
        "model": "gemini-2.5-flash-image",
        "fallback_model": "",
        "enabled": True,
        "api_key": "",
    }

    try:
        if IMAGE_CONFIG_PATH.exists():
            with open(IMAGE_CONFIG_PATH, "r", encoding="utf-8") as f:
                raw_config = yaml.safe_load(f) or {}
        else:
            raw_config = {}

        ai_section = raw_config.get("ai", {})
        providers = ai_section.get("providers", {})
        google_provider = providers.get("google", {}) or {}
        widgets = raw_config.get("widgets", {})
        image_widget = widgets.get("image_generation", {}) or {}

        config["provider"] = image_widget.get("provider", config["provider"]).lower()
        config["model"] = image_widget.get("model", google_provider.get("model", config["model"]))
        config["fallback_model"] = image_widget.get("fallback_model", google_provider.get("fallback_model", config["fallback_model"]))
        config["enabled"] = image_widget.get("enabled", True)
        config["api_key"] = (
            image_widget.get("api_key") or
            google_provider.get("api_key") or
            os.getenv("GOOGLE_API_KEY") or
            os.getenv("google_api_key") or
            os.getenv("GOOGLE_APIKEY")
        )
    except Exception as e:
        logger.warning(f"[IMAGE CONFIG] Failed to load image generation config: {e}")

    return config


def _format_image_output(image_payload: Any) -> str:
    if not image_payload:
        raise ValueError("Empty image data returned from provider")

    if isinstance(image_payload, str):
        payload = image_payload.strip()
    else:
        payload = str(image_payload).strip()

    if payload.startswith("data:image/"):
        return payload
    if payload.startswith("http://") or payload.startswith("https://"):
        return payload

    # Assume base64 image string and return PNG data URI.
    return f"data:image/png;base64,{payload}"


def _generate_image_rest(prompt: str, model: str, api_key: str) -> str:
    """
    FREE FALLBACK: Uses Pollinations.ai to generate images for free
    Downloads the image and returns it as a base64 data URL to avoid CORS issues
    """
    logger.info(f"[IMAGE] Using Free Pollinations API for prompt: {prompt[:50]}...")

    # Clean the prompt for a URL
    encoded_prompt = requests.utils.quote(prompt)

    # We use Pollinations because it's reliable and free in 2026
    # It returns a direct image URL which we download and proxy
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true&seed={int(time.time())}"

    try:
        # Download the image from Pollinations
        logger.info(f"[IMAGE] Downloading image from Pollinations...")
        response = requests.get(image_url, timeout=30)

        if response.status_code == 200:
            # Convert to base64 data URL
            image_data = response.content
            base64_data = base64.b64encode(image_data).decode('utf-8')
            content_type = response.headers.get('content-type', 'image/jpeg')

            data_url = f"data:{content_type};base64,{base64_data}"
            logger.info(f"[IMAGE] Successfully downloaded and encoded image ({len(image_data)} bytes)")
            return data_url
        else:
            logger.error(f"[IMAGE] Pollinations returned status {response.status_code}")
            raise Exception(f"Pollinations API returned {response.status_code}")

    except Exception as e:
        logger.error(f"[IMAGE] Failed to download image from Pollinations: {e}")
        raise e


def generate_image_with_google(prompt: str, model: str, fallback_model: str, api_key: str) -> str:
    """
    Generate an image using the Google Gemini Imagen API.

    Primary path  : google-genai SDK v2  (google.genai)
    Fallback path : Imagen REST endpoint (generativelanguage.googleapis.com)
    """
    if not api_key:
        logger.info("[IMAGE] No Google API key found; using free Pollinations fallback.")

    logger.info(f"[IMAGE] Generating image – model: {model}")

    # FORCE FREE PATH: Bypass the broken Google SDK and use our free Pollinations function
    try:
        return _generate_image_rest(prompt, model, api_key)
    except Exception as e:
        logger.error(f"Free generation failed: {e}")
        raise e


class NovaAIProcess:
    """Manager for Nova AI subprocess communication"""
    def __init__(self, nova_ai_script_path: str, event_loop: Optional[asyncio.AbstractEventLoop] = None):
        self.script_path = nova_ai_script_path
        self.event_loop = event_loop
        self.process: Optional[subprocess.Popen] = None
        self.output_queue: queue.Queue = queue.Queue()
        self.reader_thread: Optional[threading.Thread] = None
        self.is_running = False
        self.initialization_complete = False
        self.startup_timeout = 60  # seconds - Nova AI takes time to initialize all modules
        
    async def start(self):
        """Start Nova AI in a subprocess"""
        try:
            logger.info(f"[NOVA-AI] Starting subprocess: {self.script_path}")
            
            workspace_root = Path(__file__).resolve().parents[3]
            package_root = workspace_root / "astra_ai"
            
            candidate_pythons = [
                package_root / '.venv' / 'Scripts' / 'python.exe',
                package_root / '.venv_311' / 'Scripts' / 'python.exe',
                package_root / '.venv-1' / 'Scripts' / 'python.exe',
                package_root / 'venv' / 'Scripts' / 'python.exe',
            ]
            python_exe = next((str(p) for p in candidate_pythons if p.exists()), None)
            
            if not python_exe:
                logger.error(f"[NOVA-AI] Python executable not found in any configured venv")
                return False
            
            logger.info(f"[NOVA-AI] Using Python: {python_exe}")
            
            env = os.environ.copy()
            env["PYTHONPATH"] = str(workspace_root)
            env["PYTHONIOENCODING"] = "utf-8"
            env["PYTHONUTF8"] = "1"
            
            # Spawn Nova AI process - merge stderr into stdout
            self.process = subprocess.Popen(
                [python_exe, self.script_path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                encoding='utf-8',
                errors='replace',
                bufsize=1,
                cwd=str(package_root),
                env=env,
            )
            
            self.is_running = True
            logger.info(f"[NOVA-AI] Process started with PID {self.process.pid}")
            
            # Start reader thread to capture output
            self.reader_thread = threading.Thread(target=self._read_process_output, daemon=True)
            self.reader_thread.start()
            logger.info(f"[NOVA-AI] Reader thread started")
            
            # Wait for initialization - read until the Nova AI subprocess is ready for stdin
            start_time = time.time()
            found_ready = False
            
            while not found_ready and (time.time() - start_time) < self.startup_timeout:
                try:
                    # Try to get output from the queue
                    output = self.output_queue.get(timeout=1.0)
                    logger.info(f"[NOVA-BOOT] {output}")
                    
                    # Check for readiness indicators from Nova AI
                    if (
                        "Listening" in output or
                        "> " in output or
                        "Server mode active - reading from stdin" in output or
                        "Available commands:" in output or
                        "Conversation persistence layer initialized successfully" in output
                    ):
                        found_ready = True
                        logger.info(f"[NOVA-AI] [OK] Nova AI Ready and listening")
                
                except queue.Empty:
                    logger.debug(f"[NOVA-AI] Waiting for output...")
                    continue
            
            if not found_ready:
                logger.error(f"[NOVA-AI] Timeout - never detected Nova AI readiness")
                self.stop()
                return False
            
            self.initialization_complete = True
            return True
        
        except Exception as e:
            logger.error(f"[NOVA-AI] Failed to start: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return False
    
    def _read_process_output(self):
        """Background thread: read stdout from nova_ai process"""
        try:
            if not self.process or not self.process.stdout:
                return
            
            widget_command_buffer = ""
            in_widget_command = False
            
            for line in iter(self.process.stdout.readline, ''):
                if line:
                    clean_line = line.rstrip('\n')
                    
                    # ===== DETECT WIDGET COMMANDS =====
                    if "[WIDGET_COMMAND_START]" in clean_line:
                        in_widget_command = True
                        widget_command_buffer = ""
                        logger.info("[WIDGET] Widget command detected - starting buffer")
                        continue
                    
                    if "[WIDGET_COMMAND_END]" in clean_line:
                        if in_widget_command and widget_command_buffer.strip():
                            try:
                                import json
                                widget_cmd = json.loads(widget_command_buffer.strip())
                                payload = widget_cmd.get("payload", {}) or {}
                                frontend_cmd = {
                                    "type": "widget_control",
                                    "widget": widget_cmd.get("widget"),
                                    "command": widget_cmd.get("command") or widget_cmd.get("action", "open"),
                                    "request_id": widget_cmd.get("request_id") or f"widget-{uuid.uuid4().hex}",
                                    "source": widget_cmd.get("source", "nova_ai"),
                                }
                                if widget_cmd.get("prompt") or payload.get("prompt"):
                                    frontend_cmd["prompt"] = widget_cmd.get("prompt") or payload.get("prompt")
                                logger.info(f"[WIDGET] Relaying command: {frontend_cmd}")
                                if self.event_loop and self.event_loop.is_running():
                                    asyncio.run_coroutine_threadsafe(
                                        ws_manager.broadcast(frontend_cmd),
                                        self.event_loop
                                    )
                                else:
                                    logger.error("[WIDGET] Cannot relay command: server event loop unavailable")
                            except json.JSONDecodeError as e:
                                logger.error(f"[WIDGET] Failed to parse widget command JSON: {e}")
                            except Exception as e:
                                logger.error(f"[WIDGET] Error broadcasting widget command: {e}")
                        in_widget_command = False
                        widget_command_buffer = ""
                        continue
                    
                    if in_widget_command:
                        widget_command_buffer += clean_line + "\n"
                        continue
                    
                    # ===== REGULAR OUTPUT =====
                    self.output_queue.put(clean_line)
                    logger.info(f"[RAW-SUBPROCESS] Queue depth={self.output_queue.qsize()}: {clean_line}")
        
        except Exception as e:
            logger.error(f"[NOVA-AI] Error reading output: {e}")
            import traceback
            logger.error(traceback.format_exc())
        finally:
            logger.info(f"[NOVA-AI] Process output reader ended")
            self.is_running = False
    
    async def send_message(self, user_input: str, timeout: float = 30.0) -> Optional[str]:
        """
        Send message to Nova AI via stdin and wait for response.
        Falls back to reading from nova_ai_memory.json if subprocess response fails.
        
        Returns: The COMPLETE AI response text (everything Nova AI says)
        """
        if not self.process or not self.process.stdin:
            logger.error(f"[NOVA-AI] Process not running")
            return None
        
        try:
            logger.info(f"[NOVA-AI] >>>>>>>>>> SENDING USER INPUT: '{user_input}' >>>>>>>>>>")
            
            # Send user input to nova_ai stdin with newline
            self.process.stdin.write(user_input + '\n')
            self.process.stdin.flush()
            
            logger.info(f"[NOVA-AI] Input sent to subprocess stdin, waiting for response...")
            
            # Wait for response - ONLY look for "Nova: " prefix lines
            start_time = time.time()
            
            while time.time() - start_time < timeout:
                try:
                    line = self.output_queue.get(timeout=1.0)
                    
                    if not line or not line.strip():
                        continue
                    
                    # ===== ONLY CAPTURE "Nova: " prefix responses =====
                    # Handle cases with or without shell prompt ">", spaces, etc.
                    cleaned_line = line.strip()
                    
                    # Remove shell prompt if present ("> " at start)
                    if cleaned_line.startswith(">"):
                        cleaned_line = cleaned_line[1:].strip()
                    
                    if cleaned_line.startswith("Nova: "):
                        response_text = cleaned_line.replace("Nova: ", "").strip()
                        logger.info(f"[NOVA-AI] <<<<<<<<<< RESPONSE CAPTURED [Nova: prefix] <<<<<<<<<< {response_text}")
                        return response_text
                    
                    elif cleaned_line.startswith("Nova AI: "):
                        response_text = cleaned_line.replace("Nova AI: ", "").strip()
                        logger.info(f"[NOVA-AI] <<<<<<<<<< RESPONSE CAPTURED [Nova AI: prefix] <<<<<<<<<< {response_text}")
                        return response_text
                    
                    # Skip everything else (debug, system, prompts, initialization)
                    else:
                        logger.debug(f"[NOVA-AI] Skipping non-response line: {line[:60]}")
                        continue
                
                except queue.Empty:
                    # Timeout waiting for response
                    continue
                except Exception as e:
                    logger.debug(f"[NOVA-AI] Error in response loop: {e}")
                    continue
            
            # Timeout - fallback to reading from nova_ai_memory.json
            logger.warning(f"[NOVA-AI] Timeout waiting for 'Nova: ' prefix - trying fallback (nova_ai_memory.json)...")
            return await self._get_response_from_memory(user_input)
        
        except Exception as e:
            logger.error(f"[NOVA-AI] Error sending message: {e}")
            # Fallback to memory
            return await self._get_response_from_memory(user_input)
    
    async def _get_response_from_memory(self, user_input: str) -> Optional[str]:
        """
        Fallback: Read the last AI response from nova_ai_memory.json.
        This ensures we get the complete AI response even if subprocess capture fails.
        """
        try:
            # Try multiple possible memory file paths
            possible_paths = [
                Path("Date/nova_ai_memory.json"),
                Path("d:/Astra_ai/Date/nova_ai_memory.json"),
                Path("./Date/nova_ai_memory.json"),
                Path(os.path.expandvars("${USERPROFILE}/Astra_ai/Date/nova_ai_memory.json")) if "${USERPROFILE}" in os.environ else None,
            ]
            
            memory_file = None
            for path in possible_paths:
                if path and path.exists():
                    memory_file = path
                    logger.info(f"[MEMORY-FALLBACK] Found memory file at: {memory_file}")
                    break
            
            if not memory_file:
                logger.warning(f"[MEMORY-FALLBACK] nova_ai_memory.json not found in any expected location")
                return None
            
            with open(memory_file, 'r', encoding='utf-8') as f:
                memory_data = json.load(f)
            
            # Get the last assistant response from conversation history
            conversation = memory_data.get("conversation", [])
            
            # Find the last assistant message after the user input
            last_assistant_response = None
            for i in range(len(conversation) - 1, -1, -1):
                msg = conversation[i]
                if msg.get("role") == "assistant":
                    last_assistant_response = msg.get("content", "")
                    break
            
            if last_assistant_response:
                logger.info(f"[MEMORY-FALLBACK] <<<<<<<<<< RESPONSE FROM MEMORY <<<<<<<<<< {last_assistant_response}")
                return last_assistant_response
            else:
                logger.warning("[MEMORY-FALLBACK] No assistant response found in memory")
                return None
        
        except Exception as e:
            logger.error(f"[MEMORY-FALLBACK] Error reading from memory: {e}")
            return None
    
    def stop(self):
        """Stop the Nova AI process"""
        if self.process:
            try:
                logger.info(f"[NOVA-AI] Stopping process (PID {self.process.pid})...")
                self.process.stdin.close() if self.process.stdin else None
                self.process.terminate()
                
                # Wait for graceful shutdown
                try:
                    self.process.wait(timeout=5)
                    logger.info(f"[NOVA-AI] Process terminated gracefully")
                except subprocess.TimeoutExpired:
                    logger.warning(f"[NOVA-AI] Force killing process...")
                    self.process.kill()
                    self.process.wait()
            
            except Exception as e:
                logger.error(f"[NOVA-AI] Error stopping process: {e}")
        
        self.is_running = False
        self.process = None


class ServerState:
    """Global server state"""
    def __init__(self):
        project_root = Path(__file__).resolve().parents[3]
        self.nova_ai: Optional[NovaAIProcess] = None
        self.active_connections: Set[WebSocket] = set()
        self.is_processing = False
        self.current_user_session = "default"
        self.processed_transcripts: Set[str] = set()
        self.task_counter = 0
        self.memory_monitor_task: Optional[asyncio.Task] = None
        self.memory_file = project_root / "Date" / "nova_ai_memory.json"
        self.start_time = time.time()  # Track when server started for uptime calculation
        
        # Initialize image backup manager
        backend_dir = Path(__file__).parent
        self.image_backup = ImageBackupManager(backend_dir / "ai_generated_images")

    async def initialize(self):
        """Initialize server components"""
        logger.info("[INIT] Starting JARVIS Server...")
        
        # Initialize Nova AI as subprocess
        try:
            project_root = Path(__file__).resolve().parents[3]
            nova_ai_path = project_root / "astra_ai" / "core" / "nova_ai.py"
            logger.info(f"[NOVA-AI] Path: {nova_ai_path}")
            
            self.event_loop = asyncio.get_running_loop()
            self.nova_ai = NovaAIProcess(str(nova_ai_path), self.event_loop)
            success = await self.nova_ai.start()
            
            if success:
                logger.info("[SUCCESS] Nova AI subprocess initialized")
            else:
                logger.error("[ERROR] Failed to initialize Nova AI subprocess")
                self.nova_ai = None
        except Exception as e:
            logger.error(f"[ERROR] Failed to initialize Nova AI: {e}")
            self.nova_ai = None
        
    async def shutdown(self):
        """Cleanup server resources"""
        logger.info("[SHUTDOWN] Stopping JARVIS Server...")
        
        # Stop Nova AI process
        if self.nova_ai:
            self.nova_ai.stop()


# Initialize global state
state = ServerState()


# ============================================================================
# WEBSOCKET MANAGER
# ============================================================================

class WebSocketManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        self.connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection"""
        await websocket.accept()
        self.connections.append(websocket)
        state.active_connections.add(websocket)
        logger.info(f"[OK] Client connected. Active connections: {len(self.connections)}")
        
        # Send welcome message
        await self.broadcast({
            "type": "status",
            "state": "idle",
            "message": "Connected to JARVIS Server"
        })
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        if websocket in self.connections:
            self.connections.remove(websocket)
        state.active_connections.discard(websocket)
        logger.info(f"[DISCONNECT] Client disconnected. Active connections: {len(self.connections)}")
    
    async def broadcast(self, message: Dict[str, Any]):
        """Send message to all connected clients"""
        msg_type = message.get("type", "unknown")
        num_clients = len(self.connections)
        
        if msg_type == "response_audio":
            audio_size = len(message.get("audio", ""))
            print(f"[BROADCAST-AUDIO] Sending audio ({audio_size} chars) to {num_clients} client(s)", flush=True)
        
        for i, connection in enumerate(self.connections):
            try:
                await connection.send_json(message)
                if msg_type == "response_audio":
                    print(f"[BROADCAST-AUDIO] Sent to client {i+1}/{num_clients}", flush=True)
            except Exception as e:
                print(f"[BROADCAST-ERROR] Failed to send {msg_type} to client {i+1}: {e}", flush=True)
                logger.error(f"Failed to send {msg_type} to client: {e}")
    
    async def send_to_client(self, websocket: WebSocket, message: Dict[str, Any]):
        """Send message to specific client"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error(f"Failed to send message to client: {e}")


ws_manager = WebSocketManager()


# ============================================================================
# SPEECH CORRECTION & CLEANING
# ============================================================================

def apply_speech_corrections(text: str) -> str:
    """
    Clean and correct speech-to-text transcription errors.
    Handles common misrecognitions and typos from voice input.
    
    Returns: Cleaned and corrected text
    """
    if not text:
        return text
    
    # Common voice-to-text corrections
    corrections = {
        # AI system names
        "nova eye": "Nova AI",
        "nova a.i": "Nova AI",
        "nova ai": "Nova AI",
        "jarvis": "JARVIS",
        
        # Common misrecognitions
        "homophones": "homophone",
        "their": "there",
        "there there": "there",
        "weather": "whether",
        "write": "right",
        "knight": "night",
        "know": "no",
        "new": "knew",
        
        # Common contractions and typos
        "dont": "don't",
        "cant": "can't",
        "wont": "won't",
        "shouldnt": "shouldn't",
        "couldnt": "couldn't",
        "hasnt": "hasn't",
        "havent": "haven't",
        "isnt": "isn't",
        "arent": "aren't",
        "wasnt": "wasn't",
        "werent": "weren't",
        "ive": "I've",
        "youve": "you've",
        "theyre": "they're",
        "were": "we're",
        "wr": "were",
        
        # Numbers and units
        "one": "1",
        "two": "2",
        "three": "3",
        "four": "4",
        "five": "5",
        "six": "6",
        "seven": "7",
        "eight": "8",
        "nine": "9",
        "zero": "0",
        
        # Commands that might be misheard
        "ok": "okay",
        "ok google": "",
        "ok alexa": "",
        "alexa": "",
        "siri": "",
        
        # Tech terms commonly mispronounced
        "python": "Python",
        "java": "Java",
        "java script": "JavaScript",
        "type script": "TypeScript",
        "react": "React",
        "angular": "Angular",
        "vue": "Vue",
        "node": "Node.js",
        "npm": "NPM",
        "yarn": "Yarn",
        "git": "Git",
        "github": "GitHub",
        "gitlab": "GitLab",
        "docker": "Docker",
        "kubernetes": "Kubernetes",
        "api": "API",
        "rest": "REST",
        "json": "JSON",
        "xml": "XML",
        "html": "HTML",
        "css": "CSS",
        "sql": "SQL",
        "database": "database",
        "linux": "Linux",
        "windows": "Windows",
        "mac": "macOS",
    }
    
    # Apply corrections (case-insensitive matching)
    corrected = text.lower()
    for wrong, right in corrections.items():
        corrected = corrected.replace(wrong.lower(), right.lower())
    
    # Capitalize first letter of sentence
    if corrected:
        corrected = corrected[0].upper() + corrected[1:] if len(corrected) > 1 else corrected.upper()
    
    # Clean up excessive punctuation
    corrected = corrected.replace("...", ".")
    corrected = corrected.replace("!!!!", "!")
    corrected = corrected.replace("????", "?")
    
    # Remove extra spaces
    corrected = " ".join(corrected.split())
    
    logger.debug(f"[LOG] Speech correction: '{text}' → '{corrected}'")
    return corrected


# ============================================================================
# MARKDOWN STRIPPING FOR TTS
# ============================================================================

def strip_markdown_for_tts(text: str) -> str:
    """
    Strip markdown formatting from text before sending to TTS.
    Removes: **bold**, __bold__, *italic*, _italic_, `code`, links, etc.
    Also removes overly-apologetic phrases.
    """
    if not text:
        return ""
    
    # Remove markdown formatting
    text = re.sub(r'\*\*(.+?)\*\*', r'\1', text)  # **bold** → bold
    text = re.sub(r'__(.+?)__', r'\1', text)      # __bold__ → bold
    text = re.sub(r'\*(.+?)\*', r'\1', text)      # *italic* → italic
    text = re.sub(r'_(.+?)_', r'\1', text)        # _italic_ → italic
    text = re.sub(r'`(.+?)`', r'\1', text)        # `code` → code
    text = re.sub(r'\[(.+?)\]\(.+?\)', r'\1', text)  # [link](url) → link
    
    # Remove code blocks
    text = re.sub(r'```[\s\S]*?```', '', text)    # ```code blocks```
    
    # Remove headers
    text = re.sub(r'^#+\s+', '', text, flags=re.MULTILINE)  # # Header → Header
    
    # Remove list markers
    text = re.sub(r'^\s*[-*+]\s+', '', text, flags=re.MULTILINE)  # - item → item
    text = re.sub(r'^\s*\d+\.\s+', '', text, flags=re.MULTILINE)  # 1. item → item
    
    # Remove overly-apologetic phrases
    apologies = [
        "I apologize",
        "I'm sorry",
        "Sorry about that",
        "My bad",
        "I apologize for",
        "I'm afraid",
        "Unfortunately"
    ]
    for apology in apologies:
        text = re.sub(f'(?i){re.escape(apology)}', '', text)
    
    # Clean up extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    logger.debug(f"[TTS] Markdown stripped for TTS: {text[:100]}")
    return text



# ============================================================================
# ELEVENLABS TEXT-TO-SPEECH (PRIMARY - ONLY PROVIDER)
# ============================================================================


ELEVENLABS_DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"
ELEVENLABS_FALLBACK_VOICE_ID = "EXAVITQu4vr4xnSDxMaL"


def _get_elevenlabs_voice_id() -> str:
    """Return the configured ElevenLabs voice ID or a known free fallback."""
    return (
        os.getenv("elevenlabs_voice_id") or
        os.getenv("ELEVENLABS_VOICE_ID") or
        ELEVENLABS_DEFAULT_VOICE_ID
    )


def _get_elevenlabs_voice_label(voice_id: str) -> str:
    """Label the selected ElevenLabs voice ID for logging."""
    if voice_id == ELEVENLABS_DEFAULT_VOICE_ID:
        return "default free voice"
    return voice_id


async def generate_audio_elevenlabs(text: str) -> Optional[str]:
    """
    Generate audio using ElevenLabs API and return as Base64.
    Uses the configured ElevenLabs voice ID and falls back to a free voice if needed.
    """
    if not text or not text.strip():
        print(f"[ELEVENLABS] Empty text for TTS", flush=True)
        logger.warning("[WARNING] Empty text for TTS")
        return None
    
    try:
        print(f"[ELEVENLABS-START] Starting API call...", flush=True)
        api_key = os.getenv("ELEVENLABS_API_KEY") or os.getenv("elevenlabs_api_key")
        if not api_key:
            print(f"[ELEVENLABS-ERROR] ElevenLabs API key not found", flush=True)
            logger.error("[ERROR] ElevenLabs API key not found in environment")
            return None
        print(f"[ELEVENLABS-KEY] API key found (length: {len(api_key)})", flush=True)
        
        clean_text = strip_markdown_for_tts(text)
        logger.info(f"[LOG] [TTS] ORIGINAL AI RESPONSE: '{text}'")
        logger.info(f"[LOG] [TTS] CLEANED TEXT FOR ELEVENLABS: '{clean_text}'")
        logger.info(f"[LOG] [TTS] LENGTH: {len(clean_text)} chars")
        
        voice_id = _get_elevenlabs_voice_id()
        voice_label = _get_elevenlabs_voice_label(voice_id)
        print(f"[ELEVENLABS-VOICE] Using voice ID: {voice_id} ({voice_label})", flush=True)
        
        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json"
        }
        
        payload = {
            "text": clean_text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75
            }
        }
        
        async def send_tts_request(current_voice_id: str):
            url = f"https://api.elevenlabs.io/v1/text-to-speech/{current_voice_id}"
            print(f"[ELEVENLABS-POST] Making POST request to {url}", flush=True)
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            print(f"[ELEVENLABS-RESPONSE] Got status: {response.status_code}", flush=True)
            logger.debug(f"   Response status: {response.status_code}")
            return response
        
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(None, lambda: requests.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers=headers,
            json=payload,
            timeout=30
        ))
        
        if response.status_code == 200:
            audio_bytes = response.content
            print(f"[ELEVENLABS-SUCCESS] Got {len(audio_bytes)} bytes", flush=True)
            logger.info(f"[OK] [TTS] ElevenLabs returned {len(audio_bytes)} bytes of MP3 audio")
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
            print(f"[ELEVENLABS-B64] Encoded to {len(audio_b64)} Base64 chars", flush=True)
            logger.info(f"[OK] [TTS] Base64 encoded: {len(audio_b64)} chars")
            return audio_b64
        
        if response.status_code == 402 and voice_id != ELEVENLABS_FALLBACK_VOICE_ID:
            logger.warning("[ELEVENLABS] Paid voice blocked. Retrying with fallback free voice ID")
            fallback_voice_id = ELEVENLABS_FALLBACK_VOICE_ID
            print(f"[ELEVENLABS-FALLBACK] Retrying with free voice ID: {fallback_voice_id}", flush=True)
            response = await loop.run_in_executor(None, lambda: requests.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{fallback_voice_id}",
                headers=headers,
                json=payload,
                timeout=30
            ))
            if response.status_code == 200:
                audio_bytes = response.content
                print(f"[ELEVENLABS-SUCCESS] Got {len(audio_bytes)} bytes from fallback voice", flush=True)
                logger.info(f"[OK] [TTS] ElevenLabs returned {len(audio_bytes)} bytes of MP3 audio on fallback")
                audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
                print(f"[ELEVENLABS-B64] Encoded to {len(audio_b64)} Base64 chars", flush=True)
                logger.info(f"[OK] [TTS] Base64 encoded: {len(audio_b64)} chars")
                return audio_b64
        
        error_text = response.text[:500] if response.text else "No response text"
        print(f"[ELEVENLABS-ERROR] API error {response.status_code}: {error_text}", flush=True)
        logger.error(f"[ERROR] [TTS] ElevenLabs API error {response.status_code}")
        logger.error(f"   Response: {error_text}")
        return None
    
    except requests.exceptions.Timeout:
        print(f"[ELEVENLABS-TIMEOUT] Request timed out", flush=True)
        logger.error("[ERROR] [TTS] ElevenLabs request timed out (30s)")
        return None
    except requests.exceptions.ConnectionError as e:
        print(f"[ELEVENLABS-CONNECTION] Connection error: {e}", flush=True)
        logger.error(f"[ERROR] [TTS] Connection error: {e}")
        return None
    except Exception as e:
        print(f"[ELEVENLABS-EXCEPTION] {type(e).__name__}: {e}", flush=True)
        logger.error(f"[ERROR] [TTS] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return None


# ============================================================================
# TEXT-TO-SPEECH HELPER - Gemini TTS Fallback (Google Cloud TTS via Gemini API key)
# ============================================================================

# Gemini 2.5 Flash Preview TTS voice model
GEMINI_TTS_MODEL = "gemini-2.5-flash-preview-tts"

# Google TTS REST API
GOOGLE_TTS_API_URL = "https://texttospeech.googleapis.com/v1/text:synthesize"
GOOGLE_TTS_VOICE = "en-US-Standard-C"
GOOGLE_TTS_LANGUAGE = "en-US"


async def generate_audio_gemini(text: str) -> Optional[str]:
    """
    Generate audio using Google Cloud Text-to-Speech API with the Gemini API key.
    Used as a fallback when ElevenLabs and Deepgram are not available.
    Uses the Google API key already configured for image generation.
    """
    if not text or not text.strip():
        print(f"[GEMINI-TTS] Empty text for TTS", flush=True)
        return None

    try:
        print(f"[GEMINI-TTS] Starting Google TTS...", flush=True)
        logger.info(f"[TTS] Using Google Cloud TTS as fallback")

        # Try to get the Google API key — same key used for image generation
        api_key = (
            os.getenv("GOOGLE_API_KEY") or
            os.getenv("google_api_key") or
            os.getenv("GOOGLE_APIKEY")
        )
        if not api_key:
            print(f"[GEMINI-TTS-ERROR] GOOGLE_API_KEY not found", flush=True)
            logger.error("[ERROR] GOOGLE_API_KEY not found in environment")
            return None

        print(f"[GEMINI-TTS-KEY] API key found (length: {len(api_key)})", flush=True)

        clean_text = strip_markdown_for_tts(text)
        print(f"[GEMINI-TTS-API] Calling Google TTS API ({len(clean_text)} chars)...", flush=True)
        logger.info(f"[TTS] Calling Google Cloud TTS API ({len(clean_text)} chars)...")

        payload = {
            "input": {"text": clean_text},
            "voice": {
                "languageCode": GOOGLE_TTS_LANGUAGE,
                "name": GOOGLE_TTS_VOICE
            },
            "audioConfig": {
                "audioEncoding": "MP3",
                "speakingRate": 1.0,
                "pitch": 0.0,
                "volumeGainDb": 0.0
            }
        }

        loop = asyncio.get_event_loop()

        def make_request():
            print(f"[GEMINI-TTS-POST] Making POST request to Google TTS API...", flush=True)
            response = requests.post(
                f"{GOOGLE_TTS_API_URL}?key={api_key}",
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=30
            )
            print(f"[GEMINI-TTS-RESPONSE] Got status: {response.status_code}", flush=True)
            return response

        response = await loop.run_in_executor(None, make_request)

        if response.status_code == 200:
            result = response.json()
            audio_content = result.get("audioContent", "")

            if audio_content:
                # The API returns base64 audio content directly
                audio_bytes = base64.b64decode(audio_content)
                print(f"[GEMINI-TTS-SUCCESS] Got {len(audio_bytes)} bytes", flush=True)
                logger.info(f"[OK] [TTS] Google TTS returned {len(audio_bytes)} bytes of MP3 audio")

                # Re-encode for consistency (though already base64)
                audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
                print(f"[GEMINI-TTS-B64] Encoded to {len(audio_b64)} Base64 chars", flush=True)
                logger.info(f"[OK] [TTS] Base64 encoded: {len(audio_b64)} chars")

                return audio_b64
            else:
                print(f"[GEMINI-TTS-ERROR] Empty audio content in response", flush=True)
                logger.error("[ERROR] [TTS] Google TTS returned empty audio content")
                return None
        else:
            error_text = response.text[:500] if response.text else "No response text"
            print(f"[GEMINI-TTS-ERROR] API error {response.status_code}: {error_text}", flush=True)
            logger.error(f"[ERROR] [TTS] Google TTS API error {response.status_code}")
            logger.error(f"   Response: {error_text}")

            # Try Gemini 2.5 Flash Preview TTS model via OpenRouter if standard TTS fails
            logger.info("[TTS] Falling back to Gemini model via OpenRouter...")
            return await _generate_audio_gemini_model(clean_text, api_key)

    except requests.exceptions.Timeout:
        print(f"[GEMINI-TTS-TIMEOUT] Request timed out", flush=True)
        logger.error("[ERROR] [TTS] Google TTS request timed out (30s)")
        return None
    except requests.exceptions.ConnectionError as e:
        print(f"[GEMINI-TTS-CONNECTION] Connection error: {e}", flush=True)
        logger.error(f"[ERROR] [TTS] Connection error: {e}")
        return None
    except Exception as e:
        print(f"[GEMINI-TTS-EXCEPTION] {type(e).__name__}: {e}", flush=True)
        logger.error(f"[ERROR] [TTS] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return None


async def _generate_audio_gemini_model(text: str, api_key: str) -> Optional[str]:
    """
    Fallback: Generate audio using Gemini 2.5 Flash Preview TTS via OpenRouter.
    This handles the case where standard Google TTS isn't available but Gemini access is.
    Uses the OpenRouter Gemini endpoint which can serve TTS-capable models.

    Returns: Base64 encoded MP3 audio or None.
    """
    try:
        clean_text = strip_markdown_for_tts(text)
        print(f"[GEMINI-MODEL] Using Gemini 2.5 Flash Preview TTS via OpenRouter...", flush=True)
        logger.info(f"[TTS] Calling Gemini 2.5 Flash Preview via OpenRouter for TTS")

        # Try OpenRouter first (most likely to have the TTS model available)
        openrouter_api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("openrouter_api_key")

        if not openrouter_api_key:
            logger.warning("[TTS] No OpenRouter API key found for Gemini TTS model")
            return None

        headers = {
            "Authorization": f"Bearer {openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://nova-ai.local",
            "X-Title": "NOVA AI"
        }

        payload = {
            "model": GEMINI_TTS_MODEL,
            "messages": [
                {"role": "user", "content": f"Read the following text aloud in a natural, conversational tone:\n\n{clean_text}"}
            ],
            "temperature": 0.3,
            "max_tokens": 2048,
            "stream": False
        }

        loop = asyncio.get_event_loop()

        def make_request():
            print(f"[GEMINI-MODEL-POST] Making request to OpenRouter Gemini endpoint...", flush=True)
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=60
            )
            print(f"[GEMINI-MODEL-RESPONSE] Got status: {response.status_code}", flush=True)
            return response

        response = await loop.run_in_executor(None, make_request)

        if response.status_code == 200:
            result = response.json()
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")

            if content and len(content) > 50:
                # The response is text that we can either:
                # 1. Return as-is for the frontend to display (no TTS audio)
                # 2. Attempt to use a simple TTS conversion

                # For now, log that we got a text response but no audio
                logger.info(f"[GEMINI-MODEL] Got text response ({len(content)} chars) - no native TTS audio")
                print(f"[GEMINI-MODEL] Response: {content[:100]}...", flush=True)

                # Since we can't get actual audio from this, return None
                # The caller will fall through to pyttsx3 offline TTS
                return None
            else:
                logger.warning("[GEMINI-MODEL] Empty or too short response from Gemini model")
                return None
        else:
            error_text = response.text[:300] if response.text else "No response text"
            logger.warning(f"[GEMINI-MODEL] OpenRouter returned {response.status_code}: {error_text}")
            return None

    except Exception as e:
        logger.error(f"[GEMINI-MODEL] Error: {e}")
        return None


# ============================================================================
# TEXT-TO-SPEECH HELPER - Deepgram Fallback (Primary Cloud Provider)
# ============================================================================

async def generate_audio_deepgram(text: str) -> Optional[str]:
    """
    Generate audio using Deepgram TTS API (primary cloud provider).
    More reliable than ElevenLabs free tier with good quality output.
    """
    if not text or not text.strip():
        print(f"[DEEPGRAM] Empty text for TTS", flush=True)
        return None
    
    try:
        print(f"[DEEPGRAM-START] Starting Deepgram TTS...", flush=True)
        logger.info(f"[TTS] Using Deepgram as primary provider")
        
        api_key = os.getenv("DEEPGRAM_API_KEY")
        if not api_key:
            print(f"[DEEPGRAM-ERROR] DEEPGRAM_API_KEY not found", flush=True)
            logger.error("[ERROR] DEEPGRAM_API_KEY not found in environment")
            return None
        print(f"[DEEPGRAM-KEY] API key found", flush=True)
        
        clean_text = strip_markdown_for_tts(text)
        url = "https://api.deepgram.com/v1/speak?model=aura-asteria-en&encoding=mp3"
        
        headers = {
            "Authorization": f"Token {api_key}",
            "Content-Type": "text/plain"
        }
        
        print(f"[DEEPGRAM-API] Calling API ({len(clean_text)} chars)...", flush=True)
        logger.info(f"[TTS] Calling Deepgram API ({len(clean_text)} chars)...")
        
        loop = asyncio.get_event_loop()
        
        def make_request():
            print(f"[DEEPGRAM-POST] Making POST request...", flush=True)
            response = requests.post(url, headers=headers, data=clean_text, timeout=30)
            print(f"[DEEPGRAM-RESPONSE] Got status: {response.status_code}", flush=True)
            return response
        
        response = await loop.run_in_executor(None, make_request)
        
        if response.status_code == 200:
            audio_bytes = response.content
            print(f"[DEEPGRAM-SUCCESS] Got {len(audio_bytes)} bytes", flush=True)
            logger.info(f"[OK] [TTS] Deepgram returned {len(audio_bytes)} bytes of MP3 audio")
            
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
            print(f"[DEEPGRAM-B64] Encoded to {len(audio_b64)} Base64 chars", flush=True)
            logger.info(f"[OK] [TTS] Base64 encoded: {len(audio_b64)} chars")
            
            return audio_b64
        else:
            error_text = response.text[:500] if response.text else "No response text"
            print(f"[DEEPGRAM-ERROR] API error {response.status_code}: {error_text}", flush=True)
            logger.error(f"[ERROR] [TTS] Deepgram API error {response.status_code}")
            logger.error(f"   Response: {error_text}")
            return None
    
    except requests.exceptions.Timeout:
        print(f"[DEEPGRAM-TIMEOUT] Request timed out", flush=True)
        logger.error("[ERROR] [TTS] Deepgram request timed out (30s)")
        return None
    except requests.exceptions.ConnectionError as e:
        print(f"[DEEPGRAM-CONNECTION] Connection error: {e}", flush=True)
        logger.error(f"[ERROR] [TTS] Connection error: {e}")
        return None
    except Exception as e:
        print(f"[DEEPGRAM-EXCEPTION] {type(e).__name__}: {e}", flush=True)
        logger.error(f"[ERROR] [TTS] Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return None


# ============================================================================
# TEXT-TO-SPEECH HELPER - PyTTSx3 Fallback (Offline)
# ============================================================================

async def generate_audio_pyttsx3(text: str) -> Optional[str]:
    """
    Generate audio using offline pyttsx3 TTS as fallback.
    Used when ElevenLabs API quota is exceeded or unavailable.
    """
    if not text or not text.strip():
        print(f"[PYTTSX3] Empty text for TTS", flush=True)
        return None
    
    try:
        import pyttsx3
        import tempfile
        
        print(f"[PYTTSX3] Starting offline TTS fallback...", flush=True)
        logger.info(f"[TTS] [FALLBACK] Using pyttsx3 for: {text[:50]}...")
        
        # Initialize the engine
        engine = pyttsx3.init()
        
        # Set properties
        engine.setProperty('rate', 150)  # Speed
        engine.setProperty('volume', 0.9)  # Volume (0-1)
        
        # Create temporary file for audio
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
            tmp_path = tmp.name
        
        try:
            # Save to temporary file
            engine.save_to_file(text, tmp_path)
            engine.runAndWait()
            
            # Read the audio file
            with open(tmp_path, 'rb') as f:
                audio_bytes = f.read()
            
            # Encode as Base64
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
            
            print(f"[PYTTSX3] Generated {len(audio_bytes)} bytes", flush=True)
            logger.info(f"[OK] [TTS] pyttsx3 fallback generated {len(audio_bytes)} bytes")
            
            return audio_b64
            
        finally:
            # Clean up temporary file
            try:
                os.remove(tmp_path)
            except:
                pass
                
    except ImportError:
        print(f"[PYTTSX3] pyttsx3 not installed - cannot use fallback", flush=True)
        logger.warning("[WARNING] pyttsx3 not installed - no fallback TTS available")
        return None
    except Exception as e:
        print(f"[PYTTSX3] Error: {type(e).__name__}: {e}", flush=True)
        logger.error(f"[ERROR] [TTS] pyttsx3 fallback failed: {e}")
        return None


# ============================================================================
# TEXT-TO-SPEECH HELPER - WEB AUDIO API PIPELINE
# ============================================================================
"""
This module handles the audio generation pipeline that feeds the frontend's
sophisticated Web Audio API system:

Frontend Audio Pipeline (voice.ts):
  1. Receives Base64 audio from server over WebSocket
  2. Decodes Base64 → Uint8Array (binary data)
  3. Uses Web Audio API AudioContext.decodeAudioData() to convert binary → AudioBuffer
  4. Implements AudioQueue system for seamless multi-segment playback
  5. Routes audio through AnalyserNode for real-time frequency analysis
  6. Connects to main.ts/orb.ts animation loop for visual feedback
  7. As AI speaks, the Orb visuals pulse/dance to audio frequencies in real-time

Backend Responsibility:
  - Generate high-quality audio that's compatible with Web Audio API
  - Encode as Base64 for WebSocket transmission
  - Send audio metadata (format, sample rate) for proper decoding
  - Support multiple audio segments for responsive UI
"""

async def generate_audio_base64(text: str) -> Optional[str]:
    """
    Generate audio from text and return as base64 string.
    Priority chain:
      1. ElevenLabs (primary - best quality)
      2. Gemini TTS (Google Cloud TTS - fallback using same API key as image generation)
      3. Deepgram (fallback - reliable alternative)
      4. pyttsx3 (offline fallback - always available)
    """
    if not text or not text.strip():
        print(f"[AUDIO-B64] Empty text", flush=True)
        return None

    # Try ElevenLabs first
    print(f"[AUDIO-B64] Trying ElevenLabs (primary)...", flush=True)
    audio_b64 = await generate_audio_elevenlabs(text)

    if audio_b64:
        print(f"[AUDIO-B64] [OK] ElevenLabs success! Returning {len(audio_b64)} chars", flush=True)
        logger.info("[OK] ElevenLabs TTS generated audio successfully")
        return audio_b64

    # ElevenLabs failed - try Gemini TTS (Google Cloud TTS)
    print(f"[AUDIO-B64] ElevenLabs failed - trying Gemini TTS (Google Cloud fallback)...", flush=True)
    logger.warning("[FALLBACK] ElevenLabs TTS failed, attempting Gemini TTS fallback")
    audio_b64 = await generate_audio_gemini(text)

    if audio_b64:
        print(f"[AUDIO-B64] [OK] Gemini TTS success! Returning {len(audio_b64)} chars", flush=True)
        logger.info("[OK] Gemini TTS fallback generated audio successfully")
        return audio_b64

    # Gemini TTS failed - try Deepgram
    print(f"[AUDIO-B64] Gemini TTS failed - trying Deepgram (secondary fallback)...", flush=True)
    logger.warning("[FALLBACK] Gemini TTS failed, attempting Deepgram fallback")
    audio_b64 = await generate_audio_deepgram(text)

    if audio_b64:
        print(f"[AUDIO-B64] [OK] Deepgram success! Returning {len(audio_b64)} chars", flush=True)
        logger.info("[OK] Deepgram TTS fallback generated audio successfully")
        return audio_b64

    # Both cloud providers failed - try pyttsx3 (offline)
    print(f"[AUDIO-B64] All cloud providers failed - trying pyttsx3 (offline)...", flush=True)
    logger.warning("[FALLBACK] All cloud providers failed, attempting pyttsx3 fallback")
    audio_b64_pyttsx3 = await generate_audio_pyttsx3(text)

    if audio_b64_pyttsx3:
        print(f"[AUDIO-B64] [OK] pyttsx3 success! Returning {len(audio_b64_pyttsx3)} chars", flush=True)
        logger.info("[OK] pyttsx3 offline TTS fallback generated audio successfully")
        return audio_b64_pyttsx3

    # All providers failed
    print(f"[AUDIO-B64] [FAIL] All TTS providers failed - no audio", flush=True)
    logger.error("[ERROR] All TTS providers failed - no audio generated")
    return None


def _generate_tts_audio(text: str) -> Optional[bytes]:
    """
    Generate TTS audio optimized for Web Audio API.
    Returns audio bytes in PCM format compatible with AudioContext.decodeAudioData().
    """
    try:
        if not state.tts:
            return None
        
        # Queue the audio generation
        state.tts.process_message(text)
        
        # Collect audio from queue with proper buffering
        audio_data = b""
        import queue
        
        # Wait for audio to be generated
        max_iterations = 300  # ~30 seconds with 100ms waits
        iterations = 0
        
        while iterations < max_iterations:
            try:
                buffer = state.tts.audio_queue.get(timeout=0.1)
                audio_data += buffer
                state.tts.audio_queue.task_done()
                iterations = 0  # Reset on successful read
            except queue.Empty:
                iterations += 1
                # Every 10 iterations, check if speaking is done
                if iterations % 10 == 0 and not state.tts.is_speaking:
                    break
            except Exception:
                break
        
        if audio_data:
            logger.debug(f"TTS generated {len(audio_data)} bytes of audio")
            return audio_data
        else:
            logger.warning("TTS generated no audio")
            return None
    
    except Exception as e:
        logger.error(f"Error in _generate_tts_audio: {e}")
        return None


# ============================================================================
# MESSAGE HANDLER
# ============================================================================

async def handle_transcript_message(websocket: WebSocket, message: Dict[str, Any]):
    """
    Handle incoming transcript from frontend.
    Pipeline:
      1. Receive transcript from frontend (voice.ts)
      2. Clean & correct speech-to-text errors
      3. Save user input to memory
      4. Pass to Nova AI for processing
      5. Save AI response to memory (nova_ai_memory.json)
      6. Generate audio via Cartesia TTS
      7. Send response_text + response_audio to frontend
    """
    raw_text = message.get("text", "").strip()
    is_final = message.get("isFinal", False)
    
    if not raw_text or not is_final:
        return
    
    # Step 1: Apply speech corrections
    text = apply_speech_corrections(raw_text)
    
    if raw_text != text:
        logger.info(f"[FIX] Speech corrected: '{raw_text}' -> '{text}'")
    
    # Deduplication check
    transcript_hash = hash(text)
    if transcript_hash in state.processed_transcripts:
        logger.warning(f"[WARNING] Duplicate transcript detected, ignoring")
        return
    state.processed_transcripts.add(transcript_hash)
    
    if len(state.processed_transcripts) > 1000:
        state.processed_transcripts.clear()
    
    try:
        # Prevent overlapping requests
        if state.is_processing:
            logger.warning("[WARNING] Already processing a request, ignoring new input")
            return
        
        state.is_processing = True
        logger.info(f"\n{'='*60}")
        logger.info(f"  [VOICE PIPELINE START]")
        logger.info(f"  User Input: {text}")
        logger.info(f"{'='*60}\n")
        
        # Send thinking status immediately
        await ws_manager.send_to_client(websocket, {
            "type": "status",
            "state": "thinking",
            "message": "Processing your request..."
        })
        
        # Check if Nova AI is available
        if not state.nova_ai or not state.nova_ai.is_running:
            logger.error("[ERROR] Nova AI process not running")
            await ws_manager.send_to_client(websocket, {
                "type": "response",
                "text": "Sorry, the AI system is not available. Please restart the server.",
                "audio": None,
                "error": True
            })
            state.is_processing = False
            return
        
        # Step 1: Send user input to Nova AI subprocess
        logger.info(f"  [1/4] Calling Nova AI subprocess...")
        response_text = await state.nova_ai.send_message(text, timeout=30.0)
        
        if not response_text:
            logger.error("  [FAILED] No response from Nova AI subprocess")
            await ws_manager.send_to_client(websocket, {
                "type": "response",
                "text": "Sorry, I didn't get a response from Nova AI. Please try again.",
                "audio": None,
                "error": True
            })
            state.is_processing = False
            return
        
        logger.info(f"  [2/4] Nova AI Response: {response_text}\n")
        
        # DISABLE MICROPHONE before starting TTS to prevent feedback loop
        logger.info(f"  [2.5/4] Disabling microphone (preventing feedback loop)...")
        await ws_manager.send_to_client(websocket, {
            "type": "mic_control",
            "action": "disable",
            "reason": "AI voice playing - prevent microphone feedback"
        })
        
        # Send response text immediately
        logger.info(f"  [3/4] Generating audio via ElevenLabs TTS...")
        logger.info(f"       Text length: {len(response_text)} chars")
        audio_b64 = await generate_audio_base64(response_text)
        
        # Step 3: Send audio once ready
        if audio_b64:
            logger.info(f"  [4/4] Audio generated ({len(audio_b64)} chars base64)")
            await ws_manager.send_to_client(websocket, {
                "type": "response_audio",
                "audio": audio_b64,
                "format": "mp3",
                "timestamp": datetime.now().isoformat()
            })
            logger.info(f"\n{'='*60}")
            logger.info(f"  [VOICE PIPELINE COMPLETE]")
            logger.info(f"  Voice: Generated and sent to frontend")
            logger.info(f"{'='*60}\n")
            
            # Estimate audio duration (rough: ~150 chars per second)
            # Add buffer to ensure audio finishes before re-enabling mic
            estimated_duration = max(2, len(response_text) / 150.0)
            logger.info(f"  Waiting for audio playback (~{estimated_duration:.1f}s)...")
            await asyncio.sleep(estimated_duration + 0.5)
            
            # RE-ENABLE MICROPHONE after audio finishes
            logger.info(f"  Audio finished - re-enabling microphone")
            await ws_manager.send_to_client(websocket, {
                "type": "mic_control",
                "action": "enable",
                "reason": "AI voice finished - microphone available"
            })
        else:
            logger.error(f"  [4/4] TTS generation FAILED - no audio")
            # Still re-enable mic even if TTS failed
            await ws_manager.send_to_client(websocket, {
                "type": "mic_control",
                "action": "enable",
                "reason": "TTS failed - re-enabling microphone"
            })
            await ws_manager.send_to_client(websocket, {
                "type": "response_audio",
                "audio": None,
                "format": "mp3",
                "timestamp": datetime.now().isoformat()
            })
        
        # Send completion status
        await asyncio.sleep(0.2)
        logger.info(f"[OK] [COMPLETE] Response pipeline finished\n")
        await ws_manager.send_to_client(websocket, {
            "type": "status",
            "state": "idle",
            "message": "Ready for next command"
        })
    
    except Exception as e:
        logger.error(f"[ERROR] Error handling transcript: {e}")
        import traceback
        traceback.print_exc()
        
        await ws_manager.send_to_client(websocket, {
            "type": "response",
            "text": f"Error processing request: {str(e)}",
            "audio": None,
            "error": True
        })
    
    finally:
        state.is_processing = False


# ============================================================================
# LIFESPAN CONTEXT
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manage application lifespan (startup/shutdown)
    """
    # Startup
    logger.info("="*70)
    logger.info("JARVIS SERVER STARTUP")
    logger.info("="*70)
    logger.info(f"[->] Starting server on {ServerConfig.HOST}:{ServerConfig.PORT}")
    logger.info(f"[NET] WebSocket endpoint: ws://localhost:{ServerConfig.PORT}{ServerConfig.WS_ENDPOINT}")
    logger.info(f"[CONNECT] REST API: http://localhost:{ServerConfig.PORT}")
    
    await state.initialize()
    
    logger.info("[TASK] Server ready to accept connections")
    logger.info("="*70)
    
    yield
    
    # Shutdown
    logger.info("="*70)
    logger.info("JARVIS SERVER SHUTDOWN")
    logger.info("="*70)
    await state.shutdown()
    logger.info("="*70)


# ============================================================================
# FASTAPI APP SETUP
# ============================================================================

app = FastAPI(
    title="JARVIS Server",
    description="WebSocket-based AI Backend for Nova AI",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Note: Frontend is served by Vite dev server on port 5173
# In production, frontend would be built to /dist and served separately
# Backend only provides WebSocket API at /ws/voice
# Mounting StaticFiles at "/" would interfere with WebSocket connections,
# so we don't mount static files here in dev mode


# ============================================================================
# WEBSOCKET ENDPOINT
# ============================================================================

@app.websocket(ServerConfig.WS_ENDPOINT)
async def websocket_endpoint(websocket: WebSocket):
    """
    Main WebSocket endpoint for real-time AI voice communication.
    
    Message Protocol:
    - Client → Server:
        {
            "type": "transcript",
            "text": "user message",
            "isFinal": true
        }
    
    - Server → Client (Audio Pipeline):
        1. {"type": "status", "state": "thinking"}
        2. {"type": "response_text", "text": "AI response"}
        3. {"type": "response_audio", "audio": "base64_audio", "format": "pcm", "sampleRate": 48000}
        4. {"type": "status", "state": "idle"}
    
    The audio (step 3) is decoded by the frontend's Web Audio API pipeline:
    - AudioContext.decodeAudioData() converts Base64 → AudioBuffer
    - AnalyserNode extracts real-time frequency data
    - Audio queuing system handles multiple segments seamlessly
    - Frequency data drives the visual Orb animation in orb.ts
    """
    await ws_manager.connect(websocket)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                msg_type = message.get("type", "unknown")
                
                logger.debug(f"📨 WebSocket message: {msg_type}")
                
                # Route message based on type
                if msg_type == "transcript":
                    await handle_transcript_message(websocket, message)
                elif msg_type == "widget_action_result":
                    logger.info(
                        "[WIDGET] Frontend result: %s %s [%s] %s",
                        message.get("widget"),
                        message.get("command"),
                        message.get("status"),
                        message.get("detail", ""),
                    )
                    await ws_manager.send_to_client(websocket, {
                        "type": "widget_action_ack",
                        "widget": message.get("widget"),
                        "command": message.get("command"),
                        "request_id": message.get("request_id"),
                        "status": message.get("status"),
                    })
                elif msg_type == "ping":
                    await ws_manager.send_to_client(websocket, {"type": "pong"})
                else:
                    logger.warning(f"[WARNING] Unknown message type: {msg_type}")
            
            except json.JSONDecodeError as e:
                logger.error(f"[ERROR] Invalid JSON: {e}")
                await ws_manager.send_to_client(websocket, {
                    "type": "error",
                    "message": "Invalid JSON format"
                })
    
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"[ERROR] WebSocket error: {e}")
        ws_manager.disconnect(websocket)


# ============================================================================
# REST API ENDPOINTS
# ============================================================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "nova_ai_running": state.nova_ai.is_running if state.nova_ai else False,
        "nova_ai_initialized": state.nova_ai is not None,
        "active_connections": len(ws_manager.connections),
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/restart")
async def restart_server():
    """Restart the server"""
    logger.info("[RESTART] Restarting server...")
    await state.shutdown()
    await state.initialize()
    return {
        "status": "restarted",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/status")
async def get_status():
    """Get current server status"""
    return {
        "processing": state.is_processing,
        "connections": len(ws_manager.connections),
        "nova_ai_running": state.nova_ai.is_running if state.nova_ai else False,
        "session_id": state.current_user_session,
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/chat")
async def chat_rest(message: Dict[str, Any]):
    """
    REST API endpoint for chat (alternative to WebSocket).
    Sends message to Nova AI subprocess and returns response + audio.
    """
    text = message.get("text", "").strip()
    
    if not text:
        raise HTTPException(status_code=400, detail="Empty message")
    
    if not state.nova_ai or not state.nova_ai.is_running:
        raise HTTPException(status_code=503, detail="Nova AI not initialized")
    
    try:
        logger.info(f"Chat REST: {text[:50]}...")
        
        # Send message to Nova AI subprocess
        response = await state.nova_ai.send_message(text, timeout=30.0)
        
        if not response:
            raise Exception("No response from Nova AI")
        
        # Try to generate audio
        audio_b64 = await generate_audio_base64(response)
        
        return {
            "response": response,
            "audio": audio_b64,
            "format": "mp3",
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"[ERROR] Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcribe a browser-recorded utterance through the server-side Groq key."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return JSONResponse(
            status_code=503,
            content={"error": "GROQ_API_KEY is not configured for speech transcription."}
        )

    audio_bytes = await audio.read()
    if not audio_bytes:
        return JSONResponse(status_code=400, content={"error": "Uploaded audio is empty."})

    filename = audio.filename or "utterance.webm"
    content_type = audio.content_type or "audio/webm"

    try:
        response = await asyncio.to_thread(
            requests.post,
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {api_key}"},
            files={"file": (filename, audio_bytes, content_type)},
            data={
                "model": "whisper-large-v3-turbo",
                "response_format": "verbose_json",
                "temperature": "0",
            },
            timeout=45,
        )

        if response.status_code != 200:
            logger.error("[STT] Groq transcription request failed with HTTP %s", response.status_code)
            status_code = response.status_code if response.status_code in (400, 401, 413, 429) else 502
            return JSONResponse(
                status_code=status_code,
                content={"error": f"Speech transcription provider returned HTTP {response.status_code}."}
            )

        result = response.json()
        segments = result.get("segments") or []
        no_speech_values = [
            segment.get("no_speech_prob")
            for segment in segments
            if isinstance(segment, dict) and isinstance(segment.get("no_speech_prob"), (int, float))
        ]
        transcript = (result.get("text") or "").strip()
        no_speech_prob = max(no_speech_values) if no_speech_values else None

        logger.info("[STT] Transcribed utterance (%s bytes, %s chars)", len(audio_bytes), len(transcript))
        return {"text": transcript, "no_speech_prob": no_speech_prob}
    except requests.exceptions.Timeout:
        logger.error("[STT] Groq transcription request timed out")
        return JSONResponse(status_code=504, content={"error": "Speech transcription timed out."})
    except Exception as e:
        logger.error("[STT] Speech transcription failed: %s", e)
        return JSONResponse(status_code=500, content={"error": "Speech transcription failed."})


@app.post("/api/test/tts")
async def test_tts(data: Dict[str, Any]):
    """
    TEST ENDPOINT: Test the complete TTS pipeline
    Useful for debugging audio generation issues
    
    Request: {"text": "Hello, this is a test"}
    Response: {"audio": "base64_string", "success": true, "format": "mp3"}
    """
    text = data.get("text", "Hello, this is JARVIS. Testing the text to speech pipeline.").strip()
    
    logger.info(f"\n{'='*70}")
    logger.info("🧪 [TEST] Starting TTS pipeline test")
    logger.info(f"{'='*70}")
    logger.info(f"[LOG] Input text: {text[:100]}")
    
    try:
        # Step 1: Clean markdown
        cleaned = strip_markdown_for_tts(text)
        logger.info(f"[OK] Step 1 - Markdown stripped: {cleaned[:100]}")
        
        # Step 2: Call ElevenLabs
        logger.info(f"[TTS] Step 2 - Calling ElevenLabs API...")
        audio_b64 = await generate_audio_elevenlabs(cleaned)
        
        if not audio_b64:
            logger.error("[ERROR] Step 2 - ElevenLabs failed to generate audio")
            return {
                "success": False,
                "error": "ElevenLabs API failed",
                "debug_info": "Check backend logs for details"
            }
        
        logger.info(f"[OK] Step 2 - Audio generated: {len(audio_b64)} chars base64")
        logger.info(f"[OUTPUT] Step 3 - Audio ready for Web Audio API decoding")
        logger.info(f"   Format: MP3 (ElevenLabs)")
        logger.info(f"   Encoding: Base64")
        logger.info(f"   Frontend will: AudioContext.decodeAudioData(buffer)")
        logger.info(f"   Then: Play via AnalyserNode → Orb animation sync")
        logger.info(f"{'='*70}\n")
        
        return {
            "success": True,
            "audio": audio_b64,
            "format": "mp3",
            "size_bytes": len(audio_b64),
            "message": "Audio generated successfully - can be played by frontend Web Audio API",
            "next_steps": [
                "1. Frontend receives this Base64 audio",
                "2. AudioContext.decodeAudioData(buffer) decodes MP3",
                "3. AudioBufferSourceNode queues decoded audio",
                "4. AnalyserNode extracts frequency data in real-time",
                "5. Orb animation syncs with audio frequencies"
            ]
        }
    
    except Exception as e:
        logger.error(f"[ERROR] TTS test failed: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "debug_info": "Check backend logs for full traceback"
        }


@app.post("/api/test/full-pipeline")
async def test_full_pipeline(data: Dict[str, Any]):
    """
    TEST ENDPOINT: Test the complete user → Nova AI → TTS → Audio pipeline
    Simulates the full voice interaction without Web Speech API
    """
    user_text = data.get("text", "Hello Nova").strip()
    
    logger.info(f"\n{'='*70}")
    logger.info("🧪 [TEST] Starting full pipeline test")
    logger.info(f"{'='*70}")
    logger.info(f"[INPUT] [SIMULATE USER] Speaking: {user_text}")
    
    try:
        # Step 1: Simulate speech correction
        logger.info(f"[FIX] Step 1 - Applying speech corrections...")
        corrected = apply_speech_corrections(user_text)
        if user_text != corrected:
            logger.info(f"   Corrected: '{user_text}' → '{corrected}'")
        else:
            logger.info(f"   No corrections needed")
        
        # Step 2: Send to Nova AI subprocess
        if not state.nova_ai or not state.nova_ai.is_running:
            return {
                "success": False,
                "error": "Nova AI not initialized",
                "step": 2
            }
        
        logger.info(f"[AI] Step 2 - Sending to Nova AI subprocess...")
        ai_response = await state.nova_ai.send_message(corrected, timeout=30.0)
        
        if not ai_response:
            logger.error("   No response from Nova AI")
            return {
                "success": False,
                "error": "No response from Nova AI",
                "step": 2
            }
        
        logger.info(f"   Got response: {ai_response[:100]}...")
        
        # Step 3: Generate audio
        logger.info(f"[TTS] Step 3 - Generating audio via ElevenLabs...")
        audio_b64 = await generate_audio_base64(ai_response)
        
        if not audio_b64:
            logger.warning("[WARNING]  Audio generation failed, continuing with text only")
            has_audio = False
        else:
            logger.info(f"   Audio generated: {len(audio_b64)} chars base64")
            has_audio = True
        
        logger.info(f"{'='*70}\n")
        
        return {
            "success": True,
            "user_input": user_text,
            "corrected_input": corrected,
            "ai_response": ai_response,
            "audio": audio_b64 if has_audio else None,
            "has_audio": has_audio,
            "format": "mp3" if has_audio else None,
            "message": "Full pipeline test complete"
        }
    
    except Exception as e:
        logger.error(f"[ERROR] Full pipeline test failed: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "debug_info": "Check backend logs for full traceback"
        }


@app.post("/api/memory/store")
async def store_memory(data: Dict[str, Any]):
    """
    Store information in long-term memory
    Note: Memory is managed by Nova AI process directly
    """
    try:
        content = data.get("content", "")
        memory_type = data.get("type", "fact")
        
        # Return info about memory storage
        return {
            "status": "stored",
            "content": content,
            "type": memory_type,
            "note": "Memory is managed by Nova AI process",
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"[ERROR] Memory store error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/memory/recall")
async def recall_memory(query: str):
    """
    Recall information from long-term memory
    Note: Memory is managed by Nova AI process directly
    """
    try:
        return {
            "query": query,
            "memories": [],
            "count": 0,
            "note": "Memory is managed by Nova AI process",
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"[ERROR] Memory recall error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/session/new")
async def create_new_session(data: Dict[str, Any]):
    """Create a new conversation session"""
    session_id = data.get("session_id", f"session_{int(datetime.now().timestamp())}")
    state.current_user_session = session_id
    
    return {
        "session_id": session_id,
        "status": "created",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/logs")
async def get_logs(lines: int = 100):
    """Get recent server logs"""
    try:
        with open("jarvis_server.log", "r") as f:
            log_lines = f.readlines()[-lines:]
        return {
            "logs": log_lines,
            "count": len(log_lines),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "error": str(e),
            "logs": [],
            "timestamp": datetime.now().isoformat()
        }


@app.post("/api/generate-image")
async def generate_image_endpoint(data: Dict[str, Any]):
    """Generate an image using the configured Gemini/Google image model."""
    prompt = (data.get("prompt") or "").strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    config = load_image_generation_config()
    if not config.get("enabled", True):
        raise HTTPException(status_code=503, detail="Image generation is disabled in config")
    if config.get("provider") != "google":
        raise HTTPException(status_code=501, detail="Only Google image generation is supported currently")

    try:
        image_uri = await asyncio.to_thread(
            generate_image_with_google,
            prompt,
            config.get("model", "imagen-3.0-generate-001"),
            config.get("fallback_model", "imagen-2.0-generate-001"),
            config.get("api_key", "")
        )
        
        # Backup image after successful generation
        try:
            backup_filename = state.image_backup.save_image_backup(
                image_uri,
                prompt,
                config.get("provider", "google")
            )
            if backup_filename:
                logger.info(f"[IMAGE] Successfully backed up image: {backup_filename}")
            else:
                logger.warning("[IMAGE] Image backup returned None (may have already been logged)")
        except Exception as backup_error:
            # Log backup errors but don't interrupt the response
            logger.error(f"[IMAGE] Image backup failed (non-blocking): {backup_error}")
        
        return {
            "success": True,
            "image": image_uri,
            "prompt": prompt,
            "provider": config.get("provider"),
            "model": config.get("model")
        }
    except Exception as e:
        logger.error(f"[IMAGE] Image generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/generate-ai-audio")
async def generate_ai_audio(data: Dict[str, Any]):
    """
    Endpoint for generating audio from AI text and broadcasting to clients.
    
    This endpoint receives AI response text and:
    1. Generates audio via ElevenLabs TTS
    2. Broadcasts audio to ALL connected WebSocket clients
    3. Frontend receives and plays audio with orb animation sync
    
    Request: {"text": "AI response here"}
    Response: {"success": true, "audio": "base64", "sent_to_clients": N}
    """
    text = data.get("text", "").strip()
    
    if not text:
        logger.warning("[WARNING]  Empty text in /api/generate-ai-audio")
        return {
            "success": False,
            "error": "Empty text",
            "audio": None,
            "sent_to_clients": 0
        }
    
    logger.info(f"\n[BROADCAST] [AUDIO-GEN] Generating audio for text")
    logger.info(f"   Text: {text[:100]}...")
    
    try:
        # Generate audio via ElevenLabs
        logger.info(f"[TTS] [TTS] Generating audio...")
        audio_b64 = await generate_audio_base64(text)
        
        if not audio_b64:
            logger.error("[ERROR] [TTS] Failed to generate audio")
            return {
                "success": False,
                "error": "Audio generation failed",
                "audio": None,
                "sent_to_clients": 0
            }
        
        logger.info(f"[OK] [TTS] Audio generated: {len(audio_b64)} chars Base64")
        
        # Broadcast to all connected WebSocket clients
        broadcast_message = {
            "type": "response_audio",
            "audio": audio_b64,
            "format": "mp3",
            "timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"[BROADCAST] Broadcasting audio to {len(ws_manager.connections)} connected clients...")
        await ws_manager.broadcast(broadcast_message)
        
        logger.info(f"[OK] [COMPLETE] Audio broadcast to {len(ws_manager.connections)} clients\n")
        
        return {
            "success": True,
            "audio": audio_b64,
            "format": "mp3",
            "sent_to_clients": len(ws_manager.connections),
            "message": "Audio generated and broadcast to all connected clients"
        }
    
    except Exception as e:
        logger.error(f"[ERROR] [WATCHER ENDPOINT] Error: {e}")
        import traceback
        traceback.print_exc()
        
        return {
            "success": False,
            "error": str(e),
            "audio": None,
            "sent_to_clients": 0
        }


@app.get("/api/audio/diagnostics")
async def audio_diagnostics():
    """Diagnose the audio pipeline and Nova AI subprocess status"""
    return {
        "nova_ai_subprocess": {
            "running": state.nova_ai.is_running if state.nova_ai else False,
            "initialized": state.nova_ai.is_running if state.nova_ai else False,
            "process_id": state.nova_ai.process.pid if state.nova_ai and state.nova_ai.process else None
        },
        "tts_enabled": ServerConfig.TTS_ENABLED,
        "audio_format": {
            "codec": "mp3",
            "provider": "ElevenLabs",
            "webAudioCompatible": True
        },
        "pipeline": {
            "flow": "User Input → Nova AI (subprocess stdin/stdout) → ElevenLabs TTS → MP3 → Base64 → WebSocket → Web Audio API",
            "decoding": "AudioContext.decodeAudioData()",
            "analysis": "AnalyserNode with real-time frequency extraction",
            "visualization": "Orb animation synced to audio frequencies"
        },
        "timestamp": datetime.now().isoformat()
    }


# ============================================================================
# IMAGE BACKUP ENDPOINTS
# ============================================================================

@app.get("/api/images/backup/index")
async def get_image_backup_index():
    """Get the complete image backup index with all metadata"""
    try:
        index = state.image_backup.get_index()
        return {
            "success": True,
            "total_images": index.get("total_images", 0),
            "last_updated": index.get("last_updated"),
            "images": index.get("images", [])
        }
    except Exception as e:
        logger.error(f"[BACKUP] Failed to retrieve image index: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/images/backup/count")
async def get_image_backup_count():
    """Get total count of backed-up images"""
    try:
        count = state.image_backup.get_images_count()
        return {
            "success": True,
            "total_images": count
        }
    except Exception as e:
        logger.error(f"[BACKUP] Failed to get image count: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/images/backup/recent")
async def get_recent_backup_images(limit: int = 10):
    """Get most recent backed-up images with metadata"""
    try:
        if limit < 1 or limit > 100:
            limit = 10
        
        images = state.image_backup.get_recent_images(limit)
        return {
            "success": True,
            "count": len(images),
            "images": images
        }
    except Exception as e:
        logger.error(f"[BACKUP] Failed to retrieve recent images: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/images/backup/file/{filename}")
async def get_backup_image_file(filename: str):
    """
    Download a specific backed-up image file by filename.
    
    Example: GET /api/images/backup/file/20260525_143022_a1b2c3d4.jpg
    """
    try:
        # Security: sanitize filename to prevent path traversal
        if ".." in filename or "/" in filename or "\\" in filename:
            raise HTTPException(status_code=400, detail="Invalid filename")
        
        filepath = state.image_backup.get_image_by_id(filename)
        
        if not filepath:
            raise HTTPException(status_code=404, detail=f"Image not found: {filename}")
        
        logger.info(f"[BACKUP] Serving backed-up image: {filename}")
        
        # Determine MIME type from file extension
        ext = filepath.suffix.lower()
        mime_type = {
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".png": "image/png",
            ".webp": "image/webp",
            ".gif": "image/gif",
            ".bmp": "image/bmp"
        }.get(ext, "image/jpeg")
        
        return FileResponse(
            filepath,
            media_type=mime_type,
            filename=filename
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[BACKUP] Failed to retrieve image file {filename}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/images/backup/search")
async def search_backup_images(query: str):
    """
    Search backed-up images by prompt text (case-insensitive substring match).
    
    Example: GET /api/images/backup/search?query=landscape
    """
    try:
        if not query or len(query.strip()) < 2:
            raise HTTPException(status_code=400, detail="Query must be at least 2 characters")
        
        results = state.image_backup.search_by_prompt(query)
        return {
            "success": True,
            "query": query,
            "count": len(results),
            "results": results
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[BACKUP] Failed to search images: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/images/backup/provider/{provider}")
async def get_images_by_provider(provider: str):
    """
    Get all images generated by a specific provider.
    
    Example: GET /api/images/backup/provider/google
    """
    try:
        images = state.image_backup.get_images_by_provider(provider)
        return {
            "success": True,
            "provider": provider,
            "count": len(images),
            "images": images
        }
    except Exception as e:
        logger.error(f"[BACKUP] Failed to retrieve images by provider: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# CONFIGURATION & SERVER MANAGEMENT
# ============================================================================

@app.get("/api/config/status")
async def get_config_status():
    """
    Get current API configuration status
    Returns loaded API keys (masked for security)
    """
    try:
        # Load current API keys from environment
        api_keys = {
            "groq_api_key": os.getenv("GROQ_API_KEY", ""),
            "groq_api_key_status": bool(os.getenv("GROQ_API_KEY")),
            "elevenlabs_api_key": os.getenv("ELEVENLABS_API_KEY", "") or os.getenv("elevenlabs_api_key", ""),
            "elevenlabs_api_key_status": bool(os.getenv("ELEVENLABS_API_KEY") or os.getenv("elevenlabs_api_key")),
            "elevenlabs_voice_id": os.getenv("elevenlabs_voice_id", "") or os.getenv("ELEVENLABS_VOICE_ID", "MuWZEhlucXEKPv3WaubS"),
            "deepgram_api_key": os.getenv("DEEPGRAM_API_KEY", ""),
            "deepgram_api_key_status": bool(os.getenv("DEEPGRAM_API_KEY")),
        }
        
        return {
            "server_running": True,
            "server_port": 8340,
            "api_keys_loaded": api_keys,
            "uptime_seconds": 0
        }
    except Exception as e:
        logger.error(f"[CONFIG] Error getting status: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.post("/api/config/update")
async def update_config(config: Dict[str, Any]):
    """
    Update API configuration (API keys, voice IDs, etc.)
    Writes to .env file temporarily
    """
    try:
        env_file = Path(__file__).parent.parent.parent.parent / '.env'
        
        if not env_file.exists():
            return JSONResponse(
                status_code=400,
                content={"error": ".env file not found"}
            )
        
        # Read existing .env
        with open(env_file, 'r') as f:
            lines = f.readlines()
        
        # Update or add new keys
        env_dict = {}
        for line in lines:
            if '=' in line and not line.startswith('#'):
                key, value = line.strip().split('=', 1)
                env_dict[key] = value
        
        # Update with new values
        if 'groq_api_key' in config and config['groq_api_key']:
            env_dict['GROQ_API_KEY'] = config['groq_api_key']
        if 'elevenlabs_api_key' in config and config['elevenlabs_api_key']:
            env_dict['ELEVENLABS_API_KEY'] = config['elevenlabs_api_key']
        if 'elevenlabs_voice_id' in config and config['elevenlabs_voice_id']:
            env_dict['elevenlabs_voice_id'] = config['elevenlabs_voice_id']
        if 'deepgram_api_key' in config and config['deepgram_api_key']:
            env_dict['DEEPGRAM_API_KEY'] = config['deepgram_api_key']
        
        # Write back to .env
        with open(env_file, 'w') as f:
            for key, value in env_dict.items():
                f.write(f"{key}={value}\n")
        
        logger.info(f"[CONFIG] Updated .env with new API keys")
        return {"success": True, "message": "Configuration updated"}
    
    except Exception as e:
        logger.error(f"[CONFIG] Error updating config: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.post("/api/config/test")
async def test_config(config: Dict[str, Any]):
    """
    Test API keys before saving
    Returns status of each API key
    """
    results = {
        "groq": {"success": False, "error": None},
        "elevenlabs": {"success": False, "error": None},
        "deepgram": {"success": False, "error": None},
    }
    
    # Test Groq API
    if config.get('groq_api_key'):
        try:
            import requests as req
            response = req.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {config['groq_api_key']}"},
                json={
                    "model": "mixtral-8x7b-32768",
                    "messages": [{"role": "user", "content": "test"}],
                    "max_tokens": 1
                },
                timeout=5
            )
            results["groq"]["success"] = response.status_code == 200
            if response.status_code != 200:
                results["groq"]["error"] = f"HTTP {response.status_code}"
        except Exception as e:
            results["groq"]["error"] = str(e)
    
    # Test ElevenLabs API
    if config.get('elevenlabs_api_key'):
        try:
            import requests as req
            voice_id = config.get('elevenlabs_voice_id', 'pNInz6obpgDQGcFmaJgO')
            response = req.get(
                f"https://api.elevenlabs.io/v1/voices/{voice_id}",
                headers={"xi-api-key": config['elevenlabs_api_key']},
                timeout=5
            )
            results["elevenlabs"]["success"] = response.status_code == 200
            if response.status_code != 200:
                results["elevenlabs"]["error"] = f"HTTP {response.status_code}"
        except Exception as e:
            results["elevenlabs"]["error"] = str(e)
    
    # Test Deepgram API
    if config.get('deepgram_api_key'):
        try:
            import requests as req
            response = req.get(
                "https://api.deepgram.com/v1/status",
                headers={"Authorization": f"Token {config['deepgram_api_key']}"},
                timeout=5
            )
            results["deepgram"]["success"] = response.status_code == 200
            if response.status_code != 200:
                results["deepgram"]["error"] = f"HTTP {response.status_code}"
        except Exception as e:
            results["deepgram"]["error"] = str(e)
    
    logger.info(f"[CONFIG] Test results: {results}")
    return results


@app.post("/api/server/restart")
async def restart_server():
    """
    Restart the backend server
    Gracefully shuts down and restarts
    """
    try:
        logger.warning("[SERVER] Restart requested - shutting down...")
        
        # Close Nova AI process
        if state.nova_ai:
            state.nova_ai.stop()
        
        # Broadcast to clients
        await ws_manager.broadcast({
            "type": "system",
            "message": "Server restarting...",
            "status": "restarting"
        })
        
        logger.info("[SERVER] Shutdown sequence initiated")
        return {"success": True, "message": "Server restart initiated"}
    
    except Exception as e:
        logger.error(f"[SERVER] Error restarting: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.get("/api/settings/status")
async def get_settings_status():
    """
    Get complete system status for the settings panel
    Reports which services are actually connected and working
    """
    try:
        # Check Nova AI subprocess connection
        nova_ai_connected = state.nova_ai and state.nova_ai.is_running
        
        # Check Google Calendar connection (placeholder - return False for now)
        # TODO: Implement Google Calendar API connection check
        google_calendar_accessible = False
        
        # Check Google Mail connection (placeholder - return False for now)
        # TODO: Implement Google Mail API connection check
        google_mail_accessible = False
        
        # Check which API keys are configured in environment
        env_keys_set = {
            "groq": bool(os.getenv("GROQ_API_KEY")),
            "elevenlabs": bool(os.getenv("ELEVENLABS_API_KEY") or os.getenv("elevenlabs_api_key")),
            "elevenlabs_voice_id": bool(os.getenv("elevenlabs_voice_id") or os.getenv("ELEVENLABS_VOICE_ID"))
        }
        
        # Get system info
        uptime = time.time() - state.start_time
        
        return {
            "nova_ai_connected": nova_ai_connected,
            "google_calendar_accessible": google_calendar_accessible,
            "google_mail_accessible": google_mail_accessible,
            "server_port": ServerConfig.PORT,
            "uptime_seconds": int(uptime),
            "env_keys_set": env_keys_set,
            "memory_count": 0,  # Placeholder
            "task_count": len(ws_manager.connections) if ws_manager else 0,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"[SETTINGS] Error getting status: {e}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )


@app.post("/api/settings/test-elevenlabs")
async def test_elevenlabs(data: Dict[str, Any]):
    """
    Test ElevenLabs API key by attempting a simple request
    """
    try:
        api_key = data.get("api_key", "").strip()
        
        if not api_key:
            return JSONResponse(
                status_code=400,
                content={"valid": False, "error": "API key cannot be empty"}
            )
        
        # Test ElevenLabs API by getting list of voices
        headers = {
            "xi-api-key": api_key,
            "Content-Type": "application/json"
        }
        
        response = requests.get(
            "https://api.elevenlabs.io/v1/voices",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            logger.info("[ELEVENLABS] Test passed - API key is valid")
            return {
                "valid": True,
                "message": "ElevenLabs API key is valid"
            }
        elif response.status_code == 401:
            logger.warning("[ELEVENLABS] Test failed - Invalid API key")
            return {
                "valid": False,
                "error": "Invalid API key"
            }
        else:
            logger.warning(f"[ELEVENLABS] Test failed - HTTP {response.status_code}")
            return {
                "valid": False,
                "error": f"ElevenLabs API error: HTTP {response.status_code}"
            }
    
    except requests.exceptions.Timeout:
        logger.error("[ELEVENLABS] Test timeout")
        return {
            "valid": False,
            "error": "Request timeout - check your internet connection"
        }
    except Exception as e:
        logger.error(f"[ELEVENLABS] Test error: {e}")
        return {
            "valid": False,
            "error": str(e)
        }


@app.post("/api/settings/test-groq")
async def test_groq(data: Dict[str, Any]):
    """
    Test Groq API key by attempting a simple request
    """
    try:
        api_key = data.get("api_key", "").strip()
        
        if not api_key:
            return JSONResponse(
                status_code=400,
                content={"valid": False, "error": "API key cannot be empty"}
            )
        
        # Test Groq API by making a simple chat completion request
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "messages": [{"role": "user", "content": "Say 'test'"}],
            "model": "mixtral-8x7b-32768",
            "max_tokens": 10
        }
        
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            logger.info("[GROQ] Test passed - API key is valid")
            return {
                "valid": True,
                "message": "Groq API key is valid"
            }
        elif response.status_code == 401:
            logger.warning("[GROQ] Test failed - Invalid API key")
            return {
                "valid": False,
                "error": "Invalid API key"
            }
        else:
            logger.warning(f"[GROQ] Test failed - HTTP {response.status_code}")
            return {
                "valid": False,
                "error": f"Groq API error: HTTP {response.status_code}"
            }
    
    except requests.exceptions.Timeout:
        logger.error("[GROQ] Test timeout")
        return {
            "valid": False,
            "error": "Request timeout - check your internet connection"
        }
    except Exception as e:
        logger.error(f"[GROQ] Test error: {e}")
        return {
            "valid": False,
            "error": str(e)
        }


@app.post("/api/settings/keys")
async def save_api_keys(data: Dict[str, Any]):
    """
    Save API keys to environment (.env file)
    Expects: {"key_name": "GROQ_API_KEY", "key_value": "..."}
    """
    try:
        key_name = data.get("key_name", "").strip()
        key_value = data.get("key_value", "").strip()
        
        if not key_name or not key_value:
            return JSONResponse(
                status_code=400,
                content={"success": False, "error": "Key name and value required"}
            )

        # Normalize commonly used key names for consistent env storage
        if key_name.lower() == "elevenlabs_api_key":
            key_name = "ELEVENLABS_API_KEY"
        elif key_name.lower() == "groq_api_key":
            key_name = "GROQ_API_KEY"
        elif key_name.lower() == "deepgram_api_key":
            key_name = "DEEPGRAM_API_KEY"
        elif key_name.lower() == "elevenlabs_voice_id":
            key_name = "elevenlabs_voice_id"
        
        # Get .env file path
        env_file = Path(__file__).parent.parent.parent.parent / '.env'
        
        if not env_file.exists():
            # Create .env if it doesn't exist
            env_file.touch()
            logger.info(f"[SETTINGS] Created new .env file: {env_file}")
        
        # Read current .env content
        env_content = env_file.read_text() if env_file.exists() else ""
        lines = env_content.split('\n')
        
        # Find and update or add the key
        found = False
        new_lines = []
        for line in lines:
            if line.startswith(f"{key_name}="):
                new_lines.append(f"{key_name}={key_value}")
                found = True
            elif line.strip():  # Keep non-empty lines
                new_lines.append(line)
            else:
                new_lines.append(line)
        
        # If key wasn't found, add it
        if not found:
            if new_lines and new_lines[-1].strip():  # Add newline if needed
                new_lines.append("")
            new_lines.append(f"{key_name}={key_value}")
        
        # Write back to .env
        env_file.write_text('\n'.join(new_lines))
        
        # Reload environment variables
        load_dotenv(env_file, override=True)
        
        logger.info(f"[SETTINGS] Saved {key_name} to .env")
        
        return {
            "success": True,
            "message": f"API key {key_name} saved successfully"
        }
    
    except Exception as e:
        logger.error(f"[SETTINGS] Error saving keys: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"[ERROR] Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "timestamp": datetime.now().isoformat()}
    )


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    logger.info("="*70)
    logger.info("NOVA AI BACKEND - WebSocket Server")
    logger.info("="*70)
    logger.info(f"[>] WebSocket Endpoint:  ws://localhost:{ServerConfig.PORT}{ServerConfig.WS_ENDPOINT}")
    logger.info(f"[>] REST API:            http://localhost:{ServerConfig.PORT}/api")
    logger.info("")
    logger.info("[*] ARCHITECTURE:")
    logger.info("   - Nova AI runs as subprocess (independent process)")
    logger.info("   - Communication via stdin/stdout (native execution)")
    logger.info("   - All memory/sessions/logs work normally")
    logger.info("")
    logger.info("[*] AUDIO PIPELINE:")
    logger.info("   - User Input -> Nova AI subprocess stdin")
    logger.info("   - Nova AI response -> stdout (extracted)")
    logger.info("   - Response -> ElevenLabs TTS -> MP3")
    logger.info("   - MP3 -> Base64 -> WebSocket broadcast")
    logger.info("   - Web Audio API decode -> Orb animation sync")
    logger.info("")
    logger.info("[*] INPUT FLOW:")
    logger.info("   1. User speaks (Web Speech API)")
    logger.info("   2. Server gets transcript")
    logger.info("   3. Server sends to Nova AI stdin (EXACTLY as-is)")
    logger.info("   4. Nova AI processes naturally")
    logger.info("   5. Server captures stdout -> extract response")
    logger.info("   6. Generate audio via ElevenLabs")
    logger.info("   7. Broadcast to WebSocket clients")
    logger.info("="*70)
    logger.info("")
    
    uvicorn.run(
        app,
        host=ServerConfig.HOST,
        port=ServerConfig.PORT,
        log_level="info"
    )
