/**
 * VoiceSynthesis.js
 * Text-to-speech functionality for Nova AI responses
 */

class VoiceSynthesis {
  constructor() {
    this.synth = window.speechSynthesis;
    this.isSupported = !!this.synth;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.queue = [];
    this.preferences = {
      rate: 1,
      pitch: 1,
      volume: 0.9,
      voiceIndex: 0
    };
    this.loadPreferences();
  }

  /**
   * Speak a message using Web Speech API
   */
  async speak(text, options = {}) {
    if (!this.isSupported) {
      console.warn('Speech synthesis not supported in this browser');
      return false;
    }

    // Cancel any current speech
    this.cancel();

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Apply settings
      utterance.rate = options.rate || this.preferences.rate;
      utterance.pitch = options.pitch || this.preferences.pitch;
      utterance.volume = options.volume || this.preferences.volume;

      // Set voice if available
      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        const voiceIndex = options.voiceIndex !== undefined ? options.voiceIndex : this.preferences.voiceIndex;
        utterance.voice = voices[Math.min(voiceIndex, voices.length - 1)];
      }

      // Add event listeners
      return new Promise((resolve, reject) => {
        utterance.onstart = () => {
          this.isPlaying = true;
          options.onStart?.();
        };

        utterance.onend = () => {
          this.isPlaying = false;
          options.onEnd?.();
          resolve(true);
        };

        utterance.onerror = (event) => {
          this.isPlaying = false;
          console.error('Speech synthesis error:', event);
          reject(event);
        };

        this.currentUtterance = utterance;
        this.synth.speak(utterance);
      });
    } catch (error) {
      console.error('Error in speech synthesis:', error);
      return false;
    }
  }

  /**
   * Cancel current speech
   */
  cancel() {
    if (this.synth) {
      this.synth.cancel();
      this.isPlaying = false;
    }
  }

  /**
   * Pause speech
   */
  pause() {
    if (this.synth && this.isPlaying) {
      this.synth.pause();
    }
  }

  /**
   * Resume speech
   */
  resume() {
    if (this.synth && this.isPlaying) {
      this.synth.resume();
    }
  }

  /**
   * Get available voices
   */
  getVoices() {
    return this.synth.getVoices();
  }

  /**
   * Set voice preference
   */
  setVoice(voiceIndex) {
    this.preferences.voiceIndex = voiceIndex;
    this.savePreferences();
  }

  /**
   * Set rate (speed) - 0.1 to 10
   */
  setRate(rate) {
    this.preferences.rate = Math.max(0.1, Math.min(10, rate));
    this.savePreferences();
  }

  /**
   * Set pitch - 0 to 2
   */
  setPitch(pitch) {
    this.preferences.pitch = Math.max(0, Math.min(2, pitch));
    this.savePreferences();
  }

  /**
   * Set volume - 0 to 1
   */
  setVolume(volume) {
    this.preferences.volume = Math.max(0, Math.min(1, volume));
    this.savePreferences();
  }

  /**
   * Save preferences to localStorage
   */
  savePreferences() {
    localStorage.setItem('voiceSynthesisPreferences', JSON.stringify(this.preferences));
  }

  /**
   * Load preferences from localStorage
   */
  loadPreferences() {
    const saved = localStorage.getItem('voiceSynthesisPreferences');
    if (saved) {
      this.preferences = JSON.parse(saved);
    }
  }

  /**
   * Check if currently playing
   */
  get isPlaying() {
    return this._isPlaying || false;
  }

  set isPlaying(value) {
    this._isPlaying = value;
  }
}

// Export as singleton
export const voiceSynthesis = new VoiceSynthesis();
export default VoiceSynthesis;
