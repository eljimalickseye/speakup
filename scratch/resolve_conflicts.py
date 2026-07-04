import re
import os

file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\student\exercises.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Resolve Word Builder completion conflict
conflict_wb_pattern = r'<<<<<<< Updated upstream\s+if \(this\.wordBuilderIdx\(\) \+ 1 === this\.activeWords\(\)\.length\) \{\s+this\.gameFinished\.set\(true\);\s+this\.finishVocabGame\(\);\s+=======\s+if \(this\.wordBuilderIdx\(\) \+ 1 === game\.words\.length\) \{\s+this\.onVocabGameFinished.*?>>>>>>> Stashed changes'
replacement_wb = """        if (this.wordBuilderIdx() + 1 === this.activeWords().length) {
          this.gameFinished.set(True);
          this.finishVocabGame();"""
content, count_wb = re.subn(conflict_wb_pattern, replacement_wb, content, flags=re.DOTALL)
print(f"Word Builder conflict replaced: {count_wb} times")

# Resolve Hangman completion conflict
conflict_hm_pattern = r'<<<<<<< Updated upstream\s+if \(this\.hangmanIdx\(\) \+ 1 === this\.activeWords\(\)\.length\) \{\s+this\.gameFinished\.set\(true\);\s+this\.finishVocabGame\(\);\s+=======\s+if \(this\.hangmanIdx\(\) \+ 1 === game\.words\.length\) \{\s+this\.onVocabGameFinished.*?>>>>>>> Stashed changes'
replacement_hm = """        if (this.hangmanIdx() + 1 === this.activeWords().length) {
          this.gameFinished.set(True);
          this.finishVocabGame();"""
content, count_hm = re.subn(conflict_hm_pattern, replacement_hm, content, flags=re.DOTALL)
print(f"Hangman conflict replaced: {count_hm} times")

# Resolve Multiple Choice completion conflict
conflict_mc_pattern = r'<<<<<<< Updated upstream\s+if \(this\.mcGameIdx\(\) \+ 1 === this\.activeWords\(\)\.length\) \{\s+this\.gameFinished\.set\(true\);\s+this\.finishVocabGame\(\);\s+=======\s+if \(this\.mcGameIdx\(\) \+ 1 === game\.words\.length\) \{\s+this\.onVocabGameFinished.*?>>>>>>> Stashed changes'
replacement_mc = """      if (this.mcGameIdx() + 1 === this.activeWords().length) {
        this.gameFinished.set(True);
        this.finishVocabGame();"""
content, count_mc = re.subn(conflict_mc_pattern, replacement_mc, content, flags=re.DOTALL)
print(f"Multiple Choice conflict replaced: {count_mc} times")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Remaining conflict resolution complete!")
