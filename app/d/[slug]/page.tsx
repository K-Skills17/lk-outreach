import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ViewTracker from './ViewTracker';
import {
  getProspectBySlug,
  type OpeningHours,
  type DaySlots,
  DAYS,
  WEEKDAYS,
  EARLY_THRESHOLD,
  SAT_THRESHOLD,
  getClosingTime,
  getOpeningTime,
  closesEarlyWeekdays,
  sundayClosed,
  fmtTime,
} from '@/lib/audit';

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProspectBySlug(slug);
  if (!p) return { title: 'Diagnóstico' };
  return {
    title: `Diagnóstico Google — ${p.name}`,
    description: `Relatório de presença online para ${p.name}${p.city ? ` em ${p.city}` : ''}.`,
    robots: { index: false, follow: false },
    openGraph: {
      title: `Diagnóstico Google — ${p.name}`,
      description: `Veja o que encontrei sobre a presença digital da ${p.name}.`,
      type: 'website',
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AuditPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const p = await getProspectBySlug(slug);
  if (!p) notFound();

  const oh = p.opening_hours;
  const closesEarly = oh ? closesEarlyWeekdays(oh) : false;
  const sunClosed   = oh ? sundayClosed(oh) : false;
  const hasGap      = closesEarly || sunClosed;

  const bairro = p.bairro || p.city || 'sua região';
  const waNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';
  const waMsg = encodeURIComponent(
    `Oi, vi o diagnóstico da ${p.name} e quero saber mais.`
  );
  const waLink = waNumber
    ? `https://wa.me/${waNumber.replace(/\D/g, '')}?text=${waMsg}`
    : '#';

  return (
    <>
      <ViewTracker slug={slug} />

      <main className="max-w-lg mx-auto px-4 py-8 pb-16">

        {/* ── Header ── */}
        <div className="mb-6">
          <p className="section-label mb-1">Diagnóstico Google</p>
          <h1 className="text-2xl font-bold text-ink leading-tight mb-1">{p.name}</h1>
          <p className="text-muted text-sm">
            {[p.city, p.state].filter(Boolean).join(', ')}
            {p.category_primary ? ` · ${p.category_primary}` : ''}
          </p>
        </div>

        <div className="divider-gold mb-6" />

        {/* ── Sales angle callout ── */}
        {hasGap && (
          <div className="callout mb-6">
            Fora desse horário, quem procura{' '}
            {p.category_primary?.toLowerCase() ?? 'seu negócio'}{' '}
            em <strong>{bairro}</strong> não consegue falar com vocês.
          </div>
        )}

        {/* ── Hours vs Demand ── */}
        {oh && <HoursSection oh={oh} closesEarly={closesEarly} sunClosed={sunClosed} />}

        {/* ── Reputation ── */}
        {(p.rating !== null || p.review_count !== null) && (
          <ReputationSection rating={p.rating} reviewCount={p.review_count} />
        )}

        {/* ── Online Presence ── */}
        <PresenceSection websiteUrl={p.website_url} hasBookingLink={p.has_booking_link} />

        {/* ── What the system does ── */}
        <WhatSystemDoes niche={p.niche} />

        {/* ── CTA ── */}
        <div className="card mt-6">
          <p className="text-center text-ink font-semibold mb-4">
            Quer ver como funciona na prática?
          </p>
          <a href={waLink} className="btn-gold" target="_blank" rel="noopener noreferrer">
            Quero uma demonstração gratuita
          </a>
          <p className="text-center text-muted text-xs mt-3">
            Resposta em minutos pelo WhatsApp
          </p>
        </div>

        {/* ── Footer ── */}
        <p className="text-center text-muted text-xs mt-8 opacity-50">
          LK Digital · Relatório gerado automaticamente
        </p>

      </main>
    </>
  );
}

// ---------------------------------------------------------------------------
// Section components (server, defined inline)
// ---------------------------------------------------------------------------

function SectionCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <p className="section-label">{label}</p>
      {children}
    </div>
  );
}

// ── Hours ──

function HoursSection({
  oh, closesEarly, sunClosed,
}: {
  oh: OpeningHours;
  closesEarly: boolean;
  sunClosed: boolean;
}) {
  return (
    <SectionCard label="Horário vs. Procura">
      <div>
        {DAYS.map(([key, label]) => {
          const slots: DaySlots = oh[key];
          const open  = getOpeningTime(slots);
          const close = getClosingTime(slots);
          const isWeekday = (WEEKDAYS as string[]).includes(key);
          const isSun = key === 'sun';
          const isSat = key === 'sat';
          const earlyClose =
            close &&
            ((isWeekday && close <= EARLY_THRESHOLD) ||
             (isSat     && close <= SAT_THRESHOLD));
          const dayClosed = slots === null;

          return (
            <div key={key} className="hours-row">
              {/* Day label */}
              <span
                className={`text-sm w-20 ${
                  isSun && sunClosed
                    ? 'text-muted'
                    : 'text-ink'
                }`}
              >
                {label}
              </span>

              {/* Time or closed */}
              {dayClosed ? (
                <span className="text-muted text-sm italic">fechado</span>
              ) : open && close ? (
                <span className="text-sm text-ink">
                  {fmtTime(open)} – {fmtTime(close)}
                </span>
              ) : (
                <span className="text-muted text-sm">—</span>
              )}

              {/* Warning badge */}
              <span className="text-xs w-20 text-right">
                {!dayClosed && earlyClose && (
                  <span className="text-warn bg-warn/10 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                    fecha cedo
                  </span>
                )}
                {isSun && sunClosed && (
                  <span className="text-danger bg-danger/10 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                    sem cobertura
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {closesEarly && (
        <div className="callout">
          <strong>A perda acontece à noite e nos finais de semana</strong> — quando as
          pessoas têm mais tempo para pesquisar. O sistema responde e qualifica
          clientes mesmo com o negócio fechado.
        </div>
      )}
    </SectionCard>
  );
}

// ── Reputation ──

function ReputationSection({
  rating, reviewCount,
}: {
  rating: number | null;
  reviewCount: number | null;
}) {
  const ratingNum = rating ? Number(rating) : null;
  const ratingColor =
    ratingNum === null
      ? 'text-muted'
      : ratingNum >= 4.5
      ? 'text-emerald-400'
      : ratingNum >= 4.0
      ? 'text-gold'
      : 'text-warn';

  const ratingNote =
    ratingNum === null
      ? null
      : ratingNum >= 4.5
      ? 'Avaliação excelente — boa base para crescer.'
      : ratingNum >= 4.0
      ? 'Avaliação boa. Mais volume de avaliações aumenta a posição no Maps.'
      : 'Avaliação abaixo de 4.0. Respostas rápidas melhoram isso.';

  return (
    <SectionCard label="Reputação">
      <div className="flex items-end gap-3 mb-3">
        <span className={`text-4xl font-bold ${ratingColor}`}>
          {ratingNum !== null ? ratingNum.toFixed(1) : '—'}
        </span>
        <span className="text-muted text-sm pb-1">/ 5.0</span>
        {reviewCount !== null && (
          <span className="text-muted text-sm pb-1 ml-auto">
            {reviewCount.toLocaleString('pt-BR')} avaliações
          </span>
        )}
      </div>
      {ratingNote && (
        <p className="text-muted text-sm leading-relaxed">{ratingNote}</p>
      )}
    </SectionCard>
  );
}

// ── Online Presence ──

function PresenceSection({
  websiteUrl, hasBookingLink,
}: {
  websiteUrl: string | null;
  hasBookingLink: boolean | null;
}) {
  const items: { label: string; ok: boolean; note: string }[] = [
    {
      label: 'Tem website',
      ok: !!websiteUrl,
      note: websiteUrl
        ? 'Website encontrado.'
        : 'Sem website — clientes não encontram informações fora do Google.',
    },
    {
      label: 'Link de agendamento no Google',
      ok: !!hasBookingLink,
      note: hasBookingLink
        ? 'Link de reservas ativo no perfil.'
        : 'Sem link de reservas — clientes que querem agendar pelo Google não conseguem.',
    },
  ];

  return (
    <SectionCard label="Presença Online">
      <ul className="space-y-3">
        {items.map(({ label, ok, note }) => (
          <li key={label}>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={ok ? 'text-emerald-400' : 'text-danger'}>
                {ok ? '✓' : '✗'}
              </span>
              <span className={`text-sm font-medium ${ok ? 'text-ink' : 'text-ink'}`}>
                {label}
              </span>
            </div>
            <p className="text-muted text-xs pl-5 leading-relaxed">{note}</p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

// ── What system does ──

const SYSTEM_BULLETS: Record<string, string[]> = {
  oficinas: [
    'Responde clientes no WhatsApp fora do horário da oficina',
    'Pergunta veículo, problema e urgência antes de repassar',
    'Avisa o dono em tempo real quando um cliente qualificado entra',
    'Aparece para quem pesquisa no Google Maps à noite e no domingo',
  ],
  default: [
    'Responde clientes no WhatsApp fora do horário comercial',
    'Qualifica o interesse antes de repassar para você',
    'Avisa em tempo real quando um lead qualificado entra',
    'Aumenta o alcance no Google sem esforço extra',
  ],
};

function WhatSystemDoes({ niche }: { niche: string }) {
  const bullets = SYSTEM_BULLETS[niche] ?? SYSTEM_BULLETS.default;
  return (
    <SectionCard label="O Que o Sistema Faz">
      <ul className="space-y-2.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-ink">
            <span className="text-gold mt-0.5 flex-shrink-0">›</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
