import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Lesson, Submission } from '../../services/database.service';

@Component({
  selector: 'app-student-lessons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      @if (!selectedLesson()) {
        <!-- LESSONS LIST VIEW -->
        <div class="tab-row">
          <button class="tab" [class.active]="activeTab() === 'all'" (click)="activeTab.set('all')">All Lessons</button>
          <button class="tab" [class.active]="activeTab() === 'B1'" (click)="activeTab.set('B1')">My Level (B1)</button>
        </div>

        <div class="lessons-list">
          @for (lesson of filteredLessons(); track lesson.id) {
            <div class="lesson-item" (click)="selectLesson(lesson)">
              <div class="lesson-icon" [class.purple]="lesson.type === 'Grammar'" [class.teal]="lesson.type === 'Listening'" [class.amber]="lesson.type === 'Vocabulary'">
                <i class="ti" [class.ti-book]="lesson.type === 'Grammar'" [class.ti-headphones]="lesson.type === 'Listening'" [class.ti-pencil]="lesson.type === 'Vocabulary'" aria-hidden="true"></i>
              </div>
              <div class="lesson-info">
                <div class="lesson-title">{{ lesson.title }}</div>
                <div class="lesson-meta">{{ lesson.type }} · Level {{ lesson.level }} · Due {{ lesson.dueDate }}</div>
              </div>
              <span class="pill" [class.done]="isLessonSubmitted(lesson.id)" [class.new]="!isLessonSubmitted(lesson.id)">
                {{ isLessonSubmitted(lesson.id) ? (getSubmissionStatus(lesson.id)) : 'Unsubmitted' }}
              </span>
            </div>
          }
        </div>
      } @else {
        <!-- SELECTED LESSON DETAIL VIEW -->
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
            <button class="btn-s" (click)="selectedLesson.set(null)"><i class="ti ti-arrow-left"></i> Back to Lessons</button>
            <span class="pill new" [class.done]="isLessonSubmitted(selectedLesson()!.id)">
              {{ getSubmissionStatus(selectedLesson()!.id) }}
            </span>
          </div>

          <h3 class="st" style="font-size:18px; margin-bottom:4px">{{ selectedLesson()?.title }}</h3>
          <p style="font-size:11px; color:var(--text-muted); margin-bottom:16px">Level: {{ selectedLesson()?.level }} · Due: {{ selectedLesson()?.dueDate }}</p>

          <!-- Detail Tabs -->
          <div class="tab-row" style="margin-bottom:16px">
            <button class="tab" [class.active]="detailTab() === 'content'" (click)="detailTab.set('content')">Grammar Notes</button>
            <button class="tab" [class.active]="detailTab() === 'vocab'" (click)="detailTab.set('vocab')">Vocabulary</button>
            <button class="tab" [class.active]="detailTab() === 'homework'" (click)="detailTab.set('homework')">Homework</button>
          </div>

          <!-- Tab Contents -->
          @if (detailTab() === 'content') {
            <div style="white-space: pre-line; line-height:1.6; font-size:14px; padding:8px 0; color:var(--text-secondary)">
              {{ selectedLesson()?.content }}
            </div>
          } @else if (detailTab() === 'vocab') {
            <div style="display:flex; flex-direction:column; gap:8px">
              @for (v of selectedLesson()?.vocabulary; track v) {
                <div class="row" style="margin-bottom:0; background:var(--surface-2)">
                  <i class="ti ti-bookmarks" style="color:#4F46E5; font-size:18px"></i>
                  <span style="font-size:13px; font-weight:500">{{ v }}</span>
                </div>
              }
            </div>
          } @else if (detailTab() === 'homework') {
            <div style="display:flex; flex-direction:column; gap:12px">
              <div style="background:#EEF2FF; border-left:3px solid #4F46E5; padding:12px; border-radius:4px">
                <h4 style="font-size:12px; font-weight:600; color:#3730A3; margin-bottom:4px">Homework Instructions:</h4>
                <p style="font-size:13px; color:#4B5563">{{ selectedLesson()?.homeworkInstruction }}</p>
              </div>

              @if (getLessonSubmission(selectedLesson()!.id); as sub) {
                <!-- Show submitted answer and grading -->
                <div class="card" style="background:var(--surface-2); margin-top:8px">
                  <h4 style="font-size:12px; font-weight:600; margin-bottom:4px">Your Submission:</h4>
                  <p style="font-size:13px; color:var(--text-secondary); margin-bottom:12px; font-style:italic">"{{ sub.content }}"</p>
                  
                  @if (sub.graded) {
                    <div style="border-top:1.5px solid var(--border); padding-top:10px">
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px">
                        <span style="font-size:12px; font-weight:600; color:#065F46">Grade: {{ sub.score }}</span>
                        <span style="font-size:11px; font-weight:600; color:#4F46E5">+{{ sub.xpReward }} XP Earned</span>
                      </div>
                      <h5 style="font-size:11px; font-weight:600; color:var(--text-primary); margin-bottom:2px">Teacher Feedback:</h5>
                      <p style="font-size:12px; color:var(--text-secondary)">{{ sub.feedback }}</p>
                    </div>
                  } @else {
                    <div style="border-top:0.5px solid var(--border); padding-top:8px; font-size:12px; color:var(--text-muted)">
                      <i class="ti ti-clock"></i> Waiting for teacher grading.
                    </div>
                  }
                </div>
              } @else {
                <!-- Submit Form -->
                <div class="input-row" style="margin-top:8px">
                  <label for="hwAnswer">Your Answer in English:</label>
                  <textarea id="hwAnswer" [(ngModel)]="homeworkContent" placeholder="Type your English sentences here..."></textarea>
                </div>
                <button class="btn-p" (click)="submitHomework()" [disabled]="!homeworkContent.trim()">
                  <i class="ti ti-send"></i> Submit Homework
                </button>
              }
            </div>
          }
        </div>
      }
    </div>
  `
})
export class StudentLessonsComponent {
  private db = inject(DatabaseService);

  activeTab = signal<string>('all');
  detailTab = signal<string>('content');
  lessons = signal<Lesson[]>([]);
  submissions = signal<Submission[]>([]);
  
  selectedLesson = signal<Lesson | null>(null);
  homeworkContent = '';

  constructor() {
    this.db.observeLessons().subscribe(list => this.lessons.set(list));
    this.db.observeSubmissions().subscribe(list => this.submissions.set(list));
  }

  filteredLessons() {
    const list = this.lessons();
    if (this.activeTab() === 'B1') {
      return list.filter(l => l.level === 'B1');
    }
    return list;
  }

  selectLesson(lesson: Lesson) {
    this.selectedLesson.set(lesson);
    this.detailTab.set('content');
    this.homeworkContent = '';
  }

  isLessonSubmitted(lessonId: string): boolean {
    const activeUser = this.db.observeCurrentUser();
    let currentUserId = '';
    activeUser.subscribe(u => currentUserId = u?.id || '');
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
}
