import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { covers } from '../../lib/api.js';
import { CoverArt } from '../ui/primitives.jsx';
import { StarIcon, BookOpenIcon } from '../ui/Icons.jsx';

export default function BookCard({ book }) {
  const { bookReviews } = useApp();
  const [imgError, setImgError] = useState(false);

  // Compute dynamic live rating score strictly from actual reader reviews
  const reviews = bookReviews?.[book.id] || [];
  const hasReviews = reviews.length > 0;
  const computedRating = hasReviews
    ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : null;

  const coverSrc = book.customCoverUrl || book.coverUrl || book.coverImage || (typeof book.cover === 'string' && (book.cover.startsWith('http') || book.cover.startsWith('data:')) ? book.cover : null);
  const hasValidImage = Boolean(coverSrc && !imgError);

  return (
    <Link
      to={`/book/${book.id}`}
      className="flex-shrink-0 w-full focus-visible:outline-offset-4 block group text-left"
    >
      {/* 100% FULL-BLEED 3D BOOK COVER (No background container frame!) */}
      <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-black/10 transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1.5 bg-neutral-900">
        {hasValidImage ? (
          <img
            src={coverSrc}
            alt={book.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          /* LUXURY TYPOGRAPHIC FULL-BLEED COVER FALLBACK */
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
              <h3 className="font-display font-extrabold text-[15px] sm:text-[16px] text-paper leading-tight drop-shadow-md">
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
        {hasReviews && computedRating && computedRating !== '0.0' && (
          <div className="absolute top-2.5 right-2.5 bg-black/85 backdrop-blur-md text-white text-[10.5px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 border border-[#FFD700]/70 shadow-lg group-hover:scale-105 transition-all">
            <StarIcon className="w-3.5 h-3.5 text-[#FFD700] fill-[#FFD700]" />
            <span className="text-white font-extrabold">{computedRating}</span>
          </div>
        )}

        {/* Chapter Count Pill */}
        <div className="absolute bottom-2.5 left-2.5 bg-black/65 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-white/20">
          {book.chapterCount || book.chaptersData?.length || 1} Chapitre{(book.chapterCount || book.chaptersData?.length || 1) > 1 ? 's' : ''}
        </div>
      </div>

      <h4 className="mt-2 text-[13px] font-bold text-ink truncate leading-tight group-hover:text-gold transition-colors">
        {book.title}
      </h4>
      <p className="text-[11px] text-taupe truncate font-medium">par {book.author}</p>
    </Link>
  );
}
