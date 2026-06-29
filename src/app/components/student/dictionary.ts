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
          <div class="mlabel" style="color:#4338CA">Mon Carnet</div>
          <div class="mval" style="color:#4F46E5">{{ myWordsCount() }}</div>
          <div class="msub" style="color:#4338CA">Mots sauvegardés</div>
        </div>
        <div class="mcard" style="background:linear-gradient(135deg,#ECFDF5,#D1FAE5); border:1px solid #A7F3D0">
          <div class="mlabel" style="color:#047857">Définitions trouvées</div>
          <div class="mval" style="color:#10B981">{{ searchHistory().length }}</div>
          <div class="msub" style="color:#047857">Recherches ce mois</div>
        </div>
        <div class="mcard" style="background:linear-gradient(135deg,#FFFBEB,#FEF3C7); border:1px solid #FDE68A">
          <div class="mlabel" style="color:#B45309">Niveau Vocabulaire</div>
          <div class="mval" style="color:#D97706">{{ masteryLevel() }}</div>
          <div class="msub" style="color:#B45309">Rang de maîtrise</div>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="card" style="border:1.5px solid #C7D2FE; background:#F8F9FF; padding:18px">
        <h3 class="st" style="font-size:15px; margin-bottom:12px; color:#4F46E5; display:flex; align-items:center; gap:8px">
          <i class="ti ti-search"></i> Recherche dans le dictionnaire
        </h3>
        <div style="display:flex; gap:8px; flex-wrap:wrap">
          <div style="position:relative; flex:1; min-width:200px">
            <i class="ti ti-letter-case" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:14px"></i>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Rechercher un mot en anglais..."
              style="height:40px; width:100%; padding:0 12px 0 32px; border:1px solid var(--border); border-radius:8px; font-size:13px; background:#FFF; color:var(--text-primary)"
              (keyup.enter)="searchWord()"
            />
          </div>
          <button class="btn-p" style="height:40px; padding:0 20px; font-size:13px" [disabled]="!searchQuery.trim() || isSearching()" (click)="searchWord()">
            @if (isSearching()) { <span>Recherche...</span> } @else { <i class="ti ti-search"></i> Chercher }
          </button>
          @if (apiResult()) {
            <button class="btn-s" style="height:40px; padding:0 16px; font-size:12px; border-color:#059669; color:#059669" (click)="saveCurrentWord()">
              <i class="ti ti-bookmark"></i> Sauvegarder
            </button>
          }
        </div>

        <!-- Quick searches -->
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:10px">
          <span style="font-size:10px; color:var(--text-muted); font-weight:600">Rapide :</span>
          @for (word of quickWords; track word) {
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
        <button class="tab" [class.active]="viewTab() === 'saved'" (click)="viewTab.set('saved')">
          <i class="ti ti-bookmark"></i> Mes mots sauvegardés ({{ myWordsCount() }})
        </button>
        <button class="tab" [class.active]="viewTab() === 'irregular'" (click)="viewTab.set('irregular')">
          📋 Verbes irréguliers
        </button>
      </div>

      <!-- Saved Words -->
      @if (viewTab() === 'saved') {
        @if (myWords().length === 0) {
          <div style="text-align:center; padding:40px; border:1px dashed var(--border); border-radius:12px">
            <i class="ti ti-bookmark" style="font-size:40px; color:var(--text-muted); display:block; margin-bottom:12px"></i>
            <p style="font-size:13px; color:var(--text-muted)">Aucun mot sauvegardé. Recherchez des mots et sauvegardez-les !</p>
          </div>
        }
        <div style="display:flex; flex-direction:column; gap:8px">
          @for (word of myWords(); track word.id) {
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
  viewTab = signal<'saved' | 'irregular'>('saved');

  searchQuery = '';
  isSearching = signal<boolean>(false);
  apiResult = signal<ApiDictResult | null>(null);
  searchError = signal<string | null>(null);
  searchHistory = signal<string[]>([]);

  quickWords = ['Perseverance', 'Eloquent', 'Ambiguous', 'Resilience', 'Phenomenon', 'Diligent'];

  constructor() {
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
    this.db.observeDictionary().subscribe(list => this.savedWords.set(list));
  }

  myWords = computed<DictionaryWord[]>(() => {
    const user = this.currentUser();
    return this.savedWords().filter(w => w.userId === user?.id || w.userId === 'student');
  });

  myWordsCount = computed(() => this.myWords().length);
  masteryLevel = computed(() => {
    const c = this.myWordsCount();
    if (c >= 100) return 'Expert';
    if (c >= 50) return 'Avancé';
    if (c >= 20) return 'Intermédiaire';
    return 'Débutant';
  });

  async searchWord() {
    const query = this.searchQuery.trim();
    if (!query) return;

    this.isSearching.set(true);
    this.apiResult.set(null);
    this.searchError.set(null);

    try {
      const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`;
      const res = await fetch(url);

      if (!res.ok) {
        this.searchError.set(`"${query}" n'a pas été trouvé dans le dictionnaire. Vérifiez l'orthographe.`);
        return;
      }

      const data: ApiDictResult[] = await res.json();
      if (data && data.length > 0) {
        this.apiResult.set(data[0]);
        // Add to search history
        const hist = this.searchHistory();
        if (!hist.includes(query)) {
          this.searchHistory.set([query, ...hist].slice(0, 20));
        }
      } else {
        this.searchError.set(`Aucune définition trouvée pour "${query}".`);
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

    const firstMeaning = result.meanings?.[0];
    const firstDef = firstMeaning?.definitions?.[0];

    const wordData: Omit<DictionaryWord, 'id'> = {
      word: result.word,
      partOfSpeech: firstMeaning?.partOfSpeech || 'word',
      translation: '',
      definition: firstDef?.definition || '',
      phonetic: this.getPhonetic(result),
      contexts: firstDef?.example ? [`"${firstDef.example}"`] : [],
      userId: user.id,
      savedAt: new Date().toISOString()
    };

    await this.db.addWordToDictionary(wordData);
    this.dialogService.alert('Sauvegardé !', `"${result.word}" ajouté à votre carnet.`, 'success');
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
}