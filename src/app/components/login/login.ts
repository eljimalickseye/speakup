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
    <div class="login-screen-africa">

      <!-- LEFT PANEL — Immersive African Campus Visual -->
      <div class="africa-panel">
        <div class="africa-bg"></div>
        <div class="africa-overlay"></div>

        <!-- Floating warm particles -->
        <div class="particle p1"></div>
        <div class="particle p2"></div>
        <div class="particle p3"></div>
        <div class="particle p4"></div>
        <div class="particle p5"></div>
        <div class="particle p6"></div>

        <div class="africa-content">

          <!-- Logo top-left -->
          <div class="africa-logo">
            <img src="logo.png" alt="SpeakUp" style="width:44px;height:44px;object-fit:contain;border-radius:12px;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.3))">
            <div>
              <div style="font-family:'Outfit',sans-serif;font-size:22px;font-weight:800;letter-spacing:-1px;line-height:1">
                <span style="color:#fff">Speak</span><span style="color:#FCD34D">Up</span>
              </div>
              <div style="font-size:10px;color:rgba(255,255,255,0.75);font-weight:500;letter-spacing:1px;text-transform:uppercase">English Platform</div>
            </div>
          </div>

          <!-- Central hero text -->
          <div class="africa-hero">
            <div class="africa-tagline">
              <span class="tagline-word">Speak.</span>
              <span class="tagline-word delay-1">Learn.</span>
              <span class="tagline-word delay-2">Grow.</span>
            </div>
            <p class="africa-quote">
              "Education is the most powerful weapon<br>which you can use to change the world."
            </p>
            <p class="africa-quote-author">— Nelson Mandela</p>
          </div>


          <!-- African flags row -->
          <div class="africa-flags">
            <span class="flag-item" title="Sénégal">🇸🇳</span>
            <span class="flag-item" title="Nigeria">🇳🇬</span>
            <span class="flag-item" title="Côte d'Ivoire">🇨🇮</span>
            <span class="flag-item" title="Cameroun">🇨🇲</span>
            <span class="flag-item" title="Ghana">🇬🇭</span>
            <span class="flag-item" title="Rwanda">🇷🇼</span>
            <span class="flag-item" title="Mali">🇲🇱</span>
            <span class="flag-item" title="Bénin">🇧🇯</span>
            <span class="flag-item" title="Togo">🇹🇬</span>
            <span class="flag-item" title="Guinée">🇬🇳</span>
          </div>

        </div>
      </div>

      <!-- RIGHT PANEL — Login Form -->
      <div class="form-panel">
        <div class="form-top-accent"></div>

        <div class="form-inner">

          <!-- Mobile logo (hidden on desktop) -->
          <div class="mobile-logo">
            <img src="logo.png" alt="SpeakUp" style="width:52px;height:52px;object-fit:contain;border-radius:14px;filter:drop-shadow(0 6px 16px rgba(217,119,6,0.3))">
            <div style="font-family:'Outfit',sans-serif;font-size:26px;font-weight:800;letter-spacing:-1px">
              <span style="color:#1b3b6f">Speak</span><span style="color:#E07A5F">Up</span>
            </div>
          </div>

          <!-- Welcome heading -->
          <div class="form-heading">
            <h1 class="form-title">Bon retour ! 👋</h1>
            <p class="form-subtitle">Connectez-vous pour continuer votre apprentissage</p>
          </div>

          <!-- Username field -->
          <div class="warm-field">
            <label class="warm-label">
              <i class="ti ti-user"></i> Nom d'utilisateur
            </label>
            <div class="warm-input-wrap">
              <input
                type="text"
                [(ngModel)]="loginUsername"
                placeholder="Ex: awandiaye12"
                class="warm-input"
                (keyup.enter)="signIn()"
                autocomplete="username"
              />
            </div>
          </div>

          <!-- Password field -->
          <div class="warm-field">
            <label class="warm-label">
              <i class="ti ti-lock"></i> Code d'accès (PIN)
            </label>
            <div class="warm-input-wrap" style="position:relative">
              <input
                [type]="showPassword() ? 'text' : 'password'"
                [(ngModel)]="loginPassword"
                placeholder="Votre code personnel"
                class="warm-input"
                style="padding-right:44px"
                (keyup.enter)="signIn()"
                autocomplete="current-password"
              />
              <button
                (click)="showPassword.set(!showPassword())"
                class="eye-btn"
                type="button"
              >
                <i [class]="showPassword() ? 'ti ti-eye-off' : 'ti ti-eye'"></i>
              </button>
            </div>
          </div>

          <!-- Sign In button -->
          <button
            class="warm-btn-primary"
            [disabled]="!loginUsername.trim() || !loginPassword.trim() || isLoading()"
            (click)="signIn()"
          >
            @if (isLoading()) {
              <span class="spin-ring"></span>
              Connexion en cours...
            } @else {
              <i class="ti ti-login"></i> Se connecter
            }
          </button>

          <!-- Divider -->
          <div class="warm-divider">
            <div class="divider-line"></div>
            <span class="divider-text">ou</span>
            <div class="divider-line"></div>
          </div>

          <!-- Google button -->
          <button class="warm-btn-google" (click)="signInWithGoogle()">
            <i class="ti ti-brand-google" style="font-size:17px;color:#EA4335"></i>
            Connexion avec Google
          </button>

          <!-- Guest & Register buttons -->
          <div class="warm-actions-row">
            <button class="warm-btn-outline teal" (click)="guestLogin()">
              <i class="ti ti-user" style="font-size:14px"></i>
              Accès Invité
            </button>
            <button class="warm-btn-outline coral" (click)="isRequestModalOpen.set(true)">
              <i class="ti ti-user-plus" style="font-size:14px"></i>
              S'inscrire
            </button>
          </div>

          <!-- Footer note -->
          <p class="form-footer-note">
            <i class="ti ti-info-circle" style="font-size:12px;color:#D97706"></i>
            Vos identifiants vous ont été remis par votre professeur.<br>
            Pour récupérer vos accès, contactez l'équipe SpeakUp.
          </p>

        </div>
      </div>

      <!-- REGISTRATION REQUEST MODAL -->
      @if (isRequestModalOpen()) {
        <div class="modal-backdrop" (click)="closeRequestModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">

            <div class="modal-header">
              <div class="modal-icon-wrap">
                <i class="ti ti-user-plus" style="font-size:20px;color:#D97706"></i>
              </div>
              <div style="flex:1">
                <h3 class="modal-title">Demande d'inscription</h3>
                <p class="modal-sub">Remplissez ce formulaire pour rejoindre SpeakUp</p>
              </div>
              <button class="modal-close-btn" (click)="closeRequestModal()">
                <i class="ti ti-x"></i>
              </button>
            </div>

            <div class="modal-body">
              <div class="warm-field">
                <label class="warm-label">Nom complet</label>
                <input type="text" [(ngModel)]="requestName" placeholder="Ex: Awa Ndiaye" class="warm-input" />
              </div>

              <div class="warm-field">
                <label class="warm-label">Niveau d'anglais / Rôle</label>
                <select [(ngModel)]="requestLevel" class="warm-input">
                  <option value="A1">A1 — Débutant (Élève)</option>
                  <option value="A2">A2 — Élémentaire (Élève)</option>
                  <option value="B1">B1 — Intermédiaire (Élève)</option>
                  <option value="B2">B2 — Intermédiaire Supérieur (Élève)</option>
                  <option value="Guest">Guest / Invité (Accès libre)</option>
                  <option value="Teacher">Professeur — Demande d'enrôlement 🎓</option>
                </select>
              </div>

              <div class="warm-field">
                <label class="warm-label">Pays d'origine</label>
                <select [(ngModel)]="requestCountry" class="warm-input">
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
                  <option value="🇬🇭">Ghana 🇬🇭</option>
                  <option value="🇫🇷">France 🇫🇷</option>
                </select>
              </div>
            </div>

            <div class="modal-footer">
              <button class="warm-btn-primary" style="flex:1" (click)="submitRequest()">
                <i class="ti ti-send"></i> Envoyer
              </button>
              <button class="warm-btn-outline coral" style="flex:1" (click)="closeRequestModal()">
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
