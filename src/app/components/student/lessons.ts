import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Lesson, Submission, UserProfile } from '../../services/database.service';

@Component({
  selector: 'app-student-lessons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      @if (!selectedLesson()) {
        <!-- STATISTICS & FILTER PANEL -->
        <div class="card" style="margin-bottom: 20px; background: linear-gradient(135deg, #EFF6FF 0%, #FAF5FF 100%); padding: 18px; border-radius: 12px; border: 1px solid var(--border-weak)">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px">
            <div>
              <h3 style="font-size:15px; font-weight:700; color:var(--text-primary); margin:0">My Lessons Progress</h3>
              <p style="font-size:11.5px; color:var(--text-secondary); margin:4px 0 0 0">
                Level: <strong style="color:#4F46E5">{{ currentUser()?.level || 'B1' }}</strong> · 
                Completed: <strong>{{ completedCount() }}</strong> / {{ lessons().length }} lessons
              </p>
            </div>
            <div style="display:flex; gap:12px; align-items:center">
              <div style="background:#FFF; padding:6px 12px; border-radius:8px; border:1px solid var(--border); display:flex; align-items:center; gap:6px">
                <i class="ti ti-search" style="color:var(--text-muted)"></i>
                <input type="text" [(ngModel)]="searchQuery" placeholder="Search lessons..." style="border:none; outline:none; font-size:12px; width:150px; background:transparent" />
              </div>
            </div>
          </div>
        </div>

        <!-- TABS & TYPE FILTER ROW -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px">
          <div class="tab-row" style="margin-bottom:0">
            <button class="tab" [class.active]="activeTab() === 'all'" (click)="activeTab.set('all')">All Lessons</button>
            <button class="tab" [class.active]="activeTab() === 'level'" (click)="activeTab.set('level')">My Level ({{ currentUser()?.level || 'B1' }})</button>
          </div>
          
          <div style="display:flex; gap:6px; flex-wrap:wrap">
            @for (type of ['All', 'Grammar', 'Listening', 'Vocabulary']; track type) {
              <button 
                (click)="selectedTypeFilter.set(type)"
                [style.background]="selectedTypeFilter() === type ? '#4F46E5' : 'var(--surface-1)'"
                [style.color]="selectedTypeFilter() === type ? '#FFF' : 'var(--text-secondary)'"
                [style.border-color]="selectedTypeFilter() === type ? '#4F46E5' : 'var(--border)'"
                style="padding:5px 12px; font-size:11.5px; border-radius:20px; font-weight:600; cursor:pointer; border:1px solid; transition:all 0.2s">
                {{ type }}
              </button>
            }
          </div>
        </div>

        <!-- LESSONS CARD GRID -->
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:16px">
          @for (lesson of filteredLessons(); track lesson.id) {
            <div class="card" (click)="selectLesson(lesson)" style="cursor:pointer; display:flex; flex-direction:column; justify-content:space-between; margin:0; padding:16px; border-radius:12px; transition:transform 0.2s, box-shadow 0.2s; border:1px solid var(--border-weak)" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)'" onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
                  <span class="badge" [style.background]="getBadgeBg(lesson.type)" [style.color]="getBadgeColor(lesson.type)" style="font-size:10px; font-weight:700; text-transform:uppercase; padding:2px 8px; border-radius:20px">
                    {{ lesson.type }}
                  </span>
                  <span style="font-size:10.5px; color:var(--text-muted)">Due: {{ lesson.dueDate }}</span>
                </div>
                
                <h4 style="font-size:14px; font-weight:700; color:var(--text-primary); margin:0 0 6px 0; line-height:1.3">{{ lesson.title }}</h4>
                <p style="font-size:11.5px; color:var(--text-muted); margin:0 0 12px 0">Level {{ lesson.level }} · Course Study Material</p>
              </div>

              <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-weak); padding-top:12px; margin-top:12px">
                <span class="pill" [class.done]="isLessonSubmitted(lesson.id)" [class.new]="!isLessonSubmitted(lesson.id)">
                  {{ isLessonSubmitted(lesson.id) ? (getSubmissionStatus(lesson.id)) : 'Unsubmitted' }}
                </span>
                <span style="font-size:11.5px; color:#4F46E5; font-weight:600; display:flex; align-items:center; gap:4px">
                  Open Lesson <i class="ti ti-arrow-right"></i>
                </span>
              </div>
            </div>
          } @empty {
            <div class="card" style="grid-column: 1 / -1; text-align:center; padding:40px; color:var(--text-muted)">
              <i class="ti ti-book-off" style="font-size:36px; display:block; margin-bottom:12px"></i>
              <p style="font-size:13px; font-weight:500; margin:0">No lessons found matching the selected filter query.</p>
            </div>
          }
        </div>
      } @else {
        <!-- SELECTED LESSON DETAIL VIEW -->
        <div class="card" style="padding:20px; border-radius:12px">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border-weak); padding-bottom:12px">
            <button class="btn-s" (click)="selectedLesson.set(null)" style="font-size:12px; padding:6px 12px; border-radius:8px"><i class="ti ti-arrow-left"></i> Back to Lessons</button>
            <span class="pill" [class.done]="isLessonSubmitted(selectedLesson()!.id)" [class.new]="!isLessonSubmitted(selectedLesson()!.id)">
              {{ getSubmissionStatus(selectedLesson()!.id) }}
            </span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:16px">
            <div>
              <h3 style="font-size:18px; font-weight:800; color:var(--text-primary); margin:0">{{ selectedLesson()?.title }}</h3>
              <p style="font-size:11.5px; color:var(--text-muted); margin:4px 0 0 0">Level: {{ selectedLesson()?.level }} · Class Material · Due Date: {{ selectedLesson()?.dueDate }}</p>
            </div>
            <span class="badge" [style.background]="getBadgeBg(selectedLesson()!.type)" [style.color]="getBadgeColor(selectedLesson()!.type)" style="font-size:11px; font-weight:700; text-transform:uppercase; padding:3px 10px; border-radius:20px">
              {{ selectedLesson()?.type }}
            </span>
          </div>

          <!-- Detail Tabs -->
          <div class="tab-row" style="margin-bottom:20px">
            <button class="tab" [class.active]="detailTab() === 'content'" (click)="detailTab.set('content')">Grammar Notes</button>
            <button class="tab" [class.active]="detailTab() === 'vocab'" (click)="detailTab.set('vocab')">Vocabulary List</button>
            <button class="tab" [class.active]="detailTab() === 'homework'" (click)="detailTab.set('homework')">Homework Submission</button>
          </div>

          <!-- Tab Contents -->
          @if (detailTab() === 'content') {
            <div class="card" style="background:#FFF; border:1px solid var(--border-weak); border-radius:8px; padding:18px; position:relative">
              <button (click)="copyText(selectedLesson()?.content || '')" style="position:absolute; top:12px; right:12px; background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:14px" title="Copy Notes">
                <i class="ti ti-copy"></i>
              </button>
              <div style="white-space: pre-line; line-height:1.6; font-size:13.5px; color:var(--text-secondary)">
                {{ selectedLesson()?.content }}
              </div>
            </div>
          } @else if (detailTab() === 'vocab') {
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:12px">
              @for (v of selectedLesson()?.vocabulary; track v) {
                <div class="row" style="margin-bottom:0; background:var(--surface-2); border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border-weak)">
                  <div style="display:flex; align-items:center; gap:8px">
                    <i class="ti ti-bookmarks" style="color:#4F46E5; font-size:16px"></i>
                    <span style="font-size:13px; font-weight:600; color:var(--text-primary)">{{ v }}</span>
                  </div>
                  
                  <div style="display:flex; gap:6px">
                    <!-- Text-to-speech speak button -->
                    <button (click)="speakWord(v)" style="background:none; border:none; color:#4F46E5; cursor:pointer; font-size:14px; padding:4px; display:flex; align-items:center" title="Listen Pronunciation">
                      <i class="ti ti-volume"></i>
                    </button>
                    <!-- Copy button -->
                    <button (click)="copyText(v)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:14px; padding:4px; display:flex; align-items:center" title="Copy Word">
                      <i class="ti ti-copy"></i>
                    </button>
                  </div>
                </div>
              } @empty {
                <div style="grid-column:1/-1; text-align:center; padding:20px; color:var(--text-muted); font-size:12px">
                  No vocabulary words defined for this lesson.
                </div>
              }
            </div>
          } @else if (detailTab() === 'homework') {
            <div style="display:flex; flex-direction:column; gap:16px">
              <div style="background:#EEF2FF; border-left:4px solid #4F46E5; padding:14px; border-radius:8px">
                <h4 style="font-size:12.5px; font-weight:700; color:#3730A3; margin:0 0 6px 0; display:flex; align-items:center; gap:6px">
                  <i class="ti ti-info-circle"></i> Homework Instructions:
                </h4>
                <p style="font-size:13px; color:#4B5563; line-height:1.5; margin:0">{{ selectedLesson()?.homeworkInstruction }}</p>
              </div>

              @if (getLessonSubmission(selectedLesson()!.id); as sub) {
                <!-- SHOW SUBMITTED HOMEWORK -->
                <div class="card" style="background:var(--surface-2); margin-top:8px; padding:16px; border-radius:8px">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                    <h4 style="font-size:12.5px; font-weight:700; margin:0">Your Submission:</h4>
                    <span class="badge" [style.background]="sub.type === 'audio' ? '#E0F2FE' : '#EEF2FF'" [style.color]="sub.type === 'audio' ? '#0369A1' : '#3730A3'" style="font-size:10px; font-weight:700; text-transform:uppercase">
                      {{ sub.type }}
                    </span>
                  </div>

                  @if (sub.type === 'audio') {
                    <!-- Simulated Audio Submission Player -->
                    <div style="display:flex; align-items:center; gap:12px; background:#FFF; padding:10px; border-radius:8px; border:1px solid var(--border-weak); margin-bottom:12px">
                      <button style="width:32px; height:32px; border-radius:50%; border:none; background:#0369A1; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer" (click)="speakWord('Playing back your audio homework submission')">
                        <i class="ti ti-player-play"></i>
                      </button>
                      <div style="flex:1">
                        <div style="font-size:11.5px; font-weight:600; color:var(--text-primary)">Voice Recording Submission</div>
                        <div style="font-size:10px; color:var(--text-muted)">Audio file attached successfully</div>
                      </div>
                    </div>
                  } @else {
                    <p style="font-size:13px; color:var(--text-secondary); margin:0 0 12px 0; font-style:italic; white-space:pre-line">"{{ sub.content }}"</p>
                  }
                  
                  @if (sub.graded) {
                    <div style="border-top:1.5px solid var(--border); padding-top:12px; margin-top:12px">
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                        <span style="font-size:13px; font-weight:700; color:#065F46">Grade Score: {{ sub.score }}</span>
                        <span style="font-size:11.5px; font-weight:700; color:#4F46E5">+{{ sub.xpReward }} XP Awarded</span>
                      </div>
                      <h5 style="font-size:12px; font-weight:700; color:var(--text-primary); margin:0 0 4px 0">Teacher Feedback:</h5>
                      <p style="font-size:12.5px; color:var(--text-secondary); margin:0; line-height:1.4">{{ sub.feedback }}</p>
                    </div>
                  } @else {
                    <div style="border-top:1px solid var(--border); padding-top:10px; font-size:12px; color:var(--text-muted); display:flex; align-items:center; gap:4px">
                      <i class="ti ti-clock"></i> Waiting for teacher grading review.
                    </div>
                  }
                </div>
              } @else {
                <!-- SUBMIT HOMEWORK FORM -->
                <div style="display:flex; gap:16px; margin-bottom:12px; border-bottom:1px solid var(--border-weak); padding-bottom:12px">
                  <button (click)="homeworkType = 'text'" [style.border-bottom]="homeworkType === 'text' ? '2px solid #4F46E5' : 'none'" [style.color]="homeworkType === 'text' ? '#4F46E5' : 'var(--text-muted)'" style="background:none; border:none; padding:8px 4px; font-size:13px; font-weight:600; cursor:pointer">
                    ✍️ Text Submission
                  </button>
                  <button (click)="homeworkType = 'audio'" [style.border-bottom]="homeworkType === 'audio' ? '2px solid #4F46E5' : 'none'" [style.color]="homeworkType === 'audio' ? '#4F46E5' : 'var(--text-muted)'" style="background:none; border:none; padding:8px 4px; font-size:13px; font-weight:600; cursor:pointer">
                    🎙️ Voice Recording
                  </button>
                </div>

                @if (homeworkType === 'text') {
                  <div class="input-row" style="margin-top:0">
                    <label for="hwAnswer" style="font-weight:600">Your Answer in English:</label>
                    <textarea id="hwAnswer" [(ngModel)]="homeworkContent" placeholder="Type your English paragraphs or sentences here..." rows="5"></textarea>
                  </div>
                  <button class="btn-p" (click)="submitHomework()" [disabled]="!homeworkContent.trim()" style="align-self:flex-start">
                    <i class="ti ti-send"></i> Submit Homework
                  </button>
                } @else {
                  <!-- AUDIO RECORDER PANEL -->
                  <div class="card" style="background:var(--surface-2); border-radius:8px; padding:20px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px">
                    @if (recordingState() === 'idle') {
                      <button (click)="startAudioRecording()" style="width:56px; height:56px; border-radius:50%; background:#4F46E5; color:white; border:none; font-size:24px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(79,70,229,0.3)">
                        <i class="ti ti-microphone"></i>
                      </button>
                      <div style="font-size:12.5px; font-weight:600; color:var(--text-primary)">Click to Start Audio Recording</div>
                      <div style="font-size:11px; color:var(--text-muted)">Record your voice reading or answering the questions</div>
                    } @else if (recordingState() === 'recording') {
                      <div style="display:flex; align-items:center; gap:8px">
                        <span class="recording-pulse"></span>
                        <span style="font-size:14px; font-weight:700; color:#EF4444">{{ formatDuration(recordSeconds()) }}</span>
                      </div>
                      
                      <!-- Live Neon Audio Wave Visualizer Simulation -->
                      <div style="width:100%; max-width:320px; height:40px; display:flex; align-items:center; justify-content:center; gap:3px">
                        @for (bar of [15, 30, 45, 25, 60, 40, 75, 50, 30, 15]; track bar; let idx = $index) {
                          <div [style.height.%]="getVisualizerBarHeight(idx)" style="width:5px; background:linear-gradient(to top, #3B82F6, #10B981); border-radius:3px; transition:height 0.15s"></div>
                        }
                      </div>

                      <button (click)="stopAudioRecording()" style="width:48px; height:48px; border-radius:50%; background:#EF4444; color:white; border:none; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(239,68,68,0.3)">
                        <i class="ti ti-square"></i>
                      </button>
                      <div style="font-size:12px; color:var(--text-secondary)">Recording voice... click square to stop</div>
                    } @else if (recordingState() === 'finished') {
                      <!-- Recording complete options -->
                      <div style="display:flex; align-items:center; gap:12px; background:#FFF; padding:12px; border-radius:8px; border:1px solid var(--border-weak); width:100%; max-width:360px">
                        <button style="width:36px; height:36px; border-radius:50%; border:none; background:#10B981; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer" (click)="speakWord('Playing back your recorded voice homework')">
                          <i class="ti ti-player-play"></i>
                        </button>
                        <div style="flex:1">
                          <div style="font-size:12px; font-weight:600; color:var(--text-primary)">voice_homework.wav</div>
                          <div style="font-size:10px; color:var(--text-muted)">Duration: {{ formatDuration(recordSeconds()) }}</div>
                        </div>
                        <button (click)="resetAudioRecording()" style="background:none; border:none; color:#EF4444; font-size:16px; cursor:pointer" title="Delete & Record Again">
                          <i class="ti ti-trash"></i>
                        </button>
                      </div>

                      <div style="display:flex; gap:10px; margin-top:8px">
                        <button class="btn-p" (click)="submitVoiceHomework()" style="background:#10B981; border-color:#10B981">
                          <i class="ti ti-send"></i> Submit Voice Recording
                        </button>
                        <button class="btn-s" (click)="resetAudioRecording()">Record Again</button>
                      </div>
                    }
                  </div>
                }
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .recording-pulse {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #EF4444;
      display: inline-block;
      animation: pulse-red 1s infinite;
    }
    @keyframes pulse-red {
      0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
      100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
  `]
})
export class StudentLessonsComponent {
  private db = inject(DatabaseService);

  activeTab = signal<string>('all');
  selectedTypeFilter = signal<string>('All');
  detailTab = signal<string>('content');
  lessons = signal<Lesson[]>([]);
  submissions = signal<Submission[]>([]);
  currentUser = signal<UserProfile | null>(null);
  
  selectedLesson = signal<Lesson | null>(null);
  homeworkContent = '';
  searchQuery = '';

  // Voice recording state variables
  homeworkType = 'text'; // 'text' | 'audio'
  recordingState = signal<'idle' | 'recording' | 'finished'>('idle');
  recordSeconds = signal<number>(0);
  private timerInterval: any = null;
  private animInterval: any = null;
  visualizerHeights = signal<number[]>([15, 30, 45, 25, 60, 40, 75, 50, 30, 15]);

  constructor() {
    this.db.observeLessons().subscribe(list => this.lessons.set(list));
    this.db.observeSubmissions().subscribe(list => this.submissions.set(list));
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
  }

  completedCount(): number {
    let currentUserId = '';
    this.db.observeCurrentUser().subscribe(u => currentUserId = u?.id || '');
    const userSubs = this.submissions().filter(s => s.studentId === currentUserId);
    return this.lessons().filter(l => userSubs.some(s => s.lessonId === l.id)).length;
  }

  filteredLessons() {
    let list = this.lessons();
    
    // 1. Level filter
    if (this.activeTab() === 'level') {
      const level = this.currentUser()?.level || 'B1';
      list = list.filter(l => l.level === level);
    }

    // 2. Type filter
    if (this.selectedTypeFilter() !== 'All') {
      list = list.filter(l => l.type === this.selectedTypeFilter());
    }

    // 3. Search query filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      list = list.filter(l => l.title.toLowerCase().includes(query));
    }

    return list;
  }

  selectLesson(lesson: Lesson) {
    this.selectedLesson.set(lesson);
    this.detailTab.set('content');
    this.homeworkContent = '';
    this.homeworkType = 'text';
    this.resetAudioRecording();
  }

  isLessonSubmitted(lessonId: string): boolean {
    let currentUserId = '';
    this.db.observeCurrentUser().subscribe(u => currentUserId = u?.id || '');
    return this.submissions().some(s => s.lessonId === lessonId && s.studentId === currentUserId);
  }

  getLessonSubmission(lessonId: string): Submission | undefined {
    let currentUserId = '';
    this.db.observeCurrentUser().subscribe(u => currentUserId = u?.id || '');
    return this.submissions().find(s => s.lessonId === lessonId && s.studentId === currentUserId);
  }

  getSubmissionStatus(lessonId: string): string {
    const sub = this.getLessonSubmission(lessonId);
    if (!sub) return 'Unsubmitted';
    return sub.graded ? `Graded (${sub.score})` : 'Pending';
  }

  submitHomework() {
    const lesson = this.selectedLesson();
    if (!lesson || !this.homeworkContent.trim()) return;

    this.db.submitHomework(lesson.id, lesson.title, 'text', this.homeworkContent);
    this.homeworkContent = '';
  }

  // Audio recording methods
  startAudioRecording() {
    this.recordingState.set('recording');
    this.recordSeconds.set(0);
    
    this.timerInterval = setInterval(() => {
      this.recordSeconds.set(this.recordSeconds() + 1);
    }, 1000);

    // Audio Visualizer Simulation animation loop
    this.animInterval = setInterval(() => {
      const fresh = this.visualizerHeights().map(() => Math.floor(Math.random() * 70) + 15);
      this.visualizerHeights.set(fresh);
    }, 150);
  }

  stopAudioRecording() {
    clearInterval(this.timerInterval);
    clearInterval(this.animInterval);
    this.recordingState.set('finished');
  }

  resetAudioRecording() {
    clearInterval(this.timerInterval);
    clearInterval(this.animInterval);
    this.recordingState.set('idle');
    this.recordSeconds.set(0);
  }

  submitVoiceHomework() {
    const lesson = this.selectedLesson();
    if (!lesson) return;

    // Submit a simulated voice recording payload
    const simulatedAudioData = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    this.db.submitHomework(lesson.id, lesson.title, 'audio', simulatedAudioData);
    this.resetAudioRecording();
  }

  formatDuration(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  getVisualizerBarHeight(idx: number): number {
    return this.visualizerHeights()[idx] || 15;
  }

  // Utility Methods
  speakWord(word: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }

  copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  getBadgeBg(type: string | undefined): string {
    switch (type) {
      case 'Grammar': return '#EEF2FF';
      case 'Listening': return '#F0FDFA';
      default: return '#FFFBEB';
    }
  }

  getBadgeColor(type: string | undefined): string {
    switch (type) {
      case 'Grammar': return '#4F46E5';
      case 'Listening': return '#0D9488';
      default: return '#D97706';
    }
  }
}
