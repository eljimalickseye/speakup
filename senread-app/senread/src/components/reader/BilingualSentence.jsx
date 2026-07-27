import { useState } from 'react';

/**
 * Signature reading element: the French translation sits beneath the
 * English sentence, smaller, italic, softened in tone - a second voice
 * you can choose to hear, keeping reading fully immersive.
 * Both English and French words are individually tappable for vocabulary definitions.
 */
export default function BilingualSentence({ en, fr, vocabWord, vocabFr, isLight, fontSize, lineHeight, fontFamily, onSelectWord }) {
  const [activeWordEn, setActiveWordEn] = useState(null);
  const [activeWordFr, setActiveWordFr] = useState(null);

  const enWords = en ? en.split(/(\s+)/) : [];
  const frWords = fr ? fr.split(/(\s+)/) : [];

  // Use passed fontSize or fallback to 16
  const mainSize = fontSize || 16;
  const frSize = Math.max(12, Math.round(mainSize * 0.83));
  const lh = lineHeight || 1.75;
  const ff = fontFamily || "'Newsreader', serif";

  // Dynamic contrast classes based on dark/light reading theme
  const mainTextColor = isLight ? '#1A1816' : '#F3F7F5';
  const frenchTextColor = isLight ? '#5C4D3C' : '#A3C2BD';
  const borderLineColor = isLight ? 'rgba(92,77,60,0.3)' : 'rgba(163,194,189,0.3)';

  const handleWordClick = (e, word, index, isFrench = false) => {
    e.stopPropagation();
    const clean = word.replace(/[.,/#!$%^&*;:{}=\-_`~()"'«»]/g, '').trim();
    if (!clean || clean.length <= 1) return;

    if (isFrench) {
      setActiveWordFr(activeWordFr === index ? null : index);
    } else {
      setActiveWordEn(activeWordEn === index ? null : index);
    }

    if (onSelectWord) {
      onSelectWord(clean, isFrench);
    }
  };

  return (
    <div className="mb-5 group">
      {/* English Sentence (Interactive Words) */}
      <p
        style={{
          fontFamily: ff,
          fontSize: `${mainSize}px`,
          lineHeight: lh,
          color: mainTextColor,
          textAlign: 'justify',
        }}
      >
        {enWords.map((w, i) => {
          if (/^\s+$/.test(w)) return <span key={i}>{w}</span>;
          return (
            <span
              key={i}
              onClick={(e) => handleWordClick(e, w, i, false)}
              className="cursor-pointer rounded px-0.5 transition-colors hover:bg-gold/20"
              style={
                activeWordEn === i
                  ? { backgroundColor: isLight ? 'rgba(245,200,80,0.4)' : 'rgba(200,169,81,0.3)', fontWeight: 500 }
                  : {}
              }
            >
              {w}
            </span>
          );
        })}
      </p>

      {/* French Translation Sentence (Interactive Words) */}
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
        {frWords.map((w, i) => {
          if (/^\s+$/.test(w)) return <span key={i}>{w}</span>;
          return (
            <span
              key={i}
              onClick={(e) => handleWordClick(e, w, i, true)}
              className="cursor-pointer rounded px-0.5 transition-colors hover:bg-emerald-500/20"
              style={
                activeWordFr === i
                  ? { backgroundColor: isLight ? 'rgba(76,175,138,0.3)' : 'rgba(76,175,138,0.4)', fontWeight: 500 }
                  : {}
              }
            >
              {w}
            </span>
          );
        })}
      </p>
    </div>
  );
}
