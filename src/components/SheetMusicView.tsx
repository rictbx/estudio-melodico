import React, { useState } from 'react';
import { GeneratorResult, SequenceNote } from '../types';
import { FileMusic, Printer, Sun, Moon, Info, Sparkles, Check } from 'lucide-react';

interface SheetMusicViewProps {
  generatorResult: GeneratorResult;
  activeNoteIndex: number | null;
  onNoteClick?: (index: number) => void;
}

interface NoteRenderInfo {
  note: SequenceNote;
  globalIndex: number;
  noteX: number;
  noteY: number;
  diatonicStep: number;
  letter: string;
  accidental: string;
  octave: number;
  beatInMeasure: number;
  stemX: number;
  stemUp: boolean;
  isFilled: boolean;
  isHalfNote: boolean;
  isWholeNote: boolean;
  isBeamable: boolean;
  ledgerLines: number[];
}

interface BeamGroup {
  notes: NoteRenderInfo[];
  stemUp: boolean;
  beamStartY: number;
  beamEndY: number;
  isSixteenth: boolean;
}

export const SheetMusicView: React.FC<SheetMusicViewProps> = ({
  generatorResult,
  activeNoteIndex,
  onNoteClick,
}) => {
  const [showNoteNames, setShowNoteNames] = useState(true);
  const [clefMode, setClefMode] = useState<'treble' | 'bass' | 'auto'>('auto');
  const [paperTheme, setPaperTheme] = useState<'paper' | 'dark'>('paper');

  const { notas, totalBeats, totalCompassos } = generatorResult;
  const safeTimeSig = generatorResult.timeSignature || '4/4';

  if (!notas || notas.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 font-sans">
        Nenhuma nota para exibir na partitura.
      </div>
    );
  }

  // Auto clef detection
  const avgMidi =
    notas.reduce((acc, curr) => acc + curr.midiNumber, 0) / notas.length;
  const activeClef =
    clefMode === 'auto' ? (avgMidi < 55 ? 'bass' : 'treble') : clefMode;

  // Group notes by measure
  const measuresMap = new Map<number, SequenceNote[]>();
  for (let m = 1; m <= totalCompassos; m++) {
    measuresMap.set(m, []);
  }
  notas.forEach((n) => {
    const list = measuresMap.get(n.measureNumber) || [];
    list.push(n);
    measuresMap.set(n.measureNumber, list);
  });

  const letterMap: Record<string, number> = {
    C: 0,
    D: 1,
    E: 2,
    F: 3,
    G: 4,
    A: 5,
    B: 6,
  };

  const parsePitchInfo = (pitchStr: string) => {
    const match = pitchStr.match(/^([A-G])([#b]?)(-?\d+)$/);
    if (!match) {
      return { letter: 'C', accidental: '', octave: 4, diatonicStep: 28 };
    }
    const letter = match[1];
    const accidental = match[2];
    const octave = parseInt(match[3], 10);
    const letterIdx = letterMap[letter] ?? 0;
    const diatonicStep = octave * 7 + letterIdx;
    return { letter, accidental, octave, diatonicStep };
  };

  // Staff geometry
  const lineSpacing = 10;
  const halfStepHeight = lineSpacing / 2;

  const topLineDiatonic = activeClef === 'treble' ? 38 : 26;
  const middleLineDiatonic = activeClef === 'treble' ? 34 : 22;
  const bottomLineDiatonic = activeClef === 'treble' ? 30 : 18;

  const staffPaddingTop = 50;
  const staffHeight = 4 * lineSpacing; // 40px
  const topLineY = staffPaddingTop;
  const bottomLineY = topLineY + staffHeight;

  const getYForDiatonicStep = (step: number) => {
    return topLineY + (topLineDiatonic - step) * halfStepHeight;
  };

  // Measures layout per system row
  const measuresPerSystem = 2;
  const systemCount = Math.ceil(totalCompassos / measuresPerSystem);
  const measureWidth = 270;
  const headerWidth = 65;
  const systemWidth = headerWidth + measuresPerSystem * measureWidth + 20;

  // Function to process notes and calculate beams for a measure
  const processMeasureNotes = (
    mNum: number,
    mStartX: number,
    beatsInMeasure: number
  ) => {
    const rawNotes = measuresMap.get(mNum) || [];

    const noteInfos: NoteRenderInfo[] = rawNotes.map((n) => {
      const globalIndex = notas.findIndex((x) => x.id === n.id);
      const beatOffsetInMeasure = n.startTimeBeats % beatsInMeasure;
      const noteX =
        mStartX + 28 + (beatOffsetInMeasure / beatsInMeasure) * (measureWidth - 50);

      const { letter, accidental, octave, diatonicStep } = parsePitchInfo(n.pitch);
      const noteY = getYForDiatonicStep(diatonicStep);

      const stemUp = diatonicStep < middleLineDiatonic;
      const stemX = stemUp ? noteX + 4.5 : noteX - 4.5;

      const isWholeNote = n.durationBeats >= 4;
      const isHalfNote = n.durationBeats >= 2 && n.durationBeats < 4;
      const isFilled = n.durationBeats < 2;
      const isBeamable = n.durationBeats <= 0.75; // 8th, 16th, triplets

      const ledgerLines: number[] = [];
      if (diatonicStep < bottomLineDiatonic) {
        for (let step = bottomLineDiatonic - 2; step >= diatonicStep; step -= 2) {
          ledgerLines.push(getYForDiatonicStep(step));
        }
      } else if (diatonicStep > topLineDiatonic) {
        for (let step = topLineDiatonic + 2; step <= diatonicStep; step += 2) {
          ledgerLines.push(getYForDiatonicStep(step));
        }
      }

      return {
        note: n,
        globalIndex,
        noteX,
        noteY,
        diatonicStep,
        letter,
        accidental,
        octave,
        beatInMeasure: beatOffsetInMeasure,
        stemX,
        stemUp,
        isFilled,
        isHalfNote,
        isWholeNote,
        isBeamable,
        ledgerLines,
      };
    });

    // Group beamable notes into Beam Groups
    const beamGroups: BeamGroup[] = [];
    let currentGroupNotes: NoteRenderInfo[] = [];

    const finalizeGroup = (groupNotes: NoteRenderInfo[]) => {
      if (groupNotes.length === 0) return;

      if (groupNotes.length === 1) {
        // Single note group - no beam, standard stem/flag
        beamGroups.push({
          notes: groupNotes,
          stemUp: groupNotes[0].stemUp,
          beamStartY: 0,
          beamEndY: 0,
          isSixteenth: false,
        });
      } else {
        // Multi-note beam group
        // Common stem direction: majority or average
        const avgStep =
          groupNotes.reduce((sum, item) => sum + item.diatonicStep, 0) /
          groupNotes.length;
        const stemUp = avgStep < middleLineDiatonic;

        // Recalculate stemX for group notes according to unified stemUp
        groupNotes.forEach((item) => {
          item.stemUp = stemUp;
          item.stemX = stemUp ? item.noteX + 4.5 : item.noteX - 4.5;
        });

        // Determine slope and Y beam endpoints
        const noteYs = groupNotes.map((item) => item.noteY);
        const firstY = noteYs[0];
        const lastY = noteYs[noteYs.length - 1];
        const slope = Math.max(-8, Math.min(8, (lastY - firstY) * 0.2));

        let beamStartY = 0;
        let beamEndY = 0;

        if (stemUp) {
          const minY = Math.min(...noteYs);
          const beamBaseY = Math.min(topLineY - 8, minY - 24);
          beamStartY = beamBaseY - (slope > 0 ? 0 : slope);
          beamEndY = beamBaseY + (slope > 0 ? slope : 0);
        } else {
          const maxY = Math.max(...noteYs);
          const beamBaseY = Math.max(bottomLineY + 8, maxY + 24);
          beamStartY = beamBaseY - (slope > 0 ? 0 : slope);
          beamEndY = beamBaseY + (slope > 0 ? slope : 0);
        }

        const isSixteenth = groupNotes.some((item) => item.note.durationBeats <= 0.25);

        beamGroups.push({
          notes: groupNotes,
          stemUp,
          beamStartY,
          beamEndY,
          isSixteenth,
        });
      }
    };

    for (let i = 0; i < noteInfos.length; i++) {
      const item = noteInfos[i];
      if (!item.isBeamable) {
        // Non-beamable note ends current group
        finalizeGroup(currentGroupNotes);
        currentGroupNotes = [];
        // Add non-beamable note as solo group
        finalizeGroup([item]);
      } else {
        // Check if item belongs to current group
        if (currentGroupNotes.length === 0) {
          currentGroupNotes.push(item);
        } else {
          const prevItem = currentGroupNotes[currentGroupNotes.length - 1];
          // Group notes by beat window (e.g. beat 0-1, beat 1-2, etc.)
          const prevBeatBucket = Math.floor(prevItem.beatInMeasure);
          const currBeatBucket = Math.floor(item.beatInMeasure);

          if (prevBeatBucket === currBeatBucket || currentGroupNotes.length < 2) {
            currentGroupNotes.push(item);
          } else {
            finalizeGroup(currentGroupNotes);
            currentGroupNotes = [item];
          }
        }
      }
    }
    finalizeGroup(currentGroupNotes);

    return { noteInfos, beamGroups };
  };

  const handlePrint = () => {
    window.print();
  };

  // Color constants based on paperTheme
  const isPaper = paperTheme === 'paper';

  const styles = {
    bgContainer: isPaper
      ? 'bg-[#fcfbf9] text-slate-900 shadow-2xl border border-amber-900/10'
      : 'bg-slate-950 text-slate-100 border border-slate-800',
    headerBg: isPaper ? 'bg-amber-50/50 border-amber-200/60' : 'bg-slate-900 border-slate-800',
    systemBg: isPaper ? 'bg-white border-slate-200/90 shadow-sm' : 'bg-slate-900/60 border-slate-800',
    staffLineColor: isPaper ? '#1e293b' : '#475569',
    barLineColor: isPaper ? '#0f172a' : '#94a3b8',
    clefColor: isPaper ? '#020617' : '#e2e8f0',
    timeSigColor: isPaper ? '#0f172a' : '#cbd5e1',
    noteHeadColor: isPaper ? '#000000' : '#cbd5e1',
    noteStemColor: isPaper ? '#000000' : '#94a3b8',
    beamColor: isPaper ? '#000000' : '#38bdf8',
    noteLabelColor: isPaper ? '#334155' : '#94a3b8',
    activeGlow: '#f59e0b',
    activeFill: '#d97706',
  };

  return (
    <div className="space-y-4 print:p-0 print:m-0">
      {/* Score Controls Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/90 p-3 rounded-xl border border-slate-800 text-xs text-slate-300 print:hidden">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium text-slate-200">
            <FileMusic className="w-4 h-4 text-sky-400" />
            <span>Visualização da Partitura:</span>
          </div>

          <button
            onClick={() => setPaperTheme(isPaper ? 'dark' : 'paper')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition font-medium ${
              isPaper
                ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isPaper ? <Sun className="w-3.5 h-3.5 text-amber-700" /> : <Moon className="w-3.5 h-3.5 text-sky-400" />}
            <span>{isPaper ? 'Papel de Partitura (Branco)' : 'Modo Estúdio (Escuro)'}</span>
          </button>

          <label className="flex items-center gap-2 cursor-pointer select-none bg-slate-900 hover:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-800 transition">
            <input
              type="checkbox"
              checked={showNoteNames}
              onChange={(e) => setShowNoteNames(e.target.checked)}
              className="accent-sky-500 rounded"
            />
            <span>Nomes das Notas</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400">Clave:</span>
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setClefMode('auto')}
              className={`px-2 py-1 text-[11px] rounded-md transition ${
                clefMode === 'auto'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Auto
            </button>
            <button
              onClick={() => setClefMode('treble')}
              className={`px-2 py-1 text-[11px] rounded-md transition ${
                clefMode === 'treble'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sol 🎼
            </button>
            <button
              onClick={() => setClefMode('bass')}
              className={`px-2 py-1 text-[11px] rounded-md transition ${
                clefMode === 'bass'
                  ? 'bg-sky-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Fá 𝄢
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 transition font-medium ml-2"
            title="Imprimir ou Salvar em PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>Imprimir Partitura</span>
          </button>
        </div>
      </div>

      {/* Main Score Sheet Container */}
      <div className={`overflow-x-auto rounded-2xl p-6 sm:p-10 transition-colors ${styles.bgContainer}`}>
        <div className="min-w-[660px] max-w-4xl mx-auto space-y-8 font-serif">
          {/* Authentic Sheet Music Header Header Title */}
          <div className="text-center pb-4 border-b-2 border-slate-900/80 space-y-1">
            <div className="flex justify-between items-center text-xs font-sans text-slate-500 uppercase tracking-widest font-semibold px-2">
              <span>Partitura Melódica</span>
              <span>Fórmula: {safeTimeSig}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 font-serif">
              Progressão Melódica
            </h1>
            <div className="flex justify-between items-center text-xs font-sans text-slate-600 pt-2 px-2">
              <span className="font-mono">Tempo: ♩ = 120 BPM</span>
              <span className="italic font-serif text-slate-700">Edição Estúdio Melódico</span>
              <span className="font-mono">{totalCompassos} Compassos ({totalBeats.toFixed(1)} tempos)</span>
            </div>
          </div>

          {/* Render Systems */}
          <div className="space-y-8">
            {Array.from({ length: systemCount }, (_, sysIdx) => {
              const startMeasure = sysIdx * measuresPerSystem + 1;
              const endMeasure = Math.min(
                totalCompassos,
                startMeasure + measuresPerSystem - 1
              );

              return (
                <div
                  key={`system-${sysIdx}`}
                  className={`rounded-xl p-4 relative transition-colors ${styles.systemBg}`}
                >
                  <div className="text-[10px] font-sans font-bold text-slate-400 mb-2 flex justify-between items-center px-1">
                    <span>
                      Linha {sysIdx + 1} • Compassos {startMeasure}–{endMeasure}
                    </span>
                    {activeNoteIndex !== null &&
                      notas[activeNoteIndex]?.measureNumber >= startMeasure &&
                      notas[activeNoteIndex]?.measureNumber <= endMeasure && (
                        <span className="text-amber-600 font-semibold flex items-center gap-1 animate-pulse font-sans">
                          <Sparkles className="w-3.5 h-3.5" />
                          Executando pauta
                        </span>
                      )}
                  </div>

                  <svg
                    width={systemWidth}
                    height={140}
                    className="w-full h-auto overflow-visible select-none"
                  >
                    {/* System Header: 5 Staff Lines */}
                    <g>
                      {[0, 1, 2, 3, 4].map((i) => {
                        const y = topLineY + i * lineSpacing;
                        return (
                          <line
                            key={`staff-line-${i}`}
                            x1={10}
                            y1={y}
                            x2={systemWidth - 10}
                            y2={y}
                            stroke={styles.staffLineColor}
                            strokeWidth="1.2"
                          />
                        );
                      })}

                      {/* Start Bar Line */}
                      <line
                        x1={10}
                        y1={topLineY}
                        x2={10}
                        y2={bottomLineY}
                        stroke={styles.barLineColor}
                        strokeWidth="2"
                      />

                      {/* Clef Symbol */}
                      <text
                        x={18}
                        y={
                          activeClef === 'treble' ? topLineY + 33 : topLineY + 28
                        }
                        fontSize={activeClef === 'treble' ? 34 : 28}
                        fill={styles.clefColor}
                        className="font-serif font-normal"
                      >
                        {activeClef === 'treble' ? '🎼' : '𝄢'}
                      </text>

                      {/* Time Signature */}
                      {sysIdx === 0 && (
                        <g
                          fill={styles.timeSigColor}
                          className="font-bold font-mono text-[14px]"
                        >
                          <text x={52} y={topLineY + 15}>
                            {safeTimeSig.split('/')[0] || '4'}
                          </text>
                          <text x={52} y={topLineY + 35}>
                            {safeTimeSig.split('/')[1] || '4'}
                          </text>
                        </g>
                      )}
                    </g>

                    {/* Render Measures */}
                    {Array.from(
                      { length: endMeasure - startMeasure + 1 },
                      (_, mOffset) => {
                        const mNum = startMeasure + mOffset;
                        const mStartX = headerWidth + mOffset * measureWidth + 10;
                        const mEndX = mStartX + measureWidth;

                        const beatsInMeasure =
                          safeTimeSig === '6/8'
                            ? 3.0
                            : parseInt(safeTimeSig.split('/')[0] || '4', 10);

                        const { noteInfos, beamGroups } = processMeasureNotes(
                          mNum,
                          mStartX,
                          beatsInMeasure
                        );

                        return (
                          <g key={`measure-${mNum}`}>
                            {/* Measure Number */}
                            <text
                              x={mStartX + 6}
                              y={topLineY - 14}
                              className="fill-slate-500 text-[10px] font-sans font-semibold"
                            >
                              c.{mNum}
                            </text>

                            {/* Measure Bar Line */}
                            <line
                              x1={mEndX}
                              y1={topLineY}
                              x2={mEndX}
                              y2={bottomLineY}
                              stroke={styles.barLineColor}
                              strokeWidth={mNum === totalCompassos ? '3.5' : '1.5'}
                            />
                            {mNum === totalCompassos && (
                              <line
                                x1={mEndX - 4}
                                y1={topLineY}
                                x2={mEndX - 4}
                                y2={bottomLineY}
                                stroke={styles.barLineColor}
                                strokeWidth="1.5"
                              />
                            )}

                            {/* Render Beams & Stems */}
                            {beamGroups.map((group, gIdx) => {
                              if (group.notes.length >= 2) {
                                const { notes: gNotes, stemUp, beamStartY, beamEndY, isSixteenth } = group;
                                const firstItem = gNotes[0];
                                const lastItem = gNotes[gNotes.length - 1];

                                const firstStemX = firstItem.stemX;
                                const lastStemX = lastItem.stemX;

                                // Render stems for group
                                return (
                                  <g key={`beam-group-${mNum}-${gIdx}`}>
                                    {/* Primary Beam Line */}
                                    <line
                                      x1={firstStemX}
                                      y1={beamStartY}
                                      x2={lastStemX}
                                      y2={beamEndY}
                                      stroke={styles.beamColor}
                                      strokeWidth="4"
                                      strokeLinecap="round"
                                    />

                                    {/* Secondary Beam for 16th notes */}
                                    {isSixteenth && (
                                      <line
                                        x1={firstStemX}
                                        y1={beamStartY + (stemUp ? 6 : -6)}
                                        x2={lastStemX}
                                        y2={beamEndY + (stemUp ? 6 : -6)}
                                        stroke={styles.beamColor}
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                      />
                                    )}

                                    {/* Stems connecting noteheads to beam */}
                                    {gNotes.map((item) => {
                                      const t =
                                        (item.stemX - firstStemX) /
                                        (lastStemX - firstStemX || 1);
                                      const stemTipY = beamStartY + t * (beamEndY - beamStartY);
                                      const isActive = activeNoteIndex === item.globalIndex;

                                      return (
                                        <line
                                          key={`stem-${item.note.id}`}
                                          x1={item.stemX}
                                          y1={item.noteY}
                                          x2={item.stemX}
                                          y2={stemTipY}
                                          stroke={isActive ? styles.activeGlow : styles.noteStemColor}
                                          strokeWidth="1.5"
                                        />
                                      );
                                    })}
                                  </g>
                                );
                              } else {
                                // Single Note Stem & Flag
                                const item = group.notes[0];
                                if (!item || item.isWholeNote) return null;

                                const { stemUp, stemX, noteY, globalIndex } = item;
                                const isActive = activeNoteIndex === globalIndex;
                                const stemLen = 28;
                                const stemTipY = stemUp ? noteY - stemLen : noteY + stemLen;

                                return (
                                  <g key={`single-stem-${item.note.id}`}>
                                    <line
                                      x1={stemX}
                                      y1={noteY}
                                      x2={stemX}
                                      y2={stemTipY}
                                      stroke={isActive ? styles.activeGlow : styles.noteStemColor}
                                      strokeWidth="1.5"
                                    />

                                    {/* Flag for un-beamed 8th note */}
                                    {item.note.durationBeats <= 0.5 && (
                                      <path
                                        d={
                                          stemUp
                                            ? `M ${stemX} ${stemTipY} Q ${stemX + 8} ${
                                                stemTipY + 8
                                              } ${stemX + 5} ${stemTipY + 16}`
                                            : `M ${stemX} ${stemTipY} Q ${stemX + 8} ${
                                                stemTipY - 8
                                              } ${stemX + 5} ${stemTipY - 16}`
                                        }
                                        fill="none"
                                        stroke={isActive ? styles.activeGlow : styles.noteStemColor}
                                        strokeWidth="1.8"
                                      />
                                    )}
                                  </g>
                                );
                              }
                            })}

                            {/* Render Noteheads, Ledger lines & Labels */}
                            {noteInfos.map((item) => {
                              const isActive = activeNoteIndex === item.globalIndex;

                              return (
                                <g
                                  key={`note-${item.note.id}`}
                                  className="cursor-pointer group"
                                  onClick={() => onNoteClick?.(item.globalIndex)}
                                >
                                  {/* Active Note Aura Highlight */}
                                  {isActive && (
                                    <circle
                                      cx={item.noteX}
                                      cy={item.noteY}
                                      r={15}
                                      fill="rgba(245, 158, 11, 0.25)"
                                      stroke={styles.activeGlow}
                                      strokeWidth="2"
                                      className="animate-pulse"
                                    />
                                  )}

                                  {/* Ledger Lines */}
                                  {item.ledgerLines.map((ly, lIdx) => (
                                    <line
                                      key={`ledger-${lIdx}`}
                                      x1={item.noteX - 9}
                                      y1={ly}
                                      x2={item.noteX + 9}
                                      y2={ly}
                                      stroke={styles.staffLineColor}
                                      strokeWidth="1.5"
                                    />
                                  ))}

                                  {/* Accidental */}
                                  {item.accidental && (
                                    <text
                                      x={item.noteX - 12}
                                      y={item.noteY + 4}
                                      fontSize="13"
                                      fontWeight="bold"
                                      fill={isActive ? styles.activeGlow : styles.noteHeadColor}
                                      className="font-serif select-none"
                                    >
                                      {item.accidental === '#'
                                        ? '♯'
                                        : item.accidental === 'b'
                                        ? '♭'
                                        : item.accidental}
                                    </text>
                                  )}

                                  {/* Note Head */}
                                  <ellipse
                                    cx={item.noteX}
                                    cy={item.noteY}
                                    rx={5.2}
                                    ry={3.8}
                                    transform={`rotate(-22 ${item.noteX} ${item.noteY})`}
                                    fill={
                                      isActive
                                        ? styles.activeFill
                                        : item.isFilled
                                        ? styles.noteHeadColor
                                        : isPaper
                                        ? '#ffffff'
                                        : '#0f172a'
                                    }
                                    stroke={
                                      isActive
                                        ? styles.activeGlow
                                        : item.isFilled
                                        ? styles.noteHeadColor
                                        : styles.noteHeadColor
                                    }
                                    strokeWidth={item.isFilled ? '1' : '1.8'}
                                    className="transition-transform group-hover:scale-125"
                                  />

                                  {/* Note Name Label (Optional) */}
                                  {showNoteNames && (
                                    <text
                                      x={item.noteX}
                                      y={
                                        item.stemUp
                                          ? item.noteY + 16
                                          : item.noteY - 12
                                      }
                                      textAnchor="middle"
                                      fontSize="9"
                                      fontWeight="bold"
                                      fill={isActive ? styles.activeFill : styles.noteLabelColor}
                                      className="font-sans select-none"
                                    >
                                      {item.note.pitch}
                                    </text>
                                  )}
                                </g>
                              );
                            })}
                          </g>
                        );
                      }
                    )}
                  </svg>
                </div>
              );
            })}
          </div>

          {/* Paper Footer Info */}
          <div className="pt-6 border-t border-slate-300 text-center text-xs font-sans text-slate-500 flex justify-between items-center print:pt-4">
            <span>Página 1 de 1</span>
            <span>Partitura gerada por Estúdio Melódico & Gerador MIDI</span>
            <span className="font-mono">{totalCompassos} compassos</span>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/70 p-3 rounded-xl border border-slate-800 print:hidden">
        <Info className="w-4 h-4 text-sky-400 shrink-0" />
        <span>
          A partitura agora agrupa automaticamente as astes das colcheias/semicolcheias em barras de ligação (beams). Clique no botão <strong>Imprimir Partitura</strong> para exportar em PDF ou papel.
        </span>
      </div>
    </div>
  );
};
