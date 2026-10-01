import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant';
import { bookSlot, isValidDate, isValidTime } from '@/lib/calendar';

/** Trim, cap length, and turn empty strings into null. */
function clean(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().slice(0, max);
  return v || null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const tenant   = await getTenantBySlug(slug);

  if (!tenant || !tenant.bot_enabled) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const { slot_date, start_time } = body as { slot_date?: unknown; start_time?: unknown };

  if (!isValidDate(slot_date) || !isValidTime(start_time)) {
    return NextResponse.json({ error: 'slot_date (YYYY-MM-DD) and start_time (HH:MM) required' }, { status: 400 });
  }

  const leadName  = clean(body.lead_name, 120);
  const leadPhone = clean(body.lead_phone, 30)?.replace(/\D/g, '') || null;
  if (!leadName || !leadPhone || leadPhone.length < 10) {
    return NextResponse.json({ error: 'Nome e telefone com DDD são obrigatórios.' }, { status: 400 });
  }

  const bookingId = await bookSlot({
    tenantId:       tenant.id,
    slotDate:       slot_date,
    startTime:      start_time,
    leadName,
    leadPhone,
    service:        clean(body.service, 200),
    notes:          clean(body.notes, 1000),
    conversationId: clean(body.conv_id, 64),
  });

  if (!bookingId) {
    return NextResponse.json({ error: 'Slot not available' }, { status: 409 });
  }

  return NextResponse.json({
    booking_id:  bookingId,
    slot_date,
    start_time,
    lead_name:   leadName,
    shop_name:   tenant.name,
    whatsapp:    tenant.config.whatsapp_link ?? null,
  });
}
