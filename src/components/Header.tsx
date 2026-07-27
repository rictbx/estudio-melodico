import React from 'react';
import { Music, Sparkles, Volume2 } from 'lucide-react';
import { WaveformType } from '../types';
import { APP_VERSION } from '../utils/musicTheory';

interface HeaderProps {
  waveform: WaveformType;
  setWaveform: (val: WaveformType) => void;
  onOpenExportModal: () => void;
  onOpenGitHubModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  waveform,
  setWaveform,
  onOpenExportModal,
  onOpenGitHubModal,
}) => {
  const isDev = Boolean(
    import.meta.env.DEV || (typeof window !== 'undefined' && window.location.search.includes('dev=true'))
  );

  return (
    <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 py-3 sm:px-6">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-sky-500 rounded-xl text-white shadow-lg shadow-indigo-500/20">
            <Music className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-300 via-sky-200 to-teal-300 bg-clip-text text-transparent">
                Estúdio Melódico & Gerador MIDI
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {APP_VERSION}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Permutações melódicas, frases rítmicas, pré-escuta sintetizada e exportação MIDI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
          {/* Synth Waveform selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg p-1 text-xs">
            <Volume2 className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <select
              value={waveform}
              onChange={(e) => setWaveform(e.target.value as WaveformType)}
              className="bg-transparent text-slate-200 font-medium text-xs focus:outline-none cursor-pointer pr-1"
              title="Timbre do Sintetizador"
            >
              <option value="triangle" className="bg-slate-800 text-slate-200">
                Piano Soft (Triângulo)
              </option>
              <option value="sine" className="bg-slate-800 text-slate-200">
                Flauta (Senoide)
              </option>
              <option value="sawtooth" className="bg-slate-800 text-slate-200">
                Metal (Dente de Serra)
              </option>
              <option value="square" className="bg-slate-800 text-slate-200">
                8-Bit (Quadrada)
              </option>
            </select>
          </div>

          <button
            onClick={onOpenExportModal}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition flex items-center gap-1.5"
            title="Exportar como HTML Standalone"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Exportar HTML</span>
          </button>

          {isDev && onOpenGitHubModal && (
            <button
              onClick={onOpenGitHubModal}
              className="px-3 py-1.5 text-xs font-medium bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 rounded-lg border border-indigo-500/40 transition flex items-center gap-1.5"
              title="Publicar no GitHub Pages (Dev)"
            >
              <span>🚀 GitHub</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
