/**
 * Lesson Templates Configuration
 * 
 * Single Source of Truth for lesson flow architecture.
 * Templates define WHAT exercises appear and WHEN based on difficulty level.
 * 
 * RESEARCH-BACKED PRINCIPLES (20 sources):
 * 1. Practice-First (Duolingo, Roediger Testing Effect) - Active before passive
 * 2. i+1 Progression (Krashen) - One new concept at a time
 * 3. Four Strands Balance (Nation) - Input/Output/Form/Fluency 25% each
 * 4. Spaced Repetition (FSRS, Pimsleur) - Review scheduling
 * 5. Interleaved Practice (Nakata, Bjork) - Mix topics
 * 6. Dual Coding (Paivio, Mayer) - Text + Image + Audio
 * 7. Desirable Difficulties (Bjork) - Effortful retrieval
 * 8. Pushed Output (Swain) - Production tasks
 * 9. Low Affective Filter (Krashen) - Encouragement at struggles
 * 
 * @module config/lessonTemplates
 */

// ============================================================================
// DIFFICULTY LEVELS
// ============================================================================

/**
 * Progressive difficulty system
 * Users start at BEGINNER and unlock higher levels through perfect scores
 * 
 * Each level unlocks new exercise types while keeping previous ones available
 */
export const DIFFICULTY_LEVELS = {
    BEGINNER: {
        id: 'beginner',
        name: 'Beginner',
        displayName: 'Easy Mode',
        description: 'Selection-based exercises. Pick from options.',
        unlockCriteria: null, // Always available
        color: '#4CAF50', // Green
        icon: '🌱',
        // What percentage accuracy unlocks the NEXT level
        nextLevelThreshold: 70,
    },
    INTERMEDIATE: {
        id: 'intermediate', 
        name: 'Intermediate',
        displayName: 'Normal Mode',
        description: 'Add pronunciation and reverse selection.',
        unlockCriteria: { minAccuracy: 70, minCompletions: 1 },
        color: '#2196F3', // Blue
        icon: '📚',
        nextLevelThreshold: 85,
    },
    ADVANCED: {
        id: 'advanced',
        name: 'Advanced',
        displayName: 'Challenge Mode',
        description: 'Word ordering, cloze, and sentence building.',
        unlockCriteria: { minAccuracy: 85, minCompletions: 2 },
        color: '#FF9800', // Orange
        icon: '🎯',
        nextLevelThreshold: 95,
    },
    HARD: {
        id: 'hard',
        name: 'Hard',
        displayName: 'Hard Mode',
        description: 'Full typing. No multiple choice assistance.',
        unlockCriteria: { minAccuracy: 95, minCompletions: 3 },
        color: '#F44336', // Red
        icon: '🔥',
        nextLevelThreshold: 100, // Mastery
    }
};

// Ordered array for iteration
export const DIFFICULTY_ORDER = ['beginner', 'intermediate', 'advanced', 'hard'];

// ============================================================================
// CHALLENGE TYPE REGISTRY
// ============================================================================

/**
 * Complete registry of all challenge types with metadata
 * 
 * Each type specifies:
 * - difficultyLevel: Minimum level required to see this exercise
 * - phase: Which learning phase (recognition, recall, production, mastery)
 * - requirements: What data the lesson must have (images, sentences, etc.)
 * - telemetry: What events this type emits
 */
export const CHALLENGE_TYPE_REGISTRY = {
    // =========================================================================
    // BEGINNER LEVEL - Selection-based (always show options)
    // =========================================================================
    
    MCQ: {
        id: 'mcq',
        name: 'Multiple Choice',
        description: 'See Portuguese word, pick English meaning from options',
        difficultyLevel: 'beginner',
        phase: 'recognition',
        requirements: { words: true },
        direction: 'pt-to-en',
        telemetry: ['answer_attempt', 'time_to_select', 'option_chosen'],
        userFacing: {
            label: 'Pick the meaning',
            icon: '🔤',
        }
    },
    
    IMAGE_SELECT: {
        id: 'image-select',
        name: 'Image Selection',
        description: 'See/hear word, pick matching image from options',
        difficultyLevel: 'beginner',
        phase: 'recognition',
        requirements: { words: true, images: true },
        telemetry: ['answer_attempt', 'image_selected', 'asset_load_success'],
        userFacing: {
            label: 'Pick the picture',
            icon: '🖼️',
        }
    },
    
    LISTEN_SELECT: {
        id: 'listen-select',
        name: 'Audio Selection',
        description: 'Hear Portuguese audio, pick meaning from text options',
        difficultyLevel: 'beginner',
        phase: 'recognition',
        requirements: { words: true, audio: true },
        telemetry: ['answer_attempt', 'audio_replay_count', 'time_to_select'],
        userFacing: {
            label: 'What did you hear?',
            icon: '👂',
        }
    },
    
    LEARN_WORD: {
        id: 'learn-word',
        name: 'Word Card',
        description: 'Study card with word, translation, example, audio',
        difficultyLevel: 'beginner',
        phase: 'consolidation',
        requirements: { words: true },
        isPassive: true, // Not scored
        telemetry: ['card_viewed', 'time_on_card', 'audio_played'],
        userFacing: {
            label: 'Learn this word',
            icon: '📖',
        }
    },
    
    // =========================================================================
    // INTERMEDIATE LEVEL - Reverse direction + pronunciation
    // =========================================================================
    
    WORD_SELECT: {
        id: 'word-select',
        name: 'Reverse Selection',
        description: 'See English, pick Portuguese word from options',
        difficultyLevel: 'intermediate',
        phase: 'recall',
        requirements: { words: true },
        direction: 'en-to-pt',
        telemetry: ['answer_attempt', 'time_to_select', 'confusion_pairs'],
        userFacing: {
            label: 'Pick the Portuguese',
            icon: '🇵🇹',
        }
    },
    
    PRONUNCIATION: {
        id: 'pronunciation',
        name: 'Pronunciation',
        description: 'See word, speak it, get phonetic feedback',
        difficultyLevel: 'intermediate',
        phase: 'production',
        requirements: { words: true, microphone: true },
        telemetry: ['pronunciation_score', 'phoneme_breakdown', 'attempts'],
        userFacing: {
            label: 'Say it out loud',
            icon: '🎤',
        }
    },
    
    MINIMAL_PAIRS: {
        id: 'minimal-pairs',
        name: 'Sound Discrimination',
        description: 'Distinguish similar sounds (avô vs avó)',
        difficultyLevel: 'intermediate',
        phase: 'recognition',
        requirements: { minimalPairs: true, audio: true },
        telemetry: ['answer_attempt', 'confusion_matrix', 'audio_replays'],
        userFacing: {
            label: 'Which sound?',
            icon: '👂🔊',
        }
    },
    
    // =========================================================================
    // ADVANCED LEVEL - Construction + typing with assistance
    // =========================================================================
    
    WORD_ORDER: {
        id: 'word-order',
        name: 'Word Ordering',
        description: 'Arrange tiles to form correct sentence (with distractors)',
        difficultyLevel: 'advanced',
        phase: 'application',
        requirements: { sentences: true },
        telemetry: ['answer_attempt', 'tile_sequence', 'distractor_selected', 'hint_used'],
        userFacing: {
            label: 'Put in order',
            icon: '🔀',
        }
    },
    
    SENTENCE_BUILDER: {
        id: 'sentence-builder',
        name: 'Sentence Builder',
        description: 'Build sentence from word bank with distractors',
        difficultyLevel: 'advanced',
        phase: 'application',
        requirements: { sentences: true },
        telemetry: ['answer_attempt', 'wrong_token_picks', 'attempt_count'],
        userFacing: {
            label: 'Build the sentence',
            icon: '🧱',
        }
    },
    
    CLOZE: {
        id: 'cloze',
        name: 'Fill in the Blank',
        description: 'Complete sentence with missing word (select from options)',
        difficultyLevel: 'advanced',
        phase: 'application',
        requirements: { sentences: true },
        hasOptions: true, // Shows word bank
        telemetry: ['answer_attempt', 'error_type', 'latency'],
        userFacing: {
            label: 'Fill the blank',
            icon: '📝',
        }
    },
    
    GRAMMAR_TRANSFORM: {
        id: 'grammar-transform',
        name: 'Grammar Transform',
        description: 'Change form (tense, gender, number) - with hints',
        difficultyLevel: 'advanced',
        phase: 'application',
        requirements: { grammarPatterns: true },
        telemetry: ['answer_attempt', 'error_category', 'transform_type'],
        userFacing: {
            label: 'Change the form',
            icon: '🔄',
        }
    },
    
    // =========================================================================
    // HARD MODE - Full typing, no assistance
    // =========================================================================
    
    TYPE_ANSWER: {
        id: 'type-answer',
        name: 'Type Portuguese',
        description: 'See English, type Portuguese (no options)',
        difficultyLevel: 'hard',
        phase: 'mastery',
        requirements: { words: true },
        direction: 'en-to-pt',
        noOptions: true,
        telemetry: ['answer_attempt', 'keystroke_count', 'response_time', 'accent_correct'],
        userFacing: {
            label: 'Type the word',
            icon: '⌨️',
        }
    },
    
    LISTEN_TYPE: {
        id: 'listen-type',
        name: 'Dictation',
        description: 'Hear Portuguese, type what you heard (no options)',
        difficultyLevel: 'hard',
        phase: 'mastery',
        requirements: { words: true, audio: true },
        noOptions: true,
        telemetry: ['answer_attempt', 'wer_score', 'replay_count', 'speed_used'],
        userFacing: {
            label: 'Type what you hear',
            icon: '✍️👂',
        }
    },
    
    IMAGE_TYPE: {
        id: 'image-type',
        name: 'Image to Word',
        description: 'See image, type Portuguese word (no options)',
        difficultyLevel: 'hard',
        phase: 'mastery',
        requirements: { words: true, images: true },
        noOptions: true,
        telemetry: ['answer_attempt', 'keystroke_count', 'response_time'],
        userFacing: {
            label: 'Type the word',
            icon: '🖼️⌨️',
        }
    },
    
    CLOZE_TYPE: {
        id: 'cloze-type',
        name: 'Fill in the Blank (Typed)',
        description: 'Complete sentence by typing missing word (no options)',
        difficultyLevel: 'hard',
        phase: 'mastery',
        requirements: { sentences: true },
        noOptions: true,
        telemetry: ['answer_attempt', 'error_type', 'latency', 'accent_used'],
        userFacing: {
            label: 'Type the missing word',
            icon: '📝⌨️',
        }
    },
    
    // =========================================================================
    // SPECIAL TYPES (Available at various levels)
    // =========================================================================
    
    SENTENCE: {
        id: 'sentence',
        name: 'Sentence Practice',
        description: 'Full sentence translation/comprehension',
        difficultyLevel: 'intermediate',
        phase: 'application',
        requirements: { sentences: true },
        telemetry: ['answer_attempt', 'sentence_id'],
        userFacing: {
            label: 'Sentence practice',
            icon: '💬',
        }
    },
    
    NUMBER_COMPREHENSION: {
        id: 'number-comprehension',
        name: 'Number Listening',
        description: 'Hear number, type digits (with finger visual aid)',
        difficultyLevel: 'beginner',
        phase: 'recognition',
        requirements: { numbers: true, audio: true },
        telemetry: ['answer_attempt', 'off_by_error', 'response_time'],
        userFacing: {
            label: 'What number?',
            icon: '🔢',
        }
    },
    
    RAPID_RECALL: {
        id: 'rapid-recall',
        name: 'Speed Round',
        description: 'Timed vocabulary drill (30-60s)',
        difficultyLevel: 'advanced',
        phase: 'fluency',
        requirements: { words: true },
        isTimed: true,
        telemetry: ['items_per_second', 'accuracy', 'timeout_count'],
        userFacing: {
            label: 'Speed challenge',
            icon: '⚡',
        }
    },
    
    DIALOGUE_REORDER: {
        id: 'dialogue-reorder',
        name: 'Dialogue Sequence',
        description: 'Order dialogue clips into correct conversation flow',
        difficultyLevel: 'advanced',
        phase: 'application',
        requirements: { dialogues: true, audio: true },
        telemetry: ['answer_attempt', 'mis_order_count', 'clips_played'],
        userFacing: {
            label: 'Order the conversation',
            icon: '🗣️',
        }
    },
};

// ============================================================================
// LESSON TEMPLATES
// ============================================================================

/**
 * Template recipes define the FLOW of exercises
 * 
 * Each template specifies:
 * - What phases to include
 * - How many exercises per phase
 * - Which types are used at each difficulty level
 * 
 * Templates can be assigned to lessons based on content type
 */
export const LESSON_TEMPLATES = {
    // =========================================================================
    // STANDARD TEMPLATE - Balanced vocabulary lesson
    // =========================================================================
    standard: {
        id: 'standard',
        name: 'Standard Lesson',
        description: 'Balanced recognition → recall → production flow',
        
        /**
         * Phases define the lesson flow
         * Each phase runs sequentially, exercises within a phase are shuffled
         */
        phases: [
            // Phase 1: Recognition (PT → EN)
            {
                name: 'recognition',
                description: 'Exposure and recognition',
                exercises: [
                    { type: 'MCQ', count: 'all', shuffleWords: true },
                    { type: 'IMAGE_SELECT', count: 3, requiresImages: true, optional: true },
                    { type: 'LISTEN_SELECT', count: 2, requiresAudio: true, optional: true },
                ]
            },
            
            // Phase 2: Consolidation (passive study)
            {
                name: 'consolidation',
                description: 'Study and reinforce',
                exercises: [
                    { type: 'LEARN_WORD', count: 'all' },
                ]
            },
            
            // Phase 3: Recall (EN → PT) - requires INTERMEDIATE
            {
                name: 'recall',
                description: 'Active recall',
                minDifficulty: 'intermediate',
                exercises: [
                    { type: 'WORD_SELECT', count: 'all', shuffleWords: true },
                    { type: 'MINIMAL_PAIRS', count: 2, requiresMinimalPairs: true, optional: true },
                ]
            },
            
            // Phase 4: Production - requires INTERMEDIATE
            {
                name: 'production',
                description: 'Speak and produce',
                minDifficulty: 'intermediate',
                exercises: [
                    { type: 'PRONUNCIATION', count: 4, maxCount: 4 },
                ]
            },
            
            // Phase 5: Application - requires ADVANCED
            {
                name: 'application',
                description: 'Apply in context',
                minDifficulty: 'advanced',
                exercises: [
                    { type: 'WORD_ORDER', count: 2, requiresSentences: true, optional: true },
                    { type: 'CLOZE', count: 3, requiresSentences: true, optional: true },
                    { type: 'SENTENCE_BUILDER', count: 2, requiresSentences: true, optional: true },
                ]
            },
            
            // Phase 6: Mastery - requires HARD
            {
                name: 'mastery',
                description: 'Full production without assistance',
                minDifficulty: 'hard',
                exercises: [
                    { type: 'TYPE_ANSWER', count: 5 },
                    { type: 'LISTEN_TYPE', count: 3, requiresAudio: true },
                ]
            },
            
            // Phase 7: Sentences (if available)
            {
                name: 'sentences',
                description: 'Sentence practice',
                minDifficulty: 'intermediate',
                exercises: [
                    { type: 'SENTENCE', count: 'all', requiresSentences: true },
                ]
            }
        ],
        
        // Interleaving configuration
        interleaving: {
            newMaterial: 0.70,    // 70% new material
            review: 0.20,         // 20% from prior lessons
            preview: 0.10,        // 10% preview upcoming
        }
    },
    
    // =========================================================================
    // IMAGE-HEAVY TEMPLATE - Visual vocabulary lesson
    // =========================================================================
    imageHeavy: {
        id: 'image-heavy',
        name: 'Visual Lesson',
        description: 'Image-focused for visual learners',
        
        phases: [
            {
                name: 'visual-recognition',
                description: 'Visual matching',
                exercises: [
                    { type: 'IMAGE_SELECT', count: 'all', requiresImages: true },
                    { type: 'MCQ', count: 'all', shuffleWords: true },
                ]
            },
            {
                name: 'consolidation',
                exercises: [
                    { type: 'LEARN_WORD', count: 'all' },
                ]
            },
            {
                name: 'recall',
                minDifficulty: 'intermediate',
                exercises: [
                    { type: 'WORD_SELECT', count: 'all' },
                ]
            },
            {
                name: 'production',
                minDifficulty: 'intermediate',
                exercises: [
                    { type: 'PRONUNCIATION', count: 4 },
                ]
            },
            {
                name: 'mastery',
                minDifficulty: 'hard',
                exercises: [
                    { type: 'IMAGE_TYPE', count: 'all', requiresImages: true },
                ]
            }
        ]
    },
    
    // =========================================================================
    // AUDIO-FOCUSED TEMPLATE - Listening-heavy lesson
    // =========================================================================
    audioFocused: {
        id: 'audio-focused',
        name: 'Audio Lesson',
        description: 'Listening-focused for auditory learners',
        
        phases: [
            {
                name: 'listening',
                description: 'Audio comprehension',
                exercises: [
                    { type: 'LISTEN_SELECT', count: 'all', requiresAudio: true },
                    { type: 'MCQ', count: 'all' },
                ]
            },
            {
                name: 'consolidation',
                exercises: [
                    { type: 'LEARN_WORD', count: 'all' },
                ]
            },
            {
                name: 'discrimination',
                minDifficulty: 'intermediate',
                exercises: [
                    { type: 'MINIMAL_PAIRS', count: 4, requiresMinimalPairs: true },
                ]
            },
            {
                name: 'production',
                minDifficulty: 'intermediate',
                exercises: [
                    { type: 'PRONUNCIATION', count: 'all' },
                ]
            },
            {
                name: 'mastery',
                minDifficulty: 'hard',
                exercises: [
                    { type: 'LISTEN_TYPE', count: 'all' },
                ]
            }
        ]
    },
    
    // =========================================================================
    // NUMBERS TEMPLATE - Number-specific lesson
    // =========================================================================
    numbers: {
        id: 'numbers',
        name: 'Numbers Lesson',
        description: 'Number comprehension with visual aids',
        
        phases: [
            {
                name: 'recognition',
                exercises: [
                    { type: 'MCQ', count: 'all' },
                    { type: 'NUMBER_COMPREHENSION', count: 'all', requiresNumbers: true },
                ]
            },
            {
                name: 'consolidation',
                exercises: [
                    { type: 'LEARN_WORD', count: 'all' },
                ]
            },
            {
                name: 'recall',
                minDifficulty: 'intermediate',
                exercises: [
                    { type: 'WORD_SELECT', count: 'all' },
                ]
            },
            {
                name: 'production',
                minDifficulty: 'intermediate',
                exercises: [
                    { type: 'PRONUNCIATION', count: 4 },
                ]
            },
            {
                name: 'mastery',
                minDifficulty: 'hard',
                exercises: [
                    { type: 'TYPE_ANSWER', count: 'all' },
                ]
            }
        ]
    },
    
    // =========================================================================
    // GRAMMAR TEMPLATE - Grammar-focused lesson
    // =========================================================================
    grammar: {
        id: 'grammar',
        name: 'Grammar Lesson',
        description: 'Grammar pattern practice',
        
        phases: [
            {
                name: 'recognition',
                exercises: [
                    { type: 'MCQ', count: 'all' },
                ]
            },
            {
                name: 'consolidation',
                exercises: [
                    { type: 'LEARN_WORD', count: 'all' },
                ]
            },
            {
                name: 'production',
                minDifficulty: 'intermediate',
                exercises: [
                    { type: 'PRONUNCIATION', count: 4 },
                ]
            },
            {
                name: 'application',
                minDifficulty: 'advanced',
                exercises: [
                    { type: 'WORD_ORDER', count: 4, requiresSentences: true },
                    { type: 'CLOZE', count: 4, requiresSentences: true },
                    { type: 'GRAMMAR_TRANSFORM', count: 4, requiresGrammar: true },
                ]
            },
            {
                name: 'mastery',
                minDifficulty: 'hard',
                exercises: [
                    { type: 'CLOZE_TYPE', count: 4, requiresSentences: true },
                    { type: 'TYPE_ANSWER', count: 3 },
                ]
            }
        ]
    },
    
    // =========================================================================
    // CONVERSATION TEMPLATE - Dialogue-based lesson
    // =========================================================================
    conversation: {
        id: 'conversation',
        name: 'Conversation Lesson',
        description: 'Dialogue and phrase practice',
        
        phases: [
            {
                name: 'exposure',
                exercises: [
                    { type: 'LISTEN_SELECT', count: 'all', requiresAudio: true },
                    { type: 'MCQ', count: 'all' },
                ]
            },
            {
                name: 'consolidation',
                exercises: [
                    { type: 'LEARN_WORD', count: 'all' },
                ]
            },
            {
                name: 'comprehension',
                minDifficulty: 'intermediate',
                exercises: [
                    { type: 'SENTENCE', count: 'all', requiresSentences: true },
                ]
            },
            {
                name: 'dialogue',
                minDifficulty: 'advanced',
                exercises: [
                    { type: 'DIALOGUE_REORDER', count: 2, requiresDialogues: true, optional: true },
                    { type: 'WORD_ORDER', count: 3, requiresSentences: true },
                ]
            },
            {
                name: 'production',
                minDifficulty: 'intermediate',
                exercises: [
                    { type: 'PRONUNCIATION', count: 'all' },
                ]
            },
            {
                name: 'mastery',
                minDifficulty: 'hard',
                exercises: [
                    { type: 'TYPE_ANSWER', count: 5 },
                ]
            }
        ]
    },
    
    // =========================================================================
    // RAPID REVIEW TEMPLATE - Quick review session
    // =========================================================================
    rapidReview: {
        id: 'rapid-review',
        name: 'Rapid Review',
        description: 'Fast-paced review of learned material',
        
        phases: [
            {
                name: 'warm-up',
                exercises: [
                    { type: 'MCQ', count: 5 },
                ]
            },
            {
                name: 'recall',
                minDifficulty: 'intermediate',
                exercises: [
                    { type: 'WORD_SELECT', count: 5 },
                ]
            },
            {
                name: 'speed-round',
                minDifficulty: 'advanced',
                exercises: [
                    { type: 'RAPID_RECALL', count: 1 },
                ]
            },
            {
                name: 'mastery',
                minDifficulty: 'hard',
                exercises: [
                    { type: 'TYPE_ANSWER', count: 5 },
                ]
            }
        ]
    },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get difficulty level metadata
 * @param {string} levelId - Difficulty level ID
 * @returns {Object} Level metadata
 */
export function getDifficultyLevel(levelId) {
    const level = Object.values(DIFFICULTY_LEVELS).find(l => l.id === levelId);
    return level || DIFFICULTY_LEVELS.BEGINNER;
}

/**
 * Get next difficulty level
 * @param {string} currentLevelId - Current level ID
 * @returns {Object|null} Next level or null if at max
 */
export function getNextDifficultyLevel(currentLevelId) {
    const currentIndex = DIFFICULTY_ORDER.indexOf(currentLevelId);
    if (currentIndex === -1 || currentIndex >= DIFFICULTY_ORDER.length - 1) {
        return null;
    }
    return getDifficultyLevel(DIFFICULTY_ORDER[currentIndex + 1]);
}

/**
 * Check if user meets unlock criteria for a difficulty level
 * @param {string} levelId - Target level ID
 * @param {Object} lessonProgress - User's progress for this lesson
 * @returns {boolean} Whether level is unlocked
 */
export function isLevelUnlocked(levelId, lessonProgress = {}) {
    const level = getDifficultyLevel(levelId);
    
    // Beginner is always unlocked
    if (!level.unlockCriteria) {
        return true;
    }
    
    const { accuracy = 0, completions = 0 } = lessonProgress;
    const { minAccuracy, minCompletions } = level.unlockCriteria;
    
    return accuracy >= minAccuracy && completions >= minCompletions;
}

/**
 * Get user's current unlocked difficulty level for a lesson
 * @param {Object} lessonProgress - User's progress for this lesson
 * @returns {string} Highest unlocked level ID
 */
export function getUnlockedLevel(lessonProgress = {}) {
    let highestUnlocked = 'beginner';
    
    for (const levelId of DIFFICULTY_ORDER) {
        if (isLevelUnlocked(levelId, lessonProgress)) {
            highestUnlocked = levelId;
        } else {
            break; // Stop at first locked level
        }
    }
    
    return highestUnlocked;
}

/**
 * Get challenge type metadata
 * @param {string} typeId - Challenge type ID
 * @returns {Object|null} Type metadata
 */
export function getChallengeType(typeId) {
    return CHALLENGE_TYPE_REGISTRY[typeId] || null;
}

/**
 * Get all challenge types available at a difficulty level
 * @param {string} levelId - Difficulty level ID
 * @returns {Array} Available challenge types
 */
export function getTypesForLevel(levelId) {
    const levelIndex = DIFFICULTY_ORDER.indexOf(levelId);
    if (levelIndex === -1) return [];
    
    return Object.values(CHALLENGE_TYPE_REGISTRY).filter(type => {
        const typeIndex = DIFFICULTY_ORDER.indexOf(type.difficultyLevel);
        return typeIndex <= levelIndex;
    });
}

/**
 * Get template by ID
 * @param {string} templateId - Template ID
 * @returns {Object} Template configuration
 */
export function getTemplate(templateId) {
    return LESSON_TEMPLATES[templateId] || LESSON_TEMPLATES.standard;
}

/**
 * Get user-facing difficulty info for UI display
 * @param {string} levelId - Current level
 * @param {Object} lessonProgress - User's lesson progress
 * @returns {Object} UI display data
 */
export function getDifficultyUIInfo(levelId, lessonProgress = {}) {
    const currentLevel = getDifficultyLevel(levelId);
    const nextLevel = getNextDifficultyLevel(levelId);
    const availableTypes = getTypesForLevel(levelId);
    
    return {
        current: {
            ...currentLevel,
            exerciseTypes: availableTypes.map(t => t.userFacing),
        },
        next: nextLevel ? {
            ...nextLevel,
            unlockProgress: lessonProgress.accuracy || 0,
            exercisesPreview: Object.values(CHALLENGE_TYPE_REGISTRY)
                .filter(t => t.difficultyLevel === nextLevel.id)
                .map(t => t.userFacing),
        } : null,
        allLevels: DIFFICULTY_ORDER.map(id => ({
            ...getDifficultyLevel(id),
            isUnlocked: isLevelUnlocked(id, lessonProgress),
            isCurrent: id === levelId,
        })),
    };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    DIFFICULTY_LEVELS,
    DIFFICULTY_ORDER,
    CHALLENGE_TYPE_REGISTRY,
    LESSON_TEMPLATES,
    getDifficultyLevel,
    getNextDifficultyLevel,
    isLevelUnlocked,
    getUnlockedLevel,
    getChallengeType,
    getTypesForLevel,
    getTemplate,
    getDifficultyUIInfo,
};
