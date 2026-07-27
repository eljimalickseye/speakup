// Firebase Realtime Database - Global App Config Service for Koko Stories
// Allows Admin to configure app theme, default fonts, studio public status, and platform rules in real time

import { db } from './firebase.js';
import { ref, onValue, set, get, off } from 'firebase/database';

const CONFIG_PATH = 'config/global';

export const defaultConfig = {
  themeMode: 'cream', // 'cream' | 'light' | 'dark' | 'midnight'
  readingFont: "'Newsreader', serif", // "'Newsreader', serif" | "'Inter', sans-serif" | "'Georgia', serif" | "'Lora', serif"
  baseFontSize: 16, // 14 to 22
  brandAccent: '#C8A951', // '#C8A951' (Gold) | '#E64C4C' (Red) | '#4C9EE6' (Sky) | '#4CAF8A' (Emerald) | '#9E8AE6' (Violet)
  isCreatorStudioPublic: false,
  requireAccessApproval: false,
  freeChaptersCount: 1,
  defaultCoinPrice: 10,
  appNotice: '',
};

// Subscribe to global config changes in real time
export function subscribeToGlobalConfig(callback) {
  const configRef = ref(db, CONFIG_PATH);

  const unsubscribe = onValue(configRef, (snapshot) => {
    try {
      const data = snapshot.val();
      if (data && typeof data === 'object') {
        const merged = { ...defaultConfig, ...data };
        try {
          localStorage.setItem('koko_global_config_v1', JSON.stringify(merged));
        } catch {}
        callback(merged);
      }
    } catch (e) {
      console.warn('Firebase global config listener error:', e);
    }
  }, (error) => {
    console.warn('Firebase global config listener error:', error);
  });

  return () => off(configRef, 'value', unsubscribe);
}

// Fetch global config once
export async function fetchGlobalConfig() {
  const cacheKey = 'koko_global_config_v1';
  let cached = defaultConfig;
  try {
    const local = localStorage.getItem(cacheKey);
    if (local) cached = JSON.parse(local);
  } catch {}

  try {
    const configRef = ref(db, CONFIG_PATH);
    const snapshot = await get(configRef);
    const data = snapshot.val();
    if (data && typeof data === 'object') {
      const merged = { ...defaultConfig, ...data };
      try {
        localStorage.setItem(cacheKey, JSON.stringify(merged));
      } catch {}
      return merged;
    }
  } catch (e) {
    console.warn('Firebase fetch global config failed, using cache:', e);
  }

  return cached;
}

// Save global config to Firebase RTDB
export async function saveGlobalConfig(newConfig = {}) {
  const cacheKey = 'koko_global_config_v1';
  const merged = { ...defaultConfig, ...newConfig };

  try {
    localStorage.setItem(cacheKey, JSON.stringify(merged));
  } catch {}

  try {
    const configRef = ref(db, CONFIG_PATH);
    await set(configRef, merged);
    return true;
  } catch (e) {
    console.warn('Firebase save global config failed:', e);
    return false;
  }
}
