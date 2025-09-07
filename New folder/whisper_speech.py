# ============================================================================
# NOVA AI VOICE ASSISTANT
# Enhanced Speech-to-Text with Whisper Large v3 Turbo
# ============================================================================
"""
This module provides a voice interface for Nova AI using Whisper Large v3 Turbo
for high-quality speech recognition. It captures speech from the microphone,
transcribes it, and sends it to Nova AI for processing.

Features:
- Real-time speech recognition with Whisper Large v3 Turbo
- Automatic speech detection and processing
- Visual interface with status indicators
- Voice commands for controlling the application
- Fallback to Google Speech Recognition if Whisper is unavailable
"""

# ============================================================================
# IMPORTS
# ============================================================================

# Standard library imports
import os
import re
import json
import time
import queue
import threading
from datetime import datetime

# Third-party imports
import groq
import colorama
import speech_recognition as sr
from colorama import Fore, Style

# Initialize colorama for colored terminal output
colorama.init(autoreset=True)

# ============================================================================
# MAIN APPLICATION CLASS
# ============================================================================

class WhisperSpeechToTextApp:
    """
    Main application class for the Nova AI Voice Assistant.
    
    This class handles speech recognition, audio processing, and communication
    with Nova AI. It provides a visual interface and voice commands for
    controlling the application.
    """
    
    def __init__(self, api_key=None):
        """
        Initialize the WhisperSpeechToTextApp with the given API key.
        
        Args:
            api_key (str, optional): The Groq API key for Whisper. Defaults to None.
        """
        # Initialize speech recognition components
        self.recognizer = sr.Recognizer()
        self.microphone = sr.Microphone()
        
        # Balance speech recognition settings to better capture all words while avoiding false detections
        self.recognizer.pause_threshold = 0.8  # Shorter pause to capture words spoken with brief pauses
        self.recognizer.non_speaking_duration = 0.6  # Balanced silence detection
        self.recognizer.energy_threshold = 450  # Slightly lower threshold to better capture soft speech
        self.recognizer.dynamic_energy_threshold = True  # Enable dynamic threshold to adapt to your voice
        self.recognizer.operation_timeout = 7  # Longer timeout for better processing
        
        # Add a confidence threshold for transcription
        self.min_confidence_threshold = 0.6  # Lower confidence threshold to accept more words
        
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

    # ========================================================================
    # SPEECH RECOGNITION METHODS
    # ========================================================================
    
    def listen_and_transcribe(self):
        """
        Continuously listen for speech and add audio to processing queue.
        
        This method runs in a separate thread and monitors the microphone for
        speech. When speech is detected, it adds the audio to the processing
        queue for transcription.
        """
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
                    
                    # Enhanced audio capture to better pick up all words
                    audio = self.recognizer.listen(
                        source, 
                        timeout=3,  # Extended timeout to ensure complete capture
                        phrase_time_limit=15  # Extended phrase time limit to capture longer sentences
                    )
                    
                    # Update speech detection status
                    self.speaking_detected = True
                    self.last_speech_time = time.time()
                    
                    # Add audio to processing queue with high priority
                    self.audio_queue.put(audio)
                    
                    # Clear the listening status line
                    print("\r" + " " * 100 + "\r", end="")
                    
                    # Show a more visual processing indicator
                    audio_length = len(audio.get_wav_data())
                    if audio_length < 100000:  # If audio is short
                        self.print_status("Processing short phrase ⏳", "whisper", end="\r")
                    else:
                        # For longer audio, show a more detailed message
                        audio_seconds = audio_length / 32000  # Approximate duration in seconds
                        self.print_status(f"Processing {audio_seconds:.1f}s of speech ⏳", "whisper", end="\r")
                    
                except sr.WaitTimeoutError:
                    # Reset speaking detection if no speech for a while
                    if time.time() - self.last_speech_time > 1.5:  # Longer time to ensure speech has truly ended
                        if self.speaking_detected:  # Only print message if we were previously speaking
                            self.speaking_detected = False
                            # If we were speaking but now stopped, indicate it with a visual cue
                            print("\r" + " " * 100 + "\r", end="")  # Clear the line
                            self.print_status("Speech ended, finalizing transcription... ⏳", "whisper", end="\r")
                    continue
                    
                except sr.UnknownValueError:
                    self.speaking_detected = False
                    self.print_status("Didn't catch that, please repeat.", "warning")
                    
                except Exception as e:
                    self.print_status(f"Listening error: {str(e)}", "error")
    
    def update_listening_status(self):
        """Update the listening status indicator with a more visual display."""
        # Create an animated listening indicator
        current_time = time.time()
        animation_chars = ["◌", "◎", "●", "◎"]
        animation_index = int(current_time * 2) % len(animation_chars)
        animation_char = animation_chars[animation_index]
        
        # Only update occasionally to avoid console spam
        if current_time % 2 < 0.1:
            # Show current status with energy level
            energy_level = min(10, int(self.recognizer.energy_threshold / 100))
            energy_bar = "█" * energy_level + "▒" * (10 - energy_level)
            
            # Show current mode
            mode = "Whisper" if self.use_whisper else "Google"
            
            # Format the status line
            status_line = f"{Fore.CYAN}{animation_char} Listening {animation_char} [{energy_bar}] Mode: {mode}{Style.RESET_ALL}"
            
            # Print the status
            print(f"\r{status_line}", end="")
    
    def audio_processor(self):
        """
        Process audio from the queue in a separate thread.
        
        This method runs in a separate thread and processes audio from the queue.
        It transcribes the audio using Whisper or Google Speech Recognition and
        updates the transcription.
        """
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
        """
        Process the audio for speech recognition using Whisper.
        
        This method transcribes the audio using Whisper or Google Speech Recognition
        and performs various filtering and cleaning operations to improve accuracy.
        
        Args:
            audio (AudioData): The audio data to process.
        """
        try:
            # Check if this is a short audio clip (for faster processing)
            audio_data = audio.get_wav_data()
            audio_length = len(audio_data)
            
            # More balanced filtering of short audio clips to avoid missing words
            if audio_length < 25000:  # Lower threshold to capture shorter words/phrases
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
                
                # Skip if energy is too low (likely just background noise) - lower threshold
                if rms_energy < 300:  # Lower threshold to capture softer speech
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
                
                # Clear any previous status message
                print("\r" + " " * 100 + "\r", end="")
                
                # Different message for short vs long audio with visual progress indicator
                if is_short_audio:
                    self.print_status("⚡ Quick processing with Whisper... ⚡", "whisper", end="\r")
                else:
                    # For longer audio, show a more detailed message with audio length
                    audio_seconds = audio_length / 32000  # Approximate duration in seconds
                    self.print_status(f"🔊 Processing {audio_seconds:.1f}s of speech with Whisper... ⏳", "whisper", end="\r")
                
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
                    
                    # Less strict filtering to avoid missing important words
                    if len(text) < 3:  # Reduced minimum length to capture short words
                        self.print_status(f"Detected text too short after cleaning, ignoring: '{text}'", "info", end="\r")
                        return
                        
                    # Less strict ratio check to avoid filtering out valid speech
                    if len(original_text) > 0 and len(text) / len(original_text) < 0.3:
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
    
    # ========================================================================
    # TRANSCRIPTION METHODS
    # ========================================================================
    
    def transcribe_with_whisper(self, audio_file_path):
        """
        Transcribe audio using Whisper Large v3 Turbo via Groq.
        
        Args:
            audio_file_path (str): Path to the audio file to transcribe.
            
        Returns:
            str: The transcribed text.
            
        Raises:
            Exception: If transcription fails.
        """
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
        """
        Update the transcription with new text and handle commands.
        
        This method processes the transcribed text, checks for commands,
        and sends the text to Nova AI if it's not a command.
        
        Args:
            new_text (str): The new text to add to the transcription.
        """
        # Clean up the text
        new_text = new_text.strip()
        
        if not new_text:
            return
            
        # Less strict validation to better capture all words
        # Only skip extremely short texts
        if len(new_text) < 2:
            self.print_status(f"Text too short, ignoring: '{new_text}'", "warning", end="\r")
            return
            
        # Only skip exact matches of very common filler words
        filler_words = ["um", "uh", "hmm", "ah", "er"]
        if new_text.lower() in filler_words:
            self.print_status(f"Detected filler word, ignoring: '{new_text}'", "warning", end="\r")
            return
            
        # Allow single words as they might be important commands or responses
        # Only filter out very short single words that are likely noise
        if len(new_text.split()) == 1 and len(new_text) < 3:
            self.print_status(f"Single very short word detected, likely noise: '{new_text}'", "warning", end="\r")
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
        print("\n")  # Add some space for better readability
        
        # Show a countdown with progress bar
        self.print_status(f"Preparing to send to Nova AI: '{new_text}'", "info")
        
        # Visual countdown
        for i in range(10, 0, -1):
            progress = "■" * (10 - i) + "□" * i
            print(f"\r{Fore.YELLOW}Sending in {i/10:.1f}s [{progress}] (Say 'cancel' to abort){Style.RESET_ALL}", end="")
            time.sleep(0.1)
            
        # Clear the countdown line
        print("\r" + " " * 100 + "\r", end="")
        
        # Send to Nova AI with visual feedback
        try:
            # Show sending animation
            print(f"{Fore.CYAN}Sending to Nova AI... ⏳{Style.RESET_ALL}")
            
            # Actually send the data
            self.save_to_nova_ai_format(new_text)
            
            # Show success message with checkmark and timestamp
            timestamp = datetime.now().strftime("%H:%M:%S")
            print(f"{Fore.LIGHTGREEN_EX + Style.BRIGHT}✓ [{timestamp}] Message sent successfully to Nova AI{Style.RESET_ALL}")
            print(f"{Fore.GREEN}Message: \"{new_text}\"{Style.RESET_ALL}")
            print()  # Add empty line for spacing
            
        except Exception as e:
            self.print_status(f"Error sending to Nova AI: {str(e)}", "error")
            # Try again with a slight delay
            time.sleep(0.5)
            try:
                print(f"{Fore.YELLOW}Retrying...{Style.RESET_ALL}")
                self.save_to_nova_ai_format(new_text)
                self.print_status(f"✓ Voice input sent to Nova AI (retry successful)", "success")
            except Exception as e2:
                self.print_status(f"Failed to send voice input after retry: {str(e2)}", "error")
        
        # Save transcription to file if the current line is long enough
        # or if there's a natural break in speech
        if len(self.current_line) > 80 or re.search(r'[.!?]$', new_text):
            self.save_to_file()
            self.current_line = ""  # Reset current line after saving
            
    # ========================================================================
    # COMMAND HANDLING METHODS
    # ========================================================================
    
    def handle_commands(self, text):
        """
        Handle special commands in the transcribed text.
        
        This method checks if the transcribed text contains a command and
        executes the corresponding action if it does.
        
        Args:
            text (str): The text to check for commands.
            
        Returns:
            bool: True if a command was executed, False otherwise.
        """
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
        """
        Show available commands.
        
        This method displays a help message with all available voice commands.
        """
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
        
    # ========================================================================
    # UI AND DISPLAY METHODS
    # ========================================================================
    
    def print_status(self, message, msg_type="info", end="\n"):
        """
        Print formatted status messages with improved visual presentation.
        
        Args:
            message (str): The message to print.
            msg_type (str, optional): The type of message. Defaults to "info".
            end (str, optional): The end character. Defaults to "\\n".
        """
        prefix = ""
        color = Fore.WHITE
        style_prefix = ""
        
        # Clear the current line for cleaner output
        if end == "\r":
            print("\r" + " " * 100 + "\r", end="")
        
        # Configure message styling based on type
        if msg_type == "user":
            color = Fore.GREEN
            prefix = "🗣️ YOU: "
            style_prefix = Style.BRIGHT
        elif msg_type == "system":
            color = Fore.CYAN
            prefix = "🖥️ SYSTEM: "
        elif msg_type == "error":
            color = Fore.RED
            prefix = "❌ ERROR: "
            style_prefix = Style.BRIGHT
        elif msg_type == "warning":
            color = Fore.YELLOW
            prefix = "⚠️ NOTICE: "
        elif msg_type == "success":
            color = Fore.LIGHTGREEN_EX
            prefix = "✅ SUCCESS: "
        elif msg_type == "info":
            color = Fore.BLUE
            prefix = "ℹ️ INFO: "
        elif msg_type == "whisper":
            color = Fore.MAGENTA
            prefix = "🔊 WHISPER: "
        elif msg_type == "help":
            color = Fore.CYAN
            prefix = "❓ HELP: "
            
        # For status updates that use carriage return, use a simpler format
        if end == "\r":
            print(f"{color}{style_prefix}● {message}{Style.RESET_ALL}", end=end)
        else:
            # Add timestamp for normal messages
            timestamp = datetime.now().strftime("%H:%M:%S")
            
            # For user messages, make them stand out more
            if msg_type == "user":
                print(f"\n{color}{style_prefix}{prefix}{message}{Style.RESET_ALL}", end=end)
            else:
                # For system messages, use a more subtle format with timestamp
                print(f"{Fore.LIGHTBLACK_EX}[{timestamp}]{Style.RESET_ALL} {color}{style_prefix}{prefix}{message}{Style.RESET_ALL}", end=end)

    # ========================================================================
    # FILE OPERATIONS METHODS
    # ========================================================================
    
    def save_to_file(self):
        """
        Save the current transcription to files with a timestamp.
        
        This method saves the current transcription to both a text file and a
        JSON file for better structure.
        """
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
        """
        Save the transcription in a format that Nova AI can read.
        
        This method saves the transcription to a JSON file that Nova AI can read
        and process.
        
        Args:
            text (str): The text to save.
            
        Raises:
            Exception: If saving fails.
        """
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

    # ========================================================================
    # MICROPHONE CALIBRATION METHODS
    # ========================================================================
    
    def warm_up(self):
        """
        Warm up the microphone to get rid of ambient noise with enhanced calibration.
        
        This method performs multiple calibration passes to better adapt to the
        ambient noise level and set appropriate thresholds.
        """
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
            
            # Set a more balanced energy threshold to better capture speech
            # Using a moderate multiplier for better word detection
            final_threshold = self.recognizer.energy_threshold
            self.recognizer.energy_threshold = final_threshold * 1.2
            
            # Enable dynamic threshold adjustment to adapt to your voice
            self.recognizer.dynamic_energy_threshold = True
            self.recognizer.dynamic_energy_adjustment_damping = 0.15  # More responsive adjustment
            self.recognizer.dynamic_energy_ratio = 1.5  # More sensitive ratio
            
        self.print_status(f"Calibration complete!", "system")
        self.print_status(f"Initial ambient noise level: {initial_threshold:.1f}", "system")
        self.print_status(f"Final energy threshold set to: {self.recognizer.energy_threshold:.1f}", "system")
        self.print_status("Speak clearly and at a normal volume. Say 'help' for available commands.", "system")

    def detect_speech_end(self):
        """
        Detect when speech has ended to save the transcription.
        
        This method checks if speech has ended based on the time since the last
        speech was detected. If speech has ended, it saves the current transcription.
        
        Returns:
            bool: True if speech has ended, False otherwise.
        """
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
                
                # Add a visual separator between speech segments for better readability
                print(f"\n{Fore.LIGHTBLACK_EX}{'─' * 80}{Style.RESET_ALL}\n")
                
            # Clear the status line
            print("\r" + " " * 50 + "\r", end="")
            
            # Add a small delay to ensure no immediate false triggers
            time.sleep(0.3)
            
            return True
        return False

    def toggle_transcription_mode(self):
        """
        Toggle between Whisper and Google Speech Recognition.
        
        This method switches between Whisper and Google Speech Recognition
        for transcription.
        """
        self.use_whisper = not self.use_whisper
        mode = "Whisper Large v3 Turbo" if self.use_whisper else "Google Speech Recognition"
        self.print_status(f"Switched to {mode} mode", "system")

    def show_welcome(self):
        """
        Show welcome message with instructions.
        
        This method displays a welcome message with instructions for using
        the application.
        """
        # Clear the terminal for a fresh start
        os.system('cls' if os.name == 'nt' else 'clear')
        
        welcome_text = f"""
{Fore.CYAN + Style.BRIGHT}╔═══════════════════════════════════════════════════════════════════╗
║                                                                   ║
║  {Fore.WHITE + Style.BRIGHT}NOVA AI VOICE ASSISTANT{Fore.CYAN + Style.BRIGHT}                                         ║
║  {Fore.YELLOW}Powered by Whisper Large v3 Turbo{Fore.CYAN + Style.BRIGHT}                              ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝{Style.RESET_ALL}

{Fore.WHITE + Style.BRIGHT}ABOUT{Style.RESET_ALL}
This application transcribes your speech in real-time with high accuracy
and sends it directly to Nova AI for processing.

{Fore.WHITE + Style.BRIGHT}FILES{Style.RESET_ALL}
{Fore.GREEN}• Transcriptions: {Style.RESET_ALL}{os.path.abspath(self.output_file)}
{Fore.GREEN}• JSON data:      {Style.RESET_ALL}{os.path.abspath(self.json_output_file)}

{Fore.WHITE + Style.BRIGHT}VOICE COMMANDS{Style.RESET_ALL}
{Fore.YELLOW}• "help"{Style.RESET_ALL}          - Show all available commands
{Fore.YELLOW}• "switch mode"{Style.RESET_ALL}   - Toggle between Whisper and Google Speech
{Fore.YELLOW}• "cancel"{Style.RESET_ALL}        - Cancel the last detected speech
{Fore.YELLOW}• "exit"{Style.RESET_ALL}          - Quit the application

{Fore.WHITE + Style.BRIGHT}TIPS FOR BEST RESULTS{Style.RESET_ALL}
• Speak clearly at a normal volume
• Pause briefly between sentences
• Use "decrease sensitivity" if you experience false detections
• Use "cancel" immediately after any incorrect transcription

{Fore.CYAN + Style.BRIGHT}Starting in 3 seconds...{Style.RESET_ALL}
"""
        print(welcome_text)
        
        # Countdown timer for a more polished look
        for i in range(3, 0, -1):
            print(f"\r{Fore.CYAN + Style.BRIGHT}Starting in {i} seconds...{Style.RESET_ALL}", end="")
            time.sleep(1)
            
        # Clear the countdown line
        print("\r" + " " * 50)

    def speech_end_monitor(self):
        """
        Monitor for end of speech in a separate thread.
        
        This method runs in a separate thread and continuously checks if speech
        has ended.
        """
        while self.is_running:
            self.detect_speech_end()
            time.sleep(0.1)  # Check very frequently for better responsiveness

    # ========================================================================
    # MAIN APPLICATION METHODS
    # ========================================================================
    
    def run(self):
        """
        Run the enhanced speech-to-text application with Whisper.
        
        This method starts the application, initializes all components, and
        runs the main loop.
        """
        self.show_welcome()
        self.is_running = True
        
        # Show startup progress
        print(f"\n{Fore.CYAN + Style.BRIGHT}INITIALIZING VOICE ASSISTANT{Style.RESET_ALL}")
        print(f"{Fore.LIGHTBLACK_EX}{'─' * 80}{Style.RESET_ALL}")
        
        # Test Groq API connection with visual progress indicator
        try:
            print(f"{Fore.YELLOW}[1/4] {Fore.WHITE}Testing Groq API connection...{Style.RESET_ALL}", end="")
            self.client.chat.completions.create(
                model="whisper-large-v3",
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=1
            )
            print(f"\r{Fore.YELLOW}[1/4] {Fore.WHITE}Testing Groq API connection... {Fore.LIGHTGREEN_EX}✓ Connected{Style.RESET_ALL}")
        except Exception as e:
            print(f"\r{Fore.YELLOW}[1/4] {Fore.WHITE}Testing Groq API connection... {Fore.RED}✗ Failed{Style.RESET_ALL}")
            print(f"{Fore.RED}      Error: {str(e)}{Style.RESET_ALL}")
            print(f"{Fore.YELLOW}      Falling back to Google Speech Recognition{Style.RESET_ALL}")
            self.use_whisper = False
        
        # Warm up the microphone with progress indicator
        print(f"{Fore.YELLOW}[2/4] {Fore.WHITE}Calibrating microphone...{Style.RESET_ALL}")
        self.warm_up()
        print(f"{Fore.YELLOW}[2/4] {Fore.WHITE}Calibrating microphone... {Fore.LIGHTGREEN_EX}✓ Calibrated{Style.RESET_ALL}")
        
        # Start the listening thread
        print(f"{Fore.YELLOW}[3/4] {Fore.WHITE}Starting speech recognition services...{Style.RESET_ALL}", end="")
        listening_thread = threading.Thread(target=self.listen_and_transcribe, daemon=True)
        listening_thread.start()
        
        # Start the audio processing thread
        processing_thread = threading.Thread(target=self.audio_processor, daemon=True)
        processing_thread.start()
        
        # Start the speech end detection thread
        speech_end_thread = threading.Thread(target=self.speech_end_monitor, daemon=True)
        speech_end_thread.start()
        
        # Small delay to ensure threads are running
        time.sleep(0.5)
        print(f"\r{Fore.YELLOW}[3/4] {Fore.WHITE}Starting speech recognition services... {Fore.LIGHTGREEN_EX}✓ Running{Style.RESET_ALL}")
        
        # Final startup step
        print(f"{Fore.YELLOW}[4/4] {Fore.WHITE}Preparing voice interface...{Style.RESET_ALL}", end="")
        time.sleep(0.5)  # Short delay for visual effect
        print(f"\r{Fore.YELLOW}[4/4] {Fore.WHITE}Preparing voice interface... {Fore.LIGHTGREEN_EX}✓ Ready{Style.RESET_ALL}")
        
        # Show completion message
        print(f"\n{Fore.LIGHTGREEN_EX + Style.BRIGHT}VOICE ASSISTANT READY{Style.RESET_ALL}")
        print(f"{Fore.LIGHTBLACK_EX}{'─' * 80}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}Listening for your voice. Speak clearly and naturally.{Style.RESET_ALL}")
        print(f"{Fore.CYAN}Say {Fore.YELLOW}\"help\"{Fore.CYAN} for available commands.{Style.RESET_ALL}\n")
        
        try:
            # Main loop
            while self.is_running:
                time.sleep(0.1)  # Short sleep to reduce CPU usage
                
        except KeyboardInterrupt:
            self.print_status("Keyboard interrupt detected. Shutting down...", "system")
            self.is_running = False
            
        finally:
            # Clean up with visual shutdown sequence
            self.is_running = False
            
            print(f"\n{Fore.CYAN + Style.BRIGHT}SHUTTING DOWN VOICE ASSISTANT{Style.RESET_ALL}")
            print(f"{Fore.LIGHTBLACK_EX}{'─' * 80}{Style.RESET_ALL}")
            
            # Wait for threads to finish with progress indicators
            print(f"{Fore.YELLOW}[1/3] {Fore.WHITE}Stopping speech recognition...{Style.RESET_ALL}", end="")
            listening_thread.join(timeout=1)
            print(f"\r{Fore.YELLOW}[1/3] {Fore.WHITE}Stopping speech recognition... {Fore.LIGHTGREEN_EX}✓ Done{Style.RESET_ALL}")
            
            print(f"{Fore.YELLOW}[2/3] {Fore.WHITE}Saving final transcriptions...{Style.RESET_ALL}", end="")
            # Save any remaining transcription
            if self.current_line.strip():
                self.save_to_file()
            processing_thread.join(timeout=1)
            speech_end_thread.join(timeout=1)
            print(f"\r{Fore.YELLOW}[2/3] {Fore.WHITE}Saving final transcriptions... {Fore.LIGHTGREEN_EX}✓ Done{Style.RESET_ALL}")
            
            # Show performance metrics
            print(f"{Fore.YELLOW}[3/3] {Fore.WHITE}Generating session report...{Style.RESET_ALL}", end="")
            time.sleep(0.5)  # Short delay for visual effect
            
            # Create a session summary
            if self.processing_times:
                avg_time = sum(self.processing_times) / len(self.processing_times)
                max_time = max(self.processing_times)
                min_time = min(self.processing_times)
                total_processed = len(self.processing_times)
                
                print(f"\r{Fore.YELLOW}[3/3] {Fore.WHITE}Generating session report... {Fore.LIGHTGREEN_EX}✓ Done{Style.RESET_ALL}")
                
                # Print session summary
                print(f"\n{Fore.WHITE + Style.BRIGHT}SESSION SUMMARY:{Style.RESET_ALL}")
                print(f"{Fore.CYAN}• Total speech segments processed: {Fore.WHITE}{total_processed}{Style.RESET_ALL}")
                print(f"{Fore.CYAN}• Average processing time: {Fore.WHITE}{avg_time:.2f} seconds{Style.RESET_ALL}")
                print(f"{Fore.CYAN}• Fastest processing time: {Fore.WHITE}{min_time:.2f} seconds{Style.RESET_ALL}")
                print(f"{Fore.CYAN}• Slowest processing time: {Fore.WHITE}{max_time:.2f} seconds{Style.RESET_ALL}")
            else:
                print(f"\r{Fore.YELLOW}[3/3] {Fore.WHITE}Generating session report... {Fore.YELLOW}No speech processed{Style.RESET_ALL}")
            
            # Final goodbye message
            print(f"\n{Fore.LIGHTGREEN_EX + Style.BRIGHT}VOICE ASSISTANT SHUTDOWN COMPLETE{Style.RESET_ALL}")
            print(f"{Fore.CYAN}Thank you for using Nova AI Voice Assistant. Goodbye!{Style.RESET_ALL}")
            print(f"{Fore.LIGHTBLACK_EX}{'─' * 80}{Style.RESET_ALL}")

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def check_dependencies():
    """
    Check if all required dependencies are installed.
    
    Returns:
        bool: True if all dependencies are installed, False otherwise.
    """
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
    """
    Main function to run the application.
    
    This function checks dependencies, creates an instance of the
    WhisperSpeechToTextApp class, and runs it.
    """
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

# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    main()