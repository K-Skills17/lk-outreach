import { NextRequest, NextResponse } from 'next/server';
import { getTenantBySlug } from '@/lib/tenant';
import { getAvailableDays } from '@/lib/calendar';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const tenant   = await getTenantBySlug(slug);

  if (!tenant || !tenant.bot_enabled) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const days = await getAvailableDays(tenant.id, 30);
  return NextResponse.json({ days });
}
