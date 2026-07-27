import { createContext, useContext, useState, useEffect } from 'react';
import { books as initialBooks, library as initialLibrary } from '../data/books.js';
import { fetchCatalogFromCloud, saveCatalogToCloud, subscribeToCatalog } from '../lib/catalogApi.js';
import { fetchReactionsFromCloud, toggleCloudBookReaction, subscribeToReactions } from '../lib/reactionsApi.js';
import { subscribeToGlobalConfig, saveGlobalConfig, defaultConfig } from '../lib/configApi.js';
import { signInWithGoogle, logoutUserFromFirebase } from '../lib/firebase.js';

const AppContext = createContext();

// Create a cross-tab / cross-window Realtime Broadcast Channel
const catalogSyncChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('koko_catalog_sync') : null;

// Sanitizer function to purge expired blob: URLs from memory & storage
function sanitizeBooksList(books = []) {
  return books.map((b) => {
    let cleanBook = { ...b, status: b.status || 'PUBLISHED', rating: b.rating && Number(b.rating) > 0 && b.id !== 'koko-goree-secret' ? Number(b.rating) : 0 };
    if (cleanBook.customCoverUrl && cleanBook.customCoverUrl.startsWith('blob:')) {
      cleanBook.customCoverUrl = ''; // Clear expired blob: URL
    }
    if (cleanBook.chaptersData) {
      cleanBook.chaptersData = cleanBook.chaptersData.map((ch) => {
        if (ch.audioUrl && ch.audioUrl.startsWith('blob:')) {
          return { ...ch, audioUrl: '' };
        }
        return ch;
      });
    }
    return cleanBook;
  });
}

export function AppProvider({ children }) {
  // Theme Mode State ('light' | 'dark')
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('koko_theme_mode') || 'light';
  });

  useEffect(() => {
    localStorage.setItem('koko_theme_mode', themeMode);
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  const toggleThemeMode = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Application Interface Language ('fr' | 'en')
  const [appLanguage, setAppLanguage] = useState(() => {
    return localStorage.getItem('koko_app_lang') || 'fr';
  });

  const changeAppLanguage = (lang) => {
    setAppLanguage(lang);
    localStorage.setItem('koko_app_lang', lang);
  };

  // Books catalog state (Sanitized & Synchronized)
  const [booksList, setBooksList] = useState(() => {
    const saved = localStorage.getItem('koko_books_v3');
    if (!saved) return initialBooks;
    try {
      const parsed = JSON.parse(saved);
      return sanitizeBooksList(parsed);
    } catch {
      return initialBooks;
    }
  });

  // User Library & Reading Progress
  const [userLibrary, setUserLibrary] = useState(() => {
    const saved = localStorage.getItem('koko_library');
    return saved ? JSON.parse(saved) : initialLibrary;
  });

  // Bookmarked Book IDs
  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('koko_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  // Saved Vocabulary Words
  const [savedVocab, setSavedVocab] = useState(() => {
    const saved = localStorage.getItem('koko_vocab');
    return saved ? JSON.parse(saved) : [];
  });

  // Global Config Realtime State (Theme, Fonts, Monetization, Announcements)
  const [globalConfig, setGlobalConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('koko_global_config_v1');
      return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
    } catch {
      return defaultConfig;
    }
  });

  // Admin Master Switch for Public Creator Studio Access
  const [isCreatorStudioPublic, setIsCreatorStudioPublic] = useState(() => {
    return localStorage.getItem('koko_creator_studio_public') === 'true';
  });

  // Unlocked Chapters Record
  const [unlockedChapters, setUnlockedChapters] = useState(() => {
    const saved = localStorage.getItem('koko_unlocked_chapters');
    return saved ? JSON.parse(saved) : {};
  });

  // Authentication & Profile State (Default is standard reader, NOT admin)
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('koko_logged_in') === 'true';
  });

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('koko_user_v3');
    return saved ? JSON.parse(saved) : {
      id: 'usr-reader',
      name: 'Lecteur Koko',
      email: 'lecteur@koko.sn',
      phone: '770000000',
      coins: 0,
      streak: 0,
      isVip: false,
      role: 'reader', // Standard Reader by Default
      accessStatus: 'APPROVED',
      lastReadDate: null,
    };
  });

  // Real-Time User Activity Stream
  const [activityLogs, setActivityLogs] = useState(() => {
    const saved = localStorage.getItem('koko_activity_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // Detailed Book Reviews
  const [bookReviews, setBookReviews] = useState(() => {
    const saved = localStorage.getItem('koko_reviews');
    return saved ? JSON.parse(saved) : {};
  });

  // Book Sentiment Reactions
  const [bookReactions, setBookReactions] = useState(() => {
    const saved = localStorage.getItem('koko_reactions');
    return saved ? JSON.parse(saved) : {};
  });

  // Users List for Admin RBAC (Fatoumata = Sole Writer, Malick = Admin)
  const [usersList, setUsersList] = useState([
    { id: 'usr-author', name: 'Fatoumata', email: 'fatoumata@koko.app', phone: '778901234', role: 'author', accessStatus: 'APPROVED', isVip: true, coins: 0 },
    { id: 'usr-admin', name: 'El Hadji Malick Seye', email: 'malick@koko.app', phone: '785423833', role: 'admin', accessStatus: 'APPROVED', isVip: true, coins: 0 },
  ]);

  // Reader Notifications State
  const initialNotifications = [
    {
      id: 1,
      title: 'Nouveau Chapitre Disponible !',
      titleEn: 'New Chapter Released!',
      message: 'Le Chapitre 3 du roman "Le Secret de l\'Île de Gorée" est maintenant disponible.',
      messageEn: 'Chapter 3 of "The Secret of Gorée Island" is now available.',
      time: 'Il y a 10m',
      timeEn: '10m ago',
      type: 'CHAPTER',
      read: false,
      link: '/book/koko-goree-secret/read/3',
    },
    {
      id: 2,
      title: 'Nouveau Message dans le Forum',
      titleEn: 'New Forum Reply',
      message: 'Fatoumata a répondu à votre sujet dans Théories & Analyses.',
      messageEn: 'Fatoumata replied to your topic in Theories & Analyses.',
      time: 'Il y a 1h',
      timeEn: '1h ago',
      type: 'FORUM',
      read: false,
      link: '/forum',
    },
    {
      id: 3,
      title: 'Bonus Série de Lecture !',
      titleEn: 'Daily Reading Streak Bonus!',
      message: 'Vous avez gagné +10 Koko Coins pour votre fidélité de lecture.',
      messageEn: 'You earned +10 Koko Coins for your reading loyalty.',
      time: 'Hier',
      timeEn: 'Yesterday',
      type: 'COINS',
      read: true,
      link: '/profile',
    },
  ];

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('koko_reader_notifications');
      return saved ? JSON.parse(saved) : initialNotifications;
    } catch {
      return initialNotifications;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('koko_reader_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn('Failed to save notifications', e);
    }
  }, [notifications]);

  const markNotificationAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Audio Engine State
  const [activeAudio, setActiveAudio] = useState(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Instant Cross-Tab / Realtime Storage Listener Sync
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'koko_books_v3' && e.newValue) {
        try {
          const fresh = JSON.parse(e.newValue);
          setBooksList(sanitizeBooksList(fresh));
        } catch (err) {
          console.error('Error syncing books catalog:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // BroadcastChannel Listener for instant multi-window sync
    if (catalogSyncChannel) {
      catalogSyncChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'CATALOG_UPDATED') {
          const saved = localStorage.getItem('koko_books_v3');
          if (saved) {
            try {
              setBooksList(sanitizeBooksList(JSON.parse(saved)));
            } catch (err) {
              console.error('Error reading BroadcastChannel sync:', err);
            }
          }
        }
      };
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Sync books state to LocalStorage and Firebase Cloud DB for global multi-device visibility
  const syncAndPersistBooks = (updatedList) => {
    const cleanList = sanitizeBooksList(updatedList);
    setBooksList(cleanList);
    saveCatalogToCloud(cleanList);

    if (catalogSyncChannel) {
      catalogSyncChannel.postMessage({ type: 'CATALOG_UPDATED', timestamp: Date.now() });
    }
  };

  // Real-time Firebase WebSocket subscription — new published books appear instantly on all devices!
  useEffect(() => {
    const unsubscribe = subscribeToCatalog((cloudBooks) => {
      if (Array.isArray(cloudBooks) && cloudBooks.length > 0) {
        setBooksList(sanitizeBooksList(cloudBooks));
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firebase WebSocket subscription for Global Config
  useEffect(() => {
    const unsubscribe = subscribeToGlobalConfig((config) => {
      setGlobalConfig(config);
      if (config.isCreatorStudioPublic !== undefined) {
        setIsCreatorStudioPublic(config.isCreatorStudioPublic);
      }
    });

    return () => unsubscribe();
  }, []);

  const updateGlobalConfig = (newSettings) => {
    const updated = { ...globalConfig, ...newSettings };
    setGlobalConfig(updated);
    saveGlobalConfig(updated);
  };

  useEffect(() => {
    localStorage.setItem('koko_vocab', JSON.stringify(savedVocab));
  }, [savedVocab]);

  useEffect(() => {
    localStorage.setItem('koko_user_v3', JSON.stringify(userProfile));
    localStorage.setItem('koko_logged_in', isLoggedIn ? 'true' : 'false');
  }, [userProfile, isLoggedIn]);

  // Dynamic Reading Streak Increment Engine
  const recordReadingSession = () => {
    const todayStr = new Date().toDateString();
    setUserProfile((prev) => {
      if (prev.lastReadDate === todayStr) return prev;
      const newStreak = (prev.streak || 0) + 1;
      return {
        ...prev,
        streak: newStreak,
        lastReadDate: todayStr,
      };
    });
    logActivity(userProfile.name, 'A enregistré une session de lecture aujourd’hui', 'READ');
  };

  // Advanced Multi-Meaning Vocabulary Actions
  // Allows saving a word multiple times, appending new meanings, and tracking save count
  const addVocabWord = (en, fr, extraNote = '') => {
    if (!en || !en.trim()) return;
    const cleanEn = en.trim();
    const cleanFr = fr ? fr.trim() : cleanEn;

    setSavedVocab((prev) => {
      const existingIdx = prev.findIndex(v => v.en.toLowerCase() === cleanEn.toLowerCase());

      if (existingIdx !== -1) {
        // Word already exists -> Add new meaning to array if unique, increment save count
        const existing = prev[existingIdx];
        const currentMeanings = Array.isArray(existing.meanings) ? [...existing.meanings] : [existing.fr];
        if (cleanFr && !currentMeanings.includes(cleanFr)) {
          currentMeanings.push(cleanFr);
        }
        if (extraNote && !currentMeanings.includes(extraNote)) {
          currentMeanings.push(extraNote);
        }

        const updatedWord = {
          ...existing,
          fr: currentMeanings[0] || cleanFr,
          meanings: currentMeanings,
          timesSaved: (existing.timesSaved || 1) + 1,
          lastSavedDate: 'À l’instant',
        };

        const list = [...prev];
        list[existingIdx] = updatedWord;
        return list;
      } else {
        // New word entry
        const meaningsList = [cleanFr];
        if (extraNote && extraNote !== cleanFr) meaningsList.push(extraNote);

        const newWord = {
          id: Date.now(),
          en: cleanEn,
          fr: cleanFr,
          meanings: meaningsList,
          date: 'À l’instant',
          timesSaved: 1,
        };
        return [newWord, ...prev];
      }
    });
  };

  const addVocabMeaning = (wordId, newMeaning) => {
    if (!newMeaning || !newMeaning.trim()) return;
    setSavedVocab((prev) =>
      prev.map((item) => {
        if (item.id === wordId) {
          const currentMeanings = Array.isArray(item.meanings) ? [...item.meanings] : [item.fr];
          if (!currentMeanings.includes(newMeaning.trim())) {
            currentMeanings.push(newMeaning.trim());
          }
          return {
            ...item,
            fr: currentMeanings[0],
            meanings: currentMeanings,
          };
        }
        return item;
      })
    );
  };

  const removeVocabMeaning = (wordId, meaningIndex) => {
    setSavedVocab((prev) =>
      prev.map((item) => {
        if (item.id === wordId) {
          const currentMeanings = Array.isArray(item.meanings) ? [...item.meanings] : [item.fr];
          currentMeanings.splice(meaningIndex, 1);
          if (currentMeanings.length === 0) return null; // Marked for deletion
          return {
            ...item,
            fr: currentMeanings[0],
            meanings: currentMeanings,
          };
        }
        return item;
      }).filter(Boolean)
    );
  };

  const removeVocabWord = (id) => {
    setSavedVocab((prev) => prev.filter(v => v.id !== id));
  };

  // Dynamic Profile Edit Action
  const updateUserProfileInfo = (updatedInfo) => {
    setUserProfile((prev) => ({ ...prev, ...updatedInfo }));
    logActivity(userProfile.name, 'A mis à jour les informations de son profil', 'PROFILE');
  };

  // Dynamic Catalog Actions (Add, Update & Delete Books with Instant Sync)
  const addNewBook = (newBook) => {
    const updated = [newBook, ...booksList];
    syncAndPersistBooks(updated);
    logActivity(userProfile.name, `A publié un nouveau roman "${newBook.title}"`, 'PUBLISH');
  };

  const updateBook = (updatedBook) => {
    const updated = booksList.map((b) => (b.id === updatedBook.id ? updatedBook : b));
    syncAndPersistBooks(updated);
    logActivity(userProfile.name, `A mis à jour le roman "${updatedBook.title}"`, 'UPDATE');
  };

  const toggleBookStatus = (bookId) => {
    const target = booksList.find((b) => b.id === bookId);
    if (!target) return;
    const nextStatus = target.status === 'DRAFT' ? 'PUBLISHED' : 'DRAFT';
    const updatedBook = { ...target, status: nextStatus };
    const updated = booksList.map((b) => (b.id === bookId ? updatedBook : b));
    syncAndPersistBooks(updated);
    logActivity(userProfile.name, `A basculé le roman "${target.title}" en statut [${nextStatus}]`, 'STATUS_CHANGE');
  };

  const deleteBook = (bookId) => {
    const targetBook = booksList.find((b) => b.id === bookId);
    const updated = booksList.filter((b) => b.id !== bookId);
    
    // Instant catalog update
    syncAndPersistBooks(updated);

    // Clean up bookmarks & user library references for deleted book
    setBookmarks((prev) => {
      const filtered = prev.filter((id) => id !== bookId);
      localStorage.setItem('koko_bookmarks', JSON.stringify(filtered));
      return filtered;
    });

    setUserLibrary((prev) => {
      const filtered = prev.filter((b) => b.id !== bookId);
      localStorage.setItem('koko_library', JSON.stringify(filtered));
      return filtered;
    });

    if (targetBook) {
      logActivity(userProfile.name, `A supprimé le roman "${targetBook.title}"`, 'DELETE');
    }
  };

  // Activity Logger Function
  const logActivity = (user, action, type = 'GENERAL') => {
    const newLog = {
      id: Date.now(),
      user: user || userProfile.name || 'Visiteur',
      action,
      type,
      time: 'À l’instant',
    };
    setActivityLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  // Dynamic Coins Addition Engine
  const addCoins = (amount) => {
    setUserProfile((prev) => {
      const newBalance = (prev.coins || 0) + amount;
      return { ...prev, coins: newBalance };
    });
    logActivity(userProfile.name, `A gagné +${amount} Coins`, 'COINS');
  };

  // Dynamic Chapter Coin Unlock Handler
  const unlockChapterWithCoins = (bookId, chapterNum, coinPrice) => {
    if ((userProfile.coins || 0) < coinPrice) return false;

    const chapterKey = `${bookId}-${chapterNum}`;
    setUserProfile((prev) => ({ ...prev, coins: (prev.coins || 0) - coinPrice }));
    setUnlockedChapters((prev) => {
      const updated = { ...prev, [chapterKey]: true };
      localStorage.setItem('koko_unlocked_chapters', JSON.stringify(updated));
      return updated;
    });
    logActivity(userProfile.name, `A débloqué le Chapitre ${chapterNum} de "${bookId}" pour ${coinPrice} Coins`, 'PURCHASE');
    return true;
  };

  const isChapterUnlocked = (bookId, chapterNum) => {
    if (chapterNum === 1) return true;
    if (userProfile?.isVip) return true;
    return unlockedChapters[`${bookId}-${chapterNum}`] === true;
  };

  // Actions for Book Reviews & Sentiment
  const addBookReview = (bookId, newReview) => {
    setBookReviews((prev) => {
      const existing = prev[bookId] || [];
      const updated = { ...prev, [bookId]: [newReview, ...existing] };
      localStorage.setItem('koko_reviews', JSON.stringify(updated));
      return updated;
    });
    logActivity(userProfile.name, `A laissé un avis (${newReview.rating}★) sur "${bookId}"`, 'REVIEW');
  };

  const toggleBookReaction = async (bookId, reactionType = 'like') => {
    // Instantly push reaction update to Global Cloud DB using unique Users Array
    const cloudReactions = await toggleCloudBookReaction(bookId, reactionType, userProfile);
    if (cloudReactions) {
      setBookReactions(cloudReactions);
    }
    logActivity(userProfile.name, `A réagi [${reactionType}] sur "${bookId}"`, 'REACTION');
  };

  // Audio Engine Controls (HTML5 Audio for Teacher Recorded Vocals + SpeechSynthesis Fallback)
  const [audioElement, setAudioElement] = useState(null);

  useEffect(() => {
    let interval;
    if (isAudioPlaying && !activeAudio?.audioUrl) {
      interval = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            setIsAudioPlaying(false);
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            return 0;
          }
          return prev + 2 * playbackSpeed;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isAudioPlaying, playbackSpeed, activeAudio]);

  const startAudioTrack = (trackData) => {
    // Stop any existing SpeechSynthesis or HTML5 Audio
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
    }

    setActiveAudio(trackData);
    setIsAudioPlaying(true);
    setAudioProgress(0);

    // PRIORITY 1: Real Teacher / Author Recorded Audio URL
    if (trackData.audioUrl) {
      try {
        const audio = new Audio(trackData.audioUrl);
        audio.playbackRate = playbackSpeed;

        audio.addEventListener('timeupdate', () => {
          if (audio.duration) {
            setAudioProgress((audio.currentTime / audio.duration) * 100);
          }
        });

        audio.addEventListener('ended', () => {
          setIsAudioPlaying(false);
          setAudioProgress(100);
        });

        audio.play().catch(() => {
          console.warn('Teacher recorded audio play request handled');
        });

        setAudioElement(audio);
      } catch (err) {
        console.error('Audio load error:', err);
      }
    } else if ('speechSynthesis' in window) {
      // PRIORITY 2: Immersive Web Speech Synthesis Fallback
      setAudioElement(null);
      window.speechSynthesis.cancel();

      const titleText = `${trackData.chapterTitle || 'Chapitre'}. `;
      const bodyText = (trackData.sentences || [])
        .map((s) => (typeof s === 'string' ? s : (s.en || s.fr || '')))
        .filter(Boolean)
        .join('. ');
      const fullText = titleText + bodyText;

      if (fullText.trim()) {
        const utterance = new SpeechSynthesisUtterance(fullText);
        utterance.rate = playbackSpeed;
        utterance.lang = 'en-US';
        utterance.onend = () => {
          setIsAudioPlaying(false);
          setAudioProgress(100);
        };
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const toggleAudioPlayPause = () => {
    if (isAudioPlaying) {
      if (audioElement) {
        audioElement.pause();
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
      setIsAudioPlaying(false);
    } else {
      if (audioElement) {
        audioElement.play().catch(() => {});
      } else if ('speechSynthesis' in window) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        } else if (!window.speechSynthesis.speaking && activeAudio) {
          window.speechSynthesis.cancel();
          const titleText = `${activeAudio.chapterTitle || 'Chapitre'}. `;
          const bodyText = (activeAudio.sentences || [])
            .map((s) => (typeof s === 'string' ? s : (s.en || s.fr || '')))
            .filter(Boolean)
            .join('. ');
          const fullText = titleText + bodyText;

          if (fullText.trim()) {
            const utterance = new SpeechSynthesisUtterance(fullText);
            utterance.rate = playbackSpeed;
            utterance.lang = 'en-US';
            utterance.onend = () => {
              setIsAudioPlaying(false);
              setAudioProgress(100);
            };
            window.speechSynthesis.speak(utterance);
          }
        } else {
          window.speechSynthesis.resume();
        }
      }
      setIsAudioPlaying(true);
    }
  };

  const stopAudioTrack = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.src = '';
      setAudioElement(null);
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsAudioPlaying(false);
    setActiveAudio(null);
    setAudioProgress(0);
  };

  const cyclePlaybackSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);

    if (audioElement) {
      audioElement.playbackRate = nextSpeed;
    } else if (isAudioPlaying && 'speechSynthesis' in window && activeAudio) {
      window.speechSynthesis.cancel();
      const textToRead = activeAudio.sentences.map((s) => s.en || s).join('. ');
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = nextSpeed;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  const seekAudio = (percent) => {
    setAudioProgress(percent);
    if (audioElement && audioElement.duration) {
      audioElement.currentTime = (percent / 100) * audioElement.duration;
    }
  };

  // Auth & Admin Switch
  const toggleCreatorStudioPublic = () => {
    setIsCreatorStudioPublic((prev) => {
      const nextVal = !prev;
      localStorage.setItem('koko_creator_studio_public', nextVal ? 'true' : 'false');
      return nextVal;
    });
  };

  const loginUser = (userObj) => {
    setUserProfile(userObj);
    setIsLoggedIn(true);
    logActivity(userObj.name, 'S’est connecté à son compte', 'AUTH');
  };

  const loginWithGoogle = async () => {
    try {
      const firebaseUser = await signInWithGoogle();
      if (firebaseUser) {
        const googleProfile = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Lecteur Koko',
          email: firebaseUser.email || 'google.user@koko.sn',
          avatarUrl: firebaseUser.photoURL || '',
          phone: firebaseUser.phoneNumber || '770000000',
          coins: Math.max(userProfile.coins || 0, 50),
          streak: Math.max(userProfile.streak || 0, 1),
          isVip: true,
          role: firebaseUser.email === 'malick@koko.app' ? 'admin' : (userProfile.role === 'admin' ? 'admin' : 'reader'),
          accessStatus: 'APPROVED',
          provider: 'google',
        };
        setUserProfile(googleProfile);
        setIsLoggedIn(true);
        logActivity(googleProfile.name, 'S’est connecté via Google Auth', 'AUTH');
        return googleProfile;
      }
    } catch (error) {
      console.error('Google Login Error:', error);
      throw error;
    }
  };

  const logoutUser = () => {
    logActivity(userProfile.name, 'S’est déconnecté', 'AUTH');
    logoutUserFromFirebase();
    setIsLoggedIn(false);
    setUserProfile({
      id: 'usr-reader',
      name: 'Lecteur Koko',
      email: 'lecteur@koko.sn',
      phone: '770000000',
      coins: 0,
      streak: 0,
      isVip: false,
      role: 'reader',
      accessStatus: 'APPROVED',
      lastReadDate: null,
    });
  };

  const submitAccessRequest = (requestData) => {
    const newUser = {
      id: 'usr-' + Date.now(),
      name: requestData.name,
      email: requestData.email,
      phone: requestData.phone,
      role: 'reader',
      accessStatus: 'PENDING',
      isVip: false,
      coins: 0,
    };
    setUsersList((prev) => [newUser, ...prev]);
    logActivity(requestData.name, 'A soumis une demande d’accès de lecture', 'AUTH');
  };

  const updateUserRole = (userId, newRole) => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );
  };

  const updateUserStatus = (userId, newStatus) => {
    setUsersList((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, accessStatus: newStatus } : u))
    );
  };

  const toggleBookmark = (bookId) => {
    setBookmarks((prev) => {
      const updated = prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId];
      localStorage.setItem('koko_bookmarks', JSON.stringify(updated));
      return updated;
    });
  };

  const isBookmarked = (bookId) => bookmarks.includes(bookId);

  return (
    <AppContext.Provider
      value={{
        themeMode,
        toggleThemeMode,
        appLanguage,
        changeAppLanguage,
        booksList,
        userLibrary,
        bookmarks,
        globalConfig: globalConfig || defaultConfig,
        updateGlobalConfig,
        userProfile,
        isLoggedIn,
        savedVocab,
        bookReviews,
        bookReactions,
        usersList,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        activityLogs,
        isCreatorStudioPublic,
        unlockedChapters,
        activeAudio,
        isAudioPlaying,
        audioProgress,
        playbackSpeed,
        startAudioTrack,
        toggleAudioPlayPause,
        stopAudioTrack,
        cyclePlaybackSpeed,
        seekAudio,
        toggleBookmark,
        isBookmarked,
        addCoins,
        addNewBook,
        updateBook,
        toggleBookStatus,
        deleteBook,
        addBookReview,
        toggleBookReaction,
        addVocabWord,
        removeVocabWord,
        updateUserProfileInfo,
        logActivity,
        unlockChapterWithCoins,
        isChapterUnlocked,
        recordReadingSession,
        toggleCreatorStudioPublic,
        setUserProfile,
        loginUser,
        loginWithGoogle,
        logoutUser,
        submitAccessRequest,
        updateUserRole,
        updateUserStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
