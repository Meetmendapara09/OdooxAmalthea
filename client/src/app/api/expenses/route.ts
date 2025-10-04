import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function mapExpense(e: any) {
  return {
    id: e.id,
    description: e.description,
    amount: Number(e.amount),
    currency: e.currency,
    category: e.category,
    date: e.date.toISOString(),
    status: e.status as 'pending' | 'approved' | 'rejected',
    employee: { id: e.employee.id, name: e.employee.name },
    comments: e.comments ?? undefined,
    receiptUrl: e.receiptUrl ?? undefined,
    approvalRules: e.approvalRules ?? undefined,
    approvals: (e.approvals || []).map((a: any) => ({
      id: a.id,
      expenseId: a.expenseId,
      approverId: a.approverId,
      approverName: a.approver?.name || '',
      decision: a.decision as 'approved' | 'rejected',
      timestamp: a.timestamp.toISOString(),
      comments: a.comments ?? undefined,
    })),
  };
}

export async function GET() {
  const expenses = await prisma.expense.findMany({
    include: { employee: true, approvals: { include: { approver: true } } },
    orderBy: { date: 'desc' },
  });
  return NextResponse.json(expenses.map(mapExpense));
}

export async function POST(req: Request) {
  const body = await req.json();
  const { description, amount, currency, category, date, employeeId, comments, receiptUrl, approvalRules } = body || {};
  if (!description || !amount || !currency || !category || !date || !employeeId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // If no explicit approvalRules provided, try derive from policy for employee/category
  let rulesToApply = approvalRules ?? null;
  if (!rulesToApply) {
    const employee = await prisma.user.findUnique({ where: { id: employeeId }, include: { company: true, manager: true } as any });
    if (employee?.companyId) {
      const policy = await prisma.approvalPolicy.findFirst({
        where: {
          companyId: employee.companyId,
          OR: [
            { userId: employeeId, category },
            { userId: employeeId, category: null },
            { userId: null, category },
            { userId: null, category: null },
          ],
        },
        include: { approvers: { orderBy: { order: 'asc' } } },
      });

      if (policy) {
        // Build approver list, resolving virtual approvers to actual user IDs
        const approverIds: string[] = [];
        
        // Add manager if policy says so
        if (policy.isManagerApprover && employee.managerId) {
          approverIds.push(employee.managerId);
        }
        
        // Add explicit approvers, resolving virtual approvers
        for (const a of policy.approvers) {
          if ((a as any).approverType === 'manager') {
            // Virtual manager: resolve to employee's actual manager
            if (employee.managerId && !approverIds.includes(employee.managerId)) {
              approverIds.push(employee.managerId);
            }
          } else if ((a as any).approverId) {
            // Real user approver
            if (!approverIds.includes((a as any).approverId)) {
              approverIds.push((a as any).approverId);
            }
          }
        }

        rulesToApply = {
          type: policy.minApprovalPercentage && approverIds.length > 0 ? 'hybrid' : (policy.minApprovalPercentage ? 'percentage' : 'specific_approver'),
          percentageThreshold: policy.minApprovalPercentage ?? undefined,
          requiredApprovers: approverIds.length ? approverIds : undefined,
          managerFirst: policy.managerFirst || undefined,
          sequential: policy.sequential || undefined,
        } as any;
      }
    }
  }

  const created = await prisma.expense.create({
    data: {
      description,
      amount,
      currency,
      category,
      date: new Date(date),
      status: 'pending',
      employeeId,
      comments: comments ?? null,
      receiptUrl: receiptUrl ?? null,
      approvalRules: rulesToApply,
    },
    include: { employee: true, approvals: { include: { approver: true } } },
  });

  return NextResponse.json(mapExpense(created), { status: 201 });
}
