import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, UserProfile } from '../../services/database.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-screen">
      <!-- Ambient animated glowing orbs -->
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>

      <div class="login-card">
        <div style="display:flex; justify-content:center; margin-bottom:12px">
          <img src="logo.png" style="width:36px; height:36px; object-fit:contain; border-radius:8px" alt="logo">
        </div>
        <h2 class="login-title">SpeakUp</h2>
        <p class="login-sub">SpeakUp English Platform — Authentication</p>
        
        <!-- Role Tabs -->
        <div class="tab-row" style="margin-bottom: 20px; justify-content: center">
          <button class="tab" [class.active]="activeRole() === 'student'" (click)="setRole('student')">
            <i class="ti ti-school"></i> Student Login
          </button>
          <button class="tab" [class.active]="activeRole() === 'teacher'" (click)="setRole('teacher')">
            <i class="ti ti-briefcase"></i> Teacher Login
          </button>
        </div>
        
        <!-- Profile List Selector -->
        <div style="margin-bottom:18px">
          <p style="font-size: 10px; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px; letter-spacing: 0.5px">
            Select your account:
          </p>
          <div class="login-grid">
            @for (u of filteredUsers(); track u.id) {
              <button class="login-profile-btn" 
                      [class.selected]="selectedUserId() === u.id" 
                      (click)="selectUser(u.id)">
                <div class="avatar" style="width:24px; height:24px; font-size:10px; margin-right: 2px" [style.background]="u.role === 'teacher' ? '#3730A3' : '#4F46E5'">
                  {{ u.avatar }}
                </div>
                <div style="flex:1">
                  <div style="font-size: 13px; font-weight: 600; color: var(--text-primary); display:flex; align-items:center; gap:6px">
                    <span>{{ u.name }}</span>
                    @if (getFlagUrl(u.countryFlag)) {
                      <img [src]="getFlagUrl(u.countryFlag)" style="width: 16px; height: 12px; object-fit: contain; border-radius: 1px" alt="flag">
                    }
                  </div>
                  @if (u.role === 'student') {
                    <div style="font-size: 10px; color: var(--text-muted)">English level: {{ u.level }} · {{ u.xp }} XP</div>
                  } @else {
                    <div style="font-size: 10px; color: var(--text-muted)">Course Coordinator</div>
                  }
                </div>
                @if (selectedUserId() === u.id) {
                  <i class="ti ti-circle-check" style="color: #4F46E5; font-size: 18px"></i>
                }
              </button>
            } @empty {
              <div style="grid-column: 1 / -1; font-size: 12px; color: var(--text-secondary); text-align: center; padding: 20px; background: var(--surface-2); border-radius: 8px; border: 1px dashed var(--border-strong); width: 100%">
                No student accounts registered yet.<br>
                <span style="font-weight: 600; color: #4F46E5">Log in as a Teacher</span> to add students.
              </div>
            }
          </div>
        </div>
        
        <button class="btn-p" style="width: 100%; height: 42px; border-radius: 8px; font-size: 14px" [disabled]="!selectedUserId()" (click)="signIn()">
          <i class="ti ti-login"></i> Sign In to SpeakUp
        </button>

        <div style="display:flex; align-items:center; margin:16px 0; font-size:11px; color:var(--text-muted)">
          <div style="flex:1; height:1px; background:var(--border)"></div>
          <span style="padding:0 8px; text-transform:uppercase; font-weight:600; letter-spacing:0.5px">or</span>
          <div style="flex:1; height:1px; background:var(--border)"></div>
        </div>

        <button class="google-btn" (click)="signInWithGoogle()">
          <i class="ti ti-brand-google" style="font-size:16px"></i> Sign In with Google
        </button>
      </div>
    </div>
  `
})
export class LoginComponent {
  private db = inject(DatabaseService);

  activeRole = signal<'student' | 'teacher'>('student');
  selectedUserId = signal<string | null>(null);
  allUsers = signal<UserProfile[]>([]);

  constructor() {
    this.db.observeUsers().subscribe(list => {
      this.allUsers.set(list);
      // Auto-select first matching profile if none selected
      this.setDefaultUser();
    });
  }

  setRole(role: 'student' | 'teacher') {
    this.activeRole.set(role);
    this.selectedUserId.set(null);
    this.setDefaultUser();
  }

  filteredUsers() {
    return this.allUsers().filter(u => u.role === this.activeRole());
  }

  selectUser(userId: string) {
    this.selectedUserId.set(userId);
  }

  private setDefaultUser() {
    const list = this.filteredUsers();
    if (list.length > 0) {
      this.selectedUserId.set(list[0].id);
    }
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

  signIn() {
    const uid = this.selectedUserId();
    if (uid) {
      this.db.setCurrentUser(uid);
    }
  }

  async signInWithGoogle() {
    try {
      await this.db.loginWithGoogle(this.activeRole());
    } catch (err: any) {
      console.error('Google Sign-In failed:', err);
    }
  }
}
