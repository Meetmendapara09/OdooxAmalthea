import { PrismaClient } from '@prisma/client';

/**
 * End-to-end validation script for approval policies
 * Tests: policy creation, expense derivation, approval workflow
 */

const MANAGER_VIRTUAL_ID = "__MANAGER__";

async function validate() {
  const prisma = new PrismaClient();
  
  try {
    console.log('\n🔍 Starting end-to-end validation...\n');
    
    // 1. Verify database state
    console.log('✓ Step 1: Verifying database state...');
    const company = await prisma.company.findFirst();
    const employee = await prisma.user.findUnique({ 
      where: { email: 'employee@expenseasy.com' },
      include: { manager: true }
    });
    const manager = await prisma.user.findFirst({ where: { role: 'manager' } });
    const cfo = await prisma.user.findFirst({ where: { email: 'cfo@expenseasy.com' } });
    
    if (!company || !employee || !manager || !cfo) {
      throw new Error('Missing required entities in database');
    }
    
    console.log(`  Company: ${company.name}`);
    console.log(`  Employee: ${employee.name} (Manager: ${employee.manager?.name || 'None'})`);
    console.log(`  Manager: ${manager.name}`);
    console.log(`  CFO: ${cfo.name}\n`);
    
    // 2. Check existing policies
    console.log('✓ Step 2: Checking existing policies...');
    const existingPolicies = await prisma.approvalPolicy.findMany({
      where: { companyId: company.id },
      include: { approvers: true }
    });
    console.log(`  Found ${existingPolicies.length} existing policies\n`);
    
    // 3. Create a test policy with virtual manager
    console.log('✓ Step 3: Creating test policy with virtual manager...');
    const testPolicy = await prisma.approvalPolicy.create({
      data: {
        companyId: company.id,
        userId: employee.id,
        category: 'Test',
        description: 'E2E validation policy',
        isManagerApprover: true,
        managerFirst: true,
        sequential: true,
        minApprovalPercentage: 50,
        approvers: {
          create: [
            { approverId: null, approverType: 'manager', required: true, order: 1 },
            { approverId: cfo.id, approverType: 'user', required: false, order: 2 }
          ]
        }
      },
      include: { approvers: true }
    });
    console.log(`  Created policy: ${testPolicy.id}`);
    console.log(`  - Approvers: ${testPolicy.approvers.length}`);
    console.log(`  - Manager first: ${testPolicy.managerFirst}`);
    console.log(`  - Sequential: ${testPolicy.sequential}\n`);
    
    // 4. Verify policy query logic
    console.log('✓ Step 4: Testing policy query logic...');
    const foundPolicy = await prisma.approvalPolicy.findFirst({
      where: {
        companyId: company.id,
        OR: [
          { userId: employee.id, category: 'Test' },
          { userId: employee.id, category: null },
          { userId: null, category: 'Test' },
          { userId: null, category: null },
        ],
      },
      include: { approvers: { orderBy: { order: 'asc' } } }
    });
    
    if (!foundPolicy) {
      throw new Error('Policy lookup failed');
    }
    console.log(`  Found policy via query: ${foundPolicy.id}\n`);
    
    // 5. Simulate expense creation with policy derivation
    console.log('✓ Step 5: Simulating expense approval rule derivation...');
    const approverIds: string[] = [];
    
    if (foundPolicy.isManagerApprover && employee.managerId) {
      approverIds.push(employee.managerId);
      console.log(`  + Added manager: ${employee.manager?.name}`);
    }
    
    for (const a of foundPolicy.approvers) {
      if ((a as any).approverType === 'manager') {
        if (employee.managerId && !approverIds.includes(employee.managerId)) {
          approverIds.push(employee.managerId);
          console.log(`  + Resolved virtual manager to: ${employee.manager?.name}`);
        }
      } else if ((a as any).approverId) {
        if (!approverIds.includes((a as any).approverId)) {
          approverIds.push((a as any).approverId);
          const approverName = (a as any).approverId === cfo.id ? cfo.name : 'Unknown';
          console.log(`  + Added approver: ${approverName}`);
        }
      }
    }
    
    console.log(`  Total unique approvers: ${approverIds.length}\n`);
    
    // 6. Create a test expense
    console.log('✓ Step 6: Creating test expense...');
    const testExpense = await prisma.expense.create({
      data: {
        description: 'E2E Test Expense',
        amount: 100.50,
        currency: 'USD',
        category: 'Test',
        date: new Date(),
        status: 'pending',
        employeeId: employee.id,
        approvalRules: {
          type: 'hybrid',
          percentageThreshold: foundPolicy.minApprovalPercentage ?? undefined,
          requiredApprovers: approverIds,
          managerFirst: foundPolicy.managerFirst,
          sequential: foundPolicy.sequential,
        } as any
      },
      include: { employee: true, approvals: true }
    });
    console.log(`  Created expense: ${testExpense.id}`);
    console.log(`  Status: ${testExpense.status}`);
    console.log(`  Approval rules derived: ${JSON.stringify(testExpense.approvalRules, null, 2)}\n`);
    
    // 7. Simulate manager approval
    console.log('✓ Step 7: Simulating manager approval...');
    if (employee.managerId) {
      const managerApproval = await prisma.approval.create({
        data: {
          expenseId: testExpense.id,
          approverId: employee.managerId,
          decision: 'approved',
          comments: 'E2E test approval'
        }
      });
      console.log(`  Manager approved: ${managerApproval.id}\n`);
    }
    
    // 8. Check expense after approval
    console.log('✓ Step 8: Checking expense state after approval...');
    const updatedExpense = await prisma.expense.findUnique({
      where: { id: testExpense.id },
      include: { approvals: { include: { approver: true } } }
    });
    console.log(`  Approvals: ${updatedExpense?.approvals.length}`);
    updatedExpense?.approvals.forEach((a: any) => {
      console.log(`    - ${a.approver?.name}: ${a.decision}`);
    });
    
    // 9. Cleanup
    console.log('\n✓ Step 9: Cleaning up test data...');
    await prisma.approval.deleteMany({ where: { expenseId: testExpense.id } });
    await prisma.expense.delete({ where: { id: testExpense.id } });
    await prisma.approvalPolicy.delete({ where: { id: testPolicy.id } });
    console.log('  Cleanup complete\n');
    
    console.log('✅ All validation steps passed!\n');
    
  } catch (error) {
    console.error('\n❌ Validation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

validate();
