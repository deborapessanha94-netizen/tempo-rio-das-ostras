# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

test_cases = [
    {
        'name': 'Today INMET Storm & Rain (User actual case)',
        'inmet_resumo': 'Muitas nuvens com pancadas de chuva e trovoadas',
        'sub': 'Muitas nuvens com pancadas de chuva e trovoadas',
        'ceu': 'Céu encoberto com pancadas de chuva e trovoadas isoladas à tarde/noite',
        'wmo': 3,
        'is_day': True,
        'precip': 0
    },
    {
        'name': 'Sunny Day (Sol Pleno / Céu Claro)',
        'inmet_resumo': 'Céu claro com predomínio de sol',
        'sub': 'Ensolarado',
        'ceu': 'Céu aberto com sol pleno ao longo do dia',
        'wmo': 0,
        'is_day': True,
        'precip': 0
    },
    {
        'name': 'Sunny with Few Clouds (Poucas Nuvens)',
        'inmet_resumo': 'Poucas nuvens',
        'sub': 'Predomínio de sol com poucas nuvens',
        'ceu': 'Céu claro',
        'wmo': 1,
        'is_day': True,
        'precip': 0
    },
    {
        'name': 'Partly Cloudy (Sol entre nuvens)',
        'inmet_resumo': 'Parcialmente nublado com aberturas de sol',
        'sub': 'Sol entre nuvens e variação de nebulosidade',
        'ceu': 'Sol entre nuvens',
        'wmo': 2,
        'is_day': True,
        'precip': 0
    },
    {
        'name': 'Overcast Day (Encoberto sem chuva)',
        'inmet_resumo': 'Nublado a encoberto sem chuva',
        'sub': 'Encoberto / Nublado',
        'ceu': 'Céu encoberto o dia todo',
        'wmo': 3,
        'is_day': True,
        'precip': 0
    },
    {
        'name': 'Rainy Day (Pancadas de chuva)',
        'inmet_resumo': 'Nublado com pancadas de chuva',
        'sub': 'Chuva moderada a forte',
        'ceu': 'Céu fechado com pancadas de chuva',
        'wmo': 61,
        'is_day': True,
        'precip': 3.5
    },
    {
        'name': 'Clear Night (Noite estrelada)',
        'inmet_resumo': 'Céu claro',
        'sub': 'Céu claro',
        'ceu': 'Céu limpo e sem nuvens',
        'wmo': 0,
        'is_day': False,
        'precip': 0
    },
    {
        'name': 'Partly Cloudy Night',
        'inmet_resumo': 'Parcialmente nublado',
        'sub': 'Parcialmente nublado',
        'ceu': 'Noite com algumas nuvens',
        'wmo': 2,
        'is_day': False,
        'precip': 0
    }
]

def resolve(tc):
    combined = f"{tc['inmet_resumo']} {tc['sub']} {tc['ceu']}".lower()
    wmo = tc['wmo']
    is_day = tc['is_day']
    precip = tc['precip']

    # 1. Trovoadas / Tempestade / Raios
    if any(k in combined for k in ['trovoada', 'tempestade', 'raio', 'temporal', 'elétrica', 'trovoadas']) or wmo in [95, 96, 99, 82]:
        return {
            'icon': 'cloud-lightning',
            'sky': 'Céu Carregado com Trovoadas e Raios' if is_day else 'Céu Noturno Carregado com Trovoadas',
            'condition': tc['inmet_resumo'] or tc['sub'] or 'Muitas nuvens com pancadas de chuva e trovoadas'
        }
    
    # 2. Chuva / Pancadas de chuva
    if any(k in combined for k in ['pancada', 'chuva forte', 'chuva moderada', 'chuva contínua', 'pancadas']) or wmo in [61, 63, 65, 80, 81] or precip > 0.5:
        return {
            'icon': 'cloud-rain',
            'sky': 'Céu Encoberto com Pancadas de Chuva',
            'condition': tc['inmet_resumo'] or tc['sub'] or 'Nublado com Pancadas de Chuva'
        }
    
    # 3. Chuvisco / Garoa / Chuva Leve
    if any(k in combined for k in ['garoa', 'chuvisco', 'chuva leve', 'chuva fina', 'chuva fraca']) or wmo in [51, 53, 55]:
        return {
            'icon': 'cloud-drizzle',
            'sky': 'Céu Úmido com Garoa / Chuvisco',
            'condition': tc['sub'] or 'Nublado com Garoa'
        }
    
    # 4. Nevoeiro / Neblina
    if any(k in combined for k in ['nevoeiro', 'neblina']) or wmo in [45, 48]:
        return {
            'icon': 'cloud-fog',
            'sky': 'Nevoeiro Litorâneo e Visibilidade Reduzida',
            'condition': 'Nevoeiro Litorâneo'
        }
    
    # 5. Sol entre nuvens / Parcialmente Nublado
    if any(k in combined for k in ['parcialmente nublado', 'sol entre nuvens', 'aberturas de sol', 'variação de nebulosidade']) or wmo == 2:
        return {
            'icon': 'cloud-sun' if is_day else 'cloud-moon',
            'sky': 'Sol entre Nuvens com Variação de Nebulosidade' if is_day else 'Noite com Nuvens Dispersas',
            'condition': 'Parcialmente Nublado / Sol com Nuvens' if is_day else 'Parcialmente Nublado'
        }

    # 6. Céu Limpo / Sol Pleno / Céu Claro / Poucas Nuvens
    if any(k in combined for k in ['céu claro', 'céu limpo', 'sol pleno', 'ensolarado', 'poucas nuvens', 'predomínio de sol']) or wmo in [0, 1]:
        return {
            'icon': 'sun' if is_day else 'moon',
            'sky': 'Céu Aberto e Ensolarado (Sol Pleno)' if is_day else 'Céu Limpo e Noite Estrelada',
            'condition': 'Ensolarado / Céu Aberto' if is_day else 'Céu Limpo / Noite Clara'
        }
    
    # 7. Nublado / Encoberto sem chuva
    if any(k in combined for k in ['encoberto', 'nublado', 'muitas nuvens']) or wmo == 3:
        return {
            'icon': 'cloud',
            'sky': 'Céu Encoberto a Nublado (Muitas Nuvens)',
            'condition': 'Encoberto / Nublado'
        }
    
    return {
        'icon': 'cloud-sun' if is_day else 'cloud-moon',
        'sky': 'Variação de Nebulosidade',
        'condition': tc['sub'] or 'Tempo Variável'
    }

for tc in test_cases:
    res = resolve(tc)
    print(f"{tc['name']}:")
    print(f"  Icon: {res['icon']}")
    print(f"  Sky:  {res['sky']}")
    print(f"  Cond: {res['condition']}")
