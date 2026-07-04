import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Ebook, EbookPage, UserProfile } from '../../services/database.service';

@Component({
  selector: 'app-student-ebooks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="animation: fadeIn 0.25s">
      <!-- Search & Filters -->
      <div class="card" style="margin-top:0">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap">
          <div>
            <h3 style="margin:0; font-size:16px; font-weight:800; color:var(--text-primary)">
              📚 {{ t('Bibliothèque Digitale', 'Digital Library') }}
            </h3>
            <p style="margin:2px 0 0 0; font-size:11px; color:var(--text-secondary)">
              {{ t('Accédez aux ebooks pédagogiques et guides écrits par vos professeurs.', 'Access educational ebooks and course guides written by your teachers.') }}
            </p>
          </div>
          
          <div style="display:flex; gap:8px; flex-wrap:wrap">
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              [placeholder]="t('Rechercher un livre...', 'Search a book...')" 
              class="form-input" 
              style="width:200px; height:36px; font-size:12px; border:1px solid var(--border-weak); border-radius:6px; padding:0 10px" 
            />
            <select [(ngModel)]="filterLevel" class="form-select" style="height:36px; font-size:12px; border:1px solid var(--border-weak); border-radius:6px; padding:0 10px">
              <option value="All">{{ t('Tous Niveaux', 'All Levels') }}</option>
              <option value="Beginner">{{ t('Débutant (A1-A2)', 'Beginner (A1-A2)') }}</option>
              <option value="Intermediate">{{ t('Intermédiaire (B1)', 'Intermediate (B1)') }}</option>
              <option value="Advanced">{{ t('Avancé (B2)', 'Advanced (B2)') }}</option>
            </select>
            <select [(ngModel)]="filterLanguage" class="form-select" style="height:36px; font-size:12px; border:1px solid var(--border-weak); border-radius:6px; padding:0 10px">
              <option value="All">{{ t('Toutes Langues', 'All Languages') }}</option>
              <option value="fr">🇫🇷 {{ t('Français', 'French') }}</option>
              <option value="en">🇬🇧 {{ t('Anglais', 'English') }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Most Popular Section -->
      @if (mostPopularBooks().length > 0) {
        <div style="margin-top:20px">
          <div class="section-title" style="display:flex; align-items:center; gap:8px">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" style="vertical-align:middle">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span style="font-weight:800; color:var(--text-primary); font-size:13.5px">
              {{ t('Les Ebooks les plus Populaires', 'Most Popular eBooks') }}
            </span>
          </div>
          
          <div class="horizontal-scroll-container" style="display:flex; gap:20px; overflow-x:auto; padding:10px 4px 20px 4px; scroll-behavior:smooth; -webkit-overflow-scrolling:touch; margin-top:10px">
            @for (book of mostPopularBooks(); track book.id) {
              <div class="card book-card" (click)="openReadingOverlay(book)"
                   style="margin:0; border:1px solid rgba(245, 158, 11, 0.25); border-radius:16px; display:flex; gap:16px; transition:all 0.3s; padding:16px; background:linear-gradient(135deg, #FFFDF9 0%, #FFFDF5 100%); cursor:pointer; box-shadow:0 4px 20px rgba(245, 158, 11, 0.03); flex-shrink: 0; width: 340px"
                   onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 10px 25px rgba(245, 158, 11, 0.08)'; this.style.borderColor='rgba(245, 158, 11, 0.5)'" 
                   onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 20px rgba(245, 158, 11, 0.03)'; this.style.borderColor='rgba(245, 158, 11, 0.25)'">
                
                <!-- Book Cover Spine Column -->
                <div [style.background]="book.coverImageUrl ? 'url(' + book.coverImageUrl + ') center/cover' : (book.coverGradient ? book.coverGradient : (book.coverColor ? book.coverColor : 'linear-gradient(135deg, #FBBF24 0%, #D97706 100%)'))"
                     style="width: 90px; height: 130px; border-radius: 8px; flex-shrink: 0; position: relative; box-shadow: 2px 4px 12px rgba(0,0,0,0.15); overflow:hidden">
                  <!-- Book Spine Overlay Effect -->
                  <div style="position:absolute; top:0; left:0; width:5px; height:100%; background:rgba(0,0,0,0.2)"></div>
                  <div style="position:absolute; inset:0; background:rgba(0,0,0,0.1)"></div>
                  <div style="position:absolute; bottom:8px; left:12px; color:white; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3)); display:flex; align-items:center; justify-content:center">
                    @if (isSvgIcon(book.coverEmoji)) {
                      @if (book.coverEmoji === 'book') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                      } @else if (book.coverEmoji === 'award') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                      } @else if (book.coverEmoji === 'star') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      } @else if (book.coverEmoji === 'graduation') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                      } @else if (book.coverEmoji === 'message') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      }
                    } @else {
                      <span style="font-size:26px">{{ book.coverEmoji }}</span>
                    }
                  </div>
                  <!-- Language tag -->
                  <span style="position:absolute; top:6px; right:6px; background:rgba(255,255,255,0.9); color:#065F46; font-size:8px; font-weight:800; padding:1px 4px; border-radius:3px">
                    {{ book.language === 'fr' ? 'FR' : 'EN' }}
                  </span>
                </div>

                <!-- Book Details Column -->
                <div style="flex:1; display:flex; flex-direction:column; justify-content:space-between; min-width:0">
                  <div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px">
                      <span class="badge" style="background:#FEF3C7; color:#B45309; font-size:9px; font-weight:800; padding:2px 6px; border-radius:20px; border:1px solid #FDE68A">
                        🔥 Popular
                      </span>
                      <span style="font-size:9.5px; color:var(--text-muted); font-weight:600">{{ book.views }} {{ t('lectures', 'views') }}</span>
                    </div>
                    <h4 style="font-size:14px; font-weight:800; color:#92400E; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" [title]="book.title">{{ book.title }}</h4>
                    <p style="font-size:10px; color:#D97706; margin:2px 0 4px 0">{{ t('Par', 'By') }} {{ book.author }} · {{ book.level }}</p>
                    <p style="font-size:11px; color:#78350F; line-height:1.4; margin:0; display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">{{ book.description }}</p>
                  </div>

                  <button class="btn-s" style="width:100%; height:28px; font-size:10.5px; font-weight:700; background:#D97706; border-color:#D97706; color:white; padding:0; display:flex; align-items:center; justify-content:center; gap:4px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                    {{ t("Lire l'Ebook", "Read eBook") }}
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Library Grid -->
      @if (filteredBooks().length === 0) {
        <div class="card" style="text-align:center; padding:48px 16px; color:var(--text-muted)">
          <i class="ti ti-book-off" style="font-size:40px; display:block; margin-bottom:12px; opacity:0.5"></i>
          <p style="font-size:13px; font-weight:600; color:var(--text-primary); margin-bottom:4px">
            {{ t('Aucun livre disponible', 'No books available') }}
          </p>
          <p style="font-size:11px; margin:0">
            {{ t('Aucun ebook ne correspond à vos filtres actuels. Repassez plus tard !', 'No ebook matches your current filters. Please check back later!') }}
          </p>
        </div>
      } @else {
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:16px; margin-top:16px">
          @for (book of filteredBooks(); track book.id) {
            <div class="card book-card" (click)="openReadingOverlay(book)"
                 style="margin:0; border:1px solid var(--border-weak); border-radius:16px; display:flex; gap:16px; transition:all 0.3s; padding:16px; background:#FFF; cursor:pointer"
                 onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 8px 24px rgba(0,0,0,0.06)'; this.style.borderColor='var(--border)'" 
                 onmouseout="this.style.transform='none'; this.style.boxShadow='none'; this.style.borderColor='var(--border-weak)'">
              
              <!-- Book Cover Spine Column -->
              <div [style.background]="book.coverImageUrl ? 'url(' + book.coverImageUrl + ') center/cover' : (book.coverGradient ? book.coverGradient : (book.coverColor ? book.coverColor : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'))"
                   style="width: 90px; height: 130px; border-radius: 8px; flex-shrink: 0; position: relative; box-shadow: 2px 4px 12px rgba(0,0,0,0.12); overflow:hidden">
                <!-- Book Spine Overlay Effect -->
                <div style="position:absolute; top:0; left:0; width:5px; height:100%; background:rgba(0,0,0,0.2)"></div>
                <div style="position:absolute; inset:0; background:rgba(0,0,0,0.08)"></div>
                <div style="position:absolute; bottom:8px; left:12px; color:white; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3)); display:flex; align-items:center; justify-content:center">
                  @if (isSvgIcon(book.coverEmoji)) {
                    @if (book.coverEmoji === 'book') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    } @else if (book.coverEmoji === 'award') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                    } @else if (book.coverEmoji === 'star') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    } @else if (book.coverEmoji === 'graduation') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                    } @else if (book.coverEmoji === 'message') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    }
                  } @else {
                    <span style="font-size:26px">{{ book.coverEmoji }}</span>
                  }
                </div>
                <!-- Language tag -->
                <span style="position:absolute; top:6px; right:6px; background:rgba(255,255,255,0.9); color:#4F46E5; font-size:8px; font-weight:800; padding:1px 4px; border-radius:3px">
                  {{ book.language === 'fr' ? 'FR' : 'EN' }}
                </span>
              </div>

              <!-- Book Details Column -->
              <div style="flex:1; display:flex; flex-direction:column; justify-content:space-between; min-width:0">
                <div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px">
                    <span class="badge" style="background:var(--surface-2); color:var(--text-secondary); font-size:9px; font-weight:700; padding:2px 6px; border-radius:20px; border:1px solid var(--border-weak)">
                      {{ book.level }}
                    </span>
                  </div>
                  <h4 style="font-size:14px; font-weight:800; color:var(--text-primary); margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis" [title]="book.title">{{ book.title }}</h4>
                  <p style="font-size:10px; color:var(--text-muted); margin:2px 0 6px 0">{{ t('Par', 'By') }} {{ book.author }}</p>
                  <p style="font-size:11px; color:var(--text-secondary); line-height:1.4; margin:0; display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">{{ book.description }}</p>
                </div>

                <button class="btn-s" style="width:100%; height:28px; font-size:10.5px; font-weight:700; background:#4F46E5; border-color:#4F46E5; color:white; padding:0; display:flex; align-items:center; justify-content:center; gap:4px">
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                  </svg>
                  {{ t("Lire l'Ebook", "Read eBook") }}
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- FULLSCREEN READING OVERLAY -->
      @if (activeBook(); as book) {
        <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#F8F6F2; z-index:9999; display:flex; flex-direction:column; animation: fadeIn 0.25s">
          <!-- Reading Top bar -->
          <div style="height:60px; border-bottom:1px solid rgba(0,0,0,0.06); padding:0 24px; display:flex; justify-content:space-between; align-items:center; background:#FFF; box-shadow:0 2px 10px rgba(0,0,0,0.02)">
            <div style="display:flex; align-items:center; gap:12px">
              <button (click)="closeReadingOverlay()" 
                      style="background:none; border:none; color:var(--text-secondary); font-size:12px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; padding:6px 12px; border-radius:8px; transition:background 0.2s"
                      onmouseover="this.style.background='rgba(0,0,0,0.04)'; this.style.color='var(--text-primary)'"
                      onmouseout="this.style.background='none'; this.style.color='var(--text-secondary)'">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                {{ t('Fermer', 'Close') }}
              </button>
              <div style="width:1px; height:20px; background:rgba(0,0,0,0.1)"></div>
              <div style="display:flex; align-items:center; gap:8px">
                <span style="display:inline-flex; align-items:center; justify-content:center; color:#4F46E5">
                  @if (isSvgIcon(book.coverEmoji)) {
                    @if (book.coverEmoji === 'book') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                    } @else if (book.coverEmoji === 'award') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                    } @else if (book.coverEmoji === 'star') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    } @else if (book.coverEmoji === 'graduation') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                    } @else if (book.coverEmoji === 'message') {
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    }
                  } @else {
                    <span style="font-size:20px">{{ book.coverEmoji }}</span>
                  }
                </span>
                <div>
                  <h2 style="font-size:14px; font-weight:800; color:var(--text-primary); margin:0">{{ book.title }}</h2>
                  <span style="font-size:10px; color:var(--text-muted)">{{ t('Par', 'By') }} {{ book.author }}</span>
                </div>
              </div>
            </div>
            
            <div style="display:flex; align-items:center; gap:16px">
              <span class="badge" style="background:#EEF2FF; color:#4F46E5; font-size:9.5px; font-weight:700; border-radius:20px; border:1px solid #C7D2FE">
                {{ t('Niveau', 'Level') }} {{ book.level }}
              </span>
              <span style="font-size:11px; color:var(--text-muted); display:inline-flex; align-items:center; gap:4px">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                {{ t('Bibliothèque SpeakUp', 'SpeakUp Library') }}
              </span>
            </div>
          </div>

          <!-- Reading Content Panel -->
          <div style="flex:1; display:flex; overflow:hidden">
            <!-- Left bar summary (Desktop only) -->
            <div style="width:300px; border-right:1px solid rgba(0,0,0,0.06); background:#FFF; padding:28px 24px; display:flex; flex-direction:column; justify-content:space-between; flex-shrink:0" class="reading-sidebar">
              <div>
                <!-- Cover Image Preview inside Reader -->
                <div [style.background]="book.coverImageUrl ? 'url(' + book.coverImageUrl + ') center/cover' : (book.coverGradient ? book.coverGradient : (book.coverColor ? book.coverColor : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'))"
                     style="width: 120px; height: 170px; border-radius: 10px; position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.15); overflow:hidden; margin: 0 auto 24px auto">
                  <div style="position:absolute; top:0; left:0; width:6px; height:100%; background:rgba(0,0,0,0.25)"></div>
                  <div style="position:absolute; inset:0; background:rgba(0,0,0,0.1)"></div>
                  <div style="position:absolute; bottom:12px; left:16px; color:white; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3)); display:flex; align-items:center; justify-content:center">
                    @if (isSvgIcon(book.coverEmoji)) {
                      @if (book.coverEmoji === 'book') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                      } @else if (book.coverEmoji === 'award') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
                      } @else if (book.coverEmoji === 'star') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                      } @else if (book.coverEmoji === 'graduation') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/></svg>
                      } @else if (book.coverEmoji === 'message') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                      }
                    } @else {
                      <span style="font-size:36px">{{ book.coverEmoji }}</span>
                    }
                  </div>
                </div>

                <h4 style="font-size:11px; text-transform:uppercase; color:var(--text-muted); font-weight:800; letter-spacing:0.5px; margin-bottom:8px; border-bottom:1px solid var(--border-weak); padding-bottom:6px">Synopsis</h4>
                <p style="font-size:12px; color:var(--text-secondary); line-height:1.6; margin:0">{{ book.description }}</p>
              </div>
              <div style="font-size:11px; color:var(--text-muted); line-height:2.0; border-top:1px solid var(--border-weak); padding-top:16px; display:flex; flex-direction:column; gap:6px">
                <span style="display:flex; align-items:center; gap:6px">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {{ t('Auteur', 'Author') }} : {{ book.author }}
                </span>
                <span style="display:flex; align-items:center; gap:6px">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {{ t('Publié le', 'Published on') }} {{ book.createdAt }}
                </span>
                <span style="display:flex; align-items:center; gap:6px">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  {{ book.views }} {{ t('lectures', 'views') }}
                </span>
              </div>
            </div>

            <!-- Scrollable Reader (Center) -->
            <div style="flex:1; background:#FAF8F5; overflow-y:auto; padding:56px 24px; display:flex; justify-content:center">
              <div style="width:100%; max-width:700px; background:#FFF; border:1px solid rgba(0,0,0,0.05); border-radius:12px; box-shadow:0 12px 32px rgba(0,0,0,0.04); padding:64px 56px; min-height:fit-content">
                <h1 style="font-family:'Outfit', sans-serif; font-size:28px; font-weight:900; color:var(--text-primary); margin-top:0; margin-bottom:10px; line-height:1.25">{{ book.title }}</h1>
                <div style="display:flex; gap:14px; align-items:center; font-family:'Outfit', sans-serif; font-size:11.5px; color:var(--text-muted); margin-bottom:24px; border-bottom:2px solid #FAF8F5; padding-bottom:16px; flex-wrap:wrap">
                  <span style="display:flex; align-items:center; gap:4px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <strong>{{ book.author }}</strong>
                  </span>
                  <span>•</span>
                  <span style="display:flex; align-items:center; gap:4px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    {{ t('Niveau', 'Level') }} {{ book.level }}
                  </span>
                  <span>•</span>
                  <span>{{ book.language === 'fr' ? '🇫🇷 ' + t('Français', 'French') : '🇬🇧 ' + t('Anglais', 'English') }}</span>
                  @if (book.pages && book.pages.length > 0) {
                    <span>•</span>
                    <span style="color:#7C3AED; font-weight:700">{{ book.pages.length }} {{ book.pages.length === 1 ? t('page', 'page') : t('pages', 'pages') }}</span>
                  }
                </div>

                <!-- Page tabs if multi-page ebook -->
                @if (book.pages && book.pages.length > 0) {
                  <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid #F3F4F6">
                    @for (pg of book.pages; track pg.id; let i = $index) {
                      <button (click)="activePageIndex.set(i)"
                              [style.background]="activePageIndex() === i ? '#4F46E5' : '#F3F4F6'"
                              [style.color]="activePageIndex() === i ? 'white' : 'var(--text-secondary)'"
                              style="border:none; border-radius:20px; padding:5px 16px; font-size:11.5px; font-weight:700; cursor:pointer; transition:all 0.2s">
                        {{ i + 1 }}. {{ pg.title || t('Page', 'Page') }}
                      </button>
                    }
                  </div>

                  @if (book.pages[activePageIndex()]; as activePg) {
                    <h3 style="font-size:20px; font-weight:800; color:var(--text-primary); margin:0 0 16px 0">{{ activePg.title }}</h3>
                    <div style="font-family:'Georgia', serif; font-size:16.5px; line-height:1.9; color:#2D2D2D; white-space:pre-wrap">{{ activePg.content }}</div>
                  }

                  <!-- Prev / Next navigation -->  
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-top:36px; padding-top:16px; border-top:1px solid #F3F4F6">
                    <button [disabled]="activePageIndex() === 0" (click)="activePageIndex.set(activePageIndex() - 1)"
                            style="background:none; border:1.5px solid var(--border); color:var(--text-secondary); border-radius:8px; height:36px; padding:0 16px; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 0.2s"
                            [style.opacity]="activePageIndex() === 0 ? '0.4' : '1'"
                            onmouseover="this.style.borderColor='#4F46E5'; this.style.color='#4F46E5'" onmouseout="this.style.borderColor='var(--border)'; this.style.color='var(--text-secondary)'">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                      {{ t('Précédent', 'Previous') }}
                    </button>
                    <span style="font-size:12px; color:var(--text-muted); font-weight:600">{{ activePageIndex() + 1 }} / {{ book.pages.length }}</span>
                    <button [disabled]="activePageIndex() >= book.pages.length - 1" (click)="activePageIndex.set(activePageIndex() + 1)"
                            style="background:#4F46E5; border:1.5px solid #4F46E5; color:white; border-radius:8px; height:36px; padding:0 16px; font-size:12px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 0.2s"
                            [style.opacity]="activePageIndex() >= book.pages.length - 1 ? '0.4' : '1'"
                            onmouseover="this.style.background='#4338CA'" onmouseout="this.style.background='#4F46E5'">
                      {{ t('Suivant', 'Next') }}
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  </div>

                } @else {
                  <!-- Fallback: legacy single-content ebook -->
                  <div style="font-family:'Georgia', serif; font-size:16.5px; line-height:1.9; color:#2D2D2D; white-space:pre-wrap">{{ book.content }}</div>
                }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .book-card {
      box-shadow: 0 4px 15px rgba(0,0,0,0.03);
    }
    .book-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.06);
    }
    .horizontal-scroll-container::-webkit-scrollbar {
      height: 6px;
    }
    .horizontal-scroll-container::-webkit-scrollbar-track {
      background: transparent;
    }
    .horizontal-scroll-container::-webkit-scrollbar-thumb {
      background: rgba(245, 158, 11, 0.2);
      border-radius: 4px;
    }
    .horizontal-scroll-container::-webkit-scrollbar-thumb:hover {
      background: rgba(245, 158, 11, 0.4);
    }
    @media (max-width: 768px) {
      .reading-sidebar {
        display: none !important;
      }
    }
  `]
})
export class StudentEbooksComponent {
  private db = inject(DatabaseService);

  ebooks = signal<Ebook[]>([]);
  activeBook = signal<Ebook | null>(null);
  activePageIndex = signal<number>(0);

  // Filters
  searchQuery = '';
  filterLevel = 'All';
  filterLanguage = 'All';

  constructor() {
    this.db.observeEbooks().subscribe(list => this.ebooks.set(list.filter(b => b.status !== 'draft')));
  }

  t(fr: string, en: string): string {
    return this.db.activeLang() === 'en' ? en : fr;
  }

  isSvgIcon(emoji?: string): boolean {
    if (!emoji) return false;
    return ['book', 'award', 'star', 'graduation', 'message'].includes(emoji);
  }

  filteredBooks = computed(() => {
    let list = this.ebooks();

    // Filter by level
    if (this.filterLevel !== 'All') {
      list = list.filter(b => b.level === this.filterLevel);
    }

    // Filter by language
    if (this.filterLanguage !== 'All') {
      list = list.filter(b => b.language === this.filterLanguage);
    }

    // Filter by search
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(b => 
        b.title.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q)
      );
    }

    return list;
  });

  mostPopularBooks = computed(() => {
    let list = this.ebooks();
    if (this.filterLanguage !== 'All') {
      list = list.filter(b => b.language === this.filterLanguage);
    }
    return [...list]
      .filter(b => (b.views || 0) > 0)
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 3);
  });

  openReadingOverlay(book: Ebook) {
    this.activeBook.set(book);
    this.activePageIndex.set(0);
    this.db.incrementEbookViews(book.id);
  }

  closeReadingOverlay() {
    this.activeBook.set(null);
    this.activePageIndex.set(0);
  }
}
