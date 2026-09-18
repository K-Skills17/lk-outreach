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
    SELECT
      niche,
      COUNT(*)::int                                              AS total,
      COUNT(*) FILTER (WHERE phone IS NOT NULL)::int             AS with_phone,
      COUNT(*) FILTER (WHERE score IS NOT NULL)::int             AS scored,
      COUNT(*) FILTER (WHERE status = 'new' AND phone IS NOT NULL AND score IS NOT NULL AND audit_slug IS NOT NULL)::int AS ready,
      MAX(scraped_at)::text                                      AS last_scraped
    FROM prospects
    GROUP BY niche
    ORDER BY MAX(scraped_at) DESC NULLS LAST
  `;

  return NextResponse.json({ niches: rows });
}
