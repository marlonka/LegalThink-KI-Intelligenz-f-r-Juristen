
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
        } catch (e) { alert("Ungültige URL"); }
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
                    className="w-full group flex items-center justify-between bg-white hover:bg-firm-paper border border-firm-slate/15 hover:border-firm-accent/40 p-5 rounded-3xl shadow-sm hover:shadow-firm transition-all duration-300"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-firm-paper border border-firm-slate/5 text-firm-navy p-3 rounded-xl group-hover:bg-firm-navy group-hover:border-firm-navy group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow group-hover:scale-105">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.498 15.25H4.372c-1.026 0-1.945-.694-2.054-1.715a12.137 12.137 0 0 1-.068-1.285c0-2.848.992-5.464 2.649-7.521C5.287 4.247 5.886 4 6.504 4h4.016a4.5 4.5 0 0 1 1.423.23l3.114 1.04a4.5 4.5 0 0 0 1.423.23h1.294M7.498 15.25c.618 0 .991.724.725 1.282A7.471 7.471 0 0 0 7.5 19.75 2.25 2.25 0 0 0 9.75 22a.75.75 0 0 0 .75-.75v-.633c0-.573.11-1.14.322-1.672.304-.76.93-1.33 1.653-1.715a9.04 9.04 0 0 0 2.86-2.4c.498-.634 1.226-1.08 2.032-1.08h.384m-10.253 1.5H9.7m8.075-9.75c.01.05.027.1.05.148.593 1.2.925 2.55.925 3.977 0 1.487-.36 2.89-.999 4.125m.023-8.25c-.076-.365.183-.75.575-.75h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398-.306.774-1.086 1.227-1.918 1.227h-1.053c-.472 0-.745-.556-.5-.96a8.95 8.95 0 0 0 .303-.54" />
                            </svg>
                        </div>
                        <div className="text-left">
                            <span className="block font-bold text-firm-navy text-[15px] mb-1">Ergebnis verfeinern / Iterieren</span>
                            <span className="text-[13px] font-medium text-firm-slate/50 group-hover:text-firm-slate/70 transition-colors">
                                Klicken für Korrekturen oder neue Instruktionen (z.B. "Prüfe Klausel 5 strenger")
                            </span>
                        </div>
                    </div>
                    <div className="text-firm-slate/30 group-hover:text-firm-accent transition-colors transform group-hover:translate-x-1 duration-300 mr-2">
                        <ArrowUp size={24} className="rotate-45" strokeWidth={2} />
                    </div>
                </button>
            ) : (
                // EXPANDED STATE: "Composer"
                <div className="bg-white rounded-3xl border border-firm-slate/15 shadow-firm-lg overflow-hidden transition-all duration-300 relative">

                    <div className="px-5 py-3 bg-firm-paper/50 border-b border-firm-slate/10 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar max-w-[85%]">
                            <span className="text-[10px] font-bold text-firm-slate/40 uppercase tracking-widest mr-2 shrink-0">Kontext:</span>

                            {files.map((file, idx) => (
                                <span key={`f-${idx}`} className="flex items-center gap-1.5 bg-white border border-firm-slate/10 px-2.5 py-1 rounded-lg text-[12px] font-medium text-firm-navy shadow-sm whitespace-nowrap">
                                    <Paperclip size={12} className="text-firm-slate/40" /> {file.name}
                                    <button onClick={() => removeFile(idx)} className="hover:text-red-500 ml-1.5 text-firm-slate/30 transition-colors"><X size={12} /></button>
                                </span>
                            ))}

                            {state.referenceUrls.map((url, idx) => (
                                <span key={`u-${idx}`} className="flex items-center gap-1.5 bg-white border border-firm-slate/10 text-firm-navy px-2.5 py-1 rounded-lg text-[12px] font-medium whitespace-nowrap shadow-sm">
                                    <Globe size={12} className="text-firm-slate/40" /> {new URL(url).hostname}
                                    <button onClick={() => removeReferenceUrl(url)} className="hover:text-red-500 ml-1.5 text-firm-slate/30 transition-colors"><X size={12} /></button>
                                </span>
                            ))}

                            {state.useSearch && (
                                <span className="flex items-center gap-1.5 bg-[#FFF8E7] text-firm-accent border border-firm-accent/20 px-2.5 py-1 rounded-lg text-[12px] font-medium whitespace-nowrap shadow-sm">
                                    <Search size={12} /> Web Search
                                </span>
                            )}
                        </div>

                        <button onClick={() => setIsExpanded(false)} className="text-firm-slate/40 hover:text-firm-navy p-1.5 rounded-lg hover:bg-white transition-colors">
                            <X size={18} />
                        </button>
                    </div>

                    {/* Input Area - High Contrast Text */}
                    <div className="p-5">
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={`Anweisung zur Überarbeitung von ${contextType}...`}
                            className="w-full min-h-[100px] bg-transparent border-none focus:ring-0 text-[15px] font-serif text-firm-navy placeholder:text-firm-slate/30 resize-y p-0 leading-relaxed outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleRefine();
                                }
                            }}
                        />

                        {/* Toolbar */}
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-firm-slate/10">
                            <div className="flex items-center gap-2">
                                <label className="p-2.5 text-firm-slate/40 hover:text-firm-navy hover:bg-firm-paper rounded-xl cursor-pointer transition-colors" title="Datei anhängen">
                                    <Paperclip size={20} />
                                    <input type="file" className="hidden" accept=".pdf,.docx,.txt" multiple onChange={handleFileChange} />
                                </label>

                                <button
                                    onClick={() => toggleSearch(!state.useSearch)}
                                    className={`p-2.5 rounded-xl transition-colors ${state.useSearch ? 'text-firm-accent bg-[#FFF8E7] border border-firm-accent/20' : 'text-firm-slate/40 hover:text-firm-navy hover:bg-firm-paper border border-transparent'}`}
                                    title="Google Search Grounding"
                                >
                                    <Search size={20} />
                                </button>

                                <div className="relative">
                                    <button
                                        onClick={() => setShowUrlInput(!showUrlInput)}
                                        className={`p-2.5 rounded-xl transition-colors ${showUrlInput ? 'text-firm-navy bg-firm-paper border border-firm-slate/10' : 'text-firm-slate/40 hover:text-firm-navy hover:bg-firm-paper border border-transparent'}`}
                                        title="URL hinzufügen"
                                    >
                                        <LinkIcon size={20} />
                                    </button>

                                    {/* Inline Popover for URL */}
                                    {showUrlInput && (
                                        <div className="absolute bottom-full left-0 mb-3 w-80 bg-white rounded-2xl shadow-firm-lg border border-firm-slate/15 p-2 flex gap-2 animate-enter z-20">
                                            <input
                                                type="text"
                                                value={urlInput}
                                                onChange={(e) => setUrlInput(e.target.value)}
                                                placeholder="https://..."
                                                className="flex-1 text-[13px] border border-firm-slate/15 rounded-xl px-3 focus:border-firm-accent focus:ring-2 focus:ring-firm-accent/20 outline-none h-10 text-firm-navy bg-firm-paper/50 transition-all font-medium"
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                                                autoFocus
                                            />
                                            <button onClick={handleAddUrl} disabled={!urlInput} className="bg-firm-navy text-white w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#1e293b] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                                <ArrowUp size={18} strokeWidth={2} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={handleRefine}
                                disabled={loading || (!text.trim() && files.length === 0)}
                                className={`
                            px-6 py-3 rounded-xl text-[14px] font-bold transition-all flex items-center gap-2.5 shadow-sm active:scale-95
                            ${loading || (!text.trim() && files.length === 0)
                                        ? 'bg-firm-paper/50 text-firm-slate/40 cursor-not-allowed border border-firm-slate/10'
                                        : 'bg-firm-navy text-white hover:bg-[#1e293b] shadow-firm hover:shadow-firm-lg border border-transparent'
                                    }
                        `}
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw size={18} className="animate-spin" />
                                        <span>Verarbeite...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Anwenden</span>
                                        <ArrowUp size={18} strokeWidth={2} />
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
