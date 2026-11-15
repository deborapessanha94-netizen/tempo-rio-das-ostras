import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"

for root, dirs, files in os.walk(base_dir):
    if ".git" in root or "node_modules" in root or "dist" in root:
        continue
    for f in files:
        if f.endswith((".ts", ".tsx", ".html", ".js")):
            p = os.path.join(root, f)
            with open(p, "r", encoding="utf-8", errors="ignore") as fp:
                txt = fp.read()
                if "openSocialModal" in txt:
                    print(f"Found in {p}")
                    for line_no, line in enumerate(txt.splitlines()):
                        if "openSocialModal" in line:
                            safe = line.encode("ascii", "replace").decode("ascii")
                            print(f"  L{line_no+1}: {safe.strip()[:100]}")
