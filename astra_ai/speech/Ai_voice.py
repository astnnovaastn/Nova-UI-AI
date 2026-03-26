import os
import time
import json
import io
import wave
import threading
import queue
import re
from dataclasses import dataclass
from typing import Optional, Dict, Any, List, Set

import numpy as np
import sounddevice as sd

try:
    import requests
except Exception:
    requests = None

try:
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
    WATCHDOG_AVAILABLE = True
except Exception:
    WATCHDOG_AVAILABLE = False


@dataclass
class FishConfig:
    api_key: Optional[str] = None
    voice_id: Optional[str] = None
    sample_rate: int = 44100
    volume_multiplier: float = 1.0


class FileChangeHandler(FileSystemEventHandler):
    def __init__(self, service):
        self.service = service
        self._last = 0

    def on_modified(self, event):
        if event.is_directory:
            return
        if event.src_path.endswith(self.service.ai_file):
            now = time.time()
            if now - self._last < 0.2:
                return
            self._last = now
            self.service.check_for_new_messages()


class TTSService:
    def __init__(self, fish_config: FishConfig, ai_file: str = 'speech_input.json'):
        self.config = fish_config
        self.ai_file = os.path.abspath(ai_file)
        self.processed_file = 'processed_messages.json'
        self.processed: Set[str] = self._load_processed()
        self.audio_q: queue.Queue = queue.Queue()
        self.is_speaking = False
        self.stop_event = threading.Event()
        self.observer = None

    def _load_processed(self) -> Set[str]:
        try:
            with open(self.processed_file, 'r', encoding='utf-8') as f:
                return set(json.load(f))
        except Exception:
            return set()

    def _save_processed(self):
        try:
            with open(self.processed_file, 'w', encoding='utf-8') as f:
                json.dump(list(self.processed), f)
        except Exception as e:
            print('Error saving processed messages:', e)

    def read_output_json(self) -> (Optional[str], Optional[str]):
        if not os.path.exists(self.ai_file):
            return None, None
        try:
            with open(self.ai_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            if isinstance(data, list) and data:
                last = data[-1]
                if isinstance(last, dict):
                    msg_id = last.get('id', f"msg_{len(data)}")
                    text = last.get('text') or last.get('message') or last.get('response') or ''
                elif isinstance(last, str):
                    msg_id = f"msg_{len(data)}"
                    text = last
                else:
                    return None, None

                text = self._clean_text(text)
                if not text or len(text.strip()) < 3:
                    return None, None
                return text, msg_id
        except json.JSONDecodeError:
            return None, None
        except Exception as e:
            print('Error reading JSON:', e)
            return None, None

    def _clean_text(self, text: str) -> str:
        if not text:
            return ''
        text = re.sub(r'https?://\S+', 'link', text)
        text = re.sub(r'```[\s\S]*?```', '', text)
        text = re.sub(r'<[^>]*>', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def check_for_new_messages(self):
        text, msg_id = self.read_output_json()
        if not msg_id:
            return
        if msg_id in self.processed:
            return
        # process
        self.processed.add(msg_id)
        self._save_processed()
        print(f"Processing message {msg_id}")
        t = threading.Thread(target=self._handle_message, args=(text, msg_id), daemon=True)
        t.start()

    def _handle_message(self, text: str, msg_id: str):
        self.is_speaking = True
        chunks = self._chunk_text(text)
        for chunk in chunks:
            self._generate_and_queue(chunk)
        self.is_speaking = False

    def _chunk_text(self, text: str, max_len: int = 400) -> List[str]:
        parts = re.split(r'(?<=[.!?])\s+', text)
        chunks = []
        cur = ''
        for p in parts:
            if len(cur) + len(p) + 1 <= max_len:
                cur = (cur + ' ' + p).strip() if cur else p
            else:
                if cur:
                    chunks.append(cur)
                cur = p
        if cur:
            chunks.append(cur)
        return chunks

    def _generate_and_queue(self, text: str):
        # Try Fish.Audio first
        if self.config.api_key and requests:
            audio = self._fish_tts_wav_to_array(text)
            if audio is not None:
                self.audio_q.put(audio.astype(np.float32).tobytes())
                print('Queued Fish.Audio audio')
                return

        # Fallback: demo tone
        self._queue_demo_tone(text)

    def _fish_tts_wav_to_array(self, text: str) -> Optional[np.ndarray]:
        try:
            headers = {"Authorization": f"Bearer {self.config.api_key}", "Content-Type": "application/json"}
            payload = {"modelId": self.config.voice_id or '', "input": text, "format": "wav"}
            resp = requests.post('https://api.fish.audio/v1/text-to-speech', headers=headers, json=payload, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            url = data.get('audioUrl') or data.get('url')
            if not url:
                return None
            r = requests.get(url, timeout=30)
            r.raise_for_status()
            buf = io.BytesIO(r.content)
            with wave.open(buf, 'rb') as wf:
                n_channels = wf.getnchannels()
                sampwidth = wf.getsampwidth()
                framerate = wf.getframerate()
                frames = wf.readframes(wf.getnframes())

            if sampwidth == 2:
                arr = np.frombuffer(frames, dtype=np.int16).astype(np.float32) / 32768.0
            elif sampwidth == 4:
                arr = np.frombuffer(frames, dtype=np.int32).astype(np.float32) / 2147483648.0
            elif sampwidth == 1:
                arr = (np.frombuffer(frames, dtype=np.uint8).astype(np.float32) - 128.0) / 128.0
            else:
                return None

            if n_channels > 1:
                arr = arr.reshape(-1, n_channels).mean(axis=1)

            # Resample if needed
            if framerate != self.config.sample_rate:
                import math
                ratio = self.config.sample_rate / float(framerate)
                new_len = int(math.ceil(len(arr) * ratio))
                idx = (np.arange(new_len) / ratio).astype(np.int32)
                idx[idx >= len(arr)] = len(arr) - 1
                arr = arr[idx]

            return arr
        except Exception as e:
            print('Fish.Audio TTS error:', e)
            return None

    def _queue_demo_tone(self, text: str):
        # Produce a short tone as a proof-of-playback and a spoken label via system TTS if available
        try:
            # tone
            sr = self.config.sample_rate
            dur = 1.2
            t = np.linspace(0, dur, int(sr * dur), False)
            tone = (np.sin(2 * np.pi * 440 * t) * 0.25).astype(np.float32)
            self.audio_q.put(tone.tobytes())
        except Exception as e:
            print('Demo tone error:', e)

    def audio_playback_thread(self):
        while not self.stop_event.is_set():
            try:
                buf = self.audio_q.get(timeout=0.5)
            except queue.Empty:
                continue
            try:
                audio = np.frombuffer(buf, dtype=np.float32)
                sd.play(audio, samplerate=self.config.sample_rate)
                sd.wait()
            except Exception as e:
                print('Playback error:', e)
            finally:
                try:
                    self.audio_q.task_done()
                except Exception:
                    pass

    def start_service(self):
        # Start playback thread
        t = threading.Thread(target=self.audio_playback_thread, daemon=True)
        t.start()

        # Start file monitoring
        if WATCHDOG_AVAILABLE:
            handler = FileChangeHandler(self)
            self.observer = Observer()
            self.observer.schedule(handler, os.path.dirname(self.ai_file) or '.', recursive=False)
            self.observer.start()
            print('Using watchdog file monitoring')
        else:
            print('Watchdog not available; using polling')

        try:
            while True:
                self.check_for_new_messages()
                time.sleep(0.5)
        except KeyboardInterrupt:
            self.stop()

    def stop(self):
        self.stop_event.set()
        if self.observer:
            try:
                self.observer.stop()
                self.observer.join(timeout=2)
            except Exception:
                pass


if __name__ == '__main__':
    cfg = FishConfig(api_key=None, voice_id=None)
    svc = TTSService(cfg, ai_file='speech_input.json')
    svc.start_service()
#!/usr/bin/env python3
"""
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
