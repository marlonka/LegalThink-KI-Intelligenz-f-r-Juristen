
import React, { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import RiskHeatmap from '../components/ui/RiskHeatmap';
import ContextPanel from '../components/ui/ContextPanel';
import GroundingSources from '../components/ui/GroundingSources';
import RefinementLoop from '../components/ui/RefinementLoop';
import { generateAnalysis, fileToBase64, FileData } from '../services/geminiService';
import { PROMPTS, MODEL_PRO } from '../constants';
import { RiskAssessmentResponse, RiskPoint } from '../types';
import { RiskAssessmentSchema } from '../schemas';
import { useTokenContext } from '../contexts/TokenContext';
import { useAppContext } from '../contexts/AppContext';
import DemoLoadButton from '../components/ui/DemoLoadButton';
import { Euro, BookOpen, Copy, Check, ChevronDown, ChevronUp, AlertTriangle, Filter, X } from 'lucide-react';
import { copyRichText } from '../utils/clipboardUtils';

const RiskAssessment: React.FC = () => {
  const { state, setRiskText, setRiskDisputeValue, setRiskAnalysis, setThinking } = useAppContext();
  const { trackUsage } = useTokenContext();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeCell, setActiveCell] = useState<{ prob: number, imp: number } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const text = state.riskAssessment.text;
  const disputeValue = state.riskAssessment.disputeValue;
  const data = state.riskAssessment.analysis;
  const metadata = state.riskAssessment.groundingMetadata;
  const playbook = state.playbookFile;

  const runAssessment = async (customPrompt?: string, additionalFiles?: File[]) => {
    if (!text.trim() && !data) return;
    setLoading(true);
    setThinking(true);
    setActiveCell(null);
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
      let enrichedPrompt = "";
      if (customPrompt && data) {
        enrichedPrompt = `
            DU BIST IM "REFINEMENT MODE".
            VORHERIGES JSON ERGEBNIS: ${JSON.stringify(data)}
            NEUE FAKTEN / USER ANWEISUNG: "${customPrompt}"
            AUFGABE: Aktualisiere die Risikomatrix (JSON).
          `;
      } else {
        enrichedPrompt = `
            ${PROMPTS.RISK_ASSESSMENT}
            STREITWERT / WIRTSCHAFTLICHES VOLUMEN: ${disputeValue || 'Nicht angegeben'}
            SACHVERHALT:
            ${text}
          `;
      }
      const response = await generateAnalysis<RiskAssessmentResponse>({
        prompt: enrichedPrompt,
        contextData: contextData,
        additionalFiles: filePayloads,
        referenceUrls: state.referenceUrls,
        useSearch: state.useSearch,
        model: MODEL_PRO,
        responseSchema: RiskAssessmentSchema,
        viewContext: 'RISK'
      });
      setRiskAnalysis(response.data, response.groundingMetadata);
      trackUsage(response.usage);
    } catch (error) {
      alert("Fehler bei der Risikobewertung.");
    } finally {
      setLoading(false);
      setThinking(false);
    }
  };

  const handleAssessment = () => runAssessment();
  const handleRefine = (instruction: string, files: File[]) => runAssessment(instruction, files);

  const handleCopyReport = async () => {
    if (!data) return;
    const lines = [];
    lines.push(`# RISIKOBEWERTUNG`);
    lines.push(`**Gesamteinschätzung:** ${data.overallRiskLevel}`);
    lines.push(`**Streitwert:** ${disputeValue || 'k.A.'}`);
    lines.push(`\n**Executive Summary:**\n${data.executiveSummary}\n`);
    lines.push(`## Risiko-Details`);
    data.riskPoints.forEach((rp, i) => {
      lines.push(`${i + 1}. ${rp.category.toUpperCase()} (P:${rp.probability} x I:${rp.impact})`);
      lines.push(`   - ${rp.description}\n`);
    });
    if (data.economicImpactAnalysis) {
      lines.push(`## Wirtschaftliche Betrachtung`);
      lines.push(data.economicImpactAnalysis);
    }
    const report = lines.join('\n');
    await copyRichText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCellClick = (prob: number, imp: number) => {
    if (activeCell?.prob === prob && activeCell?.imp === imp) {
      setActiveCell(null);
    } else {
      setActiveCell({ prob, imp });
      setTimeout(() => {
        document.getElementById('risk-list-start')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const filteredRisks = data?.riskPoints.filter(rp => {
    if (activeCell) {
      if (Math.round(rp.probability) !== activeCell.prob || Math.round(rp.impact) !== activeCell.imp) {
        return false;
      }
    }
    return true;
  }).sort((a, b) => (b.probability * b.impact) - (a.probability * a.impact));

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col justify-center items-center gap-2">
      <Loader messages={[
        "Analysiere Sachverhalt...",
        state.useSearch ? "Grounding: Suche Präzedenzfälle und Urteile..." : "Kalkuliere Eintrittswahrscheinlichkeit...",
        "Bewerte wirtschaftliches Schadensausmaß...",
        "Erstelle Risikomatrix..."
      ]} />
      {playbook && <p className="text-xs text-neon-cyan font-mono">+ Playbook wird berücksichtigt</p>}
    </div>
  );

  if (data) {
    return (
      <div className="space-y-8 pb-32 animate-enter max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-firm-slate/15 pb-6 gap-4">
          <h2 className="text-2xl font-bold text-firm-navy font-serif tracking-tight">Risiko-Matrix</h2>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleCopyReport} className="!py-2.5 !px-4 text-xs shadow-sm bg-firm-card border-firm-slate/15 hover:border-firm-slate/30">
              {copied ? <Check size={16} className="text-firm-accent" /> : <Copy size={16} />}
              {copied ? 'Kopiert' : 'Bericht kopieren'}
            </Button>
            <Button variant="secondary" onClick={() => { setRiskText(''); setRiskDisputeValue(''); setRiskAnalysis(null); }} className="!py-2.5 !px-4 text-xs bg-firm-paper border-firm-slate/10 hover:bg-firm-accent/10 hover:border-firm-accent/30 hover:text-firm-accent transition-colors">
              Neu Starten
            </Button>
          </div>
        </div>

        {playbook && (
          <div className="bg-firm-paper/50 border border-firm-slate/10 rounded-xl p-3 flex items-center gap-3 text-sm text-firm-navy shadow-sm">
            <BookOpen size={16} className="text-firm-accent shrink-0" />
            <span>Strategischer Abgleich mit Playbook: <strong className="font-bold">{playbook.name}</strong></span>
          </div>
        )}

        <Card className="bg-gradient-to-br from-[#05050A] to-[#1e2a3b] text-white border-0 shadow-firm-lg relative overflow-hidden rounded-3xl p-8">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-firm-accent/20 via-firm-accent to-firm-accent/20"></div>
          <div className="relative z-10">
            <h3 className="text-white/60 text-[10px] uppercase tracking-widest mb-3 font-bold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-firm-accent"></span> Gesamtbewertung
            </h3>
            <div className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-6 font-serif">{data.overallRiskLevel}</div>
            <p className="text-[15px] md:text-[16px] font-medium leading-relaxed max-w-3xl opacity-90">{data.executiveSummary}</p>
            {disputeValue && (
              <div className="inline-flex items-center gap-3 bg-firm-card/5 px-4 py-2 rounded-xl border border-firm-card/10 backdrop-blur-sm">
                <Euro size={16} className="text-firm-accent" />
                <span className="text-[13px] font-bold text-white/90 tracking-wider uppercase">Streitwertbasis: {disputeValue}</span>
              </div>
            )}
          </div>
        </Card>

        {data.economicImpactAnalysis && (
          <div className="bg-firm-card p-6 md:p-8 rounded-3xl shadow-firm border border-firm-slate/10 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-firm-accent/60 group-hover:bg-firm-accent transition-colors duration-300"></div>
            <h4 className="text-[10px] font-bold text-firm-slate/60 mb-3 uppercase tracking-widest flex items-center gap-2">
              Wirtschaftliche Betrachtung
            </h4>
            <p className="text-[14px] md:text-[15px] font-medium leading-relaxed text-firm-navy">{data.economicImpactAnalysis}</p>
          </div>
        )}

        <RiskHeatmap
          points={data.riskPoints}
          activeCell={activeCell}
          onCellClick={handleCellClick}
        />

        <div id="risk-list-start" className="pt-8">
          <div className="flex items-center justify-between border-b border-firm-slate/15 pb-4 mb-6">
            <h3 className="text-[11px] font-bold text-firm-slate/60 uppercase tracking-widest flex items-center gap-2">
              <Filter size={14} className="text-firm-accent" />
              Detail-Analyse
            </h3>

            {activeCell ? (
              <button
                onClick={() => setActiveCell(null)}
                className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider bg-firm-paper text-firm-navy border border-firm-slate/15 px-3 py-1.5 rounded-full hover:bg-firm-card hover:border-firm-slate/30 hover:shadow-sm transition-all"
              >
                <X size={12} className="text-firm-accent" />
                Filter: P{activeCell.prob} / I{activeCell.imp} (Löschen)
              </button>
            ) : (
              <span className="text-[10px] uppercase font-bold tracking-wider text-firm-slate/40">Alle Risiken angezeigt</span>
            )}
          </div>

          <div className="space-y-4 min-h-[200px]">
            {filteredRisks?.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                <p>Keine Risiken für diese Auswahl gefunden.</p>
                <button onClick={() => setActiveCell(null)} className="text-firm-navy underline mt-2 text-sm">Filter zurücksetzen</button>
              </div>
            ) : (
              filteredRisks?.map((risk, idx) => (
                <RiskDetailItem key={idx} risk={risk} />
              ))
            )}
          </div>
        </div>

        <GroundingSources metadata={metadata} />
        <RefinementLoop onRefine={handleRefine} loading={loading} contextType="Risikobewertung" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 animate-enter max-w-5xl mx-auto">
      <Card className="border-0 shadow-firm-lg rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#05050A] via-firm-accent to-firm-navy opacity-80" />
        <div className="flex items-center gap-4 mb-10 mt-2">
          <div className="p-3 bg-firm-paper border border-firm-slate/10 rounded-2xl text-firm-navy shadow-sm">
            <AlertTriangle size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-firm-navy font-serif">Risiko-Bewertung</h3>
            <p className="text-[15px] text-firm-navy font-medium mt-1 leading-relaxed">Beschreiben Sie das rechtliche oder wirtschaftliche Szenario</p>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-[10px] font-bold text-firm-slate/50 uppercase tracking-widest mb-2">
            Streitwert / Volumen (Optional)
          </label>
          <div className="relative group">
            <Euro size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-firm-slate/40 group-focus-within:text-firm-accent transition-colors" />
            <input
              type="text"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-firm-paper/50 border border-firm-slate/15 focus:ring-2 focus:ring-firm-accent/30 focus:border-firm-accent text-sm text-firm-navy font-bold transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
              placeholder="z.B. 50.000 €"
              value={disputeValue}
              onChange={(e) => setRiskDisputeValue(e.target.value)}
            />
          </div>
          <p className="text-[11px] text-firm-slate/50 mt-2 ml-1">Dient zur Einordnung der wirtschaftlichen Tragweite.</p>
        </div>

        <label className="block text-[10px] font-bold text-firm-slate/50 uppercase tracking-widest mb-2 mt-8">
          Details zum Sachverhalt
        </label>
        <textarea
          className="w-full h-48 p-5 rounded-xl bg-firm-paper/50 border border-firm-slate/15 resize-none focus:ring-2 focus:ring-firm-accent/30 focus:border-firm-accent text-[14px] font-medium leading-relaxed text-firm-navy placeholder-firm-slate/40 transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] outline-none"
          placeholder="Erläutern Sie den Fall... (z.B. Verletzung einer Vertraulichkeitsvereinbarung durch einen ehemaligen Mitarbeiter...)"
          value={text}
          onChange={(e) => setRiskText(e.target.value)}
        />

        {/* DEMO BUTTON */}
        {!text && (
          <DemoLoadButton
            demoFile={{ path: '/test-dummies/06_Risiko_Markenrechtsverletzung.md', name: 'Risiko_Markenrechtsverletzung.md' }}
            onLoad={async (file) => {
              const fileText = await file.text();
              setRiskText(fileText);
              setRiskDisputeValue("250.000,00 EUR (Streitwert der Hauptsache gem. Abmahnung)");
            }}
            label="Muster-Sachverhalt laden"
          />
        )}
      </Card>

      <ContextPanel />

      <div className="mt-8 relative z-10 w-full group">
        <div className="absolute inset-0 bg-firm-accent opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-2xl" />
        <Button fullWidth onClick={handleAssessment} disabled={!text.trim()} className="!py-4 text-base tracking-wide shadow-firm-lg relative">
          Risikoanalyse generieren
        </Button>
      </div>

      {playbook && (
        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-firm-slate/60 animate-enter bg-firm-card py-2 px-4 rounded-full border border-firm-slate/10 shadow-sm mx-auto w-fit">
          <BookOpen size={14} className="text-firm-accent" />
          <span>Aktives Playbook: <strong className="text-firm-navy">{playbook.name}</strong></span>
        </div>
      )}
    </div>
  );
};

const RiskDetailItem: React.FC<{ risk: RiskPoint }> = ({ risk }) => {
  const [expanded, setExpanded] = useState(true);
  const score = risk.probability * risk.impact;
  let borderClass = 'border-firm-slate/15 hover:border-firm-slate/30';
  let bgBadge = 'bg-firm-paper border-firm-slate/10 text-firm-navy font-medium';
  if (score >= 15) { borderClass = 'border-red-500/20 bg-[#FCF5F5] dark:bg-red-500/10 dark:border-red-500/20'; bgBadge = 'bg-red-500 text-white border-red-600 shadow-sm'; }
  else if (score >= 8) { borderClass = 'border-amber-400/30 bg-[#FCFAF4] dark:bg-amber-500/10 dark:border-amber-500/20'; bgBadge = 'bg-amber-400 text-amber-900 border-amber-500 shadow-sm'; }
  else { borderClass = 'border-emerald-500/20 bg-[#F4FCF7]'; bgBadge = 'bg-emerald-500 text-white border-emerald-600 shadow-sm'; }

  return (
    <div className={`bg-firm-card rounded-2xl border overflow-hidden transition-all duration-300 ${borderClass} hover:shadow-firm group`}>
      <div className="p-5 flex items-start justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start gap-4">
          <div className={`mt-0.5 px-3 py-1.5 rounded-lg text-xs font-bold w-14 text-center border ${bgBadge}`}>
            {score}
          </div>
          <div className="mt-0.5">
            <h4 className="font-bold text-firm-navy text-[15px] leading-tight">{risk.category}</h4>
            {!expanded && (
              <p className="text-[13px] text-firm-slate/60 mt-1.5 line-clamp-1 flex-1">{risk.description}</p>
            )}
          </div>
        </div>
        <div className={`p-1.5 rounded-full transition-colors ${expanded ? 'bg-firm-paper text-firm-navy' : 'text-firm-slate/40 group-hover:bg-firm-paper'}`}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>
      {expanded && (
        <div className="px-5 pb-6 pt-0">
          <div className="pl-[4.5rem]">
            <p className="text-[14px] font-medium leading-relaxed text-firm-navy/90">{risk.description}</p>
            <div className="flex gap-6 mt-4 text-[10px] text-firm-slate/60 uppercase tracking-widest font-bold border-t border-firm-slate/10 pt-4">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-firm-slate/30"></span> Wahrscheinlichkeit: <strong className="text-firm-navy text-xs">{risk.probability}/5</strong></span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-firm-slate/30"></span> Auswirkung: <strong className="text-firm-navy text-xs">{risk.impact}/5</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskAssessment;
