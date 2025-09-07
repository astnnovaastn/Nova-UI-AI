import speech_recognition as sr
import threading
import time
import os
import queue
import json
import re
import colorama
import groq
from colorama import Fore, Style
from datetime import datetime

# Initialize colorama for colored terminal output
colorama.init()

class WhisperSpeechToTextApp:
    def __init__(self, api_key=None):
        # Initialize speech recognition components
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        
        # Optimize speech recognition settings with much stricter thresholds to prevent false detections
        self.recognizer.pause_threshold = 1.0  # Even longer pause to ensure speech has truly ended
        self.recognizer.non_speaking_duration = 0.8  # Much longer silence detection to avoid false triggers
        self.recognizer.energy_threshold = 500  # Much higher energy threshold to ignore background noise
        self.recognizer.dynamic_energy_threshold = False  # Use fixed threshold for more predictable behavior
        self.recognizer.operation_timeout = 5  # Timeout for processing
        
        # Add a confidence threshold for transcription
        self.min_confidence_threshold = 0.7  # Minimum confidence to accept transcription
        
        # Initialize Groq client for Whisper
        self.api_key = api_key or os.getenv('GROQ_API_KEY')
        if not self.api_key:
            self.api_key = "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"  # Default key if not provided
        self.client = groq.Client(api_key=self.api_key)
        
        # Application state
        self.is_running = False
        self.is_listening = False
        self.speaking_detected = False
        self.output_file = "transcription.txt"
        self.json_output_file = "transcription.json"
        self.nova_ai_file = "output.json"  # File that Nova AI reads from
        self.current_line = ""
        
        # Timing parameters
        self.silence_threshold = 1.0
        self.last_speech_time = time.time()
        
        # Thread communication
        self.audio_queue = queue.Queue()
        
        # Conversation history
        self.conversation_history = []
        
        # Performance metrics
        self.processing_times = []
        
        # Whisper settings
        self.use_whisper = True  # Flag to toggle between Whisper and Google Speech Recognition
        
        # Print welcome message
        print(f"{Fore.CYAN}Voice input mode activated. Speak to interact with Nova AI.{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Your speech will be automatically sent to Nova AI.{Style.RESET_ALL}")

    def listen_and_transcribe(self):
        """Continuously listen for speech and add audio to processing queue."""
        with self.microphone as source:
            # Adjust for ambient noise with longer duration for better calibration
            print(f"{Fore.YELLOW}Adjusting for ambient noise...{Style.RESET_ALL}")
            self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
            
            self.is_listening = True
            while self.is_running:
                try:
                    # Visual indicator that the system is listening
                    if not self.speaking_detected:
                        self.update_listening_status()
                    
                    # Capture audio with balanced timeout and phrase time limit for accuracy
                    audio = self.recognizer.listen(
                        source, 
                        timeout=2,  # Longer timeout to ensure complete capture
                        phrase_time_limit=10  # Longer phrase time limit to capture complete sentences
                    )
                    
                    # Update speech detection status
                    self.speaking_detected = True
                    self.last_speech_time = time.time()
                    
                    # Add audio to processing queue with high priority
                    self.audio_queue.put(audio)
                    
                    # Process immediately for short phrases
                    if len(audio.get_wav_data()) < 100000:  # If audio is short
                        self.print_status("Processing short phrase...", "info", end="\r")
                    
                except sr.WaitTimeoutError:
                    # Reset speaking detection if no speech for a while
                    if time.time() - self.last_speech_time > 1.5:  # Longer time to ensure speech has truly ended
                        if self.speaking_detected:  # Only print message if we were previously speaking
                            self.speaking_detected = False
                            # If we were speaking but now stopped, indicate it
                            self.print_status("Speech ended, processing...", "info", end="\r")
                    continue
                    
                except sr.UnknownValueError:
                    self.speaking_detected = False
                    self.print_status("Didn't catch that, please repeat.", "warning")
                    
                except Exception as e:
                    self.print_status(f"Listening error: {str(e)}", "error")
    
    def update_listening_status(self):
        """Update the listening status indicator."""
        # Only update occasionally to avoid console spam
        if time.time() % 2 < 0.1:
            self.print_status("Listening...", "info", end="\r")
    
    def audio_processor(self):
        """Process audio from the queue in a separate thread."""
        while self.is_running:
            try:
                # Get audio from queue with timeout
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
        """Process the audio for speech recognition using Whisper."""
        try:
            # Check if this is a short audio clip (for faster processing)
            audio_data = audio.get_wav_data()
            audio_length = len(audio_data)
            
            # Much more aggressive filtering of short audio clips (likely noise)
            if audio_length < 40000:  # Significantly increased minimum threshold to filter out noise
                self.print_status("Audio too short, likely noise - ignoring", "info", end="\r")
                return
                
            # Calculate audio energy to detect if it's just background noise
            try:
                import numpy as np
                import wave
                import io
                
                # Convert audio to numpy array for energy calculation
                wav_file = io.BytesIO(audio_data)
                with wave.open(wav_file, 'rb') as wf:
                    n_frames = wf.getnframes()
                    frames = wf.readframes(n_frames)
                    audio_array = np.frombuffer(frames, dtype=np.int16)
                    
                # Calculate RMS energy
                rms_energy = np.sqrt(np.mean(np.square(audio_array.astype(np.float32))))
                
                # Skip if energy is too low (likely just background noise)
                if rms_energy < 500:  # Adjust this threshold based on testing
                    self.print_status(f"Audio energy too low ({rms_energy:.1f}), ignoring", "info", end="\r")
                    return
                    
            except Exception as e:
                # If energy calculation fails, fall back to length-based filtering
                pass
                
            is_short_audio = audio_length < 100000
            
            if self.use_whisper:
                # Save audio to a temporary WAV file
                temp_filename = f"temp_audio_{int(time.time() * 1000)}.wav"
                with open(temp_filename, "wb") as f:
                    f.write(audio_data)
                
                # Different message for short vs long audio
                if is_short_audio:
                    self.print_status("Quick processing...", "whisper", end="\r")
                else:
                    self.print_status("Processing with Whisper...", "whisper", end="\r")
                
                # Transcribe with Whisper via Groq
                text = self.transcribe_with_whisper(temp_filename)
                
                # Clean up temp file
                try:
                    os.remove(temp_filename)
                except:
                    pass
                
                # Much more aggressive text cleaning to remove artifacts and false detections
                if text:
                    # Store original text for comparison
                    original_text = text
                    
                    # Remove "with Whisper..." and similar artifacts
                    text = re.sub(r'(?i)with\s+whisper.*$', '', text)
                    text = re.sub(r'(?i)\s*th\s+whisper.*$', '', text)
                    text = re.sub(r'(?i)\s*sper.*$', '', text)
                    text = re.sub(r'(?i)\s*whisper.*$', '', text)
                    
                    # Remove any trailing punctuation that might be artifacts
                    text = re.sub(r'[.,…]+$', '', text)
                    
                    # Remove any "thank you" that might be added at the end
                    text = re.sub(r'(?i)\s*thank\s+you\s*$', '', text)
                    
                    # Remove common filler words and sounds that are often false detections
                    text = re.sub(r'(?i)^\s*(um|uh|hmm|ah|er|so|well|like|you know|i mean)\s*', '', text)
                    text = re.sub(r'(?i)\s+(um|uh|hmm|ah|er)\s+', ' ', text)
                    
                    # Remove very short words that are often misrecognized
                    text = re.sub(r'\b[a-z]{1,2}\b', '', text, flags=re.IGNORECASE)
                    
                    # Remove repeated words (often a sign of poor recognition)
                    text = re.sub(r'\b(\w+)(\s+\1\b)+', r'\1', text, flags=re.IGNORECASE)
                    
                    # Trim whitespace and normalize spaces
                    text = re.sub(r'\s+', ' ', text).strip()
                    
                    # Skip if text is too short after cleaning (likely noise)
                    if len(text) < 5:  # Increased minimum length
                        self.print_status(f"Detected text too short after cleaning, ignoring: '{text}'", "info", end="\r")
                        return
                        
                    # Skip if text changed too much during cleaning (likely false detection)
                    if len(original_text) > 0 and len(text) / len(original_text) < 0.5:
                        self.print_status(f"Text changed too much during cleaning, likely false detection", "info", end="\r")
                        return
                    
                    # Clear the processing message
                    print("\r" + " " * 50 + "\r", end="")
            else:
                # For short phrases, use Google Speech Recognition for faster response
                if is_short_audio:
                    self.print_status("Quick processing with Google...", "info", end="\r")
                    text = self.recognizer.recognize_google(audio)
                else:
                    # Fallback to Google Speech Recognition
                    text = self.recognizer.recognize_google(audio)
            
            if text and text.strip():
                # Process recognized text
                self.update_transcription(text)
                
                # Indicate that we're ready for more speech
                if not self.speaking_detected:
                    self.print_status("Ready for more speech...", "info", end="\r")
                
        except sr.UnknownValueError:
            self.print_status("Sorry, I didn't understand.", "warning")
        except sr.RequestError as e:
            self.print_status(f"API request error: {e}", "error")
        except Exception as e:
            self.print_status(f"Transcription error: {str(e)}", "error")
            # Fallback to Google Speech Recognition if Whisper fails
            if self.use_whisper:
                try:
                    self.print_status("Falling back to Google Speech Recognition...", "warning")
                    text = self.recognizer.recognize_google(audio)
                    if text and text.strip():
                        self.update_transcription(text)
                except:
                    pass
    
    def transcribe_with_whisper(self, audio_file_path):
        """Transcribe audio using Whisper Large v3 Turbo via Groq."""
        try:
            # Read the audio file as binary data
            with open(audio_file_path, "rb") as audio_file:
                audio_data = audio_file.read()
            
            # Call Groq's API for Whisper transcription with improved parameters
            response = self.client.audio.transcriptions.create(
                model="whisper-large-v3-turbo",
                file=("audio.wav", audio_data),
                language="en",  # Specify English language for better accuracy
                response_format="text",  # Get plain text response
                temperature=0.0  # Use lowest temperature for most accurate transcription
            )
            
            # Extract the transcribed text
            transcribed_text = response.text if hasattr(response, 'text') else str(response)
            
            # Clear the "Processing with Whisper..." message
            print("\r" + " " * 50 + "\r", end="")
            
            return transcribed_text
            
        except Exception as e:
            self.print_status(f"Whisper transcription error: {str(e)}", "error")
            raise

    def update_transcription(self, new_text):
        """Update the transcription with new text and handle commands."""
        # Clean up the text
        new_text = new_text.strip()
        
        if not new_text:
            return
            
        # Additional validation to prevent false detections
        # Skip very short texts that are likely noise
        if len(new_text) < 5:
            self.print_status(f"Text too short, ignoring: '{new_text}'", "warning", end="\r")
            return
            
        # Skip texts that are just common filler words
        filler_words = ["um", "uh", "hmm", "ah", "er", "so", "well", "like", "you know", "i mean"]
        if new_text.lower() in filler_words:
            self.print_status(f"Detected filler word, ignoring: '{new_text}'", "warning", end="\r")
            return
            
        # Skip texts that are just single words (often false detections)
        if len(new_text.split()) == 1 and len(new_text) < 8:
            self.print_status(f"Single short word detected, likely noise: '{new_text}'", "warning", end="\r")
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
        
        # Add a small delay before sending to Nova AI to allow for cancellation
        # This gives a brief window to catch false detections
        self.print_status(f"Sending to Nova AI in 1 second: '{new_text}'", "info")
        time.sleep(1.0)
        
        # Send to Nova AI
        try:
            self.save_to_nova_ai_format(new_text)
            self.print_status(f"✓ Voice input sent to Nova AI: '{new_text}'", "success")
        except Exception as e:
            self.print_status(f"Error sending to Nova AI: {str(e)}", "error")
            # Try again with a slight delay
            time.sleep(0.5)
            try:
                self.save_to_nova_ai_format(new_text)
                self.print_status(f"✓ Voice input sent to Nova AI (retry successful)", "success")
            except Exception as e2:
                self.print_status(f"Failed to send voice input after retry: {str(e2)}", "error")
        
        # Save transcription to file if the current line is long enough
        # or if there's a natural break in speech
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
            
        # Toggle transcription mode
        elif text_lower in ["switch mode", "toggle mode", "change mode"]:
            self.toggle_transcription_mode()
            return True
            
        # Increase sensitivity
        elif text_lower in ["increase sensitivity", "more sensitive"]:
            self.recognizer.energy_threshold = max(300, self.recognizer.energy_threshold * 0.8)
            self.print_status(f"Increased sensitivity. New threshold: {self.recognizer.energy_threshold:.1f}", "system")
            return True
            
        # Decrease sensitivity
        elif text_lower in ["decrease sensitivity", "less sensitive"]:
            self.recognizer.energy_threshold = self.recognizer.energy_threshold * 1.2
            self.print_status(f"Decreased sensitivity. New threshold: {self.recognizer.energy_threshold:.1f}", "system")
            return True
            
        # Cancel last detection (useful for false detections)
        elif text_lower in ["cancel", "ignore that", "delete that", "that's wrong"]:
            if len(self.conversation_history) > 0:
                removed = self.conversation_history.pop()
                self.print_status(f"Cancelled last detection: '{removed['text']}'", "system")
                # Also remove from current line
                self.current_line = ""
            else:
                self.print_status("Nothing to cancel", "system")
            return True
            
        # No command detected
        return False
        
    def show_help(self):
        """Show available commands."""
        help_text = f"""
{Fore.CYAN}Available commands:{Style.RESET_ALL}
- "exit", "quit", "stop", "end": Stop the application
- "clear", "clear transcript", "start over": Clear the current transcript
- "help", "commands", "what can i say": Show this help message
- "switch mode", "toggle mode", "change mode": Switch between Whisper and Google Speech Recognition
- "increase sensitivity", "more sensitive": Make microphone more sensitive
- "decrease sensitivity", "less sensitive": Make microphone less sensitive
- "cancel", "ignore that", "delete that", "that's wrong": Cancel the last detected speech

{Fore.YELLOW}Current mode: {Fore.WHITE}{"Whisper Large v3 Turbo" if self.use_whisper else "Google Speech Recognition"}{Style.RESET_ALL}
{Fore.YELLOW}Current sensitivity: {Fore.WHITE}{self.recognizer.energy_threshold:.1f}{Style.RESET_ALL}

{Fore.RED}If you're experiencing false detections:{Style.RESET_ALL}
1. Try saying "decrease sensitivity" to make the microphone less sensitive
2. Use "cancel" immediately after a false detection
3. Ensure you're in a quiet environment
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
        elif msg_type == "success":
            color = Fore.LIGHTGREEN_EX
            prefix = "✅ "
            prefix = "⚠️ "
        elif msg_type == "info":
            color = Fore.BLUE
            prefix = "ℹ️ "
        elif msg_type == "whisper":
            color = Fore.MAGENTA
            prefix = "🔊 "
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
                "transcription_mode": "whisper-large-v3-turbo" if self.use_whisper else "google-speech-api"
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
            
            # Generate a unique message ID
            message_id = f"voice_{int(time.time() * 1000)}"
            
            # Create the message structure that Nova AI expects
            message = {
                "id": message_id,
                "role": "user",
                "content": text,
                "timestamp": datetime.now().isoformat(),
                "source": "whisper_speech",
                "processed": False  # Mark as unprocessed so Nova AI will pick it up
            }
            
            # Also create a transcript format that Nova AI can understand
            transcript_message = {
                "transcripts": [
                    {
                        "user_message": text,
                        "timestamp": datetime.now().isoformat()
                    }
                ],
                "answered": False,
                "source": "whisper_speech"
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
            transcript_data.append(transcript_message)  # Use the transcript format
            with open(nova_ai_file, "w", encoding="utf-8") as f:
                json.dump(transcript_data, f, indent=2, ensure_ascii=False)
                
            self.print_status(f"Voice message sent to Nova AI: '{text}'", "system")
            
        except Exception as e:
            self.print_status(f"Error sending to Nova AI: {str(e)}", "error")

    def warm_up(self):
        """Warm up the microphone to get rid of ambient noise with enhanced calibration."""
        self.print_status("Starting microphone calibration process...", "system")
        
        # Multiple calibration passes for better accuracy
        with self.microphone as source:
            # First calibration pass - longer duration
            self.print_status("Please remain completely silent for calibration (pass 1 of 3)...", "system")
            self.recognizer.adjust_for_ambient_noise(source, duration=1.5)
            initial_threshold = self.recognizer.energy_threshold
            
            # Second calibration pass
            self.print_status(f"Ambient noise level detected: {initial_threshold:.1f}", "system")
            self.print_status("Please remain silent for second calibration pass...", "system")
            self.recognizer.adjust_for_ambient_noise(source, duration=1.0)
            
            # Third calibration pass
            self.print_status("Final calibration pass...", "system")
            self.recognizer.adjust_for_ambient_noise(source, duration=1.0)
            
            # Set a much higher energy threshold to prevent false triggers
            # Using a higher multiplier for very aggressive noise filtering
            final_threshold = self.recognizer.energy_threshold
            self.recognizer.energy_threshold = final_threshold * 1.5
            
            # Disable dynamic threshold adjustment for more predictable behavior
            self.recognizer.dynamic_energy_threshold = False
            
        self.print_status(f"Calibration complete!", "system")
        self.print_status(f"Initial ambient noise level: {initial_threshold:.1f}", "system")
        self.print_status(f"Final energy threshold set to: {self.recognizer.energy_threshold:.1f}", "system")
        self.print_status("Speak clearly and at a normal volume. Say 'help' for available commands.", "system")

    def detect_speech_end(self):
        """Detect when speech has ended to save the transcription."""
        current_time = time.time()
        time_since_last_speech = current_time - self.last_speech_time
        
        # If we've detected speech before and now there's a significant pause
        # Using a longer threshold to ensure speech has truly ended
        if self.speaking_detected and time_since_last_speech > 1.5:
            self.speaking_detected = False
            
            # Indicate that speech has ended
            self.print_status("Speech ended, finalizing...", "info", end="\r")
            
            # Save current transcription if there's content
            if self.current_line.strip():
                self.save_to_file()
                self.current_line = ""
                
            # Clear the status line
            print("\r" + " " * 50 + "\r", end="")
            
            # Add a small delay to ensure no immediate false triggers
            time.sleep(0.3)
            
            return True
        return False

    def toggle_transcription_mode(self):
        """Toggle between Whisper and Google Speech Recognition."""
        self.use_whisper = not self.use_whisper
        mode = "Whisper Large v3 Turbo" if self.use_whisper else "Google Speech Recognition"
        self.print_status(f"Switched to {mode} mode", "system")

    def show_welcome(self):
        """Show welcome message with instructions."""
        welcome_text = f"""
{Fore.CYAN}╔══════════════════════════════════════════════════════════╗
║                                                          ║
║  {Fore.YELLOW}Enhanced Speech-to-Text with Whisper Large v3 Turbo{Fore.CYAN}     ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝{Style.RESET_ALL}

This application transcribes your speech in real-time using Whisper Large v3 Turbo.
Speak naturally and your words will be transcribed with high accuracy.

{Fore.GREEN}• Transcriptions saved to: {os.path.abspath(self.output_file)}
• JSON data saved to: {os.path.abspath(self.json_output_file)}{Style.RESET_ALL}

{Fore.YELLOW}Commands:{Style.RESET_ALL}
• Say "help" to see available commands
• Say "switch mode" to toggle between Whisper and Google Speech Recognition
• Say "exit" to quit the application

{Fore.CYAN}Starting in 2 seconds...{Style.RESET_ALL}
"""
        print(welcome_text)
        time.sleep(2)  # Give user time to read

    def speech_end_monitor(self):
        """Monitor for end of speech in a separate thread."""
        while self.is_running:
            self.detect_speech_end()
            time.sleep(0.1)  # Check very frequently for better responsiveness

    def run(self):
        """Run the enhanced speech-to-text application with Whisper."""
        self.show_welcome()
        self.is_running = True
        
        # Test Groq API connection
        try:
            self.print_status("Testing Groq API connection...", "system")
            self.client.chat.completions.create(
                model="whisper-large-v3",
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=1
            )
            self.print_status("Groq API connection successful!", "system")
        except Exception as e:
            self.print_status(f"Warning: Groq API connection failed: {str(e)}", "warning")
            self.print_status("Falling back to Google Speech Recognition", "system")
            self.use_whisper = False
        
        # Warm up the microphone
        self.warm_up()
        
        # Start the listening thread
        listening_thread = threading.Thread(target=self.listen_and_transcribe, daemon=True)
        listening_thread.start()
        
        # Start the audio processing thread
        processing_thread = threading.Thread(target=self.audio_processor, daemon=True)
        processing_thread.start()
        
        # Start the speech end detection thread
        speech_end_thread = threading.Thread(target=self.speech_end_monitor, daemon=True)
        speech_end_thread.start()
        
        try:
            # Main loop
            while self.is_running:
                time.sleep(0.1)  # Short sleep to reduce CPU usage
                
        except KeyboardInterrupt:
            self.print_status("Keyboard interrupt detected. Shutting down...", "system")
            self.is_running = False
            
        finally:
            # Clean up
            self.is_running = False
            self.print_status("Waiting for threads to finish...", "system")
            
            # Wait for threads to finish
            listening_thread.join(timeout=1)
            processing_thread.join(timeout=1)
            speech_end_thread.join(timeout=1)
            
            # Save any remaining transcription
            if self.current_line.strip():
                self.save_to_file()
                
            # Show performance metrics
            if self.processing_times:
                avg_time = sum(self.processing_times) / len(self.processing_times)
                self.print_status(f"Average processing time: {avg_time:.2f} seconds", "system")
                
            self.print_status("Enhanced Speech-to-Text stopped. Goodbye!", "system")

def check_dependencies():
    """Check if all required dependencies are installed."""
    try:
        import speech_recognition
        import colorama
        import groq
        return True
    except ImportError as e:
        print(f"Missing dependency: {str(e)}")
        print("Please install all required dependencies:")
        print("pip install SpeechRecognition colorama groq")
        return False

def main():
    """Main function to run the application."""
    # Check dependencies
    if not check_dependencies():
        return
        
    try:
        # Use the Groq API key directly
        api_key = "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"
        
        # Create and run the application
        app = WhisperSpeechToTextApp(api_key=api_key)
        app.run()
    except Exception as e:
        print(f"\n{Fore.RED}Error: {str(e)}{Style.RESET_ALL}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()