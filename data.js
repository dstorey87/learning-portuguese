// Lesson and topic data
export const topics = [
  {
    id: 'greetings',
    title: 'Basic Greetings',
    gated: false,
    lessons: [
      {
        id: 1,
        title: 'Essential Greetings',
        level: 'beginner',
        words: [
          { pt: 'Olá', en: 'Hello', audio: 'ola' },
          { pt: 'Bom dia', en: 'Good morning', audio: 'bom-dia' },
          { pt: 'Boa tarde', en: 'Good afternoon', audio: 'boa-tarde' },
          { pt: 'Boa noite', en: 'Good night', audio: 'boa-noite' },
          { pt: 'Adeus', en: 'Goodbye', audio: 'adeus' },
          { pt: 'Até logo', en: 'See you later', audio: 'ate-logo' }
        ],
        sentences: [
          { pt: 'Olá, bom dia! Como está?', en: 'Hello, good morning! How are you?' },
          { pt: 'Boa tarde, prazer em conhecê-lo.', en: 'Good afternoon, nice to meet you.' }
        ]
      }
    ]
  },
  {
    id: 'travel',
    title: 'Travel Basics',
    gated: true,
    lessons: [
      {
        id: 2,
        title: 'At the Airport',
        level: 'beginner',
        words: [
          { pt: 'Aeroporto', en: 'Airport', audio: 'aeroporto' },
          { pt: 'Bilhete', en: 'Ticket', audio: 'bilhete' },
          { pt: 'Porta de embarque', en: 'Boarding gate', audio: 'porta-embarque' },
          { pt: 'Passaporte', en: 'Passport', audio: 'passaporte' },
          { pt: 'Bagagem', en: 'Luggage', audio: 'bagagem' }
        ],
        sentences: [
          { pt: 'Onde fica a porta de embarque número cinco?', en: 'Where is boarding gate number five?' },
          { pt: 'Preciso despachar esta bagagem, por favor.', en: 'I need to check this luggage, please.' }
        ]
      },
      {
        id: 3,
        title: 'Getting Around',
        level: 'beginner',
        words: [
          { pt: 'Comboio', en: 'Train', audio: 'comboio' },
          { pt: 'Metro', en: 'Subway', audio: 'metro' },
          { pt: 'Autocarro', en: 'Bus', audio: 'autocarro' },
          { pt: 'Táxi', en: 'Taxi', audio: 'taxi' },
          { pt: 'Paragem', en: 'Stop', audio: 'paragem' }
        ],
        sentences: [
          { pt: 'Onde posso apanhar o metro mais perto?', en: 'Where can I catch the nearest subway?' },
          { pt: 'Quanto tempo até a próxima paragem?', en: 'How long until the next stop?' }
        ]
      }
    ]
  },
  {
    id: 'cafe',
    title: 'Café & Food',
    gated: true,
    lessons: [
      {
        id: 4,
        title: 'Ordering Coffee',
        level: 'beginner',
        words: [
          { pt: 'Um café', en: 'An espresso', audio: 'cafe' },
          { pt: 'Uma meia de leite', en: 'A latte', audio: 'meia-leite' },
          { pt: 'Conta', en: 'Bill/check', audio: 'conta' },
          { pt: 'Por favor', en: 'Please', audio: 'por-favor' },
          { pt: 'Obrigado', ptFem: 'Obrigada', en: 'Thank you', audio: 'obrigado', gendered: true }
        ],
        sentences: [
          { pt: 'Queria um café e um pastel de nata, por favor.', en: 'I would like an espresso and a custard tart, please.' },
          { pt: 'Pode trazer a conta, por favor?', en: 'Can you bring the bill, please?' }
        ]
      }
    ]
  }
];

export function getAllLessonsFlat() {
  return topics.flatMap(topic => topic.lessons.map(lesson => ({ ...lesson, topicId: topic.id, topicTitle: topic.title, gated: topic.gated })));
}
