# Practical Code Examples - Orb Optimization & Widget Integration

## Quick Start Examples

These practical examples show how to use the new orb optimization features.

---

## 1. Basic Orb Control

### Initialize and Scale Down

```typescript
// main.ts - Already done in setup, but here's the pattern

import { createOrb, type OrbState, type OrbMood } from "./orb";

const canvas = document.getElementById("orb-canvas") as HTMLCanvasElement;
const orb = createOrb(canvas);

// Orb is automatically scaled down (60% reduction)
// Default sizes: idle=0.032, listening=0.040, thinking=0.024, speaking=0.048

// Change state (e.g., when audio plays)
orb.setState("speaking");

// Set mood based on AI response
orb.setMood("good");  // Green color

// Return to idle when done
orb.setState("idle");
orb.setMood("neutral");  // Blue color
```

---

## 2. Widget-Responsive Orb Positioning

### Listen to Widget Changes

```typescript
// main.ts - Example listener

window.addEventListener('orbWidgetStateChange', (event: Event) => {
  const customEvent = event as CustomEvent;
  const { widget, isOpen, hasAnyWidgetOpen } = customEvent.detail;
  
  console.log(`Widget ${widget} is now ${isOpen ? 'open' : 'closed'}`);
  
  // Move orb when widgets are open
  if (hasAnyWidgetOpen) {
    orb.setPosition("right", true);    // Slide right with animation
  } else {
    orb.setPosition("center", true);   // Slide back to center
  }
});
```

### Programmatic Widget Control

```typescript
// You can manually trigger widget changes for testing

// Simulate opening image widget
window.dispatchEvent(new CustomEvent('orbWidgetStateChange', {
  detail: { 
    widget: 'image', 
    isOpen: true, 
    hasAnyWidgetOpen: true 
  }
}));

// After 3 seconds, close the widget
setTimeout(() => {
  window.dispatchEvent(new CustomEvent('orbWidgetStateChange', {
    detail: { 
      widget: 'image', 
      isOpen: false, 
      hasAnyWidgetOpen: false 
    }
  }));
}, 3000);
```

---

## 3. Custom Orb Sizing

### Ultra-Minimalist Configuration

```typescript
// For a very subtle, minimal orb (best for dark themes)

orb.resizeParticles({
  idle: 0.018,           // Extra small
  listening: 0.024,
  thinking: 0.014,
  speaking: 0.032,
  
  // Audio responsiveness
  bassBoost: 0.012,      // Subtle bass response
  midBoost: 0.010,
  trebleBoost: 0.008,
  shockwaveBoost: 0.04,
  
  // Faster transitions
  lerpSpeed: 0.035
});

console.log("✨ Ultra-minimalist orb configured");
```

### High-Energy Gaming Mode

```typescript
// For a vibrant, responsive orb (best for action UI)

orb.resizeParticles({
  idle: 0.060,           // Large and present
  listening: 0.075,
  thinking: 0.055,
  speaking: 0.095,
  
  // Aggressive audio response
  bassBoost: 0.050,      // Strong bass kick
  midBoost: 0.040,
  trebleBoost: 0.030,
  shockwaveBoost: 0.15,  // Big explosions
  
  // Snappy transitions
  lerpSpeed: 0.050
});

console.log("🔥 High-energy orb configured");
```

### Balanced Configuration

```typescript
// Good middle ground for most applications

orb.resizeParticles({
  idle: 0.032,           // Default (current)
  listening: 0.040,
  thinking: 0.024,
  speaking: 0.048,
  
  bassBoost: 0.024,
  midBoost: 0.020,
  trebleBoost: 0.016,
  shockwaveBoost: 0.06,
  
  lerpSpeed: 0.028
});

console.log("⚖️ Balanced orb configuration");
```

---

## 4. Audio-Reactive Animations

### Monitor Audio Frequencies in Real-Time

```typescript
// Get the audio analyser to monitor frequencies

import { createAudioPlayer } from "./voice";

const audioPlayer = createAudioPlayer();
const analyser = audioPlayer.getAnalyser();

// Check audio data every frame
function monitorAudioFrequencies() {
  const freqData = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(freqData);
  
  // Calculate frequency bands
  const bass = freqData.slice(0, 8).reduce((a, b) => a + b) / 8;
  const mid = freqData.slice(8, 24).reduce((a, b) => a + b) / 16;
  const treble = freqData.slice(24, 48).reduce((a, b) => a + b) / 24;
  
  console.log(`Bass: ${bass}, Mid: ${mid}, Treble: ${treble}`);
  
  // Schedule next check
  requestAnimationFrame(monitorAudioFrequencies);
}

// Start monitoring when audio is playing
monitorAudioFrequencies();
```

### React to Specific Frequency Ranges

```typescript
// Customize behavior based on audio content

const analyser = audioPlayer.getAnalyser();

function handleAudioReactivity() {
  const freqData = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(freqData);
  
  const bass = freqData.slice(0, 8).reduce((a, b) => a + b) / (8 * 255);
  const mid = freqData.slice(8, 24).reduce((a, b) => a + b) / (16 * 255);
  const treble = freqData.slice(24, 48).reduce((a, b) => a + b) / (24 * 255);
  
  // React to heavy bass (music, explosions)
  if (bass > 0.6) {
    orb.setMood("warning");  // Yellow alert
    console.log("🎶 Heavy bass detected");
  }
  
  // React to high treble (sharp sounds, alerts)
  if (treble > 0.7) {
    orb.setMood("error");    // Red alert
    console.log("⚠️ High pitch detected");
  }
  
  // Normal balanced audio
  if (bass < 0.3 && mid > 0.4 && treble < 0.4) {
    orb.setMood("neutral");  // Blue calm
    console.log("🎤 Speech detected");
  }
  
  requestAnimationFrame(handleAudioReactivity);
}
```

---

## 5. State Machine Example

### Complete AI Conversation Flow

```typescript
// Complete example showing state transitions

import { createOrb, type OrbState } from "./orb";
import { createSocket } from "./ws";

const orb = createOrb(canvas);
const socket = createSocket("ws://localhost:8340/ws/voice");

type AppState = "idle" | "listening" | "thinking" | "speaking";
let appState: AppState = "idle";

function setAppState(newState: AppState) {
  console.log(`State: ${appState} → ${newState}`);
  appState = newState;
  orb.setState(newState as OrbState);
}

// 1. User clicks to start listening
function startListening() {
  setAppState("listening");  // Orb shows listening state
  voiceInput.start();
}

// 2. User speaks, we capture transcript
function onTranscriptReceived(text: string) {
  console.log(`Transcript: "${text}"`);
  setAppState("thinking");   // Orb shows processing
  
  socket.send({
    type: "transcript",
    text: text,
    isFinal: true
  });
}

// 3. Server responds with audio
socket.onMessage((msg) => {
  if (msg.type === "response_audio") {
    setAppState("speaking");   // Orb shows speaking state
    audioPlayer.enqueue(msg.data);  // Play audio
  }
});

// 4. Audio finishes, return to idle
audioPlayer.onFinished(() => {
  setAppState("idle");         // Orb returns to rest state
  voiceInput.resume();
});
```

---

## 6. Widget Panel Integration

### React Widget Component

```typescript
// components/WidgetPanel.tsx - Example of widget integration

import React, { useEffect } from 'react';

export const WidgetPanel: React.FC<{
  widget: 'image' | 'notes' | 'weather' | 'calculator' | 'tictactoe';
  isOpen: boolean;
  onClose: () => void;
}> = ({ widget, isOpen, onClose }) => {
  
  useEffect(() => {
    // Notify about widget state
    const event = new CustomEvent('orbWidgetStateChange', {
      detail: {
        widget,
        isOpen,
        hasAnyWidgetOpen: isOpen
      }
    });
    window.dispatchEvent(event);
  }, [isOpen, widget]);
  
  if (!isOpen) return null;
  
  return (
    <div className="widget-panel">
      <div className="widget-header">
        <h2>{widget}</h2>
        <button onClick={onClose}>✕</button>
      </div>
      <div className="widget-content">
        {/* Widget-specific content */}
      </div>
    </div>
  );
};
```

---

## 7. Responsive Positioning

### Adapt to Screen Size

```typescript
// main.ts - Responsive position handling

function handleResponsiveOrbPositioning() {
  const breakpoint = 768;  // Tablet/mobile threshold
  
  window.addEventListener('resize', () => {
    if (window.innerWidth < breakpoint) {
      // Mobile: disable right positioning
      orb.setPosition("center");
    }
  });
  
  // Initial check
  if (window.innerWidth < breakpoint) {
    orb.setPosition("center");
  }
}

handleResponsiveOrbPositioning();
```

### Custom Position Controller

```typescript
// Create a position manager for complex layouts

class OrbPositionManager {
  constructor(private orb: Orb) {}
  
  private positions = {
    center: { x: 0, label: "center" },
    right: { x: 25, label: "right sidebar" },
    left: { x: -25, label: "left sidebar" }
  };
  
  setPosition(name: keyof typeof this.positions, animate: boolean = true) {
    console.log(`Moving orb to: ${this.positions[name].label}`);
    
    // Map to valid OrbPosition
    const orbPos = name === "center" ? "center" : "right";
    this.orb.setPosition(orbPos, animate);
  }
  
  moveToNextLayout() {
    // Cycle through available positions
    const positions = Object.keys(this.positions) as Array<keyof typeof this.positions>;
    const currentIndex = positions.indexOf("center");
    const nextIndex = (currentIndex + 1) % positions.length;
    this.setPosition(positions[nextIndex]);
  }
}

// Usage
const positionManager = new OrbPositionManager(orb);
positionManager.setPosition("center");  // Start centered
```

---

## 8. Theme Integration

### Apply Color Themes Based on Orb Mood

```typescript
// Apply CSS classes based on orb mood

const themeMap = {
  neutral: "theme-blue",
  good: "theme-green",
  warning: "theme-yellow",
  error: "theme-red"
};

function applyMoodTheme(mood: OrbMood) {
  const className = themeMap[mood];
  document.body.className = className;
  orb.setMood(mood);
  
  console.log(`Theme applied: ${className}`);
}

// Example theme CSS
const styles = `
  body.theme-blue {
    --accent: #4ca8e8;
    --background: #050508;
  }
  body.theme-green {
    --accent: #3ec46d;
  }
  body.theme-yellow {
    --accent: #ffe066;
  }
  body.theme-red {
    --accent: #ff4c4c;
  }
`;
```

---

## 9. Testing & Debugging

### Console Commands for Testing

```typescript
// Execute in browser console for testing

// Test state changes
window.orb?.setState("speaking");
window.orb?.setState("listening");
window.orb?.setState("thinking");
window.orb?.setState("idle");

// Test moods
window.orb?.setMood("good");
window.orb?.setMood("error");
window.orb?.setMood("warning");
window.orb?.setMood("neutral");

// Test positioning
window.orb?.setPosition("right");
window.orb?.setPosition("center");

// Test sizing
window.orb?.resizeParticles({ 
  idle: 0.020, 
  speaking: 0.040 
});

// Trigger demo
window.orb?.triggerDemo();

// Widget state simulation
window.dispatchEvent(new CustomEvent('orbWidgetStateChange', {
  detail: { widget: 'image', isOpen: true, hasAnyWidgetOpen: true }
}));
```

### Create Debug Panel

```typescript
// Utility: Debug panel for real-time control

function createDebugPanel() {
  const panel = document.createElement('div');
  panel.id = 'debug-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 100px;
    right: 20px;
    padding: 15px;
    background: rgba(0,0,0,0.8);
    border: 1px solid #4ca8e8;
    border-radius: 8px;
    color: #4ca8e8;
    font-family: monospace;
    font-size: 11px;
    z-index: 9999;
    max-width: 200px;
  `;
  
  panel.innerHTML = `
    <div><strong>🎮 ORB DEBUG</strong></div>
    <button onclick="window.orb?.setState('listening')">Listen</button>
    <button onclick="window.orb?.setState('speaking')">Speak</button>
    <button onclick="window.orb?.setState('thinking')">Think</button>
    <button onclick="window.orb?.setMood('good')">Good 🟢</button>
    <button onclick="window.orb?.setMood('error')">Error 🔴</button>
  `;
  
  document.body.appendChild(panel);
}

// createDebugPanel();
```

---

## 10. Performance Optimization

### Lazy Load Widgets

```typescript
// Load widgets only when needed

const widgetCache: Record<string, any> = {};

async function loadWidgetOnDemand(widgetName: string) {
  if (widgetCache[widgetName]) {
    return widgetCache[widgetName];
  }
  
  // Simulate lazy loading
  const widget = await import(`./components/${widgetName}/index.ts`);
  widgetCache[widgetName] = widget;
  
  return widget;
}

// Preload commonly used widgets
loadWidgetOnDemand('calculator');
loadWidgetOnDemand('image');
```

### Monitor Performance

```typescript
// Performance monitoring

function monitorOrbPerformance() {
  const stats = {
    fps: 0,
    lastTime: performance.now(),
    frameCount: 0
  };
  
  function measureFrame() {
    stats.frameCount++;
    const now = performance.now();
    const elapsed = now - stats.lastTime;
    
    if (elapsed >= 1000) {
      stats.fps = Math.round((stats.frameCount * 1000) / elapsed);
      console.log(`FPS: ${stats.fps}`);
      stats.frameCount = 0;
      stats.lastTime = now;
    }
    
    requestAnimationFrame(measureFrame);
  }
  
  measureFrame();
}

monitorOrbPerformance();
```

---

## 11. End-to-End Example

### Complete Application Flow

```typescript
// Complete example combining everything

import { createOrb } from './orb';
import { createSocket } from './ws';
import { createVoiceInput, createAudioPlayer } from './voice';

// Initialize all components
const orb = createOrb(document.getElementById('orb-canvas')!);
const socket = createSocket('ws://localhost:8340/ws/voice');
const voiceInput = createVoiceInput(onTranscript, onError);
const audioPlayer = createAudioPlayer();

// Set up audio analysis
orb.setAnalyser(audioPlayer.getAnalyser());

// State management
let currentState = 'idle';

function setState(newState: string) {
  currentState = newState;
  orb.setState(newState as any);
  console.log(`State: ${newState}`);
}

// Listen to widget changes
window.addEventListener('orbWidgetStateChange', (e: Event) => {
  const { hasAnyWidgetOpen } = (e as CustomEvent).detail;
  orb.setPosition(hasAnyWidgetOpen ? 'right' : 'center', true);
});

// Handle user transcript
function onTranscript(text: string) {
  setState('thinking');
  socket.send({
    type: 'transcript',
    text,
    isFinal: true
  });
}

// Handle server response
socket.onMessage((msg) => {
  if (msg.type === 'response_audio') {
    setState('speaking');
    audioPlayer.enqueue(msg.data);
  } else if (msg.type === 'response_text') {
    console.log('AI:', msg.text);
    
    // Set mood based on response
    if (msg.text.includes('sorry') || msg.text.includes('error')) {
      orb.setMood('error');
    } else if (msg.text.includes('great') || msg.text.includes('good')) {
      orb.setMood('good');
    } else {
      orb.setMood('neutral');
    }
  }
});

// Audio finished
audioPlayer.onFinished(() => {
  setState('idle');
  voiceInput.resume();
});

// Start listening
voiceInput.start();
setState('listening');
```

---

## See Also

- [ORB_OPTIMIZATION_GUIDE.md](./ORB_OPTIMIZATION_GUIDE.md) - Complete reference
- [WIDGET_STATE_MANAGEMENT.md](../backend/WIDGET_STATE_MANAGEMENT.md) - Backend integration
- [orb.ts](./src/orb.ts) - Source implementation
- [main.ts](./src/main.ts) - Integration example

