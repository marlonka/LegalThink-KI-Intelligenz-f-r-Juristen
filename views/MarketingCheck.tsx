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
import { PROMPTS, MODEL_PRO } from '../constants';
import { MarketingCheckResponse } from '../types';
import { MarketingCheckSchema } from '../schemas';
import { useTokenContext } from '../contexts/TokenContext';
import { useAppContext } from '../contexts/AppContext';
import { Megaphone, Search, AlertOctagon, Check, Copy, Image as ImageIcon, ShieldCheck, RefreshCw, BookOpen, AlertTriangle, Globe, Info } from 'lucide-react';
import { copyRichText } from '../utils/clipboardUtils';
import { fetchDemoFile } from '../utils/demoUtils';

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
      <div className="space-y-8 pb-32 animate-enter max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-firm-slate/15 pb-6 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-firm-navy font-serif tracking-tight">Wettbewerbsrechtliche Risikoanalyse</h2>
            <p className="text-xs text-firm-slate/60 font-mono tracking-wider font-medium mt-1">Zielgruppe: {audience || 'Verbraucher (Allgemein)'}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleCopyReport} className="!py-2.5 !px-4 text-xs shadow-sm bg-firm-card border-firm-slate/15 hover:border-firm-slate/30">
              {copied ? <Check size={16} className="text-firm-accent" /> : <Copy size={16} />}
              {copied ? 'Kopiert' : 'Bericht kopieren'}
            </Button>
            <Button variant="secondary" onClick={() => { setMarketingText(''); setMarketingFile(null); setMarketingAnalysis(null); }} className="!py-2.5 !px-4 text-xs bg-firm-paper border-firm-slate/10 hover:bg-firm-accent/10 hover:border-firm-accent/30 hover:text-firm-accent transition-colors">
              Neu Starten
            </Button>
          </div>
        </div>

        <div className="bg-firm-paper/50 border border-firm-slate/15 rounded-xl p-4 text-[13px] text-firm-navy flex items-start gap-3 shadow-sm">
          <AlertTriangle size={18} className="mt-0.5 text-firm-accent shrink-0" />
          <p className="leading-relaxed">
            <strong className="font-bold text-firm-navy">Wichtiger Hinweis zur Datenbasis:</strong> Diese Analyse nutzt Google Search Grounding zur Verifizierung von Fakten (z.B. Health Claims).
            Da kein direkter API-Zugriff auf das amtliche EU-Register besteht, stellt dies eine <strong className="font-bold text-firm-navy">Plausibilitätsprüfung</strong> dar.
          </p>
        </div>

        <div className={`p-8 md:p-10 rounded-3xl text-white shadow-firm-lg relative overflow-hidden group ${isHighRisk ? 'bg-red-700' : isMediumRisk ? 'bg-amber-600' : 'bg-emerald-600'}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-firm-card/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-[10px] font-bold opacity-80 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-firm-card"></span> Abmahn-Risiko (UWG)
              </h3>
              <div className="text-5xl md:text-6xl font-bold font-serif mb-4 flex items-baseline gap-1">
                {data.abmahnRiskScore}
                <span className="text-2xl opacity-60 font-sans tracking-wide">/100</span>
              </div>
              <p className="font-serif text-[15px] leading-relaxed max-w-xl opacity-90">{data.summary}</p>
            </div>
            <div className="bg-firm-card/10 border border-firm-card/20 p-5 rounded-full backdrop-blur-sm self-start md:self-auto">
              {isHighRisk ? <AlertOctagon size={48} /> : <ShieldCheck size={48} />}
            </div>
          </div>
        </div>

        <GroundingSources metadata={metadata} />

        <div className="space-y-6 pt-4">
          {data.issues.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-firm-slate/15 rounded-3xl text-firm-slate/40 bg-firm-paper/30">
              <Check size={40} className="mx-auto mb-4 text-emerald-500/50" />
              <p className="font-medium text-sm">Keine offensichtlichen Wettbewerbsverstöße gefunden.</p>
            </div>
          ) : (
            data.issues.map((issue, idx) => (
              <div key={idx} className="bg-firm-card rounded-2xl border border-firm-slate/15 shadow-sm overflow-hidden hover:shadow-firm transition-shadow duration-300">
                <div className="px-6 py-4 border-b border-firm-slate/10 flex items-center justify-between bg-firm-paper/30">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-firm-navy text-[16px]">{issue.issueCategory}</span>
                  </div>
                  <span className={`text-[9px] uppercase font-bold px-2.5 py-1 rounded-full border tracking-wider shadow-sm ${issue.riskLevel === 'HOCH' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-200 border-red-500/20' : issue.riskLevel === 'MITTEL' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-200 border-amber-400/30' : 'bg-firm-paper text-firm-navy font-medium border-firm-slate/10'}`}>
                    RISIKO: {issue.riskLevel}
                  </span>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-red-500/70 mb-2 tracking-widest flex items-center gap-1.5"><AlertOctagon size={12} /> Rechtliche Beanstandung</p>
                      <div className="bg-[#FCF5F5] dark:bg-red-500/10 p-4 rounded-xl border border-red-500/10 text-firm-navy dark:text-red-100 text-[14px] font-medium italic mb-4">
                        "{issue.textSnippet}"
                      </div>
                      <p className="text-[13px] text-firm-navy font-medium leading-relaxed">
                        <span className="font-bold text-firm-navy block mb-1">Juristische Begründung:</span> {issue.legalExplanation}
                      </p>
                    </div>
                    <div className="border-t md:border-t-0 md:border-l border-firm-slate/10 pt-6 md:pt-0 md:pl-8">
                      <p className="text-[10px] uppercase font-bold text-emerald-600/70 mb-2 tracking-widest flex items-center gap-1.5"><Check size={12} /> Rechtskonformer Alternativvorschlag</p>
                      <div className="bg-[#F4FCF7] dark:bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 text-firm-navy dark:text-emerald-100 text-[14px] font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                        "{issue.safeAlternative}"
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(issue.safeAlternative)}
                        className="mt-3 text-[11px] text-emerald-600 font-bold hover:text-emerald-700 transition-colors flex items-center gap-1.5 uppercase tracking-wider bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full w-fit hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                      >
                        <Copy size={12} /> Text kopieren
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {data.requiredDisclaimers.length > 0 && (
          <div className="bg-firm-paper/50 border border-firm-slate/15 rounded-2xl p-6 md:p-8 shadow-sm">
            <h4 className="text-[11px] font-bold text-firm-navy mb-4 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle size={14} className="text-firm-accent" />
              Fehlende Pflichtangaben (Disclaimer)
            </h4>
            <ul className="space-y-3 pl-1">
              {data.requiredDisclaimers.map((req, idx) => (
                <li key={idx} className="flex items-start gap-3 text-[14px] text-firm-navy font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>
                  <span className="leading-relaxed">{req}</span>
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
    <div className="space-y-8 pb-32 animate-enter max-w-5xl mx-auto">
      <Card className="border-0 shadow-firm-lg rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#05050A] via-firm-accent to-firm-navy opacity-80" />
        <div className="flex items-center gap-4 mb-8 mt-2">
          <div className="p-3 bg-firm-paper border border-firm-slate/10 rounded-2xl text-firm-navy shadow-sm">
            <Megaphone size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-firm-navy font-serif">Wettbewerbs-Radar (UWG)</h3>
            <p className="text-[15px] text-firm-navy font-medium mt-1 leading-relaxed">
              Prävention von Unterlassungsansprüchen: Prüfung auf Irreführung, Greenwashing & PAngV.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-firm-paper/30 p-2 md:p-4 rounded-2xl border border-firm-slate/5">
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
            {/* DEMO BUTTON */}
            {!text && !file && (
              <DemoLoadButton
                demoFile={{ path: '/test-dummies/07_UWG_Werbetechxt_Greenwashing.md', name: 'Werbetext_Greenwashing.md' }}
                onLoad={async (file) => {
                  const text = await file.text();
                  setMarketingText(text);
                  setMarketingTargetAudience("Verbraucher, gesundheitsbewusste Personen, Abnehmwillige");
                }}
                label="Muster-Werbetext laden"
              />
            )}

            <label className="block text-[10px] font-bold text-firm-slate/50 uppercase tracking-widest mb-2 px-1">
              Kontext / Branche
            </label>
            <div className="space-y-3 flex-1 flex flex-col">
              <textarea
                placeholder="z.B. Nahrungsergänzungsmittel, Mode, Finanzen..."
                className="w-full flex-1 p-4 rounded-xl bg-firm-paper/50 border border-firm-slate/15 text-sm focus:border-firm-accent focus:ring-2 focus:ring-firm-accent/30 text-firm-navy font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all outline-none resize-none"
                value={audience}
                onChange={(e) => setMarketingTargetAudience(e.target.value)}
              />
              <div className="p-4 bg-firm-paper/80 border border-firm-slate/10 rounded-xl text-[13px] text-firm-navy font-medium leading-relaxed shadow-sm mt-auto">
                <strong className="block mb-1.5 text-firm-navy flex items-center gap-1.5 font-bold"><Info size={14} className="text-firm-accent" /> Relevanz:</strong>
                Bei "Health" (HCVO) oder "Finance" gelten strengste Maßstäbe.
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-firm-slate/10 pt-8">
          <label className="block text-[10px] font-bold text-firm-slate/50 uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
            <span className="h-px bg-firm-slate/10 flex-1"></span>
            Oder Werbeaussage direkt eingeben
            <span className="h-px bg-firm-slate/10 flex-1"></span>
          </label>
          <textarea
            className="w-full h-40 p-5 rounded-xl bg-firm-paper/50 border border-firm-slate/15 resize-none focus:ring-2 focus:ring-firm-accent/30 focus:border-firm-accent text-[14px] font-medium leading-relaxed text-firm-navy placeholder-firm-slate/40 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] outline-none"
            placeholder="Beispiel: 'Unser neues Super-Serum heilt alle Hautprobleme und ist 100% klimaneutral produziert...'"
            value={text}
            onChange={(e) => setMarketingText(e.target.value)}
          />
        </div>

      </Card>

      <div className="bg-[#FCFAF4] dark:bg-amber-500/10 border border-amber-400/30 rounded-2xl p-5 flex gap-4 text-[13px] text-amber-900 dark:text-amber-100 shadow-sm mx-auto w-full">
        <Globe className="shrink-0 mt-0.5 text-amber-500" size={20} />
        <div>
          <strong className="block text-amber-800 dark:text-amber-400 font-bold mb-1 font-serif text-[15px]">Erforderliche Datengrundlage (Sorgfaltspflicht):</strong>
          <p className="leading-relaxed opacity-90">
            Für die Prüfung von Faktenbehauptungen ist der Zugriff auf externe Echtzeit-Daten zwingend.
            <strong className="font-bold"> Google Search Grounding</strong> wurde für diesen Vorgang automatisch aktiviert.
          </p>
        </div>
      </div>

      <ContextPanel />

      <div className="mt-8 relative z-10 w-full group">
        <div className="absolute inset-0 bg-firm-accent opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-2xl" />
        <Button fullWidth onClick={handleCheck} disabled={!file && !text.trim()} className="!py-4 text-base tracking-wide shadow-firm-lg relative">
          Auf Abmahnrisiken prüfen
        </Button>
      </div>

      {playbook && (
        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-firm-slate/60 animate-enter bg-firm-card py-2 px-4 rounded-full border border-firm-slate/10 shadow-sm mx-auto w-fit">
          <BookOpen size={14} className="text-firm-accent" />
          <span>Abgleich mit Corporate Wording: <strong className="text-firm-navy">{playbook.name}</strong></span>
        </div>
      )}
    </div>
  );
};

export default MarketingCheck;
