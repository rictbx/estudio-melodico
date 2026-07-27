import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ScaleCard } from './components/ScaleCard';
import { RhythmCard } from './components/RhythmCard';
import { PatternCard } from './components/PatternCard';
import { ChordCard } from './components/ChordCard';
import { AudioActionButtons } from './components/AudioActionButtons';
import { PianoRollVisualizer } from './components/PianoRollVisualizer';
import { ExportStandaloneModal } from './components/ExportStandaloneModal';
import { GitHubPublishModal } from './components/GitHubPublishModal';

import { DirecaoType, TimeSignatureType, WaveformType } from './types';
import {
  DEFAULT_ESCALAS,
  DEFAULT_RITMOS,
  DEFAULT_PADROES,
  DEFAULT_ACORDES,
  obterNotasEscala,
  obterNotasAcorde,
  obterCifraAcorde,
  gerarSequenciaProgressoes,
  getNotePitchInfo,
  baixarMidiFile,
} from './utils/musicTheory';
import { audioEngine } from './utils/audioEngine';

export default function App() {
  // Custom Dictionaries State
  const [escalasDict, setEscalasDict] = useState<Record<string, string>>({ ...DEFAULT_ESCALAS });
  const [ritmosDict, setRitmosDict] = useState<Record<string, string>>({ ...DEFAULT_RITMOS });
  const [padroesDict, setPadroesDict] = useState<Record<string, string>>({ ...DEFAULT_PADROES });
  const [acordesDict, setAcordesDict] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('custom_acordes');
      if (saved) return { ...DEFAULT_ACORDES, ...JSON.parse(saved) };
    } catch {
      // Ignore
    }
    return { ...DEFAULT_ACORDES };
  });

  // Control State
  const [tonica, setTonica] = useState<string>('A');
  const [oitavaBase, setOitavaBase] = useState<number>(4);
  const [escalaNome, setEscalaNome] = useState<string>('Menor Harmônica');
  const [ritmoNome, setRitmoNome] = useState<string>('Tercinas de Colcheia');
  const [padraoNome, setPadraoNome] = useState<string>('Linear Simples (1,2,3)');
  const [padraoFormula, setPadraoFormula] = useState<string>(DEFAULT_PADROES['Linear Simples (1,2,3)']);

  // Chord Control State
  const [acordeNome, setAcordeNome] = useState<string>('Sétima Maior com Nona - maj7(9) (1,3,5,7,9)');
  const [acordeTonica, setAcordeTonica] = useState<string>('A');
  const [acordeOitava, setAcordeOitava] = useState<number>(3);
  const [acordeRitmoNome, setAcordeRitmoNome] = useState<string>('Mínima (2t)');
  const [acordeAtivo, setAcordeAtivo] = useState<boolean>(true);

  const [notaInicial, setNotaInicial] = useState<string>('A4');
  const [notaInicialCustom, setNotaInicialCustom] = useState<string>('');
  const [direcao, setDirecao] = useState<DirecaoType>('asc');
  const [numCompassos, setNumCompassos] = useState<number>(8);
  const [bpm, setBpm] = useState<number>(120);
  const [timeSignature, setTimeSignature] = useState<TimeSignatureType>('4/4');

  const [waveform, setWaveform] = useState<WaveformType>('triangle');

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playingType, setPlayingType] = useState<'escala' | 'progressao' | 'acorde' | null>(null);
  const [activeNoteIndex, setActiveNoteIndex] = useState<number | null>(null);

  // Modal States
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

  // Dynamic system update timestamp for Version Stamp
  const formattedUpdateTimestamp = useMemo(() => {
    const now = new Date();
    return now.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Calculate available scale notes for current tonic/octave/scale formula
  const notasEscalaDisponiveis = useMemo(() => {
    const formula = escalasDict[escalaNome] || '1,2,3,4,5,6,7';
    return obterNotasEscala(tonica, oitavaBase, formula);
  }, [tonica, oitavaBase, escalaNome, escalasDict]);

  // Calculate computed chord notes
  const notasAcordeCalculadas = useMemo(() => {
    const formula = acordesDict[acordeNome] || '1,3,5';
    return obterNotasAcorde(acordeTonica, acordeOitava, formula);
  }, [acordeTonica, acordeOitava, acordeNome, acordesDict]);

  // Sync chord root with scale root if scale root changes
  useEffect(() => {
    setAcordeTonica(tonica);
  }, [tonica]);

  // Keep starting note synchronized with available scale notes if necessary
  useEffect(() => {
    if (notasEscalaDisponiveis.length > 0 && !notasEscalaDisponiveis.includes(notaInicial)) {
      setNotaInicial(notasEscalaDisponiveis[0]);
    }
  }, [notasEscalaDisponiveis, notaInicial]);

  // Subscribe audio engine active note callback
  useEffect(() => {
    audioEngine.setOnActiveNoteChange((idx) => {
      setActiveNoteIndex(idx);
    });
    return () => {
      audioEngine.stop();
    };
  }, []);

  // Calculate Sequence
  const generatorResult = useMemo(() => {
    const escalaFormula = escalasDict[escalaNome] || '1,2,3,4,5,6,7';
    const ritmoFormula = ritmosDict[ritmoNome] || 'colcheia';

    const notaAlvo = notaInicialCustom.trim() ? notaInicialCustom.trim() : notaInicial;
    const cifra = acordeAtivo ? obterCifraAcorde(acordeTonica, acordeNome) : undefined;

    return gerarSequenciaProgressoes({
      tonica,
      oitavaBase,
      escalaFormula,
      ritmoFormula,
      padraoFormula,
      padraoNome,
      acordeNome,
      cifraAcorde: cifra,
      acordeAtivo,
      notaInicial: notaAlvo,
      direcao,
      numCompassos,
      timeSignature,
    });
  }, [
    tonica,
    oitavaBase,
    escalaNome,
    escalasDict,
    ritmoNome,
    ritmosDict,
    padraoFormula,
    padraoNome,
    acordeNome,
    acordeTonica,
    acordeAtivo,
    notaInicial,
    notaInicialCustom,
    direcao,
    numCompassos,
    timeSignature,
  ]);

  // Handlers for Custom Dictionaries
  const handleSalvarEscala = (nome: string, formula: string) => {
    setEscalasDict((prev) => ({ ...prev, [nome]: formula }));
  };

  const handleExcluirEscala = (nome: string) => {
    if (Object.keys(escalasDict).length <= 1) return;
    setEscalasDict((prev) => {
      const copy = { ...prev };
      delete copy[nome];
      const firstKey = Object.keys(copy)[0];
      setEscalaNome(firstKey);
      return copy;
    });
  };

  const handleSalvarRitmo = (nome: string, formula: string) => {
    setRitmosDict((prev) => ({ ...prev, [nome]: formula }));
  };

  const handleExcluirRitmo = (nome: string) => {
    if (Object.keys(ritmosDict).length <= 1) return;
    setRitmosDict((prev) => {
      const copy = { ...prev };
      delete copy[nome];
      const firstKey = Object.keys(copy)[0];
      setRitmoNome(firstKey);
      return copy;
    });
  };

  const handleSalvarPadrao = (nome: string, formula: string) => {
    setPadroesDict((prev) => ({ ...prev, [nome]: formula }));
  };

  const handleExcluirPadrao = (nome: string) => {
    if (Object.keys(padroesDict).length <= 1) return;
    setPadroesDict((prev) => {
      const copy = { ...prev };
      delete copy[nome];
      const firstKey = Object.keys(copy)[0];
      setPadraoNome(firstKey);
      setPadraoFormula(copy[firstKey]);
      return copy;
    });
  };

  const handleSalvarAcorde = (nome: string, formula: string) => {
    setAcordesDict((prev) => {
      const updated = { ...prev, [nome]: formula };
      try {
        localStorage.setItem('custom_acordes', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const handleExcluirAcorde = (nome: string) => {
    if (Object.keys(acordesDict).length <= 1) return;
    setAcordesDict((prev) => {
      const copy = { ...prev };
      delete copy[nome];
      const firstKey = Object.keys(copy)[0];
      setAcordeNome(firstKey);
      try {
        localStorage.setItem('custom_acordes', JSON.stringify(copy));
      } catch {
        // Ignore
      }
      return copy;
    });
  };

  // Playback Handlers
  const handlePlayChord = () => {
    audioEngine.playChord(notasAcordeCalculadas, 2.0, waveform);
  };

  const handlePlayScale = () => {
    if (isPlaying && playingType === 'escala') {
      audioEngine.stop();
      setIsPlaying(false);
      setPlayingType(null);
      setActiveNoteIndex(null);
      return;
    }

    const scalePitchObjs = notasEscalaDisponiveis.map((p) => ({
      pitch: p,
      freq: getNotePitchInfo(p).freq,
    }));

    setIsPlaying(true);
    setPlayingType('escala');

    audioEngine.playScale(scalePitchObjs, bpm, waveform, () => {
      setIsPlaying(false);
      setPlayingType(null);
      setActiveNoteIndex(null);
    });
  };

  const handlePlayProgression = () => {
    if (isPlaying && playingType === 'progressao') {
      audioEngine.stop();
      setIsPlaying(false);
      setPlayingType(null);
      setActiveNoteIndex(null);
      return;
    }

    if (!generatorResult || generatorResult.notas.length === 0) return;

    setIsPlaying(true);
    setPlayingType('progressao');

    const chordAccompaniment = {
      enabled: acordeAtivo,
      notes: notasAcordeCalculadas,
      rhythmFormula: ritmosDict[acordeRitmoNome] || 'semibreve',
    };

    audioEngine.playProgression(generatorResult.notas, bpm, waveform, chordAccompaniment, () => {
      setIsPlaying(false);
      setPlayingType(null);
      setActiveNoteIndex(null);
    });
  };

  // MIDI Download Handler
  const handleDownloadMIDI = () => {
    if (!generatorResult || generatorResult.notas.length === 0) return;

    const tonicaClean = tonica.replace('#', 's');
    const escalaSlug = escalaNome.replace(/\s+/g, '').replace('#', 's');
    const ritmoSlug = ritmoNome.replace(/[\s+()]/g, '');
    const notaInicSlug = (notaInicialCustom || notaInicial).replace('#', 's');
    const padraoSlug = padraoFormula.replace(/[\s,#]/g, '');

    const fileNameBase = `${tonicaClean}_${escalaSlug}_${notaInicSlug}_${direcao}_Pad${padraoSlug}_${ritmoSlug}`;

    baixarMidiFile(generatorResult.notas, bpm, timeSignature, fileNameBase);
  };

  // Cache Clear and Force Reload Handler for GitHub Pages Updates
  const handleReloadVersion = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }
      localStorage.clear();
      sessionStorage.clear();
    } catch (err) {
      console.error('Erro ao limpar cache local:', err);
    } finally {
      window.location.reload();
    }
  };

  const currentProgressionConfig = useMemo(() => ({
    tonica,
    oitavaBase,
    escalaNome,
    ritmoNome,
    padraoNome,
    padraoFormula,
    notaInicial: notaInicialCustom.trim() ? notaInicialCustom.trim() : notaInicial,
    direcao,
    numCompassos,
    bpm,
    timeSignature,
    acordeNome,
    acordeTonica,
    acordeOitava,
    acordeRitmoNome,
    acordeAtivo,
  }), [
    tonica,
    oitavaBase,
    escalaNome,
    ritmoNome,
    padraoNome,
    padraoFormula,
    notaInicial,
    notaInicialCustom,
    direcao,
    numCompassos,
    bpm,
    timeSignature,
    acordeNome,
    acordeTonica,
    acordeOitava,
    acordeRitmoNome,
    acordeAtivo,
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Header
        waveform={waveform}
        setWaveform={setWaveform}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <ScaleCard
          tonica={tonica}
          setTonica={setTonica}
          escalaNome={escalaNome}
          setEscalaNome={setEscalaNome}
          escalasDict={escalasDict}
          onSalvarEscala={handleSalvarEscala}
          onExcluirEscala={handleExcluirEscala}
          oitavaBase={oitavaBase}
          setOitavaBase={setOitavaBase}
          onPlayScale={handlePlayScale}
          isPlaying={isPlaying}
          playingType={playingType}
          notasEscalaDisponiveis={notasEscalaDisponiveis}
          notaInicial={notaInicial}
          setNotaInicial={setNotaInicial}
          notaInicialCustom={notaInicialCustom}
          setNotaInicialCustom={setNotaInicialCustom}
          direcao={direcao}
          setDirecao={setDirecao}
          timeSignature={timeSignature}
          setTimeSignature={setTimeSignature}
        />

        <RhythmCard
          ritmoNome={ritmoNome}
          setRitmoNome={setRitmoNome}
          ritmosDict={ritmosDict}
          onSalvarRitmo={handleSalvarRitmo}
          onExcluirRitmo={handleExcluirRitmo}
          bpm={bpm}
          setBpm={setBpm}
          numCompassos={numCompassos}
          setNumCompassos={setNumCompassos}
          timeSignature={timeSignature}
          setTimeSignature={setTimeSignature}
        />

        <PatternCard
          padraoNome={padraoNome}
          setPadraoNome={setPadraoNome}
          padraoFormula={padraoFormula}
          setPadraoFormula={setPadraoFormula}
          padroesDict={padroesDict}
          onSalvarPadrao={handleSalvarPadrao}
          onExcluirPadrao={handleExcluirPadrao}
          onPlayProgression={handlePlayProgression}
          isPlaying={isPlaying}
          playingType={playingType}
        />

        <ChordCard
          acordeAtivo={acordeAtivo}
          setAcordeAtivo={setAcordeAtivo}
          acordeTonica={acordeTonica}
          setAcordeTonica={setAcordeTonica}
          acordeOitava={acordeOitava}
          setAcordeOitava={setAcordeOitava}
          acordeNome={acordeNome}
          setAcordeNome={setAcordeNome}
          acordesDict={acordesDict}
          onSalvarAcorde={handleSalvarAcorde}
          onExcluirAcorde={handleExcluirAcorde}
          acordeRitmoNome={acordeRitmoNome}
          setAcordeRitmoNome={setAcordeRitmoNome}
          ritmosDict={ritmosDict}
          onSalvarRitmo={handleSalvarRitmo}
          onExcluirRitmo={handleExcluirRitmo}
          notasAcordeCalculadas={notasAcordeCalculadas}
          onPlayChord={handlePlayChord}
          isPlaying={isPlaying}
          playingType={playingType}
        />

        <AudioActionButtons
          isPlaying={isPlaying}
          playingType={playingType}
          onPlayScale={handlePlayScale}
          onPlayProgression={handlePlayProgression}
          onDownloadMIDI={handleDownloadMIDI}
        />

        <PianoRollVisualizer
          generatorResult={generatorResult}
          activeNoteIndex={activeNoteIndex}
          scaleNotes={notasEscalaDisponiveis}
        />
      </main>

      {/* Dynamic Build Status & Version Stamp Footer */}
      <footer className="mt-8 py-6 px-4 border-t border-slate-800/80 bg-slate-950/80 text-center text-xs text-slate-400">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3">
          {/* Version Badge & Status Indicator */}
          <div className="flex items-center gap-2.5 flex-wrap justify-center w-full">
            <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 shadow-inner">
              <span className="relative flex h-2.5 w-2.5 items-center justify-center shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold text-slate-100 text-xs tracking-tight">
                Estúdio Melódico v2.5
              </span>
              <span className="text-slate-600 font-bold">•</span>
              <span className="text-slate-400 font-mono text-[11px]">
                {formattedUpdateTimestamp}
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ExportStandaloneModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        escalasDict={escalasDict}
        ritmosDict={ritmosDict}
        padroesDict={padroesDict}
        acordesDict={acordesDict}
        currentConfig={currentProgressionConfig}
      />

      {(import.meta.env.DEV || (typeof window !== 'undefined' && window.location.search.includes('dev=true'))) && (
        <GitHubPublishModal
          isOpen={isGitHubModalOpen}
          onClose={() => setIsGitHubModalOpen(false)}
          escalasDict={escalasDict}
          ritmosDict={ritmosDict}
          padroesDict={padroesDict}
          acordesDict={acordesDict}
          currentConfig={currentProgressionConfig}
        />
      )}
    </div>
  );
}
