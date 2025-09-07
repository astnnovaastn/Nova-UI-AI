#!/usr/bin/env python3
"""
Simple Vosk Speech Recognition Script

This script provides a basic implementation of speech recognition using
the Vosk toolkit. It listens to the microphone, transcribes speech,
and saves the transcription to a text file.

Requirements:
    - vosk
    - pyaudio

Usage:
    python simple_vosk.py
"""

import vosk
import pyaudio
import json
import os
import sys

# Set the model path - if the model doesn't exist, it will download it
model_path = "vosk-model-en-us-0.42-gigaspeech"

# Check if model exists, otherwise use language code to download
if os.path.exists(model_path):
    print(f"Using local model: {model_path}")
    model = vosk.Model(model_path)
else:
    print("Local model not found. Downloading English model...")
    model = vosk.Model(lang="en-us")
    print("Model downloaded successfully")

# Create a recognizer with 16kHz sample rate
rec = vosk.KaldiRecognizer(model, 16000)

# Open the microphone stream
p = pyaudio.PyAudio()
stream = p.open(format=pyaudio.paInt16,
                channels=1,
                rate=16000,
                input=True,
                frames_per_buffer=8192)

# Specify the path for the output text file
output_file_path = "recognized_text.txt"

# Open a text file in write mode using a 'with' block
with open(output_file_path, "w") as output_file:
    print("Listening for speech. Say 'Terminate' to stop.")
    
    # Start streaming and recognize speech
    while True:
        # Read audio in chunks of 4096 bytes
        data = stream.read(4096, exception_on_overflow=False)
        
        # Process the audio data
        if rec.AcceptWaveform(data):
            # Parse the JSON result and get the recognized text
            result = json.loads(rec.Result())
            recognized_text = result['text']
            
            # Skip empty results
            if not recognized_text.strip():
                continue
            
            # Write recognized text to the file
            output_file.write(recognized_text + "\n")
            output_file.flush()  # Ensure text is written immediately
            
            # Print the recognized text
            print(recognized_text)
            
            # Check for the termination keyword
            if "terminate" in recognized_text.lower():
                print("Termination keyword detected. Stopping...")
                break
        else:
            # Show partial results
            partial = json.loads(rec.PartialResult())
            if 'partial' in partial and partial['partial'].strip():
                print(f"Partial: {partial['partial']}", end="\r")

# Stop and close the stream
stream.stop_stream()
stream.close()

# Terminate the PyAudio object
p.terminate()

print(f"Transcription saved to: {output_file_path}")
print("Speech recognition completed.")