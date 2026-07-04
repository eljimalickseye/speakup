import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, UserProfile, LeaderboardReward } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

interface BadgeItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" style="animation: fadeIn 0.28s ease">
      
      <!-- HERO PROFILE CARD -->
      <div class="card" style="background: linear-gradient(135deg, #1E1B4B 0%, #311042 100%); color: white; border: none; padding: 24px; border-radius: 16px; margin-top: 0; box-shadow: 0 10px 30px rgba(49, 16, 66, 0.25)">
        <div style="display:flex; align-items:center; gap:24px; flex-wrap:wrap">
          
          <!-- Avatar with Frame -->
          <div style="position:relative; width:90px; height:90px; flex-shrink:0; display:flex; align-items:center; justify-content:center">
            <!-- Custom active frame -->
            <div [style]="currentUser()?.activeFrame || 'border: 2px dashed rgba(255,255,255,0.2)'" 
                 style="position:absolute; inset:-4px; border-radius:50%; pointer-events:none"></div>
            
            <div style="width:100%; height:100%; border-radius:50%; background:#4F46E5; color:white; font-size:36px; font-weight:800; display:flex; align-items:center; justify-content:center; box-shadow: 0 4px 10px rgba(0,0,0,0.3)">
              {{ currentUser()?.activeAvatar || currentUser()?.avatar }}
            </div>
          </div>

          <div style="flex:1">
            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap">
              <h2 style="font-size:22px; font-weight:800; margin:0; color:#FFF">{{ currentUser()?.name }}</h2>
              <span class="badge" style="background:#F59E0B; color:#1E1B4B; font-weight:800; font-size:10px; border-radius:20px; padding:3px 10px">
                👑 Title: {{ currentUser()?.activeTitle || 'Explorer' }}
              </span>
            </div>
            
            <p style="margin:4px 0 12px 0; font-size:12.5px; color:#C7D2FE">
              Assiduously learning English · Assessed Level: <strong>{{ currentUser()?.level }}</strong>
            </p>

            <!-- XP Circle & Level Progression -->
            <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap">
              <div style="position:relative; width:52px; height:52px; flex-shrink:0">
                <svg width="52" height="52" viewBox="0 0 36 36" style="transform: rotate(-90deg)">
                  <path stroke="rgba(255,255,255,0.12)" stroke-width="3" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path [attr.stroke-dasharray]="getXPDashArray()" stroke="#10B981" stroke-width="3" stroke-linecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; color:#FFF">
                  Lv.{{ getLevel() }}
                </div>
              </div>

              <div style="flex:1; min-width:180px">
                <div style="display:flex; justify-content:space-between; font-size:11.5px; color:#C7D2FE; margin-bottom:4px; font-weight:600">
                  <span>Level Progress</span>
                  <span>{{ getLevelXP() }} / {{ getNextLevelXP() }} XP</span>
                </div>
                <div style="width:100%; height:8px; background:rgba(255,255,255,0.12); border-radius:4px; overflow:hidden">
                  <div [style.width.%]="getXPPercentage()" style="height:100%; background: linear-gradient(90deg, #10B981, #34D399); border-radius:4px; transition: width 0.4s ease"></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Tab row below profile card -->
      <div style="display:flex; gap:10px; margin-top:20px; border-bottom:1.5px solid var(--border-weak); padding-bottom:6px">
        <button (click)="activeProfileTab.set('stats')"
                [style.border-bottom-color]="activeProfileTab() === 'stats' ? '#4F46E5' : 'transparent'"
                [style.color]="activeProfileTab() === 'stats' ? 'var(--text-primary)' : 'var(--text-muted)'"
                style="padding:8px 16px; border:none; background:none; cursor:pointer; font-weight:700; border-bottom:2px solid transparent; font-size:13px; display:flex; align-items:center; gap:6px; transition:all 0.15s">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          {{ t('Succès & Stats', 'Badges & Stats') }}
        </button>

      </div>


      <!-- MAIN LAYOUT COLS -->
      @if (activeProfileTab() === 'stats') {
      <!-- MAIN LAYOUT COLS -->
<div style="display:grid; grid-template-columns: 1.4fr 1fr; gap:20px; margin-top:20px; align-items:start" class="profile-layout">
        
        <!-- Left: Badge Collection & Titles -->
        <div style="display:flex; flex-direction:column; gap:20px">
          
          <!-- Badges -->
          <div class="card" style="margin:0">
            <h3 class="section-title" style="margin-bottom:16px; display:flex; align-items:center; gap:8px">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M12 2v3M12 19v3M5 12H2m17 0h3M18.36 5.64l-2.12 2.12M7.76 16.24l-2.12 2.12M18.36 18.36l-2.12-2.12M7.76 7.76L5.64 5.64"/></svg>
              <span>Rare Badges & Achievements</span>
            </h3>
            
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap:12px">
              @for (badge of allBadges; track badge.id) {
                <div 
                  [style.opacity]="isBadgeUnlocked(badge.id) ? '1' : '0.45'"
                  [style.border-color]="isBadgeUnlocked(badge.id) ? getBadgeBorder(badge.rarity) : 'var(--border)'"
                  style="border: 1.5px solid; padding: 12px 10px; border-radius: 12px; text-align: center; background: var(--surface-1); transition: all 0.2s; position:relative; cursor:help"
                  [title]="badge.title + ': ' + badge.description">
                  
                  <div style="font-size:32px; margin-bottom:6px">{{ badge.icon }}</div>
                  <div style="font-size:11.5px; font-weight:700; color:var(--text-primary); line-height:1.2">{{ badge.title }}</div>
                  
                  <span class="badge" 
                        [style.background]="getBadgeBg(badge.rarity)" 
                        [style.color]="getBadgeColor(badge.rarity)" 
                        style="font-size:8px; padding:1px 5px; border-radius:4px; font-weight:700; text-transform:uppercase; margin-top:6px; display:inline-block">
                    {{ badge.rarity }}
                  </span>

                  @if (!isBadgeUnlocked(badge.id)) {
                    <div style="position:absolute; top:6px; right:6px; background:#64748B; color:white; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; font-size:10px">
                      🔒
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Unlockable Character Titles -->
          <div class="card" style="margin:0">
            <h3 class="section-title" style="margin-bottom:12px; display:flex; align-items:center; gap:8px">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              <span>Unlockable Character Titles</span>
            </h3>
            <p style="font-size:11.5px; color:var(--text-secondary); margin:0 0 12px 0">Choose an honorific title to represent your status on the platform.</p>
            
            <div style="display:flex; flex-wrap:wrap; gap:8px">
              @for (title of getAvailableTitles(); track title) {
                <button 
                  (click)="changeTitle(title)"
                  [style.background]="currentUser()?.activeTitle === title ? '#4F46E5' : 'var(--surface-2)'"
                  [style.color]="currentUser()?.activeTitle === title ? 'white' : 'var(--text-primary)'"
                  [style.border-color]="currentUser()?.activeTitle === title ? '#4F46E5' : 'var(--border)'"
                  style="border:1px solid; padding:6px 12px; border-radius:20px; font-size:11.5px; font-weight:700; cursor:pointer; transition:all 0.15s">
                  {{ title }}
                </button>
              }
            </div>
          </div>

        </div>

        <!-- Right: Stats & Garden Link -->
        <div style="display:flex; flex-direction:column; gap:20px">
          
          <!-- Character Stats -->
          <div class="card" style="margin:0; padding:20px">
            <h3 class="section-title" style="margin-bottom:16px; display:flex; align-items:center; gap:8px">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
              <span>Character Statistics</span>
            </h3>

            <div style="display:flex; flex-direction:column; gap:12px">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed var(--border-weak); padding-bottom:8px">
                <span style="font-size:12.5px; color:var(--text-secondary); font-weight:500">SpeakUp Coins 🪙</span>
                <strong style="font-size:14px; color:#F59E0B">{{ currentUser()?.coins || 0 }} Coins</strong>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed var(--border-weak); padding-bottom:8px">
                <span style="font-size:12.5px; color:var(--text-secondary); font-weight:500">Practice Streak 🔥</span>
                <strong style="font-size:14px; color:#EF4444">{{ currentUser()?.streak || 0 }} Days</strong>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px dashed var(--border-weak); padding-bottom:8px">
                <span style="font-size:12.5px; color:var(--text-secondary); font-weight:500">Total Experience 📈</span>
                <strong style="font-size:14px; color:#10B981">{{ currentUser()?.xp || 0 }} XP</strong>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:4px">
                <span style="font-size:12.5px; color:var(--text-secondary); font-weight:500">Assigned Rank 🏆</span>
                <strong style="font-size:14px; color:#4F46E5">#{{ studentRank }} on school board</strong>
              </div>
            </div>
          </div>

          <!-- SpeakUp Garden Status Widget -->
          <div class="card" style="margin:0; background:linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border: 1px solid #A7F3D0">
            <h3 class="st" style="color:#065F46; font-size:14px; margin:0 0 6px 0; display:flex; align-items:center; gap:6px">
              🌱 My SpeakUp Garden
            </h3>
            <p style="font-size:12px; color:#047857; margin:0 0 12px 0; line-height:1.4">
              Your garden has grown <strong>{{ currentUser()?.garden?.trees || 0 }} Trees</strong> and <strong>{{ currentUser()?.garden?.flowers || 0 }} Flowers</strong>.
            </p>
            
            <div style="display:flex; align-items:center; justify-content:space-between; background:white; padding:10px 14px; border-radius:8px; border:1px solid #A7F3D0">
              <span style="font-size:11.5px; font-weight:700; color:#047857">Status: {{ (currentUser()?.garden?.healthStatus || 'healthy') | uppercase }}</span>
              <span style="font-size:18px">
                {{ currentUser()?.garden?.healthStatus === 'wilted' ? '🍂' : (currentUser()?.garden?.healthStatus === 'flourishing' ? '🌳🌸' : '🌿') }}
              </span>
            </div>
          </div>

        </div>

      </div>


      }


    </div>
  `,
  styles: [`

    .cert-modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      padding: 16px;
    }
    .cert-modal-card {
      background: white;
      border-radius: 16px;
      max-width: 760px;
      width: 100%;
      padding: 24px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15);
    }
    @media (max-width: 768px) {
      .profile-layout {
        grid-template-columns: 1fr !important;
      }
    }
    @media print {
      body * {
        visibility: hidden !important;
      }
      .cert-modal-overlay {
        position: absolute !important;
        left: 0 !important; top: 0 !important;
        background: none !important;
        backdrop-filter: none !important;
      }
      .cert-modal-card {
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
      }
      .no-print {
        display: none !important;
      }
      .printable-certificate, .printable-certificate * {
        visibility: visible !important;
      }
      .printable-certificate {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        border: 8px double #1E1B4B !important;
        padding: 30px !important;
        box-shadow: none !important;
        background: #FAF9F6 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }

  `]
})
export class StudentProfileComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  activeProfileTab = signal<'stats'>('stats');
  currentUser = signal<UserProfile | null>(null);
  studentRank = 1;

  activeLang = this.db.activeLang;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

  allBadges: BadgeItem[] = [
    { id: 'streak-10', title: '10 Days Streak', description: 'Practice for 10 consecutive days', icon: '🔥', rarity: 'rare' },
    { id: 'streak-100', title: 'Centurion', description: 'Keep a 100 days practice streak alive', icon: '👑', rarity: 'legendary' },
    { id: 'words-1000', title: 'Vocab Master', description: 'Save 1,000 words in your smart dictionary', icon: '📚', rarity: 'epic' },
    { id: 'dialogue-first', title: 'First Contact', description: 'Complete your first private dialogue recording with the teacher', icon: '💬', rarity: 'common' },
    { id: 'champion-week', title: 'Weekly Champ', description: 'Finish first on the weekly leaderboard rankings', icon: '🏆', rarity: 'epic' },
    { id: 'polyglot', title: 'Polyglot', description: 'Attain fluency level B2 or higher', icon: '🌍', rarity: 'legendary' }
  ];

  constructor() {
    this.db.observeCurrentUser().subscribe(u => {
      this.currentUser.set(u);
    });

    this.db.observeUsers().subscribe(list => {
      const students = list
        .filter(u => u.role === 'student')
        .sort((a, b) => b.xp - a.xp);
      const idx = students.findIndex(s => s.id === this.currentUser()?.id);
      this.studentRank = idx !== -1 ? idx + 1 : 1;
    });
  }

  isBadgeUnlocked(badgeId: string): boolean {
    return this.currentUser()?.unlockedBadges?.includes(badgeId) || false;
  }

  getLevel(): number {
    const xp = this.currentUser()?.xp || 0;
    return Math.floor(xp / 1000) + 1;
  }

  getLevelXP(): number {
    const xp = this.currentUser()?.xp || 0;
    return xp % 1000;
  }

  getNextLevelXP(): number {
    return 1000;
  }

  getXPPercentage(): number {
    return (this.getLevelXP() / this.getNextLevelXP()) * 100;
  }

  getXPDashArray(): string {
    const pct = this.getXPPercentage();
    const circumference = 2 * Math.PI * 15.9155; // 100
    const strokeValue = (pct / 100) * circumference;
    return `${strokeValue} ${circumference}`;
  }

  getAvailableTitles(): string[] {
    const list = ['Explorer', 'Word Smith'];
    const level = this.getLevel();
    if (level >= 3) list.push('Grammar Knight');
    if (level >= 5) list.push('Fluency Master');
    if (level >= 8) list.push('English Wizard');
    if (this.currentUser()?.level === 'B2' || this.currentUser()?.level === 'C1') {
      list.push('Polyglot Scholar');
    }
    return list;
  }

  async changeTitle(title: string) {
    const user = this.currentUser();
    if (user) {
      const usersList = [...this.db['users$'].value];
      const idx = usersList.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        usersList[idx] = { ...usersList[idx], activeTitle: title };
        this.db['users$'].next(usersList);
        this.db['saveLocal']('speak_users', usersList);
        this.currentUser.set(usersList[idx]);
        this.dialogService.alert('Title Updated', `Your character title is now "${title}"!`, 'success');
      }
    }
  }

  getBadgeBorder(rarity: string): string {
    switch (rarity) {
      case 'legendary': return '#D97706'; // Gold
      case 'epic': return '#8B5CF6'; // Purple
      case 'rare': return '#3B82F6'; // Blue
      default: return '#94A3B8'; // Gray
    }
  }

  getBadgeBg(rarity: string): string {
    switch (rarity) {
      case 'legendary': return '#FEF3C7';
      case 'epic': return '#EDE9FE';
      case 'rare': return '#EFF6FF';
      default: return '#F1F5F9';
    }
  }

  getBadgeColor(rarity: string): string {
    switch (rarity) {
      case 'legendary': return '#D97706';
      case 'epic': return '#7C3AED';
      case 'rare': return '#2563EB';
      default: return '#475569';
    }
  }
}
