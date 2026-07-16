import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, SystemLog, UserProfile, ChatChannel } from '../../services/database.service';

@Component({
  selector: 'app-history-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card" style="margin-top: 10px; animation: fadeIn 0.2s">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px">
        <div>
          <h3 class="st" style="font-size:16px; margin:0; color:#1E3A8A">📊 Historique des Actions</h3>
          <p style="font-size:12px; color:var(--text-secondary); margin:4px 0 0 0">Consultez et filtrez les activités des enseignants et des élèves.</p>
        </div>
        <button class="btn-s" (click)="clearFilters()" style="font-size:11px; padding:6px 12px">
          🧹 Réinitialiser les filtres
        </button>
      </div>

      <!-- FILTERS PANEL -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:20px; background:var(--surface-2); padding:16px; border-radius:10px; border:1px solid var(--border-weak)">
        <!-- Filter by User -->
        <div class="input-row" style="margin:0">
          <label style="font-size:11px; font-weight:700; color:var(--text-secondary); margin-bottom:4px; display:block">Utilisateur</label>
          <select [ngModel]="filterUser()" (ngModelChange)="filterUser.set($event)" style="height:36px; font-size:12px; background:#FFF; border:1px solid var(--border); border-radius:6px; padding:0 8px; width:100%">
            <option value="">Tous les utilisateurs</option>
            @for (u of users(); track u.id) {
              <option [value]="u.id">{{ u.name }} ({{ u.role }})</option>
            }
          </select>
        </div>

        <!-- Filter by Action Type -->
        <div class="input-row" style="margin:0">
          <label style="font-size:11px; font-weight:700; color:var(--text-secondary); margin-bottom:4px; display:block">Type d'action</label>
          <select [ngModel]="filterAction()" (ngModelChange)="filterAction.set($event)" style="height:36px; font-size:12px; background:#FFF; border:1px solid var(--border); border-radius:6px; padding:0 8px; width:100%">
            <option value="">Toutes les actions</option>
            <option value="login">🔑 Connexion</option>
            <option value="create_quiz">📝 Création Quiz</option>
            <option value="modify_quiz">✏️ Modification Quiz</option>
            <option value="delete_quiz">❌ Suppression Quiz</option>
            <option value="create_lesson">📖 Création Cours</option>
            <option value="modify_lesson">📘 Modification Cours</option>
            <option value="delete_lesson">🗑️ Suppression Cours</option>
            <option value="add_vocab">🔤 Ajout Vocabulaire</option>
            <option value="create_group">👥 Création de Groupe</option>
            <option value="homework_graded">💯 Correction (Notes)</option>
            <option value="quiz_completed">🏆 Quiz Terminé</option>
            <option value="exercise_completed">✏️ Exercice Effectué</option>
            <option value="vocab_game_played">🎮 Vocab Game</option>
            <option value="live_started">🎬 Début Live</option>
            <option value="live_ended">🏁 Fin Live</option>
            <option value="live_joined">📥 Entrée Live</option>
            <option value="live_left">📤 Sortie Live</option>
          </select>
        </div>

        <!-- Filter by Group -->
        <div class="input-row" style="margin:0">
          <label style="font-size:11px; font-weight:700; color:var(--text-secondary); margin-bottom:4px; display:block">Groupe / Classe</label>
          <select [ngModel]="filterGroup()" (ngModelChange)="filterGroup.set($event)" style="height:36px; font-size:12px; background:#FFF; border:1px solid var(--border); border-radius:6px; padding:0 8px; width:100%">
            <option value="">Tous les groupes</option>
            @for (c of groups(); track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </select>
        </div>

        <!-- Filter by Date -->
        <div class="input-row" style="margin:0">
          <label style="font-size:11px; font-weight:700; color:var(--text-secondary); margin-bottom:4px; display:block">Date</label>
          <input type="date" [ngModel]="filterDate()" (ngModelChange)="filterDate.set($event)" style="height:36px; font-size:12px; background:#FFF; border:1px solid var(--border); border-radius:6px; padding:0 8px; width:100%" />
        </div>
      </div>

      <!-- LOGS TABLE LIST -->
      <div style="overflow-x:auto; border:1px solid var(--border-weak); border-radius:10px">
        <table style="width:100%; border-collapse:collapse; text-align:left; font-size:12.5px">
          <thead>
            <tr style="background:var(--surface-2); border-bottom:1px solid var(--border-weak)">
              <th style="padding:12px 16px; font-weight:700; color:var(--text-secondary)">Date & Heure</th>
              <th style="padding:12px 16px; font-weight:700; color:var(--text-secondary)">Utilisateur</th>
              <th style="padding:12px 16px; font-weight:700; color:var(--text-secondary)">Rôle</th>
              <th style="padding:12px 16px; font-weight:700; color:var(--text-secondary)">Action</th>
              <th style="padding:12px 16px; font-weight:700; color:var(--text-secondary)">Détails</th>
            </tr>
          </thead>
          <tbody>
            @for (log of filteredLogs(); track log.id) {
              <tr style="border-bottom:1px solid var(--border-weak); background:var(--surface-1)">
                <td style="padding:12px 16px; color:var(--text-muted); white-space:nowrap">
                  {{ log.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}
                </td>
                <td style="padding:12px 16px; font-weight:700; color:var(--text-primary)">
                  {{ log.userName }}
                </td>
                <td style="padding:12px 16px">
                  <span [class]="'badge ' + getRoleClass(log.userRole)">
                    {{ log.userRole | uppercase }}
                  </span>
                </td>
                <td style="padding:12px 16px; font-weight:600">
                  {{ getActionEmoji(log.action) }} {{ getActionLabel(log.action) }}
                </td>
                <td style="padding:12px 16px; color:var(--text-secondary)">
                  {{ log.details }}
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" style="padding:40px; text-align:center; color:var(--text-muted)">
                  📭 Aucun enregistrement ne correspond aux filtres sélectionnés.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    table th, table td { border: none; }
    .badge {
      display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase;
    }
    .badge.admin { background: #FEE2E2; color: #DC2626; }
    .badge.teacher { background: #EEF2FF; color: #4F46E5; }
    .badge.student { background: #ECFDF5; color: #10B981; }
    .badge.guest { background: #FEF3C7; color: #D97706; }
  `]
})
export class HistoryLogsComponent {
  private db = inject(DatabaseService);

  logs = signal<SystemLog[]>([]);
  users = signal<UserProfile[]>([]);
  groups = signal<ChatChannel[]>([]);

  filterUser = signal<string>('');
  filterAction = signal<string>('');
  filterGroup = signal<string>('');
  filterDate = signal<string>('');

  constructor() {
    this.db.observeSystemLogs().subscribe(list => this.logs.set(list));
    this.db.observeUsers().subscribe(list => this.users.set(list));
    this.db.observeChannels().subscribe(list => this.groups.set(list));
  }

  filteredLogs = computed(() => {
    let list = this.logs();
    const user = this.filterUser();
    const action = this.filterAction();
    const group = this.filterGroup();
    const date = this.filterDate();

    if (user) {
      list = list.filter(l => l.userId === user);
    }
    if (action) {
      list = list.filter(l => l.action === action);
    }
    if (group) {
      list = list.filter(l => l.groupId === group);
    }
    if (date) {
      list = list.filter(l => l.createdAt.startsWith(date));
    }

    return list;
  });

  clearFilters() {
    this.filterUser.set('');
    this.filterAction.set('');
    this.filterGroup.set('');
    this.filterDate.set('');
  }

  getRoleClass(role: string): string {
    return role;
  }

  getActionEmoji(action: string): string {
    switch (action) {
      case 'login': return '🔑';
      case 'create_quiz': return '📝';
      case 'modify_quiz': return '✏️';
      case 'delete_quiz': return '❌';
      case 'create_lesson': return '📖';
      case 'modify_lesson': return '📘';
      case 'delete_lesson': return '🗑️';
      case 'add_vocab': return '🔤';
      case 'create_group': return '👥';
      case 'homework_graded': return '💯';
      case 'quiz_completed': return '🏆';
      case 'exercise_completed': return '✏️';
      case 'message_sent': return '💬';
      case 'progression_updated': return '📈';
      case 'live_started': return '🎬';
      case 'live_ended': return '🏁';
      case 'live_joined': return '📥';
      case 'live_left': return '📤';
      default: return '⚡';
    }
  }

  getActionLabel(action: string): string {
    switch (action) {
      case 'login': return 'Connexion';
      case 'create_quiz': return 'Création Quiz';
      case 'modify_quiz': return 'Modification Quiz';
      case 'delete_quiz': return 'Suppression Quiz';
      case 'create_lesson': return 'Création Cours';
      case 'modify_lesson': return 'Modification Cours';
      case 'delete_lesson': return 'Suppression Cours';
      case 'add_vocab': return 'Ajout Vocabulaire';
      case 'create_group': return 'Création de Groupe';
      case 'homework_graded': return 'Correction Effectuée';
      case 'quiz_completed': return 'Quiz Effectué';
      case 'exercise_completed': return 'Exercice Effectué';
      case 'vocab_game_played': return 'Partie Vocabulaire';
      case 'message_sent': return 'Message Envoyé';
      case 'progression_updated': return 'Progression Mise à jour';
      case 'live_started': return 'Début Live';
      case 'live_ended': return 'Fin Live';
      case 'live_joined': return 'Entrée Live';
      case 'live_left': return 'Sortie Live';
      default: return action;
    }
  }
}
