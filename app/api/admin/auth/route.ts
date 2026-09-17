import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const secret = process.env.ADMIN_SECRET;

    if (!secret || !body?.secret || body.secret !== secret) {
      return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set('admin_session', secret, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      maxAge:   60 * 60 * 24 * 30, // 30 days
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
}
