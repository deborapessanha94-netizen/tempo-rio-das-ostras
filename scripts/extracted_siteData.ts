export const SITE_BASE = 'https://deborapessanha94-netizen.github.io/tempo-rio-das-ostras';

export interface EstacaoPluvio {
  codigo: string;
  nome: string;
  nome_curto?: string;
  bairro?: string;
  rede: string;
  categoria: 'pws' | 'cemaden' | 'inea' | string;
  tipo?: string;
  tipo_label?: string;
  url?: string;
  url_portal?: string;
  temp_atual?: number | null;
  sensacao_atual?: number | null;
  umidade_atual?: number | null;
  pressao_atual?: number | null;
  uv_atual?: number | null;
  radiacao_solar?: number | null;
  vento_atual?: number | null;
  rajada_atual?: number | null;
  vento_dir_graus?: number | null;
  vento_dir_cardinal?: string | null;
  vento_max_hoje?: number | null;
  hora_vento_max_hoje?: string | null;
  rajada_max_hoje?: number | null;
  hora_rajada_max_hoje?: string | null;
  vento_max_24h?: number | null;
  rajada_max_24h?: number | null;
  chuva_hoje?: number | null;
  chuva_taxa_atual?: number | null;
  inicio_chuva_hoje?: string | null;
  chuva_1h: number | null;
  chuva_4h: number | null;
  chuva_6h?: number | null;
  chuva_12h: number | null;
  chuva_24h: number | null;
  chuva_36h?: number | null;
  chuva_48h: number | null;
  chuva_96h: number | null;
  nivel_rio?: string | null;
  cota_atencao?: string | null;
  cota_alerta?: string | null;
  cota_transbordo?: string | null;
  alerta_maximo_pct?: number | null;
  status_rio?: string | null;
  tendencia_rio?: string | null;
  chuva_pluvio_24h?: number | null;
  chuva_pluvio_96h?: number | null;
  ultima_leitura?: string;
  online?: boolean;
  ranking?: number | null;
}

export interface RiverHistoryPoint {
  datetime_brt: string;
  nivel: number;
  chuva: number;
  chuva_1h: number;
  chuva_24h: number;
  chuva_30d: number;
}

export interface RioJundiaData {
  codigo: string;
  nome: string;
  nome_curto: string;
  rede?: string;
  url: string;
  nivel_rio: string;
  cota_atencao: string;
  cota_alerta: string;
  cota_transbordo: string;
  alerta_maximo_pct: number;
  status_rio: string;
  tendencia_rio: string;
  ultima_leitura: string;
  chuva_pluvio_24h: number;
  chuva_pluvio_96h: number;
  historico_recente: RiverHistoryPoint[];
}

export interface AcumuladosDataset {
  atualizacao: string;
  total_estacoes: number;
  total_pluviometricas: number;
  total_hidrologicas: number;
  resumo: {
    media_chuva_24h: number;
    maior_acumulado_24h: number;
    maior_estacao_nome: string;
    rio_jundia_cota: string;
    rio_jundia_status: string;
    rio_jundia_pct: number;
    rio_jundia_tendencia: string;
    uv_atual: number;
  };
  uv_tempo_real?: {
    estacao_referencia: string;
    nome_estacao: string;
    url_estacao: string;
    uv: number;
    radiacao_solar: number;
    hora_leitura: string;
  };
  estacao_rio_jundia: RioJundiaData;
  estacoes: EstacaoPluvio[];
}

export interface InmetAviso {
  id: number;
  descricao: string;
  severidade: string;
  cor_nome: string;
  cor_badge: string;
  cor_hex: string;
  eh_direto_ostras?: boolean;
  inicio?: string;
  fim?: string;
  inicio_formatado: string;
  fim_formatado: string;
  riscos: string[];
  instrucoes: string[];
  estados?: string;
}

export interface OrlaDiaInfo {
  estado: string;
  ondas: string;
  badge: string;
  detalhe: string;
}

export interface OrlaPraiaCondicao {
  nome: string;
  tipo_orla: string;
  perfil: string;
  dias: {
    d0: OrlaDiaInfo;
    d1: OrlaDiaInfo;
    d2: OrlaDiaInfo;
  };
}

export interface OrlaDataset {
  status_geral: string;
  badge: string;
  mar_ondas: string;
  fonte_marinha: string;
  fonte_balneabilidade: string;
  nota_rodape: string;
  dias_rotulos: { key: 'd0' | 'd1' | 'd2'; rotulo: string; data_br: string; dia_semana: string }[];
  praias_condicoes: OrlaPraiaCondicao[];
  praias?: { praia: string; detalhes: string; status: string; badge: string }[];
  tabua_resumo?: {
    estacao: string;
    data: string;
    proxima_mare: { tipo: string; hora: string; altura: string } | null;
    mares_do_dia: { tipo: string; hora: string; altura: string }[];
  };
}

export interface BalnearPonto {
  praia: string;
  codigo: string;
  codigo_seirhi: string;
  localizacao: string;
  status: string;
  badge: string;
  tipo?: string;
}

export interface BalneabilidadeDataset {
  orgao: string;
  sistema: string;
  url_fonte?: string;
  url_seirhi?: string;
  url_portal_inea: string;
  boletim_numero: number;
  data_boletim: string;
  observacao_tecnica: string;
  pontos: BalnearPonto[];
}

export interface BoletimTurnoRow {
  data_iso: string;
  dia_semana: string;
  turno: string;
  rotulo_eixo: string;
  temp_min: number;
  temp_max: number;
  temp_media: number;
  sensacao_termica: number;
  umid_min: number;
  umid_max: number;
  pressao_hpa: number;
  vento_dir: string;
  vento_vel_min: number;
  vento_vel_max: number;
  vento_vel_media: number;
  rajada_max: number;
  chuva_media: number;
  chuva_prob?: number;
  chuva_faixa_turno?: string;
  taxa_horaria_txt?: string;
}

export interface InspecaoDiaInfo {
  data_iso?: string;
  data_br?: string;
  dia_semana?: string;
  alerta_ativo?: boolean;
  alerta_rotulo?: string;
  alerta_cor?: string;
  alerta_riscos?: string;
  granizo?: boolean;
  granizo_detalhe?: string;
  chuva?: {
    faixa_completa_txt?: string;
    taxa_horaria_pico?: string;
    janela_critica_horaria?: string;
    distribuicao_geografica?: Record<
      string,
      { regiao: string; volume_estimado: string; caracteristica: string }
    >;
    hidrologia_jundia?: {
      cota_atual_m: string;
      cota_transbordo_m: string;
      margem_segura_m: string;
      status: string;
      diagnostico: string;
    };
  };
  vento?: {
    rajada_faixa?: string;
    horario_pico?: string;
    direcao_pico?: string;
    rotacao?: string;
    impacto_infraestrutura?: string;
    impacto_maritimo?: string;
  };
  instrucoes_seguranca?: string[];
}

export interface BoletimMetadata {
  municipio: string;
  periodo: string;
  emissao: string;
  informe_alerta: string;
  sinopse_geral: string;
  inspecao_minuciosa_tempo_severo?: {
    status_geral_badge?: string;
    tem_alerta_hoje?: boolean;
    atualizacao_hora?: string;
    hoje_inspecao?: InspecaoDiaInfo;
    dias_inspecionados?: InspecaoDiaInfo[];
  };
  analise_precipitacao_multifonte?: {
    metodologia?: string;
    observado_recente?: {
      cemaden_pcd_18789?: {
        estacao: string;
        chuva_1h: number;
        chuva_24h: number;
        chuva_96h: number;
        leitura: string;
      };
      inea_rio_jundia?: {
        estacao: string;
        chuva_1h: number;
        chuva_24h: number;
        chuva_96h: number;
        nivel_m: string;
        status: string;
      };
    };
    previsto_por_dia?: {
      data_iso: string;
      data_br: string;
      dia_semana: string;
      chuva_media_modelos_mm: number;
      chuva_pico_convectivo_mm: number;
      faixa_oficial: string;
      tem_alerta_inmet: boolean;
      alerta_inmet_id?: number | null;
      taxa_horaria_pico: string;
    }[];
    acumulado_3dias_media?: number;
    acumulado_4dias_media?: number;
    acumulado_semana_media?: number;
    acumulado_semana_formula?: string;
    acumulado_8dias_formula?: string;
    acumulado_8dias_media?: number;
    conclusao_sem_pontas_soltas?: string;
  };
  sinopse_estruturada?: {
    evolucao_3_dias?: {
      dia_offset: string;
      dia_rotulo: string;
      subtitulo: string;
      badge: string;
      descricao: string;
      informe_populacao?: string[];
    }[];
  };
  alertas_estruturados?: {
    tipo: string;
    titulo: string;
    status: string;
    badge: string;
    detalhe: string;
    impacto: string;
  }[];
  glossario?: { termo: string; def: string }[];
  dias_resumo?: {
    dia: string;
    subtitulo: string;
    badge: string;
    descricao: string;
    sensacao_faixa?: string;
    informe_populacao?: string[];
    pilares?: {
      ceu?: { label: string; val: string };
      temp?: { label: string; val: string };
      sensacao?: { label: string; val: string };
      umid?: { label: string; val: string };
      vento?: { label: string; val: string };
      chuva?: { label: string; val: string };
      mar?: { label: string; val: string };
      uv?: { label: string; val: string };
      agua_precipitavel?: { label: string; val: string };
    };
  }[];
  inea_boletim_hidrometeorologico?: {
    orgao: string;
    sistema: string;
    sala_situacao: string;
    titulo: string;
    regiao_hidrografica: string;
    data_coleta: string;
    contato_sala_situacao?: string;
    url_oficial?: string;
    bulletin_info?: {
      disponivel: boolean;
      arquivo: string;
      data_boletim: string;
      label: string;
      url_pdf: string;
    };
    previsao_rh8?: {
      hoje?: {
        data: string;
        intensidade: string;
        faixa_chuva_mm: string;
        temp_max: number;
        temp_min: number;
        condicao: string;
        comportamento_rios: string;
        modelo_meteorologico: string;
      };
      amanha?: {
        data: string;
        intensidade: string;
        faixa_chuva_mm: string;
        temp_max: number;
        temp_min: number;
        condicao: string;
        comportamento_rios: string;
        modelo_meteorologico: string;
      };
    };
  };
  impactos_bairros?: {
    setor: string;
    risco_sab: string;
    risco_dom: string;
    risco_seg: string;
    impactos: string;
    acoes: string;
  }[];
  kpis?: {
    jundia_nivel: string;
    jundia_status: string;
    chuva_3d?: string;
    chuva_4d: string;
    aviso_marinha: string;
    pico_calor: string;
    plancon_status: string;
  };
  astronomia?: {
    estacao_ano: string;
    estacao_emoji?: string;
    nascer_sol: string;
    por_sol: string;
    duracao_dia: string;
    fase_lua: string;
    fase_lua_emoji?: string;
    iluminacao_lua: string;
    visibilidade_lua: string;
    fonte: string;
  };
  cemaden_riscos?: {
    fonte: string;
    data_boletim: string;
    atualizacao: string;
    url_portal: string;
    url_boletim_hoje?: string;
    alerta_rj_geologico?: {
      nivel: string;
      titulo: string;
      processo: string;
      descricao_oficial: string;
      setores_rio_das_ostras: string[];
      acoes_recomendadas: string;
    };
    alerta_rj_hidrologico?: {
      nivel: string;
      titulo: string;
      processo: string;
      descricao_oficial: string;
      setores_rio_das_ostras: string[];
      acoes_recomendadas: string;
    };
    mapas?: {
      geologico?: string;
      hidrologico?: string;
      painel_rj_hidro?: string;
      painel_rj_geo?: string;
    };
    cemaden_rj_tempo_real?: {
      portal_url: string;
      redec: string;
      municipio_nome: string;
      risco_hidrologico: {
        nivel: string;
        status: string;
        diagnostico: string;
        foco_municipal: string;
        mapa_svg: string;
      };
      risco_geologico: {
        nivel: string;
        status: string;
        diagnostico: string;
        foco_municipal: string;
        mapa_svg: string;
      };
      estatisticas_estaduais?: {
        hidrologico: { total_municipios: number; contagens: Record<string, number> };
        geologico: { total_municipios: number; contagens: Record<string, number> };
      };
    };
  };
  fontes_oficiais_consultadas?: { nome: string; url: string; tipo: string }[];
}

export interface HistoricoEstacoesDataset {
  atualizacao: string;
  periodo_inicio: string;
  periodo_fim: string;
  total_dias: number;
  total_horas: number;
  arquivos_planilha: { xlsx: string; csv: string };
  resumo_mensal: {
    ano_mes: string;
    rotulo_mes: string;
    dias_registrados: number;
    dias_com_chuva: number;
    chuva_total_media_mm: number;
    chuva_maior_estacao_mm: number;
    chuva_maior_estacao_nome: string;
    dia_mais_chuvoso?: string;
    vento_vel_media_kmh?: number;
    vento_vel_max_kmh?: number;
    vento_dir_predominante?: string;
    vento_rajada_max_kmh?: number;
    vento_rajada_max_detalhe?: string;
    temp_min_c?: number;
    temp_max_c?: number;
    sistema_atuante_mes?: string;
    caracteristicas_mes?: string;
  }[];
  resumo_diario: {
    data_iso?: string;
    data_br: string;
    ano_mes?: string;
    chuva_total_media_mm: number;
    chuva_maior_estacao_mm: number;
    chuva_maior_estacao_nome: string;
    chuva_pico_hora_mm?: number;
    chuva_pico_horario?: string;
    horas_com_chuva: number;
    vento_vel_media_kmh?: number;
    vento_vel_max_kmh?: number;
    vento_dir_predominante?: string;
    vento_rajada_max_kmh?: number;
    vento_rajada_max_horario?: string;
    vento_rajada_max_estacao?: string;
    temp_min_c?: number;
    temp_max_c?: number;
    umidade_media_pct?: number;
    pressao_min_hpa?: number;
    pressao_max_hpa?: number;
    sistema_atuante_dia?: string;
    categoria_sistema?: string;
    caracteristicas_dia?: string;
  }[];
  registros_horarios?: {
    data_iso: string;
    data_br: string;
    horario: string;
    chuva_mm_hora: number;
    chuva_max_estacao_mm: number;
    chuva_max_estacao_nome: string;
    vento_velocidade_kmh?: number;
    vento_velocidade_media_kmh?: number;
    vento_direcao_cardeal?: string;
    vento_rajada_kmh?: number;
    vento_estacao_nome?: string;
    temperatura_c?: number;
    umidade_pct?: number;
    pressao_hpa?: number;
    sistema_atuante_dia?: string;
  }[];
}

export interface OpenMeteoData {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    surface_pressure: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
    precipitation: number;
    weather_code: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation: number[];
    precipitation_probability: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    surface_pressure: number[];
    relative_humidity_2m: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
    uv_index_max: number[];
  };
}

export interface MarinhaAvisos {
  aviso_ativo: boolean;
  numero?: string | null;
  tipo: string;
  area: string;
  forca: string;
  rajadas: string;
  validade: string;
  mar_ondas: string;
  restricao?: string;
  emissao?: string | null;
  avisos_ativos?: {
    numero?: string;
    tipo?: string;
    area?: string;
    validade?: string;
    descricao?: string;
  }[];
  cartas_sinoticas?: { horario: string; url: string }[];
}

export interface TabuaMares {
  estacao: string;
  id_estacao_chm: number;
  latitude: string;
  longitude: string;
  fuso?: string;
  orgao_oficial: string;
  url_oficial: string;
  url_avisos?: string;
  atualizado_em: string;
  proxima_mare?: { tipo: string; hora: string; altura: string } | null;
  dias?: {
    data_iso: string;
    data_br: string;
    dia_semana: string;
    eventos: { tipo: string; hora: string; altura: string }[];
  }[];
}

export function degToCompass(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export function wmoToPtBr(code: number): string {
  if (code === 0) return 'Céu limpo';
  if (code <= 2) return 'Poucas nuvens';
  if (code === 3) return 'Céu encoberto / muitas nuvens';
  if (code >= 45 && code <= 48) return 'Neblina / névoa úmida';
  if (code >= 51 && code <= 57) return 'Chuvisco / garoa fraca';
  if (code >= 61 && code <= 67) return 'Chuva leve a moderada';
  if (code >= 80 && code <= 82) return 'Pancadas de chuva';
  if (code >= 95) return 'Pancadas de chuva com trovoadas';
  return 'Muitas nuvens com instabilidade';
}

export async function fetchJsonSafe<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function loadAllLiveSiteData() {
  const ts = Date.now();
  const [
    acumulados,
    boletimOficial,
    boletimMeta,
    inmetAvisos,
    marinhaAvisos,
    orla,
    balneabilidade,
    tabuaMares,
    historico,
    openMeteo,
  ] = await Promise.all([
    fetchJsonSafe<AcumuladosDataset>(`${SITE_BASE}/data/acumulados_estacoes.json?t=${ts}`),
    fetchJsonSafe<BoletimTurnoRow[]>(`${SITE_BASE}/data/boletim_oficial.json?t=${ts}`),
    fetchJsonSafe<BoletimMetadata>(`${SITE_BASE}/data/boletim_metadata.json?t=${ts}`),
    fetchJsonSafe<InmetAviso[]>(`${SITE_BASE}/data/inmet_avisos.json?t=${ts}`),
    fetchJsonSafe<MarinhaAvisos>(`${SITE_BASE}/data/marinha_avisos.json?t=${ts}`),
    fetchJsonSafe<OrlaDataset>(`${SITE_BASE}/data/orla_condicoes.json?t=${ts}`),
    fetchJsonSafe<BalneabilidadeDataset>(`${SITE_BASE}/data/balneabilidade.json?t=${ts}`),
    fetchJsonSafe<TabuaMares>(`${SITE_BASE}/data/tabua_mares.json?t=${ts}`),
    fetchJsonSafe<HistoricoEstacoesDataset>(`${SITE_BASE}/data/historico_estacoes.json?t=${ts}`),
    fetchJsonSafe<OpenMeteoData>(
      'https://api.open-meteo.com/v1/forecast?latitude=-22.5269&longitude=-41.945&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,precipitation_probability,precipitation,surface_pressure,relative_humidity_2m,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max&timezone=America%2FSao_Paulo&forecast_days=8'
    ),
  ]);

  return {
    acumulados,
    boletimOficial,
    boletimMeta,
    inmetAvisos,
    marinhaAvisos,
    orla,
    balneabilidade,
    tabuaMares,
    historico,
    openMeteo,
  };
}
