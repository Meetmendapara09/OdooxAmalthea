import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { evaluateApprovalRules } from '@/lib/approval-utils';

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

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const e = await prisma.expense.findUnique({
    where: { id },
    include: { employee: true, approvals: { include: { approver: true } } },
  });
  if (!e) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(mapExpense(e));
}

// Record an approval decision and re-evaluate status
export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const body = await req.json();
  const { approverId, decision, comments } = body || {};
  if (!approverId || !decision) return NextResponse.json({ error: 'Missing approverId or decision' }, { status: 400 });

  const { id } = await ctx.params;
  const e = await prisma.expense.findUnique({
    where: { id },
    include: { employee: true, approvals: { include: { approver: true } } },
  });
  if (!e) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Basic RBAC: ensure approver is admin/manager
  const approver = await prisma.user.findUnique({ where: { id: approverId } });
  if (!approver || (approver.role !== 'admin' && approver.role !== 'manager')) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Prevent duplicate votes
  const existing = await prisma.approval.findFirst({ where: { expenseId: e.id, approverId } });
  if (existing) return NextResponse.json({ error: 'Already voted' }, { status: 409 });

  await prisma.approval.create({
    data: { expenseId: e.id, approverId, decision, comments: comments ?? null },
  });

  const updated = await prisma.expense.findUnique({
    where: { id: e.id },
    include: { employee: true, approvals: { include: { approver: true } } },
  });

  if (!updated) return NextResponse.json({ error: 'Not found after update' }, { status: 404 });

  // Evaluate conditional approval rules and persist status
  const mapped = mapExpense(updated);
  const allUsers = await prisma.user.findMany();
  const newStatus = evaluateApprovalRules(mapped as any, allUsers as any);
  if (newStatus !== mapped.status) {
    const persisted = await prisma.expense.update({ where: { id: e.id }, data: { status: newStatus } , include: { employee: true, approvals: { include: { approver: true } } }});
    return NextResponse.json(mapExpense(persisted));
  }

  return NextResponse.json(mapped);
}

// Retract an approval by approver
export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { approverId } = await req.json();
  if (!approverId) return NextResponse.json({ error: 'Missing approverId' }, { status: 400 });

  const e = await prisma.expense.findUnique({ where: { id }, include: { approvals: true, employee: true } });
  if (!e) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.approval.deleteMany({ where: { expenseId: id, approverId } });

  const updated = await prisma.expense.findUnique({ where: { id }, include: { employee: true, approvals: { include: { approver: true } } } });
  if (!updated) return NextResponse.json({ error: 'Not found after retract' }, { status: 404 });

  // Re-evaluate status after retraction
  const mapped = mapExpense(updated);
  const allUsers = await prisma.user.findMany();
  const newStatus = evaluateApprovalRules(mapped as any, allUsers as any);
  if (newStatus !== mapped.status) {
    const persisted = await prisma.expense.update({ where: { id }, data: { status: newStatus }, include: { employee: true, approvals: { include: { approver: true } } } });
    return NextResponse.json(mapExpense(persisted));
  }
  return NextResponse.json(mapped);
}
