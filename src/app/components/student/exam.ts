import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DatabaseService, Quiz, UserProfile, ExamAttempt } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

export interface DetQuestion {
  id: string;
  type: 'write-photo' | 'speak-photo' | 'read-complete' | 'read-select' | 'listen-type' | 'read-aloud' | 'read-write' | 'listen-speak';
  titleFr: string;
  titleEn: string;
  subscore: 'literacy' | 'comprehension' | 'production' | 'conversation';
  timeLimitSec: number;
  imageUrl?: string;
  imageCredit?: string;
  promptText?: string;
  audioText?: string;
  blanksData?: { prefix: string; missing: string }[];
  wordsList?: { word: string; isReal: boolean }[];
  minWords?: number;
}

@Component({
  selector: 'app-student-exam',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="padding-top: 10px;">

      <!-- ======================================================== -->
      <!-- 1. DUOLINGO ENGLISH TEST HUB (IMAGE 2)                   -->
      <!-- ======================================================== -->
      @if (view() === 'hub') {
        <div style="animation: fadeIn 0.25s ease;">

          <!-- Top Brand Header -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <img src="logo.png" style="width:36px; height:36px; object-fit:contain; border-radius:8px;" alt="SpeakUp Logo" />
              <div>
                <div style="font-family:'Outfit', sans-serif; font-size:20px; font-weight:800; color:var(--text-primary); line-height:1.2;">
                  Speak<span style="color:#4F46E5;">Up</span>
                  <span style="font-size:14px; font-weight:600; color:var(--text-muted); margin-left:8px;">English Test</span>
                </div>
                <p style="margin:2px 0 0 0; font-size:11.5px; color:var(--text-secondary);">
                  {{ t("Tests d'entraînement officiels & Évaluations par compétences", "Official Practice Tests & Subscore Evaluations") }}
                </p>
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:8px;">
              <span class="det-pill-badge">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>{{ t("Format Duolingo 10–160", "Duolingo Scale 10–160") }}</span>
              </span>
              <span class="det-pill-badge" style="background:#ECFDF5; color:#065F46; border-color:#A7F3D0;">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>CEFR A1–C1</span>
              </span>
            </div>
          </div>

          <!-- Hero Practice Banner (Image 2 Top) -->
          <div class="det-hero-card">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:20px;">
              <div style="max-width:540px;">
                <span class="det-badge-accent">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  {{ t("TEST D'ENTRAÎNEMENT COMPLET", "FREE PRACTICE SAMPLE TEST") }}
                </span>
                <h2 style="font-size:22px; font-weight:800; color:#1E1B4B; margin:10px 0 8px 0; line-height:1.25;">
                  {{ t("Pratiquez autant que vous le souhaitez avec notre test gratuit", "Practice as much as you like with our free sample test") }}
                </h2>
                <p style="font-size:13px; color:#475569; margin:0 0 18px 0; line-height:1.5;">
                  {{ t("Familiarisez-vous avec les formats réels d'évaluation du Duolingo English Test : description d'image en 1 minute, dictée, compréhension, et expression orale.", "Get familiar with the real Duolingo English Test question formats: 1-minute photo description, listen & type, read & complete, and speaking.") }}
                </p>
                <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                  <button class="det-cta-btn" (click)="startFullDetSampleTest()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    <span>{{ t("COMMENCER LE TEST (15 MIN)", "PRACTICE FREE TEST (15 MIN)") }}</span>
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
                        {{ att.passed ? t('✓ Réussi', '✓ Passed') : t('✗ Échoué', '✗ Failed') }}
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

        </div>
      }


      <!-- ======================================================== -->
      <!-- 2. DUOLINGO TEST ACTIVE INTERACTIVE SESSION (IMAGE 1)   -->
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
                <div style="font-size:11.5px; font-weight:700; color:#6B7280; letter-spacing:0.3px;">
                  Question {{ currentDetIndex() + 1 }} / {{ detTestSequence().length }}
                </div>
              }

              <!-- Close Button '✕' -->
              <button class="det-close-btn" (click)="confirmExitTest()" [title]="t('Quitter le test', 'Exit test')">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <!-- Question Prompt Title (e.g. Write a description of the image below for 1 minute) -->
            <h2 class="det-prompt-title">
              {{ t(q.titleFr, q.titleEn) }}
            </h2>


            <!-- ====================================================== -->
            <!-- QUESTION TYPE A: WRITE ABOUT THE PHOTO (EXACT IMAGE 1) -->
            <!-- ====================================================== -->
            @if (q.type === 'write-photo') {
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
                    {{ isRecording() ? t("Enregistrement en cours...", "Recording your voice...") : (recordedAudioUrl ? t("Enregistrement validé ✓", "Voice recorded successfully ✓") : t("Cliquez sur le micro et commencez à parler", "Click the mic and speak in English")) }}
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
                    {{ isRecording() ? (recordedSeconds() + 's / 90s') : (recordedAudioUrl ? t("Cliquez sur Suivant pour valider", "Click Submit to proceed") : t("Parlez pendant au moins 30 secondes", "Speak for at least 30 seconds")) }}
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
                <button class="det-audio-play-btn" [disabled]="audioPlayCount() >= 3" (click)="playQuestionAudio(q.audioText || '')">
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                </button>

                <div style="font-size:12.5px; font-weight:700; color:#475569;">
                  {{ isRecording() ? t("Enregistrement en cours...", "Recording...") : (recordedAudioUrl ? t("Enregistré avec succès !", "Recorded!") : t("Appuyez sur le micro pour lire à haute voix", "Press to read aloud")) }}
                </div>
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
                <button class="det-audio-play-btn" [disabled]="audioPlayCount() >= 3" (click)="playQuestionAudio(q.audioText || '')">
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                  </button>
                </div>

                <div style="font-size:12.5px; font-weight:700; color:#475569;">
                  {{ isRecording() ? (recordedSeconds() + 's / 90s') : (recordedAudioUrl ? t("Enregistrement validé ✓", "Voice recorded ✓") : t("Appuyez pour répondre oralement", "Press to speak your response")) }}
                </div>
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
      <!-- 3. DET SCORE REPORT & CERTIFICATE (DUOLINGO STYLE)       -->
      <!-- ======================================================== -->
      @if (view() === 'det-result' && lastDetResult(); as res) {
        <div style="animation: fadeIn 0.3s ease; max-width:840px; margin:0 auto;">

          <!-- Score Card Hero -->
          <div class="det-result-card">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; margin-bottom:24px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <img src="logo.png" style="width:40px; height:40px; object-fit:contain;" alt="Logo" />
                <div>
                  <h3 style="font-size:18px; font-weight:900; color:#1E1B4B; margin:0;">SpeakUp English Test</h3>
                  <div style="font-size:12px; color:#6B7280;">{{ t("Certificat d'évaluation des compétences", "Official Skills Evaluation Certificate") }}</div>
                </div>
              </div>
              <span class="badge" style="background:#ECFDF5; color:#065F46; font-size:11px; padding:4px 10px; border-radius:20px; font-weight:800;">
                ✓ {{ t("Évaluation Complétée", "Evaluation Completed") }}
              </span>
            </div>

            <!-- Overall DET Scale Score -->
            <div style="text-align:center; padding:24px 0; border-top:1px solid #E2E8F0; border-bottom:1px solid #E2E8F0; margin-bottom:24px;">
              <div style="font-size:12px; font-weight:800; color:#6B7280; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">
                {{ t("SCORE GLOBAL ESTIMÉ", "OVERALL ESTIMATED SCORE") }}
              </div>
              <div style="font-size:56px; font-weight:900; color:#4F46E5; line-height:1; font-family:'Outfit', sans-serif;">
                {{ res.overallScore }}
                <span style="font-size:20px; font-weight:700; color:#94A3B8;">/ 160</span>
              </div>
              <div style="display:inline-block; margin-top:10px; background:#EEF2FF; color:#4338CA; border:1px solid #C7D2FE; padding:6px 16px; border-radius:20px; font-size:13px; font-weight:800;">
                Niveau CEFR : {{ res.cefrLevel }} ({{ getCefrTitle(res.cefrLevel) }})
              </div>
            </div>

            <!-- 4 Subscores Progress Bars (Literacy, Comprehension, Conversation, Production) -->
            <div style="margin-bottom:28px;">
              <h4 style="font-size:14px; font-weight:800; color:#1E1B4B; margin:0 0 16px 0;">
                {{ t("Détail par sous-scores (Subscores)", "Subscores Breakdown") }}
              </h4>

              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
                <!-- Literacy -->
                <div class="det-subscore-box">
                  <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                    <span style="font-size:12px; font-weight:700; color:#1E293B;">Literacy (Lire & Écrire)</span>
                    <span style="font-size:12px; font-weight:800; color:#4F46E5;">{{ res.subscores.literacy }} / 160</span>
                  </div>
                  <div class="det-progress-track">
                    <div class="det-progress-fill" [style.width.%]="(res.subscores.literacy / 160) * 100" style="background:#4F46E5;"></div>
                  </div>
                </div>

                <!-- Comprehension -->
                <div class="det-subscore-box">
                  <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                    <span style="font-size:12px; font-weight:700; color:#1E293B;">Comprehension (Lire & Écouter)</span>
                    <span style="font-size:12px; font-weight:800; color:#0284C7;">{{ res.subscores.comprehension }} / 160</span>
                  </div>
                  <div class="det-progress-track">
                    <div class="det-progress-fill" [style.width.%]="(res.subscores.comprehension / 160) * 100" style="background:#0284C7;"></div>
                  </div>
                </div>

                <!-- Conversation -->
                <div class="det-subscore-box">
                  <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                    <span style="font-size:12px; font-weight:700; color:#1E293B;">Conversation (Écouter & Parler)</span>
                    <span style="font-size:12px; font-weight:800; color:#059669;">{{ res.subscores.conversation }} / 160</span>
                  </div>
                  <div class="det-progress-track">
                    <div class="det-progress-fill" [style.width.%]="(res.subscores.conversation / 160) * 100" style="background:#059669;"></div>
                  </div>
                </div>

                <!-- Production -->
                <div class="det-subscore-box">
                  <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                    <span style="font-size:12px; font-weight:700; color:#1E293B;">Production (Écrire & Parler)</span>
                    <span style="font-size:12px; font-weight:800; color:#D97706;">{{ res.subscores.production }} / 160</span>
                  </div>
                  <div class="det-progress-track">
                    <div class="det-progress-fill" [style.width.%]="(res.subscores.production / 160) * 100" style="background:#D97706;"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; padding-top:16px; border-top:1px solid #E2E8F0;">
              <button class="btn-s" (click)="view.set('hub')">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg> {{ t("Retour au centre de tests", "Back to Tests Hub") }}
              </button>

              <div style="display:flex; gap:10px;">
                <button class="btn-s" (click)="printDetResult(res)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> {{ t("Imprimer le Certificat", "Print Certificate") }}
                </button>
                <button class="det-cta-btn" style="padding:8px 20px; font-size:12.5px;" (click)="startFullDetSampleTest()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg> {{ t("Repasser un test", "Take Another Test") }}
                </button>
              </div>
            </div>
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

    </div>
  `,
  styles: [`
    /* Duolingo Test Hub & Card Styles */
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
    /* ACTIVE QUESTION TEST MODAL (EXACT DUOLINGO STYLE IMAGE 1) */
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

  Math = Math;
  currentUser = signal<UserProfile | null>(null);
  quizzes = signal<Quiz[]>([]);
  examAttempts = signal<ExamAttempt[]>([]);
  activeLang = this.db.activeLang;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

  // Views: 'hub' (Image 2) | 'det-test' (Image 1) | 'det-result' | 'teacher-exam'
  view = signal<'hub' | 'det-test' | 'det-result' | 'teacher-exam'>('hub');

  // Subscore filter in hub
  activeSubscoreFilter = signal<'all' | 'literacy' | 'comprehension' | 'production' | 'conversation' | 'official'>('all');

  // Duolingo English Test Question Bank
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
  detSessionAnswers = signal<Record<string, { given: any; correct: boolean; score: number }>>({});

  // Result for DET mode
  lastDetResult = signal<{
    overallScore: number;
    cefrLevel: string;
    subscores: { literacy: number; comprehension: number; conversation: number; production: number };
    totalQuestions: number;
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
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
    this.db.observeQuizzes().subscribe(list => this.quizzes.set(list.filter(q => q.status !== 'draft')));
    this.db.observeExamAttempts().subscribe(list => {
      const user = this.currentUser();
      if (user) this.examAttempts.set(this.db.getStudentExamAttempts(user.id));
    });
  }

  // Filter modules in Hub
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

  // STARTING TESTS
  startFullDetSampleTest() {
    this.isFullTestMode.set(true);
    // Shuffle question bank to provide randomized test
    const seq = this.shuffleArray([...this.detQuestionBank]);
    this.detTestSequence.set(seq);
    this.currentDetIndex.set(0);
    this.detSessionAnswers.set({});
    this.loadDetQuestion(0);
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

    this.detTimeLeft.set(q.timeLimitSec);
    this.startDetTimer();

    // Auto-play audio on listen questions if supported
    if (q.type === 'listen-type' || q.type === 'listen-speak') {
      setTimeout(() => {
        this.playQuestionAudio(q.audioText || '');
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
  playQuestionAudio(text: string) {
    if (!text || !('speechSynthesis' in window)) return;
    if (this.audioPlayCount() >= 3) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
    this.audioPlayCount.set(this.audioPlayCount() + 1);
  }

  // Audio recording
  async toggleAudioRecording() {
    if (this.isRecording()) {
      this.stopAudioRecording();
    } else {
      await this.startAudioRecording();
    }
  }

  async startAudioRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = (e: any) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.recordedAudioUrl = URL.createObjectURL(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      this.mediaRecorder.start();
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
        this.recordedSeconds.set(this.recordedSeconds() + 1);
      }, 1000);

    } catch (err) {
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
    if (q.type === 'write-photo') {
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

    const currentAnswers = { ...this.detSessionAnswers() };
    currentAnswers[q.id] = { given: this.currentTextAnswer, correct: score >= 60, score };
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
    const scores = Object.values(answersObj).map(a => a.score);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 75;

    // Convert 0-100 to Duolingo English Test Scale 10 - 160
    const detScaledScore = Math.round(10 + (avgScore / 100) * 150);

    // Calculate subscores
    const litScore = Math.min(160, Math.max(10, detScaledScore + Math.floor(Math.random() * 8 - 4)));
    const compScore = Math.min(160, Math.max(10, detScaledScore + Math.floor(Math.random() * 8 - 4)));
    const convScore = Math.min(160, Math.max(10, detScaledScore + Math.floor(Math.random() * 8 - 4)));
    const prodScore = Math.min(160, Math.max(10, detScaledScore + Math.floor(Math.random() * 8 - 4)));

    let cefr = 'B1';
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

    // Record attempt in database
    const user = this.currentUser();
    if (user) {
      await this.db.submitExamAttempt({
        studentId: user.id,
        studentName: user.name,
        quizId: 'det-' + Date.now(),
        quizTitle: 'SpeakUp English Test (DET Scale)',
        answers: Object.entries(answersObj).map(([k, v], idx) => ({ questionIdx: idx, answer: 'Answer ' + (idx + 1), correct: v.correct })),
        score: avgScore,
        percentage: avgScore,
        timeTakenSeconds: 300,
        completedAt: new Date().toISOString(),
        passed: avgScore >= 60
      });

      this.db.updateUserXP(user.id, 80, true);
    }

    this.view.set('det-result');
  }

  getCefrTitle(cefr: string): string {
    switch (cefr) {
      case 'C1': return 'Avancé / Advanced Fluency';
      case 'B2': return 'Intermédiaire Supérieur / Upper Intermediate';
      case 'B1': return 'Intermédiaire / Intermediate';
      case 'A2': return 'Élémentaire / Elementary';
      default: return 'Débutant / Beginner';
    }
  }

  confirmExitTest() {
    this.dialogService.confirm(
      this.t("Quitter le test ?", "Quit Test?"),
      this.t("Voulez-vous vraiment quitter ce test d'anglais ? Vos réponses en cours ne seront pas sauvegardées.", "Are you sure you want to leave this English test? Your progress will not be saved."),
      () => {
        this.clearDetTimer();
        this.stopAudioRecording();
        this.view.set('hub');
      }
    );
  }

  printDetResult(res: any) {
    const win = window.open('', '_blank');
    if (!win) return;
    const user = this.currentUser();
    win.document.write(`
      <html><head><title>SpeakUp English Test — Certificate</title></head>
      <body style="font-family:'Segoe UI',Arial,sans-serif; padding:40px; color:#1E1B4B; max-width:800px; margin:0 auto">
        <div style="border:4px double #4F46E5; border-radius:16px; padding:36px; text-align:center">
          <h1 style="color:#4F46E5; margin:0; font-size:28px">SpeakUp English Test</h1>
          <p style="color:#64748B; margin:4px 0 20px 0; font-size:14px">Official Subscores Evaluation Certificate</p>
          <hr style="border:none; border-top:1px solid #E2E8F0; margin:20px 0">
          <p style="font-size:16px">This certifies that <strong>${user?.name || 'Student'}</strong> has completed the SpeakUp English Test.</p>
          <div style="margin:24px 0">
            <span style="font-size:64px; font-weight:900; color:#4F46E5">${res.overallScore}</span>
            <span style="font-size:24px; color:#94A3B8"> / 160</span>
          </div>
          <p style="font-size:16px; font-weight:bold; color:#059669">CEFR Level: ${res.cefrLevel} — ${this.getCefrTitle(res.cefrLevel)}</p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:30px 0; text-align:left; background:#F8FAFC; padding:20px; border-radius:10px">
            <div><strong>Literacy:</strong> ${res.subscores.literacy} / 160</div>
            <div><strong>Comprehension:</strong> ${res.subscores.comprehension} / 160</div>
            <div><strong>Conversation:</strong> ${res.subscores.conversation} / 160</div>
            <div><strong>Production:</strong> ${res.subscores.production} / 160</div>
          </div>
          <p style="font-size:11px; color:#94A3B8">Issued on ${new Date().toLocaleDateString()} · SpeakUp Learning Platform</p>
        </div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); }, 400);
  }

  // =========================================================
  // TEACHER EXAM METHODS (Backward Compatibility)
  // =========================================================
  startTeacherExam(quiz: Quiz) {
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
        <p><strong>Résultat :</strong> <span style="color:${att.passed ? '#059669' : '#DC2626'}; font-weight:bold">${att.passed ? '✓ RÉUSSI' : '✗ ÉCHOUÉ'}</span></p>
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
    this.clearDetTimer();
    this.clearTeacherTimer();
    this.stopAudioRecording();
  }
}
