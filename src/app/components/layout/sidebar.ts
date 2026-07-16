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
            <i class="ti ti-layout-dashboard"></i>{{ t('Tableau de bord', 'Dashboard') }}
          </button>
          
          @if (showGarden) {
            <button class="sidebar-item" [class.active]="activeTab === 'garden'" (click)="setTab('garden')">
              <i class="ti ti-plant"></i>My Garden
            </button>
          }
          @if (showJourney) {
            <button class="sidebar-item" [class.active]="activeTab === 'journey'" (click)="setTab('journey')">
              <i class="ti ti-map"></i>SpeakUp Journey
            </button>
          }

          <button class="sidebar-item" [class.active]="activeTab === 'lessons'" (click)="setTab('lessons')"
                  [style.opacity]="mustTakePlacementTest ? '0.4' : '1'">
            <i class="ti ti-book"></i>{{ t('Cours & Leçons', 'Lessons') }}
            @if (newLessonsCount > 0) {
              <span class="sidebar-badge" style="background:#7C3AED">{{ newLessonsCount }}</span>
            }
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'speaking'" [disabled]="currentUser?.role === 'guest'"
                  [style.opacity]="currentUser?.role === 'guest' ? '0.5' : (mustTakePlacementTest ? '0.4' : '1')" 
                  (click)="setTab('speaking')">
            <i class="ti ti-microphone"></i>{{ t('Pratique Orale', 'Speaking') }}
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'quizzes'" (click)="setTab('quizzes')"
                  [style.opacity]="mustTakePlacementTest ? '0.4' : '1'">
            <i class="ti ti-list-check"></i>{{ t('Quiz & Évaluations', 'Quizzes & Tests') }}
            @if (newQuizzesCount > 0) {
              <span class="sidebar-badge" style="background:#7C3AED">{{ newQuizzesCount }}</span>
            }
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'exercises'" (click)="setTab('exercises')"
                  [style.border]="mustTakePlacementTest ? '1.5px solid #F59E0B' : 'none'"
                  [style.background]="mustTakePlacementTest ? '#FFFDF5' : 'transparent'">
            <i class="ti ti-pencil" [style.color]="mustTakePlacementTest ? '#D97706' : 'inherit'"></i>
            <span [style.color]="mustTakePlacementTest ? '#B45309' : 'inherit'" [style.font-weight]="mustTakePlacementTest ? '800' : 'normal'">
              {{ mustTakePlacementTest ? t('Test de Niveau 🎯', 'Placement Test 🎯') : t('Jeux & Exercices', 'Games & Exercises') }}
            </span>
            @if (mustTakePlacementTest) {
              <span class="sidebar-badge" style="background:#D97706; font-size:9.5px; animation: pulse-live 1.5s infinite">REQ</span>
            } @else if (newExercisesCount > 0) {
              <span class="sidebar-badge" style="background:#7C3AED">{{ newExercisesCount }}</span>
            }
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'dictionary'" (click)="setTab('dictionary')"
                  [style.opacity]="mustTakePlacementTest ? '0.4' : '1'">
            <i class="ti ti-bookmarks"></i>{{ t('Dictionnaire', 'Dictionary') }}
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'ebooks'" (click)="setTab('ebooks')"
                  [style.opacity]="mustTakePlacementTest ? '0.4' : '1'">
            <i class="ti ti-book"></i>{{ t('Bibliothèque (Ebooks)', 'Ebooks Library') }}
          </button>

          <!-- COMMUNICATION SECTION -->
          <div class="nav-section-title" [style.color]="activeTheme === 'rose' ? '#BE185D' : (activeTheme === 'manga' ? '#8B74FC' : 'var(--text-muted)')">{{ t('Communauté', 'Community') }}</div>
          
          <button class="sidebar-item" [class.active]="activeTab === 'chat'" (click)="setTab('chat')">
            <i class="ti ti-messages"></i>{{ t('Chat en Anglais', 'English Chat') }}
            @if (chatUnreadCount > 0) {
              <span class="sidebar-badge" style="background:#EF4444">{{ chatUnreadCount }}</span>
            }
          </button>
          
          @if (showBoutique) {
            <button class="sidebar-item" [class.active]="activeTab === 'marketplace'" (click)="setTab('marketplace')">
              <i class="ti ti-shopping-cart"></i>Boutique
            </button>
          }

          <button class="sidebar-item" [class.active]="activeTab === 'leaderboard'" (click)="setTab('leaderboard')">
            <i class="ti ti-trophy"></i>{{ t('Classement (XP)', 'Leaderboard') }}
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'events'" (click)="setTab('events')">
            <i class="ti ti-calendar-event"></i>{{ t('Événements', 'Events') }}
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'announcements'" (click)="setTab('announcements')">
            <i class="ti ti-volume"></i>{{ t('Annonces', 'Announcements') }}
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
            <i class="ti ti-video"></i>{{ t('Classes en Direct', 'Live Classes') }}
            @if (activeClassAvailable) {
              <span class="sidebar-badge" style="background:#EF4444; animation: pulse-live 1.5s infinite">LIVE</span>
            }
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'ice-breaker'" (click)="setTab('ice-breaker')"
                  [style.border]="(activeTheme === 'manga' || activeTheme === 'rose') && activeTab === 'ice-breaker' ? '2.5px solid #000' : 'none'"
                  [style.boxShadow]="(activeTheme === 'manga' || activeTheme === 'rose') && activeTab === 'ice-breaker' ? '3px 3px 0px #000' : 'none'"
                  [style.backgroundColor]="activeTab === 'ice-breaker' ? (activeTheme === 'rose' ? '#FFD1DC' : '#7C3AED') : 'transparent'">
            <i class="ti ti-rotate" [style.color]="activeTheme === 'rose' ? '#BE185D' : '#10B981'"></i>
            <span style="font-weight:700" [style.color]="activeTheme === 'rose' ? '#BE185D' : (activeTheme === 'manga' ? 'white' : '#10B981')">{{ t('Ice Breaker 🎮', 'Ice Breaker 🎮') }}</span>
            @if (activeIceBreakerSession) {
              <span class="sidebar-badge" style="background:#EF4444; animation: pulse-live 1.5s infinite">LIVE</span>
            }
          </button>

          <!-- PROGRESS SECTION -->
          <div class="nav-section-title" [style.color]="activeTheme === 'rose' ? '#BE185D' : (activeTheme === 'manga' ? '#8B74FC' : 'var(--text-muted)')">{{ t('Progression', 'Progress') }}</div>
          
          <button class="sidebar-item" [class.active]="activeTab === 'history'" (click)="setTab('history')">
            <i class="ti ti-history"></i>{{ t('Mon Historique', 'My History') }}
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'exam'" (click)="setTab('exam')">
            <i class="ti ti-certificate"></i>{{ t('Mode Examen', 'Exam Mode') }}
            @if (examModeIsNew) {
              <span class="sidebar-badge" style="background:#7C3AED">NEW</span>
            }
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'coaching'" (click)="setTab('coaching')">
            <i class="ti ti-target" style="color:#D97706"></i>
            <span style="font-weight:700; color:#B45309">{{ t('Accompagnement Privé 🎯', 'Private Coaching 🎯') }}</span>
            @if (currentUser?.isPrivateCoaching) {
              <span class="sidebar-badge" style="background:#10B981">VIP</span>
            }
          </button>

        <!-- ADMIN NAVIGATION -->
        } @else if (currentUser?.role === 'admin') {
          <div class="nav-section-title" [style.color]="activeTheme === 'rose' ? '#BE185D' : (activeTheme === 'manga' ? '#8B74FC' : 'var(--text-muted)')">{{ t('Administration', 'Administration') }}</div>
          <button class="sidebar-item" [class.active]="activeTab === 'admin-management'" (click)="setTab('admin-management')">
            <i class="ti ti-settings"></i>{{ t('Console Admin', 'Admin Control') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'chat'" (click)="setTab('chat')">
            <i class="ti ti-messages"></i>{{ t('Chat en Anglais', 'English Chat') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'announcements'" (click)="setTab('announcements')">
            <i class="ti ti-speakerphone"></i>{{ t('Annonces', 'Announcements') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'system-history'" (click)="setTab('system-history')">
            <i class="ti ti-history"></i>{{ t('Logs Système', 'System Logs') }}
          </button>

        <!-- TEACHER NAVIGATION -->
        } @else {
          <div class="nav-section-title" [style.color]="activeTheme === 'rose' ? '#BE185D' : (activeTheme === 'manga' ? '#8B74FC' : 'var(--text-muted)')">{{ t('Vue Générale', 'Overview') }}</div>
          <button class="sidebar-item" [class.active]="activeTab === 'overview'" (click)="setTab('overview')">
            <i class="ti ti-layout-dashboard"></i>{{ t("Vue d'ensemble", 'Overview') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'chat'" (click)="setTab('chat')">
            <i class="ti ti-messages"></i>{{ t('Chat en Anglais', 'English Chat') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'leaderboard'" (click)="setTab('leaderboard')">
            <i class="ti ti-trophy"></i>{{ t('Classement & Récompenses', 'Leaderboard & Rewards') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'students'" (click)="setTab('students')">
            <i class="ti ti-users"></i>{{ t('Mes Élèves', 'Students') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'teacher-coaching'" (click)="setTab('teacher-coaching')">
            <i class="ti ti-target" style="color:#D97706"></i>
            <span style="font-weight:700; color:#B45309">{{ t('Coaching Privé 👑', 'Private Coaching 👑') }}</span>
            @if (pendingCoachingCount > 0) {
              <span class="sidebar-badge" style="background:#EF4444">{{ pendingCoachingCount }}</span>
            }
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'wheel-game'" (click)="setTab('wheel-game')">
            <i class="ti ti-rotate" style="color:#10B981"></i>
            <span style="font-weight:700; color:#047857">{{ t('Roue des Noms 🎡', 'Wheel Game 🎡') }}</span>
          </button>
          
          <div class="nav-section-title" [style.color]="activeTheme === 'rose' ? '#BE185D' : (activeTheme === 'manga' ? '#8B74FC' : 'var(--text-muted)')">{{ t('Contenus', 'Content') }}</div>
          <button class="sidebar-item" [class.active]="activeTab === 'create-lesson'" (click)="setTab('create-lesson')">
            <i class="ti ti-book"></i>{{ t('Créer un cours', 'Create Lesson') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'create-quiz'" (click)="setTab('create-quiz')">
            <i class="ti ti-list-check"></i>{{ t('Gérer les Quiz', 'Quiz Builder') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'exercises-manager'" (click)="setTab('exercises-manager')">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;flex-shrink:0"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><polyline points="9 12 11 14 15 10"/><line x1="9" y1="17" x2="15" y2="17"/></svg>{{ t('Gérer les Exercices', 'Exercises Manager') }}
          </button>

          <button class="sidebar-item" [class.active]="activeTab === 'grade-homework'" (click)="setTab('grade-homework')">
            <i class="ti ti-writing"></i>{{ t('Corriger les Devoirs', 'Grade Homework') }}
            @if (pendingHomeworkCount > 0) {
              <span class="sidebar-badge" style="background:#FEE2E2; color:#DC2626">{{ pendingHomeworkCount }}</span>
            }
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'results'" (click)="setTab('results')">
            <i class="ti ti-clipboard-data"></i>{{ t('Résultats Élèves', 'Students Results') }}
            @if (showResultsNewBadge) {
              <span class="sidebar-badge" style="background:#059669">NEW</span>
            }
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'ebooks'" (click)="setTab('ebooks')">
            <i class="ti ti-notebook"></i>{{ t('Gérer les Ebooks', 'Manage Ebooks') }}
          </button>
          
          <div class="nav-section-title" [style.color]="activeTheme === 'rose' ? '#BE185D' : (activeTheme === 'manga' ? '#8B74FC' : 'var(--text-muted)')">{{ t('Classes & Directs', 'Classes & Lives') }}</div>
          <button class="sidebar-item" [class.active]="activeTab === 'attendance'" (click)="setTab('attendance')">
            <i class="ti ti-calendar-check"></i>{{ t('Feuille de Présences', 'Attendance Sheet') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'schedule-class'" (click)="setTab('schedule-class')">
            <i class="ti ti-video"></i>{{ t('Analyses & Classes', 'Analytics & Classes') }}
          </button>
          
          <div class="nav-section-title" [style.color]="activeTheme === 'rose' ? '#BE185D' : (activeTheme === 'manga' ? '#8B74FC' : 'var(--text-muted)')">{{ t('Administration', 'Administration') }}</div>
          <button class="sidebar-item" [class.active]="activeTab === 'announcements'" (click)="setTab('announcements')">
            <i class="ti ti-speakerphone"></i>{{ t('Annonces Générales', 'Announcements') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'payments'" (click)="setTab('payments')">
            <i class="ti ti-credit-card"></i>{{ t('Suivi des Paiements', 'Payments Tracker') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'teacher-events'" (click)="setTab('teacher-events')">
            <i class="ti ti-calendar-event"></i>{{ t('Événements', 'Events') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'user-management'" (click)="setTab('user-management')">
            <i class="ti ti-users"></i>{{ t('Utilisateurs & Modération', 'Users & Moderation') }}
          </button>
          <button class="sidebar-item" [class.active]="activeTab === 'system-history'" (click)="setTab('system-history')">
            <i class="ti ti-history"></i>{{ t('Logs Système', 'System Logs') }}
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
      background: #7C3AED;
      color: white !important;
      font-weight: 600;
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
