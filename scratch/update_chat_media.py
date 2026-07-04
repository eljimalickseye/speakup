import os

file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\student\chat.ts'

# Load the file content
with open(file_path, 'rb') as f:
    raw_bytes = f.read()

content = raw_bytes.decode('utf-8').replace('\r\n', '\n')

# 1. Add DomSanitizer and SafeResourceUrl imports on line 1
import_marker = "import { Component, inject, signal, computed, OnDestroy, ViewChild, ElementRef } from '@angular/core';"
new_import = "import { Component, inject, signal, computed, OnDestroy, ViewChild, ElementRef } from '@angular/core';\nimport { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';"

content = content.replace(import_marker, new_import)

# 2. Modify message bubble rendering block inside template
# It starts around:
#                       @if (msg.type === 'audio') {
#                         <!-- Voice Message Player -->
# ...
#                       } @else if (msg.type === 'video') {
#                         <!-- Video Message Player -->
# ...
#                       } @else {
#                         {{ msg.content }}
#                       }

old_msg_types = """                      } @else if (msg.type === 'video') {
                        <!-- Video Message Player -->
                        <div style="display:flex; flex-direction:column; gap:6px; min-width:200px">
                          <video controls style="width:100%; max-width:240px; border-radius:6px; background:#000" [src]="msg.content"></video>
                          <span style="font-size:9.5px; opacity:0.8; font-weight:700; display:inline-flex; align-items:center; gap:4px">
                            <i class="ti ti-video"></i> Video message
                          </span>
                        </div>
                      } @else {
                        {{ msg.content }}
                      }"""

new_msg_types = """                      } @else if (msg.type === 'video') {
                        <!-- Video Message Player -->
                        <div style="display:flex; flex-direction:column; gap:6px; min-width:200px">
                          <video controls style="width:100%; max-width:240px; border-radius:6px; background:#000" [src]="msg.content"></video>
                          <span style="font-size:9.5px; opacity:0.8; font-weight:700; display:inline-flex; align-items:center; gap:4px">
                            <i class="ti ti-video"></i> Video message
                          </span>
                        </div>
                      } @else if (msg.type === 'image') {
                        <!-- Image Attachment View -->
                        <div style="display:flex; flex-direction:column; gap:6px; min-width:180px">
                          <img [src]="msg.content" style="max-width:100%; max-height:200px; object-fit:cover; border-radius:8px; cursor:zoom-in; transition: transform 0.2s" 
                               (click)="openImageModal(msg.content)"
                               onmouseover="this.style.transform='scale(1.02)'"
                               onmouseout="this.style.transform='scale(1)'"
                               alt="Chat attachment" />
                          <span style="font-size:9.5px; opacity:0.8; font-weight:700; display:inline-flex; align-items:center; gap:4px">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                            Image attachment
                          </span>
                        </div>
                      } @else if (msg.type === 'file') {
                        <!-- Document/File Attachment View -->
                        <div style="display:flex; align-items:center; gap:10px; background:rgba(0,0,0,0.03); border:1px solid rgba(0,0,0,0.05); padding:8px 12px; border-radius:8px; min-width:200px">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                          </svg>
                          <div style="text-align:left; flex:1">
                            <div style="font-size:12px; font-weight:700; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:140px">{{ msg.fileName || 'document.pdf' }}</div>
                            <div style="font-size:10px; color:var(--text-muted)">{{ msg.fileSize || 'Unknown size' }}</div>
                          </div>
                          <a [href]="msg.content" [download]="msg.fileName || 'download'"
                             style="width:28px; height:28px; border-radius:50%; background:#4F46E5; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; text-decoration:none">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          </a>
                        </div>
                      } @else {
                        <div>
                          <span style="white-space: pre-wrap; word-break: break-word;">{{ msg.content }}</span>
                          @if (getYoutubeVideoId(msg.content); as ytId) {
                            <div class="no-print" style="margin-top: 8px; border-radius: 8px; overflow: hidden; width: 100%; max-width: 320px; aspect-ratio: 16/9; border: 1px solid var(--border-weak)">
                              <iframe [src]="getSafeYoutubeUrl(ytId)" 
                                      style="width: 100%; height: 100%; border: none"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                      allowfullscreen>
                              </iframe>
                            </div>
                          }
                        </div>
                      }"""

content = content.replace(old_msg_types, new_msg_types)

# 3. Add Attachment Button and hidden input next to voice recorder button in composer
old_composer_buttons = """              <!-- Voice Recording Button -->
              <button 
                [disabled]="!isVoiceChatAllowed() || recordingState() === 'recording'"
                [style.opacity]="isVoiceChatAllowed() ? '1' : '0.4'"
                [style.cursor]="isVoiceChatAllowed() ? 'pointer' : 'not-allowed'"
                [title]="isVoiceChatAllowed() ? 'Record voice message' : 'Voice messaging locked. Speak with teacher to unlock!'"
                (click)="startVoiceRecording()"
                style="background:none; border:1px solid var(--border); color:#4F46E5; width:38px; height:38px; border-radius:8px; display:flex; align-items:center; justify-content:center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </button>"""

new_composer_buttons = """              <!-- Attachment Button -->
              <button 
                [disabled]="recordingState() === 'recording'"
                title="Send Image or File"
                (click)="fileInput.click()"
                style="background:none; border:1px solid var(--border); color:#64748B; width:38px; height:38px; border-radius:8px; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>
              
              <!-- Hidden File Input -->
              <input 
                type="file" 
                #fileInput 
                style="display:none" 
                (change)="onFileSelected($event)" 
                accept="image/*,.pdf,.doc,.docx" />

              <!-- Voice Recording Button -->
              <button 
                [disabled]="!isVoiceChatAllowed() || recordingState() === 'recording'"
                [style.opacity]="isVoiceChatAllowed() ? '1' : '0.4'"
                [style.cursor]="isVoiceChatAllowed() ? 'pointer' : 'not-allowed'"
                [title]="isVoiceChatAllowed() ? 'Record voice message' : 'Voice messaging locked. Speak with teacher to unlock!'"
                (click)="startVoiceRecording()"
                style="background:none; border:1px solid var(--border); color:#4F46E5; width:38px; height:38px; border-radius:8px; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </button>"""

content = content.replace(old_composer_buttons, new_composer_buttons)

# 4. Add Fullscreen Image Lightbox at the bottom of the template block
template_end = "      } \n    </div>\n  `,"
# Let's locate it from the bottom
end_pos = content.rfind("    </div>\n  `,")

if end_pos == -1:
    end_pos = content.find("    </div>\n  `")

if end_pos == -1:
    print("Error: closing template not found!")
    exit(1)

lightbox_markup = """
      <!-- FULLSCREEN IMAGE LIGHTBOX -->
      @if (selectedImageForLightbox(); as imgUrl) {
        <div class="modal-overlay" (click)="selectedImageForLightbox.set(null)" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:999999; padding:16px">
          <div style="position:relative; max-width:90vw; max-height:90vh">
            <button (click)="selectedImageForLightbox.set(null)" style="position:absolute; top:-40px; right:0; background:none; border:none; color:white; font-size:24px; cursor:pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <img [src]="imgUrl" style="max-width:100%; max-height:85vh; border-radius:8px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5)" (click)="$event.stopPropagation()" alt="Lightbox view" />
          </div>
        </div>
      }
"""

content = content[:end_pos] + lightbox_markup + content[end_pos:]

# 5. Inject Sanitizer dependency and helper methods in StudentChatComponent class
# Find class start:
class_marker = "export class StudentChatComponent implements OnDestroy {"
class_idx = content.find(class_marker)

if class_idx == -1:
    print("Error: class start not found!")
    exit(1)

insert_class_pos = class_idx + len(class_marker)

class_injections = """
  private sanitizer = inject(DomSanitizer);

  selectedImageForLightbox = signal<string | null>(null);

  openImageModal(url: string) {
    this.selectedImageForLightbox.set(url);
  }

  getYoutubeVideoId(text: string): string | null {
    if (!text) return null;
    const regExp = /^.*(youtu.be\\/|v\\/|u\\/\\w\\/|embed\\/|watch\\?v=|\\&v=)([^#\\&\\?]*).*/;
    const match = text.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  getSafeYoutubeUrl(id: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${id}`);
  }

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const base64Data = e.target.result;
      const fileType = file.type;
      
      let msgType: 'image' | 'file' = 'file';
      if (fileType.startsWith('image/')) {
        msgType = 'image';
      }
      
      let sizeStr = '';
      if (file.size > 1024 * 1024) {
        sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
      } else {
        sizeStr = Math.round(file.size / 1024) + ' KB';
      }

      await this.db.sendChatMessageWithAttachment(
        this.activeChannel(),
        base64Data,
        msgType,
        file.name,
        sizeStr
      );
      
      event.target.value = '';
    };

    reader.readAsDataURL(file);
  }
"""

content = content[:insert_class_pos] + class_injections + content[insert_class_pos:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("chat.ts successfully updated with YouTube, image, and file support!")
