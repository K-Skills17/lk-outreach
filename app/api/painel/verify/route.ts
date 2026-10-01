import { NextRequest, NextResponse } from 'next/server';
import { verifyLoginCode } from '@/lib/painel-auth';

// Step 2 of the painel login: exchange phone + code for the dashboard token.
export async function POST(req: NextRequest) {
  const body  = await req.json().catch(() => ({}));
  const phone = typeof body?.phone === 'string' ? body.phone.replace(/\D/g, '') : '';
  const code  = typeof body?.code  === 'string' ? body.code.replace(/\D/g, '')  : '';

  const tenant = phone.length >= 10 ? await verifyLoginCode(phone, code) : null;
  if (!tenant) {
    return NextResponse.json({ error: 'Código inválido ou expirado.' }, { status: 401 });
  }

  return NextResponse.json({ token: tenant.dashboard_token });
}
