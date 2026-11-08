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
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Nom d'utilisateur
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
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Code d'accès (PIN)
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
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:6px"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Se connecter
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
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" style="vertical-align:middle; margin-right:6px"><path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"/><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"/><path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9c-.2-.7-.4-1.5-.4-2.3z"/><path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z"/></svg> Connexion avec Google
          </button>

          <!-- Guest & Register buttons -->
          <div class="warm-actions-row">
            <button class="warm-btn-outline teal" (click)="guestLogin()">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Accès Invité
            </button>
            <button class="warm-btn-outline coral" (click)="isRequestModalOpen.set(true)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg> S'inscrire
            </button>
          </div>

          <!-- Footer note -->
          <p class="form-footer-note">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:2px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              </div>
              <div style="flex:1">
                <h3 class="modal-title">Créer mon compte SpeakUp 🚀</h3>
                <p class="modal-sub">Accès instantané & gratuit · Aucune attente de validation</p>
              </div>
              <button class="modal-close-btn" (click)="closeRequestModal()" aria-label="Fermer la fenêtre">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div class="modal-body">
              <div class="warm-field">
                <label class="warm-label" for="req-name">Nom complet</label>
                <input id="req-name" type="text" [(ngModel)]="requestName" placeholder="Ex: Awa Ndiaye" class="warm-input" />
              </div>

              <div class="warm-field">
                <label class="warm-label" for="req-user">Nom d'utilisateur</label>
                <input id="req-user" type="text" [(ngModel)]="requestUsername" placeholder="Ex: awandiaye" class="warm-input" style="text-transform: lowercase" />
              </div>

              <div class="warm-field">
                <label class="warm-label" for="req-pass">Code d'accès / Mot de passe</label>
                <input id="req-pass" type="password" [(ngModel)]="requestPassword" placeholder="Minimum 6 caractères" class="warm-input" />
              </div>

              <div class="warm-field">
                <label class="warm-label" for="req-level">Niveau d'anglais / Rôle</label>
                <select id="req-level" [(ngModel)]="requestLevel" class="warm-input">
                  <option value="A1">A1 — Débutant</option>
                  <option value="A2">A2 — Élémentaire</option>
                  <option value="B1">B1 — Intermédiaire</option>
                  <option value="B2">B2 — Intermédiaire Supérieur</option>
                  <option value="Guest">Guest / Invité (Accès libre)</option>
                  <option value="Teacher">Professeur — Demande d'enrôlement 🎓</option>
                </select>
              </div>

              <div class="warm-field">
                <label class="warm-label">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#25D366" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:4px"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> Numéro WhatsApp / Téléphone
                </label>
                <input id="req-phone" type="tel" [(ngModel)]="requestPhone" placeholder="Ex: +221 77 123 45 67" class="warm-input" />
              </div>

              <div class="warm-field">
                <label class="warm-label" for="req-country">Pays d'origine</label>
                <select id="req-country" [(ngModel)]="requestCountry" class="warm-input">
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
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle; margin-right:6px"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg> Créer mon compte & Commencer
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

    if (match.status === 'suspended' || (match.blocked && match.role !== 'student')) {
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

    // Instant active access
    if (match.status === 'pending') {
      match.status = 'approved';
      this.db.updateUserProfile(match.id, { status: 'approved' });
    }

    if (match.status === 'rejected') {
      this.dialogService.alert(
        'Inscription Refusée ❌',
        "Votre demande d'inscription a été refusée par l'administrateur. Veuillez contacter l'équipe SpeakUp pour plus d'informations.",
        'info'
      );
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
      this.isLoading.set(true);
      const user = await this.db.loginWithGoogle('student');
      this.isLoading.set(false);
    } catch (err: any) {
      this.isLoading.set(false);
      console.error('Google Sign-In failed:', err);
      const msg = err.message || '';
      if (msg.includes('validation') || msg.includes('pending') || msg.includes('attente')) {
        this.isSuccessModalOpen.set(true);
      } else {
        this.dialogService.alert('Connexion Google échouée ❌', msg || 'Une erreur est survenue lors de la connexion.', 'info');
      }
    }
  }

  requestPhone = '';

  guestLogin() {
    window.location.hash = '#/guest-login';
  }

  submitRequest() {
    const name = this.requestName.trim();
    const username = this.requestUsername.trim().toLowerCase();
    const password = this.requestPassword.trim();
    const phone = this.requestPhone.trim();
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
    if (!phone) {
      this.dialogService.alert('Erreur', 'Veuillez saisir votre numéro WhatsApp / Téléphone.', 'info');
      return;
    }

    const role = level === 'Teacher' ? 'teacher' : 'student';

    this.db.registerUserProfile(name, username, password, level, country, role, phone)
      .then((newProfile) => {
        this.closeRequestModal();
        this.db.setCurrentUser(newProfile.id);
        this.dialogService.alert(
          "Bienvenue sur SpeakUp 🎉",
          `Votre compte a été créé avec succès ! Bienvenue ${newProfile.name}, vous êtes maintenant connecté.`,
          "success"
        );
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
    this.requestPhone = '';
    this.requestLevel = 'B1';
    this.requestCountry = '🇸🇳';
  }
}
