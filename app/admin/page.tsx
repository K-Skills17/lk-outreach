import { getAdminStats, type NumberRow } from '@/lib/admin';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pct(a: number, b: number): string {
  if (!b) return '—';
  return (Math.round((a / b) * 1000) / 10).toFixed(1) + '%';
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background:   '#141414',
      border:       '1px solid rgba(197,163,104,0.1)',
      borderRadius: '10px',
      padding:      '1rem 1.1rem',
    }}>
      <p style={{ color: '#888', fontSize: '0.7rem', letterSpacing: '0.1em',
                  textTransform: 'uppercase', margin: '0 0 0.4rem' }}>
        {label}
      </p>
      <p style={{ color: '#e8e8e8', fontSize: '1.65rem', fontWeight: 700, margin: 0, lineHeight: 1 }}>
        {value}
      </p>
      {sub && (
        <p style={{ color: '#888', fontSize: '0.72rem', margin: '0.3rem 0 0' }}>{sub}</p>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ color: '#c5a368', fontSize: '0.68rem', fontWeight: 700,
                 letterSpacing: '0.12em', textTransform: 'uppercase',
                 margin: '1.75rem 0 0.75rem' }}>
      {children}
    </h2>
  );
}

function NumbersTable({ numbers }: { numbers: NumberRow[] }) {
  if (!numbers.length) {
    return <p style={{ color: '#555', fontSize: '0.82rem' }}>Nenhum número cadastrado.</p>;
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr style={{ color: '#666', textAlign: 'left' }}>
            {['Número', 'Status', 'Hoje', 'Cap', 'Uso'].map(h => (
              <th key={h} style={{ padding: '0.35rem 0.75rem 0.6rem',
                                   fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {numbers.map(n => {
            const pctUsed = n.daily_cap > 0 ? Math.min(100, Math.round((n.sent_today / n.daily_cap) * 100)) : 0;
            const statusColor = n.status === 'active' ? '#4caf7d' : n.status === 'paused' ? '#e05c5c' : '#888';
            return (
              <tr key={n.id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '0.55rem 0.75rem', color: '#ddd' }}>{n.label}</td>
                <td style={{ padding: '0.55rem 0.75rem' }}>
                  <span style={{ color: statusColor, fontWeight: 600 }}>{n.status}</span>
                </td>
                <td style={{ padding: '0.55rem 0.75rem', color: '#e8e8e8', fontWeight: 600 }}>
                  {n.sent_today}
                </td>
                <td style={{ padding: '0.55rem 0.75rem', color: '#888' }}>{n.daily_cap}</td>
                <td style={{ padding: '0.55rem 0.75rem', minWidth: '100px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, height: '6px', background: '#2a2a2a', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        width:        `${pctUsed}%`,
                        height:       '100%',
                        background:   pctUsed > 80 ? '#e05c5c' : '#c5a368',
                        borderRadius: '3px',
                        transition:   'width 0.3s',
                      }} />
                    </div>
                    <span style={{ color: '#888', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>
                      {pctUsed}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AdminDashboard() {
  const s = await getAdminStats();

  const activeContacts = s.contacted + s.in_followup + s.replied + s.call_booked;
  const viewRate       = pct(s.audit_views, s.audit_sent);
  const replyRate      = pct(s.replied,     s.total_sent);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                    marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <h1 style={{ color: '#e8e8e8', fontWeight: 700, fontSize: '1.15rem', margin: 0 }}>
          Dashboard
        </h1>
        <span style={{ color: '#555', fontSize: '0.72rem' }}>
          Atualiza a cada 30s
        </span>
      </div>
      <div className="divider-gold" style={{ marginBottom: '1.25rem' }} />

      {/* Numbers */}
      <SectionTitle>Números WhatsApp</SectionTitle>
      <div style={{ background: '#141414', border: '1px solid rgba(197,163,104,0.1)',
                    borderRadius: '10px', padding: '0.25rem 0.5rem' }}>
        <NumbersTable numbers={s.numbers} />
      </div>

      {/* Queue preview */}
      <SectionTitle>Fila para próximo envio</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
        <StatCard label="P1 novos" value={s.phase1_ready}  sub="tier A/B com slug" />
        <StatCard label="P2 D2 due" value={s.phase2_ready} sub="follow-up 1" />
        <StatCard label="P3 D4 due" value={s.phase3_ready} sub="break-up" />
      </div>

      {/* Outreach funnel */}
      <SectionTitle>Funil de prospecção</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
        <StatCard label="Total"          value={s.total}      />
        <StatCard label="Scored"         value={s.scored}     sub={pct(s.scored, s.total)} />
        <StatCard label="Tier A"         value={s.tier_a}     />
        <StatCard label="Tier B"         value={s.tier_b}     />
        <StatCard label="Tier C"         value={s.tier_c}     />
      </div>

      {/* Engagement */}
      <SectionTitle>Engajamento</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
        <StatCard label="Msgs enviadas"  value={s.total_sent}  />
        <StatCard label="Audits enviados" value={s.audit_sent}  />
        <StatCard label="Audit views"    value={s.audit_views} sub={`taxa ${viewRate}`} />
        <StatCard label="Responderam"    value={s.replied}     sub={`taxa ${replyRate}`} />
        <StatCard label="Opted out"      value={s.opted_out}   />
      </div>

      {/* Pipeline */}
      <SectionTitle>Pipeline ativo</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
        <StatCard label="Em contato"     value={activeContacts} sub="contacted+followup" />
        <StatCard label="Responderam"    value={s.replied}      />
        <StatCard label="Call agendada"  value={s.call_booked}  />
        <StatCard label="Ganhos"         value={s.won}          />
        <StatCard label="Perdidos"       value={s.lost}         />
      </div>
    </>
  );
}
