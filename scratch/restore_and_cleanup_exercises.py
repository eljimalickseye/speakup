import re

file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\student\exercises.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Delete the duplicate modal workspace (everything from line 1655 to 1791)
# Let's target this using a robust pattern
duplicate_workspace_pattern = r'\}\s+@else\s+\{\s+<div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba\(0,0,0,0.65\);.*?</textarea>\s+@else\s+\{\s+<div.*?</button>\s+\}\s+</div>\s+</div>\s+\}\s+</div>\s+</div>\s+\}'
# Wait, matching 100+ lines of HTML with regex might be complex. Let's find index of '} @else {' at line 1655 and slice.
# Let's inspect where it is.
search_marker = '} @else {'
# We want to find the SECOND occurrence of '} @else {' in the file.
# The first occurrence is at line 493. The second one is at line 1655.
first_occur = content.find(search_marker)
second_occur = content.find(search_marker, first_occur + len(search_marker))

print(f"First occur: {first_occur}, Second occur: {second_occur}")

# If we find the second occurrence, we can find the end of the template (which ends with 'styles: [`')
styles_marker = 'styles: [`'
styles_idx = content.find(styles_marker, second_occur)

# The content between second_occur and styles_idx contains the second modal workspace.
# We want to replace this whole block with just '}\n      </div>\n    `,' so that it closes the first modal workspace correctly.
if second_occur != -1 and styles_idx != -1:
    template_end = '    </div>\n  `,\n  '
    content = content[:second_occur] + template_end + content[styles_idx:]
    print("Duplicate modal template deleted successfully!")
else:
    print("Error: Could not locate second modal workspace template!")

# 2. Fix the stylesheet syntax error: box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); };
content = content.replace("box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); };", "box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }")
print("CSS syntax error corrected!")

# 3. Fix the template call getYouTubeEmbedUrl to getYoutubeEmbedUrl
content = content.replace("getYouTubeEmbedUrl(quiz.youtubeUrl)", "getYoutubeEmbedUrl(quiz.youtubeUrl)")
print("getYouTubeEmbedUrl spelling corrected!")

# 4. Fix dialogService.alert 'error' parameter in submitErrorHuntCorrection
content = content.replace("La correction est erronée. Réessayez !', 'error'", "La correction est erronée. Réessayez !', 'info'")
print("dialogService.alert error param corrected!")

# 5. Restore deleted methods: getAvailableCategories, getDefaultVocabGameObj, startWordTimer, stopWordTimer, handleTimerExpired
# We will insert them right before playVocabGame(game: VocabGame)
play_game_marker = 'playVocabGame(game: VocabGame) {'
play_game_idx = content.find(play_game_marker)

methods_to_insert = """  getAvailableCategories() {
    const list = new Set(['All', 'Food', 'Travel', 'Business', 'Academic', 'General']);
    this.vocabGames().forEach(g => {
      if (g.category) list.add(g.category);
    });
    return Array.from(list);
  }

  getDefaultVocabGameObj(): VocabGame {
    return {
      id: 'default',
      title: 'Word Match (Association)',
      gameType: 'matching',
      difficulty: 'easy',
      category: 'General',
      authorId: 'system',
      createdAt: new Date().toISOString(),
      words: defaultWordsBank
    };
  }

  startWordTimer() {
    this.stopWordTimer();
    if (this.timerLimit() === 0) return;

    this.secondsLeft.set(this.timerLimit());
    this.wordTimerInterval = setInterval(() => {
      this.secondsLeft.update(s => s - 1);
      if (this.secondsLeft() <= 0) {
        this.stopWordTimer();
        this.handleTimerExpired();
      }
    }, 1000);
  }

  stopWordTimer() {
    if (this.wordTimerInterval) {
      clearInterval(this.wordTimerInterval);
      this.wordTimerInterval = null;
    }
  }

  handleTimerExpired() {
    const game = this.activeVocabGame();
    const type = game ? game.gameType : 'matching';
    
    if (type === 'matching' || type === 'memory') {
      this.gameCards().forEach(c => {
        if (!c.matched) {
          const wordText = c.type === 'english' ? c.text : '';
          const wordObj = this.activeWords().find(w => w.word === wordText);
          if (wordObj) this.recordMistake(wordObj);
        }
      });
      this.gameFinished.set(true);
      this.finishVocabGame();
    } else if (type === 'word_builder') {
      const currentWordObj = this.activeWords()[this.wordBuilderIdx()];
      if (currentWordObj) this.recordMistake(currentWordObj);
      this.playErrorSound();
      
      if (this.wordBuilderIdx() + 1 === this.activeWords().length) {
        this.gameFinished.set(true);
        this.finishVocabGame();
      } else {
        this.wordBuilderIdx.update(i => i + 1);
        this.setupWordBuilder(this.wordBuilderIdx());
        this.startWordTimer();
      }
    } else if (type === 'hangman') {
      const currentWordObj = this.activeWords()[this.hangmanIdx()];
      if (currentWordObj) this.recordMistake(currentWordObj);
      this.playErrorSound();
      
      if (this.hangmanIdx() + 1 === this.activeWords().length) {
        this.gameFinished.set(true);
        this.finishVocabGame();
      } else {
        this.hangmanIdx.update(i => i + 1);
        this.setupHangman(this.hangmanIdx());
        this.startWordTimer();
      }
    } else if (type === 'multiple_choice') {
      const currentWordObj = this.activeWords()[this.mcGameIdx()];
      if (currentWordObj) this.recordMistake(currentWordObj);
      this.playErrorSound();
      
      if (this.mcGameIdx() + 1 === this.activeWords().length) {
        this.gameFinished.set(true);
        this.finishVocabGame();
      } else {
        this.mcGameIdx.update(i => i + 1);
        this.setupMCGame(this.mcGameIdx());
        this.startWordTimer();
      }
    } else if (type === 'word_search') {
      this.finishVocabGame();
    } else if (type === 'sentence_order') {
      this.finishVocabGame();
    } else if (type === 'error_hunt') {
      this.finishVocabGame();
    }
  }

"""

if play_game_idx != -1:
    content = content[:play_game_idx] + methods_to_insert + content[play_game_idx:]
    print("Vocab game helper methods restored successfully!")
else:
    print("Error: playVocabGame marker not found!")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("exercises.ts corrections complete!")
