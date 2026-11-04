/**
 * Niche-specific agent configuration for the AI booking bot.
 * This repo is 100% dental — only odontologia-implantes is configured.
 */

export type NicheAgentConfig = {
  display_name:        string;
  niche_emoji:         string;
  location_based:      boolean;    // true = technician goes to the customer
  collection_steps:    string;     // numbered list injected into system prompt
  safety_reply_prefix: string;     // prepended to safety trigger response
  guardrails: {
    price_fallback:      string;
    diagnosis_qualifier: string;
    booking_qualifier:   string;
  };
  safety_triggers:       string[];
  notification_template: string;
};

export const NICHE_CONFIGS: Record<string, NicheAgentConfig> = {

  // --------------------------------------------------------------------------
  'odontologia-implantes': {
    display_name:        'Odontologia & Implantes',
    niche_emoji:         '🦷',
    location_based:      false,
    collection_steps: `1. Interesse principal (implante dentário, facetas, lente de contato dental, clareamento, prótese, etc.)
2. Número de dentes ausentes ou área de interesse
3. Possui prótese atual?
4. Urgência (dor, dente quebrado, etc.)
5. Nome e telefone de contato
6. Preferência de dia/período para avaliação
7. Confirme os dados e informe que a clínica entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — inchaço na face com febre pode ser infecção grave, procure atendimento imediato.',
    guardrails: {
      price_fallback:      'os valores são informados pelo dentista após avaliação clínica e radiográfica',
      diagnosis_qualifier: 'apenas o dentista pode indicar o tratamento mais adequado após exame da boca',
      booking_qualifier:   'A clínica confirma a avaliação pelo WhatsApp.',
    },
    safety_triggers: [
      'dor de dente insuportável', 'inchaço no rosto com febre',
      'abscesso dentário', 'infecção na gengiva com febre',
    ],
    notification_template:
      '{emoji} Novo paciente: {lead_name} · {service} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

};

export function getNicheConfig(niche: string): NicheAgentConfig {
  return NICHE_CONFIGS[niche] ?? NICHE_CONFIGS['odontologia-implantes'];
}
