// Flagship Bilingual Novel & Initial Catalog Data
export const books = [
  {
    id: 'koko-goree-secret',
    title: "Le Secret de l'Île de Gorée",
    author: 'Fatoumata',
    cover: 'c1',
    customCoverUrl: '',
    genres: ['Fiction Littéraire', 'Mystère & Histoire'],
    level: 'B1 · Anglais Intermédiaire',
    rating: 0,
    chapterCount: 3,
    readingTime: '1h 45m',
    description: 'Une aventure bilingue captivante à travers les ruelles coloniales et les légendes oubliées de l\'île de Gorée. Suivez le destin d\'Aïda à la recherche d\'un mystérieux carnet de correspondance laissé au siècle dernier.',
    chaptersData: [
      {
        id: 1,
        title: 'Chapitre 1 : Les Rives du Fleuve',
        imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
        isPaid: false,
        coinPrice: 0,
        audioDuration: '02:30',
        audioFileName: '',
        audioUrl: '',
        sentences: [
          {
            en: 'The morning sun rose gently over the Atlantic Ocean, casting a warm golden light across Dakar harbor.',
            fr: 'Le soleil du matin se levait doucement sur l\'océan Atlantique, projetant une lumière dorée et chaleureuse sur le port de Dakar.',
            vocabWord: 'harbor',
            vocabFr: 'port'
          },
          {
            en: 'Aïda held the old brass key tightly in her right hand, wondering what door it might open.',
            fr: 'Aïda tenait fermement la vieille clé en laiton dans sa main droite, se demandant quelle porte elle pouvait bien ouvrir.',
            vocabWord: 'brass key',
            vocabFr: 'clé en laiton'
          },
          {
            en: 'The wooden ferry glided silently through the calm blue waves towards the historic island of Gorée.',
            fr: 'Le chalutier en bois glissait en silence à travers les vagues bleues et paisibles en direction de l\'île historique de Gorée.',
            vocabWord: 'ferry',
            vocabFr: 'chalutier / navire'
          },
          {
            en: 'Her grandmother had always spoken of a hidden notebook written in both English and French.',
            fr: 'Sa grand-mère avait toujours parlé d\'un carnet secret rédigé à la fois en anglais et en français.',
            vocabWord: 'notebook',
            vocabFr: 'carnet de notes'
          }
        ],
        quiz: {
          questionEn: 'What did Aïda hold tightly in her right hand as the ferry glided?',
          questionFr: 'Que tenait Aïda fermement dans sa main droite alors que le navire glissait ?',
          options: ['An old brass key', 'A silver compass', 'A wooden lantern', 'A leather bag'],
          correctIndex: 0,
          explanation: 'Aïda held an old brass key in her right hand.'
        }
      },
      {
        id: 2,
        title: 'Chapitre 2 : Les Secrets de la Nuit',
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
        isPaid: false,
        coinPrice: 0,
        audioDuration: '03:15',
        audioFileName: '',
        audioUrl: '',
        sentences: [
          {
            en: 'Night fell quickly over the cobblestone alleys, and the cool sea wind began to blow.',
            fr: 'La nuit tomba rapidement sur les ruelles pavées, et le vent frais de la mer commença à souffler.',
            vocabWord: 'cobblestone',
            vocabFr: 'ruelles pavées'
          },
          {
            en: 'Behind a carved wooden door, she discovered a small iron chest half-buried in sand.',
            fr: 'Derrière une porte en bois sculpté, elle découvrit un petit coffre en fer à demi enfoui dans le sable.',
            vocabWord: 'iron chest',
            vocabFr: 'coffre en fer'
          }
        ],
        quiz: {
          questionEn: 'Where was the iron chest hidden?',
          questionFr: 'Où le coffre en fer était-il caché ?',
          options: ['Behind a carved wooden door', 'Inside a stone tower', 'Under a fishing boat', 'Near the main market'],
          correctIndex: 0,
          explanation: 'The iron chest was hidden behind a carved wooden door.'
        }
      },
      {
        id: 3,
        title: 'Chapitre 3 : L\'Héritage Révélé',
        imageUrl: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1200&q=80',
        isPaid: false,
        coinPrice: 0,
        audioDuration: '04:00',
        audioFileName: '',
        audioUrl: '',
        sentences: [
          {
            en: 'Inside the chest lay a series of letters telling the story of two families united across the sea.',
            fr: 'À l\'intérieur du coffre se trouvaient une série de lettres racontant l\'histoire de deux familles unies par-delà la mer.',
            vocabWord: 'letters',
            vocabFr: 'lettres de correspondance'
          }
        ]
      }
    ]
  }
];

export const library = [];
export const leaderboard = [];
