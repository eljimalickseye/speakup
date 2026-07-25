import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { CoinIcon, CheckIcon, SparklesIcon } from '../ui/Icons.jsx';

export default function CoinPurchaseModal({ isOpen, onClose }) {
  const { addCoins } = useApp();
  const [purchasedPack, setPurchasedPack] = useState(null);

  if (!isOpen) return null;

  const coinPacks = [
    { coins: 10, price: '$0.99', popular: false },
    { coins: 50, price: '$3.99', popular: false },
    { coins: 100, price: '$6.99', popular: true },
    { coins: 500, price: '$24.99', popular: false },
    { coins: 2000, price: '$79.99', popular: false, badge: 'Max Pack 2000 Coins' },
  ];

  const handleBuyPacks = (pack) => {
    addCoins(pack.coins);
    setPurchasedPack(pack);
    setTimeout(() => {
      setPurchasedPack(null);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-paper border border-surface-line rounded-t-3xl sm:rounded-3xl p-6 relative shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-surface-line">
          <div className="flex items-center gap-2 font-display font-semibold text-[16px] text-ink">
            <CoinIcon className="w-5 h-5 text-gold" />
            <span>Buy Coins Store</span>
          </div>
          <button onClick={onClose} className="text-taupe text-lg font-bold hover:text-ink">
            ×
          </button>
        </div>

        {purchasedPack ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-gold/20 text-gold flex items-center justify-center mx-auto mb-2 border border-gold/40">
              <CheckIcon className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-[18px] text-ink">+{purchasedPack.coins} Coins Added!</h3>
            <p className="text-[12px] text-taupe">Your wallet has been updated successfully.</p>
          </div>
        ) : (
          <>
            <p className="text-[12px] text-taupe">
              Coins unlock premium bilingual chapters individually. Choose a pack below:
            </p>

            <div className="space-y-2.5">
              {coinPacks.map((pack) => (
                <button
                  key={pack.coins}
                  onClick={() => handleBuyPacks(pack)}
                  className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all hover:border-gold ${
                    pack.popular
                      ? 'bg-gradient-to-r from-gold/15 to-white border-gold shadow-sm'
                      : 'bg-white border-surface-line'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center font-bold text-[15px]">
                      <CoinIcon className="w-5 h-5 text-gold" />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-bold text-[15px] text-ink">{pack.coins} Coins</span>
                        {pack.popular && (
                          <span className="bg-gold text-paper text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <SparklesIcon className="w-2.5 h-2.5" /> Best Value
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-taupe">Unlock {Math.floor(pack.coins / 10)} chapters</span>
                    </div>
                  </div>

                  <span className="font-bold text-[14px] text-deep bg-surface px-3 py-1.5 rounded-xl border border-surface-line">
                    {pack.price}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
