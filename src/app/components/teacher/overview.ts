import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest } from 'rxjs';
import { DatabaseService, LiveClass, UserProfile, Submission } from '../../services/database.service';
import { JitsiMeet } from '../jitsi-meet/jitsi-meet';

@Component({
  selector: 'app-teacher-overview',
  standalone: true,
  imports: [CommonModule, JitsiMeet],
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
              {{ teacherProfile()?.description || 'You haven\'t set a profile description yet. Click your avatar in the topbar to write your biography and customize your settings.' }}
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

      } @else {
        <!-- JITSI MEET INLINE IFRAME VIEW FOR TEACHER (HOST) -->
        <div style="height: 100%; display:flex; flex-direction:column; gap:12px">
          <div style="display:flex; justify-content:space-between; align-items:center">
            <button class="btn-s" (click)="exitMeeting()">
              <i class="ti ti-arrow-left"></i> Exit Screen
            </button>
            <span style="font-size:12px; color:#EF4444; font-weight:600; text-transform:uppercase">
              Hosting Class Meeting
            </span>
          </div>

          <app-jitsi-meet 
            style="flex: 1"
            [roomName]="activeMeeting()!.jitsiRoom"
            [isTeacher]="true"
            [userName]="'Teacher (Host)'"
            [userEmail]="'teacher@speakup.com'"
            (onMeetingLeave)="exitMeeting()"
            (onMeetingEnd)="endClass()">
          </app-jitsi-meet>
        </div>
      }
    </div>
  `
})
export class TeacherOverviewComponent {
  private db = inject(DatabaseService);

  teacherProfile = signal<UserProfile | null>(null);
  totalStudents = signal<number>(0);
  pendingCount = signal<number>(0);
  avgAttendance = signal<number>(100);
  revenue = signal<string>('0 CFA');
  paidFraction = signal<string>('0 of 0 paid');
  needingAttention = signal<any[]>([]);
  todayClasses = signal<LiveClass[]>([]);
  activeMeeting = signal<LiveClass | null>(null);

  @Output() navigateToTab = new EventEmitter<string>();

  constructor() {
    this.db.observeActiveJitsiCall().subscribe(c => {
      this.activeMeeting.set(c);
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
}
