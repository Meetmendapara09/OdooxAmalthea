import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId') || undefined;
  const userId = searchParams.get('userId') || undefined;
  const category = searchParams.get('category') || undefined;

  const where: any = { };
  if (companyId) where.companyId = companyId;
  if (userId) where.userId = userId;
  if (category) where.category = category;

  const MANAGER_VIRTUAL_ID = "__MANAGER__";
  const policies = await prisma.approvalPolicy.findMany({
    where,
    include: { approvers: true }
  });
  
  // Serialize approvers with virtual IDs for frontend
  const serialized = policies.map((p: any) => ({
    ...p,
    approvers: p.approvers.map((a: any) => ({
      approverId: a.approverType === 'manager' ? MANAGER_VIRTUAL_ID : a.approverId,
      required: a.required,
      order: a.order
    }))
  }));
  
  return NextResponse.json(serialized);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { companyId, userId, category, description, isManagerApprover, managerFirst, sequential, minApprovalPercentage, approvers } = body || {};

  if (!companyId) return NextResponse.json({ error: 'companyId required' }, { status: 400 });

  const MANAGER_VIRTUAL_ID = "__MANAGER__";
  const policy = await prisma.approvalPolicy.create({
    data: {
      companyId,
      userId,
      category,
      description,
      isManagerApprover: !!isManagerApprover,
      managerFirst: !!managerFirst,
      sequential: !!sequential,
      minApprovalPercentage,
      approvers: {
        create: (approvers || []).map((a: any, idx: number) => {
          if (a.approverId === MANAGER_VIRTUAL_ID) {
            return { approverId: null, approverType: 'manager', required: !!a.required, order: a.order ?? idx };
          }
          return { approverId: a.approverId, approverType: 'user', required: !!a.required, order: a.order ?? idx };
        })
      }
    },
    include: { approvers: true }
  });
  return NextResponse.json(policy, { status: 201 });
}

export async function PUT(req: Request) {
  const body = await req.json();
  const { id, ...rest } = body || {};
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const MANAGER_VIRTUAL_ID = "__MANAGER__";
  const { approvers, ...fields } = rest as any;
  const updated = await prisma.approvalPolicy.update({
    where: { id },
    data: {
      ...fields,
      approvers: approvers ? {
        deleteMany: {},
        create: approvers.map((a: any, idx: number) => {
          if (a.approverId === MANAGER_VIRTUAL_ID) {
            return { approverId: null, approverType: 'manager', required: !!a.required, order: a.order ?? idx };
          }
          return { approverId: a.approverId, approverType: 'user', required: !!a.required, order: a.order ?? idx };
        })
      } : undefined
    },
    include: { approvers: true }
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.approvalPolicy.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
