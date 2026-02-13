
import React, { useState } from 'react';
import { useTokenContext } from '../../contexts/TokenContext';
import { Cpu, DollarSign, Activity, Zap, Info, X } from 'lucide-react';

const TokenPill: React.FC = () => {
  const { totalUsage, totalCost, requestCount } = useTokenContext();
  const [isVisible, setIsVisible] = useState(true);

  // Format numbers nicely using German locale
  const formattedTokens = new Intl.NumberFormat('de-DE').format(totalUsage.total);
  // Currency stays in USD as requested (native API billing), but formatted with German decimal separators
  const formattedCost = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', minimumFractionDigits: 4 }).format(totalCost);

  if (totalUsage.total === 0 || !isVisible) return null;

  return (
    <div className="fixed top-6 right-6 z-50 animate-enter">
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-900/90 backdrop-blur-md rounded-full shadow-2xl border border-white/10 text-xs font-mono text-white hover:scale-105 transition-transform cursor-help group">
        
        {/* API Calls Counter - Hidden on Mobile */}
        <div className="hidden md:flex items-center gap-2">
           <Activity size={14} className="text-blue-400" />
           <div className="flex flex-col items-start leading-none">
             <span className="text-[10px] text-gray-400">ANFRAGEN</span>
             <span className="font-semibold">{requestCount}</span>
           </div>
        </div>

        <div className="hidden md:block w-px h-6 bg-white/20"></div>
        
        {/* Token Count - Hidden on Mobile - Shows lightning bolt if caching is active */}
        <div className="hidden md:flex items-center gap-2">
          {totalUsage.cached > 0 ? <Zap size={14} className="text-yellow-400 fill-yellow-400" /> : <Cpu size={14} className="text-neon-cyan" />}
          <div className="flex flex-col items-start leading-none">
             <div className="flex items-center gap-1">
                <span className="text-[10px] text-gray-400">TOKEN</span>
             </div>
            <span className="font-semibold">{formattedTokens}</span>
          </div>
        </div>

        <div className="hidden md:block w-px h-6 bg-white/20"></div>

        {/* Cost - Always Visible */}
        <div className="flex items-center gap-2">
          <DollarSign size={14} className="text-neon-lime" />
          <div className="flex flex-col items-start leading-none">
             <span className="text-[10px] text-gray-400">KOSTEN</span>
             <span className="font-semibold text-neon-lime">{formattedCost}</span>
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
          className="ml-1 p-1 hover:bg-white/20 rounded-full transition-colors text-gray-400 hover:text-white"
          title="Ausblenden"
        >
          <X size={12} />
        </button>

        {/* Expanded Tooltip Details - Translated */}
        <div className="absolute top-full right-0 mt-2 w-64 bg-gray-900 p-4 rounded-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
           <div className="flex justify-between mb-1">
             <span className="text-gray-500">Input (Neu)</span>
             <span>{new Intl.NumberFormat('de-DE').format(totalUsage.input)}</span>
           </div>
           {totalUsage.cached > 0 && (
             <div className="flex justify-between mb-1 text-yellow-400">
               <span className="flex items-center gap-1"><Zap size={10}/> Input (Cached)</span>
               <span>{new Intl.NumberFormat('de-DE').format(totalUsage.cached)}</span>
             </div>
           )}
           <div className="flex justify-between border-b border-gray-700 pb-2 mb-2">
             <span className="text-gray-500">Output</span>
             <span>{new Intl.NumberFormat('de-DE').format(totalUsage.output)}</span>
           </div>
           
           {/* Disclaimer Block */}
           <div className="mt-2 bg-white/5 p-2 rounded border border-white/10">
              <div className="flex items-start gap-2 text-[10px] text-slate-300 leading-tight">
                 <Info size={12} className="shrink-0 mt-0.5 text-blue-400" />
                 <p>
                    <strong>Haftungshinweis:</strong> Die Kostenanzeige ist eine konservative Schätzung auf Basis der Standard-Listenpreise. 
                    Etwaige Rabatte durch Context Caching (ca. 75% günstiger) werden zur Sicherheit <strong>nicht</strong> abgezogen.
                 </p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default TokenPill;
