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
        isPaid: true,
        coinPrice: 5,
        audioDuration: '03:15',
        audioFileName: '',
        audioUrl: '',
        sentences: [
          {
            en: 'As dusk fell over the island, narrow stone streets whispered ancient stories carried by the ocean wind.',
            fr: 'Alors que le crépuscule tombait sur l\'île, les ruelles étroites en pierre chuchotaient d\'anciennes histoires portées par le vent de l\'océan.',
            vocabWord: 'dusk',
            vocabFr: 'crépuscule'
          },
          {
            en: 'Aïda walked quietly past red bougainvillea flowers blooming along the historic pastel walls.',
            fr: 'Aïda marchait en silence devant les bougainvilliers rouges en fleurs qui longeaient les murs historiques aux teintes pastel.',
            vocabWord: 'blooming',
            vocabFr: 'en fleurs / fleurissant'
          },
          {
            en: 'She discovered an iron door concealed beneath thick ivy behind the House of Slaves.',
            fr: 'Elle découvrit une porte en fer dissimulée sous du lierre épais derrière la Maison des Esclaves.',
            vocabWord: 'concealed',
            vocabFr: 'dissimulée / cachée'
          },
          {
            en: 'When she inserted the key, a soft metallic sound echoed through the silent corridor.',
            fr: 'Lorsqu\'elle inséra la clé, un doux son métallique résonna dans le couloir silencieux.',
            vocabWord: 'echoed',
            vocabFr: 'résonna'
          }
        ],
        quiz: {
          questionEn: 'Where was the iron door concealed?',
          questionFr: 'Où la porte en fer était-elle dissimulée ?',
          options: ['Beneath thick ivy', 'Under sand dunes', 'Behind a palm tree', 'Inside the lighthouse'],
          correctIndex: 0,
          explanation: 'The door was concealed beneath thick ivy.'
        }
      },
      {
        id: 3,
        title: 'Chapitre 3 : La Clé Cachée sous le Baobab',
        isPaid: true,
        coinPrice: 5,
        audioDuration: '03:45',
        audioFileName: '',
        audioUrl: '',
        sentences: [
          {
            en: 'Behind the door lay a sunlit courtyard with a giant ancient baobab tree standing in the center.',
            fr: 'Derrière la porte se trouvait une cour baignée de soleil où se dressait au centre un baobab géant et séculaire.',
            vocabWord: 'courtyard',
            vocabFr: 'cour intérieure'
          },
          {
            en: 'Buried between the hollow roots, she found a wooden chest containing the long-lost bilingual manuscript.',
            fr: 'Enfouie entre les racines creuses, elle trouva un coffre en bois contenant le manuscrit bilingue disparu depuis si longtemps.',
            vocabWord: 'buried',
            vocabFr: 'enfouie / enterrée'
          },
          {
            en: 'Every page revealed poetic letters of hope, peace, and cultural unity written by her ancestors.',
            fr: 'Chaque page révélait des lettres poétiques d\'espoir, de paix et d\'unité culturelle rédigées par ses ancêtres.',
            vocabWord: 'unity',
            vocabFr: 'unité'
          }
        ],
        quiz: {
          questionEn: 'What was found buried between the roots of the giant baobab tree?',
          questionFr: 'Qu\'a-t-on trouvé enfoui entre les racines du grand baobab ?',
          options: ['A wooden chest with a manuscript', 'A gold coin container', 'A stone sculpture', 'A bronze statue'],
          correctIndex: 0,
          explanation: 'She found a wooden chest containing the bilingual manuscript.'
        }
      }
    ]
  }
];

export const library = [
  {
    id: 'koko-goree-secret',
    title: "Le Secret de l'Île de Gorée",
    author: 'Fatoumata',
    cover: 'c1',
    progress: 0.35,
    lastRead: 'Hier',
  }
];

export const leaderboard = [
  { rank: 1, name: 'Fatoumata', streak: 15, coins: 250, avatar: 'F' },
  { rank: 2, name: 'Aïda Lefevre', streak: 12, coins: 150, avatar: 'A' },
  { rank: 3, name: 'El Hadji Malick Seye', streak: 10, coins: 120, avatar: 'M' },
];
