import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { generateSecurePassword } from '@/lib/password';
import { sendPasswordEmail } from '@/lib/mailer';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id) {
    return NextResponse.json({ error: 'User id missing' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const tempPassword = generateSecurePassword();
  const hashed = await bcrypt.hash(tempPassword, 10);

  await prisma.user.update({ where: { id }, data: { password: hashed } });

  try {
    await sendPasswordEmail(user.email, tempPassword);
  } catch (error) {
    console.error('Failed to send password email', error);
    return NextResponse.json({ ok: true, warning: 'Password reset but email could not be sent.' }, { status: 202 });
  }

  return NextResponse.json({ ok: true });
}
