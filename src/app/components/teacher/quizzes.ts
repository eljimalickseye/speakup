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
        
        <!-- Quick Templates helper buttons -->
        <div style="background:#EEF2FF; border:1px solid #C7D2FE; border-radius:8px; padding:12px; margin-bottom:16px; display:flex; flex-direction:column; gap:8px">
          <div style="font-size:11px; font-weight:700; color:#4F46E5; display:flex; align-items:center; gap:5px">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m12 3-1.912 5.886H3.886L9.773 13l-1.911 5.886L12 15l4.138 3.886-1.911-5.886 5.886-4.114h-6.202L12 3z"/></svg>
            <span>Auto-Populate Quiz Topic Templates</span>
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap">
            <button class="badge" style="background:#FFF; border:1px solid #4F46E5; color:#4F46E5; cursor:pointer; font-size:10px; padding:4px 8px; border-radius:4px" (click)="loadQuizTemplate('grammar')">
              Irregular Verbs (Past Simple)
            </button>
            <button class="badge" style="background:#FFF; border:1px solid #4F46E5; color:#4F46E5; cursor:pointer; font-size:10px; padding:4px 8px; border-radius:4px" (click)="loadQuizTemplate('vocab')">
              Travel & Airport Terminal Vocab
            </button>
            <button class="badge" style="background:#FFF; border:1px solid #4F46E5; color:#4F46E5; cursor:pointer; font-size:10px; padding:4px 8px; border-radius:4px" (click)="loadQuizTemplate('oral')">
              Oral: Weekend Description
            </button>
          </div>
        </div>

        <!-- AI Questions Generator Box -->
        <div style="background:#FAF5FF; border:1px solid #E9D5FF; border-radius:8px; padding:12px; margin-bottom:16px; display:flex; flex-direction:column; gap:8px">
          <div style="font-size:11px; font-weight:700; color:#7E22CE; display:flex; align-items:center; gap:5px">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>🤖 AI Quiz Builder Assistant</span>
          </div>
          <div style="display:flex; gap:8px; width:100%">
            <input type="text" [(ngModel)]="aiTopic" placeholder="Enter topic: e.g. Airport Vocab, Simple Past, Job Interview..." style="flex:1; height:34px; padding:0 10px; font-size:12px; border:1px solid var(--border); border-radius:6px; background:#FFF; color:var(--text-primary)" />
            <button class="btn-p" [disabled]="!aiTopic.trim() || aiLoading()" (click)="generateQuizWithAI()" style="height:34px; padding:0 14px; font-size:12px; background:#7E22CE; border-color:#7E22CE; color:white; display:flex; align-items:center; gap:4px">
              @if (aiLoading()) {
                <span>Generating...</span>
              } @else {
                <span>Generate Questions</span>
              }
            </button>
          </div>
        </div>

        <div class="input-row">
          <label for="qTitle">Quiz Title</label>
          <input id="qTitle" type="text" [(ngModel)]="title" placeholder="e.g., Unit 9 — Reported speech quiz" />
        </div>

        <div class="g2">
          <div class="input-row">
            <label for="qType">Quiz Type</label>
            <select id="qType" [(ngModel)]="type" (change)="onTypeChange()">
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
            <button class="btn-s" style="font-size:11px; padding:4px 10px; display:flex; align-items:center; gap:4px" (click)="addQuestionDraft()">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Add Question</span>
            </button>
          </div>

          @for (q of questions; track q; let idx = $index) {
            <div class="card" style="background:var(--surface-2); margin-bottom:10px; border-color:var(--border-strong)">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                <span style="font-size:12px; font-weight:600; color:#4F46E5">Question {{ idx + 1 }}</span>
                <div style="display:flex; gap:6px">
                  <button class="btn-s" style="padding:2px 8px; font-size:10px; border-color:#CBD5E1; color:var(--text-secondary)" (click)="duplicateQuestion(idx)">
                    Duplicate
                  </button>
                  @if (questions.length > 1) {
                    <button class="btn-s" style="padding:2px 8px; font-size:10px; background:#FEE2E2; color:#DC2626; border-color:#FCA5A5" (click)="removeQuestion(idx)">
                      Delete
                    </button>
                  }
                </div>
              </div>

              <div class="input-row">
                <label>Question Text</label>
                <input type="text" [(ngModel)]="q.question" placeholder="e.g. Which word means 'penser'?" />
              </div>

              @if (type !== 'Oral Practice') {
                @if (type === 'True / False') {
                  <div class="g2">
                    <div class="input-row">
                      <label>Option A (Locked)</label>
                      <input type="text" value="True" disabled style="background:var(--surface-3); color:var(--text-muted)" />
                    </div>
                    <div class="input-row">
                      <label>Option B (Locked)</label>
                      <input type="text" value="False" disabled style="background:var(--surface-3); color:var(--text-muted)" />
                    </div>
                  </div>
                  
                  <div class="input-row" style="width:50%">
                    <label>Correct Option</label>
                    <select [(ngModel)]="q.correctOption">
                      <option value="A">A (True)</option>
                      <option value="B">B (False)</option>
                    </select>
                  </div>
                } @else {
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
            <button class="btn-s" style="font-size:11px; padding:4px 10px; border-color:#4F46E5; color:#4F46E5; display:flex; align-items:center; gap:4px" (click)="editQuiz(quiz)">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <span>Edit</span>
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
  
  aiTopic = '';
  aiLoading = signal<boolean>(false);
  
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

  onTypeChange() {
    if (this.type === 'True / False') {
      this.questions.forEach(q => {
        q.options = ['True', 'False', ''];
        q.correctOption = 'A';
      });
    } else if (this.type === 'Oral Practice') {
      this.questions.forEach(q => {
        q.options = ['', '', ''];
        q.correctOption = 'A';
      });
    }
  }

  addQuestionDraft() {
    const opts = this.type === 'True / False' ? ['True', 'False', ''] : ['', '', ''];
    this.questions.push({
      question: '',
      options: opts,
      correctOption: 'A'
    });
  }

  duplicateQuestion(idx: number) {
    const q = this.questions[idx];
    this.questions.splice(idx + 1, 0, {
      question: q.question ? `${q.question} (Copy)` : '',
      options: [...q.options],
      correctOption: q.correctOption
    });
  }

  loadQuizTemplate(topic: string) {
    if (topic === 'grammar') {
      this.title = 'Grammar Challenge: Irregular Verbs (Past Simple)';
      this.type = 'Multiple Choice';
      this.timeLimit = '15 minutes';
      this.questions = [
        {
          question: 'What is the past simple form of the verb "write"?',
          options: ['writed', 'wrote', 'written'],
          correctOption: 'B'
        },
        {
          question: 'Choose the correct form: "She has ______ all her tea."',
          options: ['drank', 'drunk', 'drinked'],
          correctOption: 'B'
        },
        {
          question: 'What is the past simple form of the verb "go"?',
          options: ['went', 'gone', 'goed'],
          correctOption: 'A'
        }
      ];
    } else if (topic === 'vocab') {
      this.title = 'Vocabulary test: Travel & Airport Terminal';
      this.type = 'Multiple Choice';
      this.timeLimit = '15 minutes';
      this.questions = [
        {
          question: 'Where do you collect your suitcases after your flight lands?',
          options: ['Duty free shop', 'Baggage claim area', 'Check-in desk'],
          correctOption: 'B'
        },
        {
          question: 'What document do you show to board the aircraft?',
          options: ['Boarding pass', 'Receipt', 'Driver\'s license'],
          correctOption: 'A'
        },
        {
          question: 'A flight that travels to another country is called an ______ flight.',
          options: ['internal', 'domestic', 'international'],
          correctOption: 'C'
        }
      ];
    } else if (topic === 'oral') {
      this.title = 'Oral Practice: Describe Your Last Weekend';
      this.type = 'Oral Practice';
      this.timeLimit = 'No limit';
      this.questions = [
        {
          question: 'Describe what you did last weekend. Speak for at least 30 seconds.',
          options: ['', '', ''],
          correctOption: 'A'
        },
        {
          question: 'What are your plans for next Sunday? Articulately describe them.',
          options: ['', '', ''],
          correctOption: 'A'
        }
      ];
    }
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
    if (this.type === 'True / False') {
      return this.questions.every(q => q.question.trim() && q.options[0] === 'True' && q.options[1] === 'False');
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

  async generateQuizWithAI() {
    if (!this.aiTopic.trim()) return;

    if (!this.db.getGeminiApiKey()) {
      const key = prompt('Google Gemini API Key is required to run real AI features.\nPlease enter your Gemini API Key (get a free key from https://aistudio.google.com/):');
      if (key && key.trim()) {
        this.db.setGeminiApiKey(key);
      } else {
        return;
      }
    }

    this.aiLoading.set(true);

    const systemInstruction = `You are the SpeakUp Teacher Quiz Assistant. Generate questions for a quiz based on the user's topic.
    Generate a JSON array of questions matching this format:
    [
      {
        "question": "Question text...",
        "options": ["Option A", "Option B", "Option C"],
        "correctOption": "A"
      }
    ]
    Rules:
    - For "Multiple Choice", return 3 options and correctOption ("A", "B", or "C").
    - For "True / False", return 2 options: ["True", "False"] and correctOption ("A" or "B").
    - For "Fill in the blank", return 3 options and correctOption ("A", "B" or "C").
    - For "Oral Practice", return empty options ["", "", ""] and correctOption "A".
    Do not wrap the response in markdown code blocks. Return ONLY the JSON array.`;

    const promptText = `Topic: "${this.aiTopic.trim()}"\nQuiz Type: "${this.type}"`;

    try {
      const res = await this.db.callGemini(systemInstruction, promptText);
      const data = JSON.parse(res);
      this.questions = data;
      this.title = `AI Generated Quiz: ${this.aiTopic.trim()}`;
      this.aiTopic = '';
      this.dialogService.alert('AI Quiz Generated', `Successfully generated ${data.length} custom questions!`, 'success');
    } catch(e: any) {
      console.error(e);
      if (e.message === 'MISSING_API_KEY') {
        this.dialogService.alert('API Key Required', 'Please configure your Gemini API Key.', 'info');
      } else {
        this.dialogService.alert('AI Generation Failed', e.message || 'Error occurred while contacting Gemini API.', 'info');
      }
    } finally {
      this.aiLoading.set(false);
    }
  }
}
