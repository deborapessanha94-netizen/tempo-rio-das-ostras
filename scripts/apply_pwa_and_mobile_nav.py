# -*- coding: utf-8 -*-
import os
import re

base_dir = r"C:\Users\debor\.gemini\antigravity\scratch\meteorologia-app"

# 1. Update index.html
index_path = os.path.join(base_dir, "index.html")
with open(index_path, "r", encoding="utf-8") as f:
    index_html = f.read()

# Replace viewport with viewport-fit=cover
index_html = re.sub(
    r'<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />\n    <meta name="mobile-web-app-capable" content="yes" />\n    <meta name="apple-mobile-web-app-capable" content="yes" />\n    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />\n    <meta name="apple-mobile-web-app-title" content="Tempo RO" />\n    <link rel="apple-touch-icon" href="./assets/icon-192-j4bdDA1G.png" />',
    index_html
)

with open(index_path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(index_html)
print("index.html updated with PWA meta tags!")

# 2. Update App.tsx
app_path = os.path.join(base_dir, "src", "App.tsx")
with open(app_path, "r", encoding="utf-8") as f:
    app_code = f.read()

# Add Smartphone to lucide-react imports if not present
if "Smartphone," not in app_code:
    app_code = app_code.replace("  SunMedium,", "  Smartphone,\n  SunMedium,")

# Add PwaInstallModal import
if "PwaInstallModal" not in app_code:
    app_code = app_code.replace(
        "import { SocialExportModal } from './components/SocialExportModal';",
        "import { SocialExportModal } from './components/SocialExportModal';\nimport { PwaInstallModal } from './components/PwaInstallModal';"
    )

# Add PWA State and Effect
pwa_state_block = """  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);

  useEffect(() => {
    try {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      if (isStandalone) setIsAppInstalled(true);
    } catch {}

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);"""

app_code = app_code.replace(
    "  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);",
    pwa_state_block
)

# Add Instalar App button in Header
header_actions_target = """            <button
              onClick={() => setIsDark((prev) => !prev)}"""

header_actions_repl = """            {!isAppInstalled && (
              <button
                onClick={() => setShowInstallModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#FF8244]/15 hover:bg-[#FF8244]/25 text-[#14213D] dark:text-[#FF8244] border border-[#FF8244]/40 transition-colors cursor-pointer whitespace-nowrap"
                title="Acessar como Aplicativo no Celular"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#FF8244]" />
                <span className="hidden xs:inline">Instalar App</span>
              </button>
            )}
            <button
              onClick={() => setIsDark((prev) => !prev)}"""

app_code = app_code.replace(header_actions_target, header_actions_repl)

# Update Mobile Active Tab Bar + Add Horizontal Subsections Pill Bar
mobile_bar_target = """        {/* Mobile Active Tab Bar */}
        <div className="w-full lg:hidden flex items-center justify-between gap-3 bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <activeTabItem.icon className="w-4 h-4 text-[#FF8244] shrink-0" />
            <div className="truncate">
              <div className="text-xs font-semibold text-[#14213D] dark:text-white truncate">
                {activeTabItem.label}
              </div>
              <div className="text-[11px] font-mono text-slate-500 dark:text-[#E5E5E5]/70 truncate">
                {TAB_SUBSECTIONS[activeTab].find((s) => s.id === subSection)?.label}
              </div>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] shrink-0 cursor-pointer"
          >
            {mobileMenuOpen ? 'Ocultar Abas' : 'Abas & Seções'}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>"""

mobile_bar_repl = """        {/* Mobile Active Tab Bar */}
        <div className="w-full lg:hidden flex items-center justify-between gap-2.5 bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-xl px-3.5 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <activeTabItem.icon className="w-4 h-4 text-[#FF8244] shrink-0" />
            <div className="truncate">
              <div className="text-xs font-semibold text-[#14213D] dark:text-white truncate">
                {activeTabItem.label}
              </div>
              <div className="text-[10.5px] font-mono text-slate-500 dark:text-[#E5E5E5]/70 truncate">
                {TAB_SUBSECTIONS[activeTab].find((s) => s.id === subSection)?.label}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!isAppInstalled && (
              <button
                onClick={() => setShowInstallModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#FF8244]/15 hover:bg-[#FF8244]/25 text-[#14213D] dark:text-[#FF8244] border border-[#FF8244]/40 transition-colors cursor-pointer"
                title="Acessar como Aplicativo no Celular"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#FF8244]" />
                <span className="hidden sm:inline">Instalar</span> App
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] shrink-0 cursor-pointer"
            >
              {mobileMenuOpen ? 'Ocultar' : 'Mais'}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Horizontal Subsections Pill Bar (Navegação horizontal rápida de sub-seções) */}
        <div className="w-full lg:hidden overflow-x-auto scrollbar-none py-1 -mt-3">
          <div className="flex items-center gap-1.5 min-w-max px-0.5">
            {TAB_SUBSECTIONS[activeTab]?.map((sub) => {
              const isSubActive = subSection === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    setSubForTab(activeTab, sub.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isSubActive
                      ? 'bg-[#14213D] dark:bg-[#FF8244] text-white dark:text-[#000000] font-semibold shadow-xs'
                      : 'bg-white dark:bg-[#14213D] text-slate-600 dark:text-[#E5E5E5]/75 border border-[#E5E5E5] dark:border-[#233354] hover:border-[#FF8244]/50'
                  }`}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        </div>"""

app_code = app_code.replace(mobile_bar_target, mobile_bar_repl)

# Update main element with bottom padding for mobile bar
app_code = app_code.replace(
    '<main className="flex-1 min-w-0 w-full space-y-8">',
    '<main className="flex-1 min-w-0 w-full space-y-8 pb-20 lg:pb-0">'
)

# Add Bottom Navigation Bar and PwaInstallModal at the end of App component
bottom_nav_and_modal = """      {/* Mobile Native Bottom Navigation Bar */}
      <nav
        aria-label="Navegação rápida no celular"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#14213D]/95 backdrop-blur-md border-t border-[#E5E5E5] dark:border-[#233354] px-2 py-1.5 shadow-lg flex items-center justify-around"
      >
        {[
          { id: 'previsao' as SectionTab, label: 'Previsão', icon: CloudSun },
          { id: 'chuva' as SectionTab, label: 'Chuva', icon: CloudRain },
          { id: 'rio' as SectionTab, label: 'Rio Jundiá', icon: Waves },
          { id: 'orla' as SectionTab, label: 'Orla', icon: Umbrella },
          { id: 'alertas' as SectionTab, label: 'Alertas', icon: ShieldAlert },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? 'text-[#FF8244] font-semibold'
                  : 'text-slate-500 dark:text-[#E5E5E5]/65 hover:text-[#14213D] dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[#FF8244]' : 'text-current'}`} />
              <span className="text-[10px] font-sans mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}

        {/* Botão Mais / Menu */}
        <button
          onClick={() => {
            setMobileMenuOpen((v) => !v);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors cursor-pointer ${
            mobileMenuOpen || ['boletim', 'panorama'].includes(activeTab)
              ? 'text-[#FF8244] font-semibold'
              : 'text-slate-500 dark:text-[#E5E5E5]/65 hover:text-[#14213D] dark:hover:text-white'
          }`}
        >
          <Menu className="w-5 h-5 text-current" />
          <span className="text-[10px] font-sans mt-0.5 tracking-tight">Mais</span>
        </button>
      </nav>

      <PwaInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        deferredPrompt={deferredPrompt}
        onInstallSuccess={() => setIsAppInstalled(true)}
      />
      <SocialExportModal openMeteo={openMeteo} acumulados={acumulados} boletimMeta={boletimMeta} />"""

app_code = app_code.replace(
    "      <SocialExportModal openMeteo={openMeteo} acumulados={acumulados} boletimMeta={boletimMeta} />",
    bottom_nav_and_modal
)

with open(app_path, "w", encoding="utf-8", newline="\r\n") as f:
    f.write(app_code)
print("App.tsx updated with PWA modal and mobile bottom bar!")
