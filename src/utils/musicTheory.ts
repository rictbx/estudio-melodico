import MidiWriter from 'midi-writer-js';
import { DirecaoType, GeneratorResult, SequenceNote, TimeSignatureType } from '../types';

export const APP_VERSION = 'v2.5';

export const TONICAS = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'] as const;

export const DEFAULT_ESCALAS: Record<string, string> = {
  'Menor Harmônica': '1,2,3b,4,5,6b,7',
  'Menor Natural (Eólica)': '1,2,3b,4,5,6b,7b',
  'Menor Melódica': '1,2,3b,4,5,6,7',
  'Maior (Jônica)': '1,2,3,4,5,6,7',
  'Dórica': '1,2,3b,4,5,6,7b',
  'Frígia': '1,2b,3b,4,5,6b,7b',
  'Lídia': '1,2,3,4#,5,6,7',
  'Mixolídia': '1,2,3,4,5,7b',
  'Blues': '1,3b,4,4#,5,7b',
  'Dominante Bebop': '1,2,3,4,5,6,7b,7',
  'Húngara Menor': '1,2,3b,4#,5,6b,7',
};

export const DEFAULT_RITMOS: Record<string, string> = {
  'Tercinas de Colcheia': 'tercina',
  'Sextina (6 semicolcheias)': 'sextina',
  'Semínima (1t)': 'seminima',
  'Semínima Pontuada (1.5t)': 'seminima_pontuada',
  'Mínima (2t)': 'minima',
  'Mínima Pontuada (3t)': 'minima_pontuada',
  'Colcheia Pontuada + Semicolcheia': 'colcheia pontuada, semicolcheia',
  'Semicolcheia + Colcheia Pontuada': 'semicolcheia, colcheia pontuada',
  'Colcheia + 2 Semicolcheias': 'colcheia, semicolcheia, semicolcheia',
  '2 Semicolcheias + Colcheia': 'semicolcheia, semicolcheia, colcheia',
  'Semicolcheia + Colcheia + Semicolcheia': 'semicolcheia, colcheia, semicolcheia',
  'Semínima Pontuada + Colcheia': 'seminima pontuada, colcheia',
  'Mínima Pontuada + Semínima': 'minima pontuada, seminima',
  'Semínima + Mínima Pontuada': 'seminima, minima pontuada',
};

export const DEFAULT_PADROES: Record<string, string> = {
  'Linear Simples (1,2,3)': '1,2,3',
  'Cromático Tenso': '1,2,2#,3',
  'Salto de Terça (1-3-2-4)': '1,3,2,4',
  'Giro em Torno do Grau (1-2-1-7b)': '1,2,1,7b',
  'Aproximação Inferior (7b-1-2-3)': '7b,1,2,3',
  'Arpejo Ascendente (1-3-5-7)': '1,3,5,7',
};

export const DEFAULT_ACORDES: Record<string, string> = {
  'Tríade Maior (1,3,5)': '1,3,5',
  'Tríade Menor (1,3b,5)': '1,3b,5',
  'Sétima Dominante - 7 (1,3,5,7b)': '1,3,5,7b',
  'Sétima Maior - maj7 (1,3,5,7)': '1,3,5,7',
  'Menor com Sétima - m7 (1,3b,5,7b)': '1,3b,5,7b',
  'Meio-Diminuto - m7b5 (1,3b,5b,7b)': '1,3b,5b,7b',
  'Diminuto - dim7 (1,3b,5b,6)': '1,3b,5b,6',
  'Sétima com Nona - 7(9) (1,3,5,7b,9)': '1,3,5,7b,9',
  'Sétima Maior com Nona - maj7(9) (1,3,5,7,9)': '1,3,5,7,9',
  'Menor 7 com Nona e 11 - m7(9,11)': '1,3b,5,7b,9,11',
  'Dominante Alterado - 7alt (1,3,5b,7b,9b,13b)': '1,3,5b,7b,9b,13b',
  'Sétima Maior com 9 e 11# - maj7(9,#11)': '1,3,5,7,9,11#',
  'Sus4 com 7 e 9 - 7sus4(9)': '1,4,5,7b,9',
};

export const NOTA_VALORES: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1,
  'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4,
  'F': 5, 'F#': 6, 'Gb': 6,
  'G': 7, 'G#': 8, 'Ab': 8,
  'A': 9, 'A#': 10, 'Bb': 10,
  'B': 11,
};

// Base frequencies for piano pitches
export function getNotePitchInfo(noteName: string): { midi: number; freq: number } {
  // e.g. "A4", "C#5"
  const match = noteName.match(/^([A-G][#b]?)(-?\d+)$/);
  if (!match) {
    return { midi: 69, freq: 440 }; // default A4
  }
  const [, letter, octStr] = match;
  const oct = parseInt(octStr, 10);
  const semitone = NOTA_VALORES[letter] ?? 0;
  // MIDI note number: C0 = 12, C1 = 24, C4 = 60, A4 = 69
  const midi = (oct + 1) * 12 + semitone;
  const freq = 440 * Math.pow(2, (midi - 69) / 12);
  return { midi, freq };
}

export function parseEscalaIntervalos(formulaStr: string): number[] {
  const baseMaj = [0, 2, 4, 5, 7, 9, 11]; // Major scale semitones for degrees 1..7
  const partes = formulaStr.split(',').map((x) => x.trim());
  const interv: number[] = [];

  partes.forEach((p) => {
    if (!p) return;
    let mod = 0;
    let numStr = p;
    if (p.includes('#')) {
      mod = 1;
      numStr = p.replace('#', '');
    } else if (p.includes('b')) {
      mod = -1;
      numStr = p.replace('b', '');
    }
    const grauIdx = parseInt(numStr, 10) - 1;
    if (!isNaN(grauIdx) && grauIdx >= 0 && grauIdx < baseMaj.length) {
      interv.push(baseMaj[grauIdx] + mod);
    }
  });

  return interv.length > 0 ? interv : baseMaj;
}

export function obterNotasEscala(tonica: string, oitava: number, formulaStr: string): string[] {
  const interv = parseEscalaIntervalos(formulaStr);
  const tonicaSem = NOTA_VALORES[tonica] ?? 9; // default A
  const baseMidi = (oitava + 1) * 12 + tonicaSem;
  const nomesNotas = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  return interv.map((iv) => {
    const totalMidi = baseMidi + iv;
    const oct = Math.floor(totalMidi / 12) - 1;
    const nIdx = (totalMidi % 12 + 12) % 12;
    return `${nomesNotas[nIdx]}${oct}`;
  });
}

export function parseAcordeIntervalos(formulaStr: string): number[] {
  const baseDegreeMap: Record<number, number> = {
    1: 0, 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 7: 11,
    8: 12, 9: 14, 10: 16, 11: 17, 12: 19, 13: 21,
  };
  const partes = formulaStr.split(',').map((x) => x.trim()).filter(Boolean);
  const semitones: number[] = [];

  partes.forEach((p) => {
    let mod = 0;
    let numStr = p;
    if (p.includes('#') || p.includes('+')) {
      mod = 1;
      numStr = p.replace('#', '').replace('+', '');
    } else if (p.includes('b')) {
      mod = -1;
      numStr = p.replace('b', '');
    }
    const degree = parseInt(numStr, 10);
    if (!isNaN(degree)) {
      const baseSemitone = baseDegreeMap[degree] ?? ((degree - 1) * 2);
      semitones.push(baseSemitone + mod);
    }
  });

  return semitones.length > 0 ? semitones : [0, 4, 7];
}

export function obterNotasAcorde(
  tonica: string,
  oitava: number,
  formulaStr: string
): { pitch: string; midi: number; freq: number }[] {
  const semitones = parseAcordeIntervalos(formulaStr);
  const tonicaSem = NOTA_VALORES[tonica] ?? 0;
  const baseMidi = (oitava + 1) * 12 + tonicaSem;
  const nomesNotas = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  return semitones.map((st) => {
    const totalMidi = Math.max(21, Math.min(108, baseMidi + st));
    const oct = Math.floor(totalMidi / 12) - 1;
    const nIdx = (totalMidi % 12 + 12) % 12;
    const pitch = `${nomesNotas[nIdx]}${oct}`;
    const freq = 440 * Math.pow(2, (totalMidi - 69) / 12);
    return { pitch, midi: totalMidi, freq };
  });
}

// Convert rhythm terms into quarter length duration (beats)
export function getDuracaoBeat(termo: string): number {
  const t = termo.toLowerCase().trim();
  let baseDur = 0.5;

  if (t.includes('semifusa')) {
    baseDur = 0.0625;
  } else if (t.includes('fusa')) {
    baseDur = 0.125;
  } else if (t.includes('tercina_semicolcheia') || t.includes('tercina de semicolcheia')) {
    baseDur = 1.0 / 6.0;
  } else if (t.includes('tercina_colcheia') || t.includes('tercina de colcheia') || t.includes('tercina')) {
    baseDur = 1.0 / 3.0;
  } else if (t.includes('quintina')) {
    baseDur = 0.2; // 1/5 of a quarter beat
  } else if (t.includes('sextina')) {
    baseDur = 1.0 / 6.0;
  } else if (t.includes('semicolcheia')) {
    baseDur = 0.25;
  } else if (t.includes('colcheia')) {
    baseDur = 0.5;
  } else if (t.includes('seminima') || t.includes('semínima')) {
    baseDur = 1.0;
  } else if (t.includes('minima') || t.includes('mínima')) {
    baseDur = 2.0;
  } else if (t.includes('semibreve')) {
    baseDur = 4.0;
  } else if (t.includes('breve')) {
    baseDur = 8.0;
  }

  if (t.includes('pont') || t.includes('ponto') || t.includes('.')) {
    baseDur *= 1.5;
  }

  return baseDur;
}

// Full pattern sequence builder exactly replicating Python & JS logic
export function gerarSequenciaProgressoes(params: {
  tonica: string;
  oitavaBase: number;
  escalaFormula: string;
  ritmoFormula: string;
  padraoFormula: string;
  notaInicial: string;
  direcao: DirecaoType;
  numCompassos: number;
  timeSignature: TimeSignatureType;
}): GeneratorResult {
  const {
    tonica,
    oitavaBase,
    escalaFormula,
    ritmoFormula,
    padraoFormula,
    notaInicial,
    direcao,
    numCompassos,
    timeSignature,
  } = params;

  // Build extended scale pitches across full 88-key piano range (A0 = MIDI 21 to C8 = MIDI 108)
  const nomesNotas = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const baseMaj = [0, 2, 4, 5, 7, 9, 11];
  const scaleDegrees = escalaFormula.split(',').map((x) => x.trim()).filter(Boolean);

  const escalaExtendida: { pitchStr: string; midi: number }[] = [];

  for (let currentOct = 0; currentOct <= 8; currentOct++) {
    const rootMidi = (currentOct + 1) * 12 + (NOTA_VALORES[tonica] ?? 9);
    scaleDegrees.forEach((item) => {
      let mod = 0;
      let baseStr = item;
      if (item.includes('#')) {
        mod = 1;
        baseStr = item.replace('#', '');
      } else if (item.includes('b')) {
        mod = -1;
        baseStr = item.replace('b', '');
      }
      const idxG = parseInt(baseStr, 10) - 1;
      if (!isNaN(idxG) && idxG >= 0 && idxG < baseMaj.length) {
        const semitoneOffset = baseMaj[idxG] + mod;
        const midi = rootMidi + semitoneOffset;
        if (midi >= 21 && midi <= 108) {
          const oct = Math.floor(midi / 12) - 1;
          const nIdx = (midi % 12 + 12) % 12;
          escalaExtendida.push({ pitchStr: `${nomesNotas[nIdx]}${oct}`, midi });
        }
      }
    });
  }

  // Parse pattern degrees and chromatic modifiers
  const pedacosPattern = padraoFormula.split(',').map((x) => x.trim());
  const padraoProcessado: { degree: number; mod: number }[] = pedacosPattern.map((item) => {
    let mod = 0;
    let baseStr = item;
    if (item.includes('#')) {
      mod = 1;
      baseStr = item.replace('#', '');
    } else if (item.includes('b')) {
      mod = -1;
      baseStr = item.replace('b', '');
    }
    const g = parseInt(baseStr, 10) - 1;
    return { degree: isNaN(g) ? 0 : g, mod };
  });

  // Target starting note
  let targetPitchStr = notaInicial;
  if (!/\d/.test(targetPitchStr)) {
    targetPitchStr += `${oitavaBase}`;
  }
  const targetMidi = getNotePitchInfo(targetPitchStr).midi;

  // Find index in escalaExtendida closest to targetMidi
  let startIndex = 0;
  let minDist = 999;
  escalaExtendida.forEach((item, idx) => {
    const dist = Math.abs(item.midi - targetMidi);
    if (dist < minDist) {
      minDist = dist;
      startIndex = idx;
    }
  });

  // Calculate target total beats according to time signature
  const partesComp = timeSignature.split('/');
  const numTemposComp = parseInt(partesComp[0], 10) || 4;
  const beatsPerMeasure = timeSignature === '6/8' ? 3.0 : numTemposComp;
  const totalTargetBeats = numCompassos * beatsPerMeasure;

  // Rhythm terms list
  const itensRitmo = ritmoFormula.split(',').map((x) => x.trim()).filter(Boolean);
  const ritmoList = itensRitmo.length > 0 ? itensRitmo : ['colcheia'];

  const sequenceNotes: SequenceNote[] = [];
  const listaNotasNome: string[] = [];
  const listaDuracoesBeats: number[] = [];

  let tempoAcumulado = 0.0;
  let passoIdx = 0;
  let contadorNota = 0;
  const isDesc = direcao === 'desc';

  while (tempoAcumulado < totalTargetBeats && passoIdx < 1000) {
    const baseIdx = isDesc ? startIndex - passoIdx : startIndex + passoIdx;
    let outOfBounds = false;

    for (const p of padraoProcessado) {
      if (tempoAcumulado >= totalTargetBeats) break;

      const idxFinal = isDesc ? baseIdx - p.degree : baseIdx + p.degree;
      if (idxFinal < 0 || idxFinal >= escalaExtendida.length) {
        outOfBounds = true;
        break;
      }

      const midiFinal = escalaExtendida[idxFinal].midi + p.mod;
      if (midiFinal < 21 || midiFinal > 108) {
        outOfBounds = true;
        break;
      }

      const oct = Math.floor(midiFinal / 12) - 1;
      const nIdx = (midiFinal % 12 + 12) % 12;
      const noteName = `${nomesNotas[nIdx]}${oct}`;

      const rhythmTerm = ritmoList[contadorNota % ritmoList.length];
      const durBeats = getDuracaoBeat(rhythmTerm);

      const startTime = tempoAcumulado;
      const endTime = tempoAcumulado + durBeats;

      const measureNumber = Math.floor(startTime / beatsPerMeasure) + 1;
      const beatInMeasure = (startTime % beatsPerMeasure) + 1;

      const noteInfo = getNotePitchInfo(noteName);

      sequenceNotes.push({
        id: `note-${contadorNota}-${noteName}-${startTime.toFixed(2)}`,
        pitch: noteName,
        midiNumber: noteInfo.midi,
        freq: noteInfo.freq,
        durationBeats: durBeats,
        rhythmTerm,
        measureNumber,
        beatInMeasure,
        startTimeBeats: startTime,
        endTimeBeats: endTime,
      });

      listaNotasNome.push(noteName);
      listaDuracoesBeats.push(durBeats);

      tempoAcumulado += durBeats;
      contadorNota++;
    }

    if (outOfBounds) break;
    passoIdx++;
  }

  return {
    notas: sequenceNotes,
    totalBeats: tempoAcumulado,
    totalCompassos: Math.ceil(tempoAcumulado / beatsPerMeasure),
    timeSignature,
    listaNotasNome,
    listaDuracoesBeats,
  };
}

// Convert rhythm term to MidiWriter duration string
export function rhythmTermToMidiWriterDuration(term: string): string {
  const t = term.toLowerCase().trim();
  const isDot = t.includes('pont') || t.includes('ponto') || t.includes('.');
  const dotSuffix = isDot ? '.' : '';

  if (t.includes('semifusa')) return `64${dotSuffix}`;
  if (t.includes('fusa')) return `32${dotSuffix}`;
  if (t.includes('tercina_semicolcheia') || t.includes('tercina de semicolcheia')) return '16t';
  if (t.includes('tercina_colcheia') || t.includes('tercina de colcheia') || t.includes('tercina')) return '8t';
  if (t.includes('quintina')) return '16t';
  if (t.includes('sextina')) return '16t';
  if (t.includes('semicolcheia')) return `16${dotSuffix}`;
  if (t.includes('colcheia')) return `8${dotSuffix}`;
  if (t.includes('seminima') || t.includes('semínima')) return `4${dotSuffix}`;
  if (t.includes('minima') || t.includes('mínima')) return `2${dotSuffix}`;
  if (t.includes('semibreve')) return `1${dotSuffix}`;
  if (t.includes('breve')) return `1${dotSuffix}`;
  return `8${dotSuffix}`;
}

// Generate MIDI File Blob and download it
export function baixarMidiFile(
  sequence: SequenceNote[],
  bpm: number,
  timeSignature: TimeSignatureType,
  fileNameBase: string
) {
  const partesComp = timeSignature.split('/');
  const numBeats = parseInt(partesComp[0], 10) || 4;

  const track = new MidiWriter.Track();
  track.setTimeSignature(numBeats, 4);
  track.setTempo(bpm);

  sequence.forEach((note) => {
    const durCode = rhythmTermToMidiWriterDuration(note.rhythmTerm);
    const noteEvent = new MidiWriter.NoteEvent({
      pitch: [note.pitch],
      duration: durCode,
    });
    track.addEvent(noteEvent);
  });

  const writer = new MidiWriter.Writer([track]);
  const uri = writer.dataUri();

  const link = document.createElement('a');
  link.href = uri;
  link.download = `${fileNameBase}.mid`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
