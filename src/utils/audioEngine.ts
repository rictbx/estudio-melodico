import { SequenceNote, WaveformType } from '../types';
import { getDuracaoBeat, getNotePitchInfo } from './musicTheory';

export interface ChordAccompanimentConfig {
  enabled: boolean;
  notes: { pitch: string; freq: number }[];
  rhythmFormula: string;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private activeOscs: OscillatorNode[] = [];
  private isPlaying: boolean = false;
  private currentType: 'escala' | 'progressao' | 'acorde' | null = null;
  private timerId: number | null = null;
  private activeNoteCallback: ((index: number | null) => void) | null = null;

  public setOnActiveNoteChange(cb: ((index: number | null) => void) | null) {
    this.activeNoteCallback = cb;
  }

  private initContext() {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public stop() {
    this.isPlaying = false;
    this.currentType = null;

    if (this.timerId !== null) {
      window.clearTimeout(this.timerId);
      this.timerId = null;
    }

    this.activeOscs.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Ignore already stopped
      }
    });
    this.activeOscs = [];

    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close();
      this.ctx = null;
    }

    if (this.activeNoteCallback) {
      this.activeNoteCallback(null);
    }
  }

  public getCurrentType(): 'escala' | 'progressao' | 'acorde' | null {
    return this.currentType;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public playChord(
    notes: { pitch: string; freq: number }[],
    durationSec: number = 2.0,
    waveform: WaveformType = 'triangle'
  ) {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.isPlaying = true;
    this.currentType = 'acorde';

    const scheduleTime = this.ctx.currentTime;
    const gainVal = 0.15 / Math.max(1, notes.length * 0.4);

    notes.forEach((note) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = waveform;
      osc.frequency.value = note.freq;

      gain.gain.setValueAtTime(gainVal, scheduleTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, scheduleTime + durationSec * 0.95);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(scheduleTime);
      osc.stop(scheduleTime + durationSec);
      this.activeOscs.push(osc);
    });

    this.timerId = window.setTimeout(() => {
      this.stop();
    }, (durationSec + 0.1) * 1000);
  }

  public playScale(
    notes: { pitch: string; freq: number }[],
    bpm: number,
    waveform: WaveformType = 'triangle',
    onComplete?: () => void
  ) {
    if (this.isPlaying && this.currentType === 'escala') {
      this.stop();
      return;
    }

    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.isPlaying = true;
    this.currentType = 'escala';

    const secPerBeat = 60.0 / bpm;
    let currTime = 0;
    const totalDuration = notes.length * secPerBeat;

    notes.forEach((noteItem, i) => {
      if (!this.ctx) return;
      const dur = secPerBeat;
      const scheduleTime = this.ctx.currentTime + currTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = waveform;
      osc.frequency.value = noteItem.freq;

      gain.gain.setValueAtTime(0.25, scheduleTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, scheduleTime + dur * 0.95);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(scheduleTime);
      osc.stop(scheduleTime + dur);
      this.activeOscs.push(osc);

      // Schedule callback for active note
      const delayMs = currTime * 1000;
      setTimeout(() => {
        if (this.isPlaying && this.currentType === 'escala' && this.activeNoteCallback) {
          this.activeNoteCallback(i);
        }
      }, delayMs);

      currTime += dur;
    });

    this.timerId = window.setTimeout(() => {
      this.stop();
      if (onComplete) onComplete();
    }, (totalDuration + 0.1) * 1000);
  }

  public playProgression(
    sequence: SequenceNote[],
    bpm: number,
    waveform: WaveformType = 'triangle',
    chordAccompaniment?: ChordAccompanimentConfig,
    onComplete?: () => void
  ) {
    if (this.isPlaying && this.currentType === 'progressao') {
      this.stop();
      return;
    }

    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.isPlaying = true;
    this.currentType = 'progressao';

    const secPerBeat = 60.0 / bpm;
    let currTime = 0;
    let totalDurSec = 0;

    sequence.forEach((note) => {
      totalDurSec += note.durationBeats * secPerBeat;
    });

    // Schedule melodic sequence
    sequence.forEach((note, i) => {
      if (!this.ctx) return;
      const dur = note.durationBeats * secPerBeat;
      const scheduleTime = this.ctx.currentTime + currTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = waveform;
      osc.frequency.value = note.freq;

      gain.gain.setValueAtTime(0.28, scheduleTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, scheduleTime + Math.max(0.02, dur * 0.92));

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(scheduleTime);
      osc.stop(scheduleTime + dur);
      this.activeOscs.push(osc);

      // Schedule playhead callback
      const delayMs = currTime * 1000;
      setTimeout(() => {
        if (this.isPlaying && this.currentType === 'progressao' && this.activeNoteCallback) {
          this.activeNoteCallback(i);
        }
      }, delayMs);

      currTime += dur;
    });

    // Schedule chord harmonic accompaniment if enabled
    if (chordAccompaniment && chordAccompaniment.enabled && chordAccompaniment.notes.length > 0) {
      const itemsRitmo = chordAccompaniment.rhythmFormula
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
      const listRitmo = itemsRitmo.length > 0 ? itemsRitmo : ['semibreve'];

      let beatAcc = 0;
      let rIdx = 0;
      const totalBeats = totalDurSec / secPerBeat;

      while (beatAcc < totalBeats) {
        const term = listRitmo[rIdx % listRitmo.length];
        const chordDurBeats = getDuracaoBeat(term);
        const chordDurSec = chordDurBeats * secPerBeat;
        const scheduleTime = this.ctx.currentTime + beatAcc * secPerBeat;

        const baseGain = 0.12 / Math.max(1, chordAccompaniment.notes.length * 0.4);

        chordAccompaniment.notes.forEach((cn) => {
          if (!this.ctx) return;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();

          osc.type = waveform === 'sawtooth' ? 'sine' : waveform;
          osc.frequency.value = cn.freq;

          gain.gain.setValueAtTime(baseGain, scheduleTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, scheduleTime + Math.max(0.05, chordDurSec * 0.95));

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(scheduleTime);
          osc.stop(scheduleTime + chordDurSec);
          this.activeOscs.push(osc);
        });

        beatAcc += chordDurBeats;
        rIdx++;
      }
    }

    this.timerId = window.setTimeout(() => {
      this.stop();
      if (onComplete) onComplete();
    }, (totalDurSec + 0.15) * 1000);
  }

  public playSingleNote(pitch: string, durationSec: number = 0.5, waveform: WaveformType = 'triangle') {
    this.initContext();
    if (!this.ctx) return;

    const info = getNotePitchInfo(pitch);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = waveform;
    osc.frequency.value = info.freq;

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec);
  }
}

export const audioEngine = new AudioEngine();
