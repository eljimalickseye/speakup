import os

file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\student\exercises.ts'

# Load the file content
with open(file_path, 'rb') as f:
    raw_bytes = f.read()

# Decode to string and normalize line endings to \n
content = raw_bytes.decode('utf-8').replace('\r\n', '\n')

# Locate start
start_marker = "@if (activeVocabGame()?.gameType === 'matching') {"
start_idx = content.find(start_marker)

# Locate end robustly
results_idx = content.find("<!-- Detailed Game Results Overlay -->")
if results_idx == -1:
    print("Error: Results overlay comment not found!")
    exit(1)

end_idx = content.rfind("} @else {", 0, results_idx)

if start_idx == -1 or end_idx == -1:
    print(f"Error: Markers not found! start_idx={start_idx}, end_idx={end_idx}")
    exit(1)

# Back track to the end of the last closing block of multiple_choice before "} @else {"
# Let's verify what index "} @else {" is at, and we can replace up to that index (not including it)
# So everything from start_idx up to end_idx will be replaced!

new_templates = """@if (activeVocabGame()?.gameType === 'matching') {
                    <!-- Cards Grid (Association) -->
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:20px">
                      @for (card of gameCards(); track card.id) {
                        <button class="vocab-match-card" 
                                [class.selected]="card.selected"
                                [class.matched]="card.matched"
                                [class.error]="card.error"
                                [style.pointer-events]="card.matched ? 'none' : 'auto'"
                                style="border: 1.5px solid var(--border); border-radius: 12px; padding: 14px; background: var(--surface-1); color: var(--text-primary); font-weight: 600; font-size: 13px; min-height: 64px; cursor: pointer; display: flex; align-items: center; justify-content: center; position: relative; transition: all 0.2s ease-in-out; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);"
                                [style.border-color]="card.matched ? '#10B981' : (card.error ? '#EF4444' : (card.selected ? '#D97706' : 'var(--border)'))"
                                [style.background]="card.matched ? '#ECFDF5' : (card.error ? '#FEF2F2' : (card.selected ? '#FEF3C7' : 'var(--surface-1)'))"
                                [style.color]="card.matched ? '#065F46' : (card.error ? '#991B1B' : (card.selected ? '#92400E' : 'var(--text-primary)'))"
                                (click)="selectCard(card)">
                          <div style="display:flex; flex-direction:column; align-items:center; gap:6px; justify-content:center; width:100%">
                            <div style="display:flex; align-items:center; gap:6px; justify-content:center;">
                              @if (card.matched) {
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              } @else if (card.error) {
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              }
                              <span>{{ card.text }}</span>
                            </div>
                            @if (card.type === 'english' && !card.matched) {
                              <button (click)="speakWord(card.text); $event.stopPropagation()"
                                      style="background:rgba(217, 119, 6, 0.08); border:none; color:#D97706; cursor:pointer; padding:3px 8px; display:inline-flex; align-items:center; gap:4px; border-radius:12px; font-size:10px; font-weight:700; transition: background 0.2s;"
                                      onmouseover="this.style.background='rgba(217, 119, 6, 0.15)'"
                                      onmouseout="this.style.background='rgba(217, 119, 6, 0.08)'"
                                      title="Prononcer le mot anglais">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                </svg>
                                Écouter
                              </button>
                            }
                          </div>
                        </button>
                      }
                    </div>
                  }

                  @if (activeVocabGame()?.gameType === 'memory') {
                    <!-- MEMORY INTERFACE -->
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap:10px; margin-bottom:20px">
                      @for (card of gameCards(); track card.id) {
                        <div style="perspective: 1000px; height: 90px; cursor: pointer;"
                             [style.pointer-events]="(card.matched || card.selected) ? 'none' : 'auto'"
                             (click)="selectCard(card)">
                          
                          <div [style.transform]="(card.selected || card.matched) ? 'rotateY(180deg)' : 'none'"
                               style="width:100%; height:100%; position:relative; transform-style:preserve-3d; transition: transform 0.4s; border-radius:10px; box-shadow:0 4px 8px rgba(0,0,0,0.05)">
                            
                            <!-- Card Back (Hidden/Face down) -->
                            <div style="position:absolute; width:100%; height:100%; backface-visibility:hidden; background:linear-gradient(135deg, #4F46E5 0%, #3730A3 100%); border:1.5px solid #4F46E5; border-radius:10px; display:flex; align-items:center; justify-content:center; color:white;">
                              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                              </svg>
                            </div>

                            <!-- Card Front (Revealed) -->
                            <div style="position:absolute; width:100%; height:100%; backface-visibility:hidden; background:#FFF; border:2px solid #E2E8F0; border-radius:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:8px; transform:rotateY(180deg);"
                                 [style.border-color]="card.matched ? '#10B981' : (card.error ? '#EF4444' : '#4F46E5')"
                                 [style.background]="card.matched ? '#ECFDF5' : (card.error ? '#FEF2F2' : '#FFF')">
                              
                              <div style="font-size:11.5px; font-weight:700; text-align:center; display:flex; flex-direction:column; align-items:center; gap:4px; justify-content:center; width:100%"
                                   [style.color]="card.matched ? '#065F46' : (card.error ? '#991B1B' : '#1E1B4B')">
                                <span style="word-break: break-word; line-height: 1.2;">{{ card.text }}</span>
                                @if (card.type === 'english') {
                                  <button (click)="speakWord(card.text); $event.stopPropagation()" 
                                          style="background:rgba(79, 70, 229, 0.06); border:none; color:#4F46E5; cursor:pointer; padding:2px 6px; display:inline-flex; align-items:center; gap:2px; border-radius:8px; font-size:9px; font-weight:700; margin-top:2px;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                    </svg>
                                    Écouter
                                  </button>
                                }
                              </div>
                            </div>

                          </div>
                        </div>
                      }
                    </div>
                  }

                  @if (activeVocabGame()?.gameType === 'flashcards') {
                    <!-- FLASHCARDS INTERFACE -->
                    <div style="display:flex; flex-direction:column; align-items:center; gap:20px; width:100%">
                      <div style="font-size:12px; color:var(--text-muted)">Carte {{ currentCardIdx() + 1 }} sur {{ activeWords().length }}</div>
                      
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
                                      title="Prononcer le mot anglais">
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
                                Je savais
                              </button>
                              <button (click)="markFlashcardResult(false)"
                                      style="padding: 8px 16px; border-radius: 20px; border: none; background: #EF4444; color: white; font-size: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 6px rgba(239,68,68,0.15);">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                À réviser
                              </button>
                            </div>
                          </div>
                          
                        </div>
                      </div>

                      <div style="display:flex; justify-content:space-between; width:100%; max-width:360px; margin-top:12px">
                        <button class="btn-s" [disabled]="currentCardIdx() === 0" (click)="prevFlashcard()">Précédent</button>
                        <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5" (click)="nextFlashcard()">
                          {{ currentCardIdx() + 1 === activeWords().length ? 'Terminer' : 'Suivant' }}
                        </button>
                      </div>
                    </div>
                  }

                  @if (activeVocabGame()?.gameType === 'word_builder') {
                    <!-- WORD BUILDER INTERFACE -->
                    <div style="display:flex; flex-direction:column; align-items:center; gap:20px; width:100%">
                      <div style="font-size:12px; color:var(--text-muted)">Mot {{ wordBuilderIdx() + 1 }} sur {{ activeWords().length }}</div>
                      
                      <div style="background:var(--surface-2); padding:16px; border-radius:8px; border:1px solid var(--border-weak); text-align:center; width:100%">
                        <span style="font-size:10px; font-weight:700; color:#D97706; text-transform:uppercase">Traduire le mot :</span>
                        <h3 style="font-size:18px; font-weight:800; margin:4px 0 0 0; color:var(--text-primary); display:flex; align-items:center; justify-content:center; gap:8px;">
                          <span>{{ activeWords()?.[wordBuilderIdx()]?.translation }}</span>
                          <button (click)="speakWord(activeWords()?.[wordBuilderIdx()]?.word)"
                                  style="background:none; border:none; color:#D97706; cursor:pointer; padding:4px; display:inline-flex; align-items:center;"
                                  title="Prononcer le mot anglais">
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
                        Réinitialiser
                      </button>
                    </div>
                  }

                  @if (activeVocabGame()?.gameType === 'hangman') {
                    <!-- HANGMAN INTERFACE -->
                    <div style="display:flex; flex-direction:column; align-items:center; gap:16px; width:100%">
                      <div style="font-size:12px; color:var(--text-muted)">Mot {{ hangmanIdx() + 1 }} sur {{ activeWords().length }}</div>

                      <div style="background:var(--surface-2); padding:16px; border-radius:8px; border:1px solid var(--border-weak); text-align:center; width:100%">
                        <span style="font-size:10px; font-weight:700; color:#EF4444; text-transform:uppercase">Indice / Traduction :</span>
                        <h3 style="font-size:18px; font-weight:800; margin:4px 0 0 0; color:var(--text-primary); display:flex; align-items:center; justify-content:center; gap:8px;">
                          <span>{{ activeWords()?.[hangmanIdx()]?.translation }}</span>
                          <button (click)="speakWord(activeWords()?.[hangmanIdx()]?.word)"
                                  style="background:none; border:none; color:#EF4444; cursor:pointer; padding:4px; display:inline-flex; align-items:center;"
                                  title="Prononcer le mot anglais">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            </svg>
                          </button>
                        </h3>
                        @if (activeWords()?.[hangmanIdx()]?.definition) {
                          <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0 0; line-height:1.4">
                            {{ activeWords()?.[hangmanIdx()]?.definition }}
                          </p>
                        }
                      </div>

                      <!-- SVG Hangman Gallows and Stick Figure -->
                      <svg width="120" height="120" viewBox="0 0 100 100" style="margin: 10px 0;">
                        <!-- Gallows (always visible) -->
                        <line x1="15" y1="95" x2="55" y2="95" stroke="var(--text-primary)" stroke-width="4" stroke-linecap="round" />
                        <line x1="30" y1="95" x2="30" y2="10" stroke="var(--text-primary)" stroke-width="4" stroke-linecap="round" />
                        <line x1="30" y1="10" x2="65" y2="10" stroke="var(--text-primary)" stroke-width="4" stroke-linecap="round" />
                        <line x1="65" y1="10" x2="65" y2="25" stroke="var(--text-primary)" stroke-width="3" stroke-linecap="round" />
                        <line x1="30" y1="25" x2="45" y2="10" stroke="var(--text-primary)" stroke-width="3" stroke-linecap="round" />

                        <!-- Head (lives <= 5) -->
                        @if (hangmanLives() <= 5) {
                          <circle cx="65" cy="33" r="8" fill="none" stroke="#EF4444" stroke-width="3.5" />
                        }
                        <!-- Body (lives <= 4) -->
                        @if (hangmanLives() <= 4) {
                          <line x1="65" y1="41" x2="65" y2="65" stroke="#EF4444" stroke-width="3.5" stroke-linecap="round" />
                        }
                        <!-- Left Arm (lives <= 3) -->
                        @if (hangmanLives() <= 3) {
                          <line x1="65" y1="48" x2="50" y2="40" stroke="#EF4444" stroke-width="3" stroke-linecap="round" />
                        }
                        <!-- Right Arm (lives <= 2) -->
                        @if (hangmanLives() <= 2) {
                          <line x1="65" y1="48" x2="80" y2="40" stroke="#EF4444" stroke-width="3" stroke-linecap="round" />
                        }
                        <!-- Left Leg (lives <= 1) -->
                        @if (hangmanLives() <= 1) {
                          <line x1="65" y1="65" x2="52" y2="82" stroke="#EF4444" stroke-width="3" stroke-linecap="round" />
                        }
                        <!-- Right Leg (lives <= 0) -->
                        @if (hangmanLives() <= 0) {
                          <line x1="65" y1="65" x2="78" y2="82" stroke="#EF4444" stroke-width="3" stroke-linecap="round" />
                          <!-- Dead eyes inside head -->
                          <line x1="62" y1="31" x2="64" y2="33" stroke="#EF4444" stroke-width="1.5" />
                          <line x1="64" y1="31" x2="62" y2="33" stroke="#EF4444" stroke-width="1.5" />
                          <line x1="66" y1="31" x2="68" y2="33" stroke="#EF4444" stroke-width="1.5" />
                          <line x1="68" y1="31" x2="66" y2="33" stroke="#EF4444" stroke-width="1.5" />
                        }
                      </svg>

                      <!-- Lives Counter -->
                      <div style="font-size:13px; font-weight:700; color:#EF4444; display:flex; align-items:center; gap:6px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                        </svg>
                        <span>Vies restantes : {{ hangmanLives() }} / 6</span>
                      </div>

                      <!-- Underscore placeholder word displays -->
                      <div style="font-size:26px; font-weight:800; letter-spacing:8px; color:#1E1B4B; margin:16px 0; text-align:center; text-transform:uppercase">
                        {{ getHangmanWordDisplay() }}
                      </div>

                      <!-- A-Z keyboard buttons -->
                      <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:6px; max-width:360px">
                        @for (letter of ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']; track letter) {
                          <button [disabled]="hangmanGuesses().includes(letter)"
                                  (click)="guessHangmanLetter(letter)"
                                  style="width:38px; height:38px; border-radius:8px; border:2px solid #E2E8F0; font-size:14px; font-weight:800; cursor:pointer; text-transform:uppercase; transition: all 0.2s;"
                                  [style.background]="hangmanGuesses().includes(letter) ? '#F1F5F9' : 'white'"
                                  [style.border-color]="hangmanGuesses().includes(letter) ? '#E2E8F0' : '#E2E8F0'"
                                  [style.color]="hangmanGuesses().includes(letter) ? '#94A3B8' : '#334155'"
                                  [style.box-shadow]="hangmanGuesses().includes(letter) ? 'none' : '0 2px 0 #E2E8F0'">
                            {{ letter }}
                          </button>
                        }
                      </div>

                    </div>
                  }

                  @if (activeVocabGame()?.gameType === 'multiple_choice') {
                    <!-- MULTIPLE CHOICE GAME INTERFACE -->
                    <div style="display:flex; flex-direction:column; gap:16px; width:100%">
                      <div style="font-size:12px; color:var(--text-muted); text-align:center">Question {{ mcGameIdx() + 1 }} sur {{ activeWords().length }}</div>

                      <div style="background:var(--surface-2); padding:16px; border-radius:8px; border:1px solid var(--border-weak); text-align:center; width:100%">
                        @if (hasDefinitionOrContext(activeWords()?.[mcGameIdx()])) {
                          <span style="font-size:10px; font-weight:700; color:#4F46E5; text-transform:uppercase">Complétez la phrase :</span>
                          <h3 style="font-size:18px; font-weight:800; margin:4px 0 0 0; color:var(--text-primary)">
                            {{ getMCQuestionPhrase(activeWords()?.[mcGameIdx()]) }}
                          </h3>
                          <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0 0; line-height:1.4">
                            Traduction : {{ activeWords()?.[mcGameIdx()]?.translation }}
                          </p>
                        } @else {
                          <span style="font-size:10px; font-weight:700; color:#4F46E5; text-transform:uppercase">Définition / Traduction :</span>
                          <h3 style="font-size:18px; font-weight:800; margin:4px 0 0 0; color:var(--text-primary)">
                            {{ activeWords()?.[mcGameIdx()]?.translation }}
                          </h3>
                          @if (activeWords()?.[mcGameIdx()]?.definition) {
                            <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0 0; line-height:1.4">
                              {{ activeWords()?.[mcGameIdx()]?.definition }}
                            </p>
                          }
                        }
                      </div>

                      <!-- Choices Buttons with speaker icons next to options -->
                      <div style="display:flex; flex-direction:column; gap:10px">
                        @for (opt of mcOptions(); track opt; let optIdx = $index) {
                          <div style="display:flex; align-items:center; gap:8px; width:100%">
                            <button (click)="selectMCOption(opt)"
                                    [disabled]="mcSelected() !== null"
                                    style="flex:1; padding:14px; border-radius:10px; border:2px solid var(--border); font-size:13.5px; font-weight:700; text-align:left; cursor:pointer; display:flex; align-items:center; transition: all 0.2s;"
                                    [style.background]="mcSelected() === opt ? (mcIsCorrect() ? '#ECFDF5' : '#FEF2F2') : (mcSelected() !== null && opt === activeWords()?.[mcGameIdx()]?.word ? '#ECFDF5' : '#FFF')"
                                    [style.border-color]="mcSelected() === opt ? (mcIsCorrect() ? '#10B981' : '#EF4444') : (mcSelected() !== null && opt === activeWords()?.[mcGameIdx()]?.word ? '#10B981' : 'var(--border)')"
                                    [style.color]="mcSelected() === opt ? (mcIsCorrect() ? '#065F46' : '#991B1B') : (mcSelected() !== null && opt === activeWords()?.[mcGameIdx()]?.word ? '#065F46' : 'var(--text-primary)')">
                              
                              <div style="width:24px; height:24px; border-radius:50%; background:rgba(79, 70, 229, 0.08); color:#4F46E5; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center; margin-right:12px; flex-shrink:0;"
                                   [style.background]="mcSelected() === opt ? (mcIsCorrect() ? '#10B981' : '#EF4444') : (mcSelected() !== null && opt === activeWords()?.[mcGameIdx()]?.word ? '#10B981' : 'rgba(79, 70, 229, 0.08)')"
                                   [style.color]="(mcSelected() === opt || (mcSelected() !== null && opt === activeWords()?.[mcGameIdx()]?.word)) ? '#FFF' : '#4F46E5'">
                                {{ ['A', 'B', 'C', 'D'][optIdx] }}
                              </div>

                              <span style="flex:1;">{{ opt }}</span>

                              @if (mcSelected() === opt) {
                                @if (mcIsCorrect()) {
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-left:8px;"><polyline points="20 6 9 17 4 12"/></svg>
                                } @else {
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-left:8px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                }
                              } @else if (mcSelected() !== null && opt === activeWords()?.[mcGameIdx()]?.word) {
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-left:8px;"><polyline points="20 6 9 17 4 12"/></svg>
                              }
                            </button>
                            <button (click)="speakWord(opt); $event.stopPropagation()"
                                    style="background:none; border:none; color:#4F46E5; cursor:pointer; padding:6px; display:flex; align-items:center; border-radius:50%; transition: background 0.2s;"
                                    onmouseover="this.style.background='rgba(79, 70, 229, 0.1)'"
                                    onmouseout="this.style.background='none'"
                                    title="Prononcer">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                              </svg>
                            </button>
                          </div>
                        }
                      </div>
                    </div>
                  }"""

# Replace block
content_before = content[:start_idx]
content_after = content[end_idx:]

new_content = content_before + new_templates + "\n" + content_after

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("exercises.ts game templates updated successfully!")
