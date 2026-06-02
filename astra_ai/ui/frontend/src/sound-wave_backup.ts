/**
 * SoundWaveController
 * 
 * Manages the real-time visualization of a 9-bar sound wave icon
 * connected to both the user's microphone (when listening) and the
 * AI speech output (when speaking).
 * 
 * Animates the bars based on active audio data, applying dynamic
 * state classes (blue for listening, red for thinking, green for speaking)
 * to change colors dynamically in sync with the Orb.
 */

export class SoundWaveController {
  private container: HTMLElement | null = null;
  private bars: HTMLElement[] = [];
  private audioCtx: AudioContext | null = null;
  private micAnalyser: AnalyserNode | null = null;
  private aiAnalyser: AnalyserNode | null = null;
  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;
  private isActive: boolean = false;
  private isMuted: boolean = false;
  private currentState: string = "idle";

  // Base heights in pixels for the 9 bars matching the proportions in the reference image
  private readonly baseHeights = [6, 34, 20, 14, 28, 14, 32, 22, 8];
  // Current animated heights
  private currentHeights = [6, 34, 20, 14, 28, 14, 32, 22, 8];

  constructor(containerId: string) {
    this.container = document.getElementById(containerId);
    if (this.container) {
      // Find or build the 9 bars
      this.bars = Array.from(this.container.querySelectorAll(".sound-wave-bar")) as HTMLElement[];
      if (this.bars.length === 0) {
        this.container.innerHTML = "";
        for (let i = 0; i < 9; i++) {
          const bar = document.createElement("div");
          bar.className = "sound-wave-bar";
          this.container.appendChild(bar);
          this.bars.push(bar);
        }
      }
    }
    this.updateVisuals();
    this.startAnimationLoop();
  }

  /**
   * Links the AI speech output Audio Analyser node to the controller.
   */
  public setAIAnalyser(analyser: AnalyserNode | null): void {
    this.aiAnalyser = analyser;
  }

  /**
   * Sets the mute state of the microphone.
   */
  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.isActive = (this.currentState === "listening" || this.currentState === "idle") && !muted;
    this.updateVisuals();
    if (muted) {
      this.stopMic();
    } else {
      this.checkAndStartMic();
    }
  }

  /**
   * Sets the current state of the UI state machine.
   * Controls when to enable mic capture and how to style the sound wave container.
   */
  public setState(state: string): void {
    this.currentState = state;
    this.isActive = (state === "listening" || state === "idle") && !this.isMuted;
    this.updateVisuals();
    
    if (this.isActive) {
      this.checkAndStartMic();
    } else {
      this.stopMic();
    }
  }

  /**
   * Toggles state classes on the DOM container to trigger CSS-driven color themes.
   */
  private updateVisuals(): void {
    if (!this.container) return;
    
    // Remove all state classes
    this.container.classList.remove("idle", "listening", "thinking", "speaking", "muted");
    
    // Apply current state class
    if (this.isMuted) {
      this.container.classList.add("muted");
    } else {
      this.container.classList.add(this.currentState);
    }
  }

  /**
   * Requests mic permission and initiates the microphone audio analyzer.
   */
  private async checkAndStartMic(): Promise<void> {
    if (!this.isActive || this.isMuted) return;
    if (this.stream) return; // Already capturing

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn("[SOUND-WAVE] getUserMedia not supported in this context");
      return;
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.micAnalyser = this.audioCtx.createAnalyser();
      this.micAnalyser.fftSize = 128;
      this.micAnalyser.smoothingTimeConstant = 0.72; // Smooth out mic jitter

      this.source = this.audioCtx.createMediaStreamSource(this.stream);
      this.source.connect(this.micAnalyser);
    } catch (err) {
      console.warn("[SOUND-WAVE] Failed to start microphone analyser:", err);
    }
  }

  /**
   * Stops analysis and releases the microphone hardware/stream.
   */
  private stopMic(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.audioCtx) {
      if (this.audioCtx.state !== "closed") {
        this.audioCtx.close().catch(() => {});
      }
      this.audioCtx = null;
    }

    this.micAnalyser = null;
  }

  /**
   * Animation frame loop to process frequency bands and update bar heights.
   */
  private startAnimationLoop(): void {
    const dataArray = new Uint8Array(64); // Safe size for 128 fftSize
    
    const update = () => {
      this.animationFrameId = requestAnimationFrame(update);

      // Determine active analyser based on current state
      let activeAnalyser: AnalyserNode | null = null;
      if (this.currentState === "speaking" && !this.isMuted) {
        activeAnalyser = this.aiAnalyser;
      } else if (this.isActive && !this.isMuted) {
        activeAnalyser = this.micAnalyser;
      }

      let avgVolume = 0;
      const isSpeakingState = this.currentState === "speaking";

      if (activeAnalyser) {
        activeAnalyser.getByteFrequencyData(dataArray);
        
        let totalEnergy = 0;
        for (let i = 0; i < dataArray.length; i++) {
          totalEnergy += dataArray[i];
        }
        avgVolume = totalEnergy / (dataArray.length || 1);
      }

      // Noise gate threshold: 8 for mic, 2 for direct clean AI audio
      const threshold = isSpeakingState ? 2 : 8;
      const hasAudio = avgVolume > threshold;

      // Map the 64 frequency bins to 9 specific ranges targeting human voice:
      // Bar 0: Vocal Fundamental Low (bins 1-2, ~375Hz - 1125Hz)
      // Bar 1: Bass range (bins 3-4, ~1125Hz - 1875Hz)
      // Bar 2: Low-mid Formants (bins 5-6, ~1875Hz - 2625Hz)
      // Bar 3: Mids range (bins 7-8, ~2625Hz - 3375Hz)
      // Bar 4: Mid-high Formants (bins 9-11, ~3375Hz - 4500Hz)
      // Bar 5: High-mids (bins 12-14, ~4500Hz - 5625Hz)
      // Bar 6: High range clarity (bins 15-18, ~5625Hz - 7125Hz)
      // Bar 7: Consonants sibilance (bins 19-24, ~7125Hz - 9375Hz)
      // Bar 8: High air noise (bins 25-35, ~9375Hz - 13500Hz)
      const ranges = [
        [1, 2],
        [3, 4],
        [5, 6],
        [7, 8],
        [9, 11],
        [12, 14],
        [15, 18],
        [19, 24],
        [25, 35],
      ];

      for (let i = 0; i < 9; i++) {
        let targetHeight = this.baseHeights[i];

        if (activeAnalyser && hasAudio) {
          const [start, end] = ranges[i];
          let rangeSum = 0;
          for (let k = start; k <= end; k++) {
            rangeSum += dataArray[k] || 0;
          }
          const rangeAvg = rangeSum / (end - start + 1);

          // Power curve scaling for cleaner, more dynamic visual responses
          const intensity = Math.pow(rangeAvg / 255, 1.4);
          // Set max height boost proportionally. Tallest bars expand more, dots expand less.
          const maxBoost = this.baseHeights[i] > 20 ? (isSpeakingState ? 24 : 32) : (isSpeakingState ? 12 : 16);
          const boost = intensity * maxBoost;
          
          // Jitter speed adjustments
          const jitterSpeed = isSpeakingState ? 0.035 : 0.022;
          const jitterAmp = this.baseHeights[i] > 20 ? (isSpeakingState ? 1.0 : 1.5) : 0.5;
          const jitter = Math.sin(Date.now() * jitterSpeed + i * 1.5) * jitterAmp;

          targetHeight = Math.max(4, this.baseHeights[i] + boost + jitter);
        } else {
          // Slow breathing animation when quiet
          // Thinking breathes faster/more erratically (processing vibe)
          const breatheSpeed = this.currentState === "thinking" ? 0.0055 : 0.0025;
          const breatheAmp = this.currentState === "thinking" ? 1.5 : 0.8;
          const breathe = Math.sin(Date.now() * breatheSpeed + i) * breatheAmp;
          targetHeight = Math.max(4, this.baseHeights[i] + breathe);
        }

        // Snappy rise (when target > current) and smooth decay (when target < current)
        const current = this.currentHeights[i];
        const lerpFactor = targetHeight > current ? 0.26 : 0.12;
        this.currentHeights[i] += (targetHeight - current) * lerpFactor;

        if (this.bars[i]) {
          this.bars[i].style.height = `${this.currentHeights[i]}px`;
        }
      }
    };

    update();
  }

  /**
   * Smoothly returns the bars to their static heights.
   */
  private resetBarsToDefault(): void {
    const animateReset = () => {
      let isDone = true;
      for (let i = 0; i < 9; i++) {
        const diff = this.baseHeights[i] - this.currentHeights[i];
        if (Math.abs(diff) > 0.1) {
          this.currentHeights[i] += diff * 0.12; // Smooth decay to default
          isDone = false;
        } else {
          this.currentHeights[i] = this.baseHeights[i];
        }

        if (this.bars[i]) {
          this.bars[i].style.height = `${this.currentHeights[i]}px`;
        }
      }

      if (!isDone && (!this.isActive || this.isMuted)) {
        requestAnimationFrame(animateReset);
      }
    };
    animateReset();
  }
}
