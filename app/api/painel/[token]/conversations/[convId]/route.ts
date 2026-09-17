import { NextRequest, NextResponse } from 'next/server';
import { getTenantByToken, updateBookingStatus } from '@/lib/tenant';

const VALID_STATUSES = new Set(['requested', 'confirmed', 'no_show', 'done'] as const);

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

  if (!booking_status || !VALID_STATUSES.has(booking_status as never)) {
    return NextResponse.json({ error: 'Invalid booking_status' }, { status: 400 });
  }

  await updateBookingStatus(convId, booking_status as 'requested' | 'confirmed' | 'no_show' | 'done');
  return NextResponse.json({ ok: true });
}
