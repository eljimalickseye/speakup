import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Submission, UserProfile, Quiz, VocabGameAttempt } from '../../services/database.service';
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
      <!-- Sub Tab Bar -->
      <div style="display:flex; gap:16px; margin-bottom:20px; border-bottom:2px solid var(--border-weak); padding-bottom:6px">
        <button class="subtab-btn" [class.active]="activeSubTab() === 'quizzes'" (click)="activeSubTab.set('quizzes')" style="background:none; border:none; padding:8px 16px; font-weight:700; font-size:13.5px; color:var(--text-secondary); cursor:pointer; position:relative; outline:none">
          📝 Devoirs & Quiz
        </button>
        <button class="subtab-btn" [class.active]="activeSubTab() === 'vocab'" (click)="activeSubTab.set('vocab')" style="background:none; border:none; padding:8px 16px; font-weight:700; font-size:13.5px; color:var(--text-secondary); cursor:pointer; position:relative; outline:none">
          🎮 Vocabulaire & Jeux
        </button>
      </div>

      @if (activeSubTab() === 'quizzes') {
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
              <div class="rh-cell" style="width:80px; text-align:center" (click)="sortBy('type')">
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

                <!-- Type -->
                <div style="width:80px; text-align:center">
                  @if (item.sub.type === 'audio') {
                    <span style="font-size:10px; background:#E6F4EA; color:#137333; padding:2px 6px; border-radius:4px; font-weight:700">🎤 VOCAL</span>
                  } @else {
                    <span style="font-size:10px; background:#E8F0FE; color:#1A73E8; padding:2px 6px; border-radius:4px; font-weight:700">✍️ ÉCRIT</span>
                  }
                </div>

                <!-- Score / Grade -->
                <div style="width:90px; text-align:center">
                  @if (item.sub.graded) {
                    <span [class]="getScoreClass(item.sub.score || '')">{{ item.sub.score }}</span>
                  } @else {
                    <span style="font-size:11px; color:var(--text-muted)">Non corrigé</span>
                  }
                </div>

                <!-- Date -->
                <div style="width:120px; font-size:11.5px; color:var(--text-secondary)">
                  {{ item.sub.submittedAt | date:'dd/MM/yyyy HH:mm' }}
                </div>

                <!-- Status -->
                <div style="width:90px; text-align:center">
                  @if (item.sub.graded) {
                    <span style="font-size:10px; background:#D1FAE5; color:#065F46; padding:4px 8px; border-radius:12px; font-weight:700">Corrigé</span>
                  } @else {
                    <span style="font-size:10px; background:#FEF3C7; color:#92400E; padding:4px 8px; border-radius:12px; font-weight:700">En attente</span>
                  }
                </div>

                <!-- Actions -->
                <div style="width:80px; text-align:center; display:flex; gap:6px; justify-content:center" (click)="$event.stopPropagation()">
                  <button class="btn-icon" (click)="exportToPdf(item)" title="Exporter en PDF">📋</button>
                  <button class="btn-icon" (click)="deleteResult(item)" title="Supprimer" style="color:#EF4444">❌</button>
                </div>
              </div>
            }
          </div>
        } @else {
          <div style="text-align:center; padding:48px; color:var(--text-muted); font-size:13px">
            Aucun résultat ne correspond aux filtres actuels.
          </div>
        }
      } @else {
        <!-- VOCABULARY DASHBOARD -->
        <div style="animation: fadeIn 0.2s">
          <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px; flex-wrap:wrap">
            
            <!-- Left: Vocabulary game attempts list -->
            <div class="card">
              <h3 style="font-size:14px; font-weight:800; color:#7C3AED; margin-bottom:12px">Historique des parties de vocabulaire</h3>
              <p style="font-size:11.5px; color:var(--text-secondary); margin-bottom:16px">Retrouvez les scores et le temps passé par chaque élève sur les jeux de vocabulaire.</p>
              
              @if (vocabAttempts().length === 0) {
                <div style="text-align:center; padding:32px; color:var(--text-muted); font-size:12.5px">Aucune partie enregistrée pour le moment.</div>
              } @else {
                <div style="display:flex; flex-direction:column; gap:8px">
                  @for (attempt of vocabAttempts(); track attempt.id) {
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--surface-2); border:1px solid var(--border-weak); border-radius:8px">
                      <div>
                        <div style="font-size:13px; font-weight:700; color:var(--text-primary)">{{ attempt.studentName }}</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-top:2px">
                          Jeu: <strong>{{ attempt.gameTitle }}</strong> · Difficulté: {{ getDiffLabel(attempt.difficulty) }} · Catégorie: {{ attempt.category || 'Général' }}
                        </div>
                      </div>
                      
                      <div style="text-align:right">
                        <div style="font-size:13px; font-weight:800; color:#059669">{{ attempt.score }} / {{ attempt.totalWords }} correct</div>
                        <div style="font-size:10px; color:var(--text-muted); margin-top:2px">⏱️ {{ attempt.timeTakenSeconds }}s · {{ attempt.completedAt | date:'dd/MM/yyyy HH:mm' }}</div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Right: Hardest words statistics -->
            <div class="card">
              <h3 style="font-size:14px; font-weight:800; color:#EF4444; margin-bottom:12px">⚠️ Mots les plus difficiles</h3>
              <p style="font-size:11.5px; color:var(--text-secondary); margin-bottom:16px">Les termes ayant généré le plus d'erreurs lors des sessions de jeu.</p>
              
              @if (hardestWords().length === 0) {
                <div style="text-align:center; padding:32px; color:var(--text-muted); font-size:12.5px">Aucune erreur enregistrée pour le moment.</div>
              } @else {
                <div style="display:flex; flex-direction:column; gap:12px">
                  @for (item of hardestWords(); track item.word) {
                    <div style="display:flex; flex-direction:column; gap:4px">
                      <div style="display:flex; justify-content:space-between; align-items:center; font-size:12.5px">
                        <span style="font-weight:700; color:var(--text-primary)">{{ item.word }}</span>
                        <span style="background:#FEE2E2; color:#EF4444; font-size:10.5px; font-weight:800; padding:2px 6px; border-radius:10px">{{ item.count }} erreur(s)</span>
                      </div>
                      <div style="font-size:10.5px; color:var(--text-muted)">Catégorie: {{ item.category || 'Général' }}</div>
                      <div style="width:100%; height:6px; background:var(--border-weak); border-radius:3px; overflow:hidden">
                        <div [style.width.%]="(item.count / hardestWords()[0].count) * 100" style="height:100%; background:#EF4444; border-radius:3px"></div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .stat-badge {
      display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 20px; font-size: 11.5px; font-weight: 700;
    }
    .stat-num { font-size: 13.5px; font-weight: 800; }
    .results-table-wrapper {
      background: var(--surface-1); border: 1px solid var(--border-weak); border-radius: 12px; overflow: hidden;
    }
    .results-header-row {
      display: flex; background: var(--surface-2); padding: 12px 16px; border-bottom: 1.5px solid var(--border);
    }
    .rh-cell { font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
    .result-row {
      display: flex; align-items: center; padding: 12px 16px; border-bottom: 1px solid var(--border-weak); cursor: pointer; transition: background 0.15s ease;
    }
    .result-row:hover { background: var(--surface-2); }
    .selected-row { background: #FAF5FF !important; border-left: 3px solid #7C3AED; }
    .mini-avatar {
      width: 28px; height: 28px; border-radius: 50%; background: #EEF2FF; color: #4F46E5;
      font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .score-badge {
      font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 20px; display: inline-block;
    }
    .score-badge.excellent { background: #D1FAE5; color: #065F46; }
    .score-badge.good { background: #DBEAFE; color: #1E40AF; }
    .score-badge.average { background: #FEF3C7; color: #92400E; }
    .score-badge.poor { background: #FEE2E2; color: #991B1B; }
    .btn-icon {
      background: none; border: none; font-size: 13px; cursor: pointer; padding: 4px; border-radius: 4px;
      transition: background 0.15s;
    }
    .btn-icon:hover { background: var(--surface-3); }
    .subtab-btn.active {
      color: #7C3AED !important;
      border-bottom: 2px solid #7C3AED !important;
    }
  `]
})
export class TeacherResultsComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  submissions = signal<Submission[]>([]);
  users = signal<UserProfile[]>([]);
  quizzes = signal<Quiz[]>([]);
  vocabAttempts = signal<VocabGameAttempt[]>([]);

  activeSubTab = signal<'quizzes' | 'vocab'>('quizzes');

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
    this.db.observeVocabGameAttempts().subscribe(list => this.vocabAttempts.set(list));
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

  hardestWords = computed(() => {
    const wordCounts: Record<string, { word: string; count: number; category?: string }> = {};
    this.vocabAttempts().forEach(attempt => {
      if (attempt.missedWords) {
        attempt.missedWords.forEach(w => {
          if (!wordCounts[w]) {
            wordCounts[w] = { word: w, count: 0, category: attempt.category };
          }
          wordCounts[w].count++;
        });
      }
    });
    return Object.values(wordCounts).sort((a, b) => b.count - a.count).slice(0, 10);
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

  getDiffLabel(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return '🟢 Facile';
      case 'medium': return '🟡 Moyen';
      case 'hard': return '🔴 Difficile';
      default: return difficulty;
    }
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

  deleteResult(item: EnrichedResult) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce résultat pour "${item.student?.name || item.sub.studentName}" ?\n\nCette action est irréversible.`)) {
      return;
    }

    this.db.deleteSubmission(item.sub.id);
    this.selectedResult.set(null);
    this.dialogService.alert('Supprimé', 'Le résultat a été supprimé avec succès.', 'success');
  }
}
