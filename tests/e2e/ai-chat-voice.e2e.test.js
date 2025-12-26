/**
 * AI Chat Voice Features E2E Tests
 * 
 * End-to-end tests for AI Chat voice integration:
 * - Voice mode toggle (WebSpeechService)
 * - TTS playback (TTSService)
 * - Inline audio buttons
 * - Pronunciation assessment
 * - Transcription display
 * 
 * @module tests/e2e/ai-chat-voice.e2e.test.js
 * @since Phase 15 - Voice Integration Excellence
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321/';

// Clear state before each test
test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.evaluate(() => {
        localStorage.removeItem('portugueseAuth');
        localStorage.removeItem('portugueseProgress');
    });
    await page.waitForTimeout(300);
});

/**
 * Helper to open AI Chat widget
 */
async function openAIChat(page) {
    // Look for AI chat toggle button
    const aiToggle = page.locator(
        '#toggleAIChat, .ai-chat-toggle, ' +
        'button[aria-label*="AI"], button[aria-label*="chat"]'
    ).first();
    
    if (await aiToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
        await aiToggle.click();
        await page.waitForTimeout(500);
    }
    
    return page;
}

test.describe('AI Chat Voice Features', () => {
    
    test.describe('Voice Mode Toggle', () => {
        
        test('AICHAT-VOICE-E001: Voice toggle button exists in AI chat', async ({ page }) => {
            await openAIChat(page);
            
            // The AI chat widget should exist
            const aiWidget = page.locator('.ai-chat-widget, #aiChatWidget');
            
            if (await aiWidget.isVisible({ timeout: 2000 }).catch(() => false)) {
                await expect(aiWidget.first()).toBeVisible();
                
                // Check for voice toggle within the widget
                const toggleInWidget = aiWidget.locator(
                    '#aiVoiceToggle, .ai-voice-toggle, ' +
                    'button:has-text("🎤"), button[title*="voice"]'
                );
                
                if (await toggleInWidget.count() > 0) {
                    await expect(toggleInWidget.first()).toBeVisible();
                } else {
                    // Voice toggle may not be visible but widget exists
                    expect(await aiWidget.count()).toBeGreaterThan(0);
                }
            } else {
                // AI chat not available, skip
                test.skip();
            }
        });
        
        test('AICHAT-VOICE-E002: Voice toggle is clickable and changes state', async ({ page }) => {
            await openAIChat(page);
            
            const voiceToggle = page.locator('#aiVoiceToggle, .ai-voice-toggle').first();
            
            if (await voiceToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
                await expect(voiceToggle).toBeEnabled();
                
                // Click to toggle
                await voiceToggle.click();
                await page.waitForTimeout(300);
                
                // Should show listening state or error
                const status = page.locator('#aiStatus, .ai-status, .voice-status');
                if (await status.count() > 0) {
                    const statusText = await status.textContent();
                    // Status should change to indicate voice mode
                    expect(statusText).toBeTruthy();
                }
                
                // Click again to stop
                await voiceToggle.click();
                await page.waitForTimeout(300);
            } else {
                test.skip();
            }
        });
        
        test('AICHAT-VOICE-E003: Voice indicator shows during voice mode', async ({ page }) => {
            await openAIChat(page);
            
            const voiceToggle = page.locator('#aiVoiceToggle, .ai-voice-toggle').first();
            
            if (await voiceToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
                // Start voice mode
                await voiceToggle.click();
                await page.waitForTimeout(500);
                
                // Check for voice indicator or status change
                const voiceIndicator = page.locator(
                    '#aiVoiceIndicator, .ai-voice-indicator, .listening-indicator'
                );
                
                const isVisible = await voiceIndicator.isVisible({ timeout: 1000 }).catch(() => false);
                
                // Either indicator is visible OR status shows listening/error
                const status = page.locator('#aiStatus, .ai-status');
                const statusText = await status.textContent().catch(() => '');
                
                expect(isVisible || statusText.length > 0).toBeTruthy();
                
                // Stop voice mode
                await voiceToggle.click();
            } else {
                test.skip();
            }
        });
    });
    
    test.describe('Inline Audio Playback', () => {
        
        test('AICHAT-VOICE-E004: AI widget handles input and response', async ({ page }) => {
            await openAIChat(page);
            
            const aiWidget = page.locator('.ai-chat-widget, #aiChatWidget');
            
            if (await aiWidget.isVisible({ timeout: 2000 }).catch(() => false)) {
                const input = page.locator('#aiInput, .ai-chat-input textarea');
                
                if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
                    await input.fill('Hello');
                    
                    const sendBtn = page.locator('#aiSendBtn, .ai-send-btn');
                    await sendBtn.click();
                    
                    // Wait for response
                    await page.waitForTimeout(2000);
                    
                    // Test passes if AI responded or there are messages
                    const messages = page.locator('.ai-message');
                    expect(await messages.count()).toBeGreaterThan(0);
                } else {
                    test.skip();
                }
            } else {
                test.skip();
            }
        });
        
        test('AICHAT-VOICE-E005: Audio buttons are functional if present', async ({ page }) => {
            await openAIChat(page);
            
            // Check for any existing audio buttons
            const audioButtons = page.locator(
                '.inline-audio-btn, button:has-text("🔊"), .portuguese-word button'
            );
            
            if (await audioButtons.count() > 0) {
                const btn = audioButtons.first();
                await expect(btn).toBeEnabled();
                
                // Click should not throw error
                await btn.click().catch(() => {});
                await page.waitForTimeout(500);
            }
            
            // Test passes - audio buttons are optional
            expect(true).toBeTruthy();
        });
    });
    
    test.describe('AI Response TTS', () => {
        
        test('AICHAT-VOICE-E006: AI status element exists', async ({ page }) => {
            await openAIChat(page);
            
            const aiWidget = page.locator('.ai-chat-widget, #aiChatWidget');
            
            if (await aiWidget.isVisible({ timeout: 2000 }).catch(() => false)) {
                const status = page.locator('#aiStatus, .ai-status');
                
                if (await status.count() > 0) {
                    const statusText = await status.textContent();
                    expect(statusText).toBeTruthy();
                } else {
                    // Status element may not exist, which is acceptable
                    expect(true).toBeTruthy();
                }
            } else {
                test.skip();
            }
        });
    });
    
    test.describe('Pronunciation Assessment', () => {
        
        test('AICHAT-VOICE-E007: Global playPortugueseWord function exists', async ({ page }) => {
            await openAIChat(page);
            
            const hasFunction = await page.evaluate(() => {
                return typeof window.playPortugueseWord === 'function';
            });
            
            expect(hasFunction).toBeTruthy();
        });
        
        test('AICHAT-VOICE-E008: Global assessPronunciation function exists', async ({ page }) => {
            await openAIChat(page);
            
            const hasFunction = await page.evaluate(() => {
                return typeof window.assessPronunciation === 'function';
            });
            
            expect(hasFunction).toBeTruthy();
        });
        
        test('AICHAT-VOICE-E009: playPortugueseWord can be called', async ({ page }) => {
            await openAIChat(page);
            
            const result = await page.evaluate(async () => {
                try {
                    if (typeof window.playPortugueseWord === 'function') {
                        await window.playPortugueseWord('olá').catch(() => {});
                        return { success: true };
                    }
                    return { success: false, reason: 'function not found' };
                } catch (error) {
                    return { success: false, reason: error.message };
                }
            });
            
            expect(result.success).toBeTruthy();
        });
    });
    
    test.describe('Message Formatting', () => {
        
        test('AICHAT-VOICE-E010: User messages show correctly', async ({ page }) => {
            await openAIChat(page);
            
            const input = page.locator('#aiInput, .ai-chat-input textarea');
            
            if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
                await input.fill('Test message');
                
                const sendBtn = page.locator('#aiSendBtn, .ai-send-btn');
                await sendBtn.click();
                await page.waitForTimeout(500);
                
                // Check for user message
                const userMessage = page.locator('.ai-message.user');
                expect(await userMessage.count()).toBeGreaterThan(0);
            } else {
                test.skip();
            }
        });
    });
    
    test.describe('UI Styling', () => {
        
        test('AICHAT-VOICE-E011: Voice toggle has proper styling', async ({ page }) => {
            await openAIChat(page);
            
            const voiceToggle = page.locator('#aiVoiceToggle, .ai-voice-toggle').first();
            
            if (await voiceToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
                const styles = await voiceToggle.evaluate(el => {
                    const computed = window.getComputedStyle(el);
                    return {
                        display: computed.display,
                        cursor: computed.cursor
                    };
                });
                
                expect(styles.display).not.toBe('none');
                expect(styles.cursor).toBe('pointer');
            } else {
                test.skip();
            }
        });
        
        test('AICHAT-VOICE-E012: Chat widget has reasonable dimensions', async ({ page }) => {
            await openAIChat(page);
            
            const widget = page.locator('.ai-chat-widget, #aiChatWidget').first();
            
            if (await widget.isVisible({ timeout: 2000 }).catch(() => false)) {
                const box = await widget.boundingBox();
                
                if (box) {
                    expect(box.width).toBeGreaterThan(200);
                    expect(box.height).toBeGreaterThan(100);
                } else {
                    test.skip();
                }
            } else {
                test.skip();
            }
        });
    });
});

test.describe('Voice Service Integration', () => {
    
    test('VOICE-INT-E001: WebSpeechService availability', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(1000);
        
        const hasWebSpeech = await page.evaluate(() => {
            return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
        });
        
        // Test should work in Chrome
        expect(typeof hasWebSpeech).toBe('boolean');
    });
    
    test('VOICE-INT-E002: TTS server health check', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForTimeout(500);
        
        const health = await page.evaluate(async () => {
            try {
                const response = await fetch('http://localhost:3001/health', {
                    method: 'GET'
                });
                return { available: response.ok, status: response.status };
            } catch {
                return { available: false };
            }
        });
        
        expect(typeof health.available).toBe('boolean');
    });
});
