import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, AppNotification, UserProfile } from '../../services/database.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Notification Bell Icon + Badge -->
    <div class="notif-bell-wrapper" (click)="togglePanel()" title="Notifications">
      <button class="notif-bell-btn" [class.active]="isPanelOpen()">
        <i class="ti ti-bell" aria-hidden="true"></i>
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
            <i class="ti ti-bell" style="color:#4F46E5; font-size:16px"></i>
            <span>Notifications</span>
            @if (unreadCount() > 0) {
              <span class="notif-count-badge">{{ unreadCount() }}</span>
            }
          </div>
          @if (unreadCount() > 0) {
            <button class="notif-mark-all-btn" (click)="markAllRead(); $event.stopPropagation()">
              Tout lire
            </button>
          }
        </div>

        <div class="notif-list">
          @if (userNotifications().length === 0) {
            <div class="notif-empty">
              <i class="ti ti-bell-off" style="font-size:32px; color:var(--text-muted); display:block; margin-bottom:8px"></i>
              <p style="font-size:12px; color:var(--text-muted)">Aucune notification pour l'instant</p>
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
                  <i class="ti" [class]="getNotifIcon(notif.type)"></i>
                </div>
                <div class="notif-content">
                  <div class="notif-title">{{ notif.title }}</div>
                  <div class="notif-message">{{ notif.message }}</div>
                  <div class="notif-time">{{ formatTime(notif.createdAt) }}</div>
                </div>
                @if (!notif.read) {
                  <div class="notif-dot"></div>
                }
                <button 
                  class="notif-delete-btn"
                  (click)="deleteNotif(notif.id); $event.stopPropagation()"
                  title="Supprimer"
                >✕</button>
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
            <i class="ti" [class]="getNotifIcon(toast.type)"></i>
          </div>
          <div class="toast-body">
            <div class="toast-title">{{ toast.title }}</div>
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" (click)="$event.stopPropagation(); removeToast(toast.id)">❌</button>
        </div>
      }
    </div>

    <!-- New Notification Modal -->
    @if (activeModalNotif(); as modalNotif) {
      <div class="notif-modal-overlay" (click)="closeModalNotif()">
        <div class="notif-modal-card" (click)="$event.stopPropagation()">
          <div class="notif-modal-header" [class]="getNotifIconClass(modalNotif.type)">
            <span style="font-size:24px">🔔</span>
            <h4 style="margin:0; font-size:16px; font-weight:800">{{ modalNotif.title }}</h4>
          </div>
          
          <div class="notif-modal-body">
            <p style="margin:0; font-size:13.5px; color:var(--text-secondary); line-height:1.6">{{ modalNotif.message }}</p>
          </div>
          
          <div class="notif-modal-actions">
            <button class="notif-btn-secondary" (click)="closeModalNotif()">{{ t('Fermer', 'Close') }}</button>
            @if (hasRedirectLink(modalNotif)) {
              <button class="notif-btn-primary" (click)="navigateToNotification(modalNotif)">{{ t('Accéder', 'Go to') }}</button>
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
      border-radius: 99px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 3px;
      border: 2px solid white;
      animation: notifPulse 2s ease-in-out infinite;
    }

    @keyframes notifPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }

    .notif-backdrop {
      position: fixed;
      inset: 0;
      z-index: 998;
    }

    .notif-panel {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 340px;
      max-height: 480px;
      background: var(--surface-1);
      border: 1px solid var(--border-strong);
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.12);
      z-index: 999;
      overflow: hidden;
      animation: panelSlideIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes panelSlideIn {
      from { opacity: 0; transform: translateY(-8px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
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
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .notif-count-badge {
      background: #4F46E5;
      color: white;
      font-size: 9px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 99px;
    }

    .notif-mark-all-btn {
      font-size: 11px;
      color: #4F46E5;
      background: none;
      border: none;
      cursor: pointer;
      font-weight: 600;
      padding: 4px 8px;
      border-radius: 4px;
      transition: background 0.15s;
    }

    .notif-mark-all-btn:hover { background: #EEF2FF; }

    .notif-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .notif-empty {
      text-align: center;
      padding: 40px 20px;
    }

    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 38px 12px 16px;
      border-bottom: 1px solid var(--border-weak);
      cursor: pointer;
      transition: background 0.15s;
      position: relative;
    }

    .notif-item:hover { background: var(--surface-2); }
    .notif-item:hover .notif-delete-btn { opacity: 1; }

    .notif-item.unread { background: #F8F8FF; }
    .notif-item.unread:hover { background: #EEF2FF; }

    .notif-delete-btn {
      position: absolute;
      top: 50%;
      right: 12px;
      transform: translateY(-50%);
      background: #F3F4F6;
      border: none;
      cursor: pointer;
      color: #9CA3AF;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      transition: all 0.2s ease;
      opacity: 0.8;
      z-index: 10;
    }

    .notif-delete-btn:hover {
      background: #FEE2E2;
      color: #EF4444;
      opacity: 1;
    }


    .notif-icon {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      flex-shrink: 0;
    }

    .notif-icon.success { background: #ECFDF5; color: #059669; }
    .notif-icon.info { background: #EEF2FF; color: #4F46E5; }
    .notif-icon.warning { background: #FFFBEB; color: #D97706; }
    .notif-icon.danger { background: #FEF2F2; color: #EF4444; }
    .notif-icon.purple { background: #FAF5FF; color: #7C3AED; }

    .notif-content {
      flex: 1;
      min-width: 0;
    }

    .notif-title {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 2px;
    }

    .notif-message {
      font-size: 11px;
      color: var(--text-secondary);
      line-height: 1.4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .notif-time {
      font-size: 10px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .notif-dot {
      width: 8px;
      height: 8px;
      background: #4F46E5;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 4px;
    }

    /* TOAST OVERLAY DESIGN */
    .toast-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 10000;
      pointer-events: auto;
    }

    .toast-item {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #FFF;
      border: 1px solid var(--border-strong);
      border-left: 4px solid #4F46E5;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      padding: 12px 16px;
      border-radius: 12px;
      width: 320px;
      animation: toastSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .toast-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 35px rgba(0, 0, 0, 0.12);
    }

    @keyframes toastSlideIn {
      from { opacity: 0; transform: translateX(100px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .toast-icon-box {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      flex-shrink: 0;
    }

    .toast-icon-box.success { background: #ECFDF5; color: #059669; }
    .toast-icon-box.info { background: #EEF2FF; color: #4F46E5; }
    .toast-icon-box.warning { background: #FFFBEB; color: #D97706; }
    .toast-icon-box.danger { background: #FEF2F2; color: #EF4444; }
    .toast-icon-box.purple { background: #FAF5FF; color: #7C3AED; }

    .toast-body {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-size: 12.5px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 2px;
    }

    .toast-message {
      font-size: 11px;
      color: var(--text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 10px;
      color: var(--text-muted);
      padding: 4px;
    }

    .notif-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.45);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
      animation: fadeIn 0.25s ease-out;
    }

    .notif-modal-card {
      background: var(--surface-1);
      border-radius: 16px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      border: 1px solid var(--border-weak);
      overflow: hidden;
      margin: 16px;
      animation: modalScaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes modalScaleUp {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .notif-modal-header {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--text-primary);
      border-bottom: 1px solid var(--border-weak);
    }
    .notif-modal-header.success { background: #ECFDF5; border-bottom: 2px solid #34D399; }
    .notif-modal-header.info { background: #EEF2FF; border-bottom: 2px solid #818CF8; }
    .notif-modal-header.warning { background: #FFFBEB; border-bottom: 2px solid #FBBF24; }
    .notif-modal-header.danger { background: #FEF2F2; border-bottom: 2px solid #F87171; }
    .notif-modal-header.purple { background: #FAF5FF; border-bottom: 2px solid #C084FC; }

    .notif-modal-body {
      padding: 24px 20px;
    }

    .notif-modal-actions {
      padding: 16px 20px;
      background: var(--surface-2);
      border-top: 1px solid var(--border-weak);
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .notif-btn-secondary {
      background: #FFF;
      border: 1px solid var(--border);
      color: var(--text-secondary);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .notif-btn-secondary:hover {
      background: var(--surface-2);
    }

    .notif-btn-primary {
      background: #4F46E5;
      border: 1px solid #4F46E5;
      color: white;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .notif-btn-primary:hover {
      background: #4338CA;
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

    // Listen to notification changes to trigger toast alerts and modals
    this.db.observeNotifications().subscribe(allNotifs => {
      const currentUnread = this.userNotifications().filter(n => !n.read);
      
      if (this.isFirstLoad) {
        if (this.currentUser()) {
          this.previousUnreadCount = currentUnread.length;
          this.isFirstLoad = false;
        }
        return;
      }

      // If there are more unread notifications than before, trigger notifications popup
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
      
      // Pleasant chime tone 1 (C5)
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
      
      // Pleasant chime tone 2 (E5)
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
    return !!(n.link || this.getTargetTab(n.type));
  }

  getTargetTab(type: AppNotification['type']): string | null {
    const role = this.currentUser()?.role;
    if (role === 'student') {
      if (type === 'exercise_assigned') return 'exercises';
      if (type === 'quiz_available') return 'exercises';
      if (type === 'homework_graded' || type === 'grade_updated') return 'lessons';
      if (type === 'announcement') return 'announcements';
      if (type === 'live_started') return 'live-classes';
      if (type === 'new_comment') return 'chat';
    } else if (role === 'teacher') {
      if (type === 'homework_submitted') return 'grade-homework';
      if (type === 'exam_completed') return 'results';
    }
    return null;
  }

  navigateToNotification(n: AppNotification) {
    this.markRead(n);
    this.activeModalNotif.set(null);
    const link = n.link || this.getTargetTab(n.type);
    if (link) {
      if (link.includes(':')) {
        const parts = link.split(':');
        const tab = parts[0];
        const targetId = parts[1];
        
        if (tab === 'exercises') {
          if (targetId.startsWith('quiz-') || targetId.startsWith('placement-test')) {
            this.db.requestedQuizIdRedirect.set(targetId);
          } else {
            this.db.requestedExerciseIdRedirect.set(targetId);
          }
        } else if (tab === 'exam') {
          this.db.requestedExamIdRedirect.set(targetId);
        }
        this.db.requestedTabRedirect.set(tab);
      } else {
        this.db.requestedTabRedirect.set(link);
      }
    }
  }

  showToast(n: AppNotification) {
    // Avoid duplicates
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

  getNotifIcon(type: AppNotification['type']): string {
    const icons: Record<string, string> = {
      homework_submitted: 'ti-file-upload',
      homework_graded: 'ti-file-check',
      new_student: 'ti-user-plus',
      exam_completed: 'ti-certificate',
      exercise_assigned: 'ti-pencil',
      quiz_available: 'ti-list-check',
      grade_updated: 'ti-star',
      new_comment: 'ti-message',
      announcement: 'ti-speakerphone',
      reminder: 'ti-bell',
      live_started: 'ti-video'
    };
    return icons[type] || 'ti-bell';
  }

  getNotifIconClass(type: AppNotification['type']): string {
    const classes: Record<string, string> = {
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
      if (diffSeconds < 60) return "À l'instant";
      const diffMin = Math.floor(diffSeconds / 60);
      if (diffMin < 60) return `Il y a ${diffMin} min`;
      const diffH = Math.floor(diffMin / 60);
      if (diffH < 24) return `Il y a ${diffH}h`;
      const diffD = Math.floor(diffH / 24);
      return `Il y a ${diffD}j`;
    } catch { return ''; }
  }
}
