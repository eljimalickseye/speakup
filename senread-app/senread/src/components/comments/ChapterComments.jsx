import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext.jsx';
import { MessageSquareIcon, CheckIcon, BackIcon } from '../ui/Icons.jsx';
import {
  subscribeToChapterComments,
  fetchChapterComments,
  saveChapterComments,
  defaultChapterComments,
  countTotalComments,
} from '../../lib/commentsApi.js';

// ── Utility Functions ──────────────────────────────────────────────────────────
function timeAgo(isoString) {
  if (!isoString) return 'À l\'instant';
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)} j`;
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

const EMOJIS = ['❤️', '🔥', '👏', '😂', '😍', '😭', '👍', '🎉', '💯', '✨'];
const MAX_PREVIEW = 220; // chars before "…voir plus"

// ── Single Comment Row Component with Edit & Delete Support (OWN COMMENTS ONLY) ───
function CommentRow({
  comment,
  onLike,
  onDislike,
  onReply,
  onReport,
  onDelete,
  onEdit,
  isLight,
  currentUserName = 'Lecteur Koko',
  parentId = null,
  depth = 0,
}) {
  const [expanded, setExpanded] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);

  const isOwnComment = comment.isOwn || (comment.author && comment.author === currentUserName);

  const long = comment.text.length > MAX_PREVIEW;
  const displayed = expanded || !long ? comment.text : comment.text.slice(0, MAX_PREVIEW) + '…';
  const color = avatarColor(comment.author);
  const replies = comment.replies || [];

  // Theme Colors
  const textColor = isLight ? '#1A1816' : '#FFFFFF';
  const subtextColor = isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)';
  const borderBtnColor = isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)';
  const bgBtnColor = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)';

  const handleSaveInlineEdit = (e) => {
    e.preventDefault();
    if (!editText.trim()) return;
    onEdit?.(comment.id, parentId, editText.trim());
    setIsEditing(false);
  };

  return (
    <div
      id={`comment-row-${comment.id}`}
      className={depth > 0 ? 'ml-6 sm:ml-8 mt-3 pt-2 border-l-2 pl-3' : ''}
      style={{ borderColor: depth > 0 ? (isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)') : 'transparent' }}
    >
      <div className="flex gap-2.5">
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-extrabold text-white mt-0.5 select-none shadow-sm"
          style={{ backgroundColor: color }}
        >
          {initials(comment.author)}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[13px] font-extrabold leading-none truncate flex items-center gap-1.5" style={{ color: textColor }}>
                <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block flex-shrink-0" />
                {comment.author || 'Lecteur Koko'}
              </span>
              <span className="text-[11px] font-medium flex-shrink-0" style={{ color: subtextColor }}>
                · {timeAgo(comment.createdAt)} {comment.edited ? '(modifié)' : ''}
              </span>
            </div>

            {/* Action Buttons: Edit & Delete (OWN COMMENTS ONLY) or Report */}
            <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
              {isOwnComment && (
                <>
                  <button
                    type="button"
                    onClick={() => { setIsEditing((v) => !v); setEditText(comment.text); }}
                    className="p-1 hover:text-gold transition-colors text-[11px]"
                    title="Modifier mon commentaire"
                    style={{ color: subtextColor }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete?.(comment.id, parentId)}
                    className="p-1 hover:text-red-500 transition-colors text-[11px]"
                    title="Supprimer mon commentaire"
                    style={{ color: subtextColor }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </>
              )}

              {!isOwnComment && (
                <button
                  type="button"
                  onClick={() => onReport?.(comment)}
                  className="p-1 hover:text-amber-500 transition-colors text-[11px]"
                  title="Signaler ce commentaire"
                  style={{ color: subtextColor }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                    <line x1="4" y1="22" x2="4" y2="15"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Inline Edit Form vs Comment Text */}
          {isEditing ? (
            <form onSubmit={handleSaveInlineEdit} className="mt-1 space-y-2">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full px-3 py-1.5 text-[13px] rounded-lg outline-none"
                style={{
                  backgroundColor: bgBtnColor,
                  border: `1px solid ${borderBtnColor}`,
                  color: textColor,
                }}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-3 py-1 text-[11.5px] font-bold rounded-md bg-gold text-deep-2 shadow-sm"
                >
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-[11.5px] font-bold rounded-md opacity-70"
                  style={{ color: textColor }}
                >
                  Annuler
                </button>
              </div>
            </form>
          ) : (
            <p className="text-[13.5px] leading-[1.6] break-words font-medium" style={{ color: textColor }}>
              {displayed}
              {long && !expanded && (
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="text-[12px] font-bold ml-1.5 hover:underline"
                  style={{ color: '#C8A951' }}
                >
                  … voir plus
                </button>
              )}
            </p>
          )}

          {/* Actions: Reply, Like, Dislike */}
          <div className="flex items-center gap-3.5 mt-2">
            {/* Reply Button */}
            <button
              type="button"
              onClick={() => onReply?.(comment, parentId || comment.id)}
              className="text-[11.5px] font-bold px-2.5 py-1 rounded-lg transition-all active:scale-95 flex items-center gap-1.5"
              style={{
                backgroundColor: bgBtnColor,
                border: `1px solid ${borderBtnColor}`,
                color: textColor,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 14 4 9 9 4"/>
                <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
              </svg>
              <span>Répondre</span>
              {replies.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gold/20 text-gold font-bold ml-0.5">
                  {replies.length}
                </span>
              )}
            </button>

            {/* Thumbs Up Like */}
            <button
              type="button"
              onClick={() => onLike?.(comment.id, parentId)}
              className="flex items-center gap-1.5 text-[12.5px] font-bold transition-all active:scale-90"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={comment.userLiked ? '#4CAF8A' : 'none'}
                stroke={comment.userLiked ? '#4CAF8A' : subtextColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
                <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
              </svg>
              <span style={{ color: comment.userLiked ? '#4CAF8A' : subtextColor }}>
                {comment.likes || 0}
              </span>
            </button>

            {/* Thumbs Down Dislike */}
            <button
              type="button"
              onClick={() => onDislike?.(comment.id, parentId)}
              className="flex items-center gap-1.5 text-[12.5px] font-bold transition-all active:scale-90"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={comment.userDisliked ? '#EF4444' : 'none'}
                stroke={comment.userDisliked ? '#EF4444' : subtextColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
                <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
              </svg>
              <span style={{ color: comment.userDisliked ? '#EF4444' : subtextColor }}>
                {comment.dislikes || 0}
              </span>
            </button>
          </div>

          {/* Toggle nested replies */}
          {replies.length > 0 && depth === 0 && (
            <button
              type="button"
              onClick={() => setShowReplies((v) => !v)}
              className="mt-2.5 text-[12px] font-bold text-gold flex items-center gap-1.5 hover:underline"
            >
              <span>{showReplies ? '▲' : '▼'}</span>
              <span>{showReplies ? 'Masquer les réponses' : `Afficher ${replies.length} réponse${replies.length > 1 ? 's' : ''}`}</span>
            </button>
          )}

          {/* Nested Replies List */}
          {showReplies && replies.length > 0 && (
            <div className="space-y-2.5">
              {replies.map((r) => (
                <CommentRow
                  key={r.id}
                  comment={r}
                  onLike={onLike}
                  onDislike={onDislike}
                  onReply={onReply}
                  onReport={onReport}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  isLight={isLight}
                  currentUserName={currentUserName}
                  parentId={comment.id}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main ChapterComments Drawer Component ─────────────────────────────────────
export default function ChapterComments({ bookId, chapterId, onClose, isLight = false, iconOnly = false }) {
  const { userProfile, bookReactions } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('recents'); // 'recents' or 'top'
  const [replyingTo, setReplyingTo] = useState(null); // { id, parentId, author }
  const [newCommentText, setNewCommentText] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [viewportHeight, setViewportHeight] = useState(null);

  const inputRef = useRef(null);
  const modalRef = useRef(null);

  const currentBookId = bookId || 'b1';
  const currentChapterId = chapterId || '1';

  // Comments State
  const [comments, setComments] = useState([]);

  // W3C VisualViewport Listener — Keeps modal perfectly positioned above native keyboards
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };

    handleResize();
    window.visualViewport?.addEventListener('resize', handleResize);
    window.visualViewport?.addEventListener('scroll', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, [isOpen]);

  // Real-time Firebase WebSocket subscription — instant sync across all devices!
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = subscribeToChapterComments(
      currentBookId,
      currentChapterId,
      (cloudComments) => {
        if (!isMounted) return;
        setComments((localComments) => {
          if (!localComments || localComments.length === 0) return cloudComments;

          const localMap = new Map(localComments.map((c) => [String(c.id), c]));
          const cloudMap = new Map(cloudComments.map((c) => [String(c.id), c]));

          // Merge: cloud is source of truth, preserve local interaction state
          const merged = cloudComments.map((cloudItem) => {
            const localItem = localMap.get(String(cloudItem.id));
            if (!localItem) return cloudItem;
            return {
              ...cloudItem,
              userLiked: localItem.userLiked,
              userDisliked: localItem.userDisliked,
              text: localItem.edited ? localItem.text : cloudItem.text,
              edited: localItem.edited || cloudItem.edited,
              isOwn: localItem.isOwn || cloudItem.isOwn,
              replies: (cloudItem.replies || []).map((cr) => {
                const lr = (localItem.replies || []).find((r) => String(r.id) === String(cr.id));
                if (!lr) return cr;
                return {
                  ...cr,
                  userLiked: lr.userLiked,
                  userDisliked: lr.userDisliked,
                  text: lr.edited ? lr.text : cr.text,
                  edited: lr.edited || cr.edited,
                  isOwn: lr.isOwn || cr.isOwn,
                };
              }),
            };
          });

          // Preserve local-only optimistic comments not yet confirmed by Firebase
          localComments.forEach((lc) => {
            if (!cloudMap.has(String(lc.id))) merged.unshift(lc);
          });

          return merged;
        });
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [currentBookId, currentChapterId]);

  // Insert Emoji at Cursor Position
  const handleInsertEmoji = (emoji) => {
    setNewCommentText((prev) => prev + emoji);
    if (inputRef.current) inputRef.current.focus({ preventScroll: true });
  };

  // Handle Reply Click — Scrolls target comment into view & focuses input without browser page jump
  const handleInitiateReply = (targetComment, parentId) => {
    setReplyingTo({
      id: targetComment.id,
      parentId: parentId || targetComment.id,
      author: targetComment.author,
    });

    setTimeout(() => {
      const targetEl = document.getElementById(`comment-row-${targetComment.id}`);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
      }
    }, 80);
  };

  // Report / Signaler Comment Handler
  const handleReportComment = (comment) => {
    setSuccessToast(`Le commentaire de "${comment.author}" a été signalé aux modérateurs.`);
    setTimeout(() => setSuccessToast(''), 3000);
  };

  // Delete Comment Handler
  const handleDeleteComment = (commentId, parentId) => {
    let updated = [];
    if (parentId) {
      updated = comments.map((c) => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: (c.replies || []).filter((r) => r.id !== commentId),
          };
        }
        return c;
      });
    } else {
      updated = comments.filter((c) => c.id !== commentId);
    }
    setComments(updated);
    saveChapterComments(currentBookId, currentChapterId, updated);
    setSuccessToast('Commentaire supprimé');
    setTimeout(() => setSuccessToast(''), 2500);
  };

  // Edit Comment Handler
  const handleEditComment = (commentId, parentId, newText) => {
    if (!newText.trim()) return;
    let updated = [];
    if (parentId) {
      updated = comments.map((c) => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: (c.replies || []).map((r) =>
              r.id === commentId ? { ...r, text: newText.trim(), edited: true } : r
            ),
          };
        }
        return c;
      });
    } else {
      updated = comments.map((c) =>
        c.id === commentId ? { ...c, text: newText.trim(), edited: true } : c
      );
    }
    setComments(updated);
    saveChapterComments(currentBookId, currentChapterId, updated);
    setSuccessToast('Commentaire modifié');
    setTimeout(() => setSuccessToast(''), 2500);
  };

  // Add Comment or Reply
  const handleAddComment = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const trimmed = newCommentText.trim();
    if (!trimmed) return;

    const newObj = {
      id: Date.now(),
      author: userProfile?.name || 'Lecteur Koko',
      text: trimmed,
      createdAt: new Date().toISOString(),
      likes: 0,
      dislikes: 0,
      userLiked: false,
      userDisliked: false,
      isOwn: true,
      replies: [],
    };

    let nextComments = [];
    if (replyingTo) {
      // Append reply to target parent comment
      nextComments = comments.map((c) => {
        if (c.id === replyingTo.parentId) {
          return {
            ...c,
            replies: [...(c.replies || []), newObj],
          };
        }
        return c;
      });
      setReplyingTo(null);
    } else {
      // Add top-level comment
      nextComments = [newObj, ...comments];
    }

    // Synchronously update local state and push to Cloud DB
    setComments(nextComments);
    saveChapterComments(currentBookId, currentChapterId, nextComments);

    setNewCommentText('');
    setSuccessToast('Commentaire publié avec succès !');
    setTimeout(() => setSuccessToast(''), 2500);
  };

  // Like handler (parent & replies)
  const handleLike = (commentId, parentId) => {
    const updated = comments.map((c) => {
      if (parentId && c.id === parentId) {
        return {
          ...c,
          replies: (c.replies || []).map((r) => {
            if (r.id === commentId) {
              if (r.userLiked) return { ...r, likes: r.likes - 1, userLiked: false };
              return {
                ...r,
                likes: (r.likes || 0) + 1,
                userLiked: true,
                userDisliked: false,
                dislikes: r.userDisliked ? Math.max(0, (r.dislikes || 1) - 1) : r.dislikes,
              };
            }
            return r;
          }),
        };
      }
      if (c.id === commentId) {
        if (c.userLiked) return { ...c, likes: c.likes - 1, userLiked: false };
        return {
          ...c,
          likes: (c.likes || 0) + 1,
          userLiked: true,
          userDisliked: false,
          dislikes: c.userDisliked ? Math.max(0, (c.dislikes || 1) - 1) : c.dislikes,
        };
      }
      return c;
    });
    setComments(updated);
    saveChapterComments(currentBookId, currentChapterId, updated);
  };

  // Dislike handler (parent & replies)
  const handleDislike = (commentId, parentId) => {
    const updated = comments.map((c) => {
      if (parentId && c.id === parentId) {
        return {
          ...c,
          replies: (c.replies || []).map((r) => {
            if (r.id === commentId) {
              if (r.userDisliked) return { ...r, dislikes: r.dislikes - 1, userDisliked: false };
              return {
                ...r,
                dislikes: (r.dislikes || 0) + 1,
                userDisliked: true,
                userLiked: false,
                likes: r.userLiked ? Math.max(0, (r.likes || 1) - 1) : r.likes,
              };
            }
            return r;
          }),
        };
      }
      if (c.id === commentId) {
        if (c.userDisliked) return { ...c, dislikes: c.dislikes - 1, userDisliked: false };
        return {
          ...c,
          dislikes: (c.dislikes || 0) + 1,
          userDisliked: true,
          userLiked: false,
          likes: c.userLiked ? Math.max(0, (c.likes || 1) - 1) : c.likes,
        };
      }
      return c;
    });
    setComments(updated);
    saveChapterComments(currentBookId, currentChapterId, updated);
  };

  // Sorted Comments based on activeTab ('top' vs 'recents')
  const sortedComments = [...comments].sort((a, b) => {
    if (activeTab === 'top') {
      return (b.likes || 0) - (a.likes || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const totalCommentsCount = countTotalComments(comments);

  // Use the real Cloud book like count from reactionsApi (not comment thumbs-up sum)
  const cloudBookLikes = bookReactions?.[currentBookId]?.like || 0;

  // Dynamic theme colors matching current reading theme
  const pageBg = isLight ? '#FAF8F5' : '#121216';
  const textColor = isLight ? '#1A1816' : '#FFFFFF';
  const subtextColor = isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)';
  const borderColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
  const inputBg = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.08)';
  const inputBorder = isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)';

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  return (
    <>
      {/* Trigger Button (if not controlled externally) */}
      {!onClose && (
        iconOnly ? (
          <button
            type="button"
            onClick={handleOpen}
            className="p-2 rounded-full hover:bg-gold/10 transition-colors text-ink"
            aria-label="Voir les commentaires"
          >
            <MessageSquareIcon className="w-5 h-5 text-gold" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleOpen}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold/15 text-gold font-bold text-[13px] hover:bg-gold/25 transition-all"
          >
            <MessageSquareIcon className="w-4 h-4" />
            <span>Commentaires ({totalCommentsCount})</span>
          </button>
        )
      )}

      {/* FULLSCREEN RESPONSIVE MODAL DRAWER */}
      {(isOpen || onClose) &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div
              className="fixed inset-0"
              onClick={handleClose}
              aria-hidden="true"
            />

            <div
              ref={modalRef}
              className="relative w-full max-w-xl mx-auto flex flex-col shadow-2xl overflow-hidden transition-all duration-200"
              style={{
                backgroundColor: pageBg,
                color: textColor,
                paddingBottom: 'env(safe-area-inset-bottom)',
                height: viewportHeight ? `${viewportHeight}px` : '100dvh',
                maxHeight: viewportHeight ? `${viewportHeight}px` : '100dvh',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ═══ TOP HEADER BAR WITH BACK BUTTON ═══ */}
              <div
                className="flex items-center justify-between px-4 pb-3 border-b flex-shrink-0"
                style={{
                  borderColor,
                  paddingTop: 'max(16px, calc(env(safe-area-inset-top) + 10px))',
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Back Button */}
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95"
                    style={{
                      backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
                      color: textColor,
                    }}
                    aria-label="Retour"
                  >
                    <BackIcon className="w-4.5 h-4.5" />
                  </button>

                  <div>
                    <h2 className="font-display font-bold text-[18px] flex items-center gap-2 leading-none" style={{ color: textColor }}>
                      <span>Commentaires</span>
                      <span className="text-[13px] px-2 py-0.5 rounded-full bg-gold/20 text-gold font-bold">
                        {totalCommentsCount}
                      </span>
                    </h2>
                    <p className="text-[11px] font-medium opacity-60 mt-0.5" style={{ color: subtextColor }}>
                      Espace discussion du chapitre · {cloudBookLikes} J'aime
                    </p>
                  </div>
                </div>

                {/* Close Button × */}
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[16px] transition-colors"
                  style={{
                    backgroundColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)',
                    color: textColor,
                  }}
                >
                  ×
                </button>
              </div>

              {/* ═══ TABS SWITCHER (Top vs Récents) ═══ */}
              <div
                className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
                style={{ borderColor }}
              >
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('recents')}
                    className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'recents'
                        ? 'bg-gold text-deep-2 shadow-sm'
                        : (isLight ? 'bg-black/5 text-ink/60' : 'bg-white/8 text-white/60')
                    }`}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>Récents</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('top')}
                    className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'top'
                        ? 'bg-gold text-deep-2 shadow-sm'
                        : (isLight ? 'bg-black/5 text-ink/60' : 'bg-white/8 text-white/60')
                    }`}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 23c-4.97 0-9-4.03-9-9 0-3.92 2.34-7.3 5.75-8.77.34-.14.73.08.79.44.13.78.43 1.54.89 2.22.42.61.94 1.13 1.57 1.54.34.22.8.03.88-.37.24-1.15.75-2.22 1.49-3.11C15.89 4.14 17.65 2.66 18.41.52c.11-.31.47-.46.77-.32C20.84 1.05 22 2.8 22 4.75c0 1.93-.78 3.68-2.05 4.95-.27.27-.47.61-.57.99-.21.82-.16 1.7.14 2.5.47 1.25.73 2.6.73 4.01 0 4.97-4.03 9-9 9z" />
                    </svg>
                    <span>Top (Populaires)</span>
                  </button>
                </div>

                <span className="text-[11px] font-mono opacity-50" style={{ color: subtextColor }}>
                  {activeTab === 'top' ? 'Trié par Likes' : 'Trié par Date'}
                </span>
              </div>

              {/* Notification Toast */}
              {successToast && (
                <div className="mx-4 mt-2 bg-emerald-600 text-white px-3 py-2 rounded-xl text-[12.5px] font-bold flex items-center gap-2 animate-fadeIn flex-shrink-0 shadow-md">
                  <CheckIcon className="w-4 h-4 text-white" />
                  <span>{successToast}</span>
                </div>
              )}

              {/* ═══ SCROLLABLE COMMENTS LIST ═══ */}
              <div
                className="overflow-y-auto flex-1 min-h-0 px-4 py-3 space-y-4 max-w-2xl mx-auto w-full"
                style={{
                  overscrollBehaviorY: 'contain',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {sortedComments.length === 0 ? (
                  <div className="py-16 text-center text-[13px]" style={{ color: subtextColor }}>
                    Soyez le premier à commenter ce chapitre !
                  </div>
                ) : (
                  sortedComments.map((c) => (
                    <CommentRow
                      key={c.id}
                      comment={c}
                      onLike={handleLike}
                      onDislike={handleDislike}
                      onReply={handleInitiateReply}
                      onReport={handleReportComment}
                      onDelete={handleDeleteComment}
                      onEdit={handleEditComment}
                      isLight={isLight}
                      currentUserName={userProfile?.name || 'Lecteur Koko'}
                    />
                  ))
                )}
              </div>

              {/* ═══ STICKY BOTTOM COMPOSER & EMOJI BAR ═══ */}
              <div
                className="p-3 border-t flex-shrink-0 space-y-2.5 max-w-2xl mx-auto w-full sticky bottom-0 z-20"
                style={{
                  borderColor,
                  backgroundColor: isLight ? 'rgba(250,248,245,0.98)' : 'rgba(18,18,22,0.98)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                {/* Replying Badge Indicator */}
                {replyingTo && (
                  <div
                    className="flex items-center justify-between px-3 py-1.5 rounded-xl text-[12px] font-medium"
                    style={{
                      backgroundColor: 'rgba(200,169,81,0.18)',
                      color: textColor,
                    }}
                  >
                    <span>
                      Répondre à <strong className="text-gold">{replyingTo.author}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="font-bold text-[14px] hover:opacity-75 px-1"
                      style={{ color: subtextColor }}
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Quick Emojis Selection Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {EMOJIS.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleInsertEmoji(emoji)}
                      className="px-2.5 py-1 rounded-full text-[14px] hover:scale-110 active:scale-95 transition-all flex-shrink-0"
                      style={{
                        backgroundColor: inputBg,
                        border: `1px solid ${inputBorder}`,
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>

                {/* Input Form */}
                <form onSubmit={handleAddComment} className="flex gap-2 items-center">
                  <div
                    className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-extrabold text-white shadow-sm"
                    style={{ backgroundColor: avatarColor(userProfile?.name || 'K') }}
                  >
                    {initials(userProfile?.name || 'Lecteur Koko')}
                  </div>

                  <input
                    ref={inputRef}
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => {
                      e.stopPropagation();
                      if (modalRef.current) modalRef.current.scrollTop = 0;
                      window.scrollTo(0, 0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    placeholder={replyingTo ? `Répondre à ${replyingTo.author}…` : 'Écrire un commentaire…'}
                    className="flex-1 rounded-full px-4 py-2.5 text-[13px] outline-none transition-colors"
                    style={{
                      backgroundColor: inputBg,
                      border: `1px solid ${inputBorder}`,
                      color: textColor,
                    }}
                  />

                  <button
                    type="button"
                    onClick={handleAddComment}
                    disabled={!newCommentText.trim()}
                    title="Envoyer le commentaire"
                    aria-label="Envoyer"
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 flex-shrink-0 ${
                      newCommentText.trim()
                        ? 'bg-gold text-deep-2 shadow-md hover:opacity-90 cursor-pointer'
                        : 'opacity-40 bg-gray-500 text-white cursor-not-allowed'
                    }`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="ml-0.5">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
