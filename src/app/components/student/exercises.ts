import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatabaseService, Quiz, Exercise, UserProfile, VocabGame } from '../../services/database.service';

interface MatchCard {
  id: number;
  text: string;
  matchId: number;
  type: 'english' | 'french';
  selected: boolean;
  matched: boolean;
  error?: boolean;
}

interface QuestionWithExplanation {
  question: string;
  options: string[];
  correctOption: string;
  explanation?: string;
}

const defaultWordsBank = [
  // Easy
  { word: 'apple', translation: 'pomme', definition: 'A round fruit with red or green skin.', category: 'Food', difficulty: 'easy' },
  { word: 'bread', translation: 'pain', definition: 'A common food made of flour, water, and yeast.', category: 'Food', difficulty: 'easy' },
  { word: 'train', translation: 'train', definition: 'A group of connected vehicles traveling on railways.', category: 'Travel', difficulty: 'easy' },
  { word: 'ticket', translation: 'billet', definition: 'A paper showing you paid for travel or an event.', category: 'Travel', difficulty: 'easy' },
  { word: 'office', translation: 'bureau', definition: 'A room or building where people work.', category: 'Business', difficulty: 'easy' },
  { word: 'meeting', translation: 'réunion', definition: 'An assembly of people for discussion.', category: 'Business', difficulty: 'easy' },
  { word: 'book', translation: 'livre', definition: 'A written or printed work consisting of pages.', category: 'Academic', difficulty: 'easy' },
  { word: 'school', translation: 'école', definition: 'An institution for educating children.', category: 'Academic', difficulty: 'easy' },
  
  // Medium
  { word: 'kitchen', translation: 'cuisine', definition: 'A room where food is prepared and cooked.', category: 'Food', difficulty: 'medium' },
  { word: 'restaurant', translation: 'restaurant', definition: 'A place where people pay to eat cooked meals.', category: 'Food', difficulty: 'medium' },
  { word: 'itinerary', translation: 'itinéraire', definition: 'A planned route or journey.', category: 'Travel', difficulty: 'medium' },
  { word: 'luggage', translation: 'bagages', definition: 'Suitcases and bags for a journey.', category: 'Travel', difficulty: 'medium' },
  { word: 'negotiation', translation: 'négociation', definition: 'Discussion aimed at reaching an agreement.', category: 'Business', difficulty: 'medium' },
  { word: 'company', translation: 'entreprise', definition: 'A commercial business or firm.', category: 'Business', difficulty: 'medium' },
  { word: 'student', translation: 'étudiant', definition: 'A person studying at a school or college.', category: 'Academic', difficulty: 'medium' },
  { word: 'exam', translation: 'examen', definition: 'A formal test of knowledge or proficiency.', category: 'Academic', difficulty: 'medium' },
  
  // Hard
  { word: 'gastronomy', translation: 'gastronomie', definition: 'The practice or art of choosing, cooking, and eating good food.', category: 'Food', difficulty: 'hard' },
  { word: 'delicacy', translation: 'délicatesse / mets délicat', definition: 'A choice or expensive food considered rare or delicious.', category: 'Food', difficulty: 'hard' },
  { word: 'expedition', translation: 'expédition', definition: 'A journey undertaken by a group of people with a particular purpose.', category: 'Travel', difficulty: 'hard' },
  { word: 'wanderlust', translation: 'passion des voyages', definition: 'A strong desire to travel.', category: 'Travel', difficulty: 'hard' },
  { word: 'investment', translation: '%investment% / investissement', definition: 'The investing of money or capital in order to gain profitable returns.', category: 'Business', difficulty: 'hard' },
  { word: 'entrepreneur', translation: 'entrepreneur', definition: 'A person who organizes and operates a business.', category: 'Business', difficulty: 'hard' },
  { word: 'hypothesis', translation: 'hypothèse', definition: 'A proposed explanation made on the basis of limited evidence.', category: 'Academic', difficulty: 'hard' },
  { word: 'curriculum', translation: 'programme scolaire', definition: 'The subjects comprising a course of study.', category: 'Academic', difficulty: 'hard' }
];

@Component({
  selector: 'app-student-exercises',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      @if (activeExercise() === 'list') {
        <!-- LIST VIEW -->

        <!-- Header & Tab Selector -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1.5px solid var(--border-weak); padding-bottom:12px; margin-bottom:24px; flex-wrap:wrap; gap:12px">
          <div>
            <h2 style="font-size:18px; font-weight:800; color:var(--text-primary); margin:0 0 4px 0">Exercices & Quiz</h2>
            <p style="font-size:12px; color:var(--text-secondary); margin:0">Évaluations chronométrées, entraînements oraux/écrits et jeux de vocabulaire.</p>
          </div>
          <div style="display:flex; gap:6px; background:var(--surface-2); padding:4px; border-radius:10px; border: 1px solid var(--border-weak)">
            <button (click)="activeSubTab.set('quizzes')" 
                    style="border:none; padding:8px 16px; border-radius:8px; font-size:12.5px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.2s"
                    [style.background]="activeSubTab() === 'quizzes' ? '#4F46E5' : 'transparent'"
                    [style.color]="activeSubTab() === 'quizzes' ? 'white' : 'var(--text-secondary)'">
              <span>📝</span>
              <span>Quiz ({{ quizzes().length }})</span>
            </button>
            <button (click)="activeSubTab.set('exercises')" 
                    style="border:none; padding:8px 16px; border-radius:8px; font-size:12.5px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.2s"
                    [style.background]="activeSubTab() === 'exercises' ? '#059669' : 'transparent'"
                    [style.color]="activeSubTab() === 'exercises' ? 'white' : 'var(--text-secondary)'">
              <span>🎯</span>
              <span>Exercices ({{ exercises().length }})</span>
            </button>
            <button (click)="activeSubTab.set('games')" 
                    style="border:none; padding:8px 16px; border-radius:8px; font-size:12.5px; font-weight:700; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all 0.2s"
                    [style.background]="activeSubTab() === 'games' ? '#D97706' : 'transparent'"
                    [style.color]="activeSubTab() === 'games' ? 'white' : 'var(--text-secondary)'">
              <span>🎮</span>
              <span>Jeux ({{ vocabGames().length }})</span>
            </button>
          </div>
        </div>

        <!-- ===== SECTION 1: QUIZ ===== -->
        @if (activeSubTab() === 'quizzes') {
          <div style="margin-bottom: 28px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px; padding: 12px 16px; background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%); border-radius: 10px; color: white;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              <div style="flex: 1;">
                <div style="font-size: 14px; font-weight: 800;">Quiz de cours</div>
                <div style="font-size: 10px; opacity: 0.85;">⏱ Évaluations chronométrées • Score immédiat</div>
              </div>
              <span style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 2px 10px; font-size: 12px; font-weight: 700;">{{ quizzes().length }}</span>
            </div>

            <div class="grid2">
              @for (quiz of quizzes(); track quiz.id) {
                <div class="card exercise-card" [class.oral-card]="quiz.type === 'Oral Practice'" (click)="startQuiz(quiz)"
                     style="border-left: 3px solid #4F46E5; cursor: pointer;">
                  <div>
                    <div class="lesson-icon" [style.background]="getQuizThemeBg(quiz.type)" [style.border]="'1px solid ' + getQuizThemeBorder(quiz.type)" style="margin-bottom:12px; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center">
                      @if (quiz.type === 'Oral Practice') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>
                      } @else {
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                      }
                    </div>
                    <div class="card-label" [style.color]="quiz.type === 'Oral Practice' ? '#0D9488' : '#4F46E5'" style="font-weight:700">
                      {{ quiz.type === 'Oral Practice' ? 'Oral Practice' : 'Grammar Quiz' }}
                    </div>
                    <div class="card-value" style="font-size:15px; color:var(--text-primary); font-weight:700; margin-top:4px">{{ quiz.title }}</div>
                    <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0 0">
                      {{ quiz.questions.length }} questions · {{ quiz.timeLimit || 'No limit' }}
                    </p>
                  </div>
                  <div [style.color]="quiz.type === 'Oral Practice' ? '#0D9488' : '#4F46E5'" style="font-size:11px; font-weight:600; margin-top:12px; display:flex; align-items:center; gap:4px">
                    Start Quiz <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-left:4px"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </div>
                </div>
              } @empty {
                <div style="grid-column: 1 / -1; padding: 24px; background: var(--surface-2); border-radius: 8px; border: 1px dashed var(--border); text-align: center; font-size: 12.5px; color: var(--text-secondary);">
                  No quiz published by your teacher yet.
                </div>
              }
            </div>
          </div>
        }

        <!-- ===== SECTION 2: EXERCISES ===== -->
        @if (activeSubTab() === 'exercises') {
          <div style="margin-bottom: 28px;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px; padding: 12px 16px; background: linear-gradient(135deg, #059669 0%, #10B981 100%); border-radius: 10px; color: white;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/><path d="M12 2a5 5 0 0 0-5 5v3.42c0 .35.1.69.28 1l1.44 2.48a1 1 0 0 0 .86.48h8.84a1 1 0 0 0 .86-.48l1.44-2.48c.18-.31.28-.65.28-1V7a5 5 0 0 0-5-5z"/></svg>
              <div style="flex: 1;">
                <div style="font-size: 14px; font-weight: 800;">Entraînements autonomes</div>
                <div style="font-size: 10px; opacity: 0.85;">🏋️ Exercices d'application • À faire à votre rythme</div>
              </div>
              <span style="background: rgba(255,255,255,0.2); border-radius: 12px; padding: 2px 10px; font-size: 12px; font-weight: 700;">{{ exercises().length }}</span>
            </div>

            @if (exercises().length > 0) {
              <div class="grid2">
                @for (ex of exercises(); track ex.id) {
                  <div class="card exercise-card" (click)="openExercise(ex)"
                       [style.border-left]="'3px solid ' + getExerciseColor(ex.type)" style="cursor: pointer;">
                    <div>
                      <div style="margin-bottom:12px; width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center;"
                           [style.background]="getExerciseColor(ex.type) + '15'"
                           [style.border]="'1px solid ' + getExerciseColor(ex.type) + '40'">
                        <span style="font-size: 20px;">{{ getExerciseEmoji(ex.type) }}</span>
                      </div>
                      <div class="card-label" [style.color]="getExerciseColor(ex.type)" style="font-weight: 700;">{{ getExerciseLabel(ex.type) }}</div>
                      <div class="card-value" style="font-size:15px; color:var(--text-primary); font-weight:700; margin-top:4px;">{{ ex.title }}</div>
                      <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0 0;">
                        Level {{ ex.level }} · {{ ex.points }} XP
                      </p>
                    </div>
                    <div [style.color]="getExerciseColor(ex.type)" style="font-size:11px; font-weight:600; margin-top:12px; display:flex; align-items:center; gap:4px">
                      Start <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-left:4px"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div style="padding: 20px; background: var(--surface-2); border-radius: 8px; border: 1px dashed var(--border); text-align: center; font-size: 12.5px; color: var(--text-secondary); margin-bottom: 16px">
                No training exercises published by your teacher yet.
              </div>
            }
          </div>
        }

        <!-- ===== SECTION 3: VOCAB GAMES ===== -->
        @if (activeSubTab() === 'games') {
          <div style="margin-top: 0px; background: #FFFDF5; border: 1.5px solid #FDE68A; border-radius: 16px; padding: 20px; box-shadow: 0 8px 24px rgba(217, 119, 6, 0.04);">
            <div style="font-size: 13px; font-weight: 800; color: #D97706; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 14px; display: flex; align-items: center; gap: 8px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4m-2-2v4m7-2h.01M19 12h.01"/></svg>
              <span>L'Arcade des Jeux de Vocabulaire</span>
            </div>
            
            <div class="grid2">
              @for (game of vocabGames(); track game.id) {
                <div class="card exercise-card game-card" (click)="playVocabGame(game)" 
                     style="border-left: 4px solid #D97706; border-radius: 12px; cursor: pointer; transition: all 0.3s; background: white; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.04); position: relative; overflow: hidden;">
                  <!-- Background glow design element -->
                  <div style="position: absolute; top: -20px; right: -20px; width: 60px; height: 60px; background: rgba(217, 119, 6, 0.05); border-radius: 50%;"></div>
                  
                  <div style="padding: 16px;">
                    <div class="lesson-icon amber" style="margin-bottom:12px; width:44px; height:44px; border-radius:12px; background:#FFFBEB; border:1.5px solid #FDE68A; display:flex; align-items:center; justify-content:center">
                      @if (game.gameType === 'flashcards') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="12" height="18" x="3" y="3" rx="2" /><path d="M7 3V21" /><rect width="12" height="18" x="9" y="3" rx="2" /></svg>
                      } @else if (game.gameType === 'matching') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                      } @else if (game.gameType === 'memory') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-3.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-3.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2Z"/></svg>
                      } @else if (game.gameType === 'word_builder') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                      } @else if (game.gameType === 'hangman') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22V2h10a2 2 0 0 1 2 2v2"/><circle cx="16" cy="9" r="3"/><path d="M16 12v6m-3-3h6m-5 5h4"/></svg>
                      } @else if (game.gameType === 'multiple_choice') {
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/></svg>
                      } @else {
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3" /></svg>
                      }
                    </div>
                    <div style="font-size: 9px; font-weight: 800; color: #B45309; text-transform: uppercase; background: #FEF3C7; padding: 2px 8px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px; letter-spacing: 0.5px;">
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h4m-2-2v4m7-2h.01M19 12h.01"/></svg>
                      Mode Arcade
                    </div>
                    <div class="card-value" style="font-size:14px; color:var(--text-primary); font-weight:700; margin-top:8px; display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden">{{ game.title }}</div>
                    <p style="font-size:11.5px; color:var(--text-secondary); margin:6px 0 0 0">
                      {{ game.words.length }} mots · {{ getGameLabel(game.gameType) }} ({{ getDiffLabel(game.difficulty) }})
                    </p>
                  </div>
                  <div style="font-size:11.5px; color:#D97706; font-weight:700; margin-top:4px; padding: 12px 16px; border-top: 1px solid #FEF3C7; display:flex; align-items:center; gap:4px; background: #FFFDF5;">
                    Lancer la Partie <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </div>
                </div>
              } @empty {
                <div class="card exercise-card game-card" (click)="playDefaultVocabGame()" 
                     style="border-left: 4px solid #D97706; border-radius: 12px; cursor: pointer; transition: all 0.3s; background: white; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.04); position: relative; overflow: hidden;">
                  <div style="position: absolute; top: -20px; right: -20px; width: 60px; height: 60px; background: rgba(217, 119, 6, 0.05); border-radius: 50%;"></div>
                  
                  <div style="padding: 16px;">
                    <div class="lesson-icon amber" style="margin-bottom:12px; width:44px; height:44px; border-radius:12px; background:#FFFBEB; border:1.5px solid #FDE68A; display:flex; align-items:center; justify-content:center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    </div>
                    <div style="font-size: 9px; font-weight: 800; color: #B45309; text-transform: uppercase; background: #FEF3C7; padding: 2px 8px; border-radius: 20px; display: inline-block; letter-spacing: 0.5px;">🎮 Mode Arcade</div>
                    <div class="card-value" style="font-size:14px; color:var(--text-primary); font-weight:700; margin-top:8px">Association de Mots</div>
                    <p style="font-size:11.5px; color:var(--text-secondary); margin:6px 0 0 0">Associez les termes anglais avec leur traduction française.</p>
                  </div>
                  <div style="font-size:11.5px; color:#D97706; font-weight:700; margin-top:4px; padding: 12px 16px; border-top: 1px solid #FEF3C7; display:flex; align-items:center; gap:4px; background: #FFFDF5;">
                    Lancer la Partie <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-left:auto"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Weekly streak widget -->
        <div>
          <div class="section-title" style="display:flex; align-items:center; gap:8px">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
            </svg>
            <span>Practice Streak</span>
          </div>
          <div class="card" style="background:#FFF8F1; border:1px solid #FFE4D6; padding:16px 20px; border-radius:12px; margin-bottom: 0; display:flex; flex-direction:column; gap:14px">
            <div style="display:flex; align-items:center; gap:16px">
              <div style="width:40px; height:40px; animation: bounce-streak 1.5s infinite; display:flex; align-items:center; justify-content:center; color:#EF4444">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                </svg>
              </div>
              <div>
                <div style="font-size:18px; font-weight:700; color:#D97706">{{ currentUser()?.streak || 0 }} Days Streak</div>
                <div style="font-size:12px; color:var(--text-secondary)">Practice every day to keep your streak alive and earn extra XP!</div>
              </div>
            </div>
            
            <!-- Horizontal 7-Day Tracker -->
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%; border-top:1px solid #FFE4D6; padding-top:12px; margin-top:4px">
              @for (day of getWeeklyTrackerDays(); track day.name) {
                <div style="display:flex; flex-direction:column; align-items:center; gap:6px; flex:1">
                  <span style="font-size:9px; font-weight:700; color:#B45309; text-transform:uppercase">{{ day.name }}</span>
                  <div 
                    [style.background]="day.completed ? 'linear-gradient(135deg, #F59E0B, #D97706)' : '#FFF'"
                    [style.border-color]="day.completed ? '#D97706' : '#E2E8F0'"
                    [style.color]="day.completed ? '#FFF' : '#94A3B8'"
                    style="width:28px; height:28px; border-radius:50%; border:2px solid; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; box-shadow: 0 2px 4px rgba(0,0,0,0.02)">
                    @if (day.completed) {
                      <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    } @else {
                      {{ day.letter }}
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Group Vocab Leaderboard Widget -->
        <div style="margin-top: 24px;">
          <div class="section-title" style="display:flex; align-items:center; gap:8px">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8" r="7"></circle>
              <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
            </svg>
            <span>Classement du Groupe (Vocabulaire)</span>
          </div>
          
          <div class="card" style="padding: 0; overflow: hidden; border: 1px solid var(--border-weak); background: #FFF;">
            <div style="background: #FFFDF5; padding: 12px 16px; border-bottom: 1px solid #FDE68A;">
              <span style="font-size: 11.5px; font-weight: 700; color: #B45309;">
                Niveau : {{ currentUser()?.level || 'A1' }} · Meilleurs scores de votre groupe
              </span>
            </div>
            
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                  <tr style="border-bottom: 1px solid var(--border-weak); background: var(--surface-2); text-align: left; color: var(--text-muted); font-weight: 700; font-size: 11px; text-transform: uppercase;">
                    <th style="padding: 10px 16px; width: 60px;">Rang</th>
                    <th style="padding: 10px 16px;">Élève</th>
                    <th style="padding: 10px 16px;">Jeu</th>
                    <th style="padding: 10px 16px; text-align: center;">Score</th>
                    <th style="padding: 10px 16px; text-align: center;">Temps</th>
                    <th style="padding: 10px 16px; text-align: right;">XP</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of vocabLeaderboard(); track row.id; let idx = $index) {
                    <tr [style.background]="row.studentId === currentUser()?.id ? '#FFFDF5' : 'transparent'" 
                        style="border-bottom: 1px solid var(--border-weak); transition: background 0.2s;"
                        onmouseover="this.style.background='var(--surface-2)'"
                        onmouseout="this.style.background=this.getAttribute('data-is-user') === 'true' ? '#FFFDF5' : 'transparent'"
                        [attr.data-is-user]="row.studentId === currentUser()?.id">
                      <td style="padding: 12px 16px; font-weight: 700; text-align: center;">
                        @if (idx === 0) {
                          🥇
                        } @else if (idx === 1) {
                          🥈
                        } @else if (idx === 2) {
                          🥉
                        } @else {
                          #{{ idx + 1 }}
                        }
                      </td>
                      <td style="padding: 12px 16px; font-weight: 600; color: var(--text-primary);">
                        <span style="margin-right: 6px;">{{ row.avatar }}</span>
                        <span>{{ row.studentName }}</span>
                        @if (row.studentId === currentUser()?.id) {
                          <span style="font-size: 9px; background: #D97706; color: #FFF; padding: 2px 6px; border-radius: 10px; margin-left: 6px;">Moi</span>
                        }
                      </td>
                      <td style="padding: 12px 16px; color: var(--text-secondary);">
                        {{ row.gameTitle }}
                      </td>
                      <td style="padding: 12px 16px; font-weight: 700; text-align: center; color: #10B981;">
                        {{ row.score }}%
                      </td>
                      <td style="padding: 12px 16px; text-align: center; color: var(--text-muted);">
                        {{ row.timeSpent }}s
                      </td>
                      <td style="padding: 12px 16px; text-align: right; font-weight: 700; color: #4F46E5;">
                        +{{ row.xp }} XP
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="6" style="padding: 24px; text-align: center; color: var(--text-muted); font-style: italic;">
                        Aucun score enregistré pour ce groupe pour le moment. Jouez pour être le premier !
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      } @else {
        <div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(0,0,0,0.65); display:flex; justify-content:center; align-items:center; z-index:99999; padding:16px">
          <div class="card" style="width:100%; max-width:580px; background:#FFF; border-radius:12px; padding:24px; box-shadow:0 10px 25px rgba(0,0,0,0.25); max-height:90vh; overflow-y:auto">
            
            <!-- Modal Header -->
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; border-bottom:1px solid var(--border-weak); padding-bottom:12px">
              <h3 style="font-size:16px; font-weight:700; color:var(--text-primary); margin:0; display:flex; align-items:center; gap:8px">
                @if (activeExercise() === 'quiz' && activeQuiz()?.type === 'Oral Practice') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2">
                    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" x2="12" y1="19" y2="22" />
                  </svg>
                  <span>Oral Speaking Exercise</span>
                } @else if (activeExercise() === 'quiz') {
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2">
                    <path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  <span>Classroom Quiz</span>
                } @else if (activeExercise() === 'exercise') {
                  <span [style.color]="getExerciseColor(activeExerciseItem()?.type || '')">{{ getExerciseEmoji(activeExerciseItem()?.type || '') }} {{ getExerciseLabel(activeExerciseItem()?.type || '') }} Exercise</span>
                } @else {
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2">
                    <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
                  </svg>
                  <span>Vocabulary Game</span>
                }
              </h3>
              <button (click)="exitExercise()" style="background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px; display:flex; align-items:center; justify-content:center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <!-- EXERCISE OVERLAY -->
            @if (activeExercise() === 'exercise') {
              <div>
                <h4 style="font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0 0 12px 0">
                  {{ activeExerciseItem()?.title }}
                </h4>
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 20px; display: flex; align-items: center; gap: 6px">
                  <span style="background: var(--surface-2); border-radius: 12px; padding: 2px 10px; font-weight: 600;">{{ activeExerciseItem()?.level }}</span>
                  <span style="background: var(--surface-2); border-radius: 12px; padding: 2px 10px; font-weight: 600;">{{ activeExerciseItem()?.points }} XP</span>
                </div>

                @if (!exerciseSubmitted()) {
                  <!-- Writing Exercise -->
                  @if (activeExerciseItem()?.type === 'writing') {
                    <div style="background: #F5F3FF; border: 1px solid #DDD6FE; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
                      <div style="font-size: 13px; font-weight: 700; color: #6D28D9; margin-bottom: 6px;">✍️ Subject</div>
                      <p style="font-size: 13px; color: var(--text-primary); line-height: 1.6; margin: 0;">{{ activeExerciseItem()?.subject }}</p>
                    </div>
                    <textarea [ngModel]="studentResponse()" (ngModelChange)="studentResponse.set($event)" rows="6" placeholder="Write your answer here..."
                              style="width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 12px; font-size: 13px; resize: vertical;"></textarea>
                    <button (click)="submitExerciseResponse()" style="margin-top: 12px; background: #7C3AED; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; cursor: pointer; width: 100%;">Submit</button>
                  }

                  <!-- Speaking Exercise -->
                  @else if (activeExerciseItem()?.type === 'speaking') {
                    <div style="background: #F0FDF4; border: 1px solid #A7F3D0; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
                      <div style="font-size: 13px; font-weight: 700; color: #065F46; margin-bottom: 6px;">🎙️ Speaking Prompt</div>
                      <p style="font-size: 13px; color: var(--text-primary); line-height: 1.6; margin: 0;">{{ activeExerciseItem()?.speakingPrompt }}</p>
                    </div>
                    
                    <!-- Recorder Component -->
                    <div class="card" style="background:#F0FDFA; border:1px dashed #0D9488; border-radius:10px; padding:20px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; margin-bottom:20px">
                      @if (exerciseRecordingState() === 'idle') {
                        <button (click)="startExerciseAudioRecording()" style="width:56px; height:56px; border-radius:50%; background:#0D9488; color:white; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 10px rgba(13,148,136,0.3)">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
                          </svg>
                        </button>
                        <div style="font-size:12.5px; font-weight:700; color:#0F766E">Start Oral Recording</div>
                        <div style="font-size:11px; color:var(--text-muted)">Press the mic, read aloud clearly and answer the prompt</div>
                      } @else if (exerciseRecordingState() === 'recording') {
                        <div style="display:flex; align-items:center; gap:8px">
                          <span class="recording-pulse"></span>
                          <span style="font-size:14px; font-weight:700; color:#EF4444">{{ formatDuration(exerciseRecordSeconds()) }}</span>
                        </div>
                        
                        <!-- Visualizer Waves -->
                        <div style="width:100%; max-width:280px; height:40px; display:flex; align-items:center; justify-content:center; gap:3px">
                          @for (bar of [15, 30, 45, 25, 60, 40, 75, 50, 30, 15]; track bar; let bIdx = $index) {
                            <div [style.height.%]="getVisualizerBarHeight(bIdx)" style="width:5px; background:linear-gradient(to top, #0D9488, #34D399); border-radius:3px; transition:height 0.15s"></div>
                          }
                        </div>

                        <button (click)="stopExerciseAudioRecording()" style="width:48px; height:48px; border-radius:50%; background:#EF4444; color:white; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 10px rgba(239,68,68,0.3)">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
                        </button>
                        <div style="font-size:11.5px; color:var(--text-secondary)">Recording audio... click stop when done</div>
                      } @else if (exerciseRecordingState() === 'finished') {
                        <div style="display:flex; align-items:center; gap:12px; background:#FFF; padding:12px; border-radius:8px; border:1px solid #2DD4BF; width:100%; max-width:360px">
                          <button style="width:34px; height:34px; border-radius:50%; border:none; background:#0D9488; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer" (click)="playExerciseAudioPlayback()">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                          </button>
                          <div style="flex:1">
                            <div style="font-size:12px; font-weight:600; color:var(--text-primary)">speaking_response.wav</div>
                            <div style="font-size:10px; color:var(--text-muted)">Duration: {{ formatDuration(exerciseRecordSeconds()) }}</div>
                          </div>
                          <button (click)="resetExerciseAudioRecording()" style="background:none; border:none; color:#EF4444; font-size:16px; cursor:pointer" title="Record Again">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      }
                    </div>

                    <button (click)="submitExerciseResponse()" [disabled]="exerciseRecordingState() !== 'finished'" 
                            [style.opacity]="exerciseRecordingState() === 'finished' ? 1 : 0.5"
                            style="background: #059669; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; cursor: pointer; width: 100%;">
                      Submit Response
                    </button>
                  }

                  <!-- Listening Exercise -->
                  @else if (activeExerciseItem()?.type === 'listening') {
                    @if (activeExerciseItem()?.youtubeUrl) {
                      <div style="border-radius: 10px; overflow: hidden; margin-bottom: 16px; background: #000; display: flex; align-items: center; justify-content: center; padding: 20px;">
                        <a [href]="activeExerciseItem()?.youtubeUrl" target="_blank" style="color: white; text-decoration: none; display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 14px;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#FF0000"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                          Watch on YouTube
                        </a>
                      </div>
                    }
                    <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
                      <div style="font-size: 13px; font-weight: 700; color: #1E40AF; margin-bottom: 6px;">👂 Instructions</div>
                      <p style="font-size: 13px; color: var(--text-primary); line-height: 1.6; margin: 0;">{{ activeExerciseItem()?.listeningInstruction }}</p>
                    </div>
                    <textarea [ngModel]="studentResponse()" (ngModelChange)="studentResponse.set($event)" rows="4" placeholder="Write your summary or answers here..."
                              style="width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 12px; font-size: 13px; resize: vertical;"></textarea>
                    <button (click)="submitExerciseResponse()" style="margin-top: 12px; background: #0284C7; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; cursor: pointer; width: 100%;">Submit</button>
                  }

                  <!-- Translation Exercise -->
                  @else if (activeExerciseItem()?.type === 'translation') {
                    <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
                      <div style="font-size: 13px; font-weight: 700; color: #92400E; margin-bottom: 6px;">🌍 Text to translate ({{ activeExerciseItem()?.translationDirection === 'fr-en' ? 'FR → EN' : 'EN → FR' }})</div>
                      <p style="font-size: 14px; color: var(--text-primary); line-height: 1.7; margin: 0; font-style: italic;">{{ activeExerciseItem()?.textToTranslate }}</p>
                    </div>
                    <textarea [ngModel]="studentResponse()" (ngModelChange)="studentResponse.set($event)" rows="5" placeholder="Your translation here..."
                              style="width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 12px; font-size: 13px; resize: vertical;"></textarea>
                    <button (click)="submitExerciseResponse()" style="margin-top: 12px; background: #D97706; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; cursor: pointer; width: 100%;">Submit Translation</button>
                  }

                  <!-- Pronunciation Exercise -->
                  @else if (activeExerciseItem()?.type === 'pronunciation') {
                    <div style="text-align: center; padding: 24px; background: #FFF1F2; border: 1px solid #FECDD3; border-radius: 12px; margin-bottom: 16px;">
                      <div style="font-size: 13px; font-weight: 700; color: #9F1239; margin-bottom: 12px;">🔊 Read this aloud:</div>
                      <p style="font-size: 18px; font-weight: 700; color: var(--text-primary); line-height: 1.6; margin: 0;">{{ activeExerciseItem()?.textToPronounce }}</p>
                    </div>

                    <!-- Recorder Component -->
                    <div class="card" style="background:#FFF1F2; border:1px dashed #E11D48; border-radius:10px; padding:20px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; margin-bottom:20px">
                      @if (exerciseRecordingState() === 'idle') {
                        <button (click)="startExerciseAudioRecording()" style="width:56px; height:56px; border-radius:50%; background:#E11D48; color:white; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 10px rgba(225,29,72,0.3)">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
                          </svg>
                        </button>
                        <div style="font-size:12.5px; font-weight:700; color:#9F1239">Start Oral Recording</div>
                        <div style="font-size:11px; color:var(--text-muted)">Press the mic, read aloud clearly and answer the prompt</div>
                      } @else if (exerciseRecordingState() === 'recording') {
                        <div style="display:flex; align-items:center; gap:8px">
                          <span class="recording-pulse"></span>
                          <span style="font-size:14px; font-weight:700; color:#EF4444">{{ formatDuration(exerciseRecordSeconds()) }}</span>
                        </div>
                        
                        <!-- Visualizer Waves -->
                        <div style="width:100%; max-width:280px; height:40px; display:flex; align-items:center; justify-content:center; gap:3px">
                          @for (bar of [15, 30, 45, 25, 60, 40, 75, 50, 30, 15]; track bar; let bIdx = $index) {
                            <div [style.height.%]="getVisualizerBarHeight(bIdx)" style="width:5px; background:linear-gradient(to top, #E11D48, #FDA4AF); border-radius:3px; transition:height 0.15s"></div>
                          }
                        </div>

                        <button (click)="stopExerciseAudioRecording()" style="width:48px; height:48px; border-radius:50%; background:#EF4444; color:white; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 10px rgba(239,68,68,0.3)">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
                        </button>
                        <div style="font-size:11.5px; color:var(--text-secondary)">Recording audio... click stop when done</div>
                      } @else if (exerciseRecordingState() === 'finished') {
                        <div style="display:flex; align-items:center; gap:12px; background:#FFF; padding:12px; border-radius:8px; border:1px solid #FDA4AF; width:100%; max-width:360px">
                          <button style="width:34px; height:34px; border-radius:50%; border:none; background:#E11D48; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer" (click)="playExerciseAudioPlayback()">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                          </button>
                          <div style="flex:1">
                            <div style="font-size:12px; font-weight:600; color:var(--text-primary)">pronunciation_response.wav</div>
                            <div style="font-size:10px; color:var(--text-muted)">Duration: {{ formatDuration(exerciseRecordSeconds()) }}</div>
                          </div>
                          <button (click)="resetExerciseAudioRecording()" style="background:none; border:none; color:#EF4444; font-size:16px; cursor:pointer" title="Record Again">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      }
                    </div>

                    <button (click)="submitExerciseResponse()" [disabled]="exerciseRecordingState() !== 'finished'"
                            [style.opacity]="exerciseRecordingState() === 'finished' ? 1 : 0.5"
                            style="background: #DC2626; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; cursor: pointer; width: 100%;">
                      Submit Response
                    </button>
                  }

                  <!-- Vocabulary Exercise -->
                  @else if (activeExerciseItem()?.type === 'vocabulary') {
                    <div style="background: #EEF2FF; border: 1px solid #C7D2FE; border-radius: 12px; padding: 20px; margin-bottom: 16px; text-align: center;">
                      <div style="font-size: 11px; font-weight: 700; color: #4F46E5; text-transform: uppercase; margin-bottom: 12px;">📚 Flashcard Review Mode</div>
                      
                      @if ((activeExerciseItem()?.wordList || []).length > 0) {
                        @let wList = activeExerciseItem()?.wordList || [];
                        @let curWord = wList[vocabularyActiveIdx() || 0];

                        <div style="background: white; border: 1.5px solid #C7D2FE; border-radius: 10px; padding: 24px; min-height: 120px; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.02)">
                          <div style="font-size: 24px; font-weight: 800; color: #1E1B4B; display: flex; align-items: center; gap: 8px;">
                            <span>{{ curWord }}</span>
                            <button (click)="speakWord(curWord)" style="background:none; border:none; color:#4F46E5; cursor:pointer; padding:4px; display:inline-flex; align-items:center;" title="Listen">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                              </svg>
                            </button>
                          </div>
                          <span style="font-size: 12px; color: var(--text-muted); margin-top: 8px;">Click speaker to pronounce</span>
                        </div>

                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; width: 100%;">
                          <button (click)="vocabularyActiveIdx.set(vocabularyActiveIdx() - 1)" [disabled]="vocabularyActiveIdx() === 0" class="btn-s" style="flex: 1; padding: 8px 12px;">{{ gameLabels().prevBtn }}</button>
                          <span style="font-size: 12px; color: var(--text-muted); font-weight: 600;">{{ (vocabularyActiveIdx() || 0) + 1 }} / {{ wList.length }}</span>
                          @if ((vocabularyActiveIdx() || 0) + 1 < wList.length) {
                            <button (click)="vocabularyActiveIdx.set(vocabularyActiveIdx() + 1)" class="btn-p" style="flex: 1; background: #4F46E5; border-color: #4F46E5; padding: 8px 12px;">Suivant</button>
                          } @else {
                            <button (click)="submitExerciseResponse()" class="btn-p" style="flex: 1; background: #10B981; border-color: #10B981; padding: 8px 12px;">Complete Review</button>
                          }
                        </div>
                      }
                    </div>
                  }
                } @else {
                  <!-- Submitted State -->
                  <div style="text-align: center; padding: 32px 16px;">
                    <div style="font-size: 48px; margin-bottom: 12px;">✅</div>
                    <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px 0;">Exercise Submitted!</h3>
                    <p style="font-size: 13px; color: var(--text-muted); margin: 0 0 20px 0;">+{{ activeExerciseItem()?.points }} XP credited to your account.</p>
                    <button (click)="activeExercise.set('list')" style="background: #059669; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 700; cursor: pointer;">Back to Exercises</button>
                  </div>
                }
              </div>
            }

            <!-- TAB 1: GRAMMAR QUIZ WRAPPER -->
            @if (activeExercise() === 'quiz') {
              @if (activeQuiz(); as quiz) {
                @if (!quizFinished()) {
                  <!-- PROGRESS & INFO -->
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
                    <span style="font-size:12px; font-weight:700; color:var(--text-primary)">{{ quiz.title }}</span>
                    <span style="font-size:11.5px; color:var(--text-muted)">Task {{ currentQuestionIdx() + 1 }} of {{ quiz.questions.length }}</span>
                  </div>

                  <!-- Progress Bar -->
                  <div style="width:100%; height:6px; background:#E5E7EB; border-radius:3px; margin-bottom:20px; overflow:hidden">
                    <div [style.width.%]="((currentQuestionIdx() + 1) / quiz.questions.length) * 100" [style.background]="quiz.type === 'Oral Practice' ? '#0D9488' : '#4F46E5'" style="height:100%; transition:width 0.3s"></div>
                  </div>

                  <!-- Question Text Container -->
                  <div class="card" style="background:var(--surface-2); margin-bottom:16px; border:1px solid var(--border-weak); padding:16px">
                    <p style="font-size:13.5px; font-weight:600; color:var(--text-primary); margin:0; line-height:1.4">
                      {{ quiz.questions[currentQuestionIdx()].question }}
                    </p>
                  </div>

                  @if (quiz.type === 'Oral Practice') {
                    <!-- ORAL SPEAKING RECORDER COMPONENT -->
                    <div class="card" style="background:#F0FDFA; border:1px dashed #0D9488; border-radius:10px; padding:20px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; margin-bottom:20px">
                      @if (recordingState() === 'idle') {
                        <button (click)="startAudioRecording()" style="width:56px; height:56px; border-radius:50%; background:#0D9488; color:white; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 10px rgba(13,148,136,0.3)">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
                          </svg>
                        </button>
                        <div style="font-size:12.5px; font-weight:700; color:#0F766E">Start Oral Recording</div>
                        <div style="font-size:11px; color:var(--text-muted)">Press the mic, read aloud clearly and answer the prompt</div>
                      } @else if (recordingState() === 'recording') {
                        <div style="display:flex; align-items:center; gap:8px">
                          <span class="recording-pulse"></span>
                          <span style="font-size:14px; font-weight:700; color:#EF4444">{{ formatDuration(recordSeconds()) }}</span>
                        </div>
                        
                        <!-- Visualizer Waves -->
                        <div style="width:100%; max-width:280px; height:40px; display:flex; align-items:center; justify-content:center; gap:3px">
                          @for (bar of [15, 30, 45, 25, 60, 40, 75, 50, 30, 15]; track bar; let bIdx = $index) {
                            <div [style.height.%]="getVisualizerBarHeight(bIdx)" style="width:5px; background:linear-gradient(to top, #0D9488, #34D399); border-radius:3px; transition:height 0.15s"></div>
                          }
                        </div>

                        <button (click)="stopAudioRecording()" style="width:48px; height:48px; border-radius:50%; background:#EF4444; color:white; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 10px rgba(239,68,68,0.3)">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
                        </button>
                        <div style="font-size:11.5px; color:var(--text-secondary)">Recording audio... click stop when done</div>
                      } @else if (recordingState() === 'finished') {
                        <!-- Finished voice response options -->
                        <div style="display:flex; align-items:center; gap:12px; background:#FFF; padding:12px; border-radius:8px; border:1px solid #2DD4BF; width:100%; max-width:360px">
                          <button style="width:34px; height:34px; border-radius:50%; border:none; background:#0D9488; color:white; display:flex; align-items:center; justify-content:center; cursor:pointer" (click)="playAudioPlayback()">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                          </button>
                          <div style="flex:1">
                            <div style="font-size:12px; font-weight:600; color:var(--text-primary)">voice_answer_{{ currentQuestionIdx() + 1 }}.wav</div>
                            <div style="font-size:10px; color:var(--text-muted)">Duration: {{ formatDuration(recordSeconds()) }}</div>
                          </div>
                          <button (click)="resetAudioRecording()" style="background:none; border:none; color:#EF4444; font-size:16px; cursor:pointer" title="Record Again">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      }
                    </div>
                  } @else {
                    @if (quiz.type === 'True / False') {
                      <!-- TRUE / FALSE QUIZ OPTIONS -->
                      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:20px">
                        <button class="quiz-option-btn" 
                                [class.active]="selectedOption() === 'A'"
                                (click)="selectedOption.set('A')"
                                style="text-align:center">
                          Vrai (True)
                        </button>
                        <button class="quiz-option-btn" 
                                [class.active]="selectedOption() === 'B'"
                                (click)="selectedOption.set('B')"
                                style="text-align:center">
                          Faux (False)
                        </button>
                      </div>
                    } @else if (quiz.type === 'Essay' || quiz.type === 'written' || quiz.type === 'translation') {
                      <!-- ESSAY / WRITTEN RESPONSES -->
                      <div class="input-row" style="margin-top:0; margin-bottom:20px">
                        <textarea [ngModel]="selectedOption() || ''" 
                                  (ngModelChange)="selectedOption.set($event)"
                                  placeholder="Saisissez votre réponse ici..." 
                                  rows="5" 
                                  style="width:100%; border:1px solid var(--border); border-radius:8px; padding:12px; font-size:13px; background:#FFF; color:var(--text-primary)"></textarea>
                      </div>
                    } @else {
                      <!-- STANDARD MULTIPLE CHOICE OPTIONS -->
                      <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:20px">
                        @for (opt of quiz.questions[currentQuestionIdx()].options; track opt; let idx = $index) {
                          <button class="quiz-option-btn" 
                                  [class.active]="selectedOption() === getOptionLetter(idx)"
                                  (click)="selectedOption.set(getOptionLetter(idx))">
                            <span style="font-weight:700; color:#4F46E5; margin-right:8px">{{ getOptionLetter(idx) }}.</span> {{ opt }}
                          </button>
                        }
                      </div>
                    }
                  }

                  <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-weak); padding-top:16px">
                    <button class="btn-s" [disabled]="currentQuestionIdx() === 0" (click)="prevQuestion(quiz)">Previous</button>
                    
                    @if (quiz.type === 'Oral Practice') {
                      <button class="btn-p" style="background:#0D9488; border-color:#0D9488" (click)="nextOralQuestion(quiz)" [disabled]="recordingState() !== 'finished'">
                        {{ currentQuestionIdx() + 1 === quiz.questions.length ? 'Submit All Answers' : 'Next Question' }}
                      </button>
                    } @else {
                      <button class="btn-p" (click)="nextQuestion(quiz)" [disabled]="!selectedOption()">
                        {{ currentQuestionIdx() + 1 === quiz.questions.length ? 'Submit Quiz' : 'Next Question' }}
                      </button>
                    }
                  </div>
                } @else {
                  <!-- QUIZ RESULTS SCREEN -->
                  <div style="text-align:center; padding:20px 0">
                    <div style="width:64px; height:64px; border-radius:50%; background:#ECFDF5; border:1px solid #10B981; display:flex; align-items:center; justify-content:center; margin:0 auto 16px auto">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </div>
                    
                    <h3 style="font-size:18px; font-weight:800; margin-bottom:6px; color:var(--text-primary)">
                      {{ quiz.type === 'Oral Practice' ? 'Oral Practice Submitted!' : 'Quiz Completed!' }}
                    </h3>
                    
                    @if (quiz.type === 'Oral Practice') {
                      <p style="font-size:13px; color:var(--text-secondary); margin-bottom:16px; max-width:380px; margin-left:auto; margin-right:auto">
                        Your oral audio responses have been sent directly to the teacher for grading review! You will receive a notification once graded.
                      </p>
                      <div style="background:#E6F4EA; padding:8px 16px; border-radius:20px; display:inline-block; font-size:12.5px; font-weight:700; color:#0F766E; margin-bottom:20px">
                        +50 XP Earned
                      </div>
                    } @else {
                      <p style="font-size:13.5px; color:var(--text-secondary); margin-bottom:12px">
                        You scored <strong style="color:#059669">{{ quizScore() }}%</strong> ({{ quizCorrectCount() }} / {{ quiz.questions.length }} correct answers)
                      </p>
                      <div style="background:#EEF2FF; padding:8px 16px; border-radius:20px; display:inline-block; font-size:12.5px; font-weight:700; color:#4F46E5; margin-bottom:20px">
                        +{{ quizScore() >= 60 ? '50' : '10' }} XP Earned
                      </div>
                      
                      <!-- Explanations for wrong answers -->
                      @if (quizScore() < 100) {
                        <div style="margin-top:20px; text-align:left; background:var(--surface-2); border:1px solid var(--border-weak); border-radius:10px; padding:16px; max-width:500px; margin-left:auto; margin-right:auto">
                          <h4 style="font-size:14px; font-weight:700; color:var(--text-primary); margin:0 0 12px 0; display:flex; align-items:center; gap:6px">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                            Corrections & Explications
                          </h4>
                          <div style="display:flex; flex-direction:column; gap:10px">
                            @for (q of quiz.questions; track q; let qi = $index) {
                              @if (getUserAnswer(qi) !== q.correctOption) {
                                <div style="background:#FFF; border:1px solid #FCA5A5; border-radius:8px; padding:10px 12px; border-left:3px solid #EF4444">
                                  <div style="font-size:12px; font-weight:600; color:#991B1B; margin-bottom:4px">
                                    Question {{ qi + 1 }}: {{ q.question }}
                                  </div>
                                  <div style="font-size:11px; color:var(--text-secondary); margin-bottom:3px">
                                    ❌ Votre réponse: <strong style="color:#EF4444">{{ getUserAnswerText(qi) }}</strong>
                                  </div>
                                  <div style="font-size:11px; color:var(--text-secondary); margin-bottom:6px">
                                    ✅ Bonne réponse: <strong style="color:#059669">{{ getCorrectAnswerText(q) }}</strong>
                                  </div>
                                  @if (q.explanation) {
                                    <div style="font-size:11px; color:#4B5563; background:#FEF3C7; padding:6px 8px; border-radius:6px; margin-top:4px; font-style:italic">
                                      💡 {{ q.explanation }}
                                    </div>
                                  }
                                </div>
                              }
                            }
                          </div>
                        </div>
                      }
                    }
                    
                    <div style="display:flex; justify-content:center; border-top:1px solid var(--border-weak); padding-top:16px; margin-top:{{ quizScore() < 100 && quiz.type !== 'Oral Practice' ? '20px' : '0' }}">
                      <button class="btn-p" [style.background]="quiz.type === 'Oral Practice' ? '#0D9488' : '#4F46E5'" [style.border-color]="quiz.type === 'Oral Practice' ? '#0D9488' : '#4F46E5'" (click)="exitExercise()">Close Window</button>
                    </div>
                  </div>
                }
              }
            } @else if (activeExercise() === 'listening') {
              <!-- TAB 3: LISTENING EXERCISE -->
              @if (!listeningFinished()) {
                <div style="margin-bottom:12px">
                  <h3 style="font-size:15px; font-weight:700; color:var(--text-primary); margin:0">👂 Listening Comprehension</h3>
                  <p style="font-size:11.5px; color:var(--text-muted); margin:4px 0 0 0">Listen to the text and answer the questions below.</p>
                </div>

                <!-- Audio Player -->
                <div class="card" style="background:linear-gradient(135deg,#F0FDFA,#E6F4EA); border:1px solid #2DD4BF; padding:20px; margin-bottom:20px; border-radius:10px">
                  <div style="display:flex; align-items:center; gap:16px; margin-bottom:12px">
                    <button (click)="playListeningText()" style="width:56px; height:56px; border-radius:50%; background:#0D9488; color:white; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow:0 4px 10px rgba(13,148,136,0.3)">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </button>
                    <div style="flex:1">
                      <div style="font-size:13px; font-weight:700; color:#0F766E; margin-bottom:4px">Play Audio</div>
                      <div style="font-size:11px; color:var(--text-muted)">Click to listen to the passage</div>
                    </div>
                  </div>
                  
                  <!-- Text Display -->
                  <div style="background:#FFF; padding:14px; border-radius:8px; border:1px solid #2DD4BF; margin-top:10px">
                    <div style="font-size:11px; font-weight:700; color:#0D9488; margin-bottom:6px; text-transform:uppercase">📄 Text to Read Along:</div>
                    <p style="font-size:12.5px; color:var(--text-primary); line-height:1.6; margin:0; font-style:italic">
                      "{{ listeningText() }}"
                    </p>
                  </div>
                </div>

                <!-- Question -->
                <div class="card" style="background:var(--surface-2); margin-bottom:16px; border:1px solid var(--border-weak); padding:16px">
                  <div style="font-size:11px; font-weight:700; color:#4F46E5; margin-bottom:8px; text-transform:uppercase">Question {{ currentListeningIdx() + 1 }} of {{ listeningQuestions().length }}</div>
                  <p style="font-size:13.5px; font-weight:600; color:var(--text-primary); margin:0; line-height:1.4">
                    {{ listeningQuestions()[currentListeningIdx()].question }}
                  </p>
                </div>

                <!-- Options -->
                <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:20px">
                  @for (opt of listeningQuestions()[currentListeningIdx()].options; track opt; let idx = $index) {
                    <button class="quiz-option-btn" 
                            [class.active]="selectedListeningOption() === idx"
                            (click)="selectedListeningOption.set(idx)">
                      <span style="font-weight:700; color:#0D9488; margin-right:8px">{{ getOptionLetter(idx) }}.</span> {{ opt }}
                    </button>
                  }
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border-weak); padding-top:16px">
                  <button class="btn-s" [disabled]="currentListeningIdx() === 0" (click)="prevListeningQuestion()">Previous</button>
                  <button class="btn-p" style="background:#0D9488; border-color:#0D9488" (click)="nextListeningQuestion()" [disabled]="selectedListeningOption() === null">
                    {{ currentListeningIdx() + 1 === listeningQuestions().length ? 'Submit' : 'Next Question' }}
                  </button>
                </div>
              } @else {
                <!-- Listening Results -->
                <div style="text-align:center; padding:20px 0">
                  <div style="width:64px; height:64px; border-radius:50%; background:#F0FDFA; border:1px solid #2DD4BF; display:flex; align-items:center; justify-content:center; margin:0 auto 16px auto">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0D9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" x2="12" y1="19" y2="22" />
                    </svg>
                  </div>
                  
                  <h3 style="font-size:17px; font-weight:800; color:var(--text-primary); margin-bottom:6px">Listening Exercise Complete! 🎧</h3>
                  <p style="font-size:13px; color:var(--text-secondary); margin-bottom:16px">
                    You scored <strong style="color:#0D9488">{{ listeningScore() }}%</strong> ({{ roundNumber(listeningScore() / 100 * listeningQuestions().length) }} / {{ listeningQuestions().length }} correct)
                  </p>
                  <div style="background:#E6F4EA; padding:8px 16px; border-radius:20px; display:inline-block; font-size:12.5px; font-weight:700; color:#0F766E; margin-bottom:20px">
                    +{{ listeningScore() >= 60 ? '50' : '10' }} XP Earned
                  </div>
                  <div style="display:flex; justify-content:center; border-top:1px solid var(--border-weak); padding-top:16px">
                    <button class="btn-p" style="background:#0D9488; border-color:#0D9488" (click)="exitExercise()">Close Window</button>
                  </div>
                </div>
              }
            } @else if (activeExercise() === 'game') {
               <!-- TAB 2: VOCABULARY MATCH GAME -->
               @if (isConfiguring()) {
                 <!-- CONFIGURATION SCREEN -->
                 <div style="padding: 10px 0; animation: fadeIn 0.25s ease-out;">
                   <h3 style="font-size: 18px; font-weight: 800; color: var(--text-primary); margin: 0 0 6px 0; text-align: center; display: flex; align-items: center; justify-content: center; gap: 8px;">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                       <circle cx="12" cy="12" r="3"></circle>
                       <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                     </svg>
                     <span>{{ gameLabels().configTitle }}</span>
                   </h3>
                   <p style="font-size: 12.5px; color: var(--text-secondary); margin: 0 0 20px 0; text-align: center;">
                     {{ gameLabels().configDesc }}
                   </p>

                   <!-- Difficulty Selection -->
                   <div style="margin-bottom: 20px;">
                     <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                       Difficulté
                     </label>
                     <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                       @for (diff of difficultyLevels; track diff) {
                         <button (click)="selectedConfigDifficulty.set(diff)"
                                 [style.background]="selectedConfigDifficulty() === diff ? '#FFF9E6' : '#FFF'"
                                 [style.border-color]="selectedConfigDifficulty() === diff ? '#D97706' : 'var(--border)'"
                                 [style.color]="selectedConfigDifficulty() === diff ? '#B45309' : 'var(--text-primary)'"
                                 style="padding: 10px; border-radius: 8px; border: 1.5px solid; font-size: 13px; font-weight: 700; cursor: pointer; text-align: center; transition: all 0.2s;">
                           {{ getDiffLabel(diff) }}
                         </button>
                       }
                     </div>
                   </div>

                   <!-- Category Selection -->
                   <div style="margin-bottom: 20px;">
                     <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                       Catégorie
                     </label>
                     <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                       @for (cat of getAvailableCategories(); track cat) {
                         <button (click)="selectedConfigCategory.set(cat)"
                                 [style.background]="selectedConfigCategory() === cat ? '#EFF6FF' : '#FFF'"
                                 [style.border-color]="selectedConfigCategory() === cat ? '#4F46E5' : 'var(--border)'"
                                 [style.color]="selectedConfigCategory() === cat ? '#1E40AF' : 'var(--text-primary)'"
                                 style="padding: 6px 12px; border-radius: 20px; border: 1.5px solid; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                           {{ cat }}
                         </button>
                       }
                     </div>
                   </div>

                   <!-- Timer Selection -->
                   <div style="margin-bottom: 24px;">
                     <label style="display: block; font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                       Limite de Temps (par mot)
                     </label>
                     <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
                       @for (t of ['No limit', '15s', '30s', '60s']; track t) {
                         <button (click)="selectedConfigTimer.set(t)"
                                 [style.background]="selectedConfigTimer() === t ? '#ECFDF5' : '#FFF'"
                                 [style.border-color]="selectedConfigTimer() === t ? '#10B981' : 'var(--border)'"
                                 [style.color]="selectedConfigTimer() === t ? '#065F46' : 'var(--text-primary)'"
                                 style="padding: 10px 4px; border-radius: 8px; border: 1.5px solid; font-size: 12px; font-weight: 700; cursor: pointer; text-align: center; transition: all 0.2s;">
                           {{ t === 'No limit' ? gameLabels().noLimitOption : t }}
                         </button>
                       }
                     </div>
                   </div>

                   <!-- Start Button -->
                   <button (click)="startGameWithConfig()"
                           style="width: 100%; padding: 14px; background: linear-gradient(135deg, #F59E0B, #D97706); color: white; border: none; border-radius: 8px; font-size: 15px; font-weight: 800; cursor: pointer; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.25); display: flex; align-items: center; justify-content: center; gap: 8px;">
                     <span>{{ gameLabels().startGameBtn }}</span>
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                       <polygon points="5 3 19 12 5 21 5 3"></polygon>
                     </svg>
                   </button>
                 </div>
               } @else if (!gameFinished()) {
                  <div style="margin-bottom:16px">
                    <h3 style="font-size:15px; font-weight:700; color:var(--text-primary); margin:0">{{ activeVocabGame()?.title || 'Jeu de vocabulaire' }}</h3>
                    <span class="badge" style="background:#FFF9E6; color:#D97706; font-size:10px; font-weight:700; text-transform:uppercase; padding:3px 8px; border-radius:20px; display:inline-block; margin-top:4px">
                      {{ getGameLabel(activeVocabGame()?.gameType || 'matching') }}
                    </span>
                  </div>

                  <!-- Timer Countdown Visualizer -->
                  @if (timerLimit() > 0) {
                    <div style="margin-bottom: 14px; padding: 4px 0;">
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: 11px; font-weight: 700; color: #EF4444; display: flex; align-items: center; gap: 4px;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                          </svg>
                          {{ gameLabels().timeLeftLabel }} : {{ secondsLeft() }}s
                        </span>
                      </div>
                      <div style="width: 100%; height: 6px; background: #F3F4F6; border-radius: 3px; overflow: hidden; border: 1px solid var(--border-weak);">
                        <div [style.width.%]="(secondsLeft() / timerLimit()) * 100"
                             [style.background]="secondsLeft() < 5 ? '#EF4444' : '#10B981'"
                             style="height: 100%; transition: width 1s linear;">
                        </div>
                      </div>
                    </div>
                  }

                  @if (activeVocabGame()?.gameType === 'matching') {
                    <!-- Cards Grid (Association) -->
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:20px">
                      @for (card of gameCards(); track card.id) {
                        <button class="vocab-match-card" 
                                [class.selected]="card.selected"
                                [class.matched]="card.matched"
                                [class.error]="card.error"
                                [style.pointer-events]="card.matched ? 'none' : 'auto'"
                                style="border: 1.5px solid var(--border); border-radius: 12px; padding: 14px; background: var(--surface-1); color: var(--text-primary); font-weight: 600; font-size: 13px; min-height: 64px; cursor: pointer; display: flex; align-items: center; justify-content: center; position: relative; transition: all 0.2s ease-in-out; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);"
                                [style.border-color]="card.matched ? '#10B981' : (card.error ? '#EF4444' : (card.selected ? '#D97706' : 'var(--border)'))"
                                [style.background]="card.matched ? '#ECFDF5' : (card.error ? '#FEF2F2' : (card.selected ? '#FEF3C7' : 'var(--surface-1)'))"
                                [style.color]="card.matched ? '#065F46' : (card.error ? '#991B1B' : (card.selected ? '#92400E' : 'var(--text-primary)'))"
                                (click)="selectCard(card)">
                          <div style="display:flex; flex-direction:column; align-items:center; gap:6px; justify-content:center; width:100%">
                            <div style="display:flex; align-items:center; gap:6px; justify-content:center;">
                              @if (card.matched) {
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              } @else if (card.error) {
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              }
                              <span>{{ card.text }}</span>
                            </div>
                            @if (card.type === 'english' && !card.matched) {
                              <button (click)="speakWord(card.text); $event.stopPropagation()"
                                      style="background:rgba(217, 119, 6, 0.08); border:none; color:#D97706; cursor:pointer; padding:3px 8px; display:inline-flex; align-items:center; gap:4px; border-radius:12px; font-size:10px; font-weight:700; transition: background 0.2s;"
                                      onmouseover="this.style.background='rgba(217, 119, 6, 0.15)'"
                                      onmouseout="this.style.background='rgba(217, 119, 6, 0.08)'"
                                      [title]="t('Prononcer le mot anglais', 'Pronounce the English word')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                </svg>
                                {{ gameLabels().listenBtn }}
                              </button>
                            }
                          </div>
                        </button>
                      }
                    </div>
                  }

                  @if (activeVocabGame()?.gameType === 'memory') {
                    <!-- MEMORY INTERFACE -->
                    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap:10px; margin-bottom:20px">
                      @for (card of gameCards(); track card.id) {
                        <div style="perspective: 1000px; height: 90px; cursor: pointer;"
                             [style.pointer-events]="(card.matched || card.selected) ? 'none' : 'auto'"
                             (click)="selectCard(card)">
                          
                          <div [style.transform]="(card.selected || card.matched) ? 'rotateY(180deg)' : 'none'"
                               style="width:100%; height:100%; position:relative; transform-style:preserve-3d; transition: transform 0.4s; border-radius:10px; box-shadow:0 4px 8px rgba(0,0,0,0.05)">
                            
                            <!-- Card Back (Hidden/Face down) -->
                            <div style="position:absolute; width:100%; height:100%; backface-visibility:hidden; background:linear-gradient(135deg, #4F46E5 0%, #3730A3 100%); border:1.5px solid #4F46E5; border-radius:10px; display:flex; align-items:center; justify-content:center; color:white;">
                              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                              </svg>
                            </div>

                            <!-- Card Front (Revealed) -->
                            <div style="position:absolute; width:100%; height:100%; backface-visibility:hidden; background:#FFF; border:2px solid #E2E8F0; border-radius:10px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:8px; transform:rotateY(180deg);"
                                 [style.border-color]="card.matched ? '#10B981' : (card.error ? '#EF4444' : '#4F46E5')"
                                 [style.background]="card.matched ? '#ECFDF5' : (card.error ? '#FEF2F2' : '#FFF')">
                              
                              <div style="font-size:11.5px; font-weight:700; text-align:center; display:flex; flex-direction:column; align-items:center; gap:4px; justify-content:center; width:100%"
                                   [style.color]="card.matched ? '#065F46' : (card.error ? '#991B1B' : '#1E1B4B')">
                                <span style="word-break: break-word; line-height: 1.2;">{{ card.text }}</span>
                                @if (card.type === 'english') {
                                  <button (click)="speakWord(card.text); $event.stopPropagation()" 
                                          style="background:rgba(79, 70, 229, 0.06); border:none; color:#4F46E5; cursor:pointer; padding:2px 6px; display:inline-flex; align-items:center; gap:2px; border-radius:8px; font-size:9px; font-weight:700; margin-top:2px;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                    </svg>
                                    {{ gameLabels().listenBtn }}
                                  </button>
                                }
                              </div>
                            </div>

                          </div>
                        </div>
                      }
                    </div>
                  }

                  @if (activeVocabGame()?.gameType === 'flashcards') {
                    <!-- FLASHCARDS INTERFACE -->
                    <div style="display:flex; flex-direction:column; align-items:center; gap:20px; width:100%">
                      <div style="font-size:12px; color:var(--text-muted)">{{ gameLabels().cardCounter(currentCardIdx() + 1, activeWords().length) }}</div>
                      
                      <div (click)="flipCard()" 
                           style="width:100%; max-width:360px; height:220px; perspective: 1000px; cursor:pointer">
                        <div [style.transform]="isFlipped() ? 'rotateY(180deg)' : 'none'"
                             style="width:100%; height:100%; position:relative; transform-style:preserve-3d; transition: transform 0.4s; border-radius:12px; box-shadow:0 8px 20px rgba(0,0,0,0.06)">
                          
                          <!-- Front (English) -->
                          <div style="position:absolute; width:100%; height:100%; backface-visibility:hidden; background:linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%); border:1.5px solid #4F46E5; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px">
                            <span style="font-size:10px; font-weight:700; color:#4F46E5; text-transform:uppercase; letter-spacing:1px">Anglais</span>
                            <div style="display:flex; align-items:center; gap:8px; margin-top:8px">
                              <h2 style="font-size:26px; font-weight:800; color:#1E1B4B; margin:0; text-align:center">{{ activeWords()?.[currentCardIdx()]?.word }}</h2>
                              <button (click)="speakWord(activeWords()?.[currentCardIdx()]?.word); $event.stopPropagation()"
                                      style="background:none; border:none; color:#4F46E5; cursor:pointer; padding:6px; display:flex; align-items:center; border-radius:50%; transition: background 0.2s;"
                                      onmouseover="this.style.background='rgba(79, 70, 229, 0.1)'"
                                      onmouseout="this.style.background='none'"
                                      [title]="t('Prononcer le mot anglais', 'Pronounce the English word')">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                                </svg>
                              </button>
                            </div>
                            <p style="font-size:11px; color:#4F46E5; margin-top:20px; display:flex; align-items:center; gap:4px">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px"><path d="M21.5 2v6h-6"></path><path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path></svg> Cliquer pour retourner
                            </p>
                          </div>
                          
                          <!-- Back (French & Definition) -->
                          <div style="position:absolute; width:100%; height:100%; backface-visibility:hidden; background:#FFF; border:1.5px solid #E2E8F0; border-radius:12px; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; transform:rotateY(180deg)">
                            <span style="font-size:10px; font-weight:700; color:#059669; text-transform:uppercase; letter-spacing:1px">Français</span>
                            <h2 style="font-size:24px; font-weight:800; color:#065F46; margin:8px 0 4px 0; text-align:center">{{ activeWords()?.[currentCardIdx()]?.translation }}</h2>
                            @if (activeWords()?.[currentCardIdx()]?.definition) {
                              <p style="font-size:12px; color:var(--text-secondary); text-align:center; max-width:280px; margin:8px 0 12px 0; line-height:1.4">
                                {{ activeWords()?.[currentCardIdx()]?.definition }}
                              </p>
                            }
                            
                            <!-- Flashcard Interactive revision buttons -->
                            <div style="display:flex; gap:10px; margin-top:10px;" (click)="$event.stopPropagation()">
                              <button (click)="markFlashcardResult(true)"
                                      style="padding: 8px 16px; border-radius: 20px; border: none; background: #10B981; color: white; font-size: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 6px rgba(16,185,129,0.15);">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                {{ t('Je savais', 'I knew it') }}
                              </button>
                              <button (click)="markFlashcardResult(false)"
                                      style="padding: 8px 16px; border-radius: 20px; border: none; background: #EF4444; color: white; font-size: 12px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 4px 6px rgba(239,68,68,0.15);">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                {{ t('À réviser', 'To review') }}
                              </button>
                            </div>
                          </div>
                          
                        </div>
                      </div>

                      <div style="display:flex; justify-content:space-between; width:100%; max-width:360px; margin-top:12px">
                        <button class="btn-s" [disabled]="currentCardIdx() === 0" (click)="prevFlashcard()">{{ gameLabels().prevBtn }}</button>
                        <button class="btn-p" style="background:#4F46E5; border-color:#4F46E5" (click)="nextFlashcard()">
                          {{ currentCardIdx() + 1 === activeWords().length ? gameLabels().finishBtn : gameLabels().nextBtn }}
                        </button>
                      </div>
                    </div>
                  }

                  @if (activeVocabGame()?.gameType === 'word_builder') {
                    <!-- WORD BUILDER INTERFACE -->
                    <div style="display:flex; flex-direction:column; align-items:center; gap:20px; width:100%">
                      <div style="font-size:12px; color:var(--text-muted)">{{ gameLabels().wordCounter(wordBuilderIdx() + 1, activeWords().length) }}</div>
                      
                      <div style="background:var(--surface-2); padding:16px; border-radius:8px; border:1px solid var(--border-weak); text-align:center; width:100%">
                        <span style="font-size:10px; font-weight:700; color:#D97706; text-transform:uppercase">{{ gameLabels().translateWordPrompt }}</span>
                        <h3 style="font-size:18px; font-weight:800; margin:4px 0 0 0; color:var(--text-primary); display:flex; align-items:center; justify-content:center; gap:8px;">
                          <span>{{ activeWords()?.[wordBuilderIdx()]?.translation }}</span>
                          <button (click)="speakWord(activeWords()?.[wordBuilderIdx()]?.word)"
                                  style="background:none; border:none; color:#D97706; cursor:pointer; padding:4px; display:inline-flex; align-items:center;"
                                  [title]="t('Prononcer le mot anglais', 'Pronounce the English word')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            </svg>
                          </button>
                        </h3>
                        @if (activeWords()?.[wordBuilderIdx()]?.definition) {
                          <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0 0; line-height:1.4">
                            {{ activeWords()?.[wordBuilderIdx()]?.definition }}
                          </p>
                        }
                      </div>

                      <!-- Spelled word letters slot -->
                      <div style="display:flex; gap:8px; flex-wrap:wrap; min-height:48px; border-bottom:2px dashed var(--border); padding-bottom:12px; width:100%; justify-content:center">
                        @for (char of selectedLetters(); track $index; let sIdx = $index) {
                          <button (click)="clickSelectedLetter(char, sIdx)"
                                  style="width:40px; height:40px; border-radius:8px; border:2px solid #3B82F6; background:#EFF6FF; color:#1D4ED8; font-size:17px; font-weight:800; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow: 0 3px 0 #2563EB; transition: all 0.1s;"
                                  onmousedown="this.style.transform='translateY(2px)'; this.style.boxShadow='0 1px 0 #2563EB'"
                                  onmouseup="this.style.transform='translateY(0px)'; this.style.boxShadow='0 3px 0 #2563EB'">
                            {{ char | uppercase }}
                          </button>
                        }
                      </div>

                      <!-- Scrambled pool options -->
                      <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center">
                        @for (char of scrambledLetters(); track $index; let scrIdx = $index) {
                          <button (click)="clickScrambledLetter(char, scrIdx)"
                                  style="width:40px; height:40px; border-radius:8px; border:2px solid #E2E8F0; background:white; color:#334155; font-size:17px; font-weight:800; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow: 0 3px 0 #CBD5E1; transition: all 0.1s;"
                                  onmousedown="this.style.transform='translateY(2px)'; this.style.boxShadow='0 1px 0 #CBD5E1'"
                                  onmouseup="this.style.transform='translateY(0px)'; this.style.boxShadow='0 3px 0 #CBD5E1'">
                            {{ char | uppercase }}
                          </button>
                        }
                      </div>

                      <button class="btn-s" style="margin-top:10px; display:inline-flex; align-items:center; gap:6px;" (click)="resetWordBuilder()">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                        {{ gameLabels().resetBtn }}
                      </button>
                    </div>
                  }

                  @if (activeVocabGame()?.gameType === 'hangman') {
                    <!-- HANGMAN INTERFACE -->
                    <div style="display:flex; flex-direction:column; align-items:center; gap:16px; width:100%">
                      <div style="font-size:12px; color:var(--text-muted)">{{ gameLabels().wordCounter(hangmanIdx() + 1, activeWords().length) }}</div>

                      <div style="background:var(--surface-2); padding:16px; border-radius:8px; border:1px solid var(--border-weak); text-align:center; width:100%">
                        <span style="font-size:10px; font-weight:700; color:#EF4444; text-transform:uppercase">{{ gameLabels().definitionTranslationPrompt }}</span>
                        <h3 style="font-size:18px; font-weight:800; margin:4px 0 0 0; color:var(--text-primary); display:flex; align-items:center; justify-content:center; gap:8px;">
                          <span>{{ activeWords()?.[hangmanIdx()]?.translation }}</span>
                          <button (click)="speakWord(activeWords()?.[hangmanIdx()]?.word)"
                                  style="background:none; border:none; color:#EF4444; cursor:pointer; padding:4px; display:inline-flex; align-items:center;"
                                  [title]="t('Prononcer le mot anglais', 'Pronounce the English word')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                            </svg>
                          </button>
                        </h3>
                        @if (activeWords()?.[hangmanIdx()]?.definition) {
                          <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0 0; line-height:1.4">
                            {{ activeWords()?.[hangmanIdx()]?.definition }}
                          </p>
                        }
                      </div>

                      <!-- SVG Hangman Gallows and Stick Figure -->
                      <svg width="120" height="120" viewBox="0 0 100 100" style="margin: 10px 0;">
                        <!-- Gallows (always visible) -->
                        <line x1="15" y1="95" x2="55" y2="95" stroke="var(--text-primary)" stroke-width="4" stroke-linecap="round" />
                        <line x1="30" y1="95" x2="30" y2="10" stroke="var(--text-primary)" stroke-width="4" stroke-linecap="round" />
                        <line x1="30" y1="10" x2="65" y2="10" stroke="var(--text-primary)" stroke-width="4" stroke-linecap="round" />
                        <line x1="65" y1="10" x2="65" y2="25" stroke="var(--text-primary)" stroke-width="3" stroke-linecap="round" />
                        <line x1="30" y1="25" x2="45" y2="10" stroke="var(--text-primary)" stroke-width="3" stroke-linecap="round" />

                        <!-- Head (lives <= 5) -->
                        @if (hangmanLives() <= 5) {
                          <circle cx="65" cy="33" r="8" fill="none" stroke="#EF4444" stroke-width="3.5" />
                        }
                        <!-- Body (lives <= 4) -->
                        @if (hangmanLives() <= 4) {
                          <line x1="65" y1="41" x2="65" y2="65" stroke="#EF4444" stroke-width="3.5" stroke-linecap="round" />
                        }
                        <!-- Left Arm (lives <= 3) -->
                        @if (hangmanLives() <= 3) {
                          <line x1="65" y1="48" x2="50" y2="40" stroke="#EF4444" stroke-width="3" stroke-linecap="round" />
                        }
                        <!-- Right Arm (lives <= 2) -->
                        @if (hangmanLives() <= 2) {
                          <line x1="65" y1="48" x2="80" y2="40" stroke="#EF4444" stroke-width="3" stroke-linecap="round" />
                        }
                        <!-- Left Leg (lives <= 1) -->
                        @if (hangmanLives() <= 1) {
                          <line x1="65" y1="65" x2="52" y2="82" stroke="#EF4444" stroke-width="3" stroke-linecap="round" />
                        }
                        <!-- Right Leg (lives <= 0) -->
                        @if (hangmanLives() <= 0) {
                          <line x1="65" y1="65" x2="78" y2="82" stroke="#EF4444" stroke-width="3" stroke-linecap="round" />
                          <!-- Dead eyes inside head -->
                          <line x1="62" y1="31" x2="64" y2="33" stroke="#EF4444" stroke-width="1.5" />
                          <line x1="64" y1="31" x2="62" y2="33" stroke="#EF4444" stroke-width="1.5" />
                          <line x1="66" y1="31" x2="68" y2="33" stroke="#EF4444" stroke-width="1.5" />
                          <line x1="68" y1="31" x2="66" y2="33" stroke="#EF4444" stroke-width="1.5" />
                        }
                      </svg>

                      <!-- Lives Counter -->
                      <div style="font-size:13px; font-weight:700; color:#EF4444; display:flex; align-items:center; gap:6px">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                        </svg>
                        <span>{{ gameLabels().livesLeftLabel }} : {{ hangmanLives() }} / 6</span>
                      </div>

                      <!-- Underscore placeholder word displays -->
                      <div style="font-size:26px; font-weight:800; letter-spacing:8px; color:#1E1B4B; margin:16px 0; text-align:center; text-transform:uppercase">
                        {{ getHangmanWordDisplay() }}
                      </div>

                      <!-- A-Z keyboard buttons -->
                      <div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:6px; max-width:360px">
                        @for (letter of ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z']; track letter) {
                          <button [disabled]="hangmanGuesses().includes(letter)"
                                  (click)="guessHangmanLetter(letter)"
                                  style="width:38px; height:38px; border-radius:8px; border:2px solid #E2E8F0; font-size:14px; font-weight:800; cursor:pointer; text-transform:uppercase; transition: all 0.2s;"
                                  [style.background]="hangmanGuesses().includes(letter) ? '#F1F5F9' : 'white'"
                                  [style.border-color]="hangmanGuesses().includes(letter) ? '#E2E8F0' : '#E2E8F0'"
                                  [style.color]="hangmanGuesses().includes(letter) ? '#94A3B8' : '#334155'"
                                  [style.box-shadow]="hangmanGuesses().includes(letter) ? 'none' : '0 2px 0 #E2E8F0'">
                            {{ letter }}
                          </button>
                        }
                      </div>

                    </div>
                  }

                  @if (activeVocabGame()?.gameType === 'multiple_choice') {
                    <!-- MULTIPLE CHOICE GAME INTERFACE -->
                    <div style="display:flex; flex-direction:column; gap:16px; width:100%">
                      <div style="font-size:12px; color:var(--text-muted); text-align:center">{{ gameLabels().questionCounter(mcGameIdx() + 1, activeWords().length) }}</div>

                      <div style="background:var(--surface-2); padding:16px; border-radius:8px; border:1px solid var(--border-weak); text-align:center; width:100%">
                        @if (hasDefinitionOrContext(activeWords()?.[mcGameIdx()])) {
                          <span style="font-size:10px; font-weight:700; color:#4F46E5; text-transform:uppercase">{{ gameLabels().completeSentencePrompt }}</span>
                          <h3 style="font-size:18px; font-weight:800; margin:4px 0 0 0; color:var(--text-primary)">
                            {{ getMCQuestionPhrase(activeWords()?.[mcGameIdx()]) }}
                          </h3>
                          <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0 0; line-height:1.4">
                            Traduction : {{ activeWords()?.[mcGameIdx()]?.translation }}
                          </p>
                        } @else {
                          <span style="font-size:10px; font-weight:700; color:#4F46E5; text-transform:uppercase">{{ gameLabels().definitionTranslationPrompt }}</span>
                          <h3 style="font-size:18px; font-weight:800; margin:4px 0 0 0; color:var(--text-primary)">
                            {{ activeWords()?.[mcGameIdx()]?.translation }}
                          </h3>
                          @if (activeWords()?.[mcGameIdx()]?.definition) {
                            <p style="font-size:12px; color:var(--text-secondary); margin:6px 0 0 0; line-height:1.4">
                              {{ activeWords()?.[mcGameIdx()]?.definition }}
                            </p>
                          }
                        }
                      </div>

                      <!-- Choices Buttons with speaker icons next to options -->
                      <div style="display:flex; flex-direction:column; gap:10px">
                        @for (opt of mcOptions(); track opt; let optIdx = $index) {
                          <div style="display:flex; align-items:center; gap:8px; width:100%">
                            <button (click)="selectMCOption(opt)"
                                    [disabled]="mcSelected() !== null"
                                    style="flex:1; padding:14px; border-radius:10px; border:2px solid var(--border); font-size:13.5px; font-weight:700; text-align:left; cursor:pointer; display:flex; align-items:center; transition: all 0.2s;"
                                    [style.background]="mcSelected() === opt ? (mcIsCorrect() ? '#ECFDF5' : '#FEF2F2') : (mcSelected() !== null && opt === activeWords()?.[mcGameIdx()]?.word ? '#ECFDF5' : '#FFF')"
                                    [style.border-color]="mcSelected() === opt ? (mcIsCorrect() ? '#10B981' : '#EF4444') : (mcSelected() !== null && opt === activeWords()?.[mcGameIdx()]?.word ? '#10B981' : 'var(--border)')"
                                    [style.color]="mcSelected() === opt ? (mcIsCorrect() ? '#065F46' : '#991B1B') : (mcSelected() !== null && opt === activeWords()?.[mcGameIdx()]?.word ? '#065F46' : 'var(--text-primary)')">
                              
                              <div style="width:24px; height:24px; border-radius:50%; background:rgba(79, 70, 229, 0.08); color:#4F46E5; font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center; margin-right:12px; flex-shrink:0;"
                                   [style.background]="mcSelected() === opt ? (mcIsCorrect() ? '#10B981' : '#EF4444') : (mcSelected() !== null && opt === activeWords()?.[mcGameIdx()]?.word ? '#10B981' : 'rgba(79, 70, 229, 0.08)')"
                                   [style.color]="(mcSelected() === opt || (mcSelected() !== null && opt === activeWords()?.[mcGameIdx()]?.word)) ? '#FFF' : '#4F46E5'">
                                {{ ['A', 'B', 'C', 'D'][optIdx] }}
                              </div>

                              <span style="flex:1;">{{ opt }}</span>

                              @if (mcSelected() === opt) {
                                @if (mcIsCorrect()) {
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-left:8px;"><polyline points="20 6 9 17 4 12"/></svg>
                                } @else {
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-left:8px;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                }
                              } @else if (mcSelected() !== null && opt === activeWords()?.[mcGameIdx()]?.word) {
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0; margin-left:8px;"><polyline points="20 6 9 17 4 12"/></svg>
                              }
                            </button>
                            <button (click)="speakWord(opt); $event.stopPropagation()"
                                    style="background:none; border:none; color:#4F46E5; cursor:pointer; padding:6px; display:flex; align-items:center; border-radius:50%; transition: background 0.2s;"
                                    onmouseover="this.style.background='rgba(79, 70, 229, 0.1)'"
                                    onmouseout="this.style.background='none'"
                                    [title]="t('Prononcer', 'Pronounce')">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                              </svg>
                            </button>
                          </div>
                        }
                      </div>
                    </div>
                  }
} @else {
                 <!-- Detailed Game Results Overlay -->
                 <div style="text-align:center; padding:10px 0; animation: fadeIn 0.3s ease-out;">
                   <div style="width:64px; height:64px; border-radius:50%; background:#FEF3C7; border:2px solid #F59E0B; display:flex; align-items:center; justify-content:center; margin:0 auto 16px auto; box-shadow: 0 4px 10px rgba(245, 158, 11, 0.2);">
                     <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                       <circle cx="12" cy="8" r="7"></circle>
                       <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
                     </svg>
                   </div>
                   
                   <h3 style="font-size:18px; font-weight:800; color:var(--text-primary); margin-bottom:4px">
                     {{ gameLabels().resultsTitle }}
                   </h3>
                   <p style="font-size:12.5px; color:var(--text-secondary); margin-bottom:20px">
                     {{ gameLabels().resultsDesc }} <strong>{{ activeVocabGame()?.title }}</strong>
                   </p>

                   <!-- Grid stats -->
                   <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; margin-bottom:20px;">
                     
                     <div style="background:#F9FAFB; border:1px solid var(--border-weak); border-radius:8px; padding:12px; display:flex; flex-direction:column; align-items:center;">
                       <span style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">{{ gameLabels().successRateLabel }}</span>
                       <span [style.color]="gameSuccessRate() >= 60 ? '#10B981' : '#EF4444'" style="font-size:20px; font-weight:800;">
                         {{ gameSuccessRate() }}%
                       </span>
                       <span style="font-size:11px; color:var(--text-secondary);">
                         ({{ gameCorrectCount() }} / {{ activeWords().length }} {{ t('correct', 'correct') }})
                       </span>
                     </div>

                     <div style="background:#F9FAFB; border:1px solid var(--border-weak); border-radius:8px; padding:12px; display:flex; flex-direction:column; align-items:center;">
                       <span style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">{{ gameLabels().errorsLabel }}</span>
                       <span [style.color]="gameMistakesCount() > 0 ? '#EF4444' : '#10B981'" style="font-size:20px; font-weight:800;">
                         {{ gameMistakesCount() }}
                       </span>
                       <span style="font-size:11px; color:var(--text-secondary);">{{ gameLabels().errorsBadge }}</span>
                     </div>

                     <div style="background:#F9FAFB; border:1px solid var(--border-weak); border-radius:8px; padding:12px; display:flex; flex-direction:column; align-items:center;">
                       <span style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">{{ gameLabels().timeSpentLabel }}</span>
                       <span style="font-size:20px; font-weight:800; color:var(--text-primary);">
                         {{ gameTimeSpent() }}s
                       </span>
                       <span style="font-size:11px; color:var(--text-secondary);">{{ gameLabels().timeSpentBadge }}</span>
                     </div>

                     <div style="background:#F9FAFB; border:1px solid var(--border-weak); border-radius:8px; padding:12px; display:flex; flex-direction:column; align-items:center;">
                       <span style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">{{ gameLabels().xpEarnedLabel }}</span>
                       <span style="font-size:20px; font-weight:800; color:#4F46E5;">
                         +{{ gameXPRewarded() }} XP
                       </span>
                       <span style="font-size:11px; color:var(--text-secondary);">{{ gameLabels().xpEarnedBadge }}</span>
                     </div>

                   </div>

                   <!-- Badges Section -->
                   @if (gameBadges().length > 0) {
                     <div style="margin-bottom:24px;">
                       <h4 style="font-size:12px; font-weight:700; color:var(--text-primary); text-transform:uppercase; margin:0 0 10px 0; text-align:left;">
                         {{ gameLabels().badgesEarnedLabel }}
                       </h4>
                       <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-start;">
                         @for (badge of gameBadges(); track badge) {
                           <div style="background:#FFFDF5; border:1px solid #FDE68A; padding:6px 12px; border-radius:20px; display:flex; align-items:center; gap:6px; font-size:12px; font-weight:700; color:#B45309; box-shadow:0 2px 4px rgba(217, 119, 6, 0.05);">
                             @if (badge === 'Perfect Score') {
                               <span>🏆 Perfect Score</span>
                             } @else if (badge === 'Tenacity') {
                               <span>🪙 Tenacity</span>
                             } @else if (badge === 'Speedy Finisher') {
                               <span>⚡ Speedy Finisher</span>
                             } @else {
                               <span>🏅 {{ badge }}</span>
                             }
                           </div>
                         }
                       </div>
                     </div>
                   }

                   <!-- Action buttons -->
                   <div style="display:flex; flex-direction:column; gap:10px; border-top:1px solid var(--border-weak); padding-top:16px; margin-top:16px;">
                     
                     @if (gameMistakesCount() > 0) {
                       <button (click)="replayMistakenWords()"
                               style="width: 100%; padding: 12px; background: #DC2626; color: white; border: none; border-radius: 8px; font-size: 13.5px; font-weight:800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 10px rgba(220, 38, 38, 0.2); transition: all 0.2s;">
                         <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                           <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                         </svg>
                         <span>{{ gameLabels().reviewMistakesBtn(gameMistakesCount()) }}</span>
                       </button>
                     }
                     
                     <button class="btn-p" style="background:#D97706; border-color:#D97706; width:100%; margin:0;" (click)="exitExercise()">
                       Quitter
                     </button>
                   </div>
                 </div>
               }
            }

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .recording-pulse {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #EF4444;
      display: inline-block;
      animation: pulse-red 1s infinite;
    }
    @keyframes pulse-red {
      0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
      100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }

    .exercise-card {
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      margin: 0;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid var(--border-weak);
    }
    
    .exercise-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 20px -8px rgba(79, 70, 229, 0.12);
      border-color: #4F46E5;
    }
    
    .exercise-card.game-card:hover {
      box-shadow: 0 12px 20px -8px rgba(217, 119, 6, 0.15);
      border-color: #D97706;
    }
    
    .exercise-card.oral-card:hover {
      box-shadow: 0 12px 20px -8px rgba(13, 148, 136, 0.15);
      border-color: #0D9488;
    }

    .quiz-option-btn {
      width: 100%;
      border: 1px solid var(--border);
      background: var(--surface-1);
      padding: 12px 16px;
      border-radius: 8px;
      text-align: left;
      cursor: pointer;
      font-weight: 500;
      font-size: 13px;
      color: var(--text-primary);
      transition: all 0.2s ease-in-out;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .quiz-option-btn:hover {
      background: var(--surface-2);
      border-color: #4F46E5;
      transform: translateX(4px);
    }
    
    .quiz-option-btn.active {
      background: #EFF6FF;
      border-color: #4F46E5;
      color: #1E40AF;
      box-shadow: 0 4px 10px rgba(79, 70, 229, 0.08);
    }

    .vocab-match-card {
      border: 1px solid var(--border);
      background: var(--surface-1);
      color: var(--text-primary);
      padding: 14px;
      text-align: center;
      font-weight: 600;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 55px;
      margin: 0;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s ease-in-out;
    }
    
    .vocab-match-card:hover:not(.matched) {
      transform: translateY(-2px);
      border-color: #D97706;
      box-shadow: 0 4px 10px rgba(217, 119, 6, 0.08);
    }
    
    .vocab-match-card.selected {
      background: #FEF3C7;
      border-color: #D97706;
      color: #92400E;
      transform: translateY(-2px);
    }
    
    .vocab-match-card.matched {
      background: #DCFCE7;
      border-color: #86EFAC;
      color: #166534;
      opacity: 0.8;
      cursor: not-allowed;
    }
    
    .vocab-match-card.error {
      background: #FEE2E2;
      border-color: #FCA5A5;
      color: #991B1B;
      animation: shake 0.4s ease-in-out;
    }
    
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-4px); }
      75% { transform: translateX(4px); }
    }

    @keyframes bounce-streak {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
  `]
})
export class StudentExercisesComponent {
  private db = inject(DatabaseService);

  activeLang = this.db.activeLang;

  t(fr: string, en: string): string {
    return this.activeLang() === 'fr' ? fr : en;
  }

  gameLabels = computed(() => ({
    configTitle: this.t("Configuration du Jeu", "Game Configuration"),
    configDesc: this.t("{{ gameLabels().configDesc }}", "Customize your game session before starting!"),
    difficultyLabel: this.t("Difficulté", "Difficulty"),
    categoryLabel: this.t("Catégorie", "Category"),
    timerLabel: this.t("Limite de Temps (par mot)", "Time Limit (per word)"),
    noLimitOption: this.t("Aucune", "No limit"),
    startGameBtn: this.t("Commencer le Jeu", "Start Game"),
    timeLeftLabel: this.t("Temps restant", "Time remaining"),
    livesLeftLabel: this.t("Vies restantes", "Lives remaining"),
    resetBtn: this.t("Réinitialiser", "Reset"),
    prevBtn: this.t("Précédent", "Previous"),
    nextBtn: this.t("Suivant", "Next"),
    finishBtn: this.t("Terminer", "Finish"),
    cardCounter: (curr: number, total: number) => this.t(`Carte ${curr} sur ${total}`, `Card ${curr} of ${total}`),
    wordCounter: (curr: number, total: number) => this.t(`Mot ${curr} sur ${total}`, `Word ${curr} of ${total}`),
    questionCounter: (curr: number, total: number) => this.t(`Question ${curr} sur ${total}`, `Question ${curr} of ${total}`),
    translateWordPrompt: this.t("Traduire le mot :", "Translate the word:"),
    completeSentencePrompt: this.t("Complétez la phrase :", "Complete the sentence:"),
    definitionTranslationPrompt: this.t("Définition / Traduction :", "Definition / Translation:"),
    listenBtn: this.t("Écouter", "Listen"),
    wordMatchHint: this.t("Cliquer pour retourner", "Click to flip"),
    resultsTitle: this.t("{{ gameLabels().resultsTitle }}", "Session Finished! 🎉"),
    resultsDesc: this.t("{{ gameLabels().resultsDesc }}", "Here are your detailed results for:"),
    successRateLabel: this.t("Réussite", "Success Rate"),
    errorsLabel: this.t("Erreurs", "Mistakes"),
    errorsBadge: this.t("fautes relevées", "mistakes found"),
    timeSpentLabel: this.t("Temps Écoulé", "Time Spent"),
    timeSpentBadge: this.t("secondes passées", "seconds spent"),
    xpEarnedLabel: this.t("XP Remportés", "XP Earned"),
    xpEarnedBadge: this.t("ajoutés au profil", "added to profile"),
    badgesEarnedLabel: this.t("{{ gameLabels().badgesEarnedLabel }}", "Badges Earned 🎖️"),
    reviewMistakesBtn: (count: number) => this.t(`Réviser les erreurs (${count} mots)`, `Review mistakes (${count} words)`),
    exitBtn: this.t("Quitter", "Exit")
  }));

  activeExercise = signal<'list' | 'quiz' | 'game' | 'listening' | 'exercise'>('list');
  activeSubTab = signal<'quizzes' | 'exercises' | 'games'>('quizzes');
  // Teacher exercises
  exercises = signal<Exercise[]>([]);
  activeExerciseItem = signal<Exercise | null>(null);
  studentResponse = signal<string>('');
  exerciseSubmitted = signal<boolean>(false);
  
  // Exercise Recording States
  exerciseRecordingState = signal<'idle' | 'recording' | 'finished'>('idle');
  exerciseRecordSeconds = signal<number>(0);
  exerciseAudioFile = signal<string | null>(null);
  vocabularyActiveIdx = signal<number>(0);

  quizzes = signal<Quiz[]>([]);
  activeQuiz = signal<Quiz | null>(null);
  currentUser = signal<UserProfile | null>(null);
  
  // Listening Exercise States
  listeningText = signal<string>('');
  listeningAudioUrl = signal<string>('');
  listeningQuestions = signal<{ question: string; options: string[]; correct: number }[]>([]);
  currentListeningIdx = signal<number>(0);
  selectedListeningOption = signal<number | null>(null);
  listeningFinished = signal<boolean>(false);
  listeningScore = signal<number>(0);

  // Quiz States
  currentQuestionIdx = signal<number>(0);
  selectedOption = signal<string | null>(null);
  quizFinished = signal<boolean>(false);
  quizCorrectCount = signal<number>(0);
  quizScore = signal<number>(0);

  // Oral / Speaking Exercise States
  recordingState = signal<'idle' | 'recording' | 'finished'>('idle');
  recordSeconds = signal<number>(0);
  private timerInterval: any = null;
  private animInterval: any = null;
  visualizerHeights = signal<number[]>([15, 30, 45, 25, 60, 40, 75, 50, 30, 15]);
  recordedFiles = signal<{ [key: number]: string }>({}); // questionIdx -> base64

  // Game States
  gameCards = signal<MatchCard[]>([]);
  selectedCard = signal<MatchCard | null>(null);
  matchesFound = signal<number>(0);
  gameFinished = signal<boolean>(false);

  vocabGames = signal<VocabGame[]>([]);
  activeVocabGame = signal<VocabGame | null>(null);

  // Flashcards state
  currentCardIdx = signal<number>(0);
  isFlipped = signal<boolean>(false);

  // Memory state
  memoryFlippedIds = signal<number[]>([]);
  
  // Word Builder state
  scrambledLetters = signal<string[]>([]);
  selectedLetters = signal<string[]>([]);
  wordBuilderIdx = signal<number>(0);

  // Hangman state
  hangmanIdx = signal<number>(0);
  hangmanGuesses = signal<string[]>([]);
  hangmanLives = signal<number>(6);

  // Multiple Choice Game state
  mcGameIdx = signal<number>(0);
  mcOptions = signal<string[]>([]);
  mcSelected = signal<string | null>(null);
  mcIsCorrect = signal<boolean | null>(null);

  // --- NEW VOCABULARY GAME STATES ---
  isConfiguring = signal<boolean>(false);
  selectedVocabGame = signal<VocabGame | null>(null);
  
  difficultyLevels: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
  selectedConfigDifficulty = signal<'easy' | 'medium' | 'hard'>('easy');
  selectedConfigCategory = signal<string>('All');
  selectedConfigTimer = signal<string>('No limit');

  secondsLeft = signal<number>(0);
  timerLimit = signal<number>(0);
  wordTimerInterval: any = null;

  originalWordsList = signal<any[]>([]);
  activeWords = signal<any[]>([]);
  sessionMistakes = signal<any[]>([]);
  gameStartTime = 0;

  // Leaderboard state
  vocabLeaderboard = signal<any[]>([]);

  // Detailed scores
  gameTimeSpent = signal<number>(0);
  gameXPRewarded = signal<number>(0);
  gameBadges = signal<string[]>([]);
  gameCorrectCount = signal<number>(0);
  gameMistakesCount = signal<number>(0);
  gameSuccessRate = signal<number>(0);

  constructor() {
    this.db.observeQuizzes().subscribe(list => this.quizzes.set(list));
    this.db.observeCurrentUser().subscribe(u => {
      this.currentUser.set(u);
      this.loadLeaderboard();
    });
    this.db.observeVocabGames().subscribe(list => this.vocabGames.set(list));
    this.db.observeExercises().subscribe(list => this.exercises.set(list.filter(e => e.status === 'published')));
  }

  playSuccessSound() {
    if (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined') {
      try {
        const ctx = new (AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } catch (e) {
        console.warn('AudioContext failed:', e);
      }
    }
  }

  playErrorSound() {
    if (typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined') {
      try {
        const ctx = new (AudioContext || (window as any).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, ctx.currentTime);
        osc.frequency.setValueAtTime(110, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } catch (e) {
        console.warn('AudioContext failed:', e);
      }
    }
  }

  getWeeklyTrackerDays() {
    const days = [
      { name: 'Mon', letter: 'M', completed: false },
      { name: 'Tue', letter: 'T', completed: false },
      { name: 'Wed', letter: 'W', completed: false },
      { name: 'Thu', letter: 'T', completed: false },
      { name: 'Fri', letter: 'F', completed: false },
      { name: 'Sat', letter: 'S', completed: false },
      { name: 'Sun', letter: 'S', completed: false }
    ];
    
    const streak = this.currentUser()?.streak || 0;
    const todayIndex = (new Date().getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    for (let i = 0; i < 7; i++) {
      if (i === todayIndex) {
        days[i].completed = true;
      } else if (i < todayIndex && todayIndex - i < streak) {
        days[i].completed = true;
      }
    }
    return days;
  }

  getQuizThemeBg(type: string): string {
    return type === 'Oral Practice' ? '#E6F4F1' : '#EEF2FF';
  }

  getQuizThemeBorder(type: string): string {
    return type === 'Oral Practice' ? '#99F6E4' : '#C7D2FE';
  }

  openExercise(ex: Exercise) {
    this.activeExerciseItem.set(ex);
    this.studentResponse.set('');
    this.exerciseSubmitted.set(false);
    this.vocabularyActiveIdx.set(0);
    this.resetExerciseAudioRecording();
    this.activeExercise.set('exercise');
  }

  // --- Exercise Audio Recording ---
  startExerciseAudioRecording() {
    this.exerciseRecordingState.set('recording');
    this.exerciseRecordSeconds.set(0);
    this.exerciseAudioFile.set(null);
    
    this.timerInterval = setInterval(() => {
      this.exerciseRecordSeconds.set(this.exerciseRecordSeconds() + 1);
    }, 1000);

    this.animInterval = setInterval(() => {
      const fresh = this.visualizerHeights().map(() => Math.floor(Math.random() * 70) + 15);
      this.visualizerHeights.set(fresh);
    }, 150);
  }

  stopExerciseAudioRecording() {
    clearInterval(this.timerInterval);
    clearInterval(this.animInterval);
    this.exerciseRecordingState.set('finished');
    const simulatedAudioData = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    this.exerciseAudioFile.set(simulatedAudioData);
  }

  resetExerciseAudioRecording() {
    clearInterval(this.timerInterval);
    clearInterval(this.animInterval);
    this.exerciseRecordingState.set('idle');
    this.exerciseRecordSeconds.set(0);
    this.exerciseAudioFile.set(null);
  }

  playExerciseAudioPlayback() {
    this.speakWord("Playing back your recorded voice response for the training exercise");
  }

  getYoutubeEmbedUrl(url: string): string {
    if (!url) return '';
    const match = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  }

  getExerciseColor(type: string): string {
    const map: Record<string, string> = {
      writing: '#7C3AED', speaking: '#059669', listening: '#0284C7',
      translation: '#D97706', pronunciation: '#DC2626', vocabulary: '#4F46E5'
    };
    return map[type] || '#6B7280';
  }

  getExerciseEmoji(type: string): string {
    const map: Record<string, string> = {
      writing: '✍️', speaking: '🎙️', listening: '👂',
      translation: '🌍', pronunciation: '🔊', vocabulary: '📚'
    };
    return map[type] || '🎯';
  }

  getExerciseLabel(type: string): string {
    const map: Record<string, string> = {
      writing: 'Writing', speaking: 'Speaking', listening: 'Listening',
      translation: 'Translation', pronunciation: 'Pronunciation', vocabulary: 'Vocabulary'
    };
    return map[type] || type;
  }

  async submitExerciseResponse() {
    const ex = this.activeExerciseItem();
    if (!ex) return;

    let type: 'text' | 'audio' | 'video' = 'text';
    let content = '';

    if (ex.type === 'writing' || ex.type === 'listening' || ex.type === 'translation') {
      content = this.studentResponse();
      if (!content.trim()) return;
      type = 'text';
    } else if (ex.type === 'speaking' || ex.type === 'pronunciation') {
      content = this.exerciseAudioFile() || 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
      type = 'audio';
    } else if (ex.type === 'vocabulary') {
      content = `Vocabulary theme "${ex.theme || ''}" reviewed and completed.`;
      type = 'text';
    }

    this.exerciseSubmitted.set(true);

    const user = this.currentUser();
    if (user) {
      this.db.updateUserXP(user.id, (ex.points || 20));
    }
    await this.db.submitHomework(ex.id, `[Exercise] ${ex.title}`, type, content, ex.points);
  }

  startQuiz(quiz: Quiz) {
    this.activeQuiz.set(quiz);
    this.activeExercise.set('quiz');
    this.currentQuestionIdx.set(0);
    this.selectedOption.set(null);
    this.quizFinished.set(false);
    this.quizCorrectCount.set(0);
    this.quizScore.set(0);
    this.recordedFiles.set({});
    this.resetAudioRecording();
  }

  startExercise(type: 'quiz' | 'game') {
    this.activeExercise.set(type);
    if (type === 'quiz') {
      this.currentQuestionIdx.set(0);
      this.selectedOption.set(null);
      this.quizFinished.set(false);
      this.quizCorrectCount.set(0);
      this.quizScore.set(0);
    } else if (type === 'game') {
      this.matchesFound.set(0);
      this.gameFinished.set(false);
      this.selectedCard.set(null);
      this.setupGameCards();
    }
  }

  playVocabGame(game: VocabGame) {
    this.selectedVocabGame.set(game);
    this.activeVocabGame.set(game);
    this.selectedConfigDifficulty.set(game.difficulty || 'easy');
    this.selectedConfigCategory.set(game.category || 'All');
    this.selectedConfigTimer.set('No limit');
    this.isConfiguring.set(true);
    this.activeExercise.set('game');
  }

  playDefaultVocabGame() {
    const defaultGame = this.getDefaultVocabGameObj();
    this.selectedVocabGame.set(defaultGame);
    this.activeVocabGame.set(defaultGame);
    this.selectedConfigDifficulty.set('easy');
    this.selectedConfigCategory.set('All');
    this.selectedConfigTimer.set('No limit');
    this.isConfiguring.set(true);
    this.activeExercise.set('game');
  }

  exitExercise() {
    this.activeExercise.set('list');
    this.activeQuiz.set(null);
    this.resetAudioRecording();
    this.stopWordTimer();
  }

  startGameWithConfig() {
    this.isConfiguring.set(false);
    this.gameFinished.set(false);
    this.matchesFound.set(0);
    this.selectedCard.set(null);
    this.sessionMistakes.set([]);
    this.gameStartTime = Date.now();

    // 1. Determine base word list
    const game = this.selectedVocabGame();
    let words = game && game.id !== 'default' ? [...game.words] : [...defaultWordsBank];

    // 2. Apply Category filter (Food, Travel, Business, etc.)
    const category = this.selectedConfigCategory();
    if (category !== 'All') {
      words = words.filter(w => {
        const wCat = (w as any).category || game?.category;
        return wCat && wCat.toLowerCase() === category.toLowerCase();
      });
    }

    // 3. Apply Difficulty filter
    const difficulty = this.selectedConfigDifficulty();
    if (game && game.id !== 'default') {
      // For teacher games, limit words count based on difficulty
      if (difficulty === 'easy') {
        words = words.slice(0, Math.min(words.length, 4));
      } else if (difficulty === 'medium') {
        words = words.slice(0, Math.min(words.length, 6));
      }
    } else {
      // For default bank, match difficulty field
      words = words.filter(w => (w as any).difficulty === difficulty);
    }

    // Fallback if empty
    if (words.length === 0) {
      words = game && game.id !== 'default' ? [...game.words] : [...defaultWordsBank];
    }

    this.originalWordsList.set(words);
    this.activeWords.set(words);

    // 4. Parse timer limit
    const timerVal = this.selectedConfigTimer();
    const gameType = game ? game.gameType : 'matching';
    let limit = 0;
    if (timerVal === '15s') limit = 15;
    else if (timerVal === '30s') limit = 30;
    else if (timerVal === '60s') limit = 60;

    if (limit > 0 && (gameType === 'matching' || gameType === 'memory')) {
      this.timerLimit.set(limit * words.length);
    } else {
      this.timerLimit.set(limit);
    }

    // 5. Initialize Game Type
    this.currentCardIdx.set(0);
    this.isFlipped.set(false);
    this.memoryFlippedIds.set([]);
    this.wordBuilderIdx.set(0);
    this.hangmanIdx.set(0);
    this.hangmanGuesses.set([]);
    this.hangmanLives.set(6);
    this.mcGameIdx.set(0);
    this.mcSelected.set(null);
    this.mcIsCorrect.set(null);

    if (gameType === 'matching' || gameType === 'memory') {
      this.setupGameCards();
    } else if (gameType === 'word_builder') {
      this.setupWordBuilder(0);
    } else if (gameType === 'hangman') {
      this.setupHangman(0);
    } else if (gameType === 'multiple_choice') {
      this.setupMCGame(0);
    }

    this.startWordTimer();
  }

  getAvailableCategories() {
    const list = new Set(['All', 'Food', 'Travel', 'Business', 'Academic', 'General']);
    this.vocabGames().forEach(g => {
      if (g.category) list.add(g.category);
    });
    return Array.from(list);
  }

  getDefaultVocabGameObj(): VocabGame {
    return {
      id: 'default',
      title: 'Word Match (Association)',
      gameType: 'matching',
      difficulty: 'easy',
      category: 'General',
      authorId: 'system',
      createdAt: new Date().toISOString(),
      words: defaultWordsBank
    };
  }

  startWordTimer() {
    this.stopWordTimer();
    if (this.timerLimit() === 0) return;

    this.secondsLeft.set(this.timerLimit());
    this.wordTimerInterval = setInterval(() => {
      this.secondsLeft.update(s => s - 1);
      if (this.secondsLeft() <= 0) {
        this.stopWordTimer();
        this.handleTimerExpired();
      }
    }, 1000);
  }

  stopWordTimer() {
    if (this.wordTimerInterval) {
      clearInterval(this.wordTimerInterval);
      this.wordTimerInterval = null;
    }
  }

  handleTimerExpired() {
    const game = this.activeVocabGame();
    const type = game ? game.gameType : 'matching';
    
    if (type === 'matching' || type === 'memory') {
      this.gameCards().forEach(c => {
        if (!c.matched) {
          const wordText = c.type === 'english' ? c.text : '';
          const wordObj = this.activeWords().find(w => w.word === wordText);
          if (wordObj) this.recordMistake(wordObj);
        }
      });
      this.gameFinished.set(true);
      this.finishVocabGame();
    } else if (type === 'flashcards') {
      const currentWordObj = this.activeWords()[this.currentCardIdx()];
      this.recordMistake(currentWordObj);
      this.nextFlashcard();
    } else if (type === 'word_builder') {
      const currentWordObj = this.activeWords()[this.wordBuilderIdx()];
      this.recordMistake(currentWordObj);
      setTimeout(() => {
        if (this.wordBuilderIdx() + 1 === this.activeWords().length) {
          this.gameFinished.set(true);
          this.finishVocabGame();
        } else {
          this.wordBuilderIdx.update(i => i + 1);
          this.setupWordBuilder(this.wordBuilderIdx());
          this.startWordTimer();
        }
      }, 1000);
    } else if (type === 'hangman') {
      const currentWordObj = this.activeWords()[this.hangmanIdx()];
      this.recordMistake(currentWordObj);
      setTimeout(() => {
        if (this.hangmanIdx() + 1 === this.activeWords().length) {
          this.gameFinished.set(true);
          this.finishVocabGame();
        } else {
          this.hangmanIdx.update(i => i + 1);
          this.setupHangman(this.hangmanIdx());
          this.startWordTimer();
        }
      }, 1000);
    } else if (type === 'multiple_choice') {
      const currentWordObj = this.activeWords()[this.mcGameIdx()];
      this.recordMistake(currentWordObj);
      this.mcSelected.set('TIMED_OUT');
      this.mcIsCorrect.set(false);
      setTimeout(() => {
        if (this.mcGameIdx() + 1 === this.activeWords().length) {
          this.gameFinished.set(true);
          this.finishVocabGame();
        } else {
          this.mcGameIdx.update(i => i + 1);
          this.setupMCGame(this.mcGameIdx());
          this.startWordTimer();
        }
      }, 1000);
    }
  }

  finishVocabGame() {
    this.stopWordTimer();
    const timeSpent = Math.round((Date.now() - this.gameStartTime) / 1000);
    this.gameTimeSpent.set(timeSpent);

    const totalWords = this.activeWords().length;
    const mistakes = this.sessionMistakes().length;
    const correct = Math.max(0, totalWords - mistakes);
    
    this.gameCorrectCount.set(correct);
    this.gameMistakesCount.set(mistakes);
    const rate = totalWords > 0 ? Math.round((correct / totalWords) * 100) : 0;
    this.gameSuccessRate.set(rate);

    const xp = correct * 10; // +10 XP per correct answer
    this.gameXPRewarded.set(xp);

    // Badges
    const badges: string[] = [];
    if (mistakes > 0) {
      badges.push('Tenacity');
    }
    if (rate === 100) {
      badges.push('Perfect Score');
    }
    if (timeSpent < 30) {
      badges.push('Speedy Finisher');
    }
    this.gameBadges.set(badges);

    const user = this.currentUser();
    if (user) {
      this.db.updateUserXP(user.id, xp, true);
      this.saveVocabGameScore(user, rate, xp, timeSpent);
    }
  }

  saveVocabGameScore(user: UserProfile, score: number, xp: number, timeSpent: number) {
    const scoresStr = localStorage.getItem('speak_vocab_game_scores');
    let scoresList = scoresStr ? JSON.parse(scoresStr) : [];
    
    const newScore = {
      id: 'score-' + Date.now(),
      studentId: user.id,
      studentName: user.name,
      avatar: user.avatar,
      gameId: this.activeVocabGame()?.id || 'default',
      gameTitle: this.activeVocabGame()?.title || 'Word Match (Association)',
      score: score,
      xp: xp,
      timeSpent: timeSpent,
      date: new Date().toISOString(),
      level: user.level || 'A1'
    };
    
    scoresList.push(newScore);
    localStorage.setItem('speak_vocab_game_scores', JSON.stringify(scoresList));
    this.loadLeaderboard();
  }

  loadLeaderboard() {
    const scoresStr = localStorage.getItem('speak_vocab_game_scores');
    let scoresList = scoresStr ? JSON.parse(scoresStr) : [];
    
    // Seed default scores if empty
    if (scoresList.length === 0) {
      const user = this.currentUser();
      const currentLevel = user?.level || 'A1';
      
      const mockStudents = [
        { name: 'Sarah Lopez', avatar: '👩‍🎓', level: currentLevel },
        { name: 'Lucas Martin', avatar: '👨‍🎓', level: currentLevel },
        { name: 'Emma Dubois', avatar: '👩‍🎨', level: currentLevel },
        { name: 'Thomas Bernard', avatar: '👨‍💻', level: currentLevel }
      ];
      
      const gameTitles = [
        'Travel vocabulary',
        'Business Basics',
        'Word Match (Association)',
        'Food & Dining'
      ];
      
      mockStudents.forEach((student, idx) => {
        scoresList.push({
          id: 'mock-score-' + idx,
          studentId: 'mock-student-' + idx,
          studentName: student.name,
          avatar: student.avatar,
          gameId: 'vg-mock-' + idx,
          gameTitle: gameTitles[idx % gameTitles.length],
          score: 80 + idx * 5 > 100 ? 100 : 80 + idx * 5,
          xp: (80 + idx * 5 > 100 ? 100 : 80 + idx * 5),
          timeSpent: 25 + idx * 4,
          date: new Date(Date.now() - (idx + 1) * 3600000).toISOString(),
          level: student.level
        });
      });
      localStorage.setItem('speak_vocab_game_scores', JSON.stringify(scoresList));
    }
    
    const user = this.currentUser();
    const currentLevel = user?.level || 'A1';
    
    let filtered = scoresList.filter((s: any) => s.level === currentLevel);
    filtered.sort((a: any, b: any) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.timeSpent - b.timeSpent;
    });
    
    this.vocabLeaderboard.set(filtered.slice(0, 10));
  }

  replayMistakenWords() {
    const wordsToReplay = [...this.sessionMistakes()];
    this.activeWords.set(wordsToReplay);
    this.sessionMistakes.set([]);
    
    this.gameFinished.set(false);
    this.matchesFound.set(0);
    this.selectedCard.set(null);
    this.gameStartTime = Date.now();
    
    this.currentCardIdx.set(0);
    this.isFlipped.set(false);
    this.memoryFlippedIds.set([]);
    this.wordBuilderIdx.set(0);
    this.hangmanIdx.set(0);
    this.hangmanGuesses.set([]);
    this.hangmanLives.set(6);
    this.mcGameIdx.set(0);
    this.mcSelected.set(null);
    this.mcIsCorrect.set(null);
    
    const game = this.activeVocabGame() || this.getDefaultVocabGameObj();
    const gameType = game ? game.gameType : 'matching';

    // recalculate timer limit for matching/memory
    const timerVal = this.selectedConfigTimer();
    let limit = 0;
    if (timerVal === '15s') limit = 15;
    else if (timerVal === '30s') limit = 30;
    else if (timerVal === '60s') limit = 60;

    if (limit > 0 && (gameType === 'matching' || gameType === 'memory')) {
      this.timerLimit.set(limit * wordsToReplay.length);
    } else {
      this.timerLimit.set(limit);
    }

    if (gameType === 'matching' || gameType === 'memory') {
      this.setupGameCards();
    } else if (gameType === 'word_builder') {
      this.setupWordBuilder(0);
    } else if (gameType === 'hangman') {
      this.setupHangman(0);
    } else if (gameType === 'multiple_choice') {
      this.setupMCGame(0);
    }
    
    this.startWordTimer();
  }

  recordMistake(wordObj: any) {
    if (!wordObj) return;
    this.sessionMistakes.update(list => {
      if (list.some(w => w.word === wordObj.word)) return list;
      return [...list, wordObj];
    });
  }

  getMCQuestionPhrase(wordObj: any): string {
    if (!wordObj) return '';
    const word = wordObj.word;
    const def = wordObj.definition || '';
    
    const localContexts: { [key: string]: string } = {
      'hypothesis': 'Our initial ____ was proven correct after the lab experiment.',
      'apple': 'He took a bite of a juicy red ____.',
      'kitchen': 'The chef was busy preparing dinner in the restaurant ____.',
      'to come': 'Would you like ____ to the party with us tomorrow?',
      'negotiation': 'After hours of ____, the two companies finally signed the contract.',
      'revenue': 'The company\'s annual ____ increased by twenty percent this year.',
      'itinerary': 'We followed a strict travel ____ during our trip to Paris.',
      'luggage': 'Please make sure to label your ____ before checking it in at the airport.',
      'restaurant': 'We had a delicious three-course meal at the new Italian ____.',
      'investment': 'Buying a house is a significant long-term ____ for most families.'
    };

    const lowerWord = word.toLowerCase();
    if (localContexts[lowerWord]) {
      return `Fill in: ${localContexts[lowerWord]}`;
    }

    if (def && def.toLowerCase().includes(lowerWord)) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      return `Fill in: ${def.replace(regex, '____')}`;
    }

    if (def) {
      return `Fill in the blank for the definition: "${def}" (Word: ____)`;
    }

    return `Traduction : ${wordObj.translation || '____'}`;
  }

  hasDefinitionOrContext(wordObj: any): boolean {
    if (!wordObj) return false;
    const word = wordObj.word.toLowerCase();
    const localContexts: { [key: string]: string } = {
      'hypothesis': 'Our initial ____ was proven correct after the lab experiment.',
      'apple': 'He took a bite of a juicy red ____.',
      'kitchen': 'The chef was busy preparing dinner in the restaurant ____.',
      'to come': 'Would you like ____ to the party with us tomorrow?',
      'negotiation': 'After hours of ____, the two companies finally signed the contract.',
      'revenue': 'The company\'s annual ____ increased by twenty percent this year.',
      'itinerary': 'We followed a strict travel ____ during our trip to Paris.',
      'luggage': 'Please make sure to label your ____ before checking it in at the airport.',
      'restaurant': 'We had a delicious three-course meal at the new Italian ____.',
      'investment': 'Buying a house is a significant long-term ____ for most families.'
    };
    return !!(localContexts[word] || (wordObj.definition && wordObj.definition.toLowerCase().includes(word)));
  }

  markFlashcardResult(known: boolean) {
    const currentWord = this.activeWords()[this.currentCardIdx()];
    if (!known) {
      this.recordMistake(currentWord);
    }
    this.nextFlashcard();
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D
  }

  prevQuestion(quiz: Quiz) {
    if (this.currentQuestionIdx() > 0) {
      this.currentQuestionIdx.update(i => i - 1);
      this.selectedOption.set(null);
      
      if (quiz.type === 'Oral Practice') {
        const file = this.recordedFiles()[this.currentQuestionIdx()];
        if (file) {
          this.recordingState.set('finished');
        } else {
          this.recordingState.set('idle');
        }
      }
    }
  }

  nextQuestion(quiz: Quiz) {
    const activeLetter = this.selectedOption();
    const correctLetter = quiz.questions[this.currentQuestionIdx()].correctOption;

    if (activeLetter) {
      this.userAnswers.set({
        ...this.userAnswers(),
        [this.currentQuestionIdx()]: activeLetter
      });
    }

    if (activeLetter === correctLetter) {
      this.quizCorrectCount.update(c => c + 1);
    }

    if (this.currentQuestionIdx() + 1 === quiz.questions.length) {
      const pct = Math.round((this.quizCorrectCount() / quiz.questions.length) * 100);
      this.quizScore.set(pct);
      this.quizFinished.set(true);
      
      const xp = pct >= 60 ? 50 : 10;
      const user = this.currentUser();
      if (user) {
        this.db.updateUserXP(user.id, xp, true);
        const quizSummary = `Score: ${pct}% (${this.quizCorrectCount()} / ${quiz.questions.length} correctes). Réponses de l'étudiant: ${JSON.stringify(this.userAnswers())}`;
        this.db.submitHomework(quiz.id, `[Quiz] ${quiz.title}`, 'text', quizSummary, quiz.points || xp);
      }
    } else {
      this.currentQuestionIdx.update(i => i + 1);
      this.selectedOption.set(null);
    }
  }

  startAudioRecording() {
    this.recordingState.set('recording');
    this.recordSeconds.set(0);
    
    this.timerInterval = setInterval(() => {
      this.recordSeconds.set(this.recordSeconds() + 1);
    }, 1000);

    this.animInterval = setInterval(() => {
      const fresh = this.visualizerHeights().map(() => Math.floor(Math.random() * 70) + 15);
      this.visualizerHeights.set(fresh);
    }, 150);
  }

  stopAudioRecording() {
    clearInterval(this.timerInterval);
    clearInterval(this.animInterval);
    this.recordingState.set('finished');
    
    const simulatedAudioData = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    this.recordedFiles.set({
      ...this.recordedFiles(),
      [this.currentQuestionIdx()]: simulatedAudioData
    });
  }

  resetAudioRecording() {
    clearInterval(this.timerInterval);
    clearInterval(this.animInterval);
    this.recordingState.set('idle');
    this.recordSeconds.set(0);
    
    const fresh = { ...this.recordedFiles() };
    delete fresh[this.currentQuestionIdx()];
    this.recordedFiles.set(fresh);
  }

  nextOralQuestion(quiz: Quiz) {
    if (this.currentQuestionIdx() + 1 === quiz.questions.length) {
      const user = this.currentUser();
      if (user) {
        const simulatedPayload = this.recordedFiles()[0] || 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
        this.db.submitHomework(quiz.id, `[Quiz] ${quiz.title}`, 'audio', simulatedPayload, quiz.points || 50);
        this.db.updateUserXP(user.id, 50, true);
      }
      this.quizFinished.set(true);
    } else {
      this.currentQuestionIdx.update(i => i + 1);
      
      const file = this.recordedFiles()[this.currentQuestionIdx()];
      if (file) {
        this.recordingState.set('finished');
      } else {
        this.recordingState.set('idle');
        this.recordSeconds.set(0);
      }
    }
  }

  playAudioPlayback() {
    this.speakWord(`Playing back your recorded voice response for question number ${this.currentQuestionIdx() + 1}`);
  }

  formatDuration(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  getVisualizerBarHeight(idx: number): number {
    return this.visualizerHeights()[idx] || 15;
  }

  speakWord(word: string) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }

  getUserAnswer(questionIndex: number): string | null {
    return this.selectedOption();
  }

  getUserAnswerText(questionIndex: number): string {
    const quiz = this.activeQuiz();
    if (!quiz) return '';
    const userAnswer = this.userAnswers()[questionIndex];
    if (!userAnswer) return 'Aucune réponse';
    const idx = userAnswer.charCodeAt(0) - 65;
    return quiz.questions[questionIndex].options[idx] || userAnswer;
  }

  getCorrectAnswerText(question: any): string {
    const idx = question.correctOption.charCodeAt(0) - 65;
    return question.options[idx] || question.correctOption;
  }

  roundNumber(value: number): number {
    return Math.round(value);
  }

  private userAnswers = signal<{ [key: number]: string }>({});

  startListeningExercise() {
    this.activeExercise.set('listening');
    this.listeningFinished.set(false);
    this.currentListeningIdx.set(0);
    this.selectedListeningOption.set(null);
    this.listeningScore.set(0);
    
    this.listeningText.set('The cat sat on the mat. It was a sunny day and the cat was feeling very lazy. The cat decided to take a nap in the warm sunlight.');
    this.listeningAudioUrl.set('');
    this.listeningQuestions.set([
      {
        question: 'Where did the cat sit?',
        options: ['On the chair', 'On the mat', 'On the table', 'On the bed'],
        correct: 1
      },
      {
        question: 'How was the weather?',
        options: ['Rainy', 'Cloudy', 'Sunny', 'Windy'],
        correct: 2
      },
      {
        question: 'What did the cat decide to do?',
        options: ['Play', 'Eat', 'Take a nap', 'Run'],
        correct: 2
      }
    ]);
  }

  playListeningText() {
    const text = this.listeningText();
    if (text && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  }

  prevListeningQuestion() {
    if (this.currentListeningIdx() > 0) {
      this.currentListeningIdx.update(i => i - 1);
      this.selectedListeningOption.set(null);
    }
  }

  nextListeningQuestion() {
    const selected = this.selectedListeningOption();
    const currentQ = this.listeningQuestions()[this.currentListeningIdx()];
    
    if (selected === currentQ.correct) {
      this.listeningScore.update(s => s + Math.round(100 / this.listeningQuestions().length));
    }

    if (this.currentListeningIdx() + 1 === this.listeningQuestions().length) {
      this.listeningFinished.set(true);
      const user = this.currentUser();
      if (user) {
        const xp = this.listeningScore() >= 60 ? 50 : 10;
        this.db.updateUserXP(user.id, xp, true);
      }
    } else {
      this.currentListeningIdx.update(i => i + 1);
      this.selectedListeningOption.set(null);
    }
  }

  setupGameCards() {
    const words = this.activeWords();
    const rawPairs = words.map((w: any) => ({
      english: w.word,
      french: w.translation || w.definition
    }));

    const cards: MatchCard[] = [];
    rawPairs.forEach((p: any, idx: number) => {
      cards.push({
        id: idx * 2,
        text: p.english,
        matchId: idx,
        type: 'english',
        selected: false,
        matched: false
      });
      cards.push({
        id: idx * 2 + 1,
        text: p.french,
        matchId: idx,
        type: 'french',
        selected: false,
        matched: false
      });
    });

    cards.sort(() => Math.random() - 0.5);
    this.gameCards.set(cards);
  }

  selectCard(card: MatchCard) {
    if (this.activeVocabGame()?.gameType === 'memory') {
      this.selectMemoryCard(card);
      return;
    }
    if (card.matched) return;

    const list = [...this.gameCards()];
    const activeSelected = this.selectedCard();
    
    if (!activeSelected) {
      card.selected = true;
      this.selectedCard.set(card);
      this.gameCards.set(list);
    } else {
      if (activeSelected.id === card.id) {
        card.selected = false;
        this.selectedCard.set(null);
        this.gameCards.set(list);
      } else if (activeSelected.type === card.type) {
        const oldCard = list.find(c => c.id === activeSelected.id);
        if (oldCard) oldCard.selected = false;
        card.selected = true;
        this.selectedCard.set(card);
        this.gameCards.set(list);
      } else {
        if (activeSelected.matchId === card.matchId) {
          const c1 = list.find(c => c.id === activeSelected.id);
          const c2 = list.find(c => c.id === card.id);
          if (c1 && c2) {
            c1.matched = true;
            c1.selected = false;
            c2.matched = true;
            c2.selected = false;
          }
          this.playSuccessSound();
          this.matchesFound.update(m => m + 1);
          this.selectedCard.set(null);
          this.gameCards.set(list);

          const totalPairs = this.gameCards().length / 2;
          if (this.matchesFound() === totalPairs) {
            this.gameFinished.set(true);
            this.finishVocabGame();
          }
        } else {
          // Record mistake
          const activeWordText = activeSelected.type === 'english' ? activeSelected.text : card.type === 'english' ? card.text : '';
          const activeWordObj = this.activeWords().find(w => w.word === activeWordText);
          if (activeWordObj) {
            this.recordMistake(activeWordObj);
          }
          this.playErrorSound();

          card.selected = true;
          const c1 = list.find(c => c.id === activeSelected.id);
          const c2 = list.find(c => c.id === card.id);
          if (c1) c1.error = true;
          if (c2) c2.error = true;
          this.gameCards.set(list);
          
          setTimeout(() => {
            const listReset = [...this.gameCards()];
            const rc1 = listReset.find(c => c.id === activeSelected.id);
            const rc2 = listReset.find(c => c.id === card.id);
            if (rc1) { rc1.selected = false; rc1.error = false; }
            if (rc2) { rc2.selected = false; rc2.error = false; }
            this.selectedCard.set(null);
            this.gameCards.set(listReset);
          }, 600);
        }
      }
    }
  }

  selectMemoryCard(card: MatchCard) {
    if (card.matched || card.selected || this.memoryFlippedIds().length >= 2) return;

    card.selected = true;
    const cardsList = [...this.gameCards()];
    this.gameCards.set(cardsList);
    this.memoryFlippedIds.update(ids => [...ids, card.id]);

    const flipped = this.memoryFlippedIds();
    if (flipped.length === 2) {
      const list = [...this.gameCards()];
      const first = list.find(c => c.id === flipped[0]);
      const second = list.find(c => c.id === flipped[1]);
      if (first && second) {
        if (first.matchId === second.matchId) {
          setTimeout(() => {
            first.matched = true;
            second.matched = true;
            first.selected = false;
            second.selected = false;
            this.playSuccessSound();
            this.memoryFlippedIds.set([]);
            this.gameCards.set(list);
            
            const allMatched = this.gameCards().every(c => c.matched);
            if (allMatched) {
              this.gameFinished.set(true);
              this.finishVocabGame();
            }
          }, 600);
        } else {
          // Record mistake
          const activeWordText = first.type === 'english' ? first.text : second.type === 'english' ? second.text : '';
          const activeWordObj = this.activeWords().find(w => w.word === activeWordText);
          if (activeWordObj) {
            this.recordMistake(activeWordObj);
          }
          this.playErrorSound();

          first.error = true;
          second.error = true;
          this.gameCards.set(list);
          setTimeout(() => {
            const listReset = [...this.gameCards()];
            const rf1 = listReset.find(c => c.id === flipped[0]);
            const rf2 = listReset.find(c => c.id === flipped[1]);
            if (rf1) { rf1.selected = false; rf1.error = false; }
            if (rf2) { rf2.selected = false; rf2.error = false; }
            this.memoryFlippedIds.set([]);
            this.gameCards.set(listReset);
          }, 1200);
        }
      }
    }
  }

  flipCard() {
    this.isFlipped.update(f => !f);
  }

  nextFlashcard() {
    if (this.currentCardIdx() + 1 === this.activeWords().length) {
      this.gameFinished.set(true);
      this.finishVocabGame();
    } else {
      this.currentCardIdx.update(idx => idx + 1);
      this.isFlipped.set(false);
      this.startWordTimer();
    }
  }

  prevFlashcard() {
    if (this.currentCardIdx() > 0) {
      this.currentCardIdx.update(idx => idx - 1);
      this.isFlipped.set(false);
      this.startWordTimer();
    }
  }

  setupWordBuilder(idx: number) {
    const wordObj = this.activeWords()[idx];
    if (!wordObj) return;

    const letters = wordObj.word.toLowerCase().split('').filter((c: string) => c !== ' ');
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    this.scrambledLetters.set(letters);
    this.selectedLetters.set([]);
  }

  clickScrambledLetter(char: string, sIdx: number) {
    this.selectedLetters.update(sel => [...sel, char]);
    this.scrambledLetters.update(scr => scr.filter((_, idx) => idx !== sIdx));

    const currentWordObj = this.activeWords()[this.wordBuilderIdx()];
    if (!currentWordObj) return;
    
    // Check spelling correctness progressively
    const targetWordClean = currentWordObj.word.toLowerCase().replace(/\s/g, '');
    const currentIndex = this.selectedLetters().length - 1;
    if (char !== targetWordClean[currentIndex]) {
      this.recordMistake(currentWordObj);
      this.playErrorSound();
    }

    const spellStr = this.selectedLetters().join('');
    if (spellStr === targetWordClean) {
      this.playSuccessSound();
      setTimeout(() => {
        if (this.wordBuilderIdx() + 1 === this.activeWords().length) {
          this.gameFinished.set(true);
          this.finishVocabGame();
        } else {
          this.wordBuilderIdx.update(i => i + 1);
          this.setupWordBuilder(this.wordBuilderIdx());
          this.startWordTimer();
        }
      }, 800);
    }
  }

  clickSelectedLetter(char: string, selIdx: number) {
    this.selectedLetters.update(sel => sel.filter((_, idx) => idx !== selIdx));
    this.scrambledLetters.update(scr => [...scr, char]);
  }

  resetWordBuilder() {
    this.setupWordBuilder(this.wordBuilderIdx());
  }

  setupHangman(idx: number) {
    this.hangmanGuesses.set([]);
    this.hangmanLives.set(6);
  }

  guessHangmanLetter(letter: string) {
    if (this.hangmanGuesses().includes(letter) || this.hangmanLives() <= 0) return;

    this.hangmanGuesses.update(guesses => [...guesses, letter]);

    const currentWordObj = this.activeWords()[this.hangmanIdx()];
    if (!currentWordObj) return;
    const currentWord = currentWordObj.word.toLowerCase();
    
    if (!currentWord.includes(letter)) {
      this.hangmanLives.update(l => l - 1);
      this.recordMistake(currentWordObj);
      this.playErrorSound();
      if (this.hangmanLives() <= 0) {
        setTimeout(() => {
          if (this.hangmanIdx() + 1 === this.activeWords().length) {
            this.gameFinished.set(true);
            this.finishVocabGame();
          } else {
            this.hangmanIdx.update(i => i + 1);
            this.setupHangman(this.hangmanIdx());
            this.startWordTimer();
          }
        }, 1200);
        return;
      }
    } else {
      this.playSuccessSound();
    }

    const won = currentWord.split('').every((char: string) => 
      char === ' ' || this.hangmanGuesses().includes(char)
    );

    if (won) {
      setTimeout(() => {
        if (this.hangmanIdx() + 1 === this.activeWords().length) {
          this.gameFinished.set(true);
          this.finishVocabGame();
        } else {
          this.hangmanIdx.update(i => i + 1);
          this.setupHangman(this.hangmanIdx());
          this.startWordTimer();
        }
      }, 800);
    }
  }

  getHangmanWordDisplay(): string {
    const wordObj = this.activeWords()[this.hangmanIdx()];
    if (!wordObj) return '';
    const word = wordObj.word;
    return word.split('').map((char: string) => {
      if (char === ' ') return ' ';
      return this.hangmanGuesses().includes(char.toLowerCase()) ? char : '_';
    }).join(' ');
  }

  setupMCGame(idx: number) {
    const wordObj = this.activeWords()[idx];
    if (!wordObj) return;
    const correctWord = wordObj.word;
    
    // Gather decoy options from default + current games list
    let decoyPool = [
      ...this.activeWords().map(w => w.word),
      ...this.originalWordsList().map(w => w.word),
      ...defaultWordsBank.map(w => w.word)
    ];
    decoyPool = decoyPool.filter((w, index) => w !== correctWord && decoyPool.indexOf(w) === index);
    
    for (let i = decoyPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [decoyPool[i], decoyPool[j]] = [decoyPool[j], decoyPool[i]];
    }
    
    const choices = [correctWord, ...decoyPool.slice(0, 3)];
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }

    this.mcOptions.set(choices);
    this.mcSelected.set(null);
    this.mcIsCorrect.set(null);
  }

  selectMCOption(opt: string) {
    if (this.mcSelected()) return;

    this.mcSelected.set(opt);
    const currentWordObj = this.activeWords()[this.mcGameIdx()];
    if (!currentWordObj) return;
    const correctWord = currentWordObj.word;
    
    const correct = opt === correctWord;
    this.mcIsCorrect.set(correct);
    if (!correct) {
      this.recordMistake(currentWordObj);
      this.playErrorSound();
    } else {
      this.playSuccessSound();
    }

    setTimeout(() => {
      if (this.mcGameIdx() + 1 === this.activeWords().length) {
        this.gameFinished.set(true);
        this.finishVocabGame();
      } else {
        this.mcGameIdx.update(i => i + 1);
        this.setupMCGame(this.mcGameIdx());
        this.startWordTimer();
      }
    }, 1000);
  }

  getGameLabel(type: string): string {
    switch (type) {
      case 'matching': return this.t('Association', 'Matching');
      case 'memory': return this.t('Jeu de Mémoire', 'Memory Game');
      case 'flashcards': return this.t('Flashcards', 'Flashcards');
      case 'word_builder': return this.t('Reconstruction', 'Word Builder');
      case 'hangman': return this.t('Pendu', 'Hangman');
      case 'multiple_choice': return this.t('Choix Multiple', 'Multiple Choice');
      default: return this.t('Jeu', 'Game');
    }
  }

  getDiffLabel(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return this.t('Facile', 'Easy');
      case 'medium': return this.t('Moyen', 'Medium');
      case 'hard': return this.t('Difficile', 'Hard');
      default: return difficulty;
    }
  }
}
