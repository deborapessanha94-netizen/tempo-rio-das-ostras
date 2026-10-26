with open('index.html', 'r', encoding='utf-8') as f:
    text = f.read()

target = '''      <div class="flex border-b border-[#e2e8f0] bg-zinc-50 px-5 pt-3 gap-2">



        <button id="tab-btn-inmet-meteo" class="px-4 py-2 text-xs sm:text-sm font-bold border-b-2 border-zinc-900 text-[#1e293b] cursor-pointer flex items-center gap-2">



          <span>INMET (COSMO)</span>



          <span class="text-[10px] px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#334155]">3304524</span>



        </button>



        <button id="tab-btn-cptec-meteo" class="px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 border-transparent text-[#64748b] hover:text-[#1e293b] cursor-pointer flex items-center gap-2">



          <span>CPTEC / INPE</span>



          <span class="text-[10px] px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#334155]">ID 3866</span>



        </button>



      </div>'''

replacement = '''      <div class="flex border-b border-[#e2e8f0] bg-zinc-50 px-3 sm:px-5 pt-2 sm:pt-3 gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">



        <button id="tab-btn-inmet-meteo" class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold border-b-2 border-zinc-900 text-[#1e293b] cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap">



          <span>INMET (COSMO)</span>



          <span class="text-[10px] px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#334155]">3304524</span>



        </button>



        <button id="tab-btn-cptec-meteo" class="px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold border-b-2 border-transparent text-[#64748b] hover:text-[#1e293b] cursor-pointer flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap">



          <span>CPTEC / INPE</span>



          <span class="text-[10px] px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#334155]">ID 3866</span>



        </button>



      </div>'''

if target in text:
    text = text.replace(target, replacement, 1)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(text)
    print("Replaced tab bar in index.html!")
else:
    print("Target not found in index.html!")
