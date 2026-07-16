import { Component, inject, signal, computed, ViewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, UserProfile, Attendance, LiveIceBreaker } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-wheel-game',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="padding:20px; box-sizing:border-box">
      
      <!-- HEADER BANNER -->
      <div style="background:linear-gradient(135deg, #0F172A 0%, #1E293B 100%); border-bottom:4px solid #10B981; padding:20px; border-radius:12px; margin-bottom:24px; box-shadow:0 4px 20px rgba(0,0,0,0.05); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px">
        <div>
          <h2 style="font-size:20px; font-weight:800; color:white; margin:0 0 4px 0; display:flex; align-items:center; gap:8px">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M2 12h20"/><path d="m19.07 4.93-14.14 14.14"/><path d="m4.93 4.93 14.14 14.14"/></svg>
            Ice Breaker Center <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4M8 10v4"/><line x1="15" y1="12" x2="15.01" y2="12"/><line x1="18" y1="10" x2="18.01" y2="10"/><line x1="18" y1="14" x2="18.01" y2="14"/></svg>
          </h2>
          <p style="font-size:12.5px; color:#94A3B8; margin:0">Animez vos cours en direct : lancez des roues de tirage, des quiz flash "Buzz" ou des missions orales en direct !</p>
        </div>
        <div style="display:flex; gap:12px">
          <button (click)="resetGame()" class="btn-s" style="background:#1E293B; color:white; border:1px solid rgba(255,255,255,0.2); font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Réinitialiser le Jeu
          </button>
        </div>
      </div>

      <!-- TAB ROW FOR INTERACTIVE GAME MODES -->
      <div class="tab-row" style="margin-bottom:20px; display:flex; gap:10px; border-bottom:2px solid var(--border-weak); padding-bottom:12px">
        <button class="tab" [class.active]="selectedCenterTab() === 'wheel'" (click)="selectedCenterTab.set('wheel')" style="border:none; background:none; padding:8px 16px; font-weight:800; cursor:pointer; font-size:13.5px; border-radius:6px; transition:all 0.2s" [style.background]="selectedCenterTab() === 'wheel' ? '#4F46E5' : 'transparent'" [style.color]="selectedCenterTab() === 'wheel' ? 'white' : 'var(--text-secondary)'">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20m-4.93-7.07L7.07 19.07M19.07 19.07 4.93 4.93"/></svg> Roue des Noms
        </button>
        <button class="tab" [class.active]="selectedCenterTab() === 'buzz'" (click)="selectedCenterTab.set('buzz')" style="border:none; background:none; padding:8px 16px; font-weight:800; cursor:pointer; font-size:13.5px; border-radius:6px; transition:all 0.2s" [style.background]="selectedCenterTab() === 'buzz' ? '#F59E0B' : 'transparent'" [style.color]="selectedCenterTab() === 'buzz' ? 'white' : 'var(--text-secondary)'">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Live Buzz / Quiz
        </button>
        <button class="tab" [class.active]="selectedCenterTab() === 'mission'" (click)="selectedCenterTab.set('mission')" style="border:none; background:none; padding:8px 16px; font-weight:800; cursor:pointer; font-size:13.5px; border-radius:6px; transition:all 0.2s" [style.background]="selectedCenterTab() === 'mission' ? '#10B981' : 'transparent'" [style.color]="selectedCenterTab() === 'mission' ? 'white' : 'var(--text-secondary)'">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg> Mission Speaking
        </button>
      </div>

      <!-- GUIDED STATUS BANNER -->
      <div style="background:#FAF5FF; border:1px solid #E9D5FF; padding:14px 20px; border-radius:12px; margin-bottom:24px; display:flex; align-items:center; gap:12px; box-shadow:0 4px 12px rgba(168,85,247,0.05)">
        <div style="display:flex; align-items:center; justify-content:center; width:32px; height:32px; background:#F3E8FF; border-radius:50%; flex-shrink:0">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A855F7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div>
          @if (!selectedStudentName()) {
            <span style="font-size:13px; font-weight:700; color:#6B21A8"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg> Étape 1 : Tournez la roue de gauche pour désigner un élève.</span>
          } @else if (selectedStudentName() && !selectedChallengeText()) {
            <span style="font-size:13px; font-weight:700; color:#1E1B4B">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Élève sélectionné : <strong style="color:#A855F7; font-size:14.5px">{{ selectedStudentName() }}</strong> <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;vertical-align:middle"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg> <span style="color:#D97706">Étape 2 : Tournez la roue des défis pour lui attribuer son sujet !</span>
            </span>
          }
        </div>
      </div>

      <!-- MAIN PLAY AREA -->
      <div style="display:grid; grid-template-columns: 1fr 340px; gap:24px; align-items:start">
        
        <div>
          <!-- TAB 1: WHEEL OF NAMES -->
          @if (selectedCenterTab() === 'wheel') {
            <div class="card" style="padding:24px; text-align:center">
          <div style="display:flex; align-items:center; justify-content:center; gap:40px; flex-wrap:wrap">
            
            <!-- WHEEL 1: STUDENTS -->
            <div style="display:flex; flex-direction:column; align-items:center; position:relative">
              <h3 style="font-size:14px; font-weight:800; color:#1E293B; margin:0 0 16px 0; display:flex; align-items:center; gap:6px">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                Élèves Sélectionnés ({{ activeStudents().length }})
              </h3>
              
              <!-- Pointer Arrow -->
              <div style="position:absolute; top:28px; right:0; transform:translateX(50%); z-index:10; width:0; height:0; border-top:12px solid transparent; border-bottom:12px solid transparent; border-right:24px solid #EF4444"></div>
              
              <!-- Canvas student wheel -->
              <canvas #studentCanvas width="320" height="320" style="border-radius:50%; box-shadow:0 10px 25px rgba(0,0,0,0.1); background:white"></canvas>
              
              <button (click)="spinWheel('student')" [disabled]="isSpinning() || activeStudents().length === 0" class="btn-s" style="margin-top:20px; background:#4F46E5; color:white; border:none; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                Tourner la Roue Élève
              </button>
            </div>

            <!-- WHEEL 2: ICEBREAKERS / CHALLENGES -->
            <div style="display:flex; flex-direction:column; align-items:center; position:relative">
              <h3 style="font-size:14px; font-weight:800; color:#1E293B; margin:0 0 16px 0; display:flex; align-items:center; gap:6px">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                Défi Speaking / Icebreaker
              </h3>
              
              <!-- Pointer Arrow -->
              <div style="position:absolute; top:28px; right:0; transform:translateX(50%); z-index:10; width:0; height:0; border-top:12px solid transparent; border-bottom:12px solid transparent; border-right:24px solid #F59E0B"></div>
              
              <!-- Canvas challenge wheel -->
              <canvas #challengeCanvas width="320" height="320" style="border-radius:50%; box-shadow:0 10px 25px rgba(0,0,0,0.1); background:white"></canvas>
              
              <button (click)="spinWheel('challenge')" [disabled]="isSpinning() || !selectedStudentName()" class="btn-s" [style.background]="selectedStudentName() ? '#D97706' : '#94A3B8'" style="margin-top:20px; color:white; border:none; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                Tourner la Roue Défi
              </button>
            </div>

          </div>
            </div>
          }

          <!-- TAB 2: LIVE BUZZ / QUIZ -->
          @if (selectedCenterTab() === 'buzz') {
            <div class="card" style="padding:24px">
              <h3 style="font-size:16px; font-weight:800; color:#F59E0B; margin:0 0 16px 0; display:flex; align-items:center; gap:8px">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Session Live Buzz / Quiz en Direct
              </h3>
              
              @if (activeGame() && activeGame()?.type === 'buzz') {
                <!-- Active quiz session display -->
                <div style="background:#FFFDF5; border:1.5px solid #FDE68A; border-radius:12px; padding:20px; margin-bottom:24px">
                  <div style="font-size:11px; font-weight:800; color:#B45309; text-transform:uppercase">Question en cours de diffusion</div>
                  <div style="font-size:16px; font-weight:800; color:#78350F; margin:8px 0 16px 0">" {{ activeGame()?.buzzState?.question }} "</div>
                  
                  <button (click)="stopIceBreaker()" class="btn-s" style="background:#EF4444; border-color:#EF4444; color:white; font-weight:800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#EF4444" stroke="none" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/></svg> Arrêter la session
                  </button>
                </div>

                <!-- Submissions Table -->
                <h4 style="font-size:12px; font-weight:800; color:var(--text-primary); margin:0 0 10px 0">Réponses Reçues ({{ activeGame()?.buzzState?.answers?.length || 0 }})</h4>
                <div style="border:1px solid var(--border-weak); border-radius:8px; overflow:hidden">
                  <table style="width:100%; border-collapse:collapse; font-size:12.5px; text-align:left">
                    <thead>
                      <tr style="background:var(--surface-2); border-bottom:1px solid var(--border-weak); color:var(--text-secondary)">
                        <th style="padding:8px 12px">Élève</th>
                        <th style="padding:8px 12px">Réponse</th>
                        <th style="padding:8px 12px; text-align:right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (ans of activeGame()?.buzzState?.answers; track ans.studentId) {
                        <tr style="border-bottom:1px solid var(--border-weak)">
                          <td style="padding:10px 12px; font-weight:700">{{ ans.studentName }}</td>
                          <td style="padding:10px 12px">"{{ ans.answer }}"</td>
                          <td style="padding:10px 12px; text-align:right; display:flex; gap:6px; justify-content:flex-end">
                            @if (ans.correct === true) {
                              <span style="color:#10B981; font-weight:800; font-size:11px">Validé (+10 XP)</span>
                            } @else if (ans.correct === false) {
                              <span style="color:#EF4444; font-weight:800; font-size:11px">Refusé</span>
                            } @else {
                              <button (click)="gradeBuzz(ans.studentId, true)" class="btn-s" style="padding:2px 6px; font-size:10px; font-weight:800; background:#D1FAE5; border-color:#A7F3D0; color:#065F46">Valider</button>
                              <button (click)="gradeBuzz(ans.studentId, false)" class="btn-s" style="padding:2px 6px; font-size:10px; font-weight:800; background:#FEE2E2; border-color:#FCA5A5; color:#991B1B">Refuser</button>
                            }
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="3" style="padding:20px; text-align:center; color:var(--text-muted); font-style:italic">Aucune réponse pour le moment. Dites aux étudiants d'aller sur leur onglet "Ice Breaker".</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

              } @else {
                <!-- Create/Start new buzz session form -->
                <div style="max-width:500px">
                  <label style="font-size:12px; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:6px">Écrivez une question rapide à poser aux élèves :</label>
                  <input type="text" [(ngModel)]="liveQuestionText" placeholder="ex: Quelle est la différence entre 'say' et 'tell' ?" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:6px; font-size:13.5px; background:var(--surface-1); color:var(--text-primary); margin-bottom:16px" (keyup.enter)="startBuzz()"/>
                  <button (click)="startBuzz()" class="btn-p" style="background:#F59E0B; border-color:#F59E0B; height:38px; font-weight:800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg> Lancer la Question en Direct
                  </button>
                </div>
              }
            </div>
          }

          <!-- TAB 3: LIVE SPEAKING MISSIONS -->
          @if (selectedCenterTab() === 'mission') {
            <div class="card" style="padding:24px">
              <h3 style="font-size:16px; font-weight:800; color:#10B981; margin:0 0 16px 0; display:flex; align-items:center; gap:8px">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg> Session Défi Oral / Speaking Mission
              </h3>

              @if (activeGame() && activeGame()?.type === 'mission') {
                <div style="background:#ECFDF5; border:1.5px solid #A7F3D0; border-radius:12px; padding:20px; margin-bottom:24px">
                  <div style="font-size:11px; font-weight:800; color:#047857; text-transform:uppercase">Mission Speaking Active</div>
                  <div style="font-size:16px; font-weight:800; color:#065F46; margin:6px 0 2px 0">" {{ activeGame()?.missionState?.title }} "</div>
                  <p style="font-size:11.5px; color:#047857; margin:0 0 16px 0">{{ activeGame()?.missionState?.description }}</p>
                  
                  <button (click)="stopIceBreaker()" class="btn-s" style="background:#EF4444; border-color:#EF4444; color:white; font-weight:800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#EF4444" stroke="none" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/></svg> Arrêter la session
                  </button>
                </div>

                <!-- Submissions List -->
                <h4 style="font-size:12px; font-weight:800; color:var(--text-primary); margin:0 0 10px 0">Audios Reçus ({{ activeGame()?.missionState?.submissions?.length || 0 }})</h4>
                <div style="display:flex; flex-direction:column; gap:10px">
                  @for (sub of activeGame()?.missionState?.submissions; track sub.studentId) {
                    <div style="background:var(--surface-2); border:1px solid var(--border-weak); border-radius:8px; padding:12px; display:flex; flex-direction:column; gap:8px">
                      <div style="display:flex; justify-content:space-between; align-items:center">
                        <span style="font-size:12.5px; font-weight:800; color:var(--text-primary)"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> {{ sub.studentName }}</span>
                        <span style="font-size:10px; opacity:0.7">{{ sub.timestamp | date:'HH:mm' }}</span>
                      </div>
                      
                      <div style="display:flex; align-items:center; gap:12px; justify-content:space-between; flex-wrap:wrap">
                        <audio [src]="sub.audioUrl" controls style="height:32px; flex:1; min-width:200px"></audio>
                        
                        <div style="display:flex; gap:6px">
                          @if (sub.correct === true) {
                            <span style="color:#10B981; font-weight:800; font-size:11px">Validé (+15 XP)</span>
                          } @else if (sub.correct === false) {
                            <span style="color:#EF4444; font-weight:800; font-size:11px">Refusé</span>
                          } @else {
                            <button (click)="gradeMission(sub.studentId, true)" class="btn-s" style="padding:2px 6px; font-size:10px; font-weight:800; background:#D1FAE5; border-color:#A7F3D0; color:#065F46">Valider</button>
                            <button (click)="gradeMission(sub.studentId, false)" class="btn-s" style="padding:2px 6px; font-size:10px; font-weight:800; background:#FEE2E2; border-color:#FCA5A5; color:#991B1B">Refuser</button>
                          }
                        </div>
                      </div>
                    </div>
                  } @empty {
                    <div style="font-size:12px; color:var(--text-muted); text-align:center; padding:24px; border:1px dashed var(--border); border-radius:8px">
                      Aucun audio reçu. Dites aux élèves d'enregistrer leur réponse orale.
                    </div>
                  }
                </div>

              } @else {
                <!-- Create/Start new mission form -->
                <div style="max-width:500px; display:flex; flex-direction:column; gap:12px">
                  <div>
                    <label style="font-size:12px; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:4px">Titre du Défi :</label>
                    <input type="text" [(ngModel)]="liveMissionTitle" placeholder="ex: Parlez de votre passion" style="width:100%; padding:9px; border:1px solid var(--border); border-radius:6px; font-size:13px; background:var(--surface-1); color:var(--text-primary)"/>
                  </div>
                  <div>
                    <label style="font-size:12px; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:4px">Consigne :</label>
                    <input type="text" [(ngModel)]="liveMissionDesc" placeholder="ex: Enregistrez un vocal d'au moins 20 secondes en décrivant pourquoi..." style="width:100%; padding:9px; border:1px solid var(--border); border-radius:6px; font-size:13px; background:var(--surface-1); color:var(--text-primary)"/>
                  </div>
                  <button (click)="startMission()" class="btn-p" style="background:#10B981; border-color:#10B981; height:38px; font-weight:800; margin-top:8px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg> Diffuser le Défi Vocal
                  </button>
                </div>
              }
            </div>
          }
        </div>

        <!-- RIGHT SIDEBAR: NAMES & CONTROLS LIST -->
        <div style="display:flex; flex-direction:column; gap:20px">
          
          <!-- TODAY ATTENDANCE STATE INFO -->
          <div class="card" style="background:#ECFDF5; border:1px solid #D1FAE5; padding:16px">
            <h4 style="font-size:11px; font-weight:800; color:#065F46; text-transform:uppercase; margin:0 0 6px 0; letter-spacing:0.5px"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> Présences du Jour</h4>
            <div style="font-size:13.5px; font-weight:700; color:#047857">
              {{ presentCount() }} élèves présents / {{ allStudentsCount() }} inscrits
            </div>
            <p style="font-size:10.5px; color:#065F46; margin:4px 0 0 0">Par défaut, seuls les élèves présents aujourd'hui sont cochés.</p>
          </div>

          <!-- LIST OF ALL STUDENTS WITH CHECKBOXES -->
          <div class="card" style="padding:16px">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
              <h4 style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin:0; letter-spacing:0.5px">Activer dans la Roue</h4>
              <div style="display:flex; gap:8px; align-items:center">
                <button (click)="toggleAll(true)" style="background:none; border:none; color:#4F46E5; cursor:pointer; font-size:10.5px; font-weight:700">Tous</button>
                <span style="color:var(--text-muted); font-size:10px">|</span>
                <button (click)="toggleAll(false)" style="background:none; border:none; color:#EF4444; cursor:pointer; font-size:10.5px; font-weight:700">Aucun</button>
                <span style="color:var(--text-muted); font-size:10px">|</span>
                <button (click)="shuffle()" style="background:none; border:none; color:#4F46E5; cursor:pointer; font-size:10.5px; font-weight:700">Mélanger <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg></button>
              </div>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:6px; max-height:240px; overflow-y:auto; padding-right:4px">
              @if (studentsList().length === 0) {
                <div style="font-size:12px; color:var(--text-muted); text-align:center; padding:16px">
                  Aucun élève enregistré.
                </div>
              }
              @for (st of studentsList(); track st.id) {
                <div style="display:flex; align-items:center; justify-content:space-between; background:#F8FAFC; border:1px solid #E2E8F0; padding:6px 10px; border-radius:6px"
                     [style.opacity]="alreadyPickedStudentIds().includes(st.id) ? '0.5' : '1'">
                  <div style="display:flex; align-items:center; gap:8px">
                    <input type="checkbox" 
                           [disabled]="alreadyPickedStudentIds().includes(st.id)"
                           [checked]="isStudentChecked(st.id) && !alreadyPickedStudentIds().includes(st.id)"
                           (change)="toggleStudentActive(st.id, $event)"
                           style="cursor:pointer">
                    <span [style.color]="isStudentChecked(st.id) && !alreadyPickedStudentIds().includes(st.id) ? '#334155' : 'var(--text-muted)'"
                          [style.font-weight]="isStudentChecked(st.id) && !alreadyPickedStudentIds().includes(st.id) ? '700' : '400'"
                          [style.text-decoration]="alreadyPickedStudentIds().includes(st.id) ? 'line-through' : 'none'"
                          style="font-size:12px">
                      {{ st.name }}
                    </span>
                  </div>
                  
                  <div style="display:flex; align-items:center; gap:6px">
                    <!-- Presence indicator badge -->
                    @if (todayRecords()[st.id] === 'P' || todayRecords()[st.id] === 'L') {
                      <span style="background:#D1FAE5; color:#065F46; font-size:8px; padding:1px 5px; border-radius:10px; font-weight:800">Présent</span>
                    } @else {
                      <span style="background:#F3F4F6; color:#9CA3AF; font-size:8px; padding:1px 5px; border-radius:10px">Absent</span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- ALREADY PICKED LIST (DEJA PRIS) -->
          <div class="card" style="padding:16px">
            <h4 style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin:0 0 12px 0; letter-spacing:0.5px">Déjà interrogés ({{ pickedStudents().length }})</h4>
            
            <div style="display:flex; flex-direction:column; gap:6px; max-height:180px; overflow-y:auto">
              @if (pickedStudents().length === 0) {
                <div style="font-size:11.5px; color:var(--text-muted); text-align:center; padding:12px">
                  Personne pour l'instant.
                </div>
              }
              @for (st of pickedStudents(); track st.id) {
                <div style="display:flex; justify-content:space-between; align-items:center; background:#FAF5FF; border:1px solid #F3E8FF; padding:6px 10px; border-radius:6px">
                  <span style="font-size:12px; text-decoration:line-through; color:#A855F7">{{ st.name }}</span>
                  <button (click)="reinstateStudent(st.id)" title="Réintroduire dans la roue" style="background:none; border:none; color:#4F46E5; cursor:pointer; font-size:12px">
                    <i class="ti ti-rotate-clockwise"></i>
                  </button>
                </div>
              }
            </div>
          </div>

        </div>

      </div>

      <!-- CELEBRATION WINNER OVERLAY MODAL -->
      @if (showWinnerModal()) {
        <div class="modal-overlay" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.4); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; z-index:9999">
          <div class="modal-card" style="background:white; border-radius:16px; max-width:480px; width:90%; padding:30px; text-align:center; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); border:3px solid #10B981; animation: pop-winner 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)">
            <div style="font-size:64px; margin-bottom:12px; animation: bounce-trophy 1s infinite alternate">🏆</div>
            <h2 style="font-size:22px; font-weight:900; color:#1E293B; margin:0 0 6px 0">C'est au tour de :</h2>
            <div style="font-size:28px; font-weight:900; color:#10B981; margin:8px 0 16px 0; letter-spacing:0.5px">{{ winningStudentName() }}</div>
            
            <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px; margin-bottom:24px; text-align:left">
              <span style="font-size:10px; font-weight:800; color:#D97706; text-transform:uppercase; letter-spacing:0.5px">🎯 Défi Speaking Reçu :</span>
              <div style="font-size:14px; font-weight:800; color:#1E1B4B; margin-top:4px">"{{ winningChallengeText() }}"</div>
            </div>

            <div style="display:flex; justify-content:center; gap:12px">
              <button (click)="closeWinnerModal(true)" class="btn-s" style="background:#EF4444; color:white; border:none; font-weight:700; cursor:pointer">
                Retirer de la roue ❌
              </button>
              <button (click)="closeWinnerModal(false)" class="btn-s" style="background:#1E1B4B; color:white; border:none; font-weight:700; cursor:pointer">
                Garder dans la roue 🔄
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    @keyframes pop-winner {
      from { transform: scale(0.85); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes bounce-trophy {
      from { transform: translateY(0); }
      to { transform: translateY(-8px); }
    }
  `]
})
export class TeacherWheelGameComponent implements OnInit, OnDestroy {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  @ViewChild('studentCanvas') private studentCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('challengeCanvas') private challengeCanvasRef!: ElementRef<HTMLCanvasElement>;

  studentsList = signal<UserProfile[]>([]);
  selectedCenterTab = signal<'wheel' | 'buzz' | 'mission'>('wheel');
  activeGame = signal<LiveIceBreaker | null>(null);
  liveQuestionText = '';
  liveMissionTitle = '';
  liveMissionDesc = '';
  attendanceList = signal<Attendance[]>([]);
  todayRecords = signal<{ [studentId: string]: 'P' | 'A' | 'L' | '-' }>({});

  // Active game states
  checkedStudentIds = signal<string[]>([]);
  alreadyPickedStudentIds = signal<string[]>([]);
  private initializedChecked = false;

  // Step-by-step sequential selection states
  selectedStudentName = signal<string>('');
  selectedChallengeText = signal<string>('');
  
  // Confetti / Celebration states
  showWinnerModal = signal<boolean>(false);
  winningStudentName = signal<string>('');
  winningChallengeText = signal<string>('');

  // Slices items lists
  challengesList = [
    "Introduce yourself in 30 seconds 💬",
    "Name 3 animals starting with 'S' 🦁",
    "Say a tongue twister out loud 👅",
    "Tell us your favorite English word 🌟",
    "Name 3 office scenarios 🏢",
    "Count backwards from 20 to 0 🔢",
    "Tell us a short joke in English 😄",
    "Describe the weather today ☀️",
    "Sing the English alphabet 🎵",
    "Name 5 colors in English 🎨",
    "Describe your dream job and why 👔",
    "Name 3 items in your kitchen 🍳",
    "Blink 10 times and count in English 👀",
    "Wave at the camera and say hello! 👋",
    "Do a happy dance! 🕺"
  ];

  // Dynamic lists
  activeStudents = computed(() => {
    return this.studentsList().filter(s => {
      const isChecked = this.checkedStudentIds().includes(s.id);
      const isAlreadyPicked = this.alreadyPickedStudentIds().includes(s.id);
      return isChecked && !isAlreadyPicked;
    });
  });

  pickedStudents = computed(() => {
    return this.studentsList().filter(s => this.alreadyPickedStudentIds().includes(s.id));
  });

  presentCount = computed(() => {
    return this.studentsList().filter(s => {
      const code = this.todayRecords()[s.id];
      return code === 'P' || code === 'L';
    }).length;
  });

  allStudentsCount = computed(() => this.studentsList().length);

  // Wheel Physics / Spinning Engine
  isSpinning = signal<boolean>(false);
  currentSpinningWheel: 'student' | 'challenge' | null = null;
  private animFrameId: any = null;

  // Student Wheel Physics
  studentAngle = 0;
  studentSpeed = 0;

  // Challenge Wheel Physics
  challengeAngle = 0;
  challengeSpeed = 0;

  private readonly COLORS = [
    '#6366F1', // Indigo
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EC4899', // Rose
    '#8B5CF6', // Violet
    '#F97316', // Orange
    '#14B8A6', // Teal
    '#3B82F6', // Blue
    '#A855F7'  // Purple
  ];

  ngOnInit() {
    const todayStr = new Date().toLocaleDateString('en-CA');
    
    // Subscribe to database feeds
    this.db.observeUsers().subscribe(list => {
      const students = list.filter(u => u.role === 'student');
      this.studentsList.set(students);
      this.initDefaultChecked(students, this.todayRecords());
      this.triggerRedraw();
    });

    this.db.observeAttendance().subscribe(list => {
      this.attendanceList.set(list);
      const todaySheet = list.find(a => a.date === todayStr);
      const records = todaySheet ? { ...todaySheet.records } : {};
      this.todayRecords.set(records);
      this.initDefaultChecked(this.studentsList(), records);
      this.triggerRedraw();
    });
  }

  ngOnDestroy() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }

  private initDefaultChecked(students: UserProfile[], records: { [studentId: string]: 'P' | 'A' | 'L' | '-' }) {
    if (this.initializedChecked || students.length === 0) return;

    // Filter students marked present or late today
    const presentIds = students
      .filter(s => {
        const code = records[s.id];
        return code === 'P' || code === 'L';
      })
      .map(s => s.id);
    
    if (presentIds.length > 0) {
      this.checkedStudentIds.set(presentIds);
      this.initializedChecked = true;
    } else if (Object.keys(records).length > 0) {
      // If attendance sheet is filled but everyone is absent, check all by default
      this.checkedStudentIds.set(students.map(s => s.id));
      this.initializedChecked = true;
    }
  }

  triggerRedraw() {
    setTimeout(() => {
      this.drawStudentWheel();
      this.drawChallengeWheel();
    }, 100);
  }

  // --- HTML5 CANVAS RENDERING ENGINE ---

  drawStudentWheel() {
    const canvas = this.studentCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const names = this.activeStudents().map(s => s.name);

    if (names.length === 0) {
      // Draw empty wheel
      ctx.beginPath();
      ctx.arc(160, 160, 150, 0, 2 * Math.PI);
      ctx.fillStyle = '#F1F5F9';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#CBD5E1';
      ctx.stroke();

      ctx.fillStyle = '#64748B';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Cochez des élèves à intégrer', 160, 160);
      return;
    }

    const numSlices = names.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    ctx.save();
    ctx.translate(160, 160);
    ctx.rotate(this.studentAngle);

    for (let i = 0; i < numSlices; i++) {
      // Draw Slice background
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 150, i * sliceAngle, (i + 1) * sliceAngle);
      ctx.closePath();
      ctx.fillStyle = this.COLORS[i % this.COLORS.length];
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'white';
      ctx.stroke();

      // Draw Name rotated
      ctx.save();
      ctx.rotate(i * sliceAngle + sliceAngle / 2);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(names[i], 135, 4);
      ctx.restore();
    }

    ctx.restore();

    // Draw center white circle
    ctx.beginPath();
    ctx.arc(160, 160, 30, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#E2E8F0';
    ctx.stroke();
  }

  drawChallengeWheel() {
    const canvas = this.challengeCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const challenges = this.challengesList;

    const numSlices = challenges.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    ctx.save();
    ctx.translate(160, 160);
    ctx.rotate(this.challengeAngle);

    for (let i = 0; i < numSlices; i++) {
      // Draw Slice background
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 150, i * sliceAngle, (i + 1) * sliceAngle);
      ctx.closePath();
      ctx.fillStyle = this.COLORS[(i + 3) % this.COLORS.length]; // Offset color scheme
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'white';
      ctx.stroke();

      // Draw short text rotated
      ctx.save();
      ctx.rotate(i * sliceAngle + sliceAngle / 2);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.textAlign = 'right';
      
      const shortText = challenges[i].length > 20 ? challenges[i].substring(0, 18) + '...' : challenges[i];
      ctx.fillText(shortText, 135, 3.5);
      ctx.restore();
    }

    ctx.restore();

    // Draw center white circle
    ctx.beginPath();
    ctx.arc(160, 160, 30, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#E2E8F0';
    ctx.stroke();
  }

  // --- GAME ACTIONS ---

  isStudentChecked(studentId: string): boolean {
    return this.checkedStudentIds().includes(studentId);
  }

  toggleStudentActive(studentId: string, event: any) {
    const isChecked = event.target.checked;
    this.checkedStudentIds.update(ids => {
      if (isChecked) {
        return [...ids, studentId];
      } else {
        return ids.filter(id => id !== studentId);
      }
    });
    this.triggerRedraw();
  }

  toggleAll(checkAll: boolean) {
    if (checkAll) {
      this.checkedStudentIds.set(this.studentsList().map(s => s.id));
    } else {
      this.checkedStudentIds.set([]);
    }
    this.triggerRedraw();
  }

  shuffle() {
    const current = this.studentsList();
    // Fisher-Yates shuffle
    for (let i = current.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [current[i], current[j]] = [current[j], current[i]];
    }
    this.studentsList.set([...current]);
    this.triggerRedraw();
  }

  reinstateStudent(studentId: string) {
    this.alreadyPickedStudentIds.update(ids => ids.filter(id => id !== studentId));
    this.triggerRedraw();
  }

  startBuzz() {
    if (!this.liveQuestionText.trim()) return;
    this.db.startIceBreaker('buzz', { question: this.liveQuestionText.trim() });
  }

  startMission() {
    if (!this.liveMissionTitle.trim()) return;
    this.db.startIceBreaker('mission', { 
      title: this.liveMissionTitle.trim(), 
      description: this.liveMissionDesc.trim() 
    });
  }

  stopIceBreaker() {
    this.db.stopIceBreaker();
    this.liveQuestionText = '';
    this.liveMissionTitle = '';
    this.liveMissionDesc = '';
  }

  gradeBuzz(studentId: string, correct: boolean) {
    this.db.gradeIceBreakerBuzz(studentId, correct);
  }

  gradeMission(studentId: string, correct: boolean) {
    this.db.gradeIceBreakerMission(studentId, correct);
  }

  resetGame() {
    this.alreadyPickedStudentIds.set([]);
    this.showWinnerModal.set(false);
    this.selectedStudentName.set('');
    this.selectedChallengeText.set('');
    
    // Reset checked to defaults
    const presentIds = this.studentsList()
      .filter(s => {
        const code = this.todayRecords()[s.id];
        return code === 'P' || code === 'L';
      })
      .map(s => s.id);
    
    if (presentIds.length > 0) {
      this.checkedStudentIds.set(presentIds);
    } else {
      this.checkedStudentIds.set(this.studentsList().map(s => s.id));
    }
    
    this.triggerRedraw();
  }

  spinWheel(type: 'student' | 'challenge') {
    if (this.isSpinning()) return;

    if (type === 'student') {
      if (this.activeStudents().length === 0) {
        this.dialogService.alert('Erreur', 'Cochez au moins un élève actif pour tourner la roue.', 'info');
        return;
      }
      this.isSpinning.set(true);
      this.currentSpinningWheel = 'student';
      this.studentSpeed = Math.random() * 0.2 + 0.35;
      this.selectedStudentName.set('');
      this.selectedChallengeText.set('');
    } else {
      if (!this.selectedStudentName()) {
        this.dialogService.alert('Ordre requis', 'Veuillez d\'abord tirer au sort un élève avant d\'attribuer son défi !', 'info');
        return;
      }
      this.isSpinning.set(true);
      this.currentSpinningWheel = 'challenge';
      this.challengeSpeed = Math.random() * 0.2 + 0.35;
    }

    this.spinPhysicsLoop();
  }

  private spinPhysicsLoop() {
    const friction = 0.982;

    if (this.currentSpinningWheel === 'student') {
      this.studentAngle += this.studentSpeed;
      this.studentSpeed *= friction;
      this.drawStudentWheel();

      if (this.studentSpeed < 0.0015) {
        this.studentSpeed = 0;
        this.isSpinning.set(false);
        cancelAnimationFrame(this.animFrameId);
        this.onStudentSpinComplete();
      } else {
        this.animFrameId = requestAnimationFrame(() => this.spinPhysicsLoop());
      }
    } else if (this.currentSpinningWheel === 'challenge') {
      this.challengeAngle += this.challengeSpeed;
      this.challengeSpeed *= friction;
      this.drawChallengeWheel();

      if (this.challengeSpeed < 0.0015) {
        this.challengeSpeed = 0;
        this.isSpinning.set(false);
        cancelAnimationFrame(this.animFrameId);
        this.onChallengeSpinComplete();
      } else {
        this.animFrameId = requestAnimationFrame(() => this.spinPhysicsLoop());
      }
    }
  }

  onStudentSpinComplete() {
    const students = this.activeStudents();
    if (students.length === 0) return;

    const stSlice = (2 * Math.PI) / students.length;
    const rawStIdx = Math.floor(((2 * Math.PI - (this.studentAngle % (2 * Math.PI))) % (2 * Math.PI)) / stSlice);
    const winningStudent = students[rawStIdx];

    this.selectedStudentName.set(winningStudent.name);
    this.playNotificationBeep();
  }

  onChallengeSpinComplete() {
    const challenges = this.challengesList;
    const chSlice = (2 * Math.PI) / challenges.length;
    const rawChIdx = Math.floor(((2 * Math.PI - (this.challengeAngle % (2 * Math.PI))) % (2 * Math.PI)) / chSlice);
    const winningChallenge = challenges[rawChIdx];

    this.selectedChallengeText.set(winningChallenge);

    // Now trigger the winner modal with both details!
    this.winningStudentName.set(this.selectedStudentName());
    this.winningChallengeText.set(winningChallenge);
    
    this.playCelebrationSound();
    this.showWinnerModal.set(true);
  }

  closeWinnerModal(removeStudent: boolean) {
    const winnerName = this.winningStudentName();
    const student = this.studentsList().find(s => s.name === winnerName);
    
    if (student && removeStudent) {
      this.alreadyPickedStudentIds.update(ids => [...ids, student.id]);
    }
    
    this.selectedStudentName.set('');
    this.selectedChallengeText.set('');
    this.showWinnerModal.set(false);
    this.triggerRedraw();
  }

  playNotificationBeep() {
    if ('AudioContext' in window || '(webkitAudioContext)' in window) {
      try {
        const audioCtx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } catch (err) {}
    }
  }

  playCelebrationSound() {
    if ('AudioContext' in window || '(webkitAudioContext)' in window) {
      try {
        const audioCtx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
        
        // Fast triple victory chime
        const playTone = (freq: number, start: number, duration: number) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);
          
          gain.gain.setValueAtTime(0.12, start);
          gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
          
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          
          osc.start(start);
          osc.stop(start + duration);
        };

        const now = audioCtx.currentTime;
        playTone(523.25, now, 0.15); // C5
        playTone(659.25, now + 0.12, 0.15); // E5
        playTone(783.99, now + 0.24, 0.4); // G5
      } catch (err) {}
    }
  }
}
