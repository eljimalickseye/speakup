import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../../services/database.service';

@Component({
  selector: 'app-guest-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-screen">
      <!-- Ambient animated glowing orbs matching the logo -->
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="orb orb-4"></div>

      <div class="login-card" style="position:relative">
        <div style="text-align:center; margin-bottom:24px">
          <div style="display:flex; justify-content:center; margin-bottom:18px">
            <img src="logo.png" style="width:64px; height:64px; object-fit:contain; border-radius:14px; filter: drop-shadow(0 8px 16px rgba(30, 166, 179, 0.25))" alt="logo">
          </div>
          <h2 style="font-size:22px; font-weight:800; color:var(--text-primary); margin:0 0 4px 0; font-family:'Outfit', sans-serif">
            <span style="color:#1b3b6f">Guest</span> <span style="color:#ff5a5f">Login</span>
          </h2>
          <p style="font-size:12px; color:var(--text-secondary); margin:0; font-family:'Inter', sans-serif">
            Use the credentials provided by your teacher to access your account.
          </p>
        </div>

        @if (errorMessage()) {
          <div style="background:#FEE2E2; border:1px solid #EF4444; color:#DC2626; padding:12px; border-radius:6px; margin-bottom:16px; font-size:13px">
            {{ errorMessage() }}
          </div>
        }

        @if (loginSuccess()) {
          <div style="background:#D1FAE5; border:1px solid #10B981; color:#065F46; padding:12px; border-radius:6px; margin-bottom:16px; font-size:13px">
            ✅ Login successful! Redirecting...
          </div>
        }

        <div style="display:flex; flex-direction:column; gap:16px">
          <div class="input-row">
            <label style="font-size:12px; font-weight:600; color:var(--text-primary); margin-bottom:6px; display:block">Username</label>
            <input 
              type="text" 
              [(ngModel)]="username" 
              (keyup.enter)="login()"
              placeholder="Enter your username" 
              class="form-input" 
              style="height:44px; font-size:14px; border:1px solid var(--border); border-radius:8px; padding:0 14px; background:var(--surface-1); color:var(--text-primary)" 
            />
          </div>

          <div class="input-row">
            <label style="font-size:12px; font-weight:600; color:var(--text-primary); margin-bottom:6px; display:block">Password</label>
            <input 
              type="password" 
              [(ngModel)]="password" 
              (keyup.enter)="login()"
              placeholder="Enter your password" 
              class="form-input" 
              style="height:44px; font-size:14px; border:1px solid var(--border); border-radius:8px; padding:0 14px; background:var(--surface-1); color:var(--text-primary)" 
            />
          </div>

          <button 
            class="btn-p" 
            [disabled]="!username || !password || isLoading()" 
            (click)="login()" 
            style="width:100%; height:44px; font-size:14px; font-weight:700; margin-top:8px; background:linear-gradient(135deg, #1b3b6f 0%, #7b2cb1 100%); border:none; color:white; cursor:pointer; box-shadow: 0 4px 12px rgba(123, 44, 177, 0.25)">
            @if (isLoading()) {
              <span>Logging in...</span>
            } @else {
              <span>Login</span>
            }
          </button>

          <div style="text-align:center; margin-top:8px">
            <button (click)="goToMainLogin()" style="background:none; border:none; color:#1ea6b3; font-size:13px; font-weight:600; cursor:pointer; text-decoration:underline">
              Back to main login
            </button>
          </div>
        </div>

        <div style="margin-top:24px; padding-top:20px; border-top:1px solid var(--border-weak); text-align:center">
          <p style="font-size:11px; color:var(--text-muted); margin:0">
            Don't have credentials? Contact your teacher to get a guest account.
          </p>
        </div>
      </div>
    </div>
  `
})
export class GuestLoginComponent {
  private db = inject(DatabaseService);

  username = '';
  password = '';
  errorMessage = signal<string>('');
  loginSuccess = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  allUsersList: any[] = [];

  constructor() {
    // Check if already logged in
    this.db.observeCurrentUser().subscribe(user => {
      if (user && user.role === 'guest') {
        this.loginSuccess.set(true);
        setTimeout(() => {
          window.location.hash = '';
        }, 1000);
      }
    });

    // Check for auto-login parameters once users are loaded
    this.db.observeUsers().subscribe(usersList => {
      this.allUsersList = usersList;
      if (usersList.length > 0) {
        const hash = window.location.hash;
        const parts = hash.split('?');
        if (parts.length > 1) {
          const urlParams = new URLSearchParams(parts[1]);
          const u = urlParams.get('u');
          const p = urlParams.get('p');
          if (u && p && !this.username && !this.password) {
            this.username = u;
            this.password = p;
            this.login();
          }
        }
      }
    });
  }

  login() {
    if (!this.username || !this.password) {
      this.errorMessage.set('Please enter both username and password');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // Simulate network delay
    setTimeout(() => {
      const allUsers = this.allUsersList;
      
      // Find guest user with matching username and password
      const guestUser = allUsers.find((u: any) => 
        u.role === 'guest' && 
        u.username === this.username && 
        u.password === this.password
      );

      if (guestUser) {
        // Check if user is blocked
        if (guestUser.blocked) {
          this.errorMessage.set('This account has been blocked. Please contact your teacher.');
          this.isLoading.set(false);
          return;
        }

        // Login successful
        this.db.setCurrentUser(guestUser.id);
        this.loginSuccess.set(true);
        
        setTimeout(() => {
          window.location.hash = '';
        }, 1000);
      } else {
        this.errorMessage.set('Invalid username or password. Please try again.');
        this.isLoading.set(false);
      }
    }, 500);
  }

  goToMainLogin() {
    window.location.hash = '';
  }
}