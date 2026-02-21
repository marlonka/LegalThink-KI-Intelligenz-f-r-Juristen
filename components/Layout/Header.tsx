import React, { useState } from 'react';
import { View } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { Settings2 } from 'lucide-react';
import SettingsModal from './SettingsModal';
import { motion, AnimatePresence } from 'framer-motion';
import BackButton from '../ui/BackButton';

interface HeaderProps {
  currentView: View;
  onNavigate?: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { state } = useAppContext();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // LOGIC CHANGE: Shimmer ONLY when thinking/loading. 
  // Removed "currentView === View.DASHBOARD" so it doesn't shimmer constantly on home.
  const isShimmerActive = state.isThinking;

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-firm-paper/80 backdrop-blur-2xl border-b border-firm-border/50 transition-all duration-500 shadow-firm-sm">
        <div className="max-w-3xl mx-auto px-6 py-5 flex items-center justify-between">
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
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right opacity-80">
              <p className="text-[10px] font-bold text-firm-accent uppercase tracking-[0.2em]">
                {new Date().toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>
            
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-firm-slate hover:text-firm-navy hover:bg-firm-navy/5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-firm-accent/50"
              aria-label="Einstellungen"
            >
              <Settings2 size={20} />
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
