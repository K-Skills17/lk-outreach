import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import sql from '@/lib/db';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [dbCampaigns, stats] = await Promise.all([
    sql`SELECT * FROM campaigns ORDER BY created_at DESC`,
    sql`
      SELECT
        campaign_slug,
        COUNT(*)::int                                     AS total,
        COUNT(*) FILTER (WHERE status != 'new')::int      AS contacted,
        COUNT(*) FILTER (WHERE status = 'replied')::int   AS replied,
        COUNT(*) FILTER (WHERE opted_out = true)::int     AS opted_out,
        COUNT(*) FILTER (WHERE status = 'won')::int       AS won,
        MAX(last_contacted_at)::text                      AS last_sent
      FROM prospects
      WHERE campaign_slug IS NOT NULL
      GROUP BY campaign_slug
    `,
  ]);

  const dbRows = dbCampaigns as Record<string, unknown>[];
  const statRows = stats as Record<string, unknown>[];

  const dbSlugs = new Set(dbRows.map(c => c.slug as string));
  const statMap: Record<string, Record<string, unknown>> = {};
  for (const s of statRows) {
    statMap[s.campaign_slug as string] = s;
  }

  const emptyStats = { total: 0, contacted: 0, replied: 0, opted_out: 0, won: 0, last_sent: null };

  const merged = [
    // DB campaigns (may have no prospects yet)
    ...dbRows.map(c => ({
      ...c,
      source: 'db',
      ...(statMap[c.slug as string] ?? emptyStats),
    })),
    // YAML/legacy campaigns: have prospects but no DB record
    ...statRows
      .filter(s => !dbSlugs.has(s.campaign_slug as string))
      .map(s => ({
        slug: s.campaign_slug,
        name: s.campaign_slug,
        niche: null,
        cap: null,
        offer: null,
        source: 'yaml',
        ...s,
      })),
  ];

  return NextResponse.json({ campaigns: merged });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: {
    slug: string; name: string; niche: string; cap: number;
    offer?: string; p1_message: string; p2_message?: string;
    p3_message?: string; max_chars?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { slug, name, niche, cap, offer, p1_message, p2_message, p3_message, max_chars } = body;

  if (!slug || !name || !niche || !p1_message) {
    return NextResponse.json({ error: 'slug, name, niche e p1_message são obrigatórios.' }, { status: 400 });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'Slug deve conter apenas letras minúsculas, números e hífens.' }, { status: 400 });
  }

  const capNum      = cap       == null ? 10  : Number(cap);
  const maxCharsNum = max_chars == null ? 360 : Number(max_chars);
  if (!Number.isInteger(capNum) || capNum < 1) {
    return NextResponse.json({ error: 'Cap deve ser um número inteiro positivo.' }, { status: 400 });
  }
  if (!Number.isInteger(maxCharsNum) || maxCharsNum < 1) {
    return NextResponse.json({ error: 'Máx. caracteres deve ser um número inteiro positivo.' }, { status: 400 });
  }

  try {
    await sql`
      INSERT INTO campaigns (slug, name, niche, cap, offer, p1_message, p2_message, p3_message, max_chars)
      VALUES (
        ${slug}, ${name}, ${niche}, ${capNum},
        ${offer ?? null}, ${p1_message},
        ${p2_message ?? null}, ${p3_message ?? null},
        ${maxCharsNum}
      )
    `;
    return NextResponse.json({ ok: true, slug });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('duplicate') || msg.includes('unique')) {
      return NextResponse.json({ error: `Slug "${slug}" já existe.` }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 });

  await sql`DELETE FROM campaigns WHERE slug = ${slug}`;
  return NextResponse.json({ ok: true });
}
