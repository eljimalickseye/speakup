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
    { key: 'dark', label: 'Nuit Émeraude', bg: '#0C2320', text: '#F3F7F5' },
    { key: 'night', label: 'Nuit Profonde', bg: '#121212', text: '#F3F7F5' },
    { key: 'cream', label: 'Crème Doux', bg: '#FAF8F5', text: '#1A1816' },
    { key: 'sepia', label: 'Sépia Chaud', bg: '#F6EFE6', text: '#1A1816' },
  ];

  const fonts = [
    { key: "'Newsreader', serif", label: 'Littéraire (Newsreader)' },
    { key: "'Plus Jakarta Sans', sans-serif", label: 'Moderne (Jakarta)' },
    { key: "'Playfair Display', serif", label: 'Classique (Playfair)' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-paper border border-surface-line rounded-t-3xl sm:rounded-3xl p-5 w-full max-w-md text-left relative shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b border-surface-line pb-3">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-gold" />
            <h3 className="font-display font-bold text-[16px] text-ink">Préférences de Lecture</h3>
          </div>
          <button onClick={onClose} className="text-taupe text-lg font-bold hover:text-ink">
            ×
          </button>
        </div>

        {/* Reading Layout Mode: Scroll vs Book Page Flip ("Mode Feuilleter") */}
        <div>
          <label className="block text-[10.5px] font-bold text-taupe uppercase tracking-wider mb-2">
            Mode d'Affichage du Livre
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onUpdatePreferences({ mode: 'scroll' })}
              className={`p-3 rounded-xl border text-[12px] font-bold flex items-center justify-center gap-2 transition-all ${
                preferences.mode !== 'flip'
                  ? 'bg-deep text-paper border-deep shadow-sm'
                  : 'bg-white border-surface-line text-taupe'
              }`}
            >
              <span>Défilement Continu</span>
            </button>

            <button
              onClick={() => onUpdatePreferences({ mode: 'flip' })}
              className={`p-3 rounded-xl border text-[12px] font-bold flex items-center justify-center gap-2 transition-all ${
                preferences.mode === 'flip'
                  ? 'bg-gold text-paper border-gold shadow-sm'
                  : 'bg-white border-surface-line text-taupe'
              }`}
            >
              <span>Mode Feuilleter (Page Flip)</span>
            </button>
          </div>
        </div>

        {/* Theme Picker */}
        <div>
          <label className="block text-[10.5px] font-bold text-taupe uppercase tracking-wider mb-2">
            Thème Visuel du Livre
          </label>
          <div className="grid grid-cols-2 gap-2">
            {themes.map((t) => (
              <button
                key={t.key}
                onClick={() => onUpdatePreferences({ theme: t.key, bg: t.bg, text: t.text })}
                style={{ backgroundColor: t.bg, color: t.text }}
                className={`p-3 rounded-xl border text-left text-[12px] font-bold flex items-center justify-between transition-all ${
                  preferences.theme === t.key ? 'ring-2 ring-gold border-gold' : 'border-surface-line'
                }`}
              >
                <span>{t.label}</span>
                {preferences.theme === t.key && <CheckIcon className="w-4 h-4 text-gold" />}
              </button>
            ))}
          </div>
        </div>

        {/* Typography Picker */}
        <div>
          <label className="block text-[10.5px] font-bold text-taupe uppercase tracking-wider mb-2">
            Police de Caractères
          </label>
          <div className="space-y-1.5">
            {fonts.map((f) => (
              <button
                key={f.key}
                onClick={() => onUpdatePreferences({ font: f.key })}
                style={{ fontFamily: f.key }}
                className={`w-full p-2.5 rounded-xl border text-left text-[13px] transition-all flex items-center justify-between ${
                  preferences.font === f.key ? 'bg-gold/15 border-gold font-bold text-ink' : 'bg-white border-surface-line text-taupe'
                }`}
              >
                <span>{f.label}</span>
                {preferences.font === f.key && <CheckIcon className="w-4 h-4 text-gold" />}
              </button>
            ))}
          </div>
        </div>

        {/* Font Size Adjuster */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10.5px] font-bold text-taupe uppercase tracking-wider">
              Taille du Texte ({preferences.fontSize}px)
            </label>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-surface-line">
            <span className="text-[11px] font-bold text-taupe">A</span>
            <input
              type="range"
              min={14}
              max={24}
              value={preferences.fontSize}
              onChange={(e) => onUpdatePreferences({ fontSize: Number(e.target.value) })}
              className="w-full accent-gold cursor-pointer"
            />
            <span className="text-[16px] font-bold text-ink">A</span>
          </div>
        </div>
      </div>
    </div>
  );
}
