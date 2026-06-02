import speech_recognition as sr
import threading
import time
import os
import numpy as np
import queue
import json
import re
import colorama
from colorama import Fore, Style
from datetime import datetime
import groq

# Initialize colorama for colored terminal output
colorama.init()

class SpeechToTextApp:
    def __init__(self):
        # Initialize speech recognition components
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        
        # Optimize speech recognition settings for faster response
        self.recognizer.pause_threshold = 0.5  # Reduced for faster response
        self.recognizer.energy_threshold = 300  # Adjust based on your environment
        self.recognizer.dynamic_energy_threshold = True  # Automatically adjust for ambient noise
        
        # Application state
        self.is_running = False
        self.is_listening = False
        self.speaking_detected = False
        self.output_file = "transcription.txt"
        self.json_output_file = "transcription.json"
        self.current_line = ""
        
        # Timing parameters
        self.silence_threshold = 1.0  # Reduced for faster response
        self.last_speech_time = time.time()
        self.speech_timeout = 5  # Time to wait before considering speech complete
        
        # Thread communication
        self.audio_queue = queue.Queue()
        self.result_queue = queue.Queue()
        
        # Conversation history
        self.conversation_history = []
        
        # Voice activity detection
        self.vad_threshold = 0.3  # Threshold for voice activity detection
        self.speaking_frames = 0
        self.silent_frames = 0
        
        # Performance metrics
        self.processing_times = []
        
        # Initialize Groq client for Whisper
        self.api_key = "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"  # Default key
        self.client = groq.Client(api_key=self.api_key)

    def listen_and_transcribe(self):
        """Continuously listen for speech and add audio to processing queue."""
        with self.microphone as source:
            # Adjust for ambient noise with shorter duration for faster startup
            print(f"{Fore.YELLOW}Adjusting for ambient noise...{Style.RESET_ALL}")
            self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
            
            self.is_listening = True
            while self.is_running:
                try:
                    # Visual indicator that the system is listening
                    if not self.speaking_detected:
                        self.update_listening_status()
                    
                    # Capture audio with shorter timeout and phrase time limit for faster response
                    audio = self.recognizer.listen(
                        source, 
                        timeout=3,  # Shorter timeout
                        phrase_time_limit=10  # Limit phrase length to avoid long processing
                    )
                    
                    # Update speech detection status
                    self.speaking_detected = True
                    self.last_speech_time = time.time()
                    
                    # Add audio to processing queue and process in separate thread
                    self.audio_queue.put(audio)
                    
                except sr.WaitTimeoutError:
                    # Reset speaking detection if no speech for a while
                    if time.time() - self.last_speech_time > 1.5:
                        self.speaking_detected = False
                    continue
                    
                except sr.UnknownValueError:
                    self.speaking_detected = False
                    self.print_status("Didn't catch that, please repeat.", "warning")
                    
                except Exception as e:
                    self.print_status(f"Listening error: {str(e)}", "error")
    
    def update_listening_status(self):
        """Update the listening status indicator."""
        # Only update occasionally to avoid console spam
        if time.time() % 3 < 0.1:
            self.print_status("Listening...", "info", end="\r")
    
    def audio_processor(self):
        """Process audio from the queue in a separate thread."""
        while self.is_running:
            try:
                # Get audio from queue with timeout to allow checking is_running
                try:
                    audio = self.audio_queue.get(timeout=0.5)
                except queue.Empty:
                    continue
                
                # Process the audio
                start_time = time.time()
                self.process_audio(audio)
                
                # Track processing time for performance metrics
                processing_time = time.time() - start_time
                self.processing_times.append(processing_time)
                
                # Mark task as done
                self.audio_queue.task_done()
                
            except Exception as e:
                self.print_status(f"Processing error: {str(e)}", "error")
    
    def process_audio(self, audio):
        """Process the audio for speech recognition."""
        try:
            # Save audio to a temporary WAV file
            temp_filename = f"temp_audio_{int(time.time() * 1000)}.wav"
            with open(temp_filename, "wb") as f:
                f.write(audio.get_wav_data())
            
            # Transcribe with Whisper via Groq
            text = self.transcribe_with_whisper(temp_filename)
            
            # Clean up temp file
            try:
                os.remove(temp_filename)
            except:
                pass
            
            if text.strip():
                # Process recognized text
                self.update_transcription(text)
                
        except sr.UnknownValueError:
            self.print_status("Sorry, I didn't understand.", "warning")
        except sr.RequestError as e:
            self.print_status(f"API request error: {e}", "error")
        except Exception as e:
            self.print_status(f"Transcription error: {str(e)}", "error")
    
    def transcribe_with_whisper(self, audio_file_path):
        """Transcribe audio using Whisper Large v3 via Groq."""
        try:
            # Read the audio file as binary data
            with open(audio_file_path, "rb") as audio_file:
                audio_data = audio_file.read()
            
            # Call Groq's API for Whisper transcription
            response = self.client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=("audio.wav", audio_data),
                language="en",  # Specify English language for better accuracy
                temperature=0.0  # Use lowest temperature for most accurate transcription
            )
            
            # Extract the transcribed text
            transcribed_text = response.text if hasattr(response, 'text') else str(response)
            
            # Clean up the text to remove common artifacts
            if transcribed_text:
                # Remove any trailing punctuation that might be artifacts
                transcribed_text = re.sub(r'[.,…]+$', '', transcribed_text)
                
                # Remove any "thank you" that might be added at the end
                transcribed_text = re.sub(r'(?i)\s*thank\s+you\s*$', '', transcribed_text)
                
                # Remove common background noise misinterpretations
                transcribed_text = re.sub(r'(?i)^\s*(um+|uh+|hmm+|ah+|oh+)\s*', '', transcribed_text)
                
                # Trim whitespace
                transcribed_text = transcribed_text.strip()
            
            return transcribed_text
            
        except Exception as e:
            self.print_status(f"Whisper transcription error: {str(e)}", "error")
            return ""

    def update_transcription(self, new_text):
        """Update the transcription with new text and handle commands."""
        # Clean up the text
        new_text = new_text.strip()
        
        if not new_text:
            return
            
        # Print user's speech with formatting
        self.print_status(f"You: {new_text}", "user")
        
        # Add to current line
        self.current_line += new_text + " "
        
        # Add to conversation history
        self.conversation_history.append({
            "role": "user",
            "text": new_text,
            "timestamp": datetime.now().isoformat()
        })
        
        # Check for commands
        if self.handle_commands(new_text):
            return
            
        # Save transcription to file if the current line is long enough
        # or if there's a natural break in speech (period, question mark, etc.)
        if len(self.current_line) > 80 or re.search(r'[.!?]$', new_text):
            self.save_to_file()
            self.current_line = ""  # Reset current line after saving
            
    def handle_commands(self, text):
        """Handle special commands in the transcribed text."""
        text_lower = text.lower()
        
        # Exit command
        if text_lower in ["exit", "quit", "stop", "end"]:
            self.print_status("Stopping speech recognition...", "system")
            self.is_running = False
            return True
            
        # Clear command
        elif text_lower in ["clear", "clear transcript", "start over"]:
            self.current_line = ""
            self.print_status("Transcript cleared", "system")
            return True
            
        # Help command
        elif text_lower in ["help", "commands", "what can i say"]:
            self.show_help()
            return True
            
        # No command detected
        return False
        
    def show_help(self):
        """Show available commands."""
        help_text = """
Available commands:
- "exit", "quit", "stop", "end": Stop the application
- "clear", "clear transcript", "start over": Clear the current transcript
- "help", "commands", "what can i say": Show this help message
        """
        self.print_status(help_text, "help")
        
    def print_status(self, message, msg_type="info", end="\n"):
        """Print formatted status messages."""
        prefix = ""
        color = Fore.WHITE
        
        if msg_type == "user":
            color = Fore.GREEN
            prefix = "🗣️ "
        elif msg_type == "system":
            color = Fore.CYAN
            prefix = "🖥️ "
        elif msg_type == "error":
            color = Fore.RED
            prefix = "❌ "
        elif msg_type == "warning":
            color = Fore.YELLOW
            prefix = "⚠️ "
        elif msg_type == "info":
            color = Fore.BLUE
            prefix = "ℹ️ "
        elif msg_type == "help":
            color = Fore.CYAN
            prefix = "❓ "
            
        print(f"{color}{prefix}{message}{Style.RESET_ALL}", end=end)

    def save_to_file(self):
        """Save the current transcription to files with a timestamp."""
        if not self.current_line.strip():
            return
            
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Save to text file
        try:
            with open(self.output_file, "a", encoding="utf-8") as file:
                file.write(f"[{timestamp}] {self.current_line.strip()}\n")
        except Exception as e:
            self.print_status(f"Error saving to text file: {str(e)}", "error")
            
        # Save to JSON file for better structure
        try:
            entry = {
                "timestamp": timestamp,
                "text": self.current_line.strip(),
                "transcription_mode": "whisper-large-v3"
            }
            
            # Load existing data
            json_data = []
            if os.path.exists(self.json_output_file):
                try:
                    with open(self.json_output_file, "r", encoding="utf-8") as f:
                        json_data = json.load(f)
                except:
                    json_data = []
            
            # Append new entry and save
            json_data.append(entry)
            with open(self.json_output_file, "w", encoding="utf-8") as f:
                json.dump(json_data, f, indent=2, ensure_ascii=False)
                
        except Exception as e:
            self.print_status(f"Error saving to JSON file: {str(e)}", "error")
            
    def save_to_nova_ai_format(self, text):
        """Save the transcription in a format that Nova AI can read."""
        try:
            # Path to Nova AI's input file (output.json)
            nova_ai_file = "output.json"
            
            # Create the new format for transcription.json
            current_time = datetime.now()
            timestamp_str = current_time.strftime("%Y-%m-%d %H:%M:%S")
            iso_timestamp = current_time.isoformat()
            
            # Create a unique identifier for this transcription
            transcription_id = hash(f"{text}_{iso_timestamp}")
            
            # Create a transcript format that Nova AI can understand
            transcript_message = {
                "transcripts": [
                    {
                        "user_message": text,
                        "timestamp": iso_timestamp
                    }
                ],
                "answered": False,
                "source": "speech_to_text",
                "transcription_id": str(transcription_id)
            }
            
            # Load existing data if file exists
            transcript_data = []
            if os.path.exists(nova_ai_file):
                try:
                    with open(nova_ai_file, "r", encoding="utf-8") as f:
                        content = f.read().strip()
                        if content:
                            transcript_data = json.loads(content)
                except json.JSONDecodeError:
                    # If the file is corrupted, start fresh
                    transcript_data = []
            
            # Append new message and save
            transcript_data.append(transcript_message)
            
            # Write to a temporary file first, then rename to avoid file corruption
            temp_file = f"{nova_ai_file}.tmp"
            with open(temp_file, "w", encoding="utf-8") as f:
                json.dump(transcript_data, f, indent=2, ensure_ascii=False)
                
            # Rename the temp file to the actual file
            if os.path.exists(temp_file):
                if os.path.exists(nova_ai_file):
                    os.remove(nova_ai_file)
                os.rename(temp_file, nova_ai_file)
                
            self.print_status(f"Voice message sent to Nova AI: '{text}'", "success")
            
        except Exception as e:
            self.print_status(f"Error saving to Nova AI format: {str(e)}", "error")
    
    def start(self):
        """Start the speech recognition application."""
        self.is_running = True
        
        # Print welcome message
        print(f"{Fore.CYAN}========== SPEECH TO TEXT ACTIVATED ==========={Style.RESET_ALL}")
        print(f"{Fore.CYAN}Speak into your microphone to interact with Nova AI.{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Your speech will be transcribed using Whisper Large v3.{Style.RESET_ALL}")
        print(f"{Fore.CYAN}================================================={Style.RESET_ALL}")
        
        # Start the listening thread
        listen_thread = threading.Thread(target=self.listen_and_transcribe)
        listen_thread.daemon = True
        listen_thread.start()
        
        # Start the audio processing thread
        process_thread = threading.Thread(target=self.audio_processor)
        process_thread.daemon = True
        process_thread.start()
        
        try:
            # Keep the main thread running
            while self.is_running:
                time.sleep(0.1)
        except KeyboardInterrupt:
            self.print_status("Stopping...", "system")
        finally:
            self.is_running = False
            self.print_status("Speech recognition stopped.", "system")

if __name__ == "__main__":
    app = SpeechToTextApp()
    app.start()