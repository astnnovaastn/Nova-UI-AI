import os
import json
import time
import threading
import queue
import re
import logging
import asyncio
from pathlib import Path
from dataclasses import dataclass
from typing import Optional, Dict, Any, List, Set
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class CartesiaConfig:
    """Configuration for Cartesia TTS"""
    api_key: str 
    voice_id: str = "a167e0f3-df7e-4d52-a9c3-f949145efdab"
    model_id: str = "sonic-english"
    sample_rate: int = 22050
    volume_multiplier: float = 0.8
    chunk_size: int = 1024
    max_chunk_length: int = 400
    
    @property
    def output_format(self) -> Dict[str, Any]:
        return {
            "container": "raw",
            "encoding": "pcm_f32le",
            "sample_rate": self.sample_rate,
        }


class TextProcessor:
    """Enhanced text processing for better TTS results"""
    
    @staticmethod
    def clean_text(text: str) -> str:
        """Clean and normalize text for better speech synthesis"""
        if not text or not text.strip():
            return ""
            
        # Remove markdown formatting
        text = re.sub(r'\*\*([^*]+)\*\*', r'\1', text)  # Bold
        text = re.sub(r'\*([^*]+)\*', r'\1', text)      # Italic
        text = re.sub(r'`([^`]+)`', r'\1', text)        # Inline code
        text = re.sub(r'```[\s\S]*?```', '', text)      # Code blocks
        
        # Remove XML/HTML tags
        text = re.sub(r'<[^>]*>', '', text)
        
        # Handle URLs
        text = re.sub(r'https?://\S+', 'link', text)
        
        # Clean up special characters
        text = text.replace('_', '')
        text = text.replace('#', 'hashtag ')
        text = text.replace('@', 'at ')
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text)
        text = text.strip()
        
        # Add natural pauses
        text = re.sub(r'([.!?])\s+', r'\1 ', text)
        
        return text
    
    @staticmethod
    def chunk_text(text: str, max_chunk_size: int = 400) -> List[str]:
        """Break text into optimal chunks for TTS processing"""
        if not text or len(text) <= max_chunk_size:
            return [text] if text else []
            
        # Split by sentences first
        sentence_pattern = r'(?<=[.!?])\s+'
        sentences = re.split(sentence_pattern, text)
        
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
                
            # If adding this sentence would exceed the limit
            if len(current_chunk) + len(sentence) + 1 > max_chunk_size:
                if current_chunk:
                    chunks.append(current_chunk.strip())
                    current_chunk = sentence
                else:
                    # Single sentence is too long, split by words
                    if len(sentence) > max_chunk_size:
                        words = sentence.split()
                        temp_chunk = ""
                        for word in words:
                            if len(temp_chunk) + len(word) + 1 <= max_chunk_size:
                                temp_chunk += " " + word if temp_chunk else word
                            else:
                                if temp_chunk:
                                    chunks.append(temp_chunk.strip())
                                temp_chunk = word
                        if temp_chunk:
                            current_chunk = temp_chunk
                    else:
                        current_chunk = sentence
            else:
                current_chunk += " " + sentence if current_chunk else sentence
                
        if current_chunk:
            chunks.append(current_chunk.strip())
            
        return [chunk for chunk in chunks if chunk.strip()]


class CartesiaTTS:
    """Enhanced Cartesia Text-to-Speech client"""
    
    def __init__(self, config: CartesiaConfig):
        self.config = config
        self.processed_messages_file = Path('processed_messages.json')
        self.processed_messages = self._load_processed_messages()
        self.text_processor = TextProcessor()
        
        # Audio streaming
        self.audio_queue = queue.Queue(maxsize=50)
        self.is_playing = False
        self.playback_thread = None
        
        # Cartesia client
        self._cartesia_client = None
        self._voice_embedding = None
        
        # PyAudio
        self._pyaudio = None
        self._audio_stream = None
        
        # Check dependencies
        self._check_dependencies()
        
    def _check_dependencies(self):
        """Check if all required dependencies are installed"""
        # Try PyAudio first, fallback to pygame
        self.audio_backend = None
        
        try:
            import pyaudio
            self.audio_backend = "pyaudio"
            logger.info("PyAudio found - using PyAudio backend")
        except ImportError:
            try:
                import pygame
                self.audio_backend = "pygame"
                logger.info("PyAudio not found, using pygame backend")
            except ImportError:
                logger.error("Neither PyAudio nor pygame found.")
                logger.error("Install one of them with:")
                logger.error("  pip install pyaudio  (recommended)")
                logger.error("  OR")
                logger.error("  pip install pygame")
                raise ImportError("Audio backend required (PyAudio or pygame)")
            
        try:
            import cartesia
            logger.info(f"Cartesia SDK found (version: {cartesia.__version__ if hasattr(cartesia, '__version__') else 'unknown'})")
        except ImportError:
            logger.error("Cartesia SDK not found. Install with: pip install cartesia")
            raise ImportError("Cartesia SDK is required")
    
    def _load_processed_messages(self) -> Set[str]:
        """Load processed message IDs from file"""
        try:
            if self.processed_messages_file.exists():
                with open(self.processed_messages_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    return set(data) if isinstance(data, list) else set()
        except Exception as e:
            logger.warning(f"Could not load processed messages: {e}")
        return set()
    
    def _save_processed_messages(self):
        """Save processed message IDs to file"""
        try:
            with open(self.processed_messages_file, 'w', encoding='utf-8') as f:
                json.dump(list(self.processed_messages), f, indent=2)
        except Exception as e:
            logger.error(f"Error saving processed messages: {e}")
    
    def _initialize_cartesia(self) -> bool:
        """Initialize Cartesia client with better error handling"""
        if self._cartesia_client:
            return True
            
        try:
            # Import and create client
            from cartesia import Cartesia
            
            logger.info("Initializing Cartesia client...")
            self._cartesia_client = Cartesia(api_key=self.config.api_key)
            
            # Test the client by trying to get voice info
            logger.info("Testing Cartesia client connection...")
            voice = self._cartesia_client.voices.get(id=self.config.voice_id)
            
            if voice and "embedding" in voice:
                self._voice_embedding = voice["embedding"]
                logger.info(f"Successfully loaded voice: {voice.get('name', 'Unknown')}")
                return True
            else:
                logger.error("Voice embedding not found in response")
                return False
                
        except ImportError as e:
            logger.error(f"Cartesia SDK import error: {e}")
            return False
        except Exception as e:
            logger.error(f"Error initializing Cartesia client: {e}")
            # Try to provide more specific error information
            if "api_key" in str(e).lower():
                logger.error("Check your API key - it may be invalid or expired")
            elif "voice" in str(e).lower():
                logger.error(f"Check your voice ID: {self.config.voice_id}")
            return False
    
    def _initialize_audio(self) -> bool:
        """Initialize audio system with multiple backend support"""
        if self.audio_backend == "pyaudio":
            return self._initialize_pyaudio()
        elif self.audio_backend == "pygame":
            return self._initialize_pygame()
        else:
            logger.error("No audio backend available")
            return False
    
    def _initialize_pyaudio(self) -> bool:
        """Initialize PyAudio backend"""
        try:
            import pyaudio
            
            logger.info("Initializing PyAudio...")
            self._pyaudio = pyaudio.PyAudio()
            
            # List available audio devices for debugging
            logger.info("Available audio devices:")
            for i in range(self._pyaudio.get_device_count()):
                info = self._pyaudio.get_device_info_by_index(i)
                if info['maxOutputChannels'] > 0:
                    logger.info(f"  Device {i}: {info['name']} (channels: {info['maxOutputChannels']})")
            
            # Create audio stream
            self._audio_stream = self._pyaudio.open(
                format=pyaudio.paFloat32,
                channels=1,
                rate=self.config.sample_rate,
                output=True,
                frames_per_buffer=self.config.chunk_size
            )
            
            logger.info("PyAudio initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error initializing PyAudio: {e}")
            return False
    
    def _initialize_pygame(self) -> bool:
        """Initialize pygame backend"""
        try:
            import pygame
            
            logger.info("Initializing pygame audio...")
            pygame.mixer.pre_init(
                frequency=self.config.sample_rate,
                size=-32,  # 32-bit signed
                channels=1,
                buffer=self.config.chunk_size
            )
            pygame.mixer.init()
            
            logger.info("Pygame audio initialized successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error initializing pygame: {e}")
            return False
    
    def _audio_playback_worker(self):
        """Audio playback thread worker with multiple backend support"""
        logger.info(f"Audio playback thread started (backend: {self.audio_backend})")
        
        if self.audio_backend == "pygame":
            self._pygame_playback_worker()
        else:
            self._pyaudio_playback_worker()
    
    def _pyaudio_playback_worker(self):
        """PyAudio playback worker"""
        while self.is_playing:
            try:
                audio_data = self.audio_queue.get(timeout=0.5)
                
                if audio_data is None:  # Shutdown signal
                    break
                    
                if self._audio_stream and not self._audio_stream._is_stopped:
                    self._audio_stream.write(audio_data)
                    
                self.audio_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Error in PyAudio playback: {e}")
                time.sleep(0.1)
    
    def _pygame_playback_worker(self):
        """Pygame playback worker"""
        import pygame
        import io
        import wave
        
        while self.is_playing:
            try:
                audio_data = self.audio_queue.get(timeout=0.5)
                
                if audio_data is None:  # Shutdown signal
                    break
                
                # Convert float32 audio data to pygame-compatible format
                try:
                    # Convert to 16-bit PCM for pygame
                    float_data = np.frombuffer(audio_data, dtype=np.float32)
                    int_data = (float_data * 32767).astype(np.int16)
                    
                    # Create a wave file in memory
                    wav_buffer = io.BytesIO()
                    with wave.open(wav_buffer, 'wb') as wav_file:
                        wav_file.setnchannels(1)
                        wav_file.setsampwidth(2)  # 16-bit
                        wav_file.setframerate(self.config.sample_rate)
                        wav_file.writeframes(int_data.tobytes())
                    
                    wav_buffer.seek(0)
                    
                    # Play using pygame
                    sound = pygame.mixer.Sound(wav_buffer)
                    sound.play()
                    
                    # Wait for sound to finish (simple approach)
                    time.sleep(len(audio_data) / (4 * self.config.sample_rate))  # 4 bytes per sample (float32)
                    
                except Exception as e:
                    logger.error(f"Error processing audio for pygame: {e}")
                    
                self.audio_queue.task_done()
                
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Error in pygame playback: {e}")
                time.sleep(0.1)
        
        logger.info("Audio playback thread stopped")
    
    def _process_audio_buffer(self, buffer: bytes) -> bytes:
        """Process audio buffer with volume control and normalization"""
        try:
            audio_data = np.frombuffer(buffer, dtype=np.float32).copy()
            
            if len(audio_data) == 0:
                return buffer
                
            # Apply volume multiplier
            if self.config.volume_multiplier != 1.0:
                audio_data = audio_data * self.config.volume_multiplier
            
            # Soft clipping to prevent distortion
            audio_data = np.clip(audio_data, -0.95, 0.95)
            
            return audio_data.tobytes()
            
        except Exception as e:
            logger.error(f"Error processing audio buffer: {e}")
            return buffer
    
    def _generate_speech_chunk(self, text_chunk: str):
        """Generate speech for a single text chunk"""
        if not self._cartesia_client or not self._voice_embedding:
            logger.error("Cartesia client or voice embedding not available")
            return
            
        try:
            # Clean the text
            processed_text = self.text_processor.clean_text(text_chunk)
            if not processed_text:
                return
                
            logger.debug(f"Generating speech for: {processed_text[:50]}...")
            
            # Generate speech using the TTS client
            response = self._cartesia_client.tts.sse(
                model_id=self.config.model_id,
                transcript=processed_text,
                voice_embedding=self._voice_embedding,
                stream=True,
                output_format=self.config.output_format
            )
            
            # Process the streaming response
            for chunk in response:
                if "audio" in chunk and chunk["audio"]:
                    buffer = chunk["audio"]
                    processed_buffer = self._process_audio_buffer(buffer)
                    
                    # Add to playback queue
                    try:
                        self.audio_queue.put(processed_buffer, timeout=1.0)
                    except queue.Full:
                        logger.warning("Audio queue is full, dropping audio chunk")
                        
        except Exception as e:
            logger.error(f"Error generating speech chunk: {e}")
            logger.error(f"Text chunk: {text_chunk[:100]}...")
    
    def speak_text(self, text: str):
        """Convert text to speech"""
        if not text or not text.strip():
            return
            
        logger.info(f"Speaking text: {text[:100]}...")
        
        # Break text into chunks
        chunks = self.text_processor.chunk_text(text, self.config.max_chunk_length)
        
        if not chunks:
            logger.warning("No valid text chunks to speak")
            return
        
        # Process chunks sequentially
        for i, chunk in enumerate(chunks):
            logger.debug(f"Processing chunk {i+1}/{len(chunks)}")
            self._generate_speech_chunk(chunk)
            # Small delay between chunks
            time.sleep(0.1)
    
    def read_ai_response(self, json_file: str = "ai_responses.json") -> tuple:
        """Read the latest AI response from JSON file"""
        try:
            json_path = Path(json_file)
            if not json_path.exists():
                logger.debug(f"JSON file {json_file} does not exist")
                return None, None
                
            with open(json_path, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if not content:
                    logger.debug("JSON file is empty")
                    return None, None
                    
            data = json.loads(content)
            
            if isinstance(data, list) and data:
                latest_entry = data[-1]
                conversation_data = latest_entry.get("conversation_data", {})
                
                message_id = conversation_data.get("message_id", f"msg_{int(time.time())}")
                ai_response = conversation_data.get("ai_response", "")
                
                # Clean the response text
                if ai_response:
                    # Remove code blocks and other unwanted content
                    ai_response = re.sub(r'```[\s\S]*?```', '', ai_response)
                    ai_response = re.sub(r'`[^`]*`', '', ai_response)
                    ai_response = ai_response.strip()
                
                return ai_response, message_id
                
            logger.debug("No valid data found in JSON file")
            return None, None
                
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in {json_file}: {e}")
        except Exception as e:
            logger.error(f"Error reading AI response: {e}")
            
        return None, None
    
    def start(self) -> bool:
        """Start the TTS service"""
        logger.info("Starting Cartesia TTS service...")
        
        # Initialize Cartesia client
        if not self._initialize_cartesia():
            return False
            
        # Initialize audio system
        if not self._initialize_audio():
            return False
        
        # Start audio playback thread
        self.is_playing = True
        self.playback_thread = threading.Thread(target=self._audio_playback_worker, daemon=True)
        self.playback_thread.start()
        
        logger.info("TTS service started successfully. Monitoring for new messages...")
        return True
    
    def stop(self):
        """Stop the TTS service"""
        logger.info("Stopping TTS service...")
        
        self.is_playing = False
        
        # Signal audio thread to stop
        try:
            self.audio_queue.put(None, timeout=1.0)
        except queue.Full:
            pass
            
        # Wait for playback thread to finish
        if self.playback_thread and self.playback_thread.is_alive():
            self.playback_thread.join(timeout=2.0)
        
        # Clean up audio based on backend
        if self.audio_backend == "pyaudio":
            if self._audio_stream:
                try:
                    self._audio_stream.stop_stream()
                    self._audio_stream.close()
                except:
                    pass
                
            if self._pyaudio:
                try:
                    self._pyaudio.terminate()
                except:
                    pass
        elif self.audio_backend == "pygame":
            try:
                import pygame
                pygame.mixer.quit()
            except:
                pass
        
        logger.info("TTS service stopped")
    
    def run_monitoring_loop(self, json_file: str = "ai_responses.json", check_interval: float = 1.0):
        """Main monitoring loop"""
        if not self.start():
            logger.error("Failed to start TTS service")
            return
            
        logger.info(f"Monitoring {json_file} for new messages...")
        
        try:
            while True:
                ai_response, message_id = self.read_ai_response(json_file)
                
                if ai_response and message_id and message_id not in self.processed_messages:
                    logger.info(f"New message detected (ID: {message_id[:8]}...)")
                    
                    # Process the message in a separate thread
                    speech_thread = threading.Thread(
                        target=self.speak_text,
                        args=(ai_response,),
                        daemon=True
                    )
                    speech_thread.start()
                    
                    # Mark as processed
                    self.processed_messages.add(message_id)
                    self._save_processed_messages()
                
                time.sleep(check_interval)
                
        except KeyboardInterrupt:
            logger.info("TTS service interrupted by user")
        except Exception as e:
            logger.error(f"Error in monitoring loop: {e}")
        finally:
            self.stop()


def main():
    """Main function"""
    # Configuration
    config = CartesiaConfig(
        api_key="sk_car_5PdMH1dJjrc5jJhGTcec1i",  # Replace with your actual API key
        voice_id="a167e0f3-df7e-4d52-a9c3-f949145efdab",
        model_id="sonic-english",
        sample_rate=22050,
        volume_multiplier=0.8,
        max_chunk_length=400
    )
    
    # Test configuration
    logger.info("Configuration:")
    logger.info(f"  Voice ID: {config.voice_id}")
    logger.info(f"  Model ID: {config.model_id}")
    logger.info(f"  Sample Rate: {config.sample_rate}")
    
    # Create and run TTS service
    tts_service = CartesiaTTS(config)
    
    try:
        tts_service.run_monitoring_loop(
            json_file="ai_responses.json",
            check_interval=0.5
        )
    except Exception as e:
        logger.error(f"Fatal error: {e}")
    finally:
        tts_service.stop()


if __name__ == "__main__":
    main()