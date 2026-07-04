import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-registration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="display:flex; justify-content:center; align-items:center; min-height:100vh; background:linear-gradient(135deg, #F0FDF4 0%, #EEF2FF 100%)">
      <div class="card" style="width:100%; max-width:480px; padding:32px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1)">
        <div style="text-align:center; margin-bottom:24px">
          <div style="font-size:48px; margin-bottom:12px">👨‍🏫</div>
          <h2 style="font-size:22px; font-weight:700; color:var(--text-primary); margin:0 0 8px 0">Teacher Registration</h2>
          <p style="font-size:13px; color:var(--text-secondary); margin:0">
            Create your teacher account to start managing classes and students.
          </p>
        </div>

        @if (errorMessage()) {
          <div style="background:#FEE2E2; border:1px solid #EF4444; color:#DC2626; padding:12px; border-radius:6px; margin-bottom:16px; font-size:13px">
            {{ errorMessage() }}
          </div>
        }

        @if (successMessage()) {
          <div style="background:#D1FAE5; border:1px solid #10B981; color:#065F46; padding:12px; border-radius:6px; margin-bottom:16px; font-size:13px">
            ✅ {{ successMessage() }}
          </div>
        }

        <div style="display:flex; flex-direction:column; gap:16px">
          <div class="input-row">
            <label style="font-size:12px; font-weight:600; color:var(--text-primary); margin-bottom:6px; display:block">Full Name *</label>
            <input 
              type="text" 
              [(ngModel)]="teacherName" 
              placeholder="e.g., AT - Teacher" 
              class="form-input" 
              style="height:44px; font-size:14px; border:1px solid var(--border); border-radius:8px; padding:0 14px; background:var(--surface-1); color:var(--text-primary)" 
            />
          </div>

          <div class="input-row">
            <label style="font-size:12px; font-weight:600; color:var(--text-primary); margin-bottom:6px; display:block">Email Address *</label>
            <input 
              type="email" 
              [(ngModel)]="teacherEmail" 
              placeholder="teacher@example.com" 
              class="form-input" 
              style="height:44px; font-size:14px; border:1px solid var(--border); border-radius:8px; padding:0 14px; background:var(--surface-1); color:var(--text-primary)" 
            />
          </div>

          <div class="input-row">
            <label style="font-size:12px; font-weight:600; color:var(--text-primary); margin-bottom:6px; display:block">Password *</label>
            <input 
              type="password" 
              [(ngModel)]="teacherPassword" 
              placeholder="Minimum 6 characters" 
              class="form-input" 
              style="height:44px; font-size:14px; border:1px solid var(--border); border-radius:8px; padding:0 14px; background:var(--surface-1); color:var(--text-primary)" 
            />
          </div>

          <div class="input-row">
            <label style="font-size:12px; font-weight:600; color:var(--text-primary); margin-bottom:6px; display:block">English Level *</label>
            <select [(ngModel)]="teacherLevel" class="form-select" style="height:44px; font-size:14px; border:1px solid var(--border); border-radius:8px; padding:0 14px; background:var(--surface-1); color:var(--text-primary)">
              <option value="C2">C2 - Mastery</option>
              <option value="C1">C1 - Advanced</option>
              <option value="B2">B2 - Upper Intermediate</option>
            </select>
          </div>

          <div class="input-row">
            <label style="font-size:12px; font-weight:600; color:var(--text-primary); margin-bottom:6px; display:block">Specialization (Optional)</label>
            <input 
              type="text" 
              [(ngModel)]="teacherSpecialization" 
              placeholder="e.g., Business English, IELTS Prep" 
              class="form-input" 
              style="height:44px; font-size:14px; border:1px solid var(--border); border-radius:8px; padding:0 14px; background:var(--surface-1); color:var(--text-primary)" 
            />
          </div>

          <button 
            class="btn-p" 
            [disabled]="!isFormValid() || isLoading()" 
            (click)="register()" 
            style="width:100%; height:44px; font-size:14px; font-weight:700; margin-top:8px">
            @if (isLoading()) {
              <span>Creating Account...</span>
            } @else {
              <span>Create Teacher Account</span>
            }
          </button>

          <div style="text-align:center; margin-top:8px">
            <button (click)="goToLogin()" style="background:none; border:none; color:#4F46E5; font-size:13px; font-weight:600; cursor:pointer; text-decoration:underline">
              Back to login
            </button>
          </div>
        </div>

        <div style="margin-top:24px; padding-top:20px; border-top:1px solid var(--border-weak); text-align:center">
          <p style="font-size:11px; color:var(--text-muted); margin:0">
            By registering, you agree to manage students responsibly and maintain professional conduct.
          </p>
        </div>
      </div>
    </div>
  `
})
export class TeacherRegistrationComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  teacherName = '';
  teacherEmail = '';
  teacherPassword = '';
  teacherLevel = 'C2';
  teacherSpecialization = '';
  errorMessage = signal<string>('');
  successMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  isFormValid(): boolean {
    return this.teacherName.trim().length > 0 &&
           this.teacherEmail.trim().length > 0 &&
           this.teacherPassword.length >= 6 &&
           this.isValidEmail(this.teacherEmail);
  }

  private isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  async register() {
    if (!this.isFormValid()) {
      this.errorMessage.set('Please fill all required fields correctly.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    try {
      const userId = 'teacher-' + Date.now();
      const avatar = this.teacherName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      
      const autoApprove = (this.db as any).autoApproveTeachers();
      
      const newTeacher = {
        id: userId,
        name: this.teacherName,
        role: 'teacher' as const,
        level: this.teacherLevel,
        xp: 0,
        streak: 0,
        lastActive: 'Today',
        avatar,
        email: this.teacherEmail,
        password: this.teacherPassword,
        description: this.teacherSpecialization || '',
        username: this.teacherEmail.split('@')[0],
        blocked: false,
        voiceChatAllowed: true,
        status: (autoApprove ? 'approved' : 'pending') as 'approved' | 'pending'
      };

      const users = [...(this.db as any).users$.value, newTeacher];
      (this.db as any).users$.next(users);
      
      const existingUsers = JSON.parse(localStorage.getItem('speak_users') || '[]');
      existingUsers.push(newTeacher);
      localStorage.setItem('speak_users', JSON.stringify(existingUsers));

      if ((this.db as any).useFirebase) {
        try {
          const { setDoc, doc } = await import('firebase/firestore');
          await setDoc(doc((this.db as any).firestore, 'users', userId), newTeacher);
        } catch (e) {
          console.warn('Firestore teacher registration failed:', e);
        }
      }

      if (autoApprove) {
        (this.db as any).setCurrentUser(userId);
        this.successMessage.set('Votre compte a été créé et activé automatiquement ! Connexion en cours...');
        setTimeout(() => {
          window.location.hash = '#/';
        }, 1500);
      } else {
        this.successMessage.set('Votre compte a été créé avec succès ! Il est actuellement en attente de validation par l\'administrateur.');
        setTimeout(() => {
          this.goToLogin();
        }, 2000);
      }

    } catch (error) {
      this.errorMessage.set('Failed to create account. Please try again.');
      console.error('Registration error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  goToLogin() {
    window.location.hash = '#/';
  }
}