import { Injectable, signal } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, getDoc, getDocs, 
  updateDoc, onSnapshot, query, orderBy, limit, addDoc, 
  arrayUnion, arrayRemove, where, deleteDoc 
} from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

export interface UserGarden {
  trees: number;
  flowers: number;
  wiltedPlants: number;
  lastLessonDate: string;
  healthStatus: 'healthy' | 'wilted' | 'flourishing';
}

export interface ClubPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likes: string[];
}

export interface LearningClub {
  id: string;
  name: string;
  description: string;
  members: string[];
  weeklyXP: { [userId: string]: number };
  collectiveChallenge: {
    title: string;
    targetXP: number;
    currentXP: number;
    reward: number;
  };
  discussions: ClubPost[];
}

export interface MarketplaceItem {
  id: string;
  name: string;
  type: 'avatar' | 'frame' | 'theme';
  iconOrPreview: string;
  cost: number;
}

export interface JourneyMission {
  id: string;
  title: string;
  description: string;
  requiredTasks: {
    type: 'words' | 'video' | 'quiz' | 'listening' | 'writing' | 'final';
    title: string;
    target: number;
    current: number;
  }[];
  completed: boolean;
  unlocked: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  role: 'student' | 'teacher' | 'guest' | 'admin';
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
  placementTestAnswers?: { [key: number]: string };
  voiceChatAllowed?: boolean;
  description?: string;
  username?: string;
  password?: string;
  blocked?: boolean;
  status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  coins?: number;
  unlockedBadges?: string[];
  unlockedFrames?: string[];
  lastPracticeDate?: string;
  unlockedAvatars?: string[];
  unlockedThemes?: string[];
  activeFrame?: string;
  activeAvatar?: string;
  activeTheme?: string;
  activeTitle?: string;
  garden?: UserGarden;
  clubId?: string;
  readNotifications?: string[];
  deletedNotifications?: string[];
}

export interface SystemLog {
  id: string;
  userId: string;
  userName: string;
  userRole: 'student' | 'teacher' | 'guest' | 'admin';
  action: string;
  details: string;
  groupId?: string;
  createdAt: string;
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

export interface RegistrationRequest {
  id: string;
  name: string;
  level: string;
  countryFlag: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface DictionaryWord {
  id: string;
  word: string;
  translation: string;
  definition: string;
  partOfSpeech: string;
  phonetic?: string;
  contexts: string[];
  userId: string;
  savedAt: string;
}

export interface EbookPage {
  id: string;
  title: string;
  content: string;
  order: number;
  youtubeUrl?: string;
  youtubeDesc?: string;
}

export interface Ebook {
  id: string;
  title: string;
  author: string;
  level: string;
  description: string;
  coverEmoji: string;
  content: string;
  createdAt: string;
  views?: number;
  language?: 'fr' | 'en';
  coverColor?: string;
  coverGradient?: string;
  coverImageUrl?: string;
  status?: 'draft' | 'published';
  pages?: EbookPage[];
}

export interface AbuseReport {
  id: string;
  reportedUserId: string;
  reportedUserName: string;
  reporterUserId: string;
  reporterUserName: string;
  reason: string;
  details: string;
  createdAt: string;
  status: 'pending' | 'resolved';
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
  status: 'draft' | 'published';
  authorId?: string;
  authorName?: string;
  youtubeUrl?: string;
  youtubeDescription?: string;
  points?: number;
  attachments?: { name: string; size: string; type: string; base64: string }[];
  colorTheme?: string;
  coverImage?: string;
}

export interface Quiz {
  id: string;
  title: string;
  type: string;
  timeLimit: string;
  level?: string;
  points?: number;
  status: 'draft' | 'published';
  authorId?: string;
  authorName?: string;
  colorTheme?: string;
  coverImage?: string;
  youtubeUrl?: string;
  youtubeDescription?: string;
  isPlacementTest?: boolean;
  placementCategory?: string;
  isOfficialExam?: boolean;
  isExamActive?: boolean;
  deadline?: string;
  questions: {
    question: string;
    options: string[];
    correctOption: string;
    matchPairs?: { left: string; right: string }[];
    orderItems?: string[];
    audioPrompt?: string;
    explanation?: string;
  }[];
}

export interface Submission {
  id: string;
  studentId: string;
  studentName: string;
  lessonId: string;
  lessonTitle: string;
  type: 'text' | 'audio' | 'video';
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
  studentId?: string;
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

export type ExerciseType = 'writing' | 'speaking' | 'listening' | 'translation' | 'pronunciation' | 'vocabulary';

export interface Exercise {
  id: string;
  title: string;
  type: ExerciseType;
  level: string;
  groupId?: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  status: 'draft' | 'published';
  points: number;

  // Writing / Essay
  subject?: string;

  // Speaking
  speakingPrompt?: string;

  // Listening
  youtubeUrl?: string;
  listeningInstruction?: string;

  // Translation
  textToTranslate?: string;
  translationDirection?: 'fr-en' | 'en-fr';

  // Pronunciation
  textToPronounce?: string;

  // Vocabulary
  theme?: string;
  wordList?: string[];
}

export interface ActivityLog {
  id: string;
  studentId: string;
  type: 'quiz' | 'exercise' | 'vocabulary' | 'speaking' | 'listening' | 'exam';
  title: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  timeSpentSeconds?: number;
  teacherName?: string;
  status: 'completed' | 'pending' | 'failed';
  completedAt: string;
  quizId?: string;
  canRetry?: boolean;
  xpReward?: number;
}

export interface WordOfTheDay {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  translation: string;
  definition: string;
  example: string;
  exampleTranslation: string;
  updatedAt?: string;
}

export interface AppNotification {
  id: string;
  recipientId: string;
  recipientRole?: 'student' | 'teacher' | 'admin' | 'all';
  type: 'homework_submitted' | 'homework_graded' | 'new_student' | 'exam_completed' | 'exercise_assigned' | 'quiz_available' | 'grade_updated' | 'new_comment' | 'announcement' | 'reminder' | 'live_started';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface VocabGame {
  id: string;
  title: string;
  gameType: 'flashcards' | 'matching' | 'memory' | 'word_builder' | 'hangman' | 'multiple_choice' | 'word_search' | 'sentence_order' | 'error_hunt';
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  assignedGroupId?: string;
  authorId: string;
  createdAt: string;
  colorTheme?: string;
  coverImage?: string;
  status?: 'published' | 'draft';
  words: {
    word: string;
    definition: string;
    translation: string;
    imageUrl?: string;
    pronunciation?: string;
  }[];
}

export interface VocabGameAttempt {
  id: string;
  studentId: string;
  studentName: string;
  gameId: string;
  gameTitle: string;
  score: number;
  totalWords: number;
  timeTakenSeconds: number;
  completedAt: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  missedWords?: string[];
}

export interface ExamAttempt {
  id: string;
  studentId: string;
  studentName: string;
  quizId: string;
  quizTitle: string;
  answers: { questionIdx: number; answer: string; correct: boolean }[];
  score: number;
  percentage: number;
  timeTakenSeconds: number;
  completedAt: string;
  passed: boolean;
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
  type?: 'text' | 'audio' | 'video' | 'image' | 'file';
  audioUrl?: string;
  fileName?: string;
  fileSize?: string;
  reactions?: { [emoji: string]: string[] }; // emoji -> array of user IDs who reacted
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
  public openProfileCertificates = false;

  // Subjects for local reactive changes
  private users$ = new BehaviorSubject<UserProfile[]>([]);
  private lessons$ = new BehaviorSubject<Lesson[]>([]);
  private quizzes$ = new BehaviorSubject<Quiz[]>([]);
  get quizzes(): Quiz[] { return this.quizzes$.value; }
  private submissions$ = new BehaviorSubject<Submission[]>([]);
  private attendance$ = new BehaviorSubject<Attendance[]>([]);
  private schedules$ = new BehaviorSubject<LiveClass[]>([]);
  private announcements$ = new BehaviorSubject<Announcement[]>([]);
  private payments$ = new BehaviorSubject<Payment[]>([]);
  private events$ = new BehaviorSubject<EventItem[]>([]);
  private rewards$ = new BehaviorSubject<LeaderboardReward[]>([]);
  private registrationRequests$ = new BehaviorSubject<RegistrationRequest[]>([]);
  private voiceChatEnabled$ = new BehaviorSubject<boolean>(true);
  private dictionary$ = new BehaviorSubject<DictionaryWord[]>([]);
  private channels$ = new BehaviorSubject<ChatChannel[]>([]);
  private ebooks$ = new BehaviorSubject<Ebook[]>([]);
  private reports$ = new BehaviorSubject<AbuseReport[]>([]);
  private exercises$ = new BehaviorSubject<Exercise[]>([]);
  private activityLogs$ = new BehaviorSubject<ActivityLog[]>([]);
  private systemLogs$ = new BehaviorSubject<SystemLog[]>([]);
  autoApproveRegistrations = signal<boolean>(false);
  autoApproveStudents = signal<boolean>(false);
  autoApproveTeachers = signal<boolean>(false);

  private notifications$ = new BehaviorSubject<AppNotification[]>([]);
  private vocabGames$ = new BehaviorSubject<VocabGame[]>([]);
  private examAttempts$ = new BehaviorSubject<ExamAttempt[]>([]);
  private vocabGameAttempts$ = new BehaviorSubject<VocabGameAttempt[]>([]);
  private wordOfTheDay$ = new BehaviorSubject<WordOfTheDay>({
    word: 'Kitchen',
    phonetic: '/ˈkɪtʃ.ən/',
    partOfSpeech: 'noun',
    translation: 'La cuisine',
    definition: 'A room or area where food is prepared and cooked.',
    example: 'We usually eat breakfast in the kitchen.',
    exampleTranslation: 'Nous prenons habituellement notre petit-déjeuner dans la cuisine.'
  });
  
  private clubs$ = new BehaviorSubject<LearningClub[]>([]);
  private marketplaceItems$ = new BehaviorSubject<MarketplaceItem[]>([]);
  private journeyMissions$ = new BehaviorSubject<JourneyMission[]>([]);
  
  private showBoutique$ = new BehaviorSubject<boolean>(false);
  private showGarden$ = new BehaviorSubject<boolean>(false);
  private showJourney$ = new BehaviorSubject<boolean>(false);
  
  private currentUser$ = new BehaviorSubject<UserProfile | null>(null);
  private activeJitsiCall$ = new BehaviorSubject<LiveClass | null>(null);

  activeLang = signal<'fr' | 'en'>((localStorage.getItem('speakup_lang') as 'fr' | 'en') || 'en');
  requestedTabRedirect = signal<string | null>(null);

  setLanguage(lang: 'fr' | 'en') {
    this.activeLang.set(lang);
    localStorage.setItem('speakup_lang', lang);
  }

  private getLocal(key: string, defaults: any): any {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(data);
  }

  constructor() {
    const voiceChatLocal = localStorage.getItem('speak_voice_chat_enabled') !== 'false';
    this.voiceChatEnabled$.next(voiceChatLocal);

    const boutiqueLocal = localStorage.getItem('speak_settings_show_boutique') === 'true';
    this.showBoutique$.next(boutiqueLocal);

    const autoApproveLocal = localStorage.getItem('speak_settings_auto_approve_registrations') === 'true';
    this.autoApproveRegistrations.set(autoApproveLocal);
    this.autoApproveStudents.set(localStorage.getItem('speak_settings_auto_approve_students') === 'true');
    this.autoApproveTeachers.set(localStorage.getItem('speak_settings_auto_approve_teachers') === 'true');

    const gardenLocal = localStorage.getItem('speak_settings_show_garden') === 'true';
    this.showGarden$.next(gardenLocal);

    const journeyLocal = localStorage.getItem('speak_settings_show_journey') === 'true';
    this.showJourney$.next(journeyLocal);

    const localWord = localStorage.getItem('speak_word_of_the_day');
    if (localWord) {
      try {
        this.wordOfTheDay$.next(JSON.parse(localWord));
      } catch (e) {}
    }

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
      this.cleanupMockTeachers();
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
    // 1. Users (Pre-established 3 teachers + 1 admin)
    const defaultUsers: UserProfile[] = [
      { id: 'admin', name: 'AT - Admin', role: 'admin', level: 'C2', xp: 0, streak: 0, lastActive: 'Today', avatar: 'AD', username: 'admin', password: 'adminpassword', status: 'approved' },
      { id: 'teacher', name: 'AT - Teacher', role: 'teacher', level: 'C2', xp: 0, streak: 0, lastActive: 'Today', avatar: 'AT', username: 'teacher', password: 'admin123', status: 'approved' }
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
      { id: 'general', name: 'general' }
    ];

    // Read or write from LocalStorage
    const getLocal = (key: string, defaults: any) => this.getLocal(key, defaults);

    const rawUsers = getLocal('speak_users', defaultUsers);
    const users = (Array.isArray(rawUsers) ? rawUsers : []).filter((u: any) => u && u.id);
    defaultUsers.forEach(t => {
      const idx = users.findIndex((u: any) => u.id === t.id);
      if (idx === -1) {
        users.push(t);
      } else {
        // Always force canonical credentials for seeded default accounts
        users[idx].username = t.username;
        users[idx].password = t.password;
        users[idx].role = t.role;
        users[idx].name = t.name;
      }
    });

    // Auto-generate credentials for any existing users without them
    users.forEach((u: any) => {
      if (!u.password) {
        const baseName = u.name || 'user';
        u.username = baseName.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(10 + Math.random() * 90);
        u.password = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN code
      }
      if (!u.name) {
        u.name = u.username || 'User';
      }
    });

    localStorage.setItem('speak_users', JSON.stringify(users));

    users.forEach((u: UserProfile) => {
      if (u.countryFlag && u.countryFlag.trim().length === 2) {
        u.countryFlag = this.countryCodeToEmoji(u.countryFlag);
      }
    });
    const lessons = getLocal('speak_lessons', defaultLessons);
    const quizzes = getLocal('speak_quizzes', defaultQuizzes);
    // Pre-initialize Level Placement Tests for each category
    const placementCategories = [
      { id: 'placement-test-grammar', title: 'Grammar Level Placement Test', type: 'Multiple Choice', q1: 'She ___ to school every day.', o1: ['go', 'goes', 'going'], c1: 'B', q2: 'I am interested ___ learning English.', o2: ['in', 'at', 'on'], c2: 'A' },
      { id: 'placement-test-vocabulary', title: 'Vocabulary Level Placement Test', type: 'Multiple Choice', q1: 'What is the opposite of the word "generous"?', o1: ['stingy', 'kind', 'polite'], c1: 'A', q2: 'A person who designs buildings is an ___.', o2: ['architect', 'builder', 'painter'], c2: 'A' },
      { id: 'placement-test-speaking', title: 'Speaking Level Placement Test', type: 'Oral Practice', q1: 'Introduce yourself and describe your daily routine in English.', o1: [], c1: 'A', q2: 'Talk about your last vacation. Where did you go and what did you do?', o2: [], c2: 'A' },
      { id: 'placement-test-listening', title: 'Listening Level Placement Test', type: 'Multiple Choice', q1: 'Listen to the audio instructions and select the correct room number.', o1: ['Room 101', 'Room 202', 'Room 303'], c1: 'B', q2: 'What is the speaker\'s attitude towards online education?', o2: ['Skeptical', 'Enthusiastic', 'Indifferent'], c2: 'B' },
      { id: 'placement-test-translation', title: 'Translation Level Placement Test', type: 'Essay', q1: 'Translate into English: "Je veux apprendre l\'anglais pour voyager."', o1: [], c1: 'A', q2: 'Translate into French: "Learning a new language opens many doors."', o2: [], c2: 'A' },
      { id: 'placement-test-pronunciation', title: 'Pronunciation Level Placement Test', type: 'Oral Practice', q1: 'Read aloud: "The quick brown fox jumps over the lazy dog."', o1: [], c1: 'A', q2: 'Read aloud: "She sells seashells by the seashore."', o2: [], c2: 'A' }
    ];

    let quizzesModified = false;
    placementCategories.forEach(pt => {
      if (!quizzes.some((q: any) => q.id === pt.id)) {
        quizzes.unshift({
          id: pt.id,
          title: pt.title,
          type: pt.type,
          timeLimit: 'No limit',
          status: 'published',
          isPlacementTest: true,
          questions: pt.o1.length > 0 ? [
            { question: pt.q1, options: pt.o1, correctOption: pt.c1 },
            { question: pt.q2, options: pt.o2, correctOption: pt.c2 }
          ] : [
            { question: pt.q1, options: [], correctOption: 'A' },
            { question: pt.q2, options: [], correctOption: 'A' }
          ]
        });
        quizzesModified = true;
      }
    });

    if (!quizzes.some((q: any) => q.id === 'placement-test')) {
      quizzes.unshift({
        id: 'placement-test',
        title: 'English Level Placement Test (General)',
        type: 'Multiple Choice',
        timeLimit: 'No limit',
        status: 'published',
        isPlacementTest: true,
        questions: [
          { question: 'Choose the correct form: She ___ to school every day.', options: ['go', 'goes', 'going'], correctOption: 'B' },
          { question: 'Identify the correct preposition: I am interested ___ learning English.', options: ['in', 'at', 'on'], correctOption: 'A' }
        ]
      });
      quizzesModified = true;
    }

    if (quizzesModified) {
      localStorage.setItem('speak_quizzes', JSON.stringify(quizzes));
    }
    const submissions = getLocal('speak_submissions', defaultSubmissions);
    const attendance = getLocal('speak_attendance', defaultAttendance);
    const schedules = getLocal('speak_schedules', defaultLiveClasses);
    const announcements = getLocal('speak_announcements', defaultAnnouncements);
    const payments = getLocal('speak_payments', defaultPayments);
    const events = getLocal('speak_events', defaultEvents);
    const channels = getLocal('speak_channels', defaultChannels);
    localStorage.setItem('speak_channels', JSON.stringify(channels));

    const defaultRewards: LeaderboardReward[] = [
      { id: 'reward-1', title: 'Ticket de Cinéma', description: 'Une place de cinéma gratuite au Pathé Dakar.', xpThreshold: 300, assignedTo: null, assignedName: null, acknowledged: false },
      { id: 'reward-2', title: 'Bon d\'achat Auchan', description: 'Un bon d\'achat de 15,000 CFA utilisable à Auchan.', xpThreshold: 800, assignedTo: null, assignedName: null, acknowledged: false },
      { id: 'reward-3', title: 'Voyage Week-end', description: 'Un séjour de 2 jours à Saly Portudal tout compris.', xpThreshold: 2000, assignedTo: null, assignedName: null, acknowledged: false },
      { id: 'reward-4', title: 'Cours Particulier', description: '30 minutes de coaching individuel avec un professeur.', xpThreshold: 1500, assignedTo: null, assignedName: null, acknowledged: false },
      { id: 'reward-5', title: 'Abonnement Premium', description: '1 mois d\'accès premium à toutes les fonctionnalités.', xpThreshold: 5000, assignedTo: null, assignedName: null, acknowledged: false },
    ];
    const rewards = getLocal('speak_rewards', defaultRewards);
    
    // Ensure all default rewards exist in localStorage
    let currentRewards = getLocal('speak_rewards', defaultRewards);
    for (const dReward of defaultRewards) {
      if (!currentRewards.some((r: any) => r.id === dReward.id)) {
        currentRewards.push(dReward);
      }
    }
    localStorage.setItem('speak_rewards', JSON.stringify(currentRewards));
    const finalRewards = currentRewards;
    
    // Force rewards into the observable
    this.rewards$.next(finalRewards);
    console.log('Rewards loaded:', finalRewards.length, finalRewards);
    const defaultRequests: RegistrationRequest[] = [];
    const requests = getLocal('speak_registration_requests', defaultRequests);
    this.registrationRequests$.next(requests);
    
    // Ensure rewards are properly loaded
    this.rewards$.next(finalRewards);

    const defaultDictWords: DictionaryWord[] = [
      { id: 'w-1', word: 'Resilience', partOfSpeech: 'noun', translation: 'Résilience', definition: 'The capacity to recover quickly from difficulties; toughness.', phonetic: '/rɪˈzɪl.jəns/', contexts: ['Sa résilience l\'a aidée à surmonter le défi.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-2', word: 'Perseverance', partOfSpeech: 'noun', translation: 'Persévérance', definition: 'Persistence in doing something despite difficulty or delay in achieving success.', phonetic: '/ˌpɜː.sɪˈvɪə.rəns/', contexts: ['Through hard work and perseverance, he passed the exam.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-3', word: 'Eloquent', partOfSpeech: 'adjective', translation: 'Éloquent', definition: 'Fluent or persuasive in speaking or writing.', phonetic: '/ˈel.ə.kwənt/', contexts: ['She made an eloquent speech at the graduation.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-4', word: 'Ambiguous', partOfSpeech: 'adjective', translation: 'Ambigu', definition: 'Open to more than one interpretation; not having one obvious meaning.', phonetic: '/æmˈbɪɡ.ju.əs/', contexts: ['His answer was ambiguous, so we asked for clarification.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-5', word: 'Diligent', partOfSpeech: 'adjective', translation: 'Diligent / Assidu', definition: 'Having or showing care and conscientiousness in one\'s work or studies.', phonetic: '/ˈdɪl.ɪ.dʒənt/', contexts: ['A diligent student always finishes homework on time.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-6', word: 'Phenomenon', partOfSpeech: 'noun', translation: 'Phénomène', definition: 'A fact or situation that is observed to exist or happen, especially one whose cause is in question.', phonetic: '/fəˈnɒm.ɪ.nən/', contexts: ['Glaciers are a natural phenomenon.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-7', word: 'School', partOfSpeech: 'noun', translation: 'École', definition: 'An institution for educating children or students.', phonetic: '/skuːl/', contexts: ['We go to school every weekday.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-8', word: 'Teacher', partOfSpeech: 'noun', translation: 'Enseignant / Professeur', definition: 'A person who helps students to acquire knowledge or skills.', phonetic: '/ˈtiː.tʃər/', contexts: ['The English teacher explains grammar very clearly.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-9', word: 'Student', partOfSpeech: 'noun', translation: 'Étudiant / Élève', definition: 'A person who is studying at a school or college.', phonetic: '/ˈstjuː.dənt/', contexts: ['She is an outstanding student who loves reading.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-10', word: 'Lesson', partOfSpeech: 'noun', translation: 'Leçon / Cours', definition: 'A period of learning or teaching; a block of educational instruction.', phonetic: '/ˈles.ən/', contexts: ['Today\'s lesson is about reported speech.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-11', word: 'Vocabulary', partOfSpeech: 'noun', translation: 'Vocabulaire', definition: 'The body of words used in a particular language or activity.', phonetic: '/vəˈkæb.jə.ler.i/', contexts: ['Playing games helps you expand your English vocabulary.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-12', word: 'Grammar', partOfSpeech: 'noun', translation: 'Grammaire', definition: 'The whole system and structure of a language.', phonetic: '/ˈɡræm.ər/', contexts: ['Grammar rules help us form correct sentences.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-13', word: 'Pronunciation', partOfSpeech: 'noun', translation: 'Prononciation', definition: 'The way in which a word is pronounced.', phonetic: '/prəˌnʌn.siˈeɪ.ʃən/', contexts: ['Listen carefully to the audio to improve your pronunciation.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-14', word: 'Understand', partOfSpeech: 'verb', translation: 'Comprendre', definition: 'Perceive the intended meaning of words, language, or information.', phonetic: '/ˌʌn.dəˈstænd/', contexts: ['Do you understand this difficult concept?'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-15', word: 'Speak', partOfSpeech: 'verb', translation: 'Parler', definition: 'Say something in order to convey information or express feelings.', phonetic: '/spiːk/', contexts: ['I want to speak English fluently.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-16', word: 'Write', partOfSpeech: 'verb', translation: 'Écrire', definition: 'Mark letters or words on a surface, typically paper or screen.', phonetic: '/raɪt/', contexts: ['Please write your answer in the notebook.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-17', word: 'Read', partOfSpeech: 'verb', translation: 'Lire', definition: 'Look at and comprehend the meaning of written or printed matter.', phonetic: '/riːd/', contexts: ['Reading ebooks is a great way to study.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-18', word: 'Homework', partOfSpeech: 'noun', translation: 'Devoir', definition: 'Schoolwork that a student is given to do at home.', phonetic: '/ˈhəʊm.wɜːk/', contexts: ['The homework is due by next Friday.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-19', word: 'Exam', partOfSpeech: 'noun', translation: 'Examen', definition: 'A formal test of a person\'s knowledge or proficiency in a subject.', phonetic: '/ɪɡˈzæm/', contexts: ['Prepare well for the final exam.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-20', word: 'Success', partOfSpeech: 'noun', translation: 'Succès / Réussite', definition: 'The accomplishment of an aim or purpose.', phonetic: '/səkˈses/', contexts: ['Practice is the key to language success.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-21', word: 'Challenge', partOfSpeech: 'noun / verb', translation: 'Défi', definition: 'A call to take part in a contest or solve a difficult task.', phonetic: '/ˈtʃæl.ɪndʒ/', contexts: ['Learning English is a challenge, but it is rewarding.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-22', word: 'Opportunity', partOfSpeech: 'noun', translation: 'Opportunité', definition: 'A set of circumstances that makes it possible to do something.', phonetic: '/ˌɒp.əˈtʃuː.nə.ti/', contexts: ['Studying here is a great opportunity to practice speaking.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-23', word: 'Knowledge', partOfSpeech: 'noun', translation: 'Connaissance', definition: 'Facts, information, and skills acquired through experience or education.', phonetic: '/ˈnɒl.ɪdʒ/', contexts: ['He has a vast knowledge of English literature.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-24', word: 'Practice', partOfSpeech: 'noun / verb', translation: 'Pratique / S\'exercer', definition: 'Perform an activity repeatedly to improve or maintain proficiency.', phonetic: '/ˈpræk.tɪs/', contexts: ['Daily speaking practice makes a big difference.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-25', word: 'Improve', partOfSpeech: 'verb', translation: 'Améliorer', definition: 'Make or become better.', phonetic: '/ɪmˈpruːv/', contexts: ['We want to improve our listening comprehension.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-26', word: 'Fluent', partOfSpeech: 'adjective', translation: 'Courant', definition: 'Able to express oneself easily and articulately.', phonetic: '/ˈfluː.ənt/', contexts: ['She speaks fluent English and French.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-27', word: 'Conversation', partOfSpeech: 'noun', translation: 'Conversation', definition: 'An informal talk involving two or more people.', phonetic: '/ˌkɒn.vəˈseɪ.ʃən/', contexts: ['They had an interesting conversation about food.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-28', word: 'Water', partOfSpeech: 'noun', translation: 'Eau', definition: 'A colorless, transparent liquid essential for life.', phonetic: '/ˈwɔː.tər/', contexts: ['Drink some water to refresh yourself.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-29', word: 'Book', partOfSpeech: 'noun', translation: 'Livre', definition: 'A written or printed work consisting of pages bound together.', phonetic: '/bʊk/', contexts: ['This dictionary book contains many useful terms.'], userId: 'student', savedAt: new Date().toISOString() },
      { id: 'w-30', word: 'Friend', partOfSpeech: 'noun', translation: 'Ami', definition: 'A person with whom one has a bond of mutual affection.', phonetic: '/frend/', contexts: ['He introduced me to his best friend from class.'], userId: 'student', savedAt: new Date().toISOString() }
    ];
    const dictWords = getLocal('speak_dictionary', defaultDictWords);
    this.dictionary$.next(dictWords);

    const defaultEbooks: Ebook[] = [
      { id: 'eb-1', title: 'Les Clés de la Prononciation', author: 'Teacher', level: 'Beginner', description: 'Un guide d\'introduction simple pour maîtriser la phonétique et l\'accent anglais.', coverEmoji: '📘', content: 'Chapitre 1 : Les Sons Fondamentaux\nLa prononciation anglaise repose sur des sons distincts. Par exemple, le son "th" n\'existe pas en français. Pour le prononcer, placez votre langue entre vos dents...\n\nChapitre 2 : L\'Accent tonique\nContrairement au français où chaque syllabe a un poids égal, l\'anglais est une langue accentuée. Une syllabe par mot est prononcée plus fort et plus longuement. Ne pas respecter l\'accent tonique rend la compréhension difficile pour un anglophone natif.', createdAt: new Date().toISOString() }
    ];
    const ebooks = getLocal('speak_ebooks', defaultEbooks);
    this.ebooks$.next(ebooks);

    const defaultReports: AbuseReport[] = [];
    const reports = getLocal('speak_reports', defaultReports);
    this.reports$.next(reports);

    // New collections
    const exercises = getLocal('speak_exercises', []);
    this.exercises$.next(exercises);
    const activityLogs = getLocal('speak_activity_logs', []);
    this.activityLogs$.next(activityLogs);
    const notifications = getLocal('speak_notifications', []);
    this.notifications$.next(notifications);
    const vocabGames = getLocal('speak_vocab_games', []);
    this.vocabGames$.next(vocabGames);
    const examAttempts = getLocal('speak_exam_attempts', []);
    this.examAttempts$.next(examAttempts);
    const vocabGameAttempts = getLocal('speak_vocab_game_attempts', []);
    this.vocabGameAttempts$.next(vocabGameAttempts);
    const systemLogs = getLocal('speak_system_logs', []);
    this.systemLogs$.next(systemLogs);


    // --- Gamification Default Seeds ---
    const defaultClubs: LearningClub[] = [
      {
        id: 'club-1',
        name: 'English Beginners 🔰',
        description: 'Pour s\'entraider à maîtriser les bases de la langue de Shakespeare dans la joie !',
        members: ['student'],
        weeklyXP: { student: 120 },
        collectiveChallenge: { title: 'Atteindre 1 000 XP collectifs 🚀', targetXP: 1000, currentXP: 120, reward: 250 },
        discussions: [
          { id: 'p-1', authorId: 'teacher', authorName: 'AT - Teacher', authorAvatar: 'AT', content: 'Welcome to the Beginners club! Feel free to introduce yourselves here.', createdAt: new Date().toISOString(), likes: [] }
        ]
      },
      {
        id: 'club-2',
        name: 'Business English 👔',
        description: 'Optimisez votre anglais professionnel, CV, entretiens et réunions.',
        members: [],
        weeklyXP: {},
        collectiveChallenge: { title: 'Atteindre 2 000 XP collectifs 💼', targetXP: 2000, currentXP: 0, reward: 500 },
        discussions: []
      },
      {
        id: 'club-3',
        name: 'TOEFL Preparation 🎓',
        description: 'Entraînement intensif et partage d\'astuces pour obtenir le meilleur score possible.',
        members: [],
        weeklyXP: {},
        collectiveChallenge: { title: 'Résoudre 1500 XP collectifs 📚', targetXP: 1500, currentXP: 0, reward: 400 },
        discussions: []
      },
      {
        id: 'club-4',
        name: 'Travel English ✈️',
        description: 'Préparez vos voyages : vocabulaire de l\'aéroport, hôtel, restaurants, directions.',
        members: [],
        weeklyXP: {},
        collectiveChallenge: { title: 'Pratiquer 1000 XP collectifs 🗣️', targetXP: 1000, currentXP: 0, reward: 300 },
        discussions: []
      }
    ];

    const defaultMarketItems: MarketplaceItem[] = [
      { id: 'avatar-ninja', name: 'Cyber Ninja Avatar', type: 'avatar', iconOrPreview: '🥷', cost: 150 },
      { id: 'avatar-astronaut', name: 'Astro Explorer Avatar', type: 'avatar', iconOrPreview: '👨‍🚀', cost: 250 },
      { id: 'avatar-wizard', name: 'Magic Wizard Avatar', type: 'avatar', iconOrPreview: '🧙‍♂️', cost: 350 },
      { id: 'avatar-dragon', name: 'Golden Dragon Avatar', type: 'avatar', iconOrPreview: '🐉', cost: 500 },
      { id: 'frame-neon', name: 'Neon Frame', type: 'frame', iconOrPreview: 'border: 3px solid #00F5FF; box-shadow: 0 0 8px #00F5FF', cost: 100 },
      { id: 'frame-gold', name: 'Royal Gold Frame', type: 'frame', iconOrPreview: 'border: 3px solid #FFD700; box-shadow: 0 0 10px #FFD700', cost: 300 },
      { id: 'frame-rainbow', name: 'Rainbow Pulse Frame', type: 'frame', iconOrPreview: 'border: 3px solid; border-image: linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet) 1; box-shadow: 0 0 12px rgba(255,105,180,0.6)', cost: 500 },
      { id: 'theme-dark', name: 'Midnight Black Theme', type: 'theme', iconOrPreview: '#0B0F19', cost: 200 },
      { id: 'theme-forest', name: 'Forest Green Theme', type: 'theme', iconOrPreview: '#064E3B', cost: 200 },
      { id: 'theme-lavender', name: 'Lavender Dreams Theme', type: 'theme', iconOrPreview: '#4C1D95', cost: 250 }
    ];

    const defaultMissions: JourneyMission[] = [
      {
        id: 'mission-london',
        title: '🎯 Mission 1 : Préparer un voyage à Londres',
        description: 'Validez toutes les étapes pour être prêt pour votre premier vol vers le Royaume-Uni !',
        requiredTasks: [
          { type: 'words', title: 'Apprendre 30 mots de voyage dans le dictionnaire', target: 30, current: 0 },
          { type: 'video', title: 'Regarder la vidéo pédagogique sur l\'aéroport', target: 1, current: 0 },
          { type: 'quiz', title: 'Réussir le quiz de grammaire de voyage', target: 1, current: 0 },
          { type: 'listening', title: 'Écouter le dialogue de commande de ticket', target: 1, current: 0 },
          { type: 'writing', title: 'Écrire un court mail de réservation d\'hôtel', target: 1, current: 0 }
        ],
        completed: false,
        unlocked: true
      },
      {
        id: 'mission-interview',
        title: '🎯 Mission 2 : Décrocher un job à New York',
        description: 'Maîtrisez l\'anglais des affaires pour réussir votre entretien d\'embauche outre-Atlantique.',
        requiredTasks: [
          { type: 'words', title: 'Apprendre 20 mots de Business English', target: 20, current: 0 },
          { type: 'quiz', title: 'Réussir le quiz d\'entretien de recrutement', target: 1, current: 0 },
          { type: 'writing', title: 'Rédiger une lettre de motivation professionnelle', target: 1, current: 0 }
        ],
        completed: false,
        unlocked: false
      }
    ];

    const clubs = getLocal('speak_clubs', defaultClubs);
    this.clubs$.next(clubs);

    const marketItems = getLocal('speak_market_items', defaultMarketItems);
    this.marketplaceItems$.next(marketItems);

    const missions = getLocal('speak_missions', defaultMissions);
    this.journeyMissions$.next(missions);

    // Gamify student users on start
    users.forEach((u: UserProfile) => {
      if (u.role === 'student' || u.role === 'guest') {
        if (u.coins === undefined) u.coins = 350;
        if (!u.unlockedBadges) u.unlockedBadges = [];
        if (!u.unlockedFrames) u.unlockedFrames = [];
        if (!u.unlockedAvatars) u.unlockedAvatars = [];
        if (!u.unlockedThemes) u.unlockedThemes = [];
        if (!u.activeTitle) u.activeTitle = 'Explorer';
        if (!u.clubId && u.id === 'student') u.clubId = 'club-1';
        if (!u.garden) {
          u.garden = {
            trees: 1,
            flowers: 2,
            wiltedPlants: 0,
            lastLessonDate: new Date().toISOString(),
            healthStatus: 'healthy'
          };
        }
      }
    });
    localStorage.setItem('speak_users', JSON.stringify(users));

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
    let foundUser = savedUserId ? (users.find((u: UserProfile) => u.id === savedUserId) || null) : null;
    if (foundUser && (foundUser.status === 'pending' || foundUser.status === 'rejected' || foundUser.status === 'suspended' || (foundUser.blocked && foundUser.role !== 'student'))) {
      foundUser = null;
      localStorage.removeItem('speak_current_user_id');
    }
    this.currentUser$.next(foundUser);
    if (foundUser) {
      this.checkAndResetStreak(foundUser);
    }

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
        // Write default channels so #general always exists in Firestore
        for (const chan of this.channels$.value) {
          await setDoc(doc(this.firestore, 'channels', chan.id), chan);
        }

        console.log('Firestore seeded successfully.');
      } else {
        console.log('Firestore collections detected. Syncing default accounts then subscribing...');
        // Always force-update default/canonical accounts in Firestore (only credential fields)
        const canonicalAccounts = [
          { id: 'admin',     username: 'admin',    password: 'adminpassword', role: 'admin',   name: 'AT - Admin',          avatar: 'AD', status: 'approved' },
          { id: 'teacher',   username: 'teacher',  password: 'admin123',      role: 'teacher', name: 'AT - Teacher',         avatar: 'AT', status: 'approved' }
        ];
        for (const acct of canonicalAccounts) {
          try {
            await setDoc(
              doc(this.firestore, 'users', acct.id),
              { username: acct.username, password: acct.password, role: acct.role, name: acct.name, avatar: acct.avatar, status: acct.status },
              { merge: true }
            );
          } catch (e2) {
            console.warn('Could not sync canonical account', acct.id, e2);
          }
        }
        // Subscribe to Firestore collections to listen to changes in real-time
        this.setupFirebaseSubscriptions();
      }
    } catch (e) {
      console.warn('Error seeding Firebase, will continue in LocalStorage-first mode:', e);
      this.useFirebase = false;
    }
  }

  private setupFirebaseSubscriptions() {
    // 0. Subscribe to Notifications
    onSnapshot(collection(this.firestore, 'notifications'), (snap) => {
      const notifications: AppNotification[] = [];
      snap.forEach(docSnap => notifications.push(docSnap.data() as AppNotification));
      const sortedNotifs = notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      this.notifications$.next(sortedNotifs);
      this.saveLocal('speak_notifications', sortedNotifs);
    });

    // 1. Subscribe to Users
    onSnapshot(collection(this.firestore, 'users'), (snap) => {
      const users: UserProfile[] = [];
      snap.forEach(docSnap => {
        const u = docSnap.data() as UserProfile;
        if (u.countryFlag && u.countryFlag.trim().length === 2) {
          u.countryFlag = this.countryCodeToEmoji(u.countryFlag);
          this.updateUserFlagInFirestore(u.id, u.countryFlag);
        }
        users.push(u);
      });
      this.users$.next(users);
      this.saveLocal('speak_users', users);
      
      // Update active user profile if updated, and log out if status is invalid
      const active = this.currentUser$.value;
      if (active) {
        const fresh = users.find(u => u.id === active.id);
        if (fresh) {
          if (fresh.status === 'pending' || fresh.status === 'rejected' || fresh.status === 'suspended' || (fresh.blocked && fresh.role !== 'student')) {
            this.currentUser$.next(null);
            localStorage.removeItem('speak_current_user_id');
          } else {
            this.currentUser$.next(fresh);
          }
        }
      }
    });

    // 2. Subscribe to Lessons
    onSnapshot(collection(this.firestore, 'lessons'), (snap) => {
      const lessons: Lesson[] = [];
      snap.forEach(docSnap => lessons.push(docSnap.data() as Lesson));
      this.lessons$.next(lessons);
      this.saveLocal('speak_lessons', lessons);
    });

    // 3. Subscribe to Quizzes
    onSnapshot(collection(this.firestore, 'quizzes'), (snap) => {
      const quizzes: Quiz[] = [];
      snap.forEach(docSnap => quizzes.push(docSnap.data() as Quiz));
      
      const placementCategories = [
        { id: 'placement-test-grammar', title: 'Grammar Level Placement Test', type: 'Multiple Choice', q1: 'She ___ to school every day.', o1: ['go', 'goes', 'going'], c1: 'B', q2: 'I am interested ___ learning English.', o2: ['in', 'at', 'on'], c2: 'A' },
        { id: 'placement-test-vocabulary', title: 'Vocabulary Level Placement Test', type: 'Multiple Choice', q1: 'What is the opposite of the word "generous"?', o1: ['stingy', 'kind', 'polite'], c1: 'A', q2: 'A person who designs buildings is an ___.', o2: ['architect', 'builder', 'painter'], c2: 'A' },
        { id: 'placement-test-speaking', title: 'Speaking Level Placement Test', type: 'Oral Practice', q1: 'Introduce yourself and describe your daily routine in English.', o1: [], c1: 'A', q2: 'Talk about your last vacation. Where did you go and what did you do?', o2: [], c2: 'A' },
        { id: 'placement-test-listening', title: 'Listening Level Placement Test', type: 'Multiple Choice', q1: 'Listen to the audio instructions and select the correct room number.', o1: ['Room 101', 'Room 202', 'Room 303'], c1: 'B', q2: 'What is the speaker\'s attitude towards online education?', o2: ['Skeptical', 'Enthusiastic', 'Indifferent'], c2: 'B' },
        { id: 'placement-test-translation', title: 'Translation Level Placement Test', type: 'Essay', q1: 'Translate into English: "Je veux apprendre l\'anglais pour voyager."', o1: [], c1: 'A', q2: 'Translate into French: "Learning a new language opens many doors."', o2: [], c2: 'A' },
        { id: 'placement-test-pronunciation', title: 'Pronunciation Level Placement Test', type: 'Oral Practice', q1: 'Read aloud: "The quick brown fox jumps over the lazy dog."', o1: [], c1: 'A', q2: 'Read aloud: "She sells seashells by the seashore."', o2: [], c2: 'A' }
      ];

      placementCategories.forEach(pt => {
        if (!quizzes.some(q => q.id === pt.id)) {
          const ptQuiz: Quiz = {
            id: pt.id,
            title: pt.title,
            type: pt.type,
            timeLimit: 'No limit',
            status: 'published',
            isPlacementTest: true,
            questions: pt.o1.length > 0 ? [
              { question: pt.q1, options: pt.o1, correctOption: pt.c1 },
              { question: pt.q2, options: pt.o2, correctOption: pt.c2 }
            ] : [
              { question: pt.q1, options: [], correctOption: 'A' },
              { question: pt.q2, options: [], correctOption: 'A' }
            ]
          };
          quizzes.unshift(ptQuiz);
          setDoc(doc(this.firestore, 'quizzes', pt.id), ptQuiz).catch(e => console.warn(e));
        }
      });

      const hasPlacement = quizzes.some(q => q.id === 'placement-test');
      if (!hasPlacement) {
        const ptQuiz: Quiz = {
          id: 'placement-test',
          title: 'English Level Placement Test (General)',
          type: 'Multiple Choice',
          timeLimit: 'No limit',
          status: 'published',
          isPlacementTest: true,
          questions: [
            { question: 'Choose the correct form: She ___ to school every day.', options: ['go', 'goes', 'going'], correctOption: 'B' },
            { question: 'Identify the correct preposition: I am interested ___ learning English.', options: ['in', 'at', 'on'], correctOption: 'A' }
          ]
        };
        quizzes.unshift(ptQuiz);
        setDoc(doc(this.firestore, 'quizzes', 'placement-test'), ptQuiz).catch(e => console.warn(e));
      }
      this.quizzes$.next(quizzes);
      this.saveLocal('speak_quizzes', quizzes);
    });

    // 4. Subscribe to Submissions
    onSnapshot(collection(this.firestore, 'submissions'), (snap) => {
      const submissions: Submission[] = [];
      snap.forEach(docSnap => submissions.push(docSnap.data() as Submission));
      this.submissions$.next(submissions);
      this.saveLocal('speak_submissions', submissions);
    });

    // 5. Subscribe to Attendance
    onSnapshot(collection(this.firestore, 'attendance'), (snap) => {
      const attendance: Attendance[] = [];
      snap.forEach(docSnap => attendance.push(docSnap.data() as Attendance));
      this.attendance$.next(attendance);
      this.saveLocal('speak_attendance', attendance);
    });

    // 6. Subscribe to Schedules (Live Classes)
    onSnapshot(collection(this.firestore, 'schedules'), (snap) => {
      const schedules: LiveClass[] = [];
      snap.forEach(docSnap => schedules.push(docSnap.data() as LiveClass));
      this.schedules$.next(schedules);
      this.saveLocal('speak_schedules', schedules);
    });

    // 7. Subscribe to Announcements
    onSnapshot(collection(this.firestore, 'announcements'), (snap) => {
      const announcements: Announcement[] = [];
      snap.forEach(docSnap => announcements.push(docSnap.data() as Announcement));
      this.announcements$.next(announcements);
      this.saveLocal('speak_announcements', announcements);
    });

    // 8. Subscribe to Payments
    onSnapshot(collection(this.firestore, 'payments'), (snap) => {
      const payments: Payment[] = [];
      snap.forEach(docSnap => payments.push(docSnap.data() as Payment));
      this.payments$.next(payments);
      this.saveLocal('speak_payments', payments);
    });

    // 9. Subscribe to Events
    onSnapshot(collection(this.firestore, 'events'), (snap) => {
      const events: EventItem[] = [];
      snap.forEach(docSnap => events.push(docSnap.data() as EventItem));
      this.events$.next(events);
      this.saveLocal('speak_events', events);
    });

    // 10. Subscribe to Rewards
    onSnapshot(collection(this.firestore, 'rewards'), (snap) => {
      const list: LeaderboardReward[] = [];
      snap.forEach(docSnap => list.push(docSnap.data() as LeaderboardReward));
      this.rewards$.next(list);
      this.saveLocal('speak_rewards', list);
    });

    // 12. Subscribe to Registration Requests
    onSnapshot(collection(this.firestore, 'registration_requests'), (snap) => {
      const list: RegistrationRequest[] = [];
      snap.forEach(docSnap => list.push(docSnap.data() as RegistrationRequest));
      this.registrationRequests$.next(list);
      this.saveLocal('speak_registration_requests', list);
    });

    // 13. Subscribe to Dictionary Words
    onSnapshot(collection(this.firestore, 'dictionary'), (snap) => {
      const list: DictionaryWord[] = [];
      snap.forEach(docSnap => list.push(docSnap.data() as DictionaryWord));
      this.dictionary$.next(list);
      this.saveLocal('speak_dictionary', list);
    });

    // 14. Subscribe to Ebooks
    onSnapshot(collection(this.firestore, 'ebooks'), (snap) => {
      const list: Ebook[] = [];
      snap.forEach(docSnap => list.push(docSnap.data() as Ebook));
      this.ebooks$.next(list);
      this.saveLocal('speak_ebooks', list);
    });

    // 15. Subscribe to Abuse Reports
    onSnapshot(collection(this.firestore, 'reports'), (snap) => {
      const list: AbuseReport[] = [];
      snap.forEach(docSnap => list.push(docSnap.data() as AbuseReport));
      this.reports$.next(list);
      this.saveLocal('speak_reports', list);
    });

    // 11. Subscribe to Channels
    onSnapshot(collection(this.firestore, 'channels'), async (snap) => {
      const list: ChatChannel[] = [];
      for (const d of snap.docs) {
        const raw = d.data() as any;
        const docId = d.id;
        const rawName = raw.name || docId;
        const inferredPrivate = raw.isPrivate === true
          || rawName.startsWith('conv-')
          || docId.startsWith('dm-')
          || docId.startsWith('chan-');
        const chan: ChatChannel = {
          id: raw.id || docId,
          name: rawName,
          isPrivate: inferredPrivate,
          members: raw.members || [],
          createdById: raw.createdById,
          createdByRole: raw.createdByRole
        };
        const needsPatch = !raw.id || !raw.name || (inferredPrivate && !raw.isPrivate);
        if (needsPatch) {
          try {
            await setDoc(doc(this.firestore, 'channels', docId), chan, { merge: true });
          } catch (e) {
            console.warn('Could not patch channel', docId, e);
          }
        }
        list.push(chan);
      }
      if (list.length > 0) {
        this.channels$.next(list);
        this.saveLocal('speak_channels', list);
      } else {
        const defaults: ChatChannel[] = [
          { id: 'general', name: 'general' },
          { id: 'group-a', name: 'study-group-a' },
          { id: 'travel', name: 'travel-dialogue' },
          { id: 'debate', name: 'debate-club' }
        ];
        for (const chan of defaults) {
          try {
            await setDoc(doc(this.firestore, 'channels', chan.id), chan);
          } catch (e) {
            console.warn('Could not seed default channel', chan.id, e);
          }
        }
        this.channels$.next(defaults);
        this.saveLocal('speak_channels', defaults);
      }
    });

    // 10. Subscribe to Settings
    onSnapshot(doc(this.firestore, 'settings', 'voice_chat'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        this.voiceChatEnabled$.next(!!data['enabled']);
      }
    });

    // 16. Subscribe to System Logs
    onSnapshot(collection(this.firestore, 'system_logs'), (snap) => {
      const list: SystemLog[] = [];
      snap.forEach(docSnap => list.push(docSnap.data() as SystemLog));
      this.systemLogs$.next(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    });

    // 17. Subscribe to Vocab Game Attempts
    onSnapshot(collection(this.firestore, 'vocab_game_attempts'), (snap) => {
      const list: VocabGameAttempt[] = [];
      snap.forEach(docSnap => list.push(docSnap.data() as VocabGameAttempt));
      this.vocabGameAttempts$.next(list.sort((a, b) => b.completedAt.localeCompare(a.completedAt)));
    });

    // 18. Subscribe to settings/word_of_the_day
    onSnapshot(doc(this.firestore, 'settings', 'word_of_the_day'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as WordOfTheDay;
        this.wordOfTheDay$.next(data);
        this.saveLocal('speak_word_of_the_day', data);
      }
    });

    // 19. Subscribe to settings/show_boutique & show_garden & show_journey
    onSnapshot(doc(this.firestore, 'settings', 'show_boutique'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const value = !!data['value'];
        this.showBoutique$.next(value);
        localStorage.setItem('speak_settings_show_boutique', String(value));
      }
    });

    onSnapshot(doc(this.firestore, 'settings', 'show_garden'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const value = !!data['value'];
        this.showGarden$.next(value);
        localStorage.setItem('speak_settings_show_garden', String(value));
      }
    });

    onSnapshot(doc(this.firestore, 'settings', 'show_journey'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const value = !!data['value'];
        this.showJourney$.next(value);
        localStorage.setItem('speak_settings_show_journey', String(value));
      }
    });

    onSnapshot(doc(this.firestore, 'settings', 'auto_approve_registrations'), (docSnap) => {
      if (docSnap.exists()) {
        const val = docSnap.data()['enabled'] === true;
        this.autoApproveRegistrations.set(val);
        localStorage.setItem('speak_settings_auto_approve_registrations', String(val));
      }
    });

    onSnapshot(doc(this.firestore, 'settings', 'auto_approve_students'), (docSnap) => {
      if (docSnap.exists()) {
        const val = docSnap.data()['enabled'] === true;
        this.autoApproveStudents.set(val);
        localStorage.setItem('speak_settings_auto_approve_students', String(val));
      }
    });

    onSnapshot(doc(this.firestore, 'settings', 'auto_approve_teachers'), (docSnap) => {
      if (docSnap.exists()) {
        const val = docSnap.data()['enabled'] === true;
        this.autoApproveTeachers.set(val);
        localStorage.setItem('speak_settings_auto_approve_teachers', String(val));
      }
    });

    onSnapshot(collection(this.firestore, 'exercises'), (snap) => {
      const list: Exercise[] = [];
      snap.forEach(docSnap => list.push(docSnap.data() as Exercise));
      this.exercises$.next(list);
      this.saveLocal('speak_exercises', list);
    });

    onSnapshot(collection(this.firestore, 'vocab_games'), (snap) => {
      const list: VocabGame[] = [];
      snap.forEach(docSnap => list.push(docSnap.data() as VocabGame));
      this.vocabGames$.next(list);
      this.saveLocal('speak_vocab_games', list);
    });

    combineLatest([
      this.currentUser$,
      this.submissions$,
      this.activityLogs$,
      this.dictionary$,
      this.vocabGameAttempts$
    ]).subscribe(([user, subs, logs, dict, vocab]) => {
      if (user && (user.role === 'student' || user.role === 'guest')) {
        this.recalculateJourneyProgress(user.id, subs, logs, dict, vocab);
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
  getCurrentUser(): UserProfile | null { return this.currentUser$.value; }

  async checkAndResetStreak(user: UserProfile) {
    if (user.role === 'student' && user.streak > 0 && user.lastPracticeDate) {
      const todayStr = new Date().toISOString().split('T')[0];
      const today = new Date(todayStr);
      const last = new Date(user.lastPracticeDate);
      const diffTime = today.getTime() - last.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 1) {
        const list = [...this.users$.value];
        const userIndex = list.findIndex(u => u.id === user.id);
        if (userIndex !== -1) {
          const updated = {
            ...user,
            streak: 0
          };
          list[userIndex] = updated;
          this.users$.next(list);
          this.saveLocal('speak_users', list);
          this.currentUser$.next(updated);
          
          if (this.useFirebase) {
            try {
              const { updateDoc, doc } = await import('firebase/firestore');
              await updateDoc(doc(this.firestore, 'users', user.id), { streak: 0 });
            } catch (e) {
              console.warn(e);
            }
          }
        }
      }
    }
  }

  setCurrentUser(userId: string) {
    const user = this.users$.value.find(u => u.id === userId);
    if (user) {
      this.currentUser$.next(user);
      localStorage.setItem('speak_current_user_id', userId);
      this.logAction('login', `Connexion à l'application`);
      this.checkAndResetStreak(user);
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
        if (existingUser.blocked || existingUser.status === 'suspended') {
          throw new Error('Votre compte est suspendu. Veuillez contacter un professeur.');
        }
        if (existingUser.status === 'pending') {
          throw new Error('Votre demande d\'inscription est en cours de validation.');
        }
        if (existingUser.status === 'rejected') {
          throw new Error('Votre demande d\'inscription a été refusée.');
        }
        this.setCurrentUser(existingUser.id);
        return existingUser;
      }
      
      const avatar = name.slice(0,2).toUpperCase();
      const autoApprove = (desiredRole === 'student' ? this.autoApproveStudents() : this.autoApproveTeachers());
      const status = autoApprove ? 'approved' : 'pending';
      const newProfile: UserProfile = {
        id: uid,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        role: desiredRole,
        level: desiredRole === 'student' ? 'B1' : 'C2',
        xp: 0,
        streak: 0,
        lastActive: 'Today',
        lastPracticeDate: '',
        avatar,
        status,
        registeredAt: new Date().toISOString()
      };
      
      const list = [...this.users$.value, newProfile];
      this.users$.next(list);
      this.saveLocal('speak_users', list);
      
      if (desiredRole === 'student') {
        await this.addStudentToDefaultChannels(uid);
      }

      if (status === 'approved') {
        this.setCurrentUser(uid);
      } else {
        throw new Error('Votre demande d\'inscription est en cours de validation.');
      }
      
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
      if (existingUser.blocked || existingUser.status === 'suspended') {
        throw new Error('Votre compte est suspendu. Veuillez contacter un professeur.');
      }
      if (existingUser.status === 'pending') {
        throw new Error('Votre demande d\'inscription est en cours de validation.');
      }
      if (existingUser.status === 'rejected') {
        throw new Error('Votre demande d\'inscription a été refusée.');
      }
      this.setCurrentUser(existingUser.id);
      return existingUser;
    } else {
      const id = googleUser.uid;
      const name = googleUser.displayName || 'Google User';
      const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'G';
      
      const autoApprove = (desiredRole === 'student' ? this.autoApproveStudents() : this.autoApproveTeachers());
      const status = autoApprove ? 'approved' : 'pending';
      const newProfile: UserProfile = {
        id,
        name,
        role: desiredRole,
        level: desiredRole === 'student' ? 'B1' : 'C2',
        xp: 0,
        streak: 0,
        lastActive: 'Today',
        avatar,
        status,
        registeredAt: new Date().toISOString()
      };
      
      const list = [...this.users$.value, newProfile];
      this.users$.next(list);
      this.saveLocal('speak_users', list);

      await setDoc(doc(this.firestore, 'users', id), newProfile);
      
      if (desiredRole === 'student') {
        await this.addStudentToDefaultChannels(id);
      }

      if (status === 'approved') {
        this.setCurrentUser(id);
      } else {
        throw new Error('Votre demande d\'inscription est en cours de validation.');
      }
      
      return newProfile;
    }
  }

  logout() {
    this.currentUser$.next(null);
    localStorage.removeItem('speak_current_user_id');
  }

  cleanDocData(data: any): any {
    if (data === null || data === undefined) return null;
    if (Array.isArray(data)) {
      return data.map(item => this.cleanDocData(item));
    }
    if (typeof data === 'object') {
      const cleaned: any = {};
      for (const key of Object.keys(data)) {
        const val = data[key];
        if (val !== undefined) {
          cleaned[key] = this.cleanDocData(val);
        }
      }
      return cleaned;
    }
    return data;
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
        const cleaned = this.cleanDocData(updates);
        await setDoc(doc(this.firestore, 'users', active.id), cleaned, { merge: true });
      } catch (e) {
        console.warn('Firestore update profile failed:', e);
      }
    }
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const list = [...this.users$.value];
    const idx = list.findIndex(u => u.id === userId);
    let updated: UserProfile | null = null;
    if (idx !== -1) {
      updated = { ...list[idx], ...updates };
      list[idx] = updated;
      this.users$.next(list);
      this.saveLocal('speak_users', list);
    }

    // Keep currentUser in sync and log out in real-time if blocked/suspended/pending/rejected
    const active = this.currentUser$.value;
    if (active && active.id === userId) {
      const currentFresh = updated || active;
      if (currentFresh.status === 'pending' || currentFresh.status === 'rejected' || currentFresh.status === 'suspended' || (currentFresh.blocked && currentFresh.role !== 'student')) {
        this.currentUser$.next(null);
        localStorage.removeItem('speak_current_user_id');
      } else {
        this.currentUser$.next(currentFresh);
      }
    }

    if (this.useFirebase) {
      try {
        const cleaned = this.cleanDocData(updates);
        await setDoc(doc(this.firestore, 'users', userId), cleaned, { merge: true });
      } catch (e) {
        console.warn('Firestore updateUserProfile failed:', e);
      }
    }
  }

  async deleteUser(userId: string) {
    const list = this.users$.value.filter(u => u.id !== userId);
    this.users$.next(list);
    this.saveLocal('speak_users', list);

    if (this.useFirebase) {
      try {
        await deleteDoc(doc(this.firestore, 'users', userId));
      } catch (e) {
        console.warn('Firestore delete user failed:', e);
      }
    }
  }

  async addAdmin(name: string, customUsername?: string, customPassword?: string): Promise<UserProfile | null> {
    const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const id = 'admin-' + baseName + '-' + Date.now().toString().slice(-4);
    const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';
    const username = customUsername?.trim() || (baseName + Math.floor(10 + Math.random() * 90));
    const password = customPassword?.trim() || Math.floor(1000 + Math.random() * 9000).toString();

    // Check username uniqueness
    const exists = this.users$.value.find(u => u.username?.toLowerCase() === username.toLowerCase());
    if (exists) return null;

    const newAdmin: UserProfile = {
      id,
      name,
      role: 'admin',
      level: 'C2',
      xp: 0,
      streak: 0,
      lastActive: 'Today',
      avatar,
      username,
      password,
      blocked: false,
      registeredAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const users = [...this.users$.value, newAdmin];
    this.users$.next(users);
    this.saveLocal('speak_users', users);

    if (this.useFirebase) {
      try {
        const { setDoc, doc } = await import('firebase/firestore');
        await setDoc(doc(this.firestore, 'users', id), newAdmin);
      } catch (e) {
        console.warn('Firestore addAdmin failed:', e);
      }
    }

    return newAdmin;
  }

  async addTeacher(name: string, customUsername?: string, customPassword?: string): Promise<UserProfile | null> {
    const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const id = 'teacher-' + baseName + '-' + Date.now().toString().slice(-4);
    const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'TC';
    const username = customUsername?.trim() || (baseName + Math.floor(10 + Math.random() * 90));
    const password = customPassword?.trim() || Math.floor(1000 + Math.random() * 9000).toString();

    // Check username uniqueness
    const exists = this.users$.value.find(u => u.username?.toLowerCase() === username.toLowerCase());
    if (exists) return null;

    const newTeacher: UserProfile = {
      id,
      name,
      role: 'teacher',
      level: 'C2',
      xp: 0,
      streak: 0,
      lastActive: 'Today',
      avatar,
      username,
      password,
      blocked: false,
      status: 'approved',
      registeredAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };

    const users = [...this.users$.value, newTeacher];
    this.users$.next(users);
    this.saveLocal('speak_users', users);

    if (this.useFirebase) {
      try {
        const { setDoc, doc } = await import('firebase/firestore');
        await setDoc(doc(this.firestore, 'users', id), newTeacher);
      } catch (e) {
        console.warn('Firestore addTeacher failed:', e);
      }
    }

    return newTeacher;
  }

  async addStudent(name: string, level: string, countryFlag: string = '', registrationFee: number = 10000, monthlyFee: number = 7000) {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Date.now().toString().slice(-4);
    const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const isGuest = level === 'Guest';
    const generatedUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(10 + Math.random() * 90);
    const generatedPassword = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit PIN

    const newStudent: UserProfile = {
      id,
      name,
      role: isGuest ? 'guest' : 'student',
      level,
      xp: 0,
      streak: 0,
      lastActive: 'Never',
      avatar,
      countryFlag,
      registrationFee,
      monthlyFee,
      registeredAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      username: generatedUsername,
      password: generatedPassword,
      blocked: false,
      status: 'approved'
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

    // Auto add to public channels
    await this.addStudentToDefaultChannels(id);

    return newStudent;
  }

  async addStudentToDefaultChannels(studentId: string) {
    const list = [...this.channels$.value];
    let updated = false;
    for (let i = 0; i < list.length; i++) {
      const chan = list[i];
      if (!chan.isPrivate) {
        const members = chan.members || [];
        if (!members.includes(studentId)) {
          list[i] = { ...chan, members: [...members, studentId] };
          updated = true;
          if (this.useFirebase) {
            try {
              const { updateDoc, doc } = await import('firebase/firestore');
              await updateDoc(doc(this.firestore, 'channels', chan.id), {
                members: arrayUnion(studentId)
              });
            } catch(e) {}
          }
        }
      }
    }
    if (updated) {
      this.channels$.next(list);
      this.saveLocal('speak_channels', list);
    }
  }

  async registerUserProfile(name: string, username: string, password: string, level: string, country: string, role: 'student' | 'teacher') {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Date.now().toString().slice(-4);
    const avatar = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'US';
    const generatedUsername = username.trim().toLowerCase();
    
    // Check username uniqueness
    const exists = this.users$.value.find(u => u.username?.toLowerCase() === generatedUsername);
    if (exists) {
      throw new Error("Ce nom d'utilisateur est déjà pris.");
    }

    const newProfile: UserProfile = {
      id,
      name,
      username: generatedUsername,
      password: password.trim(),
      level,
      countryFlag: country,
      role,
      status: (role === 'student' ? this.autoApproveStudents() : this.autoApproveTeachers()) ? 'approved' : 'pending',
      xp: 0,
      streak: 0,
      lastActive: 'Never',
      lastPracticeDate: '',
      avatar,
      blocked: false,
      registeredAt: new Date().toISOString()
    };

    const users = [...this.users$.value, newProfile];
    this.users$.next(users);
    this.saveLocal('speak_users', users);

    if (this.useFirebase) {
      try {
        const { setDoc, doc } = await import('firebase/firestore');
        await setDoc(doc(this.firestore, 'users', id), newProfile);
      } catch (e) {
        console.warn('Firestore registerUserProfile failed:', e);
      }
    }

    // Auto add to public channels if role is student
    if (role === 'student') {
      await this.addStudentToDefaultChannels(id);
    }
    
    return newProfile;
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
      { id: 'admin', name: 'AT - Admin', role: 'admin', level: 'C2', xp: 0, streak: 0, lastActive: 'Today', avatar: 'AD', username: 'admin', password: 'adminpassword', status: 'approved' },
      { id: 'teacher', name: 'AT - Teacher', role: 'teacher', level: 'C2', xp: 0, streak: 0, lastActive: 'Today', avatar: 'AT', username: 'teacher', password: 'admin123', status: 'approved' }
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
      const newCoins = (user.coins || 0) + xpToAdd; // 1 Coin per 1 XP
      
      let newStreak = user.streak || 0;
      const todayStr = new Date().toISOString().split('T')[0];
      const lastDate = (user as any).lastPracticeDate;

      if (addStreak) {
        if (!lastDate) {
          newStreak = 1;
        } else {
          const today = new Date(todayStr);
          const last = new Date(lastDate);
          const diffTime = today.getTime() - last.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            newStreak = (user.streak || 0) + 1;
          } else if (diffDays > 1) {
            newStreak = 1;
          }
          // If diffDays === 0, keep same streak
        }
      }

      const updated = {
        ...user,
        xp: user.xp + xpToAdd,
        coins: newCoins,
        streak: newStreak,
        lastPracticeDate: addStreak ? todayStr : (lastDate || ''),
        lastActive: 'Today'
      };
      
      list[userIndex] = updated;
      this.users$.next(list);
      this.saveLocal('speak_users', list);

      if (this.currentUser$.value?.id === userId) {
        this.currentUser$.next(updated);
      }

      // Check streak badges
      if (newStreak >= 10) {
        this.unlockBadgeForUser(userId, 'streak-10');
      }
      if (newStreak >= 100) {
        this.unlockBadgeForUser(userId, 'streak-100');
      }

      // Update club weekly XP and collective challenge progress
      if (updated.clubId) {
        const clubsList = [...this.clubs$.value];
        const club = clubsList.find(c => c.id === updated.clubId);
        if (club) {
          club.weeklyXP[userId] = (club.weeklyXP[userId] || 0) + xpToAdd;
          club.collectiveChallenge.currentXP = Math.min(
            club.collectiveChallenge.targetXP,
            club.collectiveChallenge.currentXP + xpToAdd
          );

          // Check if collective challenge is met
          if (club.collectiveChallenge.currentXP >= club.collectiveChallenge.targetXP) {
            // Reward all club members with challenge coins!
            club.members.forEach(mId => {
              this.addCoinsToUser(mId, club.collectiveChallenge.reward);
            });
            // Reset collective challenge with new objective
            club.collectiveChallenge = {
              title: 'Défi Club : Atteindre un nouveau sommet ! 🚀',
              targetXP: club.collectiveChallenge.targetXP + 500,
              currentXP: 0,
              reward: club.collectiveChallenge.reward + 100
            };
          }

          this.clubs$.next(clubsList);
          this.saveLocal('speak_clubs', clubsList);
        }
      }

      if (this.useFirebase) {
        try {
          await updateDoc(doc(this.firestore, 'users', userId), {
            xp: updated.xp,
            coins: updated.coins,
            streak: updated.streak,
            lastPracticeDate: updated.lastPracticeDate,
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
    await this.logAction('create_lesson', `Cours créé : "${newLesson.title}"`);
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
      await this.logAction('modify_lesson', `Cours modifié : "${updated.title}"`);
    }
  }

  async deleteLesson(lessonId: string) {
    const deletedLesson = this.lessons$.value.find(l => l.id === lessonId);
    const title = deletedLesson ? deletedLesson.title : lessonId;

    const list = this.lessons$.value.filter(l => l.id !== lessonId);
    this.lessons$.next(list);
    this.saveLocal('speak_lessons', list);

    if (this.useFirebase) {
      try {
        await deleteDoc(doc(this.firestore, 'lessons', lessonId));
      } catch (e) {
        console.warn(e);
      }
    }
    await this.logAction('delete_lesson', `Cours supprimé : "${title}"`);
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
    await this.logAction('create_quiz', `Quiz créé : "${newQuiz.title}"`);
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
      await this.logAction('modify_quiz', `Quiz modifié : "${updated.title}"`);
    }
  }

  async deleteQuiz(quizId: string) {
    const deletedQuiz = this.quizzes$.value.find(q => q.id === quizId);
    const title = deletedQuiz ? deletedQuiz.title : quizId;

    const list = this.quizzes$.value.filter(q => q.id !== quizId);
    this.quizzes$.next(list);
    this.saveLocal('speak_quizzes', list);

    if (this.useFirebase) {
      try {
        await deleteDoc(doc(this.firestore, 'quizzes', quizId));
      } catch (e) {
        console.warn(e);
      }
    }
    await this.logAction('delete_quiz', `Quiz supprimé : "${title}"`);
  }

  // --- SUBMISSIONS OPERATIONS ---
  observeSubmissions(): Observable<Submission[]> { return this.submissions$.asObservable(); }

  async submitHomework(lessonId: string, lessonTitle: string, type: 'text' | 'audio' | 'video', content: string, customXpReward?: number) {
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
      xpReward: customXpReward || 50,
      graded: false,
      submittedAt: new Date().toISOString()
    };

    const list = [newSub, ...this.submissions$.value];
    this.submissions$.next(list);
    this.saveLocal('speak_submissions', list);

    // Increment daily streak for active practice
    await this.updateUserXP(activeUser.id, 0, true);

    if (this.useFirebase) {
      try {
        const cleaned = this.cleanDocData(newSub);
        await setDoc(doc(this.firestore, 'submissions', newSub.id), cleaned);
      } catch (e) {
        console.warn(e);
      }
    }
    await this.logAction('exercise_completed', `Exercice soumis pour "${lessonTitle}" (Type: ${type})`);
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
      await this.logAction('homework_graded', `Devoir corrigé pour ${sub.studentName} : Note ${score} (XP +${xpReward})`);
    }
  }

  async deleteSubmission(subId: string) {
    const list = this.submissions$.value.filter(s => s.id !== subId);
    this.submissions$.next(list);
    this.saveLocal('speak_submissions', list);

    if (this.useFirebase) {
      try {
        await deleteDoc(doc(this.firestore, 'submissions', subId));
      } catch (e) {
        console.warn(e);
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
  getSchedulesValue(): LiveClass[] { return this.schedules$.value; }
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

  observeWhiteboard(classId: string): Observable<any[]> {
    const subject = new BehaviorSubject<any[]>([]);
    const localKey = 'speak_whiteboard_' + classId;
    subject.next(this.getLocal(localKey, []));

    if (this.useFirebase && this.firestore) {
      try {
        const colRef = collection(this.firestore, 'schedules', classId, 'whiteboard');
        onSnapshot(colRef, (snap) => {
          const list: any[] = [];
          snap.forEach(d => list.push(d.data()));
          subject.next(list);
          this.saveLocal(localKey, list);
        });
      } catch (e) {
        console.warn(e);
      }
    }
    return subject.asObservable();
  }

  async addWhiteboardElement(classId: string, el: any) {
    const localKey = 'speak_whiteboard_' + classId;
    const list = this.getLocal(localKey, []);
    list.push(el);
    this.saveLocal(localKey, list);

    if (this.useFirebase && this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'schedules', classId, 'whiteboard', el.id), el);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  observeSpeechPrompter(classId: string): Observable<any> {
    const subject = new BehaviorSubject<any>(null);
    const localKey = 'speak_speech_prompter_' + classId;
    subject.next(this.getLocal(localKey, null));

    if (this.useFirebase && this.firestore) {
      try {
        const docRef = doc(this.firestore, 'schedules', classId, 'speechPrompter', 'active');
        onSnapshot(docRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            subject.next(data);
            this.saveLocal(localKey, data);
          } else {
            subject.next(null);
            this.saveLocal(localKey, null);
          }
        });
      } catch (e) {
        console.warn(e);
      }
    }
    return subject.asObservable();
  }

  async setSpeechPrompter(classId: string, data: { text: string, targetStudent: string, senderName: string }) {
    const localKey = 'speak_speech_prompter_' + classId;
    this.saveLocal(localKey, data);

    if (this.useFirebase && this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'schedules', classId, 'speechPrompter', 'active'), data);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  async updateWhiteboardElement(classId: string, elId: string, data: any) {
    const localKey = 'speak_whiteboard_' + classId;
    const list = this.getLocal(localKey, []);
    const idx = list.findIndex((x: any) => x.id === elId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...data };
      this.saveLocal(localKey, list);
    }

    if (this.useFirebase && this.firestore) {
      try {
        await updateDoc(doc(this.firestore, 'schedules', classId, 'whiteboard', elId), data);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  async deleteWhiteboardElement(classId: string, elId: string) {
    const localKey = 'speak_whiteboard_' + classId;
    const list = this.getLocal(localKey, []).filter((x: any) => x.id !== elId);
    this.saveLocal(localKey, list);

    if (this.useFirebase && this.firestore) {
      try {
        await deleteDoc(doc(this.firestore, 'schedules', classId, 'whiteboard', elId));
      } catch (e) {
        console.warn(e);
      }
    }
  }

  async clearWhiteboard(classId: string) {
    const localKey = 'speak_whiteboard_' + classId;
    this.saveLocal(localKey, []);

    if (this.useFirebase && this.firestore) {
      try {
        const snap = await getDocs(collection(this.firestore, 'schedules', classId, 'whiteboard'));
        const promises: Promise<any>[] = [];
        snap.forEach(d => {
          promises.push(deleteDoc(doc(this.firestore, 'schedules', classId, 'whiteboard', d.id)));
        });
        await Promise.all(promises);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  observeLiveChat(classId: string): Observable<any[]> {
    const subject = new BehaviorSubject<any[]>([]);
    const localKey = 'speak_livechat_' + classId;
    subject.next(this.getLocal(localKey, []));

    if (this.useFirebase && this.firestore) {
      try {
        const colRef = collection(this.firestore, 'schedules', classId, 'liveChat');
        onSnapshot(colRef, (snap) => {
          const list: any[] = [];
          snap.forEach(d => list.push(d.data()));
          list.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
          subject.next(list);
          this.saveLocal(localKey, list);
        });
      } catch (e) {
        console.warn(e);
      }
    }
    return subject.asObservable();
  }

  async sendLiveChatMessage(classId: string, msg: any) {
    const localKey = 'speak_livechat_' + classId;
    const list = this.getLocal(localKey, []);
    list.push(msg);
    this.saveLocal(localKey, list);

    if (this.useFirebase && this.firestore) {
      try {
        await setDoc(doc(this.firestore, 'schedules', classId, 'liveChat', msg.id), msg);
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

  async startAiPracticeCall(studentName: string) {
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0].substring(0, 5);
    return await this.scheduleClass({
      title: `AI Practice: ${studentName}`,
      description: `Private speaking practice room with speakUp-bot`,
      date: todayStr,
      time: timeStr,
      duration: '60 mins',
      group: 'AI-Practice'
    }, 'active');
  }

  async startChannelLiveCall(channelId: string, channelName: string) {
    const todayStr = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().split(' ')[0].substring(0, 5);
    return await this.scheduleClass({
      title: `Live Call: ${channelName}`,
      description: `Private live session in channel #${channelName}`,
      date: todayStr,
      time: timeStr,
      duration: '60 mins',
      group: channelName
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
    return newAnn;
  }

  async updateAnnouncement(annId: string, updatedData: Partial<Announcement>) {
    const list = [...this.announcements$.value];
    const idx = list.findIndex(a => a.id === annId);
    if (idx !== -1) {
      const updated = { ...list[idx], ...updatedData };
      list[idx] = updated;
      this.announcements$.next(list);
      this.saveLocal('speak_announcements', list);

      if (this.useFirebase) {
        try {
          await setDoc(doc(this.firestore, 'announcements', annId), updated);
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }

  async deleteAnnouncement(annId: string) {
    const list = this.announcements$.value.filter(a => a.id !== annId);
    this.announcements$.next(list);
    this.saveLocal('speak_announcements', list);

    if (this.useFirebase) {
      try {
        await deleteDoc(doc(this.firestore, 'announcements', annId));
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

  async updateEvent(eventId: string, updatedData: Partial<EventItem>) {
    const list = [...this.events$.value];
    const idx = list.findIndex(e => e.id === eventId);
    if (idx !== -1) {
      const updated = { ...list[idx], ...updatedData };
      list[idx] = updated;
      this.events$.next(list);
      this.saveLocal('speak_events', list);

      if (this.useFirebase) {
        try {
          await setDoc(doc(this.firestore, 'events', eventId), updated);
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }

  async deleteEvent(eventId: string) {
    const list = this.events$.value.filter(e => e.id !== eventId);
    this.events$.next(list);
    this.saveLocal('speak_events', list);

    if (this.useFirebase) {
      try {
        await deleteDoc(doc(this.firestore, 'events', eventId));
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

  async deleteReward(rewardId: string) {
    const list = this.rewards$.value.filter(r => r.id !== rewardId);
    this.rewards$.next(list);
    this.saveLocal('speak_rewards', list);

    if (this.useFirebase) {
      try {
        await deleteDoc(doc(this.firestore, 'rewards', rewardId));
      } catch (e) {
        console.warn('Firestore delete reward failed:', e);
      }
    }
  }

  // --- REGISTRATION REQUESTS OPERATIONS ---
  observeRegistrationRequests(): Observable<RegistrationRequest[]> {
    return this.registrationRequests$.asObservable();
  }

  async submitRegistrationRequest(name: string, level: string, countryFlag: string) {
    const newRequest: RegistrationRequest = {
      id: 'req-' + Date.now(),
      name,
      level,
      countryFlag,
      requestedAt: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: 'pending'
    };

    const list = [newRequest, ...this.registrationRequests$.value];
    this.registrationRequests$.next(list);
    this.saveLocal('speak_registration_requests', list);

    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'registration_requests', newRequest.id), newRequest);
      } catch (e) {
        console.warn(e);
      }
    }
  }

  async approveRegistrationRequest(requestId: string): Promise<UserProfile | null> {
    const list = [...this.registrationRequests$.value];
    const idx = list.findIndex(r => r.id === requestId);
    if (idx !== -1) {
      const req = list[idx];
      const updated: RegistrationRequest = { ...req, status: 'approved' };
      list[idx] = updated;
      this.registrationRequests$.next(list);
      this.saveLocal('speak_registration_requests', list);

      if (this.useFirebase) {
        try {
          await updateDoc(doc(this.firestore, 'registration_requests', requestId), { status: 'approved' });
        } catch (e) {
          console.warn(e);
        }
      }

      // Automatically create the student or teacher profile!
      if (req.level === 'Teacher') {
        const user = await this.addTeacher(req.name);
        return user;
      } else {
        const isGuest = req.level === 'Guest';
        const user = await this.addStudent(
          req.name,
          req.level,
          req.countryFlag,
          isGuest ? 0 : 10000,
          isGuest ? 0 : 7000
        );
        return user;
      }
    }
    return null;
  }

  async rejectRegistrationRequest(requestId: string) {
    const list = [...this.registrationRequests$.value];
    const idx = list.findIndex(r => r.id === requestId);
    if (idx !== -1) {
      const updated: RegistrationRequest = { ...list[idx], status: 'rejected' };
      list[idx] = updated;
      this.registrationRequests$.next(list);
      this.saveLocal('speak_registration_requests', list);

      if (this.useFirebase) {
        try {
          await updateDoc(doc(this.firestore, 'registration_requests', requestId), { status: 'rejected' });
        } catch (e) {
          console.warn(e);
        }
      }
    }
  }

  // --- DICTIONARY OPERATIONS ---
  observeDictionary(): Observable<DictionaryWord[]> {
    return this.dictionary$.asObservable();
  }

  async addWordToDictionary(word: Omit<DictionaryWord, 'id' | 'savedAt'>) {
    const newWord: DictionaryWord = {
      ...word,
      id: 'w-' + Date.now(),
      savedAt: new Date().toISOString()
    };

    const list = [newWord, ...this.dictionary$.value];
    this.dictionary$.next(list);
    this.saveLocal('speak_dictionary', list);

    // Award 5 XP and increment streak
    const activeUser = this.currentUser$.value;
    if (activeUser) {
      await this.updateUserXP(activeUser.id, 5, true);
    }

    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'dictionary', newWord.id), newWord);
      } catch (e) {
        console.warn(e);
      }
    }
    await this.logAction('add_vocab', `Mot ajouté au dictionnaire : "${newWord.word}" (${newWord.translation})`);
  }

  async deleteWordFromDictionary(wordId: string) {
    const wordObj = this.dictionary$.value.find(w => w.id === wordId);
    const label = wordObj ? wordObj.word : wordId;

    const list = this.dictionary$.value.filter(w => w.id !== wordId);
    this.dictionary$.next(list);
    this.saveLocal('speak_dictionary', list);

    if (this.useFirebase) {
      try {
        await deleteDoc(doc(this.firestore, 'dictionary', wordId));
      } catch (e) {
        console.warn(e);
      }
    }
    await this.logAction('add_vocab', `Mot supprimé du dictionnaire : "${label}"`);
  }

  // --- EBOOKS OPERATIONS ---
  observeEbooks(): Observable<Ebook[]> {
    return this.ebooks$.asObservable();
  }

  async addEbook(eb: Omit<Ebook, 'id' | 'createdAt'>) {
    const newEbook: Ebook = {
      ...eb,
      id: 'eb-' + Date.now(),
      createdAt: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    const list = [newEbook, ...this.ebooks$.value];
    this.ebooks$.next(list);
    this.saveLocal('speak_ebooks', list);

    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'ebooks', newEbook.id), newEbook);
      } catch (e) {
        console.warn('Firestore add ebook failed:', e);
      }
    }
  }

  async deleteEbook(ebookId: string) {
    const list = this.ebooks$.value.filter(b => b.id !== ebookId);
    this.ebooks$.next(list);
    this.saveLocal('speak_ebooks', list);

    if (this.useFirebase) {
      try {
        await deleteDoc(doc(this.firestore, 'ebooks', ebookId));
      } catch (e) {
        console.warn('Firestore delete ebook failed:', e);
      }
    }
  }

  async updateEbook(ebookId: string, eb: Partial<Ebook>) {
    const list = [...this.ebooks$.value];
    const idx = list.findIndex(b => b.id === ebookId);
    if (idx !== -1) {
      const updated = { ...list[idx], ...eb };
      list[idx] = updated;
      this.ebooks$.next(list);
      this.saveLocal('speak_ebooks', list);

      if (this.useFirebase) {
        try {
          await updateDoc(doc(this.firestore, 'ebooks', ebookId), eb);
        } catch (e) {
          console.warn('Firestore update ebook failed:', e);
        }
      }
    }
  }

  async incrementEbookViews(ebookId: string) {
    const list = [...this.ebooks$.value];
    const idx = list.findIndex(b => b.id === ebookId);
    if (idx !== -1) {
      const views = (list[idx].views || 0) + 1;
      const updated = { ...list[idx], views };
      list[idx] = updated;
      this.ebooks$.next(list);
      this.saveLocal('speak_ebooks', list);
      if (this.useFirebase) {
        try {
          await setDoc(doc(this.firestore, 'ebooks', ebookId), updated);
        } catch (e) {
          console.warn('Firestore increment ebook views failed:', e);
        }
      }
    }
  }

  // --- ABUSE REPORTS OPERATIONS ---
  observeReports(): Observable<AbuseReport[]> {
    return this.reports$.asObservable();
  }

  async addReport(rep: Omit<AbuseReport, 'id' | 'createdAt' | 'status'>) {
    const newReport: AbuseReport = {
      ...rep,
      id: 'rep-' + Date.now(),
      createdAt: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      status: 'pending'
    };

    const list = [newReport, ...this.reports$.value];
    this.reports$.next(list);
    this.saveLocal('speak_reports', list);

    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'reports', newReport.id), newReport);
      } catch (e) {
        console.warn('Firestore add report failed:', e);
      }
    }
  }

  async resolveReport(reportId: string) {
    const list = this.reports$.value.map(r => r.id === reportId ? { ...r, status: 'resolved' as const } : r);
    this.reports$.next(list);
    this.saveLocal('speak_reports', list);

    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'reports', reportId), { status: 'resolved' }, { merge: true });
      } catch (e) {
        console.warn('Firestore resolve report failed:', e);
      }
    }
  }

  async deleteReport(reportId: string) {
    const list = this.reports$.value.filter(r => r.id !== reportId);
    this.reports$.next(list);
    this.saveLocal('speak_reports', list);

    if (this.useFirebase) {
      try {
        await deleteDoc(doc(this.firestore, 'reports', reportId));
      } catch (e) {
        console.warn('Firestore delete report failed:', e);
      }
    }
  }

  // --- REAL-TIME CHAT OPERATIONS ---
  observeChatMessages(channelId: string): Observable<ChatMessage[]> {
    const user = this.currentUser$.value;
    if (user && user.role !== 'admin' && user.role !== 'teacher') {
      const channel = this.channels$.value.find(c => c.id === channelId);
      if (channel) {
        const members = channel.members || [];
        if (!members.includes(user.id)) {
          return new BehaviorSubject<ChatMessage[]>([]).asObservable();
        }
      }
    }

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
              audioUrl: data['audioUrl'],
              fileName: data['fileName'],
              fileSize: data['fileSize'],
              reactions: data['reactions']
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

    if (active.role !== 'admin' && active.role !== 'teacher') {
      const channel = this.channels$.value.find(c => c.id === channelId);
      if (channel) {
        const members = channel.members || [];
        if (!members.includes(active.id)) {
          throw new Error("Vous n'êtes pas membre de ce groupe.");
        }
      }
    }

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
        await this.logAction('message_sent', `Message envoyé dans #${channelId} (${type === 'audio' ? 'Vocal' : 'Texte'})`, channelId);
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
    await this.logAction('message_sent', `Message envoyé dans #${channelId} (${type === 'audio' ? 'Vocal' : 'Texte'})`, channelId);
  }

  async sendChatMessageWithAttachment(channelId: string, content: string, type: 'image' | 'file', fileName: string, fileSize: string) {
    const active = this.currentUser$.value;
    if (!active) return;

    if (active.role !== 'admin' && active.role !== 'teacher') {
      const channel = this.channels$.value.find(c => c.id === channelId);
      if (channel) {
        const members = channel.members || [];
        if (!members.includes(active.id)) {
          throw new Error("Vous n'êtes pas membre de ce groupe.");
        }
      }
    }

    const newMessage: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      senderId: active.id,
      senderName: active.name,
      content,
      timestamp: new Date().toISOString(),
      type,
      fileName,
      fileSize
    };

    if (this.useFirebase) {
      try {
        const messagesCol = collection(this.firestore, 'chat', channelId, 'messages');
        await addDoc(messagesCol, newMessage);
        await this.logAction('message_sent', `Fichier envoyé dans #${channelId} (${fileName})`, channelId);
        return;
      } catch (e) {
        console.warn('Firestore send file failed. Falling back to local.', e);
      }
    }

    // Local Storage Fallback
    const key = `speak_chat_${channelId}`;
    const data = localStorage.getItem(key);
    const messages = data ? JSON.parse(data) : [];
    messages.push(newMessage);
    localStorage.setItem(key, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent('local-chat-update', { detail: { channelId } }));
    await this.logAction('message_sent', `Fichier envoyé dans #${channelId} (${fileName})`, channelId);
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

  async toggleMessageReaction(channelId: string, messageId: string, emoji: string, userId: string): Promise<void> {
    if (this.useFirebase) {
      try {
        const msgDocRef = doc(this.firestore, 'chat', channelId, 'messages', messageId);
        const snap = await getDoc(msgDocRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          const reactions = { ...(data.reactions || {}) };
          const existed = (data.reactions?.[emoji] || []).includes(userId);

          // Clear user from all other reactions
          Object.keys(reactions).forEach(k => {
            reactions[k] = (reactions[k] || []).filter((id: string) => id !== userId);
            if (reactions[k].length === 0) {
              delete reactions[k];
            }
          });

          // Toggle current one
          if (!existed) {
            if (!reactions[emoji]) reactions[emoji] = [];
            reactions[emoji].push(userId);
          }

          await updateDoc(msgDocRef, { reactions });
        }
        return;
      } catch (e) {
        console.warn('Firestore reaction failed. Falling back to local.', e);
      }
    }

    // Local Storage Fallback
    const key = `speak_chat_${channelId}`;
    const data = localStorage.getItem(key);
    if (data) {
      const messages: ChatMessage[] = JSON.parse(data);
      const msg = messages.find(m => m.id === messageId);
      if (msg) {
        if (!msg.reactions) msg.reactions = {};
        const existed = (msg.reactions[emoji] || []).includes(userId);

        // Clear user from all other reactions
        Object.keys(msg.reactions).forEach(k => {
          msg.reactions![k] = (msg.reactions![k] || []).filter(id => id !== userId);
          if (msg.reactions![k].length === 0) {
            delete msg.reactions![k];
          }
        });

        // Toggle current one
        if (!existed) {
          if (!msg.reactions[emoji]) msg.reactions[emoji] = [];
          msg.reactions[emoji].push(userId);
        }
      }
      localStorage.setItem(key, JSON.stringify(messages));
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
    await this.logAction('create_group', `Groupe créé : "#${cleanName}" (${isPrivate ? 'Privé' : 'Public'})`, id);
  }

  async addMemberToChannel(channelId: string, memberId: string) {
    const list = [...this.channels$.value];
    const idx = list.findIndex(c => c.id === channelId);
    if (idx !== -1) {
      const channel = { ...list[idx] };
      if (!channel.members) channel.members = [];
      if (!channel.members.includes(memberId)) {
        channel.members.push(memberId);
      }
      list[idx] = channel;
      this.channels$.next(list);
      this.saveLocal('speak_channels', list);

      if (this.useFirebase) {
        try {
          await setDoc(doc(this.firestore, 'channels', channelId), channel);
        } catch (e) {
          console.warn('Firestore update channel members failed.', e);
        }
      }
      await this.logAction('create_group', `Membre ajouté au groupe #${channel.name}`, channelId);
    }
  }

  async removeMemberFromChannel(channelId: string, memberId: string) {
    const list = [...this.channels$.value];
    const idx = list.findIndex(c => c.id === channelId);
    if (idx !== -1) {
      const channel = { ...list[idx] };
      if (channel.members) {
        channel.members = channel.members.filter(m => m !== memberId);
      }
      list[idx] = channel;
      this.channels$.next(list);
      this.saveLocal('speak_channels', list);

      if (this.useFirebase) {
        try {
          await setDoc(doc(this.firestore, 'channels', channelId), channel);
        } catch (e) {
          console.warn('Firestore update channel members failed.', e);
        }
      }
      await this.logAction('create_group', `Membre retiré du groupe #${channel.name}`, channelId);
    }
  }

  async addChannelWithId(id: string, chan: ChatChannel) {
    // Don't add duplicates
    if (this.channels$.value.find(c => c.id === id)) return;

    const list = [...this.channels$.value, chan];
    this.channels$.next(list);
    this.saveLocal('speak_channels', list);

    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'channels', id), chan);
      } catch (e) {
        console.warn('Firestore addChannelWithId failed.', e);
      }
    }
  }

  async deleteChannel(id: string) {
    const chan = this.channels$.value.find(c => c.id === id);
    const name = chan ? chan.name : id;

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
    await this.logAction('create_group', `Groupe supprimé : "#${name}"`, id);
  }

  async renameChannel(id: string, newName: string) {
    const list = this.channels$.value.map(c => c.id === id ? { ...c, name: newName } : c);
    this.channels$.next(list);
    this.saveLocal('speak_channels', list);

    if (this.useFirebase) {
      try {
        await updateDoc(doc(this.firestore, 'channels', id), { name: newName });
      } catch (e) {
        console.warn('Firestore rename channel failed.', e);
      }
    }
    await this.logAction('create_group', `Groupe renommé en : "#${newName}"`, id);
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

  private async cleanupMockTeachers() {
    if (!this.useFirebase) return;
    try {
      await deleteDoc(doc(this.firestore, 'users', 'teacher-2'));
      await deleteDoc(doc(this.firestore, 'users', 'teacher-3'));
      console.log('Mock teachers teacher-2 and teacher-3 cleaned up.');
    } catch (e) {
      console.warn('Failed to cleanup mock teachers:', e);
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

  async setAutoApproveRegistrations(enabled: boolean) {
    this.autoApproveRegistrations.set(enabled);
    localStorage.setItem('speak_settings_auto_approve_registrations', String(enabled));
    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'settings', 'auto_approve_registrations'), { enabled });
      } catch (e) {
        console.warn(e);
      }
    }
  }

  async setAutoApproveStudents(enabled: boolean) {
    this.autoApproveStudents.set(enabled);
    localStorage.setItem('speak_settings_auto_approve_students', String(enabled));
    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'settings', 'auto_approve_students'), { enabled });
      } catch (e) {
        console.warn(e);
      }
    }
  }

  async setAutoApproveTeachers(enabled: boolean) {
    this.autoApproveTeachers.set(enabled);
    localStorage.setItem('speak_settings_auto_approve_teachers', String(enabled));
    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'settings', 'auto_approve_teachers'), { enabled });
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

  // --- EXERCISE OPERATIONS ---
  observeExercises(): Observable<Exercise[]> { return this.exercises$.asObservable(); }

  async addExercise(exercise: Omit<Exercise, 'id' | 'createdAt'>): Promise<Exercise> {
    const newEx: Exercise = {
      ...exercise,
      id: 'ex-' + Date.now(),
      createdAt: new Date().toISOString()
    };
    const list = [newEx, ...this.exercises$.value];
    this.exercises$.next(list);
    this.saveLocal('speak_exercises', list);
    if (this.useFirebase) {
      try { await setDoc(doc(this.firestore, 'exercises', newEx.id), newEx); } catch(e) { console.warn(e); }
    }
    return newEx;
  }

  async updateExercise(id: string, updates: Partial<Exercise>) {
    const list = [...this.exercises$.value];
    const idx = list.findIndex(e => e.id === id);
    if (idx !== -1) {
      const updated = { ...list[idx], ...updates };
      list[idx] = updated;
      this.exercises$.next(list);
      this.saveLocal('speak_exercises', list);
      if (this.useFirebase) {
        try { await updateDoc(doc(this.firestore, 'exercises', id), updates); } catch(e) { console.warn(e); }
      }
    }
  }

  async deleteExercise(id: string) {
    const list = this.exercises$.value.filter(e => e.id !== id);
    this.exercises$.next(list);
    this.saveLocal('speak_exercises', list);
    if (this.useFirebase) {
      try { await deleteDoc(doc(this.firestore, 'exercises', id)); } catch(e) { console.warn(e); }
    }
  }

  // --- ACTIVITY LOG OPERATIONS ---
  observeActivityLogs(): Observable<ActivityLog[]> { return this.activityLogs$.asObservable(); }

  async logActivity(log: Omit<ActivityLog, 'id'>): Promise<void> {
    const newLog: ActivityLog = { ...log, id: 'log-' + Date.now() };
    const list = [newLog, ...this.activityLogs$.value];
    this.activityLogs$.next(list);
    this.saveLocal('speak_activity_logs', list);
    if (this.useFirebase) {
      try { await setDoc(doc(this.firestore, 'activity_logs', newLog.id), newLog); } catch(e) { console.warn(e); }
    }
  }

  getStudentActivityLogs(studentId: string): ActivityLog[] {
    return this.activityLogs$.value.filter(l => l.studentId === studentId);
  }

  // --- SYSTEM LOGS OPERATIONS ---
  observeSystemLogs(): Observable<SystemLog[]> { return this.systemLogs$.asObservable(); }

  async logAction(action: string, details: string, groupId?: string) {
    const user = this.currentUser$.value;
    if (!user) return;

    const newLog: SystemLog = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action,
      details,
      createdAt: new Date().toISOString()
    };
    if (groupId !== undefined) {
      newLog.groupId = groupId;
    }

    const list = [newLog, ...this.systemLogs$.value];
    this.systemLogs$.next(list);
    this.saveLocal('speak_system_logs', list);

    if (this.useFirebase) {
      try {
        const { setDoc, doc } = await import('firebase/firestore');
        await setDoc(doc(this.firestore, 'system_logs', newLog.id), newLog);
      } catch (e) {
        console.warn('Firestore logAction failed:', e);
      }
    }
  }

  // --- NOTIFICATION OPERATIONS ---
  observeNotifications(): Observable<AppNotification[]> { return this.notifications$.asObservable(); }

  getNotificationsForUser(userId: string, role: string): AppNotification[] {
    const active = this.currentUser$.value;
    const deletedList = active?.deletedNotifications || [];
    const readList = active?.readNotifications || [];

    return this.notifications$.value.filter(n => {
      // If deleted by this user, do not show
      if (deletedList.includes(n.id)) {
        return false;
      }
      // If targeted to a specific user (not a broadcast), only show to that user
      if (n.recipientId && n.recipientId !== 'all') {
        return n.recipientId === userId;
      }
      // Broadcast notification — check role match
      let isBroadcastTarget = false;
      if (n.recipientRole) {
        isBroadcastTarget = n.recipientRole === role || n.recipientRole === 'all';
      } else {
        isBroadcastTarget = true;
      }

      if (!isBroadcastTarget) {
        return false;
      }

      // For broadcast notifications, new users should not see announcements created before they registered
      if (active && active.registeredAt) {
        try {
          const regTime = new Date(active.registeredAt).getTime();
          const notifTime = new Date(n.createdAt).getTime();
          if (notifTime < regTime) {
            return false;
          }
        } catch (e) {}
      }

      return true;
    }).map(n => {
      // Map global 'read' state to user-specific read state
      const isRead = n.recipientId && n.recipientId !== 'all' ? n.read : readList.includes(n.id);
      return { ...n, read: isRead };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async sendNotification(notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): Promise<void> {
    const newNotif: AppNotification = {
      ...notif,
      id: 'notif-' + Date.now(),
      createdAt: new Date().toISOString(),
      read: false
    };
    const list = [newNotif, ...this.notifications$.value];
    this.notifications$.next(list);
    this.saveLocal('speak_notifications', list);
    if (this.useFirebase) {
      try { await setDoc(doc(this.firestore, 'notifications', newNotif.id), newNotif); } catch(e) { console.warn(e); }
    }
  }

  async markNotificationRead(notifId: string) {
    const active = this.currentUser$.value;
    if (!active) return;

    // Add to user-specific readNotifications list
    const readList = active.readNotifications || [];
    if (!readList.includes(notifId)) {
      const updatedReadList = [...readList, notifId];
      await this.updateCurrentUserProfile({ readNotifications: updatedReadList });
    }

    // If it's a private user-specific notification (not broadcast), we can also update it globally in Firestore
    const notif = this.notifications$.value.find(n => n.id === notifId);
    if (notif && notif.recipientId && notif.recipientId === active.id) {
      const list = this.notifications$.value.map(n =>
        n.id === notifId ? { ...n, read: true } : n
      );
      this.notifications$.next(list);
      this.saveLocal('speak_notifications', list);
      if (this.useFirebase) {
        try { await updateDoc(doc(this.firestore, 'notifications', notifId), { read: true }); } catch(e) { console.warn(e); }
      }
    } else {
      // Trigger notification update local stream
      this.notifications$.next([...this.notifications$.value]);
    }
  }

  async markAllNotificationsRead(userId: string) {
    const active = this.currentUser$.value;
    if (!active) return;

    const visibleNotifs = this.getNotificationsForUser(userId, active.role);
    const unreadIds = visibleNotifs.filter(n => !n.read).map(n => n.id);

    if (unreadIds.length > 0) {
      const readList = active.readNotifications || [];
      const updatedReadList = Array.from(new Set([...readList, ...unreadIds]));
      await this.updateCurrentUserProfile({ readNotifications: updatedReadList });
    }

    const privateUnreadNotifs = visibleNotifs.filter(n => !n.read && n.recipientId === active.id);
    if (privateUnreadNotifs.length > 0) {
      const list = this.notifications$.value.map(n =>
        (n.recipientId === active.id) ? { ...n, read: true } : n
      );
      this.notifications$.next(list);
      this.saveLocal('speak_notifications', list);

      if (this.useFirebase) {
        for (const n of privateUnreadNotifs) {
          try {
            await updateDoc(doc(this.firestore, 'notifications', n.id), { read: true });
          } catch(e) {
            console.warn('Failed to mark private notification read in Firestore', n.id, e);
          }
        }
      }
    } else {
      this.notifications$.next([...this.notifications$.value]);
    }
  }

  async deleteNotification(notifId: string) {
    const active = this.currentUser$.value;
    if (!active) return;

    // Add to user-specific deletedNotifications list
    const deletedList = active.deletedNotifications || [];
    if (!deletedList.includes(notifId)) {
      const updatedDeletedList = [...deletedList, notifId];
      await this.updateCurrentUserProfile({ deletedNotifications: updatedDeletedList });
    }

    // If it's a private user-specific notification (not broadcast), we can also delete it globally from Firestore
    const notif = this.notifications$.value.find(n => n.id === notifId);
    if (notif && notif.recipientId && notif.recipientId === active.id) {
      const list = this.notifications$.value.filter(n => n.id !== notifId);
      this.notifications$.next(list);
      this.saveLocal('speak_notifications', list);
      if (this.useFirebase) {
        try { await deleteDoc(doc(this.firestore, 'notifications', notifId)); } catch(e) { console.warn(e); }
      }
    } else {
      this.notifications$.next([...this.notifications$.value]);
    }
  }

  // --- VOCAB GAME OPERATIONS ---
  observeVocabGames(): Observable<VocabGame[]> { return this.vocabGames$.asObservable(); }

  async addVocabGame(game: Omit<VocabGame, 'id' | 'createdAt'>): Promise<VocabGame> {
    const newGame: VocabGame = { ...game, id: 'vg-' + Date.now(), createdAt: new Date().toISOString() };
    const list = [newGame, ...this.vocabGames$.value];
    this.vocabGames$.next(list);
    this.saveLocal('speak_vocab_games', list);
    if (this.useFirebase) {
      try { await setDoc(doc(this.firestore, 'vocab_games', newGame.id), newGame); } catch(e) { console.warn(e); }
    }
    await this.logAction('add_vocab', `Jeu de vocabulaire créé : "${newGame.title}"`);
    return newGame;
  }

  async deleteVocabGame(id: string) {
    const game = this.vocabGames$.value.find(g => g.id === id);
    const title = game ? game.title : id;

    const list = this.vocabGames$.value.filter(g => g.id !== id);
    this.vocabGames$.next(list);
    this.saveLocal('speak_vocab_games', list);
    if (this.useFirebase) {
      try { await deleteDoc(doc(this.firestore, 'vocab_games', id)); } catch(e) { console.warn(e); }
    }
    await this.logAction('add_vocab', `Jeu de vocabulaire supprimé : "${title}"`);
  }

  async updateVocabGame(gameId: string, updatedData: Partial<VocabGame>) {
    const list = [...this.vocabGames$.value];
    const idx = list.findIndex(g => g.id === gameId);
    if (idx !== -1) {
      const updated = { ...list[idx], ...updatedData };
      list[idx] = updated;
      this.vocabGames$.next(list);
      this.saveLocal('speak_vocab_games', list);

      if (this.useFirebase) {
        try {
          await setDoc(doc(this.firestore, 'vocab_games', gameId), updated);
        } catch (e) {
          console.warn(e);
        }
      }
      await this.logAction('add_vocab', `Jeu de vocabulaire mis à jour : "${updated.title}"`);
    }
  }

  // --- EXAM ATTEMPT OPERATIONS ---
  observeExamAttempts(): Observable<ExamAttempt[]> { return this.examAttempts$.asObservable(); }

  hasStudentAttemptedExam(studentId: string, quizId: string): boolean {
    return this.examAttempts$.value.some(a => a.studentId === studentId && a.quizId === quizId);
  }

  async submitExamAttempt(attempt: Omit<ExamAttempt, 'id'>): Promise<ExamAttempt> {
    const newAttempt: ExamAttempt = { ...attempt, id: 'exam-' + Date.now() };
    const list = [newAttempt, ...this.examAttempts$.value];
    this.examAttempts$.next(list);
    this.saveLocal('speak_exam_attempts', list);
    if (this.useFirebase) {
      try { await setDoc(doc(this.firestore, 'exam_attempts', newAttempt.id), newAttempt); } catch(e) { console.warn(e); }
    }
    await this.logAction('quiz_completed', `Quiz terminé : "${newAttempt.quizTitle}" (Score: ${newAttempt.score}/${newAttempt.answers.length}, ${newAttempt.percentage}%)`);
    return newAttempt;
  }

  getStudentExamAttempts(studentId: string): ExamAttempt[] {
    return this.examAttempts$.value.filter(a => a.studentId === studentId);
  }

  // --- VOCAB GAME ATTEMPT OPERATIONS ---
  observeVocabGameAttempts(): Observable<VocabGameAttempt[]> { return this.vocabGameAttempts$.asObservable(); }

  async submitVocabGameAttempt(attempt: Omit<VocabGameAttempt, 'id'>): Promise<VocabGameAttempt> {
    const newAttempt: VocabGameAttempt = { ...attempt, id: 'vga-' + Date.now() };
    const list = [newAttempt, ...this.vocabGameAttempts$.value];
    this.vocabGameAttempts$.next(list);
    this.saveLocal('speak_vocab_game_attempts', list);

    if (this.useFirebase) {
      try {
        const { setDoc, doc } = await import('firebase/firestore');
        await setDoc(doc(this.firestore, 'vocab_game_attempts', newAttempt.id), newAttempt);
      } catch (e) {
        console.warn(e);
      }
    }
    await this.logAction('vocab_game_played', `Partie Vocabulaire terminée sur "${newAttempt.gameTitle}" (Score: ${newAttempt.score}/${newAttempt.totalWords}, ${Math.round((newAttempt.score / newAttempt.totalWords) * 100)}%)`);
    return newAttempt;
  }

  getStudentVocabAttempts(studentId: string): VocabGameAttempt[] {
    return this.vocabGameAttempts$.value.filter(a => a.studentId === studentId);
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

  // --- WORD OF THE DAY OPERATIONS ---
  observeWordOfTheDay(): Observable<WordOfTheDay> {
    return this.wordOfTheDay$.asObservable();
  }

  async updateWordOfTheDay(w: WordOfTheDay): Promise<void> {
    const updated = { ...w, updatedAt: new Date().toISOString() };
    this.wordOfTheDay$.next(updated);
    this.saveLocal('speak_word_of_the_day', updated);
    if (this.useFirebase) {
      try {
        await setDoc(doc(this.firestore, 'settings', 'word_of_the_day'), updated);
      } catch (e) {
        console.warn('Failed to update word of the day in Firestore:', e);
      }
    }
  }

  // --- CLUBS OPERATIONS ---
  observeClubs(): Observable<LearningClub[]> {
    return this.clubs$.asObservable();
  }

  async joinClub(clubId: string, userId: string) {
    const list = [...this.clubs$.value];
    
    // Remove user from any other club first
    list.forEach(c => {
      c.members = c.members.filter(m => m !== userId);
      if (c.weeklyXP[userId]) {
        delete c.weeklyXP[userId];
      }
    });

    // Add user to the new club
    const club = list.find(c => c.id === clubId);
    if (club) {
      if (!club.members.includes(userId)) {
        club.members.push(userId);
      }
      club.weeklyXP[userId] = 0;
    }

    this.clubs$.next(list);
    this.saveLocal('speak_clubs', list);

    // Update user profile clubId
    const usersList = [...this.users$.value];
    const uIdx = usersList.findIndex(u => u.id === userId);
    if (uIdx !== -1) {
      usersList[uIdx] = { ...usersList[uIdx], clubId };
      this.users$.next(usersList);
      this.saveLocal('speak_users', usersList);
      
      const active = this.currentUser$.value;
      if (active && active.id === userId) {
        this.currentUser$.next(usersList[uIdx]);
      }
    }
  }

  async addClubPost(clubId: string, userId: string, content: string) {
    const list = [...this.clubs$.value];
    const club = list.find(c => c.id === clubId);
    const user = this.users$.value.find(u => u.id === userId);
    
    if (club && user) {
      const newPost: ClubPost = {
        id: 'post-' + Date.now(),
        authorId: user.id,
        authorName: user.name,
        authorAvatar: user.avatar,
        content,
        createdAt: new Date().toISOString(),
        likes: []
      };
      club.discussions = [newPost, ...club.discussions];
      this.clubs$.next(list);
      this.saveLocal('speak_clubs', list);
    }
  }

  async likeClubPost(clubId: string, postId: string, userId: string) {
    const list = [...this.clubs$.value];
    const club = list.find(c => c.id === clubId);
    if (club) {
      const post = club.discussions.find(p => p.id === postId);
      if (post) {
        if (post.likes.includes(userId)) {
          post.likes = post.likes.filter(id => id !== userId);
        } else {
          post.likes.push(userId);
        }
        this.clubs$.next(list);
        this.saveLocal('speak_clubs', list);
      }
    }
  }

  // --- MARKETPLACE OPERATIONS ---
  observeMarketplaceItems(): Observable<MarketplaceItem[]> {
    return this.marketplaceItems$.asObservable();
  }

  async purchaseMarketplaceItem(itemId: string, userId: string): Promise<boolean> {
    const item = this.marketplaceItems$.value.find(i => i.id === itemId);
    const usersList = [...this.users$.value];
    const uIdx = usersList.findIndex(u => u.id === userId);

    if (item && uIdx !== -1) {
      const user = usersList[uIdx];
      const cost = item.cost;
      const coins = user.coins || 0;

      if (coins >= cost) {
        // Deduct coins
        user.coins = coins - cost;

        // Add to unlocked lists based on type
        if (item.type === 'avatar') {
          if (!user.unlockedAvatars) user.unlockedAvatars = [];
          user.unlockedAvatars.push(itemId);
        } else if (item.type === 'frame') {
          if (!user.unlockedFrames) user.unlockedFrames = [];
          user.unlockedFrames.push(itemId);
        } else if (item.type === 'theme') {
          if (!user.unlockedThemes) user.unlockedThemes = [];
          user.unlockedThemes.push(itemId);
        }

        usersList[uIdx] = { ...user };
        this.users$.next(usersList);
        this.saveLocal('speak_users', usersList);

        const active = this.currentUser$.value;
        if (active && active.id === userId) {
          this.currentUser$.next(user);
        }
        return true;
      }
    }
    return false;
  }

  async useMarketplaceItem(itemId: string, userId: string) {
    const item = this.marketplaceItems$.value.find(i => i.id === itemId);
    const usersList = [...this.users$.value];
    const uIdx = usersList.findIndex(u => u.id === userId);

    if (item && uIdx !== -1) {
      const user = { ...usersList[uIdx] };
      if (item.type === 'avatar') {
        user.activeAvatar = item.iconOrPreview;
        user.avatar = item.iconOrPreview;
      } else if (item.type === 'frame') {
        user.activeFrame = item.iconOrPreview;
      } else if (item.type === 'theme') {
        user.activeTheme = item.iconOrPreview;
      }

      usersList[uIdx] = user;
      this.users$.next(usersList);
      this.saveLocal('speak_users', usersList);

      const active = this.currentUser$.value;
      if (active && active.id === userId) {
        this.currentUser$.next(user);
      }
    }
  }

  // --- GARDEN OPERATIONS ---
  async growPlantInGarden(userId: string, type: 'tree' | 'flower') {
    const usersList = [...this.users$.value];
    const uIdx = usersList.findIndex(u => u.id === userId);
    if (uIdx !== -1) {
      const user = { ...usersList[uIdx] };
      const garden = user.garden ? { ...user.garden } : { trees: 0, flowers: 0, wiltedPlants: 0, lastLessonDate: '', healthStatus: 'healthy' as const };
      
      if (type === 'tree') {
        garden.trees = (garden.trees || 0) + 1;
      } else {
        garden.flowers = (garden.flowers || 0) + 1;
      }
      
      // Revive any wilted plants
      if (garden.wiltedPlants > 0) {
        garden.wiltedPlants = Math.max(0, garden.wiltedPlants - 1);
        if (type === 'flower') garden.flowers = (garden.flowers || 0) + 1;
      }

      garden.lastLessonDate = new Date().toISOString();
      
      // Determine health
      const totalPlants = (garden.trees || 0) + (garden.flowers || 0);
      if (totalPlants >= 30) {
        garden.healthStatus = 'flourishing';
      } else {
        garden.healthStatus = 'healthy';
      }

      user.garden = garden;
      usersList[uIdx] = user;
      this.users$.next(usersList);
      this.saveLocal('speak_users', usersList);

      const active = this.currentUser$.value;
      if (active && active.id === userId) {
        this.currentUser$.next(user);
      }
    }
  }

  async checkAndWiltGarden(userId: string) {
    const usersList = [...this.users$.value];
    const uIdx = usersList.findIndex(u => u.id === userId);
    if (uIdx !== -1) {
      const user = { ...usersList[uIdx] };
      if (!user.garden || !user.garden.lastLessonDate) return;
      
      const lastDate = new Date(user.garden.lastLessonDate).getTime();
      const diffDays = Math.floor((Date.now() - lastDate) / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 3 && user.garden.healthStatus !== 'wilted') {
        const garden = { ...user.garden };
        // Wilt some flowers
        if (garden.flowers > 0) {
          const wiltAmount = Math.min(garden.flowers, Math.floor(diffDays / 3));
          garden.flowers -= wiltAmount;
          garden.wiltedPlants += wiltAmount;
          garden.healthStatus = 'wilted';
          
          user.garden = garden;
          usersList[uIdx] = user;
          this.users$.next(usersList);
          this.saveLocal('speak_users', usersList);

          const active = this.currentUser$.value;
          if (active && active.id === userId) {
            this.currentUser$.next(user);
          }
        }
      }
    }
  }

  observeJourneyMissions(): Observable<JourneyMission[]> {
    return this.journeyMissions$.asObservable();
  }

  recalculateJourneyProgress(
    userId: string,
    subs: Submission[],
    logs: ActivityLog[],
    dict: DictionaryWord[],
    vocab: VocabGameAttempt[]
  ) {
    const list = [...this.journeyMissions$.value];
    let updated = false;

    list.forEach(mission => {
      if (mission.unlocked && !mission.completed) {
        mission.requiredTasks.forEach(task => {
          let newValue = task.current;

          if (task.type === 'words') {
            newValue = dict.filter(w => w.userId === userId).length;
          } else if (task.type === 'video') {
            const sCount = subs.filter(s => s.studentId === userId && s.type === 'video').length;
            const lCount = logs.filter(l => l.studentId === userId && (l.type as any) === 'video').length;
            newValue = sCount + lCount;
          } else if (task.type === 'quiz') {
            newValue = logs.filter(l => l.studentId === userId && l.type === 'quiz' && l.status === 'completed').length;
          } else if (task.type === 'listening') {
            const lCount = logs.filter(l => l.studentId === userId && l.type === 'listening' && l.status === 'completed').length;
            const sCount = subs.filter(s => s.studentId === userId && s.type === 'audio').length;
            newValue = lCount + sCount;
          } else if (task.type === 'writing') {
            const sCount = subs.filter(s => s.studentId === userId && s.type === 'text').length;
            newValue = sCount;
          }

          if (newValue !== task.current) {
            task.current = Math.min(task.target, newValue);
            updated = true;
          }
        });

        // Check if all tasks completed
        const allDone = mission.requiredTasks.every(t => t.current >= t.target);
        if (allDone) {
          mission.completed = true;

          // Unlock next mission in list
          const nextIdx = list.findIndex(m => m.id === mission.id) + 1;
          if (nextIdx < list.length) {
            list[nextIdx].unlocked = true;
          }

          // Award bonus XP and coins
          this.updateUserXP(userId, 100, true);
          this.addCoinsToUser(userId, 200);
          updated = true;
        }
      }
    });

    if (updated) {
      this.journeyMissions$.next(list);
      this.saveLocal('speak_missions', list);
    }
  }

  async updateJourneyTaskProgress(userId: string, taskType: string, amount: number) {
    const list = [...this.journeyMissions$.value];
    let updated = false;

    list.forEach(mission => {
      if (mission.unlocked && !mission.completed) {
        mission.requiredTasks.forEach(task => {
          if (task.type === taskType) {
            task.current = Math.min(task.target, task.current + amount);
            updated = true;
          }
        });

        // Check if all tasks completed
        const allDone = mission.requiredTasks.every(t => t.current >= t.target);
        if (allDone) {
          mission.completed = true;
          
          // Unlock next mission in list
          const nextIdx = list.findIndex(m => m.id === mission.id) + 1;
          if (nextIdx < list.length) {
            list[nextIdx].unlocked = true;
          }

          // Award bonus XP and coins
          this.updateUserXP(userId, 100, true);
          this.addCoinsToUser(userId, 200);
        }
      }
    });

    if (updated) {
      this.journeyMissions$.next(list);
      this.saveLocal('speak_missions', list);
    }
  }

  async addCoinsToUser(userId: string, amount: number) {
    const usersList = [...this.users$.value];
    const uIdx = usersList.findIndex(u => u.id === userId);
    if (uIdx !== -1) {
      const user = { ...usersList[uIdx] };
      user.coins = (user.coins || 0) + amount;
      
      usersList[uIdx] = user;
      this.users$.next(usersList);
      this.saveLocal('speak_users', usersList);

      const active = this.currentUser$.value;
      if (active && active.id === userId) {
        this.currentUser$.next(user);
      }
    }
  }

  async unlockBadgeForUser(userId: string, badgeId: string) {
    const usersList = [...this.users$.value];
    const uIdx = usersList.findIndex(u => u.id === userId);
    if (uIdx !== -1) {
      const user = { ...usersList[uIdx] };
      if (!user.unlockedBadges) user.unlockedBadges = [];
      if (!user.unlockedBadges.includes(badgeId)) {
        user.unlockedBadges.push(badgeId);
        
        usersList[uIdx] = user;
        this.users$.next(usersList);
        this.saveLocal('speak_users', usersList);

        const active = this.currentUser$.value;
        if (active && active.id === userId) {
          this.currentUser$.next(user);
        }

        const badgeNames: { [key: string]: string } = {
          'streak-10': '10 Days Streak 🔥',
          'streak-100': '100 Days Streak 👑',
          'words-1000': '1,000 Words Learned 📚',
          'dialogue-first': 'First Dialogue Completed 💬',
          'champion-week': 'Champion of the Week 🏆',
          'polyglot': 'Polyglotte 🌍'
        };
        const name = badgeNames[badgeId] || badgeId;
        this.sendNotification({
          recipientId: userId,
          recipientRole: 'student',
          type: 'reminder',
          title: 'Badge Débloqué ! 🏅',
          message: `Félicitations ! Vous avez débloqué le badge rare : "${name}".`
        });
      }
    }
  }

  observeShowBoutique(): Observable<boolean> {
    return this.showBoutique$.asObservable();
  }

  observeShowGarden(): Observable<boolean> {
    return this.showGarden$.asObservable();
  }

  updateShowBoutique(val: boolean) {
    this.showBoutique$.next(val);
    localStorage.setItem('speak_settings_show_boutique', String(val));
    if (this.useFirebase) {
      try {
        setDoc(doc(this.firestore, 'settings', 'show_boutique'), { value: val });
      } catch (e) { console.warn(e); }
    }
  }

  updateShowGarden(val: boolean) {
    this.showGarden$.next(val);
    localStorage.setItem('speak_settings_show_garden', String(val));
    if (this.useFirebase) {
      try {
        setDoc(doc(this.firestore, 'settings', 'show_garden'), { value: val });
      } catch (e) { console.warn(e); }
    }
  }

  observeShowJourney(): Observable<boolean> {
    return this.showJourney$.asObservable();
  }

  updateShowJourney(val: boolean) {
    this.showJourney$.next(val);
    localStorage.setItem('speak_settings_show_journey', String(val));
    if (this.useFirebase) {
      try {
        setDoc(doc(this.firestore, 'settings', 'show_journey'), { value: val });
      } catch (e) { console.warn(e); }
    }

    if (val) {
      this.sendNotification({
        recipientId: 'all',
        recipientRole: 'student',
        type: 'reminder',
        title: 'Nouveau Voyage Disponible ! 🗺️',
        message: 'Le professeur a activé le SpeakUp Journey ! Cliquez pour explorer vos missions et commencer à apprendre.'
      });
    }
  }
}
