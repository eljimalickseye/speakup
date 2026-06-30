import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { DatabaseService, UserProfile, Lesson, Quiz, Announcement } from '../../services/database.service';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <!-- PLACEMENT TEST ALERT & MODAL -->
      @if (!currentUser()?.placementTestTaken) {
        <div class="card" style="background: linear-gradient(135deg, #EFF6FF 0%, #E8FFF5 100%); border: 1.5px solid #4F46E5; margin-bottom: 20px; padding: 20px; border-radius: 12px">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:20px; flex-wrap:wrap">
            <div style="flex:1; min-width:250px">
              <span class="badge" style="background:#4F46E5; color:white; font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px; text-transform:uppercase">Level Assessment</span>
              <div style="display:flex; align-items:center; gap:8px; margin-top:6px">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
                  <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5" />
                  <path d="M12 9 9 12" />
                  <path d="M13 18H9.3a1.5 1.5 0 0 1-1-.4l-2.4-2.4a1.5 1.5 0 0 1-.4-1V11c0-2 2-4 4-4h2" />
                  <path d="M12 9c2-2 4-2 6 0s2 4 0 6l-3 3" />
                  <path d="M19 5c1.5 1.5 1.5 3.5 0 5s-3.5 1.5-5 0-1.5-3.5 0-5 3.5-1.5 5 0z" />
                </svg>
                <h3 style="font-size:16px; font-weight:800; color:#1F2937; margin:0">Determine your starting English Level!</h3>
              </div>
              <p style="font-size:12.5px; color:#4B5563; margin:4px 0 0 0">
                Take this quick 5-question test to evaluate your level (A1, A2, B1, B2) and unlock matching lessons!
              </p>
            </div>
            <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5; font-size:12px; padding:8px 16px; border-radius:8px" (click)="startPlacementTest()">
              Start Test Now
            </button>
          </div>

          <!-- Active Test Modal Dialog -->
          @if (showPlacementTest()) {
            <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.65); display:flex; justify-content:center; align-items:center; z-index:99999; padding:16px">
              <div class="card" style="width:100%; max-width:550px; background:#FFF; border-radius:12px; padding:24px; box-shadow:0 10px 25px rgba(0,0,0,0.25)">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                  <h3 style="font-size:16px; font-weight:700; color:#4F46E5; margin:0">Level Placement Test</h3>
                  <div style="display:flex; align-items:center; gap:12px">
                    <span style="font-size:12px; color:var(--text-muted)">Question {{ currentQuestionIndex() + 1 }} of {{ placementQuestions().length }}</span>
                    <button (click)="showPlacementTest.set(false)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:16px; line-height:1; padding:4px; display:flex; align-items:center; justify-content:center">
                      <i class="ti ti-x"></i>
                    </button>
                  </div>
                </div>

                <!-- Progress Bar -->
                <div style="width:100%; height:6px; background:#E5E7EB; border-radius:3px; margin-bottom:20px; overflow:hidden">
                  <div [style.width.%]="((currentQuestionIndex() + 1) / (placementQuestions().length || 1)) * 100" style="height:100%; background:#4F46E5; transition:width 0.3s"></div>
                </div>

                <!-- Question Body -->
                @if (placementQuestions()[currentQuestionIndex()]; as q) {
                  <p style="font-size:14px; font-weight:600; color:#1F2937; margin-bottom:16px; line-height:1.4">{{ q.question }}</p>
                  
                  <div style="display:flex; flex-direction:column; gap:10px">
                    @for (opt of q.options; track opt; let oIdx = $index) {
                      <button 
                        class="row" 
                        [style.background]="selectedAnswers()[currentQuestionIndex()] === getOptionLetter(oIdx) ? '#EFF6FF' : '#FFF'"
                        [style.border-color]="selectedAnswers()[currentQuestionIndex()] === getOptionLetter(oIdx) ? '#4F46E5' : 'var(--border)'"
                        style="text-align:left; cursor:pointer; font-weight:500; font-size:13px; margin:0; padding:12px; border-radius:8px; display:block; width:100%"
                        (click)="selectAnswer(getOptionLetter(oIdx))">
                        <strong style="color:#4F46E5; margin-right:6px">{{ getOptionLetter(oIdx) }}.</strong> {{ opt }}
                      </button>
                    }
                  </div>
                }

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:24px; border-top:1px solid var(--border-weak); padding-top:16px">
                  <button class="btn-s" [disabled]="currentQuestionIndex() === 0" (click)="prevQuestion()">Previous</button>
                  
                  @if (currentQuestionIndex() < placementQuestions().length - 1) {
                    <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5" [disabled]="!selectedAnswers()[currentQuestionIndex()]" (click)="nextQuestion()">Next</button>
                  } @else {
                    <button class="btn-p" style="background:#10B981; border-color:#10B981" [disabled]="!selectedAnswers()[currentQuestionIndex()] || placementQuestions().length === 0" (click)="submitPlacementTest()">Submit Test</button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Welcome Banner -->
      <div class="welcome" style="display:flex; justify-content:space-between; align-items:center; gap:20px; flex-wrap:wrap">
        <div style="flex:1; min-width:250px">
          <h2 style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:8px">
            <span>Good morning, {{ currentUser()?.name }}</span>
            @if (getFlagUrl(currentUser()?.countryFlag)) {
              <img [src]="getFlagUrl(currentUser()?.countryFlag)" style="width: 22px; height: 16px; object-fit: contain; border-radius: 2px" alt="flag">
            }
            <span>!</span>
          </h2>
          <p>Your English journey is progressing beautifully. Today's challenge is waiting for you.</p>
          <button class="cta" (click)="goToLiveClass()">Join today's live class →</button>
        </div>

        <!-- Quick Profile flag selector card -->
        <div class="card" style="background:#FFF; border:1px solid #E0E7FF; padding:12px 16px; border-radius:12px; width:220px; color:#1F2937; margin-bottom:0; box-shadow:0 2px 4px rgba(0,0,0,0.02)">
          <h4 style="font-size:10px; text-transform:uppercase; font-weight:700; margin-bottom:8px; opacity:0.85; letter-spacing:0.03em; display:flex; align-items:center; gap:6px; color:#4F46E5">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px; height:12px; vertical-align:middle">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <span>Select your flag</span>
          </h4>
          <select [value]="currentUser()?.countryFlag || ''" (change)="updateFlag($event)" style="width:100%; background:#FFF; border:1px solid #CBD5E1; padding:6px 10px; border-radius:6px; font-size:12px; color:#1F2937; font-weight:600; outline:none">
            <option value="">No Flag</option>
            <option value="🇸🇳">Senegal 🇸🇳</option>
            <option value="🇳🇬">Nigeria 🇳🇬</option>
            <option value="🇷🇼">Rwanda 🇷🇼</option>
            <option value="🇧🇯">Benin 🇧🇯</option>
            <option value="🇨🇮">Ivory Coast 🇨🇮</option>
            <option value="🇨🇲">Cameroon 🇨🇲</option>
            <option value="🇹🇬">Togo 🇹🇬</option>
            <option value="🇲🇱">Mali 🇲🇱</option>
            <option value="🇬🇳">Guinea 🇬🇳</option>
            <option value="🇳🇪">Niger 🇳🇪</option>
            <option value="🇫🇷">France 🇫🇷</option>
          </select>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid3">
        <div class="card">
          <div class="card-label">XP points</div>
          <div class="card-value">{{ currentUser()?.xp | number }}</div>
          <div class="card-sub">Rank: {{ getStudentRank() }} on leaderboard</div>
        </div>
        <div class="card">
          <div class="card-label">Streak</div>
          <div class="card-value">{{ currentUser()?.streak || 0 }} days 🔥</div>
          <div class="card-sub">Daily practice streak</div>
        </div>
        <div class="card">
          <div class="card-label">Fluency level</div>
          <div class="card-value">{{ currentUser()?.level || 'B1' }}</div>
          <div class="card-sub">{{ getLevelName(currentUser()?.level) }}</div>
        </div>
      </div>

      <!-- Grid layout for Tasks vs Announcements -->
      <div class="grid-content-split">
        
        <!-- Left: Today's Tasks -->
        <div>
          <div class="section-title">Today's tasks</div>
          
          <div class="lesson-item" (click)="onTaskClick('speaking')">
            <div class="lesson-icon teal"><i class="ti ti-microphone" aria-hidden="true"></i></div>
            <div class="lesson-info">
              <div class="lesson-title">Daily speaking challenge</div>
              <div class="lesson-meta">Record your response to the daily voice prompt</div>
            </div>
            <span class="pill due">Daily</span>
          </div>

          <!-- Dynamic Lessons -->
          @for (lesson of lessons().slice(0, 2); track lesson.id) {
            <div class="lesson-item" (click)="onTaskClick('lessons')">
              <div class="lesson-icon purple"><i class="ti ti-book" aria-hidden="true"></i></div>
              <div class="lesson-info">
              <div class="lesson-title">Lesson: {{ lesson.title }}</div>
              <div class="lesson-meta">{{ lesson.type }} · Level {{ lesson.level }}</div>
            </div>
              <span class="pill new">Study</span>
            </div>
          }

          <!-- Dynamic Quizzes -->
          @for (quiz of quizzes().slice(0, 2); track quiz.id) {
            <div class="lesson-item" (click)="onTaskClick('exercises')">
              <div class="lesson-icon amber"><i class="ti ti-pencil" aria-hidden="true"></i></div>
              <div class="lesson-info">
                <div class="lesson-title">Quiz: {{ quiz.title }}</div>
                <div class="lesson-meta">{{ quiz.questions.length }} questions available</div>
              </div>
              <span class="pill done" style="background:#EEF2FF; color:#4F46E5">Quiz</span>
            </div>
          }

          @if (lessons().length === 0 && quizzes().length === 0) {
            <div style="padding: 24px; background: var(--surface-2); border-radius: 8px; border: 1px dashed var(--border); text-align: center; font-size: 12px; color: var(--text-secondary); margin-top: 10px">
              No lessons or quizzes assigned yet. Try the daily speaking challenge!
            </div>
          }
        </div>

        <!-- Right: School Announcements (History) -->
        <div>
          <div class="section-title" style="display:flex; align-items:center; justify-content:space-between">
            <span>📢 Annonces récentes</span>
            @if (announcements().length > 0) {
              <span style="font-size:10px; background:#EEF2FF; color:#4F46E5; padding:2px 8px; border-radius:20px; font-weight:700">
                {{ announcements().length }}
              </span>
            }
          </div>
          <div style="display:flex; flex-direction:column; gap:10px">
            @for (ann of announcements().slice(0,4); track ann.id) {
              <div class="ann-dash-card" (click)="selectedAnn.set(ann)"
                   [style.border-left]="'4px solid ' + getDashPriorityColor(ann.priority)">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px; gap:6px">
                  <h4 style="font-size:12px; font-weight:700; color:var(--text-primary); margin:0; flex:1; line-height:1.3">{{ ann.title }}</h4>
                  <span style="font-size:9px; color:var(--text-muted); flex-shrink:0">{{ ann.createdAt | date:'shortDate' }}</span>
                </div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.4; margin:0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden">{{ ann.message }}</p>
                <div style="font-size:10px; color:#4F46E5; font-weight:600; margin-top:6px">Voir →</div>
              </div>
            } @empty {
              <div style="padding: 24px; background: var(--surface-2); border-radius: 8px; border: 1px dashed var(--border); text-align: center; font-size: 12px; color: var(--text-secondary)">
                Aucune annonce du professeur pour le moment.
              </div>
            }
          </div>
        </div>

      </div>

    </div>

    <!-- Announcement Modal -->
    @if (selectedAnn()) {
      <div style="position:fixed; inset:0; background:rgba(0,0,0,0.58); backdrop-filter:blur(5px); z-index:1100; display:flex; align-items:center; justify-content:center; padding:20px; animation:fadeIn 0.18s ease" (click)="selectedAnn.set(null)">
        <div style="background:var(--surface-1); border-radius:18px; width:100%; max-width:560px; max-height:85vh; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 30px 70px rgba(0,0,0,0.35); animation:slideUp 0.22s ease" (click)="$event.stopPropagation()">
          <!-- Banner -->
          <div [style.background]="getDashPriorityGradient(selectedAnn()!.priority)" style="padding:18px 22px; display:flex; justify-content:space-between; align-items:center">
            <span style="font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; text-transform:uppercase" [style.background]="getDashPriorityBg(selectedAnn()!.priority)" [style.color]="getDashPriorityColor(selectedAnn()!.priority)">
              {{ getDashPriorityIcon(selectedAnn()!.priority) }} {{ selectedAnn()!.priority }}
            </span>
            <button (click)="selectedAnn.set(null)" style="background:rgba(255,255,255,0.22); border:none; color:white; width:32px; height:32px; border-radius:50%; cursor:pointer; font-size:14px">✕</button>
          </div>
          <!-- Body -->
          <div style="padding:22px; overflow-y:auto; flex:1">
            <h2 style="font-size:18px; font-weight:800; color:var(--text-primary); margin:0 0 6px 0">{{ selectedAnn()!.title }}</h2>
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:18px; display:flex; gap:10px">
              <span><i class="ti ti-calendar"></i> {{ selectedAnn()!.createdAt | date:'fullDate' }}</span>
              <span>·</span>
              <span><i class="ti ti-users"></i> {{ selectedAnn()!.sendTo }}</span>
            </div>
            @if (selectedAnn()!.imageUrl) {
              <div style="width:100%; max-height:280px; overflow:hidden; border-radius:10px; margin-bottom:18px; border:1px solid var(--border-weak)">
                <img [src]="selectedAnn()!.imageUrl" style="width:100%; height:auto; max-height:280px; object-fit:contain" alt="Flyer">
              </div>
            }
            <div style="font-size:13.5px; color:var(--text-secondary); line-height:1.8; white-space:pre-line">{{ selectedAnn()!.message }}</div>
            <div style="margin-top:22px; padding-top:16px; border-top:1px solid var(--border-weak); display:flex; justify-content:flex-end">
              <button class="btn-p" style="height:auto; padding:8px 20px; font-size:13px" (click)="selectedAnn.set(null)">Fermer</button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    ...`
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
    @keyframes slideUp { from { transform:translateY(22px); opacity:0 } to { transform:translateY(0); opacity:1 } }
    .ann-dash-card {
      background: var(--surface-1);
      border-radius: 10px;
      padding: 12px 14px;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      border: 1px solid var(--border-weak);
    }
    .ann-dash-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0,0,0,0.1);
    }
    `.split('\n').filter(l => !l.includes('...')).join('\n')
  ]
  styles: [`
    .grid-content-split {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 20px;
      align-items: start;
    }
    @media (max-width: 768px) {
      .grid-content-split {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StudentDashboardComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);
  currentUser = signal<UserProfile | null>(null);

  lessons = signal<Lesson[]>([]);
  quizzes = signal<Quiz[]>([]);
  announcements = signal<Announcement[]>([]);
  selectedAnn = signal<Announcement | null>(null);
  allUsers = signal<UserProfile[]>([]);

  // Placement Test State
  placementQuestions = signal<any[]>([]);
  showPlacementTest = signal<boolean>(false);
  currentQuestionIndex = signal<number>(0);
  selectedAnswers = signal<{ [key: number]: string }>({});

  @Output() navigateToTab = new EventEmitter<string>();

  constructor() {
    this.db.observeCurrentUser().subscribe(user => {
      this.currentUser.set(user);
      this.loadAnnouncements();
    });

    this.db.observeUsers().subscribe(list => {
      this.allUsers.set(list);
    });

    this.db.observeLessons().subscribe(list => {
      this.lessons.set(list);
    });

    this.db.observeQuizzes().subscribe(list => {
      this.quizzes.set(list);
      const pt = list.find(q => q.id === 'placement-test');
      if (pt) {
        this.placementQuestions.set(pt.questions);
      }
    });

    this.db.observeAnnouncements().subscribe(() => {
      this.loadAnnouncements();
    });
  }

  private loadAnnouncements() {
    const user = this.currentUser();
    if (!user) return;
    this.db.observeAnnouncements().subscribe(list => {
      // Filter announcements targeting this student or everyone
      const filtered = list.filter(ann => 
        ann.sendTo === 'all' || 
        ann.sendTo === 'All students' || 
        ann.sendTo === user.level || 
        ann.sendTo === `${user.level} class only` || 
        ann.sendTo.toLowerCase().includes(user.level.toLowerCase())
      );
      this.announcements.set(filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    });
  }

  getFlagUrl(flag: string | undefined): string {
    if (!flag) return '';
    const clean = flag.trim().toUpperCase();
    let code = clean;
    if (clean.length > 2) {
      try {
        const codePoints = Array.from(clean).map(c => c.codePointAt(0) || 0);
        if (codePoints.length >= 2 && codePoints[0] >= 127397 && codePoints[0] <= 127423) {
          code = String.fromCharCode(
            codePoints[0] - 127397,
            codePoints[1] - 127397
          );
        }
      } catch(e) {}
    }
    if (code.length !== 2) return '';
    return `https://flagcdn.com/w20/${code.toLowerCase()}.png`;
  }

  getLevelName(level: string | undefined): string {
    if (!level) return 'Intermediate';
    switch (level) {
      case 'A1': return 'Beginner';
      case 'A2': return 'Elementary';
      case 'B1': return 'Intermediate';
      case 'B2': return 'Upper Intermediate';
      case 'C1':
      case 'C2': return 'Advanced / Fluent';
      default: return 'Intermediate';
    }
  }

  getStudentRank(): string {
    const user = this.currentUser();
    if (!user) return '#1';
    const sorted = [...this.allUsers()]
      .filter(u => u.role === 'student')
      .sort((a, b) => b.xp - a.xp);
    const index = sorted.findIndex(u => u.id === user.id);
    return index !== -1 ? `#${index + 1}` : '#1';
  }

  updateFlag(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.db.updateCurrentUserProfile({ countryFlag: select.value });
  }

  goToLiveClass() {
    this.navigateToTab.emit('live-classes');
  }

  onTaskClick(tabName: string) {
    this.navigateToTab.emit(tabName);
  }

  // Placement Test Helper Methods
  startPlacementTest() {
    this.showPlacementTest.set(true);
    this.currentQuestionIndex.set(0);
    this.selectedAnswers.set({});
  }

  getOptionLetter(idx: number): string {
    return ['A', 'B', 'C'][idx] || 'A';
  }

  selectAnswer(letter: string) {
    this.selectedAnswers.set({
      ...this.selectedAnswers(),
      [this.currentQuestionIndex()]: letter
    });
  }

  nextQuestion() {
    if (this.currentQuestionIndex() < this.placementQuestions().length - 1) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() + 1);
    }
  }

  prevQuestion() {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() - 1);
    }
  }

  submitPlacementTest() {
    const questions = this.placementQuestions();
    const answers = this.selectedAnswers();
    let correctCount = 0;
    
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctOption) {
        correctCount++;
      }
    });

    const totalQuestions = questions.length;
    const scorePct = (correctCount / totalQuestions) * 100;
    
    // Calculate level based on score percentage
    let calculatedLevel = 'A1';
    if (scorePct >= 80) calculatedLevel = 'B2';
    else if (scorePct >= 60) calculatedLevel = 'B1';
    else if (scorePct >= 40) calculatedLevel = 'A2';
    
    // Update user profile
    this.db.updateCurrentUserProfile({
      placementTestTaken: true,
      placementTestScore: scorePct,
      level: calculatedLevel
    });

    this.showPlacementTest.set(false);
    this.dialogService.alert(
      'Assessment Complete! 🎉', 
      `Congratulations! You got ${correctCount}/${totalQuestions} answers correct. Your assigned starting level is ${calculatedLevel} — ${this.getLevelName(calculatedLevel)}!`, 
      'success'
    );
  }
}
