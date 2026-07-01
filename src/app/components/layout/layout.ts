import { Component, inject, signal, effect } from '@angular/core';
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
import { TeacherVocabGamesComponent } from '../teacher/vocab-games';
import { TeacherExercisesManagerComponent } from '../teacher/exercises-manager';
import { AdminManagementComponent } from '../admin/admin-management';
import { NotificationsComponent } from '../shared/notifications';
import { HistoryLogsComponent } from '../shared/history-logs';

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
    TeacherVocabGamesComponent,
    TeacherExercisesManagerComponent,
    AdminManagementComponent,
    NotificationsComponent,
    HistoryLogsComponent
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

      <!-- SIDEBAR -->
      <div class="sidebar">
        <div class="logo">
          <img src="logo.png" style="width:28px; height:28px; object-fit:contain; border-radius:6px" alt="logo">
          <span class="logo-name">SpeakUp</span>
          @if (currentUser()?.role === 'teacher') {
            <span class="logo-role">Teacher</span>
          } @else if (currentUser()?.role === 'admin') {
            <span class="logo-role" style="background:#EF4444; color:white">Admin</span>
          }
        </div>
        
        <div class="nav">
          <!-- STUDENT/GUEST SIDEBAR TABS -->
          @if (currentUser()?.role === 'student' || currentUser()?.role === 'guest') {
            <div class="nav-section">{{ t('Apprendre', 'Learn') }}</div>
            <button class="nav-item" [class.active]="activeTab === 'dashboard'" (click)="setTab('dashboard')">
              <i class="ti ti-layout-dashboard" aria-hidden="true"></i>{{ t('Tableau de bord', 'Dashboard') }}
            </button>
            <button class="nav-item" [class.active]="activeTab === 'lessons'" (click)="setTab('lessons')">
              <i class="ti ti-book" aria-hidden="true"></i>{{ t('Cours & Leçons', 'Lessons') }}
              @if (newLessonsCount() > 0) {
                <span class="badge" style="background:#4F46E5; color:white; margin-left:auto">{{ newLessonsCount() }}</span>
              }
            </button>
            <button class="nav-item" [class.active]="activeTab === 'speaking'" (click)="setTab('speaking')">
              <i class="ti ti-microphone" aria-hidden="true"></i>{{ t('Pratique Orale', 'Speaking') }}
            </button>
            <button class="nav-item" [class.active]="activeTab === 'exercises'" (click)="setTab('exercises')">
              <i class="ti ti-pencil" aria-hidden="true"></i>{{ t('Exercices & Quiz', 'Exercises & Quizzes') }}
            </button>
            <button class="nav-item" [class.active]="activeTab === 'dictionary'" (click)="setTab('dictionary')">
              <i class="ti ti-bookmarks" aria-hidden="true"></i>{{ t('Dictionnaire', 'Dictionary') }}
            </button>
            <button class="nav-item" [class.active]="activeTab === 'ebooks'" (click)="setTab('ebooks')">
              <i class="ti ti-book" aria-hidden="true"></i>{{ t('Bibliothèque (Ebooks)', 'Ebooks Library') }}
            </button>
            
            <div class="nav-section">{{ t('Communauté', 'Community') }}</div>
            <button class="nav-item" [class.active]="activeTab === 'chat'" (click)="setTab('chat')">
              <i class="ti ti-messages" aria-hidden="true"></i>{{ t('Chat en Anglais', 'English Chat') }}
              @if (chatUnreadCount() > 0) {
                <span class="badge" style="background:#EF4444; color:white; margin-left:auto">{{ chatUnreadCount() }}</span>
              }
            </button>
            <button class="nav-item" [class.active]="activeTab === 'leaderboard'" (click)="setTab('leaderboard')">
              <i class="ti ti-trophy" aria-hidden="true"></i>{{ t('Classement (XP)', 'Leaderboard') }}
            </button>
            <button class="nav-item" [class.active]="activeTab === 'events'" (click)="setTab('events')">
              <i class="ti ti-calendar-event" aria-hidden="true"></i>{{ t('Événements', 'Events') }}
            </button>
            <button class="nav-item" [class.active]="activeTab === 'announcements'" (click)="setTab('announcements')">
              <i class="ti ti-volume" aria-hidden="true"></i>{{ t('Annonces', 'Announcements') }}
              @if (unreadAnnouncementsCount() > 0) {
                <span class="badge red" style="background:#EF4444; color:white; margin-left:auto">{{ unreadAnnouncementsCount() }}</span>
              }
            </button>
            
            <div class="nav-section">{{ t('Cours en direct', 'Live Classes') }}</div>
            <button class="nav-item" [class.active]="activeTab === 'live-classes'" (click)="setTab('live-classes')">
              <i class="ti ti-video" aria-hidden="true"></i>{{ t('Classes en Direct', 'Live Classes') }}
              @if (activeClassAvailable()) {
                <span class="badge red" style="background:#EF4444; color:white; animation: pulse-live 1.5s infinite">LIVE</span>
              }
            </button>
            
            <div class="nav-section">{{ t('Progression', 'Progress') }}</div>
            <button class="nav-item" [class.active]="activeTab === 'history'" (click)="setTab('history')">
              <i class="ti ti-history" aria-hidden="true"></i>{{ t('Mon Historique', 'My History') }}
            </button>
            <button class="nav-item" [class.active]="activeTab === 'exam'" (click)="setTab('exam')">
              <i class="ti ti-certificate" aria-hidden="true"></i>{{ t('Mode Examen', 'Exam Mode') }}
              @if (examModeIsNew()) {
                <span class="badge" style="background:#4F46E5; color:white; font-size:9px; margin-left:auto">NEW</span>
              }
            </button>
          } @else if (currentUser()?.role === 'admin') {
            <!-- ADMIN SIDEBAR TABS -->
            <div class="ns">{{ t('Administration', 'Administration') }}</div>
            <button class="ni" [class.active]="activeTab === 'admin-management'" (click)="setTab('admin-management')">
              <i class="ti ti-settings" aria-hidden="true"></i>{{ t('Console Admin', 'Admin Control') }}
            </button>
            <button class="ni" [class.active]="activeTab === 'chat'" (click)="setTab('chat')">
              <i class="ti ti-messages" aria-hidden="true"></i>{{ t('Chat en Anglais', 'English Chat') }}
            </button>
            <button class="ni" [class.active]="activeTab === 'announcements'" (click)="setTab('announcements')">
              <i class="ti ti-speakerphone" aria-hidden="true"></i>{{ t('Annonces', 'Announcements') }}
            </button>
            <button class="ni" [class.active]="activeTab === 'system-history'" (click)="setTab('system-history')">
              <i class="ti ti-history" aria-hidden="true"></i>{{ t('Logs Système', 'System Logs') }}
            </button>
          } @else {
            <!-- TEACHER SIDEBAR TABS -->
            <div class="ns">{{ t('Vue Générale', 'Overview') }}</div>
            <button class="ni" [class.active]="activeTab === 'overview'" (click)="setTab('overview')">
              <i class="ti ti-layout-dashboard" aria-hidden="true"></i>{{ t("Vue d'ensemble", 'Overview') }}
            </button>
            <button class="ni" [class.active]="activeTab === 'chat'" (click)="setTab('chat')">
              <i class="ti ti-messages" aria-hidden="true"></i>{{ t('Chat en Anglais', 'English Chat') }}
            </button>
            <button class="ni" [class.active]="activeTab === 'leaderboard'" (click)="setTab('leaderboard')">
              <i class="ti ti-trophy" aria-hidden="true"></i>{{ t('Classement & Récompenses', 'Leaderboard & Rewards') }}
            </button>
            <button class="ni" [class.active]="activeTab === 'students'" (click)="setTab('students')">
              <i class="ti ti-users" aria-hidden="true"></i>{{ t('Mes Élèves', 'Students') }}
            </button>
            
            <div class="ns">{{ t('Contenus', 'Content') }}</div>
            <button class="ni" [class.active]="activeTab === 'create-lesson'" (click)="setTab('create-lesson')">
              <i class="ti ti-book" aria-hidden="true"></i>{{ t('Créer un cours', 'Create Lesson') }}
            </button>
            <button class="ni" [class.active]="activeTab === 'create-quiz'" (click)="setTab('create-quiz')">
              <i class="ti ti-list-check" aria-hidden="true"></i>{{ t('Gérer les Quiz', 'Quiz Builder') }}
            </button>
            <button class="ni" [class.active]="activeTab === 'exercises-manager'" (click)="setTab('exercises-manager')">
              <i class="ti ti-dumbbell" aria-hidden="true"></i>{{ t('Gérer les Exercices', 'Exercises Manager') }}
            </button>
            <button class="ni" [class.active]="activeTab === 'vocab-games'" (click)="setTab('vocab-games')">
              <i class="ti ti-cards" aria-hidden="true"></i>{{ t('Jeux de Vocabulaire', 'Vocabulary Games') }}
            </button>
            <button class="ni" [class.active]="activeTab === 'grade-homework'" (click)="setTab('grade-homework')">
              <i class="ti ti-writing" aria-hidden="true"></i>{{ t('Corriger les Devoirs', 'Grade Homework') }}
              @if (pendingHomeworkCount() > 0) {
                <span class="badge" style="background:#FEE2E2; color:#DC2626">{{ pendingHomeworkCount() }}</span>
              }
            </button>
            <button class="ni" [class.active]="activeTab === 'results'" (click)="setTab('results')">
              <i class="ti ti-clipboard-data" aria-hidden="true"></i>{{ t('Résultats Élèves', 'Students Results') }}
            </button>
            <button class="ni" [class.active]="activeTab === 'ebooks'" (click)="setTab('ebooks')">
              <i class="ti ti-notebook" aria-hidden="true"></i>{{ t('Gérer les Ebooks', 'Manage Ebooks') }}
            </button>
            
            <div class="ns">{{ t('Classes & Directs', 'Classes & Lives') }}</div>
            <button class="ni" [class.active]="activeTab === 'attendance'" (click)="setTab('attendance')">
              <i class="ti ti-calendar-check" aria-hidden="true"></i>{{ t('Feuille de Présences', 'Attendance Sheet') }}
            </button>
            <button class="ni" [class.active]="activeTab === 'schedule-class'" (click)="setTab('schedule-class')">
              <i class="ti ti-video" aria-hidden="true"></i>{{ t('Planifier un Direct', 'Schedule Class') }}
            </button>
            
            <div class="ns">{{ t('Administration', 'Administration') }}</div>
            <button class="ni" [class.active]="activeTab === 'announcements'" (click)="setTab('announcements')">
              <i class="ti ti-speakerphone" aria-hidden="true"></i>{{ t('Annonces Générales', 'Announcements') }}
            </button>
            <button class="ni" [class.active]="activeTab === 'payments'" (click)="setTab('payments')">
              <i class="ti ti-credit-card" aria-hidden="true"></i>{{ t('Suivi des Paiements', 'Payments Tracker') }}
            </button>
            <button class="ni" [class.active]="activeTab === 'teacher-events'" (click)="setTab('teacher-events')">
              <i class="ti ti-calendar-event" aria-hidden="true"></i>{{ t('Événements', 'Events') }}
            </button>
            <button class="ni" [class.active]="activeTab === 'user-management'" (click)="setTab('user-management')">
              <i class="ti ti-users" aria-hidden="true"></i>{{ t('Utilisateurs & Modération', 'Users & Moderation') }}
            </button>
            <button class="ni" [class.active]="activeTab === 'system-history'" (click)="setTab('system-history')">
              <i class="ti ti-history" aria-hidden="true"></i>{{ t('Logs Système', 'System Logs') }}
            </button>
          }
        </div>
      </div>
      
      <!-- MAIN CONTAINER -->
      <div class="main">
        <!-- TOPBAR -->
        <div class="topbar">
          <!-- Hamburger menu button (Mobile only) -->
          <button class="hamburger-btn" (click)="toggleSidebar(true)">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <span class="topbar-title">{{ pageTitle }}</span>
          
          <!-- Language Switcher Toggle -->
          <div style="display:flex; align-items:center; gap:4px; margin-left:auto; margin-right:12px; background:var(--surface-2); padding:3px; border-radius:12px; border:1px solid var(--border-weak)">
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
          
          <!-- Reset DB Button (Teacher only) -->
          @if (currentUser()?.role === 'teacher') {
            <button class="btn-s hide-mobile" style="font-size: 11px; padding: 4px 12px; border-radius: 20px; display:flex; align-items:center; gap:4px; margin-right: 12px; border-color:#D97706; color:#D97706" (click)="resetDB()">
              <i class="ti ti-refresh" aria-hidden="true"></i> {{ t('Reset DB', 'Reset DB') }}
            </button>
          }

          <!-- Log Out Button -->
          <button class="btn-s" style="font-size: 11px; padding: 4px 12px; border-radius: 20px; display:flex; align-items:center; gap:4px; margin-right: 12px; border-color:#EF4444; color:#EF4444" (click)="logOut()">
            <i class="ti ti-logout" aria-hidden="true"></i> {{ t('Se déconnecter', 'Log Out') }}
          </button>

          <div class="avatar" [style.background]="currentUser()?.role === 'teacher' ? '#3730A3' : '#4F46E5'" style="cursor:pointer; transition: transform 0.2s ease" (click)="openProfileEditor()" [title]="t('Modifier mon profil', 'Edit Profile Settings')">
            {{ currentUser()?.avatar }}
          </div>
        </div>
        
        <!-- CONTENT VIEWPORT -->
        <div class="content">
          <!-- Student/Guest Views -->
          @if (currentUser()?.role === 'student' || currentUser()?.role === 'guest') {
            @if (activeTab === 'dashboard') {
              <app-student-dashboard (navigateToTab)="setTab($event)"></app-student-dashboard>
            } @else if (activeTab === 'lessons') {
              <app-student-lessons></app-student-lessons>
            } @else if (activeTab === 'speaking') {
              <app-student-speaking></app-student-speaking>
            } @else if (activeTab === 'exercises') {
              <app-student-exercises></app-student-exercises>
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
            } @else if (activeTab === 'vocab-games') {
              <app-teacher-vocab-games></app-teacher-vocab-games>
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
              <div style="display:grid; grid-template-columns: 1.15fr 1fr; min-height:480px; max-height:85vh">
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
              }

            </div>
            <div class="modal-actions" style="border-top:1px solid var(--border-weak); padding-top:12px; margin-top:12px">
            <button class="btn-s" (click)="closeProfileEditor()">Cancel</button>
              <button class="btn-p" (click)="saveProfileSettings()">Save Settings</button>
            </div>
          </div>
        </div>
      }

      <!-- Floating Action Button for Teachers: Start Live Class Instantly -->
      @if (currentUser()?.role === 'teacher') {
        <button (click)="triggerInstantLive()" class="float-live-btn" title="Activer le Live">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 7a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7Z"/><path d="M12 9v6"/><path d="M9 12h6"/></svg>
          <span>Activer le Live</span>
        </button>
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
              @if (currentUser()?.role === 'teacher') {
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
          <div style="flex:1; background:#000; position:relative">
            <app-jitsi-meet
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
    .float-live-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 99;
      background: #EEF2FF;
      border: 1px solid #4F46E5;
      color: #4F46E5;
      box-shadow: 0 4px 14px rgba(79, 70, 229, 0.2);
      border-radius: 30px;
      padding: 10px 16px;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      transition: transform 0.2s ease, background 0.2s ease;
    }
    .float-live-btn:hover {
      transform: scale(1.04);
      background: #FFFFFF;
    }
    @media (max-width: 768px) {
      .float-live-btn {
        bottom: 90px;
        right: 16px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        padding: 0;
        justify-content: center;
      }
      .float-live-btn span {
        display: none;
      }
    }

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

  currentUser = signal<UserProfile | null>(null);
  allUsers = signal<UserProfile[]>([]);

  activeTab = localStorage.getItem('speak_active_tab') || 'dashboard';
  pageTitle = 'Dashboard';
  isSidebarOpen = signal<boolean>(false);

  // Badges stats
  lessonsCount = signal<number>(0);
  pendingHomeworkCount = signal<number>(0);
  activeClassAvailable = signal<boolean>(false);
  unreadAnnouncementsCount = signal<number>(0);
  chatUnreadCount = signal<number>(0);

  // "Seen" badges - disappear after first visit
  examModeIsNew = signal<boolean>(localStorage.getItem('speak_exam_visited') !== 'true');
  newLessonsCount = signal<number>(0);

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

    this.db.observeActiveJitsiCall().subscribe(c => {
      this.activeJitsiCall.set(c);
    });

    this.db.observeCurrentUser().subscribe(user => {
      // Clear last known state on user change to prevent toast duplicate triggers
      this.lastSubmissions = null;
      this.lastActiveClassId = null;
      this.toasts.set([]);

      if (user) {
        if (user.blocked) {
          this.dialogService.alert('Compte Suspendu 🚫', 'Votre accès a été révoqué par le professeur. Vous allez être déconnecté.', 'info');
          this.db.logout();
          return;
        }
        this.currentUser.set(user);
        // Sync active tab for roles
        if (user.role === 'teacher' && ['dashboard', 'lessons', 'speaking', 'exercises', 'events', 'live-classes', 'admin-management', 'history', 'exam'].includes(this.activeTab)) {
          this.setTab('overview');
        } else if ((user.role === 'student' || user.role === 'guest') && ['overview', 'students', 'create-lesson', 'create-quiz', 'exercises-manager', 'grade-homework', 'attendance', 'schedule-class', 'payments', 'teacher-events', 'user-management', 'admin-management', 'results', 'vocab-games'].includes(this.activeTab)) {
          this.setTab('dashboard');
        } else if (user.role === 'admin' && ['dashboard', 'lessons', 'speaking', 'exercises', 'events', 'live-classes', 'overview', 'students', 'create-lesson', 'create-quiz', 'exercises-manager', 'grade-homework', 'attendance', 'schedule-class', 'payments', 'teacher-events', 'user-management', 'history', 'exam', 'results', 'vocab-games'].includes(this.activeTab)) {
          this.setTab('admin-management');
        }
      }
    });

    this.db.observeUsers().subscribe(list => {
      this.allUsers.set(list);
    });

    this.db.observeLessons().subscribe(list => {
      this.lessonsCount.set(list.length);
      // Count lessons published since last visit to the lessons tab
      const lastVisit = localStorage.getItem('speak_lessons_visited_at');
      if (lastVisit) {
        const lastVisitTime = new Date(lastVisit).getTime();
        const newCount = list.filter(l =>
          l.status === 'published' && new Date(l.createdAt || 0).getTime() > lastVisitTime
        ).length;
        this.newLessonsCount.set(newCount);
      } else {
        // First time ever — show the count of published lessons
        this.newLessonsCount.set(list.filter(l => l.status === 'published').length);
      }
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
  }

  setTab(tabName: string) {
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
      localStorage.setItem('speak_lessons_visited_at', new Date().toISOString());
      this.newLessonsCount.set(0);
    }

    // Clear "NEW" badge on Exam Mode after first visit
    if (tabName === 'exam') {
      localStorage.setItem('speak_exam_visited', 'true');
      this.examModeIsNew.set(false);
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
      exercises: { fr: 'Exercices & Quiz', en: 'Exercises & Quizzes' },
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
      'schedule-class': { fr: 'Planifier un Direct', en: 'Schedule Class' },
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
      'vocab-games': { fr: 'Jeux de Vocabulaire', en: 'Vocabulary Games' }
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

  activeJitsiCall = signal<LiveClass | null>(null);

  joinLiveCall(c: LiveClass) {
    this.db.setActiveJitsiCall(c);
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
    this.dialogService.confirm(
      'Start Instant Live Class',
      'Would you like to start a live meeting session instantly?',
      async () => {
        try {
          const created = await this.db.startInstantLiveClass();
          if (created) {
            this.joinLiveCall(created);
          }
        } catch (e: any) {
          this.dialogService.alert('Failed to Start Live', e.message || 'Error occurred starting live session.', 'info');
        }
      }
    );
  }
}
