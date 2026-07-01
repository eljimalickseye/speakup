import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, UserProfile, MarketplaceItem } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

@Component({
  selector: 'app-student-marketplace',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" style="animation: fadeIn 0.28s ease">
      
      <!-- WALLET HERO HEADER -->
      <div class="card" style="margin-top:0; background:linear-gradient(135deg, #1E1B4B 0%, #311042 100%); color:white; border:none; padding:20px 24px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; gap:20px; flex-wrap:wrap; box-shadow:0 10px 25px rgba(49,16,66,0.15)">
        <div>
          <span style="font-size:10px; background:#F59E0B; color:#1E1B4B; font-weight:800; padding:2px 8px; border-radius:20px; text-transform:uppercase">SpeakUp Boutique</span>
          <h2 style="font-size:18px; font-weight:800; margin:4px 0 0 0; color:#FFF">Customisez Votre Personnage</h2>
          <p style="font-size:12.5px; color:#C7D2FE; margin:2px 0 0 0">Utilisez vos pièces gagnées en étudiant pour débloquer des items cosmétiques exclusifs !</p>
        </div>
        <div style="background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.15); padding:10px 18px; border-radius:12px; text-align:right">
          <div style="font-size:10px; color:#C7D2FE; text-transform:uppercase; font-weight:700">Mon Solde</div>
          <div style="font-size:22px; font-weight:800; color:#F59E0B; display:flex; align-items:center; gap:6px">
            <span>🪙</span>
            <span>{{ currentUser()?.coins || 0 }} Coins</span>
          </div>
        </div>
      </div>

      <!-- FILTER TABS -->
      <div style="display:flex; gap:8px; margin-top:20px; border-bottom:1px solid var(--border-weak); padding-bottom:12px">
        @for (tab of ['avatar', 'frame', 'theme']; track tab) {
          <button 
            (click)="activeTab.set(tab)"
            [style.background]="activeTab() === tab ? '#4F46E5' : 'var(--surface-2)'"
            [style.color]="activeTab() === tab ? 'white' : 'var(--text-primary)'"
            [style.border-color]="activeTab() === tab ? '#4F46E5' : 'var(--border)'"
            style="border:1px solid; padding:8px 16px; border-radius:20px; font-size:12.5px; font-weight:700; cursor:pointer; text-transform:capitalize; transition:all 0.15s">
            {{ tab }}s
          </button>
        }
      </div>

      <!-- ITEMS GRID -->
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap:16px; margin-top:20px">
        @for (item of filteredItems(); track item.id) {
          <div class="card" style="margin:0; border: 1.5px solid var(--border-weak); display:flex; flex-direction:column; justify-content:space-between; transition:transform 0.2s">
            
            <!-- Item Preview -->
            <div style="padding:16px; text-align:center; background:var(--surface-2); border-radius:8px; margin-bottom:12px; display:flex; align-items:center; justify-content:center; height:100px; position:relative">
              
              <!-- Preview Render based on item type -->
              @if (item.type === 'avatar') {
                <div style="font-size:48px">{{ item.iconOrPreview }}</div>
              } @else if (item.type === 'frame') {
                <div style="position:relative; width:64px; height:64px; display:flex; align-items:center; justify-content:center">
                  <div [style]="item.iconOrPreview" style="position:absolute; inset:-3px; border-radius:50%"></div>
                  <div style="width:100%; height:100%; border-radius:50%; background:#CBD5E1; color:#475569; font-size:24px; font-weight:700; display:flex; align-items:center; justify-content:center">
                    👦
                  </div>
                </div>
              } @else if (item.type === 'theme') {
                <div [style.background]="item.iconOrPreview" style="width:70px; height:45px; border-radius:6px; border:2px solid var(--border); box-shadow:0 2px 4px rgba(0,0,0,0.1)"></div>
              }

              <!-- Owned label -->
              @if (isOwned(item.id)) {
                <span class="badge" style="background:#10B981; color:white; font-size:8px; font-weight:700; position:absolute; top:8px; right:8px">POSSÉDÉ</span>
              }
            </div>

            <!-- Item Details -->
            <div>
              <h4 style="font-size:13.5px; font-weight:700; color:var(--text-primary); margin:0 0 4px 0">{{ item.name }}</h4>
              <div style="font-size:11px; color:var(--text-secondary); text-transform:uppercase; font-weight:600; margin-bottom:12px">{{ item.type }}</div>
            </div>

            <!-- Action buttons -->
            <div>
              @if (!isOwned(item.id)) {
                <button 
                  class="btn-p" 
                  [disabled]="(currentUser()?.coins || 0) < item.cost"
                  style="width:100%; height:36px; font-size:12.5px; display:flex; align-items:center; justify-content:center; gap:6px; background:#F59E0B; border-color:#F59E0B; color:#1E1B4B"
                  (click)="purchase(item.id)">
                  <span>Acheter (🪙 {{ item.cost }})</span>
                </button>
              } @else {
                <button 
                  class="btn-s" 
                  [disabled]="isActive(item)"
                  [style.border-color]="isActive(item) ? '#10B981' : 'var(--border)'"
                  [style.color]="isActive(item) ? '#10B981' : 'var(--text-primary)'"
                  style="width:100%; height:36px; font-size:12.5px"
                  (click)="equip(item.id)">
                  {{ isActive(item) ? '✓ Activé' : 'Équiper' }}
                </button>
              }
            </div>

          </div>
        }
      </div>

    </div>
  `,
  styles: []
})
export class StudentMarketplaceComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  currentUser = signal<UserProfile | null>(null);
  marketItems = signal<MarketplaceItem[]>([]);
  activeTab = signal<string>('avatar');

  filteredItems = computed(() => {
    return this.marketItems().filter(i => i.type === this.activeTab());
  });

  constructor() {
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
    this.db.observeMarketplaceItems().subscribe(list => this.marketItems.set(list));
  }

  isOwned(itemId: string): boolean {
    const user = this.currentUser();
    if (!user) return false;

    // Check unlocked list by category
    const item = this.marketItems().find(i => i.id === itemId);
    if (!item) return false;

    if (item.type === 'avatar') return user.unlockedAvatars?.includes(itemId) || false;
    if (item.type === 'frame') return user.unlockedFrames?.includes(itemId) || false;
    if (item.type === 'theme') return user.unlockedThemes?.includes(itemId) || false;

    return false;
  }

  isActive(item: MarketplaceItem): boolean {
    const user = this.currentUser();
    if (!user) return false;

    if (item.type === 'avatar') return user.activeAvatar === item.iconOrPreview;
    if (item.type === 'frame') return user.activeFrame === item.iconOrPreview;
    if (item.type === 'theme') return user.activeTheme === item.iconOrPreview;

    return false;
  }

  purchase(itemId: string) {
    const user = this.currentUser();
    if (user) {
      this.db.purchaseMarketplaceItem(itemId, user.id).then(success => {
        if (success) {
          this.dialogService.alert('Achat Réussi ! 🎁', 'L\'item cosmétique a été débloqué. Équipez-le dès maintenant sur votre profil !', 'success');
        } else {
          this.dialogService.alert('Solde Insuffisant 🪙', 'Vous n\'avez pas assez de coins SpeakUp. Continuez à étudier pour en gagner !', 'info');
        }
      });
    }
  }

  equip(itemId: string) {
    const user = this.currentUser();
    if (user) {
      this.db.useMarketplaceItem(itemId, user.id).then(() => {
        this.dialogService.alert('Style Appliqué ! ✨', 'Votre profil a été mis à jour avec votre nouveau style.', 'success');
      });
    }
  }
}
