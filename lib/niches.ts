/**
 * Niche-specific agent configuration for the AI booking bot.
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
  oficinas: {
    display_name:        'Oficina Mecânica',
    niche_emoji:         '🔧',
    location_based:      false,
    collection_steps: `1. Serviço necessário
2. Veículo (marca, modelo e ano)
3. Sintomas / problema
4. Urgência (precisa hoje, ou pode aguardar?)
5. Nome e telefone de contato
6. Preferência de dia/período
7. Confirme os dados e informe que a oficina entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — não dirija o veículo nessa condição.',
    guardrails: {
      price_fallback:      'o orçamento é feito pela oficina após avaliação',
      diagnosis_qualifier: 'pode ser isso, mas a oficina confirma na avaliação',
      booking_qualifier:   'A oficina confirma o horário pelo WhatsApp.',
    },
    safety_triggers: [
      'freios falhando', 'freio não para', 'freio falhou',
      'superaquecendo', 'temperatura subindo', 'motor superaquecendo',
      'fumaça', 'cheiro de combustível', 'cheiro de gasolina',
      'cheiro de queimado', 'carro pegando fogo',
    ],
    notification_template:
      '{emoji} Novo pedido: {lead_name} · {vehicle} · {service} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  desentupidora: {
    display_name:        'Desentupidora',
    niche_emoji:         '🪠',
    location_based:      true,
    collection_steps: `1. Tipo de entupimento (pia, vaso, ralo, esgoto externo, caixa de gordura, etc.)
2. Endereço completo do cliente (rua, número, bairro, cidade)
3. Descrição do problema (água parada, transbordando, refluxo, etc.)
4. Urgência (está transbordando agora ou pode aguardar?)
5. Nome e telefone de contato
6. Preferência de dia/horário
7. Confirme os dados e informe que a empresa entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — desligue a água no registro geral se possível.',
    guardrails: {
      price_fallback:      'o orçamento é feito no local após avaliação do entupimento',
      diagnosis_qualifier: 'pode ser isso, mas confirmamos na avaliação presencial',
      booking_qualifier:   'Confirmamos o horário de atendimento pelo WhatsApp.',
    },
    safety_triggers: [
      'esgoto transbordando', 'inundação', 'água subindo rápido',
      'água subindo', 'fossa transbordando', 'esgoto explodindo',
    ],
    notification_template:
      '{emoji} Novo chamado: {lead_name} · {service} · {customer_address} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  chaveiro: {
    display_name:        'Chaveiro',
    niche_emoji:         '🔑',
    location_based:      true,
    collection_steps: `1. Tipo de serviço (abertura de porta, troca de segredo, cópia de chave, cofre, etc.)
2. Endereço ou local onde o cliente está
3. Descrição do problema
4. Urgência (está trancado do lado de fora agora?)
5. Nome e telefone de contato
6. Preferência de horário (ou se é atendimento imediato)
7. Confirme os dados e informe que o chaveiro entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — se houver risco de vida, ligue também para o 193 (Bombeiros).',
    guardrails: {
      price_fallback:      'o orçamento depende do tipo de fechadura e é informado no local',
      diagnosis_qualifier: 'pode ser isso, mas o chaveiro confirma ao chegar',
      booking_qualifier:   'Confirmamos o horário pelo WhatsApp.',
    },
    safety_triggers: [
      'trancado com criança', 'criança trancada', 'bebê trancado',
      'animal trancado', 'pet trancado', 'incêndio', 'emergência',
      'pessoa trancada', 'idoso trancado',
    ],
    notification_template:
      '{emoji} Novo chamado: {lead_name} · {service} · {customer_address} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  'caca-vazamento': {
    display_name:        'Caça-Vazamento',
    niche_emoji:         '💧',
    location_based:      true,
    collection_steps: `1. Tipo de vazamento (água, gás, infiltração, teto, parede)
2. Endereço completo do cliente (rua, número, bairro, cidade)
3. Descrição do problema (onde aparece, há quanto tempo, dano visível)
4. Urgência (está causando dano ativo agora?)
5. Nome e telefone de contato
6. Preferência de dia/período
7. Confirme os dados e informe que o técnico entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — se for gás, feche o registro geral e ventile o ambiente imediatamente. Não acenda chamas nem interruptores.',
    guardrails: {
      price_fallback:      'o orçamento depende da localização e tipo do vazamento, é feito no local',
      diagnosis_qualifier: 'pode ser isso, mas o técnico confirma com equipamento de detecção',
      booking_qualifier:   'Confirmamos o horário de visita pelo WhatsApp.',
    },
    safety_triggers: [
      'cheiro de gás', 'vazamento de gás', 'gás vazando',
      'faísca', 'explosão', 'incêndio', 'fogo',
      'teto cedendo', 'teto caindo', 'laje rachando',
    ],
    notification_template:
      '{emoji} Novo chamado: {lead_name} · {service} · {customer_address} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  dedetizadora: {
    display_name:        'Dedetizadora',
    niche_emoji:         '🐛',
    location_based:      true,
    collection_steps: `1. Tipo de praga (baratas, ratos, formigas, cupins, escorpião, percevejos, etc.)
2. Endereço completo do cliente (rua, número, bairro, cidade)
3. Tamanho do imóvel / área a dedetizar (casa, apartamento, comércio — m² aproximado)
4. Urgência
5. Nome e telefone de contato
6. Preferência de dia/período (geralmente o cliente precisa sair durante a aplicação)
7. Confirme os dados e informe que a empresa entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — afaste-se do animal e não tente capturá-lo.',
    guardrails: {
      price_fallback:      'o orçamento depende do tamanho do imóvel e tipo de praga, é informado após vistoria',
      diagnosis_qualifier: 'pode ser essa praga, mas confirmamos na vistoria presencial',
      booking_qualifier:   'Confirmamos o dia de aplicação pelo WhatsApp.',
    },
    safety_triggers: [
      'escorpião', 'cobra', 'serpente', 'animal peçonhento',
      'picada', 'ferroada', 'ferrado', 'picado',
    ],
    notification_template:
      '{emoji} Novo chamado: {lead_name} · {service} · {customer_address} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  eletricista: {
    display_name:        'Eletricista',
    niche_emoji:         '⚡',
    location_based:      true,
    collection_steps: `1. Tipo de serviço (curto-circuito, instalação, manutenção, disjuntor, tomada, chuveiro, etc.)
2. Endereço completo do cliente (rua, número, bairro, cidade)
3. Descrição do problema
4. Urgência (sem luz agora? risco imediato?)
5. Nome e telefone de contato
6. Preferência de dia/período
7. Confirme os dados e informe que o eletricista entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — desligue o disjuntor geral imediatamente e não toque em fios expostos.',
    guardrails: {
      price_fallback:      'o orçamento é feito no local após avaliar a instalação',
      diagnosis_qualifier: 'pode ser isso, mas o eletricista confirma ao avaliar a instalação',
      booking_qualifier:   'Confirmamos o horário pelo WhatsApp.',
    },
    safety_triggers: [
      'cheiro de queimado', 'faísca', 'curto-circuito', 'curto circuito',
      'incêndio', 'fogo', 'tomando choque', 'levou choque', 'choque elétrico',
      'fio pelado', 'fio exposto', 'fiação pegando fogo',
    ],
    notification_template:
      '{emoji} Novo chamado: {lead_name} · {service} · {customer_address} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  encanador: {
    display_name:        'Encanador',
    niche_emoji:         '🔩',
    location_based:      true,
    collection_steps: `1. Tipo de serviço (vazamento, entupimento, instalação, cano estourado, etc.)
2. Endereço completo do cliente (rua, número, bairro, cidade)
3. Descrição do problema
4. Urgência (água jorrando agora? dano ativo?)
5. Nome e telefone de contato
6. Preferência de dia/período
7. Confirme os dados e informe que o encanador entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — feche o registro de água geral imediatamente.',
    guardrails: {
      price_fallback:      'o orçamento é feito no local após avaliar a instalação',
      diagnosis_qualifier: 'pode ser isso, mas o encanador confirma ao avaliar',
      booking_qualifier:   'Confirmamos o horário pelo WhatsApp.',
    },
    safety_triggers: [
      'cheiro de gás', 'vazamento de gás', 'gás vazando',
      'água jorrando', 'inundação', 'teto cedendo', 'cano estourou',
    ],
    notification_template:
      '{emoji} Novo chamado: {lead_name} · {service} · {customer_address} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  guincho: {
    display_name:        'Guincho / Auto-Socorro',
    niche_emoji:         '🚛',
    location_based:      true,
    collection_steps: `1. Tipo de socorro (guincho, pane seca, bateria, pneu furado, chave travada, superaquecimento, etc.)
2. Localização exata do veículo (endereço, rodovia + km, ponto de referência)
3. Veículo (marca, modelo, ano)
4. Situação atual (na pista, acostamento, estacionamento, garagem)
5. Nome e telefone de contato
6. Urgência (a maioria dos chamados de guincho é imediata — confirme)
7. Confirme os dados e informe o tempo estimado de chegada`,
    safety_reply_prefix: 'Isso parece urgente — ligue também para o 192 (SAMU) se houver feridos e para o 193 (Bombeiros) se houver fogo.',
    guardrails: {
      price_fallback:      'o valor depende da distância e tipo de serviço, informamos ao confirmar o chamado',
      diagnosis_qualifier: 'pode ser isso, mas o técnico avalia ao chegar',
      booking_qualifier:   'Confirmamos o tempo de chegada pelo WhatsApp.',
    },
    safety_triggers: [
      'acidente', 'batida', 'colisão', 'capotou', 'capotamento',
      'pessoa ferida', 'ferido', 'carro pegando fogo', 'veículo pegando fogo',
    ],
    notification_template:
      '{emoji} CHAMADO: {lead_name} · {service} · {customer_address} · {vehicle} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  'ar-condicionado': {
    display_name:        'Ar-Condicionado',
    niche_emoji:         '❄️',
    location_based:      true,
    collection_steps: `1. Tipo de serviço (instalação, manutenção, limpeza, reparo, recarga de gás)
2. Endereço completo do cliente (rua, número, bairro, cidade)
3. Equipamento (marca, BTU, split / janela / cassete — se souber)
4. Descrição do problema ou do que precisa
5. Nome e telefone de contato
6. Preferência de dia/período
7. Confirme os dados e informe que o técnico entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — desligue o aparelho no disjuntor imediatamente.',
    guardrails: {
      price_fallback:      'o orçamento depende do equipamento e tipo de serviço, é informado no local',
      diagnosis_qualifier: 'pode ser isso, mas o técnico confirma na avaliação do equipamento',
      booking_qualifier:   'Confirmamos o horário de visita pelo WhatsApp.',
    },
    safety_triggers: [
      'cheiro de queimado', 'faísca', 'curto', 'fumaça saindo',
      'aparelho pegando fogo', 'vazamento de gás refrigerante', 'cheiro forte de gás',
    ],
    notification_template:
      '{emoji} Novo chamado: {lead_name} · {service} · {customer_address} · {symptom} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  vidracaria: {
    display_name:        'Vidraçaria',
    niche_emoji:         '🪟',
    location_based:      true,
    collection_steps: `1. Tipo de serviço (vidro quebrado, espelho, box de banheiro, janela, porta de vidro, fachada, etc.)
2. Endereço ou se prefere trazer ao estabelecimento
3. Medidas aproximadas e tipo de vidro, se souber
4. Descrição do problema ou do que precisa
5. Nome e telefone de contato
6. Preferência de dia/período
7. Confirme os dados e informe que a vidraçaria entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — afaste todos do vidro quebrado e cubra ferimentos com pano limpo.',
    guardrails: {
      price_fallback:      'o orçamento depende das medidas e tipo de vidro, é informado após avaliação',
      diagnosis_qualifier: 'pode ser esse o problema, mas confirmamos ao ver presencialmente',
      booking_qualifier:   'Confirmamos o horário pelo WhatsApp.',
    },
    safety_triggers: [
      'pessoa cortada', 'cortou', 'ferido', 'sangramento',
      'corte profundo', 'criança cortada', 'vidro em cima',
    ],
    notification_template:
      '{emoji} Novo pedido: {lead_name} · {service} · {customer_address} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  'limpeza-de-estofados': {
    display_name:        'Limpeza de Estofados',
    niche_emoji:         '🛋️',
    location_based:      true,
    collection_steps: `1. Tipo de estofado (sofá, cadeira, poltrona, banco de carro, colchão, tapete — quantas peças)
2. Endereço ou se prefere levar ao estabelecimento
3. Condição atual (manchas, mofo, odor, uso intenso, etc.)
4. Urgência
5. Nome e telefone de contato
6. Preferência de dia/período
7. Confirme os dados e informe que a empresa entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — ventile bem o ambiente e evite exposição prolongada ao mofo.',
    guardrails: {
      price_fallback:      'o orçamento depende da quantidade de peças e estado de conservação',
      diagnosis_qualifier: 'pode ser isso, mas confirmamos ao avaliar o estofado',
      booking_qualifier:   'Confirmamos o dia de atendimento pelo WhatsApp.',
    },
    safety_triggers: [
      'mofo intenso', 'alergia grave', 'dificuldade para respirar',
      'criança doente', 'reação alérgica',
    ],
    notification_template:
      '{emoji} Novo pedido: {lead_name} · {service} · {customer_address} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // ==========================================================================
  // GROUP A — Same-day / on-demand service (technician goes to customer)
  // ==========================================================================

  // --------------------------------------------------------------------------
  'mudancas-planejadas': {
    display_name:        'Mudanças Planejadas',
    niche_emoji:         '📦',
    location_based:      true,
    collection_steps: `1. Endereço de origem (rua, número, bairro, cidade)
2. Endereço de destino (rua, número, bairro, cidade)
3. Tamanho da mudança (studio, 1 quarto, 2 quartos, casa, escritório, etc.)
4. Itens especiais (piano, cofre, aquário, máquinas pesadas)
5. Data desejada para a mudança
6. Nome e telefone de contato
7. Confirme os dados e informe que a empresa enviará um orçamento`,
    safety_reply_prefix: 'Entendido — nossa equipe entrará em contato o mais rápido possível.',
    guardrails: {
      price_fallback:      'o orçamento depende da distância, volume e data — enviamos após avaliação',
      diagnosis_qualifier: 'estimamos isso, mas confirmamos no orçamento detalhado',
      booking_qualifier:   'Confirmamos data e horário pelo WhatsApp após envio do orçamento.',
    },
    safety_triggers: [],
    notification_template:
      '{emoji} Nova mudança: {lead_name} · {symptom} → {customer_address} · {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  'mudancas-corporativas': {
    display_name:        'Mudanças Corporativas',
    niche_emoji:         '🏢',
    location_based:      true,
    collection_steps: `1. Endereço de origem (empresa, andar, sala)
2. Endereço de destino
3. Porte da mudança (número de estações de trabalho, servidores, arquivos, etc.)
4. Necessidade de desmontagem/montagem de móveis
5. Data desejada (mudanças corporativas geralmente são fora do horário comercial)
6. Nome, cargo e telefone de contato
7. Confirme os dados e informe que enviaremos um consultor para orçamento`,
    safety_reply_prefix: 'Entendido — nossa equipe de atendimento corporativo entrará em contato.',
    guardrails: {
      price_fallback:      'o orçamento corporativo é feito por um consultor após vistoria',
      diagnosis_qualifier: 'estimamos isso, mas o consultor confirmará na vistoria',
      booking_qualifier:   'Nossa equipe comercial confirmará a visita técnica pelo WhatsApp.',
    },
    safety_triggers: [],
    notification_template:
      '{emoji} Mudança corp.: {lead_name} · {symptom} → {customer_address} · {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  'pintura-residencial': {
    display_name:        'Pintura Residencial',
    niche_emoji:         '🖌️',
    location_based:      true,
    collection_steps: `1. Tipo de serviço (pintura interna, externa, textura, grafite, epóxi, etc.)
2. Endereço do imóvel (rua, número, bairro, cidade)
3. Área aproximada em m² ou número de cômodos
4. Condição atual das paredes (precisa de massa, raspagem, há umidade?)
5. Nome e telefone de contato
6. Preferência de dia para visita de orçamento
7. Confirme os dados e informe que enviaremos um pintor para orçamento gratuito`,
    safety_reply_prefix: 'Entendido — nossa equipe entrará em contato em breve.',
    guardrails: {
      price_fallback:      'o orçamento depende da área, tipo de tinta e estado das paredes — é gratuito e feito no local',
      diagnosis_qualifier: 'estimamos isso, mas confirmamos na visita',
      booking_qualifier:   'Agendaremos a visita de orçamento pelo WhatsApp.',
    },
    safety_triggers: [
      'parede com mofo grave', 'infiltração grave', 'teto caindo',
    ],
    notification_template:
      '{emoji} Orçamento: {lead_name} · {service} · {customer_address} · visita em {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  impermeabilizacao: {
    display_name:        'Impermeabilização',
    niche_emoji:         '🛡️',
    location_based:      true,
    collection_steps: `1. Área a impermeabilizar (laje, telhado, banheiro, piscina, parede, subsolo, etc.)
2. Endereço do imóvel (rua, número, bairro, cidade)
3. Descrição do problema (infiltração, goteira, umidade, eflorescência, há quanto tempo)
4. Área aproximada em m²
5. Nome e telefone de contato
6. Preferência de dia para visita técnica gratuita
7. Confirme os dados e informe que agendaremos a visita`,
    safety_reply_prefix: 'Isso parece urgente — se houver risco de desabamento, evacue a área imediatamente.',
    guardrails: {
      price_fallback:      'o orçamento depende da área e tipo de sistema — visita técnica gratuita',
      diagnosis_qualifier: 'pode ser isso, mas o técnico confirma na vistoria',
      booking_qualifier:   'Agendaremos a visita técnica gratuita pelo WhatsApp.',
    },
    safety_triggers: [
      'teto cedendo', 'laje rachando', 'desabamento', 'estrutura comprometida',
    ],
    notification_template:
      '{emoji} Orçamento: {lead_name} · {service} · {customer_address} · visita em {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // ==========================================================================
  // GROUP B — Visit-first / project-based (free assessment → quote → schedule)
  // ==========================================================================

  // --------------------------------------------------------------------------
  funilaria: {
    display_name:        'Funilaria e Pintura',
    niche_emoji:         '🚘',
    location_based:      false,
    collection_steps: `1. Veículo (marca, modelo e ano)
2. Descrição dos danos (amassado, riscado, batida, corrosão, etc.)
3. Possui seguro? (se sim, qual seguradora)
4. Urgência (veículo circulando ou parado?)
5. Nome e telefone de contato
6. Preferência de dia/período para deixar o carro
7. Confirme os dados e informe que a funilaria entrará em contato`,
    safety_reply_prefix: 'Entendido — se o veículo não estiver em condições de circular, chame um guincho.',
    guardrails: {
      price_fallback:      'o orçamento depende da extensão dos danos e é feito com o veículo presente',
      diagnosis_qualifier: 'pode ser isso, mas confirmamos com o veículo na oficina',
      booking_qualifier:   'Confirmamos o dia de entrada pelo WhatsApp.',
    },
    safety_triggers: [
      'carro pegando fogo', 'veículo pegando fogo', 'acidente grave', 'ferido',
    ],
    notification_template:
      '{emoji} Novo pedido: {lead_name} · {vehicle} · {symptom} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  marmoraria: {
    display_name:        'Marmoraria',
    niche_emoji:         '🪨',
    location_based:      true,
    collection_steps: `1. Tipo de material e aplicação (bancada de cozinha, banheiro, piso, escada, soleira, etc.)
2. Endereço do imóvel (rua, número, bairro, cidade)
3. Medidas aproximadas (comprimento × largura em metros, se souber)
4. Preferência de material (mármore, granito, quartzo, porcelanato, etc.)
5. Nome e telefone de contato
6. Preferência de dia para visita de medição e orçamento
7. Confirme os dados e informe que agendaremos a visita`,
    safety_reply_prefix: 'Entendido — nossa equipe entrará em contato.',
    guardrails: {
      price_fallback:      'o orçamento depende do material e medidas — visita de medição gratuita',
      diagnosis_qualifier: 'estimamos isso, mas confirmamos na medição',
      booking_qualifier:   'Agendaremos a visita de medição e orçamento pelo WhatsApp.',
    },
    safety_triggers: [],
    notification_template:
      '{emoji} Orçamento: {lead_name} · {service} · {customer_address} · visita em {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  'esquadrias-aluminio': {
    display_name:        'Esquadrias de Alumínio',
    niche_emoji:         '🪟',
    location_based:      true,
    collection_steps: `1. Tipo de produto (janela, porta, porta-balcão, fachada, cobertura, etc.)
2. Endereço do imóvel (rua, número, bairro, cidade)
3. Medidas aproximadas e quantidade de peças (se souber)
4. Tipo de alumínio e vidro desejado (se tiver preferência)
5. Nome e telefone de contato
6. Preferência de dia para visita técnica de medição
7. Confirme os dados e informe que agendaremos a visita`,
    safety_reply_prefix: 'Entendido — nossa equipe entrará em contato.',
    guardrails: {
      price_fallback:      'o orçamento depende das medidas e especificações — visita técnica gratuita',
      diagnosis_qualifier: 'estimamos isso, mas confirmamos na medição',
      booking_qualifier:   'Agendaremos a visita de medição pelo WhatsApp.',
    },
    safety_triggers: [],
    notification_template:
      '{emoji} Orçamento: {lead_name} · {service} · {customer_address} · visita em {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  serralheria: {
    display_name:        'Serralheria',
    niche_emoji:         '⚙️',
    location_based:      true,
    collection_steps: `1. Tipo de serviço (portão, grade, escada, corrimão, estrutura metálica, reparo, etc.)
2. Endereço do imóvel (rua, número, bairro, cidade)
3. Material desejado (ferro, aço inox, alumínio) e medidas aproximadas
4. Descrição do projeto ou problema
5. Nome e telefone de contato
6. Preferência de dia para visita de orçamento
7. Confirme os dados e informe que agendaremos a visita`,
    safety_reply_prefix: 'Entendido — nossa equipe entrará em contato.',
    guardrails: {
      price_fallback:      'o orçamento depende do projeto e material — visita gratuita',
      diagnosis_qualifier: 'estimamos isso, mas confirmamos na visita',
      booking_qualifier:   'Agendaremos a visita de orçamento pelo WhatsApp.',
    },
    safety_triggers: [
      'portão caindo', 'grade caindo', 'estrutura cedendo',
    ],
    notification_template:
      '{emoji} Orçamento: {lead_name} · {service} · {customer_address} · visita em {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  'box-envidracamento': {
    display_name:        'Box e Envidraçamento',
    niche_emoji:         '🚿',
    location_based:      true,
    collection_steps: `1. Tipo de produto (box de banheiro, sacada de vidro, guarda-corpo, cobertura, etc.)
2. Endereço do imóvel (rua, número, bairro, cidade)
3. Medidas aproximadas (se souber)
4. Tipo de abertura (deslizante, articulado, dobrável, fixo)
5. Nome e telefone de contato
6. Preferência de dia para visita de medição e orçamento
7. Confirme os dados e informe que agendaremos a visita`,
    safety_reply_prefix: 'Entendido — nossa equipe entrará em contato.',
    guardrails: {
      price_fallback:      'o orçamento depende das medidas e modelo — visita de medição gratuita',
      diagnosis_qualifier: 'estimamos isso, mas confirmamos na medição',
      booking_qualifier:   'Agendaremos a visita de medição pelo WhatsApp.',
    },
    safety_triggers: [
      'vidro estilhaçado', 'vidro quebrado com ferido', 'pessoa cortada', 'sangramento',
    ],
    notification_template:
      '{emoji} Orçamento: {lead_name} · {service} · {customer_address} · visita em {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  'persianas-cortinas': {
    display_name:        'Persianas e Cortinas',
    niche_emoji:         '🪞',
    location_based:      true,
    collection_steps: `1. Tipo de produto (persiana, cortina, blackout, rolo, romana, painel, etc.)
2. Endereço do imóvel (rua, número, bairro, cidade)
3. Número de janelas ou cômodos a cobrir
4. Medidas aproximadas ou se prefere que façamos a medição
5. Nome e telefone de contato
6. Preferência de dia para visita de medição e orçamento
7. Confirme os dados e informe que agendaremos a visita`,
    safety_reply_prefix: 'Entendido — nossa equipe entrará em contato.',
    guardrails: {
      price_fallback:      'o orçamento depende do produto e medidas — visita gratuita',
      diagnosis_qualifier: 'estimamos isso, mas confirmamos na medição',
      booking_qualifier:   'Agendaremos a visita de medição e orçamento pelo WhatsApp.',
    },
    safety_triggers: [],
    notification_template:
      '{emoji} Orçamento: {lead_name} · {service} · {customer_address} · visita em {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  marcenaria: {
    display_name:        'Marcenaria',
    niche_emoji:         '🪵',
    location_based:      true,
    collection_steps: `1. Tipo de móvel ou serviço (armário, cozinha planejada, closet, home office, reparo, etc.)
2. Endereço do imóvel (rua, número, bairro, cidade)
3. Medidas do espaço em metros (largura × altura × profundidade aproximados)
4. Material/acabamento desejado (MDF, madeira maciça, laminado, cor, etc.)
5. Nome e telefone de contato
6. Preferência de dia para visita de medição e orçamento
7. Confirme os dados e informe que agendaremos a visita`,
    safety_reply_prefix: 'Entendido — nossa equipe entrará em contato.',
    guardrails: {
      price_fallback:      'o orçamento depende do projeto, medidas e material — visita gratuita',
      diagnosis_qualifier: 'estimamos isso, mas confirmamos com a medição do espaço',
      booking_qualifier:   'Agendaremos a visita de medição e orçamento pelo WhatsApp.',
    },
    safety_triggers: [],
    notification_template:
      '{emoji} Orçamento: {lead_name} · {service} · {customer_address} · visita em {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  'pedras-bancadas': {
    display_name:        'Pedras e Bancadas',
    niche_emoji:         '🪨',
    location_based:      true,
    collection_steps: `1. Tipo de aplicação (bancada de cozinha, banheiro, churrasqueira, área externa, etc.)
2. Endereço do imóvel (rua, número, bairro, cidade)
3. Medidas aproximadas da bancada (comprimento × largura)
4. Tipo de pedra desejado (granito, mármore, quartzito, silestone, etc.)
5. Nome e telefone de contato
6. Preferência de dia para visita de medição
7. Confirme os dados e informe que agendaremos a visita`,
    safety_reply_prefix: 'Entendido — nossa equipe entrará em contato.',
    guardrails: {
      price_fallback:      'o orçamento depende do tipo de pedra e medidas — visita de medição gratuita',
      diagnosis_qualifier: 'estimamos isso, mas confirmamos com a pedra em mãos e medição',
      booking_qualifier:   'Agendaremos a visita de medição pelo WhatsApp.',
    },
    safety_triggers: [],
    notification_template:
      '{emoji} Orçamento: {lead_name} · {service} · {customer_address} · visita em {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  reformas: {
    display_name:        'Reformas',
    niche_emoji:         '🏗️',
    location_based:      true,
    collection_steps: `1. Tipo de reforma (banheiro, cozinha, lavabo, área de serviço, reforma completa, etc.)
2. Endereço do imóvel (rua, número, bairro, cidade)
3. Escopo resumido (o que precisa ser feito)
4. Imóvel ocupado ou vago durante a reforma?
5. Nome e telefone de contato
6. Preferência de dia para visita técnica de orçamento
7. Confirme os dados e informe que agendaremos a visita`,
    safety_reply_prefix: 'Isso parece urgente — se houver risco estrutural, evacue a área e ligue para o 193 (Bombeiros).',
    guardrails: {
      price_fallback:      'o orçamento depende do escopo completo — visita técnica gratuita',
      diagnosis_qualifier: 'estimamos isso, mas o engenheiro/mestre de obras confirma na visita',
      booking_qualifier:   'Agendaremos a visita técnica de orçamento pelo WhatsApp.',
    },
    safety_triggers: [
      'parede rachando', 'viga cedendo', 'laje cedendo', 'desabamento',
      'estrutura comprometida', 'teto caindo',
    ],
    notification_template:
      '{emoji} Orçamento: {lead_name} · {service} · {customer_address} · visita em {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  telhados: {
    display_name:        'Telhados',
    niche_emoji:         '🏠',
    location_based:      true,
    collection_steps: `1. Tipo de serviço (reparo, troca, limpeza, impermeabilização, telhado novo, etc.)
2. Endereço do imóvel (rua, número, bairro, cidade)
3. Tipo de telhado (cerâmica, fibrocimento, metálico, shingle, laje, etc.) e área aproximada
4. Problema atual (goteira, telha quebrada, mofo, calha entupida, etc.)
5. Nome e telefone de contato
6. Preferência de dia para visita técnica
7. Confirme os dados e informe que agendaremos a visita`,
    safety_reply_prefix: 'Isso parece urgente — afaste-se da área e não acesse o telhado sem equipamento de segurança.',
    guardrails: {
      price_fallback:      'o orçamento depende da área e tipo de serviço — visita técnica gratuita',
      diagnosis_qualifier: 'pode ser isso, mas o técnico confirma ao inspecionar o telhado',
      booking_qualifier:   'Agendaremos a visita técnica pelo WhatsApp.',
    },
    safety_triggers: [
      'telhado caindo', 'desabamento', 'estrutura cedendo', 'viga apodrecida',
    ],
    notification_template:
      '{emoji} Orçamento: {lead_name} · {service} · {customer_address} · visita em {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  'energia-solar': {
    display_name:        'Energia Solar',
    niche_emoji:         '☀️',
    location_based:      true,
    collection_steps: `1. Tipo de instalação (residencial, comercial, rural, bombeamento)
2. Endereço do imóvel (rua, número, bairro, cidade)
3. Valor médio da conta de luz (em R$) — fundamental para o dimensionamento
4. Tipo de telhado ou estrutura disponível para os painéis
5. Nome e telefone de contato
6. Preferência de dia para visita técnica gratuita
7. Confirme os dados e informe que agendaremos a visita`,
    safety_reply_prefix: 'Isso parece urgente — desligue o inversor imediatamente e não toque nos painéis.',
    guardrails: {
      price_fallback:      'o sistema é dimensionado com base no consumo — visita técnica e orçamento gratuitos',
      diagnosis_qualifier: 'estimamos isso, mas o engenheiro confirma no projeto técnico',
      booking_qualifier:   'Agendaremos a visita técnica gratuita pelo WhatsApp.',
    },
    safety_triggers: [
      'painel pegando fogo', 'inversor com fumaça', 'choque elétrico', 'curto no inversor',
      'faísca no painel',
    ],
    notification_template:
      '{emoji} Orçamento solar: {lead_name} · {service} · {customer_address} · conta R${symptom} · visita em {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  piscinas: {
    display_name:        'Piscinas',
    niche_emoji:         '🏊',
    location_based:      true,
    collection_steps: `1. Tipo de serviço (construção, reforma, manutenção, limpeza, automação, aquecimento)
2. Endereço do imóvel (rua, número, bairro, cidade)
3. Tipo e tamanho da piscina (se já existir)
4. Para construção: área disponível e tipo desejado (alvenaria, fibra, vinil)
5. Nome e telefone de contato
6. Preferência de dia para visita técnica
7. Confirme os dados e informe que agendaremos a visita`,
    safety_reply_prefix: 'Isso parece urgente — se houver risco elétrico, desligue o disjuntor da bomba imediatamente.',
    guardrails: {
      price_fallback:      'o orçamento depende do projeto e especificações — visita técnica gratuita',
      diagnosis_qualifier: 'pode ser isso, mas o técnico confirma na vistoria',
      booking_qualifier:   'Agendaremos a visita técnica pelo WhatsApp.',
    },
    safety_triggers: [
      'choque na piscina', 'choque elétrico', 'pessoa se afogando', 'bomba pegando fogo',
    ],
    notification_template:
      '{emoji} Orçamento: {lead_name} · {service} · {customer_address} · visita em {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  'portoes-automaticos': {
    display_name:        'Portões Automáticos',
    niche_emoji:         '🚪',
    location_based:      true,
    collection_steps: `1. Tipo de serviço (instalação, manutenção, reparo, controle remoto, motor, etc.)
2. Endereço (rua, número, bairro, cidade)
3. Tipo de portão (deslizante, basculante, pivotante, social) e material (ferro, alumínio, madeira)
4. Marca do motor, se houver (Nice, PPA, Rossi, Garen, etc.)
5. Nome e telefone de contato
6. Preferência de dia/horário
7. Confirme os dados e informe que o técnico entrará em contato`,
    safety_reply_prefix: 'Entendido — se o portão estiver bloqueando a saída em emergência, ligue para o 193 (Bombeiros).',
    guardrails: {
      price_fallback:      'o orçamento depende do tipo de portão e serviço — informamos ao avaliar',
      diagnosis_qualifier: 'pode ser isso, mas o técnico confirma ao ver o motor',
      booking_qualifier:   'Confirmamos o horário de visita pelo WhatsApp.',
    },
    safety_triggers: [
      'portão travado com pessoa', 'emergência saída bloqueada', 'criança presa',
    ],
    notification_template:
      '{emoji} Chamado: {lead_name} · {service} · {customer_address} · {symptom} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  'cameras-seguranca': {
    display_name:        'Câmeras e Segurança Eletrônica',
    niche_emoji:         '📹',
    location_based:      true,
    collection_steps: `1. Tipo de serviço (instalação, manutenção, ampliação, alarme, controle de acesso)
2. Endereço (rua, número, bairro, cidade)
3. Tipo de local (residência, comércio, condomínio, empresa)
4. Número de câmeras desejadas ou pontos de alarme (aproximado)
5. Nome e telefone de contato
6. Preferência de dia para visita técnica de orçamento
7. Confirme os dados e informe que agendaremos a visita`,
    safety_reply_prefix: 'Entendido — se houver invasão em andamento, ligue imediatamente para o 190 (Polícia).',
    guardrails: {
      price_fallback:      'o orçamento depende do projeto e equipamentos — visita técnica gratuita',
      diagnosis_qualifier: 'pode ser isso, mas o técnico confirma na vistoria',
      booking_qualifier:   'Agendaremos a visita técnica de orçamento pelo WhatsApp.',
    },
    safety_triggers: [
      'invasão em andamento', 'ladrão dentro de casa', 'assalto',
    ],
    notification_template:
      '{emoji} Orçamento: {lead_name} · {service} · {customer_address} · visita em {preferred_slot} · {lead_phone} · {timing_label}',
  },


  // --------------------------------------------------------------------------
  'moveis-planejados': {
    display_name:        'Móveis Planejados',
    niche_emoji:         '🪑',
    location_based:      true,
    collection_steps: `1. Ambiente (cozinha, quarto, closet, home office, sala, escritório, etc.)
2. Endereço do imóvel (rua, número, bairro, cidade)
3. Medidas aproximadas do espaço (largura × altura × profundidade)
4. Preferência de material/acabamento (MDF, madeira, cor, etc.)
5. Nome e telefone de contato
6. Preferência de dia para visita de medição e orçamento
7. Confirme os dados e informe que agendaremos a visita`,
    safety_reply_prefix: 'Entendido — nossa equipe entrará em contato.',
    guardrails: {
      price_fallback:      'o orçamento é feito após visita técnica e medição do espaço',
      diagnosis_qualifier: 'estimamos isso, mas confirmamos com a medição do espaço',
      booking_qualifier:   'Agendaremos a visita de medição e orçamento pelo WhatsApp.',
    },
    safety_triggers: [],
    notification_template:
      '{emoji} Orçamento: {lead_name} · {service} · {customer_address} · visita em {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  'cirurgia-plastica': {
    display_name:        'Cirurgia Plástica',
    niche_emoji:         '⚕️',
    location_based:      false,
    collection_steps: `1. Procedimento de interesse (rinoplastia, lipoaspiração, mamoplastia, abdominoplastia, etc.)
2. Dúvidas ou preocupações gerais
3. Urgência (há algum prazo?)
4. Nome e telefone de contato
5. Preferência de dia/período para consulta de avaliação
6. Confirme os dados e informe que a clínica entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — procure atendimento médico imediatamente se for pós-operatório.',
    guardrails: {
      price_fallback:      'os valores são informados pelo médico após consulta de avaliação',
      diagnosis_qualifier: 'apenas o cirurgião plástico pode indicar o procedimento mais adequado após avaliação presencial',
      booking_qualifier:   'A clínica confirma a consulta de avaliação pelo WhatsApp.',
    },
    safety_triggers: [
      'dor intensa no peito', 'dificuldade para respirar', 'reação alérgica grave',
      'sangramento excessivo', 'febre alta após cirurgia', 'complicação pós-operatória',
    ],
    notification_template:
      '{emoji} Novo paciente: {lead_name} · {service} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  'dermatologia-estetica': {
    display_name:        'Dermatologia & Estética',
    niche_emoji:         '✨',
    location_based:      false,
    collection_steps: `1. Tratamento ou procedimento de interesse (botox, preenchimento, peeling, laser, etc.)
2. Principal queixa ou objetivo (manchas, rugas, acne, harmonização, etc.)
3. Urgência
4. Nome e telefone de contato
5. Preferência de dia/período para avaliação
6. Confirme os dados e informe que a clínica entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — procure atendimento médico se for reação pós-procedimento.',
    guardrails: {
      price_fallback:      'os valores são informados pelo especialista após avaliação da pele',
      diagnosis_qualifier: 'apenas o dermatologista pode indicar o tratamento mais adequado após avaliação',
      booking_qualifier:   'A clínica confirma o agendamento pelo WhatsApp.',
    },
    safety_triggers: [
      'alergia grave', 'reação alérgica intensa', 'inchaço no rosto',
      'dificuldade para respirar', 'queimadura química',
    ],
    notification_template:
      '{emoji} Novo paciente: {lead_name} · {service} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  ortopedia: {
    display_name:        'Ortopedia',
    niche_emoji:         '🦴',
    location_based:      false,
    collection_steps: `1. Região do corpo afetada (joelho, coluna, ombro, quadril, tornozelo, etc.)
2. Sintoma principal (dor, inchaço, limitação de movimento, etc.)
3. Há quanto tempo apresenta o problema
4. Urgência (dor intensa, trauma recente, etc.)
5. Nome e telefone de contato
6. Preferência de dia/período para consulta
7. Confirme os dados e informe que a clínica entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — não force o movimento e procure atendimento imediato se houver suspeita de fratura.',
    guardrails: {
      price_fallback:      'os valores são informados pelo médico após avaliação',
      diagnosis_qualifier: 'apenas o ortopedista pode diagnosticar após exame clínico e imagem',
      booking_qualifier:   'A clínica confirma a consulta pelo WhatsApp.',
    },
    safety_triggers: [
      'fratura exposta', 'osso aparecendo', 'dor insuportável',
      'não consigo mover', 'paralisia', 'perda de sensibilidade nos membros',
    ],
    notification_template:
      '{emoji} Novo paciente: {lead_name} · {symptom} · {service} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  fertilidade: {
    display_name:        'Fertilidade & Reprodução',
    niche_emoji:         '🌱',
    location_based:      false,
    collection_steps: `1. Tratamento de interesse (FIV, inseminação, congelamento de óvulos, avaliação geral, etc.)
2. Situação atual (tentando engravidar há quanto tempo, algum diagnóstico anterior?)
3. Urgência
4. Nome e telefone de contato
5. Preferência de dia/período para consulta inicial
6. Confirme os dados e informe que a clínica entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — procure atendimento médico imediatamente.',
    guardrails: {
      price_fallback:      'os valores e protocolos são definidos pelo especialista após avaliação completa do casal',
      diagnosis_qualifier: 'o especialista irá indicar o tratamento mais adequado após avaliação',
      booking_qualifier:   'A clínica confirma a consulta pelo WhatsApp.',
    },
    safety_triggers: [
      'dor pélvica intensa', 'gravidez ectópica', 'sangramento intenso', 'emergência obstétrica',
    ],
    notification_template:
      '{emoji} Novo paciente: {lead_name} · {service} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  'transplante-capilar': {
    display_name:        'Transplante Capilar',
    niche_emoji:         '💆',
    location_based:      false,
    collection_steps: `1. Tipo de queda (calvície frontal, coroa, difusa, barba, sobrancelha)
2. Área afetada (tamanho da região calva aproximado)
3. Já realizou algum tratamento anterior para queda?
4. Nome e telefone de contato
5. Preferência de dia/período para avaliação gratuita
6. Confirme os dados e informe que a clínica entrará em contato`,
    safety_reply_prefix: 'Entendido — nossa equipe entrará em contato.',
    guardrails: {
      price_fallback:      'o número de grafts e o valor são definidos após avaliação capilar gratuita',
      diagnosis_qualifier: 'apenas o especialista pode indicar a técnica mais adequada após avaliação do couro cabeludo',
      booking_qualifier:   'A clínica confirma a avaliação gratuita pelo WhatsApp.',
    },
    safety_triggers: [
      'queda de cabelo repentina e total', 'alopecia areata grave',
    ],
    notification_template:
      '{emoji} Novo paciente: {lead_name} · {service} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  oftalmologia: {
    display_name:        'Oftalmologia',
    niche_emoji:         '👁️',
    location_based:      false,
    collection_steps: `1. Principal queixa ou procedimento de interesse (miopia, catarata, LASIK, check-up, etc.)
2. Sintomas atuais (visão embaçada, dor, lacrimejamento, etc.)
3. Usa óculos ou lentes de contato?
4. Urgência
5. Nome e telefone de contato
6. Preferência de dia/período para consulta
7. Confirme os dados e informe que a clínica entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — perda súbita de visão é emergência oftalmológica, procure pronto-socorro imediatamente.',
    guardrails: {
      price_fallback:      'os valores são informados pelo médico após exame completo de vista',
      diagnosis_qualifier: 'apenas o oftalmologista pode diagnosticar após exames específicos',
      booking_qualifier:   'A clínica confirma a consulta pelo WhatsApp.',
    },
    safety_triggers: [
      'perda súbita de visão', 'flashes de luz intensos', 'véu escuro na visão',
      'olho vermelho com dor intensa', 'trauma ocular', 'corpo estranho no olho',
    ],
    notification_template:
      '{emoji} Novo paciente: {lead_name} · {service} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  'cirurgia-bariatrica': {
    display_name:        'Cirurgia Bariátrica',
    niche_emoji:         '⚕️',
    location_based:      false,
    collection_steps: `1. Procedimento de interesse (sleeve, bypass, balão gástrico, endoscopia bariátrica, etc.)
2. IMC aproximado ou peso atual (para verificar indicação básica)
3. Tentativas anteriores de emagrecimento
4. Urgência
5. Nome e telefone de contato
6. Preferência de dia/período para avaliação
7. Confirme os dados e informe que a clínica entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — complicações pós-operatórias requerem atendimento médico imediato.',
    guardrails: {
      price_fallback:      'os valores variam por procedimento e são informados pelo especialista após avaliação',
      diagnosis_qualifier: 'apenas o cirurgião pode indicar o procedimento mais adequado após avaliação completa',
      booking_qualifier:   'A clínica confirma a consulta pelo WhatsApp.',
    },
    safety_triggers: [
      'dor abdominal intensa', 'vômitos constantes', 'febre após cirurgia',
      'deiscência de sutura', 'complicação bariátrica',
    ],
    notification_template:
      '{emoji} Novo paciente: {lead_name} · {service} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  fisioterapia: {
    display_name:        'Fisioterapia & Reabilitação',
    niche_emoji:         '🏥',
    location_based:      false,
    collection_steps: `1. Região do corpo / problema (coluna, joelho, ombro, pós-operatório, neurológico, etc.)
2. Sintoma principal (dor, limitação de movimento, fraqueza muscular, etc.)
3. Há quanto tempo apresenta o problema
4. Possui encaminhamento médico?
5. Nome e telefone de contato
6. Preferência de dia/período para avaliação inicial
7. Confirme os dados e informe que a clínica entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — procure atendimento médico imediato se houver perda de sensibilidade ou paralisia.',
    guardrails: {
      price_fallback:      'os valores são informados após avaliação inicial com o fisioterapeuta',
      diagnosis_qualifier: 'apenas o fisioterapeuta pode avaliar e indicar o tratamento após exame físico',
      booking_qualifier:   'A clínica confirma a sessão pelo WhatsApp.',
    },
    safety_triggers: [
      'paralisia', 'perda de sensibilidade', 'incontinência urinária repentina',
      'dor irradiando para o braço com falta de ar',
    ],
    notification_template:
      '{emoji} Novo paciente: {lead_name} · {symptom} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

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

  // --------------------------------------------------------------------------
  'cirurgia-estetica-corporal': {
    display_name:        'Estética Corporal',
    niche_emoji:         '✨',
    location_based:      false,
    collection_steps: `1. Principal preocupação ou área do corpo (abdômen, flancos, coxas, braços, etc.)
2. Tratamento de interesse (criolipólise, radiofrequência, HIFU, cavitação, etc.)
3. Já realizou algum tratamento corporal anteriormente?
4. Urgência
5. Nome e telefone de contato
6. Preferência de dia/período para avaliação
7. Confirme os dados e informe que a clínica entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — reações intensas após procedimento requerem avaliação médica imediata.',
    guardrails: {
      price_fallback:      'os valores são informados pelo especialista após avaliação corporal',
      diagnosis_qualifier: 'apenas o especialista pode indicar o tratamento mais eficaz após avaliação',
      booking_qualifier:   'A clínica confirma a avaliação pelo WhatsApp.',
    },
    safety_triggers: [
      'alergia grave ao procedimento', 'reação intensa após sessão',
      'queimadura por equipamento', 'dor insuportável pós procedimento',
    ],
    notification_template:
      '{emoji} Novo paciente: {lead_name} · {service} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  'diagnostico-imagem': {
    display_name:        'Diagnóstico por Imagem',
    niche_emoji:         '🏥',
    location_based:      false,
    collection_steps: `1. Tipo de exame (tomografia, ressonância, ultrassom, mamografia, ecocardiograma, etc.)
2. Possui pedido médico?
3. Urgência (o médico solicitou com prioridade?)
4. Dúvidas sobre preparo ou jejum para o exame
5. Nome e telefone de contato
6. Preferência de dia/período para o exame
7. Confirme os dados e informe que a equipe confirmará o agendamento`,
    safety_reply_prefix: 'Isso parece urgente — em emergência médica, procure pronto-socorro imediatamente.',
    guardrails: {
      price_fallback:      'os valores são informados pela equipe de agendamento',
      diagnosis_qualifier: 'a interpretação dos exames é realizada pelo médico solicitante',
      booking_qualifier:   'O centro confirma o agendamento pelo WhatsApp.',
    },
    safety_triggers: [
      'dor no peito com suspeita de infarto', 'AVC suspeito', 'trauma grave', 'emergência médica',
    ],
    notification_template:
      '{emoji} Novo paciente: {lead_name} · {service} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

  // --------------------------------------------------------------------------
  'veterinaria-especializada': {
    display_name:        'Veterinária Especializada',
    niche_emoji:         '🐾',
    location_based:      false,
    collection_steps: `1. Espécie e raça do animal (cão, gato, etc.)
2. Idade do animal
3. Sintoma ou especialidade necessária (cardiologia, oncologia, ortopedia, neurologia, etc.)
4. Urgência (o animal está em sofrimento agora?)
5. Nome do tutor e telefone de contato
6. Preferência de dia/período para consulta
7. Confirme os dados e informe que o hospital entrará em contato`,
    safety_reply_prefix: 'Isso parece urgente — animal inconsciente, convulsionando ou com dificuldade para respirar precisa de atendimento de emergência imediato.',
    guardrails: {
      price_fallback:      'os valores são informados pelo especialista após avaliação do animal',
      diagnosis_qualifier: 'apenas o veterinário especialista pode diagnosticar após exame clínico e exames complementares',
      booking_qualifier:   'O hospital confirma a consulta pelo WhatsApp.',
    },
    safety_triggers: [
      'animal inconsciente', 'convulsão', 'dificuldade para respirar',
      'sangramento intenso', 'suspeita de envenenamento', 'atropelamento',
    ],
    notification_template:
      '{emoji} Novo tutor: {lead_name} · {service} · {symptom} · quer {preferred_slot} · {lead_phone} · {timing_label}',
  },

};

// Slug aliases
const ALIASES: Record<string, string> = {
  'vidracao':             'vidracaria',
  'mudancas':             'mudancas-planejadas',
  'pintura':              'pintura-residencial',
  'box':                  'box-envidracamento',
  'persianas':            'persianas-cortinas',
  'portoes':              'portoes-automaticos',
  'cameras':              'cameras-seguranca',
  'energia':              'energia-solar',
  'pedras':               'pedras-bancadas',
  'esquadrias':           'esquadrias-aluminio',
};

export function getNicheConfig(niche: string): NicheAgentConfig {
  const resolved = ALIASES[niche] ?? niche;
  return NICHE_CONFIGS[resolved] ?? NICHE_CONFIGS['oficinas'];
}
