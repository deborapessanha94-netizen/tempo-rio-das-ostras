# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add inmetForecast: null to state
old_state = "const state = {\n  jundia10dData: null,"
new_state = "const state = {\n  inmetForecast: null,\n  jundia10dData: null,"
if old_state not in content:
    # try with varying whitespace
    import re
    m = re.search(r'const\s+state\s*=\s*\{\s*\n\s*jundia10dData:\s*null,', content)
    if m:
        content = content[:m.start()] + "const state = {\n  inmetForecast: null,\n  jundia10dData: null," + content[m.end():]
        print("Updated state with inmetForecast: null")
    else:
        print("Could not find state definition!")
else:
    content = content.replace(old_state, new_state, 1)
    print("Replaced state definition")

# 2. Phase 1 fetch in loadAllApplicationData
old_p1 = "const [metaRes, rowsRes, ineaRes, tabuaRes, orlaRes, avisosMarRes, balnearRes, inmetAvisosRes, estacoesRes, inea10dRes] = await Promise.allSettled(["
new_p1 = "const [metaRes, rowsRes, ineaRes, tabuaRes, orlaRes, avisosMarRes, balnearRes, inmetAvisosRes, estacoesRes, inea10dRes, inmetPrevRes] = await Promise.allSettled(["
if old_p1 in content:
    content = content.replace(old_p1, new_p1, 1)
    print("Updated Phase 1 destructuring")
else:
    print("Could not find Phase 1 destructuring!")

old_p1_calls = "getIneaJundia10d()\n    ]);"
new_p1_calls = "getIneaJundia10d(),\n      getInmetForecast()\n    ]);"
if old_p1_calls in content:
    content = content.replace(old_p1_calls, new_p1_calls, 1)
    print("Updated Phase 1 getInmetForecast call")
else:
    print("Could not find Phase 1 getIneaJundia10d call!")

old_p1_assign = "if (metaRes.status === 'fulfilled' && metaRes.value) state.boletimMetadata = metaRes.value;"
new_p1_assign = "if (metaRes.status === 'fulfilled' && metaRes.value) state.boletimMetadata = metaRes.value;\n    if (inmetPrevRes.status === 'fulfilled' && inmetPrevRes.value) state.inmetForecast = inmetPrevRes.value;"
if old_p1_assign in content:
    content = content.replace(old_p1_assign, new_p1_assign, 1)
    print("Updated Phase 1 state.inmetForecast assignment")
else:
    print("Could not find Phase 1 state.boletimMetadata assignment!")

# 3. Add resolveSkyAndHeroWeather right before renderDashboardUI
resolver_code = '''
/**
 * Resolução dinâmica e integrada da Condição do Céu no Momento e do Ícone da Previsão
 * Cruza o Boletim Oficial, Previsão INMET (período atual), e telemetria Open-Meteo.
 */
export function resolveSkyAndHeroWeather(meta, inmetForecast, weather) {
  const d0 = meta?.dias_resumo?.[0];
  const subTitle = d0?.subtitulo || '';
  const ceuVal = d0?.pilares?.ceu?.val || '';
  const chuvaVal = d0?.pilares?.chuva?.val || '';

  const hour = new Date().getHours();
  const isDay = weather?.current?.is_day !== undefined ? (weather.current.is_day === 1) : (hour >= 6 && hour < 18);
  const periodKey = (hour >= 6 && hour < 12) ? 'manha' : (hour >= 12 && hour < 18) ? 'tarde' : 'noite';

  let inmetResumo = '';
  if (inmetForecast && inmetForecast['3304524']) {
    const roDates = Object.keys(inmetForecast['3304524']);
    if (roDates.length > 0) {
      const todayForecast = inmetForecast['3304524'][roDates[0]];
      const currentPeriod = todayForecast?.[periodKey] || todayForecast?.['manha'] || todayForecast?.['tarde'] || todayForecast?.['noite'];
      if (currentPeriod?.resumo) {
        inmetResumo = currentPeriod.resumo;
      }
    }
  }

  const curWeatherCode = weather?.current?.weather_code;
  const curPrecip = weather?.current?.precipitation || 0;

  // Texto consolidado para análise semântica
  const combined = `${inmetResumo} ${subTitle} ${ceuVal} ${chuvaVal}`.toLowerCase();

  // 1. Trovoadas / Tempestades / Raios
  if (
    combined.includes('trovoada') ||
    combined.includes('tempestade') ||
    combined.includes('raio') ||
    combined.includes('temporal') ||
    combined.includes('elétrica') ||
    [95, 96, 99, 82].includes(curWeatherCode)
  ) {
    return {
      icon: 'cloud-lightning',
      sky: isDay ? 'Céu Carregado com Risco de Trovoadas e Raios' : 'Céu Noturno Carregado com Trovoadas',
      condition: inmetResumo || subTitle || 'Muitas nuvens com pancadas de chuva e trovoadas',
      color: 'text-amber-500 dark:text-amber-400'
    };
  }

  // 2. Chuva / Pancadas de Chuva
  if (
    combined.includes('pancada') ||
    combined.includes('chuva forte') ||
    combined.includes('chuva moderada') ||
    combined.includes('chuva contínua') ||
    combined.includes('pancadas') ||
    [61, 63, 65, 80, 81].includes(curWeatherCode) ||
    curPrecip > 0.5
  ) {
    return {
      icon: 'cloud-rain',
      sky: 'Céu Encoberto com Pancadas de Chuva',
      condition: inmetResumo || subTitle || 'Nublado com Pancadas de Chuva',
      color: 'text-blue-500 dark:text-blue-400'
    };
  }

  // 3. Chuvisco / Garoa / Chuva Leve
  if (
    combined.includes('garoa') ||
    combined.includes('chuvisco') ||
    combined.includes('chuva leve') ||
    combined.includes('chuva fina') ||
    combined.includes('chuva fraca') ||
    [51, 53, 55].includes(curWeatherCode)
  ) {
    return {
      icon: 'cloud-drizzle',
      sky: 'Céu Úmido com Garoa / Chuvisco',
      condition: subTitle || 'Nublado com Chuviscos',
      color: 'text-cyan-500 dark:text-cyan-400'
    };
  }

  // 4. Nevoeiro / Neblina
  if (
    combined.includes('nevoeiro') ||
    combined.includes('neblina') ||
    [45, 48].includes(curWeatherCode)
  ) {
    return {
      icon: 'cloud-fog',
      sky: 'Nevoeiro Litorâneo e Visibilidade Reduzida',
      condition: 'Nevoeiro Litorâneo',
      color: 'text-slate-400 dark:text-slate-300'
    };
  }

  // 5. Sol entre nuvens / Parcialmente Nublado
  if (
    combined.includes('parcialmente nublado') ||
    combined.includes('sol entre nuvens') ||
    combined.includes('aberturas de sol') ||
    combined.includes('variação de nebulosidade') ||
    curWeatherCode === 2
  ) {
    return {
      icon: isDay ? 'cloud-sun' : 'cloud-moon',
      sky: isDay ? 'Sol entre Nuvens com Nebulosidade Variável' : 'Noite com Nuvens Dispersas',
      condition: isDay ? 'Parcialmente Nublado / Sol com Nuvens' : 'Parcialmente Nublado',
      color: isDay ? 'text-amber-500 dark:text-amber-400' : 'text-indigo-300 dark:text-indigo-200'
    };
  }

  // 6. Céu Limpo / Sol Pleno / Céu Claro / Poucas Nuvens
  if (
    combined.includes('céu claro') ||
    combined.includes('céu limpo') ||
    combined.includes('sol pleno') ||
    combined.includes('ensolarado') ||
    combined.includes('poucas nuvens') ||
    combined.includes('predomínio de sol') ||
    [0, 1].includes(curWeatherCode)
  ) {
    return {
      icon: isDay ? 'sun' : 'moon',
      sky: isDay ? 'Céu Aberto e Ensolarado (Sol Pleno)' : 'Céu Limpo e Noite Estrelada',
      condition: isDay ? 'Ensolarado / Céu Aberto' : 'Céu Limpo / Noite Clara',
      color: isDay ? 'text-amber-500 dark:text-amber-400' : 'text-indigo-400 dark:text-indigo-300'
    };
  }

  // 7. Nublado / Encoberto sem chuva
  if (
    combined.includes('encoberto') ||
    combined.includes('nublado') ||
    combined.includes('muitas nuvens') ||
    curWeatherCode === 3
  ) {
    return {
      icon: 'cloud',
      sky: 'Céu Encoberto a Nublado (Muitas Nuvens)',
      condition: 'Encoberto / Nublado',
      color: 'text-slate-600 dark:text-slate-300'
    };
  }

  // Fallback padrão seguro
  return {
    icon: isDay ? 'cloud-sun' : 'cloud-moon',
    sky: 'Variação de Nebulosidade',
    condition: subTitle || 'Tempo Variável',
    color: 'text-amber-500 dark:text-amber-400'
  };
}

function renderDashboardUI(meta, rows, weather) {'''

if "function renderDashboardUI(meta, rows, weather) {" in content:
    content = content.replace("function renderDashboardUI(meta, rows, weather) {", resolver_code, 1)
    print("Injected resolveSkyAndHeroWeather before renderDashboardUI")
else:
    print("Could not find function renderDashboardUI!")

# 4. In renderDashboardUI: update Hero Card block
old_hero_block = '''  const condEl = document.getElementById('hero-condition');
  const subcondEl = document.getElementById('hero-subcondition');
  const heroAlertPill = document.getElementById('hero-alert-pill');
  const heroIcon = document.getElementById('hero-weather-icon');
  if (heroIcon && primeiroDia?.pilares?.ceu?.icon) {
    heroIcon.innerHTML = `<i data-lucide="${primeiroDia.pilares.ceu.icon}" class="w-8 h-8 sm:w-9 sm:h-9"></i>`;
  }
  if (condEl) {
    condEl.textContent = primeiroDia?.subtitulo?.split('•')?.[0]?.trim() || 'Parcialmente Nublado';
  }'''

# Note: due to blank lines, let's use regex or search
import re
hero_pattern = re.compile(r"const condEl = document\.getElementById\('hero-condition'\);[\s\S]*?condEl\.textContent = primeiroDia\?\.subtitulo\?\.split\('•'\)\?\.\[0\]\?\.trim\(\) \|\| 'Parcialmente Nublado';\s*\}", re.MULTILINE)

m_hero = hero_pattern.search(content)
if m_hero:
    new_hero_block = '''const condEl = document.getElementById('hero-condition');
  const subcondEl = document.getElementById('hero-subcondition');
  const heroAlertPill = document.getElementById('hero-alert-pill');
  const heroIcon = document.getElementById('hero-weather-icon');
  const heroSkyEl = document.getElementById('hero-sky-condition');

  // Resolução Integrada e Semântica do Céu no Momento e Ícone de Acordo com a Previsão
  const heroWeather = resolveSkyAndHeroWeather(meta, state.inmetForecast, weather);

  if (heroSkyEl) {
    heroSkyEl.textContent = heroWeather.sky;
  }

  if (condEl) {
    condEl.textContent = heroWeather.condition;
  }

  if (heroIcon) {
    heroIcon.innerHTML = `<i data-lucide="${heroWeather.icon}" class="w-8 h-8 sm:w-9 sm:h-9 ${heroWeather.color}"></i>`;
    if (window.lucide) window.lucide.createIcons();
  }'''
    content = content[:m_hero.start()] + new_hero_block + content[m_hero.end():]
    print("Replaced Hero Card condition and icon logic in renderDashboardUI")
else:
    print("Could not match hero_pattern!")

# 5. Remove downstream WMO override in renderDashboardUI
downstream_wmo = re.compile(r"// Atualiza Condição do Tempo e Ícone com base no código WMO em tempo real\s*if\s*\(weatherCode\s*!==\s*undefined\)\s*\{[\s\S]*?heroIcon\.innerHTML\s*=\s*`<i data-lucide=\"\$\{wmo\.icon\}\" class=\"w-8 h-8 sm:w-9 sm:h-9 text-black\"><\/i>`;\s*\}\s*\}", re.MULTILINE)
m_wmo = downstream_wmo.search(content)
if m_wmo:
    content = content[:m_wmo.start()] + "// Condição e ícone já resolvidos harmonicamente por resolveSkyAndHeroWeather" + content[m_wmo.end():]
    print("Removed downstream WMO code override")
else:
    print("Could not match downstream_wmo pattern!")

# 6. Ensure lucide.createIcons() is called at end of renderDashboardUI
old_end = "renderChuvaTurnosBars(rows);\n}"
if old_end not in content:
    # try regex
    m_end = re.search(r'renderChuvaTurnosBars\(rows\);\s*\}', content)
    if m_end:
        content = content[:m_end.start()] + "renderChuvaTurnosBars(rows);\n  if (window.lucide) window.lucide.createIcons();\n}" + content[m_end.end():]
        print("Added lucide.createIcons() at end of renderDashboardUI")
    else:
        print("Could not find end of renderDashboardUI")
else:
    content = content.replace(old_end, "renderChuvaTurnosBars(rows);\n  if (window.lucide) window.lucide.createIcons();\n}", 1)
    print("Added lucide.createIcons() at end of renderDashboardUI")

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Finished writing js/app.js")
