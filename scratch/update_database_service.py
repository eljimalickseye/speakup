import os

file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\services\database.service.ts'

# Load the file content
with open(file_path, 'rb') as f:
    raw_bytes = f.read()

content = raw_bytes.decode('utf-8').replace('\r\n', '\n')

# 1. Update ChatMessage interface
old_interface = """export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type?: 'text' | 'audio' | 'video';
  audioUrl?: string;
}"""

new_interface = """export interface ChatMessage {
  id?: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  type?: 'text' | 'audio' | 'video' | 'image' | 'file';
  audioUrl?: string;
  fileName?: string;
  fileSize?: string;
}"""

content = content.replace(old_interface, new_interface)

# 2. Add sendChatMessageWithAttachment method after sendChatMessage method
# Let's locate the sendChatMessage method.
send_method_start = "  async sendChatMessage(channelId: string, content: string, type: 'text' | 'audio' = 'text', audioUrl?: string) {"
send_idx = content.find(send_method_start)

if send_idx == -1:
    print("Error: sendChatMessage method not found!")
    exit(1)

# Find the end of sendChatMessage method. It ends with a local messages save, which is around line 2840.
# Let's find the closing brace matching sendChatMessage.
# The body ends with:
#     this.localChatMessages[channelId] = messages;
#     this.saveLocalData('chat_messages', this.localChatMessages);
#     this.publishChatMessages(channelId);
#     await this.logAction('message_sent', `Message envoyé dans #${channelId} (${type === 'audio' ? 'Vocal' : 'Texte'})`, channelId);
#   }
# Let's find the closing tag:
method_end_marker = "    await this.logAction('message_sent', `Message envoyé dans #${channelId} (${type === 'audio' ? 'Vocal' : 'Texte'})`, channelId);\n  }"
end_idx = content.find(method_end_marker, send_idx)

if end_idx == -1:
    # Try another possible string
    method_end_marker = "(${type === 'audio' ? 'Vocal' : 'Texte'})`, channelId);\n  }"
    end_idx = content.find(method_end_marker, send_idx)

if end_idx == -1:
    print("Error: End of sendChatMessage method not found!")
    exit(1)

insert_pos = end_idx + len(method_end_marker)

attachment_method = """

  async sendChatMessageWithAttachment(channelId: string, content: string, type: 'image' | 'file', fileName: string, fileSize: string) {
    const active = this.currentUser$.value;
    if (!active) return;

    if (active.role !== 'admin' && active.role !== 'teacher') {
      const channel = this.channels$.value.find(c => c.id === channelId);
      if (channel) {
        const members = channel.members || [];
        if (!members.includes(active.id)) {
          throw new Error("Vous n'êtes pas membre de ce groupe.");
        }
      }
    }

    const newMessage: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
      senderId: active.id,
      senderName: active.name,
      content,
      timestamp: new Date().toISOString(),
      type,
      fileName,
      fileSize
    };

    if (this.useFirebase) {
      try {
        const messagesCol = collection(this.firestore, 'chat', channelId, 'messages');
        await addDoc(messagesCol, newMessage);
        await this.logAction('message_sent', `Fichier envoyé dans #${channelId} (${fileName})`, channelId);
        return;
      } catch (e) {
        console.warn('Firestore send file failed. Falling back to local.', e);
      }
    }

    const messages = this.localChatMessages[channelId] || [];
    messages.push(newMessage);
    this.localChatMessages[channelId] = messages;
    this.saveLocalData('chat_messages', this.localChatMessages);
    this.publishChatMessages(channelId);
    await this.logAction('message_sent', `Fichier envoyé dans #${channelId} (${fileName})`, channelId);
  }"""

content = content[:insert_pos] + attachment_method + content[insert_pos:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("database.service.ts updated successfully with chat attachment methods!")
