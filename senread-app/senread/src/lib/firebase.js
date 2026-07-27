// Firebase Configuration for Koko Stories
// Project: senepanda-6f7c5 | App: webtoon senegal
// Uses Firebase Auth + Google Sign-In + Realtime Database

import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDgwcKUF24O9LP1hp5bVsval0ci9XDx2Mg",
  authDomain: "senepanda-6f7c5.firebaseapp.com",
  databaseURL: "https://senepanda-6f7c5-default-rtdb.firebaseio.com",
  projectId: "senepanda-6f7c5",
  storageBucket: "senepanda-6f7c5.firebasestorage.app",
  messagingSenderId: "887438718563",
  appId: "1:887438718563:web:d4e34746223e507b5faa56",
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getDatabase(app);
const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

export async function logoutUserFromFirebase() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase Logout Error:', error);
  }
}

export { app, db, auth, googleProvider, onAuthStateChanged };
