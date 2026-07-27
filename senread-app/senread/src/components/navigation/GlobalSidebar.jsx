import React from 'react';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import {
  HomeIcon,
  LibraryIcon,
  PenToolIcon,
  SparklesIcon,
  MessageSquareIcon,
  ProfileIcon,
  SettingsIcon,
  CrownIcon,
  CoinIcon,
  StarIcon,
  GlobeIcon,
  LogOutIcon,
  MegaphoneIcon,
  ShieldIcon,
  ServerIcon,
  BarChartIcon,
  UsersIcon,
  BookOpenIcon,
} from '../ui/Icons.jsx';

export default function GlobalSidebar() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const {
    userProfile,
    isLoggedIn,
    appLanguage,
    changeAppLanguage,
    logoutUser,
    globalConfig,
    isCreatorStudioPublic,
    toggleCreatorStudioPublic,
  } = useApp();

  const isEn = appLanguage === 'en';
  const isAdmin = userProfile?.role === 'admin' || userProfile?.phone === '785423833' || localStorage.getItem('koko_admin_unlocked') === 'true';
  const isAdminRoute = pathname.startsWith('/admin');

  // Standard Reader Navigation Menu
  const readerNavItems = [
    { to: '/', label: isEn ? 'Home & Discover' : 'Accueil', icon: HomeIcon },
    { to: '/library', label: isEn ? 'My Library' : 'Bibliothèque', icon: LibraryIcon },
    { to: '/publish', label: isEn ? 'Author Studio' : 'Studio Auteur', icon: PenToolIcon },
    { to: '/ranking', label: isEn ? 'Rankings & Top' : 'Lectures Phares', icon: SparklesIcon },
    { to: '/forum', label: isEn ? 'Community Forum' : 'Forum Koko', icon: MessageSquareIcon },
    { to: '/profile', label: isEn ? 'My Profile' : 'Mon Profil', icon: ProfileIcon },
  ];

  // Admin Console Navigation Menu Items
  const currentTab = searchParams.get('tab') || 'config';
  const adminNavItems = [
    { tab: 'config', label: 'Paramètres Global', icon: SettingsIcon },
    { tab: 'announcements', label: 'Annonces Popups', icon: MegaphoneIcon, badge: globalConfig?.activeAnnouncement?.active },
    { tab: 'analytics', label: 'Tableau de Bord', icon: BarChartIcon },
    { tab: 'rankings', label: 'Lectures Phares', icon: SparklesIcon },
    { tab: 'manage', label: 'Catalogue Romans', icon: BookOpenIcon },
    { tab: 'users', label: 'Gestion Utilisateurs', icon: UsersIcon },
    { tab: 'moderation', label: 'Modération', icon: ShieldIcon },
    { tab: 'system', label: 'Système & Flags', icon: ServerIcon },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 flex-shrink-0 bg-white border-r border-surface-line min-h-screen sticky top-0 h-screen p-4 justify-between z-40 shadow-sm">
      <div className="space-y-5 overflow-y-auto no-scrollbar">
        
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-3 border-b border-surface-line">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-105 ${
              isAdminRoute ? 'bg-purple-800 text-white' : 'bg-gradient-to-br from-gold to-deep text-paper'
            }`}>
              {isAdminRoute ? <StarIcon className="w-5 h-5 text-white" /> : <SparklesIcon className="w-5 h-5 text-deep-2 animate-pulse" />}
            </div>
            <div>
              <span className="font-display font-black text-[17px] text-ink tracking-tight block leading-none">
                {isAdminRoute ? 'Console Admin' : 'KOKO'}
              </span>
              <span className="text-[9.5px] font-bold uppercase tracking-widest text-gold block mt-0.5">
                {isAdminRoute ? '785423833 · Master' : 'Stories & Audio'}
              </span>
            </div>
          </NavLink>

          {/* Language Switcher */}
          <button
            onClick={() => changeAppLanguage(appLanguage === 'fr' ? 'en' : 'fr')}
            className="px-2 py-1 rounded-xl bg-paper border border-surface-line text-[10.5px] font-extrabold text-ink flex items-center gap-1 hover:border-gold transition-colors"
            title="Changer de langue"
          >
            <GlobeIcon className="w-3.5 h-3.5 text-gold" />
            <span>{appLanguage.toUpperCase()}</span>
          </button>
        </div>

        {/* ADMIN MODE SIDEBAR NAVIGATION */}
        {isAdminRoute ? (
          <nav className="space-y-1.5">
            <div className="flex items-center justify-between px-2 mb-1">
              <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-purple-800 block">
                Modules d'Administration
              </span>
              <span className="text-[9px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                Admin Active
              </span>
            </div>

            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.tab;

              return (
                <NavLink
                  key={item.tab}
                  to={`/admin?tab=${item.tab}`}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-[12.5px] font-bold transition-all ${
                    isActive
                      ? 'bg-purple-800 text-white shadow-md scale-[1.02]'
                      : 'text-ink hover:bg-purple-50 hover:text-purple-900 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-purple-700'}`} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping flex-shrink-0" />
                  )}
                </NavLink>
              );
            })}

            {/* Quick Switch back to Reader Mode */}
            <div className="pt-3">
              <NavLink
                to="/"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-paper border border-surface-line text-ink font-bold text-[12px] hover:bg-white transition-all"
              >
                <HomeIcon className="w-4 h-4 text-gold" />
                <span>Quitter Mode Admin</span>
              </NavLink>
            </div>
          </nav>
        ) : (
          /* STANDARD READER SIDEBAR NAVIGATION */
          <nav className="space-y-1.5">
            <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-taupe px-3 block mb-1">
              Menu Navigation
            </span>

            {readerNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.to || (item.to !== '/' && pathname.startsWith(item.to));

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[13px] font-bold transition-all ${
                    isActive
                      ? 'bg-gold text-deep-2 shadow-sm scale-[1.02]'
                      : 'text-ink hover:bg-paper border border-transparent hover:border-surface-line'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-deep-2' : 'text-gold'}`} />
                  <span className="flex-1">{item.label}</span>
                </NavLink>
              );
            })}

            {/* Admin Console Entry Button */}
            {isAdmin && (
              <NavLink
                to="/admin?tab=config"
                className="flex items-center gap-3 px-3.5 py-3 rounded-2xl text-[13px] font-bold transition-all mt-3 bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100 shadow-sm"
              >
                <SettingsIcon className="w-4 h-4 flex-shrink-0 text-purple-700" />
                <span className="flex-1">Console Admin</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 font-extrabold flex items-center gap-0.5">
                  <StarIcon className="w-3 h-3 text-purple-900" />
                  Master
                </span>
              </NavLink>
            )}
          </nav>
        )}

        {/* Master Studio Public Switch */}
        {isAdminRoute && (
          <div className="bg-paper p-3 rounded-2xl border border-surface-line space-y-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-bold text-ink">Écriture Publique</span>
              <button
                onClick={toggleCreatorStudioPublic}
                className={`w-10 h-5 rounded-full transition-all relative border flex-shrink-0 ${
                  isCreatorStudioPublic ? 'bg-emerald-600 border-emerald-700' : 'bg-zinc-300 border-zinc-400'
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                  isCreatorStudioPublic ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>
            <span className="text-[9.5px] text-taupe block leading-tight">
              {isCreatorStudioPublic ? 'Ouvert à tous' : 'Auteur & Admin seul'}
            </span>
          </div>
        )}
      </div>

      {/* User Profile Footer Card */}
      <div className="pt-3 border-t border-surface-line space-y-3">
        {isLoggedIn ? (
          <div className="bg-paper p-3 rounded-2xl border border-surface-line space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-gold/20 text-deep flex items-center justify-center font-bold text-[12px] flex-shrink-0">
                  {userProfile?.name?.charAt(0) || 'A'}
                </div>
                <div className="truncate">
                  <span className="font-display font-bold text-[12.5px] text-ink block truncate">
                    {userProfile?.name || 'Administrateur'}
                  </span>
                  <span className="text-[9.5px] text-purple-700 font-extrabold block font-mono">
                    {userProfile?.phone || '785423833'}
                  </span>
                </div>
              </div>

              <button
                onClick={logoutUser}
                className="p-1.5 rounded-xl text-taupe hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Déconnexion"
              >
                <LogOutIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <NavLink
            to="/profile"
            className="w-full py-2.5 px-3 rounded-2xl bg-deep text-paper text-[12px] font-bold text-center block shadow-sm hover:opacity-90 transition-all"
          >
            {isEn ? 'Sign In / Register' : 'Se Connecter'}
          </NavLink>
        )}
      </div>
    </aside>
  );
}
