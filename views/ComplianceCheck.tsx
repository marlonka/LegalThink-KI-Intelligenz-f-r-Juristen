import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import ContextPanel from '../components/ui/ContextPanel';
import FileUploader from '../components/ui/FileUploader';
import GroundingSources from '../components/ui/GroundingSources';
import RefinementLoop from '../components/ui/RefinementLoop';
import { generateAnalysis, fileToBase64, FileData } from '../services/geminiService';
import { PROMPTS, MODEL_PRO } from '../constants';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Upload, FileText, Info, BookOpen, Copy, Check, Shield } from 'lucide-react';
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
  const { state, setComplianceFile, setComplianceResult, setThinking } = useAppContext();
  const { trackUsage } = useTokenContext();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const file = state.compliance.file;
  const result = state.compliance.result;
  const metadata = state.compliance.groundingMetadata;
  const playbook = state.playbookFile;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setComplianceFile(e.target.files[0]);
    }
  };

  const runCheck = async (customPrompt?: string, additionalFiles?: File[]) => {
    if (!file && !result) return;
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
      setComplianceResult(response.data, response.groundingMetadata);
      trackUsage(response.usage);
    } catch (error) {
      setComplianceResult("Fehler beim Abgleich.", undefined);
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
      <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-8 pb-32 max-w-5xl mx-auto">
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between border-b border-firm-slate/15 pb-6 gap-4">
          <h2 className="text-2xl font-bold text-firm-navy font-serif tracking-tight">Technischer Abgleich (DSGVO)</h2>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleCopy} className="!py-2.5 !px-4 text-xs shadow-sm bg-white border-firm-slate/15 hover:border-firm-slate/30">
              {copied ? <Check size={16} className="text-firm-accent" /> : <Copy size={16} />}
              {copied ? 'Kopiert' : 'Bericht kopieren (für z.B. Word)'}
            </Button>
            <Button variant="secondary" onClick={() => { setComplianceFile(null); setComplianceResult(null); }} className="!py-2.5 !px-4 text-xs bg-firm-paper border-firm-slate/10 hover:bg-white hover:text-firm-navy transition-colors">
              Neu Starten
            </Button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          <div className="bg-[#FCFAF4] border border-amber-400/30 rounded-[1.5rem] p-5 flex items-start gap-4 text-[13px] text-amber-900 shadow-sm mt-2">
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
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-0 shadow-firm-lg bg-white rounded-[2rem] p-6 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-firm-paper/60 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="prose prose-sm md:prose-base max-w-none text-firm-navy font-medium prose-headings:font-serif prose-headings:text-firm-navy prose-strong:text-firm-navy relative z-10">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-6 border border-firm-slate/15 rounded-xl shadow-sm bg-white">
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
          <RefinementLoop onRefine={handleRefine} loading={loading} contextType="Compliance-Bericht" />
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="space-y-8 pb-32 max-w-4xl mx-auto">
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-firm-lg rounded-[2rem] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-firm-navy via-firm-accent to-firm-navy opacity-80" />
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
              label="AVV / DPA hochladen"
              files={file}
              onFileChange={handleFileChange}
              onRemove={() => setComplianceFile(null)}
            />
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
        <motion.div variants={itemVariants} className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-firm-slate/60 bg-white py-2 px-4 rounded-full border border-firm-slate/10 shadow-sm mx-auto w-fit">
          <BookOpen size={14} className="text-firm-accent" />
          <span>Aktives Playbook: <strong className="text-firm-navy">{playbook.name}</strong></span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ComplianceCheck;
