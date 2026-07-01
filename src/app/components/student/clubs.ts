import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, LearningClub, UserProfile, ClubPost } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-student-clubs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="animation: fadeIn 0.28s ease">
      
      <!-- IF STUDENT IS NOT IN ANY CLUB -->
      @if (!currentClub()) {
        <div class="card" style="margin-top:0; padding:24px; text-align:center">
          <span style="font-size:48px">🤝</span>
          <h2 style="font-size:18px; font-weight:800; color:var(--text-primary); margin:12px 0 6px 0">Rejoignez un Club d'Apprentissage !</h2>
          <p style="font-size:13px; color:var(--text-secondary); max-width:460px; margin:0 auto 20px auto; line-height:1.5">
            L'apprentissage est plus stimulant à plusieurs. Rejoignez un groupe thématique, collaborez pour relever des défis collectifs et grimpez dans les classements !
          </p>

          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:16px; text-align:left">
            @for (club of availableClubs(); track club.id) {
              <div class="card" style="margin:0; border: 1.5px solid var(--border-weak); display:flex; flex-direction:column; justify-content:space-between; transition: transform 0.2s">
                <div>
                  <h4 style="font-size:15px; font-weight:800; color:#4F46E5; margin:0 0 6px 0">{{ club.name }}</h4>
                  <p style="font-size:12px; color:var(--text-secondary); line-height:1.4; margin:0 0 12px 0">{{ club.description }}</p>
                  <span style="font-size:11px; background:#EEF2FF; color:#4F46E5; padding:2px 8px; border-radius:20px; font-weight:700">
                    👥 {{ club.members.length }} membres
                  </span>
                </div>
                <button class="btn-p" style="margin-top:16px; width:100%; height:36px; font-size:12.5px" (click)="joinClub(club.id)">
                  Rejoindre le Club
                </button>
              </div>
            }
          </div>
        </div>
      } @else {
        
        <!-- CLUB INTERFACE -->
        @if (currentClub(); as club) {
          
          <!-- Club Header -->
          <div class="card" style="margin-top:0; background:linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 100%); border:1px solid #C7D2FE; padding:20px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; gap:20px; flex-wrap:wrap">
            <div>
              <span style="font-size:10px; background:#4F46E5; color:white; font-weight:700; padding:2px 8px; border-radius:20px; text-transform:uppercase">My Club</span>
              <h2 style="font-size:18px; font-weight:800; color:#1E1B4B; margin:6px 0 4px 0">{{ club.name }}</h2>
              <p style="font-size:12.5px; color:#4B5563; margin:0">{{ club.description }}</p>
            </div>
            <button class="btn-s" style="border-color:#EF4444; color:#EF4444" (click)="leaveClub()">
              Quitter le Club ✖
            </button>
          </div>

          <!-- Collective Challenge & Stats -->
          <div class="card" style="border:1.5px solid #10B981; background:#ECFDF5; padding:18px; border-radius:12px; margin-top:20px">
            <h4 style="font-size:11px; font-weight:700; color:#047857; text-transform:uppercase; margin:0 0 6px 0; display:flex; align-items:center; gap:6px">
              <span>🏆 Défi Collectif Actif</span>
            </h4>
            <h3 style="font-size:15px; font-weight:800; color:#065F46; margin:0 0 8px 0">{{ club.collectiveChallenge.title }}</h3>
            
            <!-- Progress bar -->
            <div style="display:flex; justify-content:space-between; font-size:11.5px; color:#047857; font-weight:700; margin-bottom:4px">
              <span>XP collecté par le club</span>
              <span>{{ club.collectiveChallenge.currentXP }} / {{ club.collectiveChallenge.targetXP }} XP</span>
            </div>
            <div style="width:100%; height:8px; background:rgba(255,255,255,0.7); border-radius:4px; overflow:hidden; border:1px solid #A7F3D0">
              <div [style.width.%]="(club.collectiveChallenge.currentXP / club.collectiveChallenge.targetXP) * 100" 
                   style="height:100%; background:#10B981; border-radius:4px; transition:width 0.3s"></div>
            </div>
            <p style="font-size:11px; color:#047857; font-style:italic; margin:6px 0 0 0">
              Récompense de réussite : <strong>+{{ club.collectiveChallenge.reward }} Coins 🪙</strong> pour chaque membre !
            </p>
          </div>

          <!-- Left / Right split: discussions vs rankings -->
          <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:20px; margin-top:20px; align-items:start" class="club-layout">
            
            <!-- Left: Discussions board -->
            <div style="display:flex; flex-direction:column; gap:16px">
              <div class="card" style="margin:0">
                <h3 class="section-title" style="margin-bottom:12px">📢 Club Discussion Board</h3>
                
                <!-- Create post box -->
                <div style="display:flex; gap:12px; align-items:flex-start; margin-bottom:18px">
                  <div style="width:32px; height:32px; border-radius:50%; background:#4F46E5; color:white; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700">
                    {{ currentUser()?.avatar }}
                  </div>
                  <div style="flex:1">
                    <textarea 
                      [(ngModel)]="newPostContent" 
                      placeholder="Partagez une astuce, une question ou saluez le club..." 
                      class="form-input" 
                      style="width:100%; height:75px; font-size:12.5px; border-radius:8px; padding:10px; resize:none"></textarea>
                    <div style="display:flex; justify-content:flex-end; margin-top:8px">
                      <button class="btn-p" style="height:32px; font-size:11.5px; padding:0 16px" [disabled]="!newPostContent.trim()" (click)="submitPost()">
                        Publier 🚀
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Posts List -->
                <div style="display:flex; flex-direction:column; gap:12px">
                  @for (post of club.discussions; track post.id) {
                    <div style="padding:14px; border:1px solid var(--border-weak); border-radius:10px; background:var(--surface-2)">
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                        <div style="display:flex; align-items:center; gap:8px">
                          <div style="width:28px; height:28px; border-radius:50%; background:#6366F1; color:white; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700">
                            {{ post.authorAvatar }}
                          </div>
                          <div>
                            <div style="font-size:12px; font-weight:700; color:var(--text-primary)">{{ post.authorName }}</div>
                            <div style="font-size:10px; color:var(--text-muted)">{{ post.createdAt | date:'short' }}</div>
                          </div>
                        </div>
                      </div>

                      <p style="font-size:12.5px; color:var(--text-secondary); line-height:1.5; margin:0 0 10px 0; white-space:pre-wrap">{{ post.content }}</p>
                      
                      <div style="display:flex; align-items:center; gap:16px; border-top:1px solid var(--border-weak); padding-top:8px">
                        <button 
                          (click)="likePost(post.id)"
                          style="background:none; border:none; color:#EF4444; font-size:11px; font-weight:700; display:flex; align-items:center; gap:4px; cursor:pointer">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" [attr.fill]="post.likes.includes(currentUser()?.id || '') ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                          </svg>
                          <span>{{ post.likes.length }} Likes</span>
                        </button>
                      </div>
                    </div>
                  } @empty {
                    <div style="text-align:center; padding:20px; font-size:12px; color:var(--text-muted)">
                      Aucune publication pour le moment. Lancez la discussion !
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Right: Rankings & Members -->
            <div style="display:flex; flex-direction:column; gap:20px">
              
              <!-- Weekly Rankings -->
              <div class="card" style="margin:0">
                <h3 class="section-title" style="margin-bottom:12px">⚡ Weekly Rank</h3>
                <p style="font-size:11px; color:var(--text-secondary); margin:0 0 12px 0">XP gagné par les membres du club cette semaine.</p>
                
                <div style="display:flex; flex-direction:column; gap:8px">
                  @for (member of getClubRankings(); track member.id; let idx = $index) {
                    <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 10px; border-radius:6px; background:var(--surface-1); border:1px solid var(--border-weak)">
                      <div style="display:flex; align-items:center; gap:8px; min-width:0">
                        <span style="font-size:11px; font-weight:800; color:var(--text-muted); width:16px">{{ idx + 1 }}.</span>
                        <div style="width:24px; height:24px; border-radius:50%; background:#4F46E5; color:white; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700">
                          {{ member.avatar }}
                        </div>
                        <span style="font-size:12.5px; font-weight:600; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap">{{ member.name }}</span>
                      </div>
                      <strong style="font-size:12px; color:#10B981">+{{ member.weeklyXP }} XP</strong>
                    </div>
                  }
                </div>
              </div>

            </div>

          </div>
        }
      }

    </div>
  `,
  styles: [`
    @media (max-width: 768px) {
      .club-layout {
        grid-template-columns: 1fr !important;
      }
    }
  `]
})
export class StudentClubsComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  currentUser = signal<UserProfile | null>(null);
  clubs = signal<LearningClub[]>([]);
  newPostContent = '';

  availableClubs = computed(() => {
    return this.clubs();
  });

  currentClub = computed(() => {
    const user = this.currentUser();
    if (!user || !user.clubId) return null;
    return this.clubs().find(c => c.id === user.clubId) || null;
  });

  constructor() {
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
    this.db.observeClubs().subscribe(list => this.clubs.set(list));
  }

  joinClub(clubId: string) {
    const user = this.currentUser();
    if (user) {
      this.db.joinClub(clubId, user.id).then(() => {
        this.dialogService.alert('Club Joint 🎉', 'Vous avez rejoint le club d\'apprentissage avec succès.', 'success');
      });
    }
  }

  leaveClub() {
    const user = this.currentUser();
    if (user) {
      this.db.joinClub('', user.id).then(() => {
        this.dialogService.alert('Club Quitté', 'Vous avez quitté le club d\'apprentissage.', 'info');
      });
    }
  }

  submitPost() {
    const club = this.currentClub();
    const user = this.currentUser();
    if (club && user && this.newPostContent.trim()) {
      this.db.addClubPost(club.id, user.id, this.newPostContent.trim()).then(() => {
        this.newPostContent = '';
      });
    }
  }

  likePost(postId: string) {
    const club = this.currentClub();
    const user = this.currentUser();
    if (club && user) {
      this.db.likeClubPost(club.id, postId, user.id);
    }
  }

  getClubRankings(): any[] {
    const club = this.currentClub();
    if (!club) return [];
    
    // Get users in database to match members details
    const users = this.db['users$'].value;
    return club.members.map(mId => {
      const u = users.find(usr => usr.id === mId);
      return {
        id: mId,
        name: u?.name || 'Student',
        avatar: u?.avatar || 'ST',
        weeklyXP: club.weeklyXP[mId] || 0
      };
    }).sort((a, b) => b.weeklyXP - a.weeklyXP);
  }
}
