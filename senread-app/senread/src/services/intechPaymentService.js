/**
 * Service de Paiement Intech API (Wave & Orange Money Sénégal)
 * URL: https://api.intech.sn/api-services
 * Key: CE7ADB3E-57AC-4720-9A47-240DEE6F77DB
 */

const API_URL = 'https://api.intech.sn/api-services';
const API_KEY = 'CE7ADB3E-57AC-4720-9A47-240DEE6F77DB';

const lastCheckTimestamps = new Map();

/**
 * Formate le numéro de téléphone au format sénégalais (ex: 771234567)
 */
export function formatPhone(phone) {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('221')) {
    clean = clean.substring(3);
  }
  if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }
  return clean.slice(-9);
}

/**
 * Valide si le numéro est un numéro sénégalais valide (77, 78, 76, 70, 75)
 */
export function validatePhone(phone) {
  if (!phone) return false;
  const clean = formatPhone(phone);
  const senegalRegex = /^(77|78|76|70|75)[0-9]{7}$/;
  return senegalRegex.test(clean);
}

/**
 * Valide le montant du paiement en FCFA
 */
export function validateAmount(amount) {
  if (amount < 20) {
    return { valid: false, message: 'Le montant minimum est de 20 FCFA' };
  }
  if (amount > 200000) {
    return { valid: false, message: 'Le montant maximum est de 200 000 FCFA' };
  }
  if (amount % 10 !== 0) {
    return { valid: false, message: 'Le montant doit être un multiple de 10 FCFA' };
  }
  return { valid: true };
}

/**
 * Génère un ID de transaction unique
 */
export function generateTransactionId(userId = 'guest', itemId = 'coins') {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `KOKO_${userId.substring(0, 6)}_${itemId.substring(0, 6)}_${timestamp}_${random}`;
}

/**
 * Initie un paiement via Intech API (Wave ou Orange Money)
 */
export async function initiateIntechPayment({
  phone,
  amount,
  method, // 'wave' | 'orange'
  externalTransactionId,
  userId = 'user-1',
  itemId = 'pack-coins',
  itemTitle = 'Pack de Coins Koko',
}) {
  const codeService = method === 'wave' 
    ? 'WAVE_SN_API_CASH_OUT' 
    : 'ORANGE_SN_API_CASH_OUT';

  const formattedPhone = formatPhone(phone);
  const baseUrl = window.location.origin;

  const paymentData = {
    phone: formattedPhone,
    amount: amount,
    codeService: codeService,
    externalTransactionId: externalTransactionId,
    callbackUrl: `${baseUrl}/api/payments/callback`,
    apiKey: API_KEY,
    sender: 'KokoStories',
    successRedirectUrl: baseUrl,
    errorRedirectUrl: baseUrl,
    data: {
      userId,
      itemId,
      itemTitle,
      type: 'koko_purchase'
    }
  };

  try {
    const response = await fetch(`${API_URL}/operation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const result = await response.json();
    if (result.error) {
      let msg = result.msg || 'Erreur lors de l’initialisation du paiement';
      if (result.data && result.data.apiKey) {
        const apiErr = Array.isArray(result.data.apiKey) ? result.data.apiKey[0] : result.data.apiKey;
        if (typeof apiErr === 'string' && apiErr.includes('solde global')) {
          msg = 'Le service de paiement partenaire est temporairement indisponible';
        }
      }
      throw new Error(msg);
    }

    return result;
  } catch (error) {
    console.error('Erreur Intech API Payment:', error);
    throw error;
  }
}

/**
 * Vérifie le statut d'une transaction Intech (max 3 fois/min)
 */
export async function checkIntechTransactionStatus(externalTransactionId) {
  const now = Date.now();
  const oneMinute = 60 * 1000;
  const timestamps = lastCheckTimestamps.get(externalTransactionId) || [];
  const recentTimestamps = timestamps.filter(t => now - t < oneMinute);

  if (recentTimestamps.length >= 3) {
    throw new Error('Trop de vérifications. Veuillez patienter un instant.');
  }

  recentTimestamps.push(now);
  lastCheckTimestamps.set(externalTransactionId, recentTimestamps);

  try {
    const response = await fetch(`${API_URL}/get-transaction-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        externalTransactionId: externalTransactionId,
        apiKey: API_KEY,
      }),
    });

    const result = await response.json();
    if (result.data && result.data.status === 'FAILLED') {
      result.data.status = 'FAILED';
    }
    return result;
  } catch (error) {
    console.error('Erreur vérification statut transaction:', error);
    throw error;
  }
}
