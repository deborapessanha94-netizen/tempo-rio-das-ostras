import re

with open('index.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

orla = "".join(lines[853:1092])
tokens = re.findall(r'(<div[^>]*>|</div>)', orla)
stack = []
for idx, token in enumerate(tokens):
    if token.startswith('<div'):
        m_id = re.search(r'id="([^"]+)"', token)
        tag_id = m_id.group(1) if m_id else ''
        m_cls = re.search(r'class="([^"]+)"', token)
        tag_cls = m_cls.group(1)[:30] if m_cls else ''
        stack.append((idx, tag_id, tag_cls))
    else:
        if stack:
            stack.pop()

print("Unclosed in Orla:")
for item in stack:
    print(f"Token {item[0]}: id='{item[1]}' class='{item[2]}'")
