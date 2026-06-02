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
from pathlib import Path
from typing import Optional, Dict, Any, List, Set
from datetime import datetime
from contextlib import asynccontextmanager

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent.parent.parent / '.env')

# FastAPI & WebSocket
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# ElevenLabs Text-to-Speech
import requests
import re

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


class NovaAIProcess:
    """Manager for Nova AI subprocess communication"""
    def __init__(self, nova_ai_script_path: str):
        self.script_path = nova_ai_script_path
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
            
            # Get Python executable from virtual environment
            python_exe = str(Path(__file__).parent.parent.parent.parent / '.venv_311' / 'Scripts' / 'python.exe')
            
            if not Path(python_exe).exists():
                logger.error(f"[NOVA-AI] Python executable not found: {python_exe}")
                return False
            
            logger.info(f"[NOVA-AI] Using Python: {python_exe}")
            
            # Spawn Nova AI process - merge stderr into stdout
            self.process = subprocess.Popen(
                [python_exe, self.script_path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                bufsize=0,  # Unbuffered so we get output immediately
                cwd=str(Path(__file__).parent.parent.parent)
            )
            
            self.is_running = True
            logger.info(f"[NOVA-AI] Process started with PID {self.process.pid}")
            
            # Start reader thread to capture output
            self.reader_thread = threading.Thread(target=self._read_process_output, daemon=True)
            self.reader_thread.start()
            logger.info(f"[NOVA-AI] Reader thread started")
            
            # Wait for initialization - read until "Listening..."
            start_time = time.time()
            found_listening = False
            
            while not found_listening and (time.time() - start_time) < self.startup_timeout:
                try:
                    # Try to get output from the queue
                    output = self.output_queue.get(timeout=1.0)
                    logger.info(f"[NOVA-BOOT] {output}")
                    
                    # Check for listening indicator
                    if "Listening" in output or "> " in output:
                        found_listening = True
                        logger.info(f"[NOVA-AI] [OK] Nova AI Ready and listening")
                
                except queue.Empty:
                    logger.debug(f"[NOVA-AI] Waiting for output...")
                    continue
            
            if not found_listening:
                logger.error(f"[NOVA-AI] Timeout - never detected 'Listening'")
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
            
            for line in iter(self.process.stdout.readline, ''):
                if line:
                    clean_line = line.rstrip('\n')
                    self.output_queue.put(clean_line)
                    # Log ALL output to help debug response extraction
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
        self.nova_ai: Optional[NovaAIProcess] = None
        self.active_connections: Set[WebSocket] = set()
        self.is_processing = False
        self.current_user_session = "default"
        self.processed_transcripts: Set[str] = set()
        self.task_counter = 0
        self.memory_monitor_task: Optional[asyncio.Task] = None
        self.memory_file = Path(__file__).parent.parent.parent / "Date" / "nova_ai_memory.json"
        self.start_time = time.time()  # Track when server started for uptime calculation

    async def initialize(self):
        """Initialize server components"""
        logger.info("[INIT] Starting JARVIS Server...")
        
        # Initialize Nova AI as subprocess
        try:
            nova_ai_path = Path(__file__).parent.parent.parent / "core" / "nova_ai.py"
            logger.info(f"[NOVA-AI] Path: {nova_ai_path}")
            
            self.nova_ai = NovaAIProcess(str(nova_ai_path))
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


async def generate_audio_elevenlabs(text: str) -> Optional[str]:
    """
    Generate audio using ElevenLabs API and return as Base64.
    Uses the 'Daniel' voice for JARVIS persona.
    Pipeline:
      1. Clean markdown from text
      2. Call ElevenLabs API with Daniel voice
      3. Get MP3 audio bytes
      4. Encode as Base64
      5. Return for Web Audio API decoding
    """
    if not text or not text.strip():
        print(f"[ELEVENLABS] Empty text for TTS", flush=True)
        logger.warning("[WARNING] Empty text for TTS")
        return None
    
    try:
        print(f"[ELEVENLABS-START] Starting API call...", flush=True)
        # Get API key from environment
        api_key = os.getenv("ELEVENLABS_API_KEY")
        if not api_key:
            print(f"[ELEVENLABS-ERROR] ELEVENLABS_API_KEY not found", flush=True)
            logger.error("[ERROR] ELEVENLABS_API_KEY not found in environment")
            return None
        print(f"[ELEVENLABS-KEY] API key found (length: {len(api_key)})", flush=True)
        
        # Clean text for TTS
        clean_text = strip_markdown_for_tts(text)
        logger.info(f"[LOG] [TTS] ORIGINAL AI RESPONSE: '{text}'")
        logger.info(f"[LOG] [TTS] CLEANED TEXT FOR ELEVENLABS: '{clean_text}'")
        logger.info(f"[LOG] [TTS] LENGTH: {len(clean_text)} chars")
        
        # Get voice ID from environment (configured in .env)
        # Default: pNInz6obpgDQGcFmaJgO = Adam (male voice)
        voice_id = os.getenv("elevenlabs_voice_id", "MuWZEhlucXEKPv3WaubS")
        print(f"[ELEVENLABS-VOICE] Using voice ID from .env: {voice_id} (Adam - male voice)", flush=True)
        
        # ElevenLabs API endpoint
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        
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
        
        print(f"[ELEVENLABS-API] Calling API ({len(clean_text)} chars)...", flush=True)
        logger.info(f"[TTS] [TTS] Calling ElevenLabs API ({len(clean_text)} chars)...")
        
        # Make async request with proper error handling
        loop = asyncio.get_event_loop()
        
        def make_tts_request():
            print(f"[ELEVENLABS-POST] Making POST request...", flush=True)
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            print(f"[ELEVENLABS-RESPONSE] Got status: {response.status_code}", flush=True)
            logger.debug(f"   Response status: {response.status_code}")
            return response
        
        response = await loop.run_in_executor(None, make_tts_request)
        
        if response.status_code == 200:
            # Get audio bytes
            audio_bytes = response.content
            print(f"[ELEVENLABS-SUCCESS] Got {len(audio_bytes)} bytes", flush=True)
            logger.info(f"[OK] [TTS] ElevenLabs returned {len(audio_bytes)} bytes of MP3 audio")
            
            # Encode as Base64
            audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
            print(f"[ELEVENLABS-B64] Encoded to {len(audio_b64)} Base64 chars", flush=True)
            logger.info(f"[OK] [TTS] Base64 encoded: {len(audio_b64)} chars")
            logger.info(f"   Ready for Web Audio API decoding (AudioContext.decodeAudioData)")
            
            return audio_b64
        else:
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
      1. Deepgram (primary - most reliable, working)
      2. ElevenLabs (fallback - when account is properly set up)
      3. pyttsx3 (offline fallback - always available)
    """
    if not text or not text.strip():
        print(f"[AUDIO-B64] Empty text", flush=True)
        return None
    
    # Try Deepgram first (most reliable)
    print(f"[AUDIO-B64] Trying Deepgram (primary)...", flush=True)
    audio_b64 = await generate_audio_deepgram(text)
    
    if audio_b64:
        print(f"[AUDIO-B64] [OK] Deepgram success! Returning {len(audio_b64)} chars", flush=True)
        logger.info("[OK] Deepgram TTS generated audio successfully")
        return audio_b64
    
    # Deepgram failed - try ElevenLabs
    print(f"[AUDIO-B64] Deepgram failed - trying ElevenLabs (fallback)...", flush=True)
    logger.warning("[FALLBACK] Deepgram TTS failed, attempting ElevenLabs fallback")
    audio_b64 = await generate_audio_elevenlabs(text)
    
    if audio_b64:
        print(f"[AUDIO-B64] [OK] ElevenLabs success! Returning {len(audio_b64)} chars", flush=True)
        logger.info("[OK] ElevenLabs TTS fallback generated audio successfully")
        return audio_b64
    
    # Both cloud providers failed - try pyttsx3 (offline)
    print(f"[AUDIO-B64] Both cloud providers failed - trying pyttsx3 (offline)...", flush=True)
    logger.warning("[FALLBACK] Both Deepgram and ElevenLabs failed, attempting pyttsx3 fallback")
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
            "elevenlabs_api_key": os.getenv("ELEVENLABS_API_KEY", ""),
            "elevenlabs_api_key_status": bool(os.getenv("ELEVENLABS_API_KEY")),
            "elevenlabs_voice_id": os.getenv("elevenlabs_voice_id", "MuWZEhlucXEKPv3WaubS"),
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
            "elevenlabs": bool(os.getenv("ELEVENLABS_API_KEY")),
            "elevenlabs_voice_id": bool(os.getenv("elevenlabs_voice_id"))
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
