# -*- coding: utf-8 -*-
import os
import re

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
app_path = os.path.join(base_dir, "src", "App.tsx")

with open(app_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Remove Mobile Native Bottom Navigation Bar
bottom_nav_regex = r"\s*\{\/\* Mobile Native Bottom Navigation Bar \*\/\}[\s\S]*?<\/nav>"
match = re.search(bottom_nav_regex, code)
if match:
    code = code[:match.start()] + code[match.end():]
    print("Removed Mobile Native Bottom Navigation Bar!")
else:
    print("Warning: Bottom nav pattern not found by regex, checking exact string...")

# 2. Adjust Workspace Shell paddingBottom (remove the 6.5rem bottom bar allowance)
old_shell_style = """        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6.5rem)',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 0.75rem)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 0.75rem)',
        }}"""

new_shell_style = """        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2rem)',
          paddingLeft: 'max(env(safe-area-inset-left, 0px), 0.75rem)',
          paddingRight: 'max(env(safe-area-inset-right, 0px), 0.75rem)',
        }}"""

if old_shell_style in code:
    code = code.replace(old_shell_style, new_shell_style)
    print("Adjusted shell paddingBottom to normal 2rem + safe-area!")

with open(app_path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(code)

print("App.tsx updated successfully!")
