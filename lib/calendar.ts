import sql from './db';
import { TZ } from './format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AvailabilitySlot = {
  id:           string;
  tenant_id:    string;
  day_of_week:  number;
  start_time:   string;  // "HH:MM"
  duration_min: number;
  max_bookings: number;
  active:       boolean;
};

export type SlotBlock = {
  id:         string;
  tenant_id:  string;
  block_date: string;  // "YYYY-MM-DD"
  reason:     string | null;
};

export type Booking = {
  id:              string;
  tenant_id:       string;
  conversation_id: string | null;
  slot_date:       string;   // "YYYY-MM-DD"
  start_time:      string;   // "HH:MM"
  duration_min:    number;
  lead_name:       string | null;
  lead_phone:      string | null;
  service:         string | null;
  notes:           string | null;
  status:          string;
  owner_notified:  boolean;
  created_at:      string;
};

export type DayAvailability = {
  date:      string;   // "YYYY-MM-DD"
  day_label: string;   // "Seg, 22/09"
  slots:     string[]; // ["08:00", "09:00"]
};

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

/** Today's date in America/Sao_Paulo as YYYY-MM-DD */
function todayBR(): string {
  return new Intl.DateTimeFormat('fr-CA', { timeZone: TZ }).format(new Date());
}

/** Current wall-clock time in America/Sao_Paulo as HH:MM */
function nowTimeBR(): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(new Date());
}

// Pure calendar arithmetic — done in UTC so the server's zone never matters.
function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function getDOW(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun
}

/** True for a real calendar date in YYYY-MM-DD form. */
export function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return addDays(value, 0) === value; // rejects 2025-02-31 etc.
}

/** True for HH:MM with a valid hour/minute. */
export function isValidTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

const BR_DAY = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ---------------------------------------------------------------------------
// Availability slots
// ---------------------------------------------------------------------------

export async function getAvailabilitySlots(tenantId: string): Promise<AvailabilitySlot[]> {
  const rows = await sql`
    SELECT id, tenant_id, day_of_week, start_time::text, duration_min, max_bookings, active
    FROM   availability_slots
    WHERE  tenant_id = ${tenantId}
    ORDER  BY day_of_week, start_time
  `;
  return (rows as unknown as AvailabilitySlot[]).map(r => ({
    ...r,
    start_time: r.start_time.slice(0, 5),
  }));
}

export type AvailabilityInput = {
  day_of_week:  number;
  start_time:   string;  // "HH:MM"
  duration_min: number;
  max_bookings: number;
};

/** Validates the `slots` array posted by the availability editors. */
export function parseAvailabilityInput(raw: unknown): { slots: AvailabilityInput[] } | { error: string } {
  if (!Array.isArray(raw)) return { error: 'slots array required' };
  if (raw.length > 500)    return { error: 'Too many slots' };

  const slots: AvailabilityInput[] = [];
  const seen = new Set<string>();
  for (const s of raw as Record<string, unknown>[]) {
    const dow  = s?.day_of_week;
    const time = typeof s?.start_time === 'string' ? s.start_time.slice(0, 5) : s?.start_time;
    if (!Number.isInteger(dow) || (dow as number) < 0 || (dow as number) > 6) {
      return { error: 'Invalid day_of_week' };
    }
    if (!isValidTime(time)) return { error: 'start_time must be HH:MM' };

    const duration = s.duration_min ?? 60;
    const max      = s.max_bookings ?? 1;
    if (!Number.isInteger(duration) || (duration as number) < 5 || (duration as number) > 480) {
      return { error: 'Invalid duration_min' };
    }
    if (!Number.isInteger(max) || (max as number) < 1 || (max as number) > 50) {
      return { error: 'Invalid max_bookings' };
    }

    const key = `${dow}:${time}`;
    if (seen.has(key)) continue; // drop duplicates rather than double-booking a slot
    seen.add(key);
    slots.push({
      day_of_week:  dow as number,
      start_time:   time,
      duration_min: duration as number,
      max_bookings: max as number,
    });
  }
  return { slots };
}

/** Atomically replaces a tenant's weekly availability. */
export async function replaceAvailabilitySlots(tenantId: string, slots: AvailabilityInput[]): Promise<void> {
  const del = sql`DELETE FROM availability_slots WHERE tenant_id = ${tenantId}`;
  if (slots.length === 0) {
    await del;
    return;
  }
  await sql.transaction([
    del,
    sql`
      INSERT INTO availability_slots (tenant_id, day_of_week, start_time, duration_min, max_bookings)
      SELECT ${tenantId}, d, t::time, dur, mx
      FROM unnest(
        ${slots.map(s => s.day_of_week)}::int[],
        ${slots.map(s => s.start_time)}::text[],
        ${slots.map(s => s.duration_min)}::int[],
        ${slots.map(s => s.max_bookings)}::int[]
      ) AS x(d, t, dur, mx)
    `,
  ]);
}

// ---------------------------------------------------------------------------
// Slot blocks
// ---------------------------------------------------------------------------

export async function getSlotBlocks(tenantId: string): Promise<SlotBlock[]> {
  const rows = await sql`
    SELECT id, tenant_id, block_date::text, reason
    FROM   slot_blocks
    WHERE  tenant_id = ${tenantId}
      AND  block_date >= ${todayBR()}
    ORDER  BY block_date
  `;
  return rows as unknown as SlotBlock[];
}

export async function addSlotBlock(tenantId: string, blockDate: string, reason?: string): Promise<string | null> {
  const rows = await sql`
    INSERT INTO slot_blocks (tenant_id, block_date, reason)
    VALUES (${tenantId}, ${blockDate}, ${reason ?? null})
    ON CONFLICT (tenant_id, block_date) DO NOTHING
    RETURNING id
  `;
  return rows.length > 0 ? (rows[0] as { id: string }).id : null;
}

export async function removeSlotBlock(tenantId: string, blockId: string): Promise<void> {
  await sql`DELETE FROM slot_blocks WHERE id = ${blockId} AND tenant_id = ${tenantId}`;
}

// ---------------------------------------------------------------------------
// Available days computation
// ---------------------------------------------------------------------------

export async function getAvailableDays(tenantId: string, lookAheadDays = 30): Promise<DayAvailability[]> {
  const today  = todayBR();
  const nowHM  = nowTimeBR();
  const toDate = addDays(today, lookAheadDays);

  const [slots, blocks, bookingCounts] = await Promise.all([
    sql`
      SELECT day_of_week, start_time::text, max_bookings
      FROM   availability_slots
      WHERE  tenant_id = ${tenantId} AND active = true
      ORDER  BY day_of_week, start_time
    `,
    sql`
      SELECT block_date::text FROM slot_blocks
      WHERE  tenant_id = ${tenantId}
        AND  block_date >= ${today} AND block_date <= ${toDate}
    `,
    sql`
      SELECT slot_date::text, start_time::text, COUNT(*)::int AS cnt
      FROM   bookings
      WHERE  tenant_id = ${tenantId}
        AND  slot_date  >= ${today} AND slot_date <= ${toDate}
        AND  status    != 'cancelled'
      GROUP  BY slot_date, start_time
    `,
  ]);

  const blockedDays = new Set((blocks as { block_date: string }[]).map(b => b.block_date));

  const countMap = new Map<string, number>();
  for (const r of bookingCounts as { slot_date: string; start_time: string; cnt: number }[]) {
    countMap.set(`${r.slot_date}:${r.start_time.slice(0, 5)}`, r.cnt);
  }

  // Group slots by day_of_week
  const slotsByDOW = new Map<number, { start_time: string; max_bookings: number }[]>();
  for (const s of slots as { day_of_week: number; start_time: string; max_bookings: number }[]) {
    const t = s.start_time.slice(0, 5);
    const arr = slotsByDOW.get(s.day_of_week) ?? [];
    arr.push({ start_time: t, max_bookings: s.max_bookings });
    slotsByDOW.set(s.day_of_week, arr);
  }

  const result: DayAvailability[] = [];

  for (let i = 0; i <= lookAheadDays; i++) {
    const date = addDays(today, i);
    if (blockedDays.has(date)) continue;

    const dow      = getDOW(date);
    const daySlots = slotsByDOW.get(dow) ?? [];
    const available: string[] = [];

    for (const { start_time, max_bookings } of daySlots) {
      if (date === today && start_time <= nowHM) continue; // already passed
      const booked = countMap.get(`${date}:${start_time}`) ?? 0;
      if (booked < max_bookings) available.push(start_time);
    }

    if (available.length > 0) {
      const [, mm, dd] = date.split('-');
      result.push({
        date,
        day_label: `${BR_DAY[dow]}, ${dd}/${mm}`,
        slots: available,
      });
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

/**
 * Books a slot if — and only if — it is a configured, active, unblocked slot
 * with remaining capacity. The check and the insert run in one transaction
 * behind an advisory lock, so two people can't grab the last seat at once.
 * Returns the new booking id, or null when the slot isn't available.
 */
export async function bookSlot(data: {
  tenantId:        string;
  slotDate:        string;   // YYYY-MM-DD (validated by caller)
  startTime:       string;   // HH:MM      (validated by caller)
  leadName?:       string | null;
  leadPhone?:      string | null;
  service?:        string | null;
  notes?:          string | null;
  conversationId?: string | null;
}): Promise<string | null> {
  const today = todayBR();
  if (data.slotDate < today) return null;
  if (data.slotDate === today && data.startTime <= nowTimeBR()) return null;

  const dow     = getDOW(data.slotDate);
  const lockKey = `${data.tenantId}:${data.slotDate}:${data.startTime}`;

  const [, inserted] = await sql.transaction([
    sql`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`,
    sql`
      INSERT INTO bookings
        (tenant_id, slot_date, start_time, duration_min,
         lead_name, lead_phone, service, notes, conversation_id)
      SELECT
        ${data.tenantId}, ${data.slotDate}::date, a.start_time, a.duration_min,
        ${data.leadName ?? null}, ${data.leadPhone ?? null},
        ${data.service  ?? null}, ${data.notes     ?? null},
        (SELECT c.id FROM conversations c
          WHERE c.id::text = ${data.conversationId ?? ''} AND c.tenant_id = ${data.tenantId})
      FROM availability_slots a
      WHERE a.tenant_id   = ${data.tenantId}
        AND a.day_of_week = ${dow}
        AND a.active      = true
        AND left(a.start_time::text, 5) = ${data.startTime}
        AND NOT EXISTS (
          SELECT 1 FROM slot_blocks b
          WHERE b.tenant_id = ${data.tenantId} AND b.block_date = ${data.slotDate}::date
        )
        AND (
          SELECT COUNT(*) FROM bookings k
          WHERE k.tenant_id  = ${data.tenantId}
            AND k.slot_date  = ${data.slotDate}::date
            AND left(k.start_time::text, 5) = ${data.startTime}
            AND k.status    != 'cancelled'
        ) < a.max_bookings
      LIMIT 1
      RETURNING id
    `,
  ]);

  const row = (inserted as { id: string }[])[0];
  return row?.id ?? null;
}

export async function getUpcomingBookings(tenantId: string, limit = 50): Promise<Booking[]> {
  const today = todayBR();
  const rows  = await sql`
    SELECT id, tenant_id, conversation_id,
           slot_date::text, start_time::text, duration_min,
           lead_name, lead_phone, service, notes, status,
           owner_notified, created_at::text
    FROM   bookings
    WHERE  tenant_id = ${tenantId}
      AND  slot_date >= ${today}
      AND  status   != 'cancelled'
    ORDER  BY slot_date, start_time
    LIMIT  ${limit}
  `;
  return (rows as unknown as Booking[]).map(r => ({
    ...r,
    start_time: r.start_time.slice(0, 5),
  }));
}
