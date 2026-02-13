
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
import { Euro, BookOpen, Copy, Check, ChevronDown, ChevronUp, AlertTriangle, Filter, X } from 'lucide-react';
import { copyRichText } from '../utils/clipboardUtils';

const RiskAssessment: React.FC = () => {
  const { state, setRiskText, setRiskDisputeValue, setRiskAnalysis, setThinking } = useAppContext();
  const { trackUsage } = useTokenContext();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeCell, setActiveCell] = useState<{prob: number, imp: number} | null>(null);
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
        lines.push(`${i+1}. ${rp.category.toUpperCase()} (P:${rp.probability} x I:${rp.impact})`);
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
        ]}/>
        {playbook && <p className="text-xs text-neon-cyan font-mono">+ Playbook wird berücksichtigt</p>}
    </div>
  );

  if (data) {
    return (
      <div className="space-y-6 pb-32 animate-enter">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 font-serif">Risiko-Matrix</h2>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCopyReport} className="!py-2 !px-3 text-xs">
                 {copied ? <Check size={16} /> : <Copy size={16} />}
                 {copied ? 'Kopiert' : 'Bericht kopieren'}
            </Button>
            <Button variant="secondary" onClick={() => { setRiskText(''); setRiskDisputeValue(''); setRiskAnalysis(null); }} className="!py-2 !px-3 text-xs">
                Neu
            </Button>
          </div>
        </div>

        {playbook && (
            <div className="bg-firm-navy/5 border border-firm-navy/10 rounded p-2 flex items-center gap-2 text-sm text-firm-navy">
                <BookOpen size={14} />
                <span>Strategischer Abgleich mit Playbook: <strong>{playbook.name}</strong></span>
            </div>
        )}
        
        <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-none relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-1">Gesamtbewertung</h3>
            <div className="text-3xl font-bold tracking-tight text-white mb-4 font-serif">{data.overallRiskLevel}</div>
            <p className="text-sm text-gray-300 leading-relaxed mb-4">{data.executiveSummary}</p>
            {disputeValue && (
                <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                    <Euro size={14} className="text-yellow-400" />
                    <span className="text-xs font-medium text-white">Streitwertbasis: {disputeValue}</span>
                </div>
            )}
          </div>
        </Card>

        {data.economicImpactAnalysis && (
            <Card>
                <h4 className="text-sm font-bold text-firm-navy mb-2 uppercase tracking-wide">Wirtschaftliche Betrachtung</h4>
                <p className="text-sm text-slate-700">{data.economicImpactAnalysis}</p>
            </Card>
        )}

        <RiskHeatmap 
            points={data.riskPoints} 
            activeCell={activeCell}
            onCellClick={handleCellClick}
        />
        
        <div id="risk-list-start" className="pt-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                 <h3 className="text-sm font-bold text-firm-navy uppercase tracking-widest flex items-center gap-2">
                     <Filter size={14} /> 
                     Detail-Analyse
                 </h3>
                 
                 {activeCell ? (
                     <button 
                        onClick={() => setActiveCell(null)}
                        className="flex items-center gap-1 text-xs bg-firm-navy text-white px-3 py-1 rounded-full hover:bg-slate-700 transition-colors"
                     >
                        <X size={12} />
                        Filter: P{activeCell.prob} / I{activeCell.imp} (Löschen)
                     </button>
                 ) : (
                     <span className="text-xs text-slate-400">Alle Risiken angezeigt</span>
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
    <div className="space-y-6 pb-32 animate-enter">
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-firm-navy rounded-lg text-white">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 font-serif">Risiko-Bewertung</h3>
            <p className="text-sm text-slate-500">Beschreiben Sie das rechtliche oder wirtschaftliche Szenario</p>
          </div>
        </div>
        
        <div className="mb-4">
            <label className="block text-xs font-bold text-firm-navy uppercase tracking-wider mb-1.5">
                Streitwert / Volumen (Optional)
            </label>
            <div className="relative">
                <Euro size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                    type="text"
                    className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-gray-50 border border-slate-200 focus:ring-2 focus:ring-firm-navy/10 focus:border-firm-navy text-sm text-firm-navy"
                    placeholder="z.B. 50.000 €"
                    value={disputeValue}
                    onChange={(e) => setRiskDisputeValue(e.target.value)}
                />
            </div>
            <p className="text-xs text-slate-400 mt-1">Dient zur Einordnung der wirtschaftlichen Tragweite.</p>
        </div>

        <label className="block text-xs font-bold text-firm-navy uppercase tracking-wider mb-1.5 mt-6">
            Details zum Sachverhalt
        </label>
        <textarea
          className="w-full h-40 p-4 rounded-xl bg-gray-50 border border-slate-200 resize-none focus:ring-2 focus:ring-firm-navy/10 focus:border-firm-navy text-sm text-slate-800 placeholder-slate-400 transition-shadow outline-none"
          placeholder="Erläutern Sie den Fall..."
          value={text}
          onChange={(e) => setRiskText(e.target.value)}
        />
      </Card>
      <ContextPanel />
      <div className="mt-8">
        <Button fullWidth onClick={handleAssessment} disabled={!text.trim()}>
          Risikoanalyse generieren
        </Button>
      </div>
      {playbook && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-firm-navy/70">
            <BookOpen size={14} />
            <span>Aktives Playbook: {playbook.name}</span>
        </div>
      )}
    </div>
  );
};

const RiskDetailItem: React.FC<{ risk: RiskPoint }> = ({ risk }) => {
    const [expanded, setExpanded] = useState(true);
    const score = risk.probability * risk.impact;
    let borderClass = 'border-slate-200';
    let bgBadge = 'bg-slate-100 text-slate-600';
    if (score >= 15) { borderClass = 'border-red-200 bg-red-50/30'; bgBadge = 'bg-red-100 text-red-700'; }
    else if (score >= 8) { borderClass = 'border-amber-200 bg-amber-50/30'; bgBadge = 'bg-amber-100 text-amber-700'; }
    else { borderClass = 'border-emerald-200 bg-emerald-50/30'; bgBadge = 'bg-emerald-100 text-emerald-700'; }

    return (
        <div className={`bg-white rounded border overflow-hidden transition-all duration-300 ${borderClass} hover:shadow-sm`}>
             <div className="p-4 flex items-start justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
                 <div className="flex items-start gap-3">
                     <div className={`mt-0.5 px-2 py-1 rounded text-xs font-bold w-12 text-center ${bgBadge}`}>
                         {score}
                     </div>
                     <div>
                         <h4 className="font-bold text-firm-navy text-sm font-serif">{risk.category}</h4>
                         {!expanded && (
                             <p className="text-xs text-slate-500 mt-1 line-clamp-1">{risk.description}</p>
                         )}
                     </div>
                 </div>
                 {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
             </div>
             {expanded && (
                 <div className="px-4 pb-4 pt-0">
                     <div className="pl-[3.25rem]">
                         <p className="text-sm text-slate-700 leading-relaxed">{risk.description}</p>
                         <div className="flex gap-4 mt-3 text-xs text-slate-500 border-t border-slate-100 pt-2">
                             <span>Wahrscheinlichkeit: <strong>{risk.probability}/5</strong></span>
                             <span>Auswirkung: <strong>{risk.impact}/5</strong></span>
                         </div>
                     </div>
                 </div>
             )}
        </div>
    );
};

export default RiskAssessment;
