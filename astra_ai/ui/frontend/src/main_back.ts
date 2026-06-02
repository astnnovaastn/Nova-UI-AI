/**
 * JARVIS — Main entry point.
 *
 * Wires together the orb visualization, WebSocket communication,
 * speech recognition, and audio playback into a single experience.
 */

import { createOrb, type OrbState, type OrbMood } from "./orb";
import { orbThemes, type OrbTheme } from "./orb-themes";
import { createGroqVoiceInput, createAudioPlayer } from "./voice";
import { createSocket } from "./ws";
import { openSettings, checkFirstTimeSetup, registerOrbThemeChangedHandler } from "./settings";
import { initWidgets } from "./widgets";
import "./style.css";
import { SoundWaveController } from "./sound-wave";

// ---------------------------------------------------------------------------
// DOM refs ──────────────────────────────────────────────────────────────────
// ---------------------------------------------------------------------------

const statusEl = document.getElementById("status-text")!;
const errorEl = document.getElementById("error-text")!;
const badgeEl = document.getElementById("connection-badge") as HTMLDivElement | null;
const badgeLabelEl = badgeEl?.querySelector("#connection-label") as HTMLSpanElement | null;

// ---------------------------------------------------------------------------
// State machine & Audio Control
// ---------------------------------------------------------------------------

type State = "idle" | "listening" | "thinking" | "speaking";
let currentState: State = "idle";
// Persist microphone mute state in localStorage
let isMuted = false;
const MIC_MUTE_KEY = "novaai_mic_muted";

// Restore mute state from localStorage on load
const storedMute = localStorage.getItem(MIC_MUTE_KEY);
if (storedMute === "true") {
  isMuted = true;
}
let isAudioPlaying = false;  // Track if audio is currently being played
let errorTimer: ReturnType<typeof setTimeout> | null = null;

function showError(msg: string) {
  errorEl.textContent = msg;
  errorEl.style.opacity = "1";
  if (errorTimer) clearTimeout(errorTimer);
  errorTimer = setTimeout(() => {
    errorEl.style.opacity = "0";
  }, 4000);
}

function setConnected(ok: boolean): void {
  if (!badgeEl) return;
  badgeEl.classList.toggle("connected", ok);
  badgeEl.classList.toggle("disconnected", !ok);
  if (badgeLabelEl) {
    badgeLabelEl.textContent = ok ? "connected" : "reconnecting";
  }
}

function updateStatus(state: State) {
  const labels: Record<State, string> = {
    idle: "",
    listening: "",
    thinking: "",
    speaking: "",
  };
  statusEl.textContent = labels[state];
}

// ---------------------------------------------------------------------------
// Init components
// ---------------------------------------------------------------------------

const canvas = document.getElementById("orb-canvas") as HTMLCanvasElement;
const orb = createOrb(canvas);
const soundWave = new SoundWaveController("sound-wave");
soundWave.setMuted(isMuted);

const soundWaveEl = document.getElementById("sound-wave") as HTMLDivElement | null;
const transcriptionDots = document.createElement("div");
transcriptionDots.id = "transcription-dots";
transcriptionDots.className = "transcription-dots";
transcriptionDots.setAttribute("aria-hidden", "true");
for (let i = 0; i < 6; i++) {
  const dot = document.createElement("span");
  transcriptionDots.appendChild(dot);
}
document.body.appendChild(transcriptionDots);

function setTranscriptionVisual(active: boolean): void {
  transcriptionDots.classList.toggle("active", active);
  soundWaveEl?.classList.toggle("visual-hidden", active);
  if (active) {
    statusEl.textContent = "";
  }
}

const ORB_THEME_KEY = "novaai_orb_theme";
const DEFAULT_ORB_THEME = "default";
let selectedOrbTheme = (localStorage.getItem(ORB_THEME_KEY) || DEFAULT_ORB_THEME).toString();

// Orb mood state: "neutral" | "good" | "warning" | "error"
let orbMood: OrbMood = "neutral";
orb.setMood(orbMood);

function applyOrbTheme(themeName: string) {
  const theme = orbThemes.find((t) => t.name === themeName) || orbThemes.find((t) => t.name === DEFAULT_ORB_THEME);
  if (!theme) return;
  selectedOrbTheme = theme.name;
  localStorage.setItem(ORB_THEME_KEY, selectedOrbTheme);
  orb.setThemeColor(theme.orbColor);
  document.documentElement.style.setProperty('--theme-color', theme.orbColor);
  console.log(`[ORB-THEME] Applied theme: ${theme.label} (${theme.orbColor})`);
}

// Example: Conversation mood logic
function setOrbMood(mood: OrbMood) {
  orbMood = mood;
  orb.setMood(mood);
}

// Connect to backend on port 8340, not to the Vite dev server
const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:";
const WS_URL = `${wsProto}//localhost:8340/ws/voice`;
const socket = createSocket(WS_URL);

const audioPlayer = createAudioPlayer();
orb.setAnalyser(audioPlayer.getAnalyser());
soundWave.setAIAnalyser(audioPlayer.getAnalyser());
applyOrbTheme(selectedOrbTheme);
registerOrbThemeChangedHandler((themeName) => {
  applyOrbTheme(themeName);
});

function transition(newState: State) {
  if (newState === currentState) return;
  
  console.log(`🔄 [STATE] Transitioning: ${currentState} → ${newState}`);
  setTranscriptionVisual(false);
  currentState = newState;
  orb.setState(newState as OrbState);
  updateStatus(newState);
  soundWave.setState(newState);

  switch (newState) {
    case "idle":
      console.log("🔊 [STATE] Idle - Resuming microphone for next input");
      if (!isMuted && !isAudioPlaying) {
        voiceInput.resume();
      }
      break;
    case "listening":
      console.log("🎤 [STATE] Listening - Microphone active and ready");
      if (!isMuted && !isAudioPlaying) {
        voiceInput.resume();
      }
      break;
    case "thinking":
      console.log("🔇 [STATE] Thinking - PAUSING microphone (processing user input)");
      voiceInput.pause();
      break;
    case "speaking":
      console.log("🔇 [STATE] Speaking - PAUSING microphone (AI audio playing)");
      voiceInput.pause();
      break;
  }
}

// ---------------------------------------------------------------------------
// Voice input
// ---------------------------------------------------------------------------

let voiceInput: ReturnType<typeof createGroqVoiceInput>;
function setupVoiceInput() {
  voiceInput = createGroqVoiceInput(
    (text: string) => {
      if (isMuted) {
        console.log("[MIC-MUTE] Ignoring transcript while muted");
        return;
      }

      const cleaned = text.trim();
      if (!cleaned) {
        return;
      }

      console.log("📤 [TRANSCRIPT] Sending user transcript to server:", cleaned);
      socket.send({
        type: "transcript",
        text: cleaned,
        isFinal: true,
      });
      setTranscriptionVisual(false);
      transition("thinking");
    },
    (msg: string) => {
      showError(msg);
    },
    () => {
      if (!isMuted && !isAudioPlaying) {
        setTranscriptionVisual(false);
        transition("listening");
      }
    },
    () => {
      if (!isMuted && !isAudioPlaying) {
        setTranscriptionVisual(true);
      }
    },
    () => {
      setTranscriptionVisual(false);
    }
  );
}

// ---------------------------------------------------------------------------
// Audio playback finished - Resume microphone
// ---------------------------------------------------------------------------

audioPlayer.onFinished(() => {
  console.log("🎵 [AUDIO-FINISHED] Playback complete");
  console.log("🔊 [AUDIO-FINISHED] Audio stream ended, marking playback flag as false");
  isAudioPlaying = false;
  
  // Add delay (800ms) to allow audio data to clear from microphone buffer
  // This prevents residual audio from being picked up
  console.log("⏱️ [AUDIO-FINISHED] Waiting 800ms for audio buffer to clear...");
  setTimeout(() => {
    console.log("⏱️ [AUDIO-FINISHED] Buffer clear delay complete");
    console.log("🎤 [AUDIO-FINISHED] Transitioning to idle - resuming listening");
    transition("idle");
  }, 800);
});

// ---------------------------------------------------------------------------
// WebSocket messages - Main handler
// ---------------------------------------------------------------------------

socket.onMessage((msg) => {
  const type = msg.type as string;

  // =========================================================================
  // MICROPHONE CONTROL - Explicit disable/enable from backend
  // =========================================================================
  if (type === "mic_control") {
    const action = msg.action as string;
    const reason = msg.reason as string;
    
    console.log(`🎙️ [MIC-CONTROL] Backend command: ${action.toUpperCase()}`);
    console.log(`   Reason: ${reason}`);
    
    if (action === "disable") {
      // Disable microphone - stop listening during audio playback
      console.log(`🔇 [MIC-CONTROL] Executing: pause microphone`);
      voiceInput.pause();
    } 
    else if (action === "enable") {
      // Re-enable microphone - start listening again
      if (!isAudioPlaying) {
        console.log(`🎤 [MIC-CONTROL] Executing: resume microphone`);
        voiceInput.resume();
      } else {
        console.log(`⏳ [MIC-CONTROL] Deferred: audio still playing, will resume on finish`);
      }
    }
  }

  // =========================================================================
  // TEXT RESPONSE - AI's text output (immediate)
  // =========================================================================
  else if (type === "response_text") {
    const text = msg.text as string;
    console.log(`📝 [RESPONSE-TEXT] Received AI response`);
    console.log(`   → "${text}"`);

    // Example: Mood logic based on AI response
    // If the AI response contains certain keywords, change orb color
    if (/thank|great|awesome|perfect|good|excellent|well done|nice/i.test(text)) {
      setOrbMood("good");
    } else if (/sorry|can't|not sure|don't understand|error|fail|problem|issue/i.test(text)) {
      setOrbMood("error");
    } else if (/maybe|hmm|not certain|try again|unclear|confused|difficult/i.test(text)) {
      setOrbMood("warning");
    } else {
      setOrbMood("neutral");
    }
  } else if (type === "live_transcript") {
    const text = msg.text as string;
    console.log(`📝 [LIVE-TRANSCRIPT] ${text}`);
    setOrbMood("neutral");
  }

  // =========================================================================
  // AUDIO RESPONSE - THE CRITICAL PART to prevent feedback
  // =========================================================================
  else if (type === "response_audio") {
    const audioData = msg.audio as string;
    
    if (audioData) {
      console.log(`🎵 [AUDIO-RESPONSE] Received audio data (${audioData.length} chars base64)`);
      console.log(`🔇 [AUDIO-RESPONSE] CRITICAL: Pausing microphone BEFORE audio playback`);
      
      // CRITICAL: Pause microphone FIRST before audio starts playing
      voiceInput.pause();
      
      // Mark that audio is now playing
      isAudioPlaying = true;
      console.log(`🟴 [AUDIO-RESPONSE] Audio playback flag SET`);
      
      // Transition to speaking state (which also pauses, but we did it explicitly above)
      if (currentState !== "speaking") {
        transition("speaking");
      }
      
      console.log(`▶️ [AUDIO-RESPONSE] Enqueueing audio for playback...`);
      audioPlayer.enqueue(audioData);
      console.log(`✅ [AUDIO-RESPONSE] Audio enqueued successfully`);
    } else {
      // No audio data received (TTS failed)
      console.warn(`⚠️ [AUDIO-RESPONSE] No audio data - returning to idle`);
      isAudioPlaying = false;
      transition("idle");
    }
  }

  // =========================================================================
  // WIDGET CONTROL - AI requests the UI to open/close/toggle a widget
  // =========================================================================
  else if (type === "widget_control") {
    const command = msg.command as string;
    const widget = msg.widget as string;

    console.log(`🧩 [WIDGET-CONTROL] ${command} ${widget}`);
    if ((window as any).novaWidgetControl) {
      (window as any).novaWidgetControl(command, widget, {
        prompt: msg.prompt,
        request_id: msg.request_id,
        source: msg.source,
        direction: msg.direction,
        amount: msg.amount,
      });
    } else {
      console.warn("⚠️ [WIDGET-CONTROL] No widget controller available");
      setTranscriptionVisual(false);
      socket.send({
        type: 'widget_action_result',
        widget,
        command,
        request_id: msg.request_id,
        status: 'failed',
        detail: 'Widget controller is not available in the frontend.',
      });
    }
  }

  else if (type === "widget_action_ack") {
    console.log(
      `[WIDGET-ACTION] Server acknowledged ${String(msg.widget)} ${String(msg.command)}: ${String(msg.status)}`
    );
  }

  // =========================================================================
  // STATUS UPDATES - Server state notifications
  // =========================================================================
  else if (type === "status") {
    const state = msg.state as string;
    const message = msg.message as string;
    
    console.log(`📊 [SERVER-STATUS] ${state}${message ? ': ' + message : ''}`);
    
    if (state === "thinking" && currentState !== "thinking") {
      transition("thinking");
    } 
    else if (state === "idle" && !isAudioPlaying) {
      transition("idle");
    }
  } 

  // =========================================================================
  // LEGACY FORMAT - Old message format (backward compatibility)
  // =========================================================================
  else if (type === "audio") {
    const audioData = msg.data as string;
    console.log(`🎵 [AUDIO-LEGACY] Received old format audio (${audioData ? `${audioData.length} chars` : "EMPTY"})`);
    
    if (audioData) {
      // Pause microphone before playing
      voiceInput.pause();
      isAudioPlaying = true;
      
      if (currentState !== "speaking") {
        transition("speaking");
      }
      audioPlayer.enqueue(audioData);
    } else {
      isAudioPlaying = false;
      transition("idle");
    }
    
    if (msg.text) console.log(`📝 [LEGACY-TEXT]`, msg.text);
  } 

  // =========================================================================
  // TEXT FALLBACK - When TTS completely fails
  // =========================================================================
  else if (type === "text") {
    console.log(`📄 [TEXT-FALLBACK] No audio available, displaying text:`, msg.text);
    isAudioPlaying = false;
    transition("idle");
  } 

  // =========================================================================
  // ERROR HANDLING
  // =========================================================================
  else if (type === "error") {
    console.error(`❌ [ERROR] Server error:`, msg.message);
    showError(msg.message as string);
    isAudioPlaying = false;
    transition("idle");
  } 

  // =========================================================================
  // Unknown format
  // =========================================================================
  else {
    console.debug("[WS] Unknown message type:", type);
  }
});

// ---------------------------------------------------------------------------
// Kick off
// ---------------------------------------------------------------------------

setConnected(false);
updateStatus("idle");

console.log(" [INIT] Starting Nova AI Frontend Integration");
console.log(" [INIT] WebSocket URL:", WS_URL);
console.log(" [INIT] Creating orb visualization...");
console.log(" [INIT] Creating voice input system...");
console.log(" [INIT] Creating audio player...");

// Start listening after a brief delay for the orb to render
setTimeout(() => {
  setupVoiceInput();
  console.log("🎧 [INIT] Voice input ready, transitioning to listening...");
  if (!isMuted) {
    voiceInput.start();
    transition("listening");
  } else {
    transition("idle");
  }
}, 1000);

// Resume AudioContext on ANY user interaction (browser autoplay policy)
function ensureAudioContext() {
  const ctx = audioPlayer.getAnalyser().context as AudioContext;
  if (ctx.state === "suspended") {
    console.log("🔊 [AUDIO] AudioContext suspended, resuming...");
    ctx.resume().then(() => console.log("✅ [AUDIO] Context resumed"));
  }
}
document.addEventListener("click", ensureAudioContext);
document.addEventListener("touchstart", ensureAudioContext);
document.addEventListener("keydown", ensureAudioContext, { once: true });

// Try to resume audio context on load
ensureAudioContext();

console.log("✅ [INIT] Frontend initialization complete!");

// Initialize React widgets
initWidgets();

window.addEventListener('novaWidgetActionResult', (event: Event) => {
  const detail = (event as CustomEvent).detail || {};
  socket.send({
    type: 'widget_action_result',
    widget: detail.widget,
    command: detail.command,
    request_id: detail.request_id,
    status: detail.status,
    detail: detail.detail,
  });
});

// Listen for widget open/close events to reposition the orb
window.addEventListener('orbWidgetStateChange', (ev: Event) => {
  try {
    const detail = (ev as CustomEvent).detail || {};
    const hasAny = !!detail.hasAnyWidgetOpen;
    orb.setPosition(hasAny ? 'right' : 'center');
    
    if (soundWaveEl) {
      soundWaveEl.classList.toggle("shifted-right", hasAny);
    }
    transcriptionDots.classList.toggle("shifted-right", hasAny);
  } catch (e) {
    console.warn('[ORB-EVENT] Failed to handle orbWidgetStateChange', e);
  }
});

// ---------------------------------------------------------------------------
// UI Controls
// ---------------------------------------------------------------------------

const btnMute = document.getElementById("btn-mute")!;
const btnMenu = document.getElementById("btn-menu")!;
const menuDropdown = document.getElementById("menu-dropdown")!;
const btnRestart = document.getElementById("btn-restart")!;

btnMute.addEventListener("click", (e) => {
  e.stopPropagation();
  isMuted = !isMuted;
  localStorage.setItem(MIC_MUTE_KEY, isMuted ? "true" : "false");
  btnMute.classList.toggle("muted", isMuted);
  soundWave.setMuted(isMuted);
  if (isMuted) {
    // Fully stop and destroy the voice input system
    if (voiceInput) voiceInput.stop();
    transition("idle");
  } else {
    // Re-create and start the voice input system
    setupVoiceInput();
    voiceInput.start();
    transition("listening");
  }
});

// On load, update mute button UI and enforce mute state
if (isMuted) {
  btnMute.classList.add("muted");
  // Do not start voice input if muted
  transition("idle");
} else {
  btnMute.classList.remove("muted");
}

btnMenu.addEventListener("click", (e) => {
  e.stopPropagation();
  menuDropdown.style.display = menuDropdown.style.display === "none" ? "block" : "none";
});

document.addEventListener("click", () => {
  menuDropdown.style.display = "none";
});

btnRestart.addEventListener("click", async (e) => {
  e.stopPropagation();
  menuDropdown.style.display = "none";
  statusEl.textContent = "restarting...";
  try {
    await fetch("/api/restart", { method: "POST" });
    // Wait a few seconds then reload
    setTimeout(() => window.location.reload(), 4000);
  } catch {
    statusEl.textContent = "restart failed";
  }
});

// Settings button
const btnSettings = document.getElementById("btn-settings")!;
btnSettings.addEventListener("click", (e) => {
  e.stopPropagation();
  menuDropdown.style.display = menuDropdown.style.display === "none" ? "block" : "none";
  openSettings();
});

// First-time setup detection — check after a short delay for server readiness
setTimeout(() => {
  checkFirstTimeSetup();
}, 2000);
