import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Lesson } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-lessons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="card">
        <h3 class="st" style="font-size:16px; margin-bottom:12px">Create New English Lesson</h3>
        
        <div class="input-row">
          <label for="lTitle">Lesson Title</label>
          <input id="lTitle" type="text" [(ngModel)]="title" placeholder="e.g., Week 9 — Reported speech (Le discours rapporté)" />
        </div>

        <div class="g2">
          <div class="input-row">
            <label for="lLevel">Level</label>
            <select id="lLevel" [(ngModel)]="level">
              <option value="A1">A1 — Beginner</option>
              <option value="A2">A2 — Elementary</option>
              <option value="B1">B1 — Intermediate</option>
              <option value="B2">B2 — Upper Intermediate</option>
            </select>
          </div>
          <div class="input-row">
            <label for="lType">Type</label>
            <select id="lType" [(ngModel)]="type">
              <option value="Grammar">Grammar / Conjugation</option>
              <option value="Vocabulary">Vocabulary List</option>
              <option value="Reading">Reading / Comprehension</option>
            </select>
          </div>
        </div>

        <div class="input-row">
          <label for="lContent">Lesson Content (Markdown/Text)</label>
          <textarea id="lContent" [(ngModel)]="content" rows="6" placeholder="Write grammar explanations, notes, reading texts..."></textarea>
        </div>

        <div class="input-row">
          <label for="lVocab">Vocabulary List (One term per line, e.g., 'to speak - parler')</label>
          <textarea id="lVocab" [(ngModel)]="vocabText" rows="4" placeholder="word - translation"></textarea>
        </div>

        <div class="g2">
          <div class="input-row">
            <label for="lHomework">Homework Instructions (Writing/Speaking prompts)</label>
            <textarea id="lHomework" [(ngModel)]="homeworkInstruction" rows="3" placeholder="Describe the task for students..."></textarea>
          </div>
          <div class="input-row">
            <label for="lDue">Homework Due Date</label>
            <input id="lDue" type="date" [(ngModel)]="dueDate" />
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px">
          <button class="btn-p" [disabled]="!isValid()" (click)="publishLesson()">
            {{ selectedLessonId() ? 'Update Lesson' : 'Publish Lesson' }}
          </button>
          @if (selectedLessonId()) {
            <button class="btn-s" (click)="resetForm()">Cancel Edit</button>
          }
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <h3 class="st" style="font-size:16px; margin-bottom:12px">Published Lessons</h3>
        @if (lessons().length === 0) {
          <div style="font-size:13px; color:var(--text-secondary); text-align:center; padding:16px 0">
            No lessons published yet.
          </div>
        } @else {
          <table style="width:100%; border-collapse:collapse; font-size:12px">
            <thead>
              <tr style="text-align:left; border-bottom:2px solid var(--border-weak); color:var(--text-muted)">
                <th style="padding:8px">Title</th>
                <th style="padding:8px">Level</th>
                <th style="padding:8px">Type</th>
                <th style="padding:8px">Vocab count</th>
                <th style="padding:8px; text-align:right">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (lesson of lessons(); track lesson.id) {
                <tr style="border-bottom:1px solid var(--border-weak)">
                  <td style="padding:8px; font-weight:600; color:var(--text-primary)">{{ lesson.title }}</td>
                  <td style="padding:8px"><span class="badge" style="background:#E0E7FF; color:#3730A3">{{ lesson.level }}</span></td>
                  <td style="padding:8px">{{ lesson.type }}</td>
                  <td style="padding:8px">{{ lesson.vocabulary.length }} items</td>
                  <td style="padding:8px; text-align:right">
                    <button class="btn-s" style="padding:4px 8px; font-size:11px" (click)="editLesson(lesson)">
                      Edit
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `
})
export class TeacherLessonsComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  selectedLessonId = signal<string | null>(null);
  lessons = signal<Lesson[]>([]);

  title = 'Week 9 — Reported speech (Le discours rapporté)';
  level = 'B1';
  type = 'Grammar';
  content = 'Reported speech (le discours rapporté) is used to report what someone else said. In English, we typically shift the tense back (e.g., Present Simple becomes Past Simple) and use reporting verbs like "say" or "tell".\n\nExample:\nDirect: John said: "I am tired." -> Reported: John said that he was tired.';
  vocabText = 'to say - dire\ninformation - information\nto ask - demander\nto think - penser\nto answer - répondre';
  homeworkInstruction = 'Transform these direct quotes into reported speech:\n1. Mary said: "I will go to the cinema."\n2. The teacher said: "Study your lesson."';
  dueDate = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];

  constructor() {
    this.db.observeLessons().subscribe(list => this.lessons.set(list));
  }

  isValid() {
    return this.title.trim() && this.content.trim() && this.homeworkInstruction.trim() && this.dueDate;
  }

  editLesson(lesson: Lesson) {
    this.selectedLessonId.set(lesson.id);
    this.title = lesson.title;
    this.level = lesson.level;
    this.type = lesson.type;
    this.content = lesson.content;
    this.vocabText = lesson.vocabulary.join('\n');
    this.homeworkInstruction = lesson.homeworkInstruction;
    this.dueDate = lesson.dueDate;
  }

  publishLesson() {
    if (!this.isValid()) return;

    // Parse vocabulary
    const vocabulary = this.vocabText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const lessonData = {
      title: this.title,
      level: this.level,
      type: this.type,
      content: this.content,
      vocabulary,
      homeworkInstruction: this.homeworkInstruction,
      dueDate: this.dueDate
    };

    const id = this.selectedLessonId();
    if (id) {
      this.db.updateLesson(id, lessonData);
      this.dialogService.alert('Success', 'English Lesson updated successfully!', 'success');
    } else {
      this.db.addLesson(lessonData);
      this.dialogService.alert('Success', 'English Lesson published successfully!', 'success');
    }
    this.resetForm();
  }

  resetForm() {
    this.selectedLessonId.set(null);
    this.title = '';
    this.level = 'B1';
    this.type = 'Grammar';
    this.content = '';
    this.vocabText = '';
    this.homeworkInstruction = '';
    this.dueDate = '';
  }
}
