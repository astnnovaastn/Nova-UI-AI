class AstraPcmCaptureProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.targetRate = options.processorOptions?.targetSampleRate || 16000;
    this.chunkMs = options.processorOptions?.chunkMs || 40;
    this.pending = [];
    this.phase = 0;
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) return true;
    const ratio = sampleRate / this.targetRate;
    while (this.phase < input.length) {
      const left = Math.floor(this.phase);
      const right = Math.min(left + 1, input.length - 1);
      const mix = this.phase - left;
      this.pending.push(input[left] + (input[right] - input[left]) * mix);
      this.phase += ratio;
    }
    this.phase -= input.length;

    const chunkSize = Math.round(this.targetRate * this.chunkMs / 1000);
    while (this.pending.length >= chunkSize) {
      const pcm = new Int16Array(chunkSize);
      for (let index = 0; index < chunkSize; index += 1) {
        const sample = Math.max(-1, Math.min(1, this.pending[index]));
        pcm[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      }
      this.pending.splice(0, chunkSize);
      this.port.postMessage(pcm.buffer, [pcm.buffer]);
    }
    return true;
  }
}

registerProcessor("astra-pcm-capture", AstraPcmCaptureProcessor);
