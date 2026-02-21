import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import ContextPanel from '../components/ui/ContextPanel';
import FileUploader from '../components/ui/FileUploader';
import DemoLoadButton from '../components/ui/DemoLoadButton'; // Added DemoLoadButton import
import GroundingSources from '../components/ui/GroundingSources';
import RefinementLoop from '../components/ui/RefinementLoop';
import { generateAnalysis, fileToBase64, FileData } from '../services/geminiService';
import { PROMPTS, MODEL_PRO } from '../constants';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { View } from '../types';
import { Upload, FileText, Info, BookOpen, Copy, Check, Shield, FileCheck, Search, ShieldAlert, Fingerprint, Lock, Server, Globe, CheckCircle2, LockKeyhole, ExternalLink, Columns, X } from 'lucide-react';
import { useTokenContext } from '../contexts/TokenContext';
import { useAppContext } from '../contexts/AppContext';
import { copyRichText } from '../utils/clipboardUtils';

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

const ComplianceCheck: React.FC = () => {
  const { state, setComplianceFile: setGlobalComplianceFile, setComplianceResult: setGlobalComplianceResult, setThinking } = useAppContext();
  const { trackUsage } = useTokenContext();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Local state for UI, initialized from global context
  const [file, setComplianceFile] = useState<File | null>(state.compliance.file);
  const [result, setComplianceResult] = useState<string | null>(state.compliance.result);
  const [metadata, setMetadata] = useState<any | null>(state.compliance.groundingMetadata);

  // Split-View System
  const [viewMode, setViewMode] = useState<'SPLIT' | 'SINGLE'>('SPLIT');
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // Generates Object URL for Document Preview
  useEffect(() => {
    if (file && file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFileUrl(null);
    }
  }, [file]);

  // Update local state when global state changes (e.g., from other components)
  useEffect(() => {
    setComplianceFile(state.compliance.file);
  }, [state.compliance.file]);

  useEffect(() => {
    setComplianceResult(state.compliance.result);
    setMetadata(state.compliance.groundingMetadata);
  }, [state.compliance.result, state.compliance.groundingMetadata]);


  const playbook = state.playbookFile;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFile = e.target.files[0];
      setComplianceFile(newFile); // Update local state
      setGlobalComplianceFile(newFile); // Update global state
    }
  };

  const runCheck = async (customPrompt?: string, additionalFiles?: File[]) => {
    if (!file && !result) return; // Ensure there's a file or a result to refine
    setLoading(true);
    setThinking(true);
    try {
      let base64Data = "";
      if (file) {
        base64Data = await fileToBase64(file);
      }
      let contextData = undefined;
      if (playbook) {
        const playbookBase64 = await fileToBase64(playbook);
        contextData = { mimeType: playbook.type, data: playbookBase64 };
      }
      const filePayloads: FileData[] = [];
      if (additionalFiles && additionalFiles.length > 0) {
        for (const f of additionalFiles) {
          const b64 = await fileToBase64(f);
          filePayloads.push({ mimeType: f.type, data: b64 });
        }
      }
      let prompt = PROMPTS.COMPLIANCE_CHECK;
      if (customPrompt && result) {
        prompt = `
           DU BIST IM "REFINEMENT MODE".
           VORHERIGER BERICHT (MARKDOWN): ${result}
           USER ANWEISUNG: "${customPrompt}"
           AUFGABE: Schreibe den Bericht um (oder ergänze ihn). Behalte die Markdown-Format bei.
         `;
      }
      const response = await generateAnalysis({
        prompt: prompt,
        contextData: contextData,
        fileData: file ? { mimeType: file.type, data: base64Data } : undefined,
        additionalFiles: filePayloads,
        referenceUrls: state.referenceUrls,
        useSearch: state.useSearch,
        model: MODEL_PRO,
        thinkingLevel: "high",
        viewContext: 'COMPLIANCE'
      });
      setComplianceResult(response.data); // Update local state
      setMetadata(response.groundingMetadata); // Update local state
      setGlobalComplianceResult(response.data, response.groundingMetadata); // Update global state
      trackUsage(response.usage);
    } catch (error) {
      setComplianceResult("Fehler beim Abgleich."); // Updated to remove undefined, as setComplianceResult expects string | null
      setMetadata(null); // Updated to null for consistency with any | null
      setGlobalComplianceResult("Fehler beim Abgleich.", null); // Updated to null for consistency with any | null
    } finally {
      setLoading(false);
      setThinking(false);
    }
  };

  const handleCheck = () => runCheck();
  const handleRefine = (instruction: string, files: File[]) => runCheck(instruction, files);

  const handleCopy = async () => {
    if (!result) return;
    await copyRichText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col justify-center items-center gap-2">
      <Loader messages={[
        "Analysiere AVV/DPA...",
        "Prüfe Art. 28 DSGVO Pflichtinhalte...",
        state.useSearch ? "Grounding: Prüfe EU-US Data Privacy Framework..." : "Validiere TOMs...",
        "Erstelle Konformitätsbericht (Entwurf)..."
      ]} />
      {playbook && <p className="text-xs text-neon-cyan font-mono">+ Playbook wird berücksichtigt</p>}
    </div>
  );

  if (result) {
    return (
      <motion.div variants={containerVariants} initial="initial" animate="animate" className="flex flex-col h-[calc(100vh-8rem)] animate-enter lg:-mx-20 xl:-mx-32 2xl:-mx-48">
        {/* TOP HEADER BAR */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between border-b border-firm-slate/15 pb-6 gap-4 shrink-0 mb-8">
          <h2 className="text-2xl font-bold text-firm-navy font-serif tracking-tight">Technischer Abgleich (DSGVO)</h2>
          <div className="flex gap-3 items-center">
            {/* View Toggle */}
            <div className="hidden lg:flex bg-firm-card border border-firm-slate/15 rounded-xl p-1 mr-2 shadow-sm">
              <button onClick={() => setViewMode('SPLIT')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'SPLIT' ? 'bg-firm-paper text-firm-navy shadow-sm' : 'text-firm-slate hover:text-firm-navy'}`} title="Geteilte Ansicht"><Columns size={16} /></button>
              <button onClick={() => setViewMode('SINGLE')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'SINGLE' ? 'bg-firm-paper text-firm-navy shadow-sm' : 'text-firm-slate hover:text-firm-navy'}`} title="Leseansicht (Vollbild)"><FileText size={16} /></button>
            </div>

            <Button variant="secondary" onClick={handleCopy} className="!py-2.5 !px-4 text-xs shadow-sm bg-firm-card border-firm-slate/15 hover:border-firm-slate/30">
              {copied ? <Check size={16} className="text-firm-accent" /> : <Copy size={16} />}
              {copied ? 'Kopiert' : 'Bericht kopieren (für z.B. Word)'}
            </Button>
            <button onClick={() => { setComplianceFile(null); setGlobalComplianceFile(null); setComplianceResult(null); setGlobalComplianceResult(null); }} className="p-2 ml-2 text-firm-slate/50 hover:text-firm-navy bg-white border border-firm-slate/10 rounded-full hover:shadow-sm transition-all">
              <X size={18} />
            </button>
          </div>
        </motion.div>

        {/* MAIN SPLIT CONTENT AREA */}
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
              {fileUrl ? (
                <embed src={fileUrl} type="application/pdf" className="w-full h-full block" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-firm-slate/40 p-8 text-center bg-firm-card/50">
                  <FileText size={48} className="mb-4 opacity-30" strokeWidth={1} />
                  <p className="font-bold text-sm text-firm-navy">Vorschau nicht verfügbar</p>
                  <p className="text-xs mt-2 max-w-xs text-firm-slate">Kein kompatibles PDF für den Split-View geladen.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANE: ANALYSIS RESULTS */}
          <motion.div variants={itemVariants} className={`flex flex-col h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-firm-slate/20 pb-48 ${viewMode === 'SINGLE' ? 'max-w-4xl mx-auto w-full' : ''}`}>
            <div className="bg-[#FCFAF4] border border-amber-400/30 rounded-[1.5rem] p-5 flex items-start gap-4 text-[13px] text-amber-900 shadow-sm mb-4 shrink-0">
              <Info size={18} className="shrink-0 mt-0.5 text-amber-500" />
              <p className="leading-relaxed opacity-90">
                <strong className="font-bold text-amber-800">Hinweis zur KI-Nutzung:</strong> Dies ist ein technischer Abgleich mittels generativer KI.
                Es handelt sich <strong className="font-bold">nicht</strong> um eine Zertifizierung oder rechtsverbindliche Bestätigung.
              </p>
            </div>
            {playbook && (
              <div className="bg-firm-paper/50 border border-firm-slate/10 rounded-xl p-3 flex items-center gap-3 text-sm text-firm-navy shadow-sm">
                <BookOpen size={16} className="text-firm-accent shrink-0" />
                <span>Prüfung gegen Playbook: <strong className="font-bold">{playbook.name}</strong></span>
              </div>
            )}
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-firm-lg bg-firm-card rounded-[2rem] p-6 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-firm-paper/60 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="prose prose-sm md:prose-base max-w-none text-firm-navy font-medium prose-headings:font-serif prose-headings:text-firm-navy prose-strong:text-firm-navy relative z-10">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-6 border border-firm-slate/15 rounded-xl shadow-sm bg-firm-card">
                          <table className="w-full text-left border-collapse min-w-[600px]" {...props} />
                        </div>
                      ),
                      thead: ({ node, ...props }) => <thead className="bg-firm-paper/50" {...props} />,
                      th: ({ node, ...props }) => <th className="p-4 text-[10px] font-bold text-firm-slate/60 uppercase tracking-widest border-b border-firm-slate/15" {...props} />,
                      td: ({ node, children, ...props }) => {
                        const renderChildren = (child: any): any => {
                          if (typeof child === 'string') {
                            const parts = child.split(/<br\s*\/?>/gi);
                            if (parts.length > 1) {
                              return parts.map((part, i) => (
                                <React.Fragment key={i}>
                                  {part}
                                  {i < parts.length - 1 && <br />}
                                </React.Fragment>
                              ));
                            }
                          }
                          if (Array.isArray(child)) return child.map(renderChildren);
                          return child;
                        };

                        return (
                          <td className="p-4 text-[14px] text-firm-navy border-b border-firm-slate/10 whitespace-pre-wrap leading-relaxed" {...props}>
                            {renderChildren(children)}
                          </td>
                        );
                      }
                    }}
                  >
                    {result}
                  </ReactMarkdown>
                </div>
                <GroundingSources metadata={metadata} />
              </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
              <RefinementLoop onRefine={handleRefine} loading={loading} contextType="AVV-Prüfung" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-8 pb-32 max-w-5xl mx-auto">
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-firm-lg rounded-[2rem] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#05050A] via-firm-accent to-firm-navy opacity-80" />
          <div className="flex items-center gap-4 mb-8 mt-2">
            <div className="p-3 bg-firm-paper border border-firm-slate/10 rounded-2xl text-firm-navy shadow-sm">
              <Shield size={28} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-firm-navy font-serif">Compliance Check</h3>
              <p className="text-[15px] text-firm-navy font-medium mt-1 leading-relaxed">
                Automatisierter Abgleich mit Art. 28 DSGVO (AVV) und Standardvertragsklauseln.
              </p>
            </div>
          </div>

          <div className="bg-firm-paper/30 p-2 md:p-4 rounded-2xl border border-firm-slate/5 mb-6">
            <FileUploader
              label="Dokument hochladen (PDF, DOCX, TXT)" // Changed label
              files={file}
              onFileChange={handleFileChange}
              onRemove={() => setComplianceFile(null)}
              icon={FileCheck} // Pass the component
            />

            {/* DEMO BUTTON */}
            {!state.compliance.file && ( // Changed from !compliance.file to !state.compliance.file
              <DemoLoadButton
                demoFile={{ path: '/test-dummies/09_Compliance_Check_Horror_AVV.md', name: 'Compliance_Horror_AVV.md' }}
                onLoad={setComplianceFile}
              />
            )}
          </div>

          <div className="bg-[#FCF5F5] border border-red-500/10 rounded-xl p-4 md:p-5 flex flex-col md:flex-row gap-2 md:gap-4 text-sm text-red-800/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] mx-auto font-medium">
            <strong className="font-bold flex-shrink-0">ACHTUNG:</strong>
            <span>Bitte schwärzen Sie alle personenbezogenen Daten (z.B. reale Namen, Unterschriften, präzise Adressen) <strong className="font-bold underline">VOR</strong> dem Upload.</span>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <ContextPanel />
      </motion.div>

      <motion.div variants={itemVariants} className="mt-8 relative z-10 w-full group">
        <div className="absolute inset-0 bg-firm-accent opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-[2rem]" />
        <Button fullWidth onClick={handleCheck} disabled={!file} className="!py-4 text-base tracking-wide shadow-firm-lg relative rounded-2xl active:scale-[0.98] transition-transform">
          Abgleich starten
        </Button>
      </motion.div>

      {playbook && (
        <motion.div variants={itemVariants} className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-firm-slate/60 bg-firm-card py-2 px-4 rounded-full border border-firm-slate/10 shadow-sm mx-auto w-fit">
          <BookOpen size={14} className="text-firm-accent" />
          <span>Aktives Playbook: <strong className="text-firm-navy">{playbook.name}</strong></span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ComplianceCheck;
