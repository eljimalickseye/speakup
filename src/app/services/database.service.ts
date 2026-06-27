import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, getDoc, getDocs, 
  updateDoc, onSnapshot, query, orderBy, limit, addDoc, 
  arrayUnion, arrayRemove, where, deleteDoc 
} from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable } from 'rxjs';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export interface UserProfile {
  id: string;
  name: string;
  role: 'student' | 'teacher';
  level: string;
  xp: number;
  streak: number;
  lastActive: string;
  avatar: string;
  countryFlag?: string;
  vocabularyProgress?: string;
  conjugationProgress?: string;
  speakingScore?: string;
  badges?: string[];
  registeredAt?: string;
  registrationFee?: number;
  monthlyFee?: number;
  placementTestTaken?: boolean;
  placementTestScore?: number;
  voiceChatAllowed?: boolean;
  description?: string;
}

export interface LeaderboardReward {
  id: string;
  title: string;
  description: string;
  xpThreshold: number;
  assignedTo?: string | null;
  assignedName?: string | null;
  acknowledged?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  level: string;
  type: string;
  content: string;
  vocabulary: string[];
  homeworkInstruction: string;
  dueDate: string;
  createdAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  type: string;
  timeLimit: string;
  questions: {
    question: string;
    options: string[];
    correctOption: string;
  }[];
}

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  lessonId: string;
  lessonTitle: string;
  type: 'text' | 'audio';
  content: string;
  score?: string;
  feedback?: string;
  xpReward?: number;
  graded: boolean;
  submittedAt: string;
}

export interface Attendance {
  id: string;
  date: string;
  records: { [studentId: string]: 'P' | 'A' | 'L' | '-' };
}

export interface LiveClass {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: string;
  group: string;
  description: string;
  jitsiRoom: string;
  status: 'waiting' | 'active' | 'completed';
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  sendTo: string;
  priority: 'Normal' | 'Important' | 'Urgent';
  createdAt: string;
  readBy: string[];
  imageUrl?: string;
}

export interface Payment {
  id: string;
  studentId: string;
  studentName: string;
  amount: string;
  status: 'Paid' | 'Late' | 'Overdue';
  dueDate: string;
  paidAt?: string;
  method?: string;
  description?: string;
}

export interface EventItem {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  maxParticipants: number;
  description: string;
  registeredUsers: string[];
}

export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type?: 'text' | 'audio';
  audioUrl?: string;
}

export interface ChatChannel {
  id: string;
  name: string;
  createdById?: string;
  createdByRole?: string;
  members?: string[];
  isPrivate?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private firestore: any = null;
  private useFirebase = false;

  // Subjects for local reactive changes
  private users$ = new BehaviorSubject<UserProfile[]>([]);
  private lessons$ = new BehaviorSubject<Lesson[]>([]);
  private quizzes$ = new BehaviorSubject<Quiz[]>([]);
  private submissions$ = new BehaviorSubject<Submission[]>([]);
  private attendance$ = new BehaviorSubject<Attendance[]>([]);
  private schedules$ = new BehaviorSubject<LiveClass[]>([]);
  private announcements$ = new BehaviorSubject<Announcement[]>([]);
  private payments$ = new BehaviorSubject<Payment[]>([]);
  private events$ = new BehaviorSubject<EventItem[]>([]);
  private rewards$ = new BehaviorSubject<LeaderboardReward[]>([]);
  private voiceChatEnabled$ = new BehaviorSubject<boolean>(true);
  private channels$ = new BehaviorSubject<ChatChannel[]>([]);
  
  // Current user state
  private currentUser$ = new BehaviorSubject<UserProfile | null>(null);
  private activeJitsiCall$ = new BehaviorSubject<LiveClass | null>(null);

  constructor() {
    const voiceChatLocal = localStorage.getItem('speak_voice_chat_enabled') !== 'false';
    this.voiceChatEnabled$.next(voiceChatLocal);

    try {
      const app = initializeApp(environment.firebaseConfig);
      this.firestore = getFirestore(app);
      this.useFirebase = true;
      console.log('Firebase initialized successfully in database service.');
    } catch (error) {
      console.warn('Firebase initialization failed. Falling back to LocalStorage mode.', error);
      this.useFirebase = false;
    }

    this.initializeData();
    if (this.useFirebase) {
      this.clearOldMockMessagesOnce();
    }

    // Start periodic presence heartbeat pings (every 20 seconds)
    setInterval(() => {
      this.pingPresence();
    }, 20000);

    // Initial ping on start
    setTimeout(() => {
      this.pingPresence();
    }, 1500);
  }

  // Initial Mock Data Setup
  private initializeData() {
    // 1. Users (Clean slate: Teacher only)
    const defaultUsers: UserProfile[] = [
      { id: 'teacher', name: 'AT - Teacher', role: 'teacher', level: 'C2', xp: 0, streak: 0, lastActive: 'Today', avatar: 'AT' }
    ];

    // 2. Lessons (Empty by default)
    const defaultLessons: Lesson[] = [];

    // 3. Quizzes (Empty by default)
    const defaultQuizzes: Quiz[] = [];

    // 4. Submissions (Empty by default)
    const defaultSubmissions: Submission[] = [];

    // 5. Attendance (Empty by default)
    const defaultAttendance: Attendance[] = [];

    // 6. Live Classes (Empty by default)
    const defaultLiveClasses: LiveClass[] = [];

    // 7. Announcements (Empty by default)
    const defaultAnnouncements: Announcement[] = [];

    // 8. Payments (Empty by default)
    const defaultPayments: Payment[] = [];

    // 9. Events (Empty by default)
    const defaultEvents: EventItem[] = [];

    const defaultChannels: ChatChannel[] = [
      { id: 'general', name: 'general' },
      { id: 'group-a', name: 'study-group-a' },
      { id: 'travel', name: 'travel-dialogue' },
      { id: 'debate', name: 'debate-club' }
    ];

    // Read or write from LocalStorage
    const getLocal = (key: string, defaults: any) => {
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(defaults));
        return defaults;
      }
      return JSON.parse(data);
    };

    const users = getLocal('speak_users', defaultUsers);
    users.forEach((u: UserProfile) => {
      if (u.countryFlag && u.countryFlag.trim().length === 2) {
        u.countryFlag = this.countryCodeToEmoji(u.countryFlag);
      }
    });
    const lessons = getLocal('speak_lessons', defaultLessons);
    const quizzes = getLocal('speak_quizzes', defaultQuizzes);
    if (!quizzes.some((q: any) => q.id === 'placement-test')) {
      quizzes.unshift({
        id: 'placement-test',
        title: 'English Level Placement Test',
        type: 'Multiple Choice',
        timeLimit: 'No limit',
        questions: [
          {
            question: 'Choose the correct form: She ___ to school every day.',
            options: ['go', 'goes', 'going'],
            correctOption: 'B'
          },
          {
            question: 'Identify the correct preposition: I am interested ___ learning English.',
            options: ['in', 'at', 'on'],
            correctOption: 'A'
          },
          {
            question: 'Which sentence is grammatically correct?',
            options: ['If it rains, we will stay home.', 'If it will rain, we stay home.', 'If it rains, we would stay home.'],
            correctOption: 'A'
          },
          {
            question: 'Complete the sentence: By the time the movie ended, we ___ all the popcorn.',
            options: ['eat', 'have eaten', 'had eaten'],
            correctOption: 'C'
          },
          {
            question: 'What is the opposite of the word "generous"?',
            options: ['stingy', 'kind', 'polite'],
            correctOption: 'A'
          }
        ]
      });
      localStorage.setItem('speak_quizzes', JSON.stringify(quizzes));
    }
    const submissions = getLocal('speak_submissions', defaultSubmissions);
    const attendance = getLocal('speak_attendance', defaultAttendance);
    const schedules = getLocal('speak_schedules', defaultLiveClasses);
    const announcements = getLocal('speak_announcements', defaultAnnouncements);
    const payments = getLocal('speak_payments', defaultPayments);
    const events = getLocal('speak_events', defaultEvents);
    const channels = getLocal('speak_channels', defaultChannels);

    const defaultRewards: LeaderboardReward[] = [
      { id: 'reward-1', title: 'Ticket de Cinéma', description: 'Une place de cinéma gratuite au Pathé Dakar.', xpThreshold: 300, assignedTo: null, assignedName: null, acknowledged: false },
      { id: 'reward-2', title: 'Bon d\'achat Auchan', description: 'Un bon d\'achat de 15,000 CFA utilisable à Auchan.', xpThreshold: 800, assignedTo: null, assignedName: null, acknowledged: false },
      { id: 'reward-3', title: 'Voyage Week-end', description: 'Un séjour de 2 jours à Saly Portudal tout compris.', xpThreshold: 2000, assignedTo: null, assignedName: null, acknowledged: false }
    ];
    const rewards = getLocal('speak_rewards', defaultRewards);
    this.rewards$.next(rewards);

    this.users$.next(users);
    this.lessons$.next(lessons);
    this.quizzes$.next(quizzes);
    this.submissions$.next(submissions);
    this.attendance$.next(attendance);
    this.schedules$.next(schedules);
    this.announcements$.next(announcements);
    this.payments$.next(payments);
    this.events$.next(events);
    this.channels$.next(channels);

    // Require authentication on startup instead of auto-logging in as teacher
    const savedUserId = localStorage.getItem('speak_current_user_id') || null;
    const foundUser = savedUserId ? (users.find((u: UserProfile) => u.id === savedUserId) || null) : null;
    this.currentUser$.next(foundUser);

    // If using Firebase, sync local data to Firestore if Firebase has no collections yet
    if (this.useFirebase) {
      this.syncFirebaseWithLocalStorage();
    }
  }

  // Firebase initial sync
  private async syncFirebaseWithLocalStorage() {
    try {
      const usersSnap = await getDocs(collection(this.firestore, 'users'));
      if (usersSnap.empty) {
        console.log('Firestore is empty. Seeding Firestore with local mock data...');
        
        // Write users
        for (const user of this.users$.value) {
          await setDoc(doc(this.firestore, 'users', user.id), user);
        }
        // Write lessons
        for (const lesson of this.lessons$.value) {
          await setDoc(doc(this.firestore, 'lessons', lesson.id), lesson);
        }
        // Write quizzes
        for (const quiz of this.quizzes$.value) {
          await setDoc(doc(this.firestore, 'quizzes', quiz.id), quiz);
        }
        // Write submissions
        for (const sub of this.submissions$.value) {
          await setDoc(doc(this.firestore, 'submissions', sub.id), sub);
        }
        // Write attendance
        for (const att of this.attendance$.value) {
          await setDoc(doc(this.firestore, 'attendance', att.id), att);
        }
        // Write live classes
        for (const sc of this.schedules$.value) {
          await setDoc(doc(this.firestore, 'schedules', sc.id), sc);
        }
        // Write announcements
        for (const ann of this.announcements$.value) {
          await setDoc(doc(this.firestore, 'announcements', ann.id), ann);
        }
        // Write payments
        for (const pay of this.payments$.value) {
          await setDoc(doc(this.firestore, 'payments', pay.id), pay);
        }
        // Write events
        for (const ev of this.events$.value) {
          await setDoc(doc(this.firestore, 'events', ev.id), ev);
        }
        // Write rewards
        for (const reward of this.rewards$.value) {
          await setDoc(doc(this.firestore, 'rewards', reward.id), reward);
        }

        console.log('Firestore seeded successfully.');
      } else {
        console.log('Firestore collections detected. Setting up Firebase subscriptions...');
        // Subscribe to Firestore collections to listen to changes in real-time
        this.setupFirebaseSubscriptions();
      }
    } catch (e) {
      console.warn('Error seeding Firebase, will continue in LocalStorage-first mode:', e);
      this.useFirebase = false;
    }
  }

  private setupFirebaseSubscriptions() {
    // 1. Subscribe to Users
    onSnapshot(collection(this.firestore, 'users'), (snap) => {
      const users: UserProfile[] = [];
      snap.forEach(doc => {
        const u = doc.data() as UserProfile;
        if (u.countryFlag && u.countryFlag.trim().length === 2) {
          u.countryFlag = this.countryCodeToEmoji(u.countryFlag);
          this.updateUserFlagInFirestore(u.id, u.countryFlag);
        }
        users.push(u);
      });
      this.users$.next(users);
      
      // Update active user profile if updated
      const active = this.currentUser$.value;
      if (active) {
        const fresh = users.find(u => u.id === active.id);
        if (fresh) this.currentUser$.next(fresh);
      }
    });

    // 2. Subscribe to Lessons
    onSnapshot(collection(this.firestore, 'lessons'), (snap) => {
      const lessons: Lesson[] = [];
      snap.forEach(doc => lessons.push(doc.data() as Lesson));
      this.lessons$.next(lessons);
    });

    // 3. Subscribe to Quizzes
    onSnapshot(collection(this.firestore, 'quizzes'), (snap) => {
      const quizzes: Quiz[] = [];
      snap.forEach(doc => quizzes.push(doc.data() as Quiz));
      
      const hasPlacement = quizzes.some(q => q.id === 'placement-test');
      if (!hasPlacement) {
        const ptQuiz: Quiz = {
          id: 'placement-test',
          title: 'English Level Placement Test',
          type: 'Multiple Choice',
          timeLimit: 'No limit',
          questions: [
            {
              question: 'Choose the correct form: She ___ to school every day.',
              options: ['go', 'goes', 'going'],
              correctOption: 'B'
            },
            {
              question: 'Identify the correct preposition: I am interested ___ learning English.',
              options: ['in', 'at', 'on'],
              correctOption: 'A'
            },
            {
              question: 'Which sentence is grammatically correct?',
              options: ['If it rains, we will stay home.', 'If it will rain, we stay home.', 'If it rains, we would stay home.'],
              correctOption: 'A'
            },
            {
              question: 'Complete the sentence: By the time the movie ended, we ___ all the popcorn.',
              options: ['eat', 'have eaten', 'had eaten'],
              correctOption: 'C'
            },
            {
              question: 'What is the opposite of the word "generous"?',
              options: ['stingy', 'kind', 'polite'],
              correctOption: 'A'
            }
          ]
        };
        quizzes.unshift(ptQuiz);
        // Write to Firestore in background
        setDoc(doc(this.firestore, 'quizzes', 'placement-test'), ptQuiz).catch(e => console.warn(e));
      }
      this.quizzes$.next(quizzes);
    });

    // 4. Subscribe to Submissions
    onSnapshot(collection(this.firestore, 'submissions'), (snap) => {
      const submissions: Submission[] = [];
      snap.forEach(doc => submissions.push(doc.data() as Submission));
      this.submissions$.next(submissions);
    });

    // 5. Subscribe to Attendance
    onSnapshot(collection(this.firestore, 'attendance'), (snap) => {
      const attendance: Attendance[] = [];
      snap.forEach(doc => attendance.push(doc.data() as Attendance));
      this.attendance$.next(attendance);
    });

    // 6. Subscribe to Schedules (Live Classes)
    onSnapshot(collection(this.firestore, 'schedules'), (snap) => {
      const schedules: LiveClass[] = [];
      snap.forEach(doc => schedules.push(doc.data() as LiveClass));
      this.schedules$.next(schedules);
    });

    // 7. Subscribe to Announcements
    onSnapshot(collection(this.firestore, 'announcements'), (snap) => {
      const announcements: Announcement[] = [];
      snap.forEach(doc => announcements.push(doc.data() as Announcement));
      this.announcements$.next(announcements);
    });

    // 8. Subscribe to Payments
    onSnapshot(collection(this.firestore, 'payments'), (snap) => {
      const payments: Payment[] = [];
      snap.forEach(doc => payments.push(doc.data() as Payment));
      this.payments$.next(payments);
    });

    // 9. Subscribe to Events
    onSnapshot(collection(this.firestore, 'events'), (snap) => {
      const events: EventItem[] = [];
      snap.forEach(doc => events.push(doc.data() as EventItem));
      this.events$.next(events);
    });

    // 10. Subscribe to Rewards
    onSnapshot(collection(this.firestore, 'rewards'), (snap) => {
      const list: LeaderboardReward[] = [];
      snap.forEach(doc => list.push(doc.data() as LeaderboardReward));
      this.rewards$.next(list);
    });

    // 11. Subscribe to Channels
    onSnapshot(collection(this.firestore, 'channels'), (snap) => {
      const list: ChatChannel[] = [];
      snap.forEach(doc => list.push(doc.data() as ChatChannel));
      if (list.length > 0) {
        this.channels$.next(list);
      }
    });

    // 10. Subscribe to Settings
    onSnapshot(doc(this.firestore, 'settings', 'voice_chat'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.voiceChatEnabled$.next(!!data['enabled']);
      }
    });
  }

  // --- LOCAL WRITE HELPERS ---
  private saveLocal(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- USER OPERATIONS ---
  observeUsers(): Observable<UserProfile[]> { return this.users$.asObservable(); }
  observeCurrentUser(): Observable<UserProfile | null> { return this.currentUser$.asObservable(); }

  setCurrentUser(userId: string) {
    const user = this.users$.value.find(u => u.id === userId);
    if (user) {
      this.currentUser$.next(user);
      localStorage.setItem('speak_current_user_id', userId);
    }
  }

  async loginWithGoogle(desiredRole: 'student' | 'teacher') {
    if (!this.useFirebase) {
      const email = prompt('Simulated Google Authentication - Enter your email:', `${desiredRole}@gmail.com`);
      if (!email) throw new Error('Google Authentication cancelled.');
      const name = email.split('@')[0];
      const uid = 'google-uid-' + name.toLowerCase();
      
      let existingUser = this.users$.value.find(u => u.id === uid);
      if (existingUser) {
        this.setCurrentUser(existingUser.id);
        return existingUser;
      }
      
      const avatar = name.slice(0,2).toUpperCase();
      const newProfile: UserProfile = {
        id: uid,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        role: desiredRole,
        level: desiredRole === 'student' ? 'B1' : 'C2',
        xp: 0,
        streak: 0,
        lastActive: 'Today',
        avatar
      };
      
      const list = [...this.users$.value, newProfile];
      this.users$.next(list);
      this.saveLocal('speak_users', list);
      
      this.setCurrentUser(uid);
      
      return newProfile;
    }
    
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const googleUser = result.user;
    
    const email = googleUser.email;
    let existingUser = this.users$.value.find(u => u.id === googleUser.uid);
    if (!existingUser && email) {
      existingUser = this.users$.value.find(u => u.id === email.split('@')[0]);
    }

    if (existingUser) {
      this.setCurrentUser(existingUser.id);
      return existingUser;
    } else {
      const id = googleUser.uid;
      const name = googleUser.displayName || 'Google User';
      const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'G';
      
      const newProfile: UserProfile = {
        id,
        name,
        role: desiredRole,
        level: desiredRole === 'student' ? 'B1' : 'C2',
        xp: 0,
        streak: 0,
        lastActive: 'Today',
        avatar
      };
      
      await setDoc(doc(this.firestore, 'users', id), newProfile);
      this.setCurrentUser(id);
      
      return newProfile;
    }
  }

  logout() {
    this.currentUser$.next(null);
    localStorage.removeItem('speak_current_user_id');
  }

  async updateCurrentUserProfile(updates: Partial<UserProfile>) {
    const active = this.currentUser$.value;
    if (!active) return;

    const updated = { ...active, ...updates };
    this.currentUser$.next(updated);

    const list = [...this.users$.value];
    const idx = list.findIndex(u => u.id === active.id);
    if (idx !== -1) {
      list[idx] = updated;
      this.users$.next(list);
      this.saveLocal('speak_users', list);
    }

    if (this.useFirebase) {
      try {
        await updateDoc(doc(this.firestore, 'users', active.id), updates);
      } catch (e) {
        console.warn('Firestore update profile failed:', e);
      }
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const list = [...this.users$.value];
    const idx = list.findIndex(u => u.id === userId);
    if (idx !== -1) {
      const updated = { ...list[idx], ...updates };
      list[idx] = updated;
      this.users$.next(list);
      this.saveLocal('speak_users', list);

      if (this.useFirebase) {
        try {
          await updateDoc(doc(this.firestore, 'users', userId), updates);
        } catch (e) {
          console.warn('Firestore update profile failed:', e);
        }
      }
    }
  }

  async addStudent(name: string, level: string, countryFlag: string = '', registrationFee: number = 10000, monthlyFee: number = 7000) {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Date.now().toString().slice(-4);
    const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const newStudent: UserProfile = {
      id,
      name,
      role: 'student',
      level,
      xp: 0,
      streak: 0,
      lastActive: 'Never',
      avatar,
      countryFlag,
      registrationFee,
      monthlyFee,
      registeredAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    // Add to users
    const users = [...this.users$.value, newStudent];
    this.users$.next(users);
    this.saveLocal('speak_users', users);

    // Initialize custom invoices
    const paymentsList: Payment[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthYear = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const monthDesc = currentMonthYear.charAt(0).toUpperCase() + currentMonthYear.slice(1);
    
    // 1. Registration Fee invoice if > 0
    if (registrationFee > 0) {
      paymentsList.push({
        id: 'pay-reg-' + Date.now(),
        studentId: id,
        studentName: name,
        amount: `${registrationFee.toLocaleString()} CFA`,
        status: 'Late',
        dueDate: todayStr,
        description: "Frais d'inscription"
      });
    }

    // 2. Monthly tuition invoice if > 0
    if (monthlyFee > 0) {
      paymentsList.push({
        id: 'pay-mon-' + Date.now(),
        studentId: id,
        studentName: name,
        amount: `${monthlyFee.toLocaleString()} CFA`,
        status: 'Late',
        dueDate: todayStr,
        description: `Mensualité - ${monthDesc}`
      });
    }

    const payments = [...this.payments$.value, ...paymentsList];
    this.payments$.next(payments);
    this.saveLocal('speak_payments', payments);

    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'users', id), newStudent);
        for (const pay of paymentsList) {
          await setDoc(doc(this.firestore, 'payments', pay.id), pay);
        }
      } catch (e) {
        console.warn('Firebase add student failed, working in local mode.', e);
      }
    }
  }

  async resetDatabase() {
    // Clear all local storage keys including chat history
    const keys = [
      'speak_users', 'speak_lessons', 'speak_quizzes', 'speak_submissions',
      'speak_attendance', 'speak_schedules', 'speak_announcements',
      'speak_payments', 'speak_events', 'speak_current_user_id',
      'speak_chat_general', 'speak_chat_group-a', 'speak_chat_travel', 'speak_chat_debate'
    ];
    keys.forEach(k => localStorage.removeItem(k));

    // If using Firebase, delete everything from Firestore first
    if (this.useFirebase) {
      try {
        // Clear chat collections
        const channels = ['general', 'group-a', 'travel', 'debate'];
        for (const channelId of channels) {
          const messagesCol = collection(this.firestore, 'chat', channelId, 'messages');
          const snap = await getDocs(messagesCol);
          snap.forEach(async (d) => {
            await deleteDoc(d.ref);
          });
        }

        for (const u of this.users$.value) {
          await deleteDoc(doc(this.firestore, 'users', u.id));
        }
        for (const l of this.lessons$.value) {
          await deleteDoc(doc(this.firestore, 'lessons', l.id));
        }
        for (const q of this.quizzes$.value) {
          await deleteDoc(doc(this.firestore, 'quizzes', q.id));
        }
        for (const s of this.submissions$.value) {
          await deleteDoc(doc(this.firestore, 'submissions', s.id));
        }
        for (const a of this.attendance$.value) {
          await deleteDoc(doc(this.firestore, 'attendance', a.id));
        }
        for (const sc of this.schedules$.value) {
          await deleteDoc(doc(this.firestore, 'schedules', sc.id));
        }
        for (const ann of this.announcements$.value) {
          await deleteDoc(doc(this.firestore, 'announcements', ann.id));
        }
        for (const p of this.payments$.value) {
          await deleteDoc(doc(this.firestore, 'payments', p.id));
        }
        for (const e of this.events$.value) {
          await deleteDoc(doc(this.firestore, 'events', e.id));
        }
      } catch (error) {
        console.warn('Error clearing Firestore docs during reset:', error);
      }
    }

    // Now re-initialize data with clean defaults
    const defaultUsers: UserProfile[] = [
      { id: 'teacher', name: 'AT - Teacher', role: 'teacher', level: 'C2', xp: 0, streak: 0, lastActive: 'Today', avatar: 'AT' }
    ];
    const defaultPayments: Payment[] = [];

    this.saveLocal('speak_users', defaultUsers);
    this.saveLocal('speak_lessons', []);
    this.saveLocal('speak_quizzes', []);
    this.saveLocal('speak_submissions', []);
    this.saveLocal('speak_attendance', []);
    this.saveLocal('speak_schedules', []);
    this.saveLocal('speak_announcements', []);
    this.saveLocal('speak_payments', defaultPayments);
    this.saveLocal('speak_events', []);

    this.users$.next(defaultUsers);
    this.lessons$.next([]);
    this.quizzes$.next([]);
    this.submissions$.next([]);
    this.attendance$.next([]);
    this.schedules$.next([]);
    this.announcements$.next([]);
    this.payments$.next(defaultPayments);
    this.events$.next([]);

    // Force default user back to teacher
    this.currentUser$.next(defaultUsers[0]);
    localStorage.setItem('speak_current_user_id', 'teacher');

    if (this.useFirebase) {
      try {
        for (const user of defaultUsers) {
          await setDoc(doc(this.firestore, 'users', user.id), user);
        }
      } catch (error) {
        console.warn('Error seeding clean database in Firebase:', error);
      }
    }
  }

  async updateUserXP(userId: string, xpToAdd: number, addStreak = false) {
    const list = [...this.users$.value];
    const userIndex = list.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      const user = list[userIndex];
      const updated = {
        ...user,
        xp: user.xp + xpToAdd,
        streak: addStreak ? user.streak + 1 : user.streak,
        lastActive: 'Today'
      };
      
      list[userIndex] = updated;
      this.users$.next(list);
      this.saveLocal('speak_users', list);

      if (this.currentUser$.value?.id === userId) {
        this.currentUser$.next(updated);
      }

      if (this.useFirebase) {
        try {
          await updateDoc(doc(this.firestore, 'users', userId), {
            xp: updated.xp,
            streak: updated.streak,
            lastActive: updated.lastActive
          });
        } catch (e) {
          console.warn('Firebase update failed, working in local mode.', e);
        }
      }
    }
  }

  async saveUserNotes(studentId: string, notes: string) {
    // Note editing simulation: saves in local storage/firebase metadata
    // In our simplified schema, we can store it in user profile metadata or just keep it in localStorage
    localStorage.setItem(`speak_notes_${studentId}`, notes);
  }

  getUserNotes(studentId: string): string {
    return localStorage.getItem(`speak_notes_${studentId}`) || 
      (studentId === 'aminata' ? 'Good pronunciation, needs work on conditionals. Very engaged in class discussions.' : '');
  }

  // --- LESSON OPERATIONS ---
  observeLessons(): Observable<Lesson[]> { return this.lessons$.asObservable(); }

  async addLesson(lesson: Omit<Lesson, 'id' | 'createdAt'>) {
    const newLesson: Lesson = {
      ...lesson,
      id: 'lesson-' + Date.now(),
      createdAt: new Date().toISOString()
    };

    const list = [newLesson, ...this.lessons$.value];
    this.lessons$.next(list);
    this.saveLocal('speak_lessons', list);

    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'lessons', newLesson.id), newLesson);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  async updateLesson(lessonId: string, updatedData: Partial<Lesson>) {
    const list = [...this.lessons$.value];
    const idx = list.findIndex(l => l.id === lessonId);
    if (idx !== -1) {
      const updated = {
        ...list[idx],
        ...updatedData
      };
      list[idx] = updated;
      this.lessons$.next(list);
      this.saveLocal('speak_lessons', list);

      if (this.useFirebase) {
        try {
          await setDoc(doc(this.firestore, 'lessons', lessonId), updated);
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }

  // --- QUIZ OPERATIONS ---
  observeQuizzes(): Observable<Quiz[]> { return this.quizzes$.asObservable(); }

  async addQuiz(quiz: Omit<Quiz, 'id'>) {
    const newQuiz: Quiz = {
      ...quiz,
      id: 'quiz-' + Date.now()
    };
    
    const list = [...this.quizzes$.value, newQuiz];
    this.quizzes$.next(list);
    this.saveLocal('speak_quizzes', list);

    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'quizzes', newQuiz.id), newQuiz);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  async updateQuiz(quizId: string, updatedData: Partial<Quiz>) {
    const list = [...this.quizzes$.value];
    const idx = list.findIndex(q => q.id === quizId);
    if (idx !== -1) {
      const updated = {
        ...list[idx],
        ...updatedData
      };
      list[idx] = updated;
      this.quizzes$.next(list);
      this.saveLocal('speak_quizzes', list);

      if (this.useFirebase) {
        try {
          await setDoc(doc(this.firestore, 'quizzes', quizId), updated);
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }

  // --- SUBMISSIONS OPERATIONS ---
  observeSubmissions(): Observable<Submission[]> { return this.submissions$.asObservable(); }

  async submitHomework(lessonId: string, lessonTitle: string, type: 'text' | 'audio', content: string) {
    const activeUser = this.currentUser$.value;
    if (!activeUser) return;

    const newSub: Submission = {
      id: 'sub-' + Date.now(),
      studentId: activeUser.id,
      studentName: activeUser.name,
      lessonId,
      lessonTitle,
      type,
      content,
      graded: false,
      submittedAt: new Date().toISOString()
    };

    const list = [newSub, ...this.submissions$.value];
    this.submissions$.next(list);
    this.saveLocal('speak_submissions', list);

    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'submissions', newSub.id), newSub);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  async gradeSubmission(subId: string, score: string, feedback: string, xpReward: number) {
    const list = [...this.submissions$.value];
    const idx = list.findIndex(s => s.id === subId);
    if (idx !== -1) {
      const sub = list[idx];
      const updated: Submission = {
        ...sub,
        graded: true,
        score,
        feedback,
        xpReward
      };
      list[idx] = updated;
      this.submissions$.next(list);
      this.saveLocal('speak_submissions', list);

      // Award XP to the student
      await this.updateUserXP(sub.studentId, xpReward);

      if (this.useFirebase) {
        try {
          await setDoc(doc(this.firestore, 'submissions', subId), updated);
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }

  // --- ATTENDANCE OPERATIONS ---
  observeAttendance(): Observable<Attendance[]> { return this.attendance$.asObservable(); }

  async markAttendance(date: string, records: { [studentId: string]: 'P' | 'A' | 'L' | '-' }) {
    const list = [...this.attendance$.value];
    const existingIdx = list.findIndex(a => a.date === date);

    const targetId = existingIdx !== -1 ? list[existingIdx].id : 'att-' + Date.now();
    const updated: Attendance = {
      id: targetId,
      date,
      records
    };

    if (existingIdx !== -1) {
      list[existingIdx] = updated;
    } else {
      list.push(updated);
    }

    this.attendance$.next(list);
    this.saveLocal('speak_attendance', list);

    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'attendance', targetId), updated);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  // --- LIVE CLASS OPERATIONS ---
  observeSchedules(): Observable<LiveClass[]> { return this.schedules$.asObservable(); }
  observeActiveJitsiCall(): Observable<LiveClass | null> { return this.activeJitsiCall$.asObservable(); }
  setActiveJitsiCall(c: LiveClass | null) { this.activeJitsiCall$.next(c); }

  async scheduleClass(c: Omit<LiveClass, 'id' | 'status' | 'jitsiRoom'>, status: 'waiting' | 'active' = 'waiting') {
    const roomSuffix = Math.random().toString(36).substring(2, 9);
    const cleanedTitle = c.title.replace(/[^a-zA-Z0-9]/g, '');
    const newClass: LiveClass = {
      ...c,
      id: 'class-' + Date.now(),
      status: status,
      jitsiRoom: `SpeakUp_${cleanedTitle || 'Class'}_${roomSuffix}`
    };

    const list = [newClass, ...this.schedules$.value];
    this.schedules$.next(list);
    this.saveLocal('speak_schedules', list);

    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'schedules', newClass.id), newClass);
      } catch (e) {
        console.warn(e);
      }
    }
    return newClass;
  }

  async updateClassStatus(classId: string, status: 'waiting' | 'active' | 'completed') {
    const list = [...this.schedules$.value];
    const idx = list.findIndex(c => c.id === classId);
    if (idx !== -1) {
      const updated = { ...list[idx], status };
      list[idx] = updated;
      this.schedules$.next(list);
      this.saveLocal('speak_schedules', list);

      if (this.useFirebase) {
        try {
          await updateDoc(doc(this.firestore, 'schedules', classId), { status });
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }

  async deleteClass(classId: string) {
    const list = this.schedules$.value.filter(c => c.id !== classId);
    this.schedules$.next(list);
    this.saveLocal('speak_schedules', list);

    if (this.useFirebase) {
      try {
        await deleteDoc(doc(this.firestore, 'schedules', classId));
      } catch (e) {
        console.warn(e);
      }
    }
  }

  async startInstantLiveClass() {
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0].substring(0, 5);
    return await this.scheduleClass({
      title: 'Instant Live Class',
      description: 'Join our live practice session with the teacher now!',
      date: todayStr,
      time: timeStr,
      duration: '60 mins',
      group: 'All Students'
    }, 'active');
  }

  // --- ANNOUNCEMENT OPERATIONS ---
  observeAnnouncements(): Observable<Announcement[]> { return this.announcements$.asObservable(); }

  async addAnnouncement(ann: Omit<Announcement, 'id' | 'createdAt' | 'readBy'>) {
    const newAnn: Announcement = {
      ...ann,
      id: 'ann-' + Date.now(),
      createdAt: new Date().toISOString(),
      readBy: []
    };

    const list = [newAnn, ...this.announcements$.value];
    this.announcements$.next(list);
    this.saveLocal('speak_announcements', list);

    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'announcements', newAnn.id), newAnn);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  async markAnnouncementAsRead(annId: string, studentId: string) {
    const list = [...this.announcements$.value];
    const idx = list.findIndex(a => a.id === annId);
    if (idx !== -1) {
      const ann = list[idx];
      if (!ann.readBy.includes(studentId)) {
        const updated = {
          ...ann,
          readBy: [...ann.readBy, studentId]
        };
        list[idx] = updated;
        this.announcements$.next(list);
        this.saveLocal('speak_announcements', list);

        if (this.useFirebase) {
          try {
            await updateDoc(doc(this.firestore, 'announcements', annId), {
              readBy: arrayUnion(studentId)
            });
          } catch (e) {
            console.warn(e);
          }
        }
      }
    }
  }

  // --- PAYMENTS OPERATIONS ---
  observePayments(): Observable<Payment[]> { return this.payments$.asObservable(); }

  async updatePaymentStatus(payId: string, status: 'Paid' | 'Late' | 'Overdue', method?: string) {
    const list = [...this.payments$.value];
    const idx = list.findIndex(p => p.id === payId);
    if (idx !== -1) {
      const payment = list[idx];
      const updated: Payment = {
        ...payment,
        status,
        paidAt: status === 'Paid' ? new Date().toISOString().split('T')[0] : undefined,
        method: status === 'Paid' ? (method || 'Cash') : undefined
      };
      list[idx] = updated;
      this.payments$.next(list);
      this.saveLocal('speak_payments', list);

      if (this.useFirebase) {
        try {
          await setDoc(doc(this.firestore, 'payments', payId), updated);
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }

  async addPayment(pay: Omit<Payment, 'id'>) {
    const id = 'pay-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newPayment: Payment = {
      ...pay,
      id
    };
    
    const list = [...this.payments$.value, newPayment];
    this.payments$.next(list);
    this.saveLocal('speak_payments', list);

    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'payments', id), newPayment);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  async deletePayment(payId: string) {
    const list = this.payments$.value.filter(p => p.id !== payId);
    this.payments$.next(list);
    this.saveLocal('speak_payments', list);

    if (this.useFirebase) {
      try {
        await deleteDoc(doc(this.firestore, 'payments', payId));
      } catch (e) {
        console.warn(e);
      }
    }
  }

  // --- EVENTS OPERATIONS ---
  observeEvents(): Observable<EventItem[]> { return this.events$.asObservable(); }

  async registerForEvent(eventId: string, studentId: string) {
    const list = [...this.events$.value];
    const idx = list.findIndex(e => e.id === eventId);
    if (idx !== -1) {
      const event = list[idx];
      let updated: EventItem;
      if (event.registeredUsers.includes(studentId)) {
        updated = {
          ...event,
          registeredUsers: event.registeredUsers.filter(id => id !== studentId)
        };
      } else {
        updated = {
          ...event,
          registeredUsers: [...event.registeredUsers, studentId]
        };
      }
      list[idx] = updated;
      this.events$.next(list);
      this.saveLocal('speak_events', list);

      if (this.useFirebase) {
        try {
          if (event.registeredUsers.includes(studentId)) {
            await updateDoc(doc(this.firestore, 'events', eventId), {
              registeredUsers: arrayRemove(studentId)
            });
          } else {
            await updateDoc(doc(this.firestore, 'events', eventId), {
              registeredUsers: arrayUnion(studentId)
            });
          }
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }

  async addEvent(ev: Omit<EventItem, 'id' | 'registeredUsers'>) {
    const newEvent: EventItem = {
      ...ev,
      id: 'event-' + Date.now(),
      registeredUsers: []
    };

    const list = [newEvent, ...this.events$.value];
    this.events$.next(list);
    this.saveLocal('speak_events', list);

    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'events', newEvent.id), newEvent);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  // --- REWARDS OPERATIONS ---
  observeRewards(): Observable<LeaderboardReward[]> { return this.rewards$.asObservable(); }

  async addReward(r: Omit<LeaderboardReward, 'id' | 'assignedTo' | 'assignedName' | 'acknowledged'>) {
    const newReward: LeaderboardReward = {
      ...r,
      id: 'reward-' + Date.now(),
      assignedTo: null,
      assignedName: null,
      acknowledged: false
    };

    const list = [newReward, ...this.rewards$.value];
    this.rewards$.next(list);
    this.saveLocal('speak_rewards', list);

    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'rewards', newReward.id), newReward);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  async updateReward(rewardId: string, updates: Partial<LeaderboardReward>) {
    const list = [...this.rewards$.value];
    const idx = list.findIndex(r => r.id === rewardId);
    if (idx !== -1) {
      const updated = { ...list[idx], ...updates };
      list[idx] = updated;
      this.rewards$.next(list);
      this.saveLocal('speak_rewards', list);

      if (this.useFirebase) {
        try {
          await updateDoc(doc(this.firestore, 'rewards', rewardId), updates as any);
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }

  async assignReward(rewardId: string, studentId: string | null, studentName: string | null) {
    await this.updateReward(rewardId, {
      assignedTo: studentId,
      assignedName: studentName,
      acknowledged: false
    });
  }

  // --- REAL-TIME CHAT OPERATIONS ---
  observeChatMessages(channelId: string): Observable<ChatMessage[]> {
    const chatSubject = new BehaviorSubject<ChatMessage[]>([]);
    
    // Default chat fallback messages (starts empty)
    const defaultMessages: ChatMessage[] = [];

    if (this.useFirebase) {
      try {
        const messagesCol = collection(this.firestore, 'chat', channelId, 'messages');
        const q = query(messagesCol, orderBy('timestamp', 'asc'), limit(50));
        
        onSnapshot(q, (snap) => {
          const messages: ChatMessage[] = [];
          snap.forEach((doc) => {
            const data = doc.data();
            messages.push({
              id: doc.id,
              senderId: data['senderId'],
              senderName: data['senderName'],
              content: data['content'],
              timestamp: data['timestamp'],
              type: data['type'] || 'text',
              audioUrl: data['audioUrl']
            });
          });
          chatSubject.next(messages);
        }, (error) => {
          console.warn('Firestore chat snapshot failed. Falling back to local storage chat.', error);
          this.loadLocalChat(channelId, defaultMessages, chatSubject);
        });
      } catch (e) {
        console.warn('Firestore chat setup failed. Falling back to local storage chat.', e);
        this.loadLocalChat(channelId, defaultMessages, chatSubject);
      }
    } else {
      this.loadLocalChat(channelId, defaultMessages, chatSubject);
    }

    return chatSubject.asObservable();
  }

  private loadLocalChat(channelId: string, defaults: ChatMessage[], subject: BehaviorSubject<ChatMessage[]>) {
    const key = `speak_chat_${channelId}`;
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(defaults));
      subject.next(defaults);
    } else {
      const parsed = JSON.parse(data);
      const sanitized = parsed.map((m: any) => ({
        ...m,
        id: m.id || 'msg_' + new Date(m.timestamp).getTime() + '_' + Math.random().toString(36).substring(2, 9)
      }));
      subject.next(sanitized);
    }
  }

  async sendChatMessage(channelId: string, content: string, type: 'text' | 'audio' = 'text', audioUrl?: string) {
    const active = this.currentUser$.value;
    if (!active) return;

    const newMessage: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      senderId: active.id,
      senderName: active.name,
      content,
      timestamp: new Date().toISOString(),
      type
    };

    if (audioUrl) {
      newMessage.audioUrl = audioUrl;
    }

    if (this.useFirebase) {
      try {
        const messagesCol = collection(this.firestore, 'chat', channelId, 'messages');
        await addDoc(messagesCol, newMessage);
        return;
      } catch (e) {
        console.warn('Firestore send message failed. Falling back to local.', e);
      }
    }

    // Local Storage Fallback
    const key = `speak_chat_${channelId}`;
    const data = localStorage.getItem(key);
    const messages = data ? JSON.parse(data) : [];
    messages.push(newMessage);
    localStorage.setItem(key, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent('local-chat-update', { detail: { channelId } }));
  }

  async deleteChatMessage(channelId: string, messageId: string) {
    if (this.useFirebase) {
      try {
        const msgDocRef = doc(this.firestore, 'chat', channelId, 'messages', messageId);
        await deleteDoc(msgDocRef);
        return;
      } catch (e) {
        console.warn('Firestore delete message failed. Falling back to local.', e);
      }
    }

    const key = `speak_chat_${channelId}`;
    const data = localStorage.getItem(key);
    if (data) {
      const messages: ChatMessage[] = JSON.parse(data);
      const sanitized = messages.map((m: any) => ({
        ...m,
        id: m.id || 'msg_' + new Date(m.timestamp).getTime() + '_' + Math.random().toString(36).substring(2, 9)
      }));
      const filtered = sanitized.filter(m => m.id !== messageId);
      localStorage.setItem(key, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('local-chat-update', { detail: { channelId } }));
    }
  }

  async sendSimulatedChatMessage(channelId: string, senderName: string, content: string, senderId: string = 'simulated') {
    const newMessage: ChatMessage = {
      senderId,
      senderName,
      content,
      timestamp: new Date().toISOString()
    };

    if (this.useFirebase) {
      try {
        const messagesCol = collection(this.firestore, 'chat', channelId, 'messages');
        await addDoc(messagesCol, newMessage);
        return;
      } catch (e) {
        console.warn('Firestore send simulated message failed. Falling back to local.', e);
      }
    }

    // Local Storage Fallback
    const key = `speak_chat_${channelId}`;
    const localData = localStorage.getItem(key);
    const messagesList = localData ? JSON.parse(localData) : [];
    messagesList.push(newMessage);
    localStorage.setItem(key, JSON.stringify(messagesList));
    window.dispatchEvent(new CustomEvent('local-chat-update', { detail: { channelId } }));
  }

  observeChannels(): Observable<ChatChannel[]> {
    return this.channels$.asObservable();
  }

  async addChannel(name: string, isPrivate: boolean = false, members: string[] = []) {
    const cleanName = name.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-');
    const id = 'chan-' + Date.now();
    const newChan: ChatChannel = {
      id,
      name: cleanName,
      createdById: this.currentUser$.value?.id || 'teacher',
      createdByRole: this.currentUser$.value?.role || 'teacher',
      isPrivate,
      members
    };

    const list = [...this.channels$.value, newChan];
    this.channels$.next(list);
    this.saveLocal('speak_channels', list);

    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'channels', id), newChan);
      } catch (e) {
        console.warn('Firestore add channel failed.', e);
      }
    }
  }

  async deleteChannel(id: string) {
    const list = this.channels$.value.filter(c => c.id !== id);
    this.channels$.next(list);
    this.saveLocal('speak_channels', list);

    if (this.useFirebase) {
      try {
        await deleteDoc(doc(this.firestore, 'channels', id));
      } catch (e) {
        console.warn('Firestore delete channel failed.', e);
      }
    }
  }

  countryCodeToEmoji(code: string): string {
    if (!code) return '';
    const clean = code.trim().toUpperCase();
    if (clean.length !== 2) return code;
    try {
      const chars = clean.split('').map(char => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...chars);
    } catch (e) {
      return code;
    }
  }

  private async updateUserFlagInFirestore(userId: string, flagEmoji: string) {
    try {
      await updateDoc(doc(this.firestore, 'users', userId), { countryFlag: flagEmoji });
    } catch (e) {
      console.warn('Failed to update user flag emoji in Firestore:', e);
    }
  }

  private async clearOldMockMessagesOnce() {
    try {
      const channels = ['general', 'group-a', 'travel', 'debate'];
      for (const channelId of channels) {
        const messagesCol = collection(this.firestore, 'chat', channelId, 'messages');
        const snap = await getDocs(messagesCol);
        snap.forEach(async (d) => {
          const data = d.data();
          const content = data['content'] || '';
          const senderName = data['senderName'] || '';
          if (
            senderName.includes('Ousmane') ||
            senderName.includes('Fatou') ||
            senderName.includes('Kofi') ||
            senderName.includes('Aminata M') ||
            content.includes('speaking challenge') ||
            content.includes('recorded mine') ||
            content.includes('agree with Fatou') ||
            content.includes('get nervous')
          ) {
            await deleteDoc(d.ref);
            console.log('Cleaned up old mock message document:', d.id);
          }
        });

        // Also clean up local storage chats if they have these messages
        const localKey = `speak_chat_${channelId}`;
        const localData = localStorage.getItem(localKey);
        if (localData) {
          try {
            const msgs = JSON.parse(localData) as ChatMessage[];
            const filtered = msgs.filter(m => 
              !m.senderName.includes('Ousmane') &&
              !m.senderName.includes('Fatou') &&
              !m.senderName.includes('Kofi') &&
              !m.senderName.includes('Aminata M') &&
              !m.content.includes('speaking challenge') &&
              !m.content.includes('recorded mine') &&
              !m.content.includes('agree with Fatou') &&
              !m.content.includes('get nervous')
            );
            if (filtered.length !== msgs.length) {
              localStorage.setItem(localKey, JSON.stringify(filtered));
            }
          } catch(e) {}
        }
      }
    } catch (e) {
      console.warn('Failed to clear old mock messages:', e);
    }
  }

  observeVoiceChatEnabled(): Observable<boolean> {
    return this.voiceChatEnabled$.asObservable();
  }

  async setVoiceChatEnabled(enabled: boolean) {
    this.voiceChatEnabled$.next(enabled);
    localStorage.setItem('speak_voice_chat_enabled', enabled ? 'true' : 'false');
    
    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'settings', 'voice_chat'), { enabled });
      } catch (e) {
        console.warn(e);
      }
    }
  }

  getGeminiApiKey(): string | null {
    return localStorage.getItem('speak_gemini_api_key') || 'AIzaSyBdPuo__e2rAhMSC4QhZqdw-KmwWhndSOs';
  }

  setGeminiApiKey(key: string) {
    if (key) {
      localStorage.setItem('speak_gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('speak_gemini_api_key');
    }
  }

  async callGemini(systemInstruction: string, promptText: string): Promise<string> {
    const apiKey = this.getGeminiApiKey();
    if (!apiKey) {
      throw new Error('MISSING_API_KEY');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemInstruction}\n\nUser Input:\n${promptText}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `HTTP error! Status: ${response.status}`);
    }

    const resData = await response.json();
    let text = resData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error('Empty response from Gemini.');
    }
    // Strip markdown code block wrappers if any (e.g. ```json ... ```)
    text = text.trim();
    if (text.startsWith('```')) {
      const firstNewLine = text.indexOf('\n');
      const lastBackticks = text.lastIndexOf('```');
      if (firstNewLine !== -1 && lastBackticks !== -1 && lastBackticks > firstNewLine) {
        text = text.substring(firstNewLine + 1, lastBackticks).trim();
      }
    }
    return text;
  }

  async pingPresence() {
    const active = this.currentUser$.value;
    if (!active) return;
    try {
      const nowStr = new Date().toISOString();
      await this.updateCurrentUserProfile({ lastActive: nowStr });
    } catch (e) {
      console.warn('Failed to ping presence:', e);
    }
  }

  isUserOnline(user: UserProfile): boolean {
    if (!user.lastActive) return false;
    if (user.lastActive === 'Never' || user.lastActive === 'Today') return false;
    try {
      const lastActiveDate = new Date(user.lastActive);
      const diffMs = Date.now() - lastActiveDate.getTime();
      return diffMs < 45000;
    } catch (e) {
      return false;
    }
  }

  formatLastActive(lastActive: string): string {
    if (!lastActive) return 'Never';
    if (lastActive === 'Never' || lastActive === 'Today') return lastActive;
    try {
      const date = new Date(lastActive);
      const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSeconds < 0) return 'Just now';
      if (diffSeconds < 45) return 'Online';
      if (diffSeconds < 60) return '1m ago';
      const diffMinutes = Math.floor(diffSeconds / 60);
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch (e) {
      return 'Never';
    }
  }
}
