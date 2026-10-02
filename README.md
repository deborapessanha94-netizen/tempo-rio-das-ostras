# 🌊 MeteoPulse — Sistema Especializado de Meteorologia & Defesa Civil | RIO DAS OSTRAS (RJ)

Portal meteorológico, costeiro e hidrológico desenvolvido exclusivamente para o município de **Rio das Ostras - RJ** (Código IBGE: **3304524**), integrando os **17 órgãos e sistemas oficiais** de monitoramento do Brasil e do Estado do Rio de Janeiro.

---

## 🔗 Link de Acesso Atualizado

Acesse o site em tempo real pelo navegador:
👉 **[http://localhost:8080](http://localhost:8080)**

---

## 🏛️ Os 17 Órgãos & Portais Oficiais Integrados

1. **[INMET Avisos](https://avisos.inmet.gov.br/)**: Alertas meteorológicos ativos de chuvas intensas, tempestades e ventos costeiros para Rio das Ostras e RJ.
2. **[INMET Meteograma Dinâmico (3304524)](https://meteograma.inmet.gov.br/3304524/dinamico)**: Meteograma oficial em tempo real para o município de Rio das Ostras.
3. **[INMET Previsão Oficial (3304524)](https://previsao.inmet.gov.br/3304524)**: Boletim diário oficial por turnos (Manhã, Tarde e Noite).
4. **[INMET VIME Sudeste](https://vime.inmet.gov.br/SE)**: Visualizador de modelos numéricos para o Sudeste, contemplando:
   - Precipitação acumulada (mm)
   - **Água Precipitável (Total Column Precipitable Water)** em mm / kg/m²
   - Ventos a 10m (km/h e nós)
   - Rajadas de vento (km/h)
   - Pressão ao Nível do Mar - PNM (hPa)
   - Temperatura a 2m e sensação térmica
   - Umidade Relativa do ar (%)
   - Ponto de Orvalho (°C) e Cobertura de Nuvens (%)
5. **[CPTEC / INPE](https://www.cptec.inpe.br/)**: Previsão numérica e modelos de tempo e clima.
6. **[Marinha do Brasil / CHM — Avisos de Mau Tempo](https://www.marinha.mil.br/chm/dados-do-smm-avisos-de-mau-tempo/avisos-de-mau-tempo)**: Serviço Meteorológico Marinho para a **Área Charlie / Subárea Delta (Cabo Frio a Campos dos Goytacazes)** cobrindo a orla de Rio das Ostras (Costazul, Tartaruga, Bosque, Areias Negras).
7. **[Marinha do Brasil / CHM — Cartas Sinóticas](https://www.marinha.mil.br/chm/cartassinoticas)**: Cartas sinóticas de superfície com isóbaras, frentes frias e sistemas de pressão no Atlântico Sul.
8. **[CEMADEN — Riscos Geo-hidrológicos](https://www.gov.br/cemaden/pt-br/assuntos/riscos-geo-hidrologicos)**: Classificação de risco de movimentos de massa (deslizamentos) e inundações.
9. **[Painel CEMADEN-RJ / Defesa Civil](https://painelcemadenrj.defesacivil.rj.gov.br/monitoramento/v2/mapa/)**: Mapa pluviométrico estadual e monitoramento de desastres da Defesa Civil Estadual.
10. **[INEA — Alerta de Cheias Macaé e Rio das Ostras](https://alertadecheias.inea.rj.gov.br/dados/macae_e_das_ostras.php)**: **Telemetria ao vivo** da régua do **Rio Jundiá em Rio das Ostras** e rios vizinhos com nível em metros e chuvas acumuladas (1h, 4h, 24h, 96h, 30d).
11. **[INMET — Condições Registradas](https://tempo.inmet.gov.br/CondicoesRegistradas)**: Dados das estações automáticas da região (Macaé A608, Silva Jardim A659, Arraial do Cabo A606).
12. **[INEA — Radar Tool RJ](https://radartool.inea.rj.gov.br/radar-tool/)**: Radar meteorológico do Estado do Rio de Janeiro.
13. **[INPE — Queimadas Situação Atual](https://data.inpe.br/queimadas/situacao_atual/)**: Monitoramento de focos de calor na APA da Restinga de Jurubatiba e vegetação local.
14. **[CEMADEN / CENAD — Briefing](https://www.gov.br/cemaden/pt-br/assuntos/briefing-cemaden-cenad)**: Relatório diário conjunto de risco e clima do CENAD/CEMADEN.
15. **[Defesa Civil RJ — REDEC 1](https://painelcemadenrj.defesacivil.rj.gov.br/monitoramento/v2/mapa/redec.php?action=1)**: Regional de Defesa Civil das Baixadas Litorâneas responsável por Rio das Ostras.
16. **[INEA — Portal Rio das Ostras](https://www.inea.rj.gov.br/rio-das-ostras/)**: Gestão ambiental das bacias, APA da Lagoa de Iriry e Rio das Ostras.
17. **[CPTEC / INPE — DSAT](https://www.cptec.inpe.br/dsat/)**: Satélite meteorológico GOES-16 em tempo real sobre o Estado do Rio de Janeiro.

---

## 🌟 Os 5 Pilares Meteorológicos Específicos para Rio das Ostras

1. **Previsão de Precipitação**:
   - Volume diário e horários de chuva (mm)
   - Probabilidade percentual
   - **Água Precipitável (VIME INMET)**
   - Telemetria de réguas fluviométricas do Rio Jundiá (INEA)
2. **Previsão de Ventos & Mar**:
   - Velocidade e rajadas (km/h e nós)
   - Bússola analógica interativa giratória (vento predominante Nordeste / Sudoestão de frente fria)
   - Escala Beaufort e avisos marítimos da Marinha (Área Delta)
3. **Previsão de Pressão Atmosférica & Cartas Sinóticas**:
   - Barômetro em hPa e mmHg (pressão ao nível do mar e na superfície)
   - Análise sinótica e link para cartas do CHM
4. **Previsão de Umidade do Ar**:
   - Umidade relativa (%) e Ponto de Orvalho (°C)
   - Critérios sanitários da OMS e Defesa Civil REDEC 1
5. **Previsão de Temperatura**:
   - Temperatura e sensação térmica
   - Mínima, máxima e amplitude
   - Previsão por turnos oficiais do INMET (Manhã, Tarde, Noite)

---

## 🚀 Como Executar Localmente

O servidor com backend proxy para APIs do INMET e INEA roda com:
```powershell
python C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\server.py
```
Acesse em: **http://localhost:8080**
