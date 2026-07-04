import os

file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\student\exercises.ts'

# Load the file content
with open(file_path, 'rb') as f:
    raw_bytes = f.read()

content = raw_bytes.decode('utf-8').replace('\r\n', '\n')

# 1. Update getExerciseEmoji / getExerciseLabel section to add getExerciseSvg
old_emoji_methods = """  getExerciseEmoji(type: string): string {
    const map: Record<string, string> = {
      writing: '✍️', speaking: '🎙️', listening: '👂',
      translation: '🌍', pronunciation: '🔊', vocabulary: '📚'
    };
    return map[type] || '🎯';
  }"""

new_emoji_methods = """  getExerciseEmoji(type: string): string {
    const map: Record<string, string> = {
      writing: '✍️', speaking: '🎙️', listening: '👂',
      translation: '🌍', pronunciation: '🔊', vocabulary: '📚'
    };
    return map[type] || '🎯';
  }

  getExerciseSvg(type: string): string {
    const map: Record<string, string> = {
      writing: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
      speaking: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>',
      listening: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
      translation: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>',
      pronunciation: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>',
      vocabulary: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z"/></svg>'
    };
    return map[type] || '';
  }"""

content = content.replace(old_emoji_methods, new_emoji_methods)

# 2. Update exercises list cards template to use [innerHTML]="getExerciseSvg(ex.type)" instead of emojis
old_exercise_emoji_span = """                      <div style="margin-bottom:12px; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center;"
                           [style.background]="getExerciseColor(ex.type) + '15'"
                           [style.border]="'1px solid ' + getExerciseColor(ex.type) + '40'">
                        <span style="font-size: 20px;">{{ getExerciseEmoji(ex.type) }}</span>
                      </div>"""

new_exercise_emoji_span = """                      <div style="margin-bottom:12px; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center;"
                           [style.background]="getExerciseColor(ex.type) + '15'"
                           [style.border]="'1px solid ' + getExerciseColor(ex.type) + '40'">
                        <span style="display:flex; align-items:center" [innerHTML]="getExerciseSvg(ex.type)"></span>
                      </div>"""

content = content.replace(old_exercise_emoji_span, new_exercise_emoji_span)

# 3. Inject CSS animations style block and signals inside class for Word Builder
old_class_start = "export class StudentExercisesComponent implements OnInit, OnDestroy {"
new_signals = """export class StudentExercisesComponent implements OnInit, OnDestroy {
  isWordBuilderWiggling = signal<boolean>(false);
  isWordBuilderSuccess = signal<boolean>(false);

  getTargetWordChars(): string[] {
    const currentWordObj = this.activeWords()[this.wordBuilderIdx()];
    if (!currentWordObj) return [];
    return currentWordObj.word.toLowerCase().replace(/\s/g, '').split('');
  }"""

content = content.replace(old_class_start, new_signals)

# 4. Modify clickScrambledLetter implementation
old_click_scrambled = """  clickScrambledLetter(char: string, sIdx: number) {
    this.selectedLetters.update(sel => [...sel, char]);
    this.scrambledLetters.update(scr => scr.filter((_, idx) => idx !== sIdx));

    const currentWordObj = this.activeWords()[this.wordBuilderIdx()];
    if (!currentWordObj) return;
    
    // Check spelling correctness progressively
    const targetWordClean = currentWordObj.word.toLowerCase().replace(/\s/g, '');
    const currentIndex = this.selectedLetters().length - 1;
    if (char !== targetWordClean[currentIndex]) {
      this.recordMistake(currentWordObj);
      this.playErrorSound();
    }

    const spellStr = this.selectedLetters().join('');
    if (spellStr === targetWordClean) {
      this.playSuccessSound();
      setTimeout(() => {
        if (this.wordBuilderIdx() + 1 === this.activeWords().length) {
          this.gameFinished.set(true);
          this.finishVocabGame();
        } else {
          this.wordBuilderIdx.update(i => i + 1);
          this.setupWordBuilder(this.wordBuilderIdx());
          this.startWordTimer();
        }
      }, 800);
    }
  }"""

new_click_scrambled = """  clickScrambledLetter(char: string, sIdx: number) {
    const currentWordObj = this.activeWords()[this.wordBuilderIdx()];
    if (!currentWordObj) return;

    const targetWordClean = currentWordObj.word.toLowerCase().replace(/\s/g, '');
    const currentIndex = this.selectedLetters().length;

    if (char === targetWordClean[currentIndex]) {
      this.selectedLetters.update(sel => [...sel, char]);
      this.scrambledLetters.update(scr => scr.filter((_, idx) => idx !== sIdx));
      this.playSuccessSound();

      const spellStr = this.selectedLetters().join('');
      if (spellStr === targetWordClean) {
        this.isWordBuilderSuccess.set(true);
        setTimeout(() => {
          this.isWordBuilderSuccess.set(false);
          if (this.wordBuilderIdx() + 1 === this.activeWords().length) {
            this.gameFinished.set(true);
            this.finishVocabGame();
          } else {
            this.wordBuilderIdx.update(i => i + 1);
            this.setupWordBuilder(this.wordBuilderIdx());
            this.startWordTimer();
          }
        }, 800);
      }
    } else {
      this.recordMistake(currentWordObj);
      this.playErrorSound();
      this.isWordBuilderWiggling.set(true);
      setTimeout(() => {
        this.isWordBuilderWiggling.set(false);
      }, 500);
    }
  }"""

content = content.replace(old_click_scrambled, new_click_scrambled)

# 5. Overhaul Flashcard UI inside template (incorporating 3D stacks, slide effects, gorgeous gradients, and styles)
old_flashcards_template = """                  @if (activeVocabGame()?.gameType === 'flashcards') {
                    <!-- FLASHCARDS INTERFACE -->
                    <div style="display:flex; flex-direction:column; align-items:center; gap:20px; width:100%">
                      <div style="font-size:12px; color:var(--text-muted)">{{ gameLabels().cardCounter(currentCardIdx() + 1, activeWords().length) }}</div>
                      
                      <div (click)="flipCard()" 
                           style="width:100%; max-width:360px; height:220px; perspective: 1000px; cursor:pointer">
                        <div [style.transform]="isFlipped() ? 'rotateY(180deg)' : 'none'"
                             style="width:100%; height:100%; position:relative; transform-style:preserve-3d; transition: transform 0.4s; border-radius:12px; box-shadow:0 8px 20px rgba(0,0,0,0.06)">
                          
                          <!-- Front (English) -->
                          <div style="position:absolute; width:100%; height:100%; backface-visibility:hidden; background:linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); border:1.5px solid #4F46E5; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px">
                            <span style="font-size:10px; font-weight:700; color:#4F46E5; text-transform:uppercase; letter-spacing:1px">Anglais</span>
                            <div style="display:flex; align-items:center; gap:8px; margin-top:8px">
                              <h2 style="font-size:26px; font-weight:800; color:#1E1B4B; margin:0; text-align:center">{{ activeWords()?.[currentCardIdx()]?.word }}</h2>
                              <button (click)="speakWord(activeWords()?.[currentCardIdx()]?.word); $event.stopPropagation()"
                                      style="background:none; border:none; color:#4F46E5; cursor:pointer; padding:6px; display:flex; align-items:center; border-radius:50%; transition: background 0.2s;"
                                      onmouseover="this.style.background='rgba(79, 70, 229, 0.1)'"
                                      onmouseout="this.style.background='none'"
                                      [title]="t('Prononcer le mot anglais', 'Pronounce the English word')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                                </svg>
                              </button>
                            </div>
                            <p style="font-size:11px; color:#4F46E5; margin-top:20px; display:flex; align-items:center; gap:4px">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px"><path d="M21.5 2v6h-6"></path><path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg> Cliquer pour retourner
                            </p>
                          </div>
                          
                          <!-- Back (French & Definition) -->
                          <div style="position:absolute; width:100%; height:100%; backface-visibility:hidden; background:#FFF; border:1.5px solid #E2E8F0; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; transform:rotateY(180deg)">
                            <span style="font-size:10px; font-weight:700; color:#059669; text-transform:uppercase; letter-spacing:1px">Français</span>
                            <h2 style="font-size:24px; font-weight:800; color:#065F46; margin:8px 0 4px 0; text-align:center">{{ activeWords()?.[currentCardIdx()]?.translation }}</h2>
                            @if (activeWords()?.[currentCardIdx()]?.definition) {
                              <p style="font-size:12px; color:var(--text-secondary); text-align:center; max-width:280px; margin:8px 0 12px 0; line-height:1.4">
                                {{ activeWords()?.[currentCardIdx()]?.definition }}
                              </p>
                            }
                            
                            <!-- Flashcard Interactive revision buttons -->
                            <div style="display:flex; gap:10px; margin-top:10px;" (click)="$event.stopPropagation()">
                              <button (click)="markFlashcardResult(true)"
                                      style="padding: 8px 16px; border-radius: 20px; border: none; background: #10B981; color: white; font-size: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 6px rgba(16,185,129,0.15);">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                {{ t('Je savais', 'I knew it') }}
                              </button>
                              <button (click)="markFlashcardResult(false)"
                                      style="padding: 8px 16px; border-radius: 20px; border: none; background: #EF4444; color: white; font-size: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 6px rgba(239,68,68,0.15);">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                {{ t('À réviser', 'To review') }}
                              </button>
                            </div>
                          </div>
                          
                        </div>
                      </div>

                      <div style="display:flex; justify-content:space-between; width:100%; max-width:360px; margin-top:12px">
                        <button class="btn-s" [disabled]="currentCardIdx() === 0" (click)="prevFlashcard()">{{ gameLabels().prevBtn }}</button>
                        <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5" (click)="nextFlashcard()">
                          {{ currentCardIdx() + 1 === activeWords().length ? gameLabels().finishBtn : gameLabels().nextBtn }}
                        </button>
                      </div>
                    </div>
                  }"""

new_flashcards_template = """                  @if (activeVocabGame()?.gameType === 'flashcards') {
                    <!-- FLASHCARDS INTERFACE -->
                    <div style="display:flex; flex-direction:column; align-items:center; gap:20px; width:100%">
                      <div style="font-size:12px; color:var(--text-muted)">{{ gameLabels().cardCounter(currentCardIdx() + 1, activeWords().length) }}</div>
                      
                      <!-- 3D Card Stack Visual Effect -->
                      <div style="position:relative; width:100%; max-width:360px; height:240px; margin:0 auto">
                        <!-- Deck stacked plate 2 -->
                        <div style="position:absolute; top:8px; left:8px; width:100%; height:100%; background:#FFF; border:2px solid var(--border-weak); border-radius:16px; transform:rotate(-2.5deg); box-shadow:0 4px 10px rgba(0,0,0,0.02); z-index:1"></div>
                        <!-- Deck stacked plate 1 -->
                        <div style="position:absolute; top:4px; left:4px; width:100%; height:100%; background:#FFF; border:2px solid var(--border-weak); border-radius:16px; transform:rotate(2deg); box-shadow:0 6px 12px rgba(0,0,0,0.03); z-index:2"></div>
                        
                        <!-- Active Rotatable Card -->
                        <div (click)="flipCard()" 
                             style="position:relative; width:100%; height:100%; perspective: 1000px; cursor:pointer; z-index:3">
                          <div [style.transform]="isFlipped() ? 'rotateY(180deg)' : 'none'"
                               style="width:100%; height:100%; position:relative; transform-style:preserve-3d; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); border-radius:16px; box-shadow:0 12px 28px rgba(79, 70, 229, 0.08)">
                            
                            <!-- Front (English) -->
                            <div style="position:absolute; width:100%; height:100%; backface-visibility:hidden; background:linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); border:2.5px solid #4F46E5; border-radius:16px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px">
                              <span style="font-size:10px; font-weight:800; color:#4F46E5; text-transform:uppercase; letter-spacing:1.5px">Anglais</span>
                              <div style="display:flex; align-items:center; gap:8px; margin-top:12px">
                                <h2 style="font-size:28px; font-weight:850; color:#1E1B4B; margin:0; text-align:center; letter-spacing:-0.5px">{{ activeWords()?.[currentCardIdx()]?.word }}</h2>
                                <button (click)="speakWord(activeWords()?.[currentCardIdx()]?.word); $event.stopPropagation()"
                                        style="background:rgba(79,70,229,0.08); border:none; color:#4F46E5; cursor:pointer; padding:8px; display:flex; align-items:center; border-radius:50%; transition: all 0.2s;"
                                        onmouseover="this.style.background='rgba(79, 70, 229, 0.15)'"
                                        onmouseout="this.style.background='rgba(79,70,229,0.08)'"
                                        [title]="t('Prononcer le mot anglais', 'Pronounce the English word')">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                                  </svg>
                                </button>
                              </div>
                              <p style="font-size:11px; color:#4F46E5; margin-top:24px; display:flex; align-items:center; gap:4px; font-weight:600; background:rgba(79,70,229,0.06); padding:4px 10px; border-radius:12px">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px"><path d="M21.5 2v6h-6"></path><path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg> 
                                Cliquer pour retourner
                              </p>
                            </div>
                            
                            <!-- Back (French & Definition) -->
                            <div style="position:absolute; width:100%; height:100%; backface-visibility:hidden; background:#FFF; border:2.5px solid #E2E8F0; border-radius:16px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px; transform:rotateY(180deg)">
                              <span style="font-size:10px; font-weight:800; color:#059669; text-transform:uppercase; letter-spacing:1.5px">Français</span>
                              <h2 style="font-size:26px; font-weight:850; color:#065F46; margin:12px 0 6px 0; text-align:center; letter-spacing:-0.5px">{{ activeWords()?.[currentCardIdx()]?.translation }}</h2>
                              @if (activeWords()?.[currentCardIdx()]?.definition) {
                                <p style="font-size:12px; color:var(--text-secondary); text-align:center; max-width:280px; margin:8px 0 14px 0; line-height:1.4">
                                  {{ activeWords()?.[currentCardIdx()]?.definition }}
                                </p>
                              }
                              
                              <!-- Flashcard Interactive revision buttons -->
                              <div style="display:flex; gap:12px; margin-top:12px;" (click)="$event.stopPropagation()">
                                <button (click)="markFlashcardResult(true)"
                                        style="padding: 8px 16px; border-radius: 20px; border: none; background: #10B981; color: white; font-size: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 6px rgba(16,185,129,0.15);">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                  {{ t('Je savais', 'I knew it') }}
                                </button>
                                <button (click)="markFlashcardResult(false)"
                                        style="padding: 8px 16px; border-radius: 20px; border: none; background: #EF4444; color: white; font-size: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 6px rgba(239,68,68,0.15);">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  {{ t('À réviser', 'To review') }}
                                </button>
                              </div>
                            </div>
                            
                          </div>
                        </div>
                      </div>

                      <div style="display:flex; justify-content:space-between; width:100%; max-width:360px; margin-top:20px">
                        <button class="btn-s" [disabled]="currentCardIdx() === 0" (click)="prevFlashcard()">{{ gameLabels().prevBtn }}</button>
                        <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5" (click)="nextFlashcard()">
                          {{ currentCardIdx() + 1 === activeWords().length ? gameLabels().finishBtn : gameLabels().nextBtn }}
                        </button>
                      </div>
                    </div>
                  }"""

content = content.replace(old_flashcards_template, new_flashcards_template)

# 6. Overhaul Word Builder UI inside template (dotted placeholders, wiggle/success states, styling)
old_word_builder_template = """                  @if (activeVocabGame()?.gameType === 'word_builder') {
                    <!-- WORD BUILDER INTERFACE -->
                    <div style="display:flex; flex-direction:column; align-items:center; gap:20px; width:100%">
                      <div style="font-size:12px; color:var(--text-muted)">{{ gameLabels().wordCounter(wordBuilderIdx() + 1, activeWords().length) }}</div>
                      
                      <div style="background:var(--surface-2); padding:16px; border-radius:8px; border:1px solid var(--border-weak); text-align:center; width:100%">
                        <span style="font-size:10px; font-weight:700; color:#D97706; text-transform:uppercase">{{ gameLabels().translateWordPrompt }}</span>
                        <h3 style="font-size:18px; font-weight:800; margin:4px 0 0 0; color:var(--text-primary); display:flex; align-items:center; justify-content:center; gap:8px;">
                          <span>{{ activeWords()?.[wordBuilderIdx()]?.translation }}</span>
                          <button (click)="speakWord(activeWords()?.[wordBuilderIdx()]?.word)"
                                  style="background:none; border:none; color:#D97706; cursor:pointer; padding:4px; display:inline-flex; align-items:center;"
                                  [title]="t('Prononcer le mot anglais', 'Pronounce the English word')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            </svg>
                          </button>
                        </h3>
                        @if (activeWords()?.[wordBuilderIdx()]?.definition) {
                          <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0 0; line-height:1.4">
                            {{ activeWords()?.[wordBuilderIdx()]?.definition }}
                          </p>
                        }
                      </div>

                      <!-- Spelled word letters slot -->
                      <div style="display:flex; gap:8px; flex-wrap:wrap; min-height:48px; border-bottom:2px dashed var(--border); padding-bottom:12px; width:100%; justify-content:center">
                        @for (char of selectedLetters(); track $index; let sIdx = $index) {
                          <button (click)="clickSelectedLetter(char, sIdx)"
                                  style="width:40px; height:40px; border-radius:8px; border:2px solid #3B82F6; background:#EFF6FF; color:#1D4ED8; font-size:17px; font-weight:800; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow: 0 3px 0 #2563EB; transition: all 0.1s;"
                                  onmousedown="this.style.transform='translateY(2px)'; this.style.boxShadow='0 1px 0 #2563EB'"
                                  onmouseup="this.style.transform='translateY(0px)'; this.style.boxShadow='0 3px 0 #2563EB'">
                            {{ char | uppercase }}
                          </button>
                        }
                      </div>

                      <!-- Scrambled pool options -->
                      <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center">
                        @for (char of scrambledLetters(); track $index; let scrIdx = $index) {
                          <button (click)="clickScrambledLetter(char, scrIdx)"
                                  style="width:40px; height:40px; border-radius:8px; border:2px solid #E2E8F0; background:white; color:#334155; font-size:17px; font-weight:800; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow: 0 3px 0 #CBD5E1; transition: all 0.1s;"
                                  onmousedown="this.style.transform='translateY(2px)'; this.style.boxShadow='0 1px 0 #CBD5E1'"
                                  onmouseup="this.style.transform='translateY(0px)'; this.style.boxShadow='0 3px 0 #CBD5E1'">
                            {{ char | uppercase }}
                          </button>
                        }
                      </div>

                      <button class="btn-s" style="margin-top:10px; display:inline-flex; align-items:center; gap:6px;" (click)="resetWordBuilder()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                        {{ gameLabels().resetBtn }}
                      </button>
                    </div>
                  }"""

new_word_builder_template = """                  @if (activeVocabGame()?.gameType === 'word_builder') {
                    <!-- WORD BUILDER INTERFACE -->
                    <div style="display:flex; flex-direction:column; align-items:center; gap:20px; width:100%">
                      <style>
                        @keyframes wb-wiggle {
                          0%, 100% { transform: translateX(0); }
                          20%, 60% { transform: translateX(-6px); }
                          40%, 80% { transform: translateX(6px); }
                        }
                        .wb-slot.wiggling {
                          animation: wb-wiggle 0.4s ease-in-out;
                          border-color: #EF4444 !important;
                          background-color: #FEF2F2 !important;
                          color: #DC2626 !important;
                          box-shadow: 0 3px 0 #EF4444 !important;
                        }
                        .wb-slot.success-state {
                          border-color: #10B981 !important;
                          background-color: #ECFDF5 !important;
                          color: #059669 !important;
                          box-shadow: 0 3px 0 #10B981 !important;
                          transform: scale(1.05);
                        }
                      </style>

                      <div style="font-size:12px; color:var(--text-muted)">{{ gameLabels().wordCounter(wordBuilderIdx() + 1, activeWords().length) }}</div>
                      
                      <div style="background:var(--surface-2); padding:16px; border-radius:12px; border:1px solid var(--border-weak); text-align:center; width:100%">
                        <span style="font-size:10px; font-weight:800; color:#D97706; text-transform:uppercase; letter-spacing:1px">{{ gameLabels().translateWordPrompt }}</span>
                        <h3 style="font-size:18px; font-weight:850; margin:6px 0 0 0; color:var(--text-primary); display:flex; align-items:center; justify-content:center; gap:8px;">
                          <span>{{ activeWords()?.[wordBuilderIdx()]?.translation }}</span>
                          <button (click)="speakWord(activeWords()?.[wordBuilderIdx()]?.word)"
                                  style="background:rgba(217, 119, 6, 0.08); border:none; color:#D97706; cursor:pointer; padding:6px; display:inline-flex; align-items:center; border-radius:50%"
                                  [title]="t('Prononcer le mot anglais', 'Pronounce the English word')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            </svg>
                          </button>
                        </h3>
                        @if (activeWords()?.[wordBuilderIdx()]?.definition) {
                          <p style="font-size:12px; color:var(--text-secondary); margin:8px 0 0 0; line-height:1.4">
                            {{ activeWords()?.[wordBuilderIdx()]?.definition }}
                          </p>
                        }
                      </div>

                      <!-- Dotted Letters Construction Slots -->
                      <div style="display:flex; gap:8px; flex-wrap:wrap; min-height:48px; padding-bottom:12px; width:100%; justify-content:center">
                        @for (char of getTargetWordChars(); track $index; let sIdx = $index) {
                          <button (click)="clickSelectedLetter(selectedLetters()[$index] || '', sIdx)"
                                  [disabled]="sIdx !== selectedLetters().length - 1"
                                  [class.wb-slot]="true"
                                  [class.wiggling]="isWordBuilderWiggling() && sIdx === selectedLetters().length"
                                  [class.success-state]="isWordBuilderSuccess()"
                                  style="width:40px; height:40px; border-radius:8px; border:2px dashed #CBD5E1; background:#F8FAFC; color:#1D4ED8; font-size:17px; font-weight:800; display:flex; align-items:center; justify-content:center; transition: all 0.2s; box-shadow: none"
                                  [style.border-style]="selectedLetters()[$index] ? 'solid' : 'dashed'"
                                  [style.border-color]="selectedLetters()[$index] ? '#3B82F6' : '#CBD5E1'"
                                  [style.background]="selectedLetters()[$index] ? '#EFF6FF' : '#F8FAFC'"
                                  [style.box-shadow]="selectedLetters()[$index] ? '0 3px 0 #2563EB' : 'none'"
                                  [style.cursor]="(sIdx === selectedLetters().length - 1) ? 'pointer' : 'default'">
                            {{ (selectedLetters()[$index] || '') | uppercase }}
                          </button>
                        }
                      </div>

                      <!-- Scrambled letters options pool -->
                      <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center; min-height:44px">
                        @for (char of scrambledLetters(); track $index; let scrIdx = $index) {
                          <button (click)="clickScrambledLetter(char, scrIdx)"
                                  style="width:40px; height:40px; border-radius:8px; border:2px solid #E2E8F0; background:white; color:#334155; font-size:17px; font-weight:800; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow: 0 3px 0 #CBD5E1; transition: all 0.1s;"
                                  onmousedown="this.style.transform='translateY(2px)'; this.style.boxShadow='0 1px 0 #CBD5E1'"
                                  onmouseup="this.style.transform='translateY(0px)'; this.style.boxShadow='0 3px 0 #CBD5E1'">
                            {{ char | uppercase }}
                          </button>
                        }
                      </div>

                      <button class="btn-s" style="margin-top:10px; display:inline-flex; align-items:center; gap:6px;" (click)="resetWordBuilder()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                        {{ gameLabels().resetBtn }}
                      </button>
                    </div>
                  }"""

content = content.replace(old_word_builder_template, new_word_builder_template)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("exercises.ts updated successfully with premium animations and wiggling Word Builder!")
