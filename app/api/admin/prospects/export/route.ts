import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import sql from '@/lib/db';

function isAuthed(cookie: string | undefined): boolean {
  const secret = process.env.ADMIN_SECRET;
  return !!secret && cookie === secret;
}

export async function GET(req: NextRequest) {
  const jar = await cookies();
  if (!isAuthed(jar.get('admin_session')?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const niche  = searchParams.get('niche')  || '';
  const tier   = searchParams.get('tier')   || '';
  const status = searchParams.get('status') || '';
  // exclude=odontologia-implantes by default so non-dental leads can be exported
  const exclude = searchParams.get('exclude') || '';

  const rows = await sql`
    SELECT
      id, name, phone, city, niche, tier, score::text AS score,
      status, audit_slug, last_contacted_at, created_at
    FROM prospects
    WHERE 1=1
      AND (${niche}  = '' OR niche  = ${niche})
      AND (${tier}   = '' OR tier   = ${tier})
      AND (${status} = '' OR status::text = ${status})
      AND (${exclude} = '' OR niche != ${exclude})
    ORDER BY created_at DESC
  `;

  const headers = ['id','name','phone','city','niche','tier','score','status','audit_slug','last_contacted_at','created_at'];

  function escapeCsv(v: unknown): string {
    if (v == null) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  const lines = [
    headers.join(','),
    ...(rows as Record<string, unknown>[]).map(r =>
      headers.map(h => escapeCsv(r[h])).join(',')
    ),
  ];

  const csv = lines.join('\r\n');
  const filename = niche
    ? `prospects-${niche}.csv`
    : exclude
    ? `prospects-excl-${exclude}.csv`
    : 'prospects.csv';

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
