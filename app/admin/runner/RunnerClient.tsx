'use client';

import { useState, useEffect, useRef } from 'react';

const LOCAL = 'http://localhost:8765';

type JobSummary = { id: string; script: string; niche: string; status: string; started_at: number; lines: number };

const SCRIPTS = [
  { id: 'scrape',          label: 'Scrape',       desc: 'Google Maps → prospects',                 color: '#4a9eff' },
  { id: 'score',           label: 'Pontuar',       desc: 'Calcular score + tier A/B/C',             color: '#c5a368' },
  { id: 'slug',            label: 'Slugs',         desc: 'Gerar links de auditoria',                color: '#e08c2c' },
  { id: 'outreach',        label: 'Outreach',      desc: 'Enviar mensagens WhatsApp',               color: '#4caf7d' },
  { id: 'watch',           label: 'Respostas',     desc: 'Checar respostas + enviar booking',       color: '#2196f3' },
  { id: 'notify_booking',  label: 'Agendamentos',  desc: 'Notificar dono de novos agendamentos',    color: '#00bcd4' },
  { id: 'remind_booking',  label: 'Lembretes',     desc: 'WhatsApp de lembrete para quem agendou',  color: '#009688' },
  { id: 'notify',          label: 'Notificar',     desc: 'Alertar donos de leads novos',            color: '#a06cd5' },
  { id: 'billing',         label: 'Cobrança',      desc: 'Checar D+25/D+35 e cortar bots',          color: '#e05c5c' },
];

const STATUS_COLOR: Record<string, string> = {
  starting: '#c5a368', running: '#4caf7d',
  done: '#4caf7d', error: '#e05c5c', killed: '#e08c2c',
};

// ---------------------------------------------------------------------------
// All 27 Brazilian states with major cities
// ---------------------------------------------------------------------------
const BR_STATES: { uf: string; name: string; cities: string[] }[] = [
  { uf: 'AC', name: 'Acre',                cities: ['Rio Branco', 'Cruzeiro do Sul'] },
  { uf: 'AL', name: 'Alagoas',             cities: ['Maceió', 'Arapiraca', 'Palmeira dos Índios'] },
  { uf: 'AM', name: 'Amazonas',            cities: ['Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru'] },
  { uf: 'AP', name: 'Amapá',               cities: ['Macapá', 'Santana'] },
  { uf: 'BA', name: 'Bahia',               cities: ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Juazeiro', 'Ilhéus', 'Lauro de Freitas', 'Jequié', 'Barreiras', 'Alagoinhas'] },
  { uf: 'CE', name: 'Ceará',               cities: ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral', 'Crato', 'Maranguape'] },
  { uf: 'DF', name: 'Distrito Federal',    cities: ['Brasília', 'Taguatinga', 'Ceilândia', 'Samambaia', 'Gama', 'Águas Claras', 'Guará', 'Sobradinho'] },
  { uf: 'ES', name: 'Espírito Santo',      cities: ['Vitória', 'Serra', 'Vila Velha', 'Cariacica', 'Cachoeiro de Itapemirim', 'Linhares', 'São Mateus'] },
  { uf: 'GO', name: 'Goiás',               cities: ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia', 'Águas Lindas de Goiás', 'Valparaíso de Goiás', 'Trindade', 'Formosa'] },
  { uf: 'MA', name: 'Maranhão',            cities: ['São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias', 'Paço do Lumiar', 'Açailândia'] },
  { uf: 'MG', name: 'Minas Gerais',        cities: ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros', 'Ribeirão das Neves', 'Uberaba', 'Governador Valadares', 'Ipatinga', 'Sete Lagoas', 'Divinópolis', 'Poços de Caldas'] },
  { uf: 'MS', name: 'Mato Grosso do Sul',  cities: ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã'] },
  { uf: 'MT', name: 'Mato Grosso',         cities: ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra', 'Sorriso', 'Lucas do Rio Verde'] },
  { uf: 'PA', name: 'Pará',                cities: ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Castanhal', 'Parauapebas', 'Altamira'] },
  { uf: 'PB', name: 'Paraíba',             cities: ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux', 'Sousa'] },
  { uf: 'PE', name: 'Pernambuco',          cities: ['Recife', 'Caruaru', 'Olinda', 'Jaboatão dos Guararapes', 'Petrolina', 'Paulista', 'Cabo de Santo Agostinho', 'Garanhuns'] },
  { uf: 'PI', name: 'Piauí',               cities: ['Teresina', 'Parnaíba', 'Picos', 'Floriano'] },
  { uf: 'PR', name: 'Paraná',              cities: ['Curitiba', 'Londrina', 'Maringá', 'Foz do Iguaçu', 'Cascavel', 'Ponta Grossa', 'São José dos Pinhais', 'Colombo', 'Guarapuava', 'Paranaguá'] },
  { uf: 'RJ', name: 'Rio de Janeiro',      cities: ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Belford Roxo', 'Niterói', 'Campos dos Goytacazes', 'Petrópolis', 'Volta Redonda', 'Macaé'] },
  { uf: 'RN', name: 'Rio Grande do Norte', cities: ['Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Caicó', 'Macaíba'] },
  { uf: 'RO', name: 'Rondônia',            cities: ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal'] },
  { uf: 'RR', name: 'Roraima',             cities: ['Boa Vista', 'Rorainópolis'] },
  { uf: 'RS', name: 'Rio Grande do Sul',   cities: ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Santa Maria', 'Canoas', 'Novo Hamburgo', 'Passo Fundo', 'Gravataí', 'Viamão', 'São Leopoldo', 'Rio Grande'] },
  { uf: 'SC', name: 'Santa Catarina',      cities: ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Criciúma', 'Chapecó', 'Itajaí', 'Lages', 'Jaraguá do Sul', 'Palhoça', 'Balneário Camboriú'] },
  { uf: 'SE', name: 'Sergipe',             cities: ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana'] },
  { uf: 'SP', name: 'São Paulo',           cities: ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André', 'Osasco', 'Ribeirão Preto', 'Sorocaba', 'Santos', 'Mogi das Cruzes', 'São José dos Campos', 'Mauá', 'Carapicuíba', 'Diadema', 'Jundiaí', 'Piracicaba', 'Bauru', 'São Vicente', 'Franca', 'Limeira', 'Taubaté', 'Suzano', 'Praia Grande', 'Barueri', 'Itaquaquecetuba', 'Marília', 'Presidente Prudente', 'Americana'] },
  { uf: 'TO', name: 'Tocantins',           cities: ['Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional'] },
];

// ---------------------------------------------------------------------------
// Dental search terms
// ---------------------------------------------------------------------------
const DENTAL_TERMS = [
  'clínica odontológica',
  'dentista',
  'implante dentário',
  'facetas dentárias',
  'lente de contato dental',
  'clareamento dental',
  'ortodontia',
  'aparelho dentário',
  'prótese dentária',
  'cirurgião dentista',
  'odontologia estética',
  'implante dental',
  'clínica de implantes',
  'dentista implante',
  'odontologia',
  'periodontia',
  'endodontia',
  'odontopediatria',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getCitiesForStates(ufs: string[]): string[] {
  const result: string[] = [];
  ufs.forEach(uf => {
    const st = BR_STATES.find(s => s.uf === uf);
    if (st) st.cities.forEach(c => { if (!result.includes(c)) result.push(c); });
  });
  return result;
}

type SenderFlag = { enabled: boolean; updated_at: string | null };

export default function RunnerClient() {
  const [connected,    setConnected]    = useState<boolean | null>(null);
  const niches = ['odontologia-implantes'];
  const [jobs,         setJobs]         = useState<JobSummary[]>([]);
  const [sender,       setSender]       = useState<SenderFlag | null>(null);
  const [senderActing, setSenderActing] = useState(false);

  // Form state
  const [selScript,  setSelScript]  = useState('outreach');
  const [selNiche,   setSelNiche]   = useState('odontologia-implantes');
  const [selNumber,  setSelNumber]  = useState('');
  const [dryRun,     setDryRun]     = useState(false);
  const [phase,      setPhase]      = useState<string>('');
  const [tier,       setTier]       = useState<string>('');
  const [limit,      setLimit]      = useState<string>('');
  const [rescore,    setRescore]    = useState(false);
  const [maxPerQuery, setMaxPerQuery] = useState<string>('');

  // Scrape: states drive cities; extraCities are manually added
  const [selStates,   setSelStates]   = useState<string[]>([]);
  const [extraCities, setExtraCities] = useState<string[]>([]);
  const [cityInput,   setCityInput]   = useState('');

  // Terms: dental terms toggled + extra manual
  const [selTerms,  setSelTerms]  = useState<string[]>([]);
  const [termInput, setTermInput] = useState('');

  // Derived cities = state cities + extra (deduped)
  const stateCities = getCitiesForStates(selStates);
  const allCities   = [...stateCities, ...extraCities.filter(c => !stateCities.includes(c))];

  // Active job
  const [activeJob,  setActiveJob]  = useState<string | null>(null);
  const [logLines,   setLogLines]   = useState<string[]>([]);
  const [jobStatus,  setJobStatus]  = useState<string>('');
  const logRef = useRef<HTMLDivElement>(null);
  const esRef  = useRef<EventSource | null>(null);

  // Auto-load all dental terms when scrape is selected
  useEffect(() => {
    if (selScript === 'scrape' && selTerms.length === 0) {
      setSelTerms([...DENTAL_TERMS]);
    }
  }, [selScript]);

  useEffect(() => {
    checkConnection();
    loadSender();
    const t = setInterval(checkConnection, 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [logLines]);

  async function loadSender() {
    const res = await fetch('/api/admin/sender');
    if (res.ok) setSender(await res.json());
  }

  async function toggleSender(action: 'stop' | 'start') {
    setSenderActing(true);
    try {
      const res = await fetch('/api/admin/sender', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) setSender(await res.json());
    } finally { setSenderActing(false); }
  }

  async function checkConnection() {
    try {
      const r = await fetch(`${LOCAL}/status`, { signal: AbortSignal.timeout(2000) });
      if (!r.ok) throw new Error();
      setConnected(true);
      refreshJobs();
    } catch { setConnected(false); }
  }

  async function refreshJobs() {
    try {
      const r = await fetch(`${LOCAL}/jobs`);
      if (r.ok) setJobs(await r.json());
    } catch {}
  }

  async function runScript() {
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    setLogLines([]);
    setJobStatus('running');
    try {
      const body: Record<string, unknown> = { script: selScript, niche: selNiche, dry_run: dryRun };
      if (phase)     body.phase   = Number(phase);
      if (tier)      body.tier    = tier;
      if (limit)     body.limit   = Number(limit);
      if (rescore)   body.rescore = true;
      if (selNumber) body.number  = selNumber;
      if (selScript === 'scrape') {
        if (allCities.length) body.cities        = allCities.join(',');
        if (selTerms.length)  body.terms         = selTerms.join(',');
        if (maxPerQuery)      body.max_per_query = Number(maxPerQuery);
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
    } catch {
      setLogLines([`Não foi possível conectar ao servidor local. Inicie local_server.py primeiro.`]);
    }
  }

  function streamLogs(jobId: string) {
    if (esRef.current) { esRef.current.close(); }
    const es = new EventSource(`${LOCAL}/logs/${jobId}`);
    esRef.current = es;
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.__done__) {
        setJobStatus(data.status); es.close(); esRef.current = null; refreshJobs();
      } else if (data.line) {
        setJobStatus(s => s === '' ? 'running' : s);
        setLogLines(prev => [...prev, data.line]);
      }
    };
    es.onerror = () => {
      es.close(); esRef.current = null;
      setJobStatus(s => (s === 'running' || s === '') ? 'error' : s);
    };
  }

  async function killJob() {
    if (!activeJob) return;
    await fetch(`${LOCAL}/jobs/${activeJob}/kill`, { method: 'POST' });
    setJobStatus('killed');
  }

  function toggleState(uf: string) {
    setSelStates(prev =>
      prev.includes(uf) ? prev.filter(s => s !== uf) : [...prev, uf]
    );
  }

  function toggleTerm(term: string) {
    setSelTerms(prev =>
      prev.includes(term) ? prev.filter(t => t !== term) : [...prev, term]
    );
  }

  function addExtraCity(value: string) {
    const v = value.trim();
    if (v && !allCities.includes(v)) setExtraCities(prev => [...prev, v]);
    setCityInput('');
  }

  function removeCity(city: string) {
    // If it's from a state, deselect that state's cities by adding to a blocklist?
    // Simpler: just add to extraCities as-is and remove from extra if manually added
    if (extraCities.includes(city)) {
      setExtraCities(prev => prev.filter(c => c !== city));
    } else {
      // city comes from a state — remove by adding it to an exclusion list
      setExtraCities(prev => [`__excl__${city}`, ...prev]);
    }
  }

  // Handle state-sourced city exclusions
  const excluded = extraCities.filter(c => c.startsWith('__excl__')).map(c => c.slice(8));
  const visibleCities = allCities.filter(c => !excluded.includes(c));

  function handleCityKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addExtraCity(cityInput); }
    if (e.key === 'Backspace' && !cityInput && extraCities.filter(c => !c.startsWith('__excl__')).length) {
      setExtraCities(prev => prev.slice(0, -1));
    }
  }

  function addExtraTerm(value: string) {
    const v = value.trim();
    if (v && !selTerms.includes(v)) setSelTerms(prev => [...prev, v]);
    setTermInput('');
  }

  function handleTermKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addExtraTerm(termInput); }
  }

  const needsNiche  = selScript !== 'notify' && selScript !== 'billing';
  const needsPhase  = selScript === 'outreach';
  const showRescore = selScript === 'score';
  const isScrape    = selScript === 'scrape';

  const inputStyle: React.CSSProperties = {
    background: '#1e1b16', border: '1px solid rgba(197,163,104,0.15)',
    borderRadius: '7px', padding: '0.4rem 0.65rem',
    color: '#d8d2c4', fontSize: '0.82rem', outline: 'none',
  };
  const selectStyle: React.CSSProperties = { ...inputStyle, cursor: 'pointer' };
  const checkRow: React.CSSProperties    = { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#8a7f72', cursor: 'pointer' };
  const tagStyle: React.CSSProperties   = { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(197,163,104,0.12)', border: '1px solid rgba(197,163,104,0.25)', borderRadius: '5px', padding: '0.15rem 0.5rem', fontSize: '0.74rem', color: '#c5a368' };
  const tagBtn: React.CSSProperties     = { background: 'none', border: 'none', color: '#7a6a50', cursor: 'pointer', fontSize: '0.7rem', padding: 0, lineHeight: 1 };
  const panelBox: React.CSSProperties   = { border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', overflow: 'hidden' };
  const panelHdr: React.CSSProperties   = { padding: '0.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' };
  const panelLbl: React.CSSProperties   = { fontSize: '0.68rem', fontWeight: 600, color: '#8a7f72', textTransform: 'uppercase', letterSpacing: '0.06em' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#d8d2c4' }}>Runner</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', display: 'inline-block',
            background: connected === null ? '#555' : connected ? '#4caf7d' : '#e05c5c' }} />
          <span style={{ fontSize: '0.72rem', color: '#555' }}>
            {connected === null ? 'Verificando…' : connected ? 'Servidor local conectado' : 'Servidor local offline — inicie local_server.py'}
          </span>
        </div>
      </div>

      {/* Sender kill switch */}
      {sender !== null && (
        <div style={{ background: '#161310', border: `1px solid ${sender.enabled ? 'rgba(76,175,125,0.15)' : 'rgba(224,92,92,0.2)'}`, borderRadius: '10px', padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: sender.enabled ? '#4caf7d' : '#e05c5c', boxShadow: sender.enabled ? '0 0 5px #4caf7d88' : '0 0 5px #e05c5c88' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: sender.enabled ? '#4caf7d' : '#e05c5c' }}>
              Outreach {sender.enabled ? 'liberado' : 'pausado'}
            </span>
          </div>
          {sender.enabled ? (
            <button onClick={() => toggleSender('stop')} disabled={senderActing} style={{ background: 'rgba(224,92,92,0.1)', border: '1px solid rgba(224,92,92,0.3)', borderRadius: '6px', padding: '0.3rem 0.85rem', color: senderActing ? '#444' : '#e05c5c', fontSize: '0.78rem', fontWeight: 700, cursor: senderActing ? 'not-allowed' : 'pointer' }}>
              {senderActing ? 'Parando…' : 'Parar Outreach'}
            </button>
          ) : (
            <button onClick={() => toggleSender('start')} disabled={senderActing} style={{ background: 'rgba(76,175,125,0.1)', border: '1px solid rgba(76,175,125,0.3)', borderRadius: '6px', padding: '0.3rem 0.85rem', color: senderActing ? '#444' : '#4caf7d', fontSize: '0.78rem', fontWeight: 700, cursor: senderActing ? 'not-allowed' : 'pointer' }}>
              {senderActing ? 'Liberando…' : 'Liberar Outreach'}
            </button>
          )}
          <span style={{ fontSize: '0.68rem', color: '#3a3a3a', marginLeft: 'auto' }}>
            Para o envio antes da próxima mensagem (graceful stop)
          </span>
        </div>
      )}

      {/* Script cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.6rem' }}>
        {SCRIPTS.map(s => (
          <button key={s.id} onClick={() => setSelScript(s.id)} style={{
            background: selScript === s.id ? `${s.color}15` : '#161310',
            border: `1px solid ${selScript === s.id ? s.color + '60' : 'rgba(255,255,255,0.05)'}`,
            borderRadius: '10px', padding: '0.75rem 0.85rem', textAlign: 'left', cursor: 'pointer',
          }}>
            <p style={{ color: s.color, fontWeight: 700, fontSize: '0.85rem', margin: '0 0 0.2rem' }}>{s.label}</p>
            <p style={{ color: '#555', fontSize: '0.68rem', margin: 0 }}>{s.desc}</p>
          </button>
        ))}
      </div>

      {/* Options panel */}
      <div style={{ background: '#161310', border: '1px solid rgba(197,163,104,0.1)', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Shared controls row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'flex-end' }}>
          {needsNiche && (
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Nicho</label>
              <select value={selNiche} onChange={e => setSelNiche(e.target.value)} style={selectStyle}>
                {niches.map(n => <option key={n} value={n}>{n}</option>)}
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
          {needsPhase && (
            <div>
              <label style={{ display: 'block', fontSize: '0.65rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Número</label>
              <select value={selNumber} onChange={e => setSelNumber(e.target.value)} style={selectStyle}>
                <option value="">Auto</option>
                <option value="number_1">number_1</option>
                <option value="number_2">number_2</option>
              </select>
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
        </div>

        {/* ── Scrape: states → cities + terms ── */}
        {isScrape && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            {/* Row 1: States selector (full width) */}
            <div style={panelBox}>
              <div style={panelHdr}>
                <span style={panelLbl}>Estados — {selStates.length} selecionado{selStates.length !== 1 ? 's' : ''}</span>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    onClick={() => setSelStates(BR_STATES.map(s => s.uf))}
                    style={{ background: 'none', border: 'none', color: '#c5a368', fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    + Todos
                  </button>
                  <button
                    onClick={() => setSelStates([])}
                    style={{ background: 'none', border: 'none', color: '#555', fontSize: '0.65rem', cursor: 'pointer' }}
                  >
                    Limpar
                  </button>
                </div>
              </div>
              <div style={{ padding: '0.6rem 0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.3rem' }}>
                {BR_STATES.map(s => {
                  const active = selStates.includes(s.uf);
                  return (
                    <label key={s.uf} style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.3rem 0.5rem', borderRadius: '5px', cursor: 'pointer',
                      background: active ? 'rgba(197,163,104,0.1)' : 'transparent',
                      border: `1px solid ${active ? 'rgba(197,163,104,0.25)' : 'transparent'}`,
                    }}>
                      <input
                        type="checkbox"
                        checked={active}
                        onChange={() => toggleState(s.uf)}
                        style={{ accentColor: '#c5a368', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.76rem', color: active ? '#c5a368' : '#666', fontWeight: active ? 600 : 400 }}>
                        {s.uf}
                      </span>
                      <span style={{ fontSize: '0.68rem', color: active ? '#8a7050' : '#3a3a3a' }}>
                        {s.name.split(' ')[0]}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Cities + Terms side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>

              {/* Cities */}
              <div style={panelBox}>
                <div style={panelHdr}>
                  <span style={panelLbl}>Cidades — {visibleCities.length}</span>
                  <button
                    onClick={() => { setSelStates([]); setExtraCities([]); }}
                    style={{ background: 'none', border: 'none', color: '#555', fontSize: '0.65rem', cursor: 'pointer' }}
                  >
                    limpar tudo
                  </button>
                </div>
                <div style={{ padding: '0.5rem 0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem', minHeight: '44px', maxHeight: '180px', overflowY: 'auto' }}>
                  {visibleCities.length === 0 ? (
                    <span style={{ fontSize: '0.74rem', color: '#3a3a3a', alignSelf: 'center' }}>
                      Selecione estados acima para adicionar cidades
                    </span>
                  ) : visibleCities.map(city => (
                    <span key={city} style={tagStyle}>
                      {city}
                      <button onClick={() => removeCity(city)} style={tagBtn}>✕</button>
                    </span>
                  ))}
                </div>
                <div style={{ padding: '0.35rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <input
                    value={cityInput}
                    onChange={e => setCityInput(e.target.value)}
                    onKeyDown={handleCityKey}
                    onBlur={() => cityInput.trim() && addExtraCity(cityInput)}
                    placeholder="Adicionar cidade extra — Enter"
                    style={{ ...inputStyle, width: '100%', fontSize: '0.76rem', padding: '0.3rem 0.5rem' }}
                  />
                </div>
              </div>

              {/* Terms */}
              <div style={panelBox}>
                <div style={panelHdr}>
                  <span style={panelLbl}>Termos de busca — {selTerms.length}</span>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    <button
                      onClick={() => setSelTerms([...DENTAL_TERMS])}
                      style={{ background: 'none', border: 'none', color: '#c5a368', fontSize: '0.65rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      + todos
                    </button>
                    <button
                      onClick={() => setSelTerms([])}
                      style={{ background: 'none', border: 'none', color: '#555', fontSize: '0.65rem', cursor: 'pointer' }}
                    >
                      limpar
                    </button>
                  </div>
                </div>

                {/* Term chips — toggle on/off */}
                <div style={{ padding: '0.5rem 0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {DENTAL_TERMS.map(term => {
                    const active = selTerms.includes(term);
                    return (
                      <button
                        key={term}
                        onClick={() => toggleTerm(term)}
                        style={{
                          background: active ? 'rgba(197,163,104,0.15)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${active ? 'rgba(197,163,104,0.4)' : 'rgba(255,255,255,0.07)'}`,
                          borderRadius: '5px', padding: '0.18rem 0.55rem',
                          color: active ? '#c5a368' : '#555',
                          fontSize: '0.72rem', cursor: 'pointer',
                        }}
                      >
                        {term}
                      </button>
                    );
                  })}
                </div>

                {/* Extra terms added manually */}
                {selTerms.filter(t => !DENTAL_TERMS.includes(t)).length > 0 && (
                  <div style={{ padding: '0.4rem 0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.3rem', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    {selTerms.filter(t => !DENTAL_TERMS.includes(t)).map(term => (
                      <span key={term} style={tagStyle}>
                        {term}
                        <button onClick={() => toggleTerm(term)} style={tagBtn}>✕</button>
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ padding: '0.35rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <input
                    value={termInput}
                    onChange={e => setTermInput(e.target.value)}
                    onKeyDown={handleTermKey}
                    onBlur={() => termInput.trim() && addExtraTerm(termInput)}
                    placeholder="Adicionar termo extra — Enter"
                    style={{ ...inputStyle, width: '100%', fontSize: '0.76rem', padding: '0.3rem 0.5rem' }}
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Run button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.85rem' }}>
          {activeJob && jobStatus === 'running' && (
            <button onClick={killJob} style={{ background: 'none', border: '1px solid rgba(224,92,92,0.3)', borderRadius: '7px', padding: '0.5rem 0.85rem', color: '#e05c5c', fontSize: '0.82rem', cursor: 'pointer' }}>
              Parar
            </button>
          )}
          <button onClick={runScript} disabled={!connected || ['running', 'starting'].includes(jobStatus)} style={{
            background: !connected || ['running', 'starting'].includes(jobStatus) ? '#2a2520' : '#c5a368',
            border: 'none', borderRadius: '8px', padding: '0.5rem 1.5rem',
            color: !connected || ['running', 'starting'].includes(jobStatus) ? '#555' : '#0c0b09',
            fontWeight: 700, fontSize: '0.85rem',
            cursor: !connected || ['running', 'starting'].includes(jobStatus) ? 'not-allowed' : 'pointer',
          }}>
            {['running', 'starting'].includes(jobStatus) ? 'Executando…' : 'Executar'}
          </button>
        </div>
      </div>

      {/* Live log */}
      {logLines.length > 0 && (
        <div style={{ background: '#0c0b09', border: `1px solid ${STATUS_COLOR[jobStatus] ?? '#333'}40`, borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '0.5rem 0.85rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#555', fontFamily: 'monospace' }}>job {activeJob}</span>
            {jobStatus && <span style={{ fontSize: '0.72rem', color: STATUS_COLOR[jobStatus] ?? '#888', fontWeight: 600 }}>● {jobStatus}</span>}
          </div>
          <div ref={logRef} style={{ maxHeight: '380px', overflowY: 'auto', padding: '0.75rem 1rem', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: 1.7 }}>
            {logLines.map((line, i) => (
              <div key={i} style={{ color: line.startsWith('[ERROR]') || line.includes('ERROR') ? '#e05c5c' : line.startsWith('[') ? '#c5a368' : '#8a9a8a' }}>
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

      {/* Offline notice */}
      {connected === false && (
        <div style={{ background: 'rgba(224,92,92,0.05)', border: '1px solid rgba(224,92,92,0.15)', borderRadius: '10px', padding: '1rem 1.25rem' }}>
          <p style={{ color: '#e05c5c', fontWeight: 600, fontSize: '0.85rem', margin: '0 0 0.5rem' }}>Servidor local não encontrado</p>
          <p style={{ color: '#6b6456', fontSize: '0.78rem', margin: '0 0 0.75rem' }}>O Runner precisa do servidor local rodando na sua máquina. Execute:</p>
          <code style={{ display: 'block', background: '#0c0b09', borderRadius: '6px', padding: '0.6rem 0.85rem', color: '#c5a368', fontSize: '0.78rem' }}>
            python local_server.py
          </code>
          <p style={{ color: '#444', fontSize: '0.72rem', margin: '0.5rem 0 0' }}>Ou dê duplo clique em START.bat — ele inicia o servidor automaticamente.</p>
        </div>
      )}
    </div>
  );
}
