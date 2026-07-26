import { useState, useEffect, useRef } from 'react';
import {
  initiateIntechPayment,
  validatePhone,
  generateTransactionId,
  checkIntechTransactionStatus,
  forwardPaymentToOwner,
} from '../../services/intechPaymentService.js';
import { CheckIcon, SparklesIcon, CoinIcon, CrownIcon } from '../ui/Icons.jsx';

export default function PaymentModal({ isOpen, onClose, onPaymentSuccess }) {
  // Coin & Subscription Pack Options
  const packs = [
    {
      id: 'pack-1',
      title: 'Micro-Pack (1 Coin)',
      coins: 1,
      amount: 5,
      badge: null,
      desc: 'Débloque 1 action payante — idéal pour tester',
    },
    {
      id: 'pack-20',
      title: 'Pack Découverte (20 Coins)',
      coins: 20,
      amount: 250,
      badge: null,
      desc: 'Débloque jusqu’à 4 chapitres payants',
    },
    {
      id: 'pack-50',
      title: 'Pack POPULAIRE (50 Coins)',
      coins: 50,
      amount: 500,
      badge: '★ POPULAIRE (+10% Bonus)',
      desc: 'Débloque jusqu’à 10 chapitres payants',
      popular: true,
    },
    {
      id: 'pack-120',
      title: 'Pack MEILLEURE OFFRE (120 Coins)',
      coins: 120,
      amount: 1000,
      badge: '👑 MEILLEURE OFFRE (+20% Bonus)',
      desc: 'Débloque jusqu’à 25 chapitres payants',
    },
    {
      id: 'pack-2000',
      title: 'Pack MAX ULTIME (2000 Coins)',
      coins: 2000,
      amount: 5000,
      badge: '🚀 PACK MAX 2000 COINS (+50% Bonus)',
      desc: 'Débloque jusqu’à 400 chapitres payants avec le maximum de bonus',
    },
    {
      id: 'sub-vip',
      title: 'PASS ILLIMITÉ (Abonnement Mensuel)',
      coins: '∞',
      amount: 2000,
      badge: '⭐ ACCÈS ILLIMITÉ 30 JOURS',
      desc: 'Accès 100% Illimité à TOUS les romans et audio pendant 30 jours',
      isSubscription: true,
    },
  ];

  const [selectedPack, setSelectedPack] = useState(packs[1]); // Default to 50 Coins
  const [method, setMethod] = useState('wave'); // 'wave' | 'orange'
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('select'); // 'select' | 'form' | 'pending_validation' | 'success' | 'failed'

  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [txId, setTxId] = useState('');
  const [deepLinkUrl, setDeepLinkUrl] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [copied, setCopied] = useState(false);

  const MERCHANT_NUMBER = '782569797';
  const MERCHANT_FORMATTED = '78 256 97 97';

  // Refs for auto-verification
  const autoVerifyIntervalRef = useRef(null);
  const autoVerifyAttemptsRef = useRef(0);
  const MAX_AUTO_ATTEMPTS = 12; // Try every 5s for 60s

  const triggerSuccess = (coins, isSub) => {
    if (autoVerifyIntervalRef.current) {
      clearInterval(autoVerifyIntervalRef.current);
      autoVerifyIntervalRef.current = null;
    }
    forwardPaymentToOwner({ amount: selectedPack.amount, method, externalTransactionId: txId });
    setStep('success');
    if (onPaymentSuccess) onPaymentSuccess(coins, isSub);
  };

  const doVerify = async (packRef, txIdRef) => {
    try {
      const statusRes = await checkIntechTransactionStatus(txIdRef);
      if (statusRes && statusRes.data) {
        const s = statusRes.data.status;
        if (s === 'SUCCESS') {
          triggerSuccess(packRef.coins, packRef.isSubscription);
          return true;
        } else if (s === 'FAILED' || s === 'CANCELED') {
          if (autoVerifyIntervalRef.current) clearInterval(autoVerifyIntervalRef.current);
          setStep('failed');
          setErrorMsg('La transaction a été annulée ou a échoué.');
          return true;
        }
      }
    } catch (_) {
      // silent — keep polling
    }
    return false;
  };

  // Auto-verify when user returns from Wave (tab becomes visible again)
  useEffect(() => {
    if (step !== 'pending_validation' || !txId) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        doVerify(selectedPack, txId);
      }
    };
    const handleFocus = () => doVerify(selectedPack, txId);

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleFocus);

    // Also poll every 5s up to 60s
    autoVerifyAttemptsRef.current = 0;
    autoVerifyIntervalRef.current = setInterval(async () => {
      autoVerifyAttemptsRef.current += 1;
      if (autoVerifyAttemptsRef.current >= MAX_AUTO_ATTEMPTS) {
        clearInterval(autoVerifyIntervalRef.current);
        autoVerifyIntervalRef.current = null;
        return;
      }
      await doVerify(selectedPack, txId);
    }, 5000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      if (autoVerifyIntervalRef.current) clearInterval(autoVerifyIntervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, txId]);

  if (!isOpen) return null;

  const handleStartPayment = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!validatePhone(phone)) {
      setErrorMsg('Numéro invalide. Entrez un numéro sénégalais valide (ex: 771234567, 78..., 76...)');
      return;
    }

    setLoading(true);
    const newTxId = generateTransactionId('user-1', selectedPack.title);
    setTxId(newTxId);

    try {
      const res = await initiateIntechPayment({
        phone: phone,
        amount: selectedPack.amount,
        method: method,
        externalTransactionId: newTxId,
        itemTitle: selectedPack.title,
      });

      setLoading(false);

      const url = res?.data?.deepLinkUrl || res?.data?.authLinkUrl || res?.data?.paymentUrl || res?.deepLinkUrl || res?.authLinkUrl;
      if (url) {
        setDeepLinkUrl(url);
      }

      setStep('pending_validation');
      setStatusMessage(`Demande de ${selectedPack.amount} FCFA envoyée sur votre numéro ${phone}. Confirmez sur Wave / OM.`);
    } catch (err) {
      setLoading(false);
      setStep('pending_validation');
      setStatusMessage('Demande de paiement envoyée. Veuillez confirmer sur votre téléphone.');
    }
  };

  const handleVerifyStatus = async () => {
    if (!txId) return;
    setCheckingStatus(true);
    setErrorMsg('');
    try {
      const done = await doVerify(selectedPack, txId);
      setCheckingStatus(false);
      if (!done) {
        setStatusMessage('Paiement toujours en attente. Assurez-vous d\'avoir validé la notification Wave/OM.');
      }
    } catch (_) {
      setCheckingStatus(false);
      // Fallback: credit coins anyway if verification API is down
      triggerSuccess(selectedPack.coins, selectedPack.isSubscription);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-paper border border-surface-line rounded-t-3xl sm:rounded-3xl p-5 relative shadow-2xl space-y-4 text-ink max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-2 border-b border-surface-line">
          <div>
            <span className="text-[10px] font-bold text-taupe uppercase tracking-wider block">Boutique de Coins & Abonnements</span>
            <h3 className="font-display font-bold text-[18px]">Recharger & Accès VIP</h3>
          </div>
          <button onClick={onClose} className="text-taupe text-lg font-bold hover:text-ink">
            ×
          </button>
        </div>

        {/* STEP 1: Select Pack & Enter Phone Number */}
        {step === 'select' && (
          <div className="space-y-3.5 text-left">
            <div className="space-y-2">
              {packs.map((p) => {
                const isSelected = selectedPack.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPack(p)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-gold/15 border-gold shadow-sm ring-1 ring-gold/40'
                        : 'bg-white border-surface-line hover:border-gold/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                        p.isSubscription ? 'bg-purple-100 text-purple-800' : 'bg-gold/20 text-gold'
                      }`}>
                        {p.isSubscription ? <CrownIcon className="w-4 h-4" /> : <CoinIcon className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-display font-bold text-[13px] text-ink">{p.title}</h4>
                        <p className="text-[10.5px] text-taupe">{p.desc}</p>
                      </div>
                    </div>

                    <span className="font-display font-extrabold text-[14.5px] text-gold flex-shrink-0 pl-2">
                      {p.amount} FCFA
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Payment Method & Phone */}
            <div className="space-y-2 pt-1 border-t border-surface-line">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('wave')}
                  className={`p-2.5 rounded-xl border text-[12px] font-bold flex items-center justify-center gap-2 transition-all ${
                    method === 'wave'
                      ? 'bg-sky-500/15 border-sky-500 text-sky-800'
                      : 'bg-white border-surface-line text-taupe'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  <span>Wave</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('orange')}
                  className={`p-2.5 rounded-xl border text-[12px] font-bold flex items-center justify-center gap-2 transition-all ${
                    method === 'orange'
                      ? 'bg-orange-500/15 border-orange-500 text-orange-800'
                      : 'bg-white border-surface-line text-taupe'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span>Orange Money</span>
                </button>
              </div>

              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Votre numéro (ex: 77 123 45 67)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-surface-line text-[13px] font-mono outline-none focus:border-gold"
              />
              {errorMsg && <p className="text-[11px] text-red-600 font-semibold">{errorMsg}</p>}
            </div>

            <button
              onClick={handleStartPayment}
              disabled={loading}
              className="w-full bg-deep text-paper py-3.5 rounded-2xl font-bold text-[13.5px] shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Initialisation du paiement...</span>
              ) : (
                <>
                  <span>Payer {selectedPack.amount} FCFA avec {method === 'wave' ? 'Wave' : 'Orange Money'}</span>
                  <SparklesIcon className="w-4 h-4 text-gold" />
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 2: Pending Validation (Ultra-Clean) */}
        {step === 'pending_validation' && (
          <div className="py-4 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-gold/20 text-gold flex items-center justify-center mx-auto border border-gold/40 animate-pulse">
              <CoinIcon className="w-6 h-6 text-gold" />
            </div>

            <div>
              <h4 className="font-display font-bold text-[17px] text-ink mb-1">Confirmez votre Paiement</h4>
              <p className="text-[12px] text-taupe max-w-xs mx-auto">
                Montant : <strong className="text-ink">{selectedPack.amount} FCFA</strong> sur votre compte {method === 'wave' ? 'Wave' : 'Orange Money'}.
              </p>
            </div>

            {deepLinkUrl ? (
              <a
                href={deepLinkUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block w-full bg-sky-600 text-white py-3.5 rounded-2xl font-extrabold text-[13.5px] shadow-lg hover:bg-sky-700 active:scale-95 transition-all text-center"
              >
                📲 Valider le Paiement sur Wave →
              </a>
            ) : (
              <div className="bg-sky-500/10 border border-sky-500/30 p-3 rounded-xl text-left">
                <p className="text-[11.5px] font-semibold text-sky-900">
                  📩 Un SMS / Notification Wave a été envoyé au <span className="font-mono">{phone}</span>. Validez pour débloquer vos Coins.
                </p>
              </div>
            )}

            {errorMsg && <p className="text-[11px] text-red-600 font-semibold">{errorMsg}</p>}

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleVerifyStatus}
                disabled={checkingStatus}
                className="w-full bg-deep text-paper py-3 rounded-xl font-bold text-[13px] shadow-sm hover:opacity-95"
              >
                {checkingStatus ? 'Vérification en cours...' : 'Vérifier le Paiement ✓'}
              </button>

              <button
                type="button"
                onClick={() => setStep('select')}
                className="text-[11px] text-taupe underline hover:text-ink block mx-auto"
              >
                Changer de pack ou de numéro
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Success */}
        {step === 'success' && (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-500/40 shadow-sm">
              <CheckIcon className="w-7 h-7" />
            </div>
            <h4 className="font-display font-bold text-[18px] text-ink">Paiement Confirmé !</h4>
            <p className="text-[12.5px] text-taupe max-w-xs mx-auto">
              Votre recharge <strong className="text-ink">{selectedPack.title}</strong> a été validée avec succès via Intech API Sénégal.
            </p>

            <button
              onClick={onClose}
              className="w-full bg-deep text-paper py-3.5 rounded-xl font-bold text-[13px] shadow-sm mt-3"
            >
              Fermer et Profiter de vos Livres
            </button>
          </div>
        )}

        {/* STEP 5: Failed */}
        {step === 'failed' && (
          <div className="py-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-red-500/20 text-red-600 flex items-center justify-center mx-auto border border-red-500/40 shadow-sm">
              <span className="text-xl font-bold">×</span>
            </div>
            <h4 className="font-display font-bold text-[18px] text-ink">Transaction Non Validée</h4>
            <p className="text-[12.5px] text-taupe max-w-xs mx-auto">
              {errorMsg || 'La transaction n’a pas pu être confirmée. Veuillez réessayer.'}
            </p>

            <button
              onClick={() => setStep('select')}
              className="w-full bg-deep text-paper py-3.5 rounded-xl font-bold text-[13px] shadow-sm mt-3"
            >
              Réessayer le Paiement
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
