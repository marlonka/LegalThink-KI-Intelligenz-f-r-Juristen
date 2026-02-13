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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mt-6 animate-enter">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded">
          <Globe size={18} />
        </div>
        <h3 className="font-bold text-firm-navy text-sm font-serif">Externe Recherche & Kontext</h3>
      </div>

      <div className="space-y-6">
        {/* Section 1: URL Context */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
            Referenz-URLs (Gesetze, AGBs, Richtlinien)
          </label>
          
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://www.gesetze-im-internet.de/bgb/..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-firm-navy focus:ring-1 focus:ring-firm-navy/10 placeholder-slate-400"
              />
            </div>
            <button
              onClick={handleAddUrl}
              disabled={!urlInput.trim()}
              className="px-3 py-2 bg-slate-100 text-firm-navy rounded-lg hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* URL List */}
          {state.referenceUrls.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {state.referenceUrls.map((url, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-800 px-3 py-1.5 rounded-full text-xs max-w-full">
                  <Globe size={12} className="shrink-0" />
                  <span className="truncate max-w-[200px]">{url}</span>
                  <button onClick={() => removeReferenceUrl(url)} className="text-indigo-400 hover:text-red-500 ml-1">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-xs text-slate-400 italic">Keine URLs hinzugefügt. (Nur öffentliche Seiten möglich)</p>
          )}
        </div>

        {/* Section 2: Search Grounding Toggle */}
        <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Search size={16} className={state.useSearch ? "text-amber-600" : "text-slate-400"} />
                    <div>
                        <span className={`block text-sm font-bold ${state.useSearch ? "text-amber-700" : "text-slate-500"}`}>
                            Google Search Grounding
                        </span>
                        <span className="text-[10px] text-slate-400 block max-w-xs">
                           Ermöglicht der KI, aktuelle Fakten (z.B. Urteile, News) live zu recherchieren.
                        </span>
                    </div>
                </div>
                
                <button
                   onClick={() => toggleSearch(!state.useSearch)}
                   className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${state.useSearch ? 'bg-amber-500' : 'bg-slate-200'}`}
                >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow transition-transform duration-200 ${state.useSearch ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
            </div>

            {state.useSearch && (
                <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-800 text-xs">
                   <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                   <p>
                     <strong>Privacy Hinweis:</strong> Bei aktiver Suche werden Suchanfragen (nicht das Dokument selbst) an Google gesendet. 
                     Nutzen Sie dies nur, wenn Sie externe Informationen (Reputation, Rechtslage) benötigen.
                   </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ContextPanel;