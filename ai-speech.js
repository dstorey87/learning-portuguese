/**
 * AI Speech Recognition using Whisper
 * 
 * Uses @xenova/transformers for browser-based Whisper inference
 * Falls back to Web Speech API if WebGPU/WASM not available
 * 
 * Features:
 * - High accuracy Portuguese transcription
 * - Pronunciation scoring by comparing to expected text
 * - Word-level alignment for detailed feedback
 */

// Whisper model options
const WHISPER_MODELS = {
    tiny: 'Xenova/whisper-tiny',
    base: 'Xenova/whisper-base',
    small: 'Xenova/whisper-small'
};

// State
let pipeline = null;
let modelLoading = false;
let modelLoaded = false;
let selectedModel = 'tiny'; // Start with tiny for faster loading

// Audio recording state
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

/**
 * Initialize Whisper model
 * @param {string} modelSize - 'tiny', 'base', or 'small'
 * @param {function} onProgress - Progress callback (0-100)
 */
export async function initializeWhisper(modelSize = 'tiny', onProgress = null) {
    if (modelLoaded && selectedModel === modelSize) {
        return true;
    }
    
    if (modelLoading) {
        // Wait for current loading to finish
        while (modelLoading) {
            await new Promise(r => setTimeout(r, 100));
        }
        return modelLoaded;
    }
    
    modelLoading = true;
    selectedModel = modelSize;
    
    try {
        // Dynamic import to avoid loading Transformers if not needed
        const { pipeline: createPipeline } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
        
        const modelName = WHISPER_MODELS[modelSize] || WHISPER_MODELS.tiny;
        
        console.log(`🎤 Loading Whisper model: ${modelName}`);
        
        pipeline = await createPipeline('automatic-speech-recognition', modelName, {
            progress_callback: (progress) => {
                if (onProgress && progress.progress) {
                    onProgress(Math.round(progress.progress));
                }
            }
        });
        
        modelLoaded = true;
        console.log('✅ Whisper model loaded successfully');
        return true;
        
    } catch (error) {
        console.error('Failed to load Whisper model:', error);
        modelLoaded = false;
        return false;
    } finally {
        modelLoading = false;
    }
}

/**
 * Check if Whisper is available and ready
 */
export function isWhisperReady() {
    return modelLoaded && pipeline !== null;
}

/**
 * Check if Whisper can be used (browser support)
 */
export function canUseWhisper() {
    // Check for required APIs
    const hasWebWorker = typeof Worker !== 'undefined';
    const hasAudioContext = typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined';
    const hasMediaDevices = navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
    
    return hasWebWorker && hasAudioContext && hasMediaDevices;
}

/**
 * Start recording audio
 * @returns {Promise<void>}
 */
export async function startRecording() {
    if (isRecording) {
        throw new Error('Already recording');
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
                sampleRate: 16000,
                channelCount: 1,
                echoCancellation: true,
                noiseSuppression: true
            }
        });
        
        audioChunks = [];
        
        // Use audio/webm for better browser support
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
            ? 'audio/webm;codecs=opus' 
            : 'audio/webm';
        
        mediaRecorder = new MediaRecorder(stream, { mimeType });
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        mediaRecorder.start(100); // Collect in 100ms chunks
        isRecording = true;
        
        console.log('🎙️ Recording started');
        
    } catch (error) {
        console.error('Failed to start recording:', error);
        throw new Error(`Microphone access denied: ${error.message}`);
    }
}

/**
 * Stop recording and return audio blob
 * @returns {Promise<Blob>}
 */
export async function stopRecording() {
    if (!isRecording || !mediaRecorder) {
        throw new Error('Not recording');
    }
    
    return new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            
            // Stop all tracks
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            
            isRecording = false;
            mediaRecorder = null;
            
            console.log('🎙️ Recording stopped, blob size:', audioBlob.size);
            resolve(audioBlob);
        };
        
        mediaRecorder.onerror = (error) => {
            isRecording = false;
            reject(error);
        };
        
        mediaRecorder.stop();
    });
}

/**
 * Check if currently recording
 */
export function getRecordingState() {
    return isRecording;
}

/**
 * Transcribe audio using Whisper
 * @param {Blob|ArrayBuffer} audio - Audio data
 * @param {string} language - Language code (default: 'portuguese')
 * @returns {Promise<{text: string, segments: Array}>}
 */
export async function transcribe(audio, language = 'portuguese') {
    if (!isWhisperReady()) {
        throw new Error('Whisper model not loaded. Call initializeWhisper() first.');
    }
    
    try {
        // Convert Blob to ArrayBuffer if needed
        let audioData = audio;
        if (audio instanceof Blob) {
            audioData = await audio.arrayBuffer();
        }
        
        // Decode audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        const audioBuffer = await audioContext.decodeAudioData(audioData);
        
        // Get audio data as Float32Array
        const audioArray = audioBuffer.getChannelData(0);
        
        // Run Whisper inference
        const result = await pipeline(audioArray, {
            language,
            task: 'transcribe',
            return_timestamps: true
        });
        
        console.log('📝 Transcription result:', result);
        
        return {
            text: result.text?.trim() || '',
            segments: result.chunks || []
        };
        
    } catch (error) {
        console.error('Transcription failed:', error);
        throw error;
    }
}

/**
 * Record and transcribe in one call
 * @param {number} maxDurationMs - Maximum recording duration
 * @param {function} onStart - Called when recording starts
 * @param {function} onProgress - Called with recording progress
 * @returns {Promise<{text: string, duration: number}>}
 */
export async function recordAndTranscribe(maxDurationMs = 10000, { onStart, onProgress } = {}) {
    // Initialize Whisper if not ready
    if (!isWhisperReady()) {
        console.log('Loading Whisper model...');
        await initializeWhisper(selectedModel, onProgress);
    }
    
    await startRecording();
    if (onStart) onStart();
    
    const startTime = Date.now();
    
    // Recording loop with progress
    return new Promise((resolve, reject) => {
        const progressInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            if (onProgress) {
                onProgress(Math.min(100, Math.round((elapsed / maxDurationMs) * 100)));
            }
            
            if (elapsed >= maxDurationMs) {
                clearInterval(progressInterval);
                finishRecording();
            }
        }, 100);
        
        const finishRecording = async () => {
            clearInterval(progressInterval);
            
            try {
                const audioBlob = await stopRecording();
                const duration = Date.now() - startTime;
                
                const result = await transcribe(audioBlob);
                
                resolve({
                    text: result.text,
                    segments: result.segments,
                    duration
                });
                
            } catch (error) {
                reject(error);
            }
        };
        
        // Allow early stop
        window._stopWhisperRecording = finishRecording;
    });
}

/**
 * Stop current recording early
 */
export function stopRecordingEarly() {
    if (window._stopWhisperRecording) {
        window._stopWhisperRecording();
    }
}

/**
 * Portuguese phoneme patterns for detailed pronunciation analysis
 */
const PORTUGUESE_PHONEME_PATTERNS = {
    // Nasal vowels and combinations
    nasals: {
        pattern: /[ãõ]|ão|ões|ãe|ões|[aeiou][mn](?![aeiouáéíóúâêô])/gi,
        name: 'nasal vowels',
        description: 'Nasal sounds (ão, ã, õ, -am, -em, -om)',
        tip: 'Let air flow through your nose. The "ão" sound is like "owng" with a nasal quality.',
        commonErrors: ['Saying "ow" without nasalization', 'Over-emphasizing the final consonant']
    },
    // S → SH transformation (EU-PT specific)
    sibilants: {
        pattern: /s(?=[tpkfçc])|s$/gi,
        name: 'S sounds',
        description: 'S becomes "SH" before consonants and at word end',
        tip: 'In European Portuguese, "s" sounds like "sh" at the end of words and before certain consonants.',
        commonErrors: ['Using American "s" sound instead of "sh"', 'Forgetting the SH in plural words']
    },
    // Vowel reduction (EU-PT specific)
    reduction: {
        pattern: /(?:^|[^aeiouáéíóúâêô])e(?=[^aeiouáéíóúâêô]|$)/gi,
        name: 'vowel reduction',
        description: 'Unstressed "e" is nearly silent in EU-PT',
        tip: 'Unstressed vowels are very soft or "swallowed" - much more than in Brazilian Portuguese.',
        commonErrors: ['Pronouncing every vowel clearly', 'Over-articulating unstressed syllables']
    },
    // LH and NH digraphs
    digraphs: {
        pattern: /lh|nh/gi,
        name: 'digraphs',
        description: 'LH sounds like "ly", NH sounds like Spanish "ñ"',
        tip: 'LH = tongue against roof of mouth + "y". NH = like "ny" in "canyon".',
        commonErrors: ['Saying "L" + "H" separately', 'Not using palatal sounds']
    },
    // R sounds
    rhotics: {
        pattern: /rr|^r|r$/gi,
        name: 'R sounds',
        description: 'RR and initial R are guttural; final R is very soft',
        tip: 'Double RR is stronger/guttural. Single R at end of word is very soft.',
        commonErrors: ['Using English R sound', 'Rolling R too much like Spanish']
    },
    // Accent/stress patterns
    stress: {
        pattern: /[áéíóú]/gi,
        name: 'stress markers',
        description: 'Accented vowels indicate stress',
        tip: 'The accent mark shows which syllable to emphasize. This changes the word meaning!',
        commonErrors: ['Ignoring stress marks', 'Stressing wrong syllable']
    },
    // Cedilla
    cedilla: {
        pattern: /ç/gi,
        name: 'cedilla',
        description: 'Ç always makes an "S" sound, never "K"',
        tip: 'Ç is like "S" in "sun". It exists to keep the "S" sound before A, O, U.',
        commonErrors: ['Saying "K" sound', 'Over-emphasizing']
    }
};

/**
 * Analyze Portuguese-specific pronunciation features in a word
 * @param {string} text - Portuguese text to analyze
 * @returns {Object} Analysis of phoneme features
 */
export function analyzePortuguesePhonemes(text) {
    const features = [];
    const challenges = [];
    
    Object.entries(PORTUGUESE_PHONEME_PATTERNS).forEach(([key, pattern]) => {
        const matches = text.match(pattern.pattern);
        if (matches && matches.length > 0) {
            features.push({
                type: key,
                matches: matches,
                count: matches.length,
                ...pattern
            });
            challenges.push(key);
        }
    });
    
    return {
        features,
        challenges,
        primaryChallenge: challenges[0] || 'general',
        hasDifficultSounds: features.length > 0,
        difficultyLevel: Math.min(features.length, 3) // 0-3 scale
    };
}

/**
 * Calculate pronunciation score by comparing transcribed text to expected
 * Enhanced with phoneme-level analysis and specific feedback
 * @param {string} transcribed - What the user said
 * @param {string} expected - What they should have said
 * @param {Object} wordKnowledge - Optional word knowledge for better feedback
 * @returns {Object} Score and detailed feedback
 */
export function scorePronunciation(transcribed, expected, wordKnowledge = null) {
    // Normalize for comparison
    const normalize = (text) => text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics for comparison
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    const normalizePreserveDiacritics = (text) => text
        .toLowerCase()
        .replace(/[^\w\s\u00C0-\u017F]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    
    const transcribedNorm = normalize(transcribed);
    const expectedNorm = normalize(expected);
    const expectedWithDiacritics = normalizePreserveDiacritics(expected);
    
    // Handle empty transcription
    if (!transcribedNorm) {
        return {
            score: 0,
            rating: 'no-speech',
            feedback: 'We didn\'t hear anything. Make sure your microphone is working.',
            specificIssues: [],
            tips: ['Speak clearly and close to your microphone'],
            transcribed,
            expected
        };
    }
    
    const transcribedWords = transcribedNorm.split(' ').filter(Boolean);
    const expectedWords = expectedNorm.split(' ').filter(Boolean);
    
    // Calculate word-level matches with fuzzy matching
    const matchedWords = [];
    const missedWords = [];
    const closeMatches = [];
    const extraWords = [];
    
    expectedWords.forEach(word => {
        const exactMatch = transcribedWords.includes(word);
        if (exactMatch) {
            matchedWords.push(word);
        } else {
            // Check for close matches (Levenshtein distance <= 2)
            const closeMatch = transcribedWords.find(tw => 
                levenshteinDistance(tw, word) <= Math.max(2, Math.floor(word.length * 0.3))
            );
            if (closeMatch) {
                closeMatches.push({ expected: word, heard: closeMatch });
                matchedWords.push(word); // Count as partial match
            } else {
                missedWords.push(word);
            }
        }
    });
    
    transcribedWords.forEach(word => {
        if (!expectedWords.includes(word) && !closeMatches.find(cm => cm.heard === word)) {
            extraWords.push(word);
        }
    });
    
    // Calculate base word score
    const wordScore = expectedWords.length > 0 
        ? Math.round((matchedWords.length / expectedWords.length) * 100)
        : 0;
    
    // Calculate Levenshtein distance for overall similarity
    const levenshteinScore = Math.round(
        (1 - levenshteinDistance(transcribedNorm, expectedNorm) / 
         Math.max(transcribedNorm.length, expectedNorm.length, 1)) * 100
    );
    
    // Phonetic similarity bonus - reward close but not exact matches
    const phoneticsBonus = closeMatches.length > 0 ? 
        Math.round((closeMatches.length / expectedWords.length) * 15) : 0;
    
    // Combined score with phonetic bonus
    let score = Math.round((wordScore * 0.5) + (levenshteinScore * 0.4) + phoneticsBonus);
    score = Math.min(100, Math.max(0, score));
    
    // Analyze phoneme-specific challenges
    const expectedAnalysis = analyzePortuguesePhonemes(expectedWithDiacritics);
    const specificIssues = [];
    const tips = [];
    
    // Check which phoneme patterns might be causing issues
    if (missedWords.length > 0 || closeMatches.length > 0) {
        expectedAnalysis.features.forEach(feature => {
            // Check if the problem words contain this feature
            const problematicWords = [...missedWords, ...closeMatches.map(cm => cm.expected)];
            const hasFeature = problematicWords.some(w => 
                w.match(feature.pattern)
            );
            if (hasFeature) {
                specificIssues.push({
                    type: feature.type,
                    name: feature.name,
                    tip: feature.tip
                });
            }
        });
    }
    
    // Add word knowledge tips if available
    if (wordKnowledge?.pronunciation) {
        if (score < 80 && wordKnowledge.pronunciation.tip) {
            tips.push(wordKnowledge.pronunciation.tip);
        }
        if (score < 60 && wordKnowledge.pronunciation.commonMistake) {
            tips.push(`Avoid: ${wordKnowledge.pronunciation.commonMistake}`);
        }
    }
    
    // Add generic tips based on detected issues
    if (specificIssues.length > 0 && tips.length < 2) {
        specificIssues.slice(0, 2).forEach(issue => {
            if (!tips.includes(issue.tip)) {
                tips.push(issue.tip);
            }
        });
    }
    
    // Determine rating and generate feedback
    let rating = '';
    let feedback = '';
    let emoji = '';
    
    if (score >= 90) {
        rating = 'excellent';
        emoji = '🎉';
        feedback = 'Excelente! Your pronunciation is spot on!';
    } else if (score >= 75) {
        rating = 'good';
        emoji = '👍';
        feedback = 'Muito bom! Very good pronunciation.';
        if (closeMatches.length > 0) {
            feedback += ' Just small refinements needed.';
        }
    } else if (score >= 60) {
        rating = 'fair';
        emoji = '💪';
        feedback = 'Bom progresso! You\'re getting closer.';
        if (missedWords.length > 0) {
            feedback += ` Focus on: "${missedWords.slice(0, 2).join('", "')}".`;
        }
    } else if (score >= 40) {
        rating = 'needs-work';
        emoji = '🔄';
        feedback = 'Keep practicing! Listen carefully to the sounds.';
        if (specificIssues.length > 0) {
            feedback += ` Watch out for ${specificIssues[0].name}.`;
        }
    } else {
        rating = 'try-again';
        emoji = '🎯';
        feedback = 'Let\'s try again. Listen to the audio first.';
        tips.unshift('Play the audio and repeat exactly what you hear');
    }
    
    return {
        score,
        wordScore,
        levenshteinScore,
        phoneticsBonus,
        rating,
        emoji,
        feedback,
        matchedWords,
        missedWords,
        closeMatches,
        extraWords,
        specificIssues,
        tips,
        transcribed,
        expected,
        analysis: expectedAnalysis
    };
}

/**
 * Levenshtein distance calculation
 */
function levenshteinDistance(s1, s2) {
    const m = s1.length;
    const n = s2.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (s1[i-1] === s2[j-1]) {
                dp[i][j] = dp[i-1][j-1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
            }
        }
    }
    
    return dp[m][n];
}

/**
 * Fallback to Web Speech API if Whisper not available
 */
export function useWebSpeechRecognition(expectedText, { onResult, onError, onEnd }) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        onError(new Error('Speech recognition not supported in this browser'));
        return null;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-PT';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript || '';
        const confidence = event.results[0]?.[0]?.confidence || 0;
        
        const score = scorePronunciation(transcript, expectedText);
        
        onResult({
            text: transcript,
            confidence: Math.round(confidence * 100),
            ...score
        });
    };
    
    recognition.onerror = (event) => {
        onError(new Error(event.error || 'Recognition failed'));
    };
    
    recognition.onend = () => {
        if (onEnd) onEnd();
    };
    
    recognition.start();
    
    return {
        stop: () => recognition.stop(),
        abort: () => recognition.abort()
    };
}

/**
 * Robust listen and transcribe function using Web Speech API
 * Designed for pronunciation practice with multiple retry handling
 * @param {number} timeoutMs - Maximum listening time (default 5000ms)
 * @param {Object} options - Additional options
 * @returns {Promise<{text: string, confidence: number, alternatives: Array}>}
 */
export function listenAndTranscribe(timeoutMs = 5000, options = {}) {
    return new Promise((resolve, reject) => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            reject(new Error('Speech recognition not supported in this browser'));
            return;
        }
        
        const recognition = new SpeechRecognition();
        recognition.lang = options.lang || 'pt-PT';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 3; // Get multiple interpretations
        
        let timeout = null;
        let hasResult = false;
        
        recognition.onresult = (event) => {
            hasResult = true;
            if (timeout) clearTimeout(timeout);
            
            const result = event.results[0];
            const transcript = result[0]?.transcript || '';
            const confidence = result[0]?.confidence || 0;
            
            // Collect alternatives for better matching
            const alternatives = [];
            for (let i = 0; i < result.length; i++) {
                alternatives.push({
                    text: result[i].transcript,
                    confidence: result[i].confidence
                });
            }
            
            resolve({ 
                text: transcript.trim(), 
                confidence: Math.round(confidence * 100),
                alternatives: alternatives.slice(1) // Exclude primary
            });
        };
        
        recognition.onerror = (event) => {
            if (timeout) clearTimeout(timeout);
            
            // Handle different error types gracefully
            const errorType = event.error;
            
            if (errorType === 'no-speech') {
                // User didn't say anything - return empty but don't reject
                resolve({ text: '', confidence: 0, alternatives: [], noSpeech: true });
            } else if (errorType === 'audio-capture') {
                reject(new Error('No microphone detected. Please check your audio settings.'));
            } else if (errorType === 'not-allowed') {
                reject(new Error('Microphone access denied. Please allow microphone access to practice pronunciation.'));
            } else if (errorType === 'network') {
                reject(new Error('Network error. Please check your internet connection.'));
            } else if (errorType === 'aborted') {
                // User or system aborted - treat as no speech
                resolve({ text: '', confidence: 0, alternatives: [], aborted: true });
            } else {
                reject(new Error(`Speech recognition error: ${errorType}`));
            }
        };
        
        recognition.onend = () => {
            if (timeout) clearTimeout(timeout);
            // If we ended without a result, resolve with empty
            if (!hasResult) {
                resolve({ text: '', confidence: 0, alternatives: [], ended: true });
            }
        };
        
        // Start listening
        try {
            recognition.start();
        } catch (err) {
            reject(new Error(`Failed to start speech recognition: ${err.message}`));
            return;
        }
        
        // Set timeout
        timeout = setTimeout(() => {
            try {
                recognition.stop();
            } catch (e) {
                // Ignore stop errors
            }
        }, timeoutMs);
    });
}

/**
 * Advanced pronunciation test with multiple attempts and best score selection
 * @param {string} expected - Expected Portuguese text
 * @param {Object} options - Options including maxAttempts, timeoutMs, wordKnowledge
 * @returns {Promise<Object>} Best score result with all attempts
 */
export async function testPronunciation(expected, options = {}) {
    const {
        maxAttempts = 1,
        timeoutMs = 6000,
        wordKnowledge = null,
        onAttemptStart = null,
        onAttemptEnd = null
    } = options;
    
    const attempts = [];
    let bestScore = null;
    
    for (let i = 0; i < maxAttempts; i++) {
        if (onAttemptStart) onAttemptStart(i + 1);
        
        try {
            const result = await listenAndTranscribe(timeoutMs);
            
            if (result.text) {
                const score = scorePronunciation(result.text, expected, wordKnowledge);
                score.attempt = i + 1;
                score.confidence = result.confidence;
                score.alternatives = result.alternatives;
                
                // Check alternatives for better matches
                if (result.alternatives && result.alternatives.length > 0) {
                    result.alternatives.forEach(alt => {
                        const altScore = scorePronunciation(alt.text, expected, wordKnowledge);
                        if (altScore.score > score.score) {
                            // Use better alternative
                            Object.assign(score, altScore);
                            score.usedAlternative = true;
                            score.originalTranscript = result.text;
                        }
                    });
                }
                
                attempts.push(score);
                
                if (!bestScore || score.score > bestScore.score) {
                    bestScore = score;
                }
                
                // If excellent, no need for more attempts
                if (score.score >= 90) {
                    break;
                }
            } else {
                attempts.push({
                    score: 0,
                    rating: 'no-speech',
                    feedback: 'No speech detected',
                    attempt: i + 1
                });
            }
        } catch (err) {
            attempts.push({
                score: 0,
                rating: 'error',
                feedback: err.message,
                attempt: i + 1,
                error: err
            });
        }
        
        if (onAttemptEnd) onAttemptEnd(i + 1, attempts[attempts.length - 1]);
    }
    
    return {
        bestScore: bestScore || { score: 0, rating: 'no-speech', feedback: 'No speech detected' },
        attempts,
        totalAttempts: attempts.length,
        improved: attempts.length > 1 && bestScore && 
            bestScore.score > (attempts[0]?.score || 0)
    };
}

// Export for use in other modules
export default {
    initializeWhisper,
    isWhisperReady,
    canUseWhisper,
    startRecording,
    stopRecording,
    getRecordingState,
    transcribe,
    recordAndTranscribe,
    stopRecordingEarly,
    scorePronunciation,
    analyzePortuguesePhonemes,
    useWebSpeechRecognition,
    listenAndTranscribe,
    testPronunciation,
    WHISPER_MODELS
};
