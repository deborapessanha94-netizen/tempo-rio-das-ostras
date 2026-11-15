import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
legacy_path = os.path.join(base_dir, "index.legacy.html")

with open(legacy_path, "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

target = 'modal-social-chuva'
idx = text.find(target)
if idx != -1:
    div_start = text.rfind("<div", 0, idx)
    depth = 0
    pos = div_start
    while pos < len(text):
        if text[pos:pos+4] == "<div":
            depth += 1
            pos += 4
        elif text[pos:pos+6] == "</div>":
            depth -= 1
            pos += 6
            if depth == 0:
                break
        else:
            pos += 1
    div_end = pos
    print(f"Modal extracted from {div_start} to {div_end} ({div_end - div_start} chars)")
    modal_html = text[div_start:div_end]
    output_path = os.path.join(base_dir, "scripts", "extracted_modal.html")
    with open(output_path, "w", encoding="utf-8") as out:
        out.write(modal_html)
    print("Wrote extracted_modal.html successfully")
else:
    print("modal-social-chuva not found in index.legacy.html")
