import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, Attendance, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-attendance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
          <div>
            <h3 style="font-size:15px; font-weight:600">Class Attendance Log</h3>
            <p style="font-size:11px; color:var(--text-muted)">Class: B1 Intermediate · Week of June 23, 2026</p>
          </div>
          <span style="font-size:11px; font-weight:600; color:#4F46E5; background:#EEF2FF; padding:4px 10px; border-radius:15px">
            Today: Friday
          </span>
        </div>

        <!-- Matrix Header -->
        <div class="row" style="background:var(--surface-2); font-size:11px; color:var(--text-muted); font-weight:600; border-radius:var(--radius); margin-bottom:6px">
          <div style="flex:1">Student</div>
          <div style="width:36px; text-align:center">M</div>
          <div style="width:36px; text-align:center">T</div>
          <div style="width:36px; text-align:center">W</div>
          <div style="width:36px; text-align:center">T</div>
          <div style="width:36px; text-align:center; color:#4F46E5">F (Today)</div>
          <div style="width:50px; text-align:center">Total</div>
        </div>

        <!-- Student Rows -->
        @for (student of students(); track student.id) {
          <div class="row" style="margin-bottom:4px; padding:8px 12px; font-size:13px">
            <div style="flex:1; display:flex; align-items:center; gap:8px">
              <div class="avatar" style="width:22px; height:22px; font-size:9px">
                {{ student.avatar }}
              </div>
              <strong>{{ student.name }}</strong>
            </div>

            <!-- Mon - Thu Cells (Static/Historic) -->
            <div class="att-cell" [class]="getCellClass(student.id, 'M')" style="width:36px">{{ getCellRecord(student.id, 'M') }}</div>
            <div class="att-cell" [class]="getCellClass(student.id, 'T')" style="width:36px">{{ getCellRecord(student.id, 'T') }}</div>
            <div class="att-cell" [class]="getCellClass(student.id, 'W')" style="width:36px">{{ getCellRecord(student.id, 'W') }}</div>
            <div class="att-cell" [class]="getCellClass(student.id, 'T')" style="width:36px">{{ getCellRecord(student.id, 'T') }}</div>

            <!-- Fri Cell (Clickable/Interactive) -->
            <div class="att-cell" 
                 [class]="getInteractiveCellClass(student.id)" 
                 (click)="toggleAttendance(student.id)"
                 style="width:36px; cursor:pointer; font-weight:bold; border: 1px dashed #4F46E5">
              {{ todayRecords()[student.id] || '-' }}
            </div>

            <!-- Total present score -->
            <div style="width:50px; text-align:center; font-weight:600; color:var(--text-secondary)">
              {{ calculateTotalPresent(student.id) }}/5
            </div>
          </div>
        }

        <!-- Key legend -->
        <div style="display:flex; gap:12px; font-size:11px; color:var(--text-muted); margin: 12px 0 6px">
          <span><span class="att-cell p" style="display:inline-flex; width:16px; height:16px; font-size:8px; vertical-align:middle; margin-right:4px">P</span>Present</span>
          <span><span class="att-cell a" style="display:inline-flex; width:16px; height:16px; font-size:8px; vertical-align:middle; margin-right:4px">A</span>Absent</span>
          <span><span class="att-cell l" style="display:inline-flex; width:16px; height:16px; font-size:8px; vertical-align:middle; margin-right:4px">L</span>Late</span>
          <span><span class="att-cell h" style="display:inline-flex; width:16px; height:16px; font-size:8px; vertical-align:middle; margin-right:4px">-</span>Unrecorded</span>
        </div>

        <div style="display:flex; gap:10px; margin-top:8px">
          <button class="btn-p" (click)="saveAttendance()">
            <i class="ti ti-device-floppy"></i> Save Attendance
          </button>
          <button class="btn-s" (click)="resetToday()">
            Reset Today
          </button>
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
  
  // Friday records state (interactive)
  todayRecords = signal<{ [studentId: string]: 'P' | 'A' | 'L' | '-' }>({});

  constructor() {
    this.db.observeUsers().subscribe(list => {
      this.students.set(list.filter(u => u.role === 'student'));
    });
    this.db.observeAttendance().subscribe(list => {
      this.attendanceList.set(list);
      
      // Load current Friday records if already marked
      const todayString = '2026-06-26'; // Friday of this week
      const currentSheet = list.find(a => a.date === todayString);
      if (currentSheet) {
        this.todayRecords.set({ ...currentSheet.records });
      } else {
        // Initialize with default '-'
        const initial: { [studentId: string]: 'P' | 'A' | 'L' | '-' } = {};
        this.students().forEach(s => initial[s.id] = '-');
        this.todayRecords.set(initial);
      }
    });
  }

  // Helper to fetch static attendance records for Mon-Thu
  getCellRecord(studentId: string, day: string): 'P' | 'A' | 'L' | '-' {
    if (studentId === 'ousmane') {
      if (day === 'M' || day === 'T') return 'A'; // Mon, Tue, Thu
      if (day === 'W') return 'L';
      // In this mock, Thu is checked differently or we return 'A'
      return 'A'; 
    }
    if (studentId === 'ndeye') {
      if (day === 'M' || day === 'W') return 'P';
      if (day === 'T') return 'L';
      return 'A'; // Default for Thu is Absent
    }
    if (studentId === 'fatou') return 'P';
    return 'P'; // Default others present
  }

  getCellClass(studentId: string, day: string): string {
    const code = this.getCellRecord(studentId, day);
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
    // Check Mon-Thu
    ['M', 'T', 'W', 'T'].forEach(day => {
      if (this.getCellRecord(studentId, day as any) === 'P') count++;
    });
    // Check Friday
    if (this.todayRecords()[studentId] === 'P') count++;
    return count;
  }

  saveAttendance() {
    const todayString = '2026-06-26';
    this.db.markAttendance(todayString, this.todayRecords());
    this.dialogService.alert('Success', 'Attendance log for today saved successfully!', 'success');
  }

  resetToday() {
    const reset: { [studentId: string]: 'P' | 'A' | 'L' | '-' } = {};
    this.students().forEach(s => reset[s.id] = '-');
    this.todayRecords.set(reset);
  }
}
