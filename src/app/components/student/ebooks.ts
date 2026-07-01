import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Ebook, UserProfile } from '../../services/database.service';

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
            <h3 style="margin:0; font-size:16px; font-weight:800; color:var(--text-primary)">📚 Bibliothèque Digitale</h3>
            <p style="margin:2px 0 0 0; font-size:11px; color:var(--text-secondary)">Accédez aux ebooks pédagogiques et guides écrits par vos professeurs.</p>
          </div>
          
          <div style="display:flex; gap:8px; flex-wrap:wrap">
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              placeholder="Rechercher un livre..." 
              class="form-input" 
              style="width:200px; height:36px; font-size:12px; border:1px solid var(--border-weak); border-radius:6px; padding:0 10px" 
            />
            <select [(ngModel)]="filterLevel" class="form-select" style="height:36px; font-size:12px; border:1px solid var(--border-weak); border-radius:6px; padding:0 10px">
              <option value="All">Tous Niveaux</option>
              <option value="Beginner">Débutant</option>
              <option value="Intermediate">Intermédiaire</option>
              <option value="Advanced">Avancé</option>
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
            <span style="font-weight:800; color:var(--text-primary); font-size:13.5px">Most Popular eBooks</span>
          </div>
          
          <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:16px; margin-top:10px">
            @for (book of mostPopularBooks(); track book.id) {
              <div class="card" style="margin:0; background:linear-gradient(135deg, #FFFDF9 0%, #FFFBEB 100%); border:1.5px solid #FDE68A; display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.2s" class="book-card">
                <div>
                  <div style="display:flex; justify-content:space-between; align-items:flex-start">
                    <span style="font-size:44px; display:block; margin-bottom:10px">{{ book.coverEmoji }}</span>
                    <span class="badge" style="background:#F59E0B; color:white; font-size:10px; font-weight:700">🔥 {{ book.views }} views</span>
                  </div>
                  <h4 style="font-size:14px; font-weight:800; color:#B45309; margin:0 0 4px 0">{{ book.title }}</h4>
                  <p style="font-size:10px; color:#D97706; margin-bottom:8px">Par {{ book.author }} · Niveau: {{ book.level }}</p>
                  <p style="font-size:11.5px; color:#78350F; line-height:1.4; margin:0 0 16px 0">{{ book.description }}</p>
                </div>

                <button class="btn-p" style="width:100%; height:36px; font-size:12px; font-weight:700; background:#D97706; border-color:#D97706; color:white" (click)="openReadingOverlay(book)">
                  Lire l'Ebook 📖
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Library Grid -->
      @if (filteredBooks().length === 0) {
        <div class="card" style="text-align:center; padding:48px 16px; color:var(--text-muted)">
          <i class="ti ti-book-off" style="font-size:40px; display:block; margin-bottom:12px; opacity:0.5"></i>
          <p style="font-size:13px; font-weight:600; color:var(--text-primary); margin-bottom:4px">Aucun livre disponible</p>
          <p style="font-size:11px; margin:0">Aucun ebook ne correspond à vos filtres actuels. Repassez plus tard !</p>
        </div>
      } @else {
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:16px; margin-top:16px">
          @for (book of filteredBooks(); track book.id) {
            <div class="card" style="margin:0; display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.2s" class="book-card">
              <div>
                <span style="font-size:44px; display:block; margin-bottom:10px">{{ book.coverEmoji }}</span>
                <h4 style="font-size:14px; font-weight:800; color:var(--text-primary); margin:0 0 4px 0">{{ book.title }}</h4>
                <p style="font-size:10px; color:var(--text-muted); margin-bottom:8px">Par {{ book.author }} · Niveau: {{ book.level }}</p>
                <p style="font-size:11.5px; color:var(--text-secondary); line-height:1.4; margin:0 0 16px 0">{{ book.description }}</p>
              </div>

              <button class="btn-p" style="width:100%; height:36px; font-size:12px; font-weight:700; background:#4F46E5; border-color:#4F46E5" (click)="openReadingOverlay(book)">
                Lire l'Ebook 📖
              </button>
            </div>
          }
        </div>
      }

      <!-- FULLSCREEN READING OVERLAY -->
      @if (activeBook(); as book) {
        <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:#FFF; z-index:9999; display:flex; flex-direction:column">
          <!-- Reading Top bar -->
          <div style="height:56px; border-bottom:1px solid var(--border-weak); padding:0 24px; display:flex; justify-content:space-between; align-items:center; background:#FAF9F6">
            <div style="display:flex; align-items:center; gap:10px">
              <span style="font-size:24px">{{ book.coverEmoji }}</span>
              <div>
                <h2 style="font-size:15px; font-weight:800; margin:0">{{ book.title }}</h2>
                <span style="font-size:10px; color:var(--text-muted)">Par {{ book.author }} · Niveau: {{ book.level }}</span>
              </div>
            </div>
            <button 
              (click)="closeReadingOverlay()" 
              style="background:#E11D48; color:white; border:none; border-radius:6px; padding:6px 16px; font-size:12px; font-weight:700; cursor:pointer">
              Fermer la lecture ✖
            </button>
          </div>

          <!-- Reading Content Panel -->
          <div style="flex:1; display:flex; overflow:hidden">
            <!-- Left bar summary (Desktop only) -->
            <div style="width:280px; border-right:1px solid var(--border-weak); background:#FAF9F6; padding:24px; display:flex; flex-direction:column; justify-content:space-between" class="reading-sidebar">
              <div>
                <h4 style="font-size:12px; text-transform:uppercase; color:var(--text-muted); font-weight:700; margin-bottom:8px">À propos de ce livre</h4>
                <p style="font-size:12px; color:var(--text-secondary); line-height:1.4; margin:0">{{ book.description }}</p>
              </div>
              <div style="font-size:10px; color:var(--text-muted)">
                Publié le {{ book.createdAt }}<br>
                Propulsé par SpeakUp Bibliothèque
              </div>
            </div>

            <!-- Scrollable Reader (Center) -->
            <div style="flex:1; background:#FFF8F0; overflow-y:auto; padding:48px 24px; display:flex; justify-content:center">
              <div style="width:100%; max-width:680px; font-family:'Georgia', serif; font-size:16px; line-height:1.8; color:#2D2D2D; white-space:pre-wrap">
                {{ book.content }}
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .book-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.05);
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

  // Filters
  searchQuery = '';
  filterLevel = 'All';

  constructor() {
    this.db.observeEbooks().subscribe(list => this.ebooks.set(list));
  }

  filteredBooks = computed(() => {
    let list = this.ebooks();

    // Filter by level
    if (this.filterLevel !== 'All') {
      list = list.filter(b => b.level === this.filterLevel);
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
    return [...this.ebooks()]
      .filter(b => (b.views || 0) > 0)
      .sort((a, b) => (b.views || 0) - (a.views || 0))
      .slice(0, 3);
  });

  openReadingOverlay(book: Ebook) {
    this.activeBook.set(book);
    this.db.incrementEbookViews(book.id);
  }

  closeReadingOverlay() {
    this.activeBook.set(null);
  }
}
