import { useState } from 'react';

/**
 * Signature reading element: the French translation sits beneath the
 * English sentence, smaller, italic, softened in tone - a second voice
 * you can choose to hear, keeping reading fully immersive.
 */
export default function BilingualSentence({ en, fr, vocabWord, vocabFr, isLight, fontSize, lineHeight, fontFamily }) {
  const [activeWord, setActiveWord] = useState(null);

  const words = en.split(/(\s+)/);

  // Use passed fontSize or fallback to 16
  const mainSize = fontSize || 16;
  const frSize = Math.max(12, Math.round(mainSize * 0.83)); // French ~83% of main, min 12px
  const lh = lineHeight || 1.75;
  const ff = fontFamily || "'Newsreader', serif";

  // Dynamic contrast classes based on dark/light reading theme
  const mainTextColor = isLight ? '#1A1816' : '#F3F7F5';
  const frenchTextColor = isLight ? '#5C4D3C' : '#A3C2BD';
  const borderLineColor = isLight ? 'rgba(92,77,60,0.3)' : 'rgba(163,194,189,0.3)';

  return (
    <div className="mb-5 group">
      <p
        style={{
          fontFamily: ff,
          fontSize: `${mainSize}px`,
          lineHeight: lh,
          color: mainTextColor,
          textAlign: 'justify',
        }}
      >
        {words.map((w, i) => {
          if (/^\s+$/.test(w)) return <span key={i}>{w}</span>;
          return (
            <span
              key={i}
              onClick={() => setActiveWord(activeWord === i ? null : i)}
              className="cursor-pointer rounded px-0.5 transition-colors"
              style={
                activeWord === i
                  ? { backgroundColor: isLight ? 'rgba(245,200,80,0.4)' : 'rgba(200,169,81,0.3)', fontWeight: 500 }
                  : {}
              }
            >
              {w}
            </span>
          );
        })}
      </p>

      <p
        style={{
          fontFamily: ff,
          fontSize: `${frSize}px`,
          lineHeight: 1.5,
          color: frenchTextColor,
          fontStyle: 'italic',
          marginTop: '6px',
          paddingLeft: '14px',
          borderLeft: `2px solid ${borderLineColor}`,
        }}
      >
        {fr}
      </p>
    </div>
  );
}
