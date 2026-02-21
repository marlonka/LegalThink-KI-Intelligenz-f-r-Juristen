
import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import ContextPanel from '../components/ui/ContextPanel';
import FileUploader from '../components/ui/FileUploader';
import GroundingSources from '../components/ui/GroundingSources';
import DemoLoadButton from '../components/ui/DemoLoadButton';
import { generateAnalysis, fileToBase64, FileData } from '../services/geminiService';
import { PROMPTS, MODEL_PRO } from '../constants';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// Added missing FileCheck and ArrowLeftRight imports from lucide-react
import { Upload, FileText, XCircle, Info, Paperclip, FilePlus, Type, BookOpen, Copy, Check, RefreshCw, PlusCircle, ArrowDown, Fingerprint, FileCheck, ArrowLeftRight } from 'lucide-react';
import { useTokenContext } from '../contexts/TokenContext';
import { useAppContext } from '../contexts/AppContext';
import { copyRichText } from '../utils/clipboardUtils';

const DpiaGenerator: React.FC = () => {
  const { state, setDpiaMode, addDpiaFile, removeDpiaFile, setDpiaTextInput, setDpiaContext, setDpiaAnalysis, setThinking } = useAppContext();
  const { trackUsage } = useTokenContext();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refinementText, setRefinementText] = useState('');
  const [refinementFiles, setRefinementFiles] = useState<File[]>([]);

  const mode = state.dpia.mode;
  const files = state.dpia.files;
  const textInput = state.dpia.textInput;
  const context = state.dpia.context;
  const result = state.dpia.analysis;
  const metadata = state.dpia.groundingMetadata;
  const playbook = state.playbookFile;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => addDpiaFile(file));
    }
  };

  const handleRefinementFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setRefinementFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };

  const removeRefinementFile = (index: number) => {
    setRefinementFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (files.length === 0 && !textInput.trim() && !context.trim()) return;
    setLoading(true);
    setThinking(true);
    try {
      let contextData = undefined;
      if (playbook) {
        const playbookBase64 = await fileToBase64(playbook);
        contextData = { mimeType: playbook.type, data: playbookBase64 };
      }
      const filePayloads: FileData[] = [];
      for (const file of files) {
        const base64 = await fileToBase64(file);
        filePayloads.push({ mimeType: file.type, data: base64 });
      }
      let fullPrompt = mode === 'CREATE' ? PROMPTS.DPIA_GENERATOR : PROMPTS.DPIA_UPDATE;
      if (mode === 'CREATE') {
        if (textInput.trim()) fullPrompt += `\n\n### ZUSÄTZLICHER INHALT (COPY & PASTE):\n${textInput}`;
        if (context.trim()) fullPrompt += `\n\n### KONTEXT / NUTZUNGSSZENARIO:\n${context}`;
      } else {
        fullPrompt += `\n\nHINWEIS AN DIE KI: Die beigefügten Dateien enthalten die BESTEHENDE DSFA und NEUE DOKUMENTE.`;
        if (textInput.trim()) fullPrompt += `\n\n### BESCHREIBUNG DER ÄNDERUNGEN (DELTA):\n${textInput}`;
        if (context.trim()) fullPrompt += `\n\n### KONTEXT ZUR AKTUALISIERUNG:\n${context}`;
      }
      const response = await generateAnalysis({
        prompt: fullPrompt,
        contextData: contextData,
        additionalFiles: filePayloads,
        referenceUrls: state.referenceUrls,
        useSearch: state.useSearch,
        model: MODEL_PRO,
        thinkingLevel: "high",
        viewContext: 'DPIA'
      });
      setDpiaAnalysis(response.data, response.groundingMetadata);
      trackUsage(response.usage);
    } catch (error) {
      console.error(error);
      setDpiaAnalysis("Fehler bei der Generierung der DSFA.");
    } finally {
      setLoading(false);
      setThinking(false);
    }
  };

  const handleFinalizeReport = async () => {
    if (!result) return;
    setLoading(true);
    setThinking(true);
    try {
      let contextData = undefined;
      if (playbook) {
        const playbookBase64 = await fileToBase64(playbook);
        contextData = { mimeType: playbook.type, data: playbookBase64 };
      }
      const filePayloads: FileData[] = [];
      for (const file of files) {
        const base64 = await fileToBase64(file);
        filePayloads.push({ mimeType: file.type, data: base64 });
      }
      for (const file of refinementFiles) {
        const base64 = await fileToBase64(file);
        filePayloads.push({ mimeType: file.type, data: base64 });
      }
      const prompt = `${PROMPTS.DPIA_FINALIZE}
        ### VORHERIGE DELTA-ANALYSE (ZUR VERARBEITUNG):
        ${result}
        ### MANUELLE ANWEISUNGEN / REFINEMENTS VOM ANWALT:
        ${refinementText || "Keine weiteren Anmerkungen. Bitte konsolidieren."}
        `;
      const response = await generateAnalysis({
        prompt: prompt,
        contextData: contextData,
        additionalFiles: filePayloads,
        referenceUrls: state.referenceUrls,
        useSearch: state.useSearch,
        model: MODEL_PRO,
        thinkingLevel: "high",
        viewContext: 'DPIA'
      });
      setDpiaAnalysis(response.data, response.groundingMetadata);
      trackUsage(response.usage);
      setRefinementFiles([]);
      setRefinementText('');
    } catch (error) {
      alert("Fehler bei der Finalisierung.");
    } finally {
      setLoading(false);
      setThinking(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await copyRichText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col justify-center items-center gap-2 animate-enter">
      <Loader messages={
        mode === 'CREATE'
          ? ["Analysiere Verfahrensbeschreibung...", "Identifiziere Risiken für Betroffene...", "Bewerte TOMs...", "Erstelle Art. 35 Bericht (Entwurf)..."]
          : ["Konsolidiere Dokumente...", "Integriere manuelle Anpassungen...", "Übernehme Delta-Analysen...", "Schreibe finale DSFA (Entwurf)..."]
      } />
    </div>
  );

  if (result) {
    return (
      <div className="space-y-8 pb-32 animate-enter max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-firm-slate/15 pb-6 gap-4">
          <h2 className="text-2xl font-bold text-firm-navy font-serif tracking-tight">
            {mode === 'CREATE' ? 'Entwurf: DSFA (Art. 35)' : 'Ergebnis: DSFA Update'}
          </h2>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleCopy} className="!py-2.5 !px-4 text-xs shadow-sm bg-white border-firm-slate/15 hover:border-firm-slate/30">
              {copied ? <Check size={16} className="text-firm-accent" /> : <Copy size={16} />}
              {copied ? 'Kopiert' : 'Bericht kopieren (Word)'}
            </Button>
            <Button variant="secondary" onClick={() => { setDpiaAnalysis(null); }} className="!py-2.5 !px-4 text-xs bg-firm-paper border-firm-slate/10 hover:bg-white hover:text-firm-navy transition-colors">
              Neu Starten
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className={`border-l-2 rounded-r-xl p-4 flex items-start gap-3 shadow-sm ${mode === 'CREATE' ? 'bg-[#FCFAF4] border-amber-400/50 text-firm-navy' : 'bg-[#F4FCF7] border-emerald-500/50 text-firm-navy'}`}>
            <Info size={18} className={`shrink-0 mt-0.5 ${mode === 'CREATE' ? 'text-amber-500' : 'text-emerald-500'}`} />
            <p className="text-[13px] leading-relaxed opacity-90 max-w-4xl">
              <strong className="font-bold text-firm-navy">{mode === 'CREATE' ? "Standard-Modell (DSK): " : "Delta & Update: "}</strong>
              {mode === 'CREATE'
                ? "Dieser Entwurf orientiert sich am Kurzpapier Nr. 5 der Datenschutzkonferenz."
                : "Nutzen Sie den Bereich unten, um diesen Bericht zu verfeinern und das finale Dokument zu erstellen."}
            </p>
          </div>
        </div>
        <Card className="border border-firm-slate/10 shadow-firm bg-white rounded-3xl p-6 md:p-10 relative overflow-hidden">
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
        {mode === 'UPDATE' && (
          <div className="mt-12 animate-enter max-w-5xl mx-auto">
            <div className="bg-white border-0 shadow-firm-lg rounded-3xl p-8 relative overflow-hidden">
              <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-firm-navy via-neon-cyan to-firm-navy opacity-80 left-0" />
              <h3 className="text-2xl font-bold text-firm-navy font-serif mb-2 flex items-center gap-3">
                <div className="p-2 bg-firm-paper rounded-xl"><FileCheck size={24} className="text-neon-cyan" /></div>
                Dokument finalisieren (Merge)
              </h3>
              <p className="text-[15px] text-firm-navy font-medium mb-8 ml-[3.25rem] leading-relaxed max-w-2xl">
                Ergänzen Sie fehlende Nachweise (PDF) oder geben Sie Anweisungen (z.B. "Übernehme TOMs aus Delta"),
                um aus der Delta-Analyse ein <strong className="font-bold text-firm-navy">vollständiges, konsolidiertes Dokument</strong> zu generieren.
              </p>
              <div className="mb-6 ml-[3.25rem]">
                <label className="block text-[10px] font-bold text-firm-slate/50 uppercase tracking-widest mb-3">
                  Zusätzliche Nachweise (Optional, z.B. ISO-Zertifikat)
                </label>
                <div className="flex flex-wrap gap-3 mb-2">
                  {refinementFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-firm-paper border border-firm-slate/15 px-3 py-2 rounded-lg text-xs font-medium text-firm-navy shadow-sm">
                      <Paperclip size={14} className="text-firm-accent" />
                      <span className="truncate max-w-[200px]">{file.name}</span>
                      <button onClick={() => removeRefinementFile(idx)} className="text-firm-slate/40 hover:text-red-500 ml-1 transition-colors"><XCircle size={16} /></button>
                    </div>
                  ))}
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-dashed border-firm-slate/20 hover:border-firm-accent rounded-lg text-[13px] font-bold tracking-wider uppercase text-firm-slate/60 hover:text-firm-accent cursor-pointer transition-colors shadow-sm hover:shadow">
                    <PlusCircle size={16} /> Datei hinzufügen
                    <input type="file" className="hidden" accept=".pdf,.docx,.txt" multiple onChange={handleRefinementFileChange} />
                  </label>
                </div>
              </div>
              <div className="mb-6 ml-[3.25rem]">
                <label className="block text-[10px] font-bold text-firm-slate/50 uppercase tracking-widest mb-3">
                  Manuelle Anweisungen / Ergänzungen
                </label>
                <textarea
                  value={refinementText}
                  onChange={(e) => setRefinementText(e.target.value)}
                  placeholder='z.B.: "Das Risiko R1 wird durch die neue Verschlüsselung (siehe Delta) mitigiert. Bitte übernehme dies in den Hauptteil."'
                  className="w-full h-32 p-4 rounded-xl bg-firm-paper/50 border border-firm-slate/15 text-[14px] font-medium leading-relaxed text-firm-navy focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all resize-none"
                />
              </div>
              <div className="ml-[3.25rem]">
                <ContextPanel />
              </div>
              <div className="mt-8 ml-[3.25rem] relative z-10 w-full group">
                <div className="absolute inset-0 bg-firm-accent opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-2xl" />
                <Button onClick={handleFinalizeReport} fullWidth className="!py-4 text-base tracking-wide shadow-firm-lg relative">
                  <ArrowDown size={18} className="mr-2" />
                  Finale DSFA generieren (Merge)
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 animate-enter max-w-5xl mx-auto">
      <Card className="border-0 shadow-firm-lg rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-firm-navy via-firm-accent to-firm-navy opacity-80" />
        <div className="flex items-center gap-4 mb-10 mt-2">
          <div className={`p-3 rounded-2xl text-white shadow-sm ${mode === 'CREATE' ? 'bg-firm-navy' : 'bg-firm-accent'}`}>
            {mode === 'CREATE' ? <Fingerprint size={28} strokeWidth={1.5} /> : <ArrowLeftRight size={28} strokeWidth={1.5} />}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-firm-navy font-serif tracking-tight">
              {mode === 'CREATE' ? 'Quellmaterial für neue DSFA' : 'Bestands-DSFA & Änderungen'}
            </h3>
            <p className="text-[15px] text-firm-navy font-medium mt-1 leading-relaxed">
              {mode === 'CREATE'
                ? "Laden Sie AVV, AGB, Datenschutzerklärungen hoch."
                : "Laden Sie die alte DSFA (PDF) und neue Infos (Update-News, neue AGB) hoch."}
            </p>
          </div>
        </div>

        <div className="bg-firm-paper/50 p-1.5 rounded-xl flex gap-1.5 relative w-full mb-8 shadow-sm border border-firm-slate/10">
          <button
            onClick={() => setDpiaMode('CREATE')}
            className={`flex-1 py-3 rounded-lg text-[13px] uppercase tracking-wider font-bold transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'CREATE' ? 'bg-white text-firm-navy shadow-sm border border-firm-slate/5' : 'text-firm-slate/50 hover:text-firm-navy hover:bg-white/50'}`}
          >
            <PlusCircle size={16} />
            Neu erstellen
          </button>
          <button
            onClick={() => setDpiaMode('UPDATE')}
            className={`flex-1 py-3 rounded-lg text-[13px] uppercase tracking-wider font-bold transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'UPDATE' ? 'bg-white text-firm-accent shadow-sm border border-firm-slate/5' : 'text-firm-slate/50 hover:text-firm-accent hover:bg-white/50'}`}
          >
            <RefreshCw size={16} />
            Aktualisieren (Delta)
          </button>
        </div>

        <div className="bg-firm-paper/30 p-2 md:p-4 rounded-2xl border border-firm-slate/5 mb-8">
          <FileUploader
            label={mode === 'CREATE' ? 'Dokument hinzufügen' : 'Dokumente hinzufügen (Alt + Neu)'}
            multiple
            files={files}
            onFileChange={handleFileChange}
            onRemove={removeDpiaFile}
          />
        </div>

        <div className="mt-8 border-t border-firm-slate/10 pt-8">
          <div className="flex items-center gap-2 mb-3">
            <Type size={18} className="text-firm-accent" />
            <label className="block text-[10px] font-bold text-firm-navy uppercase tracking-widest">
              {mode === 'CREATE' ? 'Text-Inhalt (Technische Details)' : 'Beschreibung der Änderung / Feature-Update'}
            </label>
          </div>
          <textarea
            className="w-full h-48 p-5 rounded-xl bg-firm-paper/50 border border-firm-slate/15 resize-none focus:ring-2 focus:ring-firm-accent/30 focus:border-firm-accent text-[14px] font-medium leading-relaxed shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] outline-none"
            placeholder={mode === 'CREATE'
              ? `Hier Text einfügen, z.B.:\n"Wir nutzen AWS in Frankfurt..."`
              : `Beschreiben Sie das Update, z.B.:\n"Copilot zeichnet nun auch Meetings auf (Audio/Video). Die Speicherdauer beträgt 30 Tage. Neue AGB von Microsoft vom 01.03.2025..."`}
            value={textInput}
            onChange={(e) => setDpiaTextInput(e.target.value)}
          />
        </div>

        <div className="mt-8">
          <label className="block text-[10px] font-bold text-firm-slate/50 uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
            <span className="h-px bg-firm-slate/10 flex-1"></span>
            {mode === 'CREATE' ? 'Interner Nutzungskontext (Zweck)' : 'Kontext zur Aktualisierung (Optional)'}
            <span className="h-px bg-firm-slate/10 flex-1"></span>
          </label>
          <textarea
            className="w-full h-32 p-5 rounded-xl bg-firm-paper/50 border border-firm-slate/15 resize-none focus:ring-2 focus:ring-firm-accent/30 focus:border-firm-accent text-[14px] font-medium leading-relaxed text-firm-navy placeholder-firm-slate/40 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] outline-none"
            placeholder={mode === 'CREATE'
              ? "Beispiel: Wir nutzen dieses SaaS-Tool für das Bewerbermanagement..."
              : "Beispiel: Einführung in der Rechtsabteilung ab Q2 2025."}
            value={context}
            onChange={(e) => setDpiaContext(e.target.value)}
          />
        </div>

        <div className="bg-[#FCF5F5] border border-red-500/10 rounded-xl p-4 flex gap-3 text-sm text-red-800/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] mx-auto mt-8">
          <strong className="block font-bold">ACHTUNG:</strong>
          Keine Klarnamen oder personenbezogene Daten hochladen.
        </div>
      </Card>

      <div className="animate-enter">
        <ContextPanel />
      </div>

      <div className="mt-8 relative z-10 w-full group animate-enter">
        <div className="absolute inset-0 bg-firm-accent opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-2xl" />
        <Button fullWidth onClick={handleGenerate} disabled={files.length === 0 && !textInput.trim() && !context.trim()} className="!py-4 text-base tracking-wide shadow-firm-lg relative">
          {mode === 'CREATE' ? 'Folgenabschätzung generieren' : 'Update-Bericht generieren'}
        </Button>
      </div>

      {playbook && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-firm-navy font-medium animate-enter">
          <BookOpen size={14} />
          <span>Aktives Playbook: {playbook.name}</span>
        </div>
      )}
    </div>
  );
};

export default DpiaGenerator;
