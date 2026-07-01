import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Quiz, Exercise, ExerciseType, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

interface QuestionDraft {
  question: string;
  questionType: 'multiple_choice' | 'true_false' | 'fill_blank' | 'matching' | 'ordering' | 'short_answer' | 'essay' | 'audio' | 'image';
  options: string[];
  correctOption: string;
  matchPairs?: { left: string; right: string }[];
  orderItems?: string[];
  imageUrl?: string;
  audioPrompt?: string;
}

@Component({
  selector: 'app-teacher-quizzes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <!-- Tab Selector -->
      <div class="tab-row">
        <button class="tab" [class.active]="activeTab() === 'create'" (click)="activeTab.set('create')">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {{ selectedQuizId() ? 'Modifier Quiz' : 'Créer Quiz' }}
        </button>
        <button class="tab" [class.active]="activeTab() === 'list'" (click)="activeTab.set('list')">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          Quiz Publiés ({{ quizzes().length }})
        </button>
        <button class="tab" [class.active]="activeTab() === 'drafts'" (click)="activeTab.set('drafts')">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Brouillons ({{ quizDrafts().length }})
        </button>
      </div>

      <!-- CREATE TAB -->
      @if (activeTab() === 'create') {
        <div class="card">
          <h3 class="st" style="font-size:16px; margin-bottom:16px; display:flex; align-items:center; gap:8px">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            {{ selectedQuizId() ? 'Modifier le Quiz' : 'Créer un Quiz' }}
          </h3>
          <div style="background:#EEF2FF; border:1px solid #C7D2FE; border-radius:8px; padding:10px 14px; margin-bottom:16px; font-size:12px; color:#4338CA; display:flex; align-items:center; gap:6px">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Les quiz sont utilisés pour évaluer les élèves en cours. Pour créer des exercices d'entraînement, utilisez le module <strong style="margin-left:3px">Gérer les Exercices</strong>.
          </div>

          <!-- Quick Templates -->
          <div style="background:#EEF2FF; border:1px solid #C7D2FE; border-radius:8px; padding:12px; margin-bottom:16px">
            <div style="font-size:11px; font-weight:700; color:#4F46E5; margin-bottom:8px; display:flex; align-items:center; gap:5px">
              ⭐ Modèles rapides
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap">
              <button class="badge" style="background:#FFF; border:1px solid #4F46E5; color:#4F46E5; cursor:pointer; font-size:10px; padding:4px 8px; border-radius:4px" (click)="loadQuizTemplate('grammar')">
                Verbes Irréguliers
              </button>
              <button class="badge" style="background:#FFF; border:1px solid #4F46E5; color:#4F46E5; cursor:pointer; font-size:10px; padding:4px 8px; border-radius:4px" (click)="loadQuizTemplate('vocab')">
                Vocabulaire Voyage
              </button>
              <button class="badge" style="background:#FFF; border:1px solid #4F46E5; color:#4F46E5; cursor:pointer; font-size:10px; padding:4px 8px; border-radius:4px" (click)="loadQuizTemplate('oral')">
                Oral : Week-end
              </button>
            </div>
          </div>



          <!-- Common Fields -->
          <div class="input-row">
            <label for="qTitle">Titre</label>
            <input id="qTitle" type="text" [(ngModel)]="title" placeholder="ex. Quiz Unité 9 — Reported Speech" />
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px">
            <div class="input-row" style="margin-bottom:0">
              <label for="qXp">Points XP à remporter</label>
              <input id="qXp" type="number" [(ngModel)]="points" placeholder="ex. 10, 20, 50..." />
            </div>
            <div class="input-row" style="margin-bottom:0">
              <label for="qYoutube">Lien Vidéo YouTube (Optionnel)</label>
              <input id="qYoutube" type="text" [(ngModel)]="youtubeUrl" placeholder="https://www.youtube.com/watch?v=..." />
            </div>
          </div>
          
          <div class="input-row" style="margin-bottom:12px">
            <label for="qYoutubeDesc">Description de la vidéo YouTube (Optionnel)</label>
            <textarea id="qYoutubeDesc" [(ngModel)]="youtubeDescription" rows="2" placeholder="Description ou instructions sur la vidéo..." style="width:100%; border:1px solid var(--border); border-radius:6px; padding:6px 10px; background:#FFF; color:var(--text-primary); font-size:12px"></textarea>
          </div>

          <div class="g2">
            <div class="input-row">
              <label for="qType">Type de question</label>
              <select id="qType" [(ngModel)]="type" (change)="onTypeChange()">
                <option value="Multiple Choice">Choix multiple</option>
                <option value="Fill in the blank">Complétez les blancs</option>
                <option value="True / False">Vrai / Faux</option>
                <option value="Matching">Association</option>
                <option value="Ordering">Remise en ordre</option>
                <option value="Short Answer">Réponse courte</option>
                <option value="Essay">Rédaction</option>
                <option value="Audio Question">Question audio</option>
                <option value="Oral Practice">Oral / Speaking</option>
              </select>
            </div>
            <div class="input-row">
              <label for="qLimit">Limite de temps</label>
              <select id="qLimit" [(ngModel)]="timeLimit">
                <option value="No limit">Pas de limite</option>
                <option value="10 minutes">10 minutes</option>
                <option value="15 minutes">15 minutes</option>
                <option value="20 minutes">20 minutes</option>
                <option value="30 minutes">30 minutes</option>
                <option value="45 minutes">45 minutes</option>
                <option value="60 minutes">1 heure</option>
              </select>
            </div>
          </div>

          <div class="g3">
            <div class="input-row">
              <label for="qLevel">Niveau</label>
              <select id="qLevel" [(ngModel)]="level">
                <option value="A1">A1 — Débutant</option>
                <option value="A2">A2 — Élémentaire</option>
                <option value="B1">B1 — Intermédiaire</option>
                <option value="B2">B2 — Supérieur</option>
                <option value="All">Tous niveaux</option>
              </select>
            </div>
            <div class="input-row">
              <label for="qPoints">Points</label>
              <input id="qPoints" type="number" [(ngModel)]="points" min="0" max="100" />
            </div>
            <div class="input-row">
              <label for="qStatus">Statut</label>
              <select id="qStatus" [(ngModel)]="status">
                <option value="published">Publié</option>
                <option value="draft">Brouillon</option>
              </select>
            </div>
          </div>

          <!-- Questions Builder -->
          <div style="margin-top:16px">
            <strong style="font-size:13px; color:var(--text-primary); display:block; margin-bottom:12px">Questions</strong>

            @for (q of questions; track q; let idx = $index) {
              <div class="card" style="background:var(--surface-2); margin-bottom:12px; border-color:var(--border-strong)">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
                  <span style="font-size:12px; font-weight:700; color:#4F46E5; display:flex; align-items:center; gap:6px">
                    <span style="background:#4F46E5; color:white; width:20px; height:20px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px">{{ idx + 1 }}</span>
                    Question {{ idx + 1 }}
                  </span>
                  <div style="display:flex; gap:6px">
                    <button class="btn-s" style="padding:2px 8px; font-size:10px" (click)="duplicateQuestion(idx)">Dupliquer</button>
                    @if (questions.length > 1) {
                      <button class="btn-s" style="padding:2px 8px; font-size:10px; background:#FEE2E2; color:#DC2626; border-color:#FCA5A5" (click)="removeQuestion(idx)">Supprimer</button>
                    }
                  </div>
                </div>

                <div class="input-row">
                  <label>Énoncé de la question</label>
                  <textarea [(ngModel)]="q.question" rows="2" placeholder="Saisissez votre question..." style="resize:vertical; min-height:60px"></textarea>
                </div>

                <!-- MULTIPLE CHOICE -->
                @if (type === 'Multiple Choice' || type === 'Fill in the blank') {
                  <div class="g3">
                    <div class="input-row">
                      <label>Option A</label>
                      <input type="text" [(ngModel)]="q.options[0]" placeholder="Réponse A" />
                    </div>
                    <div class="input-row">
                      <label>Option B</label>
                      <input type="text" [(ngModel)]="q.options[1]" placeholder="Réponse B" />
                    </div>
                    <div class="input-row">
                      <label>Option C</label>
                      <input type="text" [(ngModel)]="q.options[2]" placeholder="Réponse C" />
                    </div>
                  </div>
                  <div class="input-row" style="width:50%">
                    <label>Bonne réponse</label>
                    <select [(ngModel)]="q.correctOption">
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>
                }

                <!-- TRUE / FALSE -->
                @if (type === 'True / False') {
                  <div style="background:#F3F4F6; padding:10px; border-radius:6px; font-size:12px; color:var(--text-secondary); margin-bottom:8px">
                    Options verrouillées : <strong>A. True</strong> · <strong>B. False</strong>
                  </div>
                  <div class="input-row" style="width:50%">
                    <label>Bonne réponse</label>
                    <select [(ngModel)]="q.correctOption">
                      <option value="A">A — True (Vrai)</option>
                      <option value="B">B — False (Faux)</option>
                    </select>
                  </div>
                }

                <!-- MATCHING -->
                @if (type === 'Matching') {
                  <div style="margin-bottom:8px">
                    <label style="font-size:11px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:6px">Paires à associer (Gauche ↔ Droite)</label>
                    @for (pair of q.matchPairs || []; track pair; let pi = $index) {
                      <div style="display:grid; grid-template-columns:1fr 1fr 32px; gap:8px; margin-bottom:6px; align-items:center">
                        <input type="text" [(ngModel)]="pair.left" placeholder="Terme gauche" style="border:1px solid var(--border); border-radius:6px; padding:6px 10px; font-size:12px" />
                        <input type="text" [(ngModel)]="pair.right" placeholder="Correspondance droite" style="border:1px solid var(--border); border-radius:6px; padding:6px 10px; font-size:12px" />
                        @if ((q.matchPairs || []).length > 2) {
                          <button (click)="removeMatchPair(q, pi)" style="background:#FEE2E2; border:none; border-radius:4px; color:#EF4444; cursor:pointer; width:28px; height:28px; display:flex; align-items:center; justify-content:center">×</button>
                        }
                      </div>
                    }
                    <button class="btn-s" style="font-size:11px; padding:4px 12px; margin-top:4px" (click)="addMatchPair(q)">+ Ajouter une paire</button>
                  </div>
                }

                <!-- ORDERING -->
                @if (type === 'Ordering') {
                  <div style="margin-bottom:8px">
                    <label style="font-size:11px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:6px">Éléments à remettre dans l'ordre (saisissez dans le bon ordre)</label>
                    @for (item of q.orderItems || []; track item; let oi = $index) {
                      <div style="display:grid; grid-template-columns:24px 1fr 32px; gap:8px; margin-bottom:6px; align-items:center">
                        <span style="font-size:11px; font-weight:700; color:#4F46E5">{{ oi+1 }}.</span>
                        <input type="text" [(ngModel)]="(q.orderItems || [])[oi]" placeholder="Élément {{ oi+1 }}" style="border:1px solid var(--border); border-radius:6px; padding:6px 10px; font-size:12px" />
                        @if ((q.orderItems || []).length > 2) {
                          <button (click)="removeOrderItem(q, oi)" style="background:#FEE2E2; border:none; border-radius:4px; color:#EF4444; cursor:pointer; width:28px; height:28px; display:flex; align-items:center; justify-content:center">×</button>
                        }
                      </div>
                    }
                    <button class="btn-s" style="font-size:11px; padding:4px 12px; margin-top:4px" (click)="addOrderItem(q)">+ Ajouter un élément</button>
                  </div>
                }

                <!-- SHORT ANSWER / ESSAY -->
                @if (type === 'Short Answer') {
                  <div class="input-row">
                    <label>Réponse attendue (référence pour correction)</label>
                    <input type="text" [(ngModel)]="q.correctOption" placeholder="ex. The Industrial Revolution" />
                  </div>
                }

                @if (type === 'Essay') {
                  <div style="background:#F0FDF4; padding:10px; border-radius:6px; font-size:12px; color:#047857">
                    📝 Rédaction libre — L'élève écrit un texte long. Correction manuelle par le professeur.
                  </div>
                }

                <!-- AUDIO QUESTION -->
                @if (type === 'Audio Question') {
                  <div class="input-row">
                    <label>Consigne audio (prompt vocal pour l'élève)</label>
                    <textarea [(ngModel)]="q.audioPrompt" rows="2" placeholder="ex. Listen to the audio and describe what you hear..."></textarea>
                  </div>
                  <div style="background:#F0FDFA; border:1px dashed #0D9488; border-radius:6px; padding:10px; font-size:12px; color:#0F766E">
                    🎙️ L'élève devra enregistrer sa réponse vocale.
                  </div>
                }

                <!-- ORAL PRACTICE -->
                @if (type === 'Oral Practice') {
                  <div style="background:#F0FDFA; border:1px dashed #0D9488; border-radius:6px; padding:10px; font-size:12px; color:#0F766E">
                    🎙️ Exercice oral — L'élève enregistre sa réponse. Correction par le professeur.
                  </div>
                }
              </div>
            }

            <!-- ADD QUESTION — Fixed at the bottom of list -->
            <button class="add-question-btn" (click)="addQuestionDraft()">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Ajouter une question
            </button>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:20px; padding-top:16px; border-top:1px solid var(--border-weak)">
            <button class="btn-s" (click)="saveAsDraft()">
              <i class="ti ti-file"></i> Sauver comme brouillon
            </button>
            @if (selectedQuizId()) {
              <button class="btn-s" (click)="resetForm()">Annuler</button>
            }
            <button class="btn-p" [disabled]="!isValid()" (click)="publishQuiz()">
              <i class="ti ti-check"></i>
              {{ selectedQuizId() ? 'Mettre à jour' : 'Publier' }}
            </button>
          </div>
        </div>
      }

      <!-- PUBLISHED QUIZZES LIST -->
      @if (activeTab() === 'list') {
        <div>
          <!-- Placement Test Banner Box -->
          @if (getPlacementTest(); as pt) {
            <div style="background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); border: 1.5px solid #4F46E5; border-radius: 10px; padding: 14px 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; gap:12px; flex-wrap:wrap">
              <div>
                <span class="badge" style="background:#4F46E5; color:white; font-size:8px; padding:1px 5px; border-radius:20px; font-weight:700">🎯 TEST DE NIVEAU</span>
                <h4 style="font-size:13px; font-weight:800; color:#1e293b; margin:4px 0 2px 0">{{ pt.title }}</h4>
                <p style="font-size:11.5px; color:#475569; margin:0">Ce test de niveau évalue automatiquement les nouveaux élèves lors de leur première connexion.</p>
              </div>
              <button class="btn-s" style="font-size:11.5px; padding:5px 12px; border-color:#4F46E5; color:#4F46E5" (click)="editQuiz(pt)">
                <i class="ti ti-edit"></i> Configurer
              </button>
            </div>
          }

          <div class="st" style="margin-bottom:12px">Quiz publiés ({{ quizzes().length }})</div>
          @for (quiz of quizzes(); track quiz.id) {
            @if (quiz.id !== 'placement-test') {
              <div class="row" style="font-size:13px; align-items:center; justify-content:space-between">
                <div style="flex:1">
                  <strong style="color:var(--text-primary)">
                    {{ quiz.title }}
                  </strong>
                  <div style="font-size:11px; color:var(--text-muted); margin-top:2px">
                    Type: {{ quiz.type }} · Limite: {{ quiz.timeLimit }} · {{ quiz.questions.length }} questions
                  </div>
                </div>
                <div style="display:flex; gap:6px">
                  <button class="btn-s" style="font-size:11px; padding:4px 10px; border-color:#4F46E5; color:#4F46E5" (click)="editQuiz(quiz)">
                    <i class="ti ti-edit"></i> Modifier
                  </button>
                  <button class="btn-s" style="font-size:11px; padding:4px 10px; border-color:#EF4444; color:#EF4444" (click)="deleteQuiz(quiz.id)">
                    <i class="ti ti-trash"></i>
                  </button>
                </div>
              </div>
            }
          }
          @if (quizzes().length === 0) {
            <div style="font-size:12px; color:var(--text-muted); padding:20px; text-align:center; border:1px dashed var(--border); border-radius:8px">
              Aucun quiz publié. Créez votre premier quiz !
            </div>
          }
        </div>
      }




      <!-- DRAFTS LIST -->
      @if (activeTab() === 'drafts') {
        <div>
          <div class="st" style="margin-bottom:12px">Brouillons de Quiz</div>
          @if (quizDrafts().length === 0) {
            <div style="font-size:12px; color:var(--text-muted); padding:20px; text-align:center; border:1px dashed var(--border); border-radius:8px">
              Aucun brouillon de quiz.
            </div>
          }

          @for (quiz of quizDrafts(); track quiz.id) {
            <div class="row" style="font-size:13px; align-items:center; justify-content:space-between; margin-bottom:8px; border-left: 3px solid #F59E0B">
              <div style="flex:1">
                <div style="display:flex; align-items:center; gap:8px">
                  <span style="font-size:16px">📝</span>
                  <div>
                    <strong style="font-size:13px; color:var(--text-primary)">{{ quiz.title }}</strong>
                    <div style="font-size:11px; color:var(--text-muted); margin-top:2px">
                      Quiz · {{ quiz.type }} · {{ quiz.questions.length }} questions
                    </div>
                  </div>
                </div>
              </div>
              <div style="display:flex; gap:6px">
                <button class="btn-s" style="font-size:11px; padding:4px 10px; border-color:#4F46E5; color:#4F46E5" (click)="editQuiz(quiz); activeTab.set('create')">
                  <i class="ti ti-edit"></i> Éditer
                </button>
                <button class="btn-p" style="font-size:11px; padding:4px 10px; background:#10B981" (click)="publishDraft(quiz.id)">
                  <i class="ti ti-check"></i> Publier
                </button>
                <button class="btn-s" style="font-size:11px; padding:4px 10px; border-color:#EF4444; color:#EF4444" (click)="deleteDraft(quiz.id)">
                  <i class="ti ti-trash"></i>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .exercise-type-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 8px;
    }

    .exercise-type-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px 6px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--surface-1);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .exercise-type-btn:hover {
      border-color: #4F46E5;
      background: #EEF2FF;
    }

    .exercise-type-btn.active {
      border-color: #4F46E5;
      background: #EEF2FF;
      box-shadow: 0 0 0 2px rgba(79,70,229,0.15);
    }

    .et-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--text-secondary);
      text-align: center;
      line-height: 1.2;
    }

    .add-question-btn {
      width: 100%;
      border: 2px dashed #C7D2FE;
      border-radius: 8px;
      background: #F8F9FF;
      color: #4F46E5;
      font-size: 13px;
      font-weight: 600;
      padding: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
      font-family: inherit;
    }

    .add-question-btn:hover {
      background: #EEF2FF;
      border-color: #4F46E5;
    }
  `]
})
export class TeacherQuizzesComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  activeTab = signal<'create' | 'list' | 'placement' | 'drafts'>('create');
  selectedQuizId = signal<string | null>(null);
  rawQuizzes = signal<Quiz[]>([]);
  quizzes = signal<Quiz[]>([]);
  quizDrafts = signal<Quiz[]>([]);
  currentUser = signal<UserProfile | null>(null);
  selectedPlacementId = signal<string>('placement-test');

  exerciseCategory = signal<string>('quiz');

  title = '';
  type = 'Multiple Choice';
  timeLimit = '15 minutes';
  level = 'B1';
  points = 10;
  status: 'published' | 'draft' = 'published';
  youtubeUrl = '';
  youtubeDescription = '';


  exerciseTypes = [
    { value: 'quiz', emoji: '📝', label: 'Quiz' },
    { value: 'written', emoji: '✍️', label: 'Écrit' },
    { value: 'vocal', emoji: '🎙️', label: 'Vocal' },
    { value: 'translation', emoji: '🌍', label: 'Traduction' },
    { value: 'essay', emoji: '📄', label: 'Rédaction' },
    { value: 'listening', emoji: '👂', label: 'Écoute' },
    { value: 'pronunciation', emoji: '🔊', label: 'Prononciation' },
  ];

  questions: QuestionDraft[] = [
    { question: '', questionType: 'multiple_choice', options: ['', '', ''], correctOption: 'A' }
  ];

  constructor() {
    this.db.observeQuizzes().subscribe(list => {
      this.rawQuizzes.set(list);
      this.quizzes.set(list.filter(q => q.status === 'published' && !q.id.startsWith('placement-test')));
      this.quizDrafts.set(list.filter(q => q.status === 'draft' && !q.id.startsWith('placement-test')));
    });
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
  }

  setExerciseCategory(val: string) {
    this.exerciseCategory.set(val);
    if (val !== 'quiz') {
      if (val === 'vocal' || val === 'pronunciation') this.type = 'Oral Practice';
      else if (val === 'essay') this.type = 'Essay';
      else if (val === 'listening') this.type = 'Audio Question';
      else if (val === 'translation') this.type = 'Fill in the blank';
    } else {
      this.type = 'Multiple Choice';
    }
  }

  onTypeChange() {
    if (this.type === 'True / False') {
      this.questions.forEach(q => { q.options = ['True', 'False', '']; q.correctOption = 'A'; });
    } else if (this.type === 'Matching') {
      this.questions.forEach(q => { q.matchPairs = [{ left: '', right: '' }, { left: '', right: '' }]; });
    } else if (this.type === 'Ordering') {
      this.questions.forEach(q => { q.orderItems = ['', '', '']; });
    }
  }

  addQuestionDraft() {
    const opts = this.type === 'True / False' ? ['True', 'False', ''] : ['', '', ''];
    const q: QuestionDraft = { question: '', questionType: 'multiple_choice', options: opts, correctOption: 'A' };
    if (this.type === 'Matching') q.matchPairs = [{ left: '', right: '' }, { left: '', right: '' }];
    if (this.type === 'Ordering') q.orderItems = ['', '', ''];
    this.questions.push(q);
    setTimeout(() => {
      const el = document.querySelector('.add-question-btn');
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }

  removeQuestion(idx: number) {
    if (this.questions.length > 1) this.questions.splice(idx, 1);
  }

  duplicateQuestion(idx: number) {
    const q = this.questions[idx];
    this.questions.splice(idx + 1, 0, {
      question: q.question ? `${q.question} (copie)` : '',
      questionType: q.questionType,
      options: [...q.options],
      correctOption: q.correctOption,
      matchPairs: q.matchPairs ? q.matchPairs.map(p => ({ ...p })) : undefined,
      orderItems: q.orderItems ? [...q.orderItems] : undefined
    });
  }

  addMatchPair(q: QuestionDraft) {
    if (!q.matchPairs) q.matchPairs = [];
    q.matchPairs.push({ left: '', right: '' });
  }

  removeMatchPair(q: QuestionDraft, idx: number) {
    if (q.matchPairs && q.matchPairs.length > 2) q.matchPairs.splice(idx, 1);
  }

  addOrderItem(q: QuestionDraft) {
    if (!q.orderItems) q.orderItems = [];
    q.orderItems.push('');
  }

  removeOrderItem(q: QuestionDraft, idx: number) {
    if (q.orderItems && q.orderItems.length > 2) q.orderItems.splice(idx, 1);
  }

  isValid() {
    if (!this.title.trim()) return false;
    if (this.type === 'Oral Practice' || this.type === 'Essay') {
      return this.questions.every(q => q.question.trim().length > 0);
    }
    return this.questions.every(q => q.question.trim().length > 0);
  }

  saveAsDraft() {
    if (!this.title.trim()) return;

    const user = this.currentUser();
    const quizData: any = {
      title: this.title,
      type: this.type,
      timeLimit: this.timeLimit,
      level: this.level,
      points: this.points,
      status: 'draft',
      authorId: user?.id || 'teacher',
      authorName: user?.name || 'Teacher',
      youtubeUrl: this.youtubeUrl,
      youtubeDescription: this.youtubeDescription,
      questions: this.questions.map(q => ({
        question: q.question,
        options: this.type === 'Oral Practice' || this.type === 'Essay' ? [] : q.options.filter(o => o.trim().length > 0),
        correctOption: (this.type === 'Oral Practice' || this.type === 'Essay') ? 'A' : q.correctOption,
        matchPairs: q.matchPairs,
        orderItems: q.orderItems,
        audioPrompt: q.audioPrompt
      }))
    };

    const id = this.selectedQuizId();
    if (id) {
      this.db.updateQuiz(id, quizData);
      this.dialogService.alert('Succès', 'Brouillon mis à jour !', 'success');
    } else {
      this.db.addQuiz(quizData);
      this.dialogService.alert('Succès', 'Brouillon sauvegardé !', 'success');
    }
    this.resetForm();
  }

  editQuiz(quiz: Quiz) {
    this.selectedQuizId.set(quiz.id);
    this.title = quiz.title;
    this.type = quiz.type;
    this.timeLimit = quiz.timeLimit;
    this.level = quiz.level || 'B1';
    this.points = quiz.points || 10;
    this.status = quiz.status || 'published';
    this.youtubeUrl = quiz.youtubeUrl || '';
    this.youtubeDescription = quiz.youtubeDescription || '';
    this.questions = quiz.questions.map(q => ({
      question: q.question,
      questionType: 'multiple_choice' as any,
      options: [q.options[0] || '', q.options[1] || '', q.options[2] || ''],
      correctOption: q.correctOption
    }));
    this.activeTab.set('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async deleteQuiz(id: string) {
    this.dialogService.confirm('Supprimer le quiz', 'Êtes-vous sûr de vouloir supprimer ce quiz ?', async () => {
      await this.db.deleteQuiz(id);
      this.dialogService.alert('Supprimé', 'Quiz supprimé avec succès.', 'success');
    });
  }

  publishDraft(id: string) {
    this.db.updateQuiz(id, { status: 'published' });
    this.dialogService.alert('Succès', 'Quiz publié avec succès !', 'success');
  }

  async deleteDraft(id: string) {
    this.dialogService.confirm('Supprimer', 'Êtes-vous sûr de vouloir supprimer ce brouillon ?', async () => {
      await this.db.deleteQuiz(id);
      this.dialogService.alert('Supprimé', 'Brouillon supprimé.', 'success');
    });
  }

  publishQuiz() {
    if (!this.isValid()) return;

    const user = this.currentUser();
    const quizData: any = {
      title: this.title,
      type: this.type,
      timeLimit: this.timeLimit,
      level: this.level,
      points: this.points,
      status: this.status,
      authorId: user?.id || 'teacher',
      authorName: user?.name || 'Teacher',
      youtubeUrl: this.youtubeUrl,
      youtubeDescription: this.youtubeDescription,
      questions: this.questions.map(q => ({
        question: q.question,
        options: this.type === 'Oral Practice' || this.type === 'Essay' ? [] : q.options.filter(o => o.trim().length > 0),
        correctOption: (this.type === 'Oral Practice' || this.type === 'Essay') ? 'A' : q.correctOption,
        matchPairs: q.matchPairs,
        orderItems: q.orderItems,
        audioPrompt: q.audioPrompt
      }))
    };

    const id = this.selectedQuizId();

    if (this.exerciseCategory() !== 'quiz') {
      const exerciseData = {
        title: this.title,
        type: this.exerciseCategory() as any,
        level: this.level,
        authorId: user?.id || 'teacher',
        authorName: user?.name || 'Teacher',
        status: this.status as 'published' | 'draft',
        points: this.points
      };
      this.db.addExercise(exerciseData);
    }

    if (id) {
      this.db.updateQuiz(id, quizData);
      this.dialogService.alert('Succès', 'Quiz mis à jour avec succès !', 'success');
    } else {
      this.db.addQuiz(quizData);
      this.dialogService.alert('Succès', 'Quiz publié avec succès !', 'success');

      if (this.status === 'published') {
        this.db.sendNotification({
          recipientId: 'all',
          recipientRole: 'student',
          type: 'quiz_available',
          title: '📝 Nouveau quiz disponible',
          message: `"${this.title}" a été publié par ${user?.name || 'votre professeur'}`,
        });
      }
    }
    this.resetForm();
  }

  resetForm() {
    this.selectedQuizId.set(null);
    this.title = '';
    this.type = 'Multiple Choice';
    this.level = 'B1';
    this.points = 10;
    this.status = 'published';
    this.youtubeUrl = '';
    this.youtubeDescription = '';
    this.questions = [{ question: '', questionType: 'multiple_choice', options: ['', '', ''], correctOption: 'A' }];
  }

  loadQuizTemplate(topic: string) {
    if (topic === 'grammar') {
      this.title = 'Grammar: Verbes Irréguliers (Passé Simple)';
      this.type = 'Multiple Choice';
      this.questions = [
        { question: 'Quelle est la forme au passé du verbe "write"?', questionType: 'multiple_choice', options: ['writed', 'wrote', 'written'], correctOption: 'B' },
        { question: '"She has ______ all her tea."', questionType: 'multiple_choice', options: ['drank', 'drunk', 'drinked'], correctOption: 'B' },
        { question: 'Passé du verbe "go"?', questionType: 'multiple_choice', options: ['went', 'gone', 'goed'], correctOption: 'A' }
      ];
    } else if (topic === 'vocab') {
      this.title = 'Vocabulaire : Voyage & Aéroport';
      this.type = 'Multiple Choice';
      this.questions = [
        { question: 'Où récupère-t-on ses bagages après le vol ?', questionType: 'multiple_choice', options: ['Duty free shop', 'Baggage claim area', 'Check-in desk'], correctOption: 'B' },
        { question: 'Quel document présente-t-on pour embarquer ?', questionType: 'multiple_choice', options: ['Boarding pass', 'Receipt', 'Driver\'s license'], correctOption: 'A' }
      ];
    } else if (topic === 'oral') {
      this.title = 'Oral : Décrivez votre week-end';
      this.type = 'Oral Practice';
      this.questions = [
        { question: 'Décrivez ce que vous avez fait ce week-end. Parlez pendant au moins 30 secondes.', questionType: 'multiple_choice', options: [], correctOption: 'A' },
        { question: 'Quels sont vos projets pour le prochain dimanche ?', questionType: 'multiple_choice', options: [], correctOption: 'A' }
      ];
    }
  }


  getExerciseEmoji(type: string): string {
    const map: Record<string, string> = {
      quiz: '📝', written: '✍️', vocal: '🎙️', translation: '🌍', essay: '📄', listening: '👂', pronunciation: '🔊'
    };
    return map[type] || '📝';
  }

  getExerciseLabel(type: string): string {
    const map: Record<string, string> = {
      quiz: 'Quiz', written: 'Exercice écrit', vocal: 'Exercice vocal', translation: 'Traduction', essay: 'Rédaction', listening: 'Écoute', pronunciation: 'Prononciation'
    };
    return map[type] || type;
  }

  getPlacementTest(): Quiz | undefined {
    return this.rawQuizzes().find(q => q.id === this.selectedPlacementId());
  }

  getOptionLetter(idx: number): string {
    return ['A', 'B', 'C', 'D'][idx] || 'A';
  }
}