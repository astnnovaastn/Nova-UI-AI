PyAudio vs SoundDevice — Installation Guide
=========================================

If `pip install pyaudio` fails on Windows with a build error ("Microsoft Visual C++ 14.0 or greater is required"), use one of the following options.

Recommended options:

- Option A — Use `sounddevice` (fast and cross-platform):

  ```powershell
  pip install sounddevice
  ```

- Option B — Install a PyAudio wheel via `pipwin` (Windows):

  ```powershell
  pip install pipwin
  pipwin install pyaudio
  ```

- Option C — Install Microsoft C++ Build Tools and then install PyAudio:

  1. Install Build Tools: https://visualstudio.microsoft.com/visual-cpp-build-tools/
  2. Then:

  ```powershell
  pip install pyaudio
  ```

- Option D — Use Conda (if you have Anaconda/Miniconda):

  ```powershell
  conda install -c anaconda pyaudio
  ```

For most users on Windows, `sounddevice` is the simplest and avoids native build tools.

If you want to force which backend the `Ai vioce.py` script uses, set the `AUDIO_BACKEND` environment variable to `pyaudio` or `sounddevice` before running the script.

Example (PowerShell):

```powershell
$env:AUDIO_BACKEND = 'sounddevice'
python astra_ai\speech\"Ai vioce.py"
```

If you need help diagnosing installation errors, capture the full pip output and share it.
