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
import { fetchChapterComments, countTotalComments } from '../lib/commentsApi.js';
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
    stopAudioTrack,
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
  const [showChapterDrawer, setShowChapterDrawer] = useState(false); // Chapter list drawer
  const [chapterSearchQuery, setChapterSearchQuery] = useState('');
  const [chapterSortAsc, setChapterSortAsc] = useState(true);

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
  const activeChapterNumRef = useRef(chapterNum); // ref avoids observer re-mounting on every chapter change
  const scrollContainerRef = useRef(null);

  // Sync active chapter on URL route change
  useEffect(() => {
    setActiveChapterNum(chapterNum);
    activeChapterNumRef.current = chapterNum;
  }, [chapterNum]);

  // Real-time synchronization of comments count for active chapter (Cloud DB + Local Storage)
  const [activeChapterCommentsCount, setActiveChapterCommentsCount] = useState(3);

  useEffect(() => {
    let isMounted = true;

    const syncCommentsCount = async () => {
      const bId = id || 'b1';
      const cId = String(activeChapterNum || 1);
      const commentsData = await fetchChapterComments(bId, cId);
      if (isMounted && commentsData) {
        setActiveChapterCommentsCount(countTotalComments(commentsData));
      }
    };

    syncCommentsCount();
    window.addEventListener('storage', syncCommentsCount);
    window.addEventListener('koko_comments_updated', syncCommentsCount);

    const interval = setInterval(syncCommentsCount, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('storage', syncCommentsCount);
      window.removeEventListener('koko_comments_updated', syncCommentsCount);
    };
  }, [id, activeChapterNum, showCommentsModal]);

  // Track active chapter in view during continuous scroll
  // IMPORTANT: activeChapterNum is intentionally NOT in the dep array —
  // using a ref prevents the observer from tearing down/reconnecting on every
  // chapter change, which was causing scroll freezes.
  useEffect(() => {
    if (readingPrefs.mode !== 'scroll') return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const chapterBlocks = container.querySelectorAll('[data-chapter-num]');
    if (!chapterBlocks || chapterBlocks.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const num = Number(entry.target.getAttribute('data-chapter-num'));
            if (num && num !== activeChapterNumRef.current) {
              activeChapterNumRef.current = num;
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
      { root: container, rootMargin: '-10% 0px -55% 0px', threshold: 0.1 }
    );

    chapterBlocks.forEach((block) => observer.observe(block));
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, allChapters.length, readingPrefs.mode]);

  // Robust Chapter Navigation Handler (works in both scroll & flip modes)
  const handleNavigateChapter = (targetNum) => {
    if (targetNum < 1 || targetNum > allChapters.length) return;

    if (readingPrefs.mode === 'flip') {
      navigate(`/book/${id}/read/${targetNum}`);
      return;
    }

    const container = scrollContainerRef.current;
    if (container) {
      const targetEl = container.querySelector(`#chap-block-${targetNum}`);
      if (targetEl) {
        const containerTop = container.getBoundingClientRect().top;
        const targetTop = targetEl.getBoundingClientRect().top;
        const offset = targetTop - containerTop + container.scrollTop;
        container.scrollTo({ top: offset, behavior: 'smooth' });

        activeChapterNumRef.current = targetNum;
        setActiveChapterNum(targetNum);
      } else {
        navigate(`/book/${id}/read/${targetNum}`);
      }
    } else {
      navigate(`/book/${id}/read/${targetNum}`);
    }
  };

  useEffect(() => {
    recordReadingSession();
    window.scrollTo({ top: 0, behavior: 'instant' });

    if (scrollContainerRef.current) {
      if (chapterNum > 1) {
        setTimeout(() => {
          const chapEl = document.getElementById(`chap-block-${chapterNum}`);
          if (chapEl && scrollContainerRef.current) {
            chapEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      } else {
        scrollContainerRef.current.scrollTop = 0;
      }
    }

    return () => {
      // Cleanly stop audio narration when leaving reader / exiting book
      stopAudioTrack();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
              // Grant VIP via updateUserProfileInfo (already available from useApp above)
              updateUserProfileInfo({ isVip: true });
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

  const showTopBar = true; // Always visible as requested so readers immediately see top controls!

  return (
    <div
      className="fixed inset-0 overflow-hidden flex flex-col justify-between select-none transition-colors duration-300"
      style={{
        backgroundColor: readingPrefs.bg,
        color: readingPrefs.text,
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
      onClick={handlePageTap}
    >
      {/* ALWAYS VISIBLE FIXED TOP READER HEADER (OPTIMIZED FOR IPHONE & DESKTOP) */}
      <div
        className="fixed top-0 left-0 right-0 z-40 px-3 sm:px-5 py-2 flex justify-between items-center transition-all shadow-sm backdrop-blur-xl border-b"
        style={{
          paddingTop: `max(12px, calc(env(safe-area-inset-top) + 6px))`,
          backgroundColor: isLight ? 'rgba(250, 248, 245, 0.95)' : 'rgba(18, 18, 24, 0.95)',
          borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Back + Chapter List Drawer Button */}
        <div className="flex items-center gap-1.5">
          <IconButton
            className={isLight ? 'bg-black/5 text-[#1A1816] hover:bg-black/10' : 'bg-white/10 text-[#F3F7F5] hover:bg-white/15'}
            onClick={() => navigate(-1)}
            aria-label="Retour"
          >
            <BackIcon className="w-4 h-4" />
          </IconButton>

          <button
            type="button"
            onClick={() => setShowChapterDrawer(true)}
            title="Liste des chapitres"
            className={`px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-all active:scale-95 text-[11px] font-bold ${
              isLight ? 'bg-black/5 text-[#1A1816] hover:bg-black/10' : 'bg-white/10 text-[#F3F7F5] hover:bg-white/15'
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#C8A951' }}>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            <span className="hidden sm:inline">Chapitres</span>
          </button>
        </div>

        {/* Middle: Clickable Chapter & Book Title Indicator */}
        <button
          type="button"
          onClick={() => setShowChapterDrawer(true)}
          className={`text-center truncate px-3 py-1 rounded-full transition-all active:scale-95 flex flex-col items-center justify-center ${
            isLight ? 'hover:bg-black/5' : 'hover:bg-white/5'
          }`}
        >
          <span className="text-[11px] font-bold opacity-75 truncate block max-w-[130px] sm:max-w-[220px]">
            {bookData?.title || 'Roman Koko'}
          </span>
          <span className="text-[10.5px] font-bold text-gold flex items-center gap-1">
            Chapitre {activeChapterNum} / {allChapters.length}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </span>
        </button>

        {/* Right: Quiz + Reading Preferences + Mode Toggle */}
        <div className="flex gap-1.5 items-center">
          {quiz && (
            <button
              type="button"
              title="Quiz (+5 Coins)"
              onClick={() => { setSelectedOption(null); setQuizSubmitted(false); setShowQuizModal(true); }}
              className="w-8 h-8 rounded-xl bg-gold/15 text-gold border border-gold/30 flex items-center justify-center shadow-sm"
            >
              <SparklesIcon className="w-4 h-4 text-gold" />
            </button>
          )}

          {/* Reading Mode Switcher */}
          <div className={`p-1 rounded-xl border flex gap-0.5 ${isLight ? 'bg-black/5 border-black/10' : 'bg-white/5 border-white/10'}`}>
            <button
              type="button"
              title="Mode Feuilleter (Pages)"
              onClick={() => setReadingPrefs((p) => ({ ...p, mode: 'flip' }))}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${readingPrefs.mode === 'flip' ? 'bg-gold text-paper shadow-sm' : 'opacity-60'}`}
            >
              <BookOpenIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Mode Défilement (Webtoon)"
              onClick={() => setReadingPrefs((p) => ({ ...p, mode: 'scroll' }))}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${readingPrefs.mode !== 'flip' ? 'bg-gold text-paper shadow-sm' : 'opacity-60'}`}
            >
              <span className="font-mono text-[11px] font-bold">☰</span>
            </button>
          </div>

          {/* Reading Preferences */}
          <IconButton
            className={isLight ? 'bg-black/5 text-[#1A1816] hover:bg-black/10' : 'bg-white/10 text-[#F3F7F5] hover:bg-white/15'}
            onClick={() => setShowPreferences(true)}
            aria-label="Paramètres"
            title="Taille de police & Couleurs"
          >
            <SettingsIcon className="w-4 h-4 text-gold" />
          </IconButton>
        </div>
      </div>

      {/* STABLE, FIXED E-BOOK CANVAS FILLING 100% OF VIEWPORT */}
      {readingPrefs.mode === 'flip' || isImmersive ? (
        <div className="flex-1 flex flex-col justify-between w-full max-w-xl mx-auto h-full overflow-hidden pt-16 sm:pt-20">
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
                    <div key={i}>
                      <BilingualSentence
                        en={s.en}
                        fr={s.fr}
                        vocabWord={s.vocabWord}
                        vocabFr={s.vocabFr}
                        isLight={isLight}
                        onSelectWord={(word) => setSelectedWord(word)}
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
          className="flex-1 overflow-y-auto max-w-xl mx-auto w-full text-justify px-4 pt-24 sm:pt-28 pb-20 relative transition-colors duration-300"
          style={{
            fontFamily: readingPrefs.font,
            fontSize: `${readingPrefs.fontSize}px`,
            lineHeight: readingPrefs.lineHeight,
            touchAction: 'pan-y',   /* iPhone: allow vertical swipe scroll without conflict */
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
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
                className="py-6 space-y-4 min-h-screen"
              >
                {/* Chapter Header Card */}
                <div className="text-center pt-4 pb-5 border-b border-surface-line/25 mb-4 space-y-1">
                  <span className="text-[10.5px] font-mono font-bold uppercase tracking-widest text-gold block opacity-90">
                    Chapitre {cNum} / {allChapters.length}
                  </span>
                  <h3 className="font-display font-bold text-[20px] tracking-wide text-ink">
                    {chap.title || `Chapitre ${cNum}`}
                  </h3>
                  <div className="w-12 h-[2.5px] bg-gold mx-auto mt-2 rounded-full opacity-70" />
                </div>

                {/* Chapter Top Illustration Banner */}
                {chap.imageUrl && (
                  <div className="w-full my-4 rounded-2xl overflow-hidden shadow-lg border border-surface-line/30 relative group">
                    <img
                      src={chap.imageUrl}
                      alt={chap.title || `Illustration Chapitre ${cNum}`}
                      className="w-full h-48 sm:h-64 object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-70" />
                    <span className="absolute bottom-2.5 left-3.5 text-[11px] font-bold text-white drop-shadow-md flex items-center gap-1.5">
                      <SparklesIcon className="w-3.5 h-3.5 text-gold" />
                      <span>Illustration Officielle · Chapitre {cNum}</span>
                    </span>
                  </div>
                )}

                {/* Sentences */}
                {sentences.map((s, sIdx) => (
                  <div key={sIdx}>
                    <BilingualSentence
                      en={s.en}
                      fr={s.fr}
                      vocabWord={s.vocabWord}
                      vocabFr={s.vocabFr}
                      isLight={isLight}
                      fontSize={readingPrefs.fontSize}
                      lineHeight={readingPrefs.lineHeight}
                      fontFamily={readingPrefs.font}
                      onSelectWord={(word) => setSelectedWord(word)}
                    />
                  </div>
                ))}

                {/* Minimalist Chapter End Separator */}
                <div className="my-12 py-4 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-[1px] flex-1 bg-surface-line/30" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-taupe block opacity-40">
                      — Fin du Chapitre {cNum} —
                    </span>
                    <div className="h-[1px] flex-1 bg-surface-line/30" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ WEBTOON PERSISTENT BOTTOM BAR — always visible ═══ */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between px-5 pt-3 border-t"
        style={{
          backgroundColor: isLight ? 'rgba(250,248,245,0.97)' : 'rgba(14,14,18,0.97)',
          borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          paddingBottom: 'max(10px, env(safe-area-inset-bottom))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT — Heart Like + Chat Comments */}
        <div className="flex items-center gap-5">

          {/* Heart like button */}
          <button
            type="button"
            onClick={() => toggleBookReaction(id, 'like')}
            className="flex items-center gap-1.5 active:scale-90 transition-all"
          >
            {bookReactions?.[id]?.userReaction === 'like' ? (
              /* Filled heart */
              <svg width="26" height="26" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  fill="#ef4444"
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              /* Outline heart */
              <svg width="26" height="26" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  fill="none"
                  stroke={isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)'}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
            <span className={`text-[13px] font-bold ${
              bookReactions?.[id]?.userReaction === 'like' ? 'text-red-500' : isLight ? 'text-ink/70' : 'text-white/60'
            }`}>
              {(bookReactions?.[id]?.like || 0) > 999
                ? ((bookReactions?.[id]?.like || 0) / 1000).toFixed(1) + 'K'
                : (bookReactions?.[id]?.like || 0)}
            </span>
          </button>

          {/* Chat bubble comment button */}
          <button
            type="button"
            onClick={() => setShowCommentsModal(true)}
            className="flex items-center gap-1.5 active:scale-90 transition-all"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" xmlns="http://www.w3.org/2000/svg"
              style={{ color: isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/>
            </svg>
            <span className={`text-[13px] font-bold ${isLight ? 'text-ink/70' : 'text-white/60'}`}>
              {activeChapterCommentsCount > 999
                ? (activeChapterCommentsCount / 1000).toFixed(1) + 'K'
                : activeChapterCommentsCount}
            </span>
          </button>
        </div>

        {/* RIGHT — Prev/Next Chapter Chevrons & Indicator */}
        <div className="flex items-center gap-2">
          {/* Chevron Left — previous chapter */}
          <button
            type="button"
            disabled={activeChapterNum <= 1}
            onClick={() => handleNavigateChapter(activeChapterNum - 1)}
            aria-label="Chapitre précédent"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeChapterNum <= 1
                ? 'opacity-20 cursor-not-allowed'
                : `active:scale-90 ${isLight ? 'hover:bg-black/8' : 'hover:bg-white/10'}`
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
              style={{ color: isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.75)' }}>
              <polyline points="15 18 9 12 15 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Chapter Indicator Pill */}
          <button
            type="button"
            onClick={() => setShowChapterDrawer(true)}
            className={`px-3 py-1.5 rounded-full text-[11.5px] font-bold transition-all active:scale-95 flex items-center gap-1 ${
              isLight ? 'bg-black/6 text-ink hover:bg-black/10' : 'bg-white/8 text-white hover:bg-white/14'
            }`}
          >
            <span>Ch. {activeChapterNum} / {allChapters.length}</span>
            <span className="text-[10px] text-gold font-bold">▾</span>
          </button>

          {/* Chevron Right — next chapter */}
          <button
            type="button"
            disabled={activeChapterNum >= allChapters.length}
            onClick={() => handleNavigateChapter(activeChapterNum + 1)}
            aria-label="Chapitre suivant"
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              activeChapterNum >= allChapters.length
                ? 'opacity-20 cursor-not-allowed'
                : `active:scale-90 ${isLight ? 'hover:bg-black/8' : 'hover:bg-white/10'}`
            }`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
              style={{ color: isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.75)' }}>
              <polyline points="9 18 15 12 9 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ═══ WEBTOON-STYLE FULL CHAPTER LIST MODAL ═══ */}
      {showChapterDrawer && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center animate-fadeIn"
          onClick={() => setShowChapterDrawer(false)}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl transition-colors duration-300 overflow-hidden"
            style={{
              backgroundColor: isLight ? '#FAF8F5' : '#121216',
              maxHeight: '82dvh',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div
                className="w-10 h-1 rounded-full"
                style={{ backgroundColor: isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)' }}
              />
            </div>

            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-5 pt-2 pb-3 border-b flex-shrink-0"
              style={{ borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }}
            >
              <div>
                <span className="text-[10.5px] font-mono font-bold uppercase tracking-widest text-gold block">
                  Sommaire & Chapitres ({allChapters.length})
                </span>
                <h3 className="font-display font-bold text-[17px] truncate max-w-[240px] sm:max-w-[320px]" style={{ color: readingPrefs.text }}>
                  {bookData?.title || 'Roman Koko'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setShowChapterDrawer(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[16px] transition-colors"
                style={{
                  backgroundColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.1)',
                  color: readingPrefs.text,
                }}
              >
                ×
              </button>
            </div>

            {/* Search & Sort Controls Bar */}
            <div
              className="px-4 py-2.5 flex items-center gap-2 border-b flex-shrink-0"
              style={{ borderColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)' }}
            >
              {/* Search Bar */}
              <div
                className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-[12.5px]"
                style={{
                  backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}`,
                  color: readingPrefs.text,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  value={chapterSearchQuery}
                  onChange={(e) => setChapterSearchQuery(e.target.value)}
                  placeholder="Rechercher un chapitre..."
                  className="bg-transparent outline-none flex-1 text-[12.5px]"
                  style={{ color: readingPrefs.text }}
                />
                {chapterSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setChapterSearchQuery('')}
                    className="text-[11px] font-bold opacity-60 hover:opacity-100 px-1"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Sort Order Toggle Button */}
              <button
                type="button"
                onClick={() => setChapterSortAsc((prev) => !prev)}
                className="px-3 py-2 rounded-xl text-[11.5px] font-bold flex items-center gap-1.5 transition-all active:scale-95 flex-shrink-0"
                style={{
                  backgroundColor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.07)',
                  border: `1px solid ${isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}`,
                  color: readingPrefs.text,
                }}
                title={chapterSortAsc ? 'Tri : Chapitre 1 → N' : 'Tri : Chapitre N → 1'}
              >
                <span>{chapterSortAsc ? '⬇️ 1→N' : '⬆️ N→1'}</span>
              </button>
            </div>

            {/* Scrollable Chapter List Items */}
            <div className="overflow-y-auto flex-1 py-2 px-3 space-y-1.5">
              {(() => {
                const prepared = allChapters.map((c, idx) => ({ ...c, originalNum: idx + 1 }));
                const filtered = prepared.filter((c) => {
                  if (!chapterSearchQuery.trim()) return true;
                  const q = chapterSearchQuery.toLowerCase();
                  return (
                    `chapitre ${c.originalNum}`.includes(q) ||
                    (c.title && c.title.toLowerCase().includes(q))
                  );
                });
                const sorted = chapterSortAsc ? filtered : [...filtered].reverse();

                if (sorted.length === 0) {
                  return (
                    <div className="py-10 text-center text-[12.5px] opacity-50">
                      Aucun chapitre ne correspond à "{chapterSearchQuery}"
                    </div>
                  );
                }

                return sorted.map((chap) => {
                  const cNum = chap.originalNum;
                  const isActive = cNum === activeChapterNum;
                  const unlocked = isChapterUnlocked(id, cNum);
                  const sentenceCount = chap.sentences?.length || 0;
                  const estTimeMinutes = Math.max(1, Math.ceil(sentenceCount * 0.25));

                  return (
                    <button
                      key={cNum}
                      type="button"
                      onClick={() => {
                        handleNavigateChapter(cNum);
                        setShowChapterDrawer(false);
                      }}
                      className="w-full flex items-center gap-3.5 p-3 rounded-2xl text-left transition-all active:scale-[0.98]"
                      style={{
                        backgroundColor: isActive
                          ? (isLight ? 'rgba(200,169,81,0.14)' : 'rgba(200,169,81,0.18)')
                          : (isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.03)'),
                        border: `1px solid ${
                          isActive
                            ? 'rgba(200,169,81,0.4)'
                            : (isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)')
                        }`,
                      }}
                    >
                      {/* Chapter Number Badge / Avatar */}
                      <div
                        className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center font-mono font-extrabold text-[12.5px] shadow-sm"
                        style={{
                          backgroundColor: isActive
                            ? '#C8A951'
                            : (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'),
                          color: isActive
                            ? '#1A1816'
                            : (isLight ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.75)'),
                        }}
                      >
                        {cNum}
                      </div>

                      {/* Chapter Title & Dimensions/Metadata */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4
                            className="text-[13.5px] font-bold truncate"
                            style={{ color: isActive ? '#C8A951' : readingPrefs.text }}
                          >
                            {chap.title || `Chapitre ${cNum}`}
                          </h4>
                        </div>
                        <p
                          className="text-[11px] font-medium opacity-60 mt-0.5"
                          style={{ color: readingPrefs.text }}
                        >
                          {sentenceCount > 0 ? `${sentenceCount} phrases` : 'Chapitre complet'} · ~{estTimeMinutes} min de lecture
                        </p>
                      </div>

                      {/* Status / Lock / Current Indicator Pill */}
                      <div className="flex-shrink-0">
                        {isActive ? (
                          <span className="text-[10.5px] font-extrabold px-2.5 py-1 rounded-full bg-gold text-deep-2 shadow-sm flex items-center gap-1">
                            <span>▶ En cours</span>
                          </span>
                        ) : unlocked || !chap.isPaid ? (
                          <span
                            className="text-[10.5px] font-bold px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: isLight ? 'rgba(76,175,138,0.12)' : 'rgba(76,175,138,0.2)',
                              color: '#4CAF8A',
                            }}
                          >
                            Gratuit
                          </span>
                        ) : (
                          <span
                            className="text-[10.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                            style={{
                              backgroundColor: 'rgba(200,169,81,0.15)',
                              color: '#C8A951',
                            }}
                          >
                            🔒 {chap.coinPrice || 10} Coins
                          </span>
                        )}
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
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
          chapterId={activeChapterNum}
          onClose={() => setShowCommentsModal(false)}
          isLight={isLight}
        />
      )}

      {/* Preferences Modal */}
      <ReadingPreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        preferences={readingPrefs}
        onUpdatePreferences={handleUpdatePreferences}
      />

      {/* Floating Audio Narration Button (Instant Vocal Mode) */}
      <AudioBar
        bookId={id}
        bookTitle={bookData?.title || 'Roman Koko'}
        chapterTitle={allChapters[activeChapterNum - 1]?.title || `Chapitre ${activeChapterNum}`}
        duration={allChapters[activeChapterNum - 1]?.audioDuration}
        sentences={allChapters[activeChapterNum - 1]?.sentences || chapterData?.sentences || []}
        chapterNumber={activeChapterNum}
        cover={bookData?.cover || 'c1'}
      />

      {/* Word Definition Modal */}
      <WordDefinitionModal
        word={selectedWord}
        onClose={() => setSelectedWord(null)}
      />
    </div>
  );
}
