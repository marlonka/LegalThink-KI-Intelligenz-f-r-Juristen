
import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import ContextPanel from '../components/ui/ContextPanel'; 
import FileUploader from '../components/ui/FileUploader';
import GroundingSources from '../components/ui/GroundingSources'; 
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
      <div className="space-y-6 pb-32 animate-enter">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 font-serif">
            {mode === 'CREATE' ? 'Entwurf: DSFA (Art. 35)' : 'Ergebnis: DSFA Update'}
          </h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCopy} className="!py-2 !px-3 text-xs">
                 {copied ? <Check size={16} /> : <Copy size={16} />}
                 {copied ? 'Kopiert' : 'Bericht kopieren (Word)'}
            </Button>
            <Button variant="secondary" onClick={() => { setDpiaAnalysis(null); }} className="!py-2 !px-3 text-xs">
                Neu
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
            <div className={`border rounded p-3 flex items-start gap-3 text-xs ${mode === 'CREATE' ? 'bg-blue-50 border-blue-200 text-blue-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                <Info size={16} className="shrink-0 mt-0.5" />
                <p>
                    {mode === 'CREATE' 
                     ? "Standard-Modell (DSK): Dieser Entwurf orientiert sich am Kurzpapier Nr. 5 der Datenschutzkonferenz."
                     : "Delta & Update: Nutzen Sie den Bereich unten, um diesen Bericht zu verfeinern und das finale Dokument zu erstellen."}
                </p>
            </div>
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
                 td: ({node, children, ...props}) => {
                    // Utility to handle <br> tags within markdown cells safely
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
                      <td className="p-3 text-sm text-slate-600 border-b border-slate-100 whitespace-pre-wrap" {...props}>
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
            <div className="mt-8 border-t border-slate-200 pt-8 animate-enter">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-firm">
                    <h3 className="text-lg font-bold text-firm-navy font-serif mb-2 flex items-center gap-2">
                        <FileCheck size={20} className="text-neon-cyan" />
                        Dokument finalisieren (Merge)
                    </h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Ergänzen Sie fehlende Nachweise (PDF) oder geben Sie Anweisungen (z.B. "Übernehme TOMs aus Delta"), 
                        um aus der Delta-Analyse ein <strong>vollständiges, konsolidiertes Dokument</strong> zu generieren.
                    </p>
                    <div className="mb-4">
                        <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
                            Zusätzliche Nachweise (Optional, z.B. ISO-Zertifikat)
                        </label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {refinementFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded text-xs">
                                    <Paperclip size={12} className="text-slate-400"/>
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                    <button onClick={() => removeRefinementFile(idx)} className="text-red-500 hover:text-red-700 ml-1"><XCircle size={14}/></button>
                                </div>
                            ))}
                            <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-dashed border-slate-300 hover:border-firm-navy rounded text-xs font-medium text-slate-500 hover:text-firm-navy cursor-pointer transition-colors">
                                <PlusCircle size={14} /> Datei hinzufügen
                                <input type="file" className="hidden" accept=".pdf,.docx,.txt" multiple onChange={handleRefinementFileChange} />
                            </label>
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
                            Manuelle Anweisungen / Ergänzungen
                        </label>
                        <textarea 
                            value={refinementText}
                            onChange={(e) => setRefinementText(e.target.value)}
                            placeholder='z.B.: "Das Risiko R1 wird durch die neue Verschlüsselung (siehe Delta) mitigiert. Bitte übernehme dies in den Hauptteil."'
                            className="w-full h-24 p-3 rounded-lg bg-white border border-slate-200 text-sm focus:border-firm-navy focus:ring-1 focus:ring-firm-navy/10 outline-none"
                        />
                    </div>
                    <ContextPanel />
                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleFinalizeReport} fullWidth>
                            <ArrowDown size={18} />
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
    <div className="space-y-6 pb-32 animate-enter">
      <Card>
        <div className="flex items-center gap-3 mb-6">
           <div className={`p-2 rounded-lg text-white ${mode === 'CREATE' ? 'bg-firm-navy' : 'bg-firm-accent'}`}>
             {mode === 'CREATE' ? <Fingerprint size={24} /> : <ArrowLeftRight size={24} />}
           </div>
           <div>
             <h3 className="text-xl font-bold text-gray-900 font-serif">
                {mode === 'CREATE' ? 'Quellmaterial für neue DSFA' : 'Bestands-DSFA & Änderungen'}
             </h3>
             <p className="text-sm text-slate-500">
                {mode === 'CREATE' 
                 ? "Laden Sie AVV, AGB, Datenschutzerklärungen hoch."
                 : "Laden Sie die alte DSFA (PDF) und neue Infos (Update-News, neue AGB) hoch."}
             </p>
           </div>
        </div>

        <div className="bg-slate-100 p-1 rounded-lg flex gap-1 relative w-full mb-6">
          <button 
            onClick={() => setDpiaMode('CREATE')}
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'CREATE' ? 'bg-white text-firm-navy shadow-sm' : 'text-slate-500 hover:text-firm-navy'}`}
          >
            <PlusCircle size={14} />
            Neu erstellen
          </button>
          <button 
            onClick={() => setDpiaMode('UPDATE')}
            className={`flex-1 py-2 rounded-md text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'UPDATE' ? 'bg-white text-firm-accent shadow-sm' : 'text-slate-500 hover:text-firm-accent'}`}
          >
            <RefreshCw size={14} />
            Aktualisieren (Delta)
          </button>
        </div>

        <FileUploader 
            label={mode === 'CREATE' ? 'Dokument hinzufügen' : 'Dokumente hinzufügen (Alt + Neu)'}
            multiple
            files={files}
            onFileChange={handleFileChange}
            onRemove={removeDpiaFile}
        />

        <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2 mb-2">
                <Type size={16} className="text-slate-400" />
                <label className="block text-xs font-bold text-firm-navy uppercase tracking-wider">
                    {mode === 'CREATE' ? 'Text-Inhalt (Technische Details)' : 'Beschreibung der Änderung / Feature-Update'}
                </label>
            </div>
            <textarea
                className="w-full h-40 p-4 rounded-xl bg-gray-50 border border-slate-200 resize-none focus:ring-2 focus:ring-firm-navy/10 focus:border-firm-navy text-sm text-slate-800 placeholder-slate-400 transition-shadow outline-none font-mono leading-relaxed"
                placeholder={mode === 'CREATE' 
                    ? `Hier Text einfügen, z.B.:\n"Wir nutzen AWS in Frankfurt..."` 
                    : `Beschreiben Sie das Update, z.B.:\n"Copilot zeichnet nun auch Meetings auf (Audio/Video). Die Speicherdauer beträgt 30 Tage. Neue AGB von Microsoft vom 01.03.2025..."`}
                value={textInput}
                onChange={(e) => setDpiaTextInput(e.target.value)}
            />
        </div>

        <div className="mt-6">
            <label className="block text-xs font-bold text-firm-navy uppercase tracking-wider mb-2">
                {mode === 'CREATE' ? 'Interner Nutzungskontext (Zweck)' : 'Kontext zur Aktualisierung (Optional)'}
            </label>
            <textarea
                className="w-full h-24 p-4 rounded-xl bg-white border border-slate-200 resize-none focus:ring-2 focus:ring-firm-navy/10 focus:border-firm-navy text-sm text-slate-800 placeholder-slate-400 transition-shadow outline-none"
                placeholder={mode === 'CREATE' 
                    ? "Beispiel: Wir nutzen dieses SaaS-Tool für das Bewerbermanagement..."
                    : "Beispiel: Einführung in der Rechtsabteilung ab Q2 2025."}
                value={context}
                onChange={(e) => setDpiaContext(e.target.value)}
            />
        </div>

        <p className="text-xs text-center text-red-500 mt-6 max-w-md mx-auto">
            <strong>ACHTUNG:</strong> Keine Klarnamen oder personenbezogene Daten hochladen.
        </p>
      </Card>
      
      <div className="animate-enter">
         <ContextPanel />
      </div>

      <div className="mt-8 animate-enter">
        <Button fullWidth onClick={handleGenerate} disabled={files.length === 0 && !textInput.trim() && !context.trim()}>
          {mode === 'CREATE' ? 'Folgenabschätzung generieren' : 'Update-Bericht generieren'}
        </Button>
      </div>

      {playbook && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-firm-navy/70 animate-enter">
            <BookOpen size={14} />
            <span>Aktives Playbook: {playbook.name}</span>
        </div>
      )}
    </div>
  );
};

export default DpiaGenerator;
