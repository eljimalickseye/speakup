import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { DatabaseService, UserProfile, Lesson, Quiz, Announcement, LiveClass } from '../../services/database.service';
import { CommonModule } from '@angular/common';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <!-- MIGRATION XP WARNING NOTICE -->
      @if (showXpMigrationNotice()) {
        <div class="card" style="background: linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%); border: 1.5px solid #F59E0B; margin-bottom: 24px; padding: 16px 20px; border-radius: 14px; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.05); display: flex; align-items: center; justify-content: space-between; gap: 16px; animation: slideDown 0.2s ease-out">
          <div style="display:flex; align-items:center; gap:12px; flex:1">
            <span style="font-size:24px">⚡</span>
            <div>
              <h4 style="margin: 0; color: #78350F; font-size: 13.5px; font-weight: 800;">
                Mise à jour du classement (XP)
              </h4>
              <p style="margin: 2px 0 0 0; color: #92400E; font-size: 12px; line-height: 1.4; font-weight: 600;">
                Les points de classement (XP) ont été recalculés pour ne comptabiliser qu'une seule tentative par exercice ou quiz. Les doublons ont été nettoyés pour garantir un classement équitable.
              </p>
            </div>
          </div>
          <button (click)="dismissXpMigrationNotice()" style="background:none; border:none; color:#B45309; font-size:16px; cursor:pointer; font-weight:800; padding:4px 8px; border-radius:4px" onmouseover="this.style.background='rgba(180, 83, 9, 0.1)'" onmouseout="this.style.background='none'">×</button>
        </div>
      }
      <!-- Welcome Banner -->
      <div class="welcome" style="display:flex; justify-content:space-between; align-items:center; gap:20px; flex-wrap:wrap">
        <div style="flex:1; min-width:250px">
          <h2 style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:8px">
            <span>Good morning, {{ currentUser()?.name }}</span>
            @if (getFlagUrl(currentUser()?.countryFlag)) {
              <img [src]="getFlagUrl(currentUser()?.countryFlag)" style="width: 22px; height: 16px; object-fit: contain; border-radius: 2px" alt="flag">
            }
            <span>!</span>
          </h2>
          <p>Your English journey is progressing beautifully. Today's challenge is waiting for you.</p>
          <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap">
            <button class="cta" (click)="goToLiveClass()">Join today's live class →</button>
            <button class="cta" style="background:#0D9488; border-color:#0D9488" (click)="onTaskClick('chat-teacher')">
              <i class="ti ti-messages"></i> Contacter le professeur
            </button>
          </div>
        </div>

        <!-- Quick Profile flag selector card -->
        <div class="card" style="background:#FFF; border:1px solid #E0E7FF; padding:12px 16px; border-radius:12px; width:220px; color:#1F2937; margin-bottom:0; box-shadow:0 2px 4px rgba(0,0,0,0.02)">
          <h4 style="font-size:10px; text-transform:uppercase; font-weight:700; margin-bottom:8px; opacity:0.85; letter-spacing:0.03em; display:flex; align-items:center; gap:6px; color:#4F46E5">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width:12px; height:12px; vertical-align:middle">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <span>Select your flag</span>
          </h4>
          <select [value]="currentUser()?.countryFlag || ''" (change)="updateFlag($event)" style="width:100%; background:#FFF; border:1px solid #CBD5E1; padding:6px 10px; border-radius:6px; font-size:12px; color:#1F2937; font-weight:600; outline:none">
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
            <option value="🇳🇪">Niger 🇳🇪</option>
            <option value="🇫🇷">France 🇫🇷</option>
          </select>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid3">
        <div class="card">
          <div class="card-label">XP points</div>
          <div class="card-value">{{ currentUser()?.xp | number:'1.0-0' }}</div>
          <div class="card-sub">Rank: {{ getStudentRank() }} on leaderboard</div>
        </div>
        <div class="card">
          <div class="card-label">Streak</div>
          <div class="card-value">{{ currentUser()?.streak || 0 }} days 🔥</div>
          <div class="card-sub">Daily practice streak</div>
        </div>
        <div class="card">
          <div class="card-label">Fluency level</div>
          <div class="card-value">{{ currentUser()?.level || 'B1' }}</div>
          <div class="card-sub">{{ getLevelName(currentUser()?.level) }}</div>
        </div>
      </div>

      <!-- LIVE & AI WORKSPACE PALETTE -->
      <div class="card live-palette-card" style="background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 100%); border: 1.5px solid #4F46E5; padding: 22px; border-radius: 16px; margin-top: 24px; color: white; position: relative; overflow: hidden; box-shadow: 0 12px 30px rgba(79, 70, 229, 0.15)">
        <div style="position: absolute; top: -40px; right: -40px; width: 120px; height: 120px; background: rgba(79, 70, 229, 0.08); border-radius: 50%; filter: blur(20px);"></div>
        
        <h3 style="font-size: 15px; font-weight: 850; margin: 0 0 6px 0; color: #38BDF8; display: flex; align-items: center; gap: 8px">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="pulse-live-icon"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          <span>{{ t('Palette de Sessions en Direct', 'Live Classes & AI Workspace') }}</span>
        </h3>
        <p style="font-size: 12px; color: #94A3B8; margin: 0 0 16px 0; line-height: 1.4">
          {{ t("Accédez instantanément à vos directs de groupe, rejoignez un cours privé one-to-one avec votre prof ou pratiquez l'oral en tête-à-tête avec votre tuteur IA.", "Instantly join group live classes, access private one-to-one calls with your teacher, or practice speaking with your personal AI Tutor.") }}
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px">
          <!-- 1. AI Practice Live (Hidden during testing) -->
          @if (false) {
            <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px">
              <div>
                <div style="font-size: 13px; font-weight: 800; color: #E2E8F0; display: flex; align-items: center; gap: 6px">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4m0 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 8h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z"/><circle cx="8.5" cy="13.5" r="1.5" fill="#A78BFA"/><circle cx="15.5" cy="13.5" r="1.5" fill="#A78BFA"/><path d="M9 17h6"/></svg>
                  <span>{{ t("Tête-à-tête avec l'IA", "One-on-One with AI") }}</span>
                </div>
                <p style="font-size: 11px; color: #94A3B8; margin: 4px 0 0 0">
                  {{ t('Session vocale privée avec speakUp-bot pour parler anglais sans stress.', 'Private voice room with speakUp-bot to practice speaking without stress.') }}
                </p>
              </div>
              <button (click)="startAiPractice()" style="width: 100%; height: 32px; background: linear-gradient(90deg, #7C3AED, #DB2777); border: none; color: white; border-radius: 6px; font-size: 11px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 4px 10px rgba(124, 58, 237, 0.25)">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                <span>{{ t("S'entraîner avec l'IA", "Practice with AI") }}</span>
              </button>
            </div>
          }

          <!-- 2. Active Group Live Class -->
          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px">
            <div>
              <div style="font-size: 13px; font-weight: 800; color: #E2E8F0; display: flex; align-items: center; gap: 6px">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #EF4444; display: inline-block" [class.pulse-active]="isLiveActive()"></span>
                <span>{{ t('Cours Collectif', 'Group Live Class') }}</span>
              </div>
              <p style="font-size: 11px; color: #94A3B8; margin: 4px 0 0 0">
                @if (isLiveActive()) {
                  {{ t('Un cours collectif est actuellement actif. Rejoignez le groupe !', 'A group class is currently active. Join the class!') }}
                } @else {
                  {{ t('Aucun cours collectif actif en ce moment.', 'No group class active right now.') }}
                }
              </p>
            </div>
            <button (click)="goToLiveClass()" 
                    [style.background]="isLiveActive() ? '#10B981' : '#334155'"
                    [style.cursor]="isLiveActive() ? 'pointer' : 'not-allowed'"
                    [disabled]="!isLiveActive()"
                    style="width: 100%; height: 32px; border: none; color: white; border-radius: 6px; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
              <span>{{ isLiveActive() ? t('Rejoindre la Classe', 'Join Class') : t('Aucun Live', 'No Active Live') }}</span>
            </button>
          </div>

          <!-- 3. One-to-One Private call with Teacher -->
          <div style="background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; justify-content: space-between; gap: 12px">
            <div>
              <div style="font-size: 13px; font-weight: 800; color: #E2E8F0; display: flex; align-items: center; gap: 6px">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0EA5E9" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <span>{{ t('Cours One-to-One', 'One-to-One Session') }}</span>
              </div>
              <p style="font-size: 11px; color: #94A3B8; margin: 4px 0 0 0">
                @if (isOneToOneActive()) {
                  {{ t('Votre professeur vous a invité à rejoindre un appel privé.', 'Your teacher invited you to a private live call.') }}
                } @else {
                  {{ t('Pas de session privée active. Rejoignez depuis le chat.', 'No active private session. Join from chat messages.') }}
                }
              </p>
            </div>
            <button (click)="joinOneToOne()" 
                    [style.background]="isOneToOneActive() ? '#0EA5E9' : '#334155'"
                    [style.cursor]="isOneToOneActive() ? 'pointer' : 'not-allowed'"
                    [disabled]="!isOneToOneActive()"
                    style="width: 100%; height: 32px; border: none; color: white; border-radius: 6px; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 6px">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span>{{ isOneToOneActive() ? t("Rejoindre l'Appel", "Join Private Call") : t('Aucun Appel', 'No Private Call') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- CERTIFICATE SYSTEM PRESENTATION WIDGET -->
      <div class="card" style="background: linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%); border: 1.5px solid #C084FC; padding: 20px; border-radius: 14px; margin-top: 20px; position:relative; overflow:hidden">
        <!-- background decorative badge -->
        <div style="position:absolute; right:-10px; bottom:-10px; opacity:0.04; color:#8B5CF6">
          <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/></svg>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; gap:20px; flex-wrap:wrap">
          <div style="flex:1">
            <span class="badge" style="background:#8B5CF6; color:white; font-size:10px; font-weight:800; padding:2px 8px; border-radius:20px; text-transform:uppercase">
              {{ t('Parcours Académique', 'Academic Certificates') }}
            </span>
            <h3 style="font-size:15.5px; font-weight:800; color:#4C1D95; margin:6px 0 4px 0">
              {{ t("Obtenez vos Certificats Officiels SpeakUp", "Unlock Official SpeakUp Certificates") }}
            </h3>
            <p style="font-size:12.5px; color:#5B21B6; margin:0; line-height:1.4">
              {{ t("Validez chaque niveau d'anglais (A1, A2, B1, B2) pour obtenir un certificat de compétence verifiable et l'ajouter directement à votre profil LinkedIn.", "Pass each English level evaluation (A1, A2, B1, B2) to get a verifiable certificate of proficiency and add it directly to your LinkedIn profile.") }}
            </p>
          </div>

          <!-- Info indicator -->
          <div style="display:flex; align-items:center; gap:12px; background:white; padding:10px 14px; border-radius:10px; border:1px solid #E9D5FF; width: 100%">
            <div style="text-align:left; flex-shrink: 0">
              <span style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase">{{ t('Niveau actuel', 'Current level') }}</span>
              <div style="font-size:14px; font-weight:800; color:#8B5CF6">{{ currentUser()?.level || 'A1' }}</div>
            </div>
            <div style="font-size:11px; color:#5B21B6; font-weight:600; line-height:1.3; flex:1; text-align:right">
              💡 {{ t('Les certificats officiels sont remis par votre professeur après validation de vos examens.', 'Official certificates are issued by your teacher after validating your exams.') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Grid layout for Tasks vs Announcements -->
      <div class="grid-content-split">
        
        <!-- Left: Today's Tasks -->
        <div>
          <div class="section-title">Today's tasks</div>
          
          <div class="lesson-item" (click)="onTaskClick('speaking')">
            <div class="lesson-icon teal"><i class="ti ti-microphone" aria-hidden="true"></i></div>
            <div class="lesson-info">
              <div class="lesson-title">Daily speaking challenge</div>
              <div class="lesson-meta">Record your response to the daily voice prompt</div>
            </div>
            <span class="pill due">Daily</span>
          </div>

          <!-- Dynamic Lessons -->
          @for (lesson of lessons().slice(0, 2); track lesson.id) {
            <div class="lesson-item" (click)="onTaskClick('lessons')">
              <div class="lesson-icon purple"><i class="ti ti-book" aria-hidden="true"></i></div>
              <div class="lesson-info">
              <div class="lesson-title">Lesson: {{ lesson.title }}</div>
              <div class="lesson-meta">{{ lesson.type }} · Level {{ lesson.level }}</div>
            </div>
              <span class="pill new">Study</span>
            </div>
          }

          <!-- Dynamic Quizzes -->
          @for (quiz of quizzes().slice(0, 2); track quiz.id) {
            <div class="lesson-item" (click)="onTaskClick('exercises')">
              <div class="lesson-icon amber"><i class="ti ti-pencil" aria-hidden="true"></i></div>
              <div class="lesson-info">
                <div class="lesson-title">Quiz: {{ quiz.title }}</div>
                <div class="lesson-meta">{{ quiz.questions.length }} questions available</div>
              </div>
              <span class="pill done" style="background:#EEF2FF; color:#4F46E5">Quiz</span>
            </div>
          }

          @if (lessons().length === 0 && quizzes().length === 0) {
            <div style="padding: 24px; background: var(--surface-2); border-radius: 8px; border: 1px dashed var(--border); text-align: center; font-size: 12px; color: var(--text-secondary); margin-top: 10px">
              No lessons or quizzes assigned yet. Try the daily speaking challenge!
            </div>
          }
        </div>

        <!-- Right: School Announcements (History) -->
        <div>
          <div class="section-title" style="display:flex; align-items:center; justify-content:space-between">
            <span>📢 Annonces récentes</span>
            @if (announcements().length > 0) {
              <span style="font-size:10px; background:#EEF2FF; color:#4F46E5; padding:2px 8px; border-radius:20px; font-weight:700">
                {{ announcements().length }}
              </span>
            }
          </div>
          <div style="display:flex; flex-direction:column; gap:10px">
            @for (ann of announcements().slice(0,4); track ann.id) {
              <div class="ann-dash-card" (click)="selectedAnn.set(ann)"
                   [style.border-left]="'4px solid ' + getDashPriorityColor(ann.priority)">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px; gap:6px">
                  <h4 style="font-size:12px; font-weight:700; color:var(--text-primary); margin:0; flex:1; line-height:1.3">{{ ann.title }}</h4>
                  <span style="font-size:9px; color:var(--text-muted); flex-shrink:0">{{ ann.createdAt | date:'shortDate' }}</span>
                </div>
                <p style="font-size:11px; color:var(--text-secondary); line-height:1.4; margin:0; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden">{{ ann.message }}</p>
                <div style="font-size:10px; color:#4F46E5; font-weight:600; margin-top:6px">Voir →</div>
              </div>
            } @empty {
              <div style="padding: 24px; background: var(--surface-2); border-radius: 8px; border: 1px dashed var(--border); text-align: center; font-size: 12px; color: var(--text-secondary)">
                Aucune annonce du professeur pour le moment.
              </div>
            }
          </div>
        </div>

      </div>

    </div>

    <!-- Announcement Modal -->
    @if (selectedAnn()) {
      <div style="position:fixed; inset:0; background:rgba(0,0,0,0.58); backdrop-filter:blur(5px); z-index:1100; display:flex; align-items:center; justify-content:center; padding:20px; animation:fadeIn 0.18s ease" (click)="selectedAnn.set(null)">
        <div style="background:var(--surface-1); border-radius:18px; width:100%; max-width:560px; max-height:85vh; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 30px 70px rgba(0,0,0,0.35); animation:slideUp 0.22s ease" (click)="$event.stopPropagation()">
          <!-- Banner -->
          <div [style.background]="getDashPriorityGradient(selectedAnn()!.priority)" style="padding:18px 22px; display:flex; justify-content:space-between; align-items:center">
            <span style="font-size:11px; font-weight:700; padding:4px 12px; border-radius:20px; text-transform:uppercase" [style.background]="getDashPriorityBg(selectedAnn()!.priority)" [style.color]="getDashPriorityColor(selectedAnn()!.priority)">
              {{ getDashPriorityIcon(selectedAnn()!.priority) }} {{ selectedAnn()!.priority }}
            </span>
            <button (click)="selectedAnn.set(null)" style="background:rgba(255,255,255,0.22); border:none; color:white; width:32px; height:32px; border-radius:50%; cursor:pointer; font-size:14px">✕</button>
          </div>
          <!-- Body -->
          <div style="padding:22px; overflow-y:auto; flex:1">
            <h2 style="font-size:18px; font-weight:800; color:var(--text-primary); margin:0 0 6px 0">{{ selectedAnn()!.title }}</h2>
            <div style="font-size:11px; color:var(--text-muted); margin-bottom:18px; display:flex; gap:10px">
              <span><i class="ti ti-calendar"></i> {{ selectedAnn()!.createdAt | date:'fullDate' }}</span>
              <span>·</span>
              <span><i class="ti ti-users"></i> {{ selectedAnn()!.sendTo }}</span>
            </div>
            @if (selectedAnn()!.imageUrl) {
              <div style="width:100%; max-height:280px; overflow:hidden; border-radius:10px; margin-bottom:18px; border:1px solid var(--border-weak)">
                <img [src]="selectedAnn()!.imageUrl" style="width:100%; height:auto; max-height:280px; object-fit:contain" alt="Flyer">
              </div>
            }
            <div style="font-size:13.5px; color:var(--text-secondary); line-height:1.8; white-space:pre-line">{{ selectedAnn()!.message }}</div>
            <div style="margin-top:22px; padding-top:16px; border-top:1px solid var(--border-weak); display:flex; justify-content:flex-end">
              <button class="btn-p" style="height:auto; padding:8px 20px; font-size:13px" (click)="selectedAnn.set(null)">Fermer</button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
    @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
    @keyframes slideUp { from { transform:translateY(22px); opacity:0 } to { transform:translateY(0); opacity:1 } }
    .ann-dash-card {
      background: var(--surface-1);
      border-radius: 10px;
      padding: 12px 14px;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      border: 1px solid var(--border-weak);
    }
    .ann-dash-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0,0,0,0.1);
    }
    .grid-content-split {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 20px;
      align-items: start;
    }
    @media (max-width: 768px) {
      .grid-content-split {
        grid-template-columns: 1fr;
      }
    }
    .pulse-live-icon {
      color: #EF4444;
      animation: pulse-recording 1.5s infinite;
    }
    @keyframes pulse-recording {
      0% { opacity: 1; }
      50% { opacity: 0.4; }
      100% { opacity: 1; }
    }
    .pulse-active {
      box-shadow: 0 0 8px #EF4444;
      animation: dot-pulse-active 1.2s infinite alternate;
    }
    @keyframes dot-pulse-active {
      from { transform: scale(0.8); opacity: 0.5; }
      to { transform: scale(1.2); opacity: 1; }
    }
    `
  ]
})
export class StudentDashboardComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);
  currentUser = signal<UserProfile | null>(null);
  activeLang = this.db.activeLang;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

  lessons = signal<Lesson[]>([]);
  quizzes = signal<Quiz[]>([]);
  announcements = signal<Announcement[]>([]);
  selectedAnn = signal<Announcement | null>(null);
  allUsers = signal<UserProfile[]>([]);

  // Live Access Palette Signals
  activeJitsiCall = signal<LiveClass | null>(null);

  showXpMigrationNotice = signal<boolean>(localStorage.getItem('speak_dismiss_xp_migration_notice_v1') !== 'true');

  @Output() navigateToTab = new EventEmitter<string>();

  constructor() {
    this.db.observeCurrentUser().subscribe(user => {
      this.currentUser.set(user);
      this.loadAnnouncements();
    });

    this.db.observeUsers().subscribe(list => {
      this.allUsers.set(list);
    });

    this.db.observeLessons().subscribe(list => {
      this.lessons.set(list);
    });

    this.db.observeQuizzes().subscribe(list => {
      this.quizzes.set(list.filter(q => !q.isOfficialExam));
    });

    this.db.observeAnnouncements().subscribe(() => {
      this.loadAnnouncements();
    });

    this.db.observeActiveJitsiCall().subscribe(c => {
      this.activeJitsiCall.set(c);
    });
  }

  isLiveActive(): boolean {
    const call = this.activeJitsiCall();
    if (!call) return false;
    // Standard group call has status active and does not have the 'Live Call:' private prefix
    return call.status === 'active' && !call.title.includes('Live Call:');
  }

  isOneToOneActive(): boolean {
    const call = this.activeJitsiCall();
    if (!call) return false;
    // Private one-to-one calls created from chat will have 'Live Call:' in the title
    return call.status === 'active' && call.title.includes('Live Call:');
  }

  async startAiPractice() {
    const user = this.currentUser();
    if (!user) return;
    
    try {
      const liveClass = await this.db.startAiPracticeCall(user.name);
      this.db.setActiveJitsiCall(liveClass);
      this.navigateToTab.emit('live-classes');
    } catch (e: any) {
      this.dialogService.alert('Failed to Start AI Session', e.message || 'Error occurred starting AI live session.', 'info');
    }
  }

  joinOneToOne() {
    const call = this.activeJitsiCall();
    if (call && this.isOneToOneActive()) {
      this.db.setActiveJitsiCall(call);
      this.navigateToTab.emit('live-classes');
    }
  }

  goToLiveClass() {
    const call = this.activeJitsiCall();
    if (call && this.isLiveActive()) {
      this.db.setActiveJitsiCall(call);
      this.navigateToTab.emit('live-classes');
    } else {
      // Fallback: navigate to live classes schedules list
      this.navigateToTab.emit('live-classes');
    }
  }

  private loadAnnouncements() {
    const user = this.currentUser();
    if (!user) return;
    this.db.observeAnnouncements().subscribe(list => {
      // Filter announcements targeting this student or everyone
      const filtered = list.filter(ann => 
        ann.sendTo === 'all' || 
        ann.sendTo === 'All students' || 
        ann.sendTo === user.level || 
        ann.sendTo === `${user.level} class only` || 
        ann.sendTo.toLowerCase().includes(user.level.toLowerCase())
      );
      this.announcements.set(filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
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

  getLevelName(level: string | undefined): string {
    if (!level) return 'Intermediate';
    switch (level) {
      case 'A1': return 'Beginner';
      case 'A2': return 'Elementary';
      case 'B1': return 'Intermediate';
      case 'B2': return 'Upper Intermediate';
      case 'C1':
      case 'C2': return 'Advanced / Fluent';
      default: return 'Intermediate';
    }
  }

  getStudentRank(): string {
    const user = this.currentUser();
    if (!user) return '#1';
    const sorted = [...this.allUsers()]
      .filter(u => u.role === 'student')
      .sort((a, b) => Math.round(b.xp || 0) - Math.round(a.xp || 0));
    const index = sorted.findIndex(u => u.id === user.id);
    return index !== -1 ? `#${index + 1}` : '#1';
  }

  updateFlag(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.db.updateCurrentUserProfile({ countryFlag: select.value });
  }



  onTaskClick(tabName: string) {
    this.navigateToTab.emit(tabName);
  }

  dismissXpMigrationNotice() {
    this.showXpMigrationNotice.set(false);
    localStorage.setItem('speak_dismiss_xp_migration_notice_v1', 'true');
  }

  // Announcement Priority Helper Methods
  getDashPriorityColor(priority: string): string {
    const map: Record<string, string> = {
      'High': '#EF4444',
      'Medium': '#F59E0B',
      'Low': '#10B981',
      'urgent': '#DC2626',
      'important': '#D97706',
      'normal': '#059669'
    };
    return map[priority] || '#4F46E5';
  }

  getDashPriorityGradient(priority: string): string {
    const map: Record<string, string> = {
      'High': 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
      'Medium': 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
      'Low': 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
      'urgent': 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
      'important': 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
      'normal': 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)'
    };
    return map[priority] || 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)';
  }

  getDashPriorityBg(priority: string): string {
    const map: Record<string, string> = {
      'High': '#FEE2E2',
      'Medium': '#FEF3C7',
      'Low': '#D1FAE5',
      'urgent': '#FEE2E2',
      'important': '#FEF3C7',
      'normal': '#D1FAE5'
    };
    return map[priority] || '#EEF2FF';
  }

  getDashPriorityIcon(priority: string): string {
    const map: Record<string, string> = {
      'High': '🔴',
      'Medium': '🟡',
      'Low': '🟢',
      'urgent': '⚠️',
      'important': '📌',
      'normal': 'ℹ️'
    };
    return map[priority] || '📢';
  }
}
