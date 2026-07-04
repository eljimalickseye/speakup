import os

file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\student\exercises.ts'

# Load the file content
with open(file_path, 'rb') as f:
    raw_bytes = f.read()

content = raw_bytes.decode('utf-8').replace('\r\n', '\n')

# 1. Update line 1 to import computed
content = content.replace("import { Component, inject, signal } from '@angular/core';",
                          "import { Component, inject, signal, computed } from '@angular/core';")

# 2. Inject language signals and labels
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

if "gameLabels = computed" not in content:
    content = content.replace(target_inject, replacement_inject, 1)
    print("Injected language helper and computed labels successfully!")

# 3. getGameLabel and getDiffLabel methods replacement
old_getGameLabel = """  getGameLabel(type: string): string {
    switch (type) {
      case 'matching': return 'Association';
      case 'memory': return 'Jeu de Mémoire';
      case 'flashcards': return 'Flashcards';
      case 'word_builder': return 'Reconstruction';
      case 'hangman': return 'Pendu';
      case 'multiple_choice': return 'Choix Multiple';
      default: return 'Jeu';
    }
  }"""

new_getGameLabel = """  getGameLabel(type: string): string {
    switch (type) {
      case 'matching': return this.t('Association', 'Matching');
      case 'memory': return this.t('Jeu de Mémoire', 'Memory Game');
      case 'flashcards': return this.t('Flashcards', 'Flashcards');
      case 'word_builder': return this.t('Reconstruction', 'Word Builder');
      case 'hangman': return this.t('Pendu', 'Hangman');
      case 'multiple_choice': return this.t('Choix Multiple', 'Multiple Choice');
      default: return this.t('Jeu', 'Game');
    }
  }"""

old_getDiffLabel = """  getDiffLabel(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'Facile';
      case 'medium': return 'Moyen';
      case 'hard': return 'Difficile';
      default: return difficulty;
    }
  }"""

new_getDiffLabel = """  getDiffLabel(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return this.t('Facile', 'Easy');
      case 'medium': return this.t('Moyen', 'Medium');
      case 'hard': return this.t('Difficile', 'Hard');
      default: return difficulty;
    }
  }"""

content = content.replace(old_getGameLabel, new_getGameLabel)
content = content.replace(old_getDiffLabel, new_getDiffLabel)

# 4. Replace game configuration screen template
content = content.replace("<span>Configuration du Jeu</span>", "<span>{{ gameLabels().configTitle }}</span>")
content = content.replace("Personnalisez votre session de jeu avant de commencer !", "{{ gameLabels().configDesc }}")
content = content.replace("Difficulté\n                      </label>", "{{ gameLabels().difficultyLabel }}\n                      </label>")
content = content.replace("Catégorie\n                      </label>", "{{ gameLabels().categoryLabel }}\n                      </label>")
content = content.replace("Limite de Temps (par mot)\n                      </label>", "{{ gameLabels().timerLabel }}\n                      </label>")
content = content.replace("{{ t === 'No limit' ? 'Aucune' : t }}", "{{ t === 'No limit' ? gameLabels().noLimitOption : t }}")
content = content.replace("<span>Commencer le Jeu</span>", "<span>{{ gameLabels().startGameBtn }}</span>")

# 5. HUD elements
content = content.replace("Temps restant : {{ secondsLeft() }}s", "{{ gameLabels().timeLeftLabel }} : {{ secondsLeft() }}s")
content = content.replace("Vies restantes : {{ hangmanLives() }} / 6", "{{ gameLabels().livesLeftLabel }} : {{ hangmanLives() }} / 6")

# 6. Card/Word/Question counters
content = content.replace("Carte {{ currentCardIdx() + 1 }} sur {{ activeWords().length }}", 
                          "{{ gameLabels().cardCounter(currentCardIdx() + 1, activeWords().length) }}")
content = content.replace("Mot {{ wordBuilderIdx() + 1 }} sur {{ activeWords().length }}", 
                          "{{ gameLabels().wordCounter(wordBuilderIdx() + 1, activeWords().length) }}")
content = content.replace("Mot {{ hangmanIdx() + 1 }} sur {{ activeWords().length }}", 
                          "{{ gameLabels().wordCounter(hangmanIdx() + 1, activeWords().length) }}")
content = content.replace("Question {{ mcGameIdx() + 1 }} sur {{ activeWords().length }}", 
                          "{{ gameLabels().questionCounter(mcGameIdx() + 1, activeWords().length) }}")

# 7. Prompts in templates
content = content.replace('color:#D97706; text-transform:uppercase">Traduire le mot :</span>',
                          'color:#D97706; text-transform:uppercase">{{ gameLabels().translateWordPrompt }}</span>')
content = content.replace('color:#EF4444; text-transform:uppercase">Indice / Traduction :</span>',
                          'color:#EF4444; text-transform:uppercase">{{ gameLabels().definitionTranslationPrompt }}</span>')
content = content.replace('color:#4F46E5; text-transform:uppercase">Complétez la phrase :</span>',
                          'color:#4F46E5; text-transform:uppercase">{{ gameLabels().completeSentencePrompt }}</span>')
content = content.replace('color:#4F46E5; text-transform:uppercase">Définition / Traduction :</span>',
                          'color:#4F46E5; text-transform:uppercase">{{ gameLabels().definitionTranslationPrompt }}</span>')

# 8. Button actions
content = content.replace("Je savais\n                              </button>", 
                          "{{ t('Je savais', 'I knew it') }}\n                              </button>")
content = content.replace("À réviser\n                              </button>", 
                          "{{ t('À réviser', 'To review') }}\n                              </button>")
content = content.replace("Précédent</button>", "{{ gameLabels().prevBtn }}</button>")
content = content.replace("{{ currentCardIdx() + 1 === activeWords().length ? 'Terminer' : 'Suivant' }}",
                          "{{ currentCardIdx() + 1 === activeWords().length ? gameLabels().finishBtn : gameLabels().nextBtn }}")
content = content.replace("Réinitialiser\n                      </button>", 
                          "{{ gameLabels().resetBtn }}\n                      </button>")

# Speak / Listen button texts
content = content.replace("Écouter\n                              </button>", 
                          "{{ gameLabels().listenBtn }}\n                              </button>")
content = content.replace("Écouter\n                                  </button>", 
                          "{{ gameLabels().listenBtn }}\n                                  </button>")

# Hover titles
content = content.replace('title="Prononcer le mot anglais">', '[title]="t(\'Prononcer le mot anglais\', \'Pronounce the English word\')">')
content = content.replace('title="Prononcer">', '[title]="t(\'Prononcer\', \'Pronounce\')">')

# 9. Results Screen
content = content.replace("Session Terminée ! 🎉", "{{ gameLabels().resultsTitle }}")
content = content.replace("Voici vos résultats détaillés pour :", "{{ gameLabels().resultsDesc }}")
content = content.replace('color:var(--text-muted); text-transform:uppercase;">Réussite</span>',
                          'color:var(--text-muted); text-transform:uppercase;">{{ gameLabels().successRateLabel }}</span>')
content = content.replace('color:var(--text-muted); text-transform:uppercase;">Erreurs</span>',
                          'color:var(--text-muted); text-transform:uppercase;">{{ gameLabels().errorsLabel }}</span>')
content = content.replace('color:var(--text-muted); text-transform:uppercase;">Temps Écoulé</span>',
                          'color:var(--text-muted); text-transform:uppercase;">{{ gameLabels().timeSpentLabel }}</span>')
content = content.replace('color:var(--text-muted); text-transform:uppercase;">XP Remportés</span>',
                          'color:var(--text-muted); text-transform:uppercase;">{{ gameLabels().xpEarnedLabel }}</span>')

# Correct counts:
content = content.replace("({{ gameCorrectCount() }} / {{ activeWords().length }} correct)",
                          "({{ gameCorrectCount() }} / {{ activeWords().length }} {{ t('correct', 'correct') }})")

# Badges and other badge copy (fixed errorsBadge to include closing tag)
content = content.replace("secondes passées</span>", "{{ gameLabels().timeSpentBadge }}</span>")
content = content.replace("fautes relevées</span>", "{{ gameLabels().errorsBadge }}</span>")
content = content.replace("ajoutés au profil</span>", "{{ gameLabels().xpEarnedBadge }}</span>")
content = content.replace("Badges Décrochés 🎖️", "{{ gameLabels().badgesEarnedLabel }}")
content = content.replace("Réviser les erreurs ({{ gameMistakesCount() }} mots)",
                          "{{ gameLabels().reviewMistakesBtn(gameMistakesCount()) }}")
content = content.replace("Quitter\n                      </button>", "{{ gameLabels().exitBtn }}\n                      </button>")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("exercises.ts student client games translations updated successfully!")
