import BookingCalendar from '@/app/book/[slug]/BookingCalendar';

export const metadata = {
  title: 'Agendar conversa — LK Digital',
  robots: { index: false, follow: false },
};

export default function AgendarPage() {
  return (
    <div style={{
      minHeight:  '100vh',
      background: '#0c0b09',
      color:      '#e8e8e8',
      fontFamily: '"Inter", system-ui, sans-serif',
      padding:    '1.5rem 1rem',
    }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <p style={{ fontSize: '1.8rem', margin: '0 0 0.5rem' }}>📅</p>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.3rem', color: '#e8e8e8' }}>
            Agendar conversa
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#555', margin: '0 0 0.25rem' }}>
            Escolha um horário e deixe seu contato.
          </p>
          <p style={{ fontSize: '0.78rem', color: '#444', margin: 0 }}>
            Entro em contato pelo WhatsApp no dia combinado.
          </p>
        </div>

        <BookingCalendar
          slug="agendar"
          shopName="LK Digital"
        />

      </div>
    </div>
  );
}
