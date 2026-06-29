import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, UserProfile, RegistrationRequest } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="animation: fadeIn 0.25s">
      <!-- Top header stats dashboard -->
      <div class="grid4" style="margin-bottom: 20px">
        <div class="mcard" style="background:#EEF2FF; border:1px solid #C7D2FE; cursor:pointer" [class.active-tab]="activePanel() === 'requests'" (click)="activePanel.set('requests')">
          <div class="mlabel" style="color:#4338CA">Demandes d'inscription</div>
          <div class="mval" style="color:#4F46E5">
            {{ pendingRequests().length }}
            @if (pendingRequests().length > 0) {
              <span class="pulse-badge">!</span>
            }
          </div>
          <div class="msub" style="color:#4338CA">Élèves & Professeurs en attente</div>
        </div>
        <div class="mcard" style="background:#FAF5FF; border:1px solid #E9D5FF; cursor:pointer" [class.active-tab]="activePanel() === 'teachers'" (click)="activePanel.set('teachers')">
          <div class="mlabel" style="color:#7C3AED">Corps Enseignant</div>
          <div class="mval" style="color:#9333EA">{{ teachers().length }}</div>
          <div class="msub" style="color:#7C3AED">Gérer les professeurs</div>
        </div>
        <div class="mcard" style="background:#ECFDF5; border:1px solid #A7F3D0; cursor:pointer" [class.active-tab]="activePanel() === 'guests'" (click)="activePanel.set('guests')">
          <div class="mlabel" style="color:#047857">Invités (Guests)</div>
          <div class="mval" style="color:#10B981">{{ guests().length }}</div>
          <div class="msub" style="color:#047857">Gérer les comptes temporaires</div>
        </div>
        <div class="mcard" style="background:#FFF1F2; border:1px solid #FECDD3; cursor:pointer" [class.active-tab]="activePanel() === 'admins'" (click)="activePanel.set('admins')">
          <div class="mlabel" style="color:#E11D48">Administrateurs</div>
          <div class="mval" style="color:#BE123C">{{ admins().length }}</div>
          <div class="msub" style="color:#E11D48">Gérer la sécurité système</div>
        </div>
      </div>

      <!-- Tab selection sub-header -->
      <div style="display:flex; gap:8px; border-bottom:1px solid var(--border-weak); padding-bottom:10px; margin-bottom: 20px">
        <button class="btn-s" [class.active]="activePanel() === 'requests'" (click)="activePanel.set('requests')" style="font-weight:700; font-size:12px; padding:6px 14px">
          📝 Demandes en attente
          @if (pendingRequests().length > 0) {
            <span style="background:#EF4444; color:white; font-size:9px; font-weight:700; padding:1px 6px; border-radius:10px; margin-left:4px">{{ pendingRequests().length }}</span>
          }
        </button>
        <button class="btn-s" [class.active]="activePanel() === 'teachers'" (click)="activePanel.set('teachers')" style="font-weight:700; font-size:12px; padding:6px 14px">
          🎓 Gérer les Professeurs
        </button>
        <button class="btn-s" [class.active]="activePanel() === 'guests'" (click)="activePanel.set('guests')" style="font-weight:700; font-size:12px; padding:6px 14px">
          🔑 Gérer les Invités
        </button>
        <button class="btn-s" [class.active]="activePanel() === 'admins'" (click)="activePanel.set('admins')" style="font-weight:700; font-size:12px; padding:6px 14px">
          🛡️ Gérer les Admins
        </button>
      </div>

      <!-- PANEL 1: PENDING REGISTRATION REQUESTS -->
      @if (activePanel() === 'requests') {
        <div class="card" style="animation: fadeIn 0.2s">
          <h3 class="st" style="font-size:15px; margin-bottom:12px; color:#4F46E5">Demandes d'inscription reçues</h3>
          <p style="font-size:12px; color:var(--text-secondary); margin-bottom:16px">
            Validez ou rejetez les demandes de création de compte pour les étudiants et professeurs. Les comptes approuvés obtiendront automatiquement leurs identifiants de connexion.
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
                      @if (req.level === 'Teacher') {
                        <span style="font-size:9px; background:#F3E8FF; color:#7C3AED; padding:2px 6px; border-radius:4px; font-weight:700">PROFESSEUR</span>
                      } @else if (req.level === 'Guest') {
                        <span style="font-size:9px; background:#FEF3C7; color:#D97706; padding:2px 6px; border-radius:4px; font-weight:700">INVITÉ</span>
                      } @else {
                        <span style="font-size:9px; background:#E0E7FF; color:#4F46E5; padding:2px 6px; border-radius:4px; font-weight:700">ÉLÈVE ({{ req.level }})</span>
                      }
                    </div>
                    <div style="font-size:11px; color:var(--text-muted); margin-top:2px">
                      Demandé le {{ req.requestedAt }} · Pays: {{ req.countryFlag }}
                    </div>
                  </div>

                  <div style="display:flex; gap:8px">
                    <button class="btn-p" (click)="approveRequest(req)" style="font-size:11px; padding:6px 14px; background:#10B981; border-color:#10B981; font-weight:700">
                      Approuver ✅
                    </button>
                    <button class="btn-s" (click)="rejectRequest(req.id)" style="font-size:11px; padding:6px 14px; background:#FEE2E2; border-color:#EF4444; color:#DC2626; font-weight:700">
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
              <div style="display:flex; align-items:center; gap:12px; padding:12px; background:var(--surface-2); border:1px solid var(--border-weak); border-radius:8px; flex-wrap:wrap; justify-content:space-between">
                <div style="display:flex; align-items:center; gap:12px">
                  <div class="avatar" style="width:40px; height:40px; font-size:14px; background:#F3E8FF; color:#7C3AED">
                    {{ user.avatar }}
                  </div>
                  <div>
                    <div style="font-size:14px; font-weight:800; color:var(--text-primary); display:flex; align-items:center; gap:6px">
                      {{ user.name }}
                      @if (user.blocked) {
                        <span style="font-size:9px; background:#FEE2E2; color:#EF4444; padding:2px 6px; border-radius:4px; font-weight:700">BLOQUÉ</span>
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

                <div style="display:flex; gap:6px">
                  @if (user.blocked) {
                    <button class="btn-s" (click)="toggleBlock(user)" style="font-size:11px; padding:6px 12px; background:#D1FAE5; border-color:#10B981; color:#065F46; font-weight:700">
                      Débloquer
                    </button>
                  } @else {
                    <button class="btn-s" (click)="toggleBlock(user)" style="font-size:11px; padding:6px 12px; background:#FEE2E2; border-color:#EF4444; color:#DC2626; font-weight:700">
                      Bloquer
                    </button>
                  }
                  <button class="btn-s" (click)="resetPassword(user)" style="font-size:11px; padding:6px 12px">
                    Nouveau Code
                  </button>
                  <button class="btn-s" (click)="deleteUser(user)" style="font-size:11px; padding:6px 12px; background:#FEE2E2; border-color:#EF4444; color:#DC2626; font-weight:700">
                    Supprimer
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- PANEL 3: GUESTS MANAGEMENT -->
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
                <input [(ngModel)]="newGuestName" placeholder="Ex: Paul Sarr" class="form-input" style="height:38px; font-size:13px; background:#FFF" />
              </div>
              <div class="input-row" style="flex:1; min-width:140px; margin-bottom:0">
                <label style="font-size:11px; font-weight:700; color:var(--text-secondary); margin-bottom:4px; display:block">Niveau estimé</label>
                <select [(ngModel)]="newGuestLevel" class="form-select" style="height:38px; font-size:13px; background:#FFF">
                  <option value="Beginner">Débutant (Beginner)</option>
                  <option value="Intermediate">Intermédiaire (Intermediate)</option>
                  <option value="Advanced">Avancé (Advanced)</option>
                </select>
              </div>
              <button class="btn-p" [disabled]="!newGuestName" (click)="createGuest()" style="height:38px; padding:0 20px; font-weight:700; background:#10B981; border-color:#10B981">
                Générer
              </button>
            </div>
          }

          <div style="display:flex; flex-direction:column; gap:8px">
            @for (user of guests(); track user.id) {
              <div style="display:flex; align-items:center; gap:12px; padding:12px; background:var(--surface-2); border:1px solid var(--border-weak); border-radius:8px; flex-wrap:wrap; justify-content:space-between">
                <div style="display:flex; align-items:center; gap:12px">
                  <div class="avatar" style="width:40px; height:40px; font-size:14px; background:#E6F4EA; color:#137333">
                    {{ user.avatar }}
                  </div>
                  <div>
                    <div style="font-size:14px; font-weight:800; color:var(--text-primary); display:flex; align-items:center; gap:6px">
                      {{ user.name }}
                      @if (user.blocked) {
                        <span style="font-size:9px; background:#FEE2E2; color:#EF4444; padding:2px 6px; border-radius:4px; font-weight:700">BLOQUÉ</span>
                      }
                    </div>
                    @if (user.username && user.password) {
                      <div style="font-size:10px; color:var(--text-secondary); margin-top:4px; background:var(--surface-1); padding:4px 8px; border-radius:4px; display:inline-flex; align-items:center; gap:8px">
                        <span>Identifiant: <strong>{{ user.username }}</strong></span>
                        <span>Code: <strong>{{ user.password }}</strong></span>
                        <button (click)="copyCredentials(user)" style="background:none; border:none; cursor:pointer; font-size:11px; color:#4F46E5; padding:0" title="Copier les identifiants">📋</button>
                        <button (click)="copyLoginLink(user)" style="background:none; border:none; cursor:pointer; font-size:11px; color:#4F46E5; padding:0" title="Copier le lien d'accès direct">🔗</button>
                      </div>
                    }
                  </div>
                </div>

                <div style="display:flex; gap:6px">
                  @if (user.blocked) {
                    <button class="btn-s" (click)="toggleBlock(user)" style="font-size:11px; padding:6px 12px; background:#D1FAE5; border-color:#10B981; color:#065F46; font-weight:700">
                      Débloquer
                    </button>
                  } @else {
                    <button class="btn-s" (click)="toggleBlock(user)" style="font-size:11px; padding:6px 12px; background:#FEE2E2; border-color:#EF4444; color:#DC2626; font-weight:700">
                      Bloquer
                    </button>
                  }
                  <button class="btn-s" (click)="resetPassword(user)" style="font-size:11px; padding:6px 12px">
                    Nouveau Code
                  </button>
                  <button class="btn-s" (click)="deleteUser(user)" style="font-size:11px; padding:6px 12px; background:#FEE2E2; border-color:#EF4444; color:#DC2626; font-weight:700">
                    Supprimer
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- PANEL 4: ADMINS MANAGEMENT -->
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
              <div style="display:flex; align-items:center; gap:12px; padding:12px; background:var(--surface-2); border:1px solid var(--border-weak); border-radius:8px; flex-wrap:wrap; justify-content:space-between">
                <div style="display:flex; align-items:center; gap:12px">
                  <div class="avatar" style="width:40px; height:40px; font-size:14px; background:#FFF1F2; color:#E11D48">
                    {{ user.avatar }}
                  </div>
                  <div>
                    <div style="font-size:14px; font-weight:800; color:var(--text-primary); display:flex; align-items:center; gap:6px">
                      {{ user.name }}
                      @if (user.blocked) {
                        <span style="font-size:9px; background:#FEE2E2; color:#EF4444; padding:2px 6px; border-radius:4px; font-weight:700">BLOQUÉ</span>
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

                <div style="display:flex; gap:6px">
                  @if (user.id !== 'admin') {
                    @if (user.blocked) {
                      <button class="btn-s" (click)="toggleBlock(user)" style="font-size:11px; padding:6px 12px; background:#D1FAE5; border-color:#10B981; color:#065F46; font-weight:700">
                        Débloquer
                      </button>
                    } @else {
                      <button class="btn-s" (click)="toggleBlock(user)" style="font-size:11px; padding:6px 12px; background:#FEE2E2; border-color:#EF4444; color:#DC2626; font-weight:700">
                        Bloquer
                      </button>
                    }
                    <button class="btn-s" (click)="resetPassword(user)" style="font-size:11px; padding:6px 12px">
                      Nouveau Code
                    </button>
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
    .grid4 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }
    .mcard.active-tab {
      border-color: #4F46E5 !important;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15);
      transform: translateY(-2px);
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
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  activePanel = signal<'requests' | 'teachers' | 'guests' | 'admins'>('requests');

  allUsers = signal<UserProfile[]>([]);
  registrationRequests = signal<RegistrationRequest[]>([]);

  // Show Forms triggers
  showAddTeacherForm = signal<boolean>(false);
  showAddGuestForm = signal<boolean>(false);
  showAddAdminForm = signal<boolean>(false);

  // Form Inputs
  newTeacherName = '';
  newTeacherUsername = '';
  newTeacherPassword = '';

  newGuestName = '';
  newGuestLevel = 'Beginner';

  newAdminName = '';
  newAdminUsername = '';
  newAdminPassword = '';

  constructor() {
    this.db.observeUsers().subscribe(users => this.allUsers.set(users));
    this.db.observeRegistrationRequests().subscribe(reqs => this.registrationRequests.set(reqs));
  }

  admins = computed(() => this.allUsers().filter(u => u.role === 'admin'));
  teachers = computed(() => this.allUsers().filter(u => u.role === 'teacher'));
  guests = computed(() => this.allUsers().filter(u => u.role === 'guest'));

  pendingRequests = computed(() => {
    return this.registrationRequests().filter(r => r.status === 'pending');
  });

  approveRequest(req: RegistrationRequest) {
    this.db.approveRegistrationRequest(req.id).then((newUser) => {
      if (newUser) {
        this.dialogService.alert(
          'Inscription Approuvée 🎉',
          `Le compte pour ${newUser.name} a été créé.\nIdentifiant: ${newUser.username}\nCode d'accès (PIN): ${newUser.password}`,
          'success'
        );
      }
    });
  }

  rejectRequest(requestId: string) {
    this.db.rejectRegistrationRequest(requestId).then(() => {
      this.dialogService.alert('Rejeté', 'La demande d\'inscription a été rejetée.', 'info');
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
        this.newGuestLevel = 'Beginner';
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

  toggleBlock(user: UserProfile) {
    const newBlockedState = !user.blocked;
    this.dialogService.show({
      title: newBlockedState ? 'Bloquer l\'accès' : 'Débloquer l\'accès',
      message: `Voulez-vous vraiment ${newBlockedState ? 'bloquer' : 'débloquer'} l'accès de ${user.name} ?`,
      type: 'confirm',
      confirmText: newBlockedState ? 'Bloquer' : 'Débloquer',
      cancelText: 'Annuler',
      onConfirm: () => {
        this.db.updateUserProfile(user.id, { blocked: newBlockedState }).then(() => {
          this.dialogService.alert('Succès', `${user.name} a été ${newBlockedState ? 'bloqué' : 'débloqué'}.`, 'success');
        });
      }
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
}
