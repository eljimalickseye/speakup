import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Submission, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-homework',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="padding:0">
      <!-- Top Filters Row -->
      <div class="filter-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid var(--border-weak); padding-bottom:12px">
        <div class="tab-row" style="margin-bottom:0">
          <button class="tab" [class.active]="filterTab() === 'pending'" (click)="filterTab.set('pending')">
            Pending 
            <span class="count-badge" [class.active]="filterTab() === 'pending'">{{ pendingSubmissions().length }}</span>
          </button>
          <button class="tab" [class.active]="filterTab() === 'graded'" (click)="filterTab.set('graded')">
            Graded
          </button>
          <button class="tab" [class.active]="filterTab() === 'all'" (click)="filterTab.set('all')">
            All submissions
          </button>
        </div>
      </div>

      <!-- Workspace: Split Layout on Desktop -->
      <div class="homework-workspace">
        <!-- Left Pane: Submissions List -->
        <div class="submissions-list-pane">
          <div class="submissions-scroll-wrapper">
            @for (sub of filteredSubmissions(); track sub.id) {
              <div 
                class="sub-item-card" 
                [class.selected]="selectedSub()?.id === sub.id" 
                [class.graded-bg]="sub.graded"
                (click)="selectSubmission(sub)">
                
                <div style="display:flex; align-items:flex-start; gap:12px; width:100%">
                  <!-- Submission Icon -->
                  <div class="sub-icon-box" [class.audio]="sub.type === 'audio'" [class.text]="sub.type === 'text'" [class.video]="sub.type === 'video'">
                    @if (sub.type === 'audio') {
                      <i class="ti ti-microphone" aria-hidden="true"></i>
                    } @else if (sub.type === 'video') {
                      <i class="ti ti-video" aria-hidden="true" style="font-size:16px; color:#7E22CE"></i>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#185abd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:16px; height:16px; vertical-align: middle;">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#e2ecf7" stroke="#185abd"/>
                        <polyline points="14 2 14 8 20 8" stroke="#185abd"/>
                        <path d="M8 13l1.5 4 1.5-4 1.5 4 1.5-4" stroke="#185abd" stroke-width="2" fill="none"/>
                      </svg>
                    }
                  </div>

                  <div style="flex:1; min-width:0">
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px">
                      <span class="student-name">{{ sub.studentName }}</span>
                      @if (sub.graded) {
                        <span class="badge-status graded">Graded</span>
                      } @else {
                        <span class="badge-status pending">Pending</span>
                      }
                    </div>

                    <div class="lesson-title">{{ sub.lessonTitle }}</div>
                    
                    <div class="meta-row">
                      <span>{{ sub.submittedAt | date:'mediumDate' }}</span>
                      <span class="bullet">•</span>
                      <span>Format: {{ sub.type | uppercase }}</span>
                    </div>

                    <div class="content-preview">
                      @if (sub.type === 'text') {
                        "{{ sub.content | slice:0:80 }}{{ sub.content.length > 80 ? '...' : '' }}"
                      } @else if (sub.type === 'video') {
                        🎥 Video recording submission
                      } @else {
                        🎙️ Audio speech submission
                      }
                    </div>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="empty-list-state">
                <i class="ti ti-folders" aria-hidden="true" style="font-size:40px; color:var(--text-muted); margin-bottom:12px"></i>
                <p>No submissions found in this category.</p>
              </div>
            }
          </div>
        </div>

        <!-- Right Pane: Detailed Grading & Review -->
        <div class="grading-panel-pane">
          @if (selectedSub(); as sub) {
            <div class="card grading-form-card">
              <div class="grading-form-header">
                <div>
                  <h3 class="grading-student-title">{{ sub.studentName }}</h3>
                  <div style="font-size:11px; color:var(--text-muted); margin-top:2px">
                    {{ sub.lessonTitle }} · Submitted {{ sub.submittedAt | date:'medium' }}
                  </div>
                </div>
                <button class="btn-close-sub" (click)="selectedSub.set(null)">
                  <i class="ti ti-x" aria-hidden="true"></i>
                </button>
              </div>

              <div class="answer-container-box">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                  <div class="box-label">Student Submission:</div>
                  @if (sub.type === 'audio') {
                    <button class="btn-s" style="font-size:10px; padding:4px 10px; color:#EF4444; border-color:#EF4444" (click)="deleteAudioSubmission(sub)">
                      <i class="ti ti-trash" style="font-size:10px"></i> Delete Audio
                    </button>
                  }
                </div>
                
                @if (sub.type === 'text') {
                  <div class="text-submission-content">
                    "{{ sub.content }}"
                  </div>
                } @else if (sub.type === 'video') {
                  <div class="video-submission-content" style="background:#0F172A; border-radius:8px; padding:12px; display:flex; flex-direction:column; align-items:center; gap:8px">
                    <video style="width:100%; max-width:400px; border-radius:6px; background:#000" controls [src]="getVideoSource(sub.content)"></video>
                    <div style="font-size:11px; color:#94A3B8; text-align:center"><i class="ti ti-video"></i> Video Submission Playback</div>
                  </div>
                } @else {
                  <div class="audio-submission-content">
                    <div style="display:flex; align-items:center; gap:12px">
                      <div class="audio-pulse-avatar">
                        <i class="ti ti-volume" aria-hidden="true"></i>
                        <span class="pulse-ring red"></span>
                        <span class="pulse-ring red-delayed"></span>
                      </div>
                      <div style="flex:1">
                        <audio [src]="sub.content" controls style="width:100%; height:36px; border-radius:30px"></audio>
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Grading Form Inputs -->
              <div class="grading-inputs-section">
                <!-- Toggle Rubric Helper -->
                <div style="margin-bottom: 16px; border-bottom: 1px solid var(--border-weak); padding-bottom: 12px">
                  <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-weight:700; font-size:12px; color:#4F46E5">
                    <input type="checkbox" [checked]="useRubric()" (change)="useRubric.set(!useRubric())" />
                    <span>Use Rubric Evaluation Helper</span>
                  </label>
                  
                  @if (useRubric()) {
                    <div style="background:var(--surface-2); border:1px solid var(--border-weak); border-radius:8px; padding:12px; margin-top:8px; display:flex; flex-direction:column; gap:10px">
                      <!-- Criteria 1: Pronunciation -->
                      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap">
                        <span style="font-size:11.5px; font-weight:600; color:var(--text-primary)">Pronunciation & Articulation</span>
                        <div style="display:flex; gap:4px">
                          @for (star of [1,2,3,4,5]; track star) {
                            <button (click)="updateRubricRating('pron', star)" style="background:none; border:none; cursor:pointer; padding:2px; font-size:16px; color:#94A3B8; transition:color 0.15s" [style.color]="pronunciationRating() >= star ? '#F59E0B' : '#94A3B8'">
                              ★
                            </button>
                          }
                        </div>
                      </div>

                      <!-- Criteria 2: Grammar -->
                      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap">
                        <span style="font-size:11.5px; font-weight:600; color:var(--text-primary)">Grammar & Sentence Structure</span>
                        <div style="display:flex; gap:4px">
                          @for (star of [1,2,3,4,5]; track star) {
                            <button (click)="updateRubricRating('gram', star)" style="background:none; border:none; cursor:pointer; padding:2px; font-size:16px; color:#94A3B8; transition:color 0.15s" [style.color]="grammarRating() >= star ? '#F59E0B' : '#94A3B8'">
                              ★
                            </button>
                          }
                        </div>
                      </div>

                      <!-- Criteria 3: Vocabulary -->
                      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap">
                        <span style="font-size:11.5px; font-weight:600; color:var(--text-primary)">Vocabulary & Fluency</span>
                        <div style="display:flex; gap:4px">
                          @for (star of [1,2,3,4,5]; track star) {
                            <button (click)="updateRubricRating('vocab', star)" style="background:none; border:none; cursor:pointer; padding:2px; font-size:16px; color:#94A3B8; transition:color 0.15s" [style.color]="vocabularyRating() >= star ? '#F59E0B' : '#94A3B8'">
                              ★
                            </button>
                          }
                        </div>
                      </div>

                      <button class="btn-s" (click)="insertRubricBreakdown()" [disabled]="pronunciationRating() === 0 && grammarRating() === 0 && vocabularyRating() === 0" style="padding:4px 8px; font-size:10px; margin-top:4px; align-self:flex-start">
                        Insert Ratings report into Feedback
                      </button>
                    </div>
                  }
                </div>

                <div class="input-grid">
                  <div class="input-row">
                    <label for="gradeScoreSelect" class="form-lbl">Award Grade</label>
                    <select id="gradeScoreSelect" [(ngModel)]="gradeScore" class="form-select">
                      <option value="A — Excellent">A — Excellent</option>
                      <option value="B — Good">B — Good</option>
                      <option value="C — Satisfactory">C — Satisfactory</option>
                      <option value="D — Needs improvement">D — Needs improvement</option>
                    </select>
                  </div>

                  <div class="input-row">
                    <label for="gradeXpInput" class="form-lbl">XP Points Reward</label>
                    <div style="position:relative; display:flex; align-items:center">
                      <input id="gradeXpInput" type="number" [(ngModel)]="gradeXp" class="form-input" style="padding-right:45px" />
                      <span style="position:absolute; right:12px; font-weight:700; font-size:11px; color:#4F46E5">XP</span>
                    </div>
                  </div>
                </div>

                <div class="input-row">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; flex-wrap:wrap; gap:8px">
                    <label for="gradeFeedbackText" class="form-lbl" style="margin-bottom:0">Teacher Feedback</label>
                    
                    <!-- Quick feedback templates -->
                    <div style="display:flex; gap:6px; align-items:center; flex-wrap:wrap">
                      <span style="font-size:9.5px; font-weight:700; color:var(--text-muted)">QUICK TEMPLATES:</span>
                      <button (click)="applyFeedbackTemplate('excellent')" class="badge" style="background:#ECFDF5; border:1px solid #A7F3D0; color:#047857; cursor:pointer; font-size:9px" title="Excellent template">🌟 Excellent</button>
                      <button (click)="applyFeedbackTemplate('grammar')" class="badge" style="background:#EFF6FF; border:1px solid #BFDBFE; color:#1D4ED8; cursor:pointer; font-size:9px" title="Grammar focus template">📝 Grammar</button>
                      <button (click)="applyFeedbackTemplate('pron')" class="badge" style="background:#F0FDFA; border:1px solid #99F6E4; color:#0F766E; cursor:pointer; font-size:9px" title="Pronunciation template">🗣️ Pron</button>
                      <button (click)="applyFeedbackTemplate('incomplete')" class="badge" style="background:#FEF3C7; border:1px solid #FDE68A; color:#92400E; cursor:pointer; font-size:9px" title="Incomplete template">⚠️ Incomplete</button>
                    </div>
                  </div>
                  <textarea 
                    id="gradeFeedbackText" 
                    [(ngModel)]="gradeFeedback" 
                    rows="4" 
                    class="form-textarea" 
                    placeholder="Write constructive guidance to help the student improve..."></textarea>
                </div>

                <!-- Action buttons -->
                <div style="display:flex; gap:12px; margin-top:20px; border-top:1px solid var(--border-weak); padding-top:16px">
                  <button class="btn-p" (click)="submitGrade()" style="flex:1; height:42px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:6px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>{{ sub.graded ? 'Update Grade' : 'Submit Grade & Reward XP' }}</span>
                  </button>
                  <button class="btn-s" (click)="selectedSub.set(null)" style="height:42px; padding:0 20px">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          } @else {
            <div class="card empty-grading-panel">
              <i class="ti ti-file-check" aria-hidden="true" style="font-size:48px; color:var(--text-muted); margin-bottom:14px"></i>
              <h4 style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:6px">No submission selected</h4>
              <p style="font-size:12px; color:var(--text-secondary); max-width:280px; margin:0 auto">
                Select a homework submission from the left pane to review, grade, listen to voice recordings, and provide feedback.
              </p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .homework-workspace {
      display: flex;
      gap: 20px;
      height: calc(100vh - 180px);
      min-height: 500px;
    }

    .submissions-list-pane {
      flex: 1.2;
      max-width: 450px;
      display: flex;
      flex-direction: column;
      border-right: 1px solid var(--border-weak);
      padding-right: 16px;
      overflow: hidden;
    }

    .submissions-scroll-wrapper {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-right: 4px;
    }

    .grading-panel-pane {
      flex: 1.8;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .sub-item-card {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 14px;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
    }

    .sub-item-card:hover {
      transform: translateY(-2px);
      border-color: #4F46E5;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.08);
    }

    .sub-item-card.selected {
      border-color: #4F46E5;
      background: #EEF2FF;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.08);
    }

    .sub-item-card.graded-bg {
      opacity: 0.85;
    }

    .sub-icon-box {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
    }

    .sub-icon-box.audio {
      background: #FEE2E2;
      color: #EF4444;
    }

    .sub-icon-box.text {
      background: #E0E7FF;
      color: #4F46E5;
    }

    .student-name {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .lesson-title {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 4px;
      font-weight: 500;
    }

    .meta-row {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 10px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .bullet {
      font-size: 8px;
    }

    .content-preview {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 8px;
      font-style: italic;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .badge-status {
      font-size: 9px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 20px;
      text-transform: uppercase;
    }

    .badge-status.graded {
      background: #D1FAE5;
      color: #065F46;
    }

    .badge-status.pending {
      background: #FEF3C7;
      color: #92400E;
    }

    .count-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-3);
      color: var(--text-secondary);
      font-size: 10px;
      font-weight: 700;
      min-width: 18px;
      height: 18px;
      border-radius: 10px;
      padding: 0 4px;
      margin-left: 6px;
    }

    .count-badge.active {
      background: #4F46E5;
      color: #FFF;
    }

    .grading-form-card {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
      border: 1px solid var(--border);
      height: 100%;
      overflow-y: auto;
    }

    .grading-form-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--border-weak);
      padding-bottom: 12px;
    }

    .grading-student-title {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .btn-close-sub {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 18px;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s;
    }

    .btn-close-sub:hover {
      background: var(--surface-2);
      color: var(--text-primary);
    }

    .answer-container-box {
      background: var(--surface-2);
      border-radius: var(--radius);
      padding: 14px;
      border-left: 4px solid #4F46E5;
    }

    .box-label {
      font-size: 10px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      margin-bottom: 8px;
      letter-spacing: 0.05em;
    }

    .text-submission-content {
      font-size: 13px;
      line-height: 1.5;
      color: var(--text-primary);
      font-style: italic;
    }

    .audio-submission-content {
      padding: 4px 0;
    }

    .audio-pulse-avatar {
      position: relative;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #EF4444;
      color: #FFF;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
    }

    .pulse-ring {
      position: absolute;
      border: 2px solid #EF4444;
      border-radius: 50%;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      animation: pulse-ring-anim 2s cubic-bezier(0.215, 0.610, 0.355, 1) infinite;
    }

    .pulse-ring.red-delayed {
      animation-delay: 0.5s;
    }

    @keyframes pulse-ring-anim {
      0% {
        transform: scale(0.95);
        opacity: 0.8;
      }
      50% {
        opacity: 0.4;
      }
      100% {
        transform: scale(1.3);
        opacity: 0;
      }
    }

    .form-lbl {
      display: block;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: 6px;
    }

    .form-select, .form-input, .form-textarea {
      width: 100%;
      background: #FFF;
      border: 1px solid var(--border);
      padding: 8px 12px;
      border-radius: var(--radius);
      font-size: 12px;
      transition: border-color 0.2s;
    }

    .form-select:focus, .form-input:focus, .form-textarea:focus {
      outline: none;
      border-color: #4F46E5;
    }

    .empty-grading-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      height: 100%;
      border: 1px dashed var(--border);
      background: var(--surface-1);
      padding: 30px;
    }

    .empty-list-state {
      text-align: center;
      padding: 40px 20px;
      font-size: 12px;
      color: var(--text-secondary);
    }

    /* Responsive */
    @media (max-width: 800px) {
      .homework-workspace {
        flex-direction: column;
        height: auto;
      }

      .submissions-list-pane {
        max-width: 100%;
        border-right: none;
        padding-right: 0;
        border-bottom: 1px solid var(--border-weak);
        padding-bottom: 16px;
      }
    }
  `]
})
export class TeacherHomeworkComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  submissions = signal<Submission[]>([]);
  pendingSubmissions = signal<Submission[]>([]);
  selectedSub = signal<Submission | null>(null);
  usersList = signal<UserProfile[]>([]);

  // Filtering state
  filterTab = signal<'all' | 'pending' | 'graded'>('pending');

  // Computed filter submissions
  filteredSubmissions = computed(() => {
    const list = this.submissions();
    const filter = this.filterTab();
    if (filter === 'pending') {
      return list.filter(s => !s.graded);
    } else if (filter === 'graded') {
      return list.filter(s => s.graded);
    }
    return list;
  });

  // Grading states
  gradeScore = 'B — Good';
  gradeXp = 50;
  gradeFeedback = '';

  // Rubric Rating states
  useRubric = signal<boolean>(false);
  pronunciationRating = signal<number>(0);
  grammarRating = signal<number>(0);
  vocabularyRating = signal<number>(0);


  constructor() {
    this.db.observeSubmissions().subscribe(list => {
      this.submissions.set(list);
      this.pendingSubmissions.set(list.filter(s => !s.graded));
      
      // Update selected reference if list changes
      const active = this.selectedSub();
      if (active) {
        const fresh = list.find(s => s.id === active.id);
        if (fresh) this.selectedSub.set(fresh);
      }
    });

    this.db.observeUsers().subscribe(list => {
      this.usersList.set(list);
    });
  }

  selectSubmission(sub: Submission) {
    this.selectedSub.set(sub);
    this.gradeScore = sub.score || 'B — Good';
    this.gradeXp = sub.xpReward || 50;
    this.gradeFeedback = sub.feedback || 'Good effort! Pay close attention to English grammar and verb tenses.';
    
    // Reset rubric helper
    this.useRubric.set(false);
    this.pronunciationRating.set(0);
    this.grammarRating.set(0);
    this.vocabularyRating.set(0);
  }

  updateRubricRating(category: 'pron' | 'gram' | 'vocab', value: number) {
    if (category === 'pron') this.pronunciationRating.set(value);
    if (category === 'gram') this.grammarRating.set(value);
    if (category === 'vocab') this.vocabularyRating.set(value);

    // Calculate recommended grade and XP if at least one rating is set
    const p = this.pronunciationRating();
    const g = this.grammarRating();
    const v = this.vocabularyRating();
    
    let count = 0;
    let sum = 0;
    if (p > 0) { sum += p; count++; }
    if (g > 0) { sum += g; count++; }
    if (v > 0) { sum += v; count++; }

    if (count > 0) {
      const avg = sum / count;
      // Recommend Grade
      if (avg >= 4.5) this.gradeScore = 'A — Excellent';
      else if (avg >= 3.5) this.gradeScore = 'B — Good';
      else if (avg >= 2.5) this.gradeScore = 'C — Satisfactory';
      else this.gradeScore = 'D — Needs improvement';

      // Recommend XP: avg * 20 (capped at 100)
      this.gradeXp = Math.min(100, Math.round(avg * 20));
    }
  }

  insertRubricBreakdown() {
    const p = this.pronunciationRating();
    const g = this.grammarRating();
    const v = this.vocabularyRating();

    const breakdown = `[Evaluation Criteria Rating]:
- Pronunciation & Articulation: ${p > 0 ? p + '/5 ⭐' : 'N/A'}
- Grammar & Sentence Structure: ${g > 0 ? g + '/5 ⭐' : 'N/A'}
- Vocabulary & Fluency: ${v > 0 ? v + '/5 ⭐' : 'N/A'}

`;
    // Prepend to feedback
    this.gradeFeedback = breakdown + this.gradeFeedback;
  }

  applyFeedbackTemplate(templateCode: string) {
    let text = '';
    if (templateCode === 'excellent') {
      text = "Excellent pronunciation and fluent sentence structure! Keep up the great work.";
    } else if (templateCode === 'grammar') {
      text = "Good effort! Try to review verb tenses and singular/plural subject agreements.";
    } else if (templateCode === 'pron') {
      text = "Very clear articulation, but try to speak a bit more slowly to improve your flow and rhythm.";
    } else if (templateCode === 'incomplete') {
      text = "Please make sure to address all parts of the homework prompt in your submission.";
    }

    if (this.gradeFeedback) {
      this.gradeFeedback += '\n\n' + text;
    } else {
      this.gradeFeedback = text;
    }
  }


  getVideoSource(content: string): string {
    if (content && (content.startsWith('http') || content.startsWith('data:video'))) {
      return content;
    }
    return 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-39824-large.mp4';
  }

  getLocalHomeworkFeedback(sub: Submission) {
    let feedbackText = '';
    let grade = 'B — Good';
    let xp = 30;

    if (sub.type === 'text') {
      const wordCount = sub.content.split(/\s+/).filter(w => w.length > 0).length;
      const textLower = sub.content.toLowerCase();

      if (wordCount < 10) {
        grade = 'D — Needs improvement';
        xp = 10;
        feedbackText = `Great effort, but the answer is too short (${wordCount} words). Try to expand your thoughts with examples. For example, explain *why* or *how* you do these activities. Check your spelling and sentence capitalizations.`;
      } else if (textLower.includes('because') || textLower.includes('however') || textLower.includes('therefore')) {
        grade = 'A — Excellent';
        xp = 50;
        feedbackText = `Outstanding response! You have used advanced English connector words correctly. The sentence structure is solid, vocabulary is varied, and flow is natural. Keep up this high standard!`;
      } else {
        grade = 'B — Good';
        xp = 30;
        feedbackText = `Good vocabulary and clear sentence structure. To reach the next level, try using transition words like "First", "Secondly", or "Moreover" to link your ideas together smoothly. Correct any minor syntax spacing errors.`;
      }
    } else {
      grade = 'B — Good';
      xp = 35;
      feedbackText = `Oral Speech Feedback:\n- Pronunciation: Good clarity and natural word stress. Pronounce word endings (-ed, -s) more clearly.\n- Fluency: Natural pacing. Try to reduce hesitation pauses between sentences.\n- Grammar: Correct subject-verb agreements. Nice job!`;
    }

    return { feedback: feedbackText, grade, xp };
  }

  submitGrade() {
    const sub = this.selectedSub();
    if (!sub) return;

    this.db.gradeSubmission(sub.id, this.gradeScore, this.gradeFeedback, this.gradeXp);
    this.dialogService.alert('Success', `Submission graded successfully! ${this.gradeXp} XP awarded to student.`, 'success');
    
    // Automatically close the panel if it has been graded successfully
    this.selectedSub.set(null);
  }

  deleteAudioSubmission(sub: Submission) {
    if (!confirm(`Are you sure you want to delete this audio submission from ${sub.studentName}? This action cannot be undone.`)) {
      return;
    }

    // Delete the submission from the database
    this.db.deleteSubmission(sub.id);
    
    // Clear the selected submission if it was the one deleted
    if (this.selectedSub()?.id === sub.id) {
      this.selectedSub.set(null);
    }

    this.dialogService.alert('Deleted', 'Audio submission has been deleted successfully.', 'success');
  }
}
