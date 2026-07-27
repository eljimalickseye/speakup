import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { covers } from '../lib/api.js';
import { BookOpenIcon, BookmarkIcon, PlusIcon, TrashIcon, CheckIcon, PlayIcon, StarIcon } from '../components/ui/Icons.jsx';
import { CoverArt } from '../components/ui/primitives.jsx';
import BookCard from '../components/book/BookCard.jsx';

export default function Library() {
  const navigate = useNavigate();
  const { booksList, bookmarks, savedVocab, addVocabWord, removeVocabWord, appLanguage } = useApp();
  const isEn = appLanguage === 'en';

  const [activeTab, setActiveTab] = useState('reading');
  const [allProgress, setAllProgress] = useState({});
  const [lastBook, setLastBook] = useState(null);

  // Form state for adding new vocabulary word
  const [newEn, setNewEn] = useState('');
  const [newFr, setNewFr] = useState('');
  const [justAdded, setJustAdded] = useState(false);

  // Read reading progress from localStorage
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('koko_reading_progress') || '{}');
    setAllProgress(stored);
    const last = JSON.parse(localStorage.getItem('koko_last_book') || 'null');
    setLastBook(last);
  }, []);

  const bookmarkedBooks = booksList.filter((b) => bookmarks.includes(b.id));

  // All in-progress books (have progress data)
  const inProgressBooks = Object.values(allProgress)
    .sort((a, b) => new Date(b.lastRead) - new Date(a.lastRead))
    .map((p) => ({ ...p, book: booksList.find((b) => b.id === p.bookId) }))
    .filter((p) => p.book);

  // Featured book = last opened
  const featuredProgress = lastBook;
  const featuredBook = featuredProgress ? booksList.find((b) => b.id === featuredProgress.bookId) : null;

  const handleAddVocabSubmit = (e) => {
    e.preventDefault();
    if (!newEn.trim()) return;
    addVocabWord(newEn.trim(), newFr.trim() || newEn.trim());
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
    setNewEn('');
    setNewFr('');
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="px-5 pt-6 pb-6 text-ink space-y-6 animate-fadeIn">
      {/* Page Title Header */}
      <div className="flex justify-between items-center text-left">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-taupe block">
            {isEn ? 'Your Workspace' : 'Votre Espace Personnel'}
          </span>
          <h1 className="font-display font-bold text-[22px]">
            {isEn ? 'My Library' : 'Ma Bibliothèque'}
          </h1>
        </div>
      </div>

      {/* FEATURED ACTIVE READING NOVEL HERO CARD */}
      {featuredBook ? (
        <div className="bg-[#122A28] text-white rounded-3xl p-5 shadow-xl border border-gold/40 relative overflow-hidden text-left space-y-4">
          {/* Decorative glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gold/10 blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-gold bg-gold/15 px-3 py-1 rounded-full border border-gold/30">
              📖 {isEn ? 'Continue Reading' : 'Lecture en Cours'}
            </span>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              {featuredProgress?.progress ?? 0}% {isEn ? 'completed' : 'complété'}
            </span>
          </div>

          <div className="flex gap-4 items-center">
            <div
              className="w-16 h-24 rounded-2xl flex-shrink-0 relative overflow-hidden shadow-lg border border-gold/30"
              style={{ background: covers[featuredBook.cover] || covers.c1 }}
            >
              {featuredBook.customCoverUrl ? (
                <img src={featuredBook.customCoverUrl} alt={featuredBook.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpenIcon className="w-6 h-6 opacity-30 text-white" />
                </div>
              )}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <h3 className="font-display italic font-bold text-[17px] text-white leading-tight line-clamp-2">
                {featuredBook.title}
              </h3>
              <p className="text-[11.5px] text-white/70">
                {isEn ? 'by' : 'par'} {featuredBook.author} · {isEn ? `Chapter ${featuredProgress?.chapter || 1}` : `Chapitre ${featuredProgress?.chapter || 1}`}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/10 mt-2">
                <div
                  className="bg-gradient-to-r from-gold to-amber-300 h-full rounded-full transition-all duration-500"
                  style={{ width: `${featuredProgress?.progress ?? 0}%` }}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate(`/book/${featuredBook.id}/read/${featuredProgress?.chapter || 1}`)}
            className="w-full bg-gold text-deep font-bold text-[13px] py-2.5 rounded-2xl shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <PlayIcon className="w-4 h-4 text-deep fill-deep" />
            <span>{isEn ? 'Resume Reading' : 'Reprendre la Lecture →'}</span>
          </button>
        </div>
      ) : (
        /* Empty state when no reading started yet */
        <div className="bg-white border border-surface-line rounded-3xl p-6 text-center space-y-3 shadow-sm">
          <BookOpenIcon className="w-10 h-10 text-taupe mx-auto opacity-40" />
          <p className="font-display font-bold text-[15px] text-ink">
            {isEn ? 'No reading in progress' : 'Aucune lecture en cours'}
          </p>
          <p className="text-[12px] text-taupe">
            {isEn ? 'Open a book to start reading and track your progress.' : 'Ouvrez un roman pour commencer à lire et suivre votre progression.'}
          </p>
          <button
            onClick={() => navigate('/discover')}
            className="inline-block bg-deep text-paper px-5 py-2.5 rounded-xl font-bold text-[12.5px] shadow-sm"
          >
            {isEn ? 'Discover Books →' : 'Découvrir les Romans →'}
          </button>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex border-b border-surface-line w-full text-center">
        <button
          onClick={() => setActiveTab('reading')}
          className={`flex-1 pb-2.5 text-[12.5px] font-bold transition-colors ${
            activeTab === 'reading' ? 'text-ink border-b-2 border-gold font-extrabold' : 'text-taupe'
          }`}
        >
          {isEn ? 'In Progress' : 'En Cours'} ({inProgressBooks.length})
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`flex-1 pb-2.5 text-[12.5px] font-bold transition-colors ${
            activeTab === 'bookmarks' ? 'text-ink border-b-2 border-gold font-extrabold' : 'text-taupe'
          }`}
        >
          {isEn ? 'Saved' : 'Favoris'} ({bookmarkedBooks.length})
        </button>

        <button
          onClick={() => setActiveTab('vocab')}
          className={`flex-1 pb-2.5 text-[12.5px] font-bold transition-colors ${
            activeTab === 'vocab' ? 'text-ink border-b-2 border-gold font-extrabold' : 'text-taupe'
          }`}
        >
          {isEn ? 'Words' : 'Mots'} ({savedVocab.length})
        </button>
      </div>

      {activeTab === 'reading' && (
        <div className="space-y-3 text-left">
          <h2 className="font-display font-bold text-[16px]">
            {isEn ? 'All In-Progress Readings' : 'Toutes les Lectures en Cours'}
          </h2>

          {inProgressBooks.length === 0 ? (
            <div className="bg-white border border-surface-line rounded-2xl p-6 text-center space-y-2 shadow-sm">
              <p className="text-[12px] text-taupe">
                {isEn ? 'Open any book to see your progress here.' : 'Ouvrez un roman pour voir votre progression ici.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {inProgressBooks.map(({ book, bookId, chapter, progress, lastRead }) => {
                const totalChaps = book.chaptersData?.length || 10;
                return (
                  <Link
                    key={bookId}
                    to={`/book/${bookId}/read/${chapter}`}
                    className="bg-white border border-surface-line rounded-2xl p-3.5 flex items-center gap-3 shadow-sm hover:border-gold transition-all block"
                  >
                    {/* Mini cover */}
                    <div
                      className="w-10 h-14 rounded-xl flex-shrink-0 overflow-hidden border border-surface-line/50"
                      style={{ background: covers[book.cover] || covers.c1 }}
                    >
                      {book.customCoverUrl ? (
                        <img src={book.customCoverUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-white font-bold text-[11px] opacity-60">{book.title?.charAt(0)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-[14px] text-ink truncate">{book.title}</p>
                      <p className="text-[11px] text-taupe font-semibold mb-1.5">
                        {isEn ? `Chapter ${chapter}` : `Chapitre ${chapter}`} / {totalChaps}
                      </p>
                      {/* Progress bar */}
                      <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gold h-full rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-gold bg-gold/10 px-2.5 py-1 rounded-full border border-gold/20 flex-shrink-0">
                      {progress}%
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bookmarks' && (
        <div className="space-y-3 text-left">
          <h2 className="font-display font-bold text-[16px]">
            {isEn ? `Saved Novels (${bookmarkedBooks.length})` : `Romans Sauvegardés (${bookmarkedBooks.length})`}
          </h2>

          {bookmarkedBooks.length === 0 ? (
            <div className="bg-white border border-surface-line rounded-2xl p-6 text-center space-y-2 shadow-sm">
              <p className="text-[12px] text-taupe">
                {isEn ? 'No novels saved in your bookmarks.' : 'Aucun roman sauvegardé dans vos favoris.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {bookmarkedBooks.map((b) => (
                <BookCard key={b.id} book={b} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'vocab' && (
        <div className="space-y-5 text-left">
          <form onSubmit={handleAddVocabSubmit} className="bg-white p-4 rounded-2xl border border-surface-line shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gold uppercase tracking-wider block">
                {isEn ? 'Add Word to Notebook' : 'Ajouter un Mot au Carnet'}
              </span>
              {justAdded && (
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 animate-fadeIn">
                  <CheckIcon className="w-3 h-3" />
                  <span>{isEn ? 'Saved!' : 'Ajouté !'}</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder={isEn ? 'English Word' : 'Mot Anglais'}
                value={newEn}
                onChange={(e) => setNewEn(e.target.value)}
                className="px-3 py-2 rounded-xl bg-paper border border-surface-line text-[12.5px] outline-none font-semibold text-ink"
              />
              <input
                type="text"
                placeholder={isEn ? 'French Translation' : 'Traduction Française'}
                value={newFr}
                onChange={(e) => setNewFr(e.target.value)}
                className="px-3 py-2 rounded-xl bg-paper border border-surface-line text-[12.5px] outline-none font-semibold text-ink"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-deep text-paper py-2.5 rounded-xl font-bold text-[12.5px] shadow-sm hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-1.5"
            >
              <PlusIcon className="w-4 h-4 text-gold" />
              <span>{isEn ? 'Save Word to Notebook' : 'Enregistrer dans mon Carnet'}</span>
            </button>
          </form>

          <div className="space-y-2.5">
            <h3 className="font-display font-bold text-[15px] text-ink">
              {isEn ? `Saved Words (${savedVocab.length})` : `Mots Enregistrés (${savedVocab.length})`}
            </h3>

            {savedVocab.length === 0 ? (
              <div className="bg-white border border-surface-line rounded-2xl p-6 text-center space-y-2 shadow-sm">
                <BookmarkIcon className="w-8 h-8 text-taupe mx-auto" />
                <p className="font-display font-bold text-[14px]">
                  {isEn ? 'Notebook is empty' : 'Votre carnet est vide'}
                </p>
                <p className="text-[11.5px] text-taupe">
                  {isEn ? 'Tap words while reading to save them!' : 'Touchez des mots en cours de lecture pour les enregistrer !'}
                </p>
              </div>
            ) : (
              savedVocab.map((item) => {
                const meaningsList = Array.isArray(item.meanings) ? item.meanings : [item.fr || item.en];
                return (
                  <div key={item.id} className="bg-white border border-surface-line rounded-2xl p-4 space-y-2 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display font-extrabold text-[15px] text-ink capitalize block">{item.en}</span>
                          {item.timesSaved > 1 && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gold/20 text-gold">
                              {item.timesSaved}×
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-taupe font-medium">{item.date || 'À l\'instant'}</span>
                      </div>
                      <button
                        onClick={() => removeVocabWord(item.id)}
                        className="p-1.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                        title="Supprimer le mot"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {meaningsList.map((m, mIdx) => (
                        <span key={mIdx} className="text-[11.5px] font-bold px-2.5 py-0.5 rounded-lg bg-gold/10 border border-gold/25 text-ink">
                          • {m}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
