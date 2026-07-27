import React, { useState } from 'react';
import { Settings2, Plus, Minus, Trash2, ChevronDown, ChevronUp, Play, Square, ArrowUpRight, ArrowDownRight, Music, Sparkles } from 'lucide-react';
import { TONICAS } from '../utils/musicTheory';
import { DirecaoType, TimeSignatureType } from '../types';
import { MusicTheory } from './MusicTheory';
import { audioEngine } from '../utils/audioEngine';

interface ScaleCardProps {
  tonica: string;
  setTonica: (val: string) => void;
  escalaNome: string;
  setEscalaNome: (val: string) => void;
  escalasDict: Record<string, string>;
  onSalvarEscala: (nome: string, formula: string) => void;
  onExcluirEscala: (nome: string) => void;
  oitavaBase: number;
  setOitavaBase: (val: number) => void;
  onPlayScale?: () => void;
  isPlaying?: boolean;
  playingType?: string | null;

  // Execution and meter controls
  notasEscalaDisponiveis?: string[];
  notaInicial?: string;
  setNotaInicial?: (val: string) => void;
  notaInicialCustom?: string;
  setNotaInicialCustom?: (val: string) => void;
  direcao?: DirecaoType;
  setDirecao?: (val: DirecaoType) => void;
  timeSignature?: TimeSignatureType;
  setTimeSignature?: (val: TimeSignatureType) => void;
}

function getScaleDescription(escalaNome: string, tonica: string): string {
  const nameLower = escalaNome.toLowerCase();
  if (nameLower.includes('jônica') || nameLower.includes('maior')) {
    return `A escala Maior de ${tonica} possui sonoridade luminosa, equilibrada e consoante. É a base da harmonia funcional e do sistema tonal ocidental.`;
  }
  if (nameLower.includes('harmônica')) {
    return `A escala Menor Harmônica de ${tonica} possui o 7º grau elevado, gerando a tensão marcante da sensível com sonoridade expressiva, neoclássica e oriental.`;
  }
  if (nameLower.includes('melódica')) {
    return `A escala Menor Melódica de ${tonica} possui 3ª menor com 6ª e 7ª maiores, perfeita para condução de vozes e improvisação sobre acordes alterados.`;
  }
  if (nameLower.includes('eólica') || nameLower.includes('menor natural')) {
    return `A escala Menor Natural de ${tonica} possui sonoridade melancólica, profunda e introspectiva, amplamente utilizada no rock, pop e música folclórica.`;
  }
  if (nameLower.includes('dórica')) {
    return `O modo Dórico de ${tonica} é uma escala menor com 6ª maior, proporcionando um tom sofisticado e suave típico do jazz, funk e fusion.`;
  }
  if (nameLower.includes('frígia')) {
    return `O modo Frígio de ${tonica} traz a tensão da 2ª menor, criando uma atmosfera obscura, dramática e exótica (comum no flamenco e metal).`;
  }
  if (nameLower.includes('lídia')) {
    return `O modo Lídio de ${tonica} traz a 4ª aumentada (#4), gerando um caráter místico, etéreo e expansivo, popular em trilhas sonoras de cinema.`;
  }
  if (nameLower.includes('mixolídia')) {
    return `O modo Mixolídio de ${tonica} é a escala maior com 7ª menor (7b), fundamental no blues, rock clássico e música nordestina brasileira.`;
  }
  if (nameLower.includes('blues')) {
    return `A escala de Blues de ${tonica} adiciona a 'Blue Note' (5ª diminuta) à pentatônica menor, essencial para solos expressivos e cheios de alma.`;
  }
  if (nameLower.includes('pentatônica')) {
    return `A escala Pentatônica de ${tonica} é composta por 5 notas sem intervalos de semitom, extremamente versátil e melodiosa em qualquer estilo.`;
  }
  return `Escala de ${tonica} com sonoridade singular configurada pela fórmula de intervalos selecionada.`;
}

export const ScaleCard: React.FC<ScaleCardProps> = ({
  tonica,
  setTonica,
  escalaNome,
  setEscalaNome,
  escalasDict,
  onSalvarEscala,
  onExcluirEscala,
  oitavaBase,
  setOitavaBase,
  onPlayScale,
  isPlaying,
  playingType,
  notasEscalaDisponiveis = [],
  notaInicial = '',
  setNotaInicial,
  notaInicialCustom = '',
  setNotaInicialCustom,
  direcao = 'asc',
  setDirecao,
  timeSignature = '4/4',
  setTimeSignature,
}) => {
  const [isOpenPanel, setIsOpenPanel] = useState(false);
  const [inputNome, setInputNome] = useState(escalaNome);
  const [inputFormula, setInputFormula] = useState(escalasDict[escalaNome] || '');
  const [activeBadgeNote, setActiveBadgeNote] = useState<string | null>(null);

  const isScalePlaying = isPlaying && playingType === 'escala';

  const handleTogglePanel = () => {
    if (!isOpenPanel) {
      setInputNome(escalaNome);
      setInputFormula(escalasDict[escalaNome] || '');
    }
    setIsOpenPanel(!isOpenPanel);
  };

  const handleSalvar = () => {
    if (inputNome.trim() && inputFormula.trim()) {
      onSalvarEscala(inputNome.trim(), inputFormula.trim());
      setEscalaNome(inputNome.trim());
      setIsOpenPanel(false);
    }
  };

  const handleExcluir = () => {
    onExcluirEscala(escalaNome);
    setIsOpenPanel(false);
  };

  const handleNoteBadgeClick = (noteStr: string) => {
    setActiveBadgeNote(noteStr);
    audioEngine.playSingleNote(noteStr);
    setTimeout(() => {
      setActiveBadgeNote(null);
    }, 400);
  };

  const scaleDescription = getScaleDescription(escalaNome, tonica);

  return (
    <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wider text-sky-400 uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400"></span>
          Escala & Tônica Base
        </h2>
        <button
          onClick={handleTogglePanel}
          className={`p-2 rounded-lg text-xs font-medium border transition flex items-center gap-1.5 ${
            isOpenPanel
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
          title="Opções da Escala"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Opções</span>
          {isOpenPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Title & Description of Current Scale */}
      <div className="bg-slate-950/80 border border-sky-500/20 rounded-xl p-3.5 space-y-1.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            <h3 className="text-base font-bold text-slate-100 tracking-wide">
              Escala de <span className="text-sky-400">{tonica}</span> {escalaNome}
            </h3>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-sky-950/80 text-sky-300 border border-sky-800/50">
            Fórmula: {escalasDict[escalaNome]}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {scaleDescription}
        </p>
      </div>

      {/* Note Badges Section */}
      {notasEscalaDisponiveis.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium text-slate-300 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-sky-400" />
              Notas da Escala (Clique para ouvir):
            </span>
            <span className="text-[10px] text-slate-500">Oitava Base {oitavaBase}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {notasEscalaDisponiveis.map((n, idx) => {
              const isActive = activeBadgeNote === n;
              return (
                <button
                  key={`note-badge-${n}-${idx}`}
                  onClick={() => handleNoteBadgeClick(n)}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all duration-150 flex items-center gap-1.5 border shadow-sm ${
                    isActive
                      ? 'bg-sky-500 text-white border-sky-300 scale-105 ring-2 ring-sky-400/50'
                      : 'bg-slate-950 hover:bg-slate-800 text-sky-300 border-slate-800 hover:border-sky-500/50 active:scale-95'
                  }`}
                  title={`Tocar nota ${n}`}
                >
                  <span className="text-[10px] text-slate-400 font-sans font-normal border-r border-slate-700/80 pr-1.5">
                    {idx + 1}º
                  </span>
                  <span>{n}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MusicTheory VexFlow Component embedded directly below notes */}
      {notasEscalaDisponiveis.length > 0 && (
        <MusicTheory
          notes={notasEscalaDisponiveis}
          title={`Pauta Interativa (${tonica} ${escalaNome})`}
          clef="treble"
          interactive={true}
          onNoteClick={(note) => {
            handleNoteBadgeClick(note);
          }}
        />
      )}

      {/* Row 1: Tonica, Scale, Base Octave */}
      <div className="grid grid-cols-12 gap-3 pt-2">
        <div className="col-span-5 sm:col-span-3">
          <label className="block text-xs font-medium text-slate-400 mb-1">Tônica Principal</label>
          <select
            value={tonica}
            onChange={(e) => setTonica(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 font-medium focus:outline-none focus:border-sky-500 transition cursor-pointer"
          >
            {TONICAS.map((t) => (
              <option key={t} value={t} className="bg-slate-900 text-slate-100">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-7 sm:col-span-5">
          <label className="block text-xs font-medium text-slate-400 mb-1">Escala Musical</label>
          <select
            value={escalaNome}
            onChange={(e) => {
              setEscalaNome(e.target.value);
              setInputNome(e.target.value);
              setInputFormula(escalasDict[e.target.value] || '');
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 font-medium focus:outline-none focus:border-sky-500 transition cursor-pointer truncate"
          >
            {Object.keys(escalasDict).map((nome) => (
              <option key={nome} value={nome} className="bg-slate-900 text-slate-100">
                {nome}
              </option>
            ))}
          </select>
        </div>

        <div className="col-span-12 sm:col-span-4">
          <label className="block text-xs font-medium text-slate-400 mb-1">Oitava Base</label>
          <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-1 min-h-[46px]">
            <button
              type="button"
              onClick={() => setOitavaBase(Math.max(0, oitavaBase - 1))}
              disabled={oitavaBase <= 0}
              className="w-11 h-11 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800/80 disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 shrink-0"
              aria-label="Diminuir Oitava Base"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center px-2">
              <span className="text-base font-bold font-mono text-sky-400">
                {oitavaBase}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOitavaBase(Math.min(8, oitavaBase + 1))}
              disabled={oitavaBase >= 8}
              className="w-11 h-11 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800/80 disabled:opacity-30 disabled:pointer-events-none transition active:scale-95 shrink-0"
              aria-label="Aumentar Oitava Base"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Starting Note, Custom Note & Direction */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Starting Note Dropdown */}
        <div className="sm:col-span-4">
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Nota Inicial (Escala)
          </label>
          <select
            value={notaInicial}
            onChange={(e) => setNotaInicial?.(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 font-medium focus:outline-none focus:border-sky-500 transition cursor-pointer"
          >
            {notasEscalaDisponiveis.map((n) => (
              <option key={n} value={n} className="bg-slate-900 text-slate-100">
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Note Override */}
        <div className="sm:col-span-4">
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Personalizada (Opcional)
          </label>
          <input
            type="text"
            value={notaInicialCustom}
            onChange={(e) => setNotaInicialCustom?.(e.target.value)}
            placeholder="Ex: G#4, D5"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-sky-500 transition"
          />
        </div>

        {/* Direction */}
        <div className="sm:col-span-4">
          <label className="block text-xs font-medium text-slate-400 mb-1">Direção</label>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 min-h-[42px] items-center">
            <button
              type="button"
              onClick={() => setDirecao?.('asc')}
              className={`py-1.5 text-xs font-medium rounded-lg transition flex items-center justify-center gap-1 ${
                direcao === 'asc'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Asc</span>
            </button>
            <button
              type="button"
              onClick={() => setDirecao?.('desc')}
              className={`py-1.5 text-xs font-medium rounded-lg transition flex items-center justify-center gap-1 ${
                direcao === 'desc'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Desc</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer / Bottom Section: Playback Button */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-slate-800/80">
        {onPlayScale && (
          <button
            type="button"
            onClick={onPlayScale}
            className={`w-full sm:w-auto py-2.5 px-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg border shrink-0 ${
              isScalePlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 shadow-amber-500/20 animate-pulse'
                : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white border-sky-400/40 shadow-sky-900/30 active:scale-[0.99]'
            }`}
          >
            {isScalePlaying ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Parar Reprodução da Escala</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Ouvir Escala Musical</span>
              </>
            )}
          </button>
        )}

        <div className="text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 w-full sm:flex-1 flex items-center justify-between sm:justify-start gap-2">
          <span>
            Fórmula Selecionada:{' '}
            <strong className="text-sky-300 font-mono">{escalasDict[escalaNome]}</strong>
          </span>
        </div>
      </div>

      {/* Collapsible Panel for Custom Scales */}
      {isOpenPanel && (
        <div className="p-4 bg-slate-950 border border-sky-500/30 rounded-xl space-y-3 animate-fadeIn">
          <div className="text-xs font-semibold text-sky-400 flex items-center justify-between">
            <span>Editor de Escalas Personalizadas:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nome da Escala</label>
              <input
                type="text"
                value={inputNome}
                onChange={(e) => setInputNome(e.target.value)}
                placeholder="Ex: Pentatônica Menor"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Fórmula (Graus por vírgula)</label>
              <input
                type="text"
                value={inputFormula}
                onChange={(e) => setInputFormula(e.target.value)}
                placeholder="Ex: 1,3b,4,5,7b"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSalvar}
              className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium py-2 px-3 rounded-lg transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Salvar / Atualizar</span>
            </button>
            {Object.keys(escalasDict).length > 1 && (
              <button
                onClick={handleExcluir}
                className="bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-medium py-2 px-3 rounded-lg transition flex items-center gap-1.5"
                title="Excluir Escala Selecionada"
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
