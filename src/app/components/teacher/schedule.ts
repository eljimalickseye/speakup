import { Component, inject, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, LiveClass, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="padding:0">
      <!-- Analytics Stats Banner -->
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:20px; background:linear-gradient(135deg, #4F46E5 0%, #3730A3 100%); padding:16px; border-radius:12px; color:white; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.15)">
        <div style="text-align:center; border-right:1px solid rgba(255,255,255,0.15)">
          <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.5px; opacity:0.85">Total Classes</div>
          <div style="font-size:18px; font-weight:800; margin-top:4px">{{ classesList().length }}</div>
        </div>
        <div style="text-align:center; border-right:1px solid rgba(255,255,255,0.15)">
          <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.5px; opacity:0.85">Live Now</div>
          <div style="font-size:18px; font-weight:800; margin-top:4px; display:flex; align-items:center; justify-content:center; gap:6px">
            @if (activeLiveCount() > 0) {
              <span style="background:#EF4444; width:8px; height:8px; border-radius:50%; display:inline-block; animation: pulse-live 1.5s infinite"></span>
            }
            {{ activeLiveCount() }}
          </div>
        </div>
        <div style="text-align:center; border-right:1px solid rgba(255,255,255,0.15)">
          <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.5px; opacity:0.85">Completed</div>
          <div style="font-size:18px; font-weight:800; margin-top:4px">{{ completedLiveCount() }}</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:10px; text-transform:uppercase; letter-spacing:0.5px; opacity:0.85">Upcoming</div>
          <div style="font-size:18px; font-weight:800; margin-top:4px">{{ upcomingLiveCount() }}</div>
        </div>
      </div>

      <!-- Section Tabs -->
      <div class="tab-row" style="margin-bottom:20px; border-bottom:1px solid var(--border-weak); padding-bottom:10px">
        <button class="tab" [class.active]="activeTab() === 'calendar'" (click)="activeTab.set('calendar')">
          Interactive Calendar
        </button>
        <button class="tab" [class.active]="activeTab() === 'form'" (click)="activeTab.set('form')">
          Schedule New Class
        </button>
      </div>

      <!-- Tab Content: Calendar Grid -->
      @if (activeTab() === 'calendar') {
        <div style="display:flex; flex-direction:column; gap:16px">
          <!-- Calendar Filters Row -->
          <div style="display:flex; gap:10px; background:var(--surface-2); border:1px solid var(--border-weak); padding:8px 12px; border-radius:8px; flex-wrap:wrap; align-items:center">
            <span style="font-size:11px; font-weight:700; color:var(--text-secondary); display:flex; align-items:center; gap:4px">
              <i class="ti ti-filter" aria-hidden="true" style="font-size:13px"></i> Filtrer :
            </span>
            
            <!-- Filter by Group -->
            <select [ngModel]="filterGroup()" (ngModelChange)="filterGroup.set($event)" style="font-size:11.5px; padding:4px 8px; border:1px solid var(--border); border-radius:6px; background:#FFF; min-width:120px; color:var(--text-primary)">
              <option value="all">Tous les groupes (All)</option>
              <option value="general">general</option>
              @for (chan of channels(); track chan.id) {
                <option [value]="chan.name">{{ chan.name }}</option>
              }
            </select>

            <!-- Filter by Status -->
            <select [ngModel]="filterStatus()" (ngModelChange)="filterStatus.set($event)" style="font-size:11.5px; padding:4px 8px; border:1px solid var(--border); border-radius:6px; background:#FFF; min-width:120px; color:var(--text-primary)">
              <option value="all">Tous les statuts (All)</option>
              <option value="waiting">Scheduled (Programmé)</option>
              <option value="active">Live Now (En Direct)</option>
              <option value="completed">Completed (Terminé)</option>
            </select>
          </div>

          <!-- Calendar Card Wrapper -->
          <div class="calendar-wrapper">
            <div class="calendar-top-bar">
              <div style="display:flex; align-items:center; gap:8px">
                <button class="calendar-nav-btn" (click)="prevMonth()">
                  <i class="ti ti-chevron-left" aria-hidden="true"></i>
                </button>
                <span class="calendar-month-title">{{ monthYearLabel() }}</span>
                <button class="calendar-nav-btn" (click)="nextMonth()">
                  <i class="ti ti-chevron-right" aria-hidden="true"></i>
                </button>
              </div>

              <!-- Legend info -->
              <div style="display:flex; gap:10px; font-size:10px">
                <span style="display:flex; align-items:center; gap:4px"><span style="width:8px; height:8px; border-radius:50%; background:#4F46E5"></span> Scheduled</span>
                <span style="display:flex; align-items:center; gap:4px"><span style="width:8px; height:8px; border-radius:50%; background:#EF4444; animation: pulse-live 1.5s infinite"></span> Live Now</span>
                <span style="display:flex; align-items:center; gap:4px"><span style="width:8px; height:8px; border-radius:50%; background:#9CA3AF"></span> Completed</span>
              </div>
            </div>

            <!-- Weekday headers -->
            <div class="calendar-weekdays-grid">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            <!-- Day cells -->
            <div class="calendar-days-grid">
              @for (day of calendarDays(); track day.key) {
                <div class="calendar-day-cell" 
                     [class.other-month]="!day.isCurrentMonth"
                     [class.is-today]="day.isToday">
                  <span class="day-num">{{ day.dayNum }}</span>
                  
                   <div class="calendar-events-list">
                     @for (c of day.classes; track c.id) {
                       <div class="calendar-class-tag" 
                            [class.waiting]="c.status === 'waiting'"
                            [class.active]="c.status === 'active'"
                            [class.completed]="c.status === 'completed'"
                            (click)="selectClass(c); $event.stopPropagation()">
                         <i class="ti ti-video" aria-hidden="true" style="font-size:10px"></i>
                         <span style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">{{ c.time }} · {{ c.title }}</span>
                         <button class="btn-delete-tag" (click)="cancelClass(c); $event.stopPropagation()" title="Delete this class">
                           <i class="ti ti-trash" aria-hidden="true" style="font-size:9px"></i>
                         </button>
                       </div>
                     }
                   </div>
                </div>
              }
            </div>
          </div>

          <!-- Class Details Preview Card below the calendar -->
          @if (selectedClass(); as c) {
            <div class="card" style="border-left:4px solid #4F46E5; display:flex; flex-direction:column; gap:12px; animation: fadeIn 0.2s">
              <div style="display:flex; justify-content:space-between; align-items:flex-start">
                <div>
                  <h4 style="font-size:14px; font-weight:700; color:var(--text-primary)">{{ c.title }}</h4>
                  <div style="font-size:11px; color:var(--text-secondary); margin-top:2px">
                    Date: {{ c.date }} · Time: {{ c.time }} ({{ c.duration }}) · Target: {{ c.group }}
                  </div>
                </div>
                <button class="btn-s" style="padding:2px 8px; font-size:10px" (click)="selectedClass.set(null)">
                  <i class="ti ti-x" aria-hidden="true"></i> Close
                </button>
              </div>

              <p style="font-size:12px; color:var(--text-secondary); line-height:1.5; font-style:italic">
                "{{ c.description }}"
              </p>

              <!-- Google Meet Style Link Box -->
              <div style="background:#FAF5FF; border:1px solid #E9D5FF; border-radius:8px; padding:12px; margin-bottom:12px; margin-top:8px">
                <div style="font-size:11px; font-weight:700; color:#7E22CE; display:flex; align-items:center; gap:4px">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  <span>Meeting Link (Google Meet)</span>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px; flex-wrap:wrap; gap:8px">
                  <a [href]="c.googleMeetUrl ? c.googleMeetUrl : 'https://meet.google.com/spk-' + c.jitsiRoom.toLowerCase().slice(-10)"
                     target="_blank"
                     (click)="startAndJoinClass(c)"
                     style="font-size:12px; font-weight:600; color:#4F46E5; text-decoration:underline; cursor:pointer; font-family:monospace">
                    {{ c.googleMeetUrl ? c.googleMeetUrl : 'https://meet.google.com/spk-' + c.jitsiRoom.toLowerCase().slice(-10) }}
                  </a>
                  <span class="badge" [style.background]="c.status === 'active' ? '#EF4444' : '#E5E7EB'" [style.color]="c.status === 'active' ? 'white' : '#4B5563'" style="font-size:9px">
                    {{ c.status === 'active' ? 'Live Now' : 'Click Link to Start Live' }}
                  </span>
                </div>
              </div>

              <div style="display:flex; gap:10px; border-top:1px solid var(--border-weak); padding-top:12px; margin-top:4px">
                @if (c.status === 'waiting') {
                  <button class="btn-p" style="background:#EF4444; border-color:#EF4444" (click)="startLiveNow(c)">
                    <i class="ti ti-video-plus" aria-hidden="true" style="margin-right:4px"></i> Start Live Now
                  </button>
                } @else if (c.status === 'active') {
                  <button class="btn-p" style="background:#3730A3; border-color:#3730A3" (click)="joinActiveLive(c)">
                    <i class="ti ti-video" aria-hidden="true" style="margin-right:4px"></i> Join Call
                  </button>
                  <button class="btn-s" style="color:#EF4444; border-color:#EF4444" (click)="endLiveClass(c)">
                    <i class="ti ti-square-rounded-x" aria-hidden="true" style="margin-right:4px"></i> End Session
                  </button>
                } @else {
                  <span class="badge" style="background:#E5E7EB; color:#4B5563">Session Completed</span>
                }
                
                <button class="btn-s" style="margin-left:auto; border-color:#EF4444; color:#EF4444" (click)="cancelClass(c)">
                  <i class="ti ti-trash" aria-hidden="true"></i> Delete Schedule
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Tab Content: Schedule Form -->
      @if (activeTab() === 'form') {
        <div class="card" style="max-width:700px; margin: 0 auto">
          <h3 style="font-size:15px; font-weight:700; color:var(--text-primary); margin-bottom:16px; border-bottom:1px solid var(--border-weak); padding-bottom:8px">
            Schedule a New Lesson
          </h3>
          
          <div class="input-row">
            <label for="cTitle" style="font-size:11px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:4px">Class Title</label>
            <input id="cTitle" type="text" [(ngModel)]="title" placeholder="e.g. B1 — Reported Speech Practice" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:var(--radius); font-size:12px" />
          </div>

          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:14px; margin-top:12px">
            <div class="input-row">
              <label for="cDate" style="font-size:11px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:4px">Date</label>
              <input id="cDate" type="date" [(ngModel)]="date" style="width:100%; padding:9px; border:1px solid var(--border); border-radius:var(--radius); font-size:12px" />
            </div>
            <div class="input-row">
              <label for="cTime" style="font-size:11px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:4px">Time</label>
              <input id="cTime" type="time" [(ngModel)]="time" style="width:100%; padding:9px; border:1px solid var(--border); border-radius:var(--radius); font-size:12px" />
            </div>
            <div class="input-row">
              <label for="cDuration" style="font-size:11px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:4px">Duration</label>
              <select id="cDuration" [(ngModel)]="duration" style="width:100%; padding:9px; border:1px solid var(--border); border-radius:var(--radius); font-size:12px">
                <option value="30 minutes">30 minutes</option>
                <option value="45 minutes">45 minutes</option>
                <option value="60 minutes">60 minutes</option>
                <option value="90 minutes">90 minutes</option>
              </select>
            </div>
            <div class="input-row">
              <label style="font-size:11px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:4px">Type de session</label>
              <select [(ngModel)]="sessionType" style="width:100%; padding:9px; border:1px solid var(--border); border-radius:var(--radius); font-size:12px; background:#FFF; color:var(--text-primary)">
                <option value="group">Classe de groupe (Group Class)</option>
                <option value="one-to-one">Session 1-à-1 (1-to-1 Call)</option>
              </select>
            </div>

            @if (sessionType === 'group') {
              <div class="input-row">
                <label for="cGroup" style="font-size:11px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:4px">Target Group</label>
                <select id="cGroup" [(ngModel)]="group" style="width:100%; padding:9px; border:1px solid var(--border); border-radius:var(--radius); font-size:12px; background:#FFF; color:var(--text-primary)">
                  @for (chan of channels(); track chan.id) {
                    <option [value]="chan.name">{{ chan.name }}</option>
                  }
                  @if (channels().length === 0) {
                    <option value="general">general</option>
                  }
                </select>
              </div>
            } @else {
              <div class="input-row">
                <label style="font-size:11px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:4px">Sélectionner l'élève</label>
                <select [(ngModel)]="selectedStudentId" style="width:100%; padding:9px; border:1px solid var(--border); border-radius:var(--radius); font-size:12px; background:#FFF; color:var(--text-primary)">
                  <option value="" disabled>-- Choisir un étudiant --</option>
                  @for (s of students(); track s.id) {
                    <option [value]="s.id">{{ s.name }} ({{ s.level }})</option>
                  }
                </select>
              </div>
            }
          </div>

          @if (hasTimeConflict()) {
            <div style="background:#FFFBEB; border:1.5px solid #F59E0B; border-radius:8px; padding:10px 14px; margin-top:12px; display:flex; align-items:center; gap:8px; color:#B45309; font-size:12px; font-weight:700">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
              <span>Conflit d'horaire détecté : Une autre session est déjà planifiée à cette date et heure !</span>
            </div>
          }

          <div class="input-row" style="margin-top:12px">
            <label for="cMeetUrl" style="font-size:11px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:4px">Lien Google Meet (Optionnel)</label>
            <input id="cMeetUrl" type="text" [(ngModel)]="googleMeetUrl" placeholder="https://meet.google.com/abc-defg-hij" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:var(--radius); font-size:12px" />
          </div>

          <div class="input-row" style="margin-top:12px">
            <label for="cDesc" style="font-size:11px; font-weight:600; color:var(--text-secondary); display:block; margin-bottom:4px">Session Objectives & Agenda</label>
            <textarea id="cDesc" [(ngModel)]="description" rows="3" placeholder="What should students prepare? (vocab, grammar reading...)" style="width:100%; padding:10px; border:1px solid var(--border); border-radius:var(--radius); font-size:12px"></textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:20px; border-top:1px solid var(--border-weak); padding-top:14px">
            <button class="btn-p" [disabled]="!isValid()" (click)="schedule()">
              Schedule Class
            </button>
            <button class="btn-p" style="background:#EF4444; border-color:#EF4444" [disabled]="!title.trim() || !description.trim()" (click)="goLiveNowDirectly()">
              Start Live Now
            </button>
            <button class="btn-s" (click)="resetForm()">
              Clear
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class TeacherScheduleComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  activeTab = signal<'calendar' | 'form'>('calendar');
  classesList = signal<LiveClass[]>([]);

  // Month tracking state
  currentDate = signal<Date>(new Date());

  // Details focus state
  selectedClass = signal<LiveClass | null>(null);

  // Form states
  title = 'B1 — Reported Speech Practice';
  date = this.getLocalDateString(new Date(Date.now() + 86400000));
  time = '10:00';
  duration = '45 minutes';
  group = 'general';
  description = 'In this live session, we will practice reported speech in English. Please complete your vocabulary check before joining.';
  sessionType = 'group';
  selectedStudentId = '';
  students = signal<UserProfile[]>([]);
  channels = signal<any[]>([]);
  
  googleMeetUrl = '';

  activeLiveCount = computed(() => this.classesList().filter(c => c.status === 'active').length);
  completedLiveCount = computed(() => this.classesList().filter(c => c.status === 'completed').length);
  upcomingLiveCount = computed(() => this.classesList().filter(c => c.status === 'waiting').length);

  @Output() navigateToTab = new EventEmitter<string>();

  // Computed label for calendar header (e.g. "June 2026")
  monthYearLabel = computed(() => {
    return this.currentDate().toLocaleDateString('default', { month: 'long', year: 'numeric' });
  });

  // Overlap and conflict tracking
  hasTimeConflict = computed(() => {
    const tDate = this.date;
    const tTime = this.time;
    return this.classesList().some(c => c.date === tDate && c.time === tTime);
  });

  // Calendar filtering signals
  filterGroup = signal<string>('all');
  filterStatus = signal<'all' | 'waiting' | 'active' | 'completed'>('all');

  // Filtered classes list
  filteredClassesList = computed(() => {
    let list = this.classesList();
    const grp = this.filterGroup();
    const stat = this.filterStatus();

    if (grp !== 'all') {
      list = list.filter(c => c.group === grp || (c.group && c.group.includes(grp)));
    }
    if (stat !== 'all') {
      list = list.filter(c => c.status === stat);
    }
    return list;
  });

  // Computed 42 slots of calendar
  calendarDays = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const classes = this.filteredClassesList();

    const days: { key: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean; classes: LiveClass[] }[] = [];

    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0: Sun, 1: Mon, etc.

    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const today = new Date();
    const todayStr = this.getLocalDateString(today);

    // Padding previous month slots
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthTotalDays - i);
      const dStr = this.getLocalDateString(d);
      days.push({
        key: `prev-${prevMonthTotalDays - i}`,
        dayNum: prevMonthTotalDays - i,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        classes: classes.filter(c => c.date === dStr)
      });
    }

    // Current month slots
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const dStr = this.getLocalDateString(d);
      days.push({
        key: `curr-${i}`,
        dayNum: i,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        classes: classes.filter(c => c.date === dStr)
      });
    }

    // Padding next month slots
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(year, month + 1, i);
      const dStr = this.getLocalDateString(d);
      days.push({
        key: `next-${i}`,
        dayNum: i,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        classes: classes.filter(c => c.date === dStr)
      });
    }

    return days;
  });

  constructor() {
    this.db.observeSchedules().subscribe(list => {
      this.classesList.set(list);
      
      // Update selected class details if database updates
      const active = this.selectedClass();
      if (active) {
        const fresh = list.find(c => c.id === active.id);
        this.selectedClass.set(fresh || null);
      }
    });

    this.db.observeUsers().subscribe(list => {
      this.students.set(list.filter(u => u.role === 'student'));
    });

    this.db.observeChannels().subscribe(list => {
      this.channels.set(list);
    });
  }

  prevMonth() {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth() {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  selectClass(c: LiveClass) {
    this.selectedClass.set(c);
  }

  isValid() {
    return this.title.trim() && this.date && this.time && this.description.trim();
  }

  schedule() {
    if (!this.isValid()) return;

    let targetGroup = this.group;
    let studentId: string | undefined = undefined;

    if (this.sessionType === 'one-to-one') {
      const student = this.students().find(s => s.id === this.selectedStudentId);
      if (student) {
        targetGroup = `1-to-1: ${student.name}`;
        studentId = student.id;
      } else {
        this.dialogService.alert('Erreur', 'Veuillez sélectionner un étudiant pour la session 1-à-1.', 'info');
        return;
      }
    }

    this.db.scheduleClass({
      title: this.title,
      date: this.date,
      time: this.time,
      duration: this.duration,
      group: targetGroup,
      description: this.description,
      studentId: studentId,
      googleMeetUrl: this.googleMeetUrl.trim() || undefined
    });

    this.db.sendNotification({
      recipientId: studentId || 'all',
      recipientRole: studentId ? undefined : 'student',
      type: 'live_started',
      title: '📅 Nouveau cours programmé',
      message: `Le cours en direct "${this.title}" a été planifié pour le ${this.date} à ${this.time} (${this.duration}).`,
      link: 'live-classes'
    });

    this.dialogService.alert('Class Scheduled', 'Live Class scheduled successfully!', 'success');
    this.resetForm();
    this.activeTab.set('calendar');
  }

  goLiveNowDirectly() {
    if (!this.title.trim() || !this.description.trim()) return;

    const today = new Date();
    const dateStr = this.getLocalDateString(today);
    const timeStr = today.toTimeString().split(' ')[0].slice(0, 5);

    let targetGroup = this.group;
    let studentId: string | undefined = undefined;

    if (this.sessionType === 'one-to-one') {
      const student = this.students().find(s => s.id === this.selectedStudentId);
      if (student) {
        targetGroup = `1-to-1: ${student.name}`;
        studentId = student.id;
      } else {
        this.dialogService.alert('Erreur', 'Veuillez sélectionner un étudiant pour la session 1-à-1.', 'info');
        return;
      }
    }

    this.db.scheduleClass({
      title: this.title,
      date: dateStr,
      time: timeStr,
      duration: this.duration,
      group: targetGroup,
      description: this.description,
      studentId: studentId,
      googleMeetUrl: this.googleMeetUrl.trim() || undefined
    }, 'active').then(created => {
      if (created) {
        this.db.setActiveJitsiCall(created);
        this.db.sendNotification({
          recipientId: studentId || 'all',
          recipientRole: studentId ? undefined : 'student',
          type: 'live_started',
          title: '🔴 Cours en direct démarré !',
          message: `Le cours en direct "${this.title}" vient de commencer. Rejoignez-le maintenant !`,
          link: 'live-classes'
        });
      }
    });

    this.resetForm();
    this.activeTab.set('calendar');
  }

  // --- Actions inside calendar preview ---
  startLiveNow(c: LiveClass) {
    this.db.updateClassStatus(c.id, 'active');
    this.db.setActiveJitsiCall({ ...c, status: 'active' });
    this.db.logAction('live_started', `A démarré la session de cours: "${c.title}"`, c.id);
    this.db.sendNotification({
      recipientId: c.studentId || 'all',
      recipientRole: c.studentId ? undefined : 'student',
      type: 'live_started',
      title: '🔴 Cours en direct démarré !',
      message: `Le cours en direct "${c.title}" vient de commencer. Rejoignez-le maintenant !`,
      link: 'live-classes'
    });
  }

  startAndJoinClass(c: LiveClass) {
    if (c.status === 'waiting') {
      this.db.updateClassStatus(c.id, 'active');
      this.db.setActiveJitsiCall({ ...c, status: 'active' });
      this.db.logAction('live_started', `A démarré la session de cours: "${c.title}"`, c.id);
      this.db.sendNotification({
        recipientId: c.studentId || 'all',
        recipientRole: c.studentId ? undefined : 'student',
        type: 'live_started',
        title: '🔴 Cours en direct démarré !',
        message: `Le cours en direct "${c.title}" vient de commencer. Rejoignez-le maintenant !`,
        link: 'live-classes'
      });
    } else if (c.status === 'active') {
      this.db.setActiveJitsiCall(c);
    } else {
      this.dialogService.alert('Session Completed', 'This live session is already completed.', 'info');
    }
  }

  joinActiveLive(c: LiveClass) {
    this.db.setActiveJitsiCall(c);
  }

  endLiveClass(c: LiveClass) {
    this.db.updateClassStatus(c.id, 'completed');
    this.db.logAction('live_ended', `A terminé la session de cours: "${c.title}"`, c.id);
    this.dialogService.alert('Session Completed', 'Live meeting session closed successfully.', 'success');
  }

  cancelClass(c: LiveClass) {
    this.dialogService.confirm(
      'Delete Schedule',
      `Are you sure you want to cancel and delete the scheduled class "${c.title}"?`,
      () => {
        this.db.deleteClass(c.id);
        this.selectedClass.set(null);
        this.dialogService.alert('Deleted', 'Schedule removed successfully.', 'success');
      }
    );
  }

  resetForm() {
    this.title = '';
    this.date = '';
    this.description = '';
    this.googleMeetUrl = '';
  }

  private getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getDefaultDueDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return this.getLocalDateString(d);
  }
}