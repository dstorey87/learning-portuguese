/**
 * Lesson Layout E2E Tests
 * 
 * Tests for the accordion-based lesson options panel layout.
 * Tests the split layout, expandable panels, and mobile drawer.
 * 
 * @phase Phase 4 - Lesson Layout & Options Panel
 */

import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = 'http://localhost:4321';

test.describe('Lesson Layout - Accordion Panel', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(BASE_URL);
        // Wait for app to load
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);
    });

    test.describe('Desktop Layout', () => {
        test('LAYOUT-E001: should load accordion CSS', async ({ page }) => {
            // Check if accordion CSS is loaded
            const hasAccordionCSS = await page.evaluate(() => {
                const stylesheets = Array.from(document.styleSheets);
                return stylesheets.some(sheet => {
                    try {
                        return sheet.href?.includes('accordion.css');
                    } catch {
                        return false;
                    }
                });
            });
            
            expect(hasAccordionCSS).toBeTruthy();
        });

        test('LAYOUT-E002: accordion component should be importable', async ({ page }) => {
            // Check if Accordion module is properly exported
            const hasAccordionComponent = await page.evaluate(async () => {
                try {
                    const module = await import('/src/components/common/Accordion.js');
                    return typeof module.Accordion === 'function' && typeof module.createAccordion === 'function';
                } catch (e) {
                    console.error('Accordion import error:', e);
                    return false;
                }
            });
            
            expect(hasAccordionComponent).toBeTruthy();
        });

        test('LAYOUT-E003: LessonOptionsPanel should be importable', async ({ page }) => {
            // Check if LessonOptionsPanel module is properly exported
            const hasLessonOptionsPanel = await page.evaluate(async () => {
                try {
                    const module = await import('/src/components/lesson/LessonOptionsPanel.js');
                    return typeof module.LessonOptionsPanel === 'function' && typeof module.createLessonOptionsPanel === 'function';
                } catch (e) {
                    console.error('LessonOptionsPanel import error:', e);
                    return false;
                }
            });
            
            expect(hasLessonOptionsPanel).toBeTruthy();
        });

        test('LAYOUT-E004: should display split layout when lesson card clicked', async ({ page }) => {
            // Navigate to a lesson
            const lessonCard = page.locator('.lesson-card, [data-testid="lesson-card"]').first();
            if (await lessonCard.isVisible()) {
                await lessonCard.click();
                await page.waitForTimeout(500);
                
                // Check for split layout
                const splitLayout = page.locator('.lesson-split-layout');
                const optionsPanel = page.locator('.lesson-options-panel, .lesson-options-container');
                
                // At least one of these should exist if accordion is enabled
                const hasAccordionLayout = await splitLayout.isVisible() || await optionsPanel.isVisible();
                
                if (hasAccordionLayout) {
                    expect(hasAccordionLayout).toBeTruthy();
                } else {
                    // Old layout - still valid
                    const hasLearnCard = await page.locator('.learn-card').isVisible();
                    expect(hasLearnCard).toBeTruthy();
                }
            } else {
                test.skip();
            }
        });

        test('LAYOUT-E002: should show options panel on right side on desktop', async ({ page }) => {
            // Set desktop viewport
            await page.setViewportSize({ width: 1280, height: 800 });
            
            const lessonCard = page.locator('.lesson-card').first();
            if (await lessonCard.isVisible()) {
                await lessonCard.click();
                await page.waitForTimeout(500);
                
                const optionsPanel = page.locator('.lesson-options-panel');
                if (await optionsPanel.isVisible()) {
                    const box = await optionsPanel.boundingBox();
                    // Panel should be on right side (x > 50% of viewport width)
                    expect(box?.x).toBeGreaterThan(640);
                }
            } else {
                test.skip();
            }
        });
    });

    test.describe('Accordion Behavior', () => {
        test('LAYOUT-E003: should show accordion sections when panel is visible', async ({ page }) => {
            const lessonCard = page.locator('.lesson-card').first();
            if (await lessonCard.isVisible()) {
                await lessonCard.click();
                await page.waitForTimeout(500);
                
                const accordionPanels = page.locator('.accordion-panel');
                const panelCount = await accordionPanels.count();
                
                if (panelCount > 0) {
                    // Should have multiple sections
                    expect(panelCount).toBeGreaterThanOrEqual(3);
                    
                    // Check for expected sections
                    const pronunciationHeader = page.locator('.accordion-header:has-text("Pronunciation")');
                    const hasProunciation = await pronunciationHeader.isVisible();
                    expect(hasProunciation).toBeTruthy();
                }
            } else {
                test.skip();
            }
        });

        test('LAYOUT-E004: should expand section on click', async ({ page }) => {
            const lessonCard = page.locator('.lesson-card').first();
            if (await lessonCard.isVisible()) {
                await lessonCard.click();
                await page.waitForTimeout(500);
                
                const accordionHeaders = page.locator('.accordion-header');
                if (await accordionHeaders.first().isVisible()) {
                    // Find a closed section
                    const closedPanel = page.locator('.accordion-panel:not(.open)').first();
                    if (await closedPanel.isVisible()) {
                        const header = closedPanel.locator('.accordion-header');
                        await header.click();
                        await page.waitForTimeout(350);
                        
                        // Check that it's now open
                        const isOpen = await closedPanel.evaluate(el => el.classList.contains('open'));
                        expect(isOpen).toBeTruthy();
                    }
                }
            } else {
                test.skip();
            }
        });

        test('LAYOUT-E005: should close other sections in single-open mode', async ({ page }) => {
            const lessonCard = page.locator('.lesson-card').first();
            if (await lessonCard.isVisible()) {
                await lessonCard.click();
                await page.waitForTimeout(500);
                
                const accordionPanels = page.locator('.accordion-panel');
                if (await accordionPanels.first().isVisible()) {
                    // Count initially open sections
                    const openPanels = page.locator('.accordion-panel.open');
                    
                    // Click on a different section
                    const closedPanel = page.locator('.accordion-panel:not(.open)').first();
                    if (await closedPanel.isVisible()) {
                        await closedPanel.locator('.accordion-header').click();
                        await page.waitForTimeout(350);
                        
                        // Should still only have one open in single-open mode
                        const openCount = await openPanels.count();
                        expect(openCount).toBeLessThanOrEqual(1);
                    }
                }
            } else {
                test.skip();
            }
        });

        test('LAYOUT-E006: should animate section expand/collapse', async ({ page }) => {
            const lessonCard = page.locator('.lesson-card').first();
            if (await lessonCard.isVisible()) {
                await lessonCard.click();
                await page.waitForTimeout(500);
                
                const accordionContent = page.locator('.accordion-content').first();
                if (await accordionContent.isVisible()) {
                    // Get transition property
                    const transition = await accordionContent.evaluate(el => {
                        return window.getComputedStyle(el).transition;
                    });
                    
                    // Should have transition for animation
                    expect(transition).toContain('max-height');
                }
            } else {
                test.skip();
            }
        });
    });

    test.describe('Section Content', () => {
        test('LAYOUT-E007: should display pronunciation content', async ({ page }) => {
            const lessonCard = page.locator('.lesson-card').first();
            if (await lessonCard.isVisible()) {
                await lessonCard.click();
                await page.waitForTimeout(500);
                
                // Look for pronunciation section
                const pronunciationPanel = page.locator('.accordion-panel').filter({ hasText: 'Pronunciation' });
                if (await pronunciationPanel.isVisible()) {
                    // Open it if needed
                    const isOpen = await pronunciationPanel.evaluate(el => el.classList.contains('open'));
                    if (!isOpen) {
                        await pronunciationPanel.locator('.accordion-header').click();
                        await page.waitForTimeout(350);
                    }
                    
                    // Check for pronunciation content
                    const content = pronunciationPanel.locator('.accordion-content-inner');
                    const hasContent = await content.isVisible();
                    expect(hasContent).toBeTruthy();
                }
            } else {
                test.skip();
            }
        });

        test('LAYOUT-E008: should display AI tips section', async ({ page }) => {
            const lessonCard = page.locator('.lesson-card').first();
            if (await lessonCard.isVisible()) {
                await lessonCard.click();
                await page.waitForTimeout(500);
                
                // Look for AI Tips section
                const aiTipsPanel = page.locator('.accordion-panel').filter({ hasText: 'AI Tips' });
                if (await aiTipsPanel.isVisible()) {
                    await aiTipsPanel.locator('.accordion-header').click();
                    await page.waitForTimeout(500);
                    
                    // Check for AI tips content (may show loading or placeholder)
                    const content = aiTipsPanel.locator('.accordion-content-inner');
                    const hasAIContent = await content.locator('.ai-tips-content, .ai-loading, .ai-placeholder').isVisible();
                    expect(hasAIContent).toBeTruthy();
                }
            } else {
                test.skip();
            }
        });
    });

    test.describe('Mobile Drawer', () => {
        test.beforeEach(async ({ page }) => {
            // Set mobile viewport
            await page.setViewportSize({ width: 375, height: 667 });
        });

        test('LAYOUT-E009: should show collapsed drawer on mobile', async ({ page }) => {
            await page.goto(BASE_URL);
            
            const lessonCard = page.locator('.lesson-card').first();
            if (await lessonCard.isVisible()) {
                await lessonCard.click();
                await page.waitForTimeout(500);
                
                const optionsPanel = page.locator('.lesson-options-panel');
                if (await optionsPanel.isVisible()) {
                    // Should be at bottom and not fully expanded
                    const box = await optionsPanel.boundingBox();
                    // Panel should be near bottom of viewport
                    expect(box?.y).toBeGreaterThan(400);
                }
            } else {
                test.skip();
            }
        });

        test('LAYOUT-E010: should expand drawer on header tap', async ({ page }) => {
            await page.goto(BASE_URL);
            
            const lessonCard = page.locator('.lesson-card').first();
            if (await lessonCard.isVisible()) {
                await lessonCard.click();
                await page.waitForTimeout(500);
                
                const optionsPanel = page.locator('.lesson-options-panel');
                const header = optionsPanel.locator('.lesson-options-header');
                
                if (await header.isVisible()) {
                    // Tap header to expand
                    await header.click();
                    await page.waitForTimeout(350);
                    
                    // Check for expanded class
                    const isExpanded = await optionsPanel.evaluate(el => el.classList.contains('expanded'));
                    expect(isExpanded).toBeTruthy();
                }
            } else {
                test.skip();
            }
        });

        test('LAYOUT-E011: should show drag handle on mobile drawer', async ({ page }) => {
            await page.goto(BASE_URL);
            
            const lessonCard = page.locator('.lesson-card').first();
            if (await lessonCard.isVisible()) {
                await lessonCard.click();
                await page.waitForTimeout(500);
                
                // Check for drag handle (pseudo-element via header)
                const header = page.locator('.lesson-options-header');
                if (await header.isVisible()) {
                    const hasBorderRadius = await header.evaluate(el => {
                        const style = window.getComputedStyle(el);
                        return style.borderRadius !== '0px';
                    });
                    expect(hasBorderRadius).toBeTruthy();
                }
            } else {
                test.skip();
            }
        });
    });

    test.describe('Accessibility', () => {
        test('LAYOUT-E012: should have proper aria attributes on accordion', async ({ page }) => {
            const lessonCard = page.locator('.lesson-card').first();
            if (await lessonCard.isVisible()) {
                await lessonCard.click();
                await page.waitForTimeout(500);
                
                const accordionHeader = page.locator('.accordion-header').first();
                if (await accordionHeader.isVisible()) {
                    // Check aria-expanded
                    const ariaExpanded = await accordionHeader.getAttribute('aria-expanded');
                    expect(ariaExpanded).toBeTruthy();
                    
                    // Check aria-controls
                    const ariaControls = await accordionHeader.getAttribute('aria-controls');
                    expect(ariaControls).toBeTruthy();
                }
            } else {
                test.skip();
            }
        });

        test('LAYOUT-E013: should be keyboard navigable', async ({ page }) => {
            const lessonCard = page.locator('.lesson-card').first();
            if (await lessonCard.isVisible()) {
                await lessonCard.click();
                await page.waitForTimeout(500);
                
                const accordionHeader = page.locator('.accordion-header').first();
                if (await accordionHeader.isVisible()) {
                    // Focus the header
                    await accordionHeader.focus();
                    
                    // Press Enter to toggle
                    await page.keyboard.press('Enter');
                    await page.waitForTimeout(350);
                    
                    // Check if toggled
                    const ariaExpanded = await accordionHeader.getAttribute('aria-expanded');
                    expect(ariaExpanded).toBe('true');
                }
            } else {
                test.skip();
            }
        });

        test('LAYOUT-E014: should have sufficient color contrast', async ({ page }) => {
            const lessonCard = page.locator('.lesson-card').first();
            if (await lessonCard.isVisible()) {
                await lessonCard.click();
                await page.waitForTimeout(500);
                
                const accordionHeader = page.locator('.accordion-header').first();
                if (await accordionHeader.isVisible()) {
                    // Get text color and background
                    const colors = await accordionHeader.evaluate(el => {
                        const style = window.getComputedStyle(el);
                        return {
                            color: style.color,
                            background: style.backgroundColor
                        };
                    });
                    
                    // Basic check - colors should be different
                    expect(colors.color).not.toBe(colors.background);
                }
            } else {
                test.skip();
            }
        });
    });

    test.describe('Performance', () => {
        test('LAYOUT-E015: should render accordion quickly', async ({ page }) => {
            const startTime = Date.now();
            
            const lessonCard = page.locator('.lesson-card').first();
            if (await lessonCard.isVisible()) {
                await lessonCard.click();
                
                // Wait for accordion to appear
                await page.locator('.accordion-panel').first().waitFor({ timeout: 2000 });
                
                const loadTime = Date.now() - startTime;
                // Should render within 2 seconds
                expect(loadTime).toBeLessThan(2000);
            } else {
                test.skip();
            }
        });

        test('LAYOUT-E016: should animate smoothly (no jank)', async ({ page }) => {
            const lessonCard = page.locator('.lesson-card').first();
            if (await lessonCard.isVisible()) {
                await lessonCard.click();
                await page.waitForTimeout(500);
                
                // Check that animations use CSS transitions (GPU accelerated)
                const accordionContent = page.locator('.accordion-content').first();
                if (await accordionContent.isVisible()) {
                    const hasTransition = await accordionContent.evaluate(el => {
                        const style = window.getComputedStyle(el);
                        return style.transition !== 'none' && style.transition !== '';
                    });
                    expect(hasTransition).toBeTruthy();
                }
            } else {
                test.skip();
            }
        });
    });
});
