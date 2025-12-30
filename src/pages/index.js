/**
 * Pages Index
 * Page-level components for routing
 * 
 * @module pages
 */

// Main pages
// export { HomePage } from './HomePage.js';
// export { LessonPage } from './LessonPage.js';
// export { PracticePage } from './PracticePage.js';
// export { ProgressPage } from './ProgressPage.js';

// Admin pages
export { 
    AdminDashboard, 
    logAIAction,
    getUserActions,
    getAllActions,
    impersonateUser,
    endImpersonation,
    isImpersonating,
    getUserList,
    renderAdminDashboard,
    initAdminDashboard
} from './admin/index.js';
// export { UserManagement } from './admin/UserManagement.js';
// export { MonitoringDashboard } from './admin/MonitoringDashboard.js';

// Auth pages
// export { LoginPage } from './auth/LoginPage.js';
// export { ProfilePage } from './auth/ProfilePage.js';

// Page version
export const PAGES_VERSION = '0.1.0';
