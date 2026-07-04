import os

file_path = r'c:\Users\PC\Downloads\speak-up2\src\app\components\student\dashboard.ts'

# Load the file content
with open(file_path, 'rb') as f:
    raw_bytes = f.read()

content = raw_bytes.decode('utf-8').replace('\r\n', '\n')

# 1. Locate the placement test template part.
# The template starts with:
#       <!-- PLACEMENT TEST ALERT & MODAL -->
#       @if (!currentUser()?.placementTestTaken) {
# and ends with the closing bracket matching the alert block.
# Let's inspect where it starts and ends in content.

start_marker = "      <!-- PLACEMENT TEST ALERT & MODAL -->"
end_marker = "      <!-- Welcome Banner -->"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print(f"Error: Template markers not found! start={start_idx}, end={end_idx}")
    exit(1)

new_template_block = """      <!-- PLACEMENT TEST ALERT & MODAL -->
      @if (!currentUser()?.placementTestTaken) {
        <div class="card" style="background: linear-gradient(135deg, #EEF2FF 0%, #ECFDF5 100%); border: 1.5px solid #4F46E5; margin-bottom: 24px; padding: 24px; border-radius: 16px; box-shadow: 0 10px 25px rgba(79, 70, 229, 0.05); position: relative; overflow: hidden;">
          <!-- Design details -->
          <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: rgba(79, 70, 229, 0.03); border-radius: 50%;"></div>
          
          <div style="display:flex; justify-content:space-between; align-items:center; gap:20px; flex-wrap:wrap; position: relative; z-index: 1;">
            <div style="flex:1; min-width:250px">
              <span class="badge" style="background:#4F46E5; color:white; font-size:10px; font-weight:800; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing: 0.5px">
                {{ t('Évaluation de Niveau', 'Level Assessment') }}
              </span>
              <div style="display:flex; align-items:center; gap:8px; margin-top:8px">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">
                  <path d="M4.5 16.5c-1.5 1.25-2.5 3.5-2.5 3.5s2.25-1 3.5-2.5" />
                  <path d="M12 9 9 12" />
                  <path d="M13 18H9.3a1.5 1.5 0 0 1-1-.4l-2.4-2.4a1.5 1.5 0 0 1-.4-1V11c0-2 2-4 4-4h2" />
                  <path d="M12 9c2-2 4-2 6 0s2 4 0 6l-3 3" />
                  <path d="M19 5c1.5 1.5 1.5 3.5 0 5s-3.5 1.5-5 0-1.5-3.5 0-5 3.5-1.5 5 0z" />
                </svg>
                <h3 style="font-size:17px; font-weight:850; color:#1E1B4B; margin:0">{{ t('Évaluez votre niveau d\\'anglais !', 'Determine your starting English Level!') }}</h3>
              </div>
              <p style="font-size:13px; color:#475569; margin:6px 0 0 0; line-height: 1.4">
                {{ t('Passez ce test rapide pour évaluer vos compétences (A1, A2, B1, B2) et débloquer les cours correspondants.', 'Take this quick test to evaluate your skills (A1, A2, B1, B2) and unlock matching lessons!') }}
              </p>
            </div>
            <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5; font-size:13px; padding:10px 20px; border-radius:10px; font-weight:700; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);" (click)="startPlacementTest()">
              {{ t('Commencer le test', 'Start Test Now') }}
            </button>
          </div>

          <!-- Active Test Modal Dialog (Upgrade to Glassmorphic design) -->
          @if (showPlacementTest()) {
            <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(15, 23, 42, 0.4); backdrop-filter: blur(8px); display:flex; justify-content:center; align-items:center; z-index:99999; padding:16px">
              <div class="card" style="width:100%; max-width:550px; background:#FFF; border-radius:16px; padding:28px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); border: 1px solid var(--border-weak); animation: scaleUp 0.2s ease-out">
                
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                  <h3 style="font-size:17px; font-weight:800; color:#4F46E5; margin:0; display:flex; align-items:center; gap:8px">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                    {{ t('Test de Niveau', 'Placement Test') }}
                  </h3>
                  <div style="display:flex; align-items:center; gap:12px">
                    <span style="font-size:12px; color:var(--text-muted); font-weight:600">Question {{ currentQuestionIndex() + 1 }} sur {{ placementQuestions().length }}</span>
                    <button (click)="showPlacementTest.set(false)" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:18px; line-height:1; padding:4px; display:flex; align-items:center; justify-content:center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>

                <!-- Glowing Progress Bar -->
                <div style="width:100%; height:8px; background:rgba(0, 0, 0, 0.04); border-radius:10px; margin-bottom:24px; overflow:hidden; border:1.5px solid var(--border-weak)">
                  <div [style.width.%]="((currentQuestionIndex() + 1) / (placementQuestions().length || 1)) * 100" 
                       style="height:100%; background: linear-gradient(90deg, #3B82F6, #10B981); box-shadow: 0 0 8px rgba(59, 130, 246, 0.4); transition:width 0.3s; border-radius:10px"></div>
                </div>

                <!-- Question Body -->
                @if (placementQuestions()[currentQuestionIndex()]; as q) {
                  <div style="display:flex; align-items:flex-start; gap:8px; margin-bottom:20px">
                    <p style="font-size:15px; font-weight:750; color:#1F2937; margin:0; line-height:1.4; flex:1">{{ q.question }}</p>
                    <button (click)="speakQuestion(q.question)"
                            style="background:none; border:none; color:#4F46E5; cursor:pointer; padding:6px; display:flex; align-items:center; border-radius:50%; transition: background 0.2s"
                            onmouseover="this.style.background='rgba(79, 70, 229, 0.1)'"
                            onmouseout="this.style.background='none'"
                            title="Listen to question">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <div style="display:flex; flex-direction:column; gap:12px">
                    @for (opt of q.options; track opt; let oIdx = $index) {
                      <button 
                        class="row" 
                        [style.background]="selectedAnswers()[currentQuestionIndex()] === getOptionLetter(oIdx) ? '#EFF6FF' : '#FFF'"
                        [style.border-color]="selectedAnswers()[currentQuestionIndex()] === getOptionLetter(oIdx) ? '#4F46E5' : 'var(--border)'"
                        [style.box-shadow]="selectedAnswers()[currentQuestionIndex()] === getOptionLetter(oIdx) ? '0 3px 0 #2563EB' : '0 3px 0 #CBD5E1'"
                        style="text-align:left; cursor:pointer; font-weight:700; font-size:13.5px; margin:0; padding:14px; border:2px solid; border-radius:10px; display:flex; width:100%; transition:all 0.1s"
                        onmousedown="this.style.transform='translateY(2px)'; this.style.boxShadow='none'"
                        onmouseup="this.style.transform='translateY(0px)'; this.style.boxShadow=this.style.borderColor==='#4F46E5'?'0 3px 0 #2563EB':'0 3px 0 #CBD5E1'"
                        (click)="selectAnswer(getOptionLetter(oIdx))">
                        <strong style="color:#4F46E5; margin-right:8px; background:rgba(79, 70, 229, 0.08); width:20px; height:20px; border-radius:50%; display:inline-flex; align-items:center; justify-content:center">{{ getOptionLetter(oIdx) }}</strong> {{ opt }}
                      </button>
                    }
                  </div>
                }

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:24px; border-top:1px solid var(--border-weak); padding-top:16px">
                  <button class="btn-s" [disabled]="currentQuestionIndex() === 0" (click)="prevQuestion()">{{ t('Précédent', 'Previous') }}</button>
                  
                  @if (currentQuestionIndex() < placementQuestions().length - 1) {
                    <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5" [disabled]="!selectedAnswers()[currentQuestionIndex()]" (click)="nextQuestion()">{{ t('Suivant', 'Next') }}</button>
                  } @else {
                    <button class="btn-p" style="background:#10B981; border-color:#10B981" [disabled]="!selectedAnswers()[currentQuestionIndex()] || placementQuestions().length === 0" (click)="submitPlacementTest()">{{ t('Soumettre le Test', 'Submit Test') }}</button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }
"""

content = content[:start_idx] + new_template_block + content[end_idx:]

# 2. Add speakQuestion and update submitPlacementTest inside the class code
# Let's search for submitPlacementTest method
submit_marker = "  submitPlacementTest() {"
submit_idx = content.find(submit_marker)

if submit_idx == -1:
    print("Error: submitPlacementTest not found in dashboard.ts!")
    exit(1)

# We can replace the submitPlacementTest implementation to include placementTestAnswers
old_submit_method = """  submitPlacementTest() {
    const questions = this.placementQuestions();
    const answers = this.selectedAnswers();
    let correctCount = 0;
    
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctOption) {
        correctCount++;
      }
    });

    const totalQuestions = questions.length;
    const scorePct = (correctCount / totalQuestions) * 100;
    
    // Calculate level based on score percentage
    let calculatedLevel = 'A1';
    if (scorePct >= 80) calculatedLevel = 'B2';
    else if (scorePct >= 60) calculatedLevel = 'B1';
    else if (scorePct >= 40) calculatedLevel = 'A2';
    
    // Update user profile
    this.db.updateCurrentUserProfile({
      placementTestTaken: true,
      placementTestScore: scorePct,
      level: calculatedLevel
    });

    this.showPlacementTest.set(false);
    this.dialogService.alert(
      'Assessment Complete! 🎉', 
      `Congratulations! You got ${correctCount}/${totalQuestions} answers correct. Your assigned starting level is ${calculatedLevel} — ${this.getLevelName(calculatedLevel)}!`, 
      'success'
    );
  }"""

new_submit_method = """  speakQuestion(text: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }

  submitPlacementTest() {
    const questions = this.placementQuestions();
    const answers = this.selectedAnswers();
    let correctCount = 0;
    
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctOption) {
        correctCount++;
      }
    });

    const totalQuestions = questions.length;
    const scorePct = (correctCount / totalQuestions) * 100;
    
    // Calculate level based on score percentage
    let calculatedLevel = 'A1';
    if (scorePct >= 80) calculatedLevel = 'B2';
    else if (scorePct >= 60) calculatedLevel = 'B1';
    else if (scorePct >= 40) calculatedLevel = 'A2';
    
    // Update user profile with detailed answers
    this.db.updateCurrentUserProfile({
      placementTestTaken: true,
      placementTestScore: scorePct,
      placementTestAnswers: answers,
      level: calculatedLevel
    });

    this.showPlacementTest.set(false);
    this.dialogService.alert(
      'Assessment Complete! 🎉', 
      `Congratulations! You got ${correctCount}/${totalQuestions} answers correct. Your assigned starting level is ${calculatedLevel} — ${this.getLevelName(calculatedLevel)}!`, 
      'success'
    );
  }"""

content = content.replace(old_submit_method, new_submit_method)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("dashboard.ts placement test alert and modal updated successfully!")
