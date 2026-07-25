import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { StarIcon, CheckIcon, SparklesIcon } from '../ui/Icons.jsx';

export default function SubscriptionModal({ isOpen, onClose }) {
  const { setUserProfile } = useApp();
  const [subscribedPlan, setSubscribedPlan] = useState(null);

  if (!isOpen) return null;

  const plans = [
    { id: 'basic', name: 'Basic Reader', price: '$4.99 / mo', desc: 'Unlimited access to all A1 & A2 stories', popular: false },
    { id: 'premium', name: 'Premium VIP', price: '$9.99 / mo', desc: 'Unlimited access to ALL B1/B2 stories + Voice Audio Narration', popular: true },
    { id: 'annual', name: 'Annual Pass', price: '$49.00 / yr', desc: 'Save 60% — Complete unlimited access for 1 full year', popular: false },
  ];

  const handleSubscribe = (plan) => {
    setUserProfile((prev) => ({ ...prev, isVip: true }));
    setSubscribedPlan(plan);
    setTimeout(() => {
      setSubscribedPlan(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-paper border border-surface-line rounded-t-3xl sm:rounded-3xl p-6 relative shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-surface-line">
          <div className="flex items-center gap-2 font-display font-semibold text-[16px] text-ink">
            <StarIcon className="w-5 h-5 text-gold" />
            <span>Koko VIP Membership</span>
          </div>
          <button onClick={onClose} className="text-taupe text-lg font-bold hover:text-ink">
            ×
          </button>
        </div>

        {subscribedPlan ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-gold/20 text-gold flex items-center justify-center mx-auto mb-2 border border-gold/40">
              <CheckIcon className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-[18px] text-ink">Subscribed to {subscribedPlan.name}!</h3>
            <p className="text-[12px] text-taupe">Enjoy unlimited bilingual reading and audio narration.</p>
          </div>
        ) : (
          <>
            <p className="text-[12px] text-taupe">
              Unlock unlimited reading across all bilingual webtoon novels with Koko VIP:
            </p>

            <div className="space-y-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-gold/15 to-white border-gold shadow-md relative'
                      : 'bg-white border-surface-line'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 right-4 bg-gold text-paper text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <SparklesIcon className="w-2.5 h-2.5" /> Most Popular
                    </span>
                  )}
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-display font-bold text-[15px] text-ink">{plan.name}</h4>
                    <span className="font-bold text-[14px] text-gold">{plan.price}</span>
                  </div>
                  <p className="text-[11.5px] text-taupe mb-3">{plan.desc}</p>
                  <button
                    onClick={() => handleSubscribe(plan)}
                    className="w-full bg-deep text-paper py-2.5 rounded-xl font-bold text-[12.5px] hover:bg-deep-2 shadow-sm"
                  >
                    Subscribe Now
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
