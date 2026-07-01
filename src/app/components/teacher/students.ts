import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, UserProfile, RegistrationRequest, Attendance } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 9999;
    }
    .modal-card {
      background: white; border-radius: 12px; max-width: 600px; width: 95%;
      max-height: 85vh; overflow-y: auto; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    }
    @media print {
      body * {
        visibility: hidden !important;
      }
      .modal-overlay {
        position: absolute !important;
        left: 0 !important; top: 0 !important;
        background: none !important;
        backdrop-filter: none !important;
      }
      .modal-card {
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
          Demandes d'inscription
          @if (pendingRequestsCount() > 0) {
            <span class="badge" style="background:#EF4444; color:white; padding:2px 8px; border-radius:12px; font-size:10px; margin-left:4px">{{ pendingRequestsCount() }}</span>
          }
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
        <div style="display:flex; flex-direction:column; gap:4px; overflow-x:auto">
          <!-- Table Header -->
          <div class="row" style="background:var(--surface-2); font-size:11px; color:var(--text-muted); font-weight:600; border-radius:var(--radius)">
            <div style="width:160px">Name</div>
            <div style="width:60px">Level</div>
            <div style="width:80px; text-align:center">Attendance</div>
            <div style="width:80px; text-align:center">XP</div>
            <div style="flex:1">Last active</div>
            <div style="width:80px">Status</div>
            <div style="width:100px; text-align:right">Action</div>
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
                <span style="font-size:12px; font-weight:600; color:var(--text-primary)">{{ student.name }}</span>
              </div>
              <div style="width:60px; font-size:12px">{{ student.level }}</div>
              <div style="width:80px; text-align:center; font-size:12px">{{ getAttendancePercentage(student.id) }}%</div>
              <div style="width:80px; text-align:center; font-size:12px; font-weight:700; color:#4F46E5">{{ student.xp }} XP</div>
              <div style="flex:1; font-size:11px; color:var(--text-secondary)">{{ db.formatLastActive(student.lastActive) }}</div>
              <div style="width:80px">
                <span [class]="getStatusClass(student)">
                  {{ getStudentStatus(student) }}
                </span>
              </div>
              <div style="width:100px; text-align:right">
                <button class="btn-s" style="padding:4px 8px; font-size:11px" (click)="openProfile(student)">
                  View Profile
                </button>
              </div>
            </div>
          }
        </div>

        <!-- ADD NEW STUDENT MODAL -->
        @if (showAddStudentModal()) {
          <div class="modal-overlay" (click)="showAddStudentModal.set(false)" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.4); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:9999; padding:16px">
            <div class="modal-card" (click)="$event.stopPropagation()" style="background:white; border-radius:12px; max-width:480px; width:100%; padding:24px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); border:1px solid var(--border-weak)">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-weak); padding-bottom:12px; margin-bottom:16px">
                <h3 style="margin:0; font-size:15px; font-weight:800; color:#4F46E5; display:flex; align-items:center; gap:6px">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                  {{ t('Créer un Compte Étudiant', 'Create Student Account') }}
                </h3>
                <button (click)="showAddStudentModal.set(false)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:18px; line-height:1; display:flex; align-items:center; justify-content:center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              
              <div style="display:flex; flex-direction:column; gap:12px">
                <div class="input-row" style="margin-bottom:0">
                  <label for="newStudentName" style="color:#4F46E5; font-weight:700; font-size:11.5px">{{ t('Nom complet', 'Full Name') }}</label>
                  <input id="newStudentName" type="text" [(ngModel)]="newStudentName" placeholder="e.g. Kofi Dembélé" style="background:#FFF; padding:8px; border-radius:6px; border:1.5px solid var(--border); width:100%" />
                </div>
                
                <div class="input-row" style="margin-bottom:0">
                  <label for="newStudentLevel" style="color:#4F46E5; font-weight:700; font-size:11.5px">{{ t('Niveau d\'anglais de départ', 'English Level') }}</label>
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
                    <label for="newStudentRegFee" style="color:#4F46E5; font-weight:700; font-size:11.5px">{{ t('Frais d\'inscription', 'Reg. Fee') }}</label>
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
                  <div style="font-size:11px; color:var(--text-secondary); margin-top:4px">
                    Niveau demandé : <span style="font-weight:700; color:#4F46E5">{{ req.level }}</span> · Date de demande : {{ req.requestedAt }}
                  </div>
                </div>
                <div style="display:flex; gap:8px">
                  <button class="btn-p" style="background:#10B981; border-color:#10B981; font-size:11px; padding:6px 12px" (click)="approveRequest(req.id, req.name)">
                    <i class="ti ti-check"></i> Valider
                  </button>
                  <button class="btn-s" style="border-color:#EF4444; color:#EF4444; font-size:11px; padding:6px 12px" (click)="rejectRequest(req.id, req.name)">
                    <i class="ti ti-x"></i> Rejeter
                  </button>
                </div>
              </div>
            } @empty {
              <div style="text-align:center; padding:30px; font-size:12px; color:var(--text-muted); border:1px dashed var(--border-strong); border-radius:8px">
                Aucune demande d'inscription en attente.
              </div>
            }
          </div>
        </div>
      }

      <!-- PROFILE DETAIL VIEW -->
      @if (activeTab() === 'profile') {
        <div class="card">
          <!-- Student Selector Dropdown inside Profile tab -->
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px; background:var(--surface-2); padding:12px; border-radius:var(--radius)">
            <label for="studentSelect" style="font-weight:600; font-size:12px; color:var(--text-primary)">Select Student:</label>
            <select id="studentSelect" [ngModel]="selectedStudent()?.id" (ngModelChange)="onStudentSelect($event)" style="flex:1; max-width:240px; background:#FFF; border:1px solid var(--border-weak); padding:6px; border-radius:var(--radius); font-size:12px">
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

              <div class="grid3" style="gap:12px; margin-bottom:16px">
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
                  <span>{{ t('Certifications de Niveau de l\'élève', 'Student Language Certificates') }}</span>
                </h4>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap:10px">
                  @for (lvl of ['A1', 'A2', 'B1', 'B2']; track lvl) {
                    <div style="padding:10px; border-radius:8px; border:1.5px solid; display:flex; flex-direction:column; justify-content:space-between; align-items:center; min-height:80px; text-align:center"
                         [style.background]="isCertificateUnlocked(student.level, lvl) ? 'white' : 'var(--surface-2)'"
                         [style.border-color]="isCertificateUnlocked(student.level, lvl) ? '#FDE68A' : 'var(--border-weak)'">
                      <div>
                        <span style="font-size:11px; font-weight:800; color:var(--text-primary)">Level {{ lvl }}</span>
                        <div style="font-size:9.5px; color:var(--text-muted); margin-top:2px">
                          {{ isCertificateUnlocked(student.level, lvl) ? t('Débloqué', 'Unlocked') : t('En cours', 'Locked') }}
                        </div>
                      </div>
                      @if (isCertificateUnlocked(student.level, lvl)) {
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

              <!-- Billing & Permission Settings -->
              <div class="card" style="margin-top:0; margin-bottom:16px; border: 1px dashed var(--border-weak); background:var(--surface-1); padding:16px; border-radius:8px">
                <h4 style="font-size:12px; font-weight:700; color:var(--text-primary); margin-bottom:12px; display:flex; align-items:center; gap:6px; margin-top:0">
                  <i class="ti ti-credit-card" style="color:#4F46E5"></i>
                  <span>Billing & Permission Settings</span>
                </h4>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px">
                  <div class="input-row" style="margin-bottom:0">
                    <label style="font-weight:600; font-size:11px">Registration Fee</label>
                    <select [value]="student.registrationFee ?? 10000" (change)="updateStudentFee(student.id, 'registrationFee', $event)" style="background:#FFF; padding:6px; font-size:11px">
                      <option [value]="10000">10,000 CFA (Regular)</option>
                      <option [value]="0">0 CFA (Waived / Promo)</option>
                    </select>
                  </div>
                  <div class="input-row" style="margin-bottom:0">
                    <label style="font-weight:600; font-size:11px">Monthly Tuition</label>
                    <select [value]="student.monthlyFee ?? 7000" (change)="updateStudentFee(student.id, 'monthlyFee', $event)" style="background:#FFF; padding:6px; font-size:11px">
                      <option [value]="7000">7,000 CFA (Regular)</option>
                      <option [value]="5000">5,000 CFA (Promo)</option>
                    </select>
                  </div>
                  <div class="input-row" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center">
                    <label style="font-weight:600; font-size:11px; margin-bottom:6px">Chat Messaging</label>
                    <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:11px; font-weight:600; color:#0D9488">
                      <input type="checkbox" [checked]="student.voiceChatAllowed ?? false" (change)="updateStudentPermission(student.id, 'voiceChatAllowed', $event)" style="cursor:pointer" />
                      <span>Allow Voice Messages</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Account Security & Guest Credentials -->
              <div class="card" style="margin-top:16px; margin-bottom:16px; border: 1px dashed var(--border-weak); background:var(--surface-1); padding:16px; border-radius:8px">
                <h4 style="font-size:12px; font-weight:700; color:var(--text-primary); margin-bottom:12px; display:flex; align-items:center; gap:6px; margin-top:0">
                  <i class="ti ti-shield-lock" style="color:#EF4444"></i>
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
                          <i class="ti ti-copy"></i> Copier les identifiants
                        </button>
                        <button class="btn-p" style="padding:6px 12px; font-size:11px; flex:1; display:flex; align-items:center; justify-content:center; gap:6px; background:#4F46E5" (click)="copyLoginLink(student)">
                          <i class="ti ti-link"></i> Copier le lien d'accès direct
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
                <i class="ti ti-device-floppy"></i> Save Student Notes
              </button>
            </div>
          } @else {
            <div style="text-align:center; padding:32px; color:var(--text-muted)">
              <i class="ti ti-user-search" style="font-size:36px; display:block; margin-bottom:12px; color:var(--text-muted)"></i>
              <p style="font-size:13px">Please select a student from the dropdown above to view their academic profile and notes.</p>
            </div>
          }
        </div>
      }

      <!-- FULL SCREEN PRINTABLE CERTIFICATE VIEW MODAL FOR TEACHER -->
      @if (selectedCertificate(); as lvl) {
        @if (selectedStudentCert(); as student) {
          <div class="modal-overlay" (click)="selectedCertificate.set(null); selectedStudentCert.set(null)" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.55); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:99999; padding:16px">
            <div class="modal-card" (click)="$event.stopPropagation()" style="background:white; border-radius:16px; max-width:760px; width:100%; padding:24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15)">
              
              <div class="no-print" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-weak); padding-bottom:12px; margin-bottom:16px">
                <h3 style="margin:0; font-size:14px; font-weight:800; color:var(--text-primary)">{{ t('Aperçu du Certificat de l\'élève', 'Student Certificate Preview') }}</h3>
                <button (click)="selectedCertificate.set(null); selectedStudentCert.set(null)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:20px; line-height:1"><i class="ti ti-x"></i></button>
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
                  {{ t('CERTIFICAT DE COMPÉTENCE LINGUISTIQUE', 'CERTIFICATE OF LANGUAGE PROFICIENCY') }}
                </div>

                <div style="font-size:13px; color:#475569; font-style:italic; margin-bottom:14px">
                  {{ t('Ce document officiel est décerné à', 'This official certificate is proudly presented to') }}
                </div>

                <!-- Student Name -->
                <div style="font-size:28px; font-weight:900; color:#1E1B4B; margin-bottom:14px; text-decoration: underline; text-decoration-color:#D97706; text-underline-offset: 6px; letter-spacing:0.5px">
                  {{ student.name }}
                </div>

                <div style="font-size:13px; color:#475569; line-height:1.6; max-width:520px; margin:0 auto 20px auto">
                  {{ t('pour avoir brillamment validé et démontré ses compétences linguistiques en anglais au niveau', 'for having successfully attained and demonstrated linguistic proficiency in the English language at the level of') }}
                  <div style="font-size:16px; font-weight:850; color:#D97706; margin:8px 0; text-transform:uppercase; letter-spacing:0.5px">
                    {{ lvl }} — {{ getLevelFullName(lvl) }}
                  </div>
                  {{ t('conformément aux exigences du Cadre Européen Commun de Référence pour les Langues (CECRL).', 'in compliance with the criteria of the Common European Framework of Reference for Languages (CEFR).') }}
                </div>

                <!-- Footer with Signatures, Date and Unique hash -->
                <div style="display:grid; grid-template-columns:1.2fr 1fr 1.2fr; gap:10px; border-top:1px solid rgba(79, 70, 229, 0.15); padding-top:20px; align-items:center">
                  <div style="text-align:left">
                    <div style="font-size:10px; color:#64748B; font-weight:600">{{ t('DATE D\'ÉMISSION', 'ISSUE DATE') }}</div>
                    <div style="font-size:11px; color:#1E1B4B; font-weight:700; margin-top:2px">{{ getCertificateIssueDate(student.registeredAt) }}</div>
                    <div style="font-size:9px; color:#64748B; font-weight:600; margin-top:10px">{{ t('IDENTIFIANT DE SÉCURITÉ', 'SECURE CREDENTIAL ID') }}</div>
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

  isCertificateUnlocked(studentLevel: string, targetLevel: string): boolean {
    if (studentLevel === 'Guest') return true;
    const levels = ['A1', 'A2', 'B1', 'B2'];
    const currentIdx = levels.indexOf(studentLevel);
    const targetIdx = levels.indexOf(targetLevel);
    return currentIdx >= targetIdx;
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

  getCertificateIssueDate(registeredAt?: string): string {
    const d = registeredAt ? new Date(registeredAt) : new Date();
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

  printCertificate() {
    window.print();
  }

  public db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  showAddStudentModal = signal<boolean>(false);
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
}
