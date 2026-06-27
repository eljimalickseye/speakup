import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

interface VocabularyWord {
  id?: string;
  word: string;
  definition: string;
  example: string;
  context: string;
  level: string;
  userId: string;
  userName: string;
  createdAt: string;
}

@Component({
  selector: 'app-student-dictionary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <!-- Header with stats -->
      <div class="grid3">
        <div class="mcard">
          <div class="mlabel">My Vocabulary</div>
          <div class="mval" style="color:#4F46E5">{{ myWords().length }}</div>
          <div class="msub">Words learned</div>
        </div>
        <div class="mcard">
          <div class="mlabel">This Week</div>
          <div class="mval" style="color:#10B981">{{ weeklyWords() }}</div>
          <div class="msub">New words added</div>
        </div>
        <div class="mcard">
          <div class="mlabel">Mastery Level</div>
          <div class="mval" style="color:#D97706">{{ masteryLevel() }}</div>
          <div class="msub">Keep learning!</div>
        </div>
      </div>

      <!-- Add new word card -->
      <div class="card" style="margin-top:16px">
        <h3 class="st" style="font-size:15px; margin-bottom:12px; color:#4F46E5">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px; vertical-align:middle">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          Add New Word
        </h3>
        
        <div style="display:flex; gap:12px; flex-wrap:wrap">
          <div class="input-row" style="flex:1; min-width:150px; margin-bottom:0">
            <label style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px; display:block">Word</label>
            <input [(ngModel)]="newWord" placeholder="e.g., Serendipity" class="form-input" style="height:38px; font-size:13px; width:100%; border:1px solid var(--border); border-radius:6px; padding:0 10px; background:var(--surface-1); color:var(--text-primary)" />
          </div>

          <div class="input-row" style="flex:2; min-width:200px; margin-bottom:0">
            <label style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px; display:block">Definition</label>
            <input [(ngModel)]="newDefinition" placeholder="Definition of the word" class="form-input" style="height:38px; font-size:13px; width:100%; border:1px solid var(--border); border-radius:6px; padding:0 10px; background:var(--surface-1); color:var(--text-primary)" />
          </div>

          <div class="input-row" style="flex:2; min-width:200px; margin-bottom:0">
            <label style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px; display:block">Example Sentence</label>
            <input [(ngModel)]="newExample" placeholder="Use the word in a sentence" class="form-input" style="height:38px; font-size:13px; width:100%; border:1px solid var(--border); border-radius:6px; padding:0 10px; background:var(--surface-1); color:var(--text-primary)" />
          </div>

          <div class="input-row" style="flex:1.5; min-width:150px; margin-bottom:0">
            <label style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px; display:block">Context</label>
            <select [(ngModel)]="newContext" class="form-select" style="height:38px; font-size:13px; width:100%; border:1px solid var(--border); border-radius:6px; padding:0 10px; background:var(--surface-1); color:var(--text-primary)">
              <option value="General">General</option>
              <option value="Academic">Academic</option>
              <option value="Business">Business</option>
              <option value="Travel">Travel</option>
              <option value="Technology">Technology</option>
              <option value="Health">Health</option>
            </select>
          </div>

          <div style="display:flex; align-items:flex-end">
            <button class="btn-p" [disabled]="!newWord || !newDefinition" (click)="addWord()" style="height:38px; padding:0 20px; font-weight:600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:6px">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add Word
            </button>
          </div>
        </div>
      </div>

      <!-- Search and filter -->
      <div class="card" style="margin-top:16px">
        <div style="display:flex; gap:12px; margin-bottom:16px; flex-wrap:wrap">
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Search vocabulary..." 
            class="form-input" 
            style="flex:1; min-width:200px; height:36px; font-size:13px; border:1px solid var(--border); border-radius:6px; padding:0 12px; background:var(--surface-1); color:var(--text-primary)" 
          />
          <select [(ngModel)]="filterContext" class="form-select" style="height:36px; font-size:13px; border:1px solid var(--border); border-radius:6px; padding:0 12px; background:var(--surface-1); color:var(--text-primary)">
            <option value="All">All Contexts</option>
            <option value="General">General</option>
            <option value="Academic">Academic</option>
            <option value="Business">Business</option>
            <option value="Travel">Travel</option>
            <option value="Technology">Technology</option>
            <option value="Health">Health</option>
          </select>
        </div>

        <!-- Vocabulary list -->
        @if (filteredWords().length === 0) {
          <div style="text-align:center; padding:40px 20px; color:var(--text-muted)">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:12px; opacity:0.5">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <p style="font-size:14px; font-weight:600; color:var(--text-primary); margin-bottom:4px">No words yet</p>
            <p style="font-size:12px">Start building your vocabulary by adding your first word!</p>
          </div>
        } @else {
          <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:12px">
            @for (word of filteredWords(); track word.id) {
              <div class="word-card" style="background:var(--surface-2); border:1px solid var(--border-weak); border-radius:10px; padding:14px; transition:all 0.2s">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px">
                  <div>
                    <h4 style="font-size:16px; font-weight:700; color:var(--text-primary); margin:0 0 4px 0">{{ word.word }}</h4>
                    <span class="context-badge" [class]="getContextClass(word.context)">{{ word.context }}</span>
                  </div>
                  <button (click)="deleteWord(word.id)" style="background:none; border:none; color:#EF4444; cursor:pointer; padding:4px; opacity:0.6; transition:opacity 0.15s" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                
                <p style="font-size:13px; color:var(--text-secondary); margin:8px 0; line-height:1.4">{{ word.definition }}</p>
                
                <div style="background:var(--surface-1); border-left:3px solid #4F46E5; padding:8px 10px; border-radius:4px; margin-top:8px">
                  <p style="font-size:12px; color:var(--text-muted); font-style:italic; margin:0">"{{ word.example }}"</p>
                </div>

                <div style="font-size:10px; color:var(--text-muted); margin-top:8px; text-align:right">
                  Added {{ word.createdAt | date:'shortDate' }}
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .word-card:hover {
      border-color: #4F46E5 !important;
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.1);
    }

    .context-badge {
      display:inline-block;
      font-size:10px;
      font-weight:600;
      padding:2px 8px;
      border-radius:12px;
      text-transform:uppercase;
      letter-spacing:0.3px;
    }

    .context-badge.General { background:#EEF2FF; color:#4F46E5; }
    .context-badge.Academic { background:#FEF3C7; color:#D97706; }
    .context-badge.Business { background:#D1FAE5; color:#065F46; }
    .context-badge.Travel { background:#DBEAFE; color:#1E40AF; }
    .context-badge.Technology { background:#F3E8FF; color:#7C3AED; }
    .context-badge.Health { background: #FEE2E2; color: #DC2626; }
  `]
})
export class StudentDictionaryComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  myWords = signal<VocabularyWord[]>([]);
  
  // Form fields
  newWord = '';
  newDefinition = '';
  newExample = '';
  newContext = 'General';
  searchQuery = '';
  filterContext = 'All';

  constructor() {
    this.loadMyWords();
  }

  private loadMyWords() {
    // Load vocabulary words for current user
    // This would connect to Firebase in production
    this.myWords.set([]);
  }

  addWord() {
    if (!this.newWord || !this.newDefinition) return;

    const user = this.db as any;
    const currentUser = user.observeCurrentUser()?.getValue?.() || { id: 'user1', name: 'Student' };

    const word: VocabularyWord = {
      id: Math.random().toString(36).substring(7),
      word: this.newWord,
      definition: this.newDefinition,
      example: this.newExample,
      context: this.newContext,
      level: currentUser.level || 'Beginner',
      userId: currentUser.id,
      userName: currentUser.name,
      createdAt: new Date().toISOString()
    };

    // Add to database
    // await this.db.addVocabularyWord(word);
    
    this.myWords.update(words => [word, ...words]);
    this.dialogService.alert('Success', `Word "${this.newWord}" added to your vocabulary!`, 'success');

    // Reset form
    this.newWord = '';
    this.newDefinition = '';
    this.newExample = '';
    this.newContext = 'General';
  }

  deleteWord(wordId?: string) {
    if (!wordId) return;
    
    this.dialogService.show({
      title: 'Delete Word',
      message: 'Are you sure you want to remove this word from your vocabulary?',
      type: 'confirm',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: () => {
        this.myWords.update(words => words.filter(w => w.id !== wordId));
        this.dialogService.alert('Deleted', 'Word removed from vocabulary.', 'success');
      }
    });
  }

  filteredWords = computed(() => {
    let words = this.myWords();
    
    // Filter by context
    if (this.filterContext !== 'All') {
      words = words.filter(w => w.context === this.filterContext);
    }
    
    // Filter by search query
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      words = words.filter(w => 
        w.word.toLowerCase().includes(query) ||
        w.definition.toLowerCase().includes(query) ||
        w.example.toLowerCase().includes(query)
      );
    }
    
    return words;
  });

  weeklyWords = computed(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return this.myWords().filter(w => new Date(w.createdAt) > oneWeekAgo).length;
  });

  masteryLevel = computed(() => {
    const count = this.myWords().length;
    if (count < 10) return 'Beginner';
    if (count < 30) return 'Intermediate';
    if (count < 60) return 'Advanced';
    return 'Expert';
  });

  getContextClass(context: string): string {
    const classes: { [key: string]: string } = {
      'General': 'General',
      'Academic': 'Academic',
      'Business': 'Business',
      'Travel': 'Travel',
      'Technology': 'Technology',
      'Health': 'Health'
    };
    return classes[context] || 'General';
  }
}