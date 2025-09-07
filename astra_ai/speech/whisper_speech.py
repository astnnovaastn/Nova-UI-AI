#!/usr/bin/env python3
"""
Vosk Speech Recognition Module for Astra AI

This module provides a speech recognition system using the Vosk toolkit,
which offers offline speech recognition capabilities. It's designed to be
more reliable and efficient than cloud-based solutions.

Usage:
    python -m astra_ai.speech.vosk_speech

Features:
    - Offline speech recognition using Vosk
    - Real-time transcription with minimal latency
    - Automatic model download if not available locally
    - Clean terminal interface with status indicators
    - Transcription saving to multiple formats
"""

import os
import sys
import json
import time
import threading
import queue
import re
from datetime import datetime

# Set Vosk log level - only show errors, not warnings
os.environ["VOSK_LOG_LEVEL"] = "2"

# Try to import colorama for colored terminal output
try:
    from colorama import init, Fore, Style
    init(autoreset=True)
except ImportError:
    # Define dummy Fore and Style if colorama is not available
    class DummyColor:
        def __getattr__(self, name):
            return ""
    Fore = DummyColor()
    Style = DummyColor()

# Check for required dependencies
def check_dependencies():
    """Check if all required dependencies are installed."""
    missing_deps = []
    
    try:
        import vosk
    except ImportError:
        missing_deps.append("vosk")
    
    try:
        import pyaudio
    except ImportError:
        missing_deps.append("pyaudio")
    
    if missing_deps:
        print(f"{Fore.RED}Missing dependencies: {', '.join(missing_deps)}{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}Please install required dependencies:{Style.RESET_ALL}")
        print(f"pip install {' '.join(missing_deps)}")
        return False
    
    return True

class VoskSpeechRecognizer:
    """
    Speech recognition system using Vosk for offline transcription.
    """
    
    def __init__(self, model_path=None):
        """
        Initialize the VoskSpeechRecognizer with simple, reliable settings.
        
        Args:
            model_path (str, optional): Path to the Vosk model. If None, 
                                        will download a standard English model.
        """
        # Import dependencies
        import vosk
        import pyaudio
        
        self.vosk = vosk
        self.pyaudio = pyaudio
        
        # Application state
        self.is_running = False
        self.is_listening = False
        self.current_line = ""
        self.conversation_history = []
        
        # Basic recognition settings
        self.speech_buffer = []  # Buffer to store recent speech segments
        self.buffer_max_size = 5  # Maximum number of segments to store
        
        # Output files
        self.output_dir = "transcriptions"
        self.output_file = os.path.join(self.output_dir, "recognized_text.txt")
        self.json_output_file = os.path.join(self.output_dir, "transcription.json")
        self.nova_ai_file = os.path.join(self.output_dir, "nova_ai.json")  # <-- Add this line
        
        # Create output directory if it doesn't exist
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Initialize the model
        print(f"{Fore.CYAN}Initializing speech recognition model...{Style.RESET_ALL}")
        if model_path and os.path.exists(model_path):
            self.model = vosk.Model(model_path)
            print(f"{Fore.GREEN}Using local model: {model_path}{Style.RESET_ALL}")
        else:
            # Use the standard model
            print(f"{Fore.YELLOW}Local model not found. Downloading model...{Style.RESET_ALL}")
            try:
                # Use the standard model
                self.model = vosk.Model(lang="en-us")
                print(f"{Fore.GREEN}Model downloaded successfully{Style.RESET_ALL}")
            except Exception as e:
                print(f"{Fore.RED}Error downloading model: {str(e)}{Style.RESET_ALL}")
                print(f"{Fore.YELLOW}Trying alternative download method...{Style.RESET_ALL}")
                try:
                    # Try without specifying language
                    self.model = vosk.Model()
                    print(f"{Fore.GREEN}Default model downloaded successfully{Style.RESET_ALL}")
                except Exception as e2:
                    print(f"{Fore.RED}Failed to download any model: {str(e2)}{Style.RESET_ALL}")
                    raise
        
        # Create a recognizer with basic settings
        expected_words = [
            "help", "terminate", "stop", "exit", "repeat", "again", "what", "can", "you", "do",
            "yes", "no", "please", "thank you", "open", "close", "start", "end", "save", "load"
        ]
        self.recognizer = vosk.KaldiRecognizer(self.model, 16000)
        
        # Set basic parameters
        try:
            # These settings help with word recognition
            self.recognizer.SetWords(True)
            self.recognizer.SetPartialWords(True)  # Show partial words for more live feedback
        except Exception:
            # Continue with basic features
            pass
        
        # Initialize PyAudio
        self.p = pyaudio.PyAudio()
        
        # Thread communication
        self.text_queue = queue.Queue()
        
        # Status indicators
        self.last_activity_time = time.time()  # Track confidence for repeated words
        
    def start_listening(self):
        """Start the audio stream and begin listening with simple, reliable settings."""
        try:
            device_index = self._find_best_microphone()
            self.stream = self.p.open(
                format=self.pyaudio.paInt16,
                channels=1,
                rate=16000,
                input=True,
                frames_per_buffer=512,  # Lower buffer for faster response
                input_device_index=device_index if device_index is not None else None
            )
            time.sleep(0.2)  # Shorter warmup
            self.is_listening = True
            print(f"{Fore.GREEN}Microphone activated - ready to capture everything you say{Style.RESET_ALL}")
            self.listen_thread = threading.Thread(target=self._listen_loop, daemon=True)
            self.listen_thread.start()
            self.process_thread = threading.Thread(target=self._process_loop, daemon=True)
            self.process_thread.start()
        except Exception as e:
            print(f"{Fore.RED}Error starting microphone: {str(e)}{Style.RESET_ALL}")
            self.is_listening = False

    def _find_best_microphone(self):
        """Find the best microphone for speech recognition."""
        try:
            # Get information about audio devices
            info = self.p.get_host_api_info_by_index(0)
            num_devices = info.get('deviceCount')
            
            # List all input devices
            input_devices = []
            for i in range(num_devices):
                device_info = self.p.get_device_info_by_index(i)
                if device_info.get('maxInputChannels') > 0:
                    input_devices.append((i, device_info))
            
            if not input_devices:
                print(f"{Fore.YELLOW}No input devices found. Using default.{Style.RESET_ALL}")
                return None
            
            # Try to find a device with "mic" or "microphone" in the name
            for idx, device_info in input_devices:
                name = device_info.get('name', '').lower()
                if 'mic' in name or 'microphone' in name:
                    print(f"{Fore.GREEN}Selected microphone: {device_info.get('name')}{Style.RESET_ALL}")
                    return idx
            
            # If no specific mic found, use the first input device
            print(f"{Fore.YELLOW}Using default microphone: {input_devices[0][1].get('name')}{Style.RESET_ALL}")
            return input_devices[0][0]
            
        except Exception as e:
            print(f"{Fore.YELLOW}Error finding microphone: {str(e)}. Using default.{Style.RESET_ALL}")
            return None
    

    
    def _listen_loop(self):
        """Improved listening loop for natural, accurate voice chat."""
        try:
            silence_counter = 0
            silence_limit = 15  # About 1.5 seconds of silence = end of utterance
            last_partial = ""
            audio_buffer = []

            while self.is_running and self.is_listening:
                try:
                    data = self.stream.read(512, exception_on_overflow=False)
                    audio_buffer.append(data)

                    # Process when we have enough data (~1024 samples)
                    if len(audio_buffer) >= 2:
                        combined_data = b''.join(audio_buffer)
                        if self.recognizer.AcceptWaveform(combined_data):
                            result = json.loads(self.recognizer.Result())
                            if 'text' in result and result['text'].strip():
                                recognized_text = result['text']
                                self.text_queue.put(recognized_text)
                                print(f"\r{' ' * 100}\r{Fore.GREEN}You: {recognized_text}{Style.RESET_ALL}")
                            silence_counter = 0
                            last_partial = ""
                        else:
                            partial = json.loads(self.recognizer.PartialResult())
                            partial_text = partial.get('partial', '').strip()
                            if partial_text and partial_text != last_partial:
                                print(f"\r{Fore.CYAN}... {partial_text}{' ' * 40}{Style.RESET_ALL}", end="\r")
                                last_partial = partial_text
                                silence_counter = 0
                            elif not partial_text:
                                silence_counter += 1
                                if silence_counter > silence_limit and last_partial:
                                    self.text_queue.put(last_partial)
                                    print(f"\r{' ' * 100}\r{Fore.WHITE}✓ {last_partial}{Style.RESET_ALL}")
                                    last_partial = ""
                                    silence_counter = 0
                        audio_buffer = []

                    # Show active listening indicator
                    if time.time() - self.last_activity_time > 1.0:
                        spinner = "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏"[int(time.time() * 8) % 10]
                        print(f"\r{Fore.BLUE}Listening {spinner} {' ' * 40}{Style.RESET_ALL}", end="\r")

                except IOError:
                    time.sleep(0.01)
                    continue

        except Exception as e:
            print(f"{Fore.RED}❌ Error in listening loop: {str(e)}{Style.RESET_ALL}")
            self.is_listening = False
    

    
    def _process_loop(self):
        """Process recognized text from the queue with real-time display."""
        command_words = {"help", "terminate", "stop", "exit", "repeat", "again", "what", "can", "you", "do"}
        while self.is_running:
            try:
                try:
                    text = self.text_queue.get(timeout=0.2)
                except queue.Empty:
                    continue

                text = self._clean_text(text)
                # Only accept if it's a command or at least 2 words
                if not text or (len(text.split()) < 2 and text.lower() not in command_words):
                    continue

                print(f"\r{' ' * 60}\r", end="")
                print(f"{Fore.WHITE}{text}{Style.RESET_ALL}")

                self.conversation_history.append(text)
                self._save_to_file(text)

                if any(cmd in text.lower() for cmd in ["terminate", "stop", "exit", "quit", "end"]):
                    print(f"{Fore.YELLOW}Termination command detected. Stopping...{Style.RESET_ALL}")
                    self.is_running = False
                    break

                if any(cmd in text.lower() for cmd in ["help", "show help", "commands", "what can you do"]):
                    self._show_help()

            except Exception as e:
                print(f"{Fore.RED}Error processing text: {str(e)}{Style.RESET_ALL}")
    
    def _clean_text(self, text):
        """
        Simple text cleaning that preserves the exact words spoken.
        """
        # Convert to string if needed
        if not isinstance(text, str):
            text = str(text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Skip if text is empty after basic cleaning
        if not text:
            return ""
        
        # Basic capitalization for readability
        if text and len(text) > 0:
            text = text[0].upper() + text[1:]
        
        # Capitalize 'i' pronoun for readability
        text = re.sub(r'\bi\b', 'I', text)
        
        # Add to speech buffer for context
        self.speech_buffer.append(text)
        if len(self.speech_buffer) > self.buffer_max_size:
            self.speech_buffer.pop(0)
        
        return text
    

    
    def _save_to_file(self, text):
        """Save the recognized text to files."""
        try:
            # Save to plain text file
            with open(self.output_file, "a", encoding="utf-8") as f:
                f.write(text + "\n")
            
            # Save to JSON file
            timestamp = datetime.now().isoformat()
            entry = {
                "timestamp": timestamp,
                "text": text
            }
            
            try:
                # Read existing JSON data
                if os.path.exists(self.json_output_file) and os.path.getsize(self.json_output_file) > 0:
                    with open(self.json_output_file, "r", encoding="utf-8") as f:
                        data = json.load(f)
                else:
                    data = {"transcriptions": []}
                
                # Add new entry
                data["transcriptions"].append(entry)
                
                # Write updated JSON data
                with open(self.json_output_file, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2)
                
                # Save to Nova AI format
                nova_data = {
                    "input": text,
                    "timestamp": timestamp
                }
                
                with open(self.nova_ai_file, "w", encoding="utf-8") as f:
                    json.dump(nova_data, f, indent=2)
                    
            except Exception as e:
                print(f"{Fore.RED}Error saving to JSON: {str(e)}{Style.RESET_ALL}")
                
        except Exception as e:
            print(f"{Fore.RED}Error saving to file: {str(e)}{Style.RESET_ALL}")
    
    def _show_help(self):
        """Show help information."""
        print(f"\n{Fore.CYAN}=== Voice Commands ===={Style.RESET_ALL}")
        print(f"{Fore.YELLOW}help{Style.RESET_ALL} - Show this help message")
        print(f"{Fore.YELLOW}terminate{Style.RESET_ALL} - Stop the speech recognition")
        print(f"{Fore.CYAN}======================{Style.RESET_ALL}\n")
    
    def stop(self):
        """Stop the speech recognition and clean up resources."""
        self.is_running = False
        self.is_listening = False
        
        # Stop and close the stream
        if hasattr(self, 'stream'):
            try:
                self.stream.stop_stream()
                self.stream.close()
            except:
                pass
        
        # Terminate PyAudio
        if hasattr(self, 'p'):
            try:
                self.p.terminate()
            except:
                pass
        
        print(f"{Fore.GREEN}Speech recognition stopped{Style.RESET_ALL}")
    
    def run(self):
        """Run the speech recognition system with live transcription."""
        self.is_running = True
        
        # Show welcome message
        print(f"\n{Fore.CYAN + Style.BRIGHT}LIVE SPEECH-TO-TEXT ACTIVE{Style.RESET_ALL}")
        print(f"{Fore.LIGHTGREEN_EX}I will capture everything you say in real-time{Style.RESET_ALL}")
        print(f"{Fore.CYAN}Say {Fore.YELLOW}\"help\"{Fore.CYAN} for available commands{Style.RESET_ALL}")
        print(f"{Fore.CYAN}Say {Fore.YELLOW}\"terminate\"{Fore.CYAN} or {Fore.YELLOW}\"stop\"{Fore.CYAN} to end the program{Style.RESET_ALL}\n")
        
        # Start listening
        self.start_listening()
        
        try:
            # Main loop
            while self.is_running:
                time.sleep(0.1)
                
        except KeyboardInterrupt:
            print(f"\n{Fore.YELLOW}Keyboard interrupt detected. Shutting down...{Style.RESET_ALL}")
            
        finally:
            # Clean up
            self.stop()
            
            # Show summary
            print(f"\n{Fore.CYAN}Session Summary:{Style.RESET_ALL}")
            print(f"{Fore.WHITE}Captured {len(self.conversation_history)} speech segments{Style.RESET_ALL}")
            print(f"{Fore.WHITE}Transcription saved to: {self.output_file}{Style.RESET_ALL}")
            print(f"\n{Fore.GREEN}Thank you for using Live Speech-to-Text!{Style.RESET_ALL}")

def main():
    """Main function to run the speech recognition application."""
    print(f"{Fore.CYAN}Starting Vosk Speech Recognition System...{Style.RESET_ALL}")
    
    # Check dependencies
    if not check_dependencies():
        return
    
    # Use a simple model path approach
    model_path = None
    if os.path.exists("vosk-model-en-us-0.22"):
        model_path = "vosk-model-en-us-0.22"
    else:
        model_path = None
    if os.path.exists("model"):
        model_path = "model"
        print(f"{Fore.GREEN}Found local model{Style.RESET_ALL}")
    
    # Create and run the speech recognizer
    recognizer = VoskSpeechRecognizer(model_path)
    
    # Display simple usage instructions
    print(f"{Fore.GREEN}=" * 60)
    print(f"{Fore.GREEN}Speech Recognition Active{Style.RESET_ALL}")
    print(f"{Fore.CYAN}Speak clearly and I'll transcribe what you say.{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}Say \"stop\" or \"terminate\" to end the program{Style.RESET_ALL}")
    print(f"{Fore.GREEN}=" * 60)
    
    # Run the recognizer
    recognizer.run()

if __name__ == "__main__":
    main()