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

      <!-- Filters -->
      <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center">
        <button class="tab" [class.active]="filterType() === 'all'" (click)="filterType.set('all')">
          Tout ({{ totalActivities() }})
        </button>
        <button class="tab" [class.active]="filterType() === 'quiz'" (click)="filterType.set('quiz')">
          📝 Quiz
        </button>
        <button class="tab" [class.active]="filterType() === 'exercise'" (click)="filterType.set('exercise')">
          ✍️ Exercices
        </button>
        <button class="tab" [class.active]="filterType() === 'speaking'" (click)="filterType.set('speaking')">
          🎙️ Speaking
        </button>
        <button class="tab" [class.active]="filterType() === 'vocabulary'" (click)="filterType.set('vocabulary')">
          📖 Vocabulaire
        </button>

        <!-- Sort -->
        <div style="margin-left:auto">
          <select [(ngModel)]="sortOrder" style="height:32px; padding:0 10px; border:1px solid var(--border); border-radius:8px; font-size:11px; background:var(--surface-1); color:var(--text-primary)">
            <option value="newest">Plus récent</option>
            <option value="oldest">Plus ancien</option>
            <option value="score">Par score</option>
          </select>
        </div>
      </div>

      <!-- History List -->
      <div style="display:flex; flex-direction:column; gap:10px">
        @if (filteredHistory().length === 0) {
          <div style="text-align:center; padding:60px 20px; border:1px dashed var(--border); border-radius:12px; background:var(--surface-1)">
            <i class="ti ti-history" style="font-size:48px; color:var(--text-muted); display:block; margin-bottom:12px"></i>
            <h4 style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:6px">Aucun historique ici</h4>
            <p style="font-size:12px; color:var(--text-muted)">Complétez des quiz et exercices pour les retrouver ici.</p>
          </div>
        }

        @for (item of filteredHistory(); track item.id) {
          <div class="history-card" [class.completed]="item.status === 'completed'" [class.pending]="item.status === 'pending'">
            <!-- Left: Icon + Status -->
            <div style="display:flex; align-items:center; gap:14px; flex:1">
              <div class="activity-icon" [class]="getActivityIconBg(item.type)">
                <span style="font-size:18px">{{ getActivityEmoji(item.type) }}</span>
              </div>

              <div style="flex:1; min-width:0">
                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap">
                  <h4 class="hist-title">{{ item.title }}</h4>
                  <span class="pill" [class]="item.status === 'completed' ? 'g' : 'y'" style="font-size:9px">
                    {{ item.status === 'completed' ? '✓ Complété' : '⏳ En attente' }}
                  </span>
                </div>
                <div class="hist-meta">
                  <span>{{ getActivityLabel(item.type) }}</span>
                  <span class="bull">·</span>
                  <span>{{ item.completedAt | date:'d MMM yyyy, HH:mm' }}</span>
                  @if (item.teacherName) {
                    <span class="bull">·</span>
                    <span>Prof: {{ item.teacherName }}</span>
                  }
                </div>
                @if (item.percentage !== undefined) {
                  <div style="margin-top:6px; display:flex; align-items:center; gap:8px">
                    <div style="flex:1; max-width:160px; height:4px; background:#E5E7EB; border-radius:99px; overflow:hidden">
                      <div [style.width.%]="item.percentage" style="height:100%; background:linear-gradient(90deg,#4F46E5,#7C3AED); border-radius:99px; transition:width 0.5s"></div>
                    </div>
                    <span style="font-size:10px; font-weight:700; color:#4F46E5">{{ item.percentage }}%</span>
                  </div>
                }
                @if (item.percentage !== undefined && item.percentage < 50) {
                  <div style="margin-top:6px; padding:8px 10px; background:#FEF2F2; border:1px solid #FCA5A5; border-radius:6px; font-size:11px; color:#991B1B">
                    <strong>💡 Explication:</strong> Tu as échoué à cet exercice. N'hésite pas à revoir la leçon et à réessayer. La pratique est la clé du succès !
                  </div>
                }
              </div>
            </div>

            <!-- Right: Score + Time + Actions -->
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:6px; flex-shrink:0">
              @if (item.score !== undefined && item.maxScore !== undefined) {
                <div class="score-chip">
                  <i class="ti ti-star-filled" style="font-size:12px; color:#F59E0B"></i>
                  {{ item.score }}/{{ item.maxScore }}
                </div>
              }
              @if (item.timeSpentSeconds) {
                <div style="font-size:10px; color:var(--text-muted); display:flex; align-items:center; gap:3px">
                  <i class="ti ti-clock" style="font-size:10px"></i>
                  {{ formatTime(item.timeSpentSeconds) }}
                </div>
              }
              @if (item.canRetry) {
                <button class="btn-s" style="font-size:10px; padding:3px 10px; color:#4F46E5; border-color:#4F46E5">
                  <i class="ti ti-refresh" style="font-size:10px"></i> Refaire
                </button>
              }
            </div>
          </div>
        }
      </div>

      <!-- Quiz Submissions History (from Firestore) -->
      @if (submissionHistory().length > 0) {
        <div style="margin-top:8px">
          <div class="st">Copies soumises au professeur</div>
          <div style="display:flex; flex-direction:column; gap:8px">
            @for (sub of submissionHistory(); track sub.id) {
              <div class="card" style="padding:12px 16px; border-left:3px solid {{ sub.graded ? '#059669' : '#F59E0B' }}; display:flex; align-items:center; gap:12px">
                <div style="width:36px; height:36px; border-radius:8px; background:{{ sub.graded ? '#ECFDF5' : '#FFFBEB' }}; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0">
                  {{ sub.type === 'audio' ? '🎙️' : (sub.type === 'video' ? '📹' : '📝') }}
                </div>
                <div style="flex:1">
                  <div style="font-size:13px; font-weight:600; color:var(--text-primary)">{{ sub.lessonTitle }}</div>
                  <div style="font-size:11px; color:var(--text-muted); margin-top:2px">
                    {{ sub.submittedAt | date:'d MMM yyyy' }}
                    @if (sub.graded && sub.score) {
                      · Note: <strong style="color:#4F46E5">{{ sub.score }}</strong>
                    }
                  </div>
                </div>
                <span class="pill" [class]="sub.graded ? 'g' : 'y'" style="font-size:9px">
                  {{ sub.graded ? '✓ Corrigé' : '⏳ En attente' }}
                </span>
                @if (sub.graded && sub.feedback) {
                  <div style="max-width:200px; font-size:11px; color:var(--text-secondary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap">
                    "{{ sub.feedback }}"
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
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
  activityLogs = signal<ActivityLog[]>([]);
  submissions = signal<Submission[]>([]);

  filterType = signal<string>('all');
  sortOrder = 'newest';

  constructor() {
    this.db.observeCurrentUser().subscribe(u => {
      this.currentUser.set(u);
      if (u) {
        this.activityLogs.set(this.db.getStudentActivityLogs(u.id));
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
  }

  filteredHistory = computed<ActivityLog[]>(() => {
    let list = this.activityLogs();
    const ft = this.filterType();
    if (ft !== 'all') list = list.filter(l => l.type === ft);

    return [...list].sort((a, b) => {
      if (this.sortOrder === 'newest') return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      if (this.sortOrder === 'oldest') return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
      if (this.sortOrder === 'score') return (b.percentage || 0) - (a.percentage || 0);
      return 0;
    });
  });

  submissionHistory = computed<Submission[]>(() => {
    return [...this.submissions()].sort((a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  });

  totalActivities = computed(() => this.activityLogs().length + this.submissions().length);
  completedCount = computed(() => this.activityLogs().filter(l => l.status === 'completed').length + this.submissions().filter(s => s.graded).length);
  pendingCount = computed(() => this.submissions().filter(s => !s.graded).length);
  totalXP = computed(() => this.submissions().reduce((sum, s) => sum + (s.xpReward || 0), 0));
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
