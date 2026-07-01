import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { DatabaseService, LiveClass, UserProfile, Submission, Announcement, WordOfTheDay } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="height: 100%">
      @if (!activeMeeting()) {
        <!-- TEACHER BIO/PROFILE SUMMARY -->
        <div class="card" style="margin-bottom:20px; display:flex; gap:16px; align-items:center; background:linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 100%); border:1px solid #C7D2FE; border-radius:12px; padding:16px">
          <div class="av" style="width:48px; height:48px; font-size:18px; background:#3730A3; color:white; font-weight:700; display:flex; align-items:center; justify-content:center; border-radius:50%">
            {{ teacherProfile()?.avatar }}
          </div>
          <div style="flex:1">
            <div style="font-size:15px; font-weight:700; color:var(--text-primary)">
              Welcome back, Teacher {{ teacherProfile()?.name }}!
            </div>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:4px; line-height:1.5">
              @if (teacherProfile()?.description) {
                {{ teacherProfile()?.description }}
              } @else {
                You haven't set a profile description yet. Click your avatar in the topbar to write your biography and customize your settings.
              }
            </div>
          </div>
        </div>

        <!-- METRICS CARDS -->
        <div class="g4">
          <div class="mcard">
            <div class="mlabel">Total students</div>
            <div class="mval">{{ totalStudents() }}</div>
            <div class="msub">Active profiles</div>
          </div>
          <div class="mcard">
            <div class="mlabel">Avg attendance</div>
            <div class="mval">{{ avgAttendance() }}%</div>
            <div class="msub">All sessions</div>
          </div>
          <div class="mcard">
            <div class="mlabel">Homework pending</div>
            <div class="mval" [style.color]="pendingCount() > 0 ? '#EF4444' : ''">{{ pendingCount() }}</div>
            <div class="msub">Needs grading</div>
          </div>
          <div class="mcard">
            <div class="mlabel">Revenue</div>
            <div class="mval">{{ revenue() }}</div>
            <div class="msub">{{ paidFraction() }}</div>
          </div>
        </div>

        <!-- STUDENTS NEEDING ATTENTION -->
        <div class="st">Student Status & Alerts</div>
        @for (item of needingAttention(); track item.student.id) {
          <div class="row">
            <div class="av" style="width:28px; height:28px; font-size:10px;" [style.background]="item.statusClass === 'r' ? '#DC2626' : (item.statusClass === 'y' ? '#D97706' : '#059669')">
              {{ item.student.avatar }}
            </div>
            <div style="flex:1">
              <div style="font-size:13px; font-weight:600; color:var(--text-primary)">{{ item.student.name }}</div>
              <div style="font-size:11px; color:var(--text-muted)">{{ item.reason }}</div>
            </div>
            <span class="pill {{ item.statusClass }}">{{ item.status }}</span>
          </div>
        }
        @if (needingAttention().length === 0) {
          <div style="font-size:12px; color:var(--text-muted); padding:10px">
            All students are active and on track!
          </div>
        }

        <!-- TODAY'S SCHEDULE -->
        <div class="st">Today's schedule</div>
        @for (c of todayClasses(); track c.id) {
          <div class="row">
            <i class="ti ti-video" aria-hidden="true" style="font-size:18px; color:#4F46E5"></i>
            <div style="flex:1">
              <div style="font-size:13px; font-weight:600; color:var(--text-primary)">{{ c.title }}</div>
              <div style="font-size:11px; color:var(--text-muted)">
                {{ c.time }} · Duration: {{ c.duration }} · {{ c.group }}
              </div>
            </div>
            
            @if (c.status !== 'completed') {
              <button class="btn-p" style="font-size:12px; padding:6px 14px" (click)="startClass(c)">
                {{ c.status === 'active' ? 'Resume Class' : 'Start Class' }}
              </button>
            } @else {
              <span class="pill done">Finished</span>
            }
          </div>
        }
        @if (todayClasses().length === 0) {
          <div style="font-size:12px; color:var(--text-muted); padding:10px">
            No live classes scheduled for today.
          </div>
        }

        <!-- SUBMISSIONS SUMMARY -->
        <div class="row" style="cursor:pointer; margin-top:8px" (click)="goToHomework()">
          <i class="ti ti-message-check" aria-hidden="true" style="font-size:18px; color:#D97706"></i>
          <div style="flex:1">
            <div style="font-size:13px; font-weight:600; color:var(--text-primary)">Grade speaking & writing assignments</div>
            <div style="font-size:11px; color:var(--text-muted)">{{ pendingCount() }} new submissions waiting for review</div>
          </div>
          <span class="pill y">Pending</span>
        </div>

        <!-- RECENT ANNOUNCEMENTS -->
        @if (recentAnnouncements().length > 0) {
          <div class="st" style="margin-top:20px">📢 Recent Announcements</div>
          <div style="display:flex; flex-direction:column; gap:10px">
            @for (ann of recentAnnouncements(); track ann.id) {
              <div class="card" style="cursor:pointer; border-left: 4px solid {{ ann.priority === 'Urgent' ? '#EF4444' : (ann.priority === 'Important' ? '#F59E0B' : '#4F46E5') }}; transition: all 0.2s; padding:14px 16px"
                   (click)="viewAnnouncement(ann)"
                   onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.08)'"
                   onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none'">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px">
                  <div style="flex:1; min-width:0">
                    <div style="font-size:13px; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:6px; margin-bottom:4px">
                      {{ ann.title }}
                      <i class="ti ti-chevron-right" style="font-size:12px; color:var(--text-muted)"></i>
                    </div>
                    <div style="font-size:11px; color:var(--text-muted); display:flex; align-items:center; gap:6px; flex-wrap:wrap">
                      <span>📋 {{ ann.sendTo }}</span>
                      <span>·</span>
                      <span style="font-size:10px">{{ ann.createdAt | date:'mediumDate' }}</span>
                    </div>
                    @if (ann.message) {
                      <p style="font-size:11.5px; color:var(--text-secondary); margin-top:6px; line-height:1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden">
                        {{ ann.message }}
                      </p>
                    }
                  </div>
                  <span class="badge" [style.background]="ann.priority === 'Urgent' ? '#FEE2E2' : (ann.priority === 'Important' ? '#FEF3C7' : '#E0E7FF')" [style.color]="ann.priority === 'Urgent' ? '#991B1B' : (ann.priority === 'Important' ? '#92400E' : '#3730A3')" style="flex-shrink:0">
                    {{ ann.priority }}
                  </span>
                </div>
              </div>
            }
          </div>
        }

        <!-- WORD OF THE DAY SETTINGS CARD -->
        <div class="card" style="margin-top:24px; border:1.5px solid #F59E0B; background:#FFFBEB; border-radius:12px; padding:18px">
          <h3 class="st" style="font-size:15px; margin:0 0 12px 0; color:#B45309; display:flex; align-items:center; gap:8px">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
            <span>Word of the Day Editor (Mot du Jour)</span>
          </h3>

          <div style="display:flex; flex-direction:column; gap:12px">
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:12px">
              <div class="input-row" style="margin-bottom:0">
                <label style="font-size:11px; font-weight:600; color:#B45309; margin-bottom:4px; display:block">Mot en Anglais</label>
                <input [(ngModel)]="wordOfTheDay().word" placeholder="Ex: Resilience" class="form-input" style="height:36px; font-size:13px; border-color:#FDE68A" />
              </div>
              <div class="input-row" style="margin-bottom:0">
                <label style="font-size:11px; font-weight:600; color:#B45309; margin-bottom:4px; display:block">Traduction Française</label>
                <input [(ngModel)]="wordOfTheDay().translation" placeholder="Ex: Résilience" class="form-input" style="height:36px; font-size:13px; border-color:#FDE68A" />
              </div>
              <div class="input-row" style="margin-bottom:0">
                <label style="font-size:11px; font-weight:600; color:#B45309; margin-bottom:4px; display:block">Type de mot</label>
                <select [(ngModel)]="wordOfTheDay().partOfSpeech" class="form-select" style="height:36px; font-size:13px; border-color:#FDE68A">
                  <option value="noun">Nom (noun)</option>
                  <option value="verb">Verbe (verb)</option>
                  <option value="adjective">Adjectif (adjective)</option>
                  <option value="adverb">Adverbe (adverb)</option>
                  <option value="phrase">Expression (phrase)</option>
                </select>
              </div>
              <div class="input-row" style="margin-bottom:0">
                <label style="font-size:11px; font-weight:600; color:#B45309; margin-bottom:4px; display:block">Phonétique</label>
                <input [(ngModel)]="wordOfTheDay().phonetic" placeholder="Ex: /rɪˈzɪl.jəns/" class="form-input" style="height:36px; font-size:13px; border-color:#FDE68A" />
              </div>
            </div>

            <div class="input-row" style="margin-bottom:0">
              <label style="font-size:11px; font-weight:600; color:#B45309; margin-bottom:4px; display:block">Définition</label>
              <input [(ngModel)]="wordOfTheDay().definition" placeholder="Ex: The capacity to recover quickly from difficulties..." class="form-input" style="height:36px; font-size:13px; border-color:#FDE68A" />
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; flex-wrap:wrap">
              <div class="input-row" style="margin-bottom:0">
                <label style="font-size:11px; font-weight:600; color:#B45309; margin-bottom:4px; display:block">Exemple d'utilisation (Anglais)</label>
                <input [(ngModel)]="wordOfTheDay().example" placeholder="Ex: She showed great resilience." class="form-input" style="height:36px; font-size:13px; border-color:#FDE68A" />
              </div>
              <div class="input-row" style="margin-bottom:0">
                <label style="font-size:11px; font-weight:600; color:#B45309; margin-bottom:4px; display:block">Exemple d'utilisation (Français)</label>
                <input [(ngModel)]="wordOfTheDay().exampleTranslation" placeholder="Ex: Elle a fait preuve d'une grande résilience." class="form-input" style="height:36px; font-size:13px; border-color:#FDE68A" />
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; margin-top:8px">
              <button class="btn-p" style="height:36px; padding:0 24px; font-weight:700; background:#D97706; border-color:#D97706" (click)="saveWordOfTheDay()">
                Mettre à jour le Mot du Jour 🎙️
              </button>
            </div>
          </div>
        </div>

        <!-- FEATURE CONFIGURATION CARD -->
        <div class="card" style="margin-top:20px; border:1.5px solid #10B981; background:#F0FDF4; border-radius:12px; padding:18px">
          <h3 class="st" style="font-size:15px; margin:0 0 12px 0; color:#047857; display:flex; align-items:center; gap:8px">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Configuration des Fonctionnalités (Élèves)</span>
          </h3>

          <div style="display:flex; flex-direction:column; gap:14px">
            <!-- Boutique Toggle -->
            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px dashed rgba(16, 185, 129, 0.2)">
              <div>
                <strong style="font-size:13px; color:#065F46; display:block">Activer la Boutique Virtuelle 🪙</strong>
                <span style="font-size:11px; color:#047857">Permet aux élèves de dépenser leurs coins dans la boutique d'avatars et thèmes.</span>
              </div>
              <label class="switch-toggle" style="position:relative; display:inline-block; width:44px; height:24px">
                <input type="checkbox" [checked]="showBoutique()" (change)="toggleBoutique(!showBoutique())" style="opacity:0; width:0; height:0" />
                <span [style.background]="showBoutique() ? '#10B981' : '#CBD5E1'" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; transition:0.3s; border-radius:24px; display:block">
                  <span [style.transform]="showBoutique() ? 'translateX(20px)' : 'translateX(0px)'" style="position:absolute; content:''; height:18px; width:18px; left:3px; bottom:3px; background-color:white; transition:0.3s; border-radius:50%; display:block"></span>
                </span>
              </label>
            </div>

            <!-- Garden Toggle -->
            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px dashed rgba(16, 185, 129, 0.2)">
              <div>
                <strong style="font-size:13px; color:#065F46; display:block">Activer le Jardin SpeakUp Garden 🌸</strong>
                <span style="font-size:11px; color:#047857">Permet aux élèves de faire grandir leur forêt et leurs fleurs en étudiant.</span>
              </div>
              <label class="switch-toggle" style="position:relative; display:inline-block; width:44px; height:24px">
                <input type="checkbox" [checked]="showGarden()" (change)="toggleGarden(!showGarden())" style="opacity:0; width:0; height:0" />
                <span [style.background]="showGarden() ? '#10B981' : '#CBD5E1'" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; transition:0.3s; border-radius:24px; display:block">
                  <span [style.transform]="showGarden() ? 'translateX(20px)' : 'translateX(0px)'" style="position:absolute; content:''; height:18px; width:18px; left:3px; bottom:3px; background-color:white; transition:0.3s; border-radius:50%; display:block"></span>
                </span>
              </label>
            </div>

            <!-- Journey Toggle -->
            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0">
              <div>
                <strong style="font-size:13px; color:#065F46; display:block">Activer SpeakUp Journey 🗺️</strong>
                <span style="font-size:11px; color:#047857">Permet aux élèves d'accomplir des missions de voyage avec une liste d'objectifs.</span>
              </div>
              <label class="switch-toggle" style="position:relative; display:inline-block; width:44px; height:24px">
                <input type="checkbox" [checked]="showJourney()" (change)="toggleJourney(!showJourney())" style="opacity:0; width:0; height:0" />
                <span [style.background]="showJourney() ? '#10B981' : '#CBD5E1'" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; transition:0.3s; border-radius:24px; display:block">
                  <span [style.transform]="showJourney() ? 'translateX(20px)' : 'translateX(0px)'" style="position:absolute; content:''; height:18px; width:18px; left:3px; bottom:3px; background-color:white; transition:0.3s; border-radius:50%; display:block"></span>
                </span>
              </label>
            </div>
          </div>
        </div>

      } @else {
        <!-- LIVE HOST PERSISTENT CALL CARD -->
        <div style="height: 100%; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:16px; padding:40px; text-align:center; background:#111827; color:#FFF">
          <div style="width:64px; height:64px; border-radius:50%; background:rgba(239, 68, 68, 0.1); border:1px solid #EF4444; display:flex; align-items:center; justify-content:center">
            <span style="width:16px; height:16px; border-radius:50%; background:#EF4444; display:inline-block"></span>
          </div>
          <div>
            <h3 style="font-size:16px; font-weight:700; color:#FFF">Vous animez le cours live !</h3>
            <p style="font-size:12.5px; color:#9CA3AF; max-width:320px; margin:6px auto 0">La visioconférence s\'affiche en plein écran pour vous et vos élèves.</p>
          </div>
          <div style="display:flex; gap:10px; margin-top:8px">
            <button class="btn-s" style="border-color:#374151; color:#9CA3AF; background:#1F2937" (click)="exitMeeting()">
              Quitter l\'écran
            </button>
            <button class="btn-p" style="background:#EF4444; border-color:#EF4444" (click)="endClass()">
              Terminer le cours pour tous
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class TeacherOverviewComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  teacherProfile = signal<UserProfile | null>(null);
  totalStudents = signal<number>(0);
  pendingCount = signal<number>(0);
  avgAttendance = signal<number>(100);
  revenue = signal<string>('0 CFA');
  paidFraction = signal<string>('0 of 0 paid');
  needingAttention = signal<any[]>([]);
  todayClasses = signal<LiveClass[]>([]);
  activeMeeting = signal<LiveClass | null>(null);
  recentAnnouncements = signal<Announcement[]>([]);
  wordOfTheDay = signal<any>({
    word: '',
    phonetic: '',
    partOfSpeech: 'noun',
    translation: '',
    definition: '',
    example: '',
    exampleTranslation: ''
  });

  showBoutique = signal<boolean>(false);
  showGarden = signal<boolean>(false);
  showJourney = signal<boolean>(false);

  @Output() navigateToTab = new EventEmitter<string>();

  constructor() {
    this.db.observeActiveJitsiCall().subscribe(c => {
      this.activeMeeting.set(c);
    });

    this.db.observeWordOfTheDay().subscribe(w => {
      if (w) this.wordOfTheDay.set({ ...w });
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

    this.db.observeCurrentUser().subscribe(user => {
      this.teacherProfile.set(user);
    });

    // Total students & status alerts combine subscriptions
    combineLatest([
      this.db.observeUsers(),
      this.db.observeSubmissions(),
      this.db.observeAttendance()
    ]).subscribe(([users, submissions, attendance]) => {
      this.totalStudents.set(users.filter(u => u.role === 'student').length);

      // Calculate student status alerts
      const students = users.filter(u => u.role === 'student');
      const alertList: any[] = [];

      students.forEach(s => {
        // Calculate student-specific attendance
        let studentClasses = 0;
        let studentPresent = 0;
        attendance.forEach(att => {
          const status = att.records[s.id];
          if (status && status !== '-') {
            studentClasses++;
            if (status === 'P' || status === 'L') {
              studentPresent++;
            }
          }
        });
        const attRate = studentClasses > 0 ? (studentPresent / studentClasses) * 100 : 100;

        // Check submissions for low grade (e.g. 'D' or 'F')
        const studentSubs = submissions.filter(sub => sub.studentId === s.id && sub.graded);
        const lowGrades = studentSubs.filter(sub => sub.score === 'D' || (sub.score && (sub.score.includes('F') || sub.score.includes('Fail'))));

        if (studentClasses > 0 && attRate < 75) {
          alertList.push({
            student: s,
            reason: `Missed classes (Attendance rate: ${Math.round(attRate)}%)`,
            status: 'At risk',
            statusClass: 'r'
          });
        } else if (lowGrades.length > 0) {
          alertList.push({
            student: s,
            reason: `Struggling with homework (Grade: ${lowGrades[0].score})`,
            status: 'Needs help',
            statusClass: 'y'
          });
        } else if (s.xp >= 1500) {
          alertList.push({
            student: s,
            reason: `Top performer — XP: ${s.xp} · streak: ${s.streak}`,
            status: 'Ready to advance',
            statusClass: 'g'
          });
        }
      });

      this.needingAttention.set(alertList);
    });

    // Pending submissions count
    this.db.observeSubmissions().subscribe(list => {
      this.pendingCount.set(list.filter(s => !s.graded).length);
    });

    // Average attendance metric card
    this.db.observeAttendance().subscribe(list => {
      let totalMarked = 0;
      let totalPresent = 0;
      list.forEach(att => {
        Object.values(att.records).forEach(status => {
          if (status === 'P' || status === 'L') {
            totalPresent++;
            totalMarked++;
          } else if (status === 'A') {
            totalMarked++;
          }
        });
      });
      const avg = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : 100;
      this.avgAttendance.set(avg);
    });

    // Payments / Revenue metric card
    this.db.observePayments().subscribe(list => {
      const paidList = list.filter(p => p.status === 'Paid');
      const sum = paidList.reduce((acc, p) => {
        const amt = parseInt(p.amount.replace(/[^0-9]/g, '')) || 0;
        return acc + amt;
      }, 0);
      this.revenue.set(sum.toLocaleString() + ' CFA');
      this.paidFraction.set(`${paidList.length} of ${list.length} paid`);
    });

    // Today's classes
    this.db.observeSchedules().subscribe(list => {
      const todayString = new Date().toISOString().split('T')[0];
      this.todayClasses.set(list.filter(c => c.date === todayString || c.status === 'active'));
    });

    // Recent announcements
    this.db.observeAnnouncements().subscribe(list => {
      this.recentAnnouncements.set(list.slice(0, 3));
    });
  }

  startClass(c: LiveClass) {
    this.db.updateClassStatus(c.id, 'active');
    this.db.setActiveJitsiCall({ ...c, status: 'active' });
  }

  endClass() {
    const c = this.activeMeeting();
    if (c) {
      this.db.updateClassStatus(c.id, 'completed');
    }
    this.db.setActiveJitsiCall(null);
  }

  exitMeeting() {
    this.db.setActiveJitsiCall(null);
  }

  goToHomework() {
    this.navigateToTab.emit('grade-homework');
  }

  viewAnnouncement(ann: Announcement) {
    const priorityColor = ann.priority === 'Urgent' ? '#EF4444' : (ann.priority === 'Important' ? '#F59E0B' : '#4F46E5');
    const priorityBg = ann.priority === 'Urgent' ? '#FEE2E2' : (ann.priority === 'Important' ? '#FEF3C7' : '#E0E7FF');
    const priorityIcon = ann.priority === 'Urgent' ? '🔴' : (ann.priority === 'Important' ? '🟡' : '🔵');
    
    let content = `<div style="padding:4px 0">`;
    content += `<div style="background:${priorityBg}; border-left:4px solid ${priorityColor}; padding:12px 16px; border-radius:8px; margin-bottom:16px">`;
    content += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:6px">`;
    content += `<span style="font-size:18px">${priorityIcon}</span>`;
    content += `<span style="font-size:12px; font-weight:700; color:${priorityColor}; text-transform:uppercase; letter-spacing:0.5px">${ann.priority}</span>`;
    content += `</div>`;
    content += `<div style="font-size:11px; color:var(--text-muted)">📋 Sent to: <strong>${ann.sendTo}</strong></div>`;
    content += `</div>`;
    
    if (ann.imageUrl) {
      content += `<div style="margin:16px 0; border-radius:10px; overflow:hidden; border:1px solid var(--border-weak); box-shadow:0 2px 8px rgba(0,0,0,0.1)">`;
      content += `<img src="${ann.imageUrl}" style="width:100%; max-height:280px; object-fit:cover; display:block" />`;
      content += `</div>`;
    }
    
    content += `<div style="background:var(--surface-1); padding:14px 16px; border-radius:8px; border:1px solid var(--border-weak)">`;
    content += `<p style="font-size:13.5px; color:var(--text-primary); line-height:1.7; margin:0; white-space:pre-wrap">${ann.message}</p>`;
    content += `</div>`;
    
    content += `<div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--border-weak); text-align:center">`;
    content += `<span style="font-size:10px; color:var(--text-muted)">📅 Posted recently</span>`;
    content += `</div>`;
    content += `</div>`;
    
    this.dialogService.alert(ann.title, content, 'info');
  }

  saveWordOfTheDay() {
    this.db.updateWordOfTheDay(this.wordOfTheDay()).then(() => {
      this.dialogService.alert('Succès 🎉', 'Le Mot du Jour a été mis à jour avec succès et synchronisé pour tous les élèves.', 'success');
    });
  }

  toggleBoutique(val: boolean) {
    this.db.updateShowBoutique(val);
    this.dialogService.alert('Configuration mise à jour ⚙️', `La Boutique virtuelle a été ${val ? 'activée' : 'masquée'} pour tous les élèves.`, 'success');
  }

  toggleGarden(val: boolean) {
    this.db.updateShowGarden(val);
    this.dialogService.alert('Configuration mise à jour ⚙️', `Le Jardin SpeakUp Garden a été ${val ? 'activé' : 'masqué'} pour tous les élèves.`, 'success');
  }

  toggleJourney(val: boolean) {
    this.db.updateShowJourney(val);
    this.dialogService.alert('Configuration mise à jour ⚙️', `Le SpeakUp Journey a été ${val ? 'activé' : 'masqué'} pour tous les élèves et une notification leur a été envoyée.`, 'success');
  }
}