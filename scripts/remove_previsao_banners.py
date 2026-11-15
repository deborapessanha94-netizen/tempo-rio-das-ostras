import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
app_path = os.path.join(base_dir, "src", "App.tsx")

with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

start_marker = '<main className="flex-1 min-w-0 w-full space-y-8">\n'
end_marker = "        {/* ================= ABA 1: PREVIS"

start_idx = text.find(start_marker)
end_idx = text.find(end_marker)

assert start_idx != -1, "start_marker not found"
assert end_idx != -1, "end_marker not found"

new_text = text[:start_idx + len(start_marker)] + text[end_idx:]

with open(app_path, "w", encoding="utf-8") as f:
    f.write(new_text)

print("Successfully removed the two banners from Previsão tab!")
