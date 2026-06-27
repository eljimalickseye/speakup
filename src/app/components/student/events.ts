import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, EventItem, UserProfile } from '../../services/database.service';

@Component({
  selector: 'app-student-events',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" style="padding: 12px 0">
      <div class="events-grid">
        @for (ev of events(); track ev.id) {
          <div class="event-flyer-card" [class.joined]="isRegistered(ev)">
            
            <!-- Category and Spots Badge row on top of card -->
            <div class="event-header-row">
              <span class="event-category-tag" [class.club]="ev.name.toLowerCase().includes('club') || ev.name.toLowerCase().includes('chat')" [class.workshop]="ev.name.toLowerCase().includes('workshop') || ev.name.toLowerCase().includes('grammar')">
                {{ getCategoryLabel(ev.name) }}
              </span>
              <span class="spots-status-pill" [class.critical]="getSpotsLeft(ev) <= 3">
                {{ getSpotsLeft(ev) }} / {{ ev.maxParticipants }} spots left
              </span>
            </div>

            <!-- Date and Name card layout -->
            <div class="event-body">
              <div class="event-date-box">
                <span class="event-day">{{ getDay(ev.date) }}</span>
                <span class="event-month">{{ getMonthName(ev.date) }}</span>
              </div>
              
              <div class="event-main-details">
                <h3 class="event-card-title">{{ ev.name }}</h3>
                <div class="event-card-meta">
                  <span><i class="ti ti-map-pin"></i> {{ ev.location }}</span>
                  <span><i class="ti ti-clock"></i> {{ ev.time }}</span>
                </div>
              </div>
            </div>

            <!-- Description -->
            <p class="event-card-description">
              {{ ev.description }}
            </p>

            <!-- Spots progress bar -->
            <div class="spots-progress-container">
              <div class="spots-progress-bar" [style.width.%]="getSpotsPercent(ev)" [class.critical]="getSpotsLeft(ev) <= 3"></div>
            </div>

            <!-- Overlapping Participant Avatars and Join Action -->
            <div class="event-card-footer">
              <div class="attendee-avatars-group">
                @if (ev.registeredUsers.length > 0) {
                  <div class="avatar-stack">
                    @for (userId of ev.registeredUsers.slice(0, 4); track userId) {
                      <div class="stack-avatar" [title]="getUserName(userId)">
                        {{ getUserAvatar(userId) }}
                      </div>
                    }
                    @if (ev.registeredUsers.length > 4) {
                      <div class="stack-avatar count">
                        +{{ ev.registeredUsers.length - 4 }}
                      </div>
                    }
                  </div>
                  <span class="attendee-label">{{ ev.registeredUsers.length }} attending</span>
                } @else {
                  <span class="attendee-label empty">Be the first to register!</span>
                }
              </div>

              <button 
                class="event-reg-btn" 
                [class.registered]="isRegistered(ev)"
                (click)="toggleRegistration(ev.id)">
                @if (isRegistered(ev)) {
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:2px"><polyline points="20 6 9 17 4 12"/></svg>
                  Registered
                } @else {
                  Register
                }
              </button>
            </div>

          </div>
        } @empty {
          <div class="empty-events-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5" style="margin-bottom:12px">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <p style="font-weight:600; color:var(--text-primary)">No Upcoming Events</p>
            <p style="color:var(--text-muted); font-size:12px; margin-top:4px">Check back later for speaking clubs or grammar workshops!</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
      padding: 0 16px;
    }

    .event-flyer-card {
      background: var(--surface-1);
      border: 1px solid var(--border-weak);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .event-flyer-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04);
      border-color: var(--border-accent);
    }

    .event-flyer-card.joined {
      background: #F8FAFC;
      border-color: #C7D2FE;
    }

    .event-header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }

    .event-category-tag {
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 4px;
      background: #EEF2FF;
      color: #4F46E5;
      letter-spacing: 0.5px;
    }

    .event-category-tag.club {
      background: #F0FDF4;
      color: #16A34A;
    }

    .event-category-tag.workshop {
      background: #FFF7ED;
      color: #EA580C;
    }

    .spots-status-pill {
      font-size: 10px;
      font-weight: 700;
      color: var(--text-secondary);
      background: var(--surface-2);
      padding: 2px 8px;
      border-radius: 20px;
    }

    .spots-status-pill.critical {
      background: #FEE2E2;
      color: #EF4444;
      animation: pulse-spots 1.5s infinite;
    }

    @keyframes pulse-spots {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.8; }
    }

    .event-body {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .event-date-box {
      width: 50px;
      height: 50px;
      background: #EEF2FF;
      border: 1px solid #C7D2FE;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: #4F46E5;
    }

    .event-day {
      font-size: 18px;
      font-weight: 800;
      line-height: 1;
    }

    .event-month {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      margin-top: 2px;
      letter-spacing: 0.5px;
    }

    .event-main-details {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .event-card-title {
      font-size: 14.5px;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1.3;
    }

    .event-card-meta {
      display: flex;
      gap: 12px;
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    .event-card-meta span {
      display: flex;
      align-items: center;
      gap: 3px;
    }

    .event-card-description {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.45;
      margin-bottom: 12px;
      flex: 1;
    }

    /* Spots progress bar styling */
    .spots-progress-container {
      height: 5px;
      background: var(--surface-3);
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 16px;
    }

    .spots-progress-bar {
      height: 100%;
      background: #4F46E5;
      border-radius: 10px;
      transition: width 0.3s ease;
    }

    .spots-progress-bar.critical {
      background: #EF4444;
    }

    /* Footer: avatars and buttons */
    .event-card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border-weak);
      padding-top: 12px;
    }

    .attendee-avatars-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .avatar-stack {
      display: flex;
      align-items: center;
    }

    .stack-avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--surface-2);
      border: 1.5px solid #FFF;
      margin-left: -6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .stack-avatar:first-child {
      margin-left: 0;
    }

    .stack-avatar.count {
      background: #E5E7EB;
      color: #4B5563;
      font-weight: 700;
      font-size: 8px;
    }

    .attendee-label {
      font-size: 10px;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .attendee-label.empty {
      color: var(--text-muted);
      font-style: italic;
    }

    .event-reg-btn {
      background: #4F46E5;
      color: #FFF;
      border: none;
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      transition: all 0.15s;
    }

    .event-reg-btn:hover {
      background: #4338CA;
    }

    .event-reg-btn.registered {
      background: #E5E7EB;
      color: #4B5563;
    }

    .event-reg-btn.registered:hover {
      background: #D1D5DB;
      color: #1F2937;
    }

    .empty-events-box {
      grid-column: 1 / -1;
      text-align: center;
      padding: 50px 20px;
      background: var(--surface-1);
      border: 1px dashed var(--border);
      border-radius: 12px;
    }
  `]
})
export class StudentEventsComponent {
  private db = inject(DatabaseService);
  events = signal<EventItem[]>([]);
  currentUser: UserProfile | null = null;
  dbUsers = signal<UserProfile[]>([]);

  constructor() {
    this.db.observeEvents().subscribe(list => this.events.set(list));
    this.db.observeCurrentUser().subscribe(u => this.currentUser = u);
    this.db.observeUsers().subscribe(list => this.dbUsers.set(list));
  }

  isRegistered(event: EventItem): boolean {
    if (!this.currentUser) return false;
    return event.registeredUsers.includes(this.currentUser.id);
  }

  toggleRegistration(eventId: string) {
    if (!this.currentUser) return;
    this.db.registerForEvent(eventId, this.currentUser.id);
  }

  getSpotsLeft(event: EventItem): number {
    return Math.max(0, event.maxParticipants - event.registeredUsers.length);
  }

  getSpotsPercent(event: EventItem): number {
    return Math.min(100, (event.registeredUsers.length / event.maxParticipants) * 100);
  }

  getUserAvatar(userId: string): string {
    const user = this.dbUsers().find(u => u.id === userId);
    return user ? user.avatar : '👤';
  }

  getUserName(userId: string): string {
    const user = this.dbUsers().find(u => u.id === userId);
    return user ? user.name : 'Student';
  }

  getCategoryLabel(eventName: string): string {
    const name = eventName.toLowerCase();
    if (name.includes('debate')) return 'Debate';
    if (name.includes('movie') || name.includes('cinema')) return 'Cinema';
    if (name.includes('speaking') || name.includes('club')) return 'Speaking Club';
    if (name.includes('grammar') || name.includes('workshop')) return 'Workshop';
    return 'Event';
  }

  getDay(dateString: string): string {
    try {
      const parts = dateString.split('-');
      return parts[2] ? parseInt(parts[2], 10).toString() : '1';
    } catch (e) {
      return '1';
    }
  }

  getMonthName(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', { month: 'short' });
    } catch (e) {
      return 'Jul';
    }
  }
}
