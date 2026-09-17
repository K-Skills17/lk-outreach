'use client';

import { useState, useEffect } from 'react';

const LOCAL = 'http://localhost:8765';

type SendWindow = { start: string; end: string };
type NumberCfg  = { id: string; label: string; daily_cap_start: number; daily_cap_max: number; status: string; warming: boolean };
type SenderCfg  = {
  numbers:      NumberCfg[];
  daily:        { total_cap: number; reset_hour: string };
  send_windows: Record<string, SendWindow[]>;
  delays:       { between_sends_min: number; between_sends_max: number; long_pause_every_min_sends: number; long_pause_every_max_sends: number; long_pause_min_sec: number; long_pause_max_sec: number };
  safety:       { global_kill_switch_env: string; opt_out_keywords: string[] };
};

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABEL: Record<string,string> = { monday:'Seg', tuesday:'Ter', wednesday:'Qua', thursday:'Qui', friday:'Sex', saturday:'Sáb', sunday:'Dom' };
const STATUS_OPTS = ['active','warming','paused','banned'];
const STATUS_COLOR: Record<string,string> = { active:'#4caf7d', warming:'#c5a368', paused:'#e08c2c', banned:'#e05c5c' };

export default function ConfigClient() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [cfg,       setCfg]       = useState<SenderCfg | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const r = await fetch(`${LOCAL}/config/sender`, { signal: AbortSignal.timeout(2000) });
      if (!r.ok) throw new Error();
      setCfg(await r.json());
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }

  async function save() {
    if (!cfg) return;
    setSaving(true); setSaveMsg(null);
    try {
      const r = await fetch(`${LOCAL}/config/sender`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      if (!r.ok) throw new Error();
      setSaveMsg('Salvo! Reinicie o outreach_runner para aplicar.');
      setTimeout(() => setSaveMsg(null), 5000);
    } catch {
      setSaveMsg('Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  function updateNumber(idx: number, patch: Partial<NumberCfg>) {
    if (!cfg) return;
    const numbers = cfg.numbers.map((n, i) => i === idx ? { ...n, ...patch } : n);
    setCfg({ ...cfg, numbers });
  }

  function updateDelay(key: string, val: number) {
    if (!cfg) return;
    setCfg({ ...cfg, delays: { ...cfg.delays, [key]: val } });
  }

  function updateWindow(day: string, idx: number, field: 'start' | 'end', val: string) {
    if (!cfg) return;
    const windows = { ...cfg.send_windows };
    const dayWins = [...(windows[day] || [])];
    dayWins[idx] = { ...dayWins[idx], [field]: val };
    windows[day] = dayWins;
    setCfg({ ...cfg, send_windows: windows });
  }

  function addWindow(day: string) {
    if (!cfg) return;
    const windows = { ...cfg.send_windows };
    windows[day] = [...(windows[day] || []), { start: '09:00', end: '12:00' }];
    setCfg({ ...cfg, send_windows: windows });
  }

  function removeWindow(day: string, idx: number) {
    if (!cfg) return;
    const windows = { ...cfg.send_windows };
    windows[day] = windows[day].filter((_, i) => i !== idx);
    setCfg({ ...cfg, send_windows: windows });
  }

  const inputStyle: React.CSSProperties = {
    background: '#1e1b16', border: '1px solid rgba(197,163,104,0.15)',
    borderRadius: '7px', padding: '0.35rem 0.6rem',
    color: '#d8d2c4', fontSize: '0.82rem', outline: 'none', width: '100%', boxSizing: 'border-box',
  };
  const card: React.CSSProperties = {
    background: '#161310', border: '1px solid rgba(197,163,104,0.1)', borderRadius: '12px', overflow: 'hidden',
  };
  const sectionHead: React.CSSProperties = {
    padding: '0.7rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)',
    fontSize: '0.82rem', fontWeight: 600, color: '#8a7f72',
  };

  if (connected === false) return (
    <div>
      <h1 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', color: '#d8d2c4' }}>Configurar</h1>
      <div style={{ background: 'rgba(224,92,92,0.05)', border: '1px solid rgba(224,92,92,0.15)', borderRadius: '10px', padding: '1rem 1.25rem' }}>
        <p style={{ color: '#e05c5c', fontWeight: 600, fontSize: '0.85rem', margin: '0 0 0.4rem' }}>Servidor local offline</p>
        <code style={{ display: 'block', background: '#0c0b09', borderRadius: '6px', padding: '0.5rem 0.75rem', color: '#c5a368', fontSize: '0.78rem' }}>
          python local_server.py
        </code>
      </div>
    </div>
  );

  if (!cfg) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#555', fontSize: '0.85rem' }}>
      Carregando configuração…
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#d8d2c4' }}>Configurar Sender</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {saveMsg && <span style={{ fontSize: '0.75rem', color: saveMsg.startsWith('Erro') ? '#e05c5c' : '#4caf7d' }}>{saveMsg}</span>}
          <button onClick={save} disabled={saving} style={{
            background: saving ? '#2a2520' : '#c5a368', border: 'none', borderRadius: '7px',
            padding: '0.4rem 1rem', color: saving ? '#555' : '#0c0b09',
            fontWeight: 700, fontSize: '0.82rem', cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? 'Salvando…' : 'Salvar tudo'}
          </button>
        </div>
      </div>

      {/* Numbers */}
      <section style={card}>
        <div style={sectionHead}>Números WhatsApp</div>
        <div style={{ padding: '0.85rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {cfg.numbers.map((n, i) => (
            <div key={n.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 90px 90px auto', gap: '0.65rem', alignItems: 'center' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.62rem', color: '#555', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Label</label>
                <input value={n.label} onChange={e => updateNumber(i, { label: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.62rem', color: '#555', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</label>
                <select value={n.status} onChange={e => updateNumber(i, { status: e.target.value })}
                  style={{ ...inputStyle, color: STATUS_COLOR[n.status] ?? '#d8d2c4', cursor: 'pointer' }}>
                  {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.62rem', color: '#555', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cap inicial</label>
                <input type="number" value={n.daily_cap_start} onChange={e => updateNumber(i, { daily_cap_start: Number(e.target.value) })} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.62rem', color: '#555', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cap máx</label>
                <input type="number" value={n.daily_cap_max} onChange={e => updateNumber(i, { daily_cap_max: Number(e.target.value) })} style={inputStyle} />
              </div>
              <div style={{ paddingTop: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#555', cursor: 'pointer' }}>
                  <input type="checkbox" checked={n.warming} onChange={e => updateNumber(i, { warming: e.target.checked })} />
                  Warming
                </label>
              </div>
            </div>
          ))}
          <p style={{ color: '#444', fontSize: '0.72rem', margin: 0 }}>
            Cap total combinado: {cfg.daily.total_cap} msgs/dia
            &nbsp;—&nbsp;
            <input type="number" value={cfg.daily.total_cap}
              onChange={e => setCfg({ ...cfg, daily: { ...cfg.daily, total_cap: Number(e.target.value) } })}
              style={{ ...inputStyle, width: '70px', display: 'inline-block' }} />
          </p>
        </div>
      </section>

      {/* Send windows */}
      <section style={card}>
        <div style={sectionHead}>Janelas de envio (America/São_Paulo)</div>
        <div style={{ padding: '0.85rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {DAYS.map(day => (
            <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <span style={{ width: '32px', color: '#6b6456', fontSize: '0.78rem', fontWeight: 600 }}>{DAY_LABEL[day]}</span>
              {(cfg.send_windows[day] || []).map((w, wi) => (
                <div key={wi} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <input type="time" value={w.start} onChange={e => updateWindow(day, wi, 'start', e.target.value)}
                    style={{ ...inputStyle, width: '90px' }} />
                  <span style={{ color: '#444', fontSize: '0.75rem' }}>–</span>
                  <input type="time" value={w.end} onChange={e => updateWindow(day, wi, 'end', e.target.value)}
                    style={{ ...inputStyle, width: '90px' }} />
                  <button onClick={() => removeWindow(day, wi)} style={{
                    background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '0.8rem', padding: '0 0.2rem',
                  }}>✕</button>
                </div>
              ))}
              <button onClick={() => addWindow(day)} style={{
                background: 'none', border: '1px dashed rgba(197,163,104,0.2)', borderRadius: '6px',
                color: '#555', fontSize: '0.72rem', padding: '0.25rem 0.6rem', cursor: 'pointer',
              }}>+ janela</button>
            </div>
          ))}
        </div>
      </section>

      {/* Delays */}
      <section style={card}>
        <div style={sectionHead}>Delays entre envios</div>
        <div style={{ padding: '0.85rem 1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {[
              { key: 'between_sends_min', label: 'Delay mínimo (seg)' },
              { key: 'between_sends_max', label: 'Delay máximo (seg)' },
              { key: 'long_pause_every_min_sends', label: 'Pausa longa a cada (mín envios)' },
              { key: 'long_pause_every_max_sends', label: 'Pausa longa a cada (máx envios)' },
              { key: 'long_pause_min_sec', label: 'Duração pausa mín (seg)' },
              { key: 'long_pause_max_sec', label: 'Duração pausa máx (seg)' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '0.62rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
                  {f.label}
                </label>
                <input type="number" value={(cfg.delays as Record<string,number>)[f.key] ?? 0}
                  onChange={e => updateDelay(f.key, Number(e.target.value))}
                  style={inputStyle} />
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
