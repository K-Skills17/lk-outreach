import { NextRequest, NextResponse } from 'next/server';
import { getTenantByPhone } from '@/lib/tenant';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { phone } = body as { phone?: string };

  if (!phone?.trim()) {
    return NextResponse.json({ error: 'Telefone obrigatório' }, { status: 400 });
  }

  const tenant = await getTenantByPhone(phone);
  if (!tenant) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ token: tenant.dashboard_token });
}
