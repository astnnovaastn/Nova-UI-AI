# Frontend UI and AI Voice Interaction Architecture

This document describes how the  frontend interface interacts with the AI backend throughout its entire vocal conversation lifecycle—handling speech recognition (listening), processing (thinking), and speech synthesis (talking).

## Architecture Overview

The system operates using a four-phase **State Machine**:
1. **Idle / Listening** 
2. **Thinking** 
3. **Speaking**
4. **Task / Working** (Variation of Thinking)

Communication between the Frontend UI and the AI backend happens in real-time over **WebSockets** (specifically on port `8340`), sending user transcripts and receiving synthesized audio payloads. The visual state is reflected via an interactive Orb (`orb.ts`), with animations synchronized to the AI's audio output.

---

## 1. When the AI Starts Listening (User is talking)

The frontend uses the browser's native **Web Speech API** (`SpeechRecognition` or `webkitSpeechRecognition`) to capture the user's microphone input.

- **Initialization:** When the UI loads and is not muted, it waits 1 second for the visual orb to render, then enters the `listening` state.
- **Continuous Recognition:** The app actively listens for microphone input, waiting for the user to speak. 
- **Trigger:** Web Speech recognition triggers a `final` result (`event.results[i].isFinal === true`).
- **Action:** The text transcript string is captured and packaged into a JSON payload: `{ "type": "transcript", "text": "...", "isFinal": true }`.
- **Cancellation:** If the user starts talking while the AI is in the middle of a previous speech track, the frontend instantly stops the AI's current audio playback (`audioPlayer.stop()`) and sends the new transcript.

## 2. When the Voice Connects to the AI (Processing / Thinking)

Once a transcript is successfully sent to the backend, the system pauses the microphone and transitions modes.

- **State Transition:** The UI transitions from `listening` to `thinking`.
- **Microphone paused:** The Voice input system is deliberately paused (`recognition.stop()` with a paused flag). This prevents the AI from accidentally capturing background noise or a delayed user utterance.
- **Waiting:** The frontend waits for the AI (on the server side) to generate a response text and transform it into audio via Text-to-Speech (TTS).

## 3. When the AI is Talking

When the AI finishes processing, the backend streams the audio response to the frontend over WebSocket.

- **Payload Received:** The frontend receives a WebSocket message containing `{ "type": "audio", "data": "<Base64 Encoded Audio>" }`.
- **State Transition:** The UI transitions from `thinking` to `speaking`. 
- **Enqueuing Audio:** The base64 audio data is decoded using the browser's native **AudioContext** API into an `AudioBuffer`. 
- **Playback & Visualization:** 
  - The `AudioPlayer` plays the decoded sequence.
  - While audio plays, an `AnalyserNode` provides real-time frequency data to the visual Orb. The Orb physically pulses and animates based on the volume and frequency of the AI's synthesized voice.
- **Listening restriction:** During the `speaking` phase, the microphone remains paused so the AI doesn't hear an echo of its own voice and try to respond to it.

## 4. When the Interaction Stops (Completion)

Once all scheduled audio buffers finish playing, the frontend automatically wraps up the loop and prepares for the next command.

- **End of Queue:** The `AudioPlayer` fires an `onFinished` callback.
- **State Transition:** The UI officially switches from `speaking` back to `idle`.
- **Microphone Restart:** Unless the user manually pressed "Mute", the Speech Recognition engine is immediately told to `.resume()`. The interaction loop starts over from step 1.

---

### Sequence Diagram Summary

```mermaid
sequenceDiagram
    participant User
    participant Frontend UI (Web Speech & AudioContext)
    participant AI Backend (WebSocket)

    Note over Frontend UI: State: Idle/Listening
    User->>Frontend UI: Speaks into microphone
    Frontend UI->>Frontend UI: Captures transcript
    Note over Frontend UI: State: Thinking
    Frontend UI->>Frontend UI: Pauses Microphone
    Frontend UI->>AI Backend: WebSocket: { type: "transcript", text: "..." }
    AI Backend->>AI Backend: LLM generates text & TTS audio
    AI Backend-->>Frontend UI: WebSocket: { type: "audio", data: "base64..." }
    Note over Frontend UI: State: Speaking
    Frontend UI->>Frontend UI: Decodes base64 and plays audio
    Frontend UI->>User: Audio playback (AI speaks)
    Note over Frontend UI: Audio playback finishes
    Note over Frontend UI: State: Idle/Listening
    Frontend UI->>Frontend UI: Resumes Microphone
```

## Current Live flow (desktop, 2026-10-16)

Dashboard, Memory, and Research share one Gemini Live conversation. Typing can start
Live without requesting microphone access. Microphone mute stops user capture only;
assistant playback and its analyser remain active. The waveform consumes the existing
capture analyser and does not open another microphone stream.

Notifications use one queued, scoped presentation layer: three seconds visible,
hover/focus pause, and an exit transition. Initial snapshots populate the inbox
quietly. Dismissal does not decide approvals or cancel work. Voice cues have separate
preferences and volume; their known waveform is included in the echo reference.

Application discovery returns bounded control pages and a UI revision. Invocation
checks that revision, availability, permissions, and observable results. Unconfirmed
writes become uncertain work, not completed work. Destructive changes require an
actual owner confirmation bound to the operation and current state. Reviews use a nonblocking modal so Live capture/playback continue; generic model
clicks cannot approve proposals.

Research reuses the durable action queue, immutable artifact store, SerpAPI/Tavily,
and shared background model budget. The reader preserves original evidence; rich
drafts use revision-checked autosave and a local recovery copy. Source preview fetches
pin public DNS addresses and validate each redirect. Reports export to Markdown,
HTML, PDF, and DOCX. Detailed research no longer opens the legacy Search widget or
copies itself into Notes by default.

### Validation and measured limits

- Backend: 596 passed, 1 skipped; five existing framework deprecation warnings.
- Frontend: 120 passed. Globe: 46 passed. TypeScript and production build passed.
- Browser: public research returned eight sources; shared background quota paused
  synthesis, producing an explicitly partial evidence collection. Source reading,
  draft autosave/recovery, and a real DOCX download were verified.
- Live Gemini, typed while muted: acknowledged a requested globe zoom of 2.5; the
  actual canvas reported 2.500. Library opening preserved zoom, orientation and bounds.
- Populated desktop, 1280 x 720 viewport: observed 60 FPS; overview drawing sample
  6.80 ms, close zoom samples 0.50–0.90 ms. These are snapshots on this computer,
  not older-hardware or extended-residence guarantees.
- YouTube player and controls loaded. Physical-microphone timing, audible cue quality,
  sustained video playback/audio ducking, long-duration CPU/RAM, and a full PDF
  browser fixture remain outstanding. File-format and source-failure fixtures pass.
- Existing build warnings remain for Calculator eval and large bundles. Research is
  split from the main entry; the editor/PDF bundle is loaded separately.

Private stores, credentials, recordings, downloads, backups, and validation artifacts
are excluded from delivery.


## Research redesign validation — 2026-10-16

Research now uses the reclaimed document height, a centered floating research composer, persistent history/chat columns, compact source pills, and a source reader inside the document pane. The report, source IDs, and draft revisions remain independent of supplemental media metadata. Settings contains notification history and separate sound controls; the microphone-adjacent notification launcher is removed.

Validation: full backend run 604 passed / 1 skipped before the final media-title/count adjustment; the subsequent research/workflow/core suite passed 55 tests, including report-linked video deduplication. All 128 frontend tests, all 46 globe tests, TypeScript, and production build passed. Existing Calculator eval and large-bundle warnings remain.

Populated desktop checks used the existing public honeybee report. At 1280×720 the document starts at y=76, and the research composer remains centered in its column. A real NC State article opened in the central pane with structured paragraphs and 28 internal links; returning restored the reading position and source focus. The isolated Gemini Live request changed the rendered view to Sources; its spoken/transcript completion was not confirmed. Media enrichment produced five distinct embedded videos, with no Nova duplicate playback toolbar or ordinary external video links. Native player controls rendered and were exercised, but audible quality, real microphone interruption, and physical-device volume ducking remain manual checks. No claims are made about sub-millisecond recognition or unmeasured hardware performance.

Reader source fetches retain public-address and redirect checks, pinned validated DNS, content limits, and scoped minted follow-on IDs. A media request is recorded before network access; reconnect/restart cannot automatically spend the same report's video-search credit again. Authoritative JSON is backed up before additive media writes.
