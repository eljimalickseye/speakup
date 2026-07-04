import os

profile_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\student\profile.ts'
students_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\teacher\students.ts'

# 1. Update profile.ts
with open(profile_path, 'rb') as f:
    profile_content = f.read().decode('utf-8').replace('\r\n', '\n')

# Replace classes in template
profile_content = profile_content.replace(
    '<div class="modal-overlay" (click)="selectedCertificate.set(null)" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.55); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:99999; padding:16px">',
    '<div class="cert-modal-overlay" (click)="selectedCertificate.set(null)">'
)
profile_content = profile_content.replace(
    '<div class="modal-card" (click)="$event.stopPropagation()" style="background:white; border-radius:16px; max-width:760px; width:100%; padding:24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15)">',
    '<div class="cert-modal-card" (click)="$event.stopPropagation()">'
)

# Add custom component style declarations for screen mode and print mode
old_styles = """    @media (max-width: 768px) {
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
    }"""

new_styles = """    .cert-modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.55);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 99999;
      padding: 16px;
    }
    .cert-modal-card {
      background: white;
      border-radius: 16px;
      max-width: 760px;
      width: 100%;
      padding: 24px;
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15);
    }
    @media (max-width: 768px) {
      .profile-layout {
        grid-template-columns: 1fr !important;
      }
    }
    @media print {
      body * {
        visibility: hidden !important;
      }
      .cert-modal-overlay {
        position: absolute !important;
        left: 0 !important; top: 0 !important;
        background: none !important;
        backdrop-filter: none !important;
      }
      .cert-modal-card {
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
    }"""

profile_content = profile_content.replace(old_styles, new_styles)

with open(profile_path, 'w', encoding='utf-8') as f:
    f.write(profile_content)

print("profile.ts modal centering fixed!")


# 2. Update students.ts
with open(students_path, 'rb') as f:
    students_content = f.read().decode('utf-8').replace('\r\n', '\n')

# Replace add student modal classes in template
students_content = students_content.replace(
    '<div class="modal-overlay" (click)="showAddStudentModal.set(false)" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.4); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; z-index:9999; padding:16px">',
    '<div class="ts-modal-overlay" (click)="showAddStudentModal.set(false)">'
)
students_content = students_content.replace(
    '<div class="modal-card" (click)="$event.stopPropagation()" style="background:white; border-radius:12px; max-width:480px; width:100%; padding:24px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1); border:1px solid var(--border-weak)">',
    '<div class="ts-modal-card" (click)="$event.stopPropagation()">'
)

# Replace teacher preview of student certificate modal classes in template
students_content = students_content.replace(
    '<div class="modal-overlay" (click)="selectedCertificate.set(null); selectedStudentCert.set(null)" style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15,23,42,0.55); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:99999; padding:16px">',
    '<div class="cert-modal-overlay" (click)="selectedCertificate.set(null); selectedStudentCert.set(null)">'
)
students_content = students_content.replace(
    '<div class="modal-card" (click)="$event.stopPropagation()" style="background:white; border-radius:16px; max-width:760px; width:100%; padding:24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15)">',
    '<div class="cert-modal-card" (click)="$event.stopPropagation()">'
)

# Replace style tag definitions in component decorator
old_students_styles = """  styles: [`
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
  `],"""

new_students_styles = """  styles: [`
    .ts-modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; z-index: 9999;
      padding: 16px;
    }
    .ts-modal-card {
      background: white; border-radius: 12px; max-width: 480px; width: 100%;
      padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
      border: 1px solid var(--border-weak);
    }
    .cert-modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.55); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center; z-index: 99999;
      padding: 16px;
    }
    .cert-modal-card {
      background: white; border-radius: 16px; max-width: 760px; width: 100%;
      padding: 24px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15);
    }
    @media print {
      body * {
        visibility: hidden !important;
      }
      .cert-modal-overlay {
        position: absolute !important;
        left: 0 !important; top: 0 !important;
        background: none !important;
        backdrop-filter: none !important;
      }
      .cert-modal-card {
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
  `],"""

students_content = students_content.replace(old_students_styles, new_students_styles)

with open(students_path, 'w', encoding='utf-8') as f:
    f.write(students_content)

print("students.ts modal centering fixed!")
