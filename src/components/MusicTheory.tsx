import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Accidental, Formatter } from 'vexflow';

export interface MusicTheoryProps {
  notes?: string[];
  title?: string;
  clef?: 'treble' | 'bass';
  interactive?: boolean;
  onNoteClick?: (note: string, index: number) => void;
  className?: string;
}

// Convert standard note notation (e.g., 'C4', 'C#4', 'Db4') to VexFlow key format
function parseNoteToVexKey(noteStr: string): { key: string; accidental?: string } {
  const match = noteStr.trim().match(/^([A-Ga-g])([#b♯♭]?)(-?\d+)$/);
  if (!match) {
    return { key: 'c/4' };
  }
  const letter = match[1].toLowerCase();
  const accSymbol = match[2];
  const octave = match[3];

  let acc: string | undefined;
  if (accSymbol === '#' || accSymbol === '♯') acc = '#';
  else if (accSymbol === 'b' || accSymbol === '♭') acc = 'b';

  const key = acc ? `${letter}${acc}/${octave}` : `${letter}/${octave}`;
  return { key, accidental: acc };
}

export const MusicTheory: React.FC<MusicTheoryProps> = ({
  notes = ['C4', 'E4', 'G4'],
  title,
  clef = 'treble',
  interactive = true,
  onNoteClick,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous SVG contents
    containerRef.current.innerHTML = '';

    if (!notes || notes.length === 0) return;

    // Determine container width dynamically
    const containerWidth = containerRef.current.clientWidth || 450;
    const width = Math.max(300, containerWidth);
    const height = 135;

    try {
      const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
      renderer.resize(width, height);
      const context = renderer.getContext();

      // Draw Stave
      const staveX = 10;
      const staveY = 15;
      const staveWidth = width - 20;

      const stave = new Stave(staveX, staveY, staveWidth);
      stave.addClef(clef);
      stave.setContext(context).draw();

      // Create StaveNotes
      const staveNotes = notes.map((n) => {
        const { key, accidental } = parseNoteToVexKey(n);
        const staveNote = new StaveNote({
          keys: [key],
          duration: 'q',
          clef,
        });

        if (accidental) {
          staveNote.addModifier(new Accidental(accidental));
        }

        return staveNote;
      });

      // Format and Draw notes on stave
      Formatter.FormatAndDraw(context, stave, staveNotes);

      // Make note elements interactive if callback or interactive flag is active
      if (interactive && containerRef.current) {
        const noteSvgElements = containerRef.current.querySelectorAll('.vf-stavenote');
        noteSvgElements.forEach((el, idx) => {
          if (notes[idx]) {
            const htmlEl = el as HTMLElement;
            htmlEl.style.cursor = 'pointer';
            htmlEl.setAttribute('data-note', notes[idx]);
            htmlEl.setAttribute('title', `Tocar nota ${notes[idx]}`);

            // Add hover effect via CSS inline or class
            htmlEl.addEventListener('mouseenter', () => {
              htmlEl.style.opacity = '0.65';
              htmlEl.style.transform = 'scale(1.08)';
              htmlEl.style.transformOrigin = 'center';
              htmlEl.style.transition = 'all 0.15s ease';
            });

            htmlEl.addEventListener('mouseleave', () => {
              htmlEl.style.opacity = '1.0';
              htmlEl.style.transform = 'scale(1)';
            });

            htmlEl.onclick = (e) => {
              e.stopPropagation();
              if (onNoteClick) {
                onNoteClick(notes[idx], idx);
              }
            };
          }
        });
      }
    } catch (err) {
      console.error('Erro ao renderizar pauta VexFlow:', err);
    }
  }, [notes, clef, interactive, onNoteClick]);

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      {title && (
        <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between px-1">
          <span>{title}</span>
          <span className="text-[10px] text-slate-500 font-normal">Clave de Sol</span>
        </div>
      )}
      <div className="bg-amber-50/95 border border-amber-200/80 rounded-xl p-2.5 shadow-sm transition-all flex flex-col items-center justify-center">
        <div ref={containerRef} className="w-full flex justify-center items-center" />
      </div>
    </div>
  );
};

export default MusicTheory;
