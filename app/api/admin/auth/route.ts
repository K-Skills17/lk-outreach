import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, adminSessionToken, safeEqual } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body   = await req.json().catch(() => null);
  const secret = process.env.ADMIN_SECRET;
  const token  = await adminSessionToken();

  if (!secret || !token || typeof body?.secret !== 'string' || !safeEqual(body.secret, secret)) {
    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 60 * 24 * 30, // 30 days
  });
  return res;
}
