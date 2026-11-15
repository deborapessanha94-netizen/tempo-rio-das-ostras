import os

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
app_path = os.path.join(base_dir, "src", "App.tsx")

with open(app_path, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Check imports
print("SocialExportModal in App.tsx:", "SocialExportModal" in text)
print("SunMedium in App.tsx:", "SunMedium" in text)
print("Camera in App.tsx:", "Camera" in text)
