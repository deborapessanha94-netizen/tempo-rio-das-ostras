export const PLANCON_PDF_URL = 'docs/plancon_rio_das_ostras.pdf';
export const PLANCON_EL_NINO_PDF_URL = 'docs/plancon_el_nino_rio_das_ostras.pdf';

export interface PlanconLimiar {
  nivel: string;
  tone: 'normal' | 'observacao' | 'atencao' | 'alerta' | 'maximo';
  volume: string;
  geologia: string;
  impacto: string;
  acao: string;
}

export const PLANCON_LIMIARES: PlanconLimiar[] = [
  {
    nivel: 'Nível 1 • Normalidade',
    tone: 'normal',
    volume: 'Chuva < 20 mm / 24h',
    geologia: 'Solo seco ou com baixa umidade; sem risco de deslizamentos.',
    impacto: 'Drenagem pluvial operando normalmente em toda a malha urbana.',
    acao: 'Monitoramento preventivo e rotina meteorológica 24h.'
  },
  {
    nivel: 'Nível 2 • Observação',
    tone: 'observacao',
    volume: 'Chuva de 20 a 45 mm / 24h',
    geologia: 'Solo em saturação inicial em encostas e taludes.',
    impacto: 'Pontos pontuais de retenção d\'água em calhas deprimidas.',
    acao: 'Aviso preliminar às equipes operacionais e monitoramento dos pluviômetros.'
  },
  {
    nivel: 'Nível 3 • Atenção',
    tone: 'atencao',
    volume: 'Chuva de 45 a 70 mm / 24h ou > 25 mm / 1h',
    geologia: 'Saturação moderada do solo; risco moderado de escorregamento.',
    impacto: 'Lâmina d\'água em vias principais; extravasamento de canais secundários.',
    acao: 'Prontidão da Defesa Civil (199), vistoria nas áreas ribeirinhas e canais.'
  },
  {
    nivel: 'Nível 4 • Alerta',
    tone: 'alerta',
    volume: 'Chuva de 70 a 100 mm / 24h ou > 40 mm / 1h',
    geologia: 'Solo altamente saturado; alto risco de deslizamentos e solapamentos.',
    impacto: 'Alagamentos severos em bairros baixos; Rio Jundiaí em cota de transbordo.',
    acao: 'Ativação do SIMDEC, equipes em campo e rotas de desvio sinalizadas.'
  },
  {
    nivel: 'Nível 5 • Alerta Máximo',
    tone: 'maximo',
    volume: 'Chuva > 100 mm / 24h ou > 60 mm / 1h',
    geologia: 'Risco crítico iminente de corridas de massa e colapso estrutural.',
    impacto: 'Inundações generalizadas, isolamento de vias e comunidades ribeirinhas.',
    acao: 'Gabinete de Crise acionado, abertura de abrigos públicos e evacuação orientada.'
  }
];

export interface PlanconNivelOperacional {
  codigo: string;
  descricao: string;
}

export const PLANCON_NIVEIS_OPERACIONAIS: PlanconNivelOperacional[] = [
  {
    codigo: 'Nível Operacional 1 (Verde) — Vigilância Contínua',
    descricao: 'Monitoramento em tempo real dos radares meteorológicos, estações pluviométricas e telemetria do Rio Jundiaí.'
  },
  {
    codigo: 'Nível Operacional 2 (Amarelo) — Sobreaviso Integrado',
    descricao: 'Mobilização preventiva de sobreaviso da Defesa Civil, Serviços Públicos e Guarda Civil Municipal.'
  },
  {
    codigo: 'Nível Operacional 3 (Laranja) — Mobilização Parcial',
    descricao: 'Envio de equipes às bacias vulneráveis, desobstrução imediata de canais e emissão de alertas via SMS 40199.'
  },
  {
    codigo: 'Nível Operacional 4 (Vermelho) — Pronta Resposta Total',
    descricao: 'Ativação completa do Plano de Contingência Municipal com todas as secretarias em regime de emergência 24h.'
  }
];

export interface PlanconAreaVulneravel {
  categoria: string;
  cobrade: string;
  locais: string;
}

export const PLANCON_AREAS_VULNERAVEIS: PlanconAreaVulneravel[] = [
  {
    categoria: 'Inundação & Alagamento Severo (Bacias Críticas)',
    cobrade: 'COBRADE 1.2.1.0.0 (Inundações / Alagamentos)',
    locais: 'Cidade Praiana, Âncora, Beira-Mar, Campomar, Recanto, Nova Cidade, Palmital e imediações do Canal de Medeiros.'
  },
  {
    categoria: 'Transbordo Fluvial (Calha do Rio Jundiaí)',
    cobrade: 'COBRADE 1.2.2.0.0 (Enxurradas / Cheias Rápidas)',
    locais: 'Cantagalo, Rocha Leão (margem fluvial), zonas de confluência da bacia com a RJ-106 e áreas rurais adjacentes.'
  },
  {
    categoria: 'Escorregamentos & Solapamento de Margens',
    cobrade: 'COBRADE 1.1.3.2.1 (Deslizamentos de Terra)',
    locais: 'Taludes de encostas em Costazul, Enseada das Gaivotas, Terra Firme e margens instáveis de canais de drenagem.'
  },
  {
    categoria: 'Ressacas do Mar & Erosão Costeira',
    cobrade: 'COBRADE 1.3.2.1.4 (Erosão Marinha / Tempestades na Costa)',
    locais: 'Orla de Costazul (calcada e faixa de areia), Praia do Cemitério, Praia da Tartaruga e Praia do Bosque.'
  }
];

export interface PlanconRespostaMunicipal {
  titulo: string;
  descricao: string;
}

export const PLANCON_RESPOSTA_MUNICIPAL: PlanconRespostaMunicipal[] = [
  {
    titulo: 'Comando de Operações (SUBDEC / SEGTRAN)',
    descricao: 'Coordenação tática 24h pelo telefone 199 e rádio VHF; vistorias de campo, isolamento e rotas de segurança.'
  },
  {
    titulo: 'Obras & Serviços Públicos (SEMOP)',
    descricao: 'Equipes móveis para desobstrução mecânica de bueiros, canais pluviais e operação de bombas de esgotamento.'
  },
  {
    titulo: 'Assistência Social (SEMAS)',
    descricao: 'Acolhimento humanizado, cadastramento de desalojados e suprimento de colchões, cobertores e cestas básicas.'
  },
  {
    titulo: 'Saúde & Urgência (SEMUSA / SAMU 192)',
    descricao: 'UPAs em bandeira prioritária, suporte a pacientes com mobilidade reduzida e profilaxia pós-alagamento.'
  }
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
  { nome: 'Saquarema' }
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
    detalhe: 'Atendimento emergencial 24h para vistorias, alagamentos e risco estrutural.'
  },
  {
    orgao: 'Corpo de Bombeiros Militar (CBMERJ)',
    telefone: '193',
    detalhe: 'Resgate aquático, combate a incêndios e corte de árvores tombadas em vias.'
  },
  {
    orgao: 'Serviço de Atendimento Móvel de Urgência (SAMU)',
    telefone: '192',
    detalhe: 'Socorro médico de urgência e transferências pré-hospitalares.'
  },
  {
    orgao: 'Guarda Civil Municipal / Trânsito (SEGTRAN)',
    telefone: '153',
    detalhe: 'Orientação de tráfego, sinalização de alagamentos e segurança patrimonial.'
  },
  {
    orgao: 'Polícia Militar do Estado do RJ (32º BPM)',
    telefone: '190',
    detalhe: 'Segurança pública e patrulhamento preventivo em áreas evacuadas.'
  }
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
      impacto: 'Sobrecarga da rede elétrica, pico de consumo hídrico e risco severo à saúde de idosos e crianças.'
    },
    {
      codigo: 'COBRADE 1.3.2.1.4 / 1.5',
      risco: 'Temporais Convectivos & Vendavais Severos',
      descricao: 'Rajadas violentas de 56 km/h a > 75 km/h com precipitação pontual torrencial.',
      impacto: 'Queda de árvores, destelhamentos, quebra de postes e interrupção no fornecimento de energia.'
    },
    {
      codigo: 'COBRADE 1.2.1.0.0',
      risco: 'Alagamentos Instantâneos & Efeito Maré',
      descricao: 'Pancadas de 40 a 60 mm/h combinadas com maré alta de sizígia na planície litorânea.',
      impacto: 'Refluxo das águas no Canal de Medeiros e alagamento crítico em Cidade Praiana, Âncora e Beira-Mar.'
    },
    {
      codigo: 'COBRADE 1.4.1.3.1',
      risco: 'Incêndios em Vegetação e Solo de Turfa',
      descricao: 'Umidade Relativa do Ar < 30% prolongada associada a solos turfosos ressecados.',
      impacto: 'Combustão subterrânea de difícil extinção gerando fumaça densa e tóxica ao nível da RJ-106.'
    }
  ],
  matrizAlertaGae: [
    {
      nivel: 'Nível Verde • Vigilância',
      dotColor: 'emerald',
      chuva24h: 'Temp até 28°C • URA > 60%',
      condicao: 'Condições atmosféricas estáveis sem indicativo de eventos severos.',
      acao: 'Rotina normal de monitoramento climatológico e hidrológico.'
    },
    {
      nivel: 'Nível Amarelo • Atenção',
      dotColor: 'amber',
      chuva24h: 'Temp 28,1°C a 32°C • URA 41-60%',
      condicao: 'Probabilidade de pancadas convectivas isoladas de verão no fim da tarde.',
      acao: 'Aviso de atenção preventiva às secretarias do SIMDEC e limpeza de bueiros.'
    },
    {
      nivel: 'Nível Laranja • Alerta / Mobilização',
      dotColor: 'orange',
      chuva24h: 'Temp 32,1°C a 35°C • URA 21-40%',
      condicao: 'Instabilidade severa com potencial de rajadas > 56 km/h e chuva forte localizada.',
      acao: 'Mobilização parcial das equipes de campo e emissão de alerta sonoro e SMS 40199.'
    },
    {
      nivel: 'Nível Vermelho • Alarme Máximo',
      dotColor: 'red',
      chuva24h: 'Temp 35,1°C a 38°C • URA 12-20%',
      condicao: 'Tempestade violenta iminente com ventos > 75 km/h ou calor extremo prolongado.',
      acao: 'Acionamento do Gabinete de Crise Integrado 24h e equipes de socorro em prontidão.'
    }
  ],
  protocolosSimdec: [
    {
      orgao: 'Secretaria Municipal de Saúde (SEMUSA)',
      acoes: 'UPAs e postos de saúde de prontidão para desidratação, insolação e problemas respiratórios por fumaça de turfa.'
    },
    {
      orgao: 'Serviços Públicos & SAAE (SEMOP)',
      acoes: 'Caminhões-pipa de prontidão estratégica, geradores nas elevatórias de esgoto e equipes de desobstrução de canais.'
    },
    {
      orgao: 'Meio Ambiente & Agricultura (SEMA)',
      acoes: 'Aceiros preventivos nas faixas de turfa e restinga, fiscalização rigorosa contra queimadas e brigada municipal.'
    },
    {
      orgao: 'Segurança Pública & Trânsito (SEGTRAN)',
      acoes: 'Sinalização e interdição preventiva de trechos com visibilidade zero por fumaça na Rodovia Amaral Peixoto (RJ-106).'
    }
  ],
  guiaAutoprotecao: [
    {
      titulo: 'Durante Ondas de Calor Extremo',
      orientacao: 'Beba água constantemente, evite exposição solar direta entre 10h e 16h e redobre a atenção com idosos e pets.'
    },
    {
      titulo: 'Durante Tempestades e Vendavais',
      orientacao: 'Não se abrigue debaixo de árvores ou estruturas metálicas, desligue aparelhos da tomada e não atravesse vias alagadas.'
    },
    {
      titulo: 'Em Caso de Fumaça na Rodovia (RJ-106)',
      orientacao: 'Reduza a velocidade imediatamente, acenda os faróis baixos, feche os vidros e mantenha distância segura do veículo à frente.'
    },
    {
      titulo: 'Adesão ao Alerta Oficial por SMS',
      orientacao: 'Cadastre-se gratuitamente enviando um SMS com o seu CEP para o número 40199 da Defesa Civil Estadual.'
    }
  ]
};
