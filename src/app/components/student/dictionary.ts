import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, DictionaryWord, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

interface ApiDictResult {
  word: string;
  phonetic?: string;
  phonetics?: { text?: string; audio?: string }[];
  meanings?: {
    partOfSpeech: string;
    definitions: { definition: string; example?: string; synonyms?: string[]; antonyms?: string[] }[];
    synonyms?: string[];
    antonyms?: string[];
  }[];
}

@Component({
  selector: 'app-student-dictionary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="animation: fadeIn 0.25s">
      <!-- Header Stats -->
      <div class="grid3">
        <div class="mcard" style="background:linear-gradient(135deg,#EEF2FF,#E0E7FF); border:1px solid #C7D2FE">
          <div class="mlabel" style="color:#4338CA">My Vocabulary</div>
          <div class="mval" style="color:#4F46E5">{{ myWordsCount() }}</div>
          <div class="msub" style="color:#4338CA">Saved Words</div>
        </div>
        <div class="mcard" style="background:linear-gradient(135deg,#ECFDF5,#D1FAE5); border:1px solid #A7F3D0">
          <div class="mlabel" style="color:#047857">Definitions Found</div>
          <div class="mval" style="color:#10B981">{{ searchHistory().length }}</div>
          <div class="msub" style="color:#047857">Searches this month</div>
        </div>
        <div class="mcard" style="background:linear-gradient(135deg,#FFFBEB,#FEF3C7); border:1px solid #FDE68A">
          <div class="mlabel" style="color:#B45309">Vocabulary Level</div>
          <div class="mval" style="color:#D97706">{{ masteryLevel() }}</div>
          <div class="msub" style="color:#B45309">Mastery Rank</div>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="card" style="border:1.5px solid #C7D2FE; background:#F8F9FF; padding:18px">
        <h3 class="st" style="font-size:15px; margin-bottom:12px; color:#4F46E5; display:flex; align-items:center; gap:8px">
          <i class="ti ti-search"></i> Dictionary Search
        </h3>
        
        <!-- Language Toggle -->
        <div style="display:flex; gap:8px; margin-bottom:12px">
          <button class="tab" [class.active]="searchLanguage() === 'en'" (click)="searchLanguage.set('en')" style="font-size:11px; padding:4px 12px">
            🇬🇧 English
          </button>
          <button class="tab" [class.active]="searchLanguage() === 'fr'" (click)="searchLanguage.set('fr')" style="font-size:11px; padding:4px 12px">
            🇫🇷 Français
          </button>
        </div>
        
        <div style="display:flex; gap:8px; flex-wrap:wrap">
          <div style="position:relative; flex:1; min-width:200px">
            <i class="ti ti-letter-case" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:14px"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              [placeholder]="searchLanguage() === 'en' ? 'Search for an English word...' : 'Rechercher un mot en français...'"
              style="height:40px; width:100%; padding:0 12px 0 32px; border:1px solid var(--border); border-radius:8px; font-size:13px; background:#FFF; color:var(--text-primary)"
              (keyup.enter)="searchWord()"
            />
          </div>
          <button class="btn-p" style="height:40px; padding:0 20px; font-size:13px" [disabled]="!searchQuery.trim() || isSearching()" (click)="searchWord()">
            @if (isSearching()) { <span>Searching...</span> } @else { <i class="ti ti-search"></i> Search }
          </button>
          @if (apiResult()) {
            <button class="btn-s" style="height:40px; padding:0 16px; font-size:12px; border-color:#059669; color:#059669" (click)="saveCurrentWord()">
              <i class="ti ti-bookmark"></i> Save
            </button>
          }
        </div>

        <!-- Quick searches -->
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:10px">
          <span style="font-size:10px; color:var(--text-muted); font-weight:600">Quick:</span>
          @for (word of (searchLanguage() === 'en' ? quickWordsEn : quickWordsFr); track word) {
            <button class="badge" style="background:#EEF2FF; color:#4F46E5; border:1px solid #C7D2FE; cursor:pointer; font-size:10px; padding:3px 8px" (click)="quickSearch(word)">
              {{ word }}
            </button>
          }
        </div>
      </div>

      <!-- API Result -->
      @if (apiResult(); as result) {
        <div class="card dict-result-card" style="animation: fadeIn 0.3s ease">
          <!-- Word Header -->
          <div style="display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; gap:10px">
            <div>
              <h2 style="font-size:28px; font-weight:800; color:var(--text-primary); margin:0; letter-spacing:-0.5px">{{ result.word }}</h2>
              @if (getPhonetic(result)) {
                <div style="display:flex; align-items:center; gap:8px; margin-top:4px">
                  <span style="font-size:15px; color:#4F46E5; font-style:italic">{{ getPhonetic(result) }}</span>
                  @if (getAudio(result)) {
                    <button class="speak-btn" (click)="playAudio(result)" title="Écouter la prononciation">
                      <i class="ti ti-volume" style="font-size:16px"></i>
                    </button>
                  } @else {
                    <button class="speak-btn" (click)="speakWord(result.word)" title="Synthèse vocale">
                      <i class="ti ti-volume" style="font-size:16px"></i>
                    </button>
                  }
                </div>
              } @else {
                <button class="speak-btn" style="margin-top:6px" (click)="speakWord(result.word)" title="Écouter">
                  <i class="ti ti-volume" style="font-size:14px"></i> Écouter
                </button>
              }
            </div>
            <div style="display:flex; gap:8px">
              <button class="btn-p" style="font-size:12px; padding:6px 14px" (click)="saveCurrentWord()">
                <i class="ti ti-bookmark"></i> Sauvegarder
              </button>
            </div>
          </div>

          <!-- French Translation Input -->
          <div style="background:var(--surface-2); padding:10px 12px; border-radius:8px; border:1px solid var(--border-weak); margin-bottom:12px">
            <label style="font-size:11px; font-weight:700; color:var(--text-primary); display:block; margin-bottom:4px">
              🇫🇷 Traduction en français :
            </label>
            <input 
              type="text" 
              [(ngModel)]="currentTranslation" 
              placeholder="Entrez sa traduction en français (ex. École, Livre...)" 
              style="height:32px; width:100%; padding:0 8px; border:1px solid var(--border); border-radius:6px; font-size:12px; background:#FFF"
            />
          </div>

          <!-- Meanings -->
          @for (meaning of result.meanings || []; track meaning; let mi = $index) {
            <div style="margin-bottom:18px; padding-bottom:16px; border-bottom:1px solid var(--border-weak)">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px">
                <span class="pos-badge">{{ meaning.partOfSpeech }}</span>
                @if (meaning.synonyms && meaning.synonyms.length > 0) {
                  <span style="font-size:10px; color:var(--text-muted)">Synonymes : {{ meaning.synonyms.slice(0,4).join(', ') }}</span>
                }
              </div>

              @for (def of meaning.definitions.slice(0, 3); track def; let di = $index) {
                <div class="def-item">
                  <span class="def-num">{{ di + 1 }}</span>
                  <div>
                    <p style="font-size:13px; color:var(--text-primary); margin:0; line-height:1.5">{{ def.definition }}</p>
                    @if (def.example) {
                      <p style="font-size:12px; color:var(--text-muted); font-style:italic; margin:4px 0 0; border-left:2px solid #C7D2FE; padding-left:8px">
                        "{{ def.example }}"
                      </p>
                    }
                  </div>
                </div>
              }
            </div>
          }

          @if (!result.meanings?.length) {
            <p style="color:var(--text-muted); font-size:13px">Aucune définition disponible pour ce mot.</p>
          }
        </div>
      }

      @if (searchError()) {
        <div style="background:#FEF2F2; border:1px solid #FCA5A5; border-radius:10px; padding:16px; display:flex; align-items:center; gap:12px; animation:fadeIn 0.3s">
          <i class="ti ti-alert-circle" style="color:#DC2626; font-size:22px; flex-shrink:0"></i>
          <div>
            <div style="font-size:13px; font-weight:700; color:#B91C1C">Mot non trouvé</div>
            <div style="font-size:12px; color:#9B1C1C; margin-top:2px">{{ searchError() }}</div>
          </div>
        </div>
      }

      <!-- Tab Selector -->
      <div class="tab-row">
        <button class="tab" [class.active]="viewTab() === 'base'" (click)="viewTab.set('base')">
          📖 Dictionnaire de base ({{ baseDictionaryWords.length }})
        </button>
        <button class="tab" [class.active]="viewTab() === 'saved'" (click)="viewTab.set('saved')">
          <i class="ti ti-bookmark"></i> My Saved Words ({{ myWordsCount() }})
        </button>
        <button class="tab" [class.active]="viewTab() === 'irregular'" (click)="viewTab.set('irregular')">
          📋 Irregular Verbs
        </button>
      </div>

      <!-- Saved Words -->
      @if (viewTab() === 'saved') {
        @if (sortedMyWords().length === 0) {
          <div style="text-align:center; padding:40px; border:1px dashed var(--border); border-radius:12px">
            <i class="ti ti-bookmark" style="font-size:40px; color:var(--text-muted); display:block; margin-bottom:12px"></i>
            <p style="font-size:13px; color:var(--text-muted)">No saved words yet. Search for words and save them to your vocabulary list!</p>
          </div>
        }
        <div style="display:flex; flex-direction:column; gap:8px">
          @for (word of sortedMyWords(); track word.id) {
            <div class="saved-word-card">
              <div style="flex:1">
                <div style="display:flex; align-items:center; gap:10px">
                  <strong style="font-size:15px; color:var(--text-primary)">{{ word.word }}</strong>
                  @if (word.phonetic) {
                    <span style="font-size:12px; color:#4F46E5; font-style:italic">{{ word.phonetic }}</span>
                  }
                  <button (click)="speakWord(word.word)" style="background:none; border:none; cursor:pointer; color:#4F46E5; font-size:14px" title="Écouter">
                    <i class="ti ti-volume"></i>
                  </button>
                </div>
                <div style="font-size:11px; font-weight:600; color:var(--text-muted); margin-top:2px; text-transform:uppercase">{{ word.partOfSpeech }}</div>
                <p style="font-size:12px; color:var(--text-secondary); margin:4px 0 0; line-height:1.4">{{ word.definition }}</p>
                @if (word.translation) {
                  <p style="font-size:11px; color:#047857; margin:3px 0 0; font-style:italic">🇫🇷 {{ word.translation }}</p>
                }
              </div>
              <button (click)="deleteWord(word.id)" style="background:none; border:none; cursor:pointer; color:var(--text-muted); font-size:16px; flex-shrink:0; padding:4px" title="Supprimer">
                <i class="ti ti-trash"></i>
              </button>
            </div>
          }
        </div>
      }

      <!-- Base Dictionary Words -->
      @if (viewTab() === 'base') {
        <div style="display:flex; flex-direction:column; gap:8px">
          @for (word of baseDictionaryWords; track word.word) {
            <div class="saved-word-card" style="border-left: 3px solid #4F46E5">
              <div style="flex:1">
                <div style="display:flex; align-items:center; gap:10px">
                  <strong style="font-size:15px; color:var(--text-primary)">{{ word.word }}</strong>
                  @if (word.phonetic) {
                    <span style="font-size:12px; color:#4F46E5; font-style:italic">{{ word.phonetic }}</span>
                  }
                  <button (click)="speakWord(word.word)" style="background:none; border:none; cursor:pointer; color:#4F46E5; font-size:14px" title="Écouter">
                    <i class="ti ti-volume"></i>
                  </button>
                </div>
                <div style="font-size:11px; font-weight:600; color:var(--text-muted); margin-top:2px; text-transform:uppercase">{{ word.partOfSpeech }}</div>
                <p style="font-size:12px; color:var(--text-secondary); margin:4px 0 0; line-height:1.4">{{ word.definition }}</p>
                <p style="font-size:11px; color:#047857; margin:3px 0 0; font-style:italic">🇫🇷 {{ word.translation }}</p>
                @if (word.contexts && word.contexts.length > 0) {
                  <p style="font-size:11px; color:var(--text-muted); font-style:italic; margin-top:4px; padding-left:6px; border-left:2px solid var(--border)">
                    Ex. {{ word.contexts[0] }}
                  </p>
                }
              </div>
              <button class="btn-s" style="padding:4px 8px; font-size:10px; display:inline-flex; align-items:center; gap:4px; align-self:center" (click)="savePreloadedWord(word)">
                <i class="ti ti-bookmark"></i> Enregistrer
              </button>
            </div>
          }
        </div>
      }

      <!-- Irregular Verbs Table -->
      @if (viewTab() === 'irregular') {
        <div style="overflow-x:auto">
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:0; background:var(--surface-1); border:1px solid var(--border); border-radius:10px; overflow:hidden">
            <div class="irr-hdr">Base Form</div>
            <div class="irr-hdr">Simple Past</div>
            <div class="irr-hdr">Past Participle</div>
            <div class="irr-hdr">Traduction</div>
            @for (v of irregularVerbs; track v.base) {
              <div class="irr-cell">{{ v.base }}</div>
              <div class="irr-cell">{{ v.past }}</div>
              <div class="irr-cell">{{ v.pp }}</div>
              <div class="irr-cell" style="color:var(--text-muted); font-style:italic">{{ v.fr }}</div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dict-result-card { border:1.5px solid #C7D2FE; background:linear-gradient(to bottom, #F8F9FF, #FFF); }

    .speak-btn {
      background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 8px;
      color: #4F46E5; cursor: pointer; padding: 5px 10px; font-size: 12px;
      display: inline-flex; align-items: center; gap: 4px; transition: all 0.15s;
    }
    .speak-btn:hover { background: #4F46E5; color: white; }

    .pos-badge {
      background: #EEF2FF; color: #4F46E5; font-size: 11px; font-weight: 700;
      padding: 2px 10px; border-radius: 20px; text-transform: capitalize;
    }

    .def-item {
      display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px;
    }

    .def-num {
      min-width: 20px; height: 20px; background: #4F46E5; color: white;
      border-radius: 50%; font-size: 10px; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;
    }

    .saved-word-card {
      display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px;
      background: var(--surface-1); border: 1px solid var(--border); border-radius: 10px;
      transition: border-color 0.15s;
    }
    .saved-word-card:hover { border-color: #4F46E5; }

    .irr-hdr {
      background: var(--surface-2); font-size: 11px; font-weight: 700;
      color: var(--text-muted); text-transform: uppercase; padding: 10px 14px;
      border-bottom: 1px solid var(--border);
    }
    .irr-cell {
      font-size: 12px; color: var(--text-primary); padding: 8px 14px;
      border-bottom: 1px solid var(--border-weak); font-weight: 500;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class StudentDictionaryComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  currentUser = signal<UserProfile | null>(null);
  savedWords = signal<DictionaryWord[]>([]);
  viewTab = signal<'saved' | 'base' | 'irregular'>('base');

  searchQuery = '';
  searchLanguage = signal<'en' | 'fr'>('en');
  isSearching = signal<boolean>(false);
  apiResult = signal<ApiDictResult | null>(null);
  searchError = signal<string | null>(null);
  searchHistory = signal<string[]>([]);
  currentTranslation = '';

  quickWordsEn = ['Perseverance', 'Eloquent', 'Ambiguous', 'Resilience', 'Phenomenon', 'Diligent'];
  quickWordsFr = ['sauver', 'parler', 'apprendre', 'comprendre', 'écrire', 'lire'];

  constructor() {
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
    this.db.observeDictionary().subscribe(list => this.savedWords.set(list));
  }

  myWords = computed<DictionaryWord[]>(() => {
    const user = this.currentUser();
    return this.savedWords().filter(w => w.userId === user?.id || w.userId === 'student');
  });

  sortedMyWords = computed<DictionaryWord[]>(() => {
    return [...this.myWords()].sort((a, b) => a.word.localeCompare(b.word));
  });

  myWordsCount = computed(() => this.myWords().length);
  masteryLevel = computed(() => {
    const c = this.myWordsCount();
    if (c >= 100) return 'Expert';
    if (c >= 50) return 'Advanced';
    if (c >= 20) return 'Intermediate';
    return 'Beginner';
  });

  async searchWord() {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) return;

    this.isSearching.set(true);
    this.apiResult.set(null);
    this.searchError.set(null);

    // 1. Search locally in our preloaded words first (both languages)
    const localMatch = this.baseDictionaryWords.find(w => {
      if (this.searchLanguage() === 'fr') {
        return w.translation.toLowerCase() === query || 
               w.translation.toLowerCase().includes(query) || 
               query.includes(w.translation.toLowerCase());
      } else {
        return w.word.toLowerCase() === query;
      }
    });

    if (localMatch) {
      const result: ApiDictResult = {
        word: localMatch.word,
        phonetic: localMatch.phonetic,
        meanings: [
          {
            partOfSpeech: localMatch.partOfSpeech,
            definitions: [
              {
                definition: localMatch.definition,
                example: localMatch.contexts?.[0]
              }
            ]
          }
        ]
      };
      this.apiResult.set(result);
      this.currentTranslation = localMatch.translation;
      this.isSearching.set(false);

      // Add to search history
      const hist = this.searchHistory();
      if (!hist.includes(this.searchQuery)) {
        this.searchHistory.set([this.searchQuery, ...hist].slice(0, 20));
      }
      return;
    }

    // 2. If searching French and not found in local list
    if (this.searchLanguage() === 'fr') {
      this.searchError.set(`Le mot français "${this.searchQuery}" n'a pas été trouvé dans notre dictionnaire de base. Essayez des mots comme: école, parler, enseignant, livre, devoir, etc.`);
      this.isSearching.set(false);
      return;
    }

    // 3. Fallback online search for English words
    try {
      const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`;
      const res = await fetch(url);

      if (!res.ok) {
        this.searchError.set(`"${this.searchQuery}" n'a pas été trouvé dans le dictionnaire. Vérifiez l'orthographe.`);
        return;
      }

      const data: ApiDictResult[] = await res.json();
      if (data && data.length > 0) {
        this.apiResult.set(data[0]);
        this.currentTranslation = ''; // reset translation input
        
        // Add to search history
        const hist = this.searchHistory();
        if (!hist.includes(this.searchQuery)) {
          this.searchHistory.set([this.searchQuery, ...hist].slice(0, 20));
        }
      } else {
        this.searchError.set(`Aucune définition trouvée pour "${this.searchQuery}".`);
      }
    } catch (e) {
      this.searchError.set('Erreur réseau. Vérifiez votre connexion internet et réessayez.');
    } finally {
      this.isSearching.set(false);
    }
  }

  quickSearch(word: string) {
    this.searchQuery = word;
    this.searchWord();
  }

  getPhonetic(result: ApiDictResult): string {
    if (result.phonetic) return result.phonetic;
    return result.phonetics?.find(p => p.text)?.text || '';
  }

  getAudio(result: ApiDictResult): string {
    return result.phonetics?.find(p => p.audio && p.audio.trim())?.audio || '';
  }

  playAudio(result: ApiDictResult) {
    const audioUrl = this.getAudio(result);
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => this.speakWord(result.word));
    } else {
      this.speakWord(result.word);
    }
  }

  speakWord(word: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  }

  async saveCurrentWord() {
    const result = this.apiResult();
    const user = this.currentUser();
    if (!result || !user) return;

    // Check if already saved
    const exists = this.myWords().some(w => w.word.toLowerCase() === result.word.toLowerCase());
    if (exists) {
      this.dialogService.alert('Already Saved', `"${result.word}" is already in your vocabulary list.`, 'info');
      return;
    }

    const firstMeaning = result.meanings?.[0];
    const firstDef = firstMeaning?.definitions?.[0];

    const wordData: Omit<DictionaryWord, 'id'> = {
      word: result.word,
      partOfSpeech: firstMeaning?.partOfSpeech || 'word',
      translation: this.currentTranslation.trim(),
      definition: firstDef?.definition || '',
      phonetic: this.getPhonetic(result),
      contexts: firstDef?.example ? [`"${firstDef.example}"`] : [],
      userId: user.id,
      savedAt: new Date().toISOString()
    };

    await this.db.addWordToDictionary(wordData);
    this.dialogService.alert('Saved!', `"${result.word}" has been added to your vocabulary.`, 'success');
  }

  async savePreloadedWord(word: any) {
    const user = this.currentUser();
    if (!user) return;

    // Check if already saved
    const exists = this.myWords().some(w => w.word.toLowerCase() === word.word.toLowerCase());
    if (exists) {
      this.dialogService.alert('Déjà enregistré', `"${word.word}" est déjà dans votre liste de vocabulaire personnel.`, 'info');
      return;
    }

    const wordData: Omit<DictionaryWord, 'id'> = {
      word: word.word,
      partOfSpeech: word.partOfSpeech,
      translation: word.translation,
      definition: word.definition,
      phonetic: word.phonetic,
      contexts: word.contexts || [],
      userId: user.id,
      savedAt: new Date().toISOString()
    };

    await this.db.addWordToDictionary(wordData);
    this.dialogService.alert('Enregistré !', `"${word.word}" a été ajouté à votre liste de vocabulaire personnel.`, 'success');
  }

  deleteWord(id: string) {
    this.db.deleteWordFromDictionary(id);
  }

  irregularVerbs = [
    { base: 'be', past: 'was/were', pp: 'been', fr: 'être' },
    { base: 'begin', past: 'began', pp: 'begun', fr: 'commencer' },
    { base: 'break', past: 'broke', pp: 'broken', fr: 'casser' },
    { base: 'bring', past: 'brought', pp: 'brought', fr: 'apporter' },
    { base: 'build', past: 'built', pp: 'built', fr: 'construire' },
    { base: 'buy', past: 'bought', pp: 'bought', fr: 'acheter' },
    { base: 'catch', past: 'caught', pp: 'caught', fr: 'attraper' },
    { base: 'choose', past: 'chose', pp: 'chosen', fr: 'choisir' },
    { base: 'come', past: 'came', pp: 'come', fr: 'venir' },
    { base: 'do', past: 'did', pp: 'done', fr: 'faire' },
    { base: 'drink', past: 'drank', pp: 'drunk', fr: 'boire' },
    { base: 'drive', past: 'drove', pp: 'driven', fr: 'conduire' },
    { base: 'eat', past: 'ate', pp: 'eaten', fr: 'manger' },
    { base: 'fall', past: 'fell', pp: 'fallen', fr: 'tomber' },
    { base: 'feel', past: 'felt', pp: 'felt', fr: 'ressentir' },
    { base: 'find', past: 'found', pp: 'found', fr: 'trouver' },
    { base: 'fly', past: 'flew', pp: 'flown', fr: 'voler' },
    { base: 'forget', past: 'forgot', pp: 'forgotten', fr: 'oublier' },
    { base: 'get', past: 'got', pp: 'gotten/got', fr: 'obtenir' },
    { base: 'give', past: 'gave', pp: 'given', fr: 'donner' },
    { base: 'go', past: 'went', pp: 'gone', fr: 'aller' },
    { base: 'grow', past: 'grew', pp: 'grown', fr: 'grandir' },
    { base: 'have', past: 'had', pp: 'had', fr: 'avoir' },
    { base: 'hear', past: 'heard', pp: 'heard', fr: 'entendre' },
    { base: 'know', past: 'knew', pp: 'known', fr: 'savoir' },
    { base: 'leave', past: 'left', pp: 'left', fr: 'partir/quitter' },
    { base: 'lose', past: 'lost', pp: 'lost', fr: 'perdre' },
    { base: 'make', past: 'made', pp: 'made', fr: 'faire/fabriquer' },
    { base: 'meet', past: 'met', pp: 'met', fr: 'rencontrer' },
    { base: 'read', past: 'read', pp: 'read', fr: 'lire' },
    { base: 'run', past: 'ran', pp: 'run', fr: 'courir' },
    { base: 'see', past: 'saw', pp: 'seen', fr: 'voir' },
    { base: 'send', past: 'sent', pp: 'sent', fr: 'envoyer' },
    { base: 'speak', past: 'spoke', pp: 'spoken', fr: 'parler' },
    { base: 'take', past: 'took', pp: 'taken', fr: 'prendre' },
    { base: 'tell', past: 'told', pp: 'told', fr: 'dire/raconter' },
    { base: 'think', past: 'thought', pp: 'thought', fr: 'penser' },
    { base: 'understand', past: 'understood', pp: 'understood', fr: 'comprendre' },
    { base: 'wake', past: 'woke', pp: 'woken', fr: 'réveiller' },
    { base: 'write', past: 'wrote', pp: 'written', fr: 'écrire' },
  ];

  baseDictionaryWords = [
    { word: 'Resilience', partOfSpeech: 'noun', translation: 'Résilience', definition: 'The capacity to recover quickly from difficulties; toughness.', phonetic: '/rɪˈzɪl.jəns/', contexts: ['Sa résilience l\'a aidée à surmonter le défi.'] },
    { word: 'Perseverance', partOfSpeech: 'noun', translation: 'Persévérance', definition: 'Persistence in doing something despite difficulty or delay in achieving success.', phonetic: '/ˌpɜː.sɪˈvɪə.rəns/', contexts: ['Through hard work and perseverance, he passed the exam.'] },
    { word: 'Eloquent', partOfSpeech: 'adjective', translation: 'Éloquent', definition: 'Fluent or persuasive in speaking or writing.', phonetic: '/ˈel.ə.kwənt/', contexts: ['She made an eloquent speech at the graduation.'] },
    { word: 'Ambiguous', partOfSpeech: 'adjective', translation: 'Ambigu', definition: 'Open to more than one interpretation; not having one obvious meaning.', phonetic: '/æmˈbɪɡ.ju.əs/', contexts: ['His answer was ambiguous, so we asked for clarification.'] },
    { word: 'Diligent', partOfSpeech: 'adjective', translation: 'Diligent / Assidu', definition: 'Having or showing care and conscientiousness in one\'s work or studies.', phonetic: '/ˈdɪl.ɪ.dʒənt/', contexts: ['A diligent student always finishes homework on time.'] },
    { word: 'Phenomenon', partOfSpeech: 'noun', translation: 'Phénomène', definition: 'A fact or situation that is observed to exist or happen, especially one whose cause is in question.', phonetic: '/fəˈnɒm.ɪ.nən/', contexts: ['Glaciers are a natural phenomenon.'] },
    { word: 'School', partOfSpeech: 'noun', translation: 'École', definition: 'An institution for educating children or students.', phonetic: '/skuːl/', contexts: ['We go to school every weekday.'] },
    { word: 'Teacher', partOfSpeech: 'noun', translation: 'Enseignant / Professeur', definition: 'A person who helps students to acquire knowledge or skills.', phonetic: '/ˈtiː.tʃər/', contexts: ['The English teacher explains grammar very clearly.'] },
    { word: 'Student', partOfSpeech: 'noun', translation: 'Étudiant / Élève', definition: 'A person who is studying at a school or college.', phonetic: '/ˈstjuː.dənt/', contexts: ['She is an outstanding student who loves reading.'] },
    { word: 'Lesson', partOfSpeech: 'noun', translation: 'Leçon / Cours', definition: 'A period of learning or teaching; a block of educational instruction.', phonetic: '/ˈles.ən/', contexts: ['Today\'s lesson is about reported speech.'] },
    { word: 'Vocabulary', partOfSpeech: 'noun', translation: 'Vocabulaire', definition: 'The body of words used in a particular language or activity.', phonetic: '/vəˈkæb.jə.ler.i/', contexts: ['Playing games helps you expand your English vocabulary.'] },
    { word: 'Grammar', partOfSpeech: 'noun', translation: 'Grammaire', definition: 'The whole system and structure of a language.', phonetic: '/ˈɡræm.ər/', contexts: ['Grammar rules help us form correct sentences.'] },
    { word: 'Pronunciation', partOfSpeech: 'noun', translation: 'Prononciation', definition: 'The way in which a word is pronounced.', phonetic: '/prəˌnʌn.siˈeɪ.ʃən/', contexts: ['Listen carefully to the audio to improve your pronunciation.'] },
    { word: 'Understand', partOfSpeech: 'verb', translation: 'Comprendre', definition: 'Perceive the intended meaning of words, language, or information.', phonetic: '/ˌʌn.dəˈstænd/', contexts: ['Do you understand this difficult concept?'] },
    { word: 'Speak', partOfSpeech: 'verb', translation: 'Parler', definition: 'Say something in order to convey information or express feelings.', phonetic: '/spiːk/', contexts: ['I want to speak English fluently.'] },
    { word: 'Write', partOfSpeech: 'verb', translation: 'Écrire', definition: 'Mark letters or words on a surface, typically paper or screen.', phonetic: '/raɪt/', contexts: ['Please write your answer in the notebook.'] },
    { word: 'Read', partOfSpeech: 'verb', translation: 'Lire', definition: 'Look at and comprehend the meaning of written or printed matter.', phonetic: '/riːd/', contexts: ['Reading ebooks is a great way to study.'] },
    { word: 'Homework', partOfSpeech: 'noun', translation: 'Devoir', definition: 'Schoolwork that a student is given to do at home.', phonetic: '/ˈhəʊm.wɜːk/', contexts: ['The homework is due by next Friday.'] },
    { word: 'Exam', partOfSpeech: 'noun', translation: 'Examen', definition: 'A formal test of a person\'s knowledge or proficiency in a subject.', phonetic: '/ɪɡˈzæm/', contexts: ['Prepare well for the final exam.'] },
    { word: 'Success', partOfSpeech: 'noun', translation: 'Succès / Réussite', definition: 'The accomplishment of an aim or purpose.', phonetic: '/səkˈses/', contexts: ['Practice is the key to language success.'] },
    { word: 'Challenge', partOfSpeech: 'noun / verb', translation: 'Défi', definition: 'A call to take part in a contest or solve a difficult task.', phonetic: '/ˈtʃæl.ɪndʒ/', contexts: ['Learning English is a challenge, but it is rewarding.'] },
    { word: 'Opportunity', partOfSpeech: 'noun', translation: 'Opportunité', definition: 'A set of circumstances that makes it possible to do something.', phonetic: '/ˌɒp.əˈtʃuː.nə.ti/', contexts: ['Studying here is a great opportunity to practice speaking.'] },
    { word: 'Knowledge', partOfSpeech: 'noun', translation: 'Connaissance', definition: 'Facts, information, and skills acquired through experience or education.', phonetic: '/ˈnɒl.ɪdʒ/', contexts: ['He has a vast knowledge of English literature.'] },
    { word: 'Practice', partOfSpeech: 'noun / verb', translation: 'Pratique / S\'exercer', definition: 'Perform an activity repeatedly to improve or maintain proficiency.', phonetic: '/ˈpræk.tɪs/', contexts: ['Daily speaking practice makes a big difference.'] },
    { word: 'Improve', partOfSpeech: 'verb', translation: 'Améliorer', definition: 'Make or become better.', phonetic: '/ɪmˈpruːv/', contexts: ['We want to improve our listening comprehension.'] },
    { word: 'Fluent', partOfSpeech: 'adjective', translation: 'Courant', definition: 'Able to express oneself easily and articulately.', phonetic: '/ˈfluː.ənt/', contexts: ['She speaks fluent English and French.'] },
    { word: 'Conversation', partOfSpeech: 'noun', translation: 'Conversation', definition: 'An informal talk involving two or more people.', phonetic: '/ˌkɒn.vəˈseɪ.ʃən/', contexts: ['They had an interesting conversation about food.'] },
    { word: 'Water', partOfSpeech: 'noun', translation: 'Eau', definition: 'A colorless, transparent liquid essential for life.', phonetic: '/ˈwɔː.tər/', contexts: ['Drink some water to refresh yourself.'] },
    { word: 'Book', partOfSpeech: 'noun', translation: 'Livre', definition: 'A written or printed work consisting of pages bound together.', phonetic: '/bʊk/', contexts: ['This dictionary book contains many useful terms.'] },
    { word: 'Friend', partOfSpeech: 'noun', translation: 'Ami', definition: 'A person with whom one has a bond of mutual affection.', phonetic: '/frend/', contexts: ['He introduced me to his best friend from class.'] }
  ];
}