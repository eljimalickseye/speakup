import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import {
  InfoIcon,
  SparklesIcon,
  BookmarkIcon,
  BookOpenIcon,
  PlusIcon,
  CheckIcon,
} from '../ui/Icons.jsx';

export default function InteractiveAppGuide() {
  const { appLanguage } = useApp();
  const isEn = appLanguage === 'en';

  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('koko_guide_dismissed') === 'true';
  });

  const steps = [
    {
      step: 1,
      title: isEn ? 'Welcome to Koko' : 'Bienvenue sur Koko',
      subtitle: isEn ? 'Bilingual Stories & English Learning' : 'Histoires Bilingues & Apprentissage de l’Anglais',
      icon: SparklesIcon,
      content: (
        <div className="space-y-3 text-center">
          <img
            src="/logo.png"
            alt="Koko Logo"
            className="w-16 h-16 rounded-full mx-auto shadow-md border-2 border-gold/40 object-cover"
          />
          <h4 className="font-display font-bold text-[16px] text-ink">
            Koko — {isEn ? 'Bilingual Immersion' : 'Immersion Bilingue'}
          </h4>
          <p className="text-[12.5px] text-taupe leading-relaxed max-w-xs mx-auto">
            {isEn
              ? 'Read captivating bilingual novels with parallel English & French translation. Tap any word to view instant definitions and save to your notebook!'
              : 'Lisez des romans bilingues captivants avec traduction parallèle Anglais & Français. Touchez n’importe quel mot pour voir sa définition instantanée et l’enregistrer !'}
          </p>
        </div>
      ),
    },
    {
      step: 2,
      title: isEn ? 'Instant Vocabulary Saving' : 'Ajout Ultra-Rapide de Mots',
      subtitle: isEn ? 'Build your personal dictionary' : 'Enrichissez votre carnet de mots',
      icon: BookmarkIcon,
      content: (
        <div className="space-y-3 text-left">
          <div className="bg-paper p-3.5 rounded-2xl border border-surface-line space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 font-bold text-[12.5px]">
              <CheckIcon className="w-4 h-4" />
              <span>{isEn ? 'Fast 1-Tap Save' : 'Sauvegarde en 1 Touche'}</span>
            </div>
            <p className="text-[12px] text-taupe leading-relaxed">
              {isEn
                ? 'During reading, tap any highlighted word to view its definition. Tap "+ Save to Notebook" to immediately store it in your Library vocabulary collection.'
                : 'Pendant la lecture, touchez un mot surligné pour afficher sa définition. Cliquez sur "+ Enregistrer" pour l’ajouter instantanément à votre carnet personnel dans la Bibliothèque.'}
            </p>
          </div>
          <p className="text-[11.5px] text-gold font-semibold text-center italic">
            ⚡ {isEn ? 'Fast, zero latency, offline saving.' : 'Fluide, rapide et fonctionnel même hors-ligne.'}
          </p>
        </div>
      ),
    },
    {
      step: 3,
      title: isEn ? 'Customizable Quick Shortcuts' : 'Menu & Raccourcis Personnalisés',
      subtitle: isEn ? 'Fast navigation & multi-page drawer' : 'Ajoutez des raccourcis & naviguez',
      icon: PlusIcon,
      content: (
        <div className="space-y-3 text-left">
          <div className="bg-paper p-3.5 rounded-2xl border border-surface-line space-y-2">
            <h4 className="font-bold text-[13px] text-ink">
              {isEn ? 'Customize Your Menu' : 'Personnalisez vos Raccourcis'}
            </h4>
            <p className="text-[12px] text-taupe leading-relaxed">
              {isEn
                ? 'Tap the top-right Sparkles icon anytime to open the Quick Shortcuts Drawer. You can add your own custom links & navigate across multiple shortcut pages!'
                : 'Cliquez sur l’icône d’étincelle en haut à droite pour ouvrir le Menu Raccourcis. Vous pouvez y ajouter vos propres liens personnalisés et naviguer entre les pages du modal !'}
            </p>
          </div>
        </div>
      ),
    },
    {
      step: 4,
      title: isEn ? 'Ready to Explore!' : 'Prêt à Découvrir Koko !',
      subtitle: isEn ? 'Start your reading streak today' : 'Commencez votre première lecture',
      icon: BookOpenIcon,
      content: (
        <div className="space-y-4 text-center">
          <div className="w-14 h-14 rounded-full bg-gold/15 text-gold flex items-center justify-center mx-auto border border-gold/40">
            <SparklesIcon className="w-7 h-7 text-gold" />
          </div>
          <h4 className="font-display font-bold text-[16px] text-ink">
            {isEn ? 'Enjoy Koko Stories!' : 'Profitez pleinement de Koko !'}
          </h4>
          <p className="text-[12.5px] text-taupe max-w-xs mx-auto">
            {isEn
              ? 'You can reopen this guide anytime by tapping the floating Info button.'
              : 'Vous pourrez rouvrir ce guide à tout moment en cliquant sur le bouton Info flottant.'}
          </p>
        </div>
      ),
    },
  ];

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('koko_guide_dismissed', 'true');
    setIsOpen(false);
  };

  const handleNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleDismiss();
    }
  };

  const currentStepData = steps[currentStep - 1];

  return (
    <>
      {/* Floating Info Button at Bottom-Right */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          setCurrentStep(1);
        }}
        title={isEn ? 'Koko User Guide & Tutorial' : 'Guide d\'utilisation Koko'}
        className="fixed bottom-20 right-4 z-40 w-10 h-10 rounded-full bg-gold text-deep shadow-2xl border-2 border-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all pointer-events-auto"
      >
        <InfoIcon className="w-5 h-5 text-deep" />
      </button>

      {/* Guide Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn pointer-events-auto">
          <div className="bg-white border border-surface-line rounded-3xl p-5 w-full max-w-sm text-left relative shadow-2xl space-y-4 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-surface-line pb-3">
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Koko" className="w-7 h-7 rounded-full object-cover border border-gold/40" />
                <div>
                  <h3 className="font-display font-bold text-[15px] text-ink leading-tight">
                    {currentStepData.title}
                  </h3>
                  <span className="text-[10px] text-taupe block font-semibold">{currentStepData.subtitle}</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-paper flex items-center justify-center text-taupe hover:text-ink font-bold text-[14px]"
              >
                ×
              </button>
            </div>

            {/* Step Content */}
            <div className="py-2">
              {currentStepData.content}
            </div>

            {/* Step Indicators */}
            <div className="flex justify-center items-center gap-1.5 pt-1">
              {steps.map((s) => (
                <span
                  key={s.step}
                  className={`h-1.5 rounded-full transition-all ${
                    s.step === currentStep ? 'w-6 bg-gold' : 'w-1.5 bg-surface-line'
                  }`}
                />
              ))}
            </div>

            {/* Footer Navigation Buttons */}
            <div className="flex gap-2 pt-2 border-t border-surface-line">
              <button
                type="button"
                onClick={handleDismiss}
                className="flex-1 bg-surface text-taupe py-2.5 rounded-xl font-bold text-[11.5px] hover:text-ink transition-colors"
              >
                {isEn ? 'Dismiss Guide' : 'Compris / Masquer'}
              </button>

              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 bg-deep text-paper py-2.5 rounded-xl font-bold text-[12px] shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-1"
              >
                <span>{currentStep === steps.length ? (isEn ? 'Finish' : 'Terminer') : (isEn ? 'Next' : 'Suivant →')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
