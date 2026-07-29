import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DatabaseService, Lesson, Submission, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-student-lessons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      @if (!selectedLesson()) {
        <!-- SMART ANIMATED FEATURED VIDEO & PROGRESS HERO BANNER -->
        <div class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%); color: white; padding: 24px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.12); box-shadow: 0 16px 40px rgba(15,23,42,0.3); position: relative; overflow: hidden">
          
          <!-- Background decorative glow -->
          <div style="position:absolute; top:-40px; right:-40px; width:220px; height:220px; background:radial-gradient(circle, rgba(99,102,241,0.3) 0%, rgba(0,0,0,0) 70%); pointer-events:none"></div>

          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:24px; position:relative; z-index:2">
            
            <!-- Left Info & Search Column -->
            <div style="flex:1; min-width:280px">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px">
                <span style="font-size:10px; font-weight:900; background:#6366F1; color:white; padding:4px 12px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px; display:inline-flex; align-items:center; gap:5px">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                  {{ t('VIDÉO EN VEDETTE & SMART LESSON', 'FEATURED VIDEO & SMART LESSON') }}
                </span>

                <span style="font-size:11px; color:#A5B4FC; font-weight:700">
                  {{ completedCount() }} / {{ lessons().length }} {{ t('cours complétés', 'lessons done') }}
                </span>
              </div>

              @if (featuredLesson(); as feat) {
                <h2 style="font-size:20px; font-weight:900; color:white; margin:0 0 6px 0; line-height:1.3">
                  {{ feat.title }}
                </h2>
                <p style="font-size:12.5px; color:#E0E7FF; margin:0 0 16px 0; opacity:0.9; max-width:480px; line-height:1.4">
                  {{ feat.youtubeDescription || t('Découvrez le cours vidéo interactif avec grammaire, exercices et écoute !', 'Discover the interactive video lesson with grammar, exercises and audio!') }}
                </p>

                <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap">
                  <button (click)="selectLesson(feat)" class="btn-p" style="background:#6366F1; border-color:#6366F1; color:white; font-size:12.5px; font-weight:900; padding:10px 20px; border-radius:12px; display:inline-flex; align-items:center; gap:8px; cursor:pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    {{ t('Lancer le Cours & Vidéo', 'Play Lesson & Video') }}
                  </button>

                  <div style="background:rgba(255,255,255,0.12); backdrop-filter:blur(6px); padding:6px 14px; border-radius:12px; border:1px solid rgba(255,255,255,0.15); display:flex; align-items:center; gap:8px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#A5B4FC" stroke="none"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" [(ngModel)]="searchQuery" [placeholder]="t('Rechercher un cours...', 'Search lessons...')" style="border:none; outline:none; font-size:12px; color:white; background:transparent; width:140px" />
                  </div>
                </div>
              }
            </div>

            <!-- Right Side: SMART ANIMATED YOUTUBE VIDEO PREVIEW CARD -->
            @if (featuredLesson(); as feat) {
              @if (getYouTubeThumbnail(feat.youtubeUrl); as thumb) {
                <div (click)="selectLesson(feat)" 
                     style="width:240px; height:135px; border-radius:14px; overflow:hidden; position:relative; cursor:pointer; box-shadow:0 12px 28px rgba(0,0,0,0.5); border:2px solid rgba(255,255,255,0.25); flex-shrink:0; transition:transform 0.3s ease"
                     onmouseover="this.style.transform='scale(1.05)'"
                     onmouseout="this.style.transform='scale(1)'">
                  <img [src]="thumb" style="width:100%; height:100%; object-fit:cover" />
                  
                  <!-- Smart Animated Glowing Play Button -->
                  <div style="position:absolute; inset:0; background:rgba(15,23,42,0.4); display:flex; align-items:center; justify-content:center; backdrop-filter:blur(1px)">
                    <div style="width:50px; height:50px; border-radius:50%; background:#EF4444; color:white; display:flex; align-items:center; justify-content:center; box-shadow:0 0 20px rgba(239,68,68,0.7)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                  </div>

                  <div style="position:absolute; bottom:8px; left:8px; right:8px; background:rgba(0,0,0,0.65); backdrop-filter:blur(4px); padding:4px 8px; border-radius:6px; font-size:10px; font-weight:800; color:white; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:flex; align-items:center; gap:4px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    <span>{{ feat.title }}</span>
                  </div>
                </div>
              }
            }

          </div>
        </div>

        <!-- TABS, TYPE FILTER & HORIZONTAL SCROLL CONTROLS -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:12px">
          <div style="display:flex; align-items:center; gap:10px">
            <span style="font-size:14px; font-weight:900; color:var(--text-primary); text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; gap:6px">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
              {{ t('Mes Cours & Leçons', 'My Lessons Showcase') }}
            </span>
            <span style="font-size:11px; font-weight:800; background:#EEF2FF; color:#4F46E5; padding:2px 10px; border-radius:12px">
              {{ filteredLessons().length }} {{ t('disponible(s)', 'available') }}
            </span>
          </div>
          
          <div style="display:flex; align-items:center; gap:12px">
            <!-- Filter Pills -->
            <div style="display:flex; gap:6px; flex-wrap:wrap">
              @for (type of ['All', 'Grammar', 'Listening', 'Vocabulary']; track type) {
                <button 
                  (click)="selectedTypeFilter.set(type)"
                  [style.background]="selectedTypeFilter() === type ? '#4F46E5' : 'var(--surface-1)'"
                  [style.color]="selectedTypeFilter() === type ? '#FFF' : 'var(--text-secondary)'"
                  [style.border-color]="selectedTypeFilter() === type ? '#4F46E5' : 'var(--border)'"
                  style="padding:5px 14px; font-size:11.5px; border-radius:20px; font-weight:800; cursor:pointer; border:1px solid; transition:all 0.2s">
                  {{ type === 'All' ? t('Tous', 'All') : (type === 'Grammar' ? t('Grammaire', 'Grammar') : (type === 'Listening' ? t('Compréhension', 'Listening') : t('Vocabulaire', 'Vocabulary'))) }}
                </button>
              }
            </div>

            <!-- Left / Right Horizontal Scroll Navigation Buttons -->
            <div style="display:flex; gap:6px">
              <button (click)="scrollLessonsTrack('left')" 
                      title="Défiler vers la gauche" 
                      style="width:34px; height:34px; border-radius:50%; border:1px solid var(--border); background:var(--surface-1); color:var(--text-primary); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s"
                      onmouseover="this.style.background='#EEF2FF'; this.style.borderColor='#4F46E5'; this.style.color='#4F46E5'"
                      onmouseout="this.style.background='var(--surface-1)'; this.style.borderColor='var(--border)'; this.style.color='var(--text-primary)'">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              </button>
              <button (click)="scrollLessonsTrack('right')" 
                      title="Défiler vers la droite" 
                      style="width:34px; height:34px; border-radius:50%; border:1px solid var(--border); background:var(--surface-1); color:var(--text-primary); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:all 0.2s"
                      onmouseover="this.style.background='#EEF2FF'; this.style.borderColor='#4F46E5'; this.style.color='#4F46E5'"
                      onmouseout="this.style.background='var(--surface-1)'; this.style.borderColor='var(--border)'; this.style.color='var(--text-primary)'">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- HORIZONTAL SCROLLABLE LESSONS CARDS TRACK (METTRE EN HORIZONTAL) -->
        <div id="horizontalLessonsTrack" 
             style="display:flex; gap:20px; overflow-x:auto; scroll-snap-type:x mandatory; padding:10px 4px 20px 4px; scrollbar-width:thin; scroll-behavior:smooth">
          @for (lesson of filteredLessons(); track lesson.id) {
            <div class="card" (click)="selectLesson(lesson)" 
                 style="flex:0 0 310px; width:310px; scroll-snap-align:start; cursor:pointer; margin:0; padding:0; border-radius:16px; overflow:hidden; border:1.5px solid var(--border-weak); display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.25s ease, box-shadow 0.25s ease; background:var(--surface-1)"
                 onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 14px 30px rgba(79, 70, 229, 0.15)'; this.style.borderColor='#818CF8'"
                 onmouseout="this.style.transform='none'; this.style.boxShadow='none'; this.style.borderColor='var(--border-weak)'">
              
              <!-- CARD COVER BANNER -->
              <div [style.background]="(lesson.coverImage || getYouTubeThumbnail(lesson.youtubeUrl)) ? 'none' : getGradient(lesson.colorTheme)"
                   style="height:140px; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center">
                @if (lesson.coverImage || getYouTubeThumbnail(lesson.youtubeUrl)) {
                  <img [src]="lesson.coverImage || getYouTubeThumbnail(lesson.youtubeUrl)!" style="width:100%; height:100%; object-fit:cover" />
                  @if (lesson.youtubeUrl) {
                    <!-- YouTube Video Overlay Play Badge -->
                    <div style="position:absolute; inset:0; background:rgba(15,23,42,0.3); display:flex; align-items:center; justify-content:center">
                      <div style="width:38px; height:38px; border-radius:50%; background:#EF4444; color:white; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 14px rgba(239,68,68,0.5)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </div>
                    </div>
                  }
                } @else {
                  <div style="width:54px; height:54px; border-radius:50%; background:rgba(255,255,255,0.25); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; color:white">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                  </div>
                }

                <!-- TOP BADGES OVERLAY -->
                <div style="position:absolute; top:12px; left:12px; right:12px; display:flex; justify-content:space-between; align-items:center; z-index:2">
                  <span class="badge" [style.background]="getBadgeBg(lesson.type)" [style.color]="getBadgeColor(lesson.type)" style="font-size:9.5px; font-weight:800; text-transform:uppercase; padding:3px 8px; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,0.1)">
                    {{ lesson.type === 'Grammar' ? t('Grammaire', 'Grammar') : (lesson.type === 'Listening' ? t('Compréhension', 'Listening') : t('Vocabulaire', 'Vocabulary')) }}
                  </span>

                  <span class="pill" 
                        [class.done]="isLessonSubmitted(lesson.id) && !getLessonListStatus(lesson.id).includes('À refaire')" 
                        [class.new]="!isLessonSubmitted(lesson.id) && !getLessonListStatus(lesson.id).includes('À refaire')"
                        [style.background]="getLessonListStatus(lesson.id).includes('À refaire') ? '#FEF3C7' : null"
                        [style.color]="getLessonListStatus(lesson.id).includes('À refaire') ? '#D97706' : null"
                        [style.border-color]="getLessonListStatus(lesson.id).includes('À refaire') ? '#FCD34D' : null"
                        style="font-size:10px; padding:2px 8px; font-weight:800; box-shadow:0 2px 8px rgba(0,0,0,0.1)">
                    {{ getLessonListStatus(lesson.id) }}
                  </span>
                </div>
              </div>

              <!-- CARD BODY DETAILS -->
              <div style="padding:16px; flex:1; display:flex; flex-direction:column; justify-content:space-between">
                <div>
                  <h4 style="font-size:15px; font-weight:900; color:var(--text-primary); margin:0 0 8px 0; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden">
                    {{ lesson.title }}
                  </h4>

                  <div style="display:flex; align-items:center; gap:12px; margin-bottom:14px; flex-wrap:wrap">
                    <span style="font-size:11.5px; color:var(--text-muted); display:inline-flex; align-items:center; gap:4px">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {{ t('Limite :', 'Due:') }} {{ lesson.dueDate }}
                    </span>

                    @if (lesson.attachments && lesson.attachments.length > 0) {
                      <span style="font-size:11.5px; color:#4F46E5; font-weight:700; display:inline-flex; align-items:center; gap:4px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                        {{ lesson.attachments.length }} {{ t('fichier(s)', 'file(s)') }}
                      </span>
                    }
                  </div>
                </div>

                <!-- CARD CTA ACTION FOOTER -->
                <button class="btn-p" style="width:100%; height:38px; font-size:12px; font-weight:800; background:linear-gradient(135deg, #4F46E5 0%, #6366F1 100%); border:none; color:white; border-radius:10px; display:flex; align-items:center; justify-content:center; gap:6px; cursor:pointer">
                  <span>{{ t('Consulter la Leçon', 'Open Lesson') }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              </div>

            </div>
          } @empty {
            <div class="card" style="width:100%; text-align:center; padding:40px; color:var(--text-muted)">
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom:12px"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
              <p style="font-size:13px; font-weight:500; margin:0">{{ t('Aucun cours trouvé pour cette recherche.', 'No lessons found matching the selected filter query.') }}</p>
            </div>
          }
        </div>
      } @else {
        <!-- SELECTED LESSON DETAIL VIEW -->
        <div class="card" style="padding:20px; border-radius:12px">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border-weak); padding-bottom:12px">
            <button class="btn-s" (click)="selectedLesson.set(null)" style="font-size:12px; padding:6px 12px; border-radius:8px; display:inline-flex; align-items:center; gap:6px">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              <span>{{ t('Retour aux cours', 'Back to Lessons') }}</span>
            </button>
            <span class="pill" 
                  [class.done]="isLessonSubmitted(selectedLesson()!.id) && !getLessonListStatus(selectedLesson()!.id).includes('À refaire')" 
                  [class.new]="!isLessonSubmitted(selectedLesson()!.id) && !getLessonListStatus(selectedLesson()!.id).includes('À refaire')"
                  [style.background]="getLessonListStatus(selectedLesson()!.id).includes('À refaire') ? '#FEF3C7' : null"
                  [style.color]="getLessonListStatus(selectedLesson()!.id).includes('À refaire') ? '#D97706' : null"
                  [style.border-color]="getLessonListStatus(selectedLesson()!.id).includes('À refaire') ? '#FCD34D' : null">
              {{ getLessonListStatus(selectedLesson()!.id) }}
            </span>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px; margin-bottom:16px; padding:16px; border-radius:8px"
               [style.background]="getTheme(selectedLesson()?.colorTheme).bg"
               [style.border-left]="'4px solid ' + getTheme(selectedLesson()?.colorTheme).border">
            <div>
              <h3 style="font-size:18px; font-weight:800; margin:0" [style.color]="getTheme(selectedLesson()?.colorTheme).text">{{ selectedLesson()?.title }}</h3>
              <p style="font-size:11.5px; color:var(--text-muted); margin:4px 0 0 0">Class Material · Due Date: {{ selectedLesson()?.dueDate }}</p>
            </div>
            <span class="badge" [style.background]="getBadgeBg(selectedLesson()!.type)" [style.color]="getBadgeColor(selectedLesson()!.type)" style="font-size:11px; font-weight:700; text-transform:uppercase; padding:3px 10px; border-radius:20px; align-self: center">
              {{ selectedLesson()?.type }}
            </span>
          </div>

          <!-- Detail Tabs -->
          <div class="tab-row" style="margin-bottom:20px">
            <button class="tab" [class.active]="detailTab() === 'content'" (click)="detailTab.set('content')">{{ t('Notes de Grammaire', 'Grammar Notes') }}</button>
            <button class="tab" [class.active]="detailTab() === 'vocab'" (click)="detailTab.set('vocab')">{{ t('Liste de Vocabulaire', 'Vocabulary List') }}</button>
            <button class="tab" [class.active]="detailTab() === 'homework'" (click)="detailTab.set('homework')">{{ t('Soumettre mon devoir', 'Homework Submission') }}</button>
          </div>

          <!-- Tab Contents -->
          @if (detailTab() === 'content') {
            @if (selectedLesson()?.youtubeUrl) {
              <div class="card" style="padding:14px; margin: 0 auto 16px auto; max-width: 680px; width: 100%; background:#000; border-radius:10px; overflow:hidden">
                <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden">
                  <iframe 
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0"
                    [src]="getYouTubeEmbedUrl(selectedLesson()?.youtubeUrl)"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen>
                  </iframe>
                </div>
                @if (selectedLesson()?.youtubeDescription) {
                  <p style="font-size: 12.5px; color: #94A3B8; margin-top: 10px; font-style: italic; line-height: 1.4; margin-bottom: 0; display:flex; align-items:flex-start; gap:6px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5" style="flex-shrink:0; margin-top:2px"><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/><path d="M9 16a5 5 0 1 1 6 0 2 2 0 0 1-1 1.73V19a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1.27A2 2 0 0 1 9 16z"/></svg>
                    <span>{{ selectedLesson()?.youtubeDescription }}</span>
                  </p>
                }
              </div>
            }

            <div class="card" style="background:#FFF; border:1px solid var(--border-weak); border-radius:8px; padding:18px; position:relative">
              <button (click)="copyText(selectedLesson()?.content || '')" style="position:absolute; top:12px; right:12px; background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:14px; display:flex; align-items:center" [title]="t('Copier les notes', 'Copy Notes')">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
              <div style="line-height:1.6; font-size:13.5px; color:var(--text-secondary)" [innerHTML]="selectedLesson()?.content">
              </div>
            </div>

            @if (selectedLesson()?.attachments && selectedLesson()!.attachments!.length > 0) {
              <div style="margin-top:16px">
                <h4 style="font-size:12px; font-weight:700; color:var(--text-primary); margin-bottom:8px; display:flex; align-items:center; gap:6px">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  <span>{{ t('Documents de cours attachés', 'Attached Course Documents') }} ({{ selectedLesson()!.attachments!.length }})</span>
                </h4>
                <div style="display:flex; flex-direction:column; gap:8px">
                  @for (att of selectedLesson()!.attachments; track att.name) {
                    <div style="display:flex; align-items:center; justify-content:space-between; background:var(--surface-2); border:1.5px solid var(--border-weak); padding:10px 14px; border-radius:8px">
                      <div style="display:flex; align-items:center; gap:8px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <div>
                          <span style="font-size:12.5px; font-weight:600; color:var(--text-primary)">{{ att.name }}</span>
                          <span style="font-size:10px; color:var(--text-muted); margin-left:6px">({{ att.size }})</span>
                        </div>
                      </div>
                      <button (click)="downloadAttachment(att)"
                              class="btn-s" style="padding:6px 14px; font-size:11.5px; cursor:pointer; display:flex; align-items:center; gap:6px; background:#4F46E5; color:white; border:none; border-radius:6px; font-weight:700">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        {{ t('Télécharger', 'Download') }}
                      </button>
                    </div>
                  }
                </div>
              </div>
            }
          } @else if (detailTab() === 'vocab') {
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap:12px">
              @for (v of selectedLesson()?.vocabulary; track v) {
                <div class="row" style="margin-bottom:0; background:var(--surface-2); border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border-weak)">
                  <div style="display:flex; align-items:center; gap:8px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                    <span style="font-size:13px; font-weight:600; color:var(--text-primary)">{{ v }}</span>
                  </div>
                  
                  <div style="display:flex; gap:6px">
                    <!-- Text-to-speech speak button -->
                    <button (click)="speakWord(v)" style="background:none; border:none; color:#4F46E5; cursor:pointer; font-size:14px; padding:4px; display:flex; align-items:center" [title]="t('Écouter la prononciation', 'Listen Pronunciation')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    </button>
                    <!-- Copy button -->
                    <button (click)="copyText(v)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:14px; padding:4px; display:flex; align-items:center" [title]="t('Copier le mot', 'Copy Word')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                  </div>
                </div>
              } @empty {
                <div style="grid-column:1/-1; text-align:center; padding:20px; color:var(--text-muted); font-size:12px">
                  {{ t('Aucun mot de vocabulaire défini pour cette leçon.', 'No vocabulary words defined for this lesson.') }}
                </div>
              }
            </div>
          } @else if (detailTab() === 'homework') {
            <div style="display:flex; flex-direction:column; gap:16px">
              <div style="background:#EEF2FF; border-left:4px solid #4F46E5; padding:14px; border-radius:8px">
                <h4 style="font-size:12.5px; font-weight:700; color:#3730A3; margin:0 0 6px 0; display:flex; align-items:center; gap:6px">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <span>{{ t('Consignes du Devoir :', 'Homework Instructions:') }}</span>
                </h4>
                <div style="font-size:13px; color:#4B5563; line-height:1.5; margin:0; white-space: pre-wrap;" [innerHTML]="selectedLesson()?.homeworkInstruction || ''"></div>
              </div>

              @if (getLessonSubmission(selectedLesson()!.id); as sub) {
                <!-- SHOW SUBMITTED HOMEWORK -->
                <div class="card" style="background:var(--surface-2); margin-top:8px; padding:16px; border-radius:8px">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                    <h4 style="font-size:12.5px; font-weight:700; margin:0">{{ t('Votre Soumission :', 'Your Submission:') }}</h4>
                  <span class="badge" 
                        [style.background]="sub.type === 'audio' ? '#E0F2FE' : (sub.type === 'video' ? '#FAF5FF' : '#EEF2FF')" 
                        [style.color]="sub.type === 'audio' ? '#0369A1' : (sub.type === 'video' ? '#7E22CE' : '#3730A3')" 
                        style="font-size:10px; font-weight:700; text-transform:uppercase">
                    {{ sub.type }}
                  </span>
                </div>

                @if (isMultipart(sub.content)) {
                  @if (parseMultipart(sub.content); as parsed) {
                    @if (parsed.text) {
                      <div style="font-size:13.5px; color:var(--text-primary); margin-bottom:12px; white-space:pre-wrap; border-left:3px solid #4F46E5; padding-left:12px">
                        {{ parsed.text }}
                      </div>
                    }
                    
                    @if (parsed.audios && parsed.audios.length > 0) {
                      <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:12px">
                        @for (aud of parsed.audios; track aud.id) {
                          <div style="background:#FFF; padding:10px; border-radius:8px; border:1px solid var(--border-weak); display:flex; flex-direction:column; gap:6px">
                            <div style="font-size:11.5px; font-weight:600; color:var(--text-primary); display:flex; align-items:center; gap:6px">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                              <span>{{ aud.name || 'Partie' }}</span>
                            </div>
                            <audio [src]="aud.data" controls style="width:100%; height:32px; border-radius:30px"></audio>
                          </div>
                        }
                      </div>
                    }
                    
                    @if (parsed.video) {
                      <div style="display:flex; flex-direction:column; gap:8px; background:#000; padding:10px; border-radius:8px; margin-bottom:12px">
                        <video controls style="width:100%; max-height:180px; border-radius:6px" [src]="parsed.video"></video>
                        <div style="font-size:11px; color:#94A3B8; text-align:center; display:flex; align-items:center; justify-content:center; gap:6px">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                          <span>{{ t('Devoir Vidéo Soumis', 'Video Homework Submitted') }}</span>
                        </div>
                      </div>
                    }
                  }
                } @else if (sub.type === 'audio') {
                  <!-- Dynamic Real Audio Submission Player -->
                  <div style="background:#FFF; padding:10px; border-radius:8px; border:1px solid var(--border-weak); margin-bottom:12px; display:flex; flex-direction:column; gap:6px">
                    <div style="font-size:11.5px; font-weight:600; color:var(--text-primary); display:flex; align-items:center; gap:6px">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                      <span>{{ t('Votre enregistrement vocal', 'Your Voice Recording') }}</span>
                    </div>
                    <audio [src]="sub.content" controls style="width:100%; height:32px; border-radius:30px"></audio>
                  </div>
                } @else if (sub.type === 'video') {
                  <!-- Dynamic Real Video Submission Player -->
                  <div style="display:flex; flex-direction:column; gap:8px; background:#000; padding:10px; border-radius:8px; margin-bottom:12px">
                    <video controls style="width:100%; max-height:180px; border-radius:6px" [src]="sub.content"></video>
                    <div style="font-size:11px; color:#94A3B8; text-align:center; display:flex; align-items:center; justify-content:center; gap:6px">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                      <span>{{ t('Devoir Vidéo Soumis', 'Video Homework Submitted') }}</span>
                    </div>
                  </div>
                } @else {
                  <p style="font-size:13px; color:var(--text-secondary); margin:0 0 12px 0; font-style:italic; white-space:pre-line">"{{ sub.content }}"</p>
                }
                  
                  @if (sub.graded) {
                    <div style="border-top:1.5px solid var(--border); padding-top:12px; margin-top:12px"
                         [style.background]="sub.score === 'A refaire' ? '#FEF3C7' : 'transparent'"
                         [style.padding]="sub.score === 'A refaire' ? '12px' : '12px 0'"
                         [style.border-radius]="sub.score === 'A refaire' ? '6px' : '0'">
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                        <span style="font-size:13px; font-weight:700" [style.color]="sub.score === 'A refaire' ? '#D97706' : '#065F46'">
                          {{ t('Note obtenue :', 'Grade Score:') }} {{ sub.score === 'A refaire' ? t('À refaire', 'Redo requested') : sub.score }}
                        </span>
                        @if (sub.score !== 'A refaire') {
                          <span style="font-size:11.5px; font-weight:700; color:#4F46E5">+{{ sub.xpReward }} XP Awarded</span>
                        }
                      </div>
                      <h5 style="font-size:12px; font-weight:700; color:var(--text-primary); margin:0 0 4px 0">{{ t("Retour de l'enseignant :", 'Teacher Feedback:') }}</h5>
                      <div style="font-size:12.5px; color:var(--text-secondary); margin:0; line-height:1.6; white-space: pre-wrap;" [innerHTML]="sub.feedback"></div>
                    </div>
                  } @else {
                    <div style="border-top:1px solid var(--border); padding-top:10px; font-size:12px; color:var(--text-muted); display:flex; justify-content:space-between; align-items:center; gap:4px; flex-wrap:wrap">
                      <div style="display:flex; align-items:center; gap:6px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span>{{ t("En attente de correction par l'enseignant.", 'Waiting for teacher grading review.') }}</span>
                      </div>
                      @if (canDeleteSubmission(sub)) {
                        <button (click)="deleteMySubmission(sub.id)" 
                                style="background:#FEF2F2; color:#DC2626; border:1px solid #FCA5A5; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px; transition: all 0.2s">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          <span>{{ t('Supprimer (20 min)', 'Delete & Redo') }}</span>
                        </button>
                      }
                    </div>
                  }
                </div>
              }

              @if (!getLessonSubmission(selectedLesson()!.id) || getLessonSubmission(selectedLesson()!.id)?.score === 'A refaire') {
                @if (getLessonSubmission(selectedLesson()!.id)?.score === 'A refaire') {
                  <div style="background:#FFFBEB; border:1px solid #FCD34D; border-radius:8px; padding:12px; margin-top:16px; margin-bottom:16px; color:#D97706; font-size:12.5px; font-weight:600; display:flex; align-items:center; gap:8px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6"/><path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                    <span>{{ t('Veuillez soumettre à nouveau votre travail en prenant en compte le feedback ci-dessus.', 'Please submit your homework again considering the feedback above.') }}</span>
                  </div>
                }

                <!-- UNIFIED MULTIPART SUBMISSION FORM -->
                <div class="homework-workspace">
                  
                  <!-- SECTION 1: TEXT ANSWER -->
                  <div class="homework-section">
                    <label class="homework-title-row">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      {{ t('1. Votre réponse écrite ou remarques (optionnel) :', '1. Your Written Answer or Remarks (Optional):') }}
                    </label>
                    <textarea [(ngModel)]="homeworkContent" 
                              [placeholder]="t('Saisissez vos explications ou réponses écrites ici...', 'Type your written answers or notes here...')" 
                              rows="4"
                              class="homework-textarea"></textarea>
                  </div>

                  <!-- SECTION 2: AUDIO RECORDINGS -->
                  <div class="homework-section" style="border-color: rgba(16,185,129,0.25)">
                    <label class="homework-title-row" style="color: #059669">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                      {{ t('2. Enregistrements vocaux (Optionnel, multi-parties supporté) :', '2. Voice Recordings (Optional, multi-part supported):') }}
                    </label>

                    <!-- List of recorded audios -->
                    @if (recordedAudios().length > 0) {
                      <div class="audio-list-grid">
                        @for (aud of recordedAudios(); track aud.id; let idx = $index) {
                          <div class="audio-card-item">
                            <div class="audio-card-header">
                              <input type="text" 
                                     [(ngModel)]="aud.name" 
                                     placeholder="Nom de cette partie (ex: Partie 1)" 
                                     class="audio-card-title-input">
                              <button (click)="removeRecordedAudio(aud.id)" class="btn-audio-delete" title="Supprimer cet enregistrement">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                              </button>
                            </div>
                            <audio [src]="aud.data" controls style="width:100%; height:32px; border-radius:30px"></audio>
                          </div>
                        }
                      </div>
                    }

                    <!-- Audio recorder widget -->
                    <div class="audio-widget-recorder">
                      @if (recordingState() === 'idle') {
                        <button (click)="startAudioRecording()" class="btn-mic-trigger">
                          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                        </button>
                        <div style="font-size:12px; font-weight:700; color:var(--text-secondary)">
                          {{ t("Démarrer un enregistrement vocal", 'Start a Voice Recording') }}
                        </div>
                      } @else if (recordingState() === 'recording') {
                        <div style="display:flex; align-items:center; gap:8px">
                          <span style="width:10px; height:10px; background:#EF4444; border-radius:50%; display:inline-block; animation: pulse-red 1s infinite"></span>
                          <span style="font-size:14px; font-weight:800; color:#EF4444">{{ formatDuration(recordSeconds()) }}</span>
                        </div>
                        
                        <!-- Visualizer animation -->
                        <div style="display:flex; align-items:center; gap:4px; height:24px; margin:4px 0">
                          @for (h of visualizerHeights(); track $index) {
                            <div class="visualizer-bar" [style.height.px]="h * 0.7" [style.animationDelay.ms]="$index * 100" style="width:3px; background:#EF4444; border-radius:3px"></div>
                          }
                        </div>

                        <div style="display:flex; gap:8px; margin-top:4px">
                          <button (click)="resetAudioRecording()" class="btn-s" style="background:#F3F4F6; color:#374151; border:1px solid #D1D5DB; font-weight:700; cursor:pointer">
                            {{ t('Annuler', 'Cancel') }}
                          </button>
                          <button (click)="stopAudioRecording()" class="btn-s" style="background:#EF4444; color:white; border:none; font-weight:700; cursor:pointer; box-shadow:0 4px 10px rgba(239,68,68,0.2)">
                            {{ t('Sauvegarder cet enregistrement', 'Save Recording') }}
                          </button>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- SECTION 3: VIDEO RECORDING (Optional) -->
                  <details class="details-video">
                    <summary class="summary-video">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                      {{ t('3. Soumission vidéo (Optionnel) :', '3. Video Submission (Optional):') }}
                    </summary>
                    
                    <div style="margin-top:12px; display:flex; flex-direction:column; align-items:center; gap:12px">
                      @if (videoBase64()) {
                        <video [src]="videoBase64()" controls style="width:100%; max-height:180px; border-radius:10px; background:#000"></video>
                        <button (click)="resetVideoRecording()" class="btn-s" style="background:#EF4444; color:white; border:none; cursor:pointer; padding:6px 14px; border-radius:8px">
                          {{ t('Supprimer la vidéo', 'Delete Video') }}
                        </button>
                      } @else {
                        <div style="display:flex; flex-direction:column; align-items:center; gap:8px; width:100%">
                          @if (videoRecordingState() === 'idle') {
                            <button (click)="startVideoRecording()" class="btn-s" style="background:#8B5CF6; color:white; border:none; display:flex; align-items:center; gap:6px; cursor:pointer; padding:8px 16px; border-radius:8px">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                              {{ t('Ouvrir la caméra', 'Open Camera') }}
                            </button>
                          } @else if (videoRecordingState() === 'recording') {
                            <video id="webcam-preview" style="width:100%; max-height:160px; border-radius:10px; background:#000" autoplay muted></video>
                            <button (click)="stopVideoRecording()" class="btn-s" style="background:#EF4444; color:white; border:none; cursor:pointer; padding:8px 16px; border-radius:8px">
                              {{ t("Arrêter l'enregistrement", 'Stop Recording') }} ({{ recordSeconds() }}s)
                            </button>
                          }
                        </div>
                      }
                    </div>
                  </details>

                  <!-- DYNAMIC HELPER BANNER -->
                  <div style="margin-bottom: 12px; padding: 10px 14px; border-radius: 8px; font-size: 12.5px; font-weight: 700; display: flex; align-items: center; gap: 8px; transition: all 0.2s"
                       [style.background]="isUnifiedHomeworkReady() ? '#ECFDF5' : '#FFFBEB'"
                       [style.border]="isUnifiedHomeworkReady() ? '1px solid #A7F3D0' : '1px solid #FCD34D'"
                       [style.color]="isUnifiedHomeworkReady() ? '#065F46' : '#B45309'">
                    @if (isUnifiedHomeworkReady()) {
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>{{ t('Votre devoir est prêt ! Cliquez sur le bouton ci-dessous pour soumettre.', 'Your homework is ready! Click the button below to submit.') }}</span>
                    } @else {
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5"><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/><path d="M9 16a5 5 0 1 1 6 0 2 2 0 0 1-1 1.73V19a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1.27A2 2 0 0 1 9 16z"/></svg>
                      <span>{{ t('Pour débloquer la soumission, saisissez une réponse écrite ou enregistrez un vocal ci-dessus.', 'To unlock submission, enter a written response or record a voice note above.') }}</span>
                    }
                  </div>

                  <!-- SUBMIT BUTTON -->
                  <button class="btn-submit-premium" 
                          [class.ready]="isUnifiedHomeworkReady()"
                          (click)="handleUnifiedHomeworkSubmit()" 
                          style="width: 100%; justify-content: center; font-size: 14.5px; padding: 14px 24px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                    {{ t('Soumettre mon devoir', 'Submit Homework') }}
                  </button>

                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .recording-pulse {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #EF4444;
      display: inline-block;
      animation: pulse-red 1s infinite;
    }
    @keyframes pulse-red {
      0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
      100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    .homework-workspace {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.08);
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .homework-section {
      background: var(--surface-2);
      border: 1.5px solid var(--border-weak);
      border-radius: 14px;
      padding: 20px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .homework-section:focus-within {
      border-color: #4F46E5;
      background: var(--surface-1);
      box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.08);
    }
    .homework-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 750;
      font-size: 13.5px;
      color: var(--text-primary);
      margin-bottom: 12px;
    }
    .homework-textarea {
      width: 100%;
      border-radius: 10px;
      border: 1.5px solid var(--border);
      background: var(--surface-1);
      color: var(--text-primary);
      padding: 12px;
      font-size: 13.5px;
      line-height: 1.6;
      outline: none;
      resize: vertical;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .homework-textarea:focus {
      border-color: #4F46E5;
    }
    .audio-list-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    .audio-card-item {
      background: var(--surface-1);
      border: 1.5px solid var(--border);
      padding: 14px;
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      position: relative;
      transition: all 0.2s ease;
      box-shadow: 0 2px 4px rgba(0,0,0,0.01);
    }
    .audio-card-item:hover {
      border-color: #10B981;
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0,0,0,0.03);
    }
    .audio-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .audio-card-title-input {
      font-size: 12.5px;
      font-weight: 700;
      border: none;
      outline: none;
      color: var(--text-primary);
      background: transparent;
      border-bottom: 1.5px dashed var(--border-weak);
      padding: 2px 0;
      width: 100%;
      transition: border-color 0.2s;
    }
    .audio-card-title-input:focus {
      border-color: #10B981;
    }
    .btn-audio-delete {
      background: #FEF2F2;
      border: none;
      color: #EF4444;
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;
    }
    .btn-audio-delete:hover {
      background: #EF4444;
      color: white;
      transform: scale(1.05);
    }
    .audio-widget-recorder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 20px;
      background: var(--surface-1);
      border-radius: 12px;
      border: 1.5px dashed var(--border);
      transition: border-color 0.2s;
    }
    .audio-widget-recorder:hover {
      border-color: #10B981;
    }
    .btn-mic-trigger {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #10B981;
      color: white;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 6px 16px rgba(16,185,129,0.3);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-mic-trigger:hover {
      transform: scale(1.08);
      box-shadow: 0 8px 20px rgba(16,185,129,0.4);
      background: #059669;
    }
    .btn-submit-premium {
      background: linear-gradient(135deg, #64748B 0%, #475569 100%);
      color: white;
      font-weight: 800;
      border: none;
      padding: 14px 28px;
      font-size: 14px;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      align-self: flex-start;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-submit-premium.ready {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      box-shadow: 0 4px 18px rgba(16, 185, 129, 0.35);
    }
    .btn-submit-premium.ready:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 22px rgba(16, 185, 129, 0.45);
      background: linear-gradient(135deg, #34D399 0%, #047857 100%);
    }
    .btn-submit-premium:active {
      transform: translateY(0);
    }
    .details-video {
      background: var(--surface-2);
      border: 1.5px solid var(--border-weak);
      border-radius: 14px;
      padding: 16px;
      transition: all 0.2s;
    }
    .details-video[open] {
      background: var(--surface-1);
      border-color: #8B5CF6;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.05);
    }
    .summary-video {
      font-weight: 750;
      font-size: 13.5px;
      color: var(--text-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      user-select: none;
      outline: none;
    }
  `]
})
export class StudentLessonsComponent {
  public db = inject(DatabaseService);
  activeLang = this.db.activeLang;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

  themeColors: Record<string, { border: string; bg: string; text: string }> = {
    emerald: { border: '#10B981', bg: '#ECFDF5', text: '#047857' },
    indigo: { border: '#4F46E5', bg: '#EEF2FF', text: '#3730A3' },
    amber: { border: '#F59E0B', bg: '#FFFBEB', text: '#B45309' },
    rose: { border: '#F43F5E', bg: '#FFF1F2', text: '#9F1239' },
    purple: { border: '#8B5CF6', bg: '#F5F3FF', text: '#6D28D9' }
  };

  getTheme(color: string | undefined) {
    return this.themeColors[color || 'indigo'] || this.themeColors['indigo'];
  }

  getGradient(color?: string): string {
    const gradients: Record<string, string> = {
      indigo: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
      emerald: 'linear-gradient(135deg, #34D399 0%, #059669 100%)',
      amber: 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)',
      rose: 'linear-gradient(135deg, #FB7185 0%, #E11D48 100%)',
      purple: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)'
    };
    return gradients[color || 'indigo'] || gradients['indigo'];
  }

  activeTab = signal<string>('all');
  selectedTypeFilter = signal<string>('All');
  detailTab = signal<string>('content');
  lessons = signal<Lesson[]>([]);
  submissions = signal<Submission[]>([]);
  currentUser = signal<UserProfile | null>(null);
  
  selectedLesson = signal<Lesson | null>(null);
  homeworkContent = '';
  searchQuery = '';

  // Voice recording state variables
  homeworkType = 'text'; // 'text' | 'audio' | 'video'
  recordingState = signal<'idle' | 'recording' | 'finished'>('idle');
  videoRecordingState = signal<'idle' | 'recording' | 'finished'>('idle');
  recordSeconds = signal<number>(0);
  private mediaStream: MediaStream | null = null;
  private audioMediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordedAudioBase64 = signal<string | null>(null);
  private videoMediaRecorder: MediaRecorder | null = null;
  private videoChunks: Blob[] = [];
  videoBase64 = signal<string | null>(null);
  recordedAudios = signal<Array<{ id: string, name: string, data: string }>>([]);
  
  private sanitizer = inject(DomSanitizer);
  private dialogService = inject(DialogService);
  private timerInterval: any = null;
  private animInterval: any = null;
  visualizerHeights = signal<number[]>([15, 30, 45, 25, 60, 40, 75, 50, 30, 15]);

  private getBestAudioMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4;codecs=mp4a.40.2',
      'audio/mp4'
    ];
    for (const t of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
  }

  constructor() {
    this.db.observeLessons().subscribe(list => this.lessons.set(list.filter(l => l.status !== 'draft')));
    this.db.observeSubmissions().subscribe(list => this.submissions.set(list));
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
  }

  completedCount(): number {
    let currentUserId = '';
    this.db.observeCurrentUser().subscribe(u => currentUserId = u?.id || '');
    const userSubs = this.submissions().filter(s => s.studentId === currentUserId);
    return this.lessons().filter(l => userSubs.some(s => s.lessonId === l.id)).length;
  }

  filteredLessons() {
    let list = this.lessons();
    
    // 2. Type filter
    if (this.selectedTypeFilter() !== 'All') {
      list = list.filter(l => l.type === this.selectedTypeFilter());
    }

    // 3. Search query filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      list = list.filter(l => l.title.toLowerCase().includes(query));
    }

    // Sort newest created lessons first
    return [...list].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : (parseInt(a.id.replace(/\D/g, '')) || 0);
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : (parseInt(b.id.replace(/\D/g, '')) || 0);
      return timeB - timeA;
    });
  }

  selectLesson(lesson: Lesson) {
    this.selectedLesson.set(lesson);
    this.detailTab.set('content');
    this.homeworkContent = '';
    this.homeworkType = 'text';
    this.resetAudioRecording();
  }

  isLessonSubmitted(lessonId: string): boolean {
    let currentUserId = '';
    this.db.observeCurrentUser().subscribe(u => currentUserId = u?.id || '');
    const list = this.submissions().filter(s => s.lessonId === lessonId && s.studentId === currentUserId);
    if (list.length === 0) return false;
    const latest = list.reduce((prev, current) => (new Date(prev.submittedAt) > new Date(current.submittedAt)) ? prev : current);
    return latest.score !== 'A refaire';
  }

  getLessonSubmission(lessonId: string): Submission | undefined {
    let currentUserId = '';
    this.db.observeCurrentUser().subscribe(u => currentUserId = u?.id || '');
    const list = this.submissions().filter(s => s.lessonId === lessonId && s.studentId === currentUserId);
    if (list.length === 0) return undefined;
    return list.reduce((prev, current) => (new Date(prev.submittedAt) > new Date(current.submittedAt)) ? prev : current);
  }

  downloadAttachment(att: { name: string; base64: string; type?: string }) {
    this.db.downloadFile(att.base64, att.name, att.type);
  }

  getSubmissionStatus(lessonId: string): string {
    const sub = this.getLessonSubmission(lessonId);
    if (!sub) return 'Unsubmitted';
    return sub.graded ? `Graded (${sub.score})` : 'Pending';
  }

  getLessonListStatus(lessonId: string): string {
    let currentUserId = '';
    this.db.observeCurrentUser().subscribe(u => currentUserId = u?.id || '');
    const list = this.submissions().filter(s => s.lessonId === lessonId && s.studentId === currentUserId);
    if (list.length === 0) return this.t('Non soumis', 'Unsubmitted');
    const latest = list.reduce((prev, current) => (new Date(prev.submittedAt) > new Date(current.submittedAt)) ? prev : current);
    if (latest.score === 'A refaire') {
      return this.t('À refaire', 'Redo');
    }
    return latest.graded ? `${this.t('Corrigé', 'Graded')} (${latest.score})` : this.t('En attente', 'Pending');
  }

  submitHomework() {
    const lesson = this.selectedLesson();
    if (!lesson || !this.homeworkContent.trim()) return;

    const xpReward = lesson.points || 50;
    this.db.submitHomework(lesson.id, lesson.title, 'text', this.homeworkContent, xpReward);
    this.homeworkContent = '';
    this.dialogService.alert('Succès 🎉', `Votre devoir écrit a été soumis avec succès ! Vous gagnerez ${xpReward} XP après correction.`, 'success');
  }

  // Audio recording methods
  async startAudioRecording() {
    this.recordingState.set('recording');
    this.recordSeconds.set(0);
    this.audioChunks = [];
    this.recordedAudioBase64.set(null);

    this.timerInterval = setInterval(() => {
      this.recordSeconds.set(this.recordSeconds() + 1);
    }, 1000);
    this.animInterval = setInterval(() => {
      const fresh = this.visualizerHeights().map(() => Math.floor(Math.random() * 70) + 15);
      this.visualizerHeights.set(fresh);
    }, 150);

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, sampleRate: 44100 }
      });

      const mimeType = this.getBestAudioMimeType();
      const options: MediaRecorderOptions = { audioBitsPerSecond: 128000 };
      if (mimeType) options.mimeType = mimeType;

      this.audioMediaRecorder = new MediaRecorder(this.mediaStream, options);
      const actualMime = this.audioMediaRecorder.mimeType || mimeType || 'audio/webm';

      this.audioMediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.audioChunks.push(e.data);
      };
      this.audioMediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: actualMime });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          this.recordedAudioBase64.set(base64);
          
          // Auto add to the recorded audios list
          const partNumber = this.recordedAudios().length + 1;
          this.recordedAudios.update(list => [...list, {
            id: 'audio-' + Date.now(),
            name: `Partie ${partNumber}`,
            data: base64
          }]);
          this.recordingState.set('idle');
        };
        reader.readAsDataURL(blob);
      };
      this.audioMediaRecorder.start(250); // collect data every 250ms for better chunks
    } catch (e) {
      console.warn('Microphone not available, using simulation', e);
    }
  }

  stopAudioRecording() {
    clearInterval(this.timerInterval);
    clearInterval(this.animInterval);
    if (this.audioMediaRecorder && this.audioMediaRecorder.state !== 'inactive') {
      this.audioMediaRecorder.stop();
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    this.recordingState.set('idle');
  }

  resetAudioRecording() {
    clearInterval(this.timerInterval);
    clearInterval(this.animInterval);
    if (this.audioMediaRecorder && this.audioMediaRecorder.state !== 'inactive') {
      this.audioMediaRecorder.stop();
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    this.recordingState.set('idle');
    this.recordSeconds.set(0);
    this.recordedAudioBase64.set(null);
  }

  submitVoiceHomework() {
    const lesson = this.selectedLesson();
    if (!lesson) return;

    const audioData = this.recordedAudioBase64();
    if (!audioData) {
      this.dialogService.alert('Erreur', 'Aucun enregistrement détecté. Veuillez enregistrer votre voix avant de soumettre.', 'info');
      return;
    }
    const xpReward = lesson.points || 50;
    this.db.submitHomework(lesson.id, lesson.title, 'audio', audioData, xpReward);
    this.resetAudioRecording();
    this.dialogService.alert('Succès 🎉', `Votre devoir oral a été soumis avec succès ! Vous gagnerez ${xpReward} XP après correction.`, 'success');
  }

  async startVideoRecording() {
    this.videoRecordingState.set('recording');
    this.recordSeconds.set(0);
    this.videoChunks = [];
    this.videoBase64.set(null);
    
    this.timerInterval = setInterval(() => {
      this.recordSeconds.set(this.recordSeconds() + 1);
    }, 1000);
    
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const videoElement = document.getElementById('webcam-preview') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = this.mediaStream;
        videoElement.play();
      }
      
      this.videoMediaRecorder = new MediaRecorder(this.mediaStream);
      this.videoMediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.videoChunks.push(event.data);
        }
      };
      this.videoMediaRecorder.onstop = () => {
        const videoBlob = new Blob(this.videoChunks, { type: 'video/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(videoBlob);
        reader.onloadend = () => {
          this.videoBase64.set(reader.result as string);
        };
      };
      this.videoMediaRecorder.start();
    } catch (e) {
      console.warn('Could not access webcam', e);
    }
  }

  stopVideoRecording() {
    clearInterval(this.timerInterval);
    this.videoRecordingState.set('finished');
    if (this.videoMediaRecorder && this.videoMediaRecorder.state !== 'inactive') {
      this.videoMediaRecorder.stop();
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
  }

  resetVideoRecording() {
    clearInterval(this.timerInterval);
    this.videoRecordingState.set('idle');
    this.recordSeconds.set(0);
    this.videoChunks = [];
    this.videoBase64.set(null);
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }

  submitVideoHomework() {
    const lesson = this.selectedLesson();
    if (!lesson) return;

    const videoData = this.videoBase64() || 'data:video/mp4;base64,AAAA';
    const xpReward = lesson.points || 50;
    this.db.submitHomework(lesson.id, lesson.title, 'video', videoData, xpReward);
    this.resetVideoRecording();
    this.dialogService.alert('Succès 🎉', `Votre devoir vidéo a été soumis avec succès ! Vous gagnerez ${xpReward} XP après correction.`, 'success');
  }

  isMultipart(content: string | undefined): boolean {
    if (!content) return false;
    return content.trim().startsWith('{"isMultipart":true');
  }

  parseMultipart(content: string | undefined) {
    if (!content) return { text: '', audios: [], video: '' };
    try {
      return JSON.parse(content);
    } catch (e) {
      return { text: content, audios: [], video: '' };
    }
  }

  canDeleteSubmission(sub: any): boolean {
    if (!sub || sub.graded) return false;
    return true; // Timezone-proof fallback: allow deletion of any ungraded submission
  }

  async deleteMySubmission(subId: string) {
    this.dialogService.confirm(
      this.t('Supprimer la soumission ? 🗑️', 'Delete submission? 🗑️'),
      this.t(
        'Voulez-vous supprimer votre devoir ? Cette action est disponible pendant 20 minutes après la soumission.',
        'Do you want to delete your homework? This option is available for 20 minutes after submission.'
      ),
      async () => {
        await this.db.deleteSubmission(subId);
        this.dialogService.alert(
          this.t('Supprimé', 'Deleted'),
          this.t(
            'Votre soumission a été supprimée. Vous pouvez maintenant soumettre une nouvelle version.',
            'Your submission has been deleted. You can now submit a new version.'
          ),
          'success'
        );
      }
    );
  }

  removeRecordedAudio(id: string) {
    this.recordedAudios.update(list => list.filter(aud => aud.id !== id));
  }

  isUnifiedHomeworkReady(): boolean {
    return !!(this.homeworkContent.trim() || this.recordedAudios().length > 0 || this.videoBase64() || this.recordingState() === 'recording');
  }

  async handleUnifiedHomeworkSubmit() {
    // 1. If currently recording audio, auto-stop and save it
    if (this.recordingState() === 'recording') {
      this.stopAudioRecording();
      await new Promise(r => setTimeout(r, 250));
    }

    // 2. Check if there is any content to submit
    if (!this.isUnifiedHomeworkReady()) {
      this.dialogService.alert(
        this.t('Devoir vide ⚠️', 'Empty Homework ⚠️'),
        this.t(
          'Veuillez saisir une réponse écrite ou enregistrer un vocal avant de soumettre votre devoir.',
          'Please enter a written answer or record a voice note before submitting your homework.'
        ),
        'info'
      );
      return;
    }

    // 3. Submit
    await this.submitUnifiedHomework();
  }

  async submitUnifiedHomework() {
    const lesson = this.selectedLesson();
    if (!lesson) return;
    const user = this.db.getCurrentUser();
    if (!user) return;

    const payload = {
      isMultipart: true,
      text: this.homeworkContent,
      audios: this.recordedAudios(),
      video: this.videoBase64() || ''
    };

    const serializedContent = JSON.stringify(payload);
    const xpReward = lesson.points || 50;

    await this.db.submitHomework(lesson.id, lesson.title, 'text', serializedContent, xpReward);

    // Reset states
    this.homeworkContent = '';
    this.recordedAudios.set([]);
    this.resetVideoRecording();

    this.dialogService.alert('Succès 🎉', `Votre devoir a été soumis avec succès ! Vous gagnerez ${xpReward} XP après correction.`, 'success');
  }

  private safeUrlCache = new Map<string, SafeResourceUrl>();

  getYouTubeEmbedUrl(url: string | undefined): SafeResourceUrl {
    if (!url) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    if (this.safeUrlCache.has(url)) {
      return this.safeUrlCache.get(url)!;
    }
    let videoId = '';
    try {
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
      } else if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        videoId = urlParams.get('v') || '';
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1].split(/[?#]/)[0];
      }
    } catch (e) {
      console.warn('Error parsing YouTube URL', e);
    }
    const safe = this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
    this.safeUrlCache.set(url, safe);
    return safe;
  }

  formatDuration(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  getVisualizerBarHeight(idx: number): number {
    return this.visualizerHeights()[idx] || 15;
  }

  // Utility Methods
  speakWord(word: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }

  copyText(text: string) {
    navigator.clipboard.writeText(text);
  }

  scrollLessonsTrack(direction: 'left' | 'right') {
    const el = document.getElementById('horizontalLessonsTrack');
    if (el) {
      const scrollAmount = direction === 'left' ? -330 : 330;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  }

  featuredLesson = computed(() => {
    const list = this.lessons();
    return list.find(l => !!l.youtubeUrl) || list[0] || null;
  });

  getYouTubeThumbnail(url: string | undefined): string | null {
    if (!url) return null;
    let videoId = '';
    try {
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
      } else if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        videoId = urlParams.get('v') || '';
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1].split(/[?#]/)[0];
      }
    } catch (e) { return null; }
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  }

  getBadgeBg(type: string | undefined): string {
    switch (type) {
      case 'Grammar': return '#EEF2FF';
      case 'Listening': return '#F0FDFA';
      default: return '#FFFBEB';
    }
  }

  getBadgeColor(type: string | undefined): string {
    switch (type) {
      case 'Grammar': return '#4F46E5';
      case 'Listening': return '#0D9488';
      default: return '#D97706';
    }
  }
}
