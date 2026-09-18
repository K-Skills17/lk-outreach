import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAvailabilitySlots, replaceAvailabilitySlots } from '@/lib/calendar';

function isAuthed(cookie: string | undefined): boolean {
  const secret = process.env.ADMIN_SECRET;
  return !!secret && cookie === secret;
}

export async function GET() {
  const jar = await cookies();
  if (!isAuthed(jar.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = process.env.OWNER_TENANT_ID;
  if (!tenantId) return NextResponse.json({ error: 'OWNER_TENANT_ID not set' }, { status: 500 });

  const slots = await getAvailabilitySlots(tenantId);
  return NextResponse.json({ slots });
}

export async function POST(req: NextRequest) {
  const jar = await cookies();
  if (!isAuthed(jar.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = process.env.OWNER_TENANT_ID;
  if (!tenantId) return NextResponse.json({ error: 'OWNER_TENANT_ID not set' }, { status: 500 });

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

  for (const s of slots) {
    if (s.day_of_week < 0 || s.day_of_week > 6) {
      return NextResponse.json({ error: 'Invalid day_of_week' }, { status: 400 });
    }
    if (!/^\d{2}:\d{2}$/.test(s.start_time)) {
      return NextResponse.json({ error: 'start_time must be HH:MM' }, { status: 400 });
    }
  }

  await replaceAvailabilitySlots(tenantId, slots);
  return NextResponse.json({ ok: true, count: slots.length });
}
