'use client';

import { useState } from 'react';

type Props = {
  convId:       string;
  token:        string;
  currentStatus: string | null;
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
};

const STATUS_ORDER = ['requested', 'confirmed', 'no_show', 'done'] as const;
type BookingStatus = typeof STATUS_ORDER[number];

export default function DashboardClient({
  convId, token, currentStatus, statusLabels, statusColors,
}: Props) {
  const [status,  setStatus]  = useState<string | null>(currentStatus);
  const [saving,  setSaving]  = useState(false);
  const [open,    setOpen]    = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function updateStatus(next: BookingStatus) {
    if (saving || next === status) { setOpen(false); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/painel/${token}/conversations/${convId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ booking_status: next }),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      setStatus(next);
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
    } finally {
      setSaving(false);
      setOpen(false);
    }
  }

  const label = status ? (statusLabels[status] ?? status) : 'Novo';
  const color = status ? (statusColors[status] ?? '#888') : '#c5a368';

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={saving}
        style={{
          background:   'transparent',
          border:       `1px solid ${color}44`,
          borderRadius: '6px',
          padding:      '0.25rem 0.6rem',
          color,
          fontSize:     '0.75rem',
          fontWeight:   600,
          cursor:       saving ? 'wait' : 'pointer',
          whiteSpace:   'nowrap',
        }}
      >
        {saving ? '…' : label} ▾
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 10,
            }}
          />
          {/* Dropdown */}
          <div style={{
            position:    'absolute',
            top:         'calc(100% + 4px)',
            left:        0,
            zIndex:      11,
            background:  '#1e1e1e',
            border:      '1px solid rgba(255,255,255,0.1)',
            borderRadius:'8px',
            minWidth:    '150px',
            overflow:    'hidden',
            boxShadow:   '0 4px 20px rgba(0,0,0,0.5)',
          }}>
            {STATUS_ORDER.map(s => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                style={{
                  display:    'block',
                  width:      '100%',
                  textAlign:  'left',
                  background: s === status ? 'rgba(197,163,104,0.1)' : 'transparent',
                  border:     'none',
                  padding:    '0.5rem 0.85rem',
                  color:      statusColors[s] ?? '#e8e8e8',
                  fontSize:   '0.78rem',
                  fontWeight: s === status ? 700 : 400,
                  cursor:     'pointer',
                }}
              >
                {statusLabels[s] ?? s}
              </button>
            ))}
          </div>
        </>
      )}

      {error && (
        <p style={{
          position:  'absolute',
          top:       'calc(100% + 4px)',
          left:      0,
          fontSize:  '0.7rem',
          color:     '#e05c5c',
          margin:    0,
          whiteSpace:'nowrap',
        }}>
          {error}
        </p>
      )}
    </div>
  );
}
