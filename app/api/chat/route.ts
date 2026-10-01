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

const MODEL = 'claude-haiku-4-5-20251001';

// Abuse / cost guards
const MAX_MESSAGE_CHARS = 2000;  // per user message
const MAX_HISTORY_TURNS = 30;    // turns of context sent to the model
const MAX_CONV_TURNS    = 80;    // after this the bot hands off to the business

let client: Anthropic | null = null;
function anthropic(): Anthropic {
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

/** First text block of a Messages API response ('' if none). */
function textOf(resp: Anthropic.Message): string {
  const block = resp.content.find(b => b.type === 'text');
  return block && block.type === 'text' ? block.text.trim() : '';
}

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

/** Lowercase and strip accents so "fumaca" matches the trigger "fumaça". */
function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function checkSafetyTrigger(
  message:  string,
  triggers: string[],
): boolean {
  const msg = normalize(message);
  return triggers.some(t => msg.includes(normalize(t)));
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
    const resp = await anthropic().messages.create({
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

    const text = textOf(resp);
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
    const body = await req.json().catch(() => null);
    const tenant_slug     = typeof body?.tenant_slug     === 'string' ? body.tenant_slug     : '';
    const conversation_id = typeof body?.conversation_id === 'string' ? body.conversation_id : null;
    const source          = typeof body?.source          === 'string' ? body.source.slice(0, 100) : null;
    const message         = typeof body?.message         === 'string' ? body.message.trim()  : '';

    if (!tenant_slug || !message) {
      return NextResponse.json({ error: 'tenant_slug and message required' }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json({ error: 'Mensagem muito longa.' }, { status: 413 });
    }

    // Load tenant
    const tenant = await getTenantBySlug(tenant_slug);
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }
    if (!tenant.bot_enabled) {
      return NextResponse.json({ error: 'Bot disabled' }, { status: 403 });
    }

    const nicheConfig = getNicheConfig(tenant.niche);

    // Resume the conversation only if it belongs to this tenant; otherwise
    // (unknown, malformed or foreign id) start a fresh one.
    let conv = conversation_id ? await getConversation(conversation_id, tenant.id) : null;
    if (!conv) {
      const newId = await createConversation(tenant.id, source);
      conv = await getConversation(newId, tenant.id);
    }
    if (!conv) {
      return NextResponse.json({ error: 'Conversation error' }, { status: 500 });
    }
    const convId = conv.id;

    const existingTranscript: ConversationTurn[] = conv.transcript ?? [];
    const contactLine = tenant.config.phone_display
      ? `Entre em contato diretamente com a ${tenant.name}: ${tenant.config.phone_display}`
      : `Entre em contato diretamente com a ${tenant.name}.`;

    // Canned replies (safety trigger / conversation too long) skip the model.
    const isSafetyHit = checkSafetyTrigger(message, nicheConfig.safety_triggers);
    const isTooLong   = existingTranscript.length >= MAX_CONV_TURNS;
    if (isSafetyHit || isTooLong) {
      const cannedReply = isSafetyHit
        ? `${nicheConfig.safety_reply_prefix} ${contactLine}`
        : `Para continuar o atendimento, por favor fale com a equipe. ${contactLine}`;

      const now = new Date().toISOString();
      await saveConversationTurn(convId, [
        { role: 'user',      content: message,     ts: now },
        { role: 'assistant', content: cannedReply, ts: now },
      ], {});

      return NextResponse.json({
        reply:           cannedReply,
        conversation_id: convId,
        qualified:       conv.qualified,
        show_phone:      true,
        phone_display:   tenant.config.phone_display ?? null,
      });
    }

    // Build Anthropic messages from the recent transcript. The API requires
    // the first message to be from the user, so drop any leading assistant turn.
    const history = existingTranscript.slice(-MAX_HISTORY_TURNS);
    while (history.length && history[0].role !== 'user') history.shift();
    const apiMessages: Array<{ role: 'user' | 'assistant'; content: string }> =
      history.map(t => ({ role: t.role, content: t.content }));
    apiMessages.push({ role: 'user', content: message });

    // Reply and field extraction are independent — run them in parallel.
    const [chatResp, extracted] = await Promise.all([
      anthropic().messages.create({
        model:      MODEL,
        max_tokens: 300,
        system:     buildSystemPrompt(tenant.name, tenant.config, nicheConfig),
        messages:   apiMessages,
      }),
      extractFields(existingTranscript, message),
    ]);

    const reply = textOf(chatResp)
      || 'Desculpe, não consegui responder agora. Pode repetir, por favor?';

    const userTs = new Date().toISOString();
    await saveConversationTurn(convId, [
      { role: 'user',      content: message, ts: userTs },
      { role: 'assistant', content: reply,   ts: new Date().toISOString() },
    ], extracted);

    // Re-read so the response reflects exactly what was stored.
    const saved = await getConversation(convId, tenant.id) ?? conv;

    return NextResponse.json({
      reply,
      conversation_id: convId,
      qualified:       saved.qualified,
      show_phone:      false,
      lead_name:       saved.lead_name  ?? null,
      lead_phone:      saved.lead_phone ?? null,
      service:         saved.service    ?? null,
    });

  } catch (err) {
    console.error('[/api/chat]', err);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
