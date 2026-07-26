import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext.jsx';
import { MessageSquareIcon, CheckIcon } from '../ui/Icons.jsx';

// ── Utility ──────────────────────────────────────────────────────────────────
function timeAgo(isoString) {
  if (!isoString) return 'À l\'instant';
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
  return new Date(isoString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'KK';
}

const AVATAR_COLORS = ['#C8A951', '#4CAF8A', '#9E8AE6', '#E67E4C', '#4C9EE6', '#E64C8A'];
function avatarColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

const MAX_PREVIEW = 220; // chars before "…more"

// ── Single Comment Row ────────────────────────────────────────────────────────
function CommentRow({ comment, onLike, onDislike, onReply, depth = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const long = comment.text.length > MAX_PREVIEW;
  const displayed = expanded || !long ? comment.text : comment.text.slice(0, MAX_PREVIEW) + '…';
  const color = avatarColor(comment.author);
  const replies = comment.replies || [];

  return (
    <div className={depth > 0 ? 'ml-9 mt-2' : ''}>
      <div className="flex gap-2.5">
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-extrabold text-white mt-0.5 select-none"
          style={{ backgroundColor: color }}
        >
          {initials(comment.author)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="text-[13px] font-bold text-ink leading-none">{comment.author}</span>
            <span className="text-[11px] text-taupe">{timeAgo(comment.createdAt)}</span>
          </div>

          {/* Text with expand */}
          <p className="text-[13.5px] text-ink leading-[1.6] break-words">
            {displayed}
            {long && !expanded && (
              <button
                onClick={() => setExpanded(true)}
                className="text-taupe text-[12px] font-semibold ml-1 hover:text-gold transition-colors"
              >
                … more
              </button>
            )}
          </p>

          {/* Action bar */}
          <div className="flex items-center gap-4 mt-2">
            {/* Reply */}
            <button
              onClick={() => onReply?.(comment)}
              className="text-[12px] font-bold text-taupe hover:text-ink transition-colors px-3 py-1 rounded-lg border border-surface-line/60 bg-surface/40"
            >
              {replies.length > 0 ? `Replies ${replies.length}` : 'Reply'}
            </button>

            {/* Thumbs Up */}
            <button
              onClick={() => onLike?.(comment.id)}
              className="flex items-center gap-1.5 text-[12.5px] font-bold transition-all active:scale-90"
              style={{ color: comment.userLiked ? '#4CAF8A' : undefined }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={comment.userLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={comment.userLiked ? 'text-emerald-500' : 'text-taupe'}>
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
              </svg>
              <span className={comment.userLiked ? 'text-emerald-500' : 'text-taupe'}>{comment.likes || 0}</span>
            </button>

            {/* Thumbs Down */}
            <button
              onClick={() => onDislike?.(comment.id)}
              className="flex items-center gap-1.5 text-[12.5px] font-bold transition-all active:scale-90"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={comment.userDisliked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={comment.userDisliked ? 'text-red-400' : 'text-taupe'}>
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/>
                <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
              </svg>
              <span className={comment.userDisliked ? 'text-red-400' : 'text-taupe'}>{comment.dislikes || 0}</span>
            </button>
          </div>

          {/* Replies toggle */}
          {replies.length > 0 && (
            <button
              onClick={() => setShowReplies(v => !v)}
              className="mt-2 text-[12px] font-bold text-gold flex items-center gap-1"
            >
              <span>{showReplies ? '▲' : '▼'}</span>
              {showReplies ? 'Masquer' : `Voir ${replies.length} réponse${replies.length > 1 ? 's' : ''}`}
            </button>
          )}

          {/* Replies list */}
          {showReplies && replies.map(r => (
            <CommentRow key={r.id} comment={r} onLike={onLike} onDislike={onDislike} depth={1} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ChapterComments({ bookId, chapterId, onClose, isLight = false, iconOnly = false }) {
  const { userProfile } = useApp();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = onClose ? true : internalOpen;

  const handleClose = (e) => {
    if (e) e.stopPropagation();
    if (onClose) onClose();
    else setInternalOpen(false);
  };

  const storageKey = `koko_comments_${bookId || 'b1'}_${chapterId || 'c1'}`;

  const defaultComments = [
    {
      id: 1,
      author: 'Awa Ndiaye',
      text: 'Ce chapitre était magnifique ! La traduction bilingue rend la lecture très fluide. J\'ai adoré la façon dont l\'auteure décrit le port de Dakar — on se sent vraiment transporté là-bas.',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      likes: 42,
      dislikes: 0,
      userLiked: false,
      userDisliked: false,
      replies: [
        { id: 11, author: 'Moussa Fall', text: 'Totalement d\'accord ! La scène du phare m\'a donné des frissons.', createdAt: new Date(Date.now() - 3600000).toISOString(), likes: 8, dislikes: 0, userLiked: false, userDisliked: false },
      ],
    },
    {
      id: 2,
      author: 'Moussa Diop',
      text: 'J\'ai adoré la métaphore de la brise sur Gorée. Ça donne vraiment envie d\'apprendre l\'anglais pour mieux apprécier les nuances du texte original.',
      createdAt: new Date(Date.now() - 14400000).toISOString(),
      likes: 17,
      dislikes: 1,
      userLiked: false,
      userDisliked: false,
      replies: [],
    },
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
  const [replyingTo, setReplyingTo] = useState(null); // comment object

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(comments)); }
    catch (e) { console.warn('Failed to save comments', e); }
  }, [comments, storageKey]);

  const handleAddComment = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const trimmed = newCommentText.trim();
    if (!trimmed) return;

    if (replyingTo) {
      // Add as a reply to replyingTo
      setComments(prev => prev.map(c => {
        if (c.id === replyingTo.id) {
          return { ...c, replies: [...(c.replies || []), {
            id: Date.now(),
            author: userProfile?.name || 'Lecteur Koko',
            text: trimmed,
            createdAt: new Date().toISOString(),
            likes: 0, dislikes: 0, userLiked: false, userDisliked: false,
          }]};
        }
        return c;
      }));
      setReplyingTo(null);
    } else {
      setComments(prev => [{
        id: Date.now(),
        author: userProfile?.name || 'Lecteur Koko',
        text: trimmed,
        createdAt: new Date().toISOString(),
        likes: 0, dislikes: 0, userLiked: false, userDisliked: false,
        replies: [],
      }, ...prev]);
    }

    setNewCommentText('');
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 2500);
  };

  const handleLike = (commentId) => {
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      if (c.userLiked) return { ...c, likes: c.likes - 1, userLiked: false };
      return { ...c, likes: (c.likes || 0) + 1, userLiked: true, userDisliked: false, dislikes: c.userDisliked ? (c.dislikes || 1) - 1 : c.dislikes };
    }));
  };

  const handleDislike = (commentId) => {
    setComments(prev => prev.map(c => {
      if (c.id !== commentId) return c;
      if (c.userDisliked) return { ...c, dislikes: c.dislikes - 1, userDisliked: false };
      return { ...c, dislikes: (c.dislikes || 0) + 1, userDisliked: true, userLiked: false, likes: c.userLiked ? (c.likes || 1) - 1 : c.likes };
    }));
  };

  const totalLikes = comments.reduce((s, c) => s + (c.likes || 0), 0);

  return (
    <>
      {/* Trigger Button */}
      {!onClose && (
        iconOnly ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setInternalOpen(true); }}
            title={`Commentaires (${comments.length})`}
            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-95 ${isLight ? 'bg-surface border-surface-line text-ink hover:border-gold' : 'bg-white/10 border-white/15 text-gold hover:bg-white/20'}`}
          >
            <MessageSquareIcon className="w-4.5 h-4.5 text-gold" />
          </button>
        ) : (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setInternalOpen(true); }}
            className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${isLight ? 'bg-white border-surface-line text-ink hover:border-gold' : 'bg-white/5 border-white/10 text-paper hover:border-gold-soft'}`}
          >
            <div className="flex items-center gap-2">
              <MessageSquareIcon className="w-4 h-4 text-gold" />
              <span className="text-[12px] font-bold">Commentaires ({comments.length})</span>
            </div>
            <span className="text-[11px] font-bold text-gold bg-gold/10 px-2.5 py-0.5 rounded-full">Ouvrir →</span>
          </button>
        )
      )}

      {/* Portal Modal */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-end justify-center animate-fadeIn pointer-events-auto"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-lg rounded-t-3xl flex flex-col pointer-events-auto"
            style={{
              backgroundColor: '#111113',
              maxHeight: '88dvh',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-1 pb-3 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <MessageSquareIcon className="w-4 h-4 text-gold" />
                <span className="text-[15px] font-bold text-white">
                  {comments.length} Commentaire{comments.length !== 1 ? 's' : ''}
                </span>
                {totalLikes > 0 && (
                  <span className="text-[12px] text-white/40 font-medium">· {totalLikes} likes</span>
                )}
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white font-bold text-[16px] transition-colors"
              >
                ×
              </button>
            </div>

            {/* Success Toast */}
            {successToast && (
              <div className="mx-4 mt-2 bg-emerald-600/90 text-white px-3 py-2 rounded-xl text-[12.5px] font-bold flex items-center gap-2 animate-fadeIn flex-shrink-0">
                <CheckIcon className="w-4 h-4 text-white" />
                Commentaire publié !
              </div>
            )}

            {/* Comment Input */}
            <div className="px-4 pt-3 pb-2 flex-shrink-0 border-b border-white/8">
              {replyingTo && (
                <div className="flex items-center justify-between mb-2 px-2 py-1 rounded-lg bg-white/5 text-[11.5px] text-white/50">
                  <span>Répondre à <strong className="text-gold">{replyingTo.author}</strong></span>
                  <button onClick={() => setReplyingTo(null)} className="text-white/40 hover:text-white">×</button>
                </div>
              )}
              <form onSubmit={handleAddComment} className="flex gap-2 items-center">
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-extrabold text-white"
                  style={{ backgroundColor: avatarColor(userProfile?.name || 'K') }}
                >
                  {initials(userProfile?.name || 'Lecteur Koko')}
                </div>
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddComment(); }}}
                  placeholder={replyingTo ? `Répondre à ${replyingTo.author}…` : 'Ajouter un commentaire…'}
                  className="flex-1 bg-white/8 border border-white/12 rounded-full px-4 py-2.5 text-[13px] text-white placeholder-white/30 outline-none focus:border-gold/60 transition-colors"
                />
                {newCommentText.trim() && (
                  <button
                    type="button"
                    onClick={handleAddComment}
                    className="px-4 py-2.5 rounded-full bg-gold text-deep-2 text-[12.5px] font-bold transition-all active:scale-95 flex-shrink-0"
                  >
                    Post
                  </button>
                )}
              </form>
            </div>

            {/* Comments List */}
            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-5">
              {comments.length === 0 ? (
                <p className="text-[13px] text-white/30 text-center py-10">
                  Soyez le premier à commenter ce chapitre !
                </p>
              ) : (
                comments.map(c => (
                  <CommentRow
                    key={c.id}
                    comment={c}
                    onLike={handleLike}
                    onDislike={handleDislike}
                    onReply={setReplyingTo}
                  />
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
