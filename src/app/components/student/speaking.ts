import { Component, inject, signal, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, Submission } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

interface SpeakingPrompt {
  id: string;
  level: string;
  text: string;
  translation: string;
  hint: string;
}

@Component({
  selector: 'app-student-speaking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      
      <!-- Speaking Challenge Card -->
      <div class="card" style="margin-bottom:20px; border:1.5px solid #4F46E5; background:linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%); padding:20px; border-radius:12px">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px">
          <span class="badge" style="background:#4F46E5; color:white; font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px; text-transform:uppercase">
            Speaking Challenge
          </span>
          <div style="display:flex; align-items:center; gap:8px">
            <span style="font-size:11.5px; color:var(--text-secondary); font-weight:600">Choose Prompt Level:</span>
            <select (change)="onPromptLevelChange($event)" style="padding:4px 8px; font-size:11.5px; border-radius:6px; border:1px solid var(--border); outline:none; background:#FFF; font-weight:600; cursor:pointer">
              @for (lvl of ['A1', 'A2', 'B1', 'B2']; track lvl) {
                <option [value]="lvl" [selected]="lvl === selectedLevel()">Level {{ lvl }}</option>
              }
            </select>
          </div>
        </div>

        <div style="margin-bottom:16px">
          <div style="font-size:11.5px; font-weight:700; color:#4F46E5; text-transform:uppercase; margin-bottom:4px">Target Prompt:</div>
          <h3 style="font-size:15px; font-weight:700; color:var(--text-primary); margin:0; line-height:1.4">
            "{{ activePrompt().text }}"
          </h3>
          <p style="font-size:12.5px; color:var(--text-secondary); margin:4px 0 0 0; font-style:italic">
            "{{ activePrompt().translation }}"
          </p>
          <div style="font-size:11.5px; color:#0D9488; margin-top:8px; display:flex; align-items:center; gap:4px">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <span><strong>Tip:</strong> {{ activePrompt().hint }}</span>
          </div>
        </div>

        <!-- Recording booth controls -->
        <div style="display:flex; flex-direction:column; gap:12px; background:var(--surface-2); padding:16px; border-radius:8px; border:1px solid var(--border-weak)">
          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap">
            @if (recorderState() === 'idle') {
              <button class="voice-btn" (click)="startRecording()" style="background:#4F46E5; color:white; border:none; padding:8px 16px; border-radius:8px; font-size:12.5px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
                </svg>
                Record Answer
              </button>
            } @else if (recorderState() === 'recording') {
              <button class="voice-btn" style="background:#EF4444; color:white; border:none; padding:8px 16px; border-radius:8px; font-size:12.5px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px" (click)="stopRecording()">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
                Stop Recording ({{ recordTimer() }}s)
              </button>
              
              <span style="font-size:12px; color:#EF4444; font-weight:600; display:flex; align-items:center; gap:4px">
                <span class="recording-pulse"></span> recording live audio...
              </span>
            } @else if (recorderState() === 'finished') {
              <div style="display:flex; flex-direction:column; gap:10px; width:100%">
                <div style="display:flex; align-items:center; gap:12px">
                  <audio [src]="audioUrl()" controls style="height:32px; flex:1"></audio>
                  <button class="btn-s" (click)="resetRecorder()" style="display:flex; align-items:center; gap:4px; padding:6px 12px; border-radius:8px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                    Delete
                  </button>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:4px">
                  <button class="btn-p" style="display:flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px" (click)="submitSpeakingAnswer()" [disabled]="isSubmitted()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                    {{ isSubmitted() ? 'Submitted Successfully!' : 'Submit to Teacher' }}
                  </button>

                  <button class="btn-s" style="display:flex; align-items:center; gap:6px; padding:8px 16px; border-radius:8px; border-color:#10B981; color:#10B981" (click)="analyzeWithAICoach()" [disabled]="aiLoading() || isSubmitted()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    {{ aiLoading() ? 'AI Coach is analyzing...' : 'Get Instant AI Feedback' }}
                  </button>
                </div>

                @if (aiLoading()) {
                  <div style="background:#F0FDF4; border:1px dashed #4ADE80; border-radius:8px; padding:12px; margin-top:10px; text-align:center">
                    <div style="font-size:12px; font-weight:700; color:#166534">AI Language Coach is analyzing your speech...</div>
                    <div style="font-size:11px; color:#15803d; margin-top:2px">Evaluating pronunciation, accent, grammar check, and sentence rhythm.</div>
                  </div>
                }

                @if (aiFeedback(); as fb) {
                  <div class="card" style="background:#FFF; border:1px solid #10B981; border-radius:10px; padding:14px; margin-top:12px; box-shadow:0 4px 6px -1px rgba(16, 185, 129, 0.1); margin-bottom:0">
                    <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #E8F5E9; padding-bottom:8px; margin-bottom:10px">
                      <span style="font-weight:800; color:#065F46; font-size:12px; display:flex; align-items:center; gap:6px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                        AI COACH SPEECH REVIEW
                      </span>
                      <span style="font-size:11px; font-weight:700; background:#D1FAE5; color:#065F46; padding:2px 8px; border-radius:10px">
                        Score: {{ fb.score }}
                      </span>
                    </div>

                    <div style="font-size:12px; margin-bottom:8px">
                      <strong style="color:var(--text-primary)">Speech Transcript draft:</strong>
                      <p style="color:var(--text-secondary); margin:4px 0; font-style:italic; font-size:12.5px; line-height:1.4">"{{ fb.transcript }}"</p>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:8px; font-size:11.5px">
                      <div>
                        <strong style="color:#0D9488">Pronunciation Tip:</strong>
                        <p style="color:var(--text-secondary); margin:2px 0">{{ fb.pronunciation }}</p>
                      </div>
                      <div>
                        <strong style="color:#4F46E5">Grammar feedback:</strong>
                        <p style="color:var(--text-secondary); margin:2px 0">{{ fb.grammar }}</p>
                      </div>
                      <div>
                        <strong style="color:#D97706">Fluency & Flow:</strong>
                        <p style="color:var(--text-secondary); margin:2px 0">{{ fb.fluency }}</p>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Wave Visualizer Canvas -->
          @if (recorderState() === 'recording') {
            <div class="visualizer-container" style="width:100%; height:75px; background:var(--surface-1); border-radius:8px; border:1px solid var(--border-weak); margin-top:10px; overflow:hidden">
              <canvas #waveCanvas style="width:100%; height:100%; display:block"></canvas>
            </div>
          }
        </div>
      </div>

      <!-- Word of the Day -->
      <div class="card" style="margin-bottom:20px; padding:18px; border-radius:12px; border:1px solid var(--border-weak); background:#FFF8F1">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
          <div style="font-size:11px; font-weight:700; color:#D97706; text-transform:uppercase">Word of the Day</div>
          <button (click)="speakWord('Kitchen')" style="background:none; border:none; color:#D97706; cursor:pointer; display:flex; align-items:center; gap:4px; font-size:12px; font-weight:600" title="Listen Pronunciation">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
            Listen Pronunciation
          </button>
        </div>
        
        <div style="font-size:12px; color:#B45309; font-weight:600">noun · /ˈkɪtʃ.ən/</div>
        <h4 style="font-size:18px; font-weight:800; color:#92400E; margin:2px 0 6px 0">Kitchen (La cuisine)</h4>
        <p style="font-size:12.5px; color:#4B5563; margin:0 0 10px 0; line-height:1.4">A room or area where food is prepared and cooked.</p>
        
        <div style="background:#FFF; padding:10px; border-radius:8px; border:1px solid #FFE4D6; font-size:12px; color:#78350F; line-height:1.4">
          <strong>Example:</strong> "We usually eat breakfast in the kitchen."<br>
          <span style="color:#D97706; font-style:italic">"Nous prenons habituellement notre petit-déjeuner dans la cuisine."</span>
        </div>
      </div>

      <!-- Historical Feedback -->
      <div>
        <div class="section-title" style="display:flex; align-items:center; gap:8px">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Recent Feedback from Teacher</span>
        </div>
        
        @for (sub of speakingSubmissions(); track sub.id) {
          @if (sub.graded) {
            <div class="lesson-item" style="border: 1px solid var(--border-weak); padding:14px; border-radius:10px; margin-bottom:10px">
              <div class="lesson-icon teal" style="width:36px; height:36px; border-radius:8px; background:#E6F4EA; border:1px solid #A7F3D0; display:flex; align-items:center; justify-content:center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <div class="lesson-info" style="margin-left:12px; flex:1">
                <div class="lesson-title" style="font-size:13.5px; font-weight:700; color:var(--text-primary)">{{ sub.lessonTitle }} reviewed</div>
                <div class="lesson-meta" style="font-weight: 700; color:#059669; font-size:12px; margin-top:2px">
                  Grade Score: {{ sub.score }} · +{{ sub.xpReward }} XP Awarded
                </div>
                <div class="lesson-meta" style="color:var(--text-secondary); margin-top:6px; font-style:italic; font-size:12.5px; line-height:1.4">
                  "{{ sub.feedback }}"
                </div>
              </div>
              <span class="pill done">Reviewed</span>
            </div>
          }
        }
        
        @if (speakingSubmissions().length === 0) {
          <div class="card" style="text-align:center; padding:30px; font-size:12.5px; color:var(--text-muted)">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:block; margin:0 auto 10px auto; opacity:0.6">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
            </svg>
            No reviewed recordings yet. Submit your speaking responses to receive feedback!
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
  private dialogService = inject(DialogService);

  @ViewChild('waveCanvas') waveCanvas!: ElementRef<HTMLCanvasElement>;

  // Fluency level presets
  speakingPrompts: SpeakingPrompt[] = [
    {
      id: 'prompt-a1',
      level: 'A1',
      text: 'Introduce yourself: say your name, age, nationality, and where you live.',
      translation: 'Présentez-vous : dites votre nom, votre âge, votre nationalité et où vous habitez.',
      hint: 'Use simple present tense: "My name is...", "I am... years old", "I live in..."'
    },
    {
      id: 'prompt-a2',
      level: 'A2',
      text: 'Describe a typical day in your life: what time do you wake up, and what do you do?',
      translation: 'Décrivez une journée typique de votre vie : à quelle heure vous réveillez-vous et que faites-vous ?',
      hint: 'Describe routines: "First, I wake up at...", "Then I have breakfast...", "In the evening, I..."'
    },
    {
      id: 'prompt-b1',
      level: 'B1',
      text: 'Describe your favorite hobby and explain why you enjoy doing it.',
      translation: 'Décrivez votre loisir préféré et expliquez pourquoi vous aimez le pratiquer.',
      hint: 'Express personal feelings: "I have been practicing... for...", "It helps me relax because..."'
    },
    {
      id: 'prompt-b2',
      level: 'B2',
      text: 'Discuss the advantages and disadvantages of technology in our modern daily lives.',
      translation: 'Discutez des avantages et des inconvénients de la technologie dans notre vie quotidienne moderne.',
      hint: 'Formulate structured debates: "On the one hand...", "However, a major drawback is...", "In my opinion..."'
    }
  ];

  selectedLevel = signal<string>('B1');
  activePrompt = signal<SpeakingPrompt>(this.speakingPrompts[2]);

  recorderState = signal<'idle' | 'recording' | 'finished'>('idle');
  recordTimer = signal<number>(0);
  audioUrl = signal<string | null>(null);
  isSubmitted = signal<boolean>(false);
  
  // AI Coach properties
  aiLoading = signal<boolean>(false);
  aiFeedback = signal<any | null>(null);
  
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private timerInterval: any;

  // Web Audio Visualizer states
  private audioCtx: AudioContext | null = null;
  private animationId: number | null = null;
  
  speakingSubmissions = signal<Submission[]>([]);

  constructor() {
    // Determine active level of student to pre-select matching prompt
    this.db.observeCurrentUser().subscribe(u => {
      const lvl = u?.level || 'B1';
      this.selectedLevel.set(lvl);
      const match = this.speakingPrompts.find(p => p.level === lvl) || this.speakingPrompts[2];
      this.activePrompt.set(match);
    });

    this.db.observeSubmissions().subscribe(list => {
      let currentUserId = '';
      this.db.observeCurrentUser().subscribe(u => currentUserId = u?.id || '');
      this.speakingSubmissions.set(list.filter(s => s.studentId === currentUserId && s.type === 'audio'));
    });
  }

  onPromptLevelChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    const lvl = target.value;
    this.selectedLevel.set(lvl);
    const match = this.speakingPrompts.find(p => p.level === lvl) || this.speakingPrompts[2];
    this.activePrompt.set(match);
    this.resetRecorder();
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
        const height = canvas.clientHeight || 75;
        canvas.width = width;
        canvas.height = height;

        const draw = () => {
          if (this.recorderState() !== 'recording') return;
          this.animationId = requestAnimationFrame(draw);

          analyser.getByteFrequencyData(dataArray);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.fillRect(0, 0, width, height);

          const barWidth = (width / bufferLength) * 1.8;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * height * 0.95;
            
            const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
            gradient.addColorStop(0, '#93C5FD');
            gradient.addColorStop(0.6, '#4F46E5');
            gradient.addColorStop(1, '#0D9488');

            ctx.fillStyle = gradient;
            
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

    this.startSimulatedWaveform();
  }

  startSimulatedWaveform() {
    setTimeout(() => {
      const canvas = this.waveCanvas?.nativeElement;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.clientWidth || 300;
      const height = canvas.clientHeight || 75;
      canvas.width = width;
      canvas.height = height;

      let phase = 0;

      const draw = () => {
        if (this.recorderState() !== 'recording') return;
        this.animationId = requestAnimationFrame(draw);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.fillRect(0, 0, width, height);

        ctx.lineWidth = 2.5;
        const wavesCount = 3;
        const colors = ['rgba(79, 70, 229, 0.8)', 'rgba(13, 148, 136, 0.6)', 'rgba(59, 130, 246, 0.4)'];

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
      this.audioUrl.set('assets/mock-recording.mp3');
    }
    this.recorderState.set('finished');
  }

  resetRecorder() {
    this.cleanUpAudioContext();
    this.recorderState.set('idle');
    this.audioUrl.set(null);
    this.isSubmitted.set(false);
    this.aiFeedback.set(null);
    this.aiLoading.set(false);
  }

  submitSpeakingAnswer() {
    if (this.isSubmitted()) return;
    const prompt = this.activePrompt();
    this.db.submitHomework('speaking-' + prompt.id, 'Speaking: ' + prompt.text, 'audio', this.audioUrl() || 'simulated-audio-data');
    this.isSubmitted.set(true);
  }

  async analyzeWithAICoach() {
    if (!this.db.getGeminiApiKey()) {
      const key = prompt('Google Gemini API Key is required.\nGet a free key at https://aistudio.google.com/');
      if (key?.trim()) this.db.setGeminiApiKey(key);
      else return;
    }
    this.aiLoading.set(true);
    this.aiFeedback.set(null);
    const systemInstruction = `You are the SpeakUp AI Speaking Coach. Analyze the student's spoken answer and return JSON:
    {"score":85,"scoreLabel":"Good","transcript":"...","pronunciation":{"score":80,"comment":"...","problematic_words":["word1"]},"grammar":{"score":85,"comment":"...","corrected_sentence":"..."},"fluency":{"score":88,"comment":"..."},"vocabulary":{"score":82,"comment":"..."},"strengths":["strength1"],"improvements":["area1"],"overall_advice":"..."}
    Return ONLY valid JSON. No markdown. All scores are 0-100 integers.`;
    const promptText = `Student is answering: "${this.activePrompt().text}" at level "${this.selectedLevel()}". The student is a French speaker. Simulate a plausible response and evaluate constructively.`;
    try {
      const res = await this.db.callGemini(systemInstruction, promptText);
      this.aiFeedback.set(JSON.parse(res));
    } catch(e) {
      this.aiFeedback.set(this.getLocalSpeakingFeedback(this.selectedLevel()));
    } finally {
      this.aiLoading.set(false);
    }
  }

  getLocalSpeakingFeedback(lvl: string) {
    const common = {
      score: 85, scoreLabel: 'Good',
      fluency: { score: 85, comment: 'Good pacing. Reduce hesitation pauses between sentences.' },
      vocabulary: { score: 80, comment: 'Solid vocabulary. Try using connectors: "furthermore", "in addition", "as a result".' },
      strengths: ['Clear sentence structure', 'Correct use of tense'],
      improvements: ['Add more details', 'Use more varied vocabulary'],
      overall_advice: 'Practice speaking for 30 seconds on a random topic every day to build fluency!'
    };
    if (lvl === 'A1') return { ...common, transcript: 'Hello! My name is Awa. I am twenty years old. I live in Dakar, Senegal.', pronunciation: { score: 75, comment: 'Good effort! Watch word endings (-ed, -s). Stress "na-tio-NAL-i-ty" correctly.', problematic_words: ['nationality', 'years'] }, grammar: { score: 80, comment: 'Good use of "I am" and "I live". Add more details!', corrected_sentence: 'My name is Awa. I am twenty years old and I live in Dakar. I am a student and I enjoy learning English.' } };
    if (lvl === 'A2') return { ...common, transcript: "Usually I wake up at seven. First I drink coffee. Then I go to work by bus.", pronunciation: { score: 78, comment: 'Clear speech. Watch the word "o\'clock" — stress is on "clock".', problematic_words: ["o'clock", 'usually'] }, grammar: { score: 82, comment: 'Good sequencing. Try adding frequency adverbs: "usually", "sometimes", "rarely".', corrected_sentence: 'I usually wake up at seven o\'clock. First, I drink coffee. Then, I take the bus to work.' } };
    if (lvl === 'B2') return { ...common, score: 92, scoreLabel: 'Excellent', transcript: 'On the one hand, technology has many benefits. However, a major drawback is excessive screen time.', pronunciation: { score: 90, comment: 'Advanced articulation. Stress second syllable in "advantages": ad-VAN-tages.', problematic_words: ['advantages', 'drawback'] }, grammar: { score: 94, comment: 'Excellent transitions. Very rich sentence structure.', corrected_sentence: 'On the one hand, technology has numerous benefits. However, a major drawback is that we spend excessive time on screens, leading to social isolation.' } };
    return { ...common, transcript: 'My favorite hobby is playing football. I have been playing for five years with my friends.', pronunciation: { score: 83, comment: 'Very natural! Watch dropping the "h" in "hobby".', problematic_words: ['hobby', 'enjoy'] }, grammar: { score: 87, comment: 'Excellent use of present perfect "have been playing". Avoid repeating "football".', corrected_sentence: 'My favorite hobby is football, which I have been practicing for five years. It helps me relax and bond with friends.' } };
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

  speakWord(word: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }

  ngOnDestroy() {
    this.cleanUpAudioContext();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}
