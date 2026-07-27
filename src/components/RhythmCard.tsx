import React, { useState } from 'react';
import { Settings2, Plus, Minus, Trash2, ChevronDown, ChevronUp, CircleDot, Delete, Activity, Clock, Music2 } from 'lucide-react';
import { TimeSignatureType } from '../types';

interface RhythmCardProps {
  ritmoNome: string;
  setRitmoNome: (val: string) => void;
  ritmosDict: Record<string, string>;
  onSalvarRitmo: (nome: string, formula: string) => void;
  onExcluirRitmo: (nome: string) => void;
  bpm?: number;
  setBpm?: (val: number) => void;
  numCompassos?: number;
  setNumCompassos?: (val: number) => void;
  timeSignature?: TimeSignatureType;
  setTimeSignature?: (val: TimeSignatureType) => void;
}

const FIGURAS_NOTAS = [
  { name: 'Breve', value: 'breve', symbol: '𝄺', duration: '8t' },
  { name: 'Semibreve', value: 'semibreve', symbol: '𝅝', duration: '4t' },
  { name: 'Mínima', value: 'minima', symbol: '𝅗𝅥', duration: '2t' },
  { name: 'Semínima', value: 'seminima', symbol: '𝅘𝅥', duration: '1t' },
  { name: 'Colcheia', value: 'colcheia', symbol: '♪', duration: '0.5t' },
  { name: 'Semicolcheia', value: 'semicolcheia', symbol: '𝅘𝅥𝅯', duration: '0.25t' },
  { name: 'Fusa', value: 'fusa', symbol: '𝅘𝅥𝅰', duration: '1/8t' },
  { name: 'Semifusa', value: 'semifusa', symbol: '𝅘𝅥𝅱', duration: '1/16t' },
];

const FIGURAS_PAUSAS = [
  { name: 'Pausa de Breve', value: 'pausa de breve', symbol: '𝄻', duration: '8t' },
  { name: 'Pausa de Semibreve', value: 'pausa de semibreve', symbol: '𝄼', duration: '4t' },
  { name: 'Pausa de Mínima', value: 'pausa de minima', symbol: '𝄽', duration: '2t' },
  { name: 'Pausa de Semínima', value: 'pausa de seminima', symbol: '𝄾', duration: '1t' },
  { name: 'Pausa de Colcheia', value: 'pausa de colcheia', symbol: '𝄿', duration: '0.5t' },
  { name: 'Pausa de Semicolcheia', value: 'pausa de semicolcheia', symbol: '𝅀', duration: '0.25t' },
  { name: 'Pausa de Fusa', value: 'pausa de fusa', symbol: '𝅁', duration: '1/8t' },
  { name: 'Pausa de Semifusa', value: 'pausa de semifusa', symbol: '𝅂', duration: '1/16t' },
];

const FIGURAS_QUIALTERAS = [
  { name: 'Tercina de Semínima', value: 'tercina de seminima', symbol: '𝅘𝅥³', duration: '2/3t' },
  { name: 'Tercina de Colcheia', value: 'tercina de colcheia', symbol: '♪³', duration: '1/3t' },
  { name: 'Tercina de Semicolcheia', value: 'tercina de semicolcheia', symbol: '𝅘𝅥𝅯³', duration: '1/6t' },
  { name: 'Quintina de Semicolcheia', value: 'quintina de semicolcheia', symbol: '𝅘𝅥𝅯⁵', duration: '1/5t' },
];

export const RhythmCard: React.FC<RhythmCardProps> = ({
  ritmoNome,
  setRitmoNome,
  ritmosDict,
  onSalvarRitmo,
  onExcluirRitmo,
  bpm = 120,
  setBpm,
  numCompassos = 4,
  setNumCompassos,
  timeSignature = '4/4',
  setTimeSignature,
}) => {
  const [isOpenPanel, setIsOpenPanel] = useState(false);
  const [inputNome, setInputNome] = useState(ritmoNome);
  const [inputFormula, setInputFormula] = useState(ritmosDict[ritmoNome] || '');
  const [isDotActive, setIsDotActive] = useState(false);

  const handleTogglePanel = () => {
    if (!isOpenPanel) {
      setInputNome(ritmoNome);
      setInputFormula(ritmosDict[ritmoNome] || '');
    }
    setIsOpenPanel(!isOpenPanel);
  };

  const handleAddFigure = (figuraVal: string) => {
    let itemToInsert = figuraVal;
    if (isDotActive && !itemToInsert.includes('pontuada')) {
      itemToInsert += ' pontuada';
    }
    const atual = inputFormula.trim();
    if (atual) {
      setInputFormula(`${atual}, ${itemToInsert}`);
    } else {
      setInputFormula(itemToInsert);
    }
  };

  const handleRemoveLast = () => {
    const partes = inputFormula.split(',').map((x) => x.trim()).filter(Boolean);
    if (partes.length > 0) {
      partes.pop();
      setInputFormula(partes.join(', '));
    }
  };

  const handleApplyDotToLast = () => {
    const partes = inputFormula.split(',').map((x) => x.trim()).filter(Boolean);
    if (partes.length > 0) {
      const last = partes[partes.length - 1];
      if (!last.includes('pontuada')) {
        partes[partes.length - 1] = `${last} pontuada`;
        setInputFormula(partes.join(', '));
      }
    }
  };

  const handleSalvar = () => {
    if (inputNome.trim() && inputFormula.trim()) {
      onSalvarRitmo(inputNome.trim(), inputFormula.trim());
      setRitmoNome(inputNome.trim());
      setIsOpenPanel(false);
    }
  };

  const handleExcluir = () => {
    onExcluirRitmo(ritmoNome);
    setIsOpenPanel(false);
  };

  return (
    <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold tracking-wider text-emerald-400 uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          Célula Rítmica
        </h2>
        <button
          onClick={handleTogglePanel}
          className={`p-2 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
            isOpenPanel
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title="Opções de Célula Rítmica"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Opções & Construtor</span>
          {isOpenPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Pattern Selector */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Padrão de Figuras / Duração
        </label>
        <select
          value={ritmoNome}
          onChange={(e) => {
            setRitmoNome(e.target.value);
            setInputNome(e.target.value);
            setInputFormula(ritmosDict[e.target.value] || '');
          }}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 font-medium focus:outline-none focus:border-emerald-500 transition cursor-pointer truncate"
        >
          {Object.keys(ritmosDict).map((nome) => (
            <option key={nome} value={nome} className="bg-slate-900 text-slate-100">
              {nome}
            </option>
          ))}
        </select>
      </div>

      {/* Grouped Row: Fórmula de Compasso, Número de Compassos Stepper, and BPM Stepper */}
      <div className="grid grid-cols-12 gap-3 mb-4">
        {/* Fórmula de Compasso */}
        <div className="col-span-12 sm:col-span-4">
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
            <Music2 className="w-3.5 h-3.5 text-emerald-400" /> Fórmula de Compasso
          </label>
          <select
            value={timeSignature}
            onChange={(e) => setTimeSignature?.(e.target.value as TimeSignatureType)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-emerald-300 font-bold focus:outline-none focus:border-emerald-500 transition cursor-pointer min-h-[46px]"
          >
            <option value="4/4" className="bg-slate-900 text-slate-100">4/4 (Quaternário)</option>
            <option value="3/4" className="bg-slate-900 text-slate-100">3/4 (Ternário)</option>
            <option value="6/8" className="bg-slate-900 text-slate-100">6/8 (Composto)</option>
          </select>
        </div>

        {/* Compassos Stepper */}
        <div className="col-span-6 sm:col-span-4">
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-emerald-400" /> Compassos
          </label>
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-1 min-h-[46px]">
            <button
              type="button"
              onClick={() => setNumCompassos?.(Math.max(1, numCompassos - 1))}
              disabled={numCompassos <= 1}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800/80 disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 shrink-0"
              aria-label="Diminuir Compassos"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center px-1">
              <span className="text-base font-bold font-mono text-emerald-300">
                {numCompassos}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setNumCompassos?.(Math.min(16, numCompassos + 1))}
              disabled={numCompassos >= 16}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800/80 disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 shrink-0"
              aria-label="Aumentar Compassos"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BPM Stepper */}
        <div className="col-span-6 sm:col-span-4">
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" /> BPM (Andamento)
          </label>
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-1 min-h-[46px]">
            <button
              type="button"
              onClick={() => setBpm?.(Math.max(40, bpm - 1))}
              disabled={bpm <= 40}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800/80 disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 shrink-0"
              aria-label="Diminuir BPM"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center px-1">
              <span className="text-base font-bold font-mono text-emerald-300">
                {bpm}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBpm?.(Math.min(240, bpm + 1))}
              disabled={bpm >= 240}
              className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800/80 disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 shrink-0"
              aria-label="Aumentar BPM"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
        Sequência Rítmica Atual:{' '}
        <strong className="text-emerald-300 font-mono">{ritmosDict[ritmoNome]}</strong>
      </div>

      {/* Visual Rhythm Builder Panel */}
      {isOpenPanel && (
        <div className="mt-4 p-4 bg-slate-950 border border-emerald-500/30 rounded-xl space-y-4 animate-fadeIn">
          <div className="text-xs font-semibold text-emerald-400 flex items-center justify-between">
            <span>Editor Rítmico de Partitura Profissional:</span>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Nome da Célula Rítmica</label>
            <input
              type="text"
              value={inputNome}
              onChange={(e) => setInputNome(e.target.value)}
              placeholder="Ex: Galope Invertido com Pausa"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Modifier Toolbar */}
          <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-300">Modificadores & Ferramentas:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleApplyDotToLast}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-medium rounded-lg transition active:scale-95 min-h-[36px]"
                  title="Aplica ponto de aumento ao último elemento inserido"
                >
                  + Ponto ao Último
                </button>
                <button
                  type="button"
                  onClick={handleRemoveLast}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-[11px] font-medium rounded-lg transition flex items-center gap-1 active:scale-95 min-h-[36px]"
                  title="Remove o último item inserido"
                >
                  <Delete className="w-3.5 h-3.5" />
                  <span>Apagar Último</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputFormula('')}
                  className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-[11px] font-medium rounded-lg transition active:scale-95 min-h-[36px]"
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* Dot Toggle Button */}
            <button
              type="button"
              onClick={() => setIsDotActive(!isDotActive)}
              className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95 min-h-[44px] ${
                isDotActive
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <CircleDot className={`w-4 h-4 ${isDotActive ? 'animate-spin text-slate-950' : 'text-amber-400'}`} />
              <span>
                {isDotActive
                  ? '• Ponto de Aumento LIGADO (Multiplica por 1.5x ao clicar)'
                  : '• Ativar Ponto de Aumento (Modificador de Duração)'}
              </span>
            </button>
          </div>

          {/* Section 1: Figuras de Som (Notas) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-emerald-400 tracking-wide uppercase flex items-center gap-1.5">
              <span>🎼</span> Figuras de Som (Notas)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FIGURAS_NOTAS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleAddFigure(item.value)}
                  className="px-3 py-2.5 bg-slate-900 hover:bg-emerald-600/30 border border-slate-800 hover:border-emerald-500 text-slate-200 text-xs rounded-xl transition text-left flex items-center justify-between group active:scale-95 touch-manipulation min-h-[44px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base font-serif group-hover:scale-125 transition-transform shrink-0">{item.symbol}</span>
                    <span className="truncate font-medium text-slate-100">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/50 shrink-0 ml-1">
                    {item.duration}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Pausas (Silêncio) */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-sky-400 tracking-wide uppercase flex items-center gap-1.5">
              <span>🔇</span> Pausas (Silêncio)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FIGURAS_PAUSAS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleAddFigure(item.value)}
                  className="px-3 py-2.5 bg-slate-900 hover:bg-sky-600/30 border border-slate-800 hover:border-sky-500 text-slate-200 text-xs rounded-xl transition text-left flex items-center justify-between group active:scale-95 touch-manipulation min-h-[44px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base font-serif text-sky-300 group-hover:scale-125 transition-transform shrink-0">{item.symbol}</span>
                    <span className="truncate font-medium text-slate-200">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800/50 shrink-0 ml-1">
                    {item.duration}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Quiálteras (Tercinas e Quintinas) */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-semibold text-purple-400 tracking-wide uppercase flex items-center gap-1.5">
              <span>📐</span> Quiálteras (Tercinas e Quintinas)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FIGURAS_QUIALTERAS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleAddFigure(item.value)}
                  className="px-3 py-2.5 bg-slate-900 hover:bg-purple-600/30 border border-slate-800 hover:border-purple-500 text-slate-200 text-xs rounded-xl transition text-left flex items-center justify-between group active:scale-95 touch-manipulation min-h-[44px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base font-serif text-purple-300 group-hover:scale-125 transition-transform shrink-0">{item.symbol}</span>
                    <span className="truncate font-medium text-slate-100">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400 bg-purple-950/80 px-1.5 py-0.5 rounded border border-purple-800/50 shrink-0 ml-1">
                    {item.duration}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Fórmula Resultante</label>
            <input
              type="text"
              value={inputFormula}
              onChange={(e) => setInputFormula(e.target.value)}
              placeholder="Ex: colcheia, pausa de colcheia, semicolcheia, semicolcheia"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSalvar}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 min-h-[44px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Salvar Célula Rítmica</span>
            </button>
            {Object.keys(ritmosDict).length > 1 && (
              <button
                onClick={handleExcluir}
                className="bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-medium py-2.5 px-3 rounded-xl transition flex items-center gap-1.5 active:scale-95 min-h-[44px]"
                title="Excluir Rítmo Selecionado"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

