import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSlotBlocks, addSlotBlock, removeSlotBlock } from '@/lib/calendar';

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

  const blocks = await getSlotBlocks(tenantId);
  return NextResponse.json({ blocks });
}

export async function POST(req: NextRequest) {
  const jar = await cookies();
  if (!isAuthed(jar.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = process.env.OWNER_TENANT_ID;
  if (!tenantId) return NextResponse.json({ error: 'OWNER_TENANT_ID not set' }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const { block_date, reason } = body as { block_date?: string; reason?: string };

  if (!block_date || !/^\d{4}-\d{2}-\d{2}$/.test(block_date)) {
    return NextResponse.json({ error: 'block_date required (YYYY-MM-DD)' }, { status: 400 });
  }

  const id = await addSlotBlock(tenantId, block_date, reason);
  if (!id) return NextResponse.json({ error: 'Data já bloqueada' }, { status: 409 });
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: NextRequest) {
  const jar = await cookies();
  if (!isAuthed(jar.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const tenantId = process.env.OWNER_TENANT_ID;
  if (!tenantId) return NextResponse.json({ error: 'OWNER_TENANT_ID not set' }, { status: 500 });

  const body = await req.json().catch(() => ({}));
  const { block_id } = body as { block_id?: string };
  if (!block_id) return NextResponse.json({ error: 'block_id required' }, { status: 400 });

  await removeSlotBlock(tenantId, block_id);
  return NextResponse.json({ ok: true });
}
