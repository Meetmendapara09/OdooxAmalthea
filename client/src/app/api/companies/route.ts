import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  const companies = await prisma.company.findMany({ include: { currency: true } });
  return NextResponse.json(companies);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, currencyCode, currencyName, currencySymbol, isInitialAdmin } = body || {};
  if (!name || !currencyCode) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  const session = await getServerSession(authOptions);
  const isAdminSession = !!session && (session.user as any)?.role === 'admin';
  const initialAdmin = Boolean(isInitialAdmin);
  if (!isAdminSession) {
    if (!initialAdmin) {
      return NextResponse.json({ error: 'Only admins can create a company' }, { status: 403 });
    }
    if (session?.user) {
      return NextResponse.json({ error: 'Only admins can create a company' }, { status: 403 });
    }
  }
  try {
    // Ensure currency exists; if not, create it with provided details
  const company = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.currency.upsert({
        where: { code: currencyCode },
        update: {},
        create: {
          code: currencyCode,
          name: currencyName || currencyCode,
          symbol: currencySymbol || currencyCode,
        },
      });
      const created = await tx.company.create({
        data: { name, currency: { connect: { code: currencyCode } } },
        include: { currency: true },
      });
      return created;
    });
    return NextResponse.json(company, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
}
