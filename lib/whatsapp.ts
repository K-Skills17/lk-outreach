// Sends WhatsApp messages through the same Evolution API v2 instance the
// Python engine uses (services/evolution_sender.py), so the web app can
// deliver messages directly without the local runner.

/** Ensures the Brazilian country code, mirroring evolution_sender._normalize_phone. */
export function normalizeBRPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function isWhatsAppConfigured(): boolean {
  return !!(process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY && process.env.EVOLUTION_INSTANCE);
}

/** Returns null on success, or an error message. Never throws. */
export async function sendWhatsApp(phone: string, text: string): Promise<string | null> {
  const baseUrl  = process.env.EVOLUTION_API_URL?.replace(/\/+$/, '');
  const apiKey   = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;
  if (!baseUrl || !apiKey || !instance) return 'Evolution API not configured';

  try {
    const res = await fetch(`${baseUrl}/message/sendText/${encodeURIComponent(instance)}`, {
      method:  'POST',
      headers: { apikey: apiKey, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ number: normalizeBRPhone(phone), text }),
      signal:  AbortSignal.timeout(15_000),
    });
    if (res.ok) return null;
    const body = await res.text().catch(() => '');
    return `HTTP ${res.status} ${body.slice(0, 200)}`;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}
