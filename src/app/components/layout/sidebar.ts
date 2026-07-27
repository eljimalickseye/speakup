import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, UserProfile } from '../../services/database.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sidebar-container" 
         [style.background]="activeTheme === 'rose' ? '#FFF0F3' : (activeTheme === 'manga' ? '#110B29' : (activeTheme === 'dark' ? '#1E293B' : 'var(--surface-1)'))"
         [style.borderColor]="activeTheme === 'rose' ? '#FBCFE8' : (activeTheme === 'manga' ? '#000000' : (activeTheme === 'dark' ? '#334155' : 'var(--border)'))">
      
      <!-- Logo Section -->
      <div class="sidebar-logo" 
           [style.background]="activeTheme === 'rose' ? '#FFE4E6' : (activeTheme === 'manga' ? '#1A123D' : (activeTheme === 'dark' ? '#1E293B' : 'var(--surface-1)'))"
           [style.borderBottomColor]="activeTheme === 'rose' ? '#FBCFE8' : (activeTheme === 'manga' ? '#000000' : (activeTheme === 'dark' ? '#334155' : 'var(--border)'))">
        @if (activeTheme === 'manga') {
          <div style="display:flex; flex-direction:column; position:relative">
            <span style="font-family:'Impact', 'Arial Black', sans-serif; font-size:26px; font-weight:900; color:white; letter-spacing:-1px; text-shadow:3px 3px 0 #E11D48, -1px -1px 0 #E11D48, 1px -1px 0 #E11D48, -1px 1px 0 #E11D48, 1px 1px 0 #E11D48; line-height:1">SpeakUp</span>
            <span style="font-size:10px; font-weight:800; color:#FCA5A5; letter-spacing:2px; margin-top:2px">スピークアップ</span>
          </div>
        } @else if (activeTheme === 'rose') {
          <div style="display:flex; flex-direction:column; position:relative">
            <span style="font-family:'Outfit', sans-serif; font-size:26px; font-weight:900; color:#BE185D; letter-spacing:-1px; text-shadow:2px 2px 0 #FFF0F3, -1px -1px 0 #FBCFE8, 1px -1px 0 #FBCFE8, -1px 1px 0 #FBCFE8, 1px 1px 0 #FBCFE8; line-height:1">SpeakUp</span>
            <span style="font-size:10px; font-weight:800; color:#DB2777; letter-spacing:2px; margin-top:2px">スピークアップ</span>
          </div>
        } @else {
          <div style="display:flex; align-items:center; gap:8px">
            <img src="logo.png" style="width:28px; height:28px; object-fit:contain; border-radius:6px" alt="logo">
            <span style="font-family:'Outfit', sans-serif; font-size:20px; font-weight:800; color:white; line-height:1">SpeakUp</span>
          </div>
        }
        @if (currentUser?.role === 'teacher') {
          <span class="logo-role" style="font-size:9px; background:#7C3AED; color:white; padding:2px 6px; border-radius:4px; font-weight:600; text-transform:uppercase; margin-left:auto">Teacher</span>
        } @else if (currentUser?.role === 'admin') {
          <span class="logo-role" style="font-size:9px; background:#EF4444; color:white; padding:2px 6px; border-radius:4px; font-weight:600; text-transform:uppercase; margin-left:auto">Admin</span>
        }
      </div>

      <div class="sidebar-nav">
        <!-- STUDENT / GUEST NAVIGATION -->
        @if (currentUser?.role === 'student' || currentUser?.role === 'guest') {
          <div class="nav-section-title" [style.color]="activeTheme === 'rose' ? '#BE185D' : (activeTheme === 'manga' ? '#8B74FC' : 'var(--text-muted)')">{{ t('Apprendre', 'Learn') }}</div>
          
          <button class="sidebar-item" [class.active]="activeTab === 'dashboard'" (click)="setTab('dashboard')"
                  [style.opacity]="mustTakePlacementTest ? '0.4' : '1'"
                  [style.pointer-events]="mustTakePlacementTest ? 'none' : 'auto'">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
            {{ t('Tableau de bord', 'Dashboard') }}
          </button>
          
          @if (showGarden) {
            <button class="sidebar-item" [class.active]="activeTab === 'garden'" (click)="setTab('garden')">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 20h10"/><path d="M10 20c0-4.4 3.6-8 8-8"/><path d="M4 12c4.4 0 8 3.6 8 8"/><path d="M12 20V4"/></svg>
              My Garden
            </button>
          }
          @if (showJourney) {
            <button class="sidebar-item" [class.active]="activeTab === 'journey'" (click)="setTab('journey')">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
              SpeakUp Journey
            </button>
          }

          <button class="sidebar-item" [class.active]="activeTab === 'lessons'" (click)="setTab('lessons')"
                  [style.opacity]="mustTakePlacementTest ? '0.4' : '1'">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z"/></svg>
            {{ t('Cours & Leçons', 'Lessons') }}
            @if (newLessonsCount > 0) {
              <span class="sidebar-badge" style="background:#7C3AED">{{ newLessonsCount }}</span>
            }
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'speaking'" [disabled]="currentUser?.role === 'guest'"
                  [style.opacity]="currentUser?.role === 'guest' ? '0.5' : (mustTakePlacementTest ? '0.4' : '1')" 
                  (click)="setTab('speaking')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
            {{ t('Pratique Orale', 'Speaking') }}
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'quizzes'" (click)="setTab('quizzes')"
                  [style.opacity]="mustTakePlacementTest ? '0.4' : '1'">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            {{ t('Quiz & Évaluations', 'Quizzes & Tests') }}
            @if (newQuizzesCount > 0) {
              <span class="sidebar-badge" style="background:#7C3AED">{{ newQuizzesCount }}</span>
            }
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'exercises'" (click)="setTab('exercises')"
                  [style.border]="mustTakePlacementTest && activeTab !== 'exercises' ? '1.5px solid #F59E0B' : 'none'">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" [style.color]="activeTab === 'exercises' ? '#FFFFFF' : (mustTakePlacementTest ? '#D97706' : 'inherit')"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            <span [style.color]="activeTab === 'exercises' ? '#FFFFFF' : (mustTakePlacementTest ? '#B45309' : 'inherit')" [style.font-weight]="mustTakePlacementTest || activeTab === 'exercises' ? '800' : 'normal'">
              {{ mustTakePlacementTest ? t('Test de Niveau', 'Placement Test') : t('Jeux & Exercices', 'Games & Exercises') }}
            </span>
            @if (mustTakePlacementTest) {
              <span class="sidebar-badge" style="background:#D97706; font-size:9.5px; animation: pulse-live 1.5s infinite">REQ</span>
            } @else if (newExercisesCount > 0) {
              <span class="sidebar-badge" style="background:#7C3AED">{{ newExercisesCount }}</span>
            }
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'dictionary'" (click)="setTab('dictionary')"
                  [style.opacity]="mustTakePlacementTest ? '0.4' : '1'">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
            {{ t('Dictionnaire', 'Dictionary') }}
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'ebooks'" (click)="setTab('ebooks')"
                  [style.opacity]="mustTakePlacementTest ? '0.4' : '1'">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z"/></svg>
            {{ t('Bibliothèque (Ebooks)', 'Ebooks Library') }}
          </button>

          <!-- COMMUNICATION SECTION -->
          <div class="nav-section-title" [style.color]="activeTheme === 'rose' ? '#BE185D' : (activeTheme === 'manga' ? '#8B74FC' : 'var(--text-muted)')">{{ t('Communauté', 'Community') }}</div>
          
          <button class="sidebar-item" [class.active]="activeTab === 'chat'" (click)="setTab('chat')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {{ t('Chat en Anglais', 'English Chat') }}
            @if (chatUnreadCount > 0) {
              <span class="sidebar-badge" style="background:#EF4444">{{ chatUnreadCount }}</span>
            }
          </button>
          
          @if (showBoutique) {
            <button class="sidebar-item" [class.active]="activeTab === 'marketplace'" (click)="setTab('marketplace')">
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              Boutique
            </button>
          }

          <button class="sidebar-item" [class.active]="activeTab === 'leaderboard'" (click)="setTab('leaderboard')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            {{ t('Classement (XP)', 'Leaderboard') }}
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'events'" (click)="setTab('events')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {{ t('Événements', 'Events') }}
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'announcements'" (click)="setTab('announcements')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            {{ t('Annonces', 'Announcements') }}
            @if (unreadAnnouncementsCount > 0) {
              <span class="sidebar-badge" style="background:#EF4444">{{ unreadAnnouncementsCount }}</span>
            }
          </button>

          <!-- Deku illustration waving in the middle of sidebar list (Manga Theme only) -->
          @if (activeTheme === 'manga') {
            <div style="display:flex; justify-content:center; margin:14px 0; position:relative">
              <img src="deku_chibi.png" style="height:100px; object-fit:contain; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.15))" alt="Deku">
            </div>
          }

          <!-- LIVE CLASSES -->
          <div class="nav-section-title" [style.color]="activeTheme === 'rose' ? '#BE185D' : (activeTheme === 'manga' ? '#8B74FC' : 'var(--text-muted)')">{{ t('Cours en direct', 'Live Classes') }}</div>
          
          <button class="sidebar-item" [class.active]="activeTab === 'live-classes'" (click)="setTab('live-classes')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            {{ t('Classes en Direct', 'Live Classes') }}
            @if (activeClassAvailable) {
              <span class="sidebar-badge" style="background:#EF4444; animation: pulse-live 1.5s infinite">LIVE</span>
            }
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'ice-breaker'" (click)="setTab('ice-breaker')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" [style.color]="activeTab === 'ice-breaker' ? '#FFFFFF' : (activeTheme === 'rose' ? '#BE185D' : '#10B981')"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            <span style="font-weight:700" [style.color]="activeTab === 'ice-breaker' ? '#FFFFFF' : (activeTheme === 'rose' ? '#BE185D' : (activeTheme === 'manga' ? 'white' : '#10B981'))">{{ t('Ice Breaker', 'Ice Breaker') }}</span>
            @if (activeIceBreakerSession) {
              <span class="sidebar-badge" style="background:#EF4444; animation: pulse-live 1.5s infinite">LIVE</span>
            }
          </button>

          <!-- PROGRESS SECTION -->
          <div class="nav-section-title" [style.color]="activeTheme === 'rose' ? '#BE185D' : (activeTheme === 'manga' ? '#8B74FC' : 'var(--text-muted)')">{{ t('Progression', 'Progress') }}</div>
          
          <button class="sidebar-item" [class.active]="activeTab === 'history'" (click)="setTab('history')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
            {{ t('Mon Historique', 'My History') }}
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'exam'" (click)="setTab('exam')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
            {{ t('Mode Examen', 'Exam Mode') }}
            @if (examModeIsNew) {
              <span class="sidebar-badge" style="background:#7C3AED">NEW</span>
            }
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'coaching'" (click)="setTab('coaching')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" [style.color]="activeTab === 'coaching' ? '#FFFFFF' : '#D97706'"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            <span style="font-weight:700" [style.color]="activeTab === 'coaching' ? '#FFFFFF' : '#B45309'">{{ t('Accompagnement Privé', 'Private Coaching') }}</span>
            @if (currentUser?.isPrivateCoaching) {
              <span class="sidebar-badge" style="background:#10B981">VIP</span>
            }
          </button>

        <!-- ADMIN NAVIGATION -->
        } @else if (currentUser?.role === 'admin') {
          <div class="nav-section-title" [style.color]="activeTheme === 'rose' ? '#BE185D' : (activeTheme === 'manga' ? '#8B74FC' : 'var(--text-muted)')">{{ t('Administration', 'Administration') }}</div>
          <button class="sidebar-item" [class.active]="activeTab === 'admin-management'" (click)="setTab('admin-management')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            {{ t('Console Admin', 'Admin Control') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'chat'" (click)="setTab('chat')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {{ t('Chat en Anglais', 'English Chat') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'announcements'" (click)="setTab('announcements')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
            {{ t('Annonces', 'Announcements') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'system-history'" (click)="setTab('system-history')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
            {{ t('Logs Système', 'System Logs') }}
          </button>

        <!-- TEACHER NAVIGATION -->
        } @else {
          <div class="nav-section-title" [style.color]="activeTheme === 'rose' ? '#BE185D' : (activeTheme === 'manga' ? '#8B74FC' : 'var(--text-muted)')">{{ t('Vue Générale', 'Overview') }}</div>
          <button class="sidebar-item" [class.active]="activeTab === 'overview'" (click)="setTab('overview')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
            {{ t("Vue d'ensemble", 'Overview') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'chat'" (click)="setTab('chat')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {{ t('Chat en Anglais', 'English Chat') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'leaderboard'" (click)="setTab('leaderboard')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
            {{ t('Classement & Récompenses', 'Leaderboard & Rewards') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'students'" (click)="setTab('students')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Mes Élèves
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'teacher-coaching'" (click)="setTab('teacher-coaching')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" [style.color]="activeTab === 'teacher-coaching' ? '#FFFFFF' : '#D97706'"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            <span style="font-weight:700" [style.color]="activeTab === 'teacher-coaching' ? '#FFFFFF' : '#B45309'">{{ t('Coaching Privé', 'Private Coaching') }}</span>
            @if (pendingCoachingCount > 0) {
              <span class="sidebar-badge" style="background:#EF4444">{{ pendingCoachingCount }}</span>
            }
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'wheel-game'" (click)="setTab('wheel-game')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" [style.color]="activeTab === 'wheel-game' ? '#FFFFFF' : '#10B981'"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            <span style="font-weight:700" [style.color]="activeTab === 'wheel-game' ? '#FFFFFF' : '#047857'">{{ t('Roue des Noms', 'Wheel Game') }}</span>
          </button>
          
          <div class="nav-section-title" [style.color]="activeTheme === 'rose' ? '#BE185D' : (activeTheme === 'manga' ? '#8B74FC' : 'var(--text-muted)')">{{ t('Contenus', 'Content') }}</div>
          <button class="sidebar-item" [class.active]="activeTab === 'create-lesson'" (click)="setTab('create-lesson')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z"/></svg>
            {{ t('Créer un cours', 'Create Lesson') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'create-quiz'" (click)="setTab('create-quiz')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            {{ t('Gérer les Quiz', 'Quiz Builder') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'exercises-manager'" (click)="setTab('exercises-manager')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><polyline points="9 12 11 14 15 10"/><line x1="9" y1="17" x2="15" y2="17"/></svg>
            {{ t('Gérer les Exercices', 'Exercises Manager') }}
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'grade-homework'" (click)="setTab('grade-homework')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            {{ t('Corriger les Devoirs', 'Grade Homework') }}
            @if (pendingHomeworkCount > 0) {
              <span class="sidebar-badge" style="background:#FEE2E2; color:#DC2626">{{ pendingHomeworkCount }}</span>
            }
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'results'" (click)="setTab('results')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M12 11v6"/><path d="M8 14v3"/><path d="M16 12v5"/></svg>
            {{ t('Résultats Élèves', 'Students Results') }}
            @if (showResultsNewBadge) {
              <span class="sidebar-badge" style="background:#059669">NEW</span>
            }
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'ebooks'" (click)="setTab('ebooks')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z"/></svg>
            {{ t('Gérer les Ebooks', 'Manage Ebooks') }}
          </button>
          
          <div class="nav-section-title" [style.color]="activeTheme === 'rose' ? '#BE185D' : (activeTheme === 'manga' ? '#8B74FC' : 'var(--text-muted)')">{{ t('Classes & Directs', 'Classes & Lives') }}</div>
          <button class="sidebar-item" [class.active]="activeTab === 'attendance'" (click)="setTab('attendance')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg>
            {{ t('Feuille de Présences', 'Attendance Sheet') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'schedule-class'" (click)="setTab('schedule-class')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            {{ t('Analyses & Classes', 'Analytics & Classes') }}
          </button>
          
          <div class="nav-section-title" [style.color]="activeTheme === 'rose' ? '#BE185D' : (activeTheme === 'manga' ? '#8B74FC' : 'var(--text-muted)')">{{ t('Administration', 'Administration') }}</div>
          <button class="sidebar-item" [class.active]="activeTab === 'announcements'" (click)="setTab('announcements')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            {{ t('Annonces Générales', 'Announcements') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'payments'" (click)="setTab('payments')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            {{ t('Suivi des Paiements', 'Payments Tracker') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'teacher-events'" (click)="setTab('teacher-events')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {{ t('Événements', 'Events') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'user-management'" (click)="setTab('user-management')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {{ t('Utilisateurs & Modération', 'Users & Moderation') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'system-history'" (click)="setTab('system-history')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
            {{ t('Logs Système', 'System Logs') }}
          </button>
        }

        <!-- Bottom character overlays (Uraraka in Manga, Luffy in Rose) -->
        @if (activeTheme === 'manga') {
          <div style="display:flex; flex-direction:column; align-items:center; margin-top:auto; padding-bottom:12px; position:relative">
            <img src="uraraka_chibi.png" style="height:90px; object-fit:contain; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.15))" alt="Uraraka" (click)="profileClick()">
            <span style="font-weight:900; font-size:14px; color:#E11D48; text-transform:uppercase; letter-spacing:1px; transform:rotate(-5deg); text-shadow:2px 2px 0 black; margin-top:-6px; cursor:pointer" (click)="profileClick()">GO!</span>
          </div>
        } @else if (activeTheme === 'rose') {
          <div style="display:flex; align-items:center; justify-content:center; gap:4px; margin-top:auto; padding-bottom:12px; position:relative">
            <img src="luffy_chibi.png" style="height:90px; object-fit:contain; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.05))" alt="Luffy" (click)="profileClick()">
            <div style="background:white; border:2px solid #DB2777; border-radius:15px; padding:4px 10px; font-size:12px; font-weight:900; color:#BE185D; position:relative; box-shadow:2px 2px 0 rgba(219,39,119,0.1); cursor:pointer" (click)="profileClick()">
              <span>Go!</span>
              <div style="position:absolute; left:-6px; top:50%; transform:translateY(-50%) rotate(45deg); width:8px; height:8px; background:white; border-left:2px solid #DB2777; border-bottom:2px solid #DB2777"></div>
            </div>
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .sidebar-container {
      width: 220px;
      height: 100vh;
      border-right: 0.5px solid var(--border);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      position: relative;
    }
    .sidebar-logo {
      padding: 16px;
      border-bottom: 0.5px solid var(--border);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sidebar-nav {
      flex: 1;
      padding: 8px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }
    .nav-section-title {
      font-size: 10px;
      color: var(--text-muted);
      padding: 12px 8px 4px;
      text-transform: uppercase;
      letter-spacing: .8px;
      font-weight: 600;
    }
    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      border: none;
      background: none;
      padding: 8px 12px;
      border-radius: 8px;
      color: var(--text-secondary);
      font-size: 12.5px;
      font-weight: 500;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      outline: none;
    }
    .sidebar-item i {
      font-size: 16px;
    }
    .sidebar-item:hover {
      background: var(--surface-2);
      color: var(--text-primary);
      transform: translateX(2px);
    }
    .sidebar-item.active {
      background: #4F46E5 !important;
      color: #FFFFFF !important;
      font-weight: 700 !important;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
    }
    .sidebar-item.active i,
    .sidebar-item.active span,
    .sidebar-item.active svg {
      color: #FFFFFF !important;
    }
    .sidebar-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px 6px;
      font-size: 9.5px;
      font-weight: 800;
      color: white;
      border-radius: 10px;
      margin-left: auto;
      line-height: 1;
    }
    @keyframes pulse-live {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.85; }
      100% { transform: scale(1); opacity: 1; }
    }
  `]
})
export class SidebarComponent {
  @Input() activeTab: string = 'dashboard';
  @Input() currentUser: UserProfile | null = null;
  @Input() activeTheme: string = 'default';
  @Input() activeIceBreakerSession: boolean = false;
  @Input() activeClassAvailable: boolean = false;
  @Input() newLessonsCount: number = 0;
  @Input() newQuizzesCount: number = 0;
  @Input() newExercisesCount: number = 0;
  @Input() chatUnreadCount: number = 0;
  @Input() unreadAnnouncementsCount: number = 0;
  @Input() examModeIsNew: boolean = false;
  @Input() showExamNewBadge: boolean = false;
  @Input() showResultsNewBadge: boolean = false;
  @Input() pendingPlacementCount: number = 0;
  @Input() pendingCoachingCount: number = 0;
  @Input() pendingHomeworkCount: number = 0;
  @Input() showBoutique: boolean = false;
  @Input() showGarden: boolean = false;
  @Input() showJourney: boolean = false;
  @Input() mustTakePlacementTest: boolean = false;

  @Output() tabChange = new EventEmitter<string>();
  @Output() editProfile = new EventEmitter<void>();

  private db = inject(DatabaseService);

  t(fr: string, en: string): string {
    return this.db.activeLang() === 'en' ? en : fr;
  }

  setTab(tab: string) {
    this.tabChange.emit(tab);
  }

  profileClick() {
    this.editProfile.emit();
  }
}
