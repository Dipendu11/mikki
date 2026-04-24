/**
 * Utility to play 16-bit PCM audio chunks at 24kHz with gapless queuing.
 */
export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private sampleRate: number = 24000;
  private nextStartTime: number = 0;
  private isPlaying: boolean = false;

  constructor() {
    this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
    this.gainNode = this.audioContext.createGain();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
  }

  /**
   * Adds a base64 encoded PCM16 chunk to the playback queue.
   */
  async playChunk(base64Data: string) {
    if (!this.audioContext || !this.gainNode) return;

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const arrayBuffer = this.base64ToArrayBuffer(base64Data);
    const float32Data = this.pcm16ToFloat32(arrayBuffer);
    
    const audioBuffer = this.audioContext.createBuffer(1, float32Data.length, this.sampleRate);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.gainNode);

    // Gapless playback logic
    const currentTime = this.audioContext.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime;
    }

    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.isPlaying = true;

    source.onended = () => {
      if (this.audioContext && this.audioContext.currentTime >= this.nextStartTime - 0.01) {
        this.isPlaying = false;
      }
    };
  }

  /**
   * Clears the current playback queue and stops all audio.
   * Called when an interruption (barge-in) is detected.
   */
  stop() {
    if (!this.audioContext) return;
    
    this.audioContext.close();
    this.audioContext = new AudioContext({ sampleRate: this.sampleRate });
    this.gainNode = this.audioContext.createGain();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    
    this.nextStartTime = 0;
    this.isPlaying = false;
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private pcm16ToFloat32(buffer: ArrayBuffer): Float32Array {
    const int16Array = new Int16Array(buffer);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32Array[i] = int16Array[i] / 32768;
    }
    return float32Array;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }
}
