import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import {
  BellIcon,
  SparklesIcon,
  CrownIcon,
  FlameIcon,
  InfoIcon,
  MegaphoneIcon,
  CheckIcon
} from '../ui/Icons.jsx';

export default function AnnouncementModal() {
  const { globalConfig, appLanguage } = useApp();
  const isEn = appLanguage === 'en';
  const announcement = globalConfig?.activeAnnouncement || {};

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (announcement.active && announcement.message) {
      const dismissedId = sessionStorage.getItem('koko_dismissed_announcement_id');
      const currentId = announcement.id || announcement.message;
      if (dismissedId !== currentId) {
        setIsOpen(true);
      }
    } else {
      setIsOpen(false);
    }
  }, [announcement]);

  const handleDismiss = () => {
    const currentId = announcement.id || announcement.message;
    if (currentId) {
      sessionStorage.setItem('koko_dismissed_announcement_id', currentId);
    }
    setIsOpen(false);
  };

  if (!isOpen || !announcement.active || !announcement.message) {
    return null;
  }

  const getBadgeStyle = () => {
    switch (announcement.badge) {
      case 'Important':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Offre':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gold/20 text-deep-2 border-gold/40';
    }
  };

  const renderIcon = () => {
    switch (announcement.icon) {
      case 'Sparkles':
        return <SparklesIcon className="w-7 h-7 text-gold animate-pulse" />;
      case 'Crown':
        return <CrownIcon className="w-7 h-7 text-purple-700 animate-bounce" />;
      case 'Flame':
        return <FlameIcon className="w-7 h-7 text-amber-600 animate-bounce" />;
      case 'Megaphone':
        return <MegaphoneIcon className="w-7 h-7 text-deep" />;
      default:
        return <BellIcon className="w-7 h-7 text-gold" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border-2 border-gold/40 rounded-3xl p-6 shadow-2xl max-w-sm w-full space-y-5 text-center relative overflow-hidden transform transition-all scale-100">
        
        {/* Top Decorative Glow Background */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-gold/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* SVG Header Icon Badge */}
        <div className="relative mx-auto w-16 h-16 rounded-3xl bg-gradient-to-br from-paper to-gold/20 border border-gold/40 flex items-center justify-center shadow-md">
          {renderIcon()}
        </div>

        {/* Category Badge */}
        <div className="inline-block">
          <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${getBadgeStyle()}`}>
            {announcement.badge || 'Annonce Officielle'}
          </span>
        </div>

        {/* Title & Message Content */}
        <div className="space-y-2">
          {announcement.title && (
            <h3 className="font-display font-bold text-[20px] text-ink leading-tight">
              {announcement.title}
            </h3>
          )}
          <p className="text-[13px] text-taupe leading-relaxed whitespace-pre-line px-1">
            {announcement.message}
          </p>
        </div>

        {/* CTA Button & Dismiss Action */}
        <div className="space-y-2.5 pt-2">
          {announcement.ctaLink && (
            <a
              href={announcement.ctaLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleDismiss}
              className="w-full py-3 px-4 rounded-2xl bg-gold text-deep-2 font-bold text-[13px] shadow-md hover:brightness-105 transition-all flex items-center justify-center gap-2"
            >
              <span>{announcement.ctaText || (isEn ? 'Learn More' : 'En savoir plus')}</span>
            </a>
          )}

          <button
            onClick={handleDismiss}
            className="w-full py-2.5 px-4 rounded-2xl bg-paper border border-surface-line text-ink font-bold text-[12.5px] hover:bg-white transition-all flex items-center justify-center gap-1.5"
          >
            <CheckIcon className="w-4 h-4 text-emerald-600" />
            <span>{isEn ? 'Got it' : 'Compris'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
