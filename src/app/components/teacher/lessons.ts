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

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px">
          <div class="input-row" style="margin-bottom:0">
            <label for="lXp">Points XP à remporter</label>
            <input id="lXp" type="number" [(ngModel)]="points" placeholder="ex. 30, 50, 100..." style="width:100%; padding:9px; border:1px solid var(--border); border-radius:var(--radius); font-size:12px" />
          </div>
          <div class="input-row" style="margin-bottom:0">
            <label for="lYoutube">Lien Vidéo YouTube (Optionnel)</label>
            <input id="lYoutube" type="text" [(ngModel)]="youtubeUrl" placeholder="https://www.youtube.com/watch?v=..." style="width:100%; padding:9px; border:1px solid var(--border); border-radius:var(--radius); font-size:12px" />
          </div>
        </div>
        
        <div class="input-row" style="margin-bottom:12px">
          <label for="lYoutubeDesc">Description de la vidéo YouTube (Optionnel)</label>
          <textarea id="lYoutubeDesc" [(ngModel)]="youtubeDescription" rows="2" placeholder="Description ou instructions sur la vidéo..." style="width:100%; padding:9px; border:1px solid var(--border); border-radius:var(--radius); font-size:12px"></textarea>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px">
          <button class="btn-s" (click)="saveAsDraft()">
            Save as Draft
          </button>
          <button class="btn-p" [disabled]="!isValid()" (click)="publishLesson()">
            {{ selectedLessonId() ? 'Update Lesson' : 'Publish Lesson' }}
          </button>
          @if (selectedLessonId()) {
            <button class="btn-s" (click)="resetForm()">Cancel Edit</button>
          }
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
          <h3 class="st" style="font-size:16px; margin:0">Published Lessons</h3>
          <button class="btn-s" style="font-size:12px" (click)="showDrafts.set(!showDrafts())">
            {{ showDrafts() ? 'Hide' : 'Show' }} Drafts ({{ drafts().length }})
          </button>
        </div>
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
                  <td style="padding:8px; text-align:right; display:flex; gap:4px; justify-content:flex-end">
                    <button class="btn-s" style="padding:4px 8px; font-size:11px" (click)="editLesson(lesson)">
                      Edit
                    </button>
                    <button class="btn-s" style="padding:4px 8px; font-size:11px; border-color:#EF4444; color:#EF4444" (click)="deleteLesson(lesson)">
                      Delete
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      @if (showDrafts()) {
        <div class="card" style="margin-top:16px; border-left: 4px solid #F59E0B">
          <h3 class="st" style="font-size:16px; margin-bottom:12px; color:#F59E0B">Drafts</h3>
          @if (drafts().length === 0) {
            <div style="font-size:13px; color:var(--text-secondary); text-align:center; padding:16px 0">
              No drafts saved.
            </div>
          } @else {
            <table style="width:100%; border-collapse:collapse; font-size:12px">
              <thead>
                <tr style="text-align:left; border-bottom:2px solid var(--border-weak); color:var(--text-muted)">
                  <th style="padding:8px">Title</th>
                  <th style="padding:8px">Level</th>
                  <th style="padding:8px">Type</th>
                  <th style="padding:8px">Created</th>
                  <th style="padding:8px; text-align:right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (draft of drafts(); track draft.id) {
                  <tr style="border-bottom:1px solid var(--border-weak)">
                    <td style="padding:8px; font-weight:600; color:var(--text-primary)">{{ draft.title }}</td>
                    <td style="padding:8px"><span class="badge" style="background:#FEF3C7; color:#92400E">{{ draft.level }}</span></td>
                    <td style="padding:8px">{{ draft.type }}</td>
                    <td style="padding:8px; font-size:11px; color:var(--text-muted)">{{ draft.createdAt | date:'short' }}</td>
                    <td style="padding:8px; text-align:right; display:flex; gap:4px; justify-content:flex-end">
                      <button class="btn-s" style="padding:4px 8px; font-size:11px" (click)="editLesson(draft)">
                        Edit
                      </button>
                      <button class="btn-p" style="padding:4px 8px; font-size:11px; background:#10B981" (click)="publishDraft(draft.id)">
                        Publish
                      </button>
                      <button class="btn-s" style="padding:4px 8px; font-size:11px; border-color:#EF4444; color:#EF4444" (click)="deleteLesson(draft)">
                        Delete
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      }
    </div>
  `
})
export class TeacherLessonsComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  selectedLessonId = signal<string | null>(null);
  lessons = signal<Lesson[]>([]);
  drafts = signal<Lesson[]>([]);
  showDrafts = signal(false);

  title = '';
  level = 'B1';
  type = 'Grammar';
  content = '';
  vocabText = '';
  homeworkInstruction = '';
  dueDate = '';
  youtubeUrl = '';
  youtubeDescription = '';
  points = 50;

  constructor() {
    this.db.observeLessons().subscribe(list => {
      this.lessons.set(list.filter(l => l.status === 'published'));
      this.drafts.set(list.filter(l => l.status === 'draft'));
    });
  }

  deleteLesson(lesson: Lesson) {
    this.dialogService.confirm(
      'Delete Lesson',
      `Are you sure you want to delete the lesson "${lesson.title}"?`,
      () => {
        this.db.deleteLesson(lesson.id);
        this.dialogService.alert('Deleted', 'Lesson deleted successfully!', 'success');
        if (this.selectedLessonId() === lesson.id) {
          this.resetForm();
        }
      }
    );
  }

  isValid() {
    return this.title.trim() && this.content.trim() && this.homeworkInstruction.trim() && this.dueDate;
  }

  saveAsDraft() {
    if (!this.title.trim()) return;

    const vocabulary = this.vocabText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const currentUser = this.db['currentUser$'].value;
    const lessonData = {
      title: this.title,
      level: this.level,
      type: this.type,
      content: this.content,
      vocabulary,
      homeworkInstruction: this.homeworkInstruction,
      dueDate: this.dueDate,
      status: 'draft' as const,
      authorId: currentUser?.id,
      authorName: currentUser?.name,
      youtubeUrl: this.youtubeUrl,
      youtubeDescription: this.youtubeDescription,
      points: this.points
    };

    const id = this.selectedLessonId();
    if (id) {
      this.db.updateLesson(id, lessonData);
      this.dialogService.alert('Success', 'Draft updated successfully!', 'success');
    } else {
      this.db.addLesson(lessonData);
      this.dialogService.alert('Success', 'Draft saved successfully!', 'success');
    }
    this.resetForm();
  }

  publishDraft(draftId: string) {
    this.db.updateLesson(draftId, { status: 'published' });
    this.dialogService.alert('Success', 'Lesson published successfully!', 'success');
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
    this.youtubeUrl = lesson.youtubeUrl || '';
    this.youtubeDescription = lesson.youtubeDescription || '';
    this.points = lesson.points || 50;
  }

  publishLesson() {
    if (!this.isValid()) return;

    // Parse vocabulary
    const vocabulary = this.vocabText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const currentUser = this.db['currentUser$'].value;
    const lessonData = {
      title: this.title,
      level: this.level,
      type: this.type,
      content: this.content,
      vocabulary,
      homeworkInstruction: this.homeworkInstruction,
      dueDate: this.dueDate,
      status: 'published' as const,
      authorId: currentUser?.id,
      authorName: currentUser?.name,
      youtubeUrl: this.youtubeUrl,
      youtubeDescription: this.youtubeDescription,
      points: this.points
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
    this.youtubeUrl = '';
    this.youtubeDescription = '';
    this.points = 50;
  }
}