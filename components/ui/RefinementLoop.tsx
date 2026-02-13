
import React, { useState } from 'react';
import { RefreshCw, X, Paperclip, Globe, Search, ArrowUp, Link as LinkIcon } from 'lucide-react';
import { useAppContext } from '../../contexts/AppContext';

interface RefinementLoopProps {
  onRefine: (instructions: string, files: File[]) => void;
  loading: boolean;
  contextType?: string; 
}

const RefinementLoop: React.FC<RefinementLoopProps> = ({ onRefine, loading, contextType = "Ergebnis" }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  
  const { state, toggleSearch, addReferenceUrl, removeReferenceUrl } = useAppContext();
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    try {
        new URL(urlInput); 
        addReferenceUrl(urlInput.trim());
        setUrlInput('');
        setShowUrlInput(false);
    } catch(e) { alert("Ungültige URL"); }
  };

  const handleRefine = () => {
    if (!text.trim() && files.length === 0) return;
    onRefine(text, files);
    setFiles([]);
    setText('');
  };

  // INLINE DESIGN - CLEAN PROFESSIONAL (NO PURPLE/INDIGO)
  return (
    <div className="mt-10 animate-enter print:hidden">
      {!isExpanded ? (
        // COLLAPSED STATE: "Trigger Bar"
        <button 
          onClick={() => setIsExpanded(true)}
          className="w-full group flex items-center justify-between bg-white hover:bg-slate-50 border border-slate-200 hover:border-firm-navy/40 p-4 rounded-xl shadow-sm transition-all duration-300"
        >
           <div className="flex items-center gap-3">
               <div className="bg-firm-navy/5 text-firm-navy p-2 rounded-lg group-hover:bg-firm-navy group-hover:text-white transition-colors duration-300">
                  {/* Custom Thumbs Down SVG */}
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54" />
                  </svg>
               </div>
               <div className="text-left">
                   <span className="block font-bold text-firm-navy text-sm">Ergebnis verfeinern / Iterieren</span>
                   <span className="text-xs text-slate-500 group-hover:text-slate-600 transition-colors">
                       Klicken für Korrekturen oder neue Instruktionen (z.B. "Prüfe Klausel 5 strenger")
                   </span>
               </div>
           </div>
           <div className="text-slate-300 group-hover:text-firm-navy transition-colors transform group-hover:translate-x-1">
               <ArrowUp size={20} className="rotate-45" />
           </div>
        </button>
      ) : (
        // EXPANDED STATE: "Composer"
        <div className="bg-white rounded-xl border border-slate-200 shadow-firm overflow-hidden transition-all duration-300 relative ring-1 ring-firm-navy/5">
            
            {/* Header / Context Indicators - Clean Slate Theme */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-[85%]">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0">Kontext:</span>
                    
                    {files.map((file, idx) => (
                        <span key={`f-${idx}`} className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-md text-xs text-firm-navy shadow-sm whitespace-nowrap">
                            <Paperclip size={10} className="text-slate-400" /> {file.name} 
                            <button onClick={() => removeFile(idx)} className="hover:text-red-500 ml-1 text-slate-300"><X size={10}/></button>
                        </span>
                    ))}
                    
                    {state.referenceUrls.map((url, idx) => (
                        <span key={`u-${idx}`} className="flex items-center gap-1 bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-md text-xs whitespace-nowrap shadow-sm">
                            <Globe size={10} className="text-slate-400" /> {new URL(url).hostname}
                            <button onClick={() => removeReferenceUrl(url)} className="hover:text-red-500 ml-1 text-slate-300"><X size={10}/></button>
                        </span>
                    ))}
                    
                    {state.useSearch && (
                        <span className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-md text-xs whitespace-nowrap">
                            <Search size={10} /> Web Search
                        </span>
                    )}
                </div>

                <button onClick={() => setIsExpanded(false)} className="text-slate-400 hover:text-firm-navy p-1 rounded hover:bg-slate-100 transition-colors">
                    <X size={16} />
                </button>
            </div>

            {/* Input Area - High Contrast Text */}
            <div className="p-4">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={`Anweisung zur Überarbeitung von ${contextType}...`}
                    className="w-full min-h-[80px] bg-transparent border-none focus:ring-0 text-sm text-firm-navy placeholder:text-slate-400 resize-y p-0 leading-relaxed font-medium"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleRefine();
                        }
                    }}
                />
                
                {/* Toolbar */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                        <label className="p-2 text-slate-400 hover:text-firm-navy hover:bg-slate-100 rounded-lg cursor-pointer transition-colors" title="Datei anhängen">
                            <Paperclip size={18} />
                            <input type="file" className="hidden" accept=".pdf,.docx,.txt" multiple onChange={handleFileChange} />
                        </label>

                        <button 
                            onClick={() => toggleSearch(!state.useSearch)}
                            className={`p-2 rounded-lg transition-colors ${state.useSearch ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-firm-navy hover:bg-slate-100'}`}
                            title="Google Search Grounding"
                        >
                            <Search size={18} />
                        </button>

                        <div className="relative">
                            <button 
                                onClick={() => setShowUrlInput(!showUrlInput)}
                                className={`p-2 rounded-lg transition-colors ${showUrlInput ? 'text-firm-navy bg-slate-100' : 'text-slate-400 hover:text-firm-navy hover:bg-slate-100'}`}
                                title="URL hinzufügen"
                            >
                                <LinkIcon size={18} />
                            </button>
                            
                            {/* Inline Popover for URL - Professional Style */}
                            {showUrlInput && (
                                <div className="absolute bottom-full left-0 mb-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 p-2 flex gap-1 animate-enter z-20">
                                    <input 
                                        type="text" 
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        placeholder="https://..."
                                        className="flex-1 text-xs border border-slate-200 rounded px-2 focus:border-firm-navy focus:ring-1 focus:ring-firm-navy outline-none h-8 text-firm-navy bg-slate-50"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                                        autoFocus
                                    />
                                    <button onClick={handleAddUrl} disabled={!urlInput} className="bg-firm-navy text-white w-8 h-8 flex items-center justify-center rounded hover:bg-[#1e293b] transition-colors">
                                        <ArrowUp size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={handleRefine}
                        disabled={loading || (!text.trim() && files.length === 0)}
                        className={`
                            px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2
                            ${loading || (!text.trim() && files.length === 0) 
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                                : 'bg-firm-navy text-white hover:bg-[#1e293b] hover:shadow-md'
                            }
                        `}
                    >
                        {loading ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                <span>Verarbeite...</span>
                            </>
                        ) : (
                            <>
                                <span>Anwenden</span>
                                <ArrowUp size={16} strokeWidth={2} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
      )}
      
      {/* Disclaimer - Reduced visual noise */}
      {isExpanded && (
          <p className="text-center text-[10px] text-slate-300 mt-3 font-medium">
              Der neue Prompt wird Kontext und Historie berücksichtigen.
          </p>
      )}
    </div>
  );
};

export default RefinementLoop;
