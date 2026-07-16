import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Ebook, EbookPage, UserProfile, EbookHighlight } from '../../services/database.service';

@Component({
  selector: 'app-student-ebooks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="animation: fadeIn 0.25s">
      <!-- Search & Filters -->
      <div class="card" style="margin-top:0">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap">
          <div style="display:flex; align-items:center; gap:12px">
            <div style="background:#ECFDF5; padding:10px; border-radius:10px; display:inline-flex; align-items:center; justify-content:center">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>
            </div>
            <div>
              <h3 style="margin:0; font-size:16px; font-weight:800; color:var(--text-primary)">
                {{ t('Bibliothèque Digitale', 'Digital Library') }}
              </h3>
              <p style="margin:2px 0 0 0; font-size:11px; color:var(--text-secondary)">
                {{ t('Accédez aux ebooks pédagogiques et guides écrits par vos professeurs.', 'Access educational ebooks and course guides written by your teachers.') }}
              </p>
            </div>
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
              <option value="Advanced">{{ t('Avancé (B2)', 'Avancé (B2)') }}</option>
            </select>
            <select [(ngModel)]="filterLanguage" class="form-select" style="height:36px; font-size:12px; border:1px solid var(--border-weak); border-radius:6px; padding:0 10px">
              <option value="All">{{ t('Toutes Langues', 'All Languages') }}</option>
              <option value="fr">🇫🇷 {{ t('Français', 'French') }}</option>
              <option value="en">🇬🇧 {{ t('Anglais', 'English') }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Main Ebooks Catalog -->
      <div style="margin-top:24px">
        <div class="section-title" style="display:flex; align-items:center; gap:8px; margin-bottom:16px">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10M6 14h8"/></svg>
          <span style="font-weight:800; color:var(--text-primary); font-size:14px">
            {{ t('Tous les Ebooks', 'All eBooks') }}
          </span>
          <span style="background:#D1FAE5; color:#065F46; font-size:10px; font-weight:800; padding:2px 8px; border-radius:20px; margin-left:4px">
            {{ filteredBooks().length }}
          </span>
        </div>

        <div class="grid3">
          @for (book of filteredBooks(); track book.id) {
            <div class="card book-card" (click)="openReadingOverlay(book)"
                 style="margin:0; border:1px solid var(--border-weak); border-radius:16px; display:flex; gap:16px; transition:all 0.3s; padding:16px; background:#FFF; cursor:pointer"
                 onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 10px 25px rgba(0,0,0,0.06)'; this.style.borderColor='var(--border)'" 
                 onmouseout="this.style.transform='none'; this.style.boxShadow='none'; this.style.borderColor='var(--border-weak)'">
              
              <!-- Book Cover Column -->
              <div [style.background]="book.coverImageUrl ? 'url(' + book.coverImageUrl + ') center/cover' : (book.coverGradient ? book.coverGradient : (book.coverColor ? book.coverColor : 'linear-gradient(135deg, #10B981 0%, #047857 100%)'))"
                   style="width: 80px; height: 115px; border-radius: 8px; flex-shrink: 0; position: relative; box-shadow: 2px 4px 8px rgba(0,0,0,0.12); overflow:hidden; display:flex; align-items:center; justify-content:center">
                <div style="position:absolute; top:0; left:0; width:4px; height:100%; background:rgba(0,0,0,0.2)"></div>
                <div style="position:absolute; inset:0; background:rgba(0,0,0,0.08)"></div>
                
                @if (!book.coverImageUrl) {
                  <div style="color:white; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25)); z-index:1">
                    <span style="font-size:32px">{{ getBookEmoji(book.coverEmoji) }}</span>
                  </div>
                }
                
                <span style="position:absolute; top:6px; right:6px; background:rgba(255,255,255,0.9); color:#1E293B; font-size:8px; font-weight:800; padding:1px 4px; border-radius:3px; z-index:1">
                  {{ book.language === 'fr' ? 'FR' : 'EN' }}
                </span>
              </div>

              <!-- Details Column -->
              <div style="flex:1; display:flex; flex-direction:column; justify-content:space-between; min-width:0">
                <div>
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px">
                    <span class="badge" 
                          [style.background]="book.level === 'Beginner' ? '#E0F2FE' : (book.level === 'Intermediate' ? '#ECFDF5' : '#F3E8FF')"
                          [style.color]="book.level === 'Beginner' ? '#0369A1' : (book.level === 'Intermediate' ? '#047857' : '#6B21A8')"
                          style="font-size:9.5px; font-weight:800; padding:2px 6px; border-radius:20px">
                      {{ book.level }}
                    </span>
                  </div>
                  <h4 style="font-size:13px; font-weight:800; color:var(--text-primary); margin:0; line-height:1.3" class="book-title-trunc">{{ book.title }}</h4>
                  <p style="font-size:11px; color:var(--text-secondary); margin:4px 0 0 0; line-height:1.4" class="book-desc-trunc">{{ book.description }}</p>
                </div>
                
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-weak); padding-top:8px; margin-top:8px; font-size:10.5px; color:var(--text-muted)">
                  <span style="display:flex; align-items:center; gap:4px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    {{ book.author }}
                  </span>
                  <span style="display:flex; align-items:center; gap:4px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    {{ book.views }}
                  </span>
                </div>
              </div>
            </div>
          } @empty {
            <div class="card" style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--text-secondary)">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 12px auto; color: var(--text-muted)"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>
              <p style="margin:10px 0 0 0; font-size:13px; font-weight:600">{{ t('Aucun livre trouvé dans la bibliothèque.', 'No books found in the library.') }}</p>
            </div>
          }
        </div>
      </div>

      <!-- PREMIUM READING OVERLAY (Paper-Book Style) -->
      @if (activeBook(); as book) {
        <div style="position:fixed; inset:0; background:rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); display:flex; justify-content:center; align-items:stretch; z-index:9999; animation: fadeIn 0.25s">
          <div style="width:100%; display:flex; flex-direction:column; background:#FAF8F5">
            <!-- Reader Top Bar -->
            <div style="height:60px; border-bottom:1px solid rgba(0,0,0,0.06); padding:0 24px; display:flex; align-items:center; justify-content:space-between; background:#FFF; flex-shrink:0; position:relative; z-index:10">
              <div style="display:flex; align-items:center; gap:12px">
                <button (click)="closeReadingOverlay()" 
                        style="background:none; border:none; color:var(--text-secondary); cursor:pointer; font-size:20px; font-weight:700; padding:8px 12px; border-radius:8px; display:inline-flex; align-items:center; gap:6px"
                        onmouseover="this.style.background='var(--surface-3)'" onmouseout="this.style.background='none'">
                  ← {{ t('Fermer', 'Close') }}
                </button>
                <span style="width:1px; height:20px; background:rgba(0,0,0,0.1)"></span>
                <span style="font-size:12px; color:var(--text-muted); font-weight:700; display:inline-flex; align-items:center; gap:4px">
                  📖 {{ t('Bibliothèque SpeakUp', 'SpeakUp Library') }}
                </span>
              </div>
              
              <div style="font-weight:800; font-size:14px; color:var(--text-primary)">
                {{ book.title }}
              </div>

              <div style="width: 80px"></div> <!-- Spacer to center title -->
            </div>

            <!-- Reading Settings Customization Toolbar -->
            <div [style.background]="getThemeToolbarBg()" [style.color]="getThemeToolbarText()" [style.borderColor]="getThemeBorder()"
                 style="display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap; padding:12px 24px; border-bottom:1px solid; transition:all 0.2s" class="reader-toolbar">
              <!-- Theme selectors -->
              <div style="display:flex; align-items:center; gap:8px">
                <span style="font-size:11px; font-weight:800; text-transform:uppercase; opacity:0.8">{{ t('Thème', 'Theme') }} :</span>
                <button (click)="readerTheme.set('cream')" [style.background]="'#FAF6EE'" [style.border]="readerTheme() === 'cream' ? '2px solid #D97706' : '1px solid #E6DEC9'" style="width:28px; height:28px; border-radius:50%; cursor:pointer; outline:none; transition:all 0.2s" title="Cream Theme"></button>
                <button (click)="readerTheme.set('light')" [style.background]="'#FFFFFF'" [style.border]="readerTheme() === 'light' ? '2px solid #4F46E5' : '1px solid #E2E8F0'" style="width:28px; height:28px; border-radius:50%; cursor:pointer; outline:none; transition:all 0.2s" title="Light Theme"></button>
                <button (click)="readerTheme.set('dark')" [style.background]="'#1E1E1E'" [style.border]="readerTheme() === 'dark' ? '2px solid #FFFFFF' : '1px solid #3A3A3A'" style="width:28px; height:28px; border-radius:50%; cursor:pointer; outline:none; transition:all 0.2s" title="Dark Theme"></button>
              </div>

              <!-- Font Family selectors -->
              <div style="display:flex; align-items:center; gap:8px">
                <span style="font-size:11px; font-weight:800; text-transform:uppercase; opacity:0.8">{{ t('Police', 'Font') }} :</span>
                <button (click)="readerFontFamily.set('serif')" 
                        [style.background]="readerFontFamily() === 'serif' ? 'rgba(79,70,229,0.1)' : 'transparent'"
                        [style.border]="readerFontFamily() === 'serif' ? '1.5px solid #4F46E5' : '1px solid currentColor'" 
                        style="border-radius:4px; padding:3px 10px; font-size:11px; cursor:pointer; font-family:Georgia, serif; color:inherit; font-weight:800">Serif</button>
                <button (click)="readerFontFamily.set('sans')" 
                        [style.background]="readerFontFamily() === 'sans' ? 'rgba(79,70,229,0.1)' : 'transparent'"
                        [style.border]="readerFontFamily() === 'sans' ? '1.5px solid #4F46E5' : '1px solid currentColor'" 
                        style="border-radius:4px; padding:3px 10px; font-size:11px; cursor:pointer; font-family:sans-serif; color:inherit; font-weight:800">Sans-Serif</button>
                <button (click)="readerFontFamily.set('dyslexic')" 
                        [style.background]="readerFontFamily() === 'dyslexic' ? 'rgba(79,70,229,0.1)' : 'transparent'"
                        [style.border]="readerFontFamily() === 'dyslexic' ? '1.5px solid #4F46E5' : '1px solid currentColor'" 
                        style="border-radius:4px; padding:3px 10px; font-size:11px; cursor:pointer; font-family:'Comic Sans MS', cursive; color:inherit; font-weight:800">Dyslexic</button>
              </div>

              <!-- Font Size adjustment -->
              <div style="display:flex; align-items:center; gap:8px">
                <span style="font-size:11px; font-weight:800; text-transform:uppercase; opacity:0.8">{{ t('Taille', 'Size') }} :</span>
                <button (click)="decreaseFontSize()" style="background:transparent; border:1px solid currentColor; border-radius:4px; width:28px; height:28px; font-size:14px; font-weight:800; cursor:pointer; color:inherit; display:flex; align-items:center; justify-content:center">-</button>
                <span style="font-size:12px; font-weight:800; width:36px; text-align:center">{{ readerFontSize() }}px</span>
                <button (click)="increaseFontSize()" style="background:transparent; border:1px solid currentColor; border-radius:4px; width:28px; height:28px; font-size:14px; font-weight:800; cursor:pointer; color:inherit; display:flex; align-items:center; justify-content:center">+</button>
              </div>

              <!-- Ebook Reading Audio Player (Custom Teacher Audio) -->
              @if (book.audioUrl) {
                <div style="display:flex; align-items:center; gap:8px; background:rgba(16, 185, 129, 0.15); border:1px solid rgba(16, 185, 129, 0.3); border-radius:30px; padding:4px 12px; color:#047857">
                  <span style="font-size:11px; font-weight:800; text-transform:uppercase; display:flex; align-items:center; gap:4px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                    Lecture Audio :
                  </span>
                  <audio [src]="book.audioUrl" controls style="height:26px; max-width:240px; outline:none"></audio>
                </div>
              }
            </div>

            <!-- Reading Content Panel -->
            <div style="flex:1; display:flex; overflow:hidden">
              @if (immersiveBookMode()) {
                <!-- IMMERSIVE BOOK SPREAD VIEW -->
                <div style="flex:1; overflow-y:auto; padding:32px 24px; display:flex; flex-direction:column; align-items:center; justify-content:center; transition:all 0.2s" [style.background]="getThemeBg()">
                  
                  <!-- Opened Book Layout -->
                  <div style="display:flex; width:100%; max-width:1150px; min-height:560px; background:#fff; border-radius:12px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.18); border:1px solid; overflow:hidden; position:relative; transition: all 0.2s"
                       [style.background]="getThemeCardBg()" [style.color]="getThemeText()" [style.borderColor]="getThemeBorder()">
                    
                    <!-- Vertical spine divider line down the exact middle of the book -->
                    <div style="position:absolute; top:0; bottom:0; left:50%; width:2px; background:rgba(0,0,0,0.06); transform:translateX(-50%); z-index:5"></div>
                    <div style="position:absolute; top:0; bottom:0; left:50%; width:28px; background:linear-gradient(to right, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 100%); transform:translateX(0); z-index:4"></div>
                    <div style="position:absolute; top:0; bottom:0; right:50%; width:28px; background:linear-gradient(to left, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 100%); transform:translateX(0); z-index:4"></div>

                    <!-- LEFT PAGE: Current active page -->
                    <div style="flex:1; padding:48px 54px; display:flex; flex-direction:column; justify-content:space-between; border-right:1px solid rgba(0,0,0,0.03); overflow-y:auto; max-height:72vh" [style.font-family]="getFontFamilyStyle()" [style.font-size.px]="readerFontSize()">
                      @if (book.pages && book.pages[activePageIndex()]; as leftPg) {
                        <div>
                          <h3 style="font-family:'Outfit', sans-serif; font-size:18px; font-weight:900; margin:0 0 16px 0; border-bottom:1px solid; padding-bottom:8px; border-color:inherit; opacity:0.8">
                            {{ leftPg.title }}
                          </h3>

                          <!-- Sentences list -->
                          @let leftSents = parseSentences(leftPg.content);
                          <div style="display:flex; flex-direction:column; gap:14px">
                            @for (sent of leftSents; track sent.english; let sIdx = $index) {
                              <div [style.background]="activeSentenceIndex() === sIdx ? 'rgba(79,70,229,0.06)' : 'transparent'"
                                   [style.borderColor]="activeSentenceIndex() === sIdx ? '#4F46E5' : 'transparent'"
                                   style="border-left:4px solid; padding:6px 60px 6px 10px; border-radius:0 6px 6px 0; transition:all 0.2s; position:relative"
                                   (click)="activeSentenceIndex.set(sIdx); $event.stopPropagation()">
                                
                                <div style="font-size:15px; font-weight:800; display:flex; flex-wrap:wrap; gap:4px; line-height:1.6">
                                  @for (word of sent.words; track word) {
                                    <span (click)="clickWord(word, $event)" 
                                          style="cursor:pointer; padding:1px 2px; border-radius:4px"
                                          onmouseover="this.style.background='rgba(79,70,229,0.15)'"
                                          onmouseout="this.style.background='transparent'">
                                      {{ word }}
                                    </span>
                                  }
                                </div>

                                @if (showTranslations()) {
                                  <div style="font-size:12px; color:#64748B; font-weight:500; margin-top:2px; font-family:sans-serif">
                                    {{ sent.french }}
                                  </div>
                                }

                                <div style="position:absolute; right:6px; top:50%; transform:translateY(-50%); display:flex; gap:6px">
                                  <button (click)="speakText(sent.english); $event.stopPropagation()" style="background:none; border:none; color:inherit; cursor:pointer; opacity:0.7" title="Pronounce">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                                  </button>
                                  <button (click)="toggleBookmark(sIdx, sent.english); $event.stopPropagation()" style="background:none; border:none; color:inherit; cursor:pointer; opacity:0.7" title="Bookmark">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" [attr.fill]="isBookmarked(sIdx) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2.5"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                                  </button>
                                </div>
                              </div>
                            }
                          </div>
                        </div>
                        
                        <!-- Page number -->
                        <div style="font-size:11px; text-align:left; opacity:0.6; margin-top:24px; border-top:1px solid rgba(0,0,0,0.04); padding-top:8px">
                          Page {{ activePageIndex() + 1 }}
                        </div>
                      }
                    </div>

                    <!-- RIGHT PAGE: Next page (pageIndex + 1) -->
                    <div style="flex:1; padding:48px 54px; display:flex; flex-direction:column; justify-content:space-between; overflow-y:auto; max-height:72vh" [style.font-family]="getFontFamilyStyle()" [style.font-size.px]="readerFontSize()">
                      @if (activePageIndex() + 1 < (book.pages?.length || 0)) {
                        @let rightPg = book.pages![activePageIndex() + 1];
                        <div>
                          <h3 style="font-family:'Outfit', sans-serif; font-size:18px; font-weight:900; margin:0 0 16px 0; border-bottom:1px solid; padding-bottom:8px; border-color:inherit; opacity:0.8">
                            {{ rightPg.title }}
                          </h3>

                          <!-- Sentences list -->
                          @let rightSents = parseSentences(rightPg.content);
                          <div style="display:flex; flex-direction:column; gap:14px">
                            @for (sent of rightSents; track sent.english; let sIdx = $index) {
                              @let globalIdx = sIdx + 1000;
                              <div [style.background]="activeSentenceIndex() === globalIdx ? 'rgba(79,70,229,0.06)' : 'transparent'"
                                   [style.borderColor]="activeSentenceIndex() === globalIdx ? '#4F46E5' : 'transparent'"
                                   style="border-left:4px solid; padding:6px 60px 6px 10px; border-radius:0 6px 6px 0; transition:all 0.2s; position:relative"
                                   (click)="activeSentenceIndex.set(globalIdx); $event.stopPropagation()">
                                
                                <div style="font-size:15px; font-weight:800; display:flex; flex-wrap:wrap; gap:4px; line-height:1.6">
                                  @for (word of sent.words; track word) {
                                    <span (click)="clickWord(word, $event)" 
                                          style="cursor:pointer; padding:1px 2px; border-radius:4px"
                                          onmouseover="this.style.background='rgba(79,70,229,0.15)'"
                                          onmouseout="this.style.background='transparent'">
                                      {{ word }}
                                    </span>
                                  }
                                </div>

                                @if (showTranslations()) {
                                  <div style="font-size:12px; color:#64748B; font-weight:500; margin-top:2px; font-family:sans-serif">
                                    {{ sent.french }}
                                  </div>
                                }

                                <div style="position:absolute; right:6px; top:50%; transform:translateY(-50%); display:flex; gap:6px">
                                  <button (click)="speakText(sent.english); $event.stopPropagation()" style="background:none; border:none; color:inherit; cursor:pointer; opacity:0.7" title="Pronounce">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                                  </button>
                                  <button (click)="toggleBookmark(sIdx, sent.english); $event.stopPropagation()" style="background:none; border:none; color:inherit; cursor:pointer; opacity:0.7" title="Bookmark">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" [attr.fill]="isBookmarked(sIdx) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2.5"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                                  </button>
                                </div>
                              </div>
                            }
                          </div>
                        </div>

                        <!-- Page number -->
                        <div style="font-size:11px; text-align:right; opacity:0.6; margin-top:24px; border-top:1px solid rgba(0,0,0,0.04); padding-top:8px">
                          Page {{ activePageIndex() + 2 }}
                        </div>
                      } @else {
                        <!-- Blank end page or backing layout -->
                        <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100%; opacity:0.3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>
                          <span style="font-size:11px; font-weight:700; margin-top:8px">{{ t('Fin de l\'Ebook', 'End of Ebook') }}</span>
                        </div>
                      }
                    </div>

                  </div>

                  <!-- Book Turn controls & indicators -->
                  <div style="display:flex; justify-content:space-between; align-items:center; width:100%; max-width:1150px; margin-top:20px" [style.color]="getThemeText()">
                    <button [disabled]="activePageIndex() === 0" (click)="activePageIndex.set(activePageIndex() - 2)"
                            style="background:none; border:1px solid currentColor; color:inherit; border-radius:30px; height:38px; padding:0 20px; font-size:12px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:8px; transition:all 0.2s"
                            [style.opacity]="activePageIndex() === 0 ? '0.3' : '1'"
                            onmouseover="this.style.background='rgba(0,0,0,0.03)'" onmouseout="this.style.background='none'">
                      ← {{ t('Feuilleter Précédent', 'Turn Page Back') }}
                    </button>
                    <span style="font-size:12px; font-weight:800; opacity:0.8">
                      {{ activePageIndex() + 1 }}-{{ (activePageIndex() + 2) < (book.pages?.length || 0) ? activePageIndex() + 2 : (book.pages?.length || 1) }} / {{ book.pages?.length || 1 }}
                    </span>
                    <button [disabled]="activePageIndex() >= (book.pages?.length || 1) - 2" (click)="activePageIndex.set(activePageIndex() + 2)"
                            style="background:#4F46E5; border:1px solid #4F46E5; color:white; border-radius:30px; height:38px; padding:0 20px; font-size:12px; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:8px; transition:all 0.2s"
                            [style.opacity]="activePageIndex() >= (book.pages?.length || 1) - 2 ? '0.3' : '1'"
                            onmouseover="this.style.background='#4338CA'" onmouseout="this.style.background='#4F46E5'">
                      {{ t('Feuilleter Suivant', 'Turn Page Forward') }} →
                    </button>
                  </div>

                </div>
              } @else if (book.interactiveEnabled !== false) {
                <!-- THREE-COLUMN INTERACTIVE READER -->
                <!-- Left Sidebar (Metadata & Navigation) -->
                <div style="width:250px; border-right:1px solid; padding:20px; display:flex; flex-direction:column; justify-content:space-between; flex-shrink:0; overflow-y:auto"
                     [style.background]="getThemeCardBg()" [style.color]="getThemeText()" [style.borderColor]="getThemeBorder()">
                  <div>
                    <!-- Cover thumb -->
                    <div [style.background]="book.coverImageUrl ? 'url(' + book.coverImageUrl + ') center/cover' : (book.coverGradient || book.coverColor || '#4F46E5')"
                         style="width:90px; height:130px; border-radius:8px; margin:0 auto 16px auto; box-shadow:0 8px 20px rgba(0,0,0,0.15); position:relative; overflow:hidden">
                      <div style="position:absolute; top:0; left:0; width:5px; height:100%; background:rgba(0,0,0,0.2)"></div>
                    </div>
                    
                    <div style="text-align:center; margin-bottom:16px">
                      <div style="font-size:12px; font-weight:800">{{ book.title }}</div>
                      <div style="font-size:10px; opacity:0.8; margin-top:2px">{{ book.level }}</div>
                    </div>

                    <!-- Navigation options -->
                    <div style="display:flex; flex-direction:column; gap:6px; border-top:1px solid; padding-top:12px; border-color:inherit">
                      <button (click)="showBookmarksOnly.set(false)" [style.background]="!showBookmarksOnly() ? 'rgba(79,70,229,0.1)' : 'transparent'" [style.color]="!showBookmarksOnly() ? '#4F46E5' : 'inherit'" style="border:none; border-radius:6px; padding:8px 12px; text-align:left; font-size:11.5px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:8px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>
                        {{ t('Synopsis & Pages', 'Synopsis & Pages') }}
                      </button>
                      <button (click)="showBookmarksOnly.set(true)" [style.background]="showBookmarksOnly() ? 'rgba(79,70,229,0.1)' : 'transparent'" [style.color]="showBookmarksOnly() ? '#4F46E5' : 'inherit'" style="border:none; border-radius:6px; padding:8px 12px; text-align:left; font-size:11.5px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:8px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                        {{ t('Notes & Signets', 'Notes & Bookmarks') }}
                      </button>
                    </div>

                    <!-- Synopsis / Chapters list -->
                    @if (!showBookmarksOnly()) {
                      <div style="margin-top:20px">
                        <h4 style="font-size:10px; text-transform:uppercase; opacity:0.7; margin-bottom:8px">{{ t('Synopsis', 'Synopsis') }}</h4>
                        <p style="font-size:11px; line-height:1.5; margin:0 0 16px 0; opacity:0.8">{{ book.description }}</p>
                        
                        <h4 style="font-size:10px; text-transform:uppercase; opacity:0.7; margin-bottom:8px">{{ t('Chapitres', 'Chapters') }}</h4>
                        <div style="display:flex; flex-direction:column; gap:4px">
                          @for (pg of book.pages; track pg.id; let i = $index) {
                            <button (click)="activePageIndex.set(i)"
                                    [style.background]="activePageIndex() === i ? 'rgba(79,70,229,0.15)' : 'transparent'"
                                    [style.color]="activePageIndex() === i ? '#4F46E5' : 'inherit'"
                                    style="border:none; border-radius:6px; padding:6px 10px; text-align:left; font-size:11px; cursor:pointer; display:flex; justify-content:space-between; align-items:center">
                              <span>{{ i + 1 }}. {{ pg.title }}</span>
                              @if (activePageIndex() === i) {
                                <span style="font-size:9px; background:#4F46E5; color:white; padding:1px 4px; border-radius:4px">En cours</span>
                              }
                            </button>
                          }
                        </div>
                      </div>
                    } @else {
                      <!-- Bookmarks list -->
                      <div style="margin-top:20px">
                        <h4 style="font-size:10px; text-transform:uppercase; opacity:0.7; margin-bottom:8px">{{ t('Signets sauvegardés', 'Saved Bookmarks') }}</h4>
                        <div style="display:flex; flex-direction:column; gap:6px">
                          @let bkList = getBookmarksList();
                          @for (bk of bkList; track bk.key) {
                            <div (click)="activePageIndex.set(bk.pageIdx); activeSentenceIndex.set(bk.sentenceIdx)"
                                 style="padding:8px; border-radius:6px; border:1px solid; border-color:inherit; font-size:10.5px; cursor:pointer; background:rgba(0,0,0,0.02)">
                              <div style="font-weight:700; color:#4F46E5">{{ bk.pageTitle }}</div>
                              <div style="opacity:0.9; margin-top:2px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden">"{{ bk.text }}"</div>
                            </div>
                          } @empty {
                            <div style="font-size:11px; opacity:0.6; text-align:center; padding:12px">{{ t('Aucun signet pour le moment.', 'No bookmarks saved yet.') }}</div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Center Panel (Reader Area) -->
                <div style="flex:1; overflow-y:auto; padding:32px 24px; display:flex; flex-direction:column; align-items:stretch; transition:all 0.2s" [style.background]="getThemeBg()">
                  <div style="width:100%; max-width:100%; display:flex; flex-direction:column; gap:16px; padding: 0 8px;">
                    <!-- Page Header / Progress -->
                    <div style="display:flex; justify-content:space-between; align-items:center" [style.color]="getThemeText()">
                      <span style="font-size:11px; font-weight:800; opacity:0.8">{{ t('Chapitre', 'Chapter') }} {{ activePageIndex() + 1 }}</span>
                      <button (click)="focusMode.set(!focusMode())" style="background:none; border:1px solid currentColor; color:inherit; font-size:10px; font-weight:700; border-radius:6px; padding:4px 10px; cursor:pointer; display:flex; align-items:center; gap:4px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                        {{ focusMode() ? t('Mode Normal', 'Normal Mode') : t('Mode Focus', 'Focus Mode') }}
                      </button>
                    </div>

                    <!-- Quick Actions Bar -->
                    <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; border:1px solid; border-radius:12px; padding:10px; background:rgba(0,0,0,0.02); border-color:inherit" [style.color]="getThemeText()">
                      <button (click)="speakActivePage()" style="background:none; border:none; color:inherit; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                        {{ t('Écouter', 'Listen') }}
                      </button>
                      <button (click)="startRepeatingSentence()" style="background:none; border:none; color:inherit; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                        {{ t('Répéter', 'Repeat') }}
                      </button>
                      <button (click)="showTranslations.set(!showTranslations())" style="background:none; border:none; color:inherit; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                        {{ t('Traduire', 'Translate') }}
                      </button>
                      <button (click)="activePanel.set(activePanel() === 'notes' ? 'none' : 'notes')" style="background:none; border:none; color:inherit; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        {{ t('Notes', 'Notes') }}
                      </button>
                      <button (click)="activePanel.set(activePanel() === 'dict' ? 'none' : 'dict')" style="background:none; border:none; color:inherit; font-size:11px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>
                        {{ t('Dictionnaire', 'Dictionary') }}
                      </button>
                    </div>

                    <!-- Book Active Page Content Area -->
                    <div [style.background]="getThemeCardBg()" [style.color]="getThemeText()" [style.borderColor]="getThemeBorder()"
                         [style.font-family]="getFontFamilyStyle()" [style.font-size.px]="readerFontSize()"
                         style="border:1px solid; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.04); padding:32px; transition: all 0.2s">
                      
                      @if (book.pages && book.pages[activePageIndex()]; as activePg) {
                        <h3 style="font-family:'Outfit', sans-serif; font-size:20px; font-weight:900; margin:0 0 20px 0; border-bottom:1px solid; padding-bottom:12px; border-color:inherit">
                          {{ activePg.title }}
                        </h3>

                        <!-- Interactive Sentences List -->
                        @let parsedSents = parseSentences(activePg.content);
                        <div style="display:flex; flex-direction:column; gap:16px">
                          @for (sent of parsedSents; track sent.english; let sIdx = $index) {
                            <div [style.background]="activeSentenceIndex() === sIdx ? 'rgba(79,70,229,0.06)' : 'transparent'"
                                 [style.borderColor]="activeSentenceIndex() === sIdx ? '#4F46E5' : 'transparent'"
                                 style="border-left:4px solid; padding:8px 80px 8px 12px; border-radius:0 8px 8px 0; transition:all 0.2s; position:relative"
                                 (click)="activeSentenceIndex.set(sIdx); $event.stopPropagation()">
                              
                              <!-- English words line (large & bold) -->
                              <div style="font-size:16px; font-weight:800; display:flex; flex-wrap:wrap; gap:4px; line-height:1.6">
                                @for (word of sent.words; track word) {
                                  <span (click)="clickWord(word, $event)" 
                                        style="cursor:pointer; padding:1px 2px; border-radius:4px; transition:background 0.15s"
                                        onmouseover="this.style.background='rgba(79,70,229,0.15)'"
                                        onmouseout="this.style.background='transparent'">
                                    {{ word }}
                                  </span>
                                }
                              </div>

                              <!-- French translation underneath (smaller, grised) -->
                              @if (showTranslations()) {
                                <div style="font-size:12.5px; color:#64748B; font-weight:500; margin-top:4px; font-family:sans-serif">
                                  {{ sent.french }}
                                </div>
                              }

                              <!-- Play, Bookmark & Highlight Marker floating helpers -->
                              <div style="position:absolute; right:10px; top:50%; transform:translateY(-50%); display:flex; gap:8px">
                                <button (click)="speakText(sent.english); $event.stopPropagation()" style="background:none; border:none; color:inherit; cursor:pointer; opacity:0.8; padding:4px; border-radius:4px" title="Pronounce" onmouseover="this.style.background='rgba(0,0,0,0.05)'" onmouseout="this.style.background='none'">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                                </button>
                                <button (click)="toggleBookmark(sIdx, sent.english); $event.stopPropagation()" style="background:none; border:none; color:inherit; cursor:pointer; opacity:0.8; padding:4px; border-radius:4px" title="Bookmark" onmouseover="this.style.background='rgba(0,0,0,0.05)'" onmouseout="this.style.background='none'">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" [attr.fill]="isBookmarked(sIdx) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                                </button>
                                @if (activeSession() && activeSession()?.bookId === book.id) {
                                  <button (click)="markSentence(sIdx, sent.english); $event.stopPropagation()" style="background:#10B981; border:none; color:white; cursor:pointer; padding:4px; border-radius:4px; display:inline-flex; align-items:center" title="Surligner pour le professeur">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                                  </button>
                                }
                              </div>
                            </div>
                          }
                        </div>

                        <!-- Dictionary Popover Popup -->
                        @if (selectedWordInfo(); as info) {
                          <div style="background:#FFF; border:1px solid #CBD5E1; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1); padding:14px; margin-top:16px; border-left:6px solid #4F46E5" (click)="$event.stopPropagation()">
                            <div style="display:flex; justify-content:space-between; align-items:center">
                              <span style="font-size:14px; font-weight:800; color:#1E293B; display:flex; align-items:center; gap:4px">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="9" width="4" height="6" rx="1"/><path d="M6 9l7-7v20l-7-7"/></svg>
                                {{ info.word }}
                              </span>
                              <span style="font-size:9.5px; background:#EEF2FF; color:#4F46E5; padding:2px 6px; border-radius:20px; font-weight:800">{{ info.partOfSpeech }}</span>
                            </div>
                            <div style="font-size:11px; color:#64748B; margin-top:2px">{{ info.phonetic }}</div>
                            <div style="font-size:12px; font-weight:700; color:#4F46E5; margin-top:6px">{{ info.translation }}</div>
                            <div style="font-size:11.5px; color:#475569; margin-top:4px">{{ info.definition }}</div>
                            <div style="font-size:10.5px; font-style:italic; color:#64748B; margin-top:6px; background:#FAF5FF; padding:4px 8px; border-radius:4px">
                              Example: {{ info.example }}
                            </div>
                            <div style="display:flex; justify-content:flex-end; margin-top:8px">
                              <button (click)="selectedWordInfo.set(null)" style="background:#F1F5F9; border:none; border-radius:4px; padding:3px 8px; font-size:10px; cursor:pointer; font-weight:700">Fermer</button>
                            </div>
                          </div>
                        }

                      } @else {
                        <div style="font-size:13px; text-align:center; padding:20px">{{ t('Aucun chapitre trouvé.', 'No chapters found.') }}</div>
                      }
                    </div>

                    <!-- Bottom Page turn controls -->
                    <div style="display:flex; justify-content:space-between; align-items:center" [style.color]="getThemeText()">
                      <button [disabled]="activePageIndex() === 0" (click)="activePageIndex.set(activePageIndex() - 1)"
                              style="background:none; border:1px solid currentColor; color:inherit; border-radius:6px; height:34px; padding:0 12px; font-size:11px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px"
                              [style.opacity]="activePageIndex() === 0 ? '0.4' : '1'">
                        ← {{ t('Précédent', 'Previous') }}
                      </button>
                      <span style="font-size:11px; font-weight:700">{{ activePageIndex() + 1 }} / {{ book.pages?.length || 1 }}</span>
                      <button [disabled]="activePageIndex() >= (book.pages?.length || 1) - 1" (click)="activePageIndex.set(activePageIndex() + 1)"
                              style="background:#4F46E5; border:1px solid #4F46E5; color:white; border-radius:6px; height:34px; padding:0 12px; font-size:11px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px"
                              [style.opacity]="activePageIndex() >= (book.pages?.length || 1) - 1 ? '0.4' : '1'">
                        {{ t('Suivant', 'Next') }} →
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Right Sidebar (Classroom Activity & Live Highlights Workspace) -->
                @if (!focusMode()) {
                  <div style="width:300px; border-left:1px solid; padding:16px; display:flex; flex-direction:column; justify-content:space-between; flex-shrink:0"
                       [style.background]="getThemeCardBg()" [style.color]="getThemeText()" [style.borderColor]="getThemeBorder()">
                    
                    <div>
                      <!-- Header -->
                      <div style="border-bottom:1px solid; padding-bottom:12px; border-color:inherit; margin-bottom:16px">
                        <div style="font-size:13.5px; font-weight:900; display:flex; align-items:center; gap:6px">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          Activité de Classe 🎯
                        </div>
                        <div style="font-size:10px; opacity:0.8; margin-top:2px">{{ t('Surlignage collaboratif en direct', 'Live collaborative highlighting') }}</div>
                      </div>

                      <!-- Highlighting status / My highlights -->
                      @if (activeSession() && activeSession()?.bookId === book.id) {
                        <div style="background:#ECFDF5; border:1px solid #A7F3D0; border-radius:8px; padding:10px; margin-bottom:16px">
                          <div style="font-size:11px; font-weight:800; color:#065F46; display:flex; align-items:center; gap:6px">
                            <span style="width:8px; height:8px; background:#10B981; border-radius:50%; display:inline-block; animation:pulse 1.5s infinite"></span>
                            Session de Marquage Active !
                          </div>
                          <p style="font-size:10px; color:#047857; margin:4px 0 0 0">Cliquez sur l'icône de surlignage vert à côté d'une phrase pour l'envoyer au professeur.</p>
                        </div>
                      } @else {
                        <div style="background:#FAF5FF; border:1px solid #E9D5FF; border-radius:8px; padding:10px; margin-bottom:16px">
                          <div style="font-size:11px; font-weight:800; color:#6B21A8; display:flex; align-items:center; gap:6px">
                            🔒 Session en pause
                          </div>
                          <p style="font-size:10px; color:#701A75; margin:4px 0 0 0">Attendez que le professeur active le signal de marquage.</p>
                        </div>
                      }

                      <h4 style="font-size:11px; font-weight:800; text-transform:uppercase; opacity:0.8; margin-bottom:8px">Mes Surlignages ({{ getMyHighlights().length }})</h4>
                      <div style="display:flex; flex-direction:column; gap:8px; max-height:300px; overflow-y:auto">
                        @for (hl of getMyHighlights(); track hl.id) {
                          <div style="border:1px solid; border-radius:8px; padding:8px; border-color:inherit; background:rgba(0,0,0,0.01)">
                            <div style="font-size:10px; color:var(--text-secondary); display:flex; justify-content:space-between">
                              <span>Page {{ hl.pageIdx + 1 }}</span>
                              @if (hl.xpAwarded) {
                                <span style="color:#10B981; font-weight:800">+{{ hl.xpAwarded }} XP 🏆</span>
                              } @else {
                                <span style="color:#64748B; font-style:italic">En attente...</span>
                              }
                            </div>
                            <p style="font-size:11px; margin:4px 0 0 0; line-height:1.4">"{{ hl.text }}"</p>
                          </div>
                        } @empty {
                          <div style="font-size:11px; opacity:0.6; text-align:center; padding:12px">Aucun surlignage envoyé.</div>
                        }
                      </div>
                    </div>

                    <!-- Footnote explanation -->
                    <div style="font-size:10px; opacity:0.7; text-align:center; border-top:1px solid; padding-top:12px; border-color:inherit">
                      Chaque marque validée vous rapporte des XP.
                    </div>
                  </div>
                }
              } @else {
                <!-- STANDARD PAPER-BOOK READER FALLBACK (existing logic) -->
                <!-- Left bar summary (Desktop only) -->
                <div style="width:280px; border-right:1px solid; padding:24px; display:flex; flex-direction:column; justify-content:space-between; flex-shrink:0; transition:all 0.2s" 
                     [style.background]="getThemeCardBg()" [style.color]="getThemeText()" [style.borderColor]="getThemeBorder()"
                     class="reading-sidebar">
                  <div>
                    <!-- Cover Image Preview inside Reader -->
                    <div [style.background]="book.coverImageUrl ? 'url(' + book.coverImageUrl + ') center/cover' : (book.coverGradient ? book.coverGradient : (book.coverColor ? book.coverColor : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'))"
                         style="width: 110px; height: 160px; border-radius: 8px; position: relative; box-shadow: 0 8px 20px rgba(0,0,0,0.15); overflow:hidden; margin: 0 auto 20px auto">
                      <div style="position:absolute; top:0; left:0; width:5px; height:100%; background:rgba(0,0,0,0.2)"></div>
                      <div style="position:absolute; inset:0; background:rgba(0,0,0,0.08)"></div>
                      <div style="position:absolute; bottom:12px; left:16px; color:white; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3)); display:flex; align-items:center; justify-content:center">
                        <span style="font-size:32px">{{ getBookEmoji(book.coverEmoji) }}</span>
                      </div>
                    </div>

                    <h4 style="font-size:11px; text-transform:uppercase; opacity:0.8; font-weight:800; letter-spacing:0.5px; margin-bottom:8px; border-bottom:1px solid; padding-bottom:6px; border-color:inherit">Synopsis</h4>
                    <p style="font-size:11.5px; opacity:0.9; line-height:1.6; margin:0">{{ book.description }}</p>
                  </div>
                  <div style="font-size:11px; opacity:0.8; line-height:2.0; border-top:1px solid; padding-top:16px; border-color:inherit; display:flex; flex-direction:column; gap:6px">
                    <span>👤 {{ t('Auteur', 'Author') }} : {{ book.author }}</span>
                    <span>📅 {{ t('Publié le', 'Published on') }} {{ book.createdAt }}</span>
                    <span>👁️ {{ book.views }} {{ t('lectures', 'views') }}</span>
                  </div>
                </div>

                <!-- Scrollable Reader (Center) -->
                <div style="flex:1; overflow-y:auto; padding:48px 24px; display:flex; justify-content:center; transition:all 0.2s" [style.background]="getThemeBg()">
                  <div [style.background]="getThemeCardBg()" [style.color]="getThemeText()" [style.borderColor]="getThemeBorder()"
                       [style.font-family]="getFontFamilyStyle()" [style.font-size.px]="readerFontSize()"
                       style="width:100%; max-width:680px; border:1px solid; border-radius:12px; box-shadow:0 8px 32px rgba(0,0,0,0.06); padding:48px 40px; min-height:fit-content; line-height:1.8; transition: all 0.2s">
                    <h2 style="font-family:'Outfit', sans-serif; font-size:24px; font-weight:900; margin-top:0; margin-bottom:10px; line-height:1.25">{{ book.title }}</h2>
                    <div style="display:flex; gap:14px; align-items:center; font-family:'Outfit', sans-serif; font-size:11px; opacity:0.8; margin-bottom:24px; border-bottom:1px solid; padding-bottom:16px; flex-wrap:wrap; border-color:inherit">
                      <span>👤 <strong>{{ book.author }}</strong></span>
                      <span>•</span>
                      <span>🏅 {{ t('Niveau', 'Level') }} {{ book.level }}</span>
                      <span>•</span>
                      <span>{{ book.language === 'fr' ? '🇫🇷 ' + t('Français', 'French') : '🇬🇧 ' + t('Anglais', 'English') }}</span>
                      @if (book.pages && book.pages.length > 0) {
                        <span>•</span>
                        <span style="font-weight:700">{{ book.pages.length }} {{ book.pages.length === 1 ? t('page', 'page') : t('pages', 'pages') }}</span>
                      }
                    </div>

                    <!-- Page tabs if multi-page ebook -->
                    @if (book.pages && book.pages.length > 0) {
                      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid; border-color:inherit">
                        @for (pg of book.pages; track pg.id; let i = $index) {
                          <button (click)="activePageIndex.set(i)"
                                  [style.background]="activePageIndex() === i ? '#4F46E5' : 'rgba(0,0,0,0.05)'"
                                  [style.color]="activePageIndex() === i ? 'white' : 'inherit'"
                                  style="border:none; border-radius:20px; padding:5px 14px; font-size:11px; font-weight:700; cursor:pointer; transition:all 0.2s">
                            {{ i + 1 }}. {{ pg.title || t('Page', 'Page') }}
                          </button>
                        }
                      </div>

                      @if (book.pages[activePageIndex()]; as activePg) {
                        <h3 style="font-size:18px; font-weight:800; margin:0 0 16px 0">{{ activePg.title }}</h3>
                        <div style="white-space:pre-wrap; line-height:1.8" [innerHTML]="activePg.content"></div>
                      }

                      <!-- Prev / Next navigation -->  
                      <div style="display:flex; justify-content:space-between; align-items:center; margin-top:36px; padding-top:16px; border-top:1px solid; border-color:inherit">
                        <button [disabled]="activePageIndex() === 0" (click)="activePageIndex.set(activePageIndex() - 1)"
                                style="background:none; border:1px solid currentColor; color:inherit; border-radius:6px; height:34px; padding:0 12px; font-size:11px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 0.2s"
                                [style.opacity]="activePageIndex() === 0 ? '0.4' : '1'">
                          ← {{ t('Précédent', 'Previous') }}
                        </button>
                        <span style="font-size:11px; font-weight:700">{{ activePageIndex() + 1 }} / {{ book.pages.length }}</span>
                        <button [disabled]="activePageIndex() >= book.pages.length - 1" (click)="activePageIndex.set(activePageIndex() + 1)"
                                style="background:#4F46E5; border:1px solid #4F46E5; color:white; border-radius:6px; height:34px; padding:0 12px; font-size:11px; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 0.2s"
                                [style.opacity]="activePageIndex() >= book.pages.length - 1 ? '0.4' : '1'"
                                onmouseover="this.style.background='#4338CA'" onmouseout="this.style.background='#4F46E5'">
                          {{ t('Suivant', 'Next') }} →
                        </button>
                      </div>

                    } @else {
                      <!-- Fallback: legacy single-content ebook -->
                      <div style="white-space:pre-wrap; line-height:1.8" [innerHTML]="book.content"></div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Persistent player / progress bar at the bottom -->
            @if (book.interactiveEnabled !== false) {
              <div style="height:70px; border-top:1px solid rgba(0,0,0,0.06); padding:0 24px; display:flex; align-items:center; justify-content:space-between; background:#FFF; flex-shrink:0" [style.color]="'var(--text-primary)'">
                <div style="display:flex; align-items:center; gap:12px">
                  <div [style.background]="book.coverImageUrl ? 'url(' + book.coverImageUrl + ') center/cover' : (book.coverGradient || book.coverColor || '#4F46E5')"
                       style="width:36px; height:50px; border-radius:4px; box-shadow:0 2px 6px rgba(0,0,0,0.1)"></div>
                  <div>
                    <div style="font-size:11px; font-weight:800">{{ t('En cours de lecture', 'Now Reading') }}</div>
                    <div style="font-size:10px; color:var(--text-muted)">{{ book.title }}</div>
                  </div>
                </div>
                
                <div style="display:flex; align-items:center; gap:20px">
                  <div style="text-align:right">
                    <span style="font-size:11px; font-weight:800; color:#D97706">🏆 XP gagnés : +{{ xpGained() }}</span>
                  </div>
                  <span style="width:1px; height:20px; background:rgba(0,0,0,0.1)"></span>
                  <div style="text-align:right">
                    <span style="font-size:11px; font-weight:800; color:#4F46E5">⏱️ Temps : {{ readingTime() }} min</span>
                  </div>
                </div>
              </div>
            }
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
      background: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
    }
    .horizontal-scroll-container::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 0, 0, 0.2);
    }
    .book-title-trunc {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .book-desc-trunc {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    @media (max-width: 768px) {
      .reading-sidebar {
        display: none !important;
      }
    }
  `]
})
export class StudentEbooksComponent {
  // Interactive reader companion states
  focusMode = signal<boolean>(false);
  immersiveBookMode = signal<boolean>(false);
  showTranslations = signal<boolean>(true);
  activeSentenceIndex = signal<number | null>(null);
  selectedWordInfo = signal<any | null>(null);
  aiMessages = signal<any[]>([ { role: 'ai', text: 'Bonjour Emma ! Comment puis-je t\'aider avec cette histoire ?' } ]);
  aiQueryInput = '';
  showBookmarksOnly = signal<boolean>(false);
  bookmarkedSentences = signal<Record<string, boolean>>({}); // key format: bookId-pageIdx-sentenceIdx
  xpGained = signal<number>(245);
  readingTime = signal<number>(18);
  activePanel = signal<string>('none'); // notes, dict, etc.
  currentUser = signal<UserProfile | null>(null);
  activeSession = signal<{ bookId: string; active: boolean } | null>(null);
  highlights = signal<EbookHighlight[]>([]);

  parseSentences(content: string): { english: string; french: string; words: string[] }[] {
    if (!content) return [];

    // Strip HTML tags
    const text = content.replace(/<[^>]*>/g, '').trim();
    const parsed: { english: string; french: string; words: string[] }[] = [];

    // --- Strategy 1: Explicit separator per line (EN / FR or EN | FR) ---
    const lines = text.split(/\n+/).map((l: string) => l.trim()).filter(Boolean);
    const hasSeparators = lines.some((l: string) => l.includes(' / ') || l.includes(' | '));

    if (hasSeparators) {
      lines.forEach((line: string) => {
        let english = line;
        let french = '';
        if (line.includes(' / ')) {
          const parts = line.split(' / ');
          english = parts[0].trim();
          french = parts.slice(1).join(' / ').trim();
        } else if (line.includes(' | ')) {
          const parts = line.split(' | ');
          english = parts[0].trim();
          french = parts.slice(1).join(' | ').trim();
        }
        const cleanEN = english.replace(/^\d+[\.]\s*/, '').trim();
        const cleanFR = french.replace(/^\d+[\.]\s*/, '').trim();
        if (!cleanEN) return;
        parsed.push({ english: cleanEN, french: cleanFR, words: cleanEN.split(/\s+/).filter(Boolean) });
      });
      return parsed;
    }

    // --- Strategy 2: Numbered mixed format "1 English... French... 2 English..." ---
    const numberedChunks = text.split(/(?=\d+\s+[A-Z])/);
    if (numberedChunks.length > 1) {
      for (const chunk of numberedChunks) {
        const clean = chunk.replace(/^\d+\s*/, '').trim();
        if (!clean) continue;
        const rawSentences = clean.match(/[^.!?]+[.!?]*/g) || [clean];
        const englishParts: string[] = [];
        const frenchParts: string[] = [];
        for (const s of rawSentences) {
          const trimmed = s.trim();
          if (!trimmed) continue;
          if (this.looksLikeFrench(trimmed)) { frenchParts.push(trimmed); }
          else { englishParts.push(trimmed); }
        }
        const english = englishParts.join(' ').trim();
        const french = frenchParts.join(' ').trim();
        if (!english && !french) continue;
        const display = english || french;
        parsed.push({ english: display, french: english ? french : '', words: display.split(/\s+/).filter(Boolean) });
      }
      if (parsed.length > 0) return parsed;
    }

    // --- Strategy 3: Sentence-by-sentence language classification ---
    const sentences = text.match(/[^.!?\n]+[.!?]*/g) || text.split(/\n+/);
    let buf = { english: '', french: '' };
    const flush = () => {
      if (!buf.english && !buf.french) return;
      const display = buf.english || buf.french;
      parsed.push({ english: display, french: buf.english ? buf.french : '', words: display.split(/\s+/).filter(Boolean) });
      buf = { english: '', french: '' };
    };
    for (const raw of sentences) {
      const s = raw.trim();
      if (!s) continue;
      if (this.looksLikeFrench(s)) {
        buf.french += (buf.french ? ' ' : '') + s;
      } else {
        if (buf.english) flush();
        buf.english += (buf.english ? ' ' : '') + s;
      }
    }
    flush();
    return parsed.length > 0 ? parsed : [{ english: text, french: '', words: text.split(/\s+/).filter(Boolean) }];
  }

  /** Heuristic: detect French by accent chars or common French function words */
  looksLikeFrench(sentence: string): boolean {
    const fr = /\b(le|la|les|de|du|des|un|une|il|elle|nous|vous|ils|elles|est|sont|avec|dans|pour|sur|par|que|qui|se|sa|son|ses|leur|leurs|au|aux|en|je|tu|mon|ton|ma|ta|chaque|très|mais|aussi|parce|peut|avoir|être|faire|voir|venir|plus|tout|bien|même|comme|cette|autre|alors|lors|dont|pas|ni|beaucoup|avant|après|pendant|depuis|sans|sous|entre|vers)\b/i;
    const hasFrenchChars = /[àâäéèêëîïôùûüçœæ]/i.test(sentence);
    const wordCount = sentence.trim().split(/\s+/).length;
    if (wordCount < 3) return false;
    return hasFrenchChars || fr.test(sentence);
  }

  getMockTranslation(text: string): string {
    const lower = text.toLowerCase().trim();
    if (lower.includes('hello')) return "Bonjour ! Mon nom est Emma.";
    if (lower.includes('twenty-five')) return "J'ai vingt-cinq ans.";
    if (lower.includes('from france')) return "Je viens de France, mais j'habite au Sénégal.";
    if (lower.includes('teacher')) return "Je suis professeure d'anglais.";
    if (lower.includes('love my job')) return "J'aime mon travail et mes élèves.";
    return "Traduction automatique...";
  }

  clickWord(word: string, event: Event) {
    event.stopPropagation();
    const info = this.getWordInfo(word);
    this.selectedWordInfo.set({ word, ...info });
  }

  getWordInfo(word: string) {
    const cleanWord = word.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").trim();
    const commonVocab: Record<string, { definition: string; translation: string; partOfSpeech: string; phonetic: string; example: string }> = {
      'live': { definition: 'To remain alive; reside in a place.', translation: 'habiter, vivre', partOfSpeech: 'verbe', phonetic: '/lɪv/', example: 'I live in Dakar. (J\'habite à Dakar.)' },
      'hello': { definition: 'Used as a greeting or to begin a conversation.', translation: 'bonjour, salut', partOfSpeech: 'interjection', phonetic: '/həˈləʊ/', example: 'Hello Emma! (Bonjour Emma !)' },
      'teacher': { definition: 'A person who teaches, especially in a school.', translation: 'professeur, enseignant', partOfSpeech: 'nom', phonetic: '/ˈtiː.tʃər/', example: 'I am an English teacher. (Je suis professeure d\'anglais.)' },
      'students': { definition: 'People who are studying at a school or college.', translation: 'élèves, étudiants', partOfSpeech: 'nom', phonetic: '/ˈstjuː.dənts/', example: 'I love my job and my students. (J\'aime mon travail et mes élèves.)' },
      'friendship': { definition: 'A relationship between friends.', translation: 'amitié', partOfSpeech: 'nom', phonetic: '/ˈfrend.ʃɪp/', example: 'A new friendship through English. (Une nouvelle amitié grâce à l\'anglais.)' },
      'english': { definition: 'The language of England, widely used globally.', translation: 'anglais', partOfSpeech: 'nom/adjectif', phonetic: '/ˈɪŋ.lɪʃ/', example: 'Learning English is fun. (Apprendre l\'anglais est amusant.)' },
      'school': { definition: 'An institution for educating children.', translation: 'école', partOfSpeech: 'nom', phonetic: '/skuːl/', example: 'At school. (À l\'école.)' },
      'family': { definition: 'A group of one or more parents and their children.', translation: 'famille', partOfSpeech: 'nom', phonetic: '/ˈfæm.əl.i/', example: 'My family. (Ma famille.)' },
      'work': { definition: 'Activity involving mental or physical effort.', translation: 'travail', partOfSpeech: 'nom/verbe', phonetic: '/wɜːk/', example: 'At work. (Au travail.)' }
    };
    
    return commonVocab[cleanWord] || {
      definition: 'A word in the eBook text.',
      translation: 'Traduction indisponible',
      partOfSpeech: 'mot',
      phonetic: `/${cleanWord}/`,
      example: `This word "${word}" is used in the text.`
    };
  }

  speakText(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    } else {
      alert('Text-to-speech is not supported in this browser.');
    }
  }

  speakTextSlowly(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.65;
      window.speechSynthesis.speak(utterance);
    }
  }

  speakActivePage() {
    const activePg = this.activeBook()?.pages?.[this.activePageIndex()];
    if (!activePg) return;
    const sentences = this.parseSentences(activePg.content);
    if (sentences.length === 0) return;
    
    let idx = 0;
    const speakNext = () => {
      if (idx < sentences.length) {
        this.activeSentenceIndex.set(idx);
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(sentences[idx].english);
          utterance.lang = 'en-US';
          utterance.rate = 0.9;
          utterance.onend = () => {
            idx++;
            speakNext();
          };
          window.speechSynthesis.speak(utterance);
        }
      } else {
        this.activeSentenceIndex.set(null);
      }
    };
    speakNext();
  }

  startRepeatingSentence() {
    const activePg = this.activeBook()?.pages?.[this.activePageIndex()];
    if (!activePg) return;
    const sentences = this.parseSentences(activePg.content);
    const activeIdx = this.activeSentenceIndex() || 0;
    const targetText = sentences[activeIdx]?.english || '';
    
    if (!targetText) return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      this.aiMessages.update(msgs => [...msgs, { role: 'ai', text: `🎙️ Écoute activée. Répétez après moi : "${targetText}"` }]);
      recognition.start();
      
      recognition.onresult = (event: any) => {
        const spokenText = event.results[0][0].transcript;
        const confidence = Math.round(event.results[0][0].confidence * 100);
        
        this.aiMessages.update(msgs => [
          ...msgs, 
          { role: 'user', text: spokenText },
          { role: 'ai', text: `🎯 Analyse de prononciation complète ! Score : ${confidence}%. Vous avez dit : "${spokenText}".` }
        ]);
      };
      
      recognition.onerror = () => {
        this.aiMessages.update(msgs => [...msgs, { role: 'ai', text: '⚠️ Désolé, je n\'ai pas bien entendu votre prononciation.' }]);
      };
    } else {
      this.aiMessages.update(msgs => [
        ...msgs, 
        { role: 'ai', text: '🎙️ La reconnaissance vocale n\'est pas supportée dans votre navigateur. Simulez une prononciation...' }
      ]);
      setTimeout(() => {
        this.aiMessages.update(msgs => [
          ...msgs, 
          { role: 'user', text: targetText },
          { role: 'ai', text: '🎯 Prononciation excellente ! (Simulée) +10 XP gagnés pour votre pratique orale.' }
        ]);
      }, 1500);
    }
  }

  toggleBookmark(sentenceIdx: number, text: string) {
    const book = this.activeBook();
    if (!book) return;
    const pageIdx = this.activePageIndex();
    const key = `${book.id}-${pageIdx}-${sentenceIdx}`;
    
    this.bookmarkedSentences.update(bookmarks => {
      const updated = { ...bookmarks };
      if (updated[key]) {
        delete updated[key];
        // Remove from persistent storage
        const savedStr = localStorage.getItem('speak_ebook_bookmarks') || '[]';
        const saved = JSON.parse(savedStr);
        const filtered = saved.filter((b: any) => b.key !== key);
        localStorage.setItem('speak_ebook_bookmarks', JSON.stringify(filtered));
      } else {
        updated[key] = true;
        const savedStr = localStorage.getItem('speak_ebook_bookmarks') || '[]';
        const saved = JSON.parse(savedStr);
        if (!saved.some((b: any) => b.key === key)) {
          saved.push({
            key,
            bookId: book.id,
            pageIdx,
            sentenceIdx,
            pageTitle: book.pages?.[pageIdx]?.title || `Page ${pageIdx + 1}`,
            text
          });
          localStorage.setItem('speak_ebook_bookmarks', JSON.stringify(saved));
        }
      }
      return updated;
    });
  }

  isBookmarked(sentenceIdx: number): boolean {
    const book = this.activeBook();
    if (!book) return false;
    const pageIdx = this.activePageIndex();
    const key = `${book.id}-${pageIdx}-${sentenceIdx}`;
    return !!this.bookmarkedSentences()[key];
  }

  getBookmarksList(): { key: string; pageIdx: number; sentenceIdx: number; pageTitle: string; text: string }[] {
    const savedStr = localStorage.getItem('speak_ebook_bookmarks') || '[]';
    return JSON.parse(savedStr);
  }

  markSentence(sentenceIdx: number, text: string) {
    const book = this.activeBook();
    const user = this.currentUser();
    if (!book || !user) return;
    
    this.db.addHighlight({
      bookId: book.id,
      studentId: user.id,
      studentName: user.name || 'Étudiant',
      pageIdx: this.activePageIndex(),
      sentenceIdx,
      text
    });
  }

  getMyHighlights(): EbookHighlight[] {
    const user = this.currentUser();
    const book = this.activeBook();
    if (!user || !book) return [];
    return this.highlights().filter(h => h.studentId === user.id && h.bookId === book.id);
  }

  handleAIQuery(query: string) {
    if (!query.trim()) return;
    
    const userMsg = { role: 'user', text: query };
    this.aiMessages.update(msgs => [...msgs, userMsg]);
    
    const activePg = this.activeBook()?.pages?.[this.activePageIndex()];
    const sentences = activePg ? this.parseSentences(activePg.content) : [];
    const activeSentence = (this.activeSentenceIndex() !== null && sentences[this.activeSentenceIndex()!]) 
      ? sentences[this.activeSentenceIndex()!].english 
      : (sentences[0]?.english || 'this text');
      
    let aiResponse = '';
    if (query.includes('signifie')) {
      const translation = (this.activeSentenceIndex() !== null && sentences[this.activeSentenceIndex()!]) 
        ? sentences[this.activeSentenceIndex()!].french 
        : 'la traduction';
      aiResponse = `La phrase "${activeSentence}" signifie en français : "${translation}".`;
    } else if (query.includes('grammaire')) {
      if (activeSentence.includes('live')) {
        aiResponse = `Dans la phrase "${activeSentence}", le mot "live" est un verbe conjugué au présent simple à la première personne du singulier ("I live"). La préposition "in" introduit le lieu (Sénégal).`;
      } else if (activeSentence.includes('years old')) {
        aiResponse = `En anglais, pour exprimer l'âge, on utilise le verbe "to be" (am) suivi de l'âge et de l'expression optionnelle "years old", contrairement au français qui utilise le verbe "avoir".`;
      } else {
        aiResponse = `Voici l'analyse grammaticale de "${activeSentence}" : Il s'agit d'une phrase simple structurée avec un sujet, un verbe d'état ou d'action, et des compléments.`;
      }
    } else if (query.includes('exemple')) {
      if (activeSentence.includes('live')) {
        aiResponse = `Voici un autre exemple avec "live" : "They live in London now." (Ils habitent à Londres maintenant.)`;
      } else if (activeSentence.includes('teacher')) {
        aiResponse = `Voici un autre exemple avec "teacher" : "My father is a history teacher." (Mon père est professeur d'histoire.)`;
      } else {
        aiResponse = `Voici un autre exemple d'utilisation similaire : "We are learning a new language together." (Nous apprenons une nouvelle langue ensemble.)`;
      }
    } else if (query.includes('Prononce')) {
      aiResponse = `Je lis lentement la phrase active pour vous.`;
      this.speakTextSlowly(activeSentence);
    } else {
      aiResponse = `En rapport avec "${activeSentence}" : C'est une excellente question ! Cela permet d'approfondir la structure et le vocabulaire de l'histoire. Que souhaitez-vous savoir d'autre ?`;
    }
    
    setTimeout(() => {
      this.aiMessages.update(msgs => [...msgs, { role: 'ai', text: aiResponse }]);
    }, 600);
    this.aiQueryInput = '';
  }

  private db = inject(DatabaseService);

  ebooks = signal<Ebook[]>([]);
  activeBook = signal<Ebook | null>(null);
  activePageIndex = signal<number>(0);

  // Filters
  searchQuery = '';
  filterLevel = 'All';
  filterLanguage = 'All';

  // Customization controls
  readerTheme = signal<'cream' | 'dark' | 'light'>('cream');
  readerFontSize = signal<number>(18);
  readerFontFamily = signal<'serif' | 'sans' | 'dyslexic'>('serif');

  constructor() {
    this.db.observeEbooks().subscribe(list => this.ebooks.set(list.filter(b => b.status !== 'draft')));
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
    this.db.observeActiveHighlightSession().subscribe(session => this.activeSession.set(session));
    this.db.observeEbookHighlights().subscribe(list => this.highlights.set(list));
  }

  t(fr: string, en: string): string {
    return this.db.activeLang() === 'en' ? en : fr;
  }

  getBookEmoji(emoji?: string): string {
    if (!emoji) return '📖';
    if (['book', 'award', 'star', 'graduation', 'message'].includes(emoji)) {
      const map: Record<string, string> = {
        'book': '📖',
        'award': '🏆',
        'star': '⭐',
        'graduation': '🎓',
        'message': '💬'
      };
      return map[emoji] || '📖';
    }
    return emoji;
  }

  increaseFontSize() {
    if (this.readerFontSize() < 26) {
      this.readerFontSize.set(this.readerFontSize() + 1);
    }
  }

  decreaseFontSize() {
    if (this.readerFontSize() > 14) {
      this.readerFontSize.set(this.readerFontSize() - 1);
    }
  }

  getThemeBg(): string {
    const map = {
      cream: '#FAF6EE',
      dark: '#121212',
      light: '#F1F5F9'
    };
    return map[this.readerTheme()];
  }

  getThemeCardBg(): string {
    const map = {
      cream: '#FFFDF9',
      dark: '#1E1E1E',
      light: '#FFFFFF'
    };
    return map[this.readerTheme()];
  }

  getThemeText(): string {
    const map = {
      cream: '#2E2519',
      dark: '#E0E0E0',
      light: '#1E293B'
    };
    return map[this.readerTheme()];
  }

  getThemeBorder(): string {
    const map = {
      cream: '#E6DEC9',
      dark: '#2D2D2D',
      light: '#E2E8F0'
    };
    return map[this.readerTheme()];
  }

  getThemeToolbarBg(): string {
    const map = {
      cream: '#F4EFE3',
      dark: '#1A1A1A',
      light: '#F8FAFC'
    };
    return map[this.readerTheme()];
  }

  getThemeToolbarText(): string {
    const map = {
      cream: '#4E3E27',
      dark: '#AAAAAA',
      light: '#64748B'
    };
    return map[this.readerTheme()];
  }

  getFontFamilyStyle(): string {
    const map = {
      serif: 'Georgia, Constantia, serif',
      sans: '"Outfit", Inter, sans-serif',
      dyslexic: '"Comic Sans MS", cursive'
    };
    return map[this.readerFontFamily()];
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
