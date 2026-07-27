import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Minus, Plus, Volume2, Activity, Music, Clock, Sparkles } from 'lucide-react';
import { metronomeEngine } from '../utils/metronomeEngine';
import { TimeSignatureType } from '../types';

interface MetronomeCardProps {
  bpm: number;
  setBpm: (val: number) => void;
  timeSignature?: TimeSignatureType;
  setTimeSignature?: (val: TimeSignatureType) => void;
  className?: string;
}

export const MetronomeCard: React.FC<MetronomeCardProps> = ({
  bpm,
  setBpm,
  timeSignature = '4/4',
  setTimeSignature,
  className = '',
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [activeBeatIndex, setActiveBeatIndex] = useState<number | null>(null);
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  // Parse total beats in a measure from time signature (e.g., '4/4' -> 4, '3/4' -> 3, '6/8' -> 6)
  const totalBeats = React.useMemo(() => {
    if (timeSignature === '3/4') return 3;
    if (timeSignature === '6/8') return 6;
    if (timeSignature === '2/4') return 2;
    return 4; // default 4/4
  }, [timeSignature]);

  // Subscribe to metronomeEngine state
  useEffect(() => {
    const unsubscribe = metronomeEngine.subscribe((running) => {
      setIsRunning(running);
      if (!running) {
        setActiveBeatIndex(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Update metronome engine BPM in real-time when prop changes
  useEffect(() => {
    metronomeEngine.setBpm(bpm);
  }, [bpm]);

  // Update beats per measure in real-time when time signature changes
  useEffect(() => {
    metronomeEngine.setBeatsPerMeasure(totalBeats);
  }, [totalBeats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      metronomeEngine.stop();
    };
  }, []);

  const handleToggleMetronome = () => {
    if (isRunning) {
      metronomeEngine.stop();
      setIsRunning(false);
      setActiveBeatIndex(null);
    } else {
      metronomeEngine.start(bpm, totalBeats, (beatIdx) => {
        setActiveBeatIndex(beatIdx);
      });
      setIsRunning(true);
    }
  };

  const handleBpmChange = (newVal: number) => {
    const clamped = Math.max(30, Math.min(260, newVal));
    setBpm(clamped);
  };

  // Tap Tempo calculation
  const handleTapTempo = () => {
    const now = Date.now();
    const newTapTimes = [...tapTimes, now].slice(-5); // keep last 5 taps
    setTapTimes(newTapTimes);

    if (newTapTimes.length > 1) {
      const intervals = [];
      for (let i = 1; i < newTapTimes.length; i++) {
        intervals.push(newTapTimes[i] - newTapTimes[i - 1]);
      }
      const avgIntervalMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      if (avgIntervalMs > 0) {
        const calculatedBpm = Math.round((60 / avgIntervalMs) * 1000);
        handleBpmChange(calculatedBpm);
      }
    }
  };

  // Calculate milliseconds per beat using (60 / bpm) * 1000
  const msPerBeat = Math.round((60 / Math.max(1, bpm)) * 1000);

  return (
    <div className={`bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wider text-amber-400 uppercase flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400 animate-pulse" />
          Metrônomo Digital
        </h2>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-800/50 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" /> Web Audio API
        </span>
      </div>

      {/* Main Display Box */}
      <div className="bg-slate-950 border border-amber-500/20 rounded-xl p-4 flex flex-col items-center justify-center gap-3">
        {/* Tempo Number & Label & Metronome Toggle Switch */}
        <div className="flex flex-col sm:flex-row items-center justify-between w-full border-b border-slate-800/80 pb-3 gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-amber-300">
              {bpm}
            </span>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              BPM
            </span>
          </div>

          {/* Toggle Switch (Liga / Desliga) */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800/90 rounded-xl px-3 py-1.5 shadow-inner">
            <span className="text-xs font-bold text-slate-200">Metrônomo:</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-black border transition ${
                isRunning
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/30 animate-pulse'
                  : 'bg-slate-950 text-slate-500 border-slate-800'
              }`}
            >
              {isRunning ? 'ON' : 'OFF'}
            </span>
            <button
              type="button"
              onClick={handleToggleMetronome}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950 ml-1 ${
                isRunning ? 'bg-amber-500' : 'bg-slate-800'
              }`}
              role="switch"
              aria-checked={isRunning}
              title={isRunning ? 'Desativar Metrônomo' : 'Ativar Metrônomo'}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow-md ring-0 transition duration-200 ease-in-out ${
                  isRunning ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Visual Beat Pulse Indicators */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 my-1">
          {Array.from({ length: totalBeats }).map((_, idx) => {
            const isActive = activeBeatIndex === idx && isRunning;
            const isAccentBeat = idx === 0;

            return (
              <div
                key={`beat-dot-${idx}`}
                className={`flex flex-col items-center transition-all duration-100 ${
                  isActive ? 'scale-125' : 'scale-100'
                }`}
              >
                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all ${
                    isActive
                      ? isAccentBeat
                        ? 'bg-amber-400 text-slate-950 border-amber-200 ring-4 ring-amber-400/40 shadow-lg shadow-amber-500/50'
                        : 'bg-amber-500 text-slate-950 border-amber-300 ring-4 ring-amber-500/30 shadow-md shadow-amber-500/30'
                      : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}
                >
                  {idx + 1}
                </div>
                <span className="text-[9px] font-mono text-slate-500 mt-1">
                  {isAccentBeat ? 'Forte' : 'Fraco'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Interval Formula Info Badge */}
        <div className="text-[11px] font-mono text-amber-200/90 bg-amber-950/40 px-3 py-1 rounded-lg border border-amber-800/30 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            Tempo entre cliques: <strong>{msPerBeat} ms</strong>
            <span className="text-slate-400 ml-1.5 font-normal">(Fórmula: (60 / {bpm}) × 1000 ms)</span>
          </span>
        </div>
      </div>

      {/* BPM Controls: Slider & Stepper Buttons */}
      <div className="space-y-3">
        {/* Slider */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
            <span>Lento (40 BPM)</span>
            <span>Rápido (240 BPM)</span>
          </div>
          <input
            type="range"
            min={40}
            max={240}
            value={bpm}
            onChange={(e) => handleBpmChange(Number(e.target.value))}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>

        {/* Stepper Buttons (-5, -1, +1, +5) */}
        <div className="flex items-center justify-between gap-1.5">
          <button
            type="button"
            onClick={() => handleBpmChange(bpm - 5)}
            className="flex-1 py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold rounded-lg border border-slate-800 transition active:scale-95"
          >
            -5
          </button>
          <button
            type="button"
            onClick={() => handleBpmChange(bpm - 1)}
            className="flex-1 py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold rounded-lg border border-slate-800 transition active:scale-95"
          >
            -1
          </button>
          <button
            type="button"
            onClick={() => handleBpmChange(bpm + 1)}
            className="flex-1 py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold rounded-lg border border-slate-800 transition active:scale-95"
          >
            +1
          </button>
          <button
            type="button"
            onClick={() => handleBpmChange(bpm + 5)}
            className="flex-1 py-1.5 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-mono font-bold rounded-lg border border-slate-800 transition active:scale-95"
          >
            +5
          </button>
        </div>

        {/* Preset Tempo Buttons & Tap Tempo */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
          {[
            { label: '60 (Largo)', value: 60 },
            { label: '90 (Andante)', value: 90 },
            { label: '120 (Moderato)', value: 120 },
            { label: '160 (Allegro)', value: 160 },
          ].map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleBpmChange(preset.value)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition ${
                bpm === preset.value
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {preset.label}
            </button>
          ))}

          {/* Tap Tempo Button */}
          <button
            type="button"
            onClick={handleTapTempo}
            className="px-3 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition active:scale-95"
            title="Clique ritmicamente para calcular o BPM"
          >
            <span>Tap Tempo</span>
          </button>
        </div>
      </div>

      {/* Main Play / Stop Button */}
      <div className="pt-2 border-t border-slate-800/80">
        <button
          type="button"
          onClick={handleToggleMetronome}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center gap-2.5 shadow-lg border ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 shadow-amber-500/20 animate-pulse'
              : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-amber-400/40 shadow-amber-900/30 active:scale-[0.99]'
          }`}
        >
          {isRunning ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              <span>Parar Metrônomo</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>Iniciar Metrônomo ({bpm} BPM)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
