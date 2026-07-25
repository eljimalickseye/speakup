import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import {
  HomeIcon,
  LibraryIcon,
  BookmarkIcon,
  ProfileIcon,
  MessageSquareIcon,
  PenToolIcon,
  SunIcon,
  MoonIcon,
  SparklesIcon,
} from '../ui/Icons.jsx';

export default function DesktopNavbar() {
  const navigate = useNavigate();
  const { appLanguage, themeMode, toggleThemeMode, userProfile } = useApp();
  const isEn = appLanguage === 'en';

  const navLinks = [
    { label: isEn ? 'Home' : 'Accueil', to: '/', icon: HomeIcon },
    { label: isEn ? 'Discover' : 'Découvrir', to: '/discover', icon: LibraryIcon },
    { label: isEn ? 'Library' : 'Bibliothèque', to: '/library', icon: BookmarkIcon },
    { label: isEn ? 'Forums' : 'Forum', to: '/forum', icon: MessageSquareIcon },
    { label: isEn ? 'Studio' : 'Studio', to: '/publish', icon: PenToolIcon },
    { label: isEn ? 'Profile' : 'Profil', to: '/profile', icon: ProfileIcon },
  ];

  return (
    <header className="hidden md:flex items-center justify-between w-full bg-surface/90 backdrop-blur-md border-b border-surface-line px-8 py-3.5 sticky top-0 z-50 shadow-sm">
      {/* Brand Logo & Title */}
      <div
        onClick={() => navigate('/')}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <img
          src="/logo.png"
          alt="Koko Logo"
          className="w-8 h-8 rounded-full object-cover border border-gold/40 shadow-sm group-hover:scale-105 transition-transform"
        />
        <div>
          <span className="font-display font-bold text-[19px] text-ink block leading-none">
            Koko
          </span>
          <span className="text-[9.5px] text-taupe font-bold tracking-widest uppercase block mt-0.5">
            {isEn ? 'Bilingual Stories' : 'Romans Bilingues'}
          </span>
        </div>
      </div>

      {/* Center Nav Links */}
      <nav className="flex items-center gap-1.5 bg-paper/60 p-1.5 rounded-full border border-surface-line shadow-inner">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `px-4 py-1.5 rounded-full text-[12px] font-bold flex items-center gap-2 transition-all ${
                  isActive
                    ? 'bg-deep text-paper shadow-sm'
                    : 'text-taupe hover:text-ink hover:bg-surface'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Right Desktop Quick Controls */}
      <div className="flex items-center gap-2.5">
        {/* Theme Mode Toggle Button */}
        <button
          onClick={toggleThemeMode}
          title={themeMode === 'dark' ? (isEn ? 'Light Mode' : 'Mode Clair') : (isEn ? 'Dark Mode' : 'Mode Sombre')}
          className="w-9 h-9 rounded-full bg-surface border border-surface-line flex items-center justify-center text-taupe hover:text-gold hover:border-gold/40 transition-all shadow-sm"
        >
          {themeMode === 'dark' ? <SunIcon className="w-4 h-4 text-gold" /> : <MoonIcon className="w-4 h-4 text-taupe" />}
        </button>

        {/* User Balance Badge */}
        <div
          onClick={() => navigate('/profile')}
          className="bg-gold/15 text-gold border border-gold/40 px-3 py-1.5 rounded-full text-[11.5px] font-bold flex items-center gap-1.5 cursor-pointer hover:bg-gold/25 transition-all shadow-sm"
        >
          <SparklesIcon className="w-3.5 h-3.5 text-gold" />
          <span>{userProfile.coins || 0} Coins</span>
        </div>
      </div>
    </header>
  );
}
