import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, Quiz, UserProfile } from '../../services/database.service';

interface MatchCard {
  id: number;
  text: string;
  matchId: number;
  type: 'english' | 'french';
  selected: boolean;
  matched: boolean;
}

@Component({
  selector: 'app-student-exercises',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      @if (activeExercise() === 'list') {
        <!-- LIST VIEW -->
        <div class="section-title" style="display:flex; align-items:center; gap:8px">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
          <span>Available Exercises & Games</span>
        </div>
        
        <div class="grid2" style="margin-bottom: 24px">
          
          <!-- Vocabulary game (Built-in) -->
          <div class="card" style="cursor:pointer; display:flex; flex-direction:column; justify-content:space-between; margin:0" (click)="startExercise('game')">
            <div>
              <div class="lesson-icon amber" style="margin-bottom:12px; width:40px; height:40px; border-radius:10px; background:#FFFBEB; border:1px solid #FDE68A; display:flex; align-items:center; justify-content:center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="9" rx="1" />
                  <rect x="14" y="3" width="7" height="5" rx="1" />
                  <rect x="14" y="12" width="7" height="9" rx="1" />
                  <rect x="3" y="16" width="7" height="5" rx="1" />
                </svg>
              </div>
              <div class="card-label" style="color:#D97706; font-weight:700">Vocabulary Game</div>
              <div class="card-value" style="font-size:15px; color:var(--text-primary); font-weight:700; margin-top:4px">Word Match (Association)</div>
              <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0 0">Match English terms with their French counterparts.</p>
            </div>
            <div style="font-size:11px; color:#D97706; font-weight:600; margin-top:12px; display:flex; align-items:center; gap:4px">
              Play Game <i class="ti ti-arrow-right"></i>
            </div>
          </div>

          <!-- Dynamic Quizzes uploaded by teachers -->
          @for (quiz of quizzes(); track quiz.id) {
            <div class="card" style="cursor:pointer; display:flex; flex-direction:column; justify-content:space-between; margin:0" (click)="startQuiz(quiz)">
              <div>
                <div class="lesson-icon" [style.background]="getQuizThemeBg(quiz.type)" [style.border]="'1px solid ' + getQuizThemeBorder(quiz.type)" style="margin-bottom:12px; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center">
                  @if (quiz.type === 'Oral Practice') {
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m9 11 3 3L22 4"/>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                  }
                </div>
                <div class="card-label" [style.color]="quiz.type === 'Oral Practice' ? '#0D9488' : '#4F46E5'" style="font-weight:700">
                  {{ quiz.type === 'Oral Practice' ? 'Oral Practice' : 'Grammar Quiz' }}
                </div>
                <div class="card-value" style="font-size:15px; color:var(--text-primary); font-weight:700; margin-top:4px">{{ quiz.title }}</div>
                <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0 0">
                  {{ quiz.questions.length }} tasks · {{ quiz.timeLimit || 'No limit' }}
                </p>
              </div>
              <div [style.color]="quiz.type === 'Oral Practice' ? '#0D9488' : '#4F46E5'" style="font-size:11px; font-weight:600; margin-top:12px; display:flex; align-items:center; gap:4px">
                Start Exercise <i class="ti ti-arrow-right"></i>
              </div>
            </div>
          }
        </div>

        @if (quizzes().length === 0) {
          <div style="padding: 30px; background: var(--surface-2); border-radius: 8px; border: 1px dashed var(--border); text-align: center; font-size: 12.5px; color: var(--text-secondary); margin-bottom: 24px">
            No dynamic exercises posted yet by your teacher.
          </div>
        }

        <!-- Weekly streak widget -->
        <div>
          <div class="section-title" style="display:flex; align-items:center; gap:8px">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
            <span>Practice Streak</span>
          </div>
          <div class="card" style="background:#FFF8F1; border:1px solid #FFE4D6; display:flex; align-items:center; gap:16px; padding:16px 20px; border-radius:12px; margin-bottom: 0">
            <div style="font-size:32px">🔥</div>
            <div>
              <div style="font-size:18px; font-weight:700; color:#D97706">{{ currentUser()?.streak || 0 }} Days Streak</div>
              <div style="font-size:12px; color:var(--text-secondary)">Practice every day to keep your streak alive and earn extra XP!</div>
            </div>
          </div>
        </div>
      } @else {
        <!-- ACTIVE EXERCISE OVERLAY CONTAINER -->
        <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.65); display:flex; justify-content:center; align-items:center; z-index:99999; padding:16px">
          <div class="card" style="width:100%; max-width:580px; background:#FFF; border-radius:12px; padding:24px; box-shadow:0 10px 25px rgba(0,0,0,0.25); max-height:90vh; overflow-y:auto">
            
            <!-- Modal Header -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; border-bottom:1px solid var(--border-weak); padding-bottom:12px">
              <h3 style="font-size:16px; font-weight:700; color:var(--text-primary); margin:0; display:flex; align-items:center; gap:8px">
                @if (activeExercise() === 'quiz' && activeQuiz()?.type === 'Oral Practice') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                  <span>Oral Speaking Exercise</span>
                } @else if (activeExercise() === 'quiz') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2">
                    <path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  <span>Classroom Quiz</span>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2">
                    <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
                  </svg>
                  <span>Vocabulary Game</span>
                }
              </h3>
              <button (click)="exitExercise()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center; justify-content:center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <!-- TAB 1: GRAMMAR QUIZ WRAPPER -->
            @if (activeExercise() === 'quiz') {
              @if (activeQuiz(); as quiz) {
                @if (!quizFinished()) {
                  <!-- PROGRESS & INFO -->
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
                    <span style="font-size:12px; font-weight:700; color:var(--text-primary)">{{ quiz.title }}</span>
                    <span style="font-size:11.5px; color:var(--text-muted)">Task {{ currentQuestionIdx() + 1 }} of {{ quiz.questions.length }}</span>
                  </div>

                  <!-- Progress Bar -->
                  <div style="width:100%; height:6px; background:#E5E7EB; border-radius:3px; margin-bottom:20px; overflow:hidden">
                    <div [style.width.%]="((currentQuestionIdx() + 1) / quiz.questions.length) * 100" [style.background]="quiz.type === 'Oral Practice' ? '#0D9488' : '#4F46E5'" style="height:100%; transition:width 0.3s"></div>
                  </div>

                  <!-- Question Text Container -->
                  <div class="card" style="background:var(--surface-2); margin-bottom:16px; border:1px solid var(--border-weak); padding:16px">
                    <p style="font-size:13.5px; font-weight:600; color:var(--text-primary); margin:0; line-height:1.4">
                      {{ quiz.questions[currentQuestionIdx()].question }}
                    </p>
                  </div>

                  @if (quiz.type === 'Oral Practice') {
                    <!-- ORAL SPEAKING RECORDER COMPONENT -->
                    <div class="card" style="background:#F0FDFA; border:1px dashed #0D9488; border-radius:10px; padding:20px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; margin-bottom:20px">
                      @if (recordingState() === 'idle') {
                        <button (click)="startAudioRecording()" style="width:56px; height:56px; border-radius:50%; background:#0D9488; color:white; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 10px rgba(13,148,136,0.3)">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
                          </svg>
                        </button>
                        <div style="font-size:12.5px; font-weight:700; color:#0F766E">Start Oral Recording</div>
                        <div style="font-size:11px; color:var(--text-muted)">Press the mic, read aloud clearly and answer the prompt</div>
                      } @else if (recordingState() === 'recording') {
                        <div style="display:flex; align-items:center; gap:8px">
                          <span class="recording-pulse"></span>
                          <span style="font-size:14px; font-weight:700; color:#EF4444">{{ formatDuration(recordSeconds()) }}</span>
                        </div>
                        
                        <!-- Visualizer Waves -->
                        <div style="width:100%; max-width:280px; height:40px; display:flex; align-items:center; justify-content:center; gap:3px">
                          @for (bar of [15, 30, 45, 25, 60, 40, 75, 50, 30, 15]; track bar; let bIdx = $index) {
                            <div [style.height.%]="getVisualizerBarHeight(bIdx)" style="width:5px; background:linear-gradient(to top, #0D9488, #34D399); border-radius:3px; transition:height 0.15s"></div>
                          }
                        </div>

                        <button (click)="stopAudioRecording()" style="width:48px; height:48px; border-radius:50%; background:#EF4444; color:white; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 10px rgba(239,68,68,0.3)">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
                        </button>
                        <div style="font-size:11.5px; color:var(--text-secondary)">Recording audio... click stop when done</div>
                      } @else if (recordingState() === 'finished') {
                        <!-- Finished voice response options -->
                        <div style="display:flex; align-items:center; gap:12px; background:#FFF; padding:12px; border-radius:8px; border:1px solid #2DD4BF; width:100%; max-width:360px">
                          <button style="width:34px; height:34px; border-radius:50%; border:none; background:#0D9488; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer" (click)="playAudioPlayback()">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                          </button>
                          <div style="flex:1">
                            <div style="font-size:12px; font-weight:600; color:var(--text-primary)">voice_answer_{{ currentQuestionIdx() + 1 }}.wav</div>
                            <div style="font-size:10px; color:var(--text-muted)">Duration: {{ formatDuration(recordSeconds()) }}</div>
                          </div>
                          <button (click)="resetAudioRecording()" style="background:none; border:none; color:#EF4444; font-size:16px; cursor:pointer" title="Record Again">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      }
                    </div>
                  } @else {
                    <!-- STANDARD MULTIPLE CHOICE OPTIONS -->
                    <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:20px">
                      @for (opt of quiz.questions[currentQuestionIdx()].options; track opt; let idx = $index) {
                        <button class="ni" 
                                [class.active]="selectedOption() === getOptionLetter(idx)"
                                (click)="selectedOption.set(getOptionLetter(idx))" 
                                style="border: 1px solid var(--border); background:var(--surface-1); padding:12px; border-radius:8px; text-align: left; cursor:pointer; font-weight:500; font-size:13px">
                          <span style="font-weight:700; color:#4F46E5; margin-right:8px">{{ getOptionLetter(idx) }}.</span> {{ opt }}
                        </button>
                      }
                    </div>
                  }

                  <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-weak); padding-top:16px">
                    <button class="btn-s" [disabled]="currentQuestionIdx() === 0" (click)="prevQuestion(quiz)">Previous</button>
                    
                    @if (quiz.type === 'Oral Practice') {
                      <button class="btn-p" style="background:#0D9488; border-color:#0D9488" (click)="nextOralQuestion(quiz)" [disabled]="recordingState() !== 'finished'">
                        {{ currentQuestionIdx() + 1 === quiz.questions.length ? 'Submit All Answers' : 'Next Question' }}
                      </button>
                    } @else {
                      <button class="btn-p" (click)="nextQuestion(quiz)" [disabled]="!selectedOption()">
                        {{ currentQuestionIdx() + 1 === quiz.questions.length ? 'Submit Quiz' : 'Next Question' }}
                      </button>
                    }
                  </div>
                } @else {
                  <!-- QUIZ RESULTS SCREEN -->
                  <div style="text-align:center; padding:20px 0">
                    <div style="width:64px; height:64px; border-radius:50%; background:#ECFDF5; border:1px solid #10B981; display:flex; align-items:center; justify-content:center; margin:0 auto 16px auto">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                    
                    <h3 style="font-size:18px; font-weight:800; margin-bottom:6px; color:var(--text-primary)">
                      {{ quiz.type === 'Oral Practice' ? 'Oral Practice Submitted!' : 'Quiz Completed!' }}
                    </h3>
                    
                    @if (quiz.type === 'Oral Practice') {
                      <p style="font-size:13px; color:var(--text-secondary); margin-bottom:16px; max-width:380px; margin-left:auto; margin-right:auto">
                        Your oral audio responses have been sent directly to the teacher for grading review! You will receive a notification once graded.
                      </p>
                      <div style="background:#E6F4EA; padding:8px 16px; border-radius:20px; display:inline-block; font-size:12.5px; font-weight:700; color:#0F766E; margin-bottom:20px">
                        +50 XP Earned
                      </div>
                    } @else {
                      <p style="font-size:13.5px; color:var(--text-secondary); margin-bottom:12px">
                        You scored <strong style="color:#059669">{{ quizScore() }}%</strong> ({{ quizCorrectCount() }} / {{ quiz.questions.length }} correct answers)
                      </p>
                      <div style="background:#EEF2FF; padding:8px 16px; border-radius:20px; display:inline-block; font-size:12.5px; font-weight:700; color:#4F46E5; margin-bottom:20px">
                        +{{ quizScore() >= 60 ? '50' : '10' }} XP Earned
                      </div>
                    }
                    
                    <div style="display:flex; justify-content:center; border-top:1px solid var(--border-weak); padding-top:16px">
                      <button class="btn-p" [style.background]="quiz.type === 'Oral Practice' ? '#0D9488' : '#4F46E5'" [style.border-color]="quiz.type === 'Oral Practice' ? '#0D9488' : '#4F46E5'" (click)="exitExercise()">Close Window</button>
                    </div>
                  </div>
                }
              }
            } @else if (activeExercise() === 'game') {
              <!-- TAB 2: VOCABULARY MATCH GAME -->
              @if (!gameFinished()) {
                <div style="margin-bottom:12px">
                  <h3 style="font-size:15px; font-weight:700; color:var(--text-primary); margin:0">Word Match (Association)</h3>
                  <p style="font-size:11.5px; color:var(--text-muted); margin:4px 0 0 0">Match the English words with their French counterparts.</p>
                </div>

                <!-- Cards Grid -->
                <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; margin-bottom:20px">
                  @for (card of gameCards(); track card.id) {
                    <button class="card" 
                            [class.active]="card.selected"
                            [style.opacity]="card.matched ? 0.35 : 1"
                            [style.pointer-events]="card.matched ? 'none' : 'auto'"
                            [style.border-color]="card.selected ? '#D97706' : 'var(--border)'"
                            [style.background]="card.selected ? '#FEF3C7' : 'var(--surface-1)'"
                            (click)="selectCard(card)"
                            style="padding:14px; text-align:center; font-weight:600; display:flex; align-items:center; justify-content:center; min-height:55px; margin:0; cursor:pointer; border-radius:8px">
                      {{ card.text }}
                    </button>
                  }
                </div>
              } @else {
                <!-- Game Results -->
                <div style="text-align:center; padding:20px 0">
                  <div style="width:64px; height:64px; border-radius:50%; background:#FFFBEB; border:1px solid #F59E0B; display:flex; align-items:center; justify-content:center; margin:0 auto 16px auto">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="8" r="7"/><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12"/>
                    </svg>
                  </div>
                  
                  <h3 style="font-size:17px; font-weight:800; color:var(--text-primary); margin-bottom:6px">Association Game Complete! 🥳</h3>
                  <p style="font-size:13px; color:var(--text-secondary); margin-bottom:16px">
                    Excellent work! You matched all card pairs correctly.
                  </p>
                  <div style="background:#FFF9E6; padding:8px 16px; border-radius:20px; display:inline-block; font-size:12.5px; font-weight:700; color:#B45309; margin-bottom:20px">
                    +30 XP Earned
                  </div>
                  <div style="display:flex; justify-content:center; border-top:1px solid var(--border-weak); padding-top:16px">
                    <button class="btn-p" style="background:#D97706; border-color:#D97706" (click)="exitExercise()">Close Window</button>
                  </div>
                </div>
              }
            }

          </div>
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
export class StudentExercisesComponent {
  private db = inject(DatabaseService);

  activeExercise = signal<'list' | 'quiz' | 'game'>('list');
  quizzes = signal<Quiz[]>([]);
  activeQuiz = signal<Quiz | null>(null);
  currentUser = signal<UserProfile | null>(null);

  // Quiz States
  currentQuestionIdx = signal<number>(0);
  selectedOption = signal<string | null>(null);
  quizFinished = signal<boolean>(false);
  quizCorrectCount = signal<number>(0);
  quizScore = signal<number>(0);

  // Oral / Speaking Exercise States
  recordingState = signal<'idle' | 'recording' | 'finished'>('idle');
  recordSeconds = signal<number>(0);
  private timerInterval: any = null;
  private animInterval: any = null;
  visualizerHeights = signal<number[]>([15, 30, 45, 25, 60, 40, 75, 50, 30, 15]);
  recordedFiles = signal<{ [key: number]: string }>({}); // questionIdx -> base64

  // Game States
  gameCards = signal<MatchCard[]>([]);
  selectedCard = signal<MatchCard | null>(null);
  matchesFound = signal<number>(0);
  gameFinished = signal<boolean>(false);

  constructor() {
    this.db.observeQuizzes().subscribe(list => this.quizzes.set(list));
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
  }

  getQuizThemeBg(type: string): string {
    return type === 'Oral Practice' ? '#E6F4F1' : '#EEF2FF';
  }

  getQuizThemeBorder(type: string): string {
    return type === 'Oral Practice' ? '#99F6E4' : '#C7D2FE';
  }

  startQuiz(quiz: Quiz) {
    this.activeQuiz.set(quiz);
    this.activeExercise.set('quiz');
    this.currentQuestionIdx.set(0);
    this.selectedOption.set(null);
    this.quizFinished.set(false);
    this.quizCorrectCount.set(0);
    this.quizScore.set(0);
    this.recordedFiles.set({});
    this.resetAudioRecording();
  }

  startExercise(type: 'quiz' | 'game') {
    this.activeExercise.set(type);
    if (type === 'quiz') {
      this.currentQuestionIdx.set(0);
      this.selectedOption.set(null);
      this.quizFinished.set(false);
      this.quizCorrectCount.set(0);
      this.quizScore.set(0);
    } else if (type === 'game') {
      this.matchesFound.set(0);
      this.gameFinished.set(false);
      this.selectedCard.set(null);
      this.setupGameCards();
    }
  }

  exitExercise() {
    this.activeExercise.set('list');
    this.activeQuiz.set(null);
    this.resetAudioRecording();
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D
  }

  prevQuestion(quiz: Quiz) {
    if (this.currentQuestionIdx() > 0) {
      this.currentQuestionIdx.update(i => i - 1);
      this.selectedOption.set(null);
      
      // If it was an oral quiz, restore recording state for the previous question
      if (quiz.type === 'Oral Practice') {
        const file = this.recordedFiles()[this.currentQuestionIdx()];
        if (file) {
          this.recordingState.set('finished');
        } else {
          this.recordingState.set('idle');
        }
      }
    }
  }

  nextQuestion(quiz: Quiz) {
    const activeLetter = this.selectedOption();
    const correctLetter = quiz.questions[this.currentQuestionIdx()].correctOption;

    if (activeLetter === correctLetter) {
      this.quizCorrectCount.update(c => c + 1);
    }

    if (this.currentQuestionIdx() + 1 === quiz.questions.length) {
      // Finished
      const pct = Math.round((this.quizCorrectCount() / quiz.questions.length) * 100);
      this.quizScore.set(pct);
      this.quizFinished.set(true);
      
      // Award XP
      const xp = pct >= 60 ? 50 : 10;
      const user = this.currentUser();
      if (user) {
        this.db.updateUserXP(user.id, xp, true);
      }
    } else {
      this.currentQuestionIdx.update(i => i + 1);
      this.selectedOption.set(null);
    }
  }

  // Oral Exercises logic
  startAudioRecording() {
    this.recordingState.set('recording');
    this.recordSeconds.set(0);
    
    this.timerInterval = setInterval(() => {
      this.recordSeconds.set(this.recordSeconds() + 1);
    }, 1000);

    this.animInterval = setInterval(() => {
      const fresh = this.visualizerHeights().map(() => Math.floor(Math.random() * 70) + 15);
      this.visualizerHeights.set(fresh);
    }, 150);
  }

  stopAudioRecording() {
    clearInterval(this.timerInterval);
    clearInterval(this.animInterval);
    this.recordingState.set('finished');
    
    // Save simulated audio file to local recorded list
    const simulatedAudioData = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    this.recordedFiles.set({
      ...this.recordedFiles(),
      [this.currentQuestionIdx()]: simulatedAudioData
    });
  }

  resetAudioRecording() {
    clearInterval(this.timerInterval);
    clearInterval(this.animInterval);
    this.recordingState.set('idle');
    this.recordSeconds.set(0);
    
    // Delete file from local recorded list
    const fresh = { ...this.recordedFiles() };
    delete fresh[this.currentQuestionIdx()];
    this.recordedFiles.set(fresh);
  }

  nextOralQuestion(quiz: Quiz) {
    if (this.currentQuestionIdx() + 1 === quiz.questions.length) {
      // Completed Oral Exercise: Submit all voice notes as a unified submission
      const user = this.currentUser();
      if (user) {
        // Send simulated consolidated audio or a record to the teacher for review
        const simulatedPayload = this.recordedFiles()[0] || 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
        this.db.submitHomework(quiz.id, quiz.title, 'audio', simulatedPayload);
        
        // Award XP
        this.db.updateUserXP(user.id, 50, true);
      }
      this.quizFinished.set(true);
    } else {
      this.currentQuestionIdx.update(i => i + 1);
      
      // Load recorded file status for the next question if it exists
      const file = this.recordedFiles()[this.currentQuestionIdx()];
      if (file) {
        this.recordingState.set('finished');
      } else {
        this.recordingState.set('idle');
        this.recordSeconds.set(0);
      }
    }
  }

  playAudioPlayback() {
    this.speakWord(`Playing back your recorded voice response for question number ${this.currentQuestionIdx() + 1}`);
  }

  formatDuration(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  getVisualizerBarHeight(idx: number): number {
    return this.visualizerHeights()[idx] || 15;
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

  // Match Game Card logic
  setupGameCards() {
    const rawPairs = [
      { english: 'hypothesis', french: 'hypothèse' },
      { english: 'if', french: 'si' },
      { english: 'kitchen', french: 'cuisine' },
      { english: 'to come', french: 'venir' }
    ];

    const cards: MatchCard[] = [];
    rawPairs.forEach((p, idx) => {
      cards.push({
        id: idx * 2,
        text: p.english,
        matchId: idx,
        type: 'english',
        selected: false,
        matched: false
      });
      cards.push({
        id: idx * 2 + 1,
        text: p.french,
        matchId: idx,
        type: 'french',
        selected: false,
        matched: false
      });
    });

    cards.sort(() => Math.random() - 0.5);
    this.gameCards.set(cards);
  }

  selectCard(card: MatchCard) {
    if (card.matched) return;

    const list = [...this.gameCards()];
    const activeSelected = this.selectedCard();
    
    if (!activeSelected) {
      card.selected = true;
      this.selectedCard.set(card);
      this.gameCards.set(list);
    } else {
      if (activeSelected.id === card.id) {
        card.selected = false;
        this.selectedCard.set(null);
        this.gameCards.set(list);
      } else if (activeSelected.type === card.type) {
        const oldCard = list.find(c => c.id === activeSelected.id);
        if (oldCard) oldCard.selected = false;
        card.selected = true;
        this.selectedCard.set(card);
        this.gameCards.set(list);
      } else {
        if (activeSelected.matchId === card.matchId) {
          const c1 = list.find(c => c.id === activeSelected.id);
          const c2 = list.find(c => c.id === card.id);
          if (c1 && c2) {
            c1.matched = true;
            c1.selected = false;
            c2.matched = true;
            c2.selected = false;
          }
          this.matchesFound.update(m => m + 1);
          this.selectedCard.set(null);
          this.gameCards.set(list);

          if (this.matchesFound() === 4) {
            this.gameFinished.set(true);
            const user = this.currentUser();
            if (user) {
              this.db.updateUserXP(user.id, 30, true);
            }
          }
        } else {
          card.selected = true;
          this.gameCards.set(list);
          
          setTimeout(() => {
            const listReset = [...this.gameCards()];
            const c1 = listReset.find(c => c.id === activeSelected.id);
            const c2 = listReset.find(c => c.id === card.id);
            if (c1) c1.selected = false;
            if (c2) c2.selected = false;
            this.selectedCard.set(null);
            this.gameCards.set(listReset);
          }, 400);
        }
      }
    }
  }
}
