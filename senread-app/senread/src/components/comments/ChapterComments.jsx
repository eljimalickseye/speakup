import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { MessageSquareIcon, CheckIcon } from '../ui/Icons.jsx';

export default function ChapterComments({ chapterId, isLight = false, iconOnly = false }) {
  const { userProfile } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const storageKey = `koko_comments_${chapterId || 'default'}`;

  const defaultComments = [
    { id: 1, author: 'Awa Ndiaye', text: 'Ce chapitre était magnifique ! La traduction bilingue rend la lecture très fluide.', time: 'Il y a 2h' },
    { id: 2, author: 'Moussa Diop', text: 'J\'ai adoré la métaphore de la brise sur Gorée.', time: 'Il y a 4h' },
  ];

  const [comments, setComments] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : defaultComments;
    } catch {
      return defaultComments;
    }
  });

  const [newCommentText, setNewCommentText] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(comments));
    } catch (e) {
      console.warn('Failed to save comments', e);
    }
  }, [comments, storageKey]);

  const handleAddComment = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const trimmed = newCommentText.trim();
    if (!trimmed) return;

    const newCommentObj = {
      id: Date.now(),
      author: userProfile?.name || 'Lecteur Koko',
      text: trimmed,
      time: 'À l’instant',
    };

    setComments((prev) => [newCommentObj, ...prev]);
    setNewCommentText('');
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 2500);
  };

  return (
    <>
      {/* Sleek Trigger Button */}
      {iconOnly ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          title={`Commentaires (${comments.length})`}
          className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-95 ${
            isLight
              ? 'bg-black/8 border-black/10 text-[#1A1816] hover:border-gold'
              : 'bg-white/10 border-white/15 text-gold hover:bg-white/20'
          }`}
        >
          <MessageSquareIcon className="w-4.5 h-4.5 text-gold" />
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
            isLight
              ? 'bg-white/80 border-black/10 text-[#1A1816] hover:border-gold'
              : 'bg-white/5 border-white/10 text-paper hover:border-gold-soft'
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageSquareIcon className="w-4 h-4 text-gold" />
            <span className="text-[12px] font-bold">Commentaires ({comments.length})</span>
          </div>
          <span className="text-[11px] font-bold text-gold bg-gold/10 px-2.5 py-0.5 rounded-full">
            Ouvrir →
          </span>
        </button>
      )}

      {/* Slide-Up Drawer Modal for Comments */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          <div
            className="bg-paper border-t sm:border border-surface-line rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-md text-left relative shadow-2xl space-y-3.5 max-h-[85vh] flex flex-col pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-surface-line pb-2.5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <MessageSquareIcon className="w-4.5 h-4.5 text-gold" />
                <h3 className="font-display font-bold text-[16px] text-ink">
                  Espace Discussion ({comments.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-surface border border-surface-line flex items-center justify-center text-taupe hover:text-ink font-bold text-[14px]"
              >
                ×
              </button>
            </div>

            {/* Notification Toast */}
            {successToast && (
              <div className="bg-emerald-600 text-white p-2.5 rounded-xl text-[12px] font-bold flex items-center gap-2 animate-fadeIn flex-shrink-0">
                <CheckIcon className="w-4 h-4 text-white" />
                <span>Commentaire publié avec succès !</span>
              </div>
            )}

            {/* Comment Saisie Form */}
            <form
              onSubmit={handleAddComment}
              className="flex gap-2 flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder="Écrivez votre commentaire..."
                className="flex-1 px-3.5 py-3 rounded-xl text-[13px] bg-white border border-surface-line text-ink outline-none focus:border-gold shadow-inner"
              />
              <button
                type="button"
                onClick={handleAddComment}
                disabled={!newCommentText.trim()}
                className={`px-4 py-3 rounded-xl text-[12.5px] font-bold shadow-sm transition-all flex items-center justify-center ${
                  newCommentText.trim()
                    ? 'bg-gold text-deep-2 hover:opacity-90 active:scale-95'
                    : 'bg-surface text-taupe opacity-50 cursor-not-allowed'
                }`}
              >
                Publier
              </button>
            </form>

            {/* Scrollable Comments List */}
            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1 pt-1">
              {comments.length === 0 ? (
                <p className="text-[12px] text-taupe text-center py-6">Soyez le premier à commenter ce chapitre !</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-2xl bg-white border border-surface-line text-left text-[12.5px] space-y-1 shadow-sm">
                    <div className="flex justify-between items-center border-b border-surface-line/50 pb-1 mb-1">
                      <span className="font-bold text-gold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-gold inline-block" />
                        {c.author}
                      </span>
                      <span className="text-[10px] text-taupe font-mono">{c.time}</span>
                    </div>
                    <p className="text-ink leading-relaxed font-medium">{c.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
