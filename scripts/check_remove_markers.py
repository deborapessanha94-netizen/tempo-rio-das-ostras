import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
app_path = os.path.join(base_dir, "src", "App.tsx")

with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

start_marker = "        {/* Main Content */}\n        <main className=\"flex-1 min-w-0 w-full space-y-8\">\n        {activeTab === 'previsao' && showSub('tempo-agora') && bannerMes && ("
end_marker = "        {/* ================= ABA 1: PREVISÃO & TEMPO ================= */}"
if end_marker not in text:
    # Try finding with non-accented or encoded
    idx_end = text.find("ABA 1: PREVIS")
    line_start = text.rfind("\n", 0, idx_end)
    line_end = text.find("\n", idx_end)
    end_marker = text[line_start+1:line_end]

print("start_marker in text:", start_marker in text)
print("end_marker:", repr(end_marker))
