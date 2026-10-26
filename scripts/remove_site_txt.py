with open('js/social-cards.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """  // Portal à direita
  const siteTxt = 'tempo-riodasostras.com.br';
  ctx.font = '500 22px monospace';
  ctx.fillStyle = '#64748b';
  const siteW = ctx.measureText(siteTxt).width;
  ctx.fillText(siteTxt, rightPad - siteW, footerY + 8);"""

# Normalize CRLF
content_norm = content.replace('\r\n', '\n')
target_norm = target.replace('\r\n', '\n')

if target_norm in content_norm:
    content_norm = content_norm.replace(target_norm, "")
    with open('js/social-cards.js', 'w', encoding='utf-8') as f:
        f.write(content_norm)
    print("SUCCESS: Removed siteTxt from js/social-cards.js!")
else:
    print("ERROR: target not found in js/social-cards.js")
