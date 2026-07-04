import os

file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\student\profile.ts'

# Load the file content
with open(file_path, 'rb') as f:
    raw_bytes = f.read()

content = raw_bytes.decode('utf-8').replace('\r\n', '\n')

# 1. Update the Locked block in template to add the Specimen Preview button
old_locked_block = """                  @if (isCertificateUnlocked(lvl.id)) {
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
                  }"""

new_locked_block = """                  @if (isCertificateUnlocked(lvl.id)) {
                    <button (click)="selectedCertificate.set(lvl.id); isSpecimen.set(false)"
                            style="width:100%; border:none; background:#4F46E5; color:white; font-size:12px; font-weight:700; padding:8px 12px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.15s">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      {{ t('Voir & Partager', 'View & Share') }}
                    </button>
                  } @else {
                    <div style="display:flex; flex-direction:column; gap:6px; width:100%">
                      <div style="background: rgba(0,0,0,0.03); color: var(--text-muted); font-size:11.5px; font-weight:600; padding:6px; border-radius:8px; display:flex; align-items:center; justify-content:center; gap:4px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        {{ t('Bloqué', 'Locked') }}
                      </div>
                      <button (click)="viewSpecimen(lvl.id)"
                              style="width:100%; border:1px solid #CBD5E1; background:white; color:var(--text-secondary); font-size:11px; font-weight:600; padding:6px; border-radius:8px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px">
                        {{ t('Aperçu du format', 'Preview Format') }}
                      </button>
                    </div>
                  }"""

content = content.replace(old_locked_block, new_locked_block)

# 2. Add Watermark overlay inside .printable-certificate container
watermark_insert = """            <!-- THE PRINTABLE CERTIFICATE CARD -->
            <div class="printable-certificate" style="background:#FAF9F6; border: 12px double #1E1B4B; border-radius: 4px; padding: 40px; text-align: center; position: relative; box-shadow: inset 0 0 0 2px #D97706, 0 4px 12px rgba(0,0,0,0.05); overflow:hidden;">
              
              <!-- Specimen Watermark Overlay -->
              @if (isSpecimen()) {
                <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(-30deg); font-size:56px; font-weight:900; color:rgba(100, 116, 139, 0.08); pointer-events:none; white-space:nowrap; z-index:10; font-family:'Outfit', sans-serif; border: 4px dashed rgba(100, 116, 139, 0.08); padding: 10px 20px; text-transform:uppercase">
                  {{ t('SPÉCIMEN / EXEMPLE', 'SPECIMEN / SAMPLE') }}
                </div>
              }"""

content = content.replace('            <!-- THE PRINTABLE CERTIFICATE CARD -->\n            <div class="printable-certificate" style="background:#FAF9F6; border: 12px double #1E1B4B; border-radius: 4px; padding: 40px; text-align: center; position: relative; box-shadow: inset 0 0 0 2px #D97706, 0 4px 12px rgba(0,0,0,0.05); overflow:hidden;">', watermark_insert)

# 3. Restrict LinkedIn button to non-specimen mode in actions footer
old_linkedin_button = """              <!-- Share to LinkedIn Button -->
              <button class="btn-p" style="background:#0A66C2; border-color:#0A66C2; display:flex; align-items:center; gap:6px" (click)="shareToLinkedIn(lvl)">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24" style="color:white"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                {{ t('Ajouter à LinkedIn', 'Add to LinkedIn') }}
              </button>"""

new_linkedin_button = """              <!-- Share to LinkedIn Button -->
              @if (!isSpecimen()) {
                <button class="btn-p" style="background:#0A66C2; border-color:#0A66C2; display:flex; align-items:center; gap:6px" (click)="shareToLinkedIn(lvl)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 24 24" style="color:white"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                  {{ t('Ajouter à LinkedIn', 'Add to LinkedIn') }}
                </button>
              }"""

content = content.replace(old_linkedin_button, new_linkedin_button)

# 4. Inject viewSpecimen and isSpecimen signal inside the class properties
# Let's search for selectedCertificate signal.
sig_marker = "selectedCertificate = signal<string | null>(null);"
sig_idx = content.find(sig_marker)

if sig_idx == -1:
    print("Error: selectedCertificate signal not found!")
    exit(1)

insert_pos = sig_idx + len(sig_marker)

injections = """
  isSpecimen = signal<boolean>(false);

  viewSpecimen(level: string) {
    this.selectedCertificate.set(level);
    this.isSpecimen.set(true);
  }
"""

content = content[:insert_pos] + injections + content[insert_pos:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("profile.ts specimen preview successfully updated!")
