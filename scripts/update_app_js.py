import os

path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\js\app.js'
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("badgeClass = 'bg-rose-100 text-rose-800 border-rose-300';", "badgeClass = 'bg-rose-100 text-black border border-rose-400 font-bold';")
c = c.replace("badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';", "badgeClass = 'bg-amber-100 text-black border border-amber-400 font-bold';")
c = c.replace("badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';", "badgeClass = 'bg-yellow-100 text-black border border-yellow-400 font-bold';")
c = c.replace("badgeClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';", "badgeClass = 'bg-emerald-100 text-black border border-emerald-400 font-bold';")

c = c.replace("msgClass = 'text-rose-800 font-bold';", "msgClass = 'text-black font-bold';")
c = c.replace("msgClass = 'text-amber-800 font-semibold';", "msgClass = 'text-black font-semibold';")
c = c.replace("msgClass = 'text-yellow-900 font-medium';", "msgClass = 'text-black font-medium';")
c = c.replace("msgClass = 'text-emerald-800';", "msgClass = 'text-black font-medium';")

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print("App.js secondary cleaned successfully")
