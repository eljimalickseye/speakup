import { Link } from 'react-router-dom';
import { covers } from '../../lib/api.js';
import { CoverArt, ProgressBar } from '../ui/primitives.jsx';
import { PlayIcon } from '../ui/Icons.jsx';

export default function ContinueReadingCard({ entry }) {
  if (!entry) return null;
  const { book, chapter, progress } = entry;

  return (
    <Link
      to={`/book/${book.id}/read/${chapter}`}
      className="flex gap-3 items-center p-3.5 rounded-2xl border border-surface-line bg-white block"
    >
      <CoverArt gradient={covers[book.cover]} className="w-[52px] h-[74px] flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-display font-semibold text-sm truncate">{book.title}</p>
        <p className="text-[11px] text-taupe mb-2">
          Chapter {chapter} of {book.chapterCount}
        </p>
        <ProgressBar value={progress} />
        <div className="flex items-center gap-1.5 mt-2 text-[11px] font-bold text-deep">
          <PlayIcon className="w-3.5 h-3.5" />
          Resume
        </div>
      </div>
    </Link>
  );
}
