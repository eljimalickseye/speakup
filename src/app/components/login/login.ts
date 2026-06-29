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
        <h2 class="login-title" style="user-select:none">SpeakUp</h2>
        <p class="login-sub">SpeakUp English Platform — Authentication</p>

        <!-- Username/Password form -->
        <div style="margin-bottom:14px">
          <label style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; display:block">
            Nom d'utilisateur
          </label>
          <div style="position:relative">
            <i class="ti ti-user" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:15px"></i>
            <input
              type="text"
              [(ngModel)]="loginUsername"
              placeholder="Ex: awandiaye12"
              class="form-input"
              style="height:42px; font-size:13px; width:100%; border:1px solid var(--border); border-radius:8px; padding:0 12px 0 34px; background:var(--surface-1); color:var(--text-primary)"
              (keyup.enter)="signIn()"
              autocomplete="username"
            />
          </div>
        </div>

        <div style="margin-bottom:20px">
          <label style="font-size:11px; font-weight:700; color:var(--text-secondary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; display:block">
            Code d'accès (PIN)
          </label>
          <div style="position:relative">
            <i class="ti ti-lock" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:15px"></i>
            <input
              [type]="showPassword() ? 'text' : 'password'"
              [(ngModel)]="loginPassword"
              placeholder="Votre code personnel"
              class="form-input"
              style="height:42px; font-size:13px; width:100%; border:1px solid var(--border); border-radius:8px; padding:0 38px 0 34px; background:var(--surface-1); color:var(--text-primary)"
              (keyup.enter)="signIn()"
              autocomplete="current-password"
            />
            <button
              (click)="showPassword.set(!showPassword())"
              style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:var(--text-muted); font-size:15px; padding:0; line-height:1"
              type="button"
            >
              <i [class]="showPassword() ? 'ti ti-eye-off' : 'ti ti-eye'"></i>
            </button>
          </div>
        </div>

        <!-- Sign In button -->
        <button
          class="btn-p"
          style="width:100%; height:44px; border-radius:8px; font-size:14px; font-weight:700"
          [disabled]="!loginUsername.trim() || !loginPassword.trim() || isLoading()"
          (click)="signIn()"
        >
          @if (isLoading()) {
            <span style="display:inline-block; width:14px; height:14px; border:2px solid rgba(255,255,255,0.4); border-top-color:white; border-radius:50%; animation:spin 0.7s linear infinite; margin-right:6px"></span>
            Connexion...
          } @else {
            <i class="ti ti-login"></i> Se connecter
          }
        </button>

        <div style="display:flex; align-items:center; margin:16px 0; font-size:11px; color:var(--text-muted)">
          <div style="flex:1; height:1px; background:var(--border)"></div>
          <span style="padding:0 8px; text-transform:uppercase; font-weight:600; letter-spacing:0.5px">ou</span>
          <div style="flex:1; height:1px; background:var(--border)"></div>
        </div>

        <button class="google-btn" (click)="signInWithGoogle()">
          <i class="ti ti-brand-google" style="font-size:16px"></i> Connexion avec Google
        </button>

        <button class="btn-s" style="width:100%; border-color:#10B981; color:#065F46; margin-top:12px; font-size:13px; background:#F0FDF4" (click)="guestLogin()">
          <i class="ti ti-user" style="font-size:14px"></i> Accès Invité (Username/Password)
        </button>

        <button class="btn-s" style="width:100%; border-color:#4F46E5; color:#4F46E5; margin-top:10px; font-size:13px" (click)="isRequestModalOpen.set(true)">
          <i class="ti ti-user-plus"></i> Faire une demande d'inscription
        </button>

        <p style="font-size:10px; color:var(--text-muted); text-align:center; margin-top:14px; line-height:1.4">
          Vos identifiants vous ont été remis par votre professeur.<br>
          Pour récupérer vos accès, contactez l'équipe SpeakUp.
        </p>
      </div>

      <!-- REGISTRATION REQUEST MODAL -->
      @if (isRequestModalOpen()) {
        <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.5); z-index:999; display:flex; align-items:center; justify-content:center; padding:16px">
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
                <option value="A1">A1 — Débutant (Élève)</option>
                <option value="A2">A2 — Élémentaire (Élève)</option>
                <option value="B1">B1 — Intermédiaire (Élève)</option>
                <option value="B2">B2 — Intermédiaire Supérieur (Élève)</option>
                <option value="Guest">Guest / Invité (Accès libre)</option>
                <option value="Teacher">Professeur — Demande d'enrôlement 🎓</option>
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

  allUsers = signal<UserProfile[]>([]);
  isLoading = signal<boolean>(false);
  showPassword = signal<boolean>(false);

  loginUsername = '';
  loginPassword = '';

  isRequestModalOpen = signal<boolean>(false);
  requestName = '';
  requestLevel = 'B1';
  requestCountry = '🇸🇳';

  constructor() {
    this.db.observeUsers().subscribe(list => {
      this.allUsers.set(list);
    });
  }

  signIn() {
    const username = this.loginUsername.trim().toLowerCase();
    const password = this.loginPassword;

    if (!username || !password) return;

    this.isLoading.set(true);

    // Find user matching username (case insensitive)
    const match = this.allUsers().find(u =>
      u.username && u.username.toLowerCase() === username
    );

    if (!match) {
      this.dialogService.alert('Identifiant inconnu', 'Aucun compte ne correspond à ce nom d\'utilisateur.', 'info');
      this.isLoading.set(false);
      return;
    }

    if (match.blocked) {
      this.dialogService.alert('Accès Refusé 🚫', 'Votre compte a été suspendu. Contactez un professeur pour plus d\'informations.', 'info');
      this.isLoading.set(false);
      return;
    }

    if (match.password && password !== match.password) {
      this.dialogService.alert('Code incorrect ❌', 'Le code d\'accès saisi est incorrect. Veuillez réessayer.', 'info');
      this.loginPassword = '';
      this.isLoading.set(false);
      return;
    }

    // All checks passed — log in
    this.db.setCurrentUser(match.id);
    this.loginUsername = '';
    this.loginPassword = '';
    this.isLoading.set(false);
  }

  async signInWithGoogle() {
    try {
      await this.db.loginWithGoogle('student');
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
    }
  }

  guestLogin() {
    window.location.hash = '#/guest-login';
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
