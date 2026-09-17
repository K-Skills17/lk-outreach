'use client';

import { useState, useEffect, useRef } from 'react';

const LOCAL = 'http://localhost:8765';

type JobSummary = { id: string; script: string; niche: string; status: string; started_at: number; lines: number };

const SCRIPTS = [
  { id: 'scrape',   label: 'Scrape',    desc: 'Google Maps → prospects',        color: '#4a9eff' },
  { id: 'score',    label: 'Pontuar',   desc: 'Calcular score + tier A/B/C',     color: '#c5a368' },
  { id: 'outreach', label: 'Outreach',  desc: 'Enviar mensagens WhatsApp',        color: '#4caf7d' },
  { id: 'notify',   label: 'Notificar', desc: 'Alertar donos de leads novos',     color: '#a06cd5' },
  { id: 'billing',  label: 'Cobrança',  desc: 'Checar D+25/D+35 e cortar bots',  color: '#e05c5c' },
];

const STATUS_COLOR: Record<string, string> = {
  starting: '#c5a368', running: '#4caf7d',
  done: '#4caf7d', error: '#e05c5c', killed: '#e08c2c',
};

export default function RunnerClient() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [niches,    setNiches]    = useState<string[]>([]);
  const [jobs,      setJobs]      = useState<JobSummary[]>([]);

  // Form state
  const [selScript,  setSelScript]  = useState('outreach');
  const [selNiche,   setSelNiche]   = useState('oficinas');
  const [dryRun,     setDryRun]     = useState(false);
  const [phase,      setPhase]      = useState<string>('');
  const [tier,       setTier]       = useState<string>('');
  const [limit,      setLimit]      = useState<string>('');
  const [rescore,    setRescore]    = useState(false);

  // Scrape-specific state
  const [nicheCities,    setNicheCities]    = useState<string[]>([]);
  const [nicheTerms,     setNicheTerms]     = useState<string[]>([]);
  const [selCities,      setSelCities]      = useState<string[]>([]);
  const [selTerms,       setSelTerms]       = useState<string[]>([]);
  const [maxPerQuery,    setMaxPerQuery]    = useState<string>('');

  // Active job log
  const [activeJob,  setActiveJob]  = useState<string | null>(null);
  const [logLines,   setLogLines]   = useState<string[]>([]);
  const [jobStatus,  setJobStatus]  = useState<string>('');
  const logRef = useRef<HTMLDivElement>(null);

  // Connect to local server
  useEffect(() => {
    checkConnection();
    const t = setInterval(checkConnection, 5000);
    return () => clearInterval(t);
  }, []);

  // Load niche config when scrape is selected or niche changes
  useEffect(() => {
    if (selScript !== 'scrape') return;
    if (!connected) { setNicheCities([]); setNicheTerms([]); return; }
    fetch(`${LOCAL}/config/niche/${selNiche}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const cities: string[] = data?.scrape?.cities ?? [];
        const terms:  string[] = data?.scrape?.terms  ?? [];
        setNicheCities(cities);
        setNicheTerms(terms);
        setSelCities(cities);
        setSelTerms(terms);
      })
      .catch(() => {});
  }, [selScript, selNiche, connected]);

  // Auto-scroll logs
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [logLines]);

  async function checkConnection() {
    try {
      const r = await fetch(`${LOCAL}/status`, { signal: AbortSignal.timeout(2000) });
      if (!r.ok) throw new Error();
      const d = await r.json();
      setConnected(true);
      if (d.niches?.length) setNiches(d.niches);
      refreshJobs();
    } catch {
      setConnected(false);
    }
  }

  async function refreshJobs() {
    try {
      const r = await fetch(`${LOCAL}/jobs`);
      if (r.ok) setJobs(await r.json());
    } catch {}
  }

  async function runScript() {
    setLogLines([]);
    setJobStatus('starting');
    try {
      const body: Record<string, unknown> = { script: selScript, niche: selNiche, dry_run: dryRun };
      if (phase)  body.phase  = Number(phase);
      if (tier)   body.tier   = tier;
      if (limit)  body.limit  = Number(limit);
      if (rescore) body.rescore = true;
      if (selScript === 'scrape') {
        if (selCities.length && selCities.length < nicheCities.length)
          body.cities = selCities.join(',');
        if (selTerms.length && selTerms.length < nicheTerms.length)
          body.terms = selTerms.join(',');
        if (maxPerQuery) body.max_per_query = Number(maxPerQuery);
      }

      const r = await fetch(`${LOCAL}/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) { const e = await r.json(); setLogLines([`ERROR: ${e.error}`]); return; }
      const { job_id } = await r.json();
      setActiveJob(job_id);
      streamLogs(job_id);
      setTimeout(refreshJobs, 1000);
    } catch (e) {
      setLogLines([`Não foi possível conectar ao servidor local. Inicie local_server.py primeiro.`]);
    }
  }

  function streamLogs(jobId: string) {
    const es = new EventSource(`${LOCAL}/logs/${jobId}`);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.__done__) {
        setJobStatus(data.status);
        es.close();
        refreshJobs();
      } else if (data.line) {
        setLogLines(prev => [...prev, data.line]);
      }
    };
    es.onerror = () => { es.close(); setJobStatus('error'); };
  }

  async function killJob() {
    if (!activeJob) return;
    await fetch(`${LOCAL}/jobs/${activeJob}/kill`, { method: 'POST' });
    setJobStatus('killed');
  }

  const needsNiche  = selScript !== 'notify' && selScript !== 'billing';
  const needsPhase  = selScript === 'outreach';
  const showRescore = selScript === 'score';
  const isScrape    = selScript === 'scrape';

  function toggleCity(city: string) {
    setSelCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]);
  }
  function toggleTerm(term: string) {
    setSelTerms(prev => prev.includes(term) ? prev.filter(t => t !== term) : [...prev, term]);
  }

  const inputStyle: React.CSSProperties = {
    background: '#1e1b16', border: '1px solid rgba(197,163,104,0.15)',
    borderRadius: '7px', padding: '0.4rem 0.65rem',
    color: '#d8d2c4', fontSize: '0.82rem', outline: 'none',
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
  const checkRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#8a7f72', cursor: 'pointer' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#d8d2c4' }}>Runner</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: connected === null ? '#555' : connected ? '#4caf7d' : '#e05c5c',
            display: 'inline-block',
          }} />
          <span style={{ fontSize: '0.72rem', color: '#555' }}>
            {connected === null ? 'Verificando…' : connected ? 'Servidor local conectado' : 'Servidor local offline — inicie local_server.py'}
          </span>
        </div>
      </div>

      {/* Script selector cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem' }}>
        {SCRIPTS.map(s => (
          <button key={s.id} onClick={() => setSelScript(s.id)} style={{
            background:   selScript === s.id ? `${s.color}15` : '#161310',
            border:       `1px solid ${selScript === s.id ? s.color + '60' : 'rgba(255,255,255,0.05)'}`,
            borderRadius: '10px', padding: '0.75rem 0.85rem',
            textAlign: 'left', cursor: 'pointer',
          }}>
            <p style={{ color: s.color, fontWeight: 700, fontSize: '0.85rem', margin: '0 0 0.2rem' }}>{s.label}</p>
            <p style={{ color: '#555', fontSize: '0.68rem', margin: 0 }}>{s.desc}</p>
          </button>
        ))}
      </div>

      {/* Options + Run */}
      <div style={{ background: '#161310', border: '1px solid rgba(197,163,104,0.1)', borderRadius: '12px', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'flex-end' }}>

          {needsNiche && (
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Nicho</label>
              <select value={selNiche} onChange={e => setSelNiche(e.target.value)} style={selectStyle}>
                {(niches.length ? niches : ['oficinas']).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}

          {needsPhase && (
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Fase</label>
              <select value={phase} onChange={e => setPhase(e.target.value)} style={selectStyle}>
                <option value="">Todas</option>
                <option value="1">Fase 1 (D+0)</option>
                <option value="2">Fase 2 (D+2)</option>
                <option value="3">Fase 3 (D+4)</option>
              </select>
            </div>
          )}

          {needsPhase && (
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Tier</label>
              <select value={tier} onChange={e => setTier(e.target.value)} style={selectStyle}>
                <option value="">A + B</option>
                <option value="A">Apenas A</option>
                <option value="B">Apenas B</option>
              </select>
            </div>
          )}

          {needsPhase && (
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Limite</label>
              <input type="number" value={limit} onChange={e => setLimit(e.target.value)}
                placeholder="sem limite" style={{ ...inputStyle, width: '100px' }} />
            </div>
          )}

          {isScrape && (
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Máx por query</label>
              <input type="number" value={maxPerQuery} onChange={e => setMaxPerQuery(e.target.value)}
                placeholder="ilimitado" style={{ ...inputStyle, width: '110px' }} />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', paddingBottom: '0.15rem' }}>
            <label style={checkRow}>
              <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} />
              Dry-run (sem salvar)
            </label>
            {showRescore && (
              <label style={checkRow}>
                <input type="checkbox" checked={rescore} onChange={e => setRescore(e.target.checked)} />
                Re-pontuar existentes
              </label>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
            {activeJob && jobStatus === 'running' && (
              <button onClick={killJob} style={{
                background: 'none', border: '1px solid rgba(224,92,92,0.3)',
                borderRadius: '7px', padding: '0.5rem 0.85rem',
                color: '#e05c5c', fontSize: '0.82rem', cursor: 'pointer',
              }}>
                Parar
              </button>
            )}
            <button onClick={runScript} disabled={!connected || jobStatus === 'running'} style={{
              background:   !connected || jobStatus === 'running' ? '#2a2520' : '#c5a368',
              border:       'none', borderRadius: '8px', padding: '0.5rem 1.25rem',
              color:        !connected || jobStatus === 'running' ? '#555' : '#0c0b09',
              fontWeight:   700, fontSize: '0.85rem',
              cursor:       !connected || jobStatus === 'running' ? 'not-allowed' : 'pointer',
            }}>
              {jobStatus === 'running' ? 'Executando…' : 'Executar'}
            </button>
          </div>
        </div>
      </div>

      {/* Scrape: cities + terms selectors */}
      {isScrape && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {/* Cities */}
          <div style={{ background: '#161310', border: '1px solid rgba(197,163,104,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#8a7f72', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Cidades ({selCities.length}/{nicheCities.length})
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setSelCities(nicheCities)} style={{ background: 'none', border: 'none', color: '#555', fontSize: '0.65rem', cursor: 'pointer' }}>todas</button>
                <button onClick={() => setSelCities([])} style={{ background: 'none', border: 'none', color: '#555', fontSize: '0.65rem', cursor: 'pointer' }}>nenhuma</button>
              </div>
            </div>
            <div style={{ padding: '0.6rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '200px', overflowY: 'auto' }}>
              {!connected
                ? <span style={{ fontSize: '0.75rem', color: '#444', fontStyle: 'italic' }}>Conecte o servidor local para carregar cidades</span>
                : nicheCities.length === 0
                  ? <span style={{ fontSize: '0.75rem', color: '#444', fontStyle: 'italic' }}>Carregando…</span>
                  : nicheCities.map(city => (
                      <label key={city} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: selCities.includes(city) ? '#d8d2c4' : '#444', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selCities.includes(city)} onChange={() => toggleCity(city)} />
                        {city}
                      </label>
                    ))
              }
            </div>
          </div>

          {/* Terms */}
          <div style={{ background: '#161310', border: '1px solid rgba(197,163,104,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '0.6rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#8a7f72', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Termos ({selTerms.length}/{nicheTerms.length})
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => setSelTerms(nicheTerms)} style={{ background: 'none', border: 'none', color: '#555', fontSize: '0.65rem', cursor: 'pointer' }}>todos</button>
                <button onClick={() => setSelTerms([])} style={{ background: 'none', border: 'none', color: '#555', fontSize: '0.65rem', cursor: 'pointer' }}>nenhum</button>
              </div>
            </div>
            <div style={{ padding: '0.6rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '200px', overflowY: 'auto' }}>
              {!connected
                ? <span style={{ fontSize: '0.75rem', color: '#444', fontStyle: 'italic' }}>Conecte o servidor local para carregar termos</span>
                : nicheTerms.length === 0
                  ? <span style={{ fontSize: '0.75rem', color: '#444', fontStyle: 'italic' }}>Carregando…</span>
                  : nicheTerms.map(term => (
                      <label key={term} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: selTerms.includes(term) ? '#d8d2c4' : '#444', cursor: 'pointer' }}>
                        <input type="checkbox" checked={selTerms.includes(term)} onChange={() => toggleTerm(term)} />
                        {term}
                      </label>
                    ))
              }
            </div>
          </div>
        </div>
      )}

      {/* Live log terminal */}
      {logLines.length > 0 && (
        <div style={{ background: '#0c0b09', border: `1px solid ${STATUS_COLOR[jobStatus] ?? '#333'}40`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '0.5rem 0.85rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#555', fontFamily: 'monospace' }}>
              job {activeJob}
            </span>
            {jobStatus && (
              <span style={{ fontSize: '0.72rem', color: STATUS_COLOR[jobStatus] ?? '#888', fontWeight: 600 }}>
                ● {jobStatus}
              </span>
            )}
          </div>
          <div ref={logRef} style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: 1.7 }}>
            {logLines.map((line, i) => (
              <div key={i} style={{
                color: line.startsWith('[ERROR]') || line.includes('ERROR') ? '#e05c5c'
                     : line.startsWith('[') ? '#c5a368'
                     : '#8a9a8a',
              }}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Job history */}
      {jobs.length > 0 && (
        <div style={{ background: '#161310', border: '1px solid rgba(197,163,104,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '0.7rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '0.82rem', fontWeight: 600, margin: 0, color: '#8a7f72' }}>Histórico desta sessão</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <tbody>
                {jobs.map(j => (
                  <tr key={j.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                    onClick={() => { setActiveJob(j.id); setLogLines([]); streamLogs(j.id); }}>
                    <td style={{ padding: '0.5rem 1rem', color: '#555', fontFamily: 'monospace' }}>{j.id}</td>
                    <td style={{ padding: '0.5rem 0.5rem', color: '#d8d2c4', fontWeight: 600 }}>{j.script}</td>
                    <td style={{ padding: '0.5rem 0.5rem', color: '#555' }}>{j.niche}</td>
                    <td style={{ padding: '0.5rem 0.5rem' }}>
                      <span style={{ color: STATUS_COLOR[j.status] ?? '#888', fontWeight: 600 }}>● {j.status}</span>
                    </td>
                    <td style={{ padding: '0.5rem 1rem', color: '#444', textAlign: 'right' }}>
                      {new Date(j.started_at * 1000).toLocaleTimeString('pt-BR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Instructions if offline */}
      {connected === false && (
        <div style={{ background: 'rgba(224,92,92,0.05)', border: '1px solid rgba(224,92,92,0.15)', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <p style={{ color: '#e05c5c', fontWeight: 600, fontSize: '0.85rem', margin: '0 0 0.5rem' }}>Servidor local não encontrado</p>
          <p style={{ color: '#6b6456', fontSize: '0.78rem', margin: '0 0 0.75rem' }}>
            O Runner precisa do servidor local rodando na sua máquina. Execute:
          </p>
          <code style={{ display: 'block', background: '#0c0b09', borderRadius: '6px', padding: '0.6rem 0.85rem', color: '#c5a368', fontSize: '0.78rem' }}>
            python local_server.py
          </code>
          <p style={{ color: '#444', fontSize: '0.72rem', margin: '0.5rem 0 0' }}>
            Ou dê duplo clique em START.bat — ele inicia o servidor automaticamente.
          </p>
        </div>
      )}
    </div>
  );
}
