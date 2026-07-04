import os

file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\student\exercises.ts'

# Load the file content
with open(file_path, 'rb') as f:
    raw_bytes = f.read()

content = raw_bytes.decode('utf-8').replace('\r\n', '\n')

# Find the start index
start_marker = "<!-- ===== SECTION 3: VOCAB GAMES ===== -->"
start_idx = content.find(start_marker)

# Find the end of the lesson-icon div or the Mode Arcade badge
# Let's locate "Mode Arcade"
mode_arcade_idx = content.find("Mode Arcade", start_idx)

if start_idx == -1 or mode_arcade_idx == -1:
    print(f"Error: Markers not found! start_idx={start_idx}, mode_arcade_idx={mode_arcade_idx}")
    exit(1)

# Find the end of that Mode Arcade div line
end_line_idx = content.find("\n", mode_arcade_idx)

# Let's replace from start_idx to end_line_idx with our new structure
new_block = """<!-- ===== SECTION 3: VOCAB GAMES ===== -->
        @if (activeSubTab() === 'games') {
          <div style="margin-top: 0px; background: #FFFDF5; border: 1.5px solid #FDE68A; border-radius: 16px; padding: 20px; box-shadow: 0 8px 24px rgba(217, 119, 6, 0.04);">
            <div style="font-size: 13px; font-weight: 800; color: #D97706; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4m-2-2v4m7-2h.01M19 12h.01"/></svg>
              <span>L'Arcade des Jeux de Vocabulaire</span>
            </div>
            
            <div class="grid2">
              @for (game of vocabGames(); track game.id) {
                <div class="card exercise-card game-card" (click)="playVocabGame(game)" 
                     style="border-left: 4px solid #D97706; border-radius: 12px; cursor: pointer; transition: all 0.3s; background: white; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.04); position: relative; overflow: hidden;">
                  <!-- Background glow design element -->
                  <div style="position: absolute; top: -20px; right: -20px; width: 60px; height: 60px; background: rgba(217, 119, 6, 0.05); border-radius: 50%;"></div>
                  
                  <div style="padding: 16px;">
                    <div class="lesson-icon amber" style="margin-bottom:12px; width:44px; height:44px; border-radius:12px; background:#FFFBEB; border:1.5px solid #FDE68A; display:flex; align-items:center; justify-content:center">
                      @if (game.gameType === 'flashcards') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="12" height="18" x="3" y="3" rx="2" /><path d="M7 3V21" /><rect width="12" height="18" x="9" y="3" rx="2" /></svg>
                      } @else if (game.gameType === 'matching') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                      } @else if (game.gameType === 'memory') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-3.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-3.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2Z"/></svg>
                      } @else if (game.gameType === 'word_builder') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                      } @else if (game.gameType === 'hangman') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22V2h10a2 2 0 0 1 2 2v2"/><circle cx="16" cy="9" r="3"/><path d="M16 12v6m-3-3h6m-5 5h4"/></svg>
                      } @else if (game.gameType === 'multiple_choice') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
                      } @else {
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3" /></svg>
                      }
                    </div>
                    <div style="font-size: 9px; font-weight: 800; color: #B45309; text-transform: uppercase; background: #FEF3C7; padding: 2px 8px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px; letter-spacing: 0.5px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4m-2-2v4m7-2h.01M19 12h.01"/></svg>
                      Mode Arcade
                    </div>"""

new_content = content[:start_idx] + new_block + content[end_line_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("exercises.ts list icons updated successfully!")
