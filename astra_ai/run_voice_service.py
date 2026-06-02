#!/usr/bin/env python3
"""
AI VOICE SERVICE - Ready to Run
Start the service with: python.exe run_voice_service.py
"""
import sys
import os
import time
import importlib.util

# Add workspace to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=" * 80)
print("🎤 AI VOICE SERVICE STARTUP")
print("=" * 80)

# Import the TTS system
try:
    spec = importlib.util.spec_from_file_location("ai_voice",
        os.path.join(os.path.dirname(__file__), "astra_ai/speech/ai_voice.py"))
    ai_voice_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(ai_voice_module)
    TTSService = ai_voice_module.TTSService
    FishConfig = ai_voice_module.FishConfig
    print("✅ AI Voice module loaded\n")
except Exception as e:
    print(f"❌ Failed to load AI Voice module: {e}")
    sys.exit(1)

# Create configuration
tts = TextToSpeech(config, ai_responses_file=ai_responses_file)

# Create Fish.Audio config (reads API key from FISH_API_KEY env var if set)
fish_key = os.environ.get('FISH_API_KEY')
fish_voice = os.environ.get('FISH_VOICE_ID')
config = FishConfig(api_key=fish_key, voice_id=fish_voice, sample_rate=44100, volume_multiplier=1.0)

# Create TTS service
ai_responses_file = os.path.join(os.path.dirname(__file__), 'speech_input.json')
tts = TTSService(config, ai_file=ai_responses_file)

print(f"📁 Monitoring file: {ai_responses_file}")
print(f"🎯 Voice ID: {config.voice_id}")
print(f"🔊 Sample rate: {config.sample_rate} Hz")
print()

# Run the service
try:
    print("🚀 Starting text-to-speech service...\n")
    tts.text_to_speech_loop()
except KeyboardInterrupt:
    print("\n\n🛑 Service stopped by user")
except Exception as e:
    print(f"\n❌ Service error: {e}")
    sys.exit(1)
