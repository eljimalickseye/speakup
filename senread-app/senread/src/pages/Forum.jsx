import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { IconButton } from '../components/ui/primitives.jsx';
import {
  BackIcon,
  MessageSquareIcon,
  PlusIcon,
  SparklesIcon,
  BookOpenIcon,
  PenToolIcon,
} from '../components/ui/Icons.jsx';

export default function Forum() {
  const navigate = useNavigate();
  const { userProfile, appLanguage } = useApp();
  const isEn = appLanguage === 'en';

  const [activeCategory, setActiveCategory] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const initialThreads = [
    {
      id: 1,
      category: 'theories',
      categoryLabel: isEn ? 'Theories & Analyses' : 'Théories & Analyses',
      title: isEn
        ? "The Secret of Gorée Island: Your theories on Chapter 3's secret manuscript!"
        : "Le Secret de l'Île de Gorée : Vos théories sur le manuscrit du Chapitre 3 !",
      bookId: 'koko-goree-secret',
      bookTitle: isEn ? "The Secret of Gorée Island" : "Le Secret de l'Île de Gorée",
      author: 'Fatoumata',
      time: isEn ? '2h ago' : 'Il y a 2h',
      likes: 12,
      replies: [
        {
          id: 101,
          author: 'Awa Ndiaye',
          text: isEn
            ? 'I am convinced that the secret manuscript written in English and French was a peace treaty passed down through generations!'
            : 'Je suis convaincue que le manuscrit secret rédigé en anglais et en français était un pacte de paix transmis de génération en génération !',
          time: isEn ? '1h ago' : 'Il y a 1h',
        },
        {
          id: 102,
          author: 'Moussa Diop',
          text: isEn
            ? 'Exactly! And the baobab tree metaphor perfectly summarizes Senegal\'s cultural roots.'
            : 'Exactement ! Et la métaphore du baobab géant résume parfaitement les racines culturelles du Sénégal.',
          time: isEn ? '30m ago' : 'Il y a 30m',
        },
      ],
    },
    {
      id: 2,
      category: 'bilingual',
      categoryLabel: isEn ? 'Bilingual Practice' : 'Entraînement Bilingue',
      title: isEn
        ? 'How do you review difficult English vocabulary words?'
        : 'Comment révisez-vous les mots de vocabulaire anglais difficiles ?',
      bookId: null,
      bookTitle: null,
      author: 'Aïda Lefevre',
      time: isEn ? 'Yesterday' : 'Hier',
      likes: 8,
      replies: [
        {
          id: 201,
          author: 'Ousmane',
          text: isEn
            ? 'I use Koko\'s vocabulary notebook! Every time I tap a highlighted word in the story, I review its definition.'
            : 'J\'utilise le carnet de vocabulaire Koko ! À chaque fois que je touche un mot surligné dans l\'histoire, je le relis avec la définition.',
          time: isEn ? 'Yesterday' : 'Hier',
        },
      ],
    },
    {
      id: 3,
      category: 'authors',
      categoryLabel: isEn ? 'Authors & Creators' : 'Espace Auteurs & Créateurs',
      title: isEn
        ? 'Tips for designing your first bilingual book cover in Koko Studio'
        : 'Conseils pour créer sa première couverture de roman bilingue dans le Studio Koko',
      bookId: null,
      bookTitle: null,
      author: 'El Hadji Malick',
      time: isEn ? '2 days ago' : 'Il y a 2 jours',
      likes: 15,
      replies: [
        {
          id: 301,
          author: 'Fatoumata',
          text: isEn
            ? 'Pastel color gradients and custom cover art work amazingly well with readers!'
            : 'Les dégradés de couleurs pastel et les illustrations personnalisées marchent très bien auprès des lecteurs !',
          time: isEn ? 'Yesterday' : 'Hier',
        },
      ],
    },
  ];

  const [threads, setThreads] = useState(() => {
    try {
      const saved = localStorage.getItem('koko_global_forum_threads');
      return saved ? JSON.parse(saved) : initialThreads;
    } catch {
      return initialThreads;
    }
  });

  const [activeThreadId, setActiveThreadId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('theories');
  const [newText, setNewText] = useState('');
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('koko_global_forum_threads', JSON.stringify(threads));
    } catch (e) {
      console.warn('Failed to save forum threads', e);
    }
  }, [threads]);

  const handleCreateThread = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newText.trim()) return;

    const catLabelMap = {
      theories: isEn ? 'Theories & Analyses' : 'Théories & Analyses',
      bilingual: isEn ? 'Bilingual Practice' : 'Entraînement Bilingue',
      authors: isEn ? 'Authors & Creators' : 'Espace Auteurs & Créateurs',
      general: isEn ? 'General Discussion' : 'Discussion Générale',
    };

    const newThreadObj = {
      id: Date.now(),
      category: newCategory,
      categoryLabel: catLabelMap[newCategory] || (isEn ? 'General Discussion' : 'Discussion Générale'),
      title: newTitle.trim(),
      bookId: null,
      bookTitle: null,
      author: userProfile.name || (isEn ? 'Koko Reader' : 'Lecteur Koko'),
      time: isEn ? 'Just now' : 'À l’instant',
      likes: 1,
      replies: [
        {
          id: Date.now() + 1,
          author: userProfile.name || (isEn ? 'Koko Reader' : 'Lecteur Koko'),
          text: newText.trim(),
          time: isEn ? 'Just now' : 'À l’instant',
        },
      ],
    };

    setThreads([newThreadObj, ...threads]);
    setNewTitle('');
    setNewText('');
    setShowCreateModal(false);
  };

  const handleAddReply = (e, threadId) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setThreads((prev) =>
      prev.map((t) => {
        if (t.id === threadId) {
          return {
            ...t,
            replies: [
              ...t.replies,
              {
                id: Date.now(),
                author: userProfile.name || (isEn ? 'Koko Reader' : 'Lecteur Koko'),
                text: replyText.trim(),
                time: isEn ? 'Just now' : 'À l’instant',
              },
            ],
          };
        }
        return t;
      })
    );

    setReplyText('');
  };

  const filteredThreads = activeCategory === 'all'
    ? threads
    : threads.filter((t) => t.category === activeCategory);

  return (
    <div className="px-5 pt-4 pb-36 text-ink text-left space-y-5">
      {/* Top Header Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <IconButton aria-label="Go back" onClick={() => navigate(-1)}>
            <BackIcon className="w-4 h-4" />
          </IconButton>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gold block">
              {isEn ? 'Koko Community' : 'Communauté Koko'}
            </span>
            <h1 className="font-display font-bold text-[20px] text-ink leading-none">
              {isEn ? 'Discussion Forums' : 'Forums de Discussion'}
            </h1>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          title={isEn ? 'Create new topic' : 'Créer un nouveau sujet'}
          className="w-9 h-9 rounded-full bg-gold text-deep-2 border border-gold/40 flex items-center justify-center font-bold shadow-md hover:opacity-90 active:scale-95 transition-all"
        >
          <PlusIcon className="w-5 h-5 text-deep-2" />
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3.5 py-2 rounded-xl text-[12px] font-bold border transition-all flex-shrink-0 flex items-center gap-1.5 ${
            activeCategory === 'all'
              ? 'bg-deep text-paper border-deep shadow-sm'
              : 'bg-white border-surface-line text-taupe hover:border-gold'
          }`}
        >
          <MessageSquareIcon className="w-3.5 h-3.5 text-gold" />
          <span>{isEn ? `All Topics (${threads.length})` : `Tous les Sujets (${threads.length})`}</span>
        </button>

        <button
          onClick={() => setActiveCategory('theories')}
          className={`px-3.5 py-2 rounded-xl text-[12px] font-bold border transition-all flex-shrink-0 flex items-center gap-1.5 ${
            activeCategory === 'theories'
              ? 'bg-deep text-paper border-deep shadow-sm'
              : 'bg-white border-surface-line text-taupe hover:border-gold'
          }`}
        >
          <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
          <span>{isEn ? 'Theories & Analyses' : 'Théories & Analyses'}</span>
        </button>

        <button
          onClick={() => setActiveCategory('bilingual')}
          className={`px-3.5 py-2 rounded-xl text-[12px] font-bold border transition-all flex-shrink-0 flex items-center gap-1.5 ${
            activeCategory === 'bilingual'
              ? 'bg-deep text-paper border-deep shadow-sm'
              : 'bg-white border-surface-line text-taupe hover:border-gold'
          }`}
        >
          <BookOpenIcon className="w-3.5 h-3.5 text-sky-500" />
          <span>{isEn ? 'Bilingual Practice' : 'Entraînement Bilingue'}</span>
        </button>

        <button
          onClick={() => setActiveCategory('authors')}
          className={`px-3.5 py-2 rounded-xl text-[12px] font-bold border transition-all flex-shrink-0 flex items-center gap-1.5 ${
            activeCategory === 'authors'
              ? 'bg-deep text-paper border-deep shadow-sm'
              : 'bg-white border-surface-line text-taupe hover:border-gold'
          }`}
        >
          <PenToolIcon className="w-3.5 h-3.5 text-purple-500" />
          <span>{isEn ? 'Authors Corner' : 'Espace Auteurs'}</span>
        </button>
      </div>

      {/* Threads List */}
      <div className="space-y-3.5">
        {filteredThreads.length === 0 ? (
          <div className="p-8 text-center bg-white border border-surface-line rounded-3xl space-y-2">
            <MessageSquareIcon className="w-8 h-8 text-taupe mx-auto opacity-40" />
            <p className="text-[13px] font-semibold text-taupe">
              {isEn ? 'No topics found in this category yet.' : 'Aucun sujet dans cette catégorie pour le moment.'}
            </p>
          </div>
        ) : (
          filteredThreads.map((thread) => {
            const isExpanded = activeThreadId === thread.id;
            return (
              <div key={thread.id} className="p-4 rounded-3xl bg-white border border-surface-line space-y-3 shadow-sm hover:border-gold/40 transition-all">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[9.5px] font-extrabold uppercase text-gold bg-gold/15 px-2.5 py-0.5 rounded-full border border-gold/30">
                      {thread.categoryLabel}
                    </span>
                    <h3 className="font-display font-bold text-[15px] text-ink leading-snug">{thread.title}</h3>
                    
                    {thread.bookTitle && (
                      <Link
                        to={`/book/${thread.bookId}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 mt-1 hover:underline"
                      >
                        <BookOpenIcon className="w-3 h-3" />
                        <span>{thread.bookTitle}</span>
                      </Link>
                    )}

                    <p className="text-[11px] text-taupe pt-0.5">
                      {isEn ? 'By' : 'Par'} <strong>{thread.author}</strong> • {thread.time}
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveThreadId(isExpanded ? null : thread.id)}
                    className={`px-3 py-1.5 rounded-xl border text-[11.5px] font-bold transition-all flex-shrink-0 ml-2 ${
                      isExpanded
                        ? 'bg-deep text-paper border-deep'
                        : 'bg-gold/15 text-gold border-gold/30 hover:bg-gold/25'
                    }`}
                  >
                    {isExpanded ? (isEn ? 'Collapse' : 'Réduire') : isEn ? `Join (${thread.replies.length})` : `Participer (${thread.replies.length})`}
                  </button>
                </div>

                {/* Expanded Replies & Form */}
                {isExpanded && (
                  <div className="pt-3 border-t border-surface-line space-y-3 animate-fadeIn">
                    <div className="space-y-2">
                      {thread.replies.map((reply) => (
                        <div key={reply.id} className="p-3 rounded-2xl bg-paper border border-surface-line space-y-1 text-[12.5px]">
                          <div className="flex justify-between items-center border-b border-surface-line/40 pb-1">
                            <span className="font-bold text-gold flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-gold inline-block" />
                              {reply.author}
                            </span>
                            <span className="text-[9.5px] text-taupe font-mono">{reply.time}</span>
                          </div>
                          <p className="text-ink leading-relaxed font-medium pt-0.5">{reply.text}</p>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={(e) => handleAddReply(e, thread.id)} className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={isEn ? 'Reply to this discussion...' : 'Répondre à cette discussion...'}
                        className="flex-1 px-3.5 py-2.5 rounded-xl text-[12.5px] bg-paper border border-surface-line text-ink outline-none focus:border-gold"
                      />
                      <button
                        type="submit"
                        disabled={!replyText.trim()}
                        className={`px-4 py-2.5 rounded-xl text-[12px] font-bold shadow-sm ${
                          replyText.trim() ? 'bg-gold text-deep-2' : 'bg-surface text-taupe opacity-50 cursor-not-allowed'
                        }`}
                      >
                        {isEn ? 'Send' : 'Envoyer'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal for Creating New Thread */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn" onClick={() => setShowCreateModal(false)}>
          <div className="bg-paper border border-surface-line rounded-3xl p-5 w-full max-w-md text-left relative shadow-2xl space-y-3.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-surface-line pb-2.5">
              <div className="flex items-center gap-1.5">
                <SparklesIcon className="w-4 h-4 text-gold" />
                <span className="text-[12px] font-extrabold uppercase text-gold">
                  {isEn ? 'Create Discussion Topic' : 'Créer un Sujet de Discussion'}
                </span>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-taupe text-lg font-bold hover:text-ink">
                ×
              </button>
            </div>

            <form onSubmit={handleCreateThread} className="space-y-3">
              <div>
                <label className="block text-[10.5px] font-bold text-taupe uppercase mb-1">
                  {isEn ? 'Topic Category' : 'Catégorie du Sujet'}
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white border border-surface-line text-[12.5px] font-semibold text-ink outline-none"
                >
                  <option value="theories">{isEn ? 'Theories & Literary Analyses' : 'Théories & Analyses Littéraires'}</option>
                  <option value="bilingual">{isEn ? 'Bilingual Practice & Words' : 'Entraînement Bilingue & Mots'}</option>
                  <option value="authors">{isEn ? 'Authors & Writing Tips' : 'Espace Auteurs & Conseils'}</option>
                  <option value="general">{isEn ? 'General Discussion' : 'Discussion Générale'}</option>
                </select>
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-taupe uppercase mb-1">
                  {isEn ? 'Topic Title*' : 'Titre du Sujet*'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isEn ? 'e.g. What do you think about chapter 2...' : 'Ex: Que pensez-vous du chapitre 2...'}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-surface-line text-[12.5px] outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-[10.5px] font-bold text-taupe uppercase mb-1">
                  {isEn ? 'Opening Message*' : 'Message d\'ouverture*'}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={isEn ? 'Expand your ideas to launch the debate...' : 'Développez votre idée pour lancer le débat...'}
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-white border border-surface-line text-[12.5px] outline-none focus:border-gold"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-deep text-paper py-3 rounded-xl font-bold text-[13px] shadow-sm hover:opacity-95"
              >
                {isEn ? 'Publish Topic' : 'Publier le Sujet'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
