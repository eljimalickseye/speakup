import os

file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\teacher\exercises-manager.ts'

# Load the file content
with open(file_path, 'rb') as f:
    raw_bytes = f.read()

content = raw_bytes.decode('utf-8').replace('\r\n', '\n')

# 1. Update startNew() method for direct routing when a specific type is filtered.
old_start_new = """  startNew() {
    this.resetForm();
    this.selectedExerciseId.set(null);
    this.selectedType.set(null);
    this.currentStep.set(1);
    this.setTab('create');
  }"""

new_start_new = """  startNew() {
    this.resetForm();
    this.selectedExerciseId.set(null);
    const filter = this.filterType();
    if (filter && filter !== 'all') {
      this.selectedType.set(filter);
      this.currentStep.set(2);
    } else {
      this.selectedType.set(null);
      this.currentStep.set(1);
    }
    this.setTab('create');
  }"""

content = content.replace(old_start_new, new_start_new)

# 2. Modify template to replace Emojis with SVGs in:
# a) Type filter chips:
old_chip_emoji = "                <span>{{ typeItem.emoji }}</span>"
new_chip_emoji = '                <span style="display:flex; align-items:center" [innerHTML]="typeItem.svg"></span>'
content = content.replace(old_chip_emoji, new_chip_emoji)

# b) Step 1 selector:
old_step1_emoji = '                    <div style="font-size: 28px; margin-bottom: 10px;">{{ typeItem.emoji }}</div>'
new_step1_emoji = '                    <div style="display:flex; align-items:center; justify-content:center; color:#059669; margin-bottom:10px; height:32px" [innerHTML]="typeItem.svgLarge"></div>'
content = content.replace(old_step1_emoji, new_step1_emoji)

# c) Exercises list cards:
old_card_emoji = "                        <span>{{ getTypeEmoji(ex.type) }}</span>"
new_card_emoji = '                        <span style="display:inline-flex; align-items:center" [innerHTML]="getTypeSvg(ex.type)"></span>'
content = content.replace(old_card_emoji, new_card_emoji)

# 3. Update typesList array to hold SVG strings
old_types_list = """  typesList = [
    { value: 'writing', emoji: '✍️', color: '#7C3AED', label: 'Writing', desc: 'Sujets rédigés libres avec correction manuelle.' },
    { value: 'speaking', emoji: '🎙️', color: '#059669', label: 'Speaking', desc: 'Entraînement oraux libres ou audio prompts.' },
    { value: 'listening', emoji: '👂', color: '#0284C7', label: 'Listening', desc: 'Vidéo YouTube avec résumé/questions ou réponse libre.' },
    { value: 'translation', emoji: '🌍', color: '#D97706', label: 'Translation', desc: 'Passages FR ➔ EN ou EN ➔ FR à traduire.' },
    { value: 'pronunciation', emoji: '🔊', color: '#DC2626', label: 'Pronunciation', desc: 'Texte à prononcer avec enregistrement audio.' },
    { value: 'vocabulary', emoji: '📚', color: '#4F46E5', label: 'Vocabulary', desc: 'Thème et liste de vocabulaire avec exercices associés.' }
  ];"""

# We'll define both small and large SVGs (large is used in Step 1 grid card, small in chips and badges)
new_types_list = """  typesList = [
    { 
      value: 'writing', 
      emoji: '✍️', 
      color: '#7C3AED', 
      label: 'Writing', 
      desc: 'Sujets rédigés libres avec correction manuelle.',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
      svgLarge: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>'
    },
    { 
      value: 'speaking', 
      emoji: '🎙️', 
      color: '#059669', 
      label: 'Speaking', 
      desc: 'Entraînement oraux libres ou audio prompts.',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>',
      svgLarge: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>'
    },
    { 
      value: 'listening', 
      emoji: '👂', 
      color: '#0284C7', 
      label: 'Listening', 
      desc: 'Vidéo YouTube avec résumé/questions ou réponse libre.',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
      svgLarge: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0284C7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>'
    },
    { 
      value: 'translation', 
      emoji: '🌍', 
      color: '#D97706', 
      label: 'Translation', 
      desc: 'Passages FR ➔ EN ou EN ➔ FR à traduire.',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>',
      svgLarge: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>'
    },
    { 
      value: 'pronunciation', 
      emoji: '🔊', 
      color: '#DC2626', 
      label: 'Pronunciation', 
      desc: 'Texte à prononcer avec enregistrement audio.',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>',
      svgLarge: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>'
    },
    { 
      value: 'vocabulary', 
      emoji: '📚', 
      color: '#4F46E5', 
      label: 'Vocabulary', 
      desc: 'Thème et liste de vocabulaire avec exercices associés.',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z"/></svg>',
      svgLarge: '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z"/></svg>'
    }
  ];"""

content = content.replace(old_types_list, new_types_list)

# 4. Add helper method getTypeSvg
helper_method = """  getTypeSvg(type: string): string {
    const item = this.typesList.find(t => t.value === type);
    return item ? item.svg : '';
  }"""

# Insert right after getTypeEmoji definition:
old_get_emoji = """  getTypeEmoji(type: string): string {
    const item = this.typesList.find(t => t.value === type);
    return item ? item.emoji : '🎯';
  }"""

new_get_emoji = """  getTypeEmoji(type: string): string {
    const item = this.typesList.find(t => t.value === type);
    return item ? item.emoji : '🎯';
  }

  getTypeSvg(type: string): string {
    const item = this.typesList.find(t => t.value === type);
    return item ? item.svg : '';
  }"""

content = content.replace(old_get_emoji, new_get_emoji)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("exercises-manager.ts updated successfully with SVG icons and direct redirections!")
