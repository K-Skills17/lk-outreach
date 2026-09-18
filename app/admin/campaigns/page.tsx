'use client';

import { useEffect, useState } from 'react';

type Campaign = {
  slug: string;
  name: string;
  niche: string | null;
  cap: number | null;
  offer: string | null;
  p1_message?: string;
  p2_message?: string | null;
  p3_message?: string | null;
  max_chars?: number;
  status?: string;
  source?: string;
  created_at?: string;
  // stats
  total: number;
  contacted: number;
  replied: number;
  opted_out: number;
  won: number;
  last_sent: string | null;
};

type FormState = {
  name: string;
  slug: string;
  niche: string;
  cap: string;
  offer: string;
  p1_message: string;
  p2_message: string;
  p3_message: string;
  max_chars: string;
};

const EMPTY_FORM: FormState = {
  name: '', slug: '', niche: 'moveis-planejados', cap: '10',
  offer: '', p1_message: '', p2_message: '', p3_message: '', max_chars: '360',
};

function slugify(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const card: React.CSSProperties = {
  background: '#161310',
  border: '1px solid rgba(197,163,104,0.1)',
  borderRadius: '12px',
  overflow: 'hidden',
  marginBottom: '1.5rem',
};

const th: React.CSSProperties = {
  padding: '0.55rem 0.85rem',
  textAlign: 'left',
  fontSize: '0.72rem',
  color: '#555',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
};

const td: React.CSSProperties = {
  padding: '0.6rem 0.85rem',
  fontSize: '0.82rem',
  color: '#ccc',
  borderBottom: '1px solid rgba(255,255,255,0.03)',
  verticalAlign: 'middle',
};

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ fontSize: '0.72rem', color: '#666', marginBottom: '0.3rem', display: 'block' }}>
      {children}{required && <span style={{ color: '#e05c5c', marginLeft: '0.2rem' }}>*</span>}
    </label>
  );
}

function Input({ value, onChange, placeholder, style }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; style?: React.CSSProperties;
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', background: '#0f0f0f',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: '7px', padding: '0.45rem 0.75rem',
        color: '#e8e8e8', fontSize: '0.82rem', outline: 'none',
        boxSizing: 'border-box',
        ...style,
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows ?? 4}
      style={{
        width: '100%', background: '#0f0f0f',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: '7px', padding: '0.45rem 0.75rem',
        color: '#e8e8e8', fontSize: '0.82rem', outline: 'none',
        resize: 'vertical', fontFamily: 'inherit',
        boxSizing: 'border-box',
      }}
    />
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm]           = useState<FormState>(EMPTY_FORM);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/campaigns');
    if (res.ok) {
      const data = await res.json();
      setCampaigns(data.campaigns ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function setField(key: keyof FormState, value: string) {
    setForm(f => ({
      ...f,
      [key]: value,
      ...(key === 'name' ? { slug: slugify(value) } : {}),
    }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug:        form.slug.trim(),
          name:        form.name.trim(),
          niche:       form.niche.trim(),
          cap:         Number(form.cap) || 10,
          offer:       form.offer.trim() || null,
          p1_message:  form.p1_message.trim(),
          p2_message:  form.p2_message.trim() || null,
          p3_message:  form.p3_message.trim() || null,
          max_chars:   Number(form.max_chars) || 360,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? 'Erro ao criar campanha.');
        return;
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(slug: string) {
    if (!confirm(`Deletar campanha "${slug}"? Os prospectos NÃO serão apagados.`)) return;
    await fetch(`/api/admin/campaigns?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' });
    await load();
  }

  const dbCampaigns   = campaigns.filter(c => c.source === 'db');
  const yamlCampaigns = campaigns.filter(c => c.source === 'yaml');

  return (
    <>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#e8e8e8', margin: '0 0 0.25rem' }}>
            Campanhas
          </h1>
          <p style={{ fontSize: '0.78rem', color: '#555', margin: 0 }}>
            Campanhas usam mensagens personalizadas em vez do template padrão do nicho.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setFormError(null); }}
            style={{
              background: 'rgba(197,163,104,0.1)',
              border: '1px solid rgba(197,163,104,0.3)',
              borderRadius: '8px',
              padding: '0.45rem 1.1rem',
              color: '#c5a368',
              fontWeight: 700,
              fontSize: '0.82rem',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            + Nova Campanha
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <section style={{ ...card, border: '1px solid rgba(197,163,104,0.2)' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#e8e8e8' }}>Nova Campanha</h2>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.1rem', padding: '0 0.25rem' }}>×</button>
          </div>

          <form onSubmit={handleCreate} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Row: name + slug */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <FieldLabel required>Nome da campanha</FieldLabel>
                <Input value={form.name} onChange={v => setField('name', v)} placeholder="Ex: Beta Pack — Móveis Planejados" />
              </div>
              <div>
                <FieldLabel required>Slug (identificador)</FieldLabel>
                <Input value={form.slug} onChange={v => setField('slug', v)} placeholder="ex: moveis-beta-pack" />
                <span style={{ fontSize: '0.67rem', color: '#444', marginTop: '0.2rem', display: 'block' }}>
                  Letras minúsculas, números e hífens.
                </span>
              </div>
            </div>

            {/* Row: niche + cap + max_chars */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <FieldLabel required>Nicho</FieldLabel>
                <Input value={form.niche} onChange={v => setField('niche', v)} placeholder="moveis-planejados" />
              </div>
              <div>
                <FieldLabel>Cap (clientes)</FieldLabel>
                <Input value={form.cap} onChange={v => setField('cap', v)} placeholder="10" />
              </div>
              <div>
                <FieldLabel>Máx. caracteres</FieldLabel>
                <Input value={form.max_chars} onChange={v => setField('max_chars', v)} placeholder="360" />
              </div>
            </div>

            {/* Offer */}
            <div>
              <FieldLabel>Descrição da oferta (para o painel)</FieldLabel>
              <Input value={form.offer} onChange={v => setField('offer', v)} placeholder="Ex: Landing page + VSL · R$ 1.500 no 2x" />
            </div>

            {/* P1 */}
            <div>
              <FieldLabel required>Mensagem fase 1 — primeiro contato</FieldLabel>
              <Textarea
                value={form.p1_message}
                onChange={v => setField('p1_message', v)}
                placeholder={'Olá {first_name}, vi sua empresa em {city} e tenho algo específico para o seu segmento…'}
                rows={5}
              />
              <span style={{ fontSize: '0.67rem', color: form.p1_message.length > Number(form.max_chars) ? '#e05c5c' : '#444', marginTop: '0.2rem', display: 'block' }}>
                {form.p1_message.length}/{form.max_chars} chars · Variáveis: {'{first_name}'} {'{city}'} {'{name}'} {'{audit_url}'}
              </span>
            </div>

            {/* P2 */}
            <div>
              <FieldLabel>Followup dia 2 (opcional)</FieldLabel>
              <Textarea
                value={form.p2_message}
                onChange={v => setField('p2_message', v)}
                placeholder="Mensagem de acompanhamento leve se não houver resposta…"
                rows={3}
              />
            </div>

            {/* P3 */}
            <div>
              <FieldLabel>Breakup dia 4 (opcional)</FieldLabel>
              <Textarea
                value={form.p3_message}
                onChange={v => setField('p3_message', v)}
                placeholder="Mensagem final de encerramento…"
                rows={3}
              />
            </div>

            {formError && (
              <div style={{ background: 'rgba(224,92,92,0.08)', border: '1px solid rgba(224,92,92,0.25)', borderRadius: '7px', padding: '0.6rem 0.85rem', fontSize: '0.8rem', color: '#e05c5c' }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.25rem' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '7px', padding: '0.45rem 1rem', color: '#555', fontSize: '0.82rem', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" disabled={saving || !form.slug || !form.name || !form.p1_message} style={{
                background: saving ? '#1a1a1a' : 'rgba(197,163,104,0.12)',
                border: `1px solid ${saving ? 'rgba(255,255,255,0.04)' : 'rgba(197,163,104,0.35)'}`,
                borderRadius: '7px',
                padding: '0.45rem 1.2rem',
                color: saving ? '#444' : '#c5a368',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: saving ? 'not-allowed' : 'pointer',
              }}>
                {saving ? 'Criando…' : 'Criar Campanha'}
              </button>
            </div>

            {/* CLI hint */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.85rem' }}>
              <p style={{ fontSize: '0.68rem', color: '#3a3a3a', margin: '0 0 0.35rem' }}>
                Após criar, atribua prospectos e envie:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <code style={{ fontSize: '0.68rem', color: '#555', background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', padding: '0.2rem 0.5rem' }}>
                  python slug_gen.py --niche {form.niche || '<nicho>'} --campaign {form.slug || '<slug>'}
                </code>
                <code style={{ fontSize: '0.68rem', color: '#555', background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px', padding: '0.2rem 0.5rem' }}>
                  python outreach_runner.py --niche {form.niche || '<nicho>'} --phase 1
                </code>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* DB Campaigns */}
      {!loading && dbCampaigns.length === 0 && !showForm && (
        <section style={card}>
          <div style={{ padding: '2rem', textAlign: 'center', color: '#444', fontSize: '0.85rem' }}>
            Nenhuma campanha criada ainda. Clique em{' '}
            <span style={{ color: '#c5a368' }}>+ Nova Campanha</span> para começar.
          </div>
        </section>
      )}

      {dbCampaigns.length > 0 && (
        <section style={card}>
          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>Campanhas ativas</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Campanha</th>
                <th style={th}>Nicho</th>
                <th style={{ ...th, textAlign: 'right' }}>Cap</th>
                <th style={{ ...th, textAlign: 'right' }}>Prospectos</th>
                <th style={{ ...th, textAlign: 'right' }}>Enviados</th>
                <th style={{ ...th, textAlign: 'right' }}>Responderam</th>
                <th style={{ ...th, textAlign: 'right' }}>Taxa</th>
                <th style={{ ...th, textAlign: 'right' }}>Ganhos</th>
                <th style={{ ...th, textAlign: 'right' }}>Opt-outs</th>
                <th style={th}>Último envio</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {dbCampaigns.map(r => {
                const rate     = r.contacted > 0 ? Math.round((r.replied / r.contacted) * 100) : 0;
                const capFull  = r.cap != null && r.won >= r.cap;
                const lastSent = r.last_sent
                  ? new Date(r.last_sent).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                  : '—';
                return (
                  <tr key={r.slug}>
                    <td style={td}>
                      <div style={{ fontWeight: 600, color: '#e8e8e8', marginBottom: '0.1rem' }}>{r.name}</div>
                      <div style={{ fontSize: '0.68rem', color: '#555' }}>{r.slug}</div>
                      {r.offer && <div style={{ fontSize: '0.67rem', color: '#444', marginTop: '0.1rem', maxWidth: '260px' }}>{r.offer}</div>}
                    </td>
                    <td style={{ ...td, fontSize: '0.75rem', color: '#777' }}>{r.niche ?? '—'}</td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <span style={{ color: capFull ? '#4caf7d' : '#888' }}>{r.won}/{r.cap ?? '—'}</span>
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: '#aaa' }}>{r.total}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#aaa' }}>{r.contacted}</td>
                    <td style={{ ...td, textAlign: 'right', color: r.replied > 0 ? '#c5a368' : '#555' }}>{r.replied}</td>
                    <td style={{ ...td, textAlign: 'right', color: rate >= 10 ? '#4caf7d' : rate >= 5 ? '#c5a368' : '#555' }}>
                      {r.contacted > 0 ? `${rate}%` : '—'}
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: r.won > 0 ? '#4caf7d' : '#555' }}>{r.won}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#555' }}>{r.opted_out}</td>
                    <td style={{ ...td, fontSize: '0.75rem', color: '#666' }}>{lastSent}</td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(r.slug)}
                        style={{ background: 'none', border: '1px solid rgba(224,92,92,0.2)', borderRadius: '5px', padding: '0.2rem 0.5rem', color: '#555', fontSize: '0.68rem', cursor: 'pointer' }}
                      >
                        Deletar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* YAML / legacy campaigns */}
      {yamlCampaigns.length > 0 && (
        <section style={card}>
          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <h2 style={{ fontSize: '0.88rem', fontWeight: 600, margin: 0 }}>Campanhas via YAML</h2>
            <span style={{ fontSize: '0.68rem', color: '#555' }}>Configuradas em config/campaigns/</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Slug</th>
                <th style={{ ...th, textAlign: 'right' }}>Prospectos</th>
                <th style={{ ...th, textAlign: 'right' }}>Enviados</th>
                <th style={{ ...th, textAlign: 'right' }}>Responderam</th>
                <th style={{ ...th, textAlign: 'right' }}>Taxa</th>
                <th style={{ ...th, textAlign: 'right' }}>Ganhos</th>
                <th style={th}>Último envio</th>
              </tr>
            </thead>
            <tbody>
              {yamlCampaigns.map(r => {
                const rate     = r.contacted > 0 ? Math.round((r.replied / r.contacted) * 100) : 0;
                const lastSent = r.last_sent
                  ? new Date(r.last_sent).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
                  : '—';
                return (
                  <tr key={r.slug}>
                    <td style={{ ...td, color: '#c5a368', fontWeight: 600 }}>{r.slug}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#aaa' }}>{r.total}</td>
                    <td style={{ ...td, textAlign: 'right', color: '#aaa' }}>{r.contacted}</td>
                    <td style={{ ...td, textAlign: 'right', color: r.replied > 0 ? '#c5a368' : '#555' }}>{r.replied}</td>
                    <td style={{ ...td, textAlign: 'right', color: rate >= 10 ? '#4caf7d' : rate >= 5 ? '#c5a368' : '#555' }}>
                      {r.contacted > 0 ? `${rate}%` : '—'}
                    </td>
                    <td style={{ ...td, textAlign: 'right', color: r.won > 0 ? '#4caf7d' : '#555' }}>{r.won}</td>
                    <td style={{ ...td, fontSize: '0.75rem', color: '#666' }}>{lastSent}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* CLI reference */}
      <section style={{ ...card, marginTop: '0.5rem' }}>
        <div style={{ padding: '1rem 1.25rem' }}>
          <h3 style={{ fontSize: '0.78rem', fontWeight: 600, color: '#888', margin: '0 0 0.75rem' }}>
            Linha de comando
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {[
              ['Atribuir prospectos a uma campanha',          'python slug_gen.py --niche moveis-planejados --campaign moveis-beta-pack'],
              ['Enviar fase 1',                               'python outreach_runner.py --niche moveis-planejados --phase 1'],
              ['Enviar usando número específico',             'python outreach_runner.py --niche moveis-planejados --number number_1'],
              ['Follow-ups (todas as campanhas do nicho)',    'python outreach_runner.py --niche moveis-planejados --phase 2'],
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
