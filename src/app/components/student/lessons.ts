import { Component, inject, signal } from '@angular/core';
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
        <!-- STATISTICS & FILTER PANEL -->
        <div class="card" style="margin-bottom: 20px; background: linear-gradient(135deg, #EFF6FF 0%, #FAF5FF 100%); padding: 18px; border-radius: 12px; border: 1px solid var(--border-weak)">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px">
            <div>
              <h3 style="font-size:15px; font-weight:700; color:var(--text-primary); margin:0">{{ t('Progrès de mes Cours', 'My Lessons Progress') }}</h3>
              <p style="font-size:11.5px; color:var(--text-secondary); margin:4px 0 0 0">
                {{ t('Complétés :', 'Completed:') }} <strong>{{ completedCount() }}</strong> / {{ lessons().length }} {{ t('cours', 'lessons') }}
              </p>
            </div>
            <div style="display:flex; gap:12px; align-items:center">
              <div style="background:#FFF; padding:6px 12px; border-radius:8px; border:1px solid var(--border); display:flex; align-items:center; gap:6px">
                <i class="ti ti-search" style="color:var(--text-muted)"></i>
                <input type="text" [(ngModel)]="searchQuery" [placeholder]="t('Rechercher un cours...', 'Search lessons...')" style="border:none; outline:none; font-size:12px; width:150px; background:transparent" />
              </div>
            </div>
          </div>
        </div>

        <!-- TABS & TYPE FILTER ROW -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px">
          <div class="tab-row" style="margin-bottom:0">
            <button class="tab" [class.active]="activeTab() === 'all'" (click)="activeTab.set('all')">{{ t('Tous les cours', 'All Lessons') }}</button>
          </div>
          
          <div style="display:flex; gap:6px; flex-wrap:wrap">
            @for (type of ['All', 'Grammar', 'Listening', 'Vocabulary']; track type) {
              <button 
                (click)="selectedTypeFilter.set(type)"
                [style.background]="selectedTypeFilter() === type ? '#4F46E5' : 'var(--surface-1)'"
                [style.color]="selectedTypeFilter() === type ? '#FFF' : 'var(--text-secondary)'"
                [style.border-color]="selectedTypeFilter() === type ? '#4F46E5' : 'var(--border)'"
                style="padding:5px 12px; font-size:11.5px; border-radius:20px; font-weight:600; cursor:pointer; border:1px solid; transition:all 0.2s">
                {{ type === 'All' ? t('Tous', 'All') : (type === 'Grammar' ? t('Grammaire', 'Grammar') : (type === 'Listening' ? t('Compréhension', 'Listening') : t('Vocabulaire', 'Vocabulary'))) }}
              </button>
            }
          </div>
        </div>

        <!-- LESSONS LIST (COMPACT ROW LAYOUT) -->
        <div style="display:flex; flex-direction:column; gap:12px">
          @for (lesson of filteredLessons(); track lesson.id) {
            <div class="card" (click)="selectLesson(lesson)" 
                 [style.border-left]="'5px solid ' + getTheme(lesson.colorTheme).border"
                 style="cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:16px; margin:0; padding:12px 18px; border-radius:12px; transition:transform 0.2s, box-shadow 0.2s; border:1px solid var(--border-weak)" 
                 onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.05)'" 
                 onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
              
              <div style="display:flex; align-items:center; gap:16px; flex:1">
                <!-- Compact cover image/gradient thumbnail -->
                <div [style.background]="lesson.coverImage ? 'none' : getGradient(lesson.colorTheme)"
                     style="width: 52px; height: 52px; border-radius: 8px; overflow: hidden; display:flex; align-items:center; justify-content:center; flex-shrink:0; position:relative">
                  @if (lesson.coverImage) {
                    <img [src]="lesson.coverImage" style="width: 100%; height: 100%; object-fit: cover" />
                  } @else {
                    <span style="font-size:18px">📖</span>
                  }
                </div>

                <div>
                  <div style="display:flex; align-items:center; gap:8px; margin-bottom:3px">
                    <span class="badge" [style.background]="getBadgeBg(lesson.type)" [style.color]="getBadgeColor(lesson.type)" style="font-size:9px; font-weight:700; text-transform:uppercase; padding:1px 6px; border-radius:10px">
                      {{ lesson.type === 'Grammar' ? t('Grammaire', 'Grammar') : (lesson.type === 'Listening' ? t('Compréhension', 'Listening') : t('Vocabulaire', 'Vocabulary')) }}
                    </span>
                  </div>
                  
                  <h4 style="font-size:14px; font-weight:800; color:var(--text-primary); margin:0 0 2px 0; line-height:1.3">{{ lesson.title }}</h4>
                  <span style="font-size:11px; color:var(--text-muted)">{{ t('Limite :', 'Due:') }} {{ lesson.dueDate }}</span>
                </div>
              </div>

              <div style="display:flex; align-items:center; gap:12px; flex-shrink:0">
                <span class="pill" [class.done]="isLessonSubmitted(lesson.id)" [class.new]="!isLessonSubmitted(lesson.id)" style="font-size:10.5px; padding:3px 8px">
                  {{ isLessonSubmitted(lesson.id) ? (getSubmissionStatus(lesson.id)) : t('Non soumis', 'Unsubmitted') }}
                </span>
                <span style="font-size:11px; color:#4F46E5; font-weight:700; display:flex; align-items:center; gap:2px">
                  {{ t('Ouvrir', 'Open') }} <i class="ti ti-arrow-right"></i>
                </span>
              </div>
            </div>
          } @empty {
            <div class="card" style="text-align:center; padding:40px; color:var(--text-muted)">
              <i class="ti ti-book-off" style="font-size:36px; display:block; margin-bottom:12px"></i>
              <p style="font-size:13px; font-weight:500; margin:0">{{ t('Aucun cours trouvé pour cette recherche.', 'No lessons found matching the selected filter query.') }}</p>
            </div>
          }
        </div>
      } @else {
        <!-- SELECTED LESSON DETAIL VIEW -->
        <div class="card" style="padding:20px; border-radius:12px">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid var(--border-weak); padding-bottom:12px">
            <button class="btn-s" (click)="selectedLesson.set(null)" style="font-size:12px; padding:6px 12px; border-radius:8px"><i class="ti ti-arrow-left"></i> {{ t('Retour aux cours', 'Back to Lessons') }}</button>
            <span class="pill" [class.done]="isLessonSubmitted(selectedLesson()!.id)" [class.new]="!isLessonSubmitted(selectedLesson()!.id)">
              {{ getSubmissionStatus(selectedLesson()!.id) }}
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
                  <p style="font-size: 12.5px; color: #94A3B8; margin-top: 10px; font-style: italic; line-height: 1.4; margin-bottom: 0">
                    💡 {{ selectedLesson()?.youtubeDescription }}
                  </p>
                }
              </div>
            }

            <div class="card" style="background:#FFF; border:1px solid var(--border-weak); border-radius:8px; padding:18px; position:relative">
              <button (click)="copyText(selectedLesson()?.content || '')" style="position:absolute; top:12px; right:12px; background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:14px" [title]="t('Copier les notes', 'Copy Notes')">
                <i class="ti ti-copy"></i>
              </button>
              <div style="line-height:1.6; font-size:13.5px; color:var(--text-secondary)" [innerHTML]="selectedLesson()?.content">
              </div>
            </div>

            @if (selectedLesson()?.attachments && selectedLesson()!.attachments!.length > 0) {
              <div style="margin-top:16px">
                <h4 style="font-size:12px; font-weight:700; color:var(--text-primary); margin-bottom:8px">📂 {{ t('Documents de cours attachés', 'Attached Course Documents') }} ({{ selectedLesson()!.attachments!.length }})</h4>
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
                      <a [href]="att.base64" [download]="att.name"
                         class="btn-s" style="padding:4px 10px; font-size:11px; text-decoration:none; display:flex; align-items:center; gap:4px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        {{ t('Télécharger', 'Download') }}
                      </a>
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
                    <i class="ti ti-bookmarks" style="color:#4F46E5; font-size:16px"></i>
                    <span style="font-size:13px; font-weight:600; color:var(--text-primary)">{{ v }}</span>
                  </div>
                  
                  <div style="display:flex; gap:6px">
                    <!-- Text-to-speech speak button -->
                    <button (click)="speakWord(v)" style="background:none; border:none; color:#4F46E5; cursor:pointer; font-size:14px; padding:4px; display:flex; align-items:center" [title]="t('Écouter la prononciation', 'Listen Pronunciation')">
                      <i class="ti ti-volume"></i>
                    </button>
                    <!-- Copy button -->
                    <button (click)="copyText(v)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:14px; padding:4px; display:flex; align-items:center" [title]="t('Copier le mot', 'Copy Word')">
                      <i class="ti ti-copy"></i>
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
                  <i class="ti ti-info-circle"></i> {{ t('Consignes du Devoir :', 'Homework Instructions:') }}
                </h4>
                <p style="font-size:13px; color:#4B5563; line-height:1.5; margin:0; white-space: pre-wrap;">{{ selectedLesson()?.homeworkInstruction }}</p>
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

                @if (sub.type === 'audio') {
                  <!-- Simulated Audio Submission Player -->
                  <div style="display:flex; align-items:center; gap:12px; background:#FFF; padding:10px; border-radius:8px; border:1px solid var(--border-weak); margin-bottom:12px">
                    <button style="width:32px; height:32px; border-radius:50%; border:none; background:#0369A1; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer" (click)="speakWord('Playing back your audio homework submission')">
                      <i class="ti ti-player-play"></i>
                    </button>
                    <div style="flex:1">
                      <div style="font-size:11.5px; font-weight:600; color:var(--text-primary)">{{ t('Enregistrement Vocal Soumis', 'Voice Recording Submission') }}</div>
                      <div style="font-size:10px; color:var(--text-muted)">{{ t('Fichier audio attaché avec succès', 'Audio file attached successfully') }}</div>
                    </div>
                  </div>
                } @else if (sub.type === 'video') {
                  <!-- Simulated Video Submission Player -->
                  <div style="display:flex; flex-direction:column; gap:8px; background:#000; padding:10px; border-radius:8px; margin-bottom:12px">
                    <video controls style="width:100%; max-height:180px; border-radius:6px" src="https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-39824-large.mp4"></video>
                    <div style="font-size:11px; color:#94A3B8; text-align:center"><i class="ti ti-video"></i> {{ t('Devoir Vidéo Soumis', 'Video Homework Submitted') }}</div>
                  </div>
                } @else {
                  <p style="font-size:13px; color:var(--text-secondary); margin:0 0 12px 0; font-style:italic; white-space:pre-line">"{{ sub.content }}"</p>
                }
                  
                  @if (sub.graded) {
                    <div style="border-top:1.5px solid var(--border); padding-top:12px; margin-top:12px">
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px">
                        <span style="font-size:13px; font-weight:700; color:#065F46">{{ t('Note obtenue :', 'Grade Score:') }} {{ sub.score }}</span>
                        <span style="font-size:11.5px; font-weight:700; color:#4F46E5">+{{ sub.xpReward }} XP Awarded</span>
                      </div>
                      <h5 style="font-size:12px; font-weight:700; color:var(--text-primary); margin:0 0 4px 0">{{ t("Retour de l'enseignant :", 'Teacher Feedback:') }}</h5>
                      <p style="font-size:12.5px; color:var(--text-secondary); margin:0; line-height:1.4">{{ sub.feedback }}</p>
                    </div>
                  } @else {
                    <div style="border-top:1px solid var(--border); padding-top:10px; font-size:12px; color:var(--text-muted); display:flex; align-items:center; gap:4px">
                      <i class="ti ti-clock"></i> {{ t("En attente de correction par l'enseignant.", 'Waiting for teacher grading review.') }}
                    </div>
                  }
                </div>
              } @else {
                <!-- SUBMIT HOMEWORK FORM -->
                <div style="display:flex; gap:16px; margin-bottom:12px; border-bottom:1px solid var(--border-weak); padding-bottom:12px">
                  <button (click)="homeworkType = 'text'" [style.border-bottom]="homeworkType === 'text' ? '2px solid #4F46E5' : 'none'" [style.color]="homeworkType === 'text' ? '#4F46E5' : 'var(--text-muted)'" style="background:none; border:none; padding:8px 4px; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    <span>{{ t('Soumission Écrite', 'Text Submission') }}</span>
                  </button>
                  <button (click)="homeworkType = 'audio'" [style.border-bottom]="homeworkType === 'audio' ? '2px solid #4F46E5' : 'none'" [style.color]="homeworkType === 'audio' ? '#4F46E5' : 'var(--text-muted)'" style="background:none; border:none; padding:8px 4px; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                    <span>{{ t('Enregistrement Vocal', 'Voice Recording') }}</span>
                  </button>
                  <button (click)="homeworkType = 'video'" [style.border-bottom]="homeworkType === 'video' ? '2px solid #4F46E5' : 'none'" [style.color]="homeworkType === 'video' ? '#4F46E5' : 'var(--text-muted)'" style="background:none; border:none; padding:8px 4px; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle;"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
                    <span>{{ t('Soumission Vidéo', 'Video Submission') }}</span>
                  </button>
                </div>

                @if (homeworkType === 'text') {
                  <div class="input-row" style="margin-top:0">
                    <label for="hwAnswer" style="font-weight:600">{{ t('Votre réponse en anglais :', 'Your Answer in English:') }}</label>
                    <textarea id="hwAnswer" [(ngModel)]="homeworkContent" [placeholder]="t('Saisissez votre texte en anglais ici...', 'Type your English paragraphs or sentences here...')" rows="5"></textarea>
                  </div>
                  <button class="btn-p" (click)="submitHomework()" [disabled]="!homeworkContent.trim()" style="align-self:flex-start">
                    <i class="ti ti-send"></i> {{ t('Soumettre le devoir', 'Submit Homework') }}
                  </button>
                } @else if (homeworkType === 'audio') {
                  <!-- AUDIO RECORDER PANEL -->
                  <div class="card" style="background:var(--surface-2); border-radius:8px; padding:20px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px">
                    @if (recordingState() === 'idle') {
                      <button (click)="startAudioRecording()" style="width:56px; height:56px; border-radius:50%; background:#4F46E5; color:white; border:none; font-size:24px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(79,70,229,0.3)">
                        <i class="ti ti-microphone"></i>
                      </button>
                      <div style="font-size:12.5px; font-weight:600; color:var(--text-primary)">{{ t("Cliquer pour démarrer l'enregistrement", 'Click to Start Audio Recording') }}</div>
                      <div style="font-size:11px; color:var(--text-muted)">{{ t('Enregistrez votre voix en lisant ou en répondant aux questions', 'Record your voice reading or answering the questions') }}</div>
                    } @else if (recordingState() === 'recording') {
                      <div style="display:flex; align-items:center; gap:8px">
                        <span class="recording-pulse"></span>
                        <span style="font-size:14px; font-weight:700; color:#EF4444">{{ formatDuration(recordSeconds()) }}</span>
                      </div>
                      
                      <!-- Live Neon Audio Wave Visualizer Simulation -->
                      <div style="width:100%; max-width:320px; height:40px; display:flex; align-items:center; justify-content:center; gap:3px">
                        @for (bar of [15, 30, 45, 25, 60, 40, 75, 50, 30, 15]; track bar; let idx = $index) {
                          <div [style.height.%]="getVisualizerBarHeight(idx)" style="width:5px; background:linear-gradient(to top, #3B82F6, #10B981); border-radius:3px; transition:height 0.15s"></div>
                        }
                      </div>

                      <button (click)="stopAudioRecording()" style="width:48px; height:48px; border-radius:50%; background:#EF4444; color:white; border:none; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(239,68,68,0.3)">
                        <i class="ti ti-square"></i>
                      </button>
                      <div style="font-size:12px; color:var(--text-secondary)">{{ t('Enregistrement vocal en cours... cliquez sur le carré pour arrêter', 'Recording voice... click square to stop') }}</div>
                    } @else if (recordingState() === 'finished') {
                      <!-- Recording complete options -->
                      <div style="display:flex; align-items:center; gap:12px; background:#FFF; padding:12px; border-radius:8px; border:1px solid var(--border-weak); width:100%; max-width:360px">
                        <button style="width:36px; height:36px; border-radius:50%; border:none; background:#10B981; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer" (click)="speakWord('Playing back your recorded voice homework')">
                          <i class="ti ti-player-play"></i>
                        </button>
                        <div style="flex:1">
                          <div style="font-size:12px; font-weight:600; color:var(--text-primary)">voice_homework.wav</div>
                          <div style="font-size:10px; color:var(--text-muted)">Duration: {{ formatDuration(recordSeconds()) }}</div>
                        </div>
                        <button (click)="resetAudioRecording()" style="background:none; border:none; color:#EF4444; font-size:16px; cursor:pointer" [title]="t('Supprimer et recommencer', 'Delete & Record Again')">
                          <i class="ti ti-trash"></i>
                        </button>
                      </div>

                      <div style="display:flex; gap:10px; margin-top:8px">
                        <button class="btn-p" (click)="submitVoiceHomework()" style="background:#10B981; border-color:#10B981">
                          <i class="ti ti-send"></i> {{ t("Soumettre l'enregistrement vocal", 'Submit Voice Recording') }}
                        </button>
                        <button class="btn-s" (click)="resetAudioRecording()">{{ t('Recommencer', 'Record Again') }}</button>
                      </div>
                    }
                  </div>
                } @else {
                  <!-- VIDEO RECORDER PANEL -->
                  <div class="card" style="background:var(--surface-2); border-radius:8px; padding:20px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; width:100%">
                    @if (videoRecordingState() === 'idle') {
                      <button (click)="startVideoRecording()" style="width:56px; height:56px; border-radius:50%; background:#4F46E5; color:white; border:none; font-size:24px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(79,70,229,0.3)">
                        <i class="ti ti-video"></i>
                      </button>
                      <div style="font-size:12.5px; font-weight:600; color:var(--text-primary)">{{ t("Démarrer l'enregistrement vidéo", 'Start Video Recording') }}</div>
                      <div style="font-size:11px; color:var(--text-muted)">{{ t('Enregistrez votre caméra pour répondre aux consignes', 'Record your webcam stream to answer the prompts') }}</div>
                    } @else if (videoRecordingState() === 'recording') {
                      <div style="display:flex; align-items:center; gap:8px">
                        <span class="recording-pulse"></span>
                        <span style="font-size:14px; font-weight:700; color:#EF4444">{{ formatDuration(recordSeconds()) }}</span>
                      </div>
                      
                      <!-- Webcam stream element -->
                      <video id="webcam-preview" autoplay muted style="width: 100%; max-width: 320px; height: 180px; border-radius: 8px; background: #000; border: 1.5px solid #EF4444"></video>

                      <button (click)="stopVideoRecording()" style="width:48px; height:48px; border-radius:50%; background:#EF4444; color:white; border:none; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 10px rgba(239,68,68,0.3)">
                        <i class="ti ti-square"></i>
                      </button>
                      <div style="font-size:12px; color:var(--text-secondary)">{{ t('Enregistrement en cours... cliquez sur le carré rouge pour stopper', 'Recording in progress... click red square to stop') }}</div>
                    } @else if (videoRecordingState() === 'finished') {
                      <!-- Recording complete options -->
                      <div style="display:flex; flex-direction:column; align-items:center; gap:12px; background:#FFF; padding:16px; border-radius:8px; border:1px solid var(--border-weak); width:100%; max-width:360px">
                        <div style="font-size:12px; font-weight:600; color:var(--text-primary)">🎥 {{ t('Vidéo enregistrée avec succès !', 'Video recorded successfully!') }}</div>
                        <video style="width: 100%; border-radius: 8px; background: #000" controls src="https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-smiling-39824-large.mp4"></video>
                      </div>

                      <div style="display:flex; gap:10px; margin-top:8px">
                        <button class="btn-p" (click)="submitVideoHomework()" style="background:#10B981; border-color:#10B981">
                          <i class="ti ti-send"></i> {{ t('Soumettre la vidéo', 'Submit Video') }}
                        </button>
                        <button class="btn-s" (click)="resetVideoRecording()">{{ t('Recommencer', 'Record Again') }}</button>
                      </div>
                    }
                  </div>
                }
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
  private videoMediaRecorder: MediaRecorder | null = null;
  private videoChunks: Blob[] = [];
  videoBase64 = signal<string | null>(null);
  
  private sanitizer = inject(DomSanitizer);
  private dialogService = inject(DialogService);
  private timerInterval: any = null;
  private animInterval: any = null;
  visualizerHeights = signal<number[]>([15, 30, 45, 25, 60, 40, 75, 50, 30, 15]);

  constructor() {
    this.db.observeLessons().subscribe(list => this.lessons.set(list));
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

    return list;
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
    return this.submissions().some(s => s.lessonId === lessonId && s.studentId === currentUserId);
  }

  getLessonSubmission(lessonId: string): Submission | undefined {
    let currentUserId = '';
    this.db.observeCurrentUser().subscribe(u => currentUserId = u?.id || '');
    return this.submissions().find(s => s.lessonId === lessonId && s.studentId === currentUserId);
  }

  getSubmissionStatus(lessonId: string): string {
    const sub = this.getLessonSubmission(lessonId);
    if (!sub) return 'Unsubmitted';
    return sub.graded ? `Graded (${sub.score})` : 'Pending';
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
  startAudioRecording() {
    this.recordingState.set('recording');
    this.recordSeconds.set(0);
    
    this.timerInterval = setInterval(() => {
      this.recordSeconds.set(this.recordSeconds() + 1);
    }, 1000);

    // Audio Visualizer Simulation animation loop
    this.animInterval = setInterval(() => {
      const fresh = this.visualizerHeights().map(() => Math.floor(Math.random() * 70) + 15);
      this.visualizerHeights.set(fresh);
    }, 150);
  }

  stopAudioRecording() {
    clearInterval(this.timerInterval);
    clearInterval(this.animInterval);
    this.recordingState.set('finished');
  }

  resetAudioRecording() {
    clearInterval(this.timerInterval);
    clearInterval(this.animInterval);
    this.recordingState.set('idle');
    this.recordSeconds.set(0);
  }

  submitVoiceHomework() {
    const lesson = this.selectedLesson();
    if (!lesson) return;

    // Submit a simulated voice recording payload
    const simulatedAudioData = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    const xpReward = lesson.points || 50;
    this.db.submitHomework(lesson.id, lesson.title, 'audio', simulatedAudioData, xpReward);
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

  getYouTubeEmbedUrl(url: string | undefined): SafeResourceUrl {
    if (!url) return this.sanitizer.bypassSecurityTrustResourceUrl('');
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
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
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
