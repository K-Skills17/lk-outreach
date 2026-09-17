import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  getTenantBySlug,
  createConversation,
  getConversation,
  saveConversationTurn,
  formatHoursDisplay,
  type ConversationTurn,
  type ExtractedFields,
} from '@/lib/tenant';
import { getNicheConfig } from '@/lib/niches';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const MODEL     = 'claude-haiku-4-5-20251001';

// ---------------------------------------------------------------------------
// System prompt builder
// ---------------------------------------------------------------------------

function buildSystemPrompt(
  tenantName:  string,
  config:      { address?: string; hours?: Record<string, string>; services?: string[]; bairros_served?: string[] },
  niche:       ReturnType<typeof getNicheConfig>,
): string {
  const hours    = formatHoursDisplay(config.hours);
  const services = config.services?.length
    ? config.services.join(', ')
    : niche.display_name;

  const locationLine = niche.location_based
    ? (config.bairros_served?.length
        ? `Atende: ${config.bairros_served.join(', ')}.`
        : config.address ? `Baseado em: ${config.address}.` : '')
    : `Localizado em: ${config.address || 'localização não informada'}.`;

  return `Você é o assistente virtual da ${tenantName}, ${niche.display_name.toLowerCase()}.
${locationLine}
Horário de funcionamento: ${hours}.
Serviços: ${services}.

Sua função: guiar o cliente para solicitar um orçamento/agendamento.
Colete estas informações na ordem que fizer sentido na conversa:
${niche.collection_steps}

Regras:
- NUNCA invente preços. Se perguntado diga: "${niche.guardrails.price_fallback}".
- NUNCA dê diagnóstico definitivo. Use: "${niche.guardrails.diagnosis_qualifier}".
- "${niche.guardrails.booking_qualifier}"
- Foco exclusivo em ${niche.display_name.toLowerCase()}. Recuse gentilmente outros assuntos.
- Respostas curtas e diretas (máximo 3 frases).
- Tom amigável e profissional.`;
}

// ---------------------------------------------------------------------------
// Safety trigger check
// ---------------------------------------------------------------------------

function checkSafetyTrigger(
  message:  string,
  triggers: string[],
): boolean {
  const lower = message.toLowerCase();
  return triggers.some(t => lower.includes(t.toLowerCase()));
}

// ---------------------------------------------------------------------------
// Field extraction (separate Haiku call)
// ---------------------------------------------------------------------------

async function extractFields(
  transcript: ConversationTurn[],
  lastMessage: string,
): Promise<ExtractedFields> {
  const context = transcript
    .slice(-6)
    .map(t => `${t.role === 'user' ? 'Cliente' : 'Assistente'}: ${t.content}`)
    .join('\n');

  try {
    const resp = await anthropic.messages.create({
      model:      MODEL,
      max_tokens: 150,
      system: `Analise a conversa e extraia dados que o CLIENTE tenha informado.
Retorne SOMENTE JSON válido, sem texto extra:
{"service_needed":null,"vehicle":null,"symptom":null,"urgency":null,"lead_name":null,"lead_phone":null,"preferred_slot":null,"customer_address":null}
Use null para campos não mencionados. lead_phone deve ser somente dígitos (ex: "11999887766"). customer_address deve ser o endereço do CLIENTE (rua, número, bairro), não o endereço da empresa.`,
      messages: [{
        role:    'user',
        content: `${context}\nCliente (agora): ${lastMessage}`,
      }],
    });

    const text = (resp.content[0] as { type: string; text: string }).text.trim();
    // Find the JSON object in the response
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return {};
    return JSON.parse(match[0]) as ExtractedFields;
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenant_slug,
      conversation_id,
      message,
      source,
    }: {
      tenant_slug:      string;
      conversation_id?: string;
      message:          string;
      source?:          string;
    } = body;

    if (!tenant_slug || !message?.trim()) {
      return NextResponse.json({ error: 'tenant_slug and message required' }, { status: 400 });
    }

    // Load tenant
    const tenant = await getTenantBySlug(tenant_slug);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    if (!tenant.bot_enabled) {
      return NextResponse.json({ error: 'Bot disabled' }, { status: 403 });
    }

    // Load niche config
    const nicheConfig = getNicheConfig(tenant.niche);

    // Get or create conversation
    const convId = conversation_id
      || await createConversation(tenant.id, source ?? null);

    const conv = await getConversation(convId);
    if (!conv) {
      return NextResponse.json({ error: 'Conversation error' }, { status: 500 });
    }

    const existingTranscript: ConversationTurn[] = conv.transcript ?? [];

    // Safety trigger check
    const isSafetyHit = checkSafetyTrigger(message, nicheConfig.safety_triggers);
    if (isSafetyHit) {
      const safetyReply = tenant.config.phone_display
        ? `${nicheConfig.safety_reply_prefix} Entre em contato diretamente com a ${tenant.name}: ${tenant.config.phone_display}`
        : `${nicheConfig.safety_reply_prefix} Entre em contato diretamente com a ${tenant.name}.`;

      const newTurns: ConversationTurn[] = [
        { role: 'user',      content: message,      ts: new Date().toISOString() },
        { role: 'assistant', content: safetyReply,  ts: new Date().toISOString() },
      ];
      await saveConversationTurn(convId, newTurns, {}, conv.qualified);

      return NextResponse.json({
        reply:           safetyReply,
        conversation_id: convId,
        qualified:       conv.qualified,
        show_phone:      true,
        phone_display:   tenant.config.phone_display ?? null,
      });
    }

    // Build Anthropic messages from transcript
    const systemPrompt = buildSystemPrompt(tenant.name, tenant.config, nicheConfig);
    const apiMessages: Array<{ role: 'user' | 'assistant'; content: string }> =
      existingTranscript.map(t => ({ role: t.role, content: t.content }));
    apiMessages.push({ role: 'user', content: message });

    // Main chat call
    const chatResp = await anthropic.messages.create({
      model:      MODEL,
      max_tokens: 300,
      system:     systemPrompt,
      messages:   apiMessages,
    });

    const reply = (chatResp.content[0] as { type: string; text: string }).text.trim();

    // Extract fields (parallel with DB write opportunity, but kept sequential for simplicity)
    const extracted = await extractFields(existingTranscript, message);

    // Save turns
    const newTurns: ConversationTurn[] = [
      { role: 'user',      content: message, ts: new Date().toISOString() },
      { role: 'assistant', content: reply,   ts: new Date().toISOString() },
    ];
    await saveConversationTurn(convId, newTurns, extracted, conv.qualified);

    const nowQualified = !!(
      (extracted.service_needed || conv.service) &&
      (extracted.lead_phone     || conv.lead_phone)
    );

    return NextResponse.json({
      reply,
      conversation_id: convId,
      qualified:       nowQualified,
      show_phone:      false,
      lead_name:       extracted.lead_name  ?? conv.lead_name  ?? null,
      lead_phone:      extracted.lead_phone ?? conv.lead_phone ?? null,
      service:         extracted.service_needed ?? conv.service ?? null,
    });

  } catch (err) {
    console.error('[/api/chat]', err);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
