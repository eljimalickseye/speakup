import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Submission, UserProfile, Quiz } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

interface EnrichedResult {
  sub: Submission;
  student: UserProfile | undefined;
  quiz: Quiz | undefined;
}

@Component({
  selector: 'app-teacher-results',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="padding:0">
      <!-- Header / Filters Bar -->
      <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--border-weak)">
        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap">
          <!-- Search -->
          <div style="position:relative">
            <i class="ti ti-search" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:14px"></i>
            <input type="text" [(ngModel)]="searchQuery" placeholder="Rechercher élève, quiz..." style="height:34px; padding:0 12px 0 32px; border:1px solid var(--border); border-radius:8px; font-size:12px; background:var(--surface-1); width:220px; color:var(--text-primary)">
          </div>

          <!-- Filter by type -->
          <select [(ngModel)]="filterType" style="height:34px; padding:0 10px; border:1px solid var(--border); border-radius:8px; font-size:12px; background:var(--surface-1); color:var(--text-primary)">
            <option value="all">Tous les types</option>
            <option value="text">Texte</option>
            <option value="audio">Vocal</option>
          </select>

          <!-- Filter by status -->
          <select [(ngModel)]="filterStatus" style="height:34px; padding:0 10px; border:1px solid var(--border); border-radius:8px; font-size:12px; background:var(--surface-1); color:var(--text-primary)">
            <option value="all">Tous statuts</option>
            <option value="graded">Corrigés</option>
            <option value="pending">En attente</option>
          </select>
        </div>

        <!-- Stats quick summary -->
        <div style="display:flex; gap:12px; flex-wrap:wrap">
          <div class="stat-badge" style="background:#EEF2FF; color:#4F46E5">
            <span class="stat-num">{{ totalSubmissions() }}</span> Total
          </div>
          <div class="stat-badge" style="background:#FEF3C7; color:#92400E">
            <span class="stat-num">{{ pendingCount() }}</span> En attente
          </div>
          <div class="stat-badge" style="background:#D1FAE5; color:#047857">
            <span class="stat-num">{{ gradedCount() }}</span> Corrigés
          </div>
          <div class="stat-badge" style="background:#F3E8FF; color:#6D28D9">
            <span class="stat-num">{{ avgScore() }}</span> Score moy.
          </div>
        </div>
      </div>

      <!-- Results Table -->
      @if (filteredResults().length > 0) {
        <div class="results-table-wrapper">
          <!-- Table Header -->
          <div class="results-header-row">
            <div class="rh-cell" style="width:160px; cursor:pointer" (click)="sortBy('student')">
              Élève <i class="ti" [class]="getSortIcon('student')"></i>
            </div>
            <div class="rh-cell" style="flex:1; cursor:pointer" (click)="sortBy('quiz')">
              Quiz / Exercice <i class="ti" [class]="getSortIcon('quiz')"></i>
            </div>
            <div class="rh-cell" style="width:80px; text-align:center; cursor:pointer" (click)="sortBy('type')">
              Type
            </div>
            <div class="rh-cell" style="width:90px; text-align:center; cursor:pointer" (click)="sortBy('score')">
              Note <i class="ti" [class]="getSortIcon('score')"></i>
            </div>
            <div class="rh-cell" style="width:120px; cursor:pointer" (click)="sortBy('date')">
              Date <i class="ti" [class]="getSortIcon('date')"></i>
            </div>
            <div class="rh-cell" style="width:90px; text-align:center">
              Statut
            </div>
            <div class="rh-cell" style="width:80px; text-align:center">
              Actions
            </div>
          </div>

          <!-- Table Rows -->
          @for (item of filteredResults(); track item.sub.id) {
            <div class="result-row" [class.selected-row]="selectedResult() !== null && selectedResult()!.sub.id === item.sub.id" (click)="selectResult(item)">
              <!-- Student -->
              <div style="width:160px; display:flex; align-items:center; gap:8px">
                <div class="mini-avatar">{{ getInitials(item.student?.name || item.sub.studentName) }}</div>
                <span style="font-size:12px; font-weight:600; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap">{{ item.student?.name || item.sub.studentName }}</span>
              </div>

              <!-- Quiz Title -->
              <div style="flex:1; overflow:hidden">
                <span style="font-size:12px; color:var(--text-primary); display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">{{ item.sub.lessonTitle }}</span>
                <span style="font-size:10px; color:var(--text-muted)">{{ item.quiz?.type || 'Quiz' }}</span>
              </div>

              <!-- Type Badge -->
              <div style="width:80px; text-align:center">
                @if (item.sub.type === 'audio') {
                  <span class="pill" style="background:#FEE2E2; color:#DC2626; font-size:9px">
                    <i class="ti ti-microphone" style="font-size:9px"></i> Vocal
                  </span>
                } @else {
                  <span class="pill" style="background:#EEF2FF; color:#4F46E5; font-size:9px">
                    <i class="ti ti-file-text" style="font-size:9px"></i> Texte
                  </span>
                }
              </div>

              <!-- Score -->
              <div style="width:90px; text-align:center">
                @if (item.sub.graded && item.sub.score) {
                  <span class="score-badge" [class]="getScoreClass(item.sub.score)">{{ item.sub.score }}</span>
                } @else {
                  <span style="font-size:11px; color:var(--text-muted)">—</span>
                }
              </div>

              <!-- Date -->
              <div style="width:120px; font-size:11px; color:var(--text-secondary)">
                {{ item.sub.submittedAt | date:'d MMM y, HH:mm' }}
              </div>

              <!-- Status -->
              <div style="width:90px; text-align:center">
                @if (item.sub.graded) {
                  <span class="pill g" style="font-size:9px">Corrigé</span>
                } @else {
                  <span class="pill y" style="font-size:9px">En attente</span>
                }
              </div>

              <!-- Actions -->
              <div style="width:80px; text-align:center" (click)="$event.stopPropagation()">
                <button class="btn-s" style="font-size:10px; padding:3px 8px; color:#4F46E5; border-color:#4F46E5" (click)="selectResult(item)">
                  Voir
                </button>
              </div>
            </div>
          }
        </div>

        <div style="font-size:11px; color:var(--text-muted); margin-top:8px; text-align:right">
          {{ filteredResults().length }} résultat(s)
        </div>
      } @else {
        <div style="text-align:center; padding:60px 20px; border:1px dashed var(--border); border-radius:12px; background:var(--surface-1)">
          <i class="ti ti-clipboard-data" style="font-size:48px; color:var(--text-muted); display:block; margin-bottom:12px"></i>
          <p style="font-size:14px; font-weight:600; color:var(--text-primary); margin-bottom:6px">Aucun résultat trouvé</p>
          <p style="font-size:12px; color:var(--text-muted)">Modifiez les filtres ou attendez les soumissions des élèves.</p>
        </div>
      }

      <!-- Detail Drawer -->
      @if (selectedResult(); as item) {
        <div class="detail-drawer" style="margin-top:20px">
          <div class="card" style="border:1px solid #C7D2FE; background:#FAFBFF">
            <!-- Header -->
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--border-weak)">
              <div>
                <h3 style="font-size:15px; font-weight:700; color:var(--text-primary); margin-bottom:4px">
                  {{ item.student?.name || item.sub.studentName }}
                </h3>
                <p style="font-size:11px; color:var(--text-muted)">
                  {{ item.sub.lessonTitle }} · Soumis le {{ item.sub.submittedAt | date:'medium' }}
                </p>
              </div>
              <button class="btn-s" style="padding:4px 8px; font-size:11px" (click)="selectedResult.set(null)">
                <i class="ti ti-x"></i>
              </button>
            </div>

            <!-- Stats Row -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(100px,1fr)); gap:10px; margin-bottom:16px">
              <div style="background:var(--surface-2); border-radius:8px; padding:10px; text-align:center">
                <div style="font-size:10px; font-weight:600; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px">Note</div>
                <div style="font-size:20px; font-weight:800; color:#4F46E5">{{ item.sub.score || '—' }}</div>
              </div>
              <div style="background:var(--surface-2); border-radius:8px; padding:10px; text-align:center">
                <div style="font-size:10px; font-weight:600; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px">XP</div>
                <div style="font-size:20px; font-weight:800; color:#D97706">{{ item.sub.xpReward || 0 }}</div>
              </div>
              <div style="background:var(--surface-2); border-radius:8px; padding:10px; text-align:center">
                <div style="font-size:10px; font-weight:600; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px">Type</div>
                <div style="font-size:14px; font-weight:700; color:var(--text-primary)">{{ item.sub.type | uppercase }}</div>
              </div>
              <div style="background:var(--surface-2); border-radius:8px; padding:10px; text-align:center">
                <div style="font-size:10px; font-weight:600; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px">Statut</div>
                <span class="pill" [class]="item.sub.graded ? 'g' : 'y'">{{ item.sub.graded ? 'Corrigé' : 'En attente' }}</span>
              </div>
            </div>

            <!-- Submission Content -->
            <div style="background:var(--surface-1); border:1px solid var(--border); border-radius:8px; padding:14px; margin-bottom:14px; border-left:3px solid #4F46E5">
              <div style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px">Réponse de l'élève</div>
              @if (item.sub.type === 'audio') {
                <audio [src]="item.sub.content" controls style="width:100%; border-radius:8px"></audio>
              } @else {
                <p style="font-size:13px; color:var(--text-primary); line-height:1.6; font-style:italic">
                  "{{ item.sub.content }}"
                </p>
              }
            </div>

            <!-- Teacher Feedback (if graded) -->
            @if (item.sub.graded && item.sub.feedback) {
              <div style="background:#F0FDF4; border:1px solid #A7F3D0; border-radius:8px; padding:14px; margin-bottom:14px">
                <div style="font-size:10px; font-weight:700; color:#047857; text-transform:uppercase; margin-bottom:8px">Feedback du professeur</div>
                <p style="font-size:12px; color:#065F46; line-height:1.6; white-space:pre-line">{{ item.sub.feedback }}</p>
              </div>
            }

            <!-- Export PDF button -->
            <div style="display:flex; gap:10px; justify-content:flex-end">
              <button class="btn-s" style="font-size:12px" (click)="exportToPdf(item)">
                <i class="ti ti-file-download"></i> Export PDF
              </button>
              @if (!item.sub.graded) {
                <button class="btn-p" style="font-size:12px" (click)="goToGrade(item)">
                  <i class="ti ti-pencil"></i> Aller corriger
                </button>
              } @else {
                <button class="btn-p" style="font-size:12px; background:#059669; border-color:#059669" (click)="goToGrade(item)">
                  <i class="ti ti-edit"></i> Modifier la note
                </button>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .results-table-wrapper {
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: var(--surface-1);
    }

    .results-header-row {
      display: flex;
      align-items: center;
      gap: 0;
      background: var(--surface-2);
      padding: 10px 14px;
      border-bottom: 1px solid var(--border-weak);
      position: sticky;
      top: 0;
    }

    .rh-cell {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 4px;
      user-select: none;
    }

    .result-row {
      display: flex;
      align-items: center;
      gap: 0;
      padding: 10px 14px;
      border-bottom: 1px solid var(--border-weak);
      cursor: pointer;
      transition: background 0.15s;
    }

    .result-row:hover { background: var(--surface-2); }
    .result-row.selected-row { background: #EEF2FF; }
    .result-row:last-child { border-bottom: none; }

    .mini-avatar {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: linear-gradient(135deg, #4F46E5, #7C3AED);
      color: white;
      font-size: 9px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .score-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
    }
    .score-badge.excellent { background: #D1FAE5; color: #047857; }
    .score-badge.good { background: #DBEAFE; color: #1D4ED8; }
    .score-badge.average { background: #FEF3C7; color: #92400E; }
    .score-badge.poor { background: #FEE2E2; color: #B91C1C; }

    .stat-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
    }

    .stat-num {
      font-size: 16px;
      font-weight: 800;
    }

    .detail-drawer {
      animation: slideIn 0.25s ease-out;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class TeacherResultsComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  submissions = signal<Submission[]>([]);
  users = signal<UserProfile[]>([]);
  quizzes = signal<Quiz[]>([]);

  searchQuery = '';
  filterType = 'all';
  filterStatus = 'all';
  sortField = signal<string>('date');
  sortAsc = signal<boolean>(false);

  selectedResult = signal<EnrichedResult | null>(null);

  constructor() {
    this.db.observeSubmissions().subscribe(list => this.submissions.set(list));
    this.db.observeUsers().subscribe(list => this.users.set(list));
    this.db.observeQuizzes().subscribe(list => this.quizzes.set(list));
  }

  allResults = computed<EnrichedResult[]>(() => {
    return this.submissions().map(sub => ({
      sub,
      student: this.users().find(u => u.id === sub.studentId),
      quiz: this.quizzes().find(q => q.title === sub.lessonTitle)
    }));
  });

  filteredResults = computed<EnrichedResult[]>(() => {
    let list = this.allResults();
    const q = this.searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(r =>
        (r.student?.name || r.sub.studentName).toLowerCase().includes(q) ||
        r.sub.lessonTitle.toLowerCase().includes(q)
      );
    }
    if (this.filterType !== 'all') {
      list = list.filter(r => r.sub.type === this.filterType);
    }
    if (this.filterStatus === 'graded') list = list.filter(r => r.sub.graded);
    if (this.filterStatus === 'pending') list = list.filter(r => !r.sub.graded);

    const field = this.sortField();
    const asc = this.sortAsc();
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (field === 'student') cmp = (a.student?.name || a.sub.studentName).localeCompare(b.student?.name || b.sub.studentName);
      else if (field === 'quiz') cmp = a.sub.lessonTitle.localeCompare(b.sub.lessonTitle);
      else if (field === 'date') cmp = new Date(a.sub.submittedAt).getTime() - new Date(b.sub.submittedAt).getTime();
      else if (field === 'score') cmp = (a.sub.score || '').localeCompare(b.sub.score || '');
      return asc ? cmp : -cmp;
    });
    return list;
  });

  totalSubmissions = computed(() => this.allResults().length);
  pendingCount = computed(() => this.allResults().filter(r => !r.sub.graded).length);
  gradedCount = computed(() => this.allResults().filter(r => r.sub.graded).length);
  avgScore = computed(() => {
    const graded = this.allResults().filter(r => r.sub.graded && r.sub.score);
    if (!graded.length) return '—';
    const scoreMap: Record<string, number> = { 'A — Excellent': 4, 'B — Good': 3, 'C — Satisfactory': 2, 'D — Needs improvement': 1 };
    const total = graded.reduce((sum, r) => sum + (scoreMap[r.sub.score!] || 0), 0);
    const avg = total / graded.length;
    if (avg >= 3.5) return 'A moy.';
    if (avg >= 2.5) return 'B moy.';
    if (avg >= 1.5) return 'C moy.';
    return 'D moy.';
  });

  sortBy(field: string) {
    if (this.sortField() === field) {
      this.sortAsc.update(v => !v);
    } else {
      this.sortField.set(field);
      this.sortAsc.set(false);
    }
  }

  getSortIcon(field: string): string {
    if (this.sortField() !== field) return 'ti-arrows-sort';
    return this.sortAsc() ? 'ti-sort-ascending' : 'ti-sort-descending';
  }

  selectResult(item: EnrichedResult) {
    this.selectedResult.set(item);
    setTimeout(() => {
      document.querySelector('.detail-drawer')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getScoreClass(score: string): string {
    if (score.startsWith('A')) return 'score-badge excellent';
    if (score.startsWith('B')) return 'score-badge good';
    if (score.startsWith('C')) return 'score-badge average';
    return 'score-badge poor';
  }

  exportToPdf(item: EnrichedResult) {
    const html = `
      <div style="font-family:Arial,sans-serif; padding:20px">
        <h2 style="color:#4F46E5">SpeakUp — Copie de l'élève</h2>
        <hr>
        <p><strong>Élève :</strong> ${item.student?.name || item.sub.studentName}</p>
        <p><strong>Exercice :</strong> ${item.sub.lessonTitle}</p>
        <p><strong>Date :</strong> ${new Date(item.sub.submittedAt).toLocaleString('fr-FR')}</p>
        <p><strong>Note :</strong> ${item.sub.score || 'Non corrigé'}</p>
        <p><strong>XP :</strong> ${item.sub.xpReward || 0}</p>
        <hr>
        <h3>Réponse de l'élève :</h3>
        <p style="font-style:italic; background:#F9FAFB; padding:12px; border-left:4px solid #4F46E5">${item.sub.type === 'audio' ? '[Réponse Audio]' : item.sub.content}</p>
        ${item.sub.feedback ? `<h3>Feedback :</h3><p>${item.sub.feedback}</p>` : ''}
      </div>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 500);
    }
  }

  goToGrade(item: EnrichedResult) {
    this.dialogService.alert('Navigation', 'Allez dans l\'onglet "Copies" pour corriger cette soumission.', 'info');
  }
}
