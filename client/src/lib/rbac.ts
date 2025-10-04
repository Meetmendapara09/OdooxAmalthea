/**
 * Role-Based Access Control (RBAC) Utilities
 * 
 * Defines permissions for each role:
 * - Admin: Full access (create company, manage users, set roles, configure approval rules, view all expenses, override approvals)
 * - Manager: Approve/reject expenses, view team expenses, escalate as per rules
 * - Employee: Submit expenses, view their own expenses, check approval status
 */

import type { UserRole } from '@/lib/definitions';

export interface Permission {
  // Company management
  manageCompany: boolean;
  
  // User management
  createUsers: boolean;
  viewAllUsers: boolean;
  setUserRoles: boolean;
  
  // Approval rules
  configureApprovalRules: boolean;
  
  // Expense management
  submitExpenses: boolean;
  viewOwnExpenses: boolean;
  viewTeamExpenses: boolean;
  viewAllExpenses: boolean;
  
  // Approvals
  approveExpenses: boolean;
  overrideApprovals: boolean;
  
  // Settings
  accessSettings: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, Permission> = {
  admin: {
    manageCompany: true,
    createUsers: true,
    viewAllUsers: true,
    setUserRoles: true,
    configureApprovalRules: true,
    submitExpenses: true,
    viewOwnExpenses: true,
    viewTeamExpenses: true,
    viewAllExpenses: true,
    approveExpenses: true,
    overrideApprovals: true,
    accessSettings: true,
  },
  manager: {
    manageCompany: false,
    createUsers: false,
    viewAllUsers: true, // Can see users to know who they manage
    setUserRoles: false,
    configureApprovalRules: false,
    submitExpenses: true,
    viewOwnExpenses: true,
    viewTeamExpenses: true,
    viewAllExpenses: false,
    approveExpenses: true,
    overrideApprovals: false,
    accessSettings: false,
  },
  employee: {
    manageCompany: false,
    createUsers: false,
    viewAllUsers: false,
    setUserRoles: false,
    configureApprovalRules: false,
    submitExpenses: true,
    viewOwnExpenses: true,
    viewTeamExpenses: false,
    viewAllExpenses: false,
    approveExpenses: false,
    overrideApprovals: false,
    accessSettings: false,
  },
};

/**
 * Get all permissions for a given role
 */
export function getPermissions(role: UserRole): Permission {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: keyof Permission): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(role: UserRole, path: string): boolean {
  // Dashboard routes
  if (path.startsWith('/dashboard/settings/approval-rules')) {
    return hasPermission(role, 'configureApprovalRules');
  }
  
  if (path.startsWith('/dashboard/settings/team')) {
    return hasPermission(role, 'viewAllUsers') || hasPermission(role, 'viewTeamExpenses');
  }
  
  if (path.startsWith('/dashboard/settings')) {
    return hasPermission(role, 'accessSettings');
  }
  
  if (path.startsWith('/dashboard/approvals')) {
    return hasPermission(role, 'approveExpenses');
  }
  
  if (path.startsWith('/dashboard/team')) {
    return hasPermission(role, 'viewTeamExpenses');
  }
  
  if (path.startsWith('/dashboard/expenses')) {
    return hasPermission(role, 'viewAllExpenses');
  }
  
  if (path.startsWith('/dashboard/my-expenses')) {
    return hasPermission(role, 'viewOwnExpenses');
  }
  
  // Default: allow access to dashboard home
  if (path === '/dashboard' || path === '/dashboard/') {
    return true;
  }
  
  return true; // Default allow for non-restricted routes
}

/**
 * Get redirect path for role if they access unauthorized route
 */
export function getDefaultRoute(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/dashboard';
    case 'manager':
      return '/dashboard/approvals';
    case 'employee':
      return '/dashboard/my-expenses';
    default:
      return '/dashboard';
  }
}

/**
 * Helper to display role name in UI
 */
export function getRoleDisplayName(role: UserRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Get role description
 */
export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Full access to manage company, users, and all expenses';
    case 'manager':
      return 'Approve expenses and view team activities';
    case 'employee':
      return 'Submit and track personal expenses';
    default:
      return '';
  }
}
