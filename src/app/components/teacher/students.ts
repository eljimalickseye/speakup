import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, UserProfile, RegistrationRequest, Attendance, ChatChannel } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .ts-modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 9999;
      padding: 16px;
    }
    .ts-modal-card {
      background: white; border-radius: 12px; max-width: 480px; width: 100%;
      padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
      border: 1px solid var(--border-weak);
    }
    .cert-modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 99999;
      padding: 16px;
    }
    .cert-modal-card {
      background: white; border-radius: 16px; max-width: 760px; width: 100%;
      padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15);
    }
    @media print {
      body * {
        visibility: hidden !important;
      }
      .cert-modal-overlay {
        position: absolute !important;
        left: 0 !important; top: 0 !important;
        background: none !important;
        backdrop-filter: none !important;
      }
      .cert-modal-card {
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
      }
      .no-print {
        display: none !important;
      }
      .printable-certificate, .printable-certificate * {
        visibility: visible !important;
      }
      .printable-certificate {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        border: 8px double #1E1B4B !important;
        padding: 30px !important;
        box-shadow: none !important;
        background: #FAF9F6 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `],
  template: `
    <div class="page">
      <div class="tab-row">
        <button class="tab" [class.active]="activeTab() === 'all'" (click)="activeTab.set('all')">All students</button>
        <button class="tab" [class.active]="activeTab() === 'progress'" (click)="activeTab.set('progress')">Skill Progress</button>
        <button class="tab" [class.active]="activeTab() === 'requests'" (click)="activeTab.set('requests')">
          Inscriptions & Déblocages
          @if (pendingRequestsCount() > 0) {
            <span class="badge" style="background:#EF4444; color:white; padding:2px 8px; border-radius:12px; font-size:10px; margin-left:4px">{{ pendingRequestsCount() }}</span>
          }
        </button>
        <button class="tab" [class.active]="activeTab() === 'groups'" (click)="activeTab.set('groups')">
          Groupes de discussion
        </button>
        <button class="tab" [class.active]="activeTab() === 'profile'" (click)="activeTab.set('profile')">
          Student profile {{ selectedStudent() ? ' (' + selectedStudent()!.name + ')' : '' }}
        </button>
      </div>

      <!-- ALL STUDENTS LIST -->
      @if (activeTab() === 'all') {
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px">
          <span style="font-size:13px; font-weight:700; color:var(--text-primary)">{{ t('Tous les étudiants', 'All Students') }}</span>
          <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5; font-size:12.5px; padding:8px 16px; border-radius:8px; display:flex; align-items:center; gap:6px; height:34px" (click)="showAddStudentModal.set(true)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {{ t('Ajouter un Étudiant', 'Add New Student') }}
          </button>
        </div>
        <div class="table-scroll-container">
          <div class="table-min-width" style="display:flex; flex-direction:column; gap:4px; padding:6px">
          <!-- Table Header -->
          <div class="row" style="background:var(--surface-2); font-size:11px; color:var(--text-muted); font-weight:600; border-radius:var(--radius)">
            <div style="width:160px">Name</div>
            <div style="width:50px">Level</div>
            <div style="flex:1">Accès Débloqués</div>
            <div style="width:70px; text-align:center">XP</div>
            <div style="width:90px">Last active</div>
            <div style="width:70px">Status</div>
            <div style="width:160px; text-align:right">Action</div>
          </div>
          
          <!-- Table Rows -->
          @for (student of students(); track student.id) {
            <div class="row" style="align-items:center; border-bottom:1px solid var(--border-weak); padding:8px 0">
              <div style="width:160px; display:flex; align-items:center; gap:8px">
                <div style="position:relative">
                  <div class="avatar" style="width:24px; height:24px; font-size:9px">
                    {{ student.avatar || student.name.slice(0,2).toUpperCase() }}
                  </div>
                  @if (db.isUserOnline(student)) {
                    <span style="position:absolute; bottom:-2px; right:-2px; width:8px; height:8px; border-radius:50%; background:#10B981; border:2.5px solid white"></span>
                  }
                </div>
                <div style="display:flex; flex-direction:column; overflow:hidden">
                  <span style="font-size:12px; font-weight:700; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap">{{ student.name }}</span>
                  @if (student.phone) {
                    <span style="font-size:9.5px; color:var(--text-muted)">{{ student.phone }}</span>
                  }
                </div>
              </div>
              <div style="width:50px; font-size:12px; font-weight:600">{{ student.level }}</div>
              
              <!-- ACCÈS DÉBLOQUÉS PILLS -->
              <div style="flex:1; display:flex; flex-wrap:wrap; gap:4px; align-items:center">
                @if (student.isPaid) {
                  <span style="font-size:9px; font-weight:800; background:linear-gradient(135deg, #10B981, #059669); color:white; padding:2px 8px; border-radius:12px; display:inline-flex; align-items:center; gap:3px" title="Pass VIP Illimité : Tous les accès sont débloqués">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> VIP Tout Accès
                  </span>
                } @else {
                  @if (student.hasFullAccess) {
                    <span style="font-size:8.5px; font-weight:700; background:#E0E7FF; color:#3730A3; padding:2px 6px; border-radius:4px" title="Accès Cours et Ebooks débloqué" style="display:inline-flex; align-items:center; gap:3px"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z"/></svg> Cours</span>
                  }
                  @if (student.hasLiveAccess) {
                    <span style="font-size:8.5px; font-weight:700; background:#EEF2FF; color:#4F46E5; padding:2px 6px; border-radius:4px" title="Classes en Direct débloqué" style="display:inline-flex; align-items:center; gap:3px"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> Live</span>
                  }
                  @if (student.hasExamAccess) {
                    <span style="font-size:8.5px; font-weight:700; background:#FEF3C7; color:#B45309; padding:2px 6px; border-radius:4px" title="Mode Examen & Tests débloqué" style="display:inline-flex; align-items:center; gap:3px"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg> Tests</span>
                  }
                  @if (student.voiceChatAllowed) {
                    <span style="font-size:8.5px; font-weight:700; background:#CCFBF1; color:#0F766E; padding:2px 6px; border-radius:4px" title="Chat vocal autorisé" style="display:inline-flex; align-items:center; gap:3px"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg> Vocal</span>
                  }
                  @if (student.isPrivateCoaching) {
                    <span style="font-size:8.5px; font-weight:700; background:#FCE7F3; color:#9D174D; padding:2px 6px; border-radius:4px" title="Coaching Privé VIP débloqué" style="display:inline-flex; align-items:center; gap:3px"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg> VIP</span>
                  }
                  @if (!student.hasFullAccess && !student.hasLiveAccess && !student.hasExamAccess && !student.voiceChatAllowed && !student.isPrivateCoaching) {
                    <span style="font-size:8.5px; font-weight:600; background:#F1F5F9; color:#64748B; padding:2px 6px; border-radius:4px"style="display:inline-flex; align-items:center; gap:3px"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg> Découverte</span>
                  }
                }
              </div>

              <div style="width:70px; text-align:center; font-size:12px; font-weight:700; color:#4F46E5">{{ student.xp }} XP</div>
              <div style="width:90px; font-size:11px; color:var(--text-secondary)">{{ db.formatLastActive(student.lastActive) }}</div>
              <div style="width:70px">
                <span [class]="getStatusClass(student)">
                  {{ getStudentStatus(student) }}
                </span>
              </div>
              <div style="width:160px; text-align:right; display:flex; justify-content:flex-end; gap:6px">
                <button class="btn-s" style="padding:4px 8px; font-size:11px; background:#EEF2FF; color:#4F46E5; border-color:#C7D2FE; font-weight:700; display:inline-flex; align-items:center; gap:4px" (click)="openAccessModal(student)" title="Débloquer ou modifier les accès">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg> Débloquer
                </button>
                <button class="btn-s" style="padding:4px 8px; font-size:11px" (click)="openProfile(student)">
                  Profil
                </button>
              </div>
            </div>
          }
          </div>
        </div>

        <!-- ADD NEW STUDENT MODAL -->
        @if (showAddStudentModal()) {
          <div class="ts-modal-overlay" (click)="showAddStudentModal.set(false)">
            <div class="ts-modal-card" (click)="$event.stopPropagation()">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-weak); padding-bottom:12px; margin-bottom:16px">
                <h3 style="margin:0; font-size:15px; font-weight:800; color:#4F46E5; display:flex; align-items:center; gap:6px">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                  {{ t('Créer un Compte Étudiant', 'Create Student Account') }}
                </h3>
                <button (click)="showAddStudentModal.set(false)" aria-label="Fermer" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:18px; line-height:1; display:flex; align-items:center; justify-content:center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              
              <div style="display:flex; flex-direction:column; gap:12px">
                <div class="input-row" style="margin-bottom:0">
                  <label for="newStudentName" style="color:#4F46E5; font-weight:700; font-size:11.5px">{{ t('Nom complet', 'Full Name') }}</label>
                  <input id="newStudentName" type="text" [(ngModel)]="newStudentName" placeholder="e.g. Kofi Dembélé" style="background:#FFF; padding:8px; border-radius:6px; border:1.5px solid var(--border); width:100%" />
                </div>
                
                <div class="input-row" style="margin-bottom:0">
                  <label for="newStudentLevel" style="color:#4F46E5; font-weight:700; font-size:11.5px">{{ t("Niveau d'anglais de départ", 'English Level') }}</label>
                  <select id="newStudentLevel" [(ngModel)]="newStudentLevel" style="background:#FFF; padding:8px; border-radius:6px; border:1.5px solid var(--border); width:100%">
                    <option value="A1">A1 — {{ t('Débutant', 'Beginner') }}</option>
                    <option value="A2">A2 — {{ t('Élémentaire', 'Elementary') }}</option>
                    <option value="B1">B1 — {{ t('Intermédiaire', 'Intermediate') }}</option>
                    <option value="B2">B2 — {{ t('Intermédiaire Supérieur', 'Upper Intermediate') }}</option>
                    <option value="Guest">Guest / Invité (No Fees)</option>
                  </select>
                </div>

                <div class="input-row" style="margin-bottom:0">
                  <label for="newStudentCountry" style="color:#4F46E5; font-weight:700; font-size:11.5px">{{ t('Drapeau du pays', 'Country Flag') }}</label>
                  <select id="newStudentCountry" [(ngModel)]="newStudentCountry" style="background:#FFF; padding:8px; border-radius:6px; border:1.5px solid var(--border); width:100%">
                    <option value="">No Flag</option>
                    <option value="🇸🇳">Senegal 🇸🇳</option>
                    <option value="🇳🇬">Nigeria 🇳🇬</option>
                    <option value="🇷🇼">Rwanda 🇷🇼</option>
                    <option value="🇧🇯">Benin 🇧🇯</option>
                    <option value="🇨🇮">Ivory Coast 🇨🇮</option>
                    <option value="🇨🇲">Cameroon 🇨🇲</option>
                    <option value="🇹🇬">Togo 🇹🇬</option>
                    <option value="🇲🇱">Mali 🇲🇱</option>
                    <option value="🇬🇳">Guinea 🇬🇳</option>
                    <option value="🇳 Niger 🇳 Niger">Niger 🇳 Niger</option>
                    <option value="🇫🇷">France 🇫🇷</option>
                  </select>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
                  <div class="input-row" style="margin-bottom:0">
                    <label for="newStudentRegFee" style="color:#4F46E5; font-weight:700; font-size:11.5px">{{ t("Frais d'inscription", 'Reg. Fee') }}</label>
                    <select id="newStudentRegFee" [(ngModel)]="newStudentRegFee" style="background:#FFF; padding:8px; border-radius:6px; border:1.5px solid var(--border); width:100%">
                      <option [value]="10000">10,000 CFA (Regular)</option>
                      <option [value]="0">0 CFA (Waived / Promo)</option>
                    </select>
                  </div>
                  <div class="input-row" style="margin-bottom:0">
                    <label for="newStudentMonthlyFee" style="color:#4F46E5; font-weight:700; font-size:11.5px">{{ t('Scolarité mensuelle', 'Monthly Tuition') }}</label>
                    <select id="newStudentMonthlyFee" [(ngModel)]="newStudentMonthlyFee" style="background:#FFF; padding:8px; border-radius:6px; border:1.5px solid var(--border); width:100%">
                      <option [value]="7000">7,000 CFA (Regular)</option>
                      <option [value]="5000">5,000 CFA (Promo)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style="border-top:1.5px dashed var(--border-weak); margin-top:16px; padding-top:16px">
                <label style="color:#4F46E5; font-weight:700; font-size:11.5px; display:block; margin-bottom:6px">
                  {{ t('Ou importer plusieurs étudiants via un fichier (.csv, .txt)', 'Or import multiple students via file (.csv, .txt)') }}
                </label>
                <input type="file" accept=".csv,.txt" (change)="onStudentsFileSelected($event)" style="font-size:11px; width:100%; border:1px dashed var(--border); padding:8px; border-radius:6px; cursor:pointer" />
                <p style="font-size:9.5px; color:var(--text-muted); margin:4px 0 0 0; line-height:1.4">
                  {{ t('Format : Un nom par ligne, ou CSV (Nom, Niveau, Drapeau, Frais Inscr., Scolarité Mensuelle)', 'Format: One name per line, or CSV (Name, Level, Flag, Reg. Fee, Monthly Fee)') }}
                </p>
              </div>

              <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:20px; border-top:1px solid var(--border-weak); padding-top:16px">
                <button class="btn-s" (click)="showAddStudentModal.set(false)">{{ t('Annuler', 'Cancel') }}</button>
                <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5" [disabled]="!newStudentName.trim()" (click)="addStudent()">
                  {{ t('Créer le Compte', 'Create Account') }}
                </button>
              </div>
            </div>
          </div>
        }
      }

      <!-- PROGRESS TABLE -->
      @if (activeTab() === 'progress') {
        <div style="display:flex; flex-direction:column; gap:4px; overflow-x:auto">
          <!-- Header -->
          <div class="row" style="background:var(--surface-2); font-size:11px; color:var(--text-muted); font-weight:600; border-radius:var(--radius)">
            <div style="width:160px">Student</div>
            <div style="width:90px; text-align:center">Vocabulary Score</div>
            <div style="width:90px; text-align:center">Conjugation Score</div>
            <div style="width:90px; text-align:center">Oral Fluency</div>
            <div style="flex:1">Certificates / Achievements</div>
          </div>
          <!-- Rows -->
          @for (student of students(); track student.id) {
            <div class="row" style="align-items:center; border-bottom:1px solid var(--border-weak); padding:8px 0; font-size:12px">
              <div style="width:160px; font-weight:600; color:var(--text-primary)">{{ student.name }}</div>
              <div style="width:90px; text-align:center">{{ student.vocabularyProgress || '0%' }}</div>
              <div style="width:90px; text-align:center">{{ student.conjugationProgress || '0%' }}</div>
              <div style="width:90px; text-align:center">{{ student.speakingScore || 'A' }}</div>
              <div style="flex:1; display:flex; gap:4px; flex-wrap:wrap">
                @for (badge of student.badges; track badge) {
                  <span class="badge" style="background:#FEF3C7; color:#92400E; font-size:9px">{{ badge }}</span>
                } @empty {
                  <span style="font-size:11px; color:var(--text-muted)">None earned</span>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- PENDING REGISTRATION REQUESTS -->
      @if (activeTab() === 'requests') {
        <div class="card" style="margin-top:20px; border:1px solid var(--border-weak); padding:20px; border-radius:12px; animation: fadeIn 0.25s">
          <h3 style="margin-top:0; font-size:15px; color:#4F46E5; font-weight:700; margin-bottom:12px">
            Demandes d'inscription en attente
          </h3>
          <p style="font-size:12px; color:var(--text-secondary); margin-bottom:20px">
            Ces personnes ont soumis une demande d'inscription. Vous pouvez les valider pour créer leur compte ou rejeter leur demande.
          </p>

          <div style="display:flex; flex-direction:column; gap:10px">
            @for (req of pendingRequests(); track req.id) {
              <div style="background:var(--surface-1); border:1px solid var(--border-weak); padding:16px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap">
                <div>
                  <div style="display:flex; align-items:center; gap:8px">
                    <span style="font-weight:700; font-size:14px; color:var(--text-primary)">{{ req.name }}</span>
                    @if (getFlagUrl(req.countryFlag)) {
                      <img [src]="getFlagUrl(req.countryFlag)" style="width: 16px; height: 12px; object-fit: contain" alt="flag">
                    }
                  </div>
                  <div style="font-size:11px; color:var(--text-secondary); margin-top:4px; display:flex; gap:8px; align-items:center; flex-wrap:wrap">
                    <span>Niveau demandé : <strong style="color:#4F46E5">{{ req.level }}</strong></span>
                    <span>· Date : {{ req.requestedAt }}</span>
                    @if (req.phone) {
                      <span>· <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> <strong>{{ req.phone }}</strong></span>
                    }
                  </div>
                </div>
                <div style="display:flex; gap:8px; align-items:center">
                  @if (req.phone) {
                    <a [href]="getWhatsAppUrl(req.phone, req.name)" target="_blank" class="btn-s" style="background:#25D366; color:white; border:none; font-size:11px; padding:6px 12px; display:inline-flex; align-items:center; gap:4px; font-weight:700; text-decoration:none">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> WhatsApp
                    </a>
                  }
                  <button class="btn-p" style="background:#10B981; border-color:#10B981; font-size:11px; padding:6px 12px" (click)="approveRequest(req.id, req.name)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Valider
                  </button>
                  <button class="btn-s" style="border-color:#EF4444; color:#EF4444; font-size:11px; padding:6px 12px" (click)="rejectRequest(req.id, req.name)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Rejeter
                  </button>
                </div>
              </div>
            } @empty {
              <div style="text-align:center; padding:24px; font-size:12px; color:var(--text-muted); border:1px dashed var(--border-strong); border-radius:8px">
                Toutes les inscriptions directes sont automatiquement activées. Aucune demande bloquée en attente.
              </div>
            }
          </div>

          <!-- Recent Students Fast Unlock Section -->
          <div style="margin-top:28px; border-top:1.5px dashed var(--border-weak); padding-top:20px">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px">
              <div>
                <h4 style="margin:0; font-size:14px; font-weight:800; color:#1E1B4B; display:flex; align-items:center; gap:6px">
                  <span><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span> <span>Nouveaux Inscrits & Déblocage Rapide des Accès</span>
                </h4>
                <p style="margin:2px 0 0 0; font-size:11.5px; color:var(--text-muted)">
                  Attribuez en un clic les accès aux cours, live classes, et mode examen pour vos derniers inscrits.
                </p>
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:8px">
              @for (st of students().slice(0, 6); track st.id) {
                <div style="background:var(--surface-1); border:1px solid var(--border-weak); padding:12px 16px; border-radius:10px; display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap">
                  <div style="display:flex; align-items:center; gap:10px">
                    <div class="avatar" style="width:32px; height:32px; font-size:11px; font-weight:700">
                      {{ st.avatar || st.name.slice(0,2).toUpperCase() }}
                    </div>
                    <div>
                      <div style="display:flex; align-items:center; gap:6px">
                        <span style="font-size:13px; font-weight:700; color:var(--text-primary)">{{ st.name }}</span>
                        <span style="font-size:10px; font-weight:700; background:#EEF2FF; color:#4F46E5; padding:1px 5px; border-radius:4px">{{ st.level }}</span>
                      </div>
                      <div style="font-size:10.5px; color:var(--text-muted); margin-top:2px; display:flex; gap:8px; align-items:center">
                        @if (st.phone) { <span style="display:inline-flex; align-items:center; gap:3px"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg> {{ st.phone }}</span> } 
                        <span>· Inscription : {{ st.registeredAt ? db.formatLastActive(st.registeredAt) : 'Récemment' }}</span>
                      </div>
                    </div>
                  </div>

                  <div style="display:flex; align-items:center; gap:6px">
                    @if (st.isPaid) {
                      <span style="font-size:9.5px; font-weight:800; background:#E6F4EA; color:#137333; padding:3px 8px; border-radius:6px"><svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> VIP Actif</span>
                    } @else {
                      <button class="btn-p" style="background:#10B981; border-color:#10B981; font-size:11px; font-weight:800; padding:6px 12px; border-radius:6px; display:inline-flex; align-items:center; gap:4px" (click)="unlockAllStudentAccess(st)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Tout Débloquer (VIP)
                      </button>
                    }
                    <button class="btn-s" style="font-size:11px; padding:6px 10px; border-radius:6px; background:#EEF2FF; color:#4F46E5; border-color:#C7D2FE; font-weight:700" (click)="openAccessModal(st)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg> Choisir les Accès
                    </button>
                    @if (st.phone) {
                      <a [href]="getWhatsAppUrl(st.phone, st.name)" target="_blank" class="btn-s" style="background:#25D366; color:white; border:none; font-size:11px; padding:6px 10px; border-radius:6px; display:inline-flex; align-items:center; gap:4px; font-weight:700; text-decoration:none">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                      </a>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- PROFILE DETAIL VIEW -->
      @if (activeTab() === 'profile') {
        <div class="card">
          <!-- Student Selector Dropdown inside Profile tab -->
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px; background:var(--surface-2); padding:12px; border-radius:var(--radius)">
            <label for="studentSelect" style="font-weight:600; font-size:12px; color:var(--text-primary)">Select Student:</label>
            <select id="studentSelect" [ngModel]="selectedStudent()?.id" (ngModelChange)="onStudentSelect($event)" style="flex:1; max-width:320px; width:100%; min-height:38px; background:#FFF; border:1px solid var(--border-weak); padding:6px 10px; border-radius:var(--radius); font-size:13px">
              <option [value]="null" disabled selected>-- Choose a student --</option>
              @for (s of students(); track s.id) {
                <option [value]="s.id">{{ s.name }}</option>
              }
            </select>
          </div>

          @if (selectedStudent(); as student) {
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-weak); padding-bottom:12px; margin-bottom:12px">
                <div>
                  <h3 style="font-size:16px; font-weight:700">{{ student.name }}</h3>
                  <p style="font-size:11px; color:var(--text-muted)">Level: {{ student.level }} · Registered: {{ student.registeredAt }}</p>
                </div>
                <button class="btn-s" style="padding:4px 8px; font-size:11px" (click)="activeTab.set('all')">Back to list</button>
              </div>

              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(130px, 1fr)); gap:12px; margin-bottom:16px">
                <div style="background:var(--surface-2); padding:10px; border-radius:var(--radius)">
                  <div style="font-size:10px; text-transform:uppercase; color:var(--text-muted); font-weight:600">Total Experience Points</div>
                  <div style="font-size:18px; font-weight:800; color:#4F46E5; margin-top:4px">{{ student.xp }} XP</div>
                </div>
                <div style="background:var(--surface-2); padding:10px; border-radius:var(--radius)">
                  <div style="font-size:10px; text-transform:uppercase; color:var(--text-muted); font-weight:600">Attendance Rating</div>
                  <div style="font-size:18px; font-weight:800; color:#059669; margin-top:4px">{{ getAttendancePercentage(student.id) }}%</div>
                </div>
                <div style="background:var(--surface-2); padding:10px; border-radius:var(--radius)">
                  <div style="font-size:10px; text-transform:uppercase; color:var(--text-muted); font-weight:600">Academic Standing</div>
                  <div style="font-size:18px; font-weight:800; color:#D97706; margin-top:4px">
                    {{ getStudentStatus(student) }}
                  </div>
                </div>
              </div>

              <!-- Certificats Obtenus -->
              <div class="card" style="margin-top:0; margin-bottom:16px; border: 1.5px dashed #D97706; background:#FFFBEB; padding:16px; border-radius:8px">
                <h4 style="font-size:12px; font-weight:700; color:#B45309; margin-bottom:12px; display:flex; align-items:center; gap:6px; margin-top:0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/></svg>
                  <span>{{ t("Certifications de Niveau de l'élève", 'Student Language Certificates') }}</span>
                </h4>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap:10px">
                  @for (lvl of ['A1', 'A2', 'B1', 'B2']; track lvl) {
                    <div style="padding:10px; border-radius:8px; border:1.5px solid; display:flex; flex-direction:column; justify-content:space-between; align-items:center; min-height:80px; text-align:center"
                         [style.background]="isCertificateUnlocked(student, lvl) ? 'white' : 'var(--surface-2)'"
                         [style.border-color]="isCertificateUnlocked(student, lvl) ? '#FDE68A' : 'var(--border-weak)'">
                      <div>
                        <span style="font-size:11px; font-weight:800; color:var(--text-primary)">Level {{ lvl }}</span>
                        <div style="font-size:9.5px; color:var(--text-muted); margin-top:2px">
                          {{ isCertificateUnlocked(student, lvl) ? t('Débloqué', 'Unlocked') : t('En cours', 'Locked') }}
                        </div>
                      </div>
                      @if (isCertificateUnlocked(student, lvl)) {
                        <button class="btn-s" style="padding:4px 8px; font-size:10px; margin-top:6px; background:#4F46E5; color:white; border:none; display:flex; align-items:center; gap:4px; cursor:pointer" 
                                (click)="selectedCertificate.set(lvl); selectedStudentCert.set(student)">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          {{ t('Voir / Imprimer', 'View / Print') }}
                        </button>
                      } @else {
                        <span style="font-size:12px; margin-top:6px">🔒</span>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- ACCÈS DÉBLOQUÉS & AUTORISATIONS -->
              <div class="card" style="margin-top:0; margin-bottom:16px; border: 1.5px solid #C7D2FE; background:linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%); padding:20px; border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05)">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px; border-bottom:1px solid var(--border-weak); padding-bottom:12px">
                  <div>
                    <h4 style="font-size:14px; font-weight:800; color:#1E1B4B; display:flex; align-items:center; gap:6px; margin:0">
                      <span><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg></span>
                      <span>Gestion des Accès Débloqués</span>
                    </h4>
                    <p style="font-size:11px; color:var(--text-muted); margin:2px 0 0 0">
                      Débloquez ou verrouillez les accès spécifiques pour cet élève en temps réel.
                    </p>
                  </div>
                  <div style="display:flex; gap:8px">
                    <button class="btn-p" style="background:#10B981; border-color:#10B981; font-size:11px; font-weight:800; padding:6px 14px; border-radius:6px; display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 8px rgba(16,185,129,0.3)" (click)="unlockAllStudentAccess(student)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg> Tout Débloquer (Pass VIP)
                    </button>
                    <button class="btn-s" style="font-size:11px; padding:6px 10px; border-radius:6px" (click)="resetStudentToFreeTier(student)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg> Remettre en Découverte
                    </button>
                  </div>
                </div>

                <!-- Granular Access Cards -->
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px; margin-bottom:16px">
                  
                  <!-- 1. Full Course & Ebooks -->
                  <div style="background:white; border:1px solid var(--border-weak); border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center">
                    <div>
                      <div style="font-size:12px; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:6px">
                        <span><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z"/></svg></span> <span>Cours & Ebooks</span>
                      </div>
                      <div style="font-size:10px; color:var(--text-muted)">Leçons, supports & docs</div>
                    </div>
                    <label style="position:relative; display:inline-block; width:38px; height:20px; cursor:pointer">
                      <input type="checkbox" [checked]="student.hasFullAccess || student.isPaid" (change)="toggleStudentAccessField(student, 'hasFullAccess')" aria-label="Débloquer Cours et Ebooks" style="opacity:0; width:0; height:0" />
                      <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; transition:.3s; border-radius:20px" [style.background-color]="(student.hasFullAccess || student.isPaid) ? '#4F46E5' : '#CBD5E1'">
                        <span style="position:absolute; content:''; height:14px; width:14px; left:3px; bottom:3px; background-color:white; transition:.3s; border-radius:50%" [style.transform]="(student.hasFullAccess || student.isPaid) ? 'translateX(18px)' : 'translateX(0)'"></span>
                      </span>
                    </label>
                  </div>

                  <!-- 2. Live Classes -->
                  <div style="background:white; border:1px solid var(--border-weak); border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center">
                    <div>
                      <div style="font-size:12px; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:6px">
                        <span><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg></span> <span>Classes en Direct</span>
                      </div>
                      <div style="font-size:10px; color:var(--text-muted)">Live Meet & Ice Breaker</div>
                    </div>
                    <label style="position:relative; display:inline-block; width:38px; height:20px; cursor:pointer">
                      <input type="checkbox" [checked]="student.hasLiveAccess || student.isPaid" (change)="toggleStudentAccessField(student, 'hasLiveAccess')" aria-label="Débloquer Classes en direct" style="opacity:0; width:0; height:0" />
                      <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; transition:.3s; border-radius:20px" [style.background-color]="(student.hasLiveAccess || student.isPaid) ? '#4F46E5' : '#CBD5E1'">
                        <span style="position:absolute; content:''; height:14px; width:14px; left:3px; bottom:3px; background-color:white; transition:.3s; border-radius:50%" [style.transform]="(student.hasLiveAccess || student.isPaid) ? 'translateX(18px)' : 'translateX(0)'"></span>
                      </span>
                    </label>
                  </div>

                  <!-- 3. Tests & Certifications DET -->
                  <div style="background:white; border:1px solid var(--border-weak); border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center">
                    <div>
                      <div style="font-size:12px; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:6px">
                        <span><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></span> <span>Examens & Tests DET</span>
                      </div>
                      <div style="font-size:10px; color:var(--text-muted)">Score 10-160 & Certificats</div>
                    </div>
                    <label style="position:relative; display:inline-block; width:38px; height:20px; cursor:pointer">
                      <input type="checkbox" [checked]="student.hasExamAccess || student.isPaid" (change)="toggleStudentAccessField(student, 'hasExamAccess')" aria-label="Débloquer Examens et Tests" style="opacity:0; width:0; height:0" />
                      <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; transition:.3s; border-radius:20px" [style.background-color]="(student.hasExamAccess || student.isPaid) ? '#4F46E5' : '#CBD5E1'">
                        <span style="position:absolute; content:''; height:14px; width:14px; left:3px; bottom:3px; background-color:white; transition:.3s; border-radius:50%" [style.transform]="(student.hasExamAccess || student.isPaid) ? 'translateX(18px)' : 'translateX(0)'"></span>
                      </span>
                    </label>
                  </div>

                  <!-- 4. Voice Chat Messaging -->
                  <div style="background:white; border:1px solid var(--border-weak); border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center">
                    <div>
                      <div style="font-size:12px; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:6px">
                        <span><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg></span> <span>Messages Vocaux</span>
                      </div>
                      <div style="font-size:10px; color:var(--text-muted)">Vocaux autorisés dans chat</div>
                    </div>
                    <label style="position:relative; display:inline-block; width:38px; height:20px; cursor:pointer">
                      <input type="checkbox" [checked]="student.voiceChatAllowed || student.isPaid" (change)="toggleStudentAccessField(student, 'voiceChatAllowed')" aria-label="Débloquer Messages Vocaux" style="opacity:0; width:0; height:0" />
                      <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; transition:.3s; border-radius:20px" [style.background-color]="(student.voiceChatAllowed || student.isPaid) ? '#4F46E5' : '#CBD5E1'">
                        <span style="position:absolute; content:''; height:14px; width:14px; left:3px; bottom:3px; background-color:white; transition:.3s; border-radius:50%" [style.transform]="(student.voiceChatAllowed || student.isPaid) ? 'translateX(18px)' : 'translateX(0)'"></span>
                      </span>
                    </label>
                  </div>

                  <!-- 5. Private VIP Coaching -->
                  <div style="background:white; border:1px solid var(--border-weak); border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center">
                    <div>
                      <div style="font-size:12px; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:6px">
                        <span><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg></span> <span>Coaching Privé VIP</span>
                      </div>
                      <div style="font-size:10px; color:var(--text-muted)">Feuille de route 1-on-1</div>
                    </div>
                    <label style="position:relative; display:inline-block; width:38px; height:20px; cursor:pointer">
                      <input type="checkbox" [checked]="student.isPrivateCoaching || student.isPaid" (change)="toggleStudentAccessField(student, 'isPrivateCoaching')" aria-label="Débloquer Coaching VIP" style="opacity:0; width:0; height:0" />
                      <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; transition:.3s; border-radius:20px" [style.background-color]="(student.isPrivateCoaching || student.isPaid) ? '#4F46E5' : '#CBD5E1'">
                        <span style="position:absolute; content:''; height:14px; width:14px; left:3px; bottom:3px; background-color:white; transition:.3s; border-radius:50%" [style.transform]="(student.isPrivateCoaching || student.isPaid) ? 'translateX(18px)' : 'translateX(0)'"></span>
                      </span>
                    </label>
                  </div>

                  <!-- 6. Payment status -->
                  <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center">
                    <div>
                      <div style="font-size:12px; font-weight:700; color:#15803D; display:flex; align-items:center; gap:6px">
                        <span><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></span> <span>Compte en Règle</span>
                      </div>
                      <div style="font-size:10px; color:#166534">Frais acquittés (VIP)</div>
                    </div>
                    <label style="position:relative; display:inline-block; width:38px; height:20px; cursor:pointer">
                      <input type="checkbox" [checked]="student.isPaid ?? false" (change)="toggleStudentPayment(student)" aria-label="Marquer Compte en règle" style="opacity:0; width:0; height:0" />
                      <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; transition:.3s; border-radius:20px" [style.background-color]="student.isPaid ? '#10B981' : '#CBD5E1'">
                        <span style="position:absolute; content:''; height:14px; width:14px; left:3px; bottom:3px; background-color:white; transition:.3s; border-radius:50%" [style.transform]="student.isPaid ? 'translateX(18px)' : 'translateX(0)'"></span>
                      </span>
                    </label>
                  </div>

                </div>

                <!-- Billing Settings Inputs -->
                <div style="background:var(--surface-1); border-top:1px dashed var(--border-weak); padding-top:12px; display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px">
                  <div class="input-row" style="margin-bottom:0">
                    <label style="font-weight:600; font-size:11px">Frais d'inscription</label>
                    <select [value]="student.registrationFee ?? 10000" (change)="updateStudentFee(student.id, 'registrationFee', $event)" style="background:#FFF; padding:6px; font-size:11px">
                      <option [value]="10000">10,000 CFA (Standard)</option>
                      <option [value]="0">0 CFA (Offert / Promo)</option>
                    </select>
                  </div>
                  <div class="input-row" style="margin-bottom:0">
                    <label style="font-weight:600; font-size:11px">Scolarité Mensuelle</label>
                    <select [value]="student.monthlyFee ?? 7000" (change)="updateStudentFee(student.id, 'monthlyFee', $event)" style="background:#FFF; padding:6px; font-size:11px">
                      <option [value]="7000">7,000 CFA (Standard)</option>
                      <option [value]="5000">5,000 CFA (Promo)</option>
                    </select>
                  </div>
                  <div class="input-row" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center">
                    <label style="font-weight:600; font-size:11px; margin-bottom:6px">Rappels de Paiement</label>
                    <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:11px; font-weight:700; color:#D97706" [style.opacity]="student.isPaid ? 0.5 : 1">
                      <input type="checkbox" [checked]="student.paymentRemindersActive ?? false" [disabled]="student.isPaid ?? false" (change)="toggleStudentReminders(student)" style="cursor:pointer" />
                      <span>🔔 Activer Rappels</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- XP & Progress Management -->
              <div class="card" style="margin-top:0; margin-bottom:16px; border: 1px dashed var(--border-weak); background:var(--surface-1); padding:16px; border-radius:8px">
                <h4 style="font-size:12px; font-weight:700; color:var(--text-primary); margin-bottom:12px; display:flex; align-items:center; gap:6px; margin-top:0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg>
                  <span>XP & Progress Management</span>
                </h4>
                
                <div style="display:flex; gap:12px; align-items:flex-end; flex-wrap:wrap">
                  <div class="input-row" style="margin-bottom:0; flex:1; min-width:120px">
                    <label style="font-weight:600; font-size:11px">Modify XP points</label>
                    <input type="number" [value]="student.xp" (change)="updateStudentXPDirect(student.id, $event)" style="background:#FFF; padding:6px; font-size:11px; border-radius:4px; border:1px solid var(--border); width:100%" />
                  </div>
                  
                  <button class="btn-s" (click)="resetStudentXP(student)" style="background:#FEF2F2; border-color:#FCA5A5; color:#DC2626; font-weight:700; height:32px; font-size:11px; padding:0 12px; display:flex; align-items:center; gap:4px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> Reset XP to 0
                  </button>
                </div>
              </div>

              <!-- Account Security & Guest Credentials -->
              <div class="card" style="margin-top:16px; margin-bottom:16px; border: 1px dashed var(--border-weak); background:var(--surface-1); padding:16px; border-radius:8px">
                <h4 style="font-size:12px; font-weight:700; color:var(--text-primary); margin-bottom:12px; display:flex; align-items:center; gap:6px; margin-top:0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span>Sécurité du compte & Identifiants</span>
                </h4>
                
                <div style="display:flex; flex-direction:column; gap:12px">
                  <!-- Block / Unblock control -->
                  <div style="display:flex; align-items:center; justify-content:space-between; background:var(--surface-2); padding:10px; border-radius:6px">
                    <div>
                      <span style="font-weight:600; font-size:12px; color:var(--text-primary)">Statut d'accès</span>
                      <p style="font-size:10px; color:var(--text-secondary); margin:2px 0 0 0">
                        {{ student.blocked ? 'Ce compte est actuellement bloqué et ne peut pas se connecter.' : 'Ce compte est actif.' }}
                      </p>
                    </div>
                    <button class="btn-s" [style.border-color]="student.blocked ? '#10B981' : '#EF4444'" [style.color]="student.blocked ? '#10B981' : '#EF4444'" style="font-size:11px; padding:6px 12px; font-weight:700" (click)="toggleBlockUser(student)">
                      {{ student.blocked ? 'Activer / Débloquer' : 'Bloquer le compte' }}
                    </button>
                  </div>

                  <!-- Guest credentials controls -->
                  <div style="background:var(--surface-2); padding:12px; border-radius:6px">
                    <span style="font-weight:600; font-size:12px; color:var(--text-primary); display:block; margin-bottom:10px">Identifiants de connexion (Username / Code)</span>
                    
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px">
                      <div class="input-row" style="margin-bottom:0">
                        <label style="font-weight:600; font-size:10px; color:var(--text-primary)">Identifiant (Username)</label>
                        <input type="text" [value]="student.username || ''" (change)="updateUserCredential(student.id, 'username', $event)" placeholder="Ex: awandiaye" style="background:#FFF; padding:6px; font-size:11px; border-radius:4px" />
                      </div>
                      <div class="input-row" style="margin-bottom:0">
                        <label style="font-weight:600; font-size:10px; color:var(--text-primary)">Code d'accès (Password)</label>
                        <input type="text" [value]="student.password || ''" (change)="updateUserCredential(student.id, 'password', $event)" placeholder="Ex: 1234" style="background:#FFF; padding:6px; font-size:11px; border-radius:4px" />
                      </div>
                    </div>

                    <!-- Actions for Guest credentials -->
                    @if (student.username && student.password) {
                      <div style="margin-top:12px; display:flex; gap:8px">
                        <button class="btn-s" style="padding:6px 12px; font-size:11px; flex:1; display:flex; align-items:center; justify-content:center; gap:6px" (click)="copyLoginCredentials(student)">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copier les identifiants
                        </button>
                        <button class="btn-p" style="padding:6px 12px; font-size:11px; flex:1; display:flex; align-items:center; justify-content:center; gap:6px; background:#4F46E5" (click)="copyLoginLink(student)">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Copier le lien d'accès direct
                        </button>
                      </div>
                    } @else {
                      <div style="margin-top:10px; font-size:10px; color:var(--text-muted); text-align:center">
                        Saisissez un identifiant et un code d'accès pour activer la connexion directe sans compte Google.
                      </div>
                    }
                  </div>
                </div>
              </div>

              <div class="input-row">
                <label for="studentNotes">Teacher Notes & Action Plan (Private)</label>
                <textarea id="studentNotes" [(ngModel)]="teacherNotes" rows="4" placeholder="Write internal observations, notes on pronunciation, etc..."></textarea>
              </div>

              <button class="btn-p" style="margin-top:8px" (click)="saveNotes()">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Student Notes
              </button>
            </div>
          } @else {
            <div style="text-align:center; padding:32px; color:var(--text-muted)">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="display:block; margin:0 auto 12px auto"><circle cx="10" cy="10" r="7"/><line x1="21" y1="21" x2="15" y2="15"/></svg>
              <p style="font-size:13px">Please select a student from the dropdown above to view their academic profile and notes.</p>
            </div>
          }
        </div>
      }

      <!-- GROUPS VIEW -->
      @if (activeTab() === 'groups') {
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px">
          <div>
            <h3 style="margin:0; font-size:16px; font-weight:800; color:var(--text-primary)">Groupes de discussion actifs</h3>
            <p style="margin:2px 0 0 0; font-size:12px; color:var(--text-muted)">Créez et gérez les groupes de discussion et leurs missions.</p>
          </div>
          <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5; font-size:13px; padding:8px 16px; border-radius:8px; display:flex; align-items:center; gap:6px; height:36px" (click)="showCreateGroupModal.set(true)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Créer un Groupe / Mission
          </button>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:16px">
          @for (group of groupChannels(); track group.id) {
            <div style="background:#FFF; border:1px solid var(--border-weak); border-radius:12px; padding:16px; box-shadow:0 4px 6px rgba(0,0,0,0.02); display:flex; flex-direction:column; justify-content:space-between">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px">
                  <span style="font-size:14px; font-weight:800; color:#4F46E5; background:#EEF2FF; padding:4px 10px; border-radius:6px">#{{ group.name }}</span>
                  <button (click)="deleteGroup(group.id, group.name)" style="background:none; border:none; color:#EF4444; cursor:pointer; font-size:14px; padding:2px" title="Supprimer le groupe">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
                
                <div style="margin-bottom:12px">
                  <span style="font-size:10px; font-weight:800; color:var(--text-muted); text-transform:uppercase; display:block; margin-bottom:3px">Membres</span>
                  <span style="font-size:12px; color:var(--text-primary); font-weight:600">{{ getStudentNames(group.members) }}</span>
                </div>
                
                <div style="background:var(--surface-2); border-radius:8px; padding:10px; border-left:3px solid #4F46E5">
                  <span style="font-size:9.5px; font-weight:800; color:#4F46E5; text-transform:uppercase; display:block; margin-bottom:2px">Mission 🎯</span>
                  <span style="font-size:11.5px; color:var(--text-primary); font-style:italic; line-height:1.4">{{ group.topic }}</span>
                </div>
              </div>

              <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:14px; border-top:1px dashed var(--border-weak); padding-top:10px">
                <a href="#/chat" (click)="db.requestedTabRedirect.set('chat')" style="font-size:11px; font-weight:700; color:#4F46E5; text-decoration:none; display:flex; align-items:center; gap:4px">
                  Rejoindre le chat →
                </a>
              </div>
            </div>
          } @empty {
            <div style="grid-column:1/-1; text-align:center; padding:40px; background:#FFF; border:1px dashed var(--border-weak); border-radius:12px">
              <span style="font-size:36px; display:block; margin-bottom:8px">👥</span>
              <p style="font-size:13px; color:var(--text-muted); margin:0">Aucun groupe de discussion privé n'a été créé pour le moment.</p>
            </div>
          }
        </div>

        <!-- CREATE GROUP MODAL -->
        @if (showCreateGroupModal()) {
          <div class="cert-modal-overlay" (click)="showCreateGroupModal.set(false)" style="z-index:99999">
            <div class="cert-modal-card" style="max-width:540px; background:#FFF; border-radius:16px; padding:24px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.15)" (click)="$event.stopPropagation()">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-weak); padding-bottom:12px; margin-bottom:16px">
                <h3 style="margin:0; font-size:15px; font-weight:800; color:#4F46E5; display:flex; align-items:center; gap:6px">
                  👥 Créer un Groupe / Mission de discussion
                </h3>
                <button (click)="showCreateGroupModal.set(false)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:18px">
                  ×
                </button>
              </div>

              <div style="display:flex; flex-direction:column; gap:12px">
                <div>
                  <label style="color:#4F46E5; font-weight:700; font-size:11px; display:block; margin-bottom:4px">Nom du groupe (ex: groupe-a)</label>
                  <input type="text" [(ngModel)]="groupName" placeholder="e.g. groupe-intermediate" style="background:#FFF; padding:8px; border-radius:6px; border:1.5px solid var(--border); width:100%; font-size:12px" />
                </div>

                <div>
                  <label style="color:#4F46E5; font-weight:700; font-size:11px; display:block; margin-bottom:4px">Sujet de discussion (Mission) 🎯</label>
                  <textarea [(ngModel)]="groupTopic" placeholder="Décrivez la mission de discussion pour les étudiants..." rows="3" style="background:#FFF; padding:8px; border-radius:6px; border:1.5px solid var(--border); width:100%; font-size:12px"></textarea>
                  
                  <!-- Suggested Topics Generator -->
                  <div style="margin-top:6px">
                    <span style="font-size:10px; font-weight:700; color:var(--text-muted); display:block; margin-bottom:4px">💡 Sujets suggérés (cliquez pour remplir) :</span>
                    <div style="display:flex; flex-wrap:wrap; gap:4px">
                      @for (t of suggestedTopics; track t.title) {
                        <button (click)="selectTopic(t.prompt)" style="font-size:9.5px; padding:3px 6px; border:1px solid #C7D2FE; background:#EEF2FF; color:#4F46E5; border-radius:4px; cursor:pointer" [title]="t.prompt">
                          {{ t.title }} ({{ t.level }})
                        </button>
                      }
                    </div>
                  </div>
                </div>

                <div style="border-top:1px solid var(--border-weak); padding-top:10px">
                  <label style="color:#4F46E5; font-weight:700; font-size:11px; display:block; margin-bottom:6px">Sélectionner les étudiants :</label>
                  <div style="max-height:130px; overflow-y:auto; display:flex; flex-direction:column; gap:4px; background:var(--surface-2); padding:8px; border-radius:6px; border:1px solid var(--border-weak)">
                    @for (stud of students(); track stud.id) {
                      <label style="display:flex; align-items:center; gap:8px; font-size:12px; cursor:pointer; color:var(--text-primary)">
                        <input type="checkbox" [checked]="selectedStudentsForGroup().includes(stud.id)" (click)="toggleStudentForGroup(stud.id)" />
                        <span>{{ stud.name }} ({{ stud.level }})</span>
                      </label>
                    }
                  </div>
                  <span style="font-size:9.5px; color:var(--text-muted); display:block; margin-top:2px">Si aucun élève n'est coché pour la répartition automatique, tous les élèves seront inclus.</span>
                </div>

                <div style="border-top:1px solid var(--border-weak); padding-top:12px; margin-top:6px; display:grid; grid-template-columns: 1.2fr 1fr; gap:16px; align-items:center">
                  <!-- Automatic split configuration -->
                  <div>
                    <label style="color:#4F46E5; font-weight:700; font-size:11px; display:block; margin-bottom:4px">Répartition Automatique</label>
                    <div style="display:flex; align-items:center; gap:6px">
                      <select [(ngModel)]="selectedAutoSplitSize" style="background:#FFF; padding:6px; border-radius:6px; border:1.5px solid var(--border); font-size:11.5px; flex:1">
                        <option [value]="2">Groupes de 2 (2x2)</option>
                        <option [value]="3">Groupes de 3 (3x3)</option>
                        <option [value]="4">Groupes de 4 (4x4)</option>
                      </select>
                      <button class="btn-p" style="background:#0D9488; border-color:#0D9488; font-size:11px; padding:6px 10px; font-weight:700; height: 32px" (click)="createGroupAutoSplit()">
                        Répartir
                      </button>
                    </div>
                  </div>

                  <!-- Manual Creation button -->
                  <div style="display:flex; justify-content:flex-end; gap:8px; align-self:flex-end">
                    <button class="btn-s" (click)="showCreateGroupModal.set(false)" style="height:32px; font-size:11px; padding:0 12px">Annuler</button>
                    <button class="btn-p" style="height:32px; font-size:11px; padding:0 12px; background:#4F46E5; border-color:#4F46E5" (click)="createGroupManual()">Créer Manuel</button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        }
      }


      <!-- DEDICATED QUICK ACCESS MODAL -->
      @if (selectedStudentForAccess(); as student) {
        <div class="ts-modal-overlay" (click)="closeAccessModal()" style="z-index:99999">
          <div class="ts-modal-card" style="max-width:540px; border-radius:16px; padding:24px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25)" (click)="$event.stopPropagation()">
            
            <!-- Header -->
            <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid var(--border-weak); padding-bottom:14px; margin-bottom:16px">
              <div style="display:flex; align-items:center; gap:12px">
                <div class="avatar" style="width:42px; height:42px; font-size:15px; background:#EEF2FF; color:#4F46E5; border:2px solid #C7D2FE; font-weight:800">
                  {{ student.avatar || student.name.slice(0,2).toUpperCase() }}
                </div>
                <div>
                  <h3 style="margin:0; font-size:16px; font-weight:800; color:#1E1B4B; display:flex; align-items:center; gap:6px">
                    <span>{{ student.name }}</span>
                    <span style="font-size:10px; font-weight:700; background:#EEF2FF; color:#4F46E5; padding:2px 6px; border-radius:4px">{{ student.level }}</span>
                  </h3>
                  <p style="margin:2px 0 0 0; font-size:11.5px; color:var(--text-muted)">
                    Débloquez ou verrouillez les accès spécifiques pour cet élève
                  </p>
                </div>
              </div>
              <button (click)="closeAccessModal()" aria-label="Fermer le panneau d'accès" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:16px; line-height:1; display:flex; align-items:center; justify-content:center">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <!-- Fast 1-click VIP Unlock vs Reset -->
            <div style="background:linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%); border:1px solid #E2E8F0; border-radius:12px; padding:12px 14px; margin-bottom:16px; display:flex; justify-content:space-between; align-items:center; gap:10px">
              <div>
                <span style="font-size:12px; font-weight:800; color:#0F172A; display:inline-flex; align-items:center; gap:4px">Action Rapide <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>
                <span style="font-size:10.5px; color:#64748B">Activer tous les modules en 1 clic</span>
              </div>
              <div style="display:flex; gap:6px">
                <button class="btn-p" style="background:#10B981; border-color:#10B981; font-size:11px; font-weight:800; padding:6px 12px; border-radius:6px; display:inline-flex; align-items:center; gap:4px; box-shadow:0 2px 8px rgba(16,185,129,0.3)" (click)="unlockAllStudentAccess(student)">
                  🌟 Tout Débloquer (VIP)
                </button>
                <button class="btn-s" style="font-size:11px; padding:6px 10px; border-radius:6px" (click)="resetStudentToFreeTier(student)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg> Découverte
                </button>
              </div>
            </div>

            <!-- Granular Toggle Switches -->
            <div style="display:flex; flex-direction:column; gap:10px; max-height:360px; overflow-y:auto; padding-right:4px">
              
              <!-- 1. Full Course & Ebooks -->
              <div style="background:white; border:1px solid var(--border-weak); border-radius:10px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center">
                <div style="display:flex; align-items:center; gap:10px">
                  <div style="width:36px; height:36px; border-radius:8px; background:#EEF2FF; color:#4F46E5; display:flex; align-items:center; justify-content:center; flex-shrink:0"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z"/></svg></div>
                  <div>
                    <div style="font-size:12.5px; font-weight:700; color:var(--text-primary)">Cours Complets & Bibliothèque Ebooks</div>
                    <div style="font-size:10.5px; color:var(--text-muted)">Accès à toutes les leçons, documents et fiches</div>
                  </div>
                </div>
                <label style="position:relative; display:inline-block; width:48px; height:26px; cursor:pointer; flex-shrink:0; touch-action:manipulation">
                  <input type="checkbox" [checked]="student.hasFullAccess || student.isPaid" (change)="toggleStudentAccessField(student, 'hasFullAccess')" style="opacity:0; width:0; height:0" />
                  <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; transition:.3s; border-radius:24px" [style.background-color]="(student.hasFullAccess || student.isPaid) ? '#4F46E5' : '#CBD5E1'">
                    <span style="position:absolute; content:''; height:20px; width:20px; left:3px; bottom:3px; background-color:white; transition:.3s; border-radius:50%" [style.transform]="(student.hasFullAccess || student.isPaid) ? 'translateX(20px)' : 'translateX(0)'"></span>
                  </span>
                </label>
              </div>

              <!-- 2. Live Classes -->
              <div style="background:white; border:1px solid var(--border-weak); border-radius:10px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center">
                <div style="display:flex; align-items:center; gap:10px">
                  <div style="width:36px; height:36px; border-radius:8px; background:#EEF2FF; color:#4F46E5; display:flex; align-items:center; justify-content:center; flex-shrink:0"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg></div>
                  <div>
                    <div style="font-size:12.5px; font-weight:700; color:var(--text-primary)">Classes en Direct & Live Meet</div>
                    <div style="font-size:10.5px; color:var(--text-muted)">Participation aux cours en visioconférence & Ice Breaker</div>
                  </div>
                </div>
                <label style="position:relative; display:inline-block; width:48px; height:26px; cursor:pointer; flex-shrink:0; touch-action:manipulation">
                  <input type="checkbox" [checked]="student.hasLiveAccess || student.isPaid" (change)="toggleStudentAccessField(student, 'hasLiveAccess')" style="opacity:0; width:0; height:0" />
                  <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; transition:.3s; border-radius:24px" [style.background-color]="(student.hasLiveAccess || student.isPaid) ? '#4F46E5' : '#CBD5E1'">
                    <span style="position:absolute; content:''; height:20px; width:20px; left:3px; bottom:3px; background-color:white; transition:.3s; border-radius:50%" [style.transform]="(student.hasLiveAccess || student.isPaid) ? 'translateX(20px)' : 'translateX(0)'"></span>
                  </span>
                </label>
              </div>

              <!-- 3. Tests DET -->
              <div style="background:white; border:1px solid var(--border-weak); border-radius:10px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center">
                <div style="display:flex; align-items:center; gap:10px">
                  <div style="width:36px; height:36px; border-radius:8px; background:#FEF3C7; color:#B45309; display:flex; align-items:center; justify-content:center; flex-shrink:0"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg></div>
                  <div>
                    <div style="font-size:12.5px; font-weight:700; color:var(--text-primary)">Tests d'Anglais & Certifications DET</div>
                    <div style="font-size:10.5px; color:var(--text-muted)">Passation d'examens certifiants & score 10-160</div>
                  </div>
                </div>
                <label style="position:relative; display:inline-block; width:48px; height:26px; cursor:pointer; flex-shrink:0; touch-action:manipulation">
                  <input type="checkbox" [checked]="student.hasExamAccess || student.isPaid" (change)="toggleStudentAccessField(student, 'hasExamAccess')" style="opacity:0; width:0; height:0" />
                  <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; transition:.3s; border-radius:24px" [style.background-color]="(student.hasExamAccess || student.isPaid) ? '#4F46E5' : '#CBD5E1'">
                    <span style="position:absolute; content:''; height:20px; width:20px; left:3px; bottom:3px; background-color:white; transition:.3s; border-radius:50%" [style.transform]="(student.hasExamAccess || student.isPaid) ? 'translateX(20px)' : 'translateX(0)'"></span>
                  </span>
                </label>
              </div>

              <!-- 4. Voice Chat Messaging -->
              <div style="background:white; border:1px solid var(--border-weak); border-radius:10px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center">
                <div style="display:flex; align-items:center; gap:10px">
                  <div style="width:36px; height:36px; border-radius:8px; background:#CCFBF1; color:#0F766E; display:flex; align-items:center; justify-content:center; flex-shrink:0"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg></div>
                  <div>
                    <div style="font-size:12.5px; font-weight:700; color:var(--text-primary)">Messages Vocaux dans le Chat</div>
                    <div style="font-size:10.5px; color:var(--text-muted)">Autorise l'envoi de messages vocaux audio</div>
                  </div>
                </div>
                <label style="position:relative; display:inline-block; width:48px; height:26px; cursor:pointer; flex-shrink:0; touch-action:manipulation">
                  <input type="checkbox" [checked]="student.voiceChatAllowed || student.isPaid" (change)="toggleStudentAccessField(student, 'voiceChatAllowed')" style="opacity:0; width:0; height:0" />
                  <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; transition:.3s; border-radius:24px" [style.background-color]="(student.voiceChatAllowed || student.isPaid) ? '#4F46E5' : '#CBD5E1'">
                    <span style="position:absolute; content:''; height:20px; width:20px; left:3px; bottom:3px; background-color:white; transition:.3s; border-radius:50%" [style.transform]="(student.voiceChatAllowed || student.isPaid) ? 'translateX(20px)' : 'translateX(0)'"></span>
                  </span>
                </label>
              </div>

              <!-- 5. Private VIP Coaching -->
              <div style="background:white; border:1px solid var(--border-weak); border-radius:10px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center">
                <div style="display:flex; align-items:center; gap:10px">
                  <div style="width:36px; height:36px; border-radius:8px; background:#FCE7F3; color:#9D174D; display:flex; align-items:center; justify-content:center; flex-shrink:0"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/></svg></div>
                  <div>
                    <div style="font-size:12.5px; font-weight:700; color:var(--text-primary)">Coaching Privé VIP (Suivi 1-on-1)</div>
                    <div style="font-size:10.5px; color:var(--text-muted)">Feuille de route sur-mesure et plan d'action</div>
                  </div>
                </div>
                <label style="position:relative; display:inline-block; width:48px; height:26px; cursor:pointer; flex-shrink:0; touch-action:manipulation">
                  <input type="checkbox" [checked]="student.isPrivateCoaching || student.isPaid" (change)="toggleStudentAccessField(student, 'isPrivateCoaching')" style="opacity:0; width:0; height:0" />
                  <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; transition:.3s; border-radius:24px" [style.background-color]="(student.isPrivateCoaching || student.isPaid) ? '#4F46E5' : '#CBD5E1'">
                    <span style="position:absolute; content:''; height:20px; width:20px; left:3px; bottom:3px; background-color:white; transition:.3s; border-radius:50%" [style.transform]="(student.isPrivateCoaching || student.isPaid) ? 'translateX(20px)' : 'translateX(0)'"></span>
                  </span>
                </label>
              </div>

              <!-- 6. Statut de paiement -->
              <div style="background:#F0FDF4; border:1px solid #BBF7D0; border-radius:10px; padding:12px 14px; display:flex; justify-content:space-between; align-items:center">
                <div style="display:flex; align-items:center; gap:10px">
                  <div style="width:36px; height:36px; border-radius:8px; background:#DCFCE7; color:#15803D; display:flex; align-items:center; justify-content:center; flex-shrink:0"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></div>
                  <div>
                    <div style="font-size:12.5px; font-weight:700; color:#15803D">Compte en Règle (Scolarité Acquittée)</div>
                    <div style="font-size:10.5px; color:#166534">Valide les frais et active le statut VIP global</div>
                  </div>
                </div>
                <label style="position:relative; display:inline-block; width:48px; height:26px; cursor:pointer; flex-shrink:0; touch-action:manipulation">
                  <input type="checkbox" [checked]="student.isPaid ?? false" (change)="toggleStudentPayment(student)" style="opacity:0; width:0; height:0" />
                  <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; transition:.3s; border-radius:24px" [style.background-color]="student.isPaid ? '#10B981' : '#CBD5E1'">
                    <span style="position:absolute; content:''; height:20px; width:20px; left:3px; bottom:3px; background-color:white; transition:.3s; border-radius:50%" [style.transform]="student.isPaid ? 'translateX(20px)' : 'translateX(0)'"></span>
                  </span>
                </label>
              </div>

            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; border-top:1px solid var(--border-weak); padding-top:14px">
              @if (student.phone) {
                <a [href]="getWhatsAppUrl(student.phone, student.name)" target="_blank" class="btn-s" style="background:#25D366; color:white; border:none; font-size:11px; padding:6px 12px; display:inline-flex; align-items:center; gap:5px; font-weight:700; text-decoration:none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> Notifier sur WhatsApp
                </a>
              } @else {
                <span></span>
              }
              <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5; padding:6px 18px; font-size:12px; font-weight:700" (click)="closeAccessModal()">
                Fermer
              </button>
            </div>

          </div>
        </div>
      }

      <!-- FULL SCREEN PRINTABLE CERTIFICATE VIEW MODAL FOR TEACHER -->
      @if (selectedCertificate(); as lvl) {
        @if (selectedStudentCert(); as student) {
          <div class="cert-modal-overlay" (click)="selectedCertificate.set(null); selectedStudentCert.set(null)">
            <div class="cert-modal-card" (click)="$event.stopPropagation()">
              
              <div class="no-print" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-weak); padding-bottom:12px; margin-bottom:16px">
                <h3 style="margin:0; font-size:14px; font-weight:800; color:var(--text-primary)">{{ t("Aperçu du Certificat de l'élève", "Student Certificate Preview") }}</h3>
                <button (click)="selectedCertificate.set(null); selectedStudentCert.set(null)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:16px; line-height:1; display:flex; align-items:center; justify-content:center"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
              </div>

              <!-- THE PRINTABLE CERTIFICATE CARD -->
              <div class="printable-certificate" style="background:#FAF9F6; border: 12px double #1E1B4B; border-radius: 4px; padding: 40px; text-align: center; position: relative; box-shadow: inset 0 0 0 2px #D97706, 0 4px 12px rgba(0,0,0,0.05); overflow:hidden;">
                
                <div style="position:absolute; inset:0; background: radial-gradient(circle, rgba(79, 70, 229, 0.02) 10%, transparent 60%); pointer-events:none"></div>

                <!-- Top Logo speakup -->
                <div style="font-family:'Outfit', sans-serif; font-weight:900; color:#1E1B4B; font-size:22px; letter-spacing:1px; display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:10px">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <span>SPEAK<span style="color:#D97706">UP</span></span>
                </div>

                <div style="font-family:'Cinzel', serif; font-size:12px; font-weight:700; color:#D97706; letter-spacing:3px; text-transform:uppercase; margin-bottom:14px">
                  {{ t("CERTIFICAT DE COMPÉTENCE LINGUISTIQUE", "CERTIFICATE OF LANGUAGE PROFICIENCY") }}
                </div>

                <div style="font-size:13px; color:#475569; font-style:italic; margin-bottom:14px">
                  {{ t("Ce document officiel est décerné à", "This official certificate is proudly presented to") }}
                </div>

                <!-- Student Name -->
                <div style="font-size:28px; font-weight:900; color:#1E1B4B; margin-bottom:14px; text-decoration: underline; text-decoration-color:#D97706; text-underline-offset: 6px; letter-spacing:0.5px">
                  {{ student.name }}
                </div>

                <div style="font-size:13px; color:#475569; line-height:1.6; max-width:520px; margin:0 auto 20px auto">
                  {{ t("pour avoir brillamment validé et démontré ses compétences linguistiques en anglais au niveau", "for having successfully attained and demonstrated linguistic proficiency in the English language at the level of") }}
                  <div style="font-size:16px; font-weight:850; color:#D97706; margin:8px 0; text-transform:uppercase; letter-spacing:0.5px">
                    {{ lvl }} — {{ getLevelFullName(lvl) }}
                  </div>
                  <p style="font-size:11.5px; color:#475569; font-style:italic; line-height:1.4; margin:10px auto; max-width:460px; border-top:1px dashed #CBD5E1; border-bottom:1px dashed #CBD5E1; padding:8px 0">
                    " {{ getLevelDescription(lvl) }} "
                  </p>
                  <div style="font-size:12px; font-weight:700; color:#1E1B4B; margin-top:8px; margin-bottom:14px">
                    {{ t("Score d'évaluation :", "Evaluation Score:") }} <span style="color:#D97706; font-weight:800">{{ getCertificateScore(student.id, lvl) }}</span>
                  </div>
                  {{ t("conformément aux exigences du Cadre Européen Commun de Référence pour les Langues (CECRL).", "in compliance with the criteria of the Common European Framework of Reference for Languages (CEFR).") }}
                </div>

                <!-- Footer with Signatures, Date and Unique hash -->
                <div style="display:grid; grid-template-columns:1.2fr 1fr 1.2fr; gap:10px; border-top:1px solid rgba(79, 70, 229, 0.15); padding-top:20px; align-items:center">
                  <div style="text-align:left">
                    <div style="font-size:10px; color:#64748B; font-weight:600">{{ t("DATE D'ÉMISSION", "ISSUE DATE") }}</div>
                    <div style="font-size:11px; color:#1E1B4B; font-weight:700; margin-top:2px">{{ getCertificateIssueDate(student.id, lvl) }}</div>
                    <div style="font-size:9px; color:#64748B; font-weight:600; margin-top:10px">{{ t("IDENTIFIANT DE SÉCURITÉ", "SECURE CREDENTIAL ID") }}</div>
                    <div style="font-size:10px; color:#4F46E5; font-weight:700; margin-top:2px; font-family:monospace">{{ getCertificateId(student.id, lvl) }}</div>
                  </div>

                  <div style="display:flex; justify-content:center">
                    <div style="width:70px; height:70px; border:2px solid #D97706; border-radius:50%; background:#FFF; display:flex; flex-direction:column; align-items:center; justify-content:center; box-shadow: 0 4px 10px rgba(217, 119, 6, 0.1); position:relative">
                      <span style="font-size:8px; font-weight:900; color:#D97706; text-transform:uppercase; letter-spacing:-0.2px">CEFR</span>
                      <span style="font-size:12px; font-weight:900; color:#1E1B4B">{{ lvl }}</span>
                      <span style="font-size:7px; font-weight:800; color:#D97706; text-transform:uppercase; text-align:center; transform:scale(0.8)">VERIFIED</span>
                      <div style="position:absolute; bottom:-8px; display:flex; gap:6px">
                        <div style="width:10px; height:18px; background:#D97706; transform:rotate(15deg); border-radius:2px"></div>
                        <div style="width:10px; height:18px; background:#D97706; transform:rotate(-15deg); border-radius:2px"></div>
                      </div>
                    </div>
                  </div>

                  <div style="text-align:right">
                    <div style="font-family:'Dancing Script', cursive, sans-serif; font-size:18px; color:#1e1b4b; font-weight:700; font-style:italic">Awa Ndiaye</div>
                    <div style="width:100px; height:1.5px; background:#CBD5E1; margin:4px 0 4px auto"></div>
                    <div style="font-size:10px; color:#64748B; font-weight:600">{{ t('DIRECTEUR PÉDAGOGIQUE', 'ACADEMY DIRECTOR') }}</div>
                    <div style="font-size:9px; color:#D97706; font-weight:700; margin-top:2px">SPEAKUP ACADEMY</div>
                  </div>
                </div>

              </div>

              <div class="no-print" style="display:flex; justify-content:flex-end; gap:12px; margin-top:20px; border-top:1px solid var(--border-weak); padding-top:16px">
                <button class="btn-s" (click)="selectedCertificate.set(null); selectedStudentCert.set(null)">{{ t('Fermer', 'Close') }}</button>
                <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5; display:flex; align-items:center; gap:6px" (click)="printCertificate()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  {{ t('Imprimer Certificat', 'Print Certificate') }}
                </button>
              </div>

            </div>
          </div>
        }
      }
    </div>
  `
})
export class TeacherStudentsComponent {
  selectedCertificate = signal<string | null>(null);
  selectedStudentCert = signal<UserProfile | null>(null);

  isCertificateUnlocked(student: UserProfile, targetLevel: string): boolean {
    if (student.level === 'Guest') return true;
    const attempts = this.db.getStudentExamAttempts(student.id).filter(att => att.passed);
    return attempts.some(att => {
      const quiz = this.db.quizzes.find(q => q.id === att.quizId);
      return quiz ? (quiz.isOfficialExam && quiz.level === targetLevel) : false;
    });
  }

  getCertificateId(studentId: string, level: string): string {
    let hash = 0;
    const str = studentId + '-' + level + '-speakup-salt-2026';
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `SPK-${level}-${Math.abs(hash).toString(16).toUpperCase()}`;
  }

  getLevelFullName(level: string): string {
    switch (level) {
      case 'A1': return this.t('Élémentaire Introductif / Débutant', 'Introductory Elementary / Beginner');
      case 'A2': return this.t('Intermédiaire Usuel / Élémentaire', 'Pre-Intermediate / Elementary');
      case 'B1': return this.t('Seuil / Intermédiaire', 'Threshold / Intermediate');
      case 'B2': return this.t('Avancé / Intermédiaire Supérieur', 'Vantage / Upper Intermediate');
      default: return '';
    }
  }

  getCertificateIssueDate(studentId: string, level: string): string {
    const attempts = this.db.getStudentExamAttempts(studentId).filter(att => att.passed);
    const attempt = attempts.find(att => {
      const quiz = this.db.quizzes.find(q => q.id === att.quizId);
      return quiz ? (quiz.isOfficialExam && quiz.level === level) : false;
    });
    const d = attempt ? new Date(attempt.completedAt) : new Date();
    if (isNaN(d.getTime())) {
      return this.t('1 juillet 2026', 'July 1, 2026');
    }
    const monthsFr = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (this.activeLang() === 'fr') {
      return `${d.getDate()} ${monthsFr[d.getMonth()]} ${d.getFullYear()}`;
    }
    return `${monthsEn[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  getCertificateScore(studentId: string, level: string): string {
    const attempts = this.db.getStudentExamAttempts(studentId).filter(att => att.passed);
    const attempt = attempts.find(att => {
      const quiz = this.db.quizzes.find(q => q.id === att.quizId);
      return quiz ? (quiz.isOfficialExam && quiz.level === level) : false;
    });
    return attempt ? `${attempt.percentage}%` : '100%';
  }

  getLevelDescription(level: string): string {
    switch (level) {
      case 'A1': return this.t(
        "Peut comprendre et utiliser des expressions familières et quotidiennes ainsi que des énoncés très simples.",
        "Can understand and use familiar everyday expressions and very basic phrases."
      );
      case 'A2': return this.t(
        "Peut comprendre des phrases isolées et des expressions fréquemment utilisées en relation avec des domaines immédiats de priorité.",
        "Can understand sentences and frequently used expressions related to areas of most immediate relevance."
      );
      case 'B1': return this.t(
        "Peut comprendre les points essentiels quand un langage clair et standard est utilisé et s'il s'agit de choses familières.",
        "Can understand the main points of clear standard input on familiar matters regularly encountered."
      );
      case 'B2': return this.t(
        "Peut comprendre le contenu essentiel de sujets concrets ou abstraits dans un texte complexe, y compris une discussion technique.",
        "Can understand the main ideas of complex text on both concrete and abstract topics, including technical discussions."
      );
      default: return '';
    }
  }

  printCertificate() {
    window.print();
  }

  public db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  showAddStudentModal = signal<boolean>(false);
  selectedStudentForAccess = signal<UserProfile | null>(null);

  openAccessModal(student: UserProfile) {
    this.selectedStudentForAccess.set(student);
  }

  closeAccessModal() {
    this.selectedStudentForAccess.set(null);
  }

  unlockAllStudentAccess(student: UserProfile) {
    this.db.unlockAllAccessForStudent(student.id).then(() => {
      this.dialogService.alert(
        'Accès VIP Débloqués 🌟',
        `Tous les accès (Cours, Live, Examen DET, Vocal, Coaching VIP) ont été débloqués pour ${student.name} !`,
        'success'
      );
      const updated = {
        ...student,
        isPaid: true,
        hasFullAccess: true,
        hasLiveAccess: true,
        hasExamAccess: true,
        voiceChatAllowed: true,
        isPrivateCoaching: true,
        paymentRemindersActive: false
      };
      if (this.selectedStudent()?.id === student.id) {
        this.selectedStudent.set(updated);
      }
      if (this.selectedStudentForAccess()?.id === student.id) {
        this.selectedStudentForAccess.set(updated);
      }
    });
  }

  resetStudentToFreeTier(student: UserProfile) {
    this.db.revokeAllAccessForStudent(student.id).then(() => {
      this.dialogService.alert(
        'Accès Réinitialisés 🌱',
        `Les accès de ${student.name} ont été remis au niveau Découverte (gratuit).`,
        'info'
      );
      const updated = {
        ...student,
        isPaid: false,
        hasFullAccess: false,
        hasLiveAccess: false,
        hasExamAccess: false,
        voiceChatAllowed: false,
        isPrivateCoaching: false
      };
      if (this.selectedStudent()?.id === student.id) {
        this.selectedStudent.set(updated);
      }
      if (this.selectedStudentForAccess()?.id === student.id) {
        this.selectedStudentForAccess.set(updated);
      }
    });
  }

  toggleStudentAccessField(student: UserProfile, field: 'hasFullAccess' | 'hasLiveAccess' | 'hasExamAccess' | 'voiceChatAllowed' | 'isPrivateCoaching') {
    const nextVal = !Boolean(student[field]);
    const updates: Partial<UserProfile> = { [field]: nextVal };
    this.db.updateUserProfile(student.id, updates).then(() => {
      const fieldNames: Record<string, string> = {
        hasFullAccess: 'Accès Cours & Ebooks',
        hasLiveAccess: 'Classes en Direct (Live)',
        hasExamAccess: 'Mode Examen & Tests DET',
        voiceChatAllowed: 'Chat Vocal (Audio)',
        isPrivateCoaching: 'Coaching Privé VIP'
      };
      this.dialogService.alert(
        'Accès Modifié',
        `${fieldNames[field] || field} ${nextVal ? 'débloqué ✅' : 'désactivé 🔒'} pour ${student.name}.`,
        'success'
      );
      const updated = { ...student, [field]: nextVal };
      if (this.selectedStudent()?.id === student.id) {
        this.selectedStudent.set(updated);
      }
      if (this.selectedStudentForAccess()?.id === student.id) {
        this.selectedStudentForAccess.set(updated);
      }
    });
  }
  activeLang = this.db.activeLang;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

  activeTab = signal<string>('all');
  students = signal<UserProfile[]>([]);
  selectedStudent = signal<UserProfile | null>(null);
  attendance = signal<Attendance[]>([]);
  
  registrationRequests = signal<RegistrationRequest[]>([]);
  pendingRequests = computed(() => this.registrationRequests().filter(r => r.status === 'pending'));
  pendingRequestsCount = computed(() => this.pendingRequests().length);

  teacherNotes = '';

  newStudentName = '';
  newStudentLevel = 'B1';
  newStudentCountry = '🇸🇳';
  newStudentRegFee = 10000;
  newStudentMonthlyFee = 7000;

  // Discussion Groups Management Signals & Properties
  channels = signal<ChatChannel[]>([]);
  groupChannels = computed(() => this.channels().filter(c => c.isPrivate && c.id.startsWith('chan-') && c.topic));
  showCreateGroupModal = signal<boolean>(false);
  groupName = signal<string>('');
  groupTopic = signal<string>('');
  selectedStudentsForGroup = signal<string[]>([]);
  selectedAutoSplitSize = signal<number>(2);

  suggestedTopics = [
    { level: 'A1-A2', title: 'Introduce Yourself 👥', prompt: 'Talk about your family, your hometown, and your favorite hobbies. Keep sentences short and simple.' },
    { level: 'A1-A2', title: 'My Daily Routine ⏰', prompt: 'Discuss what you do from the moment you wake up until you go to sleep. Use words like: first, then, after, finally.' },
    { level: 'B1-B2', title: 'Future of Tech 🤖', prompt: 'Discuss how artificial intelligence will change jobs in the next 10 years. Share your fears and hopes.' },
    { level: 'B1-B2', title: 'Healthy Habits 🍎', prompt: 'Debate what is more important for health: eating organic food or doing intensive exercise daily.' },
    { level: 'C1-C2', title: 'Cultural Differences 🌍', prompt: 'Analyse how direct vs indirect communication styles impact international business relations. Give examples.' }
  ];

  constructor() {
    this.db.observeRegistrationRequests().subscribe(list => {
      this.registrationRequests.set(list);
    });

    this.db.observeUsers().subscribe(list => {
      this.students.set(list.filter(u => u.role === 'student' || u.role === 'guest'));
      
      // Update selected student reference if users list updates
      const active = this.selectedStudent();
      if (active) {
        const fresh = list.find(u => u.id === active.id);
        if (fresh) {
          this.selectedStudent.set(fresh);
        } else {
          this.selectedStudent.set(null);
        }
      }
    });

    this.db.observeAttendance().subscribe(list => {
      this.attendance.set(list);
    });

    this.db.observeChannels().subscribe(list => {
      this.channels.set(list);
    });
  }

  getWhatsAppUrl(phone: string | undefined, name: string | undefined): string {
    if (!phone) return '#';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(`Bonjour ${name || ''} 👋, votre compte SpeakUp a été approuvé avec succès 🎉 ! Vous pouvez maintenant vous connecter à la plateforme.`);
    return `https://wa.me/${cleanPhone}?text=${message}`;
  }

  getAttendancePercentage(studentId: string): number {
    const list = this.attendance();
    let totalClasses = 0;
    let totalPresent = 0;
    list.forEach(att => {
      const record = att.records[studentId];
      if (record && record !== '-') {
        totalClasses++;
        if (record === 'P' || record === 'L') {
          totalPresent++;
        }
      }
    });
    return totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 100;
  }

  getStudentStatus(student: UserProfile): string {
    const att = this.getAttendancePercentage(student.id);
    if (att < 50) return 'At risk';
    if (att < 70 || student.xp < 800) return 'Struggling';
    if (student.xp > 2000) return 'Ready to advance';
    return 'Active';
  }

  getStatusClass(student: UserProfile): string {
    const status = this.getStudentStatus(student);
    if (status === 'At risk') return 'pill r';
    if (status === 'Struggling') return 'pill y';
    if (status === 'Ready to advance') return 'pill g';
    return 'pill b';
  }

  openProfile(student: UserProfile) {
    this.selectedStudent.set(student);
    this.teacherNotes = this.db.getUserNotes(student.id);
    this.activeTab.set('profile');
  }

  onStudentSelect(studentId: string | null) {
    const student = this.students().find(s => s.id === studentId);
    if (student) {
      this.selectedStudent.set(student);
      this.teacherNotes = this.db.getUserNotes(student.id);
    } else {
      this.selectedStudent.set(null);
      this.teacherNotes = '';
    }
  }

  saveNotes() {
    const s = this.selectedStudent();
    if (s) {
      this.db.saveUserNotes(s.id, this.teacherNotes);
      this.dialogService.alert('Notes Saved', `Notes for ${s.name} saved successfully!`, 'success');
    }
  }

  updateStudentFee(studentId: string, field: 'registrationFee' | 'monthlyFee', event: Event) {
    const select = event.target as HTMLSelectElement;
    const value = parseInt(select.value, 10);
    this.db.updateUserProfile(studentId, { [field]: value });
    this.dialogService.alert('Billing Updated', `Student's ${field === 'registrationFee' ? 'registration fee' : 'monthly tuition'} has been updated to ${value.toLocaleString()} CFA!`, 'success');
  }

  updateStudentPermission(studentId: string, property: string, event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.checked;
    this.db.updateUserProfile(studentId, { [property]: value });
    this.dialogService.alert('Permission Updated', `Student voice chat permissions updated!`, 'success');
  }

  toggleStudentPayment(student: UserProfile) {
    const nextVal = !student.isPaid;
    const updates: Partial<UserProfile> = { isPaid: nextVal };
    if (nextVal) {
      updates.paymentRemindersActive = false;
    }
    this.db.updateUserProfile(student.id, updates).then(() => {
      this.dialogService.alert('Paiement mis à jour', `Le statut de paiement de ${student.name} a été mis à jour.`, 'success');
      const active = this.selectedStudent();
      if (active && active.id === student.id) {
        this.selectedStudent.set({ ...active, ...updates });
      }
    });
  }

  toggleStudentReminders(student: UserProfile) {
    const nextVal = !student.paymentRemindersActive;
    this.db.updateUserProfile(student.id, { paymentRemindersActive: nextVal }).then(() => {
      this.dialogService.alert('Rappels mis à jour', `Rappels de paiement ${nextVal ? 'activés' : 'désactivés'} pour ${student.name}.`, 'success');
      const active = this.selectedStudent();
      if (active && active.id === student.id) {
        this.selectedStudent.set({ ...active, paymentRemindersActive: nextVal });
      }
    });
  }

  updateStudentXPDirect(studentId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    if (isNaN(value)) return;
    this.db.updateUserProfile(studentId, { xp: value }).then(() => {
      this.dialogService.alert('XP mis à jour', `Les points XP de l'élève ont été mis à jour à ${value} XP.`, 'success');
      const active = this.selectedStudent();
      if (active && active.id === studentId) {
        this.selectedStudent.set({ ...active, xp: value });
      }
    });
  }

  resetStudentXP(student: UserProfile) {
    this.dialogService.show({
      title: 'Réinitialiser les XP',
      message: `Voulez-vous vraiment réinitialiser les points XP de ${student.name} à 0 ?`,
      type: 'confirm',
      confirmText: 'Réinitialiser',
      cancelText: 'Annuler',
      onConfirm: () => {
        this.db.updateUserProfile(student.id, { xp: 0 }).then(() => {
          this.dialogService.alert('XP réinitialisés', `Les points XP de ${student.name} ont été remis à 0.`, 'success');
          const active = this.selectedStudent();
          if (active && active.id === student.id) {
            this.selectedStudent.set({ ...active, xp: 0 });
          }
        });
      }
    });
  }

  addStudent() {
    if (!this.newStudentName.trim()) return;
    const isGuest = this.newStudentLevel === 'Guest';
    this.db.addStudent(
      this.newStudentName, 
      this.newStudentLevel, 
      this.newStudentCountry, 
      isGuest ? 0 : Number(this.newStudentRegFee), 
      isGuest ? 0 : Number(this.newStudentMonthlyFee)
    ).then((newUser) => {
      if (isGuest && newUser) {
        this.dialogService.alert(
          'Guest Account Created 🎉',
          `Compte invité créé pour ${this.newStudentName} !\nUsername : ${newUser.username}\nCode d'accès : ${newUser.password}\n\nVous pouvez copier son lien direct depuis son profil.`,
          'success'
        );
      } else {
        this.dialogService.alert(
          'Student Created', 
          `Student account for ${this.newStudentName} created successfully! Payment records initialized.`, 
          'success'
        );
      }
      this.showAddStudentModal.set(false);
      this.newStudentName = '';
      this.newStudentLevel = 'B1';
      this.newStudentCountry = '🇸🇳';
      this.newStudentRegFee = 10000;
      this.newStudentMonthlyFee = 7000;
    });
  }

  onStudentsFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;
    const file = target.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (lines.length === 0) {
        this.dialogService.alert('Fichier Vide', 'Aucun étudiant trouvé dans le fichier.', 'info');
        return;
      }

      let importedCount = 0;
      for (const line of lines) {
        // Skip header lines
        if (importedCount === 0 && (line.toLowerCase().includes('name') || line.toLowerCase().includes('nom'))) {
          continue;
        }
        
        let name = '';
        let level = 'B1';
        let flag = '🇸🇳';
        let regFee = 10000;
        let monthlyFee = 7000;

        // Try comma-separated parsing
        const parts = line.split(',').map(p => p.trim());
        if (parts.length > 0 && parts[0]) {
          name = parts[0];
          if (parts.length > 1 && parts[1]) {
            level = parts[1];
          }
          if (parts.length > 2 && parts[2]) {
            flag = parts[2];
          }
          if (parts.length > 3 && !isNaN(Number(parts[3]))) {
            regFee = Number(parts[3]);
          }
          if (parts.length > 4 && !isNaN(Number(parts[4]))) {
            monthlyFee = Number(parts[4]);
          }
          
          try {
            await this.db.addStudent(name, level, flag, regFee, monthlyFee);
            importedCount++;
          } catch (err) {
            console.error('Failed to import student:', name, err);
          }
        }
      }

      this.dialogService.alert(
        'Import Réussi 🎉',
        `${importedCount} étudiants ont été importés et créés avec succès !`,
        'success'
      );
      this.showAddStudentModal.set(false);
      target.value = ''; // Clear file input
    };
    reader.readAsText(file);
  }

  approveRequest(requestId: string, name: string) {
    this.db.approveRegistrationRequest(requestId).then((newUser) => {
      if (newUser && newUser.role === 'guest') {
        this.dialogService.alert(
          'Demande Validée (Invité) 🎉',
          `Le compte invité de ${name} a été créé avec succès !\nUsername : ${newUser.username}\nCode d'accès : ${newUser.password}\n\nVous pouvez copier son lien direct depuis son profil.`,
          'success'
        );
      } else {
        this.dialogService.alert('Demande Validée', `Le compte de ${name} a été créé avec succès !`, 'success');
      }
    });
  }

  rejectRequest(requestId: string, name: string) {
    this.db.rejectRegistrationRequest(requestId).then(() => {
      this.dialogService.alert('Demande Rejetée', `La demande de ${name} a été rejetée.`, 'info');
    });
  }

  toggleBlockUser(student: UserProfile) {
    const newVal = !student.blocked;
    this.db.updateUserProfile(student.id, { blocked: newVal }).then(() => {
      this.dialogService.alert(
        newVal ? 'Compte Bloqué 🚫' : 'Compte Activé ✅',
        `Le compte de ${student.name} a été ${newVal ? 'bloqué' : 'débloqué'} avec succès.`,
        'success'
      );
    });
  }

  updateUserCredential(studentId: string, property: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    this.db.updateUserProfile(studentId, { [property]: value }).then(() => {
      const active = this.selectedStudent();
      if (active && active.id === studentId) {
        this.selectedStudent.set({ ...active, [property]: value });
      }
    });
  }

  copyLoginCredentials(student: UserProfile) {
    const text = `Identifiants SpeakUp pour ${student.name} :\nIdentifiant : ${student.username}\nCode d'accès : ${student.password}\nLien : ${window.location.origin}/#/guest-login`;
    navigator.clipboard.writeText(text).then(() => {
      this.dialogService.alert('Copié !', 'Les identifiants de connexion ont été copiés dans le presse-papiers.', 'success');
    });
  }

  copyLoginLink(student: UserProfile) {
    const link = `${window.location.origin}/#/guest-login?u=${encodeURIComponent(student.username || '')}&p=${encodeURIComponent(student.password || '')}`;
    navigator.clipboard.writeText(link).then(() => {
      this.dialogService.alert('Lien Copié !', 'Le lien d\'accès direct a été copié. Le visiteur pourra se connecter en un clic !', 'success');
    });
  }

  getFlagUrl(flag: string | undefined): string {
    if (!flag) return '';
    const clean = flag.trim().toUpperCase();
    let code = clean;
    if (clean.length > 2) {
      try {
        const codePoints = Array.from(clean).map(c => c.codePointAt(0) || 0);
        if (codePoints.length >= 2 && codePoints[0] >= 127397 && codePoints[0] <= 127423) {
          code = String.fromCharCode(
            codePoints[0] - 127397,
            codePoints[1] - 127397
          );
        }
      } catch(e) {}
    }
    if (code.length !== 2) return '';
    return `https://flagcdn.com/w20/${code.toLowerCase()}.png`;
  }

  // Discussion Groups Management Methods
  toggleStudentForGroup(id: string) {
    const active = this.selectedStudentsForGroup();
    if (active.includes(id)) {
      this.selectedStudentsForGroup.set(active.filter(x => x !== id));
    } else {
      this.selectedStudentsForGroup.set([...active, id]);
    }
  }

  selectTopic(topicPrompt: string) {
    this.groupTopic.set(topicPrompt);
  }

  createGroupManual() {
    if (!this.groupName().trim() || !this.groupTopic().trim() || this.selectedStudentsForGroup().length === 0) {
      this.dialogService.alert('Erreur', 'Veuillez remplir le nom, le sujet et sélectionner au moins un étudiant.', 'info');
      return;
    }
    const name = this.groupName().trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const topic = this.groupTopic().trim();
    const members = [...this.selectedStudentsForGroup()];
    
    this.db.addChannel(name, true, members, topic).then(() => {
      this.dialogService.alert('Groupe Créé', `Le groupe #${name} a été créé avec succès avec la mission associée !`, 'success');
      // Reset fields
      this.groupName.set('');
      this.groupTopic.set('');
      this.selectedStudentsForGroup.set([]);
      this.showCreateGroupModal.set(false);
    });
  }

  createGroupAutoSplit() {
    const studentsList = this.selectedStudentsForGroup().length > 0 
      ? this.selectedStudentsForGroup() 
      : this.students().map(s => s.id);
      
    if (studentsList.length < 2) {
      this.dialogService.alert('Erreur', 'Il faut au moins 2 étudiants pour faire des groupes.', 'info');
      return;
    }
    if (!this.groupTopic().trim()) {
      this.dialogService.alert('Erreur', 'Veuillez définir un sujet de discussion (mission).', 'info');
      return;
    }
    
    const size = this.selectedAutoSplitSize();
    const shuffled = [...studentsList].sort(() => Math.random() - 0.5);
    const baseName = this.groupName().trim() || 'group';
    const topic = this.groupTopic().trim();
    
    // Clean slices to avoid single-student groups if possible
    const groups: string[][] = [];
    for (let i = 0; i < shuffled.length; i += size) {
      groups.push(shuffled.slice(i, i + size));
    }
    if (groups.length > 1 && groups[groups.length - 1].length === 1) {
      const last = groups.pop()!;
      groups[groups.length - 1] = [...groups[groups.length - 1], ...last];
    }
    
    let groupIndex = 1;
    const promises = [];
    for (const groupMembers of groups) {
      const name = `${baseName}-${groupIndex}`.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      promises.push(this.db.addChannel(name, true, groupMembers, topic));
      groupIndex++;
    }
    
    Promise.all(promises).then(() => {
      this.dialogService.alert('Groupes Créés', `${groups.length} groupes créés avec succès par répartition automatique !`, 'success');
      this.groupName.set('');
      this.groupTopic.set('');
      this.selectedStudentsForGroup.set([]);
      this.showCreateGroupModal.set(false);
    });
  }

  deleteGroup(chanId: string, name: string) {
    this.dialogService.show({
      title: 'Supprimer le groupe',
      message: `Voulez-vous vraiment supprimer le groupe #${name} ? Tous ses messages seront effacés.`,
      type: 'confirm',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      onConfirm: () => {
        this.db.deleteChannel(chanId).then(() => {
          this.dialogService.alert('Supprimé', 'Le groupe a été supprimé.', 'success');
        });
      }
    });
  }

  getStudentNames(members: string[] | undefined): string {
    if (!members) return '';
    return members
      .map(mId => this.students().find(s => s.id === mId)?.name || mId)
      .join(', ');
  }
}
