import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export async function GET() {
  const companies = await prisma.company.findMany({ include: { currency: true } });
  return NextResponse.json(companies);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, currencyCode, currencyName, currencySymbol } = body || {};
  if (!name || !currencyCode) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
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
