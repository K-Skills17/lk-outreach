import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { updateTenantBilling } from '@/lib/admin';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body   = await req.json().catch(() => ({}));

  const patch: { monthly_status?: string; bot_enabled?: boolean } = {};
  if (typeof body.monthly_status === 'string') patch.monthly_status = body.monthly_status;
  if (typeof body.bot_enabled    === 'boolean') patch.bot_enabled   = body.bot_enabled;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const ok = await updateTenantBilling(id, patch);
  if (!ok) return NextResponse.json({ error: 'Invalid value' }, { status: 400 });

  return NextResponse.json({ ok: true });
}
