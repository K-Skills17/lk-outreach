import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Runs in both the Edge middleware and Node route handlers, so only Web APIs
// (crypto.subtle, TextEncoder) are used here.

export const ADMIN_COOKIE = 'admin_session';

/** Constant-time string comparison (avoids leaking the secret via timing). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Value stored in the admin session cookie: a SHA-256 digest of ADMIN_SECRET,
 * so the password itself never sits in the browser's cookie jar.
 * Returns null when ADMIN_SECRET is not configured.
 */
export async function adminSessionToken(): Promise<string | null> {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return null;
  const data   = new TextEncoder().encode(`lk-admin-session:${secret}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

export async function isValidAdminSession(cookie: string | undefined): Promise<boolean> {
  if (!cookie) return false;
  const expected = await adminSessionToken();
  return !!expected && safeEqual(cookie, expected);
}

/**
 * Route-handler guard. Returns a 401 response when the request is not from a
 * logged-in admin, or null when the caller may proceed.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const jar = await cookies();
  if (await isValidAdminSession(jar.get(ADMIN_COOKIE)?.value)) return null;
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/**
 * Resolves the tenant that owns the admin's own booking calendar (/agendar).
 * Returns either the tenant id or an error response.
 */
export function ownerTenantId(): { tenantId: string } | { error: NextResponse } {
  const tenantId = process.env.OWNER_TENANT_ID;
  if (!tenantId) {
    return { error: NextResponse.json({ error: 'OWNER_TENANT_ID not set' }, { status: 500 }) };
  }
  return { tenantId };
}
