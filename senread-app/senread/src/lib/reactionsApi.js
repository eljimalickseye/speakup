// Firebase Realtime Database - Book Reactions & Likes Service for Koko Stories
// Uses WebSocket listeners for INSTANT cross-device like count sync

import { db } from './firebase.js';
import { ref, onValue, set, get, off, runTransaction } from 'firebase/database';

// Helper to get or generate persistent client user identity
export function getPersistentUserId(userProfile) {
  if (userProfile?.id) return String(userProfile.id);
  if (userProfile?.name && userProfile.name !== 'Lecteur Koko')
    return `usr_${userProfile.name.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  let visitorId = null;
  try {
    visitorId = localStorage.getItem('koko_visitor_uuid');
    if (!visitorId) {
      visitorId = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('koko_visitor_uuid', visitorId);
    }
  } catch {
    visitorId = 'vis_default';
  }
  return visitorId;
}

// Determine the current user's non-like reaction for a book
function getUserCurrentReaction(bookId, currentUserId) {
  try {
    return localStorage.getItem(`koko_user_reaction_${bookId}_${currentUserId}`) || null;
  } catch {
    return null;
  }
}

function saveUserCurrentReaction(bookId, currentUserId, reactionType) {
  try {
    if (reactionType) {
      localStorage.setItem(`koko_user_reaction_${bookId}_${currentUserId}`, reactionType);
    } else {
      localStorage.removeItem(`koko_user_reaction_${bookId}_${currentUserId}`);
    }
  } catch {}
}

// Build client-facing state from a raw Firebase reactions item
function buildClientItem(item = {}, currentUserId) {
  const usersList = Array.isArray(item.users) ? item.users :
    (item.users && typeof item.users === 'object') ? Object.values(item.users) : [];
  const likeCount = usersList.length > 0 ? usersList.length : (item.likes || item.like || 0);
  const isLiked = usersList.includes(currentUserId);

  return {
    likes: likeCount,
    users: usersList,
    userReaction: isLiked ? 'like' : null,
    love: item.love || 0,
    mindblown: item.mindblown || 0,
    sad: item.sad || 0,
  };
}

// Subscribe to book reactions in real-time (WebSocket — instant update on all devices!)
// Returns an unsubscribe function
export function subscribeToReactions(userProfile, callback) {
  const currentUserId = getPersistentUserId(userProfile);
  const reactionsRef = ref(db, 'reactions');

  const unsubscribe = onValue(reactionsRef, (snapshot) => {
    try {
      const data = snapshot.val() || {};
      const result = {};
      Object.keys(data).forEach((bId) => {
        result[bId] = buildClientItem(data[bId] || {}, currentUserId);
      });
      callback(result);
    } catch (e) {
      console.warn('Firebase reactions listener error:', e);
    }
  }, (error) => {
    console.warn('Firebase reactions listener error:', error);
  });

  return () => off(reactionsRef, 'value', unsubscribe);
}

// One-time fetch of all reactions
export async function fetchReactionsFromCloud(userProfile) {
  const currentUserId = getPersistentUserId(userProfile);
  const cacheKey = 'koko_reactions_v4';

  try {
    const reactionsRef = ref(db, 'reactions');
    const snapshot = await get(reactionsRef);
    const data = snapshot.val() || {};
    const result = {};
    Object.keys(data).forEach((bId) => {
      result[bId] = buildClientItem(data[bId] || {}, currentUserId);
    });
    try { localStorage.setItem(cacheKey, JSON.stringify(result)); } catch {}
    return result;
  } catch (e) {
    console.warn('Firebase reactions fetch failed, using cache:', e);
    try {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }
}

// Toggle a book reaction:
// - 'like' uses users[] array via transaction for exact per-user counting
// - 'love', 'mindblown', 'sad' use simple +1/-1 counters
export async function toggleCloudBookReaction(bookId, reactionType = 'like', userProfile) {
  const currentUserId = getPersistentUserId(userProfile);
  const bookReactionRef = ref(db, `reactions/${bookId}`);

  try {
    // Use Firebase transaction for atomic read-modify-write (no race conditions!)
    await runTransaction(bookReactionRef, (currentData) => {
      if (currentData === null) {
        currentData = { like: 0, users: [], love: 0, mindblown: 0, sad: 0 };
      }

      let usersList = Array.isArray(currentData.users) ? [...currentData.users] :
        (currentData.users && typeof currentData.users === 'object') ?
        Object.values(currentData.users) : [];

      if (reactionType === 'like') {
        const idx = usersList.indexOf(currentUserId);
        if (idx !== -1) {
          usersList.splice(idx, 1); // Unlike
        } else {
          usersList.push(currentUserId); // Like
        }
        currentData.likes = usersList.length;
        currentData.like = usersList.length;
        currentData.users = usersList;

      } else {
        // Simple toggle for love, mindblown, sad
        const currentCount = currentData[reactionType] || 0;
        currentData[reactionType] = Math.max(0, currentCount + 1);
      }

      return currentData;
    });

    // Fetch latest state after transaction and return client-facing state
    const snapshot = await get(bookReactionRef);
    const updated = snapshot.val() || {};
    const clientState = buildClientItem(updated, currentUserId);

    // Update local cache
    const cacheKey = 'koko_reactions_v4';
    try {
      const cached = localStorage.getItem(cacheKey);
      const all = cached ? JSON.parse(cached) : {};
      all[bookId] = clientState;
      localStorage.setItem(cacheKey, JSON.stringify(all));
    } catch {}

    return { [bookId]: clientState };
  } catch (e) {
    console.warn('Firebase toggle reaction error:', e);
    return null;
  }
}
