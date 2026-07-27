import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Submission, UserProfile, Quiz, ActivityLog } from '../../services/database.service';

@Component({
  selector: 'app-student-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page hist-page">

      <!-- ===== PREMIUM HERO HEADER ===== -->
      <div class="hist-hero">
        <div class="hist-hero-blob blob1"></div>
        <div class="hist-hero-blob blob2"></div>
        <div style="position:relative; z-index:1">
          <div style="display:flex; align-items:center; gap:14px; margin-bottom:18px">
            <div class="hist-hero-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
            </div>
            <div>
              <h2 style="font-size:17px; font-weight:800; color:white; margin:0 0 2px">Mon Historique</h2>
              <p style="font-size:12px; color:rgba(255,255,255,0.7); margin:0">{{ currentUser()?.name }} · Toutes vos activités</p>
            </div>
          </div>

          <!-- Stats row -->
          <div class="hist-stats-row">
            <div class="hist-hero-stat">
              <div class="hist-hero-stat-icon" style="background:rgba(16,185,129,0.2)">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <div>
                <div style="font-size:20px; font-weight:900; color:white; line-height:1">{{ completedCount() }}</div>
                <div style="font-size:10px; color:rgba(255,255,255,0.65); font-weight:600; text-transform:uppercase; letter-spacing:0.5px">Complétés</div>
              </div>
            </div>
            <div class="hist-hero-sep"></div>
            <div class="hist-hero-stat">
              <div class="hist-hero-stat-icon" style="background:rgba(245,158,11,0.2)">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div>
                <div style="font-size:20px; font-weight:900; color:white; line-height:1">{{ pendingCount() }}</div>
                <div style="font-size:10px; color:rgba(255,255,255,0.65); font-weight:600; text-transform:uppercase; letter-spacing:0.5px">En attente</div>
              </div>
            </div>
            <div class="hist-hero-sep"></div>
            <div class="hist-hero-stat">
              <div class="hist-hero-stat-icon" style="background:rgba(139,92,246,0.25)">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#A78BFA" stroke="#A78BFA" stroke-width="0"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              </div>
              <div>
                <div style="font-size:20px; font-weight:900; color:white; line-height:1">{{ totalXP() }}</div>
                <div style="font-size:10px; color:rgba(255,255,255,0.65); font-weight:600; text-transform:uppercase; letter-spacing:0.5px">XP Total</div>
              </div>
            </div>
          </div>

          <!-- Progress bar -->
          <div style="margin-top:16px">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px">
              <span style="font-size:11.5px; font-weight:700; color:rgba(255,255,255,0.85)">Progression globale</span>
              <span style="font-size:13px; font-weight:900; color:white">{{ progressPercent() }}%</span>
            </div>
            <div style="height:8px; background:rgba(255,255,255,0.15); border-radius:99px; overflow:hidden">
              <div [style.width.%]="progressPercent()" style="height:100%; background:linear-gradient(90deg,#34D399,#10B981); border-radius:99px; transition:width 0.8s cubic-bezier(0.4,0,0.2,1); box-shadow:0 0 8px rgba(52,211,153,0.5)"></div>
            </div>
            <div style="display:flex; justify-content:space-between; margin-top:4px">
              <span style="font-size:10px; color:rgba(255,255,255,0.5)">{{ completedCount() }} activité(s)</span>
              <span style="font-size:10px; color:rgba(255,255,255,0.5)">{{ totalActivities() }} au total</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ===== TAB BAR & LAYOUT SWITCH ===== -->
      <div class="hist-tab-bar">
        <button class="hist-tab" [class.ht-active]="activeSubTab() === 'homework'" (click)="activeSubTab.set('homework')">
          <span class="ht-dot" [style.background]="activeSubTab() === 'homework' ? '#F59E0B' : 'var(--border)'"></span>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          <span>Devoirs</span>
          <span class="ht-count" [style.background]="activeSubTab() === 'homework' ? '#FEF3C7' : 'var(--surface-2)'" [style.color]="activeSubTab() === 'homework' ? '#B45309' : 'var(--text-muted)'">{{ homeworkHistory().length }}</span>
        </button>
        <button class="hist-tab" [class.ht-active]="activeSubTab() === 'quizzes'" (click)="activeSubTab.set('quizzes')">
          <span class="ht-dot" [style.background]="activeSubTab() === 'quizzes' ? '#4F46E5' : 'var(--border)'"></span>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <span>Quizzes</span>
          <span class="ht-count" [style.background]="activeSubTab() === 'quizzes' ? '#EEF2FF' : 'var(--surface-2)'" [style.color]="activeSubTab() === 'quizzes' ? '#4338CA' : 'var(--text-muted)'">{{ quizHistory().length }}</span>
        </button>
        <button class="hist-tab" [class.ht-active]="activeSubTab() === 'vocab'" (click)="activeSubTab.set('vocab')">
          <span class="ht-dot" [style.background]="activeSubTab() === 'vocab' ? '#0D9488' : 'var(--border)'"></span>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4"/><path d="M8 10v4"/><line x1="15" y1="11" x2="15" y2="11"/><line x1="18" y1="13" x2="18" y2="13"/></svg>
          <span>Vocabulaire</span>
          <span class="ht-count" [style.background]="activeSubTab() === 'vocab' ? '#F0FDFA' : 'var(--surface-2)'" [style.color]="activeSubTab() === 'vocab' ? '#0F766E' : 'var(--text-muted)'">{{ vocabHistory().length }}</span>
        </button>
        <button class="hist-tab" [class.ht-active]="activeSubTab() === 'exams'" (click)="activeSubTab.set('exams')">
          <span class="ht-dot" [style.background]="activeSubTab() === 'exams' ? '#7C3AED' : 'var(--border)'"></span>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
          <span>Examens</span>
          <span class="ht-count" [style.background]="activeSubTab() === 'exams' ? '#F5F3FF' : 'var(--surface-2)'" [style.color]="activeSubTab() === 'exams' ? '#6D28D9' : 'var(--text-muted)'">{{ examHistory().length }}</span>
        </button>

        <div style="margin-left:auto; display:flex; align-items:center; gap:8px">
          <!-- View mode toggle buttons (Horizontal / Vertical) -->
          <div style="display:flex; background:var(--surface-2); padding:2px; border-radius:8px; border:1px solid var(--border-weak)">
            <button (click)="viewMode.set('horizontal')"
                    title="Affichage Horizontal (Carrousel)"
                    [style.background]="viewMode() === 'horizontal' ? '#4F46E5' : 'transparent'"
                    [style.color]="viewMode() === 'horizontal' ? 'white' : 'var(--text-secondary)'"
                    style="border:none; padding:4px 9px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.2s">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="6" height="14" rx="1"/><rect x="11" y="5" width="6" height="14" rx="1"/><rect x="19" y="5" width="2" height="14" rx="1"/></svg>
              <span>Horizontal</span>
            </button>
            <button (click)="viewMode.set('vertical')"
                    title="Affichage Vertical (Liste)"
                    [style.background]="viewMode() === 'vertical' ? '#4F46E5' : 'transparent'"
                    [style.color]="viewMode() === 'vertical' ? 'white' : 'var(--text-secondary)'"
                    style="border:none; padding:4px 9px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.2s">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="6" rx="1"/><rect x="5" y="11" width="14" height="6" rx="1"/><rect x="5" y="19" width="14" height="2" rx="1"/></svg>
              <span>Vertical</span>
            </button>
          </div>

          <!-- Sort dropdown -->
          <select [ngModel]="sortOrder()" (ngModelChange)="sortOrder.set($event)" class="hist-sort-select">
            <option value="newest">⬇ Plus récent</option>
            <option value="oldest">⬆ Plus ancien</option>
            <option value="score">★ Par score</option>
          </select>
        </div>
      </div>

      <!-- ===== CONTROLS BAR FOR HORIZONTAL CAROUSEL SCROLL ===== -->
      @if (viewMode() === 'horizontal') {
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:-4px">
          <span style="font-size:11.5px; color:var(--text-muted); font-weight:600; display:flex; align-items:center; gap:5px">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            Faites défiler horizontalement ou utilisez les flèches
          </span>
          <div style="display:flex; align-items:center; gap:6px">
            <button (click)="scrollHistRow(-300)"
                    title="Précédent"
                    style="width:30px; height:30px; border-radius:8px; border:1.5px solid var(--border-weak); background:var(--surface-1); color:var(--text-primary); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button (click)="scrollHistRow(300)"
                    title="Suivant"
                    style="width:30px; height:30px; border-radius:8px; border:1.5px solid var(--border-weak); background:var(--surface-1); color:var(--text-primary); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      }

      <!-- ===== CONTENT DISPLAY (HORIZONTAL CAROUSEL OR VERTICAL LIST) ===== -->
      <div id="hist-scroll-container" [class.hist-list]="viewMode() === 'vertical'" [class.hist-row-horizontal]="viewMode() === 'horizontal'">

        <!-- 1. HOMEWORK TAB -->
        @if (activeSubTab() === 'homework') {
          @if (homeworkHistory().length === 0) {
            <div class="hist-empty" style="width:100%">
              <div class="hist-empty-icon" style="background:#FFFBEB; border-color:#FDE68A">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
              </div>
              <h4 style="font-size:14px; font-weight:800; color:var(--text-primary); margin:0 0 4px">Aucun devoir rendu</h4>
              <p style="font-size:12px; color:var(--text-muted); margin:0">Soumettez des devoirs d'expression écrite ou orale pour les retrouver ici.</p>
            </div>
          }
          @for (sub of homeworkHistory(); track sub.id) {
            <div class="hist-card" [class.hc-horiz]="viewMode() === 'horizontal'" [class.hc-redo]="sub.score === 'A refaire'" [class.hc-graded]="sub.graded && sub.score !== 'A refaire'" [class.hc-pending]="!sub.graded">
              <!-- Left or Top Accent -->
              <div class="hc-accent" [style.background]="sub.score === 'A refaire' ? '#F59E0B' : (sub.graded ? '#10B981' : '#94A3B8')"></div>

              <!-- Top Row (Header of Card) -->
              <div style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:10px">
                <div class="hc-icon"
                     [style.background]="sub.score === 'A refaire' ? '#FEF3C7' : (sub.graded ? '#ECFDF5' : '#F1F5F9')"
                     [style.color]="sub.score === 'A refaire' ? '#D97706' : (sub.graded ? '#059669' : '#64748B')">
                  @if (sub.type === 'audio') {
                    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  }
                </div>

                <div style="display:flex; flex-direction:column; align-items:flex-end">
                  @if (sub.score === 'A refaire') {
                    <span class="hc-badge badge-redo">À refaire</span>
                  } @else if (sub.graded) {
                    <span class="hc-badge badge-done">Corrigé</span>
                  } @else {
                    <span class="hc-badge badge-pending">En attente</span>
                  }
                </div>
              </div>

              <!-- Content Body -->
              <div class="hc-body" style="width:100%; margin:10px 0">
                <div class="hc-title" style="font-size:13.5px; line-height:1.3">{{ sub.lessonTitle }}</div>
                <div class="hc-meta" style="margin-top:4px">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {{ sub.submittedAt | date:'d MMM yyyy' }}
                  @if (sub.xpReward) {
                    <span class="hc-xp">+{{ sub.xpReward }} XP</span>
                  }
                </div>
                @if (sub.feedback) {
                  <div class="hc-feedback" style="max-height:54px; overflow:hidden">
                    <span [innerHTML]="'<strong>Feedback :</strong> ' + sub.feedback"></span>
                  </div>
                }
              </div>

              <!-- Footer Row -->
              <div style="display:flex; justify-content:space-between; align-items:center; width:100%; border-top:1px solid var(--border-weak); padding-top:8px; margin-top:auto">
                <span style="font-size:10px; color:var(--text-muted); font-weight:600">Devoir {{ sub.type === 'audio' ? 'Oral' : 'Écrit' }}</span>
                @if (sub.graded && sub.score) {
                  <span class="hc-score-tag" [style.background]="sub.score === 'A refaire' ? '#FFF7ED' : '#EEF2FF'" [style.color]="sub.score === 'A refaire' ? '#C2410C' : '#3730A3'" [style.border-color]="sub.score === 'A refaire' ? '#FED7AA' : '#C7D2FE'">Note: {{ sub.score }}</span>
                }
              </div>
            </div>
          }
        }

        <!-- 2. QUIZZES TAB -->
        @if (activeSubTab() === 'quizzes') {
          @if (quizHistory().length === 0) {
            <div class="hist-empty" style="width:100%">
              <div class="hist-empty-icon" style="background:#EEF2FF; border-color:#C7D2FE">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="1.5"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              </div>
              <h4 style="font-size:14px; font-weight:800; color:var(--text-primary); margin:0 0 4px">Aucun quiz complété</h4>
              <p style="font-size:12px; color:var(--text-muted); margin:0">Participez aux quiz pour suivre vos scores ici.</p>
            </div>
          }
          @for (item of quizHistory(); track item.id) {
            <div class="hist-card" [class.hc-horiz]="viewMode() === 'horizontal'">
              <div class="hc-accent" style="background:#4F46E5"></div>
              
              <div style="display:flex; align-items:center; justify-content:space-between; width:100%">
                <div class="hc-icon" style="background:#EEF2FF; color:#4F46E5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </div>
                <div class="hc-score-ring" [style.border-color]="item.percentage >= 70 ? '#4F46E5' : item.percentage >= 50 ? '#D97706' : '#EF4444'" [style.color]="item.percentage >= 70 ? '#4F46E5' : item.percentage >= 50 ? '#D97706' : '#EF4444'">
                  <div style="font-size:12px; font-weight:900; line-height:1">{{ item.score }}</div>
                  <div style="font-size:8.5px; color:var(--text-muted); font-weight:600">/{{ item.maxScore }}</div>
                </div>
              </div>

              <div class="hc-body" style="width:100%; margin:10px 0">
                <div class="hc-title" style="font-size:13.5px; line-height:1.3">{{ item.title }}</div>
                <div class="hc-meta" style="margin-top:4px">
                  {{ item.completedAt | date:'d MMM yyyy' }}
                  @if (item.xpGained) {
                    <span class="hc-xp">+{{ item.xpGained }} XP</span>
                  }
                </div>
                @if (item.percentage !== undefined) {
                  <div style="margin-top:10px; display:flex; align-items:center; gap:8px">
                    <div style="flex:1; height:5px; background:var(--surface-2); border-radius:99px; overflow:hidden">
                      <div [style.width.%]="item.percentage" [style.background]="item.percentage >= 70 ? 'linear-gradient(90deg,#4F46E5,#7C3AED)' : item.percentage >= 50 ? 'linear-gradient(90deg,#F59E0B,#D97706)' : 'linear-gradient(90deg,#EF4444,#DC2626)'" style="height:100%; border-radius:99px"></div>
                    </div>
                    <span style="font-size:11px; font-weight:800;" [style.color]="item.percentage >= 70 ? '#4F46E5' : item.percentage >= 50 ? '#D97706' : '#EF4444'">{{ item.percentage }}%</span>
                  </div>
                }
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; width:100%; border-top:1px solid var(--border-weak); padding-top:8px; margin-top:auto">
                <span style="font-size:10px; color:var(--text-muted); font-weight:600">Évaluation Quiz</span>
                <span class="hc-badge badge-done" style="font-size:9.5px">Terminé</span>
              </div>
            </div>
          }
        }

        <!-- 3. VOCABULARY TAB -->
        @if (activeSubTab() === 'vocab') {
          @if (vocabHistory().length === 0) {
            <div class="hist-empty" style="width:100%">
              <div class="hist-empty-icon" style="background:#F0FDFA; border-color:#A7F3D0">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="1.5"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4"/><path d="M8 10v4"/><line x1="15" y1="11" x2="15" y2="11"/><line x1="18" y1="13" x2="18" y2="13"/></svg>
              </div>
              <h4 style="font-size:14px; font-weight:800; color:var(--text-primary); margin:0 0 4px">Aucun jeu joué</h4>
              <p style="font-size:12px; color:var(--text-muted); margin:0">Lancez des jeux de vocabulaire pour remporter des scores !</p>
            </div>
          }
          @for (item of vocabHistory(); track item.id) {
            <div class="hist-card" [class.hc-horiz]="viewMode() === 'horizontal'">
              <div class="hc-accent" style="background:#0D9488"></div>
              
              <div style="display:flex; align-items:center; justify-content:space-between; width:100%">
                <div class="hc-icon" style="background:#F0FDFA; color:#0D9488">
                  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4"/><path d="M8 10v4"/><line x1="15" y1="11" x2="15" y2="11"/><line x1="18" y1="13" x2="18" y2="13"/></svg>
                </div>
                <div class="hc-score-tag" style="background:#F0FDFA; color:#0F766E; border-color:#A7F3D0; font-size:11.5px; padding:3px 8px">
                  {{ item.score }} pts
                </div>
              </div>

              <div class="hc-body" style="width:100%; margin:10px 0">
                <div class="hc-title" style="font-size:13.5px; line-height:1.3">{{ item.gameTitle }}</div>
                <div class="hc-meta" style="margin-top:4px">
                  {{ item.completedAt | date:'d MMM yyyy' }}
                  @if (item.xpGained) {
                    <span class="hc-xp">+{{ item.xpGained }} XP</span>
                  }
                </div>
                <div style="margin-top:8px; display:flex; gap:6px; flex-wrap:wrap">
                  <span style="font-size:10px; font-weight:700; color:#0F766E; background:#F0FDFA; padding:2px 7px; border-radius:10px; border:1px solid #CCFBF1">
                    ✓ {{ item.successRate }}% préc.
                  </span>
                  @if (item.mistakes > 0) {
                    <span style="font-size:10px; font-weight:700; color:#DC2626; background:#FEF2F2; padding:2px 7px; border-radius:10px; border:1px solid #FECACA">
                      {{ item.mistakes }} faute(s)
                    </span>
                  }
                </div>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; width:100%; border-top:1px solid var(--border-weak); padding-top:8px; margin-top:auto">
                <span style="font-size:10px; color:var(--text-muted); font-weight:600">Jeu de Vocabulaire</span>
                <span class="hc-badge badge-done" style="font-size:9.5px">Joué</span>
              </div>
            </div>
          }
        }

        <!-- 4. EXAMS TAB -->
        @if (activeSubTab() === 'exams') {
          @if (examHistory().length === 0) {
            <div class="hist-empty" style="width:100%">
              <div class="hist-empty-icon" style="background:#F5F3FF; border-color:#DDD6FE">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="1.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
              </div>
              <h4 style="font-size:14px; font-weight:800; color:var(--text-primary); margin:0 0 4px">Aucun examen passé</h4>
              <p style="font-size:12px; color:var(--text-muted); margin:0">Passez les examens officiels activés par vos professeurs pour recevoir vos certifications.</p>
            </div>
          }
          @for (item of examHistory(); track item.id) {
            <div class="hist-card" [class.hc-horiz]="viewMode() === 'horizontal'">
              <div class="hc-accent" style="background:#7C3AED"></div>

              <div style="display:flex; align-items:center; justify-content:space-between; width:100%">
                <div class="hc-icon" style="background:#F5F3FF; color:#7C3AED">
                  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                </div>
                <span class="hc-badge" [style.background]="item.percentage >= 60 ? '#D1FAE5' : '#FEE2E2'" [style.color]="item.percentage >= 60 ? '#065F46' : '#991B1B'" [style.border-color]="item.percentage >= 60 ? '#A7F3D0' : '#FECACA'">
                  {{ item.percentage >= 60 ? 'RÉUSSI' : 'ÉCHOUÉ' }}
                </span>
              </div>

              <div class="hc-body" style="width:100%; margin:10px 0">
                <div class="hc-title" style="font-size:13.5px; line-height:1.3">{{ item.examTitle }}</div>
                <div class="hc-meta" style="margin-top:4px">
                  {{ item.completedAt | date:'d MMM yyyy' }}
                  @if (item.xpGained) {
                    <span class="hc-xp">+{{ item.xpGained }} XP</span>
                  }
                </div>
                @if (item.percentage !== undefined) {
                  <div style="margin-top:10px; display:flex; align-items:center; gap:8px">
                    <div style="flex:1; height:5px; background:var(--surface-2); border-radius:99px; overflow:hidden">
                      <div [style.width.%]="item.percentage" [style.background]="item.percentage >= 60 ? 'linear-gradient(90deg,#7C3AED,#6D28D9)' : 'linear-gradient(90deg,#EF4444,#DC2626)'" style="height:100%; border-radius:99px"></div>
                    </div>
                    <span style="font-size:11px; font-weight:800;" [style.color]="item.percentage >= 60 ? '#7C3AED' : '#EF4444'">{{ item.percentage }}%</span>
                  </div>
                }
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; width:100%; border-top:1px solid var(--border-weak); padding-top:8px; margin-top:auto">
                <span style="font-size:10px; color:var(--text-muted); font-weight:600">Examen Officiel</span>
                <span class="hc-score-tag" style="background:#F5F3FF; color:#6D28D9; border-color:#DDD6FE">{{ item.score }}/{{ item.maxScore }}</span>
              </div>
            </div>
          }
        }

      </div>
    </div>
  `,
  styles: [`
    .hist-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    /* ===== HERO ===== */
    .hist-hero {
      background: linear-gradient(135deg, #1E3A5F 0%, #1E40AF 40%, #4F46E5 80%, #6D28D9 100%);
      border-radius: 16px;
      padding: 22px 24px;
      position: relative;
      overflow: hidden;
    }
    .hist-hero-blob {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
    }
    .blob1 {
      width: 200px; height: 200px;
      top: -60px; right: -40px;
      background: rgba(255,255,255,0.05);
    }
    .blob2 {
      width: 120px; height: 120px;
      bottom: -40px; left: 30%;
      background: rgba(255,255,255,0.04);
    }
    .hist-hero-icon {
      width: 46px; height: 46px;
      border-radius: 14px;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .hist-stats-row {
      display: flex;
      align-items: center;
      gap: 0;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 12px;
      padding: 12px 16px;
      backdrop-filter: blur(4px);
    }
    .hist-hero-stat {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      justify-content: center;
    }
    .hist-hero-stat-icon {
      width: 30px; height: 30px;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .hist-hero-sep {
      width: 1px; height: 32px;
      background: rgba(255,255,255,0.15);
      margin: 0 4px;
    }

    /* ===== TABS & LAYOUT CONTROLS ===== */
    .hist-tab-bar {
      display: flex;
      gap: 4px;
      align-items: center;
      background: var(--surface-1);
      border: 1px solid var(--border-weak);
      border-radius: 12px;
      padding: 6px;
      flex-wrap: wrap;
    }
    .hist-tab {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: var(--text-secondary);
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .hist-tab:hover {
      background: var(--surface-2);
      color: var(--text-primary);
    }
    .hist-tab.ht-active {
      background: var(--surface-2);
      color: var(--text-primary);
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
    }
    .ht-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
      transition: background 0.2s;
    }
    .ht-count {
      font-size: 10.5px;
      font-weight: 800;
      padding: 1px 7px;
      border-radius: 20px;
      transition: all 0.2s;
    }
    .hist-sort-select {
      appearance: none;
      -webkit-appearance: none;
      height: 30px;
      padding: 0 24px 0 8px;
      border: 1.5px solid var(--border-weak);
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      background: var(--surface-1);
      color: var(--text-primary);
      cursor: pointer;
      outline: none;
      transition: border-color 0.2s;
    }
    .hist-sort-select:focus { border-color: #4F46E5; }

    /* ===== HORIZONTAL SCROLL CAROUSEL ROW ===== */
    .hist-row-horizontal {
      display: flex;
      gap: 14px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      padding: 4px 2px 14px 2px;
      scroll-behavior: smooth;
      -webkit-overflow-scrolling: touch;
    }
    .hist-row-horizontal::-webkit-scrollbar {
      height: 6px;
    }
    .hist-row-horizontal::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 10px;
    }

    /* ===== VERTICAL LIST ===== */
    .hist-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* ===== CARDS ===== */
    .hist-card {
      display: flex;
      align-items: center;
      gap: 14px;
      background: var(--surface-1);
      border: 1px solid var(--border-weak);
      border-radius: 14px;
      padding: 14px 16px;
      position: relative;
      overflow: hidden;
      transition: all 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .hist-card.hc-horiz {
      flex: 0 0 280px;
      min-width: 280px;
      max-width: 300px;
      scroll-snap-align: start;
      flex-direction: column;
      align-items: flex-start;
      padding: 16px;
      min-height: 200px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }
    .hist-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 24px -6px rgba(79,70,229,0.15);
      border-color: rgba(79,70,229,0.35);
    }
    .hc-accent {
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 4px;
      border-radius: 14px 0 0 14px;
    }
    .hist-card.hc-horiz .hc-accent {
      top: 0; left: 0; right: 0; bottom: auto;
      height: 4px; width: 100%;
      border-radius: 14px 14px 0 0;
    }
    .hc-icon {
      width: 40px; height: 40px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .hc-body {
      flex: 1;
      min-width: 0;
    }
    .hc-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .hc-meta {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 3px;
      flex-wrap: wrap;
    }
    .hc-xp {
      color: #059669;
      font-weight: 700;
      background: #ECFDF5;
      padding: 1px 6px;
      border-radius: 10px;
      font-size: 10px;
    }
    .hc-feedback {
      display: flex;
      align-items: flex-start;
      gap: 5px;
      font-size: 11px;
      background: var(--surface-2);
      border-left: 3px solid #6366F1;
      padding: 6px 10px;
      border-radius: 0 6px 6px 0;
      margin-top: 8px;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    .hc-badges {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
      flex-shrink: 0;
    }
    .hc-badge {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 10px;
      font-weight: 800;
      padding: 4px 10px;
      border-radius: 20px;
      border: 1.5px solid transparent;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }
    .badge-done { background: #D1FAE5; color: #065F46; border-color: #A7F3D0; }
    .badge-redo { background: #FEF3C7; color: #B45309; border-color: #FDE68A; }
    .badge-pending { background: #F1F5F9; color: #475569; border-color: #CBD5E1; }
    .hc-score-tag {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 9px;
      border-radius: 20px;
      border: 1.5px solid transparent;
    }
    .hc-score-ring {
      width: 44px; height: 44px;
      border-radius: 50%;
      border: 2.5px solid;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    /* ===== EMPTY STATES ===== */
    .hist-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 48px 24px;
      border: 1.5px dashed var(--border-weak);
      border-radius: 16px;
      background: var(--surface-1);
      gap: 10px;
    }
    .hist-empty-icon {
      width: 60px; height: 60px;
      border-radius: 50%;
      border: 2px solid;
      display: flex; align-items: center; justify-content: center;
    }
  `]
})
export class StudentHistoryComponent {
  private db = inject(DatabaseService);
  activeLang = this.db.activeLang;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

  currentUser = signal<UserProfile | null>(null);
  activityLogs = signal<any[]>([]);
  submissions = signal<Submission[]>([]);
  vocabAttempts = signal<any[]>([]);
  examAttempts = signal<any[]>([]);

  activeSubTab = signal<'homework' | 'quizzes' | 'vocab' | 'exams'>('homework');
  sortOrder = signal<'newest' | 'oldest' | 'score'>('newest');
  viewMode = signal<'horizontal' | 'vertical'>('horizontal');

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

  scrollHistRow(delta: number) {
    const el = document.getElementById('hist-scroll-container');
    if (el) el.scrollBy({ left: delta, behavior: 'smooth' });
  }

  // Computed Lists
  homeworkHistory = computed<Submission[]>(() => {
    let list = this.submissions().filter(s => s.type === 'text' || s.type === 'audio' || s.type === 'video');
    return [...list].sort((a, b) => {
      const tA = new Date(a.submittedAt).getTime();
      const tB = new Date(b.submittedAt).getTime();
      if (this.sortOrder() === 'newest') return tB - tA;
      if (this.sortOrder() === 'oldest') return tA - tB;
      if (this.sortOrder() === 'score') {
        const scoreMap: Record<string, number> = {
          'A — Excellent': 4, 'B — Good': 3, 'C — Satisfactory': 2,
          'D — Needs improvement': 1, 'A refaire': 0
        };
        return (scoreMap[b.score || ''] ?? 0) - (scoreMap[a.score || ''] ?? 0);
      }
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

  totalActivities = computed(() =>
    this.submissions().filter(s => s.type === 'text' || s.type === 'audio' || s.type === 'video').length +
    this.activityLogs().filter(l => l.type === 'quiz').length +
    this.vocabAttempts().length +
    this.examAttempts().length
  );

  completedCount = computed(() =>
    this.submissions().filter(s => s.graded && s.score !== 'A refaire' && (s.type === 'text' || s.type === 'audio' || s.type === 'video')).length +
    this.activityLogs().filter(l => l.status === 'completed' && l.type === 'quiz').length +
    this.vocabAttempts().length +
    this.examAttempts().length
  );

  pendingCount = computed(() =>
    this.submissions().filter(s => (!s.graded || s.score === 'A refaire') && (s.type === 'text' || s.type === 'audio' || s.type === 'video')).length
  );

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
}
