import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import BookCard from '../components/book/BookCard.jsx';
import { covers } from '../lib/api.js';
import { CoverArt } from '../components/ui/primitives.jsx';
import { BookOpenIcon, PlayIcon, PlusIcon, SearchIcon, SparklesIcon, StarIcon } from '../components/ui/Icons.jsx';

export default function Home() {
  const { booksList, userProfile, userLibrary, isLoggedIn, appLanguage } = useApp();
  const navigate = useNavigate();
  const isEn = appLanguage === 'en';

  const [activeCategory, setActiveCategory] = useState('Tous');
  const [imgErrors, setImgErrors] = useState({});

  const handleImgError = (bookId) => {
    setImgErrors((prev) => ({ ...prev, [bookId]: true }));
  };

  const isAuthor = isLoggedIn && (userProfile.role === 'admin' || userProfile.role === 'author');

  // Dynamic Greeting based on Local Time & Language
  const hour = new Date().getHours();
  const timeGreeting = isEn
    ? hour >= 18 || hour < 5 ? 'Good evening' : 'Good morning'
    : hour >= 18 || hour < 5 ? 'Bonsoir' : 'Bonjour';
  const userName = isLoggedIn ? (userProfile.name?.split(' ')[0] || (isEn ? 'Reader' : 'Lecteur')) : '';

  // Get In-Progress Book (Continue Reading)
  const inProgressItem = userLibrary.find((item) => item.progress > 0) || (booksList[0] ? {
    id: booksList[0].id,
    title: booksList[0].title,
    author: booksList[0].author,
    cover: booksList[0].cover,
    customCoverUrl: booksList[0].customCoverUrl,
    chapter: 1,
    totalChapters: booksList[0].chapterCount || 1,
    progress: 35,
  } : null);

  const filteredBooks = booksList.filter((b) => {
    // Draft Visibility Check: DRAFT books are only visible to the author or admin; PUBLISHED books are visible to ALL
    if (b.status === 'DRAFT' && b.author !== userProfile?.name && userProfile?.role !== 'admin') {
      return false;
    }
    if (activeCategory === 'Tous' || activeCategory === 'All') return true;
    return b.genres && b.genres.includes(activeCategory);
  });

  const categories = [
    isEn ? 'All' : 'Tous',
    'Romance',
    isEn ? 'Literary Fiction' : 'Fiction Littéraire',
    isEn ? 'Mystery & Thriller' : 'Mystère & Thriller',
    isEn ? 'Tales & Folklore' : 'Contes & Folklore',
  ];

  return (
    <div className="px-5 pt-2 pb-6 text-ink space-y-6 animate-fadeIn">
      {/* Dynamic Greeting Title */}
      <div className="space-y-1 text-left pt-1">
        <h1 className="font-display font-bold text-[24px] text-ink leading-tight flex items-center gap-2">
          <span>{timeGreeting}{userName ? `, ${userName}` : ''}</span>
          <SparklesIcon className="w-5 h-5 text-gold animate-float" />
        </h1>
        <p className="text-[13px] text-taupe">
          {booksList.length > 0
            ? isEn
              ? `${booksList.length} ${booksList.length > 1 ? 'bilingual stories waiting for you' : 'bilingual story waiting for you'}.`
              : `${booksList.length} ${booksList.length > 1 ? 'histoires bilingues vous attendent' : 'histoire bilingue vous attend'}.`
            : isEn ? 'No novels available right now.' : 'Aucun roman disponible pour le moment.'}
        </p>
      </div>

      {/* CONTINUE READING CARD ("REPRENDRE LA LECTURE") */}
      {inProgressItem && booksList.length > 0 && (
        <div className="space-y-2 text-left animate-fadeIn">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-taupe block">
            {isEn ? 'Continue Reading' : 'Reprendre la Lecture'}
          </span>

          <div
            onClick={() => navigate(`/book/${inProgressItem.id}/read/${inProgressItem.chapter || 1}`)}
            className="bg-white border border-surface-line rounded-3xl p-4 shadow-sm hover:shadow-md hover:border-gold transition-all cursor-pointer flex items-center gap-4 group"
          >
            <CoverArt
              gradient={covers[inProgressItem.cover] || covers.c1}
              className="w-16 h-22 rounded-2xl flex-shrink-0 relative overflow-hidden flex items-center justify-center text-paper shadow-md group-hover:scale-105 transition-transform"
            >
              {inProgressItem.customCoverUrl && !imgErrors[inProgressItem.id] ? (
                <img
                  src={inProgressItem.customCoverUrl}
                  alt={inProgressItem.title}
                  onError={() => handleImgError(inProgressItem.id)}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <BookOpenIcon className="w-6 h-6 opacity-30 text-white" />
              )}
            </CoverArt>

            <div className="space-y-2 flex-1 min-w-0">
              <div>
                <h3 className="font-display italic font-bold text-[16px] text-ink break-words line-clamp-2 leading-tight group-hover:text-gold transition-colors max-w-full overflow-hidden">
                  {inProgressItem.title}
                </h3>
                <span className="text-[11.5px] text-taupe block">
                  {isEn
                    ? `Chapter ${inProgressItem.chapter || 1} of ${inProgressItem.totalChapters || 1}`
                    : `Chapitre ${inProgressItem.chapter || 1} sur ${inProgressItem.totalChapters || 1}`}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-paper rounded-full h-1.5 overflow-hidden border border-surface-line">
                <div
                  className="bg-gold h-full rounded-full transition-all duration-300"
                  style={{ width: `${inProgressItem.progress || 35}%` }}
                />
              </div>

              <div className="flex items-center gap-1.5 text-gold font-bold text-[12px] pt-0.5">
                <PlayIcon className="w-3.5 h-3.5 text-gold fill-gold" />
                <span>{isEn ? 'Resume' : 'Reprendre'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DYNAMIC ANIMATED EMPTY CATALOG STATE */}
      {booksList.length === 0 && (
        <div className="space-y-4 text-left">
          {/* Main Empty Catalog Card */}
          <div className="bg-white border border-surface-line rounded-3xl p-8 text-center space-y-4 shadow-sm relative overflow-hidden group hover:border-gold transition-all animate-fadeIn">
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/25 via-gold/15 to-gold/5 text-gold flex items-center justify-center mx-auto border border-gold/40 shadow-md animate-float relative">
                <BookOpenIcon className="w-8 h-8 text-gold" />
                <SparklesIcon className="w-4 h-4 text-gold absolute -top-1 -right-1 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
            </div>

            <div className="space-y-2 relative z-10">
              <h2 className="font-display font-bold text-[20px] text-ink">
                {isEn ? 'No novels in catalog' : 'Aucun roman dans le catalogue'}
              </h2>
              <p className="text-[12.5px] text-taupe max-w-xs mx-auto leading-relaxed">
                {isEn
                  ? 'The catalog is currently empty. New immersive bilingual novels will be published soon!'
                  : 'Le catalogue est actuellement vide. De nouveaux romans bilingues immersifs seront publiés très bientôt !'}
              </p>
            </div>

            <div className="pt-2 relative z-10">
              {isAuthor ? (
                <button
                  onClick={() => navigate('/publish')}
                  className="bg-deep text-paper font-bold text-[13px] px-6 py-3.5 rounded-2xl shadow-md hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2 relative overflow-hidden group/btn"
                >
                  <PlusIcon className="w-4 h-4 text-gold" />
                  <span>{isEn ? 'Publish a Novel (Studio)' : 'Publier un Roman (Studio)'}</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/discover')}
                  className="bg-deep text-paper font-bold text-[13px] px-6 py-3.5 rounded-2xl shadow-md hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2 relative overflow-hidden group/btn"
                >
                  <SearchIcon className="w-4 h-4 text-gold" />
                  <span>{isEn ? 'Discover Library' : 'Découvrir la Bibliothèque'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CATALOG GRID */}
      {booksList.length > 0 && (
        <div className="space-y-3 text-left">
          <h2 className="font-display font-bold text-[18px]">
            {isEn ? `Novel Catalog (${filteredBooks.length})` : `Catalogue des Romans (${filteredBooks.length})`}
          </h2>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-[11.5px] font-bold whitespace-nowrap border transition-all ${
                  activeCategory === cat
                    ? 'bg-gold text-paper border-gold shadow-sm'
                    : 'bg-white border-surface-line text-taupe hover:border-gold'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
