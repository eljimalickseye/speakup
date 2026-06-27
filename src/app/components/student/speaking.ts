import { Component, inject, signal, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, Submission } from '../../services/database.service';

@Component({
  selector: 'app-student-speaking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <!-- Speaking Challenge Card -->
      <div class="challenge-box">
        <div class="challenge-label">Today's speaking challenge</div>
        <div class="challenge-prompt">
          "Describe your favorite recipe (e.g., crêpes, chocolate cake) and explain how to make it."
          <div style="font-size: 13px; font-weight: normal; color: var(--text-secondary); margin-top: 4px; font-style: italic">
            "Décrivez votre recette préférée (ex. crêpes, gâteau au chocolat) et expliquez comment la préparer."
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:12px; margin-top:12px; flex-wrap: wrap">
          @if (recorderState() === 'idle') {
            <button class="voice-btn" (click)="startRecording()">
              <i class="ti ti-microphone" aria-hidden="true"></i> Record my answer
            </button>
          } @else if (recorderState() === 'recording') {
            <button class="voice-btn" style="background:#EF4444" (click)="stopRecording()">
              <i class="ti ti-player-stop" aria-hidden="true"></i> Stop recording ({{ recordTimer() }}s)
            </button>
            <span style="font-size:12px; color:#EF4444; font-weight:600; display:flex; align-items:center; gap:4px">
              <span class="recording-pulse"></span> Recording in progress...
            </span>

            <!-- Wave Visualizer Canvas -->
            <div class="visualizer-container" style="width:100%; height:80px; background:var(--surface-2); border-radius:var(--radius); border:1px solid var(--border-weak); margin-top:14px; overflow:hidden">
              <canvas #waveCanvas style="width:100%; height:100%; display:block"></canvas>
            </div>
          } @else if (recorderState() === 'finished') {
            <div style="display:flex; flex-direction:column; gap:10px; width:100%">
              <div style="display:flex; align-items:center; gap:8px">
                <audio [src]="audioUrl()" controls style="height:32px; max-width:100%"></audio>
                <button class="btn-s" (click)="resetRecorder()"><i class="ti ti-trash"></i> Delete</button>
              </div>
              <button class="btn-p" style="align-self: flex-start" (click)="submitSpeakingAnswer()" [disabled]="isSubmitted()">
                <i class="ti ti-send"></i> {{ isSubmitted() ? 'Submitted!' : 'Submit Recording to Teacher' }}
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Word of the Day -->
      <div class="word-box">
        <div class="word-pos">noun · /ˈkɪtʃ.ən/</div>
        <div class="word-title">Kitchen (La cuisine)</div>
        <div class="word-def">A room or area where food is prepared and cooked.</div>
        <div class="word-example">
          "We usually eat breakfast in the kitchen."<br>
          <span style="font-size:11px; color:#D97706; font-style:normal">"Nous prenons habituellement notre petit-déjeuner dans la cuisine."</span>
        </div>
      </div>

      <!-- Historical Feedback -->
      <div>
        <div class="section-title">Recent feedback from teacher</div>
        
        @for (sub of speakingSubmissions(); track sub.id) {
          @if (sub.graded) {
            <div class="lesson-item">
              <div class="lesson-icon teal"><i class="ti ti-message-check" aria-hidden="true"></i></div>
              <div class="lesson-info">
                <div class="lesson-title">{{ sub.lessonTitle }} reviewed</div>
                <div class="lesson-meta" style="font-weight: 500; color:var(--text-primary)">
                  Grade: {{ sub.score }} · +{{ sub.xpReward }} XP
                </div>
                <div class="lesson-meta" style="color:var(--text-secondary); margin-top:4px">
                  "{{ sub.feedback }}"
                </div>
              </div>
              <span class="pill done">Reviewed</span>
            </div>
          }
        }
        
        @if (speakingSubmissions().length === 0) {
          <div style="text-align:center; padding:20px; font-size:12px; color:var(--text-muted)">
            No reviewed recordings yet. Submit your first recording above!
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .recording-pulse {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #EF4444;
      display: inline-block;
      animation: pulse-red 1s infinite;
    }
    @keyframes pulse-red {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
  `]
})
export class StudentSpeakingComponent implements OnDestroy {
  private db = inject(DatabaseService);

  @ViewChild('waveCanvas') waveCanvas!: ElementRef<HTMLCanvasElement>;

  recorderState = signal<'idle' | 'recording' | 'finished'>('idle');
  recordTimer = signal<number>(0);
  audioUrl = signal<string | null>(null);
  isSubmitted = signal<boolean>(false);
  
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private timerInterval: any;

  // Web Audio Visualizer states
  private audioCtx: AudioContext | null = null;
  private animationId: number | null = null;
  
  speakingSubmissions = signal<Submission[]>([]);

  constructor() {
    this.db.observeSubmissions().subscribe(list => {
      let currentUserId = '';
      this.db.observeCurrentUser().subscribe(u => currentUserId = u?.id || '');
      this.speakingSubmissions.set(list.filter(s => s.studentId === currentUserId && s.type === 'audio'));
    });
  }

  async startRecording() {
    this.audioChunks = [];
    this.isSubmitted.set(false);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        this.audioUrl.set(url);
        
        // Stop all track devices to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
      this.recorderState.set('recording');
      
      this.recordTimer.set(0);
      this.timerInterval = setInterval(() => {
        this.recordTimer.update(t => t + 1);
        if (this.recordTimer() >= 60) {
          this.stopRecording(); // Cap recording at 1 minute
        }
      }, 1000);

      // Start Web Audio frequency visualizer
      this.initAudioVisualizer(stream);
      
    } catch (e) {
      console.warn('Microphone permission blocked or not available. Running simulation...', e);
      this.startSimulatedRecording();
    }
  }

  initAudioVisualizer(stream: MediaStream) {
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioCtx.createMediaStreamSource(stream);
      const analyser = this.audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      setTimeout(() => {
        const canvas = this.waveCanvas?.nativeElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.clientWidth || 300;
        const height = canvas.clientHeight || 80;
        canvas.width = width;
        canvas.height = height;

        const draw = () => {
          if (this.recorderState() !== 'recording') return;
          this.animationId = requestAnimationFrame(draw);

          analyser.getByteFrequencyData(dataArray);

          ctx.fillStyle = 'rgba(249, 250, 251, 0.25)'; // Light surface fade background
          ctx.fillRect(0, 0, width, height);

          const barWidth = (width / bufferLength) * 1.8;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * height * 0.95;
            
            // Neon purple-blue to red vertical gradient
            const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
            gradient.addColorStop(0, '#818CF8');
            gradient.addColorStop(0.6, '#4F46E5');
            gradient.addColorStop(1, '#EF4444');

            ctx.fillStyle = gradient;
            
            // Render columns with round tops
            const y = height - barHeight;
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(x, y, barWidth - 1, barHeight, 3);
            } else {
              ctx.rect(x, y, barWidth - 1, barHeight);
            }
            ctx.fill();

            x += barWidth;
          }
        };
        draw();
      }, 50);
    } catch (e) {
      console.warn('Web Audio API visualizer failed to launch. Defaulting to simulation.', e);
      this.startSimulatedWaveform();
    }
  }

  startSimulatedRecording() {
    this.recorderState.set('recording');
    this.recordTimer.set(0);
    this.timerInterval = setInterval(() => {
      this.recordTimer.update(t => t + 1);
      if (this.recordTimer() >= 10) {
        this.stopRecording(); // Simulate 10 seconds recording
      }
    }, 1000);

    // Run simulated waveform animation
    this.startSimulatedWaveform();
  }

  startSimulatedWaveform() {
    setTimeout(() => {
      const canvas = this.waveCanvas?.nativeElement;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.clientWidth || 300;
      const height = canvas.clientHeight || 80;
      canvas.width = width;
      canvas.height = height;

      let phase = 0;

      const draw = () => {
        if (this.recorderState() !== 'recording') return;
        this.animationId = requestAnimationFrame(draw);

        ctx.fillStyle = 'rgba(249, 250, 251, 0.25)';
        ctx.fillRect(0, 0, width, height);

        // Draw multiple overlapping sine waves in neon colors
        ctx.lineWidth = 2.5;
        const wavesCount = 3;
        const colors = ['rgba(79, 70, 229, 0.8)', 'rgba(129, 140, 248, 0.5)', 'rgba(239, 68, 68, 0.4)'];

        for (let w = 0; w < wavesCount; w++) {
          ctx.strokeStyle = colors[w];
          ctx.beginPath();
          
          const ampMod = Math.sin(phase * 0.4 + w) * 12 + 15;
          const freqMod = 0.02 + w * 0.01;

          for (let x = 0; x < width; x++) {
            const y = height / 2 + Math.sin(x * freqMod + phase * (1 + w * 0.2)) * ampMod;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        phase += 0.08;
      };
      draw();
    }, 50);
  }

  stopRecording() {
    this.cleanUpAudioContext();

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    } else {
      // Mock audio blob
      this.audioUrl.set('assets/mock-recording.mp3');
    }
    this.recorderState.set('finished');
  }

  resetRecorder() {
    this.cleanUpAudioContext();
    this.recorderState.set('idle');
    this.audioUrl.set(null);
    this.isSubmitted.set(false);
  }

  submitSpeakingAnswer() {
    if (this.isSubmitted()) return;
    this.db.submitHomework('speaking-challenge-1', 'Daily speaking prompt', 'audio', this.audioUrl() || 'simulated-audio-data');
    this.isSubmitted.set(true);
  }

  private cleanUpAudioContext() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.audioCtx) {
      if (this.audioCtx.state !== 'closed') {
        this.audioCtx.close().catch(err => console.warn('Error closing AudioContext:', err));
      }
      this.audioCtx = null;
    }
  }

  ngOnDestroy() {
    this.cleanUpAudioContext();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}
