import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Announcement } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-announcements',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="card">
        <h3 class="st" style="font-size:16px; margin-bottom:12px">Post Announcement</h3>
        
        <div class="input-row">
          <label for="aTitle">Announcement Title</label>
          <input id="aTitle" type="text" [(ngModel)]="title" placeholder="e.g. Important schedule update for all classes" />
        </div>

        <div class="g2">
          <div class="input-row">
            <label for="aTarget">Send To</label>
            <select id="aTarget" [(ngModel)]="sendTo">
              <option value="All students">All students</option>
              <option value="B1 class only">B1 class only</option>
              <option value="A2 class only">A2 class only</option>
            </select>
          </div>
          <div class="input-row">
            <label for="aPriority">Priority</label>
            <select id="aPriority" [(ngModel)]="priority">
              <option value="Normal">Normal</option>
              <option value="Important">Important</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div class="input-row">
          <label for="aMsg">Message Details</label>
          <textarea id="aMsg" [(ngModel)]="message" rows="4" placeholder="Type your message here..."></textarea>
        </div>

        <div class="input-row" style="margin-top:12px">
          <label style="font-weight:600; margin-bottom:6px; display:block">Event Image / Flyer (Optional)</label>
          <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap">
            <label class="btn-s" style="cursor:pointer; display:inline-flex; align-items:center; gap:6px; margin:0; padding:8px 14px; border:1px dashed var(--border); background:var(--surface-2); font-size:12px; font-weight:600; border-radius:8px">
              <i class="ti ti-upload" style="font-size:14px"></i>
              <span>Upload from PC</span>
              <input type="file" accept="image/*" (change)="onFileSelected($event)" style="display:none" />
            </label>
            <span style="font-size:11px; color:var(--text-muted)">or paste URL:</span>
          </div>

          <input type="text" [(ngModel)]="imageUrl" placeholder="Paste web image URL here..." style="margin-top:8px" />

          @if (imageUrl) {
            <div style="margin-top:10px; position:relative; display:inline-block">
              <img [src]="imageUrl" style="max-height:100px; max-width:180px; border-radius:6px; border:1px solid var(--border-weak); object-fit:cover" alt="preview" />
              <button (click)="clearSelectedImage()" style="position:absolute; top:-6px; right:-6px; background:#EF4444; color:#FFF; border:none; width:18px; height:18px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:10px">
                <i class="ti ti-x"></i>
              </button>
            </div>
          }
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px">
          @if (selectedAnnId()) {
            <button class="btn-s" (click)="resetForm()">Cancel Edit</button>
          }
          <button class="btn-p" [disabled]="!isValid()" (click)="post()">
            {{ selectedAnnId() ? 'Update Announcement' : 'Broadcast Announcement' }}
          </button>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <h3 class="st" style="font-size:16px; margin-bottom:12px">Active Announcements</h3>
        @if (announcements().length === 0) {
          <div style="font-size:13px; color:var(--text-secondary); text-align:center; padding:16px 0">
            No announcements posted yet.
          </div>
        } @else {
            <div class="ann-list" style="display:flex; flex-direction:column; gap:10px">
            @for (ann of announcements(); track ann.id) {
              <div class="ann-card" style="border:1px solid var(--border-weak); border-left: 3px solid; cursor:pointer; transition: all 0.2s; padding:12px; border-radius:8px" 
                   [style.border-left-color]="ann.priority === 'Urgent' ? '#EF4444' : (ann.priority === 'Important' ? '#F59E0B' : '#4F46E5')"
                   (click)="viewAnnouncement(ann)">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; margin-bottom:4px">
                  <h4 style="font-size:12px; font-weight:700; color:var(--text-primary); flex:1; display:flex; align-items:center; gap:4px; margin:0">
                    {{ ann.title }}
                  </h4>
                  <span class="badge" [style.background]="ann.priority === 'Urgent' ? '#FEE2E2' : (ann.priority === 'Important' ? '#FEF3C7' : '#E0E7FF')" [style.color]="ann.priority === 'Urgent' ? '#991B1B' : (ann.priority === 'Important' ? '#92400E' : '#3730A3')" style="font-size:9px; padding:2px 6px">{{ ann.priority }}</span>
                </div>
                <div style="font-size:10px; color:var(--text-muted); margin-bottom:4px">To: {{ ann.sendTo }}</div>
                
                @if (ann.imageUrl) {
                  <div style="width:100%; max-height:20vh; overflow:hidden; border-radius:4px; margin:4px 0; border:1px solid var(--border-weak); background:#F3F4F6; display:flex; justify-content:center; align-items:center">
                    <img [src]="ann.imageUrl" style="width:100%; height:auto; max-height:20vh; object-fit:cover" alt="Flyer">
                  </div>
                }

                <p style="font-size:11px; color:var(--text-secondary); margin:0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height:1.3">{{ ann.message }}</p>

                <!-- Actions Toolbar -->
                <div style="display:flex; justify-content:flex-end; gap:8px; border-top:1px dashed var(--border-weak); padding-top:6px; margin-top:6px" (click)="$event.stopPropagation()">
                  <button class="btn-s" style="padding:2px 8px; font-size:10px" (click)="editAnnouncement(ann)">
                    <i class="ti ti-edit"></i> Edit
                  </button>
                  <button class="btn-s" style="padding:2px 8px; font-size:10px; border-color:#EF4444; color:#EF4444" (click)="deleteAnnouncement(ann)">
                    <i class="ti ti-trash"></i> Delete
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class TeacherAnnouncementsComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  selectedAnnId = signal<string | null>(null);

  title = '';
  sendTo = 'All students';
  priority: 'Normal' | 'Important' | 'Urgent' = 'Important';
  message = '';
  imageUrl = '';

  announcements = signal<Announcement[]>([]);

  constructor() {
    this.db.observeAnnouncements().subscribe(list => this.announcements.set(list));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.imageUrl = result;
      };
      reader.readAsDataURL(file);
    }
  }

  clearSelectedImage() {
    this.imageUrl = '';
  }

  isValid() {
    return this.title.trim() && this.message.trim();
  }

  post() {
    if (!this.isValid()) return;

    const data = {
      title: this.title,
      sendTo: this.sendTo,
      priority: this.priority,
      message: this.message,
      imageUrl: this.imageUrl.trim() || undefined
    };

    const id = this.selectedAnnId();
    if (id) {
      this.db.updateAnnouncement(id, data);
      this.dialogService.alert('Success', 'Announcement updated successfully!', 'success');
    } else {
      this.db.addAnnouncement(data);
      this.dialogService.alert('Success', 'Announcement broadcasted to selected students successfully!', 'success');
    }
    this.resetForm();
  }

  editAnnouncement(ann: Announcement) {
    this.selectedAnnId.set(ann.id);
    this.title = ann.title;
    this.message = ann.message;
    this.priority = ann.priority;
    this.sendTo = ann.sendTo;
    this.imageUrl = ann.imageUrl || '';
  }

  deleteAnnouncement(ann: Announcement) {
    this.dialogService.confirm(
      'Delete Announcement',
      `Are you sure you want to delete the announcement "${ann.title}"?`,
      () => {
        this.db.deleteAnnouncement(ann.id);
        this.dialogService.alert('Deleted', 'Announcement deleted successfully!', 'success');
      }
    );
  }

  resetForm() {
    this.selectedAnnId.set(null);
    this.title = '';
    this.message = '';
    this.imageUrl = '';
    this.priority = 'Important';
    this.sendTo = 'All students';
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
        
        ${ann.imageUrl ? `
          <div style="margin:16px 0; border-radius:10px; overflow:hidden; border:1px solid var(--border-weak); box-shadow:0 2px 8px rgba(0,0,0,0.1)">
            <img src="${ann.imageUrl}" style="width:100%; max-height:280px; object-fit:cover; display:block" />
          </div>
        ` : ''}
        
        <div style="background:var(--surface-1); padding:14px 16px; border-radius:8px; border:1px solid var(--border-weak)">
          <p style="font-size:13.5px; color:var(--text-primary); line-height:1.7; margin:0; white-space:pre-wrap">${ann.message}</p>
        </div>
        
        <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border-weak); text-align:center">
          <span style="font-size:10px; color:var(--text-muted)">📅 Posted on ${new Date(ann.createdAt || Date.now()).toLocaleDateString()}</span>
        </div>
      </div>
    `;
    
    this.dialogService.alert(ann.title, content, 'info');
  }
}