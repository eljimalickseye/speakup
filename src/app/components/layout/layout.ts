import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, UserProfile, LiveClass, Submission, Announcement } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

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

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    StudentDashboardComponent,
    StudentLessonsComponent,
    StudentSpeakingComponent,
    StudentExercisesComponent,
    StudentChatComponent,
    StudentLeaderboardComponent,
    StudentEventsComponent,
    StudentLiveClassesComponent,
    StudentAnnouncementsComponent,
    TeacherOverviewComponent,
    TeacherStudentsComponent,
    TeacherLessonsComponent,
    TeacherQuizzesComponent,
    TeacherHomeworkComponent,
    TeacherAttendanceComponent,
    TeacherScheduleComponent,
    TeacherAnnouncementsComponent,
    TeacherPaymentsComponent,
    TeacherEventsComponent
  ],
  template: `
    <div class="shell">
      <!-- SIDEBAR -->
      <div class="sidebar">
        <div class="logo">
          <div class="logo-mark">S</div>
          <span class="logo-name">SpeakUp</span>
          @if (currentUser()?.role === 'teacher') {
            <span class="logo-role">Teacher</span>
          }
        </div>
        
        <div class="nav">
          <!-- STUDENT SIDEBAR TABS -->
          @if (currentUser()?.role === 'student') {
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
            
            <div class="nav-section">Community</div>
            <button class="nav-item" [class.active]="activeTab === 'chat'" (click)="setTab('chat')">
              <i class="ti ti-messages" aria-hidden="true"></i>English Chat
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
          } @else {
            <!-- TEACHER SIDEBAR TABS -->
            <div class="ns">Overview</div>
            <button class="ni" [class.active]="activeTab === 'overview'" (click)="setTab('overview')">
              <i class="ti ti-layout-dashboard" aria-hidden="true"></i>Overview
            </button>
            <button class="ni" [class.active]="activeTab === 'students'" (click)="setTab('students')">
              <i class="ti ti-users" aria-hidden="true"></i>Students
              <span class="badge b">{{ studentsCount() }}</span>
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
          }
        </div>
      </div>
      
      <!-- MAIN CONTAINER -->
      <div class="main">
        <!-- TOPBAR -->
        <div class="topbar">
          <span class="topbar-title">{{ pageTitle }}</span>
          
          <!-- Reset DB Button (Teacher only) -->
          @if (currentUser()?.role === 'teacher') {
            <button class="btn-s" style="font-size: 11px; padding: 4px 12px; border-radius: 20px; display:flex; align-items:center; gap:4px; margin-right: 12px; border-color:#D97706; color:#D97706" (click)="resetDB()">
              <i class="ti ti-refresh" aria-hidden="true"></i> Reset DB
            </button>
          }

          <!-- Log Out Button -->
          <button class="btn-s" style="font-size: 11px; padding: 4px 12px; border-radius: 20px; display:flex; align-items:center; gap:4px; margin-right: 12px; border-color:#EF4444; color:#EF4444" (click)="logOut()">
            <i class="ti ti-logout" aria-hidden="true"></i> Log Out
          </button>

          <div class="avatar" [style.background]="currentUser()?.role === 'teacher' ? '#3730A3' : '#4F46E5'">
            {{ currentUser()?.avatar }}
          </div>
        </div>
        
        <!-- CONTENT VIEWPORT -->
        <div class="content">
          <!-- Student Views -->
          @if (currentUser()?.role === 'student') {
            @if (activeTab === 'dashboard') {
              <app-student-dashboard (navigateToTab)="setTab($event)"></app-student-dashboard>
            } @else if (activeTab === 'lessons') {
              <app-student-lessons></app-student-lessons>
            } @else if (activeTab === 'speaking') {
              <app-student-speaking></app-student-speaking>
            } @else if (activeTab === 'exercises') {
              <app-student-exercises></app-student-exercises>
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
                <button class="btn-s" style="padding: 6px 16px; font-size:12px; border-radius:6px" (click)="cancelDialog()">{{ d.cancelText || 'Cancel' }}</button>
              }
              <button class="btn-p" style="padding: 6px 16px; font-size:12px; border-radius:6px" [style.background]="d.type === 'success' ? '#10B981' : (d.type === 'confirm' ? '#D97706' : '#4F46E5')" [style.border-color]="d.type === 'success' ? '#10B981' : (d.type === 'confirm' ? '#D97706' : '#4F46E5')" (click)="confirmDialog()">{{ d.confirmText || 'OK' }}</button>
            </div>
          </div>
        </div>
      }
    </div>
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
  
  activeTab = 'dashboard';
  pageTitle = 'Dashboard';

  // Badges stats
  studentsCount = signal<number>(0);
  lessonsCount = signal<number>(0);
  pendingHomeworkCount = signal<number>(0);
  activeClassAvailable = signal<boolean>(false);
  unreadAnnouncementsCount = signal<number>(0);

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
    this.db.observeCurrentUser().subscribe(user => {
      // Clear last known state on user change to prevent toast duplicate triggers
      this.lastSubmissions = null;
      this.lastActiveClassId = null;
      this.toasts.set([]);

      if (user) {
        this.currentUser.set(user);
        // Sync active tab for roles
        if (user.role === 'teacher' && ['dashboard', 'lessons', 'speaking', 'exercises', 'chat', 'leaderboard', 'events', 'live-classes'].includes(this.activeTab)) {
          this.setTab('overview');
        } else if (user.role === 'student' && ['overview', 'students', 'create-lesson', 'create-quiz', 'grade-homework', 'attendance', 'schedule-class', 'announcements', 'payments', 'teacher-events'].includes(this.activeTab)) {
          this.setTab('dashboard');
        }
      }
    });

    this.db.observeUsers().subscribe(list => {
      this.allUsers.set(list);
      this.studentsCount.set(list.filter(u => u.role === 'student').length);
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
  }

  setTab(tabName: string) {
    this.activeTab = tabName;
    this.pageTitle = this.getTabTitle(tabName);
  }

  logOut() {
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
      'teacher-events': 'Events Registry'
    };
    return titles[tab] || 'Overview';
  }
}
