import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Submission, UserProfile, Quiz, ActivityLog } from '../../services/database.service';

@Component({
  selector: 'app-student-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <!-- Header -->
      <div class="welcome" style="background:linear-gradient(135deg,#F0FDF4 0%,#EFF6FF 100%); border:1px solid #A7F3D0; padding:20px 24px">
        <div style="display:flex; align-items:center; gap:14px">
          <div style="width:48px; height:48px; background:linear-gradient(135deg,#059669,#0D9488); border-radius:12px; display:flex; align-items:center; justify-content:center">
            <i class="ti ti-history" style="color:white; font-size:22px"></i>
          </div>
          <div>
            <h2 style="font-size:16px; font-weight:800; color:#065F46; margin:0 0 3px">Mon Historique</h2>
            <p style="font-size:12px; color:#047857; margin:0">
              {{ currentUser()?.name }} · {{ totalActivities() }} activité(s) complétée(s)
            </p>
          </div>
          <div style="margin-left:auto; display:flex; gap:10px; flex-wrap:wrap">
            <div class="hist-stat" style="background:#FFF; border:1px solid #A7F3D0">
              <span class="hist-stat-val" style="color:#059669">{{ completedCount() }}</span>
              <span class="hist-stat-lbl">Complétés</span>
            </div>
            <div class="hist-stat" style="background:#FFF; border:1px solid #FDE68A">
              <span class="hist-stat-val" style="color:#D97706">{{ pendingCount() }}</span>
              <span class="hist-stat-lbl">En attente</span>
            </div>
            <div class="hist-stat" style="background:#FFF; border:1px solid #C7D2FE">
              <span class="hist-stat-val" style="color:#4F46E5">{{ totalXP() }} XP</span>
              <span class="hist-stat-lbl">Gagné</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Progression globale -->
      <div class="card" style="padding:14px 20px">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
          <span style="font-size:12px; font-weight:600; color:var(--text-primary)">Progression globale</span>
          <span style="font-size:12px; font-weight:700; color:#4F46E5">{{ progressPercent() }}%</span>
        </div>
        <div class="progress-bar" style="height:8px">
          <div class="progress-fill" [style.width.%]="progressPercent()" style="background:linear-gradient(90deg,#4F46E5,#7C3AED); transition:width 0.6s ease"></div>
        </div>
        <div style="display:flex; justify-content:space-between; margin-top:4px">
          <span style="font-size:10px; color:var(--text-muted)">{{ completedCount() }} activités</span>
          <span style="font-size:10px; color:var(--text-muted)">{{ totalActivities() }} au total</span>
        </div>
      </div>

      <!-- Filters (Category tabs) -->
      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center">
        <button class="tab" [class.active]="activeSubTab() === 'homework'" (click)="activeSubTab.set('homework')" style="display:inline-flex; align-items:center; gap:6px">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          Devoirs ({{ homeworkHistory().length }})
        </button>
        <button class="tab" [class.active]="activeSubTab() === 'quizzes'" (click)="activeSubTab.set('quizzes')" style="display:inline-flex; align-items:center; gap:6px">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          Quizzes ({{ quizHistory().length }})
        </button>
        <button class="tab" [class.active]="activeSubTab() === 'vocab'" (click)="activeSubTab.set('vocab')" style="display:inline-flex; align-items:center; gap:6px">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4"/><path d="M8 10v4"/><line x1="15" y1="11" x2="15" y2="11"/><line x1="18" y1="13" x2="18" y2="13"/></svg>
          Vocabulaire ({{ vocabHistory().length }})
        </button>
        <button class="tab" [class.active]="activeSubTab() === 'exams'" (click)="activeSubTab.set('exams')" style="display:inline-flex; align-items:center; gap:6px">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
          Examens ({{ examHistory().length }})
        </button>

        <!-- Sort -->
        <div style="margin-left:auto">
          <select [ngModel]="sortOrder()" (ngModelChange)="sortOrder.set($event)" style="height:32px; padding:0 10px; border:1px solid var(--border); border-radius:8px; font-size:11px; background:var(--surface-1); color:var(--text-primary)">
            <option value="newest">Plus récent</option>
            <option value="oldest">Plus ancien</option>
            <option value="score">Par score</option>
          </select>
        </div>
      </div>

      <!-- Category Lists -->
      <div style="display:flex; flex-direction:column; gap:10px">

        <!-- 1. HOMEWORK TAB -->
        @if (activeSubTab() === 'homework') {
          @if (homeworkHistory().length === 0) {
            <div style="text-align:center; padding:50px 20px; border:1px dashed var(--border); border-radius:12px; background:var(--surface-1)">
              <i class="ti ti-notebook" style="font-size:40px; color:var(--text-muted); display:block; margin-bottom:12px"></i>
              <h4 style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:6px">Aucun devoir rendu</h4>
              <p style="font-size:12px; color:var(--text-muted)">Soumettez des devoirs d'expression écrite ou orale pour les retrouver ici.</p>
            </div>
          }
          @for (sub of homeworkHistory(); track sub.id) {
            <div class="card" style="padding:14px 16px; border-left:4px solid {{ sub.graded ? '#059669' : '#F59E0B' }}; display:flex; align-items:center; justify-content:space-between; margin:0">
              <div style="display:flex; align-items:center; gap:12px; flex:1">
                <div style="width:36px; height:36px; border-radius:8px; background:{{ sub.graded ? '#ECFDF5' : '#FFFBEB' }}; display:flex; align-items:center; justify-content:center; flex-shrink:0; color: {{ sub.graded ? '#059669' : '#D97706' }}">
                  @if (sub.type === 'audio') {
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  }
                </div>
                <div style="flex:1">
                  <div style="font-size:13px; font-weight:700; color:var(--text-primary)">{{ sub.lessonTitle }}</div>
                  <div style="font-size:11px; color:var(--text-muted); margin-top:2px">
                    Rendu le {{ sub.submittedAt | date:'d MMM yyyy, HH:mm' }}
                    @if (sub.xpReward) {
                      · <span style="color:#059669; font-weight:600">+{{ sub.xpReward }} XP</span>
                    }
                  </div>
                </div>
              </div>
              <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px">
                <span class="pill" [class.done]="sub.graded" [class.new]="!sub.graded" style="font-size:10px">
                  {{ sub.graded ? '✓ Corrigé' : '⏳ En attente' }}
                </span>
                @if (sub.graded && sub.score) {
                  <div class="score-chip" style="font-size:11.5px; font-weight:800; padding:2px 8px; background:#EEF2FF; color:#4F46E5; border-radius:12px">
                    Note: {{ sub.score }}
                  </div>
                }
              </div>
            </div>
          }
        }

        <!-- 2. QUIZZES TAB -->
        @if (activeSubTab() === 'quizzes') {
          @if (quizHistory().length === 0) {
            <div style="text-align:center; padding:50px 20px; border:1px dashed var(--border); border-radius:12px; background:var(--surface-1)">
              <i class="ti ti-pencil" style="font-size:40px; color:var(--text-muted); display:block; margin-bottom:12px"></i>
              <h4 style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:6px">Aucun quiz complété</h4>
              <p style="font-size:12px; color:var(--text-muted)">Participez aux quiz de grammaire ou de vocabulaire pour suivre vos scores ici.</p>
            </div>
          }
          @for (item of quizHistory(); track item.id) {
            <div class="history-card completed" style="margin:0; padding:12px 16px; border-left:4px solid #059669; display:flex; align-items:center; justify-content:space-between">
              <div style="display:flex; align-items:center; gap:12px; flex:1">
                <div class="activity-icon quiz-bg" style="display:flex; align-items:center; justify-content:center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </div>
                <div>
                  <h4 class="hist-title">{{ item.title }}</h4>
                  <div class="hist-meta" style="margin-top:2px">
                    <span>Complété le {{ item.completedAt | date:'d MMM yyyy, HH:mm' }}</span>
                    @if (item.xpGained) {
                      <span class="bull">·</span>
                      <span style="color:#059669; font-weight:600">+{{ item.xpGained }} XP</span>
                    }
                  </div>
                  @if (item.percentage !== undefined) {
                    <div style="margin-top:6px; display:flex; align-items:center; gap:8px">
                      <div style="width:120px; height:4px; background:#E5E7EB; border-radius:99px; overflow:hidden">
                        <div [style.width.%]="item.percentage" style="height:100%; background:linear-gradient(90deg,#4F46E5,#7C3AED); border-radius:99px"></div>
                      </div>
                      <span style="font-size:10px; font-weight:700; color:#4F46E5">{{ item.percentage }}%</span>
                    </div>
                  }
                </div>
              </div>
              <div class="score-chip" style="font-size:12px">
                <i class="ti ti-star-filled" style="color:#F59E0B"></i>
                {{ item.score }}/{{ item.maxScore }}
              </div>
            </div>
          }
        }

        <!-- 3. VOCABULARY GAMES TAB -->
        @if (activeSubTab() === 'vocab') {
          @if (vocabHistory().length === 0) {
            <div style="text-align:center; padding:50px 20px; border:1px dashed var(--border); border-radius:12px; background:var(--surface-1)">
              <i class="ti ti-device-gamepad-2" style="font-size:40px; color:var(--text-muted); display:block; margin-bottom:12px"></i>
              <h4 style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:6px">Aucun jeu joué</h4>
              <p style="font-size:12px; color:var(--text-muted)">Lancez des jeux de vocabulaire interactifs pour remporter des scores !</p>
            </div>
          }
          @for (item of vocabHistory(); track item.id) {
            <div class="history-card completed" style="margin:0; padding:12px 16px; border-left:4px solid #0D9488; display:flex; align-items:center; justify-content:space-between">
              <div style="display:flex; align-items:center; gap:12px; flex:1">
                <div class="activity-icon vocab-bg" style="display:flex; align-items:center; justify-content:center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4"/><path d="M8 10v4"/><line x1="15" y1="11" x2="15" y2="11"/><line x1="18" y1="13" x2="18" y2="13"/></svg>
                </div>
                <div>
                  <h4 class="hist-title">{{ item.gameTitle }}</h4>
                  <div class="hist-meta" style="margin-top:2px">
                    <span>Joué le {{ item.completedAt | date:'d MMM yyyy, HH:mm' }}</span>
                    @if (item.xpGained) {
                      <span class="bull">·</span>
                      <span style="color:#059669; font-weight:600">+{{ item.xpGained }} XP</span>
                    }
                  </div>
                  <div style="font-size:11px; color:var(--text-muted); margin-top:4px">
                    Précision: {{ item.successRate }}% · Fautes: {{ item.mistakes }}
                  </div>
                </div>
              </div>
              <div class="score-chip" style="font-size:12px; background:#F0FDF4; color:#15803D">
                Score: {{ item.score }} pts
              </div>
            </div>
          }
        }

        <!-- 4. EXAMS TAB -->
        @if (activeSubTab() === 'exams') {
          @if (examHistory().length === 0) {
            <div style="text-align:center; padding:50px 20px; border:1px dashed var(--border); border-radius:12px; background:var(--surface-1)">
              <i class="ti ti-certificate" style="font-size:40px; color:var(--text-muted); display:block; margin-bottom:12px"></i>
              <h4 style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:6px">Aucun examen passé</h4>
              <p style="font-size:12px; color:var(--text-muted)">Passez les examens officiels activés par vos professeurs pour recevoir vos certifications.</p>
            </div>
          }
          @for (item of examHistory(); track item.id) {
            <div class="history-card completed" style="margin:0; padding:12px 16px; border-left:4px solid #4F46E5; display:flex; align-items:center; justify-content:space-between">
              <div style="display:flex; align-items:center; gap:12px; flex:1">
                <div class="activity-icon" style="background:#EEF2FF; display:flex; align-items:center; justify-content:center; color:#4F46E5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                </div>
                <div>
                  <h4 class="hist-title">{{ item.examTitle }}</h4>
                  <div class="hist-meta" style="margin-top:2px">
                    <span>Date: {{ item.completedAt | date:'d MMM yyyy, HH:mm' }}</span>
                    @if (item.xpGained) {
                      <span class="bull">·</span>
                      <span style="color:#4F46E5; font-weight:600">+{{ item.xpGained }} XP</span>
                    }
                  </div>
                  @if (item.percentage !== undefined) {
                    <div style="margin-top:6px; display:flex; align-items:center; gap:8px">
                      <div style="width:120px; height:4px; background:#E5E7EB; border-radius:99px; overflow:hidden">
                        <div [style.width.%]="item.percentage" style="height:100%; background:linear-gradient(90deg,#4F46E5,#7C3AED); border-radius:99px"></div>
                      </div>
                      <span style="font-size:10px; font-weight:700; color:#4F46E5">{{ item.percentage }}%</span>
                    </div>
                  }
                </div>
              </div>
              <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px">
                <div class="score-chip" style="font-size:12px; background:#EEF2FF; color:#4F46E5">
                  {{ item.score }}/{{ item.maxScore }}
                </div>
                <span class="badge" 
                      [style.background]="item.percentage >= 60 ? '#D1FAE5' : '#FEE2E2'"
                      [style.color]="item.percentage >= 60 ? '#065F46' : '#991B1B'"
                      style="font-size:9.5px; font-weight:800; border-radius:4px; padding:2px 6px">
                  {{ item.percentage >= 60 ? 'RÉUSSI' : 'ÉCHOUÉ' }}
                </span>
              </div>
            </div>
          }
        }

      </div>
    </div>
  `,
  styles: [`
    .history-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .history-card:hover {
      border-color: #4F46E5;
      box-shadow: 0 4px 12px rgba(79,70,229,0.06);
      transform: translateY(-1px);
    }

    .history-card.completed {
      border-left: 3px solid #059669;
    }

    .history-card.pending {
      border-left: 3px solid #F59E0B;
    }

    .activity-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .activity-icon.quiz-bg { background: #EEF2FF; }
    .activity-icon.speak-bg { background: #FEF2F2; }
    .activity-icon.vocab-bg { background: #FFFBEB; }
    .activity-icon.listen-bg { background: #F0FDFA; }
    .activity-icon.exercise-bg { background: #FAF5FF; }

    .hist-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 280px;
    }

    .hist-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 3px;
      flex-wrap: wrap;
    }

    .bull { font-size: 8px; }

    .score-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #EEF2FF;
      color: #4F46E5;
      font-size: 12px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
    }

    .hist-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 14px;
      border-radius: 8px;
      min-width: 70px;
    }

    .hist-stat-val {
      font-size: 18px;
      font-weight: 800;
      line-height: 1.2;
    }

    .hist-stat-lbl {
      font-size: 9px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `]
})
export class StudentHistoryComponent {
  private db = inject(DatabaseService);

  currentUser = signal<UserProfile | null>(null);
  activityLogs = signal<any[]>([]);
  submissions = signal<Submission[]>([]);
  vocabAttempts = signal<any[]>([]);
  examAttempts = signal<any[]>([]);

  activeSubTab = signal<'homework' | 'quizzes' | 'vocab' | 'exams'>('homework');
  sortOrder = signal<'newest' | 'oldest' | 'score'>('newest');

  constructor() {
    this.db.observeCurrentUser().subscribe(u => {
      this.currentUser.set(u);
      if (u) {
        this.activityLogs.set(this.db.getStudentActivityLogs(u.id));
        this.vocabAttempts.set(this.db.getStudentVocabAttempts(u.id));
        this.examAttempts.set(this.db.getStudentExamAttempts(u.id));
      }
    });

    this.db.observeActivityLogs().subscribe(() => {
      const user = this.currentUser();
      if (user) {
        this.activityLogs.set(this.db.getStudentActivityLogs(user.id));
      }
    });

    this.db.observeSubmissions().subscribe(list => {
      const user = this.currentUser();
      if (user) {
        this.submissions.set(list.filter(s => s.studentId === user.id));
      }
    });

    this.db.observeVocabGameAttempts().subscribe(() => {
      const user = this.currentUser();
      if (user) {
        this.vocabAttempts.set(this.db.getStudentVocabAttempts(user.id));
      }
    });

    this.db.observeExamAttempts().subscribe(() => {
      const user = this.currentUser();
      if (user) {
        this.examAttempts.set(this.db.getStudentExamAttempts(user.id));
      }
    });
  }

  // Computed Lists by Category
  homeworkHistory = computed<Submission[]>(() => {
    let list = this.submissions().filter(s => s.type === 'text' || s.type === 'audio' || s.type === 'video');
    return [...list].sort((a, b) => {
      const tA = new Date(a.submittedAt).getTime();
      const tB = new Date(b.submittedAt).getTime();
      if (this.sortOrder() === 'newest') return tB - tA;
      if (this.sortOrder() === 'oldest') return tA - tB;
      if (this.sortOrder() === 'score') return parseFloat(b.score || '0') - parseFloat(a.score || '0');
      return 0;
    });
  });

  quizHistory = computed<any[]>(() => {
    let list = this.activityLogs().filter(l => l.type === 'quiz');
    return [...list].sort((a, b) => {
      const tA = new Date(a.completedAt).getTime();
      const tB = new Date(b.completedAt).getTime();
      if (this.sortOrder() === 'newest') return tB - tA;
      if (this.sortOrder() === 'oldest') return tA - tB;
      if (this.sortOrder() === 'score') return (b.percentage || 0) - (a.percentage || 0);
      return 0;
    });
  });

  vocabHistory = computed<any[]>(() => {
    let list = this.vocabAttempts();
    return [...list].sort((a, b) => {
      const tA = new Date(a.completedAt).getTime();
      const tB = new Date(b.completedAt).getTime();
      if (this.sortOrder() === 'newest') return tB - tA;
      if (this.sortOrder() === 'oldest') return tA - tB;
      if (this.sortOrder() === 'score') return (b.score || 0) - (a.score || 0);
      return 0;
    });
  });

  examHistory = computed<any[]>(() => {
    let list = this.examAttempts();
    return [...list].sort((a, b) => {
      const tA = new Date(a.completedAt).getTime();
      const tB = new Date(b.completedAt).getTime();
      if (this.sortOrder() === 'newest') return tB - tA;
      if (this.sortOrder() === 'oldest') return tA - tB;
      if (this.sortOrder() === 'score') return (b.percentage || 0) - (a.percentage || 0);
      return 0;
    });
  });

  // Global summary statistics
  totalActivities = computed(() => {
    return this.submissions().filter(s => s.type === 'text' || s.type === 'audio' || s.type === 'video').length +
           this.activityLogs().filter(l => l.type === 'quiz').length +
           this.vocabAttempts().length +
           this.examAttempts().length;
  });

  completedCount = computed(() => {
    return this.submissions().filter(s => s.graded && (s.type === 'text' || s.type === 'audio' || s.type === 'video')).length +
           this.activityLogs().filter(l => l.status === 'completed' && l.type === 'quiz').length +
           this.vocabAttempts().length +
           this.examAttempts().length;
  });

  pendingCount = computed(() => {
    return this.submissions().filter(s => !s.graded && (s.type === 'text' || s.type === 'audio' || s.type === 'video')).length;
  });

  totalXP = computed(() => {
    const hwXP = this.submissions().reduce((sum, s) => sum + (s.xpReward || 0), 0);
    const quizXP = this.activityLogs().reduce((sum, l) => sum + (l.xpGained || 0), 0);
    const vocabXP = this.vocabAttempts().reduce((sum, a) => sum + (a.xpGained || 0), 0);
    const examXP = this.examAttempts().reduce((sum, a) => sum + (a.xpGained || 0), 0);
    return hwXP + quizXP + vocabXP + examXP;
  });

  progressPercent = computed(() => {
    const total = this.totalActivities();
    if (!total) return 0;
    return Math.round((this.completedCount() / total) * 100);
  });

  getActivityEmoji(type: string): string {
    const map: Record<string, string> = {
      quiz: '📝', exercise: '✍️', speaking: '🎙️', vocabulary: '📖', listening: '👂', exam: '🎓'
    };
    return map[type] || '📝';
  }

  getActivityLabel(type: string): string {
    const map: Record<string, string> = {
      quiz: 'Quiz', exercise: 'Exercice', speaking: 'Speaking', vocabulary: 'Vocabulaire', listening: 'Écoute', exam: 'Examen'
    };
    return map[type] || type;
  }

  getActivityIconBg(type: string): string {
    const map: Record<string, string> = {
      quiz: 'quiz-bg', exercise: 'exercise-bg', speaking: 'speak-bg', vocabulary: 'vocab-bg', listening: 'listen-bg', exam: 'quiz-bg'
    };
    return `activity-icon ${map[type] || 'quiz-bg'}`;
  }

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}min ${s}s` : `${s}s`;
  }
}
