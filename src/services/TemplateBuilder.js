/**
 * Template Builder Service
 * 
 * Builds lesson challenges from templates based on difficulty level.
 * This is the bridge between lessonTemplates.config.js and LessonService.js
 * 
 * KEY PRINCIPLE: Single source of truth
 * - Change a template → ALL lessons using that template change
 * - No hardcoded challenge sequences in lesson data
 * 
 * @module services/TemplateBuilder
 */

import {
    LESSON_TEMPLATES,
    CHALLENGE_TYPE_REGISTRY,
    DIFFICULTY_ORDER,
    getTemplate,
    getChallengeType,
    getUnlockedLevel,
    isLevelUnlocked,
} from '../config/lessonTemplates.config.js';

import { info as logInfo } from './Logger.js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const BUILDER_CONFIG = {
    maxPronunciationWords: 4,
    maxFillWords: 5,
    maxListenWords: 3,
    defaultQuizOptions: 4,
    minDistractors: 2,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Shuffle array (Fisher-Yates)
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/**
 * Check if lesson has required resources
 * @param {Object} lesson - Lesson object
 * @param {Object} requirements - Required resources
 * @returns {boolean} Whether requirements are met
 */
function lessonMeetsRequirements(lesson, requirements) {
    if (!requirements) return true;
    
    if (requirements.images && !hasImages(lesson)) return false;
    if (requirements.audio && !hasAudio(lesson)) return false;
    if (requirements.sentences && !hasSentences(lesson)) return false;
    if (requirements.minimalPairs && !hasMinimalPairs(lesson)) return false;
    if (requirements.dialogues && !hasDialogues(lesson)) return false;
    if (requirements.numbers && !hasNumbers(lesson)) return false;
    if (requirements.grammarPatterns && !hasGrammarPatterns(lesson)) return false;
    
    return true;
}

function hasImages(lesson) {
    return lesson.words?.some(w => w.image || w.imageUrl);
}

function hasAudio(lesson) {
    return true; // TTS is always available
}

function hasSentences(lesson) {
    return lesson.sentences?.length > 0;
}

function hasMinimalPairs(lesson) {
    return lesson.minimalPairs?.length > 0;
}

function hasDialogues(lesson) {
    return lesson.dialogues?.length > 0;
}

function hasNumbers(lesson) {
    return lesson.words?.some(w => w.isNumber);
}

function hasGrammarPatterns(lesson) {
    return lesson.grammarPatterns?.length > 0;
}

// ============================================================================
// CHALLENGE BUILDERS (per type)
// ============================================================================

/**
 * Build quiz options for a word
 * @param {Object} targetWord - Target word
 * @param {Array} allWords - All words in lesson
 * @returns {Array} Quiz options
 */
function buildQuizOptions(targetWord, allWords) {
    const options = [targetWord.en];
    
    // Get other words as distractors
    const others = allWords.filter(w => w.en !== targetWord.en);
    const shuffled = shuffleArray(others);
    
    // Add up to 3 distractors
    for (const word of shuffled) {
        if (options.length >= BUILDER_CONFIG.defaultQuizOptions) break;
        if (!options.includes(word.en)) {
            options.push(word.en);
        }
    }
    
    // If not enough options, add generic distractors
    const genericDistractors = ['Hello', 'Goodbye', 'Yes', 'No', 'Please', 'Thank you', 'Water', 'Food'];
    for (const distractor of shuffleArray(genericDistractors)) {
        if (options.length >= BUILDER_CONFIG.defaultQuizOptions) break;
        if (!options.includes(distractor)) {
            options.push(distractor);
        }
    }
    
    return shuffleArray(options);
}

/**
 * Build Portuguese options for reverse selection
 * @param {Object} targetWord - Target word
 * @param {Array} allWords - All words in lesson
 * @returns {Array} Portuguese options
 */
function buildPtOptions(targetWord, allWords) {
    const options = [targetWord.pt];
    
    const others = allWords.filter(w => w.pt !== targetWord.pt);
    const shuffled = shuffleArray(others);
    
    for (const word of shuffled) {
        if (options.length >= BUILDER_CONFIG.defaultQuizOptions) break;
        if (!options.includes(word.pt)) {
            options.push(word.pt);
        }
    }
    
    return shuffleArray(options);
}

/**
 * Build MCQ challenge
 */
function buildMCQ(word, allWords, isReinforcement = false) {
    return {
        type: 'mcq',
        word,
        options: buildQuizOptions(word, allWords),
        direction: 'pt-to-en',
        isReinforcement,
        phase: 'recognition',
    };
}

/**
 * Build Image Selection challenge
 */
function buildImageSelect(word, allWords) {
    const wordsWithImages = allWords.filter(w => w.image || w.imageUrl);
    const correctImage = word.image || word.imageUrl;
    
    const imageOptions = [{ word, image: correctImage, isCorrect: true }];
    const others = shuffleArray(wordsWithImages.filter(w => w.pt !== word.pt));
    
    for (const other of others.slice(0, 3)) {
        imageOptions.push({
            word: other,
            image: other.image || other.imageUrl,
            isCorrect: false
        });
    }
    
    return {
        type: 'image-select',
        word,
        imageOptions: shuffleArray(imageOptions),
        phase: 'recognition',
    };
}

/**
 * Build Listen and Select challenge
 */
function buildListenSelect(word, allWords) {
    return {
        type: 'listen-select',
        word,
        options: buildQuizOptions(word, allWords),
        playAudioOnStart: true,
        phase: 'recognition',
    };
}

/**
 * Build Learn Word challenge (study card)
 */
function buildLearnWord(word, index) {
    return {
        type: 'learn-word',
        word,
        index,
        phase: 'consolidation',
        isPassive: true,
    };
}

/**
 * Build Word Select (reverse direction) challenge
 */
function buildWordSelect(word, allWords) {
    return {
        type: 'word-select',
        word,
        options: buildPtOptions(word, allWords),
        direction: 'en-to-pt',
        phase: 'recall',
    };
}

/**
 * Build Pronunciation challenge
 */
function buildPronunciation(word) {
    return {
        type: 'pronunciation',
        word,
        maxAttempts: 3,
        phase: 'production',
    };
}

/**
 * Build Minimal Pairs challenge
 */
function buildMinimalPairs(pair) {
    return {
        type: 'minimal-pairs',
        pair,
        options: [
            { word: pair.word1, audio: pair.audio1 },
            { word: pair.word2, audio: pair.audio2 }
        ],
        target: pair.target,
        explanation: pair.explanation,
        phase: 'recognition',
    };
}

/**
 * Build Word Order challenge
 */
function buildWordOrder(sentence, allSentences) {
    const words = sentence.pt.split(' ');
    const correctOrder = [...words];
    
    // Add distractors
    const distractors = generateDistractors(sentence, allSentences);
    const tiles = shuffleArray([...words, ...distractors]);
    
    return {
        type: 'word-order',
        sentence,
        tiles,
        correctOrder,
        distractors,
        showHintAfter: 1,
        phase: 'application',
    };
}

/**
 * Build Sentence Builder challenge
 */
function buildSentenceBuilder(sentence, allSentences) {
    const words = sentence.pt.split(' ');
    const distractors = generateDistractors(sentence, allSentences);
    
    return {
        type: 'sentence-builder',
        sentence,
        wordBank: shuffleArray([...words, ...distractors]),
        correctWords: words,
        distractors,
        targetEn: sentence.en,
        phase: 'application',
    };
}

/**
 * Build Cloze (with options) challenge
 */
function buildCloze(sentence, allSentences) {
    const words = sentence.pt.split(' ');
    const blankIndex = Math.floor(Math.random() * words.length);
    const correctAnswer = words[blankIndex];
    
    // Build with blank
    const sentenceWithBlank = [...words];
    sentenceWithBlank[blankIndex] = '_____';
    
    // Get options
    const options = [correctAnswer];
    const otherWords = allSentences
        .flatMap(s => s.pt.split(' '))
        .filter(w => w !== correctAnswer);
    
    for (const word of shuffleArray(otherWords).slice(0, 3)) {
        if (!options.includes(word)) options.push(word);
    }
    
    return {
        type: 'cloze',
        sentence,
        sentenceWithBlank: sentenceWithBlank.join(' '),
        blankIndex,
        correctAnswer,
        options: shuffleArray(options),
        hasOptions: true,
        phase: 'application',
    };
}

/**
 * Build Type Answer challenge
 */
function buildTypeAnswer(word) {
    return {
        type: 'type-answer',
        word,
        direction: 'en-to-pt',
        noOptions: true,
        acceptAccentVariations: true,
        phase: 'mastery',
    };
}

/**
 * Build Listen and Type challenge
 */
function buildListenType(word) {
    return {
        type: 'listen-type',
        word,
        playAudioOnStart: true,
        allowReplay: true,
        allowSpeedControl: true,
        noOptions: true,
        phase: 'mastery',
    };
}

/**
 * Build Image Type challenge
 */
function buildImageType(word) {
    return {
        type: 'image-type',
        word,
        image: word.image || word.imageUrl,
        noOptions: true,
        acceptAccentVariations: true,
        phase: 'mastery',
    };
}

/**
 * Build Cloze Type (no options) challenge
 */
function buildClozeType(sentence) {
    const words = sentence.pt.split(' ');
    const blankIndex = Math.floor(Math.random() * words.length);
    const correctAnswer = words[blankIndex];
    
    const sentenceWithBlank = [...words];
    sentenceWithBlank[blankIndex] = '_____';
    
    return {
        type: 'cloze-type',
        sentence,
        sentenceWithBlank: sentenceWithBlank.join(' '),
        blankIndex,
        correctAnswer,
        noOptions: true,
        acceptAccentVariations: true,
        phase: 'mastery',
    };
}

/**
 * Build Sentence challenge
 */
function buildSentence(sentence) {
    return {
        type: 'sentence',
        sentence,
        phase: 'application',
    };
}

/**
 * Build Number Comprehension challenge
 */
function buildNumberComprehension(word) {
    const number = parseInt(word.en) || 0;
    return {
        type: 'number-comprehension',
        word,
        number,
        showFingerImage: number >= 1 && number <= 10,
        playAudioOnStart: true,
        phase: 'recognition',
    };
}

/**
 * Build Rapid Recall challenge
 */
function buildRapidRecall(words) {
    return {
        type: 'rapid-recall',
        words: shuffleArray(words),
        timeLimit: 30,
        phase: 'fluency',
    };
}

/**
 * Build Grammar Transform challenge
 */
function buildGrammarTransform(pattern) {
    return {
        type: 'grammar-transform',
        pattern,
        prompt: pattern.prompt,
        correctAnswer: pattern.answer,
        transformType: pattern.type,
        phase: 'application',
    };
}

/**
 * Build Dialogue Reorder challenge
 */
function buildDialogueReorder(dialogue) {
    return {
        type: 'dialogue-reorder',
        dialogue,
        clips: shuffleArray(dialogue.clips.map((c, i) => ({ ...c, originalIndex: i }))),
        correctOrder: dialogue.clips.map((_, i) => i),
        phase: 'application',
    };
}

/**
 * Generate distractor words for sentence exercises
 */
function generateDistractors(sentence, allSentences, count = BUILDER_CONFIG.minDistractors) {
    const usedWords = new Set(sentence.pt.toLowerCase().split(' '));
    const distractors = [];
    
    // Get words from other sentences
    for (const other of shuffleArray(allSentences)) {
        if (other.pt === sentence.pt) continue;
        
        for (const word of other.pt.split(' ')) {
            const lowerWord = word.toLowerCase();
            if (!usedWords.has(lowerWord) && !distractors.includes(word)) {
                distractors.push(word);
                usedWords.add(lowerWord);
                if (distractors.length >= count) return distractors;
            }
        }
    }
    
    // Fallback generic distractors
    const fallbacks = ['muito', 'também', 'sempre', 'nunca', 'aqui', 'ali'];
    for (const fb of fallbacks) {
        if (!usedWords.has(fb) && !distractors.includes(fb)) {
            distractors.push(fb);
            if (distractors.length >= count) break;
        }
    }
    
    return distractors;
}

// ============================================================================
// MAIN BUILDER FUNCTION
// ============================================================================

/**
 * Build challenges from a template
 * 
 * This is the main entry point that:
 * 1. Gets the template for the lesson
 * 2. Filters phases by user's difficulty level
 * 3. Builds challenges for each exercise in each phase
 * 4. Respects lesson content availability (images, sentences, etc.)
 * 
 * @param {Object} lesson - Lesson object with words, sentences, etc.
 * @param {Object} options - Build options
 * @param {string} options.templateId - Template to use (default: 'standard')
 * @param {string} options.difficultyLevel - User's current difficulty level
 * @param {Object} options.lessonProgress - User's progress on this lesson
 * @returns {Array} Built challenges
 */
export function buildFromTemplate(lesson, options = {}) {
    // If lesson provides pre-built challenges (e.g., AI rescue lessons), honor them
    if (lesson.challenges && lesson.challenges.length > 0) {
        return lesson.challenges.map((challenge, idx) => ({
            ...challenge,
            word: challenge.word || (typeof challenge.wordIndex === 'number' 
                ? lesson.words?.[challenge.wordIndex] 
                : null),
            index: challenge.index ?? idx
        }));
    }
    
    const {
        templateId = lesson.templateId || 'standard',
        difficultyLevel = 'beginner',
        lessonProgress = {},
    } = options;
    
    // Get the actual unlocked level based on progress
    const unlockedLevel = getUnlockedLevel(lessonProgress);
    const effectiveLevel = DIFFICULTY_ORDER.indexOf(difficultyLevel) <= DIFFICULTY_ORDER.indexOf(unlockedLevel)
        ? difficultyLevel
        : unlockedLevel;
    
    const template = getTemplate(templateId);
    const words = lesson.words || [];
    const sentences = lesson.sentences || [];
    const challenges = [];
    
    logInfo('build_from_template', {
        lessonId: lesson.id,
        templateId,
        requestedLevel: difficultyLevel,
        effectiveLevel,
        wordCount: words.length,
        sentenceCount: sentences.length,
    });
    
    // Process each phase in the template
    for (const phase of template.phases) {
        // Check if this phase is available at user's difficulty level
        if (phase.minDifficulty) {
            const phaseMinIndex = DIFFICULTY_ORDER.indexOf(phase.minDifficulty);
            const userLevelIndex = DIFFICULTY_ORDER.indexOf(effectiveLevel);
            if (userLevelIndex < phaseMinIndex) {
                continue; // Skip this phase - user hasn't unlocked it yet
            }
        }
        
        // Process each exercise in the phase
        for (const exercise of phase.exercises) {
            const typeInfo = getChallengeType(exercise.type);
            if (!typeInfo) continue;
            
            // Check if this exercise type is available at user's level
            const typeMinIndex = DIFFICULTY_ORDER.indexOf(typeInfo.difficultyLevel);
            const userLevelIndex = DIFFICULTY_ORDER.indexOf(effectiveLevel);
            if (userLevelIndex < typeMinIndex) {
                continue; // Skip - type not unlocked
            }
            
            // Check if lesson has required resources
            if (exercise.requiresImages && !hasImages(lesson)) continue;
            if (exercise.requiresSentences && !hasSentences(lesson)) continue;
            if (exercise.requiresMinimalPairs && !hasMinimalPairs(lesson)) continue;
            if (exercise.requiresDialogues && !hasDialogues(lesson)) continue;
            if (exercise.requiresNumbers && !hasNumbers(lesson)) continue;
            if (exercise.requiresGrammar && !hasGrammarPatterns(lesson)) continue;
            
            // Skip optional exercises if requirements not met
            if (exercise.optional) {
                if (exercise.requiresImages && !hasImages(lesson)) continue;
                if (exercise.requiresAudio && !hasAudio(lesson)) continue;
            }
            
            // Build challenges based on type
            const newChallenges = buildExerciseChallenges(
                exercise,
                typeInfo,
                words,
                sentences,
                lesson,
                phase.name
            );
            
            challenges.push(...newChallenges);
        }
    }
    
    logInfo('template_build_complete', {
        lessonId: lesson.id,
        challengeCount: challenges.length,
        effectiveLevel,
    });
    
    return challenges;
}

/**
 * Build challenges for a specific exercise type
 */
function buildExerciseChallenges(exercise, typeInfo, words, sentences, lesson, phaseName) {
    const challenges = [];
    const count = exercise.count === 'all' ? null : exercise.count;
    const maxCount = exercise.maxCount || count || 999;
    
    // Determine items to use
    let items = [];
    let shuffled = [];
    
    switch (exercise.type) {
        case 'MCQ':
            shuffled = exercise.shuffleWords ? shuffleArray([...words]) : words;
            items = count ? shuffled.slice(0, count) : shuffled;
            for (const word of items.slice(0, maxCount)) {
                challenges.push(buildMCQ(word, words, false));
            }
            break;
            
        case 'IMAGE_SELECT':
            shuffled = shuffleArray(words.filter(w => w.image || w.imageUrl));
            items = count ? shuffled.slice(0, count) : shuffled;
            for (const word of items.slice(0, maxCount)) {
                challenges.push(buildImageSelect(word, words));
            }
            break;
            
        case 'LISTEN_SELECT':
            shuffled = shuffleArray([...words]);
            items = count ? shuffled.slice(0, count) : shuffled;
            for (const word of items.slice(0, maxCount)) {
                challenges.push(buildListenSelect(word, words));
            }
            break;
            
        case 'LEARN_WORD':
            for (let i = 0; i < words.length; i++) {
                challenges.push(buildLearnWord(words[i], i));
            }
            break;
            
        case 'WORD_SELECT':
            shuffled = exercise.shuffleWords ? shuffleArray([...words]) : words;
            items = count ? shuffled.slice(0, count) : shuffled;
            for (const word of items.slice(0, maxCount)) {
                challenges.push(buildWordSelect(word, words));
            }
            break;
            
        case 'PRONUNCIATION':
            shuffled = shuffleArray([...words]);
            items = shuffled.slice(0, Math.min(count || BUILDER_CONFIG.maxPronunciationWords, maxCount));
            for (const word of items) {
                challenges.push(buildPronunciation(word));
            }
            break;
            
        case 'MINIMAL_PAIRS':
            if (lesson.minimalPairs) {
                shuffled = shuffleArray([...lesson.minimalPairs]);
                items = count ? shuffled.slice(0, count) : shuffled;
                for (const pair of items.slice(0, maxCount)) {
                    challenges.push(buildMinimalPairs(pair));
                }
            }
            break;
            
        case 'WORD_ORDER':
            if (sentences.length > 0) {
                shuffled = shuffleArray([...sentences]);
                items = count ? shuffled.slice(0, count) : shuffled;
                for (const sentence of items.slice(0, maxCount)) {
                    challenges.push(buildWordOrder(sentence, sentences));
                }
            }
            break;
            
        case 'SENTENCE_BUILDER':
            if (sentences.length > 0) {
                shuffled = shuffleArray([...sentences]);
                items = count ? shuffled.slice(0, count) : shuffled;
                for (const sentence of items.slice(0, maxCount)) {
                    challenges.push(buildSentenceBuilder(sentence, sentences));
                }
            }
            break;
            
        case 'CLOZE':
            if (sentences.length > 0) {
                shuffled = shuffleArray([...sentences]);
                items = count ? shuffled.slice(0, count) : shuffled;
                for (const sentence of items.slice(0, maxCount)) {
                    challenges.push(buildCloze(sentence, sentences));
                }
            }
            break;
            
        case 'TYPE_ANSWER':
            shuffled = shuffleArray([...words]);
            items = shuffled.slice(0, count || BUILDER_CONFIG.maxFillWords);
            for (const word of items.slice(0, maxCount)) {
                challenges.push(buildTypeAnswer(word));
            }
            break;
            
        case 'LISTEN_TYPE':
            shuffled = shuffleArray([...words]);
            items = shuffled.slice(0, count || BUILDER_CONFIG.maxListenWords);
            for (const word of items.slice(0, maxCount)) {
                challenges.push(buildListenType(word));
            }
            break;
            
        case 'IMAGE_TYPE':
            shuffled = shuffleArray(words.filter(w => w.image || w.imageUrl));
            items = count ? shuffled.slice(0, count) : shuffled;
            for (const word of items.slice(0, maxCount)) {
                challenges.push(buildImageType(word));
            }
            break;
            
        case 'CLOZE_TYPE':
            if (sentences.length > 0) {
                shuffled = shuffleArray([...sentences]);
                items = count ? shuffled.slice(0, count) : shuffled;
                for (const sentence of items.slice(0, maxCount)) {
                    challenges.push(buildClozeType(sentence));
                }
            }
            break;
            
        case 'SENTENCE':
            if (sentences.length > 0) {
                for (const sentence of sentences) {
                    challenges.push(buildSentence(sentence));
                }
            }
            break;
            
        case 'NUMBER_COMPREHENSION':
            const numberWords = words.filter(w => w.isNumber);
            shuffled = shuffleArray(numberWords);
            items = count ? shuffled.slice(0, count) : shuffled;
            for (const word of items.slice(0, maxCount)) {
                challenges.push(buildNumberComprehension(word));
            }
            break;
            
        case 'RAPID_RECALL':
            challenges.push(buildRapidRecall(words));
            break;
            
        case 'GRAMMAR_TRANSFORM':
            if (lesson.grammarPatterns) {
                shuffled = shuffleArray([...lesson.grammarPatterns]);
                items = count ? shuffled.slice(0, count) : shuffled;
                for (const pattern of items.slice(0, maxCount)) {
                    challenges.push(buildGrammarTransform(pattern));
                }
            }
            break;
            
        case 'DIALOGUE_REORDER':
            if (lesson.dialogues) {
                shuffled = shuffleArray([...lesson.dialogues]);
                items = count ? shuffled.slice(0, count) : shuffled;
                for (const dialogue of items.slice(0, maxCount)) {
                    challenges.push(buildDialogueReorder(dialogue));
                }
            }
            break;
    }
    
    return challenges;
}

/**
 * Get a preview of what exercises will be available at each difficulty level
 * Useful for showing users what they'll unlock
 * 
 * @param {Object} lesson - Lesson object
 * @param {string} templateId - Template ID
 * @returns {Object} Preview by difficulty level
 */
export function getTemplatePreview(lesson, templateId = 'standard') {
    const template = getTemplate(templateId);
    const preview = {};
    
    for (const levelId of DIFFICULTY_ORDER) {
        preview[levelId] = {
            level: levelId,
            phases: [],
            exerciseTypes: [],
            challengeCount: 0,
        };
        
        for (const phase of template.phases) {
            const phaseMinIndex = phase.minDifficulty 
                ? DIFFICULTY_ORDER.indexOf(phase.minDifficulty) 
                : 0;
            const levelIndex = DIFFICULTY_ORDER.indexOf(levelId);
            
            if (levelIndex >= phaseMinIndex) {
                const phaseExercises = phase.exercises
                    .filter(ex => {
                        const typeInfo = getChallengeType(ex.type);
                        if (!typeInfo) return false;
                        
                        const typeMinIndex = DIFFICULTY_ORDER.indexOf(typeInfo.difficultyLevel);
                        return levelIndex >= typeMinIndex;
                    })
                    .map(ex => ({
                        type: ex.type,
                        userFacing: getChallengeType(ex.type)?.userFacing,
                    }));
                
                if (phaseExercises.length > 0) {
                    preview[levelId].phases.push({
                        name: phase.name,
                        exercises: phaseExercises,
                    });
                    
                    for (const ex of phaseExercises) {
                        if (!preview[levelId].exerciseTypes.includes(ex.type)) {
                            preview[levelId].exerciseTypes.push(ex.type);
                        }
                    }
                }
            }
        }
        
        // Estimate challenge count
        preview[levelId].challengeCount = preview[levelId].exerciseTypes.length * 
            Math.max(1, (lesson.words?.length || 0));
    }
    
    return preview;
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    buildFromTemplate,
    getTemplatePreview,
    BUILDER_CONFIG,
};
