/**
 * AI Chat E2E Tests
 * 
 * Validates the AI chat interface works live in the browser.
 * Tests UI rendering, user interaction, and AI response flow.
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4321';

test.describe('AI Chat Component', () => {
    
    test.beforeEach(async ({ page }) => {
        // Navigate to the app
        await page.goto(BASE_URL);
        
        // Wait for the app to fully load
        await page.waitForLoadState('networkidle');
        
        // Wait for the FAB button to appear (it loads after a 500ms delay)
        await page.waitForSelector('#aiChatFab', { timeout: 10000 });
    });

    test('AICHAT-001: AI chat FAB button renders', async ({ page }) => {
        const fab = page.locator('#aiChatFab');
        await expect(fab).toBeVisible();
        await expect(fab).toContainText('AI Tutor');
    });

    test('AICHAT-002: Clicking FAB opens chat widget', async ({ page }) => {
        // Click the FAB
        await page.click('#aiChatFab');
        
        // Wait for chat widget to appear
        await page.waitForSelector('.ai-chat-widget', { timeout: 10000 });
        
        const widget = page.locator('.ai-chat-widget');
        await expect(widget).toBeVisible();
    });

    test('AICHAT-003: Chat widget has all main elements', async ({ page }) => {
        await page.click('#aiChatFab');
        await page.waitForSelector('.ai-chat-widget');
        
        // Header
        const header = page.locator('.ai-chat-header');
        await expect(header).toBeVisible();
        await expect(header).toContainText('Portuguese Tutor');
        
        // Messages area
        const messagesArea = page.locator('.ai-chat-messages');
        await expect(messagesArea).toBeVisible();
        
        // Input
        const input = page.locator('#aiInput');
        await expect(input).toBeVisible();
        
        // Send button
        const sendBtn = page.locator('#aiSendBtn');
        await expect(sendBtn).toBeVisible();
        
        // Voice toggle
        const voiceToggle = page.locator('#aiVoiceToggle');
        await expect(voiceToggle).toBeVisible();
    });

    test('AICHAT-004: Welcome message displays', async ({ page }) => {
        await page.click('#aiChatFab');
        await page.waitForSelector('.ai-chat-widget');
        
        const welcomeMessage = page.locator('.ai-message.assistant').first();
        await expect(welcomeMessage).toBeVisible();
        await expect(welcomeMessage).toContainText('Olá');
    });

    test('AICHAT-005: Quick suggestion buttons visible', async ({ page }) => {
        await page.click('#aiChatFab');
        await page.waitForSelector('.ai-chat-widget');
        
        const suggestions = page.locator('.ai-suggestion');
        const count = await suggestions.count();
        expect(count).toBe(4);
    });

    test('AICHAT-006: User can type in input', async ({ page }) => {
        await page.click('#aiChatFab');
        await page.waitForSelector('.ai-chat-widget');
        
        const input = page.locator('#aiInput');
        await input.fill('Test message for AI');
        
        await expect(input).toHaveValue('Test message for AI');
    });

    test('AICHAT-007: Send button sends message', async ({ page }) => {
        await page.click('#aiChatFab');
        await page.waitForSelector('.ai-chat-widget');
        
        const input = page.locator('#aiInput');
        await input.fill('Hello AI');
        
        await page.click('#aiSendBtn');
        
        // User message should appear
        await page.waitForSelector('.ai-message.user', { timeout: 5000 });
        const userMessage = page.locator('.ai-message.user').last();
        await expect(userMessage).toContainText('Hello AI');
    });

    test('AICHAT-008: Enter key sends message', async ({ page }) => {
        await page.click('#aiChatFab');
        await page.waitForSelector('.ai-chat-widget');
        
        const input = page.locator('#aiInput');
        await input.fill('Enter test');
        await input.press('Enter');
        
        // User message should appear
        await page.waitForSelector('.ai-message.user', { timeout: 5000 });
        const userMessage = page.locator('.ai-message.user').last();
        await expect(userMessage).toContainText('Enter test');
        
        // Input should be cleared
        await expect(input).toHaveValue('');
    });

    test('AICHAT-009: Clicking suggestion sends message', async ({ page }) => {
        await page.click('#aiChatFab');
        await page.waitForSelector('.ai-chat-widget');
        
        await page.click('.ai-suggestion >> nth=0');
        
        // User message should appear with suggestion text
        await page.waitForSelector('.ai-message.user', { timeout: 5000 });
        const userMessage = page.locator('.ai-message.user').last();
        await expect(userMessage).toContainText('pronounce');
    });

    test('AICHAT-010: Minimize and expand works', async ({ page }) => {
        await page.click('#aiChatFab');
        await page.waitForSelector('.ai-chat-widget');
        
        // Minimize
        await page.click('#aiMinimize');
        
        const widget = page.locator('.ai-chat-widget');
        await expect(widget).toHaveClass(/minimized/);
        
        // Expand by clicking header
        await page.click('.ai-chat-header');
        await expect(widget).not.toHaveClass(/minimized/);
    });

    test('AICHAT-011: Status shows Ready to help', async ({ page }) => {
        await page.click('#aiChatFab');
        await page.waitForSelector('.ai-chat-widget');
        
        const status = page.locator('#aiStatus');
        await expect(status).toHaveText('Ready to help');
    });

    test('AICHAT-012: Portuguese characters preserved', async ({ page }) => {
        await page.click('#aiChatFab');
        await page.waitForSelector('.ai-chat-widget');
        
        const input = page.locator('#aiInput');
        await input.fill('Olá, coração, obrigação');
        await input.press('Enter');
        
        await page.waitForSelector('.ai-message.user', { timeout: 5000 });
        const userMessage = page.locator('.ai-message.user').last();
        
        await expect(userMessage).toContainText('Olá');
        await expect(userMessage).toContainText('coração');
        await expect(userMessage).toContainText('obrigação');
    });

    test('AICHAT-013: Multiple messages accumulate', async ({ page }) => {
        await page.click('#aiChatFab');
        await page.waitForSelector('.ai-chat-widget');
        
        const input = page.locator('#aiInput');
        
        // Send first message
        await input.fill('First');
        await input.press('Enter');
        await page.waitForSelector('.ai-message.user');
        
        // Send second message
        await input.fill('Second');
        await input.press('Enter');
        
        await page.waitForTimeout(500);
        
        const userMessages = page.locator('.ai-message.user');
        const count = await userMessages.count();
        expect(count).toBeGreaterThanOrEqual(2);
    });

    test('AICHAT-014: Shift+Enter creates newline', async ({ page }) => {
        test.slow(); // This test may need extra time due to keyboard interactions
        
        await page.click('#aiChatFab');
        await page.waitForSelector('.ai-chat-widget', { timeout: 10000 });
        
        const input = page.locator('#aiInput');
        await input.fill('Line 1');
        await input.press('Shift+Enter');
        await input.type('Line 2');
        
        const value = await input.inputValue();
        expect(value).toContain('Line 1');
        expect(value).toContain('Line 2');
        
        // Should NOT have sent yet
        const userMessages = page.locator('.ai-message.user');
        const count = await userMessages.count();
        expect(count).toBe(0);
    });

    test('AICHAT-015: FAB hides when chat opens', async ({ page }) => {
        await page.click('#aiChatFab');
        await page.waitForSelector('.ai-chat-widget');
        
        const fab = page.locator('#aiChatFab');
        await expect(fab).toHaveClass(/hidden/);
    });

    test('AICHAT-016: Widget z-index is high', async ({ page }) => {
        await page.click('#aiChatFab');
        await page.waitForSelector('.ai-chat-widget');
        
        const widget = page.locator('.ai-chat-widget');
        const zIndex = await widget.evaluate(el => 
            window.getComputedStyle(el).zIndex
        );
        
        expect(parseInt(zIndex)).toBeGreaterThanOrEqual(1000);
    });

});

test.describe('AI Chat Integration', () => {
    
    test('AICHAT-INT-001: No critical errors on init', async ({ page }) => {
        const errors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('#aiChatFab', { timeout: 10000 });
        
        // Click to initialize
        await page.click('#aiChatFab');
        await page.waitForSelector('.ai-chat-widget', { timeout: 10000 });
        
        // Filter expected warnings and known optional service failures
        const criticalErrors = errors.filter(e => 
            !e.includes('AI agent not available') &&
            !e.includes('Voice not available') &&
            !e.includes('Ollama') &&
            !e.includes('CORS') &&
            !e.includes('favicon') &&
            !e.includes('404') &&
            !e.includes('net::ERR_CONNECTION_REFUSED') &&
            !e.includes('silero_vad') &&
            !e.includes('voice_conversation')
        );
        
        // Log remaining errors for debugging
        if (criticalErrors.length > 0) {
            console.log('Unexpected errors:', criticalErrors);
        }
        
        expect(criticalErrors).toHaveLength(0);
    });

    test('AICHAT-INT-002: Chat handles no AI gracefully', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('#aiChatFab', { timeout: 10000 });
        
        await page.click('#aiChatFab');
        await page.waitForSelector('.ai-chat-widget');
        
        // Send a message
        const input = page.locator('#aiInput');
        await input.fill('Test');
        await input.press('Enter');
        
        // Should still show the user message
        await page.waitForSelector('.ai-message.user', { timeout: 5000 });
        
        // Widget should remain functional
        const widget = page.locator('.ai-chat-widget');
        await expect(widget).toBeVisible();
    });

    test('AICHAT-INT-003: Global aiChat object available', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('#aiChatFab', { timeout: 10000 });
        
        const hasAIChat = await page.evaluate(() => {
            return typeof window.aiChat !== 'undefined' &&
                   typeof window.aiChat.show === 'function' &&
                   typeof window.aiChat.hide === 'function' &&
                   typeof window.aiChat.toggle === 'function';
        });
        
        expect(hasAIChat).toBe(true);
    });

});
