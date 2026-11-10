import re
from pathlib import Path

p = Path(r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\index.html")
txt = p.read_text(encoding="utf-8").replace("\r\n", "\n")

# 1. Remove "Baixar Card Oficial (Redes Sociais) / Baixar Card Tempo Agora" from Previsão & Tempo dropdown
txt, n1 = re.subn(
    r'\s*<!-- Ações de Baixar Imagens Oficiais para Redes Sociais -->.*?</div>\s*</div>\s*(?=\n\s*<a onclick="window\.closeAllNavDropdowns\(\); window\.showAllSubSections\(\'previsao\'\);")',
    '',
    txt,
    count=1,
    flags=re.DOTALL,
)

# 2. Remove "Card Oficial Diário" from Acumulados Chuva dropdown so download stays ONLY in the card on the Acumulados page
txt, n2 = re.subn(
    r'\s*<a onclick="window\.closeAllNavDropdowns\(\); window\.switchAppTab\(\'chuva\'\); window\.openSocialModal && window\.openSocialModal\(\)" class="nav-dropdown-item">.*?</a>',
    '',
    txt,
    count=1,
    flags=re.DOTALL,
)

# 3. Remove "Baixar Card" button from Previsão dos Próximos Dias header
txt, n3 = re.subn(
    r'\s*<div class="flex items-center gap-2">\s*<button\s+type="button"\s+onclick="window\.openSocialModalWithTab \? window\.openSocialModalWithTab\(\'tempo\'\) : window\.openSocialModalTempoAgora\(\)".*?</button>\s*</div>',
    '',
    txt,
    count=1,
    flags=re.DOTALL,
)

p.write_text(txt, encoding="utf-8")
print(f"Removed blocks: n1={n1}, n2={n2}, n3={n3}")
