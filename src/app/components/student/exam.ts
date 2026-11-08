import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DatabaseService, Quiz, UserProfile, ExamAttempt, AssessmentSubmission, AssessmentQuestionAnswer, Lesson, AssessmentSessionConfig, AntiCheatReport } from '../../services/database.service';
import { AssessmentGeneratorService, GeneratedAssessmentMetadata } from '../../services/assessment-generator.service';
import { DialogService } from '../../services/dialog.service';

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

@Component({
  selector: 'app-student-exam',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="padding-top: 10px;">

      <!-- ======================================================== -->
      <!-- 1. SPEAKUP ASSESSMENT HUB                                -->
      <!-- ======================================================== -->
      @if (view() === 'hub') {
        <div style="animation: fadeIn 0.25s ease;">
          
        <!-- TEACHER & ADMIN CORRECTION DESK -->
        @if (currentUser()?.role === 'teacher' || currentUser()?.role === 'admin') {
          <div style="animation: fadeIn 0.25s ease;">
            
            <!-- Top Teacher Navigation Bar -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:14px; background:var(--surface-1); padding:16px 20px; border-radius:14px; border:1px solid var(--border);">
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:42px; height:42px; border-radius:10px; background:linear-gradient(135deg, #4F46E5, #7C3AED); display:flex; align-items:center; justify-content:center; color:white;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
                <div>
                  <div style="font-family:'Outfit', sans-serif; font-size:18px; font-weight:800; color:var(--text-primary); line-height:1.2;">
                    Centre de Correction SpeakUp English Assessment
                  </div>
                  <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;">
                    Dossiers des élèves, écoute des réponses orales, notation & délivrance des certificats
                  </div>
                </div>
              </div>

              <!-- Switcher Tabs (Dossiers vs Preview) -->
              <div style="display:flex; background:rgba(0,0,0,0.05); padding:3px; border-radius:10px; gap:4px;">
                <button
                  type="button"
                  (click)="teacherModeTab.set('folders'); closeSubmissionFolder();"
                  [style.background]="teacherModeTab() === 'folders' ? 'white' : 'transparent'"
                  [style.color]="teacherModeTab() === 'folders' ? '#4F46E5' : 'var(--text-secondary)'"
                  [style.box-shadow]="teacherModeTab() === 'folders' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'"
                  style="border:none; padding:8px 16px; border-radius:8px; font-weight:700; font-size:12.5px; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.15s ease;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>Dossiers Élèves</span>
                  @if (pendingSubmissionsCount() > 0) {
                    <span style="background:#EF4444; color:white; font-size:10px; font-weight:800; padding:1px 6px; border-radius:10px;">{{ pendingSubmissionsCount() }}</span>
                  }
                </button>

                <button
                  type="button"
                  (click)="openGeneratorTab()"
                  [style.background]="teacherModeTab() === 'generator' ? 'white' : 'transparent'"
                  [style.color]="teacherModeTab() === 'generator' ? '#4F46E5' : 'var(--text-secondary)'"
                  [style.box-shadow]="teacherModeTab() === 'generator' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'"
                  style="border:none; padding:8px 16px; border-radius:8px; font-weight:700; font-size:12.5px; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.15s ease;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  <span>Générateur depuis les Leçons (A2–B2)</span>
                  @if (officialAssessmentQuestions().length > 0) {
                    <span style="background:#10B981; color:white; font-size:9.5px; font-weight:800; padding:1px 5px; border-radius:10px;">Actif</span>
                  }
                </button>

                <button
                  type="button"
                  (click)="teacherModeTab.set('preview'); closeSubmissionFolder();"
                  [style.background]="teacherModeTab() === 'preview' ? 'white' : 'transparent'"
                  [style.color]="teacherModeTab() === 'preview' ? '#4F46E5' : 'var(--text-secondary)'"
                  [style.box-shadow]="teacherModeTab() === 'preview' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none'"
                  style="border:none; padding:8px 16px; border-radius:8px; font-weight:700; font-size:12.5px; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.15s ease;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polygon points="10 8 16 12 10 16 10 8"/>
                  </svg>
                  <span>Aperçu Simulateur Test</span>
                </button>
              </div>
            </div>

            <!-- MODE 1: FOLDERS VIEW OR ACTIVE DOSSIER CORRECTION -->
            @if (teacherModeTab() === 'folders') {

              <!-- SUB-VIEW A: ALL FOLDERS GRID -->
              @if (!activeSubmission()) {
                <div style="animation: fadeIn 0.2s ease;">

                  <!-- Top Metrics Overview -->
                  <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(210px, 1fr)); gap:14px; margin-bottom:20px;">
                    <!-- Metric 1: Total -->
                    <div class="metric-card">
                      <div>
                        <div style="font-size:11.5px; color:var(--text-secondary); font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Total Dossiers</div>
                        <div style="font-size:26px; font-weight:900; color:var(--text-primary); margin-top:2px;">{{ assessmentSubmissions().length }}</div>
                      </div>
                      <div style="width:40px; height:40px; border-radius:10px; background:#EEF2FF; color:#4F46E5; display:flex; align-items:center; justify-content:center;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                      </div>
                    </div>

                    <!-- Metric 2: Pending -->
                    <div class="metric-card" style="border-color:#FED7AA; background:linear-gradient(135deg, rgba(254, 243, 199, 0.3) 0%, rgba(255, 237, 213, 0.4) 100%);">
                      <div>
                        <div style="font-size:11.5px; color:#C2410C; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">En attente de correction</div>
                        <div style="font-size:26px; font-weight:900; color:#EA580C; margin-top:2px;">{{ pendingSubmissionsCount() }}</div>
                      </div>
                      <div style="width:40px; height:40px; border-radius:10px; background:#FFEDD5; color:#EA580C; display:flex; align-items:center; justify-content:center;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      </div>
                    </div>

                    <!-- Metric 3: Corrected -->
                    <div class="metric-card" style="border-color:#A7F3D0; background:linear-gradient(135deg, rgba(209, 250, 229, 0.3) 0%, rgba(236, 253, 245, 0.4) 100%);">
                      <div>
                        <div style="font-size:11.5px; color:#047857; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Dossiers Corrigés</div>
                        <div style="font-size:26px; font-weight:900; color:#059669; margin-top:2px;">{{ correctedSubmissionsCount() }}</div>
                      </div>
                      <div style="width:40px; height:40px; border-radius:10px; background:#D1FAE5; color:#059669; display:flex; align-items:center; justify-content:center;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    </div>

                    <!-- Metric 4: Average Score -->
                    <div class="metric-card">
                      <div>
                        <div style="font-size:11.5px; color:var(--text-secondary); font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">Moyenne (Échelle SET)</div>
                        <div style="font-size:26px; font-weight:900; color:#4F46E5; margin-top:2px;">
                          {{ averageOverallScore() > 0 ? averageOverallScore() + ' / 160' : '—' }}
                        </div>
                      </div>
                      <div style="width:40px; height:40px; border-radius:10px; background:#F3E8FF; color:#7C3AED; display:flex; align-items:center; justify-content:center;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                      </div>
                    </div>
                  </div>

                  <!-- Filter & Search Toolbar -->
                  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px;">
                    <div style="display:flex; align-items:center; gap:8px; flex:1; max-width:400px; background:var(--surface-1); border:1px solid var(--border); border-radius:10px; padding:0 12px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input
                        type="text"
                        [ngModel]="folderSearchQuery()"
                        (ngModelChange)="folderSearchQuery.set($event)"
                        placeholder="Rechercher un dossier élève ou email..."
                        style="border:none; outline:none; background:transparent; padding:10px 0; font-size:13px; color:var(--text-primary); width:100%;"
                      />
                      @if (folderSearchQuery()) {
                        <button type="button" (click)="folderSearchQuery.set('')" style="border:none; background:transparent; color:var(--text-muted); cursor:pointer; display:flex; align-items:center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                      }
                    </div>

                    <!-- Filter pills -->
                    <div style="display:flex; gap:6px; flex-wrap:wrap;">
                      <button
                        type="button"
                        (click)="folderFilterStatus.set('all')"
                        [class.active-pill]="folderFilterStatus() === 'all'"
                        class="filter-pill">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle; margin-right:4px;"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                        <span>Tous ({{ assessmentSubmissions().length }})</span>
                      </button>
                      <button
                        type="button"
                        (click)="folderFilterStatus.set('pending')"
                        [class.active-pill]="folderFilterStatus() === 'pending'"
                        class="filter-pill"
                        style="color:#C2410C;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span>En attente ({{ pendingSubmissionsCount() }})</span>
                      </button>
                      <button
                        type="button"
                        (click)="folderFilterStatus.set('corrected')"
                        [class.active-pill]="folderFilterStatus() === 'corrected'"
                        class="filter-pill"
                        style="color:#047857;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle; margin-right:4px;"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Corrigés ({{ correctedSubmissionsCount() }})</span>
                      </button>
                    </div>
                  </div>

                  <!-- Dossiers List (Ligne par Ligne) -->
                  @if (filteredFolders().length === 0) {
                    <div style="text-align:center; padding:55px 24px; background:white; border-radius:16px; border:1.5px dashed #CBD5E1; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
                      <div style="width:60px; height:60px; margin:0 auto 16px auto; border-radius:50%; background:#EEF2FF; display:flex; align-items:center; justify-content:center; color:#4F46E5;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                      </div>
                      @if (assessmentSubmissions().length === 0) {
                        <h4 style="font-size:17px; font-weight:800; color:var(--text-primary); margin:0 0 8px 0;">Aucun dossier d'évaluation soumis pour le moment</h4>
                        <p style="font-size:13.5px; color:var(--text-secondary); max-width:560px; margin:0 auto 18px auto; line-height:1.5;">
                          Les dossiers des vrais étudiants de la plateforme apparaîtront ici <strong>ligne par ligne</strong> dès qu'ils auront passé leur test SpeakUp English Assessment (réponses écrites, vocaux enregistrés, notes automatiques).
                        </p>
                        <div style="display:flex; justify-content:center; gap:10px;">
                          <button type="button" (click)="openGeneratorTab()" class="det-action-btn" style="font-size:13px; padding:8px 16px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                            <span>Générateur depuis les Leçons</span>
                          </button>
                        </div>
                      } @else {
                        <h4 style="font-size:16px; font-weight:800; color:var(--text-primary); margin:0 0 6px 0;">Aucun dossier trouvé</h4>
                        <p style="font-size:13px; color:var(--text-secondary); margin:0;">Modifiez votre recherche ou vos filtres pour afficher des dossiers d'évaluation.</p>
                      }
                    </div>
                  } @else {
                    <div class="submissions-list-rows">
                      <!-- Table Header Bar -->
                      <div class="dossier-row-header">
                        <div>Élève & Candidat</div>
                        <div>Date de soumission</div>
                        <div>Contenu évalué</div>
                        <div>Statut / Note</div>
                        <div style="text-align:right;">Actions</div>
                      </div>

                      <!-- Submissions Rows (Ligne par Ligne) -->
                      @for (sub of filteredFolders(); track sub.id) {
                        <div class="dossier-row" [class.row-pending]="sub.status === 'pending'" [class.row-corrected]="sub.status === 'corrected'">
                          
                          <!-- Column 1: Student Avatar & Info -->
                          <div class="dossier-col-student">
                            <div class="student-avatar-circle" [style.background]="getAvatarGradient(sub.studentName)">
                              {{ sub.studentAvatar || sub.studentName.slice(0, 2).toUpperCase() }}
                            </div>
                            <div style="min-width:0;">
                              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                <h4 class="student-name" [title]="sub.studentName">{{ sub.studentName }}</h4>
                                <span class="dossier-id-tag">#SET-{{ sub.id.slice(-6).toUpperCase() }}</span>
                              </div>
                              <div class="student-email" [title]="sub.studentEmail">{{ sub.studentEmail || 'Élève inscrit' }}</div>
                            </div>
                          </div>

                          <!-- Column 2: Date de soumission -->
                          <div class="dossier-col-date">
                            <div class="col-value">
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                              <span>{{ formatSubmissionDate(sub.submittedAt) }}</span>
                            </div>
                          </div>

                          <!-- Column 3: Contenu évalué -->
                          <div class="dossier-col-content">
                            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                              <span class="dossier-chip-sm chip-blue" title="Enregistrements vocaux à écouter">
                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                                <span>{{ getAudioQuestionsCount(sub) }} vocaux</span>
                              </span>
                              <span class="dossier-chip-sm chip-green" title="Réponses écrites">
                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                <span>{{ getWrittenQuestionsCount(sub) }} rédactions</span>
                              </span>
                              <span class="dossier-chip-sm chip-purple" title="Durée totale">
                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                <span>{{ Math.round(sub.durationSeconds / 60) }} min</span>
                              </span>
                            </div>
                          </div>

                          <!-- Column 4: Statut & Note -->
                          <div class="dossier-col-status">
                            <div style="display:flex; flex-direction:column; gap:4px;">
                              @if (sub.status === 'pending') {
                                <span class="badge-status-pending">
                                  <span style="width:7px; height:7px; border-radius:50%; background:#EA580C; animation: pulse-live 1.5s infinite"></span>
                                  <span>En attente</span>
                                </span>
                              } @else {
                                <div style="display:flex; align-items:center; gap:8px;">
                                  <span class="badge-status-corrected">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                    <span>Corrigé</span>
                                  </span>
                                  @if (sub.overallScore) {
                                    <span class="score-badge">
                                      {{ sub.overallScore }}/160 • {{ sub.cefrLevel || 'B2' }}
                                    </span>
                                  }
                                </div>
                              }

                              <!-- Anti-Cheat Integrity Pill in Row -->
                              @if (sub.antiCheatReport) {
                                @if (sub.antiCheatReport.tabSwitches === 0) {
                                  <span class="dossier-chip-sm" style="background:#ECFDF5; color:#047857; border:1px solid #A7F3D0; font-size:10px; padding:2px 6px; width:fit-content;" title="Anti-triche : Intégrité 100% (Aucun changement d'onglet)">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                    <span>Intégrité 100%</span>
                                  </span>
                                } @else {
                                  <span class="dossier-chip-sm" style="background:#FEF2F2; color:#B91C1C; border:1px solid #FECACA; font-size:10px; padding:2px 6px; width:fit-content;" title="Sorties d'écran détectées pendant l'épreuve">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                    <span>{{ sub.antiCheatReport.tabSwitches }} sortie(s) écran</span>
                                  </span>
                                }
                              }
                            </div>
                          </div>

                          <!-- Column 5: Actions (Single SVG icon per button) -->
                          <div class="dossier-col-actions">
                            @if (sub.status === 'pending') {
                              <button
                                type="button"
                                (click)="openSubmissionFolder(sub)"
                                class="btn-dossier-action btn-pending-action"
                                title="Ouvrir le dossier pour écouter les vocaux et corriger">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                                <span>Corriger</span>
                              </button>
                            } @else {
                              <button
                                type="button"
                                (click)="openSubmissionFolder(sub)"
                                class="btn-dossier-action btn-corrected-action"
                                title="Consulter et ajuster la correction de l'élève">
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                <span>Consulter</span>
                              </button>
                            }

                            <button
                              type="button"
                              (click)="deleteSubmission(sub.id, sub.studentName)"
                              class="btn-dossier-delete"
                              title="Supprimer ce dossier">
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          </div>

                        </div>
                      }
                    </div>
                  }
                </div>
              }

              <!-- SUB-VIEW B: ACTIVE DOSSIER CORRECTION WORKSPACE -->
              @if (activeSubmission(); as curSub) {
                <div style="animation: fadeIn 0.25s ease;">
                  
                  <!-- Workspace Header Bar -->
                  <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:20px; background:white; padding:16px 20px; border-radius:14px; border:1.5px solid #C7D2FE; box-shadow:0 4px 14px rgba(79,70,229,0.06);">
                    <div style="display:flex; align-items:center; gap:14px;">
                      <button
                        type="button"
                        (click)="closeSubmissionFolder()"
                        style="border:1px solid #CBD5E1; background:#F8FAFC; padding:8px 14px; border-radius:8px; font-weight:700; font-size:12px; color:#475569; cursor:pointer; display:flex; align-items:center; gap:6px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                        <span>Tous les dossiers</span>
                      </button>

                      <div style="display:flex; align-items:center; gap:10px;">
                        <div style="width:38px; height:38px; border-radius:50%; background:#4F46E5; color:white; font-size:14px; font-weight:800; display:flex; align-items:center; justify-content:center;">
                          {{ curSub.studentAvatar || curSub.studentName.slice(0, 2).toUpperCase() }}
                        </div>
                        <div>
                          <div style="font-size:16px; font-weight:900; color:#1E1B4B; line-height:1.2;">Dossier de {{ curSub.studentName }}</div>
                          <div style="display:flex; align-items:center; gap:6px; margin-top:4px;">
                            <button type="button" class="btn-s" style="font-size:11px; padding:3px 8px;" (click)="setAllQuestionsScore(100)">Tout noter à 100</button>
                            <button type="button" class="btn-s" style="font-size:11px; padding:3px 8px; color:#4F46E5;" (click)="recalculateFromQuestions(curSub)">Recalculer</button>
                            <button type="button" class="btn-s" style="font-size:11px; padding:3px 8px; color:#059669;" (click)="previewCertificateForActiveSubmission()">Aperçu Certificat</button>
                          </div>
                          <div style="font-size:11.5px; color:#64748B;">Soumis le {{ formatSubmissionDate(curSub.submittedAt) }} • {{ curSub.questions.length }} épreuves complétées</div>
                        </div>
                      </div>
                    </div>

                    <div style="display:flex; align-items:center; gap:10px;">
                      @if (curSub.status === 'pending') {
                        <span class="badge" style="background:#FFF7ED; color:#C2410C; border:1px solid #FFEDD5; font-size:12px; font-weight:800; padding:5px 12px; border-radius:20px;">
                          ⏳ En attente de correction
                        </span>
                      } @else {
                        <span class="badge" style="background:#ECFDF5; color:#047857; border:1px solid #A7F3D0; font-size:12px; font-weight:800; padding:5px 12px; border-radius:20px;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle; margin-right:4px;"><polyline points="20 6 9 17 4 12"/></svg><span>Corrigé • Score: {{ curSub.overallScore }}/160 ({{ curSub.cefrLevel }})</span>
                        </span>
                      }
                    </div>
                  </div>

                  <!-- 2-Columns Correction Workspace -->
                  <div class="correction-grid">
                    
                    <!-- Left Column: Student's Answers & Per-Question Grading (70%) -->
                    <div style="display:flex; flex-direction:column; gap:20px;">
                      @for (q of curSub.questions; track q.questionId; let qIdx = $index) {
                        <div class="q-correction-card">
                          
                          <!-- Question Header -->
                          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid #F1F5F9; padding-bottom:10px;">
                            <div style="display:flex; align-items:center; gap:8px;">
                              <span style="width:24px; height:24px; border-radius:6px; background:#4F46E5; color:white; font-size:12px; font-weight:800; display:flex; align-items:center; justify-content:center;">
                                {{ qIdx + 1 }}
                              </span>
                              <h5 style="font-size:14.5px; font-weight:800; color:#1E1B4B; margin:0;">{{ q.title }}</h5>
                            </div>
                            
                            <span class="subscore-tag" [class]="'subscore-' + q.subscore">
                              {{ q.subscore | uppercase }}
                            </span>
                          </div>

                          <!-- Original Question Prompt -->
                          <div style="background:#F8FAFC; border-radius:10px; padding:12px; margin-bottom:14px; font-size:13px; color:#334155; border:1px solid #E2E8F0;">
                            @if (q.imageUrl) {
                              <div style="text-align:center; margin-bottom:10px;">
                                <img [src]="q.imageUrl" style="max-height:180px; max-width:100%; border-radius:8px; object-fit:cover; box-shadow:0 2px 8px rgba(0,0,0,0.1);" alt="Image prompt" />
                              </div>
                            }
                            @if (q.prompt) {
                              <div style="font-weight:600; line-height:1.4;">{{ q.prompt }}</div>
                            }
                            @if (q.audioPromptText && !q.prompt) {
                              <div style="font-weight:600; color:#0369A1; display:flex; align-items:center; gap:6px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
                                <span>Énoncé audio : « {{ q.audioPromptText }} »</span>
                              </div>
                            }
                          </div>

                          <!-- Student's Work / Response Box -->
                          <div style="margin-bottom:16px;">
                            <div style="font-size:11.5px; font-weight:800; color:#475569; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; display:flex; align-items:center; gap:6px;">
                              <span>Réponse de l'élève :</span>
                              @if (q.wordCount && q.wordCount > 0) {
                                <span style="font-size:11px; font-weight:700; color:#6366F1; background:#EEF2FF; padding:1px 6px; border-radius:4px;">{{ q.wordCount }} mots</span>
                              }
                            </div>

                            <!-- AUDIO QUESTION: Voice Player for Teacher -->
                            @if (q.studentAudioUrl || q.type === 'speak-photo' || q.type === 'read-aloud' || q.type === 'listen-speak') {
                              <div class="teacher-audio-player-box">
                                <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                                  <div style="width:34px; height:34px; border-radius:50%; background:#4F46E5; color:white; display:flex; align-items:center; justify-content:center;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                                  </div>
                                  <div>
                                    <div style="font-size:13px; font-weight:800; color:#1E1B4B;">Enregistrement vocal de l'élève</div>
                                    <div style="font-size:11px; color:#64748B;">Écoutez l'audio pour évaluer l'accent, l'intonation et la fluidité</div>
                                  </div>
                                </div>

                                <!-- Standard HTML Audio Player (works with mp3, wav, webm, and base64) -->
                                @if (q.studentAudioUrl) {
                                  <audio controls [src]="q.studentAudioUrl" style="width:100%; border-radius:8px; outline:none; margin-bottom:8px;"></audio>
                                } @else {
                                  <div style="background:#FEF2F2; color:#991B1B; padding:8px 12px; border-radius:6px; font-size:12px; margin-bottom:8px;">
                                    (Fichier audio transmis ou simulé pour ce dossier d'essai)
                                  </div>
                                }

                                @if (q.studentAnswerText) {
                                  <div style="font-size:12.5px; color:#334155; font-style:italic; background:white; padding:8px 12px; border-radius:6px; border:1px solid #E2E8F0;">
                                    {{ q.studentAnswerText }}
                                  </div>
                                }
                              </div>
                            } @else {
                              <!-- WRITTEN QUESTION: Text block -->
                              <div style="background:white; border:1.5px solid #E2E8F0; border-radius:10px; padding:14px; font-size:13.5px; color:#1E293B; line-height:1.5;">
                                {{ q.studentAnswerText || '(Aucune réponse fournie)' }}
                              </div>
                            }
                          </div>

                          <!-- Teacher Grading & Feedback Inputs per Question -->
                          <div style="background:#F8FAFC; border:1.5px solid #C7D2FE; border-radius:10px; padding:14px;">
                            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:10px;">
                              <label style="font-size:12px; font-weight:800; color:#1E1B4B; display:flex; align-items:center; gap:6px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                                Note attribuée (sur 100) :
                              </label>

                              <!-- Preset buttons for quick grading -->
                              <div style="display:flex; gap:5px; flex-wrap:wrap;">
                                <button type="button" class="preset-score-btn" (click)="setQuestionScorePreset(q, 100)">100 (Parfait)</button>
                                <button type="button" class="preset-score-btn" (click)="setQuestionScorePreset(q, 85)">85 (Très bien)</button>
                                <button type="button" class="preset-score-btn" (click)="setQuestionScorePreset(q, 70)">70 (Bien)</button>
                                <button type="button" class="preset-score-btn" (click)="setQuestionScorePreset(q, 50)">50 (Moyen)</button>
                                <button type="button" class="preset-score-btn" (click)="setQuestionScorePreset(q, 30)">30 (Insuffisant)</button>
                              </div>

                              <div style="display:flex; align-items:center; gap:6px;">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  [(ngModel)]="q.teacherScore"
                                  (ngModelChange)="onQuestionScoreChange()"
                                  style="width:68px; padding:6px 8px; border:1.5px solid #4F46E5; border-radius:8px; font-size:15px; font-weight:900; text-align:center; color:#4F46E5; background:white; outline:none;"
                                />
                                <span style="font-size:13px; font-weight:800; color:#64748B;">/ 100</span>
                              </div>
                            </div>

                            <!-- Comment Input for this Question -->
                            <input
                              type="text"
                              [(ngModel)]="q.teacherComment"
                              placeholder="Remarque pour l'élève sur cette épreuve (prononciation, vocabulaire, grammaire...)"
                              style="width:100%; box-sizing:border-box; padding:8px 12px; border:1px solid #CBD5E1; border-radius:8px; font-size:12.5px; outline:none; background:white;"
                            />
                          </div>

                        </div>
                      }
                    </div>

                    <!-- Right Column: Sticky Global Certificate Validation & Overall Score (30%) -->
                    <div class="sticky-correction-sidebar">
                      <div class="certificate-grading-card">
                        
                        <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px;">
                          <div style="width:36px; height:36px; border-radius:8px; background:linear-gradient(135deg, #4F46E5, #7C3AED); color:white; display:flex; align-items:center; justify-content:center;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                          </div>
                          <div>
                            <h4 style="font-size:15px; font-weight:900; color:#1E1B4B; margin:0;">Certificat SpeakUp</h4>
                            <div style="font-size:11.5px; color:#64748B;">Validation officielle du niveau</div>
                          </div>
                        </div>

                        <!-- Overall DET Scaled Score Display & Slider -->
                        <div style="text-align:center; background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:16px;">
                          <div style="font-size:11px; font-weight:800; color:#64748B; text-transform:uppercase; letter-spacing:0.8px;">Score Global (Échelle 10–160)</div>
                          <div style="font-size:44px; font-weight:900; color:#4F46E5; line-height:1; margin:8px 0 4px 0; font-family:'Outfit', sans-serif;">
                            {{ curSub.overallScore || 100 }}
                            <span style="font-size:16px; font-weight:700; color:#94A3B8;">/ 160</span>
                          </div>

                          <div style="margin-top:10px; text-align:left;">
                            <label style="font-size:11px; font-weight:800; color:#64748B; text-transform:uppercase; display:block; margin-bottom:4px;">Niveau CECRL accordé :</label>
                            <select
                              [(ngModel)]="curSub.cefrLevel"
                              style="width:100%; padding:8px 10px; border:1.5px solid #4F46E5; border-radius:8px; font-size:13px; font-weight:800; color:#4F46E5; background:white; outline:none;">
                              <option value="A1">Niveau A1 (Débutant)</option>
                              <option value="A2">Niveau A2 (Élémentaire)</option>
                              <option value="B1">Niveau B1 (Intermédiaire)</option>
                              <option value="B2">Niveau B2 (Indépendant / Avancé)</option>
                              <option value="C1">Niveau C1 (Autonome)</option>
                              <option value="C2">Niveau C2 (Maîtrise)</option>
                            </select>
                          </div>

                          <!-- Score Slider -->
                          <input
                            type="range"
                            min="10"
                            max="160"
                            step="5"
                            [(ngModel)]="curSub.overallScore"
                            (ngModelChange)="curSub.cefrLevel = getAutoCefr(curSub.overallScore || 100); recalculateSubscores(curSub);"
                            style="width:100%; accent-color:#4F46E5; cursor:pointer;"
                          />
                        </div>

                        <!-- 4 Subscores Breakdown -->
                        <div style="margin-bottom:16px;">
                          <div style="font-size:12px; font-weight:800; color:#1E1B4B; margin-bottom:8px;">Sous-scores de compétence (10–160)</div>
                          
                          <!-- Literacy -->
                          <div style="margin-bottom:8px;">
                            <div style="display:flex; justify-content:space-between; font-size:11.5px; font-weight:700; margin-bottom:2px;">
                              <span style="color:#4F46E5;">Literacy (Lire & Écrire)</span>
                              <span>{{ curSub.subscores?.literacy || 100 }}</span>
                            </div>
                            <input type="range" min="10" max="160" step="5" [(ngModel)]="curSub.subscores!.literacy" style="width:100%; accent-color:#4F46E5;" />
                          </div>

                          <!-- Comprehension -->
                          <div style="margin-bottom:8px;">
                            <div style="display:flex; justify-content:space-between; font-size:11.5px; font-weight:700; margin-bottom:2px;">
                              <span style="color:#0284C7;">Comprehension (Lire & Écouter)</span>
                              <span>{{ curSub.subscores?.comprehension || 100 }}</span>
                            </div>
                            <input type="range" min="10" max="160" step="5" [(ngModel)]="curSub.subscores!.comprehension" style="width:100%; accent-color:#0284C7;" />
                          </div>

                          <!-- Conversation -->
                          <div style="margin-bottom:8px;">
                            <div style="display:flex; justify-content:space-between; font-size:11.5px; font-weight:700; margin-bottom:2px;">
                              <span style="color:#059669;">Conversation (Écouter & Parler)</span>
                              <span>{{ curSub.subscores?.conversation || 100 }}</span>
                            </div>
                            <input type="range" min="10" max="160" step="5" [(ngModel)]="curSub.subscores!.conversation" style="width:100%; accent-color:#059669;" />
                          </div>

                          <!-- Production -->
                          <div style="margin-bottom:8px;">
                            <div style="display:flex; justify-content:space-between; font-size:11.5px; font-weight:700; margin-bottom:2px;">
                              <span style="color:#D97706;">Production (Écrire & Parler)</span>
                              <span>{{ curSub.subscores?.production || 100 }}</span>
                            </div>
                            <input type="range" min="10" max="160" step="5" [(ngModel)]="curSub.subscores!.production" style="width:100%; accent-color:#D97706;" />
                          </div>
                        </div>

                        <!-- Teacher Global Pedagogical Comment -->
                        <div style="margin-bottom:18px;">
                          <label style="font-size:12px; font-weight:800; color:#1E1B4B; display:block; margin-bottom:6px;">
                            Bilan global & Conseils du Professeur :
                          </label>
                          <textarea
                            rows="4"
                            [(ngModel)]="curSub.teacherGlobalComment"
                            placeholder="Écrivez une appréciation générale, points forts de l'élève et conseils d'amélioration..."
                            style="width:100%; box-sizing:border-box; padding:10px; border:1px solid #CBD5E1; border-radius:8px; font-size:12.5px; outline:none; resize:vertical; font-family:inherit;"
                          ></textarea>
                        </div>

                        <!-- Grant Certificate Checkbox -->
                        <div style="margin:12px 0; background:#ECFDF5; border:1.5px solid #10B981; border-radius:10px; padding:10px 12px; display:flex; align-items:center; gap:10px;">
                          <input
                            type="checkbox"
                            id="grantCertCheck"
                            [(ngModel)]="curSub.certificateAwarded"
                            style="width:18px; height:18px; accent-color:#059669; cursor:pointer;"
                          />
                          <label for="grantCertCheck" style="font-size:12px; font-weight:800; color:#065F46; cursor:pointer; line-height:1.3;">
                            Accorder le Certificat Officiel SpeakUp à cet élève
                          </label>
                        </div>

                        <!-- Action Buttons -->
                        <div style="display:flex; flex-direction:column; gap:8px;">
                          <button
                            type="button"
                            (click)="finalizeAssessmentCorrection()"
                            style="width:100%; padding:12px; border:none; border-radius:10px; background:linear-gradient(135deg, #059669 0%, #047857 100%); color:white; font-size:13.5px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 12px rgba(5,150,105,0.35);">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            <span>Valider & Accorder le Certificat</span>
                          </button>

                          <button
                            type="button"
                            (click)="previewCertificateForActiveSubmission()"
                            style="width:100%; padding:10px; border:1.5px solid #4F46E5; border-radius:10px; background:#EEF2FF; color:#4F46E5; font-size:12.5px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                            <span>Aperçu du Certificat Élève</span>
                          </button>

                          <button
                            type="button"
                            (click)="saveAssessmentDraft()"
                            style="width:100%; padding:10px; border:1.5px solid #CBD5E1; border-radius:10px; background:white; color:#334155; font-size:12.5px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                            <span>Sauvegarder en brouillon</span>
                          </button>
                        </div>

                      </div>
                    </div>

                  </div>

                </div>
              }

            }
            <!-- MODE 2: LESSONS ASSESSMENT GENERATOR (A2-B2) -->
            @if (teacherModeTab() === 'generator') {
              <div style="animation: fadeIn 0.25s ease;">

                <!-- Hero Card: Assessment Generator -->
                <div style="background:linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%); border-radius:18px; padding:28px; color:white; margin-bottom:24px; box-shadow:0 10px 30px rgba(67, 56, 202, 0.25); position:relative; overflow:hidden;">
                  <div style="position:relative; z-index:2; max-width:760px;">
                    <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.15); backdrop-filter:blur(8px); padding:4px 12px; border-radius:20px; font-size:11px; font-weight:800; letter-spacing:0.5px; text-transform:uppercase; margin-bottom:12px; border:1px solid rgba(255,255,255,0.25);">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      Générateur Pédagogique Intelligent A2–B2
                    </div>
                    <h2 style="font-family:'Outfit', sans-serif; font-size:26px; font-weight:800; margin:0 0 10px 0; line-height:1.2;">
                      Créez l'Évaluation SpeakUp directement depuis vos Leçons
                    </h2>
                    <p style="font-size:13.5px; opacity:0.9; margin:0 0 20px 0; line-height:1.6;">
                      Ce module analyse automatiquement les leçons enregistrées dans la plateforme, en extrait le vocabulaire authentique, les règles grammaticales et les thèmes clés, puis synthétise un examen complet SpeakUp English Assessment (20 épreuves réelles calibrées CEFR A2 à B2 avec renforcement grammatical intensif).
                    </p>

                    <!-- Quick Stats Chips -->
                    <div style="display:flex; flex-wrap:wrap; gap:10px;">
                      <div style="background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2); padding:6px 14px; border-radius:10px; font-size:12px; font-weight:700;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" style="vertical-align:middle; margin-right:4px;"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>{{ lessons().length }} leçons actives
                      </div>
                      <div style="background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2); padding:6px 14px; border-radius:10px; font-size:12px; font-weight:700;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" style="vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>Calibration : A2 • B1 • B2
                      </div>
                      <div style="background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.2); padding:6px 14px; border-radius:10px; font-size:12px; font-weight:700;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" style="vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Format officiel : 20 épreuves (~60 min • Chronos min. 3 min / question)
                      </div>
                      @if (officialAssessmentQuestions().length > 0) {
                        <div style="background:#10B981; color:white; padding:6px 14px; border-radius:10px; font-size:12px; font-weight:800; display:flex; align-items:center; gap:6px;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg><span>Examen Officiel Actif en Classe</span>
                        </div>
                      }
                    </div>
                  </div>
                </div>

                <!-- Configuration Panel (Level Selection + Lesson Pickers) -->
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px; margin-bottom:24px;">

                  <!-- Column 1: CEFR Target Level -->
                  <div style="background:var(--surface-1); border:1.5px solid var(--border); border-radius:16px; padding:22px;">
                    <div style="display:flex; align-items:center; gap:8px; margin-bottom:14px;">
                      <div style="width:32px; height:32px; border-radius:8px; background:#EEF2FF; color:#4F46E5; display:flex; align-items:center; justify-content:center;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8Z"/><polygon points="12 6 12 12 16 14"/></svg>
                      </div>
                      <h3 style="font-size:16px; font-weight:800; color:var(--text-primary); margin:0;">1. Niveau Cible CEFR</h3>
                    </div>
                    <p style="font-size:12.5px; color:var(--text-secondary); margin:0 0 14px 0;">
                      Choisissez le calibrage de difficulté pour l'évaluation générée :
                    </p>

                    <div style="display:flex; flex-direction:column; gap:8px;">
                      <!-- A2-B2 Global -->
                      <label
                        (click)="setGeneratorLevel('A2-B2')"
                        [style.border-color]="targetGeneratorLevel() === 'A2-B2' ? '#4F46E5' : 'var(--border)'"
                        [style.background]="targetGeneratorLevel() === 'A2-B2' ? '#EEF2FF' : 'transparent'"
                        style="display:flex; align-items:flex-start; gap:10px; padding:12px 14px; border-radius:12px; border:1.5px solid; cursor:pointer; transition:all 0.15s ease;">
                        <input type="radio" name="level" [checked]="targetGeneratorLevel() === 'A2-B2'" style="margin-top:3px; accent-color:#4F46E5; pointer-events:none;" />
                        <div>
                          <div style="font-size:13.5px; font-weight:800; color:#1E1B4B; display:flex; align-items:center; gap:6px;">
                            <span>Niveau Global A2–B2 (Équilibré)</span>
                            <span style="background:#4F46E5; color:white; font-size:10px; font-weight:800; padding:2px 6px; border-radius:6px;">Recommandé</span>
                          </div>
                          <div style="font-size:11.5px; color:#475569; margin-top:2px;">
                            Évalue le spectre complet de l'élémentaire à l'intermédiaire supérieur.
                          </div>
                        </div>
                      </label>

                      <!-- A2 -->
                      <label
                        (click)="setGeneratorLevel('A2')"
                        [style.border-color]="targetGeneratorLevel() === 'A2' ? '#4F46E5' : 'var(--border)'"
                        [style.background]="targetGeneratorLevel() === 'A2' ? '#EEF2FF' : 'transparent'"
                        style="display:flex; align-items:flex-start; gap:10px; padding:12px 14px; border-radius:12px; border:1.5px solid; cursor:pointer; transition:all 0.15s ease;">
                        <input type="radio" name="level" [checked]="targetGeneratorLevel() === 'A2'" style="margin-top:3px; accent-color:#4F46E5; pointer-events:none;" />
                        <div>
                          <div style="font-size:13.5px; font-weight:800; color:#1E1B4B;">Niveau A2 (Élémentaire / Waystage)</div>
                          <div style="font-size:11.5px; color:#475569; margin-top:2px;">
                            Situations du quotidien, descriptions d'images simples, dictées 8-12 mots.
                          </div>
                        </div>
                      </label>

                      <!-- B1 -->
                      <label
                        (click)="setGeneratorLevel('B1')"
                        [style.border-color]="targetGeneratorLevel() === 'B1' ? '#4F46E5' : 'var(--border)'"
                        [style.background]="targetGeneratorLevel() === 'B1' ? '#EEF2FF' : 'transparent'"
                        style="display:flex; align-items:flex-start; gap:10px; padding:12px 14px; border-radius:12px; border:1.5px solid; cursor:pointer; transition:all 0.15s ease;">
                        <input type="radio" name="level" [checked]="targetGeneratorLevel() === 'B1'" style="margin-top:3px; accent-color:#4F46E5; pointer-events:none;" />
                        <div>
                          <div style="font-size:13.5px; font-weight:800; color:#1E1B4B;">Niveau B1 (Intermédiaire / Threshold)</div>
                          <div style="font-size:11.5px; color:#475569; margin-top:2px;">
                            Événements passés, réunions d'équipe, rédaction argumentée de 50 mots.
                          </div>
                        </div>
                      </label>

                      <!-- B2 -->
                      <label
                        (click)="setGeneratorLevel('B2')"
                        [style.border-color]="targetGeneratorLevel() === 'B2' ? '#4F46E5' : 'var(--border)'"
                        [style.background]="targetGeneratorLevel() === 'B2' ? '#EEF2FF' : 'transparent'"
                        style="display:flex; align-items:flex-start; gap:10px; padding:12px 14px; border-radius:12px; border:1.5px solid; cursor:pointer; transition:all 0.15s ease;">
                        <input type="radio" name="level" [checked]="targetGeneratorLevel() === 'B2'" style="margin-top:3px; accent-color:#4F46E5; pointer-events:none;" />
                        <div>
                          <div style="font-size:13.5px; font-weight:800; color:#1E1B4B;">Niveau B2 (Intermédiaire Supérieur / Vantage)</div>
                          <div style="font-size:11.5px; color:#475569; margin-top:2px;">
                            Nuances lexicales, vocabulaire technique, débat oral et rédaction de 65+ mots.
                          </div>
                        </div>
                      </label>
                    </div>

                    <!-- Dynamic Subscores Competency Balance -->
                    <div style="background:white; border:1px solid var(--border); border-radius:12px; padding:14px; margin-top:16px;">
                      <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px; font-weight:800; color:#1E1B4B; margin-bottom:4px;">
                        <span style="display:flex; align-items:center; gap:6px;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.3"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                          Équilibre des compétences évaluées
                        </span>
                        <span style="color:#4F46E5; font-size:11px; font-weight:800;">100% Calibré</span>
                      </div>
                      <div class="subscore-bar-track">
                        <div class="subscore-bar-fill" [style.width]="generatorSubscoresBalance().literacy + '%'" style="background:#3B82F6;" [title]="'Literacy ' + generatorSubscoresBalance().literacy + '%'"></div>
                        <div class="subscore-bar-fill" [style.width]="generatorSubscoresBalance().comprehension + '%'" style="background:#8B5CF6;" [title]="'Comprehension ' + generatorSubscoresBalance().comprehension + '%'"></div>
                        <div class="subscore-bar-fill" [style.width]="generatorSubscoresBalance().production + '%'" style="background:#F59E0B;" [title]="'Production ' + generatorSubscoresBalance().production + '%'"></div>
                        <div class="subscore-bar-fill" [style.width]="generatorSubscoresBalance().conversation + '%'" style="background:#10B981;" [title]="'Conversation ' + generatorSubscoresBalance().conversation + '%'"></div>
                      </div>
                      <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:10.5px; font-weight:700; color:var(--text-muted); flex-wrap:wrap; gap:4px;">
                        <span style="color:#2563EB;">● Écrit: {{ generatorSubscoresBalance().literacy }}%</span>
                        <span style="color:#7C3AED;">● Écoute: {{ generatorSubscoresBalance().comprehension }}%</span>
                        <span style="color:#D97706;">● Rédaction: {{ generatorSubscoresBalance().production }}%</span>
                        <span style="color:#059669;">● Oral: {{ generatorSubscoresBalance().conversation }}%</span>
                      </div>
                    </div>

                    <!-- Dynamic Vocabulary Cloud Extracted from Lessons -->
                    @if (extractedVocabWords().length > 0) {
                      <div style="margin-top:14px; background:#F8FAFC; border:1px solid var(--border); border-radius:12px; padding:12px;">
                        <div style="font-size:11px; font-weight:800; color:#475569; text-transform:uppercase; letter-spacing:0.4px; margin-bottom:8px; display:flex; align-items:center; gap:6px;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.3"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                          <span>Mots clés extraits des leçons ({{ extractedVocabWords().length }}) :</span>
                        </div>
                        <div style="display:flex; flex-wrap:wrap; gap:5px;">
                          @for (w of extractedVocabWords(); track w) {
                            <span style="background:white; color:#4338CA; border:1px solid #C7D2FE; font-size:11px; font-weight:700; padding:3px 8px; border-radius:6px; box-shadow:0 1px 2px rgba(0,0,0,0.03);">
                              {{ w }}
                            </span>
                          }
                        </div>
                      </div>
                    }

                  </div>

                  <!-- Column 2: Lessons Selection -->
                  <div style="background:var(--surface-1); border:1.5px solid var(--border); border-radius:16px; padding:22px; display:flex; flex-direction:column;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                      <div style="display:flex; align-items:center; gap:8px;">
                        <div style="width:32px; height:32px; border-radius:8px; background:#F0FDF4; color:#16A34A; display:flex; align-items:center; justify-content:center;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>
                        </div>
                        <h3 style="font-size:16px; font-weight:800; color:var(--text-primary); margin:0;">2. Leçons Sources</h3>
                      </div>
                      <button
                        type="button"
                        (click)="toggleSelectAllLessons()"
                        style="border:none; background:transparent; color:#4F46E5; font-size:12px; font-weight:700; cursor:pointer;">
                        {{ selectedLessonIds().length === lessons().length ? 'Tout désélectionner' : 'Tout sélectionner' }}
                      </button>
                    </div>
                    <p style="font-size:12.5px; color:var(--text-secondary); margin:0 0 12px 0;">
                      Sélectionnez les leçons dont le vocabulaire et les notions doivent être évalués :
                    </p>

                    <!-- Lessons List -->
                    <div style="flex:1; overflow-y:auto; max-height:230px; display:flex; flex-direction:column; gap:8px; padding-right:4px;">
                      @for (l of lessons(); track l.id) {
                        <label
                          (click)="toggleLessonSelection(l.id)"
                          [style.background]="isLessonSelected(l.id) ? '#F8FAFC' : 'transparent'"
                          style="display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; border:1px solid var(--border); cursor:pointer; transition:all 0.15s ease;">
                          <input type="checkbox" [checked]="isLessonSelected(l.id)" style="accent-color:#4F46E5; pointer-events:none;" />
                          <div style="flex:1; min-width:0;">
                            <div style="font-size:13px; font-weight:700; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
                              {{ l.title }}
                            </div>
                            <div style="display:flex; align-items:center; gap:8px; font-size:11px; color:var(--text-muted); margin-top:2px;">
                              <span style="font-weight:700; color:#4F46E5;">{{ l.level || 'A2-B2' }}</span>
                              <span>•</span>
                              <span>{{ l.vocabulary?.length || 0 }} mots de vocabulaire</span>
                            </div>
                          </div>
                        </label>
                      }
                    </div>

                    <!-- Action Button: Generate -->
                    <div style="margin-top:16px; display:flex; flex-direction:column; gap:8px;">
                      <button
                        type="button"
                        (click)="triggerGenerateAssessment(true, false)"
                        [disabled]="isGenerating()"
                        style="width:100%; padding:13px 18px; border:none; border-radius:12px; background:linear-gradient(135deg, #4F46E5 0%, #4338CA 100%); color:white; font-size:14px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 4px 14px rgba(79,70,229,0.35); transition:all 0.15s ease;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" [class.spin-icon]="isGenerating()">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                        <span>
  @if (isGenerating()) {
    Génération en cours...
  } @else {
    Générer l'Évaluation depuis ces Leçons
  }
</span>
                      </button>

                      <button
                        type="button"
                        (click)="triggerGenerateAssessment(true, true)"
                        [disabled]="isGenerating() || isSavingOfficial()"
                        style="width:100%; padding:10px 18px; border:1.5px solid #10B981; border-radius:12px; background:#ECFDF5; color:#047857; font-size:12.5px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; transition:all 0.15s ease;">
                        @if (isSavingOfficial()) {
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin-icon"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                          <span>Activation en cours...</span>
                        } @else if (isOfficialSaved() || officialAssessmentQuestions().length > 0) {
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          <span>Examen Officiel Actif (Régénérer & Réactiver)</span>
                        } @else {
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          <span>Générer & Activer comme Examen Officiel de la Classe</span>
                        }
                      </button>
                    </div>

                  </div>

                </div>

                <!-- Notification Alert Toast -->
                @if (saveSuccessNotification()) {
                  <div style="background:#ECFDF5; border:1.5px solid #10B981; border-radius:12px; padding:14px 18px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; animation:fadeIn 0.2s ease;">
                    <div style="display:flex; align-items:center; gap:10px; color:#065F46; font-size:13.5px; font-weight:700;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>{{ saveSuccessNotification() }}</span>
                    </div>
                    <button type="button" (click)="saveSuccessNotification.set(null)" style="border:none; background:transparent; color:#065F46; cursor:pointer; display:flex; align-items:center;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                  </div>
                }

                <!-- PREVIEW OF GENERATED ASSESSMENT -->
                @if (genAssessment(); as ga) {
                  <div id="generated-assessment-preview" style="background:var(--surface-1); border:1.5px solid var(--border); border-radius:18px; padding:24px; margin-bottom:30px; scroll-margin-top:30px;">
                    
                    <!-- Header of Preview -->
                    <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:20px; border-bottom:1px solid var(--border); padding-bottom:16px;">
                      <div>
                        <div style="display:flex; align-items:center; gap:8px;">
                          <span style="background:#EEF2FF; color:#4F46E5; font-size:11px; font-weight:800; padding:3px 8px; border-radius:6px; text-transform:uppercase;">
                            Calibration CEFR {{ ga.targetLevel }}
                          </span>
                          <span style="font-size:12px; color:var(--text-muted);">
                            Généré à {{ ga.generatedAt | date:'shortTime' }}
                          </span>
                        </div>
                        <h3 style="font-size:20px; font-weight:800; color:var(--text-primary); margin:6px 0 2px 0;">
                          {{ ga.title }}
                        </h3>
                        <div style="font-size:12.5px; color:var(--text-secondary);">
                          Couvre {{ ga.sourceLessonCount }} leçon(s) • {{ ga.questions.length }} épreuves officielles • {{ ga.vocabularyTestedCount }} mots de vocabulaire évalués
                        </div>
                      </div>

                      <!-- Action Buttons on Generated Test -->
                      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                        <button
                          type="button"
                          (click)="loadOfficialExamForEditing()"
                          style="padding:10px 16px; border:1.5px solid #6366F1; border-radius:10px; background:#EEF2FF; color:#4338CA; font-size:13px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.15s ease;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                          <span>Modifier l'Examen Officiel Actuel</span>
                        </button>

                        <button
                          type="button"
                          (click)="triggerGenerateAssessment(true)"
                          [disabled]="isGenerating()"
                          style="padding:10px 16px; border:1.5px solid #CBD5E1; border-radius:10px; background:white; color:#334155; font-size:13px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.15s ease;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" [class.spin-icon]="isGenerating()"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                          <span>{{ isGenerating() ? 'Génération...' : 'Nouvelles Variantes' }}</span>
                        </button>

                        <button
                          type="button"
                          (click)="saveGeneratedAsOfficial()"
                          [disabled]="isSavingOfficial()"
                          [style.background]="isOfficialSaved() || officialAssessmentQuestions().length > 0 ? '#059669' : '#10B981'"
                          style="padding:10px 18px; border:none; border-radius:10px; color:white; font-size:13px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 3px 10px rgba(16,185,129,0.3); transition:all 0.15s ease;">
                          @if (isSavingOfficial()) {
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin-icon"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                            <span>Enregistrement en cours...</span>
                          } @else if (isOfficialSaved() || officialAssessmentQuestions().length > 0) {
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            <span>Sauvegarder les Modifications (Officiel)</span>
                          } @else {
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            <span>Définir comme Évaluation Officielle de la Classe</span>
                          }
                        </button>

                        <button
                          type="button"
                          (click)="previewGeneratedInSimulator()"
                          style="padding:10px 16px; border:1.5px solid #4F46E5; border-radius:10px; background:white; color:#4F46E5; font-size:13px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:6px;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
                          <span>Tester dans le Simulateur</span>
                        </button>
                      </div>
                    </div>

                    <!-- 7 Questions Cards Accordion / Grid -->
                    <div style="display:flex; flex-direction:column; gap:14px;">
                      @for (q of ga.questions; track q.id; let idx = $index) {
                        <div style="background:var(--surface-2); border:1px solid var(--border); border-radius:12px; padding:16px;">
                          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; flex-wrap:wrap; gap:8px;">
                            <div style="display:flex; align-items:center; gap:10px;">
                              <span style="width:28px; height:28px; border-radius:50%; background:#4F46E5; color:white; font-size:12px; font-weight:800; display:flex; align-items:center; justify-content:center;">
                                {{ idx + 1 }}
                              </span>
                              <div>
                                <div style="font-size:14px; font-weight:800; color:var(--text-primary);">
                                  {{ q.titleFr }}
                                </div>
                                <div style="font-size:11.5px; color:var(--text-secondary); margin-top:1px;">
                                  {{ q.titleEn }}
                                </div>
                              </div>
                            </div>

                            <div style="display:flex; align-items:center; gap:8px;">
                              <span style="background:rgba(79,70,229,0.08); color:#4F46E5; font-size:11px; font-weight:800; padding:3px 8px; border-radius:6px;">
                                {{ getSubscoreLabel(q.subscore) }}
                              </span>
                              <span style="background:rgba(0,0,0,0.05); color:var(--text-secondary); font-size:11px; font-weight:700; padding:3px 8px; border-radius:6px;">
                                ⏱️ {{ q.timeLimitSec }}s
                              </span>
                              <span style="background:#FEF3C7; color:#B45309; font-size:11px; font-weight:800; padding:3px 8px; border-radius:6px;">
                                {{ q.targetLevel }}
                              </span>
                              <button
                                type="button"
                                (click)="toggleQuestionEdit(q.id)"
                                style="border:none; background:rgba(79,70,229,0.12); color:#4F46E5; padding:4px 10px; border-radius:6px; font-size:11.5px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:5px; transition:all 0.15s ease;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                <span>{{ editingQuestionId() === q.id ? 'Fermer Édition' : 'Modifier & Voix' }}</span>
                              </button>
                              <button
                                type="button"
                                (click)="startSingleModulePractice(q)"
                                title="Tester cette épreuve seule dans le simulateur"
                                style="border:none; background:rgba(79,70,229,0.08); color:#4F46E5; padding:4px 10px; border-radius:6px; font-size:11.5px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:5px; transition:all 0.15s ease;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                <span>Tester</span>
                              </button>
                            </div>
                          </div>

                          <!-- Question specifics preview -->
                          @if (q.type === 'grammar-select') {
                            <div style="margin-top:8px; background:white; padding:12px; border-radius:8px; border:1px solid var(--border);">
                              @if (q.grammarTopic) {
                                <div style="display:inline-block; font-size:11px; font-weight:800; color:#4338CA; background:#EEF2FF; padding:2px 8px; border-radius:6px; margin-bottom:6px;">
                                  {{ q.grammarTopic }}
                                </div>
                              }
                              <div style="font-size:13.5px; font-weight:700; color:#1E293B; margin-bottom:8px;">{{ q.promptText }}</div>
                              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:6px;">
                                @for (opt of q.options; track opt) {
                                  <div style="padding:6px 10px; border-radius:6px; font-size:12px; font-weight:600;"
                                       [style.background]="opt === q.correctOption ? '#ECFDF5' : '#F8FAFC'"
                                       [style.color]="opt === q.correctOption ? '#065F46' : '#64748B'"
                                       [style.border]="opt === q.correctOption ? '1px solid #10B981' : '1px solid #E2E8F0'">
                                    {{ opt === q.correctOption ? '✓ ' : '• ' }}{{ opt }}
                                  </div>
                                }
                              </div>
                            </div>
                          } @else if (q.type === 'speak-photo') {
                            <div style="display:flex; align-items:center; gap:14px; margin-top:8px;">
                              <img [src]="q.imageUrl" style="width:110px; height:75px; object-fit:cover; border-radius:8px; border:1px solid var(--border);" alt="Scene preview" />
                              <div style="font-size:12.5px; color:var(--text-secondary);">
                                <div><strong>Description orale :</strong> {{ q.imageCredit }}</div>
                                <div><strong>Objectif :</strong> Expression orale libre et continue en anglais pendant 3 minutes.</div>
                                <div style="color:#4F46E5; font-size:11.5px; margin-top:2px;">Leçon associée : {{ q.sourceLessonTitle }}</div>
                              </div>
                            </div>
                          } @else if (q.type === 'write-photo') {
                            <div style="display:flex; align-items:center; gap:14px; margin-top:8px;">
                              <img [src]="q.imageUrl" style="width:110px; height:75px; object-fit:cover; border-radius:8px; border:1px solid var(--border);" alt="Scene preview" />
                              <div style="font-size:12.5px; color:var(--text-secondary);">
                                <div><strong>Image thématique :</strong> {{ q.imageCredit }}</div>
                                <div><strong>Objectif :</strong> Rédiger au moins {{ q.minWords }} mots pour décrire les actions, personnes et le contexte en 3 minutes.</div>
                                <div style="color:#4F46E5; font-size:11.5px; margin-top:2px;">Leçon associée : {{ q.sourceLessonTitle }}</div>
                              </div>
                            </div>
                          } @else if (q.type === 'read-complete') {
                            <div style="margin-top:8px; background:white; padding:12px; border-radius:8px; border:1px solid var(--border); font-size:13.5px; line-height:1.8;">
                              @for (b of q.blanksData; track $index) {
                                <span>{{ b.prefix }}</span><span style="color:#4F46E5; font-weight:800; border-bottom:2px solid #4F46E5; margin:0 2px;">[{{ b.missing }}]</span>
                              }
                            </div>
                          } @else if (q.type === 'read-select') {
                            <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;">
                              @for (w of q.wordsList; track w.word) {
                                <span [style.background]="w.isReal ? '#ECFDF5' : '#FEF2F2'" [style.color]="w.isReal ? '#065F46' : '#991B1B'" [style.border-color]="w.isReal ? '#A7F3D0' : '#FECACA'" style="font-size:11.5px; font-weight:700; padding:4px 9px; border-radius:6px; border:1px solid;">
                                  {{ w.word }} <span style="font-size:10px; opacity:0.85;">({{ w.isReal ? 'vrai' : 'piège' }})</span>
                                </span>
                              }
                            </div>
                          } @else if (q.type === 'listen-type') {
                            <div style="margin-top:8px; display:flex; align-items:center; gap:10px;">
                              <button type="button" (click)="playQuestionAudio(q.audioText || '', q.audioUrl)" style="border:none; background:#EEF2FF; color:#4F46E5; font-size:12px; font-weight:800; padding:6px 12px; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:6px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>
                                Écouter la dictée audio
                              </button>
                              <span style="font-size:12.5px; font-style:italic; color:var(--text-secondary);">"{{ q.audioText }}"</span>
                            </div>
                          } @else if (q.type === 'read-aloud') {
                            <div style="margin-top:8px; font-size:13px; font-weight:600; color:var(--text-primary); background:white; padding:10px 14px; border-radius:8px; border:1px solid var(--border);">
                              "{{ q.promptText }}"
                            </div>
                          } @else if (q.type === 'read-write') {
                            <div style="margin-top:8px; font-size:13px; color:var(--text-primary); background:white; padding:12px 14px; border-radius:8px; border:1px solid var(--border);">
                              <div><strong>Sujet :</strong> {{ q.promptText }}</div>
                              <div style="margin-top:4px; font-size:11.5px; color:#4F46E5; font-weight:700;">Longueur requise : au moins {{ q.minWords }} mots rédigés en 5 minutes.</div>
                            </div>
                          } @else if (q.type === 'listen-speak') {
                            <div style="margin-top:8px; display:flex; align-items:center; gap:10px;">
                              <button type="button" (click)="playQuestionAudio(q.audioText || '', q.audioUrl)" style="border:none; background:#EEF2FF; color:#4F46E5; font-size:12px; font-weight:800; padding:6px 12px; border-radius:8px; cursor:pointer; display:flex; align-items:center; gap:6px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>
                                Écouter la question d'interview
                              </button>
                              <span style="font-size:12.5px; font-style:italic; color:var(--text-secondary);">"{{ q.audioText }}"</span>
                            </div>
                          }

                          <!-- TEACHER QUESTION EDITING & AUDIO RECORDING DRAWER -->
                          @if (editingQuestionId() === q.id) {
                            <div style="margin-top:14px; padding:16px; background:#FFFFFF; border:2px solid #4F46E5; border-radius:12px; box-shadow:0 6px 18px rgba(79,70,229,0.08); animation:fadeIn 0.2s ease;">
                              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid #E2E8F0; padding-bottom:10px;">
                                <div style="display:flex; align-items:center; gap:8px;">
                                  <span style="background:#4F46E5; color:white; font-size:11px; font-weight:800; padding:3px 8px; border-radius:6px; text-transform:uppercase;">
                                    Mode Personnalisation Enseignant
                                  </span>
                                  <span style="font-size:13px; font-weight:800; color:#1E1B4B;">Épreuve #{{ idx + 1 }} • {{ q.type }}</span>
                                </div>
                                <button type="button" (click)="toggleQuestionEdit(q.id)" style="border:none; background:transparent; color:#64748B; cursor:pointer; font-size:12px; font-weight:700;">
                                  Fermer ✕
                                </button>
                              </div>

                              <div style="display:flex; flex-direction:column; gap:12px;">
                                <!-- Title FR / EN -->
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                                  <div>
                                    <label style="display:block; font-size:11px; font-weight:700; color:#475569; margin-bottom:4px;">Titre / Consigne (FR)</label>
                                    <input type="text" [(ngModel)]="q.titleFr" style="width:100%; padding:8px 10px; font-size:12.5px; border:1px solid #CBD5E1; border-radius:8px; outline:none;" />
                                  </div>
                                  <div>
                                    <label style="display:block; font-size:11px; font-weight:700; color:#475569; margin-bottom:4px;">Titre / Consigne (EN)</label>
                                    <input type="text" [(ngModel)]="q.titleEn" style="width:100%; padding:8px 10px; font-size:12.5px; border:1px solid #CBD5E1; border-radius:8px; outline:none;" />
                                  </div>
                                </div>

                                <!-- Time Limit -->
                                <div style="display:flex; align-items:center; gap:12px;">
                                  <label style="font-size:11.5px; font-weight:700; color:#475569;">Durée de l'épreuve (secondes) :</label>
                                  <input type="number" [(ngModel)]="q.timeLimitSec" min="60" max="600" step="30" style="width:100px; padding:6px 10px; font-size:12.5px; border:1px solid #CBD5E1; border-radius:8px;" />
                                  <span style="font-size:11px; color:#64748B;">Recommandé : min. 180s (3 minutes)</span>
                                </div>

                                <!-- Prompt Text if applicable -->
                                @if (q.promptText !== undefined) {
                                  <div>
                                    <label style="display:block; font-size:11px; font-weight:700; color:#475569; margin-bottom:4px;">Texte ou Sujet de l'épreuve</label>
                                    <textarea [(ngModel)]="q.promptText" rows="2" style="width:100%; padding:8px 10px; font-size:12.5px; border:1px solid #CBD5E1; border-radius:8px; outline:none; font-family:inherit;"></textarea>
                                  </div>
                                }

                                <!-- Audio Text for Listen Questions -->
                                @if (q.audioText !== undefined || q.type === 'listen-type' || q.type === 'listen-speak') {
                                  <div>
                                    <label style="display:block; font-size:11px; font-weight:700; color:#475569; margin-bottom:4px;">
                                      Texte prononcé / dicté aux élèves (Audio)
                                    </label>
                                    <textarea [(ngModel)]="q.audioText" rows="2" placeholder="Ex: Good morning, could you explain the impact of renewable energy in your community?" style="width:100%; padding:8px 10px; font-size:12.5px; border:1px solid #CBD5E1; border-radius:8px; outline:none; font-family:inherit;"></textarea>
                                  </div>
                                }

                                <!-- TEACHER VOICE RECORDING & AUDIO UPLOAD WIDGET -->
                                <div style="background:#F8FAFC; border:1.5px dashed #C7D2FE; border-radius:10px; padding:14px; margin-top:4px;">
                                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                                    <div style="font-size:12px; font-weight:800; color:#4338CA; display:flex; align-items:center; gap:6px;">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                                      Enregistrement Vocal Réel du Professeur (Épreuve Audio)
                                    </div>
                                    @if (q.audioUrl) {
                                      <span style="background:#ECFDF5; color:#047857; font-size:10.5px; font-weight:800; padding:2px 8px; border-radius:12px; border:1px solid #A7F3D0;">
                                        ✓ Audio Professeur Actif
                                      </span>
                                    } @else {
                                      <span style="font-size:10.5px; color:#64748B;">Synthèse vocale par défaut si aucun enregistrement</span>
                                    }
                                  </div>

                                  <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                                    @if (isTeacherRecording() && teacherRecordingQuestionId() === q.id) {
                                      <button
                                        type="button"
                                        (click)="stopTeacherAudioRecording(q)"
                                        style="padding:8px 14px; border:none; border-radius:8px; background:#DC2626; color:white; font-size:12px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:6px; animation:pulse-live 1s infinite;">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                                        <span>Arrêter le micro ({{ teacherRecordedSeconds() }}s)</span>
                                      </button>
                                    } @else {
                                      <button
                                        type="button"
                                        (click)="startTeacherAudioRecording(q)"
                                        style="padding:8px 14px; border:none; border-radius:8px; background:#4F46E5; color:white; font-size:12px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 2px 6px rgba(79,70,229,0.25);">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                                        <span>Enregistrer ma voix avec le micro</span>
                                      </button>

                                      <label style="padding:8px 14px; border:1px solid #CBD5E1; border-radius:8px; background:white; color:#334155; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                        <span>Importer un fichier audio</span>
                                        <input type="file" accept="audio/*" (change)="onTeacherAudioUpload($event, q)" style="display:none;" />
                                      </label>
                                    }

                                    @if (q.audioUrl) {
                                      <button
                                        type="button"
                                        (click)="removeTeacherAudio(q)"
                                        style="padding:8px 12px; border:1px solid #FECACA; border-radius:8px; background:#FEF2F2; color:#DC2626; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:5px;">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                        <span>Supprimer l'audio</span>
                                      </button>
                                    }
                                  </div>

                                  @if (q.audioUrl) {
                                    <div style="margin-top:10px; display:flex; align-items:center; gap:10px;">
                                      <audio controls [src]="q.audioUrl" style="width:100%; height:36px;"></audio>
                                    </div>
                                  }
                                </div>

                                <!-- Grammar Topic and Options if grammar-select -->
                                @if (q.type === 'grammar-select' && q.options) {
                                  <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px;">
                                    <div style="font-size:12px; font-weight:800; color:#334155; margin-bottom:8px;">Options de réponse (Cochez la réponse correcte) :</div>
                                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                                      @for (opt of q.options; track $index; let optIdx = $index) {
                                        <div style="display:flex; align-items:center; gap:8px; background:white; padding:6px 10px; border-radius:8px; border:1px solid #CBD5E1;">
                                          <input
                                            type="radio"
                                            [name]="'correct-' + q.id"
                                            [checked]="q.correctOption === q.options[optIdx]"
                                            (change)="q.correctOption = q.options[optIdx]"
                                            style="accent-color:#10B981; cursor:pointer;"
                                          />
                                          <input
                                            type="text"
                                            [(ngModel)]="q.options[optIdx]"
                                            style="flex:1; border:none; outline:none; font-size:12px; font-weight:600;"
                                          />
                                        </div>
                                      }
                                    </div>
                                  </div>
                                }

                                <!-- Done Button -->
                                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
                                  <button
                                    type="button"
                                    (click)="toggleQuestionEdit(q.id)"
                                    style="padding:8px 16px; border:none; border-radius:8px; background:#4F46E5; color:white; font-size:12px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:6px;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                    <span>Valider les modifications de cette question</span>
                                  </button>
                                </div>

                              </div>
                            </div>
                          }

                        </div>
                      }
                    </div>

                  </div>
                }

              </div>
            }

          </div>
        }

        <!-- STUDENT / GUEST TOP BAR & BANNERS -->
        @if (currentUser()?.role !== 'teacher' && currentUser()?.role !== 'admin') {
          <!-- Top Brand Header -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <img src="logo.png" style="width:36px; height:36px; object-fit:contain; border-radius:8px;" alt="SpeakUp Logo" />
              <div>
                <div style="font-family:'Outfit', sans-serif; font-size:20px; font-weight:800; color:var(--text-primary); line-height:1.2;">
                  Speak<span style="color:#4F46E5;">Up</span>
                  <span style="font-size:14px; font-weight:600; color:var(--text-muted); margin-left:8px;">English Assessment</span>
                </div>
                <p style="margin:2px 0 0 0; font-size:11.5px; color:var(--text-secondary);">
                  {{ t("Tests d'entraînement officiels & Évaluations par compétences", "Official Practice Tests & Subscore Evaluations") }}
                </p>
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:8px;">
              <span class="det-pill-badge">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>{{ t("Échelle SpeakUp 10–160", "SpeakUp Scale 10–160") }}</span>
              </span>
              <span class="det-pill-badge" style="background:#ECFDF5; color:#065F46; border-color:#A7F3D0;">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>CEFR A1–C1</span>
              </span>
            </div>
          </div>

          <!-- Pending & Corrected Banners for Student -->
          @if (currentStudentPendingSubmission(); as myPending) {
            <div style="background:linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%); border:1.5px solid #FDBA74; border-radius:14px; padding:16px 20px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:40px; height:40px; border-radius:50%; background:#EA580C; color:white; display:flex; align-items:center; justify-content:center;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </div>
                <div>
                  <div style="font-size:14.5px; font-weight:800; color:#9A3412;">{{ t('Évaluation en attente de correction par votre professeur', 'Assessment Submitted • Pending Teacher Review') }}</div>
                  <div style="font-size:12px; color:#C2410C;">{{ t('Soumis le', 'Submitted on') }} {{ formatSubmissionDate(myPending.submittedAt) }} • {{ t("Vos vocaux et rédactions sont en cours d'analyse.", "Your oral and written responses are currently under evaluation.") }}</div>
                </div>
              </div>
              <button type="button" (click)="view.set('det-pending')" class="btn-p" style="background:#EA580C; border-color:#EA580C; font-size:12.5px; padding:8px 16px;">
                {{ t('Consulter mon statut', 'View Status') }}
              </button>
            </div>
          }

          @if (currentStudentCorrectedSubmission(); as myCorrected) {
            <div style="background:linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border:1.5px solid #6EE7B7; border-radius:14px; padding:18px 22px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; box-shadow:0 4px 14px rgba(5,150,105,0.12);">
              <div style="display:flex; align-items:center; gap:14px;">
                <img src="logo.png" style="width:48px; height:48px; object-fit:contain; border-radius:10px; background:white; padding:4px; box-shadow:0 2px 8px rgba(0,0,0,0.06);" alt="Logo SpeakUp" />
                <div>
                  <div style="font-size:15px; font-weight:900; color:#065F46; display:flex; align-items:center; gap:6px;">
                    <span>{{ t('Félicitations ! Votre Certificat Officiel SpeakUp a été accordé', 'Congratulations! Your Official SpeakUp Certificate has been Awarded') }}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#059669"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  </div>
                  <div style="font-size:12.5px; color:#047857; margin-top:2px;">{{ t('Score certifié', 'Certified Score') }} : <strong>{{ myCorrected.overallScore }}/160</strong> • {{ t('Niveau CECRL', 'CEFR Level') }} <strong>{{ myCorrected.cefrLevel }}</strong> • {{ t('Accordé et certifié par', 'Evaluated & Endorsed by') }} <strong>{{ myCorrected.gradedBy || 'SpeakUp Faculty' }}</strong>.</div>
                </div>
              </div>
              <button type="button" (click)="viewMyCorrectedCertificate(myCorrected)" class="btn-p" style="background:linear-gradient(135deg, #059669 0%, #047857 100%); border:none; font-size:13px; font-weight:800; padding:10px 20px; display:flex; align-items:center; gap:8px; box-shadow:0 4px 12px rgba(5,150,105,0.25);">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                <span>{{ t('Voir & Télécharger mon Certificat', 'View & Download My Certificate') }}</span>
              </button>
            </div>
          }
        }

        <!-- PRACTICE MODULES & TEST SIMULATOR (VISIBLE FOR STUDENTS, AND FOR TEACHERS IN PREVIEW MODE) -->
        @if ((currentUser()?.role !== 'teacher' && currentUser()?.role !== 'admin') || teacherModeTab() === 'preview') {

          <!-- OFFICIAL EXAM SESSION HERO CARD (1 WEEK AVAILABILITY WINDOW: 11/08/2026 - 18/08/2026) -->
          @if (!currentStudentPendingSubmission() && !currentStudentCorrectedSubmission()) {
            <div class="official-session-card">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:20px;">
                <div style="max-width:580px;">
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px; flex-wrap:wrap;">
                    <span class="official-badge-pulse">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      SESSION OFFICIELLE (1 SEMAINE)
                    </span>
                    <span style="font-size:12px; font-weight:800; color:#4338CA; background:#EEF2FF; padding:3px 10px; border-radius:20px; border:1px solid #C7D2FE; display:inline-flex; align-items:center; gap:5px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      Période : 11/08/2026 – 18/08/2026
                    </span>
                  </div>

                  <h2 style="font-size:24px; font-weight:900; color:#1E1B4B; margin:0 0 10px 0; line-height:1.25;">
                    Examen Officiel SpeakUp English Assessment (SET)
                  </h2>
                  <p style="font-size:13.5px; color:#334155; margin:0 0 16px 0; line-height:1.6;">
                    La session d'examen officielle est ouverte pour une durée d'<strong>une semaine</strong> (accès libre 24h/24). Vous pouvez débuter votre test au moment de votre choix. 
                    <strong style="color:#C2410C;">Important :</strong> une fois commencé, vous êtes <strong>obligé(e) de le terminer d'une seule traite</strong> (~15 à 20 minutes) sous surveillance anti-triche active.
                  </p>

                  <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:20px;">
                    <span class="session-chip">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      Durée : ~60 min (20 épreuves • Chronomètres min. 3 min / question)
                    </span>
                    <span class="session-chip">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      Mode Anti-Triche Plein Écran
                    </span>
                    <span class="session-chip">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                      Correction & Certificat Officiel CEFR
                    </span>
                  </div>

                  <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                    <button type="button" class="official-start-btn" (click)="openPreExamBriefing()">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      <span>{{ t('Passer mon Examen Officiel', 'Start Official Examination') }}</span>
                    </button>
                    <button type="button" class="btn-s" (click)="showStudentExamAnnouncementModal.set(true)" style="background:white; border:1.5px solid #C7D2FE; color:#4338CA; font-size:13px; font-weight:800; padding:12px 18px; border-radius:12px; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                      <span>{{ t('Consulter les Consignes & Modalités', 'View Announcement & Rules') }}</span>
                    </button>
                    <span style="font-size:12px; color:#64748B; font-weight:600; display:inline-flex; align-items:center; gap:5px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      Accès libre 24h/24 pendant 7 jours
                    </span>
                  </div>
                </div>

                <div class="official-session-badge-box">
                  <div style="width:70px; height:70px; border-radius:50%; background:linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color:white; display:flex; align-items:center; justify-content:center; margin:0 auto 12px auto; box-shadow:0 8px 20px rgba(79,70,229,0.3);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  </div>
                  <div style="font-size:13px; font-weight:900; color:#1E1B4B; text-align:center;">SESSION CERTIFIANTE</div>
                  <div style="font-size:11px; color:#4F46E5; font-weight:800; text-align:center; margin-top:2px;">7 jours pour participer</div>
                  <div style="font-size:10.5px; color:#64748B; text-align:center; margin-top:6px; line-height:1.4;">
                    11/08/2026 au 18/08/2026
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Hero Practice Banner (Image 2 Top) -->
          <div class="det-hero-card">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:20px;">
              <div style="max-width:540px;">
                <span class="det-badge-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  {{ t("ÉVALUATION D'ENTRAÎNEMENT", "FREE PRACTICE ASSESSMENT") }}
                </span>
                <h2 style="font-size:22px; font-weight:800; color:#1E1B4B; margin:10px 0 8px 0; line-height:1.25;">
                  {{ t("Pratiquez autant que vous le souhaitez avec notre test gratuit", "Practice as much as you like with our free sample test") }}
                </h2>
                <p style="font-size:13px; color:#475569; margin:0 0 18px 0; line-height:1.5;">
                  {{ t("Familiarisez-vous avec les formats réels d'évaluation du SpeakUp English Assessment : description d'image en 1 minute, dictée, compréhension, et expression orale.", "Get familiar with the real SpeakUp English Assessment question formats: 1-minute photo description, listen & type, read & complete, and speaking fluency.") }}
                </p>
                <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                  <button class="det-cta-btn" (click)="openPreExamBriefing()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    <span>{{ t("COMMENCER L'ÉVALUATION (15 MIN)", "START ASSESSMENT (15 MIN)") }}</span>
                  </button>
                  <span style="font-size:11.5px; color:#64748B; font-weight:600;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg> {{ t("Questions aléatoires & illimitées", "Unlimited random questions") }}
                  </span>
                </div>
              </div>

              <!-- Illustration / Decorative badge -->
              <div class="det-hero-illustration">
                <div style="width:110px; height:110px; border-radius:50%; background:linear-gradient(135deg, #EEF2FF 0%, #C7D2FE 100%); display:flex; align-items:center; justify-content:center; box-shadow:0 8px 24px rgba(79,70,229,0.15);">
                  <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                </div>
                <div class="det-subscore-mini">
                  <span style="font-size:9.5px; font-weight:700; color:#4F46E5; text-transform:uppercase;">Score Estimé</span>
                  <span style="font-size:16px; font-weight:900; color:#1E1B4B;">110–125</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Subscore Category Tabs (Image 2) -->
          <div style="margin-top:28px; margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
              <div>
                <h3 style="font-size:16px; font-weight:800; color:var(--text-primary); margin:0;">
                  {{ t("S'entraîner par type d'épreuve", "Practice by Question Type") }}
                </h3>
                <p style="font-size:12px; color:var(--text-muted); margin:2px 0 0 0;">
                  {{ t("Sélectionnez une compétence spécifique pour vous perfectionner à votre rythme.", "Select a specific subscore skill to practice at your own pace.") }}
                </p>
              </div>
            </div>

            <!-- Tab Pills -->
            <div class="det-filter-bar">
              <button class="det-filter-chip" [class.active]="activeSubscoreFilter() === 'all'" (click)="activeSubscoreFilter.set('all')">
                {{ t("Tous les types", "All") }}
              </button>
              <button class="det-filter-chip" [class.active]="activeSubscoreFilter() === 'literacy'" (click)="activeSubscoreFilter.set('literacy')">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>
                <span>{{ t("Compréhension écrite (Literacy)", "Literacy") }}</span>
              </button>
              <button class="det-filter-chip" [class.active]="activeSubscoreFilter() === 'comprehension'" (click)="activeSubscoreFilter.set('comprehension')">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
                <span>{{ t("Compréhension orale (Comprehension)", "Comprehension") }}</span>
              </button>
              <button class="det-filter-chip" [class.active]="activeSubscoreFilter() === 'production'" (click)="activeSubscoreFilter.set('production')">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                <span>{{ t("Production écrite (Production)", "Production") }}</span>
              </button>
              <button class="det-filter-chip" [class.active]="activeSubscoreFilter() === 'conversation'" (click)="activeSubscoreFilter.set('conversation')">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                <span>{{ t("Production orale (Conversation)", "Conversation") }}</span>
              </button>
              <button class="det-filter-chip" [class.active]="activeSubscoreFilter() === 'official'" (click)="activeSubscoreFilter.set('official')">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                <span>{{ t("Examens de mon professeur", "Teacher Exams") }} ({{ examQuizzes().length }})</span>
              </button>
            </div>
          </div>

          <!-- QUESTION MODULES GRID (Matches Image 2 Grid) -->
          @if (activeSubscoreFilter() !== 'official') {
            <div class="det-grid">
              @for (module of filteredModules(); track module.id) {
                <div class="det-module-card" (click)="startSingleModulePractice(module)">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                    <div class="det-icon-box" [style.background]="getModuleBg(module.subscore)" [style.color]="getModuleColor(module.subscore)">
                      @switch (module.type) {
                        @case ('write-photo') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        }
                        @case ('speak-photo') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                        }
                        @case ('read-complete') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        }
                        @case ('read-select') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                        }
                        @case ('listen-type') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>
                        }
                        @case ('read-aloud') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                        }
                        @case ('read-write') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        }
                        @case ('listen-speak') {
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1s-1-.45-1-1v-2.34"/><path d="M16 14.66V17c0 .55-.45 1-1 1s-1-.45-1-1v-2.34"/></svg>
                        }
                      }
                    </div>

                    <div style="display:flex; align-items:center; gap:6px;">
                      <span class="det-time-badge">
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span>{{ formatSec(module.timeLimitSec) }}</span>
                      </span>
                    </div>
                  </div>

                  <h4 style="font-size:14px; font-weight:800; color:var(--text-primary); margin:0 0 4px 0;">
                    {{ t(module.titleFr, module.titleEn) }}
                  </h4>

                  <p style="font-size:11.5px; color:var(--text-secondary); margin:0 0 14px 0; line-height:1.4; min-height:32px;">
                    {{ getModuleDescription(module) }}
                  </p>

                  <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-weak); padding-top:10px; margin-top:auto;">
                    <span style="font-size:10.5px; font-weight:700; text-transform:uppercase; color:#6B7280;">
                      {{ getSubscoreLabel(module.subscore) }}
                    </span>
                    <span style="font-size:12px; font-weight:700; color:#4F46E5; display:flex; align-items:center; gap:4px;">
                      {{ t("S'entraîner", "Practice") }} <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </span>
                  </div>
                </div>
              }
            </div>
          } @else {
            <!-- Official Teacher Quizzes List -->
            <div style="display:flex; flex-direction:column; gap:12px;">
              @if (examQuizzes().length === 0) {
                <div style="text-align:center; padding:48px 20px; border:1px dashed var(--border); border-radius:12px; background:var(--surface-1)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.8" style="margin-bottom:10px;"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                  <p style="font-size:14px; font-weight:700; color:var(--text-primary); margin:0 0 4px 0;">{{ t("Aucun examen officiel programmé", "No official exam scheduled") }}</p>
                  <p style="font-size:12px; color:var(--text-muted); margin:0;">{{ t("Votre professeur n'a pas encore publié d'examen pour votre classe.", "Your teacher has not published an official exam for your class yet.") }}</p>
                </div>
              }

              @for (quiz of examQuizzes(); track quiz.id) {
                <div class="exam-card" [class.attempted]="hasAttempted(quiz.id)">
                  <div style="display:flex; align-items:center; gap:14px;">
                    <div style="width:44px; height:44px; border-radius:12px; background:{{ hasAttempted(quiz.id) ? '#D1FAE5' : 'linear-gradient(135deg,#4F46E5,#7C3AED)' }}; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                      @if (hasAttempted(quiz.id)) {
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      } @else {
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                      }
                    </div>
                    <div style="flex:1;">
                      <h3 style="font-size:14px; font-weight:700; color:var(--text-primary); margin:0 0 4px;">{{ quiz.title }}</h3>
                      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                        <span class="exam-badge"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:3px"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {{ quiz.timeLimit }}</span>
                        <span class="exam-badge"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:3px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> {{ quiz.questions.length }} questions</span>
                        <span class="exam-badge"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="vertical-align:middle; margin-right:3px"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> {{ quiz.level || 'B1' }}</span>
                      </div>
                    </div>
                    <div>
                      @if (hasAttempted(quiz.id)) {
                        <div style="text-align:center;">
                          <div class="attempt-result" [class]="getAttemptGrade(quiz.id)">
                            {{ getAttemptScore(quiz.id) }}%
                          </div>
                          <div style="font-size:9px; color:var(--text-muted); margin-top:2px;">{{ t("Complété", "Completed") }}</div>
                        </div>
                      } @else {
                        <button class="btn-p" style="padding:8px 18px; font-size:12.5px; background:#4F46E5; border:none;" (click)="startTeacherExam(quiz)">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="vertical-align:middle; margin-right:4px"><polygon points="5 3 19 12 5 21 5 3"/></svg> {{ t("Passer l'examen", "Take Exam") }}
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- Past Test Attempts & Subscore Breakdown -->
          @if (myAttempts().length > 0) {
            <div style="margin-top:32px;">
              <div class="st" style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
                <span>{{ t("Mes derniers résultats d'évaluation", "My Test & Subscore Results") }}</span>
              </div>

              <div style="display:flex; flex-direction:column; gap:8px;">
                @for (att of myAttempts(); track att.id) {
                  <div class="card" style="padding:14px 18px; border-left:4px solid {{ att.passed ? '#059669' : '#EF4444' }}; display:flex; align-items:center; gap:14px; border-radius:10px;">
                    <div style="flex:1;">
                      <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:13.5px; font-weight:800; color:var(--text-primary);">{{ att.quizTitle }}</span>
                        <span class="badge" style="font-size:9.5px; padding:2px 6px; border-radius:4px; font-weight:700; background:#EEF2FF; color:#4F46E5;">
                          {{ att.percentage >= 80 ? 'C1 Avancé' : (att.percentage >= 65 ? 'B2 Intermédiaire Sup.' : (att.percentage >= 50 ? 'B1 Intermédiaire' : 'A2 Élémentaire')) }}
                        </span>
                      </div>
                      <div style="font-size:11px; color:var(--text-muted); margin-top:3px;">
                        {{ att.completedAt | date:'d MMMM yyyy, HH:mm' }} · {{ formatDuration(att.timeTakenSeconds) }}
                      </div>
                    </div>

                    <div style="text-align:right;">
                      <div style="font-size:18px; font-weight:900; color:{{ att.passed ? '#059669' : '#EF4444' }};">
                        {{ Math.round(10 + (att.percentage / 100) * 150) }} <span style="font-size:11px; font-weight:600; color:#64748B;">/ 160</span>
                      </div>
                      <span class="pill" [class]="att.passed ? 'g' : 'r'" style="font-size:9.5px; padding:2px 8px; font-weight:700;">
                        {{ att.passed ? t('Réussi', 'Passed') : t('Échoué', 'Failed') }}
                      </span>
                    </div>

                                        <button class="btn-s" style="font-size:11px; padding:5px 12px; display:inline-flex; align-items:center; gap:4px;" (click)="printResult(att)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                      PDF
                    </button>
                  </div>
                }
              </div>
            </div>
          }
        } <!-- End of Practice Simulator -->

        </div>
      }


      <!-- ======================================================== -->
      <!-- 2. SPEAKUP ASSESSMENT ACTIVE SESSION                     -->
      <!-- ======================================================== -->
      @if (view() === 'det-test' && currentDetQuestion(); as q) {
        <div class="det-test-container">

          <!-- Main White Test Card (Exact styling from Image 1) -->
          <div class="det-question-modal">

            <!-- Card Top Header (Timer on left, Close on right) -->
            <div class="det-modal-topbar">
              <div class="det-timer-pill" [class.urgent]="detTimeLeft() < 15">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>{{ formatDetTimer(detTimeLeft()) }} {{ t("pour cette question", "for this question") }}</span>
              </div>

              <!-- Question Counter in Full Test mode -->
              @if (isFullTestMode()) {
                <div style="display:flex; align-items:center; gap:10px;">
                  <div style="font-size:11.5px; font-weight:700; color:#6B7280; letter-spacing:0.3px;">
                    Question {{ currentDetIndex() + 1 }} / {{ detTestSequence().length }}
                  </div>
                  @if (isOfficialExam()) {
                    <div style="display:inline-flex; align-items:center; gap:5px; background:#FEF2F2; color:#991B1B; border:1px solid #FECACA; padding:2px 8px; border-radius:12px; font-size:10.5px; font-weight:800;">
                      <span style="width:6px; height:6px; border-radius:50%; background:#DC2626; animation:pulse-live 1.2s infinite;"></span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      <span>Surveillance Anti-Triche Active</span>
                    </div>
                  }
                </div>
              }

              <!-- Close Button -->
              <button class="det-close-btn" (click)="confirmExitTest()" [title]="t('Quitter le test', 'Exit test')">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <!-- Question Prompt Title (e.g. Write a description of the image below for 1 minute) -->
            <h2 class="det-prompt-title">
              {{ t(q.titleFr, q.titleEn) }}
            </h2>


            <!-- ====================================================== -->
            <!-- QUESTION TYPE 0: GRAMMAR MULTIPLE CHOICE (3 MIN TIMER) -->
            <!-- ====================================================== -->
            @if (q.type === 'grammar-select') {
              <div style="display:flex; flex-direction:column; gap:20px; max-width:680px; margin:0 auto; width:100%;">
                @if (q.grammarTopic) {
                  <div style="display:inline-flex; align-items:center; gap:6px; background:#EEF2FF; color:#4338CA; border:1px solid #C7D2FE; border-radius:8px; padding:4px 12px; font-size:12px; font-weight:800; align-self:flex-start;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    <span>Grammaire CEFR {{ q.targetLevel || 'A2-B2' }} • {{ q.grammarTopic }}</span>
                  </div>
                }

                <div style="background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:12px; padding:22px; font-size:17px; font-weight:700; color:#1E293B; line-height:1.6;">
                  {{ q.promptText }}
                </div>

                <div style="display:flex; flex-direction:column; gap:10px;">
                  @for (opt of q.options; track opt; let optIdx = $index) {
                    <button
                      type="button"
                      class="det-grammar-option"
                      [class.selected]="currentTextAnswer === opt"
                      (click)="currentTextAnswer = opt; onTextInputChange()"
                      style="display:flex; align-items:center; gap:12px; padding:14px 18px; border-radius:10px; border:2px solid; text-align:left; font-size:14.5px; font-weight:700; cursor:pointer; transition:all 0.15s ease;"
                      [style.border-color]="currentTextAnswer === opt ? '#4F46E5' : '#E2E8F0'"
                      [style.background]="currentTextAnswer === opt ? '#EEF2FF' : 'white'"
                      [style.color]="currentTextAnswer === opt ? '#312E81' : '#1E293B'">
                      <span style="width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12.5px; font-weight:800;"
                            [style.background]="currentTextAnswer === opt ? '#4F46E5' : '#F1F5F9'"
                            [style.color]="currentTextAnswer === opt ? 'white' : '#64748B'">
                        {{ ['A', 'B', 'C', 'D'][optIdx] || (optIdx + 1) }}
                      </span>
                      <span style="flex:1;">{{ opt }}</span>
                      @if (currentTextAnswer === opt) {
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                      }
                    </button>
                  }
                </div>
              </div>
            }

            <!-- ====================================================== -->
            <!-- QUESTION TYPE A: WRITE ABOUT THE PHOTO                 -->
            <!-- ====================================================== -->
            @else if (q.type === 'write-photo') {
              <div class="det-two-column-layout">
                <!-- Left: Photo Image -->
                <div class="det-photo-column">
                  <div class="det-image-wrapper">
                    <img [src]="q.imageUrl" class="det-photo-img" alt="Photo to describe" />
                  </div>
                  @if (q.imageCredit) {
                    <div class="det-photo-credit">{{ q.imageCredit }}</div>
                  }
                </div>

                <!-- Right: Clean Textarea Input -->
                <div class="det-response-column">
                  <textarea
                    [(ngModel)]="currentTextAnswer"
                    (input)="onTextInputChange()"
                    class="det-textarea"
                    [placeholder]="t('Votre réponse...', 'Your response')"
                    rows="8"
                    autofocus>
                  </textarea>

                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px; font-size:11px; color:#6B7280;">
                    <span>{{ getWordCount(currentTextAnswer) }} {{ t("mots saisis", "words typed") }}</span>
                    <span>{{ t("Min. recommandé : 20 mots", "Recommended: 20+ words") }}</span>
                  </div>
                </div>
              </div>
            }


            <!-- ====================================================== -->
            <!-- QUESTION TYPE B: SPEAK ABOUT THE PHOTO                  -->
            <!-- ====================================================== -->
            @else if (q.type === 'speak-photo') {
              <div class="det-two-column-layout">
                <!-- Left: Photo Image -->
                <div class="det-photo-column">
                  <div class="det-image-wrapper">
                    <img [src]="q.imageUrl" class="det-photo-img" alt="Photo to speak about" />
                  </div>
                  @if (q.imageCredit) {
                    <div class="det-photo-credit">{{ q.imageCredit }}</div>
                  }
                </div>

                <!-- Right: Audio Recorder & Speaking visualizer -->
                <div class="det-response-column" style="display:flex; flex-direction:column; justify-content:center; align-items:center; background:#F8FAFC; border:1.5px dashed #CBD5E1; border-radius:12px; padding:24px; text-align:center;">
                  
                  <div style="font-size:13px; font-weight:700; color:#1E293B; margin-bottom:12px;">
                    {{ isRecording() ? t("Enregistrement en cours...", "Recording your voice...") : (recordedAudioUrl ? t("Enregistrement validé", "Voice recorded successfully") : t("Cliquez sur le micro et commencez à parler", "Click the mic and speak in English")) }}
                  </div>

                  <!-- Waveform visualizer bars -->
                  <div style="display:flex; align-items:center; gap:4px; height:32px; margin-bottom:16px;">
                    @for (b of [1,2,3,4,5,6,7,8]; track b) {
                      <div class="det-audio-bar" [class.recording]="isRecording()" [style.animation-delay]="(b * 0.12) + 's'"></div>
                    }
                  </div>

                  <!-- Mic Button -->
                  <button 
                    (click)="toggleAudioRecording()"
                    class="det-mic-record-btn"
                    [class.recording]="isRecording()">
                    @if (isRecording()) {
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                    }
                  </button>

                  <div style="font-size:12px; font-weight:700; color:#475569; margin-top:10px;">
                    {{ isRecording() ? (recordedSeconds() + 's / 180s') : (recordedAudioUrl ? t("Cliquez sur Suivant pour valider", "Click Submit to proceed") : t("Parlez pendant au moins 30 secondes", "Speak for at least 30 seconds")) }}
                  </div>

                  @if (recordedAudioUrl) {
                    <div style="margin-top:14px; width:100%; max-width:280px;">
                      <audio controls [src]="recordedAudioUrl" style="width:100%; height:36px;"></audio>
                    </div>
                  }
                </div>
              </div>
            }


            <!-- ====================================================== -->
            <!-- QUESTION TYPE C: READ AND COMPLETE (FILL-IN LETTERS)   -->
            <!-- ====================================================== -->
            @else if (q.type === 'read-complete') {
              <div style="background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:12px; padding:24px; line-height:2.2; font-size:16px; color:#1E293B;">
                @for (item of q.blanksData; track $index; let bi = $index) {
                  <span style="font-weight:600;">{{ item.prefix }}</span>
                  <input
                    type="text"
                    [maxLength]="item.missing.length"
                    [(ngModel)]="blankInputs[bi]"
                    (input)="onBlankInputChange(bi, item.missing.length)"
                    [id]="'blank-' + bi"
                    class="det-inline-blank-input"
                    [style.width]="(item.missing.length * 15 + 16) + 'px'"
                  />
                  <span> </span>
                }
              </div>
              <p style="font-size:12px; color:#6B7280; margin-top:12px; text-align:center;">
                {{ t("Saisissez les lettres manquantes pour chaque mot incomplet.", "Type the missing letters to complete each word in the passage.") }}
              </p>
            }


            <!-- ====================================================== -->
            <!-- QUESTION TYPE D: READ AND SELECT (REAL ENGLISH WORDS)  -->
            <!-- ====================================================== -->
            @else if (q.type === 'read-select') {
              <div class="det-words-grid">
                @for (w of q.wordsList; track w.word) {
                  <button 
                    class="det-word-chip" 
                    [class.selected]="selectedWordSet.has(w.word)"
                    (click)="toggleWordSelection(w.word)">
                    <span class="det-chip-checkbox">
                      @if (selectedWordSet.has(w.word)) {
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                      }
                    </span>
                    <span style="font-size:14.5px; font-weight:700;">{{ w.word }}</span>
                  </button>
                }
              </div>
              <div style="font-size:12px; color:#6B7280; margin-top:14px; text-align:center;">
                {{ selectedWordSet.size }} {{ t("mots sélectionnés", "words selected") }}
              </div>
            }


            <!-- ====================================================== -->
            <!-- QUESTION TYPE E: LISTEN AND TYPE (AUDIO DICTATION)     -->
            <!-- ====================================================== -->
            @else if (q.type === 'listen-type') {
              <div style="display:flex; flex-direction:column; align-items:center; gap:20px; padding:20px 0;">
                <button class="det-audio-play-btn" [disabled]="audioPlayCount() >= 3" (click)="playQuestionAudio(q.audioText || '', q.audioUrl)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                </button>
                <div style="font-size:12px; font-weight:700; color:#4F46E5;">
                  {{ audioPlayCount() }} / 3 {{ t("écoutes utilisées", "plays used") }}
                </div>

                <div style="width:100%; max-width:600px;">
                  <textarea
                    [(ngModel)]="currentTextAnswer"
                    class="det-textarea"
                    [placeholder]="t('Tapez exactement ce que vous entendez...', 'Type the statement that you hear...')"
                    rows="4"
                    autofocus>
                  </textarea>
                </div>
              </div>
            }


            <!-- ====================================================== -->
            <!-- QUESTION TYPE F: READ ALOUD                             -->
            <!-- ====================================================== -->
            @else if (q.type === 'read-aloud') {
              <div style="display:flex; flex-direction:column; align-items:center; gap:20px; padding:16px 0; text-align:center;">
                <div style="background:#EEF2FF; border:1px solid #C7D2FE; border-radius:12px; padding:20px; width:100%; max-width:640px;">
                  <p style="font-size:18px; font-weight:800; color:#1E1B4B; line-height:1.5; margin:0;">
                    “{{ q.promptText }}”
                  </p>
                </div>

                <button 
                  (click)="toggleAudioRecording()"
                  class="det-mic-record-btn"
                  [class.recording]="isRecording()">
                  @if (isRecording()) {
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                  }
                </button>

                <div style="font-size:12.5px; font-weight:700; color:#475569;">
                  {{ isRecording() ? (recordedSeconds() + 's / 180s - ' + t("Enregistrement en cours...", "Recording...")) : (recordedAudioUrl ? t("Enregistré avec succès !", "Recorded!") : t("Appuyez sur le micro pour lire à haute voix", "Press to read aloud")) }}
                </div>

                @if (recordedAudioUrl) {
                  <div style="margin-top:14px; width:100%; max-width:280px; display:flex; flex-direction:column; align-items:center; gap:6px;">
                    <audio controls [src]="recordedAudioUrl" style="width:100%; height:36px;"></audio>
                    <button type="button" (click)="reRecordAudio()" style="border:none; background:transparent; color:#6366F1; font-size:11.5px; font-weight:700; cursor:pointer; text-decoration:underline;">
                      {{ t("Réenregistrer ma réponse", "Re-record audio") }}
                    </button>
                  </div>
                }
              </div>
            }


            <!-- ====================================================== -->
            <!-- QUESTION TYPE G: READ, THEN WRITE (EXTENDED WRITING)   -->
            <!-- ====================================================== -->
            @else if (q.type === 'read-write') {
              <div style="display:flex; flex-direction:column; gap:16px;">
                <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:18px;">
                  <p style="font-size:15px; font-weight:700; color:#1E1B4B; line-height:1.5; margin:0;">
                    {{ q.promptText }}
                  </p>
                </div>

                <textarea
                  [(ngModel)]="currentTextAnswer"
                  class="det-textarea"
                  [placeholder]="t('Rédigez votre réponse détaillée ici...', 'Write your extended response here...')"
                  rows="7"
                  autofocus>
                </textarea>

                <div style="display:flex; justify-content:space-between; align-items:center; font-size:11.5px; color:#64748B;">
                  <span [style.color]="getWordCount(currentTextAnswer) >= (q.minWords || 50) ? '#059669' : '#D97706'" style="font-weight:700;">
                    {{ getWordCount(currentTextAnswer) }} / {{ q.minWords || 50 }} {{ t("mots requis", "words required") }}
                  </span>
                  <span>{{ t("Développez votre argumentation", "Provide detailed arguments") }}</span>
                </div>
              </div>
            }


            <!-- ====================================================== -->
            <!-- QUESTION TYPE H: LISTEN, THEN SPEAK                    -->
            <!-- ====================================================== -->
            @else if (q.type === 'listen-speak') {
              <div style="display:flex; flex-direction:column; align-items:center; gap:20px; padding:20px 0; text-align:center;">
                <button class="det-audio-play-btn" [disabled]="audioPlayCount() >= 3" (click)="playQuestionAudio(q.audioText || '', q.audioUrl)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                </button>
                <div style="font-size:12px; font-weight:700; color:#4F46E5;">
                  {{ audioPlayCount() }} / 3 {{ t("écoutes de la question", "plays of question") }}
                </div>

                <div style="margin-top:10px;">
                  <button 
                    (click)="toggleAudioRecording()"
                    class="det-mic-record-btn"
                    [class.recording]="isRecording()">
                    @if (isRecording()) {
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                    }
                  </button>
                </div>

                <div style="font-size:12.5px; font-weight:700; color:#475569;">
                  {{ isRecording() ? (recordedSeconds() + 's / 180s') : (recordedAudioUrl ? t("Enregistrement validé", "Voice recorded") : t("Appuyez pour répondre oralement", "Press to speak your response")) }}
                </div>

                @if (recordedAudioUrl) {
                  <div style="margin-top:14px; width:100%; max-width:280px; display:flex; flex-direction:column; align-items:center; gap:6px;">
                    <audio controls [src]="recordedAudioUrl" style="width:100%; height:36px;"></audio>
                    <button type="button" (click)="reRecordAudio()" style="border:none; background:transparent; color:#6366F1; font-size:11.5px; font-weight:700; cursor:pointer; text-decoration:underline;">
                      {{ t("Réenregistrer ma réponse", "Re-record audio") }}
                    </button>
                  </div>
                }
              </div>
            }


            <!-- Card Bottom Bar: SUBMIT Button (Exact style from Image 1) -->
            <div class="det-modal-bottombar">
              <button
                class="det-submit-btn"
                [disabled]="!isCurrentQuestionAnswered()"
                (click)="submitCurrentDetQuestion()">
                {{ isLastQuestion() ? t("SOUMETTRE", "SUBMIT") : t("SUIVANT", "NEXT") }}
              </button>
            </div>

          </div>
        </div>
      }


      <!-- ======================================================== -->
      <!-- 3. SPEAKUP ASSESSMENT SCORE REPORT & CERTIFICATE         -->
      <!-- ======================================================== -->
      
      <!-- ======================================================== -->
      <!-- 2.5 STUDENT PENDING CORRECTION SCREEN                    -->
      <!-- ======================================================== -->
      @if (view() === 'det-pending') {
        <div style="animation: fadeIn 0.3s ease; max-width:800px; margin:0 auto; padding:20px 0;">
          
          <div style="background:white; border-radius:18px; border:1.5px solid #FED7AA; box-shadow:0 10px 30px rgba(234, 88, 12, 0.08); overflow:hidden;">
            
            <!-- Banner Header -->
            <div style="background:linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%); padding:28px 24px; text-align:center; border-bottom:1px solid #FED7AA;">
              <div style="width:68px; height:68px; border-radius:50%; background:#EA580C; color:white; display:flex; align-items:center; justify-content:center; margin:0 auto 16px auto; box-shadow:0 6px 18px rgba(234, 88, 12, 0.35);">
                <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <h3 style="font-size:22px; font-weight:900; color:#9A3412; margin:0 0 8px 0;">{{ t('Évaluation Soumise avec Succès !', 'Assessment Submitted Successfully!') }}</h3>
              <p style="font-size:13.5px; color:#C2410C; max-width:540px; margin:0 auto; line-height:1.5;">
                {{ t("Votre dossier a été transmis à votre professeur. Vos enregistrements oraux et vos rédactions écrites sont en cours d'évaluation pédagogique.", "Your assessment has been submitted to your instructor. Your oral recordings and written answers are currently being evaluated.") }}
              </p>
            </div>

            <!-- Steps Progress Tracker -->
            <div style="padding:24px; border-bottom:1px solid #F1F5F9;">
              <div style="display:flex; justify-content:space-between; position:relative; max-width:550px; margin:0 auto;">
                <!-- Step 1 -->
                <div style="text-align:center; position:relative; z-index:2;">
                  <div style="width:36px; height:36px; border-radius:50%; background:#10B981; color:white; display:flex; align-items:center; justify-content:center; margin:0 auto 6px auto;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8"><polyline points="20 6 9 17 4 12"/></svg></div>
                  <div style="font-size:12px; font-weight:800; color:#1E293B;">{{ t('Épreuve passée', 'Completed') }}</div>
                  <div style="font-size:10.5px; color:#64748B;">7 questions</div>
                </div>

                <!-- Step 2 -->
                <div style="text-align:center; position:relative; z-index:2;">
                  <div style="width:36px; height:36px; border-radius:50%; background:#EA580C; color:white; display:flex; align-items:center; justify-content:center; margin:0 auto 6px auto; font-weight:800; animation: pulse-live 1.5s infinite;">⏳</div>
                  <div style="font-size:12px; font-weight:800; color:#EA580C;">{{ t('En correction', 'Under Review') }}</div>
                  <div style="font-size:10.5px; color:#64748B;">{{ t('Professeur', 'Faculty Review') }}</div>
                </div>

                <!-- Step 3 -->
                <div style="text-align:center; position:relative; z-index:2;">
                  <div style="width:36px; height:36px; border-radius:50%; background:#E2E8F0; color:#94A3B8; display:flex; align-items:center; justify-content:center; margin:0 auto 6px auto;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg></div>
                  <div style="font-size:12px; font-weight:800; color:#64748B;">{{ t('Certificat délivré', 'Certificate Awarded') }}</div>
                  <div style="font-size:10.5px; color:#94A3B8;">10–160 SET</div>
                </div>
              </div>
            </div>

            <!-- Dossier Summary Content -->
            @if (currentStudentPendingSubmission(); as mySub) {
              <div style="padding:24px;">
                <h4 style="font-size:14px; font-weight:800; color:#1E1B4B; margin:0 0 14px 0;">{{ t('Contenu de votre dossier transmis :', 'Submitted Dossier Contents:') }}</h4>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:20px;">
                  <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px;">
                    <div style="font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase;">{{ t("Date d'envoi", "Submission Date") }}</div>
                    <div style="font-size:14px; font-weight:800; color:#1E1B4B; margin-top:2px;">{{ formatSubmissionDate(mySub.submittedAt) }}</div>
                  </div>
                  <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px;">
                    <div style="font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase;">{{ t('Enregistrements oraux', 'Oral Audio Recordings') }}</div>
                    <div style="font-size:14px; font-weight:800; color:#4F46E5; margin-top:2px; display:flex; align-items:center; gap:6px;"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg><span>{{ getAudioQuestionsCount(mySub) }} enregistrements</span></div>
                  </div>
                  <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:12px;">
                    <div style="font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase;">{{ t('Écrits & Rédactions', 'Written Essays & Prompts') }}</div>
                    <div style="font-size:14px; font-weight:800; color:#059669; margin-top:2px; display:flex; align-items:center; gap:6px;"><svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg><span>{{ getWrittenQuestionsCount(mySub) }} rédactions</span></div>
                  </div>
                </div>

                <div style="background:#EFF6FF; border:1px solid #BFDBFE; border-radius:10px; padding:14px; display:flex; align-items:center; gap:12px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <span style="font-size:12.5px; color:#1E40AF; line-height:1.4;">
                    {{ t("Vous recevrez une notification instantanée dès que votre professeur aura attribué vos points et rédigé ses commentaires détaillés.", "You will be notified immediately once your instructor reviews your work, grades each module, and awards your official certificate.") }}
                  </span>
                </div>
              </div>
            }

            <!-- Footer Action -->
            <div style="padding:16px 24px; background:#F8FAFC; border-top:1px solid #E2E8F0; display:flex; justify-content:space-between; align-items:center;">
              <button class="btn-s" (click)="view.set('hub')">
                ← {{ t('Retour au centre de tests', 'Back to Tests Hub') }}
              </button>
              <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5;" (click)="startFullDetSampleTest()">
                {{ t("S'entraîner sur un test blanc", "Take a Practice Test") }}
              </button>
            </div>

          </div>

        </div>
      }

      
      <!-- ======================================================== -->
      <!-- VIEW: DET-DISQUALIFIED (ANTI-CHEAT TERMINATION)           -->
      <!-- ======================================================== -->
      @if (view() === 'det-disqualified') {
        <div style="animation: fadeIn 0.3s ease; max-width:760px; margin:40px auto; padding:20px;">
          <div style="background:white; border:3px solid #DC2626; border-radius:24px; box-shadow:0 25px 60px rgba(220, 38, 38, 0.2); overflow:hidden; text-align:center;">
            
            <div style="background:linear-gradient(135deg, #7F1D1D 0%, #991B1B 50%, #DC2626 100%); padding:32px 24px; color:white;">
              <div style="width:72px; height:72px; border-radius:50%; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; margin:0 auto 16px auto; backdrop-filter:blur(6px);">
                <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div style="display:inline-block; background:#FEF2F2; color:#991B1B; font-size:11px; font-weight:800; letter-spacing:1px; text-transform:uppercase; padding:4px 14px; border-radius:20px; margin-bottom:10px;">
                INFRACTION AU RÈGLEMENT D'EXAMEN
              </div>
              <h2 style="font-family:'Outfit', sans-serif; font-size:24px; font-weight:900; margin:0 0 8px 0;">
                Examen Officiel Interrompu Définitivement
              </h2>
              <p style="font-size:13.5px; opacity:0.95; max-width:540px; margin:0 auto; line-height:1.5;">
                Vous avez quitté l'écran d'examen officiel à <strong>{{ tabSwitchViolations() }} reprises</strong> (changement d'onglet ou sortie du plein écran).
              </p>
            </div>

            <div style="padding:28px 24px;">
              <div style="background:#FEF2F2; border:1px solid #FECACA; border-radius:14px; padding:18px; margin-bottom:20px; text-align:left;">
                <h4 style="font-size:14px; font-weight:800; color:#991B1B; margin:0 0 8px 0; display:flex; align-items:center; gap:8px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Conséquences Immédiates :
                </h4>
                <ul style="font-size:12.5px; color:#7F1D1D; margin:0; padding-left:20px; line-height:1.6;">
                  <li>Votre session a été <strong>fermée et verrouillée</strong>. Vous ne pouvez plus recommencer cet examen.</li>
                  <li>Vos réponses partielles ont été soumises d'office au professeur avec la mention <strong>« Incident d'intégrité académique avéré (3 infractions) »</strong>.</li>
                  <li>L'attribution du certificat officiel est suspendue dans l'attente de la décision disciplinaire de votre enseignant.</li>
                </ul>
              </div>

              <button
                type="button"
                (click)="view.set('hub')"
                class="btn-p"
                style="background:#991B1B; border-color:#991B1B; padding:12px 28px; font-size:14px; font-weight:800; border-radius:10px;">
                Retourner à l'Accueil des Tests
              </button>
            </div>

          </div>
        </div>
      }

      @if (view() === 'det-result' && lastDetResult(); as res) {
        <div style="animation: fadeIn 0.3s ease; max-width:920px; margin:0 auto; padding:10px 0;">

          <!-- Prestige Certificate Frame -->
          <div style="background:#FFFDF9; border:4px double #D97706; border-radius:20px; box-shadow:0 15px 45px rgba(0,0,0,0.08); padding:36px 32px; position:relative; overflow:hidden;">
            
            <!-- Corner Ornaments (Gold lines) -->
            <div style="position:absolute; top:12px; left:12px; width:28px; height:28px; border-top:2px solid #D97706; border-left:2px solid #D97706;"></div>
            <div style="position:absolute; top:12px; right:12px; width:28px; height:28px; border-top:2px solid #D97706; border-right:2px solid #D97706;"></div>
            <div style="position:absolute; bottom:12px; left:12px; width:28px; height:28px; border-bottom:2px solid #D97706; border-left:2px solid #D97706;"></div>
            <div style="position:absolute; bottom:12px; right:12px; width:28px; height:28px; border-bottom:2px solid #D97706; border-right:2px solid #D97706;"></div>

            <!-- Top Header with Official Logo -->
            <div style="text-align:center; margin-bottom:24px;">
              <img src="logo.png" style="width:75px; height:75px; object-fit:contain; border-radius:14px; margin-bottom:12px; filter: drop-shadow(0 4px 12px rgba(79,70,229,0.25));" alt="SpeakUp Official Logo" />
              <div style="font-size:12px; font-weight:800; color:#92400E; letter-spacing:2px; text-transform:uppercase;">
                SPEAKUP LEARNING ACADEMY • ACADEMIC EVALUATION BOARD
              </div>
              <h1 style="font-size:26px; font-weight:900; color:#1E1B4B; margin:6px 0 2px 0; font-family:'Outfit', serif; letter-spacing:0.5px;">
                OFFICIAL CERTIFICATE OF ENGLISH PROFICIENCY
              </h1>
              <div style="font-size:13.5px; font-weight:700; color:#6B7280; font-style:italic;">
                SpeakUp English Assessment (SET) • Common European Framework of Reference for Languages (CEFR)
              </div>
              <div style="display:inline-flex; align-items:center; gap:8px; margin-top:8px; background:#FEF3C7; color:#92400E; border:1px solid #FDE68A; padding:3px 12px; border-radius:20px; font-size:11.5px; font-weight:800;">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Official Certificate Awarded • Certificate ID: {{ res.certificateNumber || 'SET-2026-OFFICIAL' }}</span>
              </div>
            </div>

            <!-- Recipient Citation -->
            <div style="text-align:center; padding:16px 20px; background:rgba(255,255,255,0.7); border-radius:14px; border:1px solid #F3E8FF; margin-bottom:24px;">
              <div style="font-size:13px; font-style:italic; color:#64748B;">This official certificate of English proficiency is proudly awarded to:</div>
              <div style="font-size:28px; font-weight:900; color:#1E1B4B; margin:8px 0; letter-spacing:0.5px; font-family:'Outfit', sans-serif;">
                {{ res.studentName || currentUser()?.name || 'SpeakUp Candidate' }}
              </div>
              <p style="font-size:13px; color:#475569; max-width:680px; margin:0 auto; line-height:1.5;">
                for successfully completing the official <strong>SpeakUp English Assessment (20 timed proficiency modules)</strong>, demonstrating mastery of language skills and communicative fluency in full accordance with international CEFR standards.
              </p>
            </div>

            <!-- Scaled Score & CEFR Level Badge -->
            <div style="display:flex; justify-content:center; align-items:center; gap:30px; flex-wrap:wrap; margin-bottom:28px; padding:20px; background:white; border-radius:14px; border:1px solid #E2E8F0; box-shadow:0 4px 14px rgba(0,0,0,0.03);">
              <div style="text-align:center;">
                <div style="font-size:11px; font-weight:800; color:#6B7280; text-transform:uppercase; letter-spacing:1px;">Certified Overall Score</div>
                <div style="font-size:52px; font-weight:900; color:#4F46E5; line-height:1; font-family:'Outfit', sans-serif;">
                  {{ res.overallScore }}
                  <span style="font-size:20px; font-weight:700; color:#94A3B8;">/ 160</span>
                </div>
              </div>

              <div style="width:1.5px; height:60px; background:#E2E8F0;"></div>

              <div style="text-align:center;">
                <div style="font-size:11px; font-weight:800; color:#6B7280; text-transform:uppercase; letter-spacing:1px;">Certified CEFR Level</div>
                <div style="margin-top:6px;">
                  <span style="background:linear-gradient(135deg, #4F46E5 0%, #4338CA 100%); color:white; font-size:16px; font-weight:900; padding:8px 20px; border-radius:24px; box-shadow:0 4px 12px rgba(79,70,229,0.3); display:inline-block;">
                    Level {{ res.cefrLevel }} • {{ getCefrTitle(res.cefrLevel) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 4 Subscores Breakdown -->
            <div style="margin-bottom:28px;">
              <h4 style="font-size:13px; font-weight:800; color:#1E1B4B; margin:0 0 14px 0; text-transform:uppercase; letter-spacing:0.5px; text-align:center;">
                Official Competency Subscores Breakdown
              </h4>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
                <!-- Literacy -->
                <div class="det-subscore-box" style="background:white;">
                  <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                    <span style="font-size:12px; font-weight:700; color:#1E293B;">Literacy (Reading & Writing)</span>
                    <span style="font-size:12px; font-weight:800; color:#4F46E5;">{{ res.subscores.literacy }} / 160</span>
                  </div>
                  <div class="det-progress-track">
                    <div class="det-progress-fill" [style.width.%]="(res.subscores.literacy / 160) * 100" style="background:#4F46E5;"></div>
                  </div>
                </div>

                <!-- Comprehension -->
                <div class="det-subscore-box" style="background:white;">
                  <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                    <span style="font-size:12px; font-weight:700; color:#1E293B;">Comprehension (Reading & Listening)</span>
                    <span style="font-size:12px; font-weight:800; color:#0284C7;">{{ res.subscores.comprehension }} / 160</span>
                  </div>
                  <div class="det-progress-track">
                    <div class="det-progress-fill" [style.width.%]="(res.subscores.comprehension / 160) * 100" style="background:#0284C7;"></div>
                  </div>
                </div>

                <!-- Conversation -->
                <div class="det-subscore-box" style="background:white;">
                  <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                    <span style="font-size:12px; font-weight:700; color:#1E293B;">Conversation (Listening & Speaking)</span>
                    <span style="font-size:12px; font-weight:800; color:#059669;">{{ res.subscores.conversation }} / 160</span>
                  </div>
                  <div class="det-progress-track">
                    <div class="det-progress-fill" [style.width.%]="(res.subscores.conversation / 160) * 100" style="background:#059669;"></div>
                  </div>
                </div>

                <!-- Production -->
                <div class="det-subscore-box" style="background:white;">
                  <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                    <span style="font-size:12px; font-weight:700; color:#1E293B;">Production (Writing & Speaking)</span>
                    <span style="font-size:12px; font-weight:800; color:#D97706;">{{ res.subscores.production }} / 160</span>
                  </div>
                  <div class="det-progress-track">
                    <div class="det-progress-fill" [style.width.%]="(res.subscores.production / 160) * 100" style="background:#D97706;"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Teacher Signature & Official Gold Seal Section -->
            <div style="display:flex; justify-content:space-between; align-items:flex-end; padding-top:20px; border-top:1.5px solid #FDE68A; flex-wrap:wrap; gap:16px;">
              <!-- Left: Teacher Appreciation & Signature -->
              <div style="flex:1; min-width:260px;">
                <div style="font-size:11.5px; font-weight:800; color:#78350F; text-transform:uppercase; margin-bottom:4px;">Academic Faculty Evaluation & Endorsement:</div>
                <div style="font-size:12.5px; font-style:italic; color:#334155; line-height:1.4; background:#FFFBEB; border:1px solid #FEF3C7; padding:10px 14px; border-radius:8px; margin-bottom:10px;">
                  « {{ res.teacherGlobalComment || 'Demonstrates exceptional command of the English language with rich vocabulary range, clear pronunciation, and accurate grammatical structures.' }} »
                </div>
                <div style="font-size:13px; font-weight:800; color:#1E1B4B;">
                  Certified & Endorsed by: <span style="color:#4F46E5;">Prof. {{ res.gradedBy || 'SpeakUp Faculty' }}</span>
                </div>
                <div style="font-size:11.5px; color:#64748B;">
                  Date of Issuance: {{ res.gradedAt ? formatSubmissionDate(res.gradedAt) : 'Official 2026 Session' }}
                </div>
              </div>

              <!-- Right: Gold Medallion Stamp SVG -->
              <div style="text-align:center;">
                <svg width="84" height="84" viewBox="0 0 100 100" style="filter:drop-shadow(0 4px 8px rgba(217, 119, 6, 0.3));">
                  <circle cx="50" cy="50" r="46" fill="#FFFBEB" stroke="#D97706" stroke-width="3" stroke-dasharray="4 2"/>
                  <circle cx="50" cy="50" r="38" fill="#F59E0B" stroke="#B45309" stroke-width="1.5"/>
                  <circle cx="50" cy="50" r="30" fill="none" stroke="#FEF3C7" stroke-width="1"/>
                  <path d="M50 26 L54 37 L66 37 L56 45 L60 56 L50 49 L40 56 L44 45 L34 37 L46 37 Z" fill="#FFFBEB"/>
                  <text x="50" y="70" font-size="7.5" font-weight="900" fill="#78350F" text-anchor="middle" font-family="'Segoe UI', sans-serif">SPEAKUP CERTIFIED</text>
                  <text x="50" y="79" font-size="6" font-weight="800" fill="#92400E" text-anchor="middle" font-family="'Segoe UI', sans-serif">★ 2026 OFFICIAL ★</text>
                </svg>
                <div style="font-size:10px; font-weight:800; color:#92400E; margin-top:2px;">OFFICIAL SEAL</div>
              </div>
            </div>

            <!-- Footer Security & Anti-Cheat Note -->
            <div style="margin-top:20px; padding-top:12px; border-top:1px dashed #E2E8F0; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; font-size:10.5px; color:#94A3B8;">
              <div>Official credential certified by SpeakUp Platform • ID #{{ res.certificateNumber || 'SET-2026-OFFICIAL' }}</div>
              <div>Anti-Cheat Proctoring Enabled • Single Authenticated Session Verified</div>
            </div>

          </div>

          <!-- Actions Bar -->
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-top:20px;">
            <button class="btn-s" (click)="view.set('hub')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              <span>{{ t("Retour au centre de tests", "Back to Tests Hub") }}</span>
            </button>

            <button
              class="det-cta-btn"
              (click)="printDetResult(res)"
              style="padding:10px 24px; font-size:13.5px; background:linear-gradient(135deg, #059669 0%, #047857 100%);">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              <span>{{ t("Imprimer / Télécharger le Certificat Officiel (PDF)", "Print / Download Official Certificate (PDF)") }}</span>
            </button>
          </div>

        </div>
      }

      <!-- ======================================================== -->
      <!-- 4. OFFICIAL TEACHER EXAM PLAYER VIEW                     -->
      <!-- ======================================================== -->
      @if (view() === 'teacher-exam' && activeQuiz()) {
        <div class="exam-session">
          <div class="exam-topbar">
            <div style="display:flex; align-items:center; gap:12px">
              <div style="width:36px; height:36px; background:rgba(255,255,255,0.15); border-radius:8px; display:flex; align-items:center; justify-content:center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
              </div>
              <div>
                <div style="font-size:13px; font-weight:700; color:white">{{ activeQuiz()!.title }}</div>
                <div style="font-size:11px; color:rgba(255,255,255,0.6)">{{ activeQuiz()!.questions.length }} questions</div>
              </div>
            </div>

            <div class="exam-timer" [class.timer-warning]="timeLeft() < 120" [class.timer-danger]="timeLeft() < 60">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span style="font-size:18px; font-weight:800; font-variant-numeric:tabular-nums">{{ formatTimer(timeLeft()) }}</span>
            </div>

            <div style="min-width:120px">
              <div style="font-size:10px; color:rgba(255,255,255,0.6); margin-bottom:4px; text-align:right">
                {{ answeredCount() }} / {{ activeQuiz()!.questions.length }} répondus
              </div>
              <div style="height:4px; background:rgba(255,255,255,0.2); border-radius:99px; overflow:hidden">
                <div style="height:100%; background:white; border-radius:99px; transition:width 0.3s" [style.width.%]="(answeredCount() / activeQuiz()!.questions.length) * 100"></div>
              </div>
            </div>
          </div>

          <!-- Questions Navigator -->
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
            <div class="question-card" style="animation: fadeIn 0.3s ease">
              <div style="display:flex; align-items:center; gap:10px; margin-bottom:16px">
                <div style="width:28px; height:28px; background:#4F46E5; border-radius:8px; display:flex; align-items:center; justify-content:center; color:white; font-size:12px; font-weight:700; flex-shrink:0">
                  {{ currentQuestionIdx() + 1 }}
                </div>
                <h3 class="q-text">{{ q.question }}</h3>
              </div>

              <!-- Options -->
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

              <!-- Navigation -->
              <div style="display:flex; justify-content:space-between; margin-top:24px; padding-top:16px; border-top:1px solid var(--border-weak)">
                <button class="btn-s" [disabled]="currentQuestionIdx() === 0" (click)="prevQuestion()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px"><polyline points="15 18 9 12 15 6"/></svg> {{ t("Précédent", "Previous") }}
                </button>

                @if (currentQuestionIdx() < activeQuiz()!.questions.length - 1) {
                  <button class="btn-p" (click)="nextQuestion()">
                    {{ t("Suivant", "Next") }} <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-left:4px"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                } @else {
                  <button class="btn-p" style="background:#059669; border-color:#059669" [disabled]="answeredCount() < activeQuiz()!.questions.length" (click)="submitExam()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px"><polyline points="20 6 9 17 4 12"/></svg> {{ t("Soumettre l'examen", "Submit Exam") }}
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- ======================================================== -->
      <!-- PRE-EXAM BRIEFING MODAL (1-WEEK TIMELINE & MANDATORY FINISH) -->
      <!-- ======================================================== -->
      <!-- ======================================================== -->
      <!-- STUDENT OFFICIAL EXAM ANNOUNCEMENT MODAL                 -->
      <!-- ======================================================== -->
      @if (showStudentExamAnnouncementModal()) {
        <div class="announcement-modal-overlay" (click)="closeAnnouncementModal()">
          <div class="announcement-modal-card" (click)="$event.stopPropagation()">
            
            <!-- Modal Header -->
            <div class="announcement-header">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
                <div class="announcement-tag">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <span>{{ t("SESSION D'EXAMEN OFFICIELLE OUVERTE", "OFFICIAL EXAM SESSION NOW OPEN") }}</span>
                </div>
                <button type="button" (click)="closeAnnouncementModal()" class="announcement-close-btn" title="Fermer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <div style="display:flex; align-items:center; gap:14px; margin-bottom:8px;">
                <img src="logo.png" style="width:48px; height:48px; object-fit:contain; border-radius:12px; background:white; padding:4px; box-shadow:0 4px 12px rgba(0,0,0,0.15);" alt="SpeakUp Logo" />
                <div>
                  <h2 style="font-family:'Outfit', sans-serif; font-size:22px; font-weight:900; margin:0; line-height:1.2; color:white;">
                    SpeakUp English Assessment (SET)
                  </h2>
                  <div style="font-size:12.5px; opacity:0.92; margin-top:3px; color:#E0E7FF;">
                    {{ t("L'évaluation officielle de votre classe est maintenant lancée !", "Your class official evaluation is now live!") }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Content Body -->
            <div class="announcement-body">
              
              <div style="background:#EEF2FF; border:1.5px solid #C7D2FE; border-radius:12px; padding:14px 16px; margin-bottom:18px; display:flex; align-items:center; gap:12px;">
                <div style="width:40px; height:40px; border-radius:50%; background:#4F46E5; color:white; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                </div>
                <div style="font-size:13px; color:#1E1B4B; line-height:1.45;">
                  <strong>{{ t("Session officielle : 11/08/2026 au 18/08/2026", "Official Window: 11/08/2026 to 18/08/2026") }}</strong> (7 jours d'accès libre).<br/>
                  <span style="font-size:12px; color:#4338CA;">{{ t("Vous pouvez débuter votre test au moment de votre choix dans cette période.", "You may start your exam at any convenient time during this week.") }}</span>
                </div>
              </div>

              <!-- 4 Essential Rules Highlights -->
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px;">
                <div class="announcement-feature-card">
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                    <div class="announcement-mini-icon" style="background:#ECFDF5; color:#059669;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <div style="font-size:12.5px; font-weight:800; color:#1E293B;">20 Épreuves (~60 min)</div>
                  </div>
                  <div style="font-size:11px; color:#64748B; line-height:1.4;">
                    {{ t("Grammaire intensive, compréhension orale, vocaux et rédaction.", "Intensive grammar, listening, speaking recordings and essay.") }}
                  </div>
                </div>

                <div class="announcement-feature-card">
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                    <div class="announcement-mini-icon" style="background:#FEF3C7; color:#D97706;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    </div>
                    <div style="font-size:12.5px; font-weight:800; color:#1E293B;">Une Seule Traite</div>
                  </div>
                  <div style="font-size:11px; color:#64748B; line-height:1.4;">
                    {{ t("Une fois commencé, vous devez le terminer sans quitter le plein écran.", "Once started, you must complete the test in one single sitting.") }}
                  </div>
                </div>

                <div class="announcement-feature-card">
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                    <div class="announcement-mini-icon" style="background:#FEE2E2; color:#DC2626;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <div style="font-size:12.5px; font-weight:800; color:#1E293B;">Anti-Triche Actif</div>
                  </div>
                  <div style="font-size:11px; color:#64748B; line-height:1.4;">
                    {{ t("Changement d'onglet et copier-coller strictement surveillés.", "Tab switching and copy-paste strictly monitored and recorded.") }}
                  </div>
                </div>

                <div class="announcement-feature-card">
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                    <div class="announcement-mini-icon" style="background:#EFF6FF; color:#2563EB;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
                    </div>
                    <div style="font-size:12.5px; font-weight:800; color:#1E293B;">Certificat Accordé</div>
                  </div>
                  <div style="font-size:11px; color:#64748B; line-height:1.4;">
                    {{ t("Notation personnalisée par votre professeur avec score /160 et CEFR.", "Graded by your instructor with official score /160 and CEFR level.") }}
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div style="display:flex; flex-direction:column; gap:10px;">
                <button
                  type="button"
                  (click)="startOfficialFromAnnouncement()"
                  class="announcement-primary-cta">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  <span>{{ t("⚡ Accéder & Passer mon Examen Maintenant", "⚡ Quick Access • Start Official Exam Now") }}</span>
                </button>

                <button
                  type="button"
                  (click)="closeAnnouncementModal()"
                  class="announcement-secondary-cta">
                  <span>{{ t("Compris, je le passerai plus tard dans la semaine", "Got it, I will take it later this week") }}</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      }

      @if (showPreExamBriefingModal()) {
        <div class="briefing-modal-overlay" (click)="closePreExamBriefing()">
          <div class="briefing-modal-card" (click)="$event.stopPropagation()">
            
            <!-- Modal Header -->
            <div class="briefing-header">
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
                <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.18); backdrop-filter:blur(6px); padding:4px 12px; border-radius:20px; font-size:11px; font-weight:800; letter-spacing:0.5px; text-transform:uppercase; border:1px solid rgba(255,255,255,0.3);">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  {{ t('Consignes & Modalités Officielles', 'Official Examination Guidelines & Rules') }}
                </div>
                <button type="button" (click)="closePreExamBriefing()" style="border:none; background:rgba(255,255,255,0.15); color:white; width:30px; height:30px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>

              <h2 style="font-family:'Outfit', sans-serif; font-size:22px; font-weight:900; margin:0 0 6px 0; line-height:1.2;">
                SpeakUp English Assessment (SET)
              </h2>
              <div style="font-size:12.5px; opacity:0.92; line-height:1.4;">
                @if (activeLang() === 'fr') {
                  Session officielle ouverte du <strong>11/08/2026 au 18/08/2026</strong> • Vous disposez d'une semaine pour participer au moment de votre choix.
                } @else {
                  Official session active from <strong>11/08/2026 to 18/08/2026</strong> • You have 1 week to take your test at any convenient time.
                }
              </div>
            </div>

            <!-- Modal Body -->
            <div class="briefing-body">
              
              <!-- Crucial Alert: Obligation to finish in one sitting -->
              <div class="briefing-alert">
                <div style="width:36px; height:36px; min-width:36px; border-radius:50%; background:#FEF3C7; color:#D97706; display:flex; align-items:center; justify-content:center;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
                <div>
                  <div style="font-size:13.5px; font-weight:800; color:#92400E; margin-bottom:2px;">
                    {{ t('Obligation de Finalisation Immédiate', 'Mandatory Single-Sitting Completion') }}
                  </div>
                  <div style="font-size:12px; color:#B45309; line-height:1.5;">
                    @if (activeLang() === 'fr') {
                      Une fois que vous appuyez sur « Démarrer », <strong>vous êtes obligé(e) de terminer le test d'une seule traite</strong> (~60 minutes). Aucune mise en pause, fermeture de fenêtre ou redémarrage ne sera possible.
                    } @else {
                      Once you click "Start", <strong>you must complete the assessment in one sitting</strong> (~60 minutes). No pausing, tab switching, or restarts are allowed.
                    }
                  </div>
                </div>
              </div>

              <!-- 4 Grid Info Cards -->
              <div class="briefing-grid">
                <!-- Card 1: Anti-Cheat -->
                <div class="briefing-card">
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                    <div class="briefing-icon-box" style="background:#FEE2E2; color:#DC2626;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    </div>
                    <h4 style="font-size:13px; font-weight:800; color:#1E293B; margin:0;">{{ t('Surveillance Anti-Triche', 'Anti-Cheat Proctoring') }}</h4>
                  </div>
                  <ul style="margin:0; padding-left:16px; font-size:11.5px; color:#475569; line-height:1.5;">
                    <li><strong>{{ t('Plein écran obligatoire', 'Mandatory Fullscreen') }}</strong> pendant toute la durée du test.</li>
                    <li><strong>{{ t("Détection de changement d'onglet", "Tab-Switch Detection") }}</strong> : interdiction de quitter la fenêtre. Tout écart est consigné dans votre dossier.</li>
                    <li><strong>{{ t('Copier-coller désactivé', 'Copy-Paste Disabled') }}</strong> pour garantir un test équitable.</li>
                  </ul>
                </div>

                <!-- Card 2: Micro & Audio -->
                <div class="briefing-card">
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                    <div class="briefing-icon-box" style="background:#EFF6FF; color:#2563EB;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
                    </div>
                    <h4 style="font-size:13px; font-weight:800; color:#1E293B; margin:0;">{{ t('Microphone Requis', 'Microphone Required') }}</h4>
                  </div>
                  <p style="margin:0; font-size:11.5px; color:#475569; line-height:1.5;">
                    Vérifiez que votre microphone fonctionne et installez-vous dans un endroit silencieux. Vous aurez des épreuves orales enregistrées (lecture à voix haute, description d'image et entretien oral).
                  </p>
                </div>

                <!-- Card 3: 7 Questions & Timer -->
                <div class="briefing-card">
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                    <div class="briefing-icon-box" style="background:#F3E8FF; color:#7C3AED;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                    <h4 style="font-size:13px; font-weight:800; color:#1E293B; margin:0;">7 Épreuves Chronométrées</h4>
                  </div>
                  <p style="margin:0; font-size:11.5px; color:#475569; line-height:1.5;">
                    Chaque question dispose d'un temps imparti strict (de 25s à 5 min). Si le chronomètre arrive à 0, votre réponse est validée automatiquement et vous passez à la question suivante.
                  </p>
                </div>

                <!-- Card 4: Teacher Correction & Certificate -->
                <div class="briefing-card">
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
                    <div class="briefing-icon-box" style="background:#ECFDF5; color:#059669;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <h4 style="font-size:13px; font-weight:800; color:#1E293B; margin:0;">{{ t('Correction Pédagogique', 'Faculty Evaluation & Scoring') }}</h4>
                  </div>
                  <p style="margin:0; font-size:11.5px; color:#475569; line-height:1.5;">
                    Vos vocaux et rédactions seront transmis sous forme de dossier à votre professeur qui écoutera chaque réponse, attribuera vos points et délivrera votre Certificat Officiel CEFR (A2 à B2).
                  </p>
                </div>
              </div>

              <!-- Solemn Commitment Checkbox -->
              <label class="briefing-checkbox-label" (click)="preExamAgreed.set(!preExamAgreed())">
                <input type="checkbox" [checked]="preExamAgreed()" style="margin-top:2px; accent-color:#4F46E5; pointer-events:none;" />
                <span style="font-size:12px; font-weight:700; color:#1E1B4B; line-height:1.5;">
                  @if (activeLang() === 'fr') {
                  J'ai lu attentivement toutes les consignes. Je confirme être dans un environnement calme avec un microphone prêt, et je m'engage à compléter mon examen en une seule traite en respectant scrupuleusement les règles d'intégrité académique.
                } @else {
                  I have carefully read all examination rules. I confirm I am in a quiet room with a working microphone, and I pledge to complete the assessment in one continuous sitting respecting all academic integrity standards.
                }
                </span>
              </label>

            </div>

            <!-- Modal Footer -->
            <div class="briefing-footer">
              <button type="button" class="btn-cancel-briefing" (click)="closePreExamBriefing()">
                {{ t('Revenir plus tard', 'Take Later') }}
              </button>
              <button
                type="button"
                class="btn-start-briefing"
                (click)="confirmAndStartOfficialExam()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>{{ t("Démarrer l'Examen en Plein Écran", "Start Exam in Fullscreen") }}</span>
              </button>
            </div>

          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- ANTI-CHEAT WARNING MODAL (TAB SWITCH / BLUR DETECTED)     -->
      <!-- ======================================================== -->
      @if (showAntiCheatWarningModal()) {
        <div class="anti-cheat-alert-overlay">
          <div class="anti-cheat-alert-card">
            <div style="width:64px; height:64px; border-radius:50%; background:#FEE2E2; color:#DC2626; display:flex; align-items:center; justify-content:center; margin:0 auto 16px auto; animation:pulse-live 1.2s infinite;">
              <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h3 style="font-size:18px; font-weight:900; color:#991B1B; margin:0 0 8px 0; display:flex; align-items:center; justify-content:center; gap:8px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              AVERTISSEMENT ANTI-TRICHE
            </h3>
            <div style="font-size:13.5px; font-weight:800; color:#1F2937; margin-bottom:8px;">
              Changement de fenêtre ou d'onglet détecté !
            </div>
            <p style="font-size:12.5px; color:#4B5563; margin:0 0 18px 0; line-height:1.5;">
              Vous avez quitté la fenêtre officielle de l'examen SpeakUp. Cet incident a été horodaté et consigné dans votre dossier d'évaluation transmis au professeur (<strong>Avertissement {{ tabSwitchViolations() }}/3</strong>).
              <br/>
              Veuillez rester concentré(e) sur votre épreuve sous peine d'annulation définitive de votre test.
            </p>
            <button type="button" class="btn-return-exam" (click)="dismissAntiCheatWarning()">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Retourner immédiatement à mon épreuve</span>
            </button>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    /* Teacher Folders & Correction Hub Styles */
    .metric-card {
      background: white;
      border: 1px solid #E2E8F0;
      border-radius: 14px;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 6px rgba(0,0,0,0.03);
    }

    .filter-pill {
      border: 1px solid #E2E8F0;
      background: white;
      color: var(--text-secondary);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .filter-pill.active-pill {
      background: #4F46E5;
      color: white !important;
      border-color: #4F46E5;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.25);
    }

    .submissions-list-rows {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .dossier-row-header {
      display: grid;
      grid-template-columns: 280px 170px 240px 170px 1fr;
      align-items: center;
      gap: 16px;
      padding: 0 18px 4px 18px;
      font-size: 11px;
      font-weight: 800;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .dossier-row {
      background: white;
      border: 1.5px solid #E2E8F0;
      border-radius: 12px;
      padding: 12px 18px;
      display: grid;
      grid-template-columns: 280px 170px 240px 170px 1fr;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
      transition: all 0.2s ease;
    }

    .dossier-row:hover {
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.08);
      border-color: #C7D2FE;
    }

    .row-pending {
      border-left: 4px solid #F97316;
    }

    .row-corrected {
      border-left: 4px solid #10B981;
    }

    .dossier-col-student {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .student-avatar-circle {
      width: 40px;
      height: 40px;
      min-width: 40px;
      border-radius: 50%;
      color: white;
      font-size: 13.5px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.12);
    }

    .student-name {
      font-size: 14.5px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dossier-id-tag {
      font-size: 10px;
      font-weight: 800;
      background: #EEF2FF;
      color: #4338CA;
      border: 1px solid #C7D2FE;
      padding: 1px 6px;
      border-radius: 4px;
      letter-spacing: 0.3px;
    }

    .student-email {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 1px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dossier-col-date .col-value {
      font-size: 12.5px;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 600;
    }

    .dossier-chip-sm {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }

    .chip-blue {
      background: #EFF6FF;
      color: #1D4ED8;
      border: 1px solid #DBEAFE;
    }

    .chip-green {
      background: #F0FDF4;
      color: #15803D;
      border: 1px solid #DCFCE7;
    }

    .chip-purple {
      background: #FAF5FF;
      color: #7E22CE;
      border: 1px solid #F3E8FF;
    }

    .badge-status-pending {
      background: #FFF7ED;
      color: #C2410C;
      border: 1px solid #FFEDD5;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      width: fit-content;
    }

    .badge-status-corrected {
      background: #ECFDF5;
      color: #047857;
      border: 1px solid #A7F3D0;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      width: fit-content;
    }

    .score-badge {
      font-size: 11.5px;
      font-weight: 800;
      color: #4F46E5;
    }

    .dossier-col-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
    }

    .btn-dossier-action {
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }

    .btn-pending-action {
      background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%);
      color: white;
      border: none;
      box-shadow: 0 2px 6px rgba(79, 70, 229, 0.25);
    }

    .btn-pending-action:hover {
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
      transform: translateY(-1px);
    }

    .btn-corrected-action {
      background: #F8FAFC;
      color: #334155;
      border: 1.5px solid #CBD5E1;
    }

    .btn-corrected-action:hover {
      background: #EEF2FF;
      color: #4338CA;
      border-color: #A5B4FC;
    }

    .btn-dossier-delete {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      border: 1px solid #E2E8F0;
      background: white;
      color: #94A3B8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .btn-dossier-delete:hover {
      border-color: #EF4444;
      color: #EF4444;
      background: #FEF2F2;
    }

    @media (max-width: 1100px) {
      .dossier-row-header {
        display: none;
      }
      .dossier-row {
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .dossier-col-actions {
        grid-column: 1 / -1;
        justify-content: flex-start;
      }
    }

    @media (max-width: 680px) {
      .dossier-row {
        grid-template-columns: 1fr;
        gap: 12px;
      }
    }

    .folder-card {
      position: relative;
      background: white;
      border: 1.5px solid #E2E8F0;
      border-radius: 16px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      margin-top: 10px;
    }

    .folder-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(79,70,229,0.12);
      border-color: #A5B4FC;
    }

    .folder-pending {
      border-color: #FED7AA;
    }

    .folder-corrected {
      border-color: #A7F3D0;
    }

    .folder-top-tab {
      position: absolute;
      top: -12px;
      left: 18px;
      background: #EEF2FF;
      color: #4338CA;
      border: 1px solid #C7D2FE;
      font-size: 10.5px;
      font-weight: 800;
      padding: 2px 10px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .dossier-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
    }

    .folder-action-btn {
      flex: 1;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.15s ease;
    }

    .folder-action-btn:hover {
      opacity: 0.92;
      transform: scale(0.99);
    }

    .correction-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
      align-items: start;
    }

    @media (max-width: 960px) {
      .correction-grid {
        grid-template-columns: 1fr;
      }
    }

    .q-correction-card {
      background: white;
      border: 1.5px solid #E2E8F0;
      border-radius: 14px;
      padding: 20px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.03);
    }

    .teacher-audio-player-box {
      background: #F8FAFC;
      border: 1.5px solid #E2E8F0;
      border-radius: 12px;
      padding: 14px;
    }

    .preset-score-btn {
      border: 1px solid #CBD5E1;
      background: white;
      color: #475569;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.12s ease;
    }

    .preset-score-btn:hover {
      border-color: #4F46E5;
      color: #4F46E5;
      background: #EEF2FF;
    }

    .sticky-correction-sidebar {
      position: sticky;
      top: 16px;
    }

    .certificate-grading-card {
      background: white;
      border: 1.5px solid #C7D2FE;
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 6px 20px rgba(79,70,229,0.08);
    }

    .subscore-tag {
      font-size: 10px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .subscore-tag.subscore-literacy { background: #EEF2FF; color: #4F46E5; }
    .subscore-tag.subscore-comprehension { background: #E0F2FE; color: #0369A1; }
    .subscore-tag.subscore-conversation { background: #ECFDF5; color: #047857; }
    .subscore-tag.subscore-production { background: #FEF3C7; color: #B45309; }

    /* SpeakUp Assessment Hub & Card Styles */
    .official-session-card {
      background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #C7D2FE 100%);
      border: 2px solid #818CF8;
      border-radius: 20px;
      padding: 26px 28px;
      margin-bottom: 24px;
      box-shadow: 0 10px 25px rgba(79, 70, 229, 0.12);
      position: relative;
      overflow: hidden;
    }

    .official-badge-pulse {
      background: #4F46E5;
      color: white;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 20px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(79, 70, 229, 0.35);
    }

    .session-chip {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(4px);
      border: 1px solid #C7D2FE;
      color: #312E81;
      padding: 5px 12px;
      border-radius: 20px;
      font-size: 11.5px;
      font-weight: 700;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .official-start-btn {
      padding: 13px 26px;
      border-radius: 12px;
      background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%);
      color: white;
      font-size: 14.5px;
      font-weight: 800;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 16px rgba(79, 70, 229, 0.4);
      transition: all 0.2s ease;
    }

    .official-start-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5);
    }

    .official-session-badge-box {
      background: white;
      border: 1.5px solid #C7D2FE;
      border-radius: 16px;
      padding: 20px 24px;
      min-width: 170px;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.08);
    }

    /* ANNOUNCEMENT MODAL OVERLAY */
    .announcement-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99998;
      padding: 20px;
      animation: fadeIn 0.2s ease;
    }

    .announcement-modal-card {
      background: white;
      border-radius: 22px;
      max-width: 620px;
      width: 100%;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
      overflow: hidden;
      border: 1.5px solid #C7D2FE;
    }

    .announcement-header {
      background: linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%);
      padding: 24px 26px;
      color: white;
      position: relative;
    }

    .announcement-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.16);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #FDE047;
    }

    .announcement-close-btn {
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s ease;
    }

    .announcement-close-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .announcement-body {
      padding: 24px 26px;
    }

    .announcement-feature-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 12px 14px;
    }

    .announcement-mini-icon {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .announcement-primary-cta {
      width: 100%;
      padding: 14px 20px;
      border-radius: 12px;
      border: none;
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: white;
      font-size: 15px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 6px 18px rgba(5, 150, 105, 0.4);
      transition: all 0.15s ease;
    }

    .announcement-primary-cta:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(5, 150, 105, 0.5);
    }

    .announcement-secondary-cta {
      width: 100%;
      padding: 11px 20px;
      border-radius: 12px;
      border: 1.5px solid #CBD5E1;
      background: white;
      color: #475569;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .announcement-secondary-cta:hover {
      background: #F1F5F9;
    }

    /* PRE-EXAM BRIEFING MODAL */
    .briefing-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      padding: 16px;
      animation: fadeIn 0.2s ease;
    }

    .briefing-modal-card {
      background: white;
      border-radius: 20px;
      width: 100%;
      max-width: 660px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      display: flex;
      flex-direction: column;
    }

    .briefing-header {
      background: linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%);
      color: white;
      padding: 24px 26px;
    }

    .briefing-body {
      padding: 22px 26px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .briefing-alert {
      background: #FFFBEB;
      border: 1.5px solid #FCD34D;
      border-radius: 14px;
      padding: 14px 16px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .briefing-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    @media (max-width: 600px) {
      .briefing-grid {
        grid-template-columns: 1fr;
      }
    }

    .briefing-card {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 14px;
    }

    .briefing-icon-box {
      width: 28px;
      height: 28px;
      border-radius: 7px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .briefing-checkbox-label {
      background: #EEF2FF;
      border: 1.5px solid #C7D2FE;
      border-radius: 12px;
      padding: 14px 16px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .briefing-checkbox-label:hover {
      background: #E0E7FF;
      border-color: #818CF8;
    }

    .briefing-footer {
      padding: 16px 26px 22px 26px;
      border-top: 1px solid #E2E8F0;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
    }

    .btn-cancel-briefing {
      padding: 10px 18px;
      border-radius: 10px;
      border: 1px solid #CBD5E1;
      background: white;
      color: #475569;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }

    .btn-start-briefing {
      padding: 12px 22px;
      border-radius: 10px;
      border: none;
      background: linear-gradient(135deg, #4F46E5 0%, #4338CA 100%);
      color: white;
      font-size: 13.5px;
      font-weight: 800;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
      transition: all 0.15s ease;
    }

    .btn-start-briefing:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }

    /* ANTI-CHEAT ALERT OVERLAY */
    .anti-cheat-alert-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(153, 27, 27, 0.85);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      padding: 20px;
      animation: fadeIn 0.15s ease;
    }

    .anti-cheat-alert-card {
      background: white;
      border: 3px solid #DC2626;
      border-radius: 20px;
      padding: 28px 24px;
      max-width: 460px;
      text-align: center;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
    }

    .btn-return-exam {
      width: 100%;
      padding: 13px 20px;
      border-radius: 12px;
      border: none;
      background: #DC2626;
      color: white;
      font-size: 14px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 14px rgba(220, 38, 38, 0.4);
      transition: all 0.15s ease;
    }

    .btn-return-exam:hover {
      background: #B91C1C;
    }

    .det-hero-card {
      background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 50%, #FAF5FF 100%);
      border: 1.5px solid #C7D2FE;
      border-radius: 16px;
      padding: 28px;
      position: relative;
      overflow: hidden;
    }

    .det-badge-accent {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      font-weight: 800;
      color: #4F46E5;
      background: white;
      padding: 3px 10px;
      border-radius: 20px;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 6px rgba(79,70,229,0.1);
    }

    .det-cta-btn {
      background: #4F46E5;
      color: white;
      border: none;
      padding: 12px 26px;
      border-radius: 12px;
      font-weight: 800;
      font-size: 13.5px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(79,70,229,0.35);
    }
    .det-cta-btn:hover {
      background: #4338CA;
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(79,70,229,0.4);
    }

    .det-hero-illustration {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    .det-subscore-mini {
      margin-top: -16px;
      background: white;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 4px 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.06);
    }

    .det-filter-bar {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 6px;
    }
    .det-filter-chip {
      background: var(--surface-1);
      border: 1.5px solid var(--border);
      border-radius: 24px;
      padding: 7px 14px;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-secondary);
      cursor: pointer;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .det-filter-chip:hover {
      border-color: #4F46E5;
      color: #4F46E5;
    }
    .det-filter-chip.active {
      background: #4F46E5;
      color: white;
      border-color: #4F46E5;
      box-shadow: 0 2px 8px rgba(79,70,229,0.25);
    }

    .det-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .det-module-card {
      background: var(--surface-1);
      border: 1.5px solid var(--border);
      border-radius: 14px;
      padding: 18px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      transition: all 0.2s ease;
      position: relative;
    }
    .det-module-card:hover {
      transform: translateY(-2px);
      border-color: #4F46E5;
      box-shadow: 0 8px 20px rgba(79,70,229,0.12);
    }

    .det-icon-box {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .det-time-badge {
      font-size: 10.5px;
      font-weight: 700;
      color: var(--text-muted);
      background: var(--surface-2);
      padding: 2px 8px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .det-pill-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      font-weight: 700;
      color: #4F46E5;
      background: #EEF2FF;
      border: 1px solid #C7D2FE;
      padding: 4px 10px;
      border-radius: 20px;
    }

    /* ========================================================= */
    /* ACTIVE QUESTION TEST MODAL (SPEAKUP ASSESSMENT) */
    /* ========================================================= */
    .det-test-container {
      min-height: calc(100vh - 160px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px 10px;
      background: #F3F4F6;
      border-radius: 16px;
    }

    .det-question-modal {
      background: #FFFFFF;
      border: 1.5px solid #E5E7EB;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
      width: 100%;
      max-width: 960px;
      padding: 24px 32px 28px 32px;
      display: flex;
      flex-direction: column;
      position: relative;
      animation: scaleUp 0.2s ease-out;
    }

    .det-modal-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
      margin-bottom: 20px;
      border-bottom: 1px solid #F1F5F9;
    }

    .det-timer-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 700;
      color: #374151;
      background: #F3F4F6;
      padding: 6px 14px;
      border-radius: 20px;
      border: 1px solid #E5E7EB;
      transition: all 0.2s;
    }
    .det-timer-pill.urgent {
      background: #FEF2F2;
      color: #DC2626;
      border-color: #FECACA;
      animation: pulseAlert 1s infinite;
    }

    .det-close-btn {
      background: none;
      border: none;
      color: #9CA3AF;
      cursor: pointer;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.15s;
    }
    .det-close-btn:hover {
      background: #F1F5F9;
      color: #1F2937;
    }

    .det-prompt-title {
      font-size: 20px;
      font-weight: 800;
      color: #1F2937;
      text-align: center;
      margin: 0 0 28px 0;
      line-height: 1.35;
    }

    .det-two-column-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      align-items: flex-start;
    }
    @media (max-width: 768px) {
      .det-two-column-layout {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      .det-hero-card {
        padding: 20px 16px;
        flex-direction: column;
        gap: 16px;
      }
      .det-hero-illustration {
        display: none;
      }
      .det-cta-btn {
        width: 100%;
        min-height: 48px;
        justify-content: center;
        font-size: 13.5px;
      }
      .det-test-container {
        padding: 6px 4px;
        min-height: auto;
        border-radius: 12px;
      }
      .det-question-modal {
        padding: 18px 16px 22px 16px;
        border-radius: 14px;
      }
      .det-prompt-title {
        font-size: 16px;
        margin: 0 0 16px 0;
        text-align: left;
      }
      .det-photo-img {
        height: 180px;
      }
      .det-textarea {
        min-height: 130px;
        font-size: 16px !important;
        padding: 12px;
      }
      .det-modal-bottombar {
        margin-top: 18px;
        padding-top: 14px;
      }
      .det-submit-btn {
        width: 100%;
        min-height: 48px;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .det-grid {
        grid-template-columns: 1fr;
      }
      .det-filter-bar {
        padding-bottom: 8px;
        scrollbar-width: none;
      }
      .det-filter-bar::-webkit-scrollbar {
        display: none;
      }
      .det-filter-chip {
        padding: 8px 14px;
        min-height: 40px;
      }
      .det-modal-topbar {
        margin-bottom: 14px;
        padding-bottom: 12px;
      }
      .exam-topbar {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
      }
    }

    .det-photo-column {
      display: flex;
      flex-direction: column;
    }
    .det-image-wrapper {
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #E2E8F0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      background: #000;
    }
    .det-photo-img {
      width: 100%;
      height: 240px;
      object-fit: cover;
      display: block;
    }
    .det-photo-credit {
      font-size: 11px;
      color: #94A3B8;
      margin-top: 6px;
      font-style: italic;
    }

    .det-response-column {
      display: flex;
      flex-direction: column;
    }

    .det-textarea {
      width: 100%;
      border: 1.5px solid #D1D5DB;
      border-radius: 12px;
      padding: 16px;
      font-size: 15px;
      color: #1F2937;
      line-height: 1.6;
      resize: vertical;
      min-height: 200px;
      outline: none;
      font-family: inherit;
      transition: all 0.2s;
      background: #FAFAFA;
      box-sizing: border-box;
    }
    .det-textarea:focus {
      background: #FFFFFF;
      border-color: #4F46E5;
      box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
    }

    .det-modal-bottombar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid #F1F5F9;
    }

    .det-submit-btn {
      background: #4F46E5;
      color: white;
      border: none;
      padding: 11px 32px;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 800;
      letter-spacing: 0.5px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 14px rgba(79,70,229,0.3);
    }
    .det-submit-btn:hover:not(:disabled) {
      background: #4338CA;
      transform: translateY(-1px);
    }
    .det-submit-btn:disabled {
      background: #E5E7EB;
      color: #9CA3AF;
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }

    /* Audio visualizer and buttons */
    .det-audio-bar {
      width: 4px;
      height: 8px;
      background: #CBD5E1;
      border-radius: 4px;
      transition: all 0.2s;
    }
    .det-audio-bar.recording {
      background: #EF4444;
      animation: audioWave 0.8s ease-in-out infinite alternate;
    }
    @keyframes audioWave {
      0% { height: 6px; }
      100% { height: 28px; }
    }

    .det-mic-record-btn {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #4F46E5;
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 6px 16px rgba(79,70,229,0.3);
      transition: all 0.2s;
    }
    .det-mic-record-btn.recording {
      background: #EF4444;
      box-shadow: 0 0 0 6px rgba(239,68,68,0.25);
      animation: pulseAlert 1.2s infinite;
    }

    .det-audio-play-btn {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: #EEF2FF;
      color: #4F46E5;
      border: 2px solid #C7D2FE;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 6px 18px rgba(79,70,229,0.15);
    }
    .det-audio-play-btn:hover:not(:disabled) {
      background: #4F46E5;
      color: white;
      transform: scale(1.06);
    }
    .det-audio-play-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .det-inline-blank-input {
      display: inline-block;
      height: 28px;
      border: 1.5px solid #94A3B8;
      border-radius: 6px;
      text-align: center;
      font-size: 15px;
      font-weight: 700;
      color: #1E1B4B;
      background: white;
      outline: none;
      margin: 0 2px;
      padding: 0 4px;
    }
    .det-inline-blank-input:focus {
      border-color: #4F46E5;
      background: #EEF2FF;
    }

    .det-words-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
    }
    .det-word-chip {
      background: white;
      border: 1.5px solid #E2E8F0;
      border-radius: 10px;
      padding: 12px 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      transition: all 0.15s;
    }
    .det-word-chip:hover {
      border-color: #4F46E5;
      background: #F8FAFC;
    }
    .det-word-chip.selected {
      border-color: #4F46E5;
      background: #EEF2FF;
      color: #4338CA;
    }
    .det-chip-checkbox {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      border: 1.5px solid #CBD5E1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
    }
    .det-word-chip.selected .det-chip-checkbox {
      background: #4F46E5;
      border-color: #4F46E5;
    }

    /* Score Report */
    .det-result-card {
      background: white;
      border: 1.5px solid #E2E8F0;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.06);
    }
    .det-subscore-box {
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      padding: 12px 16px;
    }
    .det-progress-track {
      width: 100%;
      height: 8px;
      background: #E2E8F0;
      border-radius: 99px;
      overflow: hidden;
    }
    .det-progress-fill {
      height: 100%;
      border-radius: 99px;
      transition: width 0.6s ease;
    }

    /* Existing teacher exam styles */
    .exam-card { background: var(--surface-1); border: 1px solid var(--border); border-radius: 12px; padding: 16px; transition: all 0.2s ease; }
    .exam-card:hover:not(.attempted) { border-color: #4F46E5; box-shadow: 0 4px 14px rgba(79,70,229,0.1); }
    .exam-card.attempted { background: #F0FDF4; border-color: #A7F3D0; }
    .exam-badge { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; font-weight: 600; color: var(--text-secondary); background: var(--surface-2); padding: 2px 8px; border-radius: 20px; }
    .attempt-result { font-size: 18px; font-weight: 800; padding: 4px 10px; border-radius: 8px; }
    .attempt-result.good { background: #D1FAE5; color: #047857; }
    .attempt-result.bad { background: #FEE2E2; color: #B91C1C; }
    .exam-session { display: flex; flex-direction: column; gap: 16px; }
    .exam-topbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; background: linear-gradient(135deg, #1E1B4B, #312E81); padding: 16px 20px; border-radius: 12px; flex-wrap: wrap; }
    .exam-timer { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.15); padding: 8px 16px; border-radius: 8px; color: white; }
    .exam-timer.timer-warning { background: rgba(251,191,36,0.3); }
    .exam-timer.timer-danger { background: rgba(239,68,68,0.4); animation: pulseAlert 1s infinite; }
    .q-dot { width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface-2); font-size: 10px; font-weight: 700; cursor: pointer; color: var(--text-muted); }
    .q-dot.answered { background: #D1FAE5; border-color: #059669; color: #047857; }
    .q-dot.current { background: #4F46E5; border-color: #4F46E5; color: white; }
    .question-card { background: var(--surface-1); border: 1px solid var(--border); border-radius: 12px; padding: 24px; }
    .q-text { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0; }
    .option-btn { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 16px; border: 1.5px solid var(--border); border-radius: 10px; background: var(--surface-1); cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text-primary); transition: all 0.2s; }
    .option-btn:hover { border-color: #4F46E5; background: #F5F3FF; }
    .option-btn.selected { border-color: #4F46E5; background: #EEF2FF; color: #3730A3; font-weight: 700; }
    .opt-letter { width: 24px; height: 24px; border-radius: 6px; background: var(--surface-2); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: var(--text-secondary); }
    .option-btn.selected .opt-letter { background: #4F46E5; color: white; }

    @keyframes pulseAlert {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.03); }
    }
    @keyframes scaleUp {
      from { transform: scale(0.97); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class StudentExamComponent implements OnDestroy {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);
  private sanitizer = inject(DomSanitizer);
  private assessmentGenerator = inject(AssessmentGeneratorService);

  Math = Math;
  currentUser = signal<UserProfile | null>(null);

  // Assessment Submissions & Teacher Hub signals
  assessmentSubmissions = signal<AssessmentSubmission[]>([]);
  activeSubmission = signal<AssessmentSubmission | null>(null);
  folderSearchQuery = signal<string>('');
  folderFilterStatus = signal<'all' | 'pending' | 'corrected'>('all');
  teacherModeTab = signal<'folders' | 'generator' | 'preview'>('folders');

  // Lessons Assessment Generator signals (A2-B2)
  lessons = signal<Lesson[]>([]);
  officialAssessmentQuestions = signal<DetQuestion[]>([]);
  targetGeneratorLevel = signal<'A2' | 'B1' | 'B2' | 'A2-B2'>('A2-B2');

  // Official Exam Session & Anti-Cheat Signals
  showPreExamBriefingModal = signal<boolean>(false);
  showStudentExamAnnouncementModal = signal<boolean>(false);
  preExamAgreed = signal<boolean>(true);
  isOfficialExam = signal<boolean>(false);
  tabSwitchViolations = signal<number>(0);
  showAntiCheatWarningModal = signal<boolean>(false);
  isSavingOfficial = signal<boolean>(false);
  isOfficialSaved = signal<boolean>(false);

  // Teacher Customization & Custom Audio Recording Signals
  editingQuestionId = signal<string | null>(null);
  isTeacherRecording = signal<boolean>(false);
  teacherRecordingQuestionId = signal<string | null>(null);
  teacherRecordedSeconds = signal<number>(0);
  private teacherMediaRecorder: MediaRecorder | null = null;
  private teacherAudioChunks: Blob[] = [];
  private teacherTimerInterval: any = null;
  private currentPlayingAudio: HTMLAudioElement | null = null;
  private violationCooldown = false;
  private boundFullscreenHandler: any = null;
  assessmentSessionConfig = signal<AssessmentSessionConfig>({
    startDate: '2026-11-08T00:00:00',
    endDate: '2026-11-15T23:59:59',
    title: 'Session Officielle SpeakUp Assessment (Novembre 2026)',
    durationMinutes: 20,
    antiCheatEnabled: true
  });
  private boundVisibilityHandler: any = null;
  private boundBlurHandler: any = null;
  private boundBeforeUnloadHandler: any = null;
  private boundBlockHandler: any = null;
  selectedLessonIds = signal<string[]>([]);
  genAssessment = signal<GeneratedAssessmentMetadata | null>(null);
  saveSuccessNotification = signal<string | null>(null);
  isGenerating = signal<boolean>(false);
  isPlayingAudio = signal<boolean>(false);

  // Dynamic extracted vocabulary preview from selected lessons
  extractedVocabWords = computed(() => {
    const activeLessons = this.lessons().filter(l => this.isLessonSelected(l.id));
    const words: string[] = [];
    activeLessons.forEach(l => {
      if (Array.isArray(l.vocabulary)) {
        l.vocabulary.forEach(w => {
          const clean = w.trim().toLowerCase();
          if (clean && !words.includes(clean)) words.push(clean);
        });
      }
    });
    return words.slice(0, 16);
  });

  // Dynamic balance calculation of question types / subscores
  generatorSubscoresBalance = computed(() => {
    const ga = this.genAssessment();
    if (!ga || !ga.questions || ga.questions.length === 0) {
      return { literacy: 29, comprehension: 14, production: 29, conversation: 28 };
    }
    const total = ga.questions.length;
    const lit = ga.questions.filter(q => q.subscore === 'literacy').length;
    const comp = ga.questions.filter(q => q.subscore === 'comprehension').length;
    const prod = ga.questions.filter(q => q.subscore === 'production').length;
    const conv = ga.questions.filter(q => q.subscore === 'conversation').length;
    return {
      literacy: Math.round((lit / total) * 100),
      comprehension: Math.round((comp / total) * 100),
      production: Math.round((prod / total) * 100),
      conversation: Math.round((conv / total) * 100)
    };
  });
  currentStudentPendingSubmission = signal<AssessmentSubmission | null>(null);
  currentStudentCorrectedSubmission = signal<AssessmentSubmission | null>(null);
  recordedAudioBase64: string | null = null;
  selectedAudioPlayQuestionId = signal<string | null>(null);
  showFolderDetailExpanded = signal<boolean>(false);

  quizzes = signal<Quiz[]>([]);
  examAttempts = signal<ExamAttempt[]>([]);
  activeLang = this.db.activeLang;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

  // Views: 'hub' (Image 2) | 'det-test' (Image 1) | 'det-result' | 'teacher-exam'
  view = signal<'hub' | 'det-test' | 'det-result' | 'teacher-exam' | 'det-pending' | 'det-disqualified'>('hub');

  // Subscore filter in hub
  activeSubscoreFilter = signal<'all' | 'literacy' | 'comprehension' | 'production' | 'conversation' | 'official'>('all');

  // SpeakUp English Assessment Question Bank
  readonly detQuestionBank: DetQuestion[] = [
    {
      id: 'wp-1',
      type: 'write-photo',
      titleFr: "Rédigez une description de l'image ci-dessous pendant 1 minute",
      titleEn: "Write a description of the image below for 1 minute",
      subscore: 'production',
      timeLimitSec: 60,
      imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1000&q=80',
      imageCredit: '© iabzd / Unsplash',
      minWords: 20
    },
    {
      id: 'sp-1',
      type: 'speak-photo',
      titleFr: "Décrivez l'image ci-dessous à l'oral pendant 90 secondes",
      titleEn: "Speak about the image below for 90 seconds",
      subscore: 'conversation',
      timeLimitSec: 90,
      imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1000&q=80',
      imageCredit: '© Unsplash'
    },
    {
      id: 'rc-1',
      type: 'read-complete',
      titleFr: "Tapez les lettres manquantes pour compléter le texte",
      titleEn: "Type the missing letters to complete the text below",
      subscore: 'literacy',
      timeLimitSec: 180,
      blanksData: [
        { prefix: 'The city of London is one of the most popu', missing: 'lar' },
        { prefix: 'tourist desti', missing: 'nations' },
        { prefix: 'in Eur', missing: 'ope' },
        { prefix: '. Every year, milli', missing: 'ons' },
        { prefix: 'of peo', missing: 'ple' },
        { prefix: 'visit its fam', missing: 'ous' },
        { prefix: 'muse', missing: 'ums' },
        { prefix: 'and his', missing: 'toric' },
        { prefix: 'monu', missing: 'ments' },
        { prefix: '. The river Tha', missing: 'mes' },
        { prefix: 'flows through the hea', missing: 'rt' },
        { prefix: 'of the cap', missing: 'ital' }
      ]
    },
    {
      id: 'rs-1',
      type: 'read-select',
      titleFr: "Sélectionnez les vrais mots anglais dans cette liste",
      titleEn: "Select the real English words in this list",
      subscore: 'literacy',
      timeLimitSec: 60,
      wordsList: [
        { word: 'challenge', isReal: true },
        { word: 'glimpton', isReal: false },
        { word: 'efficient', isReal: true },
        { word: 'flouristic', isReal: false },
        { word: 'frequently', isReal: true },
        { word: 'tracely', isReal: false },
        { word: 'persuade', isReal: true },
        { word: 'preclament', isReal: false },
        { word: 'remarkable', isReal: true },
        { word: 'frenshive', isReal: false },
        { word: 'sustainable', isReal: true },
        { word: 'spundery', isReal: false },
        { word: 'reliable', isReal: true },
        { word: 'determine', isReal: true }
      ]
    },
    {
      id: 'lt-1',
      type: 'listen-type',
      titleFr: "Tapez fidèlement l'énoncé que vous entendez",
      titleEn: "Type the statement that you hear",
      subscore: 'comprehension',
      timeLimitSec: 60,
      audioText: "She decided to study abroad to improve her communication skills and discover new cultures."
    },
    {
      id: 'ra-1',
      type: 'read-aloud',
      titleFr: "Lisez la phrase ci-dessous à voix haute",
      titleEn: "Read the sentence below aloud",
      subscore: 'conversation',
      timeLimitSec: 25,
      promptText: "Effective communication is the cornerstone of successful international collaboration."
    },
    {
      id: 'rw-1',
      type: 'read-write',
      titleFr: "Répondez au sujet en rédigeant au moins 50 mots",
      titleEn: "Respond to the question in at least 50 words",
      subscore: 'production',
      timeLimitSec: 300,
      promptText: "Describe a challenge you faced recently and explain how you overcame it. What lessons did you learn from this experience?",
      minWords: 50
    },
    {
      id: 'ls-1',
      type: 'listen-speak',
      titleFr: "Écoutez la question, puis répondez oralement pendant 90 secondes",
      titleEn: "Listen to the question, then speak your response for 90 seconds",
      subscore: 'conversation',
      timeLimitSec: 90,
      audioText: "Tell me about a memorable trip you have taken. Why was this place so special to you?"
    }
  ];

  // Active DET Test session signals
  detTestSequence = signal<DetQuestion[]>([]);
  currentDetIndex = signal<number>(0);
  detTimeLeft = signal<number>(60);
  isFullTestMode = signal<boolean>(false);
  currentTextAnswer = '';
  blankInputs: string[] = [];
  selectedWordSet = new Set<string>();
  audioPlayCount = signal<number>(0);
  isRecording = signal<boolean>(false);
  recordedSeconds = signal<number>(0);
  recordedAudioUrl: string | null = null;
  private mediaRecorder: any = null;
  private audioChunks: any[] = [];
  private recognitionInstance: any = null;
  private detTimerInterval: any = null;

  // Stored answers for the session
  detSessionAnswers = signal<Record<string, { given: any; givenText?: string; audioUrl?: string; correct: boolean; score: number; wordCount?: number; timeSpentSec?: number }>>({});

  // Result for DET mode with full official certificate metadata
  lastDetResult = signal<{
    overallScore: number;
    cefrLevel: string;
    subscores: { literacy: number; comprehension: number; conversation: number; production: number };
    totalQuestions: number;
    studentName?: string;
    studentEmail?: string;
    certificateNumber?: string;
    certificateAwarded?: boolean;
    gradedBy?: string;
    gradedAt?: string;
    teacherGlobalComment?: string;
    antiCheatReport?: AntiCheatReport;
  } | null>(null);

  // Existing Teacher Exam properties
  activeQuiz = signal<Quiz | null>(null);
  currentQuestionIdx = signal<number>(0);
  examAnswers = signal<Record<number, string>>({});
  timeLeft = signal<number>(0);
  lastAttempt = signal<ExamAttempt | null>(null);
  private timerInterval: any = null;
  private startTime = 0;

  constructor() {
    this.db.observeCurrentUser().subscribe(u => {
      this.currentUser.set(u);
      this.checkAndTriggerAnnouncementModal();
    });
    this.db.observeQuizzes().subscribe(list => this.quizzes.set(list.filter(q => q.status !== 'draft')));
    this.db.observeExamAttempts().subscribe(list => {
      const user = this.currentUser();
      if (user) this.examAttempts.set(this.db.getStudentExamAttempts(user.id));
    });

    this.db.observeAssessmentSubmissions().subscribe(list => {
      this.assessmentSubmissions.set(list);
      const user = this.currentUser();
      if (user) {
        const mySubs = list
          .filter(s => s.studentId === user.id)
          .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
        const pending = mySubs.find(s => s.status === 'pending');
        const corrected = mySubs.find(s => s.status === 'corrected');
        this.currentStudentPendingSubmission.set(pending || null);
        this.currentStudentCorrectedSubmission.set(corrected || null);
        this.checkAndTriggerAnnouncementModal();
      }
    });

    this.db.observeAssessmentSessionConfig().subscribe(cfg => {
      if (cfg) {
        this.assessmentSessionConfig.set(cfg);
        this.checkAndTriggerAnnouncementModal();
      }
    });

    this.db.observeLessons().subscribe(list => {
      this.lessons.set(list);
      if (this.selectedLessonIds().length === 0 && list.length > 0) {
        this.selectedLessonIds.set(list.map(l => l.id));
      }
      if (!this.genAssessment()) {
        this.triggerGenerateAssessment(false);
      }
    });

    this.db.observeOfficialAssessmentQuestions().subscribe(qList => {
      this.officialAssessmentQuestions.set(qList);
      if (qList && qList.length > 0) {
        this.isOfficialSaved.set(true);
        this.checkAndTriggerAnnouncementModal();
      }
    });

  }

  // Filter modules in Hub
  
  pendingSubmissionsCount = computed(() =>
    this.assessmentSubmissions().filter(s => s.status === 'pending').length
  );

  correctedSubmissionsCount = computed(() =>
    this.assessmentSubmissions().filter(s => s.status === 'corrected').length
  );

  averageOverallScore = computed(() => {
    const list = this.assessmentSubmissions().filter(s => s.status === 'corrected' && s.overallScore);
    if (list.length === 0) return 0;
    const sum = list.reduce((acc, s) => acc + (s.overallScore || 0), 0);
    return Math.round(sum / list.length);
  });

  filteredFolders = computed(() => {
    const q = this.folderSearchQuery().trim().toLowerCase();
    const filter = this.folderFilterStatus();
    return this.assessmentSubmissions().filter(s => {
      const matchQuery = !q || s.studentName.toLowerCase().includes(q) || (s.studentEmail && s.studentEmail.toLowerCase().includes(q));
      const matchStatus = filter === 'all' || s.status === filter;
      return matchQuery && matchStatus;
    });
  });

  filteredModules = computed(() => {
    const f = this.activeSubscoreFilter();
    if (f === 'all') return this.detQuestionBank;
    return this.detQuestionBank.filter(m => m.subscore === f);
  });

  examQuizzes = computed<Quiz[]>(() =>
    this.quizzes().filter(q => q.isOfficialExam && (q.isExamActive || q.status === 'published') && q.questions.length > 0)
  );

  myAttempts = computed<ExamAttempt[]>(() =>
    [...this.examAttempts()].sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
  );

  currentDetQuestion = computed(() => {
    const seq = this.detTestSequence();
    const idx = this.currentDetIndex();
    return seq[idx] || null;
  });

  isLastQuestion = computed(() => {
    return this.currentDetIndex() >= this.detTestSequence().length - 1;
  });

  // Module visual helpers
  getModuleBg(subscore: string): string {
    switch (subscore) {
      case 'literacy': return '#EEF2FF';
      case 'comprehension': return '#E0F2FE';
      case 'production': return '#FEF3C7';
      case 'conversation': return '#ECFDF5';
      default: return '#EEF2FF';
    }
  }

  getModuleColor(subscore: string): string {
    switch (subscore) {
      case 'literacy': return '#4F46E5';
      case 'comprehension': return '#0284C7';
      case 'production': return '#D97706';
      case 'conversation': return '#059669';
      default: return '#4F46E5';
    }
  }

  getSubscoreLabel(subscore: string): string {
    switch (subscore) {
      case 'literacy': return this.t('Compréhension Écrite', 'Literacy');
      case 'comprehension': return this.t('Compréhension Orale', 'Comprehension');
      case 'production': return this.t('Production Écrite', 'Production');
      case 'conversation': return this.t('Production Orale', 'Conversation');
      default: return subscore;
    }
  }

  getModuleDescription(module: DetQuestion): string {
    switch (module.type) {
      case 'write-photo': return this.t("Rédigez une ou plusieurs phrases décrivant l'image en 1 minute.", "Write one or more sentences describing the image in 1 minute.");
      case 'speak-photo': return this.t("Décrivez l'image à l'oral pendant au moins 30 à 90 secondes.", "Speak for 30 to 90 seconds describing the photo in English.");
      case 'read-complete': return this.t("Complétez les lettres manquantes pour chaque mot incomplet.", "Type the missing letters to complete each word in the passage.");
      case 'read-select': return this.t("Identifiez les vrais mots anglais parmi les néologismes.", "Select the real English words in the list within 60 seconds.");
      case 'listen-type': return this.t("Écoutez l'énoncé audio et tapez exactement ce que vous entendez.", "Type the statement that you hear with accurate spelling.");
      case 'read-aloud': return this.t("Lisez la phrase à haute voix avec le micro en 20 secondes.", "Read the sentence out loud into the microphone.");
      case 'read-write': return this.t("Rédigez une réponse argumentée d'au moins 50 mots en 5 minutes.", "Respond to the prompt with at least 50 words in 5 minutes.");
      case 'listen-speak': return this.t("Écoutez la question et exprimez votre opinion oralement.", "Listen to the prompt and speak your opinion for 90 seconds.");
      default: return '';
    }
  }

  formatSec(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s > 0 ? s + 's' : ''}` : `${s}s`;
  }

  formatDetTimer(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  getWordCount(text: string): number {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  }

  // STARTING TESTS (LESSON-BASED ASSESSMENT A2-B2)
  checkAndTriggerAnnouncementModal() {
    const user = this.currentUser();
    if (!user || user.role === 'teacher' || user.role === 'admin') return;
    if (this.currentStudentPendingSubmission() || this.currentStudentCorrectedSubmission()) return;

    try {
      if (sessionStorage.getItem('speakup_exam_announcement_dismissed') === 'true') {
        return;
      }
    } catch (e) {}

    const hasOfficial = this.officialAssessmentQuestions().length > 0 || this.isOfficialSaved() || this.assessmentSessionConfig()?.isActive;
    if (hasOfficial) {
      this.showStudentExamAnnouncementModal.set(true);
    }
  }

  startOfficialFromAnnouncement() {
    this.showStudentExamAnnouncementModal.set(false);
    this.openPreExamBriefing();
  }

  closeAnnouncementModal() {
    this.showStudentExamAnnouncementModal.set(false);
    try {
      sessionStorage.setItem('speakup_exam_announcement_dismissed', 'true');
    } catch (e) {}
  }

  openPreExamBriefing() {
    this.preExamAgreed.set(true);
    this.showPreExamBriefingModal.set(true);
  }

  closePreExamBriefing() {
    this.showPreExamBriefingModal.set(false);
  }

  confirmAndStartOfficialExam() {
    this.preExamAgreed.set(true);
    this.showPreExamBriefingModal.set(false);
    this.showStudentExamAnnouncementModal.set(false);
    this.isOfficialExam.set(true);
    this.tabSwitchViolations.set(0);

    // Request Fullscreen
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {}

    // Start Anti-Cheat Monitoring
    this.startAntiCheatMonitoring();

    // Start Test Sequence
    this.startFullDetSampleTest();
  }

  startAntiCheatMonitoring() {
    this.stopAntiCheatMonitoring();

    this.boundVisibilityHandler = () => {
      if (this.view() === 'det-test' && (document.hidden || document.visibilityState === 'hidden')) {
        this.registerAntiCheatViolation('Changement d\'onglet ou minimisation de la fenêtre');
      }
    };

    this.boundBlurHandler = () => {
      if (this.view() === 'det-test') {
        this.registerAntiCheatViolation('Perte de focus fenêtre');
      }
    };

    this.boundBeforeUnloadHandler = (e: BeforeUnloadEvent) => {
      if (this.view() === 'det-test') {
        e.preventDefault();
        e.returnValue = 'Votre examen officiel SpeakUp est en cours. Si vous quittez, vos réponses incomplètes seront soumises.';
      }
    };

    this.boundBlockHandler = (e: Event) => {
      if (this.view() === 'det-test') {
        e.preventDefault();
      }
    };

    this.boundFullscreenHandler = () => {
      if (this.view() === 'det-test') {
        if (!document.fullscreenElement) {
          this.registerAntiCheatViolation("Sortie du mode plein écran détectée");
        }
      }
    };

    document.addEventListener('visibilitychange', this.boundVisibilityHandler);
    window.addEventListener('blur', this.boundBlurHandler);
    window.addEventListener('beforeunload', this.boundBeforeUnloadHandler);
    document.addEventListener('fullscreenchange', this.boundFullscreenHandler);
    document.addEventListener('copy', this.boundBlockHandler);
    document.addEventListener('paste', this.boundBlockHandler);
    document.addEventListener('cut', this.boundBlockHandler);
    document.addEventListener('contextmenu', this.boundBlockHandler);
  }

  stopAntiCheatMonitoring() {
    if (this.boundVisibilityHandler) {
      document.removeEventListener('visibilitychange', this.boundVisibilityHandler);
      this.boundVisibilityHandler = null;
    }
    if (this.boundBlurHandler) {
      window.removeEventListener('blur', this.boundBlurHandler);
      this.boundBlurHandler = null;
    }
    if (this.boundBeforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.boundBeforeUnloadHandler);
      this.boundBeforeUnloadHandler = null;
    }
    if (this.boundFullscreenHandler) {
      document.removeEventListener('fullscreenchange', this.boundFullscreenHandler);
      this.boundFullscreenHandler = null;
    }
    if (this.boundBlockHandler) {
      document.removeEventListener('copy', this.boundBlockHandler);
      document.removeEventListener('paste', this.boundBlockHandler);
      document.removeEventListener('cut', this.boundBlockHandler);
      document.removeEventListener('contextmenu', this.boundBlockHandler);
      this.boundBlockHandler = null;
    }

    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}
  }

  async registerAntiCheatViolation(reason: string) {
    if (this.view() !== 'det-test' || this.violationCooldown) return;
    this.violationCooldown = true;
    setTimeout(() => { this.violationCooldown = false; }, 1000);

    const current = this.tabSwitchViolations() + 1;
    this.tabSwitchViolations.set(current);

    // Strict threshold: On the 3rd infraction, EXPEL & TERMINATE immediately!
    if (current >= 3) {
      await this.terminateExamDueToCheating(reason);
      return;
    }

    this.showAntiCheatWarningModal.set(true);
  }

  async terminateExamDueToCheating(reason: string) {
    this.showAntiCheatWarningModal.set(false);
    this.stopAntiCheatMonitoring();
    this.clearDetTimer();
    await this.stopAudioRecording();

    // Exit fullscreen
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (e) {}

    const user = this.currentUser();
    if (user) {
      const q = this.currentDetQuestion();
      const currentAnswers = { ...this.detSessionAnswers() };
      if (q && !currentAnswers[q.id]) {
        currentAnswers[q.id] = {
          given: this.currentTextAnswer || '(Non complété - Interrompu)',
          givenText: this.currentTextAnswer || '(Non complété - Interrompu)',
          audioUrl: this.recordedAudioBase64 || this.recordedAudioUrl || undefined,
          correct: false,
          score: 0,
          wordCount: this.getWordCount(this.currentTextAnswer)
        };
      }

      const seq = this.detTestSequence();
      const questionsData: AssessmentQuestionAnswer[] = seq.map((item) => {
        const ans = currentAnswers[item.id];
        return {
          questionId: item.id,
          type: item.type,
          title: item.titleFr || item.titleEn,
          subscore: item.subscore,
          promptText: item.promptText,
          audioPromptText: item.audioText,
          studentAnswerText: ans?.givenText || ans?.given || '(Épreuve interrompue pour tricherie)',
          studentAudioUrl: ans?.audioUrl || undefined,
          timeSpentSec: ans?.timeSpentSec || 30,
          wordCount: ans?.wordCount || 0,
          autoScore: 0,
          teacherScore: 0,
          teacherComment: `Session invalidée : ${this.tabSwitchViolations()} sorties d'écran / changements d'onglets constatés. Motif: ${reason}`
        };
      });

      try {
        const disqualifiedSub = await this.db.submitAssessment({
          studentId: user.id,
          studentName: user.name,
          studentEmail: (user as any).email || '',
          studentAvatar: user.avatar || user.name.slice(0, 2).toUpperCase(),
          testTitle: 'SpeakUp English Assessment (SET)',
          submittedAt: new Date().toISOString(),
          durationSeconds: 300,
          status: 'pending',
          questions: questionsData,
          antiCheatReport: {
            tabSwitches: this.tabSwitchViolations(),
            fullscreenExits: this.tabSwitchViolations(),
            pasteAttempts: 0,
            integrityScore: 0,
            completedInSingleSession: false
          }
        });

        this.currentStudentPendingSubmission.set(disqualifiedSub);
      } catch (e) {
        console.error('Error submitting disqualified assessment:', e);
      }
    }

    this.isOfficialExam.set(false);
    this.view.set('det-disqualified');
  }

  dismissAntiCheatWarning() {
    this.showAntiCheatWarningModal.set(false);
    // Re-request fullscreen if lost
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch (e) {}
  }

  startFullDetSampleTest() {
    this.isFullTestMode.set(true);
    this.isOfficialExam.set(true);
    this.tabSwitchViolations.set(0);
    // If official lesson-based assessment is defined by teacher, load it!
    const official = this.officialAssessmentQuestions();
    let seq: DetQuestion[];
    if (official && official.length > 0) {
      seq = [...official];
    } else {
      // Fallback: generate dynamically from course lessons (A2-B2)
      const generated = this.assessmentGenerator.generateAssessmentFromLessons(this.lessons(), 'A2-B2');
      seq = generated.questions;
    }
    this.detTestSequence.set(seq);
    this.currentDetIndex.set(0);
    this.detSessionAnswers.set({});
    this.loadDetQuestion(0);
    this.startAntiCheatMonitoring();
    this.view.set('det-test');
  }

  // --- GENERATOR CONTROLS (DYNAMIC & REACTIVE) ---
  openGeneratorTab() {
    this.teacherModeTab.set('generator');
    this.closeSubmissionFolder();
    if (!this.genAssessment()) {
      this.triggerGenerateAssessment(false);
    }
  }

  setGeneratorLevel(lvl: 'A2' | 'B1' | 'B2' | 'A2-B2') {
    this.targetGeneratorLevel.set(lvl);
    this.triggerGenerateAssessment(true);
  }

  isLessonSelected(id: string): boolean {
    return this.selectedLessonIds().includes(id);
  }

  toggleLessonSelection(id: string) {
    const current = this.selectedLessonIds();
    if (current.includes(id)) {
      this.selectedLessonIds.set(current.filter(x => x !== id));
    } else {
      this.selectedLessonIds.set([...current, id]);
    }
    this.triggerGenerateAssessment(false);
  }

  toggleSelectAllLessons() {
    if (this.selectedLessonIds().length === this.lessons().length) {
      this.selectedLessonIds.set([]);
    } else {
      this.selectedLessonIds.set(this.lessons().map(l => l.id));
    }
    this.triggerGenerateAssessment(false);
  }

  async triggerGenerateAssessment(showAnimation: boolean = true, autoSaveAsOfficial: boolean = false) {
    if (showAnimation) {
      this.isGenerating.set(true);
      await new Promise(r => setTimeout(r, 350));
    }

    try {
      const lessonsList = this.lessons();
      const level = this.targetGeneratorLevel();
      const selectedIds = this.selectedLessonIds().length > 0 ? this.selectedLessonIds() : undefined;

      const meta = this.assessmentGenerator.generateAssessmentFromLessons(
        lessonsList,
        level,
        selectedIds
      );
      this.genAssessment.set(meta);

      if (autoSaveAsOfficial) {
        this.isSavingOfficial.set(true);
        try {
          await this.db.saveOfficialAssessmentQuestions(meta.questions);
          this.isOfficialSaved.set(true);
          this.officialAssessmentQuestions.set(meta.questions);
          this.saveSuccessNotification.set(
            `Évaluation ${level} générée et activée avec succès comme Examen Officiel de la classe (${meta.questions.length} épreuves réelles) !`
          );
          this.dialogService.alert(
            'Examen Officiel Activé avec Succès !',
            `L'évaluation « ${meta.title} » (${meta.questions.length} épreuves réelles CEFR ${level}) a été générée et activée comme Examen Officiel de la classe pour la période du 11/08/2026 au 18/08/2026. Tous les élèves de la classe y ont désormais accès avec le protocole anti-triche sécurisé.`,
            'success'
          );
        } finally {
          this.isSavingOfficial.set(false);
        }
      } else if (showAnimation) {
        this.saveSuccessNotification.set(
          `Nouvelle évaluation ${level} générée avec succès (${meta.questions.length} épreuves basées sur vos leçons) ! Vous pouvez la tester ci-dessous ou la publier.`
        );
      }

      if (showAnimation) {
        setTimeout(() => {
          const previewEl = document.getElementById('generated-assessment-preview');
          if (previewEl) {
            previewEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);

        setTimeout(() => {
          this.saveSuccessNotification.set(null);
        }, 6500);
      }
    } catch (e) {
      console.error('Error generating assessment:', e);
      this.dialogService.alert('Erreur', 'Impossible de générer l\'évaluation. Veuillez réessayer.', 'info');
    } finally {
      this.isGenerating.set(false);
    }
  }

  async saveGeneratedAsOfficial() {
    let ga = this.genAssessment();
    if (!ga || !ga.questions || ga.questions.length === 0) {
      await this.triggerGenerateAssessment(false, false);
      ga = this.genAssessment();
    }
    if (!ga || !ga.questions || ga.questions.length === 0) {
      this.dialogService.alert('Attention', 'Veuillez sélectionner au moins une leçon pour générer l\'évaluation.', 'info');
      return;
    }

    this.isSavingOfficial.set(true);
    try {
      await this.db.saveOfficialAssessmentQuestions(ga.questions);
      this.isOfficialSaved.set(true);
      this.officialAssessmentQuestions.set(ga.questions);

      const msg = "L'évaluation a été enregistrée avec succès comme Examen Officiel de la classe ! Tous les élèves passeront désormais ce test (11/08/2026 – 18/08/2026).";
      this.saveSuccessNotification.set(msg);

      this.dialogService.alert(
        'Examen Officiel Activé avec Succès !',
        `L'évaluation « ${ga.title} » (${ga.questions.length} épreuves réelles CEFR ${ga.targetLevel}) est désormais programmée comme Examen Officiel de la classe pour la période du 11/08/2026 au 18/08/2026. Tous les élèves y ont désormais accès avec le dispositif anti-triche activé.`,
        'success'
      );

      setTimeout(() => {
        this.saveSuccessNotification.set(null);
      }, 7000);
    } catch (e) {
      console.error('Error saving official assessment:', e);
      this.dialogService.alert('Erreur', 'Impossible d\'enregistrer l\'examen officiel. Veuillez réessayer.', 'info');
    } finally {
      this.isSavingOfficial.set(false);
    }
  }

  previewGeneratedInSimulator() {
    const ga = this.genAssessment();
    if (!ga) return;
    this.isFullTestMode.set(true);
    this.isOfficialExam.set(true);
    this.tabSwitchViolations.set(0);
    this.detTestSequence.set([...ga.questions]);
    this.currentDetIndex.set(0);
    this.detSessionAnswers.set({});
    this.loadDetQuestion(0);
    this.startAntiCheatMonitoring();
    this.view.set('det-test');
  }


  startSingleModulePractice(module: DetQuestion) {
    this.isFullTestMode.set(false);
    this.detTestSequence.set([module]);
    this.currentDetIndex.set(0);
    this.detSessionAnswers.set({});
    this.loadDetQuestion(0);
    this.view.set('det-test');
  }

  loadDetQuestion(idx: number) {
    this.clearDetTimer();
    this.stopAudioRecording();
    const q = this.detTestSequence()[idx];
    if (!q) return;

    this.currentTextAnswer = '';
    this.blankInputs = q.blanksData ? q.blanksData.map(() => '') : [];
    this.selectedWordSet.clear();
    this.audioPlayCount.set(0);
    this.recordedSeconds.set(0);
    this.recordedAudioUrl = null;
    this.recordedAudioBase64 = null;

    // Ensure timer is at least 3 minutes (180 seconds)
    const limit = Math.max(180, q.timeLimitSec || 180);
    this.detTimeLeft.set(limit);
    this.startDetTimer();

    // Auto-play audio on listen questions if supported
    if (q.type === 'listen-type' || q.type === 'listen-speak') {
      setTimeout(() => {
        this.playQuestionAudio(q.audioText || '', q.audioUrl);
      }, 500);
    }
  }

  startDetTimer() {
    this.clearDetTimer();
    this.detTimerInterval = setInterval(() => {
      const tl = this.detTimeLeft() - 1;
      this.detTimeLeft.set(tl);
      if (tl <= 0) {
        this.clearDetTimer();
        this.submitCurrentDetQuestion();
      }
    }, 1000);
  }

  clearDetTimer() {
    if (this.detTimerInterval) {
      clearInterval(this.detTimerInterval);
      this.detTimerInterval = null;
    }
  }

  // Answer state verification
  isCurrentQuestionAnswered(): boolean {
    const q = this.currentDetQuestion();
    if (!q) return false;

    switch (q.type) {
      case 'grammar-select':
        return !!this.currentTextAnswer && this.currentTextAnswer.trim().length > 0;
      case 'write-photo':
      case 'listen-type':
        return this.currentTextAnswer.trim().length > 3;
      case 'read-write':
        return this.getWordCount(this.currentTextAnswer) >= 5;
      case 'speak-photo':
      case 'read-aloud':
      case 'listen-speak':
        return this.recordedAudioUrl !== null || this.recordedSeconds() >= 5;
      case 'read-complete':
        return this.blankInputs.some(b => b && b.trim().length > 0);
      case 'read-select':
        return this.selectedWordSet.size > 0;
      default:
        return true;
    }
  }

  onTextInputChange() {
    // live reactivity
  }

  onBlankInputChange(idx: number, maxLen: number) {
    if (this.blankInputs[idx] && this.blankInputs[idx].length >= maxLen) {
      // Focus next input automatically
      const next = document.getElementById('blank-' + (idx + 1));
      if (next) (next as HTMLElement).focus();
    }
  }

  toggleWordSelection(word: string) {
    if (this.selectedWordSet.has(word)) {
      this.selectedWordSet.delete(word);
    } else {
      this.selectedWordSet.add(word);
    }
  }

  // Speech synthesis for listen questions
  playQuestionAudio(text: string, audioUrl?: string) {
    if (this.audioPlayCount() >= 3) return;

    // Stop current audio if playing
    if (this.currentPlayingAudio) {
      try {
        this.currentPlayingAudio.pause();
        this.currentPlayingAudio = null;
      } catch (e) {}
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (audioUrl) {
      try {
        const audio = new Audio(audioUrl);
        this.currentPlayingAudio = audio;
        audio.play().catch(err => {
          console.warn('Audio play error, fallback to TTS:', err);
          this.playTtsAudio(text);
        });
      } catch (e) {
        this.playTtsAudio(text);
      }
    } else {
      this.playTtsAudio(text);
    }

    this.audioPlayCount.set(this.audioPlayCount() + 1);
  }

  private playTtsAudio(text: string) {
    if (!text || !('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }

  // --- TEACHER QUESTION CUSTOMIZATION & AUDIO RECORDING METHODS ---
  toggleQuestionEdit(qId: string) {
    if (this.editingQuestionId() === qId) {
      this.editingQuestionId.set(null);
    } else {
      this.editingQuestionId.set(qId);
    }
  }

  loadOfficialExamForEditing() {
    const questions = this.officialAssessmentQuestions();
    if (!questions || questions.length === 0) {
      this.dialogService.alert('Aucun examen officiel', 'Aucun examen officiel n\'est encore enregistré. Vous pouvez en générer un ci-dessous.', 'info');
      return;
    }
    this.genAssessment.set({
      id: 'official-assessment-' + Date.now(),
      title: 'Examen Officiel SpeakUp (Personnalisable)',
      generatedAt: new Date().toISOString(),
      targetLevel: this.targetGeneratorLevel(),
      questions: JSON.parse(JSON.stringify(questions)),
      sourceLessonCount: this.lessons().length,
      sourceLessonTitles: this.lessons().map(l => l.title),
      vocabularyTestedCount: 20,
      estimatedDurationMin: 60
    });
    this.teacherModeTab.set('generator');
    this.dialogService.alert('Examen Officiel Prêt à Modifier', 'Toutes les 20 épreuves actuelles sont chargées. Vous pouvez modifier les textes, enregistrer vos propres audios pour les dictées et interviews, puis cliquer sur « Sauvegarder les Modifications ».', 'success');
  }

  async startTeacherAudioRecording(q: DetQuestion) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      this.teacherAudioChunks = [];
      const mimeType = this.getBestAudioMimeType();
      const options: MediaRecorderOptions = { audioBitsPerSecond: 128000 };
      if (mimeType) options.mimeType = mimeType;
      this.teacherMediaRecorder = new MediaRecorder(stream, options);

      this.teacherMediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.teacherAudioChunks.push(e.data);
      };

      this.teacherMediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.teacherAudioChunks, { type: this.teacherMediaRecorder?.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          q.audioUrl = reader.result as string;
          this.dialogService.alert('Audio Enregistré !', 'Votre enregistrement vocal a été associé à cette épreuve. Vous pouvez l\'écouter avec le bouton de lecture.', 'success');
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      this.teacherMediaRecorder.start(250);
      this.isTeacherRecording.set(true);
      this.teacherRecordingQuestionId.set(q.id);
      this.teacherRecordedSeconds.set(0);

      this.teacherTimerInterval = setInterval(() => {
        this.teacherRecordedSeconds.update(s => s + 1);
        if (this.teacherRecordedSeconds() >= 120) {
          this.stopTeacherAudioRecording(q);
        }
      }, 1000);
    } catch (e) {
      console.error('Teacher audio record error:', e);
      this.dialogService.alert('Microphone non disponible', 'Veuillez autoriser l\'accès au microphone dans votre navigateur.', 'info');
    }
  }

  stopTeacherAudioRecording(q: DetQuestion) {
    if (this.teacherTimerInterval) {
      clearInterval(this.teacherTimerInterval);
      this.teacherTimerInterval = null;
    }
    if (this.teacherMediaRecorder && this.teacherMediaRecorder.state !== 'inactive') {
      this.teacherMediaRecorder.stop();
    }
    this.isTeacherRecording.set(false);
    this.teacherRecordingQuestionId.set(null);
  }

  onTeacherAudioUpload(event: Event, q: DetQuestion) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      q.audioUrl = reader.result as string;
      this.dialogService.alert('Audio Importé', `Le fichier « ${file.name} » a été associé avec succès à cette épreuve.`, 'success');
    };
    reader.readAsDataURL(file);
  }

  removeTeacherAudio(q: DetQuestion) {
    q.audioUrl = undefined;
  }

  reRecordAudio() {
    this.stopAudioRecording();
    this.recordedAudioUrl = null;
    this.recordedAudioBase64 = null;
    this.recordedSeconds.set(0);
    this.currentTextAnswer = '';
    this.startAudioRecording();
  }

  // Audio recording
  async toggleAudioRecording() {
    if (this.isRecording()) {
      this.stopAudioRecording();
    } else {
      await this.startAudioRecording();
    }
  }

  getBestAudioMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
        return t;
      }
    }
    return '';
  }

  async startAudioRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 44100 }
      });
      this.audioChunks = [];
      const mimeType = this.getBestAudioMimeType();
      const options: MediaRecorderOptions = { audioBitsPerSecond: 128000 };
      if (mimeType) options.mimeType = mimeType;
      this.mediaRecorder = new MediaRecorder(stream, options);
      const recordedMimeType = this.mediaRecorder.mimeType || mimeType || 'audio/webm';

      this.mediaRecorder.ondataavailable = (e: any) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: recordedMimeType });
        this.recordedAudioUrl = URL.createObjectURL(audioBlob);
        try {
          const reader = new FileReader();
          reader.onloadend = () => {
            this.recordedAudioBase64 = reader.result as string;
            if (!this.currentTextAnswer) {
              this.currentTextAnswer = `[Réponse vocale enregistrée (${this.recordedSeconds()}s)]`;
            }
          };
          reader.readAsDataURL(audioBlob);
        } catch(e) {
          console.warn('Audio base64 error', e);
        }
        stream.getTracks().forEach(t => t.stop());
      };

      this.mediaRecorder.start(250);
      this.isRecording.set(true);
      this.recordedSeconds.set(0);

      // Start recognition if available
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          this.recognitionInstance = new SpeechRecognition();
          this.recognitionInstance.lang = 'en-US';
          this.recognitionInstance.continuous = true;
          this.recognitionInstance.start();
        } catch (e) {
          console.warn('SpeechRecognition unavailable', e);
        }
      }

      const recTimer = setInterval(() => {
        if (!this.isRecording()) {
          clearInterval(recTimer);
          return;
        }
        const s = this.recordedSeconds() + 1;
        this.recordedSeconds.set(s);
        if (s >= 180) { // 3 minutes limit
          this.stopAudioRecording();
        }
      }, 1000);

    } catch (err) {
      console.warn('Microphone error in student exam:', err);
      this.dialogService.alert('Microphone requis', 'Veuillez autoriser l\'accès au microphone pour cette épreuve.', 'info');
    }
  }

  stopAudioRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.isRecording.set(false);
    if (this.recognitionInstance) {
      try { this.recognitionInstance.stop(); } catch (e) {}
      this.recognitionInstance = null;
    }
  }

  // SUBMIT CURRENT QUESTION
  submitCurrentDetQuestion() {
    this.clearDetTimer();
    this.stopAudioRecording();
    const q = this.currentDetQuestion();
    if (!q) return;

    // Score the question
    let score = 0;
    if (q.type === 'grammar-select') {
      const cleanGiven = (this.currentTextAnswer || '').trim().toLowerCase();
      const cleanExpected = (q.correctOption || '').trim().toLowerCase();
      score = cleanGiven === cleanExpected ? 100 : 0;
    } else if (q.type === 'write-photo') {
      const words = this.getWordCount(this.currentTextAnswer);
      score = Math.min(100, Math.round((words / 20) * 80) + 20);
    } else if (q.type === 'read-complete' && q.blanksData) {
      let correct = 0;
      q.blanksData.forEach((b, i) => {
        if ((this.blankInputs[i] || '').trim().toLowerCase() === b.missing.toLowerCase()) {
          correct++;
        }
      });
      score = Math.round((correct / q.blanksData.length) * 100);
    } else if (q.type === 'read-select' && q.wordsList) {
      let correctPicks = 0;
      let totalReal = q.wordsList.filter(w => w.isReal).length;
      q.wordsList.forEach(w => {
        const picked = this.selectedWordSet.has(w.word);
        if (picked && w.isReal) correctPicks++;
        if (picked && !w.isReal) correctPicks = Math.max(0, correctPicks - 1);
      });
      score = Math.round((correctPicks / totalReal) * 100);
    } else if (q.type === 'listen-type') {
      const cleanGiven = this.currentTextAnswer.trim().toLowerCase().replace(/[.,!?;]/g, '');
      const cleanExpected = (q.audioText || '').trim().toLowerCase().replace(/[.,!?;]/g, '');
      score = cleanGiven === cleanExpected ? 100 : (cleanGiven.length > 5 ? 75 : 30);
    } else {
      score = 85; // speaking & essays baseline score
    }

    let answerText = this.currentTextAnswer;
    if (q.type === 'grammar-select') {
      answerText = this.currentTextAnswer ? `Option choisie : ${this.currentTextAnswer}` : '(Aucune réponse)';
    } else if (q.type === 'read-complete' && q.blanksData) {
      answerText = q.blanksData.map((b, i) => b.prefix + (this.blankInputs[i] || '')).join(' ');
    } else if (q.type === 'read-select') {
      answerText = 'Mots choisis : ' + Array.from(this.selectedWordSet).join(', ');
    } else if (q.type === 'speak-photo' || q.type === 'read-aloud' || q.type === 'listen-speak') {
      answerText = this.currentTextAnswer || (this.recordedAudioUrl ? `[Enregistrement vocal ${this.recordedSeconds()}s]` : '[Réponse vocale]');
    }

    const currentAnswers = { ...this.detSessionAnswers() };
    currentAnswers[q.id] = {
      given: answerText,
      givenText: answerText,
      audioUrl: this.recordedAudioBase64 || this.recordedAudioUrl || undefined,
      correct: score >= 60,
      score,
      wordCount: this.getWordCount(answerText)
    };
    this.detSessionAnswers.set(currentAnswers);

    // Proceed to next or finish
    const nextIdx = this.currentDetIndex() + 1;
    if (nextIdx < this.detTestSequence().length) {
      this.currentDetIndex.set(nextIdx);
      this.loadDetQuestion(nextIdx);
    } else {
      this.finishDetTest();
    }
  }

    async finishDetTest() {
    this.clearDetTimer();
    this.stopAudioRecording();
    const answersObj = this.detSessionAnswers();
    const scores = Object.values(answersObj).map((a: any) => a.score);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 75;

    // Convert 0-100 to SpeakUp English Test Scale 10 - 160
    const detScaledScore = Math.round(10 + (avgScore / 100) * 150);

    const litScore = Math.min(160, Math.max(10, detScaledScore + Math.floor(Math.random() * 8 - 4)));
    const compScore = Math.min(160, Math.max(10, detScaledScore + Math.floor(Math.random() * 8 - 4)));
    const convScore = Math.min(160, Math.max(10, detScaledScore + Math.floor(Math.random() * 8 - 4)));
    const prodScore = Math.min(160, Math.max(10, detScaledScore + Math.floor(Math.random() * 8 - 4)));

    let cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' = 'B1';
    if (detScaledScore >= 135) cefr = 'C1';
    else if (detScaledScore >= 115) cefr = 'B2';
    else if (detScaledScore >= 85) cefr = 'B1';
    else if (detScaledScore >= 55) cefr = 'A2';
    else cefr = 'A1';

    const result = {
      overallScore: detScaledScore,
      cefrLevel: cefr,
      subscores: {
        literacy: litScore,
        comprehension: compScore,
        conversation: convScore,
        production: prodScore
      },
      totalQuestions: this.detTestSequence().length
    };
    this.lastDetResult.set(result);

    const user = this.currentUser();
    if (user) {
      const isTeacherOrAdmin = user.role === 'teacher' || user.role === 'admin';

      if (!isTeacherOrAdmin) {
        // Build AssessmentSubmission for Teacher Grading
        const questionsData: AssessmentQuestionAnswer[] = this.detTestSequence().map(q => {
          const ans: any = answersObj[q.id];
          return {
            questionId: q.id,
            type: q.type,
            title: q.titleFr || q.titleEn || q.type,
            subscore: q.subscore,
            prompt: q.promptText || q.audioText || q.titleFr,
            imageUrl: q.imageUrl,
            audioPromptText: q.audioText,
            studentAnswerText: ans?.givenText || ans?.given || '',
            studentAudioUrl: ans?.audioUrl || undefined,
            timeSpentSec: ans?.timeSpentSec || 60,
            wordCount: ans?.wordCount || 0,
            autoScore: ans?.score || 80,
            teacherScore: ans?.score || 80,
            teacherComment: ''
          };
        });

        this.stopAntiCheatMonitoring();
        const newSub = await this.db.submitAssessment({
          studentId: user.id,
          studentName: user.name,
          studentEmail: (user as any).email || '',
          studentAvatar: user.avatar || user.name.slice(0, 2).toUpperCase(),
          testTitle: 'SpeakUp English Assessment (SET)',
          submittedAt: new Date().toISOString(),
          durationSeconds: 900,
          status: 'pending',
          questions: questionsData,
          antiCheatReport: {
            tabSwitches: this.tabSwitchViolations(),
            fullscreenExits: this.tabSwitchViolations(),
            pasteAttempts: 0,
            integrityScore: Math.max(0, 100 - this.tabSwitchViolations() * 25),
            completedInSingleSession: true
          }
        });
        this.isOfficialExam.set(false);

        this.currentStudentPendingSubmission.set(newSub);
        this.view.set('det-pending');
        return;
      }

      // If teacher preview, record attempt
      await this.db.submitExamAttempt({
        studentId: user.id,
        studentName: user.name,
        quizId: 'det-' + Date.now(),
        quizTitle: 'SpeakUp English Assessment (SET Preview)',
        answers: Object.entries(answersObj).map(([k, v]: [string, any], idx) => ({ questionIdx: idx, answer: 'Answer ' + (idx + 1), correct: v.correct })),
        score: avgScore,
        percentage: avgScore,
        timeTakenSeconds: 300,
        completedAt: new Date().toISOString(),
        passed: avgScore >= 60
      });
    }

    this.view.set('det-result');
  }

  getCefrTitle(cefr: string): string {
    switch (cefr) {
      case 'C2': return 'Mastery / Proficient User';
      case 'C1': return 'Effective Operational Proficiency / Advanced';
      case 'B2': return 'Vantage / Upper Intermediate';
      case 'B1': return 'Threshold / Intermediate';
      case 'A2': return 'Waystage / Elementary';
      case 'A1': return 'Breakthrough / Beginner';
      default: return 'Proficient User';
    }
  }

  // --- TEACHER FOLDERS & GRADING METHODS ---
  openSubmissionFolder(sub: AssessmentSubmission) {
    // Clone submission for live editing
    const clone: AssessmentSubmission = JSON.parse(JSON.stringify(sub));
    // Ensure overallScore & subscores initialized
    if (!clone.overallScore) {
      clone.overallScore = this.calculateSuggestedScore(clone);
    }
    if (!clone.cefrLevel) {
      clone.cefrLevel = this.getAutoCefr(clone.overallScore);
    }
    if (!clone.subscores) {
      clone.subscores = {
        literacy: clone.overallScore,
        comprehension: clone.overallScore,
        conversation: clone.overallScore,
        production: clone.overallScore
      };
    }
    if (clone.certificateAwarded === undefined) {
      clone.certificateAwarded = true;
    }
    this.activeSubmission.set(clone);
  }

  closeSubmissionFolder() {
    this.activeSubmission.set(null);
  }

  setQuestionScorePreset(q: AssessmentQuestionAnswer, score: number) {
    q.teacherScore = score;
    const sub = this.activeSubmission();
    if (sub) {
      sub.overallScore = this.calculateSuggestedScore(sub);
      sub.cefrLevel = this.getAutoCefr(sub.overallScore);
      this.recalculateSubscores(sub);
    }
  }

  onQuestionScoreChange() {
    const sub = this.activeSubmission();
    if (sub) {
      sub.overallScore = this.calculateSuggestedScore(sub);
      sub.cefrLevel = this.getAutoCefr(sub.overallScore);
      this.recalculateSubscores(sub);
    }
  }

  calculateSuggestedScore(sub: AssessmentSubmission): number {
    if (!sub.questions || sub.questions.length === 0) return 100;
    const scores = sub.questions.map(q => q.teacherScore ?? q.autoScore ?? 75);
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    // Convert 0-100 to scale 10 - 160
    return Math.min(160, Math.max(10, Math.round(10 + (avg / 100) * 150)));
  }

  recalculateSubscores(sub: AssessmentSubmission) {
    if (!sub.subscores) {
      sub.subscores = { literacy: 100, comprehension: 100, conversation: 100, production: 100 };
    }
    const categories: ('literacy' | 'comprehension' | 'conversation' | 'production')[] = ['literacy', 'comprehension', 'conversation', 'production'];
    categories.forEach(cat => {
      const catQuestions = sub.questions.filter(q => q.subscore === cat);
      if (catQuestions.length > 0) {
        const catAvg = catQuestions.reduce((a, q) => a + (q.teacherScore ?? q.autoScore ?? 75), 0) / catQuestions.length;
        const scaled = Math.min(160, Math.max(10, Math.round(10 + (catAvg / 100) * 150)));
        sub.subscores![cat] = scaled;
      } else {
        sub.subscores![cat] = sub.overallScore || 100;
      }
    });
  }

  getAutoCefr(score: number): 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' {
    if (score >= 135) return 'C1';
    if (score >= 115) return 'B2';
    if (score >= 85) return 'B1';
    if (score >= 55) return 'A2';
    return 'A1';
  }

  async saveAssessmentDraft() {
    const sub = this.activeSubmission();
    if (!sub) return;
    try {
      await this.db.gradeAssessmentSubmission(sub.id, {
        questions: sub.questions,
        overallScore: sub.overallScore,
        cefrLevel: sub.cefrLevel,
        subscores: sub.subscores,
        teacherGlobalComment: sub.teacherGlobalComment
      });
      this.dialogService.alert('Brouillon enregistré', 'Toutes vos corrections ont été sauvegardées. Le dossier reste en attente jusqu\'à validation finale.', 'info');
    } catch (e) {
      console.error(e);
      this.dialogService.alert('Erreur', 'Impossible de sauvegarder le brouillon.', 'info');
    }
  }

  async finalizeAssessmentCorrection() {
    const sub = this.activeSubmission();
    if (!sub) return;

    const teacherName = this.currentUser()?.name || 'Professeur SpeakUp';

    const certNumber = sub.certificateNumber || `SET-2026-${sub.id.slice(-6).toUpperCase()}`;
    try {
      await this.db.gradeAssessmentSubmission(sub.id, {
        status: 'corrected',
        questions: sub.questions,
        overallScore: sub.overallScore,
        cefrLevel: sub.cefrLevel,
        subscores: sub.subscores,
        teacherGlobalComment: sub.teacherGlobalComment,
        gradedBy: teacherName,
        gradedAt: new Date().toISOString(),
        certificateAwarded: sub.certificateAwarded !== false,
        certificateNumber: certNumber,
        certificateIssuedAt: new Date().toISOString()
      });

      this.dialogService.alert(
        'Correction Validée & Certificat Accordé !',
        `Le dossier de ${sub.studentName} a été validé avec succès (Score: ${sub.overallScore}/160 • Niveau CECRL ${sub.cefrLevel}). Le Certificat Officiel SpeakUp (N° ${certNumber}) a été officiellement accordé à l'élève avec votre appréciation et votre signature.`,
        'success'
      );

      this.activeSubmission.set(null);
    } catch (e) {
      console.error(e);
      this.dialogService.alert('Erreur', 'Impossible de valider la correction.', 'info');
    }
  }

  getAvatarGradient(name: string): string {
    const gradients = [
      'linear-gradient(135deg, #4F46E5 0%, #06B6D4 100%)',
      'linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)',
      'linear-gradient(135deg, #2563EB 0%, #38BDF8 100%)',
      'linear-gradient(135deg, #059669 0%, #10B981 100%)',
      'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)'
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  }

  deleteSubmission(subId: string, studentName: string) {
    this.dialogService.confirm(
      'Supprimer ce dossier ?',
      `Êtes-vous sûr de vouloir supprimer l'évaluation de ${studentName} ? Cette action est irréversible.`,
      async () => {
        await this.db.deleteAssessmentSubmission(subId);
        if (this.activeSubmission()?.id === subId) {
          this.activeSubmission.set(null);
        }
      }
    );
  }

  getAudioQuestionsCount(sub: AssessmentSubmission): number {
    return sub.questions.filter(q => q.studentAudioUrl || q.type === 'speak-photo' || q.type === 'read-aloud' || q.type === 'listen-speak').length;
  }

  getWrittenQuestionsCount(sub: AssessmentSubmission): number {
    return sub.questions.filter(q => q.studentAnswerText && !q.studentAudioUrl).length;
  }

  formatSubmissionDate(isoDate: string): string {
    if (!isoDate) return '';
    const d = new Date(isoDate);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  viewMyCorrectedCertificate(sub: AssessmentSubmission) {
    this.lastDetResult.set({
      overallScore: sub.overallScore || 100,
      cefrLevel: sub.cefrLevel || 'B1',
      subscores: sub.subscores || { literacy: 100, comprehension: 100, conversation: 100, production: 100 },
      totalQuestions: sub.questions.length,
      studentName: sub.studentName,
      studentEmail: sub.studentEmail,
      certificateNumber: sub.certificateNumber || `SET-2026-${sub.id.slice(-6).toUpperCase()}`,
      certificateAwarded: sub.certificateAwarded !== false,
      gradedBy: sub.gradedBy || 'Professeur de la Classe',
      gradedAt: sub.gradedAt || sub.submittedAt,
      teacherGlobalComment: sub.teacherGlobalComment || 'Excellente maîtrise des compétences écrites et orales, conformité aux exigences du niveau CECRL.',
      antiCheatReport: sub.antiCheatReport
    });
    this.view.set('det-result');
  }

  previewCertificateForActiveSubmission() {
    const sub = this.activeSubmission();
    if (!sub) return;
    this.viewMyCorrectedCertificate(sub);
  }

  setAllQuestionsScore(score: number) {
    const sub = this.activeSubmission();
    if (!sub || !sub.questions) return;
    sub.questions.forEach(q => {
      q.teacherScore = score;
    });
    sub.overallScore = this.calculateSuggestedScore(sub);
    sub.cefrLevel = this.getAutoCefr(sub.overallScore);
    this.recalculateSubscores(sub);
  }

  recalculateFromQuestions(sub: AssessmentSubmission) {
    sub.overallScore = this.calculateSuggestedScore(sub);
    sub.cefrLevel = this.getAutoCefr(sub.overallScore);
    this.recalculateSubscores(sub);
  }

  hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }


  confirmExitTest() {
    if (this.isOfficialExam()) {
      this.dialogService.confirm(
        'Attention : Quitter l\'Examen Officiel ?',
        'Attention : Vous êtes en train de passer votre session officielle SpeakUp (11/08/2026 – 18/08/2026). Vous devez terminer votre examen en une seule traite. Si vous quittez maintenant, vos réponses partielles seront soumises telles quelles et vous ne pourrez plus recommencer.',
        () => {
          this.stopAntiCheatMonitoring();
          this.clearDetTimer();
          this.stopAudioRecording();
          this.submitCurrentDetQuestion();
          this.isOfficialExam.set(false);
          this.view.set('hub');
        }
      );
    } else {
      this.dialogService.confirm(
        this.t("Quitter le test ?", "Quit Test?"),
        this.t("Voulez-vous vraiment quitter ce test d'anglais ? Vos réponses en cours ne seront pas sauvegardées.", "Are you sure you want to leave this English test? Your progress will not be saved."),
        () => {
          this.stopAntiCheatMonitoring();
          this.clearDetTimer();
          this.stopAudioRecording();
          this.view.set('hub');
        }
      );
    }
  }

  printDetResult(res: any) {
    const win = window.open('', '_blank');
    if (!win) return;
    const origin = window.location.origin;
    const studentName = res.studentName || this.currentUser()?.name || 'SpeakUp Candidate';
    const certNumber = res.certificateNumber || 'SET-2026-OFFICIAL';
    const gradedBy = res.gradedBy ? (res.gradedBy.startsWith('Prof.') ? res.gradedBy : `Prof. ${res.gradedBy}`) : 'SpeakUp Academic Faculty';
    const gradedAt = res.gradedAt ? new Date(res.gradedAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Official Session 2026';
    const teacherComment = res.teacherGlobalComment || 'Demonstrates exceptional command of the English language with rich vocabulary range, clear pronunciation, and accurate grammatical structures.';

    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Official Certificate of English Proficiency — ${studentName}</title>
        <style>
          @page { size: landscape; margin: 8mm; }
          body {
            font-family: 'Segoe UI', -apple-system, Arial, sans-serif;
            background: #F8FAFC;
            color: #1E1B4B;
            margin: 0;
            padding: 16px;
            display: flex;
            justify-content: center;
            align-items: center;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .certificate-container {
            width: 100%;
            max-width: 1020px;
            background: #FFFDF9;
            border: 5px double #D97706;
            border-radius: 18px;
            padding: 32px 36px;
            box-sizing: border-box;
            position: relative;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0,0,0,0.06);
          }
          .logo {
            width: 78px;
            height: 78px;
            object-fit: contain;
            margin-bottom: 8px;
          }
          h1 {
            color: #1E1B4B;
            font-size: 26px;
            margin: 6px 0;
            letter-spacing: 0.5px;
            font-weight: 900;
            font-family: 'Outfit', 'Georgia', serif;
          }
          .institution {
            color: #92400E;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
          }
          .subtitle {
            color: #64748B;
            font-size: 13px;
            font-style: italic;
            margin-bottom: 12px;
          }
          .badge {
            display: inline-block;
            background: #FEF3C7;
            color: #92400E;
            border: 1px solid #FDE68A;
            padding: 3px 14px;
            border-radius: 20px;
            font-size: 11.5px;
            font-weight: 800;
            margin-bottom: 16px;
          }
          .student-box {
            background: rgba(255, 255, 255, 0.85);
            border-radius: 12px;
            padding: 14px 20px;
            margin: 0 auto 18px auto;
            max-width: 800px;
            border: 1px solid #F1F5F9;
          }
          .student-name {
            font-size: 30px;
            font-weight: 900;
            color: #1E1B4B;
            margin: 4px 0;
            font-family: 'Outfit', sans-serif;
          }
          .scores-bar {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 28px;
            background: #FFFFFF;
            border: 1.5px solid #E2E8F0;
            border-radius: 12px;
            padding: 14px 20px;
            margin-bottom: 18px;
          }
          .score-val {
            font-size: 46px;
            font-weight: 900;
            color: #4F46E5;
            line-height: 1;
          }
          .cefr-pill {
            background: #4F46E5;
            color: white;
            padding: 6px 18px;
            border-radius: 20px;
            font-weight: 800;
            font-size: 14px;
            display: inline-block;
          }
          .subscores-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
          }
          .subscore-card {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            padding: 10px;
            text-align: center;
          }
          .footer-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-top: 16px;
            border-top: 1.5px solid #FDE68A;
            text-align: left;
          }
          @media print {
            body { padding: 0; background: white; }
            .certificate-container { border: 4px double #D97706; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="certificate-container">
          <img src="${origin}/logo.png" class="logo" alt="SpeakUp Logo" />
          <div class="institution">SPEAKUP LEARNING ACADEMY • ACADEMIC EVALUATION BOARD</div>
          <h1>OFFICIAL CERTIFICATE OF ENGLISH PROFICIENCY</h1>
          <div class="subtitle">SpeakUp English Assessment (SET) • Common European Framework of Reference for Languages (CEFR)</div>
          <div class="badge">Certificate No. ${certNumber} • Validated & Awarded by Faculty</div>

          <div class="student-box">
            <div style="font-size:12px; font-style:italic; color:#64748B;">This official certificate of proficiency is proudly awarded to:</div>
            <div class="student-name">${studentName}</div>
            <div style="font-size:12.5px; color:#475569;">For successfully completing the official SpeakUp English Assessment (20 timed proficiency modules) with the following certified results:</div>
          </div>

          <div class="scores-bar">
            <div>
              <div style="font-size:11px; font-weight:800; color:#64748B; text-transform:uppercase;">Certified Overall Score</div>
              <div class="score-val">${res.overallScore} <span style="font-size:18px; color:#94A3B8;">/ 160</span></div>
            </div>
            <div style="width:1.5px; height:45px; background:#E2E8F0;"></div>
            <div>
              <div style="font-size:11px; font-weight:800; color:#64748B; text-transform:uppercase; margin-bottom:4px;">CEFR Proficiency Level</div>
              <div class="cefr-pill">Level ${res.cefrLevel} — ${this.getCefrTitle(res.cefrLevel)}</div>
            </div>
          </div>

          <div class="subscores-grid">
            <div class="subscore-card">
              <div style="font-size:11px; color:#64748B; font-weight:700;">Literacy (Reading & Writing)</div>
              <div style="font-size:16px; font-weight:900; color:#4F46E5;">${res.subscores.literacy} / 160</div>
            </div>
            <div class="subscore-card">
              <div style="font-size:11px; color:#64748B; font-weight:700;">Comprehension (Reading & Listening)</div>
              <div style="font-size:16px; font-weight:900; color:#0284C7;">${res.subscores.comprehension} / 160</div>
            </div>
            <div class="subscore-card">
              <div style="font-size:11px; color:#64748B; font-weight:700;">Conversation (Listening & Speaking)</div>
              <div style="font-size:16px; font-weight:900; color:#059669;">${res.subscores.conversation} / 160</div>
            </div>
            <div class="subscore-card">
              <div style="font-size:11px; color:#64748B; font-weight:700;">Production (Writing & Speaking)</div>
              <div style="font-size:16px; font-weight:900; color:#D97706;">${res.subscores.production} / 160</div>
            </div>
          </div>

          <div class="footer-section">
            <div style="flex:1;">
              <div style="font-size:11px; font-weight:800; color:#78350F; text-transform:uppercase;">Academic Faculty Evaluation & Endorsement:</div>
              <div style="font-size:12px; font-style:italic; color:#334155; margin:3px 0 8px 0;">« ${teacherComment} »</div>
              <div style="font-size:12.5px; font-weight:800; color:#1E1B4B;">Certified & Endorsed by: <span style="color:#4F46E5;">${gradedBy}</span></div>
              <div style="font-size:11px; color:#64748B;">Issued on ${gradedAt} · SpeakUp Learning Platform</div>
            </div>

            <div style="text-align:center;">
              <svg width="74" height="74" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="#FFFBEB" stroke="#D97706" stroke-width="3" stroke-dasharray="4 2"/>
                <circle cx="50" cy="50" r="38" fill="#F59E0B" stroke="#B45309" stroke-width="1.5"/>
                <path d="M50 26 L54 37 L66 37 L56 45 L60 56 L50 49 L40 56 L44 45 L34 37 L46 37 Z" fill="#FFFBEB"/>
                <text x="50" y="70" font-size="7.5" font-weight="900" fill="#78350F" text-anchor="middle">SPEAKUP CERTIFIED</text>
                <text x="50" y="79" font-size="6" font-weight="800" fill="#92400E" text-anchor="middle">★ 2026 OFFICIAL ★</text>
              </svg>
              <div style="font-size:9.5px; font-weight:800; color:#92400E; margin-top:2px;">OFFICIAL SEAL</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  }

  // =========================================================
  // TEACHER EXAM METHODS (Backward Compatibility)
  // =========================================================
  startTeacherExam(quiz: Quiz) {
    if (quiz.isOfficialExam || quiz.id === 'official-set-exam-2026') {
      this.openPreExamBriefing();
      return;
    }
    const user = this.currentUser();
    if (!user) return;
    if (this.hasAttempted(quiz.id)) {
      this.dialogService.alert('Déjà tenté', 'Vous avez déjà passé cet examen.', 'info');
      return;
    }
    this.activeQuiz.set({ ...quiz, questions: this.shuffleArray([...quiz.questions]) });
    this.examAnswers.set({});
    this.currentQuestionIdx.set(0);
    this.startTime = Date.now();
    const minutes = this.parseMinutes(quiz.timeLimit);
    this.timeLeft.set(minutes * 60);
    this.startTeacherTimer();
    this.view.set('teacher-exam');
  }

  startTeacherTimer() {
    this.clearTeacherTimer();
    this.timerInterval = setInterval(() => {
      const tl = this.timeLeft() - 1;
      this.timeLeft.set(tl);
      if (tl <= 0) {
        this.clearTeacherTimer();
        this.submitExam();
      }
    }, 1000);
  }

  clearTeacherTimer() {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

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

  currentQuestion = computed(() => {
    const quiz = this.activeQuiz();
    if (!quiz) return null;
    return quiz.questions[this.currentQuestionIdx()] ?? null;
  });

  answeredCount = computed(() => Object.keys(this.examAnswers()).length);

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
    this.clearTeacherTimer();
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

    const xpMax = quiz.points || 100;
    const xp = percentage >= 60 ? xpMax : Math.round(xpMax * 0.2);
    this.db.updateUserXP(user.id, xp, true);

    this.view.set('hub');
    this.dialogService.alert('Examen Terminé', `Félicitations ! Vous avez obtenu ${percentage}%.`, 'info');
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
        <p><strong>Résultat :</strong> <span style="color:${att.passed ? '#059669' : '#DC2626'}; font-weight:bold">${att.passed ? 'RÉUSSI' : 'ÉCHOUÉ'}</span></p>
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

  ngOnDestroy() {
    this.stopAntiCheatMonitoring();
    this.clearDetTimer();
    this.clearTeacherTimer();
    this.stopAudioRecording();
  }
}
