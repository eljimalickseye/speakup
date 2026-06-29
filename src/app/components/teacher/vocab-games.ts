import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, VocabGame, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-vocab-games',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="tab-row">
        <button class="tab" [class.active]="activeTab() === 'create'" (click)="activeTab.set('create')">
          <i class="ti ti-plus"></i> Créer un jeu
        </button>
        <button class="tab" [class.active]="activeTab() === 'list'" (click)="activeTab.set('list')">
          <i class="ti ti-cards"></i> Mes jeux ({{ games().length }})
        </button>
      </div>

      <!-- CREATE TAB -->
      @if (activeTab() === 'create') {
        <div class="card">
          <h3 class="st" style="font-size:16px; margin-bottom:16px; display:flex; align-items:center; gap:8px">
            <i class="ti ti-cards" style="color:#F59E0B"></i> Créer un Jeu de Vocabulaire
          </h3>

          <!-- Game Title -->
          <div class="input-row">
            <label for="gameTitle">Titre du jeu</label>
            <input id="gameTitle" type="text" [(ngModel)]="gameTitle" placeholder="ex. Vocabulary: Food & Drinks" />
          </div>

          <div class="g3">
            <!-- Game Type -->
            <div class="input-row">
              <label for="gameType">Type de jeu</label>
              <select id="gameType" [(ngModel)]="gameType">
                <option value="flashcards">🃏 Flashcards</option>
                <option value="matching">🔗 Association</option>
                <option value="memory">🧠 Memory</option>
                <option value="word_builder">🏗️ Word Builder</option>
                <option value="hangman">🪢 Pendu</option>
                <option value="multiple_choice">📝 Choix multiple</option>
              </select>
            </div>

            <!-- Difficulty -->
            <div class="input-row">
              <label for="gameDiff">Difficulté</label>
              <select id="gameDiff" [(ngModel)]="gameDifficulty">
                <option value="easy">🟢 Facile</option>
                <option value="medium">🟡 Moyen</option>
                <option value="hard">🔴 Difficile</option>
              </select>
            </div>
          </div>

          <!-- Game Type Description -->
          <div class="game-type-info">
            @switch (gameType) {
              @case ('flashcards') {
                <div class="ginfo purple">🃏 <strong>Flashcards :</strong> Cartes recto-verso pour mémoriser le vocabulaire. L'élève lit le mot et révèle la définition.</div>
              }
              @case ('matching') {
                <div class="ginfo blue">🔗 <strong>Association :</strong> Relier chaque mot à sa définition ou traduction.</div>
              }
              @case ('memory') {
                <div class="ginfo teal">🧠 <strong>Memory :</strong> Retourner des paires de cartes mot/définition pour les retrouver de mémoire.</div>
              }
              @case ('word_builder') {
                <div class="ginfo amber">🏗️ <strong>Word Builder :</strong> Reconstituer les lettres d'un mot depuis sa définition.</div>
              }
              @case ('hangman') {
                <div class="ginfo red">🪢 <strong>Pendu :</strong> Deviner le mot lettre par lettre depuis un indice.</div>
              }
              @case ('multiple_choice') {
                <div class="ginfo green">📝 <strong>Choix multiple :</strong> Pour chaque définition, choisir le bon mot parmi 4 options.</div>
              }
            }
          </div>

          <!-- Word List -->
          <div style="margin-top:16px">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
              <strong style="font-size:13px; color:var(--text-primary)">
                Liste de mots ({{ words.length }})
              </strong>
              <button class="btn-s" style="font-size:11px; padding:4px 12px; border-color:#F59E0B; color:#92400E" (click)="loadTemplate()">
                📦 Charger modèle rapide
              </button>
            </div>

            <!-- Column headers -->
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr 32px; gap:8px; margin-bottom:8px; padding:0 4px">
              <span style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase">Mot en anglais</span>
              <span style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase">Définition</span>
              <span style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase">Traduction (FR)</span>
              <span></span>
            </div>

            @for (w of words; track w; let wi = $index) {
              <div style="display:grid; grid-template-columns:1fr 1fr 1fr 32px; gap:8px; margin-bottom:6px; align-items:center">
                <input type="text" [(ngModel)]="w.word" placeholder="ex. Perseverance" style="border:1px solid var(--border); border-radius:6px; padding:7px 10px; font-size:12px; background:#FFF; color:var(--text-primary)" />
                <input type="text" [(ngModel)]="w.definition" placeholder="The quality of..." style="border:1px solid var(--border); border-radius:6px; padding:7px 10px; font-size:12px; background:#FFF; color:var(--text-primary)" />
                <input type="text" [(ngModel)]="w.translation" placeholder="Persévérance" style="border:1px solid var(--border); border-radius:6px; padding:7px 10px; font-size:12px; background:#FFF; color:var(--text-primary)" />
                @if (words.length > 2) {
                  <button (click)="removeWord(wi)" style="background:#FEE2E2; border:none; border-radius:6px; color:#EF4444; cursor:pointer; width:30px; height:30px; display:flex; align-items:center; justify-content:center; font-size:16px">×</button>
                } @else {
                  <div style="width:30px"></div>
                }
              </div>
            }

            <button class="add-word-btn" (click)="addWord()">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Ajouter un mot
            </button>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:20px; padding-top:16px; border-top:1px solid var(--border-weak)">
            <button class="btn-p" [disabled]="!isValid()" (click)="saveGame()" style="background:#F59E0B; border-color:#F59E0B">
              <i class="ti ti-check"></i> Publier le jeu
            </button>
          </div>
        </div>
      }

      <!-- GAMES LIST -->
      @if (activeTab() === 'list') {
        @for (game of games(); track game.id) {
          <div class="game-list-card">
            <div style="display:flex; align-items:center; gap:12px; flex:1">
              <div class="game-icon" [class]="getGameIconBg(game.gameType)">
                {{ getGameEmoji(game.gameType) }}
              </div>
              <div>
                <div style="font-size:13px; font-weight:700; color:var(--text-primary)">{{ game.title }}</div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:2px">
                  {{ getGameLabel(game.gameType) }} · {{ game.words.length }} mots · {{ getDiffLabel(game.difficulty) }}
                  · Créé le {{ game.createdAt | date:'d MMM y' }}
                </div>
              </div>
            </div>
            <button class="btn-s" style="font-size:11px; padding:4px 10px; border-color:#EF4444; color:#EF4444" (click)="deleteGame(game.id)">
              <i class="ti ti-trash"></i>
            </button>
          </div>
        }
        @if (games().length === 0) {
          <div style="text-align:center; padding:50px 20px; border:1px dashed var(--border); border-radius:12px; background:var(--surface-1)">
            <div style="font-size:40px; margin-bottom:12px">🃏</div>
            <p style="font-size:13px; font-weight:600; color:var(--text-primary)">Aucun jeu créé</p>
            <p style="font-size:12px; color:var(--text-muted)">Créez votre premier jeu de vocabulaire !</p>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .game-type-info { margin-bottom: 8px; }
    .ginfo { padding: 10px 14px; border-radius: 8px; font-size: 12px; }
    .ginfo.purple { background: #FAF5FF; color: #6D28D9; border: 1px solid #E9D5FF; }
    .ginfo.blue { background: #EFF6FF; color: #1D4ED8; border: 1px solid #BFDBFE; }
    .ginfo.teal { background: #F0FDFA; color: #0F766E; border: 1px solid #99F6E4; }
    .ginfo.amber { background: #FFFBEB; color: #92400E; border: 1px solid #FDE68A; }
    .ginfo.red { background: #FFF1F2; color: #BE123C; border: 1px solid #FECDD3; }
    .ginfo.green { background: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; }

    .add-word-btn {
      width: 100%; border: 2px dashed #FDE68A; border-radius: 8px; background: #FFFBEB;
      color: #92400E; font-size: 13px; font-weight: 600; padding: 10px;
      cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: all 0.2s; font-family: inherit; margin-top: 8px;
    }
    .add-word-btn:hover { background: #FEF3C7; border-color: #F59E0B; }

    .game-list-card {
      display: flex; align-items: center; gap: 12px; padding: 14px 16px;
      background: var(--surface-1); border: 1px solid var(--border); border-radius: 12px;
      margin-bottom: 8px; transition: border-color 0.2s;
    }
    .game-list-card:hover { border-color: #F59E0B; }

    .game-icon {
      width: 42px; height: 42px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0;
    }
    .game-icon.amber { background: #FFFBEB; }
    .game-icon.blue { background: #EFF6FF; }
    .game-icon.teal { background: #F0FDFA; }
    .game-icon.red { background: #FFF1F2; }
    .game-icon.purple { background: #FAF5FF; }
    .game-icon.green { background: #F0FDF4; }
  `]
})
export class TeacherVocabGamesComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  activeTab = signal<'create' | 'list'>('create');
  games = signal<VocabGame[]>([]);
  currentUser = signal<UserProfile | null>(null);

  gameTitle = '';
  gameType: VocabGame['gameType'] = 'flashcards';
  gameDifficulty: VocabGame['difficulty'] = 'medium';
  words: VocabGame['words'] = [
    { word: '', definition: '', translation: '' },
    { word: '', definition: '', translation: '' },
    { word: '', definition: '', translation: '' }
  ];

  constructor() {
    this.db.observeVocabGames().subscribe(list => this.games.set(list));
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
  }

  addWord() {
    this.words.push({ word: '', definition: '', translation: '' });
  }

  removeWord(idx: number) {
    if (this.words.length > 2) this.words.splice(idx, 1);
  }

  isValid(): boolean {
    if (!this.gameTitle.trim()) return false;
    const filled = this.words.filter(w => w.word.trim() && w.definition.trim());
    return filled.length >= 2;
  }

  async saveGame() {
    const user = this.currentUser();
    const validWords = this.words.filter(w => w.word.trim() && w.definition.trim());
    await this.db.addVocabGame({
      title: this.gameTitle,
      gameType: this.gameType,
      difficulty: this.gameDifficulty,
      authorId: user?.id || 'teacher',
      words: validWords
    });

    await this.db.sendNotification({
      recipientId: 'all', recipientRole: 'student',
      type: 'quiz_available',
      title: '🎮 Nouveau jeu de vocabulaire',
      message: `"${this.gameTitle}" est disponible !`
    });

    this.dialogService.alert('Jeu créé !', `"${this.gameTitle}" a été publié avec ${validWords.length} mots.`, 'success');
    this.resetForm();
    this.activeTab.set('list');
  }

  resetForm() {
    this.gameTitle = '';
    this.gameType = 'flashcards';
    this.gameDifficulty = 'medium';
    this.words = [{ word: '', definition: '', translation: '' }, { word: '', definition: '', translation: '' }, { word: '', definition: '', translation: '' }];
  }

  deleteGame(id: string) {
    this.dialogService.confirm('Supprimer', 'Êtes-vous sûr ?', async () => {
      await this.db.deleteVocabGame(id);
      this.dialogService.alert('Supprimé', 'Jeu supprimé.', 'success');
    });
  }

  loadTemplate() {
    this.gameTitle = 'Vocabulary: Food & Restaurants';
    this.gameType = 'matching';
    this.words = [
      { word: 'Appetizer', definition: 'A small dish served before the main meal', translation: 'Entrée' },
      { word: 'Beverage', definition: 'A liquid that can be drunk', translation: 'Boisson' },
      { word: 'Cuisine', definition: 'A style or method of cooking', translation: 'Cuisine' },
      { word: 'Delicacy', definition: 'A choice or expensive food', translation: 'Délicatesse' },
      { word: 'Palate', definition: 'A person\'s appreciation of taste and flavour', translation: 'Palais gustatif' },
    ];
  }

  getGameEmoji(t: string): string {
    const m: any = { flashcards: '🃏', matching: '🔗', memory: '🧠', word_builder: '🏗️', hangman: '🪢', multiple_choice: '📝' };
    return m[t] || '🎮';
  }

  getGameLabel(t: string): string {
    const m: any = { flashcards: 'Flashcards', matching: 'Association', memory: 'Memory', word_builder: 'Word Builder', hangman: 'Pendu', multiple_choice: 'Choix multiple' };
    return m[t] || t;
  }

  getDiffLabel(d: string): string {
    const m: any = { easy: '🟢 Facile', medium: '🟡 Moyen', hard: '🔴 Difficile' };
    return m[d] || d;
  }

  getGameIconBg(t: string): string {
    const m: any = { flashcards: 'amber', matching: 'blue', memory: 'teal', word_builder: 'amber', hangman: 'red', multiple_choice: 'green' };
    return `game-icon ${m[t] || 'purple'}`;
  }
}
