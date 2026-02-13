
import React, { useState } from 'react';
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
      <div className="space-y-6 pb-32 animate-enter">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 font-serif">Technischer Abgleich (DSGVO)</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCopy} className="!py-2 !px-3 text-xs">
                 {copied ? <Check size={16} /> : <Copy size={16} />}
                 {copied ? 'Kopiert' : 'Bericht kopieren (für z.B. Word)'}
            </Button>
            <Button variant="secondary" onClick={() => { setComplianceFile(null); setComplianceResult(null); }} className="!py-2 !px-3 text-xs">
                Neu
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
            <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-3 text-xs text-amber-900">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p>
                    <strong>Hinweis:</strong> Dies ist ein technischer Abgleich mittels KI. 
                    Es handelt sich <strong>nicht</strong> um eine Zertifizierung oder rechtsverbindliche Bestätigung.
                </p>
            </div>
            {playbook && (
                <div className="bg-firm-navy/5 border border-firm-navy/10 rounded p-2 flex items-center gap-2 text-sm text-firm-navy">
                    <BookOpen size={14} />
                    <span>Prüfung gegen Playbook: <strong>{playbook.name}</strong></span>
                </div>
            )}
        </div>

        <Card>
           <div className="prose prose-sm max-w-none text-slate-700">
             <ReactMarkdown 
               remarkPlugins={[remarkGfm]}
               components={{
                 table: ({ node, ...props }) => (
                   <div className="overflow-x-auto my-4 border border-slate-200 rounded-lg shadow-sm">
                     <table className="w-full text-left border-collapse min-w-[600px]" {...props} />
                   </div>
                 ),
                 thead: ({node, ...props}) => <thead className="bg-slate-50" {...props} />,
                 th: ({node, ...props}) => <th className="p-3 text-xs font-bold text-firm-navy uppercase tracking-wider border-b border-slate-200" {...props} />,
                 td: ({node, ...props}) => <td className="p-3 text-sm text-slate-600 border-b border-slate-100 whitespace-pre-wrap" {...props} />
               }}
             >
               {result}
             </ReactMarkdown>
           </div>
           <GroundingSources metadata={metadata} />
        </Card>

        <RefinementLoop onRefine={handleRefine} loading={loading} contextType="Compliance-Bericht" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32 animate-enter">
      <Card>
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-firm-navy rounded-lg text-white">
                <Shield size={24} />
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-900 font-serif">Compliance Check</h3>
                <p className="text-sm text-slate-500">
                    Abgleich mit Art. 28 DSGVO (AVV) und Standardvertragsklauseln.
                </p>
            </div>
        </div>

        <FileUploader 
            label="AVV / DPA hochladen"
            files={file}
            onFileChange={handleFileChange}
            onRemove={() => setComplianceFile(null)}
        />
        
        <p className="text-xs text-center text-red-500 mt-4 max-w-md mx-auto">
            <strong>ACHTUNG:</strong> Bitte schwärzen Sie alle personenbezogenen Daten (Namen, Unterschriften, Adressen) VOR dem Upload.
        </p>
      </Card>
      
      <ContextPanel />

      <div className="mt-8">
        <Button fullWidth onClick={handleCheck} disabled={!file}>
          Abgleich starten
        </Button>
      </div>

      {playbook && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-firm-navy/70">
            <BookOpen size={14} />
            <span>Aktives Playbook: {playbook.name}</span>
        </div>
      )}
    </div>
  );
};

export default ComplianceCheck;
