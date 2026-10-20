import os

path = r'C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Header and navigation
content = content.replace('bg-[#091c14]/92 backdrop-blur-md border-b border-[#e2e8f0]', 'bg-white/95 backdrop-blur-md border-b border-[#cbd5e1]')
content = content.replace('bg-[#143c2c] text-[#334155]', 'bg-[#f1f5f9] text-black')
content = content.replace('bg-[#0c271d] border border-[#e2e8f0] shadow-inner', 'bg-[#f8fafc] border border-[#cbd5e1]')
content = content.replace('bg-[#dfb992]/30', 'bg-[#cbd5e1]')

# 2. Radar controls footer
content = content.replace('bg-[#0a2319] border-t border-white/15', 'bg-[#f8fafc] border-t border-[#cbd5e1]')
content = content.replace('bg-zinc-900 text-white hover:bg-zinc-800', 'bg-white text-black hover:bg-zinc-100 border border-[#cbd5e1]')

# 3. Emergency Card
content = content.replace('card-earth p-5 sm:p-6 space-y-3.5', 'modern-card bg-white border border-[#cbd5e1] p-5 sm:p-6 space-y-3.5')
content = content.replace('border-b border-zinc-800 pb-3', 'border-b border-[#cbd5e1] pb-3')
content = content.replace('pt-2 border-t border-zinc-800', 'pt-2 border-t border-[#cbd5e1]')
content = content.replace('w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300', 'w-7 h-7 rounded-lg bg-[#ffebe4] border border-[#f97316] flex items-center justify-center text-black')
content = content.replace('h3 class="text-base font-bold text-white tracking-tight">Central de Emerg', 'h3 class="text-base font-bold text-black tracking-tight">Central de Emerg')
content = content.replace('bg-[#24130c]/85 hover:bg-[#341b11] border border-[#e2e8f0]', 'bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#cbd5e1]')

# 4. Modals (Boletim, Radar, Avisos, Meteogramas)
content = content.replace('bg-[#0c271d]', 'bg-white')
content = content.replace('bg-[#091c14]', 'bg-[#f8fafc]')
content = content.replace('border-white/15', 'border-[#cbd5e1]')
content = content.replace('w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center', 'w-7 h-7 rounded-lg bg-[#f1f5f9] border border-[#cbd5e1] flex items-center justify-center')
content = content.replace('text-white leading-tight', 'text-black leading-tight')
content = content.replace('hover:text-white cursor-pointer', 'hover:text-black cursor-pointer')

# 5. Badges & Chips with bg-[#133a2b]
content = content.replace('bg-[#133a2b]', 'bg-[#f1f5f9]')

# 6. Hero card styling adjustments
content = content.replace('selection:bg-[#f07a53] selection:text-white', 'selection:bg-[#ffebe4] selection:text-black')
content = content.replace('bg-[#f07a53] text-white shadow-xs', 'bg-[#ffebe4] text-black border border-[#f97316] shadow-xs')
content = content.replace('bg-white/15 text-white border border-white/20', 'bg-white text-black border border-[#cbd5e1]')
content = content.replace('text-white tracking-tight drop-shadow-md', 'text-black tracking-tight')
content = content.replace('text-white/80', 'text-black')
content = content.replace('icon-medallion w-20 h-20 sm:w-24 sm:h-24 bg-white/15 text-white border border-white/25', 'icon-medallion w-20 h-20 sm:w-24 sm:h-24 bg-[#f8fafc] text-black border border-[#cbd5e1]')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated index.html successfully")
