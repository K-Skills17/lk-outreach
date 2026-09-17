import sql from './db';

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
  return new Intl.DateTimeFormat('fr-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
}

function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  const pad = (x: number) => String(x).padStart(2, '0');
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

function getDOW(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay(); // 0=Sun
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

export async function replaceAvailabilitySlots(
  tenantId: string,
  slots: Array<{ day_of_week: number; start_time: string; duration_min?: number; max_bookings?: number }>,
): Promise<void> {
  await sql`DELETE FROM availability_slots WHERE tenant_id = ${tenantId}`;
  for (const s of slots) {
    await sql`
      INSERT INTO availability_slots (tenant_id, day_of_week, start_time, duration_min, max_bookings)
      VALUES (${tenantId}, ${s.day_of_week}, ${s.start_time}, ${s.duration_min ?? 60}, ${s.max_bookings ?? 1})
    `;
  }
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

export async function createBooking(data: {
  tenantId:       string;
  slotDate:       string;
  startTime:      string;
  durationMin?:   number;
  leadName?:      string;
  leadPhone?:     string;
  service?:       string;
  notes?:         string;
  conversationId?: string;
}): Promise<string> {
  const rows = await sql`
    INSERT INTO bookings
      (tenant_id, slot_date, start_time, duration_min, lead_name, lead_phone, service, notes, conversation_id)
    VALUES
      (${data.tenantId}, ${data.slotDate}, ${data.startTime},
       ${data.durationMin ?? 60},
       ${data.leadName  ?? null}, ${data.leadPhone ?? null},
       ${data.service   ?? null}, ${data.notes    ?? null},
       ${data.conversationId ?? null})
    RETURNING id
  `;
  return (rows[0] as { id: string }).id;
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

export async function updateBookingStatus(
  bookingId: string,
  tenantId:  string,
  status:    string,
): Promise<void> {
  await sql`
    UPDATE bookings SET status = ${status}
    WHERE id = ${bookingId} AND tenant_id = ${tenantId}
  `;
}

export async function checkSlotAvailable(
  tenantId:  string,
  slotDate:  string,
  startTime: string,
): Promise<boolean> {
  // Check not blocked
  const blocks = await sql`
    SELECT 1 FROM slot_blocks
    WHERE tenant_id = ${tenantId} AND block_date = ${slotDate}
    LIMIT 1
  `;
  if (blocks.length > 0) return false;

  // Get max_bookings for this slot
  const dow = getDOW(slotDate);
  const slotRows = await sql`
    SELECT max_bookings FROM availability_slots
    WHERE  tenant_id = ${tenantId}
      AND  day_of_week = ${dow}
      AND  start_time::text LIKE ${startTime + '%'}
      AND  active = true
    LIMIT 1
  `;
  if (slotRows.length === 0) return false;

  const maxBookings = (slotRows[0] as { max_bookings: number }).max_bookings;

  const countRows = await sql`
    SELECT COUNT(*)::int AS cnt FROM bookings
    WHERE  tenant_id  = ${tenantId}
      AND  slot_date  = ${slotDate}
      AND  start_time::text LIKE ${startTime + '%'}
      AND  status    != 'cancelled'
  `;
  const booked = (countRows[0] as { cnt: number }).cnt;
  return booked < maxBookings;
}
