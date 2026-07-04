import { Component, inject, signal, computed, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Ebook, EbookPage, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-ebooks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="animation: fadeIn 0.25s; padding:0">

      <!-- ============================================================ -->
      <!-- ==================== FULL-SCREEN EDITOR ==================== -->
      <!-- ============================================================ -->
      @if (showEditor()) {
        <div style="background:#F8FAFC; margin:0; padding:24px; min-height:calc(100vh - 60px); display:flex; flex-direction:column; gap:20px; animation: fadeIn 0.2s ease-out">

          <!-- ── TOP WORKSPACE MENU ── -->
          <div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:12px 24px; border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05); border:1px solid var(--border-weak)">
            <div style="display:flex; align-items:center; gap:16px">
              <button class="btn-s" style="padding:6px 12px; font-weight:700; display:flex; align-items:center; gap:6px" (click)="clearForm()">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                {{ t('Retour', 'Back') }}
              </button>
              <div style="width:1px; height:24px; background:#E2E8F0"></div>
              <div>
                <span style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:#7C3AED">
                  {{ editingBookId() ? t('Éditeur Ebook', 'Ebook Editor') : t('Créateur Ebook', 'Ebook Creator') }}
                </span>
                <h2 style="font-size:15px; font-weight:800; color:var(--text-primary); margin:0">{{ newTitle || t('Sans titre', 'Untitled') }}</h2>
              </div>
            </div>

            <!-- Toolbar Buttons -->
            <div style="display:flex; align-items:center; gap:10px">

              <!-- Cover Theme -->
              <button class="btn-s" style="display:flex; align-items:center; gap:6px" (click)="togglePanel('theme')"
                [style.border-color]="ebookColorTheme === 'purple' ? '#7C3AED' : (ebookColorTheme === 'emerald' ? '#10b981' : (ebookColorTheme === 'amber' ? '#f59e0b' : (ebookColorTheme === 'rose' ? '#f43f5e' : '#4f46e5')))">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/><path d="M12 3a14 14 0 0 1 3.5 9A14 14 0 0 1 12 21A14 14 0 0 1 8.5 12A14 14 0 0 1 12 3z"/></svg>
                <span style="font-size:11.5px; font-weight:700; text-transform:uppercase">{{ t('Couverture', 'Cover') }}</span>
              </button>

              <!-- YouTube per page -->
              <button class="btn-s" style="display:flex; align-items:center; gap:6px" (click)="togglePanel('youtube')"
                [style.background]="pageYoutubeUrl ? '#FEE2E2' : 'white'" [style.color]="pageYoutubeUrl ? '#EF4444' : 'var(--text-primary)'">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>
                <span style="font-size:11.5px; font-weight:700">{{ pageYoutubeUrl ? t('Vidéo ajoutée', 'Video Linked') : t('Ajouter Vidéo', 'Link Video') }}</span>
              </button>

              <!-- Config -->
              <button class="btn-s" style="display:flex; align-items:center; gap:6px" (click)="togglePanel('config')">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <span style="font-size:11.5px; font-weight:700">{{ t('Configuration', 'Settings') }}</span>
              </button>

              <div style="width:1px; height:24px; background:#E2E8F0"></div>

              <!-- Preview toggle -->
              <button class="btn-s" style="display:flex; align-items:center; gap:6px" (click)="previewMode.set(!previewMode())"
                [style.background]="previewMode() ? '#F3E8FF' : 'white'" [style.color]="previewMode() ? '#7C3AED' : 'var(--text-primary)'">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                <span style="font-size:11.5px; font-weight:700">{{ previewMode() ? t('Éditer', 'Edit') : t('Aperçu', 'Preview') }}</span>
              </button>

              <!-- Save / Publish -->
              <button class="btn-s" (click)="saveEbook(true)">{{ t('Brouillon', 'Draft') }}</button>
              <button class="btn-p" (click)="saveEbook(false)" style="background:#7C3AED; border-color:#7C3AED">
                {{ editingBookId() ? t('Mettre à jour', 'Update') : t('Publier', 'Publish') }}
              </button>
            </div>
          </div>

          <!-- ── COLLAPSIBLE SIDE PANELS ── -->
          @if (activePanel() !== 'none') {
            <div style="background:white; border-radius:12px; padding:18px; border:1px solid var(--border-weak); box-shadow:0 4px 6px -1px rgba(0,0,0,0.05); display:grid; gap:16px; animation: slideDown 0.18s ease-out">

              <!-- PANEL: COVER THEME -->
              @if (activePanel() === 'theme') {
                <div>
                  <h4 style="font-size:12px; font-weight:800; text-transform:uppercase; color:#7C3AED; margin:0 0 14px 0">{{ t('Couverture & Thème visuel', 'Cover & Visual Theme') }}</h4>
                  <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:20px">
                    <!-- Cover info -->
                    <div style="display:flex; flex-direction:column; gap:12px">
                      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px">
                        <div>
                          <label style="font-size:11px; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:4px">{{ t('Titre du livre', 'Book Title') }}</label>
                          <input [(ngModel)]="newTitle" [placeholder]="t('Ex: Anglais des Affaires','Ex: Business English')" class="form-input" style="height:34px;font-size:13px"/>
                        </div>
                        <div>
                          <label style="font-size:11px; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:4px">{{ t('Description', 'Description') }}</label>
                          <input [(ngModel)]="newDescription" [placeholder]="t('Brève description...','Brief description...')" class="form-input" style="height:34px;font-size:13px"/>
                        </div>
                        <div>
                          <label style="font-size:11px; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:4px">{{ t('Icône', 'Icon') }}</label>
                          <select [(ngModel)]="newCoverEmoji" class="form-select" style="height:34px;font-size:13px">
                            <option value="book">📘 {{ t('Manuel','Manual') }}</option>
                            <option value="award">🏅 {{ t('Certificat','Certificate') }}</option>
                            <option value="star">⭐ {{ t('Succès','Success') }}</option>
                            <option value="graduation">🎓 {{ t('Académique','Academic') }}</option>
                            <option value="message">💬 {{ t('Dialogue','Dialogue') }}</option>
                          </select>
                        </div>
                        <div>
                          <label style="font-size:11px; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:4px">{{ t('Couleur de fond', 'Background Color') }}</label>
                          <select [(ngModel)]="newCoverColor" class="form-select" style="height:34px;font-size:13px">
                            <option value="#4F46E5">Indigo</option>
                            <option value="#10B981">Émeraude</option>
                            <option value="#F59E0B">Ambre</option>
                            <option value="#EF4444">Rouge</option>
                            <option value="#EC4899">Rose</option>
                            <option value="#8B5CF6">Violet</option>
                            <option value="#374151">Ardoise</option>
                          </select>
                        </div>
                        <div>
                          <label style="font-size:11px; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:4px">{{ t('Dégradé', 'Gradient') }}</label>
                          <select [(ngModel)]="newCoverGradient" class="form-select" style="height:34px;font-size:13px">
                            <option value="">{{ t('Aucun','None') }}</option>
                            <option value="linear-gradient(135deg,#FF512F 0%,#DD2476 100%)">Sunset Glow</option>
                            <option value="linear-gradient(135deg,#1FA2FF 0%,#12D8FA 50%,#A6FFCB 100%)">Ocean Breeze</option>
                            <option value="linear-gradient(135deg,#3A1C71 0%,#D76D77 50%,#FFAF7B 100%)">Rose Wine</option>
                            <option value="linear-gradient(135deg,#0575E6 0%,#00F260 100%)">Emerald Slate</option>
                            <option value="linear-gradient(135deg,#7C3AED 0%,#4F46E5 100%)">Deep Purple</option>
                          </select>
                        </div>
                        <div>
                          <label style="font-size:11px; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:4px">{{ t('Image couverture URL', 'Cover Image URL') }}</label>
                          <div style="display:flex; gap:6px">
                            <input [(ngModel)]="newCoverImageUrl" placeholder="https://..." class="form-input" style="height:34px;font-size:12px;flex:1"/>
                            <button class="btn-s" style="height:34px;padding:0 10px" (click)="ebookFile.click()">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            </button>
                            <input type="file" #ebookFile style="display:none" (change)="onEbookCoverUploaded($event)" accept="image/*"/>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Live Cover Preview -->
                    <div style="display:flex; flex-direction:column; align-items:center; gap:12px">
                      <label style="font-size:11px; font-weight:700; color:var(--text-secondary)">{{ t('Aperçu couverture', 'Cover Preview') }}</label>
                      <div [style.background]="newCoverImageUrl ? 'url(' + newCoverImageUrl + ') center/cover' : (newCoverGradient || newCoverColor || '#7C3AED')"
                           style="width:100px; height:145px; border-radius:8px; position:relative; box-shadow:0 8px 24px rgba(0,0,0,0.2); overflow:hidden; display:flex; align-items:flex-end; justify-content:center; padding-bottom:12px">
                        <div style="position:absolute; top:0; left:0; width:5px; height:100%; background:rgba(0,0,0,0.2)"></div>
                        <div style="position:absolute; inset:0; background:rgba(0,0,0,0.1)"></div>
                        <span style="position:relative; z-index:1; color:white; font-size:24px">
                          {{ newCoverEmoji === 'book' ? '📘' : newCoverEmoji === 'award' ? '🏅' : newCoverEmoji === 'star' ? '⭐' : newCoverEmoji === 'graduation' ? '🎓' : '💬' }}
                        </span>
                      </div>
                      <p style="font-size:11px; font-weight:700; color:var(--text-primary); text-align:center; margin:0; max-width:110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">{{ newTitle || t('Titre','Title') }}</p>
                    </div>
                  </div>
                </div>
              }

              <!-- PANEL: YOUTUBE (per active page) -->
              @if (activePanel() === 'youtube') {
                <div>
                  <h4 style="font-size:12px; font-weight:800; text-transform:uppercase; color:#EF4444; margin:0 0 12px 0">{{ t('Vidéo YouTube — Page active', 'YouTube Video — Active Page') }}</h4>
                  <div style="display:grid; grid-template-columns:1.5fr 1fr; gap:16px">
                    <div>
                      <label style="font-size:11.5px; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:6px">{{ t('URL de la vidéo YouTube', 'YouTube Video URL') }}</label>
                      <input type="text" [(ngModel)]="pageYoutubeUrl" placeholder="https://www.youtube.com/watch?v=..." style="width:100%; padding:9px; border:1px solid var(--border); border-radius:6px; font-size:13px; background:var(--surface-1); color:var(--text-primary)" (input)="saveYoutubeToPage()"/>
                    </div>
                    <div>
                      <label style="font-size:11.5px; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:6px">{{ t('Description / Consignes', 'Description / Instructions') }}</label>
                      <input type="text" [(ngModel)]="pageYoutubeDesc" [placeholder]="t('ex. Regardez cette vidéo...','e.g. Watch this video...')" style="width:100%; padding:9px; border:1px solid var(--border); border-radius:6px; font-size:13px; background:var(--surface-1); color:var(--text-primary)" (input)="saveYoutubeToPage()"/>
                    </div>
                  </div>
                  @if (editingPageIndex() < 0) {
                    <p style="font-size:11px; color:var(--text-muted); margin:8px 0 0 0">⚠️ {{ t('Sélectionnez ou créez une page pour associer une vidéo.','Select or create a page to link a video.') }}</p>
                  }
                </div>
              }

              <!-- PANEL: CONFIGURATION -->
              @if (activePanel() === 'config') {
                <div>
                  <h4 style="font-size:12px; font-weight:800; text-transform:uppercase; color:var(--text-primary); margin:0 0 12px 0">{{ t('Paramètres académiques', 'Academic Settings') }}</h4>
                  <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:16px">
                    <div>
                      <label style="font-size:11.5px; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:6px">{{ t('Niveau cible','Target Level') }}</label>
                      <select [(ngModel)]="newLevel" style="width:100%; padding:8px; border:1px solid var(--border); border-radius:6px; font-size:13px; background:var(--surface-1); color:var(--text-primary)">
                        <option value="All">{{ t('Tous Niveaux','All Levels') }}</option>
                        <option value="Beginner">{{ t('Débutant (A1-A2)','Beginner (A1-A2)') }}</option>
                        <option value="Intermediate">{{ t('Intermédiaire (B1)','Intermediate (B1)') }}</option>
                        <option value="Advanced">{{ t('Avancé (B2)','Advanced (B2)') }}</option>
                      </select>
                    </div>
                    <div>
                      <label style="font-size:11.5px; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:6px">{{ t('Langue du livre','Book Language') }}</label>
                      <select [(ngModel)]="newLanguage" style="width:100%; padding:8px; border:1px solid var(--border); border-radius:6px; font-size:13px; background:var(--surface-1); color:var(--text-primary)">
                        <option value="fr">🇫🇷 Français</option>
                        <option value="en">🇬🇧 English</option>
                      </select>
                    </div>
                    <div>
                      <label style="font-size:11.5px; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:6px">{{ t('Introduction courte','Short Description') }}</label>
                      <input [(ngModel)]="newDescription" [placeholder]="t('Brève description du contenu...','Brief description...')" style="width:100%; padding:8px; border:1px solid var(--border); border-radius:6px; font-size:13px; background:var(--surface-1); color:var(--text-primary)"/>
                    </div>
                  </div>
                </div>
              }
            </div>
          }

          <!-- ── DOCUMENT CANVAS ── -->
          <div style="max-width:840px; width:100%; margin:0 auto; background:white; border-radius:12px; border:1px solid var(--border-weak); box-shadow:0 10px 25px -5px rgba(0,0,0,0.05); display:flex; flex-direction:column; min-height:600px">

            @if (previewMode()) {
              <!-- ── PREVIEW MODE ── -->
              <div style="padding:48px 40px; font-family:'Georgia',serif">
                <div style="display:flex; align-items:center; gap:14px; margin-bottom:28px">
                  <div [style.background]="newCoverGradient || newCoverColor || '#7C3AED'"
                       style="width:52px; height:52px; border-radius:10px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.12); font-size:24px">
                    {{ newCoverEmoji === 'book' ? '📘' : newCoverEmoji === 'award' ? '🏅' : newCoverEmoji === 'star' ? '⭐' : newCoverEmoji === 'graduation' ? '🎓' : '💬' }}
                  </div>
                  <div>
                    <h1 style="font-size:24px; font-weight:900; color:var(--text-primary); margin:0 0 2px 0">{{ newTitle || t('Sans titre','Untitled') }}</h1>
                    <span style="font-size:11px; color:var(--text-muted)">{{ currentUser()?.name || 'Professeur' }} · {{ newLevel }} · {{ newLanguage === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN' }}</span>
                  </div>
                </div>

                @if (formPages().length > 0) {
                  <!-- Page tabs -->
                  <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:20px; border-bottom:2px solid #F3F4F6; padding-bottom:12px">
                    @for (pg of formPages(); track pg.id; let i = $index) {
                      <button (click)="previewPageIndex.set(i)"
                              [style.background]="previewPageIndex() === i ? '#7C3AED' : '#F3F4F6'"
                              [style.color]="previewPageIndex() === i ? 'white' : 'var(--text-secondary)'"
                              style="border:none; border-radius:20px; padding:4px 14px; font-size:11px; font-weight:700; cursor:pointer; transition:all 0.2s">
                        {{ i + 1 }}. {{ pg.title || t('Sans titre','Untitled') }}
                      </button>
                    }
                  </div>
                  @if (formPages()[previewPageIndex()]; as pg) {
                    @if (pg.youtubeUrl) {
                      <div style="margin-bottom:20px; border-radius:10px; overflow:hidden; aspect-ratio:16/9; background:#000">
                        <iframe [src]="sanitizeYoutubeUrl(pg.youtubeUrl)" style="width:100%;height:100%;border:none" allowfullscreen></iframe>
                      </div>
                      @if (pg.youtubeDesc) {
                        <p style="font-size:12px; color:var(--text-secondary); margin:0 0 16px 0; font-style:italic">{{ pg.youtubeDesc }}</p>
                      }
                    }
                    <h3 style="font-size:18px; font-weight:800; color:var(--text-primary); margin:0 0 14px 0">{{ pg.title }}</h3>
                    <div style="font-size:15px; line-height:1.9; color:#2D2D2D" [innerHTML]="pg.content || ''"></div>
                  }
                } @else {
                  <div style="font-size:15px; line-height:1.9; color:#2D2D2D; white-space:pre-wrap">{{ newContent || t('(Pas encore de contenu)','(No content yet)') }}</div>
                }
              </div>
            } @else {
              <!-- ── EDIT MODE ── -->
              <!-- Canvas Title -->
              <div style="padding:40px 40px 10px 40px">
                <input type="text"
                       [(ngModel)]="newTitle"
                       [placeholder]="db.activeLang() === 'en' ? 'Enter ebook title here...' : 'Titre ebook...'"
                       style="font-size:26px; font-weight:850; border:none; border-bottom:2px solid transparent; width:100%; outline:none; margin-bottom:8px; padding:4px 0; color:var(--text-primary); transition: border-color 0.2s"
                       onfocus="this.style.borderColor='#7C3AED'"
                       onblur="this.style.borderColor='transparent'"/>
                <div style="display:flex; align-items:center; gap:8px; font-size:11.5px; color:var(--text-muted)">
                  <span class="badge" style="background:#F3E8FF; color:#7C3AED; font-weight:750">{{ newLevel }}</span>
                  <span>·</span>
                  <span class="badge" style="background:#ECFDF5; color:#10B981; font-weight:750">{{ newLanguage === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN' }}</span>
                  <span>·</span>
                  <span>{{ formPages().length }} {{ formPages().length === 1 ? t('page','page') : t('pages','pages') }}</span>
                </div>
                <div style="height:1px; background:#E2E8F0; margin-top:20px"></div>
              </div>

              <!-- Rich Text Toolbar for active page -->
              @if (editingPageIndex() >= 0) {
                <div style="display:flex; align-items:center; gap:4px; background:#F8FAFC; border-bottom:1px solid var(--border-weak); padding:8px 24px; flex-wrap:wrap; position:sticky; top:0; z-index:10; backdrop-filter:blur(8px); background:rgba(248,250,252,0.97)">
                  <!-- Undo/Redo -->
                  <button type="button" class="tb-btn" (click)="execPageCmd('undo')" title="Undo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
                  </button>
                  <button type="button" class="tb-btn" (click)="execPageCmd('redo')" title="Redo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/></svg>
                  </button>
                  <div style="width:1px; height:18px; background:var(--border-weak); margin:0 4px"></div>

                  <!-- Bold / Italic / Underline -->
                  <button type="button" class="tb-btn" (click)="execPageCmd('bold')" title="Bold">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
                  </button>
                  <button type="button" class="tb-btn" (click)="execPageCmd('italic')" title="Italic">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
                  </button>
                  <button type="button" class="tb-btn" (click)="execPageCmd('underline')" title="Underline">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>
                  </button>
                  <button type="button" class="tb-btn" (click)="execPageCmd('strikeThrough')" title="Strikethrough">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="4" y1="10" x2="20" y2="10"/><path d="M8 5h8"/><path d="M8 19h8"/></svg>
                  </button>

                  <div style="width:1px; height:18px; background:var(--border-weak); margin:0 4px"></div>

                  <!-- Alignment -->
                  <button type="button" class="tb-btn" (click)="execPageCmd('justifyLeft')" title="Align Left">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
                  </button>
                  <button type="button" class="tb-btn" (click)="execPageCmd('justifyCenter')" title="Align Center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/></svg>
                  </button>
                  <button type="button" class="tb-btn" (click)="execPageCmd('justifyRight')" title="Align Right">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
                  </button>

                  <div style="width:1px; height:18px; background:var(--border-weak); margin:0 4px"></div>

                  <!-- Block type -->
                  <select style="font-size:11px; padding:3px 6px; border:1px solid var(--border); border-radius:4px; background:white; color:var(--text-primary); cursor:pointer; outline:none; height:24px" (change)="formatPageBlock($event)">
                    <option value="p">{{ t('Paragraphe','Paragraph') }}</option>
                    <option value="h3">{{ t('Titre principal','Main Heading') }}</option>
                    <option value="h4">{{ t('Sous-titre','Subheading') }}</option>
                    <option value="blockquote">{{ t('Citation','Quote') }}</option>
                  </select>

                  <div style="width:1px; height:18px; background:var(--border-weak); margin:0 4px"></div>

                  <!-- Colors -->
                  <div style="display:flex; align-items:center; gap:2px">
                    @for (c of [{code:'#000000'},{code:'#4F46E5'},{code:'#10B981'},{code:'#F59E0B'},{code:'#EF4444'},{code:'#8B5CF6'},{code:'#7C3AED'}]; track c.code) {
                      <button type="button" (click)="changePageColor(c.code)" [style.background]="c.code"
                              style="width:14px; height:14px; border-radius:50%; border:1px solid #CBD5E1; cursor:pointer; padding:0; transition:transform 0.15s"
                              onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                      </button>
                    }
                  </div>

                  <div style="width:1px; height:18px; background:var(--border-weak); margin:0 4px"></div>

                  <!-- Lists -->
                  <button type="button" class="tb-btn" (click)="execPageCmd('insertUnorderedList')" title="Bullet List">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  </button>
                  <button type="button" class="tb-btn" (click)="execPageCmd('insertOrderedList')" title="Numbered List">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h1"/><path d="M4 14H3a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h1"/></svg>
                  </button>
                  <button type="button" class="tb-btn" (click)="execPageCmd('removeFormat')" title="Clear Formatting">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="4" y1="4" x2="20" y2="20"/><path d="M13.19 9.53l4.58 4.58"/><path d="M5 5l6.37 6.37L6 17h4l1-1.5"/></svg>
                  </button>
                </div>
              }

              <!-- Pages Panel -->
              <div style="flex:1; padding:24px 40px 40px 40px; display:flex; flex-direction:column; gap:20px">

                <!-- Pages Header -->
                <div style="display:flex; justify-content:space-between; align-items:center">
                  <span style="font-size:11px; font-weight:800; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px">{{ t('CHAPITRES / PAGES','CHAPTERS / PAGES') }} ({{ formPages().length }})</span>
                  <button (click)="addPage()" class="btn-s" style="height:28px; padding:0 14px; font-size:11px; font-weight:700; display:inline-flex; align-items:center; gap:4px; background:#7C3AED; border-color:#7C3AED; color:white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    {{ t('Ajouter une page','Add Page') }}
                  </button>
                </div>

                <!-- Pages list with individual editors -->
                @if (formPages().length === 0) {
                  <div style="text-align:center; padding:60px 20px; border:2px dashed var(--border); border-radius:12px; background:#FAFAFA">
                    <div style="font-size:48px; margin-bottom:12px">📄</div>
                    <p style="font-size:14px; font-weight:700; color:var(--text-primary); margin:0 0 4px 0">{{ t('Aucune page encore','No pages yet') }}</p>
                    <p style="font-size:12px; color:var(--text-muted); margin:0 0 16px 0">{{ t('Cliquez sur Ajouter une page pour commencer à rédiger.','Click Add Page to start writing.') }}</p>
                    <button (click)="addPage()" class="btn-p" style="background:#7C3AED; border-color:#7C3AED">{{ t('+ Ajouter la première page','+ Add First Page') }}</button>
                  </div>
                } @else {
                  <div style="display:flex; flex-direction:column; gap:12px">
                    @for (pg of formPages(); track pg.id; let i = $index) {
                      <div [style.border]="editingPageIndex() === i ? '2px solid #7C3AED' : '1px solid var(--border-weak)'"
                           style="border-radius:10px; overflow:hidden; background:white; box-shadow:0 1px 4px rgba(0,0,0,0.04)">
                        <!-- Page header (clickable to expand) -->
                        <div style="padding:10px 16px; background:rgba(124,58,237,0.04); display:flex; justify-content:space-between; align-items:center; cursor:pointer; user-select:none"
                             (click)="selectPage(i)">
                          <div style="display:flex; align-items:center; gap:10px">
                            <div [style.background]="editingPageIndex() === i ? '#7C3AED' : '#E5E7EB'"
                                 style="width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:800; color:white; flex-shrink:0; transition:background 0.2s">
                              {{ i + 1 }}
                            </div>
                            <span style="font-size:13px; font-weight:700; color:var(--text-primary)">{{ pg.title || t('Page sans titre','Untitled page') }}</span>
                            @if (pg.youtubeUrl) {
                              <span style="font-size:9px; background:#FEE2E2; color:#EF4444; padding:2px 6px; border-radius:4px; font-weight:700">▶ VIDEO</span>
                            }
                          </div>
                          <div style="display:flex; gap:4px; align-items:center">
                            @if (i > 0) {
                              <button (click)="$event.stopPropagation(); movePage(i, 'up')" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; padding:3px; border-radius:4px" title="{{ t('Monter','Move up') }}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
                              </button>
                            }
                            @if (i < formPages().length - 1) {
                              <button (click)="$event.stopPropagation(); movePage(i, 'down')" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; padding:3px; border-radius:4px" title="{{ t('Descendre','Move down') }}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                              </button>
                            }
                            <button (click)="$event.stopPropagation(); removePage(i)" style="background:none; border:none; color:#EF4444; cursor:pointer; padding:3px; border-radius:4px" title="{{ t('Supprimer','Delete') }}">
                              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" [style.transform]="editingPageIndex() === i ? 'rotate(180deg)' : 'none'" style="transition:transform 0.2s; color:var(--text-muted)"><polyline points="6 9 12 15 18 9"/></svg>
                          </div>
                        </div>

                        <!-- Page editor (expanded when selected) -->
                        @if (editingPageIndex() === i) {
                          <div style="padding:16px; display:flex; flex-direction:column; gap:12px">
                            <!-- Chapter title -->
                            <input [(ngModel)]="pg.title" [placeholder]="t('Titre du chapitre...','Chapter title...')"
                                   style="font-size:15px; font-weight:700; border:none; border-bottom:2px solid #E5E7EB; outline:none; padding:4px 0; width:100%; color:var(--text-primary); transition:border-color 0.2s"
                                   onfocus="this.style.borderColor='#7C3AED'" onblur="this.style.borderColor='#E5E7EB'"/>
                            <!-- Rich contenteditable -->
                            <div [id]="'page-editor-' + i"
                                 contenteditable="true"
                                 class="rich-editor"
                                 (input)="onPageEditorInput($event, i)"
                                 (blur)="onPageEditorInput($event, i)"
                                 style="min-height:200px; font-size:14px; line-height:1.8; color:var(--text-primary); font-family:'Inter', sans-serif; outline:none; padding:8px 0"
                                 [innerHTML]="pg.content || ''">
                            </div>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>
      } @else {
        <!-- ============================================================ -->
        <!-- ==================== LIST VIEW ========================= -->
        <!-- ============================================================ -->
        <div style="padding:20px; animation: fadeIn 0.25s">
          <!-- Top header -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px">
            <div>
              <h2 style="font-size:20px; font-weight:800; color:var(--text-primary); margin:0">
                📚 {{ t("Gérer la Bibliothèque d'Ebooks", "Manage Ebook Library") }}
              </h2>
              <p style="margin:4px 0 0 0; font-size:12px; color:var(--text-secondary)">
                {{ t("Créez, éditez et publiez des guides de cours pour vos étudiants.", "Create, edit and publish course guides for your students.") }}
              </p>
            </div>
            <button (click)="openCreationForm()" class="btn-p" style="height:38px; padding:0 20px; font-weight:700; background:#7C3AED; border-color:#7C3AED; display:inline-flex; align-items:center; gap:8px">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              {{ t("Créer un Ebook", "Create Ebook") }}
            </button>
          </div>

          <!-- Stats mini cards -->
          <div class="grid3" style="margin-bottom:20px">
            <div class="mcard" style="background:linear-gradient(135deg, #ECFDF5, #D1FAE5); border:1px solid #A7F3D0">
              <div class="mlabel" style="color:#047857">{{ t("Publiés", "Published") }}</div>
              <div class="mval" style="color:#10B981">{{ publishedCount() }}</div>
              <div class="msub" style="color:#047857">{{ t("Dans la bibliothèque", "In library") }}</div>
            </div>
            <div class="mcard" style="background:linear-gradient(135deg, #FEF3C7, #FDE68A); border:1px solid #FCD34D">
              <div class="mlabel" style="color:#B45309">{{ t("Brouillons", "Drafts") }}</div>
              <div class="mval" style="color:#D97706">{{ draftsCount() }}</div>
              <div class="msub" style="color:#B45309">{{ t("En attente", "Pending") }}</div>
            </div>
            <div class="mcard" style="background:linear-gradient(135deg, #EEF2FF, #E0E7FF); border:1px solid #C7D2FE">
              <div class="mlabel" style="color:#4338CA">{{ t("Total pages", "Total pages") }}</div>
              <div class="mval" style="color:#4F46E5">{{ totalPagesCount() }}</div>
              <div class="msub" style="color:#4338CA">{{ t("Tous ebooks confondus", "Across all ebooks") }}</div>
            </div>
          </div>

          <!-- Drafts section -->
          @if (draftsCount() > 0) {
            <div class="card" style="margin-bottom:20px; border-left:4px solid #D97706">
              <h3 class="st" style="font-size:15px; margin-bottom:14px; color:#B45309; display:flex; align-items:center; gap:6px">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                {{ t("Brouillons en cours", "Drafts in Progress") }}
              </h3>
              <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:12px">
                @for (book of draftsList(); track book.id) {
                  <ng-container *ngTemplateOutlet="bookCard; context: { $implicit: book }"></ng-container>
                }
              </div>
            </div>
          }

          <!-- Published section -->
          <div class="card">
            <h3 class="st" style="font-size:15px; margin-bottom:14px; color:#4F46E5; display:flex; align-items:center; gap:6px">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              {{ t("Ebooks Publiés", "Published Ebooks") }}
            </h3>
            @if (publishedCount() === 0) {
              <div style="text-align:center; padding:40px; color:var(--text-muted)">
                <p style="font-size:13px; font-weight:600">{{ t("Aucun ebook publié pour l'instant.", "No ebooks published yet.") }}</p>
              </div>
            } @else {
              <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:12px">
                @for (book of publishedList(); track book.id) {
                  <ng-container *ngTemplateOutlet="bookCard; context: { $implicit: book }"></ng-container>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- VIEW BOOK MODAL -->
      @if (viewingBook(); as vb) {
        <div style="position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px" (click)="viewingBook.set(null)">
          <div style="background:white; border-radius:16px; width:100%; max-width:860px; max-height:90vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 25px 50px rgba(0,0,0,0.25)" (click)="$event.stopPropagation()">
            <div style="background:linear-gradient(135deg, #4F46E5, #6D28D9); padding:16px 24px; display:flex; justify-content:space-between; align-items:center; flex-shrink:0">
              <div style="display:flex; align-items:center; gap:10px; color:white">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                <div>
                  <div style="font-size:14px; font-weight:800">{{ vb.title }}</div>
                  <div style="font-size:10px; opacity:0.8">{{ t("Par", "By") }} {{ vb.author }} · {{ vb.level }} · {{ vb.language === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN' }}</div>
                </div>
              </div>
              <button (click)="viewingBook.set(null)" style="background:rgba(255,255,255,0.15); border:none; color:white; border-radius:8px; width:32px; height:32px; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center">×</button>
            </div>

            <div style="flex:1; display:flex; overflow:hidden">
              <div style="width:200px; background:white; border-right:1px solid rgba(0,0,0,0.06); padding:20px; display:flex; flex-direction:column; gap:14px; flex-shrink:0; overflow-y:auto">
                <div [style.background]="vb.coverGradient || vb.coverColor || '#4F46E5'"
                     style="width:90px; height:130px; border-radius:8px; margin:0 auto; box-shadow:0 8px 20px rgba(0,0,0,0.15); display:flex; align-items:flex-end; justify-content:center; padding-bottom:10px">
                  <span style="color:white; font-size:20px">{{ vb.coverEmoji === 'book' ? '📘' : vb.coverEmoji === 'award' ? '🏅' : vb.coverEmoji === 'star' ? '⭐' : vb.coverEmoji === 'graduation' ? '🎓' : '💬' }}</span>
                </div>
                <div style="font-size:10.5px; color:var(--text-secondary); display:flex; flex-direction:column; gap:6px; line-height:1.8">
                  <span>📖 {{ (vb.pages?.length || 0) }} {{ t("pages","pages") }}</span>
                  <span>👁 {{ vb.views || 0 }} {{ t("lectures","views") }}</span>
                  <span>📅 {{ vb.createdAt }}</span>
                </div>
                <p style="font-size:10.5px; color:var(--text-secondary); line-height:1.5; margin:0; border-top:1px solid var(--border-weak); padding-top:10px">{{ vb.description }}</p>
                <button (click)="editDraft(vb); viewingBook.set(null)" class="btn-p" style="height:32px; width:100%; font-size:11px; font-weight:700; display:inline-flex; align-items:center; justify-content:center; gap:6px">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  {{ t("Modifier", "Edit") }}
                </button>
              </div>

              <div style="flex:1; overflow-y:auto; background:#FAF8F5; padding:32px 24px; display:flex; justify-content:center">
                <div style="width:100%; max-width:560px; background:white; border-radius:10px; box-shadow:0 4px 20px rgba(0,0,0,0.04); padding:32px 36px">
                  <h1 style="font-size:22px; font-weight:900; color:var(--text-primary); margin:0 0 8px 0">{{ vb.title }}</h1>
                  <div style="font-size:11px; color:var(--text-muted); margin-bottom:24px; border-bottom:2px solid #F3F4F6; padding-bottom:12px">{{ t("Par","By") }} {{ vb.author }} · {{ vb.level }}</div>

                  @if (vb.pages && vb.pages.length > 0) {
                    <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:20px">
                      @for (pg of vb.pages; track pg.id; let i = $index) {
                        <button (click)="viewPageIndex.set(i)"
                                [style.background]="viewPageIndex() === i ? '#4F46E5' : '#F3F4F6'"
                                [style.color]="viewPageIndex() === i ? 'white' : 'var(--text-secondary)'"
                                style="border:none; border-radius:20px; padding:4px 14px; font-size:11px; font-weight:700; cursor:pointer; transition:all 0.2s">
                          {{ i + 1 }}. {{ pg.title || t("Page","Page") }}
                        </button>
                      }
                    </div>

                    @if (vb.pages[viewPageIndex()]; as activePg) {
                      @if (activePg.youtubeUrl) {
                        <div style="margin-bottom:16px; border-radius:8px; overflow:hidden; aspect-ratio:16/9; background:#000">
                          <iframe [src]="sanitizeYoutubeUrl(activePg.youtubeUrl)" style="width:100%;height:100%;border:none" allowfullscreen></iframe>
                        </div>
                      }
                      <h3 style="font-size:17px; font-weight:800; color:var(--text-primary); margin:0 0 12px 0">{{ activePg.title }}</h3>
                      <div style="font-family:'Georgia',serif; font-size:15px; line-height:1.9; color:#2D2D2D" [innerHTML]="activePg.content || ''"></div>
                    }

                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:28px; padding-top:16px; border-top:1px solid #F3F4F6">
                      <button [disabled]="viewPageIndex() === 0" (click)="viewPageIndex.set(viewPageIndex() - 1)" class="btn-s" style="height:32px; padding:0 14px; font-size:11px" [style.opacity]="viewPageIndex() === 0 ? '0.4' : '1'">
                        ← {{ t("Précédent","Previous") }}
                      </button>
                      <span style="font-size:11px; color:var(--text-muted)">{{ viewPageIndex() + 1 }} / {{ vb.pages.length }}</span>
                      <button [disabled]="viewPageIndex() >= vb.pages.length - 1" (click)="viewPageIndex.set(viewPageIndex() + 1)" class="btn-s" style="height:32px; padding:0 14px; font-size:11px" [style.opacity]="viewPageIndex() >= vb.pages.length - 1 ? '0.4' : '1'">
                        {{ t("Suivant","Next") }} →
                      </button>
                    </div>
                  } @else {
                    <div style="font-family:'Georgia',serif; font-size:15px; line-height:1.9; color:#2D2D2D" [innerHTML]="vb.content || ''"></div>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ============ BOOK CARD TEMPLATE ============ -->
      <ng-template #bookCard let-book>
        <div style="border:1px solid var(--border-weak); border-radius:12px; padding:16px; display:flex; gap:14px; position:relative; overflow:hidden; background:white; box-shadow:0 2px 8px rgba(0,0,0,0.04); transition:all 0.25s"
             onmouseover="this.style.boxShadow='0 6px 20px rgba(0,0,0,0.08)'; this.style.transform='translateY(-1px)'"
             onmouseout="this.style.boxShadow='0 2px 8px rgba(0,0,0,0.04)'; this.style.transform='none'">

          <!-- Spine thumb -->
          <div [style.background]="book.coverGradient || book.coverColor || '#4F46E5'"
               style="width:56px; height:80px; border-radius:6px; flex-shrink:0; display:flex; align-items:center; justify-content:center; box-shadow:2px 4px 10px rgba(0,0,0,0.12); position:relative; overflow:hidden">
            <div style="position:absolute; top:0; left:0; width:4px; height:100%; background:rgba(0,0,0,0.2)"></div>
            <span style="color:white; position:relative; font-size:20px">
              {{ book.coverEmoji === 'book' ? '📘' : book.coverEmoji === 'award' ? '🏅' : book.coverEmoji === 'star' ? '⭐' : book.coverEmoji === 'graduation' ? '🎓' : '💬' }}
            </span>
          </div>

          <div style="flex:1; min-width:0; display:flex; flex-direction:column; justify-content:space-between">
            <div>
              <div style="display:flex; gap:4px; flex-wrap:wrap; margin-bottom:6px">
                @if (book.status === 'draft') {
                  <span style="font-size:9px; font-weight:700; background:#FEF3C7; color:#B45309; padding:1px 6px; border-radius:4px">{{ t("BROUILLON","DRAFT") }}</span>
                }
                <span style="font-size:9px; font-weight:700; background:#EEF2FF; color:#4F46E5; padding:1px 6px; border-radius:4px">{{ book.level }}</span>
                <span style="font-size:9px; font-weight:700; background:#ECFDF5; color:#065F46; padding:1px 6px; border-radius:4px">{{ book.language === 'fr' ? '🇫🇷 FR' : '🇬🇧 EN' }}</span>
                @if (book.pages && book.pages.length > 0) {
                  <span style="font-size:9px; font-weight:700; background:#F3E8FF; color:#7C3AED; padding:1px 6px; border-radius:4px">
                    {{ book.pages.length }} {{ book.pages.length === 1 ? t("page","page") : t("pages","pages") }}
                  </span>
                }
              </div>
              <h4 style="font-size:13.5px; font-weight:800; color:var(--text-primary); margin:0 0 2px 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis">{{ book.title }}</h4>
              <p style="font-size:10.5px; color:var(--text-secondary); margin:0; display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden; line-height:1.4">{{ book.description }}</p>
            </div>
            <div style="display:flex; gap:6px; margin-top:10px; flex-wrap:wrap">
              <button (click)="openViewModal(book)" class="btn-s" style="height:28px; padding:0 10px; font-size:10.5px; font-weight:700; display:inline-flex; align-items:center; gap:4px; background:#4F46E5; border-color:#4F46E5; color:white">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                {{ t("Voir","View") }}
              </button>
              <button (click)="editDraft(book)" class="btn-s" style="height:28px; padding:0 10px; font-size:10.5px; font-weight:700; display:inline-flex; align-items:center; gap:4px">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                {{ t("Modifier","Edit") }}
              </button>
              <button (click)="deleteEbook(book)" class="btn-s" style="height:28px; padding:0 10px; font-size:10.5px; font-weight:700; display:inline-flex; align-items:center; gap:4px; border-color:#EF4444; color:#EF4444">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                {{ t("Supprimer","Delete") }}
              </button>
            </div>
          </div>
        </div>
      </ng-template>
    </div>
  `
})
export class TeacherEbooksComponent {
  protected db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  ebooks = signal<Ebook[]>([]);
  currentUser = signal<UserProfile | null>(null);

  // UI States
  showEditor = signal(false);
  previewMode = signal(false);
  editingBookId = signal<string | null>(null);
  editingPageIndex = signal(-1);
  previewPageIndex = signal(0);
  activePanel = signal<'none' | 'theme' | 'youtube' | 'config'>('none');

  // View modal state
  viewingBook = signal<Ebook | null>(null);
  viewPageIndex = signal(0);

  // Color theme for editor branding
  ebookColorTheme = 'purple';

  // Form fields
  newTitle = '';
  newLevel = 'All';
  newCoverEmoji = 'book';
  newDescription = '';
  newContent = '';
  newLanguage: 'fr' | 'en' = 'en';
  newCoverColor = '#7C3AED';
  newCoverGradient = '';
  newCoverImageUrl = '';

  // Per-page YouTube
  pageYoutubeUrl = '';
  pageYoutubeDesc = '';

  // Pages managed as a signal array for reactivity
  formPages = signal<EbookPage[]>([]);

  // Computed lists
  publishedCount = computed(() => this.ebooks().filter(b => b.status !== 'draft').length);
  draftsCount = computed(() => this.ebooks().filter(b => b.status === 'draft').length);
  publishedList = computed(() => this.ebooks().filter(b => b.status !== 'draft'));
  draftsList = computed(() => this.ebooks().filter(b => b.status === 'draft'));
  totalPagesCount = computed(() => this.ebooks().reduce((acc, b) => acc + (b.pages?.length || (b.content ? 1 : 0)), 0));

  constructor() {
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
    this.db.observeEbooks().subscribe(list => this.ebooks.set(list));
  }

  t(fr: string, en: string): string {
    return this.db.activeLang() === 'en' ? en : fr;
  }

  sanitizeYoutubeUrl(url: string): any {
    if (!url) return '';
    try {
      const u = new URL(url);
      let videoId = u.searchParams.get('v') || u.pathname.split('/').pop() || '';
      return `https://www.youtube.com/embed/${videoId}`;
    } catch { return url; }
  }

  // Panel toggling
  togglePanel(name: 'theme' | 'youtube' | 'config') {
    this.activePanel.set(this.activePanel() === name ? 'none' : name);
  }

  // Select page for editing
  selectPage(i: number) {
    if (this.editingPageIndex() === i) {
      this.editingPageIndex.set(-1);
      return;
    }
    this.editingPageIndex.set(i);
    // Load this page's youtube URL into the panel fields
    const pg = this.formPages()[i];
    if (pg) {
      this.pageYoutubeUrl = pg.youtubeUrl || '';
      this.pageYoutubeDesc = pg.youtubeDesc || '';
    }
  }

  // Save YouTube URL to current page
  saveYoutubeToPage() {
    const idx = this.editingPageIndex();
    if (idx < 0) return;
    const pages = [...this.formPages()];
    pages[idx] = { ...pages[idx], youtubeUrl: this.pageYoutubeUrl, youtubeDesc: this.pageYoutubeDesc };
    this.formPages.set(pages);
  }

  // Rich text commands for page editor
  execPageCmd(command: string) {
    document.execCommand(command, false);
  }

  formatPageBlock(event: any) {
    document.execCommand('formatBlock', false, event.target.value);
    event.target.value = 'p';
  }

  changePageColor(color: string) {
    document.execCommand('foreColor', false, color);
  }

  onPageEditorInput(event: any, i: number) {
    const pages = [...this.formPages()];
    pages[i] = { ...pages[i], content: event.target.innerHTML || '' };
    this.formPages.set(pages);
  }

  // Page management
  addPage() {
    const pages = [...this.formPages()];
    pages.push({
      id: 'pg-' + Date.now() + '-' + pages.length,
      title: this.t(`Chapitre ${pages.length + 1}`, `Chapter ${pages.length + 1}`),
      content: '',
      order: pages.length
    });
    this.formPages.set(pages);
    this.editingPageIndex.set(pages.length - 1);
    this.pageYoutubeUrl = '';
    this.pageYoutubeDesc = '';
    // Focus the new editor after render
    setTimeout(() => {
      const el = document.getElementById(`page-editor-${pages.length - 1}`);
      if (el) el.focus();
    }, 100);
  }

  removePage(i: number) {
    const pages = [...this.formPages()];
    pages.splice(i, 1);
    this.formPages.set(pages.map((p, idx) => ({ ...p, order: idx })));
    const newIdx = Math.min(this.editingPageIndex(), pages.length - 1);
    this.editingPageIndex.set(newIdx);
  }

  movePage(i: number, dir: 'up' | 'down') {
    const pages = [...this.formPages()];
    const swapIdx = dir === 'up' ? i - 1 : i + 1;
    [pages[i], pages[swapIdx]] = [pages[swapIdx], pages[i]];
    this.formPages.set(pages.map((p, idx) => ({ ...p, order: idx })));
  }

  openCreationForm() {
    this.clearForm();
    this.showEditor.set(true);
  }

  openViewModal(book: Ebook) {
    this.viewingBook.set(book);
    this.viewPageIndex.set(0);
  }

  editDraft(book: Ebook) {
    this.editingBookId.set(book.id);
    this.newTitle = book.title;
    this.newLevel = book.level;
    this.newCoverEmoji = book.coverEmoji || 'book';
    this.newDescription = book.description;
    this.newContent = book.content || '';
    this.newLanguage = book.language || 'en';
    this.newCoverColor = book.coverColor || '#7C3AED';
    this.newCoverGradient = book.coverGradient || '';
    this.newCoverImageUrl = book.coverImageUrl || '';
    this.formPages.set(book.pages ? [...book.pages] : []);
    this.editingPageIndex.set(-1);
    this.previewMode.set(false);
    this.previewPageIndex.set(0);
    this.activePanel.set('none');
    this.pageYoutubeUrl = '';
    this.pageYoutubeDesc = '';
    this.showEditor.set(true);
  }

  onEbookCoverUploaded(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => { this.newCoverImageUrl = e.target.result; };
      reader.readAsDataURL(file);
    }
  }

  saveEbook(isDraft: boolean) {
    if (!this.newTitle || !this.newDescription) {
      this.dialogService.alert(
        this.t('Champs requis', 'Required fields'),
        this.t('Veuillez remplir le titre et la description.', 'Please fill in the title and description.'),
        'info'
      );
      return;
    }

    const currentTeacher = this.currentUser()?.name || 'Professeur';
    const pages = this.formPages();

    const bookData: any = {
      title: this.newTitle.trim(),
      author: currentTeacher,
      level: this.newLevel,
      description: this.newDescription.trim(),
      coverEmoji: this.newCoverEmoji,
      content: this.newContent.trim(),
      language: this.newLanguage,
      coverColor: this.newCoverColor || null,
      coverGradient: this.newCoverGradient || null,
      coverImageUrl: this.newCoverImageUrl || null,
      status: isDraft ? 'draft' : 'published',
      pages: pages.length > 0 ? pages : []
    };

    const bookId = this.editingBookId();
    if (bookId) {
      this.db.updateEbook(bookId, bookData).then(() => {
        this.dialogService.alert(
          this.t('Mis à jour !', 'Updated!'),
          isDraft
            ? this.t(`Brouillon "${this.newTitle}" sauvegardé.`, `Draft "${this.newTitle}" saved.`)
            : this.t(`L'ebook "${this.newTitle}" a été publié.`, `Ebook "${this.newTitle}" has been published.`),
          'success'
        );
        this.clearForm();
      });
    } else {
      this.db.addEbook(bookData).then(() => {
        this.dialogService.alert(
          this.t('Enregistré !', 'Saved!'),
          isDraft
            ? this.t(`Brouillon "${this.newTitle}" créé.`, `Draft "${this.newTitle}" created.`)
            : this.t(`L'ebook "${this.newTitle}" a été publié.`, `Ebook "${this.newTitle}" has been published.`),
          'success'
        );
        this.clearForm();
      });
    }
  }

  deleteEbook(book: Ebook) {
    this.dialogService.show({
      title: this.t('Supprimer', 'Delete'),
      message: this.t(`Supprimer définitivement "${book.title}" ?`, `Permanently delete "${book.title}"?`),
      type: 'confirm',
      confirmText: this.t('Supprimer', 'Delete'),
      cancelText: this.t('Annuler', 'Cancel'),
      onConfirm: () => {
        this.db.deleteEbook(book.id).then(() => {
          this.dialogService.alert(this.t('Supprimé', 'Deleted'), this.t('Ebook retiré.', 'Ebook removed.'), 'success');
        });
      }
    });
  }

  clearForm() {
    this.newTitle = '';
    this.newLevel = 'All';
    this.newCoverEmoji = 'book';
    this.newDescription = '';
    this.newContent = '';
    this.newLanguage = 'en';
    this.newCoverColor = '#7C3AED';
    this.newCoverGradient = '';
    this.newCoverImageUrl = '';
    this.formPages.set([]);
    this.editingPageIndex.set(-1);
    this.previewMode.set(false);
    this.showEditor.set(false);
    this.editingBookId.set(null);
    this.activePanel.set('none');
    this.pageYoutubeUrl = '';
    this.pageYoutubeDesc = '';
  }
}
