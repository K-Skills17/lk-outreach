import sql from './db';
import { getTenantByPhone, type Tenant } from './tenant';
import { sendWhatsApp } from './whatsapp';
import { safeEqual } from './auth';

// WhatsApp one-time-code login for the client dashboard (/painel).
// Table: db/16_painel_login_codes.sql

const CODE_TTL_MIN       = 10;
const MAX_ATTEMPTS       = 5;   // wrong guesses allowed per code
const MAX_CODES_PER_WIN  = 3;   // codes a phone can request…
const RATE_WINDOW_MIN    = 15;  // …within this many minutes

async function hashCode(tenantId: string, code: string): Promise<string> {
  const data   = new TextEncoder().encode(`painel-code:${tenantId}:${code}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

/** Uniformly random 6-digit code. */
function generateCode(): string {
  const buf = new Uint32Array(1);
  // Rejection sampling avoids modulo bias.
  do { crypto.getRandomValues(buf); } while (buf[0] >= 4_294_000_000);
  return String(buf[0] % 1_000_000).padStart(6, '0');
}

export type RequestCodeResult =
  | { status: 'sent' }          // code delivered (or phone unknown — caller must not tell them apart)
  | { status: 'rate_limited' }
  | { status: 'send_failed' };

/**
 * Issues a code for the tenant owning `phone` and sends it to that phone.
 * Unknown phones also return 'sent' so the endpoint can't be used to list clients.
 */
export async function requestLoginCode(phone: string): Promise<RequestCodeResult> {
  const tenant = await getTenantByPhone(phone);
  if (!tenant || !tenant.owner_phone) return { status: 'sent' };

  const recent = await sql`
    SELECT COUNT(*)::int AS n FROM painel_login_codes
    WHERE tenant_id = ${tenant.id}
      AND created_at > now() - make_interval(mins => ${RATE_WINDOW_MIN})
  ` as { n: number }[];
  if (recent[0].n >= MAX_CODES_PER_WIN) return { status: 'rate_limited' };

  const code = generateCode();
  // Only the newest code is valid: retire any earlier unused ones.
  await sql.transaction([
    sql`UPDATE painel_login_codes SET used_at = now() WHERE tenant_id = ${tenant.id} AND used_at IS NULL`,
    sql`
      INSERT INTO painel_login_codes (tenant_id, code_hash, expires_at)
      VALUES (${tenant.id}, ${await hashCode(tenant.id, code)},
              now() + make_interval(mins => ${CODE_TTL_MIN}))
    `,
  ]);

  const err = await sendWhatsApp(
    tenant.owner_phone,
    `🔐 Seu código de acesso ao painel ${tenant.name}: *${code}*\n\n` +
    `Válido por ${CODE_TTL_MIN} minutos. Se não foi você, ignore esta mensagem.`,
  );
  if (err) {
    console.error('[painel-auth] WhatsApp send failed:', err);
    return { status: 'send_failed' };
  }
  return { status: 'sent' };
}

/**
 * Checks a code. Each check consumes one attempt; a correct code is
 * single-use. Returns the tenant on success, null otherwise.
 */
export async function verifyLoginCode(phone: string, code: string): Promise<Tenant | null> {
  if (!/^\d{6}$/.test(code)) return null;
  const tenant = await getTenantByPhone(phone);
  if (!tenant) return null;

  // Atomically take one attempt on the newest live code.
  const rows = await sql`
    UPDATE painel_login_codes SET attempts = attempts + 1
    WHERE id = (
      SELECT id FROM painel_login_codes
      WHERE tenant_id = ${tenant.id} AND used_at IS NULL AND expires_at > now()
      ORDER BY created_at DESC
      LIMIT 1
    )
      AND attempts < ${MAX_ATTEMPTS}
    RETURNING id, code_hash
  ` as { id: string; code_hash: string }[];
  const row = rows[0];
  if (!row || !safeEqual(row.code_hash, await hashCode(tenant.id, code))) return null;

  // Mark used; the used_at guard makes a concurrent second use fail.
  const used = await sql`
    UPDATE painel_login_codes SET used_at = now()
    WHERE id = ${row.id} AND used_at IS NULL
    RETURNING id
  `;
  return used.length > 0 ? tenant : null;
}
