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

  const isValidCustomCover = book.customCoverUrl && book.customCoverUrl.startsWith('data:') && !imgError;

  return (
    <Link
      to={`/book/${book.id}`}
      className="flex-shrink-0 w-full focus-visible:outline-offset-4 block group text-left"
    >
      <div className="relative overflow-hidden rounded-2xl shadow-sm border border-surface-line/50">
        <CoverArt gradient={covers[book.cover] || covers.c1} className="w-full aspect-[2/3] h-[175px] relative overflow-hidden flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
          {isValidCustomCover ? (
            <img
              src={book.customCoverUrl}
              alt={book.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <div className="w-full px-2 py-2 text-center text-white space-y-1 flex flex-col items-center justify-center overflow-hidden">
              <BookOpenIcon className="w-6 h-6 mx-auto opacity-40 flex-shrink-0 mb-0.5" />
              <span className="font-display italic font-bold text-[10px] leading-tight block drop-shadow px-1 line-clamp-2 max-w-full break-words">
                {book.title}
              </span>
            </div>
          )}
        </CoverArt>

        {/* Dynamic High-Contrast Gold Glow Rating Badge - Hidden if unrated / 0.0 */}
        {hasReviews && computedRating && computedRating !== '0.0' && (
          <div className="absolute top-2 right-2 bg-black/85 backdrop-blur-md text-white text-[10.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 border border-[#FFD700]/70 shadow-lg group-hover:scale-110 group-hover:border-[#FFD700] group-hover:shadow-[0_0_12px_rgba(255,215,0,0.7)] transition-all duration-300">
            <StarIcon className="w-3.5 h-3.5 text-[#FFD700] fill-[#FFD700] drop-shadow-[0_0_5px_rgba(255,215,0,0.9)]" />
            <span className="text-white font-extrabold tracking-tight drop-shadow">{computedRating}</span>
          </div>
        )}
      </div>

      <p className="mt-1.5 text-[11px] text-ink font-semibold truncate leading-tight group-hover:text-gold transition-colors">
        {book.title}
      </p>
      <p className="text-[10px] text-taupe truncate">par {book.author}</p>
    </Link>
  );
}
