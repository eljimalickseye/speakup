import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.jsx';
import {
  BellIcon,
  BookOpenIcon,
  MessageSquareIcon,
  CoinIcon,
  SparklesIcon,
  CheckIcon,
} from '../ui/Icons.jsx';

export default function NotificationDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, appLanguage } = useApp();
  const isEn = appLanguage === 'en';

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (item) => {
    markNotificationAsRead(item.id);
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'CHAPTER':
        return <BookOpenIcon className="w-4.5 h-4.5 text-gold" />;
      case 'FORUM':
        return <MessageSquareIcon className="w-4.5 h-4.5 text-sky-500" />;
      case 'COINS':
        return <CoinIcon className="w-4.5 h-4.5 text-amber-500" />;
      default:
        return <SparklesIcon className="w-4.5 h-4.5 text-gold" />;
    }
  };

  return (
    <>
      {/* Floating Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title={isEn ? 'Notifications' : 'Notifications'}
        className="fixed top-14 sm:top-4 right-14 sm:right-16 z-40 w-9 h-9 rounded-full bg-deep text-gold shadow-xl border border-gold/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all relative"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 14px)' }}
      >
        <BellIcon className="w-4.5 h-4.5 text-gold" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white font-mono font-bold text-[9.5px] flex items-center justify-center border border-white shadow-sm animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Drawer Sheet Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-3 pb-20 sm:pb-6 animate-fadeIn pointer-events-auto"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#1F1F1F] text-white rounded-3xl p-5 relative shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-3.5 border border-white/15 animate-fadeIn text-left max-h-[75vh] flex flex-col pointer-events-auto mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-2.5 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <BellIcon className="w-4.5 h-4.5 text-gold" />
                <h3 className="font-display font-bold text-[16px] text-white">
                  {isEn ? `Notifications (${unreadCount})` : `Notifications (${unreadCount})`}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[11px] font-bold text-gold hover:underline flex items-center gap-1"
                  >
                    <CheckIcon className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Mark all read' : 'Tout lire'}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white font-bold text-[14px]"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-2 overflow-y-auto max-h-[55vh] pr-1 pb-4 flex-1 touch-auto pointer-events-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-white/60 space-y-2">
                  <BellIcon className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-[12.5px]">{isEn ? 'No notifications yet' : 'Aucune notification pour le moment'}</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 group active:scale-98 relative ${
                      n.read
                        ? 'bg-white/5 border-white/5 opacity-70'
                        : 'bg-gold/10 border-gold/40 shadow-sm ring-1 ring-gold/20'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/10">
                      {getIconForType(n.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <h4 className="font-display font-bold text-[13px] text-white group-hover:text-gold transition-colors truncate">
                          {isEn ? n.titleEn || n.title : n.title}
                        </h4>
                        <span className="text-[9.5px] text-white/50 font-mono ml-2 flex-shrink-0">
                          {isEn ? n.timeEn || n.time : n.time}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-white/80 leading-snug">
                        {isEn ? n.messageEn || n.message : n.message}
                      </p>
                    </div>

                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-gold flex-shrink-0 mt-2" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
