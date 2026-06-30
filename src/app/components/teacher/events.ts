import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, EventItem } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="card">
        <h3 class="st" style="font-size:16px; margin-bottom:12px">Create English Community Event</h3>
        
        <div class="input-row">
          <label for="eName">Event Name</label>
          <input id="eName" type="text" [(ngModel)]="name" placeholder="e.g. Outdoor English Picnic / Conversation" />
        </div>

        <div class="g2">
          <div class="input-row">
            <label for="eDate">Date</label>
            <input id="eDate" type="date" [(ngModel)]="date" />
          </div>
          <div class="input-row">
            <label for="eTime">Time</label>
            <input id="eTime" type="text" [(ngModel)]="time" placeholder="e.g. 10:00 AM / 4:00 PM" />
          </div>
          <div class="input-row">
            <label for="eLocation">Location</label>
            <input id="eLocation" type="text" [(ngModel)]="location" placeholder="e.g. Cafe De Paris / Zoom" />
          </div>
          <div class="input-row">
            <label for="eMax">Max Participants</label>
            <input id="eMax" type="number" [(ngModel)]="maxParticipants" />
          </div>
        </div>

        <div class="input-row">
          <label for="eDesc">Event Details & Agenda</label>
          <textarea id="eDesc" [(ngModel)]="description" rows="4" placeholder="Describe the activities, language games, etc."></textarea>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:12px">
          @if (selectedEventId()) {
            <button class="btn-s" (click)="resetForm()">Cancel Edit</button>
          }
          <button class="btn-p" [disabled]="!isValid()" (click)="publish()">
            {{ selectedEventId() ? 'Update Community Event' : 'Publish Community Event' }}
          </button>
        </div>
      </div>

      <div class="card" style="margin-top:16px">
        <h3 class="st" style="font-size:16px; margin-bottom:12px">Active Events</h3>
        @if (events().length === 0) {
          <div style="font-size:13px; color:var(--text-secondary); text-align:center; padding:16px 0">
            No events published yet.
          </div>
        } @else {
          <table style="width:100%; border-collapse:collapse; font-size:12px">
            <thead>
              <tr style="text-align:left; border-bottom:2px solid var(--border-weak); color:var(--text-muted)">
                <th style="padding:8px">Event Name</th>
                <th style="padding:8px">Date & Time</th>
                <th style="padding:8px">Location</th>
                <th style="padding:8px; text-align:center">Registered</th>
                <th style="padding:8px; text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (ev of events(); track ev.id) {
                <tr style="border-bottom:1px solid var(--border-weak)">
                  <td style="padding:8px; font-weight:600; color:var(--text-primary)">{{ ev.name }}</td>
                  <td style="padding:8px">{{ ev.date }} @ {{ ev.time }}</td>
                  <td style="padding:8px">{{ ev.location }}</td>
                  <td style="padding:8px; text-align:center">
                    {{ ev.registeredUsers.length }} / {{ ev.maxParticipants }}
                  </td>
                  <td style="padding:8px; text-align:right; display:flex; gap:4px; justify-content:flex-end">
                    <button class="btn-s" style="padding:4px 8px; font-size:11px" (click)="showRegistrations(ev)">
                      Guests
                    </button>
                    <button class="btn-s" style="padding:4px 8px; font-size:11px" (click)="editEvent(ev)">
                      Edit
                    </button>
                    <button class="btn-s" style="padding:4px 8px; font-size:11px; border-color:#EF4444; color:#EF4444" (click)="deleteEvent(ev)">
                      Delete
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `
})
export class TeacherEventsComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  selectedEventId = signal<string | null>(null);

  name = '';
  date = '';
  time = '';
  location = '';
  maxParticipants = 10;
  description = '';

  events = signal<EventItem[]>([]);

  constructor() {
    this.db.observeEvents().subscribe(list => this.events.set(list));
  }

  editEvent(ev: EventItem) {
    this.selectedEventId.set(ev.id);
    this.name = ev.name;
    this.date = ev.date;
    this.time = ev.time;
    this.location = ev.location;
    this.maxParticipants = ev.maxParticipants;
    this.description = ev.description || '';
  }

  deleteEvent(ev: EventItem) {
    this.dialogService.confirm(
      'Delete Event',
      `Are you sure you want to delete the event "${ev.name}"?`,
      () => {
        this.db.deleteEvent(ev.id);
        this.dialogService.alert('Deleted', 'Event deleted successfully!', 'success');
        if (this.selectedEventId() === ev.id) {
          this.resetForm();
        }
      }
    );
  }

  resetForm() {
    this.selectedEventId.set(null);
    this.name = '';
    this.date = '';
    this.time = '';
    this.location = '';
    this.maxParticipants = 10;
    this.description = '';
  }

  isValid() {
    return this.name.trim() && this.date && this.location.trim() && this.maxParticipants > 0;
  }

  publish() {
    if (!this.isValid()) return;

    const data = {
      name: this.name,
      date: this.date,
      time: this.time,
      location: this.location,
      maxParticipants: this.maxParticipants,
      description: this.description
    };

    const id = this.selectedEventId();
    if (id) {
      this.db.updateEvent(id, data);
      this.dialogService.alert('Success', 'English Community Event updated successfully!', 'success');
    } else {
      this.db.addEvent(data);
      this.dialogService.alert('Success', 'English Community Event published successfully!', 'success');
    }
    this.resetForm();
  }

  showRegistrations(ev: EventItem) {
    if (ev.registeredUsers.length === 0) {
      this.dialogService.alert('No Guests', 'No students registered for this event yet.', 'info');
    } else {
      const names = ev.registeredUsers.map(id => {
        if (id === 'aminata') return 'Aminata M.';
        if (id === 'fatou') return 'Fatou D.';
        if (id === 'kofi') return 'Kofi D.';
        return id;
      });
      this.dialogService.alert('Registered Students', `Registered students:\n- ${names.join('\n- ')}`, 'info');
    }
  }
}
