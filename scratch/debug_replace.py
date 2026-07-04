import os

ex_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\student\exercises.ts'
with open(ex_path, 'rb') as f:
    ex_content = f.read().decode('utf-8').replace('\r\n', '\n')

# Check class start
class_start = "export class StudentExercisesComponent {"
if class_start in ex_content:
    print("Found class start in exercises.ts!")
    # Replace it!
    new_class = """export class StudentExercisesComponent {
  isWordBuilderWiggling = signal<boolean>(false);
  isWordBuilderSuccess = signal<boolean>(false);

  getTargetWordChars(): string[] {
    const currentWordObj = this.activeWords()[this.wordBuilderIdx()];
    if (!currentWordObj) return [];
    return currentWordObj.word.toLowerCase().replace(/\s/g, '').split('');
  }"""
    ex_content = ex_content.replace(class_start, new_class)
    with open(ex_path, 'w', encoding='utf-8') as f:
        f.write(ex_content)
    print("exercises.ts class signals injected!")
else:
    print("Could not find class start in exercises.ts!")

mgr_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\teacher\exercises-manager.ts'
with open(mgr_path, 'rb') as f:
    mgr_content = f.read().decode('utf-8').replace('\r\n', '\n')

emoji_marker = "  getTypeEmoji(type: any): string {"
if emoji_marker in mgr_content:
    print("Found getTypeEmoji marker in exercises-manager.ts!")
    # Let's find where the closing brace is
    start_pos = mgr_content.find(emoji_marker)
    end_pos = mgr_content.find("  }", start_pos)
    if end_pos != -1:
        # Insert getTypeSvg right after it
        insert_pos = end_pos + 3 # including '  }\n'
        svg_method = """
  getTypeSvg(type: any): string {
    const item = this.typesList.find(t => t.value === type);
    return item ? item.svg : '';
  }
"""
        mgr_content = mgr_content[:insert_pos] + svg_method + mgr_content[insert_pos:]
        with open(mgr_path, 'w', encoding='utf-8') as f:
            f.write(mgr_content)
        print("exercises-manager.ts getTypeSvg injected!")
else:
    print("Could not find getTypeEmoji marker in exercises-manager.ts!")
