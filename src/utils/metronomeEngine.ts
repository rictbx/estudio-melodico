/**
 * MetronomeEngine - Precision AudioMetronome powered by Web Audio API
 * Rigorously synchronized using (60 / bpm) * 1000 ms time intervals
 */

class MetronomeEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private bpm: number = 120;
  private beatsPerMeasure: number = 4;
  private currentBeat: number = 0;
  private nextNoteTime: number = 0;
  private timerId: number | null = null;
  private onBeatCallback: ((beatIndex: number) => void) | null = null;
  private stateListeners: Set<(isRunning: boolean) => void> = new Set();
  private volume: number = 0.8;

  // Lookahead settings for high accuracy
  private lookaheadMs: number = 25;
  private scheduleAheadSec: number = 0.1;

  public subscribe(listener: (isRunning: boolean) => void) {
    this.stateListeners.add(listener);
    // Call immediately with current state
    listener(this.isRunning);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.stateListeners.forEach((fn) => fn(this.isRunning));
  }

  private initContext() {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Plays a single short audio click using Web Audio API
   */
  public playClick(time?: number, isAccent: boolean = false) {
    this.initContext();
    if (!this.ctx) return;

    const playTime = time ?? this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // High crisp click sound (1200Hz for Beat 1 accent, 800Hz for standard beat)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isAccent ? 1200 : 800, playTime);

    // Envelope: Sharp attack, exponential decay (35ms duration)
    const baseGain = (isAccent ? 0.85 : 0.6) * this.volume;
    gain.gain.setValueAtTime(baseGain, playTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, playTime + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(playTime);
    osc.stop(playTime + 0.04);
  }

  /**
   * Advances current beat and schedules next beat time based on (60 / bpm) formula
   */
  private nextNote() {
    // Interval between beats in seconds: (60 / bpm)
    const secondsPerBeat = 60.0 / Math.max(20, Math.min(300, this.bpm));
    this.nextNoteTime += secondsPerBeat;

    this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;
  }

  private scheduler() {
    if (!this.ctx) return;

    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadSec) {
      const beatNum = this.currentBeat;
      const isAccent = beatNum === 0;

      // Schedule Web Audio click
      this.playClick(this.nextNoteTime, isAccent);

      // Trigger UI callback in sync with audio time
      if (this.onBeatCallback) {
        const delayMs = Math.max(0, (this.nextNoteTime - this.ctx.currentTime) * 1000);
        const callback = this.onBeatCallback;
        setTimeout(() => {
          if (this.isRunning && callback) {
            callback(beatNum);
          }
        }, delayMs);
      }

      this.nextNote();
    }

    if (this.isRunning) {
      this.timerId = window.setTimeout(() => this.scheduler(), this.lookaheadMs);
    }
  }

  /**
   * Starts the metronome loop at specified BPM
   */
  public start(bpm: number, beatsPerMeasure: number = 4, onBeat?: (beatIndex: number) => void) {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.bpm = bpm;
    this.beatsPerMeasure = beatsPerMeasure;
    this.onBeatCallback = onBeat || null;
    this.isRunning = true;
    this.notifyListeners();
    this.currentBeat = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;

    this.scheduler();
  }

  /**
   * Dynamically updates BPM while metronome is running
   */
  public setBpm(newBpm: number) {
    this.bpm = Math.max(20, Math.min(300, newBpm));
  }

  public setBeatsPerMeasure(beats: number) {
    this.beatsPerMeasure = Math.max(1, Math.min(16, beats));
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public stop() {
    const wasRunning = this.isRunning;
    this.isRunning = false;
    if (wasRunning) {
      this.notifyListeners();
    }
    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getBpm(): number {
    return this.bpm;
  }
}

export const metronomeEngine = new MetronomeEngine();
