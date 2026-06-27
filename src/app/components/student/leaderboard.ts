import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, UserProfile } from '../../services/database.service';

@Component({
  selector: 'app-student-leaderboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <!-- Tabs (This week, All time) -->
      <div class="tab-row" style="margin-bottom: 24px">
        <button class="tab" [class.active]="selectedTab() === 'week'" (click)="selectedTab.set('week')">
          <i class="ti ti-calendar-stats"></i> Weekly Sprint
        </button>
        <button class="tab" [class.active]="selectedTab() === 'all'" (click)="selectedTab.set('all')">
          <i class="ti ti-world"></i> Hall of Fame (All Time)
        </button>
      </div>

      <!-- TOP 3 PODIUM WIDGET -->
      @if (getTop3().length > 0) {
        <div class="podium-container" style="animation: scaleUp 0.3s ease-out">
          
          <!-- Second Place (Left) -->
          @if (getTop3()[1]; as p2) {
            <div class="podium-pedestal-wrapper second">
              <div class="podium-avatar-wrapper">
                <div class="avatar-ring silver">
                  <span class="avatar-emoji">{{ p2.avatar }}</span>
                </div>
                @if (getFlagUrl(p2.countryFlag)) {
                  <img class="podium-flag" [src]="getFlagUrl(p2.countryFlag)" alt="flag">
                }
              </div>
              <div class="podium-pedestal silver">
                <span class="podium-rank-num">2</span>
                <span class="podium-name">{{ p2.name }}</span>
                <span class="podium-score">{{ getXPDisplay(p2) }} XP</span>
              </div>
            </div>
          }

          <!-- First Place (Center) -->
          @if (getTop3()[0]; as p1) {
            <div class="podium-pedestal-wrapper first">
              <div class="podium-avatar-wrapper">
                <!-- Golden Crown -->
                <div class="crown-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#FBBF24" stroke="#D97706" stroke-width="1.5">
                    <path d="M2 4 5 12h14l3-8-5 4-5-8-5 8-5-4Z"/>
                    <path d="M5 20h14a2 2 0 0 0 2-2v-2H3v2a2 2 0 0 0 2 2Z"/>
                  </svg>
                </div>
                <div class="avatar-ring gold">
                  <span class="avatar-emoji">{{ p1.avatar }}</span>
                </div>
                @if (getFlagUrl(p1.countryFlag)) {
                  <img class="podium-flag" [src]="getFlagUrl(p1.countryFlag)" alt="flag">
                }
              </div>
              <div class="podium-pedestal gold">
                <span class="podium-rank-num">1</span>
                <span class="podium-name">{{ p1.name }}</span>
                <span class="podium-score">{{ getXPDisplay(p1) }} XP</span>
              </div>
            </div>
          }

          <!-- Third Place (Right) -->
          @if (getTop3()[2]; as p3) {
            <div class="podium-pedestal-wrapper third">
              <div class="podium-avatar-wrapper">
                <div class="avatar-ring bronze">
                  <span class="avatar-emoji">{{ p3.avatar }}</span>
                </div>
                @if (getFlagUrl(p3.countryFlag)) {
                  <img class="podium-flag" [src]="getFlagUrl(p3.countryFlag)" alt="flag">
                }
              </div>
              <div class="podium-pedestal bronze">
                <span class="podium-rank-num">3</span>
                <span class="podium-name">{{ p3.name }}</span>
                <span class="podium-score">{{ getXPDisplay(p3) }} XP</span>
              </div>
            </div>
          }

        </div>
      }

      <!-- LEADERBOARD LIST ROWS -->
      <div class="leaderboard-list" style="animation: fadeIn 0.25s">
        @for (user of getListUsers(); track user.id; let idx = $index) {
          <!-- Rank index starts at 4 -->
          <div class="leaderboard-item" 
               [class.is-me]="user.id === currentUserId()">
            
            <!-- Rank display -->
            <div class="rank">
              {{ idx + 4 }}
            </div>
            
            <!-- Avatar -->
            <div class="avatar" style="width:30px; height:30px; font-size:13px; flex-shrink:0">
              {{ user.avatar }}
            </div>

            <!-- Name -->
            <div class="lb-name" style="display:flex; align-items:center; gap:6px; flex:1">
              <span style="font-weight:600">{{ user.id === currentUserId() ? 'You — ' : '' }}{{ user.name }}</span>
              @if (getFlagUrl(user.countryFlag)) {
                <img [src]="getFlagUrl(user.countryFlag)" style="width: 14px; height: 10px; object-fit: contain; border-radius: 1px" alt="flag">
              }
            </div>

            <!-- XP -->
            <div class="lb-xp" style="font-weight: 700; color:#4F46E5">
              {{ getXPDisplay(user) | number }} XP
            </div>
          </div>
        } @empty {
          @if (getListUsers().length === 0 && getTop3().length === 0) {
            <div style="text-align:center; padding:30px; font-size:12px; color:var(--text-muted)">
              No students recorded yet.
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    /* 3D Podium CSS Layout */
    .podium-container {
      display: flex;
      justify-content: center;
      align-items: flex-end;
      gap: 16px;
      margin-bottom: 32px;
      padding: 30px 10px 10px 10px;
      background: var(--surface-1);
      border-radius: 12px;
      border: 1px solid var(--border-weak);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
    }

    .podium-pedestal-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      max-width: 110px;
    }

    .podium-avatar-wrapper {
      position: relative;
      margin-bottom: 8px;
    }

    .avatar-ring {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: #FFF;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 3px solid;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }

    .avatar-ring.gold { border-color: #FBBF24; width: 54px; height: 54px; }
    .avatar-ring.silver { border-color: #9CA3AF; }
    .avatar-ring.bronze { border-color: #D97706; }

    .avatar-emoji {
      font-size: 20px;
    }
    .avatar-ring.gold .avatar-emoji {
      font-size: 24px;
    }

    .podium-flag {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 16px;
      height: 12px;
      object-fit: contain;
      border: 1.5px solid #FFF;
      border-radius: 2px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .crown-icon {
      position: absolute;
      top: -18px;
      left: 50%;
      transform: translateX(-50%);
      animation: bounce-crown 1.5s infinite ease-in-out;
    }

    @keyframes bounce-crown {
      0%, 100% { transform: translate(-50%, 0); }
      50% { transform: translate(-50%, -4px); }
    }

    /* Pedestals */
    .podium-pedestal {
      width: 100%;
      border-radius: 8px 8px 4px 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 12px 6px;
      text-align: center;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
    }

    .podium-pedestal.gold {
      height: 100px;
      background: linear-gradient(180deg, #FEF3C7 0%, #FFFBEB 100%);
      border: 1px solid #FDE68A;
      color: #92400E;
    }

    .podium-pedestal.silver {
      height: 80px;
      background: linear-gradient(180deg, #F3F4F6 0%, #F9FAFB 100%);
      border: 1px solid #E5E7EB;
      color: #4B5563;
    }

    .podium-pedestal.bronze {
      height: 65px;
      background: linear-gradient(180deg, #FFEDD5 0%, #FFF7ED 100%);
      border: 1px solid #FED7AA;
      color: #9A3412;
    }

    .podium-rank-num {
      font-size: 20px;
      font-weight: 800;
      opacity: 0.8;
    }

    .podium-name {
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 90px;
      margin-top: 4px;
    }

    .podium-score {
      font-size: 10px;
      font-weight: 800;
      opacity: 0.9;
      margin-top: 2px;
    }

    /* Leaderboard rows styling */
    .leaderboard-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .leaderboard-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      background: var(--surface-1);
      border: 1px solid var(--border-weak);
      border-radius: 8px;
      transition: all 0.15s;
    }

    .leaderboard-item.is-me {
      border-color: #C7D2FE;
      background: #EEF2FF;
    }

    .leaderboard-item .rank {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-secondary);
      width: 20px;
    }

    @keyframes scaleUp {
      from { transform: scale(0.96); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class StudentLeaderboardComponent {
  private db = inject(DatabaseService);
  users = signal<UserProfile[]>([]);
  currentUser = signal<UserProfile | null>(null);

  // Tab filter: 'week' Sprint vs 'all' Time
  selectedTab = signal<'week' | 'all'>('week');

  // Computed sorted users based on selected tab
  sortedUsers = computed(() => {
    const list = [...this.users()];
    if (this.selectedTab() === 'week') {
      // Simulate a weekly dynamic score by using streak + XP remainder to show activity changes!
      return list.sort((a, b) => {
        const scoreA = (a.xp % 350) + (a.streak * 80);
        const scoreB = (b.xp % 350) + (b.streak * 80);
        return scoreB - scoreA;
      });
    } else {
      // All time hall of fame
      return list.sort((a, b) => b.xp - a.xp);
    }
  });

  // Top 3 computed users
  getTop3 = computed(() => {
    return this.sortedUsers().slice(0, 3);
  });

  // Remainder computed users (from rank 4 onwards)
  getListUsers = computed(() => {
    return this.sortedUsers().slice(3);
  });

  constructor() {
    this.db.observeUsers().subscribe(list => {
      this.users.set(list.filter(u => u.role === 'student'));
    });
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
  }

  getXPDisplay(user: UserProfile): number {
    if (this.selectedTab() === 'week') {
      return (user.xp % 350) + (user.streak * 80);
    }
    return user.xp;
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
}
