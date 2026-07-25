import { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { FlameIcon, CrownIcon, MedalIcon, CoinIcon } from '../components/ui/Icons.jsx';

export default function Ranking() {
  const { usersList, userProfile, isLoggedIn } = useApp();
  const [filterMode, setFilterMode] = useState('coins'); // 'coins' | 'streak'

  // Combine registered users and current user dynamically
  const allUsers = [...usersList];
  if (isLoggedIn && !allUsers.some((u) => u.id === userProfile.id || u.email === userProfile.email)) {
    allUsers.push(userProfile);
  }

  // Sort dynamically
  const sortedList = [...allUsers].sort((a, b) => {
    if (filterMode === 'coins') {
      return (b.coins || 0) - (a.coins || 0);
    }
    return (b.streak || 0) - (a.streak || 0);
  });

  const top3 = sortedList.slice(0, 3);

  return (
    <div className="px-5 pt-5 pb-6 text-ink space-y-5 animate-fadeIn">
      {/* Clean Filter Tabs (Top Title removed for clean minimalist header) */}
      <div className="flex border-b border-surface-line w-full pt-1">
        <button
          onClick={() => setFilterMode('coins')}
          className={`flex-1 py-2.5 text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-all ${
            filterMode === 'coins' ? 'text-ink border-b-2 border-gold font-extrabold' : 'text-taupe'
          }`}
        >
          <CoinIcon className="w-4 h-4 text-gold" />
          <span>Classement Coins</span>
        </button>
        <button
          onClick={() => setFilterMode('streak')}
          className={`flex-1 py-2.5 text-[12.5px] font-bold flex items-center justify-center gap-1.5 transition-all ${
            filterMode === 'streak' ? 'text-ink border-b-2 border-gold font-extrabold' : 'text-taupe'
          }`}
        >
          <FlameIcon className="w-4 h-4 text-orange-500" />
          <span>Série de Lecture</span>
        </button>
      </div>

      {/* Top 3 Podium */}
      {sortedList.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 items-end pt-3 mb-4">
          {/* 2nd Place */}
          {top3[1] ? (
            <div className="bg-white border border-surface-line rounded-2xl p-3 text-center shadow-sm relative">
              <MedalIcon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
              <span className="text-[9.5px] font-bold text-taupe uppercase tracking-wider block mb-1">2ème Place</span>
              <div className="w-10 h-10 rounded-full bg-surface text-ink font-bold text-[14px] flex items-center justify-center mx-auto mb-1.5 border border-surface-line shadow-inner">
                {top3[1].name?.charAt(0)}
              </div>
              <p className="font-display font-semibold text-[12px] truncate">{top3[1].name}</p>
              <p className="text-[10.5px] text-gold font-bold">
                {filterMode === 'coins' ? `${top3[1].coins || 0} Coins` : `${top3[1].streak || 0} Jours`}
              </p>
            </div>
          ) : <div />}

          {/* 1st Place (Center Gold) */}
          {top3[0] && (
            <div className="bg-gradient-to-b from-paper to-white border-2 border-gold rounded-2xl p-4 text-center shadow-md relative -translate-y-2">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm whitespace-nowrap">
                <CrownIcon className="w-3 h-3 text-white" />
                Champion
              </span>
              <div className="w-12 h-12 rounded-full bg-gold text-paper font-bold text-[16px] flex items-center justify-center mx-auto mb-1.5 shadow-sm border-2 border-white">
                {top3[0].name?.charAt(0)}
              </div>
              <p className="font-display font-bold text-[13px] truncate">{top3[0].name}</p>
              <p className="text-[11.5px] text-gold font-extrabold">
                {filterMode === 'coins' ? `${top3[0].coins || 0} Coins` : `${top3[0].streak || 0} Jours`}
              </p>
            </div>
          )}

          {/* 3rd Place */}
          {top3[2] ? (
            <div className="bg-white border border-surface-line rounded-2xl p-3 text-center shadow-sm relative">
              <MedalIcon className="w-4 h-4 text-amber-700 mx-auto mb-1" />
              <span className="text-[9.5px] font-bold text-taupe uppercase tracking-wider block mb-1">3ème Place</span>
              <div className="w-10 h-10 rounded-full bg-surface text-ink font-bold text-[14px] flex items-center justify-center mx-auto mb-1.5 border border-surface-line shadow-inner">
                {top3[2].name?.charAt(0)}
              </div>
              <p className="font-display font-semibold text-[12px] truncate">{top3[2].name}</p>
              <p className="text-[10.5px] text-gold font-bold">
                {filterMode === 'coins' ? `${top3[2].coins || 0} Coins` : `${top3[2].streak || 0} Jours`}
              </p>
            </div>
          ) : <div />}
        </div>
      )}

      {/* Ranked Table #4 onwards */}
      <div className="space-y-2">
        <h3 className="text-[11px] font-bold text-taupe uppercase tracking-wider text-left">Toutes les Positions</h3>

        {sortedList.map((item, idx) => {
          const isCurrentUser = userProfile?.id === item.id || userProfile?.email === item.email;
          return (
            <div
              key={item.id || idx}
              className={`flex items-center justify-between border rounded-2xl px-4 py-3 transition-all ${
                isCurrentUser
                  ? 'bg-gold/10 border-gold shadow-sm font-bold'
                  : 'bg-white border-surface-line'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-display font-bold text-[13px] text-taupe w-5 text-left">#{idx + 1}</span>
                <div className="w-9 h-9 rounded-full bg-paper text-ink font-bold text-[13px] flex items-center justify-center border border-surface-line flex-shrink-0">
                  {item.name?.charAt(0)}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="font-display font-semibold text-[13.5px] text-ink">{item.name}</p>
                    {isCurrentUser && (
                      <span className="text-[9px] font-bold bg-gold text-paper px-1.5 py-0.2 rounded-full">
                        Vous
                      </span>
                    )}
                  </div>
                  <p className="text-[10.5px] text-taupe">{item.role === 'admin' ? 'Administrateur' : item.role === 'author' ? 'Écrivaine' : 'Lecteur Koko'}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[12.5px] font-bold text-gold">
                  {filterMode === 'coins' ? `${item.coins || 0} Coins` : `${item.streak || 0} Jours`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
