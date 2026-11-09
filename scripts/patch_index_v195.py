import re

INDEX_PATH = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app\index.html"

with open(INDEX_PATH, "r", encoding="utf-8") as f:
    content = f.read()

target = '''                  <span class="sm:hidden">Baixar Imagem</span>
                </button>
              </div>



          </div>'''

replacement = '''                  <span class="sm:hidden">Baixar Imagem</span>
                </button>
              </div>



          </div>

          <!-- Botão de Alto Destaque: Baixar Imagem Oficial do Tempo Agora -->
          <div class="mb-3">
            <button 
              type="button" 
              id="btn-hero-export-social-main" 
              onclick="openSocialModalTempoAgora()" 
              class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-[#ffebe4] via-[#fff7ed] to-[#ffebe4] hover:brightness-95 text-[#c2410c] dark:text-[#ea580c] border-2 border-[#f07a53] shadow-xs transition cursor-pointer active:scale-98" 
              title="Clique para abrir e baixar a imagem oficial completa do Tempo Agora para postar"
            >
              <i data-lucide="camera" class="w-4 h-4 text-[#ea580c]"></i>
              <span class="tracking-wide">📸 BAIXAR IMAGEM DO TEMPO AGORA (PARA POSTAR)</span>
            </button>
          </div>'''

if target in content:
    content = content.replace(target, replacement, 1)
    print("Patch applied: Hero banner button")
else:
    print("Error: target not found")

# Bump version to 195
content = content.replace('src="js/app.js?v=194"', 'src="js/app.js?v=195"')
print("Version bumped to 195 in index.html")

with open(INDEX_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print("SUCCESS: index.html updated for v195!")
