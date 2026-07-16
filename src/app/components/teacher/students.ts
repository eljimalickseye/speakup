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
          Demandes d'inscription
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
                <div style="margin-left:4px; display:inline-flex; gap:2px; align-items:center; vertical-align:middle">
                  @if (student.isPaid) {
                    <span style="font-size:8px; font-weight:800; background:#E6F4EA; color:#137333; padding:1px 4px; border-radius:3px" title="En règle (Payé)">💳 En règle</span>
                  } @else {
                    <span style="font-size:8px; font-weight:800; background:#FCE8E6; color:#C5221F; padding:1px 4px; border-radius:3px" title="Non réglé">⚠️ Impayé</span>
                    @if (student.paymentRemindersActive) {
                      <span style="font-size:8px; font-weight:800; background:#FEF7E0; color:#B06000; padding:1px 4px; border-radius:3px; animation: pulse-live 2s infinite" title="Rappels de paiement activés">🔔 Rappel</span>
                    }
                  }
                </div>
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
          <div class="ts-modal-overlay" (click)="showAddStudentModal.set(false)">
            <div class="ts-modal-card" (click)="$event.stopPropagation()">
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
                  <div class="input-row" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center">
                    <label style="font-weight:600; font-size:11px; margin-bottom:6px">Statut de Paiement</label>
                    <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:11px; font-weight:700; color:#10B981">
                      <input type="checkbox" [checked]="student.isPaid ?? false" (change)="toggleStudentPayment(student)" style="cursor:pointer" />
                      <span>💳 En règle (A payé)</span>
                    </label>
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
                  <i class="ti ti-crown" style="color:#D97706"></i>
                  <span>XP & Progress Management</span>
                </h4>
                
                <div style="display:flex; gap:12px; align-items:flex-end; flex-wrap:wrap">
                  <div class="input-row" style="margin-bottom:0; flex:1; min-width:120px">
                    <label style="font-weight:600; font-size:11px">Modify XP points</label>
                    <input type="number" [value]="student.xp" (change)="updateStudentXPDirect(student.id, $event)" style="background:#FFF; padding:6px; font-size:11px; border-radius:4px; border:1px solid var(--border); width:100%" />
                  </div>
                  
                  <button class="btn-s" (click)="resetStudentXP(student)" style="background:#FEF2F2; border-color:#FCA5A5; color:#DC2626; font-weight:700; height:32px; font-size:11px; padding:0 12px; display:flex; align-items:center; gap:4px">
                    <i class="ti ti-trash"></i> Reset XP to 0
                  </button>
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


      <!-- FULL SCREEN PRINTABLE CERTIFICATE VIEW MODAL FOR TEACHER -->
      @if (selectedCertificate(); as lvl) {
        @if (selectedStudentCert(); as student) {
          <div class="cert-modal-overlay" (click)="selectedCertificate.set(null); selectedStudentCert.set(null)">
            <div class="cert-modal-card" (click)="$event.stopPropagation()">
              
              <div class="no-print" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-weak); padding-bottom:12px; margin-bottom:16px">
                <h3 style="margin:0; font-size:14px; font-weight:800; color:var(--text-primary)">{{ t("Aperçu du Certificat de l'élève", "Student Certificate Preview") }}</h3>
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
