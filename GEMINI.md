# Diretrizes Operacionais do Projeto • TEMPO em Rio das Ostras (@tempoemriodasostras)

Este documento estabelece as regras permanentes e mandatórias de operação, análise sinótica e filtragem meteorológica para a aplicação do portal **TEMPO em Rio das Ostras**.

---

## 1. Protocolo Permanente de Inspeção Minuciosa de Tempo Severo & Mau Tempo

Sempre que houver **aviso meteorológico ativo ou programado** emitido pelos órgãos oficiais:
- **INMET** (Tempestade, Chuvas Intensas, Vendaval, Declínio de Temperatura, Queda de Granizo);
- **Marinha do Brasil - CHM / SMM** (Mau Tempo, Vento Muito Forte, Vento Forte, Mar Grosso, Ressaca para a Área Delta: Farol de São Tomé a Cabo Frio);
- **INEA Alerta de Cheias** (Elevação hidrológica da bacia do Rio Jundiá, Estágio de Atenção ou Alerta Máximo);
- **CEMADEN** (Riscos geo-hidrológicos de alagamentos, enxurradas e deslizamentos para Rio das Ostras e Região dos Lagos / Norte Fluminense);

**DEVE-SE OBRIGATORIAMENTE REALIZAR UMA INSPEÇÃO MINUCIOSA E APROFUNDADA** dos dados brutos e modelos numéricos, com foco prioritário em:

### A) Volumes de Chuva & Taxas Horárias (Sem Médias Confusas)
1. **Diferenciação Clara entre Modelos de Grade e Teto de Tempestade:**
   - Modelos numéricos contínuos (ECMWF, GFS, ICON) distribuem a chuva homogeneamente na grade espacial (exibindo médias como `1.0 a 15.0 mm`).
   - Tempestades convectivas sob alerta concentram precipitação em células isoladas com **potencial de teto severo** (ex: `até 50 mm/dia` ou `até 100 mm/dia`).
   - O portal deve **SEMPRE exibir a média contínua E o teto convectivo de tempestade lado a lado**, evitando tanto o alarmismo desnecessário quanto a subnotificação perigosa de riscos.
2. **Taxa Horária Instantânea:**
   - Extrair a intensidade pico em mm/h (ex: `20 a 30 mm/h` em Alerta Amarelo ou `30 a 60 mm/h` em Alerta Laranja).
3. **Janela Horária Crítica:**
   - Identificar no dataset horário de alta resolução a faixa exata de horas com maior probabilidade e intensidade convectiva (ex: `13:00 às 18:00h`).
4. **Distribuição Geográfica Setorizada por Bairros de Rio das Ostras:**
   - **Faixa Costeira & Praias (Costazul, Tartaruga, Bosque, Boca da Barra):** 70% a 85% do acumulado geral, maior ventilação oceânica dissipando células térmicas leves, mas sujeita a rajadas costeiras súbitas.
   - **Centro & Baixadas (Centro, Operário, Extensão do Bosque, Âncora):** Volume compatível com a média municipal; vigilância de drenagem rápida caso a taxa instantânea alcance 20-30 mm/h.
   - **Região Rural & Encostas (Cantagalo, Rocha Leão, Palmital):** Acumulados 20% a 35% superiores à orla, amplificados pelo efeito orográfico da Serra do Mar e convecção térmica continental.
5. **Hidrologia da Bacia do Rio Jundiá:**
   - Integrar a telemetria em tempo real da PCD INEA 224103620 (cota atual, status de vazante e margem segura até a cota crítica de transbordo de 2,84 m).

---

### B) Ventos e Rajadas de Vento (Pico Horário & Rotação)
1. **Faixa de Rajada Oficial vs Modelada:**
   - Apresentar a faixa do aviso oficial (ex: `40 a 60 km/h` em alerta amarelo; `60 a 85 km/h` em laranja; `até 74-88 km/h` na Área Delta da Marinha) combinada com a rajada máxima instantânea calculada pelos modelos.
2. **Horário de Pico Exato:**
   - Inspecionar a série horária de rajadas (`wind_gusts_10m`) para indicar à população e defesa civil o horário previsto do pico (ex: `Pico previsto entre 14h e 17h`).
3. **Rotação de Quadrante:**
   - Detectar a mudança na direção dos ventos (ex: `Nordeste rondando para Sul/Sudoeste na aproximação da linha de instabilidade`).
4. **Impactos Diferenciados:**
   - **Orla Marítima:** Vagas de vento, arrebentação e marola na praia.
   - **Infraestrutura Terrestre:** Riscos a árvores, fios e estruturas soltas.

---

### C) Granizo & Procedimentos de Segurança (Anti-Pânico)
- Identificar menção de granizo nos avisos oficiais e sintetizar orientações práticas da Defesa Civil (199) e Corpo de Bombeiros (193).

---

## 2. Preservação dos Modelos Numéricos Oficiais
- **NÃO alterar os modelos meteorológicos existentes** (ECMWF, GFS, ICON, COSMO, CPTEC/INPE, INEA, CEMADEN, CHM/Marinha).
- A inspeção atua como **camada adicional de filtragem, aprofundamento e precisão diagnóstica**, integrando harmoniosamente as telemetrias e avisos vigentes.

---

## 3. Identidade Visual Oficial do Portal
- Seguir estritamente a paleta nórdica cerâmica:
  - Fundo / Card Escuro: `#1D1F26`
  - Fundo Claro / Superfície: `#f4f1ea` / `#ffffff`
  - Acentos Térmicos / Alerta: `#ea580c` (Laranja Solar), `#eab308` (Amarelo Atenção)
  - Oceano / Chuva: `#0284c7` (Azul Céu)
  - Bordas / Divisórias: `#cbd5e1` / `#e2e8f0`
- Tipografia mobile de alta legibilidade, respeitando espaçamento negativo e sem poluição visual.
