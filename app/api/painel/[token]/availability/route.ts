import { NextRequest, NextResponse } from 'next/server';
import { getTenantByToken } from '@/lib/tenant';
import { getAvailabilitySlots, replaceAvailabilitySlots } from '@/lib/calendar';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const tenant    = await getTenantByToken(token);
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const slots = await getAvailabilitySlots(tenant.id);
  return NextResponse.json({ slots });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const tenant    = await getTenantByToken(token);
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const slots = body.slots as Array<{
    day_of_week:  number;
    start_time:   string;
    duration_min?: number;
    max_bookings?: number;
  }>;

  if (!Array.isArray(slots)) {
    return NextResponse.json({ error: 'slots array required' }, { status: 400 });
  }

  // Basic validation
  for (const s of slots) {
    if (s.day_of_week < 0 || s.day_of_week > 6) {
      return NextResponse.json({ error: 'Invalid day_of_week' }, { status: 400 });
    }
    if (!/^\d{2}:\d{2}$/.test(s.start_time)) {
      return NextResponse.json({ error: 'start_time must be HH:MM' }, { status: 400 });
    }
  }

  await replaceAvailabilitySlots(tenant.id, slots);
  return NextResponse.json({ ok: true, count: slots.length });
}
