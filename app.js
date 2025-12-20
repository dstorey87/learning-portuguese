import { topics, getAllLessonsFlat } from './data.js';
import { speakWithEngine, getPortugueseVoiceOptions, getLastVoiceUsed } from './audio.js';

const APP_VERSION = '0.4.0';
const STORAGE_KEY = 'portugueseLearningData';
const VOICE_STORAGE_KEY = 'portugueseVoiceSettings';
const DEMO_PHRASE = 'Olá! Vamos praticar português europeu: pão, coração, obrigado, vinte e oito.';

const userData = {
    learnedWords: [],
    streak: 0,
    isPremium: false,
    speakerGender: 'male',
    lessonsCompleted: 0,
    activeLesson: null
};

const uiState = {
    selectedTopic: 'all'
};

const vaultFilters = {
    query: '',
    sort: 'pt'
};

const voiceDefaults = {
    selectedSource: 'auto',
    selectedVoiceKey: null,
    allowBundled: true,
    bundled: { downloaded: false, downloading: false, progress: 0 },
    detectedSystemOptions: []
};

const voiceState = structuredClone(voiceDefaults);
let bundledDownloadTimer = null;

document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    renderVersion();
    renderTopicFilters();
    renderLessons();
    hookSpeakerRadios();
    setupEventListeners();
    setupNavigation();
    setupVoiceSettings();
    updateDashboard();
});

function loadUserData() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) Object.assign(userData, JSON.parse(saved));
    } catch (error) {
        console.warn('Unable to load user data', error);
    }
    if (!Array.isArray(userData.learnedWords)) userData.learnedWords = [];
    if (!userData.speakerGender) userData.speakerGender = 'male';
    if (typeof userData.lessonsCompleted !== 'number') userData.lessonsCompleted = 0;
}

function saveUserData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
        console.warn('Unable to save user data', error);
    }
}

function loadVoiceSettings() {
    const base = structuredClone(voiceDefaults);
    try {
        const savedRaw = localStorage.getItem(VOICE_STORAGE_KEY);
        if (!savedRaw) return base;
        const parsed = JSON.parse(savedRaw);
        return {
            ...base,
            ...parsed,
            bundled: {
                ...base.bundled,
                ...(parsed.bundled || {})
            },
            detectedSystemOptions: Array.isArray(parsed.detectedSystemOptions) ? parsed.detectedSystemOptions : [],
            selectedVoiceKey: parsed.selectedVoiceKey || parsed.voiceKey || base.selectedVoiceKey,
            selectedSource: parsed.selectedSource || base.selectedSource,
            allowBundled: typeof parsed.allowBundled === 'boolean' ? parsed.allowBundled : base.allowBundled
        };
    } catch (error) {
        console.warn('Unable to read voice settings', error);
        return base;
    }
}

function saveVoiceSettings(settings) {
    try {
        localStorage.setItem(VOICE_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.warn('Unable to persist voice settings', error);
    }
}

function renderVersion() {
    const versionEl = document.getElementById('appVersion');
    if (versionEl) versionEl.textContent = `v${APP_VERSION}`;
}

function renderTopicFilters() {
    const container = document.getElementById('topicFilters');
    if (!container) return;
    const topicList = ['all', ...topics.map(t => t.id)];
    container.innerHTML = topicList
        .map(id => {
            const label = id === 'all' ? 'All Topics' : topics.find(t => t.id === id)?.title || id;
            const active = uiState.selectedTopic === id ? 'active' : '';
            return `<button class="topic-chip ${active}" data-topic="${id}">${label}</button>`;
        })
        .join('');

    container.querySelectorAll('.topic-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            uiState.selectedTopic = btn.dataset.topic;
            renderTopicFilters();
            renderLessons();
        });
    });
}

function renderLessons() {
    const grid = document.getElementById('lessonGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const lessons = getAllLessonsFlat().filter(lesson => {
        if (uiState.selectedTopic !== 'all' && lesson.topicId !== uiState.selectedTopic) return false;
        if (!userData.isPremium && lesson.gated) return false;
        return true;
    });

    lessons.forEach(lesson => {
        const card = document.createElement('div');
        card.className = 'lesson-card';
        card.innerHTML = `
            <div class="lesson-meta">${lesson.topicTitle} · ${lesson.level}</div>
            <h3>${lesson.title}</h3>
            <p class="word-count">${lesson.words.length} words • ${lesson.sentences?.length || 0} sentences</p>
            ${lesson.gated ? '<span class="badge-premium">Premium</span>' : ''}
            ${userData.activeLesson === lesson.id ? '<span class="badge-active">In progress</span>' : ''}
        `;
        card.addEventListener('click', () => startLesson(lesson.id));
        grid.appendChild(card);
    });

    if (!lessons.length) {
        grid.innerHTML = '<p class="muted">No lessons available for this filter.</p>';
    }
}

function startLesson(lessonId) {
    const lesson = getAllLessonsFlat().find(l => l.id === lessonId);
    if (!lesson) return;
    if (lesson.gated && !userData.isPremium) {
        showPaywall();
        return;
    }

    userData.activeLesson = lessonId;
    saveUserData();

    const section = document.querySelector('.learning-section');
    if (!section) return;
    section.innerHTML = `
        <div class="lesson-header">
            <button class="btn-back" id="backToLessons">← Back</button>
            <div>
                <p class="lesson-meta">${lesson.topicTitle} · ${lesson.level}</p>
                <h2>${lesson.title}</h2>
            </div>
        </div>
        <div class="lesson-words" id="lessonWords"></div>
        <div class="lesson-sentences" id="lessonSentences"></div>
        <div class="lesson-actions">
            <button class="btn-complete" id="completeLesson">Mark Lesson Complete</button>
        </div>
    `;

    document.getElementById('backToLessons').addEventListener('click', backToLessons);
    document.getElementById('completeLesson').addEventListener('click', () => completeLesson(lesson));

    const wordsContainer = document.getElementById('lessonWords');
    lesson.words.forEach(word => {
        const wordCard = createWordCard(word);
        wordsContainer.appendChild(wordCard);
    });

    const sentencesContainer = document.getElementById('lessonSentences');
    (lesson.sentences || []).forEach(sentence => {
        const card = document.createElement('div');
        card.className = 'sentence-card';
        card.innerHTML = `
            <div class="sentence-pt">${sentence.pt}</div>
            <div class="sentence-en">${sentence.en}</div>
        `;
        sentencesContainer.appendChild(card);
    });
}

function createWordCard(word) {
    const resolved = resolveWordForm(word, userData.speakerGender);
    const alt = getAlternateForm(word, userData.speakerGender);
    const card = document.createElement('div');
    card.className = 'word-card';
    card.innerHTML = `
        <div class="portuguese">${resolved}</div>
        <div class="english">${word.en}</div>
        ${alt ? `<div class="alt-form">Alternate: ${alt}</div>` : ''}
    `;
    card.addEventListener('click', () => {
        playPortugueseText(resolved, { rate: 0.9 });
    });
    return card;
}

function resolveWordForm(word, speakerGender) {
    if (word.gendered && speakerGender === 'female' && word.ptFem) return word.ptFem;
    return word.pt;
}

function getAlternateForm(word, speakerGender) {
    if (!word.gendered) return '';
    if (speakerGender === 'female' && word.pt) return word.pt;
    if (speakerGender === 'male' && word.ptFem) return word.ptFem;
    return '';
}

function getWordKey(word) {
    return `${word.pt}|${word.en}`;
}

function completeLesson(lesson) {
    lesson.words.forEach(word => {
        const resolved = resolveWordForm(word, userData.speakerGender);
        const key = getWordKey(word);
        const exists = userData.learnedWords.find(w => getWordKey(w) === key);
        if (!exists) {
            userData.learnedWords.push({ ...word, pt: resolved, resolvedFrom: word.pt, genderUsed: userData.speakerGender });
        }
    });

    userData.lessonsCompleted += 1;
    userData.streak += 1;
    saveUserData();
    updateDashboard();

    alert(`🎉 Lesson complete! You learned ${lesson.words.length} words.`);
    backToLessons();
}

function backToLessons() {
    const section = document.querySelector('.learning-section');
    if (!section) return;
    section.innerHTML = `
        <div class="learning-header">
            <div>
                <h2>Begin Your Journey</h2>
                <p class="muted">Pick a topic and start listening.</p>
            </div>
            <div class="speaker-toggle">
                <label><input type="radio" name="speakerGender" value="male" ${userData.speakerGender === 'male' ? 'checked' : ''}> Male form</label>
                <label><input type="radio" name="speakerGender" value="female" ${userData.speakerGender === 'female' ? 'checked' : ''}> Female form</label>
            </div>
        </div>
        <div class="topics-bar" id="topicFilters"></div>
        <div class="lesson-grid" id="lessonGrid"></div>
    `;
    renderTopicFilters();
    renderLessons();
    hookSpeakerRadios();
}

function hookSpeakerRadios() {
    document.querySelectorAll('input[name="speakerGender"]').forEach(radio => {
        radio.addEventListener('change', e => {
            userData.speakerGender = e.target.value;
            saveUserData();
            renderLessons();
            renderVault();
        });
    });
}

function updateDashboard() {
    const totalWordsEl = document.getElementById('totalWords');
    const streakEl = document.getElementById('streak');
    const statusEl = document.getElementById('accountStatus');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    if (totalWordsEl) totalWordsEl.textContent = userData.learnedWords.length;
    if (streakEl) streakEl.textContent = userData.streak;
    if (statusEl) statusEl.textContent = userData.isPremium ? 'Premium Member' : 'Free Plan';

    const allLessons = getAllLessonsFlat().filter(l => !l.gated || userData.isPremium);
    const progress = allLessons.length ? Math.min(userData.lessonsCompleted, allLessons.length) / allLessons.length * 100 : 0;
    if (progressFill) progressFill.style.width = `${progress}%`;
    if (progressText) progressText.textContent = `${Math.round(progress)}% Complete`;

    renderVault();
}

function renderVault() {
    const wordList = document.getElementById('wordList');
    if (!wordList) return;
    const search = vaultFilters.query.trim().toLowerCase();

    const filtered = userData.learnedWords
        .filter(word => {
            if (!search) return true;
            const tokens = [word.pt, word.en, word.resolvedFrom].filter(Boolean).join(' ').toLowerCase();
            return tokens.includes(search);
        })
        .sort((a, b) => {
            const key = vaultFilters.sort === 'en' ? 'en' : 'pt';
            return (a[key] || '').localeCompare(b[key] || '');
        });

    wordList.innerHTML = '';
    filtered.forEach(word => {
        const card = document.createElement('div');
        card.className = 'word-card';
        card.innerHTML = `
            <div class="portuguese">${word.pt}</div>
            <div class="english">${word.en}</div>
            ${word.resolvedFrom && word.resolvedFrom !== word.pt ? `<div class="alt-form">Base: ${word.resolvedFrom}</div>` : ''}
        `;
        wordList.appendChild(card);
    });

    setActiveSortButton(vaultFilters.sort);
}

function startReviewQuiz() {
    if (!userData.learnedWords.length) {
        alert('Learn a lesson first to unlock review quizzes.');
        return;
    }

    const randomIndex = Math.floor(Math.random() * userData.learnedWords.length);
    const word = userData.learnedWords[randomIndex];
    const response = prompt(`What is the English meaning of "${word.pt}"?`);

    const resultContainer = document.getElementById('reviewResult');
    if (!resultContainer) return;
    if (response === null) {
        resultContainer.textContent = 'Quiz canceled.';
        resultContainer.className = 'review-result';
        return;
    }

    const isCorrect = response.trim().toLowerCase() === (word.en || '').toLowerCase();
    resultContainer.textContent = isCorrect ? `✅ Correct! ${word.pt} = ${word.en}` : `❌ Not quite. ${word.pt} means "${word.en}".`;
    resultContainer.className = `review-result ${isCorrect ? 'success' : 'error'}`;
}

function resetProgress() {
    const confirmed = confirm('Reset all progress, streak, and learned words?');
    if (!confirmed) return;
    userData.learnedWords = [];
    userData.streak = 0;
    userData.lessonsCompleted = 0;
    userData.activeLesson = null;
    saveUserData();
    updateDashboard();
    backToLessons();
}

function showPaywall() {
    const modal = document.getElementById('paywall');
    if (modal) modal.style.display = 'flex';
}

function hidePaywall() {
    const modal = document.getElementById('paywall');
    if (modal) modal.style.display = 'none';
}

function setupEventListeners() {
    const premiumBtn = document.getElementById('premiumBtn');
    if (premiumBtn) premiumBtn.addEventListener('click', showPaywall);
    const closePaywall = document.querySelector('.close-paywall');
    if (closePaywall) closePaywall.addEventListener('click', hidePaywall);
    const subscribeBtn = document.querySelector('.btn-subscribe');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', () => {
            alert('Payment integration would go here. For now, premium unlocked.');
            userData.isPremium = true;
            saveUserData();
            updateDashboard();
            hidePaywall();
            renderLessons();
        });
    }

    const startBtn = document.getElementById('startBtn');
    if (startBtn) startBtn.addEventListener('click', () => document.getElementById('learn').scrollIntoView({ behavior: 'smooth' }));

    const reviewBtn = document.getElementById('reviewBtn');
    if (reviewBtn) reviewBtn.addEventListener('click', startReviewQuiz);

    const resetBtn = document.getElementById('resetProgressBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetProgress);

    const vaultSearch = document.getElementById('vaultSearch');
    if (vaultSearch) {
        vaultSearch.addEventListener('input', e => {
            vaultFilters.query = e.target.value;
            renderVault();
        });
    }
    const sortPt = document.getElementById('vaultSortPt');
    const sortEn = document.getElementById('vaultSortEn');
    const clearFilters = document.getElementById('vaultClearFilters');
    if (sortPt) sortPt.addEventListener('click', () => { vaultFilters.sort = 'pt'; renderVault(); setActiveSortButton('pt'); });
    if (sortEn) sortEn.addEventListener('click', () => { vaultFilters.sort = 'en'; renderVault(); setActiveSortButton('en'); });
    if (clearFilters) clearFilters.addEventListener('click', () => {
        vaultFilters.query = '';
        vaultFilters.sort = 'pt';
        if (vaultSearch) vaultSearch.value = '';
        renderVault();
        setActiveSortButton('pt');
    });
}

function setupNavigation() {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').replace('#', '');
            const section = document.getElementById(targetId);
            if (section) section.scrollIntoView({ behavior: 'smooth' });
            if (targetId === 'vault' || targetId === 'dashboard') updateDashboard();
        });
    });
}

function setupVoiceSettings() {
    const demoEl = document.getElementById('voiceDemo');
    if (demoEl) demoEl.textContent = `Demo: ${DEMO_PHRASE}`;

    const optionSelect = document.getElementById('voiceSelect');
    const sourceSelect = document.getElementById('voiceSourceSelect');
    const sampleBtn = document.getElementById('voiceSampleBtn');
    const saveBtn = document.getElementById('voiceSaveBtn');
    const disableBtn = document.getElementById('voiceDisableBundledBtn');
    const downloadBtn = document.getElementById('voiceDownloadBtn');

    const saved = loadVoiceSettings();
    Object.assign(voiceState, saved);
    if (!voiceState.selectedVoiceKey && saved.voiceKey) voiceState.selectedVoiceKey = saved.voiceKey;
    normalizeVoiceState();
    syncVoiceControls();
    updateVoiceDiagnostics('Detecting EU-PT system voices...');

    getPortugueseVoiceOptions(userData.speakerGender)
        .then(({ options, bestMaleKey, bestFemaleKey }) => {
            voiceState.detectedSystemOptions = options;
            const suggested = userData.speakerGender === 'male' ? bestMaleKey : bestFemaleKey;
            voiceState.selectedVoiceKey = voiceState.selectedVoiceKey || suggested || options[0]?.key || null;
            if (options.length && voiceState.selectedSource === 'auto') {
                voiceState.selectedSource = 'system';
            }
            normalizeVoiceState();
            persistVoiceState();
            syncVoiceControls();
            const detectedStatus = options.length
                ? `Detected ${options.length} EU-PT system ${options.length === 1 ? 'voice' : 'voices'}.`
                : 'No EU-PT system voice detected. Install a system Portuguese (Portugal) voice or download the bundled model.';
            updateVoiceDiagnostics(detectedStatus);
        })
        .catch(() => {
            updateVoiceDiagnostics('Voice detection failed. Try again after enabling audio permissions.');
        });

    if (sourceSelect) {
        sourceSelect.addEventListener('change', e => {
            voiceState.selectedSource = e.target.value;
            normalizeVoiceState();
            persistVoiceState();
            syncVoiceControls();
            updateVoiceDiagnostics('Voice source updated.');
        });
    }

    if (optionSelect) {
        optionSelect.addEventListener('change', e => {
            voiceState.selectedVoiceKey = e.target.value || null;
            voiceState.selectedSource = 'system';
            normalizeVoiceState();
            persistVoiceState();
            syncVoiceControls();
            updateVoiceDiagnostics('System voice selected.');
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            persistVoiceState();
            updateVoiceDiagnostics(voiceState.selectedVoiceKey ? 'Default voice saved locally.' : 'Select a voice to save first.');
        });
    }

    if (disableBtn) {
        disableBtn.addEventListener('click', () => {
            voiceState.allowBundled = !voiceState.allowBundled;
            if (!voiceState.allowBundled && voiceState.selectedSource === 'bundled') {
                voiceState.selectedSource = 'system';
            }
            stopBundledDownloadSimulation();
            if (!voiceState.allowBundled) {
                voiceState.bundled.downloading = false;
                voiceState.bundled.progress = 0;
            }
            normalizeVoiceState();
            persistVoiceState();
            syncVoiceControls();
            updateVoiceDiagnostics(voiceState.allowBundled ? 'Bundled voices enabled.' : 'Bundled voices disabled.');
        });
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => handleBundledDownloadClick());
    }

    if (sampleBtn) {
        sampleBtn.addEventListener('click', async () => {
            sampleBtn.disabled = true;
            await playPortugueseText(DEMO_PHRASE, { rate: 0.95 });
            sampleBtn.disabled = false;
        });
    }
}

function persistVoiceState(extra = {}) {
    Object.assign(voiceState, extra);
    normalizeVoiceState();
    saveVoiceSettings({
        ...voiceState,
        voiceKey: voiceState.selectedVoiceKey,
        preferredGender: userData.speakerGender
    });
}

function normalizeVoiceState() {
    if (!voiceState.selectedSource) voiceState.selectedSource = 'auto';
    if (!voiceState.allowBundled && voiceState.selectedSource === 'bundled') {
        voiceState.selectedSource = 'system';
    }
    const options = getSystemVoiceOptions();
    if (voiceState.selectedVoiceKey && !options.find(o => o.key === voiceState.selectedVoiceKey)) {
        voiceState.selectedVoiceKey = options[0]?.key || null;
    }
}

function getSystemVoiceOptions() {
    return Array.isArray(voiceState.detectedSystemOptions) ? voiceState.detectedSystemOptions : [];
}

function resolveVoiceChoice() {
    const systemOptions = getSystemVoiceOptions();
    const selectedSystem = systemOptions.find(o => o.key === voiceState.selectedVoiceKey) || systemOptions[0] || null;
    const bundledReady = voiceState.allowBundled && voiceState.bundled.downloaded;

    if (voiceState.selectedSource === 'system' && selectedSystem) {
        return { engine: 'webspeech', source: 'system', voiceKey: selectedSystem.key, label: `${selectedSystem.name} (${selectedSystem.provider})` };
    }
    if (voiceState.selectedSource === 'bundled' && bundledReady) {
        return { engine: 'bundled', source: 'bundled', voiceKey: 'bundled|pt-pt|piper-medium', label: 'Bundled Piper medium (stub)' };
    }

    if (voiceState.selectedSource === 'auto' || !voiceState.selectedSource) {
        if (selectedSystem) return { engine: 'webspeech', source: 'system', voiceKey: selectedSystem.key, label: `${selectedSystem.name} (${selectedSystem.provider})` };
        if (bundledReady) return { engine: 'bundled', source: 'bundled', voiceKey: 'bundled|pt-pt|piper-medium', label: 'Bundled Piper medium (stub)' };
    }

    return { engine: null, source: voiceState.selectedSource, voiceKey: null, label: 'No EU-PT voice available yet' };
}

function syncVoiceControls() {
    const optionSelect = document.getElementById('voiceSelect');
    const sourceSelect = document.getElementById('voiceSourceSelect');
    const disableBtn = document.getElementById('voiceDisableBundledBtn');
    const downloadBtn = document.getElementById('voiceDownloadBtn');

    const options = getSystemVoiceOptions();
    if (optionSelect) {
        optionSelect.innerHTML = options.length
            ? options.map(opt => `<option value="${opt.key}">${opt.name} - ${opt.provider}</option>`).join('')
            : '<option value="" disabled>No EU-PT system voice found</option>';
        if (voiceState.selectedVoiceKey && options.find(o => o.key === voiceState.selectedVoiceKey)) {
            optionSelect.value = voiceState.selectedVoiceKey;
        }
    }

    if (sourceSelect) {
        sourceSelect.innerHTML = `
            <option value="auto">Auto (system first)</option>
            <option value="system">System only</option>
            <option value="bundled" ${voiceState.allowBundled ? '' : 'disabled'}>Bundled (Piper)</option>
        `;
        sourceSelect.value = voiceState.selectedSource || 'auto';
    }

    if (disableBtn) disableBtn.textContent = voiceState.allowBundled ? 'Disable Bundled Voices' : 'Enable Bundled Voices';

    if (downloadBtn) {
        if (voiceState.bundled.downloading) {
            downloadBtn.textContent = `Downloading... ${voiceState.bundled.progress}%`;
            downloadBtn.disabled = true;
        } else if (voiceState.bundled.downloaded) {
            downloadBtn.textContent = 'Delete Bundled Voice';
            downloadBtn.disabled = false;
        } else {
            downloadBtn.textContent = 'Download Bundled Voice';
            downloadBtn.disabled = false;
        }
    }
}

function updateVoiceDiagnostics(statusText) {
    const statusEl = document.getElementById('voiceStatus');
    const availabilityEl = document.getElementById('voiceAvailability');
    const selectionEl = document.getElementById('voiceSelection');
    const lastEl = document.getElementById('voiceLastUsed');

    const options = getSystemVoiceOptions();
    const systemList = options.length ? options.map(o => `${o.name} (${o.provider})`).join(', ') : 'None detected';
    const bundledText = !voiceState.allowBundled
        ? 'Disabled'
        : voiceState.bundled.downloading
            ? `Downloading (${voiceState.bundled.progress}%)`
            : voiceState.bundled.downloaded
                ? 'Ready (Piper medium stub)'
                : 'Not downloaded';

    if (availabilityEl) availabilityEl.textContent = `System voices: ${systemList}. Bundled voice: ${bundledText}.`;

    const choice = resolveVoiceChoice();
    if (selectionEl) selectionEl.textContent = choice.engine
        ? `Selected: ${choice.label} [${choice.source}].`
        : 'Selected: none (text only until a voice is ready).';

    const last = getLastVoiceUsed();
    const lastText = last?.status === 'played'
        ? `Last playback: ${last.name || 'Voice'} via ${last.provider || last.engine || 'unknown'} (${last.lang || 'pt'})`
        : `Last playback: ${last?.status || 'idle'} (no audio yet).`;
    if (lastEl) lastEl.textContent = lastText;

    const fallbackStatus = statusText || (options.length
        ? `Detected ${options.length} EU-PT system ${options.length === 1 ? 'voice' : 'voices'}.`
        : 'No EU-PT system voice detected yet. Install a system voice or download the bundled model.');
    if (statusEl) statusEl.textContent = fallbackStatus;
}

function stopBundledDownloadSimulation() {
    if (bundledDownloadTimer) clearInterval(bundledDownloadTimer);
    bundledDownloadTimer = null;
}

function startBundledDownloadSimulation() {
    stopBundledDownloadSimulation();
    voiceState.bundled = { downloaded: false, downloading: true, progress: 0 };
    syncVoiceControls();
    updateVoiceDiagnostics('Downloading bundled voice (simulated)...');

    bundledDownloadTimer = setInterval(() => {
        const increment = Math.floor(Math.random() * 15) + 8;
        voiceState.bundled.progress = Math.min(100, voiceState.bundled.progress + increment);
        syncVoiceControls();
        updateVoiceDiagnostics(`Downloading bundled voice (${voiceState.bundled.progress}%)...`);
        if (voiceState.bundled.progress >= 100) {
            stopBundledDownloadSimulation();
            voiceState.bundled.downloaded = true;
            voiceState.bundled.downloading = false;
            voiceState.bundled.progress = 100;
            if (voiceState.selectedSource === 'auto') voiceState.selectedSource = 'system';
            persistVoiceState();
            syncVoiceControls();
            updateVoiceDiagnostics('Bundled voice ready (Piper medium stub).');
        }
    }, 320);
}

function handleBundledDownloadClick() {
    if (!voiceState.allowBundled) {
        updateVoiceDiagnostics('Enable bundled voices to download the offline model.');
        return;
    }
    if (voiceState.bundled.downloading) return;

    if (voiceState.bundled.downloaded) {
        voiceState.bundled = { downloaded: false, downloading: false, progress: 0 };
        persistVoiceState();
        syncVoiceControls();
        updateVoiceDiagnostics('Bundled voice cleared from cache.');
        return;
    }

    startBundledDownloadSimulation();
}

async function playPortugueseText(text, { rate = 0.95 } = {}) {
    const choice = resolveVoiceChoice();
    if (!choice.engine) {
        updateVoiceDiagnostics('No EU-PT voice available yet. Install a system voice or download the bundled one.');
        return;
    }
    if (choice.source === 'bundled' && (!voiceState.allowBundled || !voiceState.bundled.downloaded)) {
        updateVoiceDiagnostics('Download the bundled voice to use this source.');
        return;
    }

    await speakWithEngine({
        text,
        lang: 'pt-PT',
        gender: userData.speakerGender,
        engine: choice.engine,
        voiceKey: choice.engine === 'webspeech' ? choice.voiceKey : null,
        rate,
        onStart: () => updateVoiceDiagnostics(`Playing via ${choice.label}.`),
        onEnd: () => updateVoiceDiagnostics(`Playback finished via ${choice.label}.`),
        onVoiceUsed: () => updateVoiceDiagnostics(`Playback started via ${choice.label}.`)
    });
}

function setActiveSortButton(key) {
    const sortPt = document.getElementById('vaultSortPt');
    const sortEn = document.getElementById('vaultSortEn');
    if (sortPt) sortPt.classList.toggle('active', key === 'pt');
    if (sortEn) sortEn.classList.toggle('active', key === 'en');
}

