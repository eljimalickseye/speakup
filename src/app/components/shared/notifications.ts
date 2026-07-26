import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, AppNotification, UserProfile } from '../../services/database.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Notification Bell Icon + Badge -->
    <div class="notif-bell-wrapper" (click)="togglePanel()" [title]="t('Notifications', 'Notifications')">
      <button class="notif-bell-btn" [class.active]="isPanelOpen()">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </button>
      @if (unreadCount() > 0) {
        <span class="notif-badge">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
      }
    </div>

    <!-- Notification Dropdown Panel -->
    @if (isPanelOpen()) {
      <div class="notif-backdrop" (click)="closePanel()"></div>
      <div class="notif-panel">
        <div class="notif-panel-header">
          <div class="notif-panel-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span>{{ t('Notifications', 'Notifications') }}</span>
            @if (unreadCount() > 0) {
              <span class="notif-count-badge">{{ unreadCount() }}</span>
            }
          </div>
          @if (unreadCount() > 0) {
            <button class="notif-mark-all-btn" (click)="markAllRead(); $event.stopPropagation()">
              {{ t('Tout lire', 'Mark all read') }}
            </button>
          }
        </div>

        <div class="notif-list">
          @if (userNotifications().length === 0) {
            <div class="notif-empty">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="margin-bottom:8px"><path d="M13.73 21a2 2 0 0 1-3.46 0"/><path d="M18.63 13A17.89 17.89 0 0 1 18 8"/><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <p style="font-size:12px; color:var(--text-muted)">{{ t('Aucune notification pour l\'instant', 'No notifications for now') }}</p>
            </div>
          } @else {
            @for (notif of userNotifications(); track notif.id) {
              <div 
                class="notif-item"
                [class.unread]="!notif.read"
                (click)="navigateToNotification(notif); closePanel(); $event.stopPropagation()"
                style="position:relative"
              >
                <div class="notif-icon" [class]="getNotifIconClass(notif.type)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" [innerHTML]="getNotifSvgPath(notif.type)"></svg>
                </div>
                <div class="notif-content">
                  <div class="notif-title">{{ getNotifTitle(notif) }}</div>
                  <div class="notif-message">{{ getNotifMessage(notif) }}</div>
                  <div class="notif-time">{{ formatTime(notif.createdAt) }}</div>
                </div>
                @if (!notif.read) {
                  <div class="notif-dot"></div>
                }
                <button 
                  class="notif-delete-btn"
                  (click)="deleteNotif(notif.id); $event.stopPropagation()"
                  [title]="t('Supprimer', 'Delete')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            }

          }
        </div>
      </div>
    }

    <!-- Real-time Toast Notifications Overlay -->
    <div class="toast-container">
      @for (toast of activeToasts(); track toast.id) {
        <div class="toast-item" (click)="navigateToNotification(toast); removeToast(toast.id)">
          <div class="toast-icon-box" [class]="getNotifIconClass(toast.type)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" [innerHTML]="getNotifSvgPath(toast.type)"></svg>
          </div>
          <div class="toast-body">
            <div class="toast-title">{{ getNotifTitle(toast) }}</div>
            <div class="toast-message">{{ getNotifMessage(toast) }}</div>
          </div>
          <button class="toast-close" (click)="$event.stopPropagation(); removeToast(toast.id)">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      }
    </div>

    <!-- New Notification Modal -->
    @if (activeModalNotif(); as modalNotif) {
      <div class="notif-modal-overlay" (click)="closeModalNotif()">
        <div class="notif-modal-card" (click)="$event.stopPropagation()">
          <div class="notif-modal-header" [class]="getNotifIconClass(modalNotif.type)">
            <div style="width:36px; height:36px; border-radius:50%; background:rgba(255,255,255,0.2); display:flex; align-items:center; justify-content:center; color:white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" [innerHTML]="getNotifSvgPath(modalNotif.type)"></svg>
            </div>
            <h4 style="margin:0; font-size:16px; font-weight:800">{{ getNotifTitle(modalNotif) }}</h4>
          </div>
          
          <div class="notif-modal-body">
            <p style="margin:0; font-size:13.5px; color:var(--text-secondary); line-height:1.6">{{ getNotifMessage(modalNotif) }}</p>
          </div>
          
          <div class="notif-modal-actions">
            <button class="notif-btn-secondary" (click)="closeModalNotif()">{{ t("Fermer", "Close") }}</button>
            @if (hasRedirectLink(modalNotif)) {
              <button class="notif-btn-primary" (click)="navigateToNotification(modalNotif)">{{ t("Accéder à la Mission ✈️", "Go to Mission ✈️") }}</button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      position: relative;
      display: inline-block;
    }

    .notif-bell-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .notif-bell-btn {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface-1);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.2s ease;
    }

    .notif-bell-btn:hover,
    .notif-bell-btn.active {
      background: #EEF2FF;
      border-color: #4F46E5;
      color: #4F46E5;
    }

    .notif-badge {
      position: absolute;
      top: -6px;
      right: -6px;
      background: #EF4444;
      color: white;
      font-size: 9px;
      font-weight: 700;
      min-width: 16px;
      height: 16px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      border: 2px solid var(--surface-1);
    }

    .notif-backdrop {
      position: fixed;
      inset: 0;
      z-index: 99990;
    }

    .notif-panel {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 340px;
      max-height: 440px;
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.15);
      z-index: 99991;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: fadeIn 0.2s ease-out;
    }

    .notif-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-weak);
      background: var(--surface-2);
    }

    .notif-panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13.5px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .notif-count-badge {
      background: #EEF2FF;
      color: #4F46E5;
      font-size: 11px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 10px;
    }

    .notif-mark-all-btn {
      background: none;
      border: none;
      color: #4F46E5;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
    }
    .notif-mark-all-btn:hover {
      text-decoration: underline;
    }

    .notif-list {
      overflow-y: auto;
      flex: 1;
      max-height: 380px;
    }

    .notif-empty {
      padding: 32px 16px;
      text-align: center;
    }

    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-weak);
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .notif-item:hover {
      background: var(--surface-2);
    }

    .notif-item.unread {
      background: rgba(99,102,241,0.05);
    }

    .notif-icon {
      width: 32px;
      height: 32px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notif-icon.info { background: #EEF2FF; color: #4F46E5; }
    .notif-icon.success { background: #D1FAE5; color: #059669; }
    .notif-icon.purple { background: #F3E8FF; color: #7C3AED; }
    .notif-icon.warning { background: #FEF3C7; color: #D97706; }
    .notif-icon.danger { background: #FEE2E2; color: #DC2626; }

    .notif-content {
      flex: 1;
      min-width: 0;
    }

    .notif-title {
      font-size: 12.5px;
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: 2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .notif-message {
      font-size: 11.5px;
      color: var(--text-secondary);
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notif-time {
      font-size: 10px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .notif-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #4F46E5;
      margin-top: 6px;
    }

    .notif-delete-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 11px;
      cursor: pointer;
      opacity: 0.5;
      padding: 2px;
    }

    .notif-delete-btn:hover {
      opacity: 1;
      color: #EF4444;
    }

    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }

    .toast-item {
      pointer-events: auto;
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 16px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 280px;
      max-width: 360px;
      cursor: pointer;
      animation: slideIn 0.25s ease-out;
    }

    .toast-icon-box {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .toast-body {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-size: 12.5px;
      font-weight: 800;
      color: var(--text-primary);
    }

    .toast-message {
      font-size: 11px;
      color: var(--text-secondary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      opacity: 0.5;
    }
    .toast-close:hover { opacity: 1; }

    .notif-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15,23,42,0.65);
      backdrop-filter: blur(6px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .notif-modal-card {
      background: var(--surface-1);
      border-radius: 18px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
      overflow: hidden;
    }

    .notif-modal-header {
      padding: 18px 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: white;
    }

    .notif-modal-header.info { background: linear-gradient(135deg, #4F46E5, #6366F1); }
    .notif-modal-header.success { background: linear-gradient(135deg, #059669, #10B981); }
    .notif-modal-header.purple { background: linear-gradient(135deg, #7C3AED, #8B5CF6); }
    .notif-modal-header.warning { background: linear-gradient(135deg, #D97706, #F59E0B); }
    .notif-modal-header.danger { background: linear-gradient(135deg, #DC2626, #EF4444); }

    .notif-modal-body {
      padding: 20px;
    }

    .notif-modal-actions {
      padding: 14px 20px;
      border-top: 1px solid var(--border-weak);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      background: var(--surface-2);
    }

    .notif-btn-secondary {
      background: none;
      border: 1px solid var(--border);
      color: var(--text-secondary);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
    }

    .notif-btn-primary {
      background: #4F46E5;
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
    }
  `]
})
export class NotificationsComponent {
  public db = inject(DatabaseService);

  isPanelOpen = signal<boolean>(false);
  currentUser = signal<UserProfile | null>(null);
  activeToasts = signal<AppNotification[]>([]);
  activeModalNotif = signal<AppNotification | null>(null);
  activeLang = this.db.activeLang;

  private previousUnreadCount = 0;
  private isFirstLoad = true;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

  constructor() {
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));

    this.db.observeNotifications().subscribe(allNotifs => {
      const currentUnread = this.userNotifications().filter(n => !n.read);
      
      if (this.isFirstLoad) {
        if (this.currentUser()) {
          this.previousUnreadCount = currentUnread.length;
          this.isFirstLoad = false;
        }
        return;
      }

      if (currentUnread.length > this.previousUnreadCount) {
        const diffCount = currentUnread.length - this.previousUnreadCount;
        const newNotifs = currentUnread.slice(0, diffCount);
        newNotifs.forEach(n => this.onNewNotification(n));
      }
      this.previousUnreadCount = currentUnread.length;
    });
  }

  userNotifications = computed<AppNotification[]>(() => {
    const user = this.currentUser();
    if (!user) return [];
    return this.db.getNotificationsForUser(user.id, user.role);
  });

  unreadCount = computed<number>(() => {
    return this.userNotifications().filter(n => !n.read).length;
  });

  togglePanel() {
    this.isPanelOpen.update(v => !v);
  }

  closePanel() {
    this.isPanelOpen.set(false);
  }

  onNewNotification(n: AppNotification) {
    this.showToast(n);
    this.playNotificationSound();
    this.activeModalNotif.set(n);
  }

  playNotificationSound() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc1.start(now);
      osc1.stop(now + 0.35);
      
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.12);
      gain2.gain.setValueAtTime(0.15, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.42);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.47);
    } catch (e) {
      console.warn('Notification sound failed', e);
    }
  }

  closeModalNotif() {
    const modalNotif = this.activeModalNotif();
    if (modalNotif) {
      this.markRead(modalNotif);
    }
    this.activeModalNotif.set(null);
  }

  hasRedirectLink(n: AppNotification): boolean {
    return true;
  }

  getTargetTab(type: AppNotification['type'], n?: AppNotification): string | null {
    if (type === 'journey_unlocked' || type === 'journey_mission' || n?.link?.includes('journey')) {
      return 'journey';
    }
    if (type === 'live_started' || n?.link?.includes('live')) {
      return 'live-classes';
    }

    const role = this.currentUser()?.role;
    if (role === 'student') {
      if (type === 'exercise_assigned') return 'exercises';
      if (type === 'quiz_available') return 'exercises';
      if (type === 'homework_graded' || type === 'grade_updated') return 'lessons';
      if (type === 'announcement') return 'announcements';
      if (type === 'new_comment') return 'chat';
    } else if (role === 'teacher') {
      if (type === 'homework_submitted') return 'grade-homework';
      if (type === 'exam_completed') return 'results';
    }
    return 'journey';
  }

  navigateToNotification(n: AppNotification) {
    this.markRead(n);
    this.activeModalNotif.set(null);
    this.closePanel();
    
    let link = n.link || this.getTargetTab(n.type, n);
    if (!link) {
      if (n.type === 'journey_unlocked' || n.type === 'journey_mission') link = 'journey';
      else if (n.type === 'live_started') link = 'live-classes';
      else if (n.type === 'exercise_assigned' || n.type === 'quiz_available') link = 'exercises';
      else if (n.type === 'homework_graded') link = 'lessons';
      else link = 'journey';
    }

    if (link.includes(':')) {
      const parts = link.split(':');
      const tab = parts[0];
      const targetId = parts[1];
      
      if (tab === 'journey') {
        this.db.requestedTabRedirect.set('journey');
      } else if (tab === 'exercises') {
        if (targetId.startsWith('quiz-') || targetId.startsWith('placement-test')) {
          this.db.requestedQuizIdRedirect.set(targetId);
        } else {
          this.db.requestedExerciseIdRedirect.set(targetId);
        }
        this.db.requestedTabRedirect.set('exercises');
      } else if (tab === 'exam') {
        this.db.requestedExamIdRedirect.set(targetId);
        this.db.requestedTabRedirect.set('exam');
      } else {
        this.db.requestedTabRedirect.set(tab);
      }
    } else {
      this.db.requestedTabRedirect.set(link);
    }
  }

  showToast(n: AppNotification) {
    if (this.activeToasts().some(t => t.id === n.id)) return;
    this.activeToasts.update(list => [...list, n]);
    setTimeout(() => {
      this.removeToast(n.id);
    }, 4500);
  }

  removeToast(id: string) {
    this.activeToasts.update(list => list.filter(t => t.id !== id));
  }

  markRead(notif: AppNotification) {
    if (!notif.read) {
      this.db.markNotificationRead(notif.id);
    }
  }

  markAllRead() {
    const user = this.currentUser();
    if (user) this.db.markAllNotificationsRead(user.id);
  }

  deleteNotif(notifId: string) {
    this.db.deleteNotification(notifId);
  }

  getNotifTitle(n: AppNotification): string {
    const isEn = this.activeLang() === 'en';
    if (n.type === 'journey_unlocked' || n.type === 'journey_mission' || n.link?.includes('journey')) {
      return isEn ? "New Travel Adventure!" : "Nouvelle Aventure de Voyage !";
    }
    if (n.type === 'live_started' || n.link?.includes('live')) {
      return isEn ? "Live Class Started!" : "Cours en Direct Démarré !";
    }
    if (n.type === 'homework_graded') {
      return isEn ? "Assignment Graded" : "Devoir Corrigé";
    }
    if (n.type === 'exercise_assigned') {
      return isEn ? "New Exercise Assigned" : "Nouvel Exercice Assigné";
    }
    if (n.type === 'quiz_available') {
      return isEn ? "New Quiz Available" : "Nouveau Quiz Disponible";
    }
    if (n.type === 'announcement') {
      return isEn ? "Announcement" : "Annonce";
    }
    if (n.type === 'reminder') {
      return isEn ? "Reminder" : "Rappel";
    }

    const titleMap: Record<string, { fr: string, en: string }> = {
      'Nouvel exercice': { fr: 'Nouvel exercice disponible', en: 'New exercise available' },
      'Cours en direct': { fr: 'Nouveau cours en direct', en: 'New live class scheduled' },
      'Aventure': { fr: 'Aventure de voyage disponible', en: 'Travel adventure available' },
      'Quiz': { fr: 'Quiz disponible', en: 'Quiz available' },
      'Devoir': { fr: 'Devoir corrigé', en: 'Homework graded' },
      'Bienvenue': { fr: 'Bienvenue sur SpeakUp !', en: 'Welcome to SpeakUp!' }
    };

    if (isEn) {
      for (const k in titleMap) {
        if (n.title.toLowerCase().includes(k.toLowerCase())) {
          return titleMap[k].en;
        }
      }
    }

    return n.title;
  }

  getNotifMessage(n: AppNotification): string {
    const isEn = this.activeLang() === 'en';
    if (n.type === 'journey_unlocked' || n.type === 'journey_mission' || n.link?.includes('journey')) {
      return isEn 
        ? "A new travel chapter is unlocked! Click to start the adventure."
        : "Un nouveau chapitre de voyage est disponible ! Cliquez pour commencer l'aventure.";
    }
    if (n.type === 'live_started' || n.link?.includes('live')) {
      return isEn
        ? "The live video session has started. Join your teacher!"
        : "La session vidéo en direct a commencé. Rejoignez votre professeur !";
    }

    if (isEn) {
      if (n.message.includes('Nouveau devoir assigné')) return 'New homework assigned by teacher.';
      if (n.message.includes('Votre devoir a été corrigé')) return 'Your assignment has been graded.';
      if (n.message.includes('Le cours aura lieu')) return 'Live class will start soon.';
      if (n.message.includes('Nouveau quiz')) return 'A new quiz has been published.';
    } else {
      if (n.message.includes('New homework assigned')) return 'Nouveau devoir assigné par votre professeur.';
      if (n.message.includes('Your assignment has been graded')) return 'Votre devoir a été corrigé.';
      if (n.message.includes('Live class will start soon')) return 'Le cours en direct commencera bientôt.';
    }

    return n.message;
  }

  getNotifSvgPath(type: AppNotification['type']): string {
    if (type === 'journey_unlocked' || type === 'journey_mission') {
      return '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.2c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/>';
    }
    if (type === 'live_started') {
      return '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>';
    }
    if (type === 'homework_graded' || type === 'homework_submitted') {
      return '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 11 17 15 13"/>';
    }
    if (type === 'exercise_assigned') {
      return '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>';
    }
    if (type === 'quiz_available') {
      return '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>';
    }
    if (type === 'announcement') {
      return '<path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8 a3 3 0 1 1 -5.8-1.6"/>';
    }
    return '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>';
  }

  getNotifIconClass(type: AppNotification['type']): string {
    const classes: Record<string, string> = {
      journey_unlocked: 'purple',
      journey_mission: 'purple',
      homework_submitted: 'info',
      homework_graded: 'success',
      new_student: 'purple',
      exam_completed: 'warning',
      exercise_assigned: 'info',
      quiz_available: 'info',
      grade_updated: 'success',
      new_comment: 'info',
      announcement: 'warning',
      reminder: 'warning',
      live_started: 'danger'
    };
    return classes[type] || 'info';
  }

  formatTime(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      const diffSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
      const isFr = this.activeLang() === 'fr';

      if (diffSeconds < 60) return isFr ? "À l'instant" : "Just now";
      const diffMin = Math.floor(diffSeconds / 60);
      if (diffMin < 60) return isFr ? `Il y a ${diffMin} min` : `${diffMin}m ago`;
      const diffH = Math.floor(diffMin / 60);
      if (diffH < 24) return isFr ? `Il y a ${diffH}h` : `${diffH}h ago`;
      const diffD = Math.floor(diffH / 24);
      return isFr ? `Il y a ${diffD}j` : `${diffD}d ago`;
    } catch { return ''; }
  }
}
