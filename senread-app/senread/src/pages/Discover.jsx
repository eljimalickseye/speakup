import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { SearchIcon, BookOpenIcon } from '../components/ui/Icons.jsx';
import { covers } from '../lib/api.js';
import { CoverArt } from '../components/ui/primitives.jsx';
import { Link } from 'react-router-dom';
import BookCard from '../components/book/BookCard.jsx';

export default function Discover() {
  const { booksList, appLanguage, userProfile } = useApp();
  const isEn = appLanguage === 'en';

  const genres = [
    isEn ? 'All' : 'Tous',
    'Romance',
    isEn ? 'Literary Fiction' : 'Fiction Littéraire',
    isEn ? 'Mystery & Thriller' : 'Mystère & Thriller',
    isEn ? 'Tales & Folklore' : 'Contes & Folklore',
    isEn ? 'Drama' : 'Drame',
  ];

  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState(isEn ? 'All' : 'Tous');
  const [failedImages, setFailedImages] = useState({});

  const handleImageError = (bookId) => {
    setFailedImages((prev) => ({ ...prev, [bookId]: true }));
  };

  const filtered = useMemo(() => {
    return booksList.filter((b) => {
      // Draft check: DRAFT books are only visible to the author or admin; PUBLISHED books are visible to ALL
      if (b.status === 'DRAFT' && b.author !== userProfile?.name && userProfile?.role !== 'admin') {
        return false;
      }
      const isAll = genre === 'Tous' || genre === 'All';
      const matchesGenre = isAll || (b.genres && b.genres.includes(genre));
      const matchesQuery =
        query.trim() === '' ||
        b.title.toLowerCase().includes(query.toLowerCase()) ||
        b.author.toLowerCase().includes(query.toLowerCase());
      return matchesGenre && matchesQuery;
    });
  }, [booksList, query, genre, userProfile]);

  return (
    <div className="px-5 pt-7 pb-6 text-ink">
      <h1 className="font-display font-bold text-[22px] mb-4 text-left">
        {isEn ? 'Discover Bilingual Novels' : 'Découvrir les Romans Bilingues'}
      </h1>

      {/* Search Input */}
      <label className="flex items-center gap-2 rounded-2xl bg-white border border-surface-line px-4 py-3 mb-4 shadow-sm focus-within:border-gold">
        <SearchIcon className="w-4 h-4 text-taupe flex-shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isEn ? 'Search by title, author, or genre...' : 'Rechercher par titre, auteur ou genre...'}
          className="bg-transparent outline-none text-[13px] w-full placeholder:text-taupe"
        />
        {query && (
          <button onClick={() => setQuery('')} className="text-[12px] text-taupe hover:text-ink font-bold">
            ×
          </button>
        )}
      </label>

      {/* Genre Filter Chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
        {genres.map((g) => (
          <button
            key={g}
            onClick={() => setGenre(g)}
            className={`flex-shrink-0 text-[12px] font-bold px-4 py-2 rounded-full border transition-all ${
              genre === g
                ? 'bg-gold text-paper border-gold shadow-sm'
                : 'bg-white text-ink border-surface-line hover:border-gold'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Grid of Books with Unified Dynamic Rating Badges */}
      <div className="grid grid-cols-2 gap-4">
        {filtered.map((b) => (
          <BookCard key={b.id} book={b} />
        ))}

        {filtered.length === 0 && (
          <div className="col-span-2 bg-white border border-surface-line rounded-2xl p-8 text-center space-y-2 shadow-sm">
            <BookOpenIcon className="w-8 h-8 text-taupe mx-auto opacity-40" />
            <p className="text-[13px] text-taupe font-semibold">
              {isEn ? 'No novels match your search.' : 'Aucun roman ne correspond à votre recherche.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
