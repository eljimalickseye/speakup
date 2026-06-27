import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, Announcement, UserProfile } from '../../services/database.service';

@Component({
  selector: 'app-student-announcements',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="section-title">📢 School Announcements & News</div>
      
      <div style="display:flex; flex-direction:column; gap:16px">
        @for (ann of announcements(); track ann.id) {
          <div class="card" [style.border-left]="'4px solid ' + getPriorityColor(ann.priority)" style="background: var(--surface-1); padding: 18px; margin-bottom: 0; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05)">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
              <div style="display:flex; align-items:center; gap:8px">
                <span class="badge" [style.background]="getPriorityBg(ann.priority)" [style.color]="getPriorityColor(ann.priority)" style="font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px; text-transform:uppercase">
                  {{ ann.priority }}
                </span>
                <h3 style="font-size:14px; font-weight:700; color:var(--text-primary); margin:0">{{ ann.title }}</h3>
              </div>
              <span style="font-size:11px; color:var(--text-muted)">{{ ann.createdAt | date:'mediumDate' }}</span>
            </div>

            <!-- Flyer Image -->
            @if (ann.imageUrl) {
              <div style="width:100%; max-height:280px; overflow:hidden; border-radius:8px; margin: 12px 0; border: 1px solid var(--border-weak); background:#F3F4F6; display:flex; justify-content:center; align-items:center">
                <img [src]="ann.imageUrl" style="width:100%; height:auto; max-height:280px; object-fit:contain" alt="Flyer">
              </div>
            }

            <p style="font-size:12.5px; color:var(--text-secondary); line-height:1.5; margin-bottom:12px; white-space: pre-line; margin-top:6px">{{ ann.message }}</p>

            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-weak); padding-top:12px; margin-top:12px">
              <span style="font-size:11px; color:var(--text-muted)">Target: {{ ann.sendTo }}</span>
              
              @if (!isRead(ann)) {
                <button class="btn-p" style="padding:6px 12px; font-size:11px; border-radius:6px; height:auto; line-height:1" (click)="markAsRead(ann.id)">
                  <i class="ti ti-check" style="margin-right:2px"></i> Mark as Read
                </button>
              } @else {
                <span style="font-size:11px; color:#10B981; font-weight:600; display:flex; align-items:center; gap:4px">
                  <i class="ti ti-circle-check"></i> Read
                </span>
              }
            </div>
          </div>
        } @empty {
          <div style="padding: 40px; background: var(--surface-2); border-radius: 8px; border: 1px dashed var(--border); text-align: center; color: var(--text-muted)">
            <i class="ti ti-volume-off" style="font-size:36px; display:block; margin-bottom:12px; color:var(--text-muted)"></i>
            <p style="font-size:13px; font-weight:500; margin:0">No announcements posted for your level at this time.</p>
          </div>
        }
      </div>
    </div>
  `
})
export class StudentAnnouncementsComponent {
  private db = inject(DatabaseService);
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
}
