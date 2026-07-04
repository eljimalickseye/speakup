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
    <div class="page" style="animation: fadeIn 0.25s">
      @if (!isFormOpen()) {
        <!-- Header Bar -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px">
          <div>
            <h3 style="margin:0; font-size:16px; font-weight:800; color:var(--text-primary)">📚 {{ t('Gestion des Cours', 'Lessons Management') }}</h3>
            <p style="margin:2px 0 0 0; font-size:11px; color:var(--text-secondary)">{{ t('Publiez et organisez les leçons d’anglais pour vos élèves.', 'Publish and organize English lessons for your students.') }}</p>
          </div>
          <button class="btn-p" style="background:#10B981; border-color:#10B981; font-weight:700; font-size:12.5px; display:flex; align-items:center; gap:6px" (click)="startNewLesson()">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {{ t('Créer un cours', 'Create a Lesson') }}
          </button>
        </div>
      } @else {
        <!-- FULL-SCREEN WORKSPACE FOR LESSON DESIGNER -->
        <div style="background:#F8FAFC; margin:-20px; padding:24px; min-height:calc(100vh - 60px); display:flex; flex-direction:column; gap:20px; animation: fadeIn 0.2s ease-out">
          
          <!-- TOP WORKSPACE MENU -->
          <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:12px 24px; border-radius:12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid var(--border-weak)">
            <div style="display:flex; align-items:center; gap:16px">
              <button class="btn-s" style="padding:6px 12px; font-weight:700; display:flex; align-items:center; gap:6px" (click)="resetForm()">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                {{ t('Retour', 'Back') }}
              </button>
              <div style="width:1px; height:24px; background:#E2E8F0"></div>
              <div>
                <span style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#10B981">
                  {{ selectedLessonId() ? t('Éditeur de Cours', 'Lesson Editor') : t('Créateur de Cours', 'Lesson Creator') }}
                </span>
                <h2 style="font-size:15px; font-weight:800; color:var(--text-primary); margin:0">{{ title || t('Sans titre', 'Untitled') }}</h2>
              </div>
            </div>

            <!-- Toolbar widgets -->
            <div style="display:flex; align-items:center; gap:10px">
              
              <!-- Color theme selector -->
              <button class="btn-s" style="display:flex; align-items:center; gap:6px" (click)="toggleThemePanel()" [style.border-color]="colorTheme === 'indigo' ? '#4f46e5' : (colorTheme === 'emerald' ? '#10b981' : (colorTheme === 'amber' ? '#f59e0b' : (colorTheme === 'rose' ? '#f43f5e' : '#8b5cf6')))">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2C6.48 2 2 6.48 2 12C2 14.73 3.09 17.2 4.86 19c.09.09.23.12.35.08c.12-.04.21-.15.21-.28v-2C5.42 15.26 6.68 14 8.23 14h1.5C11.28 14 12.53 15.26 12.53 16.8v3C12.53 21.02 11.76 22 10.8 22"/></svg>
                <span style="font-size:11.5px; font-weight:700; text-transform:uppercase">{{ colorTheme }}</span>
              </button>

              <!-- YouTube Link indicator -->
              <button class="btn-s" style="display:flex; align-items:center; gap:6px" (click)="toggleYoutubePanel()" [style.background]="youtubeUrl ? '#FEE2E2' : 'white'" [style.color]="youtubeUrl ? '#EF4444' : 'var(--text-primary)'">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
                <span style="font-size:11.5px; font-weight:700">{{ youtubeUrl ? t('Vidéo ajoutée', 'Video Linked') : t('Ajouter Vidéo', 'Link Video') }}</span>
              </button>

              <!-- Attachments indicator -->
              <button class="btn-s" style="display:flex; align-items:center; gap:6px" (click)="toggleAttachmentsPanel()" [style.background]="attachments.length > 0 ? '#E0F2FE' : 'white'" [style.color]="attachments.length > 0 ? '#0284C7' : 'var(--text-primary)'">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                <span style="font-size:11.5px; font-weight:700">{{ attachments.length > 0 ? attachments.length + t(' fichier(s)', ' file(s)') : t('Fichiers', 'Files') }}</span>
              </button>

              <!-- General configurations (XP, Level, Type) -->
              <button class="btn-s" style="display:flex; align-items:center; gap:6px" (click)="toggleConfigPanel()">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <span style="font-size:11.5px; font-weight:700">{{ t('Configuration', 'Settings') }}</span>
              </button>

              <div style="width:1px; height:24px; background:#E2E8F0"></div>

              <!-- Save / Publish buttons -->
              <button class="btn-s" (click)="saveAsDraft()">
                {{ t('Brouillon', 'Draft') }}
              </button>
              <button class="btn-p" [disabled]="!isValid()" (click)="publishLesson()" style="background:#10B981; border-color:#10B981">
                {{ selectedLessonId() ? t('Mettre à jour', 'Update') : t('Publier', 'Publish') }}
              </button>
            </div>
          </div>

          <!-- SIDE PANELS ROW (COLLAPSIBLE DRAWERS) -->
          @if (activePanel() !== 'none') {
            <div style="background:white; border-radius:12px; padding:18px; border:1px solid var(--border-weak); box-shadow:0 4px 6px -1px rgba(0,0,0,0.05); display:grid; gap:16px; animation: slideDown 0.18s ease-out">
              
              <!-- PANEL: THEME & COVER -->
              @if (activePanel() === 'theme') {
                <div>
                  <h4 style="font-size:12px; font-weight:800; text-transform:uppercase; color:#4F46E5; margin:0 0 12px 0">{{ t('Thème visuel & Couverture', 'Visual Theme & Cover') }}</h4>
                  <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:20px">
                    <div>
                      <label style="font-size:11.5px; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:8px">{{ t('Choisissez une palette de couleur pour ce cours', 'Choose color palette for this lesson') }}</label>
                      <div style="display:flex; gap:14px; align-items:center">
                        @for (themeOpt of [
                          { id: 'indigo', name: 'Indigo Breeze', primary: '#4F46E5', sec: '#EEF2FF' },
                          { id: 'emerald', name: 'Emerald Forest', primary: '#10B981', sec: '#ECFDF5' },
                          { id: 'amber', name: 'Amber Sunset', primary: '#F59E0B', sec: '#FFFBEB' },
                          { id: 'rose', name: 'Rose Petal', primary: '#F43F5E', sec: '#FFF1F2' },
                          { id: 'purple', name: 'Deep Amethyst', primary: '#8B5CF6', sec: '#F5F3FF' }
                        ]; track themeOpt.id) {
                          <button type="button"
                                  (click)="colorTheme = themeOpt.id"
                                  [style.background]="'linear-gradient(135deg, ' + themeOpt.primary + ' 0%, ' + themeOpt.sec + ' 100%)'"
                                  [title]="themeOpt.name"
                                  style="width:34px; height:34px; border-radius:50%; border:2px solid; cursor:pointer; transition:transform 0.15s; box-shadow:0 2px 4px rgba(0,0,0,0.1)"
                                  [style.border-color]="colorTheme === themeOpt.id ? '#0F172A' : 'transparent'"
                                  [style.transform]="colorTheme === themeOpt.id ? 'scale(1.15)' : 'scale(1)'">
                          </button>
                        }
                        <span style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; margin-left:6px">{{ colorTheme }}</span>
                      </div>
                    </div>
                    <div>
                      <label style="font-size:11.5px; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:8px">{{ t('Image de couverture de la leçon', 'Lesson Cover Image') }}</label>
                      <div style="display:flex; gap:12px; align-items:center">
                        <button type="button" class="btn-s" style="padding:6px 14px; font-size:12px; font-weight:700; display:flex; align-items:center; gap:6px" (click)="coverInput.click()">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                          {{ t('Importer', 'Upload') }}
                        </button>
                        <input type="file" #coverInput style="display:none" (change)="onCoverImageSelected($event)" accept="image/*" />
                        @if (coverImage) {
                          <div style="position:relative; width:90px; height:50px; border-radius:6px; overflow:hidden; border:1.5px solid var(--border-weak)">
                            <img [src]="coverImage" style="width:100%; height:100%; object-fit:cover" />
                            <button type="button" (click)="coverImage = ''" style="position:absolute; top:2px; right:2px; background:#EF4444; color:white; border:none; width:16px; height:16px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:bold; cursor:pointer">×</button>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              }

              <!-- PANEL: YOUTUBE MEDIA -->
              @if (activePanel() === 'youtube') {
                <div>
                  <h4 style="font-size:12px; font-weight:800; text-transform:uppercase; color:#EF4444; margin:0 0 12px 0">{{ t('Multimédia & Lien YouTube', 'Multimedia & YouTube Link') }}</h4>
                  <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:16px">
                    <div class="input-row" style="margin-bottom:0">
                      <label style="font-size:11.5px; font-weight:700; color:var(--text-secondary)">{{ t('URL de la vidéo YouTube intégrée', 'YouTube Video URL') }}</label>
                      <input type="text" [(ngModel)]="youtubeUrl" placeholder="https://www.youtube.com/watch?v=..." style="width:100%; padding:9px" />
                    </div>
                    <div class="input-row" style="margin-bottom:0">
                      <label style="font-size:11.5px; font-weight:700; color:var(--text-secondary)">{{ t('Description ou consignes vidéo', 'Video Description') }}</label>
                      <input type="text" [(ngModel)]="youtubeDescription" [placeholder]="t('ex. Regardez cette vidéo avant de faire les exercices...', 'e.g., Watch this video before doing the tasks...')" style="width:100%; padding:9px" />
                    </div>
                  </div>
                </div>
              }

              <!-- PANEL: ATTACHMENTS -->
              @if (activePanel() === 'attachments') {
                <div>
                  <h4 style="font-size:12px; font-weight:800; text-transform:uppercase; color:#0284C7; margin:0 0 12px 0">{{ t('Fichiers & Documents Joints', 'Attached Files & Documents') }}</h4>
                  <div style="display:flex; flex-direction:column; gap:10px">
                    <div style="display:flex; gap:12px; align-items:center">
                      <button type="button" class="btn-s" style="padding:6px 14px; font-size:12.5px; font-weight:700; display:flex; align-items:center; gap:6px" (click)="fileInput.click()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                        {{ t('Importer un fichier (PDF, Word, Images...)', 'Add Document file (PDF, Word, Images...)') }}
                      </button>
                      <input type="file" #fileInput style="display:none" (change)="onFileSelected($event)" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*" />
                    </div>
                    @if (attachments.length > 0) {
                      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:4px">
                        @for (att of attachments; track att.name; let idx = $index) {
                          <div style="display:flex; align-items:center; gap:6px; background:#F0F9FF; border:1px solid #B9E6FE; padding:6px 12px; border-radius:20px; font-size:11.5px; color:#0369A1; font-weight:600">
                            <span>{{ att.name }} ({{ att.size }})</span>
                            <button type="button" (click)="removeAttachment(idx)" style="background:none; border:none; color:#EF4444; font-weight:bold; cursor:pointer; padding:0 2px">×</button>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- PANEL: CONFIGURATION -->
              @if (activePanel() === 'config') {
                <div>
                  <h4 style="font-size:12px; font-weight:800; text-transform:uppercase; color:var(--text-primary); margin:0 0 12px 0">{{ t('Paramètres académiques & Points', 'Academic Settings & Points') }}</h4>
                  <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:16px">
                    <div class="input-row" style="margin-bottom:0">
                      <label style="font-size:11.5px; font-weight:700; color:var(--text-secondary)">{{ t('Niveau CEFR requis', 'Target CEFR Level') }}</label>
                      <select [(ngModel)]="level" style="width:100%; padding:8px">
                        <option value="A1">A1 — Beginner</option>
                        <option value="A2">A2 — Elementary</option>
                        <option value="B1">B1 — Intermediate</option>
                        <option value="B2">B2 — Upper Intermediate</option>
                      </select>
                    </div>
                    <div class="input-row" style="margin-bottom:0">
                      <label style="font-size:11.5px; font-weight:700; color:var(--text-secondary)">{{ t('Catégorie du cours', 'Lesson Category') }}</label>
                      <select [(ngModel)]="type" style="width:100%; padding:8px">
                        <option value="Grammar">Grammar / Conjugation</option>
                        <option value="Vocabulary">Vocabulary List</option>
                        <option value="Reading">Reading / Comprehension</option>
                      </select>
                    </div>
                    <div class="input-row" style="margin-bottom:0">
                      <label style="font-size:11.5px; font-weight:700; color:var(--text-secondary)">{{ t('Points XP à remporter', 'XP Points to Award') }}</label>
                      <input type="number" [(ngModel)]="points" style="width:100%; padding:8px" />
                    </div>
                  </div>
                </div>
              }

            </div>
          }

          <!-- DOCUMENT CANVAS AREA (THE CANVAS PAPER SHEET) -->
          <div style="max-width:840px; width:100%; margin:0 auto; background:white; border-radius:12px; border:1px solid var(--border-weak); box-shadow:0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05); display:flex; flex-direction:column; min-height:600px">
            
            <!-- EDITOR CANVAS HEADER: BORDERLESS TITLE INPUT -->
            <div style="padding:40px 40px 10px 40px">
              <input type="text" 
                     [(ngModel)]="title" 
                     [placeholder]="t('Entrez le titre de la leçon ici...', 'Enter lesson title here...')" 
                     style="font-size: 26px; font-weight: 850; border: none; border-bottom: 2px solid transparent; width: 100%; outline: none; margin-bottom: 8px; padding: 4px 0; color:var(--text-primary); transition: border-color 0.2s" 
                     onfocus="this.style.borderColor='#4F46E5'" 
                     onblur="this.style.borderColor='transparent'" />
              <div style="display:flex; align-items:center; gap:8px; font-size:11.5px; color:var(--text-muted)">
                <span class="badge" style="background:#E0E7FF; color:#4F46E5; font-weight:750">{{ level }}</span>
                <span>·</span>
                <span class="badge" style="background:#ECFDF5; color:#10B981; font-weight:750">{{ type }}</span>
                <span>·</span>
                <span>{{ points }} XP</span>
              </div>
              <div style="height:1px; background:#E2E8F0; margin-top:20px"></div>
            </div>

            <!-- RICH TEXT TOOLBAR SECTION -->
            <div class="editor-toolbar" style="display:flex; align-items:center; gap:4px; background:#F8FAFC; border-bottom:1px solid var(--border-weak); padding:8px 24px; flex-wrap:wrap; position:sticky; top:0; z-index:10; border-radius:0 0 0 0; backdrop-filter:blur(8px); background:rgba(248,250,252,0.97)">
              <!-- Undo / Redo -->
              <button type="button" class="tb-btn" (click)="execCmd('undo')" title="Undo">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
              </button>
              <button type="button" class="tb-btn" (click)="execCmd('redo')" title="Redo">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
              </button>
              
              <div class="tb-divider" style="width:1px; height:18px; background:var(--border-weak); margin:0 4px"></div>

              <!-- Format Text -->
              <button type="button" class="tb-btn" (click)="execCmd('bold')" title="Bold">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
              </button>
              <button type="button" class="tb-btn" (click)="execCmd('italic')" title="Italic">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
              </button>
              <button type="button" class="tb-btn" (click)="execCmd('underline')" title="Underline">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
              </button>
              <button type="button" class="tb-btn" (click)="execCmd('strikeThrough')" title="Strikethrough">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 4H9a3 3 0 0 0-2.83 4H19a4 4 0 0 1-3.6 4H8.35a4 4 0 0 0 3.75 4H15a3 3 0 0 0 3-3"/><line x1="4" y1="10" x2="20" y2="10"/></svg>
              </button>

              <div class="tb-divider" style="width:1px; height:18px; background:var(--border-weak); margin:0 4px"></div>

              <!-- Alignment -->
              <button type="button" class="tb-btn" (click)="execCmd('justifyLeft')" title="Align Left">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
              </button>
              <button type="button" class="tb-btn" (click)="execCmd('justifyCenter')" title="Align Center">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
              </button>
              <button type="button" class="tb-btn" (click)="execCmd('justifyRight')" title="Align Right">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
              </button>

              <div class="tb-divider" style="width:1px; height:18px; background:var(--border-weak); margin:0 4px"></div>

              <!-- Headings / Text block type -->
              <select style="font-size:11px; padding:3px 6px; border:1px solid var(--border); border-radius:4px; background:white; color:var(--text-primary); cursor:pointer; outline:none; height:24px" (change)="formatBlock($event)">
                <option value="p">{{ t('Paragraphe', 'Paragraph') }}</option>
                <option value="h3">{{ t('Titre principal', 'Main Heading') }}</option>
                <option value="h4">{{ t('Sous-titre', 'Subheading') }}</option>
                <option value="blockquote">{{ t('Citation', 'Quote block') }}</option>
              </select>

              <!-- Font size styling selection -->
              <select style="font-size:11px; padding:3px 6px; border:1px solid var(--border); border-radius:4px; background:white; color:var(--text-primary); cursor:pointer; outline:none; height:24px" (change)="changeFontSize($event)">
                <option value="3">{{ t('Taille standard', 'Normal Size') }}</option>
                <option value="4">{{ t('Moyenne', 'Medium') }}</option>
                <option value="5">{{ t('Grande', 'Large') }}</option>
                <option value="6">{{ t('Très grande', 'Extra Large') }}</option>
              </select>

              <div class="tb-divider" style="width:1px; height:18px; background:var(--border-weak); margin:0 4px"></div>

              <!-- Colors -->
              <div style="display:flex; align-items:center; gap:2px">
                @for (c of [
                  { name: 'Noir', code: '#000000' },
                  { name: 'Indigo', code: '#4F46E5' },
                  { name: 'Vert', code: '#10B981' },
                  { name: 'Orange', code: '#F59E0B' },
                  { name: 'Rouge', code: '#EF4444' },
                  { name: 'Violet', code: '#8B5CF6' }
                ]; track c.code) {
                  <button type="button" 
                          (click)="changeColor(c.code)"
                          [style.background]="c.code"
                          [title]="c.name"
                          style="width:14px; height:14px; border-radius:50%; border:1px solid #CBD5E1; cursor:pointer; padding:0; transition:transform 0.15s"
                          onmouseover="this.style.transform='scale(1.2)'"
                          onmouseout="this.style.transform='scale(1)'">
                  </button>
                }
              </div>

              <div class="tb-divider" style="width:1px; height:18px; background:var(--border-weak); margin:0 4px"></div>

              <!-- Bullet and numbered list -->
              <button type="button" class="tb-btn" (click)="execCmd('insertUnorderedList')" title="Bullet List">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
              <button type="button" class="tb-btn" (click)="execCmd('insertOrderedList')" title="Numbered List">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h1"/><path d="M4 14H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h1"/></svg>
              </button>

              <div class="tb-divider" style="width:1px; height:18px; background:var(--border-weak); margin:0 4px"></div>

              <!-- Remove Format -->
              <button type="button" class="tb-btn" (click)="execCmd('removeFormat')" title="Clear Formatting">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18.8 4A9 9 0 0 1 20 12a9 9 0 0 1-9 9 9 9 0 0 1-9-9 9 9 0 0 1 1.2-4.5"/><path d="M12 2v20"/><path d="m2 12 20-3"/></svg>
              </button>
            </div>

            <!-- THE PAPER EDITABLE BODY -->
            <div style="flex:1; padding:40px; display:flex; flex-direction:column; gap:24px">
              
              <!-- Contenteditable sheet -->
              <div style="display:flex; flex-direction:column; gap:6px">
                <span style="font-size:11px; font-weight:800; color:var(--text-muted)">{{ t('NOTES DE COURS (RÉDACTION)', 'LECTURE NOTES (WRITING)') }}</span>
                <div id="richEditor"
                     contenteditable="true"
                     class="rich-editor"
                     (input)="onEditorInput($event)"
                     (blur)="onEditorInput($event)"
                     style="min-height:280px; outline:none; font-size:14.5px; line-height:1.7; background:white; color:var(--text-primary)"
                     [attr.data-placeholder]="t('Commencez à rédiger vos notes de cours ici...', 'Start writing your lecture notes here...')">
                </div>
              </div>

              <div style="height:1px; background:#F1F5F9; margin:10px 0"></div>

              <!-- VOCABULARY SECTION inside document -->
              <div style="display:flex; flex-direction:column; gap:8px">
                <div style="display:flex; align-items:center; gap:8px; cursor:pointer" (click)="showVocabInput.set(!showVocabInput())">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:#8B5CF6"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/></svg>
                  <span style="font-size:12.5px; font-weight:800; color:var(--text-primary)">
                    {{ t('Lexique & Vocabulaire', 'Lexicon & Vocabulary List') }}
                    <span style="color:var(--text-muted); font-size:11px; font-weight:600; margin-left:4px">({{ vocabText.split('\n').filter(l => l.trim()).length }} {{ t('mots', 'words') }})</span>
                  </span>
                  <span style="font-size:10px; color:var(--text-muted)">{{ showVocabInput() ? '▼' : '►' }}</span>
                </div>

                @if (showVocabInput()) {
                  <div style="margin-left:22px; animation: slideDown 0.15s ease-out">
                    <label style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:6px">
                      {{ t('Entrez les termes sous la forme : mot - traduction (un terme par ligne)', 'Enter terms in the format: word - translation (one term per line)') }}
                    </label>
                    <textarea [(ngModel)]="vocabText" rows="4" placeholder="e.g. apple - pomme" style="width:100%; font-family:monospace; font-size:12.5px; padding:10px; border-radius:8px; border:1px solid var(--border); outline:none"></textarea>
                  </div>
                }
              </div>

              <div style="height:1px; background:#F1F5F9; margin:10px 0"></div>

              <!-- HOMEWORK TASK & DUE DATE inside document -->
              <div style="display:flex; flex-direction:column; gap:8px">
                <div style="display:flex; align-items:center; gap:8px; cursor:pointer" (click)="showHomeworkInput.set(!showHomeworkInput())">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color:#10B981"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  <span style="font-size:12.5px; font-weight:800; color:var(--text-primary)">
                    {{ t('Consignes de Devoir', 'Homework Instructions') }}
                    @if (dueDate) {
                      <span style="color:#10B981; font-size:11px; font-weight:700; margin-left:6px">({{ t('Limite :', 'Due:') }} {{ dueDate }})</span>
                    }
                  </span>
                  <span style="font-size:10px; color:var(--text-muted)">{{ showHomeworkInput() ? '▼' : '►' }}</span>
                </div>

                @if (showHomeworkInput()) {
                  <div style="margin-left:22px; display:grid; grid-template-columns:1.5fr 1fr; gap:16px; animation: slideDown 0.15s ease-out">
                    <div class="input-row" style="margin-bottom:0">
                      <label style="font-size:11px; color:var(--text-muted)">{{ t('Description des devoirs', 'Describe homework task') }}</label>
                      <textarea [(ngModel)]="homeworkInstruction" rows="3" [placeholder]="t('ex. Rédiger un texte de 150 mots...', 'e.g., Write a 150-word text...')" style="width:100%; padding:10px; border-radius:8px; border:1px solid var(--border); outline:none"></textarea>
                    </div>
                    <div class="input-row" style="margin-bottom:0">
                      <label style="font-size:11px; color:var(--text-muted)">{{ t('Date limite de rendu', 'Due Date') }}</label>
                      <input type="date" [(ngModel)]="dueDate" style="width:100%; padding:8px; border-radius:8px; border:1px solid var(--border); outline:none" />
                    </div>
                  </div>
                }
              </div>

            </div>

          </div>

        </div>
      }

      <!-- Published Lessons List (Visible first by default) -->
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
          <h3 class="st" style="font-size:16px; margin:0">{{ t('Cours publiés', 'Published Lessons') }}</h3>
          <button class="btn-s" style="font-size:12px" (click)="showDrafts.set(!showDrafts())">
            {{ showDrafts() ? t('Masquer les brouillons', 'Hide Drafts') : t('Afficher les brouillons', 'Show Drafts') }} ({{ drafts().length }})
          </button>
        </div>
        @if (lessons().length === 0) {
          <div style="font-size:13px; color:var(--text-secondary); text-align:center; padding:16px 0">
            {{ t('Aucun cours publié pour le moment.', 'No lessons published yet.') }}
          </div>
        } @else {
          <table style="width:100%; border-collapse:collapse; font-size:12px">
            <thead>
              <tr style="text-align:left; border-bottom:2px solid var(--border-weak); color:var(--text-muted)">
                <th style="padding:8px">{{ t('Titre', 'Title') }}</th>
                <th style="padding:8px">{{ t('Niveau', 'Level') }}</th>
                <th style="padding:8px">{{ t('Type', 'Type') }}</th>
                <th style="padding:8px">{{ t('Thème', 'Theme') }}</th>
                <th style="padding:8px">{{ t('Mots', 'Words') }}</th>
                <th style="padding:8px; text-align:right">{{ t('Action', 'Action') }}</th>
              </tr>
            </thead>
            <tbody>
              @for (lesson of lessons(); track lesson.id) {
                <tr style="border-bottom:1px solid var(--border-weak)">
                  <td style="padding:8px; font-weight:600; color:var(--text-primary)">{{ lesson.title }}</td>
                  <td style="padding:8px"><span class="badge" style="background:#E0E7FF; color:#3730A3">{{ lesson.level }}</span></td>
                  <td style="padding:8px">{{ lesson.type === 'Grammar' ? t('Grammaire', 'Grammar') : (lesson.type === 'Listening' ? t('Compréhension', 'Listening') : t('Vocabulaire', 'Vocabulary')) }}</td>
                  <td style="padding:8px">
                    <span class="badge" 
                          [style.background]="lesson.colorTheme === 'emerald' ? '#ECFDF5' : (lesson.colorTheme === 'amber' ? '#FFFBEB' : (lesson.colorTheme === 'rose' ? '#FFF1F2' : (lesson.colorTheme === 'purple' ? '#F5F3FF' : '#EEF2FF')))" 
                          [style.color]="lesson.colorTheme === 'emerald' ? '#047857' : (lesson.colorTheme === 'amber' ? '#B45309' : (lesson.colorTheme === 'rose' ? '#9F1239' : (lesson.colorTheme === 'purple' ? '#6D28D9' : '#3730A3')))"
                          style="text-transform: capitalize; font-size:9.5px; font-weight:800">
                      {{ lesson.colorTheme || 'indigo' }}
                    </span>
                  </td>
                  <td style="padding:8px">{{ lesson.vocabulary.length }} items</td>
                  <td style="padding:8px; text-align:right; display:flex; gap:4px; justify-content:flex-end">
                    <button class="btn-s" style="padding:5px 9px; font-size:11px; display:inline-flex; align-items:center; gap:4px" (click)="editLesson(lesson)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      {{ t('Modifier', 'Edit') }}
                    </button>
                    <button class="btn-s" style="padding:5px 9px; font-size:11px; border-color:#EF4444; color:#EF4444; display:inline-flex; align-items:center; gap:4px" (click)="deleteLesson(lesson)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      {{ t('Supprimer', 'Delete') }}
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
          <h3 class="st" style="font-size:16px; margin-bottom:12px; color:#F59E0B">{{ t('Brouillons', 'Drafts') }}</h3>
          @if (drafts().length === 0) {
            <div style="font-size:13px; color:var(--text-secondary); text-align:center; padding:16px 0">
              {{ t('Aucun brouillon enregistré.', 'No drafts saved.') }}
            </div>
          } @else {
            <table style="width:100%; border-collapse:collapse; font-size:12px">
              <thead>
                <tr style="text-align:left; border-bottom:2px solid var(--border-weak); color:var(--text-muted)">
                  <th style="padding:8px">{{ t('Titre', 'Title') }}</th>
                  <th style="padding:8px">{{ t('Niveau', 'Level') }}</th>
                  <th style="padding:8px">{{ t('Type', 'Type') }}</th>
                  <th style="padding:8px">{{ t('Créé le', 'Created') }}</th>
                  <th style="padding:8px; text-align:right">{{ t('Actions', 'Actions') }}</th>
                </tr>
              </thead>
              <tbody>
                @for (draft of drafts(); track draft.id) {
                  <tr style="border-bottom:1px solid var(--border-weak)">
                    <td style="padding:8px; font-weight:600; color:var(--text-primary)">{{ draft.title }}</td>
                    <td style="padding:8px"><span class="badge" style="background:#FEF3C7; color:#92400E">{{ draft.level }}</span></td>
                    <td style="padding:8px">{{ draft.type === 'Grammar' ? t('Grammaire', 'Grammar') : (draft.type === 'Listening' ? t('Compréhension', 'Listening') : t('Vocabulaire', 'Vocabulary')) }}</td>
                    <td style="padding:8px; font-size:11px; color:var(--text-muted)">{{ draft.createdAt | date:'short' }}</td>
                    <td style="padding:8px; text-align:right; display:flex; gap:4px; justify-content:flex-end">
                      <button class="btn-s" style="padding:5px 9px; font-size:11px; display:inline-flex; align-items:center; gap:4px" (click)="editLesson(draft)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        {{ t('Modifier', 'Edit') }}
                      </button>
                      <button class="btn-p" style="padding:5px 9px; font-size:11px; background:#10B981; border-color:#10B981; display:inline-flex; align-items:center; gap:4px" (click)="publishDraft(draft.id)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        {{ t('Publier', 'Publish') }}
                      </button>
                      <button class="btn-s" style="padding:5px 9px; font-size:11px; border-color:#EF4444; color:#EF4444; display:inline-flex; align-items:center; gap:4px" (click)="deleteLesson(draft)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        {{ t('Supprimer', 'Delete') }}
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
  `,
  styles: [`
    .tb-btn {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid transparent;
      border-radius: 4px;
      background: none;
      color: #475569;
      cursor: pointer;
      padding: 0;
      transition: all 0.15s;
    }
    .tb-btn:hover {
      background: #E2E8F0;
      color: #0F172A;
      border-color: #CBD5E1;
    }
    .rich-editor h3 {
      font-size: 16px;
      font-weight: 800;
      color: #1E1B4B;
      margin-top: 14px;
      margin-bottom: 8px;
    }
    .rich-editor h4 {
      font-size: 14px;
      font-weight: 700;
      color: #4F46E5;
      margin-top: 12px;
      margin-bottom: 6px;
    }
    .rich-editor blockquote {
      border-left: 4px solid #CBD5E1;
      padding-left: 12px;
      color: #64748B;
      font-style: italic;
      margin: 10px 0;
    }
    .rich-editor ul, .rich-editor ol {
      padding-left: 20px;
      margin: 10px 0;
    }
    .rich-editor:empty::before {
      content: attr(data-placeholder);
      color: #94A3B8;
      cursor: text;
    }
  `]
})
export class TeacherLessonsComponent {
  public db = inject(DatabaseService);
  private dialogService = inject(DialogService);
  activeLang = this.db.activeLang;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

  selectedLessonId = signal<string | null>(null);
  lessons = signal<Lesson[]>([]);
  drafts = signal<Lesson[]>([]);
  showDrafts = signal(false);
  isFormOpen = signal<boolean>(false);
  activePanel = signal<'none' | 'theme' | 'youtube' | 'attachments' | 'config'>('none');
  showVocabInput = signal<boolean>(true);
  showHomeworkInput = signal<boolean>(true);

  toggleThemePanel() {
    this.activePanel.set(this.activePanel() === 'theme' ? 'none' : 'theme');
  }
  toggleYoutubePanel() {
    this.activePanel.set(this.activePanel() === 'youtube' ? 'none' : 'youtube');
  }
  toggleAttachmentsPanel() {
    this.activePanel.set(this.activePanel() === 'attachments' ? 'none' : 'attachments');
  }
  toggleConfigPanel() {
    this.activePanel.set(this.activePanel() === 'config' ? 'none' : 'config');
  }

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
  attachments: { name: string; size: string; type: string; base64: string }[] = [];
  colorTheme = 'indigo';
  coverImage = '';

  onCoverImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.coverImage = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  constructor() {
    this.db.observeLessons().subscribe(list => {
      this.lessons.set(list.filter(l => l.status === 'published'));
      this.drafts.set(list.filter(l => l.status === 'draft'));
    });
  }

  deleteLesson(lesson: Lesson) {
    this.dialogService.confirm(
      this.t('Supprimer le cours', 'Delete Lesson'),
      this.t('Êtes-vous sûr de vouloir supprimer ce cours ?', 'Are you sure you want to delete this lesson?'),
      () => {
        this.db.deleteLesson(lesson.id);
        this.dialogService.alert(
          this.t('Supprimé', 'Deleted'),
          this.t('Cours supprimé avec succès !', 'Lesson deleted successfully!'),
          'success'
        );
        if (this.selectedLessonId() === lesson.id) {
          this.resetForm();
        }
      }
    );
  }

  startNewLesson() {
    this.resetForm();
    this.isFormOpen.set(true);
    setTimeout(() => {
      const el = document.getElementById('richEditor');
      if (el) el.innerHTML = '';
    }, 50);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      
      let sizeStr = '';
      if (file.size < 1024) sizeStr = file.size + ' B';
      else if (file.size < 1048576) sizeStr = (file.size / 1024).toFixed(1) + ' KB';
      else sizeStr = (file.size / 1048576).toFixed(1) + ' MB';

      this.attachments.push({
        name: file.name,
        size: sizeStr,
        type: file.type || 'application/octet-stream',
        base64: base64String
      });
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  }

  removeAttachment(index: number) {
    this.attachments.splice(index, 1);
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
      points: this.points,
      attachments: this.attachments,
      colorTheme: this.colorTheme,
      coverImage: this.coverImage
    };

    const id = this.selectedLessonId();
    if (id) {
      this.db.updateLesson(id, lessonData);
      this.dialogService.alert(
        this.t('Succès', 'Success'),
        this.t('Brouillon mis à jour avec succès !', 'Draft updated successfully!'),
        'success'
      );
    } else {
      this.db.addLesson(lessonData);
      this.dialogService.alert(
        this.t('Succès', 'Success'),
        this.t('Brouillon enregistré avec succès !', 'Draft saved successfully!'),
        'success'
      );
    }
    this.resetForm();
  }

  publishDraft(draftId: string) {
    const draft = this.drafts().find(d => d.id === draftId);
    this.db.updateLesson(draftId, { status: 'published' });

    this.db.sendNotification({
      recipientId: 'all',
      recipientRole: 'student',
      type: 'exercise_assigned',
      title: '📖 Nouveau cours disponible',
      message: `Le cours "${draft?.title || ''}" a été publié. Date limite de rendu : ${draft?.dueDate || '-'}`,
    });

    this.dialogService.alert(
      this.t('Succès', 'Success'),
      this.t('Cours publié avec succès !', 'Lesson published successfully!'),
      'success'
    );
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
    this.attachments = lesson.attachments || [];
    this.colorTheme = lesson.colorTheme || 'indigo';
    this.coverImage = lesson.coverImage || '';
    this.isFormOpen.set(true);
    setTimeout(() => {
      const el = document.getElementById('richEditor');
      if (el) el.innerHTML = this.content;
    }, 50);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      points: this.points,
      attachments: this.attachments,
      colorTheme: this.colorTheme,
      coverImage: this.coverImage
    };

    const id = this.selectedLessonId();
    if (id) {
      this.db.updateLesson(id, lessonData);

      this.db.sendNotification({
        recipientId: 'all',
        recipientRole: 'student',
        type: 'exercise_assigned',
        title: '✏️ Cours d’anglais mis à jour',
        message: `Le cours "${this.title}" a été mis à jour par votre professeur.`,
      });

      this.dialogService.alert(
        this.t('Succès', 'Success'),
        this.t("Cours d'anglais mis à jour avec succès !", 'English Lesson updated successfully!'),
        'success'
      );
    } else {
      this.db.addLesson(lessonData);

      this.db.sendNotification({
        recipientId: 'all',
        recipientRole: 'student',
        type: 'exercise_assigned',
        title: '📖 Nouveau cours disponible',
        message: `Le cours "${this.title}" a été publié par ${currentUser?.name || 'votre professeur'}. Date limite : ${this.dueDate}.`,
      });

      this.dialogService.alert(
        this.t('Succès', 'Success'),
        this.t("Cours d'anglais publié avec succès !", 'English Lesson published successfully!'),
        'success'
      );
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
    this.attachments = [];
    this.colorTheme = 'indigo';
    this.coverImage = '';
    this.isFormOpen.set(false);
    this.activePanel.set('none');
    this.showVocabInput.set(true);
    this.showHomeworkInput.set(true);
    const el = document.getElementById('richEditor');
    if (el) el.innerHTML = '';
  }

  execCmd(command: string, value: string = '') {
    document.execCommand(command, false, value);
    this.syncContentFromDOM();
  }

  formatBlock(event: any) {
    const tag = event.target.value;
    document.execCommand('formatBlock', false, `<${tag}>`);
    this.syncContentFromDOM();
  }

  changeFontSize(event: any) {
    const size = event.target.value;
    document.execCommand('fontSize', false, size);
    this.syncContentFromDOM();
  }

  changeColor(color: string) {
    document.execCommand('foreColor', false, color);
    this.syncContentFromDOM();
  }

  onEditorInput(event: any) {
    this.content = event.target.innerHTML;
  }

  syncContentFromDOM() {
    const el = document.getElementById('richEditor');
    if (el) {
      this.content = el.innerHTML;
    }
  }
}