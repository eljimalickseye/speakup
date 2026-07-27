import { useState, useEffect } from 'react';
import { VolumeIcon, BookmarkIcon, CheckIcon, PlusIcon } from '../ui/Icons.jsx';
import { useApp } from '../../context/AppContext.jsx';
import { translateEnToFr, translateFrToEn } from '../../lib/translate.js';

export default function WordDefinitionModal({ word, onClose, onSaveVocabulary }) {
  const { addVocabWord, savedVocab } = useApp();
  const [savedCount, setSavedCount] = useState(0);
  const [customMeaning, setCustomMeaning] = useState('');
  const [extraMeanings, setExtraMeanings] = useState([]);
  const [justSaved, setJustSaved] = useState(false);
  const [translatedWord, setTranslatedWord] = useState('');
  const [isFrenchInput, setIsFrenchInput] = useState(false);
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(true);

  const cleanWord = word ? word.replace(/[.,/#!$%^&*;:{}=\-_`~()"'«»]/g, '').trim() : '';

  // Dictionary for quick offline definitions & detection
  const definitionsMap = {
    mist: { isFr: false, phonetic: '/mɪst/', fr: 'brume / brouillard', en: 'mist', def: 'Atmospheric water vapor forming a thin cloud near ground.', example: 'The mist rose slowly from the Gorée island shores.' },
    breeze: { isFr: false, phonetic: '/briːz/', fr: 'brise / vent doux', en: 'breeze', def: 'A light, gentle, and refreshing wind.', example: 'An ocean breeze blew through the old stone windows.' },
    lighthouse: { isFr: false, phonetic: '/ˈlaɪt.haʊs/', fr: 'phare maritime', en: 'lighthouse', def: 'A tower with a bright light to guide ships at sea.', example: 'The lighthouse illuminated the dark ocean waves.' },
    fog: { isFr: false, phonetic: '/fɒɡ/', fr: 'brouillard épais', en: 'fog', def: 'A thick cloud of water droplets near ground.', example: 'The morning fog obscured the ferry path.' },
    secret: { isFr: false, phonetic: '/ˈsiː.krət/', fr: 'secret / mystère', en: 'secret', def: 'Something kept hidden or unexplained.', example: 'She kept the family secret buried for years.' },
    ocean: { isFr: false, phonetic: '/ˈoʊ.ʃən/', fr: 'océan / mer', en: 'ocean', def: 'A vast expanse of sea.', example: 'The Atlantic ocean glistened under the Dakar sun.' },
    key: { isFr: false, phonetic: '/kiː/', fr: 'clé / solution', en: 'key', def: 'An instrument to open a lock or a secret code.', example: 'She held the key tightly in her hand.' },
    alley: { isFr: false, phonetic: '/ˈæli/', fr: 'ruelle / ruelle étroite', en: 'alley', def: 'A narrow passageway between buildings.', example: 'Footsteps echoed softly along the narrow alley.' },

    // French Words Lookup Map
    brume: { isFr: true, phonetic: '/mɪst/', fr: 'brume', en: 'mist / fog', def: 'Vapeur d\'eau en suspension formant un nuage léger près du sol.', example: 'The mist rose slowly from the shores.' },
    brouillard: { isFr: true, phonetic: '/fɒɡ/', fr: 'brouillard', en: 'fog / mist', def: 'Nuage d\'eau épais près du sol réduisant la visibilité.', example: 'The morning fog obscured the ferry path.' },
    brise: { isFr: true, phonetic: '/briːz/', fr: 'brise', en: 'breeze / light wind', def: 'Vent léger, doux et rafraîchissant.', example: 'An ocean breeze blew through the windows.' },
    phare: { isFr: true, phonetic: '/ˈlaɪt.haʊs/', fr: 'phare', en: 'lighthouse / beacon', def: 'Tour munie d\'une source lumineuse puissante pour guider les navires.', example: 'The lighthouse illuminated the dark ocean waves.' },
    ruelle: { isFr: true, phonetic: '/ˈæli/', fr: 'ruelle', en: 'alley / narrow street', def: 'Voie de circulation très étroite entre des bâtiments.', example: 'Footsteps echoed softly along the narrow alley.' },
    océan: { isFr: true, phonetic: '/ˈoʊ.ʃən/', fr: 'océan', en: 'ocean / sea', def: 'Vaste étendue d\'eau salée.', example: 'The Atlantic ocean glistened under the sun.' },
    clé: { isFr: true, phonetic: '/kiː/', fr: 'clé', en: 'key / solution', def: 'Instrument servant à actionner la serrure.', example: 'She held the key tightly in her hand.' },
  };

  useEffect(() => {
    if (!cleanWord) return;

    let isMounted = true;
    setIsLoadingTranslation(true);

    const lookup = definitionsMap[cleanWord.toLowerCase()];
    if (lookup) {
      setIsFrenchInput(lookup.isFr);
      setTranslatedWord(lookup.isFr ? lookup.en : lookup.fr);
      setIsLoadingTranslation(false);
      return;
    }

    // Dynamic Live Detection & Translation
    const fetchTranslation = async () => {
      // Heuristic detection: if word contains French accents (é, è, à, ç, ê, ô) or ends in typical FR suffixes
      const isFrPattern = /[éèàçêâîôûù]/i.test(cleanWord);

      if (isFrPattern) {
        setIsFrenchInput(true);
        const enResult = await translateFrToEn(cleanWord);
        if (isMounted) {
          setTranslatedWord(enResult || cleanWord);
          setIsLoadingTranslation(false);
        }
      } else {
        // Try EN -> FR first
        const frResult = await translateEnToFr(cleanWord);
        if (isMounted) {
          // If translation is identical to input, test FR -> EN to see if it's a FR word without accents
          if (frResult.toLowerCase() === cleanWord.toLowerCase()) {
            const enResult = await translateFrToEn(cleanWord);
            if (enResult && enResult.toLowerCase() !== cleanWord.toLowerCase()) {
              setIsFrenchInput(true);
              setTranslatedWord(enResult);
            } else {
              setIsFrenchInput(false);
              setTranslatedWord(frResult);
            }
          } else {
            setIsFrenchInput(false);
            setTranslatedWord(frResult);
          }
          setIsLoadingTranslation(false);
        }
      }
    };

    fetchTranslation();

    return () => {
      isMounted = false;
    };
  }, [cleanWord]);

  if (!word) return null;

  const defaultInfo = definitionsMap[cleanWord.toLowerCase()] || {
    phonetic: `/${cleanWord.toLowerCase()}/`,
    fr: isFrenchInput ? cleanWord : (translatedWord || cleanWord),
    en: isFrenchInput ? (translatedWord || cleanWord) : cleanWord,
    def: isFrenchInput
      ? `Mot français courant. Traduction en anglais : "${translatedWord || cleanWord}".`
      : `Mot anglais littéraire. Traduction en français : "${translatedWord || cleanWord}".`,
    example: `Mot extrait du texte bilingue : "${cleanWord}".`
  };

  // Find if already in notebook
  const lookupEnWord = isFrenchInput ? (translatedWord || cleanWord) : cleanWord;
  const existingWord = savedVocab.find(
    (v) => v.en.toLowerCase() === lookupEnWord.toLowerCase() || v.fr.toLowerCase() === cleanWord.toLowerCase()
  );
  const existingMeanings = existingWord?.meanings || (existingWord?.fr ? [existingWord.fr] : []);

  const playPronunciation = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Always pronounce the English word for English learning
      const utterWord = isFrenchInput ? (translatedWord || cleanWord) : cleanWord;
      const utter = new SpeechSynthesisUtterance(utterWord);
      utter.lang = 'en-US';
      window.speechSynthesis.speak(utter);
    }
  };

  const handleAddExtraMeaningField = () => {
    if (!customMeaning.trim()) return;
    if (!extraMeanings.includes(customMeaning.trim())) {
      setExtraMeanings([...extraMeanings, customMeaning.trim()]);
    }
    setCustomMeaning('');
  };

  const handleSave = () => {
    const enWordToSave = isFrenchInput ? (translatedWord || cleanWord) : cleanWord;
    const frWordToSave = customMeaning.trim() || (isFrenchInput ? cleanWord : (translatedWord || cleanWord));

    addVocabWord(enWordToSave, frWordToSave, extraMeanings.join(' ; '));
    if (onSaveVocabulary) onSaveVocabulary(enWordToSave, frWordToSave);

    setSavedCount((prev) => prev + 1);
    setJustSaved(true);

    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(60);
    }

    setTimeout(() => {
      setJustSaved(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-paper border border-surface-line rounded-t-3xl sm:rounded-3xl p-6 relative shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-left">
        
        {/* Header Bar */}
        <div className="flex justify-between items-center pb-3 border-b border-surface-line">
          <div className="flex items-center gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-[22px] text-ink capitalize leading-none">{cleanWord}</span>
                <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isFrenchInput ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-gold/20 text-gold border border-gold/40'
                }`}>
                  {isFrenchInput ? 'Français 🇫🇷' : 'English 🇬🇧'}
                </span>
              </div>
              <span className="text-[11.5px] text-taupe font-mono mt-0.5 block">{defaultInfo.phonetic}</span>
            </div>

            <button
              onClick={playPronunciation}
              aria-label="Écouter la prononciation anglaise"
              className="w-8 h-8 rounded-full bg-gold/15 text-gold flex items-center justify-center hover:bg-gold/25 transition-colors ml-1"
              title="Prononciation audio en anglais"
            >
              <VolumeIcon className="w-4 h-4" />
            </button>
          </div>

          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-line/40 text-taupe text-lg font-bold hover:text-ink flex items-center justify-center">
            ×
          </button>
        </div>

        {/* Translation Banner (EN -> FR or FR -> EN) */}
        <div className="p-3.5 rounded-2xl bg-gold/15 border border-gold/40 space-y-1">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gold block">
            {isFrenchInput ? '🇬🇧 Traduction & Définition Anglaise :' : '🇫🇷 Traduction Française :'}
          </span>
          <p className="font-display font-bold text-[16px] text-ink flex items-center gap-2">
            {isLoadingTranslation ? (
              <span className="text-[13px] italic text-taupe">Traduction en cours...</span>
            ) : (
              <span>{translatedWord || defaultInfo.fr}</span>
            )}
          </p>
        </div>

        {/* Saved Count Badge if saved previously */}
        {existingWord && (
          <div className="flex items-center justify-between text-[11px] bg-gold/10 border border-gold/30 px-3 py-1.5 rounded-xl text-gold font-semibold">
            <span>Déjà dans votre carnet ({existingWord.timesSaved || 1} fois)</span>
            <span>{existingMeanings.length} signification(s)</span>
          </div>
        )}

        {/* Existing Meanings List */}
        {existingMeanings.length > 0 && (
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-taupe uppercase tracking-wider block">Signification(s) enregistrée(s) :</span>
            <div className="flex flex-wrap gap-1.5">
              {existingMeanings.map((m, idx) => (
                <span key={idx} className="text-[11.5px] font-bold px-2.5 py-1 rounded-lg bg-deep/5 text-deep border border-deep/15">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Add/Edit Custom French Meaning */}
        <div className="space-y-2">
          <label className="text-[10.5px] font-extrabold text-taupe uppercase tracking-wider block">
            {isFrenchInput ? 'Votre nuance ou note en français :' : 'Traduction ou signification personnelle :'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customMeaning}
              onChange={(e) => setCustomMeaning(e.target.value)}
              placeholder={`Ex: ${translatedWord || defaultInfo.fr}`}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-surface-line bg-white text-[13px] text-ink font-medium outline-none focus:border-gold"
            />
            <button
              type="button"
              onClick={handleAddExtraMeaningField}
              className="px-3 py-2.5 bg-surface-line/50 text-ink rounded-xl font-bold text-[12px] hover:bg-surface-line flex items-center gap-1"
              title="Ajouter comme signification secondaire"
            >
              <PlusIcon className="w-3.5 h-3.5" />
              <span>Autre</span>
            </button>
          </div>
        </div>

        {/* Extra Meanings Added in this modal session */}
        {extraMeanings.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10.5px] font-bold text-taupe block w-full">Nouvelles significations ajoutées :</span>
            {extraMeanings.map((m, idx) => (
              <span key={idx} className="text-[11.5px] font-bold px-2.5 py-0.5 rounded-md bg-gold/20 text-gold border border-gold/30 flex items-center gap-1">
                <span>{m}</span>
                <button
                  type="button"
                  onClick={() => setExtraMeanings(extraMeanings.filter((_, i) => i !== idx))}
                  className="text-red-500 font-bold text-[10px] ml-1"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Definition & Example */}
        <div className="space-y-2 pt-1">
          <div>
            <span className="text-[10px] font-bold text-taupe uppercase">Explication & Contexte</span>
            <p className="text-[12.5px] text-ink leading-relaxed mt-0.5">{defaultInfo.def}</p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-surface-line">
            <span className="text-[10px] font-bold text-taupe uppercase">Exemple d'usage</span>
            <p className="text-[12px] italic text-ink mt-0.5">"{defaultInfo.example}"</p>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className={`w-full py-3.5 rounded-xl font-bold text-[13px] shadow-sm flex items-center justify-center gap-2 transition-all ${
            justSaved
              ? 'bg-emerald-600 text-white scale-[0.99]'
              : 'bg-deep text-paper hover:bg-deep-2 active:scale-95'
          }`}
        >
          {justSaved ? (
            <>
              <CheckIcon className="w-4 h-4" />
              <span>Enregistré dans le Carnet de Vocabulaire !</span>
            </>
          ) : (
            <>
              <BookmarkIcon className="w-4 h-4 text-gold" />
              <span>
                {existingWord ? 'Ajouter cette signification au carnet' : 'Enregistrer le mot & signification'}
              </span>
            </>
          )}
        </button>

      </div>
    </div>
  );
}
