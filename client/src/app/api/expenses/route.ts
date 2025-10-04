import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendPushNotification } from '@/lib/push-server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  const expenses = await prisma.expense.findMany({
    where: companyId ? { employee: { companyId } } : undefined,
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

  const employee = await prisma.user.findUnique({ where: { id: employeeId }, include: { company: true, manager: true } });
  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  // If no explicit approvalRules provided, try derive from policy for employee/category
  let rulesToApply = approvalRules ?? null;
  if (!rulesToApply) {
    if (employee.companyId) {
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
        include: { approvers: { orderBy: { order: 'asc' }, include: { approver: true } } },
      });

      if (policy) {
        const approverSteps: Array<{ approverId: string; order: number; required: boolean; type?: 'manager' | 'user'; label?: string }> = [];
        const seen = new Set<string>();
        const addStep = (approverId: string | null | undefined, options: { orderHint?: number; required?: boolean; type?: 'manager' | 'user'; label?: string }) => {
          if (!approverId) return;
          if (seen.has(approverId)) return;
          approverSteps.push({
            approverId,
            order: options.orderHint ?? approverSteps.length,
            required: options.required ?? true,
            type: options.type,
            label: options.label,
          });
          seen.add(approverId);
        };

        const managerId = employee.managerId ?? null;
        if (policy.isManagerApprover && managerId) {
          addStep(managerId, { orderHint: -1, required: true, type: 'manager', label: employee.manager?.name ?? 'Manager' });
        }

        for (const a of policy.approvers) {
          if (a.approverType === 'manager') {
            addStep(managerId, {
              orderHint: a.order ?? approverSteps.length,
              required: a.required ?? true,
              type: 'manager',
              label: employee.manager?.name ?? 'Manager',
            });
          } else if (a.approverId) {
            addStep(a.approverId, {
              orderHint: a.order ?? approverSteps.length,
              required: a.required ?? true,
              type: 'user',
              label: a.approver?.name ?? undefined,
            });
          }
        }

        approverSteps
          .sort((a, b) => a.order - b.order)
          .forEach((step, index) => {
            step.order = index;
          });

        const requiredApprovers = approverSteps.filter(step => step.required !== false).map(step => step.approverId);
        const sequential = policy.sequential || approverSteps.length > 1 || (!!managerId && policy.isManagerApprover);

        rulesToApply = {
          type: policy.minApprovalPercentage && approverSteps.length > 0 ? 'hybrid' : (policy.minApprovalPercentage ? 'percentage' : 'specific_approver'),
          percentageThreshold: policy.minApprovalPercentage ?? undefined,
          requiredApprovers: requiredApprovers.length ? requiredApprovers : undefined,
          approverSequence: approverSteps.length ? approverSteps : undefined,
          managerFirst: policy.managerFirst || (policy.isManagerApprover ? true : undefined) || undefined,
          sequential: sequential ? true : undefined,
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

  // Notify approvers about the new expense awaiting review
  if (employee.companyId) {
    const initialApproverIds = new Set<string>();

    if (rulesToApply?.sequential && rulesToApply.approverSequence?.length) {
      const firstStep = rulesToApply.approverSequence[0];
      if (firstStep?.approverId && firstStep.approverId !== employee.id) {
        initialApproverIds.add(firstStep.approverId);
      }
    } else if (rulesToApply?.requiredApprovers?.length) {
      for (const approverId of rulesToApply.requiredApprovers) {
        if (approverId && approverId !== employee.id) {
          initialApproverIds.add(approverId);
        }
      }
    }

    if (!initialApproverIds.size && employee.managerId && employee.managerId !== employee.id) {
      initialApproverIds.add(employee.managerId);
    }

    if (!initialApproverIds.size) {
      const companyApprovers = await prisma.user.findMany({
        where: {
          companyId: employee.companyId,
          role: { in: ['admin', 'manager'] },
          NOT: { id: employee.id },
        },
      });
      for (const user of companyApprovers) {
        initialApproverIds.add(user.id);
      }
    }

    const notifyMessage = {
      title: 'Expense awaiting review',
      body: `${employee.name} submitted "${description}" for ${currency} ${amount}.`,
      url: `/dashboard/approvals`,
      data: { expenseId: created.id },
    };

    await Promise.all(
      Array.from(initialApproverIds).map(async id => {
        await sendPushNotification(id, notifyMessage).catch(error => {
          console.error('Failed to send approval request notification', error);
        });
      })
    );
  }

  return NextResponse.json(mapExpense(created), { status: 201 });
}
