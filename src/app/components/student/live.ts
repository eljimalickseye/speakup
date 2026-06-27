import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, LiveClass, UserProfile } from '../../services/database.service';
import { JitsiMeet } from '../jitsi-meet/jitsi-meet';

@Component({
  selector: 'app-student-live',
  standalone: true,
  imports: [CommonModule, JitsiMeet],
  template: `
    <div class="page" style="height: 100%; padding:0">
      @if (!activeMeeting()) {
        <!-- Top Section Selector -->
        <div class="tab-row" style="margin-bottom:20px; border-bottom:1px solid var(--border-weak); padding-bottom:10px">
          <button class="tab" [class.active]="activeTab() === 'calendar'" (click)="activeTab.set('calendar')">
            Interactive Calendar
          </button>
          <button class="tab" [class.active]="activeTab() === 'list'" (click)="activeTab.set('list')">
            Timeline List
          </button>
        </div>

        <!-- TAB CONTENT: CALENDAR GRID -->
        @if (activeTab() === 'calendar') {
          <div style="display:flex; flex-direction:column; gap:16px">
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
                          <span>{{ c.time }} · {{ c.title }}</span>
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
                      Date: {{ c.date }} · Time: {{ c.time }} ({{ c.duration }}) · Teacher: English Instructor
                    </div>
                  </div>
                  <button class="btn-s" style="padding:2px 8px; font-size:10px" (click)="selectedClass.set(null)">
                    <i class="ti ti-x" aria-hidden="true"></i> Close
                  </button>
                </div>

                <p style="font-size:12px; color:var(--text-secondary); line-height:1.5; font-style:italic">
                  "{{ c.description }}"
                </p>

                <div style="display:flex; gap:10px; border-top:1px solid var(--border-weak); padding-top:12px; margin-top:4px">
                  @if (c.status === 'active') {
                    <button class="btn-p" style="background:#EF4444; border-color:#EF4444" (click)="joinClass(c)">
                      <i class="ti ti-video-plus" aria-hidden="true" style="margin-right:4px"></i> Join Live Session
                    </button>
                  } @else if (c.status === 'completed') {
                    <span class="badge" style="background:#E5E7EB; color:#4B5563">Session Completed</span>
                  } @else {
                    <span class="badge" style="background:#EEF2FF; color:#4F46E5">Session Scheduled (Waiting)</span>
                  }
                </div>
              </div>
            }
          </div>
        }

        <!-- TAB CONTENT: TIMELINE LIST -->
        @if (activeTab() === 'list') {
          <div class="schedules-list">
            @for (c of classes(); track c.id) {
              <div class="lesson-item" 
                   [style.background]="c.status === 'active' ? '#EEF2FF' : 'var(--surface-1)'"
                   [style.border-color]="c.status === 'active' ? '#C7D2FE' : 'var(--border)'">
                
                <div class="lesson-icon" [class.purple]="c.status === 'active'" [class.teal]="c.status !== 'active'">
                  <i class="ti ti-video" aria-hidden="true" [style.color]="c.status === 'active' ? '#EF4444' : ''"></i>
                </div>

                <div class="lesson-info">
                  <div class="lesson-title">{{ c.title }}</div>
                  <div class="lesson-meta" style="font-size: 11px">
                    {{ c.date }} · {{ c.time }} · {{ c.duration }} · {{ c.group }}
                  </div>
                  <div style="font-size:12px; color:var(--text-secondary); margin-top:4px">
                    {{ c.description }}
                  </div>
                </div>

                @if (c.status === 'active') {
                  <button class="btn-p" style="background:#EF4444" (click)="joinClass(c)">
                    <i class="ti ti-video-plus"></i> Join now
                  </button>
                } @else if (c.status === 'completed') {
                  <span class="pill" style="background:var(--border); color:var(--text-secondary)">Completed</span>
                } @else {
                  <span class="pill" style="background:#EEF2FF; color:#4F46E5">Scheduled</span>
                }
              </div>
            }

            @if (classes().length === 0) {
              <div style="text-align:center; padding:30px; font-size:12px; color:var(--text-muted)">
                No live classes scheduled for this week.
              </div>
            }
          </div>
        }
      } @else {
        <!-- JITSI MEET INLINE IFRAME VIEW -->
        <div style="height: 100%; display:flex; flex-direction:column; gap:12px">
          <button class="btn-s" style="align-self: flex-start" (click)="exitMeeting()">
            <i class="ti ti-arrow-left"></i> Exit Video Call
          </button>
          
          <app-jitsi-meet 
            style="flex: 1"
            [roomName]="activeMeeting()!.jitsiRoom"
            [isTeacher]="false"
            [userName]="currentUser()?.name || 'English Student'"
            [userEmail]="currentUser()?.id + '@speakup.com'"
            (onMeetingLeave)="exitMeeting()">
          </app-jitsi-meet>
        </div>
      }
    </div>
  `
})
export class StudentLiveClassesComponent {
  private db = inject(DatabaseService);

  activeTab = signal<'calendar' | 'list'>('calendar');
  classes = signal<LiveClass[]>([]);
  currentUser = signal<UserProfile | null>(null);
  activeMeeting = signal<LiveClass | null>(null);

  // Month navigation calendar states
  currentDate = signal<Date>(new Date());
  selectedClass = signal<LiveClass | null>(null);

  // Computed label for calendar header
  monthYearLabel = computed(() => {
    return this.currentDate().toLocaleDateString('default', { month: 'long', year: 'numeric' });
  });

  // Computed 42 slots of calendar
  calendarDays = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const list = this.classes();

    const days: { key: string; dayNum: number; isCurrentMonth: boolean; isToday: boolean; classes: LiveClass[] }[] = [];

    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();

    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Padding preceding month
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthTotalDays - i);
      const dStr = d.toISOString().split('T')[0];
      days.push({
        key: `prev-${prevMonthTotalDays - i}`,
        dayNum: prevMonthTotalDays - i,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        classes: list.filter(c => c.date === dStr)
      });
    }

    // Current month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const dStr = d.toISOString().split('T')[0];
      days.push({
        key: `curr-${i}`,
        dayNum: i,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        classes: list.filter(c => c.date === dStr)
      });
    }

    // Padding succeeding month
    const remainingSlots = 42 - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const d = new Date(year, month + 1, i);
      const dStr = d.toISOString().split('T')[0];
      days.push({
        key: `next-${i}`,
        dayNum: i,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        classes: list.filter(c => c.date === dStr)
      });
    }

    return days;
  });

  constructor() {
    this.db.observeSchedules().subscribe(list => {
      this.classes.set(list);

      // Keep active calendar details in sync
      const active = this.selectedClass();
      if (active) {
        const fresh = list.find(c => c.id === active.id);
        this.selectedClass.set(fresh || null);
      }
    });
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
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

  joinClass(c: LiveClass) {
    this.activeMeeting.set(c);
  }

  exitMeeting() {
    this.activeMeeting.set(null);
  }
}
