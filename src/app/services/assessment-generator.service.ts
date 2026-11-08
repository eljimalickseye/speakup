import { Injectable } from '@angular/core';
import { Lesson } from './database.service';

export interface DetQuestion {
  id: string;
  type: 'write-photo' | 'speak-photo' | 'read-complete' | 'read-select' | 'listen-type' | 'read-aloud' | 'read-write' | 'listen-speak' | 'grammar-select';
  titleFr: string;
  titleEn: string;
  subscore: 'literacy' | 'comprehension' | 'production' | 'conversation';
  timeLimitSec: number;
  imageUrl?: string;
  imageCredit?: string;
  promptText?: string;
  audioText?: string;
  audioUrl?: string;
  blanksData?: { prefix: string; missing: string }[];
  wordsList?: { word: string; isReal: boolean }[];
  options?: string[];
  correctOption?: string;
  explanation?: string;
  grammarTopic?: string;
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
   * Generates a complete 20-question SpeakUp English Assessment (SET) calibrated for CEFR A2-B2
   * with enhanced grammar focus and minimum 3-minute timers (180s - 300s) on all questions.
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

    // 4. Build exactly 20 pedagogical questions with strong grammar core & >= 180s (3 min) timers
    const questions: DetQuestion[] = [
      // Q1: Grammar - Past Simple vs Present Perfect (180s)
      this.buildGrammarSelectQuestion('tenses', targetLevel, lessonTitles[0] || 'Grammar & Verb Tenses', 1),

      // Q2: Photo Written Description (180s)
      this.buildWritePhotoQuestion(targetLevel, primaryTheme, lessonTitles[0] || 'Everyday Situations'),

      // Q3: Grammar - Conditionals & Unreal Past (180s)
      this.buildGrammarSelectQuestion('conditionals', targetLevel, lessonTitles[0] || 'Conditionals', 3),

      // Q4: Read and Complete - C-test Passage 1 (Airport & Travel Navigation) (180s)
      this.buildReadCompleteQuestion(targetLevel, filteredLessons, 'travel'),

      // Q5: Grammar - Modal Verbs & Deduction (180s)
      this.buildGrammarSelectQuestion('modals', targetLevel, lessonTitles[0] || 'Modal Auxiliaries', 5),

      // Q6: Read and Select - Real Words vs Pseudo-Words (180s)
      this.buildReadSelectQuestion(targetLevel, combinedVocab, lessonTitles),

      // Q7: Grammar - Passive Voice (180s)
      this.buildGrammarSelectQuestion('passive', targetLevel, lessonTitles[0] || 'Passive Voice', 7),

      // Q8: Listen and Type - Dictation 1 (180s)
      this.buildListenTypeQuestion(targetLevel, filteredLessons, combinedVocab, 1),

      // Q9: Grammar - Relative Clauses & Pronouns (180s)
      this.buildGrammarSelectQuestion('relatives', targetLevel, lessonTitles[0] || 'Relative Clauses', 9),

      // Q10: Read Aloud - Phonetics & Stress (180s)
      this.buildReadAloudQuestion(targetLevel, filteredLessons, primaryTheme),

      // Q11: Grammar - Reported Speech & Indirect Structures (180s)
      this.buildGrammarSelectQuestion('reported', targetLevel, lessonTitles[0] || 'Reported Speech', 11),

      // Q12: Photo Spoken Description (180s)
      this.buildSpeakPhotoQuestion(targetLevel, primaryTheme, lessonTitles[0] || 'Oral Communication'),

      // Q13: Grammar - Dependent Prepositions & Phrasal Verbs (180s)
      this.buildGrammarSelectQuestion('prepositions', targetLevel, lessonTitles[0] || 'Prepositions & Phrasal Verbs', 13),

      // Q14: Read and Complete - C-test Passage 2 (Workplace Collaboration) (180s)
      this.buildReadCompleteQuestion(targetLevel, filteredLessons, 'business'),

      // Q15: Grammar - Gerunds vs Infinitives (180s)
      this.buildGrammarSelectQuestion('gerunds', targetLevel, lessonTitles[0] || 'Gerunds & Infinitives', 15),

      // Q16: Listen and Type - Dictation 2 (180s)
      this.buildListenTypeQuestion(targetLevel, filteredLessons, combinedVocab, 2),

      // Q17: Grammar - Linking Words & Discourse Markers (180s)
      this.buildGrammarSelectQuestion('connectors', targetLevel, lessonTitles[0] || 'Discourse Connectors', 17),

      // Q18: Grammar - Comparison & Intensifiers (180s)
      this.buildGrammarSelectQuestion('comparisons', targetLevel, lessonTitles[0] || 'Comparatives & Superlatives', 18),

      // Q19: Read, then Write - Extended Argumentative Essay (300s = 5 min)
      this.buildReadWriteQuestion(targetLevel, filteredLessons, primaryTheme),

      // Q20: Listen, then Speak - Teacher Interview Response (180s)
      this.buildListenSpeakQuestion(targetLevel, filteredLessons, primaryTheme)
    ];

    const assessmentTitle = targetLevel === 'A2-B2' 
      ? `Évaluation SpeakUp A2–B2 (20 Épreuves) : ${lessonTitles.slice(0, 2).join(' & ')}`
      : `Évaluation SpeakUp Niveau ${targetLevel} (20 Épreuves) : ${lessonTitles[0] || 'Leçons de Cours'}`;

    return {
      id: `assessment-${Date.now()}`,
      title: assessmentTitle,
      generatedAt: new Date().toISOString(),
      targetLevel,
      sourceLessonCount: filteredLessons.length,
      sourceLessonTitles: lessonTitles,
      vocabularyTestedCount: Math.min(combinedVocab.length, 25),
      estimatedDurationMin: 60,
      questions
    };
  }

  // =========================================================================
  // QUESTION BUILDERS (A2 TO B2 CALIBRATION - MINIMUM 3 MINUTES / 180s)
  // =========================================================================

  /**
   * Question Builder: Grammar Multiple Choice (180s / 3 minutes)
   * High-yield grammar assessment testing precise CEFR competencies.
   */
  private buildGrammarSelectQuestion(
    topic: 'tenses' | 'conditionals' | 'modals' | 'passive' | 'relatives' | 'reported' | 'prepositions' | 'gerunds' | 'connectors' | 'comparisons',
    level: 'A2' | 'B1' | 'B2' | 'A2-B2',
    sourceTitle: string,
    index: number
  ): DetQuestion {
    const grammarPools: Record<string, Record<string, { prompt: string; options: string[]; correct: string; topicName: string; explanation: string }[]>> = {
      tenses: {
        A2: [
          {
            prompt: "Yesterday, Sarah _____ to the travel agency to book her flight ticket.",
            options: ["went", "goes", "has gone", "was go"],
            correct: "went",
            topicName: "Past Simple vs Present",
            explanation: "Le marqueur temporel 'Yesterday' impose l'usage du prétérit simple (Past Simple)."
          },
          {
            prompt: "Look! The students _____ their English exam right now.",
            options: ["are taking", "take", "took", "have taken"],
            correct: "are taking",
            topicName: "Present Continuous",
            explanation: "'Right now' indique une action en cours d'accomplissement, exprimée au présent continu."
          }
        ],
        B1: [
          {
            prompt: "I _____ in this international department for three years before moving to London.",
            options: ["worked", "have worked", "work", "had working"],
            correct: "worked",
            topicName: "Past Simple (Action terminée)",
            explanation: "L'action est délimitée et terminée dans le passé avant une autre étape, on emploie le Past Simple."
          },
          {
            prompt: "Our engineering team _____ on this new sustainable software since early January.",
            options: ["has been working", "works", "is working", "worked"],
            correct: "has been working",
            topicName: "Present Perfect Continuous",
            explanation: "L'expression 'since early January' exprime une action débutée dans le passé et toujours en cours."
          }
        ],
        B2: [
          {
            prompt: "By the time the board meeting concluded, the committee _____ all key proposals.",
            options: ["had evaluated", "evaluated", "has evaluated", "would evaluate"],
            correct: "had evaluated",
            topicName: "Past Perfect (Antériorité)",
            explanation: "L'évaluation s'est produite avant la fin de la réunion passée, nécessitant le Past Perfect."
          },
          {
            prompt: "Rarely _____ such exceptional dedication from first-year participants.",
            options: ["have we witnessed", "we witnessed", "we have witnessed", "did we witnessed"],
            correct: "have we witnessed",
            topicName: "Inversion après adverbe négatif",
            explanation: "L'adverbe négatif 'Rarely' en début de proposition déclenche l'inversion sujet-auxiliaire."
          }
        ]
      },
      conditionals: {
        A2: [
          {
            prompt: "If the weather _____ good tomorrow, we will visit the historical museum.",
            options: ["is", "will be", "was", "are"],
            correct: "is",
            topicName: "First Conditional (Condition réelle)",
            explanation: "Dans la subordonnée en 'if' du 1er conditionnel, on utilise le présent simple."
          }
        ],
        B1: [
          {
            prompt: "If our company _____ more modern equipment, we would finish the projects much faster.",
            options: ["had", "has", "will have", "would have"],
            correct: "had",
            topicName: "Second Conditional (Hypothèse présente)",
            explanation: "Le 2e conditionnel requiert un prétérit modal dans la proposition conditionnelle (If + Past Simple, would + V)."
          }
        ],
        B2: [
          {
            prompt: "If the project manager had double-checked the flight dates, we _____ the connecting flight in Madrid.",
            options: ["would not have missed", "will not miss", "did not miss", "would not miss"],
            correct: "would not have missed",
            topicName: "Third Conditional (Regret dans le passé)",
            explanation: "Le 3e conditionnel associe le Past Perfect dans la proposition 'if' avec 'would have + participe passé'."
          }
        ]
      },
      modals: {
        A2: [
          {
            prompt: "All passengers _____ show their passport before boarding the plane.",
            options: ["must", "might", "can", "could"],
            correct: "must",
            topicName: "Obligation stricte (Must)",
            explanation: "'Must' exprime une obligation réglementaire impérative."
          }
        ],
        B1: [
          {
            prompt: "You _____ bring printed notes to the presentation because all documents will be shown on the main screen.",
            options: ["needn't", "mustn't", "shouldn't have", "can't"],
            correct: "needn't",
            topicName: "Absence d'obligation (Needn't / Don't need to)",
            explanation: "'Needn't' indique qu'il n'est pas nécessaire d'accomplir l'action."
          }
        ],
        B2: [
          {
            prompt: "The conference hall is completely empty; the keynote speaker _____ delayed by the storm.",
            options: ["must have been", "should be", "can have been", "would be"],
            correct: "must have been",
            topicName: "Déduction quasi-certaine dans le passé",
            explanation: "'Must have + participe passé' exprime une quasi-certitude logique portant sur un événement passé."
          }
        ]
      },
      passive: {
        A2: [
          {
            prompt: "English _____ by millions of students around the world every day.",
            options: ["is spoken", "speaks", "is speak", "was spoke"],
            correct: "is spoken",
            topicName: "Present Simple Passive",
            explanation: "Forme passive présente : auxiliaire Be (is) + participe passé (spoken)."
          }
        ],
        B1: [
          {
            prompt: "A brand-new training campus _____ in the city center to accommodate international learners.",
            options: ["is being built", "is building", "built", "has build"],
            correct: "is being built",
            topicName: "Present Continuous Passive",
            explanation: "Action passive en cours d'achèvement : is being + participe passé."
          }
        ],
        B2: [
          {
            prompt: "All critical software vulnerabilities _____ before the system goes live next Friday.",
            options: ["must be addressed", "must address", "must have address", "must to be addressed"],
            correct: "must be addressed",
            topicName: "Modal Passive (Must be + Past Participle)",
            explanation: "Passif avec modal : Modal + be + participe passé régulier."
          }
        ]
      },
      relatives: {
        A2: [
          {
            prompt: "This is the flight attendant _____ helped me locate my lost carry-on luggage.",
            options: ["who", "which", "whose", "where"],
            correct: "who",
            topicName: "Pronom relatif pour les personnes (Who)",
            explanation: "'Who' s'emploie pour faire référence à une personne."
          }
        ],
        B1: [
          {
            prompt: "The international workshop _____ we attended last week provided innovative pedagogical methods.",
            options: ["which", "who", "whose", "where"],
            correct: "which",
            topicName: "Pronom relatif pour les objets/événements (Which)",
            explanation: "'Which' fait référence à des événements, objets ou concepts inanimés."
          }
        ],
        B2: [
          {
            prompt: "Dr. Evans, _____ research on renewable energy won global recognition, will deliver the opening speech.",
            options: ["whose", "who", "whom", "which"],
            correct: "whose",
            topicName: "Pronom de possession relative (Whose)",
            explanation: "'Whose' exprime l'appartenance (dont les travaux de recherche...)."
          }
        ]
      },
      reported: {
        A2: [
          {
            prompt: "Lucas said that he _____ very happy with his test score.",
            options: ["was", "is", "were", "are"],
            correct: "was",
            topicName: "Reported Speech basique (Concordance des temps)",
            explanation: "Au discours indirect avec verbe introducteur au passé (said), 'is' devient 'was'."
          }
        ],
        B1: [
          {
            prompt: "The instructor inquired whether all participants _____ the preparation materials.",
            options: ["had received", "have received", "receive", "will receive"],
            correct: "had received",
            topicName: "Questions indirectes & Antériorité",
            explanation: "La concordance des temps reporte le present perfect en past perfect."
          }
        ],
        B2: [
          {
            prompt: "The vice-president announced that the merger _____ finalized by the following quarter.",
            options: ["would be", "will be", "is being", "can be"],
            correct: "would be",
            topicName: "Futur du passé (Will -> Would)",
            explanation: "Dans le discours indirect au passé, le futur en 'will' se transforme en conditionnel 'would'."
          }
        ]
      },
      prepositions: {
        A2: [
          {
            prompt: "Our English class always starts _____ 9:00 AM on Monday mornings.",
            options: ["at", "in", "on", "to"],
            correct: "at",
            topicName: "Préposition de temps précis (At + heure)",
            explanation: "On utilise la préposition 'at' devant les heures précises."
          }
        ],
        B1: [
          {
            prompt: "Effective teamwork strongly depends _____ open dialogue and active listening.",
            options: ["on", "of", "in", "with"],
            correct: "on",
            topicName: "Préposition dépendante (Depend on)",
            explanation: "Le verbe 'depend' se construit obligatoirement avec la préposition 'on'."
          }
        ],
        B2: [
          {
            prompt: "Despite initial hesitations, the startup succeeded _____ securing international venture funding.",
            options: ["in", "to", "at", "for"],
            correct: "in",
            topicName: "Succeed in + V-ing",
            explanation: "'Succeed in' exige la préposition 'in' suivie du gérondif."
          }
        ]
      },
      gerunds: {
        A2: [
          {
            prompt: "Thomas enjoys _____ English podcasts while commuting to university.",
            options: ["listening to", "to listen", "listen", "listened to"],
            correct: "listening to",
            topicName: "Verbe de goût + Gérondif (Enjoy + V-ing)",
            explanation: "Le verbe 'enjoy' est systématiquement suivi d'un gérondif en '-ing'."
          }
        ],
        B1: [
          {
            prompt: "We look forward to _____ your team at the upcoming international symposium.",
            options: ["meeting", "meet", "to meet", "met"],
            correct: "meeting",
            topicName: "Look forward to + V-ing",
            explanation: "Dans l'expression 'look forward to', 'to' est une préposition requérant la forme en -ing."
          }
        ],
        B2: [
          {
            prompt: "The management committee decided _____ the annual conference until travel restrictions were lifted.",
            options: ["to postpone", "postponing", "postpone", "postponed"],
            correct: "to postpone",
            topicName: "Decide + to-infinitive",
            explanation: "Le verbe 'decide' régit l'infinitif complet avec 'to'."
          }
        ]
      },
      connectors: {
        A2: [
          {
            prompt: "She studied very hard, _____ she passed her SpeakUp English Assessment with high marks.",
            options: ["so", "because", "although", "despite"],
            correct: "so",
            topicName: "Connecteur de conséquence (So)",
            explanation: "'So' exprime la conséquence logique d'un effort."
          }
        ],
        B1: [
          {
            prompt: "_____ the flight was delayed by over two hours, the delegation arrived in time for the summit.",
            options: ["Although", "Despite", "In spite of", "However"],
            correct: "Although",
            topicName: "Concession avec proposition (Although + clause)",
            explanation: "'Although' est suivi d'une proposition sujet + verbe."
          }
        ],
        B2: [
          {
            prompt: "_____ substantial geopolitical obstacles, the renewable energy agreement was formally ratified.",
            options: ["Despite", "Although", "Even though", "Whereas"],
            correct: "Despite",
            topicName: "Concession avec groupe nominal (Despite + noun phrase)",
            explanation: "'Despite' (ou In spite of) s'associe à un groupe nominal sans verbe conjugué."
          }
        ]
      },
      comparisons: {
        A2: [
          {
            prompt: "Traveling by high-speed train is _____ faster than taking the regional bus.",
            options: ["much", "more", "very", "most"],
            correct: "much",
            topicName: "Intensificateur de comparatif (Much + comparative)",
            explanation: "On intensifie un comparatif de supériorité avec 'much' (et non 'very')."
          }
        ],
        B1: [
          {
            prompt: "This online learning platform is as practical _____ an in-person intensive workshop.",
            options: ["as", "than", "like", "so"],
            correct: "as",
            topicName: "Comparatif d'égalité (As...as)",
            explanation: "La structure comparative d'égalité se forme avec 'as + adjectif + as'."
          }
        ],
        B2: [
          {
            prompt: "The new battery design is by far _____ efficient prototype our laboratory has developed.",
            options: ["the most", "most", "more", "the more"],
            correct: "the most",
            topicName: "Superlatif absolu (By far the most)",
            explanation: "'By far' s'emploie avec le superlatif 'the most + adjectif long'."
          }
        ]
      }
    };

    const topicData = grammarPools[topic] || grammarPools['tenses'];
    const targetPool = topicData[level] || topicData['B1'] || topicData['A2'] || topicData['B2'];
    const chosen = targetPool[Math.floor(Math.random() * targetPool.length)];

    return {
      id: `gm-${Date.now()}-${index}`,
      type: 'grammar-select',
      titleFr: "Grammaire : Choisissez l'option correcte pour compléter la phrase (3 minutes)",
      titleEn: "Grammar: Select the correct option to complete the sentence (3 minutes)",
      subscore: 'literacy',
      timeLimitSec: 180, // Minimum 3 minutes
      promptText: chosen.prompt,
      options: chosen.options,
      correctOption: chosen.correct,
      explanation: chosen.explanation,
      grammarTopic: chosen.topicName,
      targetLevel: level,
      sourceLessonTitle: sourceTitle
    };
  }

  /**
   * Question: Write about the Photo (180s / 3 minutes)
   * Production Écrite - Minimum 3 minutes timer.
   */
  private buildWritePhotoQuestion(
    level: 'A2' | 'B1' | 'B2' | 'A2-B2',
    theme: 'travel' | 'business' | 'environment' | 'dailyLife',
    sourceTitle: string
  ): DetQuestion {
    const imgData = this.scenarioImages[theme] || this.scenarioImages.travel;

    let minWords = 25;
    let titleFr = "Rédigez une description détaillée de l'image ci-dessous pendant 3 minutes";
    let titleEn = "Write a detailed description of the image below for 3 minutes";

    if (level === 'A2') {
      minWords = 20;
      titleFr = "Décrivez l'image en 3 minutes (personnes, actions, objets et environnement)";
      titleEn = "Describe what you see in the photo in 3 minutes (people, actions, setting)";
    } else if (level === 'B1') {
      minWords = 30;
      titleFr = "Décrivez la scène, l'ambiance et le contexte de l'image en 3 minutes";
      titleEn = "Describe the scene, activities and context in the image below for 3 minutes";
    } else if (level === 'B2') {
      minWords = 45;
      titleFr = "Analysez la situation, les interactions et les perspectives sur l'image en 3 minutes";
      titleEn = "Analyze the situation, atmosphere, and dynamics in the image for 3 minutes";
    }

    return {
      id: `wp-${Date.now()}-2`,
      type: 'write-photo',
      titleFr,
      titleEn,
      subscore: 'production',
      timeLimitSec: 180, // Minimum 3 minutes
      imageUrl: imgData.url,
      imageCredit: imgData.credit,
      minWords,
      targetLevel: level,
      sourceLessonTitle: sourceTitle
    };
  }

  /**
   * Question: Speak about the Photo (180s / 3 minutes)
   * Production Orale - Minimum 3 minutes timer.
   */
  private buildSpeakPhotoQuestion(
    level: 'A2' | 'B1' | 'B2' | 'A2-B2',
    theme: 'travel' | 'business' | 'environment' | 'dailyLife',
    sourceTitle: string
  ): DetQuestion {
    const imgData = this.scenarioImages[theme] || this.scenarioImages.business;

    return {
      id: `sp-${Date.now()}-12`,
      type: 'speak-photo',
      titleFr: "Décrivez l'image à voix haute et commentez la scène pendant 3 minutes",
      titleEn: "Describe what you see in the photo and comment on the scene for 3 minutes",
      subscore: 'conversation',
      timeLimitSec: 180, // Minimum 3 minutes
      imageUrl: imgData.url,
      imageCredit: imgData.credit,
      targetLevel: level,
      sourceLessonTitle: sourceTitle
    };
  }

  /**
   * Question: Read and Complete (180s / 3 minutes)
   * Literacy / C-test - Missing letters derived from lesson texts or thematic passages.
   */
  private buildReadCompleteQuestion(
    level: 'A2' | 'B1' | 'B2' | 'A2-B2',
    lessons: Lesson[],
    passageCategory: 'travel' | 'business' | 'environment' = 'travel'
  ): DetQuestion {
    const cTestData = this.generateCTestPassage(level, lessons, passageCategory);

    return {
      id: `rc-${Date.now()}-${passageCategory}`,
      type: 'read-complete',
      titleFr: "Complétez les lettres manquantes pour reconstituer le texte (3 minutes)",
      titleEn: "Type the missing letters to complete the text below (3 minutes)",
      subscore: 'literacy',
      timeLimitSec: 180, // 3 minutes
      blanksData: cTestData.blanks,
      targetLevel: level,
      sourceLessonTitle: cTestData.sourceTitle
    };
  }

  /**
   * Question: Read and Select (180s / 3 minutes)
   * Literacy - Authentic lesson vocabulary vs morphologically plausible pseudo-words.
   */
  private buildReadSelectQuestion(
    level: 'A2' | 'B1' | 'B2' | 'A2-B2',
    vocabPool: string[],
    lessonTitles: string[]
  ): DetQuestion {
    const shuffledReal = this.shuffleArray([...vocabPool]).slice(0, 9);
    const shuffledFake = this.shuffleArray([...this.pseudoWordsBank]).slice(0, 7);

    const wordsList = this.shuffleArray([
      ...shuffledReal.map(w => ({ word: w, isReal: true })),
      ...shuffledFake.map(w => ({ word: w, isReal: false }))
    ]);

    return {
      id: `rs-${Date.now()}-6`,
      type: 'read-select',
      titleFr: "Vocabulaire : Sélectionnez les vrais mots anglais issus de vos leçons (3 minutes)",
      titleEn: "Vocabulary: Select the real English words in this list (3 minutes)",
      subscore: 'literacy',
      timeLimitSec: 180, // Minimum 3 minutes
      wordsList,
      targetLevel: level,
      sourceLessonTitle: lessonTitles.join(', ')
    };
  }

  /**
   * Question: Listen and Type (180s / 3 minutes)
   * Comprehension - Dictation sentence featuring grammar patterns (modals, connectors, past tense).
   */
  private buildListenTypeQuestion(
    level: 'A2' | 'B1' | 'B2' | 'A2-B2',
    lessons: Lesson[],
    vocabPool: string[],
    variant: 1 | 2 = 1
  ): DetQuestion {
    const dictationSentences = {
      A2: [
        "Please remember to show your passport and boarding pass before entering the gate.",
        "They decided to meet at the station because the train was arriving early."
      ],
      B1: [
        "Although the flight was delayed by two hours, all passengers arrived safely before the conference started.",
        "After discussing the proposal with our manager, we scheduled another meeting to finalize the project."
      ],
      B2: [
        "Investing in resilient infrastructure allows modern organizations to maintain high productivity during unexpected crises.",
        "The committee emphasized that sustainable innovation requires balancing economic growth with environmental responsibility."
      ],
      'A2-B2': [
        "Although our team experienced unexpected delays, we collaborated effectively to achieve our primary goals.",
        "Clear communication and mutual respect are essential when presenting new proposals to international partners."
      ]
    };

    const pool = dictationSentences[level] || dictationSentences['A2-B2'];
    const selectedSentence = variant === 1 ? pool[0] : (pool[1] || pool[0]);

    return {
      id: `lt-${Date.now()}-${variant}`,
      type: 'listen-type',
      titleFr: `Compréhension orale : Tapez fidèlement l'énoncé que vous entendez (3 minutes)`,
      titleEn: `Listening dictation: Type the statement that you hear (3 minutes)`,
      subscore: 'comprehension',
      timeLimitSec: 180, // Minimum 3 minutes
      audioText: selectedSentence,
      targetLevel: level,
      sourceLessonTitle: lessons[0]?.title || 'Grammar & Dictation'
    };
  }

  /**
   * Question: Read Aloud (180s / 3 minutes)
   * Conversation - Pronunciation, rhythm, and stress derived from lesson grammar.
   */
  private buildReadAloudQuestion(
    level: 'A2' | 'B1' | 'B2' | 'A2-B2',
    lessons: Lesson[],
    theme: string
  ): DetQuestion {
    const readAloudPool = {
      A2: "I really enjoy traveling to new places and meeting friendly people from different cultures.",
      B1: "Effective communication is the cornerstone of successful international collaboration across diverse teams.",
      B2: "Sustainable technological innovation requires balancing immediate economic objectives with long-term ecological responsibility.",
      'A2-B2': "Developing strong communication skills allows professionals to collaborate efficiently across diverse global teams."
    };

    const promptText = readAloudPool[level] || readAloudPool['A2-B2'];

    return {
      id: `ra-${Date.now()}-10`,
      type: 'read-aloud',
      titleFr: "Prononciation : Lisez la phrase ci-dessous à voix haute avec clarté (3 minutes)",
      titleEn: "Pronunciation: Read the sentence below aloud with clear pronunciation (3 minutes)",
      subscore: 'conversation',
      timeLimitSec: 180, // Minimum 3 minutes
      promptText,
      targetLevel: level,
      sourceLessonTitle: lessons[0]?.title || 'Phonetics & Fluency'
    };
  }

  /**
   * Question: Read and Write (300s / 5 minutes)
   * Production - Structured essay response (min 50 words) based on lesson themes.
   */
  private buildReadWriteQuestion(
    level: 'A2' | 'B1' | 'B2' | 'A2-B2',
    lessons: Lesson[],
    theme: string
  ): DetQuestion {
    const prompts = {
      A2: {
        fr: "Décrivez un voyage ou une activité d'apprentissage que vous avez particulièrement appréciée. Où étiez-vous et pourquoi ce moment était-il mémorable ? (Au moins 35 mots)",
        en: "Describe a trip or learning experience that you really enjoyed. Where did you go and why was this experience special to you? (At least 35 words)",
        minWords: 35
      },
      B1: {
        fr: "Décrivez un défi important que vous avez rencontré récemment au travail ou dans vos études, et expliquez comment vous l'avez surmonté grâce à une bonne communication. (Au moins 50 mots)",
        en: "Describe a challenge you faced recently at work or during your studies, and explain how you overcame it using effective communication. (At least 50 words)",
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
      id: `rw-${Date.now()}-19`,
      type: 'read-write',
      titleFr: "Production écrite : Répondez au sujet ci-dessous en rédigeant un texte structuré (5 minutes)",
      titleEn: "Written expression: Respond to the prompt below in a well-structured text (5 minutes)",
      subscore: 'production',
      timeLimitSec: 300, // 5 minutes (> 3 minutes)
      promptText: chosen.en,
      minWords: chosen.minWords,
      targetLevel: level,
      sourceLessonTitle: lessons.map(l => l.title).join(' / ')
    };
  }

  /**
   * Question: Listen then Speak (180s / 3 minutes)
   * Conversation - 3-minute oral response to a teacher interview prompt.
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
      id: `ls-${Date.now()}-20`,
      type: 'listen-speak',
      titleFr: "Entretien oral : Écoutez la question du professeur, puis répondez à l'oral pendant 3 minutes",
      titleEn: "Oral interview: Listen to the prompt, then speak your response for 3 minutes",
      subscore: 'conversation',
      timeLimitSec: 180, // Minimum 3 minutes
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
    lessons: Lesson[],
    category: 'travel' | 'business' | 'environment' = 'travel'
  ): { blanks: { prefix: string; missing: string }[]; sourceTitle: string } {
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
          { prefix: 'Transitioning to clean ene', missing: 'rgy' },
          { prefix: 'sources requires signifi', missing: 'cant' },
          { prefix: 'investme', missing: 'nts' },
          { prefix: 'in modern infrastru', missing: 'cture' },
          { prefix: '. Engineers are develop', missing: 'ing' },
          { prefix: 'efficient batte', missing: 'ries' },
          { prefix: 'to store renewa', missing: 'ble' },
          { prefix: 'power genera', missing: 'ted' },
          { prefix: 'by wind and so', missing: 'lar' },
          { prefix: 'farms across the coun', missing: 'try' }
        ]
      }
    };

    if (category === 'business') return { blanks: passages.business.blanks, sourceTitle: passages.business.title };
    if (category === 'environment') return { blanks: passages.environment.blanks, sourceTitle: passages.environment.title };
    return { blanks: passages.travel.blanks, sourceTitle: passages.travel.title };
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
