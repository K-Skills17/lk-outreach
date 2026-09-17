import { NextRequest, NextResponse } from 'next/server';
import { getTenantByToken } from '@/lib/tenant';
import { getSlotBlocks, addSlotBlock, removeSlotBlock } from '@/lib/calendar';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const tenant    = await getTenantByToken(token);
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blocks = await getSlotBlocks(tenant.id);
  return NextResponse.json({ blocks });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const tenant    = await getTenantByToken(token);
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { block_date, reason } = body as { block_date?: string; reason?: string };

  if (!block_date || !/^\d{4}-\d{2}-\d{2}$/.test(block_date)) {
    return NextResponse.json({ error: 'block_date required (YYYY-MM-DD)' }, { status: 400 });
  }

  const id = await addSlotBlock(tenant.id, block_date, reason);
  if (!id) return NextResponse.json({ error: 'Data já bloqueada' }, { status: 409 });
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const tenant    = await getTenantByToken(token);
  if (!tenant) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { block_id } = body as { block_id?: string };
  if (!block_id) return NextResponse.json({ error: 'block_id required' }, { status: 400 });

  await removeSlotBlock(tenant.id, block_id);
  return NextResponse.json({ ok: true });
}
