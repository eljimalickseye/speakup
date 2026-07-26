import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, UserProfile, JourneyMission } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-student-journey',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" style="animation: fadeIn 0.28s ease; padding: 20px">
      
      <!-- HERO BANNER -->
      <div class="card" style="margin-top:0; background:linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color:white; border:none; padding:24px; border-radius:16px; box-shadow:0 10px 30px rgba(79,70,229,0.2); display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px">
        <div>
          <span style="font-size:10px; background:rgba(255,255,255,0.2); color:white; font-weight:900; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px">
            SPEAKUP JOURNEY
          </span>
          <h2 style="font-size:22px; font-weight:900; margin:8px 0 4px 0; color:#FFF; display:flex; align-items:center; gap:8px">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            {{ t('Missions & Aventures', 'Missions & Adventures') }}
          </h2>
          <p style="font-size:13px; color:#E0E7FF; margin:0; max-width:600px; line-height:1.5">
            {{ t('Accomplissez des séries de tâches concrètes pour progresser pas à pas et débloquer les chapitres suivants !', 'Complete practical task series step-by-step to unlock upcoming chapters and earn rewards!') }}
          </p>
        </div>
      </div>

      <!-- ACTIVE MISSION CARD -->
      @if (activeMission(); as mission) {
        <div class="card" style="margin-top:24px; border:2px solid #8B5CF6; border-radius:16px; padding:24px; box-shadow:0 8px 24px rgba(139,92,246,0.08)">
          
          <!-- Mission Header -->
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px; flex-wrap:wrap; margin-bottom:20px">
            <div>
              <span class="badge" style="background:#8B5CF6; color:white; font-size:10px; font-weight:800; border-radius:6px; padding:4px 10px; text-transform:uppercase; letter-spacing:0.5px; display:inline-flex; align-items:center; gap:4px">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {{ t('MISSION EN COURS', 'ACTIVE MISSION') }}
              </span>
              <h3 style="font-size:18px; font-weight:900; color:var(--text-primary); margin:8px 0 4px 0">{{ getMissionTitle(mission) }}</h3>
              <p style="font-size:13px; color:var(--text-secondary); line-height:1.5; margin:0">{{ getMissionDescription(mission) }}</p>
            </div>

            <!-- Global Mission Progress Stats -->
            <div style="background:var(--surface-2); border:1px solid var(--border-weak); padding:12px 20px; border-radius:12px; text-align:center">
              <div style="font-size:26px; font-weight:900; color:#8B5CF6">{{ getMissionProgress(mission) }}%</div>
              <div style="font-size:11px; color:var(--text-muted); font-weight:700; text-transform:uppercase">{{ t('Progression', 'Progress') }}</div>
            </div>
          </div>

          <!-- Tasks Checklist -->
          <div style="display:flex; flex-direction:column; gap:12px; border-top:1px solid var(--border-weak); padding-top:20px">
            @for (task of mission.requiredTasks; track task.title) {
              <div style="display:flex; justify-content:space-between; align-items:center; gap:20px; padding:12px 16px; border-radius:12px; background:var(--surface-2); border:1.5px solid"
                   [style.borderColor]="task.current >= task.target ? '#10B981' : 'var(--border)'">
                
                <div style="display:flex; align-items:center; gap:12px">
                  <!-- Task Status SVG Icon -->
                  @if (task.current >= task.target) {
                    <div style="width:28px; height:28px; background:#D1FAE5; color:#059669; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                  } @else {
                    <div style="width:28px; height:28px; background:#FEF3C7; color:#D97706; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    </div>
                  }

                  <div>
                    <div style="font-size:13px; font-weight:800; color:var(--text-primary)">{{ getTaskTitle(task) }}</div>
                    <div style="font-size:11px; color:var(--text-muted); margin-top:2px">
                      {{ t('Type de tâche :', 'Task type:') }} <span style="font-weight:800; color:#6B7280">{{ task.type | uppercase }}</span>
                    </div>
                  </div>
                </div>

                <div style="display:flex; align-items:center; gap:14px">
                  <span style="font-size:13px; font-weight:800; color:var(--text-secondary)">
                    {{ task.current }} / {{ task.target }}
                  </span>

                  @if (task.current < task.target) {
                    <div style="display:flex; flex-direction:column; align-items:flex-end; gap:4px">
                      <button class="btn-p" style="font-size:11px; padding:6px 14px; height:auto; background:#8B5CF6; border-color:#8B5CF6; color:white; font-weight:800; border-radius:8px; display:flex; align-items:center; gap:4px; cursor:pointer" (click)="startActivity(task.type)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>
                        {{ t('Pratiquer', 'Practice') }}
                      </button>
                      <button (click)="simulateProgress(task.type)" style="background:none; border:none; color:var(--text-muted); font-size:9.5px; font-weight:700; text-decoration:underline; cursor:pointer">
                        {{ t('Simuler +1', 'Simulate +1') }}
                      </button>
                    </div>
                  }
                </div>

              </div>
            }
          </div>

          <!-- Completed Rewards Claim -->
          @if (isMissionComplete(mission)) {
            <div style="margin-top:24px; background:#EFF6FF; border:1.5px solid #93C5FD; padding:16px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px">
              <div style="display:flex; align-items:center; gap:12px">
                <div style="width:40px; height:40px; background:#3B82F6; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
                </div>
                <div>
                  <strong style="color:#1E40AF; font-size:14px; font-weight:900">{{ t('Félicitations ! Mission Terminée', 'Congratulations! Mission Completed') }}</strong>
                  <p style="font-size:12px; color:#1E3A8A; margin:2px 0 0 0">
                    {{ t('Récompense bonus : +100 XP et +200 Pieces 🪙 !', 'Bonus reward: +100 XP and +200 Coins 🪙!') }}
                  </p>
                </div>
              </div>
              <button class="btn-p" style="background:#10B981; border-color:#10B981; font-weight:900; padding:10px 20px; cursor:pointer" (click)="claimMissionRewards(mission.id)">
                {{ t('Réclamer les Récompenses', 'Claim Rewards') }}
              </button>
            </div>
          }
        </div>
      } @else {
        <div class="card" style="margin-top:24px; padding:32px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center">
          <div style="width:64px; height:64px; background:#FEF3C7; color:#D97706; border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:16px">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
          </div>
          <h3 style="font-size:18px; font-weight:900; color:var(--text-primary); margin:0 0 6px 0">{{ t('Toutes les missions terminées !', 'All missions completed!') }}</h3>
          <p style="font-size:13px; color:var(--text-secondary); max-width:450px; line-height:1.5; margin:0">
            {{ t('Vous êtes un véritable champion de la langue anglaise ! Revenez plus tard pour de nouveaux chapitres.', 'You are a true English champion! Come back later for new chapters.') }}
          </p>
        </div>
      }

      <!-- LOCKED / UPCOMING MISSIONS LIST -->
      <div style="margin-top:28px">
        <h3 style="font-size:15px; font-weight:900; color:var(--text-primary); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:16px">
          {{ t("Chapitres & Missions de l'Aventure", "Adventure Chapters & Missions") }}
        </h3>
        
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:16px">
          @for (mission of missions(); track mission.id) {
            <div class="card" style="margin:0; border: 1.5px solid var(--border-weak); opacity: mission.unlocked ? 1 : 0.65; display:flex; flex-direction:column; justify-content:space-between">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
                  <span class="badge" 
                        [style.background]="mission.completed ? '#D1FAE5' : (mission.unlocked ? '#F3E8FF' : '#E2E8F0')"
                        [style.color]="mission.completed ? '#065F46' : (mission.unlocked ? '#7C3AED' : '#64748B')"
                        style="font-size:10px; font-weight:800; border-radius:6px; padding:3px 8px; display:inline-flex; align-items:center; gap:4px">
                    @if (mission.completed) {
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                      {{ t('COMPLÉTÉ', 'COMPLETED') }}
                    } @else if (mission.unlocked) {
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      {{ t('ACTIF', 'ACTIVE') }}
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      {{ t('VERROUILLÉ', 'LOCKED') }}
                    }
                  </span>
                </div>
                <h4 style="font-size:15px; font-weight:900; color:var(--text-primary); margin:0 0 6px 0">{{ getMissionTitle(mission) }}</h4>
                <p style="font-size:12.5px; color:var(--text-secondary); line-height:1.5; margin:0">{{ getMissionDescription(mission) }}</p>
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

  activeLang = computed(() => this.db.activeLang());

  activeMission = computed(() => {
    return this.missions().find(m => m.unlocked && !m.completed) || null;
  });

  constructor() {
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
    this.db.observeJourneyMissions().subscribe(list => this.missions.set(list));
  }

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

  getMissionTitle(m: JourneyMission): string {
    if (m.id === 'mission-london') {
      return this.t('Mission 1 : Préparer un voyage à Londres', 'Mission 1: Preparing a trip to London');
    }
    if (m.id === 'mission-interview') {
      return this.t('Mission 2 : Décrocher un job à New York', 'Mission 2: Landing a job in New York');
    }
    return m.title;
  }

  getMissionDescription(m: JourneyMission): string {
    if (m.id === 'mission-london') {
      return this.t(
        'Validez toutes les étapes pour être prêt pour votre premier vol vers le Royaume-Uni !',
        'Complete all the steps to be ready for your first flight to the United Kingdom!'
      );
    }
    if (m.id === 'mission-interview') {
      return this.t(
        'Maîtrisez l\'anglais des affaires pour réussir votre entretien d\'embauche outre-Atlantique.',
        'Master business English to ace your job interview across the Atlantic.'
      );
    }
    return m.description;
  }

  getTaskTitle(task: any): string {
    const titleMap: { [key: string]: { fr: string, en: string } } = {
      'words-30': { fr: 'Apprendre 30 mots de voyage dans le dictionnaire', en: 'Learn 30 travel words in the dictionary' },
      'video-1': { fr: 'Regarder la vidéo pédagogique sur l\'aéroport', en: 'Watch the educational airport video' },
      'quiz-1': { fr: 'Réussir le quiz de grammaire de voyage', en: 'Pass the travel grammar quiz' },
      'listening-1': { fr: 'Écouter le dialogue de commande de ticket', en: 'Listen to the ticket order dialogue' },
      'writing-1': { fr: 'Écrire un court mail de réservation d\'hôtel', en: 'Write a short hotel booking email' },
      'words-20': { fr: 'Apprendre 20 mots de Business English', en: 'Learn 20 Business English words' },
      'quiz-interview': { fr: 'Réussir le quiz d\'entretien de recrutement', en: 'Pass the job interview quiz' },
      'writing-cover': { fr: 'Rédiger une lettre de motivation professionnelle', en: 'Write a professional cover letter' }
    };

    for (const key in titleMap) {
      if (task.title.toLowerCase().includes(titleMap[key].fr.toLowerCase().slice(0, 15)) ||
          task.title.toLowerCase().includes(titleMap[key].en.toLowerCase().slice(0, 15))) {
        return this.t(titleMap[key].fr, titleMap[key].en);
      }
    }
    return task.title;
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
      const list = [...this.db['journeyMissions$'].value];
      const mission = list.find(m => m.id === missionId);
      if (mission) {
        mission.completed = true;
        const nextIdx = list.findIndex(m => m.id === missionId) + 1;
        if (nextIdx < list.length) {
          list[nextIdx].unlocked = true;
        }
        
        this.db['journeyMissions$'].next(list);
        this.db['saveLocal']('speak_missions', list);

        this.db.updateUserXP(user.id, 100, true).then(() => {
          this.db.addCoinsToUser(user.id, 200).then(() => {
            this.dialogService.alert(
              this.t('Mission Réclamée ! 🏆', 'Mission Claimed! 🏆'),
              this.t('Félicitations, vous avez débloqué 100 XP et 200 Coins !', 'Congratulations, you unlocked 100 XP and 200 Coins!'),
              'success'
            );
          });
        });
      }
    }
  }

  startActivity(taskType: string) {
    let targetTab = 'dashboard';
    if (taskType === 'words') {
      targetTab = 'dictionary';
    } else if (taskType === 'quiz') {
      targetTab = 'quizzes';
    } else if (taskType === 'video' || taskType === 'listening') {
      targetTab = 'lessons';
    } else if (taskType === 'writing') {
      targetTab = 'exercises';
    }

    this.db.requestedTabRedirect.set(targetTab);
  }

  simulateProgress(taskType: string) {
    const user = this.currentUser();
    if (user) {
      this.db.updateJourneyTaskProgress(user.id, taskType, 1).then(() => {
        this.dialogService.alert(
          this.t('Activité Validée ! 🚀', 'Activity Validated! 🚀'),
          this.t(`Vous avez progressé de +1 dans votre tâche : ${taskType.toUpperCase()}`, `You progressed +1 in task: ${taskType.toUpperCase()}`),
          'success'
        );
      });
    }
  }
}

