import React, { useState } from 'react';
import { View } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { Library } from 'lucide-react';
import SettingsModal from './SettingsModal';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '../ui/BackButton';

interface HeaderProps {
  currentView: View;
  onNavigate?: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { state, toggleDemoMode } = useAppContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isShimmerActive = state.isThinking;

  // Display logic matching main wrapper width
  const isWideMode =
    (currentView === View.CONTRACT_REVIEW && state.contractReview.analysis !== null) ||
    (currentView === View.CONTRACT_COMPARISON && state.comparison.analysis !== null) ||
    (currentView === View.NDA_TRIAGE && state.ndaTriage.analysis !== null) ||
    (currentView === View.COMPLIANCE && state.compliance.result !== null);

  const containerClass = isWideMode
    ? "max-w-[95vw] xl:max-w-[1800px]"
    : "max-w-6xl";

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-firm-paper/80 backdrop-blur-2xl border-b border-firm-border/50 transition-all duration-500 shadow-firm-sm">
        <div className={`mx-auto px-6 py-4 flex items-center justify-between transition-[max-width] duration-500 ease-in-out ${containerClass}`}>
          <div className="flex items-center">
            <AnimatePresence>
              {currentView !== View.DASHBOARD && onNavigate && (
                <motion.div
                  initial={{ opacity: 0, width: 0, marginRight: 0 }}
                  animate={{ opacity: 1, width: 'auto', marginRight: 16 }}
                  exit={{ opacity: 0, width: 0, marginRight: 0 }}
                  className="flex items-center overflow-hidden"
                >
                  <BackButton onClick={() => onNavigate(View.DASHBOARD)} />
                </motion.div>
              )}
            </AnimatePresence>
            <h1 className="text-2xl md:text-3xl font-bold text-firm-navy tracking-tight font-serif flex items-center gap-1">
              <span>Legal</span><span className={isShimmerActive ? "shimmer" : "text-firm-accent"}>Think</span>
              <span className="text-firm-slate/60 text-base md:text-lg font-sans font-medium ml-3 hidden sm:inline tracking-normal border-l border-firm-border pl-3">KI-Intelligenz für Juristen</span>
            </h1>
          </div>

          {/* Controls & Date */}
          <div className="flex items-center bg-firm-paper/60 dark:bg-firm-navy/10 backdrop-blur-md border border-firm-border/60 rounded-full pr-1.5 pl-3 py-1.5 shadow-sm">

            <div className="hidden md:block text-right opacity-90 mr-4">
              <p className="text-[10px] font-bold text-firm-navy/70 dark:text-firm-navy/80 uppercase tracking-[0.15em] font-sans">
                {new Date().toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>

            <div className="hidden md:block w-px h-4 bg-firm-border/80 mr-3"></div>

            <button
              onClick={() => toggleDemoMode(!state.isDemoMode)}
              className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 mr-2 ${state.isDemoMode
                ? 'bg-firm-navy text-firm-paper shadow-sm'
                : 'bg-transparent text-firm-slate/60 hover:text-firm-navy hover:bg-firm-slate/5'
                }`}
            >
              <Library size={13} className={state.isDemoMode ? 'text-firm-accent' : ''} />
              Testakten {state.isDemoMode ? 'An' : 'Aus'}
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 text-firm-navy/80 hover:text-firm-accent hover:bg-firm-slate/5 bg-firm-card shadow-sm border border-firm-border/40 rounded-[14px] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-firm-accent/50 group"
              aria-label="Darstellung & Einstellungen"
              title="Darstellung & Einstellungen"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="group-hover:drop-shadow-[0_0_8px_rgba(197,168,128,0.5)] transition-all duration-300 transform group-hover:scale-110 group-active:scale-95"
              >
                <path d="M12 16.5C14.4853 16.5 16.5 14.4853 16.5 12C16.5 9.51472 14.4853 7.5 12 7.5C9.51472 7.5 7.5 9.51472 7.5 12C7.5 14.4853 9.51472 16.5 12 16.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 2.5V5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 19V21.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5.28998 5.28998L7.05998 7.05998" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16.94 16.94L18.71 18.71" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2.5 12H5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 12H21.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5.28998 18.71L7.05998 16.94" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16.94 7.05998L18.71 5.28998" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
                {/* Inner sophisticated star/sparkle detail */}
                <path d="M12 9.5L12.5 11.5L14.5 12L12.5 12.5L12 14.5L11.5 12.5L9.5 12L11.5 11.5L12 9.5Z" fill="currentColor" fillOpacity="0.4" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
};

export default Header;
