import { NextRequest, NextResponse } from 'next/server';
import { markAuditViewed } from '@/lib/audit';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    await markAuditViewed(slug);
    return NextResponse.json({ ok: true });
  } catch {
    // Non-fatal — view tracking should never break the page
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
