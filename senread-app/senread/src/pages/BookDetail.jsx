import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { covers } from '../lib/api.js';
import { IconButton, Tag, CoverArt } from '../components/ui/primitives.jsx';
import {
  BackIcon,
  BookmarkIcon,
  PlayIcon,
  BookOpenIcon,
  StarIcon,
  PenToolIcon,
  TrashIcon,
  HeartIcon,
  ThumbsUpIcon,
  SparklesIcon,
  UsersIcon,
} from '../components/ui/Icons.jsx';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    booksList,
    isBookmarked,
    toggleBookmark,
    bookReviews,
    addBookReview,
    bookReactions,
    toggleBookReaction,
    deleteBook,
    toggleBookStatus,
    userProfile,
    appLanguage,
  } = useApp();

  const isEn = appLanguage === 'en';
  const book = booksList.find((b) => b.id === id);

  // Dynamic Interactive Star Rating State
  const [userRating, setUserRating] = useState(() => {
    try {
      const saved = localStorage.getItem(`koko_user_rating_${id}`);
      return saved ? Number(saved) : null;
    } catch {
      return null;
    }
  });
  const [hoverRating, setHoverRating] = useState(0);

  // Review Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    if (userRating !== null) {
      try {
        localStorage.setItem(`koko_user_rating_${id}`, String(userRating));
      } catch (e) {
        console.warn('Failed to save rating', e);
      }
    }
  }, [userRating, id]);

  if (!book) {
    return (
      <div className="px-5 pt-12 pb-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-gold/15 text-gold flex items-center justify-center mx-auto border border-gold/30">
          <BookOpenIcon className="w-7 h-7" />
        </div>
        <h2 className="font-display font-bold text-[18px]">
          {isEn ? 'Novel Not Found' : 'Roman Introuvable'}
        </h2>
        <p className="text-[12.5px] text-taupe max-w-xs mx-auto">
          {isEn ? 'This novel does not exist or has been removed.' : 'Ce roman n\'existe pas ou a été supprimé du catalogue.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-deep text-paper px-5 py-2.5 rounded-xl text-[12px] font-bold"
        >
          {isEn ? 'Back to Home' : 'Retour à l\'Accueil'}
        </button>
      </div>
    );
  }

  const isAuthor = userProfile.role === 'admin' || userProfile.role === 'author';
  const bookmarked = isBookmarked(book.id);
  const reviews = bookReviews[book.id] || [];
  const reactions = bookReactions[book.id] || { like: 0, users: [], love: 0, hate: 0, mindblown: 0, sad: 0, userReaction: null };

  // Calculate Dynamic Rating Average
  const totalStars = reviews.reduce((sum, r) => sum + (r.rating || 5), 0) + (userRating || 5);
  const totalCount = reviews.length + (userRating ? 1 : 0);
  const dynamicRating = totalCount > 0 ? (totalStars / totalCount).toFixed(1) : (book.rating || 5.0);

  const handleRateBook = (star) => {
    setUserRating(star);
    setSelectedRating(star);
  };

  const handleDeleteBook = () => {
    const msg = isEn
      ? `Are you sure you want to permanently delete "${book.title}"?`
      : `Êtes-vous sûr de vouloir supprimer définitivement le roman "${book.title}" ?`;
    if (window.confirm(msg)) {
      deleteBook(book.id);
      navigate('/');
    }
  };

  const handleEditBook = () => {
    navigate('/publish', { state: { editBookId: book.id } });
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    addBookReview(book.id, {
      id: 'rev-' + Date.now(),
      author: userProfile.name || (isEn ? 'Koko Reader' : 'Lecteur Koko'),
      rating: selectedRating,
      date: isEn ? 'Just now' : 'À l’instant',
      text: reviewComment.trim(),
      likes: 1,
      hates: 0,
    });

    setReviewSubmitted(true);
    setReviewComment('');
    setShowReviewModal(false);
  };

  const coverSrc = book.customCoverUrl || book.coverUrl || book.coverImage || (typeof book.cover === 'string' && (book.cover.startsWith('http') || book.cover.startsWith('data:')) ? book.cover : null);

  return (
    <div className="px-4 sm:px-6 pt-6 pb-8 text-ink max-w-4xl mx-auto">
      {/* Top Header Controls */}
      <div className="flex justify-between items-center mb-5">
        <IconButton aria-label="Go back" onClick={() => navigate(-1)}>
          <BackIcon className="w-4 h-4" />
        </IconButton>

        <div className="flex gap-2 items-center">
          {/* Author/Admin Edit & Delete Controls (ICON-ONLY AS REQUESTED) */}
          {isAuthor && (
            <>
              <button
                onClick={handleEditBook}
                title={isEn ? 'Edit novel' : 'Modifier le roman'}
                className="w-9 h-9 rounded-full bg-gold/15 text-gold border border-gold/40 flex items-center justify-center hover:bg-gold/25 transition-all shadow-sm"
              >
                <PenToolIcon className="w-4 h-4 text-gold" />
              </button>

              <button
                onClick={handleDeleteBook}
                title={isEn ? 'Delete novel' : 'Supprimer le roman'}
                className="w-9 h-9 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center hover:bg-red-100 transition-all shadow-sm"
              >
                <TrashIcon className="w-4 h-4 text-red-600" />
              </button>
            </>
          )}

          <IconButton
            aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this book'}
            onClick={() => toggleBookmark(book.id)}
            className={bookmarked ? 'bg-gold/20 text-gold border-gold/40' : ''}
          >
            <BookmarkIcon className={`w-4 h-4 ${bookmarked ? 'fill-gold text-gold' : ''}`} />
          </IconButton>
        </div>
      </div>

      {/* HERO SECTION — 2-COLUMN RESPONSIVE LAYOUT FOR DESKTOP & MOBILE */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center md:items-start text-left bg-white border border-surface-line p-5 sm:p-7 rounded-3xl shadow-sm mb-6">
        {/* LEFT: 3D VERTICAL BOOK COVER (3:4 RATIO — NO CROPPING!) */}
        <div className="w-48 sm:w-56 md:w-60 aspect-[3/4] flex-shrink-0 relative rounded-2xl overflow-hidden shadow-2xl border border-black/10 group bg-neutral-900 mx-auto md:mx-0">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={book.title}
              className="w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full p-4 flex flex-col justify-between items-center text-center bg-gradient-to-br from-[#181620] via-[#121118] to-[#0A0A0E] relative overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/25 via-transparent to-transparent opacity-70" />
              <div className="absolute inset-2.5 border border-gold/30 rounded-xl pointer-events-none" />

              <div className="pt-3 z-10">
                <span className="text-[9px] font-mono font-extrabold uppercase tracking-widest text-gold bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
                  {book.genres?.[0] || 'Roman Koko'}
                </span>
              </div>

              <div className="my-auto z-10 px-2 space-y-2">
                <BookOpenIcon className="w-8 h-8 text-gold mx-auto opacity-90 drop-shadow" />
                <h3 className="font-display font-extrabold text-[16px] text-paper leading-tight drop-shadow-md">
                  {book.title}
                </h3>
                <div className="w-8 h-[2px] bg-gold mx-auto rounded-full" />
              </div>

              <div className="pb-2 z-10">
                <span className="text-[10.5px] font-medium text-gold/80 italic">
                  par {book.author}
                </span>
              </div>
            </div>
          )}

          {/* Realistic 3D Book Spine Shadow on Left Edge */}
          <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/45 via-black/20 to-transparent pointer-events-none" />

          {/* Dynamic Rating Badge */}
          {reviews.length > 0 && dynamicRating && Number(dynamicRating) > 0 && (
            <div className="absolute top-2.5 right-2.5 bg-black/85 backdrop-blur-md text-white text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#FFD700]/70 shadow-lg">
              <StarIcon className="w-3.5 h-3.5 text-[#FFD700] fill-[#FFD700]" />
              <span className="text-white font-extrabold">{dynamicRating}</span>
            </div>
          )}
        </div>

        {/* RIGHT: BOOK DETAILS, METADATA & CTA */}
        <div className="flex-1 min-w-0 space-y-4 w-full">
          {/* Author & Admin Status Banner */}
          {isAuthor && (
            <div className={`p-3 rounded-2xl border text-[12px] flex items-center justify-between shadow-sm text-left ${
              book.status === 'DRAFT'
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-emerald-50 text-emerald-900 border-emerald-300'
            }`}>
              <div className="space-y-0.5">
                <span className="font-bold text-[12.5px] block">
                  {book.status === 'DRAFT'
                    ? (isEn ? '🟡 Private Draft Mode' : '🟡 Mode Brouillon Privé')
                    : (isEn ? '🟢 Live Published Mode' : '🟢 Publié Officiellement')}
                </span>
                <span className="text-[11px] opacity-80 block">
                  {book.status === 'DRAFT'
                    ? (isEn ? 'Only you & admin can view this book.' : 'Seul vous et l’administrateur voyez ce roman.')
                    : (isEn ? 'Visible to all readers across Koko.' : 'Visible par tous les lecteurs sur Koko.')}
                </span>
              </div>

              <button
                type="button"
                onClick={() => toggleBookStatus(book.id)}
                className={`px-3 py-1.5 rounded-xl font-bold text-[11px] border transition-all flex-shrink-0 ${
                  book.status === 'DRAFT'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}
              >
                {book.status === 'DRAFT' ? (isEn ? 'Publish Now' : 'Rendre Public') : (isEn ? 'Switch to Draft' : 'Passer Brouillon')}
              </button>
            </div>
          )}

          <div>
            <h1 className="font-display font-extrabold text-[24px] sm:text-[30px] text-ink leading-tight">
              {book.title}
            </h1>
            <p className="text-[13px] text-taupe font-medium mt-1">
              {isEn ? 'by' : 'par'} <span className="font-bold text-ink">{book.author}</span>
            </p>
          </div>

          {/* Tags */}
          <div className="flex gap-1.5 flex-wrap">
            {book.genres?.map((g) => (
              <Tag key={g}>{g}</Tag>
            ))}
            {book.level && <Tag>{book.level}</Tag>}
          </div>

          {/* Description / Synopsis */}
          {book.description && (
            <p className="text-[13px] text-ink/80 leading-relaxed font-medium">
              {book.description}
            </p>
          )}

          {/* Primary Start Reading Action Button */}
          <Link
            to={`/book/${book.id}/read/1`}
            className="inline-flex w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-deep text-paper font-bold text-[14px] shadow-lg hover:bg-black transition-all items-center justify-center gap-2 mt-2"
          >
            <BookOpenIcon className="w-4.5 h-4.5 text-gold" />
            <span>{isEn ? 'Start Reading (Chapter 1)' : 'Commencer la Lecture (Chapitre 1)'}</span>
          </Link>
        </div>
      </div>

      {/* DYNAMIC INTERACTIVE STAR RATING BAR */}
      <div className="bg-white border border-surface-line rounded-2xl p-3.5 mb-4 shadow-sm flex justify-between items-center text-left">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-taupe block">
            {isEn ? 'Your Rating' : 'Votre Note sur ce Roman'}
          </span>
          <span className="font-display font-bold text-[14px] text-ink">
            {userRating
              ? isEn ? `${userRating} Stars assigned ✓` : `${userRating} Étoiles attribuées ✓`
              : isEn ? 'Assign a Rating' : 'Attribuer une Note'}
          </span>
        </div>

        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => handleRateBook(star)}
              className="p-1 transition-transform hover:scale-125 active:scale-95"
              title={`Give ${star} stars`}
            >
              <StarIcon
                className={`w-6.5 h-6.5 transition-all ${
                  star <= (hoverRating || userRating || 0)
                    ? 'text-[#FFD700] fill-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.9)]'
                    : 'text-taupe/30 fill-transparent'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* PURE SVG ICON REACTION LIKES BAR */}
      <div className="bg-white border border-surface-line rounded-2xl p-3.5 mb-5 space-y-2 shadow-sm text-left">
        <span className="text-[10px] font-extrabold text-taupe uppercase tracking-wider block">
          {isEn ? 'Reactions' : 'Réactions'}
        </span>
        <div className="grid grid-cols-4 gap-2 text-center">
          {/* ❤️ J'aime — mapped to 'like' in Cloud DB */}
          <button
            onClick={() => toggleBookReaction(book.id, 'like')}
            className={`py-3 rounded-2xl border flex items-center justify-center gap-1.5 transition-all ${
              reactions.userReaction === 'like'
                ? 'bg-red-50 border-red-300 text-red-600 shadow-sm ring-1 ring-red-300'
                : 'bg-paper border-surface-line hover:border-red-300'
            }`}
            title={isEn ? 'Love' : 'Coup de Cœur'}
          >
            <HeartIcon className={`w-5 h-5 ${reactions.userReaction === 'like' ? 'fill-red-500 text-red-500' : 'text-red-400'}`} />
            <span className="text-[11px] font-mono font-bold text-ink">{reactions.likes ?? reactions.like ?? 0}</span>
          </button>

          {/* 👍 J'apprécie — mapped to 'love' in Cloud DB */}
          <button
            onClick={() => toggleBookReaction(book.id, 'love')}
            className={`py-3 rounded-2xl border flex items-center justify-center gap-1.5 transition-all ${
              reactions.userReaction === 'love'
                ? 'bg-sky-50 border-sky-300 text-sky-600 shadow-sm ring-1 ring-sky-300'
                : 'bg-paper border-surface-line hover:border-sky-300'
            }`}
            title={isEn ? 'Like' : 'J\'apprécie'}
          >
            <ThumbsUpIcon className={`w-5 h-5 ${reactions.userReaction === 'love' ? 'fill-sky-500 text-sky-500' : 'text-sky-400'}`} />
            <span className="text-[11px] font-mono font-bold text-ink">{reactions.love || 0}</span>
          </button>

          {/* ✨ Captivant — mapped to 'mindblown' in Cloud DB */}
          <button
            onClick={() => toggleBookReaction(book.id, 'mindblown')}
            className={`py-3 rounded-2xl border flex items-center justify-center gap-1.5 transition-all ${
              reactions.userReaction === 'mindblown'
                ? 'bg-amber-50 border-amber-300 text-amber-600 shadow-sm ring-1 ring-amber-300'
                : 'bg-paper border-surface-line hover:border-amber-300'
            }`}
            title={isEn ? 'Captivating' : 'Captivant'}
          >
            <SparklesIcon className={`w-5 h-5 ${reactions.userReaction === 'mindblown' ? 'fill-amber-500 text-amber-500' : 'text-amber-400'}`} />
            <span className="text-[11px] font-mono font-bold text-ink">{reactions.mindblown || 0}</span>
          </button>

          {/* ⭐ Favori — mapped to 'sad' in Cloud DB */}
          <button
            onClick={() => toggleBookReaction(book.id, 'sad')}
            className={`py-3 rounded-2xl border flex items-center justify-center gap-1.5 transition-all ${
              reactions.userReaction === 'sad'
                ? 'bg-purple-50 border-purple-300 text-purple-600 shadow-sm ring-1 ring-purple-300'
                : 'bg-paper border-surface-line hover:border-purple-300'
            }`}
            title={isEn ? 'Favorite' : 'Favori'}
          >
            <StarIcon className={`w-5 h-5 ${reactions.userReaction === 'sad' ? 'fill-purple-500 text-purple-500' : 'text-purple-400'}`} />
            <span className="text-[11px] font-mono font-bold text-ink">{reactions.sad || 0}</span>
          </button>
        </div>
      </div>

      {/* Read Book Main CTA */}
      <Link
        to={`/book/${book.id}/read/1`}
        className="flex items-center justify-center gap-2 bg-deep text-paper hover:bg-deep-2 transition-all rounded-2xl py-4 font-bold text-[14px] shadow-lg active:scale-95 mb-4"
      >
        <PlayIcon className="w-4 h-4 text-gold fill-gold" />
        <span>{isEn ? 'Start Reading (Chapter 1)' : 'Commencer la Lecture (Chapitre 1)'}</span>
      </Link>

      {/* CHAPTER LIST — with reading progress */}
      {book.chaptersData && book.chaptersData.length > 0 && (() => {
        const allProgress = JSON.parse(localStorage.getItem('koko_reading_progress') || '{}');
        const bookProgress = allProgress[book.id];
        const lastReadChapter = bookProgress?.chapter || 0;
        const totalChapters = book.chaptersData.length;

        return (
          <div className="bg-white border border-surface-line rounded-2xl shadow-sm mb-5 overflow-hidden text-left">
            <div className="px-4 py-3 border-b border-surface-line flex items-center justify-between">
              <h3 className="font-display font-bold text-[15px] text-ink">
                {isEn ? `Chapters (${totalChapters})` : `Chapitres (${totalChapters})`}
              </h3>
              {lastReadChapter > 0 && (
                <span className="text-[10.5px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {Math.round(((lastReadChapter - 1) / totalChapters) * 100)}% {isEn ? 'completed' : 'complété'}
                </span>
              )}
            </div>
            <div className="divide-y divide-surface-line/60">
              {book.chaptersData.map((chap, i) => {
                const chapNum = i + 1;
                const isRead = chapNum < lastReadChapter;
                const isCurrent = chapNum === lastReadChapter;
                return (
                  <Link
                    key={chapNum}
                    to={`/book/${book.id}/read/${chapNum}`}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-paper transition-colors ${isCurrent ? 'bg-gold/5' : ''}`}
                  >
                    {/* Chapter status dot */}
                    <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-extrabold border
                      ${isRead ? 'bg-emerald-500 border-emerald-500 text-white' :
                        isCurrent ? 'bg-gold border-gold text-deep' :
                        'bg-paper border-surface-line text-taupe'}`}>
                      {isRead ? '✓' : chapNum}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-bold truncate ${isCurrent ? 'text-gold' : 'text-ink'}`}>
                        {chap.title || `${isEn ? 'Chapter' : 'Chapitre'} ${chapNum}`}
                      </p>
                      {isCurrent && (
                        <p className="text-[10px] text-gold font-bold">
                          ▶ {isEn ? 'Continue reading' : 'Reprendre la lecture'}
                        </p>
                      )}
                    </div>

                    <span className="text-[11px] font-mono text-taupe flex-shrink-0">
                      {chap.audioDuration || '—'}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Description */}
      <p className="text-[13px] leading-relaxed text-ink opacity-90 mb-6 text-left">{book.description}</p>


      {/* PURIFIED ACTION NAVIGATION (MODAL AVIS vs REDIRECTION FORUM DÉDIÉ) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setShowReviewModal(true)}
          className="p-4 rounded-2xl bg-white border border-surface-line hover:border-gold text-left space-y-1 shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-gold">
            <StarIcon className="w-5 h-5 fill-gold" />
            <span className="text-[11px] font-bold">({reviews.length})</span>
          </div>
          <h3 className="font-display font-bold text-[14px] text-ink group-hover:text-gold transition-colors">
            {isEn ? 'Reviews & Ratings' : 'Avis & Critiques'}
          </h3>
          <p className="text-[10.5px] text-taupe">
            {isEn ? 'Write a review →' : 'Donner votre avis →'}
          </p>
        </button>

        <button
          onClick={() => navigate('/forum')}
          className="p-4 rounded-2xl bg-white border border-surface-line hover:border-gold text-left space-y-1 shadow-sm transition-all group"
        >
          <div className="flex items-center justify-between text-gold">
            <UsersIcon className="w-5 h-5 text-gold" />
            <span className="text-[11px] font-bold">{isEn ? 'Topics' : 'Thèmes'}</span>
          </div>
          <h3 className="font-display font-bold text-[14px] text-ink group-hover:text-gold transition-colors">
            {isEn ? 'Reading Forum' : 'Forum de Lecture'}
          </h3>
          <p className="text-[10.5px] text-taupe">
            {isEn ? 'Go to Forum →' : 'Accéder au Forum →'}
          </p>
        </button>
      </div>

      {/* REVIEWS LIST SECTION */}
      <div className="bg-white border border-surface-line rounded-2xl p-4 shadow-sm space-y-3 text-left">
        <div className="flex justify-between items-center pb-2 border-b border-surface-line">
          <h3 className="font-display font-bold text-[15px] text-ink">
            {isEn ? `Reader Reviews (${reviews.length})` : `Avis des Lecteurs (${reviews.length})`}
          </h3>
          <button
            onClick={() => setShowReviewModal(true)}
            className="text-[11.5px] font-bold text-gold hover:underline"
          >
            {isEn ? '+ Post a review' : '+ Publier un avis'}
          </button>
        </div>

        {reviews.length === 0 ? (
          <p className="text-[12px] text-taupe py-4 text-center">
            {isEn ? 'No reviews written yet. Be the first!' : 'Aucun avis rédigé pour l\'instant. Soyez le premier !'}
          </p>
        ) : (
          <div className="space-y-3 pt-1">
            {reviews.map((rev) => (
              <div key={rev.id} className="p-3.5 rounded-2xl bg-paper border border-surface-line space-y-1.5 shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gold/20 text-gold font-bold text-[11px] flex items-center justify-center border border-gold/30">
                      {rev.author.charAt(0)}
                    </div>
                    <div>
                      <span className="font-display font-bold text-[13px] text-ink">{rev.author}</span>
                      <span className="text-[9.5px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded ml-1.5 border border-emerald-200">
                        {isEn ? 'Koko Reader' : 'Lecteur Koko'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-bold text-gold">
                    <StarIcon className="w-3.5 h-3.5 fill-gold" />
                    <span>{rev.rating}/5</span>
                  </div>
                </div>

                <p className="text-[12.5px] text-ink leading-relaxed pl-9">{rev.text}</p>
                <span className="text-[10px] text-taupe pl-9 block">{rev.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REVIEW MODAL */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowReviewModal(false)}>
          <div className="bg-paper border border-surface-line rounded-3xl p-5 w-full max-w-md text-left relative shadow-2xl space-y-3.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-surface-line pb-2.5">
              <div className="flex items-center gap-1.5">
                <StarIcon className="w-4 h-4 text-gold fill-gold" />
                <span className="text-[12px] font-extrabold uppercase text-gold">
                  {isEn ? 'Give Your Review' : 'Donner votre Avis'}
                </span>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="text-taupe text-lg font-bold hover:text-ink">
                ×
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3">
              <div>
                <label className="block text-[10.5px] font-bold text-taupe uppercase mb-1">
                  {isEn ? 'Your Rating' : 'Votre Note'}
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelectedRating(star)}
                      className="p-1 transition-transform hover:scale-125"
                    >
                      <StarIcon
                        className={`w-7 h-7 ${
                          star <= selectedRating ? 'fill-gold text-gold' : 'text-taupe/30 fill-transparent'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-taupe uppercase mb-1">
                  {isEn ? 'Your Review*' : 'Votre Critique*'}
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder={isEn ? 'Explain what you enjoyed in this story...' : 'Expliquez ce que vous avez aimé dans cette histoire...'}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-white border border-surface-line text-[12.5px] outline-none focus:border-gold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-deep text-paper py-3 rounded-xl font-bold text-[13px] shadow-sm hover:opacity-95"
              >
                {isEn ? 'Publish My Review' : 'Publier ma Critique'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
