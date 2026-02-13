
import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import ContextPanel from '../components/ui/ContextPanel'; 
import FileUploader from '../components/ui/FileUploader';
import GroundingSources from '../components/ui/GroundingSources'; 
import RefinementLoop from '../components/ui/RefinementLoop'; 
import { generateAnalysis, fileToBase64, FileData } from '../services/geminiService';
import { PROMPTS, MODEL_FLASH } from '../constants';
import { NdaTriageResponse } from '../types';
import { NdaTriageSchema } from '../schemas';
import { Check, AlertCircle, Clock, BookOpen, Copy, FileText, FileCheck } from 'lucide-react';
import { useTokenContext } from '../contexts/TokenContext';
import { useAppContext } from '../contexts/AppContext';
import { copyRichText } from '../utils/clipboardUtils';

const NdaTriage: React.FC = () => {
  const { state, setNdaText, setNdaFile, setNdaAnalysis, setThinking } = useAppContext();
  const { trackUsage } = useTokenContext();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const text = state.ndaTriage.text;
  const file = state.ndaTriage.file;
  const data = state.ndaTriage.analysis;
  const metadata = state.ndaTriage.groundingMetadata; 
  const playbook = state.playbookFile;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNdaFile(e.target.files[0]);
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
      setNdaAnalysis(response.data, response.groundingMetadata);
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
    const bgClass = isGreen ? 'bg-firm-accent' : isRed ? 'bg-red-700' : 'bg-yellow-600';

    return (
      <div className="space-y-8 animate-enter pb-32">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-firm-navy font-serif">Ersteinschätzung (NDA)</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCopyReport} className="!py-2 !px-3 text-xs">
                 {copied ? <Check size={16} /> : <Copy size={16} />}
                 {copied ? 'Kopiert' : 'Bericht kopieren'}
            </Button>
            <Button variant="secondary" onClick={() => { setNdaText(''); setNdaFile(null); setNdaAnalysis(null); }} className="!py-2 !px-3 text-xs">
                Neu
            </Button>
          </div>
        </div>

        {playbook && (
            <div className="bg-firm-navy/5 border border-firm-navy/10 rounded p-2 flex items-center gap-2 text-sm text-firm-navy">
                <BookOpen size={14} />
                <span>Playbook-Abgleich aktiv: <strong>{playbook.name}</strong></span>
            </div>
        )}

        <div className={`relative overflow-hidden rounded-lg p-8 text-white ${bgClass} shadow-firm`}>
           <div className="relative z-10">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-semibold text-white/90 uppercase tracking-widest">Handlungsempfehlung</h3>
             </div>
             <div className="text-4xl font-bold mb-4 tracking-tight font-serif">
               {data.verdict === 'GRÜN' ? 'FREIGABE' : data.verdict === 'ROT' ? 'STOPP' : 'MANUELLE PRÜFUNG'}
             </div>
             <p className="text-white/90 text-base max-w-lg font-medium leading-relaxed font-serif">
               {data.summary}
             </p>
           </div>
        </div>
        
        <GroundingSources metadata={metadata} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="md:col-span-2">
             <div className="flex items-center gap-2 mb-2 text-firm-navy font-semibold font-serif">
               <Clock size={16} />
               <h4>Fristen & Laufzeit</h4>
             </div>
             <p className="text-sm text-slate-600">{data.durationAnalysis}</p>
          </Card>

          {data.keyFindings.map((finding, idx) => (
            <Card key={idx}>
              <span className="text-xs text-slate-400 uppercase tracking-wide block mb-1">{finding.label}</span>
              <div className="flex items-center justify-between">
                <span className="font-medium text-firm-navy">{finding.value}</span>
                {finding.isRisk && <AlertCircle size={16} className="text-red-600" />}
              </div>
            </Card>
          ))}
        </div>

        <RefinementLoop onRefine={handleRefine} loading={loading} contextType="NDA-Prüfung" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32 animate-enter">
      <Card>
        <div className="flex items-center gap-3 mb-6">
           <div className="p-2 bg-firm-navy rounded-lg text-white">
             <FileCheck size={24} />
           </div>
           <div>
             <h3 className="text-xl font-bold text-gray-900 font-serif">NDA Vorprüfung</h3>
             <p className="text-sm text-slate-500">
                Prüfung auf Marktstandards & benachteiligende Klauseln.
             </p>
           </div>
        </div>

        <FileUploader 
            label="NDA hochladen"
            files={file}
            onFileChange={handleFileChange}
            onRemove={() => setNdaFile(null)}
        />

        <div className="mt-6">
            <label className="block text-xs font-bold text-firm-navy uppercase tracking-wider mb-2">
                Oder Text einfügen
            </label>
            <textarea
                className="w-full h-32 p-4 rounded-xl bg-slate-50 border border-slate-200 resize-none focus:ring-1 focus:ring-firm-navy focus:border-firm-navy text-sm text-slate-800 transition-shadow outline-none"
                placeholder="Fügen Sie hier den Text der Vereinbarung ein..."
                value={text}
                onChange={(e) => setNdaText(e.target.value)}
            />
        </div>
      </Card>

      <ContextPanel />

      <div className="mt-8">
        <Button fullWidth onClick={handleTriage} disabled={!text.trim() && !file}>
          Prüfung starten
        </Button>
      </div>
    </div>
  );
};

export default NdaTriage;
