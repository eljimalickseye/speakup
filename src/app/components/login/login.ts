import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-screen">
      <!-- Ambient animated glowing orbs -->
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>

      <div class="login-card" style="position:relative">
        <div style="display:flex; justify-content:center; margin-bottom:12px">
          <img src="logo.png" style="width:36px; height:36px; object-fit:contain; border-radius:8px" alt="logo">
        </div>
        <h2 class="login-title" (click)="onTitleClick()" style="cursor:pointer; user-select:none" title="Click 5 times for teacher mode">SpeakUp</h2>
        <p class="login-sub">SpeakUp English Platform — Authentication</p>
        
        <!-- Role Tabs - Teacher can hide via settings -->
        <div class="tab-row" style="margin-bottom: 20px; justify-content: center">
          <button class="tab" [class.active]="activeRole() === 'student'" (click)="setRole('student')">
            <i class="ti ti-school"></i> Student Login
          </button>
          @if (showTeacherTab()) {
            <button class="tab" [class.active]="activeRole() === 'teacher'" (click)="setRole('teacher')">
              <i class="ti ti-briefcase"></i> Teacher Login
            </button>
          }
        </div>
        
        <!-- Profile List Selector -->
        <div style="margin-bottom:18px">
          <p style="font-size: 10px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px">
            Select your account:
          </p>
          <div class="login-grid">
            @for (u of filteredUsers(); track u.id) {
              <button class="login-profile-btn" 
                      [class.selected]="selectedUserId() === u.id" 
                      (click)="selectUser(u.id)">
                <div class="avatar" style="width:24px; height:24px; font-size:10px; margin-right: 2px" [style.background]="u.role === 'teacher' ? '#3730A3' : '#4F46E5'">
                  {{ u.avatar }}
                </div>
                <div style="flex:1">
                  <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); display:flex; align-items:center; gap:6px">
                    <span>{{ u.name }}</span>
                    @if (getFlagUrl(u.countryFlag)) {
                      <img [src]="getFlagUrl(u.countryFlag)" style="width: 16px; height: 12px; object-fit: contain; border-radius: 1px" alt="flag">
                    }
                  </div>
                  @if (u.role === 'student') {
                    <div style="font-size: 10px; color: var(--text-muted)">English level: {{ u.level }} · {{ u.xp }} XP</div>
                  } @else {
                    <div style="font-size: 10px; color: var(--text-muted)">Course Coordinator</div>
                  }
                </div>
                @if (selectedUserId() === u.id) {
                  <i class="ti ti-circle-check" style="color: #4F46E5; font-size: 18px"></i>
                }
              </button>
            } @empty {
              <div style="grid-column: 1 / -1; font-size: 12px; color: var(--text-secondary); text-align: center; padding: 20px; background: var(--surface-2); border-radius: 8px; border: 1px dashed var(--border-strong); width: 100%">
                No student accounts registered yet.<br>
                <span style="font-weight: 600; color: #4F46E5">Log in as a Teacher</span> to add students.
              </div>
            }
          </div>
        </div>

        <!-- Code d'accès PIN Input -->
        @if (selectedUserId()) {
          <div style="margin-bottom:18px; animation: fadeIn 0.2s">
            <label style="font-size: 11px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 6px; display: block; letter-spacing: 0.5px">
              Code d'accès (PIN) :
            </label>
            <input 
              type="password" 
              [(ngModel)]="pinCode" 
              placeholder="Saisissez votre code d'accès" 
              class="form-input" 
              style="height: 38px; font-size: 13px; width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 0 10px; background: var(--surface-1); color: var(--text-primary)" 
              (keyup.enter)="signIn()" 
            />
          </div>
        }
        
        <button class="btn-p" style="width: 100%; height: 42px; border-radius: 8px; font-size: 14px" [disabled]="!selectedUserId() || !pinCode.trim()" (click)="signIn()">
          <i class="ti ti-login"></i> Sign In to SpeakUp
        </button>

        <div style="display:flex; align-items:center; margin:16px 0; font-size:11px; color:var(--text-muted)">
          <div style="flex:1; height:1px; background:var(--border)"></div>
          <span style="padding:0 8px; text-transform:uppercase; font-weight:600; letter-spacing:0.5px">or</span>
          <div style="flex:1; height:1px; background:var(--border)"></div>
        </div>

        <button class="google-btn" (click)="signInWithGoogle()">
          <i class="ti ti-brand-google" style="font-size:16px"></i> Sign In with Google
        </button>

        <button class="btn-s" style="width: 100%; border-color: #10B981; color: #065F46; margin-top: 12px; font-size: 13px; background:#F0FDF4" (click)="guestLogin()">
          <i class="ti ti-user" style="font-size:14px"></i> Guest Login (Username/Password)
        </button>

        <button class="btn-s" style="width: 100%; border-color: #4F46E5; color: #4F46E5; margin-top: 12px; font-size: 13px" (click)="isRequestModalOpen.set(true)">
          <i class="ti ti-user-plus"></i> Faire une demande d'inscription
        </button>

        <!-- Teacher login visibility controlled by teacher profile settings only -->
      </div>

      <!-- REGISTRATION REQUEST MODAL -->
      @if (isRequestModalOpen()) {
        <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5); z-index:999; display:flex; align-items:center; justify-content:center">
          <div class="card" style="width:100%; max-width:400px; padding:24px; border-radius:12px; background:white; box-shadow:0 10px 25px rgba(0,0,0,0.1); animation: scaleUp 0.25s ease-out; margin:0">
            <h3 style="margin-top:0; font-size:16px; font-weight:700; color:#4F46E5; display:flex; align-items:center; gap:8px">
              <i class="ti ti-user-plus"></i>
              <span>Demande d'inscription</span>
            </h3>
            <p style="font-size:12px; color:var(--text-secondary); margin-bottom:18px">
              Remplissez ce formulaire pour envoyer votre demande d'inscription aux professeurs de SpeakUp.
            </p>

            <div class="input-row" style="margin-bottom:12px">
              <label style="font-weight:600; font-size:12px; color:var(--text-primary)">Nom complet</label>
              <input type="text" [(ngModel)]="requestName" placeholder="Ex: Awa Ndiaye" style="width:100%; padding:8px; border:1px solid #D1D5DB; border-radius:6px; font-size:13px; background:#FFF" />
            </div>

            <div class="input-row" style="margin-bottom:12px">
              <label style="font-weight:600; font-size:12px; color:var(--text-primary)">Niveau d'anglais souhaité / Rôle</label>
              <select [(ngModel)]="requestLevel" style="width:100%; padding:8px; border:1px solid #D1D5DB; border-radius:6px; font-size:13px; background:#FFF">
                <option value="A1">A1 — Débutant</option>
                <option value="A2">A2 — Élémentaire</option>
                <option value="B1">B1 — Intermédiaire</option>
                <option value="B2">B2 — Intermédiaire Supérieur</option>
                <option value="Guest">Guest / Invité (Accès libre)</option>
              </select>
            </div>

            <div class="input-row" style="margin-bottom:20px">
              <label style="font-weight:600; font-size:12px; color:var(--text-primary)">Pays d'origine</label>
              <select [(ngModel)]="requestCountry" style="width:100%; padding:8px; border:1px solid #D1D5DB; border-radius:6px; font-size:13px; background:#FFF">
                <option value="🇸🇳">Sénégal 🇸🇳</option>
                <option value="🇳🇬">Nigeria 🇳🇬</option>
                <option value="🇷🇼">Rwanda 🇷🇼</option>
                <option value="🇧🇯">Bénin 🇧🇯</option>
                <option value="🇨🇮">Côte d'Ivoire 🇨🇮</option>
                <option value="🇨🇲">Cameroun 🇨🇲</option>
                <option value="🇹🇬">Togo 🇹🇬</option>
                <option value="🇲🇱">Mali 🇲🇱</option>
                <option value="🇬🇳">Guinée 🇬🇳</option>
                <option value="🇳🇪">Niger 🇳🇪</option>
                <option value="🇫🇷">France 🇫🇷</option>
              </select>
            </div>

            <div style="display:flex; gap:10px">
              <button class="btn-p" style="flex:1" (click)="submitRequest()">
                Envoyer
              </button>
              <button class="btn-s" style="flex:1" (click)="closeRequestModal()">
                Annuler
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class LoginComponent {
  private db = inject(DatabaseService);
  public dialogService = inject(DialogService);

  activeRole = signal<'student' | 'teacher'>('student');
  selectedUserId = signal<string | null>(null);
  pinCode = '';
  allUsers = signal<UserProfile[]>([]);

  showTeacherTab = signal<boolean>(true);
  titleClicks = 5; // Already activated by default

  isRequestModalOpen = signal<boolean>(false);
  requestName = '';
  requestLevel = 'B1';
  requestCountry = '🇸🇳';

  constructor() {
    this.db.observeUsers().subscribe(list => {
      this.allUsers.set(list);
      // Auto-select first matching profile if none selected
      this.setDefaultUser();
    });
  }

  setRole(role: 'student' | 'teacher') {
    this.activeRole.set(role);
    this.selectedUserId.set(null);
    this.pinCode = '';
    this.setDefaultUser();
  }

  filteredUsers() {
    return this.allUsers().filter(u => u.role === this.activeRole());
  }

  selectUser(userId: string) {
    this.selectedUserId.set(userId);
    this.pinCode = '';
  }

  private setDefaultUser() {
    const list = this.filteredUsers();
    if (list.length > 0) {
      this.selectedUserId.set(list[0].id);
      this.pinCode = '';
    }
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

  signIn() {
    const uid = this.selectedUserId();
    if (uid) {
      const match = this.allUsers().find(u => u.id === uid);
      if (match) {
        if (match.password && this.pinCode !== match.password) {
          this.dialogService.alert('Erreur', 'Code d\'accès (PIN) incorrect pour ce profil !', 'info');
          return;
        }
        this.db.setCurrentUser(uid);
        this.pinCode = '';
      }
    }
  }

  async signInWithGoogle() {
    try {
      await this.db.loginWithGoogle(this.activeRole());
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
    }
  }

  guestLogin() {
    // Navigate to guest login page
    window.location.hash = '#/guest-login';
  }

  onTitleClick() {
    // No longer used
  }

  submitRequest() {
    if (!this.requestName.trim()) {
      this.dialogService.alert('Erreur', 'Veuillez saisir votre nom complet.', 'info');
      return;
    }
    this.db.submitRegistrationRequest(
      this.requestName,
      this.requestLevel,
      this.requestCountry
    ).then(() => {
      this.dialogService.alert(
        'Demande Envoyée 🎉',
        `Votre demande d'inscription pour "${this.requestName}" (${this.requestLevel}) a bien été enregistrée.\nUn enseignant validera votre accès très prochainement.`,
        'success'
      );
      this.closeRequestModal();
    });
  }

  closeRequestModal() {
    this.isRequestModalOpen.set(false);
    this.requestName = '';
    this.requestLevel = 'B1';
    this.requestCountry = '🇸🇳';
  }
}
