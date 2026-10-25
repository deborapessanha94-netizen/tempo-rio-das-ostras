import re

with open('index.html.new', 'r', encoding='utf-8') as f:
    html = f.read()

# Simple stack-based tag balance check for div
tokens = re.findall(r'(<div[^>]*>|</div>)', html)
stack = []
for idx, token in enumerate(tokens):
    if token.startswith('<div'):
        # extract id or class
        m_id = re.search(r'id="([^"]+)"', token)
        tag_id = m_id.group(1) if m_id else ''
        m_cls = re.search(r'class="([^"]+)"', token)
        tag_cls = m_cls.group(1)[:30] if m_cls else ''
        stack.append((idx, tag_id, tag_cls))
    else:
        if stack:
            stack.pop()
        else:
            print(f"Extra closing div at token {idx}")

print(f"Unclosed divs remaining on stack: {len(stack)}")
for item in stack:
    print(f" - Token {item[0]}: id='{item[1]}' class='{item[2]}'")
