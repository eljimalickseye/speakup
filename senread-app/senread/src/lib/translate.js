// Free Live Translation Service (EN <-> FR)
// Uses MyMemory Translation API with caching and instant local fallbacks

const translationCache = new Map();

export async function translateEnToFr(text) {
  if (!text || !text.trim()) return '';
  const clean = text.trim();
  const key = `en_fr_${clean.toLowerCase()}`;
  if (translationCache.has(key)) return translationCache.get(key);

  const quickDict = {
    'hello': 'bonjour',
    'good morning': 'bonjour',
    'good evening': 'bonsoir',
    'good night': 'bonne nuit',
    'mist': 'brume',
    'breeze': 'brise',
    'lighthouse': 'phare',
    'fog': 'brouillard',
    'secret': 'secret',
    'ocean': 'océan',
    'key': 'clé',
    'alley': 'ruelle',
    'sun': 'soleil',
    'night': 'nuit',
  };

  const lower = clean.toLowerCase();
  if (quickDict[lower]) {
    translationCache.set(key, quickDict[lower]);
    return quickDict[lower];
  }

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=en|fr`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        const translated = data.responseData.translatedText;
        translationCache.set(key, translated);
        return translated;
      }
    }
  } catch (e) {
    console.warn('Live translation service warning:', e);
  }

  return clean;
}

export async function translateFrToEn(text) {
  if (!text || !text.trim()) return '';
  const clean = text.trim();
  const key = `fr_en_${clean.toLowerCase()}`;
  if (translationCache.has(key)) return translationCache.get(key);

  const quickDictFr = {
    'bonjour': 'hello',
    'brume': 'mist',
    'brouillard': 'fog',
    'brise': 'breeze',
    'phare': 'lighthouse',
    'secret': 'secret',
    'océan': 'ocean',
    'clé': 'key',
    'ruelle': 'alley',
    'soleil': 'sun',
    'nuit': 'night',
    'mer': 'sea',
    'vague': 'wave',
    'ombre': 'shadow',
    'vent': 'wind',
  };

  const lower = clean.toLowerCase();
  if (quickDictFr[lower]) {
    translationCache.set(key, quickDictFr[lower]);
    return quickDictFr[lower];
  }

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(clean)}&langpair=fr|en`;
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        const translated = data.responseData.translatedText;
        translationCache.set(key, translated);
        return translated;
      }
    }
  } catch (e) {
    console.warn('Live translation service warning:', e);
  }

  return clean;
}
