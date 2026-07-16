import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, LiveIceBreaker, UserProfile } from '../../services/database.service';

@Component({
  selector: 'app-student-icebreaker',
  standalone: true,
  imports: [CommonModule, FormsModule],
      template: `
    <div class="page" style="padding:20px; box-sizing:border-box">
      
      <div style="display:flex; gap:24px; align-items:flex-start; flex-wrap:wrap">
        
        <!-- LEFT COLUMN (Main Content) -->
        <div style="flex:1; min-width:320px; display:flex; flex-direction:column; gap:20px">
          
          <!-- HEADER BANNER -->
          <div [style.background]="isManga() ? 'url(luffy_banner.png) center/cover' : (isRose() ? 'url(rose_banner.png) center/cover' : 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)')"
               [style.borderBottom]="isManga() ? '4px solid #E11D48' : (isRose() ? '4px solid #DB2777' : '4px solid #10B981')"
               [style.minHeight]="(isManga() || isRose()) ? '150px' : 'auto'"
               style="padding:24px; border-radius:12px; box-shadow:0 4px 20px rgba(0,0,0,0.05); display:flex; flex-direction:column; justify-content:center; position:relative; overflow:hidden">
            @if (isManga() || isRose()) {
              <div style="position:absolute; inset:0; background:rgba(0,0,0,0.2)"></div>
              @if (isManga()) {
                <span style="position:absolute; right:24px; top:50%; transform:translateY(-50%) rotate(8deg); font-family:'Impact', sans-serif; font-size:38px; font-weight:900; color:white; text-shadow:3px 3px 0 #E11D48, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000; letter-spacing:1px; z-index:2">FIGHT!</span>
              }
            }
            <div style="position:relative; z-index:1; display:flex; flex-direction:column; gap:4px">
              <h2 [style.fontFamily]="isManga() ? 'Impact, sans-serif' : 'inherit'"
                  [style.fontSize]="(isManga() || isRose()) ? '26px' : '20px'"
                  [style.letterSpacing]="isManga() ? '1px' : 'normal'"
                  [style.color]="isRose() ? '#BE185D' : 'white'"
                  style="font-weight:900; margin:0; display:flex; align-items:center; gap:8px">
                @if (!isManga() && !isRose()) {
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4m10 0h-4M12 8v8"/></svg>
                }
                ICE BREAKER & GAME CENTER
              </h2>
              <p [style.color]="isManga() ? '#FCA5A5' : (isRose() ? '#BE185D' : '#94A3B8')" style="font-size:12.5px; margin:0; font-weight:700">
                Participez aux jeux, défis oraux et quiz en direct lancés par votre professeur !
              </p>
              @if (isRose()) {
                <button class="btn-p" style="background:#DB2777; border-color:#DB2777; font-weight:850; font-size:11px; align-self:flex-start; margin-top:10px; padding:6px 16px; border-radius:20px; display:flex; align-items:center; gap:6px; color:white">
                  🎙️ {{ t('Je participe !', 'Join Game !') }}
                </button>
              }
            </div>
          </div>

          <!-- MAIN STATE VIEW -->
          @if (activeGame(); as game) {
            <div style="width:100%; animation: scaleUp 0.3s ease-out">
              <!-- TYPE 1: WHEEL OF NAMES -->
              @if (game.type === 'wheel') {
                <div class="card" style="padding:32px; text-align:center; border-top:4px solid #4F46E5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 16px auto"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20M12 12l7.07-7.07M12 12l-7.07 7.07M12 12l-7.07-7.07M12 12l7.07 7.07"/></svg>
                  <h3 style="font-size:18px; font-weight:800; color:var(--text-primary); margin:0 0 8px 0">Roue des Noms & Défis</h3>
                  <p style="font-size:12.5px; color:var(--text-secondary); margin:0 0 24px 0">Le professeur tourne la roue en direct lors du meet.</p>
                  
                  @if (game.wheelState?.selectedStudent) {
                    <div style="background:#FAF5FF; border:1px solid #E9D5FF; border-radius:12px; padding:20px; margin-top:16px">
                      <div style="font-size:11px; font-weight:800; color:#6B21A8; text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; justify-content:center; gap:4px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        Élève Désigné
                      </div>
                      <div style="font-size:22px; font-weight:900; color:#A855F7; margin:6px 0 12px 0">{{ game.wheelState?.selectedStudent }}</div>
                      
                      @if (game.wheelState?.challenge) {
                        <div style="border-top:1px dashed #D8B4FE; padding-top:12px">
                          <div style="font-size:11px; font-weight:800; color:#B45309; text-transform:uppercase; display:flex; align-items:center; justify-content:center; gap:4px">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                            Défi Speaking
                          </div>
                          <div style="font-size:15px; font-weight:700; color:#D97706; margin-top:4px">" {{ game.wheelState?.challenge }} "</div>
                        </div>
                      }
                    </div>
                  } @else {
                    <div style="background:var(--surface-2); border-radius:12px; padding:24px; color:var(--text-muted); font-style:italic; font-size:13px">
                      Attente du tirage par le professeur...
                    </div>
                  }
                </div>
              }

              <!-- TYPE 2: LIVE TRIVIA / BUZZ -->
              @if (game.type === 'buzz') {
                <div class="card" style="padding:32px; border-top:4px solid #F59E0B">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
                    <span style="font-size:12px; font-weight:800; background:#FEF3C7; color:#B45309; padding:4px 10px; border-radius:20px; display:inline-flex; align-items:center; gap:4px">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                      Live Quiz / Buzz
                    </span>
                    <span style="font-size:11px; color:var(--text-secondary)">Lancé il y a quelques instants</span>
                  </div>
                  
                  <div style="background:var(--surface-1); border:1px solid var(--border-weak); border-radius:12px; padding:20px; margin-bottom:24px">
                    <div style="font-size:11px; font-weight:800; color:var(--text-secondary); text-transform:uppercase">Question du Professeur</div>
                    <div style="font-size:18px; font-weight:900; color:var(--text-primary); margin-top:6px; line-height:1.4">
                      {{ game.buzzState?.question }}
                    </div>
                  </div>

                  @let myBuzz = getMyBuzzAnswer(game);
                  @if (myBuzz) {
                    <div style="border-radius:12px; padding:20px; border:1px solid"
                         [style.background]="myBuzz.correct === true ? '#ECFDF5' : myBuzz.correct === false ? '#FEF2F2' : 'var(--surface-2)'"
                         [style.borderColor]="myBuzz.correct === true ? '#A7F3D0' : myBuzz.correct === false ? '#FCA5A5' : 'var(--border)'">
                      <div style="font-size:11px; font-weight:800; text-transform:uppercase"
                           [style.color]="myBuzz.correct === true ? '#065F46' : myBuzz.correct === false ? '#991B1B' : 'var(--text-secondary)'">
                        {{ myBuzz.correct === true ? '✅ Validé (Correct !)' : myBuzz.correct === false ? '❌ Refusé (Incorrect)' : '⏳ Réponse Envoyée' }}
                      </div>
                      
                      <div style="font-size:15px; font-weight:700; margin-top:6px; color:var(--text-primary)">
                        Votre réponse : "{{ myBuzz.answer }}"
                      </div>
                      
                      @if (myBuzz.correct === true) {
                        <div style="font-size:12px; font-weight:800; color:#10B981; margin-top:8px">🏆 Félicitations ! +10 XP crédités !</div>
                      } @else if (myBuzz.correct === false) {
                        <div style="font-size:11px; color:#EF4444; margin-top:4px">Réessayez ou écoutez la correction du professeur !</div>
                      } @else {
                        <div style="font-size:11px; color:var(--text-muted); margin-top:4px">En attente de validation par le professeur en direct...</div>
                      }
                    </div>
                  } @else {
                    <div>
                      <label style="font-size:12px; font-weight:700; color:var(--text-secondary); display:block; margin-bottom:6px">Votre Réponse :</label>
                      <input type="text" [(ngModel)]="myAnswer" placeholder="Écrivez votre réponse ici..." style="width:100%; padding:10px 14px; border:1.5px solid var(--border); border-radius:8px; font-size:14px; background:var(--surface-1); color:var(--text-primary); margin-bottom:16px" (keyup.enter)="submitBuzz()"/>
                      <button (click)="submitBuzz()" class="btn-p" style="background:#F59E0B; border-color:#F59E0B; width:100%; height:40px; font-weight:800; display:flex; align-items:center; justify-content:center; gap:6px">
                        ➔ Envoyer ma Réponse
                      </button>
                    </div>
                  }
                </div>
              }

              <!-- TYPE 3: SPEAKING MISSION -->
              @if (game.type === 'mission') {
                <div class="card" style="padding:32px; border-top:4px solid #10B981">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px">
                    <span style="font-size:12px; font-weight:800; background:#D1FAE5; color:#065F46; padding:4px 10px; border-radius:20px; display:inline-flex; align-items:center; gap:4px">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                      Mission Spoken / Vocal
                    </span>
                    <span style="font-size:11px; color:var(--text-secondary)">Activité Oral en Direct</span>
                  </div>

                  <div style="background:var(--surface-1); border:1px solid var(--border-weak); border-radius:12px; padding:20px; margin-bottom:24px">
                    <div style="font-size:15px; font-weight:900; color:var(--text-primary); display:flex; align-items:center; gap:6px">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                      {{ game.missionState?.title }}
                    </div>
                    <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0 0; line-height:1.5">
                      {{ game.missionState?.description }}
                    </p>
                  </div>

                  @let mySub = getMyMissionSubmission(game);
                  @if (mySub) {
                    <div style="border-radius:12px; padding:20px; border:1px solid"
                         [style.background]="mySub.correct === true ? '#ECFDF5' : mySub.correct === false ? '#FEF2F2' : 'var(--surface-2)'"
                         [style.borderColor]="mySub.correct === true ? '#A7F3D0' : mySub.correct === false ? '#FCA5A5' : 'var(--border)'">
                      
                      <div style="font-size:11px; font-weight:800; text-transform:uppercase"
                           [style.color]="mySub.correct === true ? '#065F46' : mySub.correct === false ? '#991B1B' : 'var(--text-secondary)'">
                        {{ mySub.correct === true ? '✅ Mission validée !' : mySub.correct === false ? '❌ Refusée' : '⏳ Mission Envoyée' }}
                      </div>

                      <div style="margin-top:12px">
                        <audio [src]="mySub.audioUrl" controls style="width:100%"></audio>
                      </div>

                      @if (mySub.correct === true) {
                        <div style="font-size:12px; font-weight:800; color:#10B981; margin-top:8px">🏆 Superbe ! +15 XP crédités !</div>
                      } @else if (mySub.correct === false) {
                        <div style="font-size:11px; color:#EF4444; margin-top:4px">Veuillez réenregistrer et renvoyer la mission.</div>
                      } @else {
                        <div style="font-size:11px; color:var(--text-muted); margin-top:4px">Le professeur écoute votre audio en direct...</div>
                      }
                    </div>
                  } @else {
                    <div style="display:flex; flex-direction:column; align-items:center; gap:16px">
                      <div style="font-size:13px; font-weight:700; color:var(--text-secondary)">Enregistrez votre réponse orale :</div>
                      
                      @if (!isRecording && !recordedAudioUrl) {
                        <button (click)="startRecording()" class="btn-p" style="width:64px; height:64px; border-radius:50%; background:#EF4444; border:none; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 20px rgba(239,68,68,0.3); cursor:pointer">
                          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                        </button>
                        <span style="font-size:11px; color:var(--text-muted)">Cliquez pour démarrer l'enregistrement</span>
                      } @else if (isRecording) {
                        <button (click)="stopRecording()" class="btn-p animate-pulse" style="width:64px; height:64px; border-radius:50%; background:#10B981; border:none; display:flex; align-items:center; justify-content:center; box-shadow:0 6px 20px rgba(16,185,129,0.3); cursor:pointer">
                          <span style="width:18px; height:18px; background:white; border-radius:4px"></span>
                        </button>
                        <span style="font-size:11px; color:#EF4444; font-weight:700">🔴 Enregistrement en cours...</span>
                      } @else if (recordedAudioUrl) {
                        <audio [src]="recordedAudioUrl" controls style="width:100%; max-width:320px"></audio>
                        <div style="display:flex; gap:12px; width:100%; max-width:320px; margin-top:8px">
                          <button (click)="resetRecording()" class="btn-s" style="flex:1; height:36px; font-weight:700; display:flex; align-items:center; justify-content:center; gap:4px">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            Recommencer
                          </button>
                          <button (click)="submitMission()" class="btn-p" style="flex:1.5; height:36px; font-weight:700; background:#10B981; border-color:#10B981; display:flex; align-items:center; justify-content:center; gap:4px">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                            Soumettre la Mission
                          </button>
                        </div>
                      }
                    </div>
                  }
                </div>
              }

            </div>
          } @else {
            
            <!-- EMPTY STATE CARD -->
            <div class="card" 
                 [style.background]="isManga() ? 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(244,244,245,0.7) 100%)' : (isRose() ? 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,240,243,0.7) 100%)' : 'var(--surface-1)')"
                 [style.backgroundImage]="isManga() ? 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(244,244,245,0.6) 100%), url(manga_header_bg.png)' : (isRose() ? 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,240,243,0.6) 100%), url(rose_header_bg.png)' : 'none')"
                 [style.border]="(isManga() || isRose()) ? '2px solid #000' : '0.5px solid var(--border)'"
                 style="padding:48px 32px; text-align:center; position:relative; min-height:360px; display:flex; flex-direction:column; align-items:center; justify-content:center; overflow:hidden">
              
              <div style="position:relative; z-index:1; max-width:400px; display:flex; flex-direction:column; align-items:center">
                <div [style.background]="isRose() ? '#FFF0F3' : 'var(--surface-1)'" style="border:2px solid #000; border-radius:50%; width:64px; height:64px; display:flex; align-items:center; justify-content:center; margin-bottom:20px; box-shadow:4px 4px 0 black">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" [attr.stroke]="isRose() ? '#DB2777' : '#E11D48'" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <h3 style="font-size:18px; font-weight:900; color:black; margin:0 0 10px 0; text-transform:uppercase; letter-spacing:0.5px">Aucun défi ou jeu actif</h3>
                <p style="font-size:12.5px; color:#3F3F46; margin:0; line-height:1.6; font-weight:700">
                  Le professeur n'a pas encore lancé d'activité en direct pour cette session. Attendez son signal ou le lien du cours pour vous connecter !
                </p>
              </div>

              <!-- Character speaking at bottom left (Uraraka in Rose theme, Natsu in Manga theme) -->
              @if (isManga()) {
                <div style="position:absolute; right:20px; bottom:10px; display:flex; align-items:flex-end; gap:6px; z-index:2">
                  <!-- speech bubble -->
                  <div style="background:white; border:2px solid black; border-radius:20px; padding:6px 12px; font-size:10.5px; font-weight:800; color:black; position:relative; max-width:180px; box-shadow:3px 3px 0 rgba(0,0,0,0.15); margin-bottom:24px">
                    <span>Patience, jeune ninja ! Le défi arrive bientôt ! 🔥</span>
                    <div style="position:absolute; right:15px; bottom:-8px; width:12px; height:12px; background:white; border-right:2px solid black; border-bottom:2px solid black; transform:rotate(45deg)"></div>
                  </div>
                  <img src="natsu_chibi.png" style="height:90px; object-fit:contain" alt="Natsu">
                </div>
              } @else if (isRose()) {
                <div style="position:absolute; left:20px; bottom:10px; display:flex; align-items:flex-end; gap:6px; z-index:2">
                  <img src="uraraka_chibi.png" style="height:90px; object-fit:contain" alt="Uraraka">
                  <!-- speech bubble -->
                  <div style="background:white; border:2px solid black; border-radius:20px; padding:6px 12px; font-size:10.5px; font-weight:800; color:black; position:relative; max-width:180px; box-shadow:3px 3px 0 rgba(0,0,0,0.15); margin-bottom:24px; display:flex; align-items:center; gap:4px">
                    <span>Patience, l'effort mène au succès ! 💖</span>
                    <div style="position:absolute; left:15px; bottom:-8px; width:12px; height:12px; background:white; border-left:2px solid black; border-bottom:2px solid black; transform:rotate(45deg)"></div>
                  </div>
                </div>
              }
            </div>

            <!-- Bottom statistics panel row (Shown specifically in Rose & Manga empty states) -->
            @if (isRose() || isManga()) {
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(110px, 1fr)); gap:12px; margin-top:8px">
                <div class="card" style="padding:10px; display:flex; flex-direction:column; gap:4px; text-align:center">
                  <span style="font-size:9.5px; font-weight:800; text-transform:uppercase; color:#FB7185">📅 Prochain Ice Breaker</span>
                  <span style="font-size:11.5px; font-weight:900; color:black">Vendredi 17 Mai, 16h00</span>
                  <span style="font-size:9px; color:var(--text-muted)">Avec Mr. Tomy</span>
                </div>
                <div class="card" style="padding:10px; display:flex; flex-direction:column; gap:4px; text-align:center">
                  <span style="font-size:9.5px; font-weight:800; text-transform:uppercase; color:#FB7185">📊 Mes statistiques</span>
                  <span style="font-size:18px; font-weight:900; color:black">5</span>
                  <span style="font-size:9px; color:var(--text-muted)">Participations</span>
                </div>
                <div class="card" style="padding:10px; display:flex; flex-direction:column; gap:4px; text-align:center">
                  <span style="font-size:9.5px; font-weight:800; text-transform:uppercase; color:#FB7185">⭐ XP gagnés</span>
                  <span style="font-size:18px; font-weight:900; color:black">320</span>
                  <span style="font-size:9px; color:var(--text-muted)">Points</span>
                </div>
                <div class="card" style="padding:10px; display:flex; flex-direction:column; gap:4px; text-align:center">
                  <span style="font-size:9.5px; font-weight:800; text-transform:uppercase; color:#FB7185">👑 Rang</span>
                  <span style="font-size:18px; font-weight:900; color:black">#24</span>
                  <span style="font-size:9px; color:var(--text-muted)">Dans la classe</span>
                </div>
                <button class="btn-p" style="height:100%; border-radius:12px; font-weight:850; font-size:11px; background:#DB2777; border-color:#DB2777; display:flex; align-items:center; justify-content:center; gap:4px; color:white; padding:12px">
                  🏆 Voir le classement
                </button>
              </div>
            }
          }
        </div>

        <!-- RIGHT COLUMN (Manga Info Column) -->
        <div style="width:300px; display:flex; flex-direction:column; gap:20px; flex-shrink:0" class="info-sidebar">
          
          <!-- Sakura Speech bubble card (Manga) or Deku Win Speech bubble card (Rose) -->
          @if (isManga()) {
            <div style="display:flex; align-items:center; gap:8px; justify-content:flex-end; margin-bottom:-10px; margin-right:10px">
              <div style="background:white; border:2px solid black; border-radius:20px; padding:6px 12px; font-size:11px; font-weight:800; color:black; position:relative; box-shadow:3px 3px 0 rgba(0,0,0,0.1)">
                <span>すごい！ Amazing!</span>
                <div style="position:absolute; right:12px; bottom:-8px; width:12px; height:12px; background:white; border-right:2px solid black; border-bottom:2px solid black; transform:rotate(45deg)"></div>
              </div>
              <img src="sakura_chibi.png" style="height:85px; object-fit:contain" alt="Sakura">
            </div>
          } @else if (isRose()) {
            <div style="display:flex; flex-direction:column; gap:4px">
              <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:#BE185D; margin-left:4px">À quoi ça ressemble ?</div>
              <div style="background:url(deku_win_banner.png) center/cover; height:125px; border-radius:12px; border:2px solid #000; box-shadow:4px 4px 0 #000; display:flex; align-items:flex-end; justify-content:space-between; padding:8px 12px; position:relative; overflow:hidden">
                <div style="position:absolute; inset:0; background:rgba(0,0,0,0.1)"></div>
                <!-- Sakura speech bubble -->
                <div style="background:white; border:1.5px solid black; border-radius:15px; padding:4px 8px; font-size:9.5px; font-weight:900; color:black; z-index:2; position:relative; margin-bottom: 24px">
                  すごい！ Amazing!
                  <div style="position:absolute; right:15px; bottom:-6px; width:8px; height:8px; background:white; border-right:1.5px solid black; border-bottom:1.5px solid black; transform:rotate(45deg)"></div>
                </div>
                <img src="deku_chibi.png" style="height:90px; object-fit:contain; z-index:2; position:relative" alt="Deku Win">
                <span style="font-family:'Impact', sans-serif; font-size:24px; font-weight:900; color:white; text-shadow:2px 2px 0 #DB2777, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; transform:rotate(-8deg); z-index:2; position:relative; margin-bottom:8px">WIN!</span>
              </div>
            </div>
          }

          <!-- FAQ Card 1 -->
          <div class="card" [style.border]="(isManga() || isRose()) ? '2px solid #000' : '0.5px solid var(--border)'">
            <h4 style="font-size:13px; font-weight:900; color:var(--text-primary); margin:0 0 8px 0; display:flex; align-items:center; gap:6px">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Ice Breaker, c'est quoi ?
            </h4>
            <p style="font-size:12px; color:var(--text-secondary); margin:0; line-height:1.5">
              Des jeux fun, des quiz en direct et des défis oraux pour briser la glace et apprendre l'anglais en s'amusant !
            </p>
          </div>

          <!-- FAQ Card 2 -->
          <div class="card" [style.border]="(isManga() || isRose()) ? '2px solid #000' : '0.5px solid var(--border)'">
            <h4 style="font-size:13px; font-weight:900; color:var(--text-primary); margin:0 0 12px 0; display:flex; align-items:center; gap:6px">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.886H3.885l5.028 3.653L7.001 18.42 12 14.77l4.999 3.653-1.912-5.881 5.028-3.653h-6.203L12 3Z"/></svg>
              Comment ça marche ?
            </h4>
            <ol style="font-size:11.5px; color:var(--text-secondary); margin:0; padding-left:16px; display:flex; flex-direction:column; gap:8px">
              <li>Le professeur lance un jeu ou un défi</li>
              <li>Vous recevez le lien ou le code</li>
              <li>Rejoignez, participez et gagnez</li>
              <li>Amusez-vous et progressez !</li>
            </ol>
          </div>

          <!-- Naruto Keep Going speech bubble (Manga) or Level progress + Natsu chibi (Rose) -->
          @if (isManga()) {
            <div style="display:flex; align-items:center; gap:8px; margin-top:10px; margin-left:10px">
              <img src="naruto_chibi.png" style="height:85px; object-fit:contain" alt="Naruto">
              <div style="background:white; border:2px solid black; border-radius:20px; padding:8px 12px; font-size:11px; font-weight:800; color:black; position:relative; box-shadow:3px 3px 0 rgba(0,0,0,0.1)">
                <div style="display:flex; flex-direction:column">
                  <span>Believe in yourself and keep going!</span>
                  <span style="font-size:9.5px; opacity:0.8">信じて進め！</span>
                </div>
                <div style="position:absolute; left:-8px; top:50%; transform:translateY(-50%) rotate(45deg); width:12px; height:12px; background:white; border-left:2px solid black; border-bottom:2px solid black"></div>
              </div>
            </div>
          } @else if (isRose()) {
            <div class="card" style="padding:12px 16px; display:flex; justify-content:space-between; align-items:center; gap:8px; border:2px solid #000 !important; box-shadow:4px 4px 0 #000 !important">
              <div style="flex:1; display:flex; flex-direction:column; gap:4px">
                <span style="font-size:10px; font-weight:800; text-transform:uppercase; color:#DB2777">Niveau actuel</span>
                <span style="font-size:13.5px; font-weight:900; color:black">Ice Breaker Rookie</span>
                <div style="height:6px; background:#F3F4F6; border-radius:10px; overflow:hidden; border:1px solid #000; margin-top:4px">
                  <div style="width:40%; height:100%; background:#DB2777"></div>
                </div>
                <span style="font-size:9px; color:var(--text-muted); font-weight:700">120 / 300 XP</span>
              </div>
              <img src="natsu_chibi.png" style="height:70px; object-fit:contain" alt="Natsu Level">
            </div>
          }

        </div>

      </div>

    </div>
  `,
  styles: [`
    .animate-pulse {
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
      70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
  `]
})
export class StudentIceBreakerComponent implements OnDestroy {
  private db = inject(DatabaseService);

  currentUser = signal<UserProfile | null>(null);
  activeGame = signal<LiveIceBreaker | null>(null);
  myAnswer = '';

  // Audio recording helpers
  mediaRecorder: MediaRecorder | null = null;
  audioChunks: Blob[] = [];
  isRecording = false;
  recordedAudioUrl = '';

  constructor() {
    this.db.observeCurrentUser().subscribe(u => this.currentUser.set(u));
    this.db.observeActiveIceBreaker().subscribe(game => {
      this.activeGame.set(game);
      if (!game) {
        this.myAnswer = '';
        this.recordedAudioUrl = '';
      }
    });
  }

  t(fr: string, en: string): string {
    return this.db.activeLang() === 'en' ? en : fr;
  }

  getMyBuzzAnswer(game: LiveIceBreaker) {
    const user = this.currentUser();
    if (!user || !game.buzzState) return null;
    return game.buzzState.answers.find(a => a.studentId === user.id);
  }

  getMyMissionSubmission(game: LiveIceBreaker) {
    const user = this.currentUser();
    if (!user || !game.missionState) return null;
    return game.missionState.submissions.find(s => s.studentId === user.id);
  }

  async submitBuzz() {
    if (!this.myAnswer.trim()) return;
    const user = this.currentUser();
    if (!user) return;

    await this.db.submitIceBreakerBuzz(user.id, user.name || 'Étudiant', this.myAnswer.trim());
    this.myAnswer = '';
  }

  // Audio Recording Methods
  async startRecording() {
    try {
      this.audioChunks = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        this.recordedAudioUrl = URL.createObjectURL(audioBlob);
      };
      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (e) {
      alert("Veuillez autoriser l'accès au microphone pour faire cette mission vocale.");
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }

  resetRecording() {
    this.recordedAudioUrl = '';
    this.audioChunks = [];
  }

  async submitMission() {
    if (!this.recordedAudioUrl) return;
    const user = this.currentUser();
    if (!user) return;

    await this.db.submitIceBreakerMission(user.id, user.name || 'Étudiant', this.recordedAudioUrl);
  }

  ngOnDestroy() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }

  isManga(): boolean {
    return document.body.classList.contains('theme-manga');
  }

  isRose(): boolean {
    return document.body.classList.contains('theme-rose');
  }
}
