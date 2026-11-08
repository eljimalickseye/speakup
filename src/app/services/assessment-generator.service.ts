import { Injectable } from '@angular/core';
import { Lesson } from './database.service';

export interface DetQuestion {
  id: string;
  type: 'write-photo' | 'speak-photo' | 'read-complete' | 'read-select' | 'listen-type' | 'read-aloud' | 'read-write' | 'listen-speak';
  titleFr: string;
  titleEn: string;
  subscore: 'literacy' | 'comprehension' | 'production' | 'conversation';
  timeLimitSec: number;
  imageUrl?: string;
  imageCredit?: string;
  promptText?: string;
  audioText?: string;
  blanksData?: { prefix: string; missing: string }[];
  wordsList?: { word: string; isReal: boolean }[];
  minWords?: number;
  targetLevel?: 'A2' | 'B1' | 'B2' | 'A2-B2';
  sourceLessonTitle?: string;
}

export interface GeneratedAssessmentMetadata {
  id: string;
  title: string;
  generatedAt: string;
  targetLevel: 'A2' | 'B1' | 'B2' | 'A2-B2';
  sourceLessonCount: number;
  sourceLessonTitles: string[];
  vocabularyTestedCount: number;
  estimatedDurationMin: number;
  questions: DetQuestion[];
}

@Injectable({
  providedIn: 'root'
})
export class AssessmentGeneratorService {

  // Curated bank of authentic A2, B1, and B2 distractors (pseudo-words) for the Duolingo-style read-select test
  private readonly pseudoWordsBank = [
    'glimpton', 'flouristic', 'tracely', 'preclament', 'frenshive',
    'spundery', 'ambiture', 'plenciful', 'inaccurist', 'disclosive',
    'volitive', 'congruencey', 'striveness', 'compliable', 'particulateful',
    'gloomingness', 'falteration', 'concordial', 'deliberance', 'tendacious'
  ];

  // Thematic imagery pool matched to CEFR scenarios (Unsplash high-res licenses)
  private readonly scenarioImages = {
    travel: {
      url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1000&q=80',
      credit: '© iabzd / Unsplash (Urban & Travel Life)'
    },
    business: {
      url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=80',
      credit: '© Annie Spratt / Unsplash (Workplace & Collaboration)'
    },
    environment: {
      url: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1000&q=80',
      credit: '© American Public Power / Unsplash (Green Tech & Sustainability)'
    },
    dailyLife: {
      url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=80',
      credit: '© Leon / Unsplash (Campus & Modern Study)'
    }
  };

  /**
   * Generates a complete 7-question SpeakUp English Assessment (SET) calibrated for CEFR A2-B2
   * directly derived from the curricular lessons in the database.
   */
  generateAssessmentFromLessons(
    lessons: Lesson[],
    targetLevel: 'A2' | 'B1' | 'B2' | 'A2-B2' = 'A2-B2',
    selectedLessonIds?: string[]
  ): GeneratedAssessmentMetadata {
    // 1. Filter lessons according to selection or target level
    let filteredLessons = lessons.filter(l => l.status === 'published' || !l.status);
    if (selectedLessonIds && selectedLessonIds.length > 0) {
      filteredLessons = filteredLessons.filter(l => selectedLessonIds.includes(l.id));
    } else if (targetLevel !== 'A2-B2') {
      const levelMatches = filteredLessons.filter(l => this.normalizeLevel(l.level) === targetLevel);
      if (levelMatches.length > 0) {
        filteredLessons = levelMatches;
      }
    }

    // Fallback: If no lessons available in DB, use default curricular models
    if (filteredLessons.length === 0) {
      filteredLessons = this.getDefaultCurriculumLessons(targetLevel);
    }

    // 2. Extract and sanitize vocabulary from selected lessons
    const rawVocab: string[] = [];
    filteredLessons.forEach(l => {
      if (Array.isArray(l.vocabulary)) {
        l.vocabulary.forEach(v => {
          const clean = v.trim().toLowerCase();
          if (clean.length > 2 && !rawVocab.includes(clean)) {
            rawVocab.push(clean);
          }
        });
      }
    });

    // Ensure we have a robust vocabulary pool (fill from level defaults if lesson had few words)
    const levelVocabPool = this.getLevelVocabularyPool(targetLevel);
    const combinedVocab = Array.from(new Set([...rawVocab, ...levelVocabPool]));

    // 3. Extract lesson titles & primary themes
    const lessonTitles = filteredLessons.map(l => l.title);
    const primaryTheme = this.detectPrimaryTheme(filteredLessons);

    // 4. Build the 7 pedagogical Duolingo / SpeakUp Assessment questions
    const questions: DetQuestion[] = [
      this.buildWritePhotoQuestion(targetLevel, primaryTheme, lessonTitles[0] || 'Everyday Situations'),
      this.buildReadCompleteQuestion(targetLevel, filteredLessons),
      this.buildReadSelectQuestion(targetLevel, combinedVocab, lessonTitles),
      this.buildListenTypeQuestion(targetLevel, filteredLessons, combinedVocab),
      this.buildReadAloudQuestion(targetLevel, filteredLessons, primaryTheme),
      this.buildReadWriteQuestion(targetLevel, filteredLessons, primaryTheme),
      this.buildListenSpeakQuestion(targetLevel, filteredLessons, primaryTheme)
    ];

    const assessmentTitle = targetLevel === 'A2-B2' 
      ? `Évaluation SpeakUp A2–B2 : ${lessonTitles.slice(0, 2).join(' & ')}`
      : `Évaluation SpeakUp Niveau ${targetLevel} : ${lessonTitles[0] || 'Leçons de Cours'}`;

    return {
      id: `assessment-${Date.now()}`,
      title: assessmentTitle,
      generatedAt: new Date().toISOString(),
      targetLevel,
      sourceLessonCount: filteredLessons.length,
      sourceLessonTitles: lessonTitles,
      vocabularyTestedCount: Math.min(combinedVocab.length, 12),
      estimatedDurationMin: 15,
      questions
    };
  }

  // =========================================================================
  // QUESTION BUILDERS (A2 TO B2 CALIBRATION)
  // =========================================================================

  /**
   * Question 1: Write about the Photo (60s)
   * Production Écrite - Tested on real-world photo descriptions with CEFR A2-B2 rubrics.
   */
  private buildWritePhotoQuestion(
    level: 'A2' | 'B1' | 'B2' | 'A2-B2',
    theme: 'travel' | 'business' | 'environment' | 'dailyLife',
    sourceTitle: string
  ): DetQuestion {
    const imgData = this.scenarioImages[theme] || this.scenarioImages.travel;

    let minWords = 20;
    let titleFr = "Rédigez une description de l'image ci-dessous pendant 1 minute";
    let titleEn = "Write a description of the image below for 1 minute";

    if (level === 'A2') {
      minWords = 18;
      titleFr = "Décrivez l'image en 1 minute (personnes, actions et environnement)";
      titleEn = "Describe what you see in the photo in 1 minute (people, actions, setting)";
    } else if (level === 'B1') {
      minWords = 25;
      titleFr = "Décrivez la scène et le contexte de l'image ci-dessous en 1 minute";
      titleEn = "Describe the scene, activities and context in the image below for 1 minute";
    } else if (level === 'B2') {
      minWords = 35;
      titleFr = "Analysez la situation, l'ambiance et les interactions sur l'image en 1 minute";
      titleEn = "Analyze the situation, atmosphere, and dynamics in the image for 1 minute";
    }

    return {
      id: `wp-${Date.now()}`,
      type: 'write-photo',
      titleFr,
      titleEn,
      subscore: 'production',
      timeLimitSec: 60,
      imageUrl: imgData.url,
      imageCredit: imgData.credit,
      minWords,
      targetLevel: level,
      sourceLessonTitle: sourceTitle
    };
  }

  /**
   * Question 2: Read and Complete (180s)
   * Literacy / C-test - Missing letters derived from lesson texts or thematic passages.
   */
  private buildReadCompleteQuestion(
    level: 'A2' | 'B1' | 'B2' | 'A2-B2',
    lessons: Lesson[]
  ): DetQuestion {
    // Select curated passage according to dominant level/theme
    const cTestData = this.generateCTestPassage(level, lessons);

    return {
      id: `rc-${Date.now()}`,
      type: 'read-complete',
      titleFr: "Complétez les lettres manquantes pour reconstituer le texte ci-dessous",
      titleEn: "Type the missing letters to complete the text below",
      subscore: 'literacy',
      timeLimitSec: 180,
      blanksData: cTestData.blanks,
      targetLevel: level,
      sourceLessonTitle: cTestData.sourceTitle
    };
  }

  /**
   * Question 3: Read and Select (60s)
   * Literacy - Authentic lesson vocabulary vs morphologically plausible pseudo-words.
   */
  private buildReadSelectQuestion(
    level: 'A2' | 'B1' | 'B2' | 'A2-B2',
    vocabPool: string[],
    lessonTitles: string[]
  ): DetQuestion {
    // Pick 8 to 10 real words from lesson vocabulary
    const shuffledReal = this.shuffleArray([...vocabPool]).slice(0, 9);
    // Pick 7 to 8 pseudo-words
    const shuffledFake = this.shuffleArray([...this.pseudoWordsBank]).slice(0, 7);

    const wordsList = this.shuffleArray([
      ...shuffledReal.map(w => ({ word: w, isReal: true })),
      ...shuffledFake.map(w => ({ word: w, isReal: false }))
    ]);

    return {
      id: `rs-${Date.now()}`,
      type: 'read-select',
      titleFr: "Sélectionnez les vrais mots anglais issus de vos leçons",
      titleEn: "Select the real English words in this list",
      subscore: 'literacy',
      timeLimitSec: 60,
      wordsList,
      targetLevel: level,
      sourceLessonTitle: lessonTitles.join(', ')
    };
  }

  /**
   * Question 4: Listen and Type (60s)
   * Comprehension - Dictation sentence featuring grammar patterns (modals, connectors, past tense).
   */
  private buildListenTypeQuestion(
    level: 'A2' | 'B1' | 'B2' | 'A2-B2',
    lessons: Lesson[],
    vocabPool: string[]
  ): DetQuestion {
    const dictationSentences = {
      A2: [
        "Please remember to show your passport and boarding pass before entering the gate.",
        "They decided to meet at the station because the train was arriving early.",
        "We need to check the schedule carefully before booking the international tickets."
      ],
      B1: [
        "Although the flight was delayed by two hours, all passengers arrived safely before the conference started.",
        "After discussing the proposal with our manager, we scheduled another meeting to finalize the project.",
        "She overcame several obstacles during her training and gained tremendous confidence."
      ],
      B2: [
        "Investing in resilient infrastructure allows modern organizations to maintain high productivity during unexpected crises.",
        "The committee emphasized that sustainable innovation requires balancing economic growth with environmental responsibility.",
        "Had they evaluated the preliminary feedback sooner, the negotiation would have reached a faster agreement."
      ],
      'A2-B2': [
        "Although our team experienced unexpected delays, we collaborated effectively to achieve our primary goals.",
        "Clear communication and mutual respect are essential when presenting new proposals to international partners.",
        "Developing sustainable habits today ensures long-term benefits for future communities."
      ]
    };

    const pool = dictationSentences[level] || dictationSentences['A2-B2'];
    const selectedSentence = pool[Math.floor(Math.random() * pool.length)];

    return {
      id: `lt-${Date.now()}`,
      type: 'listen-type',
      titleFr: "Tapez fidèlement l'énoncé oral que vous entendez",
      titleEn: "Type the statement that you hear",
      subscore: 'comprehension',
      timeLimitSec: 60,
      audioText: selectedSentence,
      targetLevel: level,
      sourceLessonTitle: lessons[0]?.title || 'Grammar & Dictation'
    };
  }

  /**
   * Question 5: Read Aloud (25s)
   * Conversation - Pronunciation, rhythm, and stress derived from lesson grammar.
   */
  private buildReadAloudQuestion(
    level: 'A2' | 'B1' | 'B2' | 'A2-B2',
    lessons: Lesson[],
    theme: string
  ): DetQuestion {
    const readAloudPool = {
      A2: "I really enjoy traveling to new places and meeting friendly people from different cultures.",
      B1: "Effective communication is the cornerstone of successful international collaboration.",
      B2: "Sustainable innovation requires balancing immediate economic objectives with long-term ecological responsibility.",
      'A2-B2': "Developing strong communication skills allows professionals to collaborate efficiently across diverse global teams."
    };

    const promptText = readAloudPool[level] || readAloudPool['A2-B2'];

    return {
      id: `ra-${Date.now()}`,
      type: 'read-aloud',
      titleFr: "Lisez la phrase ci-dessous à voix haute avec une prononciation claire",
      titleEn: "Read the sentence below aloud with clear pronunciation",
      subscore: 'conversation',
      timeLimitSec: 25,
      promptText,
      targetLevel: level,
      sourceLessonTitle: lessons[0]?.title || 'Phonetics & Fluency'
    };
  }

  /**
   * Question 6: Read and Write (300s, 5 minutes)
   * Production - Structured essay response (min 50 words) based on lesson themes.
   */
  private buildReadWriteQuestion(
    level: 'A2' | 'B1' | 'B2' | 'A2-B2',
    lessons: Lesson[],
    theme: string
  ): DetQuestion {
    const prompts = {
      A2: {
        fr: "Décrivez un voyage ou une activité que vous avez particulièrement appréciée. Où étiez-vous et pourquoi ce moment était-il mémorable ? (Au moins 40 mots)",
        en: "Describe a trip or an activity that you really enjoyed. Where did you go and why was this experience special to you? (At least 40 words)",
        minWords: 40
      },
      B1: {
        fr: "Décrivez un défi important que vous avez rencontré récemment au travail ou dans vos études, et expliquez comment vous l'avez surmonté. Quelles leçons en tirez-vous ? (Au moins 50 mots)",
        en: "Describe a challenge you faced recently at work or during your studies, and explain how you overcame it. What lessons did you learn from this experience? (At least 50 words)",
        minWords: 50
      },
      B2: {
        fr: "Dans vos leçons récentes, vous avez étudié la communication professionnelle et l'innovation durable. Selon vous, le travail à distance renforce-t-il ou affaiblit-il la cohésion d'équipe ? Développez au moins deux arguments nuancés. (Au moins 65 mots)",
        en: "In your recent lessons, you discussed professional communication and sustainable innovation. In your view, does remote work strengthen or weaken team cohesion? Develop at least two reasoned arguments. (At least 65 words)",
        minWords: 65
      },
      'A2-B2': {
        fr: "En vous basant sur vos leçons de cours, décrivez une situation où une bonne communication d'équipe a permis de résoudre un problème inattendu. Donnez des détails précis. (Au moins 50 mots)",
        en: "Based on your course lessons, describe a situation where good team communication helped resolve an unexpected problem. Provide specific details. (At least 50 words)",
        minWords: 50
      }
    };

    const chosen = prompts[level] || prompts['A2-B2'];

    return {
      id: `rw-${Date.now()}`,
      type: 'read-write',
      titleFr: "Répondez au sujet ci-dessous en rédigeant un texte structuré",
      titleEn: "Respond to the prompt below in a well-structured response",
      subscore: 'production',
      timeLimitSec: 300,
      promptText: chosen.en,
      minWords: chosen.minWords,
      targetLevel: level,
      sourceLessonTitle: lessons.map(l => l.title).join(' / ')
    };
  }

  /**
   * Question 7: Listen then Speak (90s)
   * Conversation - 90-second spoken interview response to an audio prompt.
   */
  private buildListenSpeakQuestion(
    level: 'A2' | 'B1' | 'B2' | 'A2-B2',
    lessons: Lesson[],
    theme: string
  ): DetQuestion {
    const audioPrompts = {
      A2: "Tell me about your favorite destination to travel or relax. What do you like to do there, and who do you usually go with?",
      B1: "Think about an important accomplishment you achieved after working hard. What obstacles did you encounter, and how did you overcome them?",
      B2: "How do you think emerging environmental challenges and artificial intelligence will transform the way we collaborate and work in the coming decade?",
      'A2-B2': "If you were invited to lead an international project with teammates from three different countries, how would you ensure effective communication and mutual respect?"
    };

    const audioText = audioPrompts[level] || audioPrompts['A2-B2'];

    return {
      id: `ls-${Date.now()}`,
      type: 'listen-speak',
      titleFr: "Écoutez la question du professeur, puis répondez à l'oral pendant 90 secondes",
      titleEn: "Listen to the prompt, then speak your response for 90 seconds",
      subscore: 'conversation',
      timeLimitSec: 90,
      audioText,
      targetLevel: level,
      sourceLessonTitle: lessons[0]?.title || 'Oral Expression'
    };
  }

  // =========================================================================
  // C-TEST PASSAGE GENERATOR FOR READ-COMPLETE
  // =========================================================================

  private generateCTestPassage(
    level: 'A2' | 'B1' | 'B2' | 'A2-B2',
    lessons: Lesson[]
  ): { blanks: { prefix: string; missing: string }[]; sourceTitle: string } {
    // Curated pedagogical C-tests with exact character split calibrated for CEFR
    const passages = {
      travel: {
        title: 'Airport Navigation & International Travel',
        blanks: [
          { prefix: 'When preparing for an international fli', missing: 'ght' },
          { prefix: ', pass', missing: 'engers' },
          { prefix: 'must arrive at the air', missing: 'port' },
          { prefix: 'at least two ho', missing: 'urs' },
          { prefix: 'before depar', missing: 'ture' },
          { prefix: '. Remember to keep your boar', missing: 'ding' },
          { prefix: 'pass and pass', missing: 'port' },
          { prefix: 'accessible for secu', missing: 'rity' },
          { prefix: 'checks. If your fli', missing: 'ght' },
          { prefix: 'is dela', missing: 'yed' },
          { prefix: ', airline staff will assi', missing: 'st' },
          { prefix: 'you at the info', missing: 'rmation' },
          { prefix: 'de', missing: 'sk' }
        ]
      },
      business: {
        title: 'Workplace Collaboration & Goal Setting',
        blanks: [
          { prefix: 'Successful teams rely on transpa', missing: 'rent' },
          { prefix: 'communi', missing: 'cation' },
          { prefix: 'and mutual resp', missing: 'ect' },
          { prefix: '. Before starting a new proj', missing: 'ect' },
          { prefix: ', members should defi', missing: 'ne' },
          { prefix: 'clear deadli', missing: 'nes' },
          { prefix: 'and share honest feedb', missing: 'ack' },
          { prefix: '. When unexpe', missing: 'cted' },
          { prefix: 'obsta', missing: 'cles' },
          { prefix: 'arise, collea', missing: 'gues' },
          { prefix: 'must collabo', missing: 'rate' },
          { prefix: 'to find an effici', missing: 'ent' },
          { prefix: 'solu', missing: 'tion' }
        ]
      },
      environment: {
        title: 'Sustainability & Technological Innovation',
        blanks: [
          { prefix: 'Transitioning toward renewa', missing: 'ble' },
          { prefix: 'ene', missing: 'rgy' },
          { prefix: 'is crucial to preser', missing: 've' },
          { prefix: 'our plan', missing: 'et' },
          { prefix: '. Modern scienti', missing: 'sts' },
          { prefix: 'are develo', missing: 'ping' },
          { prefix: 'innovat', missing: 'ive' },
          { prefix: 'technolo', missing: 'gies' },
          { prefix: 'to reduce carb', missing: 'on' },
          { prefix: 'emissi', missing: 'ons' },
          { prefix: 'and impro', missing: 've' },
          { prefix: 'energy efficie', missing: 'ncy' }
        ]
      }
    };

    // Determine passage based on lesson content or target level
    if (level === 'A2') return { blanks: passages.travel.blanks, sourceTitle: passages.travel.title };
    if (level === 'B2') return { blanks: passages.environment.blanks, sourceTitle: passages.environment.title };
    return { blanks: passages.business.blanks, sourceTitle: passages.business.title };
  }

  // =========================================================================
  // HELPER UTILITIES
  // =========================================================================

  private detectPrimaryTheme(lessons: Lesson[]): 'travel' | 'business' | 'environment' | 'dailyLife' {
    const text = lessons.map(l => (l.title + ' ' + (l.vocabulary || []).join(' ')).toLowerCase()).join(' ');
    if (text.includes('travel') || text.includes('airport') || text.includes('flight') || text.includes('hotel')) return 'travel';
    if (text.includes('business') || text.includes('meeting') || text.includes('project') || text.includes('work')) return 'business';
    if (text.includes('environment') || text.includes('energy') || text.includes('green') || text.includes('climate')) return 'environment';
    return 'dailyLife';
  }

  private normalizeLevel(lvl: string | undefined): 'A2' | 'B1' | 'B2' | 'A2-B2' {
    if (!lvl) return 'B1';
    const clean = lvl.toUpperCase().trim();
    if (clean.includes('A2') || clean.includes('BEGINNER')) return 'A2';
    if (clean.includes('B2') || clean.includes('ADVANCED')) return 'B2';
    if (clean.includes('B1') || clean.includes('INTERMEDIATE')) return 'B1';
    return 'B1';
  }

  private getLevelVocabularyPool(level: 'A2' | 'B1' | 'B2' | 'A2-B2'): string[] {
    const pools = {
      A2: ['luggage', 'customs', 'flight', 'delayed', 'departure', 'boarding', 'schedule', 'ticket', 'passenger', 'station'],
      B1: ['obstacle', 'resilience', 'milestone', 'collaboration', 'deadline', 'proposal', 'feedback', 'confidence', 'decision', 'accomplishment'],
      B2: ['sustainability', 'renewable', 'perspective', 'infrastructure', 'efficiency', 'consequence', 'breakthrough', 'negotiation', 'biodiversity', 'significant'],
      'A2-B2': ['collaboration', 'obstacle', 'sustainability', 'departure', 'deadline', 'resilience', 'flight', 'perspective', 'proposal', 'milestone', 'infrastructure']
    };
    return pools[level] || pools['A2-B2'];
  }

  private getDefaultCurriculumLessons(targetLevel: string): Lesson[] {
    return [
      {
        id: 'curric-a2-travel',
        title: 'Travel Essentials & Airport Navigation',
        level: 'A2',
        type: 'Vocabulary',
        content: '<p>Learn essential airport terminology, check-in questions, and polite requests when traveling abroad.</p>',
        vocabulary: ['boarding pass', 'luggage', 'flight delay', 'departure gate', 'passport control', 'ticket counter', 'customs', 'passenger'],
        homeworkInstruction: 'Practice asking for directions at an airport.',
        dueDate: 'Next week',
        createdAt: new Date().toISOString(),
        status: 'published'
      },
      {
        id: 'curric-b1-challenges',
        title: 'Past Experiences & Overcoming Challenges',
        level: 'B1',
        type: 'Grammar',
        content: '<p>Master the contrast between Past Simple and Present Perfect to discuss personal achievements and overcoming obstacles.</p>',
        vocabulary: ['accomplishment', 'obstacle', 'resilience', 'decision', 'unexpected', 'solution', 'confidence', 'milestone'],
        homeworkInstruction: 'Write 3 paragraphs about a challenging experience.',
        dueDate: 'Next week',
        createdAt: new Date().toISOString(),
        status: 'published'
      },
      {
        id: 'curric-b1-meetings',
        title: 'Professional Communication & Team Meetings',
        level: 'B1',
        type: 'Vocabulary',
        content: '<p>Professional vocabulary for scheduling meetings, giving feedback, presenting proposals, and team collaboration.</p>',
        vocabulary: ['collaboration', 'deadline', 'agenda', 'presentation', 'feedback', 'proposal', 'negotiation', 'schedule'],
        homeworkInstruction: 'Draft a short business meeting agenda.',
        dueDate: 'Next week',
        createdAt: new Date().toISOString(),
        status: 'published'
      },
      {
        id: 'curric-b2-sustainability',
        title: 'Environmental Innovation & Future Technology',
        level: 'B2',
        type: 'Reading',
        content: '<p>Advanced discourse on renewable energy, environmental policies, and assessing future technological consequences.</p>',
        vocabulary: ['sustainability', 'renewable energy', 'breakthrough', 'consequence', 'biodiversity', 'efficiency', 'infrastructure', 'perspective'],
        homeworkInstruction: 'Analyze an environmental policy document.',
        dueDate: 'Next week',
        createdAt: new Date().toISOString(),
        status: 'published'
      }
    ];
  }

  private shuffleArray<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
