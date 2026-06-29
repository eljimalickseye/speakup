import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from './components/layout/layout';
import { LoginComponent } from './components/login/login';
import { GuestLoginComponent } from './components/auth/guest-login';
import { DatabaseService, UserProfile } from './services/database.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LayoutComponent, LoginComponent, GuestLoginComponent],
  template: `
    <!-- SPLASH SCREEN -->
    @if (showSplash()) {
      <div class="splash-screen" [class.splash-fade-out]="splashFadingOut()">
        <div class="splash-content">
          <div class="splash-logo-wrapper">
            <img src="logo.png" alt="SpeakUp Logo" class="splash-logo" />
            <div class="splash-ring splash-ring-1"></div>
            <div class="splash-ring splash-ring-2"></div>
          </div>
          <h1 class="splash-title">SpeakUp</h1>
          <p class="splash-subtitle">English Learning Platform</p>
          <div class="splash-loader">
            <div class="splash-bar"></div>
          </div>
        </div>
      </div>
    }

    <!-- APP CONTENT -->
    @if (!showSplash()) {
      @if (currentUser()) {
        <app-layout></app-layout>
      } @else if (isGuestLogin()) {
        <app-guest-login></app-guest-login>
      } @else {
        <app-login></app-login>
      }
    }
  `,
  styles: [`
    .splash-screen {
      position: fixed;
      inset: 0;
      background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      animation: splashIn 0.4s ease-out;
    }

    .splash-fade-out {
      animation: splashOut 0.6s ease-in-out forwards;
    }

    @keyframes splashIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes splashOut {
      0% { opacity: 1; transform: scale(1); }
      100% { opacity: 0; transform: scale(1.05); }
    }

    .splash-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      animation: splashContentIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
    }

    @keyframes splashContentIn {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .splash-logo-wrapper {
      position: relative;
      width: 100px;
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .splash-logo {
      width: 80px;
      height: 80px;
      object-fit: contain;
      border-radius: 20px;
      box-shadow: 0 0 40px rgba(167, 139, 250, 0.5);
      position: relative;
      z-index: 2;
    }

    .splash-ring {
      position: absolute;
      border-radius: 50%;
      border: 2px solid rgba(167, 139, 250, 0.3);
      animation: ringPulse 2s ease-in-out infinite;
    }

    .splash-ring-1 {
      width: 100px;
      height: 100px;
      animation-delay: 0s;
    }

    .splash-ring-2 {
      width: 130px;
      height: 130px;
      animation-delay: 0.5s;
    }

    @keyframes ringPulse {
      0%, 100% { transform: scale(0.9); opacity: 0.3; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }

    .splash-title {
      font-size: 36px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -1px;
      font-family: 'Outfit', sans-serif;
      text-shadow: 0 2px 20px rgba(167, 139, 250, 0.4);
    }

    .splash-subtitle {
      font-size: 14px;
      color: rgba(196, 181, 253, 0.8);
      font-weight: 500;
      letter-spacing: 2px;
      text-transform: uppercase;
      font-family: 'Inter', sans-serif;
    }

    .splash-loader {
      width: 160px;
      height: 3px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 99px;
      overflow: hidden;
      margin-top: 8px;
    }

    .splash-bar {
      height: 100%;
      background: linear-gradient(90deg, #a78bfa, #818cf8, #6366f1);
      border-radius: 99px;
      animation: splashLoad 2.2s ease-in-out forwards;
    }

    @keyframes splashLoad {
      0% { width: 0%; }
      30% { width: 40%; }
      70% { width: 75%; }
      100% { width: 100%; }
    }
  `]
})
export class App implements OnInit {
  title = 'speak-up';

  private db = inject(DatabaseService);
  currentUser = signal<UserProfile | null>(null);
  isGuestLogin = signal<boolean>(false);
  showSplash = signal<boolean>(true);
  splashFadingOut = signal<boolean>(false);

  ngOnInit() {
    // Start splash screen timer
    setTimeout(() => {
      this.splashFadingOut.set(true);
      setTimeout(() => {
        this.showSplash.set(false);
      }, 600);
    }, 2400);
  }

  constructor() {
    this.db.observeCurrentUser().subscribe(user => {
      this.currentUser.set(user);
      if (user) {
        this.isGuestLogin.set(false);
      }
    });

    // Check URL hash for guest login route
    if (window.location.hash === '#/guest-login') {
      this.isGuestLogin.set(true);
    }

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      this.isGuestLogin.set(window.location.hash === '#/guest-login');
    });
  }
}
