import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';

declare var JitsiMeetExternalAPI: any;
declare var RissaalahMeetExternalAPI: any;

@Component({
  selector: 'app-jitsi-meet',
  standalone: true,
  template: `
    <div class="jitsi-wrapper">
      <div class="jitsi-control-bar">
        <span class="room-title">
          <i class="ti ti-video" aria-hidden="true"></i> 
          Live: {{ roomName }}
        </span>
        <div class="jitsi-actions">
          <span class="status-indicator" [class.active]="statusText === 'In progress'" [class.ended]="statusText === 'Finished' || statusText === 'Ended'">
            {{ statusText }}
          </span>
          @if (isTeacher) {
            <button class="btn-end" (click)="endMeeting()">
              <i class="ti ti-phone-off" aria-hidden="true"></i> End Class
            </button>
          } @else {
            <button class="btn-leave" (click)="leaveMeeting()">
              <i class="ti ti-logout" aria-hidden="true"></i> Leave Class
            </button>
          }
        </div>
      </div>
      
      <div #jitsiContainer class="jitsi-container"></div>
      
      @if (participants.length > 0) {
        <div class="participants-list">
          <h4>Connected Participants ({{ participants.length }})</h4>
          <div class="p-tags">
            @for (p of participants; track p.id) {
              <span class="p-tag">
                <span class="bullet"></span> {{ p.displayName }}
              </span>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .jitsi-wrapper {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 520px;
      background: #111827;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #374151;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    .jitsi-control-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 18px;
      background: #1F2937;
      border-bottom: 1px solid #374151;
      color: #fff;
    }
    .room-title {
      font-weight: 500;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .room-title i {
      font-size: 18px;
      color: #EF4444;
      animation: pulse-recording 1.5s infinite;
    }
    .jitsi-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .status-indicator {
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 99px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: rgba(156, 163, 175, 0.1);
      color: #9CA3AF;
      border: 0.5px solid #4B5563;
    }
    .status-indicator.active {
      background: rgba(16, 185, 129, 0.15);
      color: #34D399;
      border: 0.5px solid #10B981;
    }
    .status-indicator.ended {
      background: rgba(239, 68, 68, 0.15);
      color: #F87171;
      border: 0.5px solid #EF4444;
    }
    .btn-end {
      background: #EF4444;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: inherit;
      transition: background 0.15s;
    }
    .btn-end:hover {
      background: #DC2626;
    }
    .btn-leave {
      background: #4B5563;
      color: white;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: inherit;
      transition: background 0.15s;
    }
    .btn-leave:hover {
      background: #374151;
    }
    .jitsi-container {
      flex: 1;
      width: 100%;
      height: 100%;
      min-height: 420px;
      background: #000;
    }
    .participants-list {
      padding: 12px 18px;
      background: #1F2937;
      border-top: 1px solid #374151;
      color: #D1D5DB;
    }
    .participants-list h4 {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 8px;
      color: #9CA3AF;
    }
    .p-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .p-tag {
      background: #374151;
      color: #F9FAFB;
      font-size: 11px;
      padding: 4px 10px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
      border: 0.5px solid #4B5563;
    }
    .p-tag .bullet {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10B981;
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

  @ViewChild('jitsiContainer') jitsiContainer!: ElementRef;

  private api: any;
  statusText = 'Waiting';
  participants: { id: string; displayName: string }[] = [];

  ngAfterViewInit() {
    this.startJitsi();
  }

  startJitsi() {
    const domain = 'meet.rissaalah.com';
    
    // Safely check for standard JitsiMeetExternalAPI or custom-branded RissaalahMeetExternalAPI
    const JitsiConstructor = (window as any).JitsiMeetExternalAPI || (window as any).RissaalahMeetExternalAPI;
    
    if (JitsiConstructor) {
      this.initJitsiWidget(domain, JitsiConstructor);
    } else {
      console.log('Jitsi Meet iframe API is not defined. Loading script dynamically...');
      const script = document.createElement('script');
      script.src = `https://${domain}/external_api.js`;
      script.async = true;
      script.onload = () => {
        const LoadedConstructor = (window as any).JitsiMeetExternalAPI || (window as any).RissaalahMeetExternalAPI;
        if (LoadedConstructor) {
          console.log('Jitsi Meet iframe API script loaded dynamically successfully.');
          this.initJitsiWidget(domain, LoadedConstructor);
        } else {
          console.error('Jitsi Meet iframe API script loaded dynamically but neither JitsiMeetExternalAPI nor RissaalahMeetExternalAPI is defined.');
          this.statusText = 'Load Error';
        }
      };
      script.onerror = (err) => {
        console.error('Failed to load Jitsi Meet iframe API script dynamically:', err);
        this.statusText = 'Load Error';
      };
      document.body.appendChild(script);
    }
  }

  initJitsiWidget(domain: string, constructor: any) {
    const options = {
      roomName: this.roomName,
      width: '100%',
      height: '100%',
      parentNode: this.jitsiContainer.nativeElement,
      userInfo: {
        displayName: this.userName,
        email: this.userEmail || `${this.userName.toLowerCase().replace(/\s/g, '')}@speakup.com`
      },
      configOverwrite: {
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        prejoinPageEnabled: true,
        disableDeepLinking: true
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DEFAULT_BACKGROUND: '#111827'
      }
    };

    try {
      this.api = new constructor(domain, options);
      this.statusText = 'In progress';

      this.api.addEventListeners({
        readyToClose: () => {
          this.handleLeave();
        },
        videoConferenceJoined: (event: any) => {
          console.log('Joined English class meet:', event);
          this.updateParticipants();
        },
        videoConferenceLeft: () => {
          this.handleLeave();
        },
        participantJoined: (event: any) => {
          console.log('Student/Teacher joined room:', event);
          this.updateParticipants();
        },
        participantLeft: (event: any) => {
          console.log('Student/Teacher left room:', event);
          this.updateParticipants();
        }
      });
    } catch (e) {
      console.error('Failed to load Jitsi Meet iframe API:', e);
      this.statusText = 'Load Error';
    }
  }

  updateParticipants() {
    if (this.api) {
      setTimeout(() => {
        try {
          const list = this.api.getParticipantsInfo();
          this.participants = list.map((p: any) => ({
            id: p.participantId,
            displayName: p.displayName
          }));
        } catch (e) {
          console.warn('Error reading Jitsi participants:', e);
        }
      }, 1200);
    }
  }

  handleLeave() {
    this.statusText = 'Ended';
    this.onMeetingLeave.emit();
  }

  endMeeting() {
    if (this.api) {
      try {
        this.api.executeCommand('hangup');
      } catch (e) {
        console.warn(e);
      }
    }
    this.statusText = 'Finished';
    this.onMeetingEnd.emit();
  }

  leaveMeeting() {
    if (this.api) {
      try {
        this.api.executeCommand('hangup');
      } catch (e) {
        console.warn(e);
      }
    }
    this.handleLeave();
  }

  ngOnDestroy() {
    if (this.api) {
      this.api.dispose();
    }
  }
}
