export const PLANCON_PDF_URL = 'docs/plancon_rio_das_ostras.pdf';
export const PLANCON_EL_NINO_PDF_URL = 'docs/plancon_el_nino_rio_das_ostras.pdf';

export const PLANCON_META = {
  versao: '5.0 · 2026/2027',
  atualizacao: '24/10/2026',
  cobrade: 'COBRADE 1.3.2.1.4 (Chuvas Intensas)',
  paginas: 74,
  baseLegal: 'Lei Municipal nº 2.523/2021 · Decreto Municipal nº 3.267/2022 (SIMDEC / GAE)',
  orgao: 'SUBDEC — Subsecretaria Municipal de Defesa Civil · Rio das Ostras/RJ',
};

export interface PlanconLimiar {
  nivel: string;
  tone: 'normal' | 'observacao' | 'atencao' | 'alerta' | 'maximo';
  volume: string;
  hidrologico: string;
  geologico: string;
  impacto: string;
  acao: string;
}

/**
 * Tabelas 7, 8 e 9 do PLANCON 5.0 (2026/2027) — Págs. 22-23
 * Limiares oficiais para Riscos Hidrológicos e Riscos Geológicos (mm/24h).
 */
export const PLANCON_LIMIARES: PlanconLimiar[] = [
  {
    nivel: 'Nível I • Normalidade',
    tone: 'normal',
    volume: 'Hidro: até 30 mm/24h · Geo: até 20 mm/24h',
    hidrologico: 'Até 30 mm / 24h',
    geologico: 'Até 20 mm / 24h',
    impacto: 'Condições típicas. Sem riscos significativos associados à precipitação.',
    acao: 'Tabela 7: Monitoramento rotineiro pela Defesa Civil Municipal (praias, canais e áreas historicamente vulneráveis).',
  },
  {
    nivel: 'Nível II • Observação',
    tone: 'observacao',
    volume: 'Hidro: 30 a 70 mm/24h · Geo: 20 a 70 mm/24h',
    hidrologico: '30 a 70 mm / 24h',
    geologico: '20 a 70 mm / 24h',
    impacto: 'Volume moderado. O monitoramento preventivo é recomendado diante da possibilidade de evolução para risco.',
    acao: 'Tabela 7: Monitoramento detalhado de pluviômetros, canais de drenagem e encostas; emissão de alertas preventivos.',
  },
  {
    nivel: 'Nível III • Atenção',
    tone: 'atencao',
    volume: 'Hidro e Geo: 70 a 100 mm / 24h',
    hidrologico: '70 a 100 mm / 24h',
    geologico: '70 a 100 mm / 24h',
    impacto: 'Chuva significativa. Possibilidade de alagamentos pontuais, cheias dos rios/canais e encharcamento com escorregamentos pontuais em encostas.',
    acao: 'Tabela 7: Ações de preparação — inspeções em pontos críticos, comunicação reforçada e articulação com serviços públicos.',
  },
  {
    nivel: 'Nível IV • Alerta',
    tone: 'alerta',
    volume: 'Hidro: 100 a 130 mm/24h · Geo: > 100 mm/24h',
    hidrologico: '100 a 130 mm / 24h',
    geologico: 'Acima de 100 mm / 24h',
    impacto: 'Risco elevado. Potencial para inundações e alagamentos em áreas vulneráveis e deslizamentos severos em encostas.',
    acao: 'Tabela 7: Medidas preventivas imediatas — interdições, remoção preventiva de famílias e mobilização de recursos municipais e estaduais.',
  },
  {
    nivel: 'Nível V • Alerta Máximo',
    tone: 'maximo',
    volume: 'Hidro: > 130 mm/24h · Geo: > 100 mm/24h',
    hidrologico: 'Acima de 130 mm / 24h',
    geologico: 'Acima de 100 mm / 24h',
    impacto: 'Situação crítica. Alta probabilidade de desastres naturais severos, alagamentos generalizados e movimentos de massa.',
    acao: 'Tabela 7: Evacuação e resposta rápida — acionamento imediato de abrigos temporários, Gabinete de Crise e atendimento integral.',
  },
];

export interface PlanconNivelRisco {
  codigo: string;
  tone: 'baixo' | 'medio' | 'alto' | 'muito_alto';
  descricao: string;
  acoes: string;
}

/**
 * Seção 6 e Figura 3 do PLANCON 5.0 (2026/2027) — Págs. 19-20
 * Classificação de risco das áreas suscetíveis a eventos extremos (R1 a R4).
 */
export const PLANCON_NIVEIS_RISCO: PlanconNivelRisco[] = [
  {
    codigo: 'R1 – Risco Baixo (Verde)',
    tone: 'baixo',
    descricao: 'Áreas com histórico de pouca vulnerabilidade e baixa probabilidade de ocorrência de eventos adversos, mesmo diante de chuvas moderadas.',
    acoes: 'Monitoramento meteorológico contínuo, manutenção preventiva de drenagens e canais, e campanhas educativas.',
  },
  {
    codigo: 'R2 – Risco Médio (Amarelo)',
    tone: 'medio',
    descricao: 'Regiões com suscetibilidade a impactos moderados, como alagamentos pontuais ou pequenos deslizamentos em encostas instáveis.',
    acoes: 'Intensificação da vigilância, inspeções técnicas em áreas críticas, alerta preventivo à população e preparação de abrigos temporários.',
  },
  {
    codigo: 'R3 – Risco Alto (Laranja)',
    tone: 'alto',
    descricao: 'Áreas com alta probabilidade de ocorrência de desastres, especialmente em períodos de acumulado pluviométrico elevado.',
    acoes: 'Mobilização do Grupo de Ações Emergenciais (GAE – Decreto 3.267/2022), ativação do PLANCON e PAE, restrição de circulação e preparação para evacuação.',
  },
  {
    codigo: 'R4 – Risco Muito Alto (Vermelho)',
    tone: 'muito_alto',
    descricao: 'Situação crítica, com risco iminente de desastre, como deslizamentos de grande porte, rompimento de encostas e inundações severas.',
    acoes: 'Ativação imediata do Gabinete de Crise, evacuação de famílias em áreas de risco, instalação de abrigos e atuação integrada Defesa Civil / CBMERJ.',
  },
];

export interface PlanconNivelOperacional {
  codigo: string;
  tone: 'normal' | 'observacao' | 'atencao' | 'alerta' | 'maximo';
  resumoTabela7: string;
  descricao: string;
}

/**
 * Seção 6.1 e Tabela 7 do PLANCON 5.0 (2026/2027) — Págs. 21-22
 */
export const PLANCON_NIVEIS_OPERACIONAIS: PlanconNivelOperacional[] = [
  {
    codigo: 'Nível I – Normalidade (Verde)',
    tone: 'normal',
    resumoTabela7: 'Monitoramento rotineiro',
    descricao: 'Situação estável, sem riscos iminentes. Monitoramento rotineiro mantido em áreas historicamente vulneráveis como Cidade Praiana, Cidade Beira Mar, Jardim Campomar, Jardim Miramar, Nova Cidade e Âncora.',
  },
  {
    codigo: 'Nível II – Observação (Amarelo)',
    tone: 'observacao',
    resumoTabela7: 'Monitoramento detalhado',
    descricao: 'Condições climáticas ou ambientais indicam possibilidade de evolução para risco. Equipe técnica intensifica o monitoramento de pluviômetros, canais de drenagem e áreas de ocupação irregular, com alertas preventivos.',
  },
  {
    codigo: 'Nível III – Atenção (Laranja)',
    tone: 'atencao',
    resumoTabela7: 'Ações de preparação',
    descricao: 'Perigo moderado diante de previsão de chuvas intensas ou período prolongado de precipitação. Início de inspeções em pontos críticos, comunicação reforçada com moradores e articulação com serviços públicos.',
  },
  {
    codigo: 'Nível IV – Alerta (Vermelho)',
    tone: 'alerta',
    resumoTabela7: 'Medidas preventivas imediatas',
    descricao: 'Risco elevado de alagamentos e inundações em cotas mais baixas ou deficiência de drenagem, e deslizamentos em encostas. Interdições, remoção preventiva de famílias e mobilização municipal e estadual.',
  },
  {
    codigo: 'Nível V – Alerta Máximo (Roxo)',
    tone: 'maximo',
    resumoTabela7: 'Evacuação e resposta rápida',
    descricao: 'Desastre em curso ou iminente. Envolve evacuação de áreas de risco, acionamento de abrigos temporários e resposta rápida coordenada com o Gabinete de Crise e forças de salvamento.',
  },
];

export interface PlanconLocalDetalhe {
  titulo: string;
  descricao: string;
}

export interface PlanconAreaVulneravel {
  categoria: string;
  cobrade: string;
  locais: PlanconLocalDetalhe[];
}

/**
 * Seções 7.1, 7.2 e 7.3 do PLANCON 5.0 (2026/2027) — Págs. 26-41
 * Mapeamento atualizado de setorização de áreas de risco em Rio das Ostras.
 */
export const PLANCON_AREAS_VULNERAVEIS: PlanconAreaVulneravel[] = [
  {
    categoria: '7.1 Risco de Inundação (Calhas & Vales)',
    cobrade: 'COBRADE 1.2.1.0.0 — Inundações (Págs. 26-32)',
    locais: [
      {
        titulo: 'Margens do Rio Jundiá (Âncora, Cláudio Ribeiro e Village)',
        descricao: 'Trechos desde o ponto em que o curso d’água adentra o Residencial Praia Âncora, ao longo da Av. Flor do Campo até o Conj. Hab. Cláudio Ribeiro.',
      },
      {
        titulo: 'Canal das Corujas & Rio das Ostras (Região Central)',
        descricao: 'Lot. Apicelo, Rua Joaquim Mariano até Rua Malvino José dos Santos (Nova Cidade), Liberdade, São Cristóvão, Santa Ana, Parque São Jorge e Chácara Mariléa (~450 domicílios / ~1.500 pessoas expostas).',
      },
      {
        titulo: 'Canal de Medeiros (Campomar, Beira Mar e Cidade Praiana)',
        descricao: 'Malha entre Av. Brasil (Ext. do Bosque), Recanto, Jardim Campomar, Cidade Beira Mar, Cidade Praiana e Serramar até Estrada Velha Rio Dourado e divisa com Casimiro (~2.760 domicílios / ~8.350 pessoas expostas).',
      },
      {
        titulo: 'Núcleo Urbano de Rocha Leão (Rio Purgatório)',
        descricao: 'Imediações do Rio Purgatório e canais afluentes com travessias restritivas no núcleo urbano de Rocha Leão (~450 domicílios / ~1.400 pessoas expostas).',
      },
      {
        titulo: 'Núcleo Urbano de Cantagalo (Rio Jundiá)',
        descricao: 'Margens do Rio Jundiá e afluentes no núcleo urbano rural de Cantagalo, incluindo imediações da Rua Projetada B (~280 domicílios / ~900 pessoas expostas).',
      },
      {
        titulo: 'Núcleo Urbano de Mar do Norte',
        descricao: 'Setor urbano de baixada às margens da RJ-106 sujeito à retenção hídrica e extravasamento de canais (~450 domicílios / ~1.400 pessoas expostas).',
      },
    ],
  },
  {
    categoria: '7.2 Risco de Alagamento Urbano (Planície)',
    cobrade: 'COBRADE 1.2.3.0.0 — Alagamentos · Risco Moderado (Págs. 33-35)',
    locais: [
      {
        titulo: 'Costa Azul, Terra Firme & Enseada das Gaivotas',
        descricao: 'Costa Azul, Recreio, Ouro Verde, Jardim Bela Vista, Terra Firme, Enseada das Gaivotas e Praiamar — microbacia ligada à Lagoa do Iriry.',
      },
      {
        titulo: 'Região Norte (Chácara Mariléa & Jardim Atlântico)',
        descricao: 'Chácara Mariléa, Jardim Mariléa, Jardim Atlântico, Village e Residencial Praia Âncora — baixa declividade e sobrecarga da drenagem rumo aos rios Jundiá e Rio das Ostras.',
      },
      {
        titulo: 'Região Central (Casa Grande, Nova Cidade & Centro)',
        descricao: 'Nova Cidade, Gelson Apicelo, Parque Zabulão, Liberdade, Ext. Novo Rio das Ostras, Centro, Balneário Remanso, Operário, Casa Grande, São Cristóvão, Ext. do Bosque, Recanto e Nova Aliança.',
      },
    ],
  },
  {
    categoria: '7.3 Movimentos de Massa (Encostas & Taludes)',
    cobrade: 'COBRADE 1.1.3.2.1 — Deslizamentos · Risco Severo (Págs. 37-41)',
    locais: [
      {
        titulo: 'Âncora — Morro da Sinal (Portelinha)',
        descricao: 'Ruas Flor do Campo, Projetada, Novo Horizonte, Petúnias, Pingo D’Ouro, Dona Filomena, Gaivotas, Projetada C e Ruas 58, 59 e 61; taludes até 8 m e 90°.',
      },
      {
        titulo: 'Nova Cidade — Rua da Fonte (Benedito Barroso)',
        descricao: 'Encostas com taludes de até 8 m e 90° próximos a moradias na região da Rua Benedito Barroso / Rua da Fonte.',
      },
      {
        titulo: 'São Cristóvão — Ruas da Assembleia e Oscar Fonseca',
        descricao: 'Trecho de declive acentuado entre Rua da Assembleia, Oscar Fonseca e Travessas Oscar Fonseca I, II e III.',
      },
      {
        titulo: 'Palmital — Estrada Velha Rio Dourado',
        descricao: 'Talude escavado de até 6 m e 90° com histórico de escorregamento planar próximo a edificações.',
      },
      {
        titulo: 'Rocha Leão — Ruas Antônio Moura e Henrique Sarzedas',
        descricao: 'Encostas escavadas com até 9 m de altura e 80° de declividade, com moradias próximas ao sopé do talude.',
      },
    ],
  },
];

export interface PlanconRespostaMunicipal {
  titulo: string;
  descricao: string;
}

/**
 * Seções 8 a 12, Tabela 10 e Anexo IV do PLANCON 5.0 (2026/2027) — Págs. 42-65
 */
export const PLANCON_RESPOSTA_MUNICIPAL: PlanconRespostaMunicipal[] = [
  {
    titulo: 'Ativação GAE / SIMDEC & Gabinete de Crise',
    descricao: 'Coordenação da SUBDEC (Decreto nº 3.267/2022) com ativação da Sala de Situação, NUPDECs e Gabinete de Gestão de Crise (GGC — Rua Campo de Albacora, nº 75, Atlântica) integrando todas as secretarias.',
  },
  {
    titulo: 'Helipontos de Emergência & Logística (Anexo IV)',
    descricao: 'Heliponto LPH-01 (Ajuda Humanitária): Estádio Emília Rosa Guimarães (R. Miracema, 355 – Jd. Mariléa); LPH-02 (Busca e Salvamento): terreno em frente ao Hospital Municipal (Pq. Zabulão).',
  },
  {
    titulo: 'Abrigos, Assistência & Animais Domésticos',
    descricao: 'SEMAS coordena triagem, abrigamento seguro (inclusive de animais domésticos com controle sanitário e ração) e logística nos Depósitos SEMAS (R. Carlos Viana, 390) e Ginásio Benedito Zarour.',
  },
  {
    titulo: 'Rede de Monitoramento Municipal (Tabela 10)',
    descricao: 'Pluviômetro Base Defesa Civil (Rod. Amaral Peixoto, 3190), estação hidro-pluviométrica INEA no Rio Jundiá (Âncora) e estações meteorológicas LAMET/UENF (Base, Jacinto, Pq. Pássaros, Cantagalo e Rebio União).',
  },
  {
    titulo: 'Alerta, Alarme & Registro S2iD / PRODEC',
    descricao: 'Emissão de alertas via Cell Broadcast, SMS, WhatsApp/Telegram, carros de som, rádio/TV; ocorrências registradas no PRODEC para FIDE/DMATE e reconhecimento SE/ECP no S2iD (Portaria 260/2022 em até 10 dias).',
  },
  {
    titulo: 'Serviços Essenciais, Saúde & Concessionárias',
    descricao: 'Pronta resposta conjunta de Saúde (SEMUSA/SAMU 192), Obras (SEMOP), Trânsito (SEGTRAN/GCM 153), SAAE, Rio+Saneamento (0800 772 1027), Enel, Naturgy (0800 024 0197), CBMERJ (193) e REDEC Litorânea.',
  },
];

export interface Redec1Municipio {
  nome: string;
  destaque?: boolean;
}

export const REDEC_1_MUNICIPIOS: Redec1Municipio[] = [
  { nome: 'Rio das Ostras (Sede)', destaque: true },
  { nome: 'Macaé' },
  { nome: 'Casimiro de Abreu' },
  { nome: 'Cabo Frio' },
  { nome: 'Armação dos Búzios' },
  { nome: 'Arraial do Cabo' },
  { nome: 'São Pedro da Aldeia' },
  { nome: 'Iguaba Grande' },
  { nome: 'Araruama' },
  { nome: 'Saquarema' },
];

export interface CentralEmergencia {
  orgao: string;
  telefone: string;
  detalhe: string;
}

export const CENTRAL_EMERGENCIAS: CentralEmergencia[] = [
  {
    orgao: 'Defesa Civil Municipal (SUBDEC)',
    telefone: '199',
    detalhe: 'Atendimento emergencial 24h para vistorias, alagamentos e risco estrutural.',
  },
  {
    orgao: 'Corpo de Bombeiros Militar (CBMERJ)',
    telefone: '193',
    detalhe: 'Resgate aquático, salvamento, corte de árvores e combate a incêndios.',
  },
  {
    orgao: 'Serviço de Atendimento Móvel de Urgência (SAMU)',
    telefone: '192',
    detalhe: 'Socorro médico de urgência e transferências pré-hospitalares.',
  },
  {
    orgao: 'Guarda Civil Municipal / Trânsito (SEGTRAN)',
    telefone: '153',
    detalhe: 'Orientação de tráfego, interdições de segurança e desvios em alagamentos.',
  },
  {
    orgao: 'Polícia Militar do Estado do RJ (32º BPM / 3ª Cia)',
    telefone: '190',
    detalhe: 'Segurança pública e patrulhamento preventivo em áreas afetadas ou evacuadas.',
  },
];

export const PLANCON_EL_NINO = {
  titulo: 'Plano de Contingência — Efeitos do Fenômeno El Niño (2026/2027)',
  subtitulo: 'Subsecretaria de Proteção e Defesa Civil de Rio das Ostras • Documento Técnico Oficial (64 Páginas)',
  badges: ['SUBDEC • SEGTRAN • SIMDEC', 'Vigência 2026 / 2027', 'Super El Niño • Pacífico > +2,0°C'],
  comportamentoTitulo: 'Comportamento Anômalo do Clima em Rio das Ostras',
  resumo: 'Em Rio das Ostras, o El Niño não causa seca mansa, mas severa desregulação: veranicos escaldantes intercalados por temporais convectivos violentos de fim de tarde, ondas de calor extremo, microexplosões com rajadas > 75 km/h e risco elevado de incêndios em vegetação e solo de turfa na RJ-106.',
  riscosCobrade: [
    {
      codigo: 'COBRADE 1.3.3.1.0',
      risco: 'Ondas de Calor & Picos Térmicos Extremos',
      descricao: 'Temperaturas entre 34°C e 38°C com índices de calor > 42°C-45°C.',
      impacto: 'Sobrecarga da rede elétrica, pico de consumo hídrico e risco severo à saúde de idosos e crianças.',
    },
    {
      codigo: 'COBRADE 1.3.2.1.4 / 1.5',
      risco: 'Temporais Convectivos & Vendavais Severos',
      descricao: 'Rajadas violentas de 56 km/h a > 75 km/h com precipitação pontual torrencial.',
      impacto: 'Queda de árvores, destelhamentos, quebra de postes e interrupção no fornecimento de energia.',
    },
    {
      codigo: 'COBRADE 1.2.1.0.0',
      risco: 'Alagamentos Instantâneos & Efeito Maré',
      descricao: 'Pancadas de 40 a 60 mm/h combinadas com maré alta de sizígia na planície litorânea.',
      impacto: 'Refluxo das águas no Canal de Medeiros e alagamento crítico em Cidade Praiana, Âncora e Beira-Mar.',
    },
    {
      codigo: 'COBRADE 1.4.1.3.1',
      risco: 'Incêndios em Vegetação e Solo de Turfa',
      descricao: 'Umidade Relativa do Ar < 30% prolongada associada a solos turfosos ressecados.',
      impacto: 'Combustão subterrânea de difícil extinção gerando fumaça densa e tóxica ao nível da RJ-106.',
    },
  ],
  matrizAlertaGae: [
    {
      nivel: 'Nível Verde • Vigilância',
      dotColor: 'emerald',
      chuva24h: 'Temp até 28°C • URA > 60%',
      condicao: 'Condições atmosféricas estáveis sem indicativo de eventos severos.',
      acao: 'Rotina normal de monitoramento climatológico e hidrológico.',
    },
    {
      nivel: 'Nível Amarelo • Atenção',
      dotColor: 'amber',
      chuva24h: 'Temp 28,1°C a 32°C • URA 41-60%',
      condicao: 'Probabilidade de pancadas convectivas isoladas de verão no fim da tarde.',
      acao: 'Aviso de atenção preventiva às secretarias do SIMDEC e limpeza de bueiros.',
    },
    {
      nivel: 'Nível Laranja • Alerta / Mobilização',
      dotColor: 'orange',
      chuva24h: 'Temp 32,1°C a 35°C • URA 21-40%',
      condicao: 'Instabilidade severa com potencial de rajadas > 56 km/h e chuva forte localizada.',
      acao: 'Mobilização parcial das equipes de campo e emissão de alerta sonoro e SMS 40199.',
    },
    {
      nivel: 'Nível Vermelho • Alarme Máximo',
      dotColor: 'red',
      chuva24h: 'Temp 35,1°C a 38°C • URA 12-20%',
      condicao: 'Tempestade violenta iminente com ventos > 75 km/h ou calor extremo prolongado.',
      acao: 'Acionamento do Gabinete de Crise Integrado 24h e equipes de socorro em prontidão.',
    },
  ],
  protocolosSimdec: [
    {
      orgao: 'Secretaria Municipal de Saúde (SEMUSA)',
      acoes: 'UPAs e postos de saúde de prontidão para desidratação, insolação e problemas respiratórios por fumaça de turfa.',
    },
    {
      orgao: 'Serviços Públicos & SAAE (SEMOP)',
      acoes: 'Caminhões-pipa de prontidão estratégica, geradores nas elevatórias de esgoto e equipes de desobstrução de canais.',
    },
    {
      orgao: 'Meio Ambiente & Agricultura (SEMA)',
      acoes: 'Aceiros preventivos nas faixas de turfa e restinga, fiscalização rigorosa contra queimadas e brigada municipal.',
    },
    {
      orgao: 'Segurança Pública & Trânsito (SEGTRAN)',
      acoes: 'Sinalização e interdição preventiva de trechos com visibilidade zero por fumaça na Rodovia Amaral Peixoto (RJ-106).',
    },
  ],
  guiaAutoprotecao: [
    {
      titulo: 'Durante Ondas de Calor Extremo',
      orientacao: 'Beba água constantemente, evite exposição solar direta entre 10h e 16h e redobre a atenção com idosos e pets.',
    },
    {
      titulo: 'Durante Tempestades e Vendavais',
      orientacao: 'Não se abrigue debaixo de árvores ou estruturas metálicas, desligue aparelhos da tomada e não atravesse vias alagadas.',
    },
    {
      titulo: 'Em Caso de Fumaça na Rodovia (RJ-106)',
      orientacao: 'Reduza a velocidade imediatamente, acenda os faróis baixos, feche os vidros e mantenha distância segura do veículo à frente.',
    },
    {
      titulo: 'Adesão ao Alerta Oficial por SMS',
      orientacao: 'Cadastre-se gratuitamente enviando um SMS com o seu CEP para o número 40199 da Defesa Civil Estadual.',
    },
  ],
};
