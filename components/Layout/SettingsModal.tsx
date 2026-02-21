import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTheme, ThemeMode } from '../../contexts/ThemeContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ── Mini Theme Preview (SVG-based mockup) ────────────────────────── */
const ThemePreview: React.FC<{
  bg: string;
  cardBg: string;
  headerBg: string;
  accent: string;
  textColor: string;
  borderColor: string;
}> = ({ bg, cardBg, headerBg, accent, textColor, borderColor }) => (
  <svg viewBox="0 0 120 80" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* Background */}
    <rect width="120" height="80" rx="6" fill={bg} />
    {/* Header bar */}
    <rect x="0" y="0" width="120" height="14" rx="6" fill={headerBg} />
    <rect x="0" y="0" width="120" height="14" rx="6" ry="6" fill={headerBg} />
    {/* Re-draw bottom of header as flat */}
    <rect x="0" y="8" width="120" height="6" fill={headerBg} />
    {/* Header accent dot */}
    <circle cx="14" cy="7" r="2" fill={accent} />
    {/* Header text lines */}
    <rect x="20" y="5" width="30" height="2" rx="1" fill={textColor} opacity="0.7" />
    <rect x="20" y="9" width="18" height="1.5" rx="0.75" fill={textColor} opacity="0.3" />
    {/* Cards row */}
    <rect x="6" y="20" width="50" height="28" rx="4" fill={cardBg} stroke={borderColor} strokeWidth="0.5" />
    <rect x="64" y="20" width="50" height="28" rx="4" fill={cardBg} stroke={borderColor} strokeWidth="0.5" />
    {/* Card content placeholders */}
    <rect x="12" y="26" width="20" height="2" rx="1" fill={textColor} opacity="0.5" />
    <rect x="12" y="31" width="35" height="1.5" rx="0.75" fill={textColor} opacity="0.25" />
    <rect x="12" y="35" width="28" height="1.5" rx="0.75" fill={textColor} opacity="0.25" />
    <rect x="12" y="40" width="16" height="4" rx="2" fill={accent} opacity="0.3" />
    <rect x="70" y="26" width="22" height="2" rx="1" fill={textColor} opacity="0.5" />
    <rect x="70" y="31" width="38" height="1.5" rx="0.75" fill={textColor} opacity="0.25" />
    <rect x="70" y="35" width="30" height="1.5" rx="0.75" fill={textColor} opacity="0.25" />
    <rect x="70" y="40" width="16" height="4" rx="2" fill={accent} opacity="0.3" />
    {/* Bottom nav bar */}
    <rect x="20" y="56" width="80" height="12" rx="6" fill={headerBg} />
    <circle cx="40" cy="62" r="2.5" fill={accent} opacity="0.6" />
    <circle cx="52" cy="62" r="2.5" fill={textColor} opacity="0.2" />
    <circle cx="64" cy="62" r="2.5" fill={textColor} opacity="0.2" />
    <circle cx="76" cy="62" r="2.5" fill={textColor} opacity="0.2" />
  </svg>
);

interface ThemeOption {
  id: ThemeMode;
  label: string;
  subtitle: string;
  preview: {
    bg: string;
    cardBg: string;
    headerBg: string;
    accent: string;
    textColor: string;
    borderColor: string;
  };
}

const themes: ThemeOption[] = [
  {
    id: 'system',
    label: 'System',
    subtitle: 'Automatisch basierend auf OS',
    preview: {
      bg: '#FAFAFA',
      cardBg: '#FFFFFF',
      headerBg: '#FFFFFF',
      accent: '#C5A880',
      textColor: '#05050A',
      borderColor: '#E2E8F0',
    },
  },
  {
    id: 'light',
    label: 'Hell',
    subtitle: 'Klassisch & Klar',
    preview: {
      bg: '#FAFAFA',
      cardBg: '#FFFFFF',
      headerBg: '#FFFFFF',
      accent: '#C5A880',
      textColor: '#05050A',
      borderColor: '#E2E8F0',
    },
  },
  {
    id: 'dark',
    label: 'Dunkel',
    subtitle: 'Elegant & Weich',
    preview: {
      bg: '#0A0C10',
      cardBg: '#161A22',
      headerBg: '#161A22',
      accent: '#D4B891',
      textColor: '#FAFAFA',
      borderColor: '#1E293B',
    },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    subtitle: 'Tiefblau & Kühl',
    preview: {
      bg: '#0B1120',
      cardBg: '#0F172A',
      headerBg: '#0F172A',
      accent: '#93C5FD',
      textColor: '#F0F5FA',
      borderColor: '#1E293B',
    },
  },
  {
    id: 'obsidian',
    label: 'Obsidian',
    subtitle: 'Minimalistisch & Scharf',
    preview: {
      bg: '#000000',
      cardBg: '#0A0A0A',
      headerBg: '#0A0A0A',
      accent: '#E5E5E5',
      textColor: '#DCDCDC',
      borderColor: '#262626',
    },
  },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { theme, setMode } = useTheme();

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-firm-card border border-firm-border rounded-2xl shadow-firm-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-firm-border">
            <div>
              <h2 className="text-xl font-serif font-bold text-firm-navy">Darstellung</h2>
              <p className="text-xs text-firm-slate mt-0.5">Wählen Sie Ihr bevorzugtes Erscheinungsbild</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-firm-slate hover:text-firm-navy hover:bg-firm-navy/5 rounded-full transition-colors"
              aria-label="Schließen"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto">
            {/* Theme Grid with Visual Previews */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {themes.map((t) => {
                const isActive = theme.mode === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setMode(t.id)}
                    className={`
                      group flex flex-col items-center text-center rounded-xl p-3 transition-all duration-300 focus:outline-none
                      ${isActive
                        ? 'ring-2 ring-firm-accent bg-firm-accent/5 shadow-sm'
                        : 'hover:bg-firm-navy/5 border border-transparent hover:border-firm-border'}
                    `}
                  >
                    {/* Preview Container */}
                    <div className={`
                      relative w-full aspect-[3/2] rounded-lg overflow-hidden border transition-all duration-300 mb-3
                      ${isActive ? 'border-firm-accent shadow-firm-glow' : 'border-firm-border group-hover:border-firm-slate/30'}
                    `}>
                      {t.id === 'system' ? (
                        <>
                          <div className="flex w-full h-full">
                            <div className="w-1/2 h-full overflow-hidden relative">
                              <div className="absolute w-[200%] h-full left-0 top-0">
                                <ThemePreview {...themes.find(th => th.id === 'light')!.preview} />
                              </div>
                            </div>
                            <div className="w-1/2 h-full overflow-hidden relative">
                              <div className="absolute w-[200%] h-full right-0 top-0">
                                <ThemePreview {...themes.find(th => th.id === 'dark')!.preview} />
                              </div>
                            </div>
                          </div>
                          {/* Split line */}
                          <div className="absolute inset-y-0 left-1/2 w-[1px] bg-firm-border/50 pointer-events-none" />
                        </>
                      ) : (
                        <ThemePreview {...t.preview} />
                      )}
                    </div>
                    {/* Label */}
                    <span className={`text-sm font-semibold transition-colors ${isActive ? 'text-firm-accent' : 'text-firm-navy'}`}>
                      {t.label}
                    </span>
                    <span className="text-[10px] text-firm-slate mt-0.5 leading-tight">
                      {t.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer with fixed dark-mode safe button */}
          <div className="p-5 border-t border-firm-border bg-firm-paper/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#05050A] text-white dark:bg-firm-accent dark:text-[#05050A] rounded-xl font-semibold shadow-sm hover:opacity-90 transition-all"
            >
              Fertig
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SettingsModal;
