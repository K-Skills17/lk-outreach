'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';

type Message = { role: 'user' | 'assistant'; content: string };

type Props = {
  slug:         string;
  shopName:     string;
  greeting:     string;
  source?:      string;
  whatsappLink?: string;
  phoneDisplay?: string;
};

export default function ChatWidget({
  slug, shopName, greeting, source, whatsappLink, phoneDisplay,
}: Props) {
  const [messages,   setMessages]   = useState<Message[]>([
    { role: 'assistant', content: greeting },
  ]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [convId,     setConvId]     = useState<string | null>(null);
  const [qualified,  setQualified]  = useState(false);
  const [showPhone,  setShowPhone]  = useState(false);
  const [leadName,   setLeadName]   = useState<string | null>(null);
  const [leadPhone,  setLeadPhone]  = useState<string | null>(null);
  const [service,    setService]    = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading || qualified) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          tenant_slug:     slug,
          conversation_id: convId,
          message:         text,
          source:          source,
        }),
      });

      if (!res.ok) throw new Error('Server error');

      const data = await res.json();
      setConvId(data.conversation_id);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      if (data.show_phone) setShowPhone(true);
      if (data.qualified) {
        setQualified(true);
        if (data.lead_name)  setLeadName(data.lead_name);
        if (data.lead_phone) setLeadPhone(data.lead_phone);
        if (data.service)    setService(data.service);
      }
    } catch {
      setMessages(prev => [...prev, {
        role:    'assistant',
        content: 'Desculpe, tive um problema. Por favor, tente novamente.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      background:   '#161310',
      border:       '1px solid rgba(197,163,104,0.15)',
      borderRadius: '14px',
      overflow:     'hidden',
      display:      'flex',
      flexDirection: 'column',
      height:       '460px',
    }}>
      {/* Header */}
      <div style={{
        background:  'rgba(197,163,104,0.08)',
        borderBottom:'1px solid rgba(197,163,104,0.12)',
        padding:     '0.75rem 1rem',
        display:     'flex',
        alignItems:  'center',
        gap:         '0.6rem',
      }}>
        <div style={{
          width:       '32px', height: '32px',
          borderRadius:'50%',
          background:  'rgba(197,163,104,0.15)',
          display:     'flex', alignItems: 'center', justifyContent: 'center',
          fontSize:    '1rem',
        }}>
          🔧
        </div>
        <div>
          <p style={{ color: '#e8e8e8', fontSize: '0.82rem', fontWeight: 600, margin: 0 }}>
            Assistente da {shopName}
          </p>
          <p style={{ color: '#4caf7d', fontSize: '0.68rem', margin: 0 }}>
            ● Online agora
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex:      1,
        overflowY: 'auto',
        padding:   '1rem',
        display:   'flex',
        flexDirection: 'column',
        gap:       '0.65rem',
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display:       'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth:     '82%',
              padding:      '0.55rem 0.85rem',
              borderRadius: m.role === 'user'
                ? '12px 12px 2px 12px'
                : '12px 12px 12px 2px',
              background:   m.role === 'user'
                ? 'rgba(197,163,104,0.18)'
                : '#1e1b16',
              border:       m.role === 'user'
                ? '1px solid rgba(197,163,104,0.3)'
                : '1px solid rgba(255,255,255,0.06)',
              color:        '#e8e8e8',
              fontSize:     '0.85rem',
              lineHeight:   1.5,
              wordBreak:    'break-word',
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding:      '0.6rem 0.9rem',
              borderRadius: '12px 12px 12px 2px',
              background:   '#1e1b16',
              border:       '1px solid rgba(255,255,255,0.06)',
              display:      'flex',
              gap:          '4px',
              alignItems:   'center',
            }}>
              {[0, 1, 2].map(n => (
                <span key={n} style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: '#888',
                  animation: `pulse 1.2s ease-in-out ${n * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Qualified success state */}
        {qualified && !showPhone && (
          <div style={{
            background:   'rgba(76,175,125,0.1)',
            border:       '1px solid rgba(76,175,125,0.25)',
            borderRadius: '10px',
            padding:      '0.85rem 1rem',
            textAlign:    'center',
          }}>
            <p style={{ color: '#4caf7d', fontWeight: 600, fontSize: '0.85rem', margin: '0 0 0.3rem' }}>
              Pedido registrado!
            </p>
            <p style={{ color: '#aaa', fontSize: '0.78rem', margin: '0 0 0.6rem' }}>
              A {shopName} entrará em contato para confirmar o horário.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
              {(() => {
                const params = new URLSearchParams();
                if (leadName)  params.set('name',    leadName);
                if (leadPhone) params.set('phone',   leadPhone);
                if (service)   params.set('service', service);
                if (convId)    params.set('conv_id', convId);
                const qs = params.toString();
                return (
                  <a href={`/book/${slug}${qs ? '?' + qs : ''}`}
                    style={{
                      display:        'inline-block',
                      padding:        '0.4rem 1rem',
                      background:     '#c5a368',
                      borderRadius:   '7px',
                      color:          '#0a0a0a',
                      fontSize:       '0.78rem',
                      fontWeight:     700,
                      textDecoration: 'none',
                    }}>
                    Agendar horário
                  </a>
                );
              })()}
              {whatsappLink && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                  style={{
                    display:        'inline-block',
                    padding:        '0.35rem 0.9rem',
                    background:     '#25D366',
                    borderRadius:   '6px',
                    color:          '#fff',
                    fontSize:       '0.75rem',
                    fontWeight:     600,
                    textDecoration: 'none',
                  }}>
                  Chamar no WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        {/* Safety phone display */}
        {showPhone && phoneDisplay && (
          <div style={{
            background:   'rgba(224,92,92,0.1)',
            border:       '1px solid rgba(224,92,92,0.25)',
            borderRadius: '10px',
            padding:      '0.85rem 1rem',
            textAlign:    'center',
          }}>
            <p style={{ color: '#e05c5c', fontWeight: 600, fontSize: '0.85rem', margin: '0 0 0.3rem' }}>
              Situação urgente
            </p>
            <p style={{ color: '#e8e8e8', fontSize: '0.9rem', fontWeight: 600, margin: 0 }}>
              {phoneDisplay}
            </p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{
        borderTop:    '1px solid rgba(255,255,255,0.07)',
        padding:      '0.6rem 0.75rem',
        display:      'flex',
        gap:          '0.5rem',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          disabled={loading || qualified}
          placeholder={qualified ? 'Pedido registrado.' : 'Digite sua mensagem…'}
          style={{
            flex:         1,
            background:   '#1e1b16',
            border:       '1px solid rgba(197,163,104,0.15)',
            borderRadius: '8px',
            padding:      '0.55rem 0.75rem',
            color:        '#e8e8e8',
            fontSize:     '0.85rem',
            outline:      'none',
          }}
        />
        <button
          type="submit"
          disabled={loading || !input.trim() || qualified}
          style={{
            background:   loading || !input.trim() || qualified
              ? '#333' : '#c5a368',
            border:       'none',
            borderRadius: '8px',
            padding:      '0.55rem 1rem',
            color:        loading || !input.trim() || qualified ? '#666' : '#0a0a0a',
            fontWeight:   700,
            fontSize:     '0.82rem',
            cursor:       loading || !input.trim() || qualified ? 'not-allowed' : 'pointer',
            transition:   'background 0.15s',
            whiteSpace:   'nowrap',
          }}
        >
          Enviar
        </button>
      </form>

      {/* Typing animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40%            { opacity: 1;   transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
