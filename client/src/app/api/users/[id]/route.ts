import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { AllowedRole, USER_ROLES, serializeUser } from '../utils';

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  const { name, email, role, managerId, password }: {
    name?: string;
    email?: string;
    role?: AllowedRole;
    managerId?: string | null;
    password?: string;
  } = body ?? {};

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const updatedRole = role ?? (user.role as AllowedRole);

  const updates: any = {};

  if (typeof name === 'string' && name.trim().length > 0) {
    updates.name = name.trim();
  }

  if (typeof email === 'string' && email.trim().length > 0 && email !== user.email) {
    updates.email = email.trim().toLowerCase();
  }

  if (role) {
    if (!USER_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    updates.role = role;
    if (role !== 'employee') {
      updates.manager = { disconnect: true };
    }
  }

  if (password) {
    if (password.length < 8) {
      return NextResponse.json({ error: 'password must be at least 8 characters long' }, { status: 400 });
    }
    updates.password = await bcrypt.hash(password, 10);
  }

  if (managerId !== undefined) {
    if (managerId !== null && updatedRole !== 'employee') {
      return NextResponse.json({ error: 'Only employees can have a manager assigned' }, { status: 400 });
    }

    if (managerId === null) {
      updates.manager = { disconnect: true };
    } else {
      const manager = await prisma.user.findFirst({
        where: {
          id: managerId,
          companyId: user.companyId,
          role: { in: ['manager', 'admin'] },
        },
      });

      if (!manager) {
        return NextResponse.json({ error: 'Manager must belong to the same company and have manager/admin role' }, { status: 400 });
      }

      if (manager.id === user.id) {
        return NextResponse.json({ error: 'A user cannot be their own manager' }, { status: 400 });
      }

      updates.manager = { connect: { id: managerId } };
    }
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: updates,
    });
    return NextResponse.json(serializeUser(updated));
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'Email already in use.' }, { status: 409 });
    }
    console.error('Failed to update user', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
