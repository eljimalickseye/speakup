import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Quiz } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

interface QuestionDraft {
  question: string;
  options: string[];
  correctOption: string;
}

@Component({
  selector: 'app-teacher-quizzes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="card">
        <h3 class="st" style="font-size:16px; margin-bottom:12px">Create New English Quiz</h3>
        
        <div class="input-row">
          <label for="qTitle">Quiz Title</label>
          <input id="qTitle" type="text" [(ngModel)]="title" placeholder="e.g., Unit 9 — Reported speech quiz" />
        </div>

        <div class="g2">
          <div class="input-row">
            <label for="qType">Quiz Type</label>
            <select id="qType" [(ngModel)]="type">
              <option value="Multiple Choice">Multiple choice</option>
              <option value="Fill in the blank">Fill in the blank</option>
              <option value="True / False">True / False</option>
              <option value="Oral Practice">Oral / Speaking Practice</option>
            </select>
          </div>
          <div class="input-row">
            <label for="qLimit">Time Limit</label>
            <select id="qLimit" [(ngModel)]="timeLimit">
              <option value="No limit">No limit</option>
              <option value="10 minutes">10 minutes</option>
              <option value="15 minutes">15 minutes</option>
              <option value="20 minutes">20 minutes</option>
              <option value="30 minutes">30 minutes</option>
            </select>
          </div>
        </div>

        <!-- Question drafts builder list -->
        <div style="margin-top:16px">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
            <strong style="font-size:13px; color:var(--text-primary)">Quiz Questions</strong>
            <button class="btn-s" style="font-size:11px; padding:4px 10px" (click)="addQuestionDraft()">
              <i class="ti ti-plus"></i> Add Question
            </button>
          </div>

          @for (q of questions; track q; let idx = $index) {
            <div class="card" style="background:var(--surface-2); margin-bottom:10px; border-color:var(--border-strong)">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                <span style="font-size:12px; font-weight:600; color:#4F46E5">Question {{ idx + 1 }}</span>
                @if (questions.length > 1) {
                  <button class="btn-s" style="padding:2px 8px; font-size:10px; background:#FEE2E2; color:#DC2626; border-color:#FCA5A5" (click)="removeQuestion(idx)">
                    Delete
                  </button>
                }
              </div>

              <div class="input-row">
                <label>Question Text</label>
                <input type="text" [(ngModel)]="q.question" placeholder="e.g. Which word means 'penser'?" />
              </div>

              @if (type !== 'Oral Practice') {
                <div class="g3">
                  <div class="input-row">
                    <label>Option A</label>
                    <input type="text" [(ngModel)]="q.options[0]" placeholder="e.g. think" />
                  </div>
                  <div class="input-row">
                    <label>Option B</label>
                    <input type="text" [(ngModel)]="q.options[1]" placeholder="e.g. read" />
                  </div>
                  <div class="input-row">
                    <label>Option C</label>
                    <input type="text" [(ngModel)]="q.options[2]" placeholder="e.g. write" />
                  </div>
                </div>

                <div class="input-row" style="width:50%">
                  <label>Correct Option</label>
                  <select [(ngModel)]="q.correctOption">
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
              }
            </div>
          }
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:16px">
          <button class="btn-p" [disabled]="!isValid()" (click)="publishQuiz()">
            {{ selectedQuizId() ? 'Update Quiz' : 'Publish Quiz' }}
          </button>
          @if (selectedQuizId()) {
            <button class="btn-s" (click)="resetForm()">Cancel Edit</button>
          }
        </div>
      </div>

      <!-- PUBLISHED QUIZZES LIST -->
      <div style="margin-top:20px">
        <div class="st" style="margin-bottom:12px">Published Quizzes</div>
        @for (quiz of quizzes(); track quiz.id) {
          <div class="row" style="font-size:13px; align-items:center; justify-content:space-between" [style.background]="quiz.id === 'placement-test' ? '#EFF6FF' : 'var(--surface-1)'" [style.border]="quiz.id === 'placement-test' ? '1.5px solid #93C5FD' : '1px solid var(--border)'">
            <div style="flex:1">
              <strong style="color:var(--text-primary)">
                {{ quiz.title }}
                @if (quiz.id === 'placement-test') {
                  <span class="badge" style="background:#3B82F6; color:white; font-size:9px; margin-left:6px; font-weight:700; padding:1px 6px; border-radius:10px; text-transform:uppercase">Placement Test</span>
                }
              </strong>
              <div style="font-size:11px; color:var(--text-muted); margin-top:2px">
                Type: {{ quiz.type }} · Limit: {{ quiz.timeLimit }} · Questions: {{ quiz.questions.length }}
              </div>
            </div>
            <button class="btn-s" style="font-size:11px; padding:4px 10px; border-color:#4F46E5; color:#4F46E5" (click)="editQuiz(quiz)">
              <i class="ti ti-edit"></i> Edit
            </button>
          </div>
        }
        @if (quizzes().length === 0) {
          <div style="font-size:12px; color:var(--text-muted); padding:10px">
            No quizzes published yet.
          </div>
        }
      </div>
    </div>
  `
})
export class TeacherQuizzesComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  selectedQuizId = signal<string | null>(null);
  quizzes = signal<Quiz[]>([]);

  title = 'Vocabulary quiz — Unit 9';
  type = 'Multiple Choice';
  timeLimit = '15 minutes';
  
  questions: QuestionDraft[] = [
    {
      question: 'Which English word means "penser"?',
      options: ['think', 'say', 'answer'],
      correctOption: 'A'
    },
    {
      question: 'What is the correct translation of "information" in French?',
      options: ['réponse', 'information', 'question'],
      correctOption: 'B'
    }
  ];

  constructor() {
    this.db.observeQuizzes().subscribe(list => this.quizzes.set(list));
  }

  addQuestionDraft() {
    this.questions.push({
      question: '',
      options: ['', '', ''],
      correctOption: 'A'
    });
  }

  removeQuestion(idx: number) {
    if (this.questions.length > 1) {
      this.questions.splice(idx, 1);
    }
  }

  isValid() {
    if (!this.title.trim()) return false;
    if (this.type === 'Oral Practice') {
      return this.questions.every(q => q.question.trim().length > 0);
    }
    return this.questions.every(q => q.question.trim() && q.options[0].trim() && q.options[1].trim() && q.options[2].trim());
  }

  editQuiz(quiz: Quiz) {
    this.selectedQuizId.set(quiz.id);
    this.title = quiz.title;
    this.type = quiz.type;
    this.timeLimit = quiz.timeLimit;
    this.questions = quiz.questions.map(q => ({
      question: q.question,
      options: [q.options[0] || '', q.options[1] || '', q.options[2] || ''],
      correctOption: q.correctOption
    }));
  }

  publishQuiz() {
    if (!this.isValid()) return;

    const quizData = {
      title: this.title,
      type: this.type,
      timeLimit: this.timeLimit,
      questions: this.questions.map(q => ({
        question: q.question,
        options: this.type === 'Oral Practice' ? [] : q.options.filter(o => o.trim().length > 0),
        correctOption: this.type === 'Oral Practice' ? 'A' : q.correctOption
      }))
    };

    const id = this.selectedQuizId();
    if (id) {
      this.db.updateQuiz(id, quizData);
      this.dialogService.alert('Success', 'English Quiz updated successfully!', 'success');
    } else {
      this.db.addQuiz(quizData);
      this.dialogService.alert('Success', 'English Quiz published successfully!', 'success');
    }
    this.resetForm();
  }

  resetForm() {
    this.selectedQuizId.set(null);
    this.title = '';
    this.questions = [
      { question: '', options: ['', '', ''], correctOption: 'A' }
    ];
  }
}
