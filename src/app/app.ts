import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from './components/layout/layout';
import { LoginComponent } from './components/login/login';
import { DatabaseService, UserProfile } from './services/database.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LayoutComponent, LoginComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'speak-up';
  
  private db = inject(DatabaseService);
  currentUser = signal<UserProfile | null>(null);

  constructor() {
    this.db.observeCurrentUser().subscribe(user => {
      this.currentUser.set(user);
    });
  }
}
