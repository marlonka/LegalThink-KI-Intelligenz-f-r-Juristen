
import React, { useState, useMemo, useEffect } from 'react';
import { motion, Variants, AnimatePresence } from 'framer-motion';
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

const containerVariants: Variants = {
    initial: { opacity: 0 },
    animate: {
        opacity: 1,
        transition: { staggerChildren: 0.08 }
    }
};

const itemVariants: Variants = {
    initial: { opacity: 0, y: 15, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } }
};

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
    const [viewMode, setViewMode] = useState<'SPLIT' | 'SINGLE'>('SPLIT');

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
        const t = cat?.find((x: any) => x.id === selectedType);
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
                        const t = cat.find((x: any) => x.id === selectedType);
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
        } catch (e) {
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
                <div className="sticky top-0 z-30 bg-firm-paper/90 backdrop-blur-xl border-b border-firm-slate/10 pb-4 mb-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl md:text-2xl font-bold text-firm-navy font-serif">Vertragsanalyse</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${perspective === 'BUYER' ? 'bg-blue-100/50 text-blue-700' : perspective === 'SELLER' ? 'bg-emerald-100/50 text-emerald-700' : 'bg-firm-slate/10 text-firm-slate'}`}>
                                    {activeLabel}
                                </span>
                                <span className="text-xs text-firm-slate/30">|</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${aggressiveness === 'AGGRESSIVE' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-firm-slate/10 text-firm-slate'}`}>
                                    {aggressiveness === 'AGGRESSIVE' ? 'Streng' : 'Ausgewogen'}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2 items-center">
                            {/* View Toggle */}
                            <div className="hidden lg:flex bg-white border border-firm-slate/15 rounded-xl p-1 mr-2 shadow-sm">
                                <button onClick={() => setViewMode('SPLIT')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'SPLIT' ? 'bg-firm-paper text-firm-navy shadow-sm' : 'text-firm-slate hover:text-firm-navy'}`} title="Geteilte Ansicht"><Columns size={16} /></button>
                                <button onClick={() => setViewMode('SINGLE')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'SINGLE' ? 'bg-firm-paper text-firm-navy shadow-sm' : 'text-firm-slate hover:text-firm-navy'}`} title="Leseansicht (Vollbild)"><FileText size={16} /></button>
                            </div>

                            <Button variant="secondary" onClick={handleCopyBriefing} className="!py-2.5 !px-4 text-xs !rounded-xl">
                                {copiedBriefing ? <Check size={16} className="text-firm-accent" /> : <Copy size={16} />}
                                {copiedBriefing ? 'Kopiert' : 'Bericht kopieren'}
                            </Button>
                            <Button onClick={handleGenerateClientLetter} className="!py-2.5 !px-4 text-xs bg-firm-navy text-white hover:bg-firm-navy/90 !rounded-xl shadow-firm">
                                <Mail size={16} className="text-firm-accent" />
                                Mandanten-Brief
                            </Button>
                            <button onClick={() => { setContractFile(null); setContractAnalysis(null); }} className="p-2 ml-2 text-firm-slate/50 hover:text-firm-navy bg-white border border-firm-slate/10 rounded-full hover:shadow-sm transition-all">
                                <X size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className={`flex-1 overflow-hidden ${viewMode === 'SPLIT' ? 'lg:grid lg:grid-cols-2 lg:gap-8' : ''}`}>

                    {/* LEFT PANE: DOCUMENT VIEWER */}
                    <div className={`hidden lg:flex flex-col h-full bg-firm-paper border border-firm-slate/15 rounded-2xl shadow-inner overflow-hidden relative ${viewMode === 'SINGLE' ? '!hidden' : ''}`}>
                        <div className="bg-white border-b border-firm-slate/15 px-5 py-3 flex items-center justify-between z-10 shrink-0">
                            <span className="text-xs font-bold text-firm-slate uppercase tracking-wider">Originaldokument</span>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-firm-slate/60 truncate max-w-[200px]">{file?.name}</span>
                                {fileUrl && (
                                    <a href={fileUrl} target="_blank" rel="noreferrer" className="text-firm-accent hover:text-firm-navy transition-colors bg-firm-paper p-1.5 rounded-md" title="In neuem Tab öffnen">
                                        <ExternalLink size={14} />
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 w-full h-full relative bg-firm-paper">
                            {/* PDF OR WORD PREVIEW */}
                            {fileUrl ? (
                                <embed
                                    src={fileUrl}
                                    type="application/pdf"
                                    className="w-full h-full block"
                                />
                            ) : extractedWordText ? (
                                <div className="w-full h-full bg-white overflow-y-auto p-12 shadow-inner">
                                    <div className="max-w-2xl mx-auto font-serif text-[15px] text-firm-navy leading-relaxed whitespace-pre-wrap">
                                        {extractedWordText}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-firm-slate/40 p-8 text-center bg-white/50">
                                    <FileText size={48} className="mb-4 opacity-30" strokeWidth={1} />
                                    <p className="font-bold text-sm text-firm-navy">Vorschau nicht verfügbar</p>
                                    <p className="text-xs mt-2 max-w-xs text-firm-slate">
                                        Word-Dateien werden zur Analyse extrahiert, aber nativ nicht in diesem Browser-Frame gerendert.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANE: ANALYSIS */}
                    <div className="flex flex-col h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-firm-slate/20 pb-48">

                        {/* 1. GAP ANALYSIS WARNING */}
                        {data.missingClauses && data.missingClauses.length > 0 && (
                            <div className="mb-8 shrink-0 bg-firm-paper border border-amber-200/50 rounded-2xl p-5 shadow-sm animate-enter relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                                <div className="flex items-center gap-2 mb-3 text-amber-700 font-bold text-sm uppercase tracking-wider">
                                    <ShieldAlert size={18} />
                                    <span>Lückenanalyse: Kritisch fehlende Klauseln</span>
                                </div>
                                <p className="text-sm text-amber-800/80 mb-3">Diese Standard-Klauseln fehlen im Vertrag und stellen ein Risiko dar:</p>
                                <ul className="list-disc list-inside text-sm text-amber-900 space-y-1.5 ml-1 font-medium">
                                    {data.missingClauses.map((m, i) => (
                                        <li key={i}>{m}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* 2. EXECUTIVE SUMMARY */}
                        <div className="mb-8 shrink-0 bg-white border border-firm-slate/10 rounded-3xl p-6 md:p-8 shadow-firm relative">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-firm-navy rounded-l-3xl"></div>
                            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
                                <div style={{ width: 96, height: 96, flexShrink: 0, position: 'relative' }}>
                                    <svg viewBox="0 0 36 36" style={{ width: 96, height: 96 }} className="-rotate-90 drop-shadow-sm text-firm-paper">
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" />
                                        <path className={data.overallRiskScore > 70 ? 'text-red-500' : 'text-firm-accent'} strokeDasharray={`${data.overallRiskScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                                        <span className={`text-2xl font-black tracking-tighter leading-none ${data.overallRiskScore > 70 ? 'text-red-600' : 'text-firm-navy'}`}>{data.overallRiskScore}</span>
                                        <span className="text-[9px] font-bold text-firm-slate/50 uppercase tracking-widest mt-0.5">Score</span>
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <h3 className="font-bold text-firm-navy font-serif text-2xl mb-1">Management Summary</h3>
                                    <p className="text-xs font-bold text-firm-slate/60 uppercase tracking-widest">Risikobewertung & Handlungsempfehlung</p>
                                </div>
                            </div>
                            <p className="text-firm-navy text-[15px] md:text-[16px] leading-relaxed font-medium">
                                {(data as any).executiveSummary || (data as any).summary || "Keine Zusammenfassung verfügbar. Bitte prüfen Sie die Details."}
                            </p>
                            {data.negotiationStrategy && (
                                <div className="mt-6 pt-6 border-t border-firm-slate/10 bg-firm-paper/50 -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-6 md:p-8 rounded-b-3xl">
                                    <span className="text-xs font-bold text-firm-slate/60 uppercase tracking-widest block mb-2">Strategische Empfehlung</span>
                                    <p className="text-firm-navy italic leading-relaxed font-medium">{data.negotiationStrategy}</p>
                                </div>
                            )}
                        </div>

                        {/* 3. CLAUSE FILTERS */}
                        <div className="flex items-center justify-between py-5 sticky top-0 bg-firm-paper/90 z-20 backdrop-blur-md border-b border-firm-slate/5 mb-4">
                            <h3 className="text-xs font-bold text-firm-slate uppercase tracking-widest">Detail-Prüfung ({filteredClauses?.length})</h3>
                            <div className="flex bg-white rounded-xl border border-firm-slate/15 p-1 shadow-sm">
                                <button onClick={() => setFilter('ALL')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${filter === 'ALL' ? 'bg-firm-navy text-white shadow' : 'text-firm-slate hover:bg-firm-paper'}`}>Alle</button>
                                <button onClick={() => setFilter('DEALBREAKER')} className={`px-4 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${filter === 'DEALBREAKER' ? 'bg-red-50 text-red-600 shadow-sm border border-red-100' : 'text-firm-slate hover:bg-firm-paper'}`}>
                                    <AlertTriangle size={12} className={filter === 'DEALBREAKER' ? 'text-red-500' : ''} /> Kritisch
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
                                    <X size={20} />
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
                                    <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed font-medium">
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
        <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-6 pb-32 max-w-4xl mx-auto">
            <motion.div variants={itemVariants}>
                <Card className="border-0 shadow-firm-lg rounded-[2rem] overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-firm-navy via-firm-accent to-firm-navy opacity-80" />

                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-firm-paper border border-firm-slate/10 rounded-2xl text-firm-navy shadow-sm">
                            <FileText size={28} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-firm-navy font-serif">Vertragsanalyse</h3>
                            <p className="text-[15px] text-firm- font-medium mt-1">
                                Umfassende Prüfung auf Risiken, Lücken und materielle Benachteiligungen.
                            </p>
                        </div>
                    </div>

                    <div className="mb-10 bg-firm-paper/30 p-2 rounded-2xl border border-firm-slate/5">
                        <FileUploader
                            label="Dokument (PDF/Word) hier ablegen"
                            files={file}
                            onFileChange={handleFileChange}
                            onRemove={() => setContractFile(null)}
                        />
                    </div>
                    <div className="border-t border-firm-slate/10 pt-8 mt-4">
                        <h4 className="text-xs font-bold text-firm-slate uppercase tracking-widest mb-5 flex items-center gap-2">
                            <ShieldAlert size={14} className="text-firm-accent" />
                            Strategischer Kontext
                        </h4>

                        <div className="mb-6 group">
                            <label className="block text-xs font-bold text-firm-navy mb-2 group-focus-within:text-firm-accent transition-colors">Vertragstyp</label>
                            <div className="relative">
                                <select
                                    className="w-full appearance-none bg-firm-paper border border-firm-slate/10 text-firm-navy text-[15px] rounded-2xl p-4 pr-10 focus:ring-4 focus:ring-firm-accent/10 focus:border-firm-accent outline-none font-medium transition-all shadow-sm hover:border-firm-slate/20 hover:bg-white"
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
                                        <optgroup label={category} key={category} className="font-serif italic text-firm-slate">
                                            {types.map(t => (
                                                <option key={t.id} value={`${category}::${t.id}`} className="font-sans not-italic text-firm-navy">{t.label}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                                <ChevronDown size={18} className="absolute right-4 top-4 text-firm-slate/50 pointer-events-none" />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-firm-navy mb-2">Rolle des Mandanten</label>
                            <div className="flex bg-firm-paper p-1.5 rounded-xl border border-firm-slate/10 w-full shadow-inner">
                                <button
                                    onClick={() => setContractPerspective('BUYER')}
                                    className={`flex-1 py-3 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${perspective === 'BUYER' ? 'bg-white shadow border border-firm-slate/5 text-firm-navy scale-[1.02]' : 'text-firm-slate hover:text-firm-navy hover:bg-white/50'}`}
                                >
                                    {perspectiveLabels.BUYER.Icon && <perspectiveLabels.BUYER.Icon size={16} className={perspective === 'BUYER' ? 'text-firm-accent' : ''} />}
                                    {perspectiveLabels.BUYER.label}
                                </button>
                                <button
                                    onClick={() => setContractPerspective('SELLER')}
                                    className={`flex-1 py-3 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all duration-300 ${perspective === 'SELLER' ? 'bg-white shadow border border-firm-slate/5 text-firm-navy scale-[1.02]' : 'text-firm-slate hover:text-firm-navy hover:bg-white/50'}`}
                                >
                                    {perspectiveLabels.SELLER.Icon && <perspectiveLabels.SELLER.Icon size={16} className={perspective === 'SELLER' ? 'text-firm-accent' : ''} />}
                                    {perspectiveLabels.SELLER.label}
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 mb-2">
                            <label className="block text-xs font-bold text-firm-navy mb-2">Analyse-Schärfe</label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setAggressiveness('MODERATE')}
                                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border transition-all duration-300 ${aggressiveness === 'MODERATE' ? 'bg-white border-firm-accent/30 shadow-firm-glow ring-1 ring-firm-accent/10 px-0' : 'bg-firm-paper border-firm-slate/10 text-firm-slate hover:border-firm-slate/30 hover:bg-white'}`}
                                >
                                    <Briefcase size={20} className={aggressiveness === 'MODERATE' ? 'text-firm-accent' : 'text-firm-slate/50'} />
                                    <span className={`text-[13px] font-bold ${aggressiveness === 'MODERATE' ? 'text-firm-navy' : ''}`}>Marktstandard</span>
                                </button>
                                <button
                                    onClick={() => setAggressiveness('AGGRESSIVE')}
                                    className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-4 rounded-xl border transition-all duration-300 ${aggressiveness === 'AGGRESSIVE' ? 'bg-red-50 border-red-200 shadow-sm ring-1 ring-red-100 px-0' : 'bg-firm-paper border-firm-slate/10 text-firm-slate hover:border-red-100 hover:text-red-600 hover:bg-red-50/30'}`}
                                >
                                    <Swords size={20} className={aggressiveness === 'AGGRESSIVE' ? 'text-red-500' : 'text-firm-slate/50'} />
                                    <span className={`text-[13px] font-bold ${aggressiveness === 'AGGRESSIVE' ? 'text-red-700' : ''}`}>Streng (Maximal)</span>
                                </button>
                            </div>
                        </div>       </div>
                    <div className="pt-6 border-t border-firm-slate/10 mt-8">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <span className="text-[10px] font-bold text-firm-slate/50 uppercase tracking-widest bg-firm-paper px-2 py-1 rounded inline-block">Vergleich mit Muster (Optional)</span>
                        </div>

                        {referenceFile ? (
                            <div className="flex items-center justify-between p-4 bg-firm-paper border border-firm-accent/30 rounded-xl text-sm shadow-sm group">
                                <div className="flex items-center gap-3 truncate text-firm-navy">
                                    <Scale size={18} className="text-firm-accent" />
                                    <span className="truncate font-bold">{referenceFile.name}</span>
                                </div>
                                <button onClick={() => setReferenceFile(null)} className="text-firm-slate/40 hover:text-red-500 p-1.5 rounded-full hover:bg-white transition-colors bg-white/50">
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <label className="flex items-center gap-5 p-5 border-2 border-dashed border-firm-slate/15 rounded-2xl cursor-pointer hover:bg-firm-paper hover:border-firm-accent/50 transition-all duration-300 group">
                                <div className="w-12 h-12 rounded-xl bg-firm-paper border border-firm-slate/10 flex items-center justify-center text-firm-slate/40 group-hover:bg-firm-navy group-hover:text-firm-accent group-hover:border-firm-navy transition-all duration-300 shadow-sm">
                                    <Scale size={20} />
                                </div>
                                <div className="flex-1">
                                    <span className="block text-sm font-bold text-firm-navy mb-0.5 group-hover:text-firm-accent transition-colors">Vergleichsdokument hochladen</span>
                                    <span className="block text-[13px] text-firm-slate/60">Laden Sie eine Vorlage hoch, um Abweichungen gezielt zu prüfen.</span>
                                </div>
                                <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleReferenceFileChange} />
                            </label>
                        )}
                    </div>
                </Card>
            </motion.div>

            {!data && (
                <motion.div variants={itemVariants}>
                    <ContextPanel />
                </motion.div>
            )}

            <motion.div variants={itemVariants} className="mt-8 relative z-10 w-full group">
                <div className="absolute inset-0 bg-firm-accent opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-2xl" />
                <Button fullWidth onClick={handleAnalyze} disabled={!file} className="!py-4 text-base tracking-wide shadow-firm-lg relative rounded-2xl active:scale-[0.98] transition-transform">
                    Analyse starten
                </Button>
            </motion.div>
        </motion.div >
    );
};

// IMPROVED CLAUSE ITEM
const ClauseItem: React.FC<{ clause: ContractClause }> = ({ clause }) => {
    const [expanded, setExpanded] = useState(clause.rating === 'ROT');

    const getStatusConfig = () => {
        switch (clause.rating) {
            case 'ROT': return {
                color: 'bg-red-500',
                border: 'border-red-500/30',
                hoverBorder: 'hover:border-red-500/50',
                bg: 'bg-[#FCF5F5]',
                text: 'text-red-700'
            };
            case 'GELB': return {
                color: 'bg-amber-400',
                border: 'border-amber-400/30',
                hoverBorder: 'hover:border-amber-400/60',
                bg: 'bg-[#FCFAF4]',
                text: 'text-amber-700'
            };
            default: return {
                color: 'bg-emerald-500',
                border: 'border-emerald-500/20',
                hoverBorder: 'hover:border-emerald-500/50',
                bg: 'bg-[#F4FCF7] text-emerald-700',
                text: 'text-emerald-700'
            };
        }
    };

    const config = getStatusConfig();

    return (
        <motion.div layout className={`bg-white rounded-[1.5rem] border overflow-hidden transition-colors duration-300 ${expanded ? config.border : 'border-firm-slate/15 hover:border-firm-slate/30'} ${expanded ? 'shadow-firm' : 'shadow-sm'}`}>
            <motion.div layout className={`p-5 flex items-start justify-between cursor-pointer transition-colors duration-300 ${expanded ? config.bg : 'bg-white hover:bg-firm-paper/50'}`} onClick={() => setExpanded(!expanded)}>
                <div className="flex items-start gap-4">
                    <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${config.color}`} />
                    <div className="-mt-0.5">
                        <h4 className="font-bold text-firm-navy text-base leading-tight">{clause.title}</h4>
                        {clause.relevantParagraph && (<p className="text-[11px] text-firm- font-medium font-bold mt-1 uppercase tracking-wider">{clause.relevantParagraph}</p>)}
                    </div>
                </div>
                <motion.div animate={{ rotate: expanded ? 180 : 0 }} className={`p-1 rounded-full bg-white/50 border border-white/50 ${expanded ? 'text-firm-navy' : 'text-firm-slate/40'}`}>
                    <ChevronDown size={16} />
                </motion.div>
            </motion.div>
            <AnimatePresence initial={false}>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1, transition: { height: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2, delay: 0.1 } } }}
                        exit={{ height: 0, opacity: 0, transition: { height: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.1 } } }}
                        className="overflow-hidden"
                    >
                        <div className="px-6 pb-7 pt-4 bg-white border-t border-firm-slate/5">
                            <div className="space-y-6">
                                <div className="text-[15px] text-firm-navy leading-relaxed font-medium">
                                    {clause.analysis}
                                </div>

                                {clause.recommendation && (
                                    <div className="bg-firm-paper/50 p-4 rounded-xl border border-firm-slate/10 flex gap-3 items-start relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-firm-accent/50 group-hover:bg-firm-accent transition-colors"></div>
                                        <Check size={18} className="text-firm-accent mt-0.5 shrink-0" />
                                        <div>
                                            <span className="font-bold text-[10px] uppercase tracking-widest block mb-1 text-firm-slate/60">Strategie & Empfehlung</span>
                                            <div className="text-[15px] font-medium text-firm-navy leading-relaxed">{clause.recommendation}</div>
                                        </div>
                                    </div>
                                )}

                                {/* MAGIC REDLINE VISUALIZATION */}
                                {clause.redline && (
                                    <div className="mt-5">
                                        <div className="flex items-center justify-between mb-2">
                                            <h5 className="text-[10px] font-bold text-firm-slate/60 uppercase tracking-widest flex items-center gap-1.5">
                                                <Eye size={12} className="text-firm-accent" /> Formulierungsvorschlag
                                            </h5>
                                            <button className="text-[10px] uppercase font-bold text-firm-accent hover:text-firm-navy transition-colors tracking-wider px-2 py-1 hover:bg-firm-paper rounded" onClick={(e) => {
                                                e.stopPropagation();
                                                navigator.clipboard.writeText(clause.redline || '');
                                            }}>Kopieren</button>
                                        </div>
                                        {/* Styled like Word Track Changes - High End Edition */}
                                        <div className="text-[13px] bg-white border border-green-200/60 text-firm-navy p-4 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] select-all relative group overflow-hidden">
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[9px] uppercase font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-200/50">Neu</span>
                                            </div>
                                            <div className="font-medium text-firm-navy leading-relaxed pl-2">
                                                {clause.redline}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default ContractReview;
