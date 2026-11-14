# -*- coding: utf-8 -*-
import subprocess

try:
    cmd = ['powershell', '-Command', "(Get-Process -Name chrome -ErrorAction SilentlyContinue | Select-Object -ExpandProperty MainWindowTitle)"]
    out = subprocess.check_output(cmd).decode('utf-8', errors='ignore')
    print("Chrome window titles:")
    for line in out.splitlines():
        if line.strip():
            print(" -", line.strip())
except Exception as e:
    print("Error:", e)

try:
    cmd2 = ['powershell', '-Command', "(Get-Process -Name msedge -ErrorAction SilentlyContinue | Select-Object -ExpandProperty MainWindowTitle)"]
    out2 = subprocess.check_output(cmd2).decode('utf-8', errors='ignore')
    print("Edge window titles:")
    for line in out2.splitlines():
        if line.strip():
            print(" -", line.strip())
except Exception as e:
    print("Error:", e)
