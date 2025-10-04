import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { USER_ROLES, AllowedRole, serializeUser } from './utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const session = await getServerSession(authOptions);
  const companyId = (session?.user as any)?.companyId;
  const users = await prisma.user.findMany({ where: companyId ? { companyId } : undefined });
  return NextResponse.json(users.map(serializeUser));
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    name,
    email,
    password,
    role = 'employee',
    companyId,
    managerId,
  }: {
    name?: string;
    email?: string;
    password?: string;
    role?: AllowedRole;
    companyId?: string;
    managerId?: string | null;
  } = body ?? {};

  if (!name || !email || !companyId) {
    return NextResponse.json({ error: 'name, email, and companyId are required' }, { status: 400 });
  }

  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'password must be at least 8 characters long' }, { status: 400 });
  }

  if (!USER_ROLES.includes(role)) {
    return NextResponse.json({ error: 'invalid role' }, { status: 400 });
  }

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    return NextResponse.json({ error: 'company not found' }, { status: 404 });
  }

  let managerConnect: { connect: { id: string } } | undefined;
  if (managerId) {
    const manager = await prisma.user.findFirst({ where: { id: managerId, companyId, role: { in: ['manager', 'admin'] } } });
    if (!manager) {
      return NextResponse.json({ error: 'manager must belong to the same company and have manager/admin role' }, { status: 400 });
    }
    managerConnect = { connect: { id: managerId } };
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        company: { connect: { id: companyId } },
        ...(managerConnect ? { manager: managerConnect } : {}),
      },
    });
    return NextResponse.json(serializeUser(created), { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A user with that email already exists.' }, { status: 409 });
    }
    console.error('Failed to create user', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
