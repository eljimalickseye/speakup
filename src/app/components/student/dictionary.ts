import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, DictionaryWord, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-student-dictionary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="animation: fadeIn 0.25s">
      <!-- Header stats -->
      <div class="grid3">
        <div class="mcard" style="background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); border: 1px solid #C7D2FE">
          <div class="mlabel" style="color:#4338CA">Mon Carnet</div>
          <div class="mval" style="color:#4F46E5">{{ myWordsCount() }}</div>
          <div class="msub" style="color:#4338CA">Mots sauvegardés</div>
        </div>
        <div class="mcard" style="background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); border: 1px solid #A7F3D0">
          <div class="mlabel" style="color:#047857">Dictionnaire Commun</div>
          <div class="mval" style="color:#10B981">{{ allWordsCount() }}</div>
          <div class="msub" style="color:#047857">Mots partagés</div>
        </div>
        <div class="mcard" style="background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); border: 1px solid #FDE68A">
          <div class="mlabel" style="color:#B45309">Niveau Vocabulaire</div>
          <div class="mval" style="color:#D97706">{{ masteryLevel() }}</div>
          <div class="msub" style="color:#B45309">Rangs de maîtrise</div>
        </div>
      </div>

      <!-- Add / Lookup Word Panel -->
      <div class="card" style="margin-top:20px; border:1px dashed #4F46E5; background:#F9FAFB">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px">
          <h3 class="st" style="font-size:15px; margin:0; color:#4F46E5; display:flex; align-items:center; gap:6px">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <span>Ajouter un Mot au Carnet</span>
          </h3>
        </div>

        <div style="display:flex; flex-direction:column; gap:12px">
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:12px">
            <div class="input-row" style="margin-bottom:0">
              <label style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px; display:block">Mot en Anglais</label>
              <input [(ngModel)]="newWord" placeholder="Ex: Resilience" class="form-input" style="height:36px; font-size:13px; width:100%" />
            </div>
            <div class="input-row" style="margin-bottom:0">
              <label style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px; display:block">Traduction Française</label>
              <input [(ngModel)]="newTranslation" placeholder="Ex: Résilience" class="form-input" style="height:36px; font-size:13px; width:100%" />
            </div>
            <div class="input-row" style="margin-bottom:0">
              <label style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px; display:block">Classe Grammaticale</label>
              <select [(ngModel)]="newPartOfSpeech" class="form-select" style="height:36px; font-size:13px; width:100%">
                <option value="nom">Nom (Noun)</option>
                <option value="verbe">Verbe (Verb)</option>
                <option value="adjectif">Adjectif (Adjective)</option>
                <option value="adverbe">Adverbe (Adverb)</option>
                <option value="expression">Expression (Idiom)</option>
              </select>
            </div>
            <div class="input-row" style="margin-bottom:0">
              <label style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px; display:block">Prononciation (Phonétique)</label>
              <input [(ngModel)]="newPhonetic" placeholder="Ex: /rɪˈzɪl.jəns/" class="form-input" style="height:36px; font-size:13px; width:100%" />
            </div>
          </div>

          <div class="input-row" style="margin-bottom:0">
            <label style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px; display:block">Définition</label>
            <textarea [(ngModel)]="newDefinition" placeholder="Saisissez la définition ou explication du mot..." rows="2" class="form-input" style="font-size:13px; width:100%; padding:8px 12px"></textarea>
          </div>

          <div class="input-row" style="margin-bottom:0">
            <label style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px; display:block">Exemples de phrases en contexte (Une phrase par ligne)</label>
            <textarea [(ngModel)]="newContextsStr" placeholder="Ex:&#10;1. Her resilience helped her. (Sa résilience l'a aidée.)&#10;2. Building mental resilience is key. (Bâtir une résilience mentale est capital.)" rows="3" class="form-input" style="font-size:13px; width:100%; padding:8px 12px; font-family:monospace"></textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px">
            <button class="btn-s" (click)="clearForm()" style="height:36px; padding:0 16px; font-weight:600">Vider les champs</button>
            <button 
              class="btn-p" 
              [disabled]="!newWord.trim() || !newTranslation.trim() || !newDefinition.trim()" 
              (click)="saveWord()" 
              style="height:36px; padding:0 24px; font-weight:700; background:#10B981; border-color:#10B981">
              💾 Sauvegarder dans mon Carnet
            </button>
          </div>
        </div>
      </div>

      <!-- Dictionary Listing Cards -->
      <div class="card" style="margin-top:20px">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:16px; flex-wrap:wrap">
          <!-- View selector tabs -->
          <div style="display:flex; gap:6px">
            <button class="btn-s" [class.active]="viewTab() === 'my'" (click)="viewTab.set('my')" style="font-size:12px; font-weight:700; padding:6px 14px">
              📓 Mon carnet
            </button>
            <button class="btn-s" [class.active]="viewTab() === 'all'" (click)="viewTab.set('all')" style="font-size:12px; font-weight:700; padding:6px 14px">
              🌍 Dictionnaire public
            </button>
          </div>

          <!-- Search filter input -->
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Rechercher un mot ou une traduction..." 
            class="form-input" 
            style="width:240px; height:34px; font-size:12px; border:1px solid var(--border-weak); border-radius:6px; padding:0 10px" 
          />
        </div>

        @if (filteredList().length === 0) {
          <div style="text-align:center; padding:48px 16px; color:var(--text-muted)">
            <i class="ti ti-bookmarks" style="font-size:40px; display:block; margin-bottom:12px; color:var(--text-muted); opacity:0.5"></i>
            <p style="font-size:13px; font-weight:600; margin-bottom:4px; color:var(--text-primary)">Aucun mot trouvé</p>
            <p style="font-size:11px; margin:0">Ajoutez un mot manuellement pour enrichir votre vocabulaire.</p>
          </div>
        } @else {
          <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:12px">
            @for (word of filteredList(); track word.id) {
              <div class="word-card" style="background:var(--surface-2); border:1px solid var(--border-weak); border-radius:10px; padding:14px; position:relative; display:flex; flex-direction:column; justify-content:space-between">
                
                <div>
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:6px">
                    <div>
                      <h4 style="font-size:16px; font-weight:800; color:var(--text-primary); margin:0 0 2px 0">{{ word.word }}</h4>
                      <div style="display:flex; align-items:center; gap:6px">
                        <span class="pos-badge" [class]="word.partOfSpeech">{{ word.partOfSpeech }}</span>
                        @if (word.phonetic) {
                          <span style="font-size:11px; color:var(--text-muted); font-family:monospace">{{ word.phonetic }}</span>
                        }
                      </div>
                    </div>
                    
                    @if (word.userId === currentUser()?.id) {
                      <button (click)="deleteWord(word.id)" style="background:none; border:none; color:#EF4444; cursor:pointer; padding:4px; opacity:0.6" title="Supprimer">×</button>
                    }
                  </div>

                  <p style="font-size:12px; color:#4F46E5; font-weight:700; margin:8px 0 4px 0">➡️ {{ word.translation }}</p>
                  <p style="font-size:12px; color:var(--text-secondary); line-height:1.4; margin:0 0 8px 0">{{ word.definition }}</p>
                </div>

                <!-- Examples Context Box -->
                @if (word.contexts && word.contexts.length > 0) {
                  <div style="background:var(--surface-1); border-left:3px solid #10B981; padding:8px 10px; border-radius:4px; margin-top:8px">
                    <span style="font-size:9px; text-transform:uppercase; font-weight:700; color:#047857; display:block; margin-bottom:4px">Exemples en contexte :</span>
                    <div style="display:flex; flex-direction:column; gap:4px">
                      @for (ctx of word.contexts; track ctx) {
                        <p style="font-size:10.5px; color:var(--text-muted); font-style:italic; margin:0; line-height:1.3">
                          {{ ctx }}
                        </p>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .word-card {
      transition: all 0.2s ease;
    }
    .word-card:hover {
      border-color: #4F46E5 !important;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.08);
      transform: translateY(-2px);
    }
    .pos-badge {
      display: inline-block;
      font-size: 9px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .pos-badge.nom { background: #EEF2FF; color: #4338CA; }
    .pos-badge.verbe { background: #ECFDF5; color: #047857; }
    .pos-badge.adjectif { background: #FFFBEB; color: #D97706; }
    .pos-badge.adverbe { background: #FDF2F8; color: #DB2777; }
    .pos-badge.expression { background: #F3E8FF; color: #7C3AED; }
  `]
})
export class StudentDictionaryComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  // Lists
  allWords = signal<DictionaryWord[]>([]);
  
  // UI states
  viewTab = signal<'my' | 'all'>('my');

  // Input states
  searchQuery = '';

  // Manual form states
  newWord = '';
  newTranslation = '';
  newPartOfSpeech = 'nom';
  newPhonetic = '';
  newDefinition = '';
  newContextsStr = '';

  currentUser = signal<UserProfile | null>(null);

  constructor() {
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
    this.db.observeDictionary().subscribe(words => this.allWords.set(words));
  }

  myWords = computed(() => {
    const user = this.currentUser();
    if (!user) return [];
    return this.allWords().filter(w => w.userId === user.id);
  });

  myWordsCount = computed(() => this.myWords().length);
  allWordsCount = computed(() => this.allWords().length);

  masteryLevel = computed(() => {
    const count = this.myWordsCount();
    if (count < 5) return 'Débutant 🌱';
    if (count < 15) return 'Intermédiaire 🌿';
    if (count < 35) return 'Avancé 🌳';
    return 'Expert Anglais 👑';
  });

  filteredList = computed(() => {
    let list = this.viewTab() === 'my' ? this.myWords() : this.allWords();

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(w => 
        w.word.toLowerCase().includes(q) ||
        w.translation.toLowerCase().includes(q) ||
        w.definition.toLowerCase().includes(q)
      );
    }
    return list;
  });

  saveWord() {
    if (!this.newWord.trim() || !this.newTranslation.trim() || !this.newDefinition.trim()) {
      this.dialogService.alert('Champs requis', 'Veuillez remplir au moins le mot, la traduction et la définition.', 'info');
      return;
    }

    const user = this.currentUser();
    if (!user) return;

    // Split context lines
    const contexts = this.newContextsStr
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const newDictWord = {
      word: this.newWord.trim(),
      translation: this.newTranslation.trim(),
      partOfSpeech: this.newPartOfSpeech,
      phonetic: this.newPhonetic.trim() || undefined,
      definition: this.newDefinition.trim(),
      contexts: contexts,
      userId: user.id
    };

    this.db.addWordToDictionary(newDictWord).then(() => {
      this.dialogService.alert('Mot Sauvegardé', `"${this.newWord}" a été ajouté à votre carnet !`, 'success');
      this.clearForm();
    });
  }

  deleteWord(wordId: string) {
    this.dialogService.show({
      title: 'Supprimer le Mot',
      message: 'Voulez-vous vraiment retirer ce mot de votre carnet ?',
      type: 'confirm',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      onConfirm: () => {
        this.db.deleteWordFromDictionary(wordId).then(() => {
          this.dialogService.alert('Supprimé', 'Le mot a été retiré de votre carnet.', 'success');
        });
      }
    });
  }

  clearForm() {
    this.newWord = '';
    this.newTranslation = '';
    this.newPartOfSpeech = 'nom';
    this.newPhonetic = '';
    this.newDefinition = '';
    this.newContextsStr = '';
  }
}