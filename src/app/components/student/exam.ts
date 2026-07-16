import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DatabaseService, Quiz, UserProfile, ExamAttempt } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-student-exam',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <!-- EXAM LIST VIEW -->
      @if (view() === 'list') {
        <div class="welcome" style="background:linear-gradient(135deg,#1E1B4B 0%,#312E81 100%); color:white; padding:24px">
          <div style="display:flex; align-items:center; gap:16px">
            <div style="width:52px; height:52px; background:rgba(255,255,255,0.15); border-radius:14px; display:flex; align-items:center; justify-content:center">
              <i class="ti ti-certificate" style="font-size:26px"></i>
            </div>
            <div>
              <h2 style="color:white; margin:0 0 4px; font-size:18px">Mode Examen</h2>
              <p style="color:rgba(255,255,255,0.7); margin:0; font-size:12px">
                Conditions d'examen · Timer · Réponse unique · Résultats immédiats
              </p>
            </div>
          </div>
        </div>

        <!-- Exam List -->
        <div class="st">Examens disponibles ({{ examQuizzes().length }})</div>

        @if (examQuizzes().length === 0) {
          <div style="text-align:center; padding:60px 20px; border:1px dashed var(--border); border-radius:12px; background:var(--surface-1)">
            <i class="ti ti-certificate" style="font-size:48px; color:var(--text-muted); display:block; margin-bottom:12px"></i>
            <p style="font-size:14px; font-weight:600; color:var(--text-primary)">Aucun examen disponible pour l'instant</p>
            <p style="font-size:12px; color:var(--text-muted)">Votre professeur n'a pas encore publié d'examen.</p>
          </div>
        }

        <div style="display:flex; flex-direction:column; gap:12px">
          @for (quiz of examQuizzes(); track quiz.id) {
            <div class="exam-card" [class.attempted]="hasAttempted(quiz.id)">
              <div style="display:flex; align-items:center; gap:14px">
                <div style="width:48px; height:48px; border-radius:12px; background:{{ hasAttempted(quiz.id) ? '#D1FAE5' : 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                  @if (hasAttempted(quiz.id)) {
                    <i class="ti ti-check" style="font-size:22px; color:#047857"></i>
                  } @else {
                    <i class="ti ti-certificate" style="font-size:22px; color:white"></i>
                  }
                </div>
                <div style="flex:1">
                  <h3 style="font-size:14px; font-weight:700; color:var(--text-primary); margin:0 0 4px">{{ quiz.title }}</h3>
                  <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap">
                    <span class="exam-badge">
                      <i class="ti ti-clock" style="font-size:11px"></i> {{ quiz.timeLimit }}
                    </span>
                    <span class="exam-badge">
                      <i class="ti ti-list" style="font-size:11px"></i> {{ quiz.questions.length }} questions
                    </span>
                    <span class="exam-badge">
                      <i class="ti ti-star" style="font-size:11px"></i> {{ quiz.level || 'B1' }}
                    </span>
                  </div>
                </div>
                <div>
                  @if (hasAttempted(quiz.id)) {
                    <div style="text-align:center">
                      <div class="attempt-result" [class]="getAttemptGrade(quiz.id)">
                        {{ getAttemptScore(quiz.id) }}%
                      </div>
                      <div style="font-size:9px; color:var(--text-muted); margin-top:2px">Complété</div>
                    </div>
                  } @else {
                    <button class="btn-p" style="padding:8px 20px; font-size:13px; background:linear-gradient(135deg,#4F46E5,#7C3AED); border:none" (click)="startExam(quiz)">
                      <i class="ti ti-player-play-filled"></i> Commencer
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Past Attempts -->
        @if (myAttempts().length > 0) {
          <div style="margin-top:8px">
            <div class="st">Mes résultats d'examens</div>
            <div style="display:flex; flex-direction:column; gap:8px">
              @for (att of myAttempts(); track att.id) {
                <div class="card" style="padding:12px 16px; border-left:3px solid {{ att.passed ? '#059669' : '#EF4444' }}; display:flex; align-items:center; gap:12px">
                  <div style="flex:1">
                    <div style="font-size:13px; font-weight:700; color:var(--text-primary)">{{ att.quizTitle }}</div>
                    <div style="font-size:11px; color:var(--text-muted); margin-top:2px">
                      {{ att.completedAt | date:'d MMM yyyy, HH:mm' }} · {{ formatDuration(att.timeTakenSeconds) }}
                    </div>
                  </div>
                  <div style="text-align:center">
                    <div style="font-size:20px; font-weight:800; color:{{ att.passed ? '#059669' : '#EF4444' }}">{{ att.percentage }}%</div>
                    <span class="pill" [class]="att.passed ? 'g' : 'r'" style="font-size:9px">{{ att.passed ? '✓ Réussi' : '✗ Échoué' }}</span>
                  </div>
                  <button class="btn-s" style="font-size:11px; padding:4px 10px" (click)="printResult(att)">
                    <i class="ti ti-printer"></i> PDF
                  </button>
                </div>
              }
            </div>
          </div>
        }
      }

      <!-- ACTIVE EXAM VIEW -->
      @if (view() === 'exam' && activeQuiz()) {
        <div class="exam-session">
          <!-- Exam Header / Timer -->
          <div class="exam-topbar">
            <div style="display:flex; align-items:center; gap:12px">
              <div style="width:36px; height:36px; background:rgba(255,255,255,0.15); border-radius:8px; display:flex; align-items:center; justify-content:center">
                <i class="ti ti-certificate" style="font-size:18px; color:white"></i>
              </div>
              <div>
                <div style="font-size:13px; font-weight:700; color:white">{{ activeQuiz()!.title }}</div>
                <div style="font-size:11px; color:rgba(255,255,255,0.6)">{{ activeQuiz()!.questions.length }} questions</div>
              </div>
            </div>

            <div class="exam-timer" [class.timer-warning]="timeLeft() < 120" [class.timer-danger]="timeLeft() < 60">
              <i class="ti ti-clock" style="font-size:14px"></i>
              <span style="font-size:18px; font-weight:800; font-variant-numeric:tabular-nums">{{ formatTimer(timeLeft()) }}</span>
            </div>

            <!-- Progress -->
            <div style="min-width:120px">
              <div style="font-size:10px; color:rgba(255,255,255,0.6); margin-bottom:4px; text-align:right">
                {{ answeredCount() }} / {{ activeQuiz()!.questions.length }} répondus
              </div>
              <div style="height:4px; background:rgba(255,255,255,0.2); border-radius:99px; overflow:hidden">
                <div style="height:100%; background:white; border-radius:99px; transition:width 0.3s" [style.width.%]="(answeredCount() / activeQuiz()!.questions.length) * 100"></div>
              </div>
            </div>
          </div>

          <!-- Questions Navigator (dots) -->
          <div style="display:flex; gap:6px; flex-wrap:wrap; padding:12px 0; border-bottom:1px solid var(--border-weak)">
            @for (q of activeQuiz()!.questions; track q; let i = $index) {
              <button
                class="q-dot"
                [class.answered]="examAnswers()[i]"
                [class.current]="currentQuestionIdx() === i"
                (click)="currentQuestionIdx.set(i)"
              >{{ i + 1 }}</button>
            }
          </div>

          <!-- Active Question -->
          @if (currentQuestion(); as q) {
            @if (activeQuiz()?.youtubeUrl) {
              <div class="card" style="padding:10px; margin-bottom:16px; background:#000; border-radius:10px; overflow:hidden">
                <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden">
                  <iframe 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0"
                    [src]="getYouTubeEmbedUrl(activeQuiz()?.youtubeUrl)"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                  </iframe>
                </div>
                @if (activeQuiz()?.youtubeDescription) {
                  <p style="font-size: 11.5px; color: #94A3B8; margin-top: 8px; font-style: italic; line-height: 1.4; margin-bottom: 0">
                    💡 {{ activeQuiz()?.youtubeDescription }}
                  </p>
                }
              </div>
            }

            <div class="question-card" style="animation: fadeIn 0.3s ease">
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px">
                <div style="width:28px; height:28px; background:#4F46E5; border-radius:8px; display:flex; align-items:center; justify-content:center; color:white; font-size:12px; font-weight:700; flex-shrink:0">
                  {{ currentQuestionIdx() + 1 }}
                </div>
                <h3 class="q-text">{{ q.question }}</h3>
              </div>

              <!-- Oral Practice / Essay -->
              @if (activeQuiz()!.type === 'Oral Practice' || activeQuiz()!.type === 'Essay') {
                <div style="background:#F8F9FF; border:1px solid #C7D2FE; border-radius:8px; padding:16px; text-align:center">
                  <i class="ti ti-microphone" style="font-size:32px; color:#4F46E5; display:block; margin-bottom:8px"></i>
                  <p style="font-size:12px; color:var(--text-secondary)">Réponse orale — Allez dans l'onglet Speaking pour soumettre.</p>
                  <button class="option-btn" [class.selected]="examAnswers()[currentQuestionIdx()]" (click)="setAnswer(currentQuestionIdx(), 'NOTED')">
                    ✓ Marquer comme vu
                  </button>
                </div>
              }

              <!-- Multiple Choice options -->
              @if (q.options && q.options.length > 0) {
                <div style="display:flex; flex-direction:column; gap:8px">
                  @for (opt of q.options; track opt; let oi = $index) {
                    @if (opt) {
                      <button
                        class="option-btn"
                        [class.selected]="examAnswers()[currentQuestionIdx()] === getOptionLetter(oi)"
                        (click)="setAnswer(currentQuestionIdx(), getOptionLetter(oi))"
                      >
                        <span class="opt-letter">{{ getOptionLetter(oi) }}</span>
                        <span>{{ opt }}</span>
                      </button>
                    }
                  }
                </div>
              }

              <!-- True / False -->
              @if (activeQuiz()!.type === 'True / False' && (!q.options || q.options.length === 0)) {
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
                  <button class="option-btn true-btn" [class.selected]="examAnswers()[currentQuestionIdx()] === 'A'" (click)="setAnswer(currentQuestionIdx(), 'A')">
                    ✓ True (Vrai)
                  </button>
                  <button class="option-btn false-btn" [class.selected]="examAnswers()[currentQuestionIdx()] === 'B'" (click)="setAnswer(currentQuestionIdx(), 'B')">
                    ✗ False (Faux)
                  </button>
                </div>
              }

              <!-- Navigation -->
              <div style="display:flex; justify-content:space-between; margin-top:24px; padding-top:16px; border-top:1px solid var(--border-weak)">
                <button class="btn-s" [disabled]="currentQuestionIdx() === 0" (click)="prevQuestion()">
                  <i class="ti ti-chevron-left"></i> Précédent
                </button>

                @if (currentQuestionIdx() < activeQuiz()!.questions.length - 1) {
                  <button class="btn-p" (click)="nextQuestion()">
                    Suivant <i class="ti ti-chevron-right"></i>
                  </button>
                } @else {
                  <button class="btn-p" style="background:#059669; border-color:#059669" [disabled]="answeredCount() < activeQuiz()!.questions.length" (click)="submitExam()">
                    <i class="ti ti-check"></i> Soumettre l'examen
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- RESULT VIEW -->
      @if (view() === 'result' && lastAttempt()) {
        <div style="animation: fadeIn 0.4s ease">
          <!-- Result Hero -->
          <div class="result-hero" [class.passed]="lastAttempt()!.passed" [class.failed]="!lastAttempt()!.passed">
            <div style="font-size:64px; margin-bottom:12px">{{ lastAttempt()!.passed ? '🎓' : '📚' }}</div>
            <h2 style="font-size:24px; font-weight:800; color:white; margin:0 0 8px">
              {{ lastAttempt()!.passed ? 'Examen réussi !' : 'Examen terminé' }}
            </h2>
            <div style="font-size:48px; font-weight:900; color:white; margin:8px 0">{{ lastAttempt()!.percentage }}%</div>
            <p style="color:rgba(255,255,255,0.8); font-size:13px; margin:0">
              {{ lastAttempt()!.score }} bonnes réponses sur {{ lastAttempt()!.answers.length }} questions
            </p>
          </div>

          <!-- Result Details -->
          <div class="card" style="margin-top:16px">
            <h3 class="st">Détail des réponses</h3>
            <div style="display:flex; flex-direction:column; gap:8px">
              @for (ans of lastAttempt()!.answers; track ans.questionIdx) {
                @if (activeQuiz(); as quiz) {
                  <div class="answer-review" [class.correct-ans]="ans.correct" [class.wrong-ans]="!ans.correct">
                    <div style="display:flex; align-items:center; gap:10px">
                      <div class="ans-icon" [class]="ans.correct ? 'ok' : 'ko'">
                        <i class="ti" [class]="ans.correct ? 'ti-check' : 'ti-x'"></i>
                      </div>
                      <div style="flex:1">
                        <div style="font-size:12px; font-weight:600; color:var(--text-primary)">{{ quiz.questions[ans.questionIdx]?.question }}</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-top:2px">
                          Votre réponse : <strong>{{ ans.answer }}</strong>
                          @if (!ans.correct) {
                            · Bonne réponse : <strong style="color:#059669">{{ quiz.questions[ans.questionIdx]?.correctOption }}</strong>
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                }
              }
            </div>
          </div>

          <div style="display:flex; gap:12px; margin-top:16px">
            <button class="btn-p" style="flex:1; height:44px" (click)="printResult(lastAttempt()!)">
              <i class="ti ti-printer"></i> Exporter en PDF
            </button>
            <button class="btn-s" style="flex:1; height:44px" (click)="view.set('list')">
              <i class="ti ti-list"></i> Retour aux examens
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .exam-card {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      transition: all 0.2s ease;
    }

    .exam-card:hover:not(.attempted) {
      border-color: #4F46E5;
      box-shadow: 0 4px 14px rgba(79,70,229,0.1);
    }

    .exam-card.attempted {
      background: #F0FDF4;
      border-color: #A7F3D0;
    }

    .exam-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      font-weight: 600;
      color: var(--text-secondary);
      background: var(--surface-2);
      padding: 2px 8px;
      border-radius: 20px;
    }

    .attempt-result {
      font-size: 20px;
      font-weight: 800;
      padding: 6px 12px;
      border-radius: 8px;
    }

    .attempt-result.good { background: #D1FAE5; color: #047857; }
    .attempt-result.bad { background: #FEE2E2; color: #B91C1C; }

    .exam-session { display: flex; flex-direction: column; gap: 16px; }

    .exam-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: linear-gradient(135deg, #1E1B4B, #312E81);
      padding: 16px 20px;
      border-radius: 12px;
      flex-wrap: wrap;
    }

    .exam-timer {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.15);
      padding: 8px 16px;
      border-radius: 8px;
      color: white;
      transition: all 0.3s;
    }

    .exam-timer.timer-warning { background: rgba(251,191,36,0.3); }
    .exam-timer.timer-danger { background: rgba(239,68,68,0.4); animation: timerPulse 1s infinite; }

    @keyframes timerPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.04); }
    }

    .q-dot {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background: var(--surface-2);
      font-size: 10px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
      color: var(--text-muted);
    }
    .q-dot.answered { background: #D1FAE5; border-color: #059669; color: #047857; }
    .q-dot.current { background: #4F46E5; border-color: #4F46E5; color: white; }
    .q-dot.current.answered { background: #059669; border-color: #059669; }

    .question-card {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 24px;
    }

    .q-text {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.4;
      margin: 0;
    }

    .option-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 13px 16px;
      border: 1.5px solid var(--border);
      border-radius: 10px;
      background: var(--surface-1);
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
      text-align: left;
      transition: all 0.2s;
      font-family: inherit;
    }

    .option-btn:hover { border-color: #4F46E5; background: #F5F3FF; }
    .option-btn.selected { border-color: #4F46E5; background: #EEF2FF; color: #3730A3; font-weight: 700; }
    .option-btn.true-btn.selected { border-color: #059669; background: #ECFDF5; color: #047857; }
    .option-btn.false-btn.selected { border-color: #DC2626; background: #FEF2F2; color: #B91C1C; }

    .opt-letter {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: var(--surface-2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 800;
      flex-shrink: 0;
      color: var(--text-secondary);
    }

    .option-btn.selected .opt-letter {
      background: #4F46E5;
      color: white;
    }

    .result-hero {
      text-align: center;
      padding: 40px 30px;
      border-radius: 16px;
    }

    .result-hero.passed { background: linear-gradient(135deg, #059669, #0D9488); }
    .result-hero.failed { background: linear-gradient(135deg, #DC2626, #9B1C1C); }

    .answer-review {
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid var(--border);
    }
    .answer-review.correct-ans { background: #F0FDF4; border-color: #A7F3D0; }
    .answer-review.wrong-ans { background: #FEF2F2; border-color: #FCA5A5; }

    .ans-icon {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      flex-shrink: 0;
    }
    .ans-icon.ok { background: #059669; color: white; }
    .ans-icon.ko { background: #DC2626; color: white; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class StudentExamComponent implements OnDestroy {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  currentUser = signal<UserProfile | null>(null);
  quizzes = signal<Quiz[]>([]);
  examAttempts = signal<ExamAttempt[]>([]);

  view = signal<'list' | 'exam' | 'result'>('list');
  activeQuiz = signal<Quiz | null>(null);
  currentQuestionIdx = signal<number>(0);
  examAnswers = signal<Record<number, string>>({});
  timeLeft = signal<number>(0);
  lastAttempt = signal<ExamAttempt | null>(null);

  private timerInterval: any = null;
  private startTime = 0;

  constructor() {
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
    this.db.observeQuizzes().subscribe(list => this.quizzes.set(list.filter(q => q.status !== 'draft')));
    this.db.observeExamAttempts().subscribe(list => {
      const user = this.currentUser();
      if (user) this.examAttempts.set(this.db.getStudentExamAttempts(user.id));
    });
  }

  private sanitizer = inject(DomSanitizer);

  private safeUrlCache = new Map<string, SafeResourceUrl>();

  getYouTubeEmbedUrl(url: string | undefined): SafeResourceUrl {
    if (!url) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    if (this.safeUrlCache.has(url)) {
      return this.safeUrlCache.get(url)!;
    }
    let videoId = '';
    try {
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
      } else if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        videoId = urlParams.get('v') || '';
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1].split(/[?#]/)[0];
      }
    } catch (e) {
      console.warn('Error parsing YouTube URL', e);
    }
    const safe = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
    this.safeUrlCache.set(url, safe);
    return safe;
  }

  examQuizzes = computed<Quiz[]>(() =>
    this.quizzes().filter(q => q.isOfficialExam && (q.isExamActive || q.status === 'published') && q.questions.length > 0)
  );

  myAttempts = computed<ExamAttempt[]>(() =>
    [...this.examAttempts()].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
  );

  currentQuestion = computed(() => {
    const quiz = this.activeQuiz();
    if (!quiz) return null;
    return quiz.questions[this.currentQuestionIdx()] ?? null;
  });

  answeredCount = computed(() => Object.keys(this.examAnswers()).length);

  hasAttempted(quizId: string): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return this.examAttempts().some(a => a.quizId === quizId && a.studentId === user.id);
  }

  getAttemptScore(quizId: string): number {
    const user = this.currentUser();
    if (!user) return 0;
    const att = this.examAttempts().find(a => a.quizId === quizId && a.studentId === user.id);
    return att ? att.percentage : 0;
  }

  getAttemptGrade(quizId: string): string {
    const score = this.getAttemptScore(quizId);
    return score >= 60 ? 'attempt-result good' : 'attempt-result bad';
  }

  startExam(quiz: Quiz) {
    const user = this.currentUser();
    if (!user) return;

    if (this.hasAttempted(quiz.id)) {
      this.dialogService.alert('Déjà tenté', 'Vous avez déjà passé cet examen. Une seule tentative est autorisée.', 'info');
      return;
    }

    this.activeQuiz.set({ ...quiz, questions: this.shuffleArray([...quiz.questions]) });
    this.examAnswers.set({});
    this.currentQuestionIdx.set(0);
    this.startTime = Date.now();

    // Parse time limit
    const minutes = this.parseMinutes(quiz.timeLimit);
    this.timeLeft.set(minutes * 60);
    this.startTimer();
    this.view.set('exam');
  }

  startTimer() {
    this.clearTimer();
    this.timerInterval = setInterval(() => {
      const tl = this.timeLeft() - 1;
      this.timeLeft.set(tl);
      if (tl <= 0) {
        this.clearTimer();
        this.dialogService.alert('Temps écoulé ⏰', 'Le temps est écoulé. Votre examen est soumis automatiquement.', 'info');
        this.submitExam();
      }
    }, 1000);
  }

  clearTimer() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  ngOnDestroy() { this.clearTimer(); }

  setAnswer(idx: number, answer: string) {
    const current = { ...this.examAnswers() };
    current[idx] = answer;
    this.examAnswers.set(current);
  }

  prevQuestion() {
    const idx = this.currentQuestionIdx();
    if (idx > 0) this.currentQuestionIdx.set(idx - 1);
  }

  nextQuestion() {
    const quiz = this.activeQuiz();
    if (!quiz) return;
    const idx = this.currentQuestionIdx();
    if (idx < quiz.questions.length - 1) this.currentQuestionIdx.set(idx + 1);
  }

  async submitExam() {
    this.clearTimer();
    const quiz = this.activeQuiz();
    const user = this.currentUser();
    if (!quiz || !user) return;

    const timeTaken = Math.floor((Date.now() - this.startTime) / 1000);
    const answers = quiz.questions.map((q, idx) => {
      const given = this.examAnswers()[idx] || '';
      const correct = given === q.correctOption;
      return { questionIdx: idx, answer: given, correct };
    });

    const correctCount = answers.filter(a => a.correct).length;
    const percentage = Math.round((correctCount / quiz.questions.length) * 100);

    const attempt: Omit<ExamAttempt, 'id'> = {
      studentId: user.id,
      studentName: user.name,
      quizId: quiz.id,
      quizTitle: quiz.title,
      answers,
      score: correctCount,
      percentage,
      timeTakenSeconds: timeTaken,
      completedAt: new Date().toISOString(),
      passed: percentage >= 60
    };

    const saved = await this.db.submitExamAttempt(attempt);
    this.lastAttempt.set(saved);
    this.examAttempts.set(this.db.getStudentExamAttempts(user.id));

    // Award XP
    const xpMax = quiz.points || 100;
    const xp = percentage >= 60 ? xpMax : Math.round(xpMax * 0.2);
    this.db.updateUserXP(user.id, xp, true);

    // Log activity
    await this.db.logActivity({
      studentId: user.id,
      type: 'exam',
      title: quiz.title,
      score: correctCount,
      maxScore: quiz.questions.length,
      percentage,
      timeSpentSeconds: timeTaken,
      status: 'completed',
      completedAt: new Date().toISOString(),
      quizId: quiz.id
    });

    this.view.set('result');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  printResult(att: ExamAttempt) {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Résultats Examen — SpeakUp</title></head>
      <body style="font-family:Arial; padding:30px">
        <h1 style="color:#4F46E5">SpeakUp — Résultats d'Examen</h1>
        <hr>
        <p><strong>Élève :</strong> ${att.studentName}</p>
        <p><strong>Examen :</strong> ${att.quizTitle}</p>
        <p><strong>Date :</strong> ${new Date(att.completedAt).toLocaleString('fr-FR')}</p>
        <p><strong>Score :</strong> ${att.score}/${att.answers.length} questions (${att.percentage}%)</p>
        <p><strong>Résultat :</strong> <span style="color:${att.passed ? '#059669' : '#DC2626'}; font-weight:bold">${att.passed ? '✓ RÉUSSI' : '✗ ÉCHOUÉ'}</span></p>
        <p><strong>Temps passé :</strong> ${this.formatDuration(att.timeTakenSeconds)}</p>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 400);
  }

  formatTimer(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  formatDuration(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}min ${s}s` : `${s}s`;
  }

  parseMinutes(timeLimit: string): number {
    const match = timeLimit.match(/(\d+)\s*min/i);
    if (match) return parseInt(match[1]);
    if (timeLimit.includes('heure') || timeLimit.includes('hour')) return 60;
    return 30;
  }

  getOptionLetter(idx: number): string {
    return ['A', 'B', 'C', 'D'][idx] || 'A';
  }

  shuffleArray<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
