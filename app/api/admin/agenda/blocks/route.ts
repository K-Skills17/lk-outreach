import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, ownerTenantId } from '@/lib/auth';
import { getSlotBlocks, addSlotBlock, removeSlotBlock, isValidDate } from '@/lib/calendar';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const owner = ownerTenantId();
  if ('error' in owner) return owner.error;

  const blocks = await getSlotBlocks(owner.tenantId);
  return NextResponse.json({ blocks });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const owner = ownerTenantId();
  if ('error' in owner) return owner.error;

  const body = await req.json().catch(() => ({}));
  const { block_date, reason } = body as { block_date?: string; reason?: string };

  if (!isValidDate(block_date)) {
    return NextResponse.json({ error: 'block_date required (YYYY-MM-DD)' }, { status: 400 });
  }

  const id = await addSlotBlock(owner.tenantId, block_date, reason);
  if (!id) return NextResponse.json({ error: 'Data já bloqueada' }, { status: 409 });
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const owner = ownerTenantId();
  if ('error' in owner) return owner.error;

  const body = await req.json().catch(() => ({}));
  const { block_id } = body as { block_id?: string };
  if (!block_id) return NextResponse.json({ error: 'block_id required' }, { status: 400 });

  await removeSlotBlock(owner.tenantId, block_id);
  return NextResponse.json({ ok: true });
}
