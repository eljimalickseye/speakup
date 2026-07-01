import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TitleCasePipe } from '@angular/common';
import { DatabaseService, Attendance, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-attendance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; flex-wrap:wrap; gap:8px">
          <div>
            <h3 style="font-size:15px; font-weight:700; color:var(--text-primary); margin:0 0 4px 0">Class Attendance Log</h3>
            <p style="font-size:11px; color:var(--text-muted); margin:0">
              Class: B1 Intermediate · Week of {{ weekLabel() }}
            </p>
          </div>
          <span style="font-size:11px; font-weight:700; color:#4F46E5; background:#EEF2FF; padding:5px 12px; border-radius:20px; white-space:nowrap">
            Today: {{ todayFullName() }}
          </span>
        </div>

        <!-- Matrix Header -->
        <div class="row" style="background:var(--surface-2); font-size:11px; color:var(--text-muted); font-weight:700; border-radius:var(--radius); margin-bottom:6px; padding: 8px 12px">
          <div style="flex:1">Student</div>
          @for (day of weekDays(); track day.key) {
            <div style="width:52px; text-align:center;" [style.color]="day.isToday ? '#4F46E5' : 'var(--text-muted)'">
              <div>{{ day.shortLabel }}</div>
              @if (day.isToday) {
                <div style="font-size:9px; font-weight:600; color:#4F46E5">(Today)</div>
              }
            </div>
          }
          <div style="width:50px; text-align:center">Total</div>
        </div>

        <!-- Student Rows -->
        @for (student of students(); track student.id) {
          <div class="row" style="margin-bottom:4px; padding:8px 12px; font-size:13px">
            <div style="flex:1; display:flex; align-items:center; gap:8px">
              <div class="avatar" style="width:28px; height:28px; font-size:10px; flex-shrink:0">
                {{ student.avatar || getInitials(student.name) }}
              </div>
              <strong>{{ student.name }}</strong>
            </div>

            @for (day of weekDays(); track day.key) {
              @if (day.isToday) {
                <!-- Today Column: Interactive -->
                <div class="att-cell"
                     [class]="getInteractiveCellClass(student.id)"
                     (click)="toggleAttendance(student.id)"
                     style="width:52px; cursor:pointer; font-weight:bold; border: 1.5px dashed #4F46E5; border-radius:6px">
                  {{ todayRecords()[student.id] || '-' }}
                </div>
              } @else {
                <!-- Past/Future columns -->
                <div class="att-cell" [class]="getCellClass(student.id, day.key)" style="width:52px">
                  {{ getCellRecord(student.id, day.key) }}
                </div>
              }
            }

            <!-- Total present score -->
            <div style="width:50px; text-align:center; font-weight:600; color:var(--text-secondary)">
              {{ calculateTotalPresent(student.id) }}/{{ weekDays().length }}
            </div>
          </div>
        }

        <!-- Key legend -->
        <div style="display:flex; gap:14px; font-size:11px; color:var(--text-muted); margin: 14px 0 8px; flex-wrap:wrap">
          <span>
            <span class="att-cell p" style="display:inline-flex; width:16px; height:16px; font-size:8px; vertical-align:middle; margin-right:4px">P</span>
            Present
          </span>
          <span>
            <span class="att-cell a" style="display:inline-flex; width:16px; height:16px; font-size:8px; vertical-align:middle; margin-right:4px">A</span>
            Absent
          </span>
          <span>
            <span class="att-cell l" style="display:inline-flex; width:16px; height:16px; font-size:8px; vertical-align:middle; margin-right:4px">L</span>
            Late
          </span>
          <span>
            <span class="att-cell h" style="display:inline-flex; width:16px; height:16px; font-size:8px; vertical-align:middle; margin-right:4px">-</span>
            Unrecorded
          </span>
        </div>

        <div style="display:flex; gap:10px; margin-top:10px">
          <button class="btn-p" (click)="saveAttendance()">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
            Save Attendance
          </button>
          <button class="btn-s" (click)="resetToday()">Reset Today</button>
        </div>
      </div>
    </div>
  `
})
export class TeacherAttendanceComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  students = signal<UserProfile[]>([]);
  attendanceList = signal<Attendance[]>([]);
  todayRecords = signal<{ [studentId: string]: 'P' | 'A' | 'L' | '-' }>({});

  // Day labels in English
  private readonly DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  private readonly DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Compute Monday of the current week
  currentWeekMonday = computed(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
    const diffToMonday = (dayOfWeek === 0) ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  // Compute Mon-Fri days for the current week
  weekDays = computed(() => {
    const monday = this.currentWeekMonday();
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const todayTime = todayDate.getTime();

    return [0, 1, 2, 3, 4].map(offset => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + offset);
      const isToday = d.getTime() === todayTime;
      const jsDay = d.getDay(); // 1=Mon...5=Fri
      return {
        key: this.dateKey(d),           // "2026-07-01"
        shortLabel: this.DAY_SHORT[jsDay], // "Lun", "Mar"...
        fullLabel: this.DAY_NAMES[jsDay],
        isToday,
        isFuture: d.getTime() > todayTime,
        date: d
      };
    });
  });

  todayFullName = computed(() => {
    const today = new Date();
    return this.DAY_NAMES[today.getDay()];
  });

  weekLabel = computed(() => {
    const monday = this.currentWeekMonday();
    return monday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  });

  private dateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private todayKey = this.dateKey(new Date());

  constructor() {
    this.db.observeUsers().subscribe(list => {
      this.students.set(list.filter(u => u.role === 'student'));
    });
    this.db.observeAttendance().subscribe(list => {
      this.attendanceList.set(list);
      const todaySheet = list.find(a => a.date === this.todayKey);
      if (todaySheet) {
        this.todayRecords.set({ ...todaySheet.records });
      } else {
        const initial: { [studentId: string]: 'P' | 'A' | 'L' | '-' } = {};
        this.students().forEach(s => initial[s.id] = '-');
        this.todayRecords.set(initial);
      }
    });
  }

  // Fetch attendance record for a non-today day from saved attendance data
  getCellRecord(studentId: string, dateKey: string): 'P' | 'A' | 'L' | '-' {
    const sheet = this.attendanceList().find(a => a.date === dateKey);
    if (sheet && sheet.records[studentId]) {
      return sheet.records[studentId] as 'P' | 'A' | 'L' | '-';
    }
    return '-';
  }

  getCellClass(studentId: string, dateKey: string): string {
    const code = this.getCellRecord(studentId, dateKey);
    if (code === 'P') return 'p';
    if (code === 'A') return 'a';
    if (code === 'L') return 'l';
    return 'h';
  }

  getInteractiveCellClass(studentId: string): string {
    const code = this.todayRecords()[studentId] || '-';
    if (code === 'P') return 'p';
    if (code === 'A') return 'a';
    if (code === 'L') return 'l';
    return 'h';
  }

  toggleAttendance(studentId: string) {
    const records = { ...this.todayRecords() };
    const current = records[studentId] || '-';
    let next: 'P' | 'A' | 'L' | '-';
    if (current === '-') next = 'P';
    else if (current === 'P') next = 'A';
    else if (current === 'A') next = 'L';
    else next = '-';
    records[studentId] = next;
    this.todayRecords.set(records);
  }

  calculateTotalPresent(studentId: string): number {
    let count = 0;
    // Past days from attendance records
    this.weekDays().forEach(day => {
      if (day.isToday) {
        if (this.todayRecords()[studentId] === 'P') count++;
      } else if (!day.isFuture) {
        if (this.getCellRecord(studentId, day.key) === 'P') count++;
      }
    });
    return count;
  }

  getInitials(name: string): string {
    return name ? name.slice(0, 2).toUpperCase() : '??';
  }

  saveAttendance() {
    this.db.markAttendance(this.todayKey, this.todayRecords());
    this.dialogService.alert('Saved', 'Attendance for today saved successfully!', 'success');
  }

  resetToday() {
    const reset: { [studentId: string]: 'P' | 'A' | 'L' | '-' } = {};
    this.students().forEach(s => reset[s.id] = '-');
    this.todayRecords.set(reset);
  }
}
