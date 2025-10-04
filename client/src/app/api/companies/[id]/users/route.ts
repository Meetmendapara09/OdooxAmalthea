import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json();
  const { name, email, password, role } = body || {};
  if (!name || !email || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) return NextResponse.json({ error: 'Invalid company' }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: role && ['admin','manager','employee'].includes(role) ? role : 'employee',
        avatarUrl: `https://picsum.photos/seed/${Math.floor(Math.random()*1000)}/100/100`,
        company: { connect: { id } },
      },
    });
    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (e: any) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
