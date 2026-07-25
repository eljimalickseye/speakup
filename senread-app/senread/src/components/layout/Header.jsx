import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import { BellIcon, CoinIcon } from '../ui/Icons.jsx';

export default function Header() {
  const { userProfile, notifications } = useApp();
  const navigate = useNavigate();

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur-md border-b border-surface-line/80 px-5 pt-8 pb-3 sm:pt-4 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand Koko Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.png"
            alt="Koko Logo"
            className="w-9 h-9 rounded-xl object-cover shadow-sm border border-gold/40 group-hover:scale-105 transition-transform"
          />
          <div>
            <span className="font-display font-bold text-[18px] tracking-tight text-ink group-hover:text-gold transition-colors block leading-none">
              Koko
            </span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-taupe block">Romans & Anglais</span>
          </div>
        </Link>

        {/* Top Header Actions (Coins & Notifications) */}
        <div className="flex items-center gap-2">
          {/* User Solde Coins */}
          <Link
            to="/profile"
            className="flex items-center gap-1 bg-gold/10 hover:bg-gold/20 text-gold px-2.5 py-1 rounded-full border border-gold/30 text-[11px] font-bold transition-all"
          >
            <span>{userProfile.coins || 0}</span>
            <CoinIcon className="w-3.5 h-3.5 text-gold" />
          </Link>

          {/* Notifications Bell */}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-full bg-surface hover:bg-surface-line text-ink transition-all border border-surface-line"
            aria-label="Notifications"
          >
            <BellIcon className="w-4 h-4 text-ink" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-red-600 border-2 border-paper" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
