/**
 * Water droplet chime synthesizer using Web Audio API
 * Produces a gentle, crystal-clear water drop acoustic sound.
 */

class WaterSoundSynthesizer {
  private ctx: AudioContext | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
      return null;
    }
  }

  /**
   * Play a peaceful, soothing 2-tone water drop chime
   */
  public playWaterChime(): void {
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Primary tone: quick upward pitch bend like a water droplet plop
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(600, now);
      osc1.frequency.exponentialRampToValueAtTime(1180, now + 0.08);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.28);

      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.linearRampToValueAtTime(0.28, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.52);

      // Secondary harmonic shimmer (higher crystal ripple)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1320, now + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.2);
      osc2.frequency.exponentialRampToValueAtTime(1400, now + 0.45);

      gain2.gain.setValueAtTime(0.0001, now);
      gain2.gain.setValueAtTime(0.0001, now + 0.08);
      gain2.gain.linearRampToValueAtTime(0.12, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc2.start(now + 0.08);
      osc2.stop(now + 0.58);
    } catch (err) {
      console.warn('Could not play water chime sound', err);
    }
  }
}

export const waterSound = new WaterSoundSynthesizer();
