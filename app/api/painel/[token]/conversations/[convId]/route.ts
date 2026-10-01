import { NextRequest, NextResponse } from 'next/server';
import {
  getTenantByToken,
  updateConversationBookingStatus,
  CONVERSATION_BOOKING_STATUSES,
  type ConversationBookingStatus,
} from '@/lib/tenant';

export async function PATCH(
  req:    NextRequest,
  { params }: { params: Promise<{ token: string; convId: string }> },
) {
  const { token, convId } = await params;

  // Auth: token must match a real tenant
  const tenant = await getTenantByToken(token);
  if (!tenant) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { booking_status } = body as { booking_status?: string };

  if (!CONVERSATION_BOOKING_STATUSES.includes(booking_status as ConversationBookingStatus)) {
    return NextResponse.json({ error: 'Invalid booking_status' }, { status: 400 });
  }

  // Scoped to the tenant — a token can only touch its own conversations.
  const ok = await updateConversationBookingStatus(
    tenant.id, convId, booking_status as ConversationBookingStatus,
  );
  if (!ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ ok: true });
}
