import os

file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\student\exercises.ts'

# Load the file content
with open(file_path, 'rb') as f:
    raw_bytes = f.read()

content = raw_bytes.decode('utf-8').replace('\r\n', '\n')

# 1. Insert activeLang, t, and gameLabels if not already done
target_inject = "  private db = inject(DatabaseService);"
replacement_inject = """  private db = inject(DatabaseService);

  activeLang = this.db.activeLang;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

  gameLabels = computed(() => ({
    configTitle: this.t("Configuration du Jeu", "Game Configuration"),
    configDesc: this.t("Personnalisez votre session de jeu avant de commencer !", "Customize your game session before starting!"),
    difficultyLabel: this.t("Difficulté", "Difficulty"),
    categoryLabel: this.t("Catégorie", "Category"),
    timerLabel: this.t("Limite de Temps (par mot)", "Time Limit (per word)"),
    noLimitOption: this.t("Aucune", "No limit"),
    startGameBtn: this.t("Commencer le Jeu", "Start Game"),
    timeLeftLabel: this.t("Temps restant", "Time remaining"),
    livesLeftLabel: this.t("Vies restantes", "Lives remaining"),
    resetBtn: this.t("Réinitialiser", "Reset"),
    prevBtn: this.t("Précédent", "Previous"),
    nextBtn: this.t("Suivant", "Next"),
    finishBtn: this.t("Terminer", "Finish"),
    cardCounter: (curr: number, total: number) => this.t(`Carte ${curr} sur ${total}`, `Card ${curr} of ${total}`),
    wordCounter: (curr: number, total: number) => this.t(`Mot ${curr} sur ${total}`, `Word ${curr} of ${total}`),
    questionCounter: (curr: number, total: number) => this.t(`Question ${curr} sur ${total}`, `Question ${curr} of ${total}`),
    translateWordPrompt: this.t("Traduire le mot :", "Translate the word:"),
    completeSentencePrompt: this.t("Complétez la phrase :", "Complete the sentence:"),
    definitionTranslationPrompt: this.t("Définition / Traduction :", "Definition / Translation:"),
    listenBtn: this.t("Écouter", "Listen"),
    wordMatchHint: this.t("Cliquer pour retourner", "Click to flip"),
    resultsTitle: this.t("Session Terminée ! 🎉", "Session Finished! 🎉"),
    resultsDesc: this.t("Voici vos résultats détaillés pour :", "Here are your detailed results for:"),
    successRateLabel: this.t("Réussite", "Success Rate"),
    errorsLabel: this.t("Erreurs", "Mistakes"),
    errorsBadge: this.t("fautes relevées", "mistakes found"),
    timeSpentLabel: this.t("Temps Écoulé", "Time Spent"),
    timeSpentBadge: this.t("secondes passées", "seconds spent"),
    xpEarnedLabel: this.t("XP Remportés", "XP Earned"),
    xpEarnedBadge: this.t("ajoutés au profil", "added to profile"),
    badgesEarnedLabel: this.t("Badges Décrochés 🎖️", "Badges Earned 🎖️"),
    reviewMistakesBtn: (count: number) => this.t(`Réviser les erreurs (${count} mots)`, `Review mistakes (${count} words)`),
    exitBtn: this.t("Quitter", "Exit")
  }));"""

if "gameLabels = computed(()" not in content:
    if target_inject in content:
        content = content.replace(target_inject, replacement_inject, 1)
        print("Injected language helper and computed labels successfully!")
    else:
        print("Error: db inject not found!")
        exit(1)
else:
    print("Language helper and computed labels already injected.")

# 2. Replace getGameLabel and getDiffLabel methods to return translations
# We do the substring replacement which is robust:
if "Matching" not in content:
    content = content.replace("case 'matching': return 'Association';", "case 'matching': return this.t('Association', 'Matching');")
    content = content.replace("case 'memory': return 'Jeu de Mémoire';", "case 'memory': return this.t('Jeu de Mémoire', 'Memory Game');")
    content = content.replace("case 'word_builder': return 'Reconstruction';", "case 'word_builder': return this.t('Reconstruction', 'Word Builder');")
    content = content.replace("case 'hangman': return 'Pendu';", "case 'hangman': return this.t('Pendu', 'Hangman');")
    content = content.replace("case 'multiple_choice': return 'Choix Multiple';", "case 'multiple_choice': return this.t('Choix Multiple', 'Multiple Choice');")
    content = content.replace("default: return 'Jeu';", "default: return this.t('Jeu', 'Game');")
    content = content.replace("case 'easy': return 'Facile';", "case 'easy': return this.t('Facile', 'Easy');")
    content = content.replace("case 'medium': return 'Moyen';", "case 'medium': return this.t('Moyen', 'Medium');")
    content = content.replace("case 'hard': return 'Difficile';", "case 'hard': return this.t('Difficile', 'Hard');")
    print("Replaced getGameLabel and getDiffLabel successfully!")
else:
    print("getGameLabel and getDiffLabel already updated.")

# 3. Overhaul configuration screen template translations using robust substring search
config_start_idx = content.find("@if (isConfiguring()) {")
config_end_idx = content.find("} @else if (!gameFinished()) {", config_start_idx)

if config_start_idx == -1 or config_end_idx == -1:
    print(f"Error: configuration block not found! start={config_start_idx}, end={config_end_idx}")
    exit(1)

# Find the end of the line before the block or keep the indentation
# Let's replace the configuring block
# Let's check: we want to replace from config_start_idx to config_end_idx (not including the end marker)

new_config_block = """@if (isConfiguring()) {
                  <!-- CONFIGURATION SCREEN -->
                  <div style="padding: 10px 0; animation: fadeIn 0.25s ease-out;">
                    <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px 0; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                      <span>{{ gameLabels().configTitle }}</span>
                    </h3>
                    <p style="font-size: 12.5px; color: var(--text-secondary); margin: 0 0 20px 0; text-align: center;">
                      {{ gameLabels().configDesc }}
                    </p>

                    <!-- Difficulty Selection -->
                    <div style="margin-bottom: 20px;">
                      <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                        {{ gameLabels().difficultyLabel }}
                      </label>
                      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                        @for (diff of difficultyLevels; track diff) {
                          <button (click)="selectedConfigDifficulty.set(diff)"
                                  [style.background]="selectedConfigDifficulty() === diff ? '#FFF9E6' : '#FFF'"
                                  [style.border-color]="selectedConfigDifficulty() === diff ? '#D97706' : 'var(--border)'"
                                  [style.color]="selectedConfigDifficulty() === diff ? '#B45309' : 'var(--text-primary)'"
                                  style="padding: 10px; border-radius: 8px; border: 1.5px solid; font-size: 13px; font-weight: 700; cursor: pointer; text-align: center; transition: all 0.2s;">
                            {{ getDiffLabel(diff) }}
                          </button>
                        }
                      </div>
                    </div>

                    <!-- Category Selection -->
                    <div style="margin-bottom: 20px;">
                      <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                        {{ gameLabels().categoryLabel }}
                      </label>
                      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        @for (cat of getAvailableCategories(); track cat) {
                          <button (click)="selectedConfigCategory.set(cat)"
                                  [style.background]="selectedConfigCategory() === cat ? '#EFF6FF' : '#FFF'"
                                  [style.border-color]="selectedConfigCategory() === cat ? '#4F46E5' : 'var(--border)'"
                                  [style.color]="selectedConfigCategory() === cat ? '#1E40AF' : 'var(--text-primary)'"
                                  style="padding: 6px 12px; border-radius: 20px; border: 1.5px solid; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                            {{ cat }}
                          </button>
                        }
                      </div>
                    </div>

                    <!-- Timer Selection -->
                    <div style="margin-bottom: 24px;">
                      <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                        {{ gameLabels().timerLabel }}
                      </label>
                      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                        @for (t of ['No limit', '15s', '30s', '60s']; track t) {
                          <button (click)="selectedConfigTimer.set(t)"
                                  [style.background]="selectedConfigTimer() === t ? '#ECFDF5' : '#FFF'"
                                  [style.border-color]="selectedConfigTimer() === t ? '#10B981' : 'var(--border)'"
                                  [style.color]="selectedConfigTimer() === t ? '#065F46' : 'var(--text-primary)'"
                                  style="padding: 10px 4px; border-radius: 8px; border: 1.5px solid; font-size: 12px; font-weight: 700; cursor: pointer; text-align: center; transition: all 0.2s;">
                            {{ t === 'No limit' ? gameLabels().noLimitOption : t }}
                          </button>
                        }
                      </div>
                    </div>

                    <!-- Start Button -->
                    <button (click)="startGameWithConfig()"
                            style="width: 100%; padding: 14px; background: linear-gradient(135deg, #F59E0B, #D97706); color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25); display: flex; align-items: center; justify-content: center; gap: 8px;">
                      <span>{{ gameLabels().startGameBtn }}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      </svg>
                    </button>
                  </div>
                  
                  """

content = content[:config_start_idx] + new_config_block + content[config_end_idx:]

# 4. HUD Timer label
content = content.replace("Temps restant : {{ secondsLeft() }}s", "{{ gameLabels().timeLeftLabel }} : {{ secondsLeft() }}s")

# 5. HUD Counters
content = content.replace("Carte {{ currentCardIdx() + 1 }} sur {{ activeWords().length }}", 
                          "{{ gameLabels().cardCounter(currentCardIdx() + 1, activeWords().length) }}")
content = content.replace("Mot {{ wordBuilderIdx() + 1 }} sur {{ activeWords().length }}", 
                          "{{ gameLabels().wordCounter(wordBuilderIdx() + 1, activeWords().length) }}")
content = content.replace("Mot {{ hangmanIdx() + 1 }} sur {{ activeWords().length }}", 
                          "{{ gameLabels().wordCounter(hangmanIdx() + 1, activeWords().length) }}")
content = content.replace("Question {{ mcGameIdx() + 1 }} sur {{ activeWords().length }}", 
                          "{{ gameLabels().questionCounter(mcGameIdx() + 1, activeWords().length) }}")
content = content.replace("Vies restantes : {{ hangmanLives() }} / 6", 
                          "{{ gameLabels().livesLeftLabel }} : {{ hangmanLives() }} / 6")

# 6. Prompts
content = content.replace('color:#D97706; text-transform:uppercase">Traduire le mot :</span>',
                          'color:#D97706; text-transform:uppercase">{{ gameLabels().translateWordPrompt }}</span>')
content = content.replace('color:#EF4444; text-transform:uppercase">Indice / Traduction :</span>',
                          'color:#EF4444; text-transform:uppercase">{{ gameLabels().definitionTranslationPrompt }}</span>')
content = content.replace('color:#4F46E5; text-transform:uppercase">Complétez la phrase :</span>',
                          'color:#4F46E5; text-transform:uppercase">{{ gameLabels().completeSentencePrompt }}</span>')
content = content.replace('color:#4F46E5; text-transform:uppercase">Définition / Traduction :</span>',
                          'color:#4F46E5; text-transform:uppercase">{{ gameLabels().definitionTranslationPrompt }}</span>')

# 7. Button Labels
content = content.replace("Je savais", "{{ t('Je savais', 'I knew it') }}")
content = content.replace("À réviser", "{{ t('À réviser', 'To review') }}")
content = content.replace("Précédent", "{{ gameLabels().prevBtn }}")
content = content.replace("{{ currentCardIdx() + 1 === activeWords().length ? 'Terminer' : 'Suivant' }}",
                          "{{ currentCardIdx() + 1 === activeWords().length ? gameLabels().finishBtn : gameLabels().nextBtn }}")
content = content.replace("Réinitialiser", "{{ gameLabels().resetBtn }}")
content = content.replace("Écouter", "{{ gameLabels().listenBtn }}")

# 8. Results Screen
content = content.replace("Session Terminée ! 🎉", "{{ gameLabels().resultsTitle }}")
content = content.replace("Voici vos résultats détaillés pour :", "{{ gameLabels().resultsDesc }}")
content = content.replace("Réussite", "{{ gameLabels().successRateLabel }}")
content = content.replace("correct)", "{{ t('correct', 'correct') }})")
content = content.replace("Erreurs", "{{ gameLabels().errorsLabel }}")
content = content.replace("fautes relevées", "{{ gameLabels().errorsBadge }}")
content = content.replace("Temps Écoulé", "{{ gameLabels().timeSpentLabel }}")
content = content.replace("secondes passées", "{{ gameLabels().timeSpentBadge }}")
content = content.replace("XP Remportés", "{{ gameLabels().xpEarnedLabel }}")
content = content.replace("ajoutés au profil", "{{ gameLabels().xpEarnedBadge }}")
content = content.replace("Badges Décrochés 🎖️", "{{ gameLabels().badgesEarnedLabel }}")
content = content.replace("Réviser les erreurs ({{ gameMistakesCount() }} mots)",
                          "{{ gameLabels().reviewMistakesBtn(gameMistakesCount()) }}")
content = content.replace("Quitter", "{{ gameLabels().exitBtn }}")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("exercises.ts student client games translations updated successfully!")
