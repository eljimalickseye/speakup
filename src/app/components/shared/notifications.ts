import { Component, inject, signal, computed, OnInit } from '@angular/core';
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
                (click)="markRead(notif); $event.stopPropagation()"
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
              </div>
            }
          }
        </div>
      </div>
    }
  `,
  styles: [`
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
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-weak);
      cursor: pointer;
      transition: background 0.15s;
      position: relative;
    }

    .notif-item:hover { background: var(--surface-2); }

    .notif-item.unread { background: #F8F8FF; }
    .notif-item.unread:hover { background: #EEF2FF; }

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
  `]
})
export class NotificationsComponent {
  private db = inject(DatabaseService);

  isPanelOpen = signal<boolean>(false);
  currentUser = signal<UserProfile | null>(null);

  constructor() {
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
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

  markRead(notif: AppNotification) {
    if (!notif.read) {
      this.db.markNotificationRead(notif.id);
    }
  }

  markAllRead() {
    const user = this.currentUser();
    if (user) this.db.markAllNotificationsRead(user.id);
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
