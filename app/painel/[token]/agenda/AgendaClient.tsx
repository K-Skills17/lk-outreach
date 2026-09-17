'use client';

import { useState } from 'react';

type SlotRow = {
  id:           string;
  day_of_week:  number;
  start_time:   string;
  duration_min: number;
  max_bookings: number;
};

type BlockRow = {
  id:         string;
  block_date: string;
  reason:     string | null;
};

type Props = {
  token:         string;
  initialSlots:  SlotRow[];
  initialBlocks: BlockRow[];
};

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DAY_COLS  = [1, 2, 3, 4, 5, 6]; // Mon–Sat

const HOURS: string[] = [];
for (let h = 7; h <= 19; h++) {
  HOURS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 19) HOURS.push(`${String(h).padStart(2, '0')}:30`);
}

function slotsToSet(slots: SlotRow[]): Set<string> {
  return new Set(slots.map(s => `${s.day_of_week}:${s.start_time.slice(0, 5)}`));
}

function formatDateBR(dateStr: string): string {
  const [, mm, dd] = dateStr.split('-');
  return `${dd}/${mm}`;
}

export default function AgendaClient({ token, initialSlots, initialBlocks }: Props) {
  const [schedule, setSchedule] = useState<Set<string>>(slotsToSet(initialSlots));
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState<string | null>(null);

  const [blocks,       setBlocks]      = useState<BlockRow[]>(initialBlocks);
  const [blockDate,    setBlockDate]   = useState('');
  const [blockReason,  setBlockReason] = useState('');
  const [blockSaving,  setBlockSaving] = useState(false);
  const [blockErr,     setBlockErr]    = useState<string | null>(null);

  function toggleCell(dow: number, time: string) {
    const key = `${dow}:${time}`;
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
        const [dow, time] = key.split(':');
        return { day_of_week: Number(dow), start_time: time + ':00', duration_min: 60, max_bookings: 1 };
      });
      const res = await fetch(`/api/painel/${token}/availability`, {
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
      const res = await fetch(`/api/painel/${token}/blocks`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ block_date: blockDate, reason: blockReason || undefined }),
      });
      if (res.status === 409) { setBlockErr('Data já bloqueada.'); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBlocks(prev => [...prev, { id: data.id ?? crypto.randomUUID(), block_date: blockDate, reason: blockReason || null }]);
      setBlockDate('');
      setBlockReason('');
    } catch {
      setBlockErr('Erro ao bloquear data.');
    } finally {
      setBlockSaving(false);
    }
  }

  async function removeBlock(blockId: string) {
    try {
      await fetch(`/api/painel/${token}/blocks`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ block_id: blockId }),
      });
      setBlocks(prev => prev.filter(b => b.id !== blockId));
    } catch {
      // silently ignore
    }
  }

  const card: React.CSSProperties = {
    background:   '#161310',
    border:       '1px solid rgba(197,163,104,0.1)',
    borderRadius: '12px',
    overflow:     'hidden',
  };

  const sectionHeader: React.CSSProperties = {
    padding:      '0.85rem 1.25rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    display:      'flex',
    justifyContent: 'space-between',
    alignItems:   'center',
  };

  return (
    <>
      {/* ── Weekly schedule grid ── */}
      <section style={card}>
        <div style={sectionHeader}>
          <h2 style={{ fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>Horários disponíveis</h2>
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
          <p style={{ fontSize: '0.72rem', color: '#555', margin: '0 0 0.85rem' }}>
            Clique nas células para ativar/desativar horários. Dourado = disponível.
          </p>

          <table style={{ borderCollapse: 'collapse', fontSize: '0.75rem', minWidth: '380px' }}>
            <thead>
              <tr>
                <th style={{ width: '48px', padding: '0.3rem 0.5rem', color: '#444', fontWeight: 500 }}></th>
                {DAY_COLS.map(dow => (
                  <th key={dow} style={{ padding: '0.3rem 0.4rem', color: '#888', fontWeight: 600, textAlign: 'center', minWidth: '52px' }}>
                    {DAY_NAMES[dow]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(time => (
                <tr key={time}>
                  <td style={{ padding: '0.15rem 0.5rem 0.15rem 0', color: '#444', fontSize: '0.7rem', whiteSpace: 'nowrap', textAlign: 'right' }}>
                    {time}
                  </td>
                  {DAY_COLS.map(dow => {
                    const active = schedule.has(`${dow}:${time}`);
                    return (
                      <td key={dow} style={{ padding: '0.15rem 0.2rem', textAlign: 'center' }}>
                        <button
                          onClick={() => toggleCell(dow, time)}
                          title={`${DAY_NAMES[dow]} ${time}`}
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
            {schedule.size} horário{schedule.size !== 1 ? 's' : ''} selecionado{schedule.size !== 1 ? 's' : ''} · Duração padrão: 60 min
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
          {/* Add block form */}
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

          {/* Blocked dates list */}
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
                        {formatDateBR(b.block_date)}
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
