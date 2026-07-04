import os

# --- 1. Fix database.service.ts ---
db_path = r'c:\Users\PC\Downloads\speak-up2\src\app\services\database.service.ts'
with open(db_path, 'rb') as f:
    db_content = f.read().decode('utf-8').replace('\r\n', '\n')

old_attachment_method = """    const messages = this.localChatMessages[channelId] || [];
    messages.push(newMessage);
    this.localChatMessages[channelId] = messages;
    this.saveLocalData('chat_messages', this.localChatMessages);
    this.publishChatMessages(channelId);
    await this.logAction('message_sent', `Fichier envoyé dans #${channelId} (${fileName})`, channelId);"""

new_attachment_method = """    // Local Storage Fallback
    const key = `speak_chat_${channelId}`;
    const data = localStorage.getItem(key);
    const messages = data ? JSON.parse(data) : [];
    messages.push(newMessage);
    localStorage.setItem(key, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent('local-chat-update', { detail: { channelId } }));
    await this.logAction('message_sent', `Fichier envoyé dans #${channelId} (${fileName})`, channelId);"""

db_content = db_content.replace(old_attachment_method, new_attachment_method)

with open(db_path, 'w', encoding='utf-8') as f:
    f.write(db_content)
print("database.service.ts fixed!")


# --- 2. Fix exercises.ts ---
ex_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\student\exercises.ts'
with open(ex_path, 'rb') as f:
    ex_content = f.read().decode('utf-8').replace('\r\n', '\n')

# Check if the class injection worked. If not, inject now.
if "isWordBuilderWiggling" not in ex_content:
    old_class_marker = "export class StudentExercisesComponent {"
    new_class_marker = """export class StudentExercisesComponent {
  isWordBuilderWiggling = signal<boolean>(false);
  isWordBuilderSuccess = signal<boolean>(false);

  getTargetWordChars(): string[] {
    const currentWordObj = this.activeWords()[this.wordBuilderIdx()];
    if (!currentWordObj) return [];
    return currentWordObj.word.toLowerCase().replace(/\s/g, '').split('');
  }"""
    ex_content = ex_content.replace(old_class_marker, new_class_marker)

with open(ex_path, 'w', encoding='utf-8') as f:
    f.write(ex_content)
print("exercises.ts fixed!")


# --- 3. Fix exercises-manager.ts ---
mgr_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\teacher\exercises-manager.ts'
with open(mgr_path, 'rb') as f:
    mgr_content = f.read().decode('utf-8').replace('\r\n', '\n')

# Fix selection type cast
old_type_set = "this.selectedType.set(filter);"
new_type_set = "this.selectedType.set(filter as any);"
mgr_content = mgr_content.replace(old_type_set, new_type_set)

# Fix getTypeSvg injection
if "getTypeSvg(" not in mgr_content:
    old_get_emoji_mgr = """  getTypeEmoji(type: any): string {
    const item = this.typesList.find(t => t.value === type);
    return item ? item.emoji : '🎯';
  }"""
    new_get_emoji_mgr = """  getTypeEmoji(type: any): string {
    const item = this.typesList.find(t => t.value === type);
    return item ? item.emoji : '🎯';
  }

  getTypeSvg(type: any): string {
    const item = this.typesList.find(t => t.value === type);
    return item ? item.svg : '';
  }"""
    mgr_content = mgr_content.replace(old_get_emoji_mgr, new_get_emoji_mgr)

with open(mgr_path, 'w', encoding='utf-8') as f:
    f.write(mgr_content)
print("exercises-manager.ts fixed!")
