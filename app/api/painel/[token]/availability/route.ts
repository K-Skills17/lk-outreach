import { NextRequest, NextResponse } from 'next/server';
import { getTenantByToken } from '@/lib/tenant';
import { getAvailabilitySlots, replaceAvailabilitySlots, parseAvailabilityInput } from '@/lib/calendar';

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { token } = await params;
  const tenant    = await getTenantByToken(token);
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const slots = await getAvailabilitySlots(tenant.id);
  return NextResponse.json({ slots });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { token } = await params;
  const tenant    = await getTenantByToken(token);
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body   = await req.json().catch(() => ({}));
  const parsed = parseAvailabilityInput(body?.slots);
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  await replaceAvailabilitySlots(tenant.id, parsed.slots);
  return NextResponse.json({ ok: true, count: parsed.slots.length });
}
