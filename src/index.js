/**
 * PortuLingo - Portuguese Language Learning App
 * Main entry point for modular source code
 * 
 * @version 0.1.0
 * @author PortuLingo Team
 */

// Export all modules
export * from './components/index.js';
export * from './config/constants.js';
export * from './data/index.js';
export * from './pages/index.js';
export * from './services/index.js';
export * from './stores/index.js';
export * from './utils/index.js';

// Version info
export const APP_VERSION = '0.1.0';
export const BUILD_DATE = '2025-12-26';

/**
 * Initialize the application
 * This will be called from the main app.js during migration
 */
export async function initializeApp() {
    console.log('[PortuLingo] Initializing modular app...');
    
    // Import services
    const { HealthMonitor } = await import('./services/healthMonitor.js');
    const { UserStorage } = await import('./services/userStorage.js');
    const { EventStreaming } = await import('./services/eventStreaming.js');
    
    // Run health checks
    const monitor = new HealthMonitor();
    const healthResults = await monitor.runAllChecks();
    
    console.log('[PortuLingo] Health check results:', healthResults);
    
    return {
        healthy: healthResults.every(r => r.status === 'healthy'),
        results: healthResults
    };
}

console.log('[PortuLingo] Modular source loaded');
