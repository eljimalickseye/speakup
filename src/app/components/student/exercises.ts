import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, Quiz, UserProfile } from '../../services/database.service';

interface MatchCard {
  id: number;
  text: string;
  matchId: number;
  type: 'english' | 'french';
  selected: boolean;
  matched: boolean;
}

@Component({
  selector: 'app-student-exercises',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      @if (activeExercise() === 'list') {
        <!-- LIST VIEW -->
        <div class="section-title">Available exercises & games</div>
        <div class="grid2" style="margin-bottom: 24px">
          
          <!-- Vocabulary game (Built-in) -->
          <div class="card" style="cursor:pointer" (click)="startExercise('game')">
            <div class="lesson-icon amber" style="margin-bottom:8px; width:36px; height:36px">
              <i class="ti ti-cards" aria-hidden="true" style="font-size:18px"></i>
            </div>
            <div class="card-label">Vocabulary game</div>
            <div class="card-value" style="font-size:15px; color:var(--text-primary)">Word Match (Association)</div>
            <div class="card-sub">Practice vocabulary · Match English & French cards</div>
          </div>

          <!-- Dynamic Quizzes uploaded by teachers -->
          @for (quiz of quizzes(); track quiz.id) {
            <div class="card" style="cursor:pointer" (click)="startQuiz(quiz)">
              <div class="lesson-icon purple" style="margin-bottom:8px; width:36px; height:36px">
                <i class="ti ti-list-check" aria-hidden="true" style="font-size:18px"></i>
              </div>
              <div class="card-label">Grammar quiz</div>
              <div class="card-value" style="font-size:15px; color:var(--text-primary)">{{ quiz.title }}</div>
              <div class="card-sub">{{ quiz.questions.length }} questions · {{ quiz.timeLimit || '15' }} min limit</div>
            </div>
          }
        </div>

        @if (quizzes().length === 0) {
          <div style="padding: 20px; background: var(--surface-2); border-radius: 8px; border: 1px dashed var(--border); text-align: center; font-size: 12px; color: var(--text-secondary); margin-bottom: 24px">
            No grammar quizzes posted yet by your teacher.
          </div>
        }

        <!-- Weekly streak widget -->
        <div>
          <div class="section-title">Weekly practice streak</div>
          <div class="card" style="background:#FFF8F1; border:1px solid #FFE4D6; display:flex; align-items:center; gap:16px; padding:16px 20px; border-radius:12px; margin-bottom: 0">
            <div style="font-size:32px">🔥</div>
            <div>
              <div style="font-size:18px; font-weight:700; color:#D97706">{{ currentUser()?.streak || 0 }} Days Streak</div>
              <div style="font-size:12px; color:var(--text-secondary)">Practice every day to keep your streak alive and earn extra XP!</div>
            </div>
          </div>
        </div>
      } @else if (activeExercise() === 'quiz') {
        <!-- GRAMMAR QUIZ INTERACTIVE VIEW -->
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
            <button class="btn-s" (click)="exitExercise()"><i class="ti ti-arrow-left"></i> Exit</button>
            <span style="font-size:12px; font-weight:600; color:#4F46E5"><i class="ti ti-clock"></i> 15:00</span>
          </div>

          @if (activeQuiz(); as quiz) {
            @if (!quizFinished()) {
              <h3 class="st" style="font-size:16px">{{ quiz.title }}</h3>
              <p style="font-size:11px; color:var(--text-muted); margin-bottom:14px">Question {{ currentQuestionIdx() + 1 }} of {{ quiz.questions.length }}</p>

              <!-- Question Container -->
              <div class="card" style="background:var(--surface-2); margin-bottom:12px">
                <p style="font-size:14px; font-weight:600">{{ quiz.questions[currentQuestionIdx()].question }}</p>
              </div>

              <!-- Options -->
              <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px">
                @for (opt of quiz.questions[currentQuestionIdx()].options; track opt; let idx = $index) {
                  <button class="ni" 
                          [class.active]="selectedOption() === getOptionLetter(idx)"
                          (click)="selectedOption.set(getOptionLetter(idx))" 
                          style="border: 0.5px solid var(--border); background:var(--surface-1); padding:10px 12px; border-radius:8px; text-align: left">
                    <span style="font-weight:600; color:#4F46E5; margin-right:8px">{{ getOptionLetter(idx) }}.</span> {{ opt }}
                  </button>
                }
              </div>

              <button class="btn-p" (click)="nextQuestion(quiz)" [disabled]="!selectedOption()">
                {{ currentQuestionIdx() + 1 === quiz.questions.length ? 'Submit Quiz' : 'Next Question' }}
              </button>
            } @else {
              <!-- Quiz Results -->
              <div style="text-align:center; padding:20px 0">
                <i class="ti ti-trophy" style="font-size:48px; color:#D97706; display:block; margin-bottom:12px"></i>
                <h3 style="font-size:18px; font-weight:600; margin-bottom:4px">Quiz Completed!</h3>
                <p style="font-size:14px; color:var(--text-secondary); margin-bottom:12px">
                  You scored <strong style="color:#059669">{{ quizScore() }}%</strong> ({{ quizCorrectCount() }} / {{ quiz.questions.length }} correct)
                </p>
                <div style="background:#EEF2FF; padding:10px; border-radius:8px; display:inline-block; font-size:13px; font-weight:600; color:#4F46E5; margin-bottom:16px">
                  +{{ quizScore() >= 60 ? '50' : '10' }} XP Awarded
                </div>
                <div style="display:flex; gap:10px; justify-content:center">
                  <button class="btn-p" (click)="exitExercise()">Back to Exercises</button>
                </div>
              </div>
            }
          }
        </div>
      } @else if (activeExercise() === 'game') {
        <!-- VOCABULARY MATCH GAME VIEW -->
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
            <button class="btn-s" (click)="exitExercise()"><i class="ti ti-arrow-left"></i> Exit</button>
            <span style="font-size:12px; font-weight:600; color:#D97706"><i class="ti ti-cards"></i> Match game</span>
          </div>

          @if (!gameFinished()) {
            <h3 class="st" style="font-size:16px">Word Match (Association)</h3>
            <p style="font-size:11px; color:var(--text-muted); margin-bottom:14px">Match the English terms with their French translation counterparts.</p>

            <!-- Cards Grid -->
            <div class="grid2" style="gap:12px; margin-bottom:16px">
              @for (card of gameCards(); track card.id) {
                <button class="card" 
                        [class.active]="card.selected"
                        [style.opacity]="card.matched ? 0.35 : 1"
                        [style.pointer-events]="card.matched ? 'none' : 'auto'"
                        [style.border-color]="card.selected ? '#D97706' : 'var(--border)'"
                        [style.background]="card.selected ? '#FEF3C7' : 'var(--surface-1)'"
                        (click)="selectCard(card)"
                        style="padding:14px; text-align:center; font-weight:600; display:flex; align-items:center; justify-content:center; min-height:60px">
                  {{ card.text }}
                </button>
              }
            </div>
          } @else {
            <!-- Game Results -->
            <div style="text-align:center; padding:20px 0">
              <i class="ti ti-confetti" style="font-size:48px; color:#D97706; display:block; margin-bottom:12px"></i>
              <h3 style="font-size:18px; font-weight:600; margin-bottom:4px">Well Done!</h3>
              <p style="font-size:14px; color:var(--text-secondary); margin-bottom:12px">
                You successfully matched all vocabulary cards!
              </p>
              <div style="background:#FEF3C7; padding:10px; border-radius:8px; display:inline-block; font-size:13px; font-weight:600; color:#D97706; margin-bottom:16px">
                +30 XP Awarded
              </div>
              <div style="display:flex; gap:10px; justify-content:center">
                <button class="btn-p" (click)="exitExercise()">Back to Exercises</button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class StudentExercisesComponent {
  private db = inject(DatabaseService);

  activeExercise = signal<'list' | 'quiz' | 'game'>('list');
  quizzes = signal<Quiz[]>([]);
  activeQuiz = signal<Quiz | null>(null);
  currentUser = signal<UserProfile | null>(null);

  // Quiz States
  currentQuestionIdx = signal<number>(0);
  selectedOption = signal<string | null>(null);
  quizFinished = signal<boolean>(false);
  quizCorrectCount = signal<number>(0);
  quizScore = signal<number>(0);

  // Game States
  gameCards = signal<MatchCard[]>([]);
  selectedCard = signal<MatchCard | null>(null);
  matchesFound = signal<number>(0);
  gameFinished = signal<boolean>(false);

  constructor() {
    this.db.observeQuizzes().subscribe(list => this.quizzes.set(list));
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
  }

  startQuiz(quiz: Quiz) {
    this.activeQuiz.set(quiz);
    this.activeExercise.set('quiz');
    this.currentQuestionIdx.set(0);
    this.selectedOption.set(null);
    this.quizFinished.set(false);
    this.quizCorrectCount.set(0);
    this.quizScore.set(0);
  }

  startExercise(type: 'quiz' | 'game') {
    this.activeExercise.set(type);
    if (type === 'quiz') {
      this.currentQuestionIdx.set(0);
      this.selectedOption.set(null);
      this.quizFinished.set(false);
      this.quizCorrectCount.set(0);
      this.quizScore.set(0);
    } else if (type === 'game') {
      this.matchesFound.set(0);
      this.gameFinished.set(false);
      this.selectedCard.set(null);
      this.setupGameCards();
    }
  }

  exitExercise() {
    this.activeExercise.set('list');
    this.activeQuiz.set(null);
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D
  }

  nextQuestion(quiz: Quiz) {
    const activeLetter = this.selectedOption();
    const correctLetter = quiz.questions[this.currentQuestionIdx()].correctOption;

    if (activeLetter === correctLetter) {
      this.quizCorrectCount.update(c => c + 1);
    }

    if (this.currentQuestionIdx() + 1 === quiz.questions.length) {
      // Finished
      const pct = Math.round((this.quizCorrectCount() / quiz.questions.length) * 100);
      this.quizScore.set(pct);
      this.quizFinished.set(true);
      
      // Award XP
      const xp = pct >= 60 ? 50 : 10;
      const user = this.currentUser();
      if (user) {
        this.db.updateUserXP(user.id, xp, true);
      }
    } else {
      this.currentQuestionIdx.update(i => i + 1);
      this.selectedOption.set(null);
    }
  }

  setupGameCards() {
    const rawPairs = [
      { english: 'hypothesis', french: 'hypothèse' },
      { english: 'if', french: 'si' },
      { english: 'kitchen', french: 'cuisine' },
      { english: 'to come', french: 'venir' }
    ];

    const cards: MatchCard[] = [];
    rawPairs.forEach((p, idx) => {
      cards.push({
        id: idx * 2,
        text: p.english,
        matchId: idx,
        type: 'english',
        selected: false,
        matched: false
      });
      cards.push({
        id: idx * 2 + 1,
        text: p.french,
        matchId: idx,
        type: 'french',
        selected: false,
        matched: false
      });
    });

    // Shuffle cards
    cards.sort(() => Math.random() - 0.5);
    this.gameCards.set(cards);
  }

  selectCard(card: MatchCard) {
    if (card.matched) return;

    const list = [...this.gameCards()];
    const activeSelected = this.selectedCard();
    
    if (!activeSelected) {
      // First selection
      card.selected = true;
      this.selectedCard.set(card);
      this.gameCards.set(list);
    } else {
      if (activeSelected.id === card.id) {
        // Double click same card: de-select
        card.selected = false;
        this.selectedCard.set(null);
        this.gameCards.set(list);
      } else if (activeSelected.type === card.type) {
        // Clicked another card of same type: change selection
        const oldCard = list.find(c => c.id === activeSelected.id);
        if (oldCard) oldCard.selected = false;
        card.selected = true;
        this.selectedCard.set(card);
        this.gameCards.set(list);
      } else {
        // Match attempt
        if (activeSelected.matchId === card.matchId) {
          // Success!
          const c1 = list.find(c => c.id === activeSelected.id);
          const c2 = list.find(c => c.id === card.id);
          if (c1 && c2) {
            c1.matched = true;
            c1.selected = false;
            c2.matched = true;
            c2.selected = false;
          }
          this.matchesFound.update(m => m + 1);
          this.selectedCard.set(null);
          this.gameCards.set(list);

          if (this.matchesFound() === 4) {
            this.gameFinished.set(true);
            const user = this.currentUser();
            if (user) {
              this.db.updateUserXP(user.id, 30, true);
            }
          }
        } else {
          // Failure: flash and reset selection
          card.selected = true;
          this.gameCards.set(list);
          
          setTimeout(() => {
            const listReset = [...this.gameCards()];
            const c1 = listReset.find(c => c.id === activeSelected.id);
            const c2 = listReset.find(c => c.id === card.id);
            if (c1) c1.selected = false;
            if (c2) c2.selected = false;
            this.selectedCard.set(null);
            this.gameCards.set(listReset);
          }, 400);
        }
      }
    }
  }
}
