import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Share, PlusSquare, Check, X, ShieldCheck, Sparkles, Layers } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallSuccess?: () => void;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallSuccess,
}) => {
  const [platform, setPlatform] = useState<'android' | 'ios'>('android');
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Detect iOS
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIos) {
      setPlatform('ios');
    } else {
      setPlatform('android');
    }
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice?.outcome === 'accepted') {
        setInstalled(true);
        if (onInstallSuccess) onInstallSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Install error:', err);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#14213D] rounded-2xl border border-[#E5E5E5] dark:border-[#233354] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header do Modal */}
        <div className="px-6 py-5 border-b border-[#E5E5E5] dark:border-[#233354] flex items-center justify-between bg-[#F7F8FA] dark:bg-[#0B1324]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF8244] to-[#e0682a] flex items-center justify-center shadow-md shadow-[#FF8244]/20 text-white">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-base sm:text-lg font-bold text-[#14213D] dark:text-white">
                Acessar pelo Celular como Aplicativo
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70">
                Instale o TEMPO em Rio das Ostras na tela inicial
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-[#E5E5E5]/60 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-[#14213D] transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-5 overflow-y-auto scrollbar-thin">
          {/* Seletor de Plataforma (Android / iPhone) */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#F7F8FA] dark:bg-[#0B1324] rounded-xl border border-[#E5E5E5] dark:border-[#233354]">
            <button
              onClick={() => setPlatform('android')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                platform === 'android'
                  ? 'bg-white dark:bg-[#14213D] text-[#14213D] dark:text-[#FF8244] shadow-xs'
                  : 'text-slate-600 dark:text-[#E5E5E5]/70 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4 text-[#FF8244]" />
              Android / Chrome
            </button>
            <button
              onClick={() => setPlatform('ios')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                platform === 'ios'
                  ? 'bg-white dark:bg-[#14213D] text-[#14213D] dark:text-[#FF8244] shadow-xs'
                  : 'text-slate-600 dark:text-[#E5E5E5]/70 hover:text-slate-900'
              }`}
            >
              <Share className="w-4 h-4 text-[#FF8244]" />
              iPhone / iPad (iOS)
            </button>
          </div>

          {/* Conteúdo Android */}
          {platform === 'android' && (
            <div className="space-y-4">
              {deferredPrompt && !installed ? (
                <div className="p-4 rounded-xl bg-orange-500/10 border border-[#FF8244]/30 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#FF8244]">
                    <Sparkles className="w-4 h-4" />
                    Instalação Rápida Disponível!
                  </div>
                  <p className="text-xs text-slate-700 dark:text-[#E5E5E5]/90 leading-relaxed">
                    Seu navegador suporta instalação direta em 1 toque. Clique no botão abaixo para adicionar o app à sua tela inicial:
                  </p>
                  <button
                    onClick={handleInstallClick}
                    disabled={installing}
                    className="w-full py-3 px-4 rounded-xl bg-[#FF8244] hover:bg-[#e0682a] text-[#000000] font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    {installing ? 'Instalando...' : 'Instalar Aplicativo Agora'}
                  </button>
                </div>
              ) : installed ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                  <Check className="w-5 h-5 shrink-0" />
                  <span>Aplicativo instalado com sucesso na sua tela inicial!</span>
                </div>
              ) : null}

              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/70">
                  Passo a Passo Manual (Google Chrome no Android):
                </span>
                <ol className="space-y-2.5 text-xs text-slate-700 dark:text-[#E5E5E5]/90">
                  <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                    <span className="w-5 h-5 rounded-full bg-[#FF8244] text-[#000000] font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                    <span>Toque no <strong>menu de três pontinhos (⋮)</strong> no canto superior direito do Chrome.</span>
                  </li>
                  <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                    <span className="w-5 h-5 rounded-full bg-[#FF8244] text-[#000000] font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                    <span>Selecione a opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                    <span className="w-5 h-5 rounded-full bg-[#FF8244] text-[#000000] font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                    <span>Confirme em <strong>"Instalar"</strong>. O ícone aparecerá junto aos seus aplicativos!</span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Conteúdo iOS (iPhone/iPad) */}
          {platform === 'ios' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                No iPhone, a Apple exige que a instalação seja feita pelo <strong>Safari</strong> em 3 toques rápidos:
              </div>

              <ol className="space-y-2.5 text-xs text-slate-700 dark:text-[#E5E5E5]/90">
                <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                  <span className="w-5 h-5 rounded-full bg-[#FF8244] text-[#000000] font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                  <div className="flex-1">
                    Toque no botão <strong>Compartilhar</strong> do Safari{' '}
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono">
                      <Share className="w-3 h-3 inline mr-1 text-[#FF8244]" /> Compartilhar
                    </span>{' '}
                    (ícone de quadrado com seta para cima na barra inferior).
                  </div>
                </li>
                <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                  <span className="w-5 h-5 rounded-full bg-[#FF8244] text-[#000000] font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                  <div className="flex-1">
                    Role a lista de ações para baixo e toque em{' '}
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-mono">
                      <PlusSquare className="w-3 h-3 inline mr-1 text-[#FF8244]" /> Adicionar à Tela de Início
                    </span>.
                  </div>
                </li>
                <li className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354]">
                  <span className="w-5 h-5 rounded-full bg-[#FF8244] text-[#000000] font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                  <span>
                    Toque em <strong>"Adicionar"</strong> no canto superior direito. Pronto! O app fica na sua tela de início sem barra de navegação.
                  </span>
                </li>
              </ol>
            </div>
          )}

          {/* Vantagens do App */}
          <div className="pt-3 border-t border-[#E5E5E5] dark:border-[#233354] space-y-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-[#E5E5E5]/60">
              Vantagens de Acessar como App:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-[#E5E5E5]/80 font-mono">
              <div className="p-2 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#FF8244] shrink-0" />
                <span>Abre em tela cheia (sem barra do navegador)</span>
              </div>
              <div className="p-2 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#FF8244] shrink-0" />
                <span>Super leve (&lt; 2 MB) e ultrarrápido</span>
              </div>
              <div className="p-2 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#FF8244] shrink-0" />
                <span>Atualização automática a cada 5 min</span>
              </div>
              <div className="p-2 rounded-lg bg-[#F7F8FA] dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#FF8244] shrink-0" />
                <span>Funciona offline com último boletim salvo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-4 bg-[#F7F8FA] dark:bg-[#0B1324] border-t border-[#E5E5E5] dark:border-[#233354] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#E5E5E5] dark:border-[#233354] text-slate-700 dark:text-[#E5E5E5] hover:bg-slate-200/50 dark:hover:bg-[#14213D] transition-colors cursor-pointer"
          >
            Entendi, Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
