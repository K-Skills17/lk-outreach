import { notFound } from 'next/navigation';
import { getTenantBySlug } from '@/lib/tenant';
import { getNicheConfig } from '@/lib/niches';
import BookingCalendar from './BookingCalendar';

type Props = {
  params:      Promise<{ slug: string }>;
  searchParams: Promise<{
    name?:     string;
    phone?:    string;
    service?:  string;
    conv_id?:  string;
  }>;
};

export default async function BookPage({ params, searchParams }: Props) {
  const { slug }                          = await params;
  const { name, phone, service, conv_id } = await searchParams;

  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const niche = getNicheConfig(tenant.niche);

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
          <p style={{ fontSize: '2rem', margin: '0 0 0.4rem' }}>{niche.niche_emoji}</p>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 0.25rem', color: '#e8e8e8' }}>
            Agendar com {tenant.name}
          </h1>
          <p style={{ fontSize: '0.78rem', color: '#555', margin: 0 }}>
            Escolha uma data e horário disponível
          </p>
        </div>

        <BookingCalendar
          slug={slug}
          shopName={tenant.name}
          whatsappLink={tenant.config.whatsapp_link ?? undefined}
          prefillName={name}
          prefillPhone={phone}
          prefillService={service}
          convId={conv_id}
        />
      </div>
    </div>
  );
}
