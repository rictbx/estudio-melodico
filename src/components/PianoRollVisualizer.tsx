import React, { useState } from 'react';
import { Music, Eye, Grid, List, Sparkles, FileMusic } from 'lucide-react';
import { GeneratorResult, SequenceNote } from '../types';
import { SheetMusicView } from './SheetMusicView';

interface PianoRollVisualizerProps {
  generatorResult: GeneratorResult | null;
  activeNoteIndex: number | null;
  scaleNotes: string[];
}

export const PianoRollVisualizer: React.FC<PianoRollVisualizerProps> = ({
  generatorResult,
  activeNoteIndex,
  scaleNotes,
}) => {
  const [activeTab, setActiveTab] = useState<'pianoroll' | 'sheet' | 'keyboard' | 'table'>('pianoroll');

  if (!generatorResult || generatorResult.notas.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
        <Music className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-bounce" />
        <p className="text-sm font-medium">Configure a escala, ritmo e padrão para visualizar a sequência melódica.</p>
      </div>
    );
  }

  const { notas, totalBeats, totalCompassos } = generatorResult;

  // Find unique pitch list sorted high to low for piano roll grid
  const pitchMidiMap = new Map<number, string>();
  notas.forEach((n) => pitchMidiMap.set(n.midiNumber, n.pitch));
  const sortedMidis = Array.from(pitchMidiMap.keys()).sort((a, b) => b - a);

  // Active note object
  const activeNote = activeNoteIndex !== null && activeNoteIndex < notas.length ? notas[activeNoteIndex] : null;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
            Visualizador Melódico Interativo ({notas.length} notas)
          </h2>
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('pianoroll')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'pianoroll'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Piano Roll</span>
          </button>
          <button
            onClick={() => setActiveTab('sheet')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'sheet'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileMusic className="w-3.5 h-3.5 text-sky-400" />
            <span>Partitura</span>
          </button>
          <button
            onClick={() => setActiveTab('keyboard')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'keyboard'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Teclado Virtual</span>
          </button>
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'table'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Tabela de Notas</span>
          </button>
        </div>
      </div>

      {/* TAB: PARTITURA (SHEET MUSIC) */}
      {activeTab === 'sheet' && (
        <SheetMusicView
          generatorResult={generatorResult}
          activeNoteIndex={activeNoteIndex}
        />
      )}

      {/* TAB 1: PIANO ROLL GRID */}
      {activeTab === 'pianoroll' && (
        <div className="space-y-2">
          <div className="text-xs text-slate-400 flex items-center justify-between">
            <span>Grid Rítmico ({totalCompassos} compassos, {totalBeats.toFixed(1)} tempos)</span>
            {activeNote && (
              <span className="text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full text-[11px] animate-pulse">
                Tocando agora: {activeNote.pitch} (Comp {activeNote.measureNumber})
              </span>
            )}
          </div>

          <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-xl p-3">
            <div className="min-w-[600px] relative">
              {/* Pitch rows */}
              {sortedMidis.map((midi) => {
                const pitchStr = pitchMidiMap.get(midi) || '';
                const isAccidental = pitchStr.includes('#') || pitchStr.includes('b');

                return (
                  <div
                    key={midi}
                    className={`flex items-center h-7 border-b border-slate-900 ${
                      isAccidental ? 'bg-slate-900/60' : 'bg-slate-950'
                    }`}
                  >
                    {/* Pitch label */}
                    <div className="w-14 text-[11px] font-mono font-semibold text-slate-400 border-r border-slate-800 pr-2 text-right">
                      {pitchStr}
                    </div>

                    {/* Timeline row */}
                    <div className="flex-1 relative h-full">
                      {notas
                        .filter((n) => n.midiNumber === midi)
                        .map((n, idx) => {
                          const leftPct = (n.startTimeBeats / totalBeats) * 100;
                          const widthPct = Math.max(0.8, (n.durationBeats / totalBeats) * 100);
                          const isActive = activeNoteIndex === notas.findIndex((x) => x.id === n.id);

                          return (
                            <div
                              key={n.id || idx}
                              style={{
                                left: `${leftPct}%`,
                                width: `${widthPct}%`,
                              }}
                              className={`absolute top-1 bottom-1 rounded-md transition-all flex items-center justify-center text-[10px] font-bold overflow-hidden ${
                                isActive
                                  ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/50 scale-105 z-10'
                                  : 'bg-indigo-600/90 hover:bg-indigo-500 text-white border border-indigo-400/40'
                              }`}
                              title={`${n.pitch} | Tempo ${n.startTimeBeats.toFixed(2)} - ${n.endTimeBeats.toFixed(2)}`}
                            >
                              <span className="truncate px-0.5">{n.pitch}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VIRTUAL KEYBOARD */}
      {activeTab === 'keyboard' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            Notas destacadas da escala e iluminação em tempo real durante a execução:
          </p>
          <div className="overflow-x-auto bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="flex justify-center min-w-[500px]">
              {/* Render keyboard keys from C3 (midi 48) to C6 (midi 84) */}
              {Array.from({ length: 37 }, (_, i) => {
                const midi = 48 + i;
                const semitone = midi % 12;
                const isBlack = [1, 3, 6, 8, 10].includes(semitone);
                const nomes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
                const oct = Math.floor(midi / 12) - 1;
                const pitchName = `${nomes[semitone]}${oct}`;

                const isInScale = scaleNotes.includes(pitchName);
                const isActive = activeNote?.midiNumber === midi;

                return (
                  <div
                    key={midi}
                    className={`relative flex flex-col justify-end items-center select-none transition-colors border ${
                      isBlack
                        ? 'w-7 h-28 bg-slate-900 border-slate-950 -mx-3.5 z-10 rounded-b-md'
                        : 'w-10 h-40 bg-slate-100 border-slate-300 rounded-b-lg text-slate-800 z-0'
                    } ${
                      isActive
                        ? isBlack
                          ? '!bg-amber-400 border-amber-500 shadow-lg shadow-amber-400/50'
                          : '!bg-amber-300 border-amber-500 shadow-lg shadow-amber-400/50'
                        : isInScale
                        ? isBlack
                          ? 'bg-sky-950 border-sky-800'
                          : 'bg-sky-50 border-sky-200'
                        : ''
                    }`}
                  >
                    {isInScale && (
                      <span
                        className={`w-2 h-2 rounded-full mb-2 ${
                          isActive ? 'bg-slate-900 animate-ping' : 'bg-sky-500'
                        }`}
                      />
                    )}
                    <span
                      className={`text-[9px] font-mono mb-1 ${
                        isBlack ? 'text-slate-400' : 'text-slate-600'
                      } ${isActive ? '!text-slate-950 font-bold' : ''}`}
                    >
                      {pitchName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TABLE OF NOTES */}
      {activeTab === 'table' && (
        <div className="overflow-x-auto max-h-72 bg-slate-950 border border-slate-800 rounded-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800">
              <tr>
                <th className="p-2.5 font-semibold">#</th>
                <th className="p-2.5 font-semibold">Nota</th>
                <th className="p-2.5 font-semibold">MIDI</th>
                <th className="p-2.5 font-semibold">Freq (Hz)</th>
                <th className="p-2.5 font-semibold">Compasso</th>
                <th className="p-2.5 font-semibold">Tempo</th>
                <th className="p-2.5 font-semibold">Célula Rítmica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {notas.map((n, idx) => {
                const isActive = activeNoteIndex === idx;
                return (
                  <tr
                    key={n.id || idx}
                    className={`transition-colors ${
                      isActive ? 'bg-amber-500/20 text-amber-300 font-bold' : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <td className="p-2.5 text-slate-500">{idx + 1}</td>
                    <td className="p-2.5 font-bold text-sky-400">{n.pitch}</td>
                    <td className="p-2.5">{n.midiNumber}</td>
                    <td className="p-2.5">{n.freq.toFixed(1)} Hz</td>
                    <td className="p-2.5">Comp {n.measureNumber}</td>
                    <td className="p-2.5">{n.startTimeBeats.toFixed(2)}t</td>
                    <td className="p-2.5 text-emerald-400 font-sans">{n.rhythmTerm}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
