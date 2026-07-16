import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Submission, UserProfile, Quiz, VocabGameAttempt, ExamAttempt } from '../../services/database.service';
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
        <button class="subtab-btn" [class.active]="activeSubTab() === 'exams'" (click)="activeSubTab.set('exams')" style="background:none; border:none; padding:8px 16px; font-weight:700; font-size:13.5px; color:var(--text-secondary); cursor:pointer; position:relative; outline:none; display:flex; align-items:center; gap:6px">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
          <span>{{ t('Examens Officiels', 'Official Exams') }}</span>
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
      } @else if (activeSubTab() === 'vocab') {
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
      } @else if (activeSubTab() === 'exams') {
        <!-- Exams Attempts Management -->
        <div style="display:flex; flex-direction:column; gap:20px; animation: fadeIn 0.2s ease">
          <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center; justify-content:space-between; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--border-weak)">
            <div style="display:flex; align-items:center; gap:10px">
              <div style="position:relative">
                <i class="ti ti-search" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:14px"></i>
                <input type="text" [(ngModel)]="examSearchQuery" [placeholder]="t('Rechercher élève, examen...', 'Search student, exam...')" style="height:34px; padding:0 12px 0 32px; border:1px solid var(--border); border-radius:8px; font-size:12px; background:var(--surface-1); width:240px; color:var(--text-primary)">
              </div>
            </div>
            
            <div class="stat-badge" style="background:#EEF2FF; color:#4F46E5">
              <span class="stat-num">{{ filteredExamAttempts().length }}</span> {{ t('Tentative(s)', 'Attempt(s)') }}
            </div>
          </div>

          <!-- Exams attempts table -->
          <div style="display:grid; grid-template-columns: 1fr 340px; gap:20px; align-items:flex-start">
            <div class="results-table-wrapper">
              <div class="results-header-row">
                <div class="rh-cell" style="width:160px">{{ t('Élève', 'Student') }}</div>
                <div class="rh-cell" style="flex:1">{{ t('Examen', 'Exam') }}</div>
                <div class="rh-cell" style="width:90px; text-align:center">{{ t('Score', 'Score') }}</div>
                <div class="rh-cell" style="width:90px; text-align:center">{{ t('Note (%)', 'Grade (%)') }}</div>
                <div class="rh-cell" style="width:120px">{{ t('Date', 'Date') }}</div>
                <div class="rh-cell" style="width:90px; text-align:center">{{ t('Statut', 'Status') }}</div>
                <div class="rh-cell" style="width:80px; text-align:center">Actions</div>
              </div>

              @if (filteredExamAttempts().length === 0) {
                <div style="padding:40px; text-align:center; color:var(--text-muted)">{{ t('Aucun résultat trouvé.', 'No results found.') }}</div>
              } @else {
                @for (att of filteredExamAttempts(); track att.id) {
                  <div class="result-row" [class.selected-row]="selectedExamAttempt()?.id === att.id" (click)="selectedExamAttempt.set(att)">
                    <div style="width:160px; display:flex; align-items:center; gap:8px">
                      <div class="mini-avatar">{{ getInitials(att.studentName) }}</div>
                      <span style="font-weight:700; color:var(--text-primary); font-size:12.5px">{{ att.studentName }}</span>
                    </div>
                    <div style="flex:1; font-weight:600; color:var(--text-secondary); font-size:12.5px">{{ att.quizTitle }}</div>
                    <div style="width:90px; text-align:center; font-weight:700; color:var(--text-primary); font-size:12.5px">{{ att.score }} / {{ att.answers.length }}</div>
                    <div style="width:90px; text-align:center; font-weight:700; color:#4F46E5; font-size:12.5px">{{ att.percentage }}%</div>
                    <div style="width:120px; font-size:11.5px; color:var(--text-muted)">{{ att.completedAt | date:'dd/MM/yyyy HH:mm' }}</div>
                    <div style="width:90px; text-align:center">
                      <span style="font-size:10px; font-weight:700; padding:2px 8px; border-radius:12px"
                            [style.background]="att.passed ? '#D1FAE5' : '#FEE2E2'"
                            [style.color]="att.passed ? '#065F46' : '#991B1B'">
                        {{ att.passed ? t('RÉUSSI', 'PASSED') : t('ÉCHOUÉ', 'FAILED') }}
                      </span>
                    </div>
                    <div style="width:80px; text-align:center">
                      <button class="btn-icon" (click)="selectedExamAttempt.set(att); $event.stopPropagation()" [title]="t('Détails', 'Details')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </div>
                  </div>
                }
              }
            </div>

            <!-- Detailed Exam Sheet View -->
            <div class="card detail-drawer" style="margin:0; padding:20px; position:sticky; top:20px">
              @if (selectedExamAttempt(); as att) {
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1.5px solid var(--border-weak); padding-bottom:12px">
                  <h3 style="font-size:15px; font-weight:800; color:var(--text-primary); margin:0">{{ t("Copie d'Examen", 'Exam Sheet') }}</h3>
                  <button (click)="selectedExamAttempt.set(null)" style="background:none; border:none; font-size:18px; cursor:pointer; color:var(--text-muted)">×</button>
                </div>

                <div style="font-size:12.5px; display:flex; flex-direction:column; gap:6px; margin-bottom:16px">
                  <div><strong>{{ t('Élève :', 'Student:') }}</strong> {{ att.studentName }}</div>
                  <div><strong>{{ t('Examen :', 'Exam:') }}</strong> {{ att.quizTitle }}</div>
                  <div><strong>{{ t('Score :', 'Score:') }}</strong> {{ att.score }} / {{ att.answers.length }} ({{ att.percentage }}%)</div>
                  <div><strong>{{ t('Temps passé :', 'Time Taken:') }}</strong> {{ formatTime(att.timeTakenSeconds) }}</div>
                  <div><strong>{{ t('Statut :', 'Status:') }}</strong> 
                    <span style="font-weight:700" [style.color]="att.passed ? '#059669' : '#DC2626'">
                      {{ att.passed ? t('✓ Réussi', '✓ Passed') : t('✗ Échoué', '✗ Failed') }}
                    </span>
                  </div>
                </div>

                <div style="max-height:360px; overflow-y:auto; display:flex; flex-direction:column; gap:12px; padding-right:4px">
                  <h4 style="font-size:12px; font-weight:800; color:var(--text-secondary); margin:0 0 4px">{{ t('Réponses aux questions :', 'Answers Details:') }}</h4>
                  
                  @for (ans of att.answers; track ans.questionIdx; let i = $index) {
                    <div style="padding:10px; border-radius:8px; border:1px solid; font-size:12px"
                         [style.border-color]="ans.correct ? '#A7F3D0' : '#FCA5A5'"
                         [style.background]="ans.correct ? '#F0FDF4' : '#FEF2F2'">
                      <div style="font-weight:700; color:var(--text-primary); margin-bottom:4px">Q{{ i + 1 }}. {{ t('Question', 'Question') }} #{{ ans.questionIdx + 1 }}</div>
                      <div>
                        {{ t('Réponse donnée :', 'Answer given:') }} <strong [style.color]="ans.correct ? '#065F46' : '#991B1B'">{{ ans.answer || t('[Pas de réponse]', '[No answer]') }}</strong>
                      </div>
                      @if (!ans.correct) {
                        <div style="color:var(--text-muted); font-size:11px; margin-top:2px">
                          {{ t('Correct :', 'Correct option:') }} {{ getCorrectOptionText(att.quizId, ans.questionIdx) }}
                        </div>
                      }
                    </div>
                  }
                </div>
              } @else {
                <div style="text-align:center; padding:60px 20px; color:var(--text-muted)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:10px; color:var(--text-muted)"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  <p style="font-size:12.5px; margin:0">{{ t("Sélectionnez une copie d'examen pour voir le détail des réponses.", 'Select an exam sheet to see answers details.') }}</p>
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
  examAttempts = signal<ExamAttempt[]>([]);

  activeSubTab = signal<'quizzes' | 'vocab' | 'exams'>('quizzes');

  examSearchQuery = '';
  selectedExamAttempt = signal<ExamAttempt | null>(null);

  filteredExamAttempts = computed(() => {
    let list = this.examAttempts();
    const q = this.examSearchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(a =>
        a.studentName.toLowerCase().includes(q) ||
        a.quizTitle.toLowerCase().includes(q)
      );
    }
    return list;
  });

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
    this.db.observeExamAttempts().subscribe(list => this.examAttempts.set(list));
  }

  allResults = computed<EnrichedResult[]>(() => {
    return this.submissions().map(sub => ({
      sub,
      student: this.users().find(u => u.id === sub.studentId),
      quiz: this.quizzes().find(q => q.id === sub.lessonId || sub.lessonTitle.includes(q.title))
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
      else if (field === 'score') {
        const scoreMap: Record<string, number> = {
          'A — Excellent': 4,
          'B — Good': 3,
          'C — Satisfactory': 2,
          'D — Needs improvement': 1,
          'A refaire': 0
        };
        const sA = scoreMap[a.sub.score || ''] ?? -1;
        const sB = scoreMap[b.sub.score || ''] ?? -1;
        cmp = sA - sB;
      }
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
    if (score === 'A refaire') return 'score-badge poor';
    if (score.startsWith('A')) return 'score-badge excellent';
    if (score.startsWith('B')) return 'score-badge good';
    if (score.startsWith('C')) return 'score-badge average';
    return 'score-badge poor';
  }

  getCorrectOptionText(quizId: string, questionIdx: number): string {
    const quiz = this.quizzes().find(q => q.id === quizId);
    if (!quiz) return '';
    const q = quiz.questions[questionIdx];
    if (!q) return '';
    return q.correctOption || '';
  }

  getDiffLabel(difficulty: string): string {
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
    this.dialogService.alert(
      this.t('Navigation', 'Navigation'), 
      this.t("Allez dans l'onglet \"Copies\" pour corriger cette soumission.", "Go to the 'Grading' tab to grade this submission."), 
      'info'
    );
  }

  deleteResult(item: EnrichedResult) {
    const confirmMsg = this.t(
      `Êtes-vous sûr de vouloir supprimer ce résultat pour "${item.student?.name || item.sub.studentName}" ?\n\nCette action est irréversible.`,
      `Are you sure you want to delete this result for "${item.student?.name || item.sub.studentName}"?\n\nThis action is irreversible.`
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

  formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}min ${s}s` : `${s}s`;
  }
}
