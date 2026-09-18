import { NextResponse } from 'next/server';
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
    SELECT value, updated_at FROM system_flags WHERE key = 'sender_enabled'
  `;
  const row = (rows as Array<{ value: string; updated_at: string }>)[0];
  return NextResponse.json({
    enabled:    row ? row.value !== 'false' : true,
    updated_at: row?.updated_at ?? null,
  });
}

export async function POST(req: Request) {
  const jar = await cookies();
  if (!isAuthed(jar.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action } = await req.json() as { action: 'stop' | 'start' };
  const value = action === 'stop' ? 'false' : 'true';

  await sql`
    INSERT INTO system_flags (key, value, updated_at)
    VALUES ('sender_enabled', ${value}, now())
    ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = now()
  `;

  return NextResponse.json({ enabled: value === 'true' });
}
