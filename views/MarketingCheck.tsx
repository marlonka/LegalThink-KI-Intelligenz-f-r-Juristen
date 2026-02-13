
import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import ContextPanel from '../components/ui/ContextPanel'; 
import FileUploader from '../components/ui/FileUploader';
import GroundingSources from '../components/ui/GroundingSources'; 
import RefinementLoop from '../components/ui/RefinementLoop'; 
import { generateAnalysis, fileToBase64, FileData } from '../services/geminiService';
import { PROMPTS, MODEL_PRO } from '../constants';
import { MarketingCheckResponse } from '../types';
import { MarketingCheckSchema } from '../schemas';
import { useTokenContext } from '../contexts/TokenContext';
import { useAppContext } from '../contexts/AppContext';
import { Megaphone, Search, AlertOctagon, Check, Copy, Image as ImageIcon, ShieldCheck, RefreshCw, BookOpen, AlertTriangle, Globe, Info } from 'lucide-react';
import { copyRichText } from '../utils/clipboardUtils';

const MarketingCheck: React.FC = () => {
  const { state, setMarketingFile, setMarketingText, setMarketingTargetAudience, setMarketingAnalysis, setThinking, toggleSearch } = useAppContext();
  const { trackUsage } = useTokenContext();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const file = state.marketing.file;
  const text = state.marketing.text;
  const audience = state.marketing.targetAudience;
  const data = state.marketing.analysis;
  const metadata = state.marketing.groundingMetadata; 
  const playbook = state.playbookFile;

  useEffect(() => {
    if (!state.useSearch) toggleSearch(true);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMarketingFile(e.target.files[0]);
    }
  };

  const runAnalysis = async (customPrompt?: string, additionalFiles?: File[]) => {
    if (!file && !text.trim() && !data) return;
    setLoading(true);
    setThinking(true);
    try {
      let mainFileData: FileData | undefined = undefined;
      if (file) {
        const b64 = await fileToBase64(file);
        mainFileData = { mimeType: file.type, data: b64 };
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
      let prompt = "";
      if (customPrompt && data) {
         prompt = `
            DU BIST IM "REFINEMENT MODE".
            VORHERIGES ERGEBNIS (JSON): ${JSON.stringify(data)}
            USER ANWEISUNG / FEEDBACK: "${customPrompt}"
            AUFGABE: Aktualisiere die wettbewerbsrechtliche Analyse.
         `;
      } else {
         prompt = PROMPTS.MARKETING_CHECK.replace('[[TARGET_AUDIENCE]]', audience || "Allgemeine Verkehrskreise (Verbraucher)");
         if (text.trim()) {
             prompt += `\n\nZU PRÜFENDE WERBEAUSSAGE:\n"${text}"`;
         }
      }
      const response = await generateAnalysis<MarketingCheckResponse>({
        prompt: prompt,
        fileData: mainFileData,
        contextData: contextData, 
        additionalFiles: filePayloads,
        referenceUrls: state.referenceUrls,
        useSearch: true,
        model: MODEL_PRO,
        responseSchema: MarketingCheckSchema,
        thinkingLevel: "high",
        viewContext: 'MARKETING_CHECK' 
      });
      setMarketingAnalysis(response.data, response.groundingMetadata);
      trackUsage(response.usage);
    } catch (error) {
      alert("Prüfung fehlgeschlagen.");
    } finally {
      setLoading(false);
      setThinking(false);
    }
  };

  const handleCheck = () => runAnalysis();
  const handleRefine = (instruction: string, files: File[]) => runAnalysis(instruction, files);

  const handleCopyReport = async () => {
    if (!data) return;
    const lines = [];
    lines.push(`# WETTBEWERBS-RADAR (UWG-AUDIT)`);
    lines.push(`**Risiko-Score:** ${data.abmahnRiskScore}/100`);
    lines.push(`**Management Summary:** ${data.summary}\n`);
    if (data.issues.length > 0) {
        lines.push(`## IDENTIFIZIERTE RISIKEN`);
        data.issues.forEach((issue) => {
            lines.push(`\n### ${issue.issueCategory} [${issue.riskLevel}]`);
            lines.push(`Aussage: "${issue.textSnippet}"`);
            lines.push(`Risiko: ${issue.legalExplanation}`);
            lines.push(`> **Rechtssicherer Vorschlag:** ${issue.safeAlternative}`);
        });
    }
    if (data.requiredDisclaimers.length > 0) {
        lines.push(`\n## FEHLENDE PFLICHTANGABEN (DISCLAIMER)`);
        data.requiredDisclaimers.forEach(d => lines.push(`- [ ] ${d}`));
    }
    await copyRichText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center animate-enter">
        <Loader messages={[
            "Grounding: Prüfe EU Health Claims Register...", 
            "Analysiere Greenwashing-Aussagen (BGH-Standard)...", 
            "Suche nach Irreführung (§ 5 UWG)...", 
            "Prüfe Preisangabenverordnung (PAngV)..."
        ]} />
      </div>
    );
  }

  if (data) {
    const isHighRisk = data.abmahnRiskScore > 60;
    const isMediumRisk = data.abmahnRiskScore > 20 && data.abmahnRiskScore <= 60;
    
    return (
      <div className="space-y-8 pb-32 animate-enter">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-firm-navy font-serif">Wettbewerbsrechtliche Risikoanalyse</h2>
            <p className="text-sm text-slate-500 font-mono">Zielgruppe: {audience || 'Verbraucher (Allgemein)'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCopyReport} className="!py-2 !px-3 text-xs">
                 {copied ? <Check size={16} /> : <Copy size={16} />}
                 {copied ? 'Kopiert' : 'Bericht kopieren'}
            </Button>
            <Button variant="secondary" onClick={() => { setMarketingText(''); setMarketingFile(null); setMarketingAnalysis(null); }} className="!py-2 !px-3 text-xs">
                Neu
            </Button>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-600 flex items-start gap-2">
           <AlertTriangle size={14} className="mt-0.5 text-amber-500 shrink-0"/>
           <p>
             <strong>Wichtiger Hinweis zur Datenbasis:</strong> Diese Analyse nutzt Google Search Grounding zur Verifizierung von Fakten (z.B. Health Claims). 
             Da kein direkter API-Zugriff auf das amtliche EU-Register besteht, stellt dies eine <strong>Plausibilitätsprüfung</strong> dar.
           </p>
        </div>

        <div className={`p-8 rounded-xl text-white shadow-firm relative overflow-hidden ${isHighRisk ? 'bg-red-700' : isMediumRisk ? 'bg-amber-600' : 'bg-emerald-700'}`}>
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h3 className="text-sm font-bold opacity-90 uppercase tracking-widest mb-1">Abmahn-Risiko (UWG)</h3>
                    <div className="text-5xl font-bold font-serif mb-2">{data.abmahnRiskScore}<span className="text-lg opacity-60">/100</span></div>
                    <p className="font-medium text-lg leading-snug max-w-lg">{data.summary}</p>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                    {isHighRisk ? <AlertOctagon size={48} /> : <ShieldCheck size={48} />}
                </div>
            </div>
        </div>

        <GroundingSources metadata={metadata} />

        <div className="space-y-6">
             {data.issues.length === 0 ? (
                 <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                     <Check size={32} className="mx-auto mb-2 text-emerald-500" />
                     <p>Keine offensichtlichen Wettbewerbsverstöße gefunden.</p>
                 </div>
             ) : (
                 data.issues.map((issue, idx) => (
                    <div key={idx} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-firm-navy text-sm">{issue.issueCategory}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${issue.riskLevel === 'HOCH' ? 'bg-red-50 text-red-600 border-red-100' : issue.riskLevel === 'MITTEL' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                RISIKO: {issue.riskLevel}
                            </span>
                        </div>
                        <div className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-red-400 mb-1">Rechtliche Beanstandung</p>
                                    <div className="bg-red-50/50 p-3 rounded border border-red-100 text-slate-700 text-sm italic mb-3">
                                        "{issue.textSnippet}"
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        <span className="font-bold text-slate-600">Juristische Begründung:</span> {issue.legalExplanation}
                                    </p>
                                </div>
                                <div className="border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                    <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">Rechtskonformer Alternativvorschlag</p>
                                    <div className="bg-emerald-50/50 p-3 rounded border border-emerald-100 text-firm-navy text-sm font-medium">
                                        "{issue.safeAlternative}"
                                    </div>
                                    <button 
                                        onClick={() => navigator.clipboard.writeText(issue.safeAlternative)}
                                        className="mt-2 text-[10px] text-emerald-600 font-bold hover:underline flex items-center gap-1"
                                    >
                                        <Copy size={10} /> Text kopieren
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                 ))
             )}
        </div>

        {data.requiredDisclaimers.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                <h4 className="text-sm font-bold text-firm-navy mb-3 uppercase tracking-wider">Fehlende Pflichtangaben (Disclaimer)</h4>
                <ul className="space-y-2">
                    {data.requiredDisclaimers.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                            <AlertOctagon size={16} className="text-amber-500 shrink-0 mt-0.5" />
                            <span>{req}</span>
                        </li>
                    ))}
                </ul>
            </div>
        )}

        <RefinementLoop onRefine={handleRefine} loading={loading} contextType="Wettbewerbs-Analyse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32 animate-enter">
      <Card>
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-firm-navy rounded-lg text-white">
                <Megaphone size={24} />
            </div>
            <div>
                <h3 className="text-xl font-bold text-gray-900 font-serif">Wettbewerbs-Radar (UWG)</h3>
                <p className="text-sm text-slate-500">
                    Prävention von Unterlassungsansprüchen: Prüfung auf Irreführung, Greenwashing & PAngV.
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                 <FileUploader 
                    label="Marketing-Material hochladen"
                    sublabel="Unterstützt: JPG, PNG, PDF"
                    accept=".jpg,.jpeg,.png,.pdf"
                    files={file}
                    onFileChange={handleFileChange}
                    onRemove={() => setMarketingFile(null)}
                    icon={ImageIcon}
                />
            </div>
            <div className="flex flex-col">
                <label className="block text-xs font-bold text-firm-navy uppercase tracking-wider mb-2">
                    Kontext / Branche
                </label>
                <div className="space-y-2 flex-1">
                    <input 
                        type="text" 
                        placeholder="z.B. Nahrungsergänzungsmittel, Mode, Finanzen..."
                        className="w-full p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm focus:border-firm-navy focus:ring-1 focus:ring-firm-navy/10"
                        value={audience}
                        onChange={(e) => setMarketingTargetAudience(e.target.value)}
                    />
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 leading-relaxed">
                        <strong className="block mb-1 text-firm-navy">Relevanz:</strong>
                        Bei "Health" (HCVO) oder "Finance" gelten strengste Maßstäbe.
                    </div>
                </div>
            </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
            <label className="block text-xs font-bold text-firm-navy uppercase tracking-wider mb-2">
                Oder Werbeaussage direkt eingeben
            </label>
            <textarea
                className="w-full h-32 p-4 rounded-xl bg-gray-50 border border-slate-200 resize-none focus:ring-2 focus:ring-firm-navy/10 focus:border-firm-navy text-sm text-slate-800 transition-shadow outline-none"
                placeholder="Beispiel: 'Unser neues Super-Serum heilt alle Hautprobleme und ist 100% klimaneutral produziert...'"
                value={text}
                onChange={(e) => setMarketingText(e.target.value)}
            />
        </div>

      </Card>
      
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3 text-xs text-amber-900 shadow-sm">
          <Globe className="shrink-0 mt-0.5 text-amber-600" size={18} />
          <div>
              <strong className="block text-amber-800 font-bold mb-1">Erforderliche Datengrundlage (Sorgfaltspflicht):</strong>
              <p className="leading-relaxed">
                  Für die Prüfung von Faktenbehauptungen ist der Zugriff auf externe Echtzeit-Daten zwingend. 
                  <strong>Google Search Grounding</strong> wurde für diesen Vorgang automatisch aktiviert.
              </p>
          </div>
      </div>

      <ContextPanel />

      <div className="mt-8">
        <Button fullWidth onClick={handleCheck} disabled={!file && !text.trim()}>
          Auf Abmahnrisiken prüfen
        </Button>
      </div>

      {playbook && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-firm-navy/70">
            <BookOpen size={14} />
            <span>Abgleich mit Corporate Wording: {playbook.name}</span>
        </div>
      )}
    </div>
  );
};

export default MarketingCheck;
