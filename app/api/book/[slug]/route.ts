import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant';
import { checkSlotAvailable, createBooking } from '@/lib/calendar';

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
  const { slot_date, start_time, lead_name, lead_phone, service, notes, conv_id } = body as {
    slot_date:   string;
    start_time:  string;
    lead_name?:  string;
    lead_phone?: string;
    service?:    string;
    notes?:      string;
    conv_id?:    string;
  };

  if (!slot_date || !start_time) {
    return NextResponse.json({ error: 'slot_date and start_time required' }, { status: 400 });
  }

  // Validate slot is still available
  const available = await checkSlotAvailable(tenant.id, slot_date, start_time);
  if (!available) {
    return NextResponse.json({ error: 'Slot not available' }, { status: 409 });
  }

  const bookingId = await createBooking({
    tenantId:       tenant.id,
    slotDate:       slot_date,
    startTime:      start_time,
    leadName:       lead_name,
    leadPhone:      lead_phone,
    service,
    notes,
    conversationId: conv_id,
  });

  return NextResponse.json({
    booking_id:  bookingId,
    slot_date,
    start_time,
    lead_name:   lead_name ?? null,
    shop_name:   tenant.name,
    whatsapp:    tenant.config.whatsapp_link ?? null,
  });
}
