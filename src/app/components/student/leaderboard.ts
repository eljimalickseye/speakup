import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, UserProfile, LeaderboardReward } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-student-leaderboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

      <!-- REWARDS POTENTIELS BANNER (Visible for students) -->
      @if (currentUser()?.role === 'student') {
        <div class="card" style="background:linear-gradient(135deg, #FFF7ED 0%, #FEF3C7 100%); border:2px solid #FDE68A; margin-bottom:20px; padding:16px; border-radius:12px">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px">
            <span style="font-size:24px">🎁</span>
            <h3 style="margin:0; font-size:15px; font-weight:700; color:#92400E">Récompenses du Mois</h3>
          </div>
          <p style="font-size:12px; color:#B45309; margin:0 0 12px 0">
            Accumulez des points XP pour gagner ces cadeaux exceptionnels !
          </p>

          <!-- Rewards Grid -->
          <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:10px">
            @for (reward of rewards(); track reward.id) {
              <div style="background:#FFF; border:1px solid #FDE68A; border-radius:10px; padding:14px; position:relative; transition:all 0.2s; cursor:default" class="reward-card">
                @if (reward.assignedTo) {
                  <div style="position:absolute; top:-6px; right:-6px; background:#10B981; color:white; font-size:9px; font-weight:700; padding:2px 8px; border-radius:10px">
                    🏆 Gagné
                  </div>
                }
                
                <div style="display:flex; flex-direction:column; gap:4px">
                  <div style="display:flex; justify-content:space-between; align-items:center">
                    <span style="font-size:14px; font-weight:700; color:#1F2937">{{ reward.title }}</span>
                    <span style="font-size:10px; font-weight:700; background:#FEF3C7; color:#D97706; padding:2px 8px; border-radius:8px; white-space:nowrap">{{ reward.xpThreshold }} XP</span>
                  </div>
                  
                  <p style="font-size:11px; color:#6B7280; margin:2px 0">{{ reward.description }}</p>

                  @if (reward.assignedTo) {
                    <div style="font-size:11px; font-weight:600; color:#065F46; margin-top:4px">
                      🎉 Gagné par {{ reward.assignedName }}
                    </div>
                  } @else {
                    <!-- XP Progress Bar -->
                    <div style="margin-top:6px">
                      <div style="display:flex; justify-content:space-between; font-size:9px; color:#6B7280; margin-bottom:2px">
                        <span>Votre progression</span>
                        <span>{{ currentUser()?.xp || 0 }} / {{ reward.xpThreshold }} XP</span>
                      </div>
                      <div style="width:100%; height:8px; background:#F3F4F6; border-radius:4px; overflow:hidden">
                        <div [style.width.%]="getPercent(currentUser()?.xp || 0, reward.xpThreshold)" style="height:100%; background:linear-gradient(90deg, #FBBF24, #F59E0B); border-radius:4px; transition:width 0.3s"></div>
                      </div>
                      @if ((currentUser()?.xp || 0) >= reward.xpThreshold) {
                        <div style="font-size:10px; font-weight:700; color:#059669; margin-top:4px">
                          ✅ Objectif atteint ! Le professeur peut vous attribuer ce prix.
                        </div>
                      } @else {
                        <div style="font-size:9px; color:#9CA3AF; margin-top:2px">
                          Plus que {{ reward.xpThreshold - (currentUser()?.xp || 0) }} XP requis
                        </div>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Rewards Stats -->
          <div style="display:flex; gap:16px; margin-top:14px; flex-wrap:wrap; border-top:1px solid #FDE68A; padding-top:12px">
            <div style="flex:1; min-width:120px; display:flex; align-items:center; gap:8px; background:#FFF; padding:8px 12px; border-radius:8px; border:1px solid #FEF3C7">
              <span style="font-size:20px">💰</span>
              <div>
                <div style="font-size:9px; color:#6B7280; font-weight:600">Votre XP</div>
                <div style="font-size:16px; font-weight:700; color:#8B5CF6">{{ currentUser()?.xp || 0 }} XP</div>
              </div>
            </div>
            <div style="flex:1; min-width:120px; display:flex; align-items:center; gap:8px; background:#FFF; padding:8px 12px; border-radius:8px; border:1px solid #FEF3C7">
              <span style="font-size:20px">🎯</span>
              <div>
                <div style="font-size:9px; color:#6B7280; font-weight:600">Prochain palier</div>
                <div style="font-size:16px; font-weight:700; color:#10B981">{{ nextRewardXp() }} XP</div>
              </div>
            </div>
            <div style="flex:1; min-width:120px; display:flex; align-items:center; gap:8px; background:#FFF; padding:8px 12px; border-radius:8px; border:1px solid #FEF3C7">
              <span style="font-size:20px">🏆</span>
              <div>
                <div style="font-size:9px; color:#6B7280; font-weight:600">Gains potentiels</div>
                <div style="font-size:16px; font-weight:700; color:#D97706">{{ unclaimedRewards() }} récompenses</div>
              </div>
            </div>
          </div>
        </div>
      }

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

      <!-- LEADERBOARD LIST & REWARDS SPLIT GRID -->
      <div style="display:flex; gap:24px; flex-wrap:wrap; margin-top:20px">
        <!-- Left Column: Rankings List -->
        <div style="flex:2; min-width:300px">
          <div class="leaderboard-list" style="animation: fadeIn 0.25s">
            @for (user of getListUsers(); track user.id; let idx = $index) {
              <div class="leaderboard-item" 
                   [class.is-me]="user.id === currentUserId()">
                
                <div class="rank">
                  {{ idx + 4 }}
                </div>
                
                <div style="position:relative">
                  <div class="avatar" style="width:30px; height:30px; font-size:13px; flex-shrink:0">
                    {{ user.avatar }}
                  </div>
                  @if (db.isUserOnline(user)) {
                    <span style="position:absolute; bottom:-2px; right:-2px; width:8px; height:8px; border-radius:50%; background:#10B981; border:2px solid white"></span>
                  }
                </div>

                <div class="lb-name" style="display:flex; align-items:center; gap:6px; flex:1">
                  <span style="font-weight:600">{{ user.id === currentUserId() ? 'You — ' : '' }}{{ user.name }}</span>
                  @if (getFlagUrl(user.countryFlag)) {
                    <img [src]="getFlagUrl(user.countryFlag)" style="width: 14px; height: 10px; object-fit: contain; border-radius: 1px" alt="flag">
                  }
                </div>

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

        <!-- Right Column: Rewards Panel (Teacher only) -->
        @if (currentUser()?.role === 'teacher') {
          <div style="flex:1.2; min-width:290px">
            <div class="card" style="background:#FFFDF5; border:1px solid #FEF3C7; padding:18px; border-radius:12px; box-shadow:0 4px 12px rgba(251, 191, 36, 0.08); margin-top:0">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px">
                <i class="ti ti-gift" style="font-size:24px; color:#D97706"></i>
                <h3 style="margin:0; font-size:15px; font-weight:700; color:#92400E">Monthly Rewards / Cadeaux</h3>
              </div>
              
              <div style="display:flex; flex-direction:column; gap:12px">
                @for (reward of rewards(); track reward.id) {
                  <div style="background:#FFF; border:1px solid #FEF3C7; padding:12px; border-radius:8px">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px">
                      <span style="font-size:13px; font-weight:700; color:#1F2937">{{ reward.title }}</span>
                      <span style="font-size:10px; font-weight:700; background:#FEF3C7; color:#B45309; padding:2px 6px; border-radius:10px">{{ reward.xpThreshold }} XP</span>
                    </div>
                    <p style="font-size:11px; color:#4B5563; margin:0 0 6px 0">{{ reward.description }}</p>

                    @if (reward.assignedTo) {
                      <div style="font-size:11px; font-weight:700; color:#10B981">🏆 Gagné par {{ reward.assignedName }}</div>
                    }

                    <div style="display:flex; align-items:center; gap:6px; margin-top:8px">
                      <select (change)="assignRewardToStudent(reward.id, $event)" style="font-size:11px; padding:4px; background:#FFF; border:1px solid #D1D5DB; border-radius:4px; flex:1">
                        <option value="">-- Attribuer à... --</option>
                        @for (student of allStudents(); track student.id) {
                          <option [value]="student.id" [selected]="reward.assignedTo === student.id">{{ student.name }} ({{ student.xp }} XP)</option>
                        }
                      </select>
                      @if (reward.assignedTo) {
                        <button (click)="unassignReward(reward.id)" style="background:#EF4444; border:none; color:white; font-size:10px; padding:4px 8px; border-radius:4px; cursor:pointer">Retirer</button>
                      }
                    </div>
                  </div>
                }
              </div>

              @if (currentUser()?.role === 'teacher') {
                <div style="margin-top:16px; border-top:1px solid #FEF3C7; padding-top:16px">
                  @if (!showAddRewardForm()) {
                    <button (click)="showAddRewardForm.set(true)" style="background:#4F46E5; color:white; border:none; font-size:11px; font-weight:700; width:100%; padding:8px; border-radius:6px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 9v6"/><path d="M9 12h6"/></svg>
                      <span>Créer une Récompense</span>
                    </button>
                  } @else {
                    <div style="background:#FFF; border:1px solid #E5E7EB; padding:10px; border-radius:8px; display:flex; flex-direction:column; gap:8px">
                      <div style="font-size:11px; font-weight:700; color:#374151">Nouvelle Récompense</div>
                      <input type="text" [(ngModel)]="newRewardTitle" placeholder="Titre (ex: Ticket de Cinéma)" style="font-size:11px; padding:6px; border:1px solid #D1D5DB; border-radius:4px" />
                      <input type="text" [(ngModel)]="newRewardDesc" placeholder="Description (ex: Place Pathé Dakar)" style="font-size:11px; padding:6px; border:1px solid #D1D5DB; border-radius:4px" />
                      <input type="number" [(ngModel)]="newRewardXp" placeholder="Seuil XP (ex: 300)" style="font-size:11px; padding:6px; border:1px solid #D1D5DB; border-radius:4px" />
                      <div style="display:flex; gap:6px">
                        <button (click)="createNewReward()" style="background:#10B981; color:white; border:none; font-size:10px; font-weight:700; padding:6px; border-radius:4px; cursor:pointer; flex:1">Créer</button>
                        <button (click)="showAddRewardForm.set(false)" style="background:#EF4444; color:white; border:none; font-size:10px; font-weight:700; padding:6px; border-radius:4px; cursor:pointer; flex:1">Annuler</button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .reward-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(251, 191, 36, 0.15);
    }

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

    .avatar-emoji { font-size: 20px; }
    .avatar-ring.gold .avatar-emoji { font-size: 24px; }

    .podium-flag {
      position: absolute; bottom: -2px; right: -2px;
      width: 16px; height: 12px; object-fit: contain;
      border: 1.5px solid #FFF; border-radius: 2px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .crown-icon {
      position: absolute; top: -18px; left: 50%;
      transform: translateX(-50%);
      animation: bounce-crown 1.5s infinite ease-in-out;
    }

    @keyframes bounce-crown {
      0%, 100% { transform: translate(-50%, 0); }
      50% { transform: translate(-50%, -4px); }
    }

    .podium-pedestal {
      width: 100%; border-radius: 8px 8px 4px 4px;
      display: flex; flex-direction: column; align-items: center;
      padding: 12px 6px; text-align: center;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
    }

    .podium-pedestal.gold {
      height: 100px;
      background: linear-gradient(180deg, #FEF3C7 0%, #FFFBEB 100%);
      border: 1px solid #FDE68A; color: #92400E;
    }

    .podium-pedestal.silver {
      height: 80px;
      background: linear-gradient(180deg, #F3F4F6 0%, #F9FAFB 100%);
      border: 1px solid #E5E7EB; color: #4B5563;
    }

    .podium-pedestal.bronze {
      height: 65px;
      background: linear-gradient(180deg, #FFEDD5 0%, #FFF7ED 100%);
      border: 1px solid #FED7AA; color: #9A3412;
    }

    .podium-rank-num { font-size: 20px; font-weight: 800; opacity: 0.8; }
    .podium-name { font-size: 11px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
    .podium-score { font-size: 9px; font-weight: 600; opacity: 0.7; }

    .leaderboard-list {
      display: flex; flex-direction: column; gap: 6px;
    }

    .leaderboard-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 14px;
      background: var(--surface-2);
      border: 1px solid var(--border-weak);
      border-radius: 8px;
      transition: all 0.15s;
    }

    .leaderboard-item.is-me {
      background: #EEF2FF; border-color: #C7D2FE;
    }

    .rank {
      width: 24px; font-size: 14px; font-weight: 700;
      color: var(--text-muted); text-align: center;
    }

    .lb-xp { font-size: 12px; }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class StudentLeaderboardComponent {
  db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  selectedTab = signal<'week' | 'all'>('all');
  showAddRewardForm = signal<boolean>(false);
  newRewardTitle = '';
  newRewardDesc = '';
  newRewardXp = 0;

  currentUser = signal<UserProfile | null>(null);
  allUsers = signal<UserProfile[]>([]);
  rewards = signal<LeaderboardReward[]>([]);

  constructor() {
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
    this.db.observeUsers().subscribe(list => this.allUsers.set(list));
    this.db.observeRewards().subscribe(list => this.rewards.set(list));
  }

  currentUserId() {
    return this.currentUser()?.id || '';
  }

  allStudents() {
    return this.allUsers().filter(u => u.role === 'student');
  }

  nextRewardXp = computed(() => {
    const userXp = this.currentUser()?.xp || 0;
    const available = this.rewards().filter(r => !r.assignedTo);
    const next = available.reduce((min, r) => Math.min(min, r.xpThreshold), Infinity);
    return next === Infinity ? 0 : next;
  });

  unclaimedRewards = computed(() => {
    return this.rewards().filter(r => !r.assignedTo).length;
  });

  getTop3() {
    const users = this.allUsers().filter(u => u.role === 'student');
    const sorted = [...users].sort((a, b) => b.xp - a.xp);
    return sorted.slice(0, 3);
  }

  getListUsers() {
    const users = this.allUsers().filter(u => u.role === 'student');
    const sorted = [...users].sort((a, b) => b.xp - a.xp);
    return sorted.slice(3);
  }

  getXPDisplay(user: UserProfile): number {
    return user.xp || 0;
  }

  getPercent(current: number, threshold: number): number {
    if (threshold <= 0) return 0;
    return Math.min(100, Math.round((current / threshold) * 100));
  }

  getFlagUrl(flag: string | undefined): string {
    if (!flag) return '';
    const clean = flag.trim().toUpperCase();
    if (clean.length !== 2) return '';
    return `https://flagcdn.com/w20/${clean.toLowerCase()}.png`;
  }

  assignRewardToStudent(rewardId: string, event: any) {
    const studentId = event.target.value;
    if (studentId) {
      const student = this.allStudents().find(s => s.id === studentId);
      this.db.assignReward(rewardId, studentId, student?.name || 'Unknown');
      this.dialogService.alert('Récompense attribuée', `${student?.name} a reçu la récompense !`, 'success');
    }
  }

  unassignReward(rewardId: string) {
    this.db.assignReward(rewardId, null, null);
    this.dialogService.show({
      title: 'Récompense retirée',
      message: 'La récompense est à nouveau disponible.',
      type: 'info',
      confirmText: 'OK'
    });
  }

  createNewReward() {
    if (!this.newRewardTitle || !this.newRewardDesc || !this.newRewardXp) {
      this.dialogService.alert('Erreur', 'Veuillez remplir tous les champs.', 'info');
      return;
    }
    this.db.addReward({
      title: this.newRewardTitle,
      description: this.newRewardDesc,
      xpThreshold: this.newRewardXp
    });
    this.newRewardTitle = '';
    this.newRewardDesc = '';
    this.newRewardXp = 0;
    this.showAddRewardForm.set(false);
    this.dialogService.alert('Créée', 'Récompense ajoutée avec succès !', 'success');
  }
}