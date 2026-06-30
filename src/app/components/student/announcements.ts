import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, Announcement, UserProfile } from '../../services/database.service';

@Component({
  selector: 'app-student-announcements',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">

      <!-- Page Header -->
      <div class="page-header">
        <div class="page-title">
          <span class="page-icon">📢</span>
          <div>
            <div style="font-size:22px; font-weight:800; color:var(--text-primary)">Annonces</div>
            <div style="font-size:12px; color:var(--text-muted); margin-top:2px">Actualités, avis importants et mises à jour de vos professeurs</div>
          </div>
        </div>
        @if (unreadCount() > 0) {
          <div class="unread-pill">{{ unreadCount() }} non lue{{ unreadCount() > 1 ? 's' : '' }}</div>
        }
      </div>

      <!-- Cards Grid -->
      @if (announcements().length > 0) {
        <div class="ann-grid">
          @for (ann of announcements(); track ann.id) {
            <div class="ann-card" (click)="openModal(ann)"
                 [class.unread-card]="!isRead(ann)"
                 [style.border-top]="'4px solid ' + getPriorityColor(ann.priority)">

              <!-- Top row: badge + date + unread dot -->
              <div class="ann-card-top">
                <span class="priority-badge"
                      [style.background]="getPriorityBg(ann.priority)"
                      [style.color]="getPriorityColor(ann.priority)">
                  {{ getPriorityIcon(ann.priority) }} {{ ann.priority }}
                </span>
                <div style="display:flex; align-items:center; gap:8px">
                  @if (!isRead(ann)) {
                    <span class="unread-dot"></span>
                  }
                  <span class="ann-date">{{ ann.createdAt | date:'dd MMM yyyy' }}</span>
                </div>
              </div>

              <!-- Image preview -->
              @if (ann.imageUrl) {
                <div class="ann-img-preview">
                  <img [src]="ann.imageUrl" alt="Flyer">
                </div>
              }

              <!-- Title -->
              <div class="ann-title">{{ ann.title }}</div>

              <!-- Excerpt (3 lines max) -->
              <div class="ann-excerpt">{{ ann.message }}</div>

              <!-- Footer -->
              <div class="ann-footer">
                <span class="ann-target">
                  <i class="ti ti-users"></i> {{ ann.sendTo }}
                </span>
                <span class="ann-readmore">Voir plus →</span>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <i class="ti ti-volume-off" style="font-size:52px; color:var(--text-muted); display:block; margin-bottom:16px"></i>
          <div style="font-size:16px; font-weight:700; color:var(--text-muted); margin-bottom:6px">Aucune annonce</div>
          <div style="font-size:12px; color:var(--text-muted)">Aucune annonce n'a été publiée pour votre niveau pour le moment.</div>
        </div>
      }

      <!-- ===================== MODAL ===================== -->
      @if (selectedAnn()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-box" (click)="$event.stopPropagation()">

            <!-- Banner with gradient -->
            <div class="modal-banner" [style.background]="getPriorityGradient(selectedAnn()!.priority)">
              <span class="priority-badge-lg"
                    [style.background]="getPriorityBg(selectedAnn()!.priority)"
                    [style.color]="getPriorityColor(selectedAnn()!.priority)">
                {{ getPriorityIcon(selectedAnn()!.priority) }} {{ selectedAnn()!.priority }}
              </span>
              <button class="modal-close-btn" (click)="closeModal()">✕</button>
            </div>

            <!-- Body -->
            <div class="modal-body">
              <h2 class="modal-title">{{ selectedAnn()!.title }}</h2>
              <div class="modal-meta">
                <span><i class="ti ti-calendar"></i> {{ selectedAnn()!.createdAt | date:'fullDate' }}</span>
                <span style="opacity:0.4">·</span>
                <span><i class="ti ti-users"></i> {{ selectedAnn()!.sendTo }}</span>
              </div>

              @if (selectedAnn()!.imageUrl) {
                <div class="modal-img-wrap">
                  <img [src]="selectedAnn()!.imageUrl" alt="Flyer">
                </div>
              }

              <div class="modal-message">{{ selectedAnn()!.message }}</div>

              <!-- Actions -->
              <div class="modal-actions">
                @if (!isRead(selectedAnn()!)) {
                  <button class="btn-p" (click)="markAsRead(selectedAnn()!.id)">
                    <i class="ti ti-check"></i> Marquer comme lu
                  </button>
                } @else {
                  <span class="read-badge"><i class="ti ti-circle-check"></i> Déjà lu</span>
                }
                <button class="btn-sec" (click)="closeModal()">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 28px;
      flex-wrap: wrap;
      gap: 12px;
    }
    .page-title { display: flex; align-items: center; gap: 14px; }
    .page-icon { font-size: 36px; }
    .unread-pill {
      background: linear-gradient(135deg, #4F46E5, #6366F1);
      color: white;
      font-size: 11px;
      font-weight: 700;
      padding: 5px 14px;
      border-radius: 20px;
    }
    .ann-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 18px;
    }
    .ann-card {
      background: var(--surface-1);
      border-radius: 14px;
      padding: 18px;
      cursor: pointer;
      transition: transform 0.18s, box-shadow 0.18s;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06);
      border: 1px solid var(--border-weak);
      display: flex;
      flex-direction: column;
      gap: 10px;
      position: relative;
    }
    .ann-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 28px rgba(0,0,0,0.12);
    }
    .unread-card {
      background: linear-gradient(to bottom right, var(--surface-1), #EEF2FF08);
    }
    .ann-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .priority-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 10px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4F46E5;
      display: inline-block;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.6; transform: scale(0.85); }
    }
    .ann-date { font-size: 10px; color: var(--text-muted); }
    .ann-img-preview {
      width: 100%;
      height: 140px;
      overflow: hidden;
      border-radius: 8px;
      border: 1px solid var(--border-weak);
      background: #F3F4F6;
    }
    .ann-img-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .ann-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.3;
    }
    .ann-excerpt {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.55;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      flex: 1;
    }
    .ann-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid var(--border-weak);
      margin-top: auto;
    }
    .ann-target { font-size: 10px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
    .ann-readmore { font-size: 11px; color: #4F46E5; font-weight: 700; }
    .empty-state {
      padding: 60px 40px;
      background: var(--surface-2);
      border-radius: 16px;
      border: 1px dashed var(--border);
      text-align: center;
    }

    /* ---- Modal ---- */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(5px);
      -webkit-backdrop-filter: blur(5px);
      z-index: 1100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      animation: fadeIn 0.18s ease;
    }
    .modal-box {
      background: var(--surface-1);
      border-radius: 18px;
      width: 100%;
      max-width: 600px;
      max-height: 88vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 30px 70px rgba(0,0,0,0.35);
      animation: slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .modal-banner {
      padding: 20px 22px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-height: 72px;
    }
    .priority-badge-lg {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 700;
      padding: 5px 14px;
      border-radius: 20px;
      text-transform: uppercase;
    }
    .modal-close-btn {
      background: rgba(255,255,255,0.22);
      border: none;
      color: white;
      font-size: 15px;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
      flex-shrink: 0;
    }
    .modal-close-btn:hover { background: rgba(255,255,255,0.38); }
    .modal-body { padding: 24px; overflow-y: auto; flex: 1; }
    .modal-title {
      font-size: 20px;
      font-weight: 800;
      color: var(--text-primary);
      margin: 0 0 8px 0;
      line-height: 1.3;
    }
    .modal-meta {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 11.5px;
      color: var(--text-muted);
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .modal-meta i { margin-right: 3px; }
    .modal-img-wrap {
      width: 100%;
      max-height: 320px;
      overflow: hidden;
      border-radius: 10px;
      margin-bottom: 20px;
      border: 1px solid var(--border-weak);
      background: #F3F4F6;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .modal-img-wrap img {
      width: 100%;
      height: auto;
      max-height: 320px;
      object-fit: contain;
    }
    .modal-message {
      font-size: 13.5px;
      color: var(--text-secondary);
      line-height: 1.8;
      white-space: pre-line;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 10px;
      margin-top: 26px;
      padding-top: 18px;
      border-top: 1px solid var(--border-weak);
      flex-wrap: wrap;
    }
    .read-badge {
      font-size: 12px;
      color: #10B981;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .btn-sec {
      background: var(--surface-2);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      padding: 8px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-sec:hover { background: var(--border); }
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
    @keyframes slideUp {
      from { transform: translateY(24px); opacity: 0 }
      to   { transform: translateY(0);    opacity: 1 }
    }
  `]
})
export class StudentAnnouncementsComponent {
  private db = inject(DatabaseService);
  announcements = signal<Announcement[]>([]);
  selectedAnn = signal<Announcement | null>(null);
  currentUser: UserProfile | null = null;

  constructor() {
    this.db.observeCurrentUser().subscribe(u => {
      this.currentUser = u;
      this.loadAnnouncements();
    });
    this.db.observeAnnouncements().subscribe(() => {
      this.loadAnnouncements();
    });
  }

  private loadAnnouncements() {
    const user = this.currentUser;
    if (!user) return;
    this.db.observeAnnouncements().subscribe(list => {
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

  unreadCount() {
    return this.announcements().filter(a => !this.isRead(a)).length;
  }

  openModal(ann: Announcement) {
    this.selectedAnn.set(ann);
    if (!this.isRead(ann)) this.markAsRead(ann.id);
  }

  closeModal() { this.selectedAnn.set(null); }

  isRead(ann: Announcement): boolean {
    if (!this.currentUser) return false;
    return ann.readBy?.includes(this.currentUser.id) ?? false;
  }

  markAsRead(annId: string) {
    if (!this.currentUser) return;
    this.db.markAnnouncementAsRead(annId, this.currentUser.id);
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'Urgent':    return '#EF4444';
      case 'Important': return '#F59E0B';
      default:          return '#4F46E5';
    }
  }
  getPriorityBg(priority: string): string {
    switch (priority) {
      case 'Urgent':    return '#FEE2E2';
      case 'Important': return '#FEF3C7';
      default:          return '#E0E7FF';
    }
  }
  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'Urgent':    return '🚨';
      case 'Important': return '⚠️';
      default:          return '📌';
    }
  }
  getPriorityGradient(priority: string): string {
    switch (priority) {
      case 'Urgent':    return 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)';
      case 'Important': return 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)';
      default:          return 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)';
    }
  }
}
