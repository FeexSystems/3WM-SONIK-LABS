export class GeminiLiveAudioStreamer {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private nextPlayTime = 0;

  async init(onAudioChunk: (base64Pcm: string) => void) {
    this.audioContext = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )({
      sampleRate: 24000,
    });

    // 1. Capture microphone input at 16kHz PCM
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const source = this.audioContext.createMediaStreamSource(this.mediaStream);

    const handleChunk = (inputData: Float32Array) => {
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
      }
      const buffer = new Uint8Array(pcm16.buffer);
      let binary = '';
      for (let i = 0; i < buffer.byteLength; i++) {
        binary += String.fromCharCode(buffer[i]);
      }
      onAudioChunk(btoa(binary));
    };

    if (this.audioContext.audioWorklet) {
      try {
        const workletCode = `
          class StreamerWorklet extends AudioWorkletProcessor {
            process(inputs) {
              const input = inputs[0];
              if (input && input[0]) {
                this.port.postMessage(input[0]);
              }
              return true;
            }
          }
          registerProcessor('gemini-streamer-worklet', StreamerWorklet);
        `;
        const blob = new Blob([workletCode], { type: 'application/javascript' });
        const workletUrl = URL.createObjectURL(blob);
        await this.audioContext.audioWorklet.addModule(workletUrl);
        URL.revokeObjectURL(workletUrl);

        const workletNode = new AudioWorkletNode(this.audioContext, 'gemini-streamer-worklet');
        workletNode.port.onmessage = (e: MessageEvent<Float32Array>) => {
          handleChunk(e.data);
        };
        source.connect(workletNode);
        workletNode.connect(this.audioContext.destination);
        return;
      } catch {
        // Fallback to script processor if AudioWorklet registration fails
      }
    }

    const scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
    scriptProcessor.onaudioprocess = (e) => {
      handleChunk(e.inputBuffer.getChannelData(0));
    };
    source.connect(scriptProcessor);
    scriptProcessor.connect(this.audioContext.destination);
  }

  playChunk(base64Pcm: string) {
    if (!this.audioContext) return;
    const binary = atob(base64Pcm);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    const audioBuffer = this.audioContext.createBuffer(1, float32.length, 24000);
    audioBuffer.copyToChannel(float32, 0);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioContext.destination);

    const currentTime = this.audioContext.currentTime;
    if (this.nextPlayTime < currentTime) {
      this.nextPlayTime = currentTime;
    }
    source.start(this.nextPlayTime);
    this.nextPlayTime += audioBuffer.duration;
  }

  stop() {
    this.mediaStream?.getTracks().forEach((t) => t.stop());
    void this.audioContext?.close();
  }
}
