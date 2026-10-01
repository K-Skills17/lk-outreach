import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, ownerTenantId } from '@/lib/auth';
import { getAvailabilitySlots, replaceAvailabilitySlots, parseAvailabilityInput } from '@/lib/calendar';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const owner = ownerTenantId();
  if ('error' in owner) return owner.error;

  const slots = await getAvailabilitySlots(owner.tenantId);
  return NextResponse.json({ slots });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const owner = ownerTenantId();
  if ('error' in owner) return owner.error;

  const body   = await req.json().catch(() => ({}));
  const parsed = parseAvailabilityInput(body?.slots);
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  await replaceAvailabilitySlots(owner.tenantId, parsed.slots);
  return NextResponse.json({ ok: true, count: parsed.slots.length });
}
