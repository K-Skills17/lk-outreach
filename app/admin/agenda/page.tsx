import { getAvailabilitySlots, getSlotBlocks } from '@/lib/calendar';
import AdminAgendaClient from './AdminAgendaClient';

export const metadata = { title: 'Agenda — Admin LK Outreach' };

export default async function AdminAgendaPage() {
  const tenantId = process.env.OWNER_TENANT_ID;
  if (!tenantId) {
    return (
      <div style={{ color: '#e05c5c', padding: '2rem' }}>
        OWNER_TENANT_ID não configurado. Adicione ao .env.local e Vercel.
      </div>
    );
  }

  const [slots, blocks] = await Promise.all([
    getAvailabilitySlots(tenantId),
    getSlotBlocks(tenantId),
  ]);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.3rem', color: '#e8e8e8' }}>
          Minha agenda
        </h1>
        <p style={{ fontSize: '0.78rem', color: '#555', margin: 0 }}>
          Horários disponíveis para prospectos agendar conversa em{' '}
          <span style={{ color: '#c5a368' }}>/agendar</span>
        </p>
      </div>

      <AdminAgendaClient initialSlots={slots} initialBlocks={blocks} />
    </div>
  );
}
