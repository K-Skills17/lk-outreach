import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '@/lib/db';

function isAuthed(cookie: string | undefined): boolean {
  const secret = process.env.ADMIN_SECRET;
  return !!secret && cookie === secret;
}

export async function GET() {
  const jar = await cookies();
  if (!isAuthed(jar.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await sql`
    SELECT value, updated_at::text FROM system_flags WHERE key = 'scraper_enabled'
  `;
  const enabled = rows.length === 0 || rows[0].value?.toLowerCase() !== 'false';
  return NextResponse.json({ enabled, updated_at: rows[0]?.updated_at ?? null });
}

export async function POST(req: NextRequest) {
  const jar = await cookies();
  if (!isAuthed(jar.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action as string;
  if (action !== 'stop' && action !== 'start') {
    return NextResponse.json({ error: 'action must be stop or start' }, { status: 400 });
  }

  const value = action === 'stop' ? 'false' : 'true';
  await sql`
    INSERT INTO system_flags (key, value, updated_at)
    VALUES ('scraper_enabled', ${value}, now())
    ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = now()
  `;

  return NextResponse.json({ ok: true, enabled: action === 'start' });
}
