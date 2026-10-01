import sql from './db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TenantConfig = {
  main_service?:    string;
  services?:        string[];
  prices?:          Record<string, string>;
  hours?:           Record<string, string>;   // e.g. { "Seg-Sex": "08:00-18:00" }
  address?:         string;
  bairros_served?:  string[];
  city?:            string;
  phone_display?:   string;
  whatsapp_link?:   string;
  maps_embed_url?:  string;
  reviews_snippet?: string;
};

export type Tenant = {
  id:              string;
  name:            string;
  slug:            string;
  niche:           string;
  config:          TenantConfig;
  bot_enabled:     boolean;
  owner_phone:     string | null;
  owner_name:      string | null;
  owner_email:     string | null;
  dashboard_token: string;
};

export type ConversationTurn = {
  role:    'user' | 'assistant';
  content: string;
  ts:      string;
};

export type ConversationRecord = {
  id:               string;
  tenant_id:        string;
  started_at:       string;
  source:           string | null;
  turns:            number;
  qualified:        boolean;
  service:          string | null;
  vehicle:          string | null;
  symptom:          string | null;
  urgency:          string | null;
  lead_name:        string | null;
  lead_phone:       string | null;
  preferred_slot:   string | null;
  booking_status:   string | null;
  customer_address: string | null;
  transcript:       ConversationTurn[] | null;
  owner_notified:   boolean;
  owner_notified_at: string | null;
};

export type ExtractedFields = {
  service_needed?:   string | null;
  vehicle?:          string | null;
  symptom?:          string | null;
  urgency?:          string | null;
  lead_name?:        string | null;
  lead_phone?:       string | null;
  preferred_slot?:   string | null;
  customer_address?: string | null;
};

// ---------------------------------------------------------------------------
// Tenant queries
// ---------------------------------------------------------------------------

export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const rows = await sql`
    SELECT id, name, slug, niche, config, bot_enabled,
           owner_phone, owner_name, owner_email, dashboard_token
    FROM   tenants
    WHERE  slug = ${slug}
    LIMIT  1
  `;
  return (rows[0] as unknown as Tenant) ?? null;
}

export async function getTenantByPhone(phone: string): Promise<Tenant | null> {
  // Normalize: strip everything except digits. Require a full DDD + number so
  // an empty/garbage input can never match a tenant with a malformed phone.
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return null;
  const rows = await sql`
    SELECT id, name, slug, niche, config, bot_enabled,
           owner_phone, owner_name, owner_email, dashboard_token
    FROM   tenants
    WHERE  regexp_replace(owner_phone, '[^0-9]', '', 'g') = ${digits}
    LIMIT  1
  `;
  return (rows[0] as unknown as Tenant) ?? null;
}

export async function getTenantByToken(token: string): Promise<Tenant | null> {
  const rows = await sql`
    SELECT id, name, slug, niche, config, bot_enabled,
           owner_phone, owner_name, owner_email, dashboard_token
    FROM   tenants
    WHERE  dashboard_token = ${token}
    LIMIT  1
  `;
  return (rows[0] as unknown as Tenant) ?? null;
}

// ---------------------------------------------------------------------------
// Conversation queries
// ---------------------------------------------------------------------------

export async function createConversation(
  tenantId: string,
  source:   string | null,
): Promise<string> {
  const rows = await sql`
    INSERT INTO conversations (tenant_id, source, transcript)
    VALUES (${tenantId}, ${source}, '[]'::jsonb)
    RETURNING id
  `;
  return (rows[0] as { id: string }).id;
}

/**
 * Loads a conversation only if it belongs to the given tenant. Compares ids as
 * text so a malformed id from the client yields "not found" instead of a
 * Postgres cast error.
 */
export async function getConversation(id: string, tenantId: string): Promise<ConversationRecord | null> {
  const rows = await sql`
    SELECT id, tenant_id, started_at, source, turns, qualified,
           service, vehicle, symptom, urgency, lead_name, lead_phone,
           preferred_slot, booking_status, customer_address, transcript,
           owner_notified, owner_notified_at
    FROM   conversations
    WHERE  id::text = ${id} AND tenant_id = ${tenantId}
    LIMIT  1
  `;
  return (rows[0] as unknown as ConversationRecord) ?? null;
}

/**
 * Appends turns and merges extracted fields in a single UPDATE, so concurrent
 * messages can't overwrite each other's transcript. Extracted values only
 * fill in or replace — a null/empty extraction never erases known data.
 * owner_notified is reset to false the moment the conversation first becomes
 * qualified, which is what the Python notifier picks up.
 */
export async function saveConversationTurn(
  convId:    string,
  newTurns:  ConversationTurn[],
  extracted: ExtractedFields,
): Promise<void> {
  const v = (x: string | null | undefined) => (x && String(x).trim()) || null;
  const service   = v(extracted.service_needed);
  // Only accept something that looks like a real phone (DDD + number) — the
  // LLM sometimes returns placeholders like "não informado".
  const phoneDigits = extracted.lead_phone ? String(extracted.lead_phone).replace(/\D/g, '') : '';
  const leadPhone   = phoneDigits.length >= 10 ? phoneDigits : null;

  // Every SET expression reads the row being updated (c.*), so Postgres
  // re-evaluates them against the latest version if another request
  // updated the same conversation concurrently.
  await sql`
    UPDATE conversations c SET
      transcript       = COALESCE(c.transcript, '[]'::jsonb) || ${JSON.stringify(newTurns)}::jsonb,
      turns            = jsonb_array_length(COALESCE(c.transcript, '[]'::jsonb) || ${JSON.stringify(newTurns)}::jsonb),
      service          = COALESCE(${service},                        c.service),
      vehicle          = COALESCE(${v(extracted.vehicle)},           c.vehicle),
      symptom          = COALESCE(${v(extracted.symptom)},           c.symptom),
      urgency          = COALESCE(${v(extracted.urgency)},           c.urgency),
      lead_name        = COALESCE(${v(extracted.lead_name)},         c.lead_name),
      lead_phone       = COALESCE(${leadPhone},                      c.lead_phone),
      preferred_slot   = COALESCE(${v(extracted.preferred_slot)},    c.preferred_slot),
      customer_address = COALESCE(${v(extracted.customer_address)},  c.customer_address),
      qualified        = (COALESCE(${service}, c.service) IS NOT NULL
                          AND COALESCE(${leadPhone}, c.lead_phone) IS NOT NULL),
      owner_notified   = CASE
                           WHEN NOT COALESCE(c.qualified, false)
                                AND COALESCE(${service}, c.service) IS NOT NULL
                                AND COALESCE(${leadPhone}, c.lead_phone) IS NOT NULL
                           THEN false
                           ELSE c.owner_notified
                         END
    WHERE c.id::text = ${convId}
  `;
}

export async function getTenantConversations(
  tenantId: string,
  limit = 100,
): Promise<ConversationRecord[]> {
  const rows = await sql`
    SELECT id, tenant_id, started_at, source, turns, qualified,
           service, vehicle, symptom, urgency,
           lead_name, lead_phone, preferred_slot, customer_address,
           booking_status, owner_notified, owner_notified_at
    FROM   conversations
    WHERE  tenant_id = ${tenantId}
    ORDER  BY started_at DESC
    LIMIT  ${limit}
  `;
  return rows as unknown as ConversationRecord[];
}

export const CONVERSATION_BOOKING_STATUSES = ['requested', 'confirmed', 'no_show', 'done'] as const;
export type ConversationBookingStatus = typeof CONVERSATION_BOOKING_STATUSES[number];

/** Updates a conversation's booking status. Returns false if it isn't this tenant's. */
export async function updateConversationBookingStatus(
  tenantId: string,
  convId:   string,
  status:   ConversationBookingStatus,
): Promise<boolean> {
  const rows = await sql`
    UPDATE conversations SET booking_status = ${status}
    WHERE id::text = ${convId} AND tenant_id = ${tenantId}
    RETURNING id
  `;
  return rows.length > 0;
}

export async function getDashboardStats(tenantId: string): Promise<{
  total:                number;
  qualified:            number;
  today:                number;
  pending_confirmation: number;
}> {
  const rows = await sql`
    SELECT
      COUNT(*)::int                                                   AS total,
      COUNT(*) FILTER (WHERE qualified)::int                         AS qualified,
      COUNT(*) FILTER (
        WHERE (started_at AT TIME ZONE 'America/Sao_Paulo')::date
            = (now()      AT TIME ZONE 'America/Sao_Paulo')::date
      )::int                                                          AS today,
      COUNT(*) FILTER (
        WHERE qualified AND (booking_status IS NULL OR booking_status = 'requested')
      )::int                                                          AS pending_confirmation
    FROM conversations
    WHERE tenant_id = ${tenantId}
  `;
  return rows[0] as unknown as {
    total: number; qualified: number; today: number; pending_confirmation: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format the hours config object into a readable string for the AI system prompt. */
export function formatHoursDisplay(hours: Record<string, string> | undefined): string {
  if (!hours || Object.keys(hours).length === 0) return 'consulte a oficina';
  return Object.entries(hours)
    .map(([day, time]) => `${day}: ${time}`)
    .join(' | ');
}
