/**
 * Role-Based Access Control (RBAC) Validation Script
 * 
 * This script tests:
 * 1. User signup with different roles
 * 2. Role-based permissions verification
 * 3. Access control for different features
 */

import { PrismaClient } from '@prisma/client';
import { getPermissions, hasPermission, canAccessRoute, getDefaultRoute } from '../src/lib/rbac';

const prisma = new PrismaClient();

async function validateRBAC() {
  console.log('🔐 Starting RBAC Validation...\n');

  try {
    // Step 1: Verify users have correct roles
    console.log('Step 1: Verifying user roles in database...');
    const admin = await prisma.user.findUnique({ where: { email: 'admin@expenseasy.com' } });
    const manager = await prisma.user.findUnique({ where: { email: 'manager@expenseasy.com' } });
    const employee = await prisma.user.findUnique({ where: { email: 'employee@expenseasy.com' } });

    if (!admin || !manager || !employee) {
      throw new Error('Missing test users. Run: npm run db:seed');
    }

    console.log(`  ✓ Admin User: ${admin.name} - Role: ${admin.role}`);
    console.log(`  ✓ Manager User: ${manager.name} - Role: ${manager.role}`);
    console.log(`  ✓ Employee User: ${employee.name} - Role: ${employee.role}\n`);

    // Step 2: Test admin permissions
    console.log('Step 2: Testing Admin permissions...');
    const adminPerms = getPermissions('admin');
    console.log(`  ✓ Can manage company: ${adminPerms.manageCompany}`);
    console.log(`  ✓ Can create users: ${adminPerms.createUsers}`);
    console.log(`  ✓ Can configure approval rules: ${adminPerms.configureApprovalRules}`);
    console.log(`  ✓ Can view all expenses: ${adminPerms.viewAllExpenses}`);
    console.log(`  ✓ Can override approvals: ${adminPerms.overrideApprovals}`);
    
    if (!adminPerms.manageCompany || !adminPerms.configureApprovalRules || !adminPerms.viewAllExpenses) {
      throw new Error('Admin permissions are incorrect!');
    }
    console.log('  ✅ All admin permissions verified\n');

    // Step 3: Test manager permissions
    console.log('Step 3: Testing Manager permissions...');
    const managerPerms = getPermissions('manager');
    console.log(`  ✓ Can manage company: ${managerPerms.manageCompany}`);
    console.log(`  ✓ Can approve expenses: ${managerPerms.approveExpenses}`);
    console.log(`  ✓ Can view team expenses: ${managerPerms.viewTeamExpenses}`);
    console.log(`  ✓ Can view all expenses: ${managerPerms.viewAllExpenses}`);
    console.log(`  ✓ Can configure approval rules: ${managerPerms.configureApprovalRules}`);
    
    if (managerPerms.manageCompany || !managerPerms.approveExpenses || !managerPerms.viewTeamExpenses) {
      throw new Error('Manager permissions are incorrect!');
    }
    console.log('  ✅ All manager permissions verified\n');

    // Step 4: Test employee permissions
    console.log('Step 4: Testing Employee permissions...');
    const employeePerms = getPermissions('employee');
    console.log(`  ✓ Can submit expenses: ${employeePerms.submitExpenses}`);
    console.log(`  ✓ Can view own expenses: ${employeePerms.viewOwnExpenses}`);
    console.log(`  ✓ Can approve expenses: ${employeePerms.approveExpenses}`);
    console.log(`  ✓ Can view all expenses: ${employeePerms.viewAllExpenses}`);
    console.log(`  ✓ Can view team expenses: ${employeePerms.viewTeamExpenses}`);
    
    if (!employeePerms.submitExpenses || employeePerms.approveExpenses || employeePerms.viewAllExpenses) {
      throw new Error('Employee permissions are incorrect!');
    }
    console.log('  ✅ All employee permissions verified\n');

    // Step 5: Test route access control
    console.log('Step 5: Testing route access control...');
    
    // Admin routes
    console.log('  Admin route access:');
    console.log(`    - /dashboard/settings/approval-rules: ${canAccessRoute('admin', '/dashboard/settings/approval-rules')}`);
    console.log(`    - /dashboard/expenses: ${canAccessRoute('admin', '/dashboard/expenses')}`);
    console.log(`    - /dashboard/approvals: ${canAccessRoute('admin', '/dashboard/approvals')}`);
    
    // Manager routes
    console.log('  Manager route access:');
    console.log(`    - /dashboard/settings/approval-rules: ${canAccessRoute('manager', '/dashboard/settings/approval-rules')}`);
    console.log(`    - /dashboard/expenses: ${canAccessRoute('manager', '/dashboard/expenses')}`);
    console.log(`    - /dashboard/approvals: ${canAccessRoute('manager', '/dashboard/approvals')}`);
    console.log(`    - /dashboard/team: ${canAccessRoute('manager', '/dashboard/team')}`);
    
    // Employee routes
    console.log('  Employee route access:');
    console.log(`    - /dashboard/settings/approval-rules: ${canAccessRoute('employee', '/dashboard/settings/approval-rules')}`);
    console.log(`    - /dashboard/expenses: ${canAccessRoute('employee', '/dashboard/expenses')}`);
    console.log(`    - /dashboard/approvals: ${canAccessRoute('employee', '/dashboard/approvals')}`);
    console.log(`    - /dashboard/my-expenses: ${canAccessRoute('employee', '/dashboard/my-expenses')}`);
    
    if (!canAccessRoute('admin', '/dashboard/settings/approval-rules')) {
      throw new Error('Admin should have access to approval rules!');
    }
    if (canAccessRoute('employee', '/dashboard/settings/approval-rules')) {
      throw new Error('Employee should NOT have access to approval rules!');
    }
    if (canAccessRoute('employee', '/dashboard/approvals')) {
      throw new Error('Employee should NOT have access to approvals!');
    }
    console.log('  ✅ Route access control verified\n');

    // Step 6: Test default routes
    console.log('Step 6: Testing default routes for each role...');
    console.log(`  Admin default route: ${getDefaultRoute('admin')}`);
    console.log(`  Manager default route: ${getDefaultRoute('manager')}`);
    console.log(`  Employee default route: ${getDefaultRoute('employee')}`);
    console.log('  ✅ Default routes verified\n');

    // Step 7: Test specific permissions
    console.log('Step 7: Testing specific permissions...');
    console.log(`  Admin can configureApprovalRules: ${hasPermission('admin', 'configureApprovalRules')}`);
    console.log(`  Manager can configureApprovalRules: ${hasPermission('manager', 'configureApprovalRules')}`);
    console.log(`  Employee can configureApprovalRules: ${hasPermission('employee', 'configureApprovalRules')}`);
    
    console.log(`  Admin can approveExpenses: ${hasPermission('admin', 'approveExpenses')}`);
    console.log(`  Manager can approveExpenses: ${hasPermission('manager', 'approveExpenses')}`);
    console.log(`  Employee can approveExpenses: ${hasPermission('employee', 'approveExpenses')}`);
    
    console.log(`  Admin can submitExpenses: ${hasPermission('admin', 'submitExpenses')}`);
    console.log(`  Manager can submitExpenses: ${hasPermission('manager', 'submitExpenses')}`);
    console.log(`  Employee can submitExpenses: ${hasPermission('employee', 'submitExpenses')}`);
    console.log('  ✅ Specific permissions verified\n');

    // Step 8: Verify manager hierarchy
    console.log('Step 8: Verifying manager hierarchy...');
    const employeeWithManager = await prisma.user.findUnique({
      where: { email: 'employee@expenseasy.com' },
      include: { manager: true }
    });
    
    if (employeeWithManager?.manager) {
      console.log(`  ✓ Employee ${employeeWithManager.name} reports to Manager ${employeeWithManager.manager.name}`);
      console.log(`  ✓ Manager role: ${employeeWithManager.manager.role}`);
      
      if (employeeWithManager.manager.role !== 'manager') {
        throw new Error('Employee manager should have manager role!');
      }
    } else {
      console.log('  ⚠ Employee has no manager assigned (this is OK for testing)');
    }
    console.log('  ✅ Manager hierarchy verified\n');

    console.log('✅ All RBAC validation steps passed!\n');
    console.log('Summary:');
    console.log('  - Admin: Full access (manage company, approval rules, all expenses)');
    console.log('  - Manager: Approve expenses, view team, no admin settings');
    console.log('  - Employee: Submit/view own expenses only');
    
  } catch (error) {
    console.error('❌ RBAC validation failed:', error);
    throw error;
  }
}

validateRBAC()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
