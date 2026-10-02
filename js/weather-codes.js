/**
 * Dicionário meteorológico, marítimo e de defesa civil
 * Especializado para RIO DAS OSTRAS - RJ (Costa e Bacia Hidrográfica)
 */

// Códigos WMO da Organização Meteorológica Mundial
export const WMO_CODES = {
  0: { label: 'Céu Limpo', icon: 'sun', bg: 'clear-day', alert: null },
  1: { label: 'Predominantemente Limpo', icon: 'sun-medium', bg: 'mostly-clear', alert: null },
  2: { label: 'Parcialmente Nublado', icon: 'cloud-sun', bg: 'partly-cloudy', alert: null },
  3: { label: 'Encoberto / Nublado', icon: 'cloud', bg: 'overcast', alert: null },
  45: { label: 'Nevoeiro Litorâneo', icon: 'cloud-fog', bg: 'fog', alert: { level: 'warning', text: 'Nevoeiro denso na costa de Rio das Ostras. Visibilidade marítima reduzida.' } },
  48: { label: 'Nevoeiro com Depósito', icon: 'cloud-fog', bg: 'fog', alert: { level: 'warning', text: 'Nevoeiro denso.' } },
  51: { label: 'Chuvisco Leve', icon: 'cloud-drizzle', bg: 'drizzle', alert: null },
  53: { label: 'Chuvisco Moderado', icon: 'cloud-drizzle', bg: 'drizzle', alert: null },
  55: { label: 'Chuvisco Denso', icon: 'cloud-drizzle', bg: 'rain', alert: null },
  61: { label: 'Chuva Leve', icon: 'cloud-rain', bg: 'rain', alert: null },
  63: { label: 'Chuva Moderada', icon: 'cloud-rain', bg: 'rain-moderate', alert: null },
  65: { label: 'Chuva Forte', icon: 'cloud-rain-wind', bg: 'heavy-rain', alert: { level: 'warning', text: 'Chuva forte em Rio das Ostras. Atenção para acúmulo de água nas vias e na orla.' } },
  80: { label: 'Pancadas de Chuva Leves', icon: 'cloud-rain', bg: 'rain', alert: null },
  81: { label: 'Pancadas de Chuva Moderadas', icon: 'cloud-rain', bg: 'rain-moderate', alert: null },
  82: { label: 'Pancadas de Chuva Violentas', icon: 'cloud-lightning', bg: 'heavy-rain', alert: { level: 'danger', text: 'Pancadas torrenciais. Risco de alagamento rápido na bacia do Rio das Ostras e Rio Jundiá.' } },
  95: { label: 'Tempestade com Raios', icon: 'zap', bg: 'thunderstorm', alert: { level: 'danger', text: 'Tempestade elétrica severa. Saia da praia (Costazul, Tartaruga) e procure abrigo.' } },
  96: { label: 'Tempestade com Granizo Leve', icon: 'cloud-hail', bg: 'thunderstorm', alert: { level: 'danger', text: 'Tempestade com granizo e descargas elétricas em Rio das Ostras.' } },
  99: { label: 'Tempestade Severa com Granizo', icon: 'cloud-hail', bg: 'severe-storm', alert: { level: 'critical', text: 'ALERTA MÁXIMO: Tempestade severa, rajadas violentas e granizo.' } }
};

export function getWeatherCondition(code) {
  return WMO_CODES[code] || { label: 'Condição Desconhecida', icon: 'cloud', bg: 'overcast', alert: null };
}

// Escala de Beaufort adaptada para o litoral de Rio das Ostras (Banho e Navegação)
export const BEAUFORT_SCALE = [
  { maxSpeed: 1, name: 'Calmaria', desc: 'Mar calmo como espelho. Condições excelentes para banho.', level: 'safe', color: 'emerald' },
  { maxSpeed: 5, name: 'Bafagem', desc: 'Pequenas marolas sem crista de espuma. Vento quase imperceptível.', level: 'safe', color: 'emerald' },
  { maxSpeed: 11, name: 'Brisa Leve', desc: 'Ondinhas pequenas de até 0,3m. Sente-se a brisa do mar no rosto.', level: 'safe', color: 'emerald' },
  { maxSpeed: 19, name: 'Brisa Fraca', desc: 'Cristas das ondas começam a quebrar. Excelente para esportes náuticos.', level: 'safe', color: 'emerald' },
  { maxSpeed: 28, name: 'Brisa Moderada', desc: 'Ondas médias na Praia de Costazul e Tartaruga. Formação de carneirinhos.', level: 'safe', color: 'emerald' },
  { maxSpeed: 38, name: 'Brisa Forte', desc: 'Ondas maiores com cristas de espuma branca. Cautela para banhistas e pequenas embarcações.', level: 'info', color: 'sky' },
  { maxSpeed: 49, name: 'Vento Fresco', desc: 'Mar revolto com borrifos d\'água. Dificuldade para caminhar contra o vento na orla.', level: 'warning', color: 'amber' },
  { maxSpeed: 61, name: 'Vento Forte (Aviso Marinha)', desc: 'Árvores balançam e ondas altas com espuma. Alerta de navegação costeira.', level: 'warning', color: 'amber' },
  { maxSpeed: 74, name: 'Ventania', desc: 'Mar grosso, cristas rolam com violência. Risco de ressaca em Costazul e Centro.', level: 'danger', color: 'orange' },
  { maxSpeed: 88, name: 'Ventania Forte', desc: 'Danos em quiosques, postes e queda de galhos. Evite a faixa de areia.', level: 'danger', color: 'rose' },
  { maxSpeed: 102, name: 'Tempestade Marítima', desc: 'Condições críticas de navegação na Bacia de Campos. Proibido entrar no mar.', level: 'critical', color: 'purple' },
  { maxSpeed: 999, name: 'Ciclone / Furacão', desc: 'Ressaca extrema, maré de tempestade violenta e perigo severo.', level: 'critical', color: 'red' }
];

export function getBeaufortData(speedKmH) {
  for (const b of BEAUFORT_SCALE) {
    if (speedKmH <= b.maxSpeed) return b;
  }
  return BEAUFORT_SCALE[BEAUFORT_SCALE.length - 1];
}

// Direção da Rosa dos Ventos
export function getWindCompassDirection(degrees) {
  const directions = [
    { label: 'N', name: 'Norte (Terral)', min: 348.75, max: 360 },
    { label: 'N', name: 'Norte (Terral)', min: 0, max: 11.25 },
    { label: 'NNE', name: 'Norte-Nordeste', min: 11.25, max: 33.75 },
    { label: 'NE', name: 'Nordeste (Predominante em RO)', min: 33.75, max: 56.25 },
    { label: 'ENE', name: 'Leste-Nordeste', min: 56.25, max: 78.75 },
    { label: 'L', name: 'Leste (Marítimo)', min: 78.75, max: 101.25 },
    { label: 'ESE', name: 'Leste-Sudeste', min: 101.25, max: 123.75 },
    { label: 'SE', name: 'Sudeste (Frente Fria/Ressaca)', min: 123.75, max: 146.25 },
    { label: 'SSE', name: 'Sul-Sudeste', min: 146.25, max: 168.75 },
    { label: 'S', name: 'Sul (Entrada de Frente Fria)', min: 168.75, max: 191.25 },
    { label: 'SSO', name: 'Sul-Sudoeste', min: 191.25, max: 213.75 },
    { label: 'SO', name: 'Sudoeste (Sudoestão)', min: 213.75, max: 236.25 },
    { label: 'OSO', name: 'Oeste-Sudoeste', min: 236.25, max: 258.75 },
    { label: 'O', name: 'Oeste (Terral)', min: 258.75, max: 281.25 },
    { label: 'ONO', name: 'Oeste-Noroeste', min: 281.25, max: 303.75 },
    { label: 'NO', name: 'Noroeste', min: 303.75, max: 326.25 },
    { label: 'NNO', name: 'Norte-Noroeste', min: 326.25, max: 348.75 }
  ];

  const normalized = (degrees % 360 + 360) % 360;
  for (const d of directions) {
    if (normalized >= d.min && normalized < d.max) {
      return d;
    }
  }
  return { label: 'NE', name: 'Nordeste' };
}

// Interpretação de Água Precipitável (VIME INMET)
export function getPrecipitableWaterInterpretation(pwMm) {
  if (pwMm > 50) {
    return {
      status: 'Extremamente Úmida (Potencial Convectivo Severo)',
      desc: 'Coluna atmosférica saturada com mais de 50 mm de água condensável. Alto risco de temporais torrenciais.',
      color: 'rose',
      level: 'danger'
    };
  } else if (pwMm > 38) {
    return {
      status: 'Elevada Umidade Convectiva',
      desc: 'Atmosfera com bastante vapor d\'água disponível (38-50 mm). Propício para pancadas de chuva moderadas a fortes.',
      color: 'sky',
      level: 'warning'
    };
  } else if (pwMm >= 22) {
    return {
      status: 'Teor Típico Litorâneo',
      desc: 'Valores normais para a costa de Rio das Ostras (22-38 mm). Precipitação depende de fatores dinâmicos.',
      color: 'emerald',
      level: 'safe'
    };
  } else {
    return {
      status: 'Atmosfera Seca / Estável',
      desc: 'Pouco vapor de água disponível na coluna vertical (< 22 mm). Probabilidade muito baixa de chuva.',
      color: 'amber',
      level: 'safe'
    };
  }
}

// Análise Barométrica (Pressão Atmosférica)
export function getPressureInterpretation(pressureHpa, tendency = 0) {
  let status = '';
  let description = '';
  let trendText = '';
  let color = 'sky';

  if (pressureHpa > 1020) {
    status = 'Alta Pressão / Anticiclone do Atlântico Sul';
    description = 'Subsistência de ar e tempo seco e firme no litoral de Rio das Ostras. Vento Nordeste moderado.';
    color = 'emerald';
  } else if (pressureHpa >= 1014) {
    status = 'Pressão Barométrica Normal Estável';
    description = 'Equilíbrio térmico e atmosférico na Baixada Litorânea. Sem frentes frias imediatas.';
    color = 'emerald';
  } else if (pressureHpa >= 1008) {
    status = 'Leve Declínio / Transição';
    description = 'Aproximação de cavado ou frente fria vinda de São Paulo / Sul do país.';
    color = 'sky';
  } else if (pressureHpa >= 998) {
    status = 'Baixa Pressão (Instabilidade Costeira)';
    description = 'Formação de nuvens densas de chuva. Alerta para mudança repentina na direção dos ventos (Sudoestão).';
    color = 'amber';
  } else {
    status = 'Ciclone Subtropical / Depressão Extratropical';
    description = 'Forte instabilidade atmosférica marítima. Alerta de ventania e ressaca severa pela Marinha do Brasil.';
    color = 'rose';
  }

  if (tendency > 1.0) {
    trendText = 'Subindo rapidamente (Melhoria do tempo)';
  } else if (tendency > 0.3) {
    trendText = 'Subindo suavemente (Tempo estabilizando)';
  } else if (tendency < -1.0) {
    trendText = 'Caindo rapidamente (Alerta de tempestade / Frente Fria iminente)';
  } else if (tendency < -0.3) {
    trendText = 'Caindo (Instabilidade em aproximação)';
  } else {
    trendText = 'Estável (Sem alterações bruscas)';
  }

  return { status, description, trendText, color };
}

// Umidade Relativa do Ar (OMS e Defesa Civil Estadual REDEC 1)
export function getHumidityClassification(humidity) {
  if (humidity < 12) {
    return {
      status: 'Emergência (Defesa Civil)',
      desc: 'Umidade crítica. Alerta de incêndios na Restinga de Jurubatiba e problemas respiratórios agudos.',
      level: 'critical',
      color: 'red'
    };
  } else if (humidity < 20) {
    return {
      status: 'Estado de Alerta',
      desc: 'Umidade muito baixa. Evite atividades físicas na orla entre 10h e 16h.',
      level: 'danger',
      color: 'orange'
    };
  } else if (humidity < 30) {
    return {
      status: 'Estado de Atenção',
      desc: 'Ar seco. Beba bastante água e hidrate as vias aéreas.',
      level: 'warning',
      color: 'amber'
    };
  } else if (humidity <= 75) {
    return {
      status: 'Faixa Ideal / Confortável',
      desc: 'Nível ótimo para a saúde e bem-estar (padrão OMS).',
      level: 'safe',
      color: 'emerald'
    };
  } else if (humidity <= 90) {
    return {
      status: 'Umidade Litorânea Elevada',
      desc: 'Ar úmido pela proximidade com o oceano. Sensação abafada quando quente.',
      level: 'info',
      color: 'cyan'
    };
  } else {
    return {
      status: 'Saturação (100%)',
      desc: 'Ar saturado. Formação de orvalho noturno e nevoeiro marítimo.',
      level: 'info',
      color: 'blue'
    };
  }
}
