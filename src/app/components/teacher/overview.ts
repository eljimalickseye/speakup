import { Component, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { DatabaseService, LiveClass, UserProfile, Submission, Announcement, WordOfTheDay, SpeakingPrompt } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="height: 100%">
      @if (!activeMeeting()) {
        <!-- TEACHER BIO/PROFILE SUMMARY -->
        <div class="card" style="margin-bottom:20px; display:flex; gap:16px; align-items:center; background:linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 100%); border:1px solid #C7D2FE; border-radius:12px; padding:16px; flex-wrap:wrap">
          <div class="av" style="width:48px; height:48px; font-size:18px; background:#3730A3; color:white; font-weight:700; display:flex; align-items:center; justify-content:center; border-radius:50%; flex-shrink:0">
            {{ teacherProfile()?.avatar }}
          </div>
          <div style="flex:1; min-width:200px">
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
          <button (click)="openDailySuggestionModal()" class="btn-p" style="font-size:12.5px; padding:8px 16px; background:linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); border:none; display:flex; align-items:center; gap:8px; font-weight:700; border-radius:8px; cursor:pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Défis du Jour 📅
          </button>
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

        <!-- WORD OF THE DAY SETTINGS CARD -->
        <div class="card" style="margin-top:24px; border:1.5px solid #F59E0B; background:#FFFBEB; border-radius:12px; padding:18px">
          <h3 class="st" style="font-size:15px; margin:0 0 12px 0; color:#B45309; display:flex; align-items:center; gap:8px">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
            </svg>
            <span>Word of the Day Editor (Mot du Jour)</span>
          </h3>

          <div style="display:flex; flex-direction:column; gap:12px">
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:12px">
              <div class="input-row" style="margin-bottom:0">
                <label style="font-size:11px; font-weight:600; color:#B45309; margin-bottom:4px; display:block">Mot en Anglais</label>
                <input [(ngModel)]="wordOfTheDay().word" placeholder="Ex: Resilience" class="form-input" style="height:36px; font-size:13px; border-color:#FDE68A" />
              </div>
              <div class="input-row" style="margin-bottom:0">
                <label style="font-size:11px; font-weight:600; color:#B45309; margin-bottom:4px; display:block">Traduction Française</label>
                <input [(ngModel)]="wordOfTheDay().translation" placeholder="Ex: Résilience" class="form-input" style="height:36px; font-size:13px; border-color:#FDE68A" />
              </div>
              <div class="input-row" style="margin-bottom:0">
                <label style="font-size:11px; font-weight:600; color:#B45309; margin-bottom:4px; display:block">Type de mot</label>
                <select [(ngModel)]="wordOfTheDay().partOfSpeech" class="form-select" style="height:36px; font-size:13px; border-color:#FDE68A">
                  <option value="noun">Nom (noun)</option>
                  <option value="verb">Verbe (verb)</option>
                  <option value="adjective">Adjectif (adjective)</option>
                  <option value="adverb">Adverbe (adverb)</option>
                  <option value="phrase">Expression (phrase)</option>
                </select>
              </div>
              <div class="input-row" style="margin-bottom:0">
                <label style="font-size:11px; font-weight:600; color:#B45309; margin-bottom:4px; display:block">Phonétique</label>
                <input [(ngModel)]="wordOfTheDay().phonetic" placeholder="Ex: /rɪˈzɪl.jəns/" class="form-input" style="height:36px; font-size:13px; border-color:#FDE68A" />
              </div>
            </div>

            <div class="input-row" style="margin-bottom:0">
              <label style="font-size:11px; font-weight:600; color:#B45309; margin-bottom:4px; display:block">Définition</label>
              <input [(ngModel)]="wordOfTheDay().definition" placeholder="Ex: The capacity to recover quickly from difficulties..." class="form-input" style="height:36px; font-size:13px; border-color:#FDE68A" />
            </div>

            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; flex-wrap:wrap">
              <div class="input-row" style="margin-bottom:0">
                <label style="font-size:11px; font-weight:600; color:#B45309; margin-bottom:4px; display:block">Exemple d'utilisation (Anglais)</label>
                <input [(ngModel)]="wordOfTheDay().example" placeholder="Ex: She showed great resilience." class="form-input" style="height:36px; font-size:13px; border-color:#FDE68A" />
              </div>
              <div class="input-row" style="margin-bottom:0">
                <label style="font-size:11px; font-weight:600; color:#B45309; margin-bottom:4px; display:block">Exemple d'utilisation (Français)</label>
                <input [(ngModel)]="wordOfTheDay().exampleTranslation" placeholder="Ex: Elle a fait preuve d'une grande résilience." class="form-input" style="height:36px; font-size:13px; border-color:#FDE68A" />
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; margin-top:8px">
              <button class="btn-p" style="height:36px; padding:0 24px; font-weight:700; background:#D97706; border-color:#D97706" (click)="saveWordOfTheDay()">
                Mettre à jour le Mot du Jour 🎙️
              </button>
            </div>
          </div>
        </div>

        <!-- FEATURE CONFIGURATION CARD -->
        <div class="card" style="margin-top:20px; border:1.5px solid #10B981; background:#F0FDF4; border-radius:12px; padding:18px">
          <h3 class="st" style="font-size:15px; margin:0 0 12px 0; color:#047857; display:flex; align-items:center; gap:8px">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Configuration des Fonctionnalités (Élèves)</span>
          </h3>

          <div style="display:flex; flex-direction:column; gap:14px">
            <!-- Boutique Toggle -->
            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px dashed rgba(16, 185, 129, 0.2)">
              <div>
                <strong style="font-size:13px; color:#065F46; display:block">Activer la Boutique Virtuelle 🪙</strong>
                <span style="font-size:11px; color:#047857">Permet aux élèves de dépenser leurs coins dans la boutique d'avatars et thèmes.</span>
              </div>
              <label class="switch-toggle" style="position:relative; display:inline-block; width:44px; height:24px">
                <input type="checkbox" [checked]="showBoutique()" (change)="toggleBoutique(!showBoutique())" style="opacity:0; width:0; height:0" />
                <span [style.background]="showBoutique() ? '#10B981' : '#CBD5E1'" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; transition:0.3s; border-radius:24px; display:block">
                  <span [style.transform]="showBoutique() ? 'translateX(20px)' : 'translateX(0px)'" style="position:absolute; content:''; height:18px; width:18px; left:3px; bottom:3px; background-color:white; transition:0.3s; border-radius:50%; display:block"></span>
                </span>
              </label>
            </div>

            <!-- Garden Toggle -->
            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px dashed rgba(16, 185, 129, 0.2)">
              <div>
                <strong style="font-size:13px; color:#065F46; display:block">Activer le Jardin SpeakUp Garden 🌸</strong>
                <span style="font-size:11px; color:#047857">Permet aux élèves de faire grandir leur forêt et leurs fleurs en étudiant.</span>
              </div>
              <label class="switch-toggle" style="position:relative; display:inline-block; width:44px; height:24px">
                <input type="checkbox" [checked]="showGarden()" (change)="toggleGarden(!showGarden())" style="opacity:0; width:0; height:0" />
                <span [style.background]="showGarden() ? '#10B981' : '#CBD5E1'" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; transition:0.3s; border-radius:24px; display:block">
                  <span [style.transform]="showGarden() ? 'translateX(20px)' : 'translateX(0px)'" style="position:absolute; content:''; height:18px; width:18px; left:3px; bottom:3px; background-color:white; transition:0.3s; border-radius:50%; display:block"></span>
                </span>
              </label>
            </div>

            <!-- Journey Toggle -->
            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px dashed rgba(16, 185, 129, 0.2)">
              <div>
                <strong style="font-size:13px; color:#065F46; display:block">Activer SpeakUp Journey 🗺️</strong>
                <span style="font-size:11px; color:#047857">Permet aux élèves d'accomplir des missions de voyage avec une liste d'objectifs.</span>
              </div>
              <label class="switch-toggle" style="position:relative; display:inline-block; width:44px; height:24px">
                <input type="checkbox" [checked]="showJourney()" (change)="toggleJourney(!showJourney())" style="opacity:0; width:0; height:0" />
                <span [style.background]="showJourney() ? '#10B981' : '#CBD5E1'" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; transition:0.3s; border-radius:24px; display:block">
                  <span [style.transform]="showJourney() ? 'translateX(20px)' : 'translateX(0px)'" style="position:absolute; content:''; height:18px; width:18px; left:3px; bottom:3px; background-color:white; transition:0.3s; border-radius:50%; display:block"></span>
                </span>
              </label>
            </div>

            <!-- Themes Toggle -->
            <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 0">
              <div>
                <strong style="font-size:13px; color:#065F46; display:block">Activer le Sélecteur de Thème 🎨</strong>
                <span style="font-size:11px; color:#047857">Permet aux élèves de choisir un thème personnalisé (Manga, Rose, Emerald...)</span>
              </div>
              <label class="switch-toggle" style="position:relative; display:inline-block; width:44px; height:24px">
                <input type="checkbox" [checked]="showThemes()" (change)="toggleThemes(!showThemes())" style="opacity:0; width:0; height:0" />
                <span [style.background]="showThemes() ? '#10B981' : '#CBD5E1'" style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; transition:0.3s; border-radius:24px; display:block">
                  <span [style.transform]="showThemes() ? 'translateX(20px)' : 'translateX(0px)'" style="position:absolute; content:''; height:18px; width:18px; left:3px; bottom:3px; background-color:white; transition:0.3s; border-radius:50%; display:block"></span>
                </span>
              </label>
            </div>
          </div>
        </div>

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
      
      <!-- DAILY SUGGESTIONS MODAL FOR TEACHERS -->
      @if (showDailySuggestionModal()) {
        <div class="modal-backdrop" style="position:fixed; inset:0; background:rgba(15, 23, 42, 0.7); backdrop-filter:blur(8px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px" (click)="skipDailySuggestion()">
          <div class="modal-card" style="width:100%; max-width:700px; background:#FFFFFF; border-radius:16px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.25); overflow:hidden; border-top:5px solid #4F46E5; display:flex; flex-direction:column; animation:modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1); border-color:#4F46E5" (click)="$event.stopPropagation()">
            
            <!-- Modal Header -->
            <div style="background:linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding:20px 24px; color:white; position:relative">
              <h3 style="font-size:18px; font-weight:800; margin:0; display:flex; align-items:center; gap:8px">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
                </svg>
                <span>Configuration des Défis du Jour 📅</span>
              </h3>
              <p style="font-size:12px; margin:6px 0 0; color:#E2E7FF; line-height:1.4">
                Personnalisez les prompts de pratique orale (Speaking Practice) et le Mot du Jour (Word of the Day) pour vos étudiants aujourd'hui.
              </p>
              <button (click)="skipDailySuggestion()" style="position:absolute; top:20px; right:20px; background:none; border:none; color:#E2E7FF; cursor:pointer; font-size:20px; transition: color 0.15s" onmouseover="this.style.color='white'" onmouseout="this.style.color='#E2E7FF'">
                ✕
              </button>
            </div>

            <!-- Tabs Navigation -->
            <div style="display:flex; border-bottom:1px solid #E2E8F0; background:#F8FAFC">
              <button (click)="activeModalTab.set('speaking')" [style.border-bottom]="activeModalTab() === 'speaking' ? '3px solid #4F46E5' : '3px solid transparent'" [style.color]="activeModalTab() === 'speaking' ? '#4F46E5' : '#64748B'" style="flex:1; padding:14px; font-weight:700; font-size:13.5px; border:none; background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition: all 0.2s">
                🎙️ Pratique Orale (Défis)
              </button>
              <button (click)="activeModalTab.set('word')" [style.border-bottom]="activeModalTab() === 'word' ? '3px solid #4F46E5' : '3px solid transparent'" [style.color]="activeModalTab() === 'word' ? '#4F46E5' : '#64748B'" style="flex:1; padding:14px; font-weight:700; font-size:13.5px; border:none; background:none; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition: all 0.2s">
                📝 Mot du Jour
              </button>
            </div>

            <!-- Tabs Content (Scrollable Container) -->
            <div style="padding:24px; max-height:55vh; overflow-y:auto; background:#FFFFFF; display:flex; flex-direction:column; gap:16px">
              
              <!-- TAB 1: SPEAKING PROMPTS -->
              @if (activeModalTab() === 'speaking') {
                <div style="display:flex; flex-direction:column; gap:16px">
                  <div style="font-size:12.5px; color:#475569; line-height:1.5; background:#EEF2FF; border:1px solid #C7D2FE; border-radius:8px; padding:12px; display:flex; gap:8px; align-items:start">
                    <span style="font-size:16px; line-height:1">💡</span>
                    <span>Modifiez les prompts d'expression orale pour chaque niveau de difficulté. Vos élèves verront ces prompts aujourd'hui sur leur tableau de bord.</span>
                  </div>
                  
                  @for (p of modalSpeakingPrompts(); track p.level) {
                    <div style="border:1px solid #E2E8F0; border-radius:10px; padding:14px; background:#F8FAFC">
                      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px">
                        <span style="background:#4F46E5; color:white; font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px; text-transform:uppercase">
                          Niveau {{ p.level }}
                        </span>
                      </div>
                      <div style="display:flex; flex-direction:column; gap:10px">
                        <div>
                          <label style="font-size:11px; font-weight:700; color:#475569; display:block; margin-bottom:4px">Prompt de conversation (Anglais)</label>
                          <textarea [(ngModel)]="p.text" rows="2" class="form-input" style="font-size:13px; padding:8px; border-radius:6px; resize:vertical; width:100%; border:1px solid #CBD5E1" placeholder="Ex: Describe your childhood..."></textarea>
                        </div>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
                          <div>
                            <label style="font-size:11px; font-weight:700; color:#475569; display:block; margin-bottom:4px">Traduction Française</label>
                            <input [(ngModel)]="p.translation" type="text" class="form-input" style="font-size:13px; padding:8px; height:36px; border-radius:6px; width:100%; border:1px solid #CBD5E1" placeholder="Ex: Décrivez votre enfance..." />
                          </div>
                          <div>
                            <label style="font-size:11px; font-weight:700; color:#475569; display:block; margin-bottom:4px">Indice / Tip (Anglais)</label>
                            <input [(ngModel)]="p.hint" type="text" class="form-input" style="font-size:13px; padding:8px; height:36px; border-radius:6px; width:100%; border:1px solid #CBD5E1" placeholder="Ex: Use past simple tense..." />
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
              
              <!-- TAB 2: WORD OF THE DAY -->
              @if (activeModalTab() === 'word') {
                <div style="display:flex; flex-direction:column; gap:16px">
                  <div style="font-size:12.5px; color:#475569; line-height:1.5; background:#FFFBEB; border:1px solid #FDE68A; border-radius:8px; padding:12px; display:flex; gap:8px; align-items:start">
                    <span style="font-size:16px; line-height:1">💡</span>
                    <span>Modifiez le Mot du Jour (Word of the Day). Les élèves pourront écouter sa prononciation et s'entraîner à l'utiliser.</span>
                  </div>
                  
                  <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px">
                    <div class="input-row" style="margin-bottom:0">
                      <label style="font-size:11px; font-weight:700; color:#475569; margin-bottom:4px; display:block">Mot en Anglais</label>
                      <input [(ngModel)]="modalWordOfTheDay().word" placeholder="Ex: Resilience" class="form-input" style="height:36px; font-size:13px; border:1px solid #CBD5E1; width:100%" />
                    </div>
                    <div class="input-row" style="margin-bottom:0">
                      <label style="font-size:11px; font-weight:700; color:#475569; margin-bottom:4px; display:block">Traduction Française</label>
                      <input [(ngModel)]="modalWordOfTheDay().translation" placeholder="Ex: Résilience" class="form-input" style="height:36px; font-size:13px; border:1px solid #CBD5E1; width:100%" />
                    </div>
                    <div class="input-row" style="margin-bottom:0">
                      <label style="font-size:11px; font-weight:700; color:#475569; margin-bottom:4px; display:block">Type de mot</label>
                      <select [(ngModel)]="modalWordOfTheDay().partOfSpeech" class="form-select" style="height:36px; font-size:13px; border:1px solid #CBD5E1; width:100%; min-height:36px">
                        <option value="noun">Nom (noun)</option>
                        <option value="verb">Verbe (verb)</option>
                        <option value="adjective">Adjectif (adjective)</option>
                        <option value="adverb">Adverbe (adverb)</option>
                        <option value="phrase">Expression (phrase)</option>
                      </select>
                    </div>
                    <div class="input-row" style="margin-bottom:0">
                      <label style="font-size:11px; font-weight:700; color:#475569; margin-bottom:4px; display:block">Phonétique</label>
                      <input [(ngModel)]="modalWordOfTheDay().phonetic" placeholder="Ex: /rɪˈzɪl.jəns/" class="form-input" style="height:36px; font-size:13px; border:1px solid #CBD5E1; width:100%" />
                    </div>
                  </div>

                  <div class="input-row" style="margin-bottom:0">
                    <label style="font-size:11px; font-weight:700; color:#475569; margin-bottom:4px; display:block">Définition</label>
                    <input [(ngModel)]="modalWordOfTheDay().definition" placeholder="Ex: The capacity to recover quickly from difficulties..." class="form-input" style="height:36px; font-size:13px; border:1px solid #CBD5E1; width:100%" />
                  </div>

                  <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; flex-wrap:wrap">
                    <div class="input-row" style="margin-bottom:0">
                      <label style="font-size:11px; font-weight:700; color:#475569; margin-bottom:4px; display:block">Exemple d'utilisation (Anglais)</label>
                      <input [(ngModel)]="modalWordOfTheDay().example" placeholder="Ex: She showed great resilience." class="form-input" style="height:36px; font-size:13px; border:1px solid #CBD5E1; width:100%" />
                    </div>
                    <div class="input-row" style="margin-bottom:0">
                      <label style="font-size:11px; font-weight:700; color:#475569; margin-bottom:4px; display:block">Exemple d'utilisation (Français)</label>
                      <input [(ngModel)]="modalWordOfTheDay().exampleTranslation" placeholder="Ex: Elle a fait preuve d'une grande résilience." class="form-input" style="height:36px; font-size:13px; border:1px solid #CBD5E1; width:100%" />
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Modal Footer -->
            <div style="display:flex; justify-content:space-between; align-items:center; padding:16px 24px; border-top:1px solid #E2E8F0; background:#F8FAFC; flex-wrap:wrap; gap:10px">
              <button (click)="skipDailySuggestion()" class="btn-s" style="border-color:#94A3B8; color:#475569; font-weight:700; height:38px; padding:0 18px; border-radius:8px">
                Conserver actuel ➔
              </button>
              <button (click)="saveDailySuggestion()" class="btn-p" style="background:linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); border:none; color:white; font-weight:700; height:38px; padding:0 22px; display:flex; align-items:center; gap:8px; border-radius:8px">
                <span>Mettre à jour & Fermer 🎉</span>
              </button>
            </div>
            
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
  wordOfTheDay = signal<any>({
    word: '',
    phonetic: '',
    partOfSpeech: 'noun',
    translation: '',
    definition: '',
    example: '',
    exampleTranslation: ''
  });

  showBoutique = signal<boolean>(false);
  showGarden = signal<boolean>(false);
  showJourney = signal<boolean>(false);
  showThemes = signal<boolean>(false);

  showDailySuggestionModal = signal<boolean>(false);
  activeModalTab = signal<'speaking' | 'word'>('speaking');
  modalSpeakingPrompts = signal<SpeakingPrompt[]>([]);
  modalWordOfTheDay = signal<WordOfTheDay>({
    word: '',
    phonetic: '',
    partOfSpeech: 'noun',
    translation: '',
    definition: '',
    example: '',
    exampleTranslation: ''
  });

  @Output() navigateToTab = new EventEmitter<string>();

  constructor() {
    this.db.observeActiveJitsiCall().subscribe(c => {
      this.activeMeeting.set(c);
    });

    this.db.observeWordOfTheDay().subscribe(w => {
      if (w) {
        this.wordOfTheDay.set({ ...w });
        this.modalWordOfTheDay.set({ ...w });
      }
    });

    this.db.observeSpeakingPrompts().subscribe(prompts => {
      if (prompts && prompts.length > 0) {
        this.modalSpeakingPrompts.set(JSON.parse(JSON.stringify(prompts)));
      }
    });

    this.db.observeShowBoutique().subscribe(val => {
      this.showBoutique.set(val);
    });

    this.db.observeShowGarden().subscribe(val => {
      this.showGarden.set(val);
    });

    this.db.observeShowJourney().subscribe(val => {
      this.showJourney.set(val);
    });

    this.db.observeShowThemes().subscribe(val => {
      this.showThemes.set(val);
    });

    this.db.observeCurrentUser().subscribe(user => {
      this.teacherProfile.set(user);
      if (user && user.role === 'teacher') {
        this.checkAndShowDailySuggestion();
      }
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

  saveWordOfTheDay() {
    this.db.updateWordOfTheDay(this.wordOfTheDay()).then(() => {
      this.dialogService.alert('Succès 🎉', 'Le Mot du Jour a été mis à jour avec succès et synchronisé pour tous les élèves.', 'success');
    });
  }

  toggleBoutique(val: boolean) {
    this.db.updateShowBoutique(val);
    this.dialogService.alert('Configuration mise à jour ⚙️', `La Boutique virtuelle a été ${val ? 'activée' : 'masquée'} pour tous les élèves.`, 'success');
  }

  toggleGarden(val: boolean) {
    this.db.updateShowGarden(val);
    this.dialogService.alert('Configuration mise à jour ⚙️', `Le Jardin SpeakUp Garden a été ${val ? 'activé' : 'masqué'} pour tous les élèves.`, 'success');
  }

  toggleJourney(val: boolean) {
    this.db.updateShowJourney(val);
    this.dialogService.alert('Configuration mise à jour ⚙️', `Le SpeakUp Journey a été ${val ? 'activé' : 'masqué'} pour tous les élèves et une notification leur a été envoyée.`, 'success');
  }

  toggleThemes(val: boolean) {
    this.db.updateShowThemes(val);
    this.dialogService.alert('Configuration mise à jour ⚙️', `Le Sélecteur de Thème a été ${val ? 'activé' : 'masqué'} pour tous les élèves.`, 'success');
  }

  checkAndShowDailySuggestion() {
    const today = new Date().toLocaleDateString('en-CA');
    const lastShown = localStorage.getItem('speak_teacher_suggestion_last_shown_date');
    if (lastShown !== today) {
      this.openDailySuggestionModal();
    }
  }

  openDailySuggestionModal() {
    // Re-pull live prompts from the behavior subject or use copy
    this.db.observeSpeakingPrompts().subscribe(prompts => {
      if (prompts && prompts.length > 0) {
        this.modalSpeakingPrompts.set(JSON.parse(JSON.stringify(prompts)));
      }
    });
    this.modalWordOfTheDay.set(JSON.parse(JSON.stringify(this.wordOfTheDay())));
    this.activeModalTab.set('speaking');
    this.showDailySuggestionModal.set(true);
  }

  saveDailySuggestion() {
    const today = new Date().toLocaleDateString('en-CA');
    this.db.updateSpeakingPrompts(this.modalSpeakingPrompts()).then(() => {
      this.db.updateWordOfTheDay(this.modalWordOfTheDay()).then(() => {
        localStorage.setItem('speak_teacher_suggestion_last_shown_date', today);
        this.showDailySuggestionModal.set(false);
        this.dialogService.alert('Succès 🎉', 'Les défis de conversation et le Mot du Jour ont été mis à jour pour tous les étudiants.', 'success');
      });
    });
  }

  skipDailySuggestion() {
    const today = new Date().toLocaleDateString('en-CA');
    localStorage.setItem('speak_teacher_suggestion_last_shown_date', today);
    this.showDailySuggestionModal.set(false);
  }
}