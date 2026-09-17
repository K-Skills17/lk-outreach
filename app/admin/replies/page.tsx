import { getReplyQueue } from '@/lib/admin';
import ProspectActions from './ProspectActions';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  contacted:   'Contatado',
  followup_1:  'Follow-up 1',
  followup_2:  'Seq. completa',
  replied:     'Respondeu',
  call_booked: 'Call agendada',
  won:         'Ganho',
  lost:        'Perdido',
  opted_out:   'Opt-out',
};

const STATUS_COLOR: Record<string, string> = {
  replied:     '#c5a368',
  call_booked: '#6a9fd8',
  won:         '#4caf7d',
  lost:        '#e05c5c',
  followup_2:  '#888',
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
       + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export default async function RepliesPage() {
  const queue = await getReplyQueue();

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                    marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ color: '#e8e8e8', fontWeight: 700, fontSize: '1.15rem', margin: 0 }}>
          Fila de Respostas
        </h1>
        <span style={{ color: '#555', fontSize: '0.72rem' }}>{queue.length} registros</span>
      </div>
      <div className="divider-gold" style={{ marginBottom: '1.25rem' }} />

      {queue.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#555' }}>
          <p style={{ fontSize: '0.9rem' }}>Nenhuma resposta pendente.</p>
          <p style={{ fontSize: '0.78rem', marginTop: '0.4rem' }}>
            Prospects com mensagens inbound ou sequência completa aparecem aqui.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ color: '#666', textAlign: 'left' }}>
                {['Nome', 'Cidade', 'Tier', 'Score', 'Status', 'Último contato', 'Inbound', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '0.35rem 0.75rem 0.65rem',
                                       fontWeight: 600, whiteSpace: 'nowrap', borderBottom: '1px solid #222' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {queue.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {/* Name */}
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <span style={{ color: '#e8e8e8', fontWeight: 500 }}>
                      {p.name.length > 30 ? p.name.slice(0, 30) + '…' : p.name}
                    </span>
                    {p.notes && (
                      <p style={{ color: '#888', fontSize: '0.7rem', margin: '0.15rem 0 0',
                                  maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap' }}>
                        {p.notes}
                      </p>
                    )}
                  </td>

                  {/* City */}
                  <td style={{ padding: '0.65rem 0.75rem', color: '#aaa' }}>
                    {p.city || '—'}
                  </td>

                  {/* Tier */}
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    {p.tier ? (
                      <span style={{
                        display:      'inline-block',
                        background:   p.tier === 'A' ? 'rgba(197,163,104,0.15)' : 'rgba(255,255,255,0.06)',
                        color:        p.tier === 'A' ? '#c5a368' : '#aaa',
                        borderRadius: '4px',
                        padding:      '0.1rem 0.45rem',
                        fontWeight:   700,
                        fontSize:     '0.75rem',
                      }}>
                        {p.tier}
                      </span>
                    ) : '—'}
                  </td>

                  {/* Score */}
                  <td style={{ padding: '0.65rem 0.75rem', color: '#e8e8e8', fontWeight: 600 }}>
                    {p.score ?? '—'}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <span style={{
                      color:      STATUS_COLOR[p.status] || '#aaa',
                      fontWeight: 600,
                      fontSize:   '0.78rem',
                    }}>
                      {STATUS_LABEL[p.status] || p.status}
                    </span>
                  </td>

                  {/* Last contacted */}
                  <td style={{ padding: '0.65rem 0.75rem', color: '#888', whiteSpace: 'nowrap' }}>
                    {fmtDate(p.last_contacted_at)}
                  </td>

                  {/* Inbound */}
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    {p.inbound_count > 0 ? (
                      <span style={{ color: '#c5a368', fontWeight: 600 }}>
                        {p.inbound_count} msg{p.inbound_count > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span style={{ color: '#555' }}>—</span>
                    )}
                    {p.last_inbound && (
                      <p style={{ color: '#555', fontSize: '0.68rem', margin: '0.1rem 0 0',
                                  whiteSpace: 'nowrap' }}>
                        {fmtDate(p.last_inbound)}
                      </p>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '0.65rem 0.75rem' }}>
                    <ProspectActions
                      id={p.id}
                      currentStatus={p.status}
                      currentNotes={p.notes}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
