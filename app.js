// Portuguese Learning App - Main Logic

const APP_VERSION = '0.1.0';
const STORAGE_KEY = 'portugueseLearningData';

const userData = {
    learnedWords: [],
    streak: 0,
    isPremium: false,
    voicePreference: 'female',
    lessonsCompleted: 0,
    completedLessonIds: [],
    theme: 'light'
};

// Sample beginner Portuguese words with European Portuguese focus
const lessons = [
    {
        id: 1,
        title: 'Basic Greetings',
        level: 'beginner',
        words: [
            { pt: 'Olá', en: 'Hello', audio: 'ola' },
            { pt: 'Bom dia', en: 'Good morning', audio: 'bom-dia' },
            { pt: 'Boa tarde', en: 'Good afternoon', audio: 'boa-tarde' },
            { pt: 'Boa noite', en: 'Good night', audio: 'boa-noite' },
            { pt: 'Adeus', en: 'Goodbye', audio: 'adeus' },
            { pt: 'Até logo', en: 'See you later', audio: 'ate-logo' }
        ]
    },
    {
        id: 2,
        title: 'Essential Words',
        level: 'beginner',
        words: [
            { pt: 'Sim', en: 'Yes', audio: 'sim' },
            { pt: 'Não', en: 'No', audio: 'nao' },
            { pt: 'Por favor', en: 'Please', audio: 'por-favor' },
            { pt: 'Obrigado', en: 'Thank you (m)', audio: 'obrigado' },
            { pt: 'Obrigada', en: 'Thank you (f)', audio: 'obrigada' },
            { pt: 'Desculpe', en: 'Sorry/Excuse me', audio: 'desculpe' }
        ]
    },
    {
        id: 3,
        title: 'Numbers 1-10',
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
            { pt: 'Dez', en: 'Ten', audio: 'dez' }
        ]
    },
    {
        id: 4,
        title: 'Common Verbs',
        level: 'beginner',
        words: [
            { pt: 'Ser/Estar', en: 'To be', audio: 'ser-estar' },
            { pt: 'Ter', en: 'To have', audio: 'ter' },
            { pt: 'Fazer', en: 'To do/make', audio: 'fazer' },
            { pt: 'Ir', en: 'To go', audio: 'ir' },
            { pt: 'Falar', en: 'To speak', audio: 'falar' },
            { pt: 'Comer', en: 'To eat', audio: 'comer' }
        ]
    },
    {
        id: 5,
        title: 'Family Members',
        level: 'beginner',
        words: [
            { pt: 'Mãe', en: 'Mother', audio: 'mae' },
            { pt: 'Pai', en: 'Father', audio: 'pai' },
            { pt: 'Irmão', en: 'Brother', audio: 'irmao' },
            { pt: 'Irmã', en: 'Sister', audio: 'irma' },
            { pt: 'Filho', en: 'Son', audio: 'filho' },
            { pt: 'Filha', en: 'Daughter', audio: 'filha' }
        ]
    },
    {
        id: 6,
        title: 'Travel Essentials',
        level: 'intermediate',
        words: [
            { pt: 'Aeroporto', en: 'Airport', audio: 'aeroporto' },
            { pt: 'Comboio', en: 'Train', audio: 'comboio' },
            { pt: 'Bilhete', en: 'Ticket', audio: 'bilhete' },
            { pt: 'Hotel', en: 'Hotel', audio: 'hotel' },
            { pt: 'Reservar', en: 'To book/reserve', audio: 'reservar' },
            { pt: 'Direita/Esquerda', en: 'Right/Left', audio: 'direita-esquerda' }
        ]
    }
];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    renderLessons();
    setupEventListeners();
    setupNavigation();
    renderVersion();
    applyTheme(userData.theme);
});

function loadUserData() {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('portuguesiLearningData');
    if (saved) {
        Object.assign(userData, JSON.parse(saved));
        if (!Array.isArray(userData.completedLessonIds)) {
            userData.completedLessonIds = [];
        }
    }
    userData.lessonsCompleted = userData.completedLessonIds.length;
    if (!userData.theme) {
        userData.theme = 'light';
    }
    updateDashboard();
}

function saveUserData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
}

function renderLessons() {
    const grid = document.getElementById('lessonGrid');
    grid.innerHTML = '';
    
    lessons.forEach(lesson => {
        const card = document.createElement('div');
        card.className = 'lesson-card';
        card.innerHTML = `
            <h3>${lesson.title}</h3>
            <p class="word-count">${lesson.words.length} words</p>
            <p>Level: ${lesson.level}</p>
            ${!userData.isPremium && lesson.id > 5 ? '<span class="badge-premium">Premium</span>' : ''}
            ${userData.completedLessonIds.includes(lesson.id) ? '<span class="badge-completed">Completed</span>' : ''}
        `;
        card.addEventListener('click', () => startLesson(lesson));
        grid.appendChild(card);
    });
}

function startLesson(lesson) {
    // Check for premium content (lessons 6+)
    if (lesson.id > 5 && !userData.isPremium) {
        showPaywall();
        return;
    }
    
    // Create lesson interface
    const section = document.querySelector('.learning-section');
    section.innerHTML = `
        <button class="btn-back" onclick="backToLessons()">← Back to Lessons</button>
        <h2>${lesson.title}</h2>
        <div class="lesson-words" id="lessonWords"></div>
        <button class="btn-complete" onclick="completeLesson(${lesson.id})">Complete Lesson</button>
    `;
    
    const wordsContainer = document.getElementById('lessonWords');
    lesson.words.forEach(word => {
        const wordCard = createWordCard(word);
        wordsContainer.appendChild(wordCard);
    });
}

function createWordCard(word) {
    const card = document.createElement('div');
    card.className = 'word-card';
    card.innerHTML = `
        <div class="portuguese">${word.pt}</div>
        <div class="english">${word.en}</div>
        <span class="audio-icon" title="Play audio">🔊</span>
    `;
    
    // Audio playback on hover and click
    const audioIcon = card.querySelector('.audio-icon');
    const playAudio = () => speakWord(word.pt);
    
    card.addEventListener('click', playAudio);
    audioIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        playAudio();
    });

    card.addEventListener('click', () => animateCard(card));
    
    return card;
}

function speakWord(text) {
    // Use Web Speech API for text-to-speech
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-PT'; // European Portuguese
        utterance.rate = 0.8; // Slightly slower for learning
        
        // Try to select appropriate voice
        const voices = speechSynthesis.getVoices();
        const portugueseVoice = voices.find(voice => 
            voice.lang.includes('pt-PT') && 
            (userData.voicePreference === 'female' ? voice.name.includes('female') || voice.name.includes('Female') : voice.name.includes('male') || voice.name.includes('Male'))
        ) || voices.find(voice => voice.lang.includes('pt-PT'));
        
        if (portugueseVoice) {
            utterance.voice = portugueseVoice;
        }
        
        speechSynthesis.speak(utterance);
    }
}

// Load voices when available
speechSynthesis.addEventListener('voiceschanged', () => {
    const voices = speechSynthesis.getVoices();
    console.log('Available Portuguese voices:', voices.filter(v => v.lang.includes('pt')));
});

function completeLesson(lessonId) {
    const lesson = lessons.find(l => l.id === lessonId);
    
    // Add words to learned vault
    lesson.words.forEach(word => {
        if (!userData.learnedWords.find(w => w.pt === word.pt)) {
            userData.learnedWords.push(word);
        }
    });
    
    if (!userData.completedLessonIds.includes(lessonId)) {
        userData.completedLessonIds.push(lessonId);
    }
    userData.lessonsCompleted = userData.completedLessonIds.length;
    userData.streak++;
    saveUserData();
    updateDashboard();
    
    alert(`🎉 Congratulations! You've completed "${lesson.title}"!\n\nWords learned: ${lesson.words.length}`);
    backToLessons();
}

function backToLessons() {
    const section = document.querySelector('.learning-section');
    section.innerHTML = `
        <h2>Begin Your Journey</h2>
        <div class="lesson-grid" id="lessonGrid"></div>
    `;
    renderLessons();
}

function updateDashboard() {
    document.getElementById('totalWords').textContent = userData.learnedWords.length;
    document.getElementById('streak').textContent = userData.streak;
    document.getElementById('accountStatus').textContent = userData.isPremium ? 'Premium Member' : 'Free Plan';
    
    const availableLessons = getAvailableLessonCount();
    const progress = availableLessons === 0 ? 0 : (Math.min(userData.lessonsCompleted, availableLessons) / availableLessons) * 100;
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = Math.round(progress) + '% Complete';
    
    // Render learned words in vault
    const wordList = document.getElementById('wordList');
    wordList.innerHTML = '';
    userData.learnedWords.forEach(word => {
        const wordCard = createWordCard(word);
        wordList.appendChild(wordCard);
    });
}

function showPaywall() {
    document.getElementById('paywall').style.display = 'flex';
}

function hidePaywall() {
    document.getElementById('paywall').style.display = 'none';
}

function setupEventListeners() {
    document.getElementById('premiumBtn').addEventListener('click', showPaywall);
    document.querySelector('.close-paywall').addEventListener('click', hidePaywall);
    document.getElementById('startBtn').addEventListener('click', () => {
        document.getElementById('learn').scrollIntoView({ behavior: 'smooth' });
    });

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const next = userData.theme === 'light' ? 'dark' : 'light';
            userData.theme = next;
            saveUserData();
            applyTheme(next);
            updateThemeToggle();
        });
        updateThemeToggle();
    }

    const upgradeBtn = document.querySelector('.btn-upgrade');
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', showPaywall);
    }
    
    // Voice preference
    document.querySelectorAll('input[name="voice"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            userData.voicePreference = e.target.value;
            saveUserData();
        });
    });
    
    // Set current voice preference
    document.querySelector(`input[value="${userData.voicePreference}"]`).checked = true;

    const reviewBtn = document.getElementById('reviewBtn');
    if (reviewBtn) {
        reviewBtn.addEventListener('click', startReviewQuiz);
    }

    const resetBtn = document.getElementById('resetProgressBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetProgress);
    }
}

function setupNavigation() {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('href').substring(1);
            
            // Hide all sections
            document.querySelectorAll('section').forEach(section => {
                section.style.display = 'none';
            });
            
            // Show target section
            const targetSection = document.getElementById(target);
            if (targetSection) {
                targetSection.style.display = 'block';
                
                // Update vault if navigating to it
                if (target === 'vault' || target === 'dashboard') {
                    updateDashboard();
                }
            }
        });
    });
}

// Premium subscription (placeholder)
document.addEventListener('DOMContentLoaded', () => {
    const subscribeBtn = document.querySelector('.btn-subscribe');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', () => {
            alert('Payment integration would go here.\nFor demo purposes, premium access granted!');
            userData.isPremium = true;
            saveUserData();
            updateDashboard();
            hidePaywall();
        });
    }
});

function startReviewQuiz() {
    if (!userData.learnedWords.length) {
        alert('Learn a lesson first to unlock review quizzes.');
        return;
    }

    const quizContainer = document.getElementById('reviewQuiz');
    const resultContainer = document.getElementById('reviewResult');
    quizContainer.innerHTML = '';
    resultContainer.textContent = '';
    resultContainer.className = 'review-result';

    const totalQuestions = Math.min(5, userData.learnedWords.length);
    const questionPool = shuffle([...userData.learnedWords]).slice(0, totalQuestions);
    let currentIndex = 0;
    let score = 0;

    renderQuestion();

    function renderQuestion() {
        const current = questionPool[currentIndex];
        const options = generateOptions(current, userData.learnedWords);

        quizContainer.innerHTML = `
            <div class="quiz-header">
                <span>Question ${currentIndex + 1} of ${totalQuestions}</span>
                <span>Score: ${score}</span>
            </div>
            <div class="quiz-question">What does "${current.pt}" mean?</div>
            <div class="quiz-options">
                ${options.map(opt => `<button class="quiz-option" data-answer="${opt.en}" ${opt.correct ? 'data-correct="true"' : ''}>${opt.en}</button>`).join('')}
            </div>
            <div class="quiz-actions">
                <button class="btn-next" id="nextQuestion" disabled>${currentIndex === totalQuestions - 1 ? 'Finish' : 'Next'}</button>
            </div>
        `;

        const optionButtons = quizContainer.querySelectorAll('.quiz-option');
        optionButtons.forEach(button => {
            button.addEventListener('click', () => handleAnswer(button));
        });

        document.getElementById('nextQuestion').addEventListener('click', () => {
            currentIndex++;
            if (currentIndex < totalQuestions) {
                renderQuestion();
            } else {
                finishQuiz();
            }
        });
    }

    function handleAnswer(button) {
        const isCorrect = button.hasAttribute('data-correct');
        const optionButtons = quizContainer.querySelectorAll('.quiz-option');
        optionButtons.forEach(btn => {
            btn.disabled = true;
            if (btn.hasAttribute('data-correct')) {
                btn.classList.add('correct');
            }
        });

        if (isCorrect) {
            score++;
            button.classList.add('correct');
            resultContainer.textContent = '✅ Correct!';
            resultContainer.className = 'review-result success';
        } else {
            button.classList.add('incorrect');
            const correct = quizContainer.querySelector('.quiz-option[data-correct="true"]');
            resultContainer.textContent = `❌ Not quite. Correct answer: ${correct?.dataset.answer || 'n/a'}`;
            resultContainer.className = 'review-result error';
        }

        document.getElementById('nextQuestion').disabled = false;
    }

    function finishQuiz() {
        quizContainer.innerHTML = '';
        resultContainer.textContent = `Session complete: ${score}/${totalQuestions} correct.`;
        resultContainer.className = 'review-result success';
    }
}

function resetProgress() {
    const confirmed = confirm('Reset all progress, streak, and learned words?');
    if (!confirmed) return;

    userData.learnedWords = [];
    userData.streak = 0;
    userData.lessonsCompleted = 0;
    userData.completedLessonIds = [];
    saveUserData();
    updateDashboard();
    backToLessons();
}

function getAvailableLessonCount() {
    return userData.isPremium ? lessons.length : lessons.filter(l => l.id <= 5).length;
}

function renderVersion() {
    const versionEl = document.getElementById('appVersion');
    if (versionEl) {
        versionEl.textContent = `v${APP_VERSION}`;
    }
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }
}

function updateThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    const isDark = userData.theme === 'dark';
    themeToggle.textContent = isDark ? 'Light Mode' : 'Dark Mode';
}

function animateCard(card) {
    card.classList.remove('pulse');
    void card.offsetWidth; // restart animation
    card.classList.add('pulse');
}

function shuffle(array) {
    return array
        .map(item => ({ item, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ item }) => item);
}

function generateOptions(correctWord, pool) {
    const otherWords = pool.filter(w => w.pt !== correctWord.pt);
    const shuffledOthers = shuffle(otherWords).slice(0, 3);
    const combined = shuffle([correctWord, ...shuffledOthers]).map(word => ({
        en: word.en,
        correct: word.pt === correctWord.pt
    }));
    return combined;
}
