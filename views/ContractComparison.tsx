
import React, { useState } from 'react';
import { ArrowRight, ArrowLeftRight, Check, AlertTriangle, AlertOctagon, Info, BookOpen, Copy } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import ContextPanel from '../components/ui/ContextPanel'; 
import FileUploader from '../components/ui/FileUploader';
import GroundingSources from '../components/ui/GroundingSources'; 
import RefinementLoop from '../components/ui/RefinementLoop'; 
import { fileToBase64, generateAnalysis, FileData } from '../services/geminiService';
import { PROMPTS, MODEL_PRO } from '../constants';
import { ComparisonResponse, ContractChange } from '../types';
import { ComparisonSchema } from '../schemas';
import { useTokenContext } from '../contexts/TokenContext';
import { useAppContext } from '../contexts/AppContext';
import { copyRichText } from '../utils/clipboardUtils';

const ContractComparison: React.FC = () => {
  const { state, setComparisonFiles, setComparisonAnalysis, setThinking } = useAppContext();
  const { trackUsage } = useTokenContext();
  
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const file1 = state.comparison.fileOriginal;
  const file2 = state.comparison.fileNew;
  const data = state.comparison.analysis;
  const metadata = state.comparison.groundingMetadata; 
  const playbook = state.playbookFile;

  const handleFile1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setComparisonFiles(e.target.files[0], file2);
    }
  };

  const handleFile2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setComparisonFiles(file1, e.target.files[0]);
    }
  };

  const runAnalysis = async (customPrompt?: string, additionalFiles?: File[]) => {
    if (!file1 || !file2) return;
    
    setLoading(true);
    setThinking(true);
    try {
      const b64File1 = await fileToBase64(file1);
      const b64File2 = await fileToBase64(file2);

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

      let finalPrompt = "";
      if (customPrompt && data) {
         finalPrompt = `
           DU BIST IM "REFINEMENT MODE".
           VORHERIGE SYNOPSE (JSON):
           ${JSON.stringify(data)}
           USER ANWEISUNG:
           "${customPrompt}"
           AUFGABE:
           Aktualisiere die Analyse entsprechend. Behalte die JSON-Struktur bei.
         `;
      } else {
         finalPrompt = PROMPTS.CONTRACT_COMPARISON;
         if (!customPrompt) {
             filePayloads.push({ mimeType: file2.type, data: b64File2, name: "GEGENENTWURF_V2" });
         }
      }

      const response = await generateAnalysis<ComparisonResponse>({
        prompt: finalPrompt,
        fileData: file1 ? { mimeType: file1.type, data: b64File1 } : undefined,
        contextData: contextData, 
        additionalFiles: filePayloads,
        referenceUrls: state.referenceUrls,
        useSearch: state.useSearch,
        model: MODEL_PRO,
        responseSchema: ComparisonSchema,
        thinkingLevel: "high",
        viewContext: 'CONTRACT' 
      });
      
      setComparisonAnalysis(response.data, response.groundingMetadata);
      trackUsage(response.usage);
      
    } catch (error) {
      console.error(error);
      alert("Vergleich fehlgeschlagen.");
    } finally {
      setLoading(false);
      setThinking(false);
    }
  };

  const handleCompare = () => runAnalysis();
  const handleRefine = (instruction: string, files: File[]) => runAnalysis(instruction, files);

  const handleCopyReport = async () => {
    if (!data) return;
    
    const tType = (t: string) => {
        const map: Record<string, string> = { 'ADDED': 'Neuaufnahme', 'REMOVED': 'Streichung', 'MODIFIED': 'Änderung' };
        return map[t] || t;
    };
    const tSev = (s: string) => {
        const map: Record<string, string> = { 'CRITICAL': 'KRITISCH', 'MAJOR': 'WESENTLICH', 'MINOR': 'GERING' };
        return map[s] || s;
    };

    const lines = [];
    lines.push(`# VERSIONSVERGLEICH (SYNOPSE)`);
    lines.push(`**Original (V1):** ${file1?.name}`);
    lines.push(`**Gegenentwurf (V2):** ${file2?.name}`);
    lines.push(`\n## 1. STRATEGISCHE ZUSAMMENFASSUNG`);
    lines.push(`${data.summaryOfChanges}`);
    lines.push(`\n**Verhandlungsklima / Strategischer Shift:** ${data.strategicShift}`);
    lines.push(`\n## 2. MATERIELLE ABWEICHUNGEN (DETAIL-ANALYSE)`);
    data.changes.forEach((c) => {
        lines.push(`\n### ${c.clauseTitle} [${tSev(c.severity)}]`);
        lines.push(`*Änderungsart: ${tType(c.changeType)}*`);
        if(c.originalText) {
             lines.push(`> **V1 (Original):** ${c.originalText}`);
        } else {
             lines.push(`> **V1 (Original):** (Nicht vorhanden/Neu)`);
        }
        lines.push(`> **V2 (Neu):** ${c.newText}`);
        lines.push(`\n**Rechtliche Würdigung:** ${c.legalImpact}`);
        lines.push(`**Strategischer Kommentar:** ${c.strategicComment}`);
        lines.push(`---`);
    });

    await copyRichText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center animate-enter">
        <Loader messages={[
            "Lese Original-Entwurf (V1)...", 
            "Lese Gegenentwurf (V2)...", 
            "Erstelle semantische Synopse...",
            "Analysiere strategische Verschiebungen...",
            "Bewerte Risiken der Abweichungen..."
        ]} />
      </div>
    );
  }

  // RESULT VIEW
  if (data) {
    return (
        <div className="space-y-8 pb-32 animate-enter">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-firm-navy font-serif">Versionsvergleich</h2>
                    <div className="flex gap-4 mt-1 text-sm text-slate-500 font-mono">
                        <span>V1: {file1?.name}</span>
                        <ArrowRight size={14} />
                        <span>V2: {file2?.name}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleCopyReport} className="!py-2 !px-3 text-xs">
                         {copied ? <Check size={16} /> : <Copy size={16} />}
                         {copied ? 'Kopiert' : 'Synopse kopieren'}
                    </Button>
                    <Button variant="secondary" onClick={() => { setComparisonFiles(null, null); setComparisonAnalysis(null); }} className="!py-2 !px-3 text-xs">
                        Neu
                    </Button>
                </div>
            </div>

            {/* Strategic Summary */}
            <div className="bg-white p-6 rounded-lg shadow-firm border-l-4 border-firm-accent relative">
                <h3 className="font-bold text-firm-navy font-serif mb-2 text-lg">Strategische Einschätzung</h3>
                <p className="text-slate-700 text-sm leading-relaxed mb-4">{data.summaryOfChanges}</p>
                <div className="bg-slate-50 p-3 rounded text-sm font-medium text-slate-600 flex items-start gap-2">
                    <Info size={16} className="mt-0.5 text-firm-accent shrink-0"/>
                    <span><strong>Tone Shift:</strong> {data.strategicShift}</span>
                </div>
            </div>

            <GroundingSources metadata={metadata} />

            {/* Delta Cards */}
            <div className="space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Materielle Abweichungen</h3>
                {data.changes.map((change, idx) => (
                    <DeltaCard key={idx} change={change} />
                ))}
            </div>

            <RefinementLoop onRefine={handleRefine} loading={loading} contextType="Vergleich" />
        </div>
    );
  }

  // UPLOAD VIEW
  return (
    <div className="space-y-6 pb-32 animate-enter">
      <Card className="shadow-firm">
        <div className="flex items-center gap-3 mb-6">
           <div className="p-2 bg-firm-navy rounded-lg text-white">
             <ArrowLeftRight size={24} />
           </div>
           <div>
             <h3 className="text-xl font-bold text-gray-900 font-serif">Versionsvergleich</h3>
             <p className="text-sm text-slate-500">
                Laden Sie Ihren Entwurf und den Gegenentwurf hoch. <br/>
                Die KI erstellt eine <strong>rechtliche Synopse</strong> (keine einfache Textdifferenz).
             </p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-firm-navy uppercase tracking-wider ml-1">Unser Entwurf (V1)</span>
                <FileUploader 
                    label="Originaldatei wählen"
                    files={file1}
                    onFileChange={handleFile1Change}
                    onRemove={() => setComparisonFiles(null, file2)}
                    variant="default" // Using default instead of compact for uniformity
                />
            </div>

            <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-firm-accent uppercase tracking-wider ml-1">Gegenentwurf (V2)</span>
                <FileUploader 
                    label="Gegenentwurf wählen"
                    files={file2}
                    onFileChange={handleFile2Change}
                    onRemove={() => setComparisonFiles(file1, null)}
                    variant="default" // Using default instead of compact for uniformity
                    icon={ArrowLeftRight}
                />
            </div>
        </div>
      </Card>

      <div className="animate-enter">
          <ContextPanel />
      </div>

      <div className="mt-8 animate-enter">
           <Button fullWidth onClick={handleCompare} disabled={!file1 || !file2}>
               Synopse erstellen
           </Button>
      </div>
      
      {playbook && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-firm-navy/70 animate-enter">
              <BookOpen size={14} />
              <span>Abgleich mit Playbook: {playbook.name}</span>
          </div>
      )}
    </div>
  );
};

const DeltaCard: React.FC<{ change: ContractChange }> = ({ change }) => {
    const translateSeverity = (sev: string) => {
        const map: Record<string, string> = { 'CRITICAL': 'KRITISCH', 'MAJOR': 'WESENTLICH', 'MINOR': 'GERING' };
        return map[sev] || sev;
    };
    const translateType = (type: string) => {
        const map: Record<string, string> = { 'ADDED': 'NEU', 'REMOVED': 'GELÖSCHT', 'MODIFIED': 'GEÄNDERT' };
        return map[type] || type;
    };
    const getSeverityColor = () => {
        switch(change.severity) {
            case 'CRITICAL': return 'bg-red-50 border-red-200';
            case 'MAJOR': return 'bg-amber-50 border-amber-200';
            default: return 'bg-slate-50 border-slate-200';
        }
    };
    const getIcon = () => {
        switch(change.severity) {
            case 'CRITICAL': return <AlertOctagon size={18} className="text-red-600" />;
            case 'MAJOR': return <AlertTriangle size={18} className="text-amber-600" />;
            default: return <Info size={18} className="text-slate-500" />;
        }
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className={`px-4 py-3 flex items-center justify-between border-b ${getSeverityColor()}`}>
                <div className="flex items-center gap-3">
                    {getIcon()}
                    <h4 className="font-bold text-firm-navy text-sm">{change.clauseTitle}</h4>
                </div>
                <div className="flex gap-2">
                     <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-white/50 rounded text-slate-600 border border-black/5">
                        {translateType(change.changeType)}
                     </span>
                     <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-white rounded shadow-sm text-firm-navy">
                        {translateSeverity(change.severity)}
                     </span>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-100">
                <div className="p-4 border-r border-slate-100 bg-slate-50/50">
                    <p className="text-xs uppercase text-slate-400 font-bold mb-2">Original (V1)</p>
                    <p className="text-sm text-slate-600 font-serif leading-relaxed line-through decoration-red-300 decoration-2 opacity-70">
                        {change.originalText || "(Nicht vorhanden / Neu)"}
                    </p>
                </div>
                <div className="p-4 bg-white">
                    <p className="text-xs uppercase text-firm-accent font-bold mb-2">Neu (V2)</p>
                    <p className="text-sm text-firm-navy font-serif leading-relaxed bg-green-50/50 -mx-1 px-1 rounded">
                        {change.newText}
                    </p>
                </div>
            </div>
            <div className="p-4 bg-white">
                 <div className="mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rechtliche Konsequenz</span>
                    <p className="text-sm text-slate-700 mt-1">{change.legalImpact}</p>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-firm-navy italic relative">
                    <p><strong>Strategischer Kommentar:</strong> {change.strategicComment}</p>
                 </div>
            </div>
        </div>
    );
};

export default ContractComparison;
