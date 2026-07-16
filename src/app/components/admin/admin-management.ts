import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="animation: fadeIn 0.25s">
      <!-- Top header stats dashboard -->
      <div class="grid5" style="margin-bottom: 20px">
        <div class="mcard" style="background:#EEF2FF; border:1px solid #C7D2FE; cursor:pointer" [class.active-tab]="activePanel() === 'requests'" (click)="activePanel.set('requests')">
          <div class="mlabel" style="color:#4338CA">Demandes en attente</div>
          <div class="mval" style="color:#4F46E5">
            {{ pendingRequests().length }}
            @if (pendingRequests().length > 0) {
              <span class="pulse-badge">!</span>
            }
          </div>
          <div class="msub" style="color:#4338CA">En attente de validation</div>
        </div>
        <div class="mcard" style="background:#FAF5FF; border:1px solid #E9D5FF; cursor:pointer" [class.active-tab]="activePanel() === 'teachers'" (click)="activePanel.set('teachers')">
          <div class="mlabel" style="color:#7C3AED">Professeurs</div>
          <div class="mval" style="color:#9333EA">{{ teachers().length }}</div>
          <div class="msub" style="color:#7C3AED">Corps enseignant actif</div>
        </div>
        <div class="mcard" style="background:#ECFDF5; border:1px solid #A7F3D0; cursor:pointer" [class.active-tab]="activePanel() === 'students'" (click)="activePanel.set('students')">
          <div class="mlabel" style="color:#047857">Élèves (Students)</div>
          <div class="mval" style="color:#10B981">{{ students().length }}</div>
          <div class="msub" style="color:#047857">Gérer les comptes élèves</div>
        </div>
        <div class="mcard" style="background:#FEF3C7; border:1px solid #FDE68A; cursor:pointer" [class.active-tab]="activePanel() === 'guests'" (click)="activePanel.set('guests')">
          <div class="mlabel" style="color:#B45309">Invités (Guests)</div>
          <div class="mval" style="color:#D97706">{{ guests().length }}</div>
          <div class="msub" style="color:#B45309">Comptes temporaires</div>
        </div>
        <div class="mcard" style="background:#FFF1F2; border:1px solid #FECDD3; cursor:pointer" [class.active-tab]="activePanel() === 'admins'" (click)="activePanel.set('admins')">
          <div class="mlabel" style="color:#E11D48">Administrateurs</div>
          <div class="mval" style="color:#BE123C">{{ admins().length }}</div>
          <div class="msub" style="color:#E11D48">Sécurité & Système</div>
        </div>
      </div>

      <!-- Tab selection sub-header -->
      <div style="display:flex; gap:8px; border-bottom:1px solid var(--border-weak); padding-bottom:10px; margin-bottom: 20px; flex-wrap:wrap">
        <button class="btn-s" [class.active]="activePanel() === 'requests'" (click)="activePanel.set('requests')" style="font-weight:700; font-size:12px; padding:6px 14px">
          ⏳ Demandes en attente
          @if (pendingRequests().length > 0) {
            <span style="background:#EF4444; color:white; font-size:9px; font-weight:700; padding:1px 6px; border-radius:10px; margin-left:4px">{{ pendingRequests().length }}</span>
          }
        </button>
        <button class="btn-s" [class.active]="activePanel() === 'teachers'" (click)="activePanel.set('teachers')" style="font-weight:700; font-size:12px; padding:6px 14px">
          🎓 Professeurs
        </button>
        <button class="btn-s" [class.active]="activePanel() === 'students'" (click)="activePanel.set('students')" style="font-weight:700; font-size:12px; padding:6px 14px">
          📖 Élèves
        </button>
        <button class="btn-s" [class.active]="activePanel() === 'guests'" (click)="activePanel.set('guests')" style="font-weight:700; font-size:12px; padding:6px 14px">
          🔑 Invités
        </button>
        <button class="btn-s" [class.active]="activePanel() === 'admins'" (click)="activePanel.set('admins')" style="font-weight:700; font-size:12px; padding:6px 14px">
          🛡️ Admins
        </button>
      </div>

      <!-- PANEL 1: PENDING REGISTRATION REQUESTS -->
      @if (activePanel() === 'requests') {
        <!-- Registration Mode Configuration Card -->
        <div class="card" style="background:#FFFEEF; border:1px solid #FCD34D; border-radius:12px; padding:16px; margin-bottom:20px; display:flex; flex-direction:column; gap:16px; animation: fadeIn 0.2s">
          <div style="flex:1">
            <h4 style="margin:0 0 4px 0; font-size:14px; font-weight:800; color:#B45309; display:flex; align-items:center; gap:6px">
              ⚡ Mode Validation Directe (Inscription Libre)
            </h4>
            <p style="margin:0 0 8px 0; font-size:11.5px; color:#92400E; line-height:1.4">
              Activez séparément la validation automatique pour les vagues d'inscription des professeurs ou des étudiants. Les nouveaux membres approuvés pourront se connecter instantanément sans intervention.
            </p>
          </div>
          
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-top: 1px dashed rgba(245, 158, 11, 0.2); padding-top:12px">
            <div>
              <span style="font-size:12.5px; font-weight:700; color:#92400E">👨‍🎓 Connexion directe : Étudiants</span>
              <p style="margin:2px 0 0 0; font-size:11px; color:#B45309">Les étudiants s'inscrivent et se connectent directement.</p>
            </div>
            <div>
              <label class="switch" style="position:relative; display:inline-block; width:48px; height:24px; cursor:pointer">
                <input type="checkbox" 
                       [checked]="db.autoApproveStudents()" 
                       (change)="toggleAutoApproveStudents($event)"
                       style="opacity:0; width:0; height:0; cursor:pointer" />
                <span class="slider" [style.background]="db.autoApproveStudents() ? '#10B981' : '#CBD5E1'" style="position:absolute; top:0; left:0; right:0; bottom:0; transition:0.2s; border-radius:34px">
                  <span style="position:absolute; content:''; height:18px; width:18px; left:3px; bottom:3px; background-color:white; transition:0.2s; border-radius:50%" [style.transform]="db.autoApproveStudents() ? 'translateX(24px)' : 'none'"></span>
                </span>
              </label>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-top: 1px dashed rgba(245, 158, 11, 0.2); padding-top:12px">
            <div>
              <span style="font-size:12.5px; font-weight:700; color:#92400E">👩‍🏫 Connexion directe : Professeurs</span>
              <p style="margin:2px 0 0 0; font-size:11px; color:#B45309">Les professeurs s'inscrivent et se connectent directement.</p>
            </div>
            <div>
              <label class="switch" style="position:relative; display:inline-block; width:48px; height:24px; cursor:pointer">
                <input type="checkbox" 
                       [checked]="db.autoApproveTeachers()" 
                       (change)="toggleAutoApproveTeachers($event)"
                       style="opacity:0; width:0; height:0; cursor:pointer" />
                <span class="slider" [style.background]="db.autoApproveTeachers() ? '#10B981' : '#CBD5E1'" style="position:absolute; top:0; left:0; right:0; bottom:0; transition:0.2s; border-radius:34px">
                  <span style="position:absolute; content:''; height:18px; width:18px; left:3px; bottom:3px; background-color:white; transition:0.2s; border-radius:50%" [style.transform]="db.autoApproveTeachers() ? 'translateX(24px)' : 'none'"></span>
                </span>
              </label>
            </div>
          </div>
        </div>

        <div class="card" style="animation: fadeIn 0.2s">
          <h3 class="st" style="font-size:15px; margin-bottom:12px; color:#4F46E5">Demandes d'inscription en attente</h3>
          <p style="font-size:12px; color:var(--text-secondary); margin-bottom:16px">
            Approuvez ou rejetez les demandes de création de compte. Les comptes approuvés obtiendront un accès complet immédiat à la plateforme.
          </p>

          @if (pendingRequests().length === 0) {
            <div style="text-align:center; padding:32px; color:var(--text-muted); font-size:13px">
              Aucune demande d'inscription en attente.
            </div>
          } @else {
            <div style="display:flex; flex-direction:column; gap:10px">
              @for (req of pendingRequests(); track req.id) {
                <div style="display:flex; justify-content:space-between; align-items:center; padding:14px; background:var(--surface-2); border:1px solid var(--border-weak); border-radius:8px; flex-wrap:wrap; gap:12px">
                  <div>
                    <div style="font-size:14px; font-weight:800; color:var(--text-primary); display:flex; align-items:center; gap:6px">
                      {{ req.name }}
                      @if (req.role === 'teacher') {
                        <span style="font-size:9px; background:#F3E8FF; color:#7C3AED; padding:2px 6px; border-radius:4px; font-weight:700">PROFESSEUR</span>
                      } @else {
                        <span style="font-size:9px; background:#E0E7FF; color:#4F46E5; padding:2px 6px; border-radius:4px; font-weight:700">ÉLÈVE ({{ req.level }})</span>
                      }
                    </div>
                    <div style="font-size:11px; color:var(--text-muted); margin-top:4px">
                      Username: <strong>{{ req.username }}</strong> · Code PIN: <strong>{{ req.password }}</strong> · Pays: {{ req.countryFlag || 'N/A' }}
                    </div>
                  </div>

                  <div style="display:flex; gap:8px">
                    <button class="btn-p" (click)="approveRequest(req)" style="font-size:11px; padding:6px 14px; background:#10B981; border-color:#10B981; font-weight:700">
                      Approuver ✅
                    </button>
                    <button class="btn-s" (click)="rejectRequest(req)" style="font-size:11px; padding:6px 14px; background:#FEE2E2; border-color:#EF4444; color:#DC2626; font-weight:700">
                      Rejeter ❌
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- PANEL 2: TEACHERS MANAGEMENT -->
      @if (activePanel() === 'teachers') {
        <div class="card" style="animation: fadeIn 0.2s">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:16px; flex-wrap:wrap">
            <h3 class="st" style="font-size:15px; margin:0; color:#7C3AED">Corps Enseignant</h3>
            <button class="btn-p" (click)="showAddTeacherForm.set(!showAddTeacherForm())" style="font-size:12px; padding:6px 14px; background:#7C3AED; border-color:#7C3AED; font-weight:700">
              ➕ Nouveau Professeur
            </button>
          </div>

          <!-- Add Teacher Form -->
          @if (showAddTeacherForm()) {
            <div style="background:var(--surface-2); padding:16px; border-radius:10px; border:1px solid var(--border-weak); margin-bottom:20px; display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end">
              <div class="input-row" style="flex:2; min-width:180px; margin-bottom:0">
                <label style="font-size:11px; font-weight:700; color:var(--text-secondary); margin-bottom:4px; display:block">Nom complet</label>
                <input [(ngModel)]="newTeacherName" placeholder="Ex: Prof. Amadou Diallo" class="form-input" style="height:38px; font-size:13px; background:#FFF" />
              </div>
              <div class="input-row" style="flex:1; min-width:140px; margin-bottom:0">
                <label style="font-size:11px; font-weight:700; color:var(--text-secondary); margin-bottom:4px; display:block">Username (Optionnel)</label>
                <input [(ngModel)]="newTeacherUsername" placeholder="Auto-généré si vide" class="form-input" style="height:38px; font-size:13px; background:#FFF" />
              </div>
              <div class="input-row" style="flex:1; min-width:140px; margin-bottom:0">
                <label style="font-size:11px; font-weight:700; color:var(--text-secondary); margin-bottom:4px; display:block">PIN Code (Optionnel)</label>
                <input [(ngModel)]="newTeacherPassword" placeholder="Auto-généré si vide" class="form-input" style="height:38px; font-size:13px; background:#FFF" />
              </div>
              <button class="btn-p" [disabled]="!newTeacherName" (click)="createTeacher()" style="height:38px; padding:0 20px; font-weight:700; background:#7C3AED; border-color:#7C3AED">
                Enregistrer
              </button>
            </div>
          }

          <div style="display:flex; flex-direction:column; gap:8px">
            @for (user of teachers(); track user.id) {
              <div class="user-card">
                <div style="display:flex; align-items:center; gap:12px; flex:1">
                  <div class="avatar" style="width:40px; height:40px; font-size:14px; background:#F3E8FF; color:#7C3AED">
                    {{ user.avatar }}
                  </div>
                  <div>
                    <div style="font-size:14px; font-weight:800; color:var(--text-primary); display:flex; align-items:center; gap:6px">
                      {{ user.name }}
                      @if (user.blocked || user.status === 'suspended') {
                        <span style="font-size:9px; background:#FEE2E2; color:#EF4444; padding:2px 6px; border-radius:4px; font-weight:700">BLOQUÉ / SUSPENDU</span>
                      }
                      @if (user.isPaid) {
                        <span style="font-size:9px; background:#E6F4EA; color:#137333; padding:2px 6px; border-radius:4px; font-weight:700">💳 EN RÈGLE</span>
                      } @else {
                        <span style="font-size:9px; background:#FCE8E6; color:#C5221F; padding:2px 6px; border-radius:4px; font-weight:700">⚠️ IMPAYÉ</span>
                        @if (user.paymentRemindersActive) {
                          <span style="font-size:9px; background:#FEF7E0; color:#B06000; padding:2px 6px; border-radius:4px; font-weight:700; animation: pulse-live 2s infinite">🔔 RAPPELS</span>
                        }
                      }
                    </div>
                    @if (user.username && user.password) {
                      <div style="font-size:10px; color:var(--text-secondary); margin-top:4px; background:var(--surface-1); padding:4px 8px; border-radius:4px; display:inline-flex; align-items:center; gap:8px">
                        <span>Identifiant: <strong>{{ user.username }}</strong></span>
                        <span>Code: <strong>{{ user.password }}</strong></span>
                        <button (click)="copyCredentials(user)" style="background:none; border:none; cursor:pointer; font-size:11px; color:#4F46E5; padding:0" title="Copier les identifiants">📋</button>
                      </div>
                    }
                  </div>
                </div>

                <!-- Status selector & actions -->
                <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap">
                  <div>
                    <select [value]="user.status || 'approved'" (change)="updateUserStatus(user, $event)" style="font-size:11px; padding:4px 8px; border-radius:6px; border:1px solid var(--border); background:#FFF">
                      <option value="pending">⏳ En attente</option>
                      <option value="approved">✅ Validé</option>
                      <option value="rejected">❌ Refusé</option>
                      <option value="suspended">🚫 Suspendu</option>
                    </select>
                  </div>
                  
                  <!-- Payment status controls -->
                  <div style="display:flex; align-items:center; gap:8px; background:rgba(79,70,229,0.05); padding:4px 8px; border-radius:6px; border:1px solid rgba(79,70,229,0.15)">
                    <label style="display:flex; align-items:center; gap:4px; font-size:11px; font-weight:700; color:var(--text-primary); cursor:pointer">
                      <input type="checkbox" [checked]="user.isPaid ?? false" (change)="togglePaymentStatus(user)" style="cursor:pointer" />
                      <span>💳 En règle (Payé)</span>
                    </label>
                    
                    @if (!user.isPaid) {
                      <div style="width:1px; height:14px; background:rgba(79,70,229,0.2)"></div>
                      <label style="display:flex; align-items:center; gap:4px; font-size:11px; font-weight:700; color:#B45309; cursor:pointer" title="Activer les rappels de paiement">
                        <input type="checkbox" [checked]="user.paymentRemindersActive ?? false" (change)="togglePaymentReminders(user)" style="cursor:pointer" />
                        <span>🔔 Rappels</span>
                      </label>
                    }
                  </div>
                  
                  <div style="display:flex; gap:4px">
                    <button class="btn-s" (click)="resetPassword(user)" style="font-size:11px; padding:6px 10px">🔑 PIN</button>
                    <button class="btn-s" (click)="deleteUser(user)" style="font-size:11px; padding:6px 10px; background:#FEE2E2; border-color:#EF4444; color:#DC2626">Supprimer</button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- PANEL 3: STUDENTS MANAGEMENT -->
      @if (activePanel() === 'students') {
        <div class="card" style="animation: fadeIn 0.2s">
          <h3 class="st" style="font-size:15px; margin-bottom:16px; color:#10B981">Élèves (Students)</h3>
          
          <div style="display:flex; flex-direction:column; gap:8px">
            @for (user of students(); track user.id) {
              <div class="user-card">
                <div style="display:flex; align-items:center; gap:12px; flex:1">
                  <div class="avatar" style="width:40px; height:40px; font-size:14px; background:#E0F2FE; color:#0284C7">
                    {{ user.avatar }}
                  </div>
                  <div>
                    <div style="font-size:14px; font-weight:800; color:var(--text-primary); display:flex; align-items:center; gap:6px">
                      {{ user.name }} ({{ user.level }})
                      @if (user.blocked || user.status === 'suspended') {
                        <span style="font-size:9px; background:#FEE2E2; color:#EF4444; padding:2px 6px; border-radius:4px; font-weight:700">BLOQUÉ / SUSPENDU</span>
                      }
                      @if (user.isPaid) {
                        <span style="font-size:9px; background:#E6F4EA; color:#137333; padding:2px 6px; border-radius:4px; font-weight:700">💳 EN RÈGLE</span>
                      } @else {
                        <span style="font-size:9px; background:#FCE8E6; color:#C5221F; padding:2px 6px; border-radius:4px; font-weight:700">⚠️ IMPAYÉ</span>
                        @if (user.paymentRemindersActive) {
                          <span style="font-size:9px; background:#FEF7E0; color:#B06000; padding:2px 6px; border-radius:4px; font-weight:700; animation: pulse-live 2s infinite">🔔 RAPPELS</span>
                        }
                      }
                    </div>
                    @if (user.username && user.password) {
                      <div style="font-size:10px; color:var(--text-secondary); margin-top:4px; background:var(--surface-1); padding:4px 8px; border-radius:4px; display:inline-flex; align-items:center; gap:8px">
                        <span>Identifiant: <strong>{{ user.username }}</strong></span>
                        <span>Code: <strong>{{ user.password }}</strong></span>
                        <button (click)="copyCredentials(user)" style="background:none; border:none; cursor:pointer; font-size:11px; color:#4F46E5; padding:0" title="Copier les identifiants">📋</button>
                        <button (click)="copyLoginLink(user)" style="background:none; border:none; cursor:pointer; font-size:11px; color:#4F46E5; padding:0" title="Copier le lien direct">🔗</button>
                      </div>
                    }
                  </div>
                </div>

                <!-- Status selector & actions -->
                <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap">
                  <div>
                    <select [value]="user.status || 'approved'" (change)="updateUserStatus(user, $event)" style="font-size:11px; padding:4px 8px; border-radius:6px; border:1px solid var(--border); background:#FFF">
                      <option value="pending">⏳ En attente</option>
                      <option value="approved">✅ Validé</option>
                      <option value="rejected">❌ Refusé</option>
                      <option value="suspended">🚫 Suspendu</option>
                    </select>
                  </div>
                  
                  <!-- Payment status controls -->
                  <div style="display:flex; align-items:center; gap:8px; background:rgba(79,70,229,0.05); padding:4px 8px; border-radius:6px; border:1px solid rgba(79,70,229,0.15)">
                    <label style="display:flex; align-items:center; gap:4px; font-size:11px; font-weight:700; color:var(--text-primary); cursor:pointer">
                      <input type="checkbox" [checked]="user.isPaid ?? false" (change)="togglePaymentStatus(user)" style="cursor:pointer" />
                      <span>💳 En règle (Payé)</span>
                    </label>
                    
                    @if (!user.isPaid) {
                      <div style="width:1px; height:14px; background:rgba(79,70,229,0.2)"></div>
                      <label style="display:flex; align-items:center; gap:4px; font-size:11px; font-weight:700; color:#B45309; cursor:pointer" title="Activer les rappels de paiement">
                        <input type="checkbox" [checked]="user.paymentRemindersActive ?? false" (change)="togglePaymentReminders(user)" style="cursor:pointer" />
                        <span>🔔 Rappels</span>
                      </label>
                    }
                  </div>
                  
                  <div style="display:flex; gap:4px">
                    <button class="btn-s" (click)="resetPassword(user)" style="font-size:11px; padding:6px 10px">🔑 PIN</button>
                    <button class="btn-s" (click)="deleteUser(user)" style="font-size:11px; padding:6px 10px; background:#FEE2E2; border-color:#EF4444; color:#DC2626">Supprimer</button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- PANEL 4: GUESTS MANAGEMENT -->
      @if (activePanel() === 'guests') {
        <div class="card" style="animation: fadeIn 0.2s">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:16px; flex-wrap:wrap">
            <h3 class="st" style="font-size:15px; margin:0; color:#047857">Comptes Invités (Guests)</h3>
            <button class="btn-p" (click)="showAddGuestForm.set(!showAddGuestForm())" style="font-size:12px; padding:6px 14px; background:#10B981; border-color:#10B981; font-weight:700">
              ➕ Nouvel Invité
            </button>
          </div>

          <!-- Add Guest Form -->
          @if (showAddGuestForm()) {
            <div style="background:var(--surface-2); padding:16px; border-radius:10px; border:1px solid var(--border-weak); margin-bottom:20px; display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end">
              <div class="input-row" style="flex:2; min-width:180px; margin-bottom:0">
                <label style="font-size:11px; font-weight:700; color:var(--text-secondary); margin-bottom:4px; display:block">Nom de l'invité</label>
                <input [(ngModel)]="newGuestName" placeholder="Ex: Guest Alpha" class="form-input" style="height:38px; font-size:13px; background:#FFF" />
              </div>
              <button class="btn-p" [disabled]="!newGuestName" (click)="createGuest()" style="height:38px; padding:0 20px; font-weight:700; background:#10B981; border-color:#10B981">
                Générer l'accès
              </button>
            </div>
          }

          <div style="display:flex; flex-direction:column; gap:8px">
            @for (user of guests(); track user.id) {
              <div class="user-card">
                <div style="display:flex; align-items:center; gap:12px; flex:1">
                  <div class="avatar" style="width:40px; height:40px; font-size:14px; background:#E6F4EA; color:#137333">
                    {{ user.avatar }}
                  </div>
                  <div>
                    <div style="font-size:14px; font-weight:800; color:var(--text-primary)">
                      {{ user.name }}
                    </div>
                    @if (user.username && user.password) {
                      <div style="font-size:10px; color:var(--text-secondary); margin-top:4px; background:var(--surface-1); padding:4px 8px; border-radius:4px; display:inline-flex; align-items:center; gap:8px">
                        <span>Identifiant: <strong>{{ user.username }}</strong></span>
                        <span>Code: <strong>{{ user.password }}</strong></span>
                        <button (click)="copyCredentials(user)" style="background:none; border:none; cursor:pointer; font-size:11px; color:#4F46E5; padding:0" title="Copier les identifiants">📋</button>
                      </div>
                    }
                  </div>
                </div>

                <div style="display:flex; gap:6px">
                  <button class="btn-s" (click)="deleteUser(user)" style="font-size:11px; padding:6px 12px; background:#FEE2E2; border-color:#EF4444; color:#DC2626; font-weight:700">
                    Supprimer
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- PANEL 5: ADMINS MANAGEMENT -->
      @if (activePanel() === 'admins') {
        <div class="card" style="animation: fadeIn 0.2s">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:16px; flex-wrap:wrap">
            <h3 class="st" style="font-size:15px; margin:0; color:#E11D48">Administrateurs</h3>
            <button class="btn-p" (click)="showAddAdminForm.set(!showAddAdminForm())" style="font-size:12px; padding:6px 14px; background:#E11D48; border-color:#E11D48; font-weight:700">
              ➕ Nouvel Admin
            </button>
          </div>

          <!-- Add Admin Form -->
          @if (showAddAdminForm()) {
            <div style="background:var(--surface-2); padding:16px; border-radius:10px; border:1px solid var(--border-weak); margin-bottom:20px; display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end">
              <div class="input-row" style="flex:2; min-width:180px; margin-bottom:0">
                <label style="font-size:11px; font-weight:700; color:var(--text-secondary); margin-bottom:4px; display:block">Nom complet</label>
                <input [(ngModel)]="newAdminName" placeholder="Ex: Admin Secrétaire" class="form-input" style="height:38px; font-size:13px; background:#FFF" />
              </div>
              <div class="input-row" style="flex:1; min-width:140px; margin-bottom:0">
                <label style="font-size:11px; font-weight:700; color:var(--text-secondary); margin-bottom:4px; display:block">Username (Optionnel)</label>
                <input [(ngModel)]="newAdminUsername" placeholder="Auto-généré si vide" class="form-input" style="height:38px; font-size:13px; background:#FFF" />
              </div>
              <div class="input-row" style="flex:1; min-width:140px; margin-bottom:0">
                <label style="font-size:11px; font-weight:700; color:var(--text-secondary); margin-bottom:4px; display:block">PIN Code (Optionnel)</label>
                <input [(ngModel)]="newAdminPassword" placeholder="Auto-généré si vide" class="form-input" style="height:38px; font-size:13px; background:#FFF" />
              </div>
              <button class="btn-p" [disabled]="!newAdminName" (click)="createAdmin()" style="height:38px; padding:0 20px; font-weight:700; background:#E11D48; border-color:#E11D48">
                Enregistrer
              </button>
            </div>
          }

          <div style="display:flex; flex-direction:column; gap:8px">
            @for (user of admins(); track user.id) {
              <div class="user-card">
                <div style="display:flex; align-items:center; gap:12px; flex:1">
                  <div class="avatar" style="width:40px; height:40px; font-size:14px; background:#FFF1F2; color:#E11D48">
                    {{ user.avatar }}
                  </div>
                  <div>
                    <div style="font-size:14px; font-weight:800; color:var(--text-primary)">
                      {{ user.name }}
                    </div>
                    @if (user.username && user.password) {
                      <div style="font-size:10px; color:var(--text-secondary); margin-top:4px; background:var(--surface-1); padding:4px 8px; border-radius:4px; display:inline-flex; align-items:center; gap:8px">
                        <span>Identifiant: <strong>{{ user.username }}</strong></span>
                        <span>Code: <strong>{{ user.password }}</strong></span>
                        <button (click)="copyCredentials(user)" style="background:none; border:none; cursor:pointer; font-size:11px; color:#4F46E5; padding:0" title="Copier les identifiants">📋</button>
                      </div>
                    }
                  </div>
                </div>

                <div style="display:flex; gap:6px">
                  @if (user.id !== 'admin') {
                    <button class="btn-s" (click)="deleteUser(user)" style="font-size:11px; padding:6px 12px; background:#FEE2E2; border-color:#EF4444; color:#DC2626; font-weight:700">
                      Supprimer
                    </button>
                  } @else {
                    <span style="font-size:11px; color:var(--text-muted); font-weight:700; padding:6px 12px">Admin Racine</span>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .grid5 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }
    .mcard {
      padding: 16px;
      border-radius: 12px;
      transition: all 0.2s ease-in-out;
    }
    .mcard:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }
    .mcard.active-tab {
      border-color: #4F46E5 !important;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
      transform: translateY(-2px);
    }
    .mlabel { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .mval { font-size: 28px; font-weight: 800; margin: 6px 0; display: flex; align-items: center; }
    .msub { font-size: 11px; font-weight: 500; }
    .user-card {
      display: flex; align-items: center; gap: 12px; padding: 12px 16px;
      background: var(--surface-1); border: 1px solid var(--border-weak); border-radius: 8px;
      flex-wrap: wrap; justify-content: space-between;
    }
    .pulse-badge {
      display: inline-block;
      width: 14px;
      height: 14px;
      background: #EF4444;
      color: white;
      font-size: 10px;
      font-weight: 700;
      border-radius: 50%;
      text-align: center;
      line-height: 14px;
      margin-left: 6px;
      animation: pulse-warn 1.5s infinite;
      vertical-align: middle;
    }
    @keyframes pulse-warn {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { transform: scale(1.15); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
  `]
})
export class AdminManagementComponent {
  public db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  activePanel = signal<'requests' | 'teachers' | 'students' | 'guests' | 'admins'>('requests');

  allUsers = signal<UserProfile[]>([]);

  // Show Forms triggers
  showAddTeacherForm = signal<boolean>(false);
  showAddGuestForm = signal<boolean>(false);
  showAddAdminForm = signal<boolean>(false);

  // Form Inputs
  newTeacherName = '';
  newTeacherUsername = '';
  newTeacherPassword = '';

  newGuestName = '';

  newAdminName = '';
  newAdminUsername = '';
  newAdminPassword = '';

  constructor() {
    this.db.observeUsers().subscribe(users => this.allUsers.set(users));
  }

  admins = computed(() => this.allUsers().filter(u => u.role === 'admin'));
  teachers = computed(() => this.allUsers().filter(u => u.role === 'teacher' && u.status !== 'pending'));
  students = computed(() => this.allUsers().filter(u => u.role === 'student' && u.status !== 'pending'));
  guests = computed(() => this.allUsers().filter(u => u.role === 'guest'));

  pendingRequests = computed(() => {
    return this.allUsers().filter(u => u.status === 'pending');
  });

  approveRequest(user: UserProfile) {
    this.db.updateUserProfile(user.id, { status: 'approved' }).then(() => {
      this.db.sendNotification({
        recipientId: user.id,
        title: "Compte Validé 🎉",
        message: "Votre compte a été approuvé par l'administrateur ! Vous avez maintenant un accès complet aux groupes.",
        type: 'reminder'
      });
      this.dialogService.alert(
        'Inscription Approuvée 🎉',
        `Le compte de ${user.name} a été approuvé avec succès.`,
        'success'
      );
    });
  }

  rejectRequest(user: UserProfile) {
    this.dialogService.show({
      title: "Rejeter l'inscription",
      message: `Voulez-vous rejeter l'inscription de ${user.name} ? Son compte sera marqué comme refusé.`,
      type: 'confirm',
      confirmText: 'Rejeter',
      cancelText: 'Annuler',
      onConfirm: () => {
        this.db.updateUserProfile(user.id, { status: 'rejected' }).then(() => {
          this.dialogService.alert('Rejeté', 'La demande d\'inscription a été rejetée.', 'info');
        });
      }
    });
  }

  updateUserStatus(user: UserProfile, event: any) {
    const status = event.target.value;
    this.db.updateUserProfile(user.id, { status }).then(() => {
      this.dialogService.alert('Statut mis à jour', `Le statut de ${user.name} a été changé en : ${status}`, 'success');
      this.db.sendNotification({
        recipientId: user.id,
        title: "Mise à jour du compte",
        message: `Le statut de votre compte a été changé en : ${status}.`,
        type: 'reminder'
      });
    });
  }

  togglePaymentStatus(user: UserProfile) {
    const nextVal = !user.isPaid;
    const updates: Partial<UserProfile> = { isPaid: nextVal };
    if (nextVal) {
      updates.paymentRemindersActive = false;
    }
    this.db.updateUserProfile(user.id, updates).then(() => {
      this.dialogService.alert('Paiement mis à jour', `${user.name} est maintenant ${nextVal ? 'en règle (payé)' : 'non réglé'}.`, 'success');
    });
  }

  togglePaymentReminders(user: UserProfile) {
    const nextVal = !user.paymentRemindersActive;
    this.db.updateUserProfile(user.id, { paymentRemindersActive: nextVal }).then(() => {
      this.dialogService.alert('Rappels mis à jour', `Les rappels de paiement sont maintenant ${nextVal ? 'activés' : 'désactivés'} pour ${user.name}.`, 'success');
    });
  }

  createTeacher() {
    if (!this.newTeacherName.trim()) return;

    this.db.addTeacher(this.newTeacherName, this.newTeacherUsername, this.newTeacherPassword).then(newUser => {
      if (newUser) {
        this.dialogService.alert(
          'Professeur Créé',
          `Compte créé avec succès !\nIdentifiant: ${newUser.username}\nCode d'accès: ${newUser.password}`,
          'success'
        );
        this.newTeacherName = '';
        this.newTeacherUsername = '';
        this.newTeacherPassword = '';
        this.showAddTeacherForm.set(false);
      } else {
        this.dialogService.alert('Erreur', 'Ce nom d\'utilisateur est déjà pris.', 'info');
      }
    });
  }

  createGuest() {
    if (!this.newGuestName.trim()) return;

    this.db.addStudent(this.newGuestName, 'Guest', '🇸🇳', 0, 0).then(newUser => {
      if (newUser) {
        this.dialogService.alert(
          'Compte Invité Créé',
          `Compte généré !\nIdentifiant: ${newUser.username}\nCode d'accès: ${newUser.password}`,
          'success'
        );
        this.newGuestName = '';
        this.showAddGuestForm.set(false);
      }
    });
  }

  createAdmin() {
    if (!this.newAdminName.trim()) return;

    this.db.addAdmin(this.newAdminName, this.newAdminUsername, this.newAdminPassword).then(newUser => {
      if (newUser) {
        this.dialogService.alert(
          'Administrateur Créé',
          `Compte créé avec succès !\nIdentifiant: ${newUser.username}\nCode d'accès: ${newUser.password}`,
          'success'
        );
        this.newAdminName = '';
        this.newAdminUsername = '';
        this.newAdminPassword = '';
        this.showAddAdminForm.set(false);
      } else {
        this.dialogService.alert('Erreur', 'Ce nom d\'utilisateur est déjà pris.', 'info');
      }
    });
  }

  copyCredentials(user: UserProfile) {
    const text = `Identifiants SpeakUp pour ${user.name} (${user.role}) :\nIdentifiant : ${user.username}\nCode d'accès : ${user.password}\nLien : ${window.location.origin}/#/guest-login`;
    navigator.clipboard.writeText(text).then(() => {
      this.dialogService.alert('Copié !', 'Les identifiants ont été copiés dans le presse-papiers.', 'success');
    });
  }

  copyLoginLink(user: UserProfile) {
    const link = `${window.location.origin}/#/guest-login?u=${encodeURIComponent(user.username || '')}&p=${encodeURIComponent(user.password || '')}`;
    navigator.clipboard.writeText(link).then(() => {
      this.dialogService.alert('Lien Copié !', 'Le lien d\'accès direct a été copié.', 'success');
    });
  }

  resetPassword(user: UserProfile) {
    const newPassword = Math.floor(1000 + Math.random() * 9000).toString();
    this.dialogService.show({
      title: 'Nouveau Code d\'Accès',
      message: `Générer un nouveau code d'accès pour ${user.name} ? L'ancien code sera révoqué.`,
      type: 'confirm',
      confirmText: 'Générer',
      cancelText: 'Annuler',
      onConfirm: () => {
        this.db.updateUserProfile(user.id, { password: newPassword }).then(() => {
          this.dialogService.alert('Code mis à jour', `Nouveau code : ${newPassword}`, 'success');
        });
      }
    });
  }

  deleteUser(user: UserProfile) {
    this.dialogService.show({
      title: 'Supprimer l\'utilisateur',
      message: `Voulez-vous supprimer définitivement le compte de ${user.name} ? Cette action est irréversible.`,
      type: 'confirm',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      onConfirm: () => {
        this.db.deleteUser(user.id).then(() => {
          this.dialogService.alert('Supprimé', 'L\'utilisateur a été supprimé.', 'success');
        });
      }
    });
  }

  toggleAutoApproveStudents(event: any) {
    const enabled = event.target.checked;
    this.db.setAutoApproveStudents(enabled).then(() => {
      this.dialogService.alert(
        'Étudiants : Inscription Directe',
        enabled 
          ? 'Validation directe activée pour les étudiants !'
          : 'Validation directe désactivée pour les étudiants.',
        'success'
      );
    });
  }

  toggleAutoApproveTeachers(event: any) {
    const enabled = event.target.checked;
    this.db.setAutoApproveTeachers(enabled).then(() => {
      this.dialogService.alert(
        'Professeurs : Inscription Directe',
        enabled 
          ? 'Validation directe activée pour les professeurs !'
          : 'Validation directe désactivée pour les professeurs.',
        'success'
      );
    });
  }
}
