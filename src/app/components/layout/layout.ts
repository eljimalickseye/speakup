import { Component, inject, signal, effect, computed } from '@angular/core';
import { combineLatest } from 'rxjs';
import { CommonModule } from '@angular/common';
import { DatabaseService, UserProfile, LiveClass, Submission, Announcement } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';
import { FormsModule } from '@angular/forms';
import { JitsiMeet } from '../jitsi-meet/jitsi-meet';

// Subcomponents imports
import { StudentDashboardComponent } from '../student/dashboard';
import { StudentLessonsComponent } from '../student/lessons';
import { StudentSpeakingComponent } from '../student/speaking';
import { StudentExercisesComponent } from '../student/exercises';
import { StudentChatComponent } from '../student/chat';
import { StudentLeaderboardComponent } from '../student/leaderboard';
import { StudentEventsComponent } from '../student/events';
import { StudentLiveClassesComponent } from '../student/live';
import { StudentAnnouncementsComponent } from '../student/announcements';
import { StudentDictionaryComponent } from '../student/dictionary';
import { StudentEbooksComponent } from '../student/ebooks';
import { StudentHistoryComponent } from '../student/history';
import { StudentExamComponent } from '../student/exam';
import { StudentProfileComponent } from '../student/profile';
import { StudentGardenComponent } from '../student/garden';
import { StudentClubsComponent } from '../student/clubs';
import { StudentMarketplaceComponent } from '../student/marketplace';
import { StudentJourneyComponent } from '../student/journey';
import { TeacherEbooksComponent } from '../teacher/ebooks';
import { TeacherOverviewComponent } from '../teacher/overview';
import { TeacherStudentsComponent } from '../teacher/students';
import { TeacherLessonsComponent } from '../teacher/lessons';
import { TeacherQuizzesComponent } from '../teacher/quizzes';
import { TeacherHomeworkComponent } from '../teacher/homework';
import { TeacherAttendanceComponent } from '../teacher/attendance';
import { TeacherScheduleComponent } from '../teacher/schedule';
import { TeacherAnnouncementsComponent } from '../teacher/announcements';
import { TeacherPaymentsComponent } from '../teacher/payments';
import { TeacherEventsComponent } from '../teacher/events';
import { TeacherUserManagementComponent } from '../teacher/user-management';
import { TeacherResultsComponent } from '../teacher/results';
import { TeacherExercisesManagerComponent } from '../teacher/exercises-manager';
import { AdminManagementComponent } from '../admin/admin-management';
import { NotificationsComponent } from '../shared/notifications';
import { HistoryLogsComponent } from '../shared/history-logs';
import { StudentCoachingComponent } from '../student/coaching';
import { StudentIceBreakerComponent } from '../student/icebreaker';
import { TeacherCoachingComponent } from '../teacher/coaching';
import { TeacherWheelGameComponent } from '../teacher/wheel-game';
import { SidebarComponent } from './sidebar';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    JitsiMeet,
    StudentDashboardComponent,
    StudentLessonsComponent,
    StudentSpeakingComponent,
    StudentExercisesComponent,
    StudentChatComponent,
    StudentLeaderboardComponent,
    StudentEventsComponent,
    StudentLiveClassesComponent,
    StudentAnnouncementsComponent,
    StudentDictionaryComponent,
    StudentEbooksComponent,
    StudentHistoryComponent,
    StudentExamComponent,
    StudentProfileComponent,
    StudentGardenComponent,
    StudentClubsComponent,
    StudentMarketplaceComponent,
    StudentJourneyComponent,
    TeacherEbooksComponent,
    TeacherOverviewComponent,
    TeacherStudentsComponent,
    TeacherLessonsComponent,
    TeacherQuizzesComponent,
    TeacherHomeworkComponent,
    TeacherAttendanceComponent,
    TeacherScheduleComponent,
    TeacherAnnouncementsComponent,
    TeacherPaymentsComponent,
    TeacherEventsComponent,
    TeacherUserManagementComponent,
    TeacherResultsComponent,
    TeacherExercisesManagerComponent,
    AdminManagementComponent,
    NotificationsComponent,
    HistoryLogsComponent,
    StudentCoachingComponent, StudentIceBreakerComponent,
    TeacherCoachingComponent,
    TeacherWheelGameComponent,
    SidebarComponent
  ],
  template: `
    @if (currentUser()?.status === 'pending') {
      <div style="display:flex; justify-content:center; align-items:center; min-height:100vh; background:linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); padding:20px; text-align:center; width:100%; box-sizing:border-box">
        <div class="card" style="width:100%; max-width:540px; padding:40px; border-radius:16px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); background:#FFF; border-top: 4px solid #4F46E5; box-sizing:border-box">
          <div style="font-size:64px; margin-bottom:20px">⏳</div>
          <h2 style="font-size:22px; font-weight:800; color:#1e3a8a; margin:0 0 16px 0">Compte en attente de validation</h2>
          <div style="font-size:14.5px; color:#475569; line-height:1.7; text-align:left; background:#F8FAFC; border:1px solid #E2E8F0; padding:20px; border-radius:10px; margin-bottom:24px">
            <p style="margin:0 0 12px 0; font-weight:600; color:#0f172a">Votre demande d'inscription a bien été enregistrée.</p>
            <p style="margin:0 0 12px 0">Notre équipe étudie actuellement votre dossier afin de garantir la sécurité de la plateforme.</p>
            <p style="margin:0 0 12px 0">Vous recevrez une notification dès que votre compte sera validé.</p>
            <p style="margin:0; font-weight:600; color:#4F46E5">Merci de votre patience.</p>
          </div>
          <button class="btn-s" style="padding:10px 24px; border-radius:8px; display:inline-flex; align-items:center; gap:8px; border-color:#EF4444; color:#EF4444; cursor:pointer" (click)="logOut()">
            <i class="ti ti-logout"></i> Se déconnecter
          </button>
        </div>
      </div>
    } @else if (currentUser()?.status === 'rejected') {
      <div style="display:flex; justify-content:center; align-items:center; min-height:100vh; background:linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%); padding:20px; text-align:center; width:100%; box-sizing:border-box">
        <div class="card" style="width:100%; max-width:540px; padding:40px; border-radius:16px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); background:#FFF; border-top: 4px solid #EF4444; box-sizing:border-box">
          <div style="font-size:64px; margin-bottom:20px">❌</div>
          <h2 style="font-size:22px; font-weight:800; color:#991B1B; margin:0 0 16px 0">Demande d'inscription refusée</h2>
          <div style="font-size:14.5px; color:#475569; line-height:1.7; text-align:left; background:#F8FAFC; border:1px solid #E2E8F0; padding:20px; border-radius:10px; margin-bottom:24px">
            <p style="margin:0; font-weight:600; color:#991B1B">Désolé, votre demande d'accès à la plateforme SpeakUp a été rejetée par l'administrateur.</p>
          </div>
          <button class="btn-s" style="padding:10px 24px; border-radius:8px; display:inline-flex; align-items:center; gap:8px; border-color:#EF4444; color:#EF4444; cursor:pointer" (click)="logOut()">
            <i class="ti ti-logout"></i> Se déconnecter
          </button>
        </div>
      </div>
    } @else {
      <div class="shell" [class.sidebar-open]="isSidebarOpen()">
      <!-- SIDEBAR BACKDROP (Mobile only) -->
      <div class="sidebar-backdrop" (click)="toggleSidebar(false)"></div>

      <!-- SIDEBAR (Standalone SidebarComponent) -->
      <app-sidebar
        [activeTab]="activeTab"
        [currentUser]="currentUser()"
        [activeTheme]="activeTheme()"
        [activeIceBreakerSession]="activeIceBreakerSession()"
        [activeClassAvailable]="activeClassAvailable()"
        [newLessonsCount]="newLessonsCount()"
        [newQuizzesCount]="newQuizzesCount()"
        [newExercisesCount]="newExercisesCount()"
        [chatUnreadCount]="chatUnreadCount()"
        [unreadAnnouncementsCount]="unreadAnnouncementsCount()"
        [examModeIsNew]="examModeIsNew()"
        [showExamNewBadge]="showExamNewBadge()"
        [showResultsNewBadge]="showResultsNewBadge()"
        [pendingPlacementCount]="pendingPlacementCount()"
        [pendingCoachingCount]="pendingCoachingCount()"
        [pendingHomeworkCount]="pendingHomeworkCount()"
        [showBoutique]="showBoutique()"
        [showGarden]="showGarden()"
        [showJourney]="showJourney()"
        [mustTakePlacementTest]="mustTakePlacementTest()"
        (tabChange)="setTab($event)"
        (editProfile)="currentUser()?.role === 'student' ? setTab('profile') : openProfileEditor()"
      ></app-sidebar>      
      <!-- MAIN CONTAINER -->
      <div class="main">
        <!-- TOPBAR -->
        <div class="topbar" 
             [style.background]="activeTheme() === 'manga' ? 'url(manga_header_bg.png) center/cover' : (activeTheme() === 'rose' ? 'url(rose_header_bg.png) center/cover' : 'var(--surface-1)')"
             [style.minHeight]="(activeTheme() === 'manga' || activeTheme() === 'rose') ? '120px' : 'auto'"
             [style.padding]="(activeTheme() === 'manga' || activeTheme() === 'rose') ? '12px 24px' : '14px 20px'"
             [style.borderBottom]="activeTheme() === 'manga' ? '2px solid #000' : (activeTheme() === 'rose' ? '2px solid #FBCFE8' : '0.5px solid var(--border)')"
             style="position:relative; overflow:visible; z-index:150">
          <!-- Hamburger menu button (Mobile only) -->
          <button class="hamburger-btn" (click)="toggleSidebar(true)">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div style="display:flex; flex-direction:column; gap:2px; flex:1">
            <span class="topbar-title" 
                  [style.fontSize]="activeTheme() === 'manga' ? '22px' : '16px'" 
                  [style.fontWeight]="activeTheme() === 'manga' ? '900' : '600'" 
                  [style.color]="activeTheme() === 'manga' ? 'black' : 'var(--text-primary)'"
                  style="margin:0">{{ pageTitle }}</span>
            @if (activeTheme() === 'manga') {
              <span style="font-size:12px; color:#4B5563; font-weight:700">
                Pratiquez, jouez, progressez en anglais !
              </span>
            }
          </div>

          @if (activeTheme() === 'manga') {
            <div class="hide-mobile" style="display:flex; align-items:center; gap:8px; margin:0 auto; position:absolute; left:50%; transform:translateX(-50%); bottom:0; height:100px; pointer-events:none">
              <!-- speech bubble -->
              <div style="background:white; border:2px solid black; border-radius:30px; padding:6px 14px; position:relative; font-size:11px; font-weight:800; color:black; display:flex; flex-direction:column; align-items:center; box-shadow:3px 3px 0 rgba(0,0,0,0.15)">
                <span>一緒に頑張ろう！</span>
                <span style="font-size:9.5px; opacity:0.8">Let's do our best!</span>
                <div style="position:absolute; right:-6px; top:50%; transform:translateY(-50%) rotate(45deg); width:12px; height:12px; background:white; border-right:2px solid black; border-top:2px solid black"></div>
              </div>
              <img src="luffy_chibi.png" style="height:90px; object-fit:contain; margin-bottom: 5px" alt="Luffy">
            </div>
          } @else if (activeTheme() === 'rose') {
            <div class="hide-mobile" style="display:flex; align-items:center; gap:8px; margin:0 auto; position:absolute; left:50%; transform:translateX(-50%); bottom:0; height:100px; pointer-events:none">
              <!-- speech bubble -->
              <div style="background:white; border:2px solid #DB2777; border-radius:30px; padding:6px 14px; position:relative; font-size:11px; font-weight:800; color:#BE185D; display:flex; flex-direction:column; align-items:center; box-shadow:3px 3px 0 rgba(219,39,119,0.15)">
                <span>一緒に頑張ろう！</span>
                <span style="font-size:9.5px; opacity:0.8; color:#DB2777">Let's do our best!</span>
                <div style="position:absolute; right:-6px; top:50%; transform:translateY(-50%) rotate(45deg); width:12px; height:12px; background:white; border-right:2px solid #DB2777; border-top:2px solid #DB2777"></div>
              </div>
              <img src="pink_girl_chibi.png" style="height:90px; object-fit:contain; margin-bottom: 5px" alt="Pink Chibi">
            </div>
          }
          
          <!-- Custom Theme Switcher Dropdown (Student only, when enabled by teacher) -->
          @if (currentUser()?.role === 'student' && showThemes()) {
            <div style="position:relative; margin-right:12px; margin-left:auto">
              <button (click)="isThemeMenuOpen.set(!isThemeMenuOpen())" 
                      style="display:flex; align-items:center; gap:6px; background:var(--surface-2); border:1px solid var(--border-weak); padding:6px 12px; border-radius:20px; font-size:12px; font-weight:700; color:var(--text-secondary); cursor:pointer; transition:all 0.2s; outline:none">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                <span>{{ t('Thèmes', 'Themes') }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:2px"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              
              <!-- Dropdown Panel -->
              @if (isThemeMenuOpen()) {
                <div style="position:absolute; top:36px; right:0; background:var(--surface-1); border:1px solid var(--border-strong); border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1); padding:8px; display:flex; flex-direction:column; gap:4px; z-index:999; min-width:180px">
                  
                  <button (click)="selectTheme('default')" style="display:flex; align-items:center; gap:8px; width:100%; border:none; background:none; padding:8px 12px; font-size:12px; font-weight:700; text-align:left; cursor:pointer; border-radius:6px; color:var(--text-primary)" onmouseover="this.style.background='var(--surface-2)'" onmouseout="this.style.background='none'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span>{{ t('Défaut', 'Default') }}</span>
                  </button>

                  <button (click)="selectTheme('dark')" style="display:flex; align-items:center; gap:8px; width:100%; border:none; background:none; padding:8px 12px; font-size:12px; font-weight:700; text-align:left; cursor:pointer; border-radius:6px; color:var(--text-primary)" onmouseover="this.style.background='var(--surface-2)'" onmouseout="this.style.background='none'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                    <span>{{ t('Mode Sombre', 'Dark Mode') }}</span>
                  </button>

                  <button (click)="selectTheme('manga')" style="display:flex; align-items:center; gap:8px; width:100%; border:none; background:none; padding:8px 12px; font-size:12px; font-weight:700; text-align:left; cursor:pointer; border-radius:6px; color:var(--text-primary)" onmouseover="this.style.background='var(--surface-2)'" onmouseout="this.style.background='none'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                    <span>{{ t('Manga / Anime', 'Manga / Anime') }}</span>
                  </button>

                  <button (click)="selectTheme('rose')" style="display:flex; align-items:center; gap:8px; width:100%; border:none; background:none; padding:8px 12px; font-size:12px; font-weight:700; text-align:left; cursor:pointer; border-radius:6px; color:var(--text-primary)" onmouseover="this.style.background='var(--surface-2)'" onmouseout="this.style.background='none'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DB2777" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/></svg>
                    <span>{{ t('Pétales de Rose', 'Rose Petals') }}</span>
                  </button>

                  <button (click)="selectTheme('faith')" style="display:flex; align-items:center; gap:8px; width:100%; border:none; background:none; padding:8px 12px; font-size:12px; font-weight:700; text-align:left; cursor:pointer; border-radius:6px; color:var(--text-primary)" onmouseover="this.style.background='var(--surface-2)'" onmouseout="this.style.background='none'">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/><path d="M19 3v4M21 5h-4"/></svg>
                    <span>{{ t('Emerald Faith', 'Emerald Faith') }}</span>
                  </button>
                  
                </div>
              }
            </div>
          }

          <!-- Language Switcher Toggle -->
          <div style="display:flex; align-items:center; gap:4px; margin-right:12px; background:var(--surface-2); padding:3px; border-radius:12px; border:1px solid var(--border-weak)" [style.marginLeft]="currentUser()?.role === 'student' ? '0' : 'auto'">
            <button (click)="db.setLanguage('fr')" 
                    style="border:none; background:transparent; padding:4px 8px; border-radius:8px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.2s"
                    [style.background]="db.activeLang() === 'fr' ? '#4F46E5' : 'transparent'"
                    [style.color]="db.activeLang() === 'fr' ? 'white' : 'var(--text-secondary)'">
              <span>🇫🇷</span>
              <span class="hide-mobile">FR</span>
            </button>
            <button (click)="db.setLanguage('en')" 
                    style="border:none; background:transparent; padding:4px 8px; border-radius:8px; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.2s"
                    [style.background]="db.activeLang() === 'en' ? '#4F46E5' : 'transparent'"
                    [style.color]="db.activeLang() === 'en' ? 'white' : 'var(--text-secondary)'">
              <span>🇬🇧</span>
              <span class="hide-mobile">EN</span>
            </button>
          </div>
          
          <!-- Real-time notifications bell -->
          <app-notifications style="margin-right: 12px;"></app-notifications>

          <!-- Daily Practice Streak (Student only) -->
          @if (currentUser()?.role === 'student') {
            <div style="display:flex; align-items:center; gap:4.5px; margin-right:12px; background:linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%); border:1px solid #FED7AA; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:700; color:#EA580C; box-shadow:0 2px 5px rgba(234,88,12,0.08); cursor:pointer" 
                 (click)="setTab('exercises')" 
                 [title]="t('Votre série de pratique quotidienne 🔥', 'Your daily practice streak 🔥')">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="fill:#EA580C;">
                <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
              </svg>
              <span>{{ currentUser()?.streak || 0 }} {{ t('jours', 'days') }}</span>
            </div>
          }
          
          <!-- Live Button (Teacher only) -->
          @if (currentUser()?.role === 'teacher') {
            <button class="btn-s hide-mobile" (click)="triggerInstantLive()" style="font-size:11px; padding:4px 14px; border-radius:20px; display:flex; align-items:center; gap:6px; margin-right:10px; background:#EEF2FF; border-color:#4F46E5; color:#4F46E5; font-weight:700">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7Z"/><path d="M12 9v6"/><path d="M9 12h6"/></svg>
              {{ t('Activer le Live', 'Start Live') }}
            </button>
          }

          <!-- Log Out Button -->
          <button class="btn-s" style="font-size: 11px; padding: 4px 12px; border-radius: 20px; display:flex; align-items:center; gap:4px; margin-right: 12px; border-color:#EF4444; color:#EF4444" (click)="logOut()">
            <i class="ti ti-logout" aria-hidden="true"></i> {{ t('Se déconnecter', 'Log Out') }}
          </button>

          <div class="avatar" [style.background]="currentUser()?.role === 'teacher' ? '#3730A3' : '#4F46E5'" style="cursor:pointer; transition: transform 0.2s ease" (click)="currentUser()?.role === 'student' ? setTab('profile') : openProfileEditor()" [title]="t('Fiche de Personnage / Paramètres', 'Edit Profile Settings')">
            {{ currentUser()?.avatar }}
          </div>
        </div>
        
        <!-- CONTENT VIEWPORT -->
        <div class="content">
          <!-- Sticky Banners Container -->
          <div style="position:sticky; top:0; z-index:110; display:flex; flex-direction:column; gap:2px; flex-shrink:0">
            <!-- ── PERSISTENT LIVE BANNER (student only, when live is active) ── -->
            @if (currentUser()?.role === 'student' && activeClassAvailable() && !activeJitsiCall()) {
              @let activeLive = getActiveLiveClass();
              @if (activeLive) {
                <div style="background:linear-gradient(135deg,#EF4444,#DC2626); color:white; padding:10px 20px; display:flex; align-items:center; justify-content:space-between; gap:12px; box-shadow:0 4px 12px rgba(239,68,68,0.4)"
                     style="animation: slideDown 0.3s ease-out">
                  <div style="display:flex; align-items:center; gap:12px">
                    <div style="width:10px; height:10px; border-radius:50%; background:white; animation:pulse-live 1.5s infinite; flex-shrink:0"></div>
                    <div>
                      <div style="font-size:13px; font-weight:800">🎥 {{ t('Cours en direct en cours !','Live Class in Progress!') }}</div>
                      <div style="font-size:11px; opacity:0.9">{{ activeLive.title }} — {{ t('Rejoignez maintenant','Join now') }}</div>
                    </div>
                  </div>
                  <div style="display:flex; align-items:center; gap:8px">
                    <button (click)="joinActiveLive(activeLive)"
                            style="background:white; color:#DC2626; border:none; border-radius:8px; font-size:12px; font-weight:800; padding:7px 18px; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.2s"
                            onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                      {{ t('Rejoindre le live','Join Live') }}
                    </button>
                  </div>
                </div>
              }
            }

            <!-- ── PERSISTENT PAYMENT REMINDER BANNER ── -->
            @if (currentUser()?.role === 'student' && !currentUser()?.isPaid && currentUser()?.paymentRemindersActive) {
              <div style="background:linear-gradient(135deg,#F59E0B,#D97706); color:white; padding:10px 20px; display:flex; align-items:center; justify-content:space-between; gap:12px; box-shadow:0 4px 12px rgba(217,119,6,0.3)"
                   style="animation: slideDown 0.3s ease-out">
                <div style="display:flex; align-items:center; gap:12px">
                  <div style="font-size:18px; flex-shrink:0">🔔</div>
                  <div>
                    <div style="font-size:13px; font-weight:800">{{ t('Rappel de Paiement','Payment Reminder') }}</div>
                    <div style="font-size:11px; opacity:0.95">
                      {{ t('Bonjour ' + currentUser()?.name + ', veuillez régulariser votre compte en réglant vos frais d\'inscription ou votre mensualité. Merci !',
                             'Hello ' + currentUser()?.name + ', please settle your registration fee or monthly tuition to keep your account active. Thank you!') }}
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
          <!-- Student/Guest Views -->
          @if (currentUser()?.role === 'student' || currentUser()?.role === 'guest') {
            @if (activeTab === 'dashboard') {
              <app-student-dashboard (navigateToTab)="setTab($event)"></app-student-dashboard>
            } @else if (activeTab === 'profile') {
              <app-student-profile></app-student-profile>
            } @else if (activeTab === 'garden') {
              <app-student-garden></app-student-garden>
            } @else if (activeTab === 'journey') {
              <app-student-journey></app-student-journey>
            } @else if (activeTab === 'clubs') {
              <app-student-clubs></app-student-clubs>
            } @else if (activeTab === 'marketplace') {
              <app-student-marketplace></app-student-marketplace>
            } @else if (activeTab === 'lessons') {
              <app-student-lessons></app-student-lessons>
            } @else if (activeTab === 'speaking') {
              <app-student-speaking></app-student-speaking>
            } @else if (activeTab === 'quizzes') {
              <app-student-exercises mode="quizzes"></app-student-exercises>
            } @else if (activeTab === 'exercises') {
              <app-student-exercises [mode]="mustTakePlacementTest() ? 'quizzes' : 'exercises'"></app-student-exercises>
            } @else if (activeTab === 'dictionary') {
              <app-student-dictionary></app-student-dictionary>
            } @else if (activeTab === 'ebooks') {
              <app-student-ebooks></app-student-ebooks>
            } @else if (activeTab === 'chat') {
              <app-student-chat></app-student-chat>
            } @else if (activeTab === 'leaderboard') {
              <app-student-leaderboard></app-student-leaderboard>
            } @else if (activeTab === 'events') {
              <app-student-events></app-student-events>
            } @else if (activeTab === 'announcements') {
              <app-student-announcements></app-student-announcements>
            } @else if (activeTab === 'live-classes') {
              <app-student-live></app-student-live>
            } @else if (activeTab === 'history') {
              <app-student-history></app-student-history>
            } @else if (activeTab === 'exam') {
              <app-student-exam></app-student-exam>
            } @else if (activeTab === 'coaching') {
              <app-student-coaching></app-student-coaching>
            } @else if (activeTab === 'ice-breaker') {
              <app-student-icebreaker></app-student-icebreaker>
            }
          }
          
          <!-- Admin Views -->
          @if (currentUser()?.role === 'admin') {
            @if (activeTab === 'admin-management') {
              <app-admin-management></app-admin-management>
            } @else if (activeTab === 'chat') {
              <app-student-chat></app-student-chat>
            } @else if (activeTab === 'announcements') {
              <app-teacher-announcements></app-teacher-announcements>
            } @else if (activeTab === 'system-history') {
              <app-history-logs></app-history-logs>
            }
          }
          
          <!-- Teacher Views -->
          @if (currentUser()?.role === 'teacher') {
            @if (activeTab === 'overview') {
              <app-teacher-overview (navigateToTab)="setTab($event)"></app-teacher-overview>
            } @else if (activeTab === 'students') {
              <app-teacher-students></app-teacher-students>
            } @else if (activeTab === 'create-lesson') {
              <app-teacher-lessons></app-teacher-lessons>
            } @else if (activeTab === 'create-quiz') {
              <app-teacher-quizzes></app-teacher-quizzes>
            } @else if (activeTab === 'exercises-manager') {
              <app-teacher-exercises-manager></app-teacher-exercises-manager>

            } @else if (activeTab === 'teacher-coaching') {
              <app-teacher-coaching></app-teacher-coaching>
            } @else if (activeTab === 'wheel-game') {
              <app-teacher-wheel-game></app-teacher-wheel-game>

            } @else if (activeTab === 'grade-homework') {
              <app-teacher-homework></app-teacher-homework>
            } @else if (activeTab === 'results') {
              <app-teacher-results></app-teacher-results>
            } @else if (activeTab === 'ebooks') {
              <app-teacher-ebooks></app-teacher-ebooks>
            } @else if (activeTab === 'attendance') {
              <app-teacher-attendance></app-teacher-attendance>
            } @else if (activeTab === 'schedule-class') {
              <app-teacher-schedule (navigateToTab)="setTab($event)"></app-teacher-schedule>
            } @else if (activeTab === 'announcements') {
              <app-teacher-announcements></app-teacher-announcements>
            } @else if (activeTab === 'payments') {
              <app-teacher-payments></app-teacher-payments>
            } @else if (activeTab === 'teacher-events') {
              <app-teacher-events></app-teacher-events>
            } @else if (activeTab === 'chat') {
              <app-student-chat></app-student-chat>
            } @else if (activeTab === 'leaderboard') {
              <app-student-leaderboard></app-student-leaderboard>
            } @else if (activeTab === 'user-management') {
              <app-teacher-user-management></app-teacher-user-management>
            } @else if (activeTab === 'system-history') {
              <app-history-logs></app-history-logs>
            }
          }
        </div>

        <!-- MOBILE BOTTOM NAVIGATION BAR -->
        <nav class="mobile-bottom-nav">
          @if (currentUser()?.role === 'student' || currentUser()?.role === 'guest') {
            <button (click)="setTab('dashboard')" [class.active]="activeTab === 'dashboard'">
              <i class="ti ti-layout-dashboard"></i>
              <span>{{ t('Accueil', 'Home') }}</span>
            </button>

            <button (click)="setTab('lessons')" [class.active]="activeTab === 'lessons'">
              <i class="ti ti-book"></i>
              <span>{{ t('Cours', 'Lessons') }}</span>
              @if (newLessonsCount() > 0) {
                <span class="nav-badge">{{ newLessonsCount() }}</span>
              }
            </button>

            <button (click)="setTab('exercises')" [class.active]="activeTab === 'exercises'">
              <i class="ti ti-pencil"></i>
              <span>{{ t('Jeux', 'Games') }}</span>
              @if (newExercisesCount() > 0) {
                <span class="nav-badge">{{ newExercisesCount() }}</span>
              }
            </button>

            <button (click)="setTab('chat')" [class.active]="activeTab === 'chat'">
              <i class="ti ti-messages"></i>
              <span>Chat</span>
              @if (chatUnreadCount() > 0) {
                <span class="nav-badge">{{ chatUnreadCount() }}</span>
              }
            </button>

            <button (click)="setTab('ebooks')" [class.active]="activeTab === 'ebooks'">
              <i class="ti ti-book-2"></i>
              <span>{{ t('Livres', 'Books') }}</span>
            </button>
          } @else if (currentUser()?.role === 'teacher') {
            <button (click)="setTab('overview')" [class.active]="activeTab === 'overview'">
              <i class="ti ti-chart-bar"></i>
              <span>{{ t('Aperçu', 'Overview') }}</span>
            </button>

            <button (click)="setTab('students')" [class.active]="activeTab === 'students'">
              <i class="ti ti-users"></i>
              <span>{{ t('Élèves', 'Students') }}</span>
            </button>

            <button (click)="setTab('lessons')" [class.active]="activeTab === 'lessons'">
              <i class="ti ti-book"></i>
              <span>{{ t('Cours', 'Lessons') }}</span>
            </button>

            <button (click)="setTab('exercises-manager')" [class.active]="activeTab === 'exercises-manager'">
              <i class="ti ti-pencil"></i>
              <span>{{ t('Jeux', 'Games') }}</span>
            </button>

            <button (click)="setTab('chat')" [class.active]="activeTab === 'chat'">
              <i class="ti ti-messages"></i>
              <span>Chat</span>
              @if (chatUnreadCount() > 0) {
                <span class="nav-badge">{{ chatUnreadCount() }}</span>
              }
            </button>
          }
        </nav>

        <!-- Floating Toaster Container -->
        <div class="toaster-container">
          @for (toast of toasts(); track toast.id) {
            <div class="toast-card" [class]="toast.type">
              <div class="toast-icon-side">
                <i class="ti" [class]="toast.icon" aria-hidden="true"></i>
              </div>
              <div class="toast-content-side">
                <div class="toast-title">{{ toast.title }}</div>
                <div class="toast-message">{{ toast.message }}</div>
                @if (toast.action && toast.actionText) {
                  <button class="toast-action-btn" (click)="toast.action(); removeToast(toast.id)">
                    {{ toast.actionText }}
                  </button>
                }
              </div>
              <button class="toast-close-btn" (click)="removeToast(toast.id)">
                <i class="ti ti-x" aria-hidden="true"></i>
              </button>
            </div>
          }
        </div>
      </div>
      <!-- GLOBAL MODAL DIALOG -->
      @if (dialogService.activeDialog(); as d) {
        <div class="modal-overlay" (click)="closeDialog()">
          <div class="modal-card" 
               [style.max-width]="d.imageUrl ? '820px' : '500px'" 
               [style.padding]="d.imageUrl ? '0' : '20px'" 
               [style.overflow]="d.imageUrl ? 'hidden' : 'auto'" 
               (click)="$event.stopPropagation()">
            
            @if (d.imageUrl) {
              <!-- Split Layout for Announcements / Image Dialogs -->
              <div class="modal-grid-split" style="display:grid; grid-template-columns: 1.15fr 1fr; min-height:480px; max-height:85vh">
                <!-- Left: Beautiful Image Banner with Padded Frame and Blurred Background -->
                <div style="position:relative; background:#F8FAFC; display:flex; justify-content:center; align-items:center; overflow:hidden; padding:24px">
                  <img [src]="d.imageUrl" style="width:100%; height:100%; object-fit:cover; filter:blur(16px); opacity:0.25; position:absolute; inset:0" alt="">
                  <img [src]="d.imageUrl" style="max-width:100%; max-height:100%; object-fit:contain; position:relative; z-index:1; border-radius:10px; box-shadow:0 10px 25px rgba(0,0,0,0.15)" alt="Announcement Banner">
                </div>
                
                <!-- Right: Details, HTML Content & Actions -->
                <div style="display:flex; flex-direction:column; padding:24px; justify-content:space-between; background:var(--surface-1); overflow-y:auto">
                  <div style="flex:1">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                      <div style="display:flex; align-items:center; gap:8px">
                        <i class="ti ti-volume" style="font-size:20px; color:#7E22CE"></i>
                        <span style="font-size:11px; font-weight:800; color:#7E22CE; text-transform:uppercase; letter-spacing:0.5px">Annonce</span>
                      </div>
                      <span style="font-size:10px; color:var(--text-muted)"><i class="ti ti-calendar"></i> Aujourd'hui</span>
                    </div>

                    <h3 style="font-size:19px; font-weight:800; color:var(--text-primary); margin:0 0 16px 0; line-height:1.35">{{ d.title.replace('📢 Announcement: ', '').replace('📢 ', '') }}</h3>
                    
                    <div class="modal-html-content" style="font-size:13.5px; color:var(--text-secondary); line-height:1.6" [innerHTML]="d.message"></div>
                  </div>
                  
                  <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:24px; border-top:1px solid var(--border-weak); padding-top:16px">
                    @if (d.type === 'confirm') {
                      <button class="btn-s" style="padding: 8px 18px; font-size:12.5px; border-radius:8px" (click)="cancelDialog()">{{ d.cancelText || 'Annuler' }}</button>
                    }
                    <button class="btn-p" style="padding: 8px 18px; font-size:12.5px; border-radius:8px; background:#7E22CE; border-color:#7E22CE; color:white; font-weight:700" (click)="confirmDialog()">{{ d.confirmText || 'Fermer' }}</button>
                  </div>
                </div>
              </div>
            } @else {
              <!-- Standard Dialog Layout -->
              <div class="modal-header" style="margin-bottom:12px; display:flex; align-items:center; gap:10px">
                <i class="ti" [class.ti-circle-check]="d.type === 'success'" [class.ti-info-circle]="d.type === 'info'" [class.ti-alert-circle]="d.type === 'confirm'" [style.color]="d.type === 'success' ? '#10B981' : (d.type === 'confirm' ? '#D97706' : '#4F46E5')" style="font-size:24px"></i>
                <h3 class="modal-title" style="font-size:17px; font-weight:800; color:var(--text-primary); margin:0">{{ d.title }}</h3>
              </div>
              <div class="modal-body" style="display:flex; flex-direction:column; gap:12px; margin-bottom:20px">
                <div class="modal-html-content" style="font-size:13px; color:var(--text-secondary); line-height:1.5" [innerHTML]="d.message"></div>
              </div>
              <div class="modal-actions" style="display:flex; justify-content:flex-end; gap:12px">
                @if (d.type === 'confirm') {
                  <button class="btn-s" style="padding: 6px 16px; font-size:12px; border-radius:6px" [style.background]="d.buttonColors?.cancel || '#FFFFFF'" [style.border-color]="d.buttonColors?.cancel || '#D1D5DB'" [style.color]="d.buttonColors?.cancelTextColor || (d.buttonColors?.cancel ? '#FFFFFF' : '#1F2937')" (click)="cancelDialog()">{{ d.cancelText || 'Cancel' }}</button>
                }
                @if (d.thirdOption) {
                  <button class="btn-s" style="padding: 6px 16px; font-size:12px; border-radius:6px" [style.background]="d.buttonColors?.third || '#FFFFFF'" [style.border-color]="d.buttonColors?.third || '#D1D5DB'" [style.color]="d.buttonColors?.third || '#1F2937'" (click)="thirdOptionDialog()">{{ d.thirdOption.text }}</button>
                }
                <button class="btn-p" style="padding: 6px 16px; font-size:12px; border-radius:6px" [style.background]="d.buttonColors?.confirm || (d.type === 'success' ? '#10B981' : (d.type === 'confirm' ? '#D97706' : '#4F46E5'))" [style.border-color]="d.buttonColors?.confirm || (d.type === 'success' ? '#10B981' : (d.type === 'confirm' ? '#D97706' : '#4F46E5'))" (click)="confirmDialog()">{{ d.confirmText || 'OK' }}</button>
              </div>
            }
          </div>
        </div>
      }

      <!-- PROFILE EDITOR MODAL -->
      @if (isProfileModalOpen()) {
        <div class="modal-overlay" (click)="closeProfileEditor()">
          <div class="modal-card" style="max-width: 480px" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <h3 class="modal-title">Profile Settings</h3>
            </div>
            <div class="modal-body" style="display:flex; flex-direction:column; gap:16px">
              
              <!-- Avatar input -->
              <div class="input-row">
                <label>Avatar Emoji / Initials</label>
                <div style="display:flex; gap:10px; align-items:center">
                  <input type="text" [(ngModel)]="profileAvatar" maxLength="3" style="width:70px; height:42px; text-align:center; font-size:18px; font-weight:700" />
                  <div style="font-size:11px; color:var(--text-muted)">Max 3 characters or an emoji (e.g. 👩‍🏫)</div>
                </div>
              </div>

              <!-- Name input -->
              <div class="input-row">
                <label>Full Name</label>
                <input type="text" [(ngModel)]="profileName" placeholder="Your Name" />
              </div>

              <!-- Description input (only for teachers) -->
              @if (currentUser()?.role === 'teacher') {
                <div class="input-row">
                  <label>Professional Description / Biography</label>
                  <textarea [(ngModel)]="profileDescription" rows="3" placeholder="Tell students about your qualifications, teaching methodology or office hours..." style="width:100%; border:1px solid var(--border); border-radius:6px; padding:10px; font-size:12px; line-height:1.5; background:var(--surface-1); color:var(--text-primary)"></textarea>
                </div>
                <div class="input-row" style="background:#FFF7ED; border:1px solid #FED7AA; padding:12px; border-radius:8px">
                  <label style="color:#C2410C; font-weight:700; display:flex; align-items:center; gap:4px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                    <span>Login Page Settings</span>
                  </label>
                  <label style="display:flex; align-items:center; gap:8px; cursor:pointer; margin-top:6px; font-size:12px; font-weight:600; color:var(--text-primary)">
                    <input type="checkbox" [checked]="hideTeacherLogin()" (change)="toggleHideTeacherLogin()" />
                    <span>Hide Teacher Login tabs on login page</span>
                  </label>
                  <div style="font-size:10px; color:#6B7280; margin-top:4px; line-height:1.4">
                    When checked, students will only see "Student Login". Teachers can show it again via this settings.
                  </div>
                </div>

                <!-- Database Actions (Accidental-proof) -->
                <div class="input-row" style="background:#FEF2F2; border:1px solid #FEE2E2; padding:12px; border-radius:8px; margin-top:8px">
                  <label style="color:#DC2626; font-weight:700; display:flex; align-items:center; gap:4px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <span>{{ t('Administration Base de Données', 'Database Maintenance') }}</span>
                  </label>
                  <p style="font-size:10px; color:#991B1B; margin:4px 0 8px 0; line-height:1.4">
                    {{ t('Attention: Cette action effacera toutes les modifications locales (cours, élèves, exercices) et réinitialisera la base de données.', 'Warning: This action will erase all local modifications (lessons, students, exercises) and reset the database.') }}
                  </p>
                  <button class="btn-s" style="border-color:#EF4444; color:#EF4444; background:white; font-size:11px; padding:6px 12px; font-weight:700; width:100%; display:flex; align-items:center; justify-content:center; gap:4px; cursor:pointer" (click)="resetDB(); closeProfileEditor()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                    {{ t('Réinitialiser la Base de Données', 'Reset Database') }}
                  </button>
                </div>
              }

            </div>
            <div class="modal-actions" style="border-top:1px solid var(--border-weak); padding-top:12px; margin-top:12px">
            <button class="btn-s" (click)="closeProfileEditor()">Cancel</button>
              <button class="btn-p" (click)="saveProfileSettings()">Save Settings</button>
            </div>
          </div>
        </div>
      }



      <!-- FLOATING HELP GUIDE TRIGGER BUTTON -->
      <div style="position:fixed; bottom:20px; right:20px; z-index:999; display:flex; align-items:center; gap:8px">
        <button (click)="openHelpGuide()" 
                style="width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); border:none; color:white; font-size:22px; cursor:pointer; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 30px rgba(79,70,229,0.35); transition:all 0.3s ease; border:2px solid rgba(255,255,255,0.15)"
                onmouseover="this.style.transform = 'scale(1.08) translateY(-3px)'; this.style.boxShadow = '0 12px 35px rgba(79,70,229,0.45)'"
                onmouseout="this.style.transform = 'scale(1) translateY(0)'; this.style.boxShadow = '0 8px 30px rgba(79,70,229,0.35)'"
                title="Guide d'utilisation / Tutorial Guide">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
        </button>
      </div>

      <!-- ONBOARDING GUIDE MODAL OVERLAY -->
      @if (showHelpGuide()) {
        <div class="modal-overlay" style="z-index:10000; background:rgba(15, 23, 42, 0.6); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center" (click)="showHelpGuide.set(false)">
          <div class="modal-card" style="width:100%; max-width:850px; background:#FFF; border-radius:16px; padding:0; overflow:hidden; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); border:1px solid rgba(226,232,240,0.8); display:flex; flex-direction:column; max-height:90vh; animation: scaleUp 0.25s ease-out" (click)="$event.stopPropagation()">
            
            <!-- Header banner with logo -->
            <div style="background:linear-gradient(135deg, #1E1B4B 0%, #311042 100%); padding:24px 28px; color:white; position:relative; display:flex; justify-content:space-between; align-items:center">
              <div>
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px">
                  <span style="background:rgba(255,255,255,0.15); font-size:13px; padding:4px 12px; border-radius:30px; font-weight:800; border:1px solid rgba(255,255,255,0.2); display:inline-flex; align-items:center; gap:6px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                    Guide & Tutoriel
                  </span>
                  <span style="font-size:11px; background:#10B981; color:white; padding:2px 8px; border-radius:20px; font-weight:700">Nouveau</span>
                </div>
                <h2 style="font-size:20px; font-weight:800; margin:0; color:#F8FAFC">Bienvenue sur la plateforme SpeakUp !</h2>
                <p style="font-size:12.5px; color:#C7D2FE; margin:4px 0 0 0">Découvrez comment utiliser au mieux votre plateforme interactive.</p>
              </div>
              <button (click)="showHelpGuide.set(false)" style="background:rgba(255,255,255,0.1); border:none; color:white; width:36px; height:36px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">
                <i class="ti ti-x" style="font-size:18px"></i>
              </button>
            </div>

            <!-- Tab Row -->
            <div style="display:flex; background:#F8FAFC; border-bottom:1px solid #E2E8F0; padding:0 24px">
              <button (click)="helpGuideTab.set('welcome')" [style.border-bottom]="helpGuideTab() === 'welcome' ? '3px solid #4F46E5' : '3px solid transparent'" [style.color]="helpGuideTab() === 'welcome' ? '#4F46E5' : '#64748B'" style="padding:14px 20px; font-weight:700; font-size:13px; background:none; border:none; cursor:pointer; transition:all 0.15s; display:inline-flex; align-items:center">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                Bienvenue
              </button>
              <button (click)="helpGuideTab.set('student')" [style.border-bottom]="helpGuideTab() === 'student' ? '3px solid #4F46E5' : '3px solid transparent'" [style.color]="helpGuideTab() === 'student' ? '#4F46E5' : '#64748B'" style="padding:14px 20px; font-weight:700; font-size:13px; background:none; border:none; cursor:pointer; transition:all 0.15s; display:inline-flex; align-items:center">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                Guide Étudiant
              </button>
              <button (click)="helpGuideTab.set('teacher')" [style.border-bottom]="helpGuideTab() === 'teacher' ? '3px solid #4F46E5' : '3px solid transparent'" [style.color]="helpGuideTab() === 'teacher' ? '#4F46E5' : '#64748B'" style="padding:14px 20px; font-weight:700; font-size:13px; background:none; border:none; cursor:pointer; transition:all 0.15s; display:inline-flex; align-items:center">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><path d="M12 22v-4"/><path d="m17 18-5 4-5-4"/><path d="M2 10h20"/><path d="M20 18H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2z"/></svg>
                Guide Enseignant
              </button>
              <button (click)="helpGuideTab.set('homework')" [style.border-bottom]="helpGuideTab() === 'homework' ? '3px solid #4F46E5' : '3px solid transparent'" [style.color]="helpGuideTab() === 'homework' ? '#4F46E5' : '#64748B'" style="padding:14px 20px; font-weight:700; font-size:13px; background:none; border:none; cursor:pointer; transition:all 0.15s; display:inline-flex; align-items:center">
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                Focus Devoirs & Corrections
              </button>
            </div>

            <!-- Content Area (Scrollable) -->
            <div style="flex:1; overflow-y:auto; padding:28px 32px; background:#FFF; box-sizing:border-box">
              
              <!-- Tab 1: Bienvenue -->
              @if (helpGuideTab() === 'welcome') {
                <div style="display:flex; flex-direction:column; gap:20px">
                  <div style="display:grid; grid-template-columns: 1fr 1.2fr; gap:24px; align-items:center">
                    <div style="text-align:center; padding:16px; background:#EEF2FF; border-radius:12px; border:1px dashed #C7D2FE; display:flex; flex-direction:column; align-items:center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:12px"><path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5M14 2 2 14M9 15l-3 3M15 9l-3 3M13 3l8 8-2 2-8-8z"/><path d="M9 15c-1.5-1.5-2.5-3.5-2.5-3.5s2.25 1 3.5 2.5"/><path d="m19 5-4-4"/></svg>
                      <h4 style="font-size:16px; font-weight:800; color:#1E3A8A; margin:0">Décollage immédiat</h4>
                      <p style="font-size:11.5px; color:#4F46E5; margin:6px 0 0 0">SpeakUp simplifie l'apprentissage de l'anglais grâce à des cours interactifs et un suivi intelligent.</p>
                    </div>
                    <div>
                      <h3 style="font-size:18px; font-weight:800; color:#1E293B; margin:0 0 10px 0">Qu'est-ce que SpeakUp ?</h3>
                      <p style="font-size:13.5px; color:#475569; line-height:1.6; margin:0 0 12px 0">
                        SpeakUp est une plateforme tout-en-un conçue pour rapprocher les élèves et les enseignants. Elle combine des outils de visioconférence intégrés (Live), une messagerie en direct, des modules de quiz, des bibliothèques d'Ebooks et des outils de correction avancés.
                      </p>
                      <p style="font-size:13px; font-weight:700; color:#4F46E5; margin:0">
                        👉 Choisissez un onglet ci-dessus pour découvrir les guides détaillés par rôle.
                      </p>
                    </div>
                  </div>
                  
                  <div style="border-top:1px solid #E2E8F0; padding-top:20px">
                    <h4 style="font-size:14px; font-weight:800; color:#1E293B; margin:0 0 12px 0; display:inline-flex; align-items:center; gap:6px">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                      Raccourcis & Astuces Globales :
                    </h4>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px">
                      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:16px">
                        <strong style="font-size:12.5px; color:#1E293B; display:inline-flex; align-items:center; gap:6px; margin-bottom:4px">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                          Traduction instantanée
                        </strong>
                        <p style="font-size:11.5px; color:#64748B; margin:4px 0 0 0; line-height:1.4">Basculez à tout moment la langue de la plateforme entre Français (FR) et Anglais (EN) via les boutons du menu haut.</p>
                      </div>
                      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:16px">
                        <strong style="font-size:12.5px; color:#1E293B; display:inline-flex; align-items:center; gap:6px; margin-bottom:4px">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                          Alertes en direct
                        </strong>
                        <p style="font-size:11.5px; color:#64748B; margin:4px 0 0 0; line-height:1.4">Cliquez sur la cloche de notification pour accéder instantanément aux derniers cours planifiés ou devoirs corrigés.</p>
                      </div>
                    </div>
                  </div>
                </div>
              }

              <!-- Tab 2: Guide Étudiant -->
              @if (helpGuideTab() === 'student') {
                <div style="display:flex; flex-direction:column; gap:20px">
                  <h3 style="font-size:16px; font-weight:800; color:#1E293B; margin:0">🎓 Guide pour l'Étudiant</h3>
                  
                  <div style="display:flex; flex-direction:column; gap:16px">
                    <div style="display:flex; gap:14px; align-items:flex-start">
                      <div style="width:32px; height:32px; border-radius:50%; background:#ECFDF5; color:#059669; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5v-15z"/></svg>
                      </div>
                      <div>
                        <strong style="font-size:13.5px; color:#1E293B">1. Suivre les Cours & Devoirs</strong>
                        <p style="font-size:12px; color:#64748B; margin:4px 0 0 0; line-height:1.5">Consultez l'onglet **Cours & Leçons** pour lire vos leçons quotidiennes. En bas de chaque leçon, faites vos exercices et devoirs (par texte, audio ou vidéo) et cliquez sur Soumettre.</p>
                      </div>
                    </div>

                    <div style="display:flex; gap:14px; align-items:flex-start">
                      <div style="width:32px; height:32px; border-radius:50%; background:#ECFDF5; color:#059669; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><rect x="2" y="6" width="20" height="12" rx="3"/></svg>
                      </div>
                      <div>
                        <strong style="font-size:13.5px; color:#1E293B">2. S'exercer de manière ludique</strong>
                        <p style="font-size:12px; color:#64748B; margin:4px 0 0 0; line-height:1.5">Allez dans **Jeux & Exercices** pour vous entraîner avec les différents types d'activités (Expression Orale, Écriture, Traduction, Prononciation, Quiz chronométrés).</p>
                      </div>
                    </div>

                    <div style="display:flex; gap:14px; align-items:flex-start">
                      <div style="width:32px; height:32px; border-radius:50%; background:#ECFDF5; color:#059669; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect x="2" y="6" width="14" height="12" rx="2" ry="2"/></svg>
                      </div>
                      <div>
                        <strong style="font-size:13.5px; color:#1E293B">3. Rejoindre un cours en direct</strong>
                        <p style="font-size:12px; color:#64748B; margin:4px 0 0 0; line-height:1.5">Quand votre professeur démarre un cours en direct, une notification ainsi qu'une **bannière flottante violette** apparaissent. Cliquez sur "Rejoindre" pour participer instantanément à la réunion Jitsi-Meet intégrée.</p>
                      </div>
                    </div>

                    <div style="display:flex; gap:14px; align-items:flex-start">
                      <div style="width:32px; height:32px; border-radius:50%; background:#ECFDF5; color:#059669; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/><path d="M12 2a6 6 0 0 1 6 6c0 3.3-2 6-6 6s-6-2.7-6-6a6 6 0 0 1 6-6Z"/></svg>
                      </div>
                      <div>
                        <strong style="font-size:13.5px; color:#1E293B">4. Gagner des XP & Progresser</strong>
                        <p style="font-size:12px; color:#64748B; margin:4px 0 0 0; line-height:1.5">Chaque quiz et exercice résolu vous rapporte des points d'expérience (XP). Suivez votre progression dans le **Tableau de bord** ou comparez-vous avec vos camarades dans le **Classement (XP)**.</p>
                      </div>
                    </div>
                  </div>
                </div>
              }

              <!-- Tab 3: Guide Enseignant -->
              @if (helpGuideTab() === 'teacher') {
                <div style="display:flex; flex-direction:column; gap:20px">
                  <h3 style="font-size:16px; font-weight:800; color:#1E293B; margin:0">🏫 Guide pour l'Enseignant</h3>
                  
                  <div style="display:flex; flex-direction:column; gap:16px">
                    <div style="display:flex; gap:14px; align-items:flex-start">
                      <div style="width:32px; height:32px; border-radius:50%; background:#EFF6FF; color:#1D4ED8; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                      </div>
                      <div>
                        <strong style="font-size:13.5px; color:#1E293B">1. Créer des Cours & Devoirs immersifs</strong>
                        <p style="font-size:12px; color:#64748B; margin:4px 0 0 0; line-height:1.5">Utilisez l'éditeur canvas plein écran de l'onglet **Create Lesson** ou **Manage Ebooks** pour concevoir des cours structurés avec des toolbar de formatage riche, des pièces jointes, et des vidéos YouTube associées.</p>
                      </div>
                    </div>

                    <div style="display:flex; gap:14px; align-items:flex-start">
                      <div style="width:32px; height:32px; border-radius:50%; background:#EFF6FF; color:#1D4ED8; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><circle cx="12" cy="14" r="2"/></svg>
                      </div>
                      <div>
                        <strong style="font-size:13.5px; color:#1E293B">2. Planifier des Classes & Gérer les Directs</strong>
                        <p style="font-size:12px; color:#64748B; margin:4px 0 0 0; line-height:1.5">Dans l'onglet **Analytics & Classes**, planifiez des cours en direct. Le système vous alerte automatiquement en cas de conflit d'horaires. Cliquez sur le bouton "Start Live" pour lancer le direct et notifier instantanément tous les élèves.</p>
                      </div>
                    </div>

                    <div style="display:flex; gap:14px; align-items:flex-start">
                      <div style="width:32px; height:32px; border-radius:50%; background:#EFF6FF; color:#1D4ED8; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                      </div>
                      <div>
                        <strong style="font-size:13.5px; color:#1E293B">3. Gérer la Présence & les Résultats</strong>
                        <p style="font-size:12px; color:#64748B; margin:4px 0 0 0; line-height:1.5">Utilisez la **Feuille d'émargement (Attendance Sheet)** pour noter les présences d'un clic, et l'onglet **Students Results** pour analyser le taux de réussite global et individuel de vos élèves.</p>
                      </div>
                    </div>
                  </div>
                </div>
              }

              <!-- Tab 4: Focus Devoirs -->
              @if (helpGuideTab() === 'homework') {
                <div style="display:flex; flex-direction:column; gap:20px">
                  <div style="background:linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); border:1px solid #C7D2FE; border-radius:12px; padding:18px; display:flex; gap:14px; align-items:center; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05)">
                    <div style="width:40px; height:40px; border-radius:10px; background:#4F46E5; display:flex; align-items:center; justify-content:center; color:white; flex-shrink:0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    </div>
                    <div>
                      <h4 style="font-size:14.5px; font-weight:800; color:#1E1B4B; margin:0">Focus : Correction Interactive & Orientations</h4>
                      <p style="font-size:12px; color:#4338CA; margin:4px 0 0 0; line-height:1.4">Découvrez les nouveaux outils haut de gamme intégrés pour annoter et guider le travail de vos élèves en quelques clics.</p>
                    </div>
                  </div>

                  <!-- Simulated Toolbar Widget to show off the tools -->
                  <div style="background:#FFF; border:1px solid #E2E8F0; border-radius:12px; padding:16px; box-shadow:0 2px 8px rgba(0,0,0,0.04)">
                    <div style="font-size:11px; font-weight:800; color:#64748B; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px; display:flex; align-items:center; gap:6px">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                      Outils de correction à votre disposition (Surlignage)
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:10px">
                      
                      <!-- Tool 1: Correct -->
                      <div style="background:#F0FDF4; border:1px solid #DCFCE7; border-radius:8px; padding:10px 12px; display:flex; align-items:center; gap:8px">
                        <div style="width:24px; height:24px; border-radius:50%; background:#22C55E; color:white; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </div>
                        <div>
                          <div style="font-size:12px; font-weight:800; color:#14532D">1. Correct / Très bien</div>
                          <div style="font-size:10.5px; color:#166534; margin-top:2px">Surligne le mot en vert (Félicitations).</div>
                        </div>
                      </div>

                      <!-- Tool 2: Mistake -->
                      <div style="background:#FEF2F2; border:1px solid #FEE2E2; border-radius:8px; padding:10px 12px; display:flex; align-items:center; gap:8px">
                        <div style="width:24px; height:24px; border-radius:50%; background:#EF4444; color:white; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </div>
                        <div>
                          <div style="font-size:12px; font-weight:800; color:#7F1D1D">2. Faute & Remplacement</div>
                          <div style="font-size:10.5px; color:#991B1B; margin-top:2px">Surligne en rouge et affiche la correction.</div>
                        </div>
                      </div>

                      <!-- Tool 3: Orientation -->
                      <div style="background:#EFF6FF; border:1px solid #DBEAFE; border-radius:8px; padding:10px 12px; display:flex; align-items:center; gap:8px">
                        <div style="width:24px; height:24px; border-radius:50%; background:#3B82F6; color:white; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                        </div>
                        <div>
                          <div style="font-size:12px; font-weight:800; color:#1E3A8A">3. Orientation & Conseil</div>
                          <div style="font-size:10.5px; color:#1E40AF; margin-top:2px">Surligne en bleu et intègre des conseils.</div>
                        </div>
                      </div>

                      <!-- Tool 4: Clear -->
                      <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:10px 12px; display:flex; align-items:center; gap:8px">
                        <div style="width:24px; height:24px; border-radius:50%; background:#94A3B8; color:white; display:flex; align-items:center; justify-content:center; flex-shrink:0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </div>
                        <div>
                          <div style="font-size:12px; font-weight:800; color:#334155">4. Effacer le marquage</div>
                          <div style="font-size:10.5px; color:#475569; margin-top:2px">Retire le surlignage du mot sélectionné.</div>
                        </div>
                      </div>

                    </div>
                  </div>

                  <!-- Quick explanations cards -->
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px">
                    <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px">
                      <div style="font-size:12.5px; font-weight:800; color:#0F172A; display:flex; align-items:center; gap:6px; margin-bottom:8px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Comment ça marche ?
                      </div>
                      <p style="font-size:11.5px; color:#475569; margin:0 0 8px 0; line-height:1.5"><strong>Cliquez sur n'importe quel mot</strong> dans la réponse textuelle de l'élève pour faire apparaître la barre d'édition ci-dessus.</p>
                      <p style="font-size:11.5px; color:#475569; margin:0; line-height:1.5">Les annotations de couleur s'enregistrent automatiquement et s'affichent sous forme de fiches d'analyse interactives sur le profil de l'étudiant.</p>
                    </div>

                    <div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:10px; padding:14px">
                      <div style="font-size:12.5px; font-weight:800; color:#0F172A; display:flex; align-items:center; gap:6px; margin-bottom:8px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                        Outils de productivité
                      </div>
                      <ul style="font-size:11px; color:#475569; padding-left:14px; margin:0; line-height:1.6">
                        <li><strong>Aérer / Formater</strong> : Insère des retours à la ligne intelligents pour structurer les réponses de l'élève.</li>
                        <li><strong>Repères Temporels (Timestamps)</strong> : Insérez un tag <code>📍 [Audio à 0:12]</code> d'un clic pour pointer la prononciation précise.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              }

            </div>

            <!-- Footer actions -->
            <div style="background:#F8FAFC; border-top:1px solid #E2E8F0; padding:16px 24px; display:flex; justify-content:space-between; align-items:center">
              <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:12px; color:#64748B">
                <input type="checkbox" [checked]="dontShowAgain()" (change)="toggleDontShowAgainPreference($event)" />
                <span>Ne plus afficher automatiquement au démarrage</span>
              </label>
              
              <button class="btn-p" (click)="showHelpGuide.set(false)" style="padding:8px 20px; border-radius:8px; cursor:pointer; font-weight:700">
                J'ai compris !
              </button>
            </div>

          </div>
        </div>
      }

      <!-- GLOBAL JITSI MEET fullscreen OVERLAY -->
      @if (activeJitsiCall(); as call) {
        <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#0B0F19; z-index:9999; display:flex; flex-direction:column">
          <!-- Jitsi Header with controls -->
          <div style="background:#111827; padding:12px 24px; border-bottom:1px solid #1F2937; display:flex; justify-content:space-between; align-items:center; color:white">
            <div style="display:flex; align-items:center; gap:8px">
              <span style="width:10px; height:10px; border-radius:50%; background:#EF4444; animation: pulse-live 1.5s infinite"></span>
              <span style="font-weight:700; font-size:14px">{{ call.title }} — Live Room</span>
            </div>
            <div style="display:flex; gap:8px">
              @if (currentUser()?.role === 'teacher' || call.group === 'AI-Practice' || call.title.startsWith('Live Call') || call.group !== 'All Students') {
                <button class="btn-s" style="background:#EF4444; border-color:#EF4444; color:white; font-size:11px; padding:6px 12px; border-radius:6px; font-weight:700" (click)="endLiveCall()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:4px"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3A19.5 19.5 0 0 1 4.54 10.6 19.79 19.79 0 0 1 1.54 2 2 2 0 0 1 3.52 0h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.5 7.91a16 16 0 0 0 3.18 5.4Z"/><line x1="23" y1="1" x2="1" y2="23"/></svg>
                  <span>End Call for All</span>
                </button>
              } @else {
                <button class="btn-s" style="border-color:#374151; color:#9CA3AF; font-size:11px; padding:6px 12px; border-radius:6px; font-weight:700" (click)="exitLiveCall()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:4px"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  <span>Exit Call</span>
                </button>
              }
            </div>
          </div>
          <!-- Jitsi Meet Component viewport -->
          <div style="flex:1; background:#000; position:relative; overflow:hidden; display:flex; flex-direction:column; min-height:0">
            <app-jitsi-meet
              [classId]="call.id"
              [roomName]="call.jitsiRoom"
              [isTeacher]="currentUser()?.role === 'teacher'"
              [userName]="currentUser()?.name || 'User'"
              [userEmail]="currentUser()?.role === 'teacher' ? 'teacher@speakup.com' : 'student@speakup.com'"
              (onMeetingLeave)="exitLiveCall()"
              (onMeetingEnd)="endLiveCall()">
            </app-jitsi-meet>
          </div>
        </div>
      }
      </div>
    }
  `,
  styles: [`


    .tester-switcher {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-right: 12px;
      background: #EEF2FF;
      padding: 4px 12px;
      border-radius: 20px;
      border: 1px dashed #4F46E5;
      font-size: 11px;
      font-weight: 600;
      color: #3730A3;
    }
    .tester-switcher select {
      border: none;
      background: none;
      font-size: 12px;
      font-weight: 600;
      color: #4F46E5;
      outline: none;
      cursor: pointer;
    }
    
    @keyframes pulse-live {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.85; }
      100% { transform: scale(1); opacity: 1; }
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.4);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease-out;
    }
    .modal-card {
      background: var(--surface-1);
      border: 1px solid var(--border-strong);
      border-radius: 10px;
      width: 95%;
      max-width: 500px;
      max-height: 90vh;
      padding: 14px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      animation: scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }
    .modal-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary);
    }
    .modal-body {
      font-size: 11px;
      color: var(--text-secondary);
      line-height: 1.4;
      margin-bottom: 10px;
    }
    .modal-body p {
      margin: 0 0 6px 0;
      font-size: 11px;
      line-height: 1.4;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    
    .modal-html-content {
      line-height: 1.4;
      font-size: 11px;
    }
    .modal-html-content img {
      width: 100%;
      height: auto;
      max-height: 350px;
      border-radius: 6px;
      margin: 10px 0;
      object-fit: contain;
      display: block;
    }
    .modal-html-content div {
      margin-bottom: 6px;
    }
    .modal-html-content p {
      margin: 0 0 6px 0;
      font-size: 11px;
      line-height: 1.4;
    }
  `]
})
export class LayoutComponent {
  public db = inject(DatabaseService);
  public dialogService = inject(DialogService);

  // Onboarding Help Guide signals
  showHelpGuide = signal<boolean>(false);
  helpGuideTab = signal<'welcome' | 'student' | 'teacher' | 'homework'>('welcome');
  dontShowAgain = signal<boolean>(false);

  currentUser = signal<UserProfile | null>(null);
  allUsers = signal<UserProfile[]>([]);

  pendingPlacementCount = computed(() => {
    return this.allUsers().filter(u => u.placementTestTaken === true && (u.role === 'student' || u.role === 'guest')).length;
  });

  pendingCoachingCount = computed(() => {
    return this.allUsers().filter(u => u.role === 'student' && u.privateCoachingRequested === true && u.isPrivateCoaching !== true).length;
  });

  mustTakePlacementTest = computed(() => {
    return false;
  });

  activeTab = localStorage.getItem('speak_active_tab') || 'dashboard';
  pageTitle = 'Dashboard';
  isSidebarOpen = signal<boolean>(false);

  showBoutique = signal<boolean>(false);
  showGarden = signal<boolean>(false);
  showJourney = signal<boolean>(false);
  showThemes = signal<boolean>(false);

  // Badge notification clearing states
  lastLessonsView = signal<string>(localStorage.getItem('speak_last_lessons_view') || '');
  lastQuizzesView = signal<string>(localStorage.getItem('speak_last_quizzes_view') || '');
  lastExercisesView = signal<string>(localStorage.getItem('speak_last_exercises_view') || '');
  showExamNewBadge = signal<boolean>(localStorage.getItem('speak_seen_exam_mode') !== 'true');
  showResultsNewBadge = signal<boolean>(localStorage.getItem('speak_seen_results') !== 'true');

  // Badges stats
  lessonsCount = signal<number>(0);
  pendingHomeworkCount = signal<number>(0);
  activeClassAvailable = signal<boolean>(false);
  unreadAnnouncementsCount = signal<number>(0);
  chatUnreadCount = signal<number>(0);

  // "Seen" badges - disappear after first visit
  examModeIsNew = signal<boolean>(localStorage.getItem('speak_exam_visited') !== 'true');
  newLessonsCount = signal<number>(0);
  newQuizzesCount = signal<number>(0);
  newExercisesCount = signal<number>(0);

  // Toasts state
  toasts = signal<{
    id: string;
    title: string;
    message: string;
    type: 'success' | 'info' | 'live';
    icon: string;
    action?: () => void;
    actionText?: string;
  }[]>([]);

  private lastSubmissions: Submission[] | null = null;
  private lastActiveClassId: string | null = null;
  activeJitsiCall = signal<LiveClass | null>(null);
  activeIceBreakerSession = signal<boolean>(false);
  activeTheme = signal<string>(localStorage.getItem('speak_active_theme') || 'default');
  isThemeMenuOpen = signal<boolean>(false);

  activeLang = this.db.activeLang;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

  constructor() {
    effect(() => {
      // Trigger effect when activeLang changes
      const lang = this.activeLang();
      this.pageTitle = this.getTabTitle(this.activeTab);
    });

    effect(() => {
      // Listen to requestedTabRedirect signal
      const tab = this.db.requestedTabRedirect();
      if (tab) {
        this.setTab(tab);
        this.db.requestedTabRedirect.set(null); // Reset redirect signal
      }
    });

    combineLatest([
      this.db.observeActiveIceBreaker(),
      this.db.observeCurrentUser()
    ]).subscribe(([game, user]) => {
      this.activeIceBreakerSession.set(!!game);
      if (game && user && (user.role === 'student' || user.role === 'guest')) {
        if (this.activeTab !== 'ice-breaker') {
          this.toasts.update(current => current.filter(t => t.title !== this.t('🎮 Activité Ice Breaker !', '🎮 Live Ice Breaker!') && t.title !== '🎮 Activité Ice Breaker !' && t.title !== '🎮 Live Ice Breaker!'));
          this.showToast({
            title: this.t('🎮 Activité Ice Breaker !', '🎮 Live Ice Breaker!'),
            message: game.type === 'wheel' 
              ? this.t('Le professeur a lancé la Roue des Noms. Rejoins vite pour le tirage !', 'Teacher started Wheel of Names. Join now!') 
              : game.type === 'buzz'
              ? this.t('Question Buzz en direct : "' + (game.buzzState?.question || '') + '". Viens répondre !', 'Live Trivia: "' + (game.buzzState?.question || '') + '". Come answer!')
              : this.t('Défi oral en direct : "' + (game.missionState?.title || '') + '". Enregistre ton vocal !', 'Live spoken challenge: "' + (game.missionState?.title || '') + '". Record your voice!'),
            type: 'live',
            icon: 'ti-rotate',
            action: () => {
              this.setTab('ice-breaker');
            },
            actionText: this.t('Rejoindre', 'Join Game')
          });
        }
      }
    });
    this.db.observeActiveJitsiCall().subscribe(c => {
      if (c && c.googleMeetUrl) {
        window.open(c.googleMeetUrl, '_blank');
        this.db.setActiveJitsiCall(null);
        return;
      }
      this.activeJitsiCall.set(c);
    });

    window.addEventListener('join-live-call', (event: any) => {
      const liveClass = event.detail.liveClass;
      if (liveClass) {
        this.joinLiveCall(liveClass);
        this.setTab('live-classes');
      }
    });

    this.db.observeCurrentUser().subscribe(user => {
      // Clear last known state on user change to prevent toast duplicate triggers
      this.lastSubmissions = null;
      this.lastActiveClassId = null;
      this.toasts.set([]);

      if (user) {
        if (user.blocked && user.role !== 'student') {
          this.dialogService.alert('Compte Suspendu 🚫', 'Votre accès a été révoqué par le professeur. Vous allez être déconnecté.', 'info');
          this.db.logout();
          return;
        }
        this.currentUser.set(user);
        if (user.role === 'student' && user.blocked) {
          this.setTab('exercises');
        }
        // Sync active tab for roles
        if (user.role === 'teacher' && ['dashboard', 'lessons', 'speaking', 'exercises', 'quizzes', 'events', 'live-classes', 'admin-management', 'history', 'exam'].includes(this.activeTab)) {
          this.setTab('overview');
        } else if ((user.role === 'student' || user.role === 'guest') && ['overview', 'students', 'create-lesson', 'create-quiz', 'exercises-manager', 'grade-homework', 'attendance', 'schedule-class', 'payments', 'teacher-events', 'user-management', 'admin-management', 'results'].includes(this.activeTab)) {
          this.setTab('dashboard');
        } else if (user.role === 'admin' && ['dashboard', 'lessons', 'speaking', 'exercises', 'quizzes', 'events', 'live-classes', 'overview', 'students', 'create-lesson', 'create-quiz', 'exercises-manager', 'grade-homework', 'attendance', 'schedule-class', 'payments', 'teacher-events', 'user-management', 'history', 'exam', 'results'].includes(this.activeTab)) {
          this.setTab('admin-management');
        }
      }
    });

    this.db.observeUsers().subscribe(list => {
      this.allUsers.set(list);
    });

    this.db.observeLessons().subscribe(list => {
      const activeLessons = list.filter(l => l.status !== 'draft');
      const lastViewStr = this.lastLessonsView();
      if (!lastViewStr) {
        this.lessonsCount.set(activeLessons.length);
        this.newLessonsCount.set(activeLessons.length);
      } else {
        const lastViewTime = new Date(lastViewStr).getTime();
        const newLessons = activeLessons.filter(l => new Date(l.createdAt).getTime() > lastViewTime);
        this.lessonsCount.set(newLessons.length);
        this.newLessonsCount.set(newLessons.length);
      }
    });

    this.db.observeQuizzes().subscribe(list => {
      const activeQuizzes = list.filter(q => q.status !== 'draft');
      const lastViewStr = this.lastQuizzesView();
      if (!lastViewStr) {
        this.newQuizzesCount.set(activeQuizzes.length);
      } else {
        const lastViewTime = new Date(lastViewStr).getTime();
        const newItems = activeQuizzes.filter(q => {
          const raw = q as any;
          const dateVal = raw.createdAt || raw.createdAtDate;
          if (dateVal) {
            return new Date(dateVal).getTime() > lastViewTime;
          }
          const parts = q.id.split('-');
          const timestamp = Number(parts[parts.length - 1]);
          return !isNaN(timestamp) && timestamp > lastViewTime;
        });
        this.newQuizzesCount.set(newItems.length);
      }
    });

    this.db.observeExercises().subscribe(list => {
      const activeExercises = list.filter(ex => (ex as any).status !== 'draft');
      const lastViewStr = this.lastExercisesView();
      if (!lastViewStr) {
        this.newExercisesCount.set(activeExercises.length);
      } else {
        const lastViewTime = new Date(lastViewStr).getTime();
        const newItems = activeExercises.filter(ex => new Date(ex.createdAt || '').getTime() > lastViewTime);
        this.newExercisesCount.set(newItems.length);
      }
    });

    this.db.observeShowBoutique().subscribe(val => {
      this.showBoutique.set(val);
    });

    this.db.observeShowGarden().subscribe(val => {
      this.showGarden.set(val);
    });

    this.db.observeShowJourney().subscribe(val => {
      this.showJourney.set(val);
    });

    this.db.observeShowThemes().subscribe(val => {
      this.showThemes.set(val);
    });

    this.db.observeAnnouncements().subscribe(list => {
      const user = this.currentUser();
      if (!user || user.role !== 'student') {
        this.unreadAnnouncementsCount.set(0);
        return;
      }

      // Calculate unread announcements count
      const unreadFiltered = list.filter(ann =>
        (ann.sendTo === 'all' ||
          ann.sendTo === 'All students' ||
          ann.sendTo === user.level ||
          ann.sendTo === `${user.level} class only` ||
          ann.sendTo.toLowerCase().includes(user.level.toLowerCase())) &&
        !ann.readBy.includes(user.id)
      );
      this.unreadAnnouncementsCount.set(unreadFiltered.length);

      // Find any unread announcement targeting this student to trigger popup modal
      const unread = unreadFiltered[0];
      if (unread) {
        const priorityColor = unread.priority === 'Urgent' ? '#EF4444' : (unread.priority === 'Important' ? '#F59E0B' : '#4F46E5');
        const priorityBg = unread.priority === 'Urgent' ? '#FEE2E2' : (unread.priority === 'Important' ? '#FEF3C7' : '#E0E7FF');
        const priorityIcon = unread.priority === 'Urgent' ? '🔴' : (unread.priority === 'Important' ? '🟡' : '🔵');

        const content = `
          <div style="padding:4px 0">
            <div style="background:${priorityBg}; border-left:4px solid ${priorityColor}; padding:12px 16px; border-radius:8px; margin-bottom:16px">
              <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px">
                <span style="font-size:18px">${priorityIcon}</span>
                <span style="font-size:12px; font-weight:700; color:${priorityColor}; text-transform:uppercase; letter-spacing:0.5px">${unread.priority}</span>
              </div>
              <div style="font-size:11px; color:var(--text-muted)">📋 Sent to: <strong>${unread.sendTo}</strong></div>
            </div>
            
            <div style="background:var(--surface-1); padding:14px 16px; border-radius:8px; border:1px solid var(--border-weak)">
              <p style="font-size:13.5px; color:var(--text-primary); line-height:1.7; margin:0; white-space:pre-wrap">${unread.message}</p>
            </div>
            
            <div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border-weak); text-align:center">
              <span style="font-size:10px; color:var(--text-muted)">📅 Posted on ${new Date(unread.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        `;

        // Pop open a modal alert
        this.dialogService.alert(
          unread.title,
          content,
          'info',
          () => {
            this.db.markAnnouncementAsRead(unread.id, user.id);
          },
          unread.imageUrl
        );
      }
    });

    this.db.observeSubmissions().subscribe(list => {
      this.pendingHomeworkCount.set(list.filter(s => !s.graded).length);

      // Check if student profile matches and a submission just got graded
      const user = this.currentUser();
      if (user && user.role === 'student') {
        const mySubmissions = list.filter(s => s.studentId === user.id);
        if (this.lastSubmissions) {
          mySubmissions.forEach(sub => {
            const oldSub = this.lastSubmissions!.find(s => s.id === sub.id);
            if (oldSub && !oldSub.graded && sub.graded) {
              // Homework was graded! Show success modal!
              this.dialogService.alert(
                'Devoir corrigé ! 📝',
                `Votre devoir pour <strong>${sub.lessonTitle}</strong> a été noté : <strong>${sub.score}</strong>.<br/>+${sub.xpReward || 50} XP remportés !`,
                'success'
              );
            }
          });
        }
        this.lastSubmissions = mySubmissions;
      }
    });

    this.db.observeSchedules().subscribe(list => {
      this.activeClassAvailable.set(list.some(c => c.status === 'active'));

      // Check if a class just became live (active)
      const user = this.currentUser();
      if (user && user.role === 'student') {
        const activeClass = list.find(c => c.status === 'active');
        if (activeClass && (!this.lastActiveClassId || this.lastActiveClassId !== activeClass.id)) {
          // A new class just went live! Show live modal!
          this.dialogService.confirm(
            'Cours en direct commencé ! 🎥',
            `Le cours "${activeClass.title}" a commencé. Voulez-vous rejoindre la classe virtuelle maintenant ?`,
            () => {
              this.setTab('live-classes');
              this.db.setActiveJitsiCall(activeClass);
            }
          );
        }
        this.lastActiveClassId = activeClass ? activeClass.id : null;
      }
    });

    // Periodically check for scheduled live classes that are starting now (every 30 seconds)
    setInterval(() => {
      const user = this.currentUser();
      if (user && user.role === 'student') {
        const list = this.db.getSchedulesValue();
        const now = new Date();
        
        list.forEach(c => {
          if (c.status === 'waiting') {
            try {
              const scheduledDateTime = new Date(`${c.date}T${c.time}:00`);
              const diffMs = now.getTime() - scheduledDateTime.getTime();
              
              // If the current time is between 5 minutes before and 15 minutes after the scheduled start time
              if (diffMs >= -5 * 60 * 1000 && diffMs <= 15 * 60 * 1000) {
                const notifiedKey = `notified_live_${c.id}`;
                if (!sessionStorage.getItem(notifiedKey)) {
                  sessionStorage.setItem(notifiedKey, 'true');
                  
                  this.dialogService.confirm(
                    this.t('Le cours en direct commence ! 🎥', 'Live class is starting! 🎥'),
                    this.t(
                      `Le cours "${c.title}" est programmé pour maintenant (${c.time}). Voulez-vous rejoindre le cours live ?`,
                      `The class "${c.title}" is scheduled for now (${c.time}). Would you like to join the live session?`
                    ),
                    () => {
                      this.setTab('live-classes');
                      this.db.setActiveJitsiCall(c);
                    }
                  );
                }
              }
            } catch (e) {
              console.warn('Error parsing scheduled date:', e);
            }
          }
        });
      }
    }, 30000);

    this.db.observeRewards().subscribe(list => {
      const user = this.currentUser();
      if (!user) return;

      const unacknowledgedReward = list.find(r => r.assignedTo === user.id && !r.acknowledged);
      if (unacknowledgedReward) {
        this.db.updateReward(unacknowledgedReward.id, { acknowledged: true });
        this.dialogService.alert(
          '🏆 Félicitations !',
          `Vous avez remporté la récompense : "${unacknowledgedReward.title}" !\n\n${unacknowledgedReward.description}\n\nContinuez à accumuler des points XP pour remporter d'autres prix !`,
          'success'
        );
      }
    });

    const storedPref = localStorage.getItem('speakup_hide_guide');
    if (storedPref === 'true') {
      this.dontShowAgain.set(true);
    } else {
      setTimeout(() => this.showHelpGuide.set(true), 1500);
    }
  }

  openHelpGuide() {
    this.helpGuideTab.set('welcome');
    this.showHelpGuide.set(true);
  }

  toggleDontShowAgainPreference(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.dontShowAgain.set(checked);
    if (checked) {
      localStorage.setItem('speakup_hide_guide', 'true');
    } else {
      localStorage.removeItem('speakup_hide_guide');
    }
  }

  selectTheme(theme: string) {
    this.activeTheme.set(theme);
    localStorage.setItem('speak_active_theme', theme);
    this.applyTheme(theme);
    this.isThemeMenuOpen.set(false);
  }

  applyTheme(theme: string) {
    document.body.classList.remove('theme-dark', 'theme-manga', 'theme-rose', 'theme-faith');
    if (theme !== 'default') {
      document.body.classList.add('theme-' + theme);
    }
  }

  setTab(tabName: string) {
    if (this.mustTakePlacementTest() && tabName !== 'exercises' && tabName !== 'profile' && tabName !== 'live-classes') {
      tabName = 'exercises';
    }

    if (tabName === 'chat-teacher') {
      this.activeTab = 'chat';
      localStorage.setItem('speak_active_tab', 'chat');
      this.pageTitle = this.getTabTitle('chat');
      this.isSidebarOpen.set(false);
      this.chatUnreadCount.set(0);
      
      // Dispatch event to trigger startConversationWithTeacher
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('trigger-teacher-dm'));
      }, 200);
      return;
    }
    this.activeTab = tabName;
    localStorage.setItem('speak_active_tab', tabName);
    this.pageTitle = this.getTabTitle(tabName);
    this.isSidebarOpen.set(false);
    // Clear chat unread count when switching to chat
    if (tabName === 'chat') {
      this.chatUnreadCount.set(0);
    }

    // Clear "new lessons" badge after visiting lessons tab
    if (tabName === 'lessons') {
      const nowStr = new Date().toISOString();
      localStorage.setItem('speak_lessons_visited_at', nowStr);
      localStorage.setItem('speak_last_lessons_view', nowStr);
      this.lastLessonsView.set(nowStr);
      this.newLessonsCount.set(0);
      this.lessonsCount.set(0);
    }

    // Clear "new quizzes" badge after visiting quizzes tab
    if (tabName === 'quizzes') {
      const nowStr = new Date().toISOString();
      localStorage.setItem('speak_last_quizzes_view', nowStr);
      this.lastQuizzesView.set(nowStr);
      this.newQuizzesCount.set(0);
    }

    // Clear "new exercises" badge after visiting exercises tab
    if (tabName === 'exercises') {
      const nowStr = new Date().toISOString();
      localStorage.setItem('speak_last_exercises_view', nowStr);
      this.lastExercisesView.set(nowStr);
      this.newExercisesCount.set(0);
    }

    // Clear "NEW" badge on Exam Mode after first visit
    if (tabName === 'exam') {
      localStorage.setItem('speak_exam_visited', 'true');
      localStorage.setItem('speak_seen_exam_mode', 'true');
      this.examModeIsNew.set(false);
      this.showExamNewBadge.set(false);
    }

    if (tabName === 'results') {
      localStorage.setItem('speak_seen_results', 'true');
      this.showResultsNewBadge.set(false);
    }

    // Clear notifications corresponding to lessons and exams when visiting these tabs
    const user = this.currentUser();
    if (user) {
      const userNotifs = this.db.getNotificationsForUser(user.id, user.role);
      userNotifs.forEach(n => {
        if (!n.read) {
          if (tabName === 'lessons' && (n.type === 'exercise_assigned' || n.type === 'homework_graded' || n.type === 'grade_updated' || n.type === 'quiz_available')) {
            this.db.markNotificationRead(n.id);
          } else if (tabName === 'exam' && n.type === 'exam_completed') {
            this.db.markNotificationRead(n.id);
          }
        }
      });
    }
  }

  toggleSidebar(open: boolean) {
    this.isSidebarOpen.set(open);
  }

  logOut() {
    localStorage.removeItem('speak_active_tab');
    this.db.logout();
  }

  resetDB() {
    this.dialogService.confirm(
      'Reset Database',
      'Are you sure you want to completely reset the database to a clean slate? This will wipe all lessons, quizzes, events, custom students, and student progress.',
      () => {
        this.db.resetDatabase().then(() => {
          this.dialogService.alert('Success', 'Database successfully reset!', 'success');
        });
      }
    );
  }

  confirmDialog() {
    const d = this.dialogService.activeDialog();
    if (d && d.onConfirm) {
      d.onConfirm();
    }
    this.dialogService.close();
  }

  cancelDialog() {
    const d = this.dialogService.activeDialog();
    if (d && d.onCancel) {
      d.onCancel();
    }
    this.dialogService.close();
  }

  thirdOptionDialog() {
    const d = this.dialogService.activeDialog();
    if (d && d.thirdOption && d.thirdOption.callback) {
      d.thirdOption.callback();
    }
    this.dialogService.close();
  }

  closeDialog() {
    const d = this.dialogService.activeDialog();
    if (d && d.type !== 'confirm') {
      this.dialogService.close();
    }
  }

  showToast(toast: {
    title: string;
    message: string;
    type: 'success' | 'info' | 'live';
    icon: string;
    action?: () => void;
    actionText?: string;
  }) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { id, ...toast };
    this.toasts.update(current => [...current, newToast]);

    // Automatically remove after 7 seconds unless it's a live class invite
    if (toast.type !== 'live') {
      setTimeout(() => {
        this.removeToast(id);
      }, 7000);
    }
  }

  removeToast(id: string) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }

  private getTabTitle(tab: string): string {
    const isEn = this.db.activeLang() === 'en';
    const titles: { [key: string]: { fr: string, en: string } } = {
      dashboard: { fr: 'Tableau de bord', en: 'Dashboard' },
      lessons: { fr: 'Cours & Leçons', en: 'Lessons' },
      speaking: { fr: 'Pratique Orale', en: 'Speaking Practice' },
      quizzes: { fr: 'Quiz & Évaluations', en: 'Quizzes & Tests' },
      exercises: { fr: 'Jeux & Exercices', en: 'Games & Exercises' },
      chat: { fr: 'Chat en Anglais', en: 'English Chat' },
      leaderboard: { fr: 'Classement (XP)', en: 'Leaderboard' },
      events: { fr: 'Événements', en: 'Events' },
      'live-classes': { fr: 'Classes en Direct', en: 'Live Classes' },
      overview: { fr: "Vue d'ensemble", en: 'Overview' },
      students: { fr: 'Mes Élèves', en: 'Students Manager' },
      'create-lesson': { fr: 'Créer un cours', en: 'Create Lesson' },
      'create-quiz': { fr: 'Gérer les Quiz', en: 'Quiz Builder' },
      'exercises-manager': { fr: 'Gérer les Exercices', en: 'Exercises Manager' },
      'grade-homework': { fr: 'Corriger les Devoirs', en: 'Grade Homework' },
      attendance: { fr: 'Feuille de Présences', en: 'Attendance' },
      'schedule-class': { fr: 'Analyses & Classes', en: 'Analytics & Classes' },
      announcements: { fr: 'Annonces Générales', en: 'Announcements' },
      payments: { fr: 'Suivi des Paiements', en: 'Payments' },
      'teacher-events': { fr: 'Événements', en: 'Events Registry' },
      'admin-management': { fr: 'Console Admin', en: 'Admin Control' },
      'user-management': { fr: 'Utilisateurs & Modération', en: 'User Management' },
      dictionary: { fr: 'Dictionnaire', en: 'Dictionary' },
      ebooks: { fr: 'Bibliothèque (Ebooks)', en: 'Ebooks Library' },
      history: { fr: 'Mon Historique', en: 'My History' },
      exam: { fr: 'Mode Examen', en: 'Exam Mode' },
      results: { fr: 'Résultats Élèves', en: 'Students Results' },
      coaching: { fr: 'Accompagnement Privé 🎯', en: 'Private Coaching 🎯' },
      'teacher-coaching': { fr: 'Coaching Privé 👑', en: 'Private Coaching 👑' },
      'wheel-game': { fr: 'Ice Breaker Center 🎮', en: 'Ice Breaker Center 🎮' },
      'ice-breaker': { fr: 'Ice Breaker 🎮', en: 'Ice Breaker 🎮' }
    };
    const val = titles[tab];
    if (val) {
      return isEn ? val.en : val.fr;
    }
    return isEn ? 'Overview' : "Vue d'ensemble";
  }

  isProfileModalOpen = signal<boolean>(false);
  profileName = '';
  profileAvatar = '';
  profileDescription = '';
  hideTeacherLogin = signal<boolean>(localStorage.getItem('speak_hide_teacher_login') === 'true');

  openProfileEditor() {
    const user = this.currentUser();
    if (!user) return;
    this.profileName = user.name;
    this.profileAvatar = user.avatar;
    this.profileDescription = user.description || '';
    this.isProfileModalOpen.set(true);
  }

  closeProfileEditor() {
    this.isProfileModalOpen.set(false);
  }

  toggleHideTeacherLogin() {
    const newState = !this.hideTeacherLogin();
    this.hideTeacherLogin.set(newState);
    localStorage.setItem('speak_hide_teacher_login', newState ? 'true' : 'false');
  }

  async saveProfileSettings() {
    const user = this.currentUser();
    if (!user) return;

    const updatedProfile: Partial<UserProfile> = {
      name: this.profileName,
      avatar: this.profileAvatar
    };

    if (user.role === 'teacher') {
      updatedProfile.description = this.profileDescription;
    }

    try {
      await this.db.updateUserProfile(user.id, updatedProfile);
      this.dialogService.alert('Profile Updated', 'Your profile settings have been successfully saved!', 'success');
      this.isProfileModalOpen.set(false);
    } catch (e: any) {
      this.dialogService.alert('Error', e.message || 'Failed to update profile settings.', 'info');
    }
  }



  joinLiveCall(c: LiveClass) {
    this.db.setActiveJitsiCall(c);
  }

  /** Returns the currently active live class, or null */
  getActiveLiveClass(): any | null {
    const list = this.db.getSchedulesValue();
    return list.find(c => c.status === 'active') || null;
  }

  /** Student presses the persistent banner to join a live class at any time */
  joinActiveLive(liveClass: any) {
    this.setTab('live-classes');
    this.db.setActiveJitsiCall(liveClass);
  }

  exitLiveCall() {
    this.db.setActiveJitsiCall(null);
  }

  async endLiveCall() {
    const c = this.activeJitsiCall();
    if (c) {
      await this.db.updateClassStatus(c.id, 'completed');
    }
    this.db.setActiveJitsiCall(null);
  }

  async triggerInstantLive() {
    // Check if there is an active live class already
    const list = this.db.getSchedulesValue();
    const active = list.find(c => c.status === 'active');
    if (active) {
      this.joinLiveCall(active);
      return;
    }

    this.dialogService.confirm(
      this.t('Activer le cours en direct', 'Start Instant Live Class'),
      this.t('Voulez-vous démarrer un cours en direct instantanément ?', 'Would you like to start a live meeting session instantly?'),
      async () => {
        try {
          const created = await this.db.startInstantLiveClass();
          if (created) {
            this.joinLiveCall(created);
          }
        } catch (e: any) {
          this.dialogService.alert(
            this.t('Échec du démarrage', 'Failed to Start Live'),
            e.message || this.t('Une erreur est survenue lors du lancement de la session.', 'Error occurred starting live session.'),
            'info'
          );
        }
      }
    );
  }
}
