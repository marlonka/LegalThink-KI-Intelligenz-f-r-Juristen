import React, { useState } from 'react';
import { View } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { Settings2, Library } from 'lucide-react';
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleDemoMode(!state.isDemoMode)}
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border ${state.isDemoMode
                ? 'bg-firm-navy/5 text-firm-navy border-firm-navy/20 shadow-sm'
                : 'bg-transparent text-firm-slate/50 border-firm-slate/20 hover:bg-firm-slate/5 hover:text-firm-navy'
                }`}
            >
              <Library size={14} className={state.isDemoMode ? 'text-firm-accent' : ''} />
              Testakten {state.isDemoMode ? 'An' : 'Aus'}
            </button>

            <div className="hidden md:block w-px h-4 bg-firm-border/60 mx-1"></div>

            <div className="hidden md:block text-right opacity-90">
              <p className="text-[10px] font-bold text-firm-accent uppercase tracking-[0.2em] font-sans">
                {new Date().toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>

            <div className="hidden md:block w-px h-4 bg-firm-border/60 mx-1"></div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 text-firm-slate hover:text-firm-navy hover:bg-firm-navy/5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-firm-accent/50"
              aria-label="Einstellungen"
            >
              <Settings2 size={18} />
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
