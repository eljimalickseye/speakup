file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\student\exercises.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix the stray brace around line 1655 in exercises.ts
# Let's inspect the target area:
target_brace_block = """                  </div>
                }
              }
            </div>
          </div>
        }
      } @else {"""

clean_brace_block = """                  </div>
                }
              }
            </div>
          </div>
      } @else {"""

if target_brace_block in content:
    content = content.replace(target_brace_block, clean_brace_block)
    print("Stray template brace fixed!")
else:
    # Try with different whitespace/line endings
    target_brace_block_lf = target_brace_block.replace('\r\n', '\n')
    clean_brace_block_lf = clean_brace_block.replace('\r\n', '\n')
    if target_brace_block_lf in content:
        content = content.replace(target_brace_block_lf, clean_brace_block_lf)
        print("Stray template brace fixed (LF)!")
    else:
        print("Warning: Target brace block not found!")

# 2. Replace the bottom section starting with '// --- WORD SEARCH LOGIC ---'
# to the end of the file with clean, parameter-less custom games implementations
# that call finishVocabGame()

bottom_search_str = '  // --- WORD SEARCH LOGIC ---'
start_idx = content.find(bottom_search_str)

if start_idx != -1:
    clean_bottom_code = """  // --- WORD SEARCH LOGIC ---
  setupWordSearch() {
    const size = 8;
    const grid: string[][] = Array(size).fill(null).map(() => Array(size).fill(''));
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    
    this.wordSearchFound.set([]);
    this.wordSearchSelected.set([]);

    const words = this.activeWords();
    words.forEach(w => {
      const word = w.word.toUpperCase().replace(/[^A-Z]/g, '');
      if (word.length > size) return;
      
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 100) {
        attempts++;
        const direction = Math.random() > 0.5 ? 'H' : 'V';
        const row = Math.floor(Math.random() * (direction === 'V' ? (size - word.length) : size));
        const col = Math.floor(Math.random() * (direction === 'H' ? (size - word.length) : size));
        
        let fits = true;
        for (let i = 0; i < word.length; i++) {
          const r = row + (direction === 'V' ? i : 0);
          const c = col + (direction === 'H' ? i : 0);
          if (grid[r][c] !== '' && grid[r][c] !== word[i]) {
            fits = false;
            break;
          }
        }
        
        if (fits) {
          for (let i = 0; i < word.length; i++) {
            const r = row + (direction === 'V' ? i : 0);
            const c = col + (direction === 'H' ? i : 0);
            grid[r][c] = word[i];
          }
          placed = true;
        }
      }
    });

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] === '') {
          grid[r][c] = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
    }

    this.wordSearchGrid.set(grid);
  }

  selectWordSearchCell(r: number, c: number) {
    const selected = [...this.wordSearchSelected()];
    const exists = selected.findIndex(item => item.r === r && item.c === c);
    
    if (exists !== -1) {
      selected.splice(exists, 1);
    } else {
      selected.push({ r, c });
    }
    
    this.wordSearchSelected.set(selected);

    const sorted = [...selected].sort((a, b) => a.r !== b.r ? a.r - b.r : a.c - b.c);
    const letters = sorted.map(coord => this.wordSearchGrid()[coord.r][coord.c]).join('');
    
    const words = this.activeWords();
    words.forEach(w => {
      const wordUpper = w.word.toUpperCase().replace(/[^A-Z]/g, '');
      if (letters === wordUpper && !this.wordSearchFound().includes(w.word)) {
        const foundList = [...this.wordSearchFound(), w.word];
        this.wordSearchFound.set(foundList);
        this.wordSearchSelected.set([]);
        this.dialogService.alert('Mot Trouvé ! 🔍', `Vous avez trouvé le mot : "${w.word}"`, 'success');

        if (foundList.length === words.length) {
          setTimeout(() => {
            this.finishVocabGame();
          }, 1000);
        }
      }
    });
  }

  // --- SENTENCE ORDER LOGIC ---
  setupSentenceOrder(index: number) {
    this.sentenceOrderIdx.set(index);
    this.selectedSentenceWords.set([]);
    
    const wordObj = this.activeWords()[index];
    if (wordObj) {
      const wordsArr = wordObj.word.trim().split(/\\s+/);
      const scrambled = [...wordsArr];
      for (let i = scrambled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
      }
      this.scrambledSentenceWords.set(scrambled);
    }
  }

  clickSentenceOrderWord(word: string, idx: number) {
    const scrambled = [...this.scrambledSentenceWords()];
    scrambled.splice(idx, 1);
    this.scrambledSentenceWords.set(scrambled);

    const selected = [...this.selectedSentenceWords(), word];
    this.selectedSentenceWords.set(selected);

    const words = this.activeWords();
    const correctSentence = words[this.sentenceOrderIdx()].word;
    const assembled = selected.join(' ');
    
    if (scrambled.length === 0) {
      if (assembled === correctSentence) {
        this.dialogService.alert('Correct ! 🎉', `La phrase est parfaitement ordonnée.`, 'success');
        setTimeout(() => {
          if (this.sentenceOrderIdx() + 1 === words.length) {
            this.finishVocabGame();
          } else {
            this.setupSentenceOrder(this.sentenceOrderIdx() + 1);
          }
        }, 1200);
      } else {
        this.dialogService.alert('Incorrect ✖', `L'ordre n'est pas correct. Réessayez !`, 'info');
        this.setupSentenceOrder(this.sentenceOrderIdx());
      }
    }
  }

  clickSelectedSentenceWord(word: string, idx: number) {
    const selected = [...this.selectedSentenceWords()];
    selected.splice(idx, 1);
    this.selectedSentenceWords.set(selected);

    const scrambled = [...this.scrambledSentenceWords(), word];
    this.scrambledSentenceWords.set(scrambled);
  }

  // --- ERROR HUNT LOGIC ---
  setupErrorHunt(index: number) {
    this.errorHuntIdx.set(index);
    this.errorHuntSelectedIdx.set(null);
    this.errorHuntCorrected.set(false);

    const wordObj = this.activeWords()[index];
    if (wordObj) {
      this.errorHuntWords.set(wordObj.word.trim().split(/\\s+/));
      
      const correctArr = wordObj.translation.trim().split(/\\s+/);
      const incorrectArr = wordObj.word.trim().split(/\\s+/);
      let wrongIdx = 0;
      for (let i = 0; i < incorrectArr.length; i++) {
        if (incorrectArr[i] !== correctArr[i]) {
          wrongIdx = i;
          break;
        }
      }
      this.errorHuntWrongWordIdx.set(wrongIdx);
    }
  }

  selectErrorHuntWord(word: string, idx: number) {
    this.errorHuntSelectedIdx.set(idx);
    const correctIdx = this.errorHuntWrongWordIdx();
    
    if (idx === correctIdx) {
      this.dialogService.alert('Erreur Trouvée ! 🕵️', 'Vous avez ciblé le mot erroné. Saisissez la correction !', 'success');
    } else {
      this.dialogService.alert('Non ✖', 'Ce mot est correct dans la phrase.', 'info');
      this.errorHuntSelectedIdx.set(null);
    }
  }

  submitErrorHuntCorrection(correctedWord: string) {
    const words = this.activeWords();
    const correctWords = words[this.errorHuntIdx()].translation.trim().split(/\\s+/);
    const wrongIdx = this.errorHuntWrongWordIdx();
    
    if (wrongIdx !== null && correctedWord.toLowerCase().trim() === correctWords[wrongIdx].toLowerCase().trim()) {
      this.errorHuntCorrected.set(true);
      this.dialogService.alert('Correction Validée ! 🎉', 'Excellent travail ! La phrase est maintenant correcte.', 'success');
      
      setTimeout(() => {
        if (this.errorHuntIdx() + 1 === words.length) {
          this.finishVocabGame();
        } else {
          this.setupErrorHunt(this.errorHuntIdx() + 1);
        }
      }, 1200);
    } else {
      this.dialogService.alert('Incorrect ✖', 'La correction est erronée. Réessayez !', 'error');
    }
  }
}
"""
    content = content[:start_idx] + clean_bottom_code
    print("Custom games bottom code replaced successfully!")
else:
    print("Error: bottom search string not found!")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("exercises.ts final cleanup complete!")
