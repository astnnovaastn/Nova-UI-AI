import os
import json
import time
import queue
import threading
import base64
import re
from pathlib import Path
from dataclasses import dataclass
from typing import Optional, Dict, Any, List, Set

import sounddevice as sd
import numpy as np

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
    WATCHDOG_AVAILABLE = True
except ImportError:
    WATCHDOG_AVAILABLE = False
    Observer = None
    FileSystemEventHandler = None


@dataclass
class CartesiaConfig:
    """Configuration for Cartesia TTS service"""
    api_key: str
    voice_id: str
    model_id: str = "sonic-english"
    sample_rate: int = 48000
    volume_multiplier: float = 1.0
    output_format: Dict = None
    fish_api_key: str = None
    fish_voice_id: str = None
    
    def __post_init__(self):
        if self.output_format is None:
            self.output_format = {
                "container": "raw",
                "encoding": "pcm_f32le",
                "sample_rate": self.sample_rate
            }


class TextProcessor:
    """Process text for better TTS output"""
    
    def clean_text(self, text: str) -> str:
        """Clean text for speech synthesis"""
        if not text:
            return ""
        
        # Remove URLs
        text = re.sub(r'https?://\S+', '', text)
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def chunk_text(self, text: str, chunk_size: int = 500) -> List[str]:
        """Split text into chunks for processing"""
        if not text:
            return []
        
        # Split on sentence boundaries if possible
        sentences = re.split(r'(?<=[.!?])\s+', text)
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            if len(current_chunk) + len(sentence) < chunk_size:
                current_chunk += (" " if current_chunk else "") + sentence
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                current_chunk = sentence
        
        if current_chunk:
            chunks.append(current_chunk)
        
        return chunks if chunks else [text]


class AudioEnhancer:
    """Enhance audio quality"""
    
    def normalize_audio(self, buffer: bytes) -> bytes:
        """Normalize audio levels"""
        try:
            audio_data = np.frombuffer(buffer, dtype=np.float32)
            # Normalize to prevent clipping
            max_val = np.max(np.abs(audio_data))
            if max_val > 0:
                audio_data = audio_data / max_val * 0.9
            return audio_data.astype(np.float32).tobytes()
        except Exception as e:
            print(f"Error normalizing audio: {e}")
            return buffer
    
    def amplify_audio(self, buffer: bytes, volume_multiplier: float) -> bytes:
        """Amplify audio with smart clipping prevention"""
        audio_data = np.frombuffer(buffer, dtype=np.float32).copy()
        
        # Apply volume multiplier
        audio_data = audio_data * volume_multiplier
        
        # Soft clipping to prevent distortion
        audio_data = np.clip(audio_data, -0.95, 0.95)
        
        return audio_data.astype(np.float32).tobytes()


class AIResponseFileHandler(FileSystemEventHandler if WATCHDOG_AVAILABLE else object):
    """Handle file system events for AI response file"""
    
    def __init__(self, tts):
        self.tts = tts
    
    def on_modified(self, event):
        """Handle file modification events"""
        if event.is_directory:
            return
        
        if event.src_path.endswith('speech_input.json'):
            self.tts.check_for_new_messages()


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
        self.observer = None
        self.service_mode = service_mode
        self.voice_thread = None
        self.is_running = False
        self.stop_event = threading.Event()

        # Set the speech_input.json file path
        self.ai_responses_file = ai_responses_file or "speech_input.json"

        # Voice deduplication and synchronization
        self.processing_lock = threading.Lock()
        self.currently_processing = set()
        self.speaking_lock = threading.Lock()
        self.current_speaking_id = None

        # Web voice integration
        self.web_voice_enabled = False
        self.web_audio_queue = queue.Queue()
        self.last_web_audio_data = None

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
            if output_file is None:
                output_file = self.ai_responses_file

            if not os.path.exists(output_file):
                return None, None

            with open(output_file, 'r', encoding='utf-8-sig') as f:  # Use utf-8-sig to handle BOM
                content = f.read().strip()
                if not content:
                    return None, None

                data = json.loads(content)
                if isinstance(data, list) and data:
                    latest_entry = data[-1]
                    
                    if isinstance(latest_entry, dict):
                        if "conversation_data" in latest_entry:
                            message_id = latest_entry.get("conversation_data", {}).get("message_id", "unknown")
                            ai_response = latest_entry.get("conversation_data", {}).get("ai_response", "")
                        elif "text" in latest_entry:
                            message_id = latest_entry.get("id", f"msg_{len(data)}")
                            ai_response = latest_entry.get("text", "")
                        else:
                            message_id = latest_entry.get("id", "unknown")
                            ai_response = latest_entry.get("message", latest_entry.get("response", ""))
                    elif isinstance(latest_entry, str):
                        message_id = f"msg_{len(data)}"
                        ai_response = latest_entry
                    else:
                        return None, None

                    if self.should_skip_response(ai_response):
                        return None, None

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

        skip_patterns = [
            "TIME_DISPLAY_SHOW:",
            "WEATHER_DISPLAY_SHOW:",
            "SEARCH_RESULT:",
            "NEWS_RESULT:",
            "WEATHER_DATA:",
            "WIDGET_TIME:",
        ]

        response_upper = response.upper()
        for pattern in skip_patterns:
            if pattern.upper() in response_upper:
                return True

        if response.strip().startswith('{') and response.strip().endswith('}'):
            return True

        if '"temperature":' in response or '"humidity":' in response:
            return True

        return False

    def clean_response_for_speech(self, response: str) -> str:
        """Clean response text for better speech synthesis"""
        if not response:
            return ""

        response = re.sub(r'```[\s\S]*?```', '', response)
        response = re.sub(r'`[^`]*`', '', response)
        response = re.sub(r'<[^>]*>', '', response)
        response = re.sub(r'\s+', ' ', response)
        response = response.strip()

        return response

    def check_for_new_messages(self):
        """Check for new messages and process them immediately"""
        try:
            ai_response, message_id = self.read_output_json()

            if not message_id:
                return

            with self.processing_lock:
                if (message_id in self.processed_messages or
                    message_id in self.currently_processing or
                    message_id == self.current_speaking_id):
                    return

                if ai_response and message_id:
                    self.currently_processing.add(message_id)
                    print(f"🎤 Processing message: {message_id}")

                    process_thread = threading.Thread(
                        target=self._process_message_with_cleanup,
                        args=(ai_response, message_id)
                    )
                    process_thread.start()

                elif message_id:
                    self.processed_messages.add(message_id)
                    self.save_processed_messages()

        except Exception as e:
            print(f"Error checking for new messages: {e}")

    def _process_message_with_cleanup(self, ai_response: str, message_id: str):
        """Process message with cleanup"""
        try:
            with self.speaking_lock:
                if message_id in self.processed_messages:
                    return

                self.current_speaking_id = message_id
                self.process_message(ai_response)

        except Exception as e:
            print(f"Error processing message: {e}")
        finally:
            with self.processing_lock:
                self.currently_processing.discard(message_id)
                self.processed_messages.add(message_id)
                self.save_processed_messages()
                self.current_speaking_id = None

    def initialize_cartesia_client(self):
        """Initialize the Cartesia client"""
        try:
            from cartesia import Cartesia
            self.cartesia_client = Cartesia(api_key=self.cartesia_config.api_key)
            test_embedding = self.get_voice_embedding()
            if test_embedding:
                print("✅ Cartesia client initialized successfully")
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
        """Get voice embedding"""
        if not hasattr(self, '_voice_embedding'):
            try:
                voice = self.cartesia_client.voices.get(id=self.cartesia_config.voice_id)

                if hasattr(voice, 'embedding'):
                    self._voice_embedding = voice.embedding
                elif isinstance(voice, dict) and "embedding" in voice:
                    self._voice_embedding = voice["embedding"]
                elif hasattr(voice, '__dict__') and 'embedding' in voice.__dict__:
                    self._voice_embedding = voice.__dict__['embedding']
                else:
                    print(f"Unknown voice response format")
                    self._voice_embedding = None

            except Exception as e:
                print(f"Error getting voice embedding: {e}")
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
            print("❌ Failed to get voice embedding")
            return

        try:
            processed_text = self.text_processor.clean_text(text_chunk)

            for output in self.cartesia_client.tts.generate_sse(
                model_id=self.cartesia_config.model_id,
                transcript=processed_text,
                voice={"mode": "embedding", "embedding": voice_embedding},
                output_format=self.cartesia_config.output_format
            ):
                if hasattr(output, 'data'):
                    raw_data = output.data
                elif isinstance(output, dict) and 'data' in output:
                    raw_data = output['data']
                elif isinstance(output, dict) and 'audio' in output:
                    raw_data = output['audio']
                else:
                    continue

                if isinstance(raw_data, str):
                    try:
                        buffer = base64.b64decode(raw_data)
                    except Exception as e:
                        print(f"Error decoding base64: {e}")
                        continue
                else:
                    buffer = raw_data

                normalized_buffer = self.audio_enhancer.normalize_audio(buffer)
                amplified_buffer = self.audio_enhancer.amplify_audio(
                    normalized_buffer,
                    self.cartesia_config.volume_multiplier
                )
                print(f"📢 Queuing audio buffer: {len(amplified_buffer)} bytes")
                self.audio_queue.put(amplified_buffer)
        except Exception as e:
            print(f"❌ Error generating speech: {e}")

    def process_message(self, text: str):
        """Process a new message for speech synthesis"""
        self.is_speaking = True
        
        chunks = self.text_processor.chunk_text(text)
        
        threads = []
        for chunk in chunks:
            thread = threading.Thread(target=self.generate_speech_for_chunk, args=(chunk,))
            thread.start()
            threads.append(thread)
            
        for thread in threads:
            thread.join()
            
        self.is_speaking = False

    def audio_playback_thread(self):
        """Thread for playing back audio from the queue"""
        print("🎵 Audio playback thread started")
        
        # Try to find the best audio device
        device = self._find_best_audio_device()
        print(f"Using audio device: {device}")
        
        try:
            while True:
                try:
                    buffer = self.audio_queue.get(timeout=0.5)
                    print(f"🔊 Playing audio buffer: {len(buffer)} bytes")
                    
                    audio_data = np.frombuffer(buffer, dtype=np.float32)
                    
                    try:
                        # Try to play with selected device
                        sd.play(audio_data, samplerate=self.cartesia_config.sample_rate, device=device)
                        sd.wait()
                        print("✅ Audio playback completed")
                    except Exception as device_error:
                        print(f"⚠️ Device {device} failed: {device_error}")
                        print("🔄 Trying default device...")
                        sd.play(audio_data, samplerate=self.cartesia_config.sample_rate)
                        sd.wait()
                        print("✅ Audio playback completed (default device)")
                    
                    self.audio_queue.task_done()
                except queue.Empty:
                    if not self.is_speaking and self.audio_queue.empty():
                        time.sleep(0.1)
                    continue
                except Exception as e:
                    print(f"❌ Error in audio playback: {e}")
                    time.sleep(0.5)
        except Exception as e:
            print(f"Audio playback thread error: {e}")
    
    def _find_best_audio_device(self):
        """Find the best available audio output device"""
        try:
            devices = sd.query_devices()
            
            # Prefer devices in this order
            device_names = [
                'Speaker',
                'Headphones', 
                'Speakers',
                'Primary Sound',
                'WASAPI',
            ]
            
            for pref_name in device_names:
                for i, device in enumerate(devices):
                    if isinstance(device, dict):
                        name = device.get('name', '')
                    else:
                        name = str(device)
                    
                    # Check if this is an output device and contains preferred name
                    if pref_name.lower() in name.lower():
                        if isinstance(device, dict) and device.get('max_output_channels', 0) > 0:
                            print(f"✅ Found preferred device {i}: {name}")
                            return i
                        elif not isinstance(device, dict):
                            return i
            
            # Fallback to default output device
            print("Using default output device")
            return None
        except Exception as e:
            print(f"Error finding audio device: {e}")
            return None

    def start_service(self):
        """Start the AI voice service"""
        if self.is_running:
            print("🎤 AI Voice service is already running")
            return True

        try:
            if not self.initialize_cartesia_client():
                print("❌ Failed to initialize voice service")
                return False

            playback_thread = threading.Thread(target=self.audio_playback_thread, daemon=True)
            playback_thread.start()

            self.voice_thread = threading.Thread(target=self._service_loop, daemon=True)
            self.voice_thread.start()

            self.is_running = True
            print("✅ AI Voice service started")
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
        print("🛑 AI Voice service stopped")

    def _service_loop(self):
        """Main service loop for background voice processing"""
        try:
            while not self.stop_event.is_set():
                try:
                    self.check_for_new_messages()
                    if self.stop_event.wait(0.5):
                        break
                except Exception as e:
                    print(f"Error in service loop: {e}")
                    time.sleep(1)
        except Exception as e:
            print(f"❌ Service loop error: {e}")
        finally:
            self.is_running = False

    def text_to_speech_loop(self):
        """Main loop checking for new messages"""
        if self.service_mode:
            return self.start_service()

        print("Starting text-to-speech service...")

        if not self.initialize_cartesia_client():
            print("Failed to initialize Cartesia client. Exiting.")
            return

        playback_thread = threading.Thread(target=self.audio_playback_thread, daemon=True)
        playback_thread.start()

        print("🎤 Waiting for new messages...")
        print("📁 Reading from:", os.path.abspath(self.ai_responses_file))

        while True:
            try:
                self.check_for_new_messages()
                time.sleep(0.5)
            except KeyboardInterrupt:
                print("\n🛑 Stopping AI voice system...")
                break
            except Exception as e:
                print(f"Error in main loop: {e}")
                time.sleep(1)


if __name__ == "__main__":
    try:
        print("🎤 AI Voice System Starting...")
        print("=" * 50)
        
        cartesia_config = CartesiaConfig(
            api_key='sk_car_VqWy79RSCgcBda6TtbJW1A',
            voice_id="5ee9feff-1265-424a-9d7f-8e4d431a12c7",
            model_id="sonic-english",
            sample_rate=48000,
            volume_multiplier=2.0
        )
        
        tts = TextToSpeech(cartesia_config=cartesia_config)
        tts.text_to_speech_loop()
        
    except KeyboardInterrupt:
        print("\n✅ Text-to-speech service stopped")
    except Exception as e:
        print(f"❌ Error: {str(e)}")
