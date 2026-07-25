import { useState } from 'react';
import { VolumeIcon, BookmarkIcon, CheckIcon } from '../ui/Icons.jsx';

export default function WordDefinitionModal({ word, onClose, onSaveVocabulary }) {
  const [saved, setSaved] = useState(false);

  if (!word) return null;

  const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');

  const definitionsMap = {
    mist: { phonetic: '/mɪst/', fr: 'brume / brouillard', def: 'A cloud of tiny water droplets suspended in the atmosphere near the earth’s surface.', example: 'The mist rose slowly from the Gorée island shores.' },
    breeze: { phonetic: '/briːz/', fr: 'brise / vent doux', def: 'A light, gentle, and refreshing wind.', example: 'A ocean breeze blew through the old stone windows.' },
    lighthouse: { phonetic: '/ˈlaɪt.haʊs/', fr: 'phare maritime', def: 'A tower with a bright light at the top to guide ships at sea.', example: 'The lighthouse illuminated the dark ocean waves.' },
    fog: { phonetic: '/fɒɡ/', fr: 'brouillard épais', def: 'A thick cloud of water droplets at ground level that restricts visibility.', example: 'The morning fog obscured the ferry path.' },
    secret: { phonetic: '/ˈsiː.krət/', fr: 'secret', def: 'Something that is kept hidden or unexplained.', example: 'She kept the family secret buried for years.' },
  };

  const info = definitionsMap[cleanWord.toLowerCase()] || {
    phonetic: `/${cleanWord.toLowerCase()}/`,
    fr: `${cleanWord.toLowerCase()} (Français)`,
    def: `An essential English word commonly used in literature and conversation.`,
    example: `She noted the word "${cleanWord}" in her bilingual journal.`
  };

  const playPronunciation = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(cleanWord);
      utter.lang = 'en-US';
      window.speechSynthesis.speak(utter);
    }
  };

  const handleSave = () => {
    setSaved(true);
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    if (onSaveVocabulary) onSaveVocabulary(cleanWord, info.fr);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-paper border border-surface-line rounded-t-3xl sm:rounded-3xl p-6 relative shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-surface-line">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-[20px] text-ink capitalize">{cleanWord}</span>
            <span className="text-[12px] text-taupe font-mono">{info.phonetic}</span>
            <button
              onClick={playPronunciation}
              aria-label="Play pronunciation"
              className="w-7 h-7 rounded-full bg-gold/15 text-gold flex items-center justify-center hover:bg-gold/25"
            >
              <VolumeIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <button onClick={onClose} className="text-taupe text-lg font-bold hover:text-ink">
            ×
          </button>
        </div>

        {/* French Translation */}
        <div className="p-3 rounded-xl bg-gold/10 border border-gold/30">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-gold block mb-0.5">French Translation</span>
          <p className="font-display font-bold text-[14px] text-ink">{info.fr}</p>
        </div>

        {/* Definition & Example */}
        <div className="space-y-2">
          <div>
            <span className="text-[10px] font-bold text-taupe uppercase">Definition</span>
            <p className="text-[12.5px] text-ink leading-relaxed mt-0.5">{info.def}</p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-surface-line">
            <span className="text-[10px] font-bold text-taupe uppercase">Example Sentence</span>
            <p className="text-[12px] italic text-ink mt-0.5">"{info.example}"</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saved}
          className={`w-full py-3.5 rounded-xl font-bold text-[13px] shadow-sm flex items-center justify-center gap-2 transition-all ${
            saved
              ? 'bg-emerald-600 text-white'
              : 'bg-deep text-paper hover:bg-deep-2'
          }`}
        >
          {saved ? (
            <>
              <CheckIcon className="w-4 h-4" />
              <span>Saved to Vocabulary Notebook</span>
            </>
          ) : (
            <>
              <BookmarkIcon className="w-4 h-4 text-gold" />
              <span>Save Word to Vocabulary</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
