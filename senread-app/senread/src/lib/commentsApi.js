// Firebase Realtime Database - Comments Service for Koko Stories
// Uses WebSocket listeners for INSTANT cross-device sync (no polling needed!)

import { db } from './firebase.js';
import { ref, onValue, set, get, off } from 'firebase/database';

export const defaultChapterComments = [];

// Helper to count total comments including replies
export function countTotalComments(commentsList = []) {
  if (!Array.isArray(commentsList)) return 0;
  return commentsList.reduce((acc, c) => {
    const repliesCount = Array.isArray(c.replies) ? c.replies.length : 0;
    return acc + 1 + repliesCount;
  }, 0);
}

// Seamlessly merge cloud comments with local optimistic comments (no flickering)
export function mergeCommentsLists(cloudList = [], localList = []) {
  if (!Array.isArray(cloudList)) cloudList = [];
  if (!Array.isArray(localList)) localList = [];

  const map = new Map();
  cloudList.forEach((c) => map.set(String(c.id), c));

  localList.forEach((c) => {
    const key = String(c.id);
    if (!map.has(key)) {
      map.set(key, c);
    } else {
      const cloudItem = map.get(key);
      const repliesMap = new Map();
      (cloudItem.replies || []).forEach((r) => repliesMap.set(String(r.id), r));
      (c.replies || []).forEach((r) => repliesMap.set(String(r.id), r));
      map.set(key, {
        ...cloudItem,
        ...c,
        replies: Array.from(repliesMap.values()),
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Subscribe to chapter comments in real-time (WebSocket - instant!)
// Returns an unsubscribe function to call on cleanup
export function subscribeToChapterComments(bookId = 'b1', chapterId = '1', callback) {
  const path = `comments/${bookId}_${chapterId}`;
  const commentsRef = ref(db, path);

  const unsubscribe = onValue(commentsRef, (snapshot) => {
    try {
      const data = snapshot.val();
      let commentsList = [];
      if (data && typeof data === 'object') {
        // Firebase stores arrays as objects with numeric keys — convert back to array
        commentsList = Object.values(data).map((c) => ({
          ...c,
          replies: c.replies ? Object.values(c.replies) : [],
        }));
        // Sort by newest first
        commentsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      callback(commentsList);
    } catch (e) {
      console.warn('Error parsing Firebase comments:', e);
      callback([]);
    }
  }, (error) => {
    console.warn('Firebase comments listener error:', error);
    callback([]);
  });

  return () => off(commentsRef, 'value', unsubscribe);
}

// One-time fetch of chapter comments (for initial load / offline fallback)
export async function fetchChapterComments(bookId = 'b1', chapterId = '1') {
  const cacheKey = `koko_comments_${bookId}_${chapterId}`;

  try {
    const commentsRef = ref(db, `comments/${bookId}_${chapterId}`);
    const snapshot = await get(commentsRef);
    const data = snapshot.val();

    let commentsList = [];
    if (data && typeof data === 'object') {
      commentsList = Object.values(data).map((c) => ({
        ...c,
        replies: c.replies ? Object.values(c.replies) : [],
      }));
      commentsList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // Cache locally for offline fallback
    try {
      localStorage.setItem(cacheKey, JSON.stringify(commentsList));
    } catch {}

    return commentsList;
  } catch (e) {
    console.warn('Firebase fetch failed, using cache:', e);
    try {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  }
}

// Save / update chapter comments to Firebase Realtime Database
export async function saveChapterComments(bookId = 'b1', chapterId = '1', comments = []) {
  const cacheKey = `koko_comments_${bookId}_${chapterId}`;

  // 1. Immediately update local cache
  try {
    localStorage.setItem(cacheKey, JSON.stringify(comments));
  } catch {}

  // 2. Write to Firebase RTDB — listeners on all other devices will be notified INSTANTLY
  try {
    const commentsRef = ref(db, `comments/${bookId}_${chapterId}`);

    // Convert array to object with id keys (Firebase best practice)
    const commentsObj = {};
    comments.forEach((c) => {
      const cId = String(c.id);
      const repliesObj = {};
      if (Array.isArray(c.replies)) {
        c.replies.forEach((r) => {
          repliesObj[String(r.id)] = r;
        });
      }
      commentsObj[cId] = {
        ...c,
        replies: repliesObj,
      };
    });

    await set(commentsRef, commentsObj);
    return true;
  } catch (e) {
    console.warn('Firebase save failed:', e);
    return false;
  }
}
