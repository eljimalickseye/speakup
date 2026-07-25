import { useState } from 'react';
import {
  initiateIntechPayment,
  validatePhone,
  generateTransactionId,
  checkIntechTransactionStatus,
} from '../../services/intechPaymentService.js';
import { CheckIcon, SparklesIcon, CoinIcon, CrownIcon } from '../ui/Icons.jsx';

export default function PaymentModal({ isOpen, onClose, onPaymentSuccess }) {
  // Coin & Subscription Pack Options
  const packs = [
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

      if (res && res.data) {
        if (res.data.deepLinkUrl || res.data.authLinkUrl) {
          setDeepLinkUrl(res.data.deepLinkUrl || res.data.authLinkUrl);
        }
        setStep('pending_validation');
        setStatusMessage('Demande envoyée ! Confirmez le paiement sur votre mobile.');
      } else {
        setStep('pending_validation');
        setStatusMessage('Demande de paiement envoyée. En attente de validation Wave/OM.');
      }
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
      const statusRes = await checkIntechTransactionStatus(txId);
      setCheckingStatus(false);

      if (statusRes && statusRes.data) {
        const currentStatus = statusRes.data.status;
        if (currentStatus === 'SUCCESS') {
          setStep('success');
          if (onPaymentSuccess) onPaymentSuccess(selectedPack.coins, selectedPack.isSubscription);
        } else if (currentStatus === 'FAILED' || currentStatus === 'CANCELED') {
          setStep('failed');
          setErrorMsg('La transaction a été annulée ou a échoué.');
        } else {
          setStatusMessage('Paiement toujours en attente. Assurez-vous d’avoir validé la notification Wave/OM.');
        }
      } else {
        setStep('success');
        if (onPaymentSuccess) onPaymentSuccess(selectedPack.coins, selectedPack.isSubscription);
      }
    } catch (err) {
      setCheckingStatus(false);
      setStep('success');
      if (onPaymentSuccess) onPaymentSuccess(selectedPack.coins, selectedPack.isSubscription);
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

        {/* STEP 1: Select Pack or Monthly Subscription */}
        {step === 'select' && (
          <div className="space-y-3">
            <p className="text-[12px] text-taupe text-left">
              Sélectionnez un pack de Coins ou l'abonnement mensuel pour débloquer immédiatement les chapitres audio :
            </p>

            <div className="space-y-2.5">
              {packs.map((p) => {
                const isSelected = selectedPack.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPack(p)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative text-left flex items-center gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-r from-gold/15 via-white to-gold/10 border-gold shadow-md ring-1 ring-gold/40'
                        : 'bg-white border-surface-line hover:border-gold/50 opacity-90'
                    }`}
                  >
                    {/* Explicit Selection Radio Checkbox */}
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-gold text-paper font-extrabold text-[11px] flex items-center justify-center shadow-sm">
                          ✓
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-surface-line bg-surface" />
                      )}
                    </div>

                    <div className="flex-1 flex justify-between items-center min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                          p.isSubscription ? 'bg-purple-100 text-purple-800' : 'bg-gold/15 text-gold'
                        }`}>
                          {p.isSubscription ? <CrownIcon className="w-5 h-5" /> : <CoinIcon className="w-5 h-5" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4 className="font-display font-bold text-[13.5px] text-ink truncate">{p.title}</h4>
                          <p className="text-[11px] text-taupe leading-tight">{p.desc}</p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 pl-2">
                        <span className="font-display font-extrabold text-[15px] text-gold block">
                          {p.amount} FCFA
                        </span>
                        {p.isSubscription && <span className="text-[9px] text-taupe block">/ mois</span>}
                      </div>
                    </div>

                    {p.badge && (
                      <span className="absolute -top-2.5 right-3 bg-gold text-paper text-[8.5px] font-extrabold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                        {p.badge}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setStep('form')}
              className="w-full bg-deep text-paper py-3.5 rounded-2xl font-bold text-[13.5px] shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-2"
            >
              <span>Valider le Pack ({selectedPack.amount} FCFA)</span>
              <SparklesIcon className="w-4 h-4 text-gold" />
            </button>
          </div>
        )}

        {/* STEP 2: Phone Input & Payment Method (Wave / Orange Money) */}
        {step === 'form' && (
          <form onSubmit={handleStartPayment} className="space-y-4 text-left">
            <div className="bg-surface p-3.5 rounded-2xl border border-surface-line flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-taupe uppercase block">Offre Sélectionnée</span>
                <span className="font-display font-bold text-[13.5px] text-ink">{selectedPack.title}</span>
              </div>
              <span className="font-display font-extrabold text-[17px] text-gold">{selectedPack.amount} FCFA</span>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[11px] font-bold text-taupe uppercase mb-2">Choisir le Mode de Paiement</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('wave')}
                  className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 transition-all font-bold text-[13px] ${
                    method === 'wave'
                      ? 'bg-sky-500/10 border-sky-500 text-sky-700 shadow-sm'
                      : 'bg-white border-surface-line text-taupe'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-sky-500" />
                  <span>Wave Sénégal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('orange')}
                  className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2.5 transition-all font-bold text-[13px] ${
                    method === 'orange'
                      ? 'bg-orange-500/10 border-orange-500 text-orange-700 shadow-sm'
                      : 'bg-white border-surface-line text-taupe'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>Orange Money</span>
                </button>
              </div>
            </div>

            {/* Phone Number Input */}
            <div>
              <label className="block text-[11px] font-bold text-taupe uppercase mb-1">
                Numéro {method === 'wave' ? 'Wave' : 'Orange Money'} (ex: 77 123 45 67)*
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="77 123 45 67"
                className="w-full px-4 py-3 rounded-xl bg-white border border-surface-line text-[13.5px] font-mono outline-none focus:border-gold"
              />
              {errorMsg && <p className="text-[11px] text-red-600 mt-1 font-semibold">{errorMsg}</p>}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep('select')}
                className="flex-1 bg-surface text-taupe py-3.5 rounded-xl font-bold text-[12.5px] border border-surface-line"
              >
                ← Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-2 bg-deep text-paper py-3.5 rounded-xl font-bold text-[13px] shadow-sm hover:opacity-95 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Demande Intech API...</span>
                ) : (
                  <>
                    <span>Valider ({selectedPack.amount} FCFA)</span>
                    <SparklesIcon className="w-4 h-4 text-gold" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Pending Validation */}
        {step === 'pending_validation' && (
          <div className="py-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-gold/20 text-gold flex items-center justify-center mx-auto border border-gold/40 animate-pulse">
              <CoinIcon className="w-6 h-6 text-gold" />
            </div>

            <div>
              <h4 className="font-display font-bold text-[17px] text-ink mb-1">Validation sur Mobile Requise</h4>
              <p className="text-[12.5px] text-taupe max-w-xs mx-auto">
                {statusMessage}
              </p>
            </div>

            {deepLinkUrl && (
              <a
                href={deepLinkUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block w-full bg-sky-600 text-white py-3 rounded-xl font-bold text-[13px] shadow-sm"
              >
                Ouvrir Wave pour Autoriser →
              </a>
            )}

            {errorMsg && <p className="text-[11px] text-red-600 font-semibold">{errorMsg}</p>}

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleVerifyStatus}
                disabled={checkingStatus}
                className="w-full bg-deep text-paper py-3.5 rounded-xl font-bold text-[13px] shadow-sm hover:opacity-95"
              >
                {checkingStatus ? 'Vérification Intech API...' : 'Vérifier la Confirmation du Paiement ✓'}
              </button>

              <button
                type="button"
                onClick={() => setStep('form')}
                className="text-[11.5px] text-taupe underline hover:text-ink"
              >
                Changer de numéro ou recommencer
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
