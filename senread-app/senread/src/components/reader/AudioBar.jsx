import { useApp } from '../../context/AppContext.jsx';
import { calculateRealisticAudioTime } from '../../lib/api.js';
import { PlayIcon, PauseIcon } from '../ui/Icons.jsx';

export default function AudioBar({ bookId, bookTitle, chapterTitle, duration, sentences = [], chapterNumber = 1, cover = 'c1' }) {
  const {
    activeAudio,
    isAudioPlaying,
    startAudioTrack,
    toggleAudioPlayPause,
  } = useApp();

  const realDuration = duration || calculateRealisticAudioTime(sentences);
  const isCurrentTrack = activeAudio && activeAudio.bookId === bookId && (activeAudio.chapterNumber === chapterNumber || !activeAudio.chapterNumber);

  const handleTogglePlay = (e) => {
    e.stopPropagation();
    if (!isCurrentTrack) {
      startAudioTrack({
        bookId,
        bookTitle: bookTitle || 'Koko Story',
        chapterTitle: chapterTitle || 'Chapter 1',
        duration: realDuration,
        sentences,
        chapterNumber,
        cover,
      });
    } else {
      toggleAudioPlayPause();
    }
  };

  const playing = isCurrentTrack && isAudioPlaying;

  return (
    <div className="fixed bottom-20 right-5 sm:bottom-24 sm:right-6 z-50 animate-fadeIn" onClick={(e) => e.stopPropagation()}>
      {/* Ultra-Clean Instant Play/Pause Floating Icon Button */}
      <button
        type="button"
        onClick={handleTogglePlay}
        title={playing ? 'Mettre la lecture audio en pause' : 'Démarrer la lecture audio (Mode Vocal)'}
        aria-label={playing ? 'Pause audio' : 'Play audio'}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border transition-all active:scale-90 ${
          playing
            ? 'bg-gold text-deep-2 border-gold ring-4 ring-gold/30 animate-pulse scale-105'
            : 'bg-gold text-deep-2 border-gold/40 hover:scale-105 opacity-90 hover:opacity-100'
        }`}
      >
        {playing ? <PauseIcon className="w-5 h-5 fill-deep-2" /> : <PlayIcon className="w-5 h-5 fill-deep-2 ml-0.5" />}
      </button>
    </div>
  );
}
