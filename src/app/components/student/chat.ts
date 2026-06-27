import { Component, inject, signal, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, ChatMessage, UserProfile } from '../../services/database.service';
import { Subscription } from 'rxjs';

interface ChatMember {
  id: string;
  name: string;
  avatar: string;
  level: string;
  role: 'student' | 'teacher';
  online: boolean;
  countryFlag?: string;
}

@Component({
  selector: 'app-student-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="padding:0">
      <!-- Top banner info -->
      <div style="font-size:12px; color:#4F46E5; background:#EEF2FF; padding:10px 16px; border-bottom:1px solid var(--border-weak); display:flex; align-items:center; gap:6px">
        <i class="ti ti-info-circle" aria-hidden="true" style="font-size:16px"></i> 
        Only English in this chat — practicing helps you improve faster!
      </div>

      <!-- Main Slack-style Grid Layout -->
      <div class="chat-workspace">
        
        <!-- Left Side Pane: Channel list -->
        <div class="chat-channels-pane">
          <div class="pane-title">CHANNELS</div>
          <div class="channel-list">
            <button class="channel-btn" [class.active]="activeChannel() === 'general'" (click)="switchChannel('general')">
              <span class="hashtag">#</span> general
            </button>
            <button class="channel-btn" [class.active]="activeChannel() === 'group-a'" (click)="switchChannel('group-a')">
              <span class="hashtag">#</span> study-group-a
            </button>
            <button class="channel-btn" [class.active]="activeChannel() === 'travel'" (click)="switchChannel('travel')">
              <span class="hashtag">#</span> travel-talk
            </button>
            <button class="channel-btn" [class.active]="activeChannel() === 'debate'" (click)="switchChannel('debate')">
              <span class="hashtag">#</span> debate-club
            </button>
          </div>
        </div>

        <!-- Middle Pane: Message Flow & Input -->
        <div class="chat-messages-pane">
          <div class="chat-messages-header">
            <div style="display:flex; align-items:center; gap:6px">
              <span class="hashtag" style="font-size:16px; font-weight:700; color:#4F46E5">#</span>
              <span style="font-size:14px; font-weight:700; color:var(--text-primary)">{{ getChannelLabel() }}</span>
            </div>
            <span style="font-size:11px; color:var(--text-muted)">
              {{ getActiveOnlineCount() }} members online
            </span>
          </div>

          <div class="chat-scroll-container" #scrollContainer>
            @for (msg of messages(); track msg.timestamp) {
              <div class="message-bubble-row" [class.is-me]="msg.senderId === currentUserId()">
                <!-- Avatar column (if not me) -->
                @if (msg.senderId !== currentUserId()) {
                  <div class="message-avatar">{{ getSenderAvatar(msg) }}</div>
                }

                <div class="message-content-col">
                  <div class="message-meta-row" [class.is-me]="msg.senderId === currentUserId()">
                    <span class="msg-sender-name" style="display:flex; align-items:center; gap:4px">
                      <span>{{ msg.senderName }}</span>
                      @if (getFlagUrl(getSenderFlag(msg))) {
                        <img [src]="getFlagUrl(getSenderFlag(msg))" style="width: 14px; height: 10px; object-fit: contain; border-radius: 1px" alt="flag">
                      }
                    </span>
                    @if (msg.senderId === 'teacher-sarah' || msg.senderId === 'teacher-emily') {
                      <span class="role-badge teacher">Teacher</span>
                    } @else if (msg.senderId !== currentUserId()) {
                      <span class="role-badge student">Student</span>
                    }
                    <span class="msg-time">{{ msg.timestamp | date:'shortTime' }}</span>
                  </div>

                  <div class="message-bubble" [class.me]="msg.senderId === currentUserId()">
                    {{ msg.content }}
                  </div>
                </div>
              </div>
            } @empty {
              <div class="empty-chat-placeholder">
                <i class="ti ti-messages" aria-hidden="true" style="font-size:40px; color:var(--text-muted); margin-bottom:10px"></i>
                <p style="font-weight:600; color:var(--text-primary); margin-bottom:4px">Start the conversation!</p>
                <p style="color:var(--text-secondary); max-width:260px; margin:0 auto">
                  Write a message in English. Other online students or teachers will reply to practice with you.
                </p>
              </div>
            }
          </div>

          <div class="chat-input-wrapper">
            <input 
              type="text" 
              [(ngModel)]="newMessageContent" 
              (keyup.enter)="sendMessage()" 
              placeholder="Write in English here..." 
              class="chat-textbox" />
            <button class="chat-send-btn" (click)="sendMessage()" [disabled]="!newMessageContent.trim()">
              <i class="ti ti-send" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        <!-- Right Side Pane: Room Active Members list -->
        <div class="chat-members-pane">
          <div class="pane-title">MEMBERS ONLINE ({{ getActiveOnlineCount() }})</div>
          <div class="members-list-wrapper">
            
            <!-- Always show current user first -->
            <div class="member-item">
              <div class="member-avatar-box">
                <span class="avatar-emoji">{{ currentUser?.avatar || '👤' }}</span>
                <span class="status-dot online"></span>
              </div>
              <div style="flex:1; min-width:0">
                <div class="member-name" style="display:flex; align-items:center; gap:4px">
                  <span>{{ currentUser?.name }} (You)</span>
                  @if (getFlagUrl(currentUser?.countryFlag)) {
                    <img [src]="getFlagUrl(currentUser?.countryFlag)" style="width: 14px; height: 10px; object-fit: contain; border-radius: 1px" alt="flag">
                  }
                </div>
                <div class="member-subtext">{{ currentUser?.level }} · Active</div>
              </div>
            </div>

            <!-- List simulated members for this channel -->
            @for (m of getChannelMembers(); track m.id) {
              <div class="member-item" [class.offline]="!m.online">
                <div class="member-avatar-box">
                  <span class="avatar-emoji">{{ m.avatar }}</span>
                  @if (m.online) {
                    <span class="status-dot online"></span>
                  } @else {
                    <span class="status-dot offline"></span>
                  }
                </div>
                <div style="flex:1; min-width:0">
                  <div class="member-name" style="display:flex; align-items:center; gap:4px" [style.color]="m.online ? 'var(--text-primary)' : 'var(--text-muted)'">
                    <span>{{ m.name }}</span>
                    @if (getFlagUrl(m.countryFlag)) {
                      <img [src]="getFlagUrl(m.countryFlag)" style="width: 14px; height: 10px; object-fit: contain; border-radius: 1px" alt="flag">
                    }
                  </div>
                  <div class="member-subtext">
                    {{ m.level }} · {{ m.role | titlecase }}
                  </div>
                </div>
              </div>
            }
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .chat-workspace {
      display: flex;
      height: calc(100vh - 180px);
      min-height: 480px;
      background: var(--surface-1);
    }

    /* Left channel pane */
    .chat-channels-pane {
      width: 200px;
      border-right: 1px solid var(--border-weak);
      display: flex;
      flex-direction: column;
      background: var(--surface-2);
      flex-shrink: 0;
      padding: 16px 8px;
    }

    .pane-title {
      font-size: 10px;
      font-weight: 700;
      color: var(--text-muted);
      letter-spacing: 0.08em;
      margin-bottom: 12px;
      padding-left: 8px;
    }

    .channel-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .channel-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      width: 100%;
      border: none;
      background: transparent;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-secondary);
      text-align: left;
      cursor: pointer;
      transition: all 0.15s;
    }

    .channel-btn:hover {
      background: rgba(0, 0, 0, 0.04);
      color: var(--text-primary);
    }

    .channel-btn.active {
      background: #EEF2FF;
      color: #4F46E5;
    }

    .hashtag {
      font-weight: 600;
      color: var(--text-muted);
    }

    .channel-btn.active .hashtag {
      color: #4F46E5;
    }

    /* Middle message pane */
    .chat-messages-pane {
      flex: 1;
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--border-weak);
      background: #FFF;
    }

    .chat-messages-header {
      padding: 14px 20px;
      border-bottom: 1px solid var(--border-weak);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chat-scroll-container {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message-bubble-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      max-width: 80%;
    }

    .message-bubble-row.is-me {
      align-self: flex-end;
      flex-direction: row-reverse;
      max-width: 75%;
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--surface-2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      flex-shrink: 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .message-content-col {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .message-meta-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
    }

    .message-meta-row.is-me {
      justify-content: flex-end;
    }

    .msg-sender-name {
      font-weight: 700;
      color: var(--text-primary);
    }

    .msg-time {
      color: var(--text-muted);
    }

    .role-badge {
      font-size: 8px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .role-badge.teacher {
      background: #E0E7FF;
      color: #4F46E5;
    }

    .role-badge.student {
      background: #ECFDF5;
      color: #047857;
    }

    .message-bubble {
      background: var(--surface-2);
      color: var(--text-primary);
      border: 1px solid var(--border-weak);
      padding: 10px 14px;
      border-radius: 4px 14px 14px 14px;
      font-size: 12.5px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .message-bubble.me {
      background: #4F46E5;
      color: #FFF;
      border-color: #4F46E5;
      border-radius: 14px 4px 14px 14px;
    }

    .chat-input-wrapper {
      padding: 16px 20px;
      border-top: 1px solid var(--border-weak);
      display: flex;
      gap: 10px;
      background: #FFF;
    }

    .chat-textbox {
      flex: 1;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 12.5px;
      transition: all 0.2s;
    }

    .chat-textbox:focus {
      outline: none;
      border-color: #4F46E5;
      background: #FFF;
    }

    .chat-send-btn {
      background: #4F46E5;
      color: #FFF;
      border: none;
      border-radius: 8px;
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 14px;
      transition: background 0.2s;
    }

    .chat-send-btn:hover {
      background: #4338CA;
    }

    .chat-send-btn:disabled {
      background: var(--border);
      color: var(--text-muted);
      cursor: not-allowed;
    }

    /* Right members pane */
    .chat-members-pane {
      width: 220px;
      background: var(--surface-2);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      padding: 16px 12px;
    }

    .members-list-wrapper {
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-y: auto;
    }

    .member-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px;
    }

    .member-item.offline {
      opacity: 0.55;
    }

    .member-avatar-box {
      position: relative;
      width: 30px;
      height: 30px;
      background: #FFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }

    .status-dot {
      position: absolute;
      bottom: -1px;
      right: -1px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 1.5px solid #FFF;
    }

    .status-dot.online {
      background: #10B981;
    }

    .status-dot.offline {
      background: #9CA3AF;
    }

    .member-name {
      font-size: 11.5px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .member-subtext {
      font-size: 9px;
      color: var(--text-secondary);
      margin-top: 1px;
    }

    .empty-chat-placeholder {
      text-align: center;
      padding: 40px 20px;
      font-size: 12px;
      margin: auto 0;
    }

    /* Responsive */
    @media (max-width: 850px) {
      .chat-members-pane {
        display: none;
      }
    }
  `]
})
export class StudentChatComponent implements OnDestroy {
  private db = inject(DatabaseService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  activeChannel = signal<string>('general');
  messages = signal<ChatMessage[]>([]);
  newMessageContent = '';
  
  currentUser: UserProfile | null = null;
  private chatSub: Subscription | null = null;
  private localUpdateListener: any;

  dbUsers = signal<UserProfile[]>([]);

  constructor() {
    this.db.observeCurrentUser().subscribe(u => this.currentUser = u);
    this.db.observeUsers().subscribe(list => this.dbUsers.set(list));
    this.subscribeToChat();

    // Listen to local updates
    this.localUpdateListener = (e: any) => {
      if (e.detail && e.detail.channelId === this.activeChannel()) {
        this.subscribeToChat();
      }
    };
    window.addEventListener('local-chat-update', this.localUpdateListener);
  }

  currentUserId() {
    return this.currentUser?.id || '';
  }

  getChannelLabel() {
    switch (this.activeChannel()) {
      case 'general': return 'general-discussion';
      case 'group-a': return 'study-group-a';
      case 'travel': return 'travel-dialogue';
      case 'debate': return 'debate-club';
      default: return 'chat-room';
    }
  }

  getChannelMembers(): ChatMember[] {
    // Only return actual registered users from the database (excluding current user)
    return this.dbUsers()
      .filter(u => u.id !== this.currentUserId())
      .map(u => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar || (u.role === 'teacher' ? '👩‍🏫' : '👤'),
        level: u.level,
        role: u.role,
        online: true,
        countryFlag: u.countryFlag
      }));
  }

  getActiveOnlineCount(): number {
    return this.getChannelMembers().filter(m => m.online).length + 1;
  }

  getSenderAvatar(msg: ChatMessage): string {
    const list = this.getChannelMembers();
    const found = list.find(m => m.name === msg.senderName || m.id === msg.senderId);
    return found ? found.avatar : '👤';
  }

  getSenderFlag(msg: ChatMessage): string {
    if (msg.senderId === this.currentUserId()) {
      return this.currentUser?.countryFlag || '';
    }
    // Check simulated list
    const simFound = this.getChannelMembers().find(m => m.id === msg.senderId || m.name === msg.senderName);
    if (simFound && simFound.countryFlag) {
      return simFound.countryFlag;
    }
    // Check database users
    const dbFound = this.dbUsers().find(u => u.id === msg.senderId || u.name === msg.senderName);
    return dbFound?.countryFlag || '';
  }

  getFlagUrl(flag: string | undefined): string {
    if (!flag) return '';
    const clean = flag.trim().toUpperCase();
    let code = clean;
    if (clean.length > 2) {
      try {
        const codePoints = Array.from(clean).map(c => c.codePointAt(0) || 0);
        if (codePoints.length >= 2 && codePoints[0] >= 127397 && codePoints[0] <= 127423) {
          code = String.fromCharCode(
            codePoints[0] - 127397,
            codePoints[1] - 127397
          );
        }
      } catch(e) {}
    }
    if (code.length !== 2) return '';
    return `https://flagcdn.com/w20/${code.toLowerCase()}.png`;
  }

  switchChannel(channelId: string) {
    this.activeChannel.set(channelId);
    this.subscribeToChat();
  }

  subscribeToChat() {
    if (this.chatSub) {
      this.chatSub.unsubscribe();
    }
    
    this.chatSub = this.db.observeChatMessages(this.activeChannel()).subscribe(list => {
      this.messages.set(list);
      this.scrollToBottom();
    });
  }

  async sendMessage() {
    const text = this.newMessageContent.trim();
    if (!text) return;
    
    this.newMessageContent = ''; // clear input for reactive feel
    await this.db.sendChatMessage(this.activeChannel(), text);
  }

  private scrollToBottom() {
    setTimeout(() => {
      try {
        const element = this.scrollContainer?.nativeElement;
        if (element) {
          element.scrollTop = element.scrollHeight;
        }
      } catch (err) {}
    }, 50);
  }

  ngOnDestroy() {
    if (this.chatSub) this.chatSub.unsubscribe();
    window.removeEventListener('local-chat-update', this.localUpdateListener);
  }
}
