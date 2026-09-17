import Link from 'next/link';
import { getProspects } from '@/lib/admin';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Filter bar (client-friendly via URL search params)
// ---------------------------------------------------------------------------

const TIERS    = ['', 'A', 'B', 'C'];
const STATUSES = [
  '', 'new', 'contacted', 'followup_1', 'followup_2',
  'replied', 'call_booked', 'won', 'lost', 'opted_out',
];
const STATUS_LABEL: Record<string, string> = {
  new:         'Novo',
  contacted:   'Contatado',
  followup_1:  'Follow-up 1',
  followup_2:  'Follow-up 2',
  replied:     'Respondeu',
  call_booked: 'Call agendada',
  won:         'Ganho',
  lost:        'Perdido',
  opted_out:   'Opt-out',
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function FilterLink({
  href, active, children,
}: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      display:      'inline-block',
      padding:      '0.25rem 0.65rem',
      borderRadius: '5px',
      background:   active ? 'rgba(197,163,104,0.15)' : 'transparent',
      border:       active ? '1px solid rgba(197,163,104,0.35)' : '1px solid #333',
      color:        active ? '#c5a368' : '#888',
      fontSize:     '0.75rem',
      fontWeight:   active ? 700 : 400,
      textDecoration: 'none',
      whiteSpace:   'nowrap',
    }}>
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type SearchParams = {
  tier?:   string;
  status?: string;
  niche?:  string;
  page?:   string;
};

export default async function ProspectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const tier   = params.tier   || '';
  const status = params.status || '';
  const niche  = params.niche  || '';
  const page   = Math.max(1, parseInt(params.page || '1', 10));

  const { rows, total } = await getProspects({
    tier:   tier   || undefined,
    status: status || undefined,
    niche:  niche  || undefined,
    page,
  });

  const totalPages = Math.ceil(total / 50);

  function buildUrl(overrides: Partial<SearchParams>): string {
    const p: Record<string, string> = {};
    if (tier)   p.tier   = tier;
    if (status) p.status = status;
    if (niche)  p.niche  = niche;
    if (page > 1) p.page = String(page);
    Object.assign(p, overrides);
    Object.keys(p).forEach(k => { if (!p[k]) delete p[k]; });
    const qs = new URLSearchParams(p).toString();
    return '/admin/prospects' + (qs ? '?' + qs : '');
  }

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                    marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ color: '#e8e8e8', fontWeight: 700, fontSize: '1.15rem', margin: 0 }}>
          Prospectos
        </h1>
        <span style={{ color: '#555', fontSize: '0.72rem' }}>
          {total.toLocaleString('pt-BR')} registros
        </span>
      </div>
      <div className="divider-gold" style={{ marginBottom: '1rem' }} />

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        {/* Tier */}
        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
          <span style={{ color: '#555', fontSize: '0.7rem', marginRight: '0.2rem' }}>Tier:</span>
          {TIERS.map(t => (
            <FilterLink key={t || 'all'} href={buildUrl({ tier: t, page: '1' })} active={tier === t}>
              {t || 'Todos'}
            </FilterLink>
          ))}
        </div>

        {/* Status */}
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: '#555', fontSize: '0.7rem', marginRight: '0.2rem' }}>Status:</span>
          {STATUSES.map(s => (
            <FilterLink key={s || 'all'} href={buildUrl({ status: s, page: '1' })} active={status === s}>
              {s ? (STATUS_LABEL[s] || s) : 'Todos'}
            </FilterLink>
          ))}
        </div>
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <p style={{ color: '#555', fontSize: '0.88rem', padding: '2rem 0', textAlign: 'center' }}>
          Nenhum prospecto encontrado com esses filtros.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.81rem' }}>
            <thead>
              <tr style={{ color: '#666', textAlign: 'left' }}>
                {['Nome', 'Cidade', 'Tier', 'Score', 'Status', 'Telefone', 'Auditoria', 'Contato', 'Criado'].map(h => (
                  <th key={h} style={{ padding: '0.3rem 0.65rem 0.55rem',
                                       fontWeight: 600, whiteSpace: 'nowrap',
                                       borderBottom: '1px solid #222' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '0.55rem 0.65rem', color: '#e8e8e8', fontWeight: 500,
                               maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis',
                               whiteSpace: 'nowrap' }}>
                    {p.name}
                  </td>
                  <td style={{ padding: '0.55rem 0.65rem', color: '#aaa', whiteSpace: 'nowrap' }}>
                    {p.city || '—'}
                  </td>
                  <td style={{ padding: '0.55rem 0.65rem' }}>
                    {p.tier ? (
                      <span style={{
                        color:      p.tier === 'A' ? '#c5a368' : p.tier === 'B' ? '#aaa' : '#555',
                        fontWeight: 700,
                        fontSize:   '0.78rem',
                      }}>
                        {p.tier}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ padding: '0.55rem 0.65rem', color: '#e8e8e8', fontWeight: 600 }}>
                    {p.score ?? '—'}
                  </td>
                  <td style={{ padding: '0.55rem 0.65rem', whiteSpace: 'nowrap' }}>
                    <span style={{
                      color:    p.status === 'won'  ? '#4caf7d'
                              : p.status === 'lost' ? '#e05c5c'
                              : p.status === 'replied' ? '#c5a368'
                              : '#888',
                      fontWeight: p.status === 'won' || p.status === 'replied' ? 600 : 400,
                      fontSize: '0.78rem',
                    }}>
                      {STATUS_LABEL[p.status] || p.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.55rem 0.65rem', color: '#888',
                               fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {p.phone || '—'}
                  </td>
                  <td style={{ padding: '0.55rem 0.65rem', textAlign: 'center' }}>
                    {p.audit_slug ? (
                      p.audit_viewed_at ? (
                        <span style={{ color: '#4caf7d', fontSize: '0.72rem' }}>Viu</span>
                      ) : (
                        <span style={{ color: '#555', fontSize: '0.72rem' }}>Enviado</span>
                      )
                    ) : '—'}
                  </td>
                  <td style={{ padding: '0.55rem 0.65rem', color: '#888', whiteSpace: 'nowrap' }}>
                    {fmtDate(p.last_contacted_at)}
                  </td>
                  <td style={{ padding: '0.55rem 0.65rem', color: '#555', whiteSpace: 'nowrap' }}>
                    {fmtDate(p.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center',
                      marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {page > 1 && (
            <Link href={buildUrl({ page: String(page - 1) })} style={{
              padding: '0.35rem 0.9rem', background: '#1e1e1e',
              border: '1px solid #333', borderRadius: '6px',
              color: '#aaa', fontSize: '0.8rem', textDecoration: 'none',
            }}>
              ← Anterior
            </Link>
          )}
          <span style={{ color: '#666', fontSize: '0.8rem', alignSelf: 'center' }}>
            Pág. {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={buildUrl({ page: String(page + 1) })} style={{
              padding: '0.35rem 0.9rem', background: '#1e1e1e',
              border: '1px solid #333', borderRadius: '6px',
              color: '#aaa', fontSize: '0.8rem', textDecoration: 'none',
            }}>
              Próxima →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
