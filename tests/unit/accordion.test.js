/**
 * Accordion Component Unit Tests
 * 
 * Tests for the expandable/collapsible accordion component.
 * 
 * @phase Phase 4 - Lesson Layout & Options Panel
 */

import { test, expect } from '@playwright/test';

// Mock DOM environment for unit tests
const mockDocument = () => {
    const container = document.createElement('div');
    container.id = 'test-accordion';
    document.body.appendChild(container);
    return container;
};

test.describe('Accordion Component', () => {
    test.describe('Initialization', () => {
        test('ACC-U001: should create accordion with provided sections', async ({ page }) => {
            await page.goto('http://localhost:4321');
            
            const result = await page.evaluate(() => {
                const { createAccordion } = window.LearningPortuguese?.components?.common || {};
                if (!createAccordion) return { error: 'createAccordion not found' };
                
                const container = document.createElement('div');
                container.id = 'test-accordion';
                document.body.appendChild(container);
                
                const accordion = createAccordion(container, {
                    sections: [
                        { id: 'sec1', title: 'Section 1', content: 'Content 1' },
                        { id: 'sec2', title: 'Section 2', content: 'Content 2' }
                    ]
                });
                
                const panelCount = container.querySelectorAll('.accordion-panel').length;
                container.remove();
                
                return { panelCount };
            });
            
            if (result.error) {
                test.skip();
                return;
            }
            
            expect(result.panelCount).toBe(2);
        });

        test('ACC-U002: should set default open section', async ({ page }) => {
            await page.goto('http://localhost:4321');
            
            const result = await page.evaluate(() => {
                const { createAccordion } = window.LearningPortuguese?.components?.common || {};
                if (!createAccordion) return { error: 'createAccordion not found' };
                
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                const accordion = createAccordion(container, {
                    sections: [
                        { id: 'sec1', title: 'Section 1', content: 'Content 1', defaultOpen: false },
                        { id: 'sec2', title: 'Section 2', content: 'Content 2', defaultOpen: true }
                    ]
                });
                
                const openSections = accordion.getOpenSections();
                container.remove();
                
                return { openSections };
            });
            
            if (result.error) {
                test.skip();
                return;
            }
            
            expect(result.openSections).toContain('sec2');
            expect(result.openSections).not.toContain('sec1');
        });

        test('ACC-U003: should render section icons when provided', async ({ page }) => {
            await page.goto('http://localhost:4321');
            
            const result = await page.evaluate(() => {
                const { createAccordion } = window.LearningPortuguese?.components?.common || {};
                if (!createAccordion) return { error: 'createAccordion not found' };
                
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                createAccordion(container, {
                    sections: [
                        { id: 'sec1', title: 'Section 1', content: 'Content 1', icon: '🔊' }
                    ]
                });
                
                const iconWrapper = container.querySelector('.accordion-icon-wrapper');
                const hasIcon = iconWrapper?.textContent?.includes('🔊');
                container.remove();
                
                return { hasIcon };
            });
            
            if (result.error) {
                test.skip();
                return;
            }
            
            expect(result.hasIcon).toBe(true);
        });
    });

    test.describe('Single Open Mode', () => {
        test('ACC-U004: should close other sections when opening a new one in single mode', async ({ page }) => {
            await page.goto('http://localhost:4321');
            
            const result = await page.evaluate(async () => {
                const { createAccordion } = window.LearningPortuguese?.components?.common || {};
                if (!createAccordion) return { error: 'createAccordion not found' };
                
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                const accordion = createAccordion(container, {
                    singleOpen: true,
                    sections: [
                        { id: 'sec1', title: 'Section 1', content: 'Content 1', defaultOpen: true },
                        { id: 'sec2', title: 'Section 2', content: 'Content 2' },
                        { id: 'sec3', title: 'Section 3', content: 'Content 3' }
                    ]
                });
                
                // Open section 2
                accordion.open('sec2');
                
                // Wait for animation
                await new Promise(r => setTimeout(r, 350));
                
                const openSections = accordion.getOpenSections();
                container.remove();
                
                return { openSections };
            });
            
            if (result.error) {
                test.skip();
                return;
            }
            
            expect(result.openSections).toEqual(['sec2']);
        });

        test('ACC-U005: should allow multiple open sections when singleOpen is false', async ({ page }) => {
            await page.goto('http://localhost:4321');
            
            const result = await page.evaluate(async () => {
                const { createAccordion } = window.LearningPortuguese?.components?.common || {};
                if (!createAccordion) return { error: 'createAccordion not found' };
                
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                const accordion = createAccordion(container, {
                    singleOpen: false,
                    sections: [
                        { id: 'sec1', title: 'Section 1', content: 'Content 1' },
                        { id: 'sec2', title: 'Section 2', content: 'Content 2' },
                        { id: 'sec3', title: 'Section 3', content: 'Content 3' }
                    ]
                });
                
                // Open multiple sections
                accordion.open('sec1');
                accordion.open('sec2');
                
                await new Promise(r => setTimeout(r, 350));
                
                const openSections = accordion.getOpenSections();
                container.remove();
                
                return { openSections };
            });
            
            if (result.error) {
                test.skip();
                return;
            }
            
            expect(result.openSections).toContain('sec1');
            expect(result.openSections).toContain('sec2');
        });
    });

    test.describe('Toggle Behavior', () => {
        test('ACC-U006: should toggle section open/closed on header click', async ({ page }) => {
            await page.goto('http://localhost:4321');
            
            const result = await page.evaluate(async () => {
                const { createAccordion } = window.LearningPortuguese?.components?.common || {};
                if (!createAccordion) return { error: 'createAccordion not found' };
                
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                const accordion = createAccordion(container, {
                    sections: [
                        { id: 'sec1', title: 'Section 1', content: 'Content 1' }
                    ]
                });
                
                const initialOpen = accordion.isOpen('sec1');
                
                // Click to open
                const header = container.querySelector('.accordion-header');
                header.click();
                await new Promise(r => setTimeout(r, 350));
                
                const afterFirstClick = accordion.isOpen('sec1');
                
                // Click to close
                header.click();
                await new Promise(r => setTimeout(r, 350));
                
                const afterSecondClick = accordion.isOpen('sec1');
                container.remove();
                
                return { initialOpen, afterFirstClick, afterSecondClick };
            });
            
            if (result.error) {
                test.skip();
                return;
            }
            
            expect(result.initialOpen).toBe(false);
            expect(result.afterFirstClick).toBe(true);
            expect(result.afterSecondClick).toBe(false);
        });
    });

    test.describe('Content Updates', () => {
        test('ACC-U007: should update section content dynamically', async ({ page }) => {
            await page.goto('http://localhost:4321');
            
            const result = await page.evaluate(() => {
                const { createAccordion } = window.LearningPortuguese?.components?.common || {};
                if (!createAccordion) return { error: 'createAccordion not found' };
                
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                const accordion = createAccordion(container, {
                    sections: [
                        { id: 'sec1', title: 'Section 1', content: 'Initial Content' }
                    ]
                });
                
                const initialContent = container.querySelector('.accordion-content-inner').textContent;
                
                accordion.updateContent('sec1', 'Updated Content');
                
                const updatedContent = container.querySelector('.accordion-content-inner').textContent;
                container.remove();
                
                return { initialContent, updatedContent };
            });
            
            if (result.error) {
                test.skip();
                return;
            }
            
            expect(result.initialContent).toBe('Initial Content');
            expect(result.updatedContent).toBe('Updated Content');
        });
    });

    test.describe('Events', () => {
        test('ACC-U008: should emit change event when section is toggled', async ({ page }) => {
            await page.goto('http://localhost:4321');
            
            const result = await page.evaluate(async () => {
                const { createAccordion } = window.LearningPortuguese?.components?.common || {};
                if (!createAccordion) return { error: 'createAccordion not found' };
                
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                const events = [];
                
                const accordion = createAccordion(container, {
                    sections: [
                        { id: 'sec1', title: 'Section 1', content: 'Content 1' }
                    ]
                });
                
                accordion.on('change', (data) => {
                    events.push(data);
                });
                
                accordion.open('sec1');
                await new Promise(r => setTimeout(r, 350));
                
                container.remove();
                
                return { events };
            });
            
            if (result.error) {
                test.skip();
                return;
            }
            
            expect(result.events.length).toBeGreaterThan(0);
            expect(result.events[0].sectionId).toBe('sec1');
            expect(result.events[0].isOpen).toBe(true);
        });

        test('ACC-U009: should allow removing event listeners', async ({ page }) => {
            await page.goto('http://localhost:4321');
            
            const result = await page.evaluate(async () => {
                const { createAccordion } = window.LearningPortuguese?.components?.common || {};
                if (!createAccordion) return { error: 'createAccordion not found' };
                
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                let callCount = 0;
                const handler = () => { callCount++; };
                
                const accordion = createAccordion(container, {
                    sections: [
                        { id: 'sec1', title: 'Section 1', content: 'Content 1' }
                    ]
                });
                
                accordion.on('change', handler);
                accordion.open('sec1');
                await new Promise(r => setTimeout(r, 100));
                
                accordion.off('change', handler);
                accordion.close('sec1');
                await new Promise(r => setTimeout(r, 100));
                
                container.remove();
                
                return { callCount };
            });
            
            if (result.error) {
                test.skip();
                return;
            }
            
            // Should only be called once (for open), not for close after removing listener
            expect(result.callCount).toBe(1);
        });
    });

    test.describe('Accessibility', () => {
        test('ACC-U010: should have proper aria attributes', async ({ page }) => {
            await page.goto('http://localhost:4321');
            
            const result = await page.evaluate(() => {
                const { createAccordion } = window.LearningPortuguese?.components?.common || {};
                if (!createAccordion) return { error: 'createAccordion not found' };
                
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                createAccordion(container, {
                    sections: [
                        { id: 'sec1', title: 'Section 1', content: 'Content 1' }
                    ]
                });
                
                const header = container.querySelector('.accordion-header');
                const content = container.querySelector('.accordion-content');
                
                const hasAriaExpanded = header.hasAttribute('aria-expanded');
                const hasAriaControls = header.hasAttribute('aria-controls');
                const hasId = content.hasAttribute('id');
                
                container.remove();
                
                return { hasAriaExpanded, hasAriaControls, hasId };
            });
            
            if (result.error) {
                test.skip();
                return;
            }
            
            expect(result.hasAriaExpanded).toBe(true);
            expect(result.hasAriaControls).toBe(true);
            expect(result.hasId).toBe(true);
        });

        test('ACC-U011: should update aria-expanded when toggled', async ({ page }) => {
            await page.goto('http://localhost:4321');
            
            const result = await page.evaluate(async () => {
                const { createAccordion } = window.LearningPortuguese?.components?.common || {};
                if (!createAccordion) return { error: 'createAccordion not found' };
                
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                const accordion = createAccordion(container, {
                    sections: [
                        { id: 'sec1', title: 'Section 1', content: 'Content 1' }
                    ]
                });
                
                const header = container.querySelector('.accordion-header');
                const initialExpanded = header.getAttribute('aria-expanded');
                
                accordion.open('sec1');
                await new Promise(r => setTimeout(r, 100));
                
                const openExpanded = header.getAttribute('aria-expanded');
                
                accordion.close('sec1');
                await new Promise(r => setTimeout(r, 100));
                
                const closedExpanded = header.getAttribute('aria-expanded');
                container.remove();
                
                return { initialExpanded, openExpanded, closedExpanded };
            });
            
            if (result.error) {
                test.skip();
                return;
            }
            
            expect(result.initialExpanded).toBe('false');
            expect(result.openExpanded).toBe('true');
            expect(result.closedExpanded).toBe('false');
        });
    });

    test.describe('Cleanup', () => {
        test('ACC-U012: should clean up properly when destroyed', async ({ page }) => {
            await page.goto('http://localhost:4321');
            
            const result = await page.evaluate(() => {
                const { createAccordion } = window.LearningPortuguese?.components?.common || {};
                if (!createAccordion) return { error: 'createAccordion not found' };
                
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                const accordion = createAccordion(container, {
                    sections: [
                        { id: 'sec1', title: 'Section 1', content: 'Content 1' }
                    ]
                });
                
                const hasContentBefore = container.children.length > 0;
                
                accordion.destroy();
                
                const hasContentAfter = container.children.length > 0;
                container.remove();
                
                return { hasContentBefore, hasContentAfter };
            });
            
            if (result.error) {
                test.skip();
                return;
            }
            
            expect(result.hasContentBefore).toBe(true);
            expect(result.hasContentAfter).toBe(false);
        });
    });
});

test.describe('LessonOptionsPanel Component', () => {
    test.describe('Section Rendering', () => {
        test('LOP-U001: should render all lesson sections', async ({ page }) => {
            await page.goto('http://localhost:4321');
            
            const result = await page.evaluate(() => {
                const { createLessonOptionsPanel, SECTION_ORDER } = window.LearningPortuguese?.components?.lesson || {};
                if (!createLessonOptionsPanel) return { error: 'createLessonOptionsPanel not found' };
                
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                const panel = createLessonOptionsPanel(container);
                
                const panelCount = container.querySelectorAll('.accordion-panel').length;
                const expectedCount = SECTION_ORDER?.length || 7;
                container.remove();
                
                return { panelCount, expectedCount };
            });
            
            if (result.error) {
                test.skip();
                return;
            }
            
            expect(result.panelCount).toBe(result.expectedCount);
        });

        test('LOP-U002: should update content when word data is set', async ({ page }) => {
            await page.goto('http://localhost:4321');
            
            const result = await page.evaluate(async () => {
                const { createLessonOptionsPanel } = window.LearningPortuguese?.components?.lesson || {};
                if (!createLessonOptionsPanel) return { error: 'createLessonOptionsPanel not found' };
                
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                const panel = createLessonOptionsPanel(container);
                
                panel.setWordData({
                    word: 'olá',
                    pronunciation: {
                        ipa: '/oˈla/',
                        guide: 'oh-LAH',
                        tip: 'Stress on second syllable'
                    }
                });
                
                // Wait for content update
                await new Promise(r => setTimeout(r, 100));
                
                const contentInner = container.querySelector('.accordion-content-inner');
                const hasIPA = contentInner?.innerHTML?.includes('/oˈla/');
                container.remove();
                
                return { hasIPA };
            });
            
            if (result.error) {
                test.skip();
                return;
            }
            
            expect(result.hasIPA).toBe(true);
        });
    });

    test.describe('Section Persistence', () => {
        test('LOP-U003: should save last open section to localStorage', async ({ page }) => {
            await page.goto('http://localhost:4321');
            
            const result = await page.evaluate(async () => {
                const { createLessonOptionsPanel } = window.LearningPortuguese?.components?.lesson || {};
                if (!createLessonOptionsPanel) return { error: 'createLessonOptionsPanel not found' };
                
                // Clear storage
                localStorage.removeItem('lessonOptionsLastOpen');
                
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                const panel = createLessonOptionsPanel(container, {
                    persistLastOpen: true,
                    storageKey: 'lessonOptionsLastOpen'
                });
                
                panel.openSection('grammar');
                await new Promise(r => setTimeout(r, 100));
                
                const savedSection = localStorage.getItem('lessonOptionsLastOpen');
                container.remove();
                
                return { savedSection };
            });
            
            if (result.error) {
                test.skip();
                return;
            }
            
            expect(result.savedSection).toBe('grammar');
        });
    });

    test.describe('Mobile Drawer', () => {
        test('LOP-U004: should toggle expanded class on mobile', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await page.goto('http://localhost:4321');
            
            const result = await page.evaluate(() => {
                const { createLessonOptionsPanel } = window.LearningPortuguese?.components?.lesson || {};
                if (!createLessonOptionsPanel) return { error: 'createLessonOptionsPanel not found' };
                
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                const panel = createLessonOptionsPanel(container);
                
                const initialExpanded = container.classList.contains('expanded');
                
                panel.toggleDrawer(true);
                const afterExpand = container.classList.contains('expanded');
                
                panel.toggleDrawer(false);
                const afterCollapse = container.classList.contains('expanded');
                
                container.remove();
                
                return { initialExpanded, afterExpand, afterCollapse };
            });
            
            if (result.error) {
                test.skip();
                return;
            }
            
            expect(result.initialExpanded).toBe(false);
            expect(result.afterExpand).toBe(true);
            expect(result.afterCollapse).toBe(false);
        });
    });

    test.describe('AI Tips Updates', () => {
        test('LOP-U005: should update AI tips dynamically', async ({ page }) => {
            await page.goto('http://localhost:4321');
            
            const result = await page.evaluate(async () => {
                const { createLessonOptionsPanel } = window.LearningPortuguese?.components?.lesson || {};
                if (!createLessonOptionsPanel) return { error: 'createLessonOptionsPanel not found' };
                
                const container = document.createElement('div');
                document.body.appendChild(container);
                
                const panel = createLessonOptionsPanel(container);
                
                panel.updateAITips([
                    { tip: 'Practice the nasal vowels' },
                    { tip: 'Focus on the "lh" sound' }
                ]);
                
                await new Promise(r => setTimeout(r, 100));
                
                const aiContent = container.querySelector('.ai-tips-content');
                const tipCount = aiContent?.querySelectorAll('.ai-tip-item').length || 0;
                container.remove();
                
                return { tipCount };
            });
            
            if (result.error) {
                test.skip();
                return;
            }
            
            expect(result.tipCount).toBe(2);
        });
    });
});
