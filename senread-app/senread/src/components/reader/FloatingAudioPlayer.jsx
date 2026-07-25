import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { PlayIcon, PauseIcon } from '../ui/Icons.jsx';
import { covers } from '../../lib/api.js';

export default function FloatingAudioPlayer() {
  const navigate = useNavigate();
  const { activeAudio, isAudioPlaying, audioProgress, toggleAudioPlayPause, stopAudioTrack } = useApp();

  if (!activeAudio) return null;

  const handleCardClick = (e) => {
    // Don't navigate if user clicked play/pause or close buttons
    if (e.target.closest('button')) return;
    navigate(`/book/${activeAudio.bookId}/read/${activeAudio.chapterNumber || 1}`);
  };

  return (
    <div className="px-4 pb-2 pt-1 animate-fadeIn z-40">
      <div
        onClick={handleCardClick}
        className="bg-deep text-paper rounded-2xl p-3 shadow-xl border border-gold/30 flex items-center justify-between gap-3 cursor-pointer hover:border-gold transition-colors relative overflow-hidden"
      >
        {/* Top Progress Line */}
        <div
          className="absolute top-0 left-0 h-[3px] bg-gold transition-all duration-300"
          style={{ width: `${audioProgress}%` }}
        />

        {/* Book Cover Thumbnail & Info */}
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-surface border border-gold/30 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-[12px] text-taupe">
            {covers[activeAudio.cover] ? (
              <img src={covers[activeAudio.cover]} alt="" className="w-full h-full object-cover" />
            ) : (
              activeAudio.bookTitle.charAt(0)
            )}
          </div>

          <div className="overflow-hidden">
            <h4 className="font-display font-semibold text-[13px] text-paper truncate leading-tight">
              {activeAudio.bookTitle}
            </h4>
            <p className="text-[10.5px] text-gold-soft truncate">
              {activeAudio.chapterTitle || 'Chapter Narration'}
            </p>
          </div>
        </div>

        {/* Audio Action Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={toggleAudioPlayPause}
            className="w-9 h-9 rounded-full bg-gold text-deep flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-transform"
            aria-label={isAudioPlaying ? 'Pause audio' : 'Play audio'}
          >
            {isAudioPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={stopAudioTrack}
            className="w-7 h-7 rounded-full text-taupe hover:text-paper hover:bg-paper/10 flex items-center justify-center font-bold text-sm"
            aria-label="Close audio player"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
