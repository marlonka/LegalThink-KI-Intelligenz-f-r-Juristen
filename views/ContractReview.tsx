
import React, { useState, useMemo, useEffect } from 'react';
import { Upload, FileText, ChevronDown, ChevronUp, Check, AlertTriangle, BookOpen, Copy, Briefcase, ShoppingCart, Mail, Scale, FileCheck, X, User, Home, Building, ShieldAlert, Swords, Eye, Columns, ExternalLink } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import ContextPanel from '../components/ui/ContextPanel'; 
import FileUploader from '../components/ui/FileUploader';
import GroundingSources from '../components/ui/GroundingSources'; 
import RefinementLoop from '../components/ui/RefinementLoop';
import { fileToBase64, generateAnalysis, FileData, extractTextFromDocx } from '../services/geminiService';
import { PROMPTS, MODEL_PRO, CONTRACT_TYPES } from '../constants';
import { ContractAnalysisResponse, ContractClause } from '../types';
import { ContractAnalysisSchema } from '../schemas';
import { useTokenContext } from '../contexts/TokenContext';
import { useAppContext } from '../contexts/AppContext';
import { copyRichText } from '../utils/clipboardUtils';
import ReactMarkdown from 'react-markdown';

const ContractReview: React.FC = () => {
  const { state, setContractFile, setContractPerspective, setContractAnalysis, setThinking } = useAppContext();
  const { trackUsage } = useTokenContext();
  
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showClientEmail, setShowClientEmail] = useState(false);
  const [clientEmailContent, setClientEmailContent] = useState<string | null>(null);
  const [extractedWordText, setExtractedWordText] = useState<string | null>(null);
  
  // States for UX Customization
  const [aggressiveness, setAggressiveness] = useState<'MODERATE' | 'AGGRESSIVE'>('MODERATE');
  // DEFAULT TO SINGLE VIEW AS REQUESTED
  const [viewMode, setViewMode] = useState<'SINGLE' | 'SPLIT'>('SINGLE');

  const [copiedBriefing, setCopiedBriefing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'DEALBREAKER'>('ALL');

  // NEW: Contract Type State & Reference File
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [referenceFile, setReferenceFile] = useState<File | null>(null);

  const file = state.contractReview.file;
  const perspective = state.contractReview.perspective;
  const data = state.contractReview.analysis;
  const metadata = state.contractReview.groundingMetadata; 
  const playbook = state.playbookFile;

  const categories = CONTRACT_TYPES || {};

  // Handle Word Extraction for Preview Window
  useEffect(() => {
    const extractText = async () => {
        if (file && (file.type.includes('wordprocessingml') || file.name.endsWith('.docx'))) {
            try {
                const b64 = await fileToBase64(file);
                const text = await extractTextFromDocx(b64);
                setExtractedWordText(text);
            } catch (e) {
                setExtractedWordText("[Inhalt konnte nicht extrahiert werden]");
            }
        } else {
            setExtractedWordText(null);
        }
    };
    extractText();
  }, [file]);

  // Create Object URL for PDF Preview
  const fileUrl = useMemo(() => {
      if (file && file.type === 'application/pdf') {
          return URL.createObjectURL(file);
      }
      return null;
  }, [file]);

  // Cleanup URL on unmount or file change
  useEffect(() => {
      return () => {
          if (fileUrl) URL.revokeObjectURL(fileUrl);
      };
  }, [fileUrl]);

  // DYNAMIC LABELS LOGIC
  const perspectiveLabels = useMemo(() => {
      let buyerLabel = "Auftraggeber (Kunde)";
      let sellerLabel = "Auftragnehmer (Anbieter)";
      let buyerIcon = ShoppingCart;
      let sellerIcon = Briefcase;

      if (selectedType) {
          if (selectedType.includes("LEASE") || selectedType.includes("RENT")) {
              buyerLabel = "Mieter"; // Corrected logic: In rental context, Buyer(Customer) is usually tenant
              sellerLabel = "Vermieter"; 
              buyerIcon = User;
              sellerIcon = Home;
          } else if (selectedType.includes("EMPLOYMENT") || selectedType.includes("FREELANCE")) {
              buyerLabel = "Arbeitnehmer";
              sellerLabel = "Arbeitgeber";
              buyerIcon = User;
              sellerIcon = Building;
          } else if (selectedType.includes("PURCHASE")) {
              buyerLabel = "Käufer";
              sellerLabel = "Verkäufer";
          } else if (selectedType.includes("LOAN")) {
              buyerLabel = "Darlehensnehmer";
              sellerLabel = "Darlehensgeber";
              buyerIcon = User;
              sellerIcon = Scale;
          }
      }
      
      return { 
          BUYER: { label: buyerLabel, Icon: buyerIcon },
          SELLER: { label: sellerLabel, Icon: sellerIcon }
      };
  }, [selectedType]);

  const getSelectedTypeLabel = () => {
    if (!selectedType || !selectedCategory) return "Allgemein";
    const cat = (categories as any)[selectedCategory];
    const t = cat?.find((x:any) => x.id === selectedType);
    return t ? t.label : "Allgemein";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setContractFile(e.target.files[0]);
      setContractAnalysis(null); 
      setClientEmailContent(null);
      setShowClientEmail(false);
    }
  };
  
  const handleReferenceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setReferenceFile(e.target.files[0]);
      }
  };

  const runAnalysis = async (customPrompt?: string, additionalFiles?: File[]) => {
    if (!file && !data) return; 
    
    setLoading(true);
    setThinking(true);
    try {
      let base64Data = "";
      if (file) {
         base64Data = await fileToBase64(file);
      }
      
      let contextData = undefined;
      if (referenceFile) {
          const refBase64 = await fileToBase64(referenceFile);
          contextData = { mimeType: referenceFile.type, data: refBase64, name: "REFERENZ-STANDARD (MUSTER)" };
      } else if (playbook) {
          const playbookBase64 = await fileToBase64(playbook);
          contextData = { mimeType: playbook.type, data: playbookBase64, name: "PLAYBOOK (GLOBAL)" };
      }

      const filePayloads: FileData[] = [];
      if (additionalFiles && additionalFiles.length > 0) {
        for (const f of additionalFiles) {
           const b64 = await fileToBase64(f);
           filePayloads.push({ mimeType: f.type, data: b64 });
        }
      }

      let finalPrompt = "";
      if (customPrompt && data) {
         finalPrompt = `
           DU BIST IM "REFINEMENT MODE" (Optimierungsschleife).
           VORHERIGE ANALYSE (JSON): ${JSON.stringify(data)}
           USER FEEDBACK: "${customPrompt}"
           ANWEISUNG: Behalte die JSON-Struktur strikt bei.
         `;
      } else {
         let perspectiveInstruction = "PERSPEKTIVE: NEUTRAL.";
         if (perspective === 'BUYER') perspectiveInstruction = `PERSPEKTIVE: ${perspectiveLabels.BUYER.label.toUpperCase()}.`;
         if (perspective === 'SELLER') perspectiveInstruction = `PERSPEKTIVE: ${perspectiveLabels.SELLER.label.toUpperCase()}.`;
         
         const aggressivenessInstruction = aggressiveness === 'AGGRESSIVE' 
            ? "HÄRTEGRAD: STRENG (MAXIMUM PROTECTION). Fordere die bestmögliche Position."
            : "HÄRTEGRAD: AUSGEWOGEN (MARKTSTANDARD). Akzeptiere übliche Klauseln.";

         let typeLabel = "Allgemeiner Vertrag";
         let typeFocus = "Allgemeine zivilrechtliche Prüfung (BGB AT/Schuldrecht)";
         
         if (selectedCategory && selectedType) {
             const cat = (categories as any)[selectedCategory];
             if (cat) {
                 const t = cat.find((x:any) => x.id === selectedType);
                 if (t) {
                     typeLabel = t.label;
                     typeFocus = t.focus;
                 }
             }
         }

         let referenceInstruction = "";
         if (referenceFile) {
             referenceInstruction = "ABGLEICH MIT REFERENZ: Vergleiche den zu prüfenden Vertrag streng gegen das hochgeladene Muster. Melde Abweichungen als RISIKO.";
         } else if (playbook) {
             referenceInstruction = "ABGLEICH MIT PLAYBOOK: Prüfe gegen die im Playbook definierten Standards.";
         }

         finalPrompt = PROMPTS.CONTRACT_REVIEW
            .replace('[[PERSPECTIVE_INSTRUCTION]]', perspectiveInstruction)
            .replace('[[CONTRACT_TYPE_LABEL]]', typeLabel)
            .replace('[[CONTRACT_TYPE_FOCUS]]', typeFocus)
            .replace('[[REFERENCE_STANDARD_INSTRUCTION]]', referenceInstruction)
            .replace('[[AGGRESSIVENESS_INSTRUCTION]]', aggressivenessInstruction);
      }

      const response = await generateAnalysis<ContractAnalysisResponse>({
        prompt: finalPrompt,
        fileData: file ? { mimeType: file.type, data: base64Data } : undefined,
        contextData: contextData, 
        additionalFiles: filePayloads,
        referenceUrls: state.referenceUrls,
        useSearch: state.useSearch,
        model: MODEL_PRO,
        responseSchema: ContractAnalysisSchema,
        thinkingLevel: "high",
        viewContext: 'CONTRACT' 
      });
      
      setContractAnalysis(response.data, response.groundingMetadata);
      trackUsage(response.usage);
      
    } catch (error) {
      console.error(error);
      alert("Analyse fehlgeschlagen.");
    } finally {
      setLoading(false);
      setThinking(false);
    }
  };

  const handleAnalyze = () => runAnalysis();
  const handleRefine = (instruction: string, files: File[]) => runAnalysis(instruction, files);

  const handleGenerateClientLetter = async () => {
      if (!data) return;
      setEmailLoading(true);
      setThinking(true);
      setShowClientEmail(true);

      try {
        // DYNAMIC AUDIENCE SELECTION
        let targetAudience = "die Geschäftsführung";
        if (perspective === 'BUYER') {
            targetAudience = `den Mandanten (Rolle: ${perspectiveLabels.BUYER.label})`;
        } else if (perspective === 'SELLER') {
            targetAudience = `den Mandanten (Rolle: ${perspectiveLabels.SELLER.label})`;
        }

        const prompt = PROMPTS.CLIENT_LETTER
            .replace('[[ANALYSIS_JSON]]', JSON.stringify(data))
            .replace('[[TARGET_AUDIENCE]]', targetAudience);

        const response = await generateAnalysis({
            prompt: prompt,
            model: MODEL_PRO,
            thinkingLevel: "medium",
            viewContext: 'CONTRACT'
        });
        setClientEmailContent(response.data as string);
        trackUsage(response.usage);
      } catch(e) {
          alert("Mandantenbrief konnte nicht generiert werden.");
      } finally {
          setEmailLoading(false);
          setThinking(false);
      }
  };

  const handleCopyBriefing = async () => {
    if (!data) return;
    const lines = [];
    lines.push(`# ANALYSE-BERICHT`);
    lines.push(`**Dokument:** ${file?.name}`);
    lines.push(`**Score:** ${data.overallRiskScore}/100`);
    lines.push(`\n## ZUSAMMENFASSUNG (MANAGEMENT SUMMARY)`);
    lines.push(data.executiveSummary);
    if (data.missingClauses && data.missingClauses.length > 0) {
        lines.push(`\n## FEHLENDE KLAUSELN`);
        data.missingClauses.forEach(clause => lines.push(`- [ ] ${clause}`));
    }
    lines.push(`\n## DETAIL-PRÜFUNG`);
    data.clauses.forEach((clause, index) => {
        lines.push(`\n### ${index + 1}. ${clause.title} [${clause.rating}]`);
        lines.push(`**Analyse:** ${clause.analysis}`);
        if (clause.recommendation) lines.push(`**Empfehlung:** ${clause.recommendation}`);
        if (clause.redline) lines.push(`> **Vorschlag:** ${clause.redline}`);
    });
    await copyRichText(lines.join('\n'));
    setCopiedBriefing(true);
    setTimeout(() => setCopiedBriefing(false), 2000);
  };

  const filteredClauses = data?.clauses.filter(clause => {
      if (filter === 'DEALBREAKER') return clause.rating === 'ROT';
      return true;
  });

  const selectValue = selectedCategory && selectedType ? `${selectedCategory}::${selectedType}` : "";

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center animate-enter">
        <Loader messages={[
            `Lese Dokument...`,
            `Identifiziere Risiken...`,
            `Prüfe BGH-Rechtsprechung...`, 
            "Entwerfe Optimierung...",
            "Bereite Risikomatrix vor..."
        ]} />
      </div>
    );
  }

  // === RESULT VIEW (SPLIT LAYOUT) ===
  if (data) {
    const activeLabel = perspective === 'BUYER' ? perspectiveLabels.BUYER.label : perspective === 'SELLER' ? perspectiveLabels.SELLER.label : 'Neutral';

    return (
      <div className="flex flex-col h-[calc(100vh-140px)] animate-enter">
        {/* Sticky Toolbar - Integrated UI */}
        <div className="sticky top-0 z-30 bg-[#f8fafc] border-b border-slate-200 pb-4 mb-4">
          <div className="flex justify-between items-center">
             <div>
                 <h2 className="text-xl font-bold text-firm-navy font-serif">Vertragsanalyse</h2>
                 <div className="flex items-center gap-2 mt-1">
                     <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${perspective === 'BUYER' ? 'bg-blue-100 text-blue-700' : perspective === 'SELLER' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                         {activeLabel}
                     </span>
                     <span className="text-xs text-slate-400">|</span>
                     <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${aggressiveness === 'AGGRESSIVE' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                         {aggressiveness === 'AGGRESSIVE' ? 'Streng' : 'Ausgewogen'}
                     </span>
                 </div>
             </div>
             
             <div className="flex gap-2">
                 {/* View Toggle */}
                 <div className="hidden lg:flex bg-white border border-slate-200 rounded-lg p-1 mr-2">
                     <button onClick={() => setViewMode('SPLIT')} className={`p-1.5 rounded ${viewMode === 'SPLIT' ? 'bg-slate-100 text-firm-navy' : 'text-slate-400'}`} title="Geteilte Ansicht"><Columns size={16}/></button>
                     <button onClick={() => setViewMode('SINGLE')} className={`p-1.5 rounded ${viewMode === 'SINGLE' ? 'bg-slate-100 text-firm-navy' : 'text-slate-400'}`} title="Leseansicht (Vollbild)"><FileText size={16}/></button>
                 </div>

                 <Button variant="secondary" onClick={handleCopyBriefing} className="!py-2 !px-3 text-xs">
                   {copiedBriefing ? <Check size={16}/> : <Copy size={16} />}
                   {copiedBriefing ? 'Kopiert' : 'Bericht kopieren'}
                 </Button>
                 <Button onClick={handleGenerateClientLetter} className="!py-2 !px-3 text-xs bg-firm-navy text-white">
                    <Mail size={16} />
                    Mandanten-Brief
                 </Button>
                 <button onClick={() => { setContractFile(null); setContractAnalysis(null); }} className="p-2 text-slate-400 hover:text-red-500">
                    <X size={20} />
                 </button>
             </div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className={`flex-1 overflow-hidden ${viewMode === 'SPLIT' ? 'lg:grid lg:grid-cols-2 lg:gap-8' : ''}`}>
            
            {/* LEFT PANE: DOCUMENT VIEWER */}
            <div className={`hidden lg:flex flex-col h-full bg-slate-100 border border-slate-200 rounded-xl shadow-inner overflow-hidden relative ${viewMode === 'SINGLE' ? '!hidden' : ''}`}>
                <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between z-10 shrink-0">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Originaldokument</span>
                    <div className="flex items-center gap-2">
                         <span className="text-xs text-slate-400 truncate max-w-[150px]">{file?.name}</span>
                         {fileUrl && (
                             <a href={fileUrl} target="_blank" rel="noreferrer" className="text-firm-accent hover:text-firm-navy" title="In neuem Tab öffnen">
                                 <ExternalLink size={14} />
                             </a>
                         )}
                    </div>
                </div>
                
                <div className="flex-1 w-full h-full relative bg-slate-200">
                    {/* PDF OR WORD PREVIEW */}
                    {fileUrl ? (
                        <embed
                            src={fileUrl}
                            type="application/pdf"
                            className="w-full h-full block"
                        />
                    ) : extractedWordText ? (
                        <div className="w-full h-full bg-white overflow-y-auto p-12 shadow-inner">
                            <div className="max-w-2xl mx-auto font-serif text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                                {extractedWordText}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center bg-slate-50">
                            <FileText size={64} className="mb-4 opacity-20" />
                            <p className="font-bold text-sm">Vorschau nicht verfügbar</p>
                            <p className="text-xs mt-2 max-w-xs">
                                Word-Dateien werden zur Analyse extrahiert, aber oft nicht nativ gerendert.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANE: ANALYSIS */}
            <div className="flex flex-col h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 pb-20">
                
                {/* 1. GAP ANALYSIS WARNING */}
                {data.missingClauses && data.missingClauses.length > 0 && (
                    <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg p-4 shadow-sm animate-enter">
                        <div className="flex items-center gap-2 mb-2 text-amber-800 font-bold text-sm uppercase tracking-wide">
                            <ShieldAlert size={18} />
                            <span>Lückenanalyse: Kritisch fehlende Klauseln</span>
                        </div>
                        <p className="text-xs text-amber-700 mb-2">Diese Standard-Klauseln fehlen im Vertrag und stellen ein Risiko dar:</p>
                        <ul className="list-disc list-inside text-sm text-amber-900 space-y-1 ml-1 font-medium">
                            {data.missingClauses.map((m, i) => (
                                <li key={i}>{m}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* 2. EXECUTIVE SUMMARY */}
                <Card className="mb-6 border-l-4 border-firm-navy">
                   <div className="flex justify-between items-start mb-3">
                       <h3 className="font-bold text-firm-navy font-serif text-lg">Zusammenfassung</h3>
                       <div className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-600">
                           Score: {data.overallRiskScore}/100
                       </div>
                   </div>
                   <p className="text-slate-700 text-sm leading-relaxed font-serif">
                     {data.executiveSummary}
                   </p>
                   {data.negotiationStrategy && (
                     <div className="mt-4 pt-3 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Strategie-Empfehlung</span>
                        <p className="text-sm text-firm-accent font-medium italic">{data.negotiationStrategy}</p>
                     </div>
                   )}
                </Card>

                {/* 3. CLAUSE FILTERS */}
                <div className="flex items-center justify-between py-4 sticky top-0 bg-[#f8fafc] z-20 backdrop-blur-sm">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Detail-Prüfung ({filteredClauses?.length})</h3>
                    <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                       <button onClick={() => setFilter('ALL')} className={`px-3 py-1 text-xs font-medium rounded ${filter === 'ALL' ? 'bg-firm-navy text-white' : 'text-slate-500'}`}>Alle</button>
                       <button onClick={() => setFilter('DEALBREAKER')} className={`px-3 py-1 text-xs font-medium rounded flex items-center gap-1 ${filter === 'DEALBREAKER' ? 'bg-red-50 text-red-600' : 'text-slate-500'}`}>
                         <AlertTriangle size={10} /> Kritisch
                       </button>
                    </div>
                </div>

                {/* 4. CLAUSES LIST */}
                <div className="space-y-4">
                  {filteredClauses?.map((clause, idx) => (
                      <ClauseItem key={idx} clause={clause} />
                  ))}
                </div>

                {/* MOVED SOURCES TO BOTTOM AS REQUESTED */}
                <GroundingSources metadata={metadata} />

                <RefinementLoop onRefine={handleRefine} loading={loading} contextType="Vertragsanalyse" />
            </div>
        </div>

        {/* REDESIGNED CLIENT LETTER MODAL (FULLY TRANSPARENT OVERLAY, NO BLUR) */}
        {showClientEmail && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent animate-enter pointer-events-none">
                <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-300 ring-4 ring-slate-900/5 pointer-events-auto">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                        <h3 className="font-bold font-serif flex items-center gap-2 text-firm-navy text-base">
                            <Mail size={18} className="text-firm-accent" /> Mandanten-Briefing (Entwurf)
                        </h3>
                        <button onClick={() => setShowClientEmail(false)} className="hover:bg-slate-100 p-1.5 rounded-full transition-colors text-slate-400">
                            <X size={20}/>
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-8 bg-white">
                        {!clientEmailContent ? (
                            <div className="flex flex-col items-center justify-center h-64">
                                {emailLoading ? (
                                    <Loader messages={["Konvertiere Analyse...", "Fokussiere auf Mandanten-Prioritäten...", "Erstelle Betreffzeile..."]} />
                                ) : (
                                    <div className="text-center max-w-sm">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                            <Mail size={32} />
                                        </div>
                                        <h4 className="font-bold text-firm-navy mb-2">Kommunikation vorbereiten</h4>
                                        <p className="text-slate-500 text-sm mb-6">Wir wandeln die juristische Detailprüfung in eine verständliche E-Mail für Ihren Mandanten um.</p>
                                        <Button onClick={handleGenerateClientLetter} className="w-full">Rundschreiben generieren</Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed font-serif">
                                <ReactMarkdown>{clientEmailContent}</ReactMarkdown>
                            </div>
                        )}
                    </div>

                    {clientEmailContent && (
                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => copyRichText(clientEmailContent)} className="text-xs">
                                <Copy size={14} /> In Outlook kopieren
                            </Button>
                            <Button onClick={() => setShowClientEmail(false)} className="text-xs">Schließen</Button>
                        </div>
                    )}
                </div>
            </div>
        )}

      </div>
    );
  }

  // === UPLOAD VIEW ===
  return (
    <div className="space-y-6 pb-32 animate-enter">
      <Card>
        <div className="flex items-center gap-3 mb-6">
           <div className="p-2 bg-firm-navy rounded-lg text-white">
             <FileText size={24} />
           </div>
           <div>
             <h3 className="text-xl font-bold text-gray-900 font-serif">Vertragsanalyse</h3>
             <p className="text-sm text-slate-500">
                Umfassende Prüfung auf Risiken, Lücken und materielle Benachteiligungen.
             </p>
           </div>
        </div>

        <div className="mb-8">
            <FileUploader 
                label="Dokument (PDF/Word) hier ablegen"
                files={file}
                onFileChange={handleFileChange}
                onRemove={() => setContractFile(null)}
            />
        </div>

        <div className="border-t border-slate-100 pt-6">
            <h4 className="text-xs font-bold text-firm-navy uppercase tracking-wider mb-4">
                Strategischer Kontext
            </h4>
            
            <div className="mb-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vertragstyp</label>
                <div className="relative">
                    <select 
                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-3 pr-8 focus:ring-1 focus:ring-firm-navy focus:border-firm-navy outline-none font-medium"
                        value={selectValue}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (!val) { setSelectedCategory(""); setSelectedType(""); return; }
                            const [cat, type] = val.split("::");
                            setSelectedCategory(cat); setSelectedType(type);
                        }}
                    >
                        <option value="">Standardprüfung (Allgemein)</option>
                        {Object.entries(categories).map(([category, types]) => (
                            <optgroup label={category} key={category}>
                                {types.map(t => (
                                    <option key={t.id} value={`${category}::${t.id}`}>{t.label}</option>
                                ))}
                            </optgroup>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" />
                </div>
            </div>
            
            <div className="mb-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rolle des Mandanten</label>
                <div className="flex bg-slate-100 p-1 rounded-lg w-full">
                    <button 
                        onClick={() => setContractPerspective('BUYER')} 
                        className={`flex-1 py-2 text-xs font-bold rounded flex items-center justify-center gap-1 ${perspective === 'BUYER' ? 'bg-white shadow-sm text-firm-navy' : 'text-slate-500'}`}
                    >
                        {perspectiveLabels.BUYER.Icon && <perspectiveLabels.BUYER.Icon size={14} />}
                        {perspectiveLabels.BUYER.label}
                    </button>
                    <button 
                        onClick={() => setContractPerspective('SELLER')} 
                        className={`flex-1 py-2 text-xs font-bold rounded flex items-center justify-center gap-1 ${perspective === 'SELLER' ? 'bg-white shadow-sm text-firm-navy' : 'text-slate-500'}`}
                    >
                        {perspectiveLabels.SELLER.Icon && <perspectiveLabels.SELLER.Icon size={14} />}
                        {perspectiveLabels.SELLER.label}
                    </button>
                </div>
            </div>

            <div className="mt-4">
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Analyse-Schärfe</label>
                 <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                     <button 
                        onClick={() => setAggressiveness('MODERATE')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${aggressiveness === 'MODERATE' ? 'bg-white shadow border border-slate-200 text-firm-navy' : 'text-slate-400 hover:text-firm-navy'}`}
                     >
                         <Briefcase size={14} /> Marktstandard
                     </button>
                     <button 
                        onClick={() => setAggressiveness('AGGRESSIVE')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${aggressiveness === 'AGGRESSIVE' ? 'bg-red-50 border border-red-200 text-red-700 shadow-sm' : 'text-slate-400 hover:text-red-600'}`}
                     >
                         <Swords size={14} /> Streng
                     </button>
                 </div>
             </div>
        </div>

        {/* OPTIONAL: REFERENCE */}
        <div className="pt-2 border-t border-slate-100 mt-6">
             <div className="flex items-center justify-between mb-3 px-1 mt-4">
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vergleich mit Muster (Optional)</span>
             </div>
             
             {referenceFile ? (
                 <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-sm text-indigo-900">
                     <div className="flex items-center gap-3 truncate">
                         <Scale size={18} className="text-indigo-500" />
                         <span className="truncate font-medium">{referenceFile.name}</span>
                     </div>
                     <button onClick={() => setReferenceFile(null)} className="text-indigo-400 hover:text-indigo-700 p-1">
                         <X size={18} />
                     </button>
                 </div>
             ) : (
                 <label className="flex items-center gap-4 p-4 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-white hover:border-firm-navy/30 transition-all group bg-slate-50/50">
                     <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-firm-navy group-hover:text-white transition-colors shadow-sm">
                         <Scale size={18} />
                     </div>
                     <div className="flex-1">
                         <span className="block text-sm font-bold text-firm-navy">Musterdokument hochladen</span>
                         <span className="block text-xs text-slate-500 mt-0.5">Zum direkten Abgleich gegen Ihren Kanzlei-Standard.</span>
                     </div>
                     <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleReferenceFileChange} />
                 </label>
             )}
        </div>
      </Card>

      <ContextPanel />

      <div className="mt-8">
        <Button fullWidth onClick={handleAnalyze} disabled={!file}>
            Analyse starten
        </Button>
      </div>
  </div>
  );
};

// IMPROVED CLAUSE ITEM
const ClauseItem: React.FC<{ clause: ContractClause }> = ({ clause }) => {
  const [expanded, setExpanded] = useState(clause.rating === 'ROT'); 
  
  const getStatusConfig = () => {
    switch(clause.rating) {
      case 'ROT': return { color: 'bg-red-500', border: 'border-red-200', bg: 'bg-red-50' };
      case 'GELB': return { color: 'bg-yellow-500', border: 'border-yellow-200', bg: 'bg-yellow-50' };
      default: return { color: 'bg-emerald-500', border: 'border-emerald-200', bg: 'bg-emerald-50' };
    }
  };
  
  const config = getStatusConfig();

  return (
    <div className={`bg-white rounded border overflow-hidden transition-all duration-300 ${config.border} hover:shadow-md`}>
      <div className={`p-4 flex items-start justify-between cursor-pointer ${expanded ? config.bg : 'bg-white'}`} onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-4">
          <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${config.color}`} />
          <div>
            <h4 className="font-bold text-firm-navy text-sm font-serif">{clause.title}</h4>
            {clause.relevantParagraph && (<p className="text-[10px] text-slate-500 font-mono mt-0.5">{clause.relevantParagraph}</p>)}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
      </div>
      
      {expanded && (
        <div className="px-5 pb-6 pt-2 bg-white">
          <div className="space-y-4">
            <div className="text-sm text-slate-700 leading-relaxed font-serif">{clause.analysis}</div>
            
            {clause.recommendation && (
                <div className="bg-slate-50 p-3 rounded text-sm text-firm-navy border border-slate-100 flex gap-2 items-start">
                    <Check size={16} className="text-firm-accent mt-0.5 shrink-0" />
                    <div>
                        <span className="font-bold text-xs uppercase tracking-wider block mb-1 text-slate-400">Empfehlung</span>
                        {clause.recommendation}
                    </div>
                </div>
            )}
            
            {/* MAGIC REDLINE VISUALIZATION */}
            {clause.redline && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Eye size={12} /> Formulierungsvorschlag
                    </h5>
                    <button className="text-[10px] text-firm-accent hover:underline" onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(clause.redline || '');
                    }}>Kopieren</button>
                </div>
                {/* Styled like Word Track Changes */}
                <div className="font-mono text-xs bg-[#f0fdf4] text-slate-800 p-3 border-l-4 border-green-500 rounded-r shadow-sm select-all relative">
                    <div className="absolute top-0 right-0 p-1">
                        <span className="text-[8px] uppercase font-bold text-green-700 bg-green-100 px-1 rounded">Neu</span>
                    </div>
                    {clause.redline}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractReview;
