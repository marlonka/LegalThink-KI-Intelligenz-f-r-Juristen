
import React from 'react';
import { View } from '../../types';
import { useAppContext } from '../../contexts/AppContext';

interface HeaderProps {
  currentView: View;
}

const Header: React.FC<HeaderProps> = ({ currentView }) => {
  const { state } = useAppContext();

  // LOGIC CHANGE: Shimmer ONLY when thinking/loading. 
  // Removed "currentView === View.DASHBOARD" so it doesn't shimmer constantly on home.
  const isShimmerActive = state.isThinking;

  return (
    <header className="sticky top-0 z-40 w-full bg-firm-paper/80 backdrop-blur-2xl border-b border-firm-slate/10 transition-all duration-500 shadow-[0_1px_3px_0_rgba(10,15,28,0.02)]">
      <div className="max-w-3xl mx-auto px-6 py-5 flex items-end justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-firm-navy tracking-tight font-serif flex items-center gap-1">
            <span>Legal</span><span className={isShimmerActive ? "shimmer" : "text-firm-accent"}>Think</span>
            <span className="text-firm-slate/60 text-base md:text-lg font-sans font-medium ml-3 hidden sm:inline tracking-normal border-l border-firm-slate/20 pl-3">KI-Intelligenz für Juristen</span>
          </h1>
        </div>

        {/* Date / Status */}
        <div className="hidden md:block text-right opacity-80">
          <p className="text-[10px] font-bold text-firm-accent uppercase tracking-[0.2em]">
            {new Date().toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
