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
        logDebug("INFO", " Silence timeout trigger - ending phrase capture", { 
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
    logDebug("INFO", " Microphone active, waiting for speech input...");
    lastActivityTime = Date.now();
    confidenceHistory = [];
    consecutiveConfidenceDrops = 0;
    resetSilenceTimer();
  };

  recognition.onresult = (event: any) => {
    // CRITICAL: Ignore all results while paused (AI is speaking or processing)
    if (paused) {
      logDebug("DEBUG", "⏸  Ignoring input while paused");
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
          logDebug("INFO", " Speech detected (interim)", { 
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

        logDebug("INFO", " Final result from browser", {
          text: transcript.substring(0, 50) + (transcript.length > 50 ? "..." : ""),
          confidence: (confidence * 100).toFixed(1),
          complete: isComplete,
          wordCount: wordCount
        });

        // DECISION LOGIC: Send immediately when browser marks as final
        // The browser's isFinal flag is highly reliable for sentence boundaries
        if (wordCount >= config.minPhraseLength) {
          logDebug("INFO", " Sending transcript (browser marked final + minimum words)", {
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
          logDebug("DEBUG", "Too short, keeping buffer for accumulation", {
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
    logDebug("INFO", " Recognition ended");
    clearSilenceTimer();
    
    if (paused) {
      logDebug("DEBUG", "  Recognition ended while paused - will restart on resume");
      return;
    }
    
    if (shouldListen && !paused) {
      try {
        // Small delay before restarting to avoid picking up residual audio
        setTimeout(() => {
          if (shouldListen && !paused) {
            logDebug("INFO", " Restarting recognition engine...");
            hasStartedSpeaking = false;
            confidenceHistory = [];
            consecutiveConfidenceDrops = 0;
            recognition.start();
          }
        }, 300);
      } catch (e) {
        logDebug("WARN", " Error restarting recognition:", e);
      }
    }
  };

  recognition.onerror = (event: any) => {
    logDebug("WARN", `  Recognition error: ${event.error}`);
    clearSilenceTimer();
    
    if (paused) {
      logDebug("DEBUG", "⏸  Error while paused - waiting for resume");
      return;
    }
    
    // Error recovery strategies
    switch (event.error) {
      case "not-allowed":
        onError("Microphone access denied. Please allow microphone access in browser settings.");
        shouldListen = false;
        break;
        
      case "no-speech":
        logDebug("INFO", " No speech detected in this attempt, continuing...");
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
        logDebug("DEBUG", "ℹ  Recognition aborted (intentional or pause)");
        break;
        
      case "network":
        logDebug("WARN", " Network error - will retry...");
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
      logDebug("INFO", "  Starting voice input system");
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
        logDebug("INFO", "Voice input started successfully");
      } catch (e) {
        logDebug("DEBUG", "Recognition already running", e);
      }
    },

    stop() {
      logDebug("INFO", "⏹ Stopping voice input system");
      shouldListen = false;
      paused = false;
      hasStartedSpeaking = false;
      clearSilenceTimer();
      
      // Send any buffered phrase before stopping
      if (phraseBuffer.trim() && getWordCount(phraseBuffer) >= config.minPhraseLength) {
        logDebug("INFO", " Sending buffered phrase on stop", { 
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
        logDebug("INFO", " Voice input stopped");
      } catch {
        logDebug("DEBUG", "Recognition already stopped");
      }
    },

    pause() {
      logDebug("INFO", "⏸  Pausing microphone - AI is speaking or processing");
      paused = true;
      hasStartedSpeaking = false;
      speechDetected = false;
      clearSilenceTimer();
      
      try {
        recognition.stop();
        recognition.abort();
        logDebug("INFO", " Microphone paused - full silence enforced");
      } catch (e) {
        logDebug("WARN", "  Warning during pause (may already be stopped):", e);
      }
    },
    
    resume() {
      logDebug("INFO", "  Resuming microphone for user input");
      paused = false;
      hasStartedSpeaking = false;
      speechDetected = false;
      phraseBuffer = "";
      interimBuffer = "";
      confidenceHistory = [];
      consecutiveConfidenceDrops = 0;
      
      if (!shouldListen) {
        logDebug("DEBUG", "  Resume called but shouldListen=false");
        return;
      }
      
      // Staggered restart to ensure clean audio capture
      logDebug("DEBUG", "⏱  Waiting 150ms for clean restart...");
      setTimeout(() => {
        if (!paused && shouldListen) {
          try {
            logDebug("INFO", " Restarting recognition after pause...");
            recognition.start();
            logDebug("INFO", " Recognition restarted successfully");
          } catch (e) {
            logDebug("WARN", " Failed to restart recognition:", e);
          }
        } else {
          logDebug("DEBUG", "  Restart cancelled (state changed during delay)");
        }
      }, 150);
    },
  };
}

// ---------------------------------------------------------------------------
// Groq Whisper Speech Recognition (High Performance)
// ---------------------------------------------------------------------------

function createLegacyGroqVoiceInput(
  onTranscript: (text: string) => void,
  onError: (msg: string) => void,
  onSpeechStart?: () => void,
  onSpeechEnd?: () => void
): VoiceInput {
  let stream: MediaStream | null = null;
  let mediaRecorder: MediaRecorder | null = null;
  let audioContext: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let processor: ScriptProcessorNode | null = null;
  
  let isListening = false;
  let isPaused = false;
  let audioChunks: Blob[] = [];
  let isSendingAudio = false;
  
  // AGGRESSIVE VAD STATE - MUCH FASTER DETECTION
  let speechDetected = false;
  let silenceCounter = 0;
  let speechCounter = 0;
  
  const SILENCE_THRESHOLD = 60; // VERY HIGH = catches speech immediately (was 50)
  const SILENCE_COUNT_NEEDED = 2; // ULTRA FAST = 2 chunks (~85ms) after speech ends (was 5)
  const SPEECH_COUNT_NEEDED = 1; // IMMEDIATE speech start (was 1)
  const MAX_RECORDING_TIME = 30000;
  let recordingStartTime = 0;
  
  let speechStartTime = 0;

  async function startRecording() {
    if (!stream) {
      try {
        console.log("[GROQ-STT] 🔌 Requesting microphone access...");
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log("[GROQ-STT] ✅ Microphone access granted");
      } catch (err) {
        console.error("[GROQ-STT] ❌ Microphone denied:", err);
        onError("Microphone access denied");
        return;
      }
    }

    const options = { mimeType: 'audio/webm;codecs=opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options.mimeType = 'audio/ogg;codecs=opus';
    }

    console.log(`[GROQ-STT] 🎙️ Starting MediaRecorder (${options.mimeType})`);
    mediaRecorder = new MediaRecorder(stream, options);
    recordingStartTime = Date.now();
    
    mediaRecorder.ondataavailable = (event) => {
      console.log(`[GROQ-STT] 📊 Data available: ${event.data.size} bytes`);
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      console.log(`[GROQ-STT] 🛑 MediaRecorder stopped, chunks collected: ${audioChunks.length}`);
      
      if (audioChunks.length === 0) {
        console.log("[GROQ-STT] ⚠️ No audio chunks, waiting...");
        // Wait for any delayed data
        await new Promise(r => setTimeout(r, 100));
      }
      
      const mimeType = options.mimeType;
      const audioBlob = new Blob(audioChunks, { type: mimeType });
      console.log(`[GROQ-STT] 📦 Audio blob created: ${audioBlob.size} bytes`);
      audioChunks = [];
      
      if (audioBlob.size > 500) { // Lower threshold
        await sendToGroq(audioBlob);
      } else {
        console.log("[GROQ-STT] 🤐 Blob too small, discarding");
        isSendingAudio = false;
        if (isListening) {
          restartRecording();
        }
      }
    };

    mediaRecorder.onerror = (event) => {
      console.error("[GROQ-STT] ❌ MediaRecorder error:", event.error);
    };

    mediaRecorder.start();
    console.log("[GROQ-STT] 🔴 Recording started, setting up VAD...");
    setupVAD();
  }

  function calculateRMS(dataArray: Uint8Array): number {
    // RMS (Root Mean Square) energy calculation for better speech detection
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = dataArray[i] / 255; // Normalize to 0-1
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const db = 20 * Math.log10(Math.max(rms, 0.001)); // Convert to dB
    return db;
  }

  function setupVAD() {
    if (!stream) return;
    
    if (audioContext) audioContext.close();
    audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512; // Larger FFT for better frequency resolution
    source.connect(analyser);

    processor = audioContext.createScriptProcessor(4096, 1, 1); // Larger buffer for stability
    source.connect(processor);
    processor.connect(audioContext.destination);

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    processor.onaudioprocess = () => {
      if (!isListening || isPaused) return;
      
      // Safety: stop if recording takes too long
      if (Date.now() - recordingStartTime > MAX_RECORDING_TIME) {
        console.log("[GROQ-STT] ⏰ MAX RECORDING TIME REACHED - Force stopping");
        if (mediaRecorder && mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
        return;
      }

      analyser!.getByteFrequencyData(dataArray);
      const energyDb = calculateRMS(dataArray);

      // SPEECH DETECTED
      if (energyDb > SILENCE_THRESHOLD) {
        silenceCounter = 0; // Reset silence counter
        
        if (!speechDetected) {
          speechCounter++;
          if (speechCounter >= SPEECH_COUNT_NEEDED) {
            // Confirmed speech
            speechDetected = true;
            speechStartTime = Date.now();
            console.log(`[GROQ-STT] 🎤 SPEECH DETECTED (energy: ${energyDb.toFixed(1)} dB)`);
            if (onSpeechStart) onSpeechStart();
          }
        } else {
          speechCounter = 0; // Reset once speech is confirmed
        }
      } 
      // SILENCE DETECTED
      else {
        speechCounter = 0; // Reset speech counter
        
        if (speechDetected) {
          silenceCounter++;
          
          // Sustained silence detected → END SPEECH
          if (silenceCounter >= SILENCE_COUNT_NEEDED) {
            const speechDuration = Date.now() - speechStartTime;
            console.log(`[GROQ-STT] ⏱ SILENCE DETECTED (${silenceCounter} chunks, speech: ${speechDuration}ms, energy: ${energyDb.toFixed(1)} dB)`);
            
            if (!isSendingAudio) {
              isSendingAudio = true;
              console.log("[GROQ-STT] 🛑 END OF SPEECH - Stopping microphone");
              
              if (onSpeechEnd) onSpeechEnd();
              
              // FORCE STOP RECORDING
              if (mediaRecorder && mediaRecorder.state === "recording") {
                console.log("[GROQ-STT] 📛 Forcing mediaRecorder to STOP");
                mediaRecorder.stop();
              }
              
              speechDetected = false;
              silenceCounter = 0;
              speechCounter = 0;
            }
          }
        }
      }
    };
  }

  function restartRecording() {
    if (!isListening) {
      console.log("[GROQ-STT] ⏸️ Not listening, skipping restart");
      return;
    }
    
    console.log("[GROQ-STT] 🔄 Restarting recording for next speech...");
    
    // Clean up old processor
    if (processor) {
      try {
        processor.disconnect();
      } catch (e) {
        console.log("[GROQ-STT] Could not disconnect processor:", e);
      }
      processor = null;
    }
    
    // Wait a bit, then restart
    setTimeout(() => {
      if (isListening && !isPaused) {
        console.log("[GROQ-STT] 🔴 Starting new recording session");
        startRecording();
      }
    }, 300);
  }

  async function sendToGroq(blob: Blob) {
    if (blob.size < 500) {
      console.log("[GROQ-STT] 🤐 Blob too small, discarding");
      isSendingAudio = false;
      if (isListening) restartRecording();
      return;
    }

    const formData = new FormData();
    const extension = blob.type.includes("ogg") ? "ogg" : "webm";
    formData.append("audio", blob, `audio.${extension}`);

    try {
      console.log("[GROQ-STT] 📤 Sending audio to Groq API...");
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData
      });

      const data = await readJsonResponse<TranscriptionResponse>(response);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      const text = data.text?.trim();
      
      if (text && text.length > 1) {
        console.log(`[GROQ-STT] ✅ TRANSCRIPTION: "${text}"`);
        onTranscript(text); // Send to AI
      } else {
        console.log("[GROQ-STT] ⚠️ Empty transcription result");
      }
    } catch (err: any) {
      console.error("[GROQ-STT] ❌ Groq API ERROR:", err.message);
      onError(`Transcription failed: ${err.message}`);
    } finally {
      // Always restart for next input
      isSendingAudio = false;
      if (isListening && !isPaused) {
        console.log("[GROQ-STT] 🔄 Ready for next input");
        restartRecording();
      }
    }
  }

  return {
    start() {
      console.log("[GROQ-STT] 🎙️🟢 STARTING SPEECH-TO-TEXT");
      isListening = true;
      isPaused = false;
      isSendingAudio = false;
      speechDetected = false;
      silenceCounter = 0;
      speechCounter = 0;
      audioChunks = [];
      startRecording();
    },
    
    stop() {
      console.log("[GROQ-STT] 🛑🔴 STOPPING SPEECH-TO-TEXT");
      isListening = false;
      isSendingAudio = false;
      speechDetected = false;
      
      // Stop mediaRecorder
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        console.log("[GROQ-STT] Stopping mediaRecorder");
        mediaRecorder.stop();
        mediaRecorder = null;
      }
      
      // Stop processor
      if (processor) {
        try {
          processor.disconnect();
        } catch (e) {
          console.log("[GROQ-STT] Could not disconnect processor");
        }
        processor = null;
      }
      
      // Close audio context
      if (audioContext && audioContext.state !== "closed") {
        console.log("[GROQ-STT] Closing audio context");
        audioContext.close();
        audioContext = null;
      }
      
      // Stop microphone stream
      if (stream) {
        console.log("[GROQ-STT] Stopping microphone stream");
        stream.getTracks().forEach(track => {
          track.stop();
        });
        stream = null;
      }
      
      audioChunks = [];
    },
    
    pause() {
      console.log("[GROQ-STT] ⏸️ PAUSING (AI is speaking)");
      isPaused = true;
    },
    
    resume() {
      console.log("[GROQ-STT] ▶️ RESUMING (ready for next input)");
      isPaused = false;
      silenceCounter = 0;
      speechDetected = false;
      speechCounter = 0;
    }
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

interface TranscriptionResponse {
  text?: string;
  error?: string;
  no_speech_prob?: number | null;
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const body = await response.text();
  if (!body.trim()) {
    throw new Error(`Empty response from transcription server (${response.status})`);
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    const preview = body.replace(/\s+/g, " ").trim().slice(0, 120);
    throw new Error(
      preview
        ? `Transcription server returned non-JSON response (${response.status}): ${preview}`
        : `Transcription server returned invalid JSON (${response.status})`
    );
  }
}

/**
 * Records complete utterances using browser-side voice activity detection.
 * Transcription is delegated to the local backend so provider credentials
 * never enter the browser bundle.
 */
export function createGroqVoiceInput(
  onTranscript: (text: string) => void,
  onError: (msg: string) => void,
  onSpeechStart?: () => void,
  onSpeechEnd?: () => void,
  onTranscriptionComplete?: () => void
): VoiceInput {
  const config = {
    calibrationMs: 650,
    speechStartMarginDb: 13,
    speechContinueMarginDb: 3,
    speechReleaseDropDb: 24,
    deepSilenceMarginDb: 2,
    speechStartConfirmMs: 170,
    endOfSpeechMs: 600,
    deepSilenceToSubmitMs: 420,
    minimumSpeechMs: 260,
    noSpeechProbabilityLimit: 0.72,
    maxUtteranceMs: 20000,
    minimumBlobBytes: 800,
  };

  let stream: MediaStream | null = null;
  let audioContext: AudioContext | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let analyser: AnalyserNode | null = null;
  let animationFrame: number | null = null;
  let recorder: MediaRecorder | null = null;
  let audioChunks: Blob[] = [];
  let shouldListen = false;
  let paused = false;
  let transcribing = false;
  let speechDetected = false;
  let speechStartedAt = 0;
  let speechPeakDb = -100;
  let lastVoiceActivityAt = 0;
  let aboveThresholdAt: number | null = null;
  let silenceStartedAt: number | null = null;
  let deepSilenceStartedAt: number | null = null;
  let noiseFloorDb = -45;
  let calibrationUntil = 0;
  let sessionId = 0;
  let finalizing = false;
  const discardedRecorders = new WeakSet<MediaRecorder>();

  function chooseMimeType(): string {
    const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
    return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  }

  function calculateDb(samples: Float32Array): number {
    let sum = 0;
    for (const sample of samples) sum += sample * sample;
    const rms = Math.sqrt(sum / samples.length);
    return 20 * Math.log10(Math.max(rms, 0.00001));
  }

  function updateNoiseFloor(levelDb: number): void {
    const alpha = levelDb > noiseFloorDb ? 0.18 : 0.06;
    noiseFloorDb = Math.min(-20, noiseFloorDb + (levelDb - noiseFloorDb) * alpha);
  }

  function isMeaningfulTranscript(text: string, noSpeechProbability?: number | null): boolean {
    if (noSpeechProbability !== undefined && noSpeechProbability !== null &&
        noSpeechProbability >= config.noSpeechProbabilityLimit) {
      return false;
    }
    const spokenContent = text.replace(/[^\p{L}\p{N}]+/gu, "").trim();
    return spokenContent.length > 0;
  }

  function resetSpeechState(): void {
    speechDetected = false;
    speechStartedAt = 0;
    speechPeakDb = -100;
    lastVoiceActivityAt = 0;
    aboveThresholdAt = null;
    silenceStartedAt = null;
    deepSilenceStartedAt = null;
  }

  async function transcribe(blob: Blob, requestSession: number): Promise<void> {
    if (blob.size < config.minimumBlobBytes || requestSession !== sessionId) {
      if (requestSession === sessionId && !paused && shouldListen) {
        onTranscriptionComplete?.();
      }
      return;
    }

    transcribing = true;
    try {
      const formData = new FormData();
      const extension = blob.type.includes("ogg") ? "ogg" : "webm";
      formData.append("audio", blob, `utterance.${extension}`);
      const response = await fetch("/api/transcribe", { method: "POST", body: formData });
      const data = await readJsonResponse<TranscriptionResponse>(response);

      if (!response.ok) {
        throw new Error(data.error || `Transcription request failed (${response.status})`);
      }

      if (requestSession !== sessionId || paused || !shouldListen) return;
      const text = data.text?.trim() || "";
      if (text && isMeaningfulTranscript(text, data.no_speech_prob)) {
        console.log(`[GROQ-STT] Transcript: "${text}"`);
        onTranscript(text);
      } else {
        console.log("[GROQ-STT] Ignored silence or non-speech transcription.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown transcription failure";
      console.error("[GROQ-STT] Transcription failed:", message);
      if (requestSession === sessionId) onError(`Transcription failed: ${message}`);
    } finally {
      transcribing = false;
      finalizing = false;
      if (requestSession === sessionId && !paused && shouldListen) {
        onTranscriptionComplete?.();
      }
    }
  }

  function startCapture(): boolean {
    if (!stream || paused || !shouldListen || transcribing || recorder !== null) return false;
    audioChunks = [];
    finalizing = false;

    const mimeType = chooseMimeType();
    recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    const activeRecorder = recorder;
    const captureSession = sessionId;

    activeRecorder.ondataavailable = (event) => {
      if (event.data.size <= 0) return;
      audioChunks.push(event.data);
    };
    activeRecorder.onerror = () => onError("Microphone recording failed.");
    activeRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: activeRecorder.mimeType || mimeType || "audio/webm" });
      audioChunks = [];
      if (recorder === activeRecorder) recorder = null;

      if (captureSession !== sessionId || discardedRecorders.has(activeRecorder) || paused || !shouldListen) {
        return;
      }
      void transcribe(blob, captureSession);
    };
    activeRecorder.start(50);
    return true;
  }

  function stopCurrentRecording(discard: boolean): void {
    if (discard && recorder) discardedRecorders.add(recorder);
    if (!discard) finalizing = true;
    if (recorder?.state === "recording") recorder.stop();
  }

  function monitorVoiceActivity(): void {
    if (!analyser) return;
    const samples = new Float32Array(analyser.fftSize);

    const update = () => {
      animationFrame = requestAnimationFrame(update);
      if (!shouldListen || paused || transcribing || finalizing || !analyser) return;

      analyser.getFloatTimeDomainData(samples);
      const now = performance.now();
      const levelDb = calculateDb(samples);
      const startThreshold = noiseFloorDb + config.speechStartMarginDb;

      if (!speechDetected) {
        if (now < calibrationUntil) {
          updateNoiseFloor(levelDb);
          return;
        }
        if (levelDb > startThreshold) {
          if (aboveThresholdAt === null) {
            if (!startCapture()) return;
            aboveThresholdAt = now;
          }
          if (now - aboveThresholdAt >= config.speechStartConfirmMs) {
            speechDetected = true;
            speechStartedAt = now;
            speechPeakDb = levelDb;
            lastVoiceActivityAt = now;
            silenceStartedAt = null;
            deepSilenceStartedAt = null;
            console.log(`[GROQ-STT] Speech started (${levelDb.toFixed(1)} dB, noise ${noiseFloorDb.toFixed(1)} dB)`);
            onSpeechStart?.();
          }
        } else {
          if (aboveThresholdAt !== null && recorder?.state === "recording") {
            stopCurrentRecording(true);
          }
          aboveThresholdAt = null;
          updateNoiseFloor(levelDb);
        }
        return;
      }

      if (now - speechStartedAt >= config.maxUtteranceMs) {
        console.log("[GROQ-STT] Maximum utterance duration reached; submitting audio.");
        onSpeechEnd?.();
        stopCurrentRecording(false);
        return;
      }

      speechPeakDb = Math.max(levelDb, speechPeakDb - 0.14);
      const continuingVoiceThreshold = Math.max(
        noiseFloorDb + config.speechContinueMarginDb,
        speechPeakDb - config.speechReleaseDropDb
      );
      const deepSilenceThreshold = noiseFloorDb + config.deepSilenceMarginDb;

      if (levelDb > continuingVoiceThreshold) {
        lastVoiceActivityAt = now;
        silenceStartedAt = null;
        deepSilenceStartedAt = null;
      } else {
        silenceStartedAt ??= now;
        if (levelDb <= deepSilenceThreshold) {
          deepSilenceStartedAt ??= now;
        } else {
          deepSilenceStartedAt = null;
        }
        const silenceDuration = now - silenceStartedAt;
        const deepSilenceDuration = deepSilenceStartedAt === null ? 0 : now - deepSilenceStartedAt;
        const timeSinceVoice = now - lastVoiceActivityAt;
        if (
          (timeSinceVoice >= config.endOfSpeechMs ||
            deepSilenceDuration >= config.deepSilenceToSubmitMs) &&
          now - speechStartedAt >= config.minimumSpeechMs
        ) {
          console.log(
            `[GROQ-STT] Speech ended after ${Math.round(timeSinceVoice)} ms without voice ` +
            `(silence: ${Math.round(silenceDuration)} ms, deep: ${Math.round(deepSilenceDuration)} ms).`
          );
          onSpeechEnd?.();
          stopCurrentRecording(false);
        }
      }
    };

    update();
  }

  async function openMicrophone(): Promise<void> {
    if (stream || paused || !shouldListen) return;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
        },
      });
      if (paused || !shouldListen) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
        return;
      }
      audioContext = new AudioContext();
      source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.2;
      source.connect(analyser);
      calibrationUntil = performance.now() + config.calibrationMs;
      monitorVoiceActivity();
      console.log("[GROQ-STT] Microphone listening with local VAD.");
    } catch {
      onError("Microphone access denied. Please allow microphone access in browser settings.");
      shouldListen = false;
    }
  }

  function releaseMicrophone(): void {
    stopCurrentRecording(true);
    if (animationFrame !== null) cancelAnimationFrame(animationFrame);
    animationFrame = null;
    source?.disconnect();
    source = null;
    analyser = null;
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    if (audioContext && audioContext.state !== "closed") void audioContext.close();
    audioContext = null;
    resetSpeechState();
  }

  return {
    start() {
      shouldListen = true;
      paused = false;
      sessionId++;
      void openMicrophone();
    },
    stop() {
      shouldListen = false;
      paused = false;
      sessionId++;
      releaseMicrophone();
    },
    pause() {
      if (paused) return;
      paused = true;
      sessionId++;
      releaseMicrophone();
    },
    resume() {
      if (!shouldListen || !paused) return;
      paused = false;
      sessionId++;
      void openMicrophone();
    },
  };
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
      console.log(" [AUDIO] Queue finished, all audio played");
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
        console.log(" [AUDIO] Resuming AudioContext (autoplay policy)");
        await audioCtx.resume();
      }

      try {
        console.log(`[AUDIO] Decoding Base64 (${base64.length} chars)...`);
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        
        const audioBuffer = await audioCtx.decodeAudioData(bytes.buffer.slice(0));
        console.log(` [AUDIO] Decoded successfully (${audioBuffer.duration.toFixed(2)}s)`);
        
        queue.push(audioBuffer);
        console.log(` [AUDIO] Queue length: ${queue.length}`);
        
        if (!isPlaying) {
          console.log("  [AUDIO] Starting playback");
          playNext();
        }
      } catch (err) {
        console.error(" [AUDIO] Decode error:", err);
        // Skip bad audio, continue
        if (!isPlaying && queue.length > 0) playNext();
      }
    },

    stop() {
      console.log("  [AUDIO] Stopping playback");
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
