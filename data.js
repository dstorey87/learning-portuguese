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
        title: 'Numbers 1-20',
        level: 'beginner',
        words: [
          { pt: 'Um', en: 'One', audio: 'um' },
          { pt: 'Dois', en: 'Two', audio: 'dois' },
          { pt: 'Três', en: 'Three', audio: 'tres' },
          { pt: 'Quatro', en: 'Four', audio: 'quatro' },
          { pt: 'Cinco', en: 'Five', audio: 'cinco' },
          { pt: 'Seis', en: 'Six', audio: 'seis' },
          { pt: 'Sete', en: 'Seven', audio: 'sete' },
          { pt: 'Oito', en: 'Eight', audio: 'oito' },
          { pt: 'Nove', en: 'Nine', audio: 'nove' },
          { pt: 'Dez', en: 'Ten', audio: 'dez' },
          { pt: 'Onze', en: 'Eleven', audio: 'onze' },
          { pt: 'Doze', en: 'Twelve', audio: 'doze' },
          { pt: 'Treze', en: 'Thirteen', audio: 'treze' },
          { pt: 'Catorze', en: 'Fourteen', audio: 'catorze' },
          { pt: 'Quinze', en: 'Fifteen', audio: 'quinze' },
          { pt: 'Dezasseis', en: 'Sixteen', audio: 'dezasseis' },
          { pt: 'Dezassete', en: 'Seventeen', audio: 'dezassete' },
          { pt: 'Dezoito', en: 'Eighteen', audio: 'dezoito' },
          { pt: 'Dezanove', en: 'Nineteen', audio: 'dezanove' },
          { pt: 'Vinte', en: 'Twenty', audio: 'vinte' }
        ],
        sentences: [
          { pt: 'Tenho três bilhetes.', en: 'I have three tickets.' },
          { pt: 'São quinze euros, por favor.', en: 'It is fifteen euros, please.' },
          { pt: 'Ele tem vinte anos.', en: 'He is twenty years old.' }
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
  },
  {
    id: 'fundamentals',
    title: 'Language Fundamentals',
    gated: false,
    lessons: [
      {
        id: 17,
        title: 'Days of the Week',
        level: 'beginner',
        words: [
          { pt: 'Segunda-feira', en: 'Monday', audio: 'segunda-feira' },
          { pt: 'Terça-feira', en: 'Tuesday', audio: 'terca-feira' },
          { pt: 'Quarta-feira', en: 'Wednesday', audio: 'quarta-feira' },
          { pt: 'Quinta-feira', en: 'Thursday', audio: 'quinta-feira' },
          { pt: 'Sexta-feira', en: 'Friday', audio: 'sexta-feira' },
          { pt: 'Sábado', en: 'Saturday', audio: 'sabado' },
          { pt: 'Domingo', en: 'Sunday', audio: 'domingo' },
          { pt: 'Dia', en: 'Day', audio: 'dia' },
          { pt: 'Semana', en: 'Week', audio: 'semana' },
          { pt: 'Fim de semana', en: 'Weekend', audio: 'fim-semana' }
        ],
        sentences: [
          { pt: 'A reunião é na segunda-feira.', en: 'The meeting is on Monday.' },
          { pt: 'Sexta-feira é o meu dia favorito!', en: 'Friday is my favorite day!' },
          { pt: 'O que fazes ao fim de semana?', en: 'What do you do on the weekend?' }
        ]
      },
      {
        id: 18,
        title: 'Months of the Year',
        level: 'beginner',
        words: [
          { pt: 'Janeiro', en: 'January', audio: 'janeiro' },
          { pt: 'Fevereiro', en: 'February', audio: 'fevereiro' },
          { pt: 'Março', en: 'March', audio: 'marco' },
          { pt: 'Abril', en: 'April', audio: 'abril' },
          { pt: 'Maio', en: 'May', audio: 'maio' },
          { pt: 'Junho', en: 'June', audio: 'junho' },
          { pt: 'Julho', en: 'July', audio: 'julho' },
          { pt: 'Agosto', en: 'August', audio: 'agosto' },
          { pt: 'Setembro', en: 'September', audio: 'setembro' },
          { pt: 'Outubro', en: 'October', audio: 'outubro' },
          { pt: 'Novembro', en: 'November', audio: 'novembro' },
          { pt: 'Dezembro', en: 'December', audio: 'dezembro' },
          { pt: 'Mês', en: 'Month', audio: 'mes' },
          { pt: 'Ano', en: 'Year', audio: 'ano' }
        ],
        sentences: [
          { pt: 'Nasci em janeiro.', en: 'I was born in January.' },
          { pt: 'O Natal é em dezembro.', en: 'Christmas is in December.' },
          { pt: 'Este mês é muito ocupado.', en: 'This month is very busy.' }
        ]
      },
      {
        id: 19,
        title: 'Numbers 20-100',
        level: 'beginner',
        words: [
          { pt: 'Vinte e um', en: 'Twenty-one', audio: 'vinte-um' },
          { pt: 'Trinta', en: 'Thirty', audio: 'trinta' },
          { pt: 'Quarenta', en: 'Forty', audio: 'quarenta' },
          { pt: 'Cinquenta', en: 'Fifty', audio: 'cinquenta' },
          { pt: 'Sessenta', en: 'Sixty', audio: 'sessenta' },
          { pt: 'Setenta', en: 'Seventy', audio: 'setenta' },
          { pt: 'Oitenta', en: 'Eighty', audio: 'oitenta' },
          { pt: 'Noventa', en: 'Ninety', audio: 'noventa' },
          { pt: 'Cem', en: 'One hundred', audio: 'cem' },
          { pt: 'Mil', en: 'One thousand', audio: 'mil' }
        ],
        sentences: [
          { pt: 'Isso custa trinta e cinco euros.', en: 'That costs thirty-five euros.' },
          { pt: 'Ela tem cinquenta anos.', en: 'She is fifty years old.' },
          { pt: 'São cem quilómetros até Lisboa.', en: 'It is one hundred kilometers to Lisbon.' }
        ]
      },
      {
        id: 20,
        title: 'Time & Clock',
        level: 'beginner',
        words: [
          { pt: 'Hora', en: 'Hour', audio: 'hora' },
          { pt: 'Minuto', en: 'Minute', audio: 'minuto' },
          { pt: 'Segundo', en: 'Second', audio: 'segundo' },
          { pt: 'Meio-dia', en: 'Noon', audio: 'meio-dia' },
          { pt: 'Meia-noite', en: 'Midnight', audio: 'meia-noite' },
          { pt: 'De manhã', en: 'In the morning', audio: 'de-manha' },
          { pt: 'À tarde', en: 'In the afternoon', audio: 'a-tarde' },
          { pt: 'À noite', en: 'At night', audio: 'a-noite' },
          { pt: 'Agora', en: 'Now', audio: 'agora' },
          { pt: 'Mais tarde', en: 'Later', audio: 'mais-tarde' }
        ],
        sentences: [
          { pt: 'Que horas são?', en: 'What time is it?' },
          { pt: 'São três da tarde.', en: 'It is three in the afternoon.' },
          { pt: 'O voo parte ao meio-dia.', en: 'The flight leaves at noon.' }
        ]
      },
      {
        id: 21,
        title: 'Colors',
        level: 'beginner',
        words: [
          { pt: 'Vermelho', en: 'Red', audio: 'vermelho' },
          { pt: 'Azul', en: 'Blue', audio: 'azul' },
          { pt: 'Verde', en: 'Green', audio: 'verde' },
          { pt: 'Amarelo', en: 'Yellow', audio: 'amarelo' },
          { pt: 'Laranja', en: 'Orange', audio: 'laranja' },
          { pt: 'Roxo', en: 'Purple', audio: 'roxo' },
          { pt: 'Cor-de-rosa', en: 'Pink', audio: 'cor-rosa' },
          { pt: 'Branco', en: 'White', audio: 'branco' },
          { pt: 'Preto', en: 'Black', audio: 'preto' },
          { pt: 'Cinzento', en: 'Grey', audio: 'cinzento' }
        ],
        sentences: [
          { pt: 'O céu é azul.', en: 'The sky is blue.' },
          { pt: 'Gosto do vestido vermelho.', en: 'I like the red dress.' },
          { pt: 'A relva é verde.', en: 'The grass is green.' }
        ]
      },
      {
        id: 22,
        title: 'Family Members',
        level: 'beginner',
        words: [
          { pt: 'Mãe', en: 'Mother', audio: 'mae' },
          { pt: 'Pai', en: 'Father', audio: 'pai' },
          { pt: 'Filho', ptFem: 'Filha', en: 'Son / Daughter', audio: 'filho', gendered: true },
          { pt: 'Irmão', ptFem: 'Irmã', en: 'Brother / Sister', audio: 'irmao', gendered: true },
          { pt: 'Avô', ptFem: 'Avó', en: 'Grandfather / Grandmother', audio: 'avo', gendered: true },
          { pt: 'Tio', ptFem: 'Tia', en: 'Uncle / Aunt', audio: 'tio', gendered: true },
          { pt: 'Primo', ptFem: 'Prima', en: 'Cousin (male/female)', audio: 'primo', gendered: true },
          { pt: 'Marido', en: 'Husband', audio: 'marido' },
          { pt: 'Mulher', en: 'Wife', audio: 'mulher' },
          { pt: 'Família', en: 'Family', audio: 'familia' }
        ],
        sentences: [
          { pt: 'A minha mãe chama-se Maria.', en: 'My mother is called Maria.' },
          { pt: 'Tenho dois irmãos.', en: 'I have two brothers.' },
          { pt: 'A família está toda reunida.', en: 'The whole family is gathered.' }
        ]
      },
      {
        id: 23,
        title: 'Common Verbs',
        level: 'beginner',
        words: [
          { pt: 'Ser', en: 'To be (permanent)', audio: 'ser' },
          { pt: 'Estar', en: 'To be (temporary)', audio: 'estar' },
          { pt: 'Ter', en: 'To have', audio: 'ter' },
          { pt: 'Fazer', en: 'To do/make', audio: 'fazer' },
          { pt: 'Ir', en: 'To go', audio: 'ir' },
          { pt: 'Vir', en: 'To come', audio: 'vir' },
          { pt: 'Poder', en: 'To be able to/can', audio: 'poder' },
          { pt: 'Querer', en: 'To want', audio: 'querer' },
          { pt: 'Saber', en: 'To know (facts)', audio: 'saber' },
          { pt: 'Conhecer', en: 'To know (people/places)', audio: 'conhecer' }
        ],
        sentences: [
          { pt: 'Eu sou português.', en: 'I am Portuguese.' },
          { pt: 'Estou cansado hoje.', en: 'I am tired today.' },
          { pt: 'Quero aprender português.', en: 'I want to learn Portuguese.' }
        ]
      },
      {
        id: 24,
        title: 'Seasons & Weather',
        level: 'beginner',
        words: [
          { pt: 'Primavera', en: 'Spring', audio: 'primavera' },
          { pt: 'Verão', en: 'Summer', audio: 'verao' },
          { pt: 'Outono', en: 'Autumn/Fall', audio: 'outono' },
          { pt: 'Inverno', en: 'Winter', audio: 'inverno' },
          { pt: 'Sol', en: 'Sun', audio: 'sol' },
          { pt: 'Chuva', en: 'Rain', audio: 'chuva' },
          { pt: 'Vento', en: 'Wind', audio: 'vento' },
          { pt: 'Nuvem', en: 'Cloud', audio: 'nuvem' },
          { pt: 'Quente', en: 'Hot', audio: 'quente' },
          { pt: 'Frio', en: 'Cold', audio: 'frio' }
        ],
        sentences: [
          { pt: 'O verão em Portugal é muito quente.', en: 'Summer in Portugal is very hot.' },
          { pt: 'Está a chover.', en: 'It is raining.' },
          { pt: 'Hoje está sol e calor.', en: 'Today it is sunny and warm.' }
        ]
      },
      {
        id: 25,
        title: 'Question Words',
        level: 'beginner',
        words: [
          { pt: 'O quê?', en: 'What?', audio: 'o-que' },
          { pt: 'Quem?', en: 'Who?', audio: 'quem' },
          { pt: 'Onde?', en: 'Where?', audio: 'onde' },
          { pt: 'Quando?', en: 'When?', audio: 'quando' },
          { pt: 'Porquê?', en: 'Why?', audio: 'porque' },
          { pt: 'Como?', en: 'How?', audio: 'como' },
          { pt: 'Quanto?', en: 'How much?', audio: 'quanto' },
          { pt: 'Qual?', en: 'Which?', audio: 'qual' }
        ],
        sentences: [
          { pt: 'O que estás a fazer?', en: 'What are you doing?' },
          { pt: 'Onde fica a estação?', en: 'Where is the station?' },
          { pt: 'Quando chega o comboio?', en: 'When does the train arrive?' },
          { pt: 'Como se chama?', en: 'What is your name?' }
        ]
      },
      {
        id: 26,
        title: 'Common Adjectives',
        level: 'beginner',
        words: [
          { pt: 'Grande', en: 'Big/Large', audio: 'grande' },
          { pt: 'Pequeno', en: 'Small', audio: 'pequeno' },
          { pt: 'Bom', ptFem: 'Boa', en: 'Good', audio: 'bom', gendered: true },
          { pt: 'Mau', ptFem: 'Má', en: 'Bad', audio: 'mau', gendered: true },
          { pt: 'Novo', en: 'New/Young', audio: 'novo' },
          { pt: 'Velho', en: 'Old', audio: 'velho' },
          { pt: 'Bonito', en: 'Beautiful', audio: 'bonito' },
          { pt: 'Fácil', en: 'Easy', audio: 'facil' },
          { pt: 'Difícil', en: 'Difficult', audio: 'dificil' },
          { pt: 'Rápido', en: 'Fast', audio: 'rapido' }
        ],
        sentences: [
          { pt: 'Lisboa é uma cidade grande e bonita.', en: 'Lisbon is a big and beautiful city.' },
          { pt: 'Português não é muito difícil.', en: 'Portuguese is not very difficult.' },
          { pt: 'O café é bom aqui.', en: 'The coffee is good here.' }
        ]
      }
    ]
  }
];

export function getAllLessonsFlat() {
  return topics.flatMap(topic => topic.lessons.map(lesson => ({ ...lesson, topicId: topic.id, topicTitle: topic.title, gated: topic.gated })));
}
