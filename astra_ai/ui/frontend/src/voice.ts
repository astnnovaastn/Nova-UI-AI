/**
 * Voice input (Web Speech API) and audio output (AudioContext) for Nova AI.
 * 
 * FEATURES:
 * - Real-time speech recognition with intelligent phrase detection
 * - Natural pause handling (distinguishes breathing pauses from speech end)
 * - Confidence tracking with trend analysis
 * - Phrase context buffering for complete sentence capture
 * - Robust error recovery and microphone pause/resume
 * - Comprehensive logging for debugging
 */

// ---------------------------------------------------------------------------
// Speech Recognition Engine with Intelligent Phrase Detection
// ---------------------------------------------------------------------------

export interface VoiceInput {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const webkitSpeechRecognition: any;

/**
 * Phrase detection configuration
 * These values are calibrated for natural English speech patterns
 */
interface SpeechConfig {
  silenceThreshold: number;         // Silence duration before timeout (ms)
  confidenceThreshold: number;      // Minimum confidence to consider speech valid
  minPhraseLength: number;          // Minimum words to consider a complete phrase
  confidenceTrendWindow: number;    // Number of results to track for trend analysis
}

export function createVoiceInput(
  onTranscript: (text: string) => void,
  onError: (msg: string) => void
): VoiceInput {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SR = (window as any).SpeechRecognition || (typeof webkitSpeechRecognition !== "undefined" ? webkitSpeechRecognition : null);
  if (!SR) {
    onError("Speech recognition not supported in this browser");
    return { start() {}, stop() {}, pause() {}, resume() {} };
  }

  const recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  // =========================================================================
  // STATE VARIABLES
  // =========================================================================
  let shouldListen = false;
  let paused = false;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastActivityTime = Date.now();
  let speechDetected = false;
  let hasStartedSpeaking = false;
  
  // Phrase buffering for better completeness
  let phraseBuffer = "";           // Current accumulated phrase
  let interimBuffer = "";          // Latest interim result
  let lastFinalTranscript = "";    // Last confirmed final transcript
  
  // Confidence tracking for trend analysis
  let confidenceHistory: number[] = [];
  let lastConfidenceDropTime = Date.now();
  let consecutiveConfidenceDrops = 0;

  // =========================================================================
  // CONFIGURATION - TUNED FOR NATURAL SPEECH
  // =========================================================================
  
  const config: SpeechConfig = {
    silenceThreshold: 1300,         // 1.3s balances responsiveness with pause tolerance
    confidenceThreshold: 0.25,      // Lower threshold catches more speech, real/fake separated by isFinal
    minPhraseLength: 2,             // Minimum 2 words to avoid false triggers on fragments
    confidenceTrendWindow: 5,       // Track last 5 confidence scores for trend
  };

  // =========================================================================
  // UTILITY FUNCTIONS
  // =========================================================================

  /**
   * Analyzes if text appears to be a complete phrase/sentence
   * Checks for sentence ending patterns and reasonable length
   */
  const isLikelyCompletePhrase = (text: string): boolean => {
    const words = text.trim().split(/\s+/).length;
    
    // Too short - likely incomplete
    if (words < config.minPhraseLength) {
      return false;
    }
    
    // Heuristics for sentence completion
    const endsWithPunctuation = /[.!?;:]$/.test(text.trim());
    const hasReasonableLength = words >= 4;  // Most complete thoughts have 4+ words
    const endsWithCommon = /\s(then|because|and|or|but|so|therefore|however)\s/.test(text.toLowerCase());
    
    return endsWithPunctuation || (hasReasonableLength && !endsWithCommon);
  };

  /**
   * Updates confidence history and detects trend
   * Returns true if confidence is showing downward trend (possible speech end)
   */
  const updateConfidenceTrend = (confidence: number): { isTrending: boolean; trend: number } => {
    confidenceHistory.push(confidence);
    
    // Keep only recent history
    if (confidenceHistory.length > config.confidenceTrendWindow) {
      confidenceHistory.shift();
    }

    // Calculate trend (slope) - positive = increasing, negative = decreasing
    if (confidenceHistory.length >= 3) {
      const recent = confidenceHistory.slice(-3);
      const trend = (recent[2] - recent[0]) / 2; // Average change per item
      const isTrending = trend < -0.05;  // Significant downward trend
      return { isTrending, trend };
    }
    
    return { isTrending: false, trend: 0 };
  };

  /**
   * Word count of current phrase
   */
  const getWordCount = (text: string): number => {
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  /**
   * Format logging with consistent prefix and timestamp
   */
  const logDebug = (level: string, message: string, extra?: any) => {
    const time = new Date().toLocaleTimeString();
    const prefix = `[SPEECH-${time}]`;
    if (extra) {
      console.log(`${prefix} ${message}`, extra);
    } else {
      console.log(`${prefix} ${message}`);
    }
  };

  // Clear silence timer
  const clearSilenceTimer = () => {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    } 
  };

  /**
   * Reset silence detection timer
   * Called whenever speech activity or interim results are detected
   */
  const resetSilenceTimer = () => {
    clearSilenceTimer();
    lastActivityTime = Date.now();
    
    silenceTimer = setTimeout(() => {
      if (shouldListen && !paused && hasStartedSpeaking) {
        logDebug("INFO", "🔇 Silence timeout trigger - ending phrase capture", { 
          lastPhrase: phraseBuffer,
          wordCount: getWordCount(phraseBuffer)
        });
        
        // Send accumulated phrase if any
        if (phraseBuffer.trim()) {
          onTranscript(phraseBuffer.trim());
        }
        
        // Reset for next phrase
        hasStartedSpeaking = false;
        speechDetected = false;
        phraseBuffer = "";
        interimBuffer = "";
        confidenceHistory = [];
        consecutiveConfidenceDrops = 0;
      }
    }, config.silenceThreshold);
  };

  // =========================================================================
  // RECOGNITION EVENT HANDLERS
  // =========================================================================

  recognition.onstart = () => {
    logDebug("INFO", "🎤 Microphone active, waiting for speech input...");
    lastActivityTime = Date.now();
    confidenceHistory = [];
    consecutiveConfidenceDrops = 0;
    resetSilenceTimer();
  };

  recognition.onresult = (event: any) => {
    // CRITICAL: Ignore all results while paused (AI is speaking or processing)
    if (paused) {
      logDebug("DEBUG", "⏸️  Ignoring input while paused");
      clearSilenceTimer();
      return;
    }

    let hasProcessedResult = false;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript.trim();
      const isFinal = event.results[i].isFinal;
      const confidence = event.results[i][0].confidence;

      if (!transcript || confidence < config.confidenceThreshold) {
        continue;
      }

      // =====================================================================
      // HANDLE INTERIM RESULTS (user still speaking)
      // =====================================================================
      if (!isFinal) {
        hasProcessedResult = true;
        
        if (!hasStartedSpeaking) {
          logDebug("INFO", "📢 Speech detected (interim)", { 
            confidence: (confidence * 100).toFixed(1),
            text: transcript 
          });
          hasStartedSpeaking = true;
          speechDetected = true;
        }

        // Buffer interim result - accumulate complete phrase as user speaks
        interimBuffer = transcript;
        phraseBuffer = transcript;  // Interim replaces current accumulation
        lastActivityTime = Date.now();

        // Update confidence trend
        const { isTrending, trend } = updateConfidenceTrend(confidence);
        
        if (isTrending) {
          consecutiveConfidenceDrops++;
          lastConfidenceDropTime = Date.now();
        } else {
          consecutiveConfidenceDrops = 0;
        }

        logDebug("DEBUG", "🎤 Interim result buffered", {
          text: transcript.substring(0, 50) + (transcript.length > 50 ? "..." : ""),
          confidence: (confidence * 100).toFixed(1),
          trend: trend.toFixed(3),
          wordCount: getWordCount(transcript),
          drops: consecutiveConfidenceDrops
        });

        // Reset timeout - user is actively speaking
        resetSilenceTimer();

      // =====================================================================
      // HANDLE FINAL RESULTS (end-of-phrase marker from browser)
      // =====================================================================
      } else {
        hasProcessedResult = true;
        
        lastFinalTranscript = transcript;
        phraseBuffer = transcript;

        const wordCount = getWordCount(transcript);
        const isComplete = isLikelyCompletePhrase(transcript);

        logDebug("INFO", "✅ Final result from browser", {
          text: transcript.substring(0, 50) + (transcript.length > 50 ? "..." : ""),
          confidence: (confidence * 100).toFixed(1),
          complete: isComplete,
          wordCount: wordCount
        });

        // DECISION LOGIC: Send immediately when browser marks as final
        // The browser's isFinal flag is highly reliable for sentence boundaries
        if (wordCount >= config.minPhraseLength) {
          logDebug("INFO", "📤 Sending transcript (browser marked final + minimum words)", {
            fullText: transcript,
            wordCount: wordCount
          });
          
          onTranscript(transcript);

          // Reset for next phrase
          phraseBuffer = "";
          interimBuffer = "";
          hasStartedSpeaking = false;
          speechDetected = false;
          confidenceHistory = [];
          consecutiveConfidenceDrops = 0;
          
          clearSilenceTimer();
          return;
        } else {
          logDebug("DEBUG", "⚠️  Too short, keeping buffer for accumulation", {
            wordCount: wordCount,
            minRequired: config.minPhraseLength
          });
          resetSilenceTimer();
        }
      }
    }

    if (hasProcessedResult && hasStartedSpeaking) {
      resetSilenceTimer();
    }
  };

  recognition.onend = () => {
    logDebug("INFO", "⏹️  Recognition ended");
    clearSilenceTimer();
    
    if (paused) {
      logDebug("DEBUG", "⏹️  Recognition ended while paused - will restart on resume");
      return;
    }
    
    if (shouldListen && !paused) {
      try {
        // Small delay before restarting to avoid picking up residual audio
        setTimeout(() => {
          if (shouldListen && !paused) {
            logDebug("INFO", "🔄 Restarting recognition engine...");
            hasStartedSpeaking = false;
            confidenceHistory = [];
            consecutiveConfidenceDrops = 0;
            recognition.start();
          }
        }, 300);
      } catch (e) {
        logDebug("WARN", "❌ Error restarting recognition:", e);
      }
    }
  };

  recognition.onerror = (event: any) => {
    logDebug("WARN", `⚠️  Recognition error: ${event.error}`);
    clearSilenceTimer();
    
    if (paused) {
      logDebug("DEBUG", "⏸️  Error while paused - waiting for resume");
      return;
    }
    
    // Error recovery strategies
    switch (event.error) {
      case "not-allowed":
        onError("Microphone access denied. Please allow microphone access in browser settings.");
        shouldListen = false;
        break;
        
      case "no-speech":
        logDebug("INFO", "ℹ️  No speech detected in this attempt, continuing...");
        if (shouldListen && !paused) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              logDebug("DEBUG", "Recognition already starting");
            }
          }, 500);
        }
        break;
        
      case "aborted":
        logDebug("DEBUG", "ℹ️  Recognition aborted (intentional or pause)");
        break;
        
      case "network":
        logDebug("WARN", "⚠️  Network error - will retry...");
        if (shouldListen && !paused) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              logDebug("DEBUG", "Recognition already starting");
            }
          }, 1000);
        }
        break;
        
      case "service-not-allowed":
        onError("Speech recognition service not available.");
        shouldListen = false;
        break;
        
      default:
        logDebug("WARN", `Unknown error: ${event.error}`);
        if (shouldListen && !paused) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              logDebug("DEBUG", "Recognition already starting");
            }
          }, 500);
        }
    }
  };

  return {
    start() {
      logDebug("INFO", "▶️  Starting voice input system");
      shouldListen = true;
      paused = false;
      hasStartedSpeaking = false;
      speechDetected = false;
      phraseBuffer = "";
      interimBuffer = "";
      confidenceHistory = [];
      consecutiveConfidenceDrops = 0;
      try {
        recognition.start();
        logDebug("INFO", "✅ Voice input started successfully");
      } catch (e) {
        logDebug("DEBUG", "Recognition already running", e);
      }
    },

    stop() {
      logDebug("INFO", "⏹️  Stopping voice input system");
      shouldListen = false;
      paused = false;
      hasStartedSpeaking = false;
      clearSilenceTimer();
      
      // Send any buffered phrase before stopping
      if (phraseBuffer.trim() && getWordCount(phraseBuffer) >= config.minPhraseLength) {
        logDebug("INFO", "📤 Sending buffered phrase on stop", { 
          phrase: phraseBuffer 
        });
        onTranscript(phraseBuffer.trim());
      }
      
      phraseBuffer = "";
      interimBuffer = "";
      confidenceHistory = [];
      consecutiveConfidenceDrops = 0;
      
      try {
        recognition.stop();
        logDebug("INFO", "✅ Voice input stopped");
      } catch {
        logDebug("DEBUG", "Recognition already stopped");
      }
    },

    pause() {
      logDebug("INFO", "⏸️  Pausing microphone - AI is speaking or processing");
      paused = true;
      hasStartedSpeaking = false;
      speechDetected = false;
      clearSilenceTimer();
      
      try {
        recognition.stop();
        recognition.abort();
        logDebug("INFO", "✅ Microphone paused - full silence enforced");
      } catch (e) {
        logDebug("WARN", "⚠️  Warning during pause (may already be stopped):", e);
      }
    },
    
    resume() {
      logDebug("INFO", "▶️  Resuming microphone for user input");
      paused = false;
      hasStartedSpeaking = false;
      speechDetected = false;
      phraseBuffer = "";
      interimBuffer = "";
      confidenceHistory = [];
      consecutiveConfidenceDrops = 0;
      
      if (!shouldListen) {
        logDebug("DEBUG", "⏹️  Resume called but shouldListen=false");
        return;
      }
      
      // Staggered restart to ensure clean audio capture
      logDebug("DEBUG", "⏱️  Waiting 150ms for clean restart...");
      setTimeout(() => {
        if (!paused && shouldListen) {
          try {
            logDebug("INFO", "🎤 Restarting recognition after pause...");
            recognition.start();
            logDebug("INFO", "✅ Recognition restarted successfully");
          } catch (e) {
            logDebug("WARN", "❌ Failed to restart recognition:", e);
          }
        } else {
          logDebug("DEBUG", "⏹️  Restart cancelled (state changed during delay)");
        }
      }, 150);
    },
  };
}

// ---------------------------------------------------------------------------
// Audio Player
// ---------------------------------------------------------------------------

export interface AudioPlayer {
  enqueue(base64: string): Promise<void>;
  stop(): void;
  getAnalyser(): AnalyserNode;
  onFinished(cb: () => void): void;
}

export function createAudioPlayer(): AudioPlayer {
  const audioCtx = new AudioContext();
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.8;
  analyser.connect(audioCtx.destination);

  const queue: AudioBuffer[] = [];
  let isPlaying = false;
  let currentSource: AudioBufferSourceNode | null = null;
  let finishedCallback: (() => void) | null = null;

  function playNext() {
    if (queue.length === 0) {
      isPlaying = false;
      currentSource = null;
      console.log("🎵 [AUDIO] Queue finished, all audio played");
      finishedCallback?.();
      return;
    }

    isPlaying = true;
    const buffer = queue.shift()!;
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(analyser);
    currentSource = source;

    console.log(`🎵 [AUDIO] Playing buffer (${buffer.length} samples, ${buffer.duration.toFixed(2)}s)`);

    source.onended = () => {
      if (currentSource === source) {
        playNext();
      }
    };

    source.start();
  }

  return {
    async enqueue(base64: string) {
      // Resume audio context (browser autoplay policy)
      if (audioCtx.state === "suspended") {
        console.log("🎵 [AUDIO] Resuming AudioContext (autoplay policy)");
        await audioCtx.resume();
      }

      try {
        console.log(`🎵 [AUDIO] Decoding Base64 (${base64.length} chars)...`);
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        
        const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
        console.log(`✅ [AUDIO] Decoded successfully (${audioBuffer.duration.toFixed(2)}s)`);
        
        queue.push(audioBuffer);
        console.log(`📦 [AUDIO] Queue length: ${queue.length}`);
        
        if (!isPlaying) {
          console.log("▶️  [AUDIO] Starting playback");
          playNext();
        }
      } catch (err) {
        console.error("❌ [AUDIO] Decode error:", err);
        // Skip bad audio, continue
        if (!isPlaying && queue.length > 0) playNext();
      }
    },

    stop() {
      console.log("⏹️  [AUDIO] Stopping playback");
      queue.length = 0;
      if (currentSource) {
        try {
          currentSource.stop();
        } catch {
          // Already stopped
        }
        currentSource = null;
      }
      isPlaying = false;
    },

    getAnalyser() {
      return analyser;
    },

    onFinished(cb: () => void) {
      finishedCallback = cb;
    },
  };
}
