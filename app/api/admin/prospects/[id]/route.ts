import { NextRequest, NextResponse } from 'next/server';
import { updateProspect } from '@/lib/admin';

function isAuthed(req: NextRequest): boolean {
  const cookie = req.cookies.get('admin_session')?.value;
  const secret = process.env.ADMIN_SECRET;
  return !!(secret && cookie && cookie === secret);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isAuthed(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const patch: { status?: string; notes?: string } = {};

  if (typeof body.status === 'string') patch.status = body.status;
  if (typeof body.notes  === 'string') patch.notes  = body.notes;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const ok = await updateProspect(id, patch);
  if (!ok) return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });

  return NextResponse.json({ ok: true });
}
