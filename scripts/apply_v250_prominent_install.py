# -*- coding: utf-8 -*-
import os
import re

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"

# 1. Update App.tsx
app_path = os.path.join(base_dir, "src", "App.tsx")
with open(app_path, "r", encoding="utf-8") as f:
    app_code = f.read()

# Make sure Download is imported from lucide-react
if "Download," not in app_code:
    app_code = app_code.replace("  Droplets,", "  Download,\n  Droplets,")

# Header button: Always show "Baixar App" with text on all screens
header_btn_target = """            {!isAppInstalled && (
              <button
                onClick={() => setShowInstallModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FF8244]/15 hover:bg-[#FF8244]/25 text-[#14213D] dark:text-[#FF8244] border border-[#FF8244]/40 transition-colors cursor-pointer whitespace-nowrap"
                title="Acessar como Aplicativo no Celular"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#FF8244]" />
                <span className="hidden sm:inline">Instalar App</span>
              </button>
            )}"""

header_btn_repl = """            {!isAppInstalled && (
              <button
                onClick={() => setShowInstallModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg bg-[#FF8244] hover:bg-[#e0682a] text-[#000000] shadow-sm transition-all cursor-pointer whitespace-nowrap"
                title="Baixar Aplicativo no Celular"
              >
                <Download className="w-3.5 h-3.5 text-[#000000]" />
                <span>Baixar App</span>
              </button>
            )}"""

app_code = app_code.replace(header_btn_target, header_btn_repl)

# Mobile active bar button: Change to "Baixar App"
mobile_bar_btn_target = """            {!isAppInstalled && (
              <button
                onClick={() => setShowInstallModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#FF8244]/15 hover:bg-[#FF8244]/25 text-[#14213D] dark:text-[#FF8244] border border-[#FF8244]/40 transition-colors cursor-pointer"
                title="Acessar como Aplicativo no Celular"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#FF8244]" />
                <span className="hidden sm:inline">Instalar</span> App
              </button>
            )}"""

mobile_bar_btn_repl = """            {!isAppInstalled && (
              <button
                onClick={() => setShowInstallModal(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg bg-[#FF8244] text-[#000000] shadow-xs cursor-pointer whitespace-nowrap"
                title="Baixar Aplicativo no Celular"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar App</span>
              </button>
            )}"""

app_code = app_code.replace(mobile_bar_btn_target, mobile_bar_btn_repl)

# Add Prominent Top Mobile Banner right after Workspace Shell starts
shell_target = """      {/* Workspace Shell: Left Vertical Tabs Rail + Main Content */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-6 lg:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Mobile Active Tab Bar */}"""

shell_repl = """      {/* Workspace Shell: Left Vertical Tabs Rail + Main Content */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-6 lg:py-8 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Banner de Baixar Aplicativo Mobile (Destacado no Topo) */}
        {!isAppInstalled && (
          <div className="w-full lg:hidden p-3.5 rounded-xl bg-gradient-to-r from-[#14213D] to-[#1E293B] border-2 border-[#FF8244] shadow-lg flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#FF8244] text-[#000000] flex items-center justify-center shrink-0 shadow-md">
                <Download className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Aplicativo para Celular</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#FF8244] text-[#000000] text-[9px] font-mono font-black uppercase">Grátis</span>
                </div>
                <div className="text-[11px] text-[#E5E5E5]/80 truncate">
                  Instale na sua tela de início sem barra do navegador
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowInstallModal(true)}
              className="px-3.5 py-2 rounded-lg bg-[#FF8244] hover:bg-[#e0682a] text-[#000000] text-xs font-extrabold cursor-pointer whitespace-nowrap shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar App</span>
            </button>
          </div>
        )}

        {/* Mobile Active Tab Bar */}"""

app_code = app_code.replace(shell_target, shell_repl)

# Add Card de Baixar App inside the mobile/aside navigation sheet
aside_nav_target = """            <div className="px-3 pt-1 pb-2 flex items-center justify-between border-b border-[#E5E5E5] dark:border-[#233354]/80">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/65">
                Abas do Portal
              </span>"""

aside_nav_repl = """            {/* Card de Baixar App no topo do menu lateral/mobile */}
            {!isAppInstalled && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#14213D] to-[#1E293B] border border-[#FF8244]/40 shadow-sm space-y-2 text-white mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-[#FF8244]" />
                    <span className="text-xs font-bold">Aplicativo no Celular</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-[#FF8244] text-[#000000] text-[9px] font-mono font-bold uppercase">Grátis</span>
                </div>
                <p className="text-[11px] text-[#E5E5E5]/80 leading-snug">
                  Tenha acesso direto em tela cheia na sua tela inicial (Android e iPhone).
                </p>
                <button
                  onClick={() => {
                    setShowInstallModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-[#FF8244] hover:bg-[#e0682a] text-[#000000] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Aplicativo Agora</span>
                </button>
              </div>
            )}

            <div className="px-3 pt-1 pb-2 flex items-center justify-between border-b border-[#E5E5E5] dark:border-[#233354]/80">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/65">
                Abas do Portal
              </span>"""

app_code = app_code.replace(aside_nav_target, aside_nav_repl)

# Update Bottom Nav Bar to include "Baixar App"
bottom_nav_target = """        {[
          { id: 'previsao' as SectionTab, label: 'Previsão', icon: CloudSun },
          { id: 'chuva' as SectionTab, label: 'Chuva', icon: CloudRain },
          { id: 'rio' as SectionTab, label: 'Rio Jundiá', icon: Waves },
          { id: 'orla' as SectionTab, label: 'Orla', icon: Umbrella },
          { id: 'alertas' as SectionTab, label: 'Alertas', icon: ShieldAlert },
        ].map((tab) => {"""

bottom_nav_repl = """        {[
          { id: 'previsao' as SectionTab, label: 'Previsão', icon: CloudSun },
          { id: 'chuva' as SectionTab, label: 'Chuva', icon: CloudRain },
          { id: 'rio' as SectionTab, label: 'Rio Jundiá', icon: Waves },
          { id: 'orla' as SectionTab, label: 'Orla', icon: Umbrella },
        ].map((tab) => {"""

app_code = app_code.replace(bottom_nav_target, bottom_nav_repl)

# Add "Baixar App" right before "Mais" in bottom nav
before_mais_target = """        {/* Botão Mais / Menu */}
        <button
          onClick={() => {
            setMobileMenuOpen((v) => !v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}"""

before_mais_repl = """        {/* Botão Baixar App no Bottom Nav */}
        <button
          onClick={() => setShowInstallModal(true)}
          className="flex flex-col items-center justify-center py-1 px-1.5 rounded-lg text-[#FF8244] font-bold cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-[#FF8244] text-[#000000] flex items-center justify-center shadow-xs">
            <Download className="w-3.5 h-3.5" />
          </div>
          <span className="text-[9.5px] font-sans mt-0.5 tracking-tight font-extrabold text-[#FF8244]">Baixar</span>
        </button>

        {/* Botão Mais / Menu */}
        <button
          onClick={() => {
            setMobileMenuOpen((v) => !v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}"""

app_code = app_code.replace(before_mais_target, before_mais_repl)

with open(app_path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(app_code)
print("App.tsx updated with 4 prominent Baixar App placements!")

# 2. Update index.html to add auto-reload on SW update
index_path = os.path.join(base_dir, "index.html")
with open(index_path, "r", encoding="utf-8") as f:
    index_code = f.read()

sw_script_target = """    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js').catch(() => {});
        });
      }
    </script>"""

sw_script_repl = """    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('./sw.js').then((reg) => {
            reg.onupdatefound = () => {
              const worker = reg.installing;
              if (worker) {
                worker.onstatechange = () => {
                  if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                    window.location.reload();
                  }
                };
              }
            };
          }).catch(() => {});
        });
      }
    </script>"""

index_code = index_code.replace(sw_script_target, sw_script_repl)
with open(index_path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(index_code)
print("index.html updated with automatic SW update detection!")
