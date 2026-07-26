import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { IconButton, CoverArt } from '../components/ui/primitives.jsx';
import { covers } from '../lib/api.js';
import {
  BackIcon,
  BookmarkIcon,
  CheckIcon,
  SparklesIcon,
  SettingsIcon,
  LockIcon,
  CoinIcon,
  BookOpenIcon,
  FullscreenIcon,
  MinimizeIcon,
  HeartIcon,
  MessageSquareIcon,
  StarIcon,
} from '../components/ui/Icons.jsx';
import BilingualSentence from '../components/reader/BilingualSentence.jsx';
import AudioBar from '../components/reader/AudioBar.jsx';
import ReadingPreferencesModal from '../components/reader/ReadingPreferencesModal.jsx';
import WordDefinitionModal from '../components/reader/WordDefinitionModal.jsx';
import ChapterComments from '../components/comments/ChapterComments.jsx';
import PaymentModal from '../components/monetization/PaymentModal.jsx';

export default function Reader() {
  const { id, chapter } = useParams();
  const navigate = useNavigate();
  const {
    booksList,
    isBookmarked,
    toggleBookmark,
    addCoins,
    isLoggedIn,
    userProfile,
    isChapterUnlocked,
    unlockChapterWithCoins,
    recordReadingSession,
    bookReactions,
    toggleBookReaction,
    bookReviews,
  } = useApp();

  const chapterNum = Number(chapter) || 1;

  // Find book and chapter 100% dynamically from booksList
  const bookData = booksList.find((b) => b.id === id);
  const chapterData = bookData?.chaptersData?.[chapterNum - 1] || {
    id: chapterNum,
    title: `Chapitre ${chapterNum} : Les Rives de Dakar`,
    audioDuration: '00:15',
    sentences: [
      { en: 'The sun set over Dakar, turning the Atlantic ocean into gold.', fr: 'Le soleil se couchait sur Dakar, transformant l\'océan Atlantique en or.', vocabWord: 'ocean', vocabFr: 'océan' },
      { en: 'She looked at the lighthouse flickering gently in the night breeze.', fr: 'Elle regardait le phare vaciller doucement dans la brise nocturne.', vocabWord: 'lighthouse', vocabFr: 'phare' },
    ],
    quiz: {
      questionEn: 'What flickered gently in the night breeze?',
      questionFr: 'Qu\'est-ce qui vacillait doucement dans la brise nocturne ?',
      options: ['The lighthouse', 'The ferry boat', 'The wooden tree', 'The street lamp'],
      correctIndex: 0,
      explanation: 'The lighthouse flickered gently in the night breeze.'
    }
  };

  const [selectedOption, setSelectedOption] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Modals & Reader Interaction State
  const [showPreferences, setShowPreferences] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedWord, setSelectedWord] = useState(null);
  const [isImmersive, setIsImmersive] = useState(false);
  const [showHudControls, setShowHudControls] = useState(false);
  const [showDock, setShowDock] = useState(false); // Tap canvas to toggle floating interaction dock

  const [readingPrefs, setReadingPrefs] = useState({
    theme: 'cream',
    bg: '#FAF8F5',
    text: '#1A1816',
    font: "'Newsreader', serif",
    fontSize: 16,
    lineHeight: 1.6,
    mode: 'scroll', // Classic Natural Vertical Scroll Default
  });

  // Page Flip Index (Page 0 = Real Book Cover, Page 1+ = Chapter Content Pages)
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const allChapters = bookData?.chaptersData && bookData.chaptersData.length > 0
    ? bookData.chaptersData
    : [chapterData];

  const [activeChapterNum, setActiveChapterNum] = useState(chapterNum);
  const scrollContainerRef = useRef(null);

  // Sync active chapter on URL route change
  useEffect(() => {
    setActiveChapterNum(chapterNum);
  }, [chapterNum]);

  // Track active chapter in view during continuous scroll
  useEffect(() => {
    if (readingPrefs.mode !== 'scroll') return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const chapterBlocks = container.querySelectorAll('[data-chapter-num]');
    if (!chapterBlocks || chapterBlocks.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.25) {
            const num = Number(entry.target.getAttribute('data-chapter-num'));
            if (num && num !== activeChapterNum) {
              setActiveChapterNum(num);
              // Save reading progress dynamically as user scrolls through chapters
              if (id && num) {
                const totalChapters = allChapters.length;
                const progress = Math.round(((num - 1) / totalChapters) * 100);
                const progressData = {
                  bookId: id,
                  chapter: num,
                  progress,
                  lastRead: new Date().toISOString(),
                };
                const allProgress = JSON.parse(localStorage.getItem('koko_reading_progress') || '{}');
                allProgress[id] = progressData;
                localStorage.setItem('koko_reading_progress', JSON.stringify(allProgress));
                localStorage.setItem('koko_last_book', JSON.stringify(progressData));
              }
            }
          }
        });
      },
      { root: container, threshold: [0.25, 0.5] }
    );

    chapterBlocks.forEach((block) => observer.observe(block));
    return () => observer.disconnect();
  }, [id, allChapters.length, readingPrefs.mode, activeChapterNum]);

  useEffect(() => {
    recordReadingSession();
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (scrollContainerRef.current) {
      if (chapterNum > 1) {
        setTimeout(() => {
          const targetEl = document.getElementById(`chap-block-${chapterNum}`);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'instant', block: 'start' });
          }
        }, 50);
      } else {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  }, [id, chapterNum]);

  // Loading Failsafe for Chapter Transitions
  if (!bookData && booksList.length === 0) {
    return (
      <div className="px-5 pt-24 pb-12 text-center flex flex-col items-center justify-center space-y-4 animate-fadeIn">
        <div className="w-12 h-12 rounded-full border-3 border-gold border-t-transparent animate-spin mx-auto" />
        <p className="font-display font-bold text-[15px] text-ink">Chargement du Chapitre {chapterNum}...</p>
      </div>
    );
  }

  // Protected Reader Check for Unapproved Pending Users
  if (isLoggedIn && userProfile.accessStatus === 'PENDING') {
    return (
      <div className="fixed inset-0 z-50 bg-deep text-paper px-5 pt-12 pb-6 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gold/20 text-gold flex items-center justify-center mb-4 border border-gold/40 shadow-md">
          <LockIcon className="w-8 h-8" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-gold-soft mb-1">Accès en cours de Validation</span>
        <h2 className="font-display font-bold text-[22px] mb-2">Demande d'Accès Transmise</h2>
        <p className="text-[13px] text-[#8CA6A2] max-w-xs mb-6">
          Votre compte est actuellement en attente d'approbation par l'administrateur Koko.
        </p>
        <button
          onClick={() => navigate('/profile')}
          className="bg-gold text-deep-2 px-6 py-3.5 rounded-xl font-bold text-[13px] shadow-sm"
        >
          Retour au Profil
        </button>
      </div>
    );
  }

  // Author-Defined Coin Paywall Lock Check
  const isPaidChapter = chapterData.isPaid || chapterNum > 1;
  const coinPrice = chapterData.coinPrice || 5;
  const unlocked = userProfile.isVip || isChapterUnlocked(id, chapterNum);

  if (isPaidChapter && !unlocked && chapterNum > 1) {
    return (
      <div className="fixed inset-0 z-50 bg-deep text-paper px-5 pt-12 pb-6 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-gold/20 text-gold flex items-center justify-center mx-auto border border-gold/40 shadow-md">
          <CoinIcon className="w-8 h-8 text-gold" />
        </div>

        <span className="text-[10.5px] font-bold uppercase tracking-widest text-gold-soft">Chapitre Verrouillé par l'Auteur</span>
        <h2 className="font-display font-bold text-[22px]">{chapterData.title || `Chapitre ${chapterNum}`}</h2>
        <p className="text-[13px] text-[#8CA6A2] max-w-xs mx-auto">
          Ce chapitre coûte <strong>{coinPrice} Coins</strong>. Votre solde actuel : <strong>{userProfile.coins || 0} Coins</strong>.
        </p>

        {(userProfile.coins || 0) >= coinPrice ? (
          <button
            onClick={() => unlockChapterWithCoins(id, chapterNum, coinPrice)}
            className="w-full max-w-xs bg-gold text-deep-2 py-3.5 rounded-xl font-bold text-[13.5px] shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Débloquer pour {coinPrice} Coins</span>
            <CoinIcon className="w-4 h-4 text-deep-2" />
          </button>
        ) : (
          <div className="w-full max-w-xs space-y-2">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full bg-gold text-deep-2 py-3.5 rounded-xl font-bold text-[13.5px] shadow-md hover:opacity-90 transition-all"
            >
              Recharger des Coins (Wave / Orange Money)
            </button>
            <p className="text-[11px] text-red-400 font-medium">Solde de Coins insuffisant ({userProfile.coins || 0} / {coinPrice})</p>
          </div>
        )}

        <button onClick={() => navigate(-1)} className="text-[12px] font-semibold text-taupe pt-2">
          ← Retour à la fiche du livre
        </button>

        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={(addedCoins, isSubscription) => {
            if (isSubscription) {
              useApp().updateUserProfileInfo({ isVip: true });
            } else if (addedCoins && typeof addedCoins === 'number') {
              addCoins(addedCoins);
            }
          }}
        />
      </div>
    );
  }

  const bookmarked = isBookmarked(id);
  const quiz = chapterData.quiz;
  const isLight = readingPrefs.theme === 'cream' || readingPrefs.theme === 'sepia';

  // Group sentences for Mode Feuilleter (Page 0 = Cover, Page 1..N = Sentences)
  const sentencesPerPage = 2;
  const sentencesList = chapterData.sentences || [];
  const contentPages = [];
  for (let i = 0; i < sentencesList.length; i += sentencesPerPage) {
    contentPages.push(sentencesList.slice(i, i + sentencesPerPage));
  }
  const totalPages = 1 + Math.max(1, contentPages.length); // Page 0 + content pages

  const handleOptionSelect = (idx) => {
    if (!quizSubmitted && quiz) {
      setSelectedOption(idx);
      setQuizSubmitted(true);
      if (idx === quiz.correctIndex) {
        addCoins(5);
      }
    }
  };

  const handleUpdatePreferences = (updated) => {
    setReadingPrefs((prev) => ({ ...prev, ...updated }));
  };

  // Touch Swipe Gesture & 3D Page Curl State
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState('next'); // 'next' | 'prev'

  const turnPage = (dir) => {
    if (dir === 'next' && currentPageIndex < totalPages - 1) {
      setFlipDirection('next');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPageIndex((prev) => prev + 1);
        setIsFlipping(false);
      }, 260);
    } else if (dir === 'prev' && currentPageIndex > 0) {
      setFlipDirection('prev');
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPageIndex((prev) => prev - 1);
        setIsFlipping(false);
      }, 260);
    }
  };

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 35; // 35px threshold for swipe

    if (distance > minSwipeDistance) {
      // Swiped Right -> Left (Next Page)
      turnPage('next');
    } else if (distance < -minSwipeDistance) {
      // Swiped Left -> Right (Previous Page)
      turnPage('prev');
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  // Tap handler to toggle top and bottom HUD controls on/off
  const handlePageTap = (e) => {
    if (e.target && (e.target.closest('button') || e.target.closest('input') || e.target.closest('a'))) {
      return;
    }

    if (readingPrefs.mode === 'flip') {
      const width = window.innerWidth;
      const clickX = e.clientX;
      const ratio = clickX / width;

      if (ratio < 0.35) {
        turnPage('prev');
      } else if (ratio > 0.65) {
        turnPage('next');
      } else {
        setShowHudControls((prev) => !prev);
      }
    } else {
      // In scroll mode: tap anywhere on text/screen toggles top & bottom bars!
      setShowHudControls((prev) => !prev);
    }
  };

  const showTopBar = showHudControls;

  return (
    <div
      className="fixed inset-0 h-screen w-screen overflow-hidden flex flex-col justify-between select-none transition-colors duration-300"
      style={{ backgroundColor: readingPrefs.bg, color: readingPrefs.text }}
      onClick={handlePageTap}
    >
      {/* Top Header — hidden by default in scroll mode, reveals on tap */}
      {showTopBar && (
        <div
          className="flex justify-between items-center px-3 pt-3 pb-2 animate-fadeIn flex-shrink-0 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <IconButton
            className={isLight ? 'bg-black/8 text-[#1A1816]' : 'bg-white/10 text-[#F3F7F5]'}
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <BackIcon className="w-4 h-4" />
          </IconButton>

          <div className="text-center truncate px-2 flex-1">
            <span className="text-[11px] font-bold opacity-70 truncate block">{bookData?.title || 'Roman Koko'}</span>
            <span className="text-[10px] text-taupe opacity-60">Chapitre {chapterNum}</span>
          </div>

          <div className="flex gap-1.5 items-center">
            {quiz && (
              <button
                type="button"
                title="Quiz (+5 Coins)"
                onClick={() => { setSelectedOption(null); setQuizSubmitted(false); setShowQuizModal(true); }}
                className="w-8 h-8 rounded-xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center"
              >
                <SparklesIcon className="w-4 h-4 text-gold" />
              </button>
            )}

            <div className={`p-1 rounded-xl border flex gap-1 ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
              <button type="button" title="Mode Feuilleter" onClick={() => setReadingPrefs((p) => ({ ...p, mode: 'flip' }))}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${readingPrefs.mode === 'flip' ? 'bg-gold text-paper' : 'opacity-60'}`}>
                <BookOpenIcon className="w-3.5 h-3.5" />
              </button>
              <button type="button" title="Mode Défilement" onClick={() => setReadingPrefs((p) => ({ ...p, mode: 'scroll' }))}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${readingPrefs.mode !== 'flip' ? 'bg-gold text-paper' : 'opacity-60'}`}>
                <span className="font-mono text-[11px] font-bold">☰</span>
              </button>
            </div>

            <IconButton
              className={isLight ? 'bg-black/8 text-[#1A1816]' : 'bg-white/10 text-[#F3F7F5]'}
              onClick={() => setShowPreferences(true)}
            >
              <SettingsIcon className="w-4 h-4" />
            </IconButton>
          </div>
        </div>
      )}

      {/* STABLE, FIXED E-BOOK CANVAS FILLING 100% OF VIEWPORT */}
      {readingPrefs.mode === 'flip' || isImmersive ? (
        <div className="flex-1 flex flex-col justify-between w-full max-w-xl mx-auto h-full overflow-hidden">
          {/* E-Book Page Card (Touch Swipe + 3D Page Curl Effect) */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`p-5 sm:p-7 rounded-3xl border shadow-2xl relative flex-1 flex flex-col justify-between overflow-hidden text-left ${
              isLight
                ? 'bg-[#FAF8F5] border-black/10 text-[#1A1816]'
                : 'bg-[#0C2320] border-white/12 text-[#F3F7F5]'
            }`}
            style={{
              boxShadow: isLight
                ? '0 12px 35px rgba(0,0,0,0.08)'
                : '0 12px 35px rgba(0,0,0,0.5)',
              transform: isFlipping
                ? flipDirection === 'next'
                  ? 'perspective(1000px) rotateY(-15deg) scale(0.97) translateX(-15px)'
                  : 'perspective(1000px) rotateY(15deg) scale(0.97) translateX(15px)'
                : 'perspective(1000px) rotateY(0deg) scale(1) translateX(0px)',
              transformOrigin: flipDirection === 'next' ? 'left center' : 'right center',
              transition: 'transform 260ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            }}
          >
            {/* PAGE 0: BOOK COVER */}
            {currentPageIndex === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-4 animate-fadeIn">
                <CoverArt
                  gradient={covers[bookData?.cover] || covers.c1}
                  className="w-32 h-48 rounded-2xl shadow-xl relative overflow-hidden flex items-center justify-center border-2 border-gold/40"
                >
                  {bookData?.customCoverUrl ? (
                    <img src={bookData.customCoverUrl} alt={bookData.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="p-3">
                      <BookOpenIcon className="w-10 h-10 mx-auto text-white opacity-40 mb-1" />
                      <span className="font-display font-bold text-[14px] text-white leading-tight block">
                        {bookData?.title || 'Roman Bilingue'}
                      </span>
                    </div>
                  )}
                </CoverArt>

                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-gold bg-gold/15 px-3 py-1 rounded-full border border-gold/30">
                    {bookData?.level || 'Bilingue Koko'}
                  </span>
                  <h2 className="font-display italic font-bold text-[22px] text-ink leading-tight">
                    {bookData?.title || 'Nouveau Roman'}
                  </h2>
                  <p className="text-[12px] text-taupe">par {bookData?.author || 'Auteur Koko'}</p>
                </div>

                <span className="text-[11px] font-bold text-gold opacity-80 pt-2 block">
                  Tapez à droite de l'écran pour feuilleter →
                </span>
              </div>
            ) : (
              /* PAGE 1..N: CHAPTER SENTENCES (EXACT STYLING OF SCREENSHOT) */
              <div className="flex-1 flex flex-col justify-start space-y-4 animate-fadeIn">
                {/* Chapter Title Header with Underline Bar (EXACTLY AS SCREENSHOT) */}
                <div className="text-center pt-1 pb-2 flex-shrink-0">
                  <h3 className="font-display font-bold text-[17px] tracking-wide text-ink">
                    {chapterData.title || `Chapter ${chapterNum}`}
                  </h3>
                  <div className="w-8 h-[2px] bg-ink/70 mx-auto mt-1 rounded-full" />
                </div>

                {/* Justified Elegant Book Text */}
                <div
                  className="space-y-3.5 flex-1 text-justify overflow-hidden"
                  style={{
                    fontFamily: readingPrefs.font,
                    fontSize: `${readingPrefs.fontSize}px`,
                    lineHeight: readingPrefs.lineHeight,
                  }}
                >
                  {(contentPages[currentPageIndex - 1] || []).map((s, i) => (
                    <div
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        const clickedText = e.target.innerText;
                        if (clickedText && clickedText.trim().length > 1) {
                          setSelectedWord(clickedText.trim());
                        }
                      }}
                    >
                      <BilingualSentence
                        en={s.en}
                        fr={s.fr}
                        vocabWord={s.vocabWord}
                        vocabFr={s.vocabFr}
                        isLight={isLight}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Clean Bottom Page Indicator */}
            <div className="flex justify-between items-center pt-2.5 border-t border-opacity-10 border-current text-[10.5px] font-bold text-taupe flex-shrink-0">
              <span className="opacity-60">{bookData?.title || 'Koko Book'}</span>
              <span className="text-gold uppercase tracking-widest font-mono">
                {currentPageIndex === 0 ? 'Couverture' : `Page ${currentPageIndex} / ${totalPages - 1}`}
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* DÉFILEMENT CONTINU UNIFIÉ STYLE WEBTOON (SCROLL INFINI SANS RECHARGEMENT) */
        <div
          key={`book-feed-${id}`}
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto max-w-xl mx-auto w-full text-justify px-2 relative pb-16 cursor-pointer transition-all duration-300 scroll-smooth"
          style={{
            fontFamily: readingPrefs.font,
            fontSize: `${readingPrefs.fontSize}px`,
            lineHeight: readingPrefs.lineHeight,
          }}
        >
          {allChapters.map((chap, cIdx) => {
            const cNum = cIdx + 1;
            const sentences = chap.sentences || [];
            const nextChap = allChapters[cIdx + 1];

            return (
              <div
                key={`chap-block-${cNum}`}
                id={`chap-block-${cNum}`}
                data-chapter-num={cNum}
                className="py-6 space-y-4"
              >
                {/* Chapter Header Card */}
                <div className="text-center pt-4 pb-5 border-b border-surface-line/25 mb-6 space-y-1">
                  <span className="text-[10.5px] font-mono font-bold uppercase tracking-widest text-gold block opacity-90">
                    Chapitre {cNum} / {allChapters.length}
                  </span>
                  <h3 className="font-display font-bold text-[20px] tracking-wide text-ink">
                    {chap.title || `Chapitre ${cNum}`}
                  </h3>
                  <div className="w-12 h-[2.5px] bg-gold mx-auto mt-2 rounded-full opacity-70" />
                </div>

                {/* Sentences */}
                {sentences.map((s, sIdx) => (
                  <div key={sIdx} onClick={(e) => {
                    const clickedText = e.target.innerText;
                    if (clickedText && clickedText.trim().length > 1) {
                      setSelectedWord(clickedText.trim());
                    }
                  }}>
                    <BilingualSentence
                      en={s.en}
                      fr={s.fr}
                      vocabWord={s.vocabWord}
                      vocabFr={s.vocabFr}
                      isLight={isLight}
                    />
                  </div>
                ))}

                {/* CHAPTER SEPARATION & TRANSITION CARD */}
                <div className="my-10 py-6 px-5 rounded-2xl bg-black/5 dark:bg-white/5 border border-surface-line/30 text-center space-y-2.5 shadow-inner">
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-[1px] flex-1 bg-surface-line/40" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-taupe block opacity-60">
                      — Fin du Chapitre {cNum} —
                    </span>
                    <div className="h-[1px] flex-1 bg-surface-line/40" />
                  </div>

                  {nextChap ? (
                    <div className="pt-1.5 space-y-1">
                      <span className="text-[10.5px] font-mono text-gold font-bold uppercase tracking-wider block">
                        Chapitre Suivant ({cNum + 1})
                      </span>
                      <h4 className="font-display font-bold text-[15px] text-ink">
                        {nextChap.title || `Chapitre ${cNum + 1}`}
                      </h4>
                      <p className="text-[11px] text-taupe font-semibold pt-0.5 opacity-80">
                        ↓ Continuer à scroller pour lire la suite
                      </p>
                    </div>
                  ) : (
                    <p className="text-[12px] font-bold text-gold pt-1">
                      🎉 Fin du roman — Tous les chapitres ont été lus !
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WEBTOON-STYLE FIXED BOTTOM NAV BAR — hidden by default, reveals on tap */}
      {showHudControls && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3 border-t animate-fadeIn"
          style={{
            backgroundColor: isLight ? 'rgba(250,248,245,0.96)' : 'rgba(18,18,24,0.96)',
            borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(16px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* LEFT — Like + Bookmark */}
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={() => toggleBookReaction(id, 'like')}
              className="flex flex-col items-center gap-0.5 active:scale-90 transition-all"
            >
              <HeartIcon className={`w-6 h-6 transition-all ${
                bookReactions?.[id]?.userReaction === 'like'
                  ? 'fill-red-500 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]'
                  : isLight ? 'text-ink/50' : 'text-white/50'
              }`} />
              <span className={`text-[10px] font-bold ${isLight ? 'text-ink/60' : 'text-white/60'}`}>
                {bookReactions?.[id]?.like || 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleBookmark(id)}
              className="flex flex-col items-center gap-0.5 active:scale-90 transition-all"
            >
              <BookmarkIcon className={`w-6 h-6 transition-all ${
                bookmarked ? 'fill-gold text-gold' : isLight ? 'text-ink/50' : 'text-white/50'
              }`} />
              <span className={`text-[10px] font-bold ${isLight ? 'text-ink/60' : 'text-white/60'}`}>
                {bookmarked ? 'Sauvé' : 'Sauver'}
              </span>
            </button>
          </div>

          {/* CENTER — chapter switcher (Prev ‹ | Ch. X / N | › Next) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={activeChapterNum <= 1}
              onClick={() => {
                if (activeChapterNum > 1) {
                  const targetEl = document.getElementById(`chap-block-${activeChapterNum - 1}`);
                  if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                activeChapterNum <= 1 ? 'opacity-20 cursor-not-allowed' : 'bg-black/10 dark:bg-white/10 hover:bg-gold hover:text-deep active:scale-95'
              }`}
              title="Chapitre précédent"
            >
              ‹
            </button>

            <span className={`text-[11.5px] font-bold tracking-tight px-1 ${isLight ? 'text-ink/70' : 'text-white/70'}`}>
              Ch. {activeChapterNum} / {allChapters.length}
            </span>

            <button
              type="button"
              disabled={activeChapterNum >= allChapters.length}
              onClick={() => {
                if (activeChapterNum < allChapters.length) {
                  const targetEl = document.getElementById(`chap-block-${activeChapterNum + 1}`);
                  if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                activeChapterNum >= allChapters.length ? 'opacity-20 cursor-not-allowed' : 'bg-black/10 dark:bg-white/10 hover:bg-gold hover:text-deep active:scale-95'
              }`}
              title="Chapitre suivant"
            >
              ›
            </button>
          </div>

          {/* RIGHT — Comment + Quiz */}
          <div className="flex items-center gap-5">
            {quiz && (
              <button
                type="button"
                onClick={() => { setSelectedOption(null); setQuizSubmitted(false); setShowQuizModal(true); }}
                className="flex flex-col items-center gap-0.5 active:scale-90 transition-all"
              >
                <SparklesIcon className={`w-6 h-6 text-gold`} />
                <span className={`text-[10px] font-bold ${isLight ? 'text-ink/60' : 'text-white/60'}`}>Quiz</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowCommentsModal(true)}
              className="flex flex-col items-center gap-0.5 active:scale-90 transition-all"
            >
              <MessageSquareIcon className={`w-6 h-6 transition-all ${
                isLight ? 'text-ink/50' : 'text-white/50'
              }`} />
              <span className={`text-[10px] font-bold ${isLight ? 'text-ink/60' : 'text-white/60'}`}>
                {bookReviews?.[id]?.length || 0}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Audio Narration Button (Takes ZERO Page Canvas Space) */}
      {(!isImmersive || showHudControls) && (
        <AudioBar
          bookId={id}
          bookTitle={bookData?.title || 'Roman Bilingue'}
          chapterTitle={chapterData.title}
          duration={chapterData.audioDuration}
          sentences={chapterData.sentences || []}
          chapterNumber={chapterNum}
          cover={bookData?.cover || 'c1'}
        />
      )}

      {/* Quiz Modal */}
      {showQuizModal && quiz && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
          <div className="bg-paper border border-surface-line rounded-3xl p-5 w-full max-w-md text-left relative shadow-2xl space-y-3">
            <div className="flex justify-between items-center border-b border-surface-line pb-2.5">
              <div className="flex items-center gap-1.5">
                <SparklesIcon className="w-4 h-4 text-gold" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gold">
                  Quiz du Chapitre (+5 Coins)
                </span>
              </div>
              <button
                onClick={() => setShowQuizModal(false)}
                className="w-7 h-7 rounded-full bg-surface border border-surface-line flex items-center justify-center text-taupe hover:text-ink font-bold text-[14px]"
              >
                ×
              </button>
            </div>

            <div>
              <p className="font-reading text-[14.5px] font-bold text-ink leading-snug">{quiz.questionEn}</p>
              <p className="font-reading italic text-[12px] text-taupe mt-0.5">{quiz.questionFr}</p>
            </div>

            <div className="space-y-2 pt-1">
              {quiz.options?.map((opt, idx) => {
                const isCorrect = idx === quiz.correctIndex;
                const isSelected = selectedOption === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-[12.5px] border transition-all flex items-center justify-between font-medium ${
                      quizSubmitted && isSelected
                        ? isCorrect
                          ? 'bg-emerald-600 text-white font-bold border-emerald-700'
                          : 'bg-red-600 text-white border-red-700'
                        : 'bg-white border-surface-line text-ink hover:border-gold'
                    }`}
                  >
                    <span>{opt}</span>
                    {quizSubmitted && isSelected && isCorrect && <CheckIcon className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>

            {quizSubmitted && (
              <div className="p-2.5 rounded-xl border border-gold/40 bg-gold/15 text-gold-soft text-[11.5px] flex items-center gap-2 font-semibold">
                <SparklesIcon className="w-4 h-4 text-gold flex-shrink-0" />
                <span>{selectedOption === quiz.correctIndex ? 'Bravo ! +5 Coins ajoutés à votre solde !' : 'Bonne tentative !'} {quiz.explanation}</span>
              </div>
            )}

            <button
              onClick={() => setShowQuizModal(false)}
              className="w-full bg-surface border border-surface-line text-ink py-2.5 rounded-xl font-bold text-[12px] hover:bg-surface-line transition-all mt-1"
            >
              Quitter le Quiz
            </button>
          </div>
        </div>
      )}

      {/* Chapter Comments & Reviews Drawer */}
      {showCommentsModal && (
        <ChapterComments
          bookId={id}
          chapterId={chapterNum}
          onClose={() => setShowCommentsModal(false)}
        />
      )}

      {/* Preferences Modal */}
      <ReadingPreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        preferences={readingPrefs}
        onUpdatePreferences={handleUpdatePreferences}
      />

      {/* Word Definition Modal */}
      <WordDefinitionModal
        word={selectedWord}
        onClose={() => setSelectedWord(null)}
      />
    </div>
  );
}
