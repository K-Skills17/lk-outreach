'use client';

import { useEffect, useState } from 'react';

type Flag = { enabled: boolean; updated_at: string | null };

type NicheRow = {
  niche:       string;
  total:       number;
  with_phone:  number;
  scored:      number;
  ready:       number;
  last_scraped: string | null;
};

export default function ScraperPage() {
  const [flag,        setFlag]        = useState<Flag | null>(null);
  const [niches,      setNiches]      = useState<NicheRow[]>([]);
  const [acting,      setActing]      = useState(false);
  const [lastAction,  setLastAction]  = useState<string | null>(null);

  async function load() {
    const [f, n] = await Promise.all([
      fetch('/api/admin/scraper').then(r => r.json()),
      fetch('/api/admin/scraper/progress').then(r => r.json()),
    ]);
    setFlag(f);
    setNiches(n.niches ?? []);
  }

  useEffect(() => { load(); }, []);

  async function toggle(action: 'stop' | 'start') {
    setActing(true);
    try {
      const res = await fetch('/api/admin/scraper', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action }),
      });
      const data = await res.json();
      setFlag({ enabled: data.enabled, updated_at: new Date().toISOString() });
      setLastAction(action === 'stop' ? 'Scraper parado. Será interrompido antes da próxima query.' : 'Scraper liberado.');
      setTimeout(() => setLastAction(null), 5000);
    } finally {
      setActing(false);
    }
  }

  const card: React.CSSProperties = {
    background:   '#161310',
    border:       '1px solid rgba(197,163,104,0.1)',
    borderRadius: '12px',
    overflow:     'hidden',
    marginBottom: '1.5rem',
  };

  const isRunning = flag?.enabled !== false;

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e8e8e8', margin: '0 0 0.25rem' }}>
          Controle do Scraper
        </h1>
        <p style={{ fontSize: '0.78rem', color: '#555', margin: 0 }}>
          O scraper verifica este flag antes de cada query. Stop é graceful — termina a query atual e para na próxima.
        </p>
      </div>

      {/* ── Stop / Start control ── */}
      <section style={card}>
        <div style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>

          {/* Status badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '10px', height: '10px', borderRadius: '50%',
              background: isRunning ? '#4caf7d' : '#e05c5c',
              boxShadow: isRunning ? '0 0 6px #4caf7d88' : '0 0 6px #e05c5c88',
            }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: isRunning ? '#4caf7d' : '#e05c5c' }}>
              {flag === null ? 'Carregando…' : isRunning ? 'Liberado' : 'Parado'}
            </span>
          </div>

          {/* Toggle button */}
          {flag !== null && (
            isRunning ? (
              <button
                onClick={() => toggle('stop')}
                disabled={acting}
                style={{
                  background:   acting ? '#1a1a1a' : 'rgba(224,92,92,0.12)',
                  border:       `1px solid ${acting ? 'rgba(255,255,255,0.04)' : 'rgba(224,92,92,0.35)'}`,
                  borderRadius: '8px',
                  padding:      '0.45rem 1.1rem',
                  color:        acting ? '#444' : '#e05c5c',
                  fontWeight:   700,
                  fontSize:     '0.82rem',
                  cursor:       acting ? 'not-allowed' : 'pointer',
                }}
              >
                {acting ? 'Parando…' : 'Parar Scraper'}
              </button>
            ) : (
              <button
                onClick={() => toggle('start')}
                disabled={acting}
                style={{
                  background:   acting ? '#1a1a1a' : 'rgba(76,175,125,0.12)',
                  border:       `1px solid ${acting ? 'rgba(255,255,255,0.04)' : 'rgba(76,175,125,0.35)'}`,
                  borderRadius: '8px',
                  padding:      '0.45rem 1.1rem',
                  color:        acting ? '#444' : '#4caf7d',
                  fontWeight:   700,
                  fontSize:     '0.82rem',
                  cursor:       acting ? 'not-allowed' : 'pointer',
                }}
              >
                {acting ? 'Liberando…' : 'Liberar Scraper'}
              </button>
            )
          )}

          {/* Feedback */}
          {lastAction && (
            <span style={{ fontSize: '0.75rem', color: '#888' }}>{lastAction}</span>
          )}

          {/* Last change timestamp */}
          {flag?.updated_at && (
            <span style={{ fontSize: '0.72rem', color: '#444', marginLeft: 'auto' }}>
              Última alteração: {new Date(flag.updated_at).toLocaleString('pt-BR')}
            </span>
          )}
        </div>

        <div style={{ padding: '0.65rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.15)' }}>
          <p style={{ fontSize: '0.72rem', color: '#444', margin: 0 }}>
            O scraper verifica o flag antes de iniciar cada nova query (city × term). A query em andamento sempre termina antes de parar.
            Para retomar, clique "Liberar Scraper" e reinicie o processo localmente.
          </p>
        </div>
      </section>

      {/* ── Niche progress ── */}
      <section style={card}>
        <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>Progresso por nicho</h2>
          <button
            onClick={load}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', padding: '0.25rem 0.65rem', color: '#555', fontSize: '0.72rem', cursor: 'pointer' }}
          >
            Atualizar
          </button>
        </div>

        {niches.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: '#444', fontSize: '0.82rem' }}>
            Nenhum prospecto scrapeado ainda.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Nicho', 'Total', 'Com telefone', 'Pontuados', 'Prontos (new)', 'Último scrape'].map(h => (
                  <th key={h} style={{ padding: '0.5rem 0.85rem', textAlign: h === 'Nicho' ? 'left' : 'right', fontSize: '0.7rem', color: '#555', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {niches.map(r => (
                <tr key={r.niche}>
                  <td style={{ padding: '0.55rem 0.85rem', fontSize: '0.82rem', color: '#c5a368', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    {r.niche}
                  </td>
                  <td style={{ padding: '0.55rem 0.85rem', fontSize: '0.82rem', color: '#aaa', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{r.total}</td>
                  <td style={{ padding: '0.55rem 0.85rem', fontSize: '0.82rem', color: '#aaa', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{r.with_phone}</td>
                  <td style={{ padding: '0.55rem 0.85rem', fontSize: '0.82rem', color: '#aaa', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{r.scored}</td>
                  <td style={{ padding: '0.55rem 0.85rem', fontSize: '0.82rem', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.03)', color: r.ready > 0 ? '#4caf7d' : '#555' }}>
                    {r.ready}
                  </td>
                  <td style={{ padding: '0.55rem 0.85rem', fontSize: '0.75rem', color: '#555', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    {r.last_scraped ? new Date(r.last_scraped).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── CLI reference ── */}
      <section style={card}>
        <div style={{ padding: '1rem 1.25rem' }}>
          <h3 style={{ fontSize: '0.78rem', fontWeight: 600, color: '#888', margin: '0 0 0.75rem' }}>Iniciar scrape</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {[
              ['Scrape completo de um nicho', 'python batch_scrape.py --niche moveis-planejados'],
              ['Cidades específicas', 'python batch_scrape.py --niche moveis-planejados --cities "São Paulo,Campinas"'],
              ['Limitar resultados por query', 'python batch_scrape.py --niche moveis-planejados --max-per-query 30'],
              ['Dry run (sem gravar no DB)', 'python batch_scrape.py --niche moveis-planejados --dry-run'],
            ].map(([label, cmd]) => (
              <div key={cmd} style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                <span style={{ fontSize: '0.68rem', color: '#444' }}>{label}</span>
                <code style={{ fontSize: '0.72rem', color: '#888', background: '#111', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '5px', padding: '0.25rem 0.65rem' }}>
                  {cmd}
                </code>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
