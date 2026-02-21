
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
import { View, ComparisonResponse, ContractChange } from '../types';
import { ComparisonSchema } from '../schemas';
import { useTokenContext } from '../contexts/TokenContext';
import { useAppContext } from '../contexts/AppContext';
import { copyRichText } from '../utils/clipboardUtils';
import { fetchDemoFile } from '../utils/demoUtils';
import DemoLoadButton from '../components/ui/DemoLoadButton';

const ContractComparison: React.FC = () => {
  const { state, setComparisonFiles, setComparisonAnalysis, setThinking } = useAppContext();
  const { trackUsage } = useTokenContext();

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
      if (c.originalText) {
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

  if (loading || isAnalyzing) {
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
      <div className="space-y-8 pb-32 animate-enter max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-firm-slate/15 pb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-firm-navy font-serif tracking-tight">Versionsvergleich</h2>
            <div className="flex items-center gap-4 mt-2 text-xs text-firm-slate/60 font-mono tracking-wider font-medium">
              <span className="truncate max-w-[200px]">V1: {file1?.name}</span>
              <ArrowRight size={14} className="text-firm-accent shrink-0" />
              <span className="truncate max-w-[200px]">V2: {file2?.name}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleCopyReport} className="!py-2.5 !px-4 text-xs shadow-sm bg-firm-card border-firm-slate/15 hover:border-firm-slate/30">
              {copied ? <Check size={16} className="text-firm-accent" /> : <Copy size={16} />}
              {copied ? 'Kopiert' : 'Synopse kopieren'}
            </Button>
            <Button variant="secondary" onClick={() => { setComparisonFiles(null, null); setComparisonAnalysis(null); }} className="!py-2.5 !px-4 text-xs bg-firm-paper border-firm-slate/10 hover:bg-firm-card hover:text-firm-navy transition-colors">
              Neu Starten
            </Button>
          </div>
        </div>

        {/* Strategic Summary */}
        <div className="bg-firm-card p-8 rounded-3xl shadow-firm border border-firm-slate/10 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-firm-accent group-hover:w-2 transition-all duration-300"></div>
          <h3 className="font-bold text-firm-navy font-serif mb-4 text-xl flex items-center gap-3">
            Strategische Einschätzung
          </h3>
          <p className="text-firm-navy text-[15px] md:text-[16px] leading-relaxed font-medium">{data.summaryOfChanges}</p>
          <div className="bg-firm-paper/50 p-4 rounded-xl text-sm font-medium text-firm-navy flex items-start gap-3 border border-firm-slate/10 md:items-center mt-6">
            <Info size={18} className="text-firm-accent shrink-0" />
            <span><strong className="text-firm-slate/60 uppercase tracking-widest text-[10px] block md:inline md:mr-2">Tone Shift</strong> {data.strategicShift}</span>
          </div>
        </div>

        <GroundingSources metadata={metadata} />

        {/* Delta Cards */}
        <div className="space-y-6 pt-4">
          <h3 className="text-[11px] font-bold text-firm-slate/60 uppercase tracking-widest px-2 mb-2">Materielle Abweichungen</h3>
          {data.changes.map((change, idx) => (
            <DeltaCard key={idx} change={change} />
          ))}
        </div>

        <RefinementLoop onRefine={handleRefine} loading={loading} contextType="Vergleich" />
      </div>
    );
  }

  const handleLoadDemo = async () => {
    setIsAnalyzing(true);
    try {
      const dbFile1 = await fetchDemoFile('/test-dummies/02_Synopse_Dienstleistungsvertrag_V1_Original.md', 'Dienstleistungsvertrag_V1_Original.md');
      const dbFile2 = await fetchDemoFile('/test-dummies/03_Synopse_Dienstleistungsvertrag_V2_Gegenentwurf.md', 'Dienstleistungsvertrag_V2_Gegenentwurf.md');
      setComparisonFiles(dbFile1, dbFile2);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // UPLOAD VIEW
  return (
    <div className="space-y-8 pb-32 animate-enter max-w-5xl mx-auto">
      <Card className="border-0 shadow-firm-lg rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#05050A] via-firm-accent to-firm-navy opacity-80" />

        <div className="flex items-center gap-4 mb-10 mt-2">
          <div className="p-3 bg-firm-paper border border-firm-slate/10 rounded-2xl text-firm-navy shadow-sm">
            <ArrowLeftRight size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-firm-navy font-serif">Versionsvergleich</h3>
            <p className="text-[15px] text-firm-navy font-medium mt-1 leading-relaxed">
              Laden Sie Ihren Entwurf und den Gegenentwurf hoch. <br className="hidden md:block" />
              Die KI erstellt eine präzise <strong>rechtliche Synopse</strong> (keine einfache Textdifferenz).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left bg-firm-paper/30 p-2 md:p-6 rounded-2xl border border-firm-slate/5">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1 px-1">
              <div className="w-6 h-6 rounded-full bg-firm-paper border border-firm-slate/15 flex items-center justify-center text-[10px] font-bold text-firm-slate">V1</div>
              <span className="text-xs font-bold text-firm-navy uppercase tracking-wider">Unser Entwurf</span>
            </div>
            <FileUploader
              label="Originaldatei wählen"
              files={file1}
              onFileChange={handleFile1Change}
              onRemove={() => setComparisonFiles(null, file2)}
              variant="default"
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-1 px-1">
              <div className="w-6 h-6 rounded-full bg-firm-accent/10 border border-firm-accent/30 flex items-center justify-center text-[10px] font-bold text-firm-accent">V2</div>
              <span className="text-xs font-bold text-firm-navy uppercase tracking-wider">Gegenentwurf</span>
            </div>
            <FileUploader
              label="Gegenentwurf wählen"
              files={file2}
              onFileChange={handleFile2Change}
              onRemove={() => setComparisonFiles(file1, null)}
              variant="default"
              icon={ArrowLeftRight}
            />
          </div>
        </div>

        {/* DEMO BUTTON */}
        {state.isDemoMode && !state.comparison.fileOriginal && !state.comparison.fileNew && (
          <DemoLoadButton
            demoFile={{ path: '/test-dummies/02_Synopse_Dienstleistungsvertrag_V1_Original.md', name: 'dummy1' }} // Just to satisfy props, override click handler
            onLoad={() => { }}
          // Override click via wrapper below
          />
        )}
        {/* Custom Demo wrapper for dual files */}
        {state.isDemoMode && !state.comparison.fileOriginal && !state.comparison.fileNew && (
          <div className="absolute inset-0 z-10" onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLoadDemo();
          }}></div>
        )}

      </Card>

      <div className="animate-enter">
        <ContextPanel />
      </div>

      <div className="mt-8 relative z-10 w-full group">
        <div className="absolute inset-0 bg-firm-accent opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-2xl" />
        <Button fullWidth onClick={handleCompare} disabled={!file1 || !file2} className="!py-4 text-base tracking-wide shadow-firm-lg relative">
          Synopse erstellen
        </Button>
      </div>

      {playbook && (
        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-firm-slate/60 animate-enter bg-firm-card py-2 px-4 rounded-full border border-firm-slate/10 shadow-sm mx-auto w-fit">
          <BookOpen size={14} className="text-firm-accent" />
          <span>Abgleich mit Playbook: <strong className="text-firm-navy">{playbook.name}</strong></span>
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
    switch (change.severity) {
      case 'CRITICAL': return 'bg-red-50 border-red-500/20';
      case 'MAJOR': return 'bg-[#FCFAF4] border-amber-400/30';
      default: return 'bg-firm-paper border-firm-slate/10';
    }
  };
  const getIcon = () => {
    switch (change.severity) {
      case 'CRITICAL': return <AlertOctagon size={18} className="text-red-500" />;
      case 'MAJOR': return <AlertTriangle size={18} className="text-amber-500" />;
      default: return <Info size={18} className="text-firm-slate/50" />;
    }
  };

  return (
    <div className="bg-firm-card rounded-2xl border border-firm-slate/15 shadow-sm overflow-hidden hover:shadow-firm transition-shadow duration-300 group">
      <div className={`px-6 py-4 flex items-center justify-between border-b transition-colors duration-300 group-hover:bg-opacity-50 ${getSeverityColor()}`}>
        <div className="flex items-center gap-3">
          {getIcon()}
          <h4 className="font-bold text-firm-navy text-[16px] leading-snug">{change.clauseTitle}</h4>
        </div>
        <div className="flex gap-2">
          <span className="text-[9px] uppercase font-bold px-2.5 py-1 bg-firm-card/80 rounded-full text-firm-navy font-medium shadow-sm border border-firm-slate/5 tracking-wider">
            {translateType(change.changeType)}
          </span>
          <span className="text-[9px] uppercase font-bold px-2.5 py-1 bg-firm-card rounded-full shadow-sm text-firm-navy tracking-wider border border-firm-slate/5">
            {translateSeverity(change.severity)}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-firm-slate/5">
        <div className="p-6 border-r border-firm-slate/5 bg-firm-paper/30">
          <p className="text-[10px] uppercase text-firm-slate/60 font-bold mb-3 tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-firm-slate/30"></span> Original (V1)
          </p>
          <p className="text-firm-slate/80 leading-relaxed font-medium line-through decoration-firm-slate/30 decoration-1">
            {change.originalText || "(Nicht vorhanden / Neu)"}
          </p>
        </div>
        <div className="p-6 bg-firm-card">
          <p className="text-[10px] uppercase text-firm-accent font-bold mb-3 tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-firm-accent"></span> Neu (V2)
          </p>
          <p className="text-firm-navy font-medium leading-relaxed bg-[#F4FCF7] -mx-2 px-2 py-2 rounded-lg border-l-2 border-emerald-400 shadow-sm">
            {change.newText}
          </p>
        </div>
      </div>
      <div className="p-6 bg-firm-card rounded-b-2xl">
        <div className="mb-5">
          <span className="text-[10px] font-bold text-firm-slate/50 uppercase tracking-widest">Rechtliche Konsequenz</span>
          <p className="text-[14px] md:text-[15px] text-firm-navy mt-1.5 leading-relaxed font-medium">{change.legalImpact}</p>
        </div>
        <div className="bg-firm-paper p-5 rounded-2xl border border-firm-slate/5 flex gap-3 text-sm text-firm-navy relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-firm-accent/40"></div>
          <div>
            <span className="text-[10px] font-bold text-firm-slate/60 uppercase tracking-widest block mb-2">Strategischer Kommentar</span>
            <span className="text-firm-navy font-medium text-[14px] md:text-[15px] leading-relaxed block">{change.strategicComment}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractComparison;
