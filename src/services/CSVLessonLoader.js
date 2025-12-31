/**
 * CSV Lesson Loader Service
 * 
 * Loads lesson content from CSV files and transforms into lesson objects.
 * This allows AI to generate lessons by simply creating CSVs.
 * 
 * CSV Schema (new format):
 * word_id,portuguese,english,sounds_like,tip,image,example_pt,example_en
 * 
 * Old CSV Schema (also supported):
 * word,translation,sounds_like,tip,mnemonic,image,audio_file,phrase_example,phrase_translation,difficulty,category,gender,plural
 */

// Difficulty progression configuration (inline to avoid external dependency)
const DIFFICULTY_PROGRESSIONS = {
    'beginner_1': { hintsEnabled: true, maxAttempts: 3, timerEnabled: false },
    'beginner_2': { hintsEnabled: true, maxAttempts: 3, timerEnabled: false },
    'beginner_3': { hintsEnabled: true, maxAttempts: 2, timerEnabled: false },
    'intermediate_1': { hintsEnabled: false, maxAttempts: 2, timerEnabled: false },
    'intermediate_2': { hintsEnabled: false, maxAttempts: 2, timerEnabled: true, timerDuration: 30 },
    'intermediate_3': { hintsEnabled: false, maxAttempts: 2, timerEnabled: true, timerDuration: 25 },
    'hard_1': { hintsEnabled: false, maxAttempts: 1, timerEnabled: true, timerDuration: 20 },
    'hard_2': { hintsEnabled: false, maxAttempts: 1, timerEnabled: true, timerDuration: 15 },
    'hard_3': { hintsEnabled: false, maxAttempts: 1, timerEnabled: true, timerDuration: 10 },
    'fluency_check': { hintsEnabled: false, maxAttempts: 1, timerEnabled: true, timerDuration: 8 }
};

// Exercise type mapping per difficulty level
const LEVEL_EXERCISE_TYPES = {
    'beginner_1': ['picture_flashcard', 'audio_mcq', 'tap_pairs'],
    'beginner_2': ['picture_flashcard', 'audio_mcq', 'tap_pairs', 'word_image_match', 'cloze'],
    'beginner_3': ['audio_mcq', 'tap_pairs', 'cloze', 'word_order', 'sentence_builder'],
    'intermediate_1': ['translation_type', 'listen_type', 'minimal_pair'],
    'intermediate_2': ['translation_type', 'listen_type', 'grammar_transform', 'dialogue_reorder'],
    'intermediate_3': ['translation_type', 'listen_type', 'grammar_transform', 'dialogue_reorder', 'story_complete'],
    'hard_1': ['speak_record', 'pronunciation_shadowing', 'conversation_roleplay'],
    'hard_2': ['speak_record', 'pronunciation_shadowing', 'conversation_roleplay', 'rapid_recall'],
    'hard_3': ['speak_record', 'rapid_recall', 'read_aloud', 'context_guess'],
    'fluency_check': ['rapid_recall', 'pronunciation_shadowing', 'listen_type', 'conversation_roleplay', 'read_aloud']
};

function getExerciseTypesForLevel(level) {
    return LEVEL_EXERCISE_TYPES[level] || LEVEL_EXERCISE_TYPES['beginner_1'];
}

function isLevelUnlocked(level, userProgress) {
    const levels = Object.keys(DIFFICULTY_PROGRESSIONS);
    const levelIndex = levels.indexOf(level);
    
    if (levelIndex <= 0) return true; // First level always unlocked
    
    const previousLevel = levels[levelIndex - 1];
    return userProgress?.completedLevels?.includes(previousLevel) ?? false;
}

/**
 * Parse CSV string into array of objects
 */
export function parseCSV(csvString) {
    const lines = csvString.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index];
            });
            data.push(row);
        }
    }
    
    return data;
}

/**
 * Parse a single CSV line, handling quoted values with commas
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    
    return result;
}

/**
 * Load and parse a CSV file
 */
export async function loadCSV(filename) {
    try {
        const response = await fetch(`/src/data/csv/${filename}`);
        if (!response.ok) throw new Error(`Failed to load ${filename}`);
        const csvText = await response.text();
        return parseCSV(csvText);
    } catch (error) {
        console.error(`Error loading CSV ${filename}:`, error);
        return [];
    }
}

/**
 * Transform CSV row into word object with all helper info.
 * Supports both new format (word_id,portuguese,english,...) and old format (word,translation,...)
 */
function transformWordFromCSV(row) {
    // Detect CSV format by checking for column names
    const isNewFormat = row.portuguese !== undefined || row.word_id !== undefined;
    
    if (isNewFormat) {
        // New CSV format: word_id,portuguese,english,sounds_like,tip,image,example_pt,example_en
        const ptWord = row.portuguese || '';
        return {
            id: row.word_id || ptWord.toLowerCase().replace(/\s+/g, '_'),
            word: ptWord,
            pt: ptWord,
            translation: row.english || '',
            en: row.english || '',
            soundsLike: row.sounds_like || null,
            pronunciation: row.sounds_like || null,
            tip: row.tip || null,
            aiTip: row.tip || null,
            image: row.image || null,
            incorrectAnswers: row.incorrect_answers ? row.incorrect_answers.split('|').map(v => v.trim()).filter(Boolean) : [],
            phraseExample: row.example_pt || null,
            phraseTranslation: row.example_en || null,
            examples: row.example_pt ? [{
                pt: row.example_pt,
                en: row.example_en || ''
            }] : [],
            difficulty: 'beginner_1',
            category: 'general'
        };
    } else {
        // Old CSV format: word,translation,sounds_like,tip,mnemonic,image,audio_file,phrase_example,phrase_translation,difficulty,category,gender,plural
        return {
            id: row.word?.toLowerCase().replace(/\s+/g, '_') || '',
            word: row.word || '',
            pt: row.word || '',
            translation: row.translation || '',
            en: row.translation || '',
            soundsLike: row.sounds_like || null,
            pronunciation: row.sounds_like || null,
            tip: row.tip || null,
            aiTip: row.tip || null,
            mnemonic: row.mnemonic || null,
            image: row.image || null,
            audioFile: row.audio_file || null,
            phraseExample: row.phrase_example || null,
            phraseTranslation: row.phrase_translation || null,
            examples: row.phrase_example ? [{
                pt: row.phrase_example,
                en: row.phrase_translation || ''
            }] : [],
            difficulty: row.difficulty || 'beginner_1',
            category: row.category || 'general',
            gender: row.gender || null,
            plural: row.plural || null
        };
    }
}

/**
 * Build lesson content from CSV data
 */
export function buildLessonFromCSV(csvData, lessonMetadata) {
    const words = csvData.map(transformWordFromCSV);
    
    // Group words by difficulty level
    const wordsByDifficulty = {};
    words.forEach(word => {
        if (!wordsByDifficulty[word.difficulty]) {
            wordsByDifficulty[word.difficulty] = [];
        }
        wordsByDifficulty[word.difficulty].push(word);
    });
    
    return {
        id: lessonMetadata.id,
        title: lessonMetadata.title,
        titlePt: lessonMetadata.titlePt,
        description: lessonMetadata.description,
        category: lessonMetadata.category,
        tier: lessonMetadata.tier,
        icon: lessonMetadata.icon,
        image: lessonMetadata.image,
        words: words,
        wordsByDifficulty: wordsByDifficulty,
        difficultyLevels: lessonMetadata.difficultyLevels,
        prerequisites: lessonMetadata.prerequisites,
        estimatedMinutes: lessonMetadata.estimatedMinutes,
        tags: lessonMetadata.tags
    };
}

/**
 * Get words for a specific difficulty level
 */
export function getWordsForDifficulty(lesson, difficultyLevel) {
    // Accumulate words from this level and all easier levels
    const levels = Object.keys(DIFFICULTY_PROGRESSIONS);
    const currentIndex = levels.indexOf(difficultyLevel);
    
    let words = [];
    for (let i = 0; i <= currentIndex; i++) {
        const level = levels[i];
        if (lesson.wordsByDifficulty[level]) {
            words = words.concat(lesson.wordsByDifficulty[level]);
        }
    }
    
    return words;
}

/**
 * Build exercises for a lesson at a specific difficulty
 */
export function buildExercisesForLevel(lesson, difficultyLevel, userProgress = {}) {
    const levelConfig = DIFFICULTY_PROGRESSIONS[difficultyLevel];
    if (!levelConfig) return [];
    
    // Check if level is unlocked
    if (!isLevelUnlocked(difficultyLevel, userProgress)) {
        return null; // Level locked
    }
    
    const exerciseTypes = getExerciseTypesForLevel(difficultyLevel);
    const words = getWordsForDifficulty(lesson, difficultyLevel);
    
    const exercises = [];
    
    words.forEach(word => {
        exerciseTypes.forEach(type => {
            exercises.push(buildExercise(word, type, levelConfig));
        });
    });
    
    // Shuffle exercises
    return shuffleArray(exercises);
}

/**
 * Build a single exercise from word and type
 */
function buildExercise(word, exerciseType, levelConfig) {
    const baseExercise = {
        id: `${word.id}_${exerciseType}`,
        type: exerciseType,
        word: word,
        hintsEnabled: levelConfig.hintsEnabled,
        maxAttempts: levelConfig.maxAttempts,
        timerEnabled: levelConfig.timerEnabled,
        timerDuration: levelConfig.timerDuration || null
    };
    
    // Add helper info for display
    if (word.soundsLike) {
        baseExercise.soundsLike = word.soundsLike;
    }
    if (word.tip) {
        baseExercise.tip = word.tip;
    }
    if (word.mnemonic) {
        baseExercise.mnemonic = word.mnemonic;
    }
    if (word.phraseExample) {
        baseExercise.phraseExample = word.phraseExample;
        baseExercise.phraseTranslation = word.phraseTranslation;
    }
    
    return baseExercise;
}

/**
 * Shuffle array (Fisher-Yates)
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Load all lesson metadata
 */
export async function loadLessonMetadata() {
    try {
        const response = await fetch('/src/data/lesson_metadata.json');
        if (!response.ok) throw new Error('Failed to load lesson metadata');
        return await response.json();
    } catch (error) {
        console.error('Error loading lesson metadata:', error);
        return { lessons: {}, categories: {} };
    }
}

/**
 * Get available lessons for user based on progress
 */
export function getAvailableLessons(allLessons, userProgress) {
    const available = [];
    const locked = [];
    
    Object.values(allLessons).forEach(lesson => {
        const prereqsMet = lesson.prerequisites.every(prereqId => {
            const prereqProgress = userProgress[prereqId];
            return prereqProgress && prereqProgress.accuracy >= 80;
        });
        
        if (prereqsMet || lesson.prerequisites.length === 0) {
            available.push({
                ...lesson,
                locked: false,
                currentDifficulty: getCurrentDifficultyForLesson(lesson.id, userProgress)
            });
        } else {
            locked.push({
                ...lesson,
                locked: true,
                lockedReason: `Complete ${lesson.prerequisites.join(', ')} first`
            });
        }
    });
    
    return { available, locked };
}

/**
 * Get current difficulty level for a lesson based on progress
 */
function getCurrentDifficultyForLesson(lessonId, userProgress) {
    const lessonProgress = userProgress[lessonId] || {};
    const completedLevels = lessonProgress.completedLevels || [];
    
    // Find first uncompleted level
    const allLevels = Object.keys(DIFFICULTY_PROGRESSIONS);
    for (const level of allLevels) {
        if (!completedLevels.includes(level)) {
            return level;
        }
    }
    
    return 'hard_mode_1'; // All completed, offer fluency check
}

export default {
    parseCSV,
    loadCSV,
    buildLessonFromCSV,
    getWordsForDifficulty,
    buildExercisesForLevel,
    loadLessonMetadata,
    getAvailableLessons
};
