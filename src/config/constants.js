/**
 * Application Constants
 * Central configuration for the PortuLingo app
 */

export const APP_CONFIG = {
    name: 'PortuLingo',
    version: '2.0.0',
    language: 'pt-PT', // European Portuguese only
};

export const API_ENDPOINTS = {
    ollama: 'http://localhost:11434',
    tts: 'http://localhost:3001',
    whisper: 'http://localhost:3002',
};

export const AI_CONFIG = {
    provider: 'ollama',
    model: 'qwen2.5:7b',
    fallbackModel: 'qwen2.5:3b',
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 500,
    repeatPenalty: 1.1,
    contextLength: 4096,
    timeout: 10000, // 10 seconds
    maxRetries: 3,
    retryDelay: 1000,
};

export const VOICE_CONFIG = {
    defaultSpeed: 1.0,
    minSpeed: 0.5,
    maxSpeed: 2.0,
    speedStep: 0.1,
};

export const LEARNING_CONFIG = {
    failureThresholdForCustomLesson: 5,
    debounceDelay: 300, // ms for real-time event streaming
    batchSize: 10, // events to batch before sending to AI
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
};

export const UI_CONFIG = {
    mobileBreakpoint: 768,
    sidebarWidth: 280,
    animationDuration: 300,
};

export const STORAGE_KEYS = {
    events: (userId) => `${userId}_events`,
    learning: (userId) => `${userId}_learning`,
    progress: (userId) => `${userId}_progress`,
    aiTips: (userId) => `${userId}_aiTips`,
    aiChat: (userId) => `${userId}_aiChat`,
    customLessons: (userId) => `${userId}_customLessons`,
    settings: (userId) => `${userId}_settings`,
    voicePrefs: (userId) => `${userId}_voicePrefs`,
    currentSession: (userId) => `${userId}_currentSession`,
};
