
import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import ContextPanel from '../components/ui/ContextPanel';
import FileUploader from '../components/ui/FileUploader';
import GroundingSources from '../components/ui/GroundingSources';
import RefinementLoop from '../components/ui/RefinementLoop';
import DemoLoadButton from '../components/ui/DemoLoadButton';
import { generateAnalysis, fileToBase64, FileData } from '../services/geminiService';
import { PROMPTS, MODEL_FLASH } from '../constants';
import { NdaTriageResponse, View } from '../types';
import { NdaTriageSchema } from '../schemas';
import { FileCheck, Upload, AlertCircle, Check, Play, BookOpen, Fingerprint, ShieldAlert, ArrowRight, ShieldCheck, Mail, Copy, X, Columns, FileText, ExternalLink, Clock } from 'lucide-react';
import { useTokenContext } from '../contexts/TokenContext';
import { useAppContext } from '../contexts/AppContext';
import { copyRichText } from '../utils/clipboardUtils';

const NdaTriage: React.FC = () => {
  const { state, setNdaText, setNdaFile: setGlobalNdaFile, setNdaAnalysis: setGlobalNdaAnalysis, setThinking } = useAppContext();
  const { trackUsage } = useTokenContext();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const text = state.ndaTriage.text;
  const [file, setNdaFile] = useState<File | null>(state.ndaTriage.file);
  const [data, setNdaAnalysis] = useState<any | null>(state.ndaTriage.analysis);
  const [metadata, setMetadata] = useState<any | null>(state.ndaTriage.groundingMetadata);
  const playbook = state.playbookFile;

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setNdaFile(selectedFile);
      setGlobalNdaFile(selectedFile); // Update global context
    }
  };

  const runAnalysis = async (customPrompt?: string, additionalFiles?: File[]) => {
    if (!text.trim() && !file && !data) return;

    setLoading(true);
    setThinking(true);
    try {
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

      let mainFileData: FileData | undefined = undefined;
      if (file) {
        const b64 = await fileToBase64(file);
        mainFileData = { mimeType: file.type, data: b64 };
      }

      let prompt = PROMPTS.NDA_TRIAGE;

      if (customPrompt && data) {
        prompt = `
            DU BIST IM "REFINEMENT MODE".
            AUFGABE: Aktualisiere die NDA-Prüfung (Triage) basierend auf User-Feedback.
            VORHERIGES ERGEBNIS (JSON): ${JSON.stringify(data)}
            USER FEEDBACK: "${customPrompt}"
            ANWEISUNG: Aktualisiere Score, Verdict und Findings. Behalte die JSON Struktur bei.
         `;
      } else {
        if (text.trim()) {
          prompt = prompt + "\n\nVERTRAGSTEXT (COPY/PASTE):\n" + text;
        }
      }

      const response = await generateAnalysis<NdaTriageResponse>({
        prompt: prompt,
        contextData: contextData,
        fileData: mainFileData,
        additionalFiles: filePayloads,
        referenceUrls: state.referenceUrls,
        useSearch: state.useSearch,
        model: MODEL_FLASH,
        responseSchema: NdaTriageSchema,
        thinkingLevel: "medium",
        viewContext: 'NDA'
      });
      setNdaAnalysis(response.data);
      setMetadata(response.groundingMetadata);
      trackUsage(response.usage);
    } catch (error) {
      alert("Prüfung fehlgeschlagen.");
    } finally {
      setLoading(false);
      setThinking(false);
    }
  };

  const handleTriage = () => runAnalysis();
  const handleRefine = (instruction: string, files: File[]) => runAnalysis(instruction, files);

  const handleCopyReport = async () => {
    if (!data) return;
    const lines = [];
    lines.push(`# NDA PRÜFBERICHT (ENTWURF)`);
    lines.push(`**Ergebnis:** ${data.verdict}`);
    lines.push(`**Score:** ${data.score}/100`);
    lines.push(`\n**Zusammenfassung:**\n${data.summary}\n`);
    lines.push(`## Detailanalyse`);
    data.keyFindings.forEach((finding) => {
      lines.push(`- ${finding.label}: ${finding.value} ${finding.isRisk ? '[RISIKO]' : ''}`);
    });
    lines.push(`\n## Fristen & Laufzeit`);
    lines.push(data.durationAnalysis);
    await copyRichText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-[60vh] flex justify-center items-center">
      <Loader messages={[
        "Prüfe Dokument auf kritische Klauseln...",
        "Analysiere Laufzeit & Vertragsstrafen...",
        state.useSearch ? "Grounding: Verifiziere Parteien via Google..." : "Abgleich mit Playbook...",
        "Finalisiere Handlungsempfehlung..."
      ]} />
    </div>
  );

  if (data) {
    const isGreen = data.verdict === 'GRÜN';
    const isRed = data.verdict === 'ROT';
    const bgClass = isGreen ? 'bg-emerald-600' : isRed ? 'bg-red-600' : 'bg-amber-500';

    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] animate-enter lg:-mx-20 xl:-mx-32 2xl:-mx-48">
        {/* TOP HEADER BAR */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-firm-slate/15 pb-6 gap-4 mb-8 shrink-0">
          <h2 className="text-2xl font-bold text-firm-navy font-serif tracking-tight">Ersteinschätzung (NDA)</h2>
          <div className="flex gap-3 items-center">

            {/* View Toggle */}
            <div className="hidden lg:flex bg-white border border-firm-slate/15 rounded-xl p-1 mr-2 shadow-sm">
              <button onClick={() => setViewMode('SPLIT')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'SPLIT' ? 'bg-firm-paper text-firm-navy shadow-sm' : 'text-firm-slate hover:text-firm-navy'}`} title="Geteilte Ansicht"><Columns size={16} /></button>
              <button onClick={() => setViewMode('SINGLE')} className={`p-1.5 rounded-lg transition-colors ${viewMode === 'SINGLE' ? 'bg-firm-paper text-firm-navy shadow-sm' : 'text-firm-slate hover:text-firm-navy'}`} title="Leseansicht (Vollbild)"><FileText size={16} /></button>
            </div>

            <Button variant="secondary" onClick={handleCopyReport} className="!py-2.5 !px-4 text-xs shadow-sm bg-white border-firm-slate/15 hover:border-firm-slate/30">
              {copied ? <Check size={16} className="text-firm-accent" /> : <Copy size={16} />}
              {copied ? 'Kopiert' : 'Bericht kopieren'}
            </Button>
            <button onClick={() => { setNdaText(''); setNdaFile(null); setNdaAnalysis(null); }} className="p-2 ml-2 text-firm-slate/50 hover:text-firm-navy bg-white border border-firm-slate/10 rounded-full hover:shadow-sm transition-all">
              <X size={18} />
            </button>
          </div>
        </div>

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
                <div className="flex flex-col items-center justify-center h-full text-firm-slate/40 p-8 text-center bg-white/50">
                  <FileText size={48} className="mb-4 opacity-30" strokeWidth={1} />
                  <p className="font-bold text-sm text-firm-navy">Vorschau nicht verfügbar</p>
                  <p className="text-xs mt-2 max-w-xs text-firm-slate">Kein kompatibles PDF für den Split-View geladen.</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANE: ANALYSIS RESULTS */}
          <div className={`flex flex-col h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-firm-slate/20 pb-48 ${viewMode === 'SINGLE' ? 'max-w-4xl mx-auto w-full' : ''}`}>

            {playbook && (
              <div className="bg-firm-paper/50 border border-firm-slate/10 rounded-xl p-3 flex items-center gap-3 text-sm text-firm-navy shadow-sm mb-6 shrink-0">
                <BookOpen size={16} className="text-firm-accent shrink-0" />
                <span>Playbook-Abgleich aktiv: <strong className="font-bold">{playbook.name}</strong></span>
              </div>
            )}

            <div className={`relative overflow-hidden rounded-3xl p-8 md:p-10 text-white ${bgClass} shadow-firm-lg group shrink-0 mb-8`}>
              <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[10px] font-bold text-white/80 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span> Handlungsempfehlung
                  </h3>
                </div>
                <div className="text-5xl font-bold mb-6 tracking-tight font-serif">
                  {data.verdict === 'GRÜN' ? 'FREIGABE' : data.verdict === 'ROT' ? 'STOPP' : 'MANUELLE PRÜFUNG'}
                </div>
                <p className="text-white/90 text-[15px] md:text-[16px] font-medium leading-relaxed">
                  {data.summary}
                </p>
              </div>
            </div>

            <GroundingSources metadata={metadata} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="md:col-span-2 border border-firm-slate/10 shadow-sm p-6 bg-white hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3 text-firm-navy">
                  <Clock size={18} className="text-firm-accent" />
                  <h4 className="font-bold font-serif text-[15px]">Fristen & Laufzeit</h4>
                </div>
                <p className="text-sm text-firm-navy font-medium leading-relaxed ml-7">{data.durationAnalysis}</p>
              </Card>

              {data.keyFindings.map((finding, idx) => (
                <Card key={idx} className="border border-firm-slate/10 shadow-sm p-5 bg-white hover:border-firm-slate/30 transition-colors">
                  <span className="text-[10px] text-firm-slate/50 font-bold uppercase tracking-widest block mb-2">{finding.label}</span>
                  <div className="flex items-start justify-between">
                    <span className="font-serif text-[15px] text-firm-navy leading-tight pr-4">{finding.value}</span>
                    {finding.isRisk && <AlertCircle size={18} className="text-red-500 shrink-0" />}
                  </div>
                </Card>
              ))}
            </div>

            <RefinementLoop onRefine={handleRefine} loading={loading} contextType="NDA-Prüfung" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 animate-enter max-w-5xl mx-auto">
      <Card className="border-0 shadow-firm-lg rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-firm-navy via-firm-accent to-firm-navy opacity-80" />
        <div className="flex items-center gap-4 mb-8 mt-2">
          <div className="p-3 bg-firm-paper border border-firm-slate/10 rounded-2xl text-firm-navy shadow-sm">
            <FileCheck size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-firm-navy font-serif">NDA Vorprüfung</h3>
            <p className="text-[15px] text-firm-navy font-medium mt-1 leading-relaxed">
              Prüfung auf Marktstandards & benachteiligende Klauseln in Sekunden.
            </p>
          </div>
        </div>

        <div className="bg-firm-paper/30 p-2 md:p-4 rounded-2xl border border-firm-slate/5 mb-8">
          <FileUploader
            label="NDA hochladen"
            files={file}
            onFileChange={handleFileChange}
            onRemove={() => setNdaFile(null)}
          />
        </div>

        <div className="pt-2">
          <label className="block text-[10px] font-bold text-firm-slate/50 uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
            <span className="h-px bg-firm-slate/10 flex-1"></span>
            Oder Text einfügen
            <span className="h-px bg-firm-slate/10 flex-1"></span>
          </label>
          <textarea
            className="w-full h-40 p-5 rounded-xl bg-firm-paper/50 border border-firm-slate/15 resize-none focus:ring-2 focus:ring-firm-accent/30 focus:border-firm-accent text-[14px] font-medium leading-relaxed text-firm-navy placeholder-firm-slate/40 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] outline-none"
            placeholder="Fügen Sie hier den Text der Vereinbarung ein..."
            value={text}
            onChange={(e) => setNdaText(e.target.value)}
          />
        </div>
      </Card>

      <ContextPanel />

      <div className="mt-8 relative z-10 w-full group">
        <div className="absolute inset-0 bg-firm-accent opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-2xl" />
        <Button fullWidth onClick={handleTriage} disabled={!text.trim() && !file} className="!py-4 text-base tracking-wide shadow-firm-lg relative">
          Prüfung starten
        </Button>
      </div>
    </div>
  );
};

export default NdaTriage;
