// Procedural Web Audio Synthesizer + Upbeat Cozy Looping Soundtrack

class ChiptuneAudio {
  private ctx: AudioContext | null = null;
  private bgmBus: GainNode | null = null;
  private muted: boolean = false;
  private bgmMuted: boolean = false;
  private bgmTimer: number | null = null;
  private bgmStep: number = 0;
  private voiceDucking: boolean = false;
  private listenersBound: boolean = false;

  // Cheerful 64-step cozy adventure melody (C major -> F -> G -> Am -> F -> G -> C)
  private readonly melodyNotes: number[] = [
    // Section A (Bright & bouncy)
    523.25, 659.25, 783.99, 659.25, 880.0, 783.99, 659.25, 523.25,
    587.33, 698.46, 880.0, 783.99, 698.46, 659.25, 587.33, 0,
    523.25, 659.25, 783.99, 1046.5, 987.77, 880.0, 783.99, 659.25,
    698.46, 659.25, 587.33, 659.25, 523.25, 0, 659.25, 0,
    // Section B (Warm romantic lift)
    880.0, 880.0, 1046.5, 880.0, 783.99, 659.25, 783.99, 0,
    698.46, 698.46, 880.0, 783.99, 659.25, 587.33, 659.25, 0,
    523.25, 587.33, 659.25, 783.99, 880.0, 987.77, 1046.5, 880.0,
    783.99, 698.46, 659.25, 587.33, 523.25, 0, 523.25, 0,
  ];

  private readonly bassNotes: number[] = [
    // Section A
    130.81, 0, 196.0, 0, 130.81, 0, 196.0, 0,
    174.61, 0, 220.0, 0, 196.0, 0, 146.83, 0,
    130.81, 0, 196.0, 0, 220.0, 0, 164.81, 0,
    174.61, 0, 196.0, 0, 130.81, 0, 196.0, 0,
    // Section B
    220.0, 0, 261.63, 0, 164.81, 0, 196.0, 0,
    174.61, 0, 220.0, 0, 146.83, 0, 196.0, 0,
    130.81, 0, 164.81, 0, 174.61, 0, 220.0, 0,
    196.0, 0, 146.83, 0, 130.81, 0, 130.81, 0,
  ];

  private readonly chordRoots: number[] = [
    261.63, 261.63, 349.23, 392.0,
    261.63, 220.0, 349.23, 261.63,
    220.0, 164.81, 349.23, 293.66,
    261.63, 349.23, 392.0, 261.63,
  ];

  private readonly arpNotes: number[] = [
    523.25, 659.25, 783.99, 659.25, 523.25, 659.25, 783.99, 659.25,
    698.46, 880.0, 1046.5, 880.0, 783.99, 987.77, 1174.66, 987.77,
    523.25, 659.25, 783.99, 1046.5, 880.0, 1046.5, 1318.5, 1046.5,
    698.46, 880.0, 783.99, 987.77, 523.25, 659.25, 783.99, 523.25,
    440.0, 523.25, 659.25, 523.25, 392.0, 493.88, 587.33, 493.88,
    349.23, 440.0, 523.25, 440.0, 392.0, 493.88, 587.33, 493.88,
    523.25, 659.25, 783.99, 659.25, 698.46, 880.0, 1046.5, 880.0,
    783.99, 987.77, 1174.66, 987.77, 523.25, 659.25, 783.99, 1046.5,
  ];

  constructor() {
    this.bindAutoUnlock();
  }

  private bindAutoUnlock() {
    if (this.listenersBound || typeof window === 'undefined') return;
    this.listenersBound = true;
    const wake = () => {
      if (!this.muted && !this.bgmMuted) {
        this.unlockAndStartBgm();
      }
    };
    window.addEventListener('pointerdown', wake, { passive: true });
    window.addEventListener('keydown', wake, { passive: true });
    window.addEventListener('touchstart', wake, { passive: true });
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (muted) {
      this.stopBgm();
    } else if (!this.bgmMuted) {
      this.startBgm();
    }
  }

  public setBgmMuted(bgmMuted: boolean) {
    this.bgmMuted = bgmMuted;
    if (bgmMuted) {
      this.stopBgm();
    } else if (!this.muted) {
      this.startBgm();
    }
  }

  public setVoiceDucking(ducking: boolean) {
    this.voiceDucking = ducking;
    if (this.bgmBus && this.ctx) {
      this.bgmBus.gain.setTargetAtTime(ducking ? 0.3 : 1.0, this.ctx.currentTime, 0.08);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        const compressor = this.ctx.createDynamicsCompressor();
        compressor.threshold.value = -14;
        compressor.ratio.value = 4;
        compressor.connect(this.ctx.destination);

        this.bgmBus = this.ctx.createGain();
        this.bgmBus.gain.value = this.voiceDucking ? 0.3 : 1.0;
        this.bgmBus.connect(compressor);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlockAndStartBgm() {
    if (this.muted || this.bgmMuted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        if (this.bgmTimer === null && !this.muted && !this.bgmMuted) {
          this.startBgm();
        }
      }).catch(() => {});
    }
    if (this.bgmTimer === null) {
      this.startBgm();
    }
  }

  public startBgm() {
    if (this.muted || this.bgmMuted) return;
    if (this.bgmTimer !== null) return;
    if (typeof window === 'undefined') return;

    const stepMs = 205; // ~146 BPM eighth-note groove
    this.bgmTimer = window.setInterval(() => {
      if (this.muted || this.bgmMuted) return;
      const ctx = this.ensureContext();
      if (!ctx || ctx.state !== 'running') return;

      const idx = this.bgmStep % this.melodyNotes.length;

      // 1. Bright lead melody
      const mel = this.melodyNotes[idx];
      if (mel > 0) {
        this.playBgmNote(ctx, mel, 0.2, 'triangle', 0.14);
        this.playBgmNote(ctx, mel * 2, 0.1, 'sine', 0.032);
      }

      // 2. Warm chord pad every 4 steps
      if (idx % 4 === 0) {
        const root = this.chordRoots[Math.floor(idx / 4) % this.chordRoots.length];
        this.playBgmNote(ctx, root, 0.72, 'sine', 0.055);
        this.playBgmNote(ctx, root * 1.25, 0.72, 'sine', 0.042);
      }

      // 3. Punchy bassline
      const bass = this.bassNotes[idx];
      if (bass > 0) {
        this.playBgmNote(ctx, bass, 0.22, 'triangle', 0.15);
      }

      // 4. Sparkly offbeat arpeggio
      const arp = this.arpNotes[idx];
      if (arp > 0 && idx % 2 === 1) {
        this.playBgmNote(ctx, arp, 0.12, 'sine', 0.05);
      }

      // 5. Light chiptune percussion kick / hi-hat pulse
      if (idx % 4 === 0) {
        this.playKick(ctx);
      } else if (idx % 2 === 1) {
        this.playHat(ctx);
      }

      this.bgmStep = (this.bgmStep + 1) % this.melodyNotes.length;
    }, stepMs);
  }

  public stopBgm() {
    if (this.bgmTimer !== null && typeof window !== 'undefined') {
      window.clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  private playKick(ctx: AudioContext) {
    const dest = this.bgmBus || ctx.destination;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(48, now + 0.09);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  private playHat(ctx: AudioContext) {
    const dest = this.bgmBus || ctx.destination;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(4200, now);
    gain.gain.setValueAtTime(0.016, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.03);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  private playBgmNote(
    ctx: AudioContext,
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ) {
    const dest = this.bgmBus || ctx.destination;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'square',
    volume: number = 0.12,
    delay: number = 0
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playJump(isGirl: boolean, isDouble = false) {
    const mult = isDouble ? 1.28 : 1;
    if (isGirl) {
      this.playTone(360 * mult, 680 * mult, 0.14, 'triangle', 0.15);
    } else {
      this.playTone(280 * mult, 540 * mult, 0.14, 'square', 0.1);
    }
  }

  public playWallJump(isGirl: boolean) {
    if (isGirl) {
      this.playTone(440, 780, 0.13, 'triangle', 0.14);
    } else {
      this.playTone(340, 640, 0.13, 'square', 0.095);
    }
  }

  public playBounce() {
    this.playTone(280, 740, 0.16, 'triangle', 0.14, 0);
    this.playTone(460, 920, 0.14, 'sine', 0.11, 0.05);
  }

  public playCoin() {
    this.playTone(987.77, 1318.5, 0.1, 'square', 0.08, 0);
  }

  public playCollect() {
    this.playTone(659.25, 659.25, 0.09, 'square', 0.1, 0);
    this.playTone(987.77, 1318.5, 0.2, 'triangle', 0.14, 0.06);
  }

  public playCheckpoint() {
    this.playTone(523.25, 523.25, 0.1, 'triangle', 0.12, 0);
    this.playTone(783.99, 1046.5, 0.2, 'triangle', 0.13, 0.07);
  }

  public playSwitchPress() {
    this.playTone(440, 554.37, 0.08, 'square', 0.09, 0);
  }

  public playLever() {
    this.playTone(300, 520, 0.09, 'square', 0.095, 0);
    this.playTone(520, 660, 0.08, 'triangle', 0.11, 0.06);
  }

  public playPlateDown() {
    this.playTone(480, 640, 0.08, 'triangle', 0.1, 0);
  }

  public playCratePush() {
    this.playTone(130, 110, 0.06, 'triangle', 0.07, 0);
  }

  public playBridgeOpen() {
    this.playTone(523.25, 523.25, 0.11, 'triangle', 0.12, 0);
    this.playTone(659.25, 659.25, 0.11, 'triangle', 0.12, 0.07);
    this.playTone(783.99, 1046.5, 0.22, 'triangle', 0.14, 0.14);
  }

  public playBonk() {
    this.playTone(240, 95, 0.18, 'sawtooth', 0.1, 0);
    this.playTone(310, 140, 0.12, 'square', 0.07, 0.04);
  }

  public playSplash() {
    this.playTone(320, 110, 0.2, 'triangle', 0.12, 0);
    this.playTone(220, 70, 0.22, 'sine', 0.11, 0.05);
  }

  public playTug() {
    this.playTone(520, 680, 0.08, 'sine', 0.07, 0);
  }

  public playWardrobe() {
    this.playTone(523.25, 523.25, 0.07, 'triangle', 0.11, 0);
    this.playTone(659.25, 659.25, 0.07, 'triangle', 0.11, 0.06);
    this.playTone(783.99, 783.99, 0.12, 'triangle', 0.12, 0.12);
  }

  public playVictory() {
    const notes = [
      { f: 523.25, d: 0.11, t: 0.0 },
      { f: 659.25, d: 0.11, t: 0.11 },
      { f: 783.99, d: 0.11, t: 0.22 },
      { f: 1046.5, d: 0.24, t: 0.33 },
      { f: 880.0, d: 0.11, t: 0.57 },
      { f: 1046.5, d: 0.36, t: 0.68 },
    ];
    notes.forEach((n) => {
      this.playTone(n.f, n.f, n.d, 'triangle', 0.15, n.t);
      this.playTone(n.f * 0.5, n.f * 0.5, n.d, 'sine', 0.09, n.t);
    });
  }
}

export const soundFX = new ChiptuneAudio();
