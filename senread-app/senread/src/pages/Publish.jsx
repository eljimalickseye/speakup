import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import {
  LockIcon,
  CheckIcon,
  PenToolIcon,
  SparklesIcon,
  BookOpenIcon,
  TrashIcon,
  PlusIcon,
  VolumeIcon,
  CoinIcon,
  ImageIcon,
  BackIcon,
  FolderIcon,
} from '../components/ui/Icons.jsx';
import { covers } from '../lib/api.js';
import { CoverArt } from '../components/ui/primitives.jsx';
import NotionChapterEditor from '../components/editor/NotionChapterEditor.jsx';

export default function Publish() {
  const { addNewBook, updateBook, booksList, userProfile, isCreatorStudioPublic, appLanguage } = useApp();
  const isEn = appLanguage === 'en';
  const location = useLocation();
  const navigate = useNavigate();

  // Check if editing an existing book
  const editBookId = location.state?.editBookId;
  const existingBook = booksList.find((b) => b.id === editBookId);

  // Persistent studio unlock check
  const [unlocked, setUnlocked] = useState(() => {
    return userProfile.role === 'admin' || userProfile.role === 'author' || isCreatorStudioPublic || localStorage.getItem('koko_studio_unlocked') === 'true';
  });

  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  
  // Studio Step (1: Infos & Couverture, 2: Chapitres & Coins, 3: Publication)
  const [step, setStep] = useState(1);
  
  // Novel Metadata Form State
  const [title, setTitle] = useState(existingBook?.title || '');
  const [author, setAuthor] = useState(existingBook?.author || userProfile.name || '');
  const [genre, setGenre] = useState(existingBook?.genres?.[0] || 'Romance');
  const [level, setLevel] = useState(existingBook?.level || 'B1 · Anglais Intermédiaire');
  const [selectedCover, setSelectedCover] = useState(existingBook?.cover || 'c1');
  const [customCoverUrl, setCustomCoverUrl] = useState(existingBook?.customCoverUrl || '');
  const [description, setDescription] = useState(existingBook?.description || '');
  
  // Multi-Chapter State with Author-Defined Coin Price
  const [chapters, setChapters] = useState(existingBook?.chaptersData || [
    {
      id: 1,
      title: 'Chapitre 1 : Les Rives du Fleuve',
      isPaid: false,
      coinPrice: 0,
      audioFileName: '',
      audioUrl: '',
      sentences: [
        { en: 'The sun set over Dakar, turning the Atlantic ocean into gold.', fr: 'Le soleil se couchait sur Dakar, transformant l\'océan Atlantique en or.', vocabWord: 'ocean', vocabFr: 'océan' },
        { en: 'She kept the key warm in her pocket, waiting for the night.', fr: 'Elle gardait la clé tiède dans sa poche, en attendant la nuit.', vocabWord: 'clé' },
      ]
    },
    {
      id: 2,
      title: 'Chapitre 2 : Les Secrets de la Nuit',
      isPaid: true,
      coinPrice: 10,
      audioFileName: '',
      audioUrl: '',
      sentences: [
        { en: 'Footsteps echoed softly along the narrow alley.', fr: 'Des pas résonnaient doucement le long de la ruelle étroite.', vocabWord: 'alley', vocabFr: 'ruelle' },
      ]
    }
  ]);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);

  // Paste Text Auto-Splitter Modal State
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const [published, setPublished] = useState(false);
  const [lastSaved, setLastSaved] = useState('');
  const audioInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLastSaved(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (pin.trim() === '1234') {
      setUnlocked(true);
      localStorage.setItem('koko_studio_unlocked', 'true');
      setPinError('');
    } else {
      setPinError('Code PIN Administrateur incorrect. PIN démo : 1234');
    }
  };

  // Persistent Base64 Audio File Upload Handler
  const handleAudioFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const updatedChapters = [...chapters];
      updatedChapters[activeChapterIndex].audioFileName = file.name;
      updatedChapters[activeChapterIndex].audioUrl = dataUrl;
      setChapters(updatedChapters);
    };
    reader.readAsDataURL(file);
  };

  // Persistent Base64 Custom Cover Image Upload Handler
  const handleCoverFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setCustomCoverUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Process Pasted Text
  const handleProcessPastedText = () => {
    if (!pastedText.trim()) return;
    const lines = pastedText.split('\n').filter(l => l.trim().length > 0);
    const newSentences = [];
    
    for (let i = 0; i < lines.length; i += 2) {
      newSentences.push({
        en: lines[i] || '',
        fr: lines[i + 1] || '[Traduction à compléter]',
        vocabWord: '',
        vocabFr: '',
      });
    }

    if (newSentences.length > 0) {
      const updatedChapters = [...chapters];
      updatedChapters[activeChapterIndex].sentences = newSentences;
      setChapters(updatedChapters);
    }
    setShowPasteModal(false);
    setPastedText('');
  };

  // Sentence Manipulation
  const currentChapter = chapters[activeChapterIndex] || chapters[0];

  const handleAddSentence = () => {
    const updated = [...chapters];
    updated[activeChapterIndex].sentences.push({ en: '', fr: '', vocabWord: '', vocabFr: '' });
    setChapters(updated);
  };

  const handleRemoveSentence = (index) => {
    if (currentChapter.sentences.length <= 1) return;
    const updated = [...chapters];
    updated[activeChapterIndex].sentences = updated[activeChapterIndex].sentences.filter((_, idx) => idx !== index);
    setChapters(updated);
  };

  const handleMoveSentence = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= currentChapter.sentences.length) return;
    const updated = [...chapters];
    const sentencesCopy = [...updated[activeChapterIndex].sentences];
    const temp = sentencesCopy[index];
    sentencesCopy[index] = sentencesCopy[targetIdx];
    sentencesCopy[targetIdx] = temp;
    updated[activeChapterIndex].sentences = sentencesCopy;
    setChapters(updated);
  };

  const handleAddChapter = () => {
    const newChapNum = chapters.length + 1;
    const newChap = {
      id: Date.now(),
      title: `Chapitre ${newChapNum} : Titre du Chapitre`,
      isPaid: true,
      coinPrice: 10,
      audioFileName: '',
      audioUrl: '',
      sentences: [{ en: '', fr: '', vocabWord: '', vocabFr: '' }]
    };
    setChapters([...chapters, newChap]);
    setActiveChapterIndex(chapters.length);
  };

  const handlePublish = (e, targetStatus = 'PUBLISHED') => {
    if (e) e.preventDefault();
    const bookObj = {
      id: editBookId || ('koko-' + Date.now()),
      title: title.trim() || (isEn ? 'New Koko Story' : 'Nouveau Roman Koko'),
      author: author.trim() || userProfile.name || (isEn ? 'Koko Author' : 'Auteur Koko'),
      cover: selectedCover,
      customCoverUrl: customCoverUrl,
      genres: [genre],
      level: level,
      rating: existingBook?.rating || 5.0,
      chapterCount: chapters.length,
      readingTime: `${chapters.length * 2}h 15m`,
      description: description.trim() || (isEn ? 'An immersive bilingual story on Koko.' : 'Un roman bilingue immersif composé sur Koko.'),
      chaptersData: chapters,
      status: targetStatus, // 'PUBLISHED' vs 'DRAFT'
    };

    if (editBookId) {
      updateBook(bookObj);
    } else {
      addNewBook(bookObj);
    }

    setPublished(targetStatus);
  };

  if (!unlocked && userProfile.role !== 'admin' && userProfile.role !== 'author' && !isCreatorStudioPublic) {
    return (
      <div className="px-5 pt-8 pb-6 flex flex-col items-center text-center text-ink">
        <div className="w-14 h-14 rounded-full bg-surface border border-surface-line flex items-center justify-center text-deep mb-4 shadow-sm">
          <LockIcon className="w-6 h-6" />
        </div>
        <span className="text-[10.5px] font-bold uppercase tracking-widest text-taupe mb-1">Accès Restreint Auteur</span>
        <h1 className="font-display font-bold text-[22px] mb-2">Studio Créateur & Édition Koko</h1>
        <p className="text-[12.5px] text-taupe max-w-xs mb-6">
          L'écriture de romans est actuellement réservée à l'administrateur et aux auteurs certifiés.
        </p>

        <form onSubmit={handleVerifyPin} className="w-full max-w-xs space-y-3 bg-white p-5 rounded-2xl border border-surface-line shadow-sm">
          <label className="block text-left text-[10.5px] font-bold text-taupe uppercase tracking-wider">
            Entrer le Code PIN Studio
          </label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN (Démo: 1234)"
            className="w-full text-center px-4 py-3 rounded-xl border border-surface-line text-[14px] font-mono outline-none focus:border-gold"
          />
          {pinError && <p className="text-[11px] text-red-600 font-semibold">{pinError}</p>}
          <button
            type="submit"
            className="w-full bg-deep text-paper py-3.5 rounded-xl font-bold text-[13px] shadow-sm hover:opacity-90 transition-all"
          >
            Déverrouiller le Studio
          </button>
        </form>
      </div>
    );
  }

  if (published) {
    return (
      <div className="px-5 pt-12 pb-6 text-center text-ink">
        <div className="w-16 h-16 rounded-full bg-gold/20 text-gold flex items-center justify-center mx-auto mb-4 border border-gold/40 shadow-sm">
          <CheckIcon className="w-8 h-8" />
        </div>
        <h1 className="font-display font-bold text-[24px] mb-2 flex items-center justify-center gap-1.5">
          <span>{editBookId ? 'Roman Modifié avec Succès !' : 'Roman Publié avec Succès !'}</span>
          <SparklesIcon className="w-5 h-5 text-gold" />
        </h1>
        <p className="text-[13px] text-taupe max-w-xs mx-auto mb-6">
          "{title || 'Nouveau Roman'}" ({chapters.length} chapitres) a été enregistré et mis à jour sur Koko.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-deep text-paper px-6 py-3.5 rounded-xl font-bold text-[13px] shadow-sm"
        >
          Retour au Catalogue des Romans
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-4 pb-6 text-ink">
      {/* Studio Header Bar with Back Button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate(-1)}
            title="Retour"
            className="w-8.5 h-8.5 rounded-full bg-white border border-surface-line flex items-center justify-center text-ink hover:border-gold transition-colors shadow-sm active:scale-95"
          >
            <BackIcon className="w-4 h-4 text-ink" />
          </button>

          <div className="flex items-center gap-1.5">
            <PenToolIcon className="w-4 h-4 text-gold" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-taupe">
              {editBookId ? 'Édition de Roman' : 'Studio Éditeur Koko'}
            </span>
          </div>
        </div>

        {lastSaved && <span className="text-[10px] text-taupe italic">Sauvegardé à {lastSaved}</span>}
      </div>

      <h1 className="font-display font-bold text-[22px] mb-5 text-left">
        {editBookId ? `Modifier "${existingBook?.title}"` : 'Créateur d\'eBook Bilingue'}
      </h1>

      {/* Step Tabs */}
      <div className="flex border-b border-surface-line mb-6 text-center">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`flex-1 text-[12px] font-semibold pb-2.5 transition-colors ${
            step === 1 ? 'text-ink border-b-2 border-gold font-bold' : 'text-taupe'
          }`}
        >
          1. Livre & Couverture
        </button>
        <button
          type="button"
          onClick={() => setStep(2)}
          className={`flex-1 text-[12px] font-semibold pb-2.5 transition-colors ${
            step === 2 ? 'text-ink border-b-2 border-gold font-bold' : 'text-taupe'
          }`}
        >
          2. Chapitres & Coins ({chapters.length})
        </button>
        <button
          type="button"
          onClick={() => setStep(3)}
          className={`flex-1 text-[12px] font-semibold pb-2.5 transition-colors ${
            step === 3 ? 'text-ink border-b-2 border-gold font-bold' : 'text-taupe'
          }`}
        >
          3. Publication
        </button>
      </div>

      {step === 1 ? (
        <form className="space-y-4 text-left">
          {/* Live Cover Preview & Custom Image Upload */}
          <div className="bg-white border border-surface-line rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <CoverArt gradient={covers[selectedCover]} className="w-20 h-28 flex-shrink-0 relative overflow-hidden flex items-center justify-center p-1">
              {customCoverUrl ? (
                <img
                  src={customCoverUrl}
                  alt="Couverture personnalisée"
                  onError={() => setCustomCoverUrl('')}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-display italic font-bold text-[9.5px] p-1 text-center leading-tight block line-clamp-4 max-w-full break-words overflow-hidden drop-shadow">
                  {title || 'Titre du Roman'}
                </span>
              )}
            </CoverArt>

            <div className="space-y-1 text-left flex-1 min-w-0 overflow-hidden">
              <span className="text-[10px] font-bold text-gold uppercase tracking-wider block">Aperçu Couverture</span>
              <h3 className="font-display font-bold text-[14px] leading-tight text-ink break-words line-clamp-2">{title || 'Titre de votre Roman'}</h3>
              <p className="text-[11px] text-taupe truncate">par {author || 'Votre Nom d’Auteur'}</p>

              {/* Upload Custom Image Button */}
              <div className="pt-1">
                <input
                  type="file"
                  accept="image/*,.svg"
                  ref={coverInputRef}
                  onChange={handleCoverFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="text-[10.5px] font-bold text-deep bg-surface border border-surface-line px-2.5 py-1.5 rounded-xl hover:border-gold flex items-center gap-1.5 shadow-sm"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-gold" />
                  <span>Importer Image (SVG / PNG / JPG)</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-taupe uppercase mb-1">Titre du Roman*</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Le Secret de l'Île de Gorée"
              className="w-full px-4 py-3 rounded-xl bg-white border border-surface-line text-[13px] outline-none focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-taupe uppercase mb-1">Nom d'Auteur*</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="ex: Aminata Sow Fall"
              className="w-full px-4 py-3 rounded-xl bg-white border border-surface-line text-[13px] outline-none focus:border-gold"
            />
          </div>

          {/* VIBRANT & FUNCTIONAL COVER STYLE SELECTOR */}
          <div className="space-y-2">
            <label className="block text-[10.5px] font-bold text-taupe uppercase">Sélection du Style de Couverture</label>
            <div className="grid grid-cols-6 gap-2">
              {['c1', 'c2', 'c3', 'c4', 'c5', 'c6'].map((covKey) => (
                <button
                  key={covKey}
                  type="button"
                  onClick={() => {
                    setSelectedCover(covKey);
                    setCustomCoverUrl('');
                  }}
                  className={`h-20 rounded-xl overflow-hidden border-2 transition-all relative flex items-center justify-center ${
                    selectedCover === covKey && !customCoverUrl
                      ? 'border-gold ring-2 ring-gold scale-105 shadow-md'
                      : 'border-surface-line opacity-80 hover:opacity-100'
                  }`}
                >
                  <CoverArt gradient={covers[covKey]} className="w-full h-full text-[8px] flex items-center justify-center p-1">
                    {selectedCover === covKey && !customCoverUrl ? (
                      <span className="w-5 h-5 rounded-full bg-gold text-paper flex items-center justify-center font-bold text-[10px] shadow-sm">
                        ✓
                      </span>
                    ) : (
                      <span className="text-[9px] font-bold opacity-80 uppercase">{covKey}</span>
                    )}
                  </CoverArt>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10.5px] font-bold text-taupe uppercase mb-1">Genre Littéraire</label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-3 py-3 rounded-xl bg-white border border-surface-line text-[13px] outline-none"
              >
                <option value="Romance">Romance</option>
                <option value="Fiction Littéraire">Fiction Littéraire</option>
                <option value="Mystère & Thriller">Mystère & Thriller</option>
                <option value="Contes & Folklore">Contes & Folklore</option>
                <option value="Drame Historique">Drame Historique</option>
              </select>
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-taupe uppercase mb-1">Niveau CEFR Anglais</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-3 rounded-xl bg-white border border-surface-line text-[13px] outline-none"
              >
                <option value="A1 · Débutant">A1 · Débutant</option>
                <option value="A2 · Élémentaire">A2 · Élémentaire</option>
                <option value="B1 · Intermédiaire">B1 · Intermédiaire</option>
                <option value="B2 · Avancé">B2 · Avancé</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10.5px] font-bold text-taupe uppercase mb-1">Synopsis Bilingue (Résumé)*</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Résumé captivant de l'histoire en Anglais et Français..."
              className="w-full px-4 py-3 rounded-xl bg-white border border-surface-line text-[13px] outline-none focus:border-gold"
            />
          </div>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="w-full bg-deep text-paper py-3.5 rounded-xl font-bold text-[13px] mt-2 shadow-sm"
          >
            Suivant : Définir les Prix en Coins des Chapitres →
          </button>
        </form>
      ) : step === 2 ? (
        <form className="space-y-4 text-left">
          {/* Multi-Chapter Tabs Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {chapters.map((chap, idx) => (
              <button
                key={chap.id}
                type="button"
                onClick={() => setActiveChapterIndex(idx)}
                className={`px-3.5 py-2 rounded-xl text-[12px] font-bold whitespace-nowrap border transition-all ${
                  activeChapterIndex === idx
                    ? 'bg-gold text-paper border-gold shadow-sm'
                    : 'bg-white border-surface-line text-taupe'
                }`}
              >
                Chapitre {idx + 1} {chap.isPaid ? `(${chap.coinPrice} Coins)` : '(Gratuit)'}
              </button>
            ))}
            <button
              type="button"
              onClick={handleAddChapter}
              className="w-9 h-9 rounded-xl bg-white border border-dashed border-gold text-gold hover:bg-gold/10 flex items-center justify-center font-extrabold text-[18px] flex-shrink-0 shadow-sm transition-all"
              title="Ajouter un Chapitre"
            >
              +
            </button>
          </div>

          {/* Active Chapter Details */}
          <div className="bg-white border border-surface-line rounded-2xl p-4 space-y-4 shadow-sm">
            <div>
              <label className="block text-[10.5px] font-bold text-taupe uppercase mb-1">Titre du Chapitre*</label>
              <input
                type="text"
                value={currentChapter.title}
                onChange={(e) => {
                  const updated = [...chapters];
                  updated[activeChapterIndex].title = e.target.value;
                  setChapters(updated);
                }}
                placeholder="ex: Chapitre 1 : L’Ombre du Phare"
                className="w-full px-4 py-3 rounded-xl bg-paper border border-surface-line text-[13px] outline-none focus:border-gold"
              />
            </div>

            {/* Author-Defined Chapter Pricing */}
            <div className="p-3.5 rounded-2xl bg-paper border border-surface-line space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-taupe uppercase flex items-center gap-1.5">
                  <CoinIcon className="w-4 h-4 text-gold" />
                  Tarification du Chapitre par l’Auteur
                </span>

                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                  currentChapter.isPaid ? 'bg-gold/20 text-gold border-gold/40' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  {currentChapter.isPaid ? `Payant : ${currentChapter.coinPrice} Coins` : 'Gratuit (Chapitre 1)'}
                </span>
              </div>

              {activeChapterIndex === 0 ? (
                <p className="text-[11px] text-taupe italic">
                  *Le Chapitre 1 est obligatoirement gratuit pour permettre aux lecteurs d'essayer le roman.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9.5px] font-bold text-taupe uppercase mb-1">Accès du Chapitre</label>
                    <select
                      value={currentChapter.isPaid ? 'paid' : 'free'}
                      onChange={(e) => {
                        const updated = [...chapters];
                        updated[activeChapterIndex].isPaid = e.target.value === 'paid';
                        if (e.target.value === 'free') updated[activeChapterIndex].coinPrice = 0;
                        else if (updated[activeChapterIndex].coinPrice === 0) updated[activeChapterIndex].coinPrice = 10;
                        setChapters(updated);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-surface-line text-[12px] font-semibold outline-none"
                    >
                      <option value="free">Chapitre Gratuit</option>
                      <option value="paid">Payant en Coins</option>
                    </select>
                  </div>

                  {currentChapter.isPaid && (
                    <div>
                      <label className="block text-[9.5px] font-bold text-taupe uppercase mb-1">Prix en Coins (Défini par l'Auteur)</label>
                      <input
                        type="number"
                        min={5}
                        max={100}
                        step={5}
                        value={currentChapter.coinPrice}
                        onChange={(e) => {
                          const updated = [...chapters];
                          updated[activeChapterIndex].coinPrice = Number(e.target.value);
                          setChapters(updated);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-surface-line text-[12px] font-bold text-gold outline-none"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Smart Audio Upload */}
            <div className="p-3.5 rounded-2xl bg-surface border border-surface-line space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-taupe uppercase flex items-center gap-1.5">
                  <VolumeIcon className="w-4 h-4 text-gold" />
                  Narration Audio du Chapitre
                </span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {currentChapter.audioFileName ? 'Audio Chargé' : 'Fichier ou URL'}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="file"
                  accept="audio/*"
                  ref={audioInputRef}
                  onChange={handleAudioFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="flex-1 bg-white border border-surface-line text-ink py-2.5 rounded-xl text-[12px] font-bold hover:border-gold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <VolumeIcon className="w-4 h-4 text-gold" />
                  <span>Uploader mon Fichier Audio (MP3/M4A)</span>
                </button>
              </div>

              {currentChapter.audioFileName && (
                <div className="bg-white p-2.5 rounded-xl border border-surface-line flex items-center justify-between text-[11.5px]">
                  <span className="font-semibold text-ink truncate">{currentChapter.audioFileName}</span>
                  {currentChapter.audioUrl && (
                    <audio controls src={currentChapter.audioUrl} className="h-7 max-w-[160px]" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* NOTION / GOOGLE DOCS STYLE BILINGUAL CHAPTER EDITOR */}
          <NotionChapterEditor
            chapter={currentChapter}
            onUpdateChapter={(updatedChap) => {
              const updated = [...chapters];
              updated[activeChapterIndex] = updatedChap;
              setChapters(updated);
            }}
          />

          <button
            type="button"
            onClick={() => setStep(3)}
            className="w-full bg-deep text-paper py-3.5 rounded-xl font-bold text-[13px] mt-4 shadow-sm"
          >
            Suivant : Récapitulatif & Enregistrement →
          </button>
        </form>
      ) : (
        <form onSubmit={handlePublish} className="space-y-4 text-left">
          <div className="bg-white border border-surface-line rounded-2xl p-4 shadow-sm space-y-3">
            <span className="text-[10.5px] font-bold text-gold uppercase tracking-wider block">Récapitulatif Global</span>
            
            <div className="space-y-1">
              <h3 className="font-display font-bold text-[16px] break-words line-clamp-2">{title || 'Sans titre'}</h3>
              <p className="text-[12px] text-taupe">par {author || 'Auteur Koko'} · {chapters.length} Chapitres</p>
              <div className="flex gap-2 text-[10px] font-bold pt-1">
                <span className="bg-gold/15 text-gold px-2.5 py-0.5 rounded-full">{genre}</span>
                <span className="bg-emerald-50 text-emerald-600 px-2.5 py-0.5 rounded-full border border-emerald-200">{level}</span>
              </div>
            </div>

            <div className="border-t border-surface-line pt-3 space-y-2">
              {chapters.map((ch) => (
                <div key={ch.id} className="bg-paper p-3 rounded-xl border border-surface-line text-[12px] flex justify-between items-center">
                  <div>
                    <span className="font-bold text-ink block">{ch.title}</span>
                    <span className="text-[10.5px] text-taupe">{ch.sentences.length} phrases</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${
                    ch.isPaid ? 'bg-gold/20 text-gold border-gold/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                  }`}>
                    {ch.isPaid ? `${ch.coinPrice} Coins` : 'Gratuit'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons: Save Draft vs Publish Live to All Readers */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={(e) => handlePublish(e, 'DRAFT')}
              className="w-full bg-surface text-ink border border-surface-line py-3.5 rounded-xl font-bold text-[12.5px] shadow-sm hover:border-gold transition-all flex items-center justify-center gap-1.5"
            >
              <FolderIcon className="w-4 h-4 text-taupe" />
              <span>{isEn ? 'Save as Private Draft' : 'Sauvegarder en Brouillon'}</span>
            </button>

            <button
              type="button"
              onClick={(e) => handlePublish(e, 'PUBLISHED')}
              className="w-full bg-gold text-paper py-3.5 rounded-xl font-bold text-[13px] shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <SparklesIcon className="w-4 h-4 text-paper" />
              <span>{isEn ? 'Publish Live for All Readers' : 'Publier pour Tous les Lecteurs'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Paste Full Text Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-paper border border-surface-line rounded-3xl p-6 w-full max-w-md text-left relative shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-surface-line pb-3">
              <h3 className="font-display font-bold text-[16px] text-ink">Coller un Bloc de Texte Bilingue</h3>
              <button onClick={() => setShowPasteModal(false)} className="text-taupe text-lg font-bold">
                ×
              </button>
            </div>

            <p className="text-[11.5px] text-taupe leading-relaxed">
              Collez vos lignes de texte. La 1ère ligne sera traitée comme l’anglais, la 2ème comme la traduction française, et ainsi de suite.
            </p>

            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder={`Line 1: The sun set over the ocean.\nLine 2: Le soleil se couchait sur l'océan.\nLine 3: She walked along the quiet shore.\nLine 4: Elle marchait le long du rivage paisible.`}
              className="w-full p-3 rounded-xl bg-white border border-surface-line text-[12px] font-mono outline-none focus:border-gold"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPasteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-surface-line text-[12px] font-bold text-taupe"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleProcessPastedText}
                className="flex-1 bg-gold text-paper py-2.5 rounded-xl text-[12px] font-bold shadow-sm"
              >
                Insérer les Phrases
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
