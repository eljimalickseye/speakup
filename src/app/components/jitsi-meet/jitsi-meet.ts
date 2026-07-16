import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { DialogService } from '../../services/dialog.service';
import { DatabaseService, LivePoll } from '../../services/database.service';
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  RemoteTrack,
  Track,
  VideoTrack,
  AudioTrack
} from 'livekit-client';

interface ParticipantModel {
  identity: string;
  name: string;
  isLocal: boolean;
  isBot: boolean;
  isSpeaking: boolean;
  videoTrack: VideoTrack | null;
  audioTrack: AudioTrack | null;
  screenShareTrack?: VideoTrack | null;
  micEnabled: boolean;
  camEnabled: boolean;
}

@Component({
  selector: 'app-jitsi-meet',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="livekit-wrapper">
      <!-- Header bar with class room title & agent indicator -->
      <div class="livekit-control-bar">
        <span class="room-title">
          <i class="ti ti-video" aria-hidden="true" [class.recording-blink]="isRecording()"></i> 
          Live Room: <span class="room-highlight">#{{ roomName }}</span>
          @if (isRecording()) {
            <span class="rec-badge">
              <span class="rec-dot"></span> REC {{ recordingDuration() }}
            </span>
          }
        </span>
        
        <div class="center-status-badge">
          @if (expectsBot()) {
            @if (isBotOnline()) {
              <span class="status-indicator bot-online">
                <span class="pulse-dot"></span> AI Assistant Connected
              </span>
            } @else {
              <span class="status-indicator bot-connecting">
                <span class="loading-spin"></span> AI Agent Starting...
              </span>
            }
          } @else {
            <span class="status-indicator active" style="background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.3)">
              <span class="pulse-dot" style="background: #10B981"></span> Session Active
            </span>
          }
        </div>

        <div class="livekit-actions">
          <span class="status-indicator active">
            {{ statusText }}
          </span>
        </div>
      </div>

      <!-- Main classroom layout (split pane for video grid vs whiteboard / chat sidebar) -->
      <div class="main-classroom-area">
        
        <!-- Left Workspace Area (Video Grid / Whiteboard / Screen Share) -->
        <div class="left-workspace-pane">
          
          @if (showWhiteboard()) {
            <!-- Collaborative Whiteboard -->
            <div class="whiteboard-container">
              <!-- Whiteboard toolbar -->
              <div class="wb-toolbar">
                <div style="display:flex; align-items:center; gap:8px">
                  <span style="font-size:11px; font-weight:700; color:#475569">Outils :</span>
                  <!-- SELECT / MOVE TOOL -->
                  <button (click)="whiteboardTool.set('select')" class="wb-tool-btn" [class.active]="whiteboardTool() === 'select'" title="Sélectionner & Déplacer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/><path d="m13 13 6 6"/></svg>
                  </button>
                  <button (click)="whiteboardTool.set('pen')" class="wb-tool-btn" [class.active]="whiteboardTool() === 'pen'" title="Crayon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  </button>
                  <button (click)="whiteboardTool.set('line')" class="wb-tool-btn" [class.active]="whiteboardTool() === 'line'" title="Ligne">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="19" x2="19" y2="5"/></svg>
                  </button>
                  <button (click)="whiteboardTool.set('arrow')" class="wb-tool-btn" [class.active]="whiteboardTool() === 'arrow'" title="Flèche">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="19 11 19 5 13 5"/></svg>
                  </button>
                  <button (click)="whiteboardTool.set('rect')" class="wb-tool-btn" [class.active]="whiteboardTool() === 'rect'" title="Rectangle">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                  </button>
                  <button (click)="whiteboardTool.set('circle')" class="wb-tool-btn" [class.active]="whiteboardTool() === 'circle'" title="Cercle">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>
                  </button>
                  <button (click)="whiteboardTool.set('sticky')" class="wb-tool-btn" [class.active]="whiteboardTool() === 'sticky'" title="Sticky Note">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                  </button>
                  <button (click)="whiteboardTool.set('eraser')" class="wb-tool-btn" [class.active]="whiteboardTool() === 'eraser'" title="Gomme">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 2-2 4 4-10 8L4 16H2v-2h20v2Z"/><path d="M12 2v10"/><path d="M16 2v6"/><path d="M8 2v8"/></svg>
                  </button>
                </div>
                
                <div style="display:flex; align-items:center; gap:8px">
                  <span style="font-size:11px; font-weight:700; color:#475569">Couleur :</span>
                  @for (color of ['#4F46E5', '#10B981', '#F59E0B', '#F43F5E', '#8B5CF6', '#1E293B']; track color) {
                    <button (click)="whiteboardColor.set(color)" 
                            [style.background]="color" 
                            [style.transform]="whiteboardColor() === color ? 'scale(1.2)' : 'scale(1)'"
                            [style.border-color]="whiteboardColor() === color ? '#000' : 'transparent'"
                            style="width:16px; height:16px; border-radius:50%; border:2px solid; cursor:pointer; transition:transform 0.1s">
                    </button>
                  }
                </div>

                <div style="display:flex; gap:8px">
                  <!-- DELETE SELECTED ELEMENT BUTTON (only visible when element selected) -->
                  @if (whiteboardTool() === 'select' && selectedElementId()) {
                    <button class="btn-s" 
                            (click)="deleteSelectedElement()" 
                            style="padding:4px 10px; font-size:11px; border-color:#EF4444; color:#EF4444; background:#FFF1F2; display:inline-flex; align-items:center; gap:5px; font-weight:700; animation:fadeIn 0.15s">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      Supprimer l'élément
                    </button>
                  }
                  <button class="btn-s" style="padding:4px 8px; font-size:11px; border-color:#F59E0B; color:#D97706" (click)="addStickyNote()">
                    + Note Adhésive
                  </button>
                  <button class="btn-s" style="padding:4px 8px; font-size:11px; border-color:#EF4444; color:#EF4444" (click)="clearWhiteboard()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:3px"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                    Vider le tableau
                  </button>
                </div>
              </div>

              <!-- Whiteboard Canvas & Sticky Notes layer -->
              <div class="wb-canvas-wrapper">
                <canvas #whiteboardCanvas
                        [style.cursor]="whiteboardTool() === 'select' ? (isDraggingElement ? 'grabbing' : 'default') : (whiteboardTool() === 'eraser' ? 'cell' : 'crosshair')"
                        (mousedown)="startDrawing($event)"
                        (mousemove)="draw($event)"
                        (mouseup)="stopDrawing()"
                        (mouseleave)="stopDrawing()"
                        (touchstart)="startDrawingTouch($event)"
                        (touchmove)="drawTouch($event)"
                        (touchend)="stopDrawing()">
                </canvas>

                <!-- Interactive Sticky Notes Layer -->
                @for (el of whiteboardElements(); track el.id) {
                  @if (el.type === 'sticky') {
                    <div [style.left.px]="el.x"
                         [style.top.px]="el.y"
                         [style.background]="el.color === '#4F46E5' ? '#EEF2FF' : (el.color === '#10B981' ? '#ECFDF5' : (el.color === '#F59E0B' ? '#FFFBEB' : (el.color === '#F43F5E' ? '#FFF1F2' : '#F5F3FF')))"
                         [style.border-color]="el.color"
                         (mousedown)="startDragSticky($event, el)"
                         (touchstart)="startDragStickyTouch($event, el)"
                         style="position:absolute; width:140px; min-height:100px; padding:8px; border:2px solid; border-radius:8px; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); display:flex; flex-direction:column; justify-content:space-between; z-index:100; cursor:move">
                      
                      <textarea #stickyInput
                                [value]="activeEditingStickyId() === el.id ? stickyInput.value : el.text" 
                                (focus)="onStickyFocus(el.id)"
                                (blur)="onStickyBlur(el.id, stickyInput.value)"
                                (input)="onStickyInput(el.id, stickyInput.value)"
                                style="border:none; background:transparent; width:100%; height:60px; resize:none; font-size:11.5px; font-weight:600; color:#374151; outline:none; font-family:inherit; cursor:text"></textarea>
                      
                      <div style="display:flex; justify-content:space-between; align-items:center">
                        <span style="font-size: 8px; color: #94A3B8; font-weight: bold; pointer-events: none; text-transform: uppercase;">Note</span>
                        <button (click)="deleteWhiteboardElement(el.id)" style="background:none; border:none; color:#EF4444; font-size:10px; cursor:pointer; font-weight:700">Supprimer</button>
                      </div>
                    </div>
                  }
                }
              </div>
            </div>
          } @else if (screenShareParticipant(); as presenter) {
            <!-- Focused Screen Share Viewport -->
            <div class="screen-share-viewport">
              <div [id]="'screen_' + presenter.identity" class="screen-stream-container"></div>
              <div class="screen-share-label">
                🖥️ Partage d'écran de {{ presenter.name }}
              </div>
            </div>
          } @else {
            <!-- Standard Video Grid -->
            <div class="video-grid" [class.whiteboard-active]="showWhiteboard()">
              @for (p of participantsList(); track p.identity) {
                <div class="participant-card" 
                     [class.speaking]="p.isSpeaking" 
                     [class.bot]="p.isBot"
                     [class.local]="p.isLocal">
                  
                  <!-- Video stream container -->
                  <div [id]="'video_' + p.identity" class="video-stream-container" [style.display]="p.camEnabled ? 'block' : 'none'"></div>
                  
                  <!-- Avatar Placeholder when camera is disabled -->
                  @if (!p.camEnabled) {
                    <div class="avatar-placeholder-container">
                      <div class="avatar-placeholder" [class.bot]="p.isBot">
                        @if (p.isBot) {
                          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">
                            <path d="M12 8V4m0 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 8h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z"/>
                            <circle cx="8.5" cy="13" r="1.5" fill="currentColor"/>
                            <circle cx="15.5" cy="13" r="1.5" fill="currentColor"/>
                            <path d="M9 16h6"/>
                          </svg>
                        } @else {
                          {{ p.name.slice(0,2).toUpperCase() }}
                        }
                      </div>
                      
                      <!-- Robot speaking wave animation -->
                      @if (p.isBot && p.isSpeaking) {
                        <div class="sound-waves">
                          <div class="wave-bar"></div>
                          <div class="wave-bar"></div>
                          <div class="wave-bar"></div>
                          <div class="wave-bar"></div>
                          <div class="wave-bar"></div>
                        </div>
                      }
                    </div>
                  }

                  <!-- Overlay label -->
                  <div class="overlay-label">
                    <span class="name-text" style="display:inline-flex; align-items:center; gap:4px">
                      <span>{{ p.name }}</span>
                      @if (isHandRaised(p.identity)) {
                        <span class="hand-raise-indicator" 
                              [style.cursor]="isTeacher ? 'pointer' : 'default'" 
                              (click)="isTeacher && lowerStudentHand(p.identity); $event.stopPropagation()"
                              [title]="isTeacher ? t('Abaisser la main', 'Lower hand') : t('Main levée', 'Hand raised')"
                              style="animation: pulse-live 1.5s infinite; background: #FEF3C7; border: 1.5px solid #FCD34D; color: #D97706; border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.2)">
                          ✋
                        </span>
                      }
                    </span>
                    <span class="role-badge" [class.bot]="p.isBot" [class.teacher]="!p.isBot && !p.isLocal && isTeacherCard(p.identity)">
                      {{ getRoleLabel(p) }}
                    </span>
                  </div>

                  <!-- Mic status indicator -->
                  <div class="mic-status" [class.muted]="!p.micEnabled" [class.active]="p.micEnabled && p.isSpeaking">
                    @if (p.micEnabled) {
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" y2="22"/></svg>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <!-- Video Stripe (Visible at the bottom ONLY when Whiteboard or Screen Share is active) -->
          @if (showWhiteboard() || screenShareParticipant()) {
            <div class="video-stripe">
              @for (p of participantsList(); track p.identity) {
                <div class="stripe-participant-card" [class.speaking]="p.isSpeaking">
                  <div class="stripe-avatar">
                    {{ p.name.slice(0,2).toUpperCase() }}
                  </div>
                  <span class="stripe-name">{{ p.name.split(' ')[0] }}</span>
                  <span class="stripe-mic" [class.muted]="!p.micEnabled">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                  </span>
                </div>
              }
            </div>
          }
        </div>

        <!-- Right Side Panel (In-room Live Chat) -->
        @if (showChat()) {
          <div class="chat-sidebar">
            <div class="chat-sidebar-header" style="display:flex; justify-content:space-between; align-items:center; width:100%; padding: 12px 16px; box-sizing: border-box">
              <div style="display:flex; align-items:center; gap:6px">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span>Discussion en direct (Live Chat)</span>
              </div>
              <button (click)="openSpeechHelperModal()" 
                      style="background:none; border:none; color:#4F46E5; cursor:pointer; padding:4px; display:inline-flex; align-items:center; gap:4px; font-size:11.5px; font-weight:700" 
                      title="Aide Vocal & Téléprompteur">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                <span>Aide Vocal 🪄</span>
              </button>
            </div>
            
            <div class="chat-messages-container" #chatContainer>
              @for (msg of chatMessages(); track msg.id) {
                <div class="chat-msg" [class.outgoing]="msg.senderName === userName">
                  <div class="msg-sender">{{ msg.senderName }}</div>
                  
                  @if (msg.type === 'audio') {
                    <div class="voice-msg-bubble" style="display:flex; align-items:center; gap:6px; cursor:pointer" (click)="playLiveAudioMessage(msg)">
                      <button class="voice-play-btn" style="padding:0; display:flex; align-items:center; justify-content:center">
                        @if (playingMessageId() === msg.id) {
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="4" height="16"/><rect x="16" y="4" width="4" height="16"/></svg>
                        } @else {
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                        }
                      </button>
                      <span>{{ playingMessageId() === msg.id ? t('Lecture...', 'Playing...') : t('Message vocal', 'Voice message') }} ({{ msg.audioDuration || '0:04' }})</span>
                    </div>
                  } @else {
                    <div class="msg-bubble">{{ msg.content }}</div>
                  }
                  <div class="msg-time">{{ msg.createdAt | date:'shortTime' }}</div>
                </div>
              } @empty {
                <div style="padding:40px; text-align:center; color:#64748B; font-size:12px">
                  Pas de messages. Envoyez un message pour commencer !
                </div>
              }
            </div>

            <!-- Chat input area -->
            <div class="chat-input-area" style="position:relative">
              @if (chatRecordingState() === 'recording') {
                <div style="flex:1; display:flex; align-items:center; gap:8px; background:#FEE2E2; border:1px solid #FCA5A5; border-radius:6px; padding:6px 12px; color:#991B1B; font-size:12px; font-weight:700">
                  <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#EF4444; animation: pulse-live 1.2s infinite"></span>
                  <span>REC {{ formatDuration(chatRecordSeconds()) }}</span>
                  <button (click)="cancelChatVoiceRecording()" style="background:none; border:none; color:#DC2626; cursor:pointer; font-weight:bold; font-size:11px; margin-left:auto">
                    {{ t('Annuler', 'Cancel') }}
                  </button>
                </div>
                <button (click)="toggleVoiceMessageRecording()" class="voice-rec-btn active" title="Arrêter et envoyer" style="display:flex; align-items:center; justify-content:center; background:#EF4444; color:white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                </button>
              } @else {
                <input type="text" 
                       [(ngModel)]="newChatMessage" 
                       (keyup.enter)="sendTextMessage()"
                       [placeholder]="t('Écrire un message...', 'Type a message...')" />
                
                <button (click)="toggleVoiceMessageRecording()" class="voice-rec-btn" [title]="t('Envoyer un message vocal', 'Send voice message')" style="display:flex; align-items:center; justify-content:center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                </button>
                <button (click)="sendTextMessage()" class="send-msg-btn" style="display:flex; align-items:center; justify-content:center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              }
            </div>
          </div>
        }

        <!-- Right Side Panel (In-room Live Polls) -->
        @if (showPollsPanel()) {
          <div class="chat-sidebar" style="background:#FFF">
            <div class="chat-sidebar-header" style="display:flex; justify-content:space-between; align-items:center; width:100%; padding: 12px 16px; box-sizing: border-box; border-bottom:1px solid var(--border-weak)">
              <div style="display:flex; align-items:center; gap:6px">
                <span style="font-size:14px">📊</span>
                <span style="font-weight:700">{{ t('Sondages en Direct', 'Live Polls') }}</span>
              </div>
              @if (isTeacher) {
                <button (click)="showPollCreator.set(!showPollCreator())" 
                        style="background:#4F46E5; border:none; color:white; border-radius:6px; cursor:pointer; padding:4px 8px; font-size:10.5px; font-weight:700">
                  {{ showPollCreator() ? t('Fermer', 'Close') : t('+ Créer', '+ Create') }}
                </button>
              }
            </div>
            
            <div class="chat-messages-container" style="padding:16px; display:flex; flex-direction:column; gap:16px; height:calc(100% - 48px); overflow-y:auto; box-sizing:border-box">
              
              <!-- POLL CREATOR VIEW (Teacher Only) -->
              @if (isTeacher && showPollCreator()) {
                <div style="background:var(--surface-2); border:1.5px dashed #4F46E5; border-radius:8px; padding:14px; display:flex; flex-direction:column; gap:10px">
                  <h4 style="margin:0; font-size:12px; font-weight:700">{{ t('Nouveau Sondage', 'New Poll') }}</h4>
                  
                  <div class="input-row" style="margin:0">
                    <label style="font-size:10px; font-weight:600; color:var(--text-muted)">{{ t('Question', 'Question') }}</label>
                    <input type="text" [(ngModel)]="pollQuestion" [placeholder]="t('ex: Avez-vous compris ?', 'e.g. Do you understand?')" style="width:100%; padding:8px; border:1px solid var(--border); border-radius:4px; font-size:11.5px; background:#FFF" />
                  </div>
                  
                  <div style="display:flex; flex-direction:column; gap:6px">
                    <label style="font-size:10px; font-weight:600; color:var(--text-muted)">{{ t('Options de réponse', 'Answer Options') }}</label>
                    @for (opt of pollOptions; track $index) {
                      <div style="display:flex; gap:6px; align-items:center">
                        <input type="text" [(ngModel)]="pollOptions[$index]" [placeholder]="t('Option ' + ($index + 1), 'Option ' + ($index + 1))" style="flex:1; padding:6px; border:1px solid var(--border); border-radius:4px; font-size:11px; background:#FFF" />
                        @if (pollOptions.length > 2) {
                          <button (click)="removePollOption($index)" style="background:none; border:none; color:#EF4444; cursor:pointer; font-size:13.5px">×</button>
                        }
                      </div>
                    }
                    @if (pollOptions.length < 5) {
                      <button (click)="addPollOption()" style="background:none; border:none; color:#4F46E5; font-size:10.5px; font-weight:700; cursor:pointer; align-self:flex-start; padding:2px 0">+ {{ t('Ajouter option', 'Add Option') }}</button>
                    }
                  </div>
                  
                  <button (click)="submitNewPoll()" [disabled]="!pollQuestion.trim()" class="btn-p" style="font-size:11.5px; padding:6px 12px; height:32px; border-radius:6px; margin-top:4px">
                    🚀 {{ t('Lancer le sondage', 'Launch Poll') }}
                  </button>
                </div>
              }

              <!-- POLLS LIST VIEW -->
              @for (poll of polls(); track poll.id) {
                <div class="card" style="border:1px solid var(--border); padding:14px; border-radius:8px; display:flex; flex-direction:column; gap:10px; background:#FFF"
                     [style.border-left]="poll.active ? '4px solid #EF4444' : '4px solid var(--border-strong)'">
                  <div style="display:flex; justify-content:space-between; align-items:center">
                    <span class="badge" [style.background]="poll.active ? '#FEE2E2' : '#F3F4F6'" [style.color]="poll.active ? '#EF4444' : '#6B7280'" style="font-size:8px; font-weight:800; text-transform:uppercase">
                      {{ poll.active ? t('En cours', 'Live') : t('Terminé', 'Closed') }}
                    </span>
                    <span style="font-size:10px; color:var(--text-muted)">{{ getTotalVotesCount(poll) }} votes</span>
                  </div>
                  
                  <h4 style="margin:0; font-size:12.5px; font-weight:700; color:var(--text-primary)">{{ poll.question }}</h4>
                  
                  <!-- Options rendering -->
                  <div style="display:flex; flex-direction:column; gap:8px">
                    @for (opt of poll.options; track $index) {
                      <!-- Voter mode: Active Poll & Not voted yet -->
                      @if (poll.active && !hasVoted(poll) && !isTeacher) {
                        <button (click)="vote(poll.id, $index)" 
                                style="width:100%; text-align:left; background:#FFF; border:1px solid var(--border); padding:8px 12px; border-radius:6px; font-size:11.5px; font-weight:600; cursor:pointer; color:var(--text-secondary); transition:all 0.15s"
                                onmouseover="this.style.borderColor='#4F46E5'; this.style.color='#4F46E5'; this.style.background='#EEF2FF'"
                                onmouseout="this.style.borderColor='var(--border)'; this.style.color='var(--text-secondary)'; this.style.background='#FFF'">
                          {{ opt }}
                        </button>
                      } @else {
                        <!-- Results mode: Voted or Closed or Teacher view -->
                        <div style="position:relative; background:#F8FAFC; border:1px solid var(--border-weak); padding:8px 12px; border-radius:6px; overflow:hidden">
                          <!-- Background progress bar -->
                          <div [style.width.%]="getOptionPercentage(poll, $index)" style="position:absolute; top:0; left:0; height:100%; background:#EEF2FF; z-index:1; transition:width 0.5s ease-out"></div>
                          
                          <!-- Option label and percentages overlay -->
                          <div style="position:relative; z-index:2; display:flex; justify-content:space-between; align-items:center; font-size:11.5px">
                            <span style="font-weight:600" [style.color]="$index === getMyVote(poll) ? '#4F46E5' : 'var(--text-secondary)'">
                              {{ opt }}
                              @if ($index === getMyVote(poll)) {
                                <span style="font-size:10px; color:#4F46E5; margin-left:4px">✓ {{ t('Votre vote', 'Your vote') }}</span>
                              }
                            </span>
                            <span style="font-weight:700; color:var(--text-primary)">
                              {{ getOptionPercentage(poll, $index) }}% ({{ getOptionVotesCount(poll, $index) }})
                            </span>
                          </div>
                        </div>
                      }
                    }
                  </div>

                  <!-- Close button (Teacher Only) -->
                  @if (isTeacher && poll.active) {
                    <button (click)="closeActivePoll(poll.id)" class="btn-s" style="border-color:#EF4444; color:#EF4444; font-size:11px; padding:4px 8px; height:28px; width:100%; margin-top:4px">
                      🚫 {{ t('Terminer le sondage', 'Close Poll') }}
                    </button>
                  }
                </div>
              } @empty {
                <div style="padding:40px; text-align:center; color:var(--text-muted); font-size:12px">
                  📊 {{ t('Aucun sondage lancé pour le moment.', 'No polls launched yet.') }}
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Action Panel controls (Mic, Cam, Screen Share, Whiteboard, Chat, Recording, Exit) -->
      <div class="action-footer">
        <div class="footer-center-controls">
          <!-- Mic toggle -->
          <button (click)="toggleMic()" 
                  class="control-btn" 
                  [class.muted]="!localMicEnabled()"
                  [title]="localMicEnabled() ? 'Couper le micro' : 'Activer le micro'">
            @if (localMicEnabled()) {
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            }
          </button>

          <!-- Camera toggle -->
          <button (click)="toggleCam()" 
                  class="control-btn" 
                  [class.muted]="!localCamEnabled()"
                  [title]="localCamEnabled() ? 'Couper la caméra' : 'Activer la caméra'">
            @if (localCamEnabled()) {
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 7a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7Z"/><path d="m16 21-2-2 2-2"/></svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34"/><circle cx="12" cy="13" r="4"/></svg>
            }
          </button>

          <!-- Screen Share toggle -->
          <button (click)="toggleScreenShare()" 
                  class="control-btn" 
                  [class.active]="isScreenSharing"
                  [title]="isScreenSharing ? 'Arrêter la présentation' : 'Présenter l écran'">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </button>

          <!-- Divider -->
          <div style="width:1px; background:#374151; height:24px; margin:0 4px"></div>

          <!-- Whiteboard toggle -->
          <button (click)="toggleWhiteboard()" 
                  class="control-btn" 
                  [class.active]="showWhiteboard()"
                  title="Tableau Collaboratif"
                  style="display:inline-flex; align-items:center; justify-content:center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.01435 19.1558 5.09224 19.2337 5.1585 19.324C5.35824 19.596 5.46659 19.9238 5.46659 20.2609V20.8C5.46659 21.4627 6.00388 22 6.66659 22H12Z"/><circle cx="7.5" cy="10.5" r="1.5" fill="currentColor"/><circle cx="11.5" cy="7.5" r="1.5" fill="currentColor"/><circle cx="16.5" cy="9.5" r="1.5" fill="currentColor"/><circle cx="15.5" cy="14.5" r="1.5" fill="currentColor"/></svg>
          </button>

          <!-- Chat toggle -->
          <button (click)="toggleChat()" 
                  class="control-btn" 
                  [class.active]="showChat()"
                  title="Discussion en direct"
                  style="display:inline-flex; align-items:center; justify-content:center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </button>

          <!-- Raise Hand toggle -->
          <button (click)="toggleHandRaise()" 
                  class="control-btn" 
                  [class.active]="hasHandRaised()"
                  [title]="hasHandRaised() ? t('Baisser la main', 'Lower hand') : t('Lever la main', 'Raise hand')"
                  style="display:inline-flex; align-items:center; justify-content:center">
            <span style="font-size:16px">✋</span>
          </button>

          <!-- Polls toggle -->
          <button (click)="togglePollsPanel()" 
                  class="control-btn" 
                  [class.active]="showPollsPanel()"
                  [title]="t('Sondages en direct', 'Live Polls')"
                  style="display:inline-flex; align-items:center; justify-content:center">
            <span style="font-size:16px">📊</span>
          </button>

          <!-- Record toggle (Only host/teacher can record call) -->
          @if (isTeacher) {
            <button (click)="toggleRecording()" 
                    class="control-btn" 
                    [class.active]="isRecording()"
                    title="Enregistrer le cours"
                    style="display:inline-flex; align-items:center; justify-content:center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            </button>
          }
        </div>

        <div class="footer-right-actions">
          @if (isTeacher || expectsBot() || roomName.toLowerCase().includes('live') || roomName.toLowerCase().includes('practice')) {
            <button class="btn-end" (click)="endMeeting()">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .62 2.81 2 2 0 0 1-.45 2.11L8.9 9.9a16 16 0 0 0 1.78 3.41Z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
              <span>Terminer l'appel</span>
            </button>
          } @else {
            <button class="btn-leave" (click)="leaveMeeting()">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span>Quitter l'appel</span>
            </button>
          }
        </div>
      </div>

      <!-- SPEECH HELPER & SCRIPT PROMPTER MODAL -->
      @if (showSpeechHelper()) {
        <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.65); backdrop-filter:blur(8px); display:flex; justify-content:center; align-items:center; z-index:999999; padding:16px">
          <div style="background:white; width:100%; max-width:540px; border-radius:16px; padding:24px; display:flex; flex-direction:column; gap:16px; box-shadow:0 25px 50px -12px rgba(0, 0, 0, 0.25); border:1px solid #E2E8F0; color:#1E293B">
            <!-- Modal Header -->
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #E2E8F0; padding-bottom:12px">
              <h3 style="font-size:16px; font-weight:800; color:#4F46E5; margin:0; display:flex; align-items:center; gap:8px">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                <span>Téléprompteur & Aide Vocal 🎙️</span>
              </h3>
              <button (click)="showSpeechHelper.set(false)" style="background:none; border:none; color:#64748B; cursor:pointer; padding:4px; display:flex; align-items:center; justify-content:center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <!-- Modal Content -->
            <div style="display:flex; flex-direction:column; gap:14px; max-height:65vh; overflow-y:auto; padding-right:4px">
              
              <!-- 1. TEACHER CONTROLS -->
              @if (isTeacher) {
                <div style="background:#F5F3FF; border:1px solid #DDD6FE; border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:10px">
                  <div style="font-size:12px; font-weight:800; color:#6D28D9; display:flex; align-items:center; gap:4px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    <span>Assigner un exercice de lecture (Enseignant)</span>
                  </div>
                  
                  <div class="input-row" style="margin:0">
                    <label style="font-size:11px; font-weight:700; color:#4F46E5; display:block; margin-bottom:4px">Cibler un étudiant</label>
                    <select [(ngModel)]="speechTargetStudent" style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:8px; background:white; font-size:12px">
                      <option value="all">Tous les étudiants</option>
                      @for (p of participantsList(); track p.identity) {
                        @if (!p.isLocal && !p.isBot) {
                          <option [value]="p.name">{{ p.name }}</option>
                        }
                      }
                    </select>
                  </div>

                  <div class="input-row" style="margin:0">
                    <label style="font-size:11px; font-weight:700; color:#4F46E5; display:block; margin-bottom:4px">Texte à lire à haute voix</label>
                    <textarea [(ngModel)]="speechTeacherText" rows="3" placeholder="Saisissez le script que l'étudiant doit lire..." style="width:100%; padding:8px; border:1px solid #CBD5E1; border-radius:8px; font-size:12.5px; resize:vertical; background:white"></textarea>
                  </div>

                  <button (click)="assignSpeechScript()" style="background:#6D28D9; color:white; border:none; padding:8px 16px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; align-self:flex-end">
                    Assigner le script 🪄
                  </button>
                </div>
              }

              <!-- 2. STUDENT / READING WORKSPACE -->
              <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:16px; display:flex; flex-direction:column; gap:12px">
                
                <!-- Display assigned script from teacher if any -->
                @if (speechAssignedText()) {
                  <div style="background:#FFFDF5; border:1px solid #FDE68A; border-radius:8px; padding:12px; border-left:4px solid #D97706">
                    <div style="font-size:11.5px; font-weight:800; color:#B45309; margin-bottom:4px; display:flex; align-items:center; gap:4px">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                      <span>Script assigné par le professeur :</span>
                    </div>
                    <p style="font-size:12.5px; color:#451A03; margin:0; line-height:1.5">{{ speechAssignedText() }}</p>
                    <div style="display:flex; justify-content:flex-end; gap:6px; margin-top:8px">
                      <button (click)="useAssignedScript()" style="background:#D97706; color:white; border:none; padding:4px 10px; border-radius:6px; font-size:10px; font-weight:700; cursor:pointer">
                        Utiliser ce script
                      </button>
                    </div>
                  </div>
                }

                <div style="font-size:12px; font-weight:800; color:#475569; display:flex; align-items:center; gap:4px">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                  <span>Mon script de lecture (Téléprompteur)</span>
                </div>

                <textarea [(ngModel)]="speechStudentText" rows="4" placeholder="Copiez/collez ou saisissez votre texte ici pour le lire en enregistrant..." style="width:100%; padding:10px; border:1px solid #CBD5E1; border-radius:8px; font-size:12.5px; resize:vertical; background:white"></textarea>
                
                <!-- Teleprompter Big Screen Mode -->
                @if (speechStudentText().trim()) {
                  <div style="background:#0F172A; border-radius:10px; padding:20px; text-align:center; min-height:100px; display:flex; align-items:center; justify-content:center; box-shadow:inset 0 2px 8px rgba(0,0,0,0.5)">
                    <p style="font-size:18px; font-weight:700; color:#38BDF8; line-height:1.6; margin:0; word-break:break-word; font-family:var(--font-mono, monospace)">
                      {{ speechStudentText() }}
                    </p>
                  </div>
                }
                
                <!-- Recording status within helper -->
                <div style="display:flex; flex-direction:column; align-items:center; gap:10px; padding:12px; border-radius:10px; background:white; border:1px dashed #CBD5E1; margin-top:6px">
                  @if (speechRecordingState() === 'idle') {
                    <button (click)="startSpeechRecording()" style="width:48px; height:48px; border-radius:50%; background:#EF4444; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; color:white; box-shadow:0 4px 12px rgba(239, 68, 68, 0.25)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                    </button>
                    <span style="font-size:11px; font-weight:700; color:#64748B">Cliquez sur le micro pour lancer l'enregistrement</span>
                  } @else if (speechRecordingState() === 'recording') {
                    <div style="display:flex; align-items:center; gap:8px">
                      <span class="recording-pulse"></span>
                      <span style="font-size:14px; font-weight:800; color:#EF4444">{{ formatDuration(speechRecordSeconds()) }}</span>
                    </div>
                    <button (click)="stopSpeechRecording()" style="width:44px; height:44px; border-radius:50%; background:#EF4444; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; color:white; box-shadow:0 4px 12px rgba(239, 68, 68, 0.25)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                    </button>
                    <span style="font-size:11px; font-weight:700; color:#EF4444">Enregistrement audio en cours...</span>
                  } @else if (speechRecordingState() === 'finished') {
                    <div style="display:flex; align-items:center; gap:12px; width:100%; max-width:320px; background:#F8FAFC; padding:10px; border-radius:8px; border:1px solid #2DD4BF">
                      <button style="width:30px; height:30px; border-radius:50%; border:none; background:#0D9488; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer" (click)="playSpeechAudioPlayback()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </button>
                      <div style="flex:1; text-align:left">
                        <div style="font-size:11.5px; font-weight:700; color:#0F766E">voice_note.wav</div>
                        <div style="font-size:9.5px; color:#64748B">Durée : {{ formatDuration(speechRecordSeconds()) }}</div>
                      </div>
                      <button (click)="resetSpeechRecording()" style="background:none; border:none; color:#EF4444; cursor:pointer" title="Recommencer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>

                    <div style="display:flex; gap:8px; width:100%; margin-top:4px">
                      <button (click)="sendSpeechVoiceMessage()" style="flex:1; background:#10B981; color:white; border:none; padding:8px 16px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer">
                        Envoyer dans le Chat 🚀
                      </button>
                    </div>
                  }
                </div>

              </div>

            </div>

            <!-- Modal Footer -->
            <div style="display:flex; justify-content:flex-end; border-top:1px solid #E2E8F0; padding-top:12px">
              <button class="btn-s" (click)="showSpeechHelper.set(false)" style="padding:8px 16px; font-size:12px">Fermer</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 0;
      overflow: hidden;
      position: relative;
    }

    .livekit-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
      background: #0B0F19;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #1E293B;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }

    .livekit-control-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 20px;
      background: #111827;
      border-bottom: 1px solid #1E293B;
      color: #fff;
    }

    .room-title {
      font-weight: 700;
      font-size: 13.5px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #E2E8F0;
    }

    .room-title i {
      font-size: 18px;
      color: #EF4444;
    }

    .recording-blink {
      animation: pulse-recording 1s infinite alternate;
    }

    .rec-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(239, 68, 68, 0.15);
      color: #EF4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 8px;
    }

    .rec-dot {
      width: 6px;
      height: 6px;
      background: #EF4444;
      border-radius: 50%;
      display: inline-block;
      animation: pulse-recording 0.8s infinite alternate;
    }

    .room-highlight {
      color: #38BDF8;
      font-weight: 800;
    }

    .center-status-badge {
      display: flex;
      align-items: center;
    }

    .status-indicator {
      font-size: 11px;
      padding: 4px 12px;
      border-radius: 99px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .status-indicator.bot-online {
      background: rgba(139, 92, 246, 0.15);
      color: #A78BFA;
      border: 1px solid rgba(139, 92, 246, 0.3);
    }

    .status-indicator.bot-connecting {
      background: rgba(245, 158, 11, 0.1);
      color: #FBBF24;
      border: 1px solid rgba(245, 158, 11, 0.2);
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #8B5CF6;
      box-shadow: 0 0 8px #8B5CF6;
      animation: dot-pulse 1.2s infinite alternate;
    }

    @keyframes dot-pulse {
      from { transform: scale(0.8); opacity: 0.5; }
      to { transform: scale(1.2); opacity: 1; }
    }

    .loading-spin {
      width: 8px;
      height: 8px;
      border: 2px solid transparent;
      border-top-color: #FBBF24;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .status-indicator.active {
      background: rgba(16, 185, 129, 0.15);
      color: #34D399;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }

    .main-classroom-area {
      display: flex;
      flex: 1;
      min-height: 0;
      position: relative;
    }

    .left-workspace-pane {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-width: 0;
      background: #0B0F19;
      position: relative;
    }

    .video-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
      padding: 20px;
      background: #0B0F19;
      flex: 1;
      overflow-y: auto;
      align-content: center;
    }

    .video-grid.whiteboard-active {
      display: none;
    }

    .participant-card {
      position: relative;
      border-radius: 14px;
      overflow: hidden;
      background: #111827;
      border: 2px solid #1E293B;
      aspect-ratio: 16/10;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .participant-card.speaking {
      border-color: #10B981;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.2);
    }

    .participant-card.bot.speaking {
      border-color: #7C3AED;
      box-shadow: 0 0 18px rgba(124, 58, 237, 0.3);
    }

    .video-stream-container {
      width: 100%;
      height: 100%;
      background: #000;
    }

    .avatar-placeholder-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .avatar-placeholder {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
      color: white;
      font-size: 22px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
    }

    .avatar-placeholder.bot {
      background: linear-gradient(135deg, #7C3AED 0%, #DB2777 100%);
      animation: float-bot 3s ease-in-out infinite alternate;
      font-size: 28px;
    }

    @keyframes float-bot {
      0% { transform: translateY(0); }
      100% { transform: translateY(-6px); }
    }

    .sound-waves {
      display: flex;
      align-items: flex-end;
      gap: 3px;
      height: 16px;
      margin-top: 12px;
    }

    .wave-bar {
      width: 3px;
      height: 4px;
      background: #A78BFA;
      border-radius: 3px;
      animation: bounce-wave 0.6s ease-in-out infinite alternate;
    }
    .wave-bar:nth-child(2) { animation-delay: 0.12s; }
    .wave-bar:nth-child(3) { animation-delay: 0.24s; }
    .wave-bar:nth-child(4) { animation-delay: 0.36s; }
    .wave-bar:nth-child(5) { animation-delay: 0.48s; }

    @keyframes bounce-wave {
      from { height: 4px; }
      to { height: 16px; }
    }

    .overlay-label {
      position: absolute;
      bottom: 12px;
      left: 12px;
      background: rgba(17, 24, 39, 0.75);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 4px 10px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      z-index: 10;
    }

    .name-text {
      color: #F3F4F6;
      font-size: 11px;
      font-weight: 700;
    }

    .role-badge {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 1px 5px;
      border-radius: 4px;
      background: rgba(156, 163, 175, 0.2);
      color: #D1D5DB;
    }

    .role-badge.bot {
      background: #7C3AED;
      color: white;
    }

    .role-badge.teacher {
      background: #0284C7;
      color: white;
    }

    .mic-status {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(17, 24, 39, 0.75);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #9CA3AF;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      transition: all 0.2s;
    }

    .mic-status.muted {
      background: rgba(239, 68, 68, 0.85);
      color: white;
      border-color: #EF4444;
    }

    .mic-status.active {
      background: rgba(16, 185, 129, 0.85);
      color: white;
      border-color: #10B981;
    }

    /* Screen share layout */
    .screen-share-viewport {
      flex: 1;
      background: #000;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      overflow: hidden;
    }

    .screen-stream-container {
      width: 100%;
      height: 100%;
    }

    .screen-share-label {
      position: absolute;
      top: 14px;
      left: 14px;
      background: rgba(17, 24, 39, 0.85);
      backdrop-filter: blur(8px);
      border: 1.5px solid #38BDF8;
      color: #38BDF8;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 20px;
      z-index: 10;
    }

    /* Video Stripe style when whiteboard or screen share is open */
    .video-stripe {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      padding: 10px 16px;
      background: #111827;
      height: 70px;
      align-items: center;
      border-top: 1px solid #1E293B;
      flex-shrink: 0;
    }

    .stripe-participant-card {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #1F2937;
      padding: 6px 12px;
      border-radius: 20px;
      border: 1.5px solid #374151;
      flex-shrink: 0;
      color: white;
      transition: all 0.2s;
    }

    .stripe-participant-card.speaking {
      border-color: #10B981;
      background: rgba(16, 185, 129, 0.1);
    }

    .stripe-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #3B82F6;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9.5px;
      font-weight: 800;
    }

    .stripe-name {
      font-size: 11px;
      font-weight: 700;
    }

    .stripe-mic {
      font-size: 10px;
    }

    .stripe-mic.muted {
      opacity: 0.35;
    }

    /* Whiteboard Container */
    .whiteboard-container {
      display: flex;
      flex-direction: column;
      flex: 1;
      background: #FFF;
      position: relative;
    }

    .wb-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      background: #F1F5F9;
      border-bottom: 1.5px solid #E2E8F0;
      z-index: 50;
    }

    .wb-tool-btn {
      background: #FFF;
      border: 1.5px solid #CBD5E1;
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .wb-tool-btn:hover {
      background: #E2E8F0;
    }

    .wb-tool-btn.active {
      background: #4F46E5;
      border-color: #4F46E5;
      transform: translateY(-1px);
    }

    .wb-canvas-wrapper {
      flex: 1;
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #FFF;
    }

    .wb-canvas-wrapper canvas {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      cursor: crosshair;
    }

    /* Live Chat Sidebar */
    .chat-sidebar {
      width: 320px;
      background: #111827;
      border-left: 1px solid #1E293B;
      display: flex;
      flex-direction: column;
      min-height: 0;
      flex-shrink: 0;
    }

    .chat-sidebar-header {
      padding: 14px 16px;
      font-size: 12px;
      font-weight: 800;
      color: #E2E8F0;
      background: #1F2937;
      border-bottom: 1px solid #2D3748;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .chat-messages-container {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .chat-msg {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      max-width: 85%;
    }

    .chat-msg.outgoing {
      align-self: flex-end;
      align-items: flex-end;
    }

    .msg-sender {
      font-size: 10px;
      color: #94A3B8;
      font-weight: 700;
      margin-bottom: 2px;
    }

    .msg-bubble {
      background: #1F2937;
      border: 1px solid #374151;
      color: #F1F5F9;
      padding: 8px 12px;
      border-radius: 12px 12px 12px 2px;
      font-size: 12.5px;
      line-height: 1.4;
      word-break: break-word;
    }

    .chat-msg.outgoing .msg-bubble {
      background: #4F46E5;
      border-color: #4F46E5;
      color: white;
      border-radius: 12px 12px 2px 12px;
    }

    .voice-msg-bubble {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #1F2937;
      border: 1px solid #374151;
      padding: 6px 12px;
      border-radius: 12px 12px 12px 2px;
      font-size: 12px;
      color: #E2E8F0;
    }

    .chat-msg.outgoing .voice-msg-bubble {
      background: #4F46E5;
      border-color: #4F46E5;
      color: white;
      border-radius: 12px 12px 2px 12px;
    }

    .voice-play-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 13px;
      padding: 0;
    }

    .msg-time {
      font-size: 9px;
      color: #64748B;
      margin-top: 2px;
    }

    .chat-input-area {
      display: flex;
      gap: 8px;
      padding: 12px;
      background: #1F2937;
      border-top: 1px solid #2D3748;
      align-items: center;
    }

    .chat-input-area input {
      flex: 1;
      background: #111827;
      border: 1.5px solid #374151;
      border-radius: 20px;
      padding: 8px 14px;
      color: white;
      font-size: 12.5px;
      outline: none;
      transition: all 0.2s;
    }

    .chat-input-area input:focus {
      border-color: #4F46E5;
    }

    .voice-rec-btn, .send-msg-btn {
      background: none;
      border: none;
      font-size: 16px;
      cursor: pointer;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.1s;
    }

    .voice-rec-btn:hover, .send-msg-btn:hover {
      transform: scale(1.1);
    }

    .action-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: #111827;
      border-top: 1px solid #1E293B;
      flex-shrink: 0;
    }

    .footer-center-controls {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .control-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid #374151;
      background: #1F2937;
      color: #D1D5DB;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    }

    .control-btn:hover {
      background: #374151;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }

    .control-btn:active {
      transform: translateY(0);
    }

    .control-btn.active {
      background: #4F46E5;
      border-color: #4F46E5;
      color: white;
    }

    .control-btn.muted {
      background: #EF4444;
      border-color: #EF4444;
      color: white;
    }

    .footer-right-actions {
      display: flex;
      align-items: center;
    }

    .btn-end {
      background: #EF4444;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: inherit;
      transition: all 0.2s;
      box-shadow: 0 4px 6px rgba(239, 68, 68, 0.2);
    }

    .btn-end:hover {
      background: #DC2626;
      transform: translateY(-1px);
    }

    .btn-leave {
      background: #4B5563;
      color: white;
      border: none;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: inherit;
      transition: all 0.2s;
      box-shadow: 0 4px 6px rgba(75, 85, 99, 0.2);
    }

    .btn-leave:hover {
      background: #374151;
      transform: translateY(-1px);
    }

    @keyframes pulse-recording {
      0% { opacity: 1; transform: scale(1); }
      100% { opacity: 0.4; transform: scale(1.1); }
    }
  `]
})
export class JitsiMeet implements AfterViewInit, OnDestroy {
  @Input() classId = '';
  @Input() roomName = 'SpeakUp_Meeting_Room';
  @Input() isTeacher = false;
  @Input() userName = 'English Learner';
  @Input() userEmail = '';

  @Output() onMeetingLeave = new EventEmitter<void>();
  @Output() onMeetingEnd = new EventEmitter<void>();

  @ViewChild('whiteboardCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private room: Room | null = null;
  statusText = 'Connecting';
  
  participantsList = signal<ParticipantModel[]>([]);
  localMicEnabled = signal<boolean>(true);
  localCamEnabled = signal<boolean>(true);
  isScreenSharing = false;

  // Live Chat and Whiteboard States
  showChat = signal<boolean>(false);
  showWhiteboard = signal<boolean>(false);
  showPollsPanel = signal<boolean>(false);
  chatMessages = signal<any[]>([]);
  whiteboardElements = signal<any[]>([]);
  newChatMessage = '';
  activeEditingStickyId = signal<string | null>(null);

  // Hand Raise State
  raisedHandUserIds = signal<string[]>([]);

  // Live Polls State
  polls = signal<LivePoll[]>([]);
  activePoll = computed(() => this.polls().find(p => p.active) || null);
  showPollCreator = signal<boolean>(false);
  pollQuestion = '';
  pollOptions = ['', ''];
  
  // Whiteboard drawing tools
  whiteboardTool = signal<'pen' | 'rect' | 'circle' | 'line' | 'arrow' | 'sticky' | 'eraser' | 'select'>('pen');
  whiteboardColor = signal<string>('#4F46E5');
  private isDrawingLocal = false;
  private currentPathPoints: { x: number; y: number }[] = [];
  private lastX = 0;
  private lastY = 0;
  private currentEndX = 0;
  private currentEndY = 0;

  // Drag-to-move state for canvas elements (select tool)
  private draggingElement: any = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  isDraggingElement = false;
  selectedElementId = signal<string | null>(null);

  // Recording states
  isRecording = signal<boolean>(false);
  recordingDuration = signal<string>('00:00');
  private recordingStartTime: number | null = null;
  private recordingInterval: any = null;

  // DOM Subscriptions
  private chatSub: any = null;
  private wbSub: any = null;
  private prompterSub: any = null;

  // Speech Helper States
  showSpeechHelper = signal<boolean>(false);
  speechTargetStudent = 'all';
  speechTeacherText = '';
  speechStudentText = signal<string>('');
  speechAssignedText = signal<string>('');
  speechRecordingState = signal<'idle' | 'recording' | 'finished'>('idle');
  speechRecordSeconds = signal<number>(0);
  private speechMediaRecorder: any = null;
  private speechAudioChunks: any[] = [];
  private speechRecordInterval: any = null;
  private speechAudioBlob: Blob | null = null;
  private speechAudioUrl = '';

  private dialogService = inject(DialogService);
  private db = inject(DatabaseService);

  t(fr: string, en: string): string {
    return this.db.activeLang() === 'fr' ? fr : en;
  }

  async ngAfterViewInit() {
    await this.connectToLiveKit();
    this.setupWhiteboardAndChat();
  }

  setupWhiteboardAndChat() {
    if (!this.classId) return;

    // 1. Subscribe to Live Chat message feed
    this.chatSub = this.db.observeLiveChat(this.classId).subscribe(msgs => {
      this.chatMessages.set(msgs || []);
      this.scrollToBottom();
    });

    // 2. Subscribe to Whiteboard elements feed
    this.wbSub = this.db.observeWhiteboard(this.classId).subscribe(elems => {
      this.whiteboardElements.set(elems || []);
      this.redrawCanvas();
    });

    // 3. Subscribe to Hand Raises feed
    this.db.observeHandRaises(this.classId).subscribe(ids => {
      const current = this.raisedHandUserIds();
      const added = ids.filter(id => !current.includes(id));
      if (added.length > 0) {
        const myId = this.db.getCurrentUser()?.id;
        if (added.some(id => id !== myId)) {
          this.playHandRaiseChime();
        }
      }
      this.raisedHandUserIds.set(ids || []);
    });

    // 4. Subscribe to Live Polls feed
    this.db.observePolls(this.classId).subscribe(list => {
      this.polls.set(list || []);
    });

    // 5. Subscribe to Speech Prompter active script
    this.prompterSub = this.db.observeSpeechPrompter(this.classId).subscribe((data: any) => {
      if (data) {
        if (data.targetStudent === 'all' || data.targetStudent === this.userName) {
          this.speechAssignedText.set(data.text);
        } else {
          this.speechAssignedText.set('');
        }
      } else {
        this.speechAssignedText.set('');
      }
    });
  }

  async connectToLiveKit() {
    this.statusText = 'Connecting';
    
    try {
      // 1. Generate local access token client-side using API credentials
      const user = this.db.getCurrentUser();
      const userId = user ? user.id : `guest_${Date.now()}`;
      const identity = `${this.isTeacher ? 'teacher' : 'student'}_${userId}`;
      const token = await this.generateToken(this.roomName, identity, this.userName);

      // 2. Instantiate LiveKit room
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true
      });

      // 3. Set up listeners
      this.setupRoomListeners();

      // 4. Connect to LiveKit server URL
      await this.room.connect(environment.livekit.url, token);
      this.statusText = 'Connected';
      console.log('Connected to LiveKit room successfully:', this.roomName);

      // Log entry check-in action
      this.db.logAction('live_joined', `A rejoint le cours en direct: "${this.roomName}"`, this.classId);

      // 5. Publish microphone and camera tracks
      try {
        await this.room.localParticipant.setCameraEnabled(true);
        await this.room.localParticipant.setMicrophoneEnabled(true);
        this.localMicEnabled.set(true);
        this.localCamEnabled.set(true);
      } catch (trackError) {
        console.warn('Unable to enable camera/mic tracks on join:', trackError);
        this.localMicEnabled.set(this.room.localParticipant.isMicrophoneEnabled);
        this.localCamEnabled.set(this.room.localParticipant.isCameraEnabled);
      }

      this.updateParticipants();

    } catch (e) {
      console.error('Failed to connect to LiveKit server:', e);
      this.statusText = 'Error Connecting';
      this.dialogService.alert('LiveKit Connection Error', 'Could not establish connection to the LiveKit server.', 'info');
    }
  }

  setupRoomListeners() {
    if (!this.room) return;

    this.room
      .on(RoomEvent.ParticipantConnected, () => this.updateParticipants())
      .on(RoomEvent.ParticipantDisconnected, () => this.updateParticipants())
      .on(RoomEvent.TrackPublished, () => this.updateParticipants())
      .on(RoomEvent.TrackUnpublished, () => this.updateParticipants())
      .on(RoomEvent.TrackSubscribed, (track: RemoteTrack, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          const el = track.attach();
          el.id = 'audio_' + track.sid;
          document.body.appendChild(el);
        }
        this.updateParticipants();
      })
      .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        track.detach();
        const el = document.getElementById('audio_' + track.sid);
        if (el) el.remove();
        this.updateParticipants();
      })
      .on(RoomEvent.ActiveSpeakersChanged, () => {
        this.updateSpeakersState();
      })
      .on(RoomEvent.LocalTrackPublished, () => this.updateParticipants())
      .on(RoomEvent.LocalTrackUnpublished, () => this.updateParticipants());
  }

  updateParticipants() {
    if (!this.room) return;
    
    const list: ParticipantModel[] = [];

    // Local participant
    const lp = this.room.localParticipant;
    if (lp) {
      const videoPub = Array.from(lp.videoTrackPublications.values()).find(pub => pub.source === Track.Source.Camera);
      const audioPub = Array.from(lp.audioTrackPublications.values()).find(pub => pub.source === Track.Source.Microphone);
      const screenPub = Array.from(lp.videoTrackPublications.values()).find(pub => pub.source === Track.Source.ScreenShare);

      list.push({
        identity: lp.identity,
        name: this.userName + ' (Moi)',
        isLocal: true,
        isBot: false,
        isSpeaking: lp.isSpeaking,
        videoTrack: videoPub?.videoTrack || null,
        audioTrack: audioPub?.audioTrack || null,
        screenShareTrack: screenPub?.videoTrack || null,
        micEnabled: lp.isMicrophoneEnabled,
        camEnabled: lp.isCameraEnabled
      });
    }

    // Remote participants
    this.room.remoteParticipants.forEach(rp => {
      const videoPub = Array.from(rp.videoTrackPublications.values()).find(pub => pub.source === Track.Source.Camera);
      const audioPub = Array.from(rp.audioTrackPublications.values()).find(pub => pub.source === Track.Source.Microphone);
      const screenPub = Array.from(rp.videoTrackPublications.values()).find(pub => pub.source === Track.Source.ScreenShare);
      const isBot = rp.identity.includes('bot') || rp.name?.toLowerCase().includes('bot') || false;

      list.push({
        identity: rp.identity,
        name: isBot ? 'AI Assistant' : rp.name || rp.identity,
        isLocal: false,
        isBot,
        isSpeaking: rp.isSpeaking,
        videoTrack: videoPub?.videoTrack || null,
        audioTrack: audioPub?.audioTrack || null,
        screenShareTrack: screenPub?.videoTrack || null,
        micEnabled: rp.isMicrophoneEnabled,
        camEnabled: rp.isCameraEnabled
      });
    });

    this.participantsList.set(list);

    // Attach regular camera video feeds
    list.forEach(p => {
      if (p.videoTrack && p.camEnabled) {
        this.attachTrack(p.identity, p.videoTrack, 'video_');
      }
    });

    // Attach screen share video feeds if screen is shared
    const presenter = this.screenShareParticipant();
    if (presenter && presenter.screenShareTrack) {
      this.attachTrack(presenter.identity, presenter.screenShareTrack, 'screen_');
    }
  }

  // Detect who is sharing their screen
  screenShareParticipant(): ParticipantModel | null {
    return this.participantsList().find(p => p.screenShareTrack !== null && p.screenShareTrack !== undefined) || null;
  }

  updateSpeakersState() {
    const list = [...this.participantsList()];
    let updated = false;

    list.forEach(p => {
      const oldSpeaking = p.isSpeaking;
      if (p.isLocal) {
        p.isSpeaking = this.room?.localParticipant.isSpeaking || false;
      } else {
        const rp = this.room?.remoteParticipants.get(p.identity);
        p.isSpeaking = rp?.isSpeaking || false;
      }
      if (oldSpeaking !== p.isSpeaking) {
        updated = true;
      }
    });

    if (updated) {
      this.participantsList.set(list);
    }
  }

  attachTrack(identity: string, track: VideoTrack, prefix: string) {
    setTimeout(() => {
      const container = document.getElementById(prefix + identity);
      if (container) {
        container.innerHTML = '';
        const el = track.attach();
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.objectFit = (prefix === 'screen_') ? 'contain' : 'cover';
        container.appendChild(el);
      }
    }, 120);
  }

  expectsBot(): boolean {
    return this.roomName.toLowerCase().includes('practice') || 
           this.roomName.toLowerCase().includes('bot');
  }

  isBotOnline(): boolean {
    return this.participantsList().some(p => p.isBot);
  }

  isTeacherCard(identity: string): boolean {
    return identity.startsWith('teacher_');
  }

  getRoleLabel(p: ParticipantModel): string {
    if (p.isBot) return 'AI Tutor 🤖';
    if (p.isLocal) return this.isTeacher ? 'Host 👑' : 'Student 🎓';
    return this.isTeacherCard(p.identity) ? 'Teacher 📚' : 'Student 🎓';
  }

  async toggleMic() {
    if (!this.room) return;
    const lp = this.room.localParticipant;
    const enabled = !lp.isMicrophoneEnabled;
    await lp.setMicrophoneEnabled(enabled);
    this.localMicEnabled.set(enabled);
    this.updateParticipants();
  }

  async toggleCam() {
    if (!this.room) return;
    const lp = this.room.localParticipant;
    const enabled = !lp.isCameraEnabled;
    await lp.setCameraEnabled(enabled);
    this.localCamEnabled.set(enabled);
    this.updateParticipants();
  }

  async toggleScreenShare() {
    if (!this.room) return;
    const lp = this.room.localParticipant;
    try {
      this.isScreenSharing = !this.isScreenSharing;
      await lp.setScreenShareEnabled(this.isScreenSharing);
      this.updateParticipants();
    } catch (e) {
      console.warn('Screen share toggle failed:', e);
      this.isScreenSharing = false;
    }
  }

  // --- WHITEBOARD WORKSPACE LOGIC ---
  toggleWhiteboard() {
    this.showWhiteboard.set(!this.showWhiteboard());
    if (this.showWhiteboard()) {
      this.showChat.set(false);
      this.showPollsPanel.set(false);
      setTimeout(() => {
        this.initCanvasSize();
        this.redrawCanvas();
      }, 200);
    }
  }

  initCanvasSize() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    }
  }

  getMouseCoords(event: MouseEvent): { x: number; y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  getTouchCoords(event: TouchEvent): { x: number; y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  startDrawing(event: MouseEvent) {
    const coords = this.getMouseCoords(event);
    this.beginDrawingAt(coords.x, coords.y);
  }

  startDrawingTouch(event: TouchEvent) {
    event.preventDefault();
    const coords = this.getTouchCoords(event);
    this.beginDrawingAt(coords.x, coords.y);
  }

  beginDrawingAt(x: number, y: number) {
    if (!this.classId) return;

    this.lastX = x;
    this.lastY = y;

    const tool = this.whiteboardTool();

    if (tool === 'select') {
      // Hit-test: find the topmost element that contains (x, y)
      const hit = this.hitTestElement(x, y);
      if (hit) {
        this.selectedElementId.set(hit.id);
        this.startDragElement(hit, x, y);
      } else {
        // Click on empty area deselects
        this.selectedElementId.set(null);
      }
      return;
    }

    if (tool === 'pen' || tool === 'eraser') {
      this.isDrawingLocal = true;
      this.currentPathPoints = [{ x, y }];
    } else if (tool === 'sticky') {
      // Place sticky note immediately
      const newEl = {
        id: 'wb-' + Date.now(),
        type: 'sticky',
        color: this.whiteboardColor(),
        x,
        y,
        text: this.t('Nouvelle note...', 'New note...')
      };
      this.db.addWhiteboardElement(this.classId, newEl);
    } else {
      // For shapes (rect, circle, line, arrow), register starting coords
      this.isDrawingLocal = true;
      this.currentEndX = x;
      this.currentEndY = y;
    }
  }

  /** Returns the topmost whiteboard element hit at (x,y), or null. */
  hitTestElement(x: number, y: number): any {
    const elements = this.whiteboardElements();
    const HIT_TOLERANCE = 10; // px

    // Iterate in reverse (top-most painted last)
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (el.type === 'sticky') continue; // sticky notes have their own drag

      if (el.type === 'rect') {
        const minX = Math.min(el.startX, el.endX) - HIT_TOLERANCE;
        const maxX = Math.max(el.startX, el.endX) + HIT_TOLERANCE;
        const minY = Math.min(el.startY, el.endY) - HIT_TOLERANCE;
        const maxY = Math.max(el.startY, el.endY) + HIT_TOLERANCE;
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) return el;

      } else if (el.type === 'circle') {
        const radius = Math.sqrt(Math.pow(el.endX - el.startX, 2) + Math.pow(el.endY - el.startY, 2));
        const dist = Math.sqrt(Math.pow(x - el.startX, 2) + Math.pow(y - el.startY, 2));
        if (Math.abs(dist - radius) <= HIT_TOLERANCE) return el;

      } else if (el.type === 'line' || el.type === 'arrow') {
        // Point-to-segment distance
        const dx = el.endX - el.startX;
        const dy = el.endY - el.startY;
        const len2 = dx * dx + dy * dy;
        if (len2 === 0) continue;
        let t = ((x - el.startX) * dx + (y - el.startY) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        const nearX = el.startX + t * dx;
        const nearY = el.startY + t * dy;
        const dist = Math.sqrt(Math.pow(x - nearX, 2) + Math.pow(y - nearY, 2));
        if (dist <= HIT_TOLERANCE) return el;

      } else if (el.type === 'path' && el.points && el.points.length > 1) {
        // Check bounding box of path
        const xs = el.points.map((p: any) => p.x);
        const ys = el.points.map((p: any) => p.y);
        const minX = Math.min(...xs) - HIT_TOLERANCE;
        const maxX = Math.max(...xs) + HIT_TOLERANCE;
        const minY = Math.min(...ys) - HIT_TOLERANCE;
        const maxY = Math.max(...ys) + HIT_TOLERANCE;
        if (x >= minX && x <= maxX && y >= minY && y <= maxY) return el;
      }
    }
    return null;
  }

  /** Starts dragging a canvas element (not sticky). Attaches mousemove/mouseup globally. */
  startDragElement(el: any, startX: number, startY: number) {
    this.draggingElement = el;
    this.isDraggingElement = true;
    this.dragOffsetX = startX;
    this.dragOffsetY = startY;

    // Snapshot the original coords so we can compute delta
    const origStartX = el.startX;
    const origStartY = el.startY;
    const origEndX = el.endX;
    const origEndY = el.endY;
    const origPoints = el.points ? el.points.map((p: any) => ({ ...p })) : null;

    const onMove = (e: MouseEvent) => {
      if (!this.isDraggingElement) return;
      const coords = this.getMouseCoords(e);
      const dx = coords.x - this.dragOffsetX;
      const dy = coords.y - this.dragOffsetY;

      // Mutate element in-place for instant visual feedback
      if (el.type === 'path' && origPoints) {
        el.points = origPoints.map((p: any) => ({ x: p.x + dx, y: p.y + dy }));
      } else {
        el.startX = origStartX + dx;
        el.startY = origStartY + dy;
        el.endX = origEndX + dx;
        el.endY = origEndY + dy;
      }

      // Trigger change detection + redraw
      this.whiteboardElements.set([...this.whiteboardElements()]);
      this.redrawCanvas();
    };

    const onUp = (e: MouseEvent) => {
      if (!this.isDraggingElement) return;
      this.isDraggingElement = false;

      // Persist final position to Firebase
      if (this.classId && this.draggingElement) {
        const update: any = {};
        if (el.type === 'path') {
          update.points = el.points;
        } else {
          update.startX = el.startX;
          update.startY = el.startY;
          update.endX = el.endX;
          update.endY = el.endY;
        }
        this.db.updateWhiteboardElement(this.classId, this.draggingElement.id, update);
      }
      this.draggingElement = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  draw(event: MouseEvent) {
    if (this.isDraggingElement || this.whiteboardTool() === 'select') return;
    if (!this.isDrawingLocal) return;
    const coords = this.getMouseCoords(event);
    this.performDrawTo(coords.x, coords.y);
  }

  drawTouch(event: TouchEvent) {
    if (!this.isDrawingLocal) return;
    event.preventDefault();
    const coords = this.getTouchCoords(event);
    this.performDrawTo(coords.x, coords.y);
  }

  performDrawTo(x: number, y: number) {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tool = this.whiteboardTool();
    const color = this.whiteboardColor();

    this.currentEndX = x;
    this.currentEndY = y;

    if (tool === 'pen' || tool === 'eraser') {
      // Draw locally for zero-latency feedback
      ctx.beginPath();
      ctx.moveTo(this.lastX, this.lastY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
      ctx.lineWidth = tool === 'eraser' ? 18 : 3;
      ctx.lineCap = 'round';
      ctx.stroke();

      this.lastX = x;
      this.lastY = y;
      this.currentPathPoints.push({ x, y });
    } else {
      // Redraw canvas with preview shape outline
      this.redrawCanvas();
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      if (tool === 'rect') {
        ctx.strokeRect(this.lastX, this.lastY, x - this.lastX, y - this.lastY);
      } else if (tool === 'circle') {
        const radius = Math.sqrt(Math.pow(x - this.lastX, 2) + Math.pow(y - this.lastY, 2));
        ctx.arc(this.lastX, this.lastY, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (tool === 'line') {
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (tool === 'arrow') {
        ctx.moveTo(this.lastX, this.lastY);
        ctx.lineTo(x, y);
        ctx.stroke();

        const angle = Math.atan2(y - this.lastY, x - this.lastX);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 10 * Math.cos(angle - Math.PI / 6), y - 10 * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(x, y);
        ctx.lineTo(x - 10 * Math.cos(angle + Math.PI / 6), y - 10 * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
    }
  }

  stopDrawing() {
    if (this.isDraggingElement || this.whiteboardTool() === 'select') return;
    if (!this.isDrawingLocal || !this.classId) return;
    this.isDrawingLocal = false;

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tool = this.whiteboardTool();
    const color = this.whiteboardColor();

    if (tool === 'pen' || tool === 'eraser') {
      if (this.currentPathPoints.length > 1) {
        const newEl = {
          id: 'wb-' + Date.now(),
          type: 'path',
          color: tool === 'eraser' ? '#FFFFFF' : color,
          width: tool === 'eraser' ? 18 : 3,
          points: this.currentPathPoints
        };
        this.db.addWhiteboardElement(this.classId, newEl);
      }
    } else if (tool === 'rect') {
      const newEl = {
        id: 'wb-' + Date.now(),
        type: 'rect',
        color,
        startX: this.lastX,
        startY: this.lastY,
        endX: this.currentEndX,
        endY: this.currentEndY
      };
      this.db.addWhiteboardElement(this.classId, newEl);
    } else if (tool === 'circle') {
      const newEl = {
        id: 'wb-' + Date.now(),
        type: 'circle',
        color,
        startX: this.lastX,
        startY: this.lastY,
        endX: this.currentEndX,
        endY: this.currentEndY
      };
      this.db.addWhiteboardElement(this.classId, newEl);
    } else if (tool === 'line') {
      const newEl = {
        id: 'wb-' + Date.now(),
        type: 'line',
        color,
        startX: this.lastX,
        startY: this.lastY,
        endX: this.currentEndX,
        endY: this.currentEndY
      };
      this.db.addWhiteboardElement(this.classId, newEl);
    } else if (tool === 'arrow') {
      const newEl = {
        id: 'wb-' + Date.now(),
        type: 'arrow',
        color,
        startX: this.lastX,
        startY: this.lastY,
        endX: this.currentEndX,
        endY: this.currentEndY
      };
      this.db.addWhiteboardElement(this.classId, newEl);
    }
    this.redrawCanvas();
  }

  // Whiteboard drawing synchronization
  redrawCanvas() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw all synced elements
    const selectedId = this.selectedElementId();
    this.whiteboardElements().forEach(el => {
      ctx.beginPath();
      ctx.strokeStyle = el.color;
      ctx.lineWidth = el.width || 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.type === 'path' && el.points && el.points.length > 0) {
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();

        // Selection highlight for path
        if (el.id === selectedId) {
          const xs = el.points.map((p: any) => p.x);
          const ys = el.points.map((p: any) => p.y);
          const PAD = 8;
          const bx = Math.min(...xs) - PAD, by = Math.min(...ys) - PAD;
          const bw = Math.max(...xs) - bx - PAD + PAD * 2;
          const bh = Math.max(...ys) - by - PAD + PAD * 2;
          ctx.save(); ctx.setLineDash([5, 3]); ctx.strokeStyle = '#4F46E5'; ctx.lineWidth = 1.5;
          ctx.strokeRect(bx, by, bw, bh); ctx.restore();
        }

      } else if (el.type === 'rect') {
        ctx.strokeRect(el.startX, el.startY, el.endX - el.startX, el.endY - el.startY);
        if (el.id === selectedId) {
          const PAD = 8;
          ctx.save(); ctx.setLineDash([5, 3]); ctx.strokeStyle = '#4F46E5'; ctx.lineWidth = 1.5;
          ctx.strokeRect(Math.min(el.startX, el.endX) - PAD, Math.min(el.startY, el.endY) - PAD,
            Math.abs(el.endX - el.startX) + PAD * 2, Math.abs(el.endY - el.startY) + PAD * 2);
          ctx.restore();
        }
      } else if (el.type === 'circle') {
        const radius = Math.sqrt(Math.pow(el.endX - el.startX, 2) + Math.pow(el.endY - el.startY, 2));
        ctx.arc(el.startX, el.startY, radius, 0, 2 * Math.PI);
        ctx.stroke();
        if (el.id === selectedId) {
          const PAD = 8;
          ctx.save(); ctx.setLineDash([5, 3]); ctx.strokeStyle = '#4F46E5'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(el.startX, el.startY, radius + PAD, 0, 2 * Math.PI); ctx.stroke();
          ctx.restore();
        }
      } else if (el.type === 'line') {
        ctx.moveTo(el.startX, el.startY);
        ctx.lineTo(el.endX, el.endY);
        ctx.stroke();
        if (el.id === selectedId) {
          const PAD = 8;
          const minX = Math.min(el.startX, el.endX) - PAD, minY = Math.min(el.startY, el.endY) - PAD;
          ctx.save(); ctx.setLineDash([5, 3]); ctx.strokeStyle = '#4F46E5'; ctx.lineWidth = 1.5;
          ctx.strokeRect(minX, minY, Math.abs(el.endX - el.startX) + PAD * 2, Math.abs(el.endY - el.startY) + PAD * 2);
          ctx.restore();
        }
      } else if (el.type === 'arrow') {
        ctx.moveTo(el.startX, el.startY);
        ctx.lineTo(el.endX, el.endY);
        ctx.stroke();

        const angle = Math.atan2(el.endY - el.startY, el.endX - el.startX);
        ctx.beginPath();
        ctx.moveTo(el.endX, el.endY);
        ctx.lineTo(el.endX - 10 * Math.cos(angle - Math.PI / 6), el.endY - 10 * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(el.endX, el.endY);
        ctx.lineTo(el.endX - 10 * Math.cos(angle + Math.PI / 6), el.endY - 10 * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
        if (el.id === selectedId) {
          const PAD = 8;
          const minX = Math.min(el.startX, el.endX) - PAD, minY = Math.min(el.startY, el.endY) - PAD;
          ctx.save(); ctx.setLineDash([5, 3]); ctx.strokeStyle = '#4F46E5'; ctx.lineWidth = 1.5;
          ctx.strokeRect(minX, minY, Math.abs(el.endX - el.startX) + PAD * 2, Math.abs(el.endY - el.startY) + PAD * 2);
          ctx.restore();
        }
      }
    });
  }

  updateStickyText(el: any, event: any) {
    if (!this.classId) return;
    this.db.updateWhiteboardElement(this.classId, el.id, { text: event.target.value });
  }

  onStickyFocus(id: string) {
    this.activeEditingStickyId.set(id);
  }

  onStickyBlur(id: string, text: string) {
    this.activeEditingStickyId.set(null);
    if (!this.classId) return;
    this.db.updateWhiteboardElement(this.classId, id, { text });
  }

  onStickyInput(id: string, text: string) {
    if (!this.classId) return;
    this.db.updateWhiteboardElement(this.classId, id, { text });
  }

  addStickyNote() {
    if (!this.classId) return;
    const canvas = this.canvasRef?.nativeElement;
    const x = canvas ? Math.floor(canvas.width / 2) - 70 : 150;
    const y = canvas ? Math.floor(canvas.height / 2) - 50 : 150;

    const count = this.whiteboardElements().filter(e => e.type === 'sticky').length;
    const offset = (count % 5) * 20;

    const newEl = {
      id: 'wb-' + Date.now(),
      type: 'sticky',
      color: this.whiteboardColor(),
      x: x + offset,
      y: y + offset,
      text: this.t('Nouvelle note...', 'New note...')
    };
    this.db.addWhiteboardElement(this.classId, newEl);
  }

  draggedSticky: any = null;
  dragStartX = 0;
  dragStartY = 0;
  stickyOrigX = 0;
  stickyOrigY = 0;

  startDragSticky(event: MouseEvent, el: any) {
    if ((event.target as HTMLElement).tagName === 'TEXTAREA' || (event.target as HTMLElement).tagName === 'BUTTON') {
      return;
    }
    event.preventDefault();
    this.draggedSticky = el;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.stickyOrigX = el.x;
    this.stickyOrigY = el.y;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!this.draggedSticky) return;
      const dx = moveEvent.clientX - this.dragStartX;
      const dy = moveEvent.clientY - this.dragStartY;
      el.x = this.stickyOrigX + dx;
      el.y = this.stickyOrigY + dy;
    };

    const onMouseUp = () => {
      if (this.draggedSticky) {
        this.db.updateWhiteboardElement(this.classId, this.draggedSticky.id, { x: el.x, y: el.y });
        this.draggedSticky = null;
      }
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  startDragStickyTouch(event: TouchEvent, el: any) {
    if ((event.target as HTMLElement).tagName === 'TEXTAREA' || (event.target as HTMLElement).tagName === 'BUTTON') {
      return;
    }
    const touch = event.touches[0];
    this.draggedSticky = el;
    this.dragStartX = touch.clientX;
    this.dragStartY = touch.clientY;
    this.stickyOrigX = el.x;
    this.stickyOrigY = el.y;

    const onTouchMove = (moveEvent: TouchEvent) => {
      if (!this.draggedSticky) return;
      const moveTouch = moveEvent.touches[0];
      const dx = moveTouch.clientX - this.dragStartX;
      const dy = moveTouch.clientY - this.dragStartY;
      el.x = this.stickyOrigX + dx;
      el.y = this.stickyOrigY + dy;
    };

    const onTouchEnd = () => {
      if (this.draggedSticky) {
        this.db.updateWhiteboardElement(this.classId, this.draggedSticky.id, { x: el.x, y: el.y });
        this.draggedSticky = null;
      }
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };

    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
  }

  deleteWhiteboardElement(id: string) {
    if (!this.classId) return;
    this.db.deleteWhiteboardElement(this.classId, id);
  }

  clearWhiteboard() {
    if (!this.classId) return;
    this.dialogService.confirm(
      'Vider le tableau',
      'Voulez-vous vraiment effacer tous les dessins du tableau blanc ?',
      () => {
        // Immediately clear local signal and redraw (works for both local + Firebase)
        this.whiteboardElements.set([]);
        this.selectedElementId.set(null);
        this.redrawCanvas();
        this.db.clearWhiteboard(this.classId);
      }
    );
  }

  deleteSelectedElement() {
    const id = this.selectedElementId();
    if (!id || !this.classId) return;
    // Remove from local signal immediately
    this.whiteboardElements.set(this.whiteboardElements().filter(e => e.id !== id));
    this.selectedElementId.set(null);
    this.redrawCanvas();
    // Persist deletion
    this.db.deleteWhiteboardElement(this.classId, id);
  }

  // --- LIVE CHAT DISCUSSION LOGIC ---
  toggleChat() {
    this.showChat.set(!this.showChat());
    if (this.showChat()) {
      this.showWhiteboard.set(false);
      this.showPollsPanel.set(false);
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  togglePollsPanel() {
    this.showPollsPanel.set(!this.showPollsPanel());
    if (this.showPollsPanel()) {
      this.showChat.set(false);
      this.showWhiteboard.set(false);
    }
  }

  // --- LIVE HAND RAISE LOGIC ---
  isHandRaised(identity: string): boolean {
    const userId = identity.split('_')[1];
    if (!userId) return false;
    return this.raisedHandUserIds().includes(userId);
  }

  hasHandRaised(): boolean {
    const myId = this.db.getCurrentUser()?.id;
    if (!myId) return false;
    return this.raisedHandUserIds().includes(myId);
  }

  toggleHandRaise() {
    const myId = this.db.getCurrentUser()?.id;
    if (!myId || !this.classId) return;

    if (this.hasHandRaised()) {
      this.db.lowerHand(this.classId, myId);
    } else {
      this.db.raiseHand(this.classId, myId);
    }
  }

  lowerStudentHand(identity: string) {
    const userId = identity.split('_')[1];
    if (userId && this.classId) {
      this.db.lowerHand(this.classId, userId);
    }
  }

  playHandRaiseChime() {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {
      console.warn(e);
    }
  }

  // --- LIVE POLLS LOGIC ---
  addPollOption() {
    if (this.pollOptions.length < 5) {
      this.pollOptions.push('');
    }
  }

  removePollOption(index: number) {
    if (this.pollOptions.length > 2) {
      this.pollOptions.splice(index, 1);
    }
  }

  async submitNewPoll() {
    if (!this.pollQuestion.trim() || !this.classId) return;
    const options = this.pollOptions.filter(o => o.trim() !== '');
    if (options.length < 2) {
      this.dialogService.alert('Erreur', 'Veuillez saisir au moins 2 options.', 'info');
      return;
    }

    await this.db.createPoll(this.classId, this.pollQuestion, options);
    
    // Reset form
    this.pollQuestion = '';
    this.pollOptions = ['', ''];
    this.showPollCreator.set(false);
    this.dialogService.alert('Sondage Créé 📊', 'Le sondage a été publié en direct avec succès.', 'success');
  }

  async closeActivePoll(pollId: string) {
    if (this.classId) {
      await this.db.closePoll(this.classId, pollId);
    }
  }

  hasVoted(poll: LivePoll): boolean {
    const myId = this.db.getCurrentUser()?.id;
    return !!(myId && poll.votes && myId in poll.votes);
  }

  getMyVote(poll: LivePoll): number {
    const myId = this.db.getCurrentUser()?.id;
    if (!myId || !poll.votes) return -1;
    return poll.votes[myId] ?? -1;
  }

  async vote(pollId: string, optionIndex: number) {
    const myId = this.db.getCurrentUser()?.id;
    if (myId && this.classId) {
      await this.db.castVote(this.classId, pollId, myId, optionIndex);
    }
  }

  getOptionPercentage(poll: LivePoll, optionIndex: number): number {
    if (!poll.votes) return 0;
    const totalVotes = Object.keys(poll.votes).length;
    if (totalVotes === 0) return 0;
    const votesForOption = Object.values(poll.votes).filter(val => val === optionIndex).length;
    return Math.round((votesForOption / totalVotes) * 100);
  }

  getOptionVotesCount(poll: LivePoll, optionIndex: number): number {
    if (!poll.votes) return 0;
    return Object.values(poll.votes).filter(val => val === optionIndex).length;
  }

  getTotalVotesCount(poll: LivePoll): number {
    if (!poll.votes) return 0;
    return Object.keys(poll.votes).length;
  }

  sendTextMessage() {
    if (!this.newChatMessage.trim() || !this.classId) return;

    const msg = {
      id: 'msg-' + Date.now(),
      senderName: this.userName,
      senderId: this.room?.localParticipant.identity || 'student',
      type: 'text',
      content: this.newChatMessage.trim(),
      createdAt: new Date().toISOString()
    };

    this.db.sendLiveChatMessage(this.classId, msg);
    this.newChatMessage = '';
  }

  chatRecordingState = signal<'idle' | 'recording'>('idle');
  chatRecordSeconds = signal<number>(0);
  private chatMediaRecorder: MediaRecorder | null = null;
  private chatAudioChunks: any[] = [];
  private chatTimerInterval: any = null;
  private chatRecordedTranscript = '';
  private chatRecognitionInstance: any = null;

  toggleVoiceMessageRecording() {
    if (this.chatRecordingState() === 'idle') {
      this.startChatVoiceRecording();
    } else {
      this.stopAndSendChatVoiceMessage();
    }
  }

  startChatVoiceRecording() {
    this.chatRecordedTranscript = '';
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      const mimeType = this.getSupportedAudioMimeType();
      const options = mimeType ? { mimeType } : {};
      this.chatMediaRecorder = new MediaRecorder(stream, options);
      this.chatAudioChunks = [];

      this.chatMediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chatAudioChunks.push(event.data);
        }
      };

      this.chatMediaRecorder.start();
      this.chatRecordingState.set('recording');
      this.chatRecordSeconds.set(0);

      this.chatTimerInterval = setInterval(() => {
        this.chatRecordSeconds.set(this.chatRecordSeconds() + 1);
      }, 1000);

      // Start recognition in parallel for transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          this.chatRecognitionInstance = new SpeechRecognition();
          this.chatRecognitionInstance.continuous = true;
          this.chatRecognitionInstance.interimResults = false;
          this.chatRecognitionInstance.lang = 'en-US';

          this.chatRecognitionInstance.onresult = (e: any) => {
            for (let i = e.resultIndex; i < e.results.length; ++i) {
              if (e.results[i].isFinal) {
                this.chatRecordedTranscript += e.results[i][0].transcript + ' ';
              }
            }
          };
          this.chatRecognitionInstance.start();
        } catch (e) {
          console.error("Speech recognition failed:", e);
        }
      }
    }).catch(err => {
      this.dialogService.alert(
        this.t('Erreur Microphone', 'Microphone Error'),
        this.t('Impossible d\'accéder au microphone.', 'Could not access the microphone.'),
        'info'
      );
    });
  }

  stopAndSendChatVoiceMessage() {
    if (!this.chatMediaRecorder || this.chatMediaRecorder.state === 'inactive') {
      clearInterval(this.chatTimerInterval);
      this.chatRecordingState.set('idle');
      return;
    }

    if (this.chatRecognitionInstance) {
      try {
        this.chatRecognitionInstance.stop();
      } catch (e) {}
    }

    this.chatMediaRecorder.onstop = () => {
      const mimeType = this.getSupportedAudioMimeType();
      const blobType = mimeType || 'audio/webm';
      const audioBlob = new Blob(this.chatAudioChunks, { type: blobType });

      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const durationMin = Math.floor(this.chatRecordSeconds() / 60);
        const durationSec = this.chatRecordSeconds() % 60;
        const durationStr = `${durationMin}:${durationSec < 10 ? '0' : ''}${durationSec}`;
        
        const finalTranscript = this.chatRecordedTranscript.trim() || 'Voice Message';

        const msg = {
          id: 'msg-' + Date.now(),
          senderName: this.userName,
          senderId: this.room?.localParticipant.identity || 'student',
          type: 'audio',
          content: finalTranscript,
          audioUrl: base64Data, // Save base64 audio data url
          audioDuration: durationStr,
          createdAt: new Date().toISOString()
        };

        this.db.sendLiveChatMessage(this.classId, msg);
      };
      this.chatMediaRecorder?.stream.getTracks().forEach(t => t.stop());
    };

    this.chatMediaRecorder.stop();
    clearInterval(this.chatTimerInterval);
    this.chatRecordingState.set('idle');
  }

  cancelChatVoiceRecording() {
    if (this.chatMediaRecorder && this.chatMediaRecorder.state !== 'inactive') {
      this.chatMediaRecorder.stop();
      this.chatMediaRecorder.stream.getTracks().forEach(t => t.stop());
    }
    if (this.chatRecognitionInstance) {
      try { this.chatRecognitionInstance.stop(); } catch (e) {}
    }
    clearInterval(this.chatTimerInterval);
    this.chatRecordingState.set('idle');
    this.chatRecordSeconds.set(0);
  }

  getSupportedAudioMimeType(): string {
    const types = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
    for (const type of types) {
      if ((window as any).MediaRecorder && (window as any).MediaRecorder.isTypeSupported && (window as any).MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  }

  playingMessageId = signal<string | null>(null);
  private currentAudioPlayer: HTMLAudioElement | null = null;

  playLiveAudioMessage(msg: any) {
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
        this.speakLiveMsg(msg.content);
      };

      this.currentAudioPlayer.play().catch(err => {
        console.error("Audio playback error:", err);
        this.playingMessageId.set(null);
        this.speakLiveMsg(msg.content);
      });
    } else {
      this.speakLiveMsg(msg.content);
    }
  }

  sendVoiceMessage() {
    this.toggleVoiceMessageRecording();
  }

  speakLiveMsg(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }

  openSpeechHelperModal() {
    this.showSpeechHelper.set(true);
  }

  assignSpeechScript() {
    if (!this.speechTeacherText.trim() || !this.classId) return;
    this.db.setSpeechPrompter(this.classId, {
      text: this.speechTeacherText.trim(),
      targetStudent: this.speechTargetStudent,
      senderName: this.userName
    }).then(() => {
      this.dialogService.alert('Script Assigné 🎉', `Le script de lecture a été envoyé avec succès à : ${this.speechTargetStudent === 'all' ? 'Tous les étudiants' : this.speechTargetStudent}`, 'success');
      this.speechTeacherText = '';
    });
  }

  useAssignedScript() {
    this.speechStudentText.set(this.speechAssignedText());
  }

  startSpeechRecording() {
    this.speechRecordingState.set('recording');
    this.speechRecordSeconds.set(0);
    this.speechRecordInterval = setInterval(() => {
      this.speechRecordSeconds.set(this.speechRecordSeconds() + 1);
    }, 1000);
  }

  stopSpeechRecording() {
    if (this.speechRecordInterval) {
      clearInterval(this.speechRecordInterval);
      this.speechRecordInterval = null;
    }
    this.speechRecordingState.set('finished');
  }

  playSpeechAudioPlayback() {
    this.speakLiveMsg(this.speechStudentText() || 'Testing your voice script');
  }

  resetSpeechRecording() {
    if (this.speechRecordInterval) {
      clearInterval(this.speechRecordInterval);
      this.speechRecordInterval = null;
    }
    this.speechRecordingState.set('idle');
    this.speechRecordSeconds.set(0);
  }

  sendSpeechVoiceMessage() {
    if (!this.classId) return;

    const durationMin = Math.floor(this.speechRecordSeconds() / 60);
    const durationSec = this.speechRecordSeconds() % 60;
    const durationStr = `${durationMin}:${durationSec < 10 ? '0' : ''}${durationSec}`;

    const msg = {
      id: 'msg-' + Date.now(),
      senderName: this.userName,
      senderId: this.room?.localParticipant.identity || 'student',
      type: 'audio',
      content: this.speechStudentText() || 'Voice note recorded with Speech Helper prompter.',
      audioDuration: durationStr,
      createdAt: new Date().toISOString()
    };

    this.db.sendLiveChatMessage(this.classId, msg);
    this.resetSpeechRecording();
    this.showSpeechHelper.set(false);
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  scrollToBottom() {
    setTimeout(() => {
      const container = document.querySelector('.chat-messages-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 100);
  }

  // --- SESSION RECORDING LOGIC ---
  toggleRecording() {
    if (this.isRecording()) {
      // Stop recording
      if (this.recordingInterval) {
        clearInterval(this.recordingInterval);
        this.recordingInterval = null;
      }
      this.isRecording.set(false);
      this.dialogService.alert('Enregistrement sauvegardé', 'La vidéo du cours a été enregistrée avec succès dans le cloud.', 'success');
    } else {
      // Start recording
      this.isRecording.set(true);
      this.recordingStartTime = Date.now();
      this.recordingDuration.set('00:00');
      this.recordingInterval = setInterval(() => {
        const diff = Date.now() - this.recordingStartTime!;
        const secs = Math.floor((diff / 1000) % 60);
        const mins = Math.floor((diff / 60000) % 60);
        this.recordingDuration.set(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }, 1000);
    }
  }

  endMeeting() {
    this.stopRecordingTimer();
    if (this.room) {
      this.room.disconnect();
    }
    this.statusText = 'Ended';
    
    // Log exit check-out action
    this.db.logAction('live_left', `A quitté (fin) le cours en direct: "${this.roomName}"`, this.classId);

    this.onMeetingEnd.emit();
  }

  leaveMeeting() {
    this.stopRecordingTimer();
    if (this.room) {
      this.room.disconnect();
    }
    this.statusText = 'Ended';

    // Log exit check-out action
    this.db.logAction('live_left', `A quitté le cours en direct: "${this.roomName}"`, this.classId);

    this.onMeetingLeave.emit();
  }

  stopRecordingTimer() {
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval);
      this.recordingInterval = null;
    }
  }

  ngOnDestroy() {
    this.stopRecordingTimer();
    if (this.chatSub) this.chatSub.unsubscribe();
    if (this.wbSub) this.wbSub.unsubscribe();
    if (this.prompterSub) this.prompterSub.unsubscribe();
    
    if (this.room) {
      if (this.statusText === 'Connected') {
        this.db.logAction('live_left', `A quitté le cours en direct (fermeture): "${this.roomName}"`, this.classId);
      }
      this.room.disconnect();
      this.room = null;
    }
    document.querySelectorAll('[id^="audio_"]').forEach(el => el.remove());
  }

  // Native Crypto HMAC JWT Token generator for LiveKit rooms
  async generateToken(roomName: string, identity: string, name: string): Promise<string> {
    const apiKey = environment.livekit.apiKey;
    const apiSecret = environment.livekit.apiSecret;

    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: apiKey,
      sub: identity,
      name: name,
      nbf: now - 5,
      exp: now + 14400,
      video: {
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true
      }
    };

    const base64UrlEncode = (str: string) => {
      const bytes = new TextEncoder().encode(str);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    };

    const base64UrlEncodeUint8 = (uint8: Uint8Array) => {
      let binary = '';
      const len = uint8.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    };

    const headerStr = base64UrlEncode(JSON.stringify(header));
    const payloadStr = base64UrlEncode(JSON.stringify(payload));
    const signatureInput = `${headerStr}.${payloadStr}`;

    const enc = new TextEncoder();
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(apiSecret),
      { name: 'HMAC', hash: { name: 'SHA-256' } },
      false,
      ['sign']
    );

    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, enc.encode(signatureInput));
    const signatureStr = base64UrlEncodeUint8(new Uint8Array(signature));
    return `${headerStr}.${payloadStr}.${signatureStr}`;
  }
}
