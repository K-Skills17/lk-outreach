// Shared display helpers. Server components render on Vercel in UTC, so every
// date formatter pins the Brazilian time zone explicitly.

export const TZ = 'America/Sao_Paulo';

type DateInput = string | Date | null | undefined;

function fmt(value: DateInput, opts: Intl.DateTimeFormatOptions): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', { timeZone: TZ, ...opts });
}

/** "22/09 14:30" */
export function fmtDateTime(value: DateInput): string {
  return fmt(value, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).replace(', ', ' ');
}

/** "22/09" */
export function fmtDayMonth(value: DateInput): string {
  return fmt(value, { day: '2-digit', month: '2-digit' });
}

/** "22/09/25" */
export function fmtDateShort(value: DateInput): string {
  return fmt(value, { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/** "22/09/2025" */
export function fmtDate(value: DateInput): string {
  return fmt(value, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** "2025-09-22" → "22/09" (calendar date, no time-zone shift) */
export function fmtIsoDay(isoDate: string): string {
  const [, mm, dd] = isoDate.split('-');
  return `${dd}/${mm}`;
}

/**
 * wa.me link for a Brazilian phone. Adds the 55 country code only when the
 * number doesn't already carry it (10–11 digits = DDD + number).
 */
export function waLink(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const full   = digits.length <= 11 ? `55${digits}` : digits;
  return `https://wa.me/${full}`;
}
