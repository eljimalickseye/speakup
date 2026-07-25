import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import {
  MessageSquareIcon,
  BookmarkIcon,
  PenToolIcon,
  ProfileIcon,
  BookOpenIcon,
  SparklesIcon,
  SunIcon,
  MoonIcon,
  PlusIcon,
  TrashIcon,
  CrownIcon,
} from '../ui/Icons.jsx';

export default function QuickShortcutsDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { appLanguage, themeMode, toggleThemeMode } = useApp();
  const isEn = appLanguage === 'en';

  // Hide floating shortcut button on profile page if it overlaps header controls
  const isProfilePage = pathname === '/profile';

  // User Custom Shortcuts state persisted in localStorage
  const [customShortcuts, setCustomShortcuts] = useState(() => {
    try {
      const saved = localStorage.getItem('koko_user_custom_shortcuts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('/library');

  const targetOptions = [
    { value: '/library', label: isEn ? 'Library & Notebook' : 'Bibliothèque & Vocabulaire', icon: BookmarkIcon },
    { value: '/forum', label: isEn ? 'Discussion Forums' : 'Forums de Discussion', icon: MessageSquareIcon },
    { value: '/publish', label: isEn ? 'Ebook Creator Studio' : 'Studio de Création', icon: PenToolIcon },
    { value: '/ranking', label: isEn ? 'Leaderboard & Podium' : 'Classement & Podium', icon: CrownIcon },
    { value: '/profile', label: isEn ? 'Profile & Coins' : 'Mon Profil & Coins', icon: ProfileIcon },
  ];

  const defaultShortcuts = [
    {
      label: isEn ? 'Discussion Forums' : 'Forums de Discussion',
      desc: isEn ? 'Debates & theories between readers' : 'Débats & thématiques entre lecteurs',
      to: '/forum',
      icon: MessageSquareIcon,
    },
    {
      label: isEn ? 'Library & My Books' : 'Bibliothèque & Mes Livres',
      desc: isEn ? 'Your readings & vocabulary notebook' : 'Vos lectures & carnet de mots',
      to: '/library',
      icon: BookmarkIcon,
    },
    {
      label: isEn ? 'Ebook Creator Studio' : 'Studio Créateur d\'Ebooks',
      desc: isEn ? 'Write & publish a bilingual book' : 'Écrire & publier un livre bilingue',
      to: '/publish',
      icon: PenToolIcon,
    },
    {
      label: isEn ? 'My Profile & Koko Coins' : 'Mon Profil & Coins Koko',
      desc: isEn ? 'Balance, language & VIP plan' : 'Solde, langue & abonnement VIP',
      to: '/profile',
      icon: ProfileIcon,
    },
    {
      label: isEn ? 'Featured Novel (Gorée)' : 'Roman Phare (Le Secret de Gorée)',
      desc: isEn ? 'Recommended bilingual reading' : 'Lecture bilingue recommandée',
      to: '/book/koko-goree-secret',
      icon: BookOpenIcon,
    },
  ];

  const allShortcuts = [
    ...defaultShortcuts,
    ...customShortcuts.map((cs) => {
      const matchOpt = targetOptions.find((o) => o.value === cs.target);
      const TargetIcon = matchOpt?.icon || SparklesIcon;
      return {
        label: cs.title,
        desc: isEn ? 'Custom shortcut' : 'Raccourci personnalisé',
        to: cs.target,
        icon: TargetIcon,
        isCustom: true,
        id: cs.id,
      };
    }),
  ];

  const totalPages = Math.ceil(allShortcuts.length / itemsPerPage);
  const paginatedShortcuts = allShortcuts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleAddCustomShortcut = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newCS = {
      id: Date.now(),
      title: newTitle.trim(),
      target: newTarget,
    };
    const updated = [newCS, ...customShortcuts];
    setCustomShortcuts(updated);
    localStorage.setItem('koko_user_custom_shortcuts', JSON.stringify(updated));
    setNewTitle('');
    setShowAddForm(false);
  };

  const handleDeleteCustomShortcut = (id) => {
    const updated = customShortcuts.filter((cs) => cs.id !== id);
    setCustomShortcuts(updated);
    localStorage.setItem('koko_user_custom_shortcuts', JSON.stringify(updated));
  };

  const handleNavigate = (path) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Floating Quick Shortcut Trigger Button */}
      {!isProfilePage && (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setCurrentPage(1);
          }}
          title={isEn ? 'Koko Menu' : 'Menu Koko'}
          className="fixed top-14 sm:top-4 right-3.5 sm:right-4 z-40 w-9 h-9 rounded-full bg-deep text-gold shadow-xl border border-gold/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}
        >
          <SparklesIcon className="w-4.5 h-4.5 text-gold" />
        </button>
      )}

      {/* Popover / Sheet Drawer with z-[9999] layer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 pb-20 sm:pb-6 animate-fadeIn pointer-events-auto"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#1F1F1F] text-white rounded-3xl p-5 relative shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-3.5 border border-white/15 animate-fadeIn text-left max-h-[80vh] flex flex-col pointer-events-auto mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Displays just "Koko" alongside official logo & a simple "+" add button */}
            <div className="flex justify-between items-center pb-2.5 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt="Koko Logo"
                  className="w-7 h-7 rounded-full object-cover border border-gold/40 shadow-sm"
                />
                <h3 className="font-display font-bold text-[18px] text-white leading-none">
                  Koko
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  title={isEn ? 'Add Shortcut' : 'Ajouter un Raccourci'}
                  className="w-8 h-8 rounded-xl bg-gold/20 hover:bg-gold/30 text-gold font-bold text-[15px] border border-gold/40 flex items-center justify-center transition-all"
                >
                  <PlusIcon className="w-4 h-4 text-gold" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white font-bold text-[14px]"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Add Custom Shortcut Form Modal with SVG Selection Cards */}
            {showAddForm && (
              <form onSubmit={handleAddCustomShortcut} className="bg-white/10 p-3.5 rounded-2xl border border-gold/30 space-y-3 text-left animate-fadeIn">
                <span className="text-[10.5px] font-bold text-gold uppercase tracking-wider block">
                  {isEn ? 'Add Shortcut' : 'Nouveau Raccourci'}
                </span>
                <input
                  type="text"
                  required
                  placeholder={isEn ? 'Title (e.g. My Favorites)' : 'Titre (ex: Mes Favoris)'}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/20 text-white text-[12.5px] outline-none placeholder:text-white/40"
                />

                {/* SVG Icon Selector Grid */}
                <div className="space-y-1">
                  <span className="text-[9.5px] font-bold text-white/60 uppercase block">
                    {isEn ? 'Target Page' : 'Destination'}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {targetOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = newTarget === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setNewTarget(opt.value)}
                          className={`p-2 rounded-xl border text-[11px] font-bold flex items-center gap-2 transition-all ${
                            isSelected
                              ? 'bg-gold text-deep border-gold shadow-sm'
                              : 'bg-black/30 border-white/10 text-white/70 hover:bg-white/10'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-deep' : 'text-gold'}`} />
                          <span className="truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-1.5 rounded-xl bg-white/10 text-white text-[11.5px] font-semibold"
                  >
                    {isEn ? 'Cancel' : 'Annuler'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1.5 rounded-xl bg-gold text-deep font-bold text-[11.5px] shadow-sm"
                  >
                    {isEn ? 'Save' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            )}

            {/* List Items with Touch Scrolling */}
            <div className="space-y-2 overflow-y-auto max-h-[50vh] pr-1 pb-2 flex-1 touch-auto pointer-events-auto">
              {/* Theme Mode Switcher Item inside Drawer */}
              {currentPage === 1 && (
                <div
                  onClick={toggleThemeMode}
                  className="p-3 rounded-2xl bg-gold/15 hover:bg-gold/25 border border-gold/30 transition-all cursor-pointer flex items-center justify-between group active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gold text-deep flex items-center justify-center flex-shrink-0 font-bold shadow-sm">
                      {themeMode === 'dark' ? <SunIcon className="w-4.5 h-4.5 text-deep" /> : <MoonIcon className="w-4.5 h-4.5 text-deep" />}
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-[13px] text-gold group-hover:text-white transition-colors">
                        {themeMode === 'dark'
                          ? (isEn ? 'Switch to Light Mode' : 'Passer en Mode Clair')
                          : (isEn ? 'Switch to Dark Mode' : 'Passer en Mode Sombre')}
                      </h4>
                      <p className="text-[10.5px] text-white/70 leading-tight">
                        {themeMode === 'dark'
                          ? (isEn ? 'Cream paper theme' : 'Thème papier crème')
                          : (isEn ? 'OLED midnight dark theme' : 'Thème sombre OLED minuit')}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-gold/20 text-gold border border-gold/40">
                    {themeMode === 'dark' ? 'Dark' : 'Light'}
                  </span>
                </div>
              )}

              {paginatedShortcuts.map((s, idx) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.id || idx}
                    onClick={() => handleNavigate(s.to)}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-white/12 border border-white/5 transition-all cursor-pointer flex items-center justify-between group active:scale-98"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gold/15 text-gold flex items-center justify-center flex-shrink-0 font-bold border border-gold/30">
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-[13px] text-white group-hover:text-gold transition-colors">
                          {s.label}
                        </h4>
                        <p className="text-[10.5px] text-white/60 leading-tight">{s.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {s.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomShortcut(s.id);
                          }}
                          className="p-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                          title="Supprimer"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <span className="text-[12px] font-bold text-white/40 group-hover:text-gold transition-colors">
                        →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls for Drawer Modal if > 1 Page */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 border-t border-white/10 flex-shrink-0 text-[12px]">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 rounded-xl bg-white/10 text-white disabled:opacity-40 font-bold"
                >
                  ← {isEn ? 'Previous' : 'Précédent'}
                </button>

                <div className="flex gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-6 h-6 rounded-full font-bold text-[11px] transition-all ${
                        p === currentPage ? 'bg-gold text-deep' : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 rounded-xl bg-white/10 text-white disabled:opacity-40 font-bold"
                >
                  {isEn ? 'Next' : 'Suivant'} →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
