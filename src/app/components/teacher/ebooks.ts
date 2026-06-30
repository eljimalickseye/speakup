import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Ebook, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-teacher-ebooks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page" style="animation: fadeIn 0.25s">
      <!-- Header stats -->
      <div class="grid3">
        <div class="mcard" style="background: linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%); border: 1px solid #DDD6FE">
          <div class="mlabel" style="color:#6D28D9">Ebooks publiés</div>
          <div class="mval" style="color:#7C3AED">{{ ebooksCount() }}</div>
          <div class="msub" style="color:#6D28D9">Livres dans la bibliothèque</div>
        </div>
      </div>

      <!-- Add New Ebook Form -->
      <div class="card" style="margin-top:20px; border:1px dashed #7C3AED; background:#FAF5FF">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px">
          <h3 class="st" style="font-size:15px; margin:0; color:#7C3AED; display:flex; align-items:center; gap:6px">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <span>Créer un nouvel Ebook</span>
          </h3>
          
          <div style="display:flex; gap:8px">
          </div>
        </div>

        <!-- Manual form / AI Draft details editor -->
        @if (editorMode() === 'manual' || showDraftForm()) {
          <div style="display:flex; flex-direction:column; gap:12px; margin-top:10px; padding-top:10px; border-top:1px solid var(--border-weak)">
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap:12px">
              <div class="input-row" style="margin-bottom:0">
                <label style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px; display:block">Titre du livre</label>
                <input [(ngModel)]="newTitle" placeholder="Ex: L'Anglais Professionnel" class="form-input" style="height:36px; font-size:13px" />
              </div>
              <div class="input-row" style="margin-bottom:0">
                <label style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px; display:block">Niveau cible</label>
                <select [(ngModel)]="newLevel" class="form-select" style="height:36px; font-size:13px">
                  <option value="All">Tous Niveaux (All)</option>
                  <option value="Beginner">Débutant (A1-A2)</option>
                  <option value="Intermediate">Intermédiaire (B1)</option>
                  <option value="Advanced">Avancé (B2)</option>
                </select>
              </div>
              <div class="input-row" style="margin-bottom:0">
                <label style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px; display:block">Icône couverture</label>
                <select [(ngModel)]="newCoverEmoji" class="form-select" style="height:36px; font-size:13px">
                  <option value="📘">📘 Livre Bleu</option>
                  <option value="📙">📙 Livre Orange</option>
                  <option value="📗">📗 Livre Vert</option>
                  <option value="📕">📕 Livre Rouge</option>
                  <option value="📓">📓 Carnet Noir</option>
                  <option value="📔">📔 Carnet Jaune</option>
                </select>
              </div>
            </div>

            <div class="input-row" style="margin-bottom:0">
              <label style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px; display:block">Description courte</label>
              <input [(ngModel)]="newDescription" placeholder="Ex: Apprenez à rédiger des e-mails professionnels et à conduire des négociations..." class="form-input" style="height:36px; font-size:13px" />
            </div>

            <div class="input-row" style="margin-bottom:0">
              <label style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:4px; display:block">Contenu du livre (Markdown / Paragraphes)</label>
              <textarea [(ngModel)]="newContent" placeholder="Écrivez le contenu ici..." rows="12" class="form-input" style="font-size:13px; font-family:monospace; padding:10px"></textarea>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px">
              @if (showDraftForm()) {
                <button class="btn-s" (click)="clearForm()" style="height:36px; padding:0 16px; font-weight:600">Annuler le brouillon</button>
              }
              <button 
                class="btn-p" 
                [disabled]="!newTitle || !newContent || !newDescription" 
                (click)="publishEbook()" 
                style="height:36px; padding:0 24px; font-weight:700; background:#10B981; border-color:#10B981">
                🚀 Publier dans la Bibliothèque
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Published Ebooks List -->
      <div class="card" style="margin-top:20px">
        <h3 class="st" style="font-size:15px; margin-bottom:14px; color:#4F46E5">Ebooks Actuellement Publiés</h3>

        @if (ebooks().length === 0) {
          <div style="text-align:center; padding:40px 16px; color:var(--text-muted)">
            <p style="font-size:13px; font-weight:600">Aucun livre n'a encore été publié.</p>
            <p style="font-size:11px">Utilisez le rédacteur IA ou le formulaire ci-dessus pour publier votre premier ebook !</p>
          </div>
        } @else {
          <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap:12px">
            @for (book of ebooks(); track book.id) {
              <div style="background:var(--surface-2); border:1px solid var(--border-weak); border-radius:10px; padding:14px; display:flex; flex-direction:column; justify-content:space-between">
                <div>
                  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px">
                    <span style="font-size:32px">{{ book.coverEmoji }}</span>
                    <button class="btn-s" style="border-color:#EF4444; color:#EF4444; font-size:10px; padding:2px 8px" (click)="deleteEbook(book)">
                      Supprimer
                    </button>
                  </div>
                  <h4 style="font-size:14px; font-weight:800; color:var(--text-primary); margin:0 0 4px 0">{{ book.title }}</h4>
                  <div style="display:flex; gap:6px; margin-bottom:8px">
                    <span style="font-size:9px; font-weight:700; background:#E0E7FF; color:#4F46E5; padding:1px 6px; border-radius:4px">Niveau: {{ book.level }}</span>
                    <span style="font-size:9px; font-weight:700; background:#F3E8FF; color:#7C3AED; padding:1px 6px; border-radius:4px">Publié le {{ book.createdAt }}</span>
                  </div>
                  <p style="font-size:11px; color:var(--text-secondary); line-height:1.4; margin:0">{{ book.description }}</p>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class TeacherEbooksComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  ebooks = signal<Ebook[]>([]);
  ebooksCount = computed(() => this.ebooks().length);

  // States
  editorMode = signal<'manual'>('manual');
  showDraftForm = signal<boolean>(false);
  isGenerating = signal<boolean>(false);

  // Form
  newTitle = '';
  newLevel = 'All';
  newCoverEmoji = '📘';
  newDescription = '';
  newContent = '';

  currentUser = signal<UserProfile | null>(null);

  constructor() {
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
    this.db.observeEbooks().subscribe(list => this.ebooks.set(list));
  }


  publishEbook() {
    if (!this.newTitle || !this.newDescription || !this.newContent) {
      this.dialogService.alert('Champs requis', 'Veuillez remplir le titre, la description et le contenu du livre.', 'info');
      return;
    }

    const currentTeacher = this.currentUser()?.name || 'Professeur';

    const newBook = {
      title: this.newTitle.trim(),
      author: currentTeacher,
      level: this.newLevel,
      description: this.newDescription.trim(),
      coverEmoji: this.newCoverEmoji,
      content: this.newContent.trim()
    };

    this.db.addEbook(newBook).then(() => {
      this.dialogService.alert('Publié !', `L'ebook "${this.newTitle}" a été ajouté avec succès dans la bibliothèque.`, 'success');
      this.clearForm();
    });
  }

  deleteEbook(book: Ebook) {
    this.dialogService.show({
      title: 'Supprimer Ebook',
      message: `Voulez-vous vraiment supprimer définitivement "${book.title}" de la bibliothèque ?`,
      type: 'confirm',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      onConfirm: () => {
        this.db.deleteEbook(book.id).then(() => {
          this.dialogService.alert('Supprimé', 'Le livre a été retiré avec succès.', 'success');
        });
      }
    });
  }

  clearForm() {
    this.newTitle = '';
    this.newLevel = 'All';
    this.newCoverEmoji = '📘';
    this.newDescription = '';
    this.newContent = '';
    this.showDraftForm.set(false);
    this.editorMode.set('manual');
  }
}
