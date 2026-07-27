// Firebase Realtime Database - Catalog Synchronization Service for Koko Stories
// Uses WebSocket listeners for INSTANT cross-device book publication sync

import { db } from './firebase.js';
import { ref, onValue, set, get, off } from 'firebase/database';
import { books as initialBooks } from '../data/books.js';

const CATALOG_PATH = 'catalog';

// Subscribe to the books catalog in real-time (WebSocket — instant!)
// Returns an unsubscribe function to call on cleanup
export function subscribeToCatalog(callback) {
  const catalogRef = ref(db, CATALOG_PATH);

  const unsubscribe = onValue(catalogRef, (snapshot) => {
    try {
      const data = snapshot.val();
      if (data && typeof data === 'object') {
        // Firebase stores arrays as objects — convert back
        const booksList = Array.isArray(data) ? data : Object.values(data);
        if (booksList.length > 0) {
          // Update local cache
          try {
            localStorage.setItem('koko_books_v3', JSON.stringify(booksList));
          } catch {}
          callback(booksList);
        }
      }
    } catch (e) {
      console.warn('Firebase catalog listener error:', e);
    }
  }, (error) => {
    console.warn('Firebase catalog listener error:', error);
  });

  return () => off(catalogRef, 'value', unsubscribe);
}

// One-time fetch of the books catalog (for initial load)
export async function fetchCatalogFromCloud() {
  const cacheKey = 'koko_books_v3';

  // 1. Return cached local version immediately
  let cached = initialBooks;
  try {
    const local = localStorage.getItem(cacheKey);
    if (local) cached = JSON.parse(local);
  } catch {
    cached = initialBooks;
  }

  // 2. Fetch from Firebase RTDB
  try {
    const catalogRef = ref(db, CATALOG_PATH);
    const snapshot = await get(catalogRef);
    const data = snapshot.val();

    if (data) {
      const booksList = Array.isArray(data) ? data : Object.values(data);
      if (booksList.length > 0) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(booksList));
        } catch {}
        return booksList;
      }
    }
  } catch (e) {
    console.warn('Firebase catalog fetch failed, using cache:', e);
  }

  return cached;
}

// Save the books catalog to Firebase RTDB — all devices see the new book INSTANTLY
export async function saveCatalogToCloud(booksList = []) {
  const cacheKey = 'koko_books_v3';

  // 1. Immediately update local cache
  try {
    localStorage.setItem(cacheKey, JSON.stringify(booksList));
  } catch {}

  // 2. Write to Firebase RTDB — listeners on all devices notified instantly via WebSocket!
  try {
    const catalogRef = ref(db, CATALOG_PATH);
    await set(catalogRef, booksList);
    return true;
  } catch (e) {
    console.warn('Firebase catalog save failed:', e);
    return false;
  }
}
