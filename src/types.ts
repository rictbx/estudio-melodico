export interface ScaleItem {
  id: string;
  nome: string;
  formula: string;
  isCustom?: boolean;
}

export interface RhythmItem {
  id: string;
  nome: string;
  formula: string;
  isCustom?: boolean;
}

export interface PatternItem {
  id: string;
  nome: string;
  formula: string;
  isCustom?: boolean;
}

export interface ChordItem {
  id: string;
  nome: string;
  formula: string;
  isCustom?: boolean;
}

export type DirecaoType = 'asc' | 'desc';
export type TimeSignatureType = '4/4' | '3/4' | '6/8';
export type WaveformType = 'triangle' | 'sine' | 'sawtooth' | 'square';

export interface SequenceNote {
  id: string;
  pitch: string; // e.g. "A4"
  midiNumber: number; // e.g. 69
  freq: number; // Hz
  durationBeats: number; // in quarter notes / beats
  rhythmTerm: string; // e.g. "colcheia", "tercina"
  measureNumber: number;
  beatInMeasure: number;
  startTimeBeats: number;
  endTimeBeats: number;
}

export interface GeneratorResult {
  notas: SequenceNote[];
  totalBeats: number;
  totalCompassos: number;
  timeSignature?: TimeSignatureType;
  listaNotasNome: string[];
  listaDuracoesBeats: number[];
}

export interface PlaybackState {
  isPlaying: boolean;
  type: 'escala' | 'progressao' | null;
  currentNoteIndex: number | null;
}
