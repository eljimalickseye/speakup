import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Quiz, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

interface QuestionDraft {
  question: string;
  options: string[];
  correctOption: string;
}

@Component({
  selector: 'app-teacher-placement-tests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="padding: 20px; max-width: 1000px; margin: 0 auto;">
      
      <!-- TAB SELECTORS -->
      <div class="tab-row" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border-weak); padding-bottom: 10px;">
        <button class="tab" [class.active]="activeTab() === 'manage'" (click)="activeTab.set('manage')"
                style="padding: 10px 16px; border: none; background: none; cursor: pointer; font-weight: 600; transition: all 0.2s; border-bottom: 2px solid transparent; display: flex; align-items: center; gap: 6px;"
                [style.color]="activeTab() === 'manage' ? 'var(--text-primary)' : 'var(--text-muted)'"
                [style.border-bottom-color]="activeTab() === 'manage' ? '#4F46E5' : 'transparent'">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
          {{ t('Gérer les Tests de Niveau', 'Configure Placement Tests') }}
        </button>
        <button class="tab" [class.active]="activeTab() === 'results'" (click)="activeTab.set('results')"
                style="padding: 10px 16px; border: none; background: none; cursor: pointer; font-weight: 600; transition: all 0.2s; border-bottom: 2px solid transparent; display: flex; align-items: center; gap: 6px;"
                [style.color]="activeTab() === 'results' ? 'var(--text-primary)' : 'var(--text-muted)'"
                [style.border-bottom-color]="activeTab() === 'results' ? '#4F46E5' : 'transparent'">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          {{ t('Résultats des Candidats', 'Candidates Results') }}
          @if (unassignedCount() > 0) {
            <span class="badge" style="background:#EF4444; color:white; font-size:10px; padding:2px 8px; border-radius:20px; margin-left:4px">{{ unassignedCount() }}</span>
          }
        </button>
      </div>

      <!-- TAB 1: MANAGE PLACEMENT TESTS -->
      @if (activeTab() === 'manage') {
        <div>
          <!-- Category Chips -->
          <div style="display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 8px;">
            @for (cat of categories; track cat.id) {
              <button (click)="selectedPlacementId.set(cat.id)"
                      style="padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; cursor: pointer; border: 1.5px solid; transition: all 0.2s; display: flex; align-items: center; gap: 6px; white-space: nowrap;"
                      [style.background]="selectedPlacementId() === cat.id ? '#4F46E5' : 'var(--surface-1)'"
                      [style.border-color]="selectedPlacementId() === cat.id ? '#4F46E5' : 'var(--border)'"
                      [style.color]="selectedPlacementId() === cat.id ? '#fff' : 'var(--text-secondary)'">
                <span [innerHTML]="getCategorySvg(cat.id)" style="display:flex; align-items:center"></span>
                <span>{{ cat.label }}</span>
              </button>
            }
          </div>

          @if (getPlacementTest(); as pt) {
            <!-- Test Title Panel -->
            <div style="background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); border: 1.5px solid #4F46E5; border-radius: 12px; padding: 24px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.05);">
              <div>
                <span class="badge" style="background:#4F46E5; color:white; font-size:10px; padding:4px 10px; border-radius:20px; font-weight:700; text-transform:uppercase;">
                  {{ t('TEST ACTIF', 'ACTIVE TEST') }}
                </span>
                <h3 style="font-size:18px; font-weight:800; color:#1e293b; margin:8px 0 4px 0">{{ pt.title }}</h3>
                <p style="font-size:12.5px; color:#475569; margin:0; max-width: 500px">
                  {{ t("Ce test de niveau est configurable. Vous pouvez en définir les questions et les réponses pour évaluer les nouveaux élèves lors de leur première connexion.", "This placement test is fully configurable. You can define the questions and answers to evaluate new students when they first connect.") }}
                </p>
              </div>
              <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5; font-size:13px; padding:10px 20px; font-weight: 700; display:flex; align-items:center; gap:6px" (click)="startEditing(pt)">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                {{ t('Configurer les Questions', 'Configure Questions') }}
              </button>
            </div>

            <!-- Questions list -->
            <div style="display:flex; flex-direction:column; gap:12px">
              @for (q of pt.questions; track q.question; let idx = $index) {
                <div style="background: var(--surface-1); border: 1px solid var(--border); padding: 16px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.02)">
                  <div style="font-weight: 700; font-size: 13.5px; color: var(--text-primary); display:flex; gap:6px; align-items:flex-start">
                    <span style="color:#4F46E5">Q{{ idx + 1 }}.</span>
                    <span>{{ q.question }}</span>
                  </div>
                  @if (q.options && q.options.length > 0) {
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin-top: 12px">
                      @for (opt of q.options; track opt; let oIdx = $index) {
                        <div style="font-size: 12px; padding: 8px 12px; border-radius: 8px; border: 1.5px solid var(--border-weak); display:flex; align-items:center; gap:6px"
                             [style.background]="getOptionLetter(oIdx) === q.correctOption ? '#ECFDF5' : 'var(--surface-1)'"
                             [style.border-color]="getOptionLetter(oIdx) === q.correctOption ? '#10B981' : 'var(--border-weak)'"
                             [style.color]="getOptionLetter(oIdx) === q.correctOption ? '#065F46' : 'var(--text-secondary)'">
                          <span style="font-weight: 800; background:rgba(79, 70, 229, 0.08); width:18px; height:18px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center"
                                [style.background]="getOptionLetter(oIdx) === q.correctOption ? '#10B981' : 'rgba(79, 70, 229, 0.08)'"
                                [style.color]="getOptionLetter(oIdx) === q.correctOption ? '#fff' : '#4F46E5'">
                            {{ getOptionLetter(oIdx) }}
                          </span>
                          <span>{{ opt }}</span>
                        </div>
                      }
                    </div>
                  } @else {
                    <div style="font-size:12px; color:var(--text-muted); margin-top:8px; font-style:italic">
                      {{ t('Question ouverte (aucun choix multiples)', 'Open-ended question (no multiple choices)') }}
                    </div>
                  }
                </div>
              }
            </div>
          } @else {
            <div style="text-align:center; padding:40px; border:1px dashed var(--border); border-radius:8px; color:var(--text-muted)">
              {{ t('Chargement du test de niveau...', 'Loading placement test...') }}
            </div>
          }
        </div>
      }

      <!-- TAB 2: CANDIDATES RESULTS -->
      @if (activeTab() === 'results') {
        <div style="background:var(--surface-1); border:1px solid var(--border); border-radius:12px; padding:20px; box-shadow:0 4px 6px rgba(0,0,0,0.02)">
          <div style="font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:6px">{{ t('Évaluations Soumises', 'Submitted Evaluations') }}</div>
          <p style="font-size:12.5px; color:var(--text-muted); margin:0 0 16px 0">
            {{ t("Voici la liste des nouveaux étudiants qui ont complété le test de niveau. Vous pouvez analyser leurs réponses et attribuer ou ajuster leur niveau de départ.", "Here is the list of new students who completed the placement test. You can inspect their answers and assign or adjust their starting English level.") }}
          </p>

          <div style="display:flex; flex-direction:column; gap:8px; overflow-x:auto">
            <!-- Table Header -->
            <div class="row-header" style="display:grid; grid-template-columns: 180px 100px 110px 100px 140px 1fr; gap:12px; padding:10px; background:var(--surface-2); font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase; border-radius:8px">
              <div>{{ t('Étudiant', 'Student') }}</div>
              <div style="text-align:center">{{ t('Score Obtenu', 'Test Score') }}</div>
              <div style="text-align:center">{{ t('Niveau Suggéré', 'Suggested Level') }}</div>
              <div style="text-align:center">{{ t('Niveau Actuel', 'Current Level') }}</div>
              <div style="text-align:center">{{ t('Assigner Niveau', 'Assign Level') }}</div>
              <div style="text-align:right">{{ t('Actions', 'Actions') }}</div>
            </div>

            <!-- Table Rows -->
            @for (student of testCandidates(); track student.id) {
              <div class="row-item" 
                   draggable="true" 
                   (dragstart)="onCandidateDragStart($event, student)" 
                   (dragend)="onCandidateDragEnd($event)"
                   style="display:grid; grid-template-columns: 180px 100px 110px 100px 140px 1fr; gap:12px; padding:12px 10px; border-bottom:1px solid var(--border-weak); align-items:center; cursor:grab; transition:background 0.15s"
                   [style.background]="draggedCandidate()?.id === student.id ? 'var(--surface-2)' : 'transparent'">
                <div style="display:flex; align-items:center; gap:8px">
                  <div class="avatar" style="width:28px; height:28px; font-size:11px; background:#4F46E5; color:white">
                    {{ student.avatar || student.name.slice(0,2).toUpperCase() }}
                  </div>
                  <div>
                    <div style="font-size:12.5px; font-weight:700; color:var(--text-primary)">{{ student.name }}</div>
                    <div style="font-size:10px; color:var(--text-muted)">{{ student.registeredAt || 'New student' }}</div>
                  </div>
                </div>

                <div style="text-align:center; font-size:13.5px; font-weight:800; color:#4F46E5">
                  {{ student.placementTestScore ?? 0 }}%
                </div>

                <div style="text-align:center">
                  <span class="badge" [class]="getLevelClass(getSuggestedLevel(student.placementTestScore))">
                    {{ getSuggestedLevel(student.placementTestScore) }}
                  </span>
                </div>

                <div style="text-align:center">
                  <span class="badge" [class]="getLevelClass(student.level)">
                    {{ student.level }}
                  </span>
                </div>

                <!-- Fast assign dropdown + action -->
                <div style="text-align:center; display:flex; gap:6px; align-items:center">
                  <select [ngModel]="selectedLevels[student.id] || student.level" 
                          (ngModelChange)="selectedLevels[student.id] = $event"
                          style="background:white; border:1px solid var(--border); padding:6px; border-radius:6px; font-size:11px; outline:none; font-weight:700; width:70px">
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                  </select>
                  <button (click)="assignLevel(student.id)" 
                          style="padding:6px; border-radius:6px; border:none; background:#10B981; color:white; cursor:pointer; display:flex; align-items:center; justify-content:center"
                          [title]="t('Enregistrer le niveau', 'Save Level')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </button>
                </div>

                <div style="text-align:right">
                  <button class="btn-s" style="font-size:11px; padding:6px 12px" (click)="inspectStudentAnswers(student)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    {{ t('Inspecter', 'Inspect') }}
                  </button>
                </div>
              </div>
            } @empty {
              <div style="text-align:center; padding:40px; font-size:12px; color:var(--text-muted); border:1px dashed var(--border-strong); border-radius:8px">
                {{ t("Aucun résultat d'évaluation de niveau disponible.", "No level assessment results available yet.") }}
              </div>
            }
          </div>
          
          @if (isDraggingCandidate()) {
            <div class="candidate-trash-dropzone"
                 [class.drag-over]="isDragOverTrash()"
                 (dragover)="onTrashDragOver($event)"
                 (dragleave)="isDragOverTrash.set(false)"
                 (drop)="onCandidateTrashDrop($event)">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="trash-icon"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              <span>{{ t('Glisser l\'étudiant ici pour réinitialiser son test de niveau', 'Drag the student here to reset their placement test') }}</span>
            </div>
          }
        </div>
      }

      <!-- INLINE QUESTIONS CONFIGURATION EDITOR MODAL -->
      @if (editingTest(); as pt) {
        <div class="modal-overlay" (click)="editingTest.set(null)" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.4); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:9999">
          <div class="modal-card" (click)="$event.stopPropagation()" style="background:white; border-radius:12px; max-width:680px; width:95%; max-height:85vh; overflow-y:auto; padding:24px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1)">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-weak); padding-bottom:12px; margin-bottom:16px">
              <h3 style="font-size:16px; font-weight:800; color:var(--text-primary); margin:0; display:flex; align-items:center; gap:8px">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                {{ t('Modifier le Test :', 'Edit Test:') }} {{ pt.title }}
              </h3>
              <button (click)="editingTest.set(null)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:18px"><i class="ti ti-x"></i></button>
            </div>

            <!-- Edit Fields list -->
            <div style="display:flex; flex-direction:column; gap:16px">
              @for (q of draftQuestions; track $index; let qIdx = $index) {
                <div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:16px; border-radius:10px; position:relative">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                    <span style="font-weight:700; font-size:12.5px; color:#4F46E5">Question {{ qIdx + 1 }}</span>
                    @if (draftQuestions.length > 2) {
                      <button (click)="removeQuestion(qIdx)" style="background:#FEE2E2; border:none; border-radius:6px; color:#EF4444; cursor:pointer; padding:4px 8px; font-size:11px; font-weight:700">
                        Supprimer
                      </button>
                    }
                  </div>

                  <input type="text" [(ngModel)]="q.question" placeholder="Intitulé de la question" 
                         style="width:100%; border:1px solid #D1D5DB; border-radius:6px; padding:8px; font-size:12.5px; margin-bottom:10px" />

                  <!-- Options grid -->
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px">
                    @for (opt of q.options; track $index; let oIdx = $index) {
                      <div style="display:flex; align-items:center; gap:6px">
                        <span style="font-weight:800; font-size:11px; color:#4F46E5">{{ getOptionLetter(oIdx) }}.</span>
                        <input type="text" [(ngModel)]="q.options[oIdx]" placeholder="Option {{ getOptionLetter(oIdx) }}" 
                               style="flex:1; border:1px solid #D1D5DB; border-radius:6px; padding:6px; font-size:12px" />
                      </div>
                    }
                  </div>

                  <!-- Correct choice -->
                  <div style="display:flex; align-items:center; gap:10px">
                    <label style="font-size:11px; font-weight:700; color:var(--text-secondary)">Option correcte :</label>
                    <div style="display:flex; gap:6px">
                      @for (lettr of ['A', 'B', 'C']; track lettr) {
                        <button (click)="q.correctOption = lettr"
                                [style.background]="q.correctOption === lettr ? '#10B981' : 'white'"
                                [style.border-color]="q.correctOption === lettr ? '#10B981' : '#D1D5DB'"
                                [style.color]="q.correctOption === lettr ? 'white' : 'var(--text-primary)'"
                                style="width:28px; height:28px; border-radius:50%; border:1.5px solid; font-size:11px; font-weight:800; cursor:pointer; transition:all 0.2s">
                          {{ lettr }}
                        </button>
                      }
                    </div>
                  </div>
                </div>
              }

              <button (click)="addQuestion()" 
                      style="width:100%; border:2px dashed #C7D2FE; border-radius:8px; background:#EEF2FF; color:#4338CA; font-size:12px; font-weight:700; padding:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Ajouter une question
              </button>
            </div>

            <!-- Footer actions -->
            <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:20px; border-top:1px solid var(--border-weak); padding-top:16px">
              <button class="btn-s" (click)="editingTest.set(null)">Annuler</button>
              <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5" (click)="saveDraftChanges(pt.id)">
                Sauvegarder les modifications
              </button>
            </div>
          </div>
        </div>
      }

      <!-- INSPECT CANDIDATE ANSWERS OVERLAY MODAL -->
      @if (inspectingStudent(); as student) {
        <div class="modal-overlay" (click)="inspectingStudent.set(null)" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.4); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:9999">
          <div class="modal-card" (click)="$event.stopPropagation()" style="background:white; border-radius:12px; max-width:600px; width:95%; max-height:80vh; overflow-y:auto; padding:24px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1)">
            
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-weak); padding-bottom:12px; margin-bottom:16px">
              <div>
                <h3 style="font-size:15px; font-weight:800; color:var(--text-primary); margin:0">{{ t('Réponses de :', 'Answers from:') }} {{ student.name }}</h3>
                <span class="badge" style="background:#EEF2FF; color:#4F46E5; font-size:10px; margin-top:4px; display:inline-block">
                  Score : {{ student.placementTestScore ?? 0 }}% · {{ t('Niveau suggéré :', 'Suggested:') }} {{ getSuggestedLevel(student.placementTestScore) }}
                </span>
              </div>
              <button (click)="inspectingStudent.set(null)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:18px"><i class="ti ti-x"></i></button>
            </div>

            <!-- Answers inspect list -->
            <div style="display:flex; flex-direction:column; gap:12px">
              @if (generalPlacementTest(); as pt) {
                @for (q of pt.questions; track q.question; let idx = $index) {
                  <div style="background:#F9FAFB; border:1px solid #E5E7EB; border-radius:8px; padding:12px">
                    <div style="font-weight:700; font-size:12.5px; color:var(--text-primary)">
                      Q{{ idx + 1 }}. {{ q.question }}
                    </div>

                    <!-- Selected Option Comparison -->
                    <div style="margin-top:8px; display:flex; flex-direction:column; gap:4px">
                      @for (opt of q.options; track opt; let oIdx = $index) {
                        <div style="font-size:11.5px; padding:6px 10px; border-radius:6px; display:flex; align-items:center; justify-content:between; border:1px solid transparent"
                             [style.background]="getAnswerRowBackground(idx, getOptionLetter(oIdx), q.correctOption, student.placementTestAnswers)"
                             [style.border-color]="getAnswerRowBorder(idx, getOptionLetter(oIdx), q.correctOption, student.placementTestAnswers)">
                          
                          <div style="display:flex; align-items:center; gap:6px">
                            <span style="font-weight:800; width:16px; height:16px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:10px"
                                  [style.background]="getAnswerLabelBackground(idx, getOptionLetter(oIdx), q.correctOption, student.placementTestAnswers)"
                                  [style.color]="getAnswerLabelColor(idx, getOptionLetter(oIdx), q.correctOption, student.placementTestAnswers)">
                              {{ getOptionLetter(oIdx) }}
                            </span>
                            <span [style.font-weight]="(student.placementTestAnswers?.[idx] === getOptionLetter(oIdx) || q.correctOption === getOptionLetter(oIdx)) ? '700' : '400'"
                                  [style.color]="(student.placementTestAnswers?.[idx] === getOptionLetter(oIdx) || q.correctOption === getOptionLetter(oIdx)) ? 'var(--text-primary)' : 'var(--text-secondary)'">
                              {{ opt }}
                            </span>
                          </div>

                          <!-- Badges correct/incorrect chosen -->
                          <div style="margin-left:auto; display:flex; gap:4px">
                            @if (student.placementTestAnswers?.[idx] === getOptionLetter(oIdx)) {
                              @if (q.correctOption === getOptionLetter(oIdx)) {
                                <span class="badge" style="background:#D1FAE5; color:#065F46; font-size:9px">Choisi (Correct)</span>
                              } @else {
                                <span class="badge" style="background:#FEE2E2; color:#991B1B; font-size:9px">Choisi (Faux)</span>
                              }
                            } @else if (q.correctOption === getOptionLetter(oIdx)) {
                              <span class="badge" style="background:#D1FAE5; color:#065F46; font-size:9px">Solution correcte</span>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              } @else {
                <div style="font-size:12px; color:var(--text-muted); text-align:center; padding:20px">
                  Impossible d'inspecter les réponses détaillées (le test de niveau général n'a pas été trouvé).
                </div>
              }
            </div>

            <!-- Actions footer -->
            <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:20px; border-top:1px solid var(--border-weak); padding-top:16px">
              <button class="btn-s" (click)="inspectingStudent.set(null)">Fermer</button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .badge {
      font-size: 10px; font-weight: 800; text-transform: uppercase;
      padding: 3px 8px; border-radius: 20px; display: inline-block;
    }
    .badge.green { background: #D1FAE5; color: #065F46; }
    .badge.blue { background: #DBEAFE; color: #1E40AF; }
    .badge.orange { background: #FFEDD5; color: #9A3412; }
    .badge.yellow { background: #FEF3C7; color: #92400E; }
    .badge.red { background: #FEE2E2; color: #991B1B; }

    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 9999;
    }
    .modal-card {
      background: white; border-radius: 12px; max-width: 600px; width: 95%;
      max-height: 85vh; overflow-y: auto; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
    }

    .candidate-trash-dropzone {
      margin-top: 20px;
      padding: 20px;
      border: 2px dashed #EF4444;
      background: #FEF2F2;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      color: #EF4444;
      font-size: 13px;
      font-weight: 700;
      transition: all 0.2s ease-in-out;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.08);
      animation: pulse-trash-test 1.5s infinite alternate;
    }

    .candidate-trash-dropzone.drag-over {
      background: #EF4444 !important;
      color: white !important;
      border-style: solid;
      transform: scale(1.02);
      box-shadow: 0 8px 24px rgba(239, 68, 68, 0.2);
    }

    .candidate-trash-dropzone.drag-over .trash-icon {
      transform: scale(1.2);
    }

    @keyframes pulse-trash-test {
      from { border-color: #FCA5A5; }
      to { border-color: #EF4444; }
    }
  `]
})
export class TeacherPlacementTestsComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  activeTab = signal<'manage' | 'results'>('manage');
  selectedPlacementId = signal<string>('placement-test');
  
  quizzes = signal<Quiz[]>([]);
  allUsers = signal<UserProfile[]>([]);

  // Drag and drop candidate reset signals
  isDraggingCandidate = signal<boolean>(false);
  draggedCandidate = signal<UserProfile | null>(null);
  isDragOverTrash = signal<boolean>(false);
  
  activeLang = this.db.activeLang;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

  getCategorySvg(id: string): string {
    const map: Record<string, string> = {
      'placement-test': `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
      'placement-test-grammar': `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
      'placement-test-vocabulary': `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>`,
      'placement-test-speaking': `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>`,
      'placement-test-listening': `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3ZM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3Z"/></svg>`,
      'placement-test-translation': `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 8h10"/><path d="M4 10a10 10 0 0 1 16 0"/><path d="M12 2v6"/><path d="M12 16v6"/><path d="M20 14H4a10 10 0 0 0 16 0Z"/></svg>`,
      'placement-test-pronunciation': `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`
    };
    return map[id] || '';
  }

  categories = [
    { id: 'placement-test', label: 'Général' },
    { id: 'placement-test-grammar', label: 'Grammaire' },
    { id: 'placement-test-vocabulary', label: 'Vocabulaire' },
    { id: 'placement-test-speaking', label: 'Oral/Expression' },
    { id: 'placement-test-listening', label: 'Compréhension Orale' },
    { id: 'placement-test-translation', label: 'Traduction' },
    { id: 'placement-test-pronunciation', label: 'Prononciation' }
  ];

  // Candidates list
  testCandidates = computed(() => {
    return this.allUsers().filter(u => u.placementTestTaken === true && (u.role === 'student' || u.role === 'guest'));
  });

  unassignedCount = computed(() => {
    // Candidates whose level is not yet finalized (defaults to guest or standard new level)
    // Or we can just highlight any user who has taken the placement test and we want to view their result
    return this.testCandidates().length;
  });

  // Selected levels map to set level
  selectedLevels: { [studentId: string]: string } = {};

  // Question editing draft states
  editingTest = signal<Quiz | null>(null);
  draftQuestions: QuestionDraft[] = [];

  // Inspector modal states
  inspectingStudent = signal<UserProfile | null>(null);

  generalPlacementTest = computed(() => {
    return this.quizzes().find(q => q.id === 'placement-test');
  });

  constructor() {
    this.db.observeQuizzes().subscribe(list => this.quizzes.set(list));
    this.db.observeUsers().subscribe(list => this.allUsers.set(list));
  }

  getPlacementTest(): Quiz | undefined {
    return this.quizzes().find(q => q.id === this.selectedPlacementId());
  }

  getOptionLetter(idx: number): string {
    return ['A', 'B', 'C', 'D'][idx] || '';
  }

  getSuggestedLevel(scorePct?: number): string {
    if (scorePct === undefined) return 'A1';
    if (scorePct >= 80) return 'B2';
    if (scorePct >= 60) return 'B1';
    if (scorePct >= 40) return 'A2';
    return 'A1';
  }

  getLevelClass(level?: string): string {
    switch (level) {
      case 'A1': return 'badge green';
      case 'A2': return 'badge blue';
      case 'B1': return 'badge orange';
      case 'B2': return 'badge yellow';
      default: return 'badge green';
    }
  }

  async assignLevel(studentId: string) {
    const levelToSet = this.selectedLevels[studentId];
    if (!levelToSet) return;

    await this.db.updateUserProfile(studentId, { level: levelToSet });
    
    // Notify student
    await this.db.sendNotification({
      recipientId: studentId,
      recipientRole: 'student',
      type: 'grade_updated',
      title: '🎯 Niveau académique attribué !',
      message: `Votre professeur a validé votre niveau de départ : ${levelToSet} !`
    });

    this.dialogService.alert(
      this.t('Niveau Attribué', 'Level Assigned'),
      this.t(`L'étudiant a été classé au niveau ${levelToSet} avec succès.`, `The student has been successfully assigned to level ${levelToSet}.`),
      'success'
    );
  }

  inspectStudentAnswers(student: UserProfile) {
    this.inspectingStudent.set(student);
  }

  // Question Drafting helpers
  startEditing(quiz: Quiz) {
    this.editingTest.set(quiz);
    this.draftQuestions = quiz.questions.map(q => ({
      question: q.question,
      options: [...(q.options || ['', '', ''])],
      correctOption: q.correctOption || 'A'
    }));
  }

  addQuestion() {
    this.draftQuestions.push({
      question: '',
      options: ['', '', ''],
      correctOption: 'A'
    });
  }

  removeQuestion(idx: number) {
    if (this.draftQuestions.length > 2) {
      this.draftQuestions.splice(idx, 1);
    }
  }

  async saveDraftChanges(quizId: string) {
    const validQuestions = this.draftQuestions.filter(q => q.question.trim().length > 0);
    if (validQuestions.length < 2) {
      this.dialogService.alert('Erreur', 'Veuillez saisir au moins 2 questions valides.', 'info');
      return;
    }

    // Prepare quiz update
    const updatedQuestions = validQuestions.map(q => ({
      question: q.question,
      options: q.options.filter(o => o.trim().length > 0),
      correctOption: q.correctOption
    }));

    await this.db.updateQuiz(quizId, {
      questions: updatedQuestions
    });

    this.dialogService.alert('Succès', 'Le test de niveau a été mis à jour avec succès !', 'success');
    this.editingTest.set(null);
  }

  // Answer Inspector Styles Helpers
  getAnswerRowBackground(qIdx: number, letter: string, correctLetter: string, studentAnswers?: { [key: number]: string }): string {
    const studentChoice = studentAnswers?.[qIdx];
    if (studentChoice === letter) {
      return letter === correctLetter ? '#ECFDF5' : '#FEF2F2';
    }
    if (letter === correctLetter) {
      return '#ECFDF5';
    }
    return 'white';
  }

  getAnswerRowBorder(qIdx: number, letter: string, correctLetter: string, studentAnswers?: { [key: number]: string }): string {
    const studentChoice = studentAnswers?.[qIdx];
    if (studentChoice === letter) {
      return letter === correctLetter ? '#10B981' : '#EF4444';
    }
    if (letter === correctLetter) {
      return '#10B981';
    }
    return '#E5E7EB';
  }

  getAnswerLabelBackground(qIdx: number, letter: string, correctLetter: string, studentAnswers?: { [key: number]: string }): string {
    const studentChoice = studentAnswers?.[qIdx];
    if (studentChoice === letter) {
      return letter === correctLetter ? '#10B981' : '#EF4444';
    }
    if (letter === correctLetter) {
      return '#10B981';
    }
    return 'rgba(79, 70, 229, 0.08)';
  }

  getAnswerLabelColor(qIdx: number, letter: string, correctLetter: string, studentAnswers?: { [key: number]: string }): string {
    const studentChoice = studentAnswers?.[qIdx];
    if (studentChoice === letter || letter === correctLetter) {
      return '#white';
    }
    return '#4F46E5';
  }

  onCandidateDragStart(event: DragEvent, student: UserProfile) {
    event.dataTransfer?.setData('text/plain', student.id);
    this.isDraggingCandidate.set(true);
    this.draggedCandidate.set(student);
  }

  onCandidateDragEnd(event: DragEvent) {
    this.isDraggingCandidate.set(false);
    this.draggedCandidate.set(null);
    this.isDragOverTrash.set(false);
  }

  onTrashDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOverTrash.set(true);
  }

  onCandidateTrashDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOverTrash.set(false);
    this.isDraggingCandidate.set(false);
    const student = this.draggedCandidate();
    if (!student) return;

    this.dialogService.show({
      title: this.t("Réinitialiser le Test", "Reset Test"),
      message: this.t(`Voulez-vous vraiment réinitialiser les résultats de ${student.name} ? L'étudiant devra repasser le test de niveau.`, `Are you sure you want to reset the test results for ${student.name}? They will have to retake the placement test.`),
      type: 'confirm',
      confirmText: this.t('Réinitialiser', 'Reset'),
      cancelText: this.t('Annuler', 'Cancel'),
      onConfirm: async () => {
        await this.db.updateUserProfile(student.id, {
          placementTestTaken: false,
          placementTestScore: undefined,
          placementTestAnswers: undefined
        });
        this.dialogService.alert(
          this.t('Réinitialisé', 'Reset Complete'),
          this.t('Le test a été réinitialisé avec succès.', 'The test has been successfully reset.'),
          'success'
        );
      }
    });
  }
}
