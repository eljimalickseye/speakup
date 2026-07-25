import { useState } from 'react';
import { Link } from 'react-router-dom';
import { covers } from '../../lib/api.js';
import { CoverArt } from '../ui/primitives.jsx';
import { StarIcon, BookOpenIcon } from '../ui/Icons.jsx';

export default function BookCard({ book }) {
  const [imgError, setImgError] = useState(false);

  const isValidCustomCover = book.customCoverUrl && book.customCoverUrl.startsWith('data:') && !imgError;

  return (
    <Link
      to={`/book/${book.id}`}
      className="flex-shrink-0 w-full focus-visible:outline-offset-4 block group text-left"
    >
      <div className="relative">
        <CoverArt gradient={covers[book.cover] || covers.c1} className="w-full h-[135px] relative overflow-hidden flex items-center justify-center">
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

        {/* Rating Score Badge */}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-white/20 shadow-sm">
          <StarIcon className="w-2.5 h-2.5 text-gold fill-gold" />
          <span>{book.rating || 5.0}</span>
        </div>
      </div>

      <p className="mt-1.5 text-[11px] text-ink font-semibold truncate leading-tight group-hover:text-gold transition-colors">
        {book.title}
      </p>
      <p className="text-[10px] text-taupe truncate">par {book.author}</p>
    </Link>
  );
}
