import React from 'react';
import { SettingsIcon, CheckIcon } from '../ui/Icons.jsx';

export default function ReadingPreferencesModal({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
}) {
  if (!isOpen) return null;

  const themes = [
    { key: 'cream',  label: 'Crème Doux',      bg: '#FAF8F5', text: '#1A1816', accent: '#C8A951' },
    { key: 'sepia',  label: 'Sépia Chaud',      bg: '#F6EFE6', text: '#2C2118', accent: '#A0845C' },
    { key: 'dark',   label: 'Nuit Émeraude',    bg: '#0C2320', text: '#F3F7F5', accent: '#4CAF8A' },
    { key: 'night',  label: 'Nuit Profonde',    bg: '#121212', text: '#E8E8E8', accent: '#9E8AE6' },
  ];

  const fonts = [
    { key: "'Newsreader', serif",          label: 'Littéraire',  sample: 'Aa' },
    { key: "'Plus Jakarta Sans', sans-serif", label: 'Moderne',  sample: 'Aa' },
    { key: "'Playfair Display', serif",    label: 'Classique',   sample: 'Aa' },
  ];

  const lineHeights = [
    { value: 1.5, label: 'Compact' },
    { value: 1.75, label: 'Normal' },
    { value: 2.0,  label: 'Aéré' },
  ];

  const isLight = preferences.theme === 'cream' || preferences.theme === 'sepia';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative w-full max-w-md mx-auto rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
        style={{
          backgroundColor: preferences.bg,
          color: preferences.text,
          maxHeight: '90dvh',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div
            className="w-10 h-1 rounded-full opacity-30"
            style={{ backgroundColor: preferences.text }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pt-3 pb-3 border-b flex-shrink-0"
          style={{ borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}
        >
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-4.5 h-4.5" style={{ color: '#C8A951' }} />
            <h3 className="font-bold text-[15px] tracking-tight">Préférences de Lecture</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-opacity hover:opacity-70"
            style={{ backgroundColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)' }}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-5">

          {/* ── Thèmes ── */}
          <section>
            <label className="block text-[10.5px] font-bold uppercase tracking-widest mb-2.5 opacity-50">
              Thème Visuel
            </label>
            <div className="grid grid-cols-2 gap-2">
              {themes.map((t) => {
                const active = preferences.theme === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => onUpdatePreferences({ theme: t.key, bg: t.bg, text: t.text })}
                    style={{
                      backgroundColor: t.bg,
                      color: t.text,
                      borderColor: active ? t.accent : (isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.12)'),
                      boxShadow: active ? `0 0 0 2px ${t.accent}` : 'none',
                    }}
                    className="relative p-3 rounded-xl border-2 text-left text-[12px] font-bold flex items-center justify-between transition-all active:scale-95"
                  >
                    <span>{t.label}</span>
                    {active && (
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: t.accent }}
                      >
                        <CheckIcon className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Police ── */}
          <section>
            <label className="block text-[10.5px] font-bold uppercase tracking-widest mb-2.5 opacity-50">
              Police de Caractères
            </label>
            <div className="space-y-1.5">
              {fonts.map((f) => {
                const active = preferences.font === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => onUpdatePreferences({ font: f.key })}
                    style={{
                      fontFamily: f.key,
                      borderColor: active ? '#C8A951' : (isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)'),
                      backgroundColor: active
                        ? (isLight ? 'rgba(200,169,81,0.12)' : 'rgba(200,169,81,0.18)')
                        : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'),
                    }}
                    className="w-full p-3 rounded-xl border text-left text-[14px] flex items-center justify-between transition-all active:scale-[0.98]"
                  >
                    <span style={{ color: preferences.text }} className={active ? 'font-bold' : 'opacity-70'}>
                      {f.sample} — {f.label}
                    </span>
                    {active && <CheckIcon className="w-4 h-4" style={{ color: '#C8A951' }} />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Taille du Texte ── */}
          <section>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-[10.5px] font-bold uppercase tracking-widest opacity-50">
                Taille du Texte
              </label>
              <span
                className="text-[12px] font-bold px-2 py-0.5 rounded-lg"
                style={{ backgroundColor: isLight ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.1)' }}
              >
                {preferences.fontSize}px
              </span>
            </div>
            <div
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{ borderColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)' }}
            >
              <span className="text-[12px] font-bold opacity-50 w-5 text-center">A</span>
              <input
                type="range"
                min={13}
                max={26}
                step={1}
                value={preferences.fontSize}
                onChange={(e) => onUpdatePreferences({ fontSize: Number(e.target.value) })}
                className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: '#C8A951' }}
              />
              <span className="text-[20px] font-bold opacity-80 w-5 text-center">A</span>
            </div>
          </section>

          {/* ── Interligne ── */}
          <section>
            <label className="block text-[10.5px] font-bold uppercase tracking-widest mb-2.5 opacity-50">
              Interligne
            </label>
            <div className="flex gap-2">
              {lineHeights.map((lh) => {
                const active = preferences.lineHeight === lh.value;
                return (
                  <button
                    key={lh.value}
                    onClick={() => onUpdatePreferences({ lineHeight: lh.value })}
                    style={{
                      borderColor: active ? '#C8A951' : (isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)'),
                      backgroundColor: active
                        ? (isLight ? 'rgba(200,169,81,0.14)' : 'rgba(200,169,81,0.2)')
                        : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'),
                    }}
                    className="flex-1 py-2.5 rounded-xl border text-center text-[11.5px] font-bold transition-all active:scale-95"
                  >
                    <span style={{ color: active ? '#C8A951' : preferences.text }} className={active ? '' : 'opacity-60'}>
                      {lh.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ── Aperçu Texte ── */}
          <section
            className="rounded-xl p-4 border text-[13px] leading-relaxed"
            style={{
              fontFamily: preferences.font,
              fontSize: `${preferences.fontSize}px`,
              lineHeight: preferences.lineHeight,
              borderColor: isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)',
              backgroundColor: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)',
            }}
          >
            <p className="opacity-80">
              Le soleil se levait doucement sur l'océan Atlantique, projetant une lumière dorée et chaleureuse sur le port de Dakar.
            </p>
          </section>
        </div>

        {/* Footer Button */}
        <div
          className="px-5 pt-3 pb-5 flex-shrink-0 border-t"
          style={{ borderColor: isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)' }}
        >
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl font-bold text-[14px] text-center transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#C8A951', color: '#1A1816' }}
          >
            Appliquer et Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
