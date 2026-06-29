import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest } from 'rxjs';
import { DatabaseService, LiveClass, UserProfile, Submission, Announcement } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-overview',
  standalone: true,
  imports: [CommonModule],
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
}