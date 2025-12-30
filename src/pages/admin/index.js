/**
 * Admin Pages Index
 * 
 * Exports all admin-related page components
 */

export { 
    default as AdminDashboard,
    logAIAction,
    getUserActions,
    getAllActions,
    impersonateUser,
    endImpersonation,
    isImpersonating,
    getUserList,
    renderAdminDashboard,
    initAdminDashboard
} from './AdminDashboard.js';
