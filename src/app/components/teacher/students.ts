import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, UserProfile, Attendance } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="tab-row">
        <button class="tab" [class.active]="activeTab() === 'all'" (click)="activeTab.set('all')">All students</button>
        <button class="tab" [class.active]="activeTab() === 'progress'" (click)="activeTab.set('progress')">Skill Progress</button>
        <button class="tab" [class.active]="activeTab() === 'profile'" (click)="activeTab.set('profile')">
          Student profile {{ selectedStudent() ? ' (' + selectedStudent()!.name + ')' : '' }}
        </button>
      </div>

      <!-- ALL STUDENTS LIST -->
      @if (activeTab() === 'all') {
        <div style="display:flex; flex-direction:column; gap:4px; overflow-x:auto">
          <!-- Table Header -->
          <div class="row" style="background:var(--surface-2); font-size:11px; color:var(--text-muted); font-weight:600; border-radius:var(--radius)">
            <div style="width:160px">Name</div>
            <div style="width:60px">Level</div>
            <div style="width:80px; text-align:center">Attendance</div>
            <div style="width:80px; text-align:center">XP</div>
            <div style="flex:1">Last active</div>
            <div style="width:80px">Status</div>
            <div style="width:100px; text-align:right">Action</div>
          </div>
          
          <!-- Table Rows -->
          @for (student of students(); track student.id) {
            <div class="row" style="align-items:center; border-bottom:1px solid var(--border-weak); padding:8px 0">
              <div style="width:160px; display:flex; align-items:center; gap:8px">
                <div style="position:relative">
                  <div class="avatar" style="width:24px; height:24px; font-size:9px">
                    {{ student.avatar || student.name.slice(0,2).toUpperCase() }}
                  </div>
                  @if (db.isUserOnline(student)) {
                    <span style="position:absolute; bottom:-2px; right:-2px; width:8px; height:8px; border-radius:50%; background:#10B981; border:2.5px solid white"></span>
                  }
                </div>
                <span style="font-size:12px; font-weight:600; color:var(--text-primary)">{{ student.name }}</span>
              </div>
              <div style="width:60px; font-size:12px">{{ student.level }}</div>
              <div style="width:80px; text-align:center; font-size:12px">{{ getAttendancePercentage(student.id) }}%</div>
              <div style="width:80px; text-align:center; font-size:12px; font-weight:700; color:#4F46E5">{{ student.xp }} XP</div>
              <div style="flex:1; font-size:11px; color:var(--text-secondary)">{{ db.formatLastActive(student.lastActive) }}</div>
              <div style="width:80px">
                <span [class]="getStatusClass(student)">
                  {{ getStudentStatus(student) }}
                </span>
              </div>
              <div style="width:100px; text-align:right">
                <button class="btn-s" style="padding:4px 8px; font-size:11px" (click)="openProfile(student)">
                  View Profile
                </button>
              </div>
            </div>
          }
        </div>

        <!-- ADD NEW STUDENT FORM CARD -->
        <div class="card" style="margin-top:20px; border:1px dashed #4F46E5; background:#FAF5FF">
          <h3 class="st" style="font-size:14px; margin-bottom:12px; color:#4F46E5">Add New Student</h3>
          <div class="g2" style="align-items:flex-end; flex-wrap:wrap">
            <div class="input-row">
              <label for="newStudentName" style="color:#4F46E5; font-weight:600">Full Name</label>
              <input id="newStudentName" type="text" [(ngModel)]="newStudentName" placeholder="e.g. Kofi Dembélé" style="background:#FFF" />
            </div>
            <div class="input-row">
              <label for="newStudentLevel" style="color:#4F46E5; font-weight:600">English Level</label>
              <select id="newStudentLevel" [(ngModel)]="newStudentLevel" style="background:#FFF">
                <option value="A1">A1 — Beginner</option>
                <option value="A2">A2 — Elementary</option>
                <option value="B1">B1 — Intermediate</option>
                <option value="B2">B2 — Upper Intermediate</option>
              </select>
            </div>
            <div class="input-row">
              <label for="newStudentCountry" style="color:#4F46E5; font-weight:600">Country Flag</label>
              <select id="newStudentCountry" [(ngModel)]="newStudentCountry" style="background:#FFF">
                <option value="">No Flag</option>
                <option value="🇸🇳">Senegal 🇸🇳</option>
                <option value="🇳🇬">Nigeria 🇳🇬</option>
                <option value="🇷🇼">Rwanda 🇷🇼</option>
                <option value="🇧🇯">Benin 🇧🇯</option>
                <option value="🇨🇮">Ivory Coast 🇨🇮</option>
                <option value="🇨🇲">Cameroon 🇨🇲</option>
                <option value="🇹🇬">Togo 🇹🇬</option>
                <option value="🇲🇱">Mali 🇲🇱</option>
                <option value="🇬🇳">Guinea 🇬🇳</option>
                <option value="🇳🇪">Niger 🇳🇪</option>
                <option value="🇫🇷">France 🇫🇷</option>
              </select>
            </div>
            <div class="input-row">
              <label for="newStudentRegFee" style="color:#4F46E5; font-weight:600">Reg. Fee</label>
              <select id="newStudentRegFee" [(ngModel)]="newStudentRegFee" style="background:#FFF">
                <option [value]="10000">10,000 CFA (Regular)</option>
                <option [value]="0">0 CFA (Waived / Promo)</option>
              </select>
            </div>
            <div class="input-row">
              <label for="newStudentMonthlyFee" style="color:#4F46E5; font-weight:600">Monthly Tuition</label>
              <select id="newStudentMonthlyFee" [(ngModel)]="newStudentMonthlyFee" style="background:#FFF">
                <option [value]="7000">7,000 CFA (Regular)</option>
                <option [value]="5000">5,000 CFA (Promo)</option>
              </select>
            </div>
            <button class="btn-p" style="height:36px; padding:0 20px" [disabled]="!newStudentName.trim()" (click)="addStudent()">
              Create Account
            </button>
          </div>
        </div>
      }

      <!-- PROGRESS TABLE -->
      @if (activeTab() === 'progress') {
        <div style="display:flex; flex-direction:column; gap:4px; overflow-x:auto">
          <!-- Header -->
          <div class="row" style="background:var(--surface-2); font-size:11px; color:var(--text-muted); font-weight:600; border-radius:var(--radius)">
            <div style="width:160px">Student</div>
            <div style="width:90px; text-align:center">Vocabulary Score</div>
            <div style="width:90px; text-align:center">Conjugation Score</div>
            <div style="width:90px; text-align:center">Oral Fluency</div>
            <div style="flex:1">Certificates / Achievements</div>
          </div>
          <!-- Rows -->
          @for (student of students(); track student.id) {
            <div class="row" style="align-items:center; border-bottom:1px solid var(--border-weak); padding:8px 0; font-size:12px">
              <div style="width:160px; font-weight:600; color:var(--text-primary)">{{ student.name }}</div>
              <div style="width:90px; text-align:center">{{ student.vocabularyProgress || '0%' }}</div>
              <div style="width:90px; text-align:center">{{ student.conjugationProgress || '0%' }}</div>
              <div style="width:90px; text-align:center">{{ student.speakingScore || 'A' }}</div>
              <div style="flex:1; display:flex; gap:4px; flex-wrap:wrap">
                @for (badge of student.badges; track badge) {
                  <span class="badge" style="background:#FEF3C7; color:#92400E; font-size:9px">{{ badge }}</span>
                } @empty {
                  <span style="font-size:11px; color:var(--text-muted)">None earned</span>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- PROFILE DETAIL VIEW -->
      @if (activeTab() === 'profile') {
        <div class="card">
          <!-- Student Selector Dropdown inside Profile tab -->
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px; background:var(--surface-2); padding:12px; border-radius:var(--radius)">
            <label for="studentSelect" style="font-weight:600; font-size:12px; color:var(--text-primary)">Select Student:</label>
            <select id="studentSelect" [ngModel]="selectedStudent()?.id" (ngModelChange)="onStudentSelect($event)" style="flex:1; max-width:240px; background:#FFF; border:1px solid var(--border-weak); padding:6px; border-radius:var(--radius); font-size:12px">
              <option [value]="null" disabled selected>-- Choose a student --</option>
              @for (s of students(); track s.id) {
                <option [value]="s.id">{{ s.name }}</option>
              }
            </select>
          </div>

          @if (selectedStudent(); as student) {
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-weak); padding-bottom:12px; margin-bottom:12px">
                <div>
                  <h3 style="font-size:16px; font-weight:700">{{ student.name }}</h3>
                  <p style="font-size:11px; color:var(--text-muted)">Level: {{ student.level }} · Registered: {{ student.registeredAt }}</p>
                </div>
                <button class="btn-s" style="padding:4px 8px; font-size:11px" (click)="activeTab.set('all')">Back to list</button>
              </div>

              <div class="grid3" style="gap:12px; margin-bottom:16px">
                <div style="background:var(--surface-2); padding:10px; border-radius:var(--radius)">
                  <div style="font-size:10px; text-transform:uppercase; color:var(--text-muted); font-weight:600">Total Experience Points</div>
                  <div style="font-size:18px; font-weight:800; color:#4F46E5; margin-top:4px">{{ student.xp }} XP</div>
                </div>
                <div style="background:var(--surface-2); padding:10px; border-radius:var(--radius)">
                  <div style="font-size:10px; text-transform:uppercase; color:var(--text-muted); font-weight:600">Attendance Rating</div>
                  <div style="font-size:18px; font-weight:800; color:#059669; margin-top:4px">{{ getAttendancePercentage(student.id) }}%</div>
                </div>
                <div style="background:var(--surface-2); padding:10px; border-radius:var(--radius)">
                  <div style="font-size:10px; text-transform:uppercase; color:var(--text-muted); font-weight:600">Academic Standing</div>
                  <div style="font-size:18px; font-weight:800; color:#D97706; margin-top:4px">
                    {{ getStudentStatus(student) }}
                  </div>
                </div>
              </div>

              <!-- Billing & Permission Settings -->
              <div class="card" style="margin-top:0; margin-bottom:16px; border: 1px dashed var(--border-weak); background:var(--surface-1); padding:16px; border-radius:8px">
                <h4 style="font-size:12px; font-weight:700; color:var(--text-primary); margin-bottom:12px; display:flex; align-items:center; gap:6px; margin-top:0">
                  <i class="ti ti-credit-card" style="color:#4F46E5"></i>
                  <span>Billing & Permission Settings</span>
                </h4>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px">
                  <div class="input-row" style="margin-bottom:0">
                    <label style="font-weight:600; font-size:11px">Registration Fee</label>
                    <select [value]="student.registrationFee ?? 10000" (change)="updateStudentFee(student.id, 'registrationFee', $event)" style="background:#FFF; padding:6px; font-size:11px">
                      <option [value]="10000">10,000 CFA (Regular)</option>
                      <option [value]="0">0 CFA (Waived / Promo)</option>
                    </select>
                  </div>
                  <div class="input-row" style="margin-bottom:0">
                    <label style="font-weight:600; font-size:11px">Monthly Tuition</label>
                    <select [value]="student.monthlyFee ?? 7000" (change)="updateStudentFee(student.id, 'monthlyFee', $event)" style="background:#FFF; padding:6px; font-size:11px">
                      <option [value]="7000">7,000 CFA (Regular)</option>
                      <option [value]="5000">5,000 CFA (Promo)</option>
                    </select>
                  </div>
                  <div class="input-row" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:center">
                    <label style="font-weight:600; font-size:11px; margin-bottom:6px">Chat Messaging</label>
                    <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:11px; font-weight:600; color:#0D9488">
                      <input type="checkbox" [checked]="student.voiceChatAllowed ?? false" (change)="updateStudentPermission(student.id, 'voiceChatAllowed', $event)" style="cursor:pointer" />
                      <span>Allow Voice Messages</span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="input-row">
                <label for="studentNotes">Teacher Notes & Action Plan (Private)</label>
                <textarea id="studentNotes" [(ngModel)]="teacherNotes" rows="4" placeholder="Write internal observations, notes on pronunciation, etc..."></textarea>
              </div>

              <button class="btn-p" style="margin-top:8px" (click)="saveNotes()">
                <i class="ti ti-device-floppy"></i> Save Student Notes
              </button>
            </div>
          } @else {
            <div style="text-align:center; padding:32px; color:var(--text-muted)">
              <i class="ti ti-user-search" style="font-size:36px; display:block; margin-bottom:12px; color:var(--text-muted)"></i>
              <p style="font-size:13px">Please select a student from the dropdown above to view their academic profile and notes.</p>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class TeacherStudentsComponent {
  public db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  activeTab = signal<string>('all');
  students = signal<UserProfile[]>([]);
  selectedStudent = signal<UserProfile | null>(null);
  attendance = signal<Attendance[]>([]);
  
  teacherNotes = '';

  newStudentName = '';
  newStudentLevel = 'B1';
  newStudentCountry = '🇸🇳';
  newStudentRegFee = 10000;
  newStudentMonthlyFee = 7000;

  constructor() {
    this.db.observeUsers().subscribe(list => {
      this.students.set(list.filter(u => u.role === 'student'));
      
      // Update selected student reference if users list updates
      const active = this.selectedStudent();
      if (active) {
        const fresh = list.find(u => u.id === active.id);
        if (fresh) {
          this.selectedStudent.set(fresh);
        } else {
          this.selectedStudent.set(null);
        }
      }
    });

    this.db.observeAttendance().subscribe(list => {
      this.attendance.set(list);
    });
  }

  getAttendancePercentage(studentId: string): number {
    const list = this.attendance();
    let totalClasses = 0;
    let totalPresent = 0;
    list.forEach(att => {
      const record = att.records[studentId];
      if (record && record !== '-') {
        totalClasses++;
        if (record === 'P' || record === 'L') {
          totalPresent++;
        }
      }
    });
    return totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 100;
  }

  getStudentStatus(student: UserProfile): string {
    const att = this.getAttendancePercentage(student.id);
    if (att < 50) return 'At risk';
    if (att < 70 || student.xp < 800) return 'Struggling';
    if (student.xp > 2000) return 'Ready to advance';
    return 'Active';
  }

  getStatusClass(student: UserProfile): string {
    const status = this.getStudentStatus(student);
    if (status === 'At risk') return 'pill r';
    if (status === 'Struggling') return 'pill y';
    if (status === 'Ready to advance') return 'pill g';
    return 'pill b';
  }

  openProfile(student: UserProfile) {
    this.selectedStudent.set(student);
    this.teacherNotes = this.db.getUserNotes(student.id);
    this.activeTab.set('profile');
  }

  onStudentSelect(studentId: string | null) {
    const student = this.students().find(s => s.id === studentId);
    if (student) {
      this.selectedStudent.set(student);
      this.teacherNotes = this.db.getUserNotes(student.id);
    } else {
      this.selectedStudent.set(null);
      this.teacherNotes = '';
    }
  }

  saveNotes() {
    const s = this.selectedStudent();
    if (s) {
      this.db.saveUserNotes(s.id, this.teacherNotes);
      this.dialogService.alert('Notes Saved', `Notes for ${s.name} saved successfully!`, 'success');
    }
  }

  updateStudentFee(studentId: string, field: 'registrationFee' | 'monthlyFee', event: Event) {
    const select = event.target as HTMLSelectElement;
    const value = parseInt(select.value, 10);
    this.db.updateUserProfile(studentId, { [field]: value });
    this.dialogService.alert('Billing Updated', `Student's ${field === 'registrationFee' ? 'registration fee' : 'monthly tuition'} has been updated to ${value.toLocaleString()} CFA!`, 'success');
  }

  updateStudentPermission(studentId: string, property: string, event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.checked;
    this.db.updateUserProfile(studentId, { [property]: value });
    this.dialogService.alert('Permission Updated', `Student voice chat permissions updated!`, 'success');
  }

  addStudent() {
    if (!this.newStudentName.trim()) return;
    this.db.addStudent(
      this.newStudentName, 
      this.newStudentLevel, 
      this.newStudentCountry, 
      Number(this.newStudentRegFee), 
      Number(this.newStudentMonthlyFee)
    ).then(() => {
      this.dialogService.alert('Student Created', `Student account for ${this.newStudentName} created successfully! Payment records initialized.`, 'success');
      this.newStudentName = '';
      this.newStudentLevel = 'B1';
      this.newStudentCountry = '🇸🇳';
      this.newStudentRegFee = 10000;
      this.newStudentMonthlyFee = 7000;
    });
  }
}
