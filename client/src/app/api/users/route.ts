import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const users = await prisma.user.findMany();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = users.map((u: any): {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'employee';
    avatarUrl: string;
    companyId?: string | null;
    managerId?: string | null;
  } => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as 'admin' | 'manager' | 'employee',
    avatarUrl: u.avatarUrl,
    companyId: u.companyId ?? null,
    // add managerId once present in schema
    managerId: (u as any).managerId ?? null
  }));
  return NextResponse.json(payload);
}
