with open('js/app.js', 'r', encoding='utf-8') as f:
    code = f.read()

old_active = "btn.className = 'app-nav-tab active flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs w-full text-center';"
new_active = "btn.className = 'app-nav-tab active flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs lg:text-sm font-black transition cursor-pointer bg-[#ffebe4] border-2 border-[#f07a53] text-black shadow-xs w-full text-center';"

old_inactive = "btn.className = 'app-nav-tab flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs sm:text-sm font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer w-full text-center';"
new_inactive = "btn.className = 'app-nav-tab flex items-center justify-center gap-1.5 py-2 sm:py-2.5 px-1.5 sm:px-2 rounded-xl text-[11px] sm:text-xs lg:text-sm font-bold transition text-black hover:bg-white/80 border-2 border-transparent cursor-pointer w-full text-center';"

code = code.replace(old_active, new_active)
code = code.replace(old_inactive, new_inactive)

with open('js/app.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated js/app.js classes!")
