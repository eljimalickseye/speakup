import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, UserProfile } from '../../services/database.service';

@Component({
  selector: 'app-student-leaderboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <!-- Tabs (This week, All time) -->
      <div class="tab-row">
        <button class="tab active">This week</button>
        <button class="tab">All time</button>
      </div>

      <!-- Leaderboard Lists -->
      <div style="display:flex; flex-direction:column; gap:4px">
        @for (user of sortedUsers(); track user.id; let idx = $index) {
          <div class="leaderboard-item" 
               [style.border-color]="user.id === currentUserId() ? '#4F46E5' : (idx + 1 === 1 ? '#FDE68A' : 'var(--border)')"
               [style.background]="user.id === currentUserId() ? '#EEF2FF' : (idx + 1 === 1 ? '#FFFBEB' : (idx + 1 === 3 ? '#FEF3C7' : 'var(--surface-1)'))">
            
            <!-- Rank display -->
            <div class="rank" [class.gold]="idx + 1 === 1" [class.silver]="idx + 1 === 2" [class.bronze]="idx + 1 === 3">
              {{ idx + 1 }}
            </div>
            
            <!-- Avatar -->
            <div class="avatar" 
                 [style.background]="idx + 1 === 1 ? '#D97706' : (idx + 1 === 2 ? '#6B7280' : (idx + 1 === 3 ? '#92400E' : '#4F46E5'))"
                 style="width:28px; height:28px; font-size:11px">
              {{ user.avatar }}
            </div>

            <!-- Name -->
            <div class="lb-name" style="display:flex; align-items:center; gap:6px">
              <span>{{ user.id === currentUserId() ? 'You — ' : '' }}{{ user.name }}</span>
              @if (getFlagUrl(user.countryFlag)) {
                <img [src]="getFlagUrl(user.countryFlag)" style="width: 16px; height: 12px; object-fit: contain; border-radius: 1px" alt="flag">
              }
            </div>

            <!-- XP -->
            <div class="lb-xp">
              {{ user.xp | number }} XP
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class StudentLeaderboardComponent {
  private db = inject(DatabaseService);
  users = signal<UserProfile[]>([]);
  currentUser = signal<UserProfile | null>(null);

  constructor() {
    this.db.observeUsers().subscribe(list => {
      // Filter out teachers, only display students on leaderboard
      this.users.set(list.filter(u => u.role === 'student'));
    });
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
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

  currentUserId() {
    return this.currentUser()?.id || '';
  }

  sortedUsers() {
    // Sort users by XP points descending
    return [...this.users()].sort((a, b) => b.xp - a.xp);
  }
}
