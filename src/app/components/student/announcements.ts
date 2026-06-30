import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, Announcement, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-student-announcements',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" style="animation: fadeIn 0.25s">
      <!-- HERO BANNER -->
      <div class="announcements-hero">
        <div class="hero-content">
          <span class="hero-tag">INFORMATION</span>
          <h2 class="hero-title">📢 School Announcements & News</h2>
          <p class="hero-desc">Restez informé des événements de l\'école, des mises à jour d\'horaires et des actualités importantes.</p>
        </div>
      </div>

      <!-- CARDS LIST -->
      <div class="announcements-grid">
        @for (ann of announcements(); track ann.id) {
          <div class="announcement-card" 
               [class.urgent]="ann.priority === 'Urgent'"
               [class.important]="ann.priority === 'Important'"
               (click)="viewAnnouncement(ann)">
            <div class="card-header-row">
              <div class="priority-badge-wrapper">
                <span class="priority-dot" [style.background]="getPriorityColor(ann.priority)"></span>
                <span class="priority-label" [style.color]="getPriorityColor(ann.priority)">{{ ann.priority }}</span>
              </div>
              <span class="date-label">{{ ann.createdAt | date:'d MMM y' }}</span>
            </div>

            <h3 class="announcement-title">{{ ann.title }}</h3>

            <!-- Flyer Image -->
            @if (ann.imageUrl) {
              <div class="flyer-container">
                <img [src]="ann.imageUrl" alt="Flyer" class="flyer-img">
                <div class="flyer-overlay"><i class="ti ti-zoom-in"></i> Cliquer pour agrandir</div>
              </div>
            }

            <p class="announcement-excerpt">{{ ann.message }}</p>

            <div class="card-footer-row">
              <span class="target-label"><i class="ti ti-users"></i> {{ ann.sendTo }}</span>
              
              @if (!isRead(ann)) {
                <span class="new-badge">
                  <span class="new-dot"></span>
                  Nouveau
                </span>
              } @else {
                <span class="read-check">
                  <i class="ti ti-circle-check"></i> Lu
                </span>
              }
            </div>
          </div>
        } @empty {
          <div class="empty-announcements">
            <i class="ti ti-volume-off" style="font-size:42px; display:block; margin-bottom:12px; color:var(--text-muted)"></i>
            <p style="font-size:14px; font-weight:600; color:var(--text-primary); margin:0">Aucune annonce</p>
            <p style="font-size:12px; color:var(--text-muted); margin-top:4px">Il n\'y a pas d\'annonce publiée pour votre classe pour le moment.</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .announcements-hero {
      background: linear-gradient(135deg, #4F46E5 0%, #311042 100%);
      border-radius: 12px;
      padding: 20px 24px;
      margin-bottom: 20px;
      color: white;
      box-shadow: 0 4px 15px rgba(79, 70, 229, 0.15);
    }
    .hero-tag {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 1px;
      background: rgba(255, 255, 255, 0.2);
      padding: 3px 8px;
      border-radius: 20px;
      text-transform: uppercase;
      display: inline-block;
      margin-bottom: 8px;
    }
    .hero-title {
      font-size: 18px;
      font-weight: 800;
      margin: 0;
      color: #FFF;
    }
    .hero-desc {
      font-size: 12px;
      color: #E0E7FF;
      margin: 6px 0 0 0;
      line-height: 1.4;
    }

    .announcements-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }
    @media (min-width: 768px) {
      .announcements-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .announcement-card {
      background: var(--surface-1);
      border: 1px solid var(--border-weak);
      border-left: 4px solid #4F46E5;
      border-radius: 10px;
      padding: 16px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .announcement-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px -8px rgba(79, 70, 229, 0.12);
      border-color: #C7D2FE;
    }
    .announcement-card.important {
      border-left-color: #F59E0B;
    }
    .announcement-card.urgent {
      border-left-color: #EF4444;
    }

    .card-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .priority-badge-wrapper {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .priority-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .priority-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .date-label {
      font-size: 10px;
      color: var(--text-muted);
      font-weight: 500;
    }

    .announcement-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
      line-height: 1.3;
    }

    .flyer-container {
      width: 100%;
      height: 140px;
      overflow: hidden;
      border-radius: 8px;
      border: 1px solid var(--border-weak);
      position: relative;
      background: #F3F4F6;
    }
    .flyer-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }
    .announcement-card:hover .flyer-img {
      transform: scale(1.03);
    }
    .flyer-overlay {
      position: absolute;
      inset: 0;
      background: rgba(15, 23, 42, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      color: white;
      font-size: 11px;
      font-weight: 600;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .announcement-card:hover .flyer-overlay {
      opacity: 1;
    }

    .announcement-excerpt {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.45;
      margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-footer-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-weak);
      padding-top: 8px;
      margin-top: 4px;
    }
    .target-label {
      font-size: 10.5px;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
      font-weight: 500;
    }
    .new-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #FEE2E2;
      color: #EF4444;
      font-size: 9px;
      font-weight: 800;
      padding: 2px 7px;
      border-radius: 20px;
      text-transform: uppercase;
    }
    .new-dot {
      width: 4px;
      height: 4px;
      background: #EF4444;
      border-radius: 50%;
      animation: pulse-dot 1.2s infinite;
    }
    .read-check {
      font-size: 11px;
      color: #10B981;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .empty-announcements {
      padding: 40px 20px;
      background: var(--surface-1);
      border-radius: 12px;
      border: 1px dashed var(--border);
      text-align: center;
      width: 100%;
    }

    @keyframes pulse-dot {
      0% { transform: scale(0.9); opacity: 0.6; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.6; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class StudentAnnouncementsComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);
  announcements = signal<Announcement[]>([]);
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

  isRead(ann: Announcement): boolean {
    if (!this.currentUser) return false;
    return ann.readBy.includes(this.currentUser.id);
  }

  markAsRead(annId: string) {
    if (!this.currentUser) return;
    this.db.markAnnouncementAsRead(annId, this.currentUser.id);
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'Urgent': return '#EF4444';
      case 'Important': return '#F59E0B';
      default: return '#4F46E5';
    }
  }

  getPriorityBg(priority: string): string {
    switch (priority) {
      case 'Urgent': return '#FEE2E2';
      case 'Important': return '#FEF3C7';
      default: return '#E0E7FF';
    }
  }

  viewAnnouncement(ann: Announcement) {
    const priorityColor = ann.priority === 'Urgent' ? '#EF4444' : (ann.priority === 'Important' ? '#F59E0B' : '#4F46E5');
    const priorityBg = ann.priority === 'Urgent' ? '#FEE2E2' : (ann.priority === 'Important' ? '#FEF3C7' : '#E0E7FF');
    const priorityIcon = ann.priority === 'Urgent' ? '🔴' : (ann.priority === 'Important' ? '🟡' : '🔵');

    const content = `
      <div style="padding:4px 0">
        <div style="background:${priorityBg}; border-left:4px solid ${priorityColor}; padding:12px 16px; border-radius:8px; margin-bottom:16px">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px">
            <span style="font-size:18px">${priorityIcon}</span>
            <span style="font-size:12px; font-weight:700; color:${priorityColor}; text-transform:uppercase; letter-spacing:0.5px">${ann.priority}</span>
          </div>
          <div style="font-size:11px; color:var(--text-muted)">📋 Sent to: <strong>${ann.sendTo}</strong></div>
        </div>
        
        <div style="background:var(--surface-1); padding:14px 16px; border-radius:8px; border:1px solid var(--border-weak)">
          <p style="font-size:13.5px; color:var(--text-primary); line-height:1.7; margin:0; white-space:pre-wrap">${ann.message}</p>
        </div>
        
        <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border-weak); text-align:center">
          <span style="font-size:10px; color:var(--text-muted)">📅 Posted on ${new Date(ann.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    `;

    this.dialogService.alert(ann.title, content, 'info', () => {
      // Mark as read when closing the dialog
      if (this.currentUser) {
        this.db.markAnnouncementAsRead(ann.id, this.currentUser!.id);
      }
    }, ann.imageUrl);
  }
}