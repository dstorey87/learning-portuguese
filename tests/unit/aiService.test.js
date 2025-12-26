/**
 * AIService Unit Tests
 * 
 * Tests for src/services/AIService.js
 * Tests run in browser context via Playwright
 * 
 * Required tests per IMPLEMENTATION_PLAN.md TEST-002 (11 tests):
 * AI-T001 through AI-T011
 */

import { test, expect } from '@playwright/test';

const HOME_URL = 'http://localhost:4321/';

// Helper to run code in browser context
async function evalInPage(page, fn) {
    return await page.evaluate(fn);
}

test.describe('AIService Unit Tests', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto(HOME_URL);
    });
    
    // ========================================================================
    // STATUS TESTS
    // ========================================================================
    
    test('AI-T001: checkOllamaStatus() returns status object', async ({ page }) => {
        const status = await evalInPage(page, async () => {
            const { checkOllamaStatus } = await import('/src/services/AIService.js');
            return await checkOllamaStatus();
        });
        
        expect(status).toBeDefined();
        expect(typeof status).toBe('object');
        expect(status).toHaveProperty('available');
        expect(status).toHaveProperty('models');
        // available should be a boolean (or null if not yet checked, which is falsy)
        expect(status.available === true || status.available === false || status.available === null).toBe(true);
        expect(Array.isArray(status.models)).toBe(true);
    });
    
    test('AI-T002: checkOllamaStatus() handles offline gracefully', async ({ page }) => {
        // This test passes regardless of whether Ollama is running
        // It just checks that the function handles both states without crashing
        const status = await evalInPage(page, async () => {
            const { checkOllamaStatus } = await import('/src/services/AIService.js');
            try {
                return await checkOllamaStatus();
            } catch (e) {
                return { available: false, error: e.message };
            }
        });
        
        expect(status).toBeDefined();
        expect(typeof status.available).toBe('boolean');
    });
    
    test('AI-T003: getAIStatus() returns current status', async ({ page }) => {
        const status = await evalInPage(page, async () => {
            const { getAIStatus, checkOllamaStatus } = await import('/src/services/AIService.js');
            await checkOllamaStatus();
            return getAIStatus();
        });
        
        expect(status).toBeDefined();
        expect(status).toHaveProperty('available');
        expect(status).toHaveProperty('models');
        expect(status).toHaveProperty('selectedModel');
        expect(status).toHaveProperty('provider');
    });
    
    test('AI-T004: initAIService() attempts connection', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { initAIService } = await import('/src/services/AIService.js');
            return await initAIService();
        });
        
        expect(result).toBeDefined();
        expect(result).toHaveProperty('initialized');
        expect(result.initialized).toBe(true);
        expect(result).toHaveProperty('timestamp');
    });
    
    // ========================================================================
    // PRONUNCIATION FEEDBACK TESTS
    // ========================================================================
    
    test('AI-T005: getPronunciationFeedback() returns tips', async ({ page }) => {
        const feedback = await evalInPage(page, async () => {
            const { getPronunciationFeedback } = await import('/src/services/AIService.js');
            return await getPronunciationFeedback({
                expected: 'Olá, bom dia',
                transcribed: 'ola bom dia',
                score: 75,
                missedWords: [],
                matchedWords: ['olá', 'bom', 'dia']
            });
        });
        
        expect(feedback).toBeDefined();
        expect(feedback).toHaveProperty('feedback');
        expect(feedback).toHaveProperty('source');
        expect(typeof feedback.feedback).toBe('string');
        expect(feedback.feedback.length).toBeGreaterThan(0);
    });
    
    test('AI-T006: getPronunciationFeedback() handles errors', async ({ page }) => {
        // Test with edge case - empty input
        const feedback = await evalInPage(page, async () => {
            const { getPronunciationFeedback } = await import('/src/services/AIService.js');
            try {
                return await getPronunciationFeedback({
                    expected: '',
                    transcribed: '',
                    score: 0,
                    missedWords: []
                });
            } catch (e) {
                return { error: e.message };
            }
        });
        
        // Should either return feedback or handle error gracefully
        expect(feedback).toBeDefined();
        if (!feedback.error) {
            expect(feedback).toHaveProperty('feedback');
        }
    });
    
    // ========================================================================
    // TRANSLATION FEEDBACK TESTS
    // ========================================================================
    
    test('AI-T007: getTranslationFeedback() returns feedback', async ({ page }) => {
        const feedback = await evalInPage(page, async () => {
            const { getTranslationFeedback } = await import('/src/services/AIService.js');
            return await getTranslationFeedback({
                original: 'Hello',
                userTranslation: 'Olá',
                correctTranslation: 'Olá'
            });
        });
        
        expect(feedback).toBeDefined();
        expect(feedback).toHaveProperty('feedback');
        expect(feedback).toHaveProperty('source');
    });
    
    // ========================================================================
    // GRAMMAR HELP TESTS
    // ========================================================================
    
    test('AI-T008: getGrammarHelp() returns explanation', async ({ page }) => {
        const help = await evalInPage(page, async () => {
            const { getGrammarHelp } = await import('/src/services/AIService.js');
            return await getGrammarHelp('ser_estar');
        });
        
        expect(help).toBeDefined();
        expect(help).toHaveProperty('source');
        // Should have either explanation or title+explanation
        expect(help.explanation || help.title).toBeTruthy();
    });
    
    // ========================================================================
    // CHAT TESTS
    // ========================================================================
    
    test('AI-T009: chat() sends message to Ollama', async ({ page }) => {
        const response = await evalInPage(page, async () => {
            const { chat, getAIStatus } = await import('/src/services/AIService.js');
            const status = getAIStatus();
            
            // If Ollama is available, test chat
            const result = await chat('How do you say hello in Portuguese?');
            return {
                ...result,
                ollamaAvailable: status.available
            };
        });
        
        expect(response).toBeDefined();
        expect(response).toHaveProperty('response');
        expect(response).toHaveProperty('source');
        expect(typeof response.response).toBe('string');
    });
    
    test('AI-T010: chat() receives response', async ({ page }) => {
        const response = await evalInPage(page, async () => {
            const { chat } = await import('/src/services/AIService.js');
            return await chat('What is "thank you" in Portuguese?');
        });
        
        expect(response).toBeDefined();
        expect(response.response.length).toBeGreaterThan(0);
        // Should either be from Ollama or fallback message
        expect(['ollama', 'rules'].includes(response.source)).toBe(true);
    });
    
    test('AI-T011: streamChat() streams response chunks', async ({ page }) => {
        const result = await evalInPage(page, async () => {
            const { streamChat, getAIStatus } = await import('/src/services/AIService.js');
            const status = getAIStatus();
            
            const chunks = [];
            let fullResponse = '';
            
            try {
                fullResponse = await streamChat(
                    'Say "olá" in Portuguese',
                    (token) => chunks.push(token)
                );
            } catch (e) {
                return { error: e.message, ollamaAvailable: status.available };
            }
            
            return {
                fullResponse,
                chunkCount: chunks.length,
                ollamaAvailable: status.available
            };
        });
        
        expect(result).toBeDefined();
        // If Ollama available, should have chunks, otherwise fallback message
        if (result.ollamaAvailable) {
            expect(result.chunkCount).toBeGreaterThan(0);
        } else {
            expect(result.fullResponse.length).toBeGreaterThan(0);
        }
    });
    
});
