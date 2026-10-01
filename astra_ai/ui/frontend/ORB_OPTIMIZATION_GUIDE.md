# Orb Optimization & Dynamic Positioning Guide

## Overview

The voice assistant Orb interface has been completely optimized for a refined, modern desktop assistant aesthetic with the following enhancements:

1. **Scaled-Down Orb Size** (~60% reduction)
2. **Enhanced Audio-Reactive Animations**
3. **Widget-Aware Dynamic Positioning**
4. **Smooth State Transitions**

---

## 1. Scale Down - Minimalist Design

### What Changed

The orb particles and radius have been significantly reduced to create a sleek, minimalist appearance that doesn't dominate the UI:

| State | Original Size | Optimized Size | Reduction |
|-------|--------------|----------------|-----------|
| `idle` | 0.08 | 0.032 | 60% |
| `listening` | 0.10 | 0.040 | 60% |
| `thinking` | 0.06 | 0.024 | 60% |
| `speaking` | 0.12 | 0.048 | 60% |

### Particle Radius
- **Original:** `18` units
- **Optimized:** `8` units (~55% reduction)

### Configuration Location

Edit in [orb.ts](src/orb.ts), line ~48 in the `SIZE_CONFIG`:

```typescript
const SIZE_CONFIG = {
  // Base sizes for each state (SCALED DOWN)
  idle:      0.032,      // Minimal size when idle
  listening: 0.040,      // Slightly larger when listening
  thinking:  0.024,      // Compact during thinking
  speaking:  0.048,      // Medium size for speaking
  
  // Audio responsiveness boosters (enhanced)
  bassBoost:    0.024,   // Bass frequency impact (doubled)
  midBoost:     0.020,   // Mid frequency impact
  trebleBoost:  0.016,   // Treble frequency impact
  
  shockwaveBoost: 0.06,  // Audio spike reactions
};
```

### Customization

Runtime adjustment via JavaScript:

```typescript
// Scale orb even smaller for ultra-minimalist UI
orb.resizeParticles({
  idle: 0.020,
  listening: 0.028,
  speaking: 0.032,
  bassBoost: 0.018
});
```

---

## 2. Speech-Responsive Audio Animations

### Enhanced Audio Reactivity

The orb now responds more dynamically to audio processing states with:

- **Bass Boost:** Particles expand outward on low-frequency sounds (2x sensitivity)
- **Mid Pulse:** Mid-range frequencies create wave patterns
- **Treble Flutter:** High frequencies trigger jittery movement
- **Shockwave Effect:** Audio spikes create explosive expansion

### How It Works

During the `speaking` state, the orb analyzes audio frequencies in real-time:

```typescript
// From server.py → Web Audio API
const audioBoost = (bass * 0.024) +        // Low frequency
                   (mid * 0.020) +         // Mid range
                   (treble * 0.016) +      // High frequency
                   (shockwave * 0.06);     // Spike detection

mat.size = currentSize + audioBoost;  // Adaptive particle size
```

### Visual Effects

| Effect | Trigger | Response |
|--------|---------|----------|
| **Breathing** | Speaking state | Sinusoidal radial expansion at 7.5 Hz |
| **Vortex** | Speaking state + dynamics | Swirling rotation around Y-axis |
| **Shockwave** | Bass spike detection | Rapid particle expansion burst |
| **Treble Flutter** | High frequencies | Random jitter in particle positions |
| **Line Density** | Audio presence | Connection line intensity increases |
| **Electron Flow** | Speaking intensity | Bright dots travel along connections |

### Smooth Transitions

All state changes use lerp-based interpolation:

```typescript
// ~45ms transition time (0.028 lerp factor)
currentSize += (targetSize - currentSize) * SIZE_CONFIG.lerpSpeed;
```

Result: **Zero jerky transitions** - particles flow smoothly like liquid.

---

## 3. Dynamic UI Positioning (Widget-Aware)

### How It Works

When widgets open/close, the orb smoothly repositions itself to make room:

```
DEFAULT (No Widgets):          WIDGET OPEN (Image/Notes):
    ┌─────────────────┐          ┌──────────┬──────────┐
    │       ORB       │          │ WIDGET   │   ORB    │
    │     (center)    │    →     │ PANEL    │  (right) │
    └─────────────────┘          └──────────┴──────────┘
```

### Signal Flow

1. **Frontend** (`widgets.tsx`): Widget state changes
2. **Event**: Custom `orbWidgetStateChange` fires
3. **Main** (`main.ts`): Listener detects widget state
4. **Orb** (`orb.ts`): Camera smoothly transitions position
5. **Result**: Visual glide to right position in ~600ms

### Implementation

#### Frontend Widget State Changes (widgets.tsx)

```typescript
const notifyWidgetStateChange = (widgetName: WidgetName, isOpen: boolean) => {
  const event = new CustomEvent('orbWidgetStateChange', {
    detail: { 
      widget: widgetName, 
      isOpen, 
      hasAnyWidgetOpen: Object.values(activeWidgets).some(v => v) 
    },
  });
  window.dispatchEvent(event);
};
```

#### Position Listener (main.ts)

```typescript
window.addEventListener('orbWidgetStateChange', (event: Event) => {
  const customEvent = event as CustomEvent;
  const { hasAnyWidgetOpen } = customEvent.detail;
  
  if (hasAnyWidgetOpen) {
    orb.setPosition("right", true);    // Move to right
  } else {
    orb.setPosition("center", true);   // Return to center
  }
});
```

#### Camera Positioning (orb.ts)

```typescript
// Camera follows orb position smoothly
const targetCameraX = currentPositionLerp > 0.5 ? 22 : Math.sin(t * 0.02) * 5;
camera.position.x = targetCameraX;
camera.lookAt(currentPositionLerp * 25, 0, cloudZ * 0.2);

// Position interpolation (0 = center, 1 = right)
currentPositionLerp += (positionLerp - currentPositionLerp) * 0.04;
```

### Positioning Configuration

**Center Position:**
- Camera X: `0` (with subtle drift ±5)
- Orb focal point: `(0, 0, 0)`
- Used when: No widgets open

**Right Position:**
- Camera X: `22` units right
- Orb focal point: `(25, 0, 0)`
- Used when: Any widget is open

Adjust in [orb.ts](src/orb.ts):

```typescript
const targetCameraX = currentPositionLerp > 0.5 
  ? 22      // RIGHT: Camera distance from orb
  : Math.sin(t * 0.02) * 5;  // CENTER: Drift amount

camera.lookAt(currentPositionLerp * 25, 0, cloudZ * 0.2);
                                    ↑
                                 Focal point shift
```

---

## 4. Audio-Responsive Color Dynamics

The orb color shifts based on:

- **Speaking**: Pulses between base and bright colors with audio reactivity
- **Thinking**: Subtle cyan tint
- **Idle**: Calm blue
- **Mood Override**: Neutral (blue) → Good (green) → Warning (yellow) → Error (red)

---

## 5. Smooth State Transitions

### Transition Animation

When state changes (idle → listening → thinking → speaking), particles tumble with rotation:

```typescript
if (state !== lastState) {
  transitionEnergy = 1.0;  // Start spin
  lastState = state;
}
spinX += transitionEnergy * 0.012 * Math.sin(t * 1.7);
spinY += transitionEnergy * 0.015;
spinZ += transitionEnergy * 0.008 * Math.cos(t * 1.3);
transitionEnergy *= 0.985;  // Decay over time
```

Result: **Smooth 1-2 second transition** with natural tumble effect.

---

## 6. Advanced: Orb Position API

### Methods

#### `orb.setPosition(position: "center" | "right", animate?: boolean)`

```typescript
// Move orb to right (for widget panel)
orb.setPosition("right", true);

// Return to center
orb.setPosition("center", true);
```

#### `orb.setState(state: OrbState)`

```typescript
type OrbState = "idle" | "listening" | "thinking" | "speaking";

orb.setState("speaking");  // Trigger audio-reactive mode
```

#### `orb.setMood(mood: OrbMood)`

```typescript
type OrbMood = "neutral" | "good" | "warning" | "error";

orb.setMood("good");     // Green color
orb.setMood("error");    // Red color
```

#### `orb.resizeParticles(config: SizeConfig)`

```typescript
orb.resizeParticles({
  idle: 0.020,           // Smaller idle state
  listening: 0.028,
  speaking: 0.032,
  bassBoost: 0.018,
  trebleBoost: 0.012,
  lerpSpeed: 0.035       // Faster transitions
});
```

---

## 7. Performance Optimizations

### Particle System

- **2000 particles** (optimized from original)
- **Additive blending** for smooth overlaps
- **Lazy connection lines** (only rendered if needed)
- **Electron trails** for visual feedback

### Rendering

- **WebGL antialiasing** enabled
- **Depth write disabled** for particle blending
- **Pixel ratio**: Native device DPI
- **Frame rate**: 60 FPS (depends on system)

---

## 8. Customization Examples

### Ultra-Minimalist Mode

```typescript
orb.resizeParticles({
  idle: 0.015,
  listening: 0.020,
  thinking: 0.012,
  speaking: 0.025,
  bassBoost: 0.010,
  midBoost: 0.008,
  trebleBoost: 0.006,
  lerpSpeed: 0.035
});
```

### High-Energy Mode

```typescript
orb.resizeParticles({
  idle: 0.050,
  listening: 0.065,
  thinking: 0.045,
  speaking: 0.080,
  bassBoost: 0.040,
  midBoost: 0.032,
  trebleBoost: 0.024,
  shockwaveBoost: 0.10,
  lerpSpeed: 0.040
});
```

### Responsive Positioning

```typescript
// Auto-adjust based on screen size
if (window.innerWidth < 768) {
  orb.setPosition("center");  // Mobile: keep centered
} else {
  orb.setPosition("right");   // Desktop: allow right positioning
}
```

---

## 9. Files Modified

| File | Changes |
|------|---------|
| [orb.ts](src/orb.ts) | Scaled sizes, position control, camera movement |
| [widgets.tsx](src/widgets.tsx) | Widget state emission, event dispatching |
| [main.ts](src/main.ts) | Widget listener, orb position control |
| [style.css](src/style.css) | Canvas transition support |

---

## 10. Debugging & Monitoring

### Console Logging

The system logs state changes:

```
🎨 [WIDGET-STATE] image is now OPEN
   Any widgets open: true
➡️  [ORB-POSITION] Moving orb to RIGHT (widget panel active)

[ORB] setState: speaking
📥 [WS] Received: { type: "response_audio", data: "..." }
```

### Browser DevTools

Monitor in real-time:

```javascript
// Check current position
window.dispatchEvent(new Event('debugOrbState'));

// Simulate widget changes
window.dispatchEvent(new CustomEvent('orbWidgetStateChange', {
  detail: { widget: 'image', isOpen: true, hasAnyWidgetOpen: true }
}));

// Trigger demo mode
window.aegisOrb?.triggerDemo();
```

---

## 11. Future Enhancements

Potential improvements:

- [ ] Multi-widget positioning (each widget gets dedicated space)
- [ ] Gesture-based controls (drag to reposition)
- [ ] Neural network-based mood detection
- [ ] VR/AR integration with spatial audio
- [ ] Particle system GPU acceleration
- [ ] Custom particle effect plugins

---

## 12. Troubleshooting

### Orb not moving to right position

1. Check widget state in console: `window.dispatchEvent(new Event('orbWidgetStateChange'))`
2. Verify `orbWidgetStateChange` listener is registered
3. Check camera position in DevTools

### Audio not reactive

1. Verify `orb.setAnalyser(analyser)` is called in main.ts
2. Check audio frequencies: `analyser.getByteFrequencyData()`
3. Confirm Web Audio API context is not suspended

### Performance issues

1. Reduce particle count in `PARTICLE_RADIUS` calculation
2. Disable electron trails during heavy loads
3. Lower `lerpSpeed` for faster updates
4. Use `performance.now()` to profile frame timing

---

## See Also

- [VOICE_SYSTEM_README.md](../VOICE_SYSTEM_README.md) - Voice input/output system
- [server.py](backend/server.py) - Backend WebSocket server
- [ws.ts](src/ws.ts) - WebSocket client
- Three.js Documentation: https://threejs.org/docs/

