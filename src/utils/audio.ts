// Web Audio API synthesizer for Rest Timer and tactile feedback
// Supports independent persisted preferences for UI sounds and Rest Alarm

type SoundEventListener = (event: 'rest_complete' | 'rest_tick' | 'alert') => void;

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private uiSoundEnabled: boolean = false;
  private alarmSoundEnabled: boolean = true;
  private listeners: Set<SoundEventListener> = new Set();

  constructor() {
    this.loadPreferences();
  }

  private loadPreferences(): void {
    if (typeof window === 'undefined') return;
    try {
      const savedUi = localStorage.getItem('lm_sound_ui_enabled');
      // Default: UI sounds disabled (false) as required
      this.uiSoundEnabled = savedUi === 'true';

      const savedAlarm = localStorage.getItem('lm_sound_alarm_enabled');
      // Default: Rest timer alarm enabled (true) as required
      this.alarmSoundEnabled = savedAlarm !== 'false';
    } catch {
      this.uiSoundEnabled = false;
      this.alarmSoundEnabled = true;
    }
  }

  public isUiSoundEnabled(): boolean {
    return this.uiSoundEnabled;
  }

  public setUiSoundEnabled(enabled: boolean): void {
    this.uiSoundEnabled = enabled;
    try {
      localStorage.setItem('lm_sound_ui_enabled', String(enabled));
    } catch {}
  }

  public isAlarmSoundEnabled(): boolean {
    return this.alarmSoundEnabled;
  }

  public setAlarmSoundEnabled(enabled: boolean): void {
    this.alarmSoundEnabled = enabled;
    try {
      localStorage.setItem('lm_sound_alarm_enabled', String(enabled));
    } catch {}
  }

  public subscribe(listener: SoundEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: 'rest_complete' | 'rest_tick' | 'alert'): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch {}
    });
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Short click / tap sound - only if UI sound is enabled
  public playClick(): void {
    if (!this.uiSoundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // ignore
    }
  }

  // 3-2-1 Countdown tick - obeys alarm preference
  public playTick(pitch = 600): void {
    this.emit('rest_tick');
    if (!this.alarmSoundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // ignore
    }
  }

  // Error / Warning tone
  public playRestAlert(): void {
    this.playAlert();
  }

  public playAlert(): void {
    this.emit('alert');
    if (!this.alarmSoundEnabled && !this.uiSoundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.16, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // ignore
    }
  }

  // Success / Sync complete chime
  public playSuccess(): void {
    if (!this.uiSoundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const chords = [523.25, 659.25, 783.99, 1046.5]; // C Major
      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const startTime = ctx.currentTime + idx * 0.08;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.setValueAtTime(0.18 / (idx + 1), startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.8);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.8);
      });
    } catch {
      // ignore
    }
  }

  // Rest Timer Finished - Chime / Bell + Vibration + Visual Signal
  public playRestComplete(): void {
    // Notify listeners so visual equivalent feedback triggers
    this.emit('rest_complete');

    // Mobile haptic vibration if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([120, 60, 120, 60, 250]);
      } catch {}
    }

    if (!this.alarmSoundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const frequencies = [587.33, 880, 1174.66, 1760]; // D5 major chords
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const startTime = ctx.currentTime + idx * 0.06;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.setValueAtTime(0.22 / (idx + 1), startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 1.2);
      });
    } catch {
      // ignore
    }
  }
}

export const soundFx = new SoundSynthesizer();
