import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, UserProfile, JourneyMission } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

export interface TravelStage {
  id: number;
  titleFr: string;
  titleEn: string;
  locationFr: string;
  locationEn: string;
  speaker: string;
  dialogueEn: string;
  dialogueFr: string;
  questionFr: string;
  questionEn: string;
  optionsFr: string[];
  optionsEn: string[];
  correctIdx: number;
  explanationFr: string;
  explanationEn: string;
  iconSvg: string;
  completed?: boolean;
}

@Component({
  selector: 'app-student-journey',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" style="animation: fadeIn 0.28s ease; padding: 20px">
      
      <!-- HERO BANNER -->
      <div class="card" style="margin-top:0; background:linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%); color:white; border:none; padding:24px; border-radius:16px; box-shadow:0 10px 30px rgba(67,56,202,0.25); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px">
        <div>
          <span style="font-size:10px; background:rgba(255,255,255,0.2); color:white; font-weight:900; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px">
            SPEAKUP INTERACTIVE TRAVEL ADVENTURE
          </span>
          <h2 style="font-size:22px; font-weight:900; margin:8px 0 4px 0; color:#FFF; display:flex; align-items:center; gap:8px">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#A5B4FC" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.2c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>
            {{ t('Aventure de Voyage : Londres & New York', 'Travel Adventure: London & New York') }}
          </h2>
          <p style="font-size:13px; color:#E0E7FF; margin:0; max-width:620px; line-height:1.5">
            {{ t('Voyagez à travers la plateforme, jouez des scènes réelles avec les habitants locaux, et validez vos compétences pour débloquer de nouveaux chapitres !', 'Travel through the platform, roleplay real-life situations with locals, and validate your skills to unlock new chapters!') }}
          </p>
        </div>
      </div>

      <!-- ACTIVE MISSION MAIN CONTAINER -->
      @if (activeMission(); as mission) {
        <div class="card" style="margin-top:24px; border:2px solid #6366F1; border-radius:16px; padding:24px; box-shadow:0 8px 24px rgba(99,102,241,0.08)">
          
          <!-- Mission Header -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap; margin-bottom:24px">
            <div>
              <span class="badge" style="background:#6366F1; color:white; font-size:10px; font-weight:800; border-radius:6px; padding:4px 10px; text-transform:uppercase; letter-spacing:0.5px; display:inline-flex; align-items:center; gap:4px">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
                {{ t('MISSION ACTIVES EN COURS', 'CURRENT ACTIVE MISSION') }}
              </span>
              <h3 style="font-size:18px; font-weight:900; color:var(--text-primary); margin:8px 0 4px 0">{{ getMissionTitle(mission) }}</h3>
              <p style="font-size:13px; color:var(--text-secondary); line-height:1.5; margin:0">{{ getMissionDescription(mission) }}</p>
            </div>

            <button (click)="openTravelGame(1)" class="btn-p" style="background:linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); border:none; padding:12px 24px; border-radius:12px; font-weight:900; font-size:13.5px; display:flex; align-items:center; gap:8px; box-shadow:0 8px 20px rgba(79,70,229,0.3); color:white; cursor:pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {{ t('Lancer l\'Aventure Interactive ✈️', 'Launch Interactive Travel Game ✈️') }}
            </button>
          </div>

          <!-- INTERACTIVE TRAVEL ROADMAP / STAGES MAP -->
          <div style="margin-bottom:24px; background:var(--surface-2); border:1px solid var(--border-weak); border-radius:14px; padding:20px">
            <h4 style="font-size:12px; font-weight:900; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.5px; margin:0 0 16px 0; display:flex; align-items:center; gap:6px">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2.5"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ t('Itinéraire du Voyage — Londres', 'London Travel Map — Stages') }}
            </h4>

            <!-- Grid of 4 Interactive Travel Stages -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px">
              @for (st of travelStages; track st.id) {
                <div (click)="openTravelGame(st.id)"
                     style="background:white; border:2px solid; border-radius:12px; padding:14px; cursor:pointer; transition:all 0.2s ease; position:relative; overflow:hidden"
                     [style.borderColor]="st.completed ? '#10B981' : (activeStageId() === st.id ? '#6366F1' : 'var(--border)')"
                     [style.boxShadow]="activeStageId() === st.id ? '0 6px 16px rgba(99,102,241,0.2)' : 'none'">
                  
                  <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px">
                    <span style="font-size:10px; font-weight:900; color:#6366F1; text-transform:uppercase">Étape {{ st.id }}</span>
                    @if (st.completed) {
                      <span style="background:#D1FAE5; color:#059669; font-size:9.5px; font-weight:800; padding:2px 6px; border-radius:10px; display:inline-flex; align-items:center; gap:3px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                        Validé
                      </span>
                    } @else {
                      <span style="background:#EEF2FF; color:#4F46E5; font-size:9.5px; font-weight:800; padding:2px 6px; border-radius:10px">Jouer ➔</span>
                    }
                  </div>

                  <div style="display:flex; align-items:center; gap:10px">
                    <div style="width:36px; height:36px; background:#EEF2FF; border-radius:10px; display:flex; align-items:center; justify-content:center; color:#4F46E5; flex-shrink:0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 14.93V17a1 1 0 0 1-2 0v-.07A7 7 0 0 1 5.07 11H5a1 1 0 0 1 0-2h.07A7 7 0 0 1 11 3.07V3a1 1 0 0 1 2 0v.07A7 7 0 0 1 18.93 9H19a1 1 0 0 1 0 2h-.07A7 7 0 0 1 13 16.93z"/>
                      </svg>
                    </div>
                    <div>
                      <div style="font-size:13px; font-weight:900; color:var(--text-primary); line-height:1.2">
                        {{ t(st.titleFr, st.titleEn) }}
                      </div>
                      <div style="font-size:10.5px; color:var(--text-muted); margin-top:2px">
                        📍 {{ t(st.locationFr, st.locationEn) }}
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Tasks Checklist -->
          <div style="display:flex; flex-direction:column; gap:12px; border-top:1px solid var(--border-weak); padding-top:20px">
            <h4 style="font-size:12px; font-weight:900; text-transform:uppercase; color:var(--text-muted); letter-spacing:0.5px; margin:0 0 4px 0">
              {{ t('Objectifs & Tâches à Débloquer', 'Objectives & Tasks to Complete') }}
            </h4>

            @for (task of mission.requiredTasks; track task.title) {
              <div style="display:flex; justify-content:space-between; align-items:center; gap:20px; padding:12px 16px; border-radius:12px; background:var(--surface-2); border:1.5px solid"
                   [style.borderColor]="task.current >= task.target ? '#10B981' : 'var(--border)'">
                
                <div style="display:flex; align-items:center; gap:12px">
                  @if (task.current >= task.target) {
                    <div style="width:28px; height:28px; background:#D1FAE5; color:#059669; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  } @else {
                    <div style="width:28px; height:28px; background:#FEF3C7; color:#D97706; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                  }

                  <div>
                    <div style="font-size:13px; font-weight:800; color:var(--text-primary)">{{ getTaskTitle(task) }}</div>
                    <div style="font-size:11px; color:var(--text-muted); margin-top:2px">
                      {{ t('Type de tâche :', 'Task type:') }} <span style="font-weight:800; color:#6B7280">{{ task.type | uppercase }}</span>
                    </div>
                  </div>
                </div>

                <div style="display:flex; align-items:center; gap:14px">
                  <span style="font-size:13px; font-weight:800; color:var(--text-secondary)">
                    {{ task.current }} / {{ task.target }}
                  </span>

                  @if (task.current < task.target) {
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px">
                      <button class="btn-p" style="font-size:11px; padding:6px 14px; height:auto; background:#6366F1; border-color:#6366F1; color:white; font-weight:800; border-radius:8px; display:flex; align-items:center; gap:4px; cursor:pointer" (click)="startActivity(task.type)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        {{ t('Pratiquer', 'Practice') }}
                      </button>
                      <button (click)="simulateProgress(task.type)" style="background:none; border:none; color:var(--text-muted); font-size:9.5px; font-weight:700; text-decoration:underline; cursor:pointer">
                        {{ t('Simuler +1', 'Simulate +1') }}
                      </button>
                    </div>
                  }
                </div>

              </div>
            }
          </div>

          <!-- Completed Rewards Claim -->
          @if (isMissionComplete(mission)) {
            <div style="margin-top:24px; background:#EFF6FF; border:1.5px solid #93C5FD; padding:16px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px">
              <div style="display:flex; align-items:center; gap:12px">
                <div style="width:40px; height:40px; background:#3B82F6; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                </div>
                <div>
                  <strong style="color:#1E40AF; font-size:14px; font-weight:900">{{ t('Félicitations ! Mission Terminée', 'Congratulations! Mission Completed') }}</strong>
                  <p style="font-size:12px; color:#1E3A8A; margin:2px 0 0 0">
                    {{ t('Récompense bonus : +100 XP et +200 Pièces 🪙 !', 'Bonus reward: +100 XP and +200 Coins 🪙!') }}
                  </p>
                </div>
              </div>
              <button class="btn-p" style="background:#10B981; border-color:#10B981; font-weight:900; padding:10px 20px; cursor:pointer" (click)="claimMissionRewards(mission.id)">
                {{ t('Réclamer les Récompenses', 'Claim Rewards') }}
              </button>
            </div>
          }
        </div>
      }

      <!-- UPCOMING MISSIONS CHAPTERS -->
      <div style="margin-top:28px">
        <h3 style="font-size:15px; font-weight:900; color:var(--text-primary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:16px">
          {{ t("Chapitres & Destinations de l'Aventure", "Adventure Chapters & Destinations") }}
        </h3>
        
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:16px">
          @for (mission of missions(); track mission.id) {
            <div class="card" style="margin:0; border: 1.5px solid var(--border-weak); opacity: mission.unlocked ? 1 : 0.65; display:flex; flex-direction:column; justify-content:space-between">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
                  <span class="badge" 
                        [style.background]="mission.completed ? '#D1FAE5' : (mission.unlocked ? '#F3E8FF' : '#E2E8F0')"
                        [style.color]="mission.completed ? '#065F46' : (mission.unlocked ? '#7C3AED' : '#64748B')"
                        style="font-size:10px; font-weight:800; border-radius:6px; padding:3px 8px; display:inline-flex; align-items:center; gap:4px">
                    @if (mission.completed) {
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                      {{ t('COMPLÉTÉ', 'COMPLETED') }}
                    } @else if (mission.unlocked) {
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      {{ t('ACTIF', 'ACTIVE') }}
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      {{ t('VERROUILLÉ', 'LOCKED') }}
                    }
                  </span>
                </div>
                <h4 style="font-size:15px; font-weight:900; color:var(--text-primary); margin:0 0 6px 0">{{ getMissionTitle(mission) }}</h4>
                <p style="font-size:12.5px; color:var(--text-secondary); line-height:1.5; margin:0">{{ getMissionDescription(mission) }}</p>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- MODAL POPUP FOR THE INTERACTIVE TRAVEL GAME -->
      @if (selectedStage(); as st) {
        <div class="modal-backdrop" (click)="closeTravelGame()" style="position:fixed; inset:0; background:rgba(15,23,42,0.7); backdrop-filter:blur(6px); z-index:99999; display:flex; align-items:center; justify-content:center; padding:16px; animation:fadeIn 0.2s ease-out">
          
          <div class="modal-card" (click)="$event.stopPropagation()" style="background:var(--surface-1); border-radius:20px; width:100%; max-width:580px; box-shadow:0 20px 50px rgba(0,0,0,0.35); border:1px solid var(--border-weak); overflow:hidden; animation:scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)">
            
            <!-- MODAL TRAVEL HEADER -->
            <div style="background:linear-gradient(135deg, #1E1B4B 0%, #312E81 100%); color:white; padding:24px; position:relative">
              <button (click)="closeTravelGame()" style="position:absolute; top:16px; right:16px; background:rgba(255,255,255,0.15); border:none; color:white; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:16px; font-weight:800">
                ✕
              </button>

              <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px">
                <span style="font-size:10px; font-weight:900; background:#6366F1; color:white; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px">
                  Étape {{ st.id }} / 4
                </span>
                <span style="font-size:11px; color:#A5B4FC; font-weight:700">📍 {{ t(st.locationFr, st.locationEn) }}</span>
              </div>

              <h3 style="font-size:18px; font-weight:900; margin:0; color:white">
                {{ t(st.titleFr, st.titleEn) }}
              </h3>
            </div>

            <!-- MODAL TRAVEL GAME BODY -->
            <div style="padding:24px; display:flex; flex-direction:column; gap:20px">
              
              <!-- Character Dialogue Box with Native Speech Audio Button -->
              <div style="background:#F8FAFC; border:1.5px solid #E2E8F0; border-radius:14px; padding:16px; position:relative">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                  <div style="font-size:12px; font-weight:900; color:#4338CA; display:flex; align-items:center; gap:6px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {{ st.speaker }}
                  </div>
                  <button (click)="speak(st.dialogueEn)" class="btn-s" style="background:#EEF2FF; color:#4F46E5; border:1px solid #C7D2FE; padding:4px 10px; font-size:11px; font-weight:800; border-radius:20px; cursor:pointer; display:flex; align-items:center; gap:4px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    {{ t('Écouter l\'Audio 🔊', 'Listen Audio 🔊') }}
                  </button>
                </div>

                <div style="font-size:14px; font-weight:800; color:var(--text-primary); line-height:1.4">
                  " {{ st.dialogueEn }} "
                </div>
                <div style="font-size:11.5px; color:var(--text-muted); font-style:italic; margin-top:4px">
                  ({{ st.dialogueFr }})
                </div>
              </div>

              <!-- Interactive Challenge Question -->
              <div>
                <label style="font-size:13px; font-weight:900; color:var(--text-primary); display:block; margin-bottom:12px">
                  {{ t(st.questionFr, st.questionEn) }}
                </label>

                <!-- Options grid -->
                <div style="display:flex; flex-direction:column; gap:10px">
                  @for (opt of getOptions(st); track opt; let idx = $index) {
                    <button (click)="selectOption(idx, st)"
                            [disabled]="answeredStageId() === st.id"
                            style="text-align:left; padding:12px 16px; border-radius:12px; border:2px solid; font-size:13px; font-weight:800; cursor:pointer; transition:all 0.15s; display:flex; align-items:center; justify-content:space-between"
                            [style.background]="selectedOptIdx() === idx ? (idx === st.correctIdx ? '#ECFDF5' : '#FEF2F2') : 'white'"
                            [style.borderColor]="selectedOptIdx() === idx ? (idx === st.correctIdx ? '#10B981' : '#EF4444') : '#E2E8F0'"
                            [style.color]="selectedOptIdx() === idx ? (idx === st.correctIdx ? '#065F46' : '#991B1B') : 'var(--text-primary)'">
                      <span>{{ ['A', 'B', 'C'][idx] }}) {{ opt }}</span>

                      @if (selectedOptIdx() === idx) {
                        @if (idx === st.correctIdx) {
                          <span style="color:#10B981; font-weight:900">✓ Correct !</span>
                        } @else {
                          <span style="color:#EF4444; font-weight:900">✕ Incorrect</span>
                        }
                      }
                    </button>
                  }
                </div>
              </div>

              <!-- Explanation & Next Button -->
              @if (answeredStageId() === st.id) {
                <div style="background:#EFF6FF; border:1px solid #BFDBFE; padding:14px; border-radius:12px; animation:fadeIn 0.2s">
                  <div style="font-size:12px; font-weight:900; color:#1E40AF; margin-bottom:4px">
                    💡 {{ t('Explication du Conseiller de Voyage :', 'Travel Advisor Tip:') }}
                  </div>
                  <div style="font-size:12px; color:#1E3A8A; line-height:1.4">
                    {{ t(st.explanationFr, st.explanationEn) }}
                  </div>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:12px">
                  @if (st.id < travelStages.length) {
                    <button (click)="openTravelGame(st.id + 1)" class="btn-p" style="background:#4F46E5; border-color:#4F46E5; font-weight:900; padding:10px 20px; border-radius:10px; cursor:pointer">
                      {{ t('Étape Suivante ➔', 'Next Stage ➔') }}
                    </button>
                  } @else {
                    <button (click)="closeTravelGame()" class="btn-p" style="background:#10B981; border-color:#10B981; font-weight:900; padding:10px 20px; border-radius:10px; cursor:pointer">
                      🎉 {{ t('Terminer l\'Aventure & Gagner +100 XP !', 'Finish Adventure & Claim +100 XP!') }}
                    </button>
                  }
                </div>
              }

            </div>

          </div>
        </div>
      }

    </div>
  `,
  styles: []
})
export class StudentJourneyComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  currentUser = signal<UserProfile | null>(null);
  missions = signal<JourneyMission[]>([]);

  activeLang = computed(() => this.db.activeLang());
  selectedStage = signal<TravelStage | null>(null);
  activeStageId = signal<number>(1);
  selectedOptIdx = signal<number | null>(null);
  answeredStageId = signal<number | null>(null);

  travelStages: TravelStage[] = [
    {
      id: 1,
      titleFr: 'Aéroport & Contrôle des Passeports',
      titleEn: 'Airport & Passport Control',
      locationFr: 'Aéroport London Heathrow',
      locationEn: 'London Heathrow Airport',
      speaker: 'Officer Smith (UK Border Force)',
      dialogueEn: 'Good afternoon! May I see your passport and landing card, please? What is the main purpose of your visit to London?',
      dialogueFr: 'Bonjour ! Puis-je voir votre passeport et carte de débarquement ? Quel est l\'objectif principal de votre visite à Londres ?',
      questionFr: 'Choisissez la meilleure réponse pour répondre à l\'agent de douane :',
      questionEn: 'Choose the best response to answer the border officer:',
      optionsFr: [
        'I am here for tourism and to practice my English for 2 weeks.',
        'Yes, I buy a ticket yesterday at the airport.',
        'My hotel is very big and nice.'
      ],
      optionsEn: [
        'I am here for tourism and to practice my English for 2 weeks.',
        'Yes, I buy a ticket yesterday at the airport.',
        'My hotel is very big and nice.'
      ],
      correctIdx: 0,
      explanationFr: 'Pour passer la douane à l\'aéroport de Londres, précisez clairement la raison de votre visite et la durée de votre séjour en toute confiance.',
      explanationEn: 'When passing customs at London airport, clearly state the reason for your visit and duration of stay confidently.',
      iconSvg: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.2c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/>',
      completed: false
    },
    {
      id: 2,
      titleFr: 'Commande au Café Traditionnel de Soho',
      titleEn: 'Ordering at a Soho English Café',
      locationFr: 'Soho Central Café',
      locationEn: 'Soho Central Café',
      speaker: 'Clara (Barista at Soho Cafe)',
      dialogueEn: 'Hello! Welcome to Soho Cafe. What can I get started for you today?',
      dialogueFr: 'Bonjour ! Bienvenue au Café Soho. Que puis-je vous servir aujourd\'hui ?',
      questionFr: 'Choisissez la façon la plus polie de commander un thé Earl Grey avec un scone :',
      questionEn: 'Choose the most polite way to order an Earl Grey tea with a scone:',
      optionsFr: [
        'Give me one tea now.',
        'Could I please have an Earl Grey tea and a scone with clotted cream?',
        'I want drink tea.'
      ],
      optionsEn: [
        'Give me one tea now.',
        'Could I please have an Earl Grey tea and a scone with clotted cream?',
        'I want drink tea.'
      ],
      correctIdx: 1,
      explanationFr: 'En Angleterre, utilisez toujours "Could I please have..." pour commander avec politesse et élégance.',
      explanationEn: 'In England, always use "Could I please have..." to order politely and elegantly.',
      iconSvg: '<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>',
      completed: false
    },
    {
      id: 3,
      titleFr: 'Arrivée & Check-in à l\'Hôtel près de Big Ben',
      titleEn: 'Hotel Check-in near Big Ben',
      locationFr: 'The Grand London Hotel',
      locationEn: 'The Grand London Hotel',
      speaker: 'Mark (Hotel Receptionist)',
      dialogueEn: 'Welcome to The Grand London Hotel! Do you have a reservation with us for tonight?',
      dialogueFr: 'Bienvenue à The Grand London Hotel ! Avez-vous une réservation pour ce soir ?',
      questionFr: 'Comment confirmer votre réservation et vous renseigner sur le petit-déjeuner ?',
      questionEn: 'How do you confirm your booking and ask about breakfast?',
      optionsFr: [
        'Hello, I have a reservation under the name of Smith. Is breakfast included?',
        'Where is my room key?',
        'I sleep here today.'
      ],
      optionsEn: [
        'Hello, I have a reservation under the name of Smith. Is breakfast included?',
        'Where is my room key?',
        'I sleep here today.'
      ],
      correctIdx: 0,
      explanationFr: 'Donnez le nom sur la réservation et demandez "Is breakfast included?" pour connaître les modalités du petit-déjeuner.',
      explanationEn: 'Give the name on the reservation and ask "Is breakfast included?" to know breakfast details.',
      iconSvg: '<path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"/><path d="M3 21h18"/><path d="M9 7h1"/><path d="M9 11h1"/><path d="M9 15h1"/><path d="M14 7h1"/><path d="M14 11h1"/><path d="M14 15h1"/>',
      completed: false
    },
    {
      id: 4,
      titleFr: 'Navigation dans le Métro "The Tube" jusqu\'à Piccadilly',
      titleEn: 'Navigating The Tube to Piccadilly',
      locationFr: 'Station de Métro Underground',
      locationEn: 'London Underground Station',
      speaker: 'Station Officer (Transport for London)',
      dialogueEn: 'Mind the gap! Make sure you tap your Oyster card or contactless card at the gates.',
      dialogueFr: 'Attention à la marche ! Assurez-vous de valider votre carte aux portillons.',
      questionFr: 'Quelle phrase est correcte pour demander son chemin dans le métro londonien ?',
      questionEn: 'Which sentence correctly asks for directions in the London Tube?',
      optionsFr: [
        'Excuse me, which tube line should I take to get to Piccadilly Circus?',
        'Where is the train going fast?',
        'I walk to Piccadilly Circus.'
      ],
      optionsEn: [
        'Excuse me, which tube line should I take to get to Piccadilly Circus?',
        'Where is the train going fast?',
        'I walk to Piccadilly Circus.'
      ],
      correctIdx: 0,
      explanationFr: 'À Londres, le métro est appelé "The Tube". Utilisez "which tube line should I take...?" pour trouver la bonne ligne.',
      explanationEn: 'In London, the underground is called "The Tube". Use "which tube line should I take...?" for directions.',
      iconSvg: '<rect x="4" y="3" width="16" height="16" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="M8 19l-3 3"/><path d="M16 19l3 3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/>',
      completed: false
    }
  ];

  activeMission = computed(() => {
    return this.missions().find(m => m.unlocked && !m.completed) || null;
  });

  constructor() {
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
    this.db.observeJourneyMissions().subscribe(list => this.missions.set(list));
  }

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

  openTravelGame(stageId: number) {
    const stage = this.travelStages.find(s => s.id === stageId) || this.travelStages[0];
    this.selectedStage.set(stage);
    this.activeStageId.set(stage.id);
    this.selectedOptIdx.set(null);
    this.answeredStageId.set(null);
  }

  closeTravelGame() {
    this.selectedStage.set(null);
  }

  getOptions(st: TravelStage): string[] {
    return this.activeLang() === 'fr' ? st.optionsFr : st.optionsEn;
  }

  speak(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-GB';
      window.speechSynthesis.speak(u);
    }
  }

  selectOption(idx: number, st: TravelStage) {
    this.selectedOptIdx.set(idx);
    this.answeredStageId.set(st.id);

    if (idx === st.correctIdx) {
      st.completed = true;
      const user = this.currentUser();
      if (user) {
        this.db.updateJourneyTaskProgress(user.id, 'words', 10);
      }
    }
  }

  getMissionTitle(m: JourneyMission): string {
    if (m.id === 'mission-london') {
      return this.t('Mission 1 : Préparer un voyage à Londres', 'Mission 1: Preparing a trip to London');
    }
    if (m.id === 'mission-interview') {
      return this.t('Mission 2 : Décrocher un job à New York', 'Mission 2: Landing a job in New York');
    }
    return m.title;
  }

  getMissionDescription(m: JourneyMission): string {
    if (m.id === 'mission-london') {
      return this.t(
        'Validez toutes les étapes pour être prêt pour votre premier vol vers le Royaume-Uni !',
        'Complete all the steps to be ready for your first flight to the United Kingdom!'
      );
    }
    if (m.id === 'mission-interview') {
      return this.t(
        'Maîtrisez l\'anglais des affaires pour réussir votre entretien d\'embauche outre-Atlantique.',
        'Master business English to ace your job interview across the Atlantic.'
      );
    }
    return m.description;
  }

  getTaskTitle(task: any): string {
    const titleMap: { [key: string]: { fr: string, en: string } } = {
      'words-30': { fr: 'Apprendre 30 mots de voyage dans le dictionnaire', en: 'Learn 30 travel words in the dictionary' },
      'video-1': { fr: 'Regarder la vidéo pédagogique sur l\'aéroport', en: 'Watch the educational airport video' },
      'quiz-1': { fr: 'Réussir le quiz de grammaire de voyage', en: 'Pass the travel grammar quiz' },
      'listening-1': { fr: 'Écouter le dialogue de commande de ticket', en: 'Listen to the ticket order dialogue' },
      'writing-1': { fr: 'Écrire un court mail de réservation d\'hôtel', en: 'Write a short hotel booking email' },
      'words-20': { fr: 'Apprendre 20 mots de Business English', en: 'Learn 20 Business English words' },
      'quiz-interview': { fr: 'Réussir le quiz d\'entretien de recrutement', en: 'Pass the job interview quiz' },
      'writing-cover': { fr: 'Rédiger une lettre de motivation professionnelle', en: 'Write a professional cover letter' }
    };

    for (const key in titleMap) {
      if (task.title.toLowerCase().includes(titleMap[key].fr.toLowerCase().slice(0, 15)) ||
          task.title.toLowerCase().includes(titleMap[key].en.toLowerCase().slice(0, 15))) {
        return this.t(titleMap[key].fr, titleMap[key].en);
      }
    }
    return task.title;
  }

  getMissionProgress(m: JourneyMission): number {
    const total = m.requiredTasks.length;
    if (total === 0) return 0;
    const progressSum = m.requiredTasks.reduce((acc, t) => acc + (t.current / t.target), 0);
    return Math.round((progressSum / total) * 100);
  }

  isMissionComplete(m: JourneyMission): boolean {
    return m.requiredTasks.every(t => t.current >= t.target);
  }

  claimMissionRewards(missionId: string) {
    const user = this.currentUser();
    if (user) {
      const list = [...this.db['journeyMissions$'].value];
      const mission = list.find(m => m.id === missionId);
      if (mission) {
        mission.completed = true;
        const nextIdx = list.findIndex(m => m.id === missionId) + 1;
        if (nextIdx < list.length) {
          list[nextIdx].unlocked = true;
        }
        
        this.db['journeyMissions$'].next(list);
        this.db['saveLocal']('speak_missions', list);

        this.db.updateUserXP(user.id, 100, true).then(() => {
          this.db.addCoinsToUser(user.id, 200).then(() => {
            this.dialogService.alert(
              this.t('Mission Réclamée ! 🏆', 'Mission Claimed! 🏆'),
              this.t('Félicitations, vous avez débloqué 100 XP et 200 Coins !', 'Congratulations, you unlocked 100 XP and 200 Coins!'),
              'success'
            );
          });
        });
      }
    }
  }

  startActivity(taskType: string) {
    let targetTab = 'dashboard';
    if (taskType === 'words') {
      targetTab = 'dictionary';
    } else if (taskType === 'quiz') {
      targetTab = 'quizzes';
    } else if (taskType === 'video' || taskType === 'listening') {
      targetTab = 'lessons';
    } else if (taskType === 'writing') {
      targetTab = 'exercises';
    }

    this.db.requestedTabRedirect.set(targetTab);
  }

  simulateProgress(taskType: string) {
    const user = this.currentUser();
    if (user) {
      this.db.updateJourneyTaskProgress(user.id, taskType, 1).then(() => {
        this.dialogService.alert(
          this.t('Activité Validée ! 🚀', 'Activity Validated! 🚀'),
          this.t(`Vous avez progressé de +1 dans votre tâche : ${taskType.toUpperCase()}`, `You progressed +1 in task: ${taskType.toUpperCase()}`),
          'success'
        );
      });
    }
  }
}
