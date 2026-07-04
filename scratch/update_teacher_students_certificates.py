import os

file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\teacher\students.ts'

# Load the file content
with open(file_path, 'rb') as f:
    raw_bytes = f.read()

content = raw_bytes.decode('utf-8').replace('\r\n', '\n')

# 1. Locate the Billing & Permission Settings block in the template to insert Certificates block before it.
billing_marker = "              <!-- Billing & Permission Settings -->"
billing_idx = content.find(billing_marker)

if billing_idx == -1:
    print("Error: Billing marker not found in students.ts!")
    exit(1)

certificates_section = """              <!-- Certificats Obtenus -->
              <div class="card" style="margin-top:0; margin-bottom:16px; border: 1.5px dashed #D97706; background:#FFFBEB; padding:16px; border-radius:8px">
                <h4 style="font-size:12px; font-weight:700; color:#B45309; margin-bottom:12px; display:flex; align-items:center; gap:6px; margin-top:0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/></svg>
                  <span>{{ t('Certifications de Niveau de l\\'élève', 'Student Language Certificates') }}</span>
                </h4>
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap:10px">
                  @for (lvl of ['A1', 'A2', 'B1', 'B2']; track lvl) {
                    <div style="padding:10px; border-radius:8px; border:1.5px solid; display:flex; flex-direction:column; justify-content:space-between; align-items:center; min-height:80px; text-align:center"
                         [style.background]="isCertificateUnlocked(student.level, lvl) ? 'white' : 'var(--surface-2)'"
                         [style.border-color]="isCertificateUnlocked(student.level, lvl) ? '#FDE68A' : 'var(--border-weak)'">
                      <div>
                        <span style="font-size:11px; font-weight:800; color:var(--text-primary)">Level {{ lvl }}</span>
                        <div style="font-size:9.5px; color:var(--text-muted); margin-top:2px">
                          {{ isCertificateUnlocked(student.level, lvl) ? t('Débloqué', 'Unlocked') : t('En cours', 'Locked') }}
                        </div>
                      </div>
                      @if (isCertificateUnlocked(student.level, lvl)) {
                        <button class="btn-s" style="padding:4px 8px; font-size:10px; margin-top:6px; background:#4F46E5; color:white; border:none; display:flex; align-items:center; gap:4px; cursor:pointer" 
                                (click)="selectedCertificate.set(lvl); selectedStudentCert.set(student)">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          {{ t('Voir / Imprimer', 'View / Print') }}
                        </button>
                      } @else {
                        <span style="font-size:12px; margin-top:6px">🔒</span>
                      }
                    </div>
                  }
                </div>
              </div>

"""

content = content[:billing_idx] + certificates_section + content[billing_idx:]

# 2. Add Modal Dialog Overlay at the bottom of the template block
# The template ends with:
#     </div>
#   `
# })
# Let's search from the bottom for the end of the HTML template string
page_end_marker = "    </div>\n  `"
page_end_idx = content.find(page_end_marker)

if page_end_idx == -1:
    print("Error: template closing marker not found!")
    exit(1)

teacher_cert_modal = """
      <!-- FULL SCREEN PRINTABLE CERTIFICATE VIEW MODAL FOR TEACHER -->
      @if (selectedCertificate(); as lvl) {
        @if (selectedStudentCert(); as student) {
          <div class="modal-overlay" (click)="selectedCertificate.set(null); selectedStudentCert.set(null)" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.55); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:99999; padding:16px">
            <div class="modal-card" (click)="$event.stopPropagation()" style="background:white; border-radius:16px; max-width:760px; width:100%; padding:24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15)">
              
              <div class="no-print" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-weak); padding-bottom:12px; margin-bottom:16px">
                <h3 style="margin:0; font-size:14px; font-weight:800; color:var(--text-primary)">{{ t('Aperçu du Certificat de l\\'élève', 'Student Certificate Preview') }}</h3>
                <button (click)="selectedCertificate.set(null); selectedStudentCert.set(null)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:20px; line-height:1"><i class="ti ti-x"></i></button>
              </div>

              <!-- THE PRINTABLE CERTIFICATE CARD -->
              <div class="printable-certificate" style="background:#FAF9F6; border: 12px double #1E1B4B; border-radius: 4px; padding: 40px; text-align: center; position: relative; box-shadow: inset 0 0 0 2px #D97706, 0 4px 12px rgba(0,0,0,0.05); overflow:hidden;">
                
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
                  {{ student.name }}
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
                  <div style="text-align:left">
                    <div style="font-size:10px; color:#64748B; font-weight:600">{{ t('DATE D\\'ÉMISSION', 'ISSUE DATE') }}</div>
                    <div style="font-size:11px; color:#1E1B4B; font-weight:700; margin-top:2px">{{ getCertificateIssueDate(student.registeredAt) }}</div>
                    <div style="font-size:9px; color:#64748B; font-weight:600; margin-top:10px">{{ t('IDENTIFIANT DE SÉCURITÉ', 'SECURE CREDENTIAL ID') }}</div>
                    <div style="font-size:10px; color:#4F46E5; font-weight:700; margin-top:2px; font-family:monospace">{{ getCertificateId(student.id, lvl) }}</div>
                  </div>

                  <div style="display:flex; justify-content:center">
                    <div style="width:70px; height:70px; border:2px solid #D97706; border-radius:50%; background:#FFF; display:flex; flex-direction:column; align-items:center; justify-content:center; box-shadow: 0 4px 10px rgba(217, 119, 6, 0.1); position:relative">
                      <span style="font-size:8px; font-weight:900; color:#D97706; text-transform:uppercase; letter-spacing:-0.2px">CEFR</span>
                      <span style="font-size:12px; font-weight:900; color:#1E1B4B">{{ lvl }}</span>
                      <span style="font-size:7px; font-weight:800; color:#D97706; text-transform:uppercase; text-align:center; transform:scale(0.8)">VERIFIED</span>
                      <div style="position:absolute; bottom:-8px; display:flex; gap:6px">
                        <div style="width:10px; height:18px; background:#D97706; transform:rotate(15deg); border-radius:2px"></div>
                        <div style="width:10px; height:18px; background:#D97706; transform:rotate(-15deg); border-radius:2px"></div>
                      </div>
                    </div>
                  </div>

                  <div style="text-align:right">
                    <div style="font-family:'Dancing Script', cursive, sans-serif; font-size:18px; color:#1e1b4b; font-weight:700; font-style:italic">Awa Ndiaye</div>
                    <div style="width:100px; height:1.5px; background:#CBD5E1; margin:4px 0 4px auto"></div>
                    <div style="font-size:10px; color:#64748B; font-weight:600">{{ t('DIRECTEUR PÉDAGOGIQUE', 'ACADEMY DIRECTOR') }}</div>
                    <div style="font-size:9px; color:#D97706; font-weight:700; margin-top:2px">SPEAKUP ACADEMY</div>
                  </div>
                </div>

              </div>

              <div class="no-print" style="display:flex; justify-content:flex-end; gap:12px; margin-top:20px; border-top:1px solid var(--border-weak); padding-top:16px">
                <button class="btn-s" (click)="selectedCertificate.set(null); selectedStudentCert.set(null)">{{ t('Fermer', 'Close') }}</button>
                <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5; display:flex; align-items:center; gap:6px" (click)="printCertificate()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  {{ t('Imprimer Certificat', 'Print Certificate') }}
                </button>
              </div>

            </div>
          </div>
        }
      }
"""

content = content[:page_end_idx] + teacher_cert_modal + content[page_end_idx:]

# 3. Add styles: printable-certificate modal-overlay and print media queries
# Let's add styling for print layouts and overlay inside Component decorators styles: []
# Since students.ts doesn't have a styles property in Component, let's add one!
# Let's inspect where selector/imports/template is in @Component annotation.
comp_marker = "@Component({"
comp_idx = content.find(comp_marker)

if comp_idx == -1:
    print("Error: @Component decorator not found!")
    exit(1)

# We can append styles: [...] inside the decorator
dec_end_marker = "  template: `"
dec_end_idx = content.find(dec_end_marker)

if dec_end_idx == -1:
    print("Error: template marker in decorator not found!")
    exit(1)

new_styles_in_decorator = """  styles: [`
    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 9999;
    }
    .modal-card {
      background: white; border-radius: 12px; max-width: 600px; width: 95%;
      max-height: 85vh; overflow-y: auto; padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
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
  `],
"""

content = content[:dec_end_idx] + new_styles_in_decorator + content[dec_end_idx:]

# 4. Inject classes / methods inside the TypeScript class code
class_start_marker = "export class TeacherStudentsComponent {"
class_start_idx = content.find(class_start_marker)

if class_start_idx == -1:
    print("Error: class start not found!")
    exit(1)

insert_class_pos = class_start_idx + len(class_start_marker)

class_injections = """
  selectedCertificate = signal<string | null>(null);
  selectedStudentCert = signal<UserProfile | null>(null);

  isCertificateUnlocked(studentLevel: string, targetLevel: string): boolean {
    if (studentLevel === 'Guest') return true;
    const levels = ['A1', 'A2', 'B1', 'B2'];
    const currentIdx = levels.indexOf(studentLevel);
    const targetIdx = levels.indexOf(targetLevel);
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

  getCertificateIssueDate(registeredAt?: string): string {
    const d = registeredAt ? new Date(registeredAt) : new Date();
    if (isNaN(d.getTime())) {
      return this.t('1 juillet 2026', 'July 1, 2026');
    }
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
"""

content = content[:insert_class_pos] + class_injections + content[insert_class_pos:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("students.ts successfully updated with certificates inspection!")
