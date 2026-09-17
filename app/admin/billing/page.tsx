import { getBillingTenants } from '@/lib/admin';
import BillingActions from './BillingActions';

export const dynamic = 'force-dynamic';

const STATUS_COLOR: Record<string, string> = {
  paid:      '#4caf7d',
  pending:   '#c5a368',
  overdue:   '#e05c5c',
  cancelled: '#555',
};

const STATUS_LABEL: Record<string, string> = {
  paid:      'Pago',
  pending:   'Pendente',
  overdue:   'Inadimplente',
  cancelled: 'Cancelado',
};

function daysSince(goLiveAt: string | null): number | null {
  if (!goLiveAt) return null;
  const diff = Date.now() - new Date(goLiveAt).getTime();
  return Math.floor(diff / 86_400_000);
}

function billingStage(days: number | null, status: string): { label: string; color: string } {
  if (status === 'paid')      return { label: 'Em dia',       color: '#4caf7d' };
  if (status === 'cancelled') return { label: 'Cancelado',    color: '#555'    };
  if (days === null)          return { label: 'Sem data',     color: '#555'    };
  if (days >= 35)             return { label: `D+${days} ⛔`, color: '#e05c5c' };
  if (days >= 25)             return { label: `D+${days} ⚠️`, color: '#e08c2c' };
  if (days >= 20)             return { label: `D+${days}`,    color: '#c5a368' };
  return                             { label: `D+${days}`,    color: '#666'    };
}

export default async function BillingPage() {
  const tenants = await getBillingTenants();

  const stats = {
    total:     tenants.length,
    paid:      tenants.filter(t => t.monthly_status === 'paid').length,
    overdue:   tenants.filter(t => t.monthly_status === 'overdue').length,
    pending:   tenants.filter(t => t.monthly_status === 'pending').length,
    bots_off:  tenants.filter(t => !t.bot_enabled).length,
  };

  const mrr = tenants
    .filter(t => t.monthly_status === 'paid' && t.price_brl)
    .reduce((sum, t) => sum + (t.price_brl ?? 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#e8e8e8' }}>
        Cobrança
      </h1>

      {/* KPI row */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap:                 '1rem',
      }}>
        {[
          { label: 'Tenants',      value: stats.total,   icon: '🏪', color: '#c5a368' },
          { label: 'Pagos',        value: stats.paid,    icon: '✅', color: '#4caf7d' },
          { label: 'Pendentes',    value: stats.pending, icon: '⏳', color: '#c5a368' },
          { label: 'Inadimplentes',value: stats.overdue, icon: '⛔', color: '#e05c5c' },
          { label: 'Bots off',     value: stats.bots_off,icon: '🔴', color: '#e05c5c' },
          { label: 'MRR estimado', value: `R$ ${mrr.toLocaleString('pt-BR')}`, icon: '💰', color: '#4caf7d' },
        ].map(c => (
          <div key={c.label} style={{
            background:   '#141414',
            border:       '1px solid rgba(197,163,104,0.1)',
            borderRadius: '12px',
            padding:      '0.85rem 1rem',
          }}>
            <p style={{ fontSize: '1.2rem', margin: '0 0 0.25rem' }}>{c.icon}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.15rem', color: c.color }}>
              {c.value}
            </p>
            <p style={{ fontSize: '0.68rem', color: '#555', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {c.label}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background:   '#141414',
        border:       '1px solid rgba(197,163,104,0.1)',
        borderRadius: '12px',
        overflow:     'hidden',
      }}>
        <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '0.85rem', fontWeight: 600, margin: 0, color: '#e8e8e8' }}>
            Todos os tenants
          </h2>
        </div>

        {tenants.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#555', fontSize: '0.85rem' }}>
            Nenhum tenant cadastrado ainda.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Loja', 'Dono', 'Telefone', 'Go-live', 'Ciclo', 'Status', 'Bot', 'Painel', 'Ações'].map(h => (
                    <th key={h} style={{
                      padding:      '0.6rem 0.85rem',
                      textAlign:    'left',
                      color:        '#555',
                      fontWeight:   500,
                      fontSize:     '0.68rem',
                      textTransform:'uppercase',
                      letterSpacing:'0.04em',
                      whiteSpace:   'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => {
                  const days  = daysSince(t.go_live_at);
                  const stage = billingStage(days, t.monthly_status);
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.6rem 0.85rem', color: '#e8e8e8', fontWeight: 500 }}>
                        <a
                          href={`/${t.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#c5a368', textDecoration: 'none' }}
                        >
                          {t.name}
                        </a>
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem', color: '#ccc' }}>
                        {t.owner_name ?? '—'}
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem', whiteSpace: 'nowrap' }}>
                        {t.owner_phone ? (
                          <a
                            href={`https://wa.me/55${t.owner_phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#25D366', textDecoration: 'none' }}
                          >
                            {t.owner_phone}
                          </a>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem', color: '#888', whiteSpace: 'nowrap' }}>
                        {t.go_live_at
                          ? new Date(t.go_live_at).toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem', whiteSpace: 'nowrap' }}>
                        <span style={{ color: stage.color, fontWeight: 600 }}>
                          {stage.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem', whiteSpace: 'nowrap' }}>
                        <span style={{
                          color:        STATUS_COLOR[t.monthly_status] ?? '#888',
                          fontWeight:   600,
                          fontSize:     '0.72rem',
                          background:   `${STATUS_COLOR[t.monthly_status] ?? '#888'}18`,
                          border:       `1px solid ${STATUS_COLOR[t.monthly_status] ?? '#888'}33`,
                          borderRadius: '5px',
                          padding:      '0.15rem 0.45rem',
                        }}>
                          {STATUS_LABEL[t.monthly_status] ?? t.monthly_status}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem' }}>
                        <span style={{
                          color:     t.bot_enabled ? '#4caf7d' : '#e05c5c',
                          fontSize:  '0.72rem',
                          fontWeight: 600,
                        }}>
                          {t.bot_enabled ? '● On' : '● Off'}
                        </span>
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem', whiteSpace: 'nowrap' }}>
                        <a
                          href={`/painel/${t.dashboard_token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#c5a368', fontSize: '0.75rem', textDecoration: 'none' }}
                        >
                          Painel ↗
                        </a>
                      </td>
                      <td style={{ padding: '0.6rem 0.85rem' }}>
                        <BillingActions
                          tenantId={t.id}
                          monthlyStatus={t.monthly_status}
                          botEnabled={t.bot_enabled}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
