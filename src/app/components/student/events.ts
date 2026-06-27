import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, EventItem, UserProfile } from '../../services/database.service';

@Component({
  selector: 'app-student-events',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="events-list">
        @for (ev of events(); track ev.id) {
          <div class="event-card">
            <div class="event-date">
              <div class="event-day">{{ getDay(ev.date) }}</div>
              <div class="event-month">{{ getMonthName(ev.date) }}</div>
            </div>
            
            <div class="event-info">
              <div class="event-title">{{ ev.name }}</div>
              <div class="event-detail">
                {{ ev.location }} · {{ ev.time }} · 
                <strong [style.color]="(ev.maxParticipants - ev.registeredUsers.length) <= 5 ? '#DC2626' : 'var(--text-secondary)'">
                  {{ ev.maxParticipants - ev.registeredUsers.length }} spots left
                </strong>
              </div>
              <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px">
                {{ ev.description }}
              </div>
            </div>

            <button 
              class="event-reg" 
              [class.registered]="isRegistered(ev)"
              (click)="toggleRegistration(ev.id)">
              {{ isRegistered(ev) ? 'Registered' : 'Register' }}
            </button>
          </div>
        }
        
        @if (events().length === 0) {
          <div style="text-align:center; padding:30px; font-size:12px; color:var(--text-muted)">
            No upcoming events at this time. Check back later!
          </div>
        }
      </div>
    </div>
  `
})
export class StudentEventsComponent {
  private db = inject(DatabaseService);
  events = signal<EventItem[]>([]);
  currentUser: UserProfile | null = null;

  constructor() {
    this.db.observeEvents().subscribe(list => this.events.set(list));
    this.db.observeCurrentUser().subscribe(u => this.currentUser = u);
  }

  isRegistered(event: EventItem): boolean {
    if (!this.currentUser) return false;
    return event.registeredUsers.includes(this.currentUser.id);
  }

  toggleRegistration(eventId: string) {
    if (!this.currentUser) return;
    this.db.registerForEvent(eventId, this.currentUser.id);
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
