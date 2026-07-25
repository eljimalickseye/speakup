import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { getLibrary } from '../lib/api.js';
import { BookOpenIcon, BookmarkIcon, PlusIcon, TrashIcon, CheckIcon } from '../components/ui/Icons.jsx';

export default function Library() {
  const { booksList, bookmarks, savedVocab, addVocabWord, removeVocabWord, appLanguage } = useApp();
  const isEn = appLanguage === 'en';
  
  const [activeTab, setActiveTab] = useState('reading'); // 'reading' | 'vocab'
  const [userLib, setUserLib] = useState([]);

  // Form state for adding new vocabulary word
  const [newEn, setNewEn] = useState('');
  const [newFr, setNewFr] = useState('');
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    getLibrary().then(setUserLib);
  }, []);

  const bookmarkedBooks = booksList.filter((b) => bookmarks.includes(b.id));

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
    <div className="px-5 pt-6 pb-6 text-ink space-y-5 animate-fadeIn">
      {/* Page Title */}
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

      {/* Top Navigation Switcher */}
      <div className="flex border-b border-surface-line w-full text-center">
        <button
          onClick={() => setActiveTab('reading')}
          className={`flex-1 pb-2.5 text-[12.5px] font-bold transition-colors ${
            activeTab === 'reading' ? 'text-ink border-b-2 border-gold font-extrabold' : 'text-taupe'
          }`}
        >
          {isEn ? 'Readings & Bookmarks' : 'Lectures & Favoris'} ({userLib.length + bookmarkedBooks.length})
        </button>

        <button
          onClick={() => setActiveTab('vocab')}
          className={`flex-1 pb-2.5 text-[12.5px] font-bold transition-colors ${
            activeTab === 'vocab' ? 'text-ink border-b-2 border-gold font-extrabold' : 'text-taupe'
          }`}
        >
          {isEn ? 'Vocabulary Notebook' : 'Carnet de Mots'} ({savedVocab.length})
        </button>
      </div>

      {activeTab === 'reading' ? (
        <div className="space-y-6">
          {/* Continue Reading Section */}
          <div className="space-y-3 text-left">
            <h2 className="font-display font-bold text-[16px]">
              {isEn ? 'Continue Reading' : 'Lectures en cours'}
            </h2>

            {userLib.length === 0 || booksList.length === 0 ? (
              <div className="bg-white border border-surface-line rounded-2xl p-6 text-center space-y-2 shadow-sm">
                <BookOpenIcon className="w-8 h-8 text-taupe mx-auto" />
                <p className="font-display font-bold text-[14px]">
                  {isEn ? 'No reading in progress' : 'Aucune lecture en cours'}
                </p>
                <p className="text-[11.5px] text-taupe">
                  {isEn ? 'Browse the catalog to start your first bilingual novel.' : 'Parcourez le catalogue pour commencer votre premier roman bilingue.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {userLib.map((item) => {
                  const book = booksList.find((b) => b.id === item.bookId);
                  if (!book) return null;

                  return (
                    <Link
                      key={item.bookId}
                      to={`/book/${book.id}/read/${item.chapter}`}
                      className="bg-white border border-surface-line rounded-2xl p-3.5 flex items-center justify-between shadow-sm hover:border-gold transition-all block"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 rounded bg-surface border border-surface-line flex items-center justify-center font-bold text-[12px] text-taupe">
                          {book.title?.charAt(0)}
                        </div>
                        <div className="text-left">
                          <p className="font-display font-bold text-[14px] text-ink">{book.title}</p>
                          <p className="text-[11px] text-taupe">
                            {isEn ? `Chapter ${item.chapter} · ${item.progress}% completed` : `Chapitre ${item.chapter} · ${item.progress}% complété`}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-gold bg-gold/10 px-3 py-1.5 rounded-full">
                        {isEn ? 'Resume →' : 'Reprendre →'}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bookmarks Section */}
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
              <div className="grid grid-cols-2 gap-3">
                {bookmarkedBooks.map((b) => (
                  <Link
                    key={b.id}
                    to={`/book/${b.id}`}
                    className="bg-white border border-surface-line rounded-2xl p-3 text-left space-y-1 block shadow-sm hover:border-gold"
                  >
                    <div className="h-28 rounded-xl bg-gradient-to-br from-deep to-deep-2 text-paper flex items-center justify-center font-display font-bold text-[16px]">
                      {b.title?.charAt(0)}
                    </div>
                    <h4 className="font-display font-bold text-[13px] text-ink truncate">{b.title}</h4>
                    <p className="text-[10.5px] text-taupe truncate">
                      {isEn ? 'by' : 'par'} {b.author}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VOCABULARY NOTEBOOK TAB WITH FAST FUNCTIONAL WORD ADDITION */
        <div className="space-y-5 text-left">
          {/* Fast Add Word Form */}
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
                placeholder={isEn ? 'English Word (e.g. Lighthouse)' : 'Mot Anglais (ex: Lighthouse)'}
                value={newEn}
                onChange={(e) => setNewEn(e.target.value)}
                className="px-3 py-2 rounded-xl bg-paper border border-surface-line text-[12.5px] outline-none font-semibold text-ink"
              />
              <input
                type="text"
                placeholder={isEn ? 'French Translation (e.g. Phare)' : 'Traduction Française (ex: Phare)'}
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

          {/* Saved Vocabulary List */}
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
                  {isEn ? 'Use the form above or tap words while reading to save them!' : 'Utilisez le formulaire ci-dessus ou touchez des mots en cours de lecture pour les enregistrer !'}
                </p>
              </div>
            ) : (
              savedVocab.map((item) => (
                <div key={item.id} className="bg-white border border-surface-line rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
                  <div>
                    <span className="font-display font-bold text-[14px] text-ink capitalize block">{item.en}</span>
                    <span className="text-[12px] text-taupe font-semibold">{item.fr}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeVocabWord(item.id)}
                      className="p-2 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                      title={isEn ? 'Remove word' : 'Supprimer le mot'}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
