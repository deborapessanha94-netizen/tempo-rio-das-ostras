import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
with open(os.path.join(base_dir, "js", "social-cards.js"), "r", encoding="utf-8") as f:
    text = f.read()

lines = text.splitlines()
in_func = False
top_level_lines = []
for i, line in enumerate(lines):
    stripped = line.strip()
    if stripped.startswith("function ") or stripped.startswith("export function ") or stripped.startswith("async function ") or stripped.startswith("export async function "):
        in_func = True
    elif in_func and stripped == "}":
        in_func = False
    elif not in_func and stripped:
        top_level_lines.append((i+1, line))

print("Top level lines in social-cards.js:")
for line_no, line in top_level_lines:
    if "document." in line or "window." in line or "export " in line:
        safe = line.encode("ascii", "replace").decode("ascii")
        print(f"L{line_no}: {safe[:100]}")
