import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from './components/layout/layout';
import { LoginComponent } from './components/login/login';
import { GuestLoginComponent } from './components/auth/guest-login';
import { DatabaseService, UserProfile } from './services/database.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LayoutComponent, LoginComponent, GuestLoginComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'speak-up';
  
  private db = inject(DatabaseService);
  currentUser = signal<UserProfile | null>(null);
  isGuestLogin = signal<boolean>(false);

  constructor() {
    this.db.observeCurrentUser().subscribe(user => {
      this.currentUser.set(user);
      // If user logs in, clear guest login state
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
