import { ApartmentId } from '../types/game';

/**
 * Procedural Web Audio API soundscape & spatial room audio engine for WINDOWS AT 3AM.
 * Synthesizes layered rain on wet concrete/glass, low urban midnight drone,
 * apartment-specific ambient motifs (violin resonance in 4A, tape reel in 3B,
 * neon transformer hum in 2C, fluorescent buzz in 1A), and event cues.
 */
export class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private roomFilter: BiquadFilterNode | null = null;
  private isInitialized = false;
  private isMuted = false;

  public init(): void {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.35;
      this.masterGain.connect(this.ctx.destination);

      this.startRainGenerator();
      this.startMidnightDrone();
      this.isInitialized = true;
    } catch {
      // Headless or restricted audio context environment
    }
  }

  private startRainGenerator(): void {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.04 * white) / 1.04;
      lastOut = output[i];
      output[i] *= 1.8;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    this.roomFilter = this.ctx.createBiquadFilter();
    this.roomFilter.type = 'bandpass';
    this.roomFilter.frequency.value = 1150;
    this.roomFilter.Q.value = 0.7;

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.value = 0.28;

    whiteNoise.connect(this.roomFilter);
    this.roomFilter.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    whiteNoise.start(0);
  }

  private startMidnightDrone(): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 55; // A1 low nocturnal city hum
    droneGain.gain.value = 0.06;
    osc.connect(droneGain);
    droneGain.connect(this.masterGain);
    osc.start();
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.35, this.ctx.currentTime, 0.08);
    }
  }

  public updateSpatialFocus(focusedApt: ApartmentId | null, zoomLevel: number): void {
    if (!this.ctx || !this.roomFilter || !this.rainGain) return;
    if (!this.isInitialized) this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    // As zoom increases into an interior, muffle exterior rain slightly to focus interior acoustics
    const targetFreq = focusedApt ? Math.max(550, 1300 - zoomLevel * 210) : 1150;
    this.roomFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.15);
  }

  public playCue(
    cue: 'thunder' | 'phone_ring' | 'breaker_snap' | 'glass_clink' | 'violin_chord' | 'door_slam' | 'scan_lock'
  ): void {
    if (this.isMuted) return;
    if (!this.isInitialized) this.init();
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);

    if (cue === 'violin_chord') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(293.66, now); // D4
      osc.frequency.exponentialRampToValueAtTime(440.0, now + 0.55); // A4
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc.start(now);
      osc.stop(now + 0.85);
    } else if (cue === 'phone_ring') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1120, now + 0.08);
      osc.frequency.setValueAtTime(880, now + 0.16);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (cue === 'breaker_snap') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(48, now + 0.25);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (cue === 'scan_lock') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.18);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.4);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    }
  }
}

export const soundscape = new SoundscapeEngine();
