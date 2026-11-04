import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '@/lib/db';

function isAuthed(cookie: string | undefined): boolean {
  const secret = process.env.ADMIN_SECRET;
  return !!secret && cookie === secret;
}

export async function POST() {
  const jar = await cookies();
  if (!isAuthed(jar.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await sql`
    DELETE FROM prospects
    WHERE niche != 'odontologia-implantes'
    RETURNING id
  `;

  return NextResponse.json({
    ok: true,
    deleted: (result as unknown[]).length,
  });
}
