import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token is required.' }, { status: 400 });
    }

    // This endpoint is handled by the main reset-password route
    // We include this for clarity in routing
    return NextResponse.redirect(new URL(`/api/auth/reset-password?token=${token}`, req.url));
  } catch (error) {
    console.error('Verify token error:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to verify token.' },
      { status: 500 }
    );
  }
}
