import { Component, inject, signal, computed, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { DatabaseService, UserProfile, CoachingMessage, Submission } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-coaching',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="padding:20px; box-sizing:border-box">
      
      <!-- HEADER BANNER -->
      <div style="background:linear-gradient(135deg, #1E1B4B 0%, #0F172A 100%); padding:20px; border-radius:12px; border-left:4px solid #D97706; margin-bottom:24px; box-shadow:0 4px 20px rgba(0,0,0,0.05); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px">
        <div>
          <h2 style="font-size:20px; font-weight:800; color:white; margin:0 0 4px 0; display:flex; align-items:center; gap:8px">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/></svg>
            Gestion de l'Accompagnement Privé VIP
          </h2>
          <p style="font-size:12.5px; color:#94A3B8; margin:0">Validez les inscriptions, éditez les feuilles de route personnalisées et échangez avec vos élèves VIP.</p>
        </div>
        <div style="display:flex; gap:12px">
          <button (click)="activeTab.set('active')" class="btn-s" [style.background]="activeTab() === 'active' ? '#D97706' : 'rgba(255,255,255,0.08)'" [style.color]="activeTab() === 'active' ? '#1E1B4B' : 'white'" [style.border]="activeTab() === 'active' ? '1px solid #D97706' : '1px solid rgba(255,255,255,0.2)'" style="font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Élèves VIP Actifs
          </button>
          <button (click)="activeTab.set('requests')" class="btn-s" [style.background]="activeTab() === 'requests' ? '#D97706' : 'rgba(255,255,255,0.08)'" [style.color]="activeTab() === 'requests' ? '#1E1B4B' : 'white'" [style.border]="activeTab() === 'requests' ? '1px solid #D97706' : '1px solid rgba(255,255,255,0.2)'" style="font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Demandes en attente
            @if (pendingRequests().length > 0) {
              <span style="background:#EF4444; color:white; font-size:9.5px; padding:2px 6px; border-radius:10px">{{ pendingRequests().length }}</span>
            }
          </button>
        </div>
      </div>

      <!-- TAB 1: PENDING REQUESTS -->
      @if (activeTab() === 'requests') {
        <div class="card" style="padding:24px">
          <h3 style="font-size:15px; font-weight:800; color:var(--text-primary); margin:0 0 16px 0">Candidatures à l'Accompagnement Privé</h3>
          
          @if (pendingRequests().length === 0) {
            <div style="text-align:center; padding:40px; color:var(--text-muted); font-size:12.5px; border:1px dashed var(--border); border-radius:8px">
              Aucune demande d'accompagnement privé en attente de validation.
            </div>
          } @else {
            <div style="overflow-x:auto">
              <table style="width:100%; border-collapse:collapse; text-align:left; font-size:12.5px">
                <thead>
                  <tr style="border-bottom:2px solid var(--border); color:var(--text-muted); font-weight:700">
                    <th style="padding:10px">Candidat</th>
                    <th style="padding:10px">Niveau Actuel</th>
                    <th style="padding:10px">XP & Streak</th>
                    <th style="padding:10px; text-align:right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  @for (req of pendingRequests(); track req.id) {
                    <tr style="border-bottom:1px solid var(--border-weak); transition:background 0.15s">
                      <td style="padding:12px 10px; font-weight:700; color:var(--text-primary)">{{ req.name }}</td>
                      <td style="padding:12px 10px">
                        <span class="badge" [style.background]="getLevelColor(req.level)" style="color:white; font-size:10px">{{ req.level }}</span>
                      </td>
                      <td style="padding:12px 10px; color:var(--text-secondary)">
                        {{ req.xp }} XP · 🔥 {{ req.streak }} jours
                      </td>
                      <td style="padding:12px 10px; text-align:right">
                        <button (click)="approveRequest(req)" class="btn-s" style="background:#10B981; color:white; border:none; font-weight:700; cursor:pointer">
                          Approuver & Activer
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- TAB 2: ACTIVE VIP STUDENTS -->
      @if (activeTab() === 'active') {
        <div class="teacher-vip-grid">
          
          <!-- LEFT SIDEBAR: VIP STUDENTS LIST -->
          <div class="card teacher-vip-sidebar" style="padding:16px; height:600px; display:flex; flex-direction:column; overflow:hidden">
            <h3 style="font-size:13px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin:0 0 12px 0; letter-spacing:0.5px">Élèves Enrôlés ({{ activeVips().length }})</h3>
            
            <!-- Proactive Enrollment Selection box -->
            <div style="margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid var(--border-weak)">
              <label style="font-size:11px; font-weight:700; color:var(--text-muted); display:block; margin-bottom:6px">Enrôler proactivement un élève :</label>
              <div style="display:flex; gap:8px">
                <select #studentSelect style="flex:1; font-size:12px; padding:6px; border-radius:6px; border:1px solid var(--border); outline:none">
                  <option value="">-- Choisir un élève --</option>
                  @for (st of nonVipStudents(); track st.id) {
                    <option [value]="st.id">{{ st.name }} ({{ st.level }})</option>
                  }
                </select>
                <button (click)="enrollStudentDirectly(studentSelect.value); studentSelect.value = ''" class="btn-s" style="background:#10B981; color:white; border:none; padding:6px 12px; font-weight:700; cursor:pointer">
                  +
                </button>
              </div>
            </div>

            <div class="teacher-vip-list" style="display:flex; flex-direction:column; gap:8px; flex:1; overflow-y:auto; padding-right:4px">
              @if (activeVips().length === 0) {
                <div style="font-size:12px; color:var(--text-muted); text-align:center; padding:20px">
                  Aucun élève VIP actif pour le moment.
                </div>
              }
              @for (student of activeVips(); track student.id) {
                <button (click)="selectStudent(student)" 
                        [style.background]="selectedStudent()?.id === student.id ? '#D97706' : 'white'"
                        [style.color]="selectedStudent()?.id === student.id ? '#1E1B4B' : 'var(--text-primary)'"
                        [style.border-color]="selectedStudent()?.id === student.id ? '#D97706' : 'var(--border)'"
                        style="width:100%; border:1px solid; border-radius:8px; padding:10px 14px; text-align:left; font-size:12.5px; font-weight:700; cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:all 0.15s">
                  <span>{{ student.name }}</span>
                  <span class="badge" [style.background]="selectedStudent()?.id === student.id ? '#1E1B4B' : '#EEF2FF'" [style.color]="selectedStudent()?.id === student.id ? 'white' : '#4F46E5'" style="font-size:9.5px">
                    {{ student.level }}
                  </span>
                </button>
              }
            </div>
          </div>

          <!-- RIGHT SIDEBAR: DETAILED COACHING PANEL -->
          <div>
            @if (!selectedStudent()) {
              <div class="card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:450px; text-align:center; color:var(--text-muted)">
                <div style="font-size:48px; margin-bottom:12px">👑</div>
                <h3>Sélectionnez un élève VIP</h3>
                <p style="font-size:12px; max-width:300px; margin:4px 0 0 0">Choisissez un élève dans la liste de gauche pour configurer son objectif, sa feuille de route et échanger en privé.</p>
              </div>
            } @else {
              
              <!-- VIP CONTROL TABS -->
              <div style="display:flex; gap:12px; margin-bottom:16px">
                <button (click)="activeControlTab.set('roadmap')" class="btn-s" [style.background]="activeControlTab() === 'roadmap' ? '#1E1B4B' : 'white'" [style.color]="activeControlTab() === 'roadmap' ? 'white' : 'var(--text-secondary)'" style="font-weight:700; cursor:pointer">
                  🗺️ Feuille de Route & Objectifs
                </button>
                <button (click)="activeControlTab.set('chat')" class="btn-s" [style.background]="activeControlTab() === 'chat' ? '#1E1B4B' : 'white'" [style.color]="activeControlTab() === 'chat' ? 'white' : 'var(--text-secondary)'" style="font-weight:700; cursor:pointer">
                  💬 Messagerie & Feedback Vocal
                </button>
              </div>

              <!-- CONTROLLER 1: ROADMAP & GOALS -->
              @if (activeControlTab() === 'roadmap') {
                <div class="teacher-vip-roadmap" style="display:flex; flex-direction:column; gap:20px; height:540px; overflow-y:auto; padding-right:4px">
                  
                  <!-- GOAL CONFIG -->
                  <div class="card" style="padding:20px">
                    <h3 style="font-size:14px; font-weight:800; color:var(--text-primary); margin:0 0 12px 0">🎯 Définir l'Objectif de Transition VIP</h3>
                    
                    <div style="display:flex; gap:12px">
                      <input type="text" 
                             [(ngModel)]="coachingGoalDraft" 
                             placeholder="Ex: Passage A2 ➔ B2 (Objectif TOEIC 785+)" 
                             style="flex:1; border:1px solid var(--border); padding:8px 12px; border-radius:6px; font-size:12.5px; outline:none">
                      <button (click)="saveGoal()" class="btn-s" style="background:#1E1B4B; color:white; border:none; font-weight:700; cursor:pointer">
                        Sauvegarder
                      </button>
                    </div>
                  </div>

                  <!-- ROADMAP STEPS BUILDER -->
                  <div class="card" style="padding:20px">
                    <h3 style="font-size:14px; font-weight:800; color:var(--text-primary); margin:0 0 12px 0">🗺️ Éditeur de Feuille de Route</h3>
                    
                    <!-- Add step -->
                    <div style="display:flex; gap:12px; margin-bottom:16px">
                      <input type="text" 
                             [(ngModel)]="newRoadmapStepText" 
                             placeholder="Ajouter une consigne ou une étape (Ex: Réviser les verbes irréguliers)..." 
                             style="flex:1; border:1px solid var(--border); padding:8px 12px; border-radius:6px; font-size:12.5px; outline:none">
                      <button (click)="addRoadmapStep()" class="btn-s" style="background:#D97706; color:#1E1B4B; border:none; font-weight:700; cursor:pointer">
                        Ajouter
                      </button>
                    </div>

                    <!-- Steps List -->
                    <div style="display:flex; flex-direction:column; gap:8px">
                      @if (!selectedStudent()?.privateCoachingRoadmap || selectedStudent()?.privateCoachingRoadmap?.length === 0) {
                        <div style="font-size:12px; color:var(--text-muted); text-align:center; padding:16px; border:1px dashed var(--border); border-radius:6px">
                          Aucune tâche définie dans la feuille de route.
                        </div>
                      }
                      @for (step of selectedStudent()?.privateCoachingRoadmap; track step.id; let idx = $index) {
                        <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; border-radius:8px; background:#F8FAFC; border:1px solid #E2E8F0">
                          <div style="display:flex; align-items:center; gap:8px">
                            <input type="checkbox" 
                                   [checked]="step.done"
                                   (change)="toggleStepDone(step.id, $event)"
                                   style="cursor:pointer">
                            <span [style.text-decoration]="step.done ? 'line-through' : 'none'"
                                  [style.color]="step.done ? 'var(--text-muted)' : 'var(--text-primary)'"
                                  style="font-size:12px">
                              {{ step.text }}
                            </span>
                          </div>
                          
                          <button (click)="deleteRoadmapStep(step.id)" 
                                  title="Supprimer la tâche"
                                  style="background:none; border:none; color:#EF4444; cursor:pointer; font-size:14px">
                            <i class="ti ti-trash"></i>
                          </button>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- PERSONAL COACH OBSERVATIONS -->
                  <div class="card" style="padding:20px">
                    <h3 style="font-size:14px; font-weight:800; color:var(--text-primary); margin:0 0 8px 0">💡 Mes Observations & Conseils pour cet élève</h3>
                    <p style="font-size:11.5px; color:var(--text-muted); margin:0 0 12px 0">Ces remarques s'affichent directement sur l'espace VIP de l'élève pour le guider.</p>

                    <textarea [(ngModel)]="coachingNotesDraft" 
                              rows="4" 
                              placeholder="Ex: Excellent travail sur le simulateur TOEIC. Concentrez-vous désormais sur la section de compréhension orale..." 
                              style="width:100%; border:1px solid var(--border); padding:10px; border-radius:8px; font-size:12.5px; outline:none; font-family:inherit; box-sizing:border-box; margin-bottom:12px"></textarea>
                    
                    <div style="display:flex; justify-content:flex-end">
                      <button (click)="saveNotes()" class="btn-s" style="background:#1E1B4B; color:white; border:none; font-weight:700; cursor:pointer">
                        Sauvegarder les Conseils
                      </button>
                    </div>
                  </div>

                  <!-- DEACTIVATE COACHING BUTTON -->
                  <div style="display:flex; justify-content:flex-end; margin-top:10px">
                    <button (click)="terminateCoaching()" class="btn-s" style="border-color:#EF4444; color:#EF4444; cursor:pointer; font-weight:700">
                      ⚠️ Suspendre l'accompagnement privé de {{ selectedStudent()?.name }}
                    </button>
                  </div>

                </div>
              }

              <!-- CONTROLLER 2: DIRECT CHAT -->
              @if (activeControlTab() === 'chat') {
                <div class="card teacher-vip-chat" style="display:flex; flex-direction:column; height:540px; padding:0; overflow:hidden">
                  
                  <!-- Chat header info -->
                  <div style="background:#F8FAFC; border-bottom:1px solid #E2E8F0; padding:12px 16px; display:flex; align-items:center; justify-content:space-between">
                    <div>
                      <div style="font-size:13px; font-weight:800; color:#1E293B">Discussion Privée avec {{ selectedStudent()?.name }}</div>
                      <div style="font-size:10px; color:var(--text-muted)">Permet d'envoyer des explications et des feedbacks vocaux</div>
                    </div>
                  </div>

                  <!-- Messages Timeline -->
                  <div #chatContainer style="flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:12px; background:#FAFBFD">
                    @if (messages().length === 0) {
                      <div style="text-align:center; color:var(--text-muted); font-size:12px; padding:40px">
                        Aucun échange enregistré. Envoyez un mot de bienvenue à votre élève !
                      </div>
                    }
                    @for (m of messages(); track m.id) {
                      <div [style.align-self]="m.senderRole === 'teacher' ? 'flex-end' : 'flex-start'"
                           [style.max-width]="'70%'"
                           style="display:flex; flex-direction:column; gap:4px">
                        
                        <span style="font-size:10px; color:var(--text-muted); padding: 0 4px" [style.text-align]="m.senderRole === 'teacher' ? 'right' : 'left'">
                          {{ m.senderName }} · {{ m.timestamp | date:'HH:mm' }}
                        </span>

                        <div [style.background]="m.senderRole === 'teacher' ? '#1E1B4B' : 'white'"
                             [style.color]="m.senderRole === 'teacher' ? 'white' : 'var(--text-primary)'"
                             [style.border]="m.senderRole === 'teacher' ? 'none' : '1px solid #E2E8F0'"
                             [style.border-radius]="m.senderRole === 'teacher' ? '12px 12px 0 12px' : '12px 12px 12px 0'"
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

                  <!-- Inputs -->
                  <div style="padding:12px; background:white; border-top:1px solid #E2E8F0; display:flex; flex-direction:column; gap:8px">
                    
                    <!-- Voice recording widget -->
                    @if (recordingState() === 'recording') {
                      <div style="display:flex; align-items:center; gap:12px; background:#FEF2F2; border:1px solid #FCA5A5; padding:8px 12px; border-radius:8px">
                        <span style="width:8px; height:8px; background:#EF4444; border-radius:50%; display:inline-block; animation: pulse-live 1s infinite"></span>
                        <span style="font-size:11.5px; color:#EF4444; font-weight:800">
                          Enregistrement de votre feedback... {{ recordSeconds() }}s
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
                                title="Enregistrer un message vocal de feedback"
                                style="background:#FEF2F2; border:1.5px solid #FCA5A5; color:#EF4444; width:38px; height:38px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:transform 0.1s">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                        </button>
                      }

                      <!-- Text input -->
                      <input type="text" 
                             [(ngModel)]="newMsgText" 
                             (keyup.enter)="sendMessage()"
                             [disabled]="recordingState() === 'recording'"
                             placeholder="Répondre à l'élève ou lui donner des consignes..." 
                             style="flex:1; border:1px solid #E2E8F0; padding:10px 14px; border-radius:24px; font-size:12.5px; outline:none; background:#F8FAFC">
                      
                      <button (click)="sendMessage()" 
                              [disabled]="!newMsgText.trim() || recordingState() === 'recording'"
                              class="btn-s" 
                              style="background:#1E1B4B; color:white; border:none; border-radius:24px; height:36px; padding:0 16px; font-weight:700; cursor:pointer">
                        Répondre
                      </button>
                    </div>
                  </div>

                </div>
              }

            }
          </div>

        </div>
      }

    </div>
  `,
  styles: [`
    @keyframes pulse-live {
      from { transform: scale(1); opacity: 1; }
      to { transform: scale(1.05); opacity: 0.85; }
    }
    .teacher-vip-grid {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 20px;
      align-items: start;
    }
    .teacher-vip-list::-webkit-scrollbar,
    .teacher-vip-roadmap::-webkit-scrollbar {
      width: 6px;
    }
    .teacher-vip-list::-webkit-scrollbar-track,
    .teacher-vip-roadmap::-webkit-scrollbar-track {
      background: transparent;
    }
    .teacher-vip-list::-webkit-scrollbar-thumb,
    .teacher-vip-roadmap::-webkit-scrollbar-thumb {
      background: var(--border);
      border-radius: 4px;
    }
    @media (max-width: 900px) {
      .teacher-vip-grid {
        grid-template-columns: 1fr;
      }
      .teacher-vip-sidebar,
      .teacher-vip-roadmap,
      .teacher-vip-chat {
        height: auto !important;
      }
    }
  `]
})
export class TeacherCoachingComponent implements AfterViewChecked {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  activeTab = signal<'active' | 'requests'>('active');
  activeControlTab = signal<'roadmap' | 'chat'>('roadmap');

  allUsers = signal<UserProfile[]>([]);
  selectedStudent = signal<UserProfile | null>(null);

  // Chat messaging
  messages = signal<CoachingMessage[]>([]);
  newMsgText = '';
  recordingState = signal<'idle' | 'recording'>('idle');
  recordSeconds = signal<number>(0);
  
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private timerInterval: any = null;
  private chatSub: any = null;

  // Goal & Notes drafts
  coachingGoalDraft = '';
  coachingNotesDraft = '';
  newRoadmapStepText = '';

  activeVips = computed(() => {
    return this.allUsers().filter(u => u.role === 'student' && u.isPrivateCoaching === true);
  });

  pendingRequests = computed(() => {
    return this.allUsers().filter(u => u.role === 'student' && u.privateCoachingRequested === true && u.isPrivateCoaching !== true);
  });

  nonVipStudents = computed(() => {
    return this.allUsers().filter(u => u.role === 'student' && u.isPrivateCoaching !== true);
  });

  constructor() {
    this.db.observeUsers().subscribe(list => {
      this.allUsers.set(list);
      // Keep selected student in sync with database updates
      if (this.selectedStudent()) {
        const fresh = list.find(u => u.id === this.selectedStudent()?.id);
        if (fresh) this.selectedStudent.set(fresh);
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

  getLevelColor(level?: string): string {
    switch (level) {
      case 'A1': return '#10B981';
      case 'A2': return '#3B82F6';
      case 'B1': return '#F59E0B';
      case 'B2': return '#EF4444';
      default: return '#10B981';
    }
  }

  sanitizeUrl(url: string): SafeUrl {
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  selectStudent(student: UserProfile) {
    this.selectedStudent.set(student);
    this.coachingGoalDraft = student.privateCoachingGoal || '';
    this.coachingNotesDraft = student.privateCoachingNotes || '';
    this.newRoadmapStepText = '';

    // Unsubscribe from previous chat feed
    if (this.chatSub) this.chatSub.unsubscribe();

    // Subscribe to new chat feed
    this.chatSub = this.db.observeCoachingMessages(student.id).subscribe(msgs => {
      this.messages.set(msgs);
      this.scrollToBottom();
    });
  }

  // --- ACTIONS ---

  async approveRequest(student: UserProfile) {
    await this.db.updatePrivateCoaching(student.id, {
      isPrivateCoaching: true,
      privateCoachingRequested: false,
      privateCoachingGoal: 'Passage ' + student.level + ' ➔ B2 (Objectif TOEIC)',
      privateCoachingRoadmap: [
        { id: 'step-1', text: 'Passer le premier simulateur d\'évaluation TOEIC', done: false },
        { id: 'step-2', text: 'Identifier les principales lacunes grammaticales', done: false }
      ]
    });

    // Notify student
    await this.db.sendNotification({
      recipientId: student.id,
      recipientRole: 'student',
      type: 'announcement',
      title: '👑 Accompagnement Privé VIP Activé !',
      message: 'Votre professeur a validé votre enrôlement. Consultez votre nouvel onglet "Accompagnement Privé" !'
    });

    this.dialogService.alert('Succès', `L'accompagnement privé pour ${student.name} a été activé avec succès.`, 'success');
    this.activeTab.set('active');
    this.selectStudent(student);
  }

  async enrollStudentDirectly(studentId: string) {
    if (!studentId) return;
    const student = this.allUsers().find(u => u.id === studentId);
    if (!student) return;

    await this.db.updatePrivateCoaching(student.id, {
      isPrivateCoaching: true,
      privateCoachingRequested: false,
      privateCoachingGoal: 'Passage ' + student.level + ' ➔ B2 (Objectif TOEIC)',
      privateCoachingRoadmap: [
        { id: 'step-1', text: 'Passer le premier simulateur d\'évaluation TOEIC', done: false },
        { id: 'step-2', text: 'Identifier les principales lacunes grammaticales', done: false }
      ]
    });

    // Notify student
    await this.db.sendNotification({
      recipientId: student.id,
      recipientRole: 'student',
      type: 'announcement',
      title: '👑 Accompagnement Privé VIP Activé !',
      message: 'Votre professeur vous a enrôlé dans l\'accompagnement privé. Consultez votre nouvel onglet "Accompagnement Privé" !'
    });

    this.dialogService.alert('Succès', `L'accompagnement privé pour ${student.name} a été activé proactivement.`, 'success');
    this.activeTab.set('active');
    this.selectStudent(student);
  }

  async saveGoal() {
    const student = this.selectedStudent();
    if (!student) return;

    await this.db.updatePrivateCoaching(student.id, {
      privateCoachingGoal: this.coachingGoalDraft
    });
    this.dialogService.alert('Objectif mis à jour', 'L\'objectif général a bien été sauvegardé.', 'success');
  }

  async saveNotes() {
    const student = this.selectedStudent();
    if (!student) return;

    await this.db.updatePrivateCoaching(student.id, {
      privateCoachingNotes: this.coachingNotesDraft
    });
    this.dialogService.alert('Observations enregistrées', 'Les conseils de coaching ont bien été enregistrés.', 'success');
  }

  async addRoadmapStep() {
    const student = this.selectedStudent();
    if (!student || !this.newRoadmapStepText.trim()) return;

    const currentRoadmap = student.privateCoachingRoadmap || [];
    const newStep = {
      id: 'step-' + Date.now(),
      text: this.newRoadmapStepText.trim(),
      done: false
    };

    await this.db.updatePrivateCoaching(student.id, {
      privateCoachingRoadmap: [...currentRoadmap, newStep]
    });

    this.newRoadmapStepText = '';
  }

  async deleteRoadmapStep(stepId: string) {
    const student = this.selectedStudent();
    if (!student || !student.privateCoachingRoadmap) return;

    const updated = student.privateCoachingRoadmap.filter(s => s.id !== stepId);
    await this.db.updatePrivateCoaching(student.id, {
      privateCoachingRoadmap: updated
    });
  }

  async toggleStepDone(stepId: string, event: any) {
    const student = this.selectedStudent();
    if (!student || !student.privateCoachingRoadmap) return;

    const updated = student.privateCoachingRoadmap.map(s => {
      if (s.id === stepId) return { ...s, done: event.target.checked };
      return s;
    });

    await this.db.updatePrivateCoaching(student.id, {
      privateCoachingRoadmap: updated
    });
  }

  async terminateCoaching() {
    const student = this.selectedStudent();
    if (!student) return;

    this.dialogService.show({
      title: 'Désactiver l\'Accompagnement ?',
      message: `Voulez-vous vraiment retirer l'accès VIP à ${student.name} ? Ses données de coaching seront masquées.`,
      type: 'confirm',
      confirmText: 'Retirer l\'Accompagnement',
      cancelText: 'Annuler',
      onConfirm: async () => {
        await this.db.updatePrivateCoaching(student.id, {
          isPrivateCoaching: false,
          privateCoachingRequested: false
        });
        this.selectedStudent.set(null);
        this.dialogService.alert('Désactivé', 'L\'accompagnement VIP a été désactivé.', 'success');
      }
    });
  }

  // --- DIRECT CHAT WITH STUDENT ---

  async sendMessage() {
    const student = this.selectedStudent();
    if (!student || !this.newMsgText.trim()) return;

    await this.db.sendCoachingMessage(student.id, this.newMsgText.trim());
    this.newMsgText = '';
  }

  // --- AUDIO RECORDING FOR FEEDBACKS ---

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
          const student = this.selectedStudent();
          if (student) {
            await this.db.sendCoachingMessage(student.id, '[Message Vocal Coach 🎙️]', base64Url);
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
}
