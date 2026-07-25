import { Link, useLocation } from 'react-router-dom';

export default function TopLogoHeader() {
  const { pathname } = useLocation();
  const isReader = pathname.includes('/read/');

  if (isReader) return null;

  return (
    <Link
      to="/"
      title="Koko Home"
      className="fixed top-14 sm:top-4 left-3.5 sm:left-4 z-40 flex items-center gap-2 group pointer-events-auto md:hidden"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}
    >
      <img
        src="/logo.png"
        alt="Koko Logo"
        className="w-9 h-9 rounded-full object-cover shadow-xl border border-gold/40 group-hover:scale-105 transition-all"
      />
      <span className="font-display font-black text-[16px] text-ink group-hover:text-gold transition-colors hidden xs:inline-block leading-none">
        Koko
      </span>
    </Link>
  );
}
