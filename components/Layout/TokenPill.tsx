
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
      <div className="flex items-center gap-3 px-4 py-2 bg-firm-navy/95 backdrop-blur-xl rounded-full shadow-firm-lg border border-firm-accent/20 text-xs font-mono text-firm-paper hover:scale-[1.02] transition-transform duration-300 ease-out-expo cursor-help group">

        {/* API Calls Counter - Hidden on Mobile */}
        <div className="hidden md:flex items-center gap-2">
          <Activity size={14} className="text-firm-slate" />
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] text-firm-slate uppercase tracking-wider">Anfragen</span>
            <span className="font-semibold">{requestCount}</span>
          </div>
        </div>

        <div className="hidden md:block w-px h-6 bg-firm-slate/30"></div>

        {/* Token Count - Hidden on Mobile - Shows lightning bolt if caching is active */}
        <div className="hidden md:flex items-center gap-2">
          {totalUsage.cached > 0 ? <Zap size={14} className="text-firm-accent fill-firm-accent/20" /> : <Cpu size={14} className="text-firm-accent" />}
          <div className="flex flex-col items-start leading-none">
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-firm-slate uppercase tracking-wider">Token</span>
            </div>
            <span className="font-semibold text-firm-accent">{formattedTokens}</span>
          </div>
        </div>

        <div className="hidden md:block w-px h-6 bg-firm-slate/30"></div>

        {/* Cost - Always Visible */}
        <div className="flex items-center gap-2">
          <DollarSign size={14} className="text-firm-slate" />
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] text-firm-slate uppercase tracking-wider">Kosten</span>
            <span className="font-semibold">{formattedCost}</span>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
          }}
          className="ml-1 p-1 hover:bg-firm-slate/20 rounded-full transition-colors text-firm-slate hover:text-firm-paper"
          title="Ausblenden"
        >
          <X size={12} />
        </button>

        {/* Expanded Tooltip Details */}
        <div className="absolute top-full right-0 mt-3 w-64 bg-firm-paper text-firm-navy p-5 rounded-2xl border border-firm-slate/10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 pointer-events-none shadow-firm-lg z-50">
          <div className="flex justify-between mb-2 pb-2 border-b border-firm-slate/10">
            <span className="text-firm-slate">Input (Neu)</span>
            <span className="font-semibold">{new Intl.NumberFormat('de-DE').format(totalUsage.input)}</span>
          </div>
          {totalUsage.cached > 0 && (
            <div className="flex justify-between mb-2 pb-2 border-b border-firm-slate/10 text-firm-accent">
              <span className="flex items-center gap-1"><Zap size={10} /> Input (Cached)</span>
              <span className="font-semibold">{new Intl.NumberFormat('de-DE').format(totalUsage.cached)}</span>
            </div>
          )}
          <div className="flex justify-between mb-3">
            <span className="text-firm-slate">Output</span>
            <span className="font-semibold">{new Intl.NumberFormat('de-DE').format(totalUsage.output)}</span>
          </div>

          <div className="mt-4 bg-firm-paper border border-firm-slate/20 p-3 rounded-xl">
            <div className="flex items-start gap-2 text-[10px] text-firm-slate leading-relaxed">
              <Info size={14} className="shrink-0 mt-0.5 text-firm-accent" />
              <p>
                <strong>Hinweis (Gemini 3.1 Pro):</strong> Input- und Output-Token haben identische Basispreise. Rabatte durch Context Caching (50% auf regulären Input) werden in dieser Anzeige zur Sicherheit noch <strong>nicht</strong> abgezogen.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TokenPill;
