import React, { useState } from 'react';
import { Settings2, Plus, Trash2, ChevronDown, ChevronUp, Play, Square } from 'lucide-react';

interface PatternCardProps {
  padraoNome: string;
  setPadraoNome: (val: string) => void;
  padraoFormula: string;
  setPadraoFormula: (val: string) => void;
  padroesDict: Record<string, string>;
  onSalvarPadrao: (nome: string, formula: string) => void;
  onExcluirPadrao: (nome: string) => void;
  onPlayProgression?: () => void;
  isPlaying?: boolean;
  playingType?: string | null;
}

export const PatternCard: React.FC<PatternCardProps> = ({
  padraoNome,
  setPadraoNome,
  padraoFormula,
  setPadraoFormula,
  padroesDict,
  onSalvarPadrao,
  onExcluirPadrao,
  onPlayProgression,
  isPlaying,
  playingType,
}) => {
  const [isOpenPanel, setIsOpenPanel] = useState(false);
  const [inputNome, setInputNome] = useState(padraoNome);
  const [inputFormula, setInputFormula] = useState(padraoFormula);

  const isProgPlaying = isPlaying && playingType === 'progressao';

  const handleTogglePanel = () => {
    if (!isOpenPanel) {
      setInputNome(padraoNome);
      setInputFormula(padraoFormula);
    }
    setIsOpenPanel(!isOpenPanel);
  };

  const handleSalvar = () => {
    if (inputNome.trim() && inputFormula.trim()) {
      onSalvarPadrao(inputNome.trim(), inputFormula.trim());
      setPadraoNome(inputNome.trim());
      setPadraoFormula(inputFormula.trim());
      setIsOpenPanel(false);
    }
  };

  const handleExcluir = () => {
    onExcluirPadrao(padraoNome);
    setIsOpenPanel(false);
  };

  return (
    <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold tracking-wider text-amber-400 uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          Padrão Melódico / Permutação
        </h2>
        <button
          onClick={handleTogglePanel}
          className={`p-2 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
            isOpenPanel
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title="Opções do Padrão"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Opções</span>
          {isOpenPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Padrão Pré-definido
          </label>
          <select
            value={padraoNome}
            onChange={(e) => {
              const selected = e.target.value;
              setPadraoNome(selected);
              const f = padroesDict[selected] || '1,2,3';
              setPadraoFormula(f);
              setInputNome(selected);
              setInputFormula(f);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 font-medium focus:outline-none focus:border-amber-500 transition cursor-pointer"
          >
            {Object.keys(padroesDict).map((nome) => (
              <option key={nome} value={nome} className="bg-slate-900 text-slate-100">
                {nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Fórmula do Padrão (Editável)
          </label>
          <input
            type="text"
            value={padraoFormula}
            onChange={(e) => setPadraoFormula(e.target.value)}
            placeholder="Ex: 1,3,2,4 ou 1,2,2#,3"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-mono text-amber-300 font-semibold focus:outline-none focus:border-amber-500 transition"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {onPlayProgression && (
          <button
            type="button"
            onClick={onPlayProgression}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 border shadow-lg ${
              isProgPlaying
                ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/30 shadow-indigo-900/20 active:scale-95'
            }`}
          >
            {isProgPlaying ? (
              <Square className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>{isProgPlaying ? '⏹ Parar Progressão' : '▶ Ouvir Progressão'}</span>
          </button>
        )}

        <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex-1">
          Sequência de Graus:{' '}
          <strong className="text-amber-300 font-mono">{padraoFormula}</strong>
          <span className="text-[11px] text-slate-400 ml-2">
            (números representam saltos na escala e acidentes como 2# ou 7b)
          </span>
        </div>
      </div>

      {/* Editor Panel for Custom Patterns */}
      {isOpenPanel && (
        <div className="mt-4 p-4 bg-slate-950 border border-amber-500/30 rounded-xl space-y-3 animate-fadeIn">
          <div className="text-xs font-semibold text-amber-400 flex items-center justify-between">
            <span>Editor de Padrões Melódicos:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nome do Padrão</label>
              <input
                type="text"
                value={inputNome}
                onChange={(e) => setInputNome(e.target.value)}
                placeholder="Ex: Salto de Quinta"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Fórmula (Ex: 1,5,3,4)</label>
              <input
                type="text"
                value={inputFormula}
                onChange={(e) => setInputFormula(e.target.value)}
                placeholder="Ex: 1,5,3,4"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSalvar}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Salvar Padrão</span>
            </button>
            {Object.keys(padroesDict).length > 1 && (
              <button
                onClick={handleExcluir}
                className="bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-medium py-2 px-3 rounded-lg transition flex items-center gap-1.5"
                title="Excluir Padrão Selecionado"
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
