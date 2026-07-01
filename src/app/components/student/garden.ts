import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseService, UserProfile } from '../../services/database.service';
import { DialogService } from '../../services/dialog.service';

interface PlantNode {
  type: 'tree' | 'flower';
  left: number;
  top: number;
  scale: number;
  emoji: string;
}

@Component({
  selector: 'app-student-garden',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page" style="animation: fadeIn 0.28s ease">
      
      <!-- HEADER BANNER -->
      <div class="card" style="margin-top:0; background:linear-gradient(135deg, #ECFDF5 0%, #A7F3D0 100%); border:none; padding:20px; border-radius:12px; color:#065F46">
        <h2 style="font-size:18px; font-weight:800; margin:0 0 6px 0; display:flex; align-items:center; gap:8px">
          <span>🌱 Le Jardin SpeakUp</span>
        </h2>
        <p style="font-size:12.5px; color:#047857; margin:0 0 12px 0; line-height:1.4">
          Chaque leçon terminée fait grandir votre jardin ! Terminez 30 leçons pour faire de votre jardin une magnifique forêt luxuriante. Mais attention : si vous n'étudiez pas pendant 3 jours, vos fleurs flétriront...
        </p>
        <div style="display:flex; gap:10px; flex-wrap:wrap">
          <span style="font-size:11px; background:white; color:#047857; font-weight:700; padding:4px 10px; border-radius:20px; border:1px solid #6EE7B7">
            🌲 Arbres : {{ currentUser()?.garden?.trees || 0 }}
          </span>
          <span style="font-size:11px; background:white; color:#047857; font-weight:700; padding:4px 10px; border-radius:20px; border:1px solid #6EE7B7">
            🌸 Fleurs : {{ currentUser()?.garden?.flowers || 0 }}
          </span>
          <span style="font-size:11px; background:white; color:#EF4444; font-weight:700; padding:4px 10px; border-radius:20px; border:1px solid #FCA5A5" *ngIf="currentUser()?.garden?.wiltedPlants">
            🍂 Fanées : {{ currentUser()?.garden?.wiltedPlants || 0 }}
          </span>
        </div>
      </div>

      <!-- MAIN GARDEN CANVAS -->
      <div class="card" [style.background]="getBackgroundStyle()" style="margin-top:20px; padding:0; overflow:hidden; border:2px solid #6EE7B7; border-radius:16px; position:relative; height:450px; transition: background 0.8s ease">
        
        <!-- Sky & Clouds decoration -->
        <div class="cloud" style="top:30px; left:10%">☁️</div>
        <div class="cloud" style="top:50px; right:15%">☁️</div>
        <div class="sun" style="position:absolute; top:20px; right:5%; font-size:36px">☀️</div>

        <!-- Theme Selector HUD -->
        <div style="position:absolute; top:16px; left:16px; background:rgba(255,255,255,0.95); backdrop-filter:blur(4px); padding:6px 12px; border-radius:8px; border:1.5px solid #10B981; display:flex; align-items:center; gap:8px; z-index:100; box-shadow:0 4px 10px rgba(0,0,0,0.08)">
          <span style="font-size:10.5px; font-weight:800; color:#065F46">Ambiance :</span>
          <button (click)="setTheme('classic')" [style.background]="activeTheme() === 'classic' ? '#10B981' : 'transparent'" [style.color]="activeTheme() === 'classic' ? 'white' : '#065F46'" style="border:none; padding:4px 8px; border-radius:4px; font-size:10.5px; font-weight:800; cursor:pointer; transition:all 0.2s">Forêt 🌲</button>
          <button (click)="setTheme('rose')" [style.background]="activeTheme() === 'rose' ? '#F472B6' : 'transparent'" [style.color]="activeTheme() === 'rose' ? 'white' : '#065F46'" style="border:none; padding:4px 8px; border-radius:4px; font-size:10.5px; font-weight:800; cursor:pointer; transition:all 0.2s">Roses 🌹</button>
          <button (click)="setTheme('sakura')" [style.background]="activeTheme() === 'sakura' ? '#A78BFA' : 'transparent'" [style.color]="activeTheme() === 'sakura' ? 'white' : '#065F46'" style="border:none; padding:4px 8px; border-radius:4px; font-size:10.5px; font-weight:800; cursor:pointer; transition:all 0.2s">Sakura 🌸</button>
        </div>

        <!-- Falling Particles -->
        <div style="position:absolute; inset:0; pointer-events:none; overflow:hidden">
          @for (p of particles; track $index) {
            <span class="particle" 
                  [style.left.%]="p.left" 
                  [style.animation-delay]="p.delay + 's'" 
                  [style.animation-duration]="p.duration + 's'" 
                  [style.font-size.px]="p.size"
                  style="position:absolute; top:-20px; animation: fall linear infinite; opacity:0.85; display:inline-block">
              {{ getParticleSymbol() }}
            </span>
          }
        </div>

        <!-- Butterfly & Sparkles animation if flourishing -->
        @if (currentUser()?.garden?.healthStatus === 'flourishing') {
          <div style="position:absolute; top:120px; left:30%; font-size:24px; animation: float 6s infinite">🦋</div>
          <div style="position:absolute; top:180px; right:40%; font-size:24px; animation: float 8s infinite">🦋</div>
          <div class="sparkle" style="position:absolute; top:220px; left:20%">✨</div>
          <div class="sparkle" style="position:absolute; top:250px; right:20%">✨</div>
        }

        <!-- Interactive plants display -->
        <div style="position:absolute; inset:0">
          @for (plant of getPlantNodes(); track $index) {
            <div 
              [style.left.%]="plant.left" 
              [style.top.%]="plant.top"
              [style.transform]="'translate(-50%, -100%) scale(' + plant.scale + ')'"
              style="position:absolute; font-size:42px; user-select:none; transition:all 0.5s ease-out; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.15))"
              [title]="plant.type === 'tree' ? 'Arbre vigoureux' : 'Belle fleur'">
              {{ plant.emoji }}
            </div>
          }
        </div>

        <!-- Garden status HUD -->
        <div style="position:absolute; bottom:16px; left:16px; background:rgba(255,255,255,0.9); backdrop-filter:blur(4px); padding:8px 14px; border-radius:8px; border:1px solid #10B981; display:flex; align-items:center; gap:8px">
          <span style="font-size:11px; font-weight:800; text-transform:uppercase; color:#065F46">Etat du Jardin :</span>
          <span class="badge" 
                [style.background]="getHealthBg(currentUser()?.garden?.healthStatus)" 
                [style.color]="getHealthColor(currentUser()?.garden?.healthStatus)"
                style="font-size:10px; font-weight:800; border-radius:4px; padding:2px 6px">
            {{ currentUser()?.garden?.healthStatus || 'healthy' }}
          </span>
        </div>

        <!-- Simulation Tools inside card for testing -->
        <div style="position:absolute; bottom:16px; right:16px; display:flex; gap:8px">
          <button class="btn-s" style="background:white; border-color:#EF4444; color:#EF4444; font-size:10.5px; padding:4px 8px; height:auto" (click)="simulateDecay()">
            Simuler 3j d'inactivité 🍂
          </button>
          <button class="btn-p" style="background:#10B981; border-color:#10B981; font-size:10.5px; padding:4px 8px; height:auto" (click)="waterGarden()">
            Arroser / Soigner 💧
          </button>
        </div>

      </div>

      <!-- DESCRIPTION & HELP -->
      <div class="card" style="margin-top:20px; padding:18px">
        <h3 style="font-size:14px; font-weight:800; color:var(--text-primary); margin:0 0 8px 0">Comment faire prospérer votre jardin ?</h3>
        <ul style="margin:0; padding-left:20px; font-size:12.5px; color:var(--text-secondary); line-height:1.6">
          <li>Chaque fois que vous terminez une <strong>Leçon</strong>, un arbre 🌲 est planté dans votre jardin.</li>
          <li>Chaque fois que vous réussissez un <strong>Quiz ou Défi Speaking</strong>, une fleur 🌸 éclot.</li>
          <li>Étudier régulièrement maintient le jardin vert et sain.</li>
          <li>Si vous délaissez l'anglais trop longtemps, arrosez votre jardin en complétant une nouvelle leçon pour lui redonner vie !</li>
        </ul>
      </div>

    </div>
  `,
  styles: [`
    @keyframes float {
      0% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-15px) rotate(8deg); }
      100% { transform: translateY(0px) rotate(0deg); }
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.2); opacity: 1; }
    }
    @keyframes fall {
      0% { transform: translateY(-20px) translateX(0px) rotate(0deg); opacity: 0.85; }
      50% { transform: translateY(220px) translateX(25px) rotate(180deg); opacity: 0.85; }
      100% { transform: translateY(470px) translateX(-10px) rotate(360deg); opacity: 0; }
    }
    .cloud {
      position: absolute;
      font-size: 28px;
      opacity: 0.75;
      user-select: none;
      pointer-events: none;
    }
    .sparkle {
      font-size: 16px;
      animation: pulse 2s infinite ease-in-out;
      user-select: none;
      pointer-events: none;
    }
  `]
})
export class StudentGardenComponent {
  private db = inject(DatabaseService);
  private dialogService = inject(DialogService);

  currentUser = signal<UserProfile | null>(null);
  activeTheme = signal<'classic' | 'rose' | 'sakura'>('classic');

  particles = Array(12).fill(null).map(() => ({
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: 6 + Math.random() * 6,
    size: 14 + Math.random() * 14
  }));

  constructor() {
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
    
    const cached = localStorage.getItem('speak_garden_theme') as 'classic' | 'rose' | 'sakura';
    if (cached) {
      this.activeTheme.set(cached);
    }

    const user = this.currentUser();
    if (user && user.id) {
      this.db.checkAndWiltGarden(user.id);
    }
  }

  setTheme(theme: 'classic' | 'rose' | 'sakura') {
    this.activeTheme.set(theme);
    localStorage.setItem('speak_garden_theme', theme);
  }

  getBackgroundStyle(): string {
    const theme = this.activeTheme();
    if (theme === 'rose') {
      return 'linear-gradient(to bottom, #FCE7F3 0%, #FBCFE8 50%, #F472B6 50%, #E11D48 100%)';
    }
    if (theme === 'sakura') {
      return 'linear-gradient(to bottom, #F3E8FF 0%, #E9D5FF 50%, #D8B4FE 50%, #C084FC 100%)';
    }
    return 'linear-gradient(to bottom, #BAE6FD 0%, #E0F2FE 50%, #4ADE80 50%, #22C55E 100%)';
  }

  getParticleSymbol(): string {
    const theme = this.activeTheme();
    if (theme === 'rose') return '🌹';
    if (theme === 'sakura') return '🌸';
    return '🍃';
  }

  getPlantNodes(): PlantNode[] {
    const user = this.currentUser();
    if (!user || !user.garden) return [];
    
    const garden = user.garden;
    const nodes: PlantNode[] = [];
    const theme = this.activeTheme();
    
    const totalTrees = garden.trees || 0;
    const totalFlowers = garden.flowers || 0;
    const totalWilted = garden.wiltedPlants || 0;

    const getPos = (index: number, type: 'tree' | 'flower' | 'wilted') => {
      const seed = index * 12.34 + (type === 'tree' ? 5.6 : 8.9);
      const left = 5 + (Math.abs(Math.sin(seed)) * 90);
      const top = 65 + (Math.abs(Math.cos(seed)) * 30);
      const scale = 0.8 + (Math.abs(Math.sin(seed * 2)) * 0.4);
      return { left, top, scale };
    };

    // Render trees
    for (let i = 0; i < totalTrees; i++) {
      const pos = getPos(i, 'tree');
      let emoji = '🌲';
      if (theme === 'rose') emoji = '🌹';
      else if (theme === 'sakura') emoji = '🌸';

      nodes.push({
        type: 'tree',
        left: pos.left,
        top: pos.top,
        scale: pos.scale,
        emoji: emoji
      });
    }

    // Render flowers
    for (let i = 0; i < totalFlowers; i++) {
      const pos = getPos(i, 'flower');
      let emoji = this.getFlowerEmoji(i);
      if (theme === 'rose') emoji = '🌹';
      else if (theme === 'sakura') emoji = '💮';

      nodes.push({
        type: 'flower',
        left: pos.left,
        top: pos.top,
        scale: pos.scale,
        emoji: emoji
      });
    }

    // Render wilted plants
    for (let i = 0; i < totalWilted; i++) {
      const pos = getPos(i + totalFlowers, 'wilted');
      let emoji = '🍂';
      if (theme === 'rose') emoji = '🥀';

      nodes.push({
        type: 'flower',
        left: pos.left,
        top: pos.top,
        scale: pos.scale,
        emoji: emoji
      });
    }

    // Sort by top coordinate to render background plants behind foreground plants
    return nodes.sort((a, b) => a.top - b.top);
  }

  getFlowerEmoji(index: number): string {
    const emojis = ['🌸', '🌺', '🌹', '🌷', '🌻', '🌼'];
    return emojis[index % emojis.length];
  }

  getHealthBg(status?: string): string {
    switch (status) {
      case 'flourishing': return '#D1FAE5';
      case 'wilted': return '#FEF3C7';
      default: return '#E0F2FE';
    }
  }

  getHealthColor(status?: string): string {
    switch (status) {
      case 'flourishing': return '#065F46';
      case 'wilted': return '#B45309';
      default: return '#0369A1';
    }
  }

  simulateDecay() {
    const user = this.currentUser();
    if (user && user.garden) {
      const backDate = new Date();
      backDate.setDate(backDate.getDate() - 4); // 4 days ago
      
      const usersList = [...this.db['users$'].value];
      const idx = usersList.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        usersList[idx].garden!.lastLessonDate = backDate.toISOString();
        this.db['users$'].next(usersList);
        this.db['saveLocal']('speak_users', usersList);
        
        this.db.checkAndWiltGarden(user.id).then(() => {
          this.dialogService.alert('Inactivité Simulée 🍂', 'Le temps a passé. Certaines de vos fleurs ont flétri par manque de pratique ! Complétez une leçon ou arrosez pour soigner votre jardin.', 'info');
        });
      }
    }
  }

  waterGarden() {
    const user = this.currentUser();
    if (user) {
      this.db.growPlantInGarden(user.id, 'flower').then(() => {
        this.dialogService.alert('Jardin Arrosé 💧', 'Vous avez arrosé votre jardin et fait refleurir vos plantes ! Continuez à étudier pour faire pousser des arbres.', 'success');
      });
    }
  }
}
