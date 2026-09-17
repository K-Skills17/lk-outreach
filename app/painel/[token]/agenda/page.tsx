import { notFound } from 'next/navigation';
import { getTenantByToken } from '@/lib/tenant';
import { getUpcomingBookings, getAvailabilitySlots, getSlotBlocks } from '@/lib/calendar';
import AgendaClient from './AgendaClient';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ token: string }> };

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'Confirmado',
  done:      'Concluído',
  no_show:   'Não veio',
  cancelled: 'Cancelado',
};
const STATUS_COLOR: Record<string, string> = {
  confirmed: '#c5a368',
  done:      '#4caf7d',
  no_show:   '#e05c5c',
  cancelled: '#555',
};

export default async function AgendaPage({ params }: Props) {
  const { token } = await params;
  const tenant    = await getTenantByToken(token);
  if (!tenant) notFound();

  const [bookings, slots, blocks] = await Promise.all([
    getUpcomingBookings(tenant.id, 60),
    getAvailabilitySlots(tenant.id),
    getSlotBlocks(tenant.id),
  ]);

  return (
    <div style={{
      minHeight:  '100vh',
      background: '#0c0b09',
      color:      '#e8e8e8',
      fontFamily: '"Inter", system-ui, sans-serif',
      padding:    '1.5rem',
    }}>
      <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Agenda — {tenant.name}</h1>
            <p style={{ fontSize: '0.72rem', color: '#555', margin: '0.2rem 0 0' }}>
              Próximos agendamentos e configuração de horários
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <a href={`/book/${tenant.slug}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '0.75rem', color: '#4caf7d', border: '1px solid rgba(76,175,125,0.3)', borderRadius: '6px', padding: '0.3rem 0.7rem', textDecoration: 'none' }}>
              Ver página de agendamento →
            </a>
            <a href={`/painel/${token}`}
              style={{ fontSize: '0.75rem', color: '#555', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', padding: '0.3rem 0.7rem', textDecoration: 'none' }}>
              ← Voltar ao painel
            </a>
          </div>
        </div>

        {/* Upcoming bookings */}
        <section style={{ background: '#161310', border: '1px solid rgba(197,163,104,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>Próximos agendamentos</h2>
            <span style={{ fontSize: '0.72rem', color: '#555' }}>{bookings.length} agendamento{bookings.length !== 1 ? 's' : ''}</span>
          </div>

          {bookings.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#555', fontSize: '0.85rem' }}>
              Nenhum agendamento futuro. Configure seus horários abaixo e compartilhe o link!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['Data', 'Horário', 'Cliente', 'Telefone', 'Serviço', 'Status'].map(h => (
                      <th key={h} style={{ padding: '0.6rem 0.85rem', textAlign: 'left', color: '#555', fontWeight: 500, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => {
                    const [, mm, dd] = b.slot_date.split('-');
                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '0.6rem 0.85rem', color: '#e8e8e8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {dd}/{mm}
                        </td>
                        <td style={{ padding: '0.6rem 0.85rem', color: '#c5a368', fontWeight: 600 }}>{b.start_time}</td>
                        <td style={{ padding: '0.6rem 0.85rem', color: '#e8e8e8' }}>{b.lead_name ?? '—'}</td>
                        <td style={{ padding: '0.6rem 0.85rem' }}>
                          {b.lead_phone ? (
                            <a href={`https://wa.me/55${b.lead_phone}`} target="_blank" rel="noopener noreferrer"
                              style={{ color: '#25D366', textDecoration: 'none' }}>
                              {b.lead_phone}
                            </a>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '0.6rem 0.85rem', color: '#ccc' }}>{b.service ?? '—'}</td>
                        <td style={{ padding: '0.6rem 0.85rem' }}>
                          <span style={{
                            color:        STATUS_COLOR[b.status] ?? '#888',
                            fontSize:     '0.72rem', fontWeight: 600,
                            background:   `${STATUS_COLOR[b.status] ?? '#888'}18`,
                            border:       `1px solid ${STATUS_COLOR[b.status] ?? '#888'}33`,
                            borderRadius: '5px', padding: '0.15rem 0.45rem',
                          }}>
                            {STATUS_LABEL[b.status] ?? b.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Availability editor — client component */}
        <AgendaClient
          token={token}
          initialSlots={slots}
          initialBlocks={blocks}
        />

      </div>
    </div>
  );
}
