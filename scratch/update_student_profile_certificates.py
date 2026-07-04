import os

file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\student\profile.ts'

# Load the file content
with open(file_path, 'rb') as f:
    raw_bytes = f.read()

content = raw_bytes.decode('utf-8').replace('\r\n', '\n')

# 1. Modify the template to include Tab selectors and @if sections
# Let's inspect the layout inside the template:
# The template currently starts:
#     <div class="page" style="animation: fadeIn 0.28s ease">
#       
#       <!-- HERO PROFILE CARD -->

start_marker = '<div class="page" style="animation: fadeIn 0.28s ease">'
start_idx = content.find(start_marker)

if start_idx == -1:
    print("Error: template start not found!")
    exit(1)

# Find the end of HERO PROFILE CARD block.
# It ends around line 73:
#         </div>
#       </div>
# 
#       <!-- MAIN LAYOUT COLS -->
hero_end_marker = "      <!-- MAIN LAYOUT COLS -->"
hero_end_idx = content.find(hero_end_marker)

if hero_end_idx == -1:
    print("Error: hero end marker not found!")
    exit(1)

# We will insert the tab selectors right after the hero card end.
# The hero card actually ends with </div>\n      </div>
hero_card_closing = "      </div>\n      </div>"
hero_card_closing_idx = content.find(hero_card_closing, start_idx)

if hero_card_closing_idx == -1 or hero_card_closing_idx > hero_end_idx:
    # Use hero_end_idx - 10 as anchor
    insert_tabs_pos = hero_end_idx
else:
    insert_tabs_pos = hero_card_closing_idx + len(hero_card_closing)

tabs_block = """

      <!-- Tab row below profile card -->
      <div style="display:flex; gap:10px; margin-top:20px; border-bottom:1.5px solid var(--border-weak); padding-bottom:6px">
        <button (click)="activeProfileTab.set('stats')"
                [style.border-bottom-color]="activeProfileTab() === 'stats' ? '#4F46E5' : 'transparent'"
                [style.color]="activeProfileTab() === 'stats' ? 'var(--text-primary)' : 'var(--text-muted)'"
                style="padding:8px 16px; border:none; background:none; cursor:pointer; font-weight:700; border-bottom:2px solid transparent; font-size:13px; display:flex; align-items:center; gap:6px; transition:all 0.15s">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          {{ t('Succès & Stats', 'Badges & Stats') }}
        </button>
        <button (click)="activeProfileTab.set('certificates')"
                [style.border-bottom-color]="activeProfileTab() === 'certificates' ? '#4F46E5' : 'transparent'"
                [style.color]="activeProfileTab() === 'certificates' ? 'var(--text-primary)' : 'var(--text-muted)'"
                style="padding:8px 16px; border:none; background:none; cursor:pointer; font-weight:700; border-bottom:2px solid transparent; font-size:13px; display:flex; align-items:center; gap:6px; transition:all 0.15s">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/></svg>
          {{ t('Mes Certificats', 'My Certificates') }}
        </button>
      </div>
"""

# Let's wrap the MAIN LAYOUT COLS in @if (activeProfileTab() === 'stats') {
# It starts around:
#       <!-- MAIN LAYOUT COLS -->
#       <div style="display:grid; grid-template-columns: 1.4fr 1fr; gap:20px; margin-top:20px; align-items:start" class="profile-layout">
# and ends right before the closing tag of the page.
# The page ends with:
#     </div>
#   `,
#   styles: ...

page_end_marker = "    </div>\n  `,"
page_end_idx = content.rfind(page_end_marker)

if page_end_idx == -1:
    page_end_idx = content.find("    </div>\n  `")

if page_end_idx == -1:
    print("Error: page end marker not found!")
    exit(1)

# Let's construct the new template structure:
main_layout_block_start = "@if (activeProfileTab() === 'stats') {\n      <!-- MAIN LAYOUT COLS -->"
main_layout_block_end = "\n      }\n"

# Let's write the certificates section block that will be appended
certificates_tab_block = """
      <!-- TAB 2: CERTIFICATES SYSTEM -->
      @if (activeProfileTab() === 'certificates') {
        <div style="margin-top:20px; animation: fadeIn 0.2s ease-out">
          <div class="card" style="margin:0; padding:24px">
            <h3 class="st" style="font-size:15px; margin:0 0 6px 0; color:#4F46E5; font-weight:800; display:flex; align-items:center; gap:8px">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/></svg>
              {{ t('Mes Certifications de Niveau CEFR', 'My CEFR Level Certifications') }}
            </h3>
            <p style="font-size:12.5px; color:var(--text-secondary); margin:0 0 20px 0; line-height:1.4">
              {{ t('Gagnez un certificat officiel validé par la direction pédagogique de SpeakUp à chaque fois que vous atteignez ou terminez un niveau d\\'anglais.', 'Earn an official certificate verified by the SpeakUp academic board each time you reach or complete an English level.') }}
            </p>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:16px">
              @for (lvl of [
                { id: 'A1', name: 'A1 — Beginner', desc: 'Can understand everyday expressions and basic phrases.', icon: '🎓' },
                { id: 'A2', name: 'A2 — Elementary', desc: 'Can communicate in simple and routine tasks.', icon: '🏆' },
                { id: 'B1', name: 'B1 — Intermediate', desc: 'Can understand the main points of clear standard input.', icon: '🌟' },
                { id: 'B2', name: 'B2 — Upper Intermediate', desc: 'Can interact with a degree of fluency and spontaneity.', icon: '👑' }
              ]; track lvl.id) {
                <div [style.background]="isCertificateUnlocked(lvl.id) ? 'linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 100%)' : 'var(--surface-2)'"
                     [style.border-color]="isCertificateUnlocked(lvl.id) ? '#C7D2FE' : 'var(--border)'"
                     style="border: 2px solid; border-radius: 16px; padding: 20px; text-align: center; position: relative; transition: all 0.2s; display:flex; flex-direction:column; justify-content:space-between; min-height: 200px">
                  
                  <div>
                    <span style="font-size:32px; display:block; margin-bottom:8px">{{ lvl.icon }}</span>
                    <h4 style="font-size:14px; font-weight:800; color:var(--text-primary); margin:0 0 6px 0">{{ lvl.name }}</h4>
                    <p style="font-size:11.5px; color:var(--text-secondary); margin:0 0 12px 0; line-height:1.4">{{ lvl.desc }}</p>
                  </div>

                  @if (isCertificateUnlocked(lvl.id)) {
                    <button (click)="selectedCertificate.set(lvl.id)"
                            style="width:100%; border:none; background:#4F46E5; color:white; font-size:12px; font-weight:700; padding:8px 12px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.15s">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      {{ t('Voir & Partager', 'View & Share') }}
                    </button>
                  } @else {
                    <div style="background: rgba(0,0,0,0.03); color: var(--text-muted); font-size:11.5px; font-weight:600; padding:8px; border-radius:8px; display:flex; align-items:center; justify-content:center; gap:4px">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      {{ t('Bloqué', 'Locked') }}
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- FULL SCREEN PRINTABLE CERTIFICATE VIEW MODAL -->
      @if (selectedCertificate(); as lvl) {
        <div class="modal-overlay" (click)="selectedCertificate.set(null)" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.55); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:99999; padding:16px">
          <div class="modal-card" (click)="$event.stopPropagation()" style="background:white; border-radius:16px; max-width:760px; width:100%; padding:24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15)">
            
            <!-- MODAL HEADER ACTIONS -->
            <div class="no-print" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-weak); padding-bottom:12px; margin-bottom:16px">
              <h3 style="margin:0; font-size:14px; font-weight:800; color:var(--text-primary)">{{ t('Votre Certificat Officiel', 'Your Official Certificate') }}</h3>
              <button (click)="selectedCertificate.set(null)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:20px; line-height:1"><i class="ti ti-x"></i></button>
            </div>

            <!-- THE PRINTABLE CERTIFICATE CARD -->
            <div class="printable-certificate" style="background:#FAF9F6; border: 12px double #1E1B4B; border-radius: 4px; padding: 40px; text-align: center; position: relative; box-shadow: inset 0 0 0 2px #D97706, 0 4px 12px rgba(0,0,0,0.05); overflow:hidden;">
              
              <!-- Subtle Watermark Background Pattern -->
              <div style="position:absolute; inset:0; background: radial-gradient(circle, rgba(79, 70, 229, 0.02) 10%, transparent 60%); pointer-events:none"></div>

              <!-- Top Logo speakup -->
              <div style="font-family:'Outfit', sans-serif; font-weight:900; color:#1E1B4B; font-size:22px; letter-spacing:1px; display:flex; align-items:center; justify-content:center; gap:6px; margin-bottom:10px">
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="3"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <span>SPEAK<span style="color:#D97706">UP</span></span>
              </div>

              <div style="font-family:'Cinzel', serif; font-size:12px; font-weight:700; color:#D97706; letter-spacing:3px; text-transform:uppercase; margin-bottom:14px">
                {{ t('CERTIFICAT DE COMPÉTENCE LINGUISTIQUE', 'CERTIFICATE OF LANGUAGE PROFICIENCY') }}
              </div>

              <div style="font-size:13px; color:#475569; font-style:italic; margin-bottom:14px">
                {{ t('Ce document officiel est décerné à', 'This official certificate is proudly presented to') }}
              </div>

              <!-- Student Name -->
              <div style="font-size:28px; font-weight:900; color:#1E1B4B; margin-bottom:14px; text-decoration: underline; text-decoration-color:#D97706; text-underline-offset: 6px; letter-spacing:0.5px">
                {{ currentUser()?.name }}
              </div>

              <div style="font-size:13px; color:#475569; line-height:1.6; max-width:520px; margin:0 auto 20px auto">
                {{ t('pour avoir brillamment validé et démontré ses compétences linguistiques en anglais au niveau', 'for having successfully attained and demonstrated linguistic proficiency in the English language at the level of') }}
                <div style="font-size:16px; font-weight:850; color:#D97706; margin:8px 0; text-transform:uppercase; letter-spacing:0.5px">
                  {{ lvl }} — {{ getLevelFullName(lvl) }}
                </div>
                {{ t('conformément aux exigences du Cadre Européen Commun de Référence pour les Langues (CECRL).', 'in compliance with the criteria of the Common European Framework of Reference for Languages (CEFR).') }}
              </div>

              <!-- Footer with Signatures, Date and Unique hash -->
              <div style="display:grid; grid-template-columns:1.2fr 1fr 1.2fr; gap:10px; border-top:1px solid rgba(79, 70, 229, 0.15); padding-top:20px; align-items:center">
                <!-- Left col: Date & Credentials -->
                <div style="text-align:left">
                  <div style="font-size:10px; color:#64748B; font-weight:600">{{ t('DATE D\\'ÉMISSION', 'ISSUE DATE') }}</div>
                  <div style="font-size:11px; color:#1E1B4B; font-weight:700; margin-top:2px">{{ getCertificateIssueDate() }}</div>
                  <div style="font-size:9px; color:#64748B; font-weight:600; margin-top:10px">{{ t('IDENTIFIANT DE SÉCURITÉ', 'SECURE CREDENTIAL ID') }}</div>
                  <div style="font-size:10px; color:#4F46E5; font-weight:700; margin-top:2px; font-family:monospace">{{ getCertificateId(currentUser()?.id || 'guest', lvl) }}</div>
                </div>

                <!-- Center col: Verification Seal -->
                <div style="display:flex; justify-content:center">
                  <!-- Golden Seal badge -->
                  <div style="width:70px; height:70px; border:2px solid #D97706; border-radius:50%; background:#FFF; display:flex; flex-direction:column; align-items:center; justify-content:center; box-shadow: 0 4px 10px rgba(217, 119, 6, 0.1); position:relative">
                    <span style="font-size:8px; font-weight:900; color:#D97706; text-transform:uppercase; letter-spacing:-0.2px">CEFR</span>
                    <span style="font-size:12px; font-weight:900; color:#1E1B4B">{{ lvl }}</span>
                    <span style="font-size:7px; font-weight:800; color:#D97706; text-transform:uppercase; text-align:center; transform:scale(0.8)">VERIFIED</span>
                    
                    <!-- Decorative ribbon mock -->
                    <div style="position:absolute; bottom:-8px; display:flex; gap:6px">
                      <div style="width:10px; height:18px; background:#D97706; transform:rotate(15deg); border-radius:2px"></div>
                      <div style="width:10px; height:18px; background:#D97706; transform:rotate(-15deg); border-radius:2px"></div>
                    </div>
                  </div>
                </div>

                <!-- Right col: Signature -->
                <div style="text-align:right">
                  <div style="font-family:'Dancing Script', cursive, sans-serif; font-size:18px; color:#1e1b4b; font-weight:700; font-style:italic">Awa Ndiaye</div>
                  <div style="width:100px; height:1.5px; background:#CBD5E1; margin:4px 0 4px auto"></div>
                  <div style="font-size:10px; color:#64748B; font-weight:600">{{ t('DIRECTEUR PÉDAGOGIQUE', 'ACADEMY DIRECTOR') }}</div>
                  <div style="font-size:9px; color:#D97706; font-weight:700; margin-top:2px">SPEAKUP ACADEMY</div>
                </div>
              </div>

            </div>

            <!-- MODAL ACTIONS -->
            <div class="no-print" style="display:flex; justify-content:flex-end; gap:12px; margin-top:20px; border-top:1px solid var(--border-weak); padding-top:16px">
              <button class="btn-s" (click)="selectedCertificate.set(null)">{{ t('Fermer', 'Close') }}</button>
              
              <!-- Print Button -->
              <button class="btn-s" style="border-color:#1E1B4B; color:#1E1B4B; display:flex; align-items:center; gap:6px" (click)="printCertificate()">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                {{ t('Imprimer / Enregistrer PDF', 'Print / Save PDF') }}
              </button>

              <!-- Share to LinkedIn Button -->
              <button class="btn-p" style="background:#0A66C2; border-color:#0A66C2; display:flex; align-items:center; gap:6px" (click)="shareToLinkedIn(lvl)">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24" style="color:white"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                {{ t('Ajouter à LinkedIn', 'Add to LinkedIn') }}
              </button>
            </div>
            
          </div>
        </div>
      }
"""

# Now replace the main layout columns block with our wrapped block.
# Let's locate the main layout block first.
main_layout_str = '<div style="display:grid; grid-template-columns: 1.4fr 1fr; gap:20px; margin-top:20px; align-items:start" class="profile-layout">'
main_layout_idx = content.find(main_layout_str)

if main_layout_idx == -1:
    print("Error: main layout columns not found in profile.ts!")
    exit(1)

# We wrap this layout block with the @if (activeProfileTab() === 'stats') { and close it at page_end_idx.
# But wait, does the main layout have a closing </div> at the end? Yes.
# Let's verify how many characters to slice.
# The template ends with:
#     </div>
#   `,
# So the closing div of the main columns block is right before the last closing </div>.
# Let's check page_end_idx.

content = (
    content[:insert_tabs_pos] +
    tabs_block +
    content[insert_tabs_pos:main_layout_idx] +
    main_layout_block_start + "\n" +
    content[main_layout_idx:page_end_idx] +
    main_layout_block_end +
    certificates_tab_block +
    content[page_end_idx:]
)

# 3. Add print CSS style to styles
# In the styles section:
#     @media (max-width: 768px) {
#       .profile-layout {
#         grid-template-columns: 1fr !important;
#       }
#     }
# Let's add the print styles.

print_styles = """
    @media (max-width: 768px) {
      .profile-layout {
        grid-template-columns: 1fr !important;
      }
    }
    @media print {
      body * {
        visibility: hidden !important;
      }
      .modal-overlay {
        position: absolute !important;
        left: 0 !important; top: 0 !important;
        background: none !important;
        backdrop-filter: none !important;
      }
      .modal-card {
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        max-width: 100% !important;
        width: 100% !important;
      }
      .no-print {
        display: none !important;
      }
      .printable-certificate, .printable-certificate * {
        visibility: visible !important;
      }
      .printable-certificate {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        border: 8px double #1E1B4B !important;
        padding: 30px !important;
        box-shadow: none !important;
        background: #FAF9F6 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
"""

content = content.replace("""    @media (max-width: 768px) {
      .profile-layout {
        grid-template-columns: 1fr !important;
      }
    }""", print_styles)

# 4. Add methods to StudentProfileComponent class definition
# Let's locate:
# export class StudentProfileComponent {
#   private db = inject(DatabaseService);

class_decl = "export class StudentProfileComponent {"
class_idx = content.find(class_decl)

if class_idx == -1:
    print("Error: StudentProfileComponent not found!")
    exit(1)

insert_class_pos = class_idx + len(class_decl)

class_injections = """
  activeProfileTab = signal<'stats' | 'certificates'>('stats');
  selectedCertificate = signal<string | null>(null);

  activeLang = this.db.activeLang;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

  isCertificateUnlocked(lvl: string): boolean {
    const current = this.currentUser()?.level || 'A1';
    if (current === 'Guest') return true; // Guests can see all for demo
    const levels = ['A1', 'A2', 'B1', 'B2'];
    const currentIdx = levels.indexOf(current);
    const targetIdx = levels.indexOf(lvl);
    return currentIdx >= targetIdx;
  }

  getCertificateId(studentId: string, level: string): string {
    let hash = 0;
    const str = studentId + '-' + level + '-speakup-salt-2026';
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `SPK-${level}-${Math.abs(hash).toString(16).toUpperCase()}`;
  }

  getLevelFullName(level: string): string {
    switch (level) {
      case 'A1': return this.t('Élémentaire Introductif / Débutant', 'Introductory Elementary / Beginner');
      case 'A2': return this.t('Intermédiaire Usuel / Élémentaire', 'Pre-Intermediate / Elementary');
      case 'B1': return this.t('Seuil / Intermédiaire', 'Threshold / Intermediate');
      case 'B2': return this.t('Avancé / Intermédiaire Supérieur', 'Vantage / Upper Intermediate');
      default: return '';
    }
  }

  getCertificateIssueDate(): string {
    const d = new Date();
    const monthsFr = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (this.activeLang() === 'fr') {
      return `${d.getDate()} ${monthsFr[d.getMonth()]} ${d.getFullYear()}`;
    }
    return `${monthsEn[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  }

  printCertificate() {
    window.print();
  }

  shareToLinkedIn(level: string) {
    const certId = this.getCertificateId(this.currentUser()?.id || 'guest', level);
    const name = encodeURIComponent(`SpeakUp English Proficiency Certificate - Level ${level}`);
    const org = encodeURIComponent('SpeakUp Academy');
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const certUrl = encodeURIComponent(`https://speakup.academy/verify/${certId}`);
    
    const shareUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${name}&organizationName=${org}&issueYear=${year}&issueMonth=${month}&certId=${certId}&certUrl=${certUrl}`;
    
    window.open(shareUrl, '_blank');
  }
"""

content = content[:insert_class_pos] + class_injections + content[insert_class_pos:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("profile.ts updated successfully with certificates tab!")
