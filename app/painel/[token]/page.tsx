import { notFound } from 'next/navigation';
import { getTenantByToken, getTenantConversations, getDashboardStats } from '@/lib/tenant';
import { getNicheConfig } from '@/lib/niches';
import DashboardClient from './DashboardClient';
import TokenRemember from './TokenRemember';
import PainelLogout from './PainelLogout';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ token: string }>;
};

const STATUS_LABELS: Record<string, string> = {
  requested:  'Solicitado',
  confirmed:  'Confirmado',
  no_show:    'Não compareceu',
  done:       'Concluído',
};

const STATUS_COLORS: Record<string, string> = {
  requested:  '#c5a368',
  confirmed:  '#4caf7d',
  no_show:    '#e05c5c',
  done:       '#666',
};

export default async function PainelPage({ params }: Props) {
  const { token } = await params;

  const tenant = await getTenantByToken(token);
  if (!tenant) notFound();

  const niche = getNicheConfig(tenant.niche);

  const [stats, conversations] = await Promise.all([
    getDashboardStats(tenant.id),
    getTenantConversations(tenant.id, 50),
  ]);

  const qualified = conversations.filter(c => c.qualified);

  return (
    <div style={{
      minHeight:   '100vh',
      background:  '#0c0b09',
      color:       '#e8e8e8',
      fontFamily:  '"Inter", system-ui, sans-serif',
      padding:     '1.5rem',
    }}>
      <TokenRemember token={token} />
      {/* Header */}
      <div style={{
        maxWidth:     '900px',
        margin:       '0 auto 2rem',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'space-between',
        flexWrap:     'wrap',
        gap:          '0.75rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0, color: '#e8e8e8' }}>
            Painel — {tenant.name}
          </h1>
          <p style={{ fontSize: '0.75rem', color: '#555', margin: '0.2rem 0 0' }}>
            Pedidos e agendamentos recebidos
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <a
            href={`/painel/${token}/agenda`}
            style={{
              fontSize:       '0.75rem',
              color:          '#4caf7d',
              textDecoration: 'none',
              border:         '1px solid rgba(76,175,125,0.3)',
              borderRadius:   '6px',
              padding:        '0.3rem 0.7rem',
            }}
          >
            Agenda
          </a>
          <a
            href={`/${tenant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize:       '0.75rem',
              color:          '#c5a368',
              textDecoration: 'none',
              border:         '1px solid rgba(197,163,104,0.3)',
              borderRadius:   '6px',
              padding:        '0.3rem 0.7rem',
            }}
          >
            Ver página da loja →
          </a>
          <PainelLogout />
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* KPI cards */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap:                 '1rem',
        }}>
          {[
            { label: 'Total conversas',   value: stats.total,                icon: '💬' },
            { label: 'Pedidos recebidos', value: stats.qualified,            icon: '✅' },
            { label: 'Hoje',              value: stats.today,                icon: '📅' },
            { label: 'Aguardando confirmação', value: stats.pending_confirmation, icon: '⏳' },
          ].map(card => (
            <div key={card.label} style={{
              background:   '#161310',
              border:       '1px solid rgba(197,163,104,0.1)',
              borderRadius: '12px',
              padding:      '1rem 1.25rem',
            }}>
              <p style={{ fontSize: '1.4rem', margin: '0 0 0.3rem' }}>{card.icon}</p>
              <p style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 0.2rem', color: '#c5a368' }}>
                {card.value}
              </p>
              <p style={{ fontSize: '0.72rem', color: '#666', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {card.label}
              </p>
            </div>
          ))}
        </div>

        {/* Qualified conversations */}
        <section style={{
          background:   '#161310',
          border:       '1px solid rgba(197,163,104,0.1)',
          borderRadius: '12px',
          overflow:     'hidden',
        }}>
          <div style={{
            padding:     '1rem 1.25rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            display:     'flex',
            alignItems:  'center',
            justifyContent: 'space-between',
          }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 600, margin: 0, color: '#e8e8e8' }}>
              Pedidos de orçamento
            </h2>
            <span style={{ fontSize: '0.72rem', color: '#555' }}>
              {qualified.length} registro{qualified.length !== 1 ? 's' : ''}
            </span>
          </div>

          {qualified.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#555', fontSize: '0.85rem' }}>
              Nenhum pedido ainda. Compartilhe o link da sua página!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['Data', 'Cliente', 'Telefone', 'Serviço', niche.location_based ? 'Endereço' : 'Veículo', 'Horário', 'Status'].map(h => (
                      <th key={h} style={{
                        padding:   '0.65rem 0.85rem',
                        textAlign: 'left',
                        color:     '#555',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        fontSize:  '0.72rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {qualified.map(conv => (
                    <tr key={conv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '0.65rem 0.85rem', color: '#888', whiteSpace: 'nowrap' }}>
                        {new Date(conv.started_at).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', color: '#e8e8e8' }}>
                        {conv.lead_name ?? '—'}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', whiteSpace: 'nowrap' }}>
                        {conv.lead_phone ? (
                          <a
                            href={`https://wa.me/55${conv.lead_phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#25D366', textDecoration: 'none' }}
                          >
                            {conv.lead_phone}
                          </a>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', color: '#ccc' }}>
                        {conv.service ?? '—'}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', color: '#ccc' }}>
                        {niche.location_based
                          ? (conv.customer_address ?? '—')
                          : (conv.vehicle ?? '—')}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem', color: '#ccc' }}>
                        {conv.preferred_slot ?? '—'}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        <DashboardClient
                          convId={conv.id}
                          token={token}
                          currentStatus={conv.booking_status}
                          statusLabels={STATUS_LABELS}
                          statusColors={STATUS_COLORS}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Non-qualified conversations */}
        {conversations.filter(c => !c.qualified).length > 0 && (
          <details style={{
            background:   '#0f0f0f',
            border:       '1px solid rgba(255,255,255,0.05)',
            borderRadius: '10px',
            padding:      '0.75rem 1rem',
          }}>
            <summary style={{ cursor: 'pointer', fontSize: '0.78rem', color: '#555' }}>
              Conversas sem pedido ({conversations.filter(c => !c.qualified).length})
            </summary>
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {conversations.filter(c => !c.qualified).map(conv => (
                <div key={conv.id} style={{
                  fontSize:  '0.78rem',
                  color:     '#666',
                  display:   'flex',
                  gap:       '1rem',
                }}>
                  <span>
                    {new Date(conv.started_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                  <span>{conv.turns} mensagens</span>
                  {conv.source && <span>via {conv.source}</span>}
                </div>
              ))}
            </div>
          </details>
        )}

        <p style={{ fontSize: '0.68rem', color: '#333', textAlign: 'center' }}>
          Este link é privado — não compartilhe.
        </p>
      </div>
    </div>
  );
}
