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
      },
      {
        id: 9,
        title: 'Polite Starts',
        level: 'beginner',
        words: [
          { pt: 'Por favor', en: 'Please', audio: 'por-favor' },
          { pt: 'Obrigado', ptFem: 'Obrigada', en: 'Thank you', audio: 'obrigado', gendered: true },
          { pt: 'Desculpe', en: 'Sorry/excuse me', audio: 'desculpe' },
          { pt: 'Com licença', en: 'Excuse me (to pass)', audio: 'com-licenca' },
          { pt: 'Não falo muito bem português', en: 'I don’t speak Portuguese very well', audio: 'nao-falo-bem' }
        ],
        sentences: [
          { pt: 'Com licença, pode ajudar-me?', en: 'Excuse me, can you help me?' },
          { pt: 'Desculpe, não entendi. Pode repetir?', en: 'Sorry, I didn’t understand. Can you repeat?' }
        ]
      },
      {
        id: 10,
        title: 'Numbers & Basics',
        level: 'beginner',
        words: [
          { pt: 'Zero', en: 'Zero', audio: 'zero' },
          { pt: 'Um', en: 'One', audio: 'um' },
          { pt: 'Dois', en: 'Two', audio: 'dois' },
          { pt: 'Três', en: 'Three', audio: 'tres' },
          { pt: 'Quatro', en: 'Four', audio: 'quatro' },
          { pt: 'Cinco', en: 'Five', audio: 'cinco' }
        ],
        sentences: [
          { pt: 'Tenho três bilhetes.', en: 'I have three tickets.' },
          { pt: 'São cinco euros, por favor.', en: 'It is five euros, please.' }
        ]
      },
      {
        id: 13,
        title: 'Rapid Replies',
        level: 'beginner',
        words: [
          { pt: 'Sim', en: 'Yes', audio: 'sim' },
          { pt: 'Não', en: 'No', audio: 'nao' },
          { pt: 'Talvez', en: 'Maybe', audio: 'talvez' },
          { pt: 'Claro', en: 'Of course', audio: 'claro' },
          { pt: 'Depende', en: 'It depends', audio: 'depende' }
        ],
        sentences: [
          { pt: 'Sim, claro!', en: 'Yes, of course!' },
          { pt: 'Depende do horário.', en: 'It depends on the schedule.' }
        ]
      },
      {
        id: 14,
        title: 'Mini Dialogues',
        level: 'beginner',
        words: [
          { pt: 'Como se diz...?', en: 'How do you say...?', audio: 'como-se-diz' },
          { pt: 'Pode falar mais devagar?', en: 'Can you speak slower?', audio: 'mais-devagar' },
          { pt: 'Quanto custa?', en: 'How much is it?', audio: 'quanto-custa' },
          { pt: 'Onde é a casa de banho?', en: 'Where is the bathroom?', audio: 'casa-banho' },
          { pt: 'Não percebo', en: 'I do not understand', audio: 'nao-percebo' }
        ],
        sentences: [
          { pt: 'Pode repetir, por favor?', en: 'Can you repeat, please?' },
          { pt: 'Como se diz “ticket” em português?', en: 'How do you say “ticket” in Portuguese?' }
        ]
      }
    ]
  },
  {
    id: 'essentials',
    title: 'Everyday Essentials',
    gated: false,
    lessons: [
      {
        id: 11,
        title: 'Cafe Survival',
        level: 'beginner',
        words: [
          { pt: 'Um café', en: 'An espresso', audio: 'cafe' },
          { pt: 'Uma garrafa de água', en: 'A bottle of water', audio: 'agua' },
          { pt: 'Pastel de nata', en: 'Custard tart', audio: 'pastel-nata' },
          { pt: 'Conta', en: 'Bill/check', audio: 'conta' },
          { pt: 'É para levar', en: 'To take away', audio: 'para-levar' }
        ],
        sentences: [
          { pt: 'Queria um café e um pastel de nata.', en: 'I would like an espresso and a custard tart.' },
          { pt: 'Pode trazer a conta, por favor?', en: 'Can you bring the bill, please?' }
        ]
      },
      {
        id: 12,
        title: 'Getting Around Town',
        level: 'beginner',
        words: [
          { pt: 'Onde fica…?', en: 'Where is…?', audio: 'onde-fica' },
          { pt: 'Direita', en: 'Right', audio: 'direita' },
          { pt: 'Esquerda', en: 'Left', audio: 'esquerda' },
          { pt: 'Longe', en: 'Far', audio: 'longe' },
          { pt: 'Perto', en: 'Near', audio: 'perto' },
          { pt: 'Bilhete', en: 'Ticket', audio: 'bilhete' }
        ],
        sentences: [
          { pt: 'Onde fica o metro mais perto?', en: 'Where is the nearest subway?' },
          { pt: 'É longe daqui ou fica perto?', en: 'Is it far from here or nearby?' }
        ]
      }
    ]
  },
  {
    id: 'phrase-hacks',
    title: 'Phrase Hacks',
    gated: false,
    lessons: [
      {
        id: 15,
        title: 'Instant Travel Phrases',
        level: 'beginner',
        words: [
          { pt: 'É aqui', en: 'It is here', audio: 'e-aqui' },
          { pt: 'Quero isto', en: 'I want this', audio: 'quero-isto' },
          { pt: 'É urgente', en: 'It is urgent', audio: 'urgente' },
          { pt: 'Estou perdido', ptFem: 'Estou perdida', en: 'I am lost', audio: 'estou-perdido', gendered: true },
          { pt: 'Funciona?', en: 'Does it work?', audio: 'funciona' },
          { pt: 'Está aberto?', en: 'Is it open?', audio: 'aberto' },
          { pt: 'Está fechado?', en: 'Is it closed?', audio: 'fechado' }
        ],
        sentences: [
          { pt: 'Quero isto, por favor.', en: 'I want this, please.' },
          { pt: 'Estou perdido. Pode mostrar no mapa?', en: 'I am lost. Can you show it on the map?' }
        ]
      },
      {
        id: 16,
        title: 'Restaurant Cheats',
        level: 'beginner',
        words: [
          { pt: 'Tem mesa para dois?', en: 'Do you have a table for two?', audio: 'mesa-dois' },
          { pt: 'A conta, por favor', en: 'The bill, please', audio: 'conta-por-favor' },
          { pt: 'Sem glúten', en: 'Gluten-free', audio: 'sem-gluten' },
          { pt: 'É picante?', en: 'Is it spicy?', audio: 'picante' },
          { pt: 'Recomenda algo?', en: 'Do you recommend something?', audio: 'recomenda' },
          { pt: 'Água da torneira', en: 'Tap water', audio: 'agua-torneira' }
        ],
        sentences: [
          { pt: 'Tem opções sem glúten?', en: 'Do you have gluten-free options?' },
          { pt: 'Pode recomendar um prato típico?', en: 'Can you recommend a typical dish?' }
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
  },
  {
    id: 'daily-life',
    title: 'Vida Diária',
    gated: true,
    lessons: [
      {
        id: 5,
        title: 'Rotina e Casa',
        level: 'intermediate',
        words: [
          { pt: 'Acordar', en: 'To wake up', audio: 'acordar' },
          { pt: 'Tomar banho', en: 'To shower', audio: 'tomar-banho' },
          { pt: 'Pequeno-almoço', en: 'Breakfast', audio: 'pequeno-almoco' },
          { pt: 'Almoço', en: 'Lunch', audio: 'almoco' },
          { pt: 'Jantar', en: 'Dinner', audio: 'jantar' },
          { pt: 'Roupa', en: 'Clothes', audio: 'roupa' }
        ],
        sentences: [
          { pt: 'Eu acordo às sete e tomo café antes do trabalho.', en: 'I wake up at seven and have coffee before work.' },
          { pt: 'Tomamos o pequeno-almoço juntos todos os dias.', en: 'We eat breakfast together every day.' }
        ]
      },
      {
        id: 6,
        title: 'Compras e Serviços',
        level: 'intermediate',
        words: [
          { pt: 'Supermercado', en: 'Supermarket', audio: 'supermercado' },
          { pt: 'Talho', en: 'Butcher', audio: 'talho' },
          { pt: 'Padaria', en: 'Bakery', audio: 'padaria' },
          { pt: 'Farmácia', en: 'Pharmacy', audio: 'farmacia' },
          { pt: 'Caixa multibanco', en: 'ATM', audio: 'caixa-mb' }
        ],
        sentences: [
          { pt: 'Onde fica o supermercado mais perto?', en: 'Where is the nearest supermarket?' },
          { pt: 'Preciso de levantar dinheiro na caixa multibanco.', en: 'I need to withdraw money at the ATM.' }
        ]
      }
    ]
  },
  {
    id: 'work',
    title: 'Trabalho & Profissão',
    gated: true,
    lessons: [
      {
        id: 7,
        title: 'Escritório e Reuniões',
        level: 'advanced',
        words: [
          { pt: 'Reunião', en: 'Meeting', audio: 'reuniao' },
          { pt: 'Agenda', en: 'Schedule/agenda', audio: 'agenda' },
          { pt: 'Prazo', en: 'Deadline', audio: 'prazo' },
          { pt: 'Colega', en: 'Colleague', audio: 'colega', gendered: true, ptFem: 'Colega' },
          { pt: 'Feedback', en: 'Feedback', audio: 'feedback' },
          { pt: 'Relatório', en: 'Report', audio: 'relatorio' }
        ],
        sentences: [
          { pt: 'Temos uma reunião às nove para rever o relatório.', en: 'We have a meeting at nine to review the report.' },
          { pt: 'O prazo foi adiantado para sexta-feira.', en: 'The deadline was moved up to Friday.' }
        ]
      },
      {
        id: 8,
        title: 'Carreira e Objetivos',
        level: 'advanced',
        words: [
          { pt: 'Entrevista', en: 'Interview', audio: 'entrevista' },
          { pt: 'Promoção', en: 'Promotion', audio: 'promocao' },
          { pt: 'Competência', en: 'Skill', audio: 'competencia' },
          { pt: 'Formação', en: 'Training', audio: 'formacao' },
          { pt: 'Salário', en: 'Salary', audio: 'salario' }
        ],
        sentences: [
          { pt: 'Quero melhorar as minhas competências para uma promoção.', en: 'I want to improve my skills for a promotion.' },
          { pt: 'A entrevista correu bem e espero receber feedback.', en: 'The interview went well and I hope to receive feedback.' }
        ]
      }
    ]
  }
];

export function getAllLessonsFlat() {
  return topics.flatMap(topic => topic.lessons.map(lesson => ({ ...lesson, topicId: topic.id, topicTitle: topic.title, gated: topic.gated })));
}
