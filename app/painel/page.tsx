'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PainelLogin() {
  const router  = useRouter();
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  // Try localStorage first — skip login entirely if token exists
  useEffect(() => {
    const saved = localStorage.getItem('lk_painel_token');
    if (saved) {
      router.replace(`/painel/${saved}`);
    } else {
      setChecked(true);
    }
  }, [router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Digite um número válido com DDD.'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/painel/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phone: digits }),
      });
      if (res.status === 404) {
        setError('Número não encontrado. Entre em contato com a LK Digital.');
        return;
      }
      if (!res.ok) throw new Error();
      const { token } = await res.json();
      localStorage.setItem('lk_painel_token', token);
      router.replace(`/painel/${token}`);
    } catch {
      setError('Erro ao acessar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // While checking localStorage, show nothing to avoid flash
  if (!checked) return null;

  return (
    <div style={{
      minHeight:      '100vh',
      background:     '#0c0b09',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '1.5rem',
      fontFamily:     '"Inter", system-ui, sans-serif',
    }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Logo / brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ fontSize: '1.5rem', margin: '0 0 0.5rem' }}>✦</p>
          <h1 style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize:   '1.4rem', fontWeight: 700,
            color:      '#d8d2c4', margin: '0 0 0.3rem',
          }}>
            Área do Cliente
          </h1>
          <p style={{ fontSize: '0.78rem', color: '#6b6456', margin: 0 }}>
            Digite o telefone cadastrado para acessar seu painel
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background:   '#161310',
          border:       '1px solid rgba(197,163,104,0.12)',
          borderRadius: '14px',
          padding:      '1.75rem',
        }}>
          <form onSubmit={handleLogin}>
            <label style={{
              display:       'block',
              fontSize:      '0.68rem',
              color:         '#6b6456',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom:  '0.4rem',
            }}>
              Telefone (com DDD)
            </label>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="11999887766"
              autoFocus
              style={{
                width:        '100%',
                boxSizing:    'border-box',
                background:   '#1e1b16',
                border:       `1px solid ${error ? 'rgba(224,92,92,0.4)' : 'rgba(197,163,104,0.15)'}`,
                borderRadius: '8px',
                padding:      '0.65rem 0.85rem',
                color:        '#d8d2c4',
                fontSize:     '1rem',
                outline:      'none',
                letterSpacing: '0.05em',
                marginBottom: '1rem',
              }}
            />

            {error && (
              <p style={{ color: '#e05c5c', fontSize: '0.78rem', margin: '-0.5rem 0 0.85rem' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width:        '100%',
                background:   loading ? '#2a2520' : '#c5a368',
                border:       'none',
                borderRadius: '8px',
                padding:      '0.75rem',
                color:        loading ? '#6b6456' : '#0c0b09',
                fontWeight:   700,
                fontSize:     '0.9rem',
                cursor:       loading ? 'not-allowed' : 'pointer',
                transition:   'background 0.15s',
              }}
            >
              {loading ? 'Verificando…' : 'Acessar painel'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#3a3530', marginTop: '1.5rem' }}>
          LK Digital · Acesso restrito a clientes
        </p>
      </div>
    </div>
  );
}
