import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getSystemFlag, setSystemFlag } from '@/lib/admin';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  return NextResponse.json(await getSystemFlag('sender_enabled'));
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body   = await req.json().catch(() => ({}));
  const action = body?.action;
  if (action !== 'stop' && action !== 'start') {
    return NextResponse.json({ error: 'action must be stop or start' }, { status: 400 });
  }

  return NextResponse.json(await setSystemFlag('sender_enabled', action === 'start'));
}
