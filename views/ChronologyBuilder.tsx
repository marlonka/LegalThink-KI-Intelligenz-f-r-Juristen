
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
    if (!result) return;
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
    const file = new Blob([result], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `Sachverhalt_Chronologie_${new Date().toISOString().slice(0, 10)}.md`;
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
      ]} />
    </div>
  );

  if (result) {
    return (
      <div className="space-y-8 pb-48">
        <div className="sticky top-20 z-30 bg-[#f8fafc]/95 backdrop-blur-md py-5 border-b border-firm-slate/15 -mx-2 px-2 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-enter">
          <div>
            <h2 className="text-2xl font-bold text-firm-navy font-serif tracking-tight">Sachverhalts-Chronologie</h2>
            <p className="text-xs text-firm-slate/60 font-mono tracking-wider font-medium mt-1">KI-Entwurf - Bearbeitbar</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleEditMode}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm ${isEditing ? 'bg-firm-navy text-white shadow-firm' : 'bg-white text-firm-navy border border-firm-slate/15 hover:border-firm-slate/30 hover:bg-firm-paper/30'}`}
            >
              {isEditing ? <Save size={16} /> : <Edit3 size={16} />}
              {isEditing ? 'Speichern' : 'Editor'}
            </button>
            <div className="h-6 w-px bg-firm-slate/10 mx-1"></div>
            <button onClick={handleCopy} className="p-2.5 text-firm-slate/50 hover:text-firm-navy hover:bg-firm-paper rounded-xl transition-colors" title="Kopieren (Word)">
              {copied ? <Check size={18} className="text-firm-accent" /> : <Copy size={18} />}
            </button>
            <button onClick={handleDownload} className="p-2.5 text-firm-slate/50 hover:text-firm-navy hover:bg-firm-paper rounded-xl transition-colors" title="Als Markdown herunterladen">
              <Download size={18} />
            </button>
            <button onClick={() => { setChronologyResult(null); setIsEditing(false); setChronologyQuestions(null); }} className="p-2.5 text-firm-slate/50 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Neu beginnen">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        <Card className={`border border-firm-slate/10 shadow-firm bg-white rounded-3xl p-6 md:p-10 relative overflow-hidden animate-enter stagger-2 ${isEditing ? 'ring-2 ring-firm-navy/20' : ''}`}>
          {isEditing ? (
            <div className="animate-enter relative z-10">
              <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-firm-navy uppercase tracking-widest pl-1">
                <Type size={14} className="text-firm-accent" />
                <span>Raw Editor (Markdown)</span>
              </div>
              <textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                className="w-full h-[60vh] p-6 font-mono text-[13px] leading-relaxed bg-[#f8fafc] border border-firm-slate/15 rounded-2xl focus:outline-none focus:ring-2 focus:ring-firm-accent/30 focus:border-firm-accent text-firm-navy resize-y shadow-inner transition-all"
                spellCheck={false}
              />
            </div>
          ) : (
            <div className="prose prose-sm md:prose-base max-w-none text-firm-navy/80 prose-headings:font-serif prose-headings:text-firm-navy relative z-10 overflow-x-auto">
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
          )}
          <GroundingSources metadata={metadata} />
        </Card>

        <div className="mt-8 pt-8 flex flex-col md:flex-row gap-8 animate-enter stagger-3">
          <div className="flex-1">
            {!isRefining ? (
              <button
                onClick={() => setIsRefining(true)}
                className="w-full py-10 border-2 border-dashed border-firm-slate/15 rounded-3xl flex flex-col items-center justify-center text-firm-slate/50 hover:border-firm-accent hover:text-firm-accent hover:bg-firm-paper/30 transition-all group h-full"
              >
                <div className="bg-firm-paper p-4 rounded-full mb-3 group-hover:bg-firm-accent group-hover:text-white transition-colors duration-300 shadow-sm group-hover:shadow">
                  <PlusCircle size={28} strokeWidth={1.5} />
                </div>
                <span className="font-bold text-[13px] uppercase tracking-wider">Sachverhalt ergänzen</span>
              </button>
            ) : (
              <div className="bg-white border-0 rounded-3xl p-6 md:p-8 shadow-firm animate-enter relative">
                <button onClick={() => setIsRefining(false)} className="absolute top-6 right-6 text-firm-slate/40 hover:text-firm-slate/80 transition-colors"><X size={20} /></button>
                <h3 className="text-xl font-bold text-firm-navy font-serif mb-6 flex items-center gap-3">
                  <div className="p-1.5 bg-firm-paper rounded-lg"><FilePlus size={18} className="text-neon-cyan" /></div>
                  Beweismittel nachreichen
                </h3>
                <div className="space-y-4 mb-6">
                  {refineFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-firm-paper/50 border border-firm-slate/10 rounded-xl text-[13px] font-medium text-firm-navy">
                      <span className="truncate max-w-[200px]">{file.name}</span>
                      <button onClick={() => removeRefineFile(idx)} className="text-firm-slate/40 hover:text-red-500 transition-colors"><XCircle size={16} /></button>
                    </div>
                  ))}
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-dashed border-firm-slate/20 hover:border-firm-accent rounded-xl text-[13px] font-bold text-firm-slate/60 hover:text-firm-accent cursor-pointer transition-colors w-full justify-center shadow-sm">
                    <Upload size={16} /> Zusatzdokument hochladen
                    <input type="file" className="hidden" accept=".pdf,.docx,.txt" multiple onChange={handleRefineFileChange} />
                  </label>
                </div>
                <div className="mb-6">
                  <textarea
                    className="w-full h-24 p-4 rounded-xl bg-firm-paper/50 border border-firm-slate/15 text-[14px] font-serif leading-relaxed text-firm-navy focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 outline-none resize-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all"
                    placeholder='z.B.: "Zusätzliche Notiz am 12.04. bezüglich des Telefonats mit Herrn Schmidt..."'
                    value={refineText}
                    onChange={(e) => setRefineText(e.target.value)}
                  />
                </div>
                <Button onClick={handleUpdateChronology} disabled={refineFiles.length === 0 && !refineText.trim()} fullWidth className="!py-3 shadow-sm">
                  <RefreshCw size={16} className="mr-2" /> Sachverhalt Mergen
                </Button>
              </div>
            )}
          </div>
          <div className="flex-1">
            {!questions ? (
              <div className="bg-white border border-firm-slate/10 shadow-sm rounded-3xl p-8 h-full flex flex-col items-center justify-center text-center group cursor-pointer hover:shadow-firm hover:border-firm-slate/20 transition-all duration-300" onClick={handleGenerateQuestions}>
                <div className="bg-firm-paper p-4 rounded-full mb-4 text-neon-lime group-hover:scale-110 transition-transform duration-300">
                  <MessageCircleQuestion size={32} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-bold text-firm-navy font-serif mb-2">Lücken entdeckt?</h3>
                <p className="text-[13px] text-firm-slate/60 mb-6 max-w-xs">Lassen Sie die KI automatisiert Fragen an den Mandanten generieren, um offene Punkte zu klären.</p>
                <Button variant="secondary" onClick={handleGenerateQuestions} disabled={questionLoading} className="shadow-sm border-firm-slate/15 bg-white hover:border-firm-slate/30">
                  {questionLoading ? "Generiere..." : "Mandanten-Fragen generieren"}
                </Button>
              </div>
            ) : (
              <div className="bg-white border-0 shadow-firm rounded-3xl p-6 md:p-8 h-full animate-enter flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-neon-lime/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                <h3 className="text-xl font-bold text-firm-navy font-serif mb-4 flex items-center gap-3 relative z-10">
                  <div className="p-1.5 bg-firm-paper rounded-lg"><MessageCircleQuestion size={18} className="text-neon-lime" /></div>
                  Fragen an den Mandanten
                </h3>
                <div className="prose prose-sm md:prose-base text-firm-navy/80 flex-1 overflow-y-auto mb-6 pr-2 relative z-10 font-serif">
                  <ReactMarkdown>{questions}</ReactMarkdown>
                </div>
                <Button variant="secondary" fullWidth onClick={() => copyRichText(questions)} className="!py-3 shadow-sm bg-white border-firm-slate/15 hover:border-firm-slate/30 mt-auto relative z-10">
                  <Copy size={16} className="mr-2" /> Direkt kopieren
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 animate-enter max-w-4xl mx-auto">
      <Card className="border-0 shadow-firm-lg rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-firm-navy via-firm-accent to-firm-navy opacity-80" />
        <div className="flex items-center gap-4 mb-10 mt-2">
          <div className="p-3 bg-firm-paper border border-firm-slate/10 rounded-2xl text-firm-navy shadow-sm">
            <History size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-firm-navy font-serif tracking-tight">Sachverhalts-Architekt</h3>
            <p className="text-[15px] text-firm-slate/80 mt-1">
              Die KI erstellt aus Anlagen (PDF) und Textfragmenten (E-Mails) eine konsolidierte Zeittafel.
            </p>
          </div>
        </div>

        <div className="bg-firm-paper/30 p-2 md:p-4 rounded-2xl border border-firm-slate/5 mb-8">
          <FileUploader
            label="Anlagen / PDF hinzufügen"
            multiple
            files={files}
            onFileChange={handleFileChange}
            onRemove={removeChronologyFile}
          />
        </div>

        <div className="mt-8 border-t border-firm-slate/10 pt-8">
          <div className="flex items-center gap-2 mb-3">
            <Type size={18} className="text-firm-accent" />
            <label className="block text-[10px] font-bold text-firm-navy uppercase tracking-widest">
              E-Mail-Verläufe / Text-Ausschnitte
            </label>
          </div>
          <textarea
            className="w-full h-48 p-5 rounded-xl bg-firm-paper/50 border border-firm-slate/15 resize-none focus:ring-2 focus:ring-firm-accent/30 focus:border-firm-accent text-[15px] font-serif leading-relaxed text-firm-navy placeholder-firm-slate/40 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] outline-none"
            placeholder={`Von: Mandant A\nAn: Gegner B\n...`}
            value={textInput}
            onChange={(e) => setChronologyTextInput(e.target.value)}
          />
        </div>

        <div className="mt-8">
          <label className="block text-[10px] font-bold text-firm-slate/50 uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
            <span className="h-px bg-firm-slate/10 flex-1"></span>
            Verfahrenskontext / Fokus der Untersuchung
            <span className="h-px bg-firm-slate/10 flex-1"></span>
          </label>
          <textarea
            className="w-full h-32 p-5 rounded-xl bg-firm-paper/50 border border-firm-slate/15 resize-none focus:ring-2 focus:ring-firm-accent/30 focus:border-firm-accent text-[15px] font-serif leading-relaxed text-firm-navy placeholder-firm-slate/40 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] outline-none"
            placeholder="Beispiel: Fokus auf den Zugang der Kündigung..."
            value={context}
            onChange={(e) => setChronologyContext(e.target.value)}
          />
        </div>

        <div className="bg-[#FCF5F5] border border-red-500/10 rounded-xl p-4 flex gap-3 text-sm text-red-800/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] mx-auto mt-8">
          <strong className="block font-bold">Berufsrechtlicher Hinweis:</strong> Keine Klarnamen verwenden. Anonymisierung ist Pflicht.
        </div>
      </Card>

      <div className="animate-enter">
        <ContextPanel />
      </div>

      <div className="mt-8 relative z-10 w-full group animate-enter">
        <div className="absolute inset-0 bg-firm-accent opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-2xl" />
        <Button fullWidth onClick={handleGenerate} disabled={files.length === 0 && !textInput.trim()} className="!py-4 text-base tracking-wide shadow-firm-lg relative">
          Chronologie erstellen
        </Button>
      </div>
    </div>
  );
};

export default ChronologyBuilder;
