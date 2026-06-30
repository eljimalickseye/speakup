import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Quiz, UserProfile, VocabGame } from '../../services/database.service';

interface MatchCard {
  id: number;
  text: string;
  matchId: number;
  type: 'english' | 'french';
  selected: boolean;
  matched: boolean;
  error?: boolean;
}

interface QuestionWithExplanation {
  question: string;
  options: string[];
  correctOption: string;
  explanation?: string;
}

@Component({
  selector: 'app-student-exercises',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
          
          <!-- Dynamic Vocab Games uploaded by teachers -->
          @for (game of vocabGames(); track game.id) {
            <div class="card exercise-card game-card" (click)="playVocabGame(game)">
              <div>
                <div class="lesson-icon amber" style="margin-bottom:12px; width:40px; height:40px; border-radius:10px; background:#FFFBEB; border:1px solid #FDE68A; display:flex; align-items:center; justify-content:center">
                  @if (game.gameType === 'flashcards') {
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect width="12" height="18" x="3" y="3" rx="2" />
                      <path d="M7 3V21" />
                      <rect width="12" height="18" x="9" y="3" rx="2" />
                    </svg>
                  } @else if (game.gameType === 'matching') {
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                    </svg>
                  } @else if (game.gameType === 'memory') {
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                    </svg>
                  } @else if (game.gameType === 'word_builder') {
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M3 9h18" />
                      <path d="M9 21V9" />
                    </svg>
                  } @else {
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polygon points="6 3 20 12 6 21 6 3" />
                    </svg>
                  }
                </div>
                <div class="card-label" style="color:#D97706; font-weight:700">Jeu de Vocabulaire</div>
                <div class="card-value" style="font-size:14px; color:var(--text-primary); font-weight:700; margin-top:4px; display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden">{{ game.title }}</div>
                <p style="font-size:11.5px; color:var(--text-secondary); margin:6px 0 0 0">
                  {{ game.words.length }} mots · {{ getGameLabel(game.gameType) }} ({{ getDiffLabel(game.difficulty) }})
                </p>
              </div>
              <div style="font-size:11px; color:#D97706; font-weight:600; margin-top:12px; display:flex; align-items:center; gap:4px">
                Jouer au Jeu <i class="ti ti-arrow-right"></i>
              </div>
            </div>
          } @empty {
            <!-- Fallback Default Vocabulary Game (Built-in) -->
            <div class="card exercise-card game-card" (click)="playDefaultVocabGame()">
              <div>
                <div class="lesson-icon amber" style="margin-bottom:12px; width:40px; height:40px; border-radius:10px; background:#FFFBEB; border:1px solid #FDE68A; display:flex; align-items:center; justify-content:center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
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
          }

          <!-- Dynamic Quizzes uploaded by teachers -->
          @for (quiz of quizzes(); track quiz.id) {
            <div class="card exercise-card" [class.oral-card]="quiz.type === 'Oral Practice'" (click)="startQuiz(quiz)">
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
          <div class="card" style="background:#FFF8F1; border:1px solid #FFE4D6; padding:16px 20px; border-radius:12px; margin-bottom: 0; display:flex; flex-direction:column; gap:14px">
            <div style="display:flex; align-items:center; gap:16px">
              <div style="width:40px; height:40px; animation: bounce-streak 1.5s infinite; display:flex; align-items:center; justify-content:center; color:#EF4444">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                </svg>
              </div>
              <div>
                <div style="font-size:18px; font-weight:700; color:#D97706">{{ currentUser()?.streak || 0 }} Days Streak</div>
                <div style="font-size:12px; color:var(--text-secondary)">Practice every day to keep your streak alive and earn extra XP!</div>
              </div>
            </div>
            
            <!-- Horizontal 7-Day Tracker -->
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; border-top:1px solid #FFE4D6; padding-top:12px; margin-top:4px">
              @for (day of getWeeklyTrackerDays(); track day.name) {
                <div style="display:flex; flex-direction:column; align-items:center; gap:6px; flex:1">
                  <span style="font-size:9px; font-weight:700; color:#B45309; text-transform:uppercase">{{ day.name }}</span>
                  <div 
                    [style.background]="day.completed ? 'linear-gradient(135deg, #F59E0B, #D97706)' : '#FFF'"
                    [style.border-color]="day.completed ? '#D97706' : '#E2E8F0'"
                    [style.color]="day.completed ? '#FFF' : '#94A3B8'"
                    style="width:28px; height:28px; border-radius:50%; border:2px solid; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; box-shadow: 0 2px 4px rgba(0,0,0,0.02)">
                    @if (day.completed) {
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    } @else {
                      {{ day.letter }}
                    }
                  </div>
                </div>
              }
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
                    @if (quiz.type === 'True / False') {
                      <!-- TRUE / FALSE QUIZ OPTIONS -->
                      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:20px">
                        <button class="quiz-option-btn" 
                                [class.active]="selectedOption() === 'A'"
                                (click)="selectedOption.set('A')"
                                style="text-align:center">
                          Vrai (True)
                        </button>
                        <button class="quiz-option-btn" 
                                [class.active]="selectedOption() === 'B'"
                                (click)="selectedOption.set('B')"
                                style="text-align:center">
                          Faux (False)
                        </button>
                      </div>
                    } @else if (quiz.type === 'Essay' || quiz.type === 'written' || quiz.type === 'translation') {
                      <!-- ESSAY / WRITTEN RESPONSES -->
                      <div class="input-row" style="margin-top:0; margin-bottom:20px">
                        <textarea [ngModel]="selectedOption() || ''" 
                                  (ngModelChange)="selectedOption.set($event)"
                                  placeholder="Saisissez votre réponse ici..." 
                                  rows="5" 
                                  style="width:100%; border:1px solid var(--border); border-radius:8px; padding:12px; font-size:13px; background:#FFF; color:var(--text-primary)"></textarea>
                      </div>
                    } @else {
                      <!-- STANDARD MULTIPLE CHOICE OPTIONS -->
                      <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:20px">
                        @for (opt of quiz.questions[currentQuestionIdx()].options; track opt; let idx = $index) {
                          <button class="quiz-option-btn" 
                                  [class.active]="selectedOption() === getOptionLetter(idx)"
                                  (click)="selectedOption.set(getOptionLetter(idx))">
                            <span style="font-weight:700; color:#4F46E5; margin-right:8px">{{ getOptionLetter(idx) }}.</span> {{ opt }}
                          </button>
                        }
                      </div>
                    }
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
                      
                      <!-- Explanations for wrong answers -->
                      @if (quizScore() < 100) {
                        <div style="margin-top:20px; text-align:left; background:var(--surface-2); border:1px solid var(--border-weak); border-radius:10px; padding:16px; max-width:500px; margin-left:auto; margin-right:auto">
                          <h4 style="font-size:14px; font-weight:700; color:var(--text-primary); margin:0 0 12px 0; display:flex; align-items:center; gap:6px">
                            <i class="ti ti-book-open" style="color:#4F46E5"></i>
                            Corrections & Explications
                          </h4>
                          <div style="display:flex; flex-direction:column; gap:10px">
                            @for (q of quiz.questions; track q; let qi = $index) {
                              @if (getUserAnswer(qi) !== q.correctOption) {
                                <div style="background:#FFF; border:1px solid #FCA5A5; border-radius:8px; padding:10px 12px; border-left:3px solid #EF4444">
                                  <div style="font-size:12px; font-weight:600; color:#991B1B; margin-bottom:4px">
                                    Question {{ qi + 1 }}: {{ q.question }}
                                  </div>
                                  <div style="font-size:11px; color:var(--text-secondary); margin-bottom:3px">
                                    ❌ Votre réponse: <strong style="color:#EF4444">{{ getUserAnswerText(qi) }}</strong>
                                  </div>
                                  <div style="font-size:11px; color:var(--text-secondary); margin-bottom:6px">
                                    ✅ Bonne réponse: <strong style="color:#059669">{{ getCorrectAnswerText(q) }}</strong>
                                  </div>
                                  @if (q.explanation) {
                                    <div style="font-size:11px; color:#4B5563; background:#FEF3C7; padding:6px 8px; border-radius:6px; margin-top:4px; font-style:italic">
                                      💡 {{ q.explanation }}
                                    </div>
                                  }
                                </div>
                              }
                            }
                          </div>
                        </div>
                      }
                    }
                    
                    <div style="display:flex; justify-content:center; border-top:1px solid var(--border-weak); padding-top:16px; margin-top:{{ quizScore() < 100 && quiz.type !== 'Oral Practice' ? '20px' : '0' }}">
                      <button class="btn-p" [style.background]="quiz.type === 'Oral Practice' ? '#0D9488' : '#4F46E5'" [style.border-color]="quiz.type === 'Oral Practice' ? '#0D9488' : '#4F46E5'" (click)="exitExercise()">Close Window</button>
                    </div>
                  </div>
                }
              }
            } @else if (activeExercise() === 'listening') {
              <!-- TAB 3: LISTENING EXERCISE -->
              @if (!listeningFinished()) {
                <div style="margin-bottom:12px">
                  <h3 style="font-size:15px; font-weight:700; color:var(--text-primary); margin:0">👂 Listening Comprehension</h3>
                  <p style="font-size:11.5px; color:var(--text-muted); margin:4px 0 0 0">Listen to the text and answer the questions below.</p>
                </div>

                <!-- Audio Player -->
                <div class="card" style="background:linear-gradient(135deg,#F0FDFA,#E6F4EA); border:1px solid #2DD4BF; padding:20px; margin-bottom:20px; border-radius:10px">
                  <div style="display:flex; align-items:center; gap:16px; margin-bottom:12px">
                    <button (click)="playListeningText()" style="width:56px; height:56px; border-radius:50%; background:#0D9488; color:white; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 10px rgba(13,148,136,0.3)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </button>
                    <div style="flex:1">
                      <div style="font-size:13px; font-weight:700; color:#0F766E; margin-bottom:4px">Play Audio</div>
                      <div style="font-size:11px; color:var(--text-muted)">Click to listen to the passage</div>
                    </div>
                  </div>
                  
                  <!-- Text Display -->
                  <div style="background:#FFF; padding:14px; border-radius:8px; border:1px solid #2DD4BF; margin-top:10px">
                    <div style="font-size:11px; font-weight:700; color:#0D9488; margin-bottom:6px; text-transform:uppercase">📄 Text to Read Along:</div>
                    <p style="font-size:12.5px; color:var(--text-primary); line-height:1.6; margin:0; font-style:italic">
                      "{{ listeningText() }}"
                    </p>
                  </div>
                </div>

                <!-- Question -->
                <div class="card" style="background:var(--surface-2); margin-bottom:16px; border:1px solid var(--border-weak); padding:16px">
                  <div style="font-size:11px; font-weight:700; color:#4F46E5; margin-bottom:8px; text-transform:uppercase">Question {{ currentListeningIdx() + 1 }} of {{ listeningQuestions().length }}</div>
                  <p style="font-size:13.5px; font-weight:600; color:var(--text-primary); margin:0; line-height:1.4">
                    {{ listeningQuestions()[currentListeningIdx()].question }}
                  </p>
                </div>

                <!-- Options -->
                <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:20px">
                  @for (opt of listeningQuestions()[currentListeningIdx()].options; track opt; let idx = $index) {
                    <button class="quiz-option-btn" 
                            [class.active]="selectedListeningOption() === idx"
                            (click)="selectedListeningOption.set(idx)">
                      <span style="font-weight:700; color:#0D9488; margin-right:8px">{{ getOptionLetter(idx) }}.</span> {{ opt }}
                    </button>
                  }
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-weak); padding-top:16px">
                  <button class="btn-s" [disabled]="currentListeningIdx() === 0" (click)="prevListeningQuestion()">Previous</button>
                  <button class="btn-p" style="background:#0D9488; border-color:#0D9488" (click)="nextListeningQuestion()" [disabled]="selectedListeningOption() === null">
                    {{ currentListeningIdx() + 1 === listeningQuestions().length ? 'Submit' : 'Next Question' }}
                  </button>
                </div>
              } @else {
                <!-- Listening Results -->
                <div style="text-align:center; padding:20px 0">
                  <div style="width:64px; height:64px; border-radius:50%; background:#F0FDFA; border:1px solid #2DD4BF; display:flex; align-items:center; justify-content:center; margin:0 auto 16px auto">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  </div>
                  
                  <h3 style="font-size:17px; font-weight:800; color:var(--text-primary); margin-bottom:6px">Listening Exercise Complete! 🎧</h3>
                  <p style="font-size:13px; color:var(--text-secondary); margin-bottom:16px">
                    You scored <strong style="color:#0D9488">{{ listeningScore() }}%</strong> ({{ roundNumber(listeningScore() / 100 * listeningQuestions().length) }} / {{ listeningQuestions().length }} correct)
                  </p>
                  <div style="background:#E6F4EA; padding:8px 16px; border-radius:20px; display:inline-block; font-size:12.5px; font-weight:700; color:#0F766E; margin-bottom:20px">
                    +{{ listeningScore() >= 60 ? '50' : '10' }} XP Earned
                  </div>
                  <div style="display:flex; justify-content:center; border-top:1px solid var(--border-weak); padding-top:16px">
                    <button class="btn-p" style="background:#0D9488; border-color:#0D9488" (click)="exitExercise()">Close Window</button>
                  </div>
                </div>
              }
            } @else if (activeExercise() === 'game') {
               <!-- TAB 2: VOCABULARY MATCH GAME -->
               @if (!gameFinished()) {
                 <div style="margin-bottom:16px">
                   <h3 style="font-size:15px; font-weight:700; color:var(--text-primary); margin:0">{{ activeVocabGame()?.title || 'Jeu de vocabulaire' }}</h3>
                   <span class="badge" style="background:#FFF9E6; color:#D97706; font-size:10px; font-weight:700; text-transform:uppercase; padding:3px 8px; border-radius:20px; display:inline-block; margin-top:4px">
                     {{ getGameLabel(activeVocabGame()?.gameType || 'matching') }}
                   </span>
                 </div>

                 @if (activeVocabGame()?.gameType === 'matching') {
                   <!-- Cards Grid -->
                   <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; margin-bottom:20px">
                     @for (card of gameCards(); track card.id) {
                       <button class="vocab-match-card" 
                               [class.selected]="card.selected"
                               [class.matched]="card.matched"
                               [class.error]="card.error"
                               [style.pointer-events]="card.matched ? 'none' : 'auto'"
                               (click)="selectCard(card)">
                         <div style="display:flex; align-items:center; gap:6px; justify-content:center">
                           @if (card.matched) {
                             <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                           } @else if (card.error) {
                             <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                           }
                           <span>{{ card.text }}</span>
                         </div>
                       </button>
                     }
                   </div>
                 }

                 @if (activeVocabGame()?.gameType === 'memory') {
                   <!-- MEMORY INTERFACE -->
                   <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px; margin-bottom:20px">
                     @for (card of gameCards(); track card.id) {
                       <button class="vocab-match-card" 
                               [class.selected]="card.selected"
                               [class.matched]="card.matched"
                               [class.error]="card.error"
                               [style.pointer-events]="(card.matched || card.selected) ? 'none' : 'auto'"
                               [style.background]="card.matched ? '#ECFDF5' : (card.selected ? '#EEF2FF' : '#4F46E5')"
                               [style.border-color]="card.matched ? '#10B981' : (card.selected ? '#4F46E5' : '#4F46E5')"
                               [style.color]="(card.matched || card.selected) ? 'var(--text-primary)' : 'transparent'"
                               style="height:80px; font-size:11px; display:flex; align-items:center; justify-content:center; font-weight:700; border-radius:8px; transition: all 0.3s ease; box-shadow:0 2px 4px rgba(0,0,0,0.05)"
                               (click)="selectCard(card)">
                         @if (card.matched) {
                           <div style="color:#059669; font-weight:700; text-align:center">{{ card.text }}</div>
                         } @else if (card.selected) {
                           <div style="color:#4F46E5; font-weight:700; text-align:center">{{ card.text }}</div>
                         } @else {
                           <span style="color:#FFF; font-size:18px">❓</span>
                         }
                       </button>
                     }
                   </div>
                 }

                 @if (activeVocabGame()?.gameType === 'flashcards') {
                   <!-- FLASHCARDS INTERFACE -->
                   <div style="display:flex; flex-direction:column; align-items:center; gap:20px; width:100%">
                     <div style="font-size:12px; color:var(--text-muted)">Carte {{ currentCardIdx() + 1 }} sur {{ activeVocabGame()?.words?.length }}</div>
                     
                     <div (click)="flipCard()" 
                          style="width:100%; max-width:360px; height:220px; perspective: 1000px; cursor:pointer">
                       <div [style.transform]="isFlipped() ? 'rotateY(180deg)' : 'none'"
                            style="width:100%; height:100%; position:relative; transform-style:preserve-3d; transition: transform 0.6s; border-radius:12px; box-shadow:0 8px 20px rgba(0,0,0,0.1)">
                         
                         <!-- Front (English) -->
                         <div style="position:absolute; width:100%; height:100%; backface-visibility:hidden; background:linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); border:1.5px solid #4F46E5; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px">
                           <span style="font-size:10px; font-weight:700; color:#4F46E5; text-transform:uppercase; letter-spacing:1px">Anglais</span>
                           <h2 style="font-size:26px; font-weight:800; color:#1E1B4B; margin:8px 0 0 0; text-align:center">{{ activeVocabGame()?.words?.[currentCardIdx()]?.word }}</h2>
                           <p style="font-size:11px; color:#4F46E5; margin-top:20px; display:flex; align-items:center; gap:4px">
                             <i class="ti ti-rotate"></i> Cliquer pour retourner
                           </p>
                         </div>
                         
                         <!-- Back (French & Definition) -->
                         <div style="position:absolute; width:100%; height:100%; backface-visibility:hidden; background:#FFF; border:1.5px solid #E2E8F0; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; transform:rotateY(180deg)">
                           <span style="font-size:10px; font-weight:700; color:#059669; text-transform:uppercase; letter-spacing:1px">Français</span>
                           <h2 style="font-size:24px; font-weight:800; color:#065F46; margin:8px 0 4px 0; text-align:center">{{ activeVocabGame()?.words?.[currentCardIdx()]?.translation }}</h2>
                           @if (activeVocabGame()?.words?.[currentCardIdx()]?.definition) {
                             <p style="font-size:12px; color:var(--text-secondary); text-align:center; max-width:280px; margin:8px 0 0 0; line-height:1.4">
                               {{ activeVocabGame()?.words?.[currentCardIdx()]?.definition }}
                             </p>
                           }
                         </div>
                         
                       </div>
                     </div>

                     <div style="display:flex; justify-content:space-between; width:100%; max-width:360px; margin-top:12px">
                       <button class="btn-s" [disabled]="currentCardIdx() === 0" (click)="prevFlashcard()">Précédent</button>
                       <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5" (click)="nextFlashcard()">
                         {{ currentCardIdx() + 1 === activeVocabGame()?.words?.length ? 'Terminer' : 'Suivant' }}
                       </button>
                     </div>
                   </div>
                 }

                 @if (activeVocabGame()?.gameType === 'word_builder') {
                   <!-- WORD BUILDER INTERFACE -->
                   <div style="display:flex; flex-direction:column; align-items:center; gap:20px; width:100%">
                     <div style="font-size:12px; color:var(--text-muted)">Mot {{ wordBuilderIdx() + 1 }} sur {{ activeVocabGame()?.words?.length }}</div>
                     
                     <div style="background:var(--surface-2); padding:16px; border-radius:8px; border:1px solid var(--border-weak); text-align:center; width:100%">
                       <span style="font-size:10px; font-weight:700; color:#D97706; text-transform:uppercase">Traduire le mot :</span>
                       <h3 style="font-size:18px; font-weight:800; margin:4px 0 0 0; color:var(--text-primary)">
                         {{ activeVocabGame()?.words?.[wordBuilderIdx()]?.translation }}
                       </h3>
                       @if (activeVocabGame()?.words?.[wordBuilderIdx()]?.definition) {
                         <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0 0; line-height:1.4">
                           {{ activeVocabGame()?.words?.[wordBuilderIdx()]?.definition }}
                         </p>
                       }
                     </div>

                     <!-- Spelled word letters slot -->
                     <div style="display:flex; gap:8px; flex-wrap:wrap; min-height:48px; border-bottom:2px dashed var(--border); padding-bottom:12px; width:100%; justify-content:center">
                       @for (char of selectedLetters(); track $index; let sIdx = $index) {
                         <button (click)="clickSelectedLetter(char, sIdx)"
                                 style="width:36px; height:36px; border-radius:8px; border:1.5px solid #4F46E5; background:#EEF2FF; color:#4F46E5; font-size:16px; font-weight:800; display:flex; align-items:center; justify-content:center; cursor:pointer">
                           {{ char | uppercase }}
                         </button>
                       }
                     </div>

                     <!-- Scrambled pool options -->
                     <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center">
                       @for (char of scrambledLetters(); track $index; let scrIdx = $index) {
                         <button (click)="clickScrambledLetter(char, scrIdx)"
                                 style="width:36px; height:36px; border-radius:8px; border:1.5px solid var(--border); background:#FFF; color:var(--text-primary); font-size:16px; font-weight:800; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 2px 4px rgba(0,0,0,0.05)">
                           {{ char | uppercase }}
                         </button>
                       }
                     </div>

                     <button class="btn-s" style="margin-top:10px" (click)="resetWordBuilder()">Réinitialiser</button>
                   </div>
                 }

                 @if (activeVocabGame()?.gameType === 'hangman') {
                   <!-- HANGMAN INTERFACE -->
                   <div style="display:flex; flex-direction:column; align-items:center; gap:16px; width:100%">
                     <div style="font-size:12px; color:var(--text-muted)">Mot {{ hangmanIdx() + 1 }} sur {{ activeVocabGame()?.words?.length }}</div>

                     <div style="background:var(--surface-2); padding:16px; border-radius:8px; border:1px solid var(--border-weak); text-align:center; width:100%">
                       <span style="font-size:10px; font-weight:700; color:#EF4444; text-transform:uppercase">Indice / Traduction :</span>
                       <h3 style="font-size:18px; font-weight:800; margin:4px 0 0 0; color:var(--text-primary)">
                         {{ activeVocabGame()?.words?.[hangmanIdx()]?.translation }}
                       </h3>
                       @if (activeVocabGame()?.words?.[hangmanIdx()]?.definition) {
                         <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0 0; line-height:1.4">
                           {{ activeVocabGame()?.words?.[hangmanIdx()]?.definition }}
                         </p>
                       }
                     </div>

                     <!-- Lives Counter -->
                     <div style="font-size:13px; font-weight:700; color:#EF4444; display:flex; align-items:center; gap:6px">
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                         <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                       </svg>
                       <span>Vies restantes : {{ hangmanLives() }} / 6</span>
                     </div>

                     <!-- Underscore placeholder word displays -->
                     <div style="font-size:24px; font-weight:800; letter-spacing:6px; color:#1E1B4B; margin:12px 0; text-align:center; text-transform:uppercase">
                       {{ getHangmanWordDisplay() }}
                     </div>

                     <!-- A-Z keyboard buttons -->
                     <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:6px; max-width:360px">
                       @for (letter of ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']; track letter) {
                         <button [disabled]="hangmanGuesses().includes(letter)"
                                 (click)="guessHangmanLetter(letter)"
                                 style="width:36px; height:36px; border-radius:6px; border:1px solid var(--border); font-size:14px; font-weight:700; cursor:pointer; text-transform:uppercase"
                                 [style.background]="hangmanGuesses().includes(letter) ? '#E2E8F0' : '#FFF'"
                                 [style.color]="hangmanGuesses().includes(letter) ? '#94A3B8' : 'var(--text-primary)'">
                           {{ letter }}
                         </button>
                       }
                     </div>

                   </div>
                 }

                 @if (activeVocabGame()?.gameType === 'multiple_choice') {
                   <!-- MULTIPLE CHOICE GAME INTERFACE -->
                   <div style="display:flex; flex-direction:column; gap:16px; width:100%">
                     <div style="font-size:12px; color:var(--text-muted); text-align:center">Question {{ mcGameIdx() + 1 }} sur {{ activeVocabGame()?.words?.length }}</div>

                     <div style="background:var(--surface-2); padding:16px; border-radius:8px; border:1px solid var(--border-weak); text-align:center; width:100%">
                       <span style="font-size:10px; font-weight:700; color:#4F46E5; text-transform:uppercase">Définition / Traduction :</span>
                       <h3 style="font-size:18px; font-weight:800; margin:4px 0 0 0; color:var(--text-primary)">
                         {{ activeVocabGame()?.words?.[mcGameIdx()]?.translation }}
                       </h3>
                       @if (activeVocabGame()?.words?.[mcGameIdx()]?.definition) {
                         <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0 0; line-height:1.4">
                           {{ activeVocabGame()?.words?.[mcGameIdx()]?.definition }}
                         </p>
                       }
                     </div>

                     <!-- Choices Buttons -->
                     <div style="display:flex; flex-direction:column; gap:8px">
                       @for (opt of mcOptions(); track opt) {
                         <button (click)="selectMCOption(opt)"
                                 [disabled]="mcSelected() !== null"
                                 style="width:100%; padding:12px; border-radius:8px; border:1.5px solid var(--border); font-size:13px; font-weight:700; text-align:left; cursor:pointer"
                                 [style.background]="mcSelected() === opt ? (mcIsCorrect() ? '#ECFDF5' : '#FEF2F2') : (mcSelected() !== null && opt === activeVocabGame()?.words?.[mcGameIdx()]?.word ? '#ECFDF5' : '#FFF')"
                                 [style.border-color]="mcSelected() === opt ? (mcIsCorrect() ? '#10B981' : '#EF4444') : (mcSelected() !== null && opt === activeVocabGame()?.words?.[mcGameIdx()]?.word ? '#10B981' : 'var(--border)')"
                                 [style.color]="mcSelected() === opt ? (mcIsCorrect() ? '#065F46' : '#991B1B') : (mcSelected() !== null && opt === activeVocabGame()?.words?.[mcGameIdx()]?.word ? '#065F46' : 'var(--text-primary)')">
                           {{ opt }}
                         </button>
                       }
                     </div>

                   </div>
                 }
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

    .exercise-card {
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      margin: 0;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid var(--border-weak);
    }
    
    .exercise-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 20px -8px rgba(79, 70, 229, 0.12);
      border-color: #4F46E5;
    }
    
    .exercise-card.game-card:hover {
      box-shadow: 0 12px 20px -8px rgba(217, 119, 6, 0.15);
      border-color: #D97706;
    }
    
    .exercise-card.oral-card:hover {
      box-shadow: 0 12px 20px -8px rgba(13, 148, 136, 0.15);
      border-color: #0D9488;
    }

    .quiz-option-btn {
      width: 100%;
      border: 1px solid var(--border);
      background: var(--surface-1);
      padding: 12px 16px;
      border-radius: 8px;
      text-align: left;
      cursor: pointer;
      font-weight: 500;
      font-size: 13px;
      color: var(--text-primary);
      transition: all 0.2s ease-in-out;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .quiz-option-btn:hover {
      background: var(--surface-2);
      border-color: #4F46E5;
      transform: translateX(4px);
    }
    
    .quiz-option-btn.active {
      background: #EFF6FF;
      border-color: #4F46E5;
      color: #1E40AF;
      box-shadow: 0 4px 10px rgba(79, 70, 229, 0.08);
    }

    .vocab-match-card {
      border: 1px solid var(--border);
      background: var(--surface-1);
      color: var(--text-primary);
      padding: 14px;
      text-align: center;
      font-weight: 600;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 55px;
      margin: 0;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease-in-out;
    }
    
    .vocab-match-card:hover:not(.matched) {
      transform: translateY(-2px);
      border-color: #D97706;
      box-shadow: 0 4px 10px rgba(217, 119, 6, 0.08);
    }
    
    .vocab-match-card.selected {
      background: #FEF3C7;
      border-color: #D97706;
      color: #92400E;
      transform: translateY(-2px);
    }
    
    .vocab-match-card.matched {
      background: #DCFCE7;
      border-color: #86EFAC;
      color: #166534;
      opacity: 0.8;
      cursor: not-allowed;
    }
    
    .vocab-match-card.error {
      background: #FEE2E2;
      border-color: #FCA5A5;
      color: #991B1B;
      animation: shake 0.4s ease-in-out;
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }

    @keyframes bounce-streak {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
  `]
})
export class StudentExercisesComponent {
  private db = inject(DatabaseService);

  activeExercise = signal<'list' | 'quiz' | 'game' | 'listening'>('list');
  quizzes = signal<Quiz[]>([]);
  activeQuiz = signal<Quiz | null>(null);
  currentUser = signal<UserProfile | null>(null);
  
  // Listening Exercise States
  listeningText = signal<string>('');
  listeningAudioUrl = signal<string>('');
  listeningQuestions = signal<{ question: string; options: string[]; correct: number }[]>([]);
  currentListeningIdx = signal<number>(0);
  selectedListeningOption = signal<number | null>(null);
  listeningFinished = signal<boolean>(false);
  listeningScore = signal<number>(0);

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

  vocabGames = signal<VocabGame[]>([]);
  activeVocabGame = signal<VocabGame | null>(null);

  // Flashcards state
  currentCardIdx = signal<number>(0);
  isFlipped = signal<boolean>(false);

  // Memory state
  memoryFlippedIds = signal<number[]>([]);
  
  // Word Builder state
  scrambledLetters = signal<string[]>([]);
  selectedLetters = signal<string[]>([]);
  wordBuilderIdx = signal<number>(0);

  // Hangman state
  hangmanIdx = signal<number>(0);
  hangmanGuesses = signal<string[]>([]);
  hangmanLives = signal<number>(6);

  // Multiple Choice Game state
  mcGameIdx = signal<number>(0);
  mcOptions = signal<string[]>([]);
  mcSelected = signal<string | null>(null);
  mcIsCorrect = signal<boolean | null>(null);

  constructor() {
    this.db.observeQuizzes().subscribe(list => this.quizzes.set(list));
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
    this.db.observeVocabGames().subscribe(list => this.vocabGames.set(list));
  }

  getWeeklyTrackerDays() {
    const days = [
      { name: 'Mon', letter: 'M', completed: false },
      { name: 'Tue', letter: 'T', completed: false },
      { name: 'Wed', letter: 'W', completed: false },
      { name: 'Thu', letter: 'T', completed: false },
      { name: 'Fri', letter: 'F', completed: false },
      { name: 'Sat', letter: 'S', completed: false },
      { name: 'Sun', letter: 'S', completed: false }
    ];
    
    const streak = this.currentUser()?.streak || 0;
    const todayIndex = (new Date().getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    for (let i = 0; i < 7; i++) {
      if (i === todayIndex) {
        days[i].completed = true;
      } else if (i < todayIndex && todayIndex - i < streak) {
        days[i].completed = true;
      }
    }
    return days;
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

  playVocabGame(game: VocabGame) {
    this.activeVocabGame.set(game);
    this.activeExercise.set('game');
    this.gameFinished.set(false);
    this.matchesFound.set(0);
    this.selectedCard.set(null);
    
    // Reset all game states
    this.currentCardIdx.set(0);
    this.isFlipped.set(false);
    this.memoryFlippedIds.set([]);
    this.wordBuilderIdx.set(0);
    this.hangmanIdx.set(0);
    this.hangmanGuesses.set([]);
    this.hangmanLives.set(6);
    this.mcGameIdx.set(0);
    this.mcSelected.set(null);
    this.mcIsCorrect.set(null);

    if (game.gameType === 'matching' || game.gameType === 'memory') {
      this.setupGameCards(game);
    } else if (game.gameType === 'word_builder') {
      this.setupWordBuilder(game, 0);
    } else if (game.gameType === 'hangman') {
      this.setupHangman(game, 0);
    } else if (game.gameType === 'multiple_choice') {
      this.setupMCGame(game, 0);
    }
  }

  playDefaultVocabGame() {
    this.activeVocabGame.set(null);
    this.activeExercise.set('game');
    this.gameFinished.set(false);
    this.matchesFound.set(0);
    this.selectedCard.set(null);
    this.setupGameCards();
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

    // Track user answer
    if (activeLetter) {
      this.userAnswers.set({
        ...this.userAnswers(),
        [this.currentQuestionIdx()]: activeLetter
      });
    }

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

  // Helper methods for explanations
  getUserAnswer(questionIndex: number): string | null {
    return this.selectedOption(); // This will show the last selected option
  }

  getUserAnswerText(questionIndex: number): string {
    const quiz = this.activeQuiz();
    if (!quiz) return '';
    const userAnswer = this.userAnswers()[questionIndex];
    if (!userAnswer) return 'Aucune réponse';
    const idx = userAnswer.charCodeAt(0) - 65; // A=0, B=1, etc.
    return quiz.questions[questionIndex].options[idx] || userAnswer;
  }

  getCorrectAnswerText(question: any): string {
    const idx = question.correctOption.charCodeAt(0) - 65;
    return question.options[idx] || question.correctOption;
  }

  roundNumber(value: number): number {
    return Math.round(value);
  }

  // Track user answers for each question
  private userAnswers = signal<{ [key: number]: string }>({});

  // Listening Exercise Methods
  startListeningExercise() {
    this.activeExercise.set('listening');
    this.listeningFinished.set(false);
    this.currentListeningIdx.set(0);
    this.selectedListeningOption.set(null);
    this.listeningScore.set(0);
    
    // Sample listening exercise data
    this.listeningText.set('The cat sat on the mat. It was a sunny day and the cat was feeling very lazy. The cat decided to take a nap in the warm sunlight.');
    this.listeningAudioUrl.set(''); // Would be a real audio URL
    this.listeningQuestions.set([
      {
        question: 'Where did the cat sit?',
        options: ['On the chair', 'On the mat', 'On the table', 'On the bed'],
        correct: 1
      },
      {
        question: 'How was the weather?',
        options: ['Rainy', 'Cloudy', 'Sunny', 'Windy'],
        correct: 2
      },
      {
        question: 'What did the cat decide to do?',
        options: ['Play', 'Eat', 'Take a nap', 'Run'],
        correct: 2
      }
    ]);
  }

  playListeningText() {
    const text = this.listeningText();
    if (text && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  }

  prevListeningQuestion() {
    if (this.currentListeningIdx() > 0) {
      this.currentListeningIdx.update(i => i - 1);
      this.selectedListeningOption.set(null);
    }
  }

  nextListeningQuestion() {
    const selected = this.selectedListeningOption();
    const currentQ = this.listeningQuestions()[this.currentListeningIdx()];
    
    if (selected === currentQ.correct) {
      this.listeningScore.update(s => s + Math.round(100 / this.listeningQuestions().length));
    }

    if (this.currentListeningIdx() + 1 === this.listeningQuestions().length) {
      // Finished
      this.listeningFinished.set(true);
      const user = this.currentUser();
      if (user) {
        const xp = this.listeningScore() >= 60 ? 50 : 10;
        this.db.updateUserXP(user.id, xp, true);
      }
    } else {
      this.currentListeningIdx.update(i => i + 1);
      this.selectedListeningOption.set(null);
    }
  }

  // Match Game Card logic
  setupGameCards(game?: VocabGame) {
    const rawPairs = game ? game.words.map((w: any) => ({
      english: w.word,
      french: w.translation || w.definition
    })) : [
      { english: 'hypothesis', french: 'hypothèse' },
      { english: 'if', french: 'si' },
      { english: 'kitchen', french: 'cuisine' },
      { english: 'to come', french: 'venir' }
    ];

    const cards: MatchCard[] = [];
    rawPairs.forEach((p: any, idx: number) => {
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
    if (this.activeVocabGame()?.gameType === 'memory') {
      this.selectMemoryCard(card);
      return;
    }
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

          const totalPairs = this.gameCards().length / 2;
          if (this.matchesFound() === totalPairs) {
            this.gameFinished.set(true);
            const user = this.currentUser();
            if (user) {
              this.db.updateUserXP(user.id, 30, true);
            }
          }
        } else {
          card.selected = true;
          const c1 = list.find(c => c.id === activeSelected.id);
          const c2 = list.find(c => c.id === card.id);
          if (c1) c1.error = true;
          if (c2) c2.error = true;
          this.gameCards.set(list);
          
          setTimeout(() => {
            const listReset = [...this.gameCards()];
            const rc1 = listReset.find(c => c.id === activeSelected.id);
            const rc2 = listReset.find(c => c.id === card.id);
            if (rc1) { rc1.selected = false; rc1.error = false; }
            if (rc2) { rc2.selected = false; rc2.error = false; }
            this.selectedCard.set(null);
            this.gameCards.set(listReset);
          }, 600);
        }
      }
    }
  }

  // Multi-game helper methods
  selectMemoryCard(card: MatchCard) {
    if (card.matched || card.selected || this.memoryFlippedIds().length >= 2) return;

    // Flip card
    card.selected = true;
    const cardsList = [...this.gameCards()];
    this.gameCards.set(cardsList);
    this.memoryFlippedIds.update(ids => [...ids, card.id]);

    const flipped = this.memoryFlippedIds();
    if (flipped.length === 2) {
      const list = [...this.gameCards()];
      const first = list.find(c => c.id === flipped[0]);
      const second = list.find(c => c.id === flipped[1]);
      if (first && second) {
        if (first.matchId === second.matchId) {
          // Match!
          setTimeout(() => {
            first.matched = true;
            second.matched = true;
            first.selected = false;
            second.selected = false;
            this.memoryFlippedIds.set([]);
            this.gameCards.set(list);
            
            // Check if all matched
            const allMatched = this.gameCards().every(c => c.matched);
            if (allMatched) {
              this.gameFinished.set(true);
              this.db.updateUserXP(this.currentUser()?.id || '', 30, true);
            }
          }, 600);
        } else {
          // No match, flip back
          first.error = true;
          second.error = true;
          this.gameCards.set(list);
          setTimeout(() => {
            const listReset = [...this.gameCards()];
            const rf1 = listReset.find(c => c.id === flipped[0]);
            const rf2 = listReset.find(c => c.id === flipped[1]);
            if (rf1) { rf1.selected = false; rf1.error = false; }
            if (rf2) { rf2.selected = false; rf2.error = false; }
            this.memoryFlippedIds.set([]);
            this.gameCards.set(listReset);
          }, 1200);
        }
      }
    }
  }

  flipCard() {
    this.isFlipped.update(f => !f);
  }

  nextFlashcard() {
    const game = this.activeVocabGame();
    if (!game) return;
    if (this.currentCardIdx() + 1 === game.words.length) {
      this.gameFinished.set(true);
      this.db.updateUserXP(this.currentUser()?.id || '', 30, true);
    } else {
      this.currentCardIdx.update(idx => idx + 1);
      this.isFlipped.set(false);
    }
  }

  prevFlashcard() {
    if (this.currentCardIdx() > 0) {
      this.currentCardIdx.update(idx => idx - 1);
      this.isFlipped.set(false);
    }
  }

  setupWordBuilder(game: VocabGame, idx: number) {
    const word = game.words[idx];
    if (!word) return;

    // Scramble letters
    const letters = word.word.toLowerCase().split('').filter((c: string) => c !== ' ');
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    this.scrambledLetters.set(letters);
    this.selectedLetters.set([]);
  }

  clickScrambledLetter(char: string, sIdx: number) {
    this.selectedLetters.update(sel => [...sel, char]);
    this.scrambledLetters.update(scr => scr.filter((_, idx) => idx !== sIdx));

    const game = this.activeVocabGame();
    if (!game) return;
    const currentWordObj = game.words[this.wordBuilderIdx()];
    const spellStr = this.selectedLetters().join('');
    if (spellStr === currentWordObj.word.toLowerCase().replace(/\s/g, '')) {
      // Correct spelling!
      setTimeout(() => {
        if (this.wordBuilderIdx() + 1 === game.words.length) {
          this.gameFinished.set(true);
          this.db.updateUserXP(this.currentUser()?.id || '', 30, true);
        } else {
          this.wordBuilderIdx.update(i => i + 1);
          this.setupWordBuilder(game, this.wordBuilderIdx());
        }
      }, 800);
    }
  }

  clickSelectedLetter(char: string, selIdx: number) {
    this.selectedLetters.update(sel => sel.filter((_, idx) => idx !== selIdx));
    this.scrambledLetters.update(scr => [...scr, char]);
  }

  resetWordBuilder() {
    const game = this.activeVocabGame();
    if (game) this.setupWordBuilder(game, this.wordBuilderIdx());
  }

  setupHangman(game: VocabGame, idx: number) {
    this.hangmanGuesses.set([]);
    this.hangmanLives.set(6);
  }

  guessHangmanLetter(letter: string) {
    if (this.hangmanGuesses().includes(letter) || this.hangmanLives() <= 0) return;

    this.hangmanGuesses.update(guesses => [...guesses, letter]);

    const game = this.activeVocabGame();
    if (!game) return;
    const currentWord = game.words[this.hangmanIdx()].word.toLowerCase();
    
    if (!currentWord.includes(letter)) {
      this.hangmanLives.update(l => l - 1);
      if (this.hangmanLives() <= 0) {
        alert(`Perdu ! Le mot était : ${game.words[this.hangmanIdx()].word}`);
        this.setupHangman(game, this.hangmanIdx());
        return;
      }
    }

    const won = currentWord.split('').every((char: string) => 
      char === ' ' || this.hangmanGuesses().includes(char)
    );

    if (won) {
      setTimeout(() => {
        if (this.hangmanIdx() + 1 === game.words.length) {
          this.gameFinished.set(true);
          this.db.updateUserXP(this.currentUser()?.id || '', 30, true);
        } else {
          this.hangmanIdx.update(i => i + 1);
          this.setupHangman(game, this.hangmanIdx());
        }
      }, 800);
    }
  }

  getHangmanWordDisplay(): string {
    const game = this.activeVocabGame();
    if (!game) return '';
    const word = game.words[this.hangmanIdx()].word;
    return word.split('').map((char: string) => {
      if (char === ' ') return ' ';
      return this.hangmanGuesses().includes(char.toLowerCase()) ? char : '_';
    }).join(' ');
  }

  setupMCGame(game: VocabGame, idx: number) {
    const correctWord = game.words[idx].word;
    const allWords = game.words.map((w: any) => w.word).filter((w: string) => w !== correctWord);
    for (let i = allWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allWords[i], allWords[j]] = [allWords[j], allWords[i]];
    }
    const choices = [correctWord, ...allWords.slice(0, 3)];
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }

    this.mcOptions.set(choices);
    this.mcSelected.set(null);
    this.mcIsCorrect.set(null);
  }

  selectMCOption(opt: string) {
    if (this.mcSelected()) return;

    this.mcSelected.set(opt);
    const game = this.activeVocabGame();
    if (!game) return;
    const correctWord = game.words[this.mcGameIdx()].word;
    
    const correct = opt === correctWord;
    this.mcIsCorrect.set(correct);

    setTimeout(() => {
      if (this.mcGameIdx() + 1 === game.words.length) {
        this.gameFinished.set(true);
        this.db.updateUserXP(this.currentUser()?.id || '', 30, true);
      } else {
        this.mcGameIdx.update(i => i + 1);
        this.setupMCGame(game, this.mcGameIdx());
      }
    }, 1000);
  }

  getGameLabel(type: string): string {
    switch (type) {
      case 'matching': return 'Association';
      case 'memory': return 'Jeu de Mémoire';
      case 'flashcards': return 'Flashcards';
      case 'word_builder': return 'Reconstruction';
      case 'hangman': return 'Pendu';
      case 'multiple_choice': return 'Choix Multiple';
      default: return 'Jeu';
    }
  }

  getDiffLabel(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'Facile';
      case 'medium': return 'Moyen';
      case 'hard': return 'Difficile';
      default: return difficulty;
    }
  }
}
