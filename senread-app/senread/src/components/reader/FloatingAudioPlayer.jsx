import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { PlayIcon, PauseIcon, SparklesIcon } from '../ui/Icons.jsx';
import { covers } from '../../lib/api.js';

export default function FloatingAudioPlayer() {
  const navigate = useNavigate();
  const {
    activeAudio,
    isAudioPlaying,
    audioProgress,
    toggleAudioPlayPause,
    stopAudioTrack,
    playbackSpeed,
    cyclePlaybackSpeed,
    seekAudio,
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(false);

  if (!activeAudio) return null;

  const isTeacherVoice = Boolean(activeAudio.audioUrl);

  const handleCardClick = (e) => {
    // Don't navigate if user clicked play/pause, seek or action buttons
    if (e.target.closest('button') || e.target.closest('input')) return;
    navigate(`/book/${activeAudio.bookId}/read/${activeAudio.chapterNumber || 1}`);
  };

  const handleScrubberChange = (e) => {
    const newPercent = parseFloat(e.target.value);
    if (seekAudio) {
      seekAudio(newPercent);
    }
  };

  return (
    <div className="px-3.5 pb-2 pt-1 animate-fadeIn z-40 max-w-md md:max-w-xl mx-auto">
      <div
        onClick={handleCardClick}
        className="bg-[#122A28] text-white rounded-3xl p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.4)] border border-gold/40 relative overflow-hidden transition-all duration-300"
      >
        {/* Top Interactive Progress Bar Scrubber */}
        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-2.5 relative group cursor-pointer">
          <div
            className="h-full bg-gradient-to-r from-gold via-gold-light to-amber-300 rounded-full transition-all duration-200"
            style={{ width: `${audioProgress}%` }}
          />
          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            value={audioProgress || 0}
            onChange={handleScrubberChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            title="Avancer / Reculer"
          />
        </div>

        {/* Audio Content Header & Badge */}
        <div className="flex items-center justify-between gap-3">
          {/* Thumbnail & Title */}
          <div className="flex items-center gap-3 overflow-hidden flex-1 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-surface border border-gold/30 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-[12px] text-taupe shadow-sm relative">
              {covers[activeAudio.cover] ? (
                <img src={covers[activeAudio.cover]} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gold font-display italic">{activeAudio.bookTitle?.charAt(0)}</span>
              )}
            </div>

            <div className="overflow-hidden text-left">
              <div className="flex items-center gap-1.5">
                <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                  isTeacherVoice
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-gold/20 text-gold border-gold/40'
                }`}>
                  {isTeacherVoice ? '🎙️ Voix Enseignante' : '🔊 Synthèse Vocal Koko'}
                </span>
              </div>

              <h4 className="font-display font-bold text-[13px] text-white truncate leading-tight mt-0.5">
                {activeAudio.bookTitle}
              </h4>
              <p className="text-[10.5px] text-white/70 truncate">
                {activeAudio.chapterTitle || `Chapitre ${activeAudio.chapterNumber}`}
              </p>
            </div>
          </div>

          {/* Action Buttons: Playback Speed, Play/Pause, Close */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Speed Cycle Button */}
            <button
              type="button"
              onClick={cyclePlaybackSpeed}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-gold font-extrabold text-[10.5px] border border-white/15 transition-all"
              title="Vitesse de lecture"
            >
              {playbackSpeed}x
            </button>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={toggleAudioPlayPause}
              className="w-10 h-10 rounded-full bg-gold text-deep flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
              aria-label={isAudioPlaying ? 'Pause audio' : 'Play audio'}
            >
              {isAudioPlaying ? <PauseIcon className="w-4.5 h-4.5 text-deep" /> : <PlayIcon className="w-4.5 h-4.5 text-deep ml-0.5" />}
            </button>

            {/* Stop / Close Button */}
            <button
              type="button"
              onClick={stopAudioTrack}
              className="w-7 h-7 rounded-full text-white/50 hover:text-white hover:bg-white/10 flex items-center justify-center font-bold text-sm transition-colors"
              aria-label="Fermer le lecteur"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
