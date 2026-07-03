import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Exercise, ExerciseType, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-exercises-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="padding: 20px; max-width: 1200px; margin: 0 auto;">
      <!-- Tab Selector -->
      <div class="tab-row" style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid var(--border-weak); padding-bottom: 10px;">
        <button class="tab" [class.active]="activeTab() === 'list'" (click)="setTab('list')"
                style="padding: 10px 16px; border: none; background: none; cursor: pointer; font-weight: 600; color: var(--text-muted); border-bottom: 2px solid transparent; transition: all 0.2s;"
                [style.color]="activeTab() === 'list' ? 'var(--text-primary)' : 'var(--text-muted)'"
                [style.border-bottom-color]="activeTab() === 'list' ? '#059669' : 'transparent'">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
          {{ labels().tabList }} ({{ filteredExercises().length }})
        </button>
        <button class="tab" [class.active]="activeTab() === 'create'" (click)="setTab('create')"
                style="padding: 10px 16px; border: none; background: none; cursor: pointer; font-weight: 600; color: var(--text-muted); border-bottom: 2px solid transparent; transition: all 0.2s;"
                [style.color]="activeTab() === 'create' ? 'var(--text-primary)' : 'var(--text-muted)'"
                [style.border-bottom-color]="activeTab() === 'create' ? '#059669' : 'transparent'">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {{ labels().tabCreate }}
        </button>
      </div>

      <!-- LIST TAB -->
      @if (activeTab() === 'list') {
        <div>
          <!-- Filters & Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
            <div>
              <h3 style="font-size: 18px; font-weight: 700; margin: 0 0 4px 0; color: var(--text-primary);">{{ labels().exercisesTitle }}</h3>
              <p style="font-size: 12px; color: var(--text-muted); margin: 0;">{{ labels().exercisesDesc }}</p>
            </div>
            <button (click)="startNew()" style="background: #059669; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {{ labels().newExercise }}
            </button>
          </div>

          <!-- Type filter chips -->
          <div style="display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 5px;">
            <button (click)="filterType.set('all')" 
                    style="padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid var(--border); transition: all 0.2s;"
                    [style.background]="filterType() === 'all' ? '#059669' : 'var(--surface-2)'"
                    [style.color]="filterType() === 'all' ? '#fff' : 'var(--text-secondary)'">
              {{ labels().allTypes }}
            </button>
            @for (typeItem of typesList; track typeItem.value) {
              <button (click)="filterType.set(typeItem.value)"
                      style="padding: 6px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid var(--border); display: flex; align-items: center; gap: 4px; transition: all 0.2s;"
                      [style.background]="filterType() === typeItem.value ? typeItem.color : 'var(--surface-2)'"
                      [style.color]="filterType() === typeItem.value ? '#fff' : 'var(--text-secondary)'">
                <span style="display:flex; align-items:center" [innerHTML]="typeItem.svg"></span>
                <span>
                  {{ typeItem.value === 'writing' ? t('Rédaction', 'Writing') : 
                     typeItem.value === 'speaking' ? t('Expression Orale', 'Speaking') : 
                     typeItem.value === 'listening' ? t('Compréhension Orale', 'Listening') : 
                     typeItem.value === 'translation' ? t('Traduction', 'Translation') : 
                     typeItem.value === 'pronunciation' ? t('Prononciation', 'Pronunciation') : 
                     t('Vocabulaire', 'Vocabulary') }}
                </span>
              </button>
            }
          </div>

          <!-- Exercises Grid -->
          @if (filteredExercises().length > 0) {
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;">
              @for (ex of filteredExercises(); track ex.id) {
                <div class="card" style="border: 1px solid var(--border); border-radius: 12px; padding: 16px; background: var(--surface-1); display: flex; flex-direction: column; justify-content: space-between; position: relative; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                  <div>
                    <!-- Badge Header -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                      <span [style.background]="getTypeColor(ex.type) + '15'" [style.color]="getTypeColor(ex.type)"
                            style="padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 4px;">
                        <span style="display:inline-flex; align-items:center" [innerHTML]="getTypeSvg(ex.type)"></span>
                        <span style="text-transform: capitalize;">
                          {{ ex.type === 'writing' ? t('Rédaction', 'Writing') : 
                             ex.type === 'speaking' ? t('Expression Orale', 'Speaking') : 
                             ex.type === 'listening' ? t('Compréhension Orale', 'Listening') : 
                             ex.type === 'translation' ? t('Traduction', 'Translation') : 
                             ex.type === 'pronunciation' ? t('Prononciation', 'Pronunciation') : 
                             t('Vocabulaire', 'Vocabulary') }}
                        </span>
                      </span>
                      <span style="font-size: 11px; padding: 2px 8px; border-radius: 12px; font-weight: 600;"
                            [style.background]="ex.status === 'published' ? '#D1FAE5' : '#F3F4F6'"
                            [style.color]="ex.status === 'published' ? '#065F46' : '#374151'">
                        {{ ex.status === 'published' ? t('Publié', 'Published') : t('Brouillon', 'Draft') }}
                      </span>
                    </div>

                    <!-- Title -->
                    <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0 0 8px 0;">{{ ex.title }}</h4>
                    
                    <!-- Metadata info -->
                    <div style="font-size: 12px; color: var(--text-muted); display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px;">
                      <div style="display: flex; align-items: center; gap: 4px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/><path d="M12 2a5 5 0 0 0-5 5v3.42c0 .35.1.69.28 1l1.44 2.48a1 1 0 0 0 .86.48h8.84a1 1 0 0 0 .86-.48l1.44-2.48c.18-.31.28-.65.28-1V7a5 5 0 0 0-5-5z"/></svg>
                        {{ labels().levelLabel }} <span style="font-weight: 600; color: var(--text-secondary);">{{ ex.level }}</span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 4px;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
                        {{ labels().xpLabel }} <span style="font-weight: 600; color: var(--text-secondary);">{{ ex.points }} XP</span>
                      </div>
                      @if (ex.groupId) {
                        <div style="display: flex; align-items: center; gap: 4px;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          {{ labels().groupLabel }} <span style="font-weight: 600; color: var(--text-secondary);">{{ getGroupName(ex.groupId) }}</span>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Actions -->
                  <div style="display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border-weak); padding-top: 12px; margin-top: 8px;">
                    @if (ex.status === 'draft') {
                      <button (click)="publishExercise(ex)" style="background: none; border: 1px solid #10B981; color: #10B981; border-radius: 4px; padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
                        {{ labels().publishBtn }}
                      </button>
                    }
                    <button (click)="editExercise(ex)" style="background: none; border: 1px solid #3B82F6; color: #3B82F6; border-radius: 4px; padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
                      {{ labels().editBtn }}
                    </button>
                    <button (click)="deleteExercise(ex)" style="background: none; border: 1px solid #EF4444; color: #EF4444; border-radius: 4px; padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
                      {{ labels().deleteBtn }}
                    </button>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div style="text-align: center; padding: 60px 20px; border: 2px dashed var(--border); border-radius: 12px; background: var(--surface-1);">
              <span style="font-size: 36px; display: block; margin-bottom: 12px;">🎯</span>
              <p style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 0 0 4px 0;">{{ labels().noExercise }}</p>
              <p style="font-size: 12px; color: var(--text-muted); margin: 0 0 16px 0;">{{ labels().getStarted }}</p>
              <button (click)="setTab('create')" style="background: #059669; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer;">
                {{ labels().createBtn }}
              </button>
            </div>
          }
        </div>
      }

      <!-- CREATE / EDIT TAB -->
      @if (activeTab() === 'create') {
        <div class="card" style="border: 1px solid var(--border); border-radius: 12px; padding: 24px; background: var(--surface-1); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          
          <h3 style="font-size: 16px; font-weight: 700; margin: 0 0 20px 0; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            {{ labels().tabCreateHeader }}
          </h3>

          <!-- STEP 1: CHOOSE TYPE (Only if creating new) -->
          @if (!selectedExerciseId() && currentStep() === 1) {
            <div>
              <div style="margin-bottom: 20px;">
                <label style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">{{ labels().step1Label }}</label>
                <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">{{ t('Choisissez le type de compétence que vous souhaitez entraîner.', 'Choose the skill type you want to train.') }}</p>
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; margin-bottom: 24px;">
                @for (typeItem of typesList; track typeItem.value) {
                  <div (click)="selectType(typeItem.value)"
                       style="border: 2px solid var(--border); border-radius: 16px; padding: 20px 16px 16px; cursor: pointer; transition: all 0.22s cubic-bezier(.4,0,.2,1); position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: flex-start; gap: 12px;"
                       [style.border-color]="selectedType() === typeItem.value ? typeItem.color : 'var(--border)'"
                       [style.background]="selectedType() === typeItem.value ? typeItem.color + '10' : 'var(--surface-2)'"
                       [style.box-shadow]="selectedType() === typeItem.value ? '0 4px 20px ' + typeItem.color + '30' : 'none'">

                    <!-- Decorative glow blob -->
                    <div style="position:absolute; top:-20px; right:-20px; width:80px; height:80px; border-radius:50%; pointer-events:none; transition: opacity 0.22s;"
                         [style.background]="typeItem.color + '18'"
                         [style.opacity]="selectedType() === typeItem.value ? '1' : '0.4'"></div>

                    <!-- Icon bubble -->
                    <div style="width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink:0; transition: transform 0.22s;"
                         [style.background]="typeItem.color + '18'"
                         [style.transform]="selectedType() === typeItem.value ? 'scale(1.08)' : 'scale(1)'"
                         [innerHTML]="typeItem.svgLarge">
                    </div>

                    <!-- Text -->
                    <div style="flex:1;">
                      <h4 style="font-size: 14px; font-weight: 700; margin: 0 0 5px 0; line-height: 1.2;"
                          [style.color]="selectedType() === typeItem.value ? typeItem.color : 'var(--text-primary)'">
                        {{ typeItem.value === 'writing' ? t('Rédaction', 'Writing') : 
                           typeItem.value === 'speaking' ? t('Expression Orale', 'Speaking') : 
                           typeItem.value === 'listening' ? t('Compréhension Orale', 'Listening') : 
                           typeItem.value === 'translation' ? t('Traduction', 'Translation') : 
                           typeItem.value === 'pronunciation' ? t('Prononciation', 'Pronunciation') : 
                           t('Vocabulaire', 'Vocabulary') }}
                      </h4>
                      <p style="font-size: 11.5px; color: var(--text-muted); margin: 0; line-height: 1.5;">
                        {{ t(
                          typeItem.value === 'writing' ? 'Sujets rédigés libres avec correction manuelle.' :
                          typeItem.value === 'speaking' ? 'Entraînement oraux libres ou audio prompts.' :
                          typeItem.value === 'listening' ? 'Vidéo YouTube avec résumé/questions ou réponse libre.' :
                          typeItem.value === 'translation' ? 'Passages FR ➔ EN ou EN ➔ FR à traduire.' :
                          typeItem.value === 'pronunciation' ? 'Texte à prononcer avec enregistrement audio.' :
                          'Thème et liste de vocabulaire avec exercices associés.',
                          typeItem.value === 'writing' ? 'Free writing subjects with manual grading.' :
                          typeItem.value === 'speaking' ? 'Free speaking practice or audio prompts.' :
                          typeItem.value === 'listening' ? 'YouTube video with summary/questions or free response.' :
                          typeItem.value === 'translation' ? 'French ➔ English or English ➔ French passages to translate.' :
                          typeItem.value === 'pronunciation' ? 'Text to read aloud with audio recording.' :
                          'Theme and list of vocabulary words with practice exercises.'
                        ) }}
                      </p>
                    </div>
                    
                    <!-- Selected check badge -->
                    @if (selectedType() === typeItem.value) {
                      <div style="position: absolute; top: 12px; right: 12px; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white;"
                           [style.background]="typeItem.color">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    }
                  </div>
                }
              </div>

              <div style="display: flex; justify-content: flex-end;">
                <button [disabled]="!selectedType()" (click)="currentStep.set(2)"
                        style="color: white; border: none; padding: 11px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: opacity 0.2s, box-shadow 0.2s;"
                        [style.background]="selectedType() ? getTypeColor(selectedType()) : '#059669'"
                        [style.opacity]="selectedType() ? 1 : 0.45"
                        [style.cursor]="selectedType() ? 'pointer' : 'not-allowed'"
                        [style.box-shadow]="selectedType() ? '0 4px 14px ' + getTypeColor(selectedType()) + '55' : 'none'">
                  {{ labels().continueBtn }}
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              </div>
            </div>
          }

          <!-- STEP 2: FORM BASED ON TYPE -->
          @if (selectedExerciseId() || currentStep() === 2) {
            <div style="display: flex; gap: 24px; flex-wrap: wrap; align-items: flex-start; justify-content: space-between;">
              
              <!-- Left Column: Form Inputs -->
              <div style="flex: 1.2; min-width: 320px; display: flex; flex-direction: column; gap: 16px;">
                <!-- Type Display & Back Button -->
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                  @if (!selectedExerciseId()) {
                    <button (click)="currentStep.set(1)" style="background: none; border: 1px solid var(--border); border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 4px; color: var(--text-secondary);">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                      {{ labels().backStep1 }}
                    </button>
                  }
                  <div style="font-size: 13px; font-weight: 700; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                    {{ labels().selectedTypeLabel }} 
                    <span [style.color]="getTypeColor(selectedType())" style="text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px;">
                      {{ getTypeEmoji(selectedType()) }} {{ selectedType() }}
                    </span>
                  </div>
                </div>

                <!-- Title -->
                <div class="input-row" style="display: flex; flex-direction: column; gap: 6px;">
                  <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ labels().exerciseTitleLabel }}</label>
                  <input type="text" [(ngModel)]="formTitle" [placeholder]="labels().formTitlePlaceholder"
                         style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 13px; background: var(--surface-1); color: var(--text-primary);" />
                </div>

                <!-- Level & XP & Class Group -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
                  <div class="input-row" style="display: flex; flex-direction: column; gap: 6px;">
                    <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ labels().targetLevelLabel }}</label>
                    <select [(ngModel)]="formLevel" style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 13px; background: var(--surface-1); color: var(--text-primary);">
                      <option value="A1">A1 — {{ t('Débutant', 'Beginner') }}</option>
                      <option value="A2">A2 — {{ t('Élémentaire', 'Elementary') }}</option>
                      <option value="B1">B1 — {{ t('Intermédiaire', 'Intermediate') }}</option>
                      <option value="B2">B2 — {{ t('Intermédiaire Supérieur', 'Upper Intermediate') }}</option>
                      <option value="C1">C1 — {{ t('Avancé', 'Advanced') }}</option>
                    </select>
                  </div>
                  <div class="input-row" style="display: flex; flex-direction: column; gap: 6px;">
                    <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ labels().xpEarnLabel }}</label>
                    <input type="number" [(ngModel)]="formPoints" style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 13px; background: var(--surface-1); color: var(--text-primary);" />
                  </div>
                  <div class="input-row" style="display: flex; flex-direction: column; gap: 6px;">
                    <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ labels().assignGroupLabel }}</label>
                    <select [(ngModel)]="formGroupId" style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 13px; background: var(--surface-1); color: var(--text-primary);">
                      <option value="">{{ labels().noGroup }}</option>
                      @for (g of groups(); track g.id) {
                        <option [value]="g.id">{{ g.name }}</option>
                      }
                    </select>
                  </div>
                </div>

                <!-- Status Selection -->
                <div class="input-row" style="display: flex; flex-direction: column; gap: 6px;">
                  <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ labels().statusLabel }}</label>
                  <select [(ngModel)]="formStatus" style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 13px; background: var(--surface-1); color: var(--text-primary);">
                    <option value="published">{{ labels().statusPublished }}</option>
                    <option value="draft">{{ labels().statusDraft }}</option>
                  </select>
                </div>

                <!-- WRITING SPECIFIC FIELD -->
                @if (selectedType() === 'writing') {
                  <div class="input-row" style="display: flex; flex-direction: column; gap: 6px;">
                    <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ labels().writingPromptLabel }}</label>
                    <textarea [(ngModel)]="formSubject" rows="4" [placeholder]="labels().formSubjectPlaceholder"
                              style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 13px; background: var(--surface-1); color: var(--text-primary); resize: vertical;"></textarea>
                  </div>
                }

                <!-- SPEAKING SPECIFIC FIELD -->
                @if (selectedType() === 'speaking') {
                  <div class="input-row" style="display: flex; flex-direction: column; gap: 6px;">
                    <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ labels().speakingPromptLabel }}</label>
                    <textarea [(ngModel)]="formSpeakingPrompt" rows="4" [placeholder]="labels().formSpeakingPlaceholder"
                              style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 13px; background: var(--surface-1); color: var(--text-primary); resize: vertical;"></textarea>
                  </div>
                }

                <!-- LISTENING SPECIFIC FIELDS -->
                @if (selectedType() === 'listening') {
                  <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div class="input-row" style="display: flex; flex-direction: column; gap: 6px;">
                      <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ labels().youtubeLabel }}</label>
                      <input type="text" [(ngModel)]="formYoutubeUrl" placeholder="https://www.youtube.com/watch?v=..."
                             style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 13px; background: var(--surface-1); color: var(--text-primary);" />
                    </div>
                    <div class="input-row" style="display: flex; flex-direction: column; gap: 6px;">
                      <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ labels().listeningPromptLabel }}</label>
                      <textarea [(ngModel)]="formListeningInstruction" rows="4" [placeholder]="labels().formListeningPlaceholder"
                                style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 13px; background: var(--surface-1); color: var(--text-primary); resize: vertical;"></textarea>
                    </div>
                  </div>
                }

                <!-- TRANSLATION SPECIFIC FIELDS -->
                @if (selectedType() === 'translation') {
                  <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div class="input-row" style="display: flex; flex-direction: column; gap: 6px;">
                      <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ labels().translationLabel }}</label>
                      <select [(ngModel)]="formTranslationDirection" style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 13px; background: var(--surface-1); color: var(--text-primary);">
                        <option value="fr-en">{{ t('Français vers Anglais (FR ➔ EN)', 'French to English (FR ➔ EN)') }}</option>
                        <option value="en-fr">{{ t('Anglais vers Français (EN ➔ FR)', 'English to French (EN ➔ FR)') }}</option>
                      </select>
                    </div>
                    <div class="input-row" style="display: flex; flex-direction: column; gap: 6px;">
                      <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ labels().translateTextLabel }}</label>
                      <textarea [(ngModel)]="formTextToTranslate" rows="4" [placeholder]="labels().formTranslationPlaceholder"
                                style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 13px; background: var(--surface-1); color: var(--text-primary); resize: vertical;"></textarea>
                    </div>
                  </div>
                }

                <!-- PRONUNCIATION SPECIFIC FIELD -->
                @if (selectedType() === 'pronunciation') {
                  <div class="input-row" style="display: flex; flex-direction: column; gap: 6px;">
                    <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ labels().pronounceLabel }}</label>
                    <textarea [(ngModel)]="formTextToPronounce" rows="3" [placeholder]="labels().formSpeakingPlaceholder"
                              style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 13px; background: var(--surface-1); color: var(--text-primary); resize: vertical;"></textarea>
                  </div>
                }

                <!-- VOCABULARY SPECIFIC FIELDS -->
                @if (selectedType() === 'vocabulary') {
                  <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div class="input-row" style="display: flex; flex-direction: column; gap: 6px;">
                      <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ labels().vocabThemeLabel }}</label>
                      <input type="text" [(ngModel)]="formTheme" [placeholder]="labels().formThemePlaceholder"
                             style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 13px; background: var(--surface-1); color: var(--text-primary);" />
                    </div>
                    <div class="input-row" style="display: flex; flex-direction: column; gap: 6px;">
                      <label style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">{{ labels().vocabListLabel }}</label>
                      <textarea [(ngModel)]="formWordListRaw" rows="6" placeholder="Airport&#10;Passport&#10;Flight&#10;Boarding Pass"
                                style="width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 8px 12px; font-size: 13px; background: var(--surface-1); color: var(--text-primary); resize: vertical; font-family: monospace;"></textarea>
                    </div>
                  </div>
                }

                <!-- Action buttons -->
                <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; border-top: 1px solid var(--border-weak); padding-top: 16px;">
                  <button (click)="setTab('list')" style="background: none; border: 1px solid var(--border); padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; color: var(--text-secondary);">
                    {{ labels().cancelBtn }}
                  </button>
                  <button (click)="saveExercise()" style="background: #059669; color: white; border: none; padding: 8px 24px; border-radius: 6px; font-weight: 600; cursor: pointer;">
                    {{ labels().saveBtn }}
                  </button>
                </div>
              </div>

              <!-- Right Column: Live Student Preview -->
              <div style="flex: 0.8; min-width: 320px; background: #F9FAFB; border: 1.5px dashed #CBD5E1; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); position: sticky; top: 20px;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 16px; border-bottom: 1.5px solid #E5E7EB; padding-bottom: 8px;">
                  <span style="font-size: 16px;">👁️</span>
                  <span style="font-size: 13px; font-weight: 700; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.5px;">{{ labels().previewTitle }}</span>
                </div>

                <div style="background: white; border: 1px solid var(--border-weak); border-radius: 12px; padding: 18px; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
                  <h4 style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin: 0 0 10px 0;">
                    {{ labels().exerciseTitlePreview }}
                  </h4>
                  <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 16px; display: flex; align-items: center; gap: 6px">
                    <span style="background: var(--surface-2); border-radius: 12px; padding: 2px 10px; font-weight: 600;">Level {{ formLevel }}</span>
                    <span style="background: var(--surface-2); border-radius: 12px; padding: 2px 10px; font-weight: 600;">{{ formPoints }} XP</span>
                  </div>

                  <!-- Writing Preview -->
                  @if (selectedType() === 'writing') {
                    <div style="background: #F5F3FF; border: 1px solid #DDD6FE; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
                      <div style="font-size: 12.5px; font-weight: 700; color: #6D28D9; margin-bottom: 6px;">✍️ {{ labels().subjectPreviewLabel }}</div>
                      <p style="font-size: 12px; color: var(--text-primary); line-height: 1.6; margin: 0; white-space: pre-line;">{{ labels().subjectPlaceholder }}</p>
                    </div>
                    <textarea disabled rows="3" [placeholder]="labels().studentResponsePlaceholder"
                              style="width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 10px; font-size: 12.5px; resize: none; background: #F9FAFB; cursor: not-allowed;"></textarea>
                    <button disabled style="margin-top: 12px; background: #7C3AED; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: not-allowed; width: 100%; opacity: 0.8">{{ labels().submitBtn }}</button>
                  }

                  <!-- Speaking Preview -->
                  @else if (selectedType() === 'speaking') {
                    <div style="background: #F0FDF4; border: 1px solid #A7F3D0; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
                      <div style="font-size: 12.5px; font-weight: 700; color: #065F46; margin-bottom: 6px;">🎙️ {{ labels().speakingPreviewLabel }}</div>
                      <p style="font-size: 12px; color: var(--text-primary); line-height: 1.6; margin: 0; white-space: pre-line;">{{ labels().speakingPlaceholder }}</p>
                    </div>
                    
                    <!-- Recorder Component -->
                    <div style="background:#F0FDFA; border:1px dashed #0D9488; border-radius:10px; padding:16px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; margin-bottom:16px">
                      <button disabled style="width:44px; height:44px; border-radius:50%; background:#0D9488; color:white; border:none; display:flex; align-items:center; justify-content:center; cursor:not-allowed; opacity: 0.8">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
                        </svg>
                      </button>
                      <div style="font-size:11.5px; font-weight:700; color:#0F766E">{{ labels().startRecording }}</div>
                      <div style="font-size:10px; color:var(--text-muted)">{{ labels().clickToSpeak }}</div>
                    </div>

                    <button disabled style="background: #059669; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: not-allowed; width: 100%; opacity: 0.5">{{ labels().submitResponse }}</button>
                  }

                  <!-- Listening Preview -->
                  @else if (selectedType() === 'listening') {
                    @if (formYoutubeUrl) {
                      <div style="border-radius: 8px; overflow: hidden; margin-bottom: 12px; background: #000; display: flex; align-items: center; justify-content: center; padding: 12px;">
                        <span style="color: white; display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 12px;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                          {{ labels().watchYoutube }}
                        </span>
                      </div>
                    }
                    <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
                      <div style="font-size: 12.5px; font-weight: 700; color: #1E40AF; margin-bottom: 6px;">👂 {{ labels().listeningPreviewLabel }}</div>
                      <p style="font-size: 12px; color: var(--text-primary); line-height: 1.6; margin: 0; white-space: pre-line;">{{ labels().listeningPlaceholder }}</p>
                    </div>
                    <textarea disabled rows="3" [placeholder]="labels().studentResponsePlaceholder"
                              style="width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 10px; font-size: 12.5px; resize: none; background: #F9FAFB; cursor: not-allowed;"></textarea>
                    <button disabled style="margin-top: 12px; background: #0284C7; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: not-allowed; width: 100%; opacity: 0.8">{{ labels().submitBtn }}</button>
                  }

                  <!-- Translation Preview -->
                  @else if (selectedType() === 'translation') {
                    <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
                      <div style="font-size: 12.5px; font-weight: 700; color: #92400E; margin-bottom: 6px;">🌍 {{ labels().translationPreviewLabel }} ({{ formTranslationDirection === 'fr-en' ? 'FR → EN' : 'EN → FR' }})</div>
                      <p style="font-size: 13px; color: var(--text-primary); line-height: 1.7; margin: 0; font-style: italic;">{{ labels().translationPlaceholder }}</p>
                    </div>
                    <textarea disabled rows="3" [placeholder]="labels().studentTranslationPlaceholder"
                              style="width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 10px; font-size: 12.5px; resize: none; background: #F9FAFB; cursor: not-allowed;"></textarea>
                    <button disabled style="margin-top: 12px; background: #D97706; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: not-allowed; width: 100%; opacity: 0.8">{{ labels().submitTranslation }}</button>
                  }

                  <!-- Pronunciation Preview -->
                  @else if (selectedType() === 'pronunciation') {
                    <div style="text-align: center; padding: 20px; background: #FFF1F2; border: 1px solid #FECDD3; border-radius: 12px; margin-bottom: 16px;">
                      <div style="font-size: 12.5px; font-weight: 700; color: #9F1239; margin-bottom: 8px;">🔊 {{ labels().pronouncePreviewLabel }}</div>
                      <p style="font-size: 15px; font-weight: 700; color: var(--text-primary); line-height: 1.6; margin: 0;">{{ labels().pronouncePlaceholder }}</p>
                    </div>

                    <!-- Recorder Component -->
                    <div style="background:#FFF1F2; border:1px dashed #E11D48; border-radius:10px; padding:16px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; margin-bottom:16px">
                      <button disabled style="width:44px; height:44px; border-radius:50%; background:#E11D48; color:white; border:none; display:flex; align-items:center; justify-content:center; cursor:not-allowed; opacity: 0.8">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
                        </svg>
                      </button>
                      <div style="font-size:11.5px; font-weight:700; color:#9F1239">{{ labels().startRecording }}</div>
                      <div style="font-size:10px; color:var(--text-muted)">{{ labels().recordPronunciation }}</div>
                    </div>

                    <button disabled style="background: #DC2626; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 700; cursor: not-allowed; width: 100%; opacity: 0.5">{{ labels().submitResponse }}</button>
                  }

                  <!-- Vocabulary Preview -->
                  @else if (selectedType() === 'vocabulary') {
                    <div style="background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 12px; padding: 16px; margin-bottom: 16px; text-align: center;">
                      <div style="font-size: 10px; font-weight: 700; color: #4F46E5; text-transform: uppercase; margin-bottom: 10px;">📚 {{ labels().vocabReviewLabel }}</div>
                      
                      @let words = getPreviewWordList();
                      @if (words.length > 0) {
                        <div style="background: white; border: 1.5px solid #C7D2FE; border-radius: 8px; padding: 18px; min-height: 80px; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02)">
                          <div style="font-size: 18px; font-weight: 800; color: #1E1B4B; display: flex; align-items: center; gap: 6px;">
                            <span>{{ words[0] }}</span>
                            <span style="font-size: 14px;">🔊</span>
                          </div>
                          <span style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">{{ labels().exampleWordLabel }}</span>
                        </div>
                      } @else {
                        <div style="background: white; border: 1.5px dashed #C7D2FE; border-radius: 8px; padding: 18px; min-height: 80px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                          <span style="font-size: 12px; color: var(--text-muted); font-style: italic;">{{ labels().vocabPlaceholder }}</span>
                        </div>
                      }

                      <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; width: 100%;">
                        <button disabled class="btn-s" style="flex: 1; padding: 6px; font-size: 11px; cursor: not-allowed;">{{ labels().prevBtn }}</button>
                        <span style="font-size: 11px; color: var(--text-muted);">1 / {{ words.length || 1 }}</span>
                        <button disabled class="btn-p" style="flex: 1; background: #4F46E5; border-color: #4F46E5; padding: 6px; font-size: 11px; cursor: not-allowed; color: white;">{{ labels().nextBtn }}</button>
                      </div>
                    </div>
                  }
                </div>
              </div>

            </div>
          }
        </div>
      }
    </div>
  `
})
export class TeacherExercisesManagerComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  activeLang = this.db.activeLang;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

  labels = computed(() => ({
    tabList: this.t("Liste des Exercices", "Exercises List"),
    tabCreate: this.selectedExerciseId() ? this.t("Modifier l'Exercice", "Edit Exercise") : this.t("Créer un Exercice", "Create Exercise"),
    tabCreateHeader: this.selectedExerciseId() ? this.t("Modifier l'Exercice", "Edit Exercise") : this.t("Créer un Nouvel Exercice d'Entraînement", "Create New Practice Exercise"),
    exercisesTitle: this.t("Exercices d'Entraînement Autonomes", "Autonomous Practice Exercises"),
    exercisesDesc: this.t("Créez et publiez des activités d'entraînement indépendantes pour vos élèves.", "Create and publish independent practice activities for your students."),
    newExercise: this.t("Nouvel Exercice", "New Exercise"),
    allTypes: this.t("Tous les types", "All types"),
    levelLabel: this.t("Niveau:", "Level:"),
    xpLabel: this.t("XP :", "XP:"),
    groupLabel: this.t("Groupe :", "Group:"),
    publishBtn: this.t("Publier", "Publish"),
    editBtn: this.t("Modifier", "Edit"),
    deleteBtn: this.t("Supprimer", "Delete"),
    noExercise: this.t("Aucun exercice trouvé", "No exercises found"),
    getStarted: this.t("Commencez par créer votre premier exercice d'entraînement.", "Get started by creating your first practice exercise."),
    createBtn: this.t("Créer un exercice", "Create an exercise"),
    step1Label: this.t("Étape 1 : Sélectionnez le type d'exercice", "Step 1: Select the exercise type"),
    continueBtn: this.t("Continuer", "Continue"),
    backStep1: this.t("Retour à l'étape 1", "Back to Step 1"),
    selectedTypeLabel: this.t("Type Sélectionné :", "Selected Type:"),
    exerciseTitleLabel: this.t("Titre de l'exercice", "Exercise Title"),
    targetLevelLabel: this.t("Niveau Cible", "Target Level"),
    xpEarnLabel: this.t("XP à remporter", "XP to earn"),
    assignGroupLabel: this.t("Assigner au Groupe", "Assign to Group"),
    noGroup: this.t("Aucun groupe spécifique", "No specific group"),
    statusLabel: this.t("Statut", "Status"),
    statusPublished: this.t("Publié (Visible immédiatement par la classe)", "Published (Visible immediately to class)"),
    statusDraft: this.t("Brouillon (Sauvegardé sans publier)", "Draft (Saved without publishing)"),
    writingPromptLabel: this.t("Sujet de rédaction / Consigne", "Writing Subject / Instructions"),
    speakingPromptLabel: this.t("Consigne / Instructions d'expression orale", "Speaking Instructions / Prompts"),
    youtubeLabel: this.t("Lien Vidéo YouTube", "YouTube Video Link"),
    listeningPromptLabel: this.t("Consignes d'écoute / Questions", "Listening Instructions / Questions"),
    translationLabel: this.t("Direction de la traduction", "Translation Direction"),
    translateTextLabel: this.t("Texte à traduire", "Text to Translate"),
    pronounceLabel: this.t("Phrase / Paragraphe à prononcer", "Sentence / Paragraph to Pronounce"),
    vocabThemeLabel: this.t("Nom du Thème / Catégorie", "Theme Name / Category"),
    vocabListLabel: this.t("Liste de mots (un mot/expression par ligne)", "Word list (one word/phrase per line)"),
    cancelBtn: this.t("Annuler", "Cancel"),
    saveBtn: this.selectedExerciseId() ? this.t("Mettre à jour", "Update") : this.t("Enregistrer", "Save"),
    previewTitle: this.t("Aperçu Élève", "Student Preview"),
    exerciseTitlePreview: this.formTitle || this.t("Titre de l'exercice", "Exercise Title"),
    subjectPreviewLabel: this.t("Sujet", "Subject"),
    subjectPlaceholder: this.formSubject || this.t("Saisissez le sujet à gauche...", "Enter the subject on the left..."),
    studentResponsePlaceholder: this.t("L'élève saisira sa réponse ici...", "Student will type their response here..."),
    submitBtn: this.t("Soumettre", "Submit"),
    speakingPreviewLabel: this.t("Consigne", "Prompt"),
    speakingPlaceholder: this.formSpeakingPrompt || this.t("Saisissez la consigne orale à gauche...", "Enter speaking prompt on the left..."),
    startRecording: this.t("Démarrer l'enregistrement", "Start Oral Recording"),
    clickToSpeak: this.t("Cliquez pour parler et enregistrer la réponse", "Click to speak and record response"),
    submitResponse: this.t("Soumettre la réponse", "Submit Response"),
    watchYoutube: this.t("Regarder sur YouTube", "Watch on YouTube"),
    listeningPreviewLabel: this.t("Instructions", "Instructions"),
    listeningPlaceholder: this.formListeningInstruction || this.t("Saisissez les instructions d'écoute à gauche...", "Enter listening instructions on the left..."),
    translationPreviewLabel: this.t("Texte à traduire", "Text to translate"),
    translationPlaceholder: this.formTextToTranslate || this.t("Saisissez le texte à traduire à gauche...", "Enter text to translate on the left..."),
    studentTranslationPlaceholder: this.t("L'élève saisira sa traduction ici...", "Student will type translation here..."),
    submitTranslation: this.t("Soumettre la traduction", "Submit Translation"),
    pronouncePreviewLabel: this.t("Lire à voix haute :", "Read this aloud:"),
    pronouncePlaceholder: this.formTextToPronounce || this.t("Saisissez la phrase à prononcer à gauche...", "Enter sentence to pronounce on the left..."),
    recordPronunciation: this.t("Enregistrez la prononciation du texte", "Record pronunciation of the text"),
    vocabReviewLabel: this.t("Mode Révision (Flashcard)", "Review Mode (Flashcard)"),
    exampleWordLabel: this.t("Exemple de mot configuré", "Example of configured word"),
    vocabPlaceholder: this.t("Saisissez les mots dans la liste à gauche...", "Enter words in the list on the left..."),
    prevBtn: this.t("Précédent", "Previous"),
    nextBtn: this.t("Suivant", "Next"),
    
    formTitlePlaceholder: this.t("ex. Description de vacances de rêve ou Pratique orale du Past Simple", "e.g. Dream vacation description or Past Simple speaking practice"),
    formSubjectPlaceholder: this.t("Décrivez le sujet, les consignes et le nombre de mots minimum. ex. Décrivez vos vacances de rêve en 150 mots minimum...", "Describe the subject, guidelines and minimum word count. e.g. Describe your dream vacation in at least 150 words..."),
    formSpeakingPlaceholder: this.t("ex. Présentez-vous en anglais. Parlez pendant au moins 45 secondes de votre nom, âge, passions et profession.", "e.g. Introduce yourself in English. Speak for at least 45 seconds about your name, age, hobbies and job."),
    formListeningPlaceholder: this.t("Instructions : Écoutez la vidéo deux fois et résumez les arguments principaux, ou répondez aux questions suivantes...", "Instructions: Listen to the video twice and summarize the main arguments, or answer the following questions..."),
    formTranslationPlaceholder: this.t("Bonjour, je m'appelle David. J'adore voyager dans des pays chauds...", "Hello, my name is David. I love traveling to warm countries..."),
    formThemePlaceholder: this.t("ex. Voyage, Affaires, Nourriture, Cuisine", "e.g. Travel, Business, Food, Cooking")
  }));

  activeTab = signal<'list' | 'create'>('list');
  currentStep = signal<1 | 2>(1);

  // Data signals
  exercises = signal<Exercise[]>([]);
  groups = signal<any[]>([]);
  currentUser = signal<UserProfile | null>(null);

  // Filter signals
  filterType = signal<string>('all');

  // Form signals/state
  selectedExerciseId = signal<string | null>(null);
  selectedType = signal<ExerciseType | null>(null);

  // Common fields
  formTitle = '';
  formLevel = 'B1';
  formPoints = 20;
  formGroupId = '';
  formStatus = 'published';

  // Type specific fields
  formSubject = '';
  formSpeakingPrompt = '';
  formYoutubeUrl = '';
  formListeningInstruction = '';
  formTranslationDirection: 'fr-en' | 'en-fr' = 'fr-en';
  formTextToTranslate = '';
  formTextToPronounce = '';
  formTheme = '';
  formWordListRaw = '';

  typesList = [
    { 
      value: 'writing', 
      emoji: '✍️', 
      color: '#7C3AED', 
      label: 'Writing', 
      desc: 'Sujets rédigés libres avec correction manuelle.',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
      svgLarge: `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="#7C3AED" fill-opacity="0.15"/>
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/>
        <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="#7C3AED" fill-opacity="0.4"/>
        <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>`
    },
    { 
      value: 'speaking', 
      emoji: '🎙️', 
      color: '#059669', 
      label: 'Speaking', 
      desc: 'Entraînement oraux libres ou audio prompts.',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>',
      svgLarge: `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="2" width="6" height="12" rx="3" fill="#059669" fill-opacity="0.2"/>
        <rect x="9" y="2" width="6" height="12" rx="3"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
        <line x1="8" y1="22" x2="16" y2="22" stroke-width="2"/>
        <circle cx="12" cy="8" r="1.5" fill="#059669" fill-opacity="0.6" stroke="none"/>
      </svg>`
    },
    { 
      value: 'listening', 
      emoji: '👂', 
      color: '#0284C7', 
      label: 'Listening', 
      desc: 'Vidéo YouTube avec résumé/questions ou réponse libre.',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>',
      svgLarge: `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#0284C7" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z" fill="#0284C7" fill-opacity="0.2"/>
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
        <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" fill="#0284C7" fill-opacity="0.2"/>
        <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
        <path d="M8 10.5a4 4 0 0 1 8 0" stroke-width="2" stroke-dasharray="2 1"/>
      </svg>`
    },
    { 
      value: 'translation', 
      emoji: '🌍', 
      color: '#D97706', 
      label: 'Translation', 
      desc: 'Passages FR ➔ EN ou EN ➔ FR à traduire.',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>',
      svgLarge: `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9" fill="#D97706" fill-opacity="0.12"/>
        <circle cx="12" cy="12" r="9"/>
        <path d="M3.6 9h16.8M3.6 15h16.8"/>
        <path d="M12 3a14 14 0 0 1 3.5 9A14 14 0 0 1 12 21A14 14 0 0 1 8.5 12A14 14 0 0 1 12 3z" fill="#D97706" fill-opacity="0.08"/>
        <path d="M12 3a14 14 0 0 1 3.5 9A14 14 0 0 1 12 21A14 14 0 0 1 8.5 12A14 14 0 0 1 12 3z"/>
      </svg>`
    },
    { 
      value: 'pronunciation', 
      emoji: '🔊', 
      color: '#DC2626', 
      label: 'Pronunciation', 
      desc: 'Texte à prononcer avec enregistrement audio.',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>',
      svgLarge: `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M11 5L6 9H2v6h4l5 4V5z" fill="#DC2626" fill-opacity="0.2"/>
        <path d="M11 5L6 9H2v6h4l5 4V5z"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke-width="2"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke-width="1.8" stroke-opacity="0.5"/>
      </svg>`
    },
    { 
      value: 'vocabulary', 
      emoji: '📚', 
      color: '#4F46E5', 
      label: 'Vocabulary', 
      desc: 'Thème et liste de vocabulaire avec exercices associés.',
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z"/></svg>',
      svgLarge: `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z" fill="#4F46E5" fill-opacity="0.12"/>
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z"/>
        <line x1="9" y1="7" x2="16" y2="7" stroke-width="1.5"/>
        <line x1="9" y1="10" x2="16" y2="10" stroke-width="1.5"/>
        <line x1="9" y1="13" x2="13" y2="13" stroke-width="1.5"/>
      </svg>`
    }
  ];

  filteredExercises = computed(() => {
    const list = this.exercises();
    const type = this.filterType();
    if (type === 'all') return list;
    return list.filter(ex => ex.type === type);
  });

  constructor() {
    this.db.observeExercises().subscribe(list => {
      this.exercises.set(list);
    });

    this.db.observeChannels().subscribe(list => {
      this.groups.set(list);
    });

    this.db.observeCurrentUser().subscribe(user => {
      this.currentUser.set(user);
    });
  }

  setTab(tab: 'list' | 'create') {
    this.activeTab.set(tab);
    if (tab === 'list') {
      this.resetForm();
    }
  }

  selectType(type: any) {
    this.selectedType.set(type);
  }

  startNew() {
    this.resetForm();
    this.selectedExerciseId.set(null);
    const filter = this.filterType();
    if (filter && filter !== 'all') {
      this.selectedType.set(filter as any);
      this.currentStep.set(2);
    } else {
      this.selectedType.set(null);
      this.currentStep.set(1);
    }
    this.setTab('create');
  }

  editExercise(ex: Exercise) {
    this.selectedExerciseId.set(ex.id);
    this.selectedType.set(ex.type);
    
    // Bind common fields
    this.formTitle = ex.title;
    this.formLevel = ex.level;
    this.formPoints = ex.points;
    this.formGroupId = ex.groupId || '';
    this.formStatus = ex.status;

    // Bind specific fields
    this.formSubject = ex.subject || '';
    this.formSpeakingPrompt = ex.speakingPrompt || '';
    this.formYoutubeUrl = ex.youtubeUrl || '';
    this.formListeningInstruction = ex.listeningInstruction || '';
    this.formTranslationDirection = ex.translationDirection || 'fr-en';
    this.formTextToTranslate = ex.textToTranslate || '';
    this.formTextToPronounce = ex.textToPronounce || '';
    this.formTheme = ex.theme || '';
    this.formWordListRaw = (ex.wordList || []).join('\n');

    this.currentStep.set(2);
    this.setTab('create');
  }

  async deleteExercise(ex: Exercise) {
    this.dialogService.confirm(
      this.t("Supprimer l'Exercice", "Delete Exercise"),
      this.t(`Voulez-vous vraiment supprimer l'exercice "${ex.title}" ? Cette action est irréversible.`, `Are you sure you want to delete the exercise "${ex.title}"? This action cannot be undone.`),
      async () => {
        await this.db.deleteExercise(ex.id);
        this.dialogService.alert(
          this.t('Supprimé', 'Deleted'),
          this.t("L'exercice a été supprimé avec succès.", "Exercise deleted successfully."),
          'success'
        );
      }
    );
  }

  async publishExercise(ex: Exercise) {
    await this.db.updateExercise(ex.id, { status: 'published' });
    this.dialogService.alert(
      this.t('Publié', 'Published'),
      this.t("L'exercice a été publié avec succès !", "Exercise published successfully!"),
      'success'
    );
  }

  async saveExercise() {
    if (!this.formTitle.trim()) {
      this.dialogService.alert(
        this.t('Erreur', 'Error'),
        this.t("Veuillez saisir un titre pour l'exercice.", "Please enter a title for the exercise."),
        'info'
      );
      return;
    }

    const type = this.selectedType();
    if (!type) return;

    const user = this.currentUser();

    const words = this.formWordListRaw
      .split('\n')
      .map(w => w.trim())
      .filter(w => w.length > 0);

    const exerciseData: any = {
      title: this.formTitle.trim(),
      type,
      level: this.formLevel,
      points: this.formPoints,
      groupId: this.formGroupId || undefined,
      status: this.formStatus,
      authorId: user?.id || 'teacher',
      authorName: user?.name || 'Teacher'
    };

    // Set type specific properties
    if (type === 'writing') {
      exerciseData.subject = this.formSubject.trim();
    } else if (type === 'speaking') {
      exerciseData.speakingPrompt = this.formSpeakingPrompt.trim();
    } else if (type === 'listening') {
      exerciseData.youtubeUrl = this.formYoutubeUrl.trim();
      exerciseData.listeningInstruction = this.formListeningInstruction.trim();
    } else if (type === 'translation') {
      exerciseData.translationDirection = this.formTranslationDirection;
      exerciseData.textToTranslate = this.formTextToTranslate.trim();
    } else if (type === 'pronunciation') {
      exerciseData.textToPronounce = this.formTextToPronounce.trim();
    } else if (type === 'vocabulary') {
      exerciseData.theme = this.formTheme.trim();
      exerciseData.wordList = words;
    }

    const id = this.selectedExerciseId();
    try {
      if (id) {
        await this.db.updateExercise(id, exerciseData);
        this.dialogService.alert(
          this.t('Succès', 'Success'),
          this.t("L'exercice a été mis à jour avec succès.", "Exercise updated successfully."),
          'success'
        );
      } else {
        await this.db.addExercise(exerciseData);
        this.dialogService.alert(
          this.t('Succès', 'Success'),
          this.t("L'exercice a été créé avec succès.", "Exercise created successfully."),
          'success'
        );

        if (this.formStatus === 'published') {
          await this.db.sendNotification({
            recipientId: 'all',
            recipientRole: 'student',
            type: 'exercise_assigned',
            title: this.t('🎯 Nouvel exercice disponible', '🎯 New exercise available'),
            message: this.t(`"${this.formTitle}" a été publié par ${user?.name || 'votre professeur'}`, `"${this.formTitle}" has been published by ${user?.name || 'your teacher'}`)
          });
        }
      }
      this.setTab('list');
    } catch (e: any) {
      this.dialogService.alert(
        this.t('Erreur', 'Error'),
        this.t(`Une erreur est survenue : ${e.message}`, `An error occurred: ${e.message}`),
        'info'
      );
    }
  }

  resetForm() {
    this.formTitle = '';
    this.formLevel = 'B1';
    this.formPoints = 20;
    this.formGroupId = '';
    this.formStatus = 'published';
    this.formSubject = '';
    this.formSpeakingPrompt = '';
    this.formYoutubeUrl = '';
    this.formListeningInstruction = '';
    this.formTranslationDirection = 'fr-en';
    this.formTextToTranslate = '';
    this.formTextToPronounce = '';
    this.formTheme = '';
    this.formWordListRaw = '';
    this.currentStep.set(1);
    this.selectedType.set(null);
  }

  getTypeColor(type: any): string {
    const item = this.typesList.find(t => t.value === type);
    return item ? item.color : '#6B7280';
  }

  getTypeEmoji(type: any): string {
    const item = this.typesList.find(t => t.value === type);
    return item ? item.emoji : '🎯';
  }
  getTypeSvg(type: any): string {
    const item = this.typesList.find(t => t.value === type);
    return item ? item.svg : '';
  }


  getGroupName(groupId: string): string {
    const g = this.groups().find(c => c.id === groupId);
    return g ? g.name : groupId;
  }

  getPreviewWordList(): string[] {
    if (!this.formWordListRaw) return [];
    return this.formWordListRaw.split('\n').map(w => w.trim()).filter(w => w.length > 0);
  }
}
