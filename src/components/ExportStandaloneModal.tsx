import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Check, Sparkles, Code2 } from 'lucide-react';
import { APP_VERSION } from '../utils/musicTheory';
import { generateStandaloneHtml, ProgressionConfig } from '../utils/standaloneExporter';

interface ExportStandaloneModalProps {
  isOpen: boolean;
  onClose: () => void;
  escalasDict: Record<string, string>;
  ritmosDict: Record<string, string>;
  padroesDict: Record<string, string>;
  acordesDict?: Record<string, string>;
  currentConfig?: ProgressionConfig;
}

export const ExportStandaloneModal: React.FC<ExportStandaloneModalProps> = ({
  isOpen,
  onClose,
  escalasDict,
  ritmosDict,
  padroesDict,
  acordesDict,
  currentConfig,
}) => {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const htmlContent = generateStandaloneHtml(escalasDict, ritmosDict, padroesDict, acordesDict, currentConfig);

  const handleDownload = () => {
    try {
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estudio_melodico_${APP_VERSION}.html`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 200);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(htmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn overflow-y-auto"
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
          title="Fechar (Esc)"
        >
          <X className="w-4 h-4" />
          <span className="font-medium">Fechar</span>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Exportar HTML Standalone</h3>
            <p className="text-xs text-slate-400">Gere um arquivo único autônomo (.html) com todas as funções</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 mb-4 bg-slate-950 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
          O arquivo <code className="text-amber-400 font-mono">estudio_melodico.html</code> inclui toda a interface visual, sintetizador Web Audio, gerador MIDI e suas configurações personalizadas de escalas, ritmos e padrões para execução autônoma off-line.
        </p>

        <div className="flex items-center gap-3 mb-4 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleDownload}
            className="flex-1 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Baixar arquivo HTML</span>
          </button>
          <button
            onClick={handleCopy}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl border border-slate-700 transition flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
          </button>
          <button
            onClick={() => setShowCode(!showCode)}
            className="px-3 py-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium rounded-xl border border-slate-700 transition flex items-center gap-1.5 text-xs"
          >
            <Code2 className="w-4 h-4 text-sky-400" />
            <span>{showCode ? 'Ocultar Código' : 'Ver Código'}</span>
          </button>
        </div>

        {showCode && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-slate-400 mb-1">Código HTML Standalone completo:</label>
            <textarea
              readOnly
              value={htmlContent}
              className="w-full h-48 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-amber-300 focus:outline-none resize-none"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 shadow-sm"
          >
            <X className="w-4 h-4 text-slate-400" />
            <span>Voltar ao Estúdio Melódico</span>
          </button>
        </div>
      </div>
    </div>
  );
};
