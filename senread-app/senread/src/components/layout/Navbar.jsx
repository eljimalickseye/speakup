import { NavLink } from 'react-router-dom';
import { HomeIcon, BookOpenIcon, BookmarkIcon, UserIcon, AwardIcon } from '../ui/Icons.jsx';

export default function Navbar() {
  const navItems = [
    { to: '/', icon: HomeIcon, label: 'Accueil' },
    { to: '/library', icon: BookOpenIcon, label: 'Ma Bibliothèque' },
    { to: '/ranking', icon: AwardIcon, label: 'Classement' },
    { to: '/bookmarks', icon: BookmarkIcon, label: 'Favoris' },
    { to: '/profile', icon: UserIcon, label: 'Profil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-paper/95 backdrop-blur-md border-t border-surface-line/80 px-4 py-2 text-ink shadow-lg">
      <div className="max-w-md mx-auto flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                  isActive ? 'text-gold font-bold scale-105' : 'text-taupe hover:text-ink font-medium'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
