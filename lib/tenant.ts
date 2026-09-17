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
  // Normalize: strip everything except digits
  const digits = phone.replace(/\D/g, '');
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

export async function getConversation(id: string): Promise<ConversationRecord | null> {
  const rows = await sql`SELECT * FROM conversations WHERE id = ${id} LIMIT 1`;
  return (rows[0] as unknown as ConversationRecord) ?? null;
}

export async function saveConversationTurn(
  convId:    string,
  newTurns:  ConversationTurn[],
  extracted: ExtractedFields,
  wasQualifiedBefore: boolean,
): Promise<void> {
  const conv = await getConversation(convId);
  if (!conv) return;

  const merged = [...(conv.transcript ?? []), ...newTurns];

  // Merge extracted fields with existing values — never overwrite with null
  const service           = extracted.service_needed   || conv.service;
  const vehicle           = extracted.vehicle          || conv.vehicle;
  const symptom           = extracted.symptom          || conv.symptom;
  const urgency           = extracted.urgency          || conv.urgency;
  const lead_name         = extracted.lead_name        || conv.lead_name;
  const lead_phone        = extracted.lead_phone       || conv.lead_phone;
  const preferred_slot    = extracted.preferred_slot   || conv.preferred_slot;
  const customer_address  = extracted.customer_address || conv.customer_address;

  const nowQualified = !!(service && lead_phone);
  // owner_notified becomes false only when FIRST qualifying
  const ownerNotified = (nowQualified && !wasQualifiedBefore)
    ? false
    : conv.owner_notified;

  await sql`
    UPDATE conversations SET
      transcript        = ${JSON.stringify(merged)}::jsonb,
      turns             = ${merged.length},
      service           = ${service},
      vehicle           = ${vehicle},
      symptom           = ${symptom},
      urgency           = ${urgency},
      lead_name         = ${lead_name},
      lead_phone        = ${lead_phone},
      preferred_slot    = ${preferred_slot},
      customer_address  = ${customer_address},
      qualified         = ${nowQualified},
      owner_notified    = ${ownerNotified}
    WHERE id = ${convId}
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

export async function updateBookingStatus(
  convId:  string,
  status:  'requested' | 'confirmed' | 'no_show' | 'done',
): Promise<void> {
  await sql`
    UPDATE conversations SET booking_status = ${status} WHERE id = ${convId}
  `;
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
      COUNT(*) FILTER (WHERE started_at::date = current_date)::int  AS today,
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
