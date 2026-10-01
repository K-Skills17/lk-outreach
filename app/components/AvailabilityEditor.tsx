'use client';

import { useState } from 'react';
import { fmtIsoDay } from '@/lib/format';

// Weekly availability grid + blocked-dates list. Shared by the tenant painel
// (/painel/[token]/agenda) and the admin's own agenda (/admin/agenda).

type SlotRow = {
  day_of_week:  number;
  start_time:   string;
};

type BlockRow = {
  id:         string;
  block_date: string;
  reason:     string | null;
};

type Props = {
  availabilityUrl: string;
  blocksUrl:       string;
  initialSlots:    SlotRow[];
  initialBlocks:   BlockRow[];
  dayCols:         number[];  // 0=Sun … 6=Sat
  firstTime:       string;    // "HH:MM" — first row of the grid
  lastTime:        string;    // "HH:MM" — last row of the grid (inclusive)
  durationMin:     number;
  title?:          string;
  hint?:           string;
};

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Every half hour from `first` to `last`, inclusive. */
function halfHours(first: string, last: string): string[] {
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const out: string[] = [];
  for (let m = toMin(first); m <= toMin(last); m += 30) {
    out.push(`${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`);
  }
  return out;
}

// Keys are "<dow>|<HH:MM>" — a separator that can't appear in the time itself.
const cellKey = (dow: number, time: string) => `${dow}|${time}`;

export default function AvailabilityEditor({
  availabilityUrl, blocksUrl, initialSlots, initialBlocks,
  dayCols, firstTime, lastTime, durationMin,
  title = 'Horários disponíveis',
  hint  = 'Clique nas células para ativar/desativar horários. Dourado = disponível.',
}: Props) {
  const hours = halfHours(firstTime, lastTime);

  const [schedule, setSchedule] = useState<Set<string>>(
    () => new Set(initialSlots.map(s => cellKey(s.day_of_week, s.start_time.slice(0, 5)))),
  );
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState<string | null>(null);

  const [blocks,      setBlocks]      = useState<BlockRow[]>(initialBlocks);
  const [blockDate,   setBlockDate]   = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockSaving, setBlockSaving] = useState(false);
  const [blockErr,    setBlockErr]    = useState<string | null>(null);

  function toggleCell(dow: number, time: string) {
    const key = cellKey(dow, time);
    setSchedule(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function saveSchedule() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const slots = Array.from(schedule).map(key => {
        const [dow, time] = key.split('|');
        return { day_of_week: Number(dow), start_time: time, duration_min: durationMin, max_bookings: 1 };
      });
      const res = await fetch(availabilityUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ slots }),
      });
      if (!res.ok) throw new Error();
      setSaveMsg('Horários salvos!');
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setSaveMsg('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  async function addBlock() {
    if (!blockDate) return;
    setBlockSaving(true);
    setBlockErr(null);
    try {
      const res = await fetch(blocksUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ block_date: blockDate, reason: blockReason || undefined }),
      });
      if (res.status === 409) { setBlockErr('Data já bloqueada.'); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBlocks(prev => [...prev, { id: data.id, block_date: blockDate, reason: blockReason || null }]);
      setBlockDate('');
      setBlockReason('');
    } catch {
      setBlockErr('Erro ao bloquear data.');
    } finally {
      setBlockSaving(false);
    }
  }

  async function removeBlock(blockId: string) {
    setBlockErr(null);
    try {
      const res = await fetch(blocksUrl, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ block_id: blockId }),
      });
      if (!res.ok) throw new Error();
      setBlocks(prev => prev.filter(b => b.id !== blockId));
    } catch {
      setBlockErr('Erro ao remover bloqueio.');
    }
  }

  const card: React.CSSProperties = {
    background:   '#161310',
    border:       '1px solid rgba(197,163,104,0.1)',
    borderRadius: '12px',
    overflow:     'hidden',
  };

  const sectionHeader: React.CSSProperties = {
    padding:        '0.85rem 1.25rem',
    borderBottom:   '1px solid rgba(255,255,255,0.05)',
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
  };

  // Only count slots that are visible in this grid.
  const visibleCount = dayCols.reduce(
    (n, dow) => n + hours.filter(t => schedule.has(cellKey(dow, t))).length, 0,
  );

  return (
    <>
      {/* ── Weekly schedule grid ── */}
      <section style={card}>
        <div style={sectionHeader}>
          <h2 style={{ fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>{title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {saveMsg && (
              <span style={{ fontSize: '0.75rem', color: saveMsg.startsWith('Erro') ? '#e05c5c' : '#4caf7d' }}>
                {saveMsg}
              </span>
            )}
            <button
              onClick={saveSchedule}
              disabled={saving}
              style={{
                background:   saving ? '#1a1a1a' : '#c5a368',
                border:       'none',
                borderRadius: '7px',
                padding:      '0.35rem 0.85rem',
                color:        saving ? '#555' : '#0a0a0a',
                fontWeight:   700,
                fontSize:     '0.78rem',
                cursor:       saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Salvando…' : 'Salvar horários'}
            </button>
          </div>
        </div>

        <div style={{ padding: '1rem 1.25rem', overflowX: 'auto' }}>
          <p style={{ fontSize: '0.72rem', color: '#555', margin: '0 0 0.85rem' }}>{hint}</p>

          <table style={{ borderCollapse: 'collapse', fontSize: '0.75rem', minWidth: `${80 + dayCols.length * 52}px` }}>
            <thead>
              <tr>
                <th style={{ width: '48px', padding: '0.3rem 0.5rem', color: '#444', fontWeight: 500 }}></th>
                {dayCols.map(dow => (
                  <th key={dow} style={{ padding: '0.3rem 0.4rem', color: '#888', fontWeight: 600, textAlign: 'center', minWidth: '52px' }}>
                    {DAY_NAMES[dow]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hours.map(time => (
                <tr key={time}>
                  <td style={{ padding: '0.15rem 0.5rem 0.15rem 0', color: '#444', fontSize: '0.7rem', whiteSpace: 'nowrap', textAlign: 'right' }}>
                    {time}
                  </td>
                  {dayCols.map(dow => {
                    const active = schedule.has(cellKey(dow, time));
                    return (
                      <td key={dow} style={{ padding: '0.15rem 0.2rem', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleCell(dow, time)}
                          title={`${DAY_NAMES[dow]} ${time}`}
                          aria-pressed={active}
                          style={{
                            width:        '44px',
                            height:       '24px',
                            background:   active ? '#c5a368' : 'rgba(255,255,255,0.03)',
                            border:       `1px solid ${active ? '#c5a368' : 'rgba(255,255,255,0.07)'}`,
                            borderRadius: '5px',
                            cursor:       'pointer',
                            transition:   'background 0.12s, border-color 0.12s',
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ fontSize: '0.68rem', color: '#444', margin: '0.75rem 0 0' }}>
            {visibleCount} horário{visibleCount !== 1 ? 's' : ''} selecionado{visibleCount !== 1 ? 's' : ''} · Duração: {durationMin} min
          </p>
        </div>
      </section>

      {/* ── Block dates ── */}
      <section style={card}>
        <div style={sectionHeader}>
          <h2 style={{ fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>Bloquear datas</h2>
          <span style={{ fontSize: '0.72rem', color: '#555' }}>
            {blocks.length} data{blocks.length !== 1 ? 's' : ''} bloqueada{blocks.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <input
              type="date"
              value={blockDate}
              onChange={e => setBlockDate(e.target.value)}
              style={{
                background: '#1e1b16', border: '1px solid rgba(197,163,104,0.15)',
                borderRadius: '7px', padding: '0.4rem 0.65rem',
                color: '#e8e8e8', fontSize: '0.82rem', outline: 'none',
              }}
            />
            <input
              type="text"
              value={blockReason}
              onChange={e => setBlockReason(e.target.value)}
              placeholder="Motivo (opcional)"
              style={{
                flex: 1, minWidth: '140px',
                background: '#1e1b16', border: '1px solid rgba(197,163,104,0.15)',
                borderRadius: '7px', padding: '0.4rem 0.65rem',
                color: '#e8e8e8', fontSize: '0.82rem', outline: 'none',
              }}
            />
            <button
              onClick={addBlock}
              disabled={!blockDate || blockSaving}
              style={{
                background:   !blockDate || blockSaving ? '#1a1a1a' : 'rgba(197,163,104,0.12)',
                border:       `1px solid ${!blockDate || blockSaving ? 'rgba(255,255,255,0.04)' : 'rgba(197,163,104,0.3)'}`,
                borderRadius: '7px', padding: '0.4rem 0.85rem',
                color:        !blockDate || blockSaving ? '#444' : '#c5a368',
                fontWeight:   600, fontSize: '0.82rem',
                cursor:       !blockDate || blockSaving ? 'not-allowed' : 'pointer',
              }}
            >
              {blockSaving ? 'Bloqueando…' : 'Bloquear'}
            </button>
          </div>

          {blockErr && (
            <p style={{ color: '#e05c5c', fontSize: '0.75rem', margin: '0 0 0.75rem' }}>{blockErr}</p>
          )}

          {blocks.length === 0 ? (
            <p style={{ color: '#444', fontSize: '0.82rem', margin: 0 }}>Nenhuma data bloqueada.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {blocks
                .slice()
                .sort((a, b) => a.block_date.localeCompare(b.block_date))
                .map(b => (
                  <div key={b.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'rgba(224,92,92,0.05)', border: '1px solid rgba(224,92,92,0.12)',
                    borderRadius: '7px', padding: '0.45rem 0.75rem',
                  }}>
                    <div>
                      <span style={{ color: '#e05c5c', fontWeight: 700, fontSize: '0.82rem' }}>
                        {fmtIsoDay(b.block_date)}
                      </span>
                      {b.reason && (
                        <span style={{ color: '#555', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                          {b.reason}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeBlock(b.id)}
                      style={{
                        background: 'none', border: 'none',
                        color: '#444', fontSize: '0.75rem',
                        cursor: 'pointer', padding: '0 0.2rem',
                      }}
                    >
                      Remover
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
