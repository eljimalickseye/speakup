import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

interface GuestCredentials {
  username: string;
  password: string;
  userId: string;
}

@Component({
  selector: 'app-teacher-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <!-- Stats -->
      <div class="grid3">
        <div class="mcard">
          <div class="mlabel">Total Users</div>
          <div class="mval" style="color:#4F46E5">{{ allUsers().length }}</div>
          <div class="msub">Students + Teachers</div>
        </div>
        <div class="mcard">
          <div class="mlabel">Students</div>
          <div class="mval" style="color:#10B981">{{ students().length }}</div>
          <div class="msub">Active learners</div>
        </div>
        <div class="mcard">
          <div class="mlabel">Blocked</div>
          <div class="mval" style="color:#EF4444">{{ blockedUsers().length }}</div>
          <div class="msub">Access denied</div>
        </div>
      </div>

      <!-- Guest Credentials Management -->
      <div class="card" style="margin-top:16px">
        <h3 class="st" style="font-size:15px; margin-bottom:12px; color:#4F46E5">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px; vertical-align:middle">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>
          </svg>
          Guest Credentials Generator
        </h3>
        <p style="font-size:12px; color:var(--text-secondary); margin-bottom:12px">
          Generate username/password for guests. They can login without email using these credentials.
        </p>

        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:flex-end">
          <div class="input-row" style="flex:1; min-width:180px; margin-bottom:0">
            <label style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px; display:block">Guest Name</label>
            <input [(ngModel)]="guestName" placeholder="Full name" class="form-input" style="height:38px; font-size:13px; width:100%; border:1px solid var(--border); border-radius:6px; padding:0 10px; background:var(--surface-1); color:var(--text-primary)" />
          </div>

          <div class="input-row" style="flex:1; min-width:150px; margin-bottom:0">
            <label style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px; display:block">Level</label>
            <select [(ngModel)]="guestLevel" class="form-select" style="height:38px; font-size:13px; width:100%; border:1px solid var(--border); border-radius:6px; padding:0 10px; background:var(--surface-1); color:var(--text-primary)">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <button class="btn-p" [disabled]="!guestName" (click)="generateGuestCredentials()" style="height:38px; padding:0 20px; font-weight:600">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:6px">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Generate Credentials
          </button>
        </div>

        <!-- Generated credentials display -->
        @if (generatedCredentials()) {
          <div style="margin-top:16px; padding:14px; background:#F0FDF4; border:1px solid #10B981; border-radius:8px">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px">
              <div>
                <p style="font-size:13px; font-weight:700; color:#065F46; margin:0 0 8px 0">✅ Credentials Generated</p>
                <div style="display:flex; gap:16px; flex-wrap:wrap">
                  <div>
                    <span style="font-size:11px; color:#047857; font-weight:600">Username:</span>
                    <code style="background:#FFF; padding:2px 8px; border-radius:4px; font-size:12px; color:#065F46; margin-left:4px; border:1px solid #10B981">{{ generatedCredentials()?.username }}</code>
                  </div>
                  <div>
                    <span style="font-size:11px; color:#047857; font-weight:600">Password:</span>
                    <code style="background:#FFF; padding:2px 8px; border-radius:4px; font-size:12px; color:#065F46; margin-left:4px; border:1px solid #10B981">{{ generatedCredentials()?.password }}</code>
                  </div>
                </div>
                <p style="font-size:11px; color:#047857; margin-top:6px">Share these credentials with the guest. They can login at the login screen.</p>
              </div>
              <button class="btn-s" (click)="copyCredentials()" style="font-size:11px; padding:6px 12px">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px; vertical-align:middle">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy
              </button>
            </div>
          </div>
        }
      </div>

      <!-- User List -->
      <div class="card" style="margin-top:16px">
        <h3 class="st" style="font-size:15px; margin-bottom:12px; color:#4F46E5">All Users</h3>
        
        <div style="display:flex; gap:12px; margin-bottom:16px">
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Search users..." 
            class="form-input" 
            style="flex:1; height:36px; font-size:13px; border:1px solid var(--border); border-radius:6px; padding:0 12px; background:var(--surface-1); color:var(--text-primary)" 
          />
          <select [(ngModel)]="filterRole" class="form-select" style="height:36px; font-size:13px; border:1px solid var(--border); border-radius:6px; padding:0 12px; background:var(--surface-1); color:var(--text-primary)">
            <option value="All">All Roles</option>
            <option value="student">Students</option>
            <option value="teacher">Teachers</option>
            <option value="guest">Guests</option>
          </select>
        </div>

        @if (filteredUsers().length === 0) {
          <div style="text-align:center; padding:30px; color:var(--text-muted)">
            <p style="font-size:13px">No users found</p>
          </div>
        } @else {
          <div style="display:flex; flex-direction:column; gap:8px">
            @for (user of filteredUsers(); track user.id) {
              <div style="display:flex; align-items:center; gap:12px; padding:12px; background:var(--surface-2); border:1px solid var(--border-weak); border-radius:8px; flex-wrap:wrap">
                <div class="avatar" style="width:40px; height:40px; font-size:14px">
                  {{ user.avatar }}
                </div>
                
                <div style="flex:1; min-width:150px">
                  <div style="font-size:14px; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:6px">
                    {{ user.name }}
                    @if (user.role === 'guest') {
                      <span style="font-size:9px; background:#FEF3C7; color:#D97706; padding:2px 6px; border-radius:4px; font-weight:600">GUEST</span>
                    }
                  </div>
                  <div style="font-size:11px; color:var(--text-muted); margin-top:2px">
                    {{ user.level }} · {{ user.role | titlecase }}
                  </div>
                  @if (user.username && user.password) {
                    <div style="font-size:10px; color:var(--text-secondary); margin-top:4px; background:var(--surface-1); padding:4px 8px; border-radius:4px; display:inline-flex; align-items:center; gap:8px">
                      <span>U: <strong>{{ user.username }}</strong></span>
                      <span>P: <strong>{{ user.password }}</strong></span>
                      <button (click)="copyLoginCredentials(user)" style="background:none; border:none; cursor:pointer; font-size:11px; color:#4F46E5; padding:0" title="Copier les identifiants">📋</button>
                      <button (click)="copyLoginLink(user)" style="background:none; border:none; cursor:pointer; font-size:11px; color:#4F46E5; padding:0" title="Copier le lien d'accès direct">🔗</button>
                    </div>
                  }
                </div>

                <div style="display:flex; gap:6px; flex-wrap:wrap">
                  @if (user.role === 'guest' || user.role === 'student') {
                    @if (user.blocked) {
                      <button class="btn-s" (click)="toggleBlock(user)" style="font-size:11px; padding:6px 12px; background:#D1FAE5; border-color:#10B981; color:#065F46">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2 2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="m21 3-6 6"/><path d="m15 3h6v6"/>
                        </svg>
                        Unblock
                      </button>
                    } @else {
                      <button class="btn-s" (click)="toggleBlock(user)" style="font-size:11px; padding:6px 12px; background:#FEE2E2; border-color:#EF4444; color:#DC2626">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px">
                          <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                        </svg>
                        Block
                      </button>
                    }
                  }

                  @if (user.role === 'guest') {
                    <button class="btn-s" (click)="resetGuestPassword(user)" style="font-size:11px; padding:6px 12px">
                      Reset Password
                    </button>
                  }

                  @if (user.role === 'guest') {
                    <button class="btn-s" (click)="deleteUser(user.id)" style="font-size:11px; padding:6px 12px; background:#FEE2E2; border-color:#EF4444; color:#DC2626">
                      Delete
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    code {
      font-family: 'Courier New', monospace;
    }
  `]
})
export class TeacherUserManagementComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  allUsers = signal<UserProfile[]>([]);
  guestName = '';
  guestLevel = 'Beginner';
  searchQuery = '';
  filterRole = 'All';
  generatedCredentials = signal<GuestCredentials | null>(null);

  constructor() {
    this.loadUsers();
  }

  private loadUsers() {
    this.db.observeUsers().subscribe(users => {
      this.allUsers.set(users);
    });
  }

  students = computed(() => this.allUsers().filter(u => u.role === 'student'));
  
  blockedUsers = computed(() => this.allUsers().filter(u => u.blocked === true));

  filteredUsers = computed(() => {
    let users = this.allUsers();
    
    // Filter by role
    if (this.filterRole !== 'All') {
      users = users.filter(u => u.role === this.filterRole);
    }
    
    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      users = users.filter(u => 
        u.name.toLowerCase().includes(query) ||
        u.level.toLowerCase().includes(query) ||
        (u.username && u.username.toLowerCase().includes(query))
      );
    }
    
    return users;
  });

  generateGuestCredentials() {
    if (!this.guestName) return;

    this.db.addStudent(this.guestName, 'Guest', '🇸🇳', 0, 0).then((newUser) => {
      if (newUser) {
        const username = newUser.username || '';
        const password = newUser.password || '';
        const userId = newUser.id;

        this.generatedCredentials.set({ username, password, userId });

        this.dialogService.alert(
          'Guest Credentials Generated',
          `Username: ${username}\nPassword: ${password}\n\nShare these with the guest. They can login without email.`,
          'success'
        );

        // Reset form
        this.guestName = '';
        this.guestLevel = 'Beginner';
      }
    });
  }

  private generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  copyCredentials() {
    const creds = this.generatedCredentials();
    if (!creds) return;

    const text = `Username: ${creds.username}\nPassword: ${creds.password}\nLien : ${window.location.origin}/#/guest-login`;
    navigator.clipboard.writeText(text).then(() => {
      this.dialogService.alert('Copied', 'Credentials copied to clipboard!', 'success');
    });
  }

  copyLoginCredentials(user: UserProfile) {
    const text = `Identifiants SpeakUp pour ${user.name} :\nIdentifiant : ${user.username}\nCode d'accès : ${user.password}\nLien : ${window.location.origin}/#/guest-login`;
    navigator.clipboard.writeText(text).then(() => {
      this.dialogService.alert('Copié !', 'Les identifiants de connexion ont été copiés dans le presse-papiers.', 'success');
    });
  }

  copyLoginLink(user: UserProfile) {
    const link = `${window.location.origin}/#/guest-login?u=${encodeURIComponent(user.username || '')}&p=${encodeURIComponent(user.password || '')}`;
    navigator.clipboard.writeText(link).then(() => {
      this.dialogService.alert('Lien Copié !', 'Le lien d\'accès direct a été copié. Le visiteur pourra se connecter en un clic !', 'success');
    });
  }

  toggleBlock(user: UserProfile) {
    const newBlockedState = !user.blocked;
    
    this.dialogService.show({
      title: newBlockedState ? 'Block User' : 'Unblock User',
      message: `Are you sure you want to ${newBlockedState ? 'block' : 'unblock'} ${user.name}?`,
      type: 'confirm',
      confirmText: newBlockedState ? 'Block' : 'Unblock',
      cancelText: 'Cancel',
      onConfirm: () => {
        this.db.updateUserProfile(user.id, { blocked: newBlockedState }).then(() => {
          this.dialogService.alert(
            'Success',
            `${user.name} has been ${newBlockedState ? 'blocked' : 'unblocked'}.`,
            'success'
          );
        });
      }
    });
  }

  resetGuestPassword(user: UserProfile) {
    const newPassword = this.generatePassword();
    
    this.dialogService.show({
      title: 'Reset Password',
      message: `Generate new password for ${user.name}? Old password will be invalidated.`,
      type: 'confirm',
      confirmText: 'Reset',
      cancelText: 'Cancel',
      onConfirm: () => {
        this.db.updateUserProfile(user.id, { password: newPassword }).then(() => {
          this.dialogService.alert(
            'Password Reset',
            `New password: ${newPassword}\n\nPlease share this with the guest.`,
            'success'
          );
        });
      }
    });
  }

  deleteUser(userId: string) {
    this.dialogService.show({
      title: 'Delete User',
      message: 'Are you sure you want to permanently delete this user? This action cannot be undone.',
      type: 'confirm',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        this.db.deleteUser(userId).then(() => {
          this.dialogService.alert('Deleted', 'User has been permanently deleted.', 'success');
        });
      }
    });
  }
}