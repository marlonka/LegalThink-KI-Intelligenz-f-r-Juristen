
import React, { useState, useEffect } from 'react';
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
import { Upload, FileText, XCircle, Info, Paperclip, FilePlus, Archive, Type, Edit3, Save, Copy, Download, RefreshCw, PlusCircle, ArrowDown, Check, MessageCircleQuestion, X, History } from 'lucide-react';
import { useTokenContext } from '../contexts/TokenContext';
import { useAppContext } from '../contexts/AppContext';
import { copyRichText } from '../utils/clipboardUtils';

const ChronologyBuilder: React.FC = () => {
  const { state, addChronologyFile, removeChronologyFile, setChronologyTextInput, setChronologyContext, setChronologyResult, setChronologyQuestions, setThinking } = useAppContext();
  const { trackUsage } = useTokenContext();
  const [loading, setLoading] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [refineFiles, setRefineFiles] = useState<File[]>([]);
  const [refineText, setRefineText] = useState('');

  const files = state.chronology.files;
  const textInput = state.chronology.textInput;
  const context = state.chronology.context;
  const result = state.chronology.result;
  const questions = state.chronology.questions;
  const metadata = state.chronology.groundingMetadata; 

  useEffect(() => {
    if (result) {
      setEditableText(result);
    }
  }, [result]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => addChronologyFile(file));
    }
  };

  const handleRefineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setRefineFiles(prev => [...prev, ...Array.from(e.target.files || [])]);
    }
  };
  const removeRefineFile = (idx: number) => {
    setRefineFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleGenerate = async () => {
    if (files.length === 0 && !textInput.trim()) return;
    setLoading(true);
    setThinking(true);
    setIsEditing(false);
    try {
      const filePayloads: FileData[] = [];
      for (const file of files) {
        const base64 = await fileToBase64(file);
        filePayloads.push({ mimeType: file.type, data: base64 });
      }
      let fullPrompt = PROMPTS.CHRONOLOGY_BUILDER;
      if (textInput.trim()) fullPrompt += `\n\n### ZUSÄTZLICHER TEXT-INHALT (E-MAILS/NOTIZEN):\n${textInput}`;
      if (context.trim()) fullPrompt += `\n\n### VERFAHRENSKONTEXT / FOKUS:\n${context}`;
      const response = await generateAnalysis({
        prompt: fullPrompt,
        additionalFiles: filePayloads,
        referenceUrls: state.referenceUrls,
        useSearch: state.useSearch,
        model: MODEL_PRO,
        thinkingLevel: "high",
        viewContext: 'CHRONOLOGY'
      });
      setChronologyResult(response.data, response.groundingMetadata);
      trackUsage(response.usage);
    } catch (error) {
      setChronologyResult("Fehler bei der Erstellung der Chronologie.", undefined);
    } finally {
      setLoading(false);
      setThinking(false);
    }
  };

  const handleUpdateChronology = async () => {
    if (refineFiles.length === 0 && !refineText.trim()) return;
    setLoading(true);
    setThinking(true);
    setIsRefining(false); 
    try {
      const filePayloads: FileData[] = [];
      for (const file of refineFiles) {
        const base64 = await fileToBase64(file);
        filePayloads.push({ mimeType: file.type, data: base64 });
      }
      const fullPrompt = `${PROMPTS.CHRONOLOGY_UPDATE}
      ### BESTEHENDE TABELLE (HIER EINFÜGEN/MERGEN):
      ${result}
      ### NEUE ZUSÄTZLICHE TEXT-INFOS:
      ${refineText}
      `;
      const response = await generateAnalysis({
        prompt: fullPrompt,
        additionalFiles: filePayloads, 
        referenceUrls: state.referenceUrls,
        useSearch: state.useSearch,
        model: MODEL_PRO,
        thinkingLevel: "high",
        viewContext: 'CHRONOLOGY'
      });
      setChronologyResult(response.data, response.groundingMetadata); 
      trackUsage(response.usage);
      setRefineFiles([]);
      setRefineText('');
    } catch (error) {
      alert("Fehler beim Aktualisieren der Chronologie.");
    } finally {
      setLoading(false);
      setThinking(false);
    }
  };

  const handleGenerateQuestions = async () => {
      if(!result) return;
      setQuestionLoading(true);
      setThinking(true);
      try {
        const response = await generateAnalysis({
            prompt: PROMPTS.CHRONOLOGY_QUESTIONS + `\n\nAKTUELLE CHRONOLOGIE:\n${result}`,
            model: MODEL_PRO,
            thinkingLevel: "medium",
            viewContext: 'CHRONOLOGY'
        });
        setChronologyQuestions(response.data as string);
        trackUsage(response.usage);
      } catch (e) {
        alert("Fragebogen konnte nicht generiert werden.");
      } finally {
        setQuestionLoading(false);
        setThinking(false);
      }
  };

  const toggleEditMode = () => {
    if (isEditing) {
        setChronologyResult(editableText, metadata || undefined); 
    }
    setIsEditing(!isEditing);
  };

  const handleCopy = async () => {
    const textToCopy = isEditing ? editableText : result;
    if (!textToCopy) return;
    await copyRichText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!result) return;
    const element = document.createElement("a");
    const file = new Blob([result], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `Sachverhalt_Chronologie_${new Date().toISOString().slice(0,10)}.md`;
    document.body.appendChild(element);
    element.click();
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col justify-center items-center gap-4 animate-enter">
        <Loader messages={[
            "Extrahiere Datumsangaben...", 
            "Sortiere Ereignisse chronologisch...", 
            state.useSearch ? "Grounding: Verifiziere Fakten via Google..." : "Identifiziere Lücken im Sachverhalt...",
            "Erstelle Zeitstrahl-Tabelle..."
        ]}/>
    </div>
  );

  if (result) {
    return (
      <div className="space-y-6 pb-48">
        <div className="sticky top-20 z-30 bg-[#f8fafc]/95 backdrop-blur-sm py-4 border-b border-slate-200 -mx-2 px-2 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-enter">
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-serif">Sachverhalts-Chronologie</h2>
            <p className="text-sm text-slate-500 font-mono">KI-Entwurf - Bearbeitbar</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
                onClick={toggleEditMode}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isEditing ? 'bg-firm-navy text-white shadow-firm' : 'bg-white text-firm-navy border border-slate-200 hover:bg-slate-50'}`}
            >
                {isEditing ? <Save size={16} /> : <Edit3 size={16} />}
                {isEditing ? 'Speichern' : 'Editor'}
            </button>
            <div className="h-6 w-px bg-slate-300 mx-1"></div>
            <button onClick={handleCopy} className="p-2 text-slate-500 hover:text-firm-navy hover:bg-slate-100 rounded-lg flex items-center gap-1" title="Kopieren (Word)">
                {copied ? <Check size={18} className="text-emerald-500"/> : <Copy size={18} />}
            </button>
            <button onClick={handleDownload} className="p-2 text-slate-500 hover:text-firm-navy hover:bg-slate-100 rounded-lg" title="Als Markdown herunterladen">
                <Download size={18} />
            </button>
            <button onClick={() => { setChronologyResult(null); setIsEditing(false); setChronologyQuestions(null); }} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Neu beginnen">
                <RefreshCw size={18} />
            </button>
          </div>
        </div>
        
        <Card className={`animate-enter stagger-2 ${isEditing ? 'ring-2 ring-firm-navy ring-offset-2' : ''}`}>
           {isEditing ? (
               <div className="animate-enter">
                   <div className="flex items-center gap-2 mb-2 text-xs font-bold text-firm-navy uppercase tracking-wider">
                       <Type size={14} />
                       <span>Raw Editor (Markdown)</span>
                   </div>
                   <textarea 
                        value={editableText}
                        onChange={(e) => setEditableText(e.target.value)}
                        className="w-full h-[60vh] p-4 font-mono text-sm leading-relaxed bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-firm-navy text-slate-800 resize-y"
                        spellCheck={false}
                   />
               </div>
           ) : (
               <div className="prose prose-sm max-w-none text-slate-700 overflow-x-auto">
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
           )}
           <GroundingSources metadata={metadata} />
        </Card>

        <div className="mt-8 border-t border-slate-200 pt-8 flex flex-col md:flex-row gap-6 animate-enter stagger-3">
            <div className="flex-1">
                {!isRefining ? (
                    <button 
                    onClick={() => setIsRefining(true)}
                    className="w-full py-6 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-firm-navy hover:text-firm-navy hover:bg-white transition-all group h-full"
                    >
                        <div className="bg-slate-100 p-3 rounded-full mb-2 group-hover:bg-firm-navy group-hover:text-white transition-colors">
                            <PlusCircle size={24} />
                        </div>
                        <span className="font-bold text-sm">Sachverhalt ergänzen</span>
                    </button>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-firm animate-enter relative">
                        <button onClick={() => setIsRefining(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={20} /></button>
                        <h3 className="text-sm font-bold text-firm-navy font-serif mb-4 flex items-center gap-2">
                            <FilePlus size={16} className="text-neon-cyan" />
                            Beweismittel nachreichen
                        </h3>
                        <div className="space-y-3 mb-4">
                            {refineFiles.map((file, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded text-xs">
                                    <span className="truncate max-w-[150px]">{file.name}</span>
                                    <button onClick={() => removeRefineFile(idx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={14}/></button>
                                </div>
                            ))}
                            <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-xs font-bold text-firm-navy cursor-pointer transition-colors">
                                <Upload size={14} /> Upload
                                <input type="file" className="hidden" accept=".pdf,.docx,.txt" multiple onChange={handleRefineFileChange} />
                            </label>
                        </div>
                        <div className="mb-4">
                            <textarea
                                className="w-full h-20 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:border-firm-navy outline-none"
                                placeholder="Vergessene E-Mail..."
                                value={refineText}
                                onChange={(e) => setRefineText(e.target.value)}
                            />
                        </div>
                        <Button onClick={handleUpdateChronology} disabled={refineFiles.length === 0 && !refineText.trim()} fullWidth className="text-xs py-2">
                            <RefreshCw size={14} /> Merge
                        </Button>
                    </div>
                )}
            </div>
            <div className="flex-1">
                {!questions ? (
                     <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 h-full flex flex-col items-center justify-center text-center">
                        <MessageCircleQuestion size={32} className="text-slate-300 mb-3" />
                        <h3 className="text-sm font-bold text-firm-navy mb-2">Lücken entdeckt?</h3>
                        <Button variant="secondary" onClick={handleGenerateQuestions} disabled={questionLoading}>
                             {questionLoading ? "Generiere..." : "Mandanten-Fragen generieren"}
                        </Button>
                     </div>
                ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-firm h-full animate-enter">
                         <h3 className="text-sm font-bold text-firm-navy font-serif mb-3 flex items-center gap-2">
                            <MessageCircleQuestion size={16} className="text-neon-lime" />
                            Fragen an den Mandanten
                        </h3>
                        <div className="prose prose-sm max-h-64 overflow-y-auto mb-4 text-xs">
                             <ReactMarkdown>{questions}</ReactMarkdown>
                        </div>
                        <Button variant="secondary" fullWidth onClick={() => copyRichText(questions)} className="text-xs py-2">
                             <Copy size={14} /> Kopieren
                        </Button>
                    </div>
                )}
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32 animate-enter">
      <Card>
        <div className="flex items-center gap-3 mb-6">
           <div className="p-2 bg-firm-navy rounded-lg text-white">
             <History size={24} />
           </div>
           <div>
             <h3 className="text-xl font-bold text-gray-900 font-serif">Sachverhalts-Architekt</h3>
             <p className="text-sm text-slate-500">
                Die KI erstellt aus Anlagen (PDF) und Textfragmenten (E-Mails) eine konsolidierte Zeittafel.
             </p>
           </div>
        </div>

        <FileUploader 
            label="Anlagen / PDF hinzufügen"
            multiple
            files={files}
            onFileChange={handleFileChange}
            onRemove={removeChronologyFile}
        />

        <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex items-center gap-2 mb-2">
                <Type size={16} className="text-slate-400" />
                <label className="block text-xs font-bold text-firm-navy uppercase tracking-wider">
                    E-Mail-Verläufe / Text-Ausschnitte
                </label>
            </div>
            <textarea
                className="w-full h-40 p-4 rounded-xl bg-gray-50 border border-slate-200 resize-none focus:ring-2 focus:ring-firm-navy/10 focus:border-firm-navy text-sm text-slate-800 placeholder-slate-400 transition-shadow outline-none font-mono leading-relaxed"
                placeholder={`Von: Mandant A\nAn: Gegner B\n...`}
                value={textInput}
                onChange={(e) => setChronologyTextInput(e.target.value)}
            />
        </div>

        <div className="mt-6">
            <label className="block text-xs font-bold text-firm-navy uppercase tracking-wider mb-2">
                Verfahrenskontext / Fokus der Untersuchung
            </label>
            <textarea
                className="w-full h-20 p-4 rounded-xl bg-white border border-slate-200 resize-none focus:ring-2 focus:ring-firm-navy/10 focus:border-firm-navy text-sm text-slate-800 placeholder-slate-400 transition-shadow outline-none"
                placeholder="Beispiel: Fokus auf den Zugang der Kündigung..."
                value={context}
                onChange={(e) => setChronologyContext(e.target.value)}
            />
        </div>

        <div className="mt-8 p-3 bg-red-50 border-l-4 border-red-500 rounded-r text-xs text-red-900 leading-relaxed">
            <strong>Berufsrechtlicher Hinweis:</strong> Keine Klarnamen verwenden. Anonymisierung ist Pflicht.
        </div>
      </Card>
      
      <div className="animate-enter">
        <ContextPanel />
      </div>
      
      <div className="mt-8 animate-enter">
        <Button fullWidth onClick={handleGenerate} disabled={files.length === 0 && !textInput.trim()}>
          Chronologie erstellen
        </Button>
      </div>
    </div>
  );
};

export default ChronologyBuilder;
