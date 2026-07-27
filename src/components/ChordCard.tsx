import React, { useState } from 'react';
import { Settings2, Plus, Minus, Trash2, ChevronDown, ChevronUp, Music, Layers, Music2, Play, Square } from 'lucide-react';
import { TONICAS } from '../utils/musicTheory';

interface ChordCardProps {
  acordeAtivo: boolean;
  setAcordeAtivo: (val: boolean) => void;
  acordeTonica: string;
  setAcordeTonica: (val: string) => void;
  acordeOitava: number;
  setAcordeOitava: (val: number) => void;
  acordeNome: string;
  setAcordeNome: (val: string) => void;
  acordesDict: Record<string, string>;
  onSalvarAcorde: (nome: string, formula: string) => void;
  onExcluirAcorde: (nome: string) => void;
  acordeRitmoNome: string;
  setAcordeRitmoNome: (val: string) => void;
  ritmosDict: Record<string, string>;
  onSalvarRitmo: (nome: string, formula: string) => void;
  onExcluirRitmo: (nome: string) => void;
  notasAcordeCalculadas: { pitch: string; midi: number; freq: number }[];
  onPlayChord: () => void;
  isPlaying?: boolean;
  playingType?: string | null;
}

export const ChordCard: React.FC<ChordCardProps> = ({
  acordeAtivo,
  setAcordeAtivo,
  acordeTonica,
  setAcordeTonica,
  acordeOitava,
  setAcordeOitava,
  acordeNome,
  setAcordeNome,
  acordesDict,
  onSalvarAcorde,
  onExcluirAcorde,
  acordeRitmoNome,
  setAcordeRitmoNome,
  ritmosDict,
  onSalvarRitmo,
  onExcluirRitmo,
  notasAcordeCalculadas,
  onPlayChord,
  isPlaying,
  playingType,
}) => {
  const [activePanel, setActivePanel] = useState<'none' | 'acorde' | 'ritmo'>('none');

  const isChordPlaying = isPlaying && playingType === 'acorde';

  // Chord Tension Inputs
  const [inputChordNome, setInputChordNome] = useState(acordeNome);
  const [inputChordFormula, setInputChordFormula] = useState(acordesDict[acordeNome] || '');

  // Chord Rhythm Inputs
  const [inputRitmoNome, setInputRitmoNome] = useState(acordeRitmoNome);
  const [inputRitmoFormula, setInputRitmoFormula] = useState(ritmosDict[acordeRitmoNome] || '');

  const toggleChordPanel = () => {
    if (activePanel !== 'acorde') {
      setInputChordNome(acordeNome);
      setInputChordFormula(acordesDict[acordeNome] || '');
      setActivePanel('acorde');
    } else {
      setActivePanel('none');
    }
  };

  const toggleRhythmPanel = () => {
    if (activePanel !== 'ritmo') {
      setInputRitmoNome(acordeRitmoNome);
      setInputRitmoFormula(ritmosDict[acordeRitmoNome] || '');
      setActivePanel('ritmo');
    } else {
      setActivePanel('none');
    }
  };

  // Tension builder
  const handleAddTension = (tensao: string) => {
    const atual = inputChordFormula.trim();
    if (atual) {
      setInputChordFormula(`${atual},${tensao}`);
    } else {
      setInputChordFormula(tensao);
    }
  };

  const handleSalvarAcorde = () => {
    if (inputChordNome.trim() && inputChordFormula.trim()) {
      onSalvarAcorde(inputChordNome.trim(), inputChordFormula.trim());
      setAcordeNome(inputChordNome.trim());
      setActivePanel('none');
    }
  };

  const handleExcluirAcorde = () => {
    onExcluirAcorde(acordeNome);
    setActivePanel('none');
  };

  // Rhythm builder
  const handleAddRhythmFigure = (figura: string) => {
    const atual = inputRitmoFormula.trim();
    if (atual) {
      setInputRitmoFormula(`${atual}, ${figura}`);
    } else {
      setInputRitmoFormula(figura);
    }
  };

  const handleSalvarRitmo = () => {
    if (inputRitmoNome.trim() && inputRitmoFormula.trim()) {
      onSalvarRitmo(inputRitmoNome.trim(), inputRitmoFormula.trim());
      setAcordeRitmoNome(inputRitmoNome.trim());
      setActivePanel('none');
    }
  };

  const handleExcluirRitmo = () => {
    onExcluirRitmo(acordeRitmoNome);
    setActivePanel('none');
  };

  const tensaoBotoes = ['1', '3', '3b', '4', '5', '5b', '5#', '7', '7b', '9', '9b', '9#', '11', '11#', '13', '13b'];

  return (
    <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold tracking-wider text-amber-400 uppercase flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          Acompanhamento Harmônico & Acorde (Tensões)
        </h2>
      </div>

      {/* Row 1: Chord Root & Chord Type / Tensions directly side-by-side */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-3">
        {/* Chord Root Tonality */}
        <div className="sm:col-span-4">
          <label className="block text-xs font-medium text-slate-400 mb-1">Tônica do Acorde</label>
          <select
            value={acordeTonica}
            onChange={(e) => setAcordeTonica(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 font-medium focus:outline-none focus:border-amber-500 transition cursor-pointer"
          >
            {TONICAS.map((t) => (
              <option key={t} value={t} className="bg-slate-900 text-slate-100">
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* Chord Structure/Tensions Selector */}
        <div className="sm:col-span-8">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-400">
              Tipo de Acorde / Tensões
            </label>
            <button
              type="button"
              onClick={toggleChordPanel}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border transition flex items-center gap-1 ${
                activePanel === 'acorde'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Settings2 className="w-3 h-3" />
              <span>Opções de Acorde</span>
              {activePanel === 'acorde' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
          <select
            value={acordeNome}
            onChange={(e) => {
              setAcordeNome(e.target.value);
              setInputChordNome(e.target.value);
              setInputChordFormula(acordesDict[e.target.value] || '');
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 font-medium focus:outline-none focus:border-amber-500 transition cursor-pointer truncate"
          >
            {Object.keys(acordesDict).map((nome) => (
              <option key={nome} value={nome} className="bg-slate-900 text-slate-100">
                {nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Accompaniment Toggle, Octave, and Accompaniment Rhythm */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
        {/* Toggle Harmonic Accompaniment */}
        <div className="sm:col-span-4 flex flex-col justify-between p-2.5 bg-slate-950/80 border border-slate-800 rounded-xl min-h-[66px]">
          <span className="text-xs font-medium text-slate-400">Ativar Acompanhamento</span>
          <label className="relative inline-flex items-center cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={acordeAtivo}
              onChange={(e) => setAcordeAtivo(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            <span className="ml-3 text-xs font-semibold text-slate-200">
              {acordeAtivo ? 'Tocar Junto' : 'Desativado'}
            </span>
          </label>
        </div>

        {/* Chord Octave Stepper */}
        <div className="sm:col-span-4">
          <label className="block text-xs font-medium text-slate-400 mb-1">Oitava do Acorde</label>
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-1 min-h-[46px]">
            <button
              type="button"
              onClick={() => setAcordeOitava(Math.max(1, acordeOitava - 1))}
              disabled={acordeOitava <= 1}
              className="w-11 h-11 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800/80 disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 shrink-0"
              aria-label="Diminuir Oitava do Acorde"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center px-1">
              <span className="text-base font-bold font-mono text-amber-300">
                {acordeOitava}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAcordeOitava(Math.min(6, acordeOitava + 1))}
              disabled={acordeOitava >= 6}
              className="w-11 h-11 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800/80 disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 shrink-0"
              aria-label="Aumentar Oitava do Acorde"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chord Rhythm Selector & Rhythm Options */}
        <div className="sm:col-span-4">
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-slate-400">
              Ritmo do Acorde
            </label>
            <button
              type="button"
              onClick={toggleRhythmPanel}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border transition flex items-center gap-1 ${
                activePanel === 'ritmo'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Music2 className="w-3 h-3" />
              <span>Opções</span>
              {activePanel === 'ritmo' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
          <select
            value={acordeRitmoNome}
            onChange={(e) => {
              setAcordeRitmoNome(e.target.value);
              setInputRitmoNome(e.target.value);
              setInputRitmoFormula(ritmosDict[e.target.value] || '');
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 font-medium focus:outline-none focus:border-amber-500 transition cursor-pointer truncate"
          >
            {Object.keys(ritmosDict).map((nome) => (
              <option key={nome} value={nome} className="bg-slate-900 text-slate-100">
                {nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Audio Play Button & Computed Notes Preview at Bottom */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {onPlayChord && (
          <button
            type="button"
            onClick={onPlayChord}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 border shadow-lg ${
              isChordPlaying
                ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400/40 shadow-amber-900/20 active:scale-95'
            }`}
          >
            {isChordPlaying ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>{isChordPlaying ? '⏹ Parar Acorde' : '▶ Ouvir Acorde'}</span>
          </button>
        )}

        <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs flex-1">
          <div className="flex items-center gap-2">
            <Music className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Notas ({acordeTonica} {acordeOitava}):</span>
            <span className="text-amber-300 font-mono font-bold">
              {notasAcordeCalculadas.map((n) => n.pitch).join(' - ') || 'Nenhuma nota'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <div>Fórmula: <strong className="text-slate-200 font-mono">{acordesDict[acordeNome]}</strong></div>
            <div>Ritmo: <strong className="text-amber-300 font-mono">{ritmosDict[acordeRitmoNome]}</strong></div>
          </div>
        </div>
      </div>

      {/* PANEL 1: Custom Chord Manager Options */}
      {activePanel === 'acorde' && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-950/40 -mx-5 -mb-5 p-5 rounded-b-2xl space-y-4 animate-fadeIn">
          <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Construtor de Acordes Personalizados (Tensões)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nome do Acorde</label>
              <input
                type="text"
                value={inputChordNome}
                onChange={(e) => setInputChordNome(e.target.value)}
                placeholder="Ex: maj7(#11,13)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Fórmula de Tensões (Graus)</label>
              <input
                type="text"
                value={inputChordFormula}
                onChange={(e) => setInputChordFormula(e.target.value)}
                placeholder="Ex: 1,3,5,7,9,11#,13"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1.5">
              Inserção Rápida de Graus e Tensões:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tensaoBotoes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleAddTension(t)}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-mono font-medium py-1 px-2.5 rounded-lg border border-slate-700 transition"
                >
                  +{t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleSalvarAcorde}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs py-2 px-4 rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Salvar Acorde</span>
            </button>

            {acordesDict[acordeNome] && (
              <button
                type="button"
                onClick={handleExcluirAcorde}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-medium text-xs py-2 px-3 rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Acorde</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* PANEL 2: Custom Rhythm Options for Chord */}
      {activePanel === 'ritmo' && (
        <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-950/40 -mx-5 -mb-5 p-5 rounded-b-2xl space-y-4 animate-fadeIn">
          <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
            <Music2 className="w-3.5 h-3.5" /> Construtor de Ritmo do Acorde (Acompanhamento)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nome do Ritmo do Acorde</label>
              <input
                type="text"
                value={inputRitmoNome}
                onChange={(e) => setInputRitmoNome(e.target.value)}
                placeholder="Ex: Syncopated Strumming"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Fórmula de Figuras Rítmicas</label>
              <input
                type="text"
                value={inputRitmoFormula}
                onChange={(e) => setInputRitmoFormula(e.target.value)}
                placeholder="Ex: minima, seminima, colcheia, colcheia"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <p className="text-[11px] text-slate-400 mb-1.5">Clique para inserir figuras rítmicas na sequência:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => handleAddRhythmFigure('seminima')}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-amber-600/30 border border-slate-800 hover:border-amber-500 text-slate-200 text-xs rounded-lg transition text-left flex items-center gap-1.5"
              >
                <span>𝅘𝅥</span>
                <span>Semínima (1t)</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddRhythmFigure('colcheia')}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-amber-600/30 border border-slate-800 hover:border-amber-500 text-slate-200 text-xs rounded-lg transition text-left flex items-center gap-1.5"
              >
                <span>♪</span>
                <span>Colcheia (0.5t)</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddRhythmFigure('semicolcheia')}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-amber-600/30 border border-slate-800 hover:border-amber-500 text-slate-200 text-xs rounded-lg transition text-left flex items-center gap-1.5"
              >
                <span>𝅘𝅥𝅯</span>
                <span>Semicolcheia</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddRhythmFigure('tercina')}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-amber-600/30 border border-slate-800 hover:border-amber-500 text-slate-200 text-xs rounded-lg transition text-left flex items-center gap-1.5"
              >
                <span>𝅘𝅥³</span>
                <span>Tercina (1/3t)</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddRhythmFigure('minima')}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-amber-600/30 border border-slate-800 hover:border-amber-500 text-slate-200 text-xs rounded-lg transition text-left flex items-center gap-1.5"
              >
                <span>𝅗𝅥</span>
                <span>Mínima (2t)</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddRhythmFigure('semibreve')}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-amber-600/30 border border-slate-800 hover:border-amber-500 text-slate-200 text-xs rounded-lg transition text-left flex items-center gap-1.5"
              >
                <span>𝅝</span>
                <span>Semibreve (4t)</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddRhythmFigure('seminima.')}
                className="px-2.5 py-1.5 bg-slate-900 hover:bg-amber-600/30 border border-slate-800 hover:border-amber-500 text-slate-200 text-xs rounded-lg transition text-left flex items-center gap-1.5"
              >
                <span>𝅘𝅥.</span>
                <span>Pontuado (*1.5)</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleSalvarRitmo}
              className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs py-2 px-4 rounded-xl transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Salvar Ritmo</span>
            </button>

            {ritmosDict[acordeRitmoNome] && (
              <button
                type="button"
                onClick={handleExcluirRitmo}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-medium text-xs py-2 px-3 rounded-xl transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir Ritmo</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
