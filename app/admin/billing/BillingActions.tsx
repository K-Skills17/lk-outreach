'use client';

import { useState } from 'react';

type Props = {
  tenantId:      string;
  monthlyStatus: string;
  botEnabled:    boolean;
};

const STATUS_CYCLE: Record<string, string> = {
  pending:   'paid',
  overdue:   'paid',
  paid:      'pending',
  cancelled: 'pending',
};

export default function BillingActions({ tenantId, monthlyStatus, botEnabled }: Props) {
  const [status,  setStatus]  = useState(monthlyStatus);
  const [bot,     setBot]     = useState(botEnabled);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function patch(payload: { monthly_status?: string; bot_enabled?: boolean }) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      if (payload.monthly_status !== undefined) setStatus(payload.monthly_status);
      if (payload.bot_enabled    !== undefined) setBot(payload.bot_enabled);
    } catch {
      setError('Erro. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  const nextStatus = STATUS_CYCLE[status] ?? 'paid';
  const isPaid     = status === 'paid';

  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Toggle monthly_status */}
      <button
        onClick={() => patch({ monthly_status: nextStatus, bot_enabled: nextStatus === 'paid' ? true : bot })}
        disabled={saving}
        style={{
          background:   isPaid ? 'rgba(76,175,125,0.15)' : 'rgba(197,163,104,0.12)',
          border:       isPaid ? '1px solid rgba(76,175,125,0.3)' : '1px solid rgba(197,163,104,0.25)',
          borderRadius: '6px',
          padding:      '0.25rem 0.6rem',
          color:        isPaid ? '#4caf7d' : '#c5a368',
          fontSize:     '0.72rem',
          fontWeight:   600,
          cursor:       saving ? 'wait' : 'pointer',
          whiteSpace:   'nowrap',
        }}
      >
        {saving ? '…' : isPaid ? '✓ Pago' : 'Marcar pago'}
      </button>

      {/* Re-enable bot (only shown if disabled) */}
      {!bot && (
        <button
          onClick={() => patch({ bot_enabled: true })}
          disabled={saving}
          style={{
            background:   'rgba(224,92,92,0.12)',
            border:       '1px solid rgba(224,92,92,0.25)',
            borderRadius: '6px',
            padding:      '0.25rem 0.6rem',
            color:        '#e05c5c',
            fontSize:     '0.72rem',
            fontWeight:   600,
            cursor:       saving ? 'wait' : 'pointer',
            whiteSpace:   'nowrap',
          }}
        >
          Reativar bot
        </button>
      )}

      {error && (
        <span style={{ fontSize: '0.68rem', color: '#e05c5c' }}>{error}</span>
      )}
    </div>
  );
}
