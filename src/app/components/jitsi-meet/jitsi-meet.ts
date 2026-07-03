import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { DialogService } from '../../services/dialog.service';
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
  micEnabled: boolean;
  camEnabled: boolean;
}

@Component({
  selector: 'app-jitsi-meet',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="livekit-wrapper">
      <!-- Header bar with class room title & agent indicator -->
      <div class="livekit-control-bar">
        <span class="room-title">
          <i class="ti ti-video" aria-hidden="true"></i> 
          Live Room: <span class="room-highlight">#{{ roomName }}</span>
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

      <!-- Main Video/Audio Grid -->
      <div class="video-grid">
        @for (p of participantsList(); track p.identity) {
          <div class="participant-card" 
               [class.speaking]="p.isSpeaking" 
               [class.bot]="p.isBot"
               [class.local]="p.isLocal">
            
            <!-- Video slot container -->
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
              <span class="name-text">{{ p.name }}</span>
              <span class="role-badge" [class.bot]="p.isBot" [class.teacher]="!p.isBot && !p.isLocal && isTeacherCard(p.identity)">
                {{ getRoleLabel(p) }}
              </span>
            </div>

            <!-- Mic status indicator -->
            <div class="mic-status" [class.muted]="!p.micEnabled" [class.active]="p.micEnabled && p.isSpeaking">
              @if (p.micEnabled) {
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
              }
            </div>

          </div>
        }
      </div>

      <!-- Action Panel controls (Mic, Cam, Screen Share, Exit) -->
      <div class="action-footer">
        <div class="footer-center-controls">
          <button (click)="toggleMic()" 
                  class="control-btn" 
                  [class.muted]="!localMicEnabled()"
                  [title]="localMicEnabled() ? 'Mute Mic' : 'Unmute Mic'">
            @if (localMicEnabled()) {
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            }
          </button>

          <button (click)="toggleCam()" 
                  class="control-btn" 
                  [class.muted]="!localCamEnabled()"
                  [title]="localCamEnabled() ? 'Disable Video' : 'Enable Video'">
            @if (localCamEnabled()) {
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 7a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7Z"/><path d="m16 21-2-2 2-2"/></svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34"/><circle cx="12" cy="13" r="4"/></svg>
            }
          </button>

          <button (click)="toggleScreenShare()" 
                  class="control-btn" 
                  [class.active]="isScreenSharing"
                  [title]="isScreenSharing ? 'Stop Presenting' : 'Present Screen'">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
          </button>
        </div>

        <div class="footer-right-actions">
          @if (isTeacher || expectsBot()) {
            <button class="btn-end" (click)="endMeeting()">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.62 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2 2A17 17 0 0 1 3 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .62 2.81 2 2 0 0 1-.45 2.11L8.9 9.9a16 16 0 0 0 1.78 3.41Z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
              <span>End Live Call</span>
            </button>
          } @else {
            <button class="btn-leave" (click)="leaveMeeting()">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span>Leave Live Call</span>
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
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
      animation: pulse-recording 1.5s infinite;
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

    .action-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background: #111827;
      border-top: 1px solid #1E293B;
    }

    .footer-center-controls {
      display: flex;
      gap: 12px;
      margin: 0 auto 0 0;
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
      background: #10B981;
      border-color: #10B981;
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
      0% { opacity: 1; }
      50% { opacity: 0.4; }
      100% { opacity: 1; }
    }
  `]
})
export class JitsiMeet implements AfterViewInit, OnDestroy {
  @Input() roomName = 'SpeakUp_Meeting_Room';
  @Input() isTeacher = false;
  @Input() userName = 'English Learner';
  @Input() userEmail = '';

  @Output() onMeetingLeave = new EventEmitter<void>();
  @Output() onMeetingEnd = new EventEmitter<void>();

  private room: Room | null = null;
  statusText = 'Connecting';
  
  participantsList = signal<ParticipantModel[]>([]);
  localMicEnabled = signal<boolean>(true);
  localCamEnabled = signal<boolean>(true);
  isScreenSharing = false;

  private dialogService = inject(DialogService);

  async ngAfterViewInit() {
    await this.connectToLiveKit();
  }

  async connectToLiveKit() {
    this.statusText = 'Connecting';
    
    try {
      // 1. Generate local access token client-side using API credentials
      const identity = this.isTeacher ? `teacher_${Date.now()}` : `student_${Date.now()}`;
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
          // Auto play the remote audio track in the browser
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
      const videoPub = Array.from(lp.videoTrackPublications.values())[0];
      const audioPub = Array.from(lp.audioTrackPublications.values())[0];

      list.push({
        identity: lp.identity,
        name: this.userName + ' (Moi)',
        isLocal: true,
        isBot: false,
        isSpeaking: lp.isSpeaking,
        videoTrack: videoPub?.videoTrack || null,
        audioTrack: audioPub?.audioTrack || null,
        micEnabled: lp.isMicrophoneEnabled,
        camEnabled: lp.isCameraEnabled
      });
    }

    // Remote participants
    this.room.remoteParticipants.forEach(rp => {
      const videoPub = Array.from(rp.videoTrackPublications.values())[0];
      const audioPub = Array.from(rp.audioTrackPublications.values())[0];
      const isBot = rp.identity.includes('bot') || rp.name?.toLowerCase().includes('bot') || false;

      list.push({
        identity: rp.identity,
        name: isBot ? 'AI Assistant' : rp.name || rp.identity,
        isLocal: false,
        isBot,
        isSpeaking: rp.isSpeaking,
        videoTrack: videoPub?.videoTrack || null,
        audioTrack: audioPub?.audioTrack || null,
        micEnabled: rp.isMicrophoneEnabled,
        camEnabled: rp.isCameraEnabled
      });
    });

    this.participantsList.set(list);

    // Attach video DOM elements dynamically
    list.forEach(p => {
      if (p.videoTrack && p.camEnabled) {
        this.attachTrack(p.identity, p.videoTrack);
      }
    });
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

  attachTrack(identity: string, track: VideoTrack) {
    setTimeout(() => {
      const container = document.getElementById('video_' + identity);
      if (container) {
        // Clear previous video tags to avoid rendering double screens
        container.innerHTML = '';
        const el = track.attach();
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.objectFit = 'cover';
        container.appendChild(el);
      }
    }, 100);
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

  endMeeting() {
    if (this.room) {
      this.room.disconnect();
    }
    this.statusText = 'Ended';
    this.onMeetingEnd.emit();
  }

  leaveMeeting() {
    if (this.room) {
      this.room.disconnect();
    }
    this.statusText = 'Ended';
    this.onMeetingLeave.emit();
  }

  ngOnDestroy() {
    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }
    // Remove cleanups of remote audio tags
    document.querySelectorAll('[id^="audio_"]').forEach(el => el.remove());
  }

  // native Web Crypto HMAC-SHA256 JWT Token Generator
  async generateToken(roomName: string, identity: string, name: string): Promise<string> {
    const apiKey = environment.livekit.apiKey;
    const apiSecret = environment.livekit.apiSecret;

    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: apiKey,
      sub: identity,
      name: name,
      nbf: now - 5,
      exp: now + 14400, // 4 hours
      video: {
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true
      }
    };

    const base64UrlEncode = (str: string) => {
      // Safely handle UTF-8 characters like French accents and emoji in base64 URL encoding
      const bytes = new TextEncoder().encode(str);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary)
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    };

    const base64UrlEncodeUint8 = (uint8: Uint8Array) => {
      let binary = '';
      const len = uint8.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      return btoa(binary)
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
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

    const signature = await window.crypto.subtle.sign(
      'HMAC',
      cryptoKey,
      enc.encode(signatureInput)
    );

    const signatureStr = base64UrlEncodeUint8(new Uint8Array(signature));
    return `${headerStr}.${payloadStr}.${signatureStr}`;
  }
}
