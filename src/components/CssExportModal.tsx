import React, { useState } from 'react';
import { Check, Copy, X } from 'lucide-react';

interface CssExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DESIGN_SYSTEM_CSS = `/* =========================================================================
   DESIGN SYSTEM OFICIAL • GOOGLE AI STUDIO / TEMPO RIO DAS OSTRAS
   ========================================================================= */

:root {
  --color-primary: #14213D;      /* Midnight Navy */
  --color-secondary: #0B1324;    /* Deep Blue */
  --color-accent: #FCA311;       /* Solar Gold */
  --color-border: #E5E5E5;       /* Soft Slate */
  --color-surface-light: #FFFFFF;
  --color-surface-dark: #14213D;
  --font-display: 'Google Sans Flex', 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Roboto Mono', monospace;
}

.dark {
  --color-bg-workspace: #0B1324;
  --color-surface-card: #14213D;
  --color-border-card: #233354;
  --color-text-main: #FFFFFF;
  --color-text-muted: #E5E5E5;
}

/* AI Studio Navigation Rail */
.sidebar-tab-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 0.875rem;
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.15s ease-in-out;
}

.sidebar-tab-btn.active {
  background-color: #14213D;
  color: #FFFFFF;
  font-weight: 600;
}

.dark .sidebar-tab-btn.active {
  background-color: #FCA311;
  color: #000000;
  font-weight: 700;
}

.sidebar-sub-btn.active {
  color: #FCA311;
  font-weight: 600;
}
`;

export const CssExportModal: React.FC<CssExportModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(DESIGN_SYSTEM_CSS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#14213D] border border-[#E5E5E5] dark:border-[#233354] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#E5E5E5] dark:border-[#233354]">
          <div>
            <h3 className="font-display text-lg font-semibold text-[#14213D] dark:text-white">
              Design System Tokens & CSS Oficial
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#E5E5E5]/70 mt-0.5">
              Paleta oficial: Midnight Navy (#14213D), Solar Gold (#FCA311), Deep Blue (#0B1324)
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#0B1324] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 bg-[#F7F8FA] dark:bg-[#05080F]">
          <pre className="text-xs font-mono p-4 rounded-xl bg-white dark:bg-[#0B1324] border border-[#E5E5E5] dark:border-[#233354] text-[#14213D] dark:text-[#E5E5E5] overflow-x-auto select-all leading-relaxed">
            {DESIGN_SYSTEM_CSS}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-[#E5E5E5] dark:border-[#233354] bg-white dark:bg-[#14213D]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-[#E5E5E5] dark:border-[#233354] text-slate-600 dark:text-[#E5E5E5] hover:bg-slate-50 dark:hover:bg-[#0B1324] transition-colors cursor-pointer"
          >
            Fechar
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#FCA311] hover:bg-[#e5920c] text-black transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copiado com Sucesso!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copiar CSS para a Área de Transferência
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
