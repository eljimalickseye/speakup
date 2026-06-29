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
import { AdminManagementComponent } from '../admin/admin-management';

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
    AdminManagementComponent
  ],
  template: `
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
            <div class="nav-section">Learn</div>
            <button class="nav-item" [class.active]="activeTab === 'dashboard'" (click)="setTab('dashboard')">
              <i class="ti ti-layout-dashboard" aria-hidden="true"></i>Dashboard
            </button>
            <button class="nav-item" [class.active]="activeTab === 'lessons'" (click)="setTab('lessons')">
              <i class="ti ti-book" aria-hidden="true"></i>Lessons
              @if (lessonsCount() > 0) {
                <span class="badge">{{ lessonsCount() }}</span>
              }
            </button>
            <button class="nav-item" [class.active]="activeTab === 'speaking'" (click)="setTab('speaking')">
              <i class="ti ti-microphone" aria-hidden="true"></i>Speaking
            </button>
            <button class="nav-item" [class.active]="activeTab === 'exercises'" (click)="setTab('exercises')">
              <i class="ti ti-pencil" aria-hidden="true"></i>Exercises
            </button>
            <button class="nav-item" [class.active]="activeTab === 'dictionary'" (click)="setTab('dictionary')">
              <i class="ti ti-bookmarks" aria-hidden="true"></i>Dictionary
            </button>
            <button class="nav-item" [class.active]="activeTab === 'ebooks'" (click)="setTab('ebooks')">
              <i class="ti ti-book" aria-hidden="true"></i>Bibliothèque (Ebooks)
            </button>
            
            <div class="nav-section">Community</div>
            <button class="nav-item" [class.active]="activeTab === 'chat'" (click)="setTab('chat')">
              <i class="ti ti-messages" aria-hidden="true"></i>English Chat
              @if (chatUnreadCount() > 0) {
                <span class="badge" style="background:#EF4444; color:white; margin-left:auto">{{ chatUnreadCount() }}</span>
              }
            </button>
            <button class="nav-item" [class.active]="activeTab === 'leaderboard'" (click)="setTab('leaderboard')">
              <i class="ti ti-trophy" aria-hidden="true"></i>Leaderboard
            </button>
            <button class="nav-item" [class.active]="activeTab === 'events'" (click)="setTab('events')">
              <i class="ti ti-calendar-event" aria-hidden="true"></i>Events
            </button>
            <button class="nav-item" [class.active]="activeTab === 'announcements'" (click)="setTab('announcements')">
              <i class="ti ti-volume" aria-hidden="true"></i>Announcements
              @if (unreadAnnouncementsCount() > 0) {
                <span class="badge red" style="background:#EF4444; color:white; margin-left:auto">{{ unreadAnnouncementsCount() }}</span>
              }
            </button>
            
            <div class="nav-section">Classes</div>
            <button class="nav-item" [class.active]="activeTab === 'live-classes'" (click)="setTab('live-classes')">
              <i class="ti ti-video" aria-hidden="true"></i>Live Classes
              @if (activeClassAvailable()) {
                <span class="badge red" style="background:#EF4444; color:white; animation: pulse-live 1.5s infinite">LIVE</span>
              }
            </button>
          } @else if (currentUser()?.role === 'admin') {
            <!-- ADMIN SIDEBAR TABS -->
            <div class="ns">Admin Panel</div>
            <button class="ni" [class.active]="activeTab === 'admin-management'" (click)="setTab('admin-management')">
              <i class="ti ti-settings" aria-hidden="true"></i>Admin Control
            </button>
            <button class="ni" [class.active]="activeTab === 'chat'" (click)="setTab('chat')">
              <i class="ti ti-messages" aria-hidden="true"></i>English Chat
            </button>
            <button class="ni" [class.active]="activeTab === 'announcements'" (click)="setTab('announcements')">
              <i class="ti ti-speakerphone" aria-hidden="true"></i>Announcements
            </button>
          } @else {
            <!-- TEACHER SIDEBAR TABS -->
            <div class="ns">Overview</div>
            <button class="ni" [class.active]="activeTab === 'overview'" (click)="setTab('overview')">
              <i class="ti ti-layout-dashboard" aria-hidden="true"></i>Overview
            </button>
            <button class="ni" [class.active]="activeTab === 'chat'" (click)="setTab('chat')">
              <i class="ti ti-messages" aria-hidden="true"></i>English Chat
            </button>
            <button class="ni" [class.active]="activeTab === 'leaderboard'" (click)="setTab('leaderboard')">
              <i class="ti ti-trophy" aria-hidden="true"></i>Leaderboard & Rewards
            </button>
            <button class="ni" [class.active]="activeTab === 'students'" (click)="setTab('students')">
              <i class="ti ti-users" aria-hidden="true"></i>Students
            </button>
            
            <div class="ns">Content</div>
            <button class="ni" [class.active]="activeTab === 'create-lesson'" (click)="setTab('create-lesson')">
              <i class="ti ti-book" aria-hidden="true"></i>Create lesson
            </button>
            <button class="ni" [class.active]="activeTab === 'create-quiz'" (click)="setTab('create-quiz')">
              <i class="ti ti-list-check" aria-hidden="true"></i>Create quiz
            </button>
            <button class="ni" [class.active]="activeTab === 'grade-homework'" (click)="setTab('grade-homework')">
              <i class="ti ti-writing" aria-hidden="true"></i>Grade homework
              @if (pendingHomeworkCount() > 0) {
                <span class="badge" style="background:#FEE2E2; color:#DC2626">{{ pendingHomeworkCount() }}</span>
              }
            </button>
            <button class="ni" [class.active]="activeTab === 'ebooks'" (click)="setTab('ebooks')">
              <i class="ti ti-notebook" aria-hidden="true"></i>Gérer les Ebooks
            </button>
            
            <div class="ns">Classes</div>
            <button class="ni" [class.active]="activeTab === 'attendance'" (click)="setTab('attendance')">
              <i class="ti ti-calendar-check" aria-hidden="true"></i>Attendance
            </button>
            <button class="ni" [class.active]="activeTab === 'schedule-class'" (click)="setTab('schedule-class')">
              <i class="ti ti-video" aria-hidden="true"></i>Schedule class
            </button>
            
            <div class="ns">Admin</div>
            <button class="ni" [class.active]="activeTab === 'announcements'" (click)="setTab('announcements')">
              <i class="ti ti-speakerphone" aria-hidden="true"></i>Announcements
            </button>
            <button class="ni" [class.active]="activeTab === 'payments'" (click)="setTab('payments')">
              <i class="ti ti-credit-card" aria-hidden="true"></i>Payments
            </button>
            <button class="ni" [class.active]="activeTab === 'teacher-events'" (click)="setTab('teacher-events')">
              <i class="ti ti-calendar-event" aria-hidden="true"></i>Events
            </button>
            <button class="ni" [class.active]="activeTab === 'user-management'" (click)="setTab('user-management')">
              <i class="ti ti-users" aria-hidden="true"></i>User Management
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
          
          <!-- Reset DB Button (Teacher only) -->
          @if (currentUser()?.role === 'teacher') {
            <button class="btn-s hide-mobile" style="font-size: 11px; padding: 4px 12px; border-radius: 20px; display:flex; align-items:center; gap:4px; margin-right: 12px; border-color:#D97706; color:#D97706" (click)="resetDB()">
              <i class="ti ti-refresh" aria-hidden="true"></i> Reset DB
            </button>
          }

          <!-- Log Out Button -->
          <button class="btn-s" style="font-size: 11px; padding: 4px 12px; border-radius: 20px; display:flex; align-items:center; gap:4px; margin-right: 12px; border-color:#EF4444; color:#EF4444" (click)="logOut()">
            <i class="ti ti-logout" aria-hidden="true"></i> Log Out
          </button>

          <div class="avatar" [style.background]="currentUser()?.role === 'teacher' ? '#3730A3' : '#4F46E5'" style="cursor:pointer; transition: transform 0.2s ease" (click)="openProfileEditor()" title="Edit Profile Settings">
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
            } @else if (activeTab === 'grade-homework') {
              <app-teacher-homework></app-teacher-homework>
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
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <i class="ti" [class.ti-circle-check]="d.type === 'success'" [class.ti-info-circle]="d.type === 'info'" [class.ti-alert-circle]="d.type === 'confirm'" [style.color]="d.type === 'success' ? '#10B981' : (d.type === 'confirm' ? '#D97706' : '#4F46E5')" style="font-size:24px"></i>
              <h3 class="modal-title">{{ d.title }}</h3>
            </div>
            <div class="modal-body" style="display:flex; flex-direction:column; gap:12px">
              @if (d.imageUrl) {
                <div style="width:100%; max-height:220px; overflow:hidden; border-radius:8px; border:1px solid var(--border-weak); background:#F3F4F6; display:flex; justify-content:center; align-items:center">
                  <img [src]="d.imageUrl" style="width:100%; height:auto; max-height:220px; object-fit:contain" alt="Announcement Banner">
                </div>
              }
              <div style="line-height:1.5; white-space: pre-line;">{{ d.message }}</div>
            </div>
            <div class="modal-actions">
              @if (d.type === 'confirm') {
                <button class="btn-s" style="padding: 6px 16px; font-size:12px; border-radius:6px" [style.background]="d.buttonColors?.cancel || '#FFFFFF'" [style.border-color]="d.buttonColors?.cancel || '#D1D5DB'" [style.color]="d.buttonColors?.cancelTextColor || (d.buttonColors?.cancel ? '#FFFFFF' : '#1F2937')" (click)="cancelDialog()">{{ d.cancelText || 'Cancel' }}</button>
              }
              @if (d.thirdOption) {
                <button class="btn-s" style="padding: 6px 16px; font-size:12px; border-radius:6px" [style.background]="d.buttonColors?.third || '#FFFFFF'" [style.border-color]="d.buttonColors?.third || '#D1D5DB'" [style.color]="d.buttonColors?.third || '#1F2937'" (click)="thirdOptionDialog()">{{ d.thirdOption.text }}</button>
              }
              <button class="btn-p" style="padding: 6px 16px; font-size:12px; border-radius:6px" [style.background]="d.buttonColors?.confirm || (d.type === 'success' ? '#10B981' : (d.type === 'confirm' ? '#D97706' : '#4F46E5'))" [style.border-color]="d.buttonColors?.confirm || (d.type === 'success' ? '#10B981' : (d.type === 'confirm' ? '#D97706' : '#4F46E5'))" (click)="confirmDialog()">{{ d.confirmText || 'OK' }}</button>
            </div>
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

              <!-- Gemini API Key input -->
              <div class="input-row" style="background:#FAF5FF; border:1px solid #E9D5FF; padding:12px; border-radius:8px">
                <label style="color:#7E22CE; font-weight:700; display:flex; align-items:center; gap:4px">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <span>Google Gemini API Key</span>
                </label>
                <input type="password" [(ngModel)]="profileGeminiKey" placeholder="Paste your API key here" style="margin-top:6px; border-color:#E9D5FF" />
                <div style="font-size:10px; color:#6B7280; margin-top:4px; line-height:1.4">
                  Used for real AI coach feedback & quiz generation. Get a free key at <a href="https://aistudio.google.com/" target="_blank" style="color:#7E22CE; font-weight:600; text-decoration:underline">Google AI Studio</a>.
                </div>
              </div>

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
      border-radius: 12px;
      width: 90%;
      max-width: 420px;
      padding: 24px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      animation: scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .modal-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .modal-title {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
    }
    .modal-body {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: 20px;
      white-space: pre-line;
    }
    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `]
})
export class LayoutComponent {
  private db = inject(DatabaseService);
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

  constructor() {
    this.db.observeActiveJitsiCall().subscribe(c => {
      this.activeJitsiCall.set(c);
    });

    this.db.observeCurrentUser().subscribe(user => {
      // Clear last known state on user change to prevent toast duplicate triggers
      this.lastSubmissions = null;
      this.lastActiveClassId = null;
      this.toasts.set([]);

      if (user) {
        this.currentUser.set(user);
        // Sync active tab for roles
        if (user.role === 'teacher' && ['dashboard', 'lessons', 'speaking', 'exercises', 'events', 'live-classes', 'admin-management'].includes(this.activeTab)) {
          this.setTab('overview');
        } else if ((user.role === 'student' || user.role === 'guest') && ['overview', 'students', 'create-lesson', 'create-quiz', 'grade-homework', 'attendance', 'schedule-class', 'payments', 'teacher-events', 'user-management', 'admin-management'].includes(this.activeTab)) {
          this.setTab('dashboard');
        } else if (user.role === 'admin' && ['dashboard', 'lessons', 'speaking', 'exercises', 'events', 'live-classes', 'overview', 'students', 'create-lesson', 'create-quiz', 'grade-homework', 'attendance', 'schedule-class', 'payments', 'teacher-events', 'user-management'].includes(this.activeTab)) {
          this.setTab('admin-management');
        }
      }
    });

    this.db.observeUsers().subscribe(list => {
      this.allUsers.set(list);
    });

    this.db.observeLessons().subscribe(list => {
      this.lessonsCount.set(list.length);
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
        // Pop open a modal alert
        this.dialogService.alert(
          `📢 Announcement: ${unread.title}`,
          unread.message,
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
              // Homework was graded! Show success toast!
              this.showToast({
                title: 'Devoir corrigé ! 📝',
                message: `Votre devoir pour "${sub.lessonTitle}" a été noté : "${sub.score}". +${sub.xpReward || 50} XP remportés !`,
                type: 'success',
                icon: 'ti-file-check'
              });
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
          // A new class just went live! Show live toast!
          this.showToast({
            title: 'Cours en direct commencé ! 🎥',
            message: `Le cours "${activeClass.title}" est en cours. Rejoignez la classe virtuelle.`,
            type: 'live',
            icon: 'ti-video',
            action: () => {
              this.setTab('live-classes');
            },
            actionText: 'Rejoindre le Live'
          });
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
    const titles: { [key: string]: string } = {
      dashboard: 'Dashboard',
      lessons: 'Lessons',
      speaking: 'Speaking Practice',
      exercises: 'Exercises',
      chat: 'English Chat',
      leaderboard: 'Leaderboard',
      events: 'Events',
      'live-classes': 'Live Classes',
      overview: 'Overview',
      students: 'Students Manager',
      'create-lesson': 'Create Lesson',
      'create-quiz': 'Create Quiz',
      'grade-homework': 'Grade Homework',
      attendance: 'Attendance',
      'schedule-class': 'Schedule Class',
      announcements: 'Announcements',
      payments: 'Payments',
      'teacher-events': 'Events Registry',
      'admin-management': 'Admin Control',
      'user-management': 'User Management',
      dictionary: 'Dictionary'
    };
    return titles[tab] || 'Overview';
  }

  isProfileModalOpen = signal<boolean>(false);
  profileName = '';
  profileAvatar = '';
  profileDescription = '';
  profileGeminiKey = '';
  hideTeacherLogin = signal<boolean>(localStorage.getItem('speak_hide_teacher_login') === 'true');

  openProfileEditor() {
    const user = this.currentUser();
    if (!user) return;
    this.profileName = user.name;
    this.profileAvatar = user.avatar;
    this.profileDescription = user.description || '';
    this.profileGeminiKey = this.db.getGeminiApiKey() || '';
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
      this.db.setGeminiApiKey(this.profileGeminiKey);
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
