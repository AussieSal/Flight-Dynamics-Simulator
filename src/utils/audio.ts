// Web Audio API procedural sound engine for jet aircraft
class FlightAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private engineGain: GainNode | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private stallGain: GainNode | null = null;
  private stallOsc: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;
  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Jet Engine Turbofan synthesis (rumble + whine)
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      this.engineGain.connect(this.masterGain);

      // Jet Engine low turbine rumble
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(80, this.ctx.currentTime);
      const lowpass = this.ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(160, this.ctx.currentTime);
      this.engineOsc1.connect(lowpass);
      lowpass.connect(this.engineGain);
      this.engineOsc1.start();

      // Jet Engine compressor blade whine
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'sine';
      this.engineOsc2.frequency.setValueAtTime(320, this.ctx.currentTime);
      const whineGain = this.ctx.createGain();
      whineGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      this.engineOsc2.connect(whineGain);
      whineGain.connect(this.engineGain);
      this.engineOsc2.start();

      // Aerodynamic wind noise (procedural white noise through bandpass)
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.frequency.setValueAtTime(600, this.ctx.currentTime);
      this.windFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.05, this.ctx.currentTime);

      whiteNoise.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.masterGain);
      whiteNoise.start();

      // Stall warning buzzer
      this.stallOsc = this.ctx.createOscillator();
      this.stallOsc.type = 'square';
      this.stallOsc.frequency.setValueAtTime(750, this.ctx.currentTime);
      this.stallGain = this.ctx.createGain();
      this.stallGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.stallOsc.connect(this.stallGain);
      this.stallGain.connect(this.masterGain);
      this.stallOsc.start();

      this.isInitialized = true;
    } catch {
      // AudioContext unavailable or restricted
    }
  }

  public update(throttle: number, airspeed: number, isStalled: boolean) {
    if (!this.ctx || !this.isInitialized) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;

    // Pitch & spool of jet engines based on throttle & airspeed
    if (this.engineOsc1 && this.engineOsc2 && this.engineGain) {
      const baseFreq = 60 + throttle * 70; // 60Hz to 130Hz
      const whineFreq = 260 + throttle * 480; // 260Hz to 740Hz
      this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.2);
      this.engineOsc2.frequency.setTargetAtTime(whineFreq, t, 0.25);
      
      const targetEngVol = this.isMuted ? 0 : 0.08 + throttle * 0.18;
      this.engineGain.gain.setTargetAtTime(targetEngVol, t, 0.15);
    }

    // Wind rush tied to airspeed (m/s)
    if (this.windFilter && this.windGain) {
      const speedNorm = Math.min(Math.max((airspeed - 50) / 250, 0), 1.5);
      const windFreq = 400 + speedNorm * 1200;
      this.windFilter.frequency.setTargetAtTime(windFreq, t, 0.2);
      const targetWindVol = this.isMuted ? 0 : speedNorm * 0.15;
      this.windGain.gain.setTargetAtTime(targetWindVol, t, 0.2);
    }

    // Stall horn warning
    if (this.stallGain) {
      const targetStallVol = (!this.isMuted && isStalled) ? 0.22 : 0;
      this.stallGain.gain.setTargetAtTime(targetStallVol, t, 0.05);
    }
  }

  public playClick() {
    if (!this.ctx || this.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(400, t + 0.04);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch {
      // Audio context error ignore
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.3, this.ctx.currentTime, 0.1);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const flightAudio = new FlightAudioEngine();
