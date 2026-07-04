import os

file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\teacher\vocab-games.ts'

code = """import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, VocabGame, UserProfile, ChatChannel } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-vocab-games',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="padding: 20px; max-width: 1000px; margin: 0 auto;">
      <div class="tab-row" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border-weak); padding-bottom: 10px;">
        <button class="tab" [class.active]="activeTab() === 'create'" (click)="activeTab.set('create')"
                style="padding: 10px 16px; border: none; background: none; cursor: pointer; font-weight: 600; transition: all 0.2s; border-bottom: 2px solid transparent; display: flex; align-items: center; gap: 6px;"
                [style.color]="activeTab() === 'create' ? 'var(--text-primary)' : 'var(--text-muted)'"
                [style.border-bottom-color]="activeTab() === 'create' ? '#F59E0B' : 'transparent'">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {{ labels().tabCreate }}
        </button>
        <button class="tab" [class.active]="activeTab() === 'list'" (click)="activeTab.set('list')"
                style="padding: 10px 16px; border: none; background: none; cursor: pointer; font-weight: 600; transition: all 0.2s; border-bottom: 2px solid transparent; display: flex; align-items: center; gap: 6px;"
                [style.color]="activeTab() === 'list' ? 'var(--text-primary)' : 'var(--text-muted)'"
                [style.border-bottom-color]="activeTab() === 'list' ? '#F59E0B' : 'transparent'">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          {{ labels().tabList }} ({{ games().length }})
        </button>
      </div>

      <!-- CREATE TAB -->
      @if (activeTab() === 'create') {
        <div class="card" style="border: 1px solid var(--border); border-radius: 12px; padding: 24px; background: var(--surface-1); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <h3 class="st" style="font-size:16px; margin: 0 0 16px 0; display:flex; align-items:center; gap:8px; color: var(--text-primary); font-weight: 700;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="16" height="12" rx="2"/><path d="M22 8v10a2 2 0 0 1-2 2H6"/></svg>
            {{ labels().createTitle }}
          </h3>

          <!-- Game Title -->
          <div class="input-row" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px;">
            <label for="gameTitle" style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ labels().titleLabel }}</label>
            <input id="gameTitle" type="text" [(ngModel)]="gameTitle" placeholder="ex. Vocabulary: Food & Drinks"
                   style="width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 13px; background: var(--surface-1); color: var(--text-primary);" />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
            <!-- Game Type -->
            <div class="input-row" style="display: flex; flex-direction: column; gap: 6px;">
              <label for="gameType" style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ labels().typeLabel }}</label>
              <select id="gameType" [(ngModel)]="gameType"
                      style="width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 13px; background: var(--surface-1); color: var(--text-primary);">
                <option value="flashcards">🃏 Flashcards</option>
                <option value="matching">🔗 {{ t('Association', 'Matching') }}</option>
                <option value="memory">🧠 Memory</option>
                <option value="word_builder">🏗️ Word Builder</option>
                <option value="hangman">🪢 {{ t('Pendu', 'Hangman') }}</option>
                <option value="multiple_choice">📝 {{ t('Choix multiple', 'Multiple Choice') }}</option>
              </select>
            </div>

            <!-- Difficulty -->
            <div class="input-row" style="display: flex; flex-direction: column; gap: 6px;">
              <label for="gameDiff" style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ labels().difficultyLabel }}</label>
              <select id="gameDiff" [(ngModel)]="gameDifficulty"
                      style="width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 13px; background: var(--surface-1); color: var(--text-primary);">
                <option value="easy">🟢 {{ t('Facile', 'Easy') }}</option>
                <option value="medium">🟡 {{ t('Moyen', 'Medium') }}</option>
                <option value="hard">🔴 {{ t('Difficile', 'Hard') }}</option>
              </select>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px">
            <!-- Category -->
            <div class="input-row" style="display: flex; flex-direction: column; gap: 6px;">
              <label for="gameCategory" style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ labels().categoryLabel }}</label>
              <select id="gameCategory" [(ngModel)]="gameCategory"
                      style="width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 13px; background: var(--surface-1); color: var(--text-primary);">
                <option value="general">🌍 {{ t('Général', 'General') }}</option>
                <option value="food">🍕 Food & Restaurants</option>
                <option value="travel">✈️ Travel & Places</option>
                <option value="business">💼 Business & Work</option>
                <option value="academic">🏫 Academic & Science</option>
              </select>
            </div>

            <!-- Group Assignment -->
            <div class="input-row" style="display: flex; flex-direction: column; gap: 6px;">
              <label for="gameGroup" style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ labels().groupLabel }}</label>
              <select id="gameGroup" [(ngModel)]="gameGroup"
                      style="width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 13px; background: var(--surface-1); color: var(--text-primary);">
                <option value="">{{ labels().allGroups }}</option>
                @for (c of channels(); track c.id) {
                  <option [value]="c.id">#{{ c.name }}</option>
                }
              </select>
            </div>
          </div>

          <!-- Game Type Description -->
          <div class="game-type-info" style="margin-bottom: 20px;">
            @switch (gameType) {
              @case ('flashcards') {
                <div class="ginfo purple">🃏 <strong>Flashcards :</strong> {{ labels().descFlashcards }}</div>
              }
              @case ('matching') {
                <div class="ginfo blue">🔗 <strong>{{ t('Association', 'Matching') }} :</strong> {{ labels().descMatching }}</div>
              }
              @case ('memory') {
                <div class="ginfo teal">🧠 <strong>Memory :</strong> {{ labels().descMemory }}</div>
              }
              @case ('word_builder') {
                <div class="ginfo amber">🏗️ <strong>Word Builder :</strong> {{ labels().descWordBuilder }}</div>
              }
              @case ('hangman') {
                <div class="ginfo red">🪢 <strong>{{ t('Pendu', 'Hangman') }} :</strong> {{ labels().descHangman }}</div>
              }
              @case ('multiple_choice') {
                <div class="ginfo green">📝 <strong>{{ t('Choix multiple', 'Multiple Choice') }} :</strong> {{ labels().descMultipleChoice }}</div>
              }
            }
          </div>

          <!-- Word List -->
          <div style="margin-top:20px">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
              <strong style="font-size:13px; color:var(--text-primary)">
                {{ labels().wordsListHeader }} ({{ words.length }})
              </strong>
              <button (click)="loadTemplate()"
                      style="font-size: 11px; padding: 6px 14px; border: 1.5px solid #F59E0B; border-radius: 20px; color: #92400E; background: #FFFBEB; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 4px; transition: all 0.2s;">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                {{ labels().loadTemplateBtn }}
              </button>
            </div>

            <!-- Column headers -->
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr 32px; gap:8px; margin-bottom:8px; padding:0 4px">
              <span style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase">{{ labels().engWordHeader }}</span>
              <span style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase">{{ labels().defHeader }}</span>
              <span style="font-size:10px; font-weight:700; color:var(--text-muted); text-transform:uppercase">{{ labels().transHeader }}</span>
              <span></span>
            </div>

            @for (w of words; track w; let wi = $index) {
              <div style="display:grid; grid-template-columns:1fr 1fr 1fr 32px; gap:8px; margin-bottom:8px; align-items:center">
                <input type="text" [(ngModel)]="w.word" placeholder="ex. Perseverance" style="border:1px solid var(--border); border-radius:8px; padding:7px 10px; font-size:12px; background:var(--surface-1); color:var(--text-primary)" />
                <input type="text" [(ngModel)]="w.definition" placeholder="The quality of..." style="border:1px solid var(--border); border-radius:8px; padding:7px 10px; font-size:12px; background:var(--surface-1); color:var(--text-primary)" />
                <input type="text" [(ngModel)]="w.translation" placeholder="Persévérance" style="border:1px solid var(--border); border-radius:8px; padding:7px 10px; font-size:12px; background:var(--surface-1); color:var(--text-primary)" />
                @if (words.length > 2) {
                  <button (click)="removeWord(wi)" style="background:#FEE2E2; border:none; border-radius:8px; color:#EF4444; cursor:pointer; width:30px; height:30px; display:flex; align-items:center; justify-content:center;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                } @else {
                  <div style="width:30px"></div>
                }
              </div>
            }

            <button class="add-word-btn" (click)="addWord()">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {{ labels().addWordBtn }}
            </button>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px; padding-top:16px; border-top:1px solid var(--border-weak)">
            @if (selectedGameId()) {
              <button class="btn-s" (click)="resetForm()" style="border: 1px solid var(--border); border-radius: 8px; padding: 8px 16px; cursor: pointer; background: none; font-weight: 600; color: var(--text-secondary);">{{ labels().cancelBtn }}</button>
            }
            <button class="btn-p" [disabled]="!isValid()" (click)="saveGame()" style="background:#F59E0B; border-color:#F59E0B; color: white; border-radius: 8px; padding: 8px 24px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {{ labels().saveBtn }}
            </button>
          </div>
        </div>
      }

      <!-- GAMES LIST -->
      @if (activeTab() === 'list') {
        <div style="display: flex; flex-direction: column; gap: 10px;">
          @for (game of games(); track game.id) {
            <div class="game-list-card">
              <div style="display:flex; align-items:center; gap:14px; flex:1">
                <div class="game-icon" [class]="getGameIconBg(game.gameType)">
                  @switch (game.gameType) {
                    @case ('flashcards') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="16" height="12" rx="2"/><path d="M22 8v10a2 2 0 0 1-2 2H6"/></svg>
                    }
                    @case ('matching') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                    }
                    @case ('memory') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-3.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-3.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2Z"/></svg>
                    }
                    @case ('word_builder') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                    }
                    @case ('hangman') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22V2h10a2 2 0 0 1 2 2v2"/><circle cx="16" cy="9" r="3"/><path d="M16 12v6m-3-3h6m-5 5h4"/></svg>
                    }
                    @case ('multiple_choice') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
                    }
                    @default {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    }
                  }
                </div>
                <div>
                  <div style="font-size:14px; font-weight:700; color:var(--text-primary)">{{ game.title }}</div>
                  <div style="font-size:12px; color:var(--text-muted); margin-top:2px">
                    {{ getGameLabel(game.gameType) }} · {{ game.words.length }} {{ t('mots', 'words') }} · {{ getDiffLabel(game.difficulty) }}
                    · {{ t('Créé le', 'Created on') }} {{ game.createdAt | date:'d MMM y' }}
                  </div>
                </div>
              </div>
              <div style="display:flex; gap:8px">
                <button class="btn-s" style="font-size:11px; padding:6px; display:inline-flex; align-items:center; justify-content:center;" (click)="editGame(game)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button class="btn-s" style="font-size:11px; padding:6px; border-color:#EF4444; color:#EF4444; display:inline-flex; align-items:center; justify-content:center;" (click)="deleteGame(game.id)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                </button>
              </div>
            </div>
          }
          @if (games().length === 0) {
            <div style="text-align:center; padding:50px 20px; border:1px dashed var(--border); border-radius:12px; background:var(--surface-1)">
              <div style="font-size:40px; margin-bottom:12px">🎮</div>
              <p style="font-size:13px; font-weight:600; color:var(--text-primary)">{{ labels().noGameTitle }}</p>
              <p style="font-size:12px; color:var(--text-muted)">{{ labels().noGameDesc }}</p>
            </div>
          }
        </div>
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
      transition: all 0.2s; font-family: inherit; margin-top: 12px;
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
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .game-icon.amber { background: #FFFBEB; color: #D97706; }
    .game-icon.blue { background: #EFF6FF; color: #2563EB; }
    .game-icon.teal { background: #F0FDFA; color: #0D9488; }
    .game-icon.red { background: #FFF1F2; color: #E11D48; }
    .game-icon.purple { background: #FAF5FF; color: #7C3AED; }
    .game-icon.green { background: #F0FDF4; color: #10B981; }
  `]
})
export class TeacherVocabGamesComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  activeTab = signal<'create' | 'list'>('create');
  games = signal<VocabGame[]>([]);
  currentUser = signal<UserProfile | null>(null);
  channels = signal<ChatChannel[]>([]);

  selectedGameId = signal<string | null>(null);

  gameTitle = '';
  gameType: VocabGame['gameType'] = 'flashcards';
  gameDifficulty: VocabGame['difficulty'] = 'medium';
  gameCategory = 'general';
  gameGroup = '';
  words: VocabGame['words'] = [
    { word: '', definition: '', translation: '' },
    { word: '', definition: '', translation: '' },
    { word: '', definition: '', translation: '' }
  ];

  activeLang = this.db.activeLang;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

  labels = computed(() => ({
    tabCreate: this.t("Créer un jeu", "Create a game"),
    tabList: this.t("Mes jeux", "My games"),
    titleLabel: this.t("Titre du jeu", "Game title"),
    typeLabel: this.t("Type de jeu", "Game type"),
    difficultyLabel: this.t("Difficulté", "Difficulty"),
    categoryLabel: this.t("Catégorie", "Category"),
    groupLabel: this.t("Assigner au groupe (optionnel)", "Assign to group (optional)"),
    allGroups: this.t("Tous les groupes", "All groups"),
    wordsListHeader: this.t("Liste de mots", "Word list"),
    loadTemplateBtn: this.t("Charger modèle rapide", "Load quick template"),
    engWordHeader: this.t("Mot en anglais", "English word"),
    defHeader: this.t("Définition", "Definition"),
    transHeader: this.t("Traduction (FR)", "Translation (FR)"),
    addWordBtn: this.t("Ajouter un mot", "Add a word"),
    cancelBtn: this.t("Annuler", "Cancel"),
    saveBtn: this.selectedGameId() ? this.t("Mettre à jour le jeu", "Update game") : this.t("Publier le jeu", "Publish game"),
    noGameTitle: this.t("Aucun jeu créé", "No games created"),
    noGameDesc: this.t("Créez votre premier jeu de vocabulaire !", "Create your first vocabulary game!"),
    createTitle: this.selectedGameId() ? this.t("Modifier le Jeu de Vocabulaire", "Edit Vocabulary Game") : this.t("Créer un Jeu de Vocabulaire", "Create a Vocabulary Game"),
    
    // Switch descriptions
    descFlashcards: this.t("Cartes recto-verso pour mémoriser le vocabulaire. L'élève lit le mot et révèle la définition.", "Double-sided cards to memorize vocabulary. The student reads the word and reveals the definition."),
    descMatching: this.t("Relier chaque mot à sa définition ou traduction.", "Link each word to its definition or translation."),
    descMemory: this.t("Retourner des paires de cartes mot/définition pour les retrouver de mémoire.", "Flip pairs of word/definition cards to find them from memory."),
    descWordBuilder: this.t("Reconstituer les lettres d'un mot depuis sa définition.", "Reconstruct the letters of a word from its definition."),
    descHangman: this.t("Deviner le mot lettre par lettre depuis un indice.", "Guess the word letter by letter from a clue."),
    descMultipleChoice: this.t("Pour chaque définition, choisir le bon mot parmi 4 options.", "For each definition, choose the correct word from 4 options.")
  }));

  constructor() {
    this.db.observeVocabGames().subscribe(list => this.games.set(list));
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
    this.db.observeChannels().subscribe(list => this.channels.set(list));
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
    const id = this.selectedGameId();
    const gameData = {
      title: this.gameTitle,
      gameType: this.gameType,
      difficulty: this.gameDifficulty,
      category: this.gameCategory,
      assignedGroupId: this.gameGroup || undefined,
      words: validWords
    };

    if (id) {
      await this.db.updateVocabGame(id, gameData);
      this.dialogService.alert(
        this.t('Jeu mis à jour !', 'Game updated!'), 
        this.t(`"${this.gameTitle}" a été mis à jour avec ${validWords.length} mots.`, `"${this.gameTitle}" has been updated with ${validWords.length} words.`), 
        'success'
      );
    } else {
      await this.db.addVocabGame({
        ...gameData,
        authorId: user?.id || 'teacher',
        words: validWords
      });

      await this.db.sendNotification({
        recipientId: this.gameGroup || 'all', recipientRole: 'student',
        type: 'quiz_available',
        title: this.t('🎮 Nouveau jeu de vocabulaire', '🎮 New vocabulary game'),
        message: this.t(`"${this.gameTitle}" est disponible !`, `"${this.gameTitle}" is available!`)
      });

      this.dialogService.alert(
        this.t('Jeu créé !', 'Game created!'), 
        this.t(`"${this.gameTitle}" a été publié avec ${validWords.length} mots.`, `"${this.gameTitle}" has been published with ${validWords.length} words.`), 
        'success'
      );
    }
    this.resetForm();
    this.activeTab.set('list');
  }

  editGame(game: VocabGame) {
    this.selectedGameId.set(game.id);
    this.gameTitle = game.title;
    this.gameType = game.gameType as any;
    this.gameDifficulty = game.difficulty;
    this.gameCategory = game.category || 'general';
    this.gameGroup = game.assignedGroupId || '';
    this.words = game.words.map(w => ({ ...w }));
    this.activeTab.set('create');
  }

  resetForm() {
    this.selectedGameId.set(null);
    this.gameTitle = '';
    this.gameType = 'flashcards';
    this.gameDifficulty = 'medium';
    this.gameCategory = 'general';
    this.gameGroup = '';
    this.words = [{ word: '', definition: '', translation: '' }, { word: '', definition: '', translation: '' }, { word: '', definition: '', translation: '' }];
  }

  deleteGame(id: string) {
    this.dialogService.confirm(
      this.t('Supprimer', 'Delete'), 
      this.t('Êtes-vous sûr ?', 'Are you sure?'), 
      async () => {
        await this.db.deleteVocabGame(id);
        this.dialogService.alert(
          this.t('Supprimé', 'Deleted'), 
          this.t('Jeu supprimé.', 'Game deleted.'), 
          'success'
        );
      }
    );
  }

  loadTemplate() {
    this.gameTitle = 'Vocabulary: Food & Restaurants';
    this.gameType = 'matching';
    this.words = [
      { word: 'Appetizer', definition: 'A small dish served before the main meal', translation: 'Entrée' },
      { word: 'Beverage', definition: 'A liquid that can be drunk', translation: 'Boisson' },
      { word: 'Cuisine', definition: 'A style or method of cooking', translation: 'Cuisine' },
      { word: 'Delicacy', definition: 'A choice or expensive food', translation: 'Délicatesse' },
      { word: 'Palate', definition: "A person's appreciation of taste and flavour", translation: 'Palais gustatif' },
    ];
  }

  getGameLabel(t: string): string {
    const m: any = { flashcards: 'Flashcards', matching: 'Association', memory: 'Memory', word_builder: 'Word Builder', hangman: 'Pendu', multiple_choice: 'Choix multiple' };
    return m[t] || t;
  }

  getDiffLabel(d: string): string {
    const m: any = { 
      easy: this.t('🟢 Facile', '🟢 Easy'), 
      medium: this.t('🟡 Moyen', '🟡 Medium'), 
      hard: this.t('🔴 Difficile', '🔴 Hard') 
    };
    return m[d] || d;
  }

  getGameIconBg(t: string): string {
    const m: any = { flashcards: 'purple', matching: 'blue', memory: 'teal', word_builder: 'amber', hangman: 'red', multiple_choice: 'green' };
    return `game-icon ${m[t] || 'purple'}`;
  }
}
"""

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(code)

print("vocab-games.ts updated successfully with translations!")
