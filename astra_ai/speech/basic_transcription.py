"""basic_transcription.py

Simple Python client for Fish.Audio text-to-speech endpoint.

Replace `API_KEY` with your Fish.Audio API key.
"""
from typing import Optional, Dict, Any
import json

try:
    import requests
except Exception:  # pragma: no cover - runtime dependency
    requests = None

API_KEY = "4953751730bd4aec90411a1951cabce2"
VOICE_ID = "6bf9194b81814fb59dc8006ef9ad39b3"  # Jarvis voice (example)
TTS_ENDPOINT = "https://api.fish.audio/v1/text-to-speech"


def generate_speech(text: str, *, api_key: str = API_KEY, voice_id: str = VOICE_ID,
                    fmt: str = "mp3", voice_settings: Optional[Dict[str, Any]] = None) -> Optional[str]:
    """Generate speech using Fish.Audio and return the audio URL.

    Returns the `audioUrl` on success, or None on failure.
    """
    if requests is None:
        raise RuntimeError("requests package is required: pip install requests")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "modelId": voice_id,
        "input": text,
        "format": fmt,
    }

    if voice_settings:
        payload["voiceSettings"] = voice_settings

    resp = requests.post(TTS_ENDPOINT, headers=headers, data=json.dumps(payload), timeout=30)

    try:
        resp.raise_for_status()
    except Exception as e:
        # Bubble up a readable error
        # Include status code and response body for callers to inspect
        status = getattr(resp, 'status_code', None)
        body = resp.text if resp is not None else ''
        raise RuntimeError(f"TTS request failed: {e} - status={status} - body={body}")

    data = resp.json()
    return data.get("audioUrl")


if __name__ == "__main__":
    # Quick manual test
    test_text = "Hello! This is your Jarvis voice testing from the Python client."
    try:
        url = generate_speech(test_text)
        if url:
            print("Audio URL:", url)
        else:
            print("No audio URL returned from Fish.Audio")
    except Exception as err:
        # Provide helpful guidance for 402/invalid key errors and fallback
        msg = str(err)
        print("Error generating speech:", msg)

        # Detect payment/invalid key errors and attempt offline fallback
        if '402' in msg or 'Payment Required' in msg or 'Invalid api key' in msg:
            print("Detected API key / balance issue (402). Attempting offline fallback...")
            # Try pyttsx3 first
            try:
                import pyttsx3
                engine = pyttsx3.init()
                engine.say(test_text)
                engine.runAndWait()
                print("✅ Fallback via pyttsx3 succeeded")
            except Exception as e_py:
                print(f"pyttsx3 fallback failed: {e_py}")
                # Try a simple demo tone via sounddevice
                try:
                    import numpy as np
                    import sounddevice as sd
                    sample_rate = 44100
                    duration = 2.0
                    frequency = 440.0
                    t = np.linspace(0, duration, int(sample_rate * duration), False)
                    audio = (np.sin(2 * np.pi * frequency * t) * 0.2).astype(np.float32)
                    sd.play(audio, samplerate=sample_rate)
                    sd.wait()
                    print("✅ Demo tone played via sounddevice")
                except Exception as e_sd:
                    print(f"Demo tone fallback failed: {e_sd}")
                    print("Please set a valid Fish.Audio API key in basic_transcription.py or install pyttsx3/sounddevice for local fallback.")
        else:
            print("Unexpected error - please inspect the message above")
