import subprocess
import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
main_path = os.path.join(base_dir, "src", "main.tsx")

with open(main_path, "r", encoding="utf-8") as f:
    orig = f.read()

# Add import
test_code = "import '../js/social-cards.js';\n" + orig

with open(main_path, "w", encoding="utf-8") as f:
    f.write(test_code)

res = subprocess.run(["cmd", "/c", "npx", "vite", "build"], cwd=base_dir, capture_output=True, text=True)
print("Build returncode:", res.returncode)
print("Build stdout:", res.stdout)
print("Build stderr:", res.stderr)

# restore
with open(main_path, "w", encoding="utf-8") as f:
    f.write(orig)
print("Restored original main.tsx")
