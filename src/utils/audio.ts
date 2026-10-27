/**
 * Web Audio API procedural sound synthesizer
 * Zero external asset dependencies, zero network latency, 100% reliable.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check localStorage for mute preference
    if (typeof window !== 'undefined') {
      this.isMuted = localStorage.getItem('game_sound_muted') === 'true';
    }
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('game_sound_muted', String(this.isMuted));
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Pleasant success chime when someone guesses correctly
  public playSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.36);
    });
  }

  // Sparkling chime when a gift is received
  public playGift() {
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + idx * 0.06 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + 0.3);
    });
  }

  // Victory fanfare on match completion
  public playVictory() {
    const ctx = this.getContext();
    if (!ctx) return;

    const chords = [
      [523.25, 659.25, 783.99], // C
      [587.33, 739.99, 880.00], // D
      [659.25, 830.61, 987.77], // E
      [783.99, 987.77, 1174.66] // G
    ];

    chords.forEach((chord, step) => {
      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + step * 0.14);

        gain.gain.setValueAtTime(0, ctx.currentTime + step * 0.14);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + step * 0.14 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + step * 0.14 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + step * 0.14);
        osc.stop(ctx.currentTime + step * 0.14 + 0.45);
      });
    });
  }
}

export const soundEffects = new SoundSynthesizer();
