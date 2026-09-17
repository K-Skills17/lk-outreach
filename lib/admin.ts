import sql from './db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NumberRow = {
  id: string;
  label: string;
  status: string;
  sent_today: number;
  daily_cap: number;
};

export type AdminStats = {
  total: number;
  scored: number;
  tier_a: number;
  tier_b: number;
  tier_c: number;
  phase1_ready: number;
  phase2_ready: number;
  phase3_ready: number;
  contacted: number;
  in_followup: number;
  replied: number;
  call_booked: number;
  won: number;
  lost: number;
  opted_out: number;
  audit_sent: number;
  audit_views: number;
  total_sent: number;
  numbers: NumberRow[];
};

export type ReplyQueueRow = {
  id: string;
  name: string;
  city: string | null;
  tier: string | null;
  score: number | null;
  status: string;
  phone: string | null;
  last_contacted_at: string | null;
  notes: string | null;
  last_inbound: string | null;
  inbound_count: number;
};

export type ProspectRow = {
  id: string;
  name: string;
  city: string | null;
  tier: string | null;
  score: number | null;
  status: string;
  phone: string | null;
  niche: string;
  audit_slug: string | null;
  audit_viewed_at: string | null;
  last_contacted_at: string | null;
  opted_out: boolean;
  created_at: string;
};

// ---------------------------------------------------------------------------
// Stats
// ---------------------------------------------------------------------------

export async function getAdminStats(): Promise<AdminStats> {
  const [funnel, msgStats, numbers] = await Promise.all([
    sql`
      SELECT
        COUNT(*)::int                                                           AS total,
        COUNT(*) FILTER (WHERE score IS NOT NULL)::int                         AS scored,
        COUNT(*) FILTER (WHERE tier = 'A')::int                                AS tier_a,
        COUNT(*) FILTER (WHERE tier = 'B')::int                                AS tier_b,
        COUNT(*) FILTER (WHERE tier = 'C')::int                                AS tier_c,
        COUNT(*) FILTER (
          WHERE status = 'new' AND tier IN ('A','B')
            AND audit_slug IS NOT NULL AND score IS NOT NULL
            AND opted_out = false
        )::int                                                                  AS phase1_ready,
        COUNT(*) FILTER (
          WHERE status = 'contacted' AND next_followup_at <= now()
            AND opted_out = false
        )::int                                                                  AS phase2_ready,
        COUNT(*) FILTER (
          WHERE status = 'followup_1' AND next_followup_at <= now()
            AND opted_out = false
        )::int                                                                  AS phase3_ready,
        COUNT(*) FILTER (WHERE status = 'contacted')::int                      AS contacted,
        COUNT(*) FILTER (WHERE status IN ('followup_1','followup_2'))::int     AS in_followup,
        COUNT(*) FILTER (WHERE status = 'replied')::int                        AS replied,
        COUNT(*) FILTER (WHERE status = 'call_booked')::int                    AS call_booked,
        COUNT(*) FILTER (WHERE status = 'won')::int                            AS won,
        COUNT(*) FILTER (WHERE status = 'lost')::int                           AS lost,
        COUNT(*) FILTER (WHERE opted_out = true)::int                          AS opted_out,
        COUNT(*) FILTER (WHERE audit_slug IS NOT NULL)::int                    AS audit_sent,
        COUNT(*) FILTER (WHERE audit_viewed_at IS NOT NULL)::int               AS audit_views
      FROM prospects
    `,

    sql`
      SELECT COUNT(*)::int AS total_sent
      FROM messages
      WHERE direction = 'out' AND error IS NULL
    `,

    sql`
      SELECT id, label, status, sent_today, daily_cap
      FROM numbers
      ORDER BY id
    `,
  ]);

  return {
    ...(funnel[0] as Omit<AdminStats, 'total_sent' | 'numbers'>),
    total_sent:  (msgStats[0] as { total_sent: number }).total_sent,
    numbers:     numbers as unknown as NumberRow[],
  } as AdminStats;
}

// ---------------------------------------------------------------------------
// Reply queue
// ---------------------------------------------------------------------------

export async function getReplyQueue(): Promise<ReplyQueueRow[]> {
  const rows = await sql`
    SELECT
      p.id, p.name, p.city, p.tier, p.score, p.status, p.phone,
      p.last_contacted_at, p.notes,
      m_agg.last_inbound,
      COALESCE(m_agg.inbound_count, 0)::int AS inbound_count
    FROM prospects p
    LEFT JOIN LATERAL (
      SELECT MAX(sent_at) AS last_inbound, COUNT(*)::int AS inbound_count
      FROM messages
      WHERE prospect_id = p.id AND direction = 'in'
    ) m_agg ON true
    WHERE p.opted_out = false
      AND (
        p.status IN ('replied', 'call_booked', 'followup_2')
        OR m_agg.inbound_count > 0
      )
    ORDER BY m_agg.last_inbound DESC NULLS LAST, p.last_contacted_at DESC NULLS LAST
    LIMIT 100
  `;
  return rows as unknown as ReplyQueueRow[];
}

// ---------------------------------------------------------------------------
// Prospects list
// ---------------------------------------------------------------------------

export async function getProspects(opts: {
  niche?: string;
  tier?: string;
  status?: string;
  page?: number;
}): Promise<{ rows: ProspectRow[]; total: number }> {
  const limit  = 50;
  const offset = ((opts.page ?? 1) - 1) * limit;

  // Build dynamic filter
  const niche  = opts.niche  || null;
  const tier   = opts.tier   || null;
  const status = opts.status || null;

  const [rows, countResult] = await Promise.all([
    sql`
      SELECT id, name, city, tier, score, status, phone, niche,
             audit_slug, audit_viewed_at, last_contacted_at, opted_out, created_at
      FROM   prospects
      WHERE  (${niche}::text  IS NULL OR niche  = ${niche})
        AND  (${tier}::text   IS NULL OR tier   = ${tier})
        AND  (${status}::text IS NULL OR status = ${status})
      ORDER  BY score DESC NULLS LAST, created_at DESC
      LIMIT  ${limit}
      OFFSET ${offset}
    `,
    sql`
      SELECT COUNT(*)::int AS total
      FROM   prospects
      WHERE  (${niche}::text  IS NULL OR niche  = ${niche})
        AND  (${tier}::text   IS NULL OR tier   = ${tier})
        AND  (${status}::text IS NULL OR status = ${status})
    `,
  ]);

  return {
    rows:  rows as unknown as ProspectRow[],
    total: (countResult[0] as { total: number }).total,
  };
}

// ---------------------------------------------------------------------------
// Distinct niches
// ---------------------------------------------------------------------------

export async function getDistinctNiches(): Promise<string[]> {
  const rows = await sql`
    SELECT DISTINCT niche FROM prospects WHERE niche IS NOT NULL ORDER BY niche
  `;
  return (rows as { niche: string }[]).map(r => r.niche);
}

// ---------------------------------------------------------------------------
// Update prospect
// ---------------------------------------------------------------------------

const ALLOWED_STATUSES = new Set([
  'new', 'queued', 'contacted', 'followup_1', 'followup_2',
  'replied', 'audit_sent', 'call_booked', 'won', 'lost', 'opted_out',
]);

export async function updateProspect(
  id: string,
  patch: { status?: string; notes?: string },
): Promise<boolean> {
  if (patch.status && !ALLOWED_STATUSES.has(patch.status)) return false;

  if (patch.status !== undefined && patch.notes !== undefined) {
    await sql`
      UPDATE prospects
      SET status = ${patch.status}, notes = ${patch.notes}, updated_at = now()
      WHERE id = ${id}
    `;
  } else if (patch.status !== undefined) {
    await sql`
      UPDATE prospects SET status = ${patch.status}, updated_at = now() WHERE id = ${id}
    `;
  } else if (patch.notes !== undefined) {
    await sql`
      UPDATE prospects SET notes = ${patch.notes}, updated_at = now() WHERE id = ${id}
    `;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export type BillingTenantRow = {
  id:                       string;
  name:                     string;
  slug:                     string;
  dashboard_token:          string;
  owner_name:               string | null;
  owner_phone:              string | null;
  go_live_at:               string | null;
  monthly_status:           string;
  bot_enabled:              boolean;
  price_brl:                number | null;
  billing_reminder_sent:    boolean;
  billing_reminder_sent_at: string | null;
  billing_cutoff_sent:      boolean;
  billing_cutoff_sent_at:   string | null;
};

export async function getBillingTenants(): Promise<BillingTenantRow[]> {
  const rows = await sql`
    SELECT
      id, name, slug, dashboard_token, owner_name, owner_phone, go_live_at,
      monthly_status, bot_enabled, price_brl,
      billing_reminder_sent, billing_reminder_sent_at,
      billing_cutoff_sent,   billing_cutoff_sent_at
    FROM tenants
    ORDER BY go_live_at ASC NULLS LAST, created_at DESC
  `;
  return rows as unknown as BillingTenantRow[];
}

const ALLOWED_MONTHLY_STATUSES = new Set(['pending', 'paid', 'overdue', 'cancelled']);

export async function updateTenantBilling(
  id:    string,
  patch: { monthly_status?: string; bot_enabled?: boolean },
): Promise<boolean> {
  if (patch.monthly_status && !ALLOWED_MONTHLY_STATUSES.has(patch.monthly_status)) return false;

  if (patch.monthly_status !== undefined && patch.bot_enabled !== undefined) {
    await sql`
      UPDATE tenants
      SET monthly_status = ${patch.monthly_status},
          bot_enabled    = ${patch.bot_enabled},
          updated_at     = now()
      WHERE id = ${id}
    `;
  } else if (patch.monthly_status !== undefined) {
    await sql`
      UPDATE tenants
      SET monthly_status = ${patch.monthly_status}, updated_at = now()
      WHERE id = ${id}
    `;
  } else if (patch.bot_enabled !== undefined) {
    await sql`
      UPDATE tenants SET bot_enabled = ${patch.bot_enabled}, updated_at = now() WHERE id = ${id}
    `;
  }

  return true;
}
