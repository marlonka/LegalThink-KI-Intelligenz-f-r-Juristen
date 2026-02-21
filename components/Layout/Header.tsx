
import React from 'react';
import { View } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { Library } from 'lucide-react';

interface HeaderProps {
  currentView: View;
}

const Header: React.FC<HeaderProps> = ({ currentView }) => {
  const { state, toggleDemoMode } = useAppContext();

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

        {/* Controls & Date */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => toggleDemoMode(!state.isDemoMode)}
            className={`hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all duration-300 border ${state.isDemoMode
                ? 'bg-firm-navy/5 text-firm-navy border-firm-navy/20 shadow-sm'
                : 'bg-transparent text-firm-slate/40 border-firm-slate/15 hover:bg-firm-slate/5 hover:text-firm-navy'
              }`}
          >
            <Library size={14} className={state.isDemoMode ? 'text-firm-accent' : ''} />
            Testakten {state.isDemoMode ? 'An' : 'Aus'}
          </button>

          <div className="hidden md:block text-right opacity-80">
            <p className="text-[10px] font-bold text-firm-accent uppercase tracking-[0.2em]">
              {new Date().toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
