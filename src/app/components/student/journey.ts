import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, UserProfile, JourneyMission } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-student-journey',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" style="animation: fadeIn 0.28s ease">
      
      <!-- HERO BANNER -->
      <div class="card" style="margin-top:0; background:linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color:white; border:none; padding:20px 24px; border-radius:12px; box-shadow:0 10px 30px rgba(79,70,229,0.2)">
        <span style="font-size:10px; background:rgba(255,255,255,0.2); color:white; font-weight:800; padding:2px 8px; border-radius:20px; text-transform:uppercase">SpeakUp Journey</span>
        <h2 style="font-size:18px; font-weight:800; margin:4px 0 0 0; color:#FFF">Missions & Aventures</h2>
        <p style="font-size:12.5px; color:#E0E7FF; margin:2px 0 0 0">Accomplissez des séries de tâches concrètes pour progresser pas à pas et débloquer les chapitres suivants !</p>
      </div>

      <!-- ACTIVE MISSION CARD -->
      @if (activeMission(); as mission) {
        <div class="card" style="margin-top:20px; border:2px solid #8B5CF6; border-radius:12px; padding:20px">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap">
            <div>
              <span class="badge" style="background:#8B5CF6; color:white; font-size:10px; font-weight:700; border-radius:4px; padding:2px 6px">MISSION EN COURS</span>
              <h3 style="font-size:16px; font-weight:800; color:var(--text-primary); margin:6px 0 4px 0">{{ mission.title }}</h3>
              <p style="font-size:12.5px; color:var(--text-secondary); line-height:1.4; margin:0 0 16px 0">{{ mission.description }}</p>
            </div>

            <!-- Global Mission Progress circle -->
            <div style="text-align:center">
              <div style="font-size:24px; font-weight:800; color:#8B5CF6">{{ getMissionProgress(mission) }}%</div>
              <div style="font-size:10px; color:var(--text-muted); font-weight:600">Progression</div>
            </div>
          </div>

          <!-- Tasks Checklist -->
          <div style="display:flex; flex-direction:column; gap:12px; border-top:1px solid var(--border-weak); padding-top:16px">
            @for (task of mission.requiredTasks; track task.title) {
              <div style="display:flex; justify-content:space-between; align-items:center; gap:20px; padding:10px 14px; border-radius:8px; background:var(--surface-2); border:1.5px solid"
                   [style.border-color]="task.current >= task.target ? '#10B981' : 'var(--border)'">
                
                <div style="display:flex; align-items:center; gap:10px">
                  <span style="font-size:16px">{{ task.current >= task.target ? '✅' : '⏳' }}</span>
                  <div>
                    <div style="font-size:12.5px; font-weight:700; color:var(--text-primary)">{{ task.title }}</div>
                    <div style="font-size:11px; color:var(--text-muted)">Type de tâche : {{ task.type | uppercase }}</div>
                  </div>
                </div>

                <div style="display:flex; align-items:center; gap:12px">
                  <span style="font-size:12.5px; font-weight:700; color:var(--text-secondary)">
                    {{ task.current }} / {{ task.target }}
                  </span>
                  @if (task.current < task.target) {
                    <button class="btn-s" style="font-size:10.5px; padding:4px 10px; height:auto" (click)="simulateProgress(task.type)">
                      Pratiquer +1 🚀
                    </button>
                  }
                </div>

              </div>
            }
          </div>

          <!-- Completed Rewards claim -->
          @if (isMissionComplete(mission)) {
            <div style="margin-top:20px; background:#EFF6FF; border:1px solid #BFDBFE; padding:12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px">
              <div>
                <strong style="color:#2563EB; font-size:13px">Félicitations ! Mission Terminée 🎓</strong>
                <p style="font-size:11px; color:#1E40AF; margin:2px 0 0 0">Récompense bonus : <strong>+100 XP</strong> et <strong>+200 Coins 🪙</strong> !</p>
              </div>
              <button class="btn-p" style="background:#10B981; border-color:#10B981" (click)="claimMissionRewards(mission.id)">
                Réclamer les Récompenses 🎉
              </button>
            </div>
          }
        </div>
      } @else {
        <div class="card" style="margin-top:20px; padding:24px; text-align:center">
          <span style="font-size:48px">🏆</span>
          <h3 style="font-size:16px; font-weight:800; margin:12px 0 6px 0">Toutes les missions terminées !</h3>
          <p style="font-size:12.5px; color:var(--text-secondary)">Vous êtes un véritable champion de la langue anglaise ! Revenez plus tard pour de nouveaux chapitres.</p>
        </div>
      }

      <!-- LOCKED / UPCOMING MISSIONS LIST -->
      <div style="margin-top:20px">
        <h3 class="section-title">Chapitres & Missions de l'Aventure</h3>
        
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:16px; margin-top:12px">
          @for (mission of missions(); track mission.id) {
            <div class="card" style="margin:0; border: 1.5px solid var(--border-weak); opacity: mission.unlocked ? 1 : 0.6; display:flex; flex-direction:column; justify-content:space-between">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                  <span class="badge" 
                        [style.background]="mission.completed ? '#D1FAE5' : (mission.unlocked ? '#F3E8FF' : '#E2E8F0')"
                        [style.color]="mission.completed ? '#065F46' : (mission.unlocked ? '#7C3AED' : '#64748B')"
                        style="font-size:9px; font-weight:700; border-radius:4px; padding:2px 6px">
                    {{ mission.completed ? 'COMPLÉTÉ' : (mission.unlocked ? 'ACTIF' : 'VERROUILLÉ 🔒') }}
                  </span>
                </div>
                <h4 style="font-size:14px; font-weight:800; color:var(--text-primary); margin:0 0 6px 0">{{ mission.title }}</h4>
                <p style="font-size:12px; color:var(--text-secondary); line-height:1.4; margin:0">{{ mission.description }}</p>
              </div>
            </div>
          }
        </div>
      </div>

    </div>
  `,
  styles: []
})
export class StudentJourneyComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  currentUser = signal<UserProfile | null>(null);
  missions = signal<JourneyMission[]>([]);

  activeMission = computed(() => {
    return this.missions().find(m => m.unlocked && !m.completed) || null;
  });

  constructor() {
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
    this.db.observeJourneyMissions().subscribe(list => this.missions.set(list));
  }

  getMissionProgress(m: JourneyMission): number {
    const total = m.requiredTasks.length;
    if (total === 0) return 0;
    const progressSum = m.requiredTasks.reduce((acc, t) => acc + (t.current / t.target), 0);
    return Math.round((progressSum / total) * 100);
  }

  isMissionComplete(m: JourneyMission): boolean {
    return m.requiredTasks.every(t => t.current >= t.target);
  }

  claimMissionRewards(missionId: string) {
    const user = this.currentUser();
    if (user) {
      // Simulate completing mission tasks in database
      const list = [...this.db['journeyMissions$'].value];
      const mission = list.find(m => m.id === missionId);
      if (mission) {
        mission.completed = true;
        // Unlock next
        const nextIdx = list.findIndex(m => m.id === missionId) + 1;
        if (nextIdx < list.length) {
          list[nextIdx].unlocked = true;
        }
        
        this.db['journeyMissions$'].next(list);
        this.db['saveLocal']('speak_missions', list);

        // Award bonus XP and coins
        this.db.updateUserXP(user.id, 100, true).then(() => {
          this.db.addCoinsToUser(user.id, 200).then(() => {
            this.dialogService.alert('Mission Réclamée ! 🏆', 'Félicitations, vous avez débloqué 100 XP et 200 Coins !', 'success');
          });
        });
      }
    }
  }

  simulateProgress(taskType: string) {
    const user = this.currentUser();
    if (user) {
      this.db.updateJourneyTaskProgress(user.id, taskType, 1).then(() => {
        this.dialogService.alert('Activité Validée ! 🚀', `Vous avez progressé de +1 dans votre tâche : ${taskType.toUpperCase()}`, 'success');
      });
    }
  }
}
