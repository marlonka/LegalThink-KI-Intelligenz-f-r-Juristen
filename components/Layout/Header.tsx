
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
    <header className="sticky top-0 z-40 w-full bg-[#f8fafc]/95 backdrop-blur-xl border-b border-slate-200 transition-all duration-300">
      <div className="max-w-3xl mx-auto px-6 py-4 flex items-end justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-firm-navy tracking-tight font-serif">
            Legal<span className={isShimmerActive ? "shimmer" : ""}>Think</span>
            <span className="text-firm-navy font-bold ml-2 hidden sm:inline"> – KI-Intelligenz für Juristen</span>
          </h1>
        </div>
        
        {/* Date / Status */}
        <div className="hidden md:block text-right opacity-60">
             <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
               {new Date().toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
             </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
