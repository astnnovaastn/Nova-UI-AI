#!/usr/bin/env python3
r"""
Direct Text-to-Speech System
Simple: Read JSON -> Use Cartesia API -> Play Audio
to run this sript: PS D:\Astra_ai> python "d:/Astra_ai/astra_ai/speech/direct_voice.py"
"""

import os
import json
import time
import base64
import numpy as np
import sounddevice as sd
from cartesia import Cartesia

def text_to_speech(text, api_key, voice_id):
    """Convert text to speech using Cartesia API"""
    try:
        # Initialize Cartesia client
        client = Cartesia(api_key=api_key)
        
        print(f"🎤 Converting to speech: {text}")
        
        # Generate speech
        response = client.tts.generate_sse(
            model_id="sonic-english",
            transcript=text,
            voice={"mode": "id", "id": voice_id},
            output_format={
                "container": "raw",
                "encoding": "pcm_f32le", 
                "sample_rate": 48000
            }
        )
        
        # Collect audio data from streaming response
        audio_data = b""
        for chunk in response:
            if hasattr(chunk, 'data'):
                chunk_data = chunk.data
            elif isinstance(chunk, dict) and "data" in chunk:
                chunk_data = chunk["data"]
            else:
                continue
                
            # Convert to bytes if needed
            if isinstance(chunk_data, str):
                chunk_data = base64.b64decode(chunk_data)
            elif isinstance(chunk_data, bytes):
                pass  # Already bytes
            else:
                continue
                
            audio_data += chunk_data
            
        print(f"✅ Generated {len(audio_data)} bytes of audio")
        return audio_data
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def play_audio(audio_data, sample_rate=48000):
    """Play audio data"""
    try:
        # Convert to numpy array
        audio_array = np.frombuffer(audio_data, dtype=np.float32)
        print(f"🔊 Playing audio...")
        
        # Play the sound
        sd.play(audio_array, samplerate=sample_rate)
        sd.wait()  # Wait for it to finish
        print("✅ Playback complete")
        
    except Exception as e:
        print(f"❌ Playback error: {e}")

def read_json_file(filename):
    """Read text from JSON file"""
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        # Get the last message
        if isinstance(data, list) and data:
            last_message = data[-1]
            return last_message.get("text", "")
        return ""
        
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return ""

def main():
    """Main function"""
    # Configuration
    API_KEY = 'sk_car_VqWy79RSCgcBda6TtbJW1A'
    VOICE_ID = "5ee9feff-1265-424a-9d7f-8e4d431a12c7"
    JSON_FILE = "speech_input.json"
    
    print("🚀 Direct Voice System Started")
    print(f"📁 Reading from: {JSON_FILE}")
    print(f"🎤 Using Voice ID: {VOICE_ID}")
    
    while True:
        try:
            # Read text from JSON
            text = read_json_file(JSON_FILE)
            
            if text and len(text.strip()) > 0:
                print(f"\n📝 Text found: {text[:100]}...")
                
                # Convert to speech
                audio_data = text_to_speech(text, API_KEY, VOICE_ID)
                
                if audio_data:
                    # Play the audio
                    play_audio(audio_data)
                    
                    # Clear the JSON file after processing
                    try:
                        with open(JSON_FILE, 'w', encoding='utf-8') as f:
                            json.dump([], f)
                        print("🗑️ Cleared JSON file")
                    except:
                        pass
                
            # Wait before next check
            time.sleep(2)
            
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            time.sleep(2)
        

if __name__ == "__main__":
    main()
