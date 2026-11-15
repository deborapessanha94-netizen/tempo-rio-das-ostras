import subprocess

res = subprocess.run(
    ["git", "log", "--grep=social", "--grep=card", "--grep=vento", "--grep=chuva", "--oneline", "-n", "30"],
    capture_output=True,
    text=True,
    cwd=r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"
)
print("Git log matching keywords:")
print(res.stdout)
