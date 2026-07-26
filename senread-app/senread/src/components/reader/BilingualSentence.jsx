import { useState } from 'react';

/**
 * Signature reading element: the French translation sits beneath the
 * English sentence, smaller, italic, softened in tone - a second voice
 * you can choose to hear, keeping reading fully immersive.
 */
export default function BilingualSentence({ en, fr, vocabWord, vocabFr, isLight }) {
  const [activeWord, setActiveWord] = useState(null);

  const words = en.split(/(\s+)/);

  // Dynamic contrast classes based on dark/light reading theme
  const mainTextColor = isLight ? 'text-[#1A1816]' : 'text-[#F3F7F5]';
  const frenchTextColor = isLight ? 'text-[#5C4D3C]' : 'text-[#A3C2BD]';
  const borderLineColor = isLight ? 'border-[#5C4D3C]/30' : 'border-[#A3C2BD]/30';
  const vocabTagBg = isLight ? 'bg-amber-600/15 text-amber-900 border-amber-600/30' : 'bg-gold/20 text-gold-soft border-gold/30';
  const highlightBg = isLight ? 'bg-amber-200/70 border-b border-amber-600 text-amber-950 font-semibold' : 'bg-gold/25 border-b border-gold-soft text-gold-soft';

  return (
    <div className="mb-6 group">
      <p className={`font-reading text-[16px] leading-relaxed ${mainTextColor}`}>
        {words.map((w, i) => {
          if (/^\s+$/.test(w)) return <span key={i}>{w}</span>;
          return (
            <span
              key={i}
              onClick={() => setActiveWord(activeWord === i ? null : i)}
              className={`cursor-pointer rounded px-0.5 transition-colors ${
                activeWord === i ? (isLight ? 'bg-amber-200/80 font-medium text-amber-950' : 'bg-gold/30 font-medium text-gold-soft') : ''
              }`}
            >
              {w}
            </span>
          );
        })}
      </p>

      <p className={`font-reading italic text-[13.5px] leading-snug ${frenchTextColor} mt-1.5 pl-3.5 border-l ${borderLineColor}`}>
        {fr}
      </p>
    </div>
  );
}
