import speech_recognition as sr
import os
import json
import groq
import time
from datetime import datetime

# Initialize speech recognition
recognizer = sr.Recognizer()
microphone = sr.Microphone()

# Initialize Groq client for Whisper
api_key = ""
client = groq.Client(api_key=api_key)

# File to save transcriptions
transcription_file = "transcription.json"

# Create empty transcription file if it doesn't exist
if not os.path.exists(transcription_file):
    with open(transcription_file, "w", encoding="utf-8") as f:
        json.dump([], f)

def print_colored(text, color="white"):
    """Print colored text to the console."""
    colors = {
        "red": "\033[91m",
        "green": "\033[92m",
        "yellow": "\033[93m",
        "blue": "\033[94m",
        "cyan": "\033[96m",
        "white": "\033[97m",
        "reset": "\033[0m"
    }
    print(f"{colors.get(color, colors['white'])}{text}{colors['reset']}")

def transcribe_with_whisper(audio_file):
    """Transcribe audio using Whisper via Groq."""
    try:
        # Read the audio file
        with open(audio_file, "rb") as f:
            audio_data = f.read()
        
        # Call Groq API
        response = client.audio.transcriptions.create(
            model="whisper-large-v3",
            file=("audio.wav", audio_data),
            language="en",
            temperature=0.0
        )
        
        # Get the transcribed text
        if hasattr(response, 'text'):
            return response.text.strip()
        else:
            return str(response).strip()
    
    except Exception as e:
        print_colored(f"Transcription error: {str(e)}", "red")
        return ""

def save_to_json(text):
    """Save transcription to JSON file."""
    try:
        # Create entry
        entry = {
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "text": text,
            "transcription_mode": "whisper-large-v3"
        }
        
        # Load existing data
        try:
            with open(transcription_file, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            data = []
        
        # Add new entry
        data.append(entry)
        
        # Save back to file
        with open(transcription_file, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print_colored(f"Saved to {transcription_file}", "blue")
    
    except Exception as e:
        print_colored(f"Error saving to JSON: {str(e)}", "red")

# Print welcome message
print_colored("=" * 50, "cyan")
print_colored("BASIC SPEECH TRANSCRIPTION", "cyan")
print_colored("=" * 50, "cyan")
print_colored("This program will transcribe your speech and save it to transcription.json", "white")
print_colored("Press Ctrl+C to stop", "white")
print_colored("=" * 50, "cyan")

# Adjust for ambient noise
with microphone as source:
    print_colored("Adjusting for ambient noise... Please wait.", "yellow")
    recognizer.adjust_for_ambient_noise(source, duration=1.0)
    print_colored("Ready! Speak into your microphone.", "green")

    # Main loop
    try:
        while True:
            print_colored("Listening...", "cyan")
            
            # Listen for audio
            try:
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
                
                print_colored("Processing speech...", "yellow")
                
                # Save audio to a temporary file
                temp_file = f"temp_audio_{int(time.time())}.wav"
                with open(temp_file, "wb") as f:
                    f.write(audio.get_wav_data())
                
                # Transcribe with Whisper
                text = transcribe_with_whisper(temp_file)
                
                # Clean up temp file
                if os.path.exists(temp_file):
                    os.remove(temp_file)
                
                if text:
                    # Display the transcribed text
                    print_colored(f"You said: {text}", "green")
                    
                    # Save to transcription.json
                    save_to_json(text)
                else:
                    print_colored("No speech detected or couldn't transcribe.", "yellow")
                    
            except sr.WaitTimeoutError:
                print_colored("No speech detected. Listening again...", "yellow")
            except sr.UnknownValueError:
                print_colored("Could not understand audio. Please try again.", "yellow")
            except Exception as e:
                print_colored(f"Error: {str(e)}", "red")
                
    except KeyboardInterrupt:
        print_colored("\nStopping transcription service...", "yellow")
        print_colored("Transcription service stopped.", "yellow")