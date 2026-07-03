import { Component, inject, signal, computed, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, ChatMessage, UserProfile, ChatChannel } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';
import { Subscription } from 'rxjs';

interface ChatMember {
  id: string;
  name: string;
  avatar: string;
  level: string;
  role: 'student' | 'teacher' | 'guest' | 'admin';
  online: boolean;
  countryFlag?: string;
}

@Component({
  selector: 'app-student-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="padding:0">
      <div style="font-size:12px; color:#4F46E5; background:#EEF2FF; padding:10px 16px; border-bottom:1px solid var(--border-weak); display:flex; align-items:center; gap:6px; flex-wrap:wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span>Only English in this chat — practicing helps you improve faster!</span>
        <button (click)="showSecurityPolicy.set(true)" style="background:none; border:none; color:#4F46E5; text-decoration:underline; font-weight:700; cursor:pointer; margin-left:auto; font-size:11px">
          🛡️ Charte de sécurité & conduite
        </button>
      </div>

      <!-- Main Slack-style Grid Layout -->
      <div class="chat-workspace">
        
        <!-- Left Side Pane: Channel list -->
        <div class="chat-channels-pane">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
            <div class="pane-title" style="margin-bottom:0">CHANNELS</div>
            
            <!-- Create room button (Teacher only) -->
            @if (isTeacher()) {
              <button (click)="showCreateChanModal.set(true)" style="background:none; border:none; cursor:pointer; color:#4F46E5; display:flex; align-items:center" title="Create Chat Room">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            }
          </div>
          
          <div class="channel-list">
            @for (chan of visibleChannels(); track chan.id) {
              <div class="channel-row" [class.active]="activeChannel() === chan.id" style="display:flex; justify-content:space-between; align-items:center; width:100%; position:relative; border-radius:8px; transition:background 0.15s">
                <button class="channel-btn" style="flex:1; text-align:left; overflow:hidden; text-overflow:ellipsis; border:none; background:transparent" [class.active]="activeChannel() === chan.id" (click)="switchChannel(chan.id)">
                  <span class="hashtag">#</span> {{ chan.name }}
                  @if (chan.isPrivate) {
                    <span style="font-size:9px; opacity:0.6; margin-left:4px" title="Private Room">🔒</span>
                  }
                  @if (unreadCounts()[chan.id] > 0) {
                    <span class="unread-badge">{{ unreadCounts()[chan.id] }}</span>
                  }
                </button>
                @if (isTeacher() && chan.id !== 'general') {
                  <div class="channel-actions" style="display:flex; align-items:center; gap:6px; padding-right:6px">
                    <button (click)="renameChannelPrompt(chan); $event.stopPropagation()" 
                            class="chan-action-btn edit-btn" 
                            title="Rename Channel">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                    <button (click)="removeChannel(chan); $event.stopPropagation()" 
                            class="chan-action-btn delete-btn" 
                            title="Delete Channel">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                }
              </div>
            }
          </div>
          @if (!isTeacher()) {
            <div style="padding:12px; border-top:1px dashed var(--border-weak)">
              <button (click)="startConversationWithTeacher()" style="width:100%; height:36px; background:#0D9488; border-color:#0D9488; color:white; border:none; border-radius:8px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; box-shadow:0 4px 6px rgba(13,148,136,0.12)">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                Contacter le Professeur
              </button>
            </div>
          }
        </div>

        <!-- Middle Pane: Message Flow & Input -->
        <div class="chat-messages-pane">
          <div class="chat-messages-header">
            <div style="display:flex; align-items:center; gap:6px">
              <span class="hashtag" style="font-size:16px; font-weight:700; color:#4F46E5">#</span>
              <span class="hide-mobile" style="font-size:14px; font-weight:700; color:var(--text-primary); white-space:nowrap">{{ getChannelLabel() }}</span>
              <select class="show-mobile-inline channel-select-dropdown" [value]="activeChannel()" (change)="onChannelSelectChange($event)" style="margin-right:2px">
                @for (chan of visibleChannels(); track chan.id) {
                  <option [value]="chan.id"># {{ chan.name }} {{ chan.isPrivate ? '(🔒)' : '' }}</option>
                }
              </select>
              
              <!-- Create room button on mobile (Teacher only) -->
              @if (isTeacher()) {
                <button class="show-mobile-inline" (click)="showCreateChanModal.set(true)" style="background:none; border:none; color:#4F46E5; padding:4px 6px; cursor:pointer; display:flex; align-items:center" title="Create Room">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
              }
            </div>
            
            <div style="display:flex; align-items:center; gap:12px">
              <span class="hide-mobile" style="font-size:11.5px; color:var(--text-muted)">
                {{ getActiveOnlineCount() }} members online
              </span>

              <!-- View members list on mobile -->
              <button class="show-mobile-inline" (click)="showMembersMobile.set(true)" style="background:none; border:none; color:var(--text-secondary); padding:4px; cursor:pointer; display:flex; align-items:center" title="View Members">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </button>

              <!-- Student indicator showing personal voice chat status -->
              @if (!isTeacher()) {
                <span [style.color]="isVoiceChatAllowed() ? '#0D9488' : '#6B7280'" style="font-size:11px; font-weight:600; display:flex; align-items:center; gap:5px; background:var(--surface-2); padding:3px 8px; border-radius:20px; border:1px solid var(--border-weak)">
                  @if (isVoiceChatAllowed()) {
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:#0D9488"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                    <span>Voice: Allowed</span>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:#9CA3AF"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <span>Voice: Locked</span>
                  }
                </span>
              }
            </div>
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
                    @if (msg.senderId === 'teacher' || msg.senderId === 'teacher-sarah') {
                      <span class="role-badge teacher">Teacher</span>
                    } @else if (msg.senderId !== currentUserId()) {
                      <span class="role-badge student">Student</span>
                    }
                    <span class="msg-time">{{ msg.timestamp | date:'shortTime' }}</span>
                  </div>

                  <div style="display:flex; align-items:center; gap:8px" [style.flex-direction]="msg.senderId === currentUserId() ? 'row-reverse' : 'row'">
                    <div class="message-bubble" [class.me]="msg.senderId === currentUserId()" [class.audio-msg]="msg.type === 'audio' || msg.type === 'video'">
                      @if (msg.type === 'audio') {
                        <!-- Voice Message Player -->
                        <div style="display:flex; flex-direction:column; gap:2px; padding:0; min-width:180px">
                          <div style="display:flex; align-items:center; gap:6px">
                            <button 
                              style="width:28px; height:28px; border-radius:50%; border:none; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; transition: background 0.2s; flex-shrink:0" 
                              [style.background]="playingMessageId() === msg.id ? '#EF4444' : '#4F46E5'"
                              (click)="playChatMessageAudio(msg)">
                              @if (playingMessageId() === msg.id) {
                                <!-- Stop Square Icon -->
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="1"/></svg>
                              } @else {
                                <!-- Play Icon -->
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                  <polygon points="5 3 19 12 5 21 5 3"/>
                                </svg>
                              }
                            </button>

                            <!-- Wave Visualizer vibration animation -->
                            <div style="display:flex; align-items:center; gap:2.5px; height:14px; margin:0 2px">
                              <div class="voice-wave-bar" [class.playing]="playingMessageId() === msg.id" style="height:4px; animation-delay: 0.1s"></div>
                              <div class="voice-wave-bar" [class.playing]="playingMessageId() === msg.id" style="height:9px; animation-delay: 0.3s"></div>
                              <div class="voice-wave-bar" [class.playing]="playingMessageId() === msg.id" style="height:6px; animation-delay: 0.2s"></div>
                              <div class="voice-wave-bar" [class.playing]="playingMessageId() === msg.id" style="height:12px; animation-delay: 0.5s"></div>
                              <div class="voice-wave-bar" [class.playing]="playingMessageId() === msg.id" style="height:8px; animation-delay: 0.4s"></div>
                              <div class="voice-wave-bar" [class.playing]="playingMessageId() === msg.id" style="height:4px; animation-delay: 0.15s"></div>
                              <div class="voice-wave-bar" [class.playing]="playingMessageId() === msg.id" style="height:10px; animation-delay: 0.35s"></div>
                              <div class="voice-wave-bar" [class.playing]="playingMessageId() === msg.id" style="height:7px; animation-delay: 0.25s"></div>
                            </div>

                            <span style="font-size:9.5px; opacity:0.8; font-weight:700; display:inline-flex; align-items:center; gap:2.5px; flex-shrink:0">
                              <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                              Voice Note
                            </span>
                          </div>

                          <!-- Spoken text transcription context -->
                          <div class="audio-transcript">
                            "{{ msg.content }}"
                          </div>
                        </div>
                      } @else if (msg.type === 'video') {
                        <!-- Video Message Player -->
                        <div style="display:flex; flex-direction:column; gap:6px; min-width:200px">
                          <video controls style="width:100%; max-width:240px; border-radius:6px; background:#000" [src]="msg.content"></video>
                          <span style="font-size:9.5px; opacity:0.8; font-weight:700; display:inline-flex; align-items:center; gap:4px">
                            <i class="ti ti-video"></i> Video message
                          </span>
                        </div>
                      } @else if (msg.type === 'image') {
                        <!-- Image Attachment View with Reactions -->
                        <div style="display:flex; flex-direction:column; min-width:180px; position:relative"
                             (mouseenter)="hoveredImageMsgId.set(msg.id || '')"
                             (mouseleave)="hoveredImageMsgId.set('')">

                          <!-- Emoji Reaction Picker (appears when toggled) -->
                          @if (activeReactionPickerMsgId() === msg.id) {
                            <div style="position:absolute; bottom:calc(100% - 10px); left:50%; transform:translateX(-50%); z-index:90; display:flex; gap:8px; background:var(--surface-1); border:1.5px solid var(--border); border-radius:999px; padding:6px 12px; box-shadow:0 12px 32px rgba(0,0,0,0.2); backdrop-filter:blur(16px); animation: reactionPickerIn 0.15s ease-out both; align-items:center">
                              @for (typeItem of reactionTypes; track typeItem.key) {
                                <button (click)="toggleReaction(msg, typeItem.key); $event.stopPropagation()"
                                        style="background:none; border:none; cursor:pointer; padding:4px; border-radius:50%; transition:transform 0.15s; display:flex; align-items:center; justify-content:center"
                                        [style.transform]="hasMyReaction(msg, typeItem.key) ? 'scale(1.3)' : 'scale(1)'"
                                        [style.background]="hasMyReaction(msg, typeItem.key) ? 'var(--border)' : 'none'"
                                        [title]="typeItem.label">
                                  @switch (typeItem.key) {
                                    @case ('heart') {
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" stroke-width="1"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                    }
                                    @case ('like') {
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#3B82F6" stroke="#2563EB" stroke-width="1"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                                    }
                                    @case ('laugh') {
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FBBF24" stroke="#D97706" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><path d="M8 11.5s1.5-1 4-1 4 1 4 1" stroke-linecap="round"/><path d="M8 15s1.5 3 4 3 4-3 4-3H8z" fill="#FFF"/><path d="M10 7.5L8.5 8M14 7.5l1.5.5" stroke-width="2" stroke-linecap="round"/></svg>
                                    }
                                    @case ('wow') {
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FBBF24" stroke="#D97706" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><circle cx="8" cy="9" r="1.5" fill="#451A03" stroke="none"/><circle cx="16" cy="9" r="1.5" fill="#451A03" stroke="none"/><ellipse cx="12" cy="15" rx="2.5" ry="3.5" fill="#451A03" stroke="none"/></svg>
                                    }
                                    @case ('sad') {
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FBBF24" stroke="#D97706" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><circle cx="8.5" cy="9.5" r="1.2" fill="#451A03" stroke="none"/><circle cx="15.5" cy="9.5" r="1.2" fill="#451A03" stroke="none"/><path d="M9 15.5s1.5-1.5 3-1.5 3 1.5 3 1.5" stroke-linecap="round"/><path d="M8 11v3" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round"/></svg>
                                    }
                                    @case ('fire') {
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#F97316" stroke="#EA580C" stroke-width="1"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z"/></svg>
                                    }
                                  }
                                </button>
                              }
                            </div>
                          }

                          <!-- Image container holding image + overlay buttons -->
                          <div style="position:relative; width:100%; border-radius:12px; margin-bottom:8px">
                            <div style="position:relative; overflow:hidden; border-radius:12px; width:100%">
                              <img [src]="msg.content" style="width:100%; max-height:220px; object-fit:cover; display:block; cursor:zoom-in; transition: transform 0.2s"
                                   (click)="openImageModal(msg.content)"
                                   onmouseover="this.style.transform='scale(1.02)'"
                                   onmouseout="this.style.transform='scale(1)'"
                                   alt="Chat attachment" />
                              
                              <!-- Overlay Reaction Trigger Icon (Smiley face) -->
                              <button (click)="toggleReactionPicker(msg.id || '', $event)"
                                      style="position:absolute; bottom:8px; right:8px; width:30px; height:30px; border-radius:50%; background:rgba(15,23,42,0.8); border:1.5px solid rgba(255,255,255,0.25); display:flex; align-items:center; justify-content:center; cursor:pointer; color:white; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.35); transition:all 0.2s; backdrop-filter:blur(4px); z-index:10"
                                      onmouseover="this.style.transform='scale(1.1)'; this.style.background='#4F46E5'"
                                      onmouseout="this.style.transform='scale(1)'; this.style.background='rgba(15,23,42,0.8)'"
                                      title="React to this image">
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                              </button>
                            </div>

                            <!-- WhatsApp-Style Overlapping Reactions Pill -->
                            @if (getReactionList(msg).length > 0) {
                              <div (click)="toggleReactionPicker(msg.id || '', $event)"
                                   style="position:absolute; bottom:-10px; left:12px; display:flex; align-items:center; gap:3px; background:var(--surface-1); border:1.5px solid var(--border); border-radius:999px; padding:3px 8px; box-shadow:0 4px 10px rgba(0,0,0,0.15); z-index:15; cursor:pointer; user-select:none; transition:transform 0.15s; line-height:1"
                                   onmouseover="this.style.transform='scale(1.05)'"
                                   onmouseout="this.style.transform='scale(1)'">
                                <div style="display:flex; align-items:center; gap:1px">
                                  @for (r of getReactionList(msg); track r.key) {
                                    <span style="display:flex; align-items:center; transform:scale(0.7); margin-right:-5px">
                                      @switch (r.key) {
                                        @case ('heart') {
                                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" stroke-width="1"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                        }
                                        @case ('like') {
                                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#3B82F6" stroke="#2563EB" stroke-width="1"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                                        }
                                        @case ('laugh') {
                                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FBBF24" stroke="#D97706" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><path d="M8 11.5s1.5-1 4-1 4 1 4 1" stroke-linecap="round"/><path d="M8 15s1.5 3 4 3 4-3 4-3H8z" fill="#FFF"/><path d="M10 7.5L8.5 8M14 7.5l1.5.5" stroke-width="2" stroke-linecap="round"/></svg>
                                        }
                                        @case ('wow') {
                                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FBBF24" stroke="#D97706" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><circle cx="8" cy="9" r="1.5" fill="#451A03" stroke="none"/><circle cx="16" cy="9" r="1.5" fill="#451A03" stroke="none"/><ellipse cx="12" cy="15" rx="2.5" ry="3.5" fill="#451A03" stroke="none"/></svg>
                                        }
                                        @case ('sad') {
                                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FBBF24" stroke="#D97706" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><circle cx="8.5" cy="9.5" r="1.2" fill="#451A03" stroke="none"/><circle cx="15.5" cy="9.5" r="1.2" fill="#451A03" stroke="none"/><path d="M9 15.5s1.5-1.5 3-1.5 3 1.5 3 1.5" stroke-linecap="round"/><path d="M8 11v3" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round"/></svg>
                                        }
                                        @case ('fire') {
                                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#F97316" stroke="#EA580C" stroke-width="1"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z"/></svg>
                                        }
                                      }
                                    </span>
                                  }
                                </div>
                                <span style="font-size:10.5px; font-weight:800; color:var(--text-secondary); margin-left:6px">{{ getReactionTotalCount(msg) }}</span>
                              </div>
                            }
                          </div>
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
                            <!-- YouTube Cinema Card -->
                            <div style="margin-top:10px; border-radius:14px; overflow:hidden; width:100%; max-width:340px; position:relative" class="yt-cinema-card">

                              @if (!expandedYoutubeIds().has(msg.id || '')) {
                                <!-- Thumbnail Preview Mode -->
                                <div style="position:relative; aspect-ratio:16/9; overflow:hidden; cursor:pointer; border-radius:14px"
                                     (click)="expandYoutube(msg.id || '', ytId)">
                                  <!-- Blurred BG -->
                                  <img [src]="'https://img.youtube.com/vi/' + ytId + '/maxresdefault.jpg'"
                                       style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; filter:blur(6px) brightness(0.6); transform:scale(1.1)" alt="" />
                                  <!-- Sharp center thumbnail -->
                                  <img [src]="'https://img.youtube.com/vi/' + ytId + '/hqdefault.jpg'"
                                       style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:80%; height:80%; object-fit:cover; border-radius:8px; box-shadow:0 12px 40px rgba(0,0,0,0.55)" alt="Video thumbnail" />

                                  <!-- Pulsing Play Button -->
                                  <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:56px; height:56px; border-radius:50%; background:rgba(255,255,255,0.95); display:flex; align-items:center; justify-content:center; box-shadow:0 0 0 0 rgba(255,255,255,0.7); animation: ytPlayPulse 2s infinite; z-index:3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="#FF0000" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                  </div>

                                  <!-- Glassmorphism Bottom Bar -->
                                  <div style="position:absolute; bottom:0; left:0; right:0; padding:12px 14px 10px; background:linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%); z-index:2">
                                    <div style="display:flex; align-items:center; gap:8px">
                                      <!-- YouTube Logo -->
                                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="13" viewBox="0 0 576 512" fill="#FF0000"><path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/></svg>
                                      <div style="flex:1; min-width:0">
                                        <div style="color:white; font-size:12px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">
                                          {{ getYoutubeTitle(ytId) || 'YouTube Video' }}
                                        </div>
                                        <div style="color:rgba(255,255,255,0.65); font-size:10px; margin-top:1px">Tap to play in chat</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                              } @else {
                                <!-- Expanded Player Mode -->
                                <div style="position:relative; border-radius:14px; overflow:hidden; background:#000">
                                  <iframe [src]="getSafeYoutubeUrl(ytId)"
                                          style="width:100%; aspect-ratio:16/9; border:none; display:block"
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                          allowfullscreen>
                                  </iframe>
                                  <!-- Close/Collapse Button -->
                                  <button (click)="collapseYoutube(msg.id || '')"
                                          style="position:absolute; top:8px; right:8px; width:28px; height:28px; border-radius:50%; background:rgba(0,0,0,0.6); border:none; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(4px)">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                  </button>
                                </div>
                              }

                              <!-- YouTube action row -->
                              <div style="display:flex; gap:6px; margin-top:6px; justify-content:flex-end">
                                @if (expandedYoutubeIds().has(msg.id || '')) {
                                  <a [href]="msg.content" target="_blank" rel="noopener"
                                     style="font-size:10px; color:var(--text-muted); text-decoration:none; display:flex; align-items:center; gap:3px">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                    Open on YouTube
                                  </a>
                                }
                              </div>
                            </div>
                          }
                        </div>
                      }
                    </div>

                    @if (isTeacher() && msg.senderId !== currentUserId()) {
                      <button 
                        class="delete-msg-btn"
                        style="color:#D97706; margin-right:24px"
                        title="Award 10 XP to this student"
                        (click)="awardStudentXP(msg.senderId, msg.senderName)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      </button>
                    }

                    @if (msg.senderId !== currentUserId()) {
                      <button 
                        class="delete-msg-btn"
                        style="color:#EF4444; margin-right:8px"
                        title="Signaler ce message pour abus"
                        (click)="openReportModal(msg)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                      </button>
                    }

                    @if (canDeleteMessage(msg)) {
                      <button 
                        class="delete-msg-btn"
                        title="Delete message (available for 5 min)"
                        (click)="deleteMessage(msg)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                      </button>
                    }
                  </div>
                </div>
              </div>
            } @empty {
              <div class="empty-chat-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom:12px">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <p style="font-weight:600; color:var(--text-primary); margin-bottom:4px">Start the conversation!</p>
                <p style="color:var(--text-secondary); max-width:260px; margin:0 auto; font-size:12px">
                  Write a message in English. Other online students or teachers will reply to practice with you.
                </p>
              </div>
            }
          </div>

          <!-- Bottom Chat Input with Voice Recording capability -->
          <div class="chat-input-wrapper" style="display:flex; flex-direction:column; gap:8px">
            @if (recordingState() === 'recording') {
              <!-- Vocal Recording Active Strip -->
              <div style="background:#F0FDFA; border:1px solid #99F6E4; border-radius:8px; padding:8px 12px; display:flex; justify-content:space-between; align-items:center; width:100%">
                <div style="display:flex; align-items:center; gap:8px">
                  <span class="recording-pulse"></span>
                  <span style="font-size:12px; font-weight:700; color:#0D9488">Recording Voice Message... ({{ recordSeconds() }}s)</span>
                </div>
                <div style="display:flex; gap:8px">
                  <button (click)="cancelVoiceRecording()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center" title="Cancel">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                  <button (click)="stopAndSendVoiceMessage()" style="background:#0D9488; border:none; color:white; padding:4px 10px; border-radius:6px; font-size:11.5px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    Send voice
                  </button>
                </div>
              </div>
            }

            <div style="display:flex; gap:8px; width:100%; align-items:center">
              <!-- Attachment Button (Always show) -->
              <button 
                [disabled]="recordingState() === 'recording'"
                title="Send Image or File"
                (click)="fileInput.click()"
                style="background:none; border:1px solid var(--border); color:#64748B; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
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

              <input 
                type="text" 
                [(ngModel)]="newMessageContent" 
                (keyup.enter)="sendMessage()" 
                [disabled]="recordingState() === 'recording'"
                placeholder="Write in English here..." 
                class="chat-textbox" 
                style="flex:1; height:36px; border-radius:18px; padding:0 14px; font-size:13px; min-width:0" />

              <!-- Voice Recording Button (Always visible) -->
              <button 
                [disabled]="!isVoiceChatAllowed() || recordingState() === 'recording'"
                [style.opacity]="isVoiceChatAllowed() ? '1' : '0.4'"
                [style.cursor]="isVoiceChatAllowed() ? 'pointer' : 'not-allowed'"
                [title]="isVoiceChatAllowed() ? 'Record voice message' : 'Voice messaging locked. Speak with teacher to unlock!'"
                (click)="startVoiceRecording()"
                style="background:none; border:1px solid var(--border); color:#4F46E5; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </button>

              <!-- Send Button (Always visible) -->
              <button class="chat-send-btn" (click)="sendMessage()" [disabled]="!newMessageContent.trim() || recordingState() === 'recording'" style="height:36px; width:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; padding:0; flex-shrink:0">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Right Side Pane: Room Active Members list -->
        <div class="chat-members-pane">
          <div class="pane-title">MEMBERS ONLINE ({{ getActiveOnlineCount() }})</div>
          
          @if (isChannelPrivateAndManageable()) {
            <button class="btn-p" (click)="showAddMemberModal.set(true)" style="font-size:11px; padding:6px 12px; margin:8px 12px; width:calc(100% - 24px); font-weight:700; background:#7C3AED; border-color:#7C3AED">
              ➕ Ajouter un membre
            </button>
          }
          
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
                  <div class="member-name" style="display:flex; align-items:center; justify-content:space-between; gap:4px" [style.color]="m.online ? 'var(--text-primary)' : 'var(--text-muted)'">
                    <div style="display:flex; align-items:center; gap:4px">
                      <span>{{ m.name }}</span>
                      @if (getFlagUrl(m.countryFlag)) {
                        <img [src]="getFlagUrl(m.countryFlag)" style="width: 14px; height: 10px; object-fit: contain; border-radius: 1px" alt="flag">
                      }
                    </div>
                    @if (isChannelPrivateAndManageable()) {
                      <button (click)="removeMember(m.id)" style="background:none; border:none; color:#EF4444; font-size:10px; cursor:pointer; padding:0 4px" title="Retirer du groupe">❌</button>
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

      <!-- Create Channel Modal Dialog (Teacher only) -->
      @if (showCreateChanModal()) {
        <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.65); display:flex; justify-content:center; align-items:center; z-index:99999; padding:16px">
          <div class="card" style="width:100%; max-width:480px; background:#FFF; border-radius:12px; padding:20px; box-shadow:0 10px 25px rgba(0,0,0,0.25); margin:0">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
              <h3 style="font-size:15px; font-weight:700; color:#4F46E5; margin:0">Create New Chat Room</h3>
              <button (click)="showCreateChanModal.set(false)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:18px; font-weight:700; line-height:1; padding:4px">
                ×
              </button>
            </div>

            <div class="input-row" style="margin-bottom:12px">
              <label for="newChanName" class="form-lbl" style="font-size:11px; margin-bottom:4px; display:block">Channel Name</label>
              <input id="newChanName" type="text" [(ngModel)]="newChanName" placeholder="e.g. intermediate-speakers" class="form-input" style="height:36px; font-size:12px; width:100%; border:1px solid var(--border); border-radius:6px; padding:0 10px; background:var(--surface-1); color:var(--text-primary)" />
            </div>

            <div class="input-row" style="margin-top:12px; margin-bottom:12px">
              <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:700; font-size:12px; color:var(--text-primary)">
                <input type="checkbox" [checked]="newChanIsPrivate" (change)="newChanIsPrivate = !newChanIsPrivate" />
                <span>Make Room Private (Invite-only)</span>
              </label>
            </div>

            @if (newChanIsPrivate) {
              <div style="margin-top:12px; border-top:1px solid var(--border-weak); padding-top:10px">
                <label class="form-lbl" style="font-size:11px; margin-bottom:6px; display:block">Select Students to Invite:</label>
                <div style="max-height:140px; overflow-y:auto; display:flex; flex-direction:column; gap:6px; background:var(--surface-2); padding:8px; border-radius:6px; border:1px solid var(--border-weak)">
                  @for (stud of studentList(); track stud.id) {
                    <label style="display:flex; align-items:center; gap:8px; font-size:12px; cursor:pointer; color:var(--text-primary)">
                      <input type="checkbox" [checked]="newChanSelectedStudents().includes(stud.id)" (change)="toggleStudentSelection(stud.id)" />
                      <span>{{ stud.name }} ({{ stud.level }})</span>
                    </label>
                  }
                </div>
              </div>
            }

            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:20px; border-top:1px solid var(--border-weak); padding-top:12px">
              <button class="btn-s" (click)="showCreateChanModal.set(false)" style="height:36px; font-size:12px; padding:0 14px">Cancel</button>
              <button class="btn-p" [disabled]="!newChanName.trim()" (click)="createChannel()" style="height:36px; font-size:12px; padding:0 16px; background:#4F46E5; border-color:#4F46E5">Create Room</button>
            </div>
          </div>
        </div>
      }

      <!-- Members Drawer Overlay on Mobile -->
      @if (showMembersMobile()) {
        <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.65); display:flex; justify-content:center; align-items:center; z-index:99999; padding:16px">
          <div class="card" style="width:100%; max-width:360px; background:#FFF; border-radius:12px; padding:20px; box-shadow:0 10px 25px rgba(0,0,0,0.25); margin:0">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
              <h3 style="font-size:14px; font-weight:700; color:var(--text-primary); margin:0">Active Members</h3>
              <button (click)="showMembersMobile.set(false)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:18px; font-weight:700; line-height:1; padding:4px">
                ×
              </button>
            </div>
            
            <div style="max-height:280px; overflow-y:auto; display:flex; flex-direction:column; gap:8px">
              @for (m of getChannelMembers(); track m.id) {
                <div class="member-item" [class.offline]="!m.online" style="padding:4px 0; display:flex; align-items:center; gap:10px">
                  <div class="member-avatar-box" [style.background]="m.role === 'teacher' ? '#EEF2FF' : '#FFF'" [style.color]="m.role === 'teacher' ? '#4F46E5' : '#111827'">
                    {{ m.avatar }}
                    <span class="status-dot" [class.online]="m.online" [class.offline]="!m.online"></span>
                  </div>
                  <div style="flex:1; min-width:0">
                    <div class="member-name" style="display:flex; align-items:center; gap:4px">
                      <span>{{ m.name }}</span>
                      @if (getFlagUrl(m.countryFlag)) {
                        <img [src]="getFlagUrl(m.countryFlag)" style="width: 14px; height: 10px; object-fit: contain" alt="flag">
                      }
                    </div>
                    <div class="member-subtext" style="font-size:9.5px">
                      {{ m.level }} · {{ m.role | titlecase }}
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Add Member Modal Dialog -->
      @if (showAddMemberModal()) {
        <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.65); display:flex; justify-content:center; align-items:center; z-index:99999; padding:16px">
          <div class="card" style="width:100%; max-width:380px; background:#FFF; border-radius:12px; padding:20px; box-shadow:0 10px 25px rgba(0,0,0,0.25); margin:0">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
              <h3 style="font-size:14px; font-weight:800; color:var(--text-primary); margin:0">Ajouter au groupe</h3>
              <button (click)="showAddMemberModal.set(false)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:18px; font-weight:700; line-height:1; padding:4px">
                ×
              </button>
            </div>
            
            <div style="max-height:240px; overflow-y:auto; display:flex; flex-direction:column; gap:8px">
              @for (u of getNonChannelUsers(); track u.id) {
                <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--surface-2); border-radius:8px; border:1px solid var(--border-weak)">
                  <div style="display:flex; align-items:center; gap:8px">
                    <span style="font-size:14px">{{ u.avatar || '👤' }}</span>
                    <div>
                      <div style="font-size:12.5px; font-weight:700; color:var(--text-primary)">{{ u.name }}</div>
                      <div style="font-size:10px; color:var(--text-muted)">{{ u.role | titlecase }} · {{ u.level }}</div>
                    </div>
                  </div>
                  
                  <button class="btn-p" (click)="addMember(u.id)" style="font-size:10.5px; padding:4px 10px; font-weight:700; background:#7C3AED; border-color:#7C3AED">
                    Ajouter
                  </button>
                </div>
              } @empty {
                <div style="text-align:center; font-size:12px; color:var(--text-muted); padding:16px">Aucun utilisateur disponible.</div>
              }
            </div>
            
            <div style="display:flex; justify-content:flex-end; margin-top:16px; border-top:1px solid var(--border-weak); padding-top:12px">
              <button class="btn-s" (click)="showAddMemberModal.set(false)" style="font-size:11px; padding:6px 12px">Fermer</button>
            </div>
          </div>
        </div>
      }

      <!-- Security Policy / Code of Conduct Modal -->
      @if (showSecurityPolicy()) {
        <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.65); display:flex; justify-content:center; align-items:center; z-index:99999; padding:16px">
          <div class="card" style="width:100%; max-width:520px; background:#FFF; border-radius:12px; padding:24px; box-shadow:0 10px 25px rgba(0,0,0,0.25); margin:0; max-height:90vh; overflow-y:auto">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border-weak); padding-bottom:12px">
              <h3 style="font-size:16px; font-weight:800; color:#4F46E5; margin:0; display:flex; align-items:center; gap:6px">
                🛡️ Charte de Sécurité & Conduite
              </h3>
              <button (click)="showSecurityPolicy.set(false)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:22px; font-weight:700; line-height:1; padding:4px">
                ×
              </button>
            </div>

            <div style="font-size:13px; color:var(--text-secondary); line-height:1.6; display:flex; flex-direction:column; gap:12px">
              <p style="margin:0; font-weight:700; color:var(--text-primary)">
                Bienvenue sur SpeakUp ! Pour que notre espace d'échange reste un lieu d'apprentissage sûr, bienveillant et productif, chaque utilisateur s'engage à respecter les règles suivantes :
              </p>
              
              <div style="background:#FFFEEF; border-left:4px solid #D97706; padding:10px 12px; border-radius:4px">
                <strong style="color:#B45309">🗣️ Parler Uniquement en Anglais :</strong>
                <p style="margin:2px 0 0 0; font-size:12.5px">
                  Tous les messages textuels et vocaux dans le chat principal doivent être rédigés en anglais. C'est le meilleur moyen de progresser rapidement ensemble !
                </p>
              </div>

              <div style="background:#F0FDF4; border-left:4px solid #10B981; padding:10px 12px; border-radius:4px">
                <strong style="color:#047857">🤝 Respect & Bienveillance :</strong>
                <p style="margin:2px 0 0 0; font-size:12.5px">
                  Soyez courtois, encourageant et respectueux envers les autres étudiants. Les moqueries sur le niveau de langue ou les erreurs de grammaire sont formellement interdites.
                </p>
              </div>

              <div style="background:#FEE2E2; border-left:4px solid #EF4444; padding:10px 12px; border-radius:4px">
                <strong style="color:#B91C1C">🚫 Tolérance Zéro pour les Abus :</strong>
                <p style="margin:2px 0 0 0; font-size:12.5px">
                  Le harcèlement, les injures, les propos discriminatoires, sexistes, à caractère sexuel ou menaçants entraîneront un bannissement définitif immédiat de la plateforme par l'équipe enseignante.
                </p>
              </div>

              <div style="background:#EEF2FF; border-left:4px solid #4F46E5; padding:10px 12px; border-radius:4px">
                <strong style="color:#4338CA">⚠️ Système de Signalement :</strong>
                <p style="margin:2px 0 0 0; font-size:12.5px">
                  Si vous constatez un comportement inapproprié ou un abus, cliquez sur l'icône de triangle de danger (⚠️) à côté du message de l'utilisateur pour le signaler instantanément aux professeurs.
                </p>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; margin-top:20px; border-top:1px solid var(--border-weak); padding-top:12px">
              <button class="btn-p" (click)="showSecurityPolicy.set(false)" style="height:38px; font-size:12px; padding:0 24px; background:#4F46E5; border-color:#4F46E5; font-weight:700">
                J'ai compris & J'accepte 👍
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Report Abuse Modal -->
      @if (showReportModal() && reportingMessage()) {
        <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.65); display:flex; justify-content:center; align-items:center; z-index:99999; padding:16px">
          <div class="card" style="width:100%; max-width:480px; background:#FFF; border-radius:12px; padding:20px; box-shadow:0 10px 25px rgba(0,0,0,0.25); margin:0">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
              <h3 style="font-size:15px; font-weight:700; color:#EF4444; margin:0; display:flex; align-items:center; gap:6px">
                ⚠️ Signaler un comportement inapproprié
              </h3>
              <button (click)="closeReportModal()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:18px; font-weight:700; line-height:1; padding:4px">
                ×
              </button>
            </div>

            <div style="background:#FFF5F5; border:1px solid #FED7D7; padding:10px; border-radius:6px; margin-bottom:14px">
              <p style="font-size:11px; color:#C53030; margin:0; font-weight:700">Utilisateur signalé :</p>
              <p style="font-size:13px; color:#2D3748; margin:2px 0 0 0; font-weight:700">{{ reportingMessage()?.senderName }}</p>
              <p style="font-size:11px; color:#718096; margin:6px 0 0 0; font-style:italic">Message : "{{ reportingMessage()?.content }}"</p>
            </div>

            <div class="input-row" style="margin-bottom:12px">
              <label class="form-lbl" style="font-size:11px; margin-bottom:4px; display:block; font-weight:700">Raison du signalement</label>
              <select [(ngModel)]="reportReason" class="form-select" style="height:36px; font-size:12px; width:100%; border:1px solid var(--border); border-radius:6px; padding:0 10px; background:var(--surface-1); color:var(--text-primary)">
                <option value="Harcèlement ou intimidation">Harcèlement ou intimidation (Harassment)</option>
                <option value="Propos offensants ou haineux">Propos offensants ou haineux (Hate Speech)</option>
                <option value="Pas d'anglais dans le chat">Pas d'anglais dans le chat (Not using English)</option>
                <option value="Spam ou liens suspects">Spam ou liens suspects (Spam)</option>
                <option value="Autre">Autre (Other)</option>
              </select>
            </div>

            <div class="input-row" style="margin-bottom:12px">
              <label class="form-lbl" style="font-size:11px; margin-bottom:4px; display:block; font-weight:700">Détails ou explications additionnels (Optionnel)</label>
              <textarea [(ngModel)]="reportDetails" placeholder="Veuillez décrire brièvement ce qui s'est passé..." rows="3" class="form-input" style="font-size:12px; width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:6px; background:var(--surface-1); color:var(--text-primary)"></textarea>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:20px; border-top:1px solid var(--border-weak); padding-top:12px">
              <button class="btn-s" (click)="closeReportModal()" style="height:36px; font-size:12px; padding:0 14px">Annuler</button>
              <button class="btn-p" (click)="submitReport()" style="height:36px; font-size:12px; padding:0 16px; background:#EF4444; border-color:#EF4444; font-weight:700; color:white">Envoyer le Signalement</button>
            </div>
          </div>
        </div>
      }

      <!-- FULLSCREEN IMAGE LIGHTBOX -->
      @if (selectedImageForLightbox(); as imgUrl) {
        <div class="modal-overlay" (click)="selectedImageForLightbox.set(null)" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:999999; padding:24px">
          <div style="position:relative; display:flex; align-items:center; justify-content:center; max-width:90vw; max-height:85vh" (click)="$event.stopPropagation()">
            <img [src]="imgUrl" style="max-width:100%; max-height:85vh; object-fit:contain; border-radius:8px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5)" alt="Lightbox view" />
            
            <button (click)="selectedImageForLightbox.set(null)" style="position:absolute; top:12px; right:12px; background:rgba(0,0,0,0.6); border:none; color:white; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(4px); transition:transform 0.2s" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,

  styles: [`
    .chat-workspace {
      display: flex;
      height: calc(100vh - 180px);
      min-height: 480px;
      background: var(--surface-1);
      border-radius: 12px;
      border: 1px solid var(--border-weak);
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      overflow: hidden;
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

    .channel-row:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    .channel-row.active {
      background: #EEF2FF;
    }

    .channel-row .channel-btn {
      padding: 8px 10px;
    }

    .channel-row .channel-btn.active {
      color: #4F46E5;
      font-weight: 700;
    }

    .channel-actions {
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s ease, transform 0.15s ease;
      transform: scale(0.95);
    }

    .channel-row:hover .channel-actions,
    .channel-row.active .channel-actions {
      opacity: 1;
      pointer-events: auto;
      transform: scale(1);
    }

    .chan-action-btn {
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid var(--border-weak);
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      width: 22px;
      height: 22px;
      transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .chan-action-btn:hover {
      transform: translateY(-1px) scale(1.08);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .chan-action-btn:active {
      transform: translateY(0) scale(0.95);
    }

    .chan-action-btn.edit-btn {
      color: #4F46E5;
      background: #EEF2FF;
      border-color: #C7D2FE;
    }
    
    .chan-action-btn.edit-btn:hover {
      background: #4F46E5;
      color: white;
      border-color: #4F46E5;
    }

    .chan-action-btn.delete-btn {
      color: #EF4444;
      background: #FEF2F2;
      border-color: #FCA5A5;
    }
    
    .chan-action-btn.delete-btn:hover {
      background: #EF4444;
      color: white;
      border-color: #EF4444;
    }

    .unread-badge {
      background: #EF4444;
      color: white;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 10px;
      margin-left: auto;
      min-width: 18px;
      text-align: center;
    }

    .hashtag {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-muted);
    }

    /* Middle Pane */
    .chat-messages-pane {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: #FFF;
    }

    .chat-messages-header {
      height: 48px;
      border-bottom: 1px solid var(--border-weak);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      flex-shrink: 0;
    }

    .chat-scroll-container {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message-bubble-row {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      max-width: 80%;
    }

    .message-bubble-row.is-me {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .message-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--surface-2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      border: 1px solid var(--border-weak);
      flex-shrink: 0;
    }

    .message-content-col {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .message-meta-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
    }

    .message-meta-row.is-me {
      flex-direction: row-reverse;
    }

    .msg-sender-name {
      font-weight: 700;
      color: var(--text-primary);
    }

    .role-badge {
      font-size: 8.5px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .role-badge.teacher {
      background: #EEF2FF;
      color: #4F46E5;
    }

    .role-badge.student {
      background: var(--surface-3);
      color: var(--text-secondary);
    }

    .msg-time {
      color: var(--text-muted);
    }

    .message-bubble {
      background: var(--surface-2);
      color: var(--text-primary);
      padding: 10px 14px;
      border-radius: 0 12px 12px 12px;
      font-size: 12.5px;
      line-height: 1.4;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .message-bubble.me {
      background: #4F46E5;
      color: #FFF;
      border-radius: 12px 0 12px 12px;
    }

    .chat-input-wrapper {
      padding: 16px;
      border-top: 1px solid var(--border-weak);
      flex-shrink: 0;
    }

    .chat-textbox {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 12.5px;
      outline: none;
      background: var(--surface-1);
      transition: all 0.2s;
    }

    .chat-textbox:focus {
      border-color: #4F46E5;
      background: #FFF;
    }

    .chat-send-btn {
      background: #4F46E5;
      color: #FFF;
      border: none;
      border-radius: 8px;
      padding: 8px 12px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .chat-send-btn:hover {
      background: #4338CA;
    }

    .chat-send-btn:disabled {
      background: var(--surface-3);
      color: var(--text-muted);
      cursor: not-allowed;
    }

    /* Right active members pane */
    .chat-members-pane {
      width: 220px;
      border-left: 1px solid var(--border-weak);
      display: flex;
      flex-direction: column;
      background: var(--surface-2);
      flex-shrink: 0;
      padding: 16px 8px;
    }

    .members-list-wrapper {
      display: flex;
      flex-direction: column;
      gap: 8px;
      overflow-y: auto;
    }

    .member-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 8px;
      border-radius: 6px;
    }

    .member-item.offline {
      opacity: 0.6;
    }

    .member-avatar-box {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #FFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 15px;
      position: relative;
      border: 1px solid var(--border-weak);
      flex-shrink: 0;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      position: absolute;
      bottom: 0;
      right: 0;
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
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .member-subtext {
      font-size: 10px;
      color: var(--text-muted);
      margin-top: 1px;
    }

    .empty-chat-placeholder {
      text-align: center;
      padding: 60px 20px;
    }

    .recording-pulse {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #0D9488;
      display: inline-block;
      animation: pulse-teal 1s infinite;
    }
    @keyframes pulse-teal {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(13, 148, 136, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(13, 148, 136, 0); }
    }

    @keyframes ytPlayPulse {
      0%   { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.6); }
      60%  { box-shadow: 0 0 0 18px rgba(255, 255, 255, 0); }
      100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
    }

    @keyframes reactionPickerIn {
      from { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.85); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
    }

    .yt-cinema-card {
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      transition: box-shadow 0.2s;
    }
    .yt-cinema-card:hover {
      box-shadow: 0 8px 32px rgba(0,0,0,0.22);
    }


    .voice-wave-bar {
      width: 2.5px;
      background: var(--text-secondary);
      border-radius: 2px;
      animation: wave-vibrate 0.8s ease-in-out infinite alternate;
    }
    .message-bubble.me:not(.audio-msg) .voice-wave-bar {
      background: rgba(255, 255, 255, 0.7);
    }
    .message-bubble.audio-msg.me .voice-wave-bar {
      background: #3B82F6;
    }
    .message-bubble.audio-msg:not(.me) .voice-wave-bar {
      background: #10B981;
    }
    .voice-wave-bar.playing {
      background: #34D399 !important;
      animation: wave-vibrate-playing 0.3s ease-in-out infinite alternate;
    }
    @keyframes wave-vibrate {
      0% { height: 4px; }
      100% { height: 12px; }
    }
    @keyframes wave-vibrate-playing {
      0% { height: 3px; }
      100% { height: 22px; }
    }

    /* Responsive */
    @media (max-width: 900px) {
      .chat-channels-pane {
        width: 160px;
        padding: 12px 6px;
      }
      .chat-members-pane {
        width: 180px;
        padding: 12px 6px;
      }
      .channel-btn {
        font-size: 11px;
        padding: 6px 10px;
      }
      .pane-title {
        font-size: 9px;
      }
    }

    @media (max-width: 768px) {
      .chat-channels-pane {
        display: none !important;
      }
      .chat-members-pane {
        display: none !important;
      }
      .chat-workspace {
        height: auto !important;
      }
    }

    @media (min-width: 1200px) {
      .chat-channels-pane {
        width: 240px;
      }
      .chat-members-pane {
        width: 260px;
      }
      .channel-btn {
        font-size: 13px;
        padding: 10px 14px;
      }
    }

    .delete-msg-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      opacity: 0;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .message-bubble-row:hover .delete-msg-btn {
      opacity: 0.6;
    }

    .delete-msg-btn:hover {
      opacity: 1 !important;
      color: #EF4444;
      background: var(--surface-2);
    }

    .message-bubble.audio-msg {
      background: #F0FDF4;
      border: 0.5px solid #D1FAE5;
      color: #065F46;
      padding: 6px 10px !important;
      border-radius: 0 12px 12px 12px;
      min-width: 215px;
      max-width: 290px;
    }
    
    .message-bubble.audio-msg.me {
      background: #EFF6FF;
      border: 0.5px solid #DBEAFE;
      color: #1E40AF;
      border-radius: 12px 0 12px 12px;
      padding: 6px 10px !important;
      min-width: 215px;
      max-width: 290px;
    }

    .audio-transcript {
      font-size: 10px;
      font-style: italic;
      border-top: 0.5px solid rgba(0, 0, 0, 0.05);
      padding-top: 2px;
      margin-top: 2px;
      color: inherit;
      opacity: 0.8;
    }

    /* Mobile Responsive Chat Layout overrides */
    .show-mobile-inline {
      display: none;
    }

    /* Unread notification badge styling */
    .unread-badge {
      background: #EF4444;
      color: white;
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 10px;
      margin-left: auto;
      min-width: 18px;
      text-align: center;
    }

    .channel-select-dropdown {
      font-size: 12.5px;
      font-weight: 700;
      color: var(--text-primary);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 2px 20px 2px 6px;
      background: var(--surface-1);
      cursor: pointer;
      outline: none;
      max-width: 140px;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
      appearance: none;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>");
      background-repeat: no-repeat;
      background-position: right 6px center;
    }

    @media (max-width: 768px) {
      .show-mobile-inline {
        display: inline-block !important;
      }
      .hide-mobile {
        display: none !important;
      }
      .chat-messages-header {
        padding: 0 10px !important;
        height: 42px;
      }
      .message-bubble-row {
        max-width: 92% !important;
      }
      .chat-input-wrapper {
        padding: 10px !important;
      }
      .chat-send-btn {
        width: 34px !important;
        height: 34px !important;
      }
      .chat-workspace {
        height: calc(100vh - 125px) !important;
      }
    }

    @media (max-width: 480px) {
      .chat-workspace {
        height: calc(100vh - 110px) !important;
      }
      .message-bubble-row {
        max-width: 95% !important;
      }
      .chat-scroll-container {
        padding: 10px !important;
      }
      .chat-messages-header {
        padding: 0 8px !important;
      }
    }
  `]
})
export class StudentChatComponent implements OnDestroy {
  private sanitizer = inject(DomSanitizer);

  selectedImageForLightbox = signal<string | null>(null);

  openImageModal(url: string) {
    this.selectedImageForLightbox.set(url);
  }

  // ── YouTube Cinema Card ────────────────────────────────────────────────
  expandedYoutubeIds = signal<Set<string>>(new Set());
  youtubeTitleCache = new Map<string, string>(); // videoId -> title

  expandYoutube(msgId: string, videoId: string) {
    const s = new Set(this.expandedYoutubeIds());
    s.add(msgId);
    this.expandedYoutubeIds.set(s);
    // Fetch title if not cached
    if (!this.youtubeTitleCache.has(videoId)) {
      fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
        .then(r => r.json())
        .then(data => {
          this.youtubeTitleCache.set(videoId, data.title || 'YouTube Video');
        })
        .catch(() => { this.youtubeTitleCache.set(videoId, 'YouTube Video'); });
    }
  }

  collapseYoutube(msgId: string) {
    const s = new Set(this.expandedYoutubeIds());
    s.delete(msgId);
    this.expandedYoutubeIds.set(s);
  }

  getYoutubeTitle(videoId: string): string {
    // Also trigger a fetch if not cached yet (for thumbnail mode)
    if (!this.youtubeTitleCache.has(videoId)) {
      this.youtubeTitleCache.set(videoId, ''); // mark as fetching
      fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
        .then(r => r.json())
        .then(data => { this.youtubeTitleCache.set(videoId, data.title || 'YouTube Video'); })
        .catch(() => { this.youtubeTitleCache.set(videoId, 'YouTube Video'); });
    }
    return this.youtubeTitleCache.get(videoId) || '';
  }

  getYoutubeVideoId(text: string): string | null {
    if (!text) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = text.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  getSafeYoutubeUrl(id: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${id}?autoplay=1`);
  }

  // ── Image Emoji Reactions ──────────────────────────────────────────────
  reactionTypes = [
    { key: 'heart', emoji: '❤️', label: 'Heart', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" stroke-width="1"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>' },
    { key: 'like', emoji: '👍', label: 'Like', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#3B82F6" stroke="#2563EB" stroke-width="1"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>' },
    { key: 'laugh', emoji: '😂', label: 'Laugh', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FBBF24" stroke="#D97706" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><path d="M8 11.5s1.5-1 4-1 4 1 4 1" stroke-linecap="round"/><path d="M8 15s1.5 3 4 3 4-3 4-3H8z" fill="#FFF"/><path d="M10 7.5L8.5 8M14 7.5l1.5.5" stroke-width="2" stroke-linecap="round"/></svg>' },
    { key: 'wow', emoji: '😮', label: 'Wow', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FBBF24" stroke="#D97706" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><circle cx="8" cy="9" r="1.5" fill="#451A03" stroke="none"/><circle cx="16" cy="9" r="1.5" fill="#451A03" stroke="none"/><ellipse cx="12" cy="15" rx="2.5" ry="3.5" fill="#451A03" stroke="none"/></svg>' },
    { key: 'sad', emoji: '😢', label: 'Sad', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#FBBF24" stroke="#D97706" stroke-width="1.2"><circle cx="12" cy="12" r="10"/><circle cx="8.5" cy="9.5" r="1.2" fill="#451A03" stroke="none"/><circle cx="15.5" cy="9.5" r="1.2" fill="#451A03" stroke="none"/><path d="M9 15.5s1.5-1.5 3-1.5 3 1.5 3 1.5" stroke-linecap="round"/><path d="M8 11v3" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round"/></svg>' },
    { key: 'fire', emoji: '🔥', label: 'Fire', svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#F97316" stroke="#EA580C" stroke-width="1"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z"/></svg>' }
  ];
  hoveredImageMsgId = signal<string>('');
  activeReactionPickerMsgId = signal<string>('');

  toggleReactionPicker(msgId: string, event: Event) {
    event.stopPropagation();
    if (this.activeReactionPickerMsgId() === msgId) {
      this.activeReactionPickerMsgId.set('');
    } else {
      this.activeReactionPickerMsgId.set(msgId);
    }
  }

  toggleReaction(msg: ChatMessage, typeKey: string) {
    const userId = this.currentUserId();
    if (!userId || !msg.id) return;
    this.activeReactionPickerMsgId.set('');

    // Optimistic update
    const msgs = this.messages();
    const idx = msgs.findIndex(m => m.id === msg.id);
    if (idx < 0) return;
    const updated = { ...msgs[idx] };
    if (!updated.reactions) updated.reactions = {};

    // Clear user from all other reactions
    Object.keys(updated.reactions).forEach(k => {
      if (k !== typeKey) {
        updated.reactions![k] = (updated.reactions![k] || []).filter(id => id !== userId);
        if (updated.reactions![k].length === 0) {
          delete updated.reactions![k];
        }
      }
    });

    // Toggle current reaction
    if (!updated.reactions[typeKey]) {
      updated.reactions[typeKey] = [];
    }
    const reactorIdx = updated.reactions[typeKey].indexOf(userId);
    if (reactorIdx >= 0) {
      updated.reactions[typeKey] = updated.reactions[typeKey].filter(id => id !== userId);
      if (updated.reactions[typeKey].length === 0) {
        delete updated.reactions[typeKey];
      }
    } else {
      updated.reactions[typeKey] = [...updated.reactions[typeKey], userId];
    }

    const newMsgs = [...msgs];
    newMsgs[idx] = updated;
    this.messages.set(newMsgs);

    // Persist
    this.db.toggleMessageReaction(this.activeChannel(), msg.id, typeKey, userId).catch(console.warn);
  }

  hasMyReaction(msg: ChatMessage, typeKey: string): boolean {
    const uid = this.currentUserId();
    return !!(uid && msg.reactions?.[typeKey]?.includes(uid));
  }

  getReactionList(msg: ChatMessage): { key: string; count: number }[] {
    if (!msg.reactions) return [];
    return Object.entries(msg.reactions)
      .filter(([, users]) => users.length > 0)
      .map(([key, users]) => ({ key, count: users.length }));
  }

  getReactionSvg(key: string): string {
    const found = this.reactionTypes.find(r => r.key === key);
    return found ? found.svg : '';
  }

  getReactionTotalCount(msg: ChatMessage): number {
    if (!msg.reactions) return 0;
    return Object.values(msg.reactions).reduce((sum, users) => sum + (users || []).length, 0);
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

  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  activeChannel = signal<string>('general');
  messages = signal<ChatMessage[]>([]);
  newMessageContent = '';
  unreadCounts = signal<{[channelId: string]: number}>({});
  currentUser: UserProfile | null = null;
  private chatSub: Subscription | null = null;
  private localUpdateListener: any;

  dbUsers = signal<UserProfile[]>([]);
  channels = signal<ChatChannel[]>([]);
  
  // Custom channel creation states
  showCreateChanModal = signal<boolean>(false);
  newChanName = '';
  newChanIsPrivate = false;
  newChanSelectedStudents = signal<string[]>([]);
  showMembersMobile = signal<boolean>(false);
  showAddMemberModal = signal<boolean>(false);
  
  // Safety & abuse reporting signals
  showSecurityPolicy = signal<boolean>(false);
  showReportModal = signal<boolean>(false);
  reportingMessage = signal<ChatMessage | null>(null);
  reportReason = 'Harcèlement ou intimidation';
  reportDetails = '';
  
  studentList = computed(() => {
    return this.dbUsers().filter(u => u.role === 'student');
  });

  visibleChannels = computed(() => {
    const list = this.channels();
    const isTeacher = this.isTeacher();
    const isAdmin = this.currentUser?.role === 'admin';
    const uid = this.currentUserId();
    
    return list.filter(c => {
      if (isTeacher || isAdmin) return true;
      const isDm = c.isPrivate;
      if (!isDm) return true;
      return !!(c.members?.includes(uid));
    });
  });

  // Voice recording state variables
  recordingState = signal<'idle' | 'recording' | 'finished'>('idle');
  recordSeconds = signal<number>(0);
  private timerInterval: any = null;
  playingMessageId = signal<string | null>(null);

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private currentAudioPlayer: HTMLAudioElement | null = null;
  private recognitionInstance: any = null;
  private recordedTranscript = '';

  constructor() {
    this.db.observeCurrentUser().subscribe(u => this.currentUser = u);
    this.db.observeUsers().subscribe(list => this.dbUsers.set(list));
    this.db.observeChannels().subscribe(list => this.channels.set(list));
    this.subscribeToChat();

    // Listen for custom chat notification events from layout
    window.addEventListener('chat-notification', (event: any) => {
      const { channelId, channelName } = event.detail;
      const current = this.unreadCounts();
      if (channelId !== this.activeChannel()) {
        this.unreadCounts.set({
          ...current,
          [channelId]: (current[channelId] || 0) + 1
        });
      }
    });

    // Listen to local updates
    this.localUpdateListener = (e: any) => {
      if (e.detail && e.detail.channelId === this.activeChannel()) {
        this.subscribeToChat();
      }
    };
    window.addEventListener('local-chat-update', this.localUpdateListener);

    // Listen to trigger-teacher-dm events
    window.addEventListener('trigger-teacher-dm', () => {
      this.startConversationWithTeacher();
    });
  }

  startConversationWithTeacher() {
    const uid = this.currentUserId();
    const uName = this.currentUser?.name || 'Student';
    const teacher = this.dbUsers().find(u => u.role === 'teacher');
    if (!teacher) {
      this.dialogService.alert('Erreur', 'Aucun professeur n\'est disponible pour le moment.', 'info');
      return;
    }

    // Deterministic channel ID so the same DM is never created twice
    const dmId = `dm-${[uid, teacher.id].sort().join('-')}`;
    const chanName = `conv-${uName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    // Check if channel already exists (by deterministic ID first, then by name)
    const exists = this.channels().find(c => c.id === dmId)
      || this.channels().find(c => c.name === chanName && c.isPrivate && c.members?.includes(uid));

    if (exists) {
      this.switchChannel(exists.id);
      return;
    }

    // Create with the deterministic ID so it can be found immediately
    const newChan: any = {
      id: dmId,
      name: chanName,
      createdById: uid,
      createdByRole: 'student',
      isPrivate: true,
      members: [uid, teacher.id]
    };

    // Add to local state immediately so the student sees it right away
    const list = [...this.channels(), newChan];
    this.db['channels$'].next(list);
    this.db['saveLocal']('speak_channels', list);

    // Persist to Firestore in the background
    this.db.addChannelWithId(dmId, newChan).then(() => {
      this.switchChannel(dmId);
    });

    // Switch immediately without waiting for Firestore
    this.switchChannel(dmId);
  }

  isTeacher(): boolean {
    return this.currentUser?.role === 'teacher';
  }

  isVoiceChatAllowed(): boolean {
    return true;
  }

  currentUserId() {
    return this.currentUser?.id || '';
  }

  canDeleteMessage(msg: ChatMessage): boolean {
    if (this.isTeacher()) return true;
    return msg.senderId === this.currentUserId();
  }

  deleteMessage(msg: ChatMessage) {
    if (!msg.id) return;
    this.db.deleteChatMessage(this.activeChannel(), msg.id);
  }

  getChannelLabel() {
    const active = this.activeChannel();
    const match = this.channels().find(c => c.id === active);
    return match ? match.name : active;
  }

  toggleStudentSelection(studentId: string) {
    const active = this.newChanSelectedStudents();
    if (active.includes(studentId)) {
      this.newChanSelectedStudents.set(active.filter(id => id !== studentId));
    } else {
      this.newChanSelectedStudents.set([...active, studentId]);
    }
  }

  createChannel() {
    if (!this.newChanName.trim()) return;
    const name = this.newChanName.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const isPrivate = this.newChanIsPrivate;
    const members = isPrivate ? this.newChanSelectedStudents() : [];

    this.db.addChannel(name, isPrivate, members);
    this.dialogService.alert('Success', `Channel #${name} created successfully!`, 'success');

    // Reset fields
    this.newChanName = '';
    this.newChanIsPrivate = false;
    this.newChanSelectedStudents.set([]);
    this.showCreateChanModal.set(false);
  }

  openReportModal(msg: ChatMessage) {
    this.reportingMessage.set(msg);
    this.reportReason = 'Harcèlement ou intimidation';
    this.reportDetails = '';
    this.showReportModal.set(true);
  }

  closeReportModal() {
    this.showReportModal.set(false);
    this.reportingMessage.set(null);
  }

  submitReport() {
    const msg = this.reportingMessage();
    if (!msg) return;

    const currentUserName = this.currentUser?.name || 'Étudiant';
    const reportData = {
      reportedUserId: msg.senderId,
      reportedUserName: msg.senderName,
      reporterUserId: this.currentUserId(),
      reporterUserName: currentUserName,
      reason: this.reportReason,
      details: this.reportDetails.trim() || `Signalement lié au message : "${msg.content}"`
    };

    this.db.addReport(reportData).then(() => {
      this.dialogService.alert('Signalement Envoyé', 'Merci pour votre signalement. L\'équipe enseignante va examiner ce comportement très rapidement.', 'success');
      this.closeReportModal();
    });
  }

  removeChannel(chan: ChatChannel) {
    this.dialogService.show({
      title: 'Close Chat Room',
      message: `Are you sure you want to delete the channel #${chan.name}? This will remove all messages inside it.`,
      type: 'confirm',
      confirmText: 'Delete Room',
      cancelText: 'Cancel',
      onConfirm: () => {
        const remaining = this.channels().filter(c => c.id !== chan.id);
        const fallback = remaining.length > 0 ? remaining[0].id : '';
        this.db.deleteChannel(chan.id);
        this.activeChannel.set(fallback);
        this.subscribeToChat();
        this.dialogService.alert('Deleted', 'Chat room deleted successfully!', 'success');
      }
    });
  }

  renameChannelPrompt(chan: ChatChannel) {
    const promptTitle = this.currentUser?.role === 'teacher' ? 'Renommer le groupe :' : 'Rename the group:';
    const newName = window.prompt(promptTitle, chan.name);
    if (newName && newName.trim() && newName.trim() !== chan.name) {
      this.db.renameChannel(chan.id, newName.trim());
      this.dialogService.alert('Succès', 'Le groupe a été renommé.', 'success');
    }
  }

  awardStudentXP(studentId: string, studentName: string) {
    this.db.updateUserXP(studentId, 10, true);
    this.dialogService.alert('XP Awarded', `Awarded +10 XP to ${studentName} for great English communication!`, 'success');
  }

  isChannelPrivateAndManageable(): boolean {
    const channelId = this.activeChannel();
    const chan = this.channels().find(c => c.id === channelId);
    if (!chan) return false;
    
    const user = this.currentUser;
    const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
    const isCreator = chan.createdById === this.currentUserId();
    
    return !!(chan.isPrivate && (isTeacherOrAdmin || isCreator));
  }

  getNonChannelUsers(): UserProfile[] {
    const channelId = this.activeChannel();
    const chan = this.channels().find(c => c.id === channelId);
    if (!chan) return [];
    
    return this.dbUsers().filter(u => {
      if (u.id === this.currentUserId()) return false;
      if (chan.members && chan.members.includes(u.id)) return false;
      return true;
    });
  }

  addMember(memberId: string) {
    const channelId = this.activeChannel();
    this.db.addMemberToChannel(channelId, memberId).then(() => {
      this.dialogService.alert('Succès', 'Le membre a été ajouté au groupe avec succès.', 'success');
      this.showAddMemberModal.set(false);
    });
  }

  removeMember(memberId: string) {
    const channelId = this.activeChannel();
    this.dialogService.show({
      title: "Retirer du groupe",
      message: "Voulez-vous vraiment retirer ce membre du groupe ?",
      type: 'confirm',
      confirmText: 'Retirer',
      cancelText: 'Annuler',
      onConfirm: () => {
        this.db.removeMemberFromChannel(channelId, memberId).then(() => {
          this.dialogService.alert('Retiré', 'Le membre a été retiré du groupe.', 'success');
        });
      }
    });
  }

  getChannelMembers(): ChatMember[] {
    const channelId = this.activeChannel();
    const chan = this.channels().find(c => c.id === channelId);

    return this.dbUsers()
      .filter(u => u.id !== this.currentUserId())
      .filter(u => {
        if (chan && chan.isPrivate) {
          return chan.members?.includes(u.id);
        }
        return true;
      })
      .map(u => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar || (u.role === 'teacher' ? '👩‍🏫' : '👤'),
        level: u.level,
        role: u.role,
        online: this.db.isUserOnline(u),
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
    const simFound = this.getChannelMembers().find(m => m.id === msg.senderId || m.name === msg.senderName);
    if (simFound && simFound.countryFlag) {
      return simFound.countryFlag;
    }
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
    // Clear unread count for this channel
    const current = this.unreadCounts();
    const updated = { ...current };
    delete updated[channelId];
    this.unreadCounts.set(updated);
  }

  onChannelSelectChange(event: any) {
    this.switchChannel(event.target.value);
  }

  subscribeToChat() {
    const active = this.activeChannel();
    const visible = this.visibleChannels();
    const isTeacher = this.isTeacher();
    const isAdmin = this.currentUser?.role === 'admin';
    if (!isTeacher && !isAdmin && !visible.some(c => c.id === active)) {
      const firstVal = visible.length > 0 ? visible[0].id : 'general';
      this.activeChannel.set(firstVal);
    }

    if (this.chatSub) {
      this.chatSub.unsubscribe();
    }
    
    this.chatSub = this.db.observeChatMessages(this.activeChannel()).subscribe(list => {
      const prevLength = this.messages().length;
      this.messages.set(list);
      this.scrollToBottom();

      // Dispatch notification if new messages arrived while user was in another channel
      if (list.length > prevLength && prevLength > 0) {
        const newMsg = list[list.length - 1];
        if (newMsg && newMsg.senderId !== this.currentUserId()) {
          window.dispatchEvent(new CustomEvent('chat-notification', {
            detail: {
              channelId: this.activeChannel(),
              channelName: this.getChannelLabel()
            }
          }));
        }
      }
    });
  }

  async sendMessage() {
    const text = this.newMessageContent.trim();
    if (!text) return;
    
    this.newMessageContent = '';
    await this.db.sendChatMessage(this.activeChannel(), text);
  }

  // Voice recording methods for chat
  startVoiceRecording() {
    if (!this.isVoiceChatAllowed()) return;
    this.recordedTranscript = '';
    
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      // iOS/Safari compatible MIME type selection
      const mimeType = this.getSupportedAudioMimeType();
      const options: MediaRecorderOptions = mimeType ? { mimeType } : {};
      this.mediaRecorder = new MediaRecorder(stream, options);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start();
      this.recordingState.set('recording');
      this.recordSeconds.set(0);
      
      this.timerInterval = setInterval(() => {
        this.recordSeconds.set(this.recordSeconds() + 1);
      }, 1000);

      // Start recognition in parallel
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          this.recognitionInstance = new SpeechRecognition();
          this.recognitionInstance.continuous = true;
          this.recognitionInstance.interimResults = false;
          this.recognitionInstance.lang = 'en-US';
          
          this.recognitionInstance.onresult = (e: any) => {
            for (let i = e.resultIndex; i < e.results.length; ++i) {
              if (e.results[i].isFinal) {
                this.recordedTranscript += e.results[i][0].transcript + ' ';
              }
            }
          };
          this.recognitionInstance.start();
        } catch (e) {
          console.error("SpeechRecognition initialization failed:", e);
        }
      }
    }).catch(err => {
      console.error("Microphone access denied:", err);
    });
  }

  cancelVoiceRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch (e) {}
      this.recognitionInstance = null;
    }
    clearInterval(this.timerInterval);
    this.recordingState.set('idle');
    this.recordSeconds.set(0);
  }

  async stopAndSendVoiceMessage() {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      clearInterval(this.timerInterval);
      this.recordingState.set('idle');
      return;
    }

    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch (e) {}
    }

    this.mediaRecorder.onstop = () => {
      const mimeType = this.getSupportedAudioMimeType();
      const blobType = mimeType || 'audio/webm';
      const audioBlob = new Blob(this.audioChunks, { type: blobType });
      
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const finalTranscript = this.recordedTranscript.trim() || 'Voice Message';
        await this.db.sendChatMessage(this.activeChannel(), finalTranscript, 'audio', base64Data);
      };
      this.mediaRecorder?.stream.getTracks().forEach(t => t.stop());
    };

    this.mediaRecorder.stop();
    clearInterval(this.timerInterval);
    this.recordingState.set('idle');
  }

  playChatMessageAudio(msg: ChatMessage) {
    if (msg.audioUrl) {
      if (this.currentAudioPlayer && this.playingMessageId() === msg.id) {
        this.currentAudioPlayer.pause();
        this.playingMessageId.set(null);
        return;
      }

      if (this.currentAudioPlayer) {
        this.currentAudioPlayer.pause();
      }

      this.playingMessageId.set(msg.id || null);
      this.currentAudioPlayer = new Audio(msg.audioUrl);
      
      this.currentAudioPlayer.onended = () => {
        this.playingMessageId.set(null);
      };
      this.currentAudioPlayer.onerror = () => {
        this.playingMessageId.set(null);
        this.playTTSFallback(msg.content);
      };
      
      this.currentAudioPlayer.play().catch(err => {
        console.error("Audio playback error:", err);
        this.playTTSFallback(msg.content);
      });
    } else {
      this.playTTSFallback(msg.content);
    }
  }

  private playTTSFallback(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.onend = () => this.playingMessageId.set(null);
      utterance.onerror = () => this.playingMessageId.set(null);
      window.speechSynthesis.speak(utterance);
    } else {
      this.playingMessageId.set(null);
    }
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
    
    if (this.currentAudioPlayer) {
      try {
        this.currentAudioPlayer.pause();
        this.currentAudioPlayer = null;
      } catch (e) {}
    }
    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.stop();
      } catch (e) {}
      this.recognitionInstance = null;
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
        this.mediaRecorder.stream.getTracks().forEach(t => t.stop());
      } catch (e) {}
      this.mediaRecorder = null;
    }
    clearInterval(this.timerInterval);
  }

  private getSupportedAudioMimeType(): string {
    // iOS/Safari compatible MIME type detection
    const types = [
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4',
      'audio/aac',
      'audio/webm;codecs=opus',
      'audio/webm'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  }
}
