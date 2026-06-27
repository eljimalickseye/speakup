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
        <!-- HERO LOBBY BANNER -->
        <div style="padding: 16px 20px 0 20px">
          @if (getActiveLiveClass(); as activeClass) {
            <!-- Live Session In Progress Banner (Glowing alert card) -->
            <div class="lobby-banner active">
              <div class="lobby-banner-content">
                <span class="live-badge">
                  <span class="badge-dot"></span>
                  LIVE NOW
                </span>
                <h2 class="banner-title">{{ activeClass.title }}</h2>
                <p class="banner-desc">{{ activeClass.description }}</p>
                <div class="banner-meta">
                  <span><i class="ti ti-clock"></i> Started: {{ activeClass.time }}</span>
                  <span><i class="ti ti-hourglass"></i> Duration: {{ activeClass.duration }}</span>
                  <span><i class="ti ti-users"></i> Group: {{ activeClass.group }}</span>
                </div>
                <button class="join-live-btn" (click)="joinClass(activeClass)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="23 7 16 12 23 17 23 7"/>
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                  Enter Virtual Classroom
                </button>
              </div>
              <div class="banner-visual">
                <div class="pulsing-radar"></div>
              </div>
            </div>
          } @else {
            <!-- No active class banner -->
            <div class="lobby-banner waiting">
              <div class="lobby-banner-content">
                <span class="offline-badge">CLASSROOM READY</span>
                <h2 class="banner-title" style="color:var(--text-primary)">No Active Live Class Right Now</h2>
                <p class="banner-desc" style="color:var(--text-secondary)">Your teacher will start a live session when class begins. Scheduled classes for this month are listed below.</p>
                <div class="banner-meta" style="color:var(--text-muted)">
                  <span><i class="ti ti-calendar-time"></i> Check the timeline below to prepare for your next lesson</span>
                </div>
              </div>
              <div class="banner-visual">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#818CF8" stroke-width="1.5" style="opacity: 0.7">
                  <path d="M12 7v5l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
              </div>
            </div>
          }
        </div>

        <!-- TIMELINE & CALENDAR SECTION -->
        <div style="padding: 20px">
          <div class="lobby-section-header">
            <h3 style="font-size:14px; font-weight:700; color:var(--text-primary)">CLASS SCHEDULES</h3>
            <div class="tab-row" style="margin-bottom:0; border:none; padding:0; gap:4px">
              <button class="tab" style="padding: 4px 12px; font-size:11px; height:28px" [class.active]="activeTab() === 'calendar'" (click)="activeTab.set('calendar')">
                <i class="ti ti-calendar"></i> Calendar View
              </button>
              <button class="tab" style="padding: 4px 12px; font-size:11px; height:28px" [class.active]="activeTab() === 'list'" (click)="activeTab.set('list')">
                <i class="ti ti-list"></i> Timeline List
              </button>
            </div>
          </div>

          <!-- TAB CONTENT: CALENDAR GRID -->
          @if (activeTab() === 'calendar') {
            <div style="display:flex; flex-direction:column; gap:16px; animation: fadeIn 0.25s">
              <!-- Calendar Card Wrapper -->
              <div class="calendar-wrapper">
                <div class="calendar-top-bar">
                  <div style="display:flex; align-items:center; gap:8px">
                    <button class="calendar-nav-btn" (click)="prevMonth()">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
                    </button>
                    <span class="calendar-month-title">{{ monthYearLabel() }}</span>
                    <button class="calendar-nav-btn" (click)="nextMonth()">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>

                  <!-- Legend info -->
                  <div class="calendar-legend">
                    <span class="legend-item"><span class="dot waiting"></span> Scheduled</span>
                    <span class="legend-item"><span class="dot active"></span> Live Now</span>
                    <span class="legend-item"><span class="dot completed"></span> Completed</span>
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="flex-shrink:0"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                            <span class="tag-text">{{ c.time }} · {{ c.title }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Class Details Preview Card below the calendar -->
              @if (selectedClass(); as c) {
                <div class="card event-details-card" style="animation: slideUp 0.2s ease-out">
                  <div style="display:flex; justify-content:space-between; align-items:flex-start">
                    <div>
                      <h4 class="event-details-title">{{ c.title }}</h4>
                      <div class="event-details-subtitle">
                        <i class="ti ti-calendar-event"></i> {{ c.date }} &nbsp;·&nbsp; <i class="ti ti-clock"></i> {{ c.time }} ({{ c.duration }}) &nbsp;·&nbsp; <i class="ti ti-users"></i> {{ c.group }}
                      </div>
                    </div>
                    <button class="btn-s" style="padding:4px 8px; font-size:10px" (click)="selectedClass.set(null)">
                      <i class="ti ti-x" aria-hidden="true"></i> Close
                    </button>
                  </div>

                  <p class="event-details-desc">
                    "{{ c.description }}"
                  </p>

                  <div class="event-details-actions">
                    @if (c.status === 'active') {
                      <button class="btn-p join-session-accent" (click)="joinClass(c)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:4px"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                        Join Live Session
                      </button>
                    } @else if (c.status === 'completed') {
                      <span class="pill-badge completed">Session Completed</span>
                    } @else {
                      <span class="pill-badge waiting">Session Scheduled (Waiting)</span>
                    }
                  </div>
                </div>
              }
            </div>
          }

          <!-- TAB CONTENT: TIMELINE LIST -->
          @if (activeTab() === 'list') {
            <div class="schedules-list" style="animation: fadeIn 0.25s">
              @for (c of classes(); track c.id) {
                <div class="live-timeline-item" [class.live-active]="c.status === 'active'">
                  <div class="timeline-indicator-col">
                    <div class="timeline-status-indicator" [class.active]="c.status === 'active'" [class.completed]="c.status === 'completed'">
                      @if (c.status === 'active') {
                        <span class="pulsing-inner-dot"></span>
                      }
                    </div>
                    <div class="timeline-trail-line"></div>
                  </div>

                  <div class="timeline-card">
                    <div class="timeline-card-header">
                      <div class="timeline-card-title-row">
                        <h4 class="timeline-class-title">{{ c.title }}</h4>
                        <span class="timeline-badge" [class.active]="c.status === 'active'" [class.completed]="c.status === 'completed'" [class.waiting]="c.status === 'waiting'">
                          {{ c.status === 'active' ? 'Live now' : (c.status === 'completed' ? 'Completed' : 'Scheduled') }}
                        </span>
                      </div>
                      <div class="timeline-class-meta">
                        <span><i class="ti ti-calendar"></i> {{ c.date }}</span>
                        <span><i class="ti ti-clock"></i> {{ c.time }} ({{ c.duration }})</span>
                        <span><i class="ti ti-users"></i> {{ c.group }}</span>
                      </div>
                    </div>

                    <p class="timeline-class-desc">
                      {{ c.description }}
                    </p>

                    @if (c.status === 'active') {
                      <div style="border-top:1px solid #E0E7FF; padding-top:12px; margin-top:12px">
                        <button class="join-now-btn" (click)="joinClass(c)">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:4px"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                          Connect Now
                        </button>
                      </div>
                    }
                  </div>
                </div>
              } @empty {
                <div class="empty-classroom-timeline">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom:12px">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                  </svg>
                  <p style="font-weight:600; color:var(--text-primary)">No Scheduled Classes</p>
                  <p style="color:var(--text-muted); font-size:11px; margin-top:2px">No live classes scheduled for this month.</p>
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <!-- JITSI MEET INLINE IFRAME VIEW -->
        <div style="height: 100%; display:flex; flex-direction:column; gap:12px; padding:16px; background:#111827">
          <button class="btn-s" style="align-self: flex-start; border-color:#374151; color:#9CA3AF; background:#1F2937" (click)="exitMeeting()">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Exit Video Call
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
  `,
  styles: [`
    /* Lobby hero banners */
    .lobby-banner {
      border-radius: 12px;
      padding: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
      border: 1px solid var(--border-weak);
      gap: 20px;
    }

    .lobby-banner.active {
      background: linear-gradient(135deg, #1E1B4B 0%, #311042 100%);
      border-color: #312E81;
    }

    .lobby-banner.waiting {
      background: linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%);
      border-color: #E0E7FF;
    }

    .lobby-banner-content {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      max-width: 70%;
    }

    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #DC2626;
      color: #FFF;
      font-size: 10px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 20px;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      box-shadow: 0 0 12px rgba(220, 38, 38, 0.4);
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      background: #FFF;
      border-radius: 50%;
      animation: pulse-dot 1.2s infinite;
    }

    @keyframes pulse-dot {
      0% { transform: scale(0.9); opacity: 0.5; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.5; }
    }

    .offline-badge {
      display: inline-block;
      background: #C7D2FE;
      color: #3730A3;
      font-size: 10px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 20px;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }

    .banner-title {
      font-size: 20px;
      font-weight: 800;
      color: #FFF;
      line-height: 1.2;
    }

    .banner-desc {
      font-size: 12.5px;
      color: #C7D2FE;
      margin-top: 8px;
      line-height: 1.5;
    }

    .banner-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 14px;
      font-size: 11.5px;
      color: #A5B4FC;
      font-weight: 500;
    }

    .banner-meta span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .join-live-btn {
      margin-top: 16px;
      background: #EF4444;
      color: #FFF;
      border: none;
      border-radius: 20px;
      padding: 8px 18px;
      font-size: 12.5px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
      transition: all 0.2s;
    }

    .join-live-btn:hover {
      background: #DC2626;
      transform: translateY(-1px);
    }

    /* Radar animation widget */
    .banner-visual {
      width: 70px;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .pulsing-radar {
      width: 24px;
      height: 24px;
      background: #EF4444;
      border-radius: 50%;
      position: relative;
    }

    .pulsing-radar::before {
      content: '';
      position: absolute;
      inset: -12px;
      border-radius: 50%;
      border: 2px solid #EF4444;
      opacity: 0.4;
      animation: pulse-radar 1.5s infinite ease-out;
    }

    @keyframes pulse-radar {
      0% { transform: scale(0.8); opacity: 0.8; }
      100% { transform: scale(1.6); opacity: 0; }
    }

    /* Section styling */
    .lobby-section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border-weak);
      padding-bottom: 8px;
      margin-bottom: 16px;
    }

    /* Calendar Legend info styling */
    .calendar-legend {
      display: flex;
      gap: 12px;
      font-size: 11px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--text-secondary);
    }

    .legend-item .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }

    .legend-item .dot.waiting { background: #4F46E5; }
    .legend-item .dot.active { background: #EF4444; animation: pulse-live 1.5s infinite; }
    .legend-item .dot.completed { background: #9CA3AF; }

    /* Event details card below calendar */
    .event-details-card {
      border-left: 4px solid #4F46E5; 
      display: flex; 
      flex-direction: column; 
      gap: 12px;
      background: var(--surface-1);
    }

    .event-details-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .event-details-subtitle {
      font-size: 11px;
      color: var(--text-secondary);
      margin-top: 3px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .event-details-desc {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.5;
      font-style: italic;
    }

    .event-details-actions {
      display: flex;
      gap: 10px;
      border-top: 1px solid var(--border-weak);
      padding-top: 12px;
      margin-top: 4px;
    }

    .join-session-accent {
      background: #EF4444;
      border-color: #EF4444;
      transition: background 0.2s;
    }

    .join-session-accent:hover {
      background: #DC2626;
      border-color: #DC2626;
    }

    .pill-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 12px;
    }

    .pill-badge.completed { background: #E5E7EB; color: #4B5563; }
    .pill-badge.waiting { background: #EEF2FF; color: #4F46E5; }

    /* Timeline list layout styles */
    .schedules-list {
      display: flex;
      flex-direction: column;
      gap: 0;
      padding-left: 8px;
    }

    .live-timeline-item {
      display: flex;
      gap: 16px;
    }

    .timeline-indicator-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
    }

    .timeline-status-indicator {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--border-strong);
      border: 3px solid #FFF;
      box-shadow: 0 0 0 1px var(--border);
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .timeline-status-indicator.active {
      background: #EF4444;
      box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
      border-color: #FFF;
    }

    .timeline-status-indicator.completed {
      background: #9CA3AF;
    }

    .pulsing-inner-dot {
      width: 4px;
      height: 4px;
      background: #FFF;
      border-radius: 50%;
      animation: pulse-dot 1s infinite;
    }

    .timeline-trail-line {
      width: 2px;
      flex: 1;
      background: var(--border-weak);
      min-height: 50px;
    }

    .live-timeline-item:last-child .timeline-trail-line {
      display: none;
    }

    .timeline-card {
      flex: 1;
      background: var(--surface-1);
      border: 1px solid var(--border-weak);
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      transition: all 0.2s;
    }

    .live-timeline-item.live-active .timeline-card {
      border-color: #C7D2FE;
      background: #F8FAFC;
    }

    .timeline-card-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .timeline-card-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .timeline-class-title {
      font-size: 13.5px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .timeline-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 20px;
      text-transform: uppercase;
    }

    .timeline-badge.active { background: #FEE2E2; color: #EF4444; }
    .timeline-badge.completed { background: #F3F4F6; color: #6B7280; }
    .timeline-badge.waiting { background: #EEF2FF; color: #4F46E5; }

    .timeline-class-meta {
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: var(--text-muted);
    }

    .timeline-class-meta span {
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .timeline-class-desc {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 8px;
      line-height: 1.4;
    }

    .join-now-btn {
      background: #EF4444;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 5px 12px;
      font-size: 11.5px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: background 0.15s;
    }

    .join-now-btn:hover {
      background: #DC2626;
    }

    .empty-classroom-timeline {
      text-align: center;
      padding: 40px;
      background: var(--surface-1);
      border: 1px dashed var(--border);
      border-radius: 8px;
    }

    /* Animation effects */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from { transform: translateY(8px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    /* Responsive adjustments */
    @media (max-width: 600px) {
      .lobby-banner {
        flex-direction: column;
        align-items: flex-start;
        padding: 16px;
      }
      .lobby-banner-content {
        max-width: 100%;
      }
      .banner-visual {
        display: none;
      }
      .calendar-legend {
        display: none;
      }
    }
  `]
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

  // Fetch the active live class if any
  getActiveLiveClass(): LiveClass | undefined {
    return this.classes().find(c => c.status === 'active');
  }

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
