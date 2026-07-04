file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\teacher\results.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the component decorator and template
new_results_code = """import { Component, inject, signal, computed } from '@angular/core';
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
        <button class="subtab-btn" [class.active]="activeSubTab() === 'quizzes'" (click)="activeSubTab.set('quizzes')" style="background:none; border:none; padding:8px 16px; font-weight:700; font-size:13.5px; color:var(--text-secondary); cursor:pointer; position:relative; outline:none; display:flex; align-items:center; gap:6px">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <span>{{ t('Devoirs & Quiz', 'Homework & Quizzes') }}</span>
        </button>
        <button class="subtab-btn" [class.active]="activeSubTab() === 'vocab'" (click)="activeSubTab.set('vocab')" style="background:none; border:none; padding:8px 16px; font-weight:700; font-size:13.5px; color:var(--text-secondary); cursor:pointer; position:relative; outline:none; display:flex; align-items:center; gap:6px">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4"/><path d="M8 10v4"/><line x1="15" y1="11" x2="15" y2="11"/><line x1="18" y1="13" x2="18" y2="13"/></svg>
          <span>{{ t('Vocabulaire & Jeux', 'Vocabulary & Games') }}</span>
        </button>
      </div>

      @if (activeSubTab() === 'quizzes') {
        <!-- Header / Filters Bar -->
        <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--border-weak)">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap">
            <!-- Search -->
            <div style="position:relative">
              <i class="ti ti-search" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:14px"></i>
              <input type="text" [(ngModel)]="searchQuery" [placeholder]="t('Rechercher élève, quiz...', 'Search student, quiz...')" style="height:34px; padding:0 12px 0 32px; border:1px solid var(--border); border-radius:8px; font-size:12px; background:var(--surface-1); width:220px; color:var(--text-primary)">
            </div>

            <!-- Filter by type -->
            <select [(ngModel)]="filterType" style="height:34px; padding:0 10px; border:1px solid var(--border); border-radius:8px; font-size:12px; background:var(--surface-1); color:var(--text-primary)">
              <option value="all">{{ t('Tous les types', 'All types') }}</option>
              <option value="text">{{ t('Texte', 'Text') }}</option>
              <option value="audio">{{ t('Vocal', 'Audio') }}</option>
            </select>

            <!-- Filter by status -->
            <select [(ngModel)]="filterStatus" style="height:34px; padding:0 10px; border:1px solid var(--border); border-radius:8px; font-size:12px; background:var(--surface-1); color:var(--text-primary)">
              <option value="all">{{ t('Tous statuts', 'All statuses') }}</option>
              <option value="graded">{{ t('Corrigés', 'Graded') }}</option>
              <option value="pending">{{ t('En attente', 'Pending') }}</option>
            </select>
          </div>

          <!-- Stats quick summary -->
          <div style="display:flex; gap:12px; flex-wrap:wrap">
            <div class="stat-badge" style="background:#EEF2FF; color:#4F46E5">
              <span class="stat-num">{{ totalSubmissions() }}</span> Total
            </div>
            <div class="stat-badge" style="background:#FEF3C7; color:#92400E">
              <span class="stat-num">{{ pendingCount() }}</span> {{ t('En attente', 'Pending') }}
            </div>
            <div class="stat-badge" style="background:#D1FAE5; color:#047857">
              <span class="stat-num">{{ gradedCount() }}</span> {{ t('Corrigés', 'Graded') }}
            </div>
            <div class="stat-badge" style="background:#F3E8FF; color:#6D28D9">
              <span class="stat-num">{{ avgScore() }}</span> {{ t('Score moy.', 'Avg Score') }}
            </div>
          </div>
        </div>

        <!-- Results Table -->
        @if (filteredResults().length > 0) {
          <div class="results-table-wrapper">
            <!-- Table Header -->
            <div class="results-header-row">
              <div class="rh-cell" style="width:160px; cursor:pointer" (click)="sortBy('student')">
                {{ t('Élève', 'Student') }} <i class="ti" [class]="getSortIcon('student')"></i>
              </div>
              <div class="rh-cell" style="flex:1; cursor:pointer" (click)="sortBy('quiz')">
                {{ t('Quiz / Exercice', 'Quiz / Exercise') }} <i class="ti" [class]="getSortIcon('quiz')"></i>
              </div>
              <div class="rh-cell" style="width:80px; text-align:center" (click)="sortBy('type')">
                {{ t('Type', 'Type') }}
              </div>
              <div class="rh-cell" style="width:90px; text-align:center; cursor:pointer" (click)="sortBy('score')">
                {{ t('Note', 'Grade') }} <i class="ti" [class]="getSortIcon('score')"></i>
              </div>
              <div class="rh-cell" style="width:120px; cursor:pointer" (click)="sortBy('date')">
                {{ t('Date', 'Date') }} <i class="ti" [class]="getSortIcon('date')"></i>
              </div>
              <div class="rh-cell" style="width:90px; text-align:center">
                {{ t('Statut', 'Status') }}
              </div>
              <div class="rh-cell" style="width:80px; text-align:center">
                {{ t('Actions', 'Actions') }}
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
                    <span style="font-size:10px; background:#E6F4EA; color:#137333; padding:2px 6px; border-radius:4px; font-weight:700">{{ t('🎤 VOCAL', '🎤 AUDIO') }}</span>
                  } @else {
                    <span style="font-size:10px; background:#E8F0FE; color:#1A73E8; padding:2px 6px; border-radius:4px; font-weight:700">{{ t('✍️ ÉCRIT', '✍️ WRITTEN') }}</span>
                  }
                </div>

                <!-- Score / Grade -->
                <div style="width:90px; text-align:center">
                  @if (item.sub.graded) {
                    <span [class]="getScoreClass(item.sub.score || '')">{{ item.sub.score }}</span>
                  } @else {
                    <span style="font-size:11px; color:var(--text-muted)">{{ t('Non corrigé', 'Not graded') }}</span>
                  }
                </div>

                <!-- Date -->
                <div style="width:120px; font-size:11.5px; color:var(--text-secondary)">
                  {{ item.sub.submittedAt | date:'dd/MM/yyyy HH:mm' }}
                </div>

                <!-- Status -->
                <div style="width:90px; text-align:center">
                  @if (item.sub.graded) {
                    <span style="font-size:10px; background:#D1FAE5; color:#065F46; padding:4px 8px; border-radius:12px; font-weight:700">{{ t('Corrigé', 'Graded') }}</span>
                  } @else {
                    <span style="font-size:10px; background:#FEF3C7; color:#92400E; padding:4px 8px; border-radius:12px; font-weight:700">{{ t('En attente', 'Pending') }}</span>
                  }
                </div>

                <!-- Actions -->
                <div style="width:80px; text-align:center; display:flex; gap:8px; justify-content:center" (click)="$event.stopPropagation()">
                  <button class="btn-icon" (click)="exportToPdf(item)" [title]="t('Exporter en PDF', 'Export to PDF')" style="display:inline-flex; align-items:center; justify-content:center; color:#4F46E5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </button>
                  <button class="btn-icon" (click)="deleteResult(item)" [title]="t('Supprimer', 'Delete')" style="display:inline-flex; align-items:center; justify-content:center; color:#EF4444">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              </div>
            }
          </div>
        } @else {
          <div style="text-align:center; padding:48px; color:var(--text-muted); font-size:13px">
            {{ t('Aucun résultat ne correspond aux filtres actuels.', 'No results match the current filters.') }}
          </div>
        }
      } @else {
        <!-- VOCABULARY DASHBOARD -->
        <div style="animation: fadeIn 0.2s">
          <div style="display:grid; grid-template-columns: 2fr 1fr; gap:20px; flex-wrap:wrap">
            
            <!-- Left: Vocabulary game attempts list -->
            <div class="card">
              <h3 style="font-size:14px; font-weight:800; color:#7C3AED; margin-bottom:12px">{{ t('Historique des parties de vocabulaire', 'Vocabulary Games History') }}</h3>
              <p style="font-size:11.5px; color:var(--text-secondary); margin-bottom:16px">{{ t('Retrouvez les scores et le temps passé par chaque élève sur les jeux de vocabulaire.', 'Track scores and time spent by each student on vocabulary games.') }}</p>
              
              @if (vocabAttempts().length === 0) {
                <div style="text-align:center; padding:32px; color:var(--text-muted); font-size:12.5px">{{ t('Aucune partie enregistrée pour le moment.', 'No games recorded yet.') }}</div>
              } @else {
                <div style="display:flex; flex-direction:column; gap:8px">
                  @for (attempt of vocabAttempts(); track attempt.id) {
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--surface-2); border:1px solid var(--border-weak); border-radius:8px">
                      <div>
                        <div style="font-size:13px; font-weight:700; color:var(--text-primary)">{{ attempt.studentName }}</div>
                        <div style="font-size:11px; color:var(--text-muted); margin-top:2px">
                          {{ t('Jeu:', 'Game:') }} <strong>{{ attempt.gameTitle }}</strong> · {{ t('Difficulté:', 'Difficulty:') }} {{ getDiffLabel(attempt.difficulty) }} · {{ t('Catégorie:', 'Category:') }} {{ attempt.category || t('Général', 'General') }}
                        </div>
                      </div>
                      
                      <div style="text-align:right">
                        <div style="font-size:13px; font-weight:800; color:#059669">{{ attempt.score }} / {{ attempt.totalWords }} {{ t('correct', 'correct') }}</div>
                        <div style="font-size:10px; color:var(--text-muted); margin-top:2px">⏱️ {{ attempt.timeTakenSeconds }}s · {{ attempt.completedAt | date:'dd/MM/yyyy HH:mm' }}</div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Right: Hardest words statistics -->
            <div class="card">
              <h3 style="font-size:14px; font-weight:800; color:#EF4444; margin-bottom:12px; display:flex; align-items:center; gap:6px">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>{{ t('Mots les plus difficiles', 'Hardest Words') }}</span>
              </h3>
              <p style="font-size:11.5px; color:var(--text-secondary); margin-bottom:16px">{{ t("Les termes ayant généré le plus d'erreurs lors des sessions de jeu.", "The terms that generated the most errors during game sessions.") }}</p>
              
              @if (hardestWords().length === 0) {
                <div style="text-align:center; padding:32px; color:var(--text-muted); font-size:12.5px">{{ t('Aucune erreur enregistrée pour le moment.', 'No errors recorded yet.') }}</div>
              } @else {
                <div style="display:flex; flex-direction:column; gap:12px">
                  @for (item of hardestWords(); track item.word) {
                    <div style="display:flex; flex-direction:column; gap:4px">
                      <div style="display:flex; justify-content:space-between; align-items:center; font-size:12.5px">
                        <span style="font-weight:700; color:var(--text-primary)">{{ item.word }}</span>
                        <span style="background:#FEE2E2; color:#EF4444; font-size:10.5px; font-weight:800; padding:2px 6px; border-radius:10px">{{ item.count }} {{ t('erreur(s)', 'error(s)') }}</span>
                      </div>
                      <div style="font-size:10.5px; color:var(--text-muted)">{{ t('Catégorie:', 'Category:') }} {{ item.category || t('Général', 'General') }}</div>
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
      background: none; border: none; font-size: 13px; cursor: pointer; padding: 6px; border-radius: 4px;
      display: inline-flex; align-items: center; justify-content: center;
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

  activeLang = this.db.activeLang;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

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
"""

# Let's find where export class TeacherResultsComponent starts in content
# We will replace from the beginning to the start of constructor
start_idx = content.find("export class TeacherResultsComponent {")
# Let's replace the whole top block up to constructor
# The constructor starts with '  constructor() {'
constructor_idx = content.find("  constructor() {", start_idx)

if start_idx != -1 and constructor_idx != -1:
    content = new_results_code + content[constructor_idx:]
    print("Top results.ts template and class header updated!")
else:
    print("Error: Could not locate class or constructor in results.ts!")

# 2. Update TS methods at the bottom of results.ts
# Let's update getDiffLabel, exportToPdf, goToGrade, deleteResult
bottom_search_str = "  getDiffLabel(difficulty: string): string {"
bottom_idx = content.find(bottom_search_str)

if bottom_idx != -1:
    new_bottom_code = """  getDiffLabel(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return '🟢 ' + this.t('Facile', 'Easy');
      case 'medium': return '🟡 ' + this.t('Moyen', 'Medium');
      case 'hard': return '🔴 ' + this.t('Difficile', 'Hard');
      default: return difficulty;
    }
  }

  exportToPdf(item: EnrichedResult) {
    const html = `
      <div style="font-family:Arial,sans-serif; padding:20px">
        <h2 style="color:#4F46E5">${this.t("SpeakUp — Copie de l'élève", "SpeakUp — Student Submission")}</h2>
        <hr>
        <p><strong>${this.t("Élève :", "Student:")}</strong> ${item.student?.name || item.sub.studentName}</p>
        <p><strong>${this.t("Exercice :", "Exercise:")}</strong> ${item.sub.lessonTitle}</p>
        <p><strong>${this.t("Date :", "Date:")}</strong> ${new Date(item.sub.submittedAt).toLocaleString(this.activeLang() === 'fr' ? 'fr-FR' : 'en-US')}</p>
        <p><strong>${this.t("Note :", "Grade:")}</strong> ${item.sub.score || this.t('Non corrigé', 'Not graded')}</p>
        <p><strong>${this.t("XP :", "XP:")}</strong> ${item.sub.xpReward || 0}</p>
        <hr>
        <h3>${this.t("Réponse de l'élève :", "Student Answer:")}</h3>
        <p style="font-style:italic; background:#F9FAFB; padding:12px; border-left:4px solid #4F46E5">${item.sub.type === 'audio' ? (this.t('[Réponse Audio]', '[Audio Response]')) : item.sub.content}</p>
        \${item.sub.feedback ? `<h3>Feedback :</h3><p>\${item.sub.feedback}</p>` : ''}
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
    this.dialogService.alert(
      this.t('Navigation', 'Navigation'), 
      this.t("Allez dans l'onglet \\"Copies\\" pour corriger cette soumission.", "Go to the 'Grading' tab to grade this submission."), 
      'info'
    );
  }

  deleteResult(item: EnrichedResult) {
    const confirmMsg = this.t(
      `Êtes-vous sûr de vouloir supprimer ce résultat pour "${item.student?.name || item.sub.studentName}" ?\\n\\nCette action est irréversible.`,
      `Are you sure you want to delete this result for "${item.student?.name || item.sub.studentName}"?\\n\\nThis action is irreversible.`
    );
    if (!confirm(confirmMsg)) {
      return;
    }

    this.db.deleteSubmission(item.sub.id);
    this.selectedResult.set(null);
    this.dialogService.alert(
      this.t('Supprimé', 'Deleted'), 
      this.t('Le résultat a été supprimé avec succès.', 'The result has been successfully deleted.'), 
      'success'
    );
  }
}
"""
    content = content[:bottom_idx] + new_bottom_code
    print("Bottom results.ts methods updated successfully!")
else:
    print("Error: Could not locate bottom methods in results.ts!")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("results.ts fully translated and SVGs added!")
