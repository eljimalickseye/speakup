import { Component, inject, signal, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { DatabaseService, UserProfile, CoachingMessage } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

interface ToeicQuestion {
  id: number;
  section: 'listening' | 'reading';
  type: 'photo' | 'qa' | 'completion';
  audioPrompt?: string;
  imageAlt?: string;
  questionText: string;
  options: string[];
  correctOption: string; // 'A' | 'B' | 'C' | 'D'
  explanation: string;
}

@Component({
  selector: 'app-student-coaching',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="padding:20px; box-sizing:border-box">
      
      <!-- HEADER BANNER -->
      <div style="background:linear-gradient(135deg, #1E1B4B 0%, #311042 100%); border:1px solid #D97706; padding:24px; border-radius:16px; margin-bottom:24px; box-shadow:0 10px 30px rgba(217, 119, 6, 0.15); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px">
        <div>
          <div style="display:flex; align-items:center; gap:8px">
            <span style="background:#D97706; color:#1E1B4B; font-size:10px; font-weight:900; padding:3px 8px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px">VIP MENTORSHIP</span>
            @if (currentUser()?.isPrivateCoaching) {
              <span style="background:#10B981; color:white; font-size:10px; font-weight:800; padding:3px 8px; border-radius:20px; text-transform:uppercase">Actif</span>
            }
          </div>
          <h2 style="font-size:22px; font-weight:800; color:white; margin:8px 0 4px 0; display:flex; align-items:center; gap:8px">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            Accompagnement Privé & Préparation TOEIC
          </h2>
          <p style="font-size:13px; color:#E2E8F0; margin:0">Bénéficiez d'un coaching individuel personnalisé pour propulser votre niveau vers de nouveaux sommets académiques.</p>
        </div>
        
        @if (currentUser()?.isPrivateCoaching) {
          <div style="display:flex; gap:12px">
            <button (click)="activeSubTab.set('coaching')" class="btn-s" [style.background]="activeSubTab() === 'coaching' ? '#D97706' : 'rgba(255,255,255,0.08)'" [style.color]="activeSubTab() === 'coaching' ? '#1E1B4B' : 'white'" [style.border]="activeSubTab() === 'coaching' ? '1px solid #D97706' : '1px solid rgba(255,255,255,0.2)'" style="font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              Mon Coach
            </button>
            <button (click)="activeSubTab.set('toeic')" class="btn-s" [style.background]="activeSubTab() === 'toeic' ? '#D97706' : 'rgba(255,255,255,0.08)'" [style.color]="activeSubTab() === 'toeic' ? '#1E1B4B' : 'white'" [style.border]="activeSubTab() === 'toeic' ? '1px solid #D97706' : '1px solid rgba(255,255,255,0.2)'" style="font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              Simulateur TOEIC
            </button>
          </div>
        }
      </div>

      <!-- CASE A: PRIVATE COACHING NOT ACTIVE -->
      @if (!currentUser()?.isPrivateCoaching) {
        <div style="background:white; border:1px solid var(--border-weak); border-radius:16px; padding:32px; box-shadow:0 4px 20px rgba(0,0,0,0.05); text-align:center; max-width:800px; margin: 0 auto">
          <div style="margin-bottom:16px; display:inline-flex; padding:16px; background:#FEF3C7; border-radius:50%; box-shadow:0 8px 24px rgba(217,119,6,0.15)">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14a1 1 0 0 0 1-1v-1H4v1a1 1 0 0 0 1 1z"/></svg>
          </div>
          <h3 style="font-size:20px; font-weight:800; color:var(--text-primary); margin:0 0 12px 0">Déverrouillez Votre Accompagnement Privé</h3>
          <p style="font-size:14px; color:var(--text-secondary); max-width:600px; margin:0 auto 24px auto; line-height:1.6">
            Vous souhaitez accélérer votre progression, passer du niveau <strong>A2 à B2</strong> ou vous préparer spécifiquement au passage du <strong>TOEIC / IELTS</strong> ? 
            L'Accompagnement Privé met à votre disposition un coach dédié pour concevoir des feuilles de route adaptées, corriger vos productions orales et suivre pas à pas vos efforts.
          </p>

          <!-- VIP FEATURES GRID -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:32px; text-align:left">
            <div style="background:#FDFBF7; border:1px solid #FEF3C7; border-radius:12px; padding:16px">
              <div style="margin-bottom:8px; display:flex; align-items:center; justify-content:center; width:36px; height:36px; background:#FEF3C7; border-radius:8px">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
              </div>
              <h4 style="font-size:13px; font-weight:700; color:#92400E; margin:0 0 4px 0">Feuille de Route Dédiée</h4>
              <p style="font-size:11.5px; color:#B45309; margin:0">Un plan étape par étape rédigé par votre professeur pour cibler vos lacunes.</p>
            </div>
            <div style="background:#EEF2FF; border:1px solid #E0E7FF; border-radius:12px; padding:16px">
              <div style="margin-bottom:8px; display:flex; align-items:center; justify-content:center; width:36px; height:36px; background:#E0E7FF; border-radius:8px">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
              </div>
              <h4 style="font-size:13px; font-weight:700; color:#3730A3; margin:0 0 4px 0">Corrections Vocales Directes</h4>
              <p style="font-size:11.5px; color:#4F46E5; margin:0">Envoyez des messages vocaux et recevez des commentaires oraux du coach.</p>
            </div>
            <div style="background:#ECFDF5; border:1px solid #D1FAE5; border-radius:12px; padding:16px">
              <div style="margin-bottom:8px; display:flex; align-items:center; justify-content:center; width:36px; height:36px; background:#D1FAE5; border-radius:8px">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polygon points="17 6 23 6 23 12"/></svg>
              </div>
              <h4 style="font-size:13px; font-weight:700; color:#065F46; margin:0 0 4px 0">Préparation TOEIC / TOEFL</h4>
              <p style="font-size:11.5px; color:#047857; margin:0">Accédez au simulateur de test de niveau et suivez votre estimation de score.</p>
            </div>
          </div>

          <!-- REQUEST ACTION BUTTON -->
          @if (currentUser()?.privateCoachingRequested) {
            <div style="background:#FEF3C7; border:1px solid #F59E0B; color:#92400E; border-radius:12px; padding:16px; font-weight:700; font-size:13px; display:inline-flex; align-items:center; gap:8px">
              ⏳ Demande en attente de validation par votre professeur...
            </div>
          } @else {
            <button (click)="requestCoaching()" class="btn-s" style="background:#D97706; color:#1E1B4B; border:none; padding:12px 32px; border-radius:30px; font-weight:800; font-size:14px; cursor:pointer; box-shadow:0 8px 16px rgba(217, 119, 6, 0.2); transition:transform 0.15s">
              Demander mon Accompagnement Privé ⚡
            </button>
          }
        </div>
      }

      <!-- CASE B: PRIVATE COACHING ACTIVE -->
      @if (currentUser()?.isPrivateCoaching) {
        
        <!-- SUB-TAB 1: COACHING CHAT & ROADMAP -->
        @if (activeSubTab() === 'coaching') {
          <div class="vip-grid">
            
            <!-- LEFT PANEL: COACH PRIVATE CHAT -->
            <div class="card vip-left" style="display:flex; flex-direction:column; height:680px; padding:0; overflow:hidden">
              
              <!-- Chat Header -->
              <div style="background:#1E1B4B; color:white; padding:16px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.1)">
                <div style="display:flex; align-items:center; gap:10px">
                  <div style="width:40px; height:40px; background:#D97706; color:#1E1B4B; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:16px">
                    👨‍🏫
                  </div>
                  <div>
                    <div style="font-size:13.5px; font-weight:800">Votre Coach Privé</div>
                    <div style="font-size:10px; color:#A5B4FC">Messagerie directe sécurisée</div>
                  </div>
                </div>
              </div>

              <!-- Chat messages list -->
              <div #chatContainer style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:12px; background:#F8FAFC">
                @if (messages().length === 0) {
                  <div style="text-align:center; color:var(--text-muted); font-size:12px; padding:40px">
                    Aucun message. Envoyez votre premier message ou question de prononciation à votre coach !
                  </div>
                }
                @for (m of messages(); track m.id) {
                  <div [style.align-self]="m.senderRole === 'student' ? 'flex-end' : 'flex-start'"
                       [style.max-width]="'70%'"
                       style="display:flex; flex-direction:column; gap:4px">
                    
                    <!-- Sender metadata -->
                    <span style="font-size:10px; color:var(--text-muted); padding: 0 4px" [style.text-align]="m.senderRole === 'student' ? 'right' : 'left'">
                      {{ m.senderName }} · {{ m.timestamp | date:'HH:mm' }}
                    </span>

                    <!-- Bubble -->
                    <div [style.background]="m.senderRole === 'student' ? '#1E1B4B' : 'white'"
                         [style.color]="m.senderRole === 'student' ? 'white' : 'var(--text-primary)'"
                         [style.border]="m.senderRole === 'student' ? 'none' : '1px solid #E2E8F0'"
                         [style.border-radius]="m.senderRole === 'student' ? '12px 12px 0 12px' : '12px 12px 12px 0'"
                         style="padding:10px 14px; font-size:12.5px; box-shadow:0 1px 3px rgba(0,0,0,0.05)">
                      
                      @if (m.text) {
                        <div>{{ m.text }}</div>
                      }
                      
                      @if (m.audioUrl) {
                        <div style="margin-top:6px">
                          <audio controls [src]="sanitizeUrl(m.audioUrl)" style="max-width:100%; height:32px"></audio>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Chat inputs / writing panel -->
              <div style="padding:12px; background:white; border-top:1px solid #E2E8F0; display:flex; flex-direction:column; gap:8px">
                
                <!-- Audio Recording Indicator -->
                @if (recordingState() === 'recording') {
                  <div style="display:flex; align-items:center; gap:12px; background:#FEF2F2; border:1px solid #FCA5A5; padding:8px 12px; border-radius:8px">
                    <span style="width:8px; height:8px; background:#EF4444; border-radius:50%; display:inline-block; animation: pulse-live 1s infinite"></span>
                    <span style="font-size:11.5px; color:#EF4444; font-weight:800">
                      Enregistrement vocal... {{ recordSeconds() }}s
                    </span>
                    <button (click)="stopAudioRecording(true)" style="background:none; border:none; color:#DC2626; cursor:pointer; font-size:11px; font-weight:800; margin-left:auto">
                      Annuler
                    </button>
                    <button (click)="stopAudioRecording(false)" class="btn-s" style="background:#EF4444; color:white; border:none; padding:4px 10px; font-size:11px; font-weight:800; cursor:pointer">
                      Arrêter & Envoyer
                    </button>
                  </div>
                }

                <div style="display:flex; align-items:center; gap:8px">
                  <!-- Microphone Button -->
                  @if (recordingState() === 'idle') {
                    <button (click)="startAudioRecording()" 
                            title="Enregistrer un message vocal de prononciation"
                            style="background:#FEF2F2; border:1.5px solid #FCA5A5; color:#EF4444; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:transform 0.1s">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                    </button>
                  }

                  <!-- Input Text -->
                  <input type="text" 
                         [(ngModel)]="newMsgText" 
                         (keyup.enter)="sendMessage()"
                         [disabled]="recordingState() === 'recording'"
                         placeholder="Écrivez votre question ou message privé..." 
                         style="flex:1; border:1px solid #E2E8F0; padding:10px 14px; border-radius:24px; font-size:12.5px; outline:none; background:#F8FAFC; transition:border-color 0.15s">
                  
                  <button (click)="sendMessage()" 
                          [disabled]="!newMsgText.trim() || recordingState() === 'recording'"
                          class="btn-s" 
                          style="background:#1E1B4B; color:white; border:none; border-radius:24px; height:36px; padding:0 16px; font-weight:700; cursor:pointer">
                    Envoyer
                  </button>
                </div>
              </div>

            </div>

            <div class="vip-right" style="display:flex; flex-direction:column; gap:20px; height:680px; overflow-y:auto; padding-right:4px">
              
              <!-- GOAL STATUS CARD -->
              <div class="card" style="background:linear-gradient(135deg, #FFF 0%, #FAF8F5 100%); border:1px solid #F59E0B; padding:18px">
                <h4 style="font-size:11px; font-weight:800; color:#D97706; text-transform:uppercase; margin:0 0 8px 0; letter-spacing:0.5px">🎯 Objectif Général</h4>
                <div style="font-size:14px; font-weight:800; color:#1E1B4B; margin-bottom:8px">
                  {{ currentUser()?.privateCoachingGoal || 'En cours de définition par votre coach...' }}
                </div>
                <div style="display:flex; align-items:center; gap:8px">
                  <div style="flex:1; height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden">
                    <div [style.width]="roadmapProgress() + '%'" style="height:100%; background:#F59E0B; border-radius:3px"></div>
                  </div>
                  <span style="font-size:11px; font-weight:700; color:#B45309">{{ roadmapProgress() }}%</span>
                </div>
              </div>

              <!-- DETAILED ROADMAP CHECKLIST -->
              <div class="card" style="padding:18px">
                <h4 style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin:0 0 12px 0; letter-spacing:0.5px">🗺️ Feuille de Route</h4>
                
                <div style="display:flex; flex-direction:column; gap:10px">
                  @if (!currentUser()?.privateCoachingRoadmap || currentUser()?.privateCoachingRoadmap?.length === 0) {
                    <div style="font-size:12px; color:var(--text-muted); text-align:center; padding:16px">
                      Aucune tâche assignée dans votre feuille de route pour le moment.
                    </div>
                  }
                  @for (step of currentUser()?.privateCoachingRoadmap; track step.id; let idx = $index) {
                    <div style="display:flex; align-items:flex-start; gap:10px; padding:8px; border-radius:8px; background:#F8FAFC; border:1px solid #E2E8F0">
                      <input type="checkbox" 
                             [checked]="step.done" 
                             (change)="toggleRoadmapStep(step.id, $event)" 
                             style="margin-top:2px; cursor:pointer">
                      <span [style.text-decoration]="step.done ? 'line-through' : 'none'"
                            [style.color]="step.done ? 'var(--text-muted)' : 'var(--text-primary)'"
                            style="font-size:12px; line-height:1.4">
                        {{ step.text }}
                      </span>
                    </div>
                  }
                </div>
              </div>

              <!-- COACH GENERAL NOTES -->
              <div class="card" style="padding:18px; border-left:4px solid #311042">
                <h4 style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin:0 0 8px 0; letter-spacing:0.5px">💡 Observations de votre Coach</h4>
                <p style="font-size:12px; color:var(--text-secondary); line-height:1.5; margin:0; white-space:pre-line">
                  {{ currentUser()?.privateCoachingNotes || 'Pas encore de note spécifique du coach. Continuez à vous entraîner !' }}
                </p>
              </div>

            </div>

          </div>
        }

        <!-- SUB-TAB 2: TOEIC EXAM SIMULATOR -->
        @if (activeSubTab() === 'toeic') {
          <div class="card" style="padding:24px">
            
            <!-- SIMULATOR STATE: INTRO -->
            @if (toeicState() === 'intro') {
              <div style="text-align:center; max-width:600px; margin: 0 auto; padding: 20px 0">
                <div style="font-size:48px; margin-bottom:12px">📝</div>
                <h3 style="font-size:18px; font-weight:800; color:var(--text-primary); margin:0 0 8px 0">Simulateur d'Examen TOEIC (Mini-Mock)</h3>
                <p style="font-size:13px; color:var(--text-secondary); line-height:1.6; margin-bottom:24px">
                  Mesurez vos compétences académiques réelles à travers un entraînement ciblé contenant une section **Listening** (Compréhension Orale parlée à haute voix) et une section **Reading** (Grammaire & Vocabulaire).
                </p>

                <!-- STATS OR LAST SCORE -->
                @if (lastToeicScore() !== null) {
                  <div style="background:#ECFDF5; border:1px solid #D1FAE5; border-radius:12px; padding:16px; margin-bottom:24px">
                    <span style="font-size:11px; font-weight:700; color:#047857; text-transform:uppercase">Votre dernier score estimé :</span>
                    <div style="font-size:32px; font-weight:900; color:#065F46; margin:4px 0">{{ lastToeicScore() }} / 990</div>
                    <span class="badge" style="background:#047857; color:white; font-size:10px">Niveau estimé : {{ getToeicLevelName(lastToeicScore() || 0) }}</span>
                  </div>
                }

                <button (click)="startToeicTest()" class="btn-s" style="background:#1E1B4B; color:white; border:none; padding:12px 36px; border-radius:30px; font-weight:800; font-size:13.5px; cursor:pointer; box-shadow:0 6px 20px rgba(30, 27, 75, 0.15)">
                  Lancer le Test de Préparation (10 Questions) 🚀
                </button>
              </div>
            }

            <!-- SIMULATOR STATE: ACTIVE TEST -->
            @if (toeicState() === 'test') {
              <div>
                <!-- Progress Header -->
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #E2E8F0; padding-bottom:12px; margin-bottom:20px">
                  <div>
                    <span style="font-size:10px; font-weight:800; color:#4F46E5; text-transform:uppercase">
                      Section {{ currentToeicQuestion().section === 'listening' ? '1: Listening 🎧' : '2: Reading 📖' }}
                    </span>
                    <h3 style="font-size:14px; font-weight:800; color:var(--text-primary); margin:2px 0 0 0">
                      Question {{ currentQuestionIdx() + 1 }} sur {{ toeicQuestions.length }}
                    </h3>
                  </div>
                  <div style="font-size:12px; font-weight:700; color:var(--text-muted)">
                    {{ Math.round(((currentQuestionIdx()) / toeicQuestions.length) * 100) }}% complété
                  </div>
                </div>

                <!-- QUESTION BOARD -->
                <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:20px; margin-bottom:20px">
                  
                  <!-- Audio Player/Triggers for Listening Section -->
                  @if (currentToeicQuestion().section === 'listening') {
                    <div style="background:white; border:1px solid #E2E8F0; border-radius:10px; padding:16px; text-align:center; margin-bottom:16px">
                      <div style="font-size:12px; font-weight:800; color:#1E293B; margin-bottom:8px">🎧 CLIQUEZ POUR ÉCOUTER LA CONSIGNE ORALE :</div>
                      <button (click)="speakPrompt(currentToeicQuestion().audioPrompt || '')" 
                              class="btn-s"
                              style="background:#4F46E5; color:white; border:none; padding:8px 16px; border-radius:20px; display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-weight:700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                        Écouter l'enregistrement
                      </button>
                    </div>

                    @if (currentToeicQuestion().type === 'photo') {
                      <!-- Photo Simulator graphic -->
                      <div style="display:flex; justify-content:center; margin-bottom:16px">
                        <div style="width:260px; height:160px; background:linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%); border-radius:8px; border:1px solid #94A3B8; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:12px; color:#475569">
                          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          <div style="font-size:11px; font-weight:700; margin-top:8px">Simulateur d'Image</div>
                          <div style="font-size:10px; opacity:0.8">{{ currentToeicQuestion().imageAlt }}</div>
                        </div>
                      </div>
                    }
                  }

                  <!-- Question Text -->
                  <div style="font-size:14.5px; font-weight:800; color:#1E293B; margin-bottom:16px; line-height:1.5">
                    {{ currentToeicQuestion().questionText }}
                  </div>

                  <!-- Options list -->
                  <div style="display:flex; flex-direction:column; gap:8px">
                    @for (opt of currentToeicQuestion().options; track opt; let idx = $index) {
                      <div (click)="selectOption(idx)"
                           [style.background]="selectedOptionIdx() === idx ? '#EEF2FF' : 'white'"
                           [style.border-color]="selectedOptionIdx() === idx ? '#4F46E5' : '#E2E8F0'"
                           style="border:1px solid; border-radius:8px; padding:12px 16px; cursor:pointer; display:flex; align-items:center; gap:10px; font-size:12.5px; font-weight:600; transition:all 0.15s">
                        <span [style.background]="selectedOptionIdx() === idx ? '#4F46E5' : '#F1F5F9'"
                              [style.color]="selectedOptionIdx() === idx ? 'white' : '#4F46E5'"
                              style="width:20px; height:20px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:800">
                          {{ ['A', 'B', 'C', 'D'][idx] }}
                        </span>
                        <span>{{ opt }}</span>
                      </div>
                    }
                  </div>

                </div>

                <!-- Footer Nav buttons -->
                <div style="display:flex; justify-content:space-between; align-items:center">
                  <button (click)="cancelTest()" class="btn-s" style="border-color:#EF4444; color:#EF4444; cursor:pointer">
                    Quitter le test
                  </button>
                  <button (click)="nextQuestion()" 
                          [disabled]="selectedOptionIdx() === null"
                          class="btn-s" 
                          style="background:#1E1B4B; color:white; border:none; padding:8px 24px; font-weight:700; cursor:pointer">
                    {{ currentQuestionIdx() + 1 === toeicQuestions.length ? 'Terminer l\\'examen' : 'Suivant ➔' }}
                  </button>
                </div>
              </div>
            }

            <!-- SIMULATOR STATE: SCORE ANALYSIS -->
            @if (toeicState() === 'results') {
              <div style="text-align:center; max-width:600px; margin: 0 auto; padding: 20px 0">
                <div style="font-size:54px; margin-bottom:12px">🎉</div>
                <h3 style="font-size:18px; font-weight:800; color:var(--text-primary); margin:0 0 4px 0">Examen Complété !</h3>
                <p style="font-size:12.5px; color:var(--text-secondary); margin-bottom:20px">Votre performance a été évaluée selon l'échelle officielle du TOEIC.</p>

                <!-- SCORE DISPLAY -->
                <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:16px; padding:24px; margin-bottom:24px">
                  <div style="font-size:12px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px">Score Global Estimé</div>
                  <div style="font-size:44px; font-weight:900; color:#1E1B4B; margin:8px 0">{{ calculatedScore() }} / 990</div>
                  
                  <div style="display:inline-block; background:#EEF2FF; border:1px solid #E0E7FF; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:800; color:#4F46E5">
                    Équivalence Niveau : {{ getToeicLevelName(calculatedScore()) }}
                  </div>

                  <div style="margin-top:16px; font-size:12.5px; color:var(--text-secondary)">
                    Vous avez obtenu <strong>{{ correctCount() }}</strong> bonnes réponses sur <strong>{{ toeicQuestions.length }}</strong>.
                  </div>
                </div>

                <!-- DETAILED QUESTIONS ANSWERS REVIEW -->
                <div style="text-align:left; margin-bottom:24px">
                  <h4 style="font-size:12px; font-weight:800; color:var(--text-primary); margin-bottom:12px; border-bottom:1px solid #E2E8F0; padding-bottom:6px">Revue des Erreurs & Explications :</h4>
                  <div style="display:flex; flex-direction:column; gap:12px">
                    @for (q of toeicQuestions; track q.id; let qIdx = $index) {
                      <div style="border-radius:8px; border:1px solid #E2E8F0; padding:12px" [style.background]="studentAnswers[qIdx] === q.correctOption ? '#ECFDF5' : '#FEF2F2'">
                        <div style="font-size:12px; font-weight:700; color:var(--text-primary)">
                          {{ qIdx + 1 }}. {{ q.questionText }}
                        </div>
                        <div style="font-size:11.5px; margin-top:6px; display:flex; gap:12px">
                          <span>Votre choix : <strong>{{ studentAnswers[qIdx] || 'Aucun' }}</strong></span>
                          <span>Correct : <strong style="color:#047857">{{ q.correctOption }}</strong></span>
                        </div>
                        <div style="font-size:11px; color:#475569; margin-top:6px; font-style:italic">
                          💡 Explication : {{ q.explanation }}
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <button (click)="toeicState.set('intro')" class="btn-s" style="background:#1E1B4B; color:white; border:none; padding:10px 24px; border-radius:8px; font-weight:700; cursor:pointer">
                  Retour au simulateur
                </button>
              </div>
            }

          </div>
        }

      }

    </div>
  `,
  styles: [`
    @keyframes pulse-live {
      from { transform: scale(1); opacity: 1; }
      to { transform: scale(1.05); opacity: 0.85; }
    }
    .vip-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 20px;
      align-items: start;
    }
    .vip-right::-webkit-scrollbar {
      width: 6px;
    }
    .vip-right::-webkit-scrollbar-track {
      background: transparent;
    }
    .vip-right::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 4px;
    }
    @media (max-width: 900px) {
      .vip-grid {
        grid-template-columns: 1fr;
      }
      .vip-left, .vip-right {
        height: auto !important;
      }
    }
  `]
})
export class StudentCoachingComponent implements AfterViewChecked {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  activeSubTab = signal<'coaching' | 'toeic'>('coaching');

  // Chat/Messaging States
  messages = signal<CoachingMessage[]>([]);
  newMsgText = '';
  recordingState = signal<'idle' | 'recording'>('idle');
  recordSeconds = signal<number>(0);
  
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private timerInterval: any = null;

  currentUser = signal<UserProfile | null>(null);
  activeLang = this.db.activeLang;

  // Simulator States
  toeicState = signal<'intro' | 'test' | 'results'>('intro');
  currentQuestionIdx = signal<number>(0);
  selectedOptionIdx = signal<number | null>(null);
  correctCount = signal<number>(0);
  studentAnswers: { [qIdx: number]: string } = {};
  calculatedScore = signal<number>(0);
  lastToeicScore = signal<number | null>(null);

  toeicQuestions: ToeicQuestion[] = [
    {
      id: 1,
      section: 'listening',
      type: 'photo',
      audioPrompt: 'Statement A: The man is typing on a keyboard. Statement B: The man is drinking coffee. Statement C: The man is filing papers. Statement D: The man is adjusting his monitor.',
      imageAlt: 'A businessman sitting at a desk with a computer monitor',
      questionText: 'Listen to the statements. Which statement best describes the photograph?',
      options: ['Statement A', 'Statement B', 'Statement C', 'Statement D'],
      correctOption: 'A',
      explanation: 'Le statement A décrit exactement l\'homme en train de taper sur son clavier d\'ordinateur.'
    },
    {
      id: 2,
      section: 'listening',
      type: 'qa',
      audioPrompt: 'Where is the marketing brochure file stored? Option A: Yes, I sent it yesterday. Option B: In the shared Google Drive folder. Option C: No, it is not ready yet.',
      questionText: 'Listen to the question. What is the most appropriate response?',
      options: ['Option A', 'Option B', 'Option C'],
      correctOption: 'B',
      explanation: 'La question demande un emplacement ("Where"). L\'option B indique le dossier Google Drive partagé.'
    },
    {
      id: 3,
      section: 'listening',
      type: 'qa',
      audioPrompt: 'Why did the flight get delayed? Option A: Due to bad weather conditions in New York. Option B: To New York City. Option C: Yes, the gate changed.',
      questionText: 'Listen to the question. What is the most appropriate response?',
      options: ['Option A', 'Option B', 'Option C'],
      correctOption: 'A',
      explanation: 'La question demande la raison ("Why"). L\'option A explique qu\'il s\'agit des conditions météorologiques.'
    },
    {
      id: 4,
      section: 'reading',
      type: 'completion',
      questionText: 'Our company policy dictates that all expense reports must be submitted _______ the end of the month.',
      options: ['before', 'between', 'during', 'under'],
      correctOption: 'A',
      explanation: '"Before" est la préposition temporelle correcte pour indiquer une date limite.'
    },
    {
      id: 5,
      section: 'reading',
      type: 'completion',
      questionText: 'The human resources department has decided to _______ the training session until next Thursday.',
      options: ['postpone', 'cancel', 'participate', 'demand'],
      correctOption: 'A',
      explanation: '"Postpone" signifie repousser à plus tard, ce qui est validé par "until next Thursday".'
    },
    {
      id: 6,
      section: 'reading',
      type: 'completion',
      questionText: 'If the budget is approved, we _______ the development of the new mobile application immediately.',
      options: ['will start', 'would start', 'started', 'starting'],
      correctOption: 'A',
      explanation: 'Conditionnel type 1 : "If" + présent (is approved), proposition principale au futur simple (will start).'
    },
    {
      id: 7,
      section: 'reading',
      type: 'completion',
      questionText: 'Mr. Vance has chosen to retire early because of _______ health issues.',
      options: ['recurring', 'recurr', 'recurs', 'recursively'],
      correctOption: 'A',
      explanation: '"Recurring" (adjectif dérivé du participe présent) qualifie correctement le nom "health issues".'
    },
    {
      id: 8,
      section: 'reading',
      type: 'completion',
      questionText: 'The project manager announced that the team completed the upgrade ahead _______ schedule.',
      options: ['of', 'to', 'for', 'with'],
      correctOption: 'A',
      explanation: 'L\'expression correcte est "ahead of schedule" (en avance sur le planning).'
    },
    {
      id: 9,
      section: 'reading',
      type: 'completion',
      questionText: 'Please make sure that the client signs the contract before _______ the shipment.',
      options: ['authorizing', 'authorized', 'authorize', 'authorizes'],
      correctOption: 'A',
      explanation: 'Après la préposition "before", on utilise le gérondif (verbe en -ing).'
    },
    {
      id: 10,
      section: 'reading',
      type: 'completion',
      questionText: 'Sales figures rose _______ during the third quarter, exceeding all predictions.',
      options: ['significantly', 'significant', 'significance', 'signify'],
      correctOption: 'A',
      explanation: 'Il faut un adverbe ("significantly") pour qualifier le verbe d\'action "rose".'
    }
  ];

  currentToeicQuestion = computed(() => {
    return this.toeicQuestions[this.currentQuestionIdx()];
  });

  constructor() {
    this.db.observeCurrentUser().subscribe(u => {
      this.currentUser.set(u);
      if (u) {
        // Observe coaching messages feed
        this.db.observeCoachingMessages(u.id).subscribe(msgs => {
          this.messages.set(msgs);
          this.scrollToBottom();
        });

        // Load last TOEIC score if stored in history
        const localScore = localStorage.getItem('speak_toeic_score_' + u.id);
        if (localScore) {
          this.lastToeicScore.set(parseInt(localScore));
        }
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    } catch (err) {}
  }

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

  sanitizeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  // --- ACTIONS ---

  async requestCoaching() {
    const user = this.db.getCurrentUser();
    if (!user) return;
    await this.db.requestPrivateCoaching(user.id);
    this.dialogService.alert(
      'Demande Envoyée ! ⏳',
      'Votre demande d\'accompagnement privé a bien été envoyée à votre professeur. Vous serez notifié dès sa validation.',
      'success'
    );
  }

  async sendMessage() {
    const user = this.db.getCurrentUser();
    if (!user || !this.newMsgText.trim()) return;

    await this.db.sendCoachingMessage(user.id, this.newMsgText.trim());
    this.newMsgText = '';
  }

  // --- AUDIO RECORDING FOR DIRECT CHAT ---

  private isRecordingCancelled = false;

  private getBestAudioMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4'
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  }

  async startAudioRecording() {
    this.recordingState.set('recording');
    this.recordSeconds.set(0);
    this.audioChunks = [];
    this.isRecordingCancelled = false;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = this.getBestAudioMimeType();
      const options: MediaRecorderOptions = { audioBitsPerSecond: 128000 };
      if (mimeType) options.mimeType = mimeType;

      this.mediaRecorder = new MediaRecorder(this.mediaStream, options);
      const actualMime = this.mediaRecorder.mimeType || mimeType || 'audio/webm';

      this.mediaRecorder.ondataavailable = (e: any) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        if (this.isRecordingCancelled) return;
        const audioBlob = new Blob(this.audioChunks, { type: actualMime });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Url = reader.result as string;
          const user = this.db.getCurrentUser();
          if (user) {
            await this.db.sendCoachingMessage(user.id, '[Message Vocal 🎙️]', base64Url);
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      this.mediaRecorder.start();

      this.timerInterval = setInterval(() => {
        this.recordSeconds.set(this.recordSeconds() + 1);
      }, 1000);
    } catch (e) {
      console.error('Failed to access microphone', e);
      this.recordingState.set('idle');
      this.dialogService.alert('Erreur', 'Impossible d\'accéder à votre microphone.', 'info');
    }
  }

  stopAudioRecording(cancel: boolean) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.recordingState.set('idle');
    this.isRecordingCancelled = cancel;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      if (cancel) {
        this.audioChunks = [];
      }
      this.mediaRecorder.stop();
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
    }
  }

  // --- ROADMAP CHECKS ---

  async toggleRoadmapStep(stepId: string, event: any) {
    const user = this.db.getCurrentUser();
    if (!user || !user.privateCoachingRoadmap) return;

    const updatedRoadmap = user.privateCoachingRoadmap.map(step => {
      if (step.id === stepId) {
        return { ...step, done: event.target.checked };
      }
      return step;
    });

    await this.db.updatePrivateCoaching(user.id, {
      privateCoachingRoadmap: updatedRoadmap
    });
  }

  roadmapProgress(): number {
    const user = this.db.getCurrentUser();
    if (!user || !user.privateCoachingRoadmap || user.privateCoachingRoadmap.length === 0) return 0;
    const completed = user.privateCoachingRoadmap.filter(s => s.done).length;
    return Math.round((completed / user.privateCoachingRoadmap.length) * 100);
  }

  // --- TOEIC SIMULATOR ---

  startToeicTest() {
    this.toeicState.set('test');
    this.currentQuestionIdx.set(0);
    this.selectedOptionIdx.set(null);
    this.correctCount.set(0);
    this.studentAnswers = {};
  }

  speakPrompt(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    } else {
      this.dialogService.alert('Navigateur non supporté', 'La synthèse vocale n\'est pas supportée sur ce navigateur.', 'info');
    }
  }

  selectOption(idx: number) {
    this.selectedOptionIdx.set(idx);
  }

  nextQuestion() {
    const activeQIdx = this.currentQuestionIdx();
    const letter = ['A', 'B', 'C', 'D'][this.selectedOptionIdx() || 0];
    this.studentAnswers[activeQIdx] = letter;

    if (letter === this.currentToeicQuestion().correctOption) {
      this.correctCount.set(this.correctCount() + 1);
    }

    if (activeQIdx + 1 === this.toeicQuestions.length) {
      // Finalize test and calculate TOEIC score (proportional weight out of 990)
      const ratio = this.correctCount() / this.toeicQuestions.length;
      let estimated = Math.round(ratio * 990);
      
      // TOEIC bounds correction
      if (estimated < 10) estimated = 10;
      if (estimated > 990) estimated = 990;

      this.calculatedScore.set(estimated);
      this.lastToeicScore.set(estimated);
      
      const user = this.db.getCurrentUser();
      if (user) {
        localStorage.setItem('speak_toeic_score_' + user.id, String(estimated));
      }

      this.toeicState.set('results');
    } else {
      this.currentQuestionIdx.set(activeQIdx + 1);
      this.selectedOptionIdx.set(null);
    }
  }

  cancelTest() {
    this.toeicState.set('intro');
  }

  getToeicLevelName(score: number): string {
    if (score >= 945) return 'C1 (Advanced Proficiency)';
    if (score >= 785) return 'B2 (Upper Intermediate)';
    if (score >= 550) return 'B1 (Threshold / Intermediate)';
    if (score >= 225) return 'A2 (Waystage / Elementary)';
    return 'A1 (Breakthrough)';
  }

  // --- HELPERS ---
  Math = Math;
}
