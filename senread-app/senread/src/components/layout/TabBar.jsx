import { NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { HomeIcon, LibraryIcon, BookmarkIcon, ProfileIcon } from '../ui/Icons.jsx';

export default function TabBar() {
  const { appLanguage } = useApp();
  const isEn = appLanguage === 'en';

  const tabs = [
    { label: isEn ? 'Home' : 'Accueil', to: '/', icon: HomeIcon },
    { label: isEn ? 'Discover' : 'Découvrir', to: '/discover', icon: LibraryIcon },
    { label: isEn ? 'Library' : 'Bibliothèque', to: '/library', icon: BookmarkIcon },
    { label: isEn ? 'Profile' : 'Profil', to: '/profile', icon: ProfileIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-surface/95 backdrop-blur-md border-t border-surface-line px-4 py-2 flex justify-around items-center md:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 transition-colors py-1 ${
                isActive ? 'text-gold font-bold' : 'text-taupe hover:text-ink'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-wider">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
