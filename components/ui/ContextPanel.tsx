import React, { useState } from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { Globe, Link as LinkIcon, Plus, X, Search, ShieldAlert } from 'lucide-react';

const ContextPanel: React.FC = () => {
  const { state, addReferenceUrl, removeReferenceUrl, toggleSearch } = useAppContext();
  const [urlInput, setUrlInput] = useState('');

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    try {
      new URL(urlInput); // Simple validation
      addReferenceUrl(urlInput.trim());
      setUrlInput('');
    } catch (e) {
      alert("Bitte geben Sie eine gültige URL ein (beginnend mit http:// oder https://).");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddUrl();
    }
  };

  return (
    <div className="bg-firm-card rounded-3xl border border-firm-slate/10 shadow-firm p-6 md:p-8 animate-enter flex-shrink-0">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-firm-paper text-firm-navy rounded-xl shadow-sm border border-firm-slate/5">
          <Globe size={20} strokeWidth={1.5} />
        </div>
        <h3 className="font-bold text-firm-navy text-lg font-serif tracking-tight">Externe Recherche & Kontext</h3>
      </div>

      <div className="space-y-6">
        {/* Section 1: URL Context */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-firm-slate/50 tracking-widest mb-3 pl-1">
            Referenz-URLs (Gesetze, AGBs, Richtlinien)
          </label>

          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-firm-slate/40" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://www.gesetze-im-internet.de/bgb/..."
                className="w-full pl-11 pr-4 py-3 text-[14px] bg-firm-paper/50 border border-firm-slate/15 rounded-xl focus:outline-none focus:border-firm-accent focus:ring-2 focus:ring-firm-accent/20 placeholder-firm-slate/40 text-firm-navy transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)]"
              />
            </div>
            <button
              onClick={handleAddUrl}
              disabled={!urlInput.trim()}
              className="px-4 py-3 bg-[#05050A] text-white dark:bg-firm-accent dark:text-[#05050A] rounded-xl hover:bg-[#1e293b] disabled:opacity-50 transition-colors shadow-sm disabled:shadow-none"
            >
              <Plus size={20} />
            </button>
          </div>

          {/* URL List */}
          {state.referenceUrls.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {state.referenceUrls.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-firm-paper border border-firm-slate/10 text-firm-navy px-3 py-2 rounded-xl text-[13px] font-medium max-w-full shadow-sm">
                  <Globe size={14} className="shrink-0 text-firm-slate/50" />
                  <span className="truncate max-w-[250px]">{url}</span>
                  <button onClick={() => removeReferenceUrl(url)} className="text-firm-slate/40 hover:text-red-500 ml-1 transition-colors">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-firm-slate/50 font-medium pl-1">Keine URLs hinzugefügt. (Nur öffentliche Seiten möglich)</p>
          )}
        </div>

        {/* Section 2: Search Grounding Toggle */}
        <div className="border-t border-firm-slate/10 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl transition-colors ${state.useSearch ? "bg-[#FFF8E7] text-firm-accent border border-firm-accent/20" : "bg-firm-paper text-firm-slate/40 border border-firm-slate/5"}`}>
                <Search size={20} strokeWidth={1.5} />
              </div>
              <div>
                <span className={`block text-[15px] font-bold tracking-tight ${state.useSearch ? "text-firm-navy" : "text-firm-slate/60"}`}>
                  Google Search Grounding
                </span>
                <span className="text-[12px] text-firm-slate/50 block max-w-sm mt-0.5 font-medium leading-relaxed">
                  Ermöglicht der KI, aktuelle Fakten (z.B. Urteile, News) live zu recherchieren.
                </span>
              </div>
            </div>

            <button
              onClick={() => toggleSearch(!state.useSearch)}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 shadow-inner ${state.useSearch ? 'bg-firm-accent' : 'bg-firm-slate/20'}`}
            >
              <span className={`absolute top-1 left-1 bg-firm-card w-4 h-4 rounded-full shadow-sm transition-transform duration-300 ${state.useSearch ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {state.useSearch && (
            <div className="mt-5 flex items-start gap-3 bg-[#FCF5F5] border border-red-500/10 p-4 rounded-xl text-red-800/90 text-[13px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] animate-enter">
              <ShieldAlert size={16} className="shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="font-bold">Privacy Hinweis:</strong> Bei aktiver Suche werden Suchanfragen (nicht das Dokument selbst) an Google gesendet.
                Nutzen Sie dies nur, wenn Sie externe Informationen (Reputation, Rechtslage) zwingend benötigen.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContextPanel;
