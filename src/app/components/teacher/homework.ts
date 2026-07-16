import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Submission, UserProfile, Quiz, Lesson, Exercise } from '../../services/database.service';
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
        <!-- Left Pane: Submissions List (Grouped by Student Folders) -->
        <div class="submissions-list-pane">
          <div class="submissions-scroll-wrapper">
            @for (group of groupedSubmissions(); track group.studentId) {
              <!-- Student Folder Header -->
              <div 
                class="student-folder-card"
                (click)="toggleStudentFolder(group.studentId)">
                
                <div style="display:flex; align-items:center; gap:10px">
                  <!-- Folder Icon -->
                  <div style="width:32px; height:32px; border-radius:8px; background:#EEF2FF; display:flex; align-items:center; justify-content:center; color:#4F46E5">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <div>
                    <div style="font-size:13px; font-weight:800; color:#1E293B">{{ group.studentName }}</div>
                    <div style="font-size:10px; color:#64748B; margin-top:1px">
                      {{ group.submissions.length }} {{ group.submissions.length > 1 ? 'exercices' : 'exercice' }}
                    </div>
                  </div>
                </div>

                <div style="display:flex; align-items:center; gap:8px">
                  <!-- Chevron Icon -->
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                       [style.transform]="expandedStudentIds().has(group.studentId) ? 'rotate(90deg)' : 'none'"
                       style="color:#64748B; transition:transform 0.2s">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </div>

              <!-- Student Folder Content (indented list of exercises) -->
              @if (expandedStudentIds().has(group.studentId)) {
                <div style="margin-left:14px; border-left:2px solid #E2E8F0; padding-left:12px; display:flex; flex-direction:column; gap:8px; margin-bottom:14px">
                  @for (sub of group.submissions; track sub.id) {
                    <div 
                      class="sub-item-card" 
                      [class.selected]="selectedSub()?.id === sub.id" 
                      [class.graded-bg]="sub.graded"
                      (click)="selectSubmission(sub)"
                      style="margin:0; padding:10px 12px; border-radius:8px">
                      
                      <div style="display:flex; align-items:flex-start; gap:10px; width:100%">
                        <!-- Submission Format Icon -->
                        <div class="sub-icon-box" [class.audio]="sub.type === 'audio'" [class.text]="sub.type === 'text'" [class.video]="sub.type === 'video'" style="width:28px; height:28px; border-radius:6px">
                          @if (sub.type === 'audio') {
                            <i class="ap-icon ti ti-microphone" aria-hidden="true" style="font-size:12px"></i>
                          } @else if (sub.type === 'video') {
                            <i class="ap-icon ti ti-video" aria-hidden="true" style="font-size:12px; color:#7E22CE"></i>
                          } @else {
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#185abd" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#e2ecf7" stroke="#185abd"/>
                              <polyline points="14 2 14 8 20 8" stroke="#185abd"/>
                            </svg>
                          }
                        </div>

                        <div style="flex:1; min-width:0">
                          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px">
                            <span class="lesson-title" style="font-size:12px; font-weight:700; margin:0">{{ sub.lessonTitle }}</span>
                            @if (sub.graded) {
                              <span class="badge-status graded" style="font-size:8px; padding:1px 4px">Graded</span>
                            } @else {
                              <span class="badge-status pending" style="font-size:8px; padding:1px 4px">Pending</span>
                            }
                          </div>
                          
                          <div class="meta-row" style="margin-top:2px; font-size:10px">
                            <span>{{ sub.submittedAt | date:'mediumDate' }}</span>
                            <span class="bullet" style="margin:0 3px">•</span>
                            <span>{{ sub.type | uppercase }}</span>
                          </div>

                          <div class="content-preview" style="font-size:10.5px; margin-top:4px">
                            @if (sub.type === 'text') {
                              @if (isMultipart(sub.content)) {
                                "{{ getMultipartPreview(sub.content) | slice:0:60 }}{{ getMultipartPreview(sub.content).length > 60 ? '...' : '' }}"
                              } @else {
                                "{{ sub.content | slice:0:60 }}{{ sub.content.length > 60 ? '...' : '' }}"
                              }
                            } @else if (sub.type === 'video') {
                              🎥 Video recording
                            } @else {
                              🎙️ Audio recording
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
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
                <div style="display:flex; align-items:center; gap:8px">
                  <button class="btn-s" style="font-size:10px; padding:4px 8px; color:#EF4444; border-color:#EF4444; background:transparent; display:flex; align-items:center; gap:4px; font-weight:700" (click)="deleteSubmission(sub)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    Supprimer
                  </button>
                  <button class="btn-close-sub" (click)="selectedSub.set(null)">
                    <i class="ti ti-x" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
              <!-- Associated Task Details (Consigne) -->
              @if (associatedTask(); as task) {
                <div class="task-prompt-details-box" style="background:var(--surface-2); border:1px solid var(--border-weak); border-radius:8px; padding:16px; margin-bottom:16px">
                  <div style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px; border-bottom:1px solid var(--border-weak); padding-bottom:6px">
                    📖 Informations sur l'exercice d'origine :
                  </div>
                  <div style="font-size:13px; color:var(--text-primary); line-height:1.6">
                    @if (task.type === 'exercise') {
                      <div style="font-weight:700; margin-bottom:4px">
                        Exercice : <span style="color:#4F46E5;">{{ task.data.title }}</span> (<span style="text-transform:capitalize; color:var(--text-secondary)">{{ task.data.type }}</span>)
                      </div>
                      <div style="margin-top:6px;">
                        <strong>Sujet / Consigne :</strong>
                        <div style="margin-top:4px; padding:10px; background:white; border:1px solid var(--border-weak); border-radius:6px; font-size:12.5px; white-space:pre-wrap" [innerHTML]="getTaskSubject(task)"></div>
                      </div>
                      @if (getTaskYoutubeUrl(task)) {
                        <div style="margin-top:8px; font-size:11.5px; color:#4F46E5; display:inline-flex; align-items:center; gap:4px">
                          <i class="ti ti-brand-youtube" style="font-size:14px"></i>
                          Lien Vidéo : <a [href]="getTaskYoutubeUrl(task)" target="_blank" style="color:#4F46E5; text-decoration:underline; font-weight:700">{{ getTaskYoutubeUrl(task) }}</a>
                        </div>
                      }
                    } @else if (task.type === 'lesson') {
                      <div style="font-weight:700; margin-bottom:6px">
                        Leçon : <span style="color:#4F46E5;">{{ task.data.title }}</span> (<span style="color:var(--text-secondary)">{{ task.data.type }}</span>)
                      </div>
                      <div style="margin-top:6px;">
                        <strong>Devoir demandé :</strong>
                        <div style="margin-top:4px; padding:10px; background:white; border:1px solid var(--border-weak); border-radius:6px; font-size:12.5px; white-space:pre-wrap" [innerHTML]="getLessonHomework(task) || '(Aucune consigne spécifique)'"></div>
                      </div>
                      
                      <!-- Collapsible Lesson Content & Course notes so teacher can refer to the lesson text/exercises -->
                      <details style="margin-top:12px; border-top:1px dashed var(--border-weak); padding-top:10px">
                        <summary style="font-size:11.5px; font-weight:800; color:#4F46E5; cursor:pointer; user-select:none; display:inline-flex; align-items:center; gap:4px">
                          📖 {{ t('Afficher les Notes de Cours / Exercices intégrés', 'View Lesson Notes & Embedded Exercises') }}
                        </summary>
                        <div style="margin-top:10px; padding:14px; background:white; border:1px solid var(--border-weak); border-radius:8px; font-size:13px; line-height:1.7; max-height:220px; overflow-y:auto; color:var(--text-secondary)" [innerHTML]="getLessonContent(task)"></div>
                      </details>
                    } @else if (task.type === 'quiz') {
                      <div style="font-weight:700; margin-bottom:4px">
                        Quiz : <span style="color:#4F46E5;">{{ task.data.title }}</span>
                      </div>
                      <div style="font-size:12px; color:var(--text-secondary); margin-top:4px">
                        Nombre de questions : <strong>{{ getQuizQuestionsCount(task) }}</strong>
                      </div>
                    }
                  </div>
                </div>
              }

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
                  @if (parsedQuizResults(); as quizRes) {
                    <!-- Detailed Vertical Quiz evaluation table (Green / Red) -->
                    <div class="quiz-evaluation-results" style="margin-bottom:14px">
                      <div style="background:#EEF2FF; border:1px solid #C7D2FE; border-radius:8px; padding:12px; margin-bottom:12px">
                        <div style="font-size:12.5px; font-weight:800; color:#3730A3">Évaluation Automatique du Quiz :</div>
                        <div style="font-size:14px; font-weight:800; color:#4F46E5; margin-top:4px">
                          Taux de réussite : {{ quizRes.score }} ({{ quizRes.correctText }} correctes)
                        </div>
                      </div>

                      <div style="display:flex; flex-direction:column; gap:12px">
                        @for (q of quizRes.questions; track $index) {
                          <div style="border:1.5px solid var(--border-weak); border-radius:8px; padding:12px; background:#FFF"
                               [style.border-left]="q.isCorrect ? '4px solid #10B981' : '4px solid #EF4444'">
                            
                            <!-- Question Title -->
                            <div style="font-size:13px; font-weight:700; color:var(--text-primary)">
                              {{ $index + 1 }}. {{ q.questionText }}
                            </div>
                            
                            <!-- Comparison grid -->
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:8px; font-size:11.5px">
                              <!-- Student Answer -->
                              <div style="border-radius:6px; padding:6px 10px"
                                   [style.background]="q.isCorrect ? '#ECFDF5' : '#FEF2F2'"
                                   [style.color]="q.isCorrect ? '#065F46' : '#991B1B'">
                                <strong>Réponse de l'élève :</strong><br/>
                                {{ q.studentAnswer }}
                              </div>
                              
                              <!-- Correct Answer -->
                              <div style="background:#F3F4F6; border-radius:6px; padding:6px 10px; color:#374151">
                                <strong>Réponse attendue :</strong><br/>
                                {{ q.correctAnswer }}
                              </div>
                            </div>

                            <!-- Status Icon -->
                            <div style="margin-top:6px; font-size:11px; font-weight:800; display:flex; align-items:center; gap:4px"
                                 [style.color]="q.isCorrect ? '#059669' : '#DC2626'">
                              @if (q.isCorrect) {
                                <span>✅ Correct (+XP)</span>
                              } @else {
                                <span>❌ Incorrect</span>
                              }
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  } @else {
                    <div class="interactive-highlight-editor" style="background:#FFF; border:1px solid #CBD5E1; border-radius:8px; padding:16px; margin-bottom:14px; box-shadow:inset 0 1px 3px rgba(0,0,0,0.05)">
                      <div style="font-size:11px; font-weight:700; color:#64748B; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px">
                        <span>Correction interactive (Cliquez sur un mot pour le corriger/orienter) :</span>
                        <button class="btn-s" style="font-size:10.5px; padding:4px 10px; border-color:#4F46E5; color:#4F46E5; background:#EEF2FF; cursor:pointer" (click)="autoFormatStudentText()">
                          💡 Aérer / Formater le texte
                        </button>
                      </div>
                      
                      <div style="font-size:14.5px; line-height:2.0; color:#1E293B; user-select:none; word-wrap:break-word">
                        @for (w of words(); track $index) {
                          @if (w.isNewline) {
                            <br/>
                          } @else if (w.text.trim().length === 0) {
                            <span>{{ w.text }}</span>
                          } @else {
                            <span 
                              (click)="toggleWordState($index, $event)"
                              [style.background]="w.state === 'correct' ? '#D1FAE5' : (w.state === 'error' ? '#FEE2E2' : (w.state === 'orientation' ? '#EFF6FF' : 'transparent'))"
                              [style.color]="w.state === 'correct' ? '#065F46' : (w.state === 'error' ? '#B91C1C' : (w.state === 'orientation' ? '#1E40AF' : '#1E293B'))"
                              [style.border-bottom]="w.state === 'correct' ? '2px solid #34D399' : (w.state === 'error' ? '2px solid #F87171' : (w.state === 'orientation' ? '2px dashed #3B82F6' : '1px dashed transparent'))"
                              [style.outline]="selectedWordIndex() === $index ? '2px solid #4F46E5' : 'none'"
                              [style.box-shadow]="selectedWordIndex() === $index ? '0 0 0 2px rgba(79, 70, 229, 0.15)' : 'none'"
                              style="padding: 2px 4px; border-radius: 4px; cursor: pointer; font-weight: 500; transition: all 0.15s; margin: 2px 1px; display:inline-block"
                              onmouseover="this.style.background = this.style.background || '#F1F5F9'"
                              onmouseout="if(!this.style.borderBottomColor || this.style.borderBottomColor === 'transparent') this.style.background = 'transparent'">
                              {{ w.text }}
                              @if (w.correction) {
                                <span style="font-size:10px; color:#B91C1C; font-weight:800; background:#FEE2E2; border:1px solid #FCA5A5; padding:1px 3px; border-radius:3px; margin-left:3px">➔ {{ w.correction }}</span>
                              }
                              @if (w.orientation) {
                                <span style="font-size:10px; color:#1E40AF; font-weight:800; background:#EFF6FF; border:1px solid #93C5FD; padding:1px 3px; border-radius:3px; margin-left:3px">💡 {{ w.orientation }}</span>
                              }
                            </span>
                          }
                        }
                      </div>

                      <!-- Control Actions Panel for Selected Word -->
                      @if (selectedWordIndex() !== null) {
                        <div class="word-edit-panel" style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:8px; padding:12px; margin-top:14px; display:flex; flex-direction:column; gap:8px; animation: slideDown 0.15s ease-out">
                          <div style="font-size:11px; font-weight:800; color:#475569; display:flex; justify-content:space-between">
                            <span>MOT SÉLECTIONNÉ : "<span style="color:#4F46E5">{{ words()[selectedWordIndex()!].text.trim() }}</span>"</span>
                            <span style="color:var(--text-muted); cursor:pointer" (click)="selectedWordIndex.set(null)">✕ Fermer</span>
                          </div>
                          <div style="display:flex; gap:8px; flex-wrap:wrap">
                            <button class="btn-s" (click)="setWordState(selectedWordIndex()!, 'correct')" style="background:#D1FAE5; color:#065F46; border-color:#34D399; font-size:11px; padding:6px 12px; cursor:pointer">🟢 Correct / Très bien</button>
                            <button class="btn-s" (click)="setWordStateWithCorrection(selectedWordIndex()!, 'error')" style="background:#FEE2E2; color:#B91C1C; border-color:#F87171; font-size:11px; padding:6px 12px; cursor:pointer">🔴 Faute & Remplacement</button>
                            <button class="btn-s" (click)="setWordStateWithOrientation(selectedWordIndex()!, 'orientation')" style="background:#EFF6FF; color:#1E40AF; border-color:#60A5FA; font-size:11px; padding:6px 12px; cursor:pointer">🔵 Orientation & Conseil</button>
                            <button class="btn-s" (click)="setWordState(selectedWordIndex()!, 'neutral')" style="background:white; color:#64748B; border-color:#CBD5E1; font-size:11px; padding:6px 12px; cursor:pointer">⚪ Effacer le marquage</button>
                          </div>
                        </div>
                      }
 
                      <!-- Legend -->
                      <div style="display:flex; gap:12px; margin-top:14px; font-size:10px; border-top:1px solid #F1F5F9; padding-top:10px; color:#64748B; flex-wrap:wrap">
                        <span style="display:flex; align-items:center; gap:4px"><span style="width:8px; height:8px; border-radius:20px; background:#34D399; display:inline-block"></span> Vert = Correct / Très bien</span>
                        <span style="display:flex; align-items:center; gap:4px"><span style="width:8px; height:8px; border-radius:20px; background:#F87171; display:inline-block"></span> Rouge = Fautes / Remplacer</span>
                        <span style="display:flex; align-items:center; gap:4px"><span style="width:8px; height:8px; border-radius:20px; background:#3B82F6; display:inline-block"></span> Bleu = Orientation / Conseil</span>
                      </div>
                    </div>

                    @if (isMultipart(sub.content)) {
                      @if (parseMultipart(sub.content); as parsed) {
                        <div class="text-submission-content" style="margin-top:12px; font-size:13.5px; font-style:italic; border-left:3px solid #4F46E5; padding-left:12px; color:var(--text-secondary)">
                          "{{ parsed.text }}"
                        </div>

                        @if (parsed.audios && parsed.audios.length > 0) {
                          <div style="margin-top:20px; display:flex; flex-direction:column; gap:12px">
                            <div style="font-size:12px; font-weight:700; color:var(--text-primary)">🎙️ Enregistrements Vocaux ({{ parsed.audios.length }}) :</div>
                            @for (aud of parsed.audios; track aud.id) {
                              <div style="background:var(--surface-2); padding:10px; border-radius:8px; border:1px solid var(--border-weak); display:flex; flex-direction:column; gap:6px">
                                <div style="font-size:11.5px; font-weight:600; color:var(--text-primary)">
                                  🗣️ {{ aud.name || 'Partie' }}
                                </div>
                                <audio [src]="aud.data" controls style="width:100%; height:32px; border-radius:30px"></audio>
                              </div>
                            }
                          </div>
                        }

                        @if (parsed.video) {
                          <div style="margin-top:20px; background:#0F172A; border-radius:8px; padding:12px; display:flex; flex-direction:column; align-items:center; gap:8px">
                            <video style="width:100%; max-width:400px; border-radius:6px; background:#000" controls [src]="getVideoSource(parsed.video)"></video>
                            <div style="font-size:11px; color:#94A3B8; text-align:center"><i class="ti ti-video"></i> Video Submission Playback</div>
                          </div>
                        }
                      }
                    } @else {
                      <div class="text-submission-content" style="margin-top:12px; font-size:13.5px; font-style:italic; border-left:3px solid #E2E8F0; padding-left:12px; color:var(--text-secondary)">
                        "{{ sub.content }}"
                      </div>
                    }
                  }
                } @else if (sub.type === 'video') {
                  <div class="video-submission-content" style="background:#0F172A; border-radius:8px; padding:12px; display:flex; flex-direction:column; align-items:center; gap:8px">
                    <video #nativeVideo style="width:100%; max-width:400px; border-radius:6px; background:#000" controls [src]="getVideoSource(sub.content)"></video>
                    <div style="font-size:11px; color:#94A3B8; text-align:center"><i class="ti ti-video"></i> Video Submission Playback</div>
                    <button class="btn-s" style="font-size:10.5px; padding:5px 12px; border-color:#C084FC; color:#C084FC; background:#2E1065; cursor:pointer"
                            (click)="insertVideoTimestamp(nativeVideo)">
                      <i class="ti ti-pin"></i> Insérer remarque à {{ formatAudioTime(nativeVideo.currentTime) }}
                    </button>
                  </div>
                } @else {
                  <!-- 🎙️ Rich Audio Player for Teacher -->
                  <div class="audio-player-card" #audioCard>
                    <!-- Hidden native audio element (source of truth) -->
                    <audio #nativeAudio [src]="sub.content"
                      (timeupdate)="onAudioTimeUpdate(nativeAudio)"
                      (loadedmetadata)="onAudioMetadata(nativeAudio)"
                      (ended)="isAudioPlaying.set(false)">
                    </audio>

                    <!-- Top row: avatar + info + speed -->
                    <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px">
                      <div class="audio-pulse-avatar" [style.animation]="isAudioPlaying() ? 'pulse-live 1.5s ease infinite' : 'none'">
                        <i class="ti ti-microphone" aria-hidden="true"></i>
                      </div>
                      <div style="flex:1; min-width:0">
                        <div style="font-size:11px; font-weight:700; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis">
                          🎙️ {{ sub.studentName }}'s Voice Recording
                        </div>
                        <div style="font-size:10px; color:#64748B; margin-top:2px">
                          {{ audioDuration() > 0 ? formatAudioTime(audioDuration()) : 'Loading...' }}
                        </div>
                      </div>
                      <!-- Speed selector -->
                      <select class="speed-select" [(ngModel)]="audioPlaybackSpeed" (change)="applyPlaybackSpeed(nativeAudio)" title="Playback speed">
                        <option value="0.75">0.75×</option>
                        <option value="1" selected>1×</option>
                        <option value="1.25">1.25×</option>
                        <option value="1.5">1.5×</option>
                        <option value="2">2×</option>
                      </select>
                    </div>

                    <!-- Waveform visualizer bars -->
                    <div class="audio-waveform-bars">
                      @for (h of audioWaveHeights(); track $index) {
                        <div class="waveform-bar" [style.height.px]="h" [style.opacity]="isAudioPlaying() ? 1 : 0.4"></div>
                      }
                    </div>

                    <!-- Progress scrubber -->
                    <div style="display:flex; align-items:center; gap:8px; margin-top:8px">
                      <span style="font-size:9px; color:#94A3B8; width:28px; text-align:right; flex-shrink:0">{{ formatAudioTime(audioCurrentTime()) }}</span>
                      <input type="range" class="audio-scrubber" min="0" [max]="audioDuration() || 100" step="0.1"
                        [value]="audioCurrentTime()"
                        (input)="seekAudio(nativeAudio, $event)"
                        style="flex:1; height:4px; cursor:pointer; accent-color:#EF4444" />
                      <span style="font-size:9px; color:#94A3B8; width:28px; flex-shrink:0">{{ formatAudioTime(audioDuration()) }}</span>
                    </div>

                    <!-- Controls row -->
                    <div style="display:flex; align-items:center; justify-content:center; gap:12px; margin-top:10px">
                      <!-- Rewind 5s -->
                      <button class="ap-btn" title="Rewind 5s" (click)="rewindAudio(nativeAudio)">
                        <i class="ti ti-rotate-clockwise-2" style="transform:scaleX(-1); font-size:14px"></i>
                      </button>

                      <!-- Play / Pause -->
                      <button class="ap-btn ap-btn-primary" (click)="toggleAudioPlay(nativeAudio)" [attr.aria-label]="isAudioPlaying() ? 'Pause' : 'Play'">
                        @if (isAudioPlaying()) {
                          <i class="ti ti-player-pause-filled" style="font-size:18px"></i>
                        } @else {
                          <i class="ti ti-player-play-filled" style="font-size:18px"></i>
                        }
                      </button>

                      <!-- Forward 5s -->
                      <button class="ap-btn" title="Forward 5s" (click)="forwardAudio(nativeAudio)">
                        <i class="ti ti-rotate-clockwise-2" style="font-size:14px"></i>
                      </button>

                      <!-- Download -->
                      <a [href]="sub.content" [download]="sub.studentName + '_recording'" class="ap-btn" title="Download recording">
                        <i class="ti ti-download" style="font-size:14px"></i>
                      </a>
                    </div>
                    <!-- Timestamp bookmark button -->
                    <div style="display:flex; justify-content:center; margin-top:8px">
                      <button class="btn-s" style="font-size:10.5px; padding:5px 12px; border-color:#4F46E5; color:#4F46E5; background:#EEF2FF; cursor:pointer"
                              (click)="insertAudioTimestamp(nativeAudio)">
                        <i class="ti ti-pin"></i> Insérer remarque à {{ formatAudioTime(audioCurrentTime()) }}
                      </button>
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
                <div style="display:flex; gap:8px; margin-top:20px; border-top:1px solid var(--border-weak); padding-top:16px; flex-wrap:wrap">
                  <button class="btn-p" (click)="submitGrade()" style="flex:2; min-width:140px; height:42px; font-weight:600; display:flex; align-items:center; justify-content:center; gap:6px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>{{ sub.graded ? 'Update Grade' : 'Submit Grade & Reward XP' }}</span>
                  </button>
                  <button class="btn-s" (click)="requestRedo()" style="flex:1; min-width:110px; border-color:#F59E0B; color:#D97706; background:#FFFBEB; font-weight:600; display:flex; align-items:center; justify-content:center; gap:6px; height:42px">
                    <i class="ti ti-reload"></i>
                    <span>A refaire</span>
                  </button>
                  <button class="btn-s" (click)="selectedSub.set(null)" style="height:42px; padding:0 15px">
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

    .student-folder-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 10px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
    }

    .student-folder-card:hover {
      background: #F1F5F9;
      border-color: #CBD5E1;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
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

    /* ── Rich Audio Player Card ── */
    .audio-player-card {
      background: linear-gradient(135deg, #1E1B4B 0%, #312E81 100%);
      border-radius: 12px;
      padding: 16px;
      border: 1px solid #4338CA;
      color: #E0E7FF;
    }

    .audio-player-card audio {
      display: none;
    }

    .audio-waveform-bars {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 3px;
      height: 50px;
      padding: 4px 0;
    }

    .waveform-bar {
      width: 4px;
      min-height: 4px;
      border-radius: 3px;
      background: linear-gradient(180deg, #F87171 0%, #EF4444 100%);
      transition: height 0.12s ease;
    }

    .speed-select {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 6px;
      color: #E0E7FF;
      font-size: 10px;
      font-weight: 700;
      padding: 4px 6px;
      cursor: pointer;
    }

    .speed-select option {
      background: #312E81;
      color: #E0E7FF;
    }

    .ap-btn {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #E0E7FF;
      text-decoration: none;
      transition: background 0.15s, transform 0.1s;
    }

    .ap-btn:hover {
      background: rgba(255,255,255,0.2);
      transform: scale(1.05);
    }

    .ap-btn-primary {
      background: #EF4444;
      border-color: #EF4444;
      width: 44px;
      height: 44px;
      font-size: 20px;
    }

    .ap-btn-primary:hover {
      background: #DC2626;
    }

    .audio-scrubber {
      -webkit-appearance: none;
      appearance: none;
      height: 4px;
      border-radius: 2px;
      background: rgba(255,255,255,0.2);
      outline: none;
    }

    .audio-scrubber::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #EF4444;
      cursor: pointer;
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
  activeLang = this.db.activeLang;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

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

  expandedStudentIds = signal<Set<string>>(new Set());
  selectedWordIndex = signal<number | null>(null);

  toggleStudentFolder(studentId: string) {
    const s = new Set(this.expandedStudentIds());
    if (s.has(studentId)) {
      s.delete(studentId);
    } else {
      s.add(studentId);
    }
    this.expandedStudentIds.set(s);
  }

  // Group filtered submissions by student
  groupedSubmissions = computed(() => {
    const list = this.filteredSubmissions();
    const groups: { studentId: string; studentName: string; submissions: Submission[] }[] = [];
    
    list.forEach(sub => {
      let g = groups.find(x => x.studentId === sub.studentId);
      if (!g) {
        g = { studentId: sub.studentId, studentName: sub.studentName, submissions: [] };
        groups.push(g);
      }
      g.submissions.push(sub);
    });

    return groups.sort((a, b) => a.studentName.localeCompare(b.studentName));
  });

  // Grading states
  gradeScore = 'B — Good';
  gradeXp = 50;
  gradeFeedback = '';

  // Audio Player states
  isAudioPlaying = signal<boolean>(false);
  audioCurrentTime = signal<number>(0);
  audioDuration = signal<number>(0);
  audioPlaybackSpeed = '1';
  audioWaveHeights = signal<number[]>([12,20,30,18,40,28,35,15,45,22,38,16,42,25,30,20,14,35,28,18]);
  private waveAnimInterval: any = null;

  // Rubric Rating states
  useRubric = signal<boolean>(false);
  pronunciationRating = signal<number>(0);
  grammarRating = signal<number>(0);
  vocabularyRating = signal<number>(0);


  // Associated datasets
  quizzesList = signal<Quiz[]>([]);
  lessonsList = signal<Lesson[]>([]);
  exercisesList = signal<Exercise[]>([]);

  // Interactive highlighting state for selected text submission
  words = signal<{ text: string; state: 'neutral' | 'correct' | 'error' | 'orientation'; correction?: string; orientation?: string; isNewline?: boolean }[]>([]);

  associatedTask = computed(() => {
    const sub = this.selectedSub();
    if (!sub) return null;
    
    // Check if it's an exercise
    const ex = this.exercisesList().find(e => e.id === sub.lessonId);
    if (ex) return { type: 'exercise', data: ex };
    
    // Check if it's a quiz
    const quiz = this.quizzesList().find(q => q.id === sub.lessonId);
    if (quiz) return { type: 'quiz', data: quiz };
    
    // Otherwise, check if it's a lesson
    const les = this.lessonsList().find(l => l.id === sub.lessonId);
    if (les) return { type: 'lesson', data: les };
    
    return null;
  });

  parsedQuizResults = computed(() => {
    const sub = this.selectedSub();
    if (!sub || sub.type !== 'text') return null;
    
    const content = sub.content || '';
    if (!content.includes("Réponses de l'étudiant:")) return null;
    
    try {
      // Extract score text
      const scoreMatch = content.match(/Score:\s*([0-9%]+)/);
      const score = scoreMatch ? scoreMatch[1] : '';
      
      const correctMatch = content.match(/\(([0-9\s/]+)\s*correctes\)/);
      const correctText = correctMatch ? correctMatch[1] : '';
      
      // Extract JSON part
      const jsonStart = content.indexOf('{');
      if (jsonStart === -1) return null;
      
      const jsonStr = content.substring(jsonStart);
      const studentAnswers = JSON.parse(jsonStr) as Record<string, string | number | string[]>;
      
      // Get associated quiz
      const task = this.associatedTask();
      if (!task || task.type !== 'quiz') return { score, correctText, questions: [] };
      
      const quiz = task.data as Quiz;
      
      // Map quiz questions to student answers and correct answers
      const questionsWithAnswers = quiz.questions.map((q, idx) => {
        const studentAns = studentAnswers[idx] !== undefined ? studentAnswers[idx] : studentAnswers[`q${idx}`];
        
        let isCorrect = false;
        let formattedStudent = '';
        let formattedCorrect = '';
        
        if (q.options && q.options.length > 0) {
          // Multiple choice
          const sIdx = Number(studentAns);
          const cIdx = Number(q.correctOption);
          
          formattedStudent = !isNaN(sIdx) && q.options[sIdx] ? q.options[sIdx] : (studentAns || '').toString();
          formattedCorrect = !isNaN(cIdx) && q.options[cIdx] ? q.options[cIdx] : q.correctOption;
          
          isCorrect = sIdx === cIdx || studentAns === q.correctOption;
        } else if (q.matchPairs && q.matchPairs.length > 0) {
          // Matching pairs
          formattedStudent = JSON.stringify(studentAns);
          formattedCorrect = q.matchPairs.map(p => `${p.left} ➔ ${p.right}`).join(', ');
          isCorrect = true; // Pair matches are auto-saved
        } else if (q.orderItems && q.orderItems.length > 0) {
          // Ordering
          formattedStudent = Array.isArray(studentAns) ? studentAns.join(', ') : (studentAns || '').toString();
          formattedCorrect = q.orderItems.join(', ');
          isCorrect = formattedStudent === formattedCorrect;
        } else {
          // Text / Pronunciation / Speech
          formattedStudent = (studentAns || '').toString();
          formattedCorrect = q.correctOption || '';
          isCorrect = formattedStudent.toLowerCase().trim() === formattedCorrect.toLowerCase().trim();
        }
        
        return {
          questionText: q.question,
          studentAnswer: formattedStudent,
          correctAnswer: formattedCorrect,
          isCorrect
        };
      });
      
      return {
        score,
        correctText,
        questions: questionsWithAnswers
      };
      
    } catch (e) {
      console.warn("Failed to parse quiz answers from submission content", e);
      return null;
    }
  });

  initializeHighlightWords(text: string) {
    if (!text) {
      this.words.set([]);
      return;
    }
    // Split by newlines, keeping the newlines in the tokens array
    const lines = text.split(/(\r?\n)/);
    const tokens: { text: string; state: 'neutral' | 'correct' | 'error'; correction?: string; isNewline?: boolean }[] = [];
    
    lines.forEach(line => {
      if (line === '\n' || line === '\r\n') {
        tokens.push({ text: line, state: 'neutral', isNewline: true });
      } else {
        const lineTokens = line.split(/(\s+)/);
        lineTokens.forEach(t => {
          if (t) {
            tokens.push({ text: t, state: 'neutral' });
          }
        });
      }
    });
    this.words.set(tokens);
  }

  autoFormatStudentText() {
    let text = this.selectedSub()?.content || '';
    
    // Insert newlines before numbers like "1.", "2." (especially smushed ones like "1.a" or "2.c")
    text = text.replace(/([^\n])\s*(\b\d+\.[a-zA-Z0-9\s])/g, '$1\n$2');
    
    // Insert newlines before option letters like "A.", "B.", "C."
    text = text.replace(/([^\n])\s*(\b[A-Z]\.[a-zA-Z0-9\s])/g, '$1\n$2');
    
    // Insert newlines before sections like "Assignment:"
    text = text.replace(/([^\n])\s*(\bAssignment:)/gi, '$1\n$2');
    
    this.initializeHighlightWords(text);
  }

  toggleWordState(index: number, event: MouseEvent) {
    event.preventDefault();
    if (this.selectedWordIndex() === index) {
      this.selectedWordIndex.set(null);
    } else {
      this.selectedWordIndex.set(index);
    }
  }

  setWordState(index: number, state: 'neutral' | 'correct') {
    const current = this.words();
    current[index].state = state;
    current[index].correction = undefined;
    current[index].orientation = undefined;
    this.words.set([...current]);
    this.selectedWordIndex.set(null);
    this.syncHighlightedFeedback();
  }

  setWordStateWithCorrection(index: number, state: 'error') {
    const current = this.words();
    const w = current[index];
    const cleanWord = w.text.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const userCorrection = prompt(this.t(`Remplacement / Correction pour "${cleanWord}" :`, `Replacement / Correction for "${cleanWord}":`), w.correction || cleanWord);
    
    if (userCorrection !== null) {
      w.state = 'error';
      w.correction = userCorrection.trim();
      w.orientation = undefined;
      this.words.set([...current]);
      this.syncHighlightedFeedback();
    }
    this.selectedWordIndex.set(null);
  }

  setWordStateWithOrientation(index: number, state: 'orientation') {
    const current = this.words();
    const w = current[index];
    const cleanWord = w.text.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const userOrientation = prompt(this.t(`Orientation / Conseil pour "${cleanWord}" :`, `Direction / Advice for "${cleanWord}":`), w.orientation || '');
    
    if (userOrientation !== null) {
      w.state = 'orientation';
      w.orientation = userOrientation.trim();
      w.correction = undefined;
      this.words.set([...current]);
      this.syncHighlightedFeedback();
    }
    this.selectedWordIndex.set(null);
  }

  generateHtmlHighlightsReport(): string {
    if (this.words().length === 0) return '';

    const hasHighlights = this.words().some(w => w.state && w.state !== 'neutral');
    if (!hasHighlights) return '';

    let annotatedText = '<!-- highlights-start -->';
    
    // Embed raw state data for subsequent loading/editing
    const jsonState = JSON.stringify(this.words());
    annotatedText += `<!-- highlights-data:${jsonState} -->`;

    annotatedText += '<div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:12px; padding:18px; margin-bottom:18px; font-family:inherit; line-height:1.8; color:#1E293B; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05)">';
    annotatedText += '<div style="font-size:12px; font-weight:800; color:#475569; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px; border-bottom:1px solid #E2E8F0; padding-bottom:8px; display:flex; align-items:center; gap:6px">📝 Analyse détaillée de votre texte :</div>';
    
    annotatedText += '<div style="font-size:14.5px; line-height:1.9">';
    this.words().forEach(w => {
      if (w.isNewline) {
        annotatedText += '<br/>';
      } else if (w.text.trim().length === 0) {
        annotatedText += w.text;
      } else if (w.state === 'correct') {
        annotatedText += `<span style="background-color: #D1FAE5; border-bottom: 2px solid #34D399; padding: 2px 4px; border-radius: 4px; color: #065F46; font-weight: 600; margin: 0 1px; display: inline-block;">${w.text}</span>`;
      } else if (w.state === 'error') {
        let correctionSpan = '';
        if (w.correction) {
          correctionSpan = `<span style="font-size: 10px; font-weight: 800; background: #EF4444; color: white; padding: 1px 4px; border-radius: 3px; margin-left: 4px; display: inline-flex; align-items: center;">➔ ${w.correction}</span>`;
        }
        annotatedText += `<span style="background-color: #FEE2E2; border-bottom: 2px solid #F87171; padding: 2px 4px; border-radius: 4px; color: #B91C1C; font-weight: 700; margin: 0 1px; display: inline-block;">${w.text}${correctionSpan}</span>`;
      } else if (w.state === 'orientation') {
        let orientationSpan = '';
        if (w.orientation) {
          orientationSpan = `<span style="font-size: 10px; font-weight: 800; background: #3B82F6; color: white; padding: 1px 4px; border-radius: 3px; margin-left: 4px; display: inline-flex; align-items: center;">💡 ${w.orientation}</span>`;
        }
        annotatedText += `<span style="background-color: #EFF6FF; border-bottom: 2px dashed #3B82F6; padding: 2px 4px; border-radius: 4px; color: #1E40AF; font-weight: 600; margin: 0 1px; display: inline-block;">${w.text}${orientationSpan}</span>`;
      } else {
        annotatedText += `<span>${w.text}</span>`;
      }
    });
    annotatedText += '</div>';

    // Legend
    annotatedText += '<div style="display:flex; gap:12px; margin-top:14px; font-size:10.5px; border-top:1px solid #E2E8F0; padding-top:10px; color:#64748B; justify-content:flex-start; flex-wrap:wrap">';
    annotatedText += '<span style="display:inline-flex; align-items:center; gap:4px"><span style="width:8px; height:8px; border-radius:50%; background:#34D399; display:inline-block"></span> Vert = Correct</span>';
    annotatedText += '<span style="display:inline-flex; align-items:center; gap:4px"><span style="width:8px; height:8px; border-radius:50%; background:#F87171; display:inline-block"></span> Rouge = Correction</span>';
    annotatedText += '<span style="display:inline-flex; align-items:center; gap:4px"><span style="width:8px; height:8px; border-radius:50%; background:#3B82F6; display:inline-block"></span> Bleu = Orientation / Conseil</span>';
    annotatedText += '</div>';

    annotatedText += '</div>';
    annotatedText += '<!-- highlights-end -->';
    return annotatedText;
  }
  syncHighlightedFeedback() {
    const correctWords = this.words().filter(w => w.state === 'correct').map(w => w.text.trim());
    const errorWords = this.words().filter(w => w.state === 'error');
    const orientationWords = this.words().filter(w => w.state === 'orientation');
    
    let report = '';
    if (correctWords.length > 0) {
      report += `👍 Points forts / Très bien : ${correctWords.join(', ')}\n`;
    }
    if (errorWords.length > 0) {
      report += `⚠️ À corriger / Fautes :\n`;
      errorWords.forEach(w => {
        const cleanOriginal = w.text.trim();
        if (w.correction) {
          report += `  - "${cleanOriginal}" ➔ de préférence : "${w.correction}"\n`;
        } else {
          report += `  - "${cleanOriginal}"\n`;
        }
      });
    }
    if (orientationWords.length > 0) {
      report += `💡 Conseils / Orientations :\n`;
      orientationWords.forEach(w => {
        const cleanOriginal = w.text.trim();
        if (w.orientation) {
          report += `  - "${cleanOriginal}" ➔ Conseil : "${w.orientation}"\n`;
        } else {
          report += `  - "${cleanOriginal}"\n`;
        }
      });
    }
    
    const header = `[Rapport de Correction Visuelle]`;
    const footer = `[Fin du Rapport]`;
    
    let currentFeedback = this.gradeFeedback || '';
    const startIdx = currentFeedback.indexOf(header);
    const endIdx = currentFeedback.indexOf(footer);
    
    const reportBlock = `${header}\n${report}${footer}\n\n`;
    
    if (startIdx !== -1 && endIdx !== -1) {
      this.gradeFeedback = currentFeedback.substring(0, startIdx) + reportBlock + currentFeedback.substring(endIdx + footer.length + 2);
    } else {
      this.gradeFeedback = reportBlock + this.gradeFeedback;
    }
  }

  insertAudioTimestamp(audio: HTMLAudioElement) {
    const timeStr = this.formatAudioTime(audio.currentTime);
    const timestampBlock = `📍 [Audio à ${timeStr}] : (Saisissez votre remarque sur la prononciation/lecture ici)\n`;
    this.gradeFeedback = timestampBlock + (this.gradeFeedback || '');
  }

  insertVideoTimestamp(video: HTMLVideoElement) {
    const timeStr = this.formatAudioTime(video.currentTime);
    const timestampBlock = `🎬 [Vidéo à ${timeStr}] : (Saisissez votre remarque sur la vidéo ici)\n`;
    this.gradeFeedback = timestampBlock + (this.gradeFeedback || '');
  }

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

    this.db.observeQuizzes().subscribe(list => this.quizzesList.set(list));
    this.db.observeLessons().subscribe(list => this.lessonsList.set(list));
    this.db.observeExercises().subscribe(list => this.exercisesList.set(list));
  }

  deleteSubmission(sub: Submission) {
    this.dialogService.confirm(
      this.t('Confirmer la suppression', 'Confirm Deletion'),
      this.t(
        `Voulez-vous vraiment supprimer le devoir soumis par ${sub.studentName} ? Cette action est irréversible.`,
        `Are you sure you want to delete the homework submitted by ${sub.studentName}? This action cannot be undone.`
      ),
      () => {
        this.db.deleteSubmission(sub.id).then(() => {
          this.selectedSub.set(null);
          this.dialogService.alert(
            this.t('Succès', 'Success'),
            this.t('Le devoir a été supprimé avec succès.', 'The homework has been deleted successfully.'),
            'success'
          );
        });
      }
    );
  }

  selectSubmission(sub: Submission) {
    this.selectedSub.set(sub);
    this.selectedWordIndex.set(null); // Reset active word selection
    
    // Auto-expand folder when a sub is selected
    const s = new Set(this.expandedStudentIds());
    s.add(sub.studentId);
    this.expandedStudentIds.set(s);

    this.gradeScore = sub.score || 'B — Good';
    this.gradeXp = sub.xpReward || 50;

    let feedbackText = sub.feedback || 'Good effort! Pay close attention to English grammar and verb tenses.';
    const startTag = '<!-- highlights-start -->';
    const endTag = '<!-- highlights-end -->';
    
    let parsedWords: any[] | null = null;
    if (feedbackText.includes('<!-- highlights-data:')) {
      try {
        const startMarker = '<!-- highlights-data:';
        const endMarker = ' -->';
        const startIdx = feedbackText.indexOf(startMarker) + startMarker.length;
        const endIdx = feedbackText.indexOf(endMarker, startIdx);
        const jsonStr = feedbackText.substring(startIdx, endIdx);
        parsedWords = JSON.parse(jsonStr);
      } catch (err) {
        console.warn('Failed to parse highlights data from feedback:', err);
      }
    }

    if (feedbackText.includes(startTag) && feedbackText.includes(endTag)) {
      const endIdx = feedbackText.indexOf(endTag);
      feedbackText = feedbackText.substring(endIdx + endTag.length);
    }
    this.gradeFeedback = feedbackText;
    
    // Reset rubric helper
    this.useRubric.set(false);
    this.pronunciationRating.set(0);
    this.grammarRating.set(0);
    this.vocabularyRating.set(0);

    // Initialize highlighter if text submission
    if (sub.type === 'text') {
      if (this.isMultipart(sub.content)) {
        const parsed = this.parseMultipart(sub.content);
        if (parsedWords) {
          this.words.set(parsedWords);
        } else {
          this.initializeHighlightWords(parsed.text || '');
        }
      } else if (!sub.content.includes("Réponses de l'étudiant:")) {
        if (parsedWords) {
          this.words.set(parsedWords);
        } else {
          this.initializeHighlightWords(sub.content);
        }
      } else {
        this.words.set([]);
      }
    } else {
      this.words.set([]);
    }

    // Reset audio player
    this.isAudioPlaying.set(false);
    this.audioCurrentTime.set(0);
    this.audioDuration.set(0);
    this.audioPlaybackSpeed = '1';
    clearInterval(this.waveAnimInterval);
  }

  toggleAudioPlay(audio: HTMLAudioElement) {
    if (audio.paused) {
      audio.play();
      this.isAudioPlaying.set(true);
      this.waveAnimInterval = setInterval(() => {
        this.audioWaveHeights.set(this.audioWaveHeights().map(() => Math.floor(Math.random() * 38) + 8));
      }, 120);
    } else {
      audio.pause();
      this.isAudioPlaying.set(false);
      clearInterval(this.waveAnimInterval);
    }
  }

  onAudioTimeUpdate(audio: HTMLAudioElement) {
    this.audioCurrentTime.set(audio.currentTime);
  }

  onAudioMetadata(audio: HTMLAudioElement) {
    this.audioDuration.set(audio.duration);
  }

  seekAudio(audio: HTMLAudioElement, event: Event) {
    const val = parseFloat((event.target as HTMLInputElement).value);
    audio.currentTime = val;
    this.audioCurrentTime.set(val);
  }

  rewindAudio(audio: HTMLAudioElement) {
    audio.currentTime = Math.max(0, audio.currentTime - 5);
  }

  forwardAudio(audio: HTMLAudioElement) {
    audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
  }

  applyPlaybackSpeed(audio: HTMLAudioElement) {
    audio.playbackRate = parseFloat(this.audioPlaybackSpeed);
  }

  formatAudioTime(seconds: number): string {
    if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  isMultipart(content: string | undefined): boolean {
    if (!content) return false;
    return content.trim().startsWith('{"isMultipart":true');
  }

  parseMultipart(content: string | undefined) {
    if (!content) return { text: '', audios: [], video: '' };
    try {
      return JSON.parse(content);
    } catch (e) {
      return { text: content, audios: [], video: '' };
    }
  }

  getMultipartPreview(content: string): string {
    const parsed = this.parseMultipart(content);
    let parts = [];
    if (parsed.text) parts.push(parsed.text);
    if (parsed.audios && parsed.audios.length > 0) parts.push(`🎙️ ${parsed.audios.length} vocaux`);
    if (parsed.video) parts.push('🎥 1 vidéo');
    return parts.join(' | ');
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


  getTaskSubject(task: any): string {
    if (task?.type === 'exercise') {
      const ex = task.data as Exercise;
      return ex.subject || ex.textToTranslate || ex.listeningInstruction || ex.speakingPrompt || '';
    }
    return '';
  }

  getTaskYoutubeUrl(task: any): string {
    if (task?.type === 'exercise') {
      const ex = task.data as Exercise;
      return ex.youtubeUrl || '';
    }
    return '';
  }

  getLessonHomework(task: any): string {
    if (task?.type === 'lesson') {
      const les = task.data as Lesson;
      return les.homeworkInstruction || '';
    }
    return '';
  }

  getLessonContent(task: any): string {
    if (task?.type === 'lesson') {
      const les = task.data as Lesson;
      return les.content || '';
    }
    return '';
  }

  getQuizQuestionsCount(task: any): number {
    if (task?.type === 'quiz') {
      const q = task.data as Quiz;
      return q.questions?.length || 0;
    }
    return 0;
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

  async submitGrade() {
    const sub = this.selectedSub();
    if (!sub) return;

    const htmlHighlights = this.generateHtmlHighlightsReport();
    const finalFeedback = htmlHighlights + this.gradeFeedback;

    await this.db.gradeSubmission(sub.id, this.gradeScore, finalFeedback, this.gradeXp);
    
    // Send notification to student (without raw HTML tags)
    await this.db.sendNotification({
      recipientId: sub.studentId,
      recipientRole: 'student',
      type: 'homework_graded',
      title: 'Nouvelle note disponible ! 📝',
      message: `Votre devoir "${sub.lessonTitle}" a été corrigé.\n\nNote: ${this.gradeScore}\nXP gagnés: ${this.gradeXp}\n\nFeedback: ${this.gradeFeedback.substring(0, 100)}${this.gradeFeedback.length > 100 ? '...' : ''}`
    });

    this.dialogService.alert('Success', `Submission graded successfully! ${this.gradeXp} XP awarded to student.`, 'success');
    
    // Automatically close the panel if it has been graded successfully
    this.selectedSub.set(null);
  }

  async requestRedo() {
    const sub = this.selectedSub();
    if (!sub) return;

    if (!this.gradeFeedback.trim()) {
      this.dialogService.alert('Erreur', 'Veuillez saisir un commentaire de feedback expliquant pourquoi l\'étudiant doit refaire l\'exercice.', 'info');
      return;
    }

    const htmlHighlights = this.generateHtmlHighlightsReport();
    const finalFeedback = htmlHighlights + this.gradeFeedback;

    // Grade submission as "A refaire" with 0 XP and feedback
    await this.db.gradeSubmission(sub.id, 'A refaire', finalFeedback, 0);

    // Determine target redirect tab
    let targetTab = 'lessons';
    if (sub.lessonId.startsWith('speaking')) {
      targetTab = 'speaking';
    } else if (sub.lessonId.startsWith('quiz') || sub.lessonId.includes('quiz') || sub.lessonTitle.includes('[Quiz]') || sub.lessonTitle.includes('[Exercise]')) {
      targetTab = 'exercises';
    }

    // Send warning/redo notification to student
    await this.db.sendNotification({
      recipientId: sub.studentId,
      recipientRole: 'student',
      type: 'reminder',
      title: 'Exercice à refaire 🔄',
      message: `Votre enseignant demande de refaire l'exercice : "${sub.lessonTitle}".\nFeedback: ${this.gradeFeedback}`,
      link: targetTab
    });

    this.dialogService.alert('Succès', 'Demande de travail à refaire envoyée avec succès à l\'étudiant.', 'success');
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
