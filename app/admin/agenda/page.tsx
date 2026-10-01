import { getAvailabilitySlots, getSlotBlocks } from '@/lib/calendar';
import AvailabilityEditor from '@/app/components/AvailabilityEditor';

export const metadata = { title: 'Agenda — Admin LK Outreach' };

// Reads the DB and env at request time — must not be prerendered at build.
export const dynamic = 'force-dynamic';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.3rem', color: '#e8e8e8' }}>
          Minha agenda
        </h1>
        <p style={{ fontSize: '0.78rem', color: '#555', margin: 0 }}>
          Horários disponíveis para prospectos agendar conversa em{' '}
          <span style={{ color: '#c5a368' }}>/agendar</span>
        </p>
      </div>

      <AvailabilityEditor
        availabilityUrl="/api/admin/agenda/availability"
        blocksUrl="/api/admin/agenda/blocks"
        initialSlots={slots}
        initialBlocks={blocks}
        dayCols={[1, 2, 3, 4, 5]}
        firstTime="08:00"
        lastTime="18:30"
        durationMin={15}
        title="Horários disponíveis para conversa"
        hint="Clique para ativar/desativar. Dourado = disponível. Slots de 15 min (discovery call)."
      />
    </div>
  );
}
