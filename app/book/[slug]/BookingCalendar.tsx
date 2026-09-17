'use client';

import { useState, useEffect } from 'react';

type DayAvailability = { date: string; day_label: string; slots: string[] };

type Props = {
  slug:           string;
  shopName:       string;
  whatsappLink?:  string;
  prefillName?:   string;
  prefillPhone?:  string;
  prefillService?: string;
  convId?:        string;
};

type Step = 'date' | 'time' | 'confirm' | 'success';

type BookingResult = {
  booking_id: string;
  slot_date:  string;
  start_time: string;
  lead_name:  string | null;
  shop_name:  string;
  whatsapp:   string | null;
};

function formatDateBR(dateStr: string): string {
  const [, mm, dd] = dateStr.split('-');
  return `${dd}/${mm}`;
}

export default function BookingCalendar({
  slug, shopName, whatsappLink, prefillName, prefillPhone, prefillService, convId,
}: Props) {
  const [step,          setStep]         = useState<Step>('date');
  const [days,          setDays]         = useState<DayAvailability[]>([]);
  const [loadingSlots,  setLoadingSlots] = useState(true);
  const [slotsError,    setSlotsError]   = useState(false);
  const [selectedDate,  setSelectedDate] = useState<DayAvailability | null>(null);
  const [selectedTime,  setSelectedTime] = useState<string | null>(null);
  const [name,          setName]         = useState(prefillName  ?? '');
  const [phone,         setPhone]        = useState(prefillPhone ?? '');
  const [service,       setService]      = useState(prefillService ?? '');
  const [notes,         setNotes]        = useState('');
  const [submitting,    setSubmitting]   = useState(false);
  const [submitError,   setSubmitError]  = useState<string | null>(null);
  const [booking,       setBooking]      = useState<BookingResult | null>(null);

  useEffect(() => {
    fetch(`/api/book/${slug}/slots`)
      .then(r => r.json())
      .then(data => { setDays(data.days ?? []); setLoadingSlots(false); })
      .catch(() => { setSlotsError(true); setLoadingSlots(false); });
  }, [slug]);

  async function confirmBooking() {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`/api/book/${slug}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_date:  selectedDate.date,
          start_time: selectedTime,
          lead_name:  name.trim()    || null,
          lead_phone: phone.trim()   || null,
          service:    service.trim() || null,
          notes:      notes.trim()   || null,
          conv_id:    convId         || null,
        }),
      });
      if (res.status === 409) { setSubmitError('Este horário acabou de ser reservado. Escolha outro.'); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBooking(data);
      setStep('success');
    } catch {
      setSubmitError('Erro ao confirmar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Shared styles ──
  const card: React.CSSProperties = {
    background:   '#161310',
    border:       '1px solid rgba(197,163,104,0.12)',
    borderRadius: '12px',
    padding:      '1.25rem',
  };
  const btn = (active: boolean, disabled = false): React.CSSProperties => ({
    background:   disabled ? '#1a1a1a' : active ? '#c5a368' : 'rgba(197,163,104,0.08)',
    border:       `1px solid ${disabled ? 'rgba(255,255,255,0.04)' : active ? '#c5a368' : 'rgba(197,163,104,0.2)'}`,
    borderRadius: '8px',
    padding:      '0.55rem 0.9rem',
    color:        disabled ? '#333' : active ? '#0a0a0a' : '#c5a368',
    fontWeight:   active ? 700 : 500,
    fontSize:     '0.82rem',
    cursor:       disabled ? 'not-allowed' : 'pointer',
    whiteSpace:   'nowrap' as const,
  });

  // ── Loading ──
  if (loadingSlots) return (
    <div style={{ ...card, textAlign: 'center', color: '#555', padding: '2.5rem' }}>
      Verificando disponibilidade…
    </div>
  );

  if (slotsError) return (
    <div style={{ ...card, textAlign: 'center', color: '#e05c5c', padding: '2rem' }}>
      Não foi possível carregar os horários. Tente novamente.
    </div>
  );

  if (days.length === 0) return (
    <div style={{ ...card, textAlign: 'center', padding: '2rem' }}>
      <p style={{ color: '#888', fontSize: '0.9rem', margin: '0 0 0.5rem' }}>
        Sem horários disponíveis no momento.
      </p>
      <p style={{ color: '#555', fontSize: '0.78rem', margin: 0 }}>
        Entre em contato diretamente com {shopName}.
      </p>
      {whatsappLink && (
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-block', marginTop: '1rem', padding: '0.5rem 1.2rem',
            background: '#25D366', borderRadius: '8px', color: '#fff',
            fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none' }}>
          💬 WhatsApp
        </a>
      )}
    </div>
  );

  // ── Step: date ──
  if (step === 'date') return (
    <div style={card}>
      <p style={{ fontSize: '0.78rem', color: '#666', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Escolha uma data
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
        {days.map(day => (
          <button
            key={day.date}
            onClick={() => { setSelectedDate(day); setStep('time'); }}
            style={btn(false)}
          >
            {day.day_label}
          </button>
        ))}
      </div>
    </div>
  );

  // ── Step: time ──
  if (step === 'time' && selectedDate) return (
    <div style={card}>
      <p style={{ fontSize: '0.78rem', color: '#666', margin: '0 0 0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {selectedDate.day_label}
      </p>
      <p style={{ fontSize: '0.85rem', color: '#c5a368', fontWeight: 600, margin: '0 0 1rem' }}>
        Escolha um horário
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
        {selectedDate.slots.map(slot => (
          <button
            key={slot}
            onClick={() => { setSelectedTime(slot); setStep('confirm'); }}
            style={btn(false)}
          >
            {slot}
          </button>
        ))}
      </div>
      <button onClick={() => setStep('date')} style={{ background: 'none', border: 'none', color: '#555', fontSize: '0.78rem', cursor: 'pointer', padding: 0 }}>
        ← Voltar
      </button>
    </div>
  );

  // ── Step: confirm ──
  if (step === 'confirm' && selectedDate && selectedTime) return (
    <div style={card}>
      <div style={{
        background:   'rgba(197,163,104,0.06)',
        border:       '1px solid rgba(197,163,104,0.15)',
        borderRadius: '8px',
        padding:      '0.7rem 1rem',
        marginBottom: '1.25rem',
        display:      'flex',
        gap:          '1rem',
      }}>
        <span style={{ color: '#c5a368', fontWeight: 700, fontSize: '0.9rem' }}>📅</span>
        <div>
          <p style={{ margin: 0, color: '#e8e8e8', fontWeight: 600, fontSize: '0.88rem' }}>
            {selectedDate.day_label} às {selectedTime}
          </p>
          <p style={{ margin: 0, color: '#666', fontSize: '0.72rem' }}>{shopName}</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Seu nome *', value: name,    setter: setName,    placeholder: 'Nome completo' },
          { label: 'Telefone *', value: phone,   setter: setPhone,   placeholder: '11999887766' },
          { label: 'Serviço',   value: service, setter: setService, placeholder: 'O que você precisa?' },
        ].map(f => (
          <div key={f.label}>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {f.label}
            </label>
            <input
              value={f.value}
              onChange={e => f.setter(e.target.value)}
              placeholder={f.placeholder}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: '#1e1b16', border: '1px solid rgba(197,163,104,0.15)',
                borderRadius: '7px', padding: '0.5rem 0.75rem',
                color: '#e8e8e8', fontSize: '0.85rem', outline: 'none',
              }}
            />
          </div>
        ))}
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Observações
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Alguma informação adicional?"
            rows={2}
            style={{
              width: '100%', boxSizing: 'border-box', resize: 'vertical',
              background: '#1e1b16', border: '1px solid rgba(197,163,104,0.15)',
              borderRadius: '7px', padding: '0.5rem 0.75rem',
              color: '#e8e8e8', fontSize: '0.85rem', outline: 'none', fontFamily: 'inherit',
            }}
          />
        </div>
      </div>

      {submitError && (
        <p style={{ color: '#e05c5c', fontSize: '0.78rem', margin: '0 0 0.75rem' }}>{submitError}</p>
      )}

      <div style={{ display: 'flex', gap: '0.6rem' }}>
        <button
          onClick={confirmBooking}
          disabled={submitting || !name.trim() || !phone.trim()}
          style={{
            flex:         1,
            background:   submitting || !name.trim() || !phone.trim() ? '#333' : '#c5a368',
            border:       'none', borderRadius: '8px',
            padding:      '0.65rem',
            color:        submitting || !name.trim() || !phone.trim() ? '#666' : '#0a0a0a',
            fontWeight:   700, fontSize: '0.88rem',
            cursor:       submitting || !name.trim() || !phone.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Confirmando…' : 'Confirmar'}
        </button>
        <button
          onClick={() => setStep('time')}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.65rem 1rem', color: '#555', fontSize: '0.82rem', cursor: 'pointer' }}
        >
          Voltar
        </button>
      </div>
    </div>
  );

  // ── Step: success ──
  if (step === 'success' && booking) return (
    <div style={{ ...card, textAlign: 'center' }}>
      <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>✅</p>
      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4caf7d', margin: '0 0 1.25rem' }}>
        Agendamento confirmado!
      </p>

      <div style={{
        background:   'rgba(76,175,125,0.06)',
        border:       '1px solid rgba(76,175,125,0.15)',
        borderRadius: '10px',
        padding:      '0.85rem 1rem',
        marginBottom: '1.25rem',
        textAlign:    'left',
      }}>
        {[
          { icon: '📅', text: `${selectedDate?.day_label} às ${booking.start_time}` },
          { icon: '👤', text: booking.lead_name ?? name },
          { icon: '🏪', text: booking.shop_name },
        ].map(r => (
          <p key={r.icon} style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#e8e8e8', display: 'flex', gap: '0.5rem' }}>
            <span>{r.icon}</span><span>{r.text}</span>
          </p>
        ))}
      </div>

      <p style={{ fontSize: '0.78rem', color: '#666', margin: '0 0 1rem' }}>
        Salve este horário! A empresa pode confirmar pelo WhatsApp.
      </p>

      {(booking.whatsapp ?? whatsappLink) && (
        <a
          href={booking.whatsapp ?? whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display:        'inline-flex', alignItems: 'center', gap: '0.4rem',
            background:     '#25D366', borderRadius: '8px',
            padding:        '0.55rem 1.2rem', color: '#fff',
            fontWeight:     700, fontSize: '0.82rem', textDecoration: 'none',
          }}
        >
          💬 Confirmar pelo WhatsApp
        </a>
      )}
    </div>
  );

  return null;
}
