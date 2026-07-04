import os

file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\teacher\students.ts'

# Load the file content
with open(file_path, 'rb') as f:
    raw_bytes = f.read()

content = raw_bytes.decode('utf-8').replace('\r\n', '\n')

# 1. Add showAddStudentModal signal and translation t() method to class definition
class_decl = "export class TeacherStudentsComponent {"
class_idx = content.find(class_decl)

if class_idx == -1:
    print("Error: class declaration not found!")
    exit(1)

insert_pos = class_idx + len(class_decl)

class_injections = """
  showAddStudentModal = signal<boolean>(false);
  activeLang = this.db.activeLang;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }
"""

content = content[:insert_pos] + class_injections + content[insert_pos:]

# 2. Modify Template for Student list header and replace inline Form Card with Modal
# Let's locate the template part.
# The student list starts with:
#       <!-- ALL STUDENTS LIST -->
#       @if (activeTab() === 'all') {
#         <div style="display:flex; flex-direction:column; gap:4px; overflow-x:auto">

student_tab_start = "      <!-- ALL STUDENTS LIST -->\n      @if (activeTab() === 'all') {"
start_idx = content.find(student_tab_start)

if start_idx == -1:
    # try another spacing
    student_tab_start = "      <!-- ALL STUDENTS LIST -->\n      @if (activeTab() === 'all') {"
    start_idx = content.find("<!-- ALL STUDENTS LIST -->")

if start_idx == -1:
    print("Error: Student tab start not found in template!")
    exit(1)

# The form card starts around line 73:
#         <!-- ADD NEW STUDENT FORM CARD -->
#         <div class="card" style="margin-top:20px; border:1px dashed #4F46E5; background:#FAF5FF">
#           ...
#         </div>
#       }

form_start_marker = "        <!-- ADD NEW STUDENT FORM CARD -->"
form_start_idx = content.find(form_start_marker)

if form_start_idx == -1:
    print("Error: Form card start not found in template!")
    exit(1)

# Let's find the closing brace matching the `@if (activeTab() === 'all') {` block.
# The form card ends, then a closing brace.
# Let's search for the end of the form card:
#               Create Account
#             </button>
#           </div>
#         </div>
#       }
form_end_marker = "        </div>\n      }"
form_end_idx = content.find(form_end_marker, form_start_idx)

if form_end_idx == -1:
    print("Error: Form card end not found in template!")
    exit(1)

# We will cut out the form card block, and insert the modal popup and the title header.
# Let's get the students table block.
# We will insert the title header at the start of `@if (activeTab() === 'all') {`.

list_tab_insert_idx = start_idx + len("      <!-- ALL STUDENTS LIST -->\n      @if (activeTab() === 'all') {\n")

header_block = """        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px">
          <span style="font-size:13px; font-weight:700; color:var(--text-primary)">{{ t('Tous les étudiants', 'All Students') }}</span>
          <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5; font-size:12.5px; padding:8px 16px; border-radius:8px; display:flex; align-items:center; gap:6px; height:34px" (click)="showAddStudentModal.set(true)">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            {{ t('Ajouter un Étudiant', 'Add New Student') }}
          </button>
        </div>
"""

# Let's write the modal block that will replace the form card:
modal_block = """        <!-- ADD NEW STUDENT MODAL -->
        @if (showAddStudentModal()) {
          <div class="modal-overlay" (click)="showAddStudentModal.set(false)" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.4); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:9999; padding:16px">
            <div class="modal-card" (click)="$event.stopPropagation()" style="background:white; border-radius:12px; max-width:480px; width:100%; padding:24px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); border:1px solid var(--border-weak)">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-weak); padding-bottom:12px; margin-bottom:16px">
                <h3 style="margin:0; font-size:15px; font-weight:800; color:#4F46E5; display:flex; align-items:center; gap:6px">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                  {{ t('Créer un Compte Étudiant', 'Create Student Account') }}
                </h3>
                <button (click)="showAddStudentModal.set(false)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:18px; line-height:1; display:flex; align-items:center; justify-content:center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              
              <div style="display:flex; flex-direction:column; gap:12px">
                <div class="input-row" style="margin-bottom:0">
                  <label for="newStudentName" style="color:#4F46E5; font-weight:700; font-size:11.5px">{{ t('Nom complet', 'Full Name') }}</label>
                  <input id="newStudentName" type="text" [(ngModel)]="newStudentName" placeholder="e.g. Kofi Dembélé" style="background:#FFF; padding:8px; border-radius:6px; border:1.5px solid var(--border); width:100%" />
                </div>
                
                <div class="input-row" style="margin-bottom:0">
                  <label for="newStudentLevel" style="color:#4F46E5; font-weight:700; font-size:11.5px">{{ t('Niveau d\\'anglais de départ', 'English Level') }}</label>
                  <select id="newStudentLevel" [(ngModel)]="newStudentLevel" style="background:#FFF; padding:8px; border-radius:6px; border:1.5px solid var(--border); width:100%">
                    <option value="A1">A1 — {{ t('Débutant', 'Beginner') }}</option>
                    <option value="A2">A2 — {{ t('Élémentaire', 'Elementary') }}</option>
                    <option value="B1">B1 — {{ t('Intermédiaire', 'Intermediate') }}</option>
                    <option value="B2">B2 — {{ t('Intermédiaire Supérieur', 'Upper Intermediate') }}</option>
                    <option value="Guest">Guest / Invité (No Fees)</option>
                  </select>
                </div>

                <div class="input-row" style="margin-bottom:0">
                  <label for="newStudentCountry" style="color:#4F46E5; font-weight:700; font-size:11.5px">{{ t('Drapeau du pays', 'Country Flag') }}</label>
                  <select id="newStudentCountry" [(ngModel)]="newStudentCountry" style="background:#FFF; padding:8px; border-radius:6px; border:1.5px solid var(--border); width:100%">
                    <option value="">No Flag</option>
                    <option value="🇸🇳">Senegal 🇸🇳</option>
                    <option value="🇳🇬">Nigeria 🇳🇬</option>
                    <option value="🇷🇼">Rwanda 🇷🇼</option>
                    <option value="🇧🇯">Benin 🇧🇯</option>
                    <option value="🇨🇮">Ivory Coast 🇨🇮</option>
                    <option value="🇨🇲">Cameroon 🇨🇲</option>
                    <option value="🇹🇬">Togo 🇹🇬</option>
                    <option value="🇲🇱">Mali 🇲🇱</option>
                    <option value="🇬🇳">Guinea 🇬🇳</option>
                    <option value="🇳 Niger 🇳 Niger">Niger 🇳 Niger</option>
                    <option value="🇫🇷">France 🇫🇷</option>
                  </select>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px">
                  <div class="input-row" style="margin-bottom:0">
                    <label for="newStudentRegFee" style="color:#4F46E5; font-weight:700; font-size:11.5px">{{ t('Frais d\\'inscription', 'Reg. Fee') }}</label>
                    <select id="newStudentRegFee" [(ngModel)]="newStudentRegFee" style="background:#FFF; padding:8px; border-radius:6px; border:1.5px solid var(--border); width:100%">
                      <option [value]="10000">10,000 CFA (Regular)</option>
                      <option [value]="0">0 CFA (Waived / Promo)</option>
                    </select>
                  </div>
                  <div class="input-row" style="margin-bottom:0">
                    <label for="newStudentMonthlyFee" style="color:#4F46E5; font-weight:700; font-size:11.5px">{{ t('Scolarité mensuelle', 'Monthly Tuition') }}</label>
                    <select id="newStudentMonthlyFee" [(ngModel)]="newStudentMonthlyFee" style="background:#FFF; padding:8px; border-radius:6px; border:1.5px solid var(--border); width:100%">
                      <option [value]="7000">7,000 CFA (Regular)</option>
                      <option [value]="5000">5,000 CFA (Promo)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:20px; border-top:1px solid var(--border-weak); padding-top:16px">
                <button class="btn-s" (click)="showAddStudentModal.set(false)">{{ t('Annuler', 'Cancel') }}</button>
                <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5" [disabled]="!newStudentName.trim()" (click)="addStudent()">
                  {{ t('Créer le Compte', 'Create Account') }}
                </button>
              </div>
            </div>
          </div>
        }
      }"""

# Insert the header block
content = content[:list_tab_insert_idx] + header_block + content[list_tab_insert_idx:]

# Since we modified the indexes, let's search again for the form card starts and ends in the updated content.
form_start_idx = content.find(form_start_marker)
form_end_idx = content.find(form_end_marker, form_start_idx)

# Replace the form card with the modal block
content = content[:form_start_idx] + modal_block + content[form_end_idx + len(form_end_marker):]

# 3. Modify addStudent() inside class logic to close the modal on success.
# Find then block inside addStudent
then_marker = ").then((newUser) => {"
then_idx = content.find(then_marker)

if then_idx != -1:
    close_modal_pos = content.find("this.newStudentName = '';", then_idx)
    if close_modal_pos != -1:
        content = content[:close_modal_pos] + "this.showAddStudentModal.set(false);\n      " + content[close_modal_pos:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("students.ts updated successfully with Add Student modal!")
