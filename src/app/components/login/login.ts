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
                <label class="warm-label">Nom d'utilisateur</label>
                <input type="text" [(ngModel)]="requestUsername" placeholder="Ex: awandiaye" class="warm-input" style="text-transform: lowercase" />
              </div>

              <div class="warm-field">
                <label class="warm-label">Code d'accès / Mot de passe</label>
                <input type="password" [(ngModel)]="requestPassword" placeholder="Minimum 6 caractères" class="warm-input" />
              </div>

              <div class="warm-field">
                <label class="warm-label">Niveau d'anglais / Rôle</label>
                <select [(ngModel)]="requestLevel" class="warm-input">
                  <option value="A1">A1 — Débutant</option>
                  <option value="A2">A2 — Élémentaire</option>
                  <option value="B1">B1 — Intermédiaire</option>
                  <option value="B2">B2 — Intermédiaire Supérieur</option>
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

      <!-- BEAUTIFUL REGISTRATION SUCCESS / PENDING STATUS MODAL -->
      @if (isSuccessModalOpen()) {
        <div class="modal-backdrop" style="background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 9999;">
          <div class="modal-card" style="max-width: 440px; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); text-align: center; border: 1.5px solid #FCD34D;">
            <div style="background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); padding: 30px 20px; position: relative;">
              <div style="width: 72px; height: 72px; border-radius: 50%; background: #FCD34D; color: #B45309; display: flex; align-items: center; justify-content: center; font-size: 32px; margin: 0 auto 16px auto; box-shadow: 0 8px 20px -6px rgba(217, 119, 6, 0.4); animation: pulse 2s infinite;">
                📁
              </div>
              <h3 style="font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 800; color: #78350F; margin: 0 0 8px 0;">Dossier en Cours de Traitement</h3>
              <p style="font-size: 13px; color: #B45309; margin: 0; line-height: 1.5;">Votre demande d'inscription a bien été transmise à notre équipe pédagogique.</p>
            </div>

            <div style="padding: 24px 30px; display: flex; flex-direction: column; gap: 20px;">
              <!-- Visual Step Tracker -->
              <div style="display: flex; flex-direction: column; gap: 14px; text-align: left;">
                
                <!-- Step 1: Completed -->
                <div style="display: flex; gap: 12px; align-items: flex-start;">
                  <div style="width: 20px; height: 20px; border-radius: 50%; background: #10B981; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0; margin-top: 2px;">✓</div>
                  <div>
                    <h4 style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin: 0 0 2px 0;">Dossier soumis avec succès</h4>
                    <p style="font-size: 11px; color: var(--text-secondary); margin: 0;">Vos informations de profil ont été enregistrées.</p>
                  </div>
                </div>

                <!-- Step 2: Active / Processing -->
                <div style="display: flex; gap: 12px; align-items: flex-start;">
                  <div style="width: 20px; height: 20px; border-radius: 50%; background: #F59E0B; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0; margin-top: 2px; position: relative;">
                    ⏱
                  </div>
                  <div>
                    <h4 style="font-size: 13px; font-weight: 700; color: #D97706; margin: 0 0 2px 0;">Vérification de votre dossier</h4>
                    <p style="font-size: 11px; color: var(--text-secondary); margin: 0;">L'administrateur SpeakUp examine votre demande d'enrôlement.</p>
                  </div>
                </div>

                <!-- Step 3: Pending -->
                <div style="display: flex; gap: 12px; align-items: flex-start; opacity: 0.5;">
                  <div style="width: 20px; height: 20px; border-radius: 50%; background: #E2E8F0; color: #94A3B8; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0; margin-top: 2px;">3</div>
                  <div>
                    <h4 style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin: 0 0 2px 0;">Activation de vos accès</h4>
                    <p style="font-size: 11px; color: var(--text-secondary); margin: 0;">Vous recevrez un mail ou une notification dès validation.</p>
                  </div>
                </div>

              </div>

              <!-- Friendly message block -->
              <div style="background: #F8FAFC; border-radius: 10px; padding: 12px 16px; border: 1px solid #E2E8F0; font-size: 11.5px; color: var(--text-muted); line-height: 1.5; text-align: left;">
                💡 <strong>Besoin d'accélérer l'activation ?</strong> Vous pouvez notifier directement votre professeur ou le secrétariat SpeakUp pour activer votre compte immédiatement.
              </div>

              <button (click)="isSuccessModalOpen.set(false)" 
                      style="background: #D97706; color: white; border: none; padding: 12px 24px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px; transition: all 0.2s; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.2); width: 100%;">
                Compris, j'attends l'activation
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
  isSuccessModalOpen = signal<boolean>(false);
  requestName = '';
  requestUsername = '';
  requestPassword = '';
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
    const name = this.requestName.trim();
    const username = this.requestUsername.trim().toLowerCase();
    const password = this.requestPassword.trim();
    const level = this.requestLevel;
    const country = this.requestCountry;

    if (!name) {
      this.dialogService.alert('Erreur', 'Veuillez saisir votre nom complet.', 'info');
      return;
    }
    if (!username) {
      this.dialogService.alert('Erreur', "Veuillez choisir un nom d'utilisateur.", 'info');
      return;
    }
    if (password.length < 6) {
      this.dialogService.alert('Erreur', 'Le mot de passe doit comporter au moins 6 caractères.', 'info');
      return;
    }

    const role = level === 'Teacher' ? 'teacher' : 'student';

    this.db.registerUserProfile(name, username, password, level, country, role)
      .then(() => {
        this.closeRequestModal();
        this.isSuccessModalOpen.set(true);
      })
      .catch((err: any) => {
        this.dialogService.alert('Erreur', err.message || "Impossible de créer le compte.", 'info');
      });
  }

  closeRequestModal() {
    this.isRequestModalOpen.set(false);
    this.requestName = '';
    this.requestUsername = '';
    this.requestPassword = '';
    this.requestLevel = 'B1';
    this.requestCountry = '🇸🇳';
  }
}
