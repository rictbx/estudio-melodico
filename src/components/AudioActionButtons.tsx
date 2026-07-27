import React from 'react';
import { Download } from 'lucide-react';

interface AudioActionButtonsProps {
  isPlaying?: boolean;
  playingType?: 'escala' | 'progressao' | null;
  onPlayScale?: () => void;
  onPlayProgression?: () => void;
  onDownloadMIDI: () => void;
}

export const AudioActionButtons: React.FC<AudioActionButtonsProps> = ({
  onDownloadMIDI,
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl flex items-center justify-center">
      {/* Generate & Download MIDI Button */}
      <button
        type="button"
        onClick={onDownloadMIDI}
        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-emerald-600/30 border border-emerald-400/40 transition flex items-center justify-center gap-2.5 active:scale-[0.99]"
      >
        <Download className="w-5 h-5" />
        <span>Gerar e Baixar MIDI (.mid)</span>
      </button>
    </div>
  );
};

