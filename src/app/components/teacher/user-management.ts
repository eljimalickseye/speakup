import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, UserProfile, AbuseReport } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

interface GuestCredentials {
  username: string;
  password: string;
  userId: string;
}

@Component({
  selector: 'app-teacher-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="animation: fadeIn 0.25s">
      <!-- Top header stats dashboard -->
      <div class="grid4">
        <div class="mcard" style="background:#EEF2FF; border:1px solid #C7D2FE; cursor:pointer" [class.active-tab]="activePanel() === 'users'" (click)="activePanel.set('users')">
          <div class="mlabel" style="color:#4338CA">Utilisateurs Totaux</div>
          <div class="mval" style="color:#4F46E5">{{ allUsers().length }}</div>
          <div class="msub" style="color:#4338CA">Voir la liste complète</div>
        </div>
        <div class="mcard" style="background:#FAF5FF; border:1px solid #E9D5FF; cursor:pointer" [class.active-tab]="activePanel() === 'guests'" (click)="activePanel.set('guests')">
          <div class="mlabel" style="color:#7C3AED">Générateur Invités (Guests)</div>
          <div class="mval" style="color:#9333EA">{{ guests().length }}</div>
          <div class="msub" style="color:#7C3AED">Créer des accès temporaires</div>
        </div>
        <div class="mcard" style="background:#FFF1F2; border:1px solid #FECDD3; cursor:pointer" [class.active-tab]="activePanel() === 'reports'" (click)="activePanel.set('reports')">
          <div class="mlabel" style="color:#E11D48">Signalements d'Abus</div>
          <div class="mval" style="color:#BE123C">
            {{ pendingReportsCount() }}
            @if (pendingReportsCount() > 0) {
              <span class="pulse-badge">!</span>
            }
          </div>
          <div class="msub" style="color:#E11D48">Modérer les signalements</div>
        </div>
        <div class="mcard" style="background:#FFFBEB; border:1px solid #FDE68A">
          <div class="mlabel" style="color:#D97706">Membres Bloqués</div>
          <div class="mval" style="color:#B45309">{{ blockedUsers().length }}</div>
          <div class="msub" style="color:#D97706">Accès révoqués</div>
        </div>
      </div>

      <!-- Tab selection sub-header -->
      <div style="display:flex; gap:8px; margin-top:20px; border-bottom:1px solid var(--border-weak); padding-bottom:10px">
        <button class="btn-s" [class.active]="activePanel() === 'users'" (click)="activePanel.set('users')" style="font-weight:700; font-size:12px; padding:6px 14px">
          👥 Utilisateurs & Modération
        </button>
        <button class="btn-s" [class.active]="activePanel() === 'guests'" (click)="activePanel.set('guests')" style="font-weight:700; font-size:12px; padding:6px 14px">
          🔑 Générateur d'identifiants
        </button>
        <button class="btn-s" [class.active]="activePanel() === 'reports'" (click)="activePanel.set('reports')" style="font-weight:700; font-size:12px; padding:6px 14px; position:relative">
          ⚠️ Signalements reçus
          @if (pendingReportsCount() > 0) {
            <span style="background:#EF4444; color:white; font-size:9px; font-weight:700; padding:1px 6px; border-radius:10px; margin-left:4px">{{ pendingReportsCount() }}</span>
          }
        </button>
      </div>

      <!-- PANEL 1: USERS LIST & BLOCKING -->
      @if (activePanel() === 'users') {
        <div class="card" style="margin-top:20px; animation: fadeIn 0.2s">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:14px; flex-wrap:wrap">
            <h3 class="st" style="font-size:15px; margin:0; color:#4F46E5">Liste des Utilisateurs</h3>
            <div style="display:flex; gap:8px">
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                placeholder="Rechercher par nom..." 
                class="form-input" 
                style="width:200px; height:34px; font-size:12px; border:1px solid var(--border-weak); border-radius:6px; padding:0 10px" 
              />
              <select [(ngModel)]="filterRole" class="form-select" style="height:34px; font-size:12px; border:1px solid var(--border-weak); border-radius:6px; padding:0 10px">
                <option value="All">Tous les rôles</option>
                <option value="student">Étudiants</option>
                <option value="teacher">Professeurs</option>
                <option value="guest">Invités</option>
              </select>
            </div>
          </div>

          @if (filteredUsers().length === 0) {
            <div style="text-align:center; padding:32px; color:var(--text-muted); font-size:13px">
              Aucun utilisateur trouvé
            </div>
          } @else {
            <div style="display:flex; flex-direction:column; gap:8px">
              @for (user of filteredUsers(); track user.id) {
                <div style="display:flex; align-items:center; gap:12px; padding:12px; background:var(--surface-2); border:1px solid var(--border-weak); border-radius:8px; flex-wrap:wrap; justify-content:space-between">
                  <div style="display:flex; align-items:center; gap:12px">
                    <div class="avatar" style="width:40px; height:40px; font-size:14px; background:#EEF2FF; color:#4F46E5">
                      {{ user.avatar }}
                    </div>
                    <div>
                      <div style="font-size:14px; font-weight:800; color:var(--text-primary); display:flex; align-items:center; gap:6px">
                        {{ user.name }}
                        @if (user.role === 'guest') {
                          <span style="font-size:9px; background:#FEF3C7; color:#D97706; padding:2px 6px; border-radius:4px; font-weight:700">INVITÉ</span>
                        }
                        @if (user.blocked) {
                          <span style="font-size:9px; background:#FEE2E2; color:#EF4444; padding:2px 6px; border-radius:4px; font-weight:700">BLOQUÉ</span>
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
                      <div style="font-size:11px; color:var(--text-muted); margin-top:2px">
                        {{ user.level }} · {{ user.role | titlecase }}
                      </div>
                      @if (user.username && user.password) {
                        <div style="font-size:10px; color:var(--text-secondary); margin-top:4px; background:var(--surface-1); padding:4px 8px; border-radius:4px; display:inline-flex; align-items:center; gap:8px">
                          <span>Identifiant: <strong>{{ user.username }}</strong></span>
                          <span>Code: <strong>{{ user.password }}</strong></span>
                          <button (click)="copyLoginCredentials(user)" style="background:none; border:none; cursor:pointer; font-size:11px; color:#4F46E5; padding:0" title="Copier les identifiants">📋</button>
                          <button (click)="copyLoginLink(user)" style="background:none; border:none; cursor:pointer; font-size:11px; color:#4F46E5; padding:0" title="Copier le lien direct">🔗</button>
                        </div>
                      }
                    </div>
                  </div>

                  <div style="display:flex; gap:6px; align-items:center">
                    @if (user.role === 'student' || user.role === 'guest') {
                      <select [value]="user.level || 'B1'" 
                              (change)="changeUserGroup(user.id, $any($event.target).value)" 
                              class="form-select" 
                              style="font-size:11px; height:30px; padding:2px 8px; border-radius:6px; border:1px solid var(--border-weak); background:#FFF; color:var(--text-primary); cursor:pointer">
                        <option value="A1">Groupe A1 (Beginner)</option>
                        <option value="A2">Groupe A2 (Elementary)</option>
                        <option value="B1">Groupe B1 (Intermediate)</option>
                        <option value="B2">Groupe B2 (Upper Int.)</option>
                        <option value="C1">Groupe C1 (Advanced)</option>
                      </select>
                    }

                    <!-- Payment status controls -->
                    @if (user.role === 'student' || user.role === 'guest') {
                      <div style="display:flex; align-items:center; gap:8px; background:rgba(79,70,229,0.05); padding:4px 8px; border-radius:6px; border:1px solid rgba(79,70,229,0.15); height:30px">
                        <label style="display:flex; align-items:center; gap:4px; font-size:11px; font-weight:700; color:var(--text-primary); cursor:pointer; margin:0">
                          <input type="checkbox" [checked]="user.isPaid ?? false" (change)="togglePaymentStatus(user)" style="cursor:pointer" />
                          <span>💳 Payé</span>
                        </label>
                        
                        @if (!user.isPaid) {
                          <div style="width:1px; height:14px; background:rgba(79,70,229,0.2)"></div>
                          <label style="display:flex; align-items:center; gap:4px; font-size:11px; font-weight:700; color:#B45309; cursor:pointer; margin:0" title="Activer les rappels de paiement">
                            <input type="checkbox" [checked]="user.paymentRemindersActive ?? false" (change)="togglePaymentReminders(user)" style="cursor:pointer" />
                            <span>🔔 Rappels</span>
                          </label>
                        }
                      </div>
                    }

                    @if (user.role === 'guest' || user.role === 'student') {
                      @if (user.blocked) {
                        <button class="btn-s" (click)="toggleBlock(user)" style="font-size:11px; padding:6px 12px; background:#D1FAE5; border-color:#10B981; color:#065F46; font-weight:700">
                          Débloquer ✅
                        </button>
                      } @else {
                        <button class="btn-s" (click)="toggleBlock(user)" style="font-size:11px; padding:6px 12px; background:#FEE2E2; border-color:#EF4444; color:#DC2626; font-weight:700">
                          Bloquer 🚫
                        </button>
                      }
                    }

                    @if (user.role === 'guest') {
                      <button class="btn-s" (click)="resetGuestPassword(user)" style="font-size:11px; padding:6px 12px; font-weight:600">
                        Nouveau Code
                      </button>
                      <button class="btn-s" (click)="deleteUser(user.id)" style="font-size:11px; padding:6px 12px; background:#FEE2E2; border-color:#EF4444; color:#DC2626; font-weight:700">
                        Supprimer
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- PANEL 2: GUEST GENERATOR -->
      @if (activePanel() === 'guests') {
        <div class="card" style="margin-top:20px; animation: fadeIn 0.2s">
          <h3 class="st" style="font-size:15px; margin-bottom:12px; color:#7C3AED">
            🔑 Générateur de Comptes Invités (Guests)
          </h3>
          <p style="font-size:12px; color:var(--text-secondary); margin-bottom:16px">
            Générez des identifiants temporaires d'accès rapide pour des élèves invités. Ils pourront se connecter sans adresse e-mail grâce à un nom d'utilisateur et un code d'accès, ou directement en cliquant sur un lien de connexion direct que vous leur enverrez.
          </p>

          <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end; background:var(--surface-2); padding:16px; border-radius:10px; border:1px solid var(--border-weak)">
            <div class="input-row" style="flex:2; min-width:180px; margin-bottom:0">
              <label style="font-size:11px; font-weight:700; color:var(--text-secondary); margin-bottom:4px; display:block">Nom de l'invité</label>
              <input [(ngModel)]="guestName" placeholder="Ex: Jean Dupont" class="form-input" style="height:38px; font-size:13px; background:#FFF" />
            </div>

            <div class="input-row" style="flex:1; min-width:140px; margin-bottom:0">
              <label style="font-size:11px; font-weight:700; color:var(--text-secondary); margin-bottom:4px; display:block">Niveau estimé</label>
              <select [(ngModel)]="guestLevel" class="form-select" style="height:38px; font-size:13px; background:#FFF">
                <option value="Beginner">Débutant (Beginner)</option>
                <option value="Intermediate">Intermédiaire (Intermediate)</option>
                <option value="Advanced">Avancé (Advanced)</option>
              </select>
            </div>

            <button class="btn-p" [disabled]="!guestName" (click)="generateGuestCredentials()" style="height:38px; padding:0 24px; font-weight:700; background:#7C3AED; border-color:#7C3AED">
              🔑 Générer le compte
            </button>
          </div>

          <!-- Generated credentials show area -->
          @if (generatedCredentials(); as creds) {
            <div style="margin-top:16px; padding:14px; background:#ECFDF5; border:1px solid #10B981; border-radius:8px">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px">
                <div>
                  <p style="font-size:13px; font-weight:800; color:#065F46; margin:0 0 8px 0">✅ Compte invité généré avec succès !</p>
                  <div style="display:flex; gap:16px; flex-wrap:wrap">
                    <div>
                      <span style="font-size:11px; color:#047857; font-weight:700">Nom d'utilisateur:</span>
                      <code style="background:#FFF; padding:3px 8px; border-radius:4px; font-size:12px; color:#065F46; margin-left:4px; border:1px solid #A7F3D0">{{ creds.username }}</code>
                    </div>
                    <div>
                      <span style="font-size:11px; color:#047857; font-weight:700">Code d'accès:</span>
                      <code style="background:#FFF; padding:3px 8px; border-radius:4px; font-size:12px; color:#065F46; margin-left:4px; border:1px solid #A7F3D0">{{ creds.password }}</code>
                    </div>
                  </div>
                  <p style="font-size:11px; color:#047857; margin-top:6px; font-weight:600">Copiez les identifiants ou le lien d'accès en un clic pour lui envoyer.</p>
                </div>
                <button class="btn-s" (click)="copyCredentials()" style="font-size:11px; padding:6px 12px; font-weight:700">
                  📋 Copier la fiche d'accès
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- PANEL 3: ABUSE REPORTS MODERATION -->
      @if (activePanel() === 'reports') {
        <div class="card" style="margin-top:20px; animation: fadeIn 0.2s">
          <h3 class="st" style="font-size:15px; margin-bottom:12px; color:#E11D48; display:flex; align-items:center; gap:6px">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Signalements d'Abus Reçus</span>
          </h3>
          <p style="font-size:12px; color:var(--text-secondary); margin-bottom:16px">
            Gérez la sécurité du chat et de la communauté. Consultez les signalements envoyés par les élèves pour violation de la charte de conduite et prenez les mesures adéquates.
          </p>

          @if (reports().length === 0) {
            <div style="text-align:center; padding:48px 16px; background:#ECFDF5; border:1px solid #A7F3D0; border-radius:10px; color:#065F46">
              <span style="font-size:32px; display:block; margin-bottom:8px">🛡️</span>
              <p style="font-size:13px; font-weight:800; margin-bottom:2px">Aucun signalement en attente</p>
              <p style="font-size:11px; margin:0">La charte de conduite est respectée par l'ensemble des élèves.</p>
            </div>
          } @else {
            <div style="display:flex; flex-direction:column; gap:12px">
              @for (rep of reports(); track rep.id) {
                <div style="border:1px solid #FED7D7; border-radius:10px; padding:16px; transition:all 0.2s" [style.background]="rep.status === 'pending' ? '#FFF5F5' : '#F9FAFB'" [style.border-color]="rep.status === 'pending' ? '#FEB2B2' : 'var(--border-weak)'">
                  
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px">
                    <div>
                      <div style="display:flex; align-items:center; gap:8px">
                        <span style="font-size:10px; font-weight:700; background:#E11D48; color:white; padding:1px 6px; border-radius:4px; text-transform:uppercase">
                          {{ rep.reason }}
                        </span>
                        @if (rep.status === 'resolved') {
                          <span style="font-size:10px; font-weight:700; background:#D1FAE5; color:#065F46; padding:1px 6px; border-radius:4px; text-transform:uppercase">
                            Traité ✅
                          </span>
                        }
                      </div>
                      
                      <!-- Reported entity details -->
                      <h4 style="font-size:14px; font-weight:800; color:var(--text-primary); margin:8px 0 2px 0">
                        Membre signalé : <span style="color:#E11D48">{{ rep.reportedUserName }}</span>
                      </h4>
                      <p style="font-size:11px; color:var(--text-muted); margin:0">
                        Signalé par {{ rep.reporterUserName }} · Le {{ rep.createdAt }}
                      </p>
                    </div>

                    <div style="display:flex; gap:6px">
                      <!-- Action: Resolve report -->
                      @if (rep.status === 'pending') {
                        <button class="btn-s" (click)="resolveReport(rep)" style="background:#D1FAE5; border-color:#10B981; color:#065F46; font-size:11px; font-weight:700; padding:6px 12px">
                          Ignorer / Classer comme traité
                        </button>
                      }
                      
                      <!-- Action: Ban/Block -->
                      @if (!isUserBlocked(rep.reportedUserId)) {
                        <button class="btn-s" (click)="blockReportedUser(rep)" style="background:#FEE2E2; border-color:#EF4444; color:#DC2626; font-size:11px; font-weight:700; padding:6px 12px">
                          Bannir / Bloquer
                        </button>
                      } @else {
                        <span style="font-size:11px; font-weight:700; color:#EF4444; padding:6px; display:inline-block">🚫 Déjà banni</span>
                      }

                      <!-- Action: Trash report -->
                      <button (click)="deleteReport(rep.id)" style="background:none; border:none; color:#9CA3AF; cursor:pointer; font-size:16px; padding:4px" title="Supprimer définitivement la fiche">
                        🗑️
                      </button>
                    </div>
                  </div>

                  <!-- Details description text -->
                  <div style="background:rgba(255,255,255,0.7); border:1px dashed #FEB2B2; padding:10px 12px; border-radius:6px; margin-top:12px; font-size:12px; color:var(--text-secondary); line-height:1.4">
                    <strong>Détails du signalement :</strong>
                    <p style="margin:4px 0 0 0; white-space:pre-wrap; font-style:italic">"{{ rep.details }}"</p>
                  </div>
                </div>
              }
            </div>
          }
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
export class TeacherUserManagementComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  activePanel = signal<'users' | 'guests' | 'reports'>('users');

  allUsers = signal<UserProfile[]>([]);
  reports = signal<AbuseReport[]>([]);

  guestName = '';
  guestLevel = 'Beginner';
  searchQuery = '';
  filterRole = 'All';
  generatedCredentials = signal<GuestCredentials | null>(null);

  constructor() {
    this.db.observeUsers().subscribe(users => this.allUsers.set(users));
    this.db.observeReports().subscribe(list => this.reports.set(list));
  }

  guests = computed(() => this.allUsers().filter(u => u.role === 'guest'));
  students = computed(() => this.allUsers().filter(u => u.role === 'student'));
  blockedUsers = computed(() => this.allUsers().filter(u => u.blocked === true));
  
  pendingReportsCount = computed(() => {
    return this.reports().filter(r => r.status === 'pending').length;
  });

  filteredUsers = computed(() => {
    let users = this.allUsers();
    
    if (this.filterRole !== 'All') {
      users = users.filter(u => u.role === this.filterRole);
    }
    
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      users = users.filter(u => 
        u.name.toLowerCase().includes(query) ||
        u.level.toLowerCase().includes(query) ||
        (u.username && u.username.toLowerCase().includes(query))
      );
    }
    
    return users;
  });

  isUserBlocked(userId: string): boolean {
    const user = this.allUsers().find(u => u.id === userId);
    return user ? !!user.blocked : false;
  }

  generateGuestCredentials() {
    if (!this.guestName) return;

    this.db.addStudent(this.guestName, 'Guest', '🇸🇳', 0, 0).then((newUser) => {
      if (newUser) {
        const username = newUser.username || '';
        const password = newUser.password || '';
        const userId = newUser.id;

        this.generatedCredentials.set({ username, password, userId });

        this.dialogService.alert(
          'Compte Invité Créé',
          `Nom d'utilisateur: ${username}\nCode d'accès: ${password}\n\nFiche copiée disponible ci-dessous.`,
          'success'
        );

        this.guestName = '';
        this.guestLevel = 'Beginner';
      }
    });
  }

  private generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  copyCredentials() {
    const creds = this.generatedCredentials();
    if (!creds) return;

    const text = `Identifiants d'invité SpeakUp :\nNom d'utilisateur : ${creds.username}\nCode d'accès : ${creds.password}\nLien : ${window.location.origin}/#/guest-login`;
    navigator.clipboard.writeText(text).then(() => {
      this.dialogService.alert('Copié !', 'Fiche d\'invité copiée dans le presse-papiers.', 'success');
    });
  }

  copyLoginCredentials(user: UserProfile) {
    const text = `Identifiants SpeakUp pour ${user.name} :\nIdentifiant : ${user.username}\nCode d'accès : ${user.password}\nLien : ${window.location.origin}/#/guest-login`;
    navigator.clipboard.writeText(text).then(() => {
      this.dialogService.alert('Copié !', 'Les identifiants de connexion ont été copiés dans le presse-papiers.', 'success');
    });
  }

  copyLoginLink(user: UserProfile) {
    const link = `${window.location.origin}/#/guest-login?u=${encodeURIComponent(user.username || '')}&p=${encodeURIComponent(user.password || '')}`;
    navigator.clipboard.writeText(link).then(() => {
      this.dialogService.alert('Lien Copié !', 'Le lien d\'accès direct a été copié. Le visiteur pourra se connecter en un clic !', 'success');
    });
  }

  changeUserGroup(userId: string, newLevel: string) {
    this.db.updateUserProfile(userId, { level: newLevel }).then(() => {
      this.dialogService.alert('Groupe mis à jour', 'Le groupe/niveau de l\'utilisateur a été modifié avec succès !', 'success');
    });
  }

  toggleBlock(user: UserProfile) {
    const newBlockedState = !user.blocked;
    
    this.dialogService.show({
      title: newBlockedState ? 'Bloquer l\'utilisateur' : 'Débloquer l\'utilisateur',
      message: `Voulez-vous vraiment ${newBlockedState ? 'bloquer' : 'débloquer'} l'accès de ${user.name} ?`,
      type: 'confirm',
      confirmText: newBlockedState ? 'Bloquer' : 'Débloquer',
      cancelText: 'Annuler',
      onConfirm: () => {
        this.db.updateUserProfile(user.id, { blocked: newBlockedState }).then(() => {
          this.dialogService.alert(
            'Succès',
            `${user.name} a été ${newBlockedState ? 'bloqué' : 'débloqué'}.`,
            'success'
          );
        });
      }
    });
  }

  blockReportedUser(report: AbuseReport) {
    this.dialogService.show({
      title: 'Bannir l\'utilisateur',
      message: `Voulez-vous vraiment bloquer définitivement l'accès de ${report.reportedUserName} suite au signalement pour "${report.reason}" ?`,
      type: 'confirm',
      confirmText: 'Bannir / Bloquer',
      cancelText: 'Annuler',
      onConfirm: () => {
        this.db.updateUserProfile(report.reportedUserId, { blocked: true }).then(() => {
          this.db.resolveReport(report.id).then(() => {
            this.dialogService.alert('Bannissement Réussi', `${report.reportedUserName} a été bloqué et le signalement a été classé comme résolu.`, 'success');
          });
        });
      }
    });
  }

  resolveReport(report: AbuseReport) {
    this.db.resolveReport(report.id).then(() => {
      this.dialogService.alert('Signalement Résolu', 'Le signalement a été marqué comme traité/classé.', 'success');
    });
  }

  deleteReport(reportId: string) {
    this.dialogService.show({
      title: 'Supprimer la fiche',
      message: 'Voulez-vous supprimer définitivement la fiche de ce signalement ?',
      type: 'confirm',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      onConfirm: () => {
        this.db.deleteReport(reportId).then(() => {
          this.dialogService.alert('Supprimée', 'Fiche supprimée avec succès.', 'success');
        });
      }
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

  resetGuestPassword(user: UserProfile) {
    const newPassword = this.generatePassword();
    
    this.dialogService.show({
      title: 'Nouveau Code d\'Accès',
      message: `Générer un nouveau code d'accès pour ${user.name} ? L'ancien code sera immédiatement révoqué.`,
      type: 'confirm',
      confirmText: 'Générer',
      cancelText: 'Annuler',
      onConfirm: () => {
        this.db.updateUserProfile(user.id, { password: newPassword }).then(() => {
          this.dialogService.alert(
            'Code mis à jour',
            `Nouveau code : ${newPassword}\n\nVeuillez le lui communiquer.`,
            'success'
          );
        });
      }
    });
  }

  deleteUser(userId: string) {
    this.dialogService.show({
      title: 'Supprimer l\'utilisateur',
      message: 'Voulez-vous supprimer définitivement ce compte ? Cette action est irréversible.',
      type: 'confirm',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      onConfirm: () => {
        this.db.deleteUser(userId).then(() => {
          this.dialogService.alert('Supprimé', 'L\'utilisateur a été définitivement supprimé.', 'success');
        });
      }
    });
  }
}