'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const from         = searchParams.get('from') || '/admin';

  const [secret,  setSecret]  = useState('');
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ secret }),
      });
      if (res.ok) {
        router.push(from);
      } else {
        const data = await res.json();
        setError(data.error || 'Erro desconhecido.');
      }
    } catch {
      setError('Falha na conexão.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
         style={{ background: '#0a0a0a' }}>
      <div style={{
        background:    '#141414',
        border:        '1px solid rgba(197,163,104,0.18)',
        borderRadius:  '14px',
        padding:       '2.5rem 2rem',
        width:         '100%',
        maxWidth:      '380px',
      }}>
        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <span style={{
            display:      'inline-block',
            width:         '44px',
            height:        '44px',
            lineHeight:    '44px',
            borderRadius:  '50%',
            background:    'rgba(197,163,104,0.12)',
            color:         '#c5a368',
            fontWeight:    '700',
            fontSize:      '1.1rem',
          }}>
            LK
          </span>
          <p style={{ color: '#888', fontSize: '0.78rem', marginTop: '0.5rem', letterSpacing: '0.08em' }}>
            OUTREACH ENGINE — ADMIN
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', color: '#888', fontSize: '0.75rem',
                            letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
              Senha de acesso
            </label>
            <input
              type="password"
              value={secret}
              onChange={e => setSecret(e.target.value)}
              required
              autoFocus
              placeholder="••••••••"
              style={{
                width:         '100%',
                background:    '#1e1e1e',
                border:        '1px solid rgba(197,163,104,0.18)',
                borderRadius:  '8px',
                padding:       '0.7rem 0.9rem',
                color:         '#e8e8e8',
                fontSize:      '0.9rem',
                outline:       'none',
                boxSizing:     'border-box',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#e05c5c', fontSize: '0.82rem', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !secret}
            className="btn-gold"
            style={{ marginTop: '0.25rem', opacity: loading || !secret ? 0.6 : 1 }}
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
