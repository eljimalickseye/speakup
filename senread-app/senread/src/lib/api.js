import { books as initialBooks, leaderboard as initialLeaderboard, library as initialLibrary } from '../data/books.js';

export const covers = {
  c1: 'linear-gradient(135deg, #0C2320 0%, #163832 50%, #8C6D3F 100%)', // Deep emerald gold
  c2: 'linear-gradient(135deg, #2D1B18 0%, #4A2E2B 50%, #8C6D3F 100%)', // Warm sepia gold
  c3: 'linear-gradient(135deg, #122438 0%, #1C3B5E 50%, #3B82F6 100%)', // Ocean blue
  c4: 'linear-gradient(135deg, #3A1C28 0%, #5C2B40 50%, #EC4899 100%)', // Sunset magenta
  c5: 'linear-gradient(135deg, #1A1829 0%, #2D2A4A 50%, #8B5CF6 100%)', // Royal violet
  c6: 'linear-gradient(135deg, #2A180C 0%, #5A3516 50%, #D97706 100%)', // Terracotta amber
};

export function getBooksFromStorage() {
  const saved = localStorage.getItem('koko_books_v3');
  return saved ? JSON.parse(saved) : initialBooks;
}

export async function getBooks() {
  return getBooksFromStorage();
}

export async function getBook(id) {
  const currentBooks = getBooksFromStorage();
  return currentBooks.find((b) => b.id === id);
}

export async function getLeaderboard() {
  return initialLeaderboard;
}

export async function getLibrary() {
  const saved = localStorage.getItem('koko_library');
  return saved ? JSON.parse(saved) : initialLibrary;
}

// Calculate realistic audio narration time in MM:SS based on word count
export function calculateRealisticAudioTime(sentences = []) {
  const totalWords = sentences.reduce((acc, s) => acc + (s.en ? s.en.split(' ').length : 0), 0);
  const totalSeconds = Math.max(12, Math.round((totalWords / 150) * 60));
  const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const secs = (totalSeconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

export async function getChapter(bookId, chapterNum) {
  const book = await getBook(bookId);
  if (!book) return null;

  // Check if book has dynamic chaptersData published via Creator Studio
  if (book.chaptersData && book.chaptersData.length >= chapterNum) {
    const chap = book.chaptersData[chapterNum - 1];
    return {
      ...chap,
      audioDuration: chap.audioDuration || calculateRealisticAudioTime(chap.sentences || []),
    };
  }

  // Fallback default chapter with accurate bilingual vocabulary
  const fallbackSentences = [
    { en: 'The sun set over Dakar, turning the Atlantic ocean into gold.', fr: 'Le soleil se couchait sur Dakar, transformant l\'océan Atlantique en or.', vocabWord: 'sunset', vocabFr: 'coucher de soleil' },
    { en: 'She looked at the lighthouse flickering gently in the night breeze.', fr: 'Elle regardait le phare vaciller doucement dans la brise nocturne.', vocabWord: 'lighthouse', vocabFr: 'phare' },
  ];

  return {
    id: chapterNum,
    title: `Chapitre ${chapterNum} : Les Rives de Dakar`,
    audioDuration: calculateRealisticAudioTime(fallbackSentences),
    sentences: fallbackSentences,
    quiz: {
      questionEn: 'What flickered gently in the night breeze?',
      questionFr: 'Qu\'est-ce qui vacillait doucement dans la brise nocturne ?',
      options: ['The lighthouse', 'The ferry boat', 'The wooden tree', 'The street lamp'],
      correctIndex: 0,
      explanation: 'The lighthouse flickered gently in the night breeze.'
    }
  };
}
