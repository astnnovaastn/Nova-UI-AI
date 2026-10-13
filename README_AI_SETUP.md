# Nova AI local startup

1. Add a valid, private `GEMINI_API_KEY` to the project root `.env` file. The backend loads this file at startup. Do not paste keys into chat or commit `.env`.
2. Double-click `start_nova_ai.bat` (or run `powershell -NoProfile -ExecutionPolicy Bypass -File .\start_nova_ai.ps1`). It starts the FastAPI/WebSocket backend and Vite frontend on localhost, then opens the UI.
3. In the browser, click the microphone button and allow microphone access. The UI starts muted. Location is not requested during voice-chat startup.
4. To stop only this project's local servers, run `powershell -NoProfile -ExecutionPolicy Bypass -File .\stop_nova_ai.ps1`.

The first launch creates a Python 3.12 environment and installs the declared backend and frontend packages when needed. Backend dependency pins must remain compatible with the selected `google-genai` SDK.

Memory is stored locally under `astra_ai\memory` and `astra_ai\Date`. On first backend startup, legacy transcript migration may create a backup and update the live memory file.
