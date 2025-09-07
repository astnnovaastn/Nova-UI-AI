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

@dataclass
class CartesiaConfig:
    api_key: str 
    voice_id: str = "f114a467-c40a-4db8-964d-aaba89cd08fa"
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
    def __init__(self, cartesia_config: CartesiaConfig):
        self.cartesia_config = cartesia_config
        self.processed_messages_file = 'processed_messages.json'
        self.processed_messages = self.load_processed_messages()
        self.text_processor = TextProcessor()
        self.audio_enhancer = AudioEnhancer()
        self.audio_queue = queue.Queue()
        self.is_speaking = False
        self.current_message_chunks = []
        self.cartesia_client = None

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

    def read_output_json(self, output_file="ai_responses.json") -> tuple:
        """Read AI output from JSON file with error handling"""
        try:
            if not os.path.exists(output_file):
                return None, None
                
            with open(output_file, 'r', encoding='utf-8') as f:
                content = f.read().strip()
                if not content:
                    return None, None
                    
                data = json.loads(content)
                if isinstance(data, list) and data:
                    latest_entry = data[-1]
                    message_id = latest_entry.get("conversation_data", {}).get("message_id", "unknown")
                    
                    # Extract only the AI response text, ignoring any other content
                    ai_response = latest_entry.get("conversation_data", {}).get("ai_response", "")
                    
                    # Remove code blocks and any potential markdown formatting
                    ai_response = re.sub(r'```[\s\S]*?```', '', ai_response)
                    ai_response = re.sub(r'`[^`]*`', '', ai_response)
                    
                    # Remove XML/HTML-like tags that might be in the response
                    ai_response = re.sub(r'<[^>]*>', '', ai_response)
                    
                    return ai_response, message_id
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

    def initialize_cartesia_client(self):
        """Initialize the Cartesia client once and reuse it"""
        try:
            from cartesia import Cartesia
            self.cartesia_client = Cartesia(api_key=self.cartesia_config.api_key)
            return True
        except ImportError:
            print("Error: Cartesia SDK not installed. Install with: pip install cartesia")
            return False
        except Exception as e:
            print(f"Error initializing Cartesia client: {e}")
            return False

    def get_voice_embedding(self):
        """Get and cache voice embedding"""
        if not hasattr(self, '_voice_embedding'):
            try:
                voice = self.cartesia_client.voices.get(id=self.cartesia_config.voice_id)
                self._voice_embedding = voice["embedding"]
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
            print("Failed to get voice embedding")
            return
            
        try:
            # Clean and prepare text for better TTS
            processed_text = self.text_processor.clean_text(text_chunk)
            
            # Generate speech
            for output in self.cartesia_client.tts.sse(
                model_id=self.cartesia_config.model_id,
                transcript=processed_text,
                voice_embedding=voice_embedding,
                stream=True,
                output_format=self.cartesia_config.output_format
            ):
                buffer = output["audio"]
                # Process audio for better quality
                normalized_buffer = self.audio_enhancer.normalize_audio(buffer)
                amplified_buffer = self.audio_enhancer.amplify_audio(
                    normalized_buffer, 
                    self.cartesia_config.volume_multiplier
                )
                self.audio_queue.put(amplified_buffer)
        except Exception as e:
            print(f"Error generating speech: {e}")

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
        print("Starting text-to-speech service...")
        
        # Initialize the client once at startup
        if not self.initialize_cartesia_client():
            print("Failed to initialize Cartesia client. Exiting.")
            return
            
        # Start audio playback thread
        playback_thread = threading.Thread(target=self.audio_playback_thread, daemon=True)
        playback_thread.start()
        
        print("Waiting for new messages...")
        
        while True:
            try:
                ai_response, message_id = self.read_output_json()
                
                # Check if the message is new and not processed
                if ai_response and message_id and message_id not in self.processed_messages:
                    print(f"New message detected (ID: {message_id[:8]}...)")
                    
                    # Process in a separate thread to keep the main loop responsive
                    process_thread = threading.Thread(
                        target=self.process_message, 
                        args=(ai_response,)
                    )
                    process_thread.start()
                    
                    # Mark the message as processed immediately
                    self.processed_messages.add(message_id)
                    self.save_processed_messages()
                
                # Sleep to prevent CPU overuse
                time.sleep(0.5)
                
            except Exception as e:
                print(f"Error in main loop: {e}")
                time.sleep(1)  # Wait longer if there's an error


if __name__ == "__main__":
    try:
        # Create configuration with optimized parameters
        cartesia_config = CartesiaConfig(
            api_key="sk_car_5PdMH1dJjrc5jJhGTcec1i",
            voice_id="f114a467-c40a-4db8-964d-aaba89cd08fa",
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