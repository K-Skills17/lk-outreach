import { notFound } from 'next/navigation';
import { getTenantBySlug } from '@/lib/tenant';
import { getNicheConfig } from '@/lib/niches';
import ChatWidget from './ChatWidget';

type Props = {
  params:      Promise<{ slug: string }>;
  searchParams: Promise<{ source?: string }>;
};

export default async function TenantLandingPage({ params, searchParams }: Props) {
  const { slug }   = await params;
  const { source } = await searchParams;

  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  const niche       = getNicheConfig(tenant.niche);
  const cfg         = tenant.config;
  const mainService = cfg.main_service ?? niche.display_name;
  const city        = cfg.city         ?? 'sua cidade';
  const address     = cfg.address      ?? '';
  const services    = cfg.services     ?? [];
  const hours       = cfg.hours        ?? {};
  const whatsappLink = cfg.whatsapp_link ?? null;
  const phoneDisplay = cfg.phone_display ?? null;

  const greeting = `Olá! Sou o assistente da ${tenant.name}. 😊 Como posso ajudar você hoje?`;

  return (
    <div style={{
      minHeight:       '100vh',
      background:      '#0a0a0a',
      color:           '#e8e8e8',
      fontFamily:      '"Inter", system-ui, sans-serif',
    }}>
      {/* Hero */}
      <div style={{
        background:      'linear-gradient(135deg, #0f0f0f 0%, #141414 100%)',
        borderBottom:    '1px solid rgba(197,163,104,0.12)',
        padding:         '3rem 1.5rem 2.5rem',
        textAlign:       'center',
      }}>
        <div style={{
          fontSize:  '2.5rem',
          marginBottom: '0.5rem',
        }}>
          {niche.niche_emoji}
        </div>

        <h1 style={{
          fontSize:    'clamp(1.6rem, 4vw, 2.4rem)',
          fontWeight:  700,
          color:       '#e8e8e8',
          margin:      '0 0 0.5rem',
          lineHeight:  1.2,
        }}>
          {mainService} em {city}
        </h1>

        <p style={{
          fontSize:    '1rem',
          color:       '#aaa',
          margin:      '0 0 0.3rem',
          fontWeight:  400,
        }}>
          {tenant.name}
        </p>

        {address && (
          <p style={{ fontSize: '0.82rem', color: '#666', margin: 0 }}>
            📍 {address}
          </p>
        )}

        <p style={{
          marginTop:   '1.2rem',
          fontSize:    '1.05rem',
          color:       '#c5a368',
          fontWeight:  500,
        }}>
          Peça seu orçamento a qualquer hora — sem ligação, sem espera.
        </p>
      </div>

      {/* Main content */}
      <div style={{
        maxWidth:  '860px',
        margin:    '0 auto',
        padding:   '2rem 1.25rem',
        display:   'grid',
        gridTemplateColumns: 'minmax(0,1fr) minmax(0,340px)',
        gap:       '2rem',
        alignItems: 'start',
      }}>
        {/* Left column: info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Services */}
          {services.length > 0 && (
            <section style={{
              background:   '#141414',
              border:       '1px solid rgba(197,163,104,0.1)',
              borderRadius: '12px',
              padding:      '1.25rem 1.5rem',
            }}>
              <h2 style={{
                fontSize:    '0.95rem',
                fontWeight:  600,
                color:       '#c5a368',
                margin:      '0 0 0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Serviços
              </h2>
              <ul style={{
                listStyle:  'none',
                margin:     0,
                padding:    0,
                display:    'flex',
                flexWrap:   'wrap',
                gap:        '0.5rem',
              }}>
                {services.map((s, i) => (
                  <li key={i} style={{
                    background:   'rgba(197,163,104,0.08)',
                    border:       '1px solid rgba(197,163,104,0.15)',
                    borderRadius: '6px',
                    padding:      '0.3rem 0.7rem',
                    fontSize:     '0.82rem',
                    color:        '#ccc',
                  }}>
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Hours */}
          {Object.keys(hours).length > 0 && (
            <section style={{
              background:   '#141414',
              border:       '1px solid rgba(197,163,104,0.1)',
              borderRadius: '12px',
              padding:      '1.25rem 1.5rem',
            }}>
              <h2 style={{
                fontSize:    '0.95rem',
                fontWeight:  600,
                color:       '#c5a368',
                margin:      '0 0 0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>
                Horários
              </h2>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {Object.entries(hours).map(([day, time]) => (
                    <tr key={day} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.35rem 0', fontSize: '0.83rem', color: '#aaa', width: '45%' }}>
                        {day}
                      </td>
                      <td style={{ padding: '0.35rem 0', fontSize: '0.83rem', color: '#e8e8e8', fontWeight: 500 }}>
                        {time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* WhatsApp CTA */}
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '0.5rem',
                background:     '#25D366',
                borderRadius:   '10px',
                padding:        '0.85rem 1.5rem',
                color:          '#fff',
                fontWeight:     700,
                fontSize:       '0.95rem',
                textDecoration: 'none',
              }}
            >
              <span>💬</span>
              Chamar no WhatsApp
            </a>
          )}

          {/* Reviews snippet */}
          {cfg.reviews_snippet && (
            <p style={{
              fontSize:  '0.82rem',
              color:     '#888',
              fontStyle: 'italic',
              margin:    0,
              textAlign: 'center',
            }}>
              {cfg.reviews_snippet}
            </p>
          )}
        </div>

        {/* Right column: chat */}
        <div style={{ position: 'sticky', top: '1.5rem' }}>
          <p style={{
            fontSize:     '0.78rem',
            color:        '#666',
            textAlign:    'center',
            margin:       '0 0 0.6rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Solicite seu orçamento agora
          </p>
          <ChatWidget
            slug={slug}
            shopName={tenant.name}
            greeting={greeting}
            source={source}
            whatsappLink={whatsappLink ?? undefined}
            phoneDisplay={phoneDisplay ?? undefined}
          />
        </div>
      </div>

      {/* Mobile chat note */}
      <style>{`
        @media (max-width: 640px) {
          [data-layout="grid"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Footer */}
      <div style={{
        borderTop:    '1px solid rgba(255,255,255,0.05)',
        padding:      '1.25rem',
        textAlign:    'center',
        fontSize:     '0.72rem',
        color:        '#444',
      }}>
        Powered by LK Digital
      </div>
    </div>
  );
}
