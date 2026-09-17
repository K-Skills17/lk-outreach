'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  id: string;
  currentStatus: string;
  currentNotes: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  replied:     'Respondeu',
  call_booked: 'Call agendada',
  won:         'Ganho',
  lost:        'Perdido',
};

const STATUS_COLORS: Record<string, string> = {
  replied:     '#c5a368',
  call_booked: '#6a9fd8',
  won:         '#4caf7d',
  lost:        '#e05c5c',
};

export default function ProspectActions({ id, currentStatus, currentNotes }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [note,    setNote]    = useState(currentNotes || '');
  const [showNote, setShowNote] = useState(false);
  const [msg,     setMsg]     = useState('');

  async function setStatus(status: string) {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`/api/admin/prospects/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      });
      if (res.ok) {
        setMsg('Salvo.');
        router.refresh();
      } else {
        setMsg('Erro ao salvar.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function saveNote() {
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch(`/api/admin/prospects/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ notes: note }),
      });
      setMsg(res.ok ? 'Nota salva.' : 'Erro.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start' }}>
      {/* Status buttons */}
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
        {Object.entries(STATUS_LABELS).map(([s, label]) => (
          <button
            key={s}
            disabled={loading || currentStatus === s}
            onClick={() => setStatus(s)}
            style={{
              background:   currentStatus === s ? STATUS_COLORS[s] : 'transparent',
              border:       `1px solid ${STATUS_COLORS[s] || '#555'}`,
              borderRadius: '5px',
              padding:      '0.2rem 0.55rem',
              color:        currentStatus === s ? '#0a0a0a' : STATUS_COLORS[s] || '#aaa',
              fontSize:     '0.72rem',
              fontWeight:   600,
              cursor:       currentStatus === s ? 'default' : 'pointer',
              opacity:      loading ? 0.5 : 1,
              transition:   'background 0.15s',
            }}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => setShowNote(v => !v)}
          style={{
            background:   'transparent',
            border:       '1px solid #444',
            borderRadius: '5px',
            padding:      '0.2rem 0.55rem',
            color:        '#888',
            fontSize:     '0.72rem',
            cursor:       'pointer',
          }}
        >
          {showNote ? 'Fechar' : 'Nota'}
        </button>
      </div>

      {/* Note editor */}
      {showNote && (
        <div style={{ display: 'flex', gap: '0.35rem', width: '100%' }}>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Adicionar nota…"
            style={{
              flex:         1,
              background:   '#1e1e1e',
              border:       '1px solid rgba(197,163,104,0.18)',
              borderRadius: '5px',
              padding:      '0.25rem 0.5rem',
              color:        '#e8e8e8',
              fontSize:     '0.78rem',
            }}
          />
          <button
            disabled={loading}
            onClick={saveNote}
            style={{
              background:   '#c5a368',
              border:       'none',
              borderRadius: '5px',
              padding:      '0.25rem 0.6rem',
              color:        '#0a0a0a',
              fontSize:     '0.72rem',
              fontWeight:   700,
              cursor:       'pointer',
            }}
          >
            OK
          </button>
        </div>
      )}

      {msg && (
        <span style={{ fontSize: '0.7rem', color: '#888' }}>{msg}</span>
      )}
    </div>
  );
}
