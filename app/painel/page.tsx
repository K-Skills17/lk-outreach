'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PainelLogin() {
  const router  = useRouter();
  const [phone,   setPhone]   = useState('');
  const [code,    setCode]    = useState('');
  const [step,    setStep]    = useState<'phone' | 'code'>('phone');
  const [notice,  setNotice]  = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  // Try localStorage first — skip login entirely if token exists.
  // ?expired=1 means the saved token was rejected: forget it and show the form.
  useEffect(() => {
    const expired = new URLSearchParams(window.location.search).has('expired');
    if (expired) {
      localStorage.removeItem('lk_painel_token');
      setError('Sessão expirada. Digite seu telefone novamente.');
    }
    const saved = expired ? null : localStorage.getItem('lk_painel_token');
    if (saved) {
      router.replace(`/painel/${encodeURIComponent(saved)}`);
    } else {
      setChecked(true);
    }
  }, [router]);

  async function post(url: string, payload: object): Promise<{ ok: boolean; data: Record<string, string> }> {
    const res  = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }

  // Step 1: ask for a WhatsApp code
  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Digite um número válido com DDD.'); return; }
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const { ok, data } = await post('/api/painel/login', { phone: digits });
      if (!ok) { setError(data.error ?? 'Erro ao enviar o código. Tente novamente.'); return; }
      setCode('');
      setStep('code');
      setNotice('Se este número estiver cadastrado, você receberá um código no WhatsApp.');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Step 2: exchange the code for the dashboard token
  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) { setError('O código tem 6 dígitos.'); return; }
    setLoading(true);
    setError(null);
    try {
      const { ok, data } = await post('/api/painel/verify', { phone: phone.replace(/\D/g, ''), code: digits });
      if (!ok || !data.token) { setError(data.error ?? 'Código inválido ou expirado.'); return; }
      localStorage.setItem('lk_painel_token', data.token);
      router.replace(`/painel/${encodeURIComponent(data.token)}`);
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const label: React.CSSProperties = {
    display:       'block',
    fontSize:      '0.68rem',
    color:         '#6b6456',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom:  '0.4rem',
  };
  const input: React.CSSProperties = {
    width:         '100%',
    boxSizing:     'border-box',
    background:    '#1e1b16',
    border:        `1px solid ${error ? 'rgba(224,92,92,0.4)' : 'rgba(197,163,104,0.15)'}`,
    borderRadius:  '8px',
    padding:       '0.65rem 0.85rem',
    color:         '#d8d2c4',
    fontSize:      '1rem',
    outline:       'none',
    letterSpacing: '0.05em',
    marginBottom:  '1rem',
  };
  const linkBtn: React.CSSProperties = {
    background: 'none', border: 'none', padding: 0,
    color: '#6b6456', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline',
  };

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
            {step === 'phone'
              ? 'Digite o telefone cadastrado para receber um código no WhatsApp'
              : `Digite o código enviado para ${phone}`}
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background:   '#161310',
          border:       '1px solid rgba(197,163,104,0.12)',
          borderRadius: '14px',
          padding:      '1.75rem',
        }}>
          <form onSubmit={step === 'phone' ? requestCode : verifyCode}>
            {step === 'phone' ? (
              <>
                <label style={label}>Telefone (com DDD)</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="11999887766"
                  autoFocus
                  style={input}
                />
              </>
            ) : (
              <>
                <label style={label}>Código de 6 dígitos</label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  style={{ ...input, letterSpacing: '0.4em', textAlign: 'center' }}
                />
              </>
            )}

            {notice && !error && (
              <p style={{ color: '#8a7f72', fontSize: '0.75rem', margin: '-0.5rem 0 0.85rem' }}>
                {notice}
              </p>
            )}
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
              {loading
                ? (step === 'phone' ? 'Enviando…' : 'Verificando…')
                : (step === 'phone' ? 'Receber código' : 'Acessar painel')}
            </button>

            {step === 'code' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.9rem' }}>
                <button type="button" style={linkBtn} disabled={loading}
                  onClick={() => { setStep('phone'); setError(null); setNotice(null); }}>
                  Trocar número
                </button>
                <button type="button" style={linkBtn} disabled={loading} onClick={() => requestCode()}>
                  Reenviar código
                </button>
              </div>
            )}
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#3a3530', marginTop: '1.5rem' }}>
          LK Digital · Acesso restrito a clientes
        </p>
      </div>
    </div>
  );
}
