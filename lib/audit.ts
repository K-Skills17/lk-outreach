import sql from './db';

// Opening hours shape stored in Neon as JSONB.
// Each day is null (closed) or an array of [open, close] slots.
export type DaySlots = [string, string][] | null;

export type OpeningHours = {
  mon: DaySlots;
  tue: DaySlots;
  wed: DaySlots;
  thu: DaySlots;
  fri: DaySlots;
  sat: DaySlots;
  sun: DaySlots;
};

export type AuditProspect = {
  id: string;
  name: string;
  city: string | null;
  bairro: string | null;
  state: string | null;
  phone: string | null;
  rating: number | null;
  review_count: number | null;
  website_url: string | null;
  has_booking_link: boolean | null;
  opening_hours: OpeningHours | null;
  niche: string;
  category_primary: string | null;
  score: number | null;
  score_breakdown: Record<string, number> | null;
  tier: string | null;
  audit_viewed_at: string | null;
};

export async function getProspectBySlug(slug: string): Promise<AuditProspect | null> {
  const rows = await sql`
    SELECT
      id, name, city, bairro, state, phone,
      rating, review_count, website_url, has_booking_link,
      opening_hours, niche, category_primary,
      score, score_breakdown, tier, audit_viewed_at
    FROM prospects
    WHERE audit_slug = ${slug}
      AND opted_out = false
      AND status != 'opted_out'
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return rows[0] as unknown as AuditProspect;
}

export async function markAuditViewed(slug: string): Promise<void> {
  // Only records first view — no-op if already set
  await sql`
    UPDATE prospects
    SET audit_viewed_at = now(), updated_at = now()
    WHERE audit_slug = ${slug}
      AND audit_viewed_at IS NULL
  `;
}

// ---------------------------------------------------------------------------
// Hours helpers — used by both audit page and scorer
// ---------------------------------------------------------------------------

export const DAYS: [keyof OpeningHours, string][] = [
  ['mon', 'Segunda'],
  ['tue', 'Terça'],
  ['wed', 'Quarta'],
  ['thu', 'Quinta'],
  ['fri', 'Sexta'],
  ['sat', 'Sábado'],
  ['sun', 'Domingo'],
];

export const WEEKDAYS: (keyof OpeningHours)[] = ['mon', 'tue', 'wed', 'thu', 'fri'];

export const EARLY_THRESHOLD = '18:30';
export const SAT_THRESHOLD   = '13:00';

export function getClosingTime(slots: DaySlots): string | null {
  if (!slots || slots.length === 0) return null;
  return slots[0][1] ?? null;
}

export function getOpeningTime(slots: DaySlots): string | null {
  if (!slots || slots.length === 0) return null;
  return slots[0][0] ?? null;
}

/** Returns true if ALL weekdays have a closing time and all are <= threshold. */
export function closesEarlyWeekdays(oh: OpeningHours, threshold = EARLY_THRESHOLD): boolean {
  const closings = WEEKDAYS.map(d => getClosingTime(oh[d])).filter(Boolean) as string[];
  return closings.length > 0 && closings.every(t => t <= threshold);
}

/** Returns true if Sunday is closed. */
export function sundayClosed(oh: OpeningHours): boolean {
  return oh.sun === null;
}

/** Format 'HH:MM' to 'Hh' or 'H:MMh' (Portuguese compact form). */
export function fmtTime(t: string): string {
  const [hh, mm] = t.split(':');
  return mm === '00' ? `${parseInt(hh)}h` : `${parseInt(hh)}h${mm}`;
}
