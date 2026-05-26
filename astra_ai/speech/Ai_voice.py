import os
from pathlib import Path
import pyaudio
import numpy as np
from dataclasses import dataclass
from typing import Optional, Dict, Any, List, Set
import json
import time
import threading
import queue
import re
import base64

# Try to import file monitoring - fallback to polling if not available
try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
    WATCHDOG_AVAILABLE = True
except ImportError:
    WATCHDOG_AVAILABLE = False
    print("⚠️ Watchdog not available - using polling mode. Install with: pip install watchdog")

class AIResponseFileHandler(FileSystemEventHandler):
    """OLD SYSTEM DISABLED - File system event handler for monitoring unified_messages.json changes"""

    def __init__(self, tts_instance):
        self.tts_instance = tts_instance
        self.last_modified = 0
        self.last_processed_hash = None

    def on_modified(self, event):
        if event.is_directory:
            return

        # Check if it's the speech_input.json file
        if event.src_path.endswith('speech_input.json'):
            # Avoid duplicate processing of rapid file changes
            current_time = time.time()
            if current_time - self.last_modified < 0.2:  # 200ms debounce (increased)
                return
            self.last_modified = current_time

            # Additional check: don't process if voice system is busy
            if self.tts_instance.is_voice_busy():
                return

            # File changed - check for new messages silently
            # Small delay to ensure file write is complete
            time.sleep(0.1)
            self.tts_instance.check_for_new_messages()

@dataclass
class CartesiaConfig:
    api_key: str = 'sk_car_VqWy79RSCgcBda6TtbJW1A'
    voice_id: str = "5ee9feff-1265-424a-9d7f-8e4d431a12c7"
    model_id: str = "sonic-english"
    sample_rate: int = 48000  # Increased sample rate for better quality
    volume_multiplier: float = 1.2  # Adjusted to prevent distortion
    chunk_size: int = 2048  # Optimized chunk size for streaming

    # Note: These are for reference but not directly used by the API
    speech_rate: float = 1.1  # For documentation purposes - not used in API calls

    @property
    def output_format(self) -> Dict[str, Any]:
        return {
            "container": "raw",
            "encoding": "pcm_f32le",
            "sample_rate": self.sample_rate,
        }


class TextProcessor:
    """Process text for better TTS results"""
    
    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and normalize text for better speech synthesis"""
        # Replace URLs with a brief mention
        text = re.sub(r'https?://\S+', 'link', text)
        
        # Add pauses after sentences for more natural speech
        text = re.sub(r'([.!?])\s+', r'\1, ', text)
        
        # Handle special characters
        text = text.replace('*', '')
        text = text.replace('_', '')
        text = text.replace('#', 'hashtag ')
        
        return text
    
    @staticmethod
    def chunk_text(text: str, max_chunk_size: int = 300) -> List[str]:
        """Break text into smaller chunks for more efficient processing"""
        # Split by sentences first
        sentences = re.split(r'(?<=[.!?])\s+', text)
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk) + len(sentence) < max_chunk_size:
                current_chunk += " " + sentence if current_chunk else sentence
            else:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                current_chunk = sentence
                
        if current_chunk:
            chunks.append(current_chunk.strip())
            
        return chunks


class AudioEnhancer:
    """Enhance audio quality"""
    
    @staticmethod
    def normalize_audio(buffer: bytes) -> bytes:
        """Normalize audio to prevent clipping"""
        audio_data = np.frombuffer(buffer, dtype=np.float32).copy()  # Create a copy to make it writable
        
        # Apply normalization if needed
        max_val = np.max(np.abs(audio_data))
        if max_val > 0.95:  # Only normalize if close to clipping
            audio_data = audio_data * (0.95 / max_val)
            
        return audio_data.tobytes()
    
    @staticmethod
    def amplify_audio(buffer: bytes, volume_multiplier: float) -> bytes:
        """Amplify audio with smart clipping prevention"""
        audio_data = np.frombuffer(buffer, dtype=np.float32).copy()  # Create a copy to make it writable
        
        # Apply volume multiplier first
        audio_data = audio_data * volume_multiplier
        
        # Simple soft clipping to prevent distortion
        audio_data = np.clip(audio_data, -0.95, 0.95)
        
        return audio_data.tobytes()


class TextToSpeech:
    def __init__(self, cartesia_config: CartesiaConfig, service_mode: bool = False, ai_responses_file: str = None):
        self.cartesia_config = cartesia_config
        self.processed_messages_file = 'processed_messages.json'
        self.processed_messages = self.load_processed_messages()
        self.text_processor = TextProcessor()
        self.audio_enhancer = AudioEnhancer()
        self.audio_queue = queue.Queue()
        self.is_speaking = False
        self.current_message_chunks = []
        self.cartesia_client = None
        self.observer = None  # OLD SYSTEM DISABLED - File observer for monitoring unified_messages.json changes
        self.service_mode = service_mode  # Run as background service
        self.voice_thread = None  # Background thread for voice processing
        self.is_running = False  # Service running state
        self.stop_event = threading.Event()  # Event to stop the service

        # Set the speech_input.json file path
        self.ai_responses_file = ai_responses_file or "speech_input.json"

        # Voice deduplication and synchronization
        self.processing_lock = threading.Lock()  # Lock for critical sections
        self.currently_processing = set()  # Track messages currently being processed
        self.speaking_lock = threading.Lock()  # Lock for speech synthesis
        self.current_speaking_id = None  # ID of currently speaking message

        # Web voice integration
        self.web_voice_enabled = False
        self.web_audio_queue = queue.Queue()  # Queue for web audio data
        self.last_web_audio_data = None  # Store last audio for web streaming

    def load_processed_messages(self) -> Set[str]:
        """Load processed message IDs from a file"""
        try:
            with open(self.processed_messages_file, 'r', encoding='utf-8') as f:
                return set(json.load(f))
        except (FileNotFoundError, json.JSONDecodeError):
            return set()

    def save_processed_messages(self):
        """Save processed message IDs to a file"""
        try:
            with open(self.processed_messages_file, 'w', encoding='utf-8') as f:
                json.dump(list(self.processed_messages), f)
        except Exception as e:
            print(f"Error saving processed messages: {e}")

    def read_output_json(self, output_file=None) -> tuple:
        """Read AI output from JSON file with comprehensive filtering"""
        try:
            # Use the configured ai_responses_file if no output_file is specified
            if output_file is None:
                output_file = self.ai_responses_file

            if not os.path.exists(output_file):
                return None, None

            with open(output_file, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if not content:
                    return None, None

                data = json.loads(content)
                if isinstance(data, list) and data:
                    latest_entry = data[-1]

                    # Handle both old format (with conversation_data) and new format (simple text)
                    if "conversation_data" in latest_entry:
                        # Old format
                        message_id = latest_entry.get("conversation_data", {}).get("message_id", "unknown")
                        ai_response = latest_entry.get("conversation_data", {}).get("ai_response", "")
                    elif "text" in latest_entry:
                        # New simple format
                        message_id = latest_entry.get("id", f"msg_{len(data)}")
                        ai_response = latest_entry.get("text", "")
                    elif isinstance(latest_entry, str):
                        # Simplest format - just a string in the array
                        message_id = f"msg_{len(data)}"
                        ai_response = latest_entry
                    else:
                        # Fallback - try to get any text field
                        message_id = latest_entry.get("id", "unknown")
                        ai_response = latest_entry.get("message", latest_entry.get("response", ""))

                    # Filter out UI-specific responses that shouldn't be spoken
                    if self.should_skip_response(ai_response):
                        return None, None

                    # Clean the response for speech
                    cleaned_response = self.clean_response_for_speech(ai_response)

                    if not cleaned_response or len(cleaned_response.strip()) < 3:
                        return None, None

                    return cleaned_response, message_id
                return None, None
        except FileNotFoundError:
            print(f"File {output_file} not found.")
            return None, None
        except json.JSONDecodeError as e:
            print(f"Invalid JSON in {output_file}: {e}")
            return None, None
        except Exception as e:
            print(f"Error reading output file: {e}")
            return None, None

    def should_skip_response(self, response: str) -> bool:
        """Check if response should be skipped (UI-specific responses)"""
        if not response or len(response.strip()) < 3:
            return True

        # Skip responses that are UI commands or contain special formatting
        skip_patterns = [
            "TIME_DISPLAY_SHOW:",
            "WEATHER_DISPLAY_SHOW:",
            "SEARCH_RESULT:",
            "NEWS_RESULT:",
            "WEATHER_DATA:",
            "WIDGET_TIME:",
            "I apologize, but I encountered an error generating a response",
            "Search error:",
            "Sorry, I couldn't get weather information",
            "Sorry, I couldn't get the time",
        ]

        response_upper = response.upper()
        for pattern in skip_patterns:
            if pattern.upper() in response_upper:
                return True

        # Skip responses that are mostly JSON data
        if response.strip().startswith('{') and response.strip().endswith('}'):
            return True

        # Skip responses that contain large amounts of structured data
        if '"temperature":' in response or '"humidity":' in response:
            return True

        return False

    def clean_response_for_speech(self, response: str) -> str:
        """Clean response text for better speech synthesis"""
        if not response:
            return ""

        # Remove code blocks and markdown formatting
        response = re.sub(r'```[\s\S]*?```', '', response)
        response = re.sub(r'`[^`]*`', '', response)

        # Remove XML/HTML-like tags
        response = re.sub(r'<[^>]*>', '', response)

        # Remove special UI formatting that might have slipped through
        response = re.sub(r'TIME_DISPLAY_SHOW:.*', '', response)
        response = re.sub(r'WEATHER_DISPLAY_SHOW:.*', '', response)
        response = re.sub(r'SEARCH_RESULT:.*', '', response)
        response = re.sub(r'NEWS_RESULT:.*', '', response)
        response = re.sub(r'WEATHER_DATA:.*', '', response)
        response = re.sub(r'WIDGET_TIME:.*', '', response)

        # Remove JSON data blocks
        response = re.sub(r'\{[^}]*"temperature"[^}]*\}', '', response)
        response = re.sub(r'\{[^}]*"humidity"[^}]*\}', '', response)

        # Remove URLs and links
        response = re.sub(r'https?://\S+', '', response)

        # Remove source citations
        response = re.sub(r'📍\s*\*\*Sources:\*\*.*', '', response)
        response = re.sub(r'_Sources:.*_', '', response)

        # Remove excessive formatting symbols
        response = re.sub(r'[*_#]{2,}', '', response)
        response = response.replace('**', '')
        response = response.replace('__', '')

        # Clean up whitespace
        response = re.sub(r'\s+', ' ', response)
        response = response.strip()

        return response

    def check_for_new_messages(self):
        """Check for new messages and process them immediately with deduplication"""
        try:
            ai_response, message_id = self.read_output_json()

            if not message_id:
                return

            # Use lock to prevent race conditions in message processing
            with self.processing_lock:
                # Triple check: already processed, currently processing, or currently speaking
                if (message_id in self.processed_messages or
                    message_id in self.currently_processing or
                    message_id == self.current_speaking_id):
                    return

                # Check if we have a valid response to speak
                if ai_response and message_id:
                    # Mark as currently processing to prevent duplicates
                    self.currently_processing.add(message_id)
                    print(f"🎤 One voice detected - processing unique response (ID: {message_id[:8]}...)")

                    # Process in a separate thread to keep the main loop responsive
                    process_thread = threading.Thread(
                        target=self._process_message_with_cleanup,
                        args=(ai_response, message_id)
                    )
                    process_thread.start()

                elif message_id:
                    # Message was filtered out - mark as processed to prevent re-checking
                    self.processed_messages.add(message_id)
                    self.save_processed_messages()

        except Exception as e:
            print(f"Error checking for new messages: {e}")

    def _process_message_with_cleanup(self, ai_response: str, message_id: str):
        """Process message with proper cleanup and deduplication"""
        try:
            # Acquire speaking lock to ensure only one voice at a time
            with self.speaking_lock:
                # Double-check we're not already processing this message
                if message_id in self.processed_messages:
                    return

                # Set current speaking ID
                self.current_speaking_id = message_id

                # Process the message
                self.process_message(ai_response)

        except Exception as e:
            print(f"Error processing message {message_id[:8]}...: {e}")
        finally:
            # Cleanup: mark as processed and remove from currently processing
            with self.processing_lock:
                self.currently_processing.discard(message_id)
                self.processed_messages.add(message_id)
                self.save_processed_messages()
                self.current_speaking_id = None

    def is_voice_busy(self) -> bool:
        """Check if voice system is currently processing or speaking"""
        return (self.is_speaking or
                self.current_speaking_id is not None or
                len(self.currently_processing) > 0)

    def get_voice_status_detailed(self) -> dict:
        """Get detailed voice system status for debugging"""
        return {
            "is_speaking": self.is_speaking,
            "current_speaking_id": self.current_speaking_id,
            "currently_processing_count": len(self.currently_processing),
            "processed_messages_count": len(self.processed_messages),
            "is_busy": self.is_voice_busy()
        }

    def clear_processing_state(self):
        """Clear processing state in case of errors or stuck states"""
        with self.processing_lock:
            self.currently_processing.clear()
            self.current_speaking_id = None
            self.is_speaking = False
        print("🔧 Voice processing state cleared")

    def enable_web_voice(self):
        """Enable web voice integration"""
        self.web_voice_enabled = True
        print("🌐 Web voice integration enabled")

    def disable_web_voice(self):
        """Disable web voice integration"""
        self.web_voice_enabled = False
        print("🌐 Web voice integration disabled")

    def get_web_audio_data(self) -> Optional[str]:
        """Get the latest audio data for web streaming (base64 encoded)"""
        return self.last_web_audio_data

    def generate_web_audio(self, text: str) -> Optional[str]:
        """Generate audio data for web consumption"""
        try:
            if not self.cartesia_client:
                return None

            # Generate audio using Cartesia
            voice_embedding = self.get_voice_embedding()
            if not voice_embedding:
                return None

            # Create the request
            response = self.cartesia_client.tts.sse(
                model_id=self.cartesia_config.model_id,
                transcript=text,
                voice_embedding=voice_embedding,
                stream=False,
                output_format={
                    "container": "wav",
                    "encoding": "pcm_f32le",
                    "sample_rate": 22050
                }
            )

            # Collect audio data
            audio_data = b""
            for event in response:
                if event.get("data"):
                    audio_data += event["data"]

            if audio_data:
                # Convert to base64 for web transmission
                import base64
                base64_audio = base64.b64encode(audio_data).decode('utf-8')
                self.last_web_audio_data = base64_audio
                return base64_audio

            return None

        except Exception as e:
            print(f"Error generating web audio: {e}")
            return None

    def start_service(self):
        """Start the AI voice service as a background thread"""
        if self.is_running:
            print("🎤 AI Voice service is already running")
            return True

        try:
            # Initialize Cartesia client
            if not self.initialize_cartesia_client():
                print("❌ Failed to initialize voice service")
                return False

            # Start audio playback thread
            playback_thread = threading.Thread(target=self.audio_playback_thread, daemon=True)
            playback_thread.start()

            # Start voice monitoring thread
            self.voice_thread = threading.Thread(target=self._service_loop, daemon=True)
            self.voice_thread.start()

            self.is_running = True
            return True

        except Exception as e:
            print(f"❌ Failed to start AI Voice service: {e}")
            return False

    def stop_service(self):
        """Stop the AI voice service"""
        if not self.is_running:
            return

        self.is_running = False
        self.stop_event.set()

        # Stop file observer if running
        if self.observer and self.observer.is_alive():
            self.observer.stop()
            self.observer.join(timeout=2)

    def _service_loop(self):
        """Main service loop for background voice processing"""
        try:
            # Try to use file monitoring for instant response
            use_file_monitoring = WATCHDOG_AVAILABLE

            if use_file_monitoring:
                try:
                    # Set up file monitoring
                    event_handler = AIResponseFileHandler(self)
                    self.observer = Observer()

                    # Monitor the directory containing speech_input.json
                    watch_path = os.path.dirname(os.path.abspath(self.ai_responses_file))
                    self.observer.schedule(event_handler, watch_path, recursive=False)
                    self.observer.start()

                    # Keep the service alive with periodic checks
                    while not self.stop_event.is_set():
                        try:
                            # Still do periodic checks every 5 seconds as backup
                            if self.stop_event.wait(5):
                                break
                            self.check_for_new_messages()
                        except Exception as e:
                            print(f"Error in monitoring loop: {e}")
                            time.sleep(1)

                except Exception as e:
                    print(f"❌ File monitoring failed: {e}")
                    use_file_monitoring = False

            # Fallback to polling mode if file monitoring is not available
            if not use_file_monitoring:

                while not self.stop_event.is_set():
                    try:
                        self.check_for_new_messages()

                        # Sleep to prevent CPU overuse
                        if self.stop_event.wait(0.5):
                            break

                    except Exception as e:
                        print(f"Error in service loop: {e}")
                        time.sleep(1)

        except Exception as e:
            print(f"❌ Service loop error: {e}")
        finally:
            self.is_running = False

    def initialize_cartesia_client(self):
        """Initialize the Cartesia client once and reuse it"""
        try:
            from cartesia import Cartesia
            self.cartesia_client = Cartesia(api_key=self.cartesia_config.api_key)
            # Test voice embedding retrieval
            test_embedding = self.get_voice_embedding()
            if test_embedding:
                return True
            else:
                print("❌ Failed to retrieve voice embedding")
                return False

        except ImportError:
            print("❌ Error: Cartesia SDK not installed. Install with: pip install cartesia")
            return False
        except Exception as e:
            print(f"❌ Error initializing Cartesia client: {e}")
            return False

    def get_voice_embedding(self):
        """Get and cache voice embedding"""
        if not hasattr(self, '_voice_embedding'):
            try:
                voice = self.cartesia_client.voices.get(id=self.cartesia_config.voice_id)

                # Handle different voice response formats
                if hasattr(voice, 'embedding'):
                    # New API format - voice is an object with embedding attribute
                    self._voice_embedding = voice.embedding
                elif isinstance(voice, dict) and "embedding" in voice:
                    # Old API format - voice is a dictionary
                    self._voice_embedding = voice["embedding"]
                elif hasattr(voice, '__dict__') and 'embedding' in voice.__dict__:
                    # Alternative object format
                    self._voice_embedding = voice.__dict__['embedding']
                else:
                    print(f"Unknown voice response format: {type(voice)}")
                    print(f"Voice object attributes: {dir(voice) if hasattr(voice, '__dict__') else 'No attributes'}")

                    # Try alternative methods to get embedding
                    try:
                        # Try to convert to dict if it's an object
                        if hasattr(voice, '__dict__'):
                            voice_dict = voice.__dict__
                            if 'embedding' in voice_dict:
                                self._voice_embedding = voice_dict['embedding']
                            else:
                                print(f"Available keys in voice object: {list(voice_dict.keys())}")
                                self._voice_embedding = None
                        else:
                            self._voice_embedding = None
                    except Exception as fallback_error:
                        print(f"Fallback embedding extraction failed: {fallback_error}")
                        self._voice_embedding = None

            except Exception as e:
                print(f"Error getting voice embedding: {e}")
                print(f"Voice ID being used: {self.cartesia_config.voice_id}")
                self._voice_embedding = None
        return self._voice_embedding

    def generate_speech_for_chunk(self, text_chunk: str):
        """Generate speech for a single chunk of text"""
        if not self.cartesia_client:
            if not self.initialize_cartesia_client():
                print("Failed to initialize Cartesia client")
                return

        voice_embedding = self.get_voice_embedding()
        if not voice_embedding:
            print("❌ Failed to get voice embedding, trying alternative approach...")
            # Try using voice ID directly instead of embedding
            try:
                processed_text = self.text_processor.clean_text(text_chunk)

                # Try using voice parameter (new API format)
                for output in self.cartesia_client.tts.sse(
                    model_id=self.cartesia_config.model_id,
                    transcript=processed_text,
                    voice={"mode": "id", "id": self.cartesia_config.voice_id},
                    output_format=self.cartesia_config.output_format
                ):
                    # Handle different response formats
                    if hasattr(output, 'data'):
                        raw_data = output.data
                    elif "data" in output:
                        raw_data = output["data"]
                    elif "audio" in output:
                        raw_data = output["audio"]
                    else:
                        print(f"Unknown audio format in response: {type(output)}")
                        continue

                    # Convert base64 string to bytes if needed
                    if isinstance(raw_data, str):
                        try:
                            buffer = base64.b64decode(raw_data)
                        except Exception as e:
                            print(f"Error decoding base64 audio data: {e}")
                            continue
                    else:
                        buffer = raw_data

                    normalized_buffer = self.audio_enhancer.normalize_audio(buffer)
                    amplified_buffer = self.audio_enhancer.amplify_audio(
                        normalized_buffer,
                        self.cartesia_config.volume_multiplier
                    )
                    self.audio_queue.put(amplified_buffer)
                return
            except Exception as fallback_error:
                print(f"❌ Fallback voice generation failed: {fallback_error}")
                return

        try:
            # Clean and prepare text for better TTS
            processed_text = self.text_processor.clean_text(text_chunk)

            # Generate speech using voice embedding (new API format)
            for output in self.cartesia_client.tts.sse(
                model_id=self.cartesia_config.model_id,
                transcript=processed_text,
                voice={"mode": "embedding", "embedding": voice_embedding},
                output_format=self.cartesia_config.output_format
            ):
                # Handle different response formats
                if hasattr(output, 'data'):
                    raw_data = output.data
                elif "data" in output:
                    raw_data = output["data"]
                elif "audio" in output:
                    raw_data = output["audio"]
                else:
                    print(f"Unknown audio format in response: {type(output)}")
                    continue

                # Convert base64 string to bytes if needed
                if isinstance(raw_data, str):
                    try:
                        buffer = base64.b64decode(raw_data)
                    except Exception as e:
                        print(f"Error decoding base64 audio data: {e}")
                        continue
                else:
                    buffer = raw_data

                # Process audio for better quality
                normalized_buffer = self.audio_enhancer.normalize_audio(buffer)
                amplified_buffer = self.audio_enhancer.amplify_audio(
                    normalized_buffer,
                    self.cartesia_config.volume_multiplier
                )
                self.audio_queue.put(amplified_buffer)
        except Exception as e:
            print(f"❌ Error generating speech with embedding: {e}")
            print("🔄 Trying fallback with voice_id...")

            # Fallback: try using voice_id directly
            try:
                processed_text = self.text_processor.clean_text(text_chunk)

                for output in self.cartesia_client.tts.sse(
                    model_id=self.cartesia_config.model_id,
                    transcript=processed_text,
                    voice={"mode": "id", "id": self.cartesia_config.voice_id},
                    output_format=self.cartesia_config.output_format
                ):
                    # Handle different response formats
                    if hasattr(output, 'data'):
                        raw_data = output.data
                    elif "data" in output:
                        raw_data = output["data"]
                    elif "audio" in output:
                        raw_data = output["audio"]
                    else:
                        print(f"Unknown audio format in response: {type(output)}")
                        continue

                    # Convert base64 string to bytes if needed
                    if isinstance(raw_data, str):
                        try:
                            buffer = base64.b64decode(raw_data)
                        except Exception as e:
                            print(f"Error decoding base64 audio data: {e}")
                            continue
                    else:
                        buffer = raw_data

                    normalized_buffer = self.audio_enhancer.normalize_audio(buffer)
                    amplified_buffer = self.audio_enhancer.amplify_audio(
                        normalized_buffer,
                        self.cartesia_config.volume_multiplier
                    )
                    self.audio_queue.put(amplified_buffer)
                print("✅ Fallback voice generation successful")
            except Exception as final_error:
                print(f"❌ Final fallback failed: {final_error}")

    def audio_playback_thread(self):
        """Thread for playing back audio from the queue"""
        p = pyaudio.PyAudio()
        stream = None
        
        try:
            stream = p.open(
                format=pyaudio.paFloat32,
                channels=1,
                rate=self.cartesia_config.sample_rate,
                output=True,
                frames_per_buffer=self.cartesia_config.chunk_size
            )
            
            while True:
                try:
                    # Get audio buffer from queue with timeout
                    buffer = self.audio_queue.get(timeout=0.5)
                    stream.write(buffer)
                    self.audio_queue.task_done()
                except queue.Empty:
                    # No audio to play, check if we're still speaking
                    if not self.is_speaking and self.audio_queue.empty():
                        # Reset and wait for new audio
                        time.sleep(0.1)
                    continue
                except Exception as e:
                    print(f"Error in audio playback: {e}")
                    time.sleep(0.5)
        finally:
            if stream:
                stream.stop_stream()
                stream.close()
            p.terminate()

    def process_message(self, text: str):
        """Process a new message for speech synthesis"""
        self.is_speaking = True
        
        # Break text into manageable chunks
        chunks = self.text_processor.chunk_text(text)
        
        # Process each chunk in separate threads
        threads = []
        for chunk in chunks:
            thread = threading.Thread(target=self.generate_speech_for_chunk, args=(chunk,))
            thread.start()
            threads.append(thread)
            
        # Wait for all chunks to be processed
        for thread in threads:
            thread.join()
            
        self.is_speaking = False

    def text_to_speech_loop(self):
        """Main loop checking for new messages"""
        if self.service_mode:
            # In service mode, just start the service
            return self.start_service()

        # Standalone mode - original behavior
        print("Starting text-to-speech service...")

        # Initialize the client once at startup
        if not self.initialize_cartesia_client():
            print("Failed to initialize Cartesia client. Exiting.")
            return

        # Start audio playback thread
        playback_thread = threading.Thread(target=self.audio_playback_thread, daemon=True)
        playback_thread.start()

        print("Waiting for new messages...")

        # Try to use file monitoring for instant response
        use_file_monitoring = WATCHDOG_AVAILABLE

        if use_file_monitoring:
            try:
                print("🚀 Using file monitoring for instant AI voice response!")

                # Set up file monitoring
                event_handler = AIResponseFileHandler(self)
                observer = Observer()

                # Monitor the directory containing speech_input.json
                watch_path = os.path.dirname(os.path.abspath("speech_input.json"))
                observer.schedule(event_handler, watch_path, recursive=False)
                observer.start()

                print(f"📁 Monitoring directory: {watch_path}")
                print("🎤 AI voice will respond INSTANTLY when Nova AI speaks!")

                # Keep the main thread alive and do periodic checks
                while True:
                    try:
                        # Still do periodic checks every 5 seconds as backup
                        time.sleep(5)
                        self.check_for_new_messages()
                    except KeyboardInterrupt:
                        print("\n🛑 Stopping AI voice system...")
                        observer.stop()
                        break
                    except Exception as e:
                        print(f"Error in monitoring loop: {e}")
                        time.sleep(1)

                observer.join()

            except Exception as e:
                print(f"❌ File monitoring failed: {e}")
                print("🔄 Falling back to polling mode...")
                use_file_monitoring = False

        # Fallback to polling mode if file monitoring is not available
        if not use_file_monitoring:
            print("📊 Using polling mode (checks every 0.5 seconds)")

            while True:
                try:
                    self.check_for_new_messages()

                    # Sleep to prevent CPU overuse
                    time.sleep(0.5)

                except Exception as e:
                    print(f"Error in main loop: {e}")
                    time.sleep(1)  # Wait longer if there's an error


class NovaVoiceService:
    """Simple interface for Nova AI to control the voice system"""

    def __init__(self, ai_responses_file=None):
        self.tts = None
        self.is_active = False
        self.ai_responses_file = ai_responses_file

    def start(self):
        """Start the AI voice service"""
        try:
            # Create configuration
            cartesia_config = CartesiaConfig(
                api_key='sk_car_VqWy79RSCgcBda6TtbJW1A',
                voice_id="5ee9feff-1265-424a-9d7f-8e4d431a12c7",
                model_id="sonic-english",
                sample_rate=48000,
                volume_multiplier=1.2
            )

            # Create TTS service in service mode
            self.tts = TextToSpeech(cartesia_config=cartesia_config, service_mode=True, ai_responses_file=self.ai_responses_file)

            # Start the service
            if self.tts.start_service():
                self.is_active = True
                return True
            else:
                return False

        except Exception as e:
            print(f"❌ Failed to start Nova Voice Service: {e}")
            return False

    def stop(self):
        """Stop the AI voice service"""
        if self.tts:
            self.tts.stop_service()
            self.is_active = False

    def is_running(self):
        """Check if the voice service is running"""
        return self.is_active and self.tts and self.tts.is_running

    def get_status(self):
        """Get voice service status"""
        if self.is_running():
            return "🎤 Voice Active"
        else:
            return "🔇 Voice Inactive"


if __name__ == "__main__":
    try:
        # Create configuration with optimized parameters
        cartesia_config = CartesiaConfig(
            api_key='sk_car_VqWy79RSCgcBda6TtbJW1A',
            voice_id="5ee9feff-1265-424a-9d7f-8e4d431a12c7",
            model_id="sonic-english",
            sample_rate=48000,
            volume_multiplier=1.2
        )

        # Create and start TTS engine
        tts = TextToSpeech(cartesia_config=cartesia_config)
        tts.text_to_speech_loop()

    except KeyboardInterrupt:
        print("Text-to-speech service stopped by user")
    except Exception as e:
        print(f"Error: {str(e)}")