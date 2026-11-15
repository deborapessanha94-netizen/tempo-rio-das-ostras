import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
app_path = os.path.join(base_dir, "src", "App.tsx")

with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

start_idx = text.find("<main className=\"flex-1 min-w-0 w-full space-y-8\">")
end_idx = text.find("        {/* ================= ABA 1: PREVIS")

print("Block to replace:\n")
print(text[start_idx:end_idx])
