import re

file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\services\database.service.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Resolve Conflict 1 (UserProfile properties)
conflict_1 = """<<<<<<< Updated upstream
  status?: 'pending' | 'approved' | 'rejected' | 'suspended';
=======
  coins?: number;
  unlockedBadges?: string[];
  unlockedFrames?: string[];
  unlockedAvatars?: string[];
  unlockedThemes?: string[];
  activeFrame?: string;
  activeAvatar?: string;
  activeTheme?: string;
  activeTitle?: string;
  garden?: UserGarden;
  clubId?: string;
>>>>>>> Stashed changes"""

replacement_1 = """  status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  coins?: number;
  unlockedBadges?: string[];
  unlockedFrames?: string[];
  unlockedAvatars?: string[];
  unlockedThemes?: string[];
  activeFrame?: string;
  activeAvatar?: string;
  activeTheme?: string;
  activeTitle?: string;
  garden?: UserGarden;
  clubId?: string;"""

content = content.replace(conflict_1, replacement_1)

# 2. Resolve Conflict 2 (BehaviorSubjects)
conflict_2 = """<<<<<<< Updated upstream
  private vocabGameAttempts$ = new BehaviorSubject<VocabGameAttempt[]>([]);
=======
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
>>>>>>> Stashed changes"""

replacement_2 = """  private vocabGameAttempts$ = new BehaviorSubject<VocabGameAttempt[]>([]);
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
  private showJourney$ = new BehaviorSubject<boolean>(false);"""

content = content.replace(conflict_2, replacement_2)

# 3. Resolve Conflict 3 (Subscriptions in constructor)
conflict_3 = """<<<<<<< Updated upstream
    // 16. Subscribe to System Logs
    onSnapshot(collection(this.firestore, 'system_logs'), (snap) => {
      const list: SystemLog[] = [];
      snap.forEach(doc => list.push(doc.data() as SystemLog));
      this.systemLogs$.next(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    });

    // 17. Subscribe to Vocab Game Attempts
    onSnapshot(collection(this.firestore, 'vocab_game_attempts'), (snap) => {
      const list: VocabGameAttempt[] = [];
      snap.forEach(doc => list.push(doc.data() as VocabGameAttempt));
      this.vocabGameAttempts$.next(list.sort((a, b) => b.completedAt.localeCompare(a.completedAt)));
=======
    // 16. Subscribe to settings/word_of_the_day
    onSnapshot(doc(this.firestore, 'settings', 'word_of_the_day'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as WordOfTheDay;
        this.wordOfTheDay$.next(data);
        this.saveLocal('speak_word_of_the_day', data);
      }
    });

    // 17. Subscribe to settings/show_boutique & show_garden
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
>>>>>>> Stashed changes"""

replacement_3 = """    // 16. Subscribe to System Logs
    onSnapshot(collection(this.firestore, 'system_logs'), (snap) => {
      const list: SystemLog[] = [];
      snap.forEach(doc => list.push(doc.data() as SystemLog));
      this.systemLogs$.next(list.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    });

    // 17. Subscribe to Vocab Game Attempts
    onSnapshot(collection(this.firestore, 'vocab_game_attempts'), (snap) => {
      const list: VocabGameAttempt[] = [];
      snap.forEach(doc => list.push(doc.data() as VocabGameAttempt));
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
    }"""

content = content.replace(conflict_3, replacement_3)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("database.service.ts conflict resolution complete!")
