file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\teacher\exercises-manager.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Inject activeLang and t() inside class body
class_header = "export class TeacherExercisesManagerComponent {"
inject_header = """export class TeacherExercisesManagerComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  activeLang = this.db.activeLang;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }"""

content = content.replace("export class TeacherExercisesManagerComponent {\n  private db = inject(DatabaseService);\n  private dialogService = inject(DialogService);", inject_header)

# 2. Let's replace template text in HTML
# Tab Bar:
content = content.replace("Liste des Exercices ({{ filteredExercises().length }})", "{{ t('Liste des Exercices', 'Exercises List') }} ({{ filteredExercises().length }})")
content = content.replace('{{ selectedExerciseId() ? "Modifier l\'Exercice" : "Créer un Exercice" }}', "{{ selectedExerciseId() ? t(\"Modifier l'Exercice\", \"Edit Exercise\") : t(\"Créer un Exercice\", \"Create Exercise\") }}")

# Headers:
content = content.replace("Exercices d'Entraînement Autonomes", "{{ t(\"Exercices d'Entraînement Autonomes\", \"Autonomous Practice Exercises\") }}")
content = content.replace("Créez et publiez des activités d'entraînement indépendantes pour vos élèves.", "{{ t(\"Créez et publiez des activités d'entraînement indépendantes pour vos élèves.\", \"Create and publish independent practice activities for your students.\") }}")
content = content.replace("Nouvel Exercice", "{{ t('Nouvel Exercice', 'New Exercise') }}")

# Chips & Grid headers:
content = content.replace("Tous les types", "{{ t('Tous les types', 'All types') }}")
content = content.replace("Niveau:", "{{ t('Niveau:', 'Level:') }}")
content = content.replace("XP :", "{{ t('XP :', 'XP:') }}")
content = content.replace("Groupe :", "{{ t('Groupe :', 'Group:') }}")
content = content.replace("Publier", "{{ t('Publier', 'Publish') }}")
content = content.replace("Modifier", "{{ t('Modifier', 'Edit') }}")
content = content.replace("Supprimer", "{{ t('Supprimer', 'Delete') }}")
content = content.replace("Aucun exercice trouvé", "{{ t('Aucun exercice trouvé', 'No exercises found') }}")
content = content.replace("Commencez par créer votre premier exercice d'entraînement.", "{{ t(\"Commencez par créer votre premier exercice d'entraînement.\", \"Get started by creating your first practice exercise.\") }}")
content = content.replace("Créer un exercice", "{{ t('Créer un exercice', 'Create an exercise') }}")

# Step 1:
content = content.replace("Étape 1 : Sélectionnez le type d'exercice", "{{ t(\"Étape 1 : Sélectionnez le type d'exercice\", \"Step 1: Select the exercise type\") }}")
content = content.replace("Continuer", "{{ t('Continuer', 'Continue') }}")

# Step 2:
content = content.replace("{{ selectedExerciseId() ? \"Modifier l'Exercice\" : \"Créer un Nouvel Exercice d'Entraînement\" }}", "{{ selectedExerciseId() ? t(\"Modifier l'Exercice\", \"Edit Exercise\") : t(\"Créer un Nouvel Exercice d'Entraînement\", \"Create a New Practice Exercise\") }}")
content = content.replace("Retour à l'étape 1", "{{ t(\"Retour à l'étape 1\", \"Back to Step 1\") }}")
content = content.replace("Type Sélectionné :", "{{ t('Type Sélectionné :', 'Selected Type:') }}")
content = content.replace("Titre de l'exercice", "{{ t(\"Titre de l'exercice\", \"Exercise Title\") }}")
content = content.replace('placeholder="ex. Description de vacances de rêve ou Pratique orale du Past Simple"', '[placeholder]="t(\'ex. Description de vacances de rêve ou Pratique orale du Past Simple\', \'e.g. Dream vacation description or Past Simple speaking practice\')"')
content = content.replace("Niveau Cible", "{{ t('Niveau Cible', 'Target Level') }}")
content = content.replace("XP à remporter", "{{ t('XP à remporter', 'XP to earn') }}")
content = content.replace("Assigner au Groupe", "{{ t('Assigner au Groupe', 'Assign to Group') }}")
content = content.replace("Aucun groupe spécifique", "{{ t('Aucun groupe spécifique', 'No specific group') }}")
content = content.replace("Statut", "{{ t('Statut', 'Status') }}")
content = content.replace("Publié (Visible immédiatement par la classe)", "{{ t('Publié (Visible immédiatement par la classe)', 'Published (Visible immediately to class)') }}")
content = content.replace("Brouillon (Sauvegardé sans publier)", "{{ t('Brouillon (Sauvegardé sans publier)', 'Draft (Saved without publishing)') }}")

# Options list translate in template:
content = content.replace("<h4 style=\"font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0;\">{{ t.label }}</h4>", """<h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0;">
                      {{ t(
                        'writing' === t.value ? 'Rédaction' : 
                        'speaking' === t.value ? 'Expression Orale' : 
                        'listening' === t.value ? 'Compréhension Orale' : 
                        'translation' === t.value ? 'Traduction' : 
                        'pronunciation' === t.value ? 'Prononciation' : 
                        'Vocabulaire', 
                        t.label
                      ) }}
                    </h4>""")
content = content.replace("<p style=\"font-size: 11px; color: var(--text-muted); margin: 0; line-height: 1.4;\">{{ t.desc }}</p>", """<p style="font-size: 11px; color: var(--text-muted); margin: 0; line-height: 1.4;">
                      {{ t(
                        'writing' === t.value ? 'Sujets rédigés libres avec correction manuelle.' :
                        'speaking' === t.value ? 'Entraînement oraux libres ou audio prompts.' :
                        'listening' === t.value ? 'Vidéo YouTube avec résumé/questions ou réponse libre.' :
                        'translation' === t.value ? 'Passages FR ➔ EN ou EN ➔ FR à traduire.' :
                        'pronunciation' === t.value ? 'Texte à prononcer avec enregistrement audio.' :
                        'Thème et liste de vocabulaire avec exercices associés.',
                        'writing' === t.value ? 'Free writing subjects with manual grading.' :
                        'speaking' === t.value ? 'Free speaking practice or audio prompts.' :
                        'listening' === t.value ? 'YouTube video with summary/questions or free response.' :
                        'translation' === t.value ? 'French ➔ English or English ➔ French passages to translate.' :
                        'pronunciation' === t.value ? 'Text to read aloud with audio recording.' :
                        'Theme and list of vocabulary words with practice exercises.'
                      ) }}
                    </p>""")

# Select option translations:
content = content.replace("A1 — Débutant", "A1 — {{ t('Débutant', 'Beginner') }}")
content = content.replace("A2 — Élémentaire", "A2 — {{ t('Élémentaire', 'Elementary') }}")
content = content.replace("B1 — Intermédiaire", "B1 — {{ t('Intermédiaire', 'Intermediate') }}")
content = content.replace("B2 — Intermédiaire Supérieur", "B2 — {{ t('Intermédiaire Supérieur', 'Upper Intermediate') }}")
content = content.replace("C1 — Avancé", "C1 — {{ t('Avancé', 'Advanced') }}")

# Type-specific inputs:
content = content.replace("Sujet de rédaction / Consigne", "{{ t('Sujet de rédaction / Consigne', 'Writing Subject / Instructions') }}")
content = content.replace('placeholder="Décrivez le sujet, les consignes et le nombre de mots minimum. ex. Décrivez vos vacances de rêve en 150 mots minimum..."', '[placeholder]="t(\'Décrivez le sujet, les consignes et le nombre de mots minimum. ex. Décrivez vos vacances de rêve en 150 mots minimum...\', \'Describe the subject, guidelines and minimum word count. e.g. Describe your dream vacation in at least 150 words...\')"')

content = content.replace("Consigne / Instructions d'expression orale", "{{ t(\"Consigne / Instructions d'expression orale\", \"Speaking Instructions / Prompts\") }}")
content = content.replace('placeholder="ex. Présentez-vous en anglais. Parlez pendant au moins 45 secondes de votre nom, âge, passions et profession."', '[placeholder]="t(\'ex. Présentez-vous en anglais. Parlez pendant au moins 45 secondes de votre nom, âge, passions et profession.\', \'e.g. Introduce yourself in English. Speak for at least 45 seconds about your name, age, hobbies and job.\')"')

content = content.replace("Lien Vidéo YouTube", "{{ t('Lien Vidéo YouTube', 'YouTube Video Link') }}")
content = content.replace("Consignes d'écoute / Questions", "{{ t(\"Consignes d'écoute / Questions\", \"Listening Instructions / Questions\") }}")
content = content.replace('placeholder="Instructions : Écoutez la vidéo deux fois et résumez les arguments principaux, ou répondez aux questions suivantes..."', '[placeholder]="t(\'Instructions : Écoutez la vidéo deux fois et résumez les arguments principaux, ou répondez aux questions suivantes...\', \'Instructions: Listen to the video twice and summarize the main arguments, or answer the following questions...\')"')

content = content.replace("Direction de la traduction", "{{ t('Direction de la traduction', 'Translation Direction') }}")
content = content.replace("Français vers Anglais (FR ➔ EN)", "{{ t('Français vers Anglais (FR ➔ EN)', 'French to English (FR ➔ EN)') }}")
content = content.replace("Anglais vers Français (EN ➔ FR)", "{{ t('Anglais vers Français (EN ➔ FR)', 'English to French (EN ➔ FR)') }}")
content = content.replace("Texte à traduire", "{{ t('Texte à traduire', 'Text to Translate') }}")
content = content.replace('placeholder="Bonjour, je m\'appelle David. J\'adore voyager dans des pays chauds..."', '[placeholder]="t(\'Bonjour, je m\\\'appelle David. J\\\'adore voyager dans des pays chauds...\', \'Hello, my name is David. I love traveling to warm countries...\')"')

content = content.replace("Phrase / Paragraphe à prononcer", "{{ t('Phrase / Paragraphe à prononcer', 'Sentence / Paragraph to Pronounce') }}")
content = content.replace('placeholder="ex. The quick brown fox jumps over the lazy dog."', '[placeholder]="t(\'ex. The quick brown fox jumps over the lazy dog.\', \'e.g. The quick brown fox jumps over the lazy dog.\')"')

content = content.replace("Nom du Thème / Catégorie", "{{ t('Nom du Thème / Catégorie', 'Theme Name / Category') }}")
content = content.replace('placeholder="ex. Voyage, Affaires, Nourriture, Cuisine"', '[placeholder]="t(\'ex. Voyage, Affaires, Nourriture, Cuisine\', \'e.g. Travel, Business, Food, Cooking\')"')
content = content.replace("Liste de mots (un mot/expression par ligne)", "{{ t('Liste de mots (un mot/expression par ligne)', 'Word list (one word/phrase per line)') }}")
content = content.replace('placeholder="Airport&#10;Passport&#10;Flight&#10;Boarding Pass"', '[placeholder]="t(\'Airport\\nPassport\\nFlight\\nBoarding Pass\', \'Airport\\nPassport\\nFlight\\nBoarding Pass\')"')

# Action buttons inside edit form:
content = content.replace("Annuler", "{{ t('Annuler', 'Cancel') }}")
content = content.replace("{{ selectedExerciseId() ? 'Mettre à jour' : 'Enregistrer' }}", "{{ selectedExerciseId() ? t('Mettre à jour', 'Update') : t('Enregistrer', 'Save') }}")

# Preview Panel:
content = content.replace("Aperçu Élève (Student Preview)", "{{ t('Aperçu Élève', 'Student Preview') }}")
content = content.replace("{{ formTitle || 'Titre de l\\'exercice' }}", "{{ formTitle || t('Titre de l\\'exercice', 'Exercise Title') }}")
content = content.replace("Level {{ formLevel }}", "Level {{ formLevel }}") # same
content = content.replace("{{ formPoints }} XP", "{{ formPoints }} XP") # same

content = content.replace("✍️ Subject", "✍️ {{ t('Sujet', 'Subject') }}")
content = content.replace("{{ formSubject || 'Saisissez le sujet à gauche...' }}", "{{ formSubject || t('Saisissez le sujet à gauche...', 'Enter the subject on the left...') }}")
content = content.replace('placeholder="L\'élève saisira sa réponse ici..."', '[placeholder]="t(\'L\\\'élève saisira sa réponse ici...\', \'Student will type their response here...\')"')
content = content.replace("Submit", "{{ t('Soumettre', 'Submit') }}")

content = content.replace("🎙️ Speaking Prompt", "🎙️ {{ t('Consigne', 'Prompt') }}")
content = content.replace("{{ formSpeakingPrompt || 'Saisissez la consigne orale à gauche...' }}", "{{ formSpeakingPrompt || t('Saisissez la consigne orale à gauche...', 'Enter speaking prompt on the left...') }}")
content = content.replace("Start Oral Recording", "{{ t(\"Démarrer l'enregistrement\", 'Start Oral Recording') }}")
content = content.replace("Click to speak and record response", "{{ t('Cliquez pour parler et enregistrer la réponse', 'Click to speak and record response') }}")
content = content.replace("Submit Response", "{{ t('Soumettre la réponse', 'Submit Response') }}")

content = content.replace("Watch on YouTube", "{{ t('Regarder sur YouTube', 'Watch on YouTube') }}")
content = content.replace("👂 Instructions", "👂 {{ t('Instructions', 'Instructions') }}")
content = content.replace("{{ formListeningInstruction || 'Saisissez les instructions d\'écoute à gauche...' }}", "{{ formListeningInstruction || t('Saisissez les instructions d\'écoute à gauche...', 'Enter listening instructions on the left...') }}")

content = content.replace("🌍 Text to translate ({{ formTranslationDirection === 'fr-en' ? 'FR → EN' : 'EN → FR' }})", "🌍 {{ t('Texte à traduire', 'Text to translate') }} ({{ formTranslationDirection === 'fr-en' ? 'FR → EN' : 'EN → FR' }})")
content = content.replace("{{ formTextToTranslate || 'Saisissez le texte à traduire à gauche...' }}", "{{ formTextToTranslate || t('Saisissez le texte à traduire à gauche...', 'Enter text to translate on the left...') }}")
content = content.replace('placeholder="L\'élève saisira sa traduction ici..."', '[placeholder]="t(\'L\\\'élève saisira sa traduction ici...\', \'Student will type translation here...\')"')
content = content.replace("Submit Translation", "{{ t('Soumettre la traduction', 'Submit Translation') }}")

content = content.replace("🔊 Read this aloud:", "🔊 {{ t('Lire à voix haute :', 'Read this aloud:') }}")
content = content.replace("{{ formTextToPronounce || 'Saisissez la phrase à prononcer à gauche...' }}", "{{ formTextToPronounce || t('Saisissez la phrase à prononcer à gauche...', 'Enter sentence to pronounce on the left...') }}")
content = content.replace("Record pronunciation of the text", "{{ t('Enregistrez la prononciation du texte', 'Record pronunciation of the text') }}")

content = content.replace("📚 Review Mode (Flashcard)", "📚 {{ t('Mode Révision (Flashcard)', 'Review Mode (Flashcard)') }}")
content = content.replace("Exemple de mot configuré", "{{ t('Exemple de mot configuré', 'Example of configured word') }}")
content = content.replace("Saisissez les mots dans la liste à gauche...", "{{ t('Saisissez les mots dans la liste à gauche...', 'Enter words in the list on the left...') }}")
content = content.replace("Précédent", "{{ t('Précédent', 'Previous') }}")
content = content.replace("Suivant", "{{ t('Suivant', 'Next') }}")

# 3. Translate dynamic alerts in TS code at the bottom:
# Let's locate deleteExercise:
content = content.replace("""  async deleteExercise(ex: Exercise) {
    this.dialogService.confirm(
      'Delete Exercise',
      `Are you sure you want to delete the exercise "${ex.title}"? This action cannot be undone.`,
      async () => {
        await this.db.deleteExercise(ex.id);
        this.dialogService.alert('Deleted', 'Exercise deleted successfully.', 'success');
      }
    );
  }""", """  async deleteExercise(ex: Exercise) {
    this.dialogService.confirm(
      this.t("Supprimer l'Exercice", "Delete Exercise"),
      this.t(`Voulez-vous vraiment supprimer l'exercice "${ex.title}" ? Cette action est irréversible.`, `Are you sure you want to delete the exercise "${ex.title}"? This action cannot be undone.`),
      async () => {
        await this.db.deleteExercise(ex.id);
        this.dialogService.alert(
          this.t('Supprimé', 'Deleted'),
          this.t("L'exercice a été supprimé avec succès.", "Exercise deleted successfully."),
          'success'
        );
      }
    );
  }""")

content = content.replace("""  async publishExercise(ex: Exercise) {
    await this.db.updateExercise(ex.id, { status: 'published' });
    this.dialogService.alert('Published', 'Exercise published successfully!', 'success');
  }""", """  async publishExercise(ex: Exercise) {
    await this.db.updateExercise(ex.id, { status: 'published' });
    this.dialogService.alert(
      this.t('Publié', 'Published'),
      this.t("L'exercice a été publié avec succès !", "Exercise published successfully!"),
      'success'
    );
  }""")

# Let's check saveExercise validation and success alerts:
content = content.replace("""    if (!this.formTitle.trim()) {
      this.dialogService.alert('Error', 'Please enter a title for the exercise.', 'info');
      return;
    }""", """    if (!this.formTitle.trim()) {
      this.dialogService.alert(
        this.t('Erreur', 'Error'),
        this.t("Veuillez saisir un titre pour l'exercice.", "Please enter a title for the exercise."),
        'info'
      );
      return;
    }""")

content = content.replace("""      if (id) {
        await this.db.updateExercise(id, exerciseData);
        this.dialogService.alert('Success', 'Exercise updated successfully.', 'success');
      } else {
        await this.db.addExercise(exerciseData);
        this.dialogService.alert('Success', 'Exercise created successfully.', 'success');

        if (this.formStatus === 'published') {
          await this.db.sendNotification({
            recipientId: 'all',
            recipientRole: 'student',
            type: 'exercise_assigned',
            title: '🎯 New exercise available',
            message: `"${this.formTitle}" has been published by ${user?.name || 'your teacher'}`
          });
        }
      }""", """      if (id) {
        await this.db.updateExercise(id, exerciseData);
        this.dialogService.alert(
          this.t('Succès', 'Success'),
          this.t("L'exercice a été mis à jour avec succès.", "Exercise updated successfully."),
          'success'
        );
      } else {
        await this.db.addExercise(exerciseData);
        this.dialogService.alert(
          this.t('Succès', 'Success'),
          this.t("L'exercice a été créé avec succès.", "Exercise created successfully."),
          'success'
        );

        if (this.formStatus === 'published') {
          await this.db.sendNotification({
            recipientId: 'all',
            recipientRole: 'student',
            type: 'exercise_assigned',
            title: this.t('🎯 Nouvel exercice disponible', '🎯 New exercise available'),
            message: this.t(`"${this.formTitle}" a été publié par ${user?.name || 'votre professeur'}`, `"${this.formTitle}" has been published by ${user?.name || 'your teacher'}`)
          });
        }
      }""")

content = content.replace("""    } catch (e: any) {
      this.dialogService.alert('Error', `An error occurred: ${e.message}`, 'info');
    }""", """    } catch (e: any) {
      this.dialogService.alert(
        this.t('Erreur', 'Error'),
        this.t(`Une erreur est survenue : ${e.message}`, `An error occurred: ${e.message}`),
        'info'
      );
    }""")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("exercises-manager.ts fully translated!")
